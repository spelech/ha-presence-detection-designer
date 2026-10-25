"""Tests for Computer Vision Camera View Alignment & Opening Azimuth Detection."""

from __future__ import annotations

import io
from typing import Any

from PIL import Image, ImageDraw

from custom_components.presence_detection_designer.camera_alignment_cv import (
    analyze_camera_view_alignment,
    detect_vertical_openings,
    estimate_horizon_and_pitch,
    match_openings_to_floorplan,
)


def create_synthetic_room_snapshot(
    width: int = 640,
    height: int = 480,
    horizon_y: int = 180,
    door_positions: list[tuple[int, int]] | None = None,
) -> bytes:
    """Generate a clean synthetic room perspective image with known horizon and doorways."""
    img = Image.new("RGB", (width, height), color=(240, 240, 245))
    draw = ImageDraw.Draw(img)

    # Floor baseboard / floor plane below horizon
    draw.rectangle([0, horizon_y, width, height], fill=(220, 220, 225))
    # Prominent horizon / wall-floor intersection line
    draw.line([0, horizon_y, width, horizon_y], fill=(40, 40, 40), width=3)

    # Ceiling line converging toward center
    draw.line([0, 40, width // 2, horizon_y], fill=(50, 50, 50), width=2)
    draw.line([width, 40, width // 2, horizon_y], fill=(50, 50, 50), width=2)

    # Doorways: default to two vertical dark rectangular frames
    doors = door_positions or [(160, 220), (420, 480)]
    for x1, x2 in doors:
        door_top = horizon_y - 80
        door_bottom = height - 20
        # Dark door jambs & interior opening
        draw.rectangle(
            [x1, door_top, x2, door_bottom], fill=(60, 60, 70), outline=(20, 20, 20), width=3
        )

    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()


def test_estimate_horizon_and_pitch():
    """Verify calculation of vanishing horizon and downward tilt angle."""
    img_bytes = create_synthetic_room_snapshot(width=640, height=480, horizon_y=190)
    image = Image.open(io.BytesIO(img_bytes)).convert("RGB")

    horizon_y, tilt_deg, roll_deg = estimate_horizon_and_pitch(image, hfov_deg=70.0, vfov_deg=55.0)

    # Center of 480 is 240. Horizon at 190 means camera is tilted downward (horizon is above image center)
    assert 160 <= horizon_y <= 220
    assert -30.0 <= tilt_deg <= -5.0
    assert abs(roll_deg) < 5.0


def test_detect_vertical_openings():
    """Verify identification of doorway openings and azimuth calculation."""
    # Doorways centered around x=190 (left) and x=450 (right) in a 640px wide image
    img_bytes = create_synthetic_room_snapshot(
        width=640, height=480, door_positions=[(160, 220), (420, 480)]
    )
    image = Image.open(io.BytesIO(img_bytes)).convert("RGB")

    openings = detect_vertical_openings(image, hfov_deg=70.0)
    assert len(openings) >= 1

    # In a 640-wide image with HFOV 70°, center is 320.
    # Left opening (x~190) should have negative azimuth (left of center)
    left_doors = [d for d in openings if d["azimuth_deg"] < 0]
    assert len(left_doors) >= 1
    assert -25.0 <= left_doors[0]["azimuth_deg"] <= -5.0


def test_match_openings_to_floorplan_and_recommendation():
    """Verify matching detected openings with 2D floorplan geometry."""
    cam_dict: dict[str, Any] = {
        "id": "camera.living_room",
        "name": "Living Room Camera",
        "x": 175,
        "y": 530,
        "heading_deg": 18.0,
        "fov_deg": 65.0,
        "range_px": 350,
    }
    room_box: dict[str, Any] = {
        "name": "Living Room",
        "x": 160,
        "y": 325,
        "width": 235,
        "height": 220,
    }
    entryways: list[dict[str, Any]] = [
        {
            "id": "arch_lr_entry",
            "wall": "right",
            "offset": 30,
            "width": 130,
            "type": "open_passage",
            "target_room": "Front Entry",
        },
        {
            "id": "arch_lr_dr",
            "wall": "top",
            "offset": 20,
            "width": 120,
            "type": "open_passage",
            "target_room": "Dining Room",
        },
    ]

    detected = [
        {
            "center_x": 420,
            "center_y": 250,
            "width": 60,
            "height": 200,
            "azimuth_deg": 10.5,
            "bbox": [390, 150, 450, 350],
        }
    ]

    matched, rec_heading = match_openings_to_floorplan(detected, cam_dict, room_box, entryways)
    assert len(matched) >= 1
    # Matched opening should have expected_azimuth and discrepancy
    assert "expected_azimuth_deg" in matched[0]
    assert "discrepancy_deg" in matched[0]
    assert 0 <= rec_heading < 360


def test_analyze_camera_view_alignment_end_to_end():
    """Verify full end-to-end alignment analysis pipeline."""
    img_bytes = create_synthetic_room_snapshot(width=640, height=480, horizon_y=190)
    cam_dict: dict[str, Any] = {
        "id": "camera.living_room",
        "name": "Living Room Camera",
        "x": 175,
        "y": 530,
        "heading_deg": 18.0,
        "fov_deg": 65.0,
        "range_px": 350,
    }
    room_box: dict[str, Any] = {
        "name": "Living Room",
        "x": 160,
        "y": 325,
        "width": 235,
        "height": 220,
    }
    entryways: list[dict[str, Any]] = [
        {
            "id": "arch_lr_entry",
            "wall": "right",
            "offset": 30,
            "width": 130,
            "type": "open_passage",
            "target_room": "Front Entry",
        }
    ]

    result = analyze_camera_view_alignment(img_bytes, cam_dict, entryways, room_box)

    assert result["success"] is True
    assert "tilt_deg" in result
    assert "roll_deg" in result
    assert "current_heading_deg" in result
    assert "recommended_heading_deg" in result
    assert "openings" in result
    assert "annotated_image" in result
    assert result["annotated_image"].startswith("data:image/jpeg;base64,")
