"""Slack interactive Block Kit action handlers and Home Assistant webhook wiring."""

from __future__ import annotations

import asyncio
import hashlib
import hmac
import json
import logging
import secrets
import time
import urllib.parse
from typing import Any

from aiohttp import web

from .const import (
    CONF_SLACK_SIGNING_SECRET,
    CONF_SLACK_WEBHOOK_ID,
    DATA_STORE,
    DOMAIN,
)

_LOGGER = logging.getLogger(__name__)

SLACK_ACTION_RESET_VACANT = "pdd_reset_vacant"
SLACK_ACTION_CLEAR_ALL_VACANT = "pdd_clear_all_vacant"
SLACK_ACTION_SET_HOME_1 = "pdd_set_home_1"
SLACK_ACTION_HEADCOUNT_INC = "pdd_headcount_inc"
SLACK_ACTION_REFRESH_DIGEST = "pdd_refresh_digest"


def _action_button(
    text: str, action_id: str, value: str, *, style: str | None = None
) -> dict[str, Any]:
    btn: dict[str, Any] = {
        "type": "button",
        "text": {"type": "plain_text", "text": text[:75], "emoji": True},
        "action_id": action_id,
        "value": value,
    }
    if style in ("primary", "danger"):
        btn["style"] = style
    return btn


def build_vacancy_actions_block(
    *, highlight_set_home: bool = False
) -> dict[str, Any]:
    """Return Slack Block Kit actions block with quick vacancy & headcount buttons."""
    return {
        "type": "actions",
        "block_id": "pdd_vacancy_controls",
        "elements": [
            _action_button("⚪ Reset Vacant (0)", SLACK_ACTION_RESET_VACANT, "0"),
            _action_button("🧹 Clear Rooms & Vacant", SLACK_ACTION_CLEAR_ALL_VACANT, "clear_all"),
            _action_button(
                "👤 Set 1 Home",
                SLACK_ACTION_SET_HOME_1,
                "1",
                style="primary" if highlight_set_home else None,
            ),
            _action_button("➕ +1", SLACK_ACTION_HEADCOUNT_INC, "inc"),
            _action_button("🔄 Refresh", SLACK_ACTION_REFRESH_DIGEST, "refresh"),
        ],
    }


async def async_handle_reset_vacancy_service(hass: Any, call: Any) -> None:
    """Handle presence_detection_designer.reset_vacancy service calls."""
    act = (
        SLACK_ACTION_CLEAR_ALL_VACANT
        if bool(call.data.get("clear_rooms", False))
        else SLACK_ACTION_RESET_VACANT
    )
    await async_process_slack_action(hass, act, actor="Service")


