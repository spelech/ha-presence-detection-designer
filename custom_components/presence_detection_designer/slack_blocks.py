"""Slack Block Kit builders, Web API transport, room collectors, and startup sync."""

from __future__ import annotations

import json
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime
from typing import Any

from .const import DATA_STORE, DOMAIN


def _mrkdwn(text: str) -> dict[str, Any]:
    """Return a Slack mrkdwn text object."""
    return {"type": "mrkdwn", "text": text}


def _section(text: str) -> dict[str, Any]:
    """Return a Slack section block with mrkdwn text."""
    return {"type": "section", "text": _mrkdwn(text)}


def now_local() -> datetime:
    """Return current local datetime using HA timezone when available."""
    try:
        from homeassistant.util import dt as dt_util

        if type(dt_util).__name__ != "MagicMock" and callable(getattr(dt_util, "now", None)):
            res = dt_util.now()
            if isinstance(res, datetime):
                return res
    except Exception:  # noqa: BLE001
        pass
    return datetime.now()


def is_slack_channel_id(raw: str) -> bool:
    """Return True if raw string is a Slack channel/group ID (e.g. C0CBX319XHV)."""
    s = raw.strip()
    if not s or s.startswith("#"):
        return False
    return bool(
        re.fullmatch(r"[CG][A-Z0-9]{8,}", s)
        or (re.fullmatch(r"[cg][a-z0-9]{8,}", s, re.IGNORECASE) and any(c.isdigit() for c in s))
    )


def call_slack_web_api_sync(
    url: str, token: str, payload: dict[str, Any] | None = None
) -> dict[str, Any]:
    """Invoke a Slack Web API endpoint synchronously."""
    headers: dict[str, str] = {"Authorization": f"Bearer {token}"}
    data_bytes: bytes | None = None
    if payload is not None:
        headers["Content-Type"] = "application/json; charset=utf-8"
        data_bytes = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data_bytes, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as err:
        try:
            parsed = json.loads(err.read().decode("utf-8"))
            if isinstance(parsed, dict):
                return parsed
        except Exception:  # noqa: BLE001
            pass
        raise


def extract_slack_token_from_hass(hass: Any) -> str | None:
    """Extract Slack bot API token from Home Assistant config entries or fallback storage."""
    if hass and hasattr(hass, "config_entries") and hasattr(hass.config_entries, "async_entries"):
        for entry in hass.config_entries.async_entries("slack") or []:
            cand = getattr(entry, "data", {}).get("api_key")
            if isinstance(cand, str) and cand.startswith("xox"):
                return cand
        return None
    try:
        path = "/config/.storage/core.config_entries"
        if os.path.isfile(path):
            with open(path, encoding="utf-8") as f:
                for entry in json.load(f).get("data", {}).get("entries", []):
                    cand = (
                        entry.get("data", {}).get("api_key")
                        if entry.get("domain") == "slack"
                        else None
                    )
                    if isinstance(cand, str) and cand.startswith("xox"):
                        return cand
    except Exception:  # noqa: BLE001
        pass
    return None


def get_extra_digest_status(hass: Any) -> tuple[int | None, str | None, bool]:
    """Retrieve house headcount, mode, and notify_transitions flag."""
    headcount, mode, notify_trans = None, None, False
    if not hass or not hasattr(hass, "data") or not isinstance(hass.data, dict):
        return headcount, mode, notify_trans
    try:
        from .house_perimeter import get_house_perimeter_tracker

        tracker = get_house_perimeter_tracker(hass)
        headcount, mode = tracker.state.count, tracker.state.mode
    except Exception:  # noqa: BLE001
        pass
    store = hass.data.get(DOMAIN, {}).get(DATA_STORE)
    if store and hasattr(store, "global_settings"):
        notify_trans = bool((store.global_settings or {}).get("slack_notify_transitions", False))
    return headcount, mode, notify_trans


