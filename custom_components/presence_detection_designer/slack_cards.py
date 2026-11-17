"""Slack Daily Thread Manager for persistent self-updating presence cards."""

from __future__ import annotations

import asyncio
import inspect
import json
import logging
import urllib.parse
from datetime import datetime
from typing import Any

from homeassistant.core import HomeAssistant

from .const import DATA_STORE, DOMAIN
from .slack_blocks import (
    _mrkdwn,
    _section,
    build_daily_digest_blocks,
    build_transition_card_blocks,
    call_slack_web_api_sync,
    cancel_startup_slack_digest_sync,
    collect_room_states,
    extract_slack_token_from_hass,
    get_extra_digest_status,
    is_slack_channel_id,
    now_local,
    schedule_startup_slack_digest_sync,
)

__all__ = [
    "SlackDailyThreadManager",
    "_mrkdwn",
    "_section",
    "build_daily_digest_blocks",
    "build_transition_card_blocks",
    "cancel_startup_slack_digest_sync",
    "get_slack_daily_thread_manager",
    "schedule_startup_slack_digest_sync",
]

_LOGGER = logging.getLogger(__name__)
_STALE_ERRORS = frozenset(
    {"message_not_found", "thread_not_found", "cant_update_message", "channel_not_found"}
)
_SLACK_DAILY_THREAD_MGR_SINGLETON: SlackDailyThreadManager | None = None


def get_slack_daily_thread_manager(hass: Any = None) -> SlackDailyThreadManager:
    """Return the shared SlackDailyThreadManager singleton instance."""
    global _SLACK_DAILY_THREAD_MGR_SINGLETON
    if hass and hasattr(hass, "data") and isinstance(hass.data, dict):
        dom_data = hass.data.setdefault(DOMAIN, {})
        if "slack_daily_mgr" not in dom_data:
            mgr = SlackDailyThreadManager()
            dom_data["slack_daily_mgr"] = mgr
            _SLACK_DAILY_THREAD_MGR_SINGLETON = mgr
        return dom_data["slack_daily_mgr"]
    if _SLACK_DAILY_THREAD_MGR_SINGLETON is None:
        _SLACK_DAILY_THREAD_MGR_SINGLETON = SlackDailyThreadManager()
    return _SLACK_DAILY_THREAD_MGR_SINGLETON


