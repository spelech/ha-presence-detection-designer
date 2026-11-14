"""Tests for SIGNAL-01..SIGNAL-03: Person-coupled trigger gate & non-exclusive signal demotion."""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest

from custom_components.presence_detection_designer.bayesian_engine import (
    resolve_observation_weights,
)
from custom_components.presence_detection_designer.const import (
    CONF_AREA_ID,
    CONF_BAYESIAN_OBSERVATIONS,
    CONF_BAYESIAN_PRIOR,
    CONF_BAYESIAN_THRESHOLD,
    CONF_CONNECTED_ROOMS,
    CONF_INACTIVITY_TIMEOUT,
    CONF_MODE,
    CONF_ROOM_NAME,
    CONF_SUSTAINING_CONDITIONS,
    CONF_TRIGGER_ENTITIES,
    DOMAIN,
    OccupancyState,
)
from custom_components.presence_detection_designer.coordinator import RoomPresenceCoordinator
from custom_components.presence_detection_designer.sensor_reliability import (
    classify_sensor_reliability,
    is_human_exclusive_initiator,
)
from custom_components.presence_detection_designer.spatial_inference import evaluate_spatial_frame
from custom_components.presence_detection_designer.spatial_topology import get_default_floorplan
from custom_components.presence_detection_designer.store import (
    DEFAULT_GLOBAL_SETTINGS,
    _default_store_data,
)
from custom_components.presence_detection_designer.store_migrations import (
    migrate_and_backfill_store_payload,
)
from custom_components.presence_detection_designer.topology_rule_applier import (
    apply_compiled_topology_to_config,
)
from custom_components.presence_detection_designer.views import PDDStateGraphView
from tests.harness.virtual_ha import VirtualHAHarness


@pytest.mark.requirement("SIGNAL-02", category="SIGNAL", req_type="PositiveFeature")
def test_non_exclusive_sensor_classification_and_weight_resolution() -> None:
    """@requirement SIGNAL-02: Machine/device/env signals classify as non-human-exclusive supporting."""
    non_exclusive = [
        ("sensor.office_ups_used_watts_filtered", "power_monitor"),
        ("media_player.basement_theater_tv", "media_player"),
        ("binary_sensor.basement_media_playing", "media_player"),
        ("light.guest_room_nightstands", "actuator"),
        ("switch.guest_room_nightstands", "actuator"),
        ("fan.master_bathroom_exhaust", "actuator"),
        ("sensor.master_bathroom_dhumidity", "environmental"),
        ("binary_sensor.back_door_contact", "contact_static"),
    ]
    for eid, expected_cat in non_exclusive:
        prof = classify_sensor_reliability(eid)
        assert prof.category == expected_cat, eid
        assert prof.is_human_exclusive is False, eid
        assert prof.reliability_weight == 0.35, eid
        assert is_human_exclusive_initiator(eid, pir_confirmed=True, pir_gate_active=False) is False

        preset, pt, pf = resolve_observation_weights(
            {"entity_id": eid, "preset": "strong", "auto_signal_weight": True}
        )
        assert preset == "supporting", eid
        assert pt < 0.70 and pf > 0.12

    for human_eid in (
        "binary_sensor.office_person_occupancy",
        "sensor.steve_s_s25_ble_area",
        "binary_sensor.office_motion_occupancy",
        "__manual_actuation_context__",
        "__spatial_negative_space__",
    ):
        if not human_eid.startswith("__"):
            assert classify_sensor_reliability(human_eid).is_human_exclusive is True
        assert (
            is_human_exclusive_initiator(human_eid, pir_confirmed=True, pir_gate_active=True)
            is True
        )


@pytest.mark.requirement("SIGNAL-02", category="SIGNAL", req_type="PositiveFeature")
def test_ups_watts_never_pins_steve_location_in_spatial_frame() -> None:
    """@requirement SIGNAL-02: High UPS load alone does not pin Steve to Office."""
    fp = get_default_floorplan()
    states = {
        "sensor.office_ups_used_watts_filtered": "285",
        "sensor.steve_s_s25_ble_area": "unknown",
        "sensor.steve_fold_ble_area": "unknown",
        "sensor.steve_watch_ble_area": "unknown",
    }
    frame = evaluate_spatial_frame(
        floorplan=fp,
        state_getter=states.get,
        now_ts=100.0,
    )
    assert "Office" not in frame["steve_pinned_rooms"]
    assert frame["room_estimates"]["Office"]["definitive_tracker_pinned"] is False
    assert frame["room_estimates"]["Office"]["occupied"] is False