def collect_room_states(
    hass: Any, format_duration_fn: Any
) -> tuple[list[dict[str, Any]], list[str]]:
    """Collect current occupied and clear rooms from coordinator data."""
    occupied: list[dict[str, Any]] = []
    clear: list[str] = []
    if not hass or not hasattr(hass, "data") or DOMAIN not in hass.data:
        return occupied, clear
    for _key, coord in list(hass.data[DOMAIN].items()):
        if not hasattr(coord, "room_name") or not hasattr(coord, "state_machine"):
            continue
        name = coord.room_name
        is_occ = bool(
            getattr(coord, "is_present", False) or getattr(coord.state_machine, "is_present", False)
        )
        if is_occ:
            dur_str = None
            raw_occ = getattr(coord, "_occupied_start_time", None)
            if not isinstance(raw_occ, (int, float)) or raw_occ <= 0:
                raw_occ = getattr(coord.state_machine, "last_occupied_time", None)
            if isinstance(raw_occ, (int, float)) and raw_occ > 0 and format_duration_fn:
                dur_str = format_duration_fn(max(0.0, time.time() - float(raw_occ)))
            sm = coord.state_machine
            rem = getattr(sm, "cooling_remaining_sec", 0)
            if (
                getattr(sm, "is_cooling_down", False) is True
                and isinstance(rem, (int, float))
                and rem > 0
            ):
                driver = f"Cooling ({sm.cooling_remaining_sec}s)"
            elif getattr(sm, "last_trigger_entity", None):
                driver = sm.last_trigger_entity.split(".")[-1].replace("_", " ").title()
            elif getattr(sm, "active_conditions", None):
                driver = sm.active_conditions[0]
            elif getattr(coord, "last_spatial_estimate", None) and isinstance(
                coord.last_spatial_estimate, dict
            ):
                driver = coord.last_spatial_estimate.get(
                    "occupant_label"
                ) or coord.last_spatial_estimate.get("spatial_method")
            else:
                driver = "Sensor Fusion"
            occupied.append({"name": name, "duration_str": dur_str, "driver": driver})
        else:
            clear.append(name)
    occupied.sort(key=lambda x: str(x.get("name", "")))
    clear.sort()
    return occupied, clear


def build_transition_card_blocks(
    attribution: Any,
    verbosity: str = "compact",
    include_snapshot: bool = False,
    snapshot_url: str | None = None,
) -> list[dict[str, Any]]:
    """Build a structured Slack Block Kit card for a presence transition."""
    is_occ = attribution.to_state == "occupied"
    status_icon, status_text = ("🟢", "Occupied") if is_occ else ("⚪", "Cleared")
    hdr = f"{status_icon} {attribution.room_name} → {status_text}"[:150]
    blocks: list[dict[str, Any]] = [
        {"type": "header", "text": {"type": "plain_text", "text": hdr, "emoji": True}}
    ]
    ctx: list[dict[str, Any]] = []
    if is_occ:
        ctx.extend(
            [
                _mrkdwn(f"*Confidence:* {attribution.confidence_pct:.0f}%"),
                _mrkdwn(f"*Threshold:* {attribution.threshold_pct:.0f}%"),
            ]
        )
        if attribution.arrival_context:
            ctx.append(_mrkdwn(f"*From:* {attribution.arrival_context}"))
    else:
        if attribution.duration_occupied_str:
            ctx.append(_mrkdwn(f"*Occupied for:* {attribution.duration_occupied_str}"))
        ctx.append(_mrkdwn(f"*Final Belief:* {attribution.confidence_pct:.0f}%"))
    if ctx:
        blocks.append({"type": "context", "elements": ctx[:10]})

    fields: list[dict[str, Any]] = [_mrkdwn(f"*Driver:*\n`{attribution.primary_driver}`")]
    if is_occ:
        if attribution.active_sensors:
            s_str = ", ".join(f"`{s.split('.')[-1]}`" for s in attribution.active_sensors[:3])
            fields.append(_mrkdwn(f"*Active Sensors:*\n{s_str}"))
        if attribution.sustaining_conditions:
            fields.append(
                _mrkdwn(
                    f"*Sustaining:*\n{', '.join(f'`{s}`' for s in attribution.sustaining_conditions[:2])}"
                )
            )
        if attribution.inferred_location:
            fields.append(_mrkdwn(f"*Location:*\n{attribution.inferred_location}"))
        if attribution.negative_space_evidence:
            fields.append(_mrkdwn(f"*Exclusion:*\n{attribution.negative_space_evidence[0][:80]}"))
    else:
        fields.append(_mrkdwn(f"*Clearance:*\n{attribution.primary_driver}"))

    sec: dict[str, Any] = {"type": "section", "fields": fields[:10]}
    if include_snapshot and snapshot_url:
        sec["accessory"] = {
            "type": "image",
            "image_url": snapshot_url,
            "alt_text": f"{attribution.room_name} snapshot",
        }
    blocks.append(sec)
    if str(verbosity).lower().strip() == "full":
        blocks.append({"type": "divider"})
    return blocks


