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


@pytest.mark.asyncio
async def test_global_settings_and_headcount_service_update_slack_footer_status(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Changing house_occupant_count or slack_notify_transitions refreshes the daily Slack card footer."""
    import json

    from custom_components.presence_detection_designer import async_setup
    from custom_components.presence_detection_designer.house_perimeter import (
        get_house_perimeter_tracker,
    )
    from custom_components.presence_detection_designer.views import PDDGlobalSettingsView

    hass, store = _make_hass_with_store()
    today = now_local().strftime("%Y-%m-%d")
    await store.async_save_daily_thread(
        "C0CBX319XHV",
        {
            "date_str": today,
            "thread_ts": "1794722544.330159",
            "transition_count": 42,
            "channel_name": "presence-alerts",
        },
    )
    mgr = SlackDailyThreadManager()
    mgr._channel_ids["presence-alerts"] = "C0CBX319XHV"
    hass.data[DOMAIN]["slack_daily_mgr"] = mgr
    monkeypatch.setattr(mgr, "get_slack_token", lambda _h: "xoxb-tok")

    updates: list[dict[str, Any]] = []

    def _api(url: str, token: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
        if "chat.update" in url and payload:
            updates.append(payload)
        return {"ok": True}

    monkeypatch.setattr(mgr, "call_slack_web_api", _api)
    monkeypatch.setattr(
        "custom_components.presence_detection_designer._async_ensure_panel_and_views",
        AsyncMock(),
    )

    registered_services: dict[str, Any] = {}
    hass.services = MagicMock()
    hass.services.has_service = MagicMock(return_value=False)
    hass.services.async_register = MagicMock(
        side_effect=lambda dom, name, fn, **kw: registered_services.setdefault(
            f"{dom}.{name}", fn
        )
    )

    assert await async_setup(hass, {}) is True
    tracker = get_house_perimeter_tracker(hass)
    assert tracker.state.count == 1

    # 1. Service call set_house_occupant_count -> updates tracker, store, and Slack card footer
    await registered_services["presence_detection_designer.set_house_occupant_count"](
        MagicMock(data={"count": 2})
    )
    assert tracker.state.count == 2
    assert store.global_settings["house_occupant_count"] == 2
    assert len(updates) == 1
    ctx_text = str(updates[-1]["blocks"][-1])
    assert "*Today's Transitions:* 42" in ctx_text
    assert "*Headcount:* 2 (multi occupant)" in ctx_text
    assert "Transitions muted" in ctx_text

    # 2. PDDGlobalSettingsView toggling slack_notify_transitions & headcount -> forces Slack footer refresh
    req = MagicMock()
    req.app = {"hass": hass}
    req.json = AsyncMock(
        return_value={"house_occupant_count": 3, "slack_notify_transitions": True}
    )
    resp = await PDDGlobalSettingsView().post(req)
    assert resp.status == 200
    assert json.loads(resp.text)["global_settings"]["house_occupant_count"] == 3
    assert tracker.state.count == 3
    assert len(updates) == 2
    ctx_text_2 = str(updates[-1]["blocks"][-1])
    assert "*Headcount:* 3 (multi occupant)" in ctx_text_2
    assert "Transitions logged below" in ctx_text_2


def test_collect_room_states_formats_actual_since_time() -> None:
    """Occupied rooms must expose actual local clock time in since_time rather than elapsed duration."""
    from custom_components.presence_detection_designer.slack_blocks import (
        build_daily_digest_blocks,
        collect_room_states,
        format_since_time,
    )

    hass, _store = _make_hass_with_store()
    now_dt = now_local()
    entry_ts = now_dt.timestamp() - 227.0  # 3m 47s ago
    expected_clock = format_since_time(entry_ts, now_dt=now_dt)
    assert expected_clock is not None
    assert "3m" not in expected_clock
    assert expected_clock.endswith(("AM", "PM"))

    yesterday_ts = entry_ts - 86400.0
    yesterday_clock = format_since_time(yesterday_ts, now_dt=now_dt)
    assert yesterday_clock is not None and "," in yesterday_clock

    coord = MagicMock()
    coord.room_name = "Office"
    coord.is_present = True
    coord._occupied_start_time = entry_ts
    coord.state_machine.is_present = True
    coord.state_machine.last_occupied_time = entry_ts
    coord.state_machine.is_cooling_down = False
    coord.state_machine.cooling_remaining_sec = 0
    coord.state_machine.last_trigger_entity = "binary_sensor.office_motion"
    coord.state_machine.active_conditions = []
    coord.last_spatial_estimate = None

    hass.data[DOMAIN]["office"] = coord
    occupied, _clear = collect_room_states(hass, format_duration)
    assert len(occupied) == 1
    assert occupied[0]["since_time"] == expected_clock
    assert "3m 47s" in (occupied[0]["duration_str"] or "")

    blocks = build_daily_digest_blocks(
        date_display="Monday, Nov 16, 2026",
        occupied_rooms=occupied,
        clear_rooms=["Kitchen"],
        transition_count=12,
        last_updated_time="06:05 PM",
        house_headcount=0,
        occupancy_mode="vacant",
        notify_transitions=False,
    )
    serialized = str(blocks)
    assert f"_(since {expected_clock})_" in serialized
    assert "3m 47s" not in serialized
    assert "pdd_vacancy_controls" in serialized
    assert "pdd_reset_vacant" in serialized
    assert "pdd_clear_all_vacant" in serialized
    assert "pdd_set_home_1" in serialized
    assert "tap *1 Home* or *Reset Vacant*" in serialized


@pytest.mark.asyncio
async def test_slack_webhook_block_actions_reset_vacant_and_clear_rooms(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Slack block_actions payloads verify signature, reset vacancy/rooms, and refresh Slack card."""
    import hashlib
    import hmac
    import json
    import urllib.parse
    from types import SimpleNamespace

    from custom_components.presence_detection_designer.const import (
        CONF_SLACK_SIGNING_SECRET,
        OccupancyState,
    )
    from custom_components.presence_detection_designer.house_perimeter import (
        get_house_perimeter_tracker,
    )
    from custom_components.presence_detection_designer.slack_actions import (
        async_ensure_slack_webhook_id,
        async_handle_slack_webhook,
    )
    from custom_components.presence_detection_designer.slack_cards import (
        get_slack_daily_thread_manager,
    )

    hass, store = _make_hass_with_store()
    await store.async_update_global_settings(
        {
            CONF_SLACK_SIGNING_SECRET: "test_secret_123",
            "house_occupant_count": 2,
            "slack_channel": "#presence-alerts",
        }
    )
    wh_id = await async_ensure_slack_webhook_id(hass)
    assert wh_id.startswith("pdd_slack_")

    tracker = get_house_perimeter_tracker(hass)
    tracker.set_headcount(2, persist=False, notify_digest=False)

    # Create a real-ish mock room coordinator currently occupied
    from custom_components.presence_detection_designer.state_machine import (
        RoomEvidenceSnapshot,
        RoomPresenceStateMachine,
    )

    sm = RoomPresenceStateMachine(name="Office")
    sm.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.office_motion"}),
            human_present=True,
            last_trigger_entity="binary_sensor.office_motion",
        )
    )
    assert sm.is_present is True

    coord = SimpleNamespace(
        room_name="Office",
        entry_id="office",
        state_machine=sm,
        _occupied_start_time=time.time() - 60.0,
        last_spatial_estimate=None,
        async_update_listeners=MagicMock(),
    )
    coord.is_present = True
    hass.data[DOMAIN]["office"] = coord

    mgr = get_slack_daily_thread_manager(hass)
    monkeypatch.setattr(mgr, "get_slack_token", lambda _h: "xoxb-tok")
    today = now_local().strftime("%Y-%m-%d")
    await store.async_save_daily_thread(
        "C0CBX319XHV",
        {"date_str": today, "thread_ts": "1794809018.835629", "transition_count": 5},
    )

    updated_cards: list[dict[str, Any]] = []

    def _fake_api(url: str, token: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
        if "conversations.list" in url:
            return {"ok": True, "channels": [{"id": "C0CBX319XHV", "name": "presence-alerts"}]}
        if "chat.update" in url and payload:
            updated_cards.append(payload)
            return {"ok": True}
        return {"ok": True}

    monkeypatch.setattr(mgr, "call_slack_web_api", _fake_api)

    def _make_slack_request(action_id: str, *, bad_sig: bool = False) -> Any:
        payload_json = json.dumps(
            {
                "type": "block_actions",
                "user": {"username": "steve"},
                "actions": [{"action_id": action_id, "value": "x"}],
            }
        )
        raw_body = "payload=" + urllib.parse.quote(payload_json)
        ts = str(int(time.time()))
        sig = (
            "v0=deadbeef"
            if bad_sig
            else "v0="
            + hmac.new(b"test_secret_123", f"v0:{ts}:{raw_body}".encode(), hashlib.sha256).hexdigest()
        )
        req = MagicMock()
        req.text = AsyncMock(return_value=raw_body)
        req.content_type = "application/x-www-form-urlencoded"
        req.headers = {"X-Slack-Request-Timestamp": ts, "X-Slack-Signature": sig}
        return req

    # Invalid signature must be rejected
    bad_resp = await async_handle_slack_webhook(hass, wh_id, _make_slack_request("pdd_reset_vacant", bad_sig=True))
    assert bad_resp.status == 401
    assert tracker.state.count == 2

    # Reset Vacant sets count to 0 without clearing active rooms
    resp1 = await async_handle_slack_webhook(hass, wh_id, _make_slack_request("pdd_reset_vacant"))
    assert resp1.status == 200
    assert tracker.state.count == 0
    assert store.global_settings["house_occupant_count"] == 0
    assert sm.is_present is True
    assert len(updated_cards) >= 1

    # Set 1 Home + +1 sets count to 2
    await async_handle_slack_webhook(hass, wh_id, _make_slack_request("pdd_set_home_1"))
    assert tracker.state.count == 1
    await async_handle_slack_webhook(hass, wh_id, _make_slack_request("pdd_headcount_inc"))
    assert tracker.state.count == 2

    # Clear Rooms & Vacant sets count to 0 AND force-clears occupied rooms
    resp2 = await async_handle_slack_webhook(hass, wh_id, _make_slack_request("pdd_clear_all_vacant"))
    assert resp2.status == 200
    assert tracker.state.count == 0
    assert sm.state == OccupancyState.VACANT
    assert sm.is_present is False


@pytest.mark.asyncio
async def test_slack_modal_app_home_slash_commands_and_room_actions(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Verify native Slack App capabilities: Modal views.open/submission, App Home, /presence, and room buttons."""
    import json
    import urllib.parse
    from types import SimpleNamespace

    from custom_components.presence_detection_designer.const import OccupancyState
    from custom_components.presence_detection_designer.house_perimeter import (
        get_house_perimeter_tracker,
    )
    from custom_components.presence_detection_designer.notifications import TransitionAttribution
    from custom_components.presence_detection_designer.slack_actions import (
        async_ensure_slack_webhook_id,
        async_handle_slack_webhook,
    )
    from custom_components.presence_detection_designer.slack_blocks import (
        build_transition_card_blocks,
        now_local,
    )
    from custom_components.presence_detection_designer.slack_cards import (
        get_slack_daily_thread_manager,
    )
    from custom_components.presence_detection_designer.state_machine import (
        RoomEvidenceSnapshot,
        RoomPresenceStateMachine,
    )

    hass, store = _make_hass_with_store()
    await store.async_update_global_settings({"slack_channel": "#presence-alerts"})
    wh_id = await async_ensure_slack_webhook_id(hass)

    tracker = get_house_perimeter_tracker(hass)
    tracker.set_headcount(1, persist=False, notify_digest=False)

    sm = RoomPresenceStateMachine(name="Office")
    sm.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.office_motion"}),
            human_present=True,
            last_trigger_entity="binary_sensor.office_motion",
        )
    )
    verify_mock = AsyncMock()
    coord = SimpleNamespace(
        room_name="Office",
        entry_id="office",
        camera_entity="camera.office",
        llm_enabled=True,
        state_machine=sm,
        _occupied_start_time=time.time() - 120.0,
        last_spatial_estimate=None,
        async_manual_verify=verify_mock,
        async_refresh_all_states=MagicMock(),
        async_update_listeners=MagicMock(),
    )
    coord.is_present = True
    hass.data[DOMAIN]["office"] = coord

    mgr = get_slack_daily_thread_manager(hass)
    monkeypatch.setattr(mgr, "get_slack_token", lambda _h: "xoxb-tok")
    today = now_local().strftime("%Y-%m-%d")
    await store.async_save_daily_thread(
        "C0CBX319XHV",
        {"date_str": today, "thread_ts": "1794809018.835629", "transition_count": 3},
    )

    api_calls: list[tuple[str, dict[str, Any] | None]] = []

    def _fake_api(url: str, token: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
        api_calls.append((url, payload))
        if "conversations.list" in url:
            return {"ok": True, "channels": [{"id": "C0CBX319XHV", "name": "presence-alerts"}]}
        return {"ok": True}

    monkeypatch.setattr(mgr, "call_slack_web_api", _fake_api)

    response_posts: list[tuple[str, dict[str, Any]]] = []
    monkeypatch.setattr(
        "custom_components.presence_detection_designer.slack_files._post_response_url_sync",
        lambda url, body: response_posts.append((url, body)),
    )

    # 1. Transition card for occupied room includes per-room interactive buttons
    attr = TransitionAttribution(
        room_id="office",
        room_name="Office",
        from_state="clear",
        to_state="occupied",
        primary_driver="binary_sensor.office_motion",
        driver_type="sensor",
        confidence_pct=92.0,
        threshold_pct=70.0,
        active_sensors=["binary_sensor.office_motion"],
        sustaining_conditions=[],
    )
    card_blocks = build_transition_card_blocks(attr, verbosity="compact", room_id="office")
    card_serialized = json.dumps(card_blocks)
    assert "pdd_room_clear" in card_serialized
    assert "pdd_room_verify" in card_serialized
    assert "pdd_room_override" in card_serialized

    def _form_req(payload_obj: dict[str, Any]) -> Any:
        raw_body = "payload=" + urllib.parse.quote(json.dumps(payload_obj))
        req = MagicMock()
        req.text = AsyncMock(return_value=raw_body)
        req.content_type = "application/x-www-form-urlencoded"
        req.headers = {}
        return req

    def _json_req(obj: dict[str, Any]) -> Any:
        req = MagicMock()
        req.text = AsyncMock(return_value=json.dumps(obj))
        req.content_type = "application/json"
        req.headers = {}
        return req

    def _slash_req(text_arg: str, *, trigger_id: str = "trig_slash") -> Any:
        raw_body = urllib.parse.urlencode(
            {
                "command": "/presence",
                "text": text_arg,
                "user_id": "U123",
                "user_name": "steve",
                "trigger_id": trigger_id,
                "response_url": "https://hooks.slack.com/commands/T/1/abc",
            }
        )
        req = MagicMock()
        req.text = AsyncMock(return_value=raw_body)
        req.content_type = "application/x-www-form-urlencoded"
        req.headers = {}
        return req

    # 2. App Home opened event triggers views.publish
    home_resp = await async_handle_slack_webhook(
        hass, wh_id, _json_req({"type": "event_callback", "event": {"type": "app_home_opened", "user": "U123"}})
    )
    assert home_resp.status == 200
    publish_calls = [p for u, p in api_calls if "views.publish" in u and p]
    assert len(publish_calls) == 1
    assert publish_calls[0]["user_id"] == "U123"
    assert publish_calls[0]["view"]["type"] == "home"
    assert "pdd_home_room_menu" in json.dumps(publish_calls[0]["view"])

    # 3. Manage button opens native Slack Modal via views.open
    modal_open_resp = await async_handle_slack_webhook(
        hass,
        wh_id,
        _form_req(
            {
                "type": "block_actions",
                "trigger_id": "trig_modal_1",
                "user": {"id": "U123", "username": "steve"},
                "actions": [{"action_id": "pdd_open_manage_modal", "value": "manage"}],
            }
        ),
    )
    assert modal_open_resp.status == 200
    open_calls = [p for u, p in api_calls if "views.open" in u and p]
    assert len(open_calls) == 1
    assert open_calls[0]["trigger_id"] == "trig_modal_1"
    assert open_calls[0]["view"]["callback_id"] == "pdd_manage_modal"

    # 4. Modal view_submission applies headcount, toggles, room clear, and room verify
    sub_resp = await async_handle_slack_webhook(
        hass,
        wh_id,
        _form_req(
            {
                "type": "view_submission",
                "user": {"id": "U123", "username": "steve"},
                "view": {
                    "callback_id": "pdd_manage_modal",
                    "state": {
                        "values": {
                            "blk_headcount": {"inp_headcount": {"selected_option": {"value": "3"}}},
                            "blk_toggles": {
                                "inp_toggles": {
                                    "selected_options": [
                                        {"value": "guest_mode_enabled"},
                                        {"value": "slack_notify_transitions"},
                                        {"value": "notifications_enabled"},
                                    ]
                                }
                            },
                            "blk_clear_rooms": {"inp_clear_rooms": {"selected_options": [{"value": "office"}]}},
                            "blk_verify_rooms": {"inp_verify_rooms": {"selected_options": [{"value": "office"}]}},
                        }
                    },
                },
            }
        ),
    )
    assert sub_resp.status == 200
    assert json.loads(sub_resp.text) == {"response_action": "clear"}
    assert tracker.state.count == 3
    assert store.global_settings["guest_mode_enabled"] is True
    assert store.global_settings["slack_notify_transitions"] is True
    assert sm.state == OccupancyState.VACANT
    assert verify_mock.await_count == 1

    # 5. Overflow menu from App Home can toggle override and verify
    ovr_resp = await async_handle_slack_webhook(
        hass,
        wh_id,
        _form_req(
            {
                "type": "block_actions",
                "user": {"id": "U123", "username": "steve"},
                "view": {"type": "home"},
                "response_url": "https://hooks.slack.com/actions/T/1/xyz",
                "actions": [
                    {
                        "action_id": "pdd_home_room_menu",
                        "selected_option": {"value": "override|office"},
                    }
                ],
            }
        ),
    )
    assert ovr_resp.status == 200
    assert sm.override is True
    assert response_posts[-1][1]["replace_original"] is False
    assert response_posts[-1][1]["response_type"] == "ephemeral"
    # Disable override back
    sm.set_override(False)

    # 6. Slash commands: /presence status, /presence help, /presence home 2, /presence guest off, /presence manage
    s_status = json.loads((await async_handle_slack_webhook(hass, wh_id, _slash_req("status"))).text)
    assert s_status["response_type"] == "ephemeral"
    assert "pdd_vacancy_controls" in json.dumps(s_status["blocks"])

    s_help = json.loads((await async_handle_slack_webhook(hass, wh_id, _slash_req("help"))).text)
    assert "/presence vacant" in s_help["text"]

    s_home = json.loads((await async_handle_slack_webhook(hass, wh_id, _slash_req("home 2"))).text)
    assert tracker.state.count == 2
    assert "2" in s_home["text"]

    s_guest = json.loads((await async_handle_slack_webhook(hass, wh_id, _slash_req("guest off"))).text)
    assert store.global_settings["guest_mode_enabled"] is False
    assert "DISABLED" in s_guest["text"]

    s_manage = await async_handle_slack_webhook(hass, wh_id, _slash_req("manage", trigger_id="trig_cmd_9"))
    assert s_manage.status == 200
    assert any(p and p.get("trigger_id") == "trig_cmd_9" for u, p in api_calls if "views.open" in u)


@pytest.mark.asyncio
async def test_slack_files_write_native_snapshot_upload_and_slash_snapshot(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Verify files:write external upload flow, private URL filtering, and /presence snapshot."""
    import io
    import json
    import urllib.parse
    from types import SimpleNamespace

    from custom_components.presence_detection_designer.slack_actions import (
        async_ensure_slack_webhook_id,
        async_handle_slack_webhook,
    )
    from custom_components.presence_detection_designer.slack_cards import (
        get_slack_daily_thread_manager,
    )
    from custom_components.presence_detection_designer.slack_files import (
        async_upload_room_snapshot,
        is_public_snapshot_url,
    )

    assert is_public_snapshot_url("http://10.0.0.10:8301/api/office/latest.jpg") is False
    assert is_public_snapshot_url("https://192.168.1.50/snap.jpg") is False
    assert is_public_snapshot_url("https://cdn.example.com/snap.jpg") is True

    hass, store = _make_hass_with_store()
    await store.async_update_global_settings({"slack_channel": "#presence-alerts"})
    wh_id = await async_ensure_slack_webhook_id(hass)

    coord = SimpleNamespace(
        room_name="Office",
        entry_id="office",
        camera_entity="camera.office",
        camera_snapshot_url="http://10.0.0.10:8301/api/office/latest.jpg",
        state_machine=SimpleNamespace(is_present=True, override=False),
        async_update_listeners=MagicMock(),
    )
    hass.data[DOMAIN]["office"] = coord

    mgr = get_slack_daily_thread_manager(hass)
    monkeypatch.setattr(mgr, "get_slack_token", lambda _h: "xoxb-tok")
    mgr._channel_ids["presence-alerts"] = "C0CBX319XHV"
    from custom_components.presence_detection_designer.slack_blocks import now_local

    await store.async_save_daily_thread(
        "C0CBX319XHV",
        {"date_str": now_local().strftime("%Y-%m-%d"), "thread_ts": "1794809018.835629", "transition_count": 1},
    )

    monkeypatch.setattr(
        "custom_components.presence_detection_designer.slack_files.async_fetch_snapshot_bytes",
        AsyncMock(return_value=b"\xff\xd8\xff\xe0FAKEJPEG"),
    )

    urlopen_calls: list[tuple[str, bytes]] = []

    class _Resp(io.BytesIO):
        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

    def _fake_urlopen(req, timeout=8):
        url = req.full_url if hasattr(req, "full_url") else str(req)
        data = getattr(req, "data", b"") or b""
        urlopen_calls.append((url, data))
        if "files.getUploadURLExternal" in url:
            return _Resp(json.dumps({"ok": True, "upload_url": "https://files.slack.com/upload/v1/abc", "file_id": "F123"}).encode())
        if "files.slack.com/upload" in url:
            return _Resp(b"OK - 12")
        if "files.completeUploadExternal" in url:
            return _Resp(json.dumps({"ok": True, "files": [{"id": "F123"}]}).encode())
        return _Resp(b"{}")

    monkeypatch.setattr(
        "custom_components.presence_detection_designer.slack_files.urllib.request.urlopen",
        _fake_urlopen,
    )

    ok = await async_upload_room_snapshot(
        hass,
        "Office",
        camera_entity="camera.office",
        snapshot_url="http://10.0.0.10:8301/api/office/latest.jpg",
        initial_comment="Test capture",
    )
    assert ok is True
    assert any("files.getUploadURLExternal" in u for u, _ in urlopen_calls)
    assert any("files.slack.com/upload/v1/abc" in u and d == b"\xff\xd8\xff\xe0FAKEJPEG" for u, d in urlopen_calls)
    comp = [json.loads(d.decode()) for u, d in urlopen_calls if "files.completeUploadExternal" in u]
    assert len(comp) == 1
    assert comp[0]["channel_id"] == "C0CBX319XHV"
    assert comp[0]["thread_ts"] == "1794809018.835629"
    assert comp[0]["files"][0]["id"] == "F123"

    # Slash command `/presence snapshot Office` uploads directly to channel_id
    urlopen_calls.clear()
    raw_body = urllib.parse.urlencode(
        {
            "command": "/presence",
            "text": "snapshot Office",
            "user_id": "U123",
            "user_name": "steve",
            "channel_id": "C0CBX319XHV",
        }
    )
    req = MagicMock()
    req.text = AsyncMock(return_value=raw_body)
    req.content_type = "application/x-www-form-urlencoded"
    req.headers = {}
    resp = await async_handle_slack_webhook(hass, wh_id, req)
    assert resp.status == 200
    body = json.loads(resp.text)
    assert "Uploaded live snapshot" in body["text"]
    assert any("files.completeUploadExternal" in u for u, _ in urlopen_calls)
