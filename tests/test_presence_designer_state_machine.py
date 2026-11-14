"""Tests for RoomPresenceStateMachine core lifecycle, holding, LLM verification, and overrides."""

import pytest

from custom_components.presence_detection_designer.const import OccupancyState
from custom_components.presence_detection_designer.evidence_snapshot import RoomEvidenceSnapshot
from custom_components.presence_detection_designer.state_machine import RoomPresenceStateMachine


@pytest.mark.requirement("STATE-01", category="STATE", req_type="PositiveFeature")
def test_open_mode_trigger_and_timeout():
    """Test trigger activation, cooling entry, virtual clock tick, and vacancy."""
    sm = RoomPresenceStateMachine(
        name="Living Room",
        inactivity_timeout=10,
        llm_enabled=False,
    )
    assert sm.is_present is False
    assert sm.state == OccupancyState.VACANT

    sm.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.pir"}),
            human_present=True,
            last_trigger_entity="binary_sensor.pir",
        ),
        now_ts=100.0,
    )
    assert sm.is_present is True
    assert sm.state == OccupancyState.OCCUPIED_CONFIRMED
    assert sm.last_trigger_entity == "binary_sensor.pir"

    sm.apply_evidence(RoomEvidenceSnapshot(), now_ts=110.0)
    assert sm.is_present is True
    assert sm.state == OccupancyState.OCCUPIED_COOLING
    assert sm.cooling_remaining_sec == 10

    assert sm.advance_time(5.0, now_ts=115.0) is None
    assert sm.cooling_remaining_sec == 5
    assert sm.is_present is True

    action = sm.advance_time(5.0, now_ts=120.0)
    assert action == "VACATED"
    assert sm.is_present is False
    assert sm.state == OccupancyState.VACANT


@pytest.mark.requirement("GUARD-01", category="GUARD", req_type="FailClosedGuardrail")
def test_sustaining_condition_holds_with_finite_max_hold_cap():
    """Sustaining condition holds occupancy in occupied_holding and expires safely at max_hold_timeout."""
    sm = RoomPresenceStateMachine(
        name="Living Room",
        inactivity_timeout=10,
        max_hold_timeout=60,
        llm_enabled=False,
    )
    sm.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.pir"}),
            active_conditions=("media_player.tv == playing",),
            human_present=True,
        ),
        now_ts=100.0,
    )
    assert sm.state == OccupancyState.OCCUPIED_CONFIRMED

    sm.apply_evidence(
        RoomEvidenceSnapshot(active_conditions=("media_player.tv == playing",)),
        now_ts=110.0,
    )
    assert sm.is_present is True
    assert sm.state == OccupancyState.OCCUPIED_HOLDING

    assert sm.advance_time(20.0, now_ts=130.0) is None
    assert sm.state == OccupancyState.OCCUPIED_HOLDING

    sm.apply_evidence(RoomEvidenceSnapshot(), now_ts=135.0)
    assert sm.state == OccupancyState.OCCUPIED_COOLING
    assert sm.cooling_remaining_sec == 10


@pytest.mark.requirement("GUARD-05", category="GUARD", req_type="FailClosedGuardrail")
def test_llm_verification_extension():
    """Cooling expiration triggers Vision/LLM verification; confirmation extends cooling."""
    sm = RoomPresenceStateMachine(
        name="Den",
        inactivity_timeout=5,
        extend_timeout=60,
        llm_enabled=True,
    )
    sm.apply_evidence(
        RoomEvidenceSnapshot(active_triggers=frozenset({"binary_sensor.pir"}), human_present=True),
        now_ts=100.0,
    )
    sm.apply_evidence(RoomEvidenceSnapshot(), now_ts=105.0)

    action = sm.advance_time(5.0, now_ts=110.0)
    assert action == "REQUEST_LLM_VERIFY"
    assert sm.state == OccupancyState.OCCUPIED_VERIFYING
    assert sm.is_present is True

    sm.handle_llm_result(
        person_detected=True, reasoning="Person reading book on sofa", now_ts=112.0
    )
    assert sm.is_present is True
    assert sm.state == OccupancyState.OCCUPIED_COOLING
    assert sm.cooling_remaining_sec == 60
    assert sm.last_llm_result["reason"] == "Person reading book on sofa"


@pytest.mark.requirement("GUARD-04", category="GUARD", req_type="FailClosedGuardrail")
def test_manual_override():
    """Manual override forces occupancy regardless of evidence."""
    sm = RoomPresenceStateMachine(name="Guest Room")
    assert sm.is_present is False

    sm.set_override(True, now_ts=10.0)
    assert sm.is_present is True
    assert sm.state == OccupancyState.OVERRIDE

    sm.set_override(False, now_ts=20.0)
    assert sm.is_present is False
    assert sm.state == OccupancyState.VACANT


@pytest.mark.requirement("STATE-06", category="STATE", req_type="PositiveFeature")
def test_adjacent_handoff_clears_cooling_room():
    """Adjacent room detection vacates room when no active evidence holds it."""
    sm = RoomPresenceStateMachine(name="Master Bathroom", inactivity_timeout=60, llm_enabled=False)
    sm.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.motion"}), human_present=True
        ),
        now_ts=100.0,
    )
    sm.apply_evidence(RoomEvidenceSnapshot(), now_ts=105.0)
    assert sm.state == OccupancyState.OCCUPIED_COOLING

    cleared = sm.handle_adjacent_room_occupied("Master Bedroom", now_ts=110.0)
    assert cleared is True
    assert sm.is_present is False
    assert sm.state == OccupancyState.VACANT
    assert sm.last_handoff_room == "Master Bedroom"