@pytest.mark.requirement("SIGNAL-01", category="SIGNAL", req_type="FailClosedGuardrail")
@pytest.mark.asyncio
async def test_leftover_lights_media_dhumidity_and_ups_never_trigger_vacant_rooms(
    tmp_path,
) -> None:
    """@requirement SIGNAL-01: Combined non-human-exclusive signals never trigger vacant->occupied."""
    rooms = [
        {
            CONF_ROOM_NAME: "Master Bathroom",
            CONF_MODE: "open",
            CONF_INACTIVITY_TIMEOUT: 30,
            "max_hold_timeout": 90,
            CONF_TRIGGER_ENTITIES: [
                "binary_sensor.master_bathroom_motion_occupancy",
                "sensor.master_bathroom_dhumidity",
                "light.master_bathroom_vanity",
            ],
            CONF_SUSTAINING_CONDITIONS: [
                {
                    "entity_id": "sensor.master_bathroom_dhumidity",
                    "operator": "greater_than",
                    "state": "0.3",
                }
            ],
            CONF_BAYESIAN_PRIOR: 0.20,
            CONF_BAYESIAN_THRESHOLD: 0.75,
            CONF_BAYESIAN_OBSERVATIONS: [
                {"entity_id": "binary_sensor.master_bathroom_motion_occupancy", "preset": "strong"},
                {
                    "entity_id": "sensor.master_bathroom_dhumidity",
                    "operator": "greater_than",
                    "state": "0.3",
                    "preset": "strong",
                },
                {"entity_id": "light.master_bathroom_vanity", "preset": "strong"},
                {"entity_id": "fan.master_bathroom_exhaust", "preset": "strong"},
                {"entity_id": "switch.master_bathroom_heater", "preset": "moderate"},
            ],
        },
        {
            CONF_ROOM_NAME: "Basement Theater",
            CONF_MODE: "open",
            CONF_INACTIVITY_TIMEOUT: 30,
            CONF_TRIGGER_ENTITIES: ["binary_sensor.theater_motion"],
            CONF_BAYESIAN_PRIOR: 0.20,
            CONF_BAYESIAN_THRESHOLD: 0.75,
            CONF_BAYESIAN_OBSERVATIONS: [
                {"entity_id": "binary_sensor.theater_motion", "preset": "strong"},
                {"entity_id": "media_player.theater_tv", "state": "playing", "preset": "strong"},
                {"entity_id": "media_player.theater_amp", "state": "playing", "preset": "strong"},
                {"entity_id": "binary_sensor.basement_media_playing", "preset": "strong"},
            ],
        },
        {
            CONF_ROOM_NAME: "Office",
            CONF_MODE: "open",
            CONF_INACTIVITY_TIMEOUT: 30,
            CONF_TRIGGER_ENTITIES: ["binary_sensor.office_motion_occupancy"],
            CONF_BAYESIAN_PRIOR: 0.20,
            CONF_BAYESIAN_THRESHOLD: 0.75,
            CONF_BAYESIAN_OBSERVATIONS: [
                {"entity_id": "binary_sensor.office_motion_occupancy", "preset": "strong"},
                {
                    "entity_id": "sensor.steve_s_s25_ble_area",
                    "operator": "equals",
                    "state": "Office",
                    "preset": "decisive",
                },
                {
                    "entity_id": "sensor.office_ups_used_watts_filtered",
                    "operator": "greater_than",
                    "state": "140",
                    "preset": "strong",
                },
            ],
        },
    ]

    with VirtualHAHarness(storage_dir=tmp_path) as harness:
        await harness.async_add_rooms(rooms)
        for _k, _v in {
            "binary_sensor.master_bathroom_motion_occupancy": "off",
            "sensor.master_bathroom_dhumidity": "0.9",
            "light.master_bathroom_vanity": "on",
            "fan.master_bathroom_exhaust": "on",
            "switch.master_bathroom_heater": "on",
            "binary_sensor.theater_motion": "off",
            "media_player.theater_tv": "playing",
            "media_player.theater_amp": "playing",
            "binary_sensor.basement_media_playing": "on",
            "binary_sensor.office_motion_occupancy": "off",
            "sensor.office_ups_used_watts_filtered": "260",
            "sensor.steve_s_s25_ble_area": "Away",
        }.items():
            harness.set_state(_k, _v)
        harness.advance(15)

        for rname in ("Master Bathroom", "Basement Theater", "Office"):
            coord = harness.coordinators[rname]
            assert coord.state_machine.state == OccupancyState.VACANT, rname
            assert coord.state_machine.is_present is False, rname
            assert coord._active_triggers == set(), rname

        # BAYES-01: BLE in Bayesian observations alone stays vacant until a person-coupled trigger fires
        harness.set_state("sensor.steve_s_s25_ble_area", "Office")
        assert harness.coordinators["Office"].state_machine.state == OccupancyState.VACANT
        harness.set_state("binary_sensor.office_motion_occupancy", "on")
        assert (
            harness.coordinators["Office"].state_machine.state == OccupancyState.OCCUPIED_CONFIRMED
        )


