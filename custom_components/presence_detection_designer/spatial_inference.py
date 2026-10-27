"""Negative-Space Spatial Inference & Whole-House Timeline Reconstruction.

"The missile knows where it is at all times. It knows this because it knows where it isn't."
By subtracting where an occupant ISN'T (active-clear camera view cones and clear PIR cones)
from where they MUST be (room/floor bounds, BLE proximity, or doorway trajectory conservation),
we localize occupants into uncovered room subregions and unmonitored blind pockets.
"""

from __future__ import annotations

from collections.abc import Callable
from datetime import UTC, datetime
from typing import Any

from .spatial_topology import (
    DEFAULT_HOUSE_FLOORPLAN,
    compile_floorplan_topology,
    extract_floor_wall_segments,
    get_default_floorplan,
    line_segment_intersects_solid_wall,
    point_in_cone,
)

# Map camera IDs to their whole-frame person occupancy binary_sensor
CAMERA_WHOLE_FRAME_ENTITY: dict[str, str] = {
    "camera.office": "binary_sensor.office_person_occupancy",
    "camera.master_bedroom": "binary_sensor.master_bedroom_person_occupancy",
    "camera.nursery": "binary_sensor.nursery_person_occupancy",
    "camera.margots_room": "binary_sensor.margots_room_person_occupancy",
    "camera.living_room": "binary_sensor.living_room_person_occupancy",
    "camera.dining_room": "binary_sensor.dining_room_person_occupancy",
    "camera.kitchen": "binary_sensor.kitchen_person_occupancy",
    "camera.family_room": "binary_sensor.family_room_person_occupancy",
    "camera.garage": "binary_sensor.garage_person_occupancy",
    "camera.mudroom": "binary_sensor.mudroom_person_occupancy",
    "camera.basement_theater": "binary_sensor.basement_theater_person_occupancy",
    "camera.basement_play_area": "binary_sensor.basement_play_area_person_occupancy",
    "camera.storage_room": "binary_sensor.storage_room_person_occupancy",
}

PRIMARY_BLE_TRACKER_ENTITIES: tuple[str, ...] = (
    "sensor.steve_s_s25_ble_area",
    "sensor.steve_fold_ble_area",
    "sensor.sara_s_s26_ble_area",
    "sensor.steve_watch_ble_area",
)

SECONDARY_BLE_TRACKER_ENTITIES: tuple[str, ...] = ("sensor.tab_s10_lite_ble_area",)

BLE_TRACKER_ENTITIES: tuple[str, ...] = (
    *PRIMARY_BLE_TRACKER_ENTITIES,
    *SECONDARY_BLE_TRACKER_ENTITIES,
)

# Descriptive labels for uncovered subregions when primary camera cone is clear
UNCOVERED_SUBREGION_LABELS: dict[str, str] = {
    "Kitchen": "Kitchen (Uncovered North Prep Counter / Sink — outside Island camera cone)",
    "Master Bedroom": "Master Bedroom (Perimeter / Entry — outside Bed sub-zone)",
    "Office": "Office (Far Corner — outside Desk sub-zone)",
    "Family Room": "Family Room (Perimeter — outside Couch camera cone)",
    "Living Room": "Living Room (Bay Window / Edge — outside Couch sub-zone)",
    "Dining Room": "Dining Room (Sideboard / Edge — outside Table sub-zone)",
    "Mudroom": "Mudroom (Laundry / Back Edge — outside Bench sub-zone)",
    "Basement Play Area": "Basement Play Area (Bar / Far Edge — outside Couch sub-zone)",
    "Storage Room": "Storage Room (Far Shelving — outside Gym sub-zone)",
}

