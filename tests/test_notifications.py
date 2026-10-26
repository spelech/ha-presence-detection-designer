"""Tests for Slack Presence Notifications & Diagnostic Attribution."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest

from custom_components.presence_detection_designer.notifications import (
    NotificationDispatcher,
    TransitionAttribution,
)


@pytest.fixture
def sample_attribution_occupied() -> TransitionAttribution:
    return TransitionAttribution(
        room_id="living_room",
        room_name="Living Room",
        from_state="clear",
        to_state="occupied",
        primary_driver="binary_sensor.living_room_person_occupancy (Frigate Camera)",
        driver_type="sensor",
        confidence_pct=88.0,
        threshold_pct=70.0,
        active_sensors=["binary_sensor.living_room_motion"],
        sustaining_conditions=["media_player.living_room_tv (playing)"],
        arrival_context="Entered from Kitchen (active 8s ago)",
        duration_occupied_str=None,
        timestamp=datetime(2026, 10, 25, 18, 0, 0, tzinfo=UTC),
    )


@pytest.fixture
def sample_attribution_cleared() -> TransitionAttribution:
    return TransitionAttribution(
        room_id="living_room",
        room_name="Living Room",
        from_state="occupied",
        to_state="clear",
        primary_driver="Inactivity timeout (180s) expired with zero active sensors",
        driver_type="inactivity_timeout",
        confidence_pct=12.0,
        threshold_pct=70.0,
        active_sensors=[],
        sustaining_conditions=[],
        arrival_context=None,
        duration_occupied_str="34m 18s",
        timestamp=datetime(2026, 10, 25, 18, 34, 18, tzinfo=UTC),
    )


def test_resolve_driver_occupied_sensor() -> None:
    dispatcher = NotificationDispatcher()
    room_config: dict[str, Any] = {
        "room_name": "Office",
        "prob_threshold": 0.70,
        "inactivity_timeout": 240,
    }
    prev_eval: dict[str, Any] = {
        "probability": 0.15,
        "is_occupied": False,
        "active_entities": [],
    }
    curr_eval: dict[str, Any] = {
        "probability": 0.92,
        "is_occupied": True,
        "active_entities": ["binary_sensor.office_person_occupancy", "binary_sensor.office_motion"],
        "active_sustaining_conditions": [],
        "driver_entity": "binary_sensor.office_person_occupancy",
    }

    attribution = dispatcher.resolve_transition_driver(
        room_id="office",
        room_name="Office",
        from_state="clear",
        to_state="occupied",
        room_config=room_config,
        prev_eval=prev_eval,
        curr_eval=curr_eval,
        adjacent_context="Entered from Upstairs Hallway & Stairs",
    )

    assert attribution.room_id == "office"
    assert attribution.to_state == "occupied"
    assert "binary_sensor.office_person_occupancy" in attribution.primary_driver
    assert attribution.confidence_pct == 92.0
    assert attribution.threshold_pct == 70.0
    assert "binary_sensor.office_motion" in attribution.active_sensors
    assert attribution.arrival_context == "Entered from Upstairs Hallway & Stairs"


def test_resolve_driver_cleared_timeout() -> None:
    dispatcher = NotificationDispatcher()
    room_config: dict[str, Any] = {
        "room_name": "Office",
        "prob_threshold": 0.70,
        "inactivity_timeout": 180,
    }
    prev_eval: dict[str, Any] = {
        "probability": 0.85,
        "is_occupied": True,
        "active_entities": ["binary_sensor.office_motion"],
    }
    curr_eval: dict[str, Any] = {
        "probability": 0.10,
        "is_occupied": False,
        "active_entities": [],
        "active_sustaining_conditions": [],
    }

    attribution = dispatcher.resolve_transition_driver(
        room_id="office",
        room_name="Office",
        from_state="occupied",
        to_state="clear",
        room_config=room_config,
        prev_eval=prev_eval,
        curr_eval=curr_eval,
        duration_seconds=1250,
    )

    assert attribution.to_state == "clear"
    assert "Inactivity timeout" in attribution.primary_driver
    assert attribution.duration_occupied_str == "20m 50s"
    assert attribution.confidence_pct == 10.0


def test_format_slack_message_occupied(sample_attribution_occupied: TransitionAttribution) -> None:
    dispatcher = NotificationDispatcher()
    msg = dispatcher.format_slack_message(sample_attribution_occupied)

    assert "text" in msg
    assert "🟢 *Living Room → Occupied*" in msg["text"]
    assert "Frigate Camera" in msg["text"]
    assert "88%" in msg["text"]
    assert "Kitchen" in msg["text"]


def test_format_slack_message_cleared(sample_attribution_cleared: TransitionAttribution) -> None:
    dispatcher = NotificationDispatcher()
    msg = dispatcher.format_slack_message(sample_attribution_cleared)

    assert "text" in msg
    assert "⚪ *Living Room → Cleared*" in msg["text"]
    assert "34m 18s" in msg["text"]
    assert "Inactivity timeout" in msg["text"]


@pytest.mark.asyncio
async def test_async_dispatch_notification(
    sample_attribution_occupied: TransitionAttribution,
) -> None:
    dispatcher = NotificationDispatcher()
    hass = MagicMock()
    hass.services.async_call = AsyncMock()
    hass.bus.async_fire = MagicMock()

    global_settings = {
        "notifications_enabled": True,
        "slack_notify_service": "notify.scdbots",
        "slack_channel": "#presence-alerts",
    }
    room_config = {
        "notify_slack": True,
        "notify_on_occupied": True,
        "notify_on_cleared": True,
    }

    success = await dispatcher.async_dispatch_notification(
        hass=hass,
        attribution=sample_attribution_occupied,
        global_settings=global_settings,
        room_config=room_config,
    )

    assert success is True
    hass.services.async_call.assert_called_once()
    call_args = hass.services.async_call.call_args
    assert call_args[0][0] == "notify"
    assert call_args[0][1] == "scdbots"
    assert call_args[0][2]["target"] == ["#presence-alerts"]
    assert "Living Room → Occupied" in call_args[0][2]["message"]

    hass.bus.async_fire.assert_called_once()
    event_args = hass.bus.async_fire.call_args
    assert event_args[0][0] == "presence_detection_designer_transition"
    assert event_args[0][1]["room_id"] == "living_room"
    assert event_args[0][1]["to_state"] == "occupied"


@pytest.mark.asyncio
async def test_debounce_suppression(sample_attribution_occupied: TransitionAttribution) -> None:
    dispatcher = NotificationDispatcher()
    hass = MagicMock()
    hass.services.async_call = AsyncMock()
    hass.bus.async_fire = MagicMock()

    global_settings = {
        "notifications_enabled": True,
        "slack_notify_service": "notify.scdbots",
        "slack_channel": "#presence-alerts",
    }
    room_config = {"notify_slack": True, "notify_on_occupied": True}

    # First dispatch succeeds
    res1 = await dispatcher.async_dispatch_notification(
        hass, sample_attribution_occupied, global_settings, room_config
    )
    assert res1 is True

    # Immediate second dispatch is debounced
    res2 = await dispatcher.async_dispatch_notification(
        hass, sample_attribution_occupied, global_settings, room_config
    )
    assert res2 is False
    assert hass.services.async_call.call_count == 1
