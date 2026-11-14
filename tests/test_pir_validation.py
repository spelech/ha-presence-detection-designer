"""Tests for Phase 2 PIRValidationStateMachine, pluggable corroborators, and cooldown weighting."""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest

from custom_components.presence_detection_designer.bayesian_engine import (
    evaluate_bayesian,
    resolve_observation_weights,
)
from custom_components.presence_detection_designer.const import (
    CONF_BAYESIAN_OBSERVATIONS,
    CONF_BAYESIAN_PRIOR,
    CONF_BAYESIAN_THRESHOLD,
    CONF_BOUNDARY_ENTITIES,
    CONF_INACTIVITY_TIMEOUT,
    CONF_MODE,
    CONF_PIR_CANDIDATE_WINDOW,
    CONF_PIR_VALIDATION_ENABLED,
    CONF_ROOM_NAME,
    CONF_TRIGGER_ENTITIES,
    DOMAIN,
    Mode,
    OccupancyState,
    PIRValidationState,
)
from custom_components.presence_detection_designer.coordinator import RoomPresenceCoordinator
from custom_components.presence_detection_designer.pir_validation import (
    PIRCorroborationContext,
    PIRValidationStateMachine,
)
from custom_components.presence_detection_designer.sensor_reliability import (
    BATTERY_CAMERA_PIR_ENTITIES,
    ECOBEE_MOTION_ENTITIES,
    ECOBEE_OCCUPANCY_ENTITIES,
    RING_KEYPAD_PIR_ENTITIES,
    WYZE_PLACED_PIR_ENTITIES,
    apply_cooldown_weight,
    classify_sensor_reliability,
    weight_from_cooldown,
)
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


@pytest.mark.requirement("PIR-01", category="PIR", req_type="FailClosedGuardrail")
def test_pir_validation_unit_false_positive_suppression_and_mermaid() -> None:
    """@requirement PIR-01: Single uncorroborated PIR stays candidate for 10s then expires."""
    pv = PIRValidationStateMachine("Family Room", candidate_window_sec=10.0)
    assert pv.state == PIRValidationState.IDLE
    assert pv.pir_confirmed is False

    mermaid = pv.get_mermaid_diagram()
    assert "stateDiagram-v2" in mermaid
    for state_name in ("idle", "candidate", "confirmed", "suppressed"):
        assert state_name in mermaid

    # Brief spike on -> off at t=100..102 stays candidate until 10s window expires at t=110
    assert pv.on_pir_triggered("binary_sensor.family_room_motion_occupancy", now_ts=100.0) is False
    assert pv.state == PIRValidationState.CANDIDATE
    assert pv.pir_candidate is True
    assert pv.candidate_remaining_sec == 10

    pv.on_pir_cleared("binary_sensor.family_room_motion_occupancy", now_ts=102.0)
    assert pv.state == PIRValidationState.CANDIDATE  # stays open for late corroboration

    pv.advance_time(now_ts=109.0)
    assert pv.state == PIRValidationState.CANDIDATE
    pv.advance_time(now_ts=110.0)
    assert pv.state == PIRValidationState.IDLE
    assert pv.pir_confirmed is False

    # Latched PIR spike staying 'on' past 10s transitions candidate -> suppressed -> idle on clear
    assert pv.on_pir_triggered("binary_sensor.family_room_motion_occupancy", now_ts=200.0) is False
    assert pv.state == PIRValidationState.CANDIDATE
    pv.advance_time(now_ts=210.0)
    assert pv.state == PIRValidationState.SUPPRESSED
    assert pv.pir_confirmed is False

    pv.on_pir_cleared("binary_sensor.family_room_motion_occupancy", now_ts=220.0)
    assert pv.state == PIRValidationState.IDLE
    assert len(pv.transition_history) >= 4


