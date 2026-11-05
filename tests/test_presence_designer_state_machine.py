"""Test Presence Detection Designer State Machine."""

from custom_components.presence_detection_designer.const import BoxState, Mode
from custom_components.presence_detection_designer.state_machine import RoomStateMachine


def test_open_mode_trigger_and_timeout():
    """Test open mode presence triggering and inactivity countdown."""
    sm = RoomStateMachine(
        name="Living Room",
        mode=Mode.OPEN,
        inactivity_timeout=10,
        llm_enabled=False,
    )
    assert sm.is_present is False
    assert sm.box_state == BoxState.IDLE_CLEAR

    # Motion detected
    sm.handle_trigger("binary_sensor.pir", is_active=True)
    assert sm.is_present is True
    assert sm.last_trigger_entity == "binary_sensor.pir"

    # Motion goes off -> timer starts
    sm.handle_trigger("binary_sensor.pir", is_active=False)
    assert sm.is_present is True
    assert sm.box_state == BoxState.TIMER_ACTIVE
    assert sm.vacating_countdown == 10

    # Tick 5 seconds
    action = sm.handle_tick(5)
    assert action is None
    assert sm.vacating_countdown == 5
    assert sm.is_present is True

    # Tick remaining 5 seconds
    action = sm.handle_tick(5)
    assert action == "VACATED"
    assert sm.is_present is False
    assert sm.box_state == BoxState.IDLE_CLEAR


def test_sustaining_condition_prevents_timeout():
    """Test sustaining condition keeps presence ON even when motion stops."""
    sm = RoomStateMachine(
        name="Living Room",
        mode=Mode.OPEN,
        inactivity_timeout=10,
        llm_enabled=False,
    )
    # Trigger motion
    sm.handle_trigger("binary_sensor.pir", is_active=True)
    sm.handle_trigger("binary_sensor.pir", is_active=False)

    # Sustaining condition (e.g. TV on) turns active
    sm.handle_conditions(any_active=True, active_descriptions=["media_player.tv == playing"])
    assert sm.is_present is True
    assert sm.box_state == BoxState.OCCUPIED

    # Ticking should not vacate
    action = sm.handle_tick(20)
    assert action is None
    assert sm.is_present is True

    # When TV turns off, timer resumes
    sm.handle_conditions(any_active=False, active_descriptions=[])
    assert sm.box_state == BoxState.TIMER_ACTIVE
    assert sm.vacating_countdown == 10


def test_bounded_mode_wasp_in_box():
    """Test bounded room sealed box logic."""
    sm = RoomStateMachine(
        name="Office",
        mode=Mode.BOUNDED,
        grace_timeout=30,
        llm_enabled=False,
    )
    # Enter room: door opens, motion triggers, door closes
    sm.handle_boundary("binary_sensor.door", is_open=True)
    sm.handle_trigger("binary_sensor.motion", is_active=True)
    assert sm.box_state == BoxState.OCCUPIED_UNSEALED

    # Door closes while motion is active
    sm.handle_boundary("binary_sensor.door", is_open=False)
    assert sm.box_state == BoxState.OCCUPIED_SEALED

    # Occupant sits still at desk: motion goes inactive, but door remains closed
    sm.handle_trigger("binary_sensor.motion", is_active=False)
    # Box remains sealed! Presence stays True indefinitely
    assert sm.is_present is True
    assert sm.box_state == BoxState.OCCUPIED_SEALED

    sm.handle_tick(100)
    assert sm.is_present is True
    assert sm.box_state == BoxState.OCCUPIED_SEALED

    # Occupant leaves: door opens, then closes with NO subsequent motion
    sm.handle_boundary("binary_sensor.door", is_open=True)
    assert sm.box_state == BoxState.OCCUPIED_UNSEALED
    sm.handle_boundary("binary_sensor.door", is_open=False)
    # Now timer should start countdown
    assert sm.box_state == BoxState.TIMER_ACTIVE
    assert sm.vacating_countdown == 30

    action = sm.handle_tick(30)
    assert action == "VACATED"
    assert sm.is_present is False
    assert sm.box_state == BoxState.IDLE_CLEAR


