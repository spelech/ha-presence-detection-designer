"""2D spatial geometry primitives for camera cones, wall occlusion, and room overlap."""

from __future__ import annotations

import math
from typing import Any

from .floorplan_presets import DEVICE_MODEL_PRESETS


def _normalize_angle_diff(angle_a: float, angle_b: float) -> float:
    """Return smallest absolute angle difference in degrees [0, 180]."""
    diff = (angle_a - angle_b + 180.0) % 360.0 - 180.0
    return abs(diff)


def point_in_cone(
    px: float,
    py: float,
    cx: float,
    cy: float,
    heading_deg: float,
    fov_deg: float,
    range_px: float,
) -> bool:
    """Return True if point (px, py) lies inside circular sector (cx, cy, heading_deg, fov_deg, range_px)."""
    dx = px - cx
    dy = py - cy
    dist = math.hypot(dx, dy)
    if dist > range_px:
        return False
    if dist < 1e-3:
        return True
    angle_deg = math.degrees(math.atan2(dy, dx)) % 360.0
    half_fov = max(1.0, float(fov_deg)) / 2.0
    return _normalize_angle_diff(angle_deg, float(heading_deg) % 360.0) <= half_fov


def extract_floor_wall_segments(
    rooms: list[dict[str, Any]],
) -> list[tuple[tuple[float, float], tuple[float, float]]]:
    """Extract solid 2D wall line segments for a list of rooms by subtracting doorway intervals."""
    solid_segments: list[tuple[tuple[float, float], tuple[float, float]]] = []
    for r in rooms:
        rx = float(r.get("x", 0))
        ry = float(r.get("y", 0))
        rw = max(1.0, float(r.get("width", 100)))
        rh = max(1.0, float(r.get("height", 100)))
        entryways = list(r.get("entryways", []) or [])

        walls: dict[str, tuple[float, tuple[tuple[float, float], tuple[float, float]]]] = {
            "top": (rw, ((rx, ry), (rx + rw, ry))),
            "bottom": (rw, ((rx, ry + rh), (rx + rw, ry + rh))),
            "left": (rh, ((rx, ry), (rx, ry + rh))),
            "right": (rh, ((rx + rw, ry), (rx + rw, ry + rh))),
        }

        for wall_name, (length, ((x1, y1), (_x2, _y2))) in walls.items():
            wall_openings: list[tuple[float, float]] = []
            for ew in entryways:
                if ew.get("wall") == wall_name:
                    offset = max(0.0, float(ew.get("offset", 0)))
                    width = max(1.0, float(ew.get("width", 36)))
                    start = max(0.0, min(length, offset))
                    end = max(0.0, min(length, offset + width))
                    if start < end:
                        wall_openings.append((start, end))

            wall_openings.sort()
            merged: list[tuple[float, float]] = []
            for start, end in wall_openings:
                if merged and merged[-1][1] >= start:
                    merged[-1] = (merged[-1][0], max(merged[-1][1], end))
                else:
                    merged.append((start, end))

            cur = 0.0
            for start, end in merged:
                if start > cur + 1e-3:
                    if wall_name in ("top", "bottom"):
                        solid_segments.append(
                            ((round(rx + cur, 2), y1), (round(rx + start, 2), y1))
                        )
                    else:
                        solid_segments.append(
                            ((x1, round(ry + cur, 2)), (x1, round(ry + start, 2)))
                        )
                cur = max(cur, end)
            if cur < length - 1e-3:
                if wall_name in ("top", "bottom"):
                    solid_segments.append(((round(rx + cur, 2), y1), (round(rx + length, 2), y1)))
                else:
                    solid_segments.append(((x1, round(ry + cur, 2)), (x1, round(ry + length, 2))))
    return solid_segments


