"""Spec-driven tests for the transitions-based RoomPresenceStateMachine (STATE-01..STATE-06)."""

from __future__ import annotations

import pytest

from custom_components.presence_detection_designer.const import OccupancyState
from custom_components.presence_detection_designer.evidence_snapshot import RoomEvidenceSnapshot
from custom_components.presence_detection_designer.state_machine import RoomPresenceStateMachine


@pytest.mark.requirement("STATE-01", category="STATE", req_type="PositiveFeature")
def test_nominal_occupancy_lifecycle():
    """@requirement STATE-01: Room transitions vacant -> occupied_confirmed -> occupied_cooling -> vacant."""
    sm = RoomPresenceStateMachine(name="Living Room", inactivity_timeout=120)
    assert sm.state == OccupancyState.VACANT
    assert sm.is_present is False
    assert sm.is_cooling_down is False

    # Active human trigger enters occupied_confirmed
    sm.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.living_room_motion"}),
            human_present=True,
            last_trigger_entity="binary_sensor.living_room_motion",
        ),
        now_ts=1000.0,
    )
    assert sm.state == OccupancyState.OCCUPIED_CONFIRMED
    assert sm.is_present is True
    assert sm.is_cooling_down is False

    # Evidence clears -> enters occupied_cooling with full inactivity_timeout
    sm.apply_evidence(RoomEvidenceSnapshot(), now_ts=1010.0)
    assert sm.state == OccupancyState.OCCUPIED_COOLING
    assert sm.is_present is True
    assert sm.is_cooling_down is True
    assert sm.cooling_remaining_sec == 120

    # Advancing time past timeout vacates room
    result = sm.advance_time(120.0, now_ts=1130.0)
    assert result == "VACATED"
    assert sm.state == OccupancyState.VACANT
    assert sm.is_present is False
    assert sm.is_cooling_down is False
    assert sm.cooling_remaining_sec == 0


@pytest.mark.requirement("STATE-02", category="STATE", req_type="PositiveFeature")
def test_timer_lifecycle_and_retrigger_cancellation():
    """@requirement STATE-02: Retrigger during cooling cancels countdown cleanly and resets timer on next clear."""
    canceled_handles: list[str] = []
    scheduled_handles: list[tuple[float, str]] = []

    def _schedule(delay: float, callback):
        token = f"timer_{len(scheduled_handles) + 1}"
        scheduled_handles.append((delay, token))

        def _cancel():
            canceled_handles.append(token)

        return _cancel

    sm = RoomPresenceStateMachine(
        name="Office",
        inactivity_timeout=60,
        max_hold_timeout=300,
        timer_scheduler=_schedule,
    )

    sm.apply_evidence(
        RoomEvidenceSnapshot(active_triggers=frozenset({"binary_sensor.office_motion"})),
        now_ts=100.0,
    )
    assert len(scheduled_handles) == 0

    # Enter cooling -> timer scheduled
    sm.apply_evidence(RoomEvidenceSnapshot(), now_ts=110.0)
    assert sm.state == OccupancyState.OCCUPIED_COOLING
    assert scheduled_handles == [(60.0, "timer_1")]
    assert sm.advance_time(30.0, now_ts=140.0) is None
    assert sm.cooling_remaining_sec == 30

    # Retrigger -> cancels timer_1 and returns to confirmed
    sm.apply_evidence(
        RoomEvidenceSnapshot(active_triggers=frozenset({"binary_sensor.office_motion"})),
        now_ts=145.0,
    )
    assert sm.state == OccupancyState.OCCUPIED_CONFIRMED
    assert canceled_handles == ["timer_1"]
    assert sm.cooling_remaining_sec == 0

    # Clear again -> fresh 60s timer_2
    sm.apply_evidence(RoomEvidenceSnapshot(), now_ts=150.0)
    assert sm.state == OccupancyState.OCCUPIED_COOLING
    assert scheduled_handles[-1] == (60.0, "timer_2")
    assert sm.cooling_remaining_sec == 60


@pytest.mark.requirement("STATE-03", category="STATE", req_type="PositiveFeature")
def test_audit_log_records_accepted_and_blocked_transitions():
    """@requirement STATE-03: Audit log captures both accepted transitions and guard-blocked triggers."""
    sm = RoomPresenceStateMachine(name="Kitchen", inactivity_timeout=60)

    # Trigger blocked because snapshot has no human evidence
    sm.apply_evidence(RoomEvidenceSnapshot(), now_ts=10.0)
    assert sm.state == OccupancyState.VACANT

    # Trigger accepted
    sm.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.kitchen_motion"}),
            human_present=True,
        ),
        now_ts=20.0,
    )
    assert sm.state == OccupancyState.OCCUPIED_CONFIRMED

    # Direct countdown_expired rejected while in occupied_confirmed
    sm.countdown_expired(now_ts=25.0)
    assert sm.state == OccupancyState.OCCUPIED_CONFIRMED

    assert len(sm.transition_history) >= 2
    accepted_entry = next(
        e
        for e in sm.transition_history
        if e["accepted"] and e["dest"] == OccupancyState.OCCUPIED_CONFIRMED
    )
    assert accepted_entry["source"] == OccupancyState.VACANT
    assert accepted_entry["trigger"] == "evidence_detected"
    assert accepted_entry["timestamp"] == 20.0

    blocked_entry = next(
        e
        for e in sm.transition_history
        if not e["accepted"] and e["trigger"] == "countdown_expired"
    )
    assert blocked_entry["source"] == OccupancyState.OCCUPIED_CONFIRMED