# Blind pockets that conserve occupancy when entered and adjacent camera cones are clear
BLIND_POCKET_DEFINITIONS: dict[str, dict[str, Any]] = {
    "Master Bathroom": {
        "entry_entities": [
            "binary_sensor.master_bathroom_person_occupancy",
            "switch.master_bathroom_fan_switch",
            "light.master_bathroom_lights",
            "light.master_closet_lights",
        ],
        "parent_rooms": ["Master Bedroom"],
        "excluding_cameras": ["camera.master_bedroom"],
        "excluding_sensors": ["binary_sensor.upstairs_hallway_motion"],
        "label": "Master Bathroom & Closet (Blind Pocket — excluded from Master Bedroom camera cone)",
        "hold_window_sec": 900.0,
    },
    "Guest Room": {
        "entry_entities": [
            "binary_sensor.guest_room_motion",
            "binary_sensor.guest_room_occupancy",
            "binary_sensor.nursery_person_occupancy",
            "binary_sensor.upstairs_hallway_motion",
        ],
        "parent_rooms": ["Upstairs Hallway", "Margot's Room", "Office"],
        "excluding_cameras": ["camera.nursery", "camera.office", "camera.master_bedroom"],
        "excluding_sensors": ["binary_sensor.upstairs_hallway_motion"],
        "label": "Guest Room (Blind Pocket — excluded from Nursery, Office & Master Bedroom cameras)",
        "hold_window_sec": 600.0,
    },
    "Basement Bathroom": {
        "entry_entities": [
            "binary_sensor.basement_play_area_person_occupancy",
        ],
        "parent_rooms": ["Basement Play Area"],
        "excluding_cameras": ["camera.basement_play_area", "camera.storage_room"],
        "excluding_sensors": ["binary_sensor.basement_stairs_person_occupancy"],
        "label": "Basement Bathroom (Blind Pocket — excluded from Play Area, Storage & Stairs cameras)",
        "hold_window_sec": 600.0,
    },
}

# Motorized window shade entities mapped by room for sunlight/blind movement exclusion
ROOM_SHADE_ENTITIES: dict[str, tuple[str, ...]] = {
    "Master Bedroom": (
        "cover.master_bedroom_shades",
        "cover.bedside_shade",
        "cover.vanity_side_shade",
        "cover.bedside_shade_motor",
        "cover.vanity_side_shade_motor",
    ),
    "Living Room": (
        "cover.bay_window_shades",
        "cover.bay_window_1",
        "cover.bay_window_2",
        "cover.bay_window_3",
        "cover.bay_window_4",
        "cover.bay_window_5",
    ),
    "Family Room": (
        "cover.family_room_shades",
        "cover.family_room_left_shade",
        "cover.family_room_right_shade",
    ),
    "Margot's Room": (
        "cover.margot_s_window_shade",
        "cover.margot_s_window_shade_motor",
    ),
    "Guest Room": (
        "cover.guest_room_shades",
        "cover.guest_room_shades_motor",
    ),
}

ALL_SHADE_ENTITIES: tuple[str, ...] = tuple(
    eid for eids in ROOM_SHADE_ENTITIES.values() for eid in eids
)

SHADE_SETTLE_WINDOW_SEC: float = 180.0

# Raw camera pixel-luminance motion sensors susceptible to moving shades and sunlight shifts
FRIGATE_PIXEL_MOTION_ENTITIES: frozenset[str] = frozenset(
    {
        "binary_sensor.living_room_motion",
        "binary_sensor.dining_room_motion",
        "binary_sensor.family_room_motion_3",
        "binary_sensor.garage_motion",
        "binary_sensor.master_bedroom_motion_frigate",
        "binary_sensor.office_motion_frigate",
        "binary_sensor.nursery_motion_frigate",
        "binary_sensor.basement_play_area_motion",
        "binary_sensor.basement_theater_motion",
        "binary_sensor.storage_room_motion",
        "binary_sensor.living_room_camera_cell_motion_detection",
        "binary_sensor.living_room_camera_motion_alarm",
        "binary_sensor.dining_room_camera_cell_motion_detection",
        "binary_sensor.dining_room_camera_motion_alarm",
        "binary_sensor.family_room_camera_cell_motion_detection",
        "binary_sensor.family_room_camera_motion_alarm",
        "binary_sensor.garage_camera_cell_motion_detection",
        "binary_sensor.garage_camera_motion_alarm",
        "binary_sensor.basement_play_area_camera_cell_motion_detection",
        "binary_sensor.basement_play_area_camera_motion_alarm",
        "binary_sensor.storage_room_camera_cell_motion_detection",
        "binary_sensor.storage_room_camera_motion_alarm",
    }
)

