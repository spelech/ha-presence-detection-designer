"""2D Spatial Floorplan, Camera View Cone & Logical Room Linkage Compiler."""

from __future__ import annotations

import copy
import math
from typing import Any

from ..const import (
    Mode,
)
from .floorplan_presets import (
    DEFAULT_HOUSE_FLOORPLAN,
    DEVICE_MODEL_PRESETS,
    RECOMMENDED_INACTIVITY_TIMEOUTS,
    SPILLOVER_CAMERA_ENTITIES,
    get_default_floorplan,
)
from .spatial_geometry import (
    _boxes_overlap_2d,
    _normalize_angle_diff,
    compute_camera_visibility_polygon,
    compute_cone_room_overlap_pct,
    extract_floor_wall_segments,
    line_segment_intersects_solid_wall,
    point_in_cone,
    ray_segment_intersection,
)
from .topology_rule_applier import apply_compiled_topology_to_config

__all__ = [
    "DEFAULT_HOUSE_FLOORPLAN",
    "DEVICE_MODEL_PRESETS",
    "RECOMMENDED_INACTIVITY_TIMEOUTS",
    "SPILLOVER_CAMERA_ENTITIES",
    "compute_pir_spillover_matrix",
    "_boxes_overlap_2d",
    "_normalize_angle_diff",
    "apply_compiled_topology_to_config",
    "compile_floorplan_topology",
    "compute_camera_visibility_polygon",
    "compute_cone_room_overlap_pct",
    "extract_floor_wall_segments",
    "get_default_floorplan",
    "line_segment_intersects_solid_wall",
    "point_in_cone",
    "ray_segment_intersection",
]


from .spatial_topology_analysis import (
    _build_spatial_ambiguities,
    compute_pir_spillover_matrix,
)