def ray_segment_intersection(
    ox: float,
    oy: float,
    dx: float,
    dy: float,
    x1: float,
    y1: float,
    x2: float,
    y2: float,
) -> float | None:
    """Intersect 2D ray (ox, oy) + t*(dx, dy) with line segment (x1, y1)-(x2, y2). Return t if hit, else None."""
    vx = x2 - x1
    vy = y2 - y1
    denom = dx * vy - dy * vx
    if abs(denom) < 1e-9:
        return None
    wx = x1 - ox
    wy = y1 - oy
    t = (wx * vy - wy * vx) / denom
    u = (wx * dy - wy * dx) / denom
    if t > 1e-4 and -1e-5 <= u <= 1.00001:
        return t
    return None


def line_segment_intersects_solid_wall(
    x1: float,
    y1: float,
    x2: float,
    y2: float,
    solid_segments: list[tuple[tuple[float, float], tuple[float, float]]],
    eps: float = 1e-3,
) -> bool:
    """Return True if line segment (x1, y1)-(x2, y2) intersects any solid wall segment."""
    dx = x2 - x1
    dy = y2 - y1
    for (sx1, sy1), (sx2, sy2) in solid_segments:
        vx = sx2 - sx1
        vy = sy2 - sy1
        denom = dx * vy - dy * vx
        if abs(denom) < 1e-9:
            continue
        wx = sx1 - x1
        wy = sy1 - y1
        t = (wx * vy - wy * vx) / denom
        u = (wx * dy - wy * dx) / denom
        if eps <= t <= (1.0 - eps) and -1e-5 <= u <= 1.00001:
            return True
    return False


def compute_camera_visibility_polygon(
    cam: dict[str, Any],
    solid_segments: list[tuple[tuple[float, float], tuple[float, float]]],
    step_deg: float = 1.5,
) -> list[tuple[float, float]]:
    """Compute 2D visibility polygon vertices for camera/PIR origin occluded by solid wall segments."""
    cx = float(cam.get("x", 0))
    cy = float(cam.get("y", 0))
    heading = float(cam.get("heading_deg", 0))
    fov = max(5.0, min(360.0, float(cam.get("fov_deg", 90))))
    reach = max(10.0, float(cam.get("range_px", 200)))

    preset = DEVICE_MODEL_PRESETS.get(str(cam.get("model_preset") or "")) or {}
    inner_fov = float(cam.get("inner_fov_deg") or preset.get("inner_fov_deg") or 0.0)
    inner_reach = float(cam.get("inner_range_px") or preset.get("inner_range_px") or 0.0)
    has_dual_lobe = 0.0 < inner_fov < fov and inner_reach > reach
    max_reach = max(reach, inner_reach) if has_dual_lobe else reach

    start_deg = heading - fov / 2.0
    end_deg = heading + fov / 2.0

    angles: set[float] = set()
    num_steps = max(8, int(math.ceil(fov / step_deg)))
    for i in range(num_steps + 1):
        angles.add(round(start_deg + (i / num_steps) * fov, 4))

    if has_dual_lobe:
        lobe_left = heading - inner_fov / 2.0
        lobe_right = heading + inner_fov / 2.0
        for edge_deg in (lobe_left, lobe_right):
            angles.add(round(edge_deg - 0.05, 4))
            angles.add(round(edge_deg, 4))
            angles.add(round(edge_deg + 0.05, 4))

    for (x1, y1), (x2, y2) in solid_segments:
        for px, py in ((x1, y1), (x2, y2)):
            dx = px - cx
            dy = py - cy
            dist = math.hypot(dx, dy)
            if dist < 1e-3 or dist > max_reach * 1.5:
                continue
            deg = math.degrees(math.atan2(dy, dx))
            diff = (deg - heading + 180.0) % 360.0 - 180.0
            cand_deg = heading + diff
            if start_deg <= cand_deg <= end_deg:
                angles.add(round(cand_deg - 0.02, 4))
                angles.add(round(cand_deg, 4))
                angles.add(round(cand_deg + 0.02, 4))

    sorted_angles = sorted(angles)
    points: list[tuple[float, float]] = []
    for deg in sorted_angles:
        rad = math.radians(deg)
        dx = math.cos(rad)
        dy = math.sin(rad)
        ray_reach = (
            inner_reach
            if (has_dual_lobe and abs(deg - heading) <= (inner_fov / 2.0) + 1e-3)
            else reach
        )
        min_t = ray_reach
        for (x1, y1), (x2, y2) in solid_segments:
            t = ray_segment_intersection(cx, cy, dx, dy, x1, y1, x2, y2)
            if t is not None and t < min_t:
                min_t = t
        points.append((round(cx + min_t * dx, 2), round(cy + min_t * dy, 2)))

    return [(round(cx, 2), round(cy, 2)), *points]