@pytest.mark.requirement("PIR-01", category="PIR", req_type="FailClosedGuardrail")
def test_slow_pir_cannot_self_corroborate_via_repeated_pulses() -> None:
    """@requirement PIR-01: Slow sensors (Ecobee / battery cam) do not self-corroborate on repeat."""
    pv = PIRValidationStateMachine("Office", candidate_window_sec=10.0)
    assert pv.on_pir_triggered("binary_sensor.office_motion", is_slow=True, now_ts=100.0) is False
    pv.on_pir_cleared("binary_sensor.office_motion", now_ts=102.0)
    assert pv.on_pir_triggered("binary_sensor.office_motion", is_slow=True, now_ts=105.0) is False
    assert pv.state == PIRValidationState.CANDIDATE
    assert pv.pir_confirmed is False


@pytest.mark.requirement("PIR-02", category="PIR", req_type="PositiveFeature")
def test_pir_corroboration_any_one_of_four_sources() -> None:
    """@requirement PIR-02: ANY ONE of camera, trajectory, ble, or time_history promotes PIR."""
    # 1. Camera corroboration
    pv_cam = PIRValidationStateMachine("Living Room")
    ok = pv_cam.on_pir_triggered(
        "binary_sensor.living_room_motion_occupancy",
        ctx=PIRCorroborationContext(
            camera_confirmed=True,
            camera_detail="binary_sensor.living_room_person_occupancy",
        ),
        now_ts=10.0,
    )
    assert ok is True
    assert pv_cam.state == PIRValidationState.CONFIRMED
    assert pv_cam.last_corroboration_source == "camera"

    # 2. Trajectory corroboration (adjacent room or connected door)
    pv_traj = PIRValidationStateMachine("Garage")
    assert pv_traj.on_pir_triggered("binary_sensor.garage_keypad_motion", now_ts=10.0) is False
    assert pv_traj.on_corroboration_update(
        PIRCorroborationContext(trajectory_valid=True, trajectory_detail="Laundry Room recent"),
        now_ts=13.0,
    )
    assert pv_traj.pir_confirmed is True
    assert pv_traj.last_corroboration_source == "trajectory"

    # 3. Bermuda BLE corroboration
    pv_ble = PIRValidationStateMachine("Office")
    assert pv_ble.on_pir_triggered("binary_sensor.office_motion_occupancy", now_ts=10.0) is False
    assert pv_ble.on_corroboration_update(
        PIRCorroborationContext(
            ble_corroborated=True,
            ble_detail="sensor.steve_s_s25_ble_area in Office",
        ),
        now_ts=14.0,
    )
    assert pv_ble.pir_confirmed is True
    assert pv_ble.last_corroboration_source == "ble"

    # 4a. Time-history: 2nd distinct sensor active in same room
    pv_multi = PIRValidationStateMachine("Garage")
    assert pv_multi.on_pir_triggered("binary_sensor.garage_keypad_motion", now_ts=10.0) is False
    assert pv_multi.on_pir_triggered("binary_sensor.garage_ring_motion", now_ts=12.0) is True
    assert pv_multi.last_corroboration_source == "time_history"

    # 4b. Time-history: 2nd fast-PIR rising edge within 60s
    pv_pulse = PIRValidationStateMachine("Kitchen")
    assert pv_pulse.on_pir_triggered("binary_sensor.kitchen_motion_occupancy", now_ts=10.0) is False
    pv_pulse.on_pir_cleared("binary_sensor.kitchen_motion_occupancy", now_ts=12.0)
    assert pv_pulse.on_pir_triggered("binary_sensor.kitchen_motion_occupancy", now_ts=16.0) is True
    assert pv_pulse.last_corroboration_source == "time_history"


