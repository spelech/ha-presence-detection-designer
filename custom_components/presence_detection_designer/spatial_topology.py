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
    "Powder Bath": 300,
    "Living Room": 180,
    "Dining Room": 180,
    "Kitchen": 180,
    "Family Room": 180,
    "Laundry Room": 180,
    "Garage": 180,
    "Master Bedroom": 300,
    "Master W.I.C": 300,
    "Master Bathroom": 600,
    "Upstairs Bathroom": 600,
    "Office": 240,
    "Margot's Room": 300,
    "Guest Room": 300,
    "Basement Theater": 240,
    "Basement Play Area": 180,
    "Basement Bathroom": 600,
    "Storage Room": 180,
}

DEVICE_MODEL_PRESETS: dict[str, dict[str, Any]] = {
    "tapo_c110_corner": {
        "id": "tapo_c110_corner",
        "name": "TP-Link Tapo C110 (Corner / Wall Mount)",
        "label": "TP-Link Tapo C110 (Corner / Wall Mount)",
        "category": "camera",
        "device_type": "camera",
        "fov_deg": 110,
        "horizontal_fov_deg": 110,
        "vertical_fov_deg": 62,
        "mount_pitch_deg": 15,
        "default_range_px": 560,
        "description": "Standard 110° wide-angle corner or upper-wall mount covering both adjacent walls.",
    },
    "tapo_c110_overhead": {
        "id": "tapo_c110_overhead",
        "name": "TP-Link Tapo C110 (High Steep Downward Pitch)",
        "label": "TP-Link Tapo C110 (High Steep Downward Pitch)",
        "category": "camera",
        "device_type": "camera",
        "fov_deg": 164,
        "horizontal_fov_deg": 110,
        "vertical_fov_deg": 62,
        "mount_pitch_deg": 62,
        "default_range_px": 250,
        "description": "Same Tapo C110 110° sensor pitched steeply down (~62°) on a flat wall (e.g., Garage), widening the near-wall 2D floor footprint to 164°.",
    },
    "reolink_rlc_810a": {
        "id": "reolink_rlc_810a",
        "name": "Reolink RLC-810A / PoE Bullet (87° FOV)",
        "label": "Reolink RLC-810A / PoE Bullet (87° FOV)",
        "category": "camera",
        "device_type": "camera",
        "fov_deg": 87,
        "horizontal_fov_deg": 87,
        "vertical_fov_deg": 47,
        "mount_pitch_deg": 15,
        "default_range_px": 500,
        "description": "4K PoE bullet camera with 87° horizontal field of view.",
    },
    "unifi_g4_instant": {
        "id": "unifi_g4_instant",
        "name": "UniFi Protect G4/G5 Instant (102° FOV)",
        "label": "UniFi Protect G4/G5 Instant (102° FOV)",
        "category": "camera",
        "device_type": "camera",
        "fov_deg": 102,
        "horizontal_fov_deg": 102,
        "vertical_fov_deg": 55,
        "mount_pitch_deg": 15,
        "default_range_px": 450,
        "description": "Compact wide-angle Wi-Fi camera with 102° horizontal field of view.",
    },
    "ecobee_smart_sensor": {
        "id": "ecobee_smart_sensor",
        "name": "Ecobee SmartSensor (110° Thermal PIR)",
        "label": "Ecobee SmartSensor (110° Thermal PIR)",
        "category": "pir_motion",
        "device_type": "pir_motion",
        "manufacturer": "ecobee",
        "model": "SmartSensor / Room Sensor",
        "fov_deg": 110,
        "default_range_px": 230,
        "range_ft": 15.0,
        "range_m": 4.5,
        "cooldown_sec": 1800,
        "description": "110° horizontal thermal PIR occupancy/motion sensor (15 ft / 4.5 m range).",
    },
    "ikea_vallhorn_pir": {
        "id": "ikea_vallhorn_pir",
        "name": "IKEA VALLHORN Wireless Motion Sensor (120°/5m + 60°/10m Dual-Lobe PIR)",
        "label": "IKEA VALLHORN Wireless Motion Sensor (120°/5m + 60°/10m)",
        "category": "pir_motion",
        "device_type": "pir_motion",
        "manufacturer": "IKEA of Sweden",
        "model": "VALLHORN E2134 (405.043.48)",
        "fov_deg": 120,
        "default_range_px": 260,
        "inner_fov_deg": 60,
        "inner_range_px": 520,
        "range_ft": 16.4,
        "range_m": 5.0,
        "inner_range_ft": 32.8,
        "inner_range_m": 10.0,
        "cooldown_sec": 60,
        "description": "Zigbee 3.0 dual-lobe Fresnel PIR: 120° wide-angle peripheral zone to 5m (16.4 ft / 260px) plus 60° center beam reaching 10m (32.8 ft / 520px).",
    },
    "wyze_sense_pir": {
        "id": "wyze_sense_pir",
        "name": "Wyze Sense Motion Sensor v1 (120° Wide PIR, 26 ft / 7.8m)",
        "label": "Wyze Sense Motion Sensor v1 (120° PIR, 26 ft)",
        "category": "pir_motion",
        "device_type": "pir_motion",
        "manufacturer": "Wyze",
        "model": "WYZESENSE-PIR (WYZEMS1)",
        "fov_deg": 120,
        "default_range_px": 405,
        "range_ft": 25.5,
        "range_m": 7.8,
        "mount_pitch_deg": 12,
        "cooldown_sec": 45,
        "description": "915MHz ultra-compact 120° wide-angle PIR motion sensor with downward-slanted Fresnel lens and 25-26 ft (7.8m / 405px) range.",
    },
    "ring_alarm_pir_gen2": {
        "id": "ring_alarm_pir_gen2",
        "name": "Ring Alarm Motion Detector Gen 2 (90° PIR)",
        "label": "Ring Alarm Motion Detector Gen 2 (90° PIR)",
        "category": "pir_motion",
        "device_type": "pir_motion",
        "manufacturer": "Ring",
        "model": "4SP1SZ (Gen 2 Z-Wave)",
        "fov_deg": 90,
        "default_range_px": 260,
        "range_ft": 16.5,
        "range_m": 5.0,
        "cooldown_sec": 60,
        "description": "90° corner/wall Z-Wave PIR motion detector.",
    },
    "ring_keypad_pir": {
        "id": "ring_keypad_pir",
        "name": "Ring Alarm Keypad Proximity PIR (100°)",
        "label": "Ring Alarm Keypad Proximity PIR (100°)",
        "category": "pir_motion",
        "device_type": "pir_motion",
        "manufacturer": "Ring",
        "model": "4AK1SZ Keypad",
        "fov_deg": 100,
        "default_range_px": 165,
        "range_ft": 10.5,
        "range_m": 3.2,
        "cooldown_sec": 30,
        "description": "Short-range proximity PIR built into wall keypad.",
    },
    "aqara_fp2_mmwave": {
        "id": "aqara_fp2_mmwave",
        "name": "Aqara FP2 60GHz mmWave Radar (120°)",
        "label": "Aqara FP2 60GHz mmWave Radar (120°)",
        "category": "pir_motion",
        "device_type": "pir_motion",
        "manufacturer": "Aqara",
        "model": "PS-S02D (FP2)",
        "fov_deg": 120,
        "default_range_px": 340,
        "range_ft": 21.5,
        "range_m": 6.5,
        "cooldown_sec": 5,
        "description": "Wide 120° multi-zone 60GHz mmWave radar presence sensor.",
    },
    "apollo_msr_2": {
        "id": "apollo_msr_2",
        "name": "Apollo MSR-2 / LD2410 mmWave (110°)",
        "label": "Apollo MSR-2 / LD2410 mmWave (110°)",
        "category": "pir_motion",
        "device_type": "pir_motion",
        "manufacturer": "Apollo Automation",
        "model": "MSR-2 (HLK-LD2410B)",
        "fov_deg": 110,
        "default_range_px": 300,
        "range_ft": 19.0,
        "range_m": 5.8,
        "cooldown_sec": 5,
        "description": "24GHz mmWave radar presence sensor.",
    },
    "ratgdo_pir": {
        "id": "ratgdo_pir",
        "name": "ratgdo v2.5i Garage Opener PIR (100°)",
        "label": "ratgdo v2.5i Garage Opener PIR (100°)",
        "category": "pir_motion",
        "device_type": "pir_motion",
        "manufacturer": "ratgdo",
        "model": "v2.5i Security+ Wall Panel",
        "fov_deg": 100,
        "default_range_px": 175,
        "range_ft": 11.0,
        "range_m": 3.4,
        "cooldown_sec": 60,
        "description": "Garage door wall control panel motion sensor.",
    },
    "wyze_sense_contact": {
        "id": "wyze_sense_contact",
        "name": "Wyze Sense Contact Sensor v1 (915MHz Magnetic Reed)",
        "label": "Wyze Sense Contact Sensor v1 (915MHz Reed)",
        "category": "door_contact",
        "device_type": "door_contact",
        "manufacturer": "Wyze",
        "model": "WYZESENSE-CONTACT (WYZEC1)",
        "actuation_gap_mm": 20,
        "response_ms": 150,
        "description": "Ultra-compact 915MHz magnetic door/window reed contact sensor (<=20mm actuation gap) via WyzeSense2MQTT bridge.",
    },
    "ring_contact_sensor": {
        "id": "ring_contact_sensor",
        "name": "Ring Alarm Contact Sensor Gen 2 (Z-Wave Reed)",
        "label": "Ring Alarm Contact Sensor Gen 2 (Z-Wave)",
        "category": "door_contact",
        "device_type": "door_contact",
        "manufacturer": "Ring",
        "model": "5AT2S2 (Gen 2 Z-Wave)",
        "actuation_gap_mm": 25,
        "response_ms": 200,
        "description": "Z-Wave perimeter door and window magnetic reed contact sensor.",
    },
    "google_home_speaker_ble": {
        "id": "google_home_speaker_ble",
        "name": "Google Home / Nest Speaker BLE Proxy",
        "label": "Google Home / Nest Speaker BLE Proxy",
        "category": "ble_proxy",
        "device_type": "ble_proxy",
        "radius_px": 210,
        "description": "Indoor smart speaker Bluetooth Low Energy RSSI anchor.",
    },
}

