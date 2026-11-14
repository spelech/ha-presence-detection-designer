"""Negative-Space Spatial Inference Engine.

"The missile knows where it is at all times. It knows this because it knows where it isn't."
By subtracting where an occupant ISN'T (active-clear camera view cones and clear PIR cones)
from where they MUST be (room/floor bounds, BLE proximity, or doorway trajectory conservation),
we localize occupants into uncovered room subregions and unmonitored blind pockets.
"""

from __future__ import annotations

import logging
from collections.abc import Callable
from typing import Any

from .spatial_catalog import (
    ALL_SHADE_ENTITIES,
    BLE_TRACKER_ENTITIES,
    BLIND_POCKET_DEFINITIONS,
    CAMERA_WHOLE_FRAME_ENTITY,
    FRIGATE_PIXEL_MOTION_ENTITIES,
    HOUSEHOLD_ANIMAL_PROFILES,
    HOUSEHOLD_PEOPLE_PROFILES,
    PRIMARY_BLE_TRACKER_ENTITIES,
    ROOM_ACTUATOR_ENTITIES,
    ROOM_DOG_OCCUPANCY_ENTITIES,
    ROOM_SHADE_ENTITIES,
    SECONDARY_BLE_TRACKER_ENTITIES,
    SHADE_SETTLE_WINDOW_SEC,
    STEVE_DEFINITIVE_BLE_ENTITIES,
    SUNLIT_STATIC_SUBZONES,
    UNCOVERED_SUBREGION_LABELS,
    _normalize_ble_area_to_room,
)
from .spatial_room_evaluator import (
    _compute_uncovered_room_centroid,
    _point_in_occluded_cone,
    evaluate_room_spatial_estimates,
)
from .spatial_topology import (
    DEFAULT_HOUSE_FLOORPLAN,
    extract_floor_wall_segments,
)
from .timeline_reconstructor import reconstruct_house_timeline

_LOGGER = logging.getLogger(__name__)

__all__ = [
    "ALL_SHADE_ENTITIES",
    "BLE_TRACKER_ENTITIES",
    "BLIND_POCKET_DEFINITIONS",
    "CAMERA_WHOLE_FRAME_ENTITY",
    "FRIGATE_PIXEL_MOTION_ENTITIES",
    "HOUSEHOLD_ANIMAL_PROFILES",
    "HOUSEHOLD_PEOPLE_PROFILES",
    "PRIMARY_BLE_TRACKER_ENTITIES",
    "ROOM_ACTUATOR_ENTITIES",
    "ROOM_DOG_OCCUPANCY_ENTITIES",
    "ROOM_SHADE_ENTITIES",
    "SECONDARY_BLE_TRACKER_ENTITIES",
    "SHADE_SETTLE_WINDOW_SEC",
    "STEVE_DEFINITIVE_BLE_ENTITIES",
    "SUNLIT_STATIC_SUBZONES",
    "UNCOVERED_SUBREGION_LABELS",
    "_compute_uncovered_room_centroid",
    "_normalize_ble_area_to_room",
    "_point_in_occluded_cone",
    "evaluate_spatial_frame",
    "reconstruct_house_timeline",
]


