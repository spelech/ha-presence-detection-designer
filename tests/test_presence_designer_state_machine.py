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
    assert sm.box_state == BoxState.OCCUPIED_SEALED

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
