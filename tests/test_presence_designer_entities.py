"""Test Presence Detection Designer Coordinator and Entities."""

from unittest.mock import AsyncMock, MagicMock

import pytest

from custom_components.presence_detection_designer.binary_sensor import (
    PresenceBinarySensor,
)
from custom_components.presence_detection_designer.button import (
    VerifyPresenceButton,
)
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
    DOMAIN,
    BoxState,
    Mode,
)
from custom_components.presence_detection_designer.coordinator import (
    RoomPresenceCoordinator,
)
from custom_components.presence_detection_designer.switch import (
    PresenceOverrideSwitch,
)


@pytest.fixture
def mock_hass():
    """Mock Home Assistant instance."""
    hass = MagicMock()
    hass.bus = MagicMock()
    hass.states = MagicMock()
    hass.data = {DOMAIN: {}}
    return hass


@pytest.fixture
def sample_config():
    """Sample room config."""
    return {
        CONF_ROOM_NAME: "Living Room",
        CONF_MODE: Mode.OPEN,
        CONF_BOUNDARY_ENTITIES: [],
        CONF_TRIGGER_ENTITIES: ["binary_sensor.lr_motion"],
        CONF_SUSTAINING_CONDITIONS: [
            {"entity_id": "media_player.lr_tv", "operator": "equals", "state": "playing"}
        ],
        CONF_INACTIVITY_TIMEOUT: 60,
        CONF_GRACE_TIMEOUT: 30,
        CONF_EXTEND_TIMEOUT: 120,
        CONF_LLM_ENABLED: False,
    }


def test_coordinator_init(mock_hass, sample_config):
    """Test coordinator initialization and default state."""
    coord = RoomPresenceCoordinator(mock_hass, "entry_123", sample_config)
    assert coord.room_name == "Living Room"
    assert coord.state_machine.is_present is False
    assert coord.state_machine.box_state == BoxState.IDLE_CLEAR


def test_entities_mapping(mock_hass, sample_config):
    """Test binary_sensor, button, and switch bindings."""
    coord = RoomPresenceCoordinator(mock_hass, "entry_123", sample_config)

    sensor = PresenceBinarySensor(coord, "entry_123")
    assert sensor.is_on is False
    assert sensor.name == "Living Room Presence"
    assert sensor.unique_id == "entry_123_presence"
    attrs = sensor.extra_state_attributes
    assert attrs["mode"] == Mode.OPEN
    assert attrs["box_state"] == BoxState.IDLE_CLEAR
    assert attrs["vacating_countdown"] == 0

    btn = VerifyPresenceButton(coord, "entry_123")
    assert btn.name == "Living Room Verify Presence"
    assert btn.unique_id == "entry_123_verify"

    switch = PresenceOverrideSwitch(coord, "entry_123")
    assert switch.name == "Living Room Presence Override"
    assert switch.unique_id == "entry_123_override"
    assert switch.is_on is False


@pytest.mark.asyncio
async def test_switch_override_toggle(mock_hass, sample_config):
    """Test toggling the override switch."""
    coord = RoomPresenceCoordinator(mock_hass, "entry_123", sample_config)
    sensor = PresenceBinarySensor(coord, "entry_123")
    switch = PresenceOverrideSwitch(coord, "entry_123")

    await switch.async_turn_on()
    assert switch.is_on is True
    assert sensor.is_on is True
    assert sensor.extra_state_attributes["box_state"] == BoxState.OVERRIDE

    await switch.async_turn_off()
    assert switch.is_on is False
    assert sensor.is_on is False


@pytest.mark.asyncio
async def test_component_lifecycle_and_services(mock_hass, sample_config):
    """Test async_setup, services, async_setup_entry, and unload."""
    from custom_components.presence_detection_designer import (
        async_setup,
        async_setup_entry,
        async_unload_entry,
        async_update_options,
    )
    from custom_components.presence_detection_designer.binary_sensor import (
        async_setup_entry as async_setup_binary_sensor,
    )
    from custom_components.presence_detection_designer.button import (
        async_setup_entry as async_setup_button,
    )
    from custom_components.presence_detection_designer.switch import (
        async_setup_entry as async_setup_switch,
    )

    registered_services = {}

    def mock_register(domain, service, handler):
        registered_services[f"{domain}.{service}"] = handler

    mock_hass.services = MagicMock()
    mock_hass.services.has_service = MagicMock(return_value=False)
    mock_hass.services.async_register = mock_register

    # 1. Component setup
    assert await async_setup(mock_hass, {}) is True
    assert "presence_detection_designer.verify_presence" in registered_services
    assert "presence_detection_designer.force_refresh" in registered_services

    # 2. Config entry setup
    mock_entry = MagicMock()
    mock_entry.entry_id = "test_entry"
    mock_entry.data = sample_config
    mock_entry.options = {}
    mock_hass.config_entries = MagicMock()
    mock_hass.config_entries.async_forward_entry_setups = AsyncMock(return_value=None)
    mock_hass.config_entries.async_unload_platforms = AsyncMock(return_value=True)
    mock_hass.config_entries.async_reload = AsyncMock()

    assert await async_setup_entry(mock_hass, mock_entry) is True
    coord = mock_hass.data[DOMAIN]["test_entry"]

    # Test platform setup functions
    added_entities = []
    await async_setup_binary_sensor(mock_hass, mock_entry, lambda ents: added_entities.extend(ents))
    await async_setup_button(mock_hass, mock_entry, lambda ents: added_entities.extend(ents))
    await async_setup_switch(mock_hass, mock_entry, lambda ents: added_entities.extend(ents))
    assert len(added_entities) == 3

    # Button press
    btn = [e for e in added_entities if isinstance(e, VerifyPresenceButton)][0]
    coord.async_manual_verify = AsyncMock()
    await btn.async_press()
    coord.async_manual_verify.assert_called_once()

    # Trigger services
    call_mock = MagicMock()
    call_mock.data = {"entry_id": "test_entry"}
    coord.async_manual_verify.reset_mock()
    await registered_services["presence_detection_designer.verify_presence"](call_mock)
    coord.async_manual_verify.assert_called_once()

    await registered_services["presence_detection_designer.force_refresh"](call_mock)

    # Coordinator event handlers
    trigger_event = MagicMock()
    trigger_event.data = {
        "entity_id": "binary_sensor.lr_motion",
        "new_state": MagicMock(state="on"),
    }
    coord._handle_trigger_change(trigger_event)
    assert coord.state_machine.is_present is True

    boundary_event = MagicMock()
    boundary_event.data = {"entity_id": "binary_sensor.door", "new_state": MagicMock(state="on")}
    coord._handle_boundary_change(boundary_event)

    condition_event = MagicMock()
    coord._handle_condition_change(condition_event)

    # Options update
    await async_update_options(mock_hass, mock_entry)
    mock_hass.config_entries.async_reload.assert_called_with("test_entry")

    # Unload entry
    assert await async_unload_entry(mock_hass, mock_entry) is True
    assert "test_entry" not in mock_hass.data[DOMAIN]