@pytest.mark.requirement("SIGNAL-03", category="SIGNAL", req_type="FailClosedGuardrail")
@pytest.mark.asyncio
async def test_office_ups_remote_workload_suppressed_by_contradictory_ble(tmp_path) -> None:
    """@requirement SIGNAL-03: Remote CPU UPS load does not hold Office when BLE places Steve elsewhere."""
    rooms = [
        {
            CONF_ROOM_NAME: "Office",
            CONF_MODE: "open",
            CONF_INACTIVITY_TIMEOUT: 20,
            "max_hold_timeout": 300,
            CONF_TRIGGER_ENTITIES: ["binary_sensor.office_motion_occupancy"],
            CONF_CONNECTED_ROOMS: ["Family Room"],
            CONF_SUSTAINING_CONDITIONS: [
                {
                    "entity_id": "sensor.office_ups_used_watts_filtered",
                    "operator": "greater_than",
                    "state": "140",
                    "label": "Workstation Load",
                }
            ],
            CONF_BAYESIAN_PRIOR: 0.20,
            CONF_BAYESIAN_THRESHOLD: 0.75,
            CONF_BAYESIAN_OBSERVATIONS: [
                {"entity_id": "binary_sensor.office_motion_occupancy", "preset": "strong"},
                {
                    "entity_id": "sensor.office_ups_used_watts_filtered",
                    "operator": "greater_than",
                    "state": "140",
                    "preset": "strong",
                },
            ],
        }
    ]

    with VirtualHAHarness(storage_dir=tmp_path) as harness:
        await harness.async_add_rooms(rooms)
        office = harness.coordinators["Office"]

        # 1. Steve sits in Office with corroborated PIR (BLE=Office) and UPS load
        for _k, _v in {
            "sensor.steve_s_s25_ble_area": "Office",
            "sensor.office_ups_used_watts_filtered": "220",
            "binary_sensor.office_motion_occupancy": "on",
        }.items():
            harness.set_state(_k, _v)
        assert office.state_machine.state == OccupancyState.OCCUPIED_CONFIRMED

        # 2. PIR clears while Steve's BLE is still in Office -> UPS holds occupied_holding
        harness.set_state("binary_sensor.office_motion_occupancy", "off")
        assert office.state_machine.state == OccupancyState.OCCUPIED_HOLDING

        # 3. Steve walks to Family Room while remote workload keeps UPS > 140W -> drops to cooling
        harness.set_state("sensor.steve_s_s25_ble_area", "Family Room")
        assert office.state_machine.state == OccupancyState.OCCUPIED_COOLING

        # 4. Inactivity expires -> vacant even though UPS is still 220W
        harness.advance(21)
        assert office.state_machine.state == OccupancyState.VACANT

        # 5. Reverse timing: BLE becomes unknown (phone off/dead) -> UPS hold still works after PIR
        for _k, _v in {
            "sensor.steve_s_s25_ble_area": "Office",
            "binary_sensor.office_motion_occupancy": "on",
        }.items():
            harness.set_state(_k, _v)
        assert office.state_machine.state == OccupancyState.OCCUPIED_CONFIRMED
        harness.set_state("sensor.steve_s_s25_ble_area", "unknown")
        harness.set_state("binary_sensor.office_motion_occupancy", "off")
        assert office.state_machine.state == OccupancyState.OCCUPIED_HOLDING

        # 6. Leaving house ("Away") while UPS remote job runs immediately drops hold to cooling
        harness.set_state("sensor.steve_s_s25_ble_area", "Away")
        assert office.state_machine.state == OccupancyState.OCCUPIED_COOLING


