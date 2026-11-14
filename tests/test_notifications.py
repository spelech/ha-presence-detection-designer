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


@pytest.mark.asyncio
async def test_auto_create_missing_slack_channel_and_negative_space_formatting(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    dispatcher = NotificationDispatcher()
    hass = MagicMock()
    hass.services.async_call = AsyncMock()
    hass.bus.async_fire = MagicMock()

    async def _run_sync(func, *args):
        return func(*args)

    hass.async_add_executor_job = AsyncMock(side_effect=_run_sync)

    slack_entry = MagicMock()
    slack_entry.data = {"api_key": "xoxb-test-slack-token", "default_channel": "notifications"}
    hass.config_entries.async_entries = MagicMock(return_value=[slack_entry])

    created_channels: list[str] = []

    def _fake_slack_api(
        url: str, token: str, payload: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        if "conversations.list" in url:
            return {
                "ok": True,
                "channels": [{"name": "notifications", "id": "C111", "is_member": True}],
            }
        if "conversations.create" in url and payload:
            created_channels.append(payload["name"])
            return {
                "ok": True,
                "channel": {"id": "C222", "name": payload["name"], "is_member": True},
            }
        return {"ok": True}

    monkeypatch.setattr(dispatcher, "_call_slack_web_api", _fake_slack_api)

    curr_eval: dict[str, Any] = {
        "probability": 0.89,
        "is_occupied": True,
        "active_entities": ["binary_sensor.master_bathroom_person_occupancy"],
        "active_sustaining_conditions": [],
        "driver_entity": "binary_sensor.master_bathroom_person_occupancy",
        "inferred_location": "Master Bathroom (Interior Shower/Vanity Blind Pocket)",
        "negative_space_evidence": [
            "camera.master_bedroom cone confirmed clear (88% of Master Bedroom excluded)"
        ],
    }
    attr = dispatcher.resolve_transition_driver(
        room_id="master_bath",
        room_name="Master Bathroom",
        from_state="clear",
        to_state="occupied",
        room_config={"room_name": "Master Bathroom", "prob_threshold": 0.75},
        prev_eval=None,
        curr_eval=curr_eval,
    )
    assert attr.inferred_location == "Master Bathroom (Interior Shower/Vanity Blind Pocket)"
    assert attr.negative_space_evidence is not None
    formatted = dispatcher.format_slack_message(attr)
    assert "Master Bathroom (Interior Shower/Vanity Blind Pocket)" in formatted["text"]
    assert "camera.master_bedroom cone confirmed clear" in formatted["text"]

    # Room config with notify_slack=None defaults to enabled, and missing #new-presence-chan is auto-created
    ok = await dispatcher.async_dispatch_notification(
        hass=hass,
        attribution=attr,
        global_settings={
            "notifications_enabled": True,
            "slack_notify_service": "notify.scdbots",
            "slack_channel": "#new-presence-chan",
        },
        room_config={"notify_slack": None},
    )
    assert ok is True
    assert created_channels == ["new-presence-chan"]


def test_collect_room_states_identifies_occupied_and_clear():
    """Verify collect_room_states correctly reads is_present and driver attribution."""
    import time

    from custom_components.presence_detection_designer.const import DOMAIN
    from custom_components.presence_detection_designer.notifications import format_duration
    from custom_components.presence_detection_designer.slack_cards import SlackDailyThreadManager

    mgr = SlackDailyThreadManager()
    mock_hass = MagicMock()

    coord_office = MagicMock()
    coord_office.room_name = "Office"
    coord_office.is_present = True
    coord_office.state_machine.is_present = True
    coord_office.state_machine.last_occupied_time = time.time() - 120.0
    coord_office.state_machine.occupancy_state = "occupied_confirmed"
    coord_office.state_machine.is_cooling_down = False
    coord_office.state_machine.cooling_remaining_sec = 0
    coord_office.state_machine.last_trigger_entity = "binary_sensor.steves_desk_pir"
    coord_office.state_machine.active_conditions = []
    coord_office.last_spatial_estimate = None

    coord_kitchen = MagicMock()
    coord_kitchen.room_name = "Kitchen"
    coord_kitchen.is_present = False
    coord_kitchen.state_machine.is_present = False
    coord_kitchen.state_machine.occupancy_state = "vacant"
    coord_kitchen.state_machine.is_cooling_down = False
    coord_kitchen.state_machine.cooling_remaining_sec = 0

    mock_hass.data = {
        DOMAIN: {
            "office_id": coord_office,
            "kitchen_id": coord_kitchen,
        }
    }

    occupied, clear = mgr.collect_room_states(mock_hass, format_duration)
    assert len(occupied) == 1
    assert occupied[0]["name"] == "Office"
    assert "2m" in occupied[0]["duration_str"]
    assert "Steves Desk Pir" in occupied[0]["driver"]

    assert clear == ["Kitchen"]


def test_build_daily_digest_blocks_structure():
    """Verify build_daily_digest_blocks correctly formats occupied, clear, headcount, and transition muting."""
    from custom_components.presence_detection_designer.slack_cards import build_daily_digest_blocks

    blocks = build_daily_digest_blocks(
        date_display="Wednesday, Nov 04, 2026",
        occupied_rooms=[{"name": "Office", "duration_str": "15m", "driver": "Steve's S25+"}],
        clear_rooms=["Kitchen", "Living Room"],
        transition_count=42,
        last_updated_time="07:30 PM",
        house_headcount=1,
        occupancy_mode="single_occupant",
        notify_transitions=False,
    )
    serialized = str(blocks)
    assert "Office" in serialized
    assert "Kitchen, Living Room" in serialized
    assert "Headcount:* 1 (single occupant)" in serialized
    assert "Transitions muted" in serialized


@pytest.mark.asyncio
async def test_async_dispatch_notification_mutes_transition_spam(monkeypatch):
    """Verify when slack_notify_transitions is False, individual replies are muted but digest is updated."""
    from custom_components.presence_detection_designer.notifications import (
        NotificationDispatcher,
        TransitionAttribution,
    )
    from custom_components.presence_detection_designer.slack_cards import (
        get_slack_daily_thread_manager,
    )

    dispatcher = NotificationDispatcher()
    mock_hass = MagicMock()
    mock_hass.bus = MagicMock()

    mgr = get_slack_daily_thread_manager(mock_hass)
    monkeypatch.setattr(mgr, "get_slack_token", lambda hass: "xoxb-fake-token")

    post_thread_reply_called = False
    update_digest_called = False

    async def _mock_get_or_create(hass, channel, token, fmt_fn, call_api_fn=None):
        return "12345.6789"

    async def _mock_post_reply(*args, **kwargs):
        nonlocal post_thread_reply_called
        post_thread_reply_called = True
        return True

    async def _mock_update_digest(*args, **kwargs):
        nonlocal update_digest_called
        update_digest_called = True

    monkeypatch.setattr(mgr, "async_get_or_create_daily_thread", _mock_get_or_create)
    monkeypatch.setattr(mgr, "async_post_thread_reply", _mock_post_reply)
    monkeypatch.setattr(mgr, "async_update_daily_digest", _mock_update_digest)
    monkeypatch.setattr(dispatcher, "async_ensure_slack_channel", AsyncMock())

    attr = TransitionAttribution(
        room_id="office",
        room_name="Office",
        from_state="clear",
        to_state="occupied",
        primary_driver="Steve Phone",
        driver_type="sensor",
        confidence_pct=95.0,
        threshold_pct=70.0,
        active_sensors=["sensor.steve_phone"],
        sustaining_conditions=[],
    )

    # When slack_notify_transitions is False:
    result = await dispatcher.async_dispatch_notification(
        hass=mock_hass,
        attribution=attr,
        global_settings={
            "notifications_enabled": True,
            "slack_daily_thread": True,
            "slack_notify_transitions": False,
            "slack_channel": "#presence-alerts",
        },
        room_config={},
    )
    assert result is True
    # Individual reply is MUTED
    assert post_thread_reply_called is False
    # Main card update is SCHEDULED
    assert mock_hass.async_create_task.called