@pytest.mark.requirement("PIR-01", category="PIR", req_type="FailClosedGuardrail")
@pytest.mark.requirement("PIR-02", category="PIR", req_type="PositiveFeature")
@pytest.mark.asyncio
async def test_coordinator_pir_validation_async_corroboration_and_bayesian_gate(tmp_path) -> None:
    """@requirement PIR-02: Coordinator gates uncorroborated PIR/Bayesian spikes until corroborated."""
    rooms = [
        {
            CONF_ROOM_NAME: "Living Room",
            CONF_MODE: str(Mode.OPEN),
            CONF_INACTIVITY_TIMEOUT: 30,
            CONF_PIR_VALIDATION_ENABLED: True,
            CONF_PIR_CANDIDATE_WINDOW: 10,
            CONF_TRIGGER_ENTITIES: ["binary_sensor.living_room_motion_occupancy"],
            CONF_BAYESIAN_PRIOR: 0.20,
            CONF_BAYESIAN_THRESHOLD: 0.75,
            CONF_BAYESIAN_OBSERVATIONS: [
                {
                    "entity_id": "binary_sensor.living_room_motion_occupancy",
                    "prob_given_true": 0.92,
                    "prob_given_false": 0.04,
                    "target_state": "on",
                }
            ],
        },
        {
            CONF_ROOM_NAME: "Garage",
            CONF_MODE: str(Mode.BOUNDED),
            CONF_INACTIVITY_TIMEOUT: 60,
            CONF_PIR_VALIDATION_ENABLED: True,
            CONF_PIR_CANDIDATE_WINDOW: 10,
            CONF_BOUNDARY_ENTITIES: ["binary_sensor.garage_side_door"],
            CONF_TRIGGER_ENTITIES: [
                "binary_sensor.garage_keypad_motion",
                "binary_sensor.garage_ring_motion",
            ],
        },
    ]

    with VirtualHAHarness(
        storage_dir=tmp_path,
        global_settings={"ble_trackers": ["sensor.steve_s_s25_ble_area"]},
    ) as harness:
        await harness.async_add_rooms(rooms)
        harness.set_state("binary_sensor.living_room_motion_occupancy", "off")
        harness.set_state("sensor.steve_s_s25_ble_area", "Away")
        harness.set_state("binary_sensor.garage_keypad_motion", "off")
        harness.set_state("binary_sensor.garage_ring_motion", "off")
        harness.set_state("binary_sensor.garage_side_door", "off")
        harness.advance(2)

        lr = harness.coordinators["Living Room"]
        # Solo PIR spike (even though Bayesian obs would push posterior > 0.75) stays candidate/vacant
        harness.set_state("binary_sensor.living_room_motion_occupancy", "on")
        assert lr.pir_validator.state == PIRValidationState.CANDIDATE
        assert lr.state_machine.state == OccupancyState.VACANT

        # Brief PIR clears at t+2s, still inside 10s window
        harness.advance(2)
        harness.set_state("binary_sensor.living_room_motion_occupancy", "off")
        assert lr.pir_validator.state == PIRValidationState.CANDIDATE
        assert lr.state_machine.state == OccupancyState.VACANT

        # Async BLE arrival at t+5s promotes candidate -> occupied_confirmed -> occupied_cooling!
        harness.advance(3)
        harness.set_state("sensor.steve_s_s25_ble_area", "Living Room")
        assert lr.state_machine.is_present is True
        assert lr.state_machine.state == OccupancyState.OCCUPIED_COOLING
        assert any(
            t["dest"] == OccupancyState.OCCUPIED_CONFIRMED
            for t in lr.state_machine.transition_history
        )

        # Cooling expires cleanly after 30s -> vacant
        harness.advance(31)
        assert lr.state_machine.state == OccupancyState.VACANT

        # Connected door opening in Garage corroborates Garage Keypad PIR via trajectory
        garage = harness.coordinators["Garage"]
        harness.set_state("binary_sensor.garage_keypad_motion", "on")
        assert garage.pir_validator.state == PIRValidationState.CANDIDATE
        assert garage.state_machine.state == OccupancyState.VACANT

        harness.advance(3)
        harness.set_state("binary_sensor.garage_side_door", "on")
        assert garage.pir_validator.state == PIRValidationState.CONFIRMED
        assert garage.pir_validator.last_corroboration_source == "trajectory"
        assert garage.state_machine.state == OccupancyState.OCCUPIED_CONFIRMED