class SlackDailyThreadManager:
    """Manages daily dashboard messages, thread grouping, and Slack Web API interactions."""

    def __init__(self) -> None:
        """Initialize the daily thread manager."""
        self._daily_threads: dict[str, dict[str, Any]] = {}
        self._channel_ids: dict[str, str] = {}
        self._verified_channels: set[str] = set()
        self._cached_token: str | None = None
        self._locks: dict[tuple[int, str], asyncio.Lock] = {}
        self._digest_in_flight: set[tuple[int, str]] = set()
        self._digest_queued: set[tuple[int, str]] = set()
        self._last_sent_digest: dict[str, tuple[str, str]] = {}

    def _get_lock(self, key: str) -> asyncio.Lock:
        lk_key = (id(asyncio.get_running_loop()), key)
        lock = self._locks.get(lk_key)
        if lock is None:
            lock = asyncio.Lock()
            self._locks[lk_key] = lock
        return lock

    def call_slack_web_api(
        self, url: str, token: str, payload: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        """Invoke a Slack Web API endpoint synchronously."""
        return call_slack_web_api_sync(url, token, payload)

    def get_slack_token(self, hass: Any) -> str | None:
        """Extract Slack bot API token from Home Assistant config entries or fallback storage."""
        if self._cached_token:
            return self._cached_token
        token = extract_slack_token_from_hass(hass)
        if token:
            self._cached_token = token
        return token

    async def _async_fetch_channels(self, hass: Any, token: str, api_fn: Any) -> bool:
        """Populate channel name -> ID cache via paginated conversations.list."""
        cursor = ""
        ok_any = False
        for _ in range(5):
            url = "https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=200"
            if cursor:
                url += f"&cursor={urllib.parse.quote(cursor)}"
            res = await hass.async_add_executor_job(api_fn, url, token, None)
            if not isinstance(res, dict) or not res.get("ok"):
                break
            ok_any = True
            for ch in res.get("channels") or []:
                if isinstance(ch, dict):
                    c_id, c_name = ch.get("id"), str(ch.get("name", "")).lower()
                    if c_id and c_name:
                        self._channel_ids[c_name] = c_id
                        self._verified_channels.add(c_name)
            cursor = str((res.get("response_metadata") or {}).get("next_cursor") or "").strip()
            if not cursor:
                break
        return ok_any

    async def async_ensure_slack_channel(
        self, hass: Any, channel: str, token: str, call_api_fn: Any = None
    ) -> str:
        """Ensure target Slack channel exists; create if missing and share cache."""
        raw = str(channel or "").strip()
        if is_slack_channel_id(raw):
            return raw.upper()
        clean = raw.lstrip("#").strip().lower()
        if not clean or clean in self._verified_channels or not token:
            return channel
        if not hasattr(hass, "async_add_executor_job"):
            return channel
        api_fn = call_api_fn or self.call_slack_web_api
        async with self._get_lock(f"resolve:{clean}"):
            if clean in self._verified_channels:
                return channel
            try:
                ok = await self._async_fetch_channels(hass, token, api_fn)
                if clean in self._verified_channels:
                    return channel
                if ok:
                    cres = await hass.async_add_executor_job(
                        api_fn,
                        "https://slack.com/api/conversations.create",
                        token,
                        {"name": clean, "is_private": False},
                    )
                    if isinstance(cres, dict) and cres.get("ok"):
                        _LOGGER.info("Auto-created missing Slack channel #%s", clean)
                        ch_obj = cres.get("channel") or {}
                        if isinstance(ch_obj, dict) and ch_obj.get("id"):
                            self._channel_ids[clean] = str(ch_obj["id"])
                        self._verified_channels.add(clean)
            except Exception as err:  # noqa: BLE001
                _LOGGER.debug("Slack channel auto-provisioning skipped for %s: %s", channel, err)
        return channel

    async def async_resolve_channel_id(
        self, hass: HomeAssistant, channel: str, token: str, call_api_fn: Any = None
    ) -> str:
        """Resolve a channel name (e.g. #presence-alerts) to a channel ID (e.g. C0CBX319XHV)."""
        raw = str(channel or "").strip()
        if is_slack_channel_id(raw):
            cid = raw.upper()
            self._channel_ids[cid.lower()] = cid
            return cid
        clean = raw.lstrip("#").strip().lower()
        if not clean:
            return channel
        if clean in self._channel_ids:
            return self._channel_ids[clean]
        api_fn = call_api_fn or self.call_slack_web_api
        async with self._get_lock(f"resolve:{clean}"):
            if clean in self._channel_ids:
                return self._channel_ids[clean]
            try:
                await self._async_fetch_channels(hass, token, api_fn)
                if clean in self._channel_ids:
                    return self._channel_ids[clean]
            except Exception as err:  # noqa: BLE001
                _LOGGER.debug("Channel ID lookup skipped for %s: %s", channel, err)
        stored_id = self._find_stored_channel_id(hass, clean)
        if stored_id:
            self._channel_ids[clean] = stored_id
            return stored_id
        return clean

    @staticmethod
    def _get_store(hass: Any) -> Any:
        if hass and isinstance(getattr(hass, "data", None), dict):
            return hass.data.get(DOMAIN, {}).get(DATA_STORE)
        return None

    def _all_stored_threads(self, hass: Any) -> dict[str, dict[str, Any]]:
        merged: dict[str, dict[str, Any]] = {}
        store = self._get_store(hass)
        if store and hasattr(store, "get_daily_threads"):
            raw = store.get_daily_threads()
            if isinstance(raw, dict):
                merged.update({str(k): v for k, v in raw.items() if isinstance(v, dict)})
        merged.update({str(k): v for k, v in self._daily_threads.items() if isinstance(v, dict)})
        return merged

    def _find_stored_channel_id(self, hass: Any, clean_name: str) -> str | None:
        threads = self._all_stored_threads(hass)
        for key, entry in threads.items():
            if is_slack_channel_id(key) and entry.get("channel_name") == clean_name:
                return key
        today = now_local().strftime("%Y-%m-%d")
        legacy = [
            key
            for key, entry in threads.items()
            if is_slack_channel_id(key)
            and not entry.get("channel_name")
            and entry.get("date_str") == today
            and entry.get("thread_ts")
        ]
        return legacy[0] if len(legacy) == 1 else None

    def _get_entry(
        self, hass: Any, channel_id: str, channel_name: str | None = None
    ) -> tuple[str, dict[str, Any]] | tuple[None, None]:
        threads = self._all_stored_threads(hass)
        if channel_id in threads:
            self._daily_threads[channel_id] = threads[channel_id]
            return channel_id, threads[channel_id]
        if channel_name:
            for key, entry in threads.items():
                if entry.get("channel_name") == channel_name:
                    self._daily_threads[key] = entry
                    return key, entry
        return None, None

    async def _async_persist_entry(
        self, hass: Any, channel_id: str, entry: dict[str, Any], old_key: str | None = None
    ) -> None:
        self._daily_threads[channel_id] = entry
        if old_key and old_key != channel_id:
            self._daily_threads.pop(old_key, None)
        store = self._get_store(hass)
        if not store:
            return
        if old_key and old_key != channel_id and hasattr(store, "async_delete_daily_thread"):
            if inspect.isawaitable(dres := store.async_delete_daily_thread(old_key)):
                await dres
        if hasattr(store, "async_save_daily_thread"):
            if inspect.isawaitable(sres := store.async_save_daily_thread(channel_id, entry)):
                await sres

    async def _async_evict_entry(self, hass: Any, channel_id: str) -> None:
        self._daily_threads.pop(channel_id, None)
        self._last_sent_digest.pop(channel_id, None)
        store = self._get_store(hass)
        if store and hasattr(store, "async_delete_daily_thread"):
            if inspect.isawaitable(res := store.async_delete_daily_thread(channel_id)):
                await res

    def collect_room_states(
        self, hass: HomeAssistant, format_duration_fn: Any
    ) -> tuple[list[dict[str, Any]], list[str]]:
        """Collect current occupied and clear rooms from coordinator data."""
        return collect_room_states(hass, format_duration_fn)

    def _build_digest_payload(
        self,
        hass: HomeAssistant,
        channel_id: str,
        now_dt: datetime,
        format_duration_fn: Any,
        transition_count: int,
    ) -> tuple[dict[str, Any], str]:
        date_display = now_dt.strftime("%A, %b %d, %Y")
        occupied_rooms, clear_rooms = self.collect_room_states(hass, format_duration_fn)
        headcount, mode, notify_trans = get_extra_digest_status(hass)
        store = (
            hass.data.get(DOMAIN, {}).get(DATA_STORE)
            if hass and isinstance(getattr(hass, "data", None), dict)
            else None
        )
        guest_on = (
            bool((getattr(store, "global_settings", None) or {}).get("guest_mode_enabled", False))
            if store
            else False
        )
        blocks = build_daily_digest_blocks(
            date_display=date_display,
            occupied_rooms=occupied_rooms,
            clear_rooms=clear_rooms,
            transition_count=transition_count,
            last_updated_time=now_dt.strftime("%I:%M %p"),
            house_headcount=headcount,
            occupancy_mode=mode,
            notify_transitions=notify_trans,
            guest_mode=guest_on,
        )
        payload = {
            "channel": channel_id,
            "text": f"🏠 Presence Dashboard — {date_display}",
            "blocks": blocks,
        }
        return payload, json.dumps(blocks, sort_keys=True)

    async def _get_or_create_daily_thread_locked(
        self,
        hass: HomeAssistant,
        channel_id: str,
        channel_name: str,
        token: str,
        format_duration_fn: Any,
        api_fn: Any,
        *,
        increment_count: bool = True,
    ) -> tuple[str | None, str, bool]:
        now_dt = now_local()
        date_str = now_dt.strftime("%Y-%m-%d")
        found_key, entry = self._get_entry(hass, channel_id, channel_name=channel_name)
        if entry and entry.get("date_str") == date_str and entry.get("thread_ts"):
            if channel_name and not entry.get("channel_name"):
                entry["channel_name"] = channel_name
            if increment_count:
                entry["transition_count"] = int(entry.get("transition_count", 0) or 0) + 1
            target_key = (
                channel_id if is_slack_channel_id(channel_id) else (found_key or channel_id)
            )
            old_key = found_key if found_key and found_key != target_key else None
            await self._async_persist_entry(hass, target_key, entry, old_key=old_key)
            return str(entry["thread_ts"]), target_key, False

        post_payload, sig = self._build_digest_payload(
            hass, channel_id, now_dt, format_duration_fn, 1
        )
        try:
            res = await hass.async_add_executor_job(
                api_fn, "https://slack.com/api/chat.postMessage", token, post_payload
            )
            if isinstance(res, dict) and res.get("ok") and res.get("ts"):
                thread_ts = str(res["ts"])
                actual_ch = str(res.get("channel") or channel_id)
                if channel_name and is_slack_channel_id(actual_ch):
                    self._channel_ids[channel_name] = actual_ch
                new_entry = {
                    "date_str": date_str,
                    "thread_ts": thread_ts,
                    "transition_count": 1,
                    "channel_name": channel_name,
                }
                old_key = found_key if found_key and found_key != actual_ch else None
                await self._async_persist_entry(hass, actual_ch, new_entry, old_key=old_key)
                self._last_sent_digest[actual_ch] = (thread_ts, sig)
                _LOGGER.info("Initialized daily Slack thread in %s (ts=%s)", actual_ch, thread_ts)
                return thread_ts, actual_ch, True
            if isinstance(res, dict) and not res.get("ok"):
                _LOGGER.warning("Slack postMessage error on %s: %s", channel_id, res.get("error"))
        except Exception as err:  # noqa: BLE001
            _LOGGER.warning("Could not create daily Slack thread in %s: %s", channel_id, err)
        return None, channel_id, False

    async def async_get_or_create_daily_thread(
        self,
        hass: HomeAssistant,
        channel: str,
        token: str,
        format_duration_fn: Any,
        call_api_fn: Any = None,
    ) -> str | None:
        """Get today's daily dashboard thread timestamp, creating parent post if needed."""
        api_fn = call_api_fn or self.call_slack_web_api
        clean = str(channel or "").lstrip("#").strip().lower()
        channel_id = await self.async_resolve_channel_id(hass, channel, token, call_api_fn=api_fn)
        async with self._get_lock(f"thread:{channel_id}"):
            thread_ts, _cid, _created = await self._get_or_create_daily_thread_locked(
                hass, channel_id, clean, token, format_duration_fn, api_fn, increment_count=True
            )
            return thread_ts

    async def async_post_thread_reply(
        self,
        hass: HomeAssistant,
        channel: str,
        thread_ts: str,
        token: str,
        message: str,
        blocks: list[dict[str, Any]] | None = None,
        call_api_fn: Any = None,
    ) -> bool:
        """Post a transition alert directly inside the daily thread via Slack Web API."""
        api_fn = call_api_fn or self.call_slack_web_api
        clean = str(channel or "").lstrip("#").strip().lower()
        channel_id = await self.async_resolve_channel_id(hass, channel, token, call_api_fn=api_fn)
        reply_payload: dict[str, Any] = {
            "channel": channel_id,
            "thread_ts": thread_ts,
            "text": message,
        }
        if blocks:
            reply_payload["blocks"] = blocks
        try:
            res = await hass.async_add_executor_job(
                api_fn, "https://slack.com/api/chat.postMessage", token, reply_payload
            )
            if isinstance(res, dict) and res.get("ok"):
                return True
            err_code = str(res.get("error") or "") if isinstance(res, dict) else ""
            _LOGGER.warning("Slack thread reply error on %s: %s", channel_id, err_code or res)
            if err_code in ("thread_not_found", "message_not_found"):
                async with self._get_lock(f"thread:{channel_id}"):
                    await self._async_evict_entry(hass, channel_id)
                    new_ts, actual_ch, _ = await self._get_or_create_daily_thread_locked(
                        hass, channel_id, clean, token, None, api_fn, increment_count=False
                    )
                    if new_ts:
                        retry_payload = {**reply_payload, "channel": actual_ch, "thread_ts": new_ts}
                        retry_res = await hass.async_add_executor_job(
                            api_fn, "https://slack.com/api/chat.postMessage", token, retry_payload
                        )
                        return bool(isinstance(retry_res, dict) and retry_res.get("ok"))
        except Exception as err:  # noqa: BLE001
            _LOGGER.warning("Could not post threaded Slack reply to %s: %s", channel_id, err)
        return False

    async def async_update_daily_digest(
        self,
        hass: HomeAssistant,
        channel: str,
        token: str,
        format_duration_fn: Any,
        call_api_fn: Any = None,
        *,
        force: bool = False,
    ) -> None:
        """Update today's parent Slack post with the latest live room states."""
        api_fn = call_api_fn or self.call_slack_web_api
        clean = str(channel or "").lstrip("#").strip().lower()
        channel_id = await self.async_resolve_channel_id(hass, channel, token, call_api_fn=api_fn)
        loop_key = (id(asyncio.get_running_loop()), channel_id)
        if not force and loop_key in self._digest_in_flight:
            if loop_key in self._digest_queued:
                return
            self._digest_queued.add(loop_key)

        async with self._get_lock(f"thread:{channel_id}"):
            self._digest_in_flight.add(loop_key)
            self._digest_queued.discard(loop_key)
            try:
                now_dt = now_local()
                date_str = now_dt.strftime("%Y-%m-%d")
                found_key, entry = self._get_entry(hass, channel_id, channel_name=clean)
                if not entry or entry.get("date_str") != date_str or not entry.get("thread_ts"):
                    thread_ts, _cid, created_new = await self._get_or_create_daily_thread_locked(
                        hass,
                        channel_id,
                        clean,
                        token,
                        format_duration_fn,
                        api_fn,
                        increment_count=False,
                    )
                    if not thread_ts or created_new:
                        return
                    found_key, entry = self._get_entry(hass, channel_id, channel_name=clean)
                    if not entry or not entry.get("thread_ts"):
                        return

                target_ch = (
                    channel_id if is_slack_channel_id(channel_id) else (found_key or channel_id)
                )
                if found_key and found_key != target_ch:
                    await self._async_persist_entry(hass, target_ch, entry, old_key=found_key)
                thread_ts = str(entry["thread_ts"])
                tcount = int(entry.get("transition_count", 1) or 1)
                update_payload, sig = self._build_digest_payload(
                    hass, target_ch, now_dt, format_duration_fn, tcount
                )
                update_payload["ts"] = thread_ts
                if not force and self._last_sent_digest.get(target_ch) == (thread_ts, sig):
                    return

                res = await hass.async_add_executor_job(
                    api_fn, "https://slack.com/api/chat.update", token, update_payload
                )
                if isinstance(res, dict) and res.get("ok"):
                    self._last_sent_digest[target_ch] = (thread_ts, sig)
                elif isinstance(res, dict) and not res.get("ok"):
                    err_code = str(res.get("error") or "")
                    _LOGGER.warning("Slack chat.update error on %s: %s", target_ch, err_code)
                    if err_code in _STALE_ERRORS:
                        await self._async_evict_entry(hass, target_ch)
                        if err_code == "channel_not_found":
                            self._channel_ids.pop(clean, None)
                            channel_id = await self.async_resolve_channel_id(
                                hass, channel, token, call_api_fn=api_fn
                            )
                        await self._get_or_create_daily_thread_locked(
                            hass,
                            channel_id,
                            clean,
                            token,
                            format_duration_fn,
                            api_fn,
                            increment_count=False,
                        )
            except Exception as err:  # noqa: BLE001
                _LOGGER.warning("Could not update daily Slack digest: %s", err)
            finally:
                self._digest_in_flight.discard(loop_key)
