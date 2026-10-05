"""End-to-end scenario simulations for Presence Detection Designer."""

from unittest.mock import AsyncMock, MagicMock

import pytest

from custom_components.presence_detection_designer.binary_sensor import PresenceBinarySensor
from custom_components.presence_detection_designer.const import (
    CONF_BOUNDARY_ENTITIES,
    CONF_EXTEND_TIMEOUT,
    CONF_GRACE_TIMEOUT,
    CONF_INACTIVITY_TIMEOUT,
    CONF_LLM_ENABLED,
    CONF_MODE,
    CONF_ROOM_NAME,
    CONF_SUSTAINING_CONDITIONS,
    CONF_TRIGGER_ENTITIES,
    BoxState,
    Mode,
)
from custom_components.presence_detection_designer.coordinator import RoomPresenceCoordinator


@pytest.fixture
def mock_hass():
    """Mock Home Assistant instance."""
    hass = MagicMock()
    hass.bus = MagicMock()
    hass.states = MagicMock()
    return hass


@pytest.mark.asyncio
async def test_scenario_a_stationary_tv_watcher(mock_hass):
    """Scenario A: Person enters living room, turns on TV, sits still for hours.

    Motion stops immediately, but presence must remain ON as long as the TV is on.
    When TV turns off, inactivity timer counts down and clears presence.
    """
    config = {
        CONF_ROOM_NAME: "Living Room",
        CONF_MODE: Mode.OPEN,
        CONF_TRIGGER_ENTITIES: ["binary_sensor.lr_pir"],
        CONF_SUSTAINING_CONDITIONS: [
            {"entity_id": "media_player.living_room_tv", "operator": "equals", "state": "playing"}
        ],
        CONF_INACTIVITY_TIMEOUT: 300,
        CONF_LLM_ENABLED: False,
    }

    # Set up HA states
    tv_state = MagicMock(state="off", attributes={})
    pir_state = MagicMock(state="off", attributes={})

    def state_getter(eid):
        if eid == "media_player.living_room_tv":
            return tv_state
        if eid == "binary_sensor.lr_pir":
            return pir_state
        return None

    mock_hass.states.get = state_getter

    coordinator = RoomPresenceCoordinator(mock_hass, "lr_entry", config)
    sensor = PresenceBinarySensor(coordinator, "lr_entry")

    assert sensor.is_on is False

    # 1. Motion detected as person enters
    pir_state.state = "on"
    coordinator.state_machine.handle_trigger("binary_sensor.lr_pir", is_active=True)
    coordinator.async_update_listeners()
    assert sensor.is_on is True

    # 2. TV turns on and starts playing
    tv_state.state = "playing"
    coordinator._eval_conditions_and_update()
    coordinator.async_update_listeners()
    assert sensor.is_on is True
    assert "media_player.living_room_tv equals playing" in sensor.extra_state_attributes["active_conditions"]

    # 3. Person sits still on couch: PIR motion stops
    pir_state.state = "off"
    coordinator.state_machine.handle_trigger("binary_sensor.lr_pir", is_active=False)
    coordinator.async_update_listeners()

    # Even after 7200 seconds (2 hours), TV playing holds presence!
    for _ in range(72):
        await coordinator._async_handle_tick(None)

    assert sensor.is_on is True
    assert sensor.extra_state_attributes["box_state"] == BoxState.OCCUPIED_SEALED

    # 4. Movie ends, TV turns off
    tv_state.state = "off"
    coordinator._eval_conditions_and_update()
    coordinator.async_update_listeners()
    assert sensor.extra_state_attributes["box_state"] == BoxState.TIMER_ACTIVE
    assert sensor.extra_state_attributes["vacating_countdown"] == 300

    # 5. Timer counts down remaining 300 seconds
    for _ in range(300):
        await coordinator._async_handle_tick(None)

    assert sensor.is_on is False
    assert sensor.extra_state_attributes["box_state"] == BoxState.IDLE_CLEAR


@pytest.mark.asyncio
async def test_scenario_b_bounded_room_closed_door_stillness(mock_hass):
    """Scenario B: Office with door. Person enters, closes door, and works silently.

    Door closed keeps the wasp sealed in the box. No timeout occurs.
    """
    config = {
        CONF_ROOM_NAME: "Office",
        CONF_MODE: Mode.BOUNDED,
        CONF_BOUNDARY_ENTITIES: ["binary_sensor.office_door"],
        CONF_TRIGGER_ENTITIES: ["binary_sensor.office_pir"],
        CONF_SUSTAINING_CONDITIONS: [],
        CONF_GRACE_TIMEOUT: 60,
        CONF_LLM_ENABLED: False,
    }

    coordinator = RoomPresenceCoordinator(mock_hass, "office_entry", config)
    sensor = PresenceBinarySensor(coordinator, "office_entry")

    # Door opens, person walks in
    coordinator.state_machine.handle_boundary("binary_sensor.office_door", is_open=True)
    coordinator.state_machine.handle_trigger("binary_sensor.office_pir", is_active=True)
    assert sensor.is_on is True
    assert sensor.extra_state_attributes["box_state"] == BoxState.OCCUPIED_UNSEALED

    # Door closes behind them
    coordinator.state_machine.handle_boundary("binary_sensor.office_door", is_open=False)
    assert sensor.extra_state_attributes["box_state"] == BoxState.OCCUPIED_SEALED

    # Motion stops (stationary typing/reading)
    coordinator.state_machine.handle_trigger("binary_sensor.office_pir", is_active=False)
    assert sensor.is_on is True
    assert sensor.extra_state_attributes["box_state"] == BoxState.OCCUPIED_SEALED

    # 30 minutes pass with zero motion
    for _ in range(1800):
        await coordinator._async_handle_tick(None)

    # Box remains sealed!
    assert sensor.is_on is True
    assert sensor.extra_state_attributes["box_state"] == BoxState.OCCUPIED_SEALED


