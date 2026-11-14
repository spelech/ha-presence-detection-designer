"""Spec-driven guardrail tests for bounded liveness, pet exclusion, and fault isolation (GUARD-01..GUARD-05)."""

from __future__ import annotations

import pytest

from custom_components.presence_detection_designer.const import OccupancyState
from custom_components.presence_detection_designer.evidence_snapshot import RoomEvidenceSnapshot
from custom_components.presence_detection_designer.house_perimeter import HousePerimeterTracker
from custom_components.presence_detection_designer.state_machine import RoomPresenceStateMachine


@pytest.mark.requirement("GUARD-01", category="GUARD", req_type="FailClosedGuardrail")
def test_bounded_liveness_prevents_stuck_occupied():
    """@requirement GUARD-01: No occupied/holding state stays occupied indefinitely once direct evidence stops."""
    sm = RoomPresenceStateMachine(
        name="Master Bathroom",
        inactivity_timeout=60,
        max_hold_timeout=300,
        llm_enabled=False,
    )

    # Occupy via blind-pocket hold
    sm.apply_evidence(
        RoomEvidenceSnapshot(active_triggers=frozenset({"binary_sensor.bath_pir"})),
        now_ts=0.0,
    )
    sm.apply_evidence(RoomEvidenceSnapshot(spatial_blind_pocket_hold=True), now_ts=10.0)
    assert sm.state == OccupancyState.OCCUPIED_HOLDING

    # Holding must expire after max_hold_timeout into cooling, never stay stuck forever
    res1 = sm.advance_time(300.0, now_ts=310.0)
    assert res1 == "HOLD_EXPIRED"
    assert sm.state == OccupancyState.OCCUPIED_COOLING

    # Cooling must expire into vacant
    res2 = sm.advance_time(60.0, now_ts=370.0)
    assert res2 == "VACATED"
    assert sm.state == OccupancyState.VACANT
    assert sm.is_present is False


@pytest.mark.requirement("GUARD-02", category="GUARD", req_type="FailClosedGuardrail")
def test_pet_only_never_marks_occupied():
    """@requirement GUARD-02: Pet-only evidence (pet_present=True, human_present=False) keeps room vacant."""
    sm = RoomPresenceStateMachine(name="Living Room")
    sm.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.living_room_motion"}),
            pet_present=True,
            human_present=False,
        ),
        now_ts=100.0,
    )
    assert sm.state == OccupancyState.VACANT
    assert sm.is_present is False

    # Even if Bayesian or trigger flags look noisy, pet-only without human_present/camera stays vacant
    sm.apply_evidence(
        RoomEvidenceSnapshot(
            bayesian_occupied=True,
            bayesian_probability=0.85,
            bayesian_probability_pct=85.0,
            pet_present=True,
            human_present=False,
        ),
        now_ts=105.0,
    )
    assert sm.state == OccupancyState.VACANT
    assert sm.is_present is False


@pytest.mark.requirement("GUARD-03", category="GUARD", req_type="FailClosedGuardrail")
def test_zero_headcount_does_not_clear_occupied_room(mock_hass):
    """@requirement GUARD-03: House headcount dropping to 0 cannot force-clear occupied room state machines."""
    sm = RoomPresenceStateMachine(name="Office", inactivity_timeout=300)
    sm.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.office_motion"}),
            human_present=True,
        ),
        now_ts=50.0,
    )
    assert sm.state == OccupancyState.OCCUPIED_CONFIRMED

    class _DummyCoord:
        room_name = "Office"
        state_machine = sm

        def async_update_listeners(self):
            pass

    mock_hass.data["presence_detection_designer"] = {"office_entry": _DummyCoord()}
    tracker = HousePerimeterTracker(mock_hass)
    tracker.set_headcount(0)

    # Room remains occupied and does not flap
    assert sm.state == OccupancyState.OCCUPIED_CONFIRMED
    assert sm.is_present is True


@pytest.mark.requirement("GUARD-04", category="GUARD", req_type="FailClosedGuardrail")
def test_override_isolation_and_live_recovery():
    """@requirement GUARD-04: Override isolates room from sensor events and re-evaluates live snapshot on clear."""
    sm = RoomPresenceStateMachine(name="Guest Room", inactivity_timeout=60)
    sm.set_override(True, now_ts=10.0)
    assert sm.state == OccupancyState.OVERRIDE
    assert sm.is_present is True

    # Clearing evidence while override is ON does not vacate
    sm.apply_evidence(RoomEvidenceSnapshot(), now_ts=20.0)
    assert sm.state == OccupancyState.OVERRIDE

    # Disabling override with no evidence -> vacant
    sm.set_override(False, now_ts=30.0)
    assert sm.state == OccupancyState.VACANT
    assert sm.is_present is False

    # Enabling override, receiving human evidence, then disabling -> occupied_confirmed
    sm.set_override(True, now_ts=40.0)
    sm.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.guest_pir"}), human_present=True
        ),
        now_ts=45.0,
    )
    sm.set_override(False, now_ts=50.0)
    assert sm.state == OccupancyState.OCCUPIED_CONFIRMED
    assert sm.is_present is True