def compute_cone_room_overlap_pct(
    cam: dict[str, Any],
    room_box: dict[str, Any],
    grid_steps: int = 10,
    solid_segments: list[tuple[tuple[float, float], tuple[float, float]]] | None = None,
) -> float:
    """Compute percentage (0..100) of `room_box` area covered by `cam`'s 2D view cone on the same floor."""
    if cam.get("floor") != room_box.get("floor"):
        return 0.0
    rx = float(room_box.get("x", 0))
    ry = float(room_box.get("y", 0))
    rw = max(1.0, float(room_box.get("width", 100)))
    rh = max(1.0, float(room_box.get("height", 100)))

    cx = float(cam.get("x", 0))
    cy = float(cam.get("y", 0))
    heading = float(cam.get("heading_deg", 0))
    fov = float(cam.get("fov_deg", 90))
    reach = float(cam.get("range_px", 300))

    preset = DEVICE_MODEL_PRESETS.get(str(cam.get("model_preset") or "")) or {}
    inner_fov = float(cam.get("inner_fov_deg") or preset.get("inner_fov_deg") or 0.0)
    inner_reach = float(cam.get("inner_range_px") or preset.get("inner_range_px") or 0.0)
    has_dual_lobe = 0.0 < inner_fov < fov and inner_reach > reach

    hits = 0
    total = grid_steps * grid_steps
    for ix in range(grid_steps):
        px = rx + (ix + 0.5) * (rw / grid_steps)
        for iy in range(grid_steps):
            py = ry + (iy + 0.5) * (rh / grid_steps)
            in_cone = point_in_cone(px, py, cx, cy, heading, fov, reach) or (
                has_dual_lobe and point_in_cone(px, py, cx, cy, heading, inner_fov, inner_reach)
            )
            if in_cone:
                if solid_segments is not None:
                    if not line_segment_intersects_solid_wall(cx, cy, px, py, solid_segments):
                        hits += 1
                else:
                    hits += 1
    return round((hits / float(total)) * 100.0, 1)


def _boxes_overlap_2d(box_a: dict[str, Any], box_b: dict[str, Any]) -> float:
    """Return 2D intersection area ratio (0..1) of two room boxes regardless of floor."""
    ax1, ay1 = float(box_a.get("x", 0)), float(box_a.get("y", 0))
    ax2, ay2 = ax1 + float(box_a.get("width", 0)), ay1 + float(box_a.get("height", 0))
    bx1, by1 = float(box_b.get("x", 0)), float(box_b.get("y", 0))
    bx2, by2 = bx1 + float(box_b.get("width", 0)), by1 + float(box_b.get("height", 0))

    ix = max(0.0, min(ax2, bx2) - max(ax1, bx1))
    iy = max(0.0, min(ay2, by2) - max(ay1, by1))
    inter = ix * iy
    if inter <= 0:
        return 0.0
    min_area = max(
        1.0,
        min(
            float(box_a.get("width", 1)) * float(box_a.get("height", 1)),
            float(box_b.get("width", 1)) * float(box_b.get("height", 1)),
        ),
    )
    return round(inter / min_area, 2)