# Static sun-exposed Frigate sub-zones that require thermal PIR, entry, or BLE corroboration
# when window shades are open or moving in sunlight
SUNLIT_STATIC_SUBZONES: dict[str, dict[str, Any]] = {
    "binary_sensor.master_bed_person_occupancy": {
        "room": "Master Bedroom",
        "corroborating_entities": (
            "binary_sensor.master_bedroom_motion",
            "binary_sensor.master_open_area_person_occupancy",
            "binary_sensor.master_bedroom_entryway_person_occupancy",
            "binary_sensor.master_bathroom_person_occupancy",
            "binary_sensor.master_bedroom_media_playing",
            "media_player.master_bedroom_tv_androidtv",
        ),
        "corroboration_window_sec": 180.0,
    },
    "binary_sensor.master_bedroom_walkway_person_occupancy": {
        "room": "Master Bedroom",
        "corroborating_entities": (
            "binary_sensor.master_bedroom_motion",
            "binary_sensor.master_open_area_person_occupancy",
            "binary_sensor.master_bedroom_entryway_person_occupancy",
            "binary_sensor.master_bathroom_person_occupancy",
            "binary_sensor.master_bedroom_media_playing",
            "media_player.master_bedroom_tv_androidtv",
        ),
        "corroboration_window_sec": 180.0,
    },
    "binary_sensor.living_room_bay_windows_person_occupancy": {
        "room": "Living Room",
        "corroborating_entities": (
            "binary_sensor.living_room_couch_person_occupancy",
            "binary_sensor.living_room_floor_person_occupancy",
            "binary_sensor.living_room_entry_person_occupancy",
            "binary_sensor.keypad_motion",
            "binary_sensor.thermostat_motion",
            "binary_sensor.living_room_media_playing",
        ),
        "corroboration_window_sec": 180.0,
    },
}


def _normalize_ble_area_to_room(raw_state: str | None) -> str | None:
    """Normalize a BLE tracker state string to a canonical floorplan room name."""
    if not raw_state:
        return None
    s = str(raw_state).strip().lower().replace("_", " ")
    if s in ("unknown", "unavailable", "none", "not home", "away", ""):
        return None
    mapping = {
        "master bedroom": "Master Bedroom",
        "master bathroom": "Master Bathroom",
        "office": "Office",
        "guest room": "Guest Room",
        "margot's room": "Margot's Room",
        "margots room": "Margot's Room",
        "nursery": "Margot's Room",
        "living room": "Living Room",
        "dining room": "Dining Room",
        "kitchen": "Kitchen",
        "family room": "Family Room",
        "mudroom": "Mudroom",
        "basement": "Basement Play Area",
        "basement play area": "Basement Play Area",
        "storage room": "Storage Room",
    }
    return mapping.get(s)


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
        # Default to top/left edge of the room if the cone geometrically covers the coarse grid
        return round(rx + rw * 0.25, 1), round(ry + rh * 0.22, 1)

    avg_x = sum(p[0] for p in survivors) / len(survivors)
    avg_y = sum(p[1] for p in survivors) / len(survivors)
    return round(avg_x, 1), round(avg_y, 1)