@pytest.mark.requirement("GUARD-05", category="GUARD", req_type="FailClosedGuardrail")
def test_llm_verify_timeout_fails_to_vacant():
    """@requirement GUARD-05: Stalled/errored LLM verification fails closed to vacant after verify_timeout."""
    sm = RoomPresenceStateMachine(
        name="Living Room",
        inactivity_timeout=60,
        llm_enabled=True,
        verify_timeout=30,
    )
    sm.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.lr_pir"}), human_present=True
        ),
        now_ts=100.0,
    )
    sm.apply_evidence(RoomEvidenceSnapshot(), now_ts=110.0)
    assert sm.state == OccupancyState.OCCUPIED_COOLING

    # Cooling expires -> enters occupied_verifying and requests LLM check
    action = sm.advance_time(60.0, now_ts=170.0)
    assert action == "REQUEST_LLM_VERIFY"
    assert sm.state == OccupancyState.OCCUPIED_VERIFYING
    assert sm.is_present is True

    # LLM hangs for 30s -> verify_timeout fails closed to vacant
    action2 = sm.advance_time(30.0, now_ts=200.0)
    assert action2 == "VACATED"
    assert sm.state == OccupancyState.VACANT
    assert sm.is_present is False


@pytest.mark.requirement("GUARD-06", category="GUARD", req_type="FailClosedGuardrail")
@pytest.mark.asyncio
async def test_sustaining_actuator_never_latches_triggers_or_injects_manual_entry(tmp_path):
    """@requirement GUARD-06: Sustaining actuators outside trigger_entities hold only and never latch triggers."""
    from tests.harness.virtual_ha import VirtualHAHarness

    rooms = [
        {
            "room_name": "Living Room",
            "mode": "open",
            "inactivity_timeout": 30,
            "max_hold_timeout": 120,
            "trigger_entities": ["binary_sensor.lr_motion"],
            "pir_validation_enabled": False,
            "sustaining_conditions": [
                {"entity_id": "media_player.lr_tv", "operator": "equals", "state": "playing"}
            ],
        }
    ]
    with VirtualHAHarness(storage_dir=tmp_path) as harness:
        await harness.async_add_rooms(rooms)
        coord = harness.coordinators["Living Room"]
        harness.set_state("binary_sensor.lr_motion", "off")
        harness.set_state("media_player.lr_tv", "off")
        harness.advance(5)

        # Turning on sustaining actuator alone from vacant must NOT inject manual entry or add to _active_triggers
        harness.set_state("media_player.lr_tv", "playing")
        assert "media_player.lr_tv" not in coord._active_triggers
        assert coord.state_machine.state == OccupancyState.VACANT

        # Now occupy via real trigger, clear trigger -> occupied_holding, then turn TV off -> occupied_cooling -> vacant
        harness.set_state("binary_sensor.lr_motion", "on")
        assert coord.state_machine.state == OccupancyState.OCCUPIED_CONFIRMED
        harness.set_state("binary_sensor.lr_motion", "off")
        assert coord.state_machine.state == OccupancyState.OCCUPIED_HOLDING
        harness.set_state("media_player.lr_tv", "off")
        assert "media_player.lr_tv" not in coord._active_triggers
        assert coord.state_machine.state == OccupancyState.OCCUPIED_COOLING
        harness.advance(31)
        assert coord.state_machine.state == OccupancyState.VACANT


@pytest.mark.requirement("GUARD-07", category="GUARD", req_type="FailClosedGuardrail")
def test_hold_only_spatial_estimate_maps_to_occupied_holding():
    """@requirement GUARD-07: negative_space / blind_pocket without positive drivers holds via occupied_holding."""
    from custom_components.presence_detection_designer.coordinator_helpers import (
        build_coordinator_evidence_snapshot,
    )

    class _FakeCoord:
        _active_triggers = set()
        _active_condition_descs = []
        _last_trigger_entity = None
        _bayesian_drives_occupancy = False
        last_bayesian_eval = None
        last_spatial_estimate = {
            "method": "negative_space",
            "human_present": True,
            "pet_present": False,
            "should_hold_occupied": True,
            "positive_drivers": [],
        }

    snap = build_coordinator_evidence_snapshot(_FakeCoord())
    assert snap.human_present is False
    assert snap.spatial_blind_pocket_hold is True
    assert snap.human_evidence_active is False
    assert snap.has_hold_evidence is True

    sm = RoomPresenceStateMachine(
        name="Master Bathroom", inactivity_timeout=30, max_hold_timeout=120
    )
    sm.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.bath_pir"}), human_present=True
        ),
        now_ts=10.0,
    )
    sm.apply_evidence(snap, now_ts=20.0)
    assert sm.state == OccupancyState.OCCUPIED_HOLDING
    assert sm.advance_time(120.0, now_ts=140.0) == "HOLD_EXPIRED"
    assert sm.state == OccupancyState.OCCUPIED_COOLING
    assert sm.advance_time(30.0, now_ts=170.0) == "VACATED"
    assert sm.state == OccupancyState.VACANT