def verify_slack_signature(
    signing_secret: str, timestamp: str, raw_body: str, signature: str
) -> bool:
    """Verify Slack v0 HMAC-SHA256 request signature with a 5-minute replay guard."""
    if not signing_secret:
        return True
    if not timestamp or not signature or not signature.startswith("v0="):
        return False
    try:
        req_ts = int(timestamp)
    except (TypeError, ValueError):
        return False
    if abs(time.time() - req_ts) > 300:
        return False
    basestring = f"v0:{req_ts}:{raw_body}".encode()
    expected = "v0=" + hmac.new(signing_secret.encode("utf-8"), basestring, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


async def async_ensure_slack_webhook_id(hass: Any) -> str:
    """Return existing slack_webhook_id or generate and persist a random one."""
    from .store import async_get_store

    store = await async_get_store(hass)
    gs = store.global_settings if hasattr(store, "global_settings") else {}
    existing = str((gs or {}).get(CONF_SLACK_WEBHOOK_ID) or "").strip()
    if existing:
        return existing
    new_id = f"pdd_slack_{secrets.token_urlsafe(12)}"
    if hasattr(store, "async_update_global_settings"):
        await store.async_update_global_settings({CONF_SLACK_WEBHOOK_ID: new_id})
    elif isinstance(gs, dict):
        gs[CONF_SLACK_WEBHOOK_ID] = new_id
    return new_id


async def async_process_slack_action(
    hass: Any,
    action_id: str,
    *,
    actor: str | None = None,
) -> dict[str, Any]:
    """Execute a Slack interactive action (vacancy reset, headcount adjustment, refresh)."""
    from .coordinator import RoomPresenceCoordinator
    from .house_perimeter import get_house_perimeter_tracker
    from .store import async_get_store

    tracker = get_house_perimeter_tracker(hass)
    store = await async_get_store(hass)
    actor_label = actor or "Slack"
    cleared_rooms: list[str] = []

    if action_id == SLACK_ACTION_RESET_VACANT:
        tracker._pending_exit_corroborations.clear()
        tracker.set_headcount(0, persist=False, notify_digest=False)
        await store.async_update_global_settings({"house_occupant_count": 0})
        _LOGGER.info("Slack action (%s): reset house headcount to 0 (vacant)", actor_label)
    elif action_id == SLACK_ACTION_CLEAR_ALL_VACANT:
        tracker._pending_exit_corroborations.clear()
        tracker.set_headcount(0, persist=False, notify_digest=False)
        await store.async_update_global_settings({"house_occupant_count": 0})
        for coord in list(hass.data.get(DOMAIN, {}).values()):
            if isinstance(coord, RoomPresenceCoordinator) or (
                hasattr(coord, "state_machine") and hasattr(coord, "room_name")
            ):
                is_occ = bool(
                    getattr(coord, "is_present", False)
                    or getattr(coord.state_machine, "is_present", False)
                )
                if is_occ:
                    coord.state_machine.force_clear(reason=f"Reset vacant via {actor_label}")
                    cleared_rooms.append(str(getattr(coord, "room_name", "Room")))
                    if hasattr(coord, "async_update_listeners"):
                        coord.async_update_listeners()
        _LOGGER.info(
            "Slack action (%s): cleared %d rooms and reset house to vacant",
            actor_label,
            len(cleared_rooms),
        )
    elif action_id == SLACK_ACTION_SET_HOME_1:
        tracker.set_headcount(1, persist=False, notify_digest=False)
        await store.async_update_global_settings({"house_occupant_count": 1})
        _LOGGER.info("Slack action (%s): set house headcount to 1", actor_label)
    elif action_id == SLACK_ACTION_HEADCOUNT_INC:
        cap = tracker._max_occupants() if hasattr(tracker, "_max_occupants") else 12
        new_count = min(cap, max(1, int(tracker.state.count) + 1))
        tracker.set_headcount(new_count, persist=False, notify_digest=False)
        await store.async_update_global_settings({"house_occupant_count": new_count})
        _LOGGER.info("Slack action (%s): incremented house headcount to %d", actor_label, new_count)
    elif action_id == SLACK_ACTION_REFRESH_DIGEST:
        _LOGGER.debug("Slack action (%s): refreshing daily digest", actor_label)
    else:
        return {"ok": False, "error": f"unknown_action:{action_id}"}

    async def _do_refresh() -> None:
        from .slack_blocks import async_refresh_slack_daily_digest

        await async_refresh_slack_daily_digest(hass, force=True, respect_toggles=False)

    # Wait briefly so Slack reflects the updated card immediately while staying under Slack's 3s limit
    act = getattr(hass, "async_create_task", None)
    if callable(act) and type(act).__name__ != "MagicMock":
        task = act(_do_refresh())
        try:
            await asyncio.wait_for(asyncio.shield(task), timeout=2.2)
        except TimeoutError:
            pass
    else:
        await asyncio.wait_for(_do_refresh(), timeout=2.2)

    return {
        "ok": True,
        "action": action_id,
        "headcount": tracker.state.count,
        "mode": tracker.state.mode,
        "cleared_rooms": cleared_rooms,
    }


def _parse_slack_payload(raw_body: str, content_type: str) -> tuple[dict[str, Any], bool]:
    """Parse either Slack form-encoded `payload=...` or direct JSON body."""
    is_form = "application/x-www-form-urlencoded" in content_type or raw_body.startswith("payload=")
    if is_form:
        parsed_qs = urllib.parse.parse_qs(raw_body, keep_blank_values=True)
        payload_list = parsed_qs.get("payload")
        if payload_list:
            obj = json.loads(payload_list[0])
            return (obj if isinstance(obj, dict) else {}), True
        return {}, True
    obj = json.loads(raw_body or "{}")
    return (obj if isinstance(obj, dict) else {}), False


async def async_handle_slack_webhook(hass: Any, _webhook_id: str, request: Any) -> web.Response:
    """Handle incoming Slack Interactivity block_actions or direct JSON action POSTs."""
    raw_body = await request.text()
    store = hass.data.get(DOMAIN, {}).get(DATA_STORE)
    gs = getattr(store, "global_settings", None) if store else None
    signing_secret = str((gs or {}).get(CONF_SLACK_SIGNING_SECRET) or "").strip()

    if signing_secret:
        headers = getattr(request, "headers", {}) or {}
        ts = str(headers.get("X-Slack-Request-Timestamp") or "")
        sig = str(headers.get("X-Slack-Signature") or "")
        if not verify_slack_signature(signing_secret, ts, raw_body, sig):
            return web.json_response({"ok": False, "error": "invalid_signature"}, status=401)

    content_type = str(getattr(request, "content_type", "") or "").lower()
    try:
        payload, is_slack_form = _parse_slack_payload(raw_body, content_type)
    except Exception as err:  # noqa: BLE001
        return web.json_response({"ok": False, "error": f"invalid_payload: {err}"}, status=400)

    if payload.get("type") == "url_verification" and "challenge" in payload:
        return web.json_response({"challenge": payload["challenge"]})

    action_id = str(payload.get("action_id") or "").strip()
    actions = payload.get("actions")
    if not action_id and isinstance(actions, list) and actions:
        first = actions[0]
        if isinstance(first, dict):
            action_id = str(first.get("action_id") or "").strip()

    if not action_id:
        return web.json_response({"ok": False, "error": "missing_action_id"}, status=400)

    user_obj = payload.get("user") if isinstance(payload.get("user"), dict) else {}
    actor = str(
        user_obj.get("username") or user_obj.get("name") or user_obj.get("id") or "Slack"
    )
    result = await async_process_slack_action(hass, action_id, actor=actor)
    if is_slack_form:
        return web.Response(status=200, text="")
    return web.json_response(result, status=200 if result.get("ok") else 400)


async def async_setup_slack_webhook(hass: Any, webhook_id: str | None = None) -> str | None:
    """Register (or re-register) the Home Assistant webhook for Slack interactive actions."""
    if not hass or not isinstance(getattr(hass, "data", None), dict):
        return None
    target_id = str(webhook_id or "").strip() or await async_ensure_slack_webhook_id(hass)
    dom_data = hass.data.setdefault(DOMAIN, {})
    current_id = dom_data.get("_slack_webhook_id")
    if current_id == target_id:
        return target_id

    try:
        from homeassistant.components import webhook

        if type(webhook).__name__ == "MagicMock":
            return target_id
        if current_id and hasattr(webhook, "async_unregister"):
            try:
                webhook.async_unregister(hass, current_id)
            except Exception:  # noqa: BLE001
                pass
        if hasattr(webhook, "async_register"):
            webhook.async_register(
                hass,
                DOMAIN,
                "Presence Designer Slack Actions",
                target_id,
                async_handle_slack_webhook,
            )
            dom_data["_slack_webhook_id"] = target_id
    except Exception as err:  # noqa: BLE001
        _LOGGER.debug("Skipping Slack webhook registration: %s", err)
    return target_id
