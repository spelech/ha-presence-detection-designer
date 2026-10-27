"""2D Spatial Floorplan, Camera View Cone & Logical Room Linkage Compiler."""

from __future__ import annotations

import copy
import math
from typing import Any

from .const import (
    CONF_BAYESIAN_OBSERVATIONS,
    CONF_BOUNDARY_ENTITIES,
    CONF_CONNECTED_ROOMS,
    CONF_INACTIVITY_TIMEOUT,
    CONF_MODE,
    CONF_ROOM_NAME,
    CONF_TRIGGER_ENTITIES,
    BayesianWeightPreset,
    Mode,
)

# Whole-frame camera person entities that span into adjacent rooms/doorways/pathways
SPILLOVER_CAMERA_ENTITIES: dict[str, list[str]] = {
    "Living Room": ["binary_sensor.living_room_person_occupancy"],
    "Family Room": ["binary_sensor.family_room_person_occupancy"],
    "Master Bedroom": [
        "binary_sensor.master_bedroom_person_occupancy",
        "binary_sensor.master_bedroom_entryway_person_occupancy",
    ],
    "Office": [
        "binary_sensor.office_person_occupancy",
        "binary_sensor.office_entryway_person_occupancy",
    ],
    "Margot's Room": ["binary_sensor.nursery_person_occupancy"],
    "Basement Theater": [
        "binary_sensor.basement_theater_person_occupancy",
        "binary_sensor.basement_stairwell_person_occupancy",
    ],
    "Basement Play Area": [
        "binary_sensor.basement_play_area_person_occupancy",
        "binary_sensor.basement_stairwell_person_occupancy",
    ],
}

RECOMMENDED_INACTIVITY_TIMEOUTS: dict[str, int] = {
    "Front Entry": 60,
    "Living Room": 180,
    "Dining Room": 180,
    "Kitchen": 180,
    "Family Room": 180,
    "Garage": 180,
    "Master Bedroom": 300,
    "Master Bathroom": 600,
    "Office": 240,
    "Margot's Room": 300,
    "Guest Room": 300,
    "Basement Theater": 240,
    "Basement Play Area": 180,
    "Storage Room": 180,
}

