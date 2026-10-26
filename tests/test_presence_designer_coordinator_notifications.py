"""Tests for coordinator Slack notification dispatching on state machine transitions."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest

from custom_components.presence_detection_designer.const import (
    CONF_INACTIVITY_TIMEOUT,
    CONF_NOTIFY_ON_CLEARED,
    CONF_NOTIFY_ON_OCCUPIED,
    CONF_NOTIFY_SLACK,
    CONF_ROOM_NAME,
    CONF_TRIGGER_ENTITIES,
    DATA_STORE,
    DOMAIN,
)
from custom_components.presence_detection_designer.coordinator import RoomPresenceCoordinator


@pytest.fixture
def mock_hass() -> MagicMock:
    hass = MagicMock()
    hass.states.get = MagicMock(return_value=None)
    hass.services.async_call = AsyncMock()
    hass.bus.async_fire = MagicMock()
    hass.async_create_task = MagicMock(side_effect=lambda coro: coro)

    # Store mock with global settings
    store = MagicMock()
    store.global_settings = {
        "notifications_enabled": True,
        "slack_notify_service": "notify.scdbots",
        "slack_channel": "#presence-alerts",
    }
    hass.data = {DOMAIN: {DATA_STORE: store}}
    return hass


@pytest.mark.asyncio
async def test_coordinator_dispatches_notification_on_occupied(mock_hass: MagicMock) -> None:
    config = {
        CONF_ROOM_NAME: "Living Room",
        CONF_TRIGGER_ENTITIES: ["binary_sensor.living_room_motion"],
        CONF_NOTIFY_SLACK: True,
        CONF_NOTIFY_ON_OCCUPIED: True,
        CONF_NOTIFY_ON_CLEARED: True,
        CONF_INACTIVITY_TIMEOUT: 180,
    }
    coord = RoomPresenceCoordinator(mock_hass, "living_room", config)

    # Mock dispatcher async_dispatch_notification
    coord._notification_dispatcher.async_dispatch_notification = AsyncMock(return_value=True)

    # Trigger state change to occupied
    mock_hass.states.get.side_effect = lambda eid: (
        MagicMock(state="on") if eid == "binary_sensor.living_room_motion" else None
    )
    coord.state_machine.handle_trigger("binary_sensor.living_room_motion", True)
    coord.async_update_listeners()

    # Verify task created
    assert coord.state_machine.is_present is True
    coord._notification_dispatcher.async_dispatch_notification.assert_called_once()
    attribution = coord._notification_dispatcher.async_dispatch_notification.call_args[0][1]
    assert attribution.room_name == "Living Room"
    assert attribution.to_state == "occupied"


@pytest.mark.asyncio
async def test_coordinator_skips_notification_when_disabled(mock_hass: MagicMock) -> None:
    config = {
        CONF_ROOM_NAME: "Guest Room",
        CONF_TRIGGER_ENTITIES: ["binary_sensor.guest_motion"],
        CONF_NOTIFY_SLACK: False,  # Disabled for this room
    }
    coord = RoomPresenceCoordinator(mock_hass, "guest_room", config)
    coord._notification_dispatcher.async_dispatch_notification = AsyncMock()

    coord.state_machine.handle_trigger("binary_sensor.guest_motion", True)
    coord.async_update_listeners()

    # Dispatcher should not be called because notify_slack is False
    coord._notification_dispatcher.async_dispatch_notification.assert_not_called()
