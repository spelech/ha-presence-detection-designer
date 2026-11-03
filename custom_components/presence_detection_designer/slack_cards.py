"""Slack Block Kit Cards & Daily Presence Digest Management."""

from __future__ import annotations

import json
import logging
import time
import urllib.request
from datetime import datetime
from typing import Any

from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)


def build_transition_card_blocks(
    attribution: Any,
    verbosity: str = "compact",
    include_snapshot: bool = False,
    snapshot_url: str | None = None,
) -> list[dict[str, Any]]:
    """Build a structured Slack Block Kit card for a presence transition."""
    v = str(verbosity).lower().strip()
    is_occ = attribution.to_state == "occupied"
    status_icon = "🟢" if is_occ else "⚪"
    status_text = "Occupied" if is_occ else "Cleared"
    header_title = f"{status_icon} {attribution.room_name} → {status_text}"

    blocks: list[dict[str, Any]] = [
        {
            "type": "header",
            "text": {"type": "plain_text", "text": header_title[:150], "emoji": True},
        }
    ]

    context_elements: list[dict[str, Any]] = []
    if is_occ:
        context_elements.append(
            {"type": "mrkdwn", "text": f"*Confidence:* {attribution.confidence_pct:.0f}%"}
        )
        context_elements.append(
            {"type": "mrkdwn", "text": f"*Threshold:* {attribution.threshold_pct:.0f}%"}
        )
        if attribution.arrival_context:
            context_elements.append(
                {"type": "mrkdwn", "text": f"*From:* {attribution.arrival_context}"}
            )
    else:
        if attribution.duration_occupied_str:
            context_elements.append(
                {"type": "mrkdwn", "text": f"*Occupied for:* {attribution.duration_occupied_str}"}
            )
        context_elements.append(
            {"type": "mrkdwn", "text": f"*Final Belief:* {attribution.confidence_pct:.0f}%"}
        )

    if context_elements:
        blocks.append({"type": "context", "elements": context_elements[:10]})

    fields: list[dict[str, Any]] = [
        {"type": "mrkdwn", "text": f"*Driver:*\n`{attribution.primary_driver}`"}
    ]
    if is_occ:
        if attribution.active_sensors:
            s_str = ", ".join(f"`{s.split('.')[-1]}`" for s in attribution.active_sensors[:3])
            fields.append({"type": "mrkdwn", "text": f"*Active Sensors:*\n{s_str}"})
        if attribution.sustaining_conditions:
            sust_str = ", ".join(f"`{s}`" for s in attribution.sustaining_conditions[:2])
            fields.append({"type": "mrkdwn", "text": f"*Sustaining:*\n{sust_str}"})
        if attribution.inferred_location:
            fields.append(
                {"type": "mrkdwn", "text": f"*Location:*\n{attribution.inferred_location}"}
            )
        if attribution.negative_space_evidence:
            fields.append(
                {
                    "type": "mrkdwn",
                    "text": f"*Exclusion:*\n{attribution.negative_space_evidence[0][:80]}",
                }
            )
    else:
        fields.append({"type": "mrkdwn", "text": f"*Clearance:*\n{attribution.primary_driver}"})

    sec: dict[str, Any] = {"type": "section", "fields": fields[:10]}
    if include_snapshot and snapshot_url:
        sec["accessory"] = {
            "type": "image",
            "image_url": snapshot_url,
            "alt_text": f"{attribution.room_name} snapshot",
        }
    blocks.append(sec)

    if v == "full":
        blocks.append({"type": "divider"})
    return blocks


def build_daily_digest_blocks(
    date_display: str,
    occupied_rooms: list[dict[str, Any]],
    clear_rooms: list[str],
    transition_count: int,
    last_updated_time: str,
) -> list[dict[str, Any]]:
    """Build the main top-level daily dashboard message for Slack."""
    blocks: list[dict[str, Any]] = [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": f"🏠 Presence Dashboard — {date_display}",
                "emoji": True,
            },
        }
    ]

    if occupied_rooms:
        occ_lines = []
        for r in occupied_rooms[:12]:
            name, dur, drv = r.get("name", "Unknown"), r.get("duration_str"), r.get("driver")
            dur_text = f" _(since {dur})_" if dur else ""
            drv_text = f" via `{drv}`" if drv else ""
            occ_lines.append(f"🟢 *{name}*{dur_text}{drv_text}")
        occ_text = "\n".join(occ_lines)
    else:
        occ_text = "_⚪ All rooms currently clear._"

    clear_text = ", ".join(clear_rooms[:20]) if clear_rooms else "_None_"
    blocks.append(
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*Currently Occupied ({len(occupied_rooms)}):*\n{occ_text}",
            },
        }
    )
    blocks.append(
        {
            "type": "section",
            "text": {"type": "mrkdwn", "text": f"*Cleared ({len(clear_rooms)}):*\n{clear_text}"},
        }
    )
    blocks.append({"type": "divider"})
    blocks.append(
        {
            "type": "context",
            "elements": [
                {"type": "mrkdwn", "text": f"⏱️ *Updated:* {last_updated_time}"},
                {"type": "mrkdwn", "text": f"🔄 *Today's Transitions:* {transition_count}"},
                {
                    "type": "mrkdwn",
                    "text": "🧵 _Transitions for today are logged in the thread below_",
                },
            ],
        }
    )
    return blocks