def evaluate_spatial_frame(
    floorplan: dict[str, Any] | None = None,
    compiled_topology: dict[str, Any] | None = None,
    state_getter: Callable[[str], str | None] | None = None,
    prev_frame: dict[str, Any] | None = None,
    now_ts: float = 0.0,
    negative_space_enabled: bool = True,
) -> dict[str, Any]:
    """Evaluate positive sensor detections + negative-space exclusions at a single timestamp."""
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

    # Carry forward recent room/doorway activity timestamps from prev_frame for conservation
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
    shade_excluded_by_room: dict[str, list[str]] = {}
    shade_moving_by_room: dict[str, list[str]] = {}

    # 0. Inspect motorized window shade states and pre-update corroborating entities
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

    # Pre-scan BLE trackers and corroborating entities so camera shade rules see current-frame corroboration
    active_ble_by_room: dict[str, list[str]] = {}
    for ble_eid in BLE_TRACKER_ENTITIES:
        raw_area = get_state(ble_eid)
        mapped_room = _normalize_ble_area_to_room(raw_area)
        if mapped_room:
            active_ble_by_room.setdefault(mapped_room, []).append(ble_eid)
            if ble_eid not in active_positive_sensors:
                active_positive_sensors.append(ble_eid)

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
        if any(b in PRIMARY_BLE_TRACKER_ENTITIES for b in active_ble_by_room.get(room_name, [])):
            return True
        return False

    def _has_non_camera_corroboration(room_name: str) -> bool:
        """Check if a room with actively moving blinds has physical PIR, door, or BLE corroboration."""
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
        if any(b in PRIMARY_BLE_TRACKER_ENTITIES for b in active_ble_by_room.get(room_name, [])):
            return True
        return False

    # 1. Inspect camera states (whole-frame and sub-zones)
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
                if negative_space_enabled and (
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
            # If the only active detections in this camera's room were uncorroborated sunlit/shade transients,
            # exclude the whole-frame reflection too rather than falsely occupying the room.
            room_sun_rules = [
                r for r in SUNLIT_STATIC_SUBZONES.values() if r.get("room") == host_room
            ]
            uncorroborated_sun_room = bool(
                negative_space_enabled
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

    # 2. Inspect PIR motion and door contact sensors
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
            # Exclude raw camera pixel-luminance motion sensors when AI person detection is clear or shades move
            if (
                negative_space_enabled
                and s_eid in FRIGATE_PIXEL_MOTION_ENTITIES
                and not active_whole_cam_by_room.get(s_host)
                and not active_subzones_by_room.get(s_host)
            ):
                shade_excluded_by_room.setdefault(s_host, []).append(s_eid)
                if s_eid not in active_shade_exclusions:
                    active_shade_exclusions.append(s_eid)
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

    # 4. Evaluate per-room estimates (positive + negative space)
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

        # Case 1: Positive interior sub-zone active
        if subzones:
            sz0 = subzones[0]
            inferred_x = round(float(sz0.get("x", 0)) + float(sz0.get("width", 60)) / 2.0, 1)
            inferred_y = round(float(sz0.get("y", 0)) + float(sz0.get("height", 60)) / 2.0, 1)
            inferred_subregion = f"{r_name} — {sz0.get('label', sz0.get('id', 'Sub-Zone'))}"
            occupied = True
            method = "positive"
            explanation = f"Direct detection in Frigate sub-zone `{sz0.get('label')}`."

        # Case 2: Whole-frame camera active without sub-zone
        elif whole_cams:
            cam0 = whole_cams[0]
            occupied = True
            method = "positive"
            if negative_space_enabled and cam0.get("sub_zones"):
                # Whole-frame camera sees a person, but its interior sub-zone is OFF -> person is in the camera cone outside the sub-zone!
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

        # Case 3: PIR motion active while room camera is clear (or no camera)
        elif pirs:
            pir0 = pirs[0]
            occupied = True
            fl_clear_cams = [
                c
                for c in clear_cameras_by_floor.get(r_fl, [])
                if c.get("host_room") == r_name or r_name in (c.get("spills_into") or [])
            ]
            if negative_space_enabled and fl_clear_cams:
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

        # Case 4: Negative-Space Uncovered Subregion (BLE or recent room entry + clear camera cone)
        elif negative_space_enabled:
            # 4a. Check Blind Pocket Conservation first (Master Bathroom, Guest Room, Basement Bathroom)
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

            # 4b. Uncovered Subregion inside a Camera-Equipped Room (e.g. Kitchen Prep Counter)
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
                        f"{r_name} (Uncovered subregion — outside {', '.join(neg_exclusions)} cone)",
                    )
                    explanation = (
                        f"Positive presence ({', '.join(bles) if bles else 'recent room entry'}) combined with "
                        f"clear {', '.join(neg_exclusions)} cone localizes occupant to {inferred_subregion}."
                    )

        room_shade_excl = shade_excluded_by_room.get(r_name, [])
        room_shade_mov = shade_moving_by_room.get(r_name, [])
        if not occupied and room_shade_excl:
            explanation = (
                f"Excluded moving-shade / sunlight transient ({', '.join(room_shade_excl)}) — "
                f"thermal PIR and entry sensors are clear."
            )

        room_estimates[r_name] = {
            "room": r_name,
            "floor": r_fl,
            "occupied": occupied,
            "should_hold_occupied": should_hold,
            "probability_boost": round(prob_boost, 3),
            "inferred_x": inferred_x,
            "inferred_y": inferred_y,
            "inferred_subregion": inferred_subregion,
            "method": method,
            "positive_drivers": pos_drivers,
            "negative_exclusions": neg_exclusions,
            "shade_sunlight_excluded_entities": room_shade_excl,
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

    return {
        "ts": now_ts,
        "negative_space_enabled": negative_space_enabled,
        "room_estimates": room_estimates,
        "occupant_estimates": occupant_estimates,
        "active_positive_sensors": active_positive_sensors,
        "active_negative_exclusions": active_negative_exclusions,
        "active_shade_exclusions": active_shade_exclusions,
        "recent_activity_ts": recent_activity_ts,
        "recent_positive_ts": recent_positive_ts,
        "recent_entity_on_ts": recent_entity_on_ts,
        "recent_shade_move_ts": recent_shade_move_ts,
        "prev_shade_states": prev_shade_states,
    }


def reconstruct_house_timeline(
    floorplan: dict[str, Any] | None,
    room_configs: dict[str, dict[str, Any]] | None,
    entity_timelines: dict[str, list[tuple[float, str]]],
    start_ts: float,
    end_ts: float,
    negative_space_enabled: bool = True,
    min_step_sec: float = 2.0,
    max_frames: int = 350,
) -> dict[str, Any]:
    """Reconstruct a chronological whole-house spatial timeline across all sensors and rooms."""
    fp = (
        floorplan
        if isinstance(floorplan, dict) and floorplan.get("rooms")
        else get_default_floorplan()
    )
    compiled = compile_floorplan_topology(fp, room_configs)

    # Collect and coalesce transition timestamps
    raw_timestamps: set[float] = {float(start_ts), float(end_ts)}
    for _eid, events in (entity_timelines or {}).items():
        for ts, _state in events:
            if start_ts <= ts <= end_ts:
                raw_timestamps.add(float(ts))

    sorted_ts = sorted(raw_timestamps)
    coalesced_ts: list[float] = []
    for ts in sorted_ts:
        if not coalesced_ts or (ts - coalesced_ts[-1]) >= min_step_sec or ts == end_ts:
            coalesced_ts.append(ts)

    if len(coalesced_ts) > max_frames:
        stride = max(1, len(coalesced_ts) // max_frames)
        sampled = coalesced_ts[::stride]
        if sampled[-1] != coalesced_ts[-1]:
            sampled.append(coalesced_ts[-1])
        coalesced_ts = sampled

    # Pre-sort entity timelines and maintain pointers
    sorted_timelines: dict[str, list[tuple[float, str]]] = {
        eid: sorted(events, key=lambda x: x[0]) for eid, events in (entity_timelines or {}).items()
    }
    pointers: dict[str, int] = {eid: 0 for eid in sorted_timelines}
    current_states: dict[str, str] = {eid: "off" for eid in sorted_timelines}

    frames: list[dict[str, Any]] = []
    transitions: list[dict[str, Any]] = []

    prev_frame_on: dict[str, Any] | None = None
    prev_frame_off: dict[str, Any] | None = None
    last_primary_room: str | None = None
    last_primary_subregion: str | None = None

    blind_pocket_holds_count = 0
    uncovered_subregion_count = 0
    shade_sunlight_exclusions_count = 0
    per_room_on_frames: dict[str, int] = {}
    per_room_off_frames: dict[str, int] = {}

    for ts in coalesced_ts:
        for eid, ev_list in sorted_timelines.items():
            idx = pointers[eid]
            while idx < len(ev_list) and ev_list[idx][0] <= ts:
                current_states[eid] = str(ev_list[idx][1])
                idx += 1
            pointers[eid] = idx

        eval_on = evaluate_spatial_frame(
            floorplan=fp,
            compiled_topology=compiled,
            state_getter=lambda eid: current_states.get(eid, "off"),
            prev_frame=prev_frame_on,
            now_ts=ts,
            negative_space_enabled=True,
        )
        eval_off = evaluate_spatial_frame(
            floorplan=fp,
            compiled_topology=compiled,
            state_getter=lambda eid: current_states.get(eid, "off"),
            prev_frame=prev_frame_off,
            now_ts=ts,
            negative_space_enabled=False,
        )
        prev_frame_on = eval_on
        prev_frame_off = eval_off

        if eval_on.get("active_shade_exclusions"):
            shade_sunlight_exclusions_count += 1

        active_rooms_on = sorted(
            r_name for r_name, est in eval_on["room_estimates"].items() if est.get("occupied")
        )
        active_rooms_off = sorted(
            r_name for r_name, est in eval_off["room_estimates"].items() if est.get("occupied")
        )

        for r_name in active_rooms_on:
            per_room_on_frames[r_name] = per_room_on_frames.get(r_name, 0) + 1
            est = eval_on["room_estimates"][r_name]
            if est.get("should_hold_occupied") and r_name in BLIND_POCKET_DEFINITIONS:
                blind_pocket_holds_count += 1
            elif est.get("method") in ("negative_space", "hybrid"):
                uncovered_subregion_count += 1
        for r_name in active_rooms_off:
            per_room_off_frames[r_name] = per_room_off_frames.get(r_name, 0) + 1

        chosen_eval = eval_on if negative_space_enabled else eval_off
        chosen_active_rooms = active_rooms_on if negative_space_enabled else active_rooms_off
        iso_str = datetime.fromtimestamp(ts, tz=UTC).isoformat()

        # Detect movement transitions across rooms or subregions
        occ_list = chosen_eval["occupant_estimates"]
        if occ_list:
            primary = occ_list[0]
            curr_room = str(primary["room"])
            curr_sub = str(primary["subregion"])
            if curr_room != last_primary_room or curr_sub != last_primary_subregion:
                transitions.append(
                    {
                        "ts": ts,
                        "iso": iso_str,
                        "from_room": last_primary_room,
                        "to_room": curr_room,
                        "floor": primary["floor"],
                        "x": primary["x"],
                        "y": primary["y"],
                        "subregion": curr_sub,
                        "method": primary["method"],
                        "explanation": primary["explanation"],
                        "positive_drivers": primary["positive_drivers"],
                        "negative_space_evidence": primary["negative_exclusions"],
                    }
                )
                last_primary_room = curr_room
                last_primary_subregion = curr_sub

        frames.append(
            {
                "ts": ts,
                "iso": iso_str,
                "occupant_estimates": chosen_eval["occupant_estimates"],
                "active_rooms": chosen_active_rooms,
                "active_rooms_with_negative_space": active_rooms_on,
                "active_rooms_baseline": active_rooms_off,
                "active_positive_sensors": chosen_eval["active_positive_sensors"],
                "active_negative_exclusions": chosen_eval["active_negative_exclusions"],
                "active_shade_exclusions": chosen_eval.get("active_shade_exclusions", []),
            }
        )

    all_seen_rooms = sorted(set(per_room_on_frames.keys()) | set(per_room_off_frames.keys()))
    per_room_delta = {
        r_name: {
            "frames_with_negative_space": per_room_on_frames.get(r_name, 0),
            "frames_baseline": per_room_off_frames.get(r_name, 0),
            "delta_frames": per_room_on_frames.get(r_name, 0) - per_room_off_frames.get(r_name, 0),
        }
        for r_name in all_seen_rooms
    }

    return {
        "negative_space_enabled": negative_space_enabled,
        "start_ts": start_ts,
        "end_ts": end_ts,
        "frame_count": len(frames),
        "frames": frames,
        "transitions": transitions,
        "comparison_summary": {
            "blind_pocket_holds_count": blind_pocket_holds_count,
            "uncovered_subregion_localizations": uncovered_subregion_count,
            "shade_sunlight_exclusions_count": shade_sunlight_exclusions_count,
            "per_room_delta": per_room_delta,
        },
    }