@pytest.mark.requirement("STATE-04", category="STATE", req_type="PositiveFeature")
def test_mermaid_diagram_generation():
    """@requirement STATE-04: Machine exports live Mermaid stateDiagram-v2 matching declared states."""
    sm = RoomPresenceStateMachine(name="Dining Room")
    diagram = sm.get_mermaid_diagram()
    assert "stateDiagram-v2" in diagram
    for state_token in (
        "vacant",
        "occupied",
        "confirmed",
        "holding",
        "cooling",
        "verifying",
        "override",
    ):
        assert state_token in diagram


@pytest.mark.requirement("STATE-05", category="STATE", req_type="PositiveFeature")
def test_evidence_snapshot_drives_transitions():
    """@requirement STATE-05: Normalized RoomEvidenceSnapshot drives holding vs confirmed vs cooling states."""
    sm = RoomPresenceStateMachine(name="Family Room", inactivity_timeout=90, max_hold_timeout=600)

    # Direct motion -> confirmed
    sm.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.fr_pir"}), human_present=True
        ),
        now_ts=100.0,
    )
    assert sm.state == OccupancyState.OCCUPIED_CONFIRMED

    # Motion stops while TV sustaining condition active -> occupied_holding
    sm.apply_evidence(
        RoomEvidenceSnapshot(active_conditions=("media_player.tv == playing",)),
        now_ts=110.0,
    )
    assert sm.state == OccupancyState.OCCUPIED_HOLDING
    assert sm.is_present is True

    # Hold clears -> occupied_cooling
    sm.apply_evidence(RoomEvidenceSnapshot(), now_ts=200.0)
    assert sm.state == OccupancyState.OCCUPIED_COOLING
    assert sm.cooling_remaining_sec == 90


@pytest.mark.requirement("STATE-06", category="STATE", req_type="PositiveFeature")
def test_adjacent_handoff_clears_cooling_room():
    """@requirement STATE-06: Adjacent room becoming occupied clears a cooling room immediately with handoff attribution."""
    sm = RoomPresenceStateMachine(name="Kitchen", inactivity_timeout=120)
    sm.apply_evidence(
        RoomEvidenceSnapshot(active_triggers=frozenset({"binary_sensor.kitchen_motion"})),
        now_ts=100.0,
    )
    sm.apply_evidence(RoomEvidenceSnapshot(), now_ts=110.0)
    assert sm.state == OccupancyState.OCCUPIED_COOLING

    cleared = sm.handle_adjacent_room_occupied("Dining Room", now_ts=115.0)
    assert cleared is True
    assert sm.state == OccupancyState.VACANT
    assert sm.is_present is False
    assert sm.last_handoff_room == "Dining Room"


@pytest.mark.requirement("STATE-07", category="STATE", req_type="PositiveFeature")
def test_clock_anchored_scheduler_prevents_stale_virtual_now(monkeypatch):
    """@requirement STATE-07: Scheduler callbacks advance from time.time() elapsed since explicit now_ts anchor."""
    fake_wall = [1_000_000.0]
    monkeypatch.setattr(
        "custom_components.presence_detection_designer.state_machine.time.time",
        lambda: fake_wall[0],
    )
    callbacks = []

    def _schedule(delay: float, callback):
        callbacks.append((fake_wall[0] + delay, callback))
        return lambda: None

    sm = RoomPresenceStateMachine(
        name="Living Room",
        inactivity_timeout=120,
        verify_timeout=30,
        llm_enabled=True,
        timer_scheduler=_schedule,
    )

    sm.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.lr_motion"}), human_present=True
        ),
        now_ts=1_000_010.0,
    )
    fake_wall[0] = 1_000_020.0
    sm.apply_evidence(RoomEvidenceSnapshot(), now_ts=1_000_020.0)
    assert sm.state == OccupancyState.OCCUPIED_COOLING

    # Simulate an intervening explicit tick before countdown expires
    fake_wall[0] = 1_000_021.0
    assert sm.advance_time(0.0, now_ts=1_000_021.0) is None

    # Fire countdown_expired at 1_000_140.0; verify_timeout (30s) must be anchored at 1_000_140.0 (deadline 1_000_170.0)
    fake_wall[0] = 1_000_140.0
    callbacks[-1][1]()
    assert sm.state == OccupancyState.OCCUPIED_VERIFYING

    # 1 second later (1_000_141.0), verify_timeout MUST NOT prematurely fire
    fake_wall[0] = 1_000_141.0
    assert sm.advance_time(0.0, now_ts=1_000_141.0) is None
    assert sm.state == OccupancyState.OCCUPIED_VERIFYING

    # Only after verify_timeout (1_000_170.0) should it vacate
    fake_wall[0] = 1_000_170.0
    assert sm.advance_time(0.0, now_ts=1_000_170.0) == "VACATED"
    assert sm.state == OccupancyState.VACANT