@pytest.mark.requirement("PIR-03", category="PIR", req_type="PositiveFeature")
def test_cooldown_weight_curve_and_bayesian_tempering() -> None:
    """@requirement PIR-03: Cooldown reliability weights decay monotonically and stop solo Ecobee."""
    w_fast = weight_from_cooldown(45.0)
    w_60 = weight_from_cooldown(60.0)
    w_180_batt = weight_from_cooldown(180.0, battery_powered=True)
    w_300 = weight_from_cooldown(300.0)
    w_1800 = weight_from_cooldown(1800.0)

    assert w_fast == 1.0
    assert w_60 == 1.0
    assert 0.30 <= w_180_batt < w_300 or abs(w_180_batt - w_300) < 0.1
    assert w_180_batt < 0.45
    assert w_300 < 0.45
    assert w_1800 == 0.12

    # Unweighted strong Ecobee obs would pass 0.75; cooldown tempering keeps solo Ecobee < 0.75
    pt_eco, pf_eco = apply_cooldown_weight(0.88, 0.05, 300.0)
    assert pt_eco > pf_eco
    assert pt_eco < 0.80
    ev = evaluate_bayesian(
        [
            {
                "entity_id": "binary_sensor.office_motion",
                "prob_given_true": 0.88,
                "prob_given_false": 0.05,
                "cooldown_sec": 300.0,
            }
        ],
        lambda _eid: MagicMock(state="on", attributes={}),
        prior=0.20,
        threshold=0.75,
    )
    assert ev.probability < 0.75
    assert ev.is_occupied is False

    # Battery camera PIR (family_room_ring_motion) solo stays below 0.75
    ev_ring = evaluate_bayesian(
        [
            {
                "entity_id": "binary_sensor.family_room_ring_motion",
                "prob_given_true": 0.88,
                "prob_given_false": 0.05,
                "auto_cooldown_weight": True,
            }
        ],
        lambda _eid: MagicMock(state="on", attributes={}),
        prior=0.20,
        threshold=0.75,
    )
    assert ev_ring.probability < 0.75
    assert ev_ring.is_occupied is False

    # resolve_observation_weights auto-tempers when cooldown_sec provided
    _, pt_r, pf_r = resolve_observation_weights(
        {
            "entity_id": "binary_sensor.thermostat_occupancy",
            "prob_given_true": 0.85,
            "prob_given_false": 0.08,
            "cooldown_sec": 1800.0,
        }
    )
    assert 0.50 < pt_r < 0.65
    assert 0.35 < pf_r < 0.50


