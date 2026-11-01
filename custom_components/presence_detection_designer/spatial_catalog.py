"""Spatial entity catalogs, BLE/pet/shade mappings, and blind-pocket rules."""

from __future__ import annotations

from typing import Any

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
    "sensor.steve_watch_ble_area",
)

STEVE_DEFINITIVE_BLE_ENTITIES: tuple[str, ...] = (
    "sensor.steve_s_s25_ble_area",
    "sensor.steve_fold_ble_area",
    "sensor.steve_watch_ble_area",
)

# Frigate dog detection entities by room for attributing/suppressing Riley (dog) PIR triggers
ROOM_DOG_OCCUPANCY_ENTITIES: dict[str, tuple[str, ...]] = {
    "Dining Room": (
        "binary_sensor.dining_room_dog_occupancy",
        "binary_sensor.rileys_food_dog_occupancy",
        "binary_sensor.dining_room_table_dog_occupancy",
    ),
    "Living Room": (
        "binary_sensor.living_room_dog_occupancy",
        "binary_sensor.living_room_couch_dog_occupancy",
        "binary_sensor.living_room_floor_dog_occupancy",
        "binary_sensor.living_room_entry_dog_occupancy",
    ),
    "Family Room": (
        "binary_sensor.family_room_dog_occupancy",
        "binary_sensor.couch_dog_occupancy",
    ),
    "Kitchen": (
        "binary_sensor.kitchen_dog_occupancy",
        "binary_sensor.kitchen_island_dog_occupancy",
    ),
    "Mudroom": ("binary_sensor.mudroom_dog_occupancy",),
    "Office": ("binary_sensor.office_dog_occupancy",),
    "Master Bedroom": ("binary_sensor.master_bedroom_dog_occupancy",),
    "Basement Play Area": ("binary_sensor.basement_play_area_dog_occupancy",),
}

SECONDARY_BLE_TRACKER_ENTITIES: tuple[str, ...] = ("sensor.tab_s10_lite_ble_area",)

BLE_TRACKER_ENTITIES: tuple[str, ...] = (
    *PRIMARY_BLE_TRACKER_ENTITIES,
    *SECONDARY_BLE_TRACKER_ENTITIES,
)

HOUSEHOLD_PEOPLE_PROFILES: dict[str, dict[str, Any]] = {
    "steve": {
        "label": "Steve",
        "type": "tracked_human",
        "ble_entities": STEVE_DEFINITIVE_BLE_ENTITIES,
        "power_entities": ("sensor.office_ups_used_watts_filtered",),
    },
    "margot": {
        "label": "Margot",
        "type": "untracked_human",
        "primary_rooms": ("Margot's Room", "Nursery"),
        "secondary_ble_entities": ("sensor.tab_s10_lite_ble_area",),
    },
    "guest": {
        "label": "Guest",
        "type": "untracked_human",
    },
}

HOUSEHOLD_ANIMAL_PROFILES: dict[str, dict[str, Any]] = {
    "riley": {
        "label": "Riley (Dog)",
        "type": "pet",
        "species": "dog",
        "room_entities": ROOM_DOG_OCCUPANCY_ENTITIES,
    },
}

ROOM_ACTUATOR_ENTITIES: dict[str, tuple[str, ...]] = {
    "Office": ("light.office_lights",),
    "Master Bedroom": (
        "light.master_bedroom_lights",
        "light.master_bedroom_ceiling_fan_light",
        "fan.master_bedroom_ceiling_fan",
    ),
    "Master Bathroom": (
        "light.master_bathroom_lights",
        "light.master_closet_lights",
        "switch.master_bathroom_fan_switch",
    ),
    "Margot's Room": (
        "light.nursery_ceiling_fan_light",
        "light.nursery_dresser_lights",
        "light.nursery_rocker_lights",
        "fan.nursery_ceiling_fan",
    ),
    "Nursery": ("light.guest_room_fan_light", "fan.guest_room_fan"),
    "Guest Room": ("light.guest_room_lights",),
    "Upstairs Hallway": ("light.upstairs_hallway_lights",),
    "Laundry Room": ("light.laundry_room_lights",),
    "Family Room": ("light.family_room_lights", "light.family_room_lamps"),
    "Kitchen": (
        "light.kitchen_lights",
        "light.kitchen_island_lights",
        "light.kitchen_cabinet_lights",
    ),
    "Dining Room": ("light.dining_room_lights",),
    "Living Room": ("light.living_room_lights", "light.living_room_lamps"),
    "Foyer": ("light.foyer_lights",),
    "Mudroom": ("light.mudroom_lights",),
    "Powder Room": ("light.powder_room_lights", "switch.powder_room_fan"),
    "Garage": ("light.garage_lights",),
    "Basement Play Area": (
        "light.basement_play_area_lights",
        "light.basement_bar_lights",
    ),
    "Basement Theater": ("light.basement_theater_lights",),
    "Basement Bathroom": ("light.basement_bathroom_lights",),
    "Storage Room": ("light.storage_room_lights",),
}

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
