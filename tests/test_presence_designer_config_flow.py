"""Test Presence Detection Designer Config Flow."""

from unittest.mock import MagicMock

import pytest

from custom_components.presence_detection_designer.config_flow import (
    PresenceDetectionDesignerConfigFlow,
    PresenceDetectionDesignerOptionsFlow,
)
from custom_components.presence_detection_designer.const import (
    CONF_BOUNDARY_ENTITIES,
    CONF_INACTIVITY_TIMEOUT,
    CONF_MODE,
    CONF_ROOM_NAME,
    CONF_TRIGGER_ENTITIES,
    Mode,
)


@pytest.mark.asyncio
async def test_config_flow_user_step():
    """Test initial user step creates entry."""
    flow = PresenceDetectionDesignerConfigFlow()
    flow.hass = MagicMock()

    user_input = {
        CONF_ROOM_NAME: "Master Bedroom",
        CONF_BOUNDARY_ENTITIES: ["binary_sensor.bedroom_door"],
        CONF_TRIGGER_ENTITIES: ["binary_sensor.bedroom_motion"],
        CONF_MODE: Mode.BOUNDED,
        CONF_INACTIVITY_TIMEOUT: 180,
    }

    result = await flow.async_step_user(user_input)
    assert result["type"] == "create_entry"
    assert result["title"] == "Master Bedroom"
    assert result["data"][CONF_ROOM_NAME] == "Master Bedroom"
    assert result["data"][CONF_TRIGGER_ENTITIES] == ["binary_sensor.bedroom_motion"]


@pytest.mark.asyncio
async def test_config_flow_user_step_shows_form():
    """Test user step without input renders schema form."""
    flow = PresenceDetectionDesignerConfigFlow()
    flow.hass = MagicMock()

    result = await flow.async_step_user(None)
    assert result["type"] == "form"
    assert result["step_id"] == "user"


@pytest.mark.asyncio
async def test_options_flow_init():
    """Test options flow saves updated options."""
    entry = MagicMock(
        data={CONF_ROOM_NAME: "Office", CONF_MODE: Mode.OPEN},
        options={},
    )
    flow = PresenceDetectionDesignerOptionsFlow(entry)
    flow.hass = MagicMock()

    options_input = {
        CONF_INACTIVITY_TIMEOUT: 600,
    }
    result = await flow.async_step_init(options_input)
    assert result["type"] == "create_entry"
    assert result["data"][CONF_INACTIVITY_TIMEOUT] == 600
