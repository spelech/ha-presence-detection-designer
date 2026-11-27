"""Tests for Home Assistant Presence Notifications & Diagnostic Attribution."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest

from custom_components.presence_detection_designer.notifications import (
    EVENT_PRESENCE_TRANSITION,
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
        prev_eval=None,
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
        prev_eval=None,
        curr_eval=curr_eval,
        duration_seconds=2058,
    )

    assert attribution.to_state == "clear"
    assert attribution.driver_type == "inactivity_timeout"
    assert attribution.duration_occupied_str == "34m 18s"


def test_format_notification_message_variants(
    sample_attribution_occupied: TransitionAttribution,
    sample_attribution_cleared: TransitionAttribution,
) -> None:
    dispatcher = NotificationDispatcher()

    occ_compact = dispatcher.format_notification_message(sample_attribution_occupied, "compact")
    assert "Living Room → Occupied" in occ_compact["text"]
    assert "88%" in occ_compact["text"]

    occ_minimal = dispatcher.format_notification_message(sample_attribution_occupied, "minimal")
    assert "Living Room occupied" in occ_minimal["text"]

    occ_full = dispatcher.format_notification_message(sample_attribution_occupied, "full")
    assert "Primary Driver:" in occ_full["text"]
    assert "Active Sensors:" in occ_full["text"]

    clr_compact = dispatcher.format_notification_message(sample_attribution_cleared, "compact")
    assert "Living Room → Cleared" in clr_compact["text"]
    assert "34m 18s" in clr_compact["text"]


@pytest.mark.asyncio
async def test_dispatch_notification_calls_ha_service_and_fires_event(
    sample_attribution_occupied: TransitionAttribution,
) -> None:
    dispatcher = NotificationDispatcher()
    hass = MagicMock()
    hass.services.has_service = MagicMock(return_value=True)
    hass.services.async_call = AsyncMock()
    hass.bus.async_fire = MagicMock()

    global_settings = {
        "notifications_enabled": True,
        "notify_service": "notify.mobile_app_phone",
        "notify_target": "phone",
        "notify_verbosity": "compact",
    }
    room_config = {"notify_enabled": True, "notify_on_occupied": True}

    ok = await dispatcher.async_dispatch_notification(
        hass, sample_attribution_occupied, global_settings, room_config
    )
    assert ok is True
    hass.bus.async_fire.assert_called_once()
    assert hass.bus.async_fire.call_args[0][0] == EVENT_PRESENCE_TRANSITION
    hass.services.async_call.assert_called_once()
    domain, service, payload = hass.services.async_call.call_args[0][:3]
    assert domain == "notify"
    assert service == "mobile_app_phone"
    assert payload["target"] == ["phone"]
    assert "Living Room" in payload["message"]


@pytest.mark.asyncio
async def test_dispatch_notification_debounces_and_respects_disabled(
    sample_attribution_occupied: TransitionAttribution,
) -> None:
    dispatcher = NotificationDispatcher()
    hass = MagicMock()
    hass.services.has_service = MagicMock(return_value=True)
    hass.services.async_call = AsyncMock()
    hass.bus.async_fire = MagicMock()

    # Globally disabled
    ok = await dispatcher.async_dispatch_notification(
        hass,
        sample_attribution_occupied,
        {"notifications_enabled": False, "notify_service": "notify.mobile_app_phone"},
        {"notify_enabled": True},
    )
    assert ok is False

    # First enabled dispatch succeeds; immediate repeat is debounced
    gs = {"notifications_enabled": True, "notify_service": "notify.mobile_app_phone"}
    rc = {"notify_enabled": True}
    assert await dispatcher.async_dispatch_notification(hass, sample_attribution_occupied, gs, rc)
    assert not await dispatcher.async_dispatch_notification(
        hass, sample_attribution_occupied, gs, rc
    )
