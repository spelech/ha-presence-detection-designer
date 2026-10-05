"""Test Presence Detection Designer Coordinator and Entities."""

from unittest.mock import MagicMock

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