def test_llm_verification_extension():
    """Test LLM verification request when timer expires, and extension when person detected."""
    sm = RoomStateMachine(
        name="Den",
        mode=Mode.OPEN,
        inactivity_timeout=5,
        extend_timeout=60,
        llm_enabled=True,
    )
    sm.handle_trigger("binary_sensor.pir", is_active=True)
    sm.handle_trigger("binary_sensor.pir", is_active=False)

    action = sm.handle_tick(5)
    assert action == "REQUEST_LLM_VERIFY"
    assert sm.box_state == BoxState.LLM_VERIFYING
    assert sm.is_present is True  # still present while verifying

    # LLM confirms person is still on couch
    sm.handle_llm_result(person_detected=True, reasoning="Person reading book on sofa")
    assert sm.is_present is True
    assert sm.box_state == BoxState.TIMER_ACTIVE
    assert sm.vacating_countdown == 60
    assert sm.last_llm_result["reason"] == "Person reading book on sofa"


def test_manual_override():
    """Test manual override switch."""
    sm = RoomStateMachine(name="Guest Room", mode=Mode.OPEN)
    assert sm.is_present is False

    sm.set_override(True)
    assert sm.is_present is True
    assert sm.box_state == BoxState.OVERRIDE

    # Ticking has no effect
    sm.handle_tick(500)
    assert sm.is_present is True

    sm.set_override(False)
    assert sm.is_present is False
    assert sm.box_state == BoxState.IDLE_CLEAR


def _sealed_garage_machine(llm_enabled: bool = True) -> RoomStateMachine:
    """Return a bounded Garage machine sealed with one transient motion trigger."""
    sm = RoomStateMachine(
        name="Garage",
        mode=Mode.BOUNDED,
        grace_timeout=30,
        llm_enabled=llm_enabled,
    )
    sm.handle_trigger("binary_sensor.garage_ring_motion", is_active=True)
    sm.handle_boundary("binary_sensor.garage_side_door", is_open=False)
    sm.handle_trigger("binary_sensor.garage_ring_motion", is_active=False)
    return sm


def test_sealed_box_llm_vacant_unseals_and_clears():
    """Issue #18: Vision AI confirming vacant must unseal and clear an occupied_sealed room."""
    sm = _sealed_garage_machine()
    assert sm.box_state == BoxState.OCCUPIED_SEALED
    assert sm.is_present is True

    sm.handle_llm_result(False, "The garage contains a parked vehicle, no occupants visible.")

    assert sm.is_present is False
    assert sm.box_state == BoxState.IDLE_CLEAR
    assert sm.vision_confirmed_vacant is True


def test_sealed_box_llm_person_detected_stays_sealed():
    """A positive Vision AI verdict on a sealed bounded room keeps it sealed (no open-room timer)."""
    sm = _sealed_garage_machine()
    sm.handle_llm_result(True, "Person standing at the workbench")

    assert sm.is_present is True
    assert sm.box_state == BoxState.OCCUPIED_SEALED
    assert sm.vision_confirmed_vacant is False


def test_sealed_reverification_due_after_quiet_timeout():
    """Issue #18: a sealed room with no sustaining evidence becomes due for a Vision AI re-check."""
    sm = _sealed_garage_machine()
    assert sm.box_state == BoxState.OCCUPIED_SEALED

    # First call arms the quiet clock; not due until the timeout elapses.
    assert sm.sealed_reverification_due(1000.0, 300.0) is False
    assert sm.sealed_reverification_due(1200.0, 300.0) is False
    assert sm.sealed_reverification_due(1300.1, 300.0) is True


def test_sealed_reverification_resets_on_human_evidence():
    """Fresh PIR evidence resets the sealed re-verification quiet clock."""
    sm = _sealed_garage_machine()
    assert sm.sealed_reverification_due(1000.0, 300.0) is False
    assert sm.sealed_reverification_due(1300.1, 300.0) is True

    sm.handle_trigger("binary_sensor.garage_ring_motion", is_active=True)
    sm.handle_trigger("binary_sensor.garage_ring_motion", is_active=False)

    assert sm.sealed_reverification_due(1400.0, 300.0) is False


def test_sealed_reverification_disabled_without_llm():
    """Without Vision AI configured the sealed box is never re-verified (preserves stillness hold)."""
    sm = _sealed_garage_machine(llm_enabled=False)
    assert sm.sealed_reverification_due(1_000_000.0, 300.0) is False