DEFAULT_HOUSE_FLOORPLAN: dict[str, Any] = {
    "cameras": [
        {
            "floor": "main",
            "fov_deg": 65,
            "heading_deg": 355,
            "host_room": "Living Room",
            "id": "camera.living_room",
            "name": "Living Room Camera",
            "notes": "Covers Living Room and sightline projects directly through open archway into Front Entry.",
            "range_px": 350,
            "spills_into": ["Front Entry"],
            "x": 175,
            "y": 530,
            "zones": [
                "living_room_couch",
                "living_room_floor",
                "living_room_bay_windows",
                "living_room_entry",
            ],
            "sub_zones": [
                {
                    "id": "living_room_couch",
                    "entity_id": "binary_sensor.living_room_couch_person_occupancy",
                    "label": "Living Room Couch",
                    "room": "Living Room",
                    "x": 170,
                    "y": 370,
                    "width": 95,
                    "height": 115,
                },
                {
                    "id": "living_room_floor",
                    "entity_id": "binary_sensor.living_room_floor_person_occupancy",
                    "label": "Living Room Floor",
                    "room": "Living Room",
                    "x": 270,
                    "y": 380,
                    "width": 90,
                    "height": 110,
                },
                {
                    "id": "living_room_bay_windows",
                    "entity_id": "binary_sensor.living_room_bay_windows_person_occupancy",
                    "label": "Bay Windows",
                    "room": "Living Room",
                    "x": 175,
                    "y": 495,
                    "width": 140,
                    "height": 42,
                },
                {
                    "id": "living_room_entry",
                    "entity_id": "binary_sensor.living_room_entry_person_occupancy",
                    "label": "Front Entry Archway",
                    "room": "Front Entry",
                    "x": 380,
                    "y": 365,
                    "width": 70,
                    "height": 95,
                },
            ],
        },
        {
            "floor": "main",
            "fov_deg": 55,
            "heading_deg": 85,
            "host_room": "Dining Room",
            "id": "camera.dining_room",
            "name": "Dining Room Camera",
            "notes": "Covers Dining Room table and projects sightline down table into Living Room couch.",
            "range_px": 240,
            "spills_into": ["Living Room"],
            "x": 175,
            "y": 135,
            "zones": ["dining_room_table", "rileys_food"],
            "sub_zones": [
                {
                    "id": "dining_room_table",
                    "entity_id": "binary_sensor.dining_room_table_person_occupancy",
                    "label": "Dining Table",
                    "room": "Dining Room",
                    "x": 185,
                    "y": 175,
                    "width": 110,
                    "height": 110,
                },
                {
                    "id": "rileys_food",
                    "entity_id": "binary_sensor.rileys_food_person_occupancy",
                    "label": "Riley's Food Corner",
                    "room": "Dining Room",
                    "x": 240,
                    "y": 128,
                    "width": 70,
                    "height": 44,
                },
            ],
        },
        {
            "floor": "main",
            "fov_deg": 75,
            "heading_deg": 180,
            "host_room": "Family Room",
            "id": "camera.family_room",
            "name": "Family Room Camera",
            "notes": "Catches Family Room couch, flanks Kitchen Island, and sees pathway to Entryway and Basement.",
            "range_px": 420,
            "spills_into": ["Kitchen", "Front Entry"],
            "x": 830,
            "y": 135,
            "zones": [
                "family_room_couch",
                "family_room_recliner",
                "family_room_floor",
                "kitchen_island",
            ],
            "sub_zones": [
                {
                    "id": "family_room_couch",
                    "entity_id": "binary_sensor.family_room_couch_person_occupancy",
                    "label": "Family Room Couch",
                    "room": "Family Room",
                    "x": 665,
                    "y": 185,
                    "width": 135,
                    "height": 120,
                },
                {
                    "id": "family_room_recliner",
                    "entity_id": "binary_sensor.family_room_recliner_person_occupancy",
                    "label": "Family Room Recliner",
                    "room": "Family Room",
                    "x": 585,
                    "y": 135,
                    "width": 80,
                    "height": 75,
                },
                {
                    "id": "family_room_floor",
                    "entity_id": "binary_sensor.family_room_floor_person_occupancy",
                    "label": "Family Room Floor",
                    "room": "Family Room",
                    "x": 580,
                    "y": 215,
                    "width": 85,
                    "height": 115,
                },
                {
                    "id": "kitchen_island",
                    "entity_id": "binary_sensor.kitchen_island_person_occupancy",
                    "label": "Kitchen Island",
                    "room": "Kitchen",
                    "x": 445,
                    "y": 175,
                    "width": 110,
                    "height": 110,
                },
            ],
        },
        {
            "floor": "main",
            "fov_deg": 64,
            "heading_deg": 90,
            "host_room": "Garage",
            "id": "camera.garage",
            "name": "Garage Camera",
            "notes": "Mounted on interior wall looking South down parked car toward roll-up garage door.",
            "range_px": 170,
            "spills_into": [],
            "x": 680,
            "y": 390,
            "zones": ["garage_parking"],
            "sub_zones": [
                {
                    "id": "garage_parking",
                    "entity_id": "binary_sensor.garage_parking_person_occupancy",
                    "label": "Garage Parking Bay",
                    "room": "Garage",
                    "x": 615,
                    "y": 410,
                    "width": 140,
                    "height": 125,
                }
            ],
        },
        {
            "floor": "upstairs",
            "fov_deg": 80,
            "heading_deg": 69,
            "host_room": "Master Bedroom",
            "id": "camera.master_bedroom",
            "name": "Master Bedroom Camera",
            "notes": "Catches Master Bedroom plus entries to Upstairs Hallway and "
            "Master Bathroom/Closet.",
            "range_px": 480,
            "spills_into": ["Upstairs Hallway & Stairs", "Master Bathroom"],
            "x": 150,
            "y": 50,
            "zones": [
                "master_bed",
                "master_open_area",
                "master_bedroom_walkway",
                "master_bedroom_entryway",
                "master_bathroom",
            ],
            "sub_zones": [
                {
                    "id": "master_bed",
                    "entity_id": "binary_sensor.master_bed_person_occupancy",
                    "label": "Master Bed",
                    "room": "Master Bedroom",
                    "x": 145,
                    "y": 95,
                    "width": 130,
                    "height": 130,
                },
                {
                    "id": "master_open_area",
                    "entity_id": "binary_sensor.master_open_area_person_occupancy",
                    "label": "Master Open Floor",
                    "room": "Master Bedroom",
                    "x": 155,
                    "y": 240,
                    "width": 130,
                    "height": 140,
                },
                {
                    "id": "master_bedroom_walkway",
                    "entity_id": "binary_sensor.master_bedroom_walkway_person_occupancy",
                    "label": "Master Walkway",
                    "room": "Master Bedroom",
                    "x": 290,
                    "y": 175,
                    "width": 65,
                    "height": 180,
                },
                {
                    "id": "master_bedroom_entryway",
                    "entity_id": "binary_sensor.master_bedroom_entryway_person_occupancy",
                    "label": "Master Hallway Entry",
                    "room": "Master Bedroom",
                    "x": 315,
                    "y": 250,
                    "width": 45,
                    "height": 60,
                },
                {
                    "id": "master_bathroom",
                    "entity_id": "binary_sensor.master_bathroom_person_occupancy",
                    "label": "Master Bath Doorway",
                    "room": "Master Bathroom",
                    "x": 340,
                    "y": 380,
                    "width": 45,
                    "height": 60,
                },
            ],
        },
        {
            "floor": "upstairs",
            "fov_deg": 75,
            "heading_deg": 230,
            "host_room": "Margot's Room",
            "id": "camera.nursery",
            "name": "Nursery Camera",
            "notes": "Mounted on south wall looking northwest across bed, play floor, and dresser.",
            "range_px": 280,
            "spills_into": [],
            "x": 550,
            "y": 230,
            "zones": ["nursery_bed"],
            "sub_zones": [
                {
                    "id": "nursery_bed",
                    "entity_id": "binary_sensor.nursery_bed_person_occupancy",
                    "label": "Nursery Bed",
                    "room": "Margot's Room",
                    "x": 380,
                    "y": 60,
                    "width": 120,
                    "height": 110,
                }
            ],
        },
        {
            "floor": "upstairs",
            "fov_deg": 80,
            "heading_deg": 250,
            "host_room": "Office",
            "id": "camera.office",
            "name": "Office Camera",
            "notes": "Covers Steve's desk and sim rig with hallway door on the left periphery.",
            "range_px": 320,
            "spills_into": ["Upstairs Hallway & Stairs"],
            "x": 855,
            "y": 525,
            "zones": ["steves_desk", "sim_rig", "office_floor", "office_entryway"],
            "sub_zones": [
                {
                    "id": "steves_desk",
                    "entity_id": "binary_sensor.steves_desk_person_occupancy",
                    "label": "Steve's Desk",
                    "room": "Office",
                    "x": 725,
                    "y": 360,
                    "width": 110,
                    "height": 95,
                },
                {
                    "id": "sim_rig",
                    "entity_id": "binary_sensor.sim_rig_person_occupancy",
                    "label": "Sim Rig",
                    "room": "Office",
                    "x": 635,
                    "y": 410,
                    "width": 85,
                    "height": 100,
                },
                {
                    "id": "office_floor",
                    "entity_id": "binary_sensor.office_floor_person_occupancy",
                    "label": "Office Center Floor",
                    "room": "Office",
                    "x": 655,
                    "y": 300,
                    "width": 120,
                    "height": 95,
                },
                {
                    "id": "office_entryway",
                    "entity_id": "binary_sensor.office_entryway_person_occupancy",
                    "label": "Office Doorway",
                    "room": "Office",
                    "x": 610,
                    "y": 260,
                    "width": 55,
                    "height": 55,
                },
            ],
        },
        {
            "floor": "basement",
            "fov_deg": 90,
            "heading_deg": 235,
            "host_room": "Basement Theater",
            "id": "camera.basement_theater",
            "name": "Basement Theater Camera",
            "notes": "Covers media lounge sectional, wet bar, and catches stairwell.",
            "range_px": 350,
            "spills_into": ["Basement Play Area"],
            "x": 765,
            "y": 520,
            "zones": [
                "basement_theater_couch",
                "basement_theater_playpen",
                "basement_theater_floor",
                "basement_bar",
                "basement_play_area_far",
                "basement_stairwell",
            ],
            "sub_zones": [
                {
                    "id": "basement_theater_couch",
                    "entity_id": "binary_sensor.basement_theater_couch_person_occupancy",
                    "label": "Theater Couch",
                    "room": "Basement Theater",
                    "x": 650,
                    "y": 430,
                    "width": 110,
                    "height": 90,
                },
                {
                    "id": "basement_theater_playpen",
                    "entity_id": "binary_sensor.basement_theater_playpen_person_occupancy",
                    "label": "Theater Playpen",
                    "room": "Basement Theater",
                    "x": 645,
                    "y": 375,
                    "width": 85,
                    "height": 55,
                },
                {
                    "id": "basement_theater_floor",
                    "entity_id": "binary_sensor.basement_theater_floor_person_occupancy",
                    "label": "Theater Floor",
                    "room": "Basement Theater",
                    "x": 635,
                    "y": 395,
                    "width": 95,
                    "height": 85,
                },
                {
                    "id": "basement_bar",
                    "entity_id": "binary_sensor.basement_bar_person_occupancy",
                    "label": "Basement Wet Bar",
                    "room": "Basement Play Area",
                    "x": 520,
                    "y": 360,
                    "width": 110,
                    "height": 95,
                },
                {
                    "id": "basement_play_area_far",
                    "entity_id": "binary_sensor.basement_play_area_far_person_occupancy",
                    "label": "Play Area East",
                    "room": "Basement Play Area",
                    "x": 440,
                    "y": 280,
                    "width": 160,
                    "height": 140,
                },
                {
                    "id": "basement_stairwell",
                    "entity_id": "binary_sensor.basement_stairwell_person_occupancy",
                    "label": "Basement Stairwell",
                    "room": "Basement Play Area",
                    "x": 535,
                    "y": 450,
                    "width": 95,
                    "height": 75,
                },
            ],
        },
        {
            "floor": "basement",
            "fov_deg": 85,
            "heading_deg": 40,
            "host_room": "Basement Play Area",
            "id": "camera.basement_play_area",
            "name": "Basement Play Area Camera",
            "notes": "Covers Play Area & Counter; sees into Theater. Storage Room & "
            "Basement Bath are out of frame on left.",
            "range_px": 480,
            "spills_into": ["Basement Theater"],
            "x": 235,
            "y": 520,
            "zones": ["basement_play_floor", "basement_counter", "theater_rear_view"],
            "sub_zones": [
                {
                    "id": "basement_play_floor",
                    "entity_id": "binary_sensor.basement_play_floor_person_occupancy",
                    "label": "Play Area Main Floor",
                    "room": "Basement Play Area",
                    "x": 260,
                    "y": 240,
                    "width": 220,
                    "height": 220,
                },
                {
                    "id": "basement_counter",
                    "entity_id": "binary_sensor.basement_counter_person_occupancy",
                    "label": "Play Area North Counter",
                    "room": "Basement Play Area",
                    "x": 250,
                    "y": 70,
                    "width": 180,
                    "height": 120,
                },
                {
                    "id": "theater_rear_view",
                    "entity_id": "binary_sensor.theater_rear_view_person_occupancy",
                    "label": "Theater Rear View",
                    "room": "Basement Theater",
                    "x": 635,
                    "y": 380,
                    "width": 110,
                    "height": 110,
                },
            ],
        },
        {
            "floor": "basement",
            "fov_deg": 75,
            "heading_deg": 110,
            "host_room": "Storage Room",
            "id": "camera.storage_room",
            "name": "Storage Room Camera",
            "notes": "Covers interior Storage Room / Gym floor looking toward door to finished basement.",
            "range_px": 170,
            "spills_into": [],
            "x": 650,
            "y": 55,
            "zones": ["storage_room_workout"],
            "sub_zones": [
                {
                    "id": "storage_room_workout",
                    "entity_id": "binary_sensor.storage_room_workout_person_occupancy",
                    "label": "Gym / Workout Mat",
                    "room": "Storage Room",
                    "x": 645,
                    "y": 75,
                    "width": 125,
                    "height": 135,
                }
            ],
        },
    ],
    "sensors": [
        {
            "id": "binary_sensor.family_room_motion",
            "entity_id": "binary_sensor.family_room_motion",
            "name": "Family Room PIR (Ring)",
            "sensor_type": "pir_motion",
            "floor": "main",
            "host_room": "Family Room",
            "x": 825,
            "y": 350,
            "heading_deg": 225,
            "fov_deg": 90,
            "range_px": 260,
        },
        {
            "id": "binary_sensor.family_room_motion_4",
            "entity_id": "binary_sensor.family_room_motion_4",
            "name": "Family/Kitchen PIR (Ecobee)",
            "sensor_type": "pir_motion",
            "floor": "main",
            "host_room": "Family Room",
            "x": 575,
            "y": 145,
            "heading_deg": 170,
            "fov_deg": 110,
            "range_px": 230,
        },
        {
            "id": "binary_sensor.thermostat_motion",
            "entity_id": "binary_sensor.thermostat_motion",
            "name": "Main Thermostat PIR",
            "sensor_type": "pir_motion",
            "floor": "main",
            "host_room": "Dining Room",
            "x": 310,
            "y": 220,
            "heading_deg": 180,
            "fov_deg": 110,
            "range_px": 180,
        },
        {
            "id": "binary_sensor.keypad_motion",
            "entity_id": "binary_sensor.keypad_motion",
            "name": "Front Entry Keypad PIR",
            "sensor_type": "pir_motion",
            "floor": "main",
            "host_room": "Front Entry",
            "x": 415,
            "y": 525,
            "heading_deg": 300,
            "fov_deg": 100,
            "range_px": 170,
        },
        {
            "id": "binary_sensor.ratgdov25i_47a250_motion",
            "entity_id": "binary_sensor.ratgdov25i_47a250_motion",
            "name": "Garage Opener PIR",
            "sensor_type": "pir_motion",
            "floor": "main",
            "host_room": "Garage",
            "x": 700,
            "y": 400,
            "heading_deg": 90,
            "fov_deg": 100,
            "range_px": 170,
        },
        {
            "id": "binary_sensor.master_bedroom_motion",
            "entity_id": "binary_sensor.master_bedroom_motion",
            "name": "Master Bedroom PIR (Ecobee)",
            "sensor_type": "pir_motion",
            "floor": "upstairs",
            "host_room": "Master Bedroom",
            "x": 150,
            "y": 280,
            "heading_deg": 0,
            "fov_deg": 110,
            "range_px": 220,
        },
        {
            "id": "binary_sensor.nursery_motion",
            "entity_id": "binary_sensor.nursery_motion",
            "name": "Nursery PIR (Ecobee)",
            "sensor_type": "pir_motion",
            "floor": "upstairs",
            "host_room": "Margot's Room",
            "x": 380,
            "y": 230,
            "heading_deg": 315,
            "fov_deg": 110,
            "range_px": 210,
        },
        {
            "id": "binary_sensor.guest_room_motion",
            "entity_id": "binary_sensor.guest_room_motion",
            "name": "Guest Room PIR (Ecobee)",
            "sensor_type": "pir_motion",
            "floor": "upstairs",
            "host_room": "Guest Room",
            "x": 850,
            "y": 55,
            "heading_deg": 140,
            "fov_deg": 110,
            "range_px": 240,
        },
        {
            "id": "binary_sensor.office_motion",
            "entity_id": "binary_sensor.office_motion",
            "name": "Office PIR (Ecobee)",
            "sensor_type": "pir_motion",
            "floor": "upstairs",
            "host_room": "Office",
            "x": 850,
            "y": 275,
            "heading_deg": 145,
            "fov_deg": 110,
            "range_px": 230,
        },
        {
            "id": "binary_sensor.upper_level_keypad_motion",
            "entity_id": "binary_sensor.upper_level_keypad_motion",
            "name": "Upstairs Hallway Keypad PIR",
            "sensor_type": "pir_motion",
            "floor": "upstairs",
            "host_room": "Upstairs Hallway & Stairs",
            "x": 485,
            "y": 260,
            "heading_deg": 90,
            "fov_deg": 120,
            "range_px": 150,
        },
        {
            "id": "binary_sensor.motion_detector_basement1",
            "entity_id": "binary_sensor.motion_detector_basement1",
            "name": "Basement Theater PIR (Ring)",
            "sensor_type": "pir_motion",
            "floor": "basement",
            "host_room": "Basement Theater",
            "x": 765,
            "y": 385,
            "heading_deg": 140,
            "fov_deg": 100,
            "range_px": 200,
        },
        {
            "id": "binary_sensor.motion_sensor_gen2_motion_detection",
            "entity_id": "binary_sensor.motion_sensor_gen2_motion_detection",
            "name": "Basement Play Area PIR (Z-Wave)",
            "sensor_type": "pir_motion",
            "floor": "basement",
            "host_room": "Basement Play Area",
            "x": 235,
            "y": 60,
            "heading_deg": 45,
            "fov_deg": 105,
            "range_px": 300,
        },
        {
            "id": "binary_sensor.basement_motion",
            "entity_id": "binary_sensor.basement_motion",
            "name": "Basement PIR (Ecobee)",
            "sensor_type": "pir_motion",
            "floor": "basement",
            "host_room": "Basement Play Area",
            "x": 420,
            "y": 515,
            "heading_deg": 270,
            "fov_deg": 110,
            "range_px": 260,
        },
        {
            "id": "binary_sensor.motion_utility_room",
            "entity_id": "binary_sensor.motion_utility_room",
            "name": "Storage / Gym PIR",
            "sensor_type": "pir_motion",
            "floor": "basement",
            "host_room": "Storage Room",
            "x": 765,
            "y": 55,
            "heading_deg": 135,
            "fov_deg": 100,
            "range_px": 180,
        },
        {
            "id": "binary_sensor.front_door",
            "entity_id": "binary_sensor.front_door",
            "name": "Front Door Contact",
            "sensor_type": "door_contact",
            "floor": "main",
            "host_room": "Front Entry",
            "door_id": "door_front_entry",
            "x": 477,
            "y": 545,
        },
        {
            "id": "binary_sensor.utility_room_door",
            "entity_id": "binary_sensor.utility_room_door",
            "name": "Laundry / Garage Door Contact",
            "sensor_type": "door_contact",
            "floor": "main",
            "host_room": "Family Room",
            "door_id": "door_fr_laundry",
            "x": 625,
            "y": 370,
        },
        {
            "id": "binary_sensor.back_door",
            "entity_id": "binary_sensor.back_door",
            "name": "Back Patio Door Contact",
            "sensor_type": "door_contact",
            "floor": "main",
            "host_room": "Kitchen",
            "x": 520,
            "y": 120,
        },
        {
            "id": "binary_sensor.garage_side_door",
            "entity_id": "binary_sensor.garage_side_door",
            "name": "Garage Side Door Contact",
            "sensor_type": "door_contact",
            "floor": "main",
            "host_room": "Garage",
            "x": 845,
            "y": 450,
        },
        {
            "id": "cover.garage_door",
            "entity_id": "cover.garage_door",
            "name": "Garage Roll-Up Door",
            "sensor_type": "door_contact",
            "floor": "main",
            "host_room": "Garage",
            "x": 705,
            "y": 545,
        },
    ],
    "ble_proxies": [
        {
            "id": "living_room_speaker",
            "entity_id": "sensor.living_room_speaker_bluetooth_proxy_status",
            "name": "Living Room Speaker BLE Proxy",
            "floor": "main",
            "host_room": "Living Room",
            "x": 260,
            "y": 435,
            "radius_px": 190,
        },
        {
            "id": "family_room_speaker",
            "entity_id": "sensor.family_room_speaker_bluetooth_proxy_status",
            "name": "Family Room Speaker BLE Proxy",
            "floor": "main",
            "host_room": "Family Room",
            "x": 710,
            "y": 240,
            "radius_px": 210,
        },
        {
            "id": "master_bedroom_speaker",
            "entity_id": "sensor.master_bedroom_speaker_bluetooth_proxy_status",
            "name": "Master Bedroom Speaker BLE Proxy",
            "floor": "upstairs",
            "host_room": "Master Bedroom",
            "x": 230,
            "y": 180,
            "radius_px": 210,
        },
        {
            "id": "nursery_speaker",
            "entity_id": "sensor.nursery_speaker_bluetooth_proxy_status",
            "name": "Nursery Speaker BLE Proxy",
            "floor": "upstairs",
            "host_room": "Margot's Room",
            "x": 480,
            "y": 135,
            "radius_px": 180,
        },
        {
            "id": "office_speaker",
            "entity_id": "sensor.office_speaker_bluetooth_proxy_status",
            "name": "Office Speaker BLE Proxy",
            "floor": "upstairs",
            "host_room": "Office",
            "x": 745,
            "y": 395,
            "radius_px": 195,
        },
        {
            "id": "basement_speaker",
            "entity_id": "sensor.basement_speaker_bluetooth_proxy_status",
            "name": "Basement Speaker BLE Proxy",
            "floor": "basement",
            "host_room": "Basement Play Area",
            "x": 450,
            "y": 310,
            "radius_px": 260,
        },
    ],
    "canvas": {"height": 600, "width": 1000},
    "connections": [
        {
            "from_room": "Front Entry",
            "id": "conn_entry_lr",
            "label": "Open Archway (Entry <-> Living Room)",
            "to_room": "Living Room",
            "type": "open_passage",
        },
        {
            "from_room": "Front Entry",
            "id": "conn_entry_kitchen",
            "label": "Pathway (Entry <-> Kitchen)",
            "to_room": "Kitchen",
            "type": "open_passage",
        },
        {
            "from_room": "Front Entry",
            "id": "conn_entry_fr",
            "label": "Pathway (Entry <-> Family/Laundry/Basement)",
            "to_room": "Family Room",
            "type": "open_passage",
        },
        {
            "from_room": "Living Room",
            "id": "conn_lr_dr",
            "label": "Open Passage (Living <-> Dining)",
            "to_room": "Dining Room",
            "type": "open_passage",
        },
        {
            "from_room": "Dining Room",
            "id": "conn_dr_kitchen",
            "label": "Open Passage (Dining <-> Kitchen)",
            "to_room": "Kitchen",
            "type": "open_passage",
        },
        {
            "from_room": "Kitchen",
            "id": "conn_kitchen_fr",
            "label": "Open Concept (Kitchen <-> Family Room)",
            "to_room": "Family Room",
            "type": "open_passage",
        },
        {
            "entity_id": "binary_sensor.utility_room_door",
            "from_room": "Family Room",
            "id": "conn_fr_garage",
            "label": "Laundry / Garage Pathway",
            "to_room": "Garage",
            "type": "unmonitored_door",
        },
        {
            "from_room": "Front Entry",
            "id": "conn_entry_upstairs",
            "label": "Main Stairs to Upstairs",
            "to_room": "Upstairs Hallway & Stairs",
            "type": "stairs",
        },
        {
            "from_room": "Family Room",
            "id": "conn_fr_basement_play",
            "label": "Basement Stairs",
            "to_room": "Basement Play Area",
            "type": "stairs",
        },
        {
            "from_room": "Family Room",
            "id": "conn_fr_basement_theater",
            "label": "Basement Stairs (Partial Sightline)",
            "to_room": "Basement Theater",
            "type": "stairs",
        },
        {
            "from_room": "Upstairs Hallway & Stairs",
            "id": "conn_hall_office",
            "label": "Office Doorway (Next to Stairs)",
            "to_room": "Office",
            "type": "unmonitored_door",
        },
        {
            "from_room": "Upstairs Hallway & Stairs",
            "id": "conn_hall_guest",
            "label": "Guest Room Doorway (No Sensor)",
            "to_room": "Guest Room",
            "type": "unmonitored_door",
        },
        {
            "from_room": "Upstairs Hallway & Stairs",
            "id": "conn_hall_nursery",
            "label": "Nursery Doorway (Seen Partially by Cam)",
            "to_room": "Margot's Room",
            "type": "unmonitored_door",
        },
        {
            "from_room": "Upstairs Hallway & Stairs",
            "id": "conn_hall_master",
            "label": "Master Bedroom Entryway",
            "to_room": "Master Bedroom",
            "type": "unmonitored_door",
        },
        {
            "from_room": "Master Bedroom",
            "id": "conn_master_bath",
            "label": "Master Bath / Shower Stall Entry",
            "to_room": "Master Bathroom",
            "type": "unmonitored_door",
        },
        {
            "from_room": "Upstairs Hallway & Stairs",
            "id": "conn_hall_ubath",
            "label": "Shared Bathroom (Double Vanity & Tub)",
            "to_room": "Upstairs Bathroom",
            "type": "unmonitored_door",
        },
        {
            "from_room": "Basement Play Area",
            "id": "conn_play_theater",
            "label": "Open Basement Divide (Play <-> Theater)",
            "to_room": "Basement Theater",
            "type": "open_passage",
        },
        {
            "from_room": "Basement Play Area",
            "id": "conn_play_storage",
            "label": "Storage Room Door (No Sensor, Out of Frame Left)",
            "to_room": "Storage Room",
            "type": "unmonitored_door",
        },
        {
            "from_room": "Basement Play Area",
            "id": "conn_play_bbath",
            "label": "Basement Bath Door (No Sensor, Out of Frame Left)",
            "to_room": "Basement Bathroom",
            "type": "unmonitored_door",
        },
    ],
    "floors": [
        {"id": "upstairs", "name": "Upstairs Level", "order": 0},
        {"id": "main", "name": "Main Floor", "order": 1},
        {"id": "basement", "name": "Basement Level", "order": 2},
    ],
    "rooms": [
        {
            "entryways": [
                {
                    "id": "door_master_hallway",
                    "offset": 230,
                    "target_room": "Upstairs Hallway & Stairs",
                    "type": "door",
                    "wall": "right",
                    "width": 40,
                },
                {
                    "id": "door_master_bath",
                    "offset": 360,
                    "target_room": "Master Bathroom",
                    "type": "door",
                    "wall": "right",
                    "width": 40,
                },
            ],
            "floor": "upstairs",
            "height": 505,
            "id": "master_bedroom",
            "name": "Master Bedroom",
            "notes": "West wing front-to-back. Camera catches bed, doorway to Upstairs "
            "Hallway, and entry to Master Bath / WIC.",
            "room_type": "room",
            "width": 225,
            "x": 135,
            "y": 35,
        },
        {
            "entryways": [
                {
                    "id": "door_mbath_master",
                    "offset": 15,
                    "target_room": "Master Bedroom",
                    "type": "door",
                    "wall": "left",
                    "width": 40,
                }
            ],
            "floor": "upstairs",
            "height": 160,
            "id": "master_bathroom",
            "name": "Master Bathroom",
            "notes": "En-suite bath next to WIC with single sink and shower stall; entry "
            "caught by master bedroom camera.",
            "room_type": "room",
            "width": 140,
            "x": 360,
            "y": 380,
        },
        {
            "entryways": [
                {
                    "id": "door_ubath_hall",
                    "offset": 35,
                    "target_room": "Upstairs Hallway & Stairs",
                    "type": "door",
                    "wall": "top",
                    "width": 36,
                }
            ],
            "floor": "upstairs",
            "height": 160,
            "id": "upstairs_bathroom",
            "name": "Upstairs Bathroom",
            "notes": "Shared upstairs bathroom with double vanity and soaking tub, "
            "opening off hallway.",
            "room_type": "room",
            "width": 110,
            "x": 500,
            "y": 380,
        },
        {
            "entryways": [
                {
                    "id": "door_margot_hallway",
                    "offset": 160,
                    "target_room": "Upstairs Hallway & Stairs",
                    "type": "door",
                    "wall": "bottom",
                    "width": 36,
                }
            ],
            "floor": "upstairs",
            "height": 215,
            "id": "margots_room",
            "name": "Margot's Room",
            "notes": "Top-middle bedroom; doorway opens to Upstairs Hallway.",
            "room_type": "room",
            "width": 250,
            "x": 360,
            "y": 35,
        },
        {
            "entryways": [
                {
                    "id": "door_guest_hallway",
                    "offset": 30,
                    "target_room": "Upstairs Hallway & Stairs",
                    "type": "door",
                    "wall": "bottom",
                    "width": 36,
                }
            ],
            "floor": "upstairs",
            "height": 215,
            "id": "guest_room",
            "name": "Guest Room",
            "notes": "Top-right bedroom; doorway opens to Upstairs Hallway.",
            "room_type": "room",
            "width": 260,
            "x": 610,
            "y": 35,
        },
        {
            "entryways": [
                {
                    "id": "door_office_hallway",
                    "offset": 20,
                    "target_room": "Upstairs Hallway & Stairs",
                    "type": "door",
                    "wall": "left",
                    "width": 40,
                }
            ],
            "floor": "upstairs",
            "height": 290,
            "id": "office",
            "name": "Office",
            "notes": "Bottom-right bedroom / office next to stairs landing; camera sees "
            "desk, rig, and doorway.",
            "room_type": "room",
            "width": 260,
            "x": 610,
            "y": 250,
        },
        {
            "entryways": [
                {
                    "id": "door_hall_master",
                    "offset": 15,
                    "target_room": "Master Bedroom",
                    "type": "door",
                    "wall": "left",
                    "width": 40,
                },
                {
                    "id": "door_hall_margot",
                    "offset": 160,
                    "target_room": "Margot's Room",
                    "type": "door",
                    "wall": "top",
                    "width": 36,
                },
                {
                    "id": "door_hall_guest",
                    "offset": 10,
                    "target_room": "Guest Room",
                    "type": "door",
                    "wall": "right",
                    "width": 36,
                },
                {
                    "id": "door_hall_office",
                    "offset": 20,
                    "target_room": "Office",
                    "type": "door",
                    "wall": "right",
                    "width": 40,
                },
                {
                    "id": "passage_hall_stairs",
                    "offset": 180,
                    "target_room": "Front Entry",
                    "type": "open_passage",
                    "wall": "bottom",
                    "width": 55,
                },
            ],
            "floor": "upstairs",
            "height": 130,
            "id": "upstairs_hallway",
            "name": "Upstairs Hallway & Stairs",
            "notes": "Connects Master Bedroom, Margot's Room, Guest Room, Office, "
            "Bathrooms, and Stairs to Front Entry.",
            "room_type": "transit",
            "width": 250,
            "x": 360,
            "y": 250,
        },
        {
            "entryways": [
                {
                    "id": "arch_dr_kitchen",
                    "offset": 20,
                    "target_room": "Kitchen",
                    "type": "open_passage",
                    "wall": "right",
                    "width": 160,
                },
                {
                    "id": "arch_dr_lr",
                    "offset": 20,
                    "target_room": "Living Room",
                    "type": "open_passage",
                    "wall": "bottom",
                    "width": 120,
                },
            ],
            "floor": "main",
            "height": 205,
            "id": "dining_room",
            "name": "Dining Room",
            "notes": "Northwest room opening to Kitchen and Living Room.",
            "room_type": "room",
            "width": 160,
            "x": 160,
            "y": 120,
        },
        {
            "entryways": [
                {
                    "id": "arch_lr_dr",
                    "offset": 20,
                    "target_room": "Dining Room",
                    "type": "open_passage",
                    "wall": "top",
                    "width": 120,
                },
                {
                    "id": "arch_lr_entry",
                    "offset": 30,
                    "target_room": "Front Entry",
                    "type": "open_passage",
                    "wall": "right",
                    "width": 130,
                },
            ],
            "floor": "main",
            "height": 220,
            "id": "living_room",
            "name": "Living Room",
            "notes": "Southwest room with front bay windows; opens to Dining Room and "
            "Front Entryway.",
            "room_type": "room",
            "width": 235,
            "x": 160,
            "y": 325,
        },
        {
            "entryways": [
                {
                    "id": "arch_kitchen_dr",
                    "offset": 20,
                    "target_room": "Dining Room",
                    "type": "open_passage",
                    "wall": "left",
                    "width": 160,
                },
                {
                    "id": "arch_kitchen_fr",
                    "offset": 20,
                    "target_room": "Family Room",
                    "type": "open_passage",
                    "wall": "right",
                    "width": 170,
                },
                {
                    "id": "path_kitchen_entry",
                    "offset": 75,
                    "target_room": "Front Entry",
                    "type": "open_passage",
                    "wall": "bottom",
                    "width": 100,
                },
            ],
            "floor": "main",
            "height": 205,
            "id": "kitchen",
            "name": "Kitchen",
            "notes": "Central kitchen with island counter and breakfast nook; open to "
            "Family Room, Dining Room, and Front Entry.",
            "room_type": "room",
            "width": 245,
            "x": 320,
            "y": 120,
        },
        {
            "entryways": [
                {
                    "id": "arch_entry_lr",
                    "offset": 30,
                    "target_room": "Living Room",
                    "type": "open_passage",
                    "wall": "left",
                    "width": 130,
                },
                {
                    "id": "path_entry_kitchen",
                    "offset": 0,
                    "target_room": "Kitchen",
                    "type": "open_passage",
                    "wall": "top",
                    "width": 100,
                },
                {
                    "id": "path_entry_fr",
                    "offset": 10,
                    "target_room": "Family Room",
                    "type": "open_passage",
                    "wall": "right",
                    "width": 60,
                },
                {
                    "id": "door_front_entry",
                    "offset": 60,
                    "target_room": "Exterior",
                    "type": "door",
                    "wall": "bottom",
                    "width": 45,
                },
            ],
            "floor": "main",
            "height": 220,
            "id": "front_entry",
            "name": "Front Entry",
            "notes": "Main foyer with front door, powder room, stairs up to Floor 3, and "
            "pathways to Living Room and Kitchen.",
            "room_type": "room",
            "width": 170,
            "x": 395,
            "y": 325,
        },
        {
            "entryways": [
                {
                    "id": "arch_fr_kitchen",
                    "offset": 20,
                    "target_room": "Kitchen",
                    "type": "open_passage",
                    "wall": "left",
                    "width": 170,
                },
                {
                    "id": "path_fr_entry",
                    "offset": 10,
                    "target_room": "Front Entry",
                    "type": "open_passage",
                    "wall": "bottom",
                    "width": 60,
                },
                {
                    "id": "door_fr_laundry",
                    "offset": 40,
                    "target_room": "Garage",
                    "type": "door",
                    "wall": "bottom",
                    "width": 40,
                },
            ],
            "floor": "main",
            "height": 250,
            "id": "family_room",
            "name": "Family Room",
            "notes": "East living area with north fireplace; open to Kitchen and connects "
            "to Laundry and Front Entry.",
            "room_type": "room",
            "width": 280,
            "x": 565,
            "y": 120,
        },
        {
            "entryways": [
                {
                    "id": "door_garage_fr",
                    "offset": 40,
                    "target_room": "Family Room",
                    "type": "door",
                    "wall": "top",
                    "width": 40,
                }
            ],
            "floor": "main",
            "height": 175,
            "id": "garage",
            "name": "Garage",
            "notes": "Includes laundry room and garage entry walkway connecting off Family Room.",
            "room_type": "room",
            "width": 280,
            "x": 565,
            "y": 370,
        },
        {
            "entryways": [
                {
                    "id": "door_play_storage",
                    "offset": 40,
                    "target_room": "Storage Room",
                    "type": "door",
                    "wall": "right",
                    "width": 40,
                },
                {
                    "id": "door_play_bbath",
                    "offset": 235,
                    "target_room": "Basement Bathroom",
                    "type": "door",
                    "wall": "right",
                    "width": 36,
                },
                {
                    "id": "arch_play_theater",
                    "offset": 375,
                    "target_room": "Basement Theater",
                    "type": "open_passage",
                    "wall": "right",
                    "width": 110,
                },
            ],
            "floor": "basement",
            "height": 495,
            "id": "basement_play_area",
            "name": "Basement Play Area",
            "notes": "Main basement recreation room with west fireplace and south "
            "alcoves; connects to Storage and Theater.",
            "room_type": "room",
            "width": 415,
            "x": 220,
            "y": 40,
        },
        {
            "entryways": [
                {
                    "id": "door_storage_play",
                    "offset": 40,
                    "target_room": "Basement Play Area",
                    "type": "door",
                    "wall": "left",
                    "width": 40,
                }
            ],
            "floor": "basement",
            "height": 185,
            "id": "storage_room",
            "name": "Storage Room",
            "notes": "Upper northeast wet bar / storage area; door connects to Recreation Room.",
            "room_type": "room",
            "width": 145,
            "x": 635,
            "y": 40,
        },
        {
            "entryways": [
                {
                    "id": "door_bbath_play",
                    "offset": 10,
                    "target_room": "Basement Play Area",
                    "type": "door",
                    "wall": "left",
                    "width": 36,
                }
            ],
            "floor": "basement",
            "height": 145,
            "id": "basement_bathroom",
            "name": "Basement Bathroom",
            "notes": "Full basement bathroom off recreation hallway.",
            "room_type": "transit",
            "width": 145,
            "x": 635,
            "y": 225,
        },
        {
            "entryways": [
                {
                    "id": "arch_theater_play",
                    "offset": 5,
                    "target_room": "Basement Play Area",
                    "type": "open_passage",
                    "wall": "left",
                    "width": 110,
                }
            ],
            "floor": "basement",
            "height": 165,
            "id": "basement_theater",
            "name": "Basement Theater",
            "notes": "Lower northeast basement hallway / media lounge and stair exit.",
            "room_type": "room",
            "width": 145,
            "x": 635,
            "y": 370,
        },
    ],
    "version": 2,
}