def evaluate_spatial_frame(
    floorplan: dict[str, Any] | None = None,
    compiled_topology: dict[str, Any] | None = None,
    state_getter: Callable[[str], str | None] | None = None,
    prev_frame: dict[str, Any] | None = None,
    now_ts: float = 0.0,
    negative_space_enabled: bool = True,
    guest_mode_enabled: bool = False,
    ble_decider_enabled: bool = False,
) -> dict[str, Any]:
    """Evaluate positive sensor detections + negative-space exclusions at a single timestamp."""
    effective_neg_space = bool(negative_space_enabled and not guest_mode_enabled)
    fp = (
        floorplan
        if isinstance(floorplan, dict) and floorplan.get("rooms")
        else DEFAULT_HOUSE_FLOORPLAN
    )
    get_state = state_getter or (lambda _eid: "off")

    rooms_list: list[dict[str, Any]] = list(fp.get("rooms", []) or [])
    cameras_list: list[dict[str, Any]] = list(fp.get("cameras", []) or [])
    sensors_list: list[dict[str, Any]] = list(fp.get("sensors", []) or [])

    rooms_by_name: dict[str, dict[str, Any]] = {
        str(r.get("name")): r for r in rooms_list if r.get("name")
    }

    floor_segments: dict[str, list[tuple[tuple[float, float], tuple[float, float]]]] = {}
    for fl in fp.get("floors", []) or []:
        fl_id = str(fl.get("id", ""))
        rooms_on_fl = [r for r in rooms_list if str(r.get("floor", "")) == fl_id]
        floor_segments[fl_id] = extract_floor_wall_segments(rooms_on_fl)

    recent_activity_ts: dict[str, float] = dict(
        (prev_frame or {}).get("recent_activity_ts", {}) or {}
    )
    recent_positive_ts: dict[str, float] = dict(
        (prev_frame or {}).get("recent_positive_ts", {}) or {}
    )
    recent_entity_on_ts: dict[str, float] = dict(
        (prev_frame or {}).get("recent_entity_on_ts", {}) or {}
    )
    recent_shade_move_ts: dict[str, float] = dict(
        (prev_frame or {}).get("recent_shade_move_ts", {}) or {}
    )
    prev_shade_states: dict[str, str] = dict((prev_frame or {}).get("prev_shade_states", {}) or {})

    active_positive_sensors: list[str] = []
    active_negative_exclusions: list[str] = []
    active_shade_exclusions: list[str] = []
    active_pet_exclusions: list[str] = []
    shade_excluded_by_room: dict[str, list[str]] = {}
    shade_moving_by_room: dict[str, list[str]] = {}
    pet_excluded_by_room: dict[str, list[str]] = {}
    active_dog_by_room: dict[str, list[str]] = {}

    for dog_room, dog_eids in ROOM_DOG_OCCUPANCY_ENTITIES.items():
        for dog_eid in dog_eids:
            if str(get_state(dog_eid) or "off").strip().lower() == "on":
                active_dog_by_room.setdefault(dog_room, []).append(dog_eid)

    shades_open_by_room: dict[str, bool] = {}
    shades_moving_flag_by_room: dict[str, bool] = {}
    for s_room, shade_eids in ROOM_SHADE_ENTITIES.items():
        room_open = False
        room_moving = False
        for sh_eid in shade_eids:
            raw_sh = get_state(sh_eid)
            sh_st = str(raw_sh or "off").strip().lower()
            prev_st = prev_shade_states.get(sh_eid)
            if sh_st in ("moving", "opening", "closing") or (
                prev_st is not None and prev_st != sh_st and sh_st in ("open", "closed")
            ):
                recent_shade_move_ts[s_room] = now_ts
                room_moving = True
                shade_moving_by_room.setdefault(s_room, []).append(sh_eid)
            if sh_st in ("open", "moving", "opening", "closing"):
                room_open = True
            prev_shade_states[sh_eid] = sh_st
        if (
            not room_moving
            and s_room in recent_shade_move_ts
            and (now_ts - recent_shade_move_ts[s_room]) <= SHADE_SETTLE_WINDOW_SEC
        ):
            room_moving = True
        shades_open_by_room[s_room] = room_open
        shades_moving_flag_by_room[s_room] = room_moving

    active_ble_by_room: dict[str, list[str]] = {}
    telemetry_ble_by_room: dict[str, list[str]] = {}
    raw_ble_positions: dict[str, str] = {}
    prev_ble_states = dict(prev_frame.get("prev_ble_states", {})) if prev_frame else {}
    steve_pinned_rooms: set[str] = set()

    for ble_eid in BLE_TRACKER_ENTITIES:
        raw_area = get_state(ble_eid)
        if raw_area is not None:
            raw_ble_positions[ble_eid] = str(raw_area)
        mapped_room = _normalize_ble_area_to_room(raw_area)
        if mapped_room:
            telemetry_ble_by_room.setdefault(mapped_room, []).append(ble_eid)
            if ble_decider_enabled:
                active_ble_by_room.setdefault(mapped_room, []).append(ble_eid)
                if ble_eid in STEVE_DEFINITIVE_BLE_ENTITIES:
                    steve_pinned_rooms.add(mapped_room)
                if ble_eid not in active_positive_sensors:
                    active_positive_sensors.append(ble_eid)

        prev_st = prev_ble_states.get(ble_eid)
        if raw_area != prev_st:
            _LOGGER.info(
                "PDD BLE Telemetry: %s changed from '%s' to '%s' (room: '%s', decider: %s)",
                ble_eid,
                prev_st,
                raw_area,
                mapped_room or "unknown",
                ble_decider_enabled,
            )
            prev_ble_states[ble_eid] = raw_area

    for sun_rule in SUNLIT_STATIC_SUBZONES.values():
        for corr_eid in sun_rule.get("corroborating_entities", ()):
            c_st = str(get_state(corr_eid) or "off").strip().lower()
            if c_st in ("on", "playing", "open"):
                recent_entity_on_ts[corr_eid] = now_ts

    def _is_sunlit_room_corroborated(room_name: str, sun_rule: dict[str, Any]) -> bool:
        win_sec = float(sun_rule.get("corroboration_window_sec", 180.0))
        for corr_eid in sun_rule.get("corroborating_entities", ()):
            c_st = str(get_state(corr_eid) or "off").strip().lower()
            if c_st in ("on", "playing", "open"):
                return True
            last_on = recent_entity_on_ts.get(corr_eid)
            if last_on is not None and (now_ts - last_on) <= win_sec:
                return True
        return any(b in PRIMARY_BLE_TRACKER_ENTITIES for b in active_ble_by_room.get(room_name, []))

    def _has_non_camera_corroboration(room_name: str) -> bool:
        for sensor in sensors_list:
            if not isinstance(sensor, dict) or str(sensor.get("host_room", "")) != room_name:
                continue
            s_eid = str(sensor.get("entity_id", ""))
            if not s_eid or s_eid in FRIGATE_PIXEL_MOTION_ENTITIES:
                continue
            if str(get_state(s_eid) or "off").strip().lower() in ("on", "open"):
                return True
            last_on = recent_entity_on_ts.get(s_eid)
            if last_on is not None and (now_ts - last_on) <= 180.0:
                return True
        return any(b in PRIMARY_BLE_TRACKER_ENTITIES for b in active_ble_by_room.get(room_name, []))

    clear_cameras_by_floor: dict[str, list[dict[str, Any]]] = {}
    clear_camera_ids: set[str] = set()
    active_subzones_by_room: dict[str, list[dict[str, Any]]] = {}
    active_whole_cam_by_room: dict[str, list[dict[str, Any]]] = {}

    for cam in cameras_list:
        cam_id = str(cam.get("id", ""))
        cam_fl = str(cam.get("floor", ""))
        host_room = str(cam.get("host_room", ""))
        wf_eid = CAMERA_WHOLE_FRAME_ENTITY.get(cam_id, "")
        wf_raw = get_state(wf_eid) if wf_eid else None
        wf_state = str(wf_raw).lower() if wf_raw is not None else ""

        any_subzone_on = False
        had_shade_excluded_subzone = False
        for sz in cam.get("sub_zones", []) or []:
            sz_eid = str(sz.get("entity_id", ""))
            if not sz_eid:
                continue
            sz_state = str(get_state(sz_eid) or "off").lower()
            if sz_state == "on":
                sz_room = str(sz.get("room", host_room))
                sun_rule = SUNLIT_STATIC_SUBZONES.get(sz_eid)
                actively_moving_uncorroborated = shades_moving_flag_by_room.get(
                    sz_room, False
                ) and not _has_non_camera_corroboration(sz_room)
                sunlit_open_uncorroborated = bool(
                    sun_rule
                    and (
                        shades_moving_flag_by_room.get(sz_room, False)
                        or shades_open_by_room.get(sz_room, False)
                    )
                    and not _is_sunlit_room_corroborated(sz_room, sun_rule)
                )
                if effective_neg_space and (
                    actively_moving_uncorroborated or sunlit_open_uncorroborated
                ):
                    had_shade_excluded_subzone = True
                    shade_excluded_by_room.setdefault(sz_room, []).append(sz_eid)
                    if sz_eid not in active_shade_exclusions:
                        active_shade_exclusions.append(sz_eid)
                    continue

                any_subzone_on = True
                active_positive_sensors.append(sz_eid)
                recent_entity_on_ts[sz_eid] = now_ts
                active_subzones_by_room.setdefault(sz_room, []).append(sz)
                recent_activity_ts[sz_room] = now_ts
                recent_positive_ts[sz_room] = now_ts

        if wf_state == "on":
            room_sun_rules = [
                r for r in SUNLIT_STATIC_SUBZONES.values() if r.get("room") == host_room
            ]
            uncorroborated_sun_room = bool(
                effective_neg_space
                and not any_subzone_on
                and (
                    had_shade_excluded_subzone
                    or (
                        shades_moving_flag_by_room.get(host_room, False)
                        and not _has_non_camera_corroboration(host_room)
                    )
                    or (
                        room_sun_rules
                        and (
                            shades_moving_flag_by_room.get(host_room, False)
                            or shades_open_by_room.get(host_room, False)
                        )
                        and not _is_sunlit_room_corroborated(host_room, room_sun_rules[0])
                    )
                )
            )
            if uncorroborated_sun_room:
                if wf_eid:
                    shade_excluded_by_room.setdefault(host_room, []).append(wf_eid)
                    if wf_eid not in active_shade_exclusions:
                        active_shade_exclusions.append(wf_eid)
                clear_camera_ids.add(cam_id)
                clear_cameras_by_floor.setdefault(cam_fl, []).append(cam)
            else:
                if wf_eid and wf_eid not in active_positive_sensors:
                    active_positive_sensors.append(wf_eid)
                if wf_eid:
                    recent_entity_on_ts[wf_eid] = now_ts
                active_whole_cam_by_room.setdefault(host_room, []).append(cam)
                recent_activity_ts[host_room] = now_ts
                recent_positive_ts[host_room] = now_ts
        elif wf_state == "off" and not any_subzone_on:
            clear_camera_ids.add(cam_id)
            clear_cameras_by_floor.setdefault(cam_fl, []).append(cam)

    clear_pirs_by_floor: dict[str, list[dict[str, Any]]] = {}
    active_pirs_by_room: dict[str, list[dict[str, Any]]] = {}
    active_doors_by_room: dict[str, list[dict[str, Any]]] = {}

    for sensor in sensors_list:
        if not isinstance(sensor, dict):
            continue
        s_eid = str(sensor.get("entity_id", ""))
        if not s_eid:
            continue
        s_state = str(get_state(s_eid) or "off").lower()
        s_type = str(sensor.get("sensor_type", "pir_motion"))
        s_host = str(sensor.get("host_room", ""))
        s_fl = str(sensor.get("floor", ""))

        if s_state == "on":
            if (
                effective_neg_space
                and s_eid in FRIGATE_PIXEL_MOTION_ENTITIES
                and not active_whole_cam_by_room.get(s_host)
                and not active_subzones_by_room.get(s_host)
            ):
                shade_excluded_by_room.setdefault(s_host, []).append(s_eid)
                if s_eid not in active_shade_exclusions:
                    active_shade_exclusions.append(s_eid)
                continue

            if (
                s_type == "pir_motion"
                and active_dog_by_room.get(s_host)
                and not active_whole_cam_by_room.get(s_host)
                and not active_subzones_by_room.get(s_host)
                and not active_ble_by_room.get(s_host)
            ):
                pet_excluded_by_room.setdefault(s_host, []).append(s_eid)
                if s_eid not in active_pet_exclusions:
                    active_pet_exclusions.append(s_eid)
                continue

            if s_eid not in active_positive_sensors:
                active_positive_sensors.append(s_eid)
            recent_entity_on_ts[s_eid] = now_ts
            if s_type == "pir_motion":
                active_pirs_by_room.setdefault(s_host, []).append(sensor)
                recent_activity_ts[s_host] = now_ts
                recent_positive_ts[s_host] = now_ts
            elif s_type == "door_contact":
                active_doors_by_room.setdefault(s_host, []).append(sensor)
                to_room = str(sensor.get("to_room", ""))
                if to_room:
                    active_doors_by_room.setdefault(to_room, []).append(sensor)
                recent_activity_ts[s_host] = now_ts
                recent_positive_ts[s_host] = now_ts
        elif s_state == "off" and s_type == "pir_motion":
            clear_pirs_by_floor.setdefault(s_fl, []).append(sensor)

    room_estimates, occupant_estimates = evaluate_room_spatial_estimates(
        rooms_by_name=rooms_by_name,
        floor_segments=floor_segments,
        get_state=get_state,
        now_ts=now_ts,
        effective_neg_space=effective_neg_space,
        active_subzones_by_room=active_subzones_by_room,
        active_whole_cam_by_room=active_whole_cam_by_room,
        active_pirs_by_room=active_pirs_by_room,
        active_ble_by_room=active_ble_by_room,
        active_doors_by_room=active_doors_by_room,
        active_dog_by_room=active_dog_by_room,
        pet_excluded_by_room=pet_excluded_by_room,
        shade_excluded_by_room=shade_excluded_by_room,
        shade_moving_by_room=shade_moving_by_room,
        clear_cameras_by_floor=clear_cameras_by_floor,
        clear_pirs_by_floor=clear_pirs_by_floor,
        clear_camera_ids=clear_camera_ids,
        steve_pinned_rooms=steve_pinned_rooms,
        recent_activity_ts=recent_activity_ts,
        recent_positive_ts=recent_positive_ts,
        recent_entity_on_ts=recent_entity_on_ts,
        active_negative_exclusions=active_negative_exclusions,
        guest_mode_enabled=guest_mode_enabled,
        telemetry_ble_by_room=telemetry_ble_by_room,
    )

    pet_estimates = [
        {
            "room": r_name,
            "floor": est["floor"],
            "x": est["inferred_x"],
            "y": est["inferred_y"],
            "occupant_type": "pet",
            "occupant_label": "Riley (Dog)",
            "detected_animals": est["detected_animals"],
            "human_present": est["human_present"],
            "pet_present": True,
            "presence_summary": est["presence_summary"],
            "dog_entities": active_dog_by_room.get(r_name, []),
            "pet_excluded_entities": est["pet_excluded_entities"],
        }
        for r_name, est in room_estimates.items()
        if est.get("pet_present")
    ]

    return {
        "ts": now_ts,
        "negative_space_enabled": effective_neg_space,
        "guest_mode_enabled": guest_mode_enabled,
        "ble_decider_enabled": ble_decider_enabled,
        "steve_pinned_rooms": sorted(steve_pinned_rooms),
        "room_estimates": room_estimates,
        "occupant_estimates": occupant_estimates,
        "pet_estimates": pet_estimates,
        "active_positive_sensors": active_positive_sensors,
        "active_negative_exclusions": active_negative_exclusions,
        "active_shade_exclusions": active_shade_exclusions,
        "active_pet_exclusions": active_pet_exclusions,
        "telemetry_ble_by_room": telemetry_ble_by_room,
        "raw_ble_positions": raw_ble_positions,
        "recent_activity_ts": recent_activity_ts,
        "recent_positive_ts": recent_positive_ts,
        "recent_entity_on_ts": recent_entity_on_ts,
        "recent_shade_move_ts": recent_shade_move_ts,
        "prev_shade_states": prev_shade_states,
        "prev_ble_states": prev_ble_states,
    }
