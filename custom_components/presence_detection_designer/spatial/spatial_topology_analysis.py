"""2D Spatial Floorplan, Camera View Cone & Logical Room Linkage Compiler."""

from __future__ import annotations

from typing import Any

from ..const import (
    CONF_MODE,
    CONF_ROOM_NAME,
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
    "_boxes_overlap_2d",
    "_normalize_angle_diff",
    "apply_compiled_topology_to_config",
    "compute_camera_visibility_polygon",
    "compute_cone_room_overlap_pct",
    "extract_floor_wall_segments",
    "get_default_floorplan",
    "line_segment_intersects_solid_wall",
    "point_in_cone",
    "ray_segment_intersection",
]


def compute_pir_spillover_matrix(
    floorplan: dict[str, Any] | None,
    *,
    min_overlap_pct: float = 5.0,
) -> dict[str, dict[str, float]]:
    """Compute {pir_entity_id: {other_room_name: overlap_fraction}} from floorplan geometry."""
    if not isinstance(floorplan, dict):
        return {}
    rooms = floorplan.get("rooms") or []
    sensors = floorplan.get("sensors") or []
    if not rooms or not sensors:
        return {}
    raw_walls = floorplan.get("floor_wall_segments") or {}
    segs_by_floor: dict[str, list[tuple[tuple[float, float], tuple[float, float]]]] = {}
    for fl, segs in raw_walls.items():
        parsed: list[tuple[tuple[float, float], tuple[float, float]]] = []
        for s in segs or []:
            if isinstance(s, (list, tuple)) and len(s) == 2:
                parsed.append(((float(s[0][0]), float(s[0][1])), (float(s[1][0]), float(s[1][1]))))
        segs_by_floor[str(fl)] = parsed

    matrix: dict[str, dict[str, float]] = {}
    for sen in sensors:
        if not isinstance(sen, dict) or sen.get("sensor_type") != "pir_motion":
            continue
        eid = str(sen.get("entity_id") or sen.get("id") or "").strip()
        if not eid:
            continue
        fl = str(sen.get("floor") or "")
        host = str(sen.get("host_room") or "")
        spills: dict[str, float] = {}
        for r in rooms:
            if not isinstance(r, dict):
                continue
            rname = str(r.get("name") or "")
            if str(r.get("floor") or "") != fl or not rname or rname == host:
                continue
            pct = compute_cone_room_overlap_pct(
                sen,
                r,
                grid_steps=10,
                solid_segments=segs_by_floor.get(fl, []),
            )
            if pct >= min_overlap_pct:
                spills[rname] = round(pct / 100.0, 4)
        if spills:
            matrix[eid] = spills
    return matrix


