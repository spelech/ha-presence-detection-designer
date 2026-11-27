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


FLOORPLAN_PX_PER_FOOT: float = 19.0
AVERAGE_WALKING_SPEED_FPS: float = 4.0
MAX_SPRINT_SPEED_FPS: float = 12.0
STAIR_FLIGHT_EQUIV_FEET: float = 18.0
SENSOR_JITTER_ALLOWANCE_SEC: float = 2.5

_FLOOR_STAIR_PORTALS: dict[tuple[str, str], tuple[tuple[float, float], tuple[float, float]]] = {
    ("upstairs", "main"): ((590.0, 420.0), (490.0, 390.0)),
    ("main", "upstairs"): ((490.0, 390.0), (590.0, 420.0)),
    ("main", "basement"): ((535.0, 330.0), (535.0, 420.0)),
    ("basement", "main"): ((535.0, 420.0), (535.0, 330.0)),
}


def _room_center(room_box: dict[str, Any]) -> tuple[float, float]:
    """Return 2D center (cx, cy) of a room box in floorplan pixels."""
    rx = float(room_box.get("x", 0.0))
    ry = float(room_box.get("y", 0.0))
    rw = max(1.0, float(room_box.get("width", 100.0)))
    rh = max(1.0, float(room_box.get("height", 100.0)))
    return rx + rw / 2.0, ry + rh / 2.0


def compute_taxicab_distance(
    room_a: str,
    room_b: str,
    floorplan: dict[str, Any] | None = None,
    px_per_foot: float = FLOORPLAN_PX_PER_FOOT,
) -> dict[str, float | int]:
    """Compute Taxicab (L1) distance in pixels and feet between two rooms across floors."""
    from .floorplan_presets import get_default_floorplan

    if room_a == room_b:
        return {"distance_px": 0.0, "distance_ft": 0.0, "floor_changes": 0}

    fp = (
        floorplan
        if isinstance(floorplan, dict) and floorplan.get("rooms")
        else get_default_floorplan()
    )
    rooms_by_name: dict[str, dict[str, Any]] = {
        str(r.get("name")): r for r in (fp.get("rooms") or []) if r.get("name")
    }
    box_a = rooms_by_name.get(room_a)
    box_b = rooms_by_name.get(room_b)
    scale = max(1.0, float(px_per_foot))

    if not box_a or not box_b:
        default_ft = 20.0
        return {
            "distance_px": round(default_ft * scale, 1),
            "distance_ft": default_ft,
            "floor_changes": 0,
        }

    ax, ay = _room_center(box_a)
    bx, by = _room_center(box_b)
    fl_a = str(box_a.get("floor", "main"))
    fl_b = str(box_b.get("floor", "main"))

    if fl_a == fl_b:
        dist_px = abs(ax - bx) + abs(ay - by)
        return {
            "distance_px": round(dist_px, 1),
            "distance_ft": round(dist_px / scale, 1),
            "floor_changes": 0,
        }

    stair_px = STAIR_FLIGHT_EQUIV_FEET * scale
    if (fl_a, fl_b) in _FLOOR_STAIR_PORTALS:
        (s_ax, s_ay), (s_bx, s_by) = _FLOOR_STAIR_PORTALS[(fl_a, fl_b)]
        dist_px = abs(ax - s_ax) + abs(ay - s_ay) + stair_px + abs(s_bx - bx) + abs(s_by - by)
        floors = 1
    else:
        # 2-floor change (upstairs <-> main <-> basement)
        (u_sx, u_sy), (m1_sx, m1_sy) = _FLOOR_STAIR_PORTALS[("upstairs", "main")]
        (m2_sx, m2_sy), (b_sx, b_sy) = _FLOOR_STAIR_PORTALS[("main", "basement")]
        if fl_a == "upstairs" and fl_b == "basement":
            dist_px = (
                abs(ax - u_sx)
                + abs(ay - u_sy)
                + stair_px
                + abs(m1_sx - m2_sx)
                + abs(m1_sy - m2_sy)
                + stair_px
                + abs(b_sx - bx)
                + abs(b_sy - by)
            )
        else:
            dist_px = (
                abs(ax - b_sx)
                + abs(ay - b_sy)
                + stair_px
                + abs(m2_sx - m1_sx)
                + abs(m2_sy - m1_sy)
                + stair_px
                + abs(u_sx - bx)
                + abs(u_sy - by)
            )
        floors = 2

    return {
        "distance_px": round(dist_px, 1),
        "distance_ft": round(dist_px / scale, 1),
        "floor_changes": floors,
    }


def evaluate_walking_speed_credibility(
    distance_ft: float,
    elapsed_sec: float,
    *,
    is_adjacent: bool = False,
    avg_walking_speed_fps: float = AVERAGE_WALKING_SPEED_FPS,
    max_sprint_speed_fps: float = MAX_SPRINT_SPEED_FPS,
    max_transit_window_sec: float = 90.0,
) -> dict[str, Any]:
    """Evaluate whether a room transition over `distance_ft` in `elapsed_sec` is kinematically credible."""
    dist = max(0.0, float(distance_ft))
    dt = max(0.0, float(elapsed_sec))
    avg_v = max(0.5, float(avg_walking_speed_fps))
    max_v = max(avg_v, float(max_sprint_speed_fps))

    expected_sec = dist / avg_v if dist > 0.0 else 0.0
    min_credible_sec = (
        0.0 if is_adjacent else max(0.0, (dist / max_v) - SENSOR_JITTER_ALLOWANCE_SEC)
    )
    max_credible_sec = max(float(max_transit_window_sec), expected_sec * 3.0 + 30.0)
    implied_speed_fps = round(dist / max(0.5, dt), 2) if dist > 0.0 else 0.0

    if not is_adjacent and dt < min_credible_sec:
        return {
            "is_credible": False,
            "implied_speed_fps": implied_speed_fps,
            "expected_transit_sec": round(expected_sec, 1),
            "min_credible_sec": round(min_credible_sec, 1),
            "max_credible_sec": round(max_credible_sec, 1),
            "credibility_score": 0.0,
            "reason": (
                f"kinematic_speed_exceeded_{implied_speed_fps:.1f}fps_over_{dist:.1f}ft_in_{dt:.1f}s"
            ),
        }

    if not is_adjacent and dt > max_credible_sec:
        return {
            "is_credible": False,
            "implied_speed_fps": implied_speed_fps,
            "expected_transit_sec": round(expected_sec, 1),
            "min_credible_sec": round(min_credible_sec, 1),
            "max_credible_sec": round(max_credible_sec, 1),
            "credibility_score": 0.1,
            "reason": f"transit_window_exceeded_{dt:.1f}s_max_{max_credible_sec:.1f}s",
        }

    # Score peaks at 1.0 near expected walking time, gently decaying for slower lingers
    if dt <= expected_sec + 5.0:
        score = 1.0
    else:
        over_ratio = (dt - expected_sec) / max(10.0, max_credible_sec - expected_sec)
        score = max(0.25, round(1.0 - 0.65 * min(1.0, over_ratio), 2))

    return {
        "is_credible": True,
        "implied_speed_fps": implied_speed_fps,
        "expected_transit_sec": round(expected_sec, 1),
        "min_credible_sec": round(min_credible_sec, 1),
        "max_credible_sec": round(max_credible_sec, 1),
        "credibility_score": score,
        "reason": "credible_walking_kinematics",
    }