@pytest.mark.asyncio
async def test_scenario_c_bounded_room_vacate(mock_hass):
    """Scenario C: Person leaves office. Door opens and closes, no motion follows.

    Grace timer counts down, triggers LLM check (sees empty room), presence flips to OFF.
    """
    config = {
        CONF_ROOM_NAME: "Office",
        CONF_MODE: Mode.BOUNDED,
        CONF_BOUNDARY_ENTITIES: ["binary_sensor.office_door"],
        CONF_TRIGGER_ENTITIES: ["binary_sensor.office_pir"],
        CONF_SUSTAINING_CONDITIONS: [],
        CONF_GRACE_TIMEOUT: 10,
        CONF_LLM_ENABLED: True,
    }

    coordinator = RoomPresenceCoordinator(mock_hass, "office_entry", config)
    sensor = PresenceBinarySensor(coordinator, "office_entry")

    # Set up occupied sealed state first
    coordinator.state_machine.handle_trigger("binary_sensor.office_pir", is_active=True)
    coordinator.state_machine.handle_boundary("binary_sensor.office_door", is_open=False)
    coordinator.state_machine.handle_trigger("binary_sensor.office_pir", is_active=False)
    assert sensor.is_on is True

    # Person leaves: door opens, then closes
    coordinator.state_machine.handle_boundary("binary_sensor.office_door", is_open=True)
    coordinator.state_machine.handle_boundary("binary_sensor.office_door", is_open=False)
    assert sensor.extra_state_attributes["box_state"] == BoxState.TIMER_ACTIVE
    assert sensor.extra_state_attributes["vacating_countdown"] == 10

    # Mock LLM verifier returning empty room
    coordinator.verifier.async_acquire_snapshot = AsyncMock(return_value=b"snapshot_bytes")
    coordinator.verifier.async_verify = AsyncMock(return_value=(False, "No person in office"))

    # Tick 10 seconds
    for _ in range(10):
        await coordinator._async_handle_tick(None)

    # LLM confirmed no one inside -> presence cleared!
    assert sensor.is_on is False
    assert sensor.extra_state_attributes["box_state"] == BoxState.IDLE_CLEAR
    assert sensor.extra_state_attributes["last_llm_check"]["person_detected"] is False


@pytest.mark.asyncio
async def test_scenario_d_open_room_couch_relaxer_llm_extension(mock_hass):
    """Scenario D: Living room (no doors), reading book without TV.

    Motion stops, inactivity timer runs out -> LLM snapshot check fires -> LLM sees person ->
    presence extended for another window without turning off lights!
    """
    config = {
        CONF_ROOM_NAME: "Living Room",
        CONF_MODE: Mode.OPEN,
        CONF_TRIGGER_ENTITIES: ["binary_sensor.lr_pir"],
        CONF_SUSTAINING_CONDITIONS: [],
        CONF_INACTIVITY_TIMEOUT: 5,
        CONF_EXTEND_TIMEOUT: 300,
        CONF_LLM_ENABLED: True,
    }

    coordinator = RoomPresenceCoordinator(mock_hass, "lr_entry", config)
    sensor = PresenceBinarySensor(coordinator, "lr_entry")

    # Enter room
    coordinator.state_machine.handle_trigger("binary_sensor.lr_pir", is_active=True)
    coordinator.state_machine.handle_trigger("binary_sensor.lr_pir", is_active=False)
    assert sensor.is_on is True
    assert sensor.extra_state_attributes["vacating_countdown"] == 5

    # Mock LLM detecting occupant reading book
    coordinator.verifier.async_acquire_snapshot = AsyncMock(return_value=b"snapshot_bytes")
    coordinator.verifier.async_verify = AsyncMock(return_value=(True, "Person seated reading book"))

    # Tick 5 seconds to expire initial timer
    for _ in range(5):
        await coordinator._async_handle_tick(None)

    # Occupancy was saved and extended!
    assert sensor.is_on is True
    assert sensor.extra_state_attributes["box_state"] == BoxState.TIMER_ACTIVE
    assert sensor.extra_state_attributes["vacating_countdown"] == 300
    assert sensor.extra_state_attributes["last_llm_check"]["person_detected"] is True
    assert sensor.extra_state_attributes["last_llm_check"]["reason"] == "Person seated reading book"
