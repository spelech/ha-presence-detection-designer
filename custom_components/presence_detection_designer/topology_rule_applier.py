"""Room config compiler applying floorplan linkages, open-mode enforcement, and spillover rules."""

from __future__ import annotations

import copy
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

_STALE_ENTITY_IDS: frozenset[str] = frozenset(
    {
        "binary_sensor.motion_detector_basement1",
        "binary_sensor.ratgdov25i_47a250_motion",
        "binary_sensor.motion_utility_room",
        "binary_sensor.wyzesense_77a63dd9",
        "binary_sensor.wyzesense_77a64d3c",
        "binary_sensor.wyzesense_77a65433",
        "binary_sensor.wyzesense_77a64d08",
        "binary_sensor.ring_motion_sensor_55812",
        "binary_sensor.family_room_motion_4",
        "binary_sensor.family_room_motion",
        "binary_sensor.motion_sensor_gen2_motion_detection",
        "binary_sensor.basement_motion",
        "binary_sensor.basement_stairs_ring_motion",
        "binary_sensor.utility_room_door",
        "binary_sensor.kitchen_motion",
        "binary_sensor.laundry_room_motion",
        "binary_sensor.master_bathroom_motion",
        "binary_sensor.upstairs_hallway_motion",
        "binary_sensor.upstairs_stairs_motion",
    }
)

_ROOM_REQUIRED_PIRS: dict[str, list[tuple[str, str, str, float, float]]] = {
    "Guest Room": [
        (
            "binary_sensor.guest_room_motion_occupancy",
            "Guest Room VALLHORN PIR Motion",
            str(BayesianWeightPreset.STRONG),
            0.90,
            0.05,
        )
    ],
    "Master Bathroom": [
        (
            "binary_sensor.master_bathroom_motion_occupancy",
            "Master Bathroom SenseGuard PIR Motion",
            str(BayesianWeightPreset.STRONG),
            0.90,
            0.05,
        )
    ],
    "Kitchen": [
        (
            "binary_sensor.kitchen_motion_occupancy",
            "Kitchen SenseGuard PIR Motion",
            str(BayesianWeightPreset.STRONG),
            0.90,
            0.05,
        )
    ],
    "Laundry Room": [
        (
            "binary_sensor.laundry_room_ring_motion",
            "Laundry Room Ring PIR Motion",
            str(BayesianWeightPreset.STRONG),
            0.90,
            0.05,
        )
    ],
    "Garage": [
        (
            "binary_sensor.garage_ring_motion",
            "Garage Ring PIR Motion",
            str(BayesianWeightPreset.STRONG),
            0.90,
            0.05,
        )
    ],
    "Front Entry": [
        (
            "binary_sensor.keypad_motion",
            "Front Entry Keypad Proximity Motion",
            str(BayesianWeightPreset.STRONG),
            0.90,
            0.05,
        ),
        (
            "binary_sensor.basement_stairs_top_motion",
            "Basement Stairs Top Step Wyze PIR (938)",
            str(BayesianWeightPreset.MODERATE),
            0.78,
            0.08,
        ),
    ],
    "Basement Play Area": [
        (
            "binary_sensor.basement_stairs_bottom_motion",
            "Basement Stairs Bottom Step Wyze PIR (dd9)",
            str(BayesianWeightPreset.STRONG),
            0.90,
            0.05,
        ),
    ],
    "Upstairs Hallway & Stairs": [
        (
            "binary_sensor.upstairs_hallway_motion_occupancy",
            "Upstairs Hallway SenseGuard PIR Motion",
            str(BayesianWeightPreset.STRONG),
            0.90,
            0.05,
        ),
        (
            "binary_sensor.upstairs_stairs_bottom_motion",
            "Upstairs Stairs Bottom Step Wyze PIR (433)",
            str(BayesianWeightPreset.STRONG),
            0.90,
            0.05,
        ),
    ],
    "Family Room": [
        (
            "binary_sensor.family_room_motion_occupancy",
            "Family Room SenseGuard PIR Motion",
            str(BayesianWeightPreset.MODERATE),
            0.78,
            0.08,
        ),
    ],
    "Living Room": [
        (
            "binary_sensor.living_room_motion_occupancy",
            "Living Room SenseGuard PIR Motion",
            str(BayesianWeightPreset.MODERATE),
            0.78,
            0.08,
        ),
    ],
    "Dining Room": [
        (
            "binary_sensor.dining_room_motion_occupancy",
            "Dining Room SenseGuard PIR Motion",
            str(BayesianWeightPreset.MODERATE),
            0.78,
            0.08,
        ),
    ],
    "Master Bedroom": [
        (
            "binary_sensor.master_bedroom_motion_occupancy",
            "Master Bedroom SenseGuard PIR Motion",
            str(BayesianWeightPreset.MODERATE),
            0.78,
            0.08,
        ),
    ],
    "Office": [
        (
            "binary_sensor.office_motion_occupancy",
            "Office SenseGuard PIR Motion",
            str(BayesianWeightPreset.MODERATE),
            0.78,
            0.08,
        ),
    ],
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

    updated[CONF_CONNECTED_ROOMS] = list(rules.get("connected_rooms", []))

    if not rules.get("can_be_bounded", False):
        updated[CONF_MODE] = str(Mode.OPEN)
        updated[CONF_BOUNDARY_ENTITIES] = []

    if rules.get("recommended_inactivity_timeout"):
        updated[CONF_INACTIVITY_TIMEOUT] = int(rules["recommended_inactivity_timeout"])

    spillover_eids = set(rules.get("spillover_entities_to_downgrade", []) or [])
    if room_name == "Guest Room":
        spillover_eids.add("binary_sensor.guest_room_motion")

    if spillover_eids:
        triggers = [
            t
            for t in (updated.get(CONF_TRIGGER_ENTITIES, []) or [])
            if str(t.get("entity_id") if isinstance(t, dict) else t) not in spillover_eids
        ]
        updated[CONF_TRIGGER_ENTITIES] = triggers

    if updated.get(CONF_TRIGGER_ENTITIES):
        updated[CONF_TRIGGER_ENTITIES] = [
            t
            for t in (updated.get(CONF_TRIGGER_ENTITIES, []) or [])
            if str(t.get("entity_id") if isinstance(t, dict) else t) not in _STALE_ENTITY_IDS
        ]

    obs_list = [
        o
        for o in (updated.get(CONF_BAYESIAN_OBSERVATIONS, []) or [])
        if not (isinstance(o, dict) and str(o.get("entity_id", "")) in _STALE_ENTITY_IDS)
    ]

    for req_eid, req_label, req_preset, req_pt, req_pf in reversed(
        _ROOM_REQUIRED_PIRS.get(room_name, [])
    ):
        if not any(isinstance(o, dict) and o.get("entity_id") == req_eid for o in obs_list):
            obs_list.insert(
                0,
                {
                    "entity_id": req_eid,
                    "label": req_label,
                    "operator": "equals",
                    "preset": req_preset,
                    "state": "on",
                    "prob_given_true": req_pt,
                    "prob_given_false": req_pf,
                },
            )
        trig_list = list(updated.get(CONF_TRIGGER_ENTITIES, []) or [])
        if req_eid not in trig_list:
            trig_list.insert(0, req_eid)
            updated[CONF_TRIGGER_ENTITIES] = trig_list

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
            item["preset"] = str(BayesianWeightPreset.SUPPORTING)
            item["prob_given_true"] = 0.45
            item["prob_given_false"] = 0.25
        new_obs.append(item)
    updated[CONF_BAYESIAN_OBSERVATIONS] = new_obs

    return updated