@pytest.mark.requirement("PIR-03", category="PIR", req_type="PositiveFeature")
def test_hardware_inventory_classification_floorplan_and_migrations(mock_hass) -> None:
    """@requirement PIR-03: Verify Garage Keypad move, 3 Wyze sensors, 7 Ecobees, and idempotent migration."""
    assert len(ECOBEE_MOTION_ENTITIES) == 7
    assert len(ECOBEE_OCCUPANCY_ENTITIES) == 7
    assert len(WYZE_PLACED_PIR_ENTITIES) == 3
    assert len(RING_KEYPAD_PIR_ENTITIES) == 3
    assert "binary_sensor.family_room_ring_motion" in BATTERY_CAMERA_PIR_ENTITIES
    assert "binary_sensor.garage_keypad_motion" in RING_KEYPAD_PIR_ENTITIES

    fp = get_default_floorplan()
    fp_sensors = {s["entity_id"]: s for s in fp.get("sensors") or []}
    assert "binary_sensor.garage_keypad_motion" in fp_sensors
    assert fp_sensors["binary_sensor.garage_keypad_motion"]["host_room"] == "Garage"
    assert "binary_sensor.keypad_v2_motion_detection" not in fp_sensors
    assert set(WYZE_PLACED_PIR_ENTITIES).issubset(fp_sensors.keys())
    assert "binary_sensor.kitchen_motion" not in fp_sensors
    assert "binary_sensor.upstairs_stairs_motion" not in fp_sensors
    assert not any(
        "ecobee" in eid and s.get("host_room") == "Kitchen" for eid, s in fp_sensors.items()
    )

    assert (
        classify_sensor_reliability("binary_sensor.living_room_person_occupancy").category
        == "camera"
    )
    assert classify_sensor_reliability("binary_sensor.family_room_ring_motion").is_slow is True
    assert (
        classify_sensor_reliability("binary_sensor.family_room_ring_motion").battery_powered is True
    )
    assert classify_sensor_reliability("binary_sensor.thermostat_occupancy").cooldown_sec == 1800.0
    assert (
        classify_sensor_reliability("sensor.steve_s_s25_ble_area").requires_pir_validation is False
    )

    # Store migration: removes keypad_v2 from Laundry Room, adds garage_keypad_motion to Garage, downweights Ecobee
    payload = {
        "rooms": {
            "lr_laundry": {
                "room_name": "Laundry Room",
                "trigger_entities": [
                    "binary_sensor.laundry_room_ring_motion",
                    "binary_sensor.keypad_v2_motion_detection",
                ],
                "bayesian_observations": [
                    {
                        "entity_id": "binary_sensor.keypad_v2_motion_detection",
                        "prob_given_true": 0.88,
                        "prob_given_false": 0.05,
                    }
                ],
            },
            "garage": {
                "room_name": "Garage",
                "trigger_entities": ["binary_sensor.garage_ring_motion"],
                "bayesian_observations": [
                    {
                        "entity_id": "binary_sensor.garage_ring_motion",
                        "prob_given_true": 0.90,
                        "prob_given_false": 0.05,
                    }
                ],
            },
            "office": {
                "room_name": "Office",
                "trigger_entities": ["binary_sensor.office_motion_occupancy"],
                "bayesian_observations": [
                    {
                        "entity_id": "binary_sensor.office_motion",
                        "prob_given_true": 0.85,
                        "prob_given_false": 0.10,
                    }
                ],
            },
        },
        "floorplan": {
            "sensors": [
                {
                    "id": "binary_sensor.keypad_v2_motion_detection",
                    "entity_id": "binary_sensor.keypad_v2_motion_detection",
                    "host_room": "Laundry Room",
                }
            ]
        },
        "spatial_topology": {},
    }
    migrated, dirty = migrate_and_backfill_store_payload(
        mock_hass, payload, _default_store_data, DEFAULT_GLOBAL_SETTINGS
    )
    assert dirty is True
    assert (
        "binary_sensor.keypad_v2_motion_detection"
        not in migrated["rooms"]["lr_laundry"]["trigger_entities"]
    )
    assert "binary_sensor.garage_keypad_motion" in migrated["rooms"]["garage"]["trigger_entities"]
    eco_obs = next(
        o
        for o in migrated["rooms"]["office"]["bayesian_observations"]
        if o["entity_id"] == "binary_sensor.office_motion"
    )
    assert eco_obs["cooldown_sec"] == 300.0
    assert eco_obs["prob_given_true"] < 0.80
    # Second pass is idempotent
    migrated2, dirty2 = migrate_and_backfill_store_payload(
        mock_hass, migrated, _default_store_data, DEFAULT_GLOBAL_SETTINGS
    )
    assert dirty2 is False
    payload = migrated2

    # Topology rule applier is also idempotent on slow observations
    updated1 = apply_compiled_topology_to_config(payload["rooms"]["office"], {"rooms": {}})
    updated2 = apply_compiled_topology_to_config(updated1, {"rooms": {}})
    assert updated1[CONF_BAYESIAN_OBSERVATIONS] == updated2[CONF_BAYESIAN_OBSERVATIONS]

    # PDDStateGraphView returns PIR graph & sensor_weights
    coord = RoomPresenceCoordinator(mock_hass, "office_entry", updated1)
    mock_hass.data[DOMAIN] = {"office_entry": coord}
    view = PDDStateGraphView()
    req = MagicMock()
    req.app = {"hass": mock_hass}
    req.query = {}
    resp = view.get(req)
    import asyncio
    import json as _json

    web_resp = asyncio.run(resp)
    body = _json.loads(web_resp.text)
    room_payload = body["rooms"][0]
    assert "pir_mermaid_diagram" in room_payload
    assert room_payload["pir_validation_state"] == "idle"
    eco_w = next(
        w for w in room_payload["sensor_weights"] if w["entity_id"] == "binary_sensor.office_motion"
    )
    assert eco_w["cooldown_sec"] == 300.0