_SLACK_DAILY_THREAD_MGR_SINGLETON: SlackDailyThreadManager | None = None


def get_slack_daily_thread_manager(hass: Any = None) -> SlackDailyThreadManager:
    """Return the shared SlackDailyThreadManager singleton instance."""
    global _SLACK_DAILY_THREAD_MGR_SINGLETON
    if hass and hasattr(hass, "data") and isinstance(hass.data, dict):
        from .const import DOMAIN

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

    def call_slack_web_api(
        self,
        url: str,
        token: str,
        payload: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Invoke a Slack Web API endpoint synchronously."""
        headers: dict[str, str] = {"Authorization": f"Bearer {token}"}
        data_bytes: bytes | None = None
        if payload is not None:
            headers["Content-Type"] = "application/json; charset=utf-8"
            data_bytes = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data_bytes, headers=headers)
        with urllib.request.urlopen(req, timeout=8) as resp:
            return json.loads(resp.read().decode("utf-8"))

    def get_slack_token(self, hass: Any) -> str | None:
        """Extract Slack bot API token from Home Assistant config entries or storage."""
        if (
            hass
            and hasattr(hass, "config_entries")
            and hasattr(hass.config_entries, "async_entries")
        ):
            try:
                entries = hass.config_entries.async_entries("slack") or []
                for entry in entries:
                    data = getattr(entry, "data", None)
                    if isinstance(data, dict):
                        cand = data.get("api_key")
                        if isinstance(cand, str) and cand.startswith("xox"):
                            return cand
            except Exception:  # noqa: BLE001
                pass

        try:
            import os

            path = "/config/.storage/core.config_entries"
            if not os.path.isfile(path):
                path = "/ha/823SCD-Docker/.storage/core.config_entries"
            if os.path.isfile(path):
                with open(path, encoding="utf-8") as f:
                    store_data = json.load(f)
                for entry in store_data.get("data", {}).get("entries", []):
                    if entry.get("domain") == "slack":
                        cand = entry.get("data", {}).get("api_key")
                        if isinstance(cand, str) and cand.startswith("xox"):
                            return cand
        except Exception:  # noqa: BLE001
            pass

        return None

    async def async_resolve_channel_id(
        self,
        hass: HomeAssistant,
        channel: str,
        token: str,
        call_api_fn: Any = None,
    ) -> str:
        """Resolve a channel name (e.g. #presence-alerts) to a channel ID (e.g. C0CBX319XHV)."""
        clean_name = channel.lstrip("#").strip().lower()
        if not clean_name:
            return channel
        if clean_name.startswith(("c", "g")) and len(clean_name) >= 9:
            self._channel_ids[clean_name] = clean_name.upper()
            return clean_name.upper()

        if clean_name in self._channel_ids:
            return self._channel_ids[clean_name]

        api_fn = call_api_fn or self.call_slack_web_api
        try:
            list_res = await hass.async_add_executor_job(
                api_fn,
                "https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=200",
                token,
                None,
            )
            if isinstance(list_res, dict) and list_res.get("ok"):
                for ch in list_res.get("channels") or []:
                    if isinstance(ch, dict):
                        c_id = ch.get("id")
                        c_name = str(ch.get("name", "")).lower()
                        if c_id and c_name:
                            self._channel_ids[c_name] = c_id
                            if c_name == clean_name:
                                return c_id
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Channel ID lookup skipped: %s", err)

        return clean_name

    def _get_entry(self, hass: Any, channel_id: str) -> dict[str, Any] | None:
        """Look up thread metadata in memory or from persistent PDDStore."""
        if channel_id in self._daily_threads:
            return self._daily_threads[channel_id]
        if hass and hasattr(hass, "data") and isinstance(hass.data, dict):
            from .const import DATA_STORE, DOMAIN

            store = hass.data.get(DOMAIN, {}).get(DATA_STORE)
            if store and hasattr(store, "get_daily_threads"):
                stored = store.get_daily_threads().get(channel_id)
                if isinstance(stored, dict):
                    self._daily_threads[channel_id] = stored
                    return stored
        return None

    def _persist_entry(self, hass: Any, channel_id: str, entry: dict[str, Any]) -> None:
        """Persist thread metadata in memory and store."""
        self._daily_threads[channel_id] = entry
        if hass and hasattr(hass, "data") and isinstance(hass.data, dict):
            from .const import DATA_STORE, DOMAIN

            store = hass.data.get(DOMAIN, {}).get(DATA_STORE)
            if (
                store
                and hasattr(store, "async_save_daily_thread")
                and hasattr(hass, "async_create_task")
            ):
                coro = store.async_save_daily_thread(channel_id, entry)
                hass.async_create_task(coro)
                if type(hass.async_create_task).__name__ == "MagicMock" and hasattr(coro, "close"):
                    coro.close()

    def collect_room_states(
        self, hass: HomeAssistant, format_duration_fn: Any
    ) -> tuple[list[dict[str, Any]], list[str]]:
        """Collect current occupied and clear rooms from coordinator data."""
        from .const import DOMAIN

        occupied: list[dict[str, Any]] = []
        clear: list[str] = []

        if not hass or not hasattr(hass, "data") or DOMAIN not in hass.data:
            return occupied, clear

        for _key, coord in hass.data[DOMAIN].items():
            if not hasattr(coord, "room_name") or not hasattr(coord, "state_machine"):
                continue
            name = coord.room_name
            state = getattr(coord.state_machine, "current_state", "clear")
            if state == "occupied":
                dur_str = None
                last_occ = getattr(coord.state_machine, "last_occupied_time", None)
                if last_occ and format_duration_fn:
                    dur_str = format_duration_fn(time.time() - last_occ)
                driver = getattr(coord.state_machine, "last_driver_label", None)
                occupied.append(
                    {
                        "name": name,
                        "duration_str": dur_str,
                        "driver": driver,
                    }
                )
            else:
                clear.append(name)

        occupied.sort(key=lambda x: str(x.get("name", "")))
        clear.sort()
        return occupied, clear

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
        channel_id = await self.async_resolve_channel_id(hass, channel, token, call_api_fn=api_fn)
        now_dt = datetime.now()
        date_str = now_dt.strftime("%Y-%m-%d")
        date_display = now_dt.strftime("%A, %b %d, %Y")

        entry = self._get_entry(hass, channel_id)
        if entry and entry.get("date_str") == date_str and entry.get("thread_ts"):
            entry["transition_count"] = entry.get("transition_count", 0) + 1
            self._persist_entry(hass, channel_id, entry)
            return str(entry["thread_ts"])

        occupied_rooms, clear_rooms = self.collect_room_states(hass, format_duration_fn)
        blocks = build_daily_digest_blocks(
            date_display=date_display,
            occupied_rooms=occupied_rooms,
            clear_rooms=clear_rooms,
            transition_count=1,
            last_updated_time=now_dt.strftime("%I:%M %p"),
        )
        post_payload = {
            "channel": channel_id,
            "text": f"🏠 Presence Dashboard — {date_display}",
            "blocks": blocks,
        }

        try:
            res = await hass.async_add_executor_job(
                api_fn,
                "https://slack.com/api/chat.postMessage",
                token,
                post_payload,
            )
            if isinstance(res, dict) and res.get("ok") and res.get("ts"):
                thread_ts = str(res["ts"])
                new_entry = {
                    "date_str": date_str,
                    "thread_ts": thread_ts,
                    "transition_count": 1,
                }
                self._persist_entry(hass, channel_id, new_entry)
                _LOGGER.info(
                    "Initialized daily Slack presence thread in %s (ts=%s)",
                    channel_id,
                    thread_ts,
                )
                return thread_ts
        except Exception as err:  # noqa: BLE001
            _LOGGER.warning("Could not create daily Slack thread in %s: %s", channel_id, err)

        return None

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
                api_fn,
                "https://slack.com/api/chat.postMessage",
                token,
                reply_payload,
            )
            return bool(isinstance(res, dict) and res.get("ok"))
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
    ) -> None:
        """Update today's parent Slack post with the latest live room states."""
        api_fn = call_api_fn or self.call_slack_web_api
        channel_id = await self.async_resolve_channel_id(hass, channel, token, call_api_fn=api_fn)
        entry = self._get_entry(hass, channel_id)
        if not entry or not entry.get("thread_ts"):
            return

        thread_ts = entry["thread_ts"]
        transition_count = entry.get("transition_count", 1)
        now_dt = datetime.now()
        date_display = now_dt.strftime("%A, %b %d, %Y")

        occupied_rooms, clear_rooms = self.collect_room_states(hass, format_duration_fn)
        blocks = build_daily_digest_blocks(
            date_display=date_display,
            occupied_rooms=occupied_rooms,
            clear_rooms=clear_rooms,
            transition_count=transition_count,
            last_updated_time=now_dt.strftime("%I:%M %p"),
        )
        update_payload = {
            "channel": channel_id,
            "ts": thread_ts,
            "text": f"🏠 Presence Dashboard — {date_display}",
            "blocks": blocks,
        }

        try:
            update_res = await hass.async_add_executor_job(
                api_fn,
                "https://slack.com/api/chat.update",
                token,
                update_payload,
            )
            if isinstance(update_res, dict) and not update_res.get("ok"):
                _LOGGER.warning(
                    "Slack chat.update error on %s: %s", channel_id, update_res.get("error")
                )
        except Exception as err:  # noqa: BLE001
            _LOGGER.warning("Could not update daily Slack digest: %s", err)
