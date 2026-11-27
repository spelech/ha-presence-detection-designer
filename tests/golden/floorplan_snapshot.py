"""Canonical house room configs, zone groupings, and floorplan loader for golden tests."""

from __future__ import annotations

import copy
import json
from pathlib import Path
from typing import Any

from custom_components.presence_detection_designer.spatial.floorplan_presets import (
    get_default_floorplan,
)

_LIVE_SNAPSHOT_PATH = Path(__file__).parent / "live_floorplan_snapshot.json"

# Logical multi-room zones that should remain continuously occupied across internal handoffs
ZONE_GROUPS: dict[str, tuple[str, ...]] = {
    "Basement": ("Basement Theater", "Basement Play Area"),
    "Main Floor Open Plan": ("Family Room", "Kitchen", "Dining Room", "Living Room", "Front Entry"),
    "Master Suite": ("Master Bedroom", "Master Bathroom"),
}

# Canonical PDD room configs mirroring the live 16 tracked rooms (Hallway Bathroom excluded)
HOUSE_ROOM_CONFIGS: list[dict[str, Any]] = [
    {
        "room_name": "Family Room",
        "mode": "open",
        "inactivity_timeout": 180,
        "grace_timeout": 45,
        "extend_timeout": 600,
        "connected_rooms": [
            "Basement Play Area",
            "Front Entry",
            "Kitchen",
            "Laundry Room",
            "Upstairs Hallway & Stairs",
        ],
        "trigger_entities": [
            "binary_sensor.family_room_couch_person_occupancy",
            "binary_sensor.family_room_recliner_person_occupancy",
            "binary_sensor.family_room_floor_person_occupancy",
        ],
        "sustaining_conditions": [
            {"entity_id": "media_player.family_room_tv", "operator": "equals", "state": "playing"},
            {
                "entity_id": "media_player.av_family_room_soundbar_q700b",
                "operator": "equals",
                "state": "playing",
            },
        ],
        "bayesian_enabled": True,
        "bayesian_prior": 0.15,
        "bayesian_threshold": 0.75,
        "bayesian_observations": [
            {
                "entity_id": "binary_sensor.family_room_motion_occupancy",
                "prob_given_true": 0.78,
                "prob_given_false": 0.08,
            },
            {
                "entity_id": "binary_sensor.family_room_couch_person_occupancy",
                "prob_given_true": 0.96,
                "prob_given_false": 0.02,
            },
            {
                "entity_id": "binary_sensor.family_room_recliner_person_occupancy",
                "prob_given_true": 0.96,
                "prob_given_false": 0.02,
            },
            {
                "entity_id": "binary_sensor.family_room_floor_person_occupancy",
                "prob_given_true": 0.88,
                "prob_given_false": 0.05,
            },
            {
                "entity_id": "media_player.family_room_tv",
                "operator": "equals",
                "state": "playing",
                "prob_given_true": 0.668,
                "prob_given_false": 0.263,
            },
            {
                "entity_id": "binary_sensor.family_room_ecobee_motion",
                "prob_given_true": 0.619,
                "prob_given_false": 0.281,
            },
            {
                "entity_id": "binary_sensor.family_room_ecobee_occupancy",
                "prob_given_true": 0.506,
                "prob_given_false": 0.459,
            },
            {
                "entity_id": "binary_sensor.family_room_ring_motion",
                "prob_given_true": 0.612,
                "prob_given_false": 0.293,
            },
            {
                "entity_id": "sensor.resident_a_phone_ble_area",
                "operator": "equals",
                "state": "Family Room",
                "prob_given_true": 0.78,
                "prob_given_false": 0.08,
            },
        ],
    },
    {
        "room_name": "Kitchen",
        "mode": "open",
        "inactivity_timeout": 180,
        "grace_timeout": 45,
        "extend_timeout": 600,
        "connected_rooms": [
            "Basement Play Area",
            "Dining Room",
            "Family Room",
            "Front Entry",
            "Laundry Room",
            "Upstairs Hallway & Stairs",
        ],
        "trigger_entities": [
            "binary_sensor.kitchen_island_person_occupancy",
            "binary_sensor.kitchen_motion_occupancy",
        ],
        "sustaining_conditions": [],
        "bayesian_enabled": True,
        "bayesian_prior": 0.15,
        "bayesian_threshold": 0.75,
        "bayesian_observations": [
            {
                "entity_id": "binary_sensor.kitchen_motion_occupancy",
                "prob_given_true": 0.90,
                "prob_given_false": 0.05,
            },
            {
                "entity_id": "binary_sensor.kitchen_island_person_occupancy",
                "prob_given_true": 0.96,
                "prob_given_false": 0.02,
            },
            {
                "entity_id": "sensor.resident_a_phone_ble_area",
                "operator": "equals",
                "state": "Kitchen",
                "prob_given_true": 0.78,
                "prob_given_false": 0.08,
            },
        ],
    },
    {
        "room_name": "Dining Room",
        "mode": "open",
        "inactivity_timeout": 180,
        "grace_timeout": 45,
        "extend_timeout": 600,
        "connected_rooms": ["Kitchen", "Living Room"],
        "trigger_entities": [
            "binary_sensor.dining_room_table_person_occupancy",
            "binary_sensor.pet_feeding_area_person_occupancy",
        ],
        "sustaining_conditions": [],
        "bayesian_enabled": True,
        "bayesian_prior": 0.12,
        "bayesian_threshold": 0.75,
        "bayesian_observations": [
            {
                "entity_id": "binary_sensor.dining_room_motion_occupancy",
                "prob_given_true": 0.78,
                "prob_given_false": 0.08,
            },
            {
                "entity_id": "binary_sensor.dining_room_table_person_occupancy",
                "prob_given_true": 0.96,
                "prob_given_false": 0.02,
            },
            {
                "entity_id": "binary_sensor.thermostat_motion",
                "prob_given_true": 0.619,
                "prob_given_false": 0.281,
            },
            {
                "entity_id": "binary_sensor.thermostat_occupancy",
                "prob_given_true": 0.506,
                "prob_given_false": 0.459,
            },
            {
                "entity_id": "sensor.resident_a_phone_ble_area",
                "operator": "equals",
                "state": "Dining Room",
                "prob_given_true": 0.78,
                "prob_given_false": 0.08,
            },
        ],
    },
    {
        "room_name": "Living Room",
        "mode": "open",
        "inactivity_timeout": 180,
        "grace_timeout": 45,
        "extend_timeout": 600,
        "connected_rooms": ["Dining Room", "Front Entry", "Upstairs Hallway & Stairs"],
        "trigger_entities": [
            "binary_sensor.living_room_couch_person_occupancy",
            "binary_sensor.living_room_bay_windows_person_occupancy",
            "binary_sensor.living_room_floor_person_occupancy",
        ],
        "sustaining_conditions": [
            {
                "entity_id": "media_player.living_room_display_webos",
                "operator": "equals",
                "state": "playing",
            },
        ],
        "bayesian_enabled": True,
        "bayesian_prior": 0.15,
        "bayesian_threshold": 0.75,
        "bayesian_observations": [
            {
                "entity_id": "binary_sensor.living_room_motion_occupancy",
                "prob_given_true": 0.78,
                "prob_given_false": 0.08,
            },
            {
                "entity_id": "binary_sensor.living_room_couch_person_occupancy",
                "prob_given_true": 0.96,
                "prob_given_false": 0.02,
            },
            {
                "entity_id": "binary_sensor.living_room_bay_windows_person_occupancy",
                "prob_given_true": 0.96,
                "prob_given_false": 0.02,
            },
            {
                "entity_id": "binary_sensor.living_room_floor_person_occupancy",
                "prob_given_true": 0.88,
                "prob_given_false": 0.05,
            },
            {
                "entity_id": "media_player.living_room_display_webos",
                "operator": "equals",
                "state": "playing",
                "prob_given_true": 0.668,
                "prob_given_false": 0.263,
            },
            {
                "entity_id": "sensor.resident_a_phone_ble_area",
                "operator": "equals",
                "state": "Living Room",
                "prob_given_true": 0.78,
                "prob_given_false": 0.08,
            },
        ],
    },
    {
        "room_name": "Front Entry",
        "mode": "open",
        "inactivity_timeout": 60,
        "grace_timeout": 30,
        "extend_timeout": 300,
        "connected_rooms": [
            "Basement Play Area",
            "Family Room",
            "Kitchen",
            "Laundry Room",
            "Living Room",
            "Upstairs Hallway & Stairs",
        ],
        "trigger_entities": [
            "binary_sensor.living_room_entry_person_occupancy",
        ],
        "sustaining_conditions": [],
        "bayesian_enabled": True,
        "bayesian_prior": 0.12,
        "bayesian_threshold": 0.75,
        "bayesian_observations": [
            {
                "entity_id": "binary_sensor.basement_stairs_top_motion",
                "prob_given_true": 0.78,
                "prob_given_false": 0.08,
            },
            {
                "entity_id": "binary_sensor.living_room_entry_person_occupancy",
                "prob_given_true": 0.96,
                "prob_given_false": 0.02,
            },
            {
                "entity_id": "sensor.resident_a_phone_ble_area",
                "operator": "equals",
                "state": "Front Entry",
                "prob_given_true": 0.78,
                "prob_given_false": 0.08,
            },
        ],
    },
    {
        "room_name": "Laundry Room",
        "mode": "open",
        "inactivity_timeout": 90,
        "grace_timeout": 30,
        "extend_timeout": 300,
        "connected_rooms": [
            "Family Room",
            "Front Entry",
            "Garage",
            "Kitchen",
            "Upstairs Hallway & Stairs",
        ],
        "boundary_entities": ["binary_sensor.laundry_room_door"],
        "trigger_entities": ["binary_sensor.laundry_room_ring_motion"],
        "sustaining_conditions": [],
        "bayesian_enabled": True,
        "bayesian_prior": 0.10,
        "bayesian_threshold": 0.75,
        "bayesian_observations": [
            {
                "entity_id": "binary_sensor.laundry_room_ring_motion",
                "prob_given_true": 0.90,
                "prob_given_false": 0.05,
            },
            {
                "entity_id": "sensor.resident_a_phone_ble_area",
                "operator": "equals",
                "state": "Laundry Room",
                "prob_given_true": 0.78,
                "prob_given_false": 0.08,
            },
        ],
    },
    {
        "room_name": "Garage",
        "mode": "bounded",
        "inactivity_timeout": 180,
        "grace_timeout": 45,
        "extend_timeout": 600,
        "connected_rooms": ["Laundry Room"],
        "boundary_entities": ["binary_sensor.laundry_room_door", "binary_sensor.garage_side_door"],
        "trigger_entities": [
            "binary_sensor.garage_parking_person_occupancy",
            "binary_sensor.garage_person_occupancy",
            "binary_sensor.garage_ring_motion",
        ],
        "sustaining_conditions": [],
        "bayesian_enabled": True,
        "bayesian_prior": 0.12,
        "bayesian_threshold": 0.75,
        "bayesian_observations": [
            {
                "entity_id": "binary_sensor.garage_parking_person_occupancy",
                "prob_given_true": 0.96,
                "prob_given_false": 0.02,
            },
            {
                "entity_id": "binary_sensor.garage_ring_motion",
                "prob_given_true": 0.88,
                "prob_given_false": 0.05,
            },
            {
                "entity_id": "sensor.resident_a_phone_ble_area",
                "operator": "equals",
                "state": "Garage",
                "prob_given_true": 0.78,
                "prob_given_false": 0.08,
            },
        ],
    },
    {
        "room_name": "Master Bedroom",
        "mode": "open",
        "inactivity_timeout": 300,
        "grace_timeout": 45,
        "extend_timeout": 600,
        "connected_rooms": ["Master Bathroom", "Upstairs Hallway & Stairs"],
        "trigger_entities": [
            "binary_sensor.master_bed_person_occupancy",
            "binary_sensor.master_open_area_person_occupancy",
            "binary_sensor.master_bedroom_walkway_person_occupancy",
        ],
        "sustaining_conditions": [
            {
                "entity_id": "media_player.master_bedroom_tv_androidtv",
                "operator": "equals",
                "state": "playing",
            },
            {
                "entity_id": "media_player.master_bedroom_speaker",
                "operator": "equals",
                "state": "playing",
            },
        ],
        "bayesian_enabled": True,
        "bayesian_prior": 0.15,
        "bayesian_threshold": 0.75,
        "bayesian_observations": [
            {
                "entity_id": "binary_sensor.master_bedroom_motion_occupancy",
                "prob_given_true": 0.78,
                "prob_given_false": 0.08,
            },
            {
                "entity_id": "binary_sensor.master_bed_person_occupancy",
                "prob_given_true": 0.96,
                "prob_given_false": 0.02,
            },
            {
                "entity_id": "binary_sensor.master_open_area_person_occupancy",
                "prob_given_true": 0.88,
                "prob_given_false": 0.05,
            },
            {
                "entity_id": "binary_sensor.master_bedroom_walkway_person_occupancy",
                "prob_given_true": 0.88,
                "prob_given_false": 0.05,
            },
            {
                "entity_id": "binary_sensor.master_bedroom_motion",
                "prob_given_true": 0.619,
                "prob_given_false": 0.281,
            },
            {
                "entity_id": "sensor.resident_a_phone_ble_area",
                "operator": "equals",
                "state": "Master Bedroom",
                "prob_given_true": 0.78,
                "prob_given_false": 0.08,
            },
        ],
    },
    {
        "room_name": "Master Bathroom",
        "mode": "open",
        "inactivity_timeout": 600,
        "grace_timeout": 60,
        "extend_timeout": 900,
        "connected_rooms": ["Master Bedroom"],
        "trigger_entities": [
            "binary_sensor.master_bathroom_person_occupancy",
            "binary_sensor.master_bathroom_motion_occupancy",
        ],
        "sustaining_conditions": [
            {
                "entity_id": "sensor.master_bathroom_dhumidity",
                "operator": "greater_than",
                "state": "0.3",
            },
        ],
        "bayesian_enabled": True,
        "bayesian_prior": 0.12,
        "bayesian_threshold": 0.75,
        "bayesian_observations": [
            {
                "entity_id": "binary_sensor.master_bathroom_motion_occupancy",
                "prob_given_true": 0.90,
                "prob_given_false": 0.05,
            },
            {
                "entity_id": "binary_sensor.master_bathroom_person_occupancy",
                "prob_given_true": 0.96,
                "prob_given_false": 0.02,
            },
            {
                "entity_id": "sensor.master_bathroom_dhumidity",
                "operator": "greater_than",
                "state": "0.3",
                "prob_given_true": 0.668,
                "prob_given_false": 0.263,
            },
            {
                "entity_id": "sensor.resident_a_phone_ble_area",
                "operator": "equals",
                "state": "Master Bathroom",
                "prob_given_true": 0.78,
                "prob_given_false": 0.08,
            },
        ],
    },
    {
        "room_name": "Office",
        "mode": "open",
        "inactivity_timeout": 240,
        "grace_timeout": 45,
        "extend_timeout": 600,
        "connected_rooms": ["Upstairs Hallway & Stairs"],
        "trigger_entities": [
            "binary_sensor.office_desk_person_occupancy",
            "binary_sensor.sim_rig_person_occupancy",
            "binary_sensor.office_floor_person_occupancy",
        ],
        "sustaining_conditions": [],
        "bayesian_enabled": True,
        "bayesian_prior": 0.15,
        "bayesian_threshold": 0.75,
        "bayesian_observations": [
            {
                "entity_id": "binary_sensor.office_motion_occupancy",
                "prob_given_true": 0.78,
                "prob_given_false": 0.08,
            },
            {
                "entity_id": "binary_sensor.office_desk_person_occupancy",
                "prob_given_true": 0.96,
                "prob_given_false": 0.02,
            },
            {
                "entity_id": "binary_sensor.sim_rig_person_occupancy",
                "prob_given_true": 0.96,
                "prob_given_false": 0.02,
            },
            {
                "entity_id": "binary_sensor.office_floor_person_occupancy",
                "prob_given_true": 0.88,
                "prob_given_false": 0.05,
            },
            {
                "entity_id": "binary_sensor.office_motion",
                "prob_given_true": 0.619,
                "prob_given_false": 0.281,
            },
            {
                "entity_id": "binary_sensor.office_occupancy",
                "prob_given_true": 0.506,
                "prob_given_false": 0.459,
            },
            {
                "entity_id": "sensor.resident_a_phone_ble_area",
                "operator": "equals",
                "state": "Office",
                "prob_given_true": 0.78,
                "prob_given_false": 0.08,
            },
        ],
    },
    {
        "room_name": "Kids Room",
        "mode": "open",
        "inactivity_timeout": 300,
        "grace_timeout": 45,
        "extend_timeout": 600,
        "connected_rooms": ["Upstairs Hallway & Stairs"],
        "trigger_entities": ["binary_sensor.nursery_bed_person_occupancy"],
        "sustaining_conditions": [
            {"entity_id": "media_player.resident_b_s_tv", "operator": "equals", "state": "playing"},
            {"entity_id": "media_player.nursery_speaker", "operator": "equals", "state": "playing"},
        ],
        "bayesian_enabled": True,
        "bayesian_prior": 0.15,
        "bayesian_threshold": 0.75,
        "bayesian_observations": [
            {
                "entity_id": "binary_sensor.nursery_bed_person_occupancy",
                "prob_given_true": 0.96,
                "prob_given_false": 0.02,
            },
            {
                "entity_id": "binary_sensor.nursery_person_occupancy",
                "prob_given_true": 0.78,
                "prob_given_false": 0.08,
            },
            {
                "entity_id": "binary_sensor.nursery_motion",
                "prob_given_true": 0.619,
                "prob_given_false": 0.281,
            },
            {
                "entity_id": "sensor.resident_a_phone_ble_area",
                "operator": "equals",
                "state": "Kids Room",
                "prob_given_true": 0.78,
                "prob_given_false": 0.08,
            },
        ],
    },
    {
        "room_name": "Guest Room",
        "mode": "open",
        "inactivity_timeout": 300,
        "grace_timeout": 45,
        "extend_timeout": 600,
        "connected_rooms": ["Upstairs Hallway & Stairs"],
        "trigger_entities": [
            "binary_sensor.guest_room_motion_occupancy",
            "binary_sensor.guest_room_motion",
        ],
        "sustaining_conditions": [
            {"entity_id": "light.guest_room_fan_light", "operator": "equals", "state": "on"},
            {"entity_id": "light.guest_room_nightstands", "operator": "equals", "state": "on"},
        ],
        "bayesian_enabled": True,
        "bayesian_prior": 0.12,
        "bayesian_threshold": 0.75,
        "bayesian_observations": [
            {
                "entity_id": "binary_sensor.guest_room_motion_occupancy",
                "prob_given_true": 0.88,
                "prob_given_false": 0.05,
            },
            {
                "entity_id": "binary_sensor.guest_room_motion",
                "prob_given_true": 0.619,
                "prob_given_false": 0.281,
            },
            {
                "entity_id": "binary_sensor.guest_room_occupancy",
                "prob_given_true": 0.506,
                "prob_given_false": 0.459,
            },
            {
                "entity_id": "sensor.resident_a_phone_ble_area",
                "operator": "equals",
                "state": "Guest Room",
                "prob_given_true": 0.78,
                "prob_given_false": 0.08,
            },
        ],
    },
    {
        "room_name": "Upstairs Hallway & Stairs",
        "mode": "open",
        "inactivity_timeout": 60,
        "grace_timeout": 30,
        "extend_timeout": 300,
        "connected_rooms": [
            "Basement Play Area",
            "Family Room",
            "Front Entry",
            "Guest Room",
            "Kitchen",
            "Laundry Room",
            "Living Room",
            "Kids Room",
            "Master Bedroom",
            "Office",
        ],
        "trigger_entities": [
            "binary_sensor.upstairs_stairs_bottom_motion",
            "binary_sensor.upstairs_hallway_motion_occupancy",
            "binary_sensor.master_bedroom_entryway_person_occupancy",
            "binary_sensor.nursery_hallway_person_occupancy",
            "binary_sensor.office_entryway_person_occupancy",
        ],
        "sustaining_conditions": [],
        "bayesian_enabled": True,
        "bayesian_prior": 0.20,
        "bayesian_threshold": 0.75,
        "bayesian_observations": [
            {
                "entity_id": "binary_sensor.upstairs_stairs_bottom_motion",
                "prob_given_true": 0.90,
                "prob_given_false": 0.05,
            },
            {
                "entity_id": "binary_sensor.upstairs_hallway_motion_occupancy",
                "prob_given_true": 0.90,
                "prob_given_false": 0.05,
            },
            {
                "entity_id": "sensor.resident_a_phone_ble_area",
                "operator": "equals",
                "state": "Upper Level",
                "prob_given_true": 0.78,
                "prob_given_false": 0.08,
            },
        ],
    },
    {
        "room_name": "Basement Theater",
        "mode": "open",
        "inactivity_timeout": 240,
        "grace_timeout": 45,
        "extend_timeout": 600,
        "connected_rooms": ["Basement Play Area"],
        "trigger_entities": [
            "binary_sensor.basement_theater_couch_person_occupancy",
            "binary_sensor.basement_theater_playpen_person_occupancy",
            "binary_sensor.theater_rear_view_person_occupancy",
            "binary_sensor.basement_theater_floor_person_occupancy",
        ],
        "sustaining_conditions": [
            {
                "entity_id": "media_player.basement_display_webos",
                "operator": "equals",
                "state": "playing",
            },
            {
                "entity_id": "media_player.basement_tv_shield",
                "operator": "equals",
                "state": "playing",
            },
        ],
        "bayesian_enabled": True,
        "bayesian_prior": 0.15,
        "bayesian_threshold": 0.75,
        "bayesian_observations": [
            {
                "entity_id": "binary_sensor.basement_theater_couch_person_occupancy",
                "prob_given_true": 0.96,
                "prob_given_false": 0.02,
            },
            {
                "entity_id": "binary_sensor.basement_theater_playpen_person_occupancy",
                "prob_given_true": 0.96,
                "prob_given_false": 0.02,
            },
            {
                "entity_id": "binary_sensor.theater_rear_view_person_occupancy",
                "prob_given_true": 0.96,
                "prob_given_false": 0.02,
            },
            {
                "entity_id": "binary_sensor.basement_theater_floor_person_occupancy",
                "prob_given_true": 0.88,
                "prob_given_false": 0.05,
            },
            {
                "entity_id": "media_player.basement_display_webos",
                "operator": "equals",
                "state": "playing",
                "prob_given_true": 0.668,
                "prob_given_false": 0.263,
            },
            {
                "entity_id": "binary_sensor.basement_ecobee_motion",
                "prob_given_true": 0.619,
                "prob_given_false": 0.281,
            },
            {
                "entity_id": "binary_sensor.basement_ecobee_occupancy",
                "prob_given_true": 0.506,
                "prob_given_false": 0.459,
            },
            {
                "entity_id": "sensor.resident_a_phone_ble_area",
                "operator": "equals",
                "state": "Basement Theater",
                "prob_given_true": 0.78,
                "prob_given_false": 0.08,
            },
        ],
    },
    {
        "room_name": "Basement Play Area",
        "mode": "open",
        "inactivity_timeout": 180,
        "grace_timeout": 45,
        "extend_timeout": 600,
        "connected_rooms": [
            "Basement Theater",
            "Family Room",
            "Front Entry",
            "Kitchen",
            "Storage Room",
            "Upstairs Hallway & Stairs",
        ],
        "trigger_entities": [
            "binary_sensor.basement_play_floor_person_occupancy",
            "binary_sensor.basement_play_area_far_person_occupancy",
            "binary_sensor.basement_counter_person_occupancy",
            "binary_sensor.basement_bar_person_occupancy",
            "binary_sensor.basement_stairs_bottom_motion",
        ],
        "sustaining_conditions": [],
        "bayesian_enabled": True,
        "bayesian_prior": 0.15,
        "bayesian_threshold": 0.75,
        "bayesian_observations": [
            {
                "entity_id": "binary_sensor.basement_stairs_bottom_motion",
                "prob_given_true": 0.90,
                "prob_given_false": 0.05,
            },
            {
                "entity_id": "binary_sensor.basement_play_floor_person_occupancy",
                "prob_given_true": 0.96,
                "prob_given_false": 0.02,
            },
            {
                "entity_id": "binary_sensor.basement_play_area_far_person_occupancy",
                "prob_given_true": 0.96,
                "prob_given_false": 0.02,
            },
            {
                "entity_id": "binary_sensor.basement_counter_person_occupancy",
                "prob_given_true": 0.96,
                "prob_given_false": 0.02,
            },
            {
                "entity_id": "binary_sensor.basement_bar_person_occupancy",
                "prob_given_true": 0.96,
                "prob_given_false": 0.02,
            },
            {
                "entity_id": "sensor.resident_a_phone_ble_area",
                "operator": "equals",
                "state": "Basement",
                "prob_given_true": 0.78,
                "prob_given_false": 0.08,
            },
        ],
    },
    {
        "room_name": "Storage Room",
        "mode": "open",
        "inactivity_timeout": 180,
        "grace_timeout": 45,
        "extend_timeout": 600,
        "connected_rooms": ["Basement Play Area"],
        "trigger_entities": [
            "binary_sensor.storage_room_person_occupancy",
        ],
        "sustaining_conditions": [],
        "bayesian_enabled": True,
        "bayesian_prior": 0.20,
        "bayesian_threshold": 0.75,
        "bayesian_observations": [
            {
                "entity_id": "binary_sensor.storage_room_person_occupancy",
                "prob_given_true": 0.96,
                "prob_given_false": 0.02,
            },
            {
                "entity_id": "binary_sensor.storage_room_ecobee_motion",
                "prob_given_true": 0.619,
                "prob_given_false": 0.281,
            },
            {
                "entity_id": "binary_sensor.storage_room_ecobee_occupancy",
                "prob_given_true": 0.502,
                "prob_given_false": 0.484,
            },
            {
                "entity_id": "sensor.resident_a_phone_ble_area",
                "operator": "equals",
                "state": "Storage Room",
                "prob_given_true": 0.78,
                "prob_given_false": 0.08,
            },
        ],
    },
]


def load_golden_floorplan() -> dict[str, Any]:
    """Return a deep copy of the live calibrated floorplan snapshot (fallback to default)."""
    if _LIVE_SNAPSHOT_PATH.exists():
        return json.loads(_LIVE_SNAPSHOT_PATH.read_text(encoding="utf-8"))
    return copy.deepcopy(get_default_floorplan())
