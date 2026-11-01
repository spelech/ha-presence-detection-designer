"""Per-room positive and negative-space localization evaluator for the Spatial Inference Engine."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

from .spatial_catalog import (
    BLIND_POCKET_DEFINITIONS,
    CAMERA_WHOLE_FRAME_ENTITY,
    PRIMARY_BLE_TRACKER_ENTITIES,
    UNCOVERED_SUBREGION_LABELS,
)
from .spatial_topology import (
    line_segment_intersects_solid_wall,
    point_in_cone,
)


def _point_in_occluded_cone(
    px: float,
    py: float,
    cone: dict[str, Any],
    solid_segments: list[tuple[tuple[float, float], tuple[float, float]]],
) -> bool:
    """Return True if (px, py) is inside `cone` and not occluded by any solid wall segment."""
    cx = float(cone.get("x", 0))
    cy = float(cone.get("y", 0))
    heading = float(cone.get("heading_deg", 0))
    fov = float(cone.get("fov_deg", 90))
    reach = float(cone.get("range_px", 250))
    if not point_in_cone(px, py, cx, cy, heading, fov, reach):
        return False
    if solid_segments and line_segment_intersects_solid_wall(cx, cy, px, py, solid_segments):
        return False
    return True


def _compute_uncovered_room_centroid(
    room_box: dict[str, Any],
    clear_cameras: list[dict[str, Any]],
    clear_pirs: list[dict[str, Any]],
    solid_segments: list[tuple[tuple[float, float], tuple[float, float]]],
    grid_steps: int = 8,
) -> tuple[float, float]:
    """Sample a 2D grid inside `room_box` and return the centroid of points NOT inside clear cones."""
    rx = float(room_box.get("x", 0))
    ry = float(room_box.get("y", 0))
    rw = max(1.0, float(room_box.get("width", 100)))
    rh = max(1.0, float(room_box.get("height", 100)))

    survivors: list[tuple[float, float]] = []
    for ix in range(grid_steps):
        for iy in range(grid_steps):
            px = rx + (ix + 0.5) * (rw / grid_steps)
            py = ry + (iy + 0.5) * (rh / grid_steps)
            excluded = False
            for cam in clear_cameras:
                if _point_in_occluded_cone(px, py, cam, solid_segments):
                    excluded = True
                    break
            if not excluded:
                for pir in clear_pirs:
                    if _point_in_occluded_cone(px, py, pir, solid_segments):
                        excluded = True
                        break
            if not excluded:
                survivors.append((px, py))

    if not survivors:
        return round(rx + rw * 0.25, 1), round(ry + rh * 0.22, 1)

    avg_x = sum(p[0] for p in survivors) / len(survivors)
    avg_y = sum(p[1] for p in survivors) / len(survivors)
    return round(avg_x, 1), round(avg_y, 1)


def evaluate_room_spatial_estimates(
    rooms_by_name: dict[str, dict[str, Any]],
    floor_segments: dict[str, list[tuple[tuple[float, float], tuple[float, float]]]],
    get_state: Callable[[str], str | None],
    now_ts: float,
    effective_neg_space: bool,
    active_subzones_by_room: dict[str, list[dict[str, Any]]],
    active_whole_cam_by_room: dict[str, list[dict[str, Any]]],
    active_pirs_by_room: dict[str, list[dict[str, Any]]],
    active_ble_by_room: dict[str, list[str]],
    active_doors_by_room: dict[str, list[dict[str, Any]]],
    active_dog_by_room: dict[str, list[str]],
    pet_excluded_by_room: dict[str, list[str]],
    shade_excluded_by_room: dict[str, list[str]],
    shade_moving_by_room: dict[str, list[str]],
    clear_cameras_by_floor: dict[str, list[dict[str, Any]]],
    clear_pirs_by_floor: dict[str, list[dict[str, Any]]],
    clear_camera_ids: set[str],
    steve_pinned_rooms: set[str],
    recent_activity_ts: dict[str, float],
    recent_positive_ts: dict[str, float],
    recent_entity_on_ts: dict[str, float],
    active_negative_exclusions: list[str],
    guest_mode_enabled: bool = False,
) -> tuple[dict[str, dict[str, Any]], list[dict[str, Any]]]:
    """Compute per-room spatial localization and ranked occupant estimates."""
    room_estimates: dict[str, dict[str, Any]] = {}
    occupant_estimates: list[dict[str, Any]] = []

    for r_name, r_box in rooms_by_name.items():
        r_fl = str(r_box.get("floor", "main"))
        rx_center = round(float(r_box.get("x", 0)) + float(r_box.get("width", 100)) / 2.0, 1)
        ry_center = round(float(r_box.get("y", 0)) + float(r_box.get("height", 100)) / 2.0, 1)

        pos_drivers: list[str] = []
        neg_exclusions: list[str] = []
        inferred_x = rx_center
        inferred_y = ry_center
        inferred_subregion: str | None = None
        prob_boost = 0.0
        should_hold = False
        occupied = False
        method = "none"
        explanation = "No active spatial triggers."

        subzones = active_subzones_by_room.get(r_name, [])
        whole_cams = active_whole_cam_by_room.get(r_name, [])
        pirs = active_pirs_by_room.get(r_name, [])
        bles = active_ble_by_room.get(r_name, [])
        doors = active_doors_by_room.get(r_name, [])
        dog_sensors = active_dog_by_room.get(r_name, [])
        pet_excl = pet_excluded_by_room.get(r_name, [])

        for sz in subzones:
            pos_drivers.append(str(sz.get("entity_id", sz.get("id", ""))))
        for cam in whole_cams:
            wf_eid = CAMERA_WHOLE_FRAME_ENTITY.get(str(cam.get("id", "")), str(cam.get("id", "")))
            if wf_eid not in pos_drivers:
                pos_drivers.append(wf_eid)
        for p in pirs:
            pos_drivers.append(str(p.get("entity_id", p.get("id", ""))))
        for b in bles:
            pos_drivers.append(b)
        for d in doors:
            pos_drivers.append(str(d.get("entity_id", d.get("id", ""))))

        if subzones:
            sz0 = subzones[0]
            inferred_x = round(float(sz0.get("x", 0)) + float(sz0.get("width", 60)) / 2.0, 1)
            inferred_y = round(float(sz0.get("y", 0)) + float(sz0.get("height", 60)) / 2.0, 1)
            inferred_subregion = f"{r_name} \u2014 {sz0.get('label', sz0.get('id', 'Sub-Zone'))}"
            occupied = True
            method = "positive"
            explanation = f"Direct detection in Frigate sub-zone `{sz0.get('label')}`."

        elif whole_cams:
            cam0 = whole_cams[0]
            occupied = True
            method = "positive"
            if effective_neg_space and cam0.get("sub_zones"):
                inferred_subregion = f"{r_name} (Inside {cam0.get('name')} cone, outside sub-zones)"
                for sz in cam0.get("sub_zones", []):
                    if sz.get("room") == r_name:
                        neg_exclusions.append(str(sz.get("entity_id", sz.get("id"))))
                explanation = (
                    f"`{cam0.get('id')}` sees a person while sub-zones are clear; "
                    f"localized to camera cone perimeter."
                )
            else:
                inferred_subregion = f"{r_name} ({cam0.get('name')} view cone)"
                explanation = f"Direct person detection on `{cam0.get('id')}`."

        elif pirs:
            pir0 = pirs[0]
            occupied = True
            fl_clear_cams = [
                c
                for c in clear_cameras_by_floor.get(r_fl, [])
                if c.get("host_room") == r_name or r_name in (c.get("spills_into") or [])
            ]
            if effective_neg_space and fl_clear_cams:
                method = "hybrid"
                for c in fl_clear_cams:
                    cid = str(c.get("id", ""))
                    neg_exclusions.append(cid)
                    if cid not in active_negative_exclusions:
                        active_negative_exclusions.append(cid)
                inferred_x, inferred_y = _compute_uncovered_room_centroid(
                    r_box,
                    fl_clear_cams,
                    [],
                    floor_segments.get(r_fl, []),
                )
                inferred_subregion = UNCOVERED_SUBREGION_LABELS.get(
                    r_name, f"{r_name} (Uncovered region outside clear camera cone)"
                )
                prob_boost = 0.22
                explanation = (
                    f"PIR `{pir0.get('entity_id')}` is active while {', '.join(neg_exclusions)} is clear; "
                    f"negative space localizes occupant to {inferred_subregion}."
                )
            else:
                method = "positive"
                inferred_x = round(float(pir0.get("x", rx_center)), 1)
                inferred_y = round(float(pir0.get("y", ry_center)), 1)
                inferred_subregion = f"{r_name} ({pir0.get('name', 'Motion Cone')})"
                explanation = f"Motion detected by `{pir0.get('entity_id')}`."

        elif effective_neg_space:
            bp_def = BLIND_POCKET_DEFINITIONS.get(r_name)
            if bp_def:
                hold_window = float(bp_def.get("hold_window_sec", 600.0))
                had_entry_signal = False
                for e_eid in bp_def.get("entry_entities", []):
                    if str(get_state(e_eid) or "off").lower() == "on":
                        had_entry_signal = True
                        break
                    last_on = recent_entity_on_ts.get(e_eid)
                    if last_on is not None and (now_ts - last_on) <= hold_window:
                        had_entry_signal = True
                        break
                if not had_entry_signal:
                    for p_room in bp_def.get("parent_rooms", []):
                        if p_room in steve_pinned_rooms:
                            continue
                        last_act = recent_activity_ts.get(p_room)
                        if last_act is not None and (now_ts - last_act) <= hold_window:
                            had_entry_signal = True
                            break

                excl_cams = list(bp_def.get("excluding_cameras", []))
                all_excl_cams_clear = all(cid in clear_camera_ids for cid in excl_cams)
                all_excl_sensors_clear = all(
                    str(get_state(seid) or "off").lower() == "off"
                    for seid in bp_def.get("excluding_sensors", [])
                )

                if had_entry_signal and all_excl_cams_clear and all_excl_sensors_clear:
                    occupied = True
                    should_hold = True
                    method = "negative_space"
                    prob_boost = 0.35
                    inferred_subregion = str(bp_def["label"])
                    for cid in excl_cams:
                        neg_exclusions.append(cid)
                        if cid not in active_negative_exclusions:
                            active_negative_exclusions.append(cid)
                    for seid in bp_def.get("excluding_sensors", []):
                        neg_exclusions.append(seid)
                    recent_activity_ts[r_name] = now_ts
                    explanation = (
                        f"Negative-Space Blind Pocket Conservation: recent entry from "
                        f"{'/'.join(bp_def.get('parent_rooms', []))} while "
                        f"{', '.join(excl_cams)} are clear proves occupant is inside {r_name}."
                    )

            primary_bles = [b for b in bles if b in PRIMARY_BLE_TRACKER_ENTITIES]
            has_recent_entry = (
                r_name in recent_activity_ts and (now_ts - recent_activity_ts[r_name]) <= 300.0
            )
            if not occupied and (primary_bles or has_recent_entry):
                room_clear_cams = [
                    c
                    for c in clear_cameras_by_floor.get(r_fl, [])
                    if c.get("host_room") == r_name or r_name in (c.get("spills_into") or [])
                ]
                room_clear_pirs = [
                    p for p in clear_pirs_by_floor.get(r_fl, []) if p.get("host_room") == r_name
                ]
                if room_clear_cams:
                    occupied = True
                    should_hold = True
                    method = "negative_space"
                    prob_boost = 0.25 if bles else 0.18
                    for c in room_clear_cams:
                        cid = str(c.get("id", ""))
                        neg_exclusions.append(cid)
                        if cid not in active_negative_exclusions:
                            active_negative_exclusions.append(cid)
                    inferred_x, inferred_y = _compute_uncovered_room_centroid(
                        r_box,
                        room_clear_cams,
                        room_clear_pirs,
                        floor_segments.get(r_fl, []),
                    )
                    inferred_subregion = UNCOVERED_SUBREGION_LABELS.get(
                        r_name,
                        f"{r_name} (Uncovered subregion \u2014 outside {', '.join(neg_exclusions)} cone)",
                    )
                    explanation = (
                        f"Positive presence ({', '.join(bles) if bles else 'recent room entry'}) combined with "
                        f"clear {', '.join(neg_exclusions)} cone localizes occupant to {inferred_subregion}."
                    )

        human_present = bool(occupied)
        pet_present = bool(dog_sensors or pet_excl)
        detected_people: list[str] = []
        detected_animals: list[str] = ["Riley (Dog)"] if pet_present else []
        definitive_tracker_pinned = bool(r_name in steve_pinned_rooms)

        if occupied:
            if r_name in steve_pinned_rooms:
                occupant_type = "tracked_human"
                occupant_label = "Steve"
                detected_people = ["Steve"]
            elif r_name == "Margot's Room" or "sensor.tab_s10_lite_ble_area" in bles:
                occupant_type = "untracked_human"
                occupant_label = "Margot"
                detected_people = ["Margot"]
            elif guest_mode_enabled:
                occupant_type = "untracked_human"
                occupant_label = "Guest / Untracked Occupant"
                detected_people = ["Guest / Untracked Occupant"]
            elif steve_pinned_rooms:
                occupant_type = "untracked_human"
                occupant_label = "Margot / Untracked Occupant"
                detected_people = ["Margot / Untracked Occupant"]
            else:
                occupant_type = "human"
                occupant_label = "Occupant"
                detected_people = ["Occupant"]
        else:
            if pet_present:
                occupant_type = "pet"
                occupant_label = "Riley (Dog)"
            else:
                occupant_type = "none"
                occupant_label = ""

        if detected_people and detected_animals:
            presence_summary = f"{', '.join(detected_people)} + {', '.join(detected_animals)}"
        elif detected_people:
            presence_summary = ", ".join(detected_people)
        elif detected_animals:
            presence_summary = ", ".join(detected_animals)
        else:
            presence_summary = "Vacant"

        room_shade_excl = shade_excluded_by_room.get(r_name, [])
        room_shade_mov = shade_moving_by_room.get(r_name, [])
        if not occupied and pet_excl:
            explanation = (
                f"Suppressed pet PIR trigger ({', '.join(pet_excl)}) \u2014 "
                f"Frigate detected Riley ({', '.join(dog_sensors)}) with no person present."
            )
        elif not occupied and room_shade_excl:
            explanation = (
                f"Excluded moving-shade / sunlight transient ({', '.join(room_shade_excl)}) \u2014 "
                f"thermal PIR and entry sensors are clear."
            )

        room_estimates[r_name] = {
            "room": r_name,
            "floor": r_fl,
            "occupied": occupied,
            "human_present": human_present,
            "pet_present": pet_present,
            "detected_people": detected_people,
            "detected_animals": detected_animals,
            "presence_summary": presence_summary,
            "should_hold_occupied": should_hold,
            "probability_boost": round(prob_boost, 3),
            "inferred_x": inferred_x,
            "inferred_y": inferred_y,
            "inferred_subregion": inferred_subregion,
            "method": method,
            "occupant_type": occupant_type,
            "occupant_label": occupant_label,
            "definitive_tracker_pinned": definitive_tracker_pinned,
            "positive_drivers": pos_drivers,
            "negative_exclusions": neg_exclusions,
            "shade_sunlight_excluded_entities": room_shade_excl,
            "pet_excluded_entities": pet_excl,
            "shade_moving_entities": room_shade_mov,
            "explanation": explanation,
        }

        if occupied and r_box.get("room_type") != "transit":
            occupant_estimates.append(
                {
                    "room": r_name,
                    "floor": r_fl,
                    "x": inferred_x,
                    "y": inferred_y,
                    "subregion": inferred_subregion or r_name,
                    "human_present": human_present,
                    "pet_present": pet_present,
                    "detected_people": detected_people,
                    "detected_animals": detected_animals,
                    "presence_summary": presence_summary,
                    "occupant_type": occupant_type,
                    "occupant_label": occupant_label,
                    "definitive_tracker_pinned": definitive_tracker_pinned,
                    "confidence": round(0.92 if method == "positive" else 0.84, 2),
                    "method": method,
                    "positive_drivers": pos_drivers,
                    "negative_exclusions": neg_exclusions,
                    "explanation": explanation,
                }
            )

    method_rank = {"positive": 3, "hybrid": 2, "negative_space": 1, "none": 0}
    occupant_estimates.sort(
        key=lambda item: (
            1 if recent_positive_ts.get(str(item["room"])) == now_ts else 0,
            method_rank.get(str(item.get("method", "none")), 0),
            float(recent_positive_ts.get(str(item["room"]), 0.0)),
        ),
        reverse=True,
    )

    return room_estimates, occupant_estimates