def _build_spatial_ambiguities(
    rooms_list: list[dict[str, Any]],
    rooms_by_name: dict[str, dict[str, Any]],
    room_coverage: dict[str, dict[str, Any]],
    camera_analysis: list[dict[str, Any]],
    seal_analysis: dict[str, dict[str, Any]],
    room_configs: dict[str, dict[str, Any]] | None,
) -> list[dict[str, Any]]:
    """Identify camera spillover, blind pockets, unsealed perimeters, and vertical BLE stack ambiguities."""
    ambiguities: list[dict[str, Any]] = []

    for ca in camera_analysis:
        if ca["spillover_targets"]:
            spill_names = [t["room_name"] for t in ca["spillover_targets"]]
            host = ca["host_room"]
            downgraded = SPILLOVER_CAMERA_ENTITIES.get(host, [])
            ambiguities.append(
                {
                    "severity": "high",
                    "category": "camera_spillover",
                    "title": f"{ca['name']} cone spills into {', '.join(spill_names)}",
                    "rooms": [host, *spill_names],
                    "camera_id": ca["camera_id"],
                    "description": (
                        f"`{ca['camera_id']}` (hosted in {host}) also sees {', '.join(spill_names)}. "
                        "If whole-frame person detection is weighted as `strong`, movement in the adjacent "
                        f"entryway/hallway/room will falsely mark {host} occupied."
                    ),
                    "resolution": (
                        f"Downgrade {', '.join(downgraded) if downgraded else 'whole-frame camera person'} "
                        f"to `supporting` and trigger {host} only from interior Frigate sub-zones."
                    ),
                }
            )

    blind_pocket_templates: dict[str, tuple[str, str, list[str], str | None, str, str]] = {
        "Master Bathroom": (
            "medium",
            "Master Bathroom & Closet interior is out of camera view",
            ["Master Bathroom", "Master Bedroom"],
            "camera.master_bedroom",
            "`camera.master_bedroom` catches the Master Bathroom/Closet entry doorway (`binary_sensor.master_bathroom_person_occupancy`), but the interior shower, vanity, and closet are out of frame.",
            "Trigger on `master_bathroom_person_occupancy` doorway entry, sustain on shower fan, lights, or humidity derivative (`> 0.3`), and hand off timer when returning to Master Bedroom.",
        ),
        "Guest Room": (
            "low",
            "Guest Room (between Nursery & Office) relies on IKEA VALLHORN PIR (no camera)",
            ["Guest Room", "Margot's Room", "Office"],
            None,
            "Guest Room sits between Margot's Room and Office off the Upstairs Hallway with no camera view cone; covered by `binary_sensor.guest_room_motion_occupancy` (IKEA VALLHORN dual-lobe PIR).",
            "Use `binary_sensor.guest_room_motion_occupancy` (strong, 60s reset) as primary trigger + `guest_room_motion` / `guest_room_occupancy` (supporting Ecobee sustainers) + BLE corroboration.",
        ),
        "Basement Bathroom": (
            "low",
            "Basement Bathroom is out of frame left of Play Area camera",
            ["Basement Play Area", "Storage Room"],
            "camera.basement_play_area",
            "Located to the left of `camera.basement_play_area` alongside Storage Room, with an unmonitored door and no interior sensors.",
            "Treat left edge exit from Basement Play Area as an unsealed transition; Storage Room uses its internal `camera.storage_room` to distinguish gym/storage entry.",
        ),
    }

    for r_name, tpl in blind_pocket_templates.items():
        if r_name not in rooms_by_name:
            continue
        cov = room_coverage.get(r_name, {})
        if cov.get("max_coverage_pct", 0.0) == 0.0 or (
            r_name == "Master Bathroom" and cov.get("uncovered_pct", 0.0) >= 50.0
        ):
            sev, title, rms, cid, desc, res = tpl
            ambiguities.append(
                {
                    "severity": sev,
                    "category": "blind_pocket",
                    "title": title,
                    "rooms": rms,
                    "camera_id": cid,
                    "description": desc,
                    "resolution": res,
                }
            )

    if room_configs:
        for entry_id, cfg in room_configs.items():
            r_name = str(cfg.get(CONF_ROOM_NAME, entry_id))
            seal_info = seal_analysis.get(r_name)
            if seal_info and cfg.get(CONF_MODE) == Mode.BOUNDED and not seal_info["can_be_bounded"]:
                ambiguities.append(
                    {
                        "severity": "high",
                        "category": "unsealed_perimeter",
                        "title": f"{r_name} is set to `bounded`, but has unsealed exits",
                        "rooms": [r_name],
                        "camera_id": None,
                        "description": (
                            f"{r_name} has unmonitored exits: {', '.join(seal_info['unsealed_exits'])}. "
                            "Boundary mode (`bounded`) tracks door contacts alongside bounded hold timeouts; "
                            "unmonitored exits should use `open` mode."
                        ),
                        "resolution": f"Switch {r_name} to `mode: open` with Cross-Room Timer Hand-Off.",
                    }
                )

    upstairs_boxes = [
        r for r in rooms_list if r.get("floor") == "upstairs" and r.get("room_type") == "room"
    ]
    main_boxes = [
        r for r in rooms_list if r.get("floor") == "main" and r.get("room_type") == "room"
    ]
    for u_box in upstairs_boxes:
        for m_box in main_boxes:
            overlap_ratio = _boxes_overlap_2d(u_box, m_box)
            if overlap_ratio >= 0.35:
                ambiguities.append(
                    {
                        "severity": "medium",
                        "category": "vertical_ble_bleed",
                        "title": f"Vertical BLE stack: {u_box['name']} directly above {m_box['name']} ({int(overlap_ratio * 100)}% overlap)",
                        "rooms": [str(u_box["name"]), str(m_box["name"])],
                        "camera_id": None,
                        "description": (
                            f"{u_box['name']} (Upstairs) sits directly over {m_box['name']} (Main Floor). "
                            "Phone/tablet BLE proxies can bleed vertically through the floor."
                        ),
                        "resolution": (
                            "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary "
                            "tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor."
                        ),
                    }
                )

    return ambiguities
