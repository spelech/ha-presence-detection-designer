"""Tests for SIGNAL-01..SIGNAL-03: Person-coupled trigger gate & non-exclusive signal demotion."""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest

from custom_components.presence_detection_designer.api.views import PDDStateGraphView
from custom_components.presence_detection_designer.const import (
    CONF_BAYESIAN_OBSERVATIONS,
    CONF_BAYESIAN_PRIOR,
    CONF_BAYESIAN_THRESHOLD,
    CONF_INACTIVITY_TIMEOUT,
    CONF_MODE,
    CONF_ROOM_NAME,
    CONF_TRIGGER_ENTITIES,
    DOMAIN,
    OccupancyState,
)
from custom_components.presence_detection_designer.diagnostics.spatial_inference import (
    evaluate_spatial_frame,
)
from custom_components.presence_detection_designer.engine.bayesian_engine import (
    resolve_observation_weights,
)
from custom_components.presence_detection_designer.engine.coordinator import RoomPresenceCoordinator
from custom_components.presence_detection_designer.engine.sensor_reliability import (
    classify_sensor_reliability,
    is_human_exclusive_initiator,
)
from custom_components.presence_detection_designer.spatial.spatial_topology import (
    get_default_floorplan,
)
from custom_components.presence_detection_designer.spatial.topology_rule_applier import (
    apply_compiled_topology_to_config,
)
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


@pytest.mark.requirement("SIGNAL-02", category="SIGNAL", req_type="PositiveFeature")
@pytest.mark.asyncio
async def test_migration_topology_and_state_graph_demote_and_label_non_exclusive(
    mock_hass,
) -> None:
    """@requirement SIGNAL-02: Topology applier demotes non-exclusive obs."""
    # Topology applier demotes non-human-exclusive observations
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
    office_cfg = {
        CONF_ROOM_NAME: "Office",
        CONF_BAYESIAN_OBSERVATIONS: [
            {
                "entity_id": "sensor.office_ups_used_watts_filtered",
                "label": "Office UPS",
                "preset": "supporting",
                "operator": "greater_than",
                "state": "140",
            },
            {
                "entity_id": "light.office_lights",
                "label": "Office Lights",
                "preset": "supporting",
            },
        ],
    }
    coord = RoomPresenceCoordinator(mock_hass, "office_id", office_cfg)
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


@pytest.mark.requirement("SIGNAL-01", category="SIGNAL", req_type="FailClosedGuardrail")
@pytest.mark.asyncio
async def test_ble_decider_supporting_only_never_bypasses_configured_triggers(tmp_path) -> None:
    """When ble_decider_enabled=True, BLE + unconfigured Ecobee PIR cannot bypass configured_triggers to occupy a vacant room."""
    rooms = [
        {
            CONF_ROOM_NAME: "Family Room",
            CONF_MODE: "open",
            CONF_INACTIVITY_TIMEOUT: 20,
            CONF_TRIGGER_ENTITIES: [
                "binary_sensor.family_room_couch_person_occupancy",
                "binary_sensor.family_room_floor_person_occupancy",
            ],
            CONF_BAYESIAN_PRIOR: 0.15,
            CONF_BAYESIAN_THRESHOLD: 0.75,
            CONF_BAYESIAN_OBSERVATIONS: [
                {
                    "entity_id": "binary_sensor.family_room_couch_person_occupancy",
                    "preset": "strong",
                },
                {"entity_id": "binary_sensor.family_room_ecobee_motion", "preset": "supporting"},
                {
                    "entity_id": "sensor.steve_s_s25_ble_area",
                    "operator": "equals",
                    "state": "Family Room",
                    "preset": "moderate",
                },
            ],
        }
    ]

    with VirtualHAHarness(
        storage_dir=tmp_path,
        global_settings={
            "ble_decider_enabled": True,
            "ble_trackers": ["sensor.steve_s_s25_ble_area"],
        },
    ) as harness:
        await harness.async_add_rooms(rooms)
        fr = harness.coordinators["Family Room"]

        harness.set_state("binary_sensor.family_room_couch_person_occupancy", "off")
        harness.set_state("binary_sensor.family_room_floor_person_occupancy", "off")
        harness.set_state("binary_sensor.family_room_ecobee_motion", "on")
        harness.set_state("sensor.steve_s_s25_ble_area", "Family Room")
        harness.advance(5)

        # Neither BLE alone nor BLE + unconfigured Ecobee PIR may initiate occupancy from vacant
        assert fr.state_machine.state == OccupancyState.VACANT
        assert fr.state_machine.is_present is False
        assert fr.state_machine.snapshot.human_present is False
