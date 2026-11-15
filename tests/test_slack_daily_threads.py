"""Regression tests for Slack daily thread locking, same-day restarts, and recovery."""

from __future__ import annotations

import asyncio
import time
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest

from custom_components.presence_detection_designer.const import DATA_STORE, DOMAIN
from custom_components.presence_detection_designer.notifications import (
    NotificationDispatcher,
    TransitionAttribution,
    format_duration,
)
from custom_components.presence_detection_designer.slack_blocks import is_slack_channel_id
from custom_components.presence_detection_designer.slack_cards import (
    SlackDailyThreadManager,
    now_local,
)
from custom_components.presence_detection_designer.store import PDDStore


def _make_hass_with_store() -> tuple[MagicMock, PDDStore]:
    hass = MagicMock()
    store = PDDStore(hass)
    hass.data = {DOMAIN: {DATA_STORE: store}}

    async def _run_sync(func: Any, *args: Any) -> Any:
        return func(*args)

    hass.async_add_executor_job = AsyncMock(side_effect=_run_sync)
    hass.services.async_call = AsyncMock()
    hass.bus.async_fire = MagicMock()
    return hass, store


def test_is_slack_channel_id_avoids_channel_name_false_positives() -> None:
    """Channel names starting with c/g must not be treated as Slack channel IDs."""
    assert is_slack_channel_id("C0CBX319XHV") is True
    assert is_slack_channel_id("G12345678") is True
    assert is_slack_channel_id("#presence-alerts") is False
    assert is_slack_channel_id("#garage-door") is False
    assert is_slack_channel_id("garage-door") is False
    assert is_slack_channel_id("cleaningroom") is False


def test_collect_room_states_ignores_zero_occupied_timestamp() -> None:
    """A room with last_occupied_time=0.0 must not render ~56-year duration."""
    hass, _store = _make_hass_with_store()
    mgr = SlackDailyThreadManager()

    coord = MagicMock()
    coord.room_name = "Master Bedroom"
    coord.is_present = True
    coord._occupied_start_time = None
    coord.state_machine.is_present = True
    coord.state_machine.last_occupied_time = 0.0
    coord.state_machine.is_cooling_down = False
    coord.state_machine.cooling_remaining_sec = 0
    coord.state_machine.last_trigger_entity = "binary_sensor.master_bedroom_motion"
    coord.state_machine.active_conditions = []
    coord.last_spatial_estimate = None

    hass.data[DOMAIN]["mb"] = coord
    occupied, clear = mgr.collect_room_states(hass, format_duration)
    assert len(occupied) == 1
    assert occupied[0]["duration_str"] is None
    assert clear == []