DEFAULT_HOUSE_FLOORPLAN: dict[str, Any] = {
    "version": 4,
    "canvas": {"width": 1000, "height": 580},
    "floor_wall_segments": {
        "upstairs": [
            [[126, 32], [874, 32]],
            [[874, 32], [874, 548]],
            [[126, 548], [874, 548]],
            [[126, 32], [126, 548]],
            [[353, 32], [353, 256]],
            [[353, 312], [353, 484]],
            [[563, 32], [563, 143]],
            [[563, 143], [610, 143]],
            [[610, 32], [610, 42]],
            [[610, 130], [610, 254]],
            [[563, 143], [563, 152]],
            [[563, 242], [563, 254]],
            [[353, 254], [508, 254]],
            [[508, 254], [508, 258]],
            [[508, 258], [558, 258]],
            [[558, 258], [558, 254]],
            [[558, 254], [612, 254]],
            [[662, 254], [874, 254]],
            [[353, 316], [368, 316]],
            [[446, 316], [508, 316]],
            [[553, 316], [610, 316]],
            [[353, 355], [462, 355]],
            [[462, 316], [462, 449]],
            [[353, 484], [398, 484]],
            [[398, 484], [440, 484]],
            [[440, 449], [560, 449]],
            [[560, 417], [610, 417]],
            [[560, 417], [560, 449]],
            [[610, 316], [610, 548]],
            [[440, 449], [440, 498]],
            [[440, 544], [440, 548]],
            [[671, 254], [671, 258]],
            [[671, 258], [665, 258]],
            [[665, 258], [665, 315]],
            [[665, 315], [671, 315]],
            [[671, 315], [671, 548]],
            [[735, 254], [735, 296]],
            [[735, 296], [750, 296]],
            [[858, 296], [874, 296]],
        ],
        "main": [
            [[68, 87], [832, 87]],
            [[68, 87], [68, 508]],
            [[68, 508], [534, 508]],
            [[832, 87], [832, 290]],
            [[251, 87], [251, 190]],
            [[251, 250], [251, 290]],
            [[68, 290], [96, 290]],
            [[212, 290], [251, 290]],
            [[251, 290], [410, 290]],
            [[341, 290], [341, 418]],
            [[410, 290], [410, 345]],
            [[341, 382], [410, 382]],
            [[410, 382], [410, 418]],
            [[341, 502], [341, 508]],
            [[534, 290], [832, 290]],
            [[534, 290], [534, 300]],
            [[534, 348], [534, 508]],
            [[708, 290], [708, 421]],
            [[534, 421], [832, 421]],
            [[534, 421], [534, 555]],
            [[832, 421], [832, 555]],
            [[534, 555], [832, 555]],
        ],
        "basement": [
            [[93, 42], [695, 42]],
            [[93, 42], [93, 532]],
            [[93, 478], [130, 478]],
            [[220, 478], [265, 478]],
            [[355, 478], [430, 478]],
            [[430, 478], [445, 495]],
            [[445, 495], [445, 532]],
            [[93, 532], [635, 532]],
            [[572, 230], [572, 532]],
            [[635, 410], [635, 532]],
            [[524, 42], [524, 135]],
            [[524, 135], [575, 135]],
            [[620, 135], [695, 135]],
            [[572, 230], [695, 230]],
            [[695, 42], [695, 145]],
            [[695, 215], [695, 360]],
            [[695, 42], [915, 42]],
            [[915, 42], [915, 360]],
            [[695, 360], [915, 360]],
        ],
    },
    "floors": [
        {
            "id": "upstairs",
            "name": "Upstairs Level",
            "order": 0,
            "underlay_svg": {
                "url": "/presence_detection_designer_static/floor_upstairs.webp?v=4",
                "x": 114,
                "y": 20,
                "width": 772,
                "height": 540,
            },
        },
        {
            "id": "main",
            "name": "Main Floor",
            "order": 1,
            "underlay_svg": {
                "url": "/presence_detection_designer_static/floor_main.webp?v=4",
                "x": 60,
                "y": 30,
                "width": 784,
                "height": 520,
            },
        },
        {
            "id": "basement",
            "name": "Basement Level",
            "order": 2,
            "underlay_svg": {
                "url": "/presence_detection_designer_static/floor_basement.webp?v=4",
                "x": 80,
                "y": 30,
                "width": 620,
                "height": 520,
            },
        },
    ],
    "cameras": [
        {
            "id": "camera.living_room",
            "name": "Living Room Camera",
            "floor": "main",
            "host_room": "Living Room",
            "model_preset": "tapo_c110_corner",
            "x": 76,
            "y": 335,
            "heading_deg": 30,
            "fov_deg": 110,
            "range_px": 520,
            "spills_into": ["Front Entry"],
            "notes": "Mounted on West wall below Dining opening; sees North cube shelf wall, Foyer archway/stairs, and South bay windows.",
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
                    "x": 105,
                    "y": 355,
                    "width": 125,
                    "height": 100,
                },
                {
                    "id": "living_room_floor",
                    "entity_id": "binary_sensor.living_room_floor_person_occupancy",
                    "label": "Living Room Floor",
                    "room": "Living Room",
                    "x": 235,
                    "y": 365,
                    "width": 95,
                    "height": 100,
                },
                {
                    "id": "living_room_bay_windows",
                    "entity_id": "binary_sensor.living_room_bay_windows_person_occupancy",
                    "label": "Bay Windows",
                    "room": "Living Room",
                    "x": 115,
                    "y": 468,
                    "width": 165,
                    "height": 38,
                },
                {
                    "id": "living_room_entry",
                    "entity_id": "binary_sensor.living_room_entry_person_occupancy",
                    "label": "Front Entry Archway",
                    "room": "Front Entry",
                    "x": 350,
                    "y": 415,
                    "width": 80,
                    "height": 80,
                },
            ],
        },
        {
            "id": "camera.dining_room",
            "name": "Dining Room Camera",
            "floor": "main",
            "host_room": "Dining Room",
            "model_preset": "tapo_c110_corner",
            "x": 242,
            "y": 96,
            "heading_deg": 128,
            "fov_deg": 110,
            "range_px": 320,
            "spills_into": ["Living Room"],
            "notes": "Upper-right corner of Dining Room looking SW across dining table and through wide opening into Living Room.",
            "zones": ["dining_room_table", "rileys_food"],
            "sub_zones": [
                {
                    "id": "dining_room_table",
                    "entity_id": "binary_sensor.dining_room_table_person_occupancy",
                    "label": "Dining Table",
                    "room": "Dining Room",
                    "x": 105,
                    "y": 145,
                    "width": 110,
                    "height": 110,
                },
                {
                    "id": "rileys_food",
                    "entity_id": "binary_sensor.rileys_food_person_occupancy",
                    "label": "Riley's Food Corner",
                    "room": "Dining Room",
                    "x": 170,
                    "y": 96,
                    "width": 65,
                    "height": 42,
                },
            ],
        },
        {
            "id": "camera.family_room",
            "name": "Family Room Camera",
            "floor": "main",
            "host_room": "Family Room",
            "model_preset": "tapo_c110_corner",
            "x": 818,
            "y": 96,
            "heading_deg": 142,
            "fov_deg": 110,
            "range_px": 620,
            "spills_into": ["Kitchen", "Front Entry"],
            "notes": "Mounted on North wall to the right of the right window looking left across Family Room, green South couch wall, and Kitchen.",
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
                    "x": 635,
                    "y": 195,
                    "width": 150,
                    "height": 88,
                },
                {
                    "id": "family_room_recliner",
                    "entity_id": "binary_sensor.family_room_recliner_person_occupancy",
                    "label": "Family Room Recliner",
                    "room": "Family Room",
                    "x": 545,
                    "y": 115,
                    "width": 80,
                    "height": 75,
                },
                {
                    "id": "family_room_floor",
                    "entity_id": "binary_sensor.family_room_floor_person_occupancy",
                    "label": "Family Room Floor",
                    "room": "Family Room",
                    "x": 545,
                    "y": 195,
                    "width": 85,
                    "height": 88,
                },
                {
                    "id": "kitchen_island",
                    "entity_id": "binary_sensor.kitchen_island_person_occupancy",
                    "label": "Kitchen Island",
                    "room": "Kitchen",
                    "x": 335,
                    "y": 155,
                    "width": 120,
                    "height": 95,
                },
            ],
        },
        {
            "id": "camera.garage",
            "name": "Garage Camera",
            "floor": "main",
            "host_room": "Garage",
            "model_preset": "tapo_c110_overhead",
            "x": 680,
            "y": 423,
            "heading_deg": 90,
            "fov_deg": 164,
            "range_px": 250,
            "spills_into": [],
            "notes": "Mounted high on North interior wall pointing steeply down, covering nearly the full North wall and parking bay.",
            "zones": ["garage_parking"],
            "sub_zones": [
                {
                    "id": "garage_parking",
                    "entity_id": "binary_sensor.garage_parking_person_occupancy",
                    "label": "Garage Parking Bay",
                    "room": "Garage",
                    "x": 595,
                    "y": 438,
                    "width": 170,
                    "height": 108,
                }
            ],
        },
        {
            "id": "camera.master_bedroom",
            "name": "Master Bedroom Camera",
            "floor": "upstairs",
            "host_room": "Master Bedroom",
            "model_preset": "tapo_c110_corner",
            "x": 134,
            "y": 536,
            "heading_deg": 313,
            "fov_deg": 110,
            "range_px": 620,
            "spills_into": ["Upstairs Hallway & Stairs", "Master Bathroom"],
            "notes": "Lower-left corner of Master Bedroom looking NE; hugs West headboard wall, clips W.I.C, and sees into Master Bath & Hallway doors.",
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
                    "x": 134,
                    "y": 250,
                    "width": 135,
                    "height": 155,
                },
                {
                    "id": "master_open_area",
                    "entity_id": "binary_sensor.master_open_area_person_occupancy",
                    "label": "Master Open Floor",
                    "room": "Master Bedroom",
                    "x": 140,
                    "y": 55,
                    "width": 145,
                    "height": 165,
                },
                {
                    "id": "master_bedroom_walkway",
                    "entity_id": "binary_sensor.master_bedroom_walkway_person_occupancy",
                    "label": "Master Walkway",
                    "room": "Master Bedroom",
                    "x": 278,
                    "y": 225,
                    "width": 68,
                    "height": 220,
                },
                {
                    "id": "master_bedroom_entryway",
                    "entity_id": "binary_sensor.master_bedroom_entryway_person_occupancy",
                    "label": "Master Hallway Entry",
                    "room": "Master Bedroom",
                    "x": 305,
                    "y": 256,
                    "width": 48,
                    "height": 56,
                },
                {
                    "id": "master_bathroom",
                    "entity_id": "binary_sensor.master_bathroom_person_occupancy",
                    "label": "Master Bath Doorway",
                    "room": "Master Bathroom",
                    "x": 425,
                    "y": 486,
                    "width": 55,
                    "height": 56,
                },
            ],
        },
        {
            "id": "camera.nursery",
            "name": "Nursery Camera",
            "floor": "upstairs",
            "host_room": "Margot's Room",
            "model_preset": "tapo_c110_corner",
            "x": 358,
            "y": 246,
            "heading_deg": 311,
            "fov_deg": 110,
            "range_px": 340,
            "spills_into": [],
            "notes": "Lower-left corner of Nursery looking NE; sees West wall posters, bed, dresser, open East reach-in closet, and hallway door.",
            "zones": ["nursery_bed"],
            "sub_zones": [
                {
                    "id": "nursery_bed",
                    "entity_id": "binary_sensor.nursery_bed_person_occupancy",
                    "label": "Nursery Bed",
                    "room": "Margot's Room",
                    "x": 370,
                    "y": 95,
                    "width": 125,
                    "height": 115,
                }
            ],
        },
        {
            "id": "camera.office",
            "name": "Office Camera",
            "floor": "upstairs",
            "host_room": "Office",
            "model_preset": "tapo_c110_corner",
            "x": 678,
            "y": 538,
            "heading_deg": 313,
            "fov_deg": 110,
            "range_px": 380,
            "spills_into": ["Upstairs Hallway & Stairs"],
            "notes": "Lower-left corner of Office looking NE; sees West wall and Office door, open North closet, Steve's desk, and sim rig.",
            "zones": ["steves_desk", "sim_rig", "office_floor", "office_entryway"],
            "sub_zones": [
                {
                    "id": "steves_desk",
                    "entity_id": "binary_sensor.steves_desk_person_occupancy",
                    "label": "Steve's Desk",
                    "room": "Office",
                    "x": 745,
                    "y": 360,
                    "width": 105,
                    "height": 95,
                },
                {
                    "id": "sim_rig",
                    "entity_id": "binary_sensor.sim_rig_person_occupancy",
                    "label": "Sim Rig",
                    "room": "Office",
                    "x": 680,
                    "y": 425,
                    "width": 65,
                    "height": 95,
                },
                {
                    "id": "office_floor",
                    "entity_id": "binary_sensor.office_floor_person_occupancy",
                    "label": "Office Center Floor",
                    "room": "Office",
                    "x": 685,
                    "y": 310,
                    "width": 95,
                    "height": 95,
                },
                {
                    "id": "office_entryway",
                    "entity_id": "binary_sensor.office_entryway_person_occupancy",
                    "label": "Office Doorway",
                    "room": "Office",
                    "x": 665,
                    "y": 258,
                    "width": 45,
                    "height": 55,
                },
            ],
        },
        {
            "id": "camera.basement_theater",
            "name": "Basement Theater Camera",
            "floor": "basement",
            "host_room": "Basement Theater",
            "model_preset": "tapo_c110_corner",
            "x": 104,
            "y": 64,
            "heading_deg": 42,
            "fov_deg": 110,
            "range_px": 700,
            "spills_into": ["Basement Play Area"],
            "notes": "Upper-left corner of Basement Theater looking SE; sees North wall ballpit leading to Wet Bar, sectional couch, South closets, and East wall.",
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
                    "x": 150,
                    "y": 235,
                    "width": 165,
                    "height": 165,
                },
                {
                    "id": "basement_theater_playpen",
                    "entity_id": "binary_sensor.basement_theater_playpen_person_occupancy",
                    "label": "Ballpit / Playpen",
                    "room": "Basement Theater",
                    "x": 160,
                    "y": 50,
                    "width": 165,
                    "height": 75,
                },
                {
                    "id": "basement_theater_floor",
                    "entity_id": "binary_sensor.basement_theater_floor_person_occupancy",
                    "label": "Theater Floor",
                    "room": "Basement Theater",
                    "x": 160,
                    "y": 135,
                    "width": 165,
                    "height": 90,
                },
                {
                    "id": "basement_bar",
                    "entity_id": "binary_sensor.basement_bar_person_occupancy",
                    "label": "Basement Wet Bar",
                    "room": "Basement Play Area",
                    "x": 365,
                    "y": 55,
                    "width": 150,
                    "height": 140,
                },
                {
                    "id": "basement_play_area_far",
                    "entity_id": "binary_sensor.basement_play_area_far_person_occupancy",
                    "label": "Play Area East",
                    "room": "Basement Play Area",
                    "x": 370,
                    "y": 230,
                    "width": 190,
                    "height": 175,
                },
                {
                    "id": "basement_stairwell",
                    "entity_id": "binary_sensor.basement_stairwell_person_occupancy",
                    "label": "Basement Stairwell",
                    "room": "Basement Play Area",
                    "x": 495,
                    "y": 415,
                    "width": 75,
                    "height": 105,
                },
            ],
        },
        {
            "id": "camera.basement_play_area",
            "name": "Basement Play Area Camera",
            "floor": "basement",
            "host_room": "Basement Play Area",
            "model_preset": "tapo_c110_corner",
            "x": 505,
            "y": 68,
            "heading_deg": 121,
            "fov_deg": 110,
            "range_px": 680,
            "spills_into": ["Basement Theater"],
            "notes": "Behind Wet Bar looking SW across bar counter, East basement wall (not into stairs), play mats, and Theater.",
            "zones": ["basement_play_floor", "basement_counter", "theater_rear_view"],
            "sub_zones": [
                {
                    "id": "basement_play_floor",
                    "entity_id": "binary_sensor.basement_play_floor_person_occupancy",
                    "label": "Play Area Main Floor",
                    "room": "Basement Play Area",
                    "x": 365,
                    "y": 225,
                    "width": 195,
                    "height": 220,
                },
                {
                    "id": "basement_counter",
                    "entity_id": "binary_sensor.basement_counter_person_occupancy",
                    "label": "Wet Bar Counter",
                    "room": "Basement Play Area",
                    "x": 365,
                    "y": 60,
                    "width": 150,
                    "height": 140,
                },
                {
                    "id": "theater_rear_view",
                    "entity_id": "binary_sensor.theater_rear_view_person_occupancy",
                    "label": "Theater Rear View",
                    "room": "Basement Theater",
                    "x": 135,
                    "y": 230,
                    "width": 185,
                    "height": 175,
                },
            ],
        },
        {
            "id": "camera.storage_room",
            "name": "Storage Room Camera",
            "floor": "basement",
            "host_room": "Storage Room",
            "model_preset": "tapo_c110_corner",
            "x": 905,
            "y": 54,
            "heading_deg": 135,
            "fov_deg": 110,
            "range_px": 420,
            "spills_into": [],
            "notes": "Upper-right corner of Storage Room looking SW across green gym floor toward South storage shelves and West door to hallway.",
            "zones": ["storage_room_workout"],
            "sub_zones": [
                {
                    "id": "storage_room_workout",
                    "entity_id": "binary_sensor.storage_room_workout_person_occupancy",
                    "label": "Gym / Workout Mat",
                    "room": "Storage Room",
                    "x": 715,
                    "y": 110,
                    "width": 165,
                    "height": 210,
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
            "model_preset": "ring_alarm_pir_gen2",
            "floor": "main",
            "host_room": "Family Room",
            "x": 820,
            "y": 278,
            "heading_deg": 225,
            "fov_deg": 90,
            "range_px": 260,
        },
        {
            "id": "binary_sensor.family_room_motion_4",
            "entity_id": "binary_sensor.family_room_motion_4",
            "name": "Family/Kitchen PIR (Ecobee)",
            "sensor_type": "pir_motion",
            "model_preset": "ecobee_smart_sensor",
            "floor": "main",
            "host_room": "Family Room",
            "x": 555,
            "y": 115,
            "heading_deg": 165,
            "fov_deg": 110,
            "range_px": 230,
        },
        {
            "id": "binary_sensor.thermostat_motion",
            "entity_id": "binary_sensor.thermostat_motion",
            "name": "Main Thermostat PIR",
            "sensor_type": "pir_motion",
            "model_preset": "ecobee_smart_sensor",
            "floor": "main",
            "host_room": "Dining Room",
            "x": 242,
            "y": 180,
            "heading_deg": 180,
            "fov_deg": 110,
            "range_px": 180,
        },
        {
            "id": "binary_sensor.keypad_motion",
            "entity_id": "binary_sensor.keypad_motion",
            "name": "Front Entry Keypad PIR",
            "sensor_type": "pir_motion",
            "model_preset": "ring_keypad_pir",
            "floor": "main",
            "host_room": "Front Entry",
            "x": 415,
            "y": 495,
            "heading_deg": 295,
            "fov_deg": 100,
            "range_px": 165,
        },
        {
            "id": "binary_sensor.ratgdov25i_47a250_motion",
            "entity_id": "binary_sensor.ratgdov25i_47a250_motion",
            "name": "Garage Opener PIR",
            "sensor_type": "pir_motion",
            "model_preset": "ratgdo_pir",
            "floor": "main",
            "host_room": "Garage",
            "x": 680,
            "y": 430,
            "heading_deg": 90,
            "fov_deg": 100,
            "range_px": 175,
        },
        {
            "id": "binary_sensor.master_bedroom_motion",
            "entity_id": "binary_sensor.master_bedroom_motion",
            "name": "Master Bedroom PIR (Ecobee)",
            "sensor_type": "pir_motion",
            "model_preset": "ecobee_smart_sensor",
            "floor": "upstairs",
            "host_room": "Master Bedroom",
            "x": 140,
            "y": 280,
            "heading_deg": 0,
            "fov_deg": 110,
            "range_px": 230,
        },
        {
            "id": "binary_sensor.nursery_motion",
            "entity_id": "binary_sensor.nursery_motion",
            "name": "Nursery PIR (Ecobee)",
            "sensor_type": "pir_motion",
            "model_preset": "ecobee_smart_sensor",
            "floor": "upstairs",
            "host_room": "Margot's Room",
            "x": 370,
            "y": 235,
            "heading_deg": 315,
            "fov_deg": 110,
            "range_px": 230,
        },
        {
            "id": "binary_sensor.guest_room_motion",
            "entity_id": "binary_sensor.guest_room_motion",
            "name": "Guest Room PIR (Ecobee)",
            "sensor_type": "pir_motion",
            "model_preset": "ecobee_smart_sensor",
            "floor": "upstairs",
            "host_room": "Guest Room",
            "x": 858,
            "y": 48,
            "heading_deg": 140,
            "fov_deg": 110,
            "range_px": 230,
        },
        {
            "id": "binary_sensor.office_motion",
            "entity_id": "binary_sensor.office_motion",
            "name": "Office PIR (Ecobee)",
            "sensor_type": "pir_motion",
            "model_preset": "ecobee_smart_sensor",
            "floor": "upstairs",
            "host_room": "Office",
            "x": 858,
            "y": 305,
            "heading_deg": 145,
            "fov_deg": 110,
            "range_px": 230,
        },
        {
            "id": "binary_sensor.upper_level_keypad_motion",
            "entity_id": "binary_sensor.upper_level_keypad_motion",
            "name": "Upstairs Hallway Keypad PIR",
            "sensor_type": "pir_motion",
            "model_preset": "ring_keypad_pir",
            "floor": "upstairs",
            "host_room": "Upstairs Hallway & Stairs",
            "x": 485,
            "y": 262,
            "heading_deg": 90,
            "fov_deg": 100,
            "range_px": 165,
        },
        {
            "id": "binary_sensor.motion_sensor_gen2_motion_detection",
            "entity_id": "binary_sensor.motion_sensor_gen2_motion_detection",
            "name": "Basement Play Area PIR (Z-Wave)",
            "sensor_type": "pir_motion",
            "model_preset": "ring_alarm_pir_gen2",
            "floor": "basement",
            "host_room": "Basement Play Area",
            "x": 560,
            "y": 245,
            "heading_deg": 180,
            "fov_deg": 90,
            "range_px": 260,
        },
        {
            "id": "binary_sensor.basement_motion",
            "entity_id": "binary_sensor.basement_motion",
            "name": "Basement PIR (Ecobee)",
            "sensor_type": "pir_motion",
            "model_preset": "ecobee_smart_sensor",
            "floor": "basement",
            "host_room": "Basement Play Area",
            "x": 420,
            "y": 518,
            "heading_deg": 270,
            "fov_deg": 110,
            "range_px": 230,
        },
        {
            "id": "binary_sensor.front_door",
            "entity_id": "binary_sensor.front_door",
            "name": "Front Door Contact",
            "sensor_type": "door_contact",
            "model_preset": "ring_contact_sensor",
            "floor": "main",
            "host_room": "Front Entry",
            "door_id": "door_front_entry",
            "x": 452,
            "y": 508,
        },
        {
            "id": "binary_sensor.utility_room_door",
            "entity_id": "binary_sensor.utility_room_door",
            "name": "Laundry / Garage Door Contact",
            "sensor_type": "door_contact",
            "model_preset": "ring_contact_sensor",
            "floor": "main",
            "host_room": "Laundry Room",
            "door_id": "door_fr_laundry",
            "x": 642,
            "y": 395,
        },
        {
            "id": "binary_sensor.back_door",
            "entity_id": "binary_sensor.back_door",
            "name": "Back Patio Door Contact",
            "sensor_type": "door_contact",
            "model_preset": "ring_contact_sensor",
            "floor": "main",
            "host_room": "Kitchen",
            "x": 475,
            "y": 87,
        },
        {
            "id": "binary_sensor.garage_side_door",
            "entity_id": "binary_sensor.garage_side_door",
            "name": "Garage Side Door Contact",
            "sensor_type": "door_contact",
            "model_preset": "ring_contact_sensor",
            "floor": "main",
            "host_room": "Garage",
            "x": 832,
            "y": 465,
        },
        {
            "id": "cover.garage_door",
            "entity_id": "cover.garage_door",
            "name": "Garage Roll-Up Door",
            "sensor_type": "door_contact",
            "floor": "main",
            "host_room": "Garage",
            "x": 680,
            "y": 555,
        },
    ],
    "ble_proxies": [
        {
            "id": "living_room_speaker",
            "entity_id": "sensor.living_room_speaker_bluetooth_proxy_status",
            "name": "Living Room Speaker BLE Proxy",
            "model_preset": "google_home_speaker_ble",
            "floor": "main",
            "host_room": "Living Room",
            "x": 210,
            "y": 410,
            "radius_px": 210,
        },
        {
            "id": "family_room_speaker",
            "entity_id": "sensor.family_room_speaker_bluetooth_proxy_status",
            "name": "Family Room Speaker BLE Proxy",
            "model_preset": "google_home_speaker_ble",
            "floor": "main",
            "host_room": "Family Room",
            "x": 680,
            "y": 200,
            "radius_px": 210,
        },
        {
            "id": "master_bedroom_speaker",
            "entity_id": "sensor.master_bedroom_speaker_bluetooth_proxy_status",
            "name": "Master Bedroom Speaker BLE Proxy",
            "model_preset": "google_home_speaker_ble",
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
            "model_preset": "google_home_speaker_ble",
            "floor": "upstairs",
            "host_room": "Margot's Room",
            "x": 465,
            "y": 140,
            "radius_px": 190,
        },
        {
            "id": "office_speaker",
            "entity_id": "sensor.office_speaker_bluetooth_proxy_status",
            "name": "Office Speaker BLE Proxy",
            "model_preset": "google_home_speaker_ble",
            "floor": "upstairs",
            "host_room": "Office",
            "x": 765,
            "y": 400,
            "radius_px": 200,
        },
        {
            "id": "basement_speaker",
            "entity_id": "sensor.basement_speaker_bluetooth_proxy_status",
            "name": "Basement Speaker BLE Proxy",
            "model_preset": "google_home_speaker_ble",
            "floor": "basement",
            "host_room": "Basement Play Area",
            "x": 450,
            "y": 295,
            "radius_px": 260,
        },
    ],
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
            "from_room": "Front Entry",
            "id": "conn_entry_powder",
            "label": "Powder Bath Doorway",
            "to_room": "Powder Bath",
            "type": "unmonitored_door",
        },
        {
            "from_room": "Front Entry",
            "id": "conn_entry_laundry",
            "label": "Laundry Room Doorway",
            "to_room": "Laundry Room",
            "type": "unmonitored_door",
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
            "entity_id": "binary_sensor.utility_room_door",
            "from_room": "Laundry Room",
            "id": "conn_laundry_garage",
            "label": "Laundry -> Garage Door",
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
            "id": "conn_master_wic",
            "label": "Master Walk-In Closet Door",
            "to_room": "Master W.I.C",
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
            "label": "Storage Room Door (Off East Basement Hall)",
            "to_room": "Storage Room",
            "type": "unmonitored_door",
        },
        {
            "from_room": "Basement Play Area",
            "id": "conn_play_bbath",
            "label": "Basement Bath Door (Off East Basement Hall)",
            "to_room": "Basement Bathroom",
            "type": "unmonitored_door",
        },
    ],
    "rooms": [
        {
            "id": "master_bedroom",
            "name": "Master Bedroom",
            "floor": "upstairs",
            "room_type": "room",
            "x": 126,
            "y": 32,
            "width": 227,
            "height": 516,
            "svg_path": "M 126,32 L 353,32 L 353,484 L 440,484 L 440,548 L 126,548 Z",
            "notes": "West wing front-to-back with lower vestibule leading to Master W.I.C and Master Bathroom.",
            "entryways": [
                {
                    "id": "door_master_hallway",
                    "wall": "right",
                    "offset": 224,
                    "width": 56,
                    "type": "door",
                    "target_room": "Upstairs Hallway & Stairs",
                },
                {
                    "id": "door_master_bath",
                    "wall": "right",
                    "offset": 452,
                    "width": 60,
                    "type": "door",
                    "target_room": "Master Bathroom",
                },
            ],
        },
        {
            "id": "master_wic",
            "name": "Master W.I.C",
            "floor": "upstairs",
            "room_type": "room",
            "x": 353,
            "y": 355,
            "width": 109,
            "height": 129,
            "notes": "Standalone Master Walk-In Closet (6'3\" x 7'0\") opening South into the Master Bedroom vestibule.",
            "entryways": [
                {
                    "id": "door_wic_master",
                    "wall": "bottom",
                    "offset": 45,
                    "width": 42,
                    "type": "door",
                    "target_room": "Master Bedroom",
                }
            ],
        },
        {
            "id": "upstairs_bathroom",
            "name": "Upstairs Bathroom",
            "floor": "upstairs",
            "room_type": "room",
            "x": 462,
            "y": 316,
            "width": 148,
            "height": 133,
            "svg_path": "M 462,316 L 610,316 L 610,417 L 560,417 L 560,449 L 462,449 Z",
            "notes": "Upper shared bathroom (7'8\" x 4'11\") with tub & vanity opening North into Upstairs Hallway.",
            "entryways": [
                {
                    "id": "door_ubath_hall",
                    "wall": "top",
                    "offset": 46,
                    "width": 45,
                    "type": "door",
                    "target_room": "Upstairs Hallway & Stairs",
                }
            ],
        },
        {
            "id": "master_bathroom",
            "name": "Master Bathroom",
            "floor": "upstairs",
            "room_type": "room",
            "x": 440,
            "y": 417,
            "width": 170,
            "height": 131,
            "svg_path": "M 440,449 L 560,449 L 560,417 L 610,417 L 610,548 L 440,548 Z",
            "notes": "Lower en-suite Master Bathroom (6'5\" x 7'7\") with double vanity and walk-in shower stall.",
            "entryways": [
                {
                    "id": "door_mbath_master",
                    "wall": "left",
                    "offset": 81,
                    "width": 46,
                    "type": "door",
                    "target_room": "Master Bedroom",
                }
            ],
        },
        {
            "id": "margots_room",
            "name": "Margot's Room",
            "floor": "upstairs",
            "room_type": "room",
            "x": 353,
            "y": 32,
            "width": 257,
            "height": 222,
            "svg_path": "M 353,32 L 563,32 L 563,143 L 610,143 L 610,254 L 353,254 Z",
            "notes": "Top-center Nursery (10'6\" x 11'5\") including lower-right reach-in closet (Y=143..254).",
            "entryways": [
                {
                    "id": "door_margot_hallway",
                    "wall": "bottom",
                    "offset": 155,
                    "width": 50,
                    "type": "door",
                    "target_room": "Upstairs Hallway & Stairs",
                }
            ],
        },
        {
            "id": "guest_room",
            "name": "Guest Room",
            "floor": "upstairs",
            "room_type": "room",
            "x": 563,
            "y": 32,
            "width": 311,
            "height": 222,
            "svg_path": "M 563,32 L 874,32 L 874,254 L 610,254 L 610,143 L 563,143 Z",
            "notes": "Top-right Guest Room (13'6\" x 11'5\") including upper-left reach-in closet (Y=32..143).",
            "entryways": [
                {
                    "id": "door_guest_hallway",
                    "wall": "bottom",
                    "offset": 49,
                    "width": 50,
                    "type": "door",
                    "target_room": "Upstairs Hallway & Stairs",
                }
            ],
        },
        {
            "id": "office",
            "name": "Office",
            "floor": "upstairs",
            "room_type": "room",
            "x": 671,
            "y": 254,
            "width": 203,
            "height": 294,
            "notes": "Bottom-right Office (10'3\" x 13'1\") including upper reach-in closet.",
            "entryways": [
                {
                    "id": "door_office_hallway",
                    "wall": "left",
                    "offset": 4,
                    "width": 57,
                    "type": "door",
                    "target_room": "Upstairs Hallway & Stairs",
                }
            ],
        },
        {
            "id": "upstairs_hallway",
            "name": "Upstairs Hallway & Stairs",
            "floor": "upstairs",
            "room_type": "transit",
            "x": 353,
            "y": 254,
            "width": 318,
            "height": 101,
            "svg_path": "M 353,254 L 671,254 L 671,548 L 610,548 L 610,316 L 462,316 L 462,355 L 353,355 Z",
            "notes": "Central upstairs hallway (16'3\" x 3'2\"), North-facing hallway linen closet, and stairwell.",
            "entryways": [
                {
                    "id": "door_hall_master",
                    "wall": "left",
                    "offset": 2,
                    "width": 56,
                    "type": "door",
                    "target_room": "Master Bedroom",
                },
                {
                    "id": "door_hall_margot",
                    "wall": "top",
                    "offset": 155,
                    "width": 50,
                    "type": "door",
                    "target_room": "Margot's Room",
                },
                {
                    "id": "door_hall_guest",
                    "wall": "top",
                    "offset": 259,
                    "width": 50,
                    "type": "door",
                    "target_room": "Guest Room",
                },
                {
                    "id": "door_hall_office",
                    "wall": "right",
                    "offset": 4,
                    "width": 57,
                    "type": "door",
                    "target_room": "Office",
                },
            ],
        },
        {
            "id": "dining_room",
            "name": "Dining Room",
            "floor": "main",
            "room_type": "room",
            "x": 68,
            "y": 87,
            "width": 183,
            "height": 203,
            "notes": "Northwest Dining Room (11'5\" x 13'0\") opening to Kitchen and Living Room.",
            "entryways": [
                {
                    "id": "arch_dr_kitchen",
                    "wall": "right",
                    "offset": 103,
                    "width": 60,
                    "type": "open_passage",
                    "target_room": "Kitchen",
                },
                {
                    "id": "arch_dr_lr",
                    "wall": "bottom",
                    "offset": 28,
                    "width": 116,
                    "type": "open_passage",
                    "target_room": "Living Room",
                },
            ],
        },
        {
            "id": "living_room",
            "name": "Living Room",
            "floor": "main",
            "room_type": "room",
            "x": 68,
            "y": 290,
            "width": 273,
            "height": 218,
            "notes": "Southwest Living Room (17'5\" x 13'9\") with South bay windows and wide opening to Foyer.",
            "entryways": [
                {
                    "id": "arch_lr_dr",
                    "wall": "top",
                    "offset": 28,
                    "width": 116,
                    "type": "open_passage",
                    "target_room": "Dining Room",
                },
                {
                    "id": "arch_lr_entry",
                    "wall": "right",
                    "offset": 128,
                    "width": 84,
                    "type": "open_passage",
                    "target_room": "Front Entry",
                },
            ],
        },
        {
            "id": "kitchen",
            "name": "Kitchen",
            "floor": "main",
            "room_type": "room",
            "x": 251,
            "y": 87,
            "width": 283,
            "height": 203,
            "notes": "Central Kitchen (10'3\" x 13'0\") and Breakfast Nook (8'1\" x 13'0\") with island counter.",
            "entryways": [
                {
                    "id": "arch_kitchen_dr",
                    "wall": "left",
                    "offset": 103,
                    "width": 60,
                    "type": "open_passage",
                    "target_room": "Dining Room",
                },
                {
                    "id": "arch_kitchen_fr",
                    "wall": "right",
                    "offset": 10,
                    "width": 185,
                    "type": "open_passage",
                    "target_room": "Family Room",
                },
                {
                    "id": "path_kitchen_entry",
                    "wall": "bottom",
                    "offset": 159,
                    "width": 124,
                    "type": "open_passage",
                    "target_room": "Front Entry",
                },
            ],
        },
        {
            "id": "powder_bath",
            "name": "Powder Bath",
            "floor": "main",
            "room_type": "room",
            "x": 341,
            "y": 290,
            "width": 69,
            "height": 92,
            "notes": "Main floor half-bath (4'3\" x 4'11\") off Foyer.",
            "entryways": [
                {
                    "id": "door_powder_foyer",
                    "wall": "right",
                    "offset": 55,
                    "width": 33,
                    "type": "door",
                    "target_room": "Front Entry",
                }
            ],
        },
        {
            "id": "front_entry",
            "name": "Front Entry",
            "floor": "main",
            "room_type": "room",
            "x": 341,
            "y": 290,
            "width": 193,
            "height": 218,
            "svg_path": "M 410,290 L 534,290 L 534,508 L 341,508 L 341,382 L 410,382 Z",
            "notes": "Main Foyer (8'9\" x 13'6\"), coat closet, front door, and stairs to Upper Level.",
            "entryways": [
                {
                    "id": "arch_entry_lr",
                    "wall": "left",
                    "offset": 128,
                    "width": 84,
                    "type": "open_passage",
                    "target_room": "Living Room",
                },
                {
                    "id": "path_entry_kitchen",
                    "wall": "top",
                    "offset": 69,
                    "width": 124,
                    "type": "open_passage",
                    "target_room": "Kitchen",
                },
                {
                    "id": "door_front_entry",
                    "wall": "bottom",
                    "offset": 85,
                    "width": 50,
                    "type": "door",
                    "target_room": "Exterior",
                },
            ],
        },
        {
            "id": "family_room",
            "name": "Family Room",
            "floor": "main",
            "room_type": "room",
            "x": 534,
            "y": 87,
            "width": 298,
            "height": 203,
            "notes": "East Family Room (19'4\" x 12'9\") with North fireplace and solid green South wall.",
            "entryways": [
                {
                    "id": "arch_fr_kitchen",
                    "wall": "left",
                    "offset": 10,
                    "width": 185,
                    "type": "open_passage",
                    "target_room": "Kitchen",
                }
            ],
        },
        {
            "id": "laundry_room",
            "name": "Laundry Room",
            "floor": "main",
            "room_type": "room",
            "x": 534,
            "y": 290,
            "width": 174,
            "height": 131,
            "notes": "Main floor Laundry / Mudroom (11'3\" x 8'5\") with door on West wall to Hallway/Foyer and South door to Garage.",
            "entryways": [
                {
                    "id": "door_laundry_hall",
                    "wall": "left",
                    "offset": 10,
                    "width": 48,
                    "type": "door",
                    "target_room": "Front Entry",
                },
                {
                    "id": "door_fr_laundry",
                    "wall": "bottom",
                    "offset": 85,
                    "width": 48,
                    "type": "door",
                    "target_room": "Garage",
                },
            ],
        },
        {
            "id": "garage",
            "name": "Garage",
            "floor": "main",
            "room_type": "room",
            "x": 534,
            "y": 421,
            "width": 298,
            "height": 134,
            "notes": "2-car Garage below Laundry Room.",
            "entryways": [
                {
                    "id": "door_garage_fr",
                    "wall": "top",
                    "offset": 85,
                    "width": 48,
                    "type": "door",
                    "target_room": "Laundry Room",
                }
            ],
        },
        {
            "id": "basement_theater",
            "name": "Basement Theater",
            "floor": "basement",
            "room_type": "room",
            "x": 93,
            "y": 42,
            "width": 267,
            "height": 490,
            "notes": "West side of Recreation Room with TV/fireplace wall, sectional couch, North wall ballpit, and South bi-fold closets.",
            "entryways": [
                {
                    "id": "arch_theater_play",
                    "wall": "right",
                    "offset": 20,
                    "width": 430,
                    "type": "open_passage",
                    "target_room": "Basement Play Area",
                }
            ],
        },
        {
            "id": "basement_play_area",
            "name": "Basement Play Area",
            "floor": "basement",
            "room_type": "room",
            "x": 360,
            "y": 42,
            "width": 335,
            "height": 490,
            "svg_path": "M 360,42 L 524,42 L 524,135 L 695,135 L 695,230 L 572,230 L 572,410 L 635,410 L 635,532 L 360,532 Z",
            "notes": "East side of Recreation Room including Wet Bar (9'0\" x 8'5\"), Play Area mats, East hallway (7'0\" x 4'8\"), and stairs.",
            "entryways": [
                {
                    "id": "arch_play_theater",
                    "wall": "left",
                    "offset": 20,
                    "width": 430,
                    "type": "open_passage",
                    "target_room": "Basement Theater",
                },
                {
                    "id": "door_play_bbath",
                    "wall": "top",
                    "offset": 215,
                    "width": 45,
                    "type": "door",
                    "target_room": "Basement Bathroom",
                },
                {
                    "id": "door_play_storage",
                    "wall": "right",
                    "offset": 103,
                    "width": 70,
                    "type": "door",
                    "target_room": "Storage Room",
                },
            ],
        },
        {
            "id": "basement_bathroom",
            "name": "Basement Bathroom",
            "floor": "basement",
            "room_type": "transit",
            "x": 524,
            "y": 42,
            "width": 171,
            "height": 93,
            "notes": "Basement Bathroom (5'11\" x 4'7\") to the right of Wet Bar opening South into basement hallway.",
            "entryways": [
                {
                    "id": "door_bbath_play",
                    "wall": "bottom",
                    "offset": 51,
                    "width": 45,
                    "type": "door",
                    "target_room": "Basement Play Area",
                }
            ],
        },
        {
            "id": "storage_room",
            "name": "Storage Room",
            "floor": "basement",
            "room_type": "room",
            "x": 695,
            "y": 42,
            "width": 220,
            "height": 318,
            "notes": "East Storage Room / Gym opening West into the basement hallway.",
            "entryways": [
                {
                    "id": "door_storage_play",
                    "wall": "left",
                    "offset": 103,
                    "width": 70,
                    "type": "door",
                    "target_room": "Basement Play Area",
                }
            ],
        },
    ],
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

    # Build solid segments per floor (prefer calibrated architectural floor_wall_segments when rooms match default layout)
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
        if cov.get("max_coverage_pct", 0.0) == 0.0 or (
            r_name == "Master Bathroom" and cov.get("uncovered_pct", 0.0) >= 50.0
        ):
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
        "device_model_presets": copy.deepcopy(DEVICE_MODEL_PRESETS),
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