def get_default_floorplan() -> dict[str, Any]:
    """Return a deep copy of the default 3-floor house spatial floorplan."""
    return copy.deepcopy(DEFAULT_HOUSE_FLOORPLAN)


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
    """Compute 2D visibility polygon vertices for camera origin occluded by solid wall segments."""
    cx = float(cam.get("x", 0))
    cy = float(cam.get("y", 0))
    heading = float(cam.get("heading_deg", 0))
    fov = max(5.0, min(360.0, float(cam.get("fov_deg", 90))))
    reach = max(10.0, float(cam.get("range_px", 200)))

    start_deg = heading - fov / 2.0
    end_deg = heading + fov / 2.0

    angles: set[float] = set()
    num_steps = max(8, int(math.ceil(fov / step_deg)))
    for i in range(num_steps + 1):
        angles.add(round(start_deg + (i / num_steps) * fov, 4))

    for (x1, y1), (x2, y2) in solid_segments:
        for px, py in ((x1, y1), (x2, y2)):
            dx = px - cx
            dy = py - cy
            dist = math.hypot(dx, dy)
            if dist < 1e-3 or dist > reach * 1.5:
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
        min_t = reach
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
    """Compute percentage (0..100) of `room_box` area covered by `cam`'s 2D view cone on the same floor, occluded by walls if provided."""
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

    hits = 0
    total = grid_steps * grid_steps
    for ix in range(grid_steps):
        px = rx + (ix + 0.5) * (rw / grid_steps)
        for iy in range(grid_steps):
            py = ry + (iy + 0.5) * (rh / grid_steps)
            if point_in_cone(px, py, cx, cy, heading, fov, reach):
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

    # 1. Build raw adjacency & connection types per room
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

    # Expand 2-hop connections through transit hubs (e.g. Upstairs Hallway & Stairs)
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

    # 2. Evaluate perimeter seal eligibility (`can_be_bounded`)
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

    # Build solid segments per floor
    floor_segments: dict[str, list[tuple[tuple[float, float], tuple[float, float]]]] = {}
    for fl in fp.get("floors", []) or []:
        fl_id = str(fl.get("id", ""))
        rooms_on_fl = [r for r in rooms_list if str(r.get("floor", "")) == fl_id]
        floor_segments[fl_id] = extract_floor_wall_segments(rooms_on_fl)

    # 3. Compute camera cone coverage & cross-room spillover
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
                        {
                            "camera_id": cam_id,
                            "host_room": host_room,
                            "overlap_pct": eff_pct,
                        }
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

    # 3b. Compute PIR motion sensor cones & coverage
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

    # 3c. Compute BLE proxy radial coverage
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

    # 4. Identify spatial ambiguities & blind spots
    ambiguities: list[dict[str, Any]] = []

    # 4a. Camera spillover ambiguities
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

    # 4b. Blind / out-of-frame pockets
    for r_name, _r_obj in rooms_by_name.items():
        cov = room_coverage.get(r_name, {})
        if cov.get("max_coverage_pct", 0.0) == 0.0:
            if r_name == "Master Bathroom":
                ambiguities.append(
                    {
                        "severity": "medium",
                        "category": "blind_pocket",
                        "title": "Master Bathroom & Closet interior is out of camera view",
                        "rooms": ["Master Bathroom", "Master Bedroom"],
                        "camera_id": "camera.master_bedroom",
                        "description": (
                            "`camera.master_bedroom` catches the Master Bathroom/Closet entry doorway "
                            "(`binary_sensor.master_bathroom_person_occupancy`), but the interior shower, vanity, "
                            "and closet are out of frame."
                        ),
                        "resolution": (
                            "Trigger on `master_bathroom_person_occupancy` doorway entry, sustain on shower fan, "
                            "lights, or humidity derivative (`> 0.3`), and hand off timer when returning to Master Bedroom."
                        ),
                    }
                )
            elif r_name == "Guest Room":
                ambiguities.append(
                    {
                        "severity": "medium",
                        "category": "blind_pocket",
                        "title": "Guest Room (between Nursery & Office) has zero camera coverage",
                        "rooms": ["Guest Room", "Margot's Room", "Office"],
                        "camera_id": None,
                        "description": (
                            "Guest Room sits between Margot's Room and Office off the Upstairs Hallway with "
                            "no camera view cone and its Ecobee sensor awaiting battery replacement."
                        ),
                        "resolution": (
                            "Use `guest_room_motion` (moderate) + `guest_room_occupancy` (supporting) + BLE "
                            "corroboration, with instant timer hand-off to Office, Nursery, and Master Bedroom."
                        ),
                    }
                )
            elif r_name == "Basement Bathroom":
                ambiguities.append(
                    {
                        "severity": "low",
                        "category": "blind_pocket",
                        "title": "Basement Bathroom is out of frame left of Play Area camera",
                        "rooms": ["Basement Play Area", "Storage Room"],
                        "camera_id": "camera.basement_play_area",
                        "description": (
                            "Located to the left of `camera.basement_play_area` alongside Storage Room, "
                            "with an unmonitored door and no interior sensors."
                        ),
                        "resolution": (
                            "Treat left edge exit from Basement Play Area as an unsealed transition; "
                            "Storage Room uses its internal `camera.storage_room` to distinguish gym/storage entry."
                        ),
                    }
                )

    # 4c. Fake sealed perimeter warnings
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
                            "Using Wasp-in-a-Box `bounded` mode locks occupancy as `occupied_sealed` when "
                            "the exterior door is closed."
                        ),
                        "resolution": f"Switch {r_name} to `mode: open` with Cross-Room Timer Hand-Off.",
                    }
                )

    # 4d. Vertical BLE floor-to-floor stack detection
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

    # 5. Build compiled per-room rules summary
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
    }