@pytest.mark.asyncio
async def test_concurrent_get_or_create_posts_only_once_and_awaits_store() -> None:
    """Two concurrent transitions on a new day must create only one Slack daily post."""
    hass, store = _make_hass_with_store()
    mgr = SlackDailyThreadManager()
    post_calls: list[dict[str, Any]] = []

    def _slow_api(url: str, token: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
        if "conversations.list" in url:
            return {"ok": True, "channels": [{"id": "C0CBX319XHV", "name": "presence-alerts"}]}
        if "chat.postMessage" in url and payload:
            post_calls.append(payload)
            return {"ok": True, "channel": "C0CBX319XHV", "ts": "1794722544.330159"}
        return {"ok": True}

    async def _delayed_exec(func: Any, *args: Any) -> Any:
        await asyncio.sleep(0.02)
        return func(*args)

    hass.async_add_executor_job = AsyncMock(side_effect=_delayed_exec)

    ts1, ts2 = await asyncio.gather(
        mgr.async_get_or_create_daily_thread(
            hass, "#presence-alerts", "xoxb-tok", format_duration, call_api_fn=_slow_api
        ),
        mgr.async_get_or_create_daily_thread(
            hass, "#presence-alerts", "xoxb-tok", format_duration, call_api_fn=_slow_api
        ),
    )

    assert ts1 == "1794722544.330159"
    assert ts2 == "1794722544.330159"
    assert len(post_calls) == 1
    saved = store.get_daily_threads()["C0CBX319XHV"]
    assert saved["thread_ts"] == "1794722544.330159"
    assert saved["transition_count"] == 2
    assert saved["channel_name"] == "presence-alerts"


@pytest.mark.asyncio
async def test_same_day_restart_reuses_persisted_thread_even_if_channel_lookup_fails() -> None:
    """After same-day restart, transient conversations.list failure must NOT create duplicate post."""
    hass, store = _make_hass_with_store()
    today = now_local().strftime("%Y-%m-%d")
    await store.async_save_daily_thread(
        "C0CBX319XHV",
        {"date_str": today, "thread_ts": "1794722544.330159", "transition_count": 52},
    )

    # Fresh manager simulates HA restart
    mgr = SlackDailyThreadManager()
    calls: list[tuple[str, dict[str, Any] | None]] = []

    def _flaky_api(url: str, token: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
        calls.append((url, payload))
        if "conversations.list" in url:
            raise OSError("Transient DNS error during startup")
        return {"ok": True}

    ts = await mgr.async_get_or_create_daily_thread(
        hass, "#presence-alerts", "xoxb-tok", format_duration, call_api_fn=_flaky_api
    )
    assert ts == "1794722544.330159"
    assert not any("chat.postMessage" in u for u, _ in calls)
    assert store.get_daily_threads()["C0CBX319XHV"]["transition_count"] == 53

    await mgr.async_update_daily_digest(
        hass, "#presence-alerts", "xoxb-tok", format_duration, call_api_fn=_flaky_api
    )
    updates = [p for u, p in calls if "chat.update" in u and p]
    assert len(updates) == 1
    assert updates[0]["channel"] == "C0CBX319XHV"
    assert updates[0]["ts"] == "1794722544.330159"


@pytest.mark.asyncio
async def test_stale_message_not_found_recovery_recreates_daily_thread() -> None:
    """When chat.update returns message_not_found, stale thread is evicted and recreated."""
    hass, store = _make_hass_with_store()
    today = now_local().strftime("%Y-%m-%d")
    await store.async_save_daily_thread(
        "C0CBX319XHV",
        {
            "date_str": today,
            "thread_ts": "111111.222222",
            "transition_count": 10,
            "channel_name": "presence-alerts",
        },
    )

    mgr = SlackDailyThreadManager()
    posted: list[dict[str, Any]] = []

    def _api(url: str, token: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
        if "conversations.list" in url:
            return {"ok": True, "channels": [{"id": "C0CBX319XHV", "name": "presence-alerts"}]}
        if "chat.update" in url:
            return {"ok": False, "error": "message_not_found"}
        if "chat.postMessage" in url and payload:
            posted.append(payload)
            return {"ok": True, "channel": "C0CBX319XHV", "ts": "999999.888888"}
        return {"ok": True}

    await mgr.async_update_daily_digest(
        hass, "#presence-alerts", "xoxb-tok", format_duration, call_api_fn=_api
    )
    assert len(posted) == 1
    assert store.get_daily_threads()["C0CBX319XHV"]["thread_ts"] == "999999.888888"


@pytest.mark.asyncio
async def test_concurrent_digest_updates_coalesce_and_preserve_latest_state() -> None:
    """Burst updates serialize and coalesce so stale snapshots never overwrite newer room states."""
    hass, store = _make_hass_with_store()
    today = now_local().strftime("%Y-%m-%d")
    await store.async_save_daily_thread(
        "C0CBX319XHV",
        {
            "date_str": today,
            "thread_ts": "1794722544.330159",
            "transition_count": 5,
            "channel_name": "presence-alerts",
        },
    )

    coord = MagicMock()
    coord.room_name = "Office"
    coord.is_present = False
    coord._occupied_start_time = None
    coord.state_machine.is_present = False
    coord.state_machine.last_occupied_time = 0.0
    coord.state_machine.is_cooling_down = False
    coord.state_machine.cooling_remaining_sec = 0
    coord.state_machine.last_trigger_entity = None
    coord.state_machine.active_conditions = []
    coord.last_spatial_estimate = None
    hass.data[DOMAIN]["office"] = coord

    mgr = SlackDailyThreadManager()
    mgr._channel_ids["presence-alerts"] = "C0CBX319XHV"
    updates: list[str] = []

    def _api(url: str, token: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
        if "chat.update" in url and payload:
            updates.append(str(payload["blocks"]))
            return {"ok": True}
        return {"ok": True}

    async def _slow_exec(func: Any, *args: Any) -> Any:
        await asyncio.sleep(0.03)
        return func(*args)

    hass.async_add_executor_job = AsyncMock(side_effect=_slow_exec)

    tasks = [
        asyncio.create_task(
            mgr.async_update_daily_digest(
                hass, "#presence-alerts", "xoxb-tok", format_duration, call_api_fn=_api
            )
        )
        for _ in range(4)
    ]
    await asyncio.sleep(0.01)
    coord.is_present = True
    coord.state_machine.is_present = True
    coord.state_machine.last_occupied_time = time.time() - 10
    await asyncio.gather(*tasks)

    assert 1 <= len(updates) <= 2
    assert "Currently Occupied (1):" in updates[-1]
    assert "Office" in updates[-1]


@pytest.mark.asyncio
async def test_explicitly_muted_transitions_never_fall_back_to_channel_spam(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """When slack_notify_transitions is explicitly False, thread failure must not spam channel."""
    hass, _store = _make_hass_with_store()
    dispatcher = NotificationDispatcher()
    mgr = SlackDailyThreadManager()
    hass.data[DOMAIN]["slack_daily_mgr"] = mgr

    monkeypatch.setattr(mgr, "get_slack_token", lambda _h: "xoxb-tok")
    monkeypatch.setattr(mgr, "async_get_or_create_daily_thread", AsyncMock(return_value=None))
    monkeypatch.setattr(dispatcher, "async_ensure_slack_channel", AsyncMock())

    attr = TransitionAttribution(
        room_id="office",
        room_name="Office",
        from_state="clear",
        to_state="occupied",
        primary_driver="Motion",
        driver_type="sensor",
        confidence_pct=90.0,
        threshold_pct=70.0,
        active_sensors=["binary_sensor.office_motion"],
        sustaining_conditions=[],
    )
    ok = await dispatcher.async_dispatch_notification(
        hass=hass,
        attribution=attr,
        global_settings={
            "notifications_enabled": True,
            "slack_daily_thread": True,
            "slack_notify_transitions": False,
            "slack_channel": "#presence-alerts",
        },
        room_config={},
    )
    assert ok is False
    hass.services.async_call.assert_not_called()


@pytest.mark.asyncio
async def test_post_thread_reply_recovers_from_thread_not_found() -> None:
    """When chat.postMessage reply hits thread_not_found, recreate daily thread and retry."""
    hass, store = _make_hass_with_store()
    today = now_local().strftime("%Y-%m-%d")
    await store.async_save_daily_thread(
        "C0CBX319XHV",
        {
            "date_str": today,
            "thread_ts": "111111.000000",
            "transition_count": 3,
            "channel_name": "presence-alerts",
        },
    )

    mgr = SlackDailyThreadManager()
    mgr._channel_ids["presence-alerts"] = "C0CBX319XHV"
    posts: list[dict[str, Any]] = []

    def _api(url: str, token: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
        if "chat.postMessage" in url and payload:
            posts.append(dict(payload))
            if payload.get("thread_ts") == "111111.000000":
                return {"ok": False, "error": "thread_not_found"}
            if "thread_ts" not in payload:
                return {"ok": True, "channel": "C0CBX319XHV", "ts": "222222.333333"}
            return {"ok": True, "ts": "222222.444444"}
        return {"ok": True}

    ok = await mgr.async_post_thread_reply(
        hass,
        "#presence-alerts",
        "111111.000000",
        "xoxb-tok",
        "Office occupied",
        call_api_fn=_api,
    )
    assert ok is True
    assert len(posts) == 3
    assert posts[1].get("thread_ts") is None
    assert posts[2].get("thread_ts") == "222222.333333"
    assert store.get_daily_threads()["C0CBX319XHV"]["thread_ts"] == "222222.333333"


@pytest.mark.asyncio
async def test_setup_entry_registers_coordinator_before_async_setup(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Coordinator must be in hass.data[DOMAIN] before async_setup evaluates initial room states."""
    from custom_components.presence_detection_designer import (
        RoomPresenceCoordinator,
        async_setup_entry,
    )

    hass, _store = _make_hass_with_store()
    entry = MagicMock()
    entry.entry_id = "room_entry_1"
    entry.data = {"room_name": "Office"}
    entry.options = {}
    hass.config_entries.async_forward_entry_setups = AsyncMock()

    seen_during_setup: list[bool] = []

    async def _fake_coord_setup(self: RoomPresenceCoordinator) -> None:
        seen_during_setup.append(entry.entry_id in hass.data[DOMAIN])

    monkeypatch.setattr(RoomPresenceCoordinator, "async_setup", _fake_coord_setup)
    monkeypatch.setattr(
        "custom_components.presence_detection_designer._async_ensure_panel_and_views",
        AsyncMock(),
    )

    ok = await async_setup_entry(hass, entry)
    assert ok is True
    assert seen_during_setup == [True]