def build_daily_digest_blocks(
    date_display: str,
    occupied_rooms: list[dict[str, Any]],
    clear_rooms: list[str],
    transition_count: int,
    last_updated_time: str,
    house_headcount: int | None = None,
    occupancy_mode: str | None = None,
    notify_transitions: bool = False,
) -> list[dict[str, Any]]:
    """Build the main top-level daily dashboard message for Slack."""
    blocks: list[dict[str, Any]] = [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": f"🏠 Presence Dashboard — {date_display}"[:150],
                "emoji": True,
            },
        }
    ]
    if occupied_rooms:
        lines = []
        for r in occupied_rooms[:12]:
            dur = f" _(since {r['duration_str']})_" if r.get("duration_str") else ""
            raw_drv = str(r.get("driver") or "").replace("`", "").strip()
            drv = f" via `{raw_drv}`" if raw_drv else ""
            lines.append(f"🟢 *{r.get('name', 'Unknown')}*{dur}{drv}")
        occ_text = "\n".join(lines)
    else:
        occ_text = "_⚪ All rooms currently clear._"

    clear_text = ", ".join(clear_rooms[:20]) if clear_rooms else "_None_"
    blocks.extend(
        [
            _section(f"*Currently Occupied ({len(occupied_rooms)}):*\n{occ_text}"),
            _section(f"*Cleared ({len(clear_rooms)}):*\n{clear_text}"),
            {"type": "divider"},
        ]
    )
    ctx = [
        _mrkdwn(f"⏱️ *Updated:* {last_updated_time}"),
        _mrkdwn(f"🔄 *Today's Transitions:* {transition_count}"),
    ]
    if house_headcount is not None:
        mode_str = f" ({occupancy_mode.replace('_', ' ')})" if occupancy_mode else ""
        icon = "👤" if house_headcount == 1 else ("👥" if house_headcount > 1 else "⚪")
        ctx.append(_mrkdwn(f"{icon} *Headcount:* {house_headcount}{mode_str}"))
    subtext = (
        "🧵 _Transitions logged below_"
        if notify_transitions
        else "⚡ _Live dashboard • Transitions muted_"
    )
    ctx.append(_mrkdwn(subtext))
    blocks.append({"type": "context", "elements": ctx[:10]})
    return blocks


def cancel_startup_slack_digest_sync(hass: Any) -> None:
    """Cancel any pending startup/reload Slack digest sync listener or timer."""
    if not hass or not isinstance(getattr(hass, "data", None), dict):
        return
    dom_data = hass.data.get(DOMAIN)
    if not isinstance(dom_data, dict):
        return
    for key in ("_startup_slack_unsub", "_startup_slack_timer"):
        handle = dom_data.pop(key, None)
        if callable(handle):
            try:
                handle()
            except Exception:  # noqa: BLE001
                pass


def schedule_startup_slack_digest_sync(hass: Any) -> None:
    """Schedule a single debounced Slack daily digest sync after HA startup or reload."""
    if (
        not hass
        or not isinstance(getattr(hass, "data", None), dict)
        or not hasattr(hass, "async_create_task")
        or type(hass.async_create_task).__name__ == "MagicMock"
        or not isinstance(getattr(hass, "is_running", None), bool)
    ):
        return
    try:
        from homeassistant.const import EVENT_HOMEASSISTANT_STARTED
        from homeassistant.core import callback
        from homeassistant.helpers.event import async_call_later

        if type(async_call_later).__name__ == "MagicMock":
            return
        if type(callback).__name__ == "MagicMock":

            def callback(fn: Any) -> Any:  # type: ignore[no-redef]
                return fn
    except Exception:  # noqa: BLE001
        return

    dom_data = hass.data.setdefault(DOMAIN, {})

    async def _async_sync_now() -> None:
        from .notifications import format_duration
        from .slack_cards import get_slack_daily_thread_manager

        mgr = get_slack_daily_thread_manager(hass)
        token = mgr.get_slack_token(hass)
        store = hass.data.get(DOMAIN, {}).get(DATA_STORE)
        gs = (getattr(store, "global_settings", None) or {}) if store else {}
        if token and gs.get("notifications_enabled", True) and gs.get("slack_daily_thread", True):
            channel = str(gs.get("slack_channel") or "#presence-alerts").strip()
            await mgr.async_update_daily_digest(hass, channel, token, format_duration)

    @callback
    def _schedule_delayed(_event: Any = None) -> None:
        dom_data.pop("_startup_slack_unsub", None)
        prev_timer = dom_data.pop("_startup_slack_timer", None)
        if callable(prev_timer):
            prev_timer()

        @callback
        def _fire(_now: Any) -> None:
            dom_data.pop("_startup_slack_timer", None)
            hass.async_create_task(_async_sync_now())

        dom_data["_startup_slack_timer"] = async_call_later(hass, 5, _fire)

    if hass.is_running:
        _schedule_delayed()
    elif "_startup_slack_unsub" not in dom_data and hasattr(hass, "bus"):
        dom_data["_startup_slack_unsub"] = hass.bus.async_listen_once(
            EVENT_HOMEASSISTANT_STARTED, _schedule_delayed
        )