def compile_floorplan_topology(
    floorplan: dict[str, Any] | None = None,
    room_configs: dict[str, dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Compile a 2D floorplan + camera view cones into logical room linkages, coverage, and ambiguities."""
    fp = (
        floorplan
        if isinstance(floorplan, dict) and floorplan.get("rooms")
        else get_default_floorplan()
    )
    rooms_list: list[dict[str, Any]] = list(fp.get("rooms", []) or [])
    connections_list: list[dict[str, Any]] = list(fp.get("connections", []) or [])
    cameras_list: list[dict[str, Any]] = list(fp.get("cameras", []) or [])
    sensors_list: list[dict[str, Any]] = list(fp.get("sensors", []) or [])
    ble_proxies_list: list[dict[str, Any]] = list(fp.get("ble_proxies", []) or [])

    rooms_by_name: dict[str, dict[str, Any]] = {
        str(r.get("name")): r for r in rooms_list if r.get("name")
    }
    transit_rooms: set[str] = {
        str(r.get("name")) for r in rooms_list if r.get("room_type") == "transit" and r.get("name")
    }

    raw_adj: dict[str, set[str]] = {name: set() for name in rooms_by_name}
    room_connections: dict[str, list[dict[str, Any]]] = {name: [] for name in rooms_by_name}

    for conn in connections_list:
        a = str(conn.get("from_room", ""))
        b = str(conn.get("to_room", ""))
        if not a or not b:
            continue
        raw_adj.setdefault(a, set()).add(b)
        raw_adj.setdefault(b, set()).add(a)
        room_connections.setdefault(a, []).append(conn)
        room_connections.setdefault(b, []).append(conn)

    connected_rooms_map: dict[str, list[str]] = {}
    for r_name, r_obj in rooms_by_name.items():
        if r_obj.get("room_type") == "transit":
            continue
        linked: set[str] = set()
        for neighbor in raw_adj.get(r_name, set()):
            if neighbor in transit_rooms:
                for hop2 in raw_adj.get(neighbor, set()):
                    if hop2 != r_name and hop2 not in transit_rooms:
                        linked.add(hop2)
            else:
                linked.add(neighbor)
        connected_rooms_map[r_name] = sorted(linked)

    seal_analysis: dict[str, dict[str, Any]] = {}
    for r_name, r_obj in rooms_by_name.items():
        if r_obj.get("room_type") == "transit":
            continue
        conns = room_connections.get(r_name, [])
        unsealed_exits: list[str] = []
        monitored_doors: list[str] = []
        for c in conns:
            ctype = str(c.get("type", "open_passage"))
            other = c.get("to_room") if c.get("from_room") == r_name else c.get("from_room")
            if ctype == "sensor_door" and c.get("entity_id"):
                monitored_doors.append(str(c["entity_id"]))
            else:
                unsealed_exits.append(f"{other} ({ctype.replace('_', ' ')})")
        can_seal = bool(monitored_doors) and len(unsealed_exits) == 0
        seal_analysis[r_name] = {
            "can_be_bounded": can_seal,
            "recommended_mode": str(Mode.BOUNDED if can_seal else Mode.OPEN),
            "monitored_doors": sorted(set(monitored_doors)),
            "unsealed_exits": unsealed_exits,
        }

    floor_segments: dict[str, list[tuple[tuple[float, float], tuple[float, float]]]] = {}
    explicit_wall_segs = fp.get("floor_wall_segments") or {}
    default_rooms_by_fl: dict[str, list[tuple[Any, ...]]] = {}
    for dr in DEFAULT_HOUSE_FLOORPLAN.get("rooms", []):
        default_rooms_by_fl.setdefault(str(dr.get("floor", "")), []).append(
            (dr.get("name"), dr.get("x"), dr.get("y"), dr.get("width"), dr.get("height"))
        )
    for fl in fp.get("floors", []) or []:
        fl_id = str(fl.get("id", ""))
        rooms_on_fl = [r for r in rooms_list if str(r.get("floor", "")) == fl_id]
        cur_sig = [
            (r.get("name"), r.get("x"), r.get("y"), r.get("width"), r.get("height"))
            for r in rooms_on_fl
        ]
        if fl_id in explicit_wall_segs and cur_sig == default_rooms_by_fl.get(fl_id):
            floor_segments[fl_id] = [
                ((float(s[0][0]), float(s[0][1])), (float(s[1][0]), float(s[1][1])))
                for s in explicit_wall_segs[fl_id]
            ]
        else:
            floor_segments[fl_id] = extract_floor_wall_segments(rooms_on_fl)

    room_coverage: dict[str, dict[str, Any]] = {
        name: {
            "primary_cameras": [],
            "spillover_cameras": [],
            "pir_sensors": [],
            "sub_zones": [],
            "ble_proxies": [],
            "max_coverage_pct": 0.0,
            "uncovered_pct": 100.0,
        }
        for name in rooms_by_name
    }
    camera_analysis: list[dict[str, Any]] = []
    sub_zone_analysis: list[dict[str, Any]] = []

    for cam in cameras_list:
        cam_id = str(cam.get("id", ""))
        host_room = str(cam.get("host_room", ""))
        cam_fl = str(cam.get("floor", ""))
        segments = floor_segments.get(cam_fl, [])
        declared_spills = set(cam.get("spills_into", []) or [])
        overlaps: list[dict[str, Any]] = []
        vis_poly = compute_camera_visibility_polygon(cam, segments) if segments else []

        for r_name, r_box in rooms_by_name.items():
            if str(r_box.get("floor", "")) != cam_fl:
                continue
            pct = compute_cone_room_overlap_pct(cam, r_box, grid_steps=10, solid_segments=segments)
            if r_name == host_room:
                pct = max(pct, 65.0)
                room_coverage[r_name]["primary_cameras"].append(
                    {"camera_id": cam_id, "coverage_pct": pct}
                )
                room_coverage[r_name]["max_coverage_pct"] = max(
                    room_coverage[r_name]["max_coverage_pct"], pct
                )
            elif pct >= 5.0 or r_name in declared_spills:
                eff_pct = max(pct, 18.0 if r_name in declared_spills else pct)
                overlaps.append({"room_name": r_name, "overlap_pct": eff_pct})
                if r_name in room_coverage:
                    room_coverage[r_name]["spillover_cameras"].append(
                        {"camera_id": cam_id, "host_room": host_room, "overlap_pct": eff_pct}
                    )
                    room_coverage[r_name]["max_coverage_pct"] = max(
                        room_coverage[r_name]["max_coverage_pct"], eff_pct
                    )

        sub_zones = list(cam.get("sub_zones", []) or [])
        for sz in sub_zones:
            if not isinstance(sz, dict):
                continue
            sz_item = {
                "id": sz.get("id", ""),
                "camera_id": cam_id,
                "floor": cam_fl,
                "entity_id": sz.get("entity_id", ""),
                "label": sz.get("label", sz.get("id", "")),
                "room": sz.get("room", host_room),
                "x": float(sz.get("x", 0)),
                "y": float(sz.get("y", 0)),
                "width": float(sz.get("width", 60)),
                "height": float(sz.get("height", 60)),
            }
            sub_zone_analysis.append(sz_item)
            sz_room = str(sz_item["room"])
            if sz_room in room_coverage:
                room_coverage[sz_room]["sub_zones"].append(sz_item)

        camera_analysis.append(
            {
                "camera_id": cam_id,
                "name": cam.get("name", cam_id),
                "host_room": host_room,
                "floor": cam.get("floor"),
                "zones": list(cam.get("zones", []) or []),
                "sub_zones": sub_zones,
                "spillover_targets": overlaps,
                "has_multi_room_bleed": len(overlaps) > 0,
                "visibility_polygon": vis_poly,
            }
        )

    pir_analysis: list[dict[str, Any]] = []
    for sensor in sensors_list:
        if not isinstance(sensor, dict) or sensor.get("sensor_type") != "pir_motion":
            continue
        s_id = str(sensor.get("id", ""))
        s_eid = str(sensor.get("entity_id", s_id))
        s_host = str(sensor.get("host_room", ""))
        s_fl = str(sensor.get("floor", ""))
        segments = floor_segments.get(s_fl, [])
        vis_poly = compute_camera_visibility_polygon(sensor, segments) if segments else []
        covered_rooms: list[dict[str, Any]] = []
        for r_name, r_box in rooms_by_name.items():
            if str(r_box.get("floor", "")) != s_fl:
                continue
            pct = compute_cone_room_overlap_pct(
                sensor, r_box, grid_steps=8, solid_segments=segments
            )
            if r_name == s_host or pct >= 5.0:
                eff_pct = max(pct, 45.0 if r_name == s_host else pct)
                covered_rooms.append({"room_name": r_name, "coverage_pct": eff_pct})
                if r_name in room_coverage:
                    room_coverage[r_name]["pir_sensors"].append(
                        {
                            "id": s_id,
                            "entity_id": s_eid,
                            "name": sensor.get("name", s_eid),
                            "coverage_pct": eff_pct,
                        }
                    )
        pir_analysis.append(
            {
                "id": s_id,
                "entity_id": s_eid,
                "name": sensor.get("name", s_eid),
                "host_room": s_host,
                "floor": s_fl,
                "x": float(sensor.get("x", 0)),
                "y": float(sensor.get("y", 0)),
                "heading_deg": float(sensor.get("heading_deg", 0)),
                "fov_deg": float(sensor.get("fov_deg", 110)),
                "range_px": float(sensor.get("range_px", 200)),
                "covered_rooms": covered_rooms,
                "visibility_polygon": vis_poly,
            }
        )

    ble_proxy_analysis: list[dict[str, Any]] = []
    for proxy in ble_proxies_list:
        if not isinstance(proxy, dict):
            continue
        p_id = str(proxy.get("id", ""))
        p_host = str(proxy.get("host_room", ""))
        p_fl = str(proxy.get("floor", ""))
        px = float(proxy.get("x", 0))
        py = float(proxy.get("y", 0))
        radius = float(proxy.get("radius_px", 240))
        reachable_rooms: list[str] = []
        for r_name, r_box in rooms_by_name.items():
            if str(r_box.get("floor", "")) != p_fl:
                continue
            rx1 = float(r_box.get("x", 0))
            ry1 = float(r_box.get("y", 0))
            rx2 = rx1 + float(r_box.get("width", 0))
            ry2 = ry1 + float(r_box.get("height", 0))
            closest_x = max(rx1, min(px, rx2))
            closest_y = max(ry1, min(py, ry2))
            if math.hypot(px - closest_x, py - closest_y) <= radius:
                reachable_rooms.append(r_name)
                if r_name in room_coverage:
                    room_coverage[r_name]["ble_proxies"].append(
                        {"id": p_id, "name": proxy.get("name", p_id), "host_room": p_host}
                    )
        ble_proxy_analysis.append(
            {
                "id": p_id,
                "name": proxy.get("name", p_id),
                "area_name": proxy.get("area_name", p_host),
                "host_room": p_host,
                "floor": p_fl,
                "x": px,
                "y": py,
                "radius_px": radius,
                "reachable_rooms": reachable_rooms,
            }
        )

    for _r_name, cov in room_coverage.items():
        cov["uncovered_pct"] = round(max(0.0, 100.0 - float(cov.get("max_coverage_pct", 0.0))), 1)

    ambiguities = _build_spatial_ambiguities(
        rooms_list,
        rooms_by_name,
        room_coverage,
        camera_analysis,
        seal_analysis,
        room_configs,
    )

    compiled_room_rules: dict[str, dict[str, Any]] = {}
    for r_name, connected in connected_rooms_map.items():
        seal_info = seal_analysis.get(r_name, {})
        cov_info = room_coverage.get(r_name, {})
        compiled_room_rules[r_name] = {
            "room_name": r_name,
            "connected_rooms": connected,
            "recommended_mode": seal_info.get("recommended_mode", str(Mode.OPEN)),
            "can_be_bounded": seal_info.get("can_be_bounded", False),
            "unsealed_exits": seal_info.get("unsealed_exits", []),
            "recommended_inactivity_timeout": RECOMMENDED_INACTIVITY_TIMEOUTS.get(r_name, 180),
            "spillover_entities_to_downgrade": SPILLOVER_CAMERA_ENTITIES.get(r_name, []),
            "max_camera_coverage_pct": cov_info.get("max_coverage_pct", 0.0),
        }

    return {
        "floorplan": fp,
        "connected_rooms_map": connected_rooms_map,
        "seal_analysis": seal_analysis,
        "camera_analysis": camera_analysis,
        "pir_analysis": pir_analysis,
        "sub_zone_analysis": sub_zone_analysis,
        "ble_proxy_analysis": ble_proxy_analysis,
        "room_coverage": room_coverage,
        "ambiguities": ambiguities,
        "compiled_room_rules": compiled_room_rules,
        "device_model_presets": copy.deepcopy(DEVICE_MODEL_PRESETS),
    }