@pytest.mark.requirement("SIGNAL-02", category="SIGNAL", req_type="PositiveFeature")
@pytest.mark.asyncio
async def test_migration_topology_and_state_graph_demote_and_label_non_exclusive(
    mock_hass,
) -> None:
    """@requirement SIGNAL-02: Migration and topology applier demote non-exclusive obs idempotently."""
    payload = {
        "rooms": {
            "office_id": {
                CONF_ROOM_NAME: "Office",
                CONF_AREA_ID: "office",
                CONF_BAYESIAN_OBSERVATIONS: [
                    {
                        "entity_id": "sensor.office_ups_used_watts_filtered",
                        "label": "Office UPS",
                        "preset": "strong",
                        "operator": "greater_than",
                        "state": "140",
                        "prob_given_true": 0.88,
                        "prob_given_false": 0.05,
                    },
                    {
                        "entity_id": "light.office_lights",
                        "label": "Office Lights",
                        "preset": "moderate",
                        "prob_given_true": 0.72,
                        "prob_given_false": 0.12,
                    },
                ],
            }
        }
    }
    migrated, dirty = migrate_and_backfill_store_payload(
        None, payload, _default_store_data, DEFAULT_GLOBAL_SETTINGS
    )
    assert dirty is True
    obs = {o["entity_id"]: o for o in migrated["rooms"]["office_id"][CONF_BAYESIAN_OBSERVATIONS]}
    assert obs["sensor.office_ups_used_watts_filtered"]["preset"] == "supporting"
    assert obs["sensor.office_ups_used_watts_filtered"]["signal_weighted"] == "power_monitor"
    assert obs["sensor.office_ups_used_watts_filtered"]["prob_given_true"] < 0.72
    assert obs["light.office_lights"]["preset"] == "supporting"
    assert obs["light.office_lights"]["signal_weighted"] == "actuator"

    # Second run is idempotent
    migrated2, dirty2 = migrate_and_backfill_store_payload(
        None, migrated, _default_store_data, DEFAULT_GLOBAL_SETTINGS
    )
    assert dirty2 is False
    obs2 = {o["entity_id"]: o for o in migrated2["rooms"]["office_id"][CONF_BAYESIAN_OBSERVATIONS]}
    assert (
        obs2["sensor.office_ups_used_watts_filtered"]["prob_given_true"]
        == (obs["sensor.office_ups_used_watts_filtered"]["prob_given_true"])
    )

    # Topology applier also demotes non-human-exclusive observations
    compiled = {
        "compiled_room_rules": {
            "Master Bathroom": {
                "connected_rooms": ["Master Bedroom"],
                "can_be_bounded": True,
                "recommended_inactivity_timeout": 180,
                "spillover_entities_to_downgrade": [],
            }
        }
    }
    bath_cfg = apply_compiled_topology_to_config(
        {
            CONF_ROOM_NAME: "Master Bathroom",
            CONF_BAYESIAN_OBSERVATIONS: [
                {
                    "entity_id": "sensor.master_bathroom_dhumidity",
                    "preset": "strong",
                    "prob_given_true": 0.88,
                    "prob_given_false": 0.05,
                }
            ],
        },
        compiled,
    )
    bath_obs = {o["entity_id"]: o for o in bath_cfg[CONF_BAYESIAN_OBSERVATIONS]}[
        "sensor.master_bathroom_dhumidity"
    ]
    assert bath_obs["preset"] == "supporting"
    assert bath_obs["signal_weighted"] == "environmental"

    # PDDStateGraphView exposes human_exclusive flag per sensor
    coord = RoomPresenceCoordinator(mock_hass, "office_id", migrated["rooms"]["office_id"])
    mock_hass.data = {DOMAIN: {"office_id": coord}}
    view = PDDStateGraphView()
    req = MagicMock()
    req.app = {"hass": mock_hass}
    req.query = {}
    resp = await view.get(req)
    import json

    body = json.loads(resp.text)
    weights = {w["entity_id"]: w for w in body["rooms"][0]["sensor_weights"]}
    assert weights["sensor.office_ups_used_watts_filtered"]["human_exclusive"] is False
    assert weights["light.office_lights"]["human_exclusive"] is False
