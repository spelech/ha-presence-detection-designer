"""Computer Vision Camera View Alignment & Opening Azimuth Detection Engine.

Analyzes camera snapshots to derive:
1. Z-axis pitch / downward tilt angle and roll from vanishing perspective & horizon lines.
2. Horizontal opening azimuths (angles to physical doorways, archways, and passages).
3. Discrepancy analysis against 2D floorplan camera cones and recommended heading calibration.
"""

from __future__ import annotations

import base64
import io
import math
from typing import Any

from PIL import Image, ImageDraw, ImageFilter


def estimate_horizon_and_pitch(
    image: Image.Image,
    hfov_deg: float = 70.0,
    vfov_deg: float = 55.0,
) -> tuple[int, float, float]:
    """Estimate vanishing horizon line (y-coordinate) and downward tilt/pitch and roll angles.

    Returns:
        tuple[int, float, float]: (horizon_y, tilt_deg, roll_deg)
        tilt_deg is negative for cameras angled downward toward the floor.
    """
    gray = image.convert("L")
    w, h = gray.size

    # Horizontal edge filter (Sobel Y)
    sobel_y = gray.filter(ImageFilter.Kernel((3, 3), [-1, -2, -1, 0, 0, 0, 1, 2, 1], scale=1))

    # Search for dominant horizontal line in the middle 60% of the image (0.2h to 0.8h)
    min_y = max(10, int(0.15 * h))
    max_y = min(h - 10, int(0.85 * h))

    best_row = h // 2
    max_energy = -1.0

    step_x = max(1, w // 160)
    for y in range(min_y, max_y):
        row_energy = sum(sobel_y.getpixel((x, y)) for x in range(0, w, step_x))
        if row_energy > max_energy:
            max_energy = row_energy
            best_row = y

    # Calculate roll by finding the local edge row in left third vs right third
    left_third_w = w // 3
    right_start_x = (2 * w) // 3

    y_search_radius = max(15, h // 20)
    y_start = max(min_y, best_row - y_search_radius)
    y_end = min(max_y, best_row + y_search_radius)

    best_y_left = best_row
    max_left = -1.0
    for y in range(y_start, y_end):
        energy = sum(sobel_y.getpixel((x, y)) for x in range(0, left_third_w, step_x))
        if energy > max_left:
            max_left = energy
            best_y_left = y

    best_y_right = best_row
    max_right = -1.0
    for y in range(y_start, y_end):
        energy = sum(sobel_y.getpixel((x, y)) for x in range(right_start_x, w, step_x))
        if energy > max_right:
            max_right = energy
            best_y_right = y

    dx = right_start_x - (left_third_w // 2)
    dy = best_y_right - best_y_left
    roll_deg = math.degrees(math.atan2(dy, dx)) if dx > 0 else 0.0

    # Pinhole vertical tilt calculation
    # Optical center is h / 2.0. If horizon is above center (best_row < h / 2),
    # camera is tilted downward (negative tilt angle).
    fy = (h / 2.0) / math.tan(math.radians(vfov_deg / 2.0))
    delta_y = best_row - (h / 2.0)
    tilt_deg = math.degrees(math.atan(delta_y / fy))

    return int(best_row), round(tilt_deg, 1), round(roll_deg, 1)


def detect_vertical_openings(
    image: Image.Image,
    hfov_deg: float = 70.0,
) -> list[dict[str, Any]]:
    """Detect vertical doorway / open passage jamb pairs and compute azimuth angles.

    Returns:
        list of dicts containing:
        - center_x, center_y, width, height
        - azimuth_deg (negative is left of lens axis, positive is right)
        - bbox: [x1, y1, x2, y2]
    """
    gray = image.convert("L")
    w, h = gray.size

    # Vertical edge filter (Sobel X)
    sobel_x = gray.filter(ImageFilter.Kernel((3, 3), [-1, 0, 1, -2, 0, 2, -1, 0, 1], scale=1))

    # Column sum of vertical edges in 20% to 90% of image height
    y_start = int(0.20 * h)
    y_end = int(0.90 * h)
    step_y = max(1, (y_end - y_start) // 100)

    col_energy = [
        sum(sobel_x.getpixel((x, y)) for y in range(y_start, y_end, step_y)) for x in range(w)
    ]

    max_col = max(col_energy) if col_energy else 0
    if max_col == 0:
        return []

    # Identify local peaks representing vertical edges (jambs)
    threshold = max_col * 0.35
    peaks: list[int] = []
    min_separation = max(10, int(w * 0.03))

    for x in range(2, w - 2):
        if (
            col_energy[x] > threshold
            and col_energy[x] >= col_energy[x - 1]
            and col_energy[x] >= col_energy[x + 1]
        ):
            if not peaks or (x - peaks[-1] >= min_separation):
                peaks.append(x)
            elif col_energy[x] > col_energy[peaks[-1]]:
                peaks[-1] = x

    # Pair consecutive peaks into potential openings (doors/archways)
    # Expected doorway width: 4% to 40% of image width
    min_door_w = int(w * 0.04)
    max_door_w = int(w * 0.45)
    fx = (w / 2.0) / math.tan(math.radians(hfov_deg / 2.0))

    openings: list[dict[str, Any]] = []
    i = 0
    while i < len(peaks) - 1:
        x1 = peaks[i]
        x2 = peaks[i + 1]
        door_w = x2 - x1

        if min_door_w <= door_w <= max_door_w:
            center_x = (x1 + x2) / 2.0

            # Scan vertical extent of opening
            door_top = y_start
            door_bottom = y_end
            door_h = door_bottom - door_top
            center_y = (door_top + door_bottom) / 2.0

            # Azimuth calculation: positive is to the right of lens axis
            azimuth_deg = math.degrees(math.atan((center_x - (w / 2.0)) / fx))

            openings.append(
                {
                    "center_x": round(center_x, 1),
                    "center_y": round(center_y, 1),
                    "width": int(door_w),
                    "height": int(door_h),
                    "azimuth_deg": round(azimuth_deg, 1),
                    "bbox": [x1, door_top, x2, door_bottom],
                }
            )
            i += 2  # Move past both jambs
        else:
            i += 1

    return openings


def match_openings_to_floorplan(
    detected: list[dict[str, Any]],
    cam_dict: dict[str, Any],
    room_box: dict[str, Any],
    entryways: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], float]:
    """Match detected visual openings with candidate 2D floorplan entryways.

    Computes expected azimuth angles from the camera coordinate to each doorway center,
    determines angular discrepancies, and calculates the recommended heading.

    Returns:
        tuple[list[dict[str, Any]], float]: (matched_openings, recommended_heading_deg)
    """
    cam_x = float(cam_dict.get("x", 0))
    cam_y = float(cam_dict.get("y", 0))
    heading = float(cam_dict.get("heading_deg", 0))

    room_x = float(room_box.get("x", 0))
    room_y = float(room_box.get("y", 0))
    room_w = float(room_box.get("width", 100))
    room_h = float(room_box.get("height", 100))

    # Calculate 2D floorplan coordinate and bearing ray for each candidate entryway
    candidates: list[dict[str, Any]] = []
    for ew in entryways:
        wall = ew.get("wall", "left")
        offset = float(ew.get("offset", 0))
        ew_width = float(ew.get("width", 50))

        if wall == "left":
            door_x = room_x
            door_y = room_y + offset + (ew_width / 2.0)
        elif wall == "right":
            door_x = room_x + room_w
            door_y = room_y + offset + (ew_width / 2.0)
        elif wall == "top":
            door_x = room_x + offset + (ew_width / 2.0)
            door_y = room_y
        elif wall == "bottom":
            door_x = room_x + offset + (ew_width / 2.0)
            door_y = room_y + room_h
        else:
            door_x = room_x + (room_w / 2.0)
            door_y = room_y + (room_h / 2.0)

        # Vector from camera to doorway
        dx = door_x - cam_x
        dy = door_y - cam_y
        bearing_deg = (math.degrees(math.atan2(dy, dx)) + 360) % 360

        # Expected azimuth relative to camera heading:
        # positive is right of optical axis, negative is left
        expected_azimuth = ((bearing_deg - heading + 540) % 360) - 180

        candidates.append(
            {
                "id": ew.get("id"),
                "target_room": ew.get("target_room") or ew.get("id"),
                "type": ew.get("type", "open_passage"),
                "door_x": door_x,
                "door_y": door_y,
                "bearing_deg": round(bearing_deg, 1),
                "expected_azimuth_deg": round(expected_azimuth, 1),
            }
        )

    matched: list[dict[str, Any]] = []
    discrepancies: list[float] = []

    # Match each detected opening to the nearest candidate entryway
    used_candidate_ids: set[str] = set()
    for det in detected:
        det_azimuth = det["azimuth_deg"]
        best_cand: dict[str, Any] | None = None
        best_diff = 999.0

        for cand in candidates:
            cand_id = cand["id"]
            if cand_id in used_candidate_ids:
                continue
            diff = abs(det_azimuth - cand["expected_azimuth_deg"])
            if diff < best_diff:
                best_diff = diff
                best_cand = cand

        if best_cand is not None:
            used_candidate_ids.add(best_cand["id"])
            exp_az = best_cand["expected_azimuth_deg"]
            # Discrepancy: detected minus expected
            discrepancy = round(det_azimuth - exp_az, 1)
            discrepancies.append(discrepancy)

            matched_item = dict(det)
            matched_item.update(
                {
                    "entryway_id": best_cand["id"],
                    "target_room": best_cand["target_room"],
                    "bearing_deg": best_cand["bearing_deg"],
                    "expected_azimuth_deg": exp_az,
                    "discrepancy_deg": discrepancy,
                }
            )
            matched.append(matched_item)
        else:
            matched.append(dict(det))

    # Calculate recommended heading:
    # If detected is further right than expected (discrepancy > 0), the actual camera
    # is pointing further left, so recommended_heading = heading - discrepancy
    if discrepancies:
        avg_discrepancy = sum(discrepancies) / len(discrepancies)
        recommended_heading = round((heading - avg_discrepancy + 360) % 360, 1)
    else:
        recommended_heading = round(heading, 1)

    return matched, recommended_heading


def generate_annotated_image(
    image: Image.Image,
    horizon_y: int,
    detected_openings: list[dict[str, Any]],
    matched_openings: list[dict[str, Any]],
    tilt_deg: float,
    roll_deg: float,
) -> str:
    """Generate an annotated JPEG representation with visual HUD overlays."""
    annotated = image.copy().convert("RGB")
    draw = ImageDraw.Draw(annotated)
    w, h = annotated.size

    # 1. Vanishing horizon line (cyan dashed / solid line)
    draw.line([0, horizon_y, w, horizon_y], fill=(0, 220, 255), width=2)
    draw.text(
        (15, max(5, horizon_y - 18)),
        f"Horizon (Tilt: {tilt_deg:+.1f}°, Roll: {roll_deg:+.1f}°)",
        fill=(0, 220, 255),
    )

    # 2. Camera lens center vertical axis (white dotted line)
    cx = w // 2
    draw.line([cx, 0, cx, h], fill=(200, 200, 200), width=1)

    # 3. Highlight detected & matched openings
    for item in matched_openings:
        bbox = item.get("bbox")
        if not bbox:
            continue
        x1, y1, x2, y2 = bbox
        az = item.get("azimuth_deg", 0.0)
        target = item.get("target_room")
        disc = item.get("discrepancy_deg")

        # Amber / Green bounding box
        color = (40, 220, 120) if target else (255, 170, 0)
        draw.rectangle([x1, y1, x2, y2], outline=color, width=3)

        label = f"{target} ({az:+.1f}°)" if target else f"Opening ({az:+.1f}°)"
        if disc is not None:
            label += f" [Δ:{disc:+.1f}°]"

        text_y = max(10, y1 - 18)
        draw.rectangle([x1, text_y, x1 + len(label) * 7 + 10, text_y + 16], fill=(20, 20, 30))
        draw.text((x1 + 4, text_y + 1), label, fill=color)

    # Encode to Base64 JPEG data URL
    buf = io.BytesIO()
    annotated.save(buf, format="JPEG", quality=85)
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    return f"data:image/jpeg;base64,{b64}"


def analyze_camera_view_alignment(
    image_bytes: bytes,
    cam_dict: dict[str, Any],
    entryways: list[dict[str, Any]],
    room_box: dict[str, Any],
) -> dict[str, Any]:
    """Execute complete computer vision perspective and opening alignment analysis."""
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    hfov_deg = float(cam_dict.get("fov_deg", 70.0))
    # Approximate vertical FOV from aspect ratio
    w, h = image.size
    vfov_deg = math.degrees(2.0 * math.atan((h / w) * math.tan(math.radians(hfov_deg / 2.0))))

    horizon_y, tilt_deg, roll_deg = estimate_horizon_and_pitch(image, hfov_deg, vfov_deg)
    detected = detect_vertical_openings(image, hfov_deg)
    matched, rec_heading = match_openings_to_floorplan(detected, cam_dict, room_box, entryways)

    annotated_uri = generate_annotated_image(
        image,
        horizon_y,
        detected,
        matched,
        tilt_deg,
        roll_deg,
    )

    return {
        "success": True,
        "camera_id": cam_dict.get("id"),
        "horizon_y": horizon_y,
        "tilt_deg": tilt_deg,
        "roll_deg": roll_deg,
        "current_heading_deg": float(cam_dict.get("heading_deg", 0)),
        "recommended_heading_deg": rec_heading,
        "openings": matched,
        "annotated_image": annotated_uri,
    }