def apply_compiled_topology_to_config(
    config: dict[str, Any],
    compiled_topology: dict[str, Any],
) -> dict[str, Any]:
    """Consume compiled floorplan linkages, open-mode enforcement, and camera spillover rules into a room config."""
    updated = copy.deepcopy(config)
    room_name = str(updated.get(CONF_ROOM_NAME, ""))
    rules = compiled_topology.get("compiled_room_rules", {}).get(room_name)
    if not rules:
        return updated

    # 1. Set logical connected_rooms for instant Cross-Room Timer Hand-Off
    updated[CONF_CONNECTED_ROOMS] = list(rules.get("connected_rooms", []))

    # 2. Enforce Mode.OPEN if the room has unsealed exits
    if not rules.get("can_be_bounded", False):
        updated[CONF_MODE] = str(Mode.OPEN)
        updated[CONF_BOUNDARY_ENTITIES] = []

    # 3. Apply tuned inactivity timeout so vacated rooms hand off cleanly
    if rules.get("recommended_inactivity_timeout"):
        updated[CONF_INACTIVITY_TIMEOUT] = int(rules["recommended_inactivity_timeout"])

    # 4. Downgrade whole-frame spillover camera sensors & doorway bleed sensors
    spillover_eids = set(rules.get("spillover_entities_to_downgrade", []) or [])
    if room_name == "Guest Room":
        # Ensure Guest Room motion is moderate (not strong solo) and sticky occupancy is supporting
        spillover_eids.add("binary_sensor.guest_room_motion")

    if spillover_eids:
        triggers = [
            t
            for t in (updated.get(CONF_TRIGGER_ENTITIES, []) or [])
            if str(t.get("entity_id") if isinstance(t, dict) else t) not in spillover_eids
        ]
        updated[CONF_TRIGGER_ENTITIES] = triggers

    obs_list = list(updated.get(CONF_BAYESIAN_OBSERVATIONS, []) or [])
    new_obs: list[dict[str, Any]] = []
    for obs in obs_list:
        if not isinstance(obs, dict):
            continue
        item = dict(obs)
        eid = str(item.get("entity_id", ""))
        if eid in spillover_eids:
            if eid in ("binary_sensor.nursery_person_occupancy", "binary_sensor.guest_room_motion"):
                item["preset"] = str(BayesianWeightPreset.MODERATE)
                item["prob_given_true"] = 0.72
                item["prob_given_false"] = 0.12
            else:
                item["preset"] = str(BayesianWeightPreset.SUPPORTING)
                item["prob_given_true"] = 0.45
                item["prob_given_false"] = 0.20
        elif room_name == "Guest Room" and eid == "binary_sensor.guest_room_occupancy":
            item["preset"] = str(BayesianWeightPreset.SUPPORTING)
            item["prob_given_true"] = 0.45
            item["prob_given_false"] = 0.20
        elif eid == "sensor.tab_s10_lite_ble_area" and room_name != "Master Bedroom":
            # Prevent dual-BLE vertical bleed from crossing 75% without a room sensor
            item["preset"] = str(BayesianWeightPreset.SUPPORTING)
            item["prob_given_true"] = 0.45
            item["prob_given_false"] = 0.25
        new_obs.append(item)
    updated[CONF_BAYESIAN_OBSERVATIONS] = new_obs

    return updated
