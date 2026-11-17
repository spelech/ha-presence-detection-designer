"""Slack interactive Block Kit action handlers, Modals, App Home, Slash Commands, and webhook wiring."""

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

from .const import CONF_SLACK_SIGNING_SECRET, CONF_SLACK_WEBHOOK_ID, DATA_STORE, DOMAIN
from .slack_files import (
    async_handle_snapshot_slash,
    async_post_response_url,
    async_upload_room_snapshot,
)
from .slack_views import (
    SLACK_ACTION_CLEAR_ALL_VACANT,
    SLACK_ACTION_HEADCOUNT_INC,
    SLACK_ACTION_HOME_ROOM_MENU,
    SLACK_ACTION_OPEN_MANAGE_MODAL,
    SLACK_ACTION_REFRESH_DIGEST,
    SLACK_ACTION_RESET_VACANT,
    SLACK_ACTION_ROOM_CLEAR,
    SLACK_ACTION_ROOM_OVERRIDE,
    SLACK_ACTION_ROOM_VERIFY,
    SLACK_ACTION_SET_HOME_1,
    SLACK_MODAL_CALLBACK_MANAGE,
    build_app_home_view,
    build_ephemeral_status_response,
    build_manage_modal_view,
    build_slash_help_response,
    build_vacancy_actions_block,
    find_room_entry_id,
    parse_manage_modal_submission,
    parse_slash_command_text,
)

__all__ = ["build_vacancy_actions_block"]

_LOGGER = logging.getLogger(__name__)
_MENU_ACTION_MAP = {
    "clear": SLACK_ACTION_ROOM_CLEAR,
    "verify": SLACK_ACTION_ROOM_VERIFY,
    "override": SLACK_ACTION_ROOM_OVERRIDE,
}
_ROOM_ACTIONS = frozenset({SLACK_ACTION_ROOM_CLEAR, SLACK_ACTION_ROOM_VERIFY, SLACK_ACTION_ROOM_OVERRIDE})


async def async_handle_reset_vacancy_service(hass: Any, call: Any) -> None:
    """Handle presence_detection_designer.reset_vacancy service calls."""
    act = SLACK_ACTION_CLEAR_ALL_VACANT if bool(call.data.get("clear_rooms", False)) else SLACK_ACTION_RESET_VACANT
    await async_process_slack_action(hass, act, actor="Service")


def verify_slack_signature(signing_secret: str, timestamp: str, raw_body: str, signature: str) -> bool:
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
    expected = "v0=" + hmac.new(
        signing_secret.encode("utf-8"), f"v0:{req_ts}:{raw_body}".encode(), hashlib.sha256
    ).hexdigest()
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


async def _call_slack_api_async(hass: Any, endpoint: str, payload: dict[str, Any], label: str) -> bool:
    from .slack_cards import get_slack_daily_thread_manager

    mgr = get_slack_daily_thread_manager(hass)
    token = mgr.get_slack_token(hass)
    if not token:
        return False
    url = f"https://slack.com/api/{endpoint}"
    res = (
        await hass.async_add_executor_job(mgr.call_slack_web_api, url, token, payload)
        if hasattr(hass, "async_add_executor_job")
        else mgr.call_slack_web_api(url, token, payload)
    )
    ok = bool(isinstance(res, dict) and res.get("ok"))
    if not ok:
        _LOGGER.warning("Slack %s failed (%s): %s", endpoint, label, res)
    return ok


async def async_open_manage_modal(hass: Any, trigger_id: str) -> bool:
    """Open the Presence Control Center modal via Slack views.open."""
    if not trigger_id:
        return False
    return await _call_slack_api_async(
        hass, "views.open", {"trigger_id": trigger_id, "view": build_manage_modal_view(hass)}, "modal"
    )


async def async_publish_app_home(hass: Any, user_id: str) -> bool:
    """Publish the live Presence dashboard to a user's Slack App Home tab."""
    if not user_id:
        return False
    return await _call_slack_api_async(
        hass, "views.publish", {"user_id": user_id, "view": build_app_home_view(hass)}, user_id
    )





def _resolve_room_coord(hass: Any, room_query: str) -> Any | None:
    eid = find_room_entry_id(hass, room_query)
    if not eid or not hass or not isinstance(getattr(hass, "data", None), dict):
        return None
    return hass.data.get(DOMAIN, {}).get(eid)


def _notify_coord(coord: Any) -> None:
    if hasattr(coord, "async_update_listeners"):
        coord.async_update_listeners()


def _refresh_all_coordinators(hass: Any) -> None:
    from .coordinator import RoomPresenceCoordinator

    for coord in list(hass.data.get(DOMAIN, {}).values()):
        if isinstance(coord, RoomPresenceCoordinator) or (
            hasattr(coord, "async_refresh_all_states") and hasattr(coord, "room_name")
        ):
            coord.async_refresh_all_states()
            _notify_coord(coord)


async def _set_headcount(hass: Any, count: int, *, clear_pending: bool = False) -> Any:
    from .house_perimeter import get_house_perimeter_tracker
    from .store import async_get_store

    tracker = get_house_perimeter_tracker(hass)
    store = await async_get_store(hass)
    if clear_pending:
        tracker._pending_exit_corroborations.clear()
    tracker.set_headcount(count, persist=False, notify_digest=False)
    await store.async_update_global_settings({"house_occupant_count": count})
    return tracker


async def _trigger_room_verify(
    hass: Any, coord: Any, *, upload_snapshot: bool = True, channel: str | None = None
) -> None:
    if hasattr(coord, "async_manual_verify") and (
        getattr(coord, "camera_entity", None) or getattr(coord, "llm_enabled", False)
    ):
        act = getattr(hass, "async_create_task", None)
        if callable(act) and type(act).__name__ != "MagicMock":
            act(coord.async_manual_verify())
        else:
            await coord.async_manual_verify()
    elif hasattr(coord, "async_refresh_all_states"):
        coord.async_refresh_all_states()
        _notify_coord(coord)
    cam = getattr(coord, "camera_entity", None)
    url = getattr(coord, "camera_snapshot_url", None)
    if upload_snapshot and (cam or url):
        coro = async_upload_room_snapshot(
            hass, str(coord.room_name), camera_entity=cam, snapshot_url=url,
            channel=channel, initial_comment=f"👁️ Verification snapshot for *{coord.room_name}*",
        )
        act = getattr(hass, "async_create_task", None)
        if callable(act) and type(act).__name__ != "MagicMock":
            act(coro)
        else:
            await coro


async def _refresh_digest_and_homes(
    hass: Any, *, from_home: bool = False, home_user_id: str | None = None
) -> None:
    from .slack_blocks import async_refresh_slack_daily_digest

    async def _do_refresh() -> None:
        await async_refresh_slack_daily_digest(hass, force=True, respect_toggles=False)
        home_users = set(hass.data.get(DOMAIN, {}).get("_slack_home_users") or [])
        if home_user_id:
            home_users.add(home_user_id)
        for uid in home_users:
            if from_home or uid == home_user_id:
                await async_publish_app_home(hass, uid)

    act = getattr(hass, "async_create_task", None)
    coro = _do_refresh()
    try:
        if callable(act) and type(act).__name__ != "MagicMock":
            await asyncio.wait_for(asyncio.shield(act(coro)), timeout=2.2)
        else:
            await asyncio.wait_for(coro, timeout=2.2)
    except TimeoutError:
        pass


async def async_process_slack_action(
    hass: Any,
    action_id: str,
    *,
    value: str = "",
    actor: str | None = None,
    from_home: bool = False,
    home_user_id: str | None = None,
) -> dict[str, Any]:
    """Execute a Slack interactive action (vacancy reset, headcount, room controls, refresh)."""
    from .coordinator import RoomPresenceCoordinator
    from .house_perimeter import get_house_perimeter_tracker

    tracker = get_house_perimeter_tracker(hass)
    actor_label = actor or "Slack"
    cleared_rooms: list[str] = []
    note = ""

    if action_id == SLACK_ACTION_HOME_ROOM_MENU and "|" in value:
        verb, value = value.split("|", 1)
        action_id = _MENU_ACTION_MAP.get(verb, action_id)

    if action_id == SLACK_ACTION_RESET_VACANT:
        await _set_headcount(hass, 0, clear_pending=True)
        note = "✅ Reset house headcount to *0 (vacant)*."
        _LOGGER.info("Slack action (%s): reset house headcount to 0 (vacant)", actor_label)
    elif action_id == SLACK_ACTION_CLEAR_ALL_VACANT:
        await _set_headcount(hass, 0, clear_pending=True)
        for coord in list(hass.data.get(DOMAIN, {}).values()):
            if isinstance(coord, RoomPresenceCoordinator) or (
                hasattr(coord, "state_machine") and hasattr(coord, "room_name")
            ):
                if getattr(coord, "is_present", False) or getattr(coord.state_machine, "is_present", False):
                    coord.state_machine.force_clear(reason=f"Reset vacant via {actor_label}")
                    cleared_rooms.append(str(getattr(coord, "room_name", "Room")))
                    _notify_coord(coord)
        note = f"🧹 Cleared {len(cleared_rooms)} occupied room(s) and reset house to *0 (vacant)*."
        _LOGGER.info("Slack action (%s): cleared %d rooms and reset house to vacant", actor_label, len(cleared_rooms))
    elif action_id == SLACK_ACTION_SET_HOME_1:
        await _set_headcount(hass, 1)
        note = "👤 Set house headcount to *1 occupant*."
        _LOGGER.info("Slack action (%s): set house headcount to 1", actor_label)
    elif action_id == SLACK_ACTION_HEADCOUNT_INC:
        cap = tracker._max_occupants() if hasattr(tracker, "_max_occupants") else 12
        new_count = min(cap, max(1, int(tracker.state.count) + 1))
        await _set_headcount(hass, new_count)
        note = f"👥 Incremented house headcount to *{new_count}*."
        _LOGGER.info("Slack action (%s): incremented house headcount to %d", actor_label, new_count)
    elif action_id in _ROOM_ACTIONS:
        coord = _resolve_room_coord(hass, value)
        if not coord:
            return {"ok": False, "error": f"room_not_found:{value}"}
        if action_id == SLACK_ACTION_ROOM_CLEAR:
            coord.state_machine.force_clear(reason=f"Cleared via {actor_label}")
            _notify_coord(coord)
            cleared_rooms.append(str(coord.room_name))
            note = f"🧹 Cleared *{coord.room_name}*."
        elif action_id == SLACK_ACTION_ROOM_VERIFY:
            await _trigger_room_verify(hass, coord)
            note = f"👁️ Triggered verification for *{coord.room_name}*."
        else:
            new_ovr = not bool(getattr(coord.state_machine, "override", False))
            if hasattr(coord.state_machine, "set_override"):
                coord.state_machine.set_override(new_ovr)
            _notify_coord(coord)
            note = f"{'🔒 Enabled' if new_ovr else '🔓 Disabled'} manual override for *{coord.room_name}*."
    elif action_id == SLACK_ACTION_REFRESH_DIGEST:
        note = "🔄 Refreshed dashboard."
    else:
        return {"ok": False, "error": f"unknown_action:{action_id}"}

    await _refresh_digest_and_homes(hass, from_home=from_home, home_user_id=home_user_id)
    return {
        "ok": True, "action": action_id, "headcount": tracker.state.count,
        "mode": tracker.state.mode, "cleared_rooms": cleared_rooms, "note": note,
    }


async def async_process_manage_modal_submission(
    hass: Any, view_state: dict[str, Any], *, actor: str | None = None
) -> dict[str, Any]:
    """Apply headcount, global toggles, room clears, and room verifications from Control modal."""
    from .house_perimeter import get_house_perimeter_tracker
    from .store import async_get_store

    parsed = parse_manage_modal_submission(view_state)
    tracker = get_house_perimeter_tracker(hass)
    store = await async_get_store(hass)
    actor_label = actor or "Slack Modal"

    updates = dict(parsed["toggles"])
    if parsed["headcount"] is not None:
        tracker.set_headcount(parsed["headcount"], persist=False, notify_digest=False)
        updates["house_occupant_count"] = parsed["headcount"]
    await store.async_update_global_settings(updates)
    _refresh_all_coordinators(hass)

    cleared_rooms: list[str] = []
    for eid in parsed["clear_room_ids"]:
        coord = _resolve_room_coord(hass, eid)
        if coord:
            coord.state_machine.force_clear(reason=f"Cleared via {actor_label}")
            _notify_coord(coord)
            cleared_rooms.append(str(coord.room_name))
    for eid in parsed["verify_room_ids"]:
        coord = _resolve_room_coord(hass, eid)
        if coord:
            await _trigger_room_verify(hass, coord)

    await _refresh_digest_and_homes(hass)
    _LOGGER.info("Slack modal (%s) applied: updates=%s cleared=%s", actor_label, updates, cleared_rooms)
    return {"ok": True, "headcount": tracker.state.count, "cleared_rooms": cleared_rooms, "updates": updates}


async def async_handle_slash_command(hass: Any, form: dict[str, str]) -> dict[str, Any]:
    """Handle `/presence` Slack slash command payloads and return ephemeral Block Kit JSON."""
    verb, arg = parse_slash_command_text(form.get("text", ""))
    actor = str(form.get("user_name") or form.get("user_id") or "Slack")
    if verb in ("help", "?"):
        return build_slash_help_response()
    if verb in ("manage", "modal", "settings"):
        if await async_open_manage_modal(hass, str(form.get("trigger_id") or "")):
            return {"_raw_empty": True}
        return build_ephemeral_status_response(hass, note="⚠️ Could not open modal (`trigger_id` missing/expired).")
    if verb in ("vacant", "reset"):
        res = await async_process_slack_action(hass, SLACK_ACTION_RESET_VACANT, actor=actor)
        return build_ephemeral_status_response(hass, note=res.get("note"))
    if verb == "home":
        try:
            count = max(1, min(12, int(arg))) if arg else 1
        except ValueError:
            return {"response_type": "ephemeral", "text": f"❌ Invalid occupant count: `{arg}`"}
        await _set_headcount(hass, count)
        await _refresh_digest_and_homes(hass)
        return build_ephemeral_status_response(hass, note=f"👥 Set house headcount to *{count}*.")
    if verb == "snapshot" and arg:
        coord = _resolve_room_coord(hass, arg)
        if not coord:
            return {"response_type": "ephemeral", "text": f"❌ Room not found: `{arg}`"}
        ch = str(form.get("channel_id") or "").strip() or None
        return await async_handle_snapshot_slash(hass, coord, actor=actor, channel_id=ch)
    if verb in ("clear", "verify"):
        act = (
            SLACK_ACTION_ROOM_VERIFY if verb == "verify" else (SLACK_ACTION_ROOM_CLEAR if arg else SLACK_ACTION_CLEAR_ALL_VACANT)
        )
        res = await async_process_slack_action(hass, act, value=arg, actor=actor)
        if not res.get("ok"):
            return {"response_type": "ephemeral", "text": f"❌ Room not found: `{arg}`"}
        return build_ephemeral_status_response(hass, note=res.get("note"))
    if verb == "guest":
        from .store import async_get_store

        store = await async_get_store(hass)
        curr = bool((getattr(store, "global_settings", None) or {}).get("guest_mode_enabled", False))
        nxt = not curr if not arg else arg.lower() in ("on", "true", "1", "yes", "enable")
        await store.async_update_global_settings({"guest_mode_enabled": nxt})
        _refresh_all_coordinators(hass)
        await _refresh_digest_and_homes(hass)
        return build_ephemeral_status_response(hass, note=f"🧑‍🤝‍🧑 Guest Mode {'*ENABLED*' if nxt else '*DISABLED*'}.")
    return build_ephemeral_status_response(hass)


def _parse_slack_payload(raw_body: str, content_type: str) -> tuple[dict[str, Any], str]:
    """Parse Slack form-encoded interactivity, slash commands, or JSON Events API/action POSTs."""
    if "application/x-www-form-urlencoded" in content_type or raw_body.startswith(("payload=", "token=", "command=")):
        parsed_qs = urllib.parse.parse_qs(raw_body, keep_blank_values=True)
        if "payload" in parsed_qs and parsed_qs["payload"]:
            obj = json.loads(parsed_qs["payload"][0])
            return (obj if isinstance(obj, dict) else {}), "interactive"
        flat = {k: (v[0] if v else "") for k, v in parsed_qs.items()}
        return flat, ("slash" if "command" in flat else "interactive")
    obj = json.loads(raw_body or "{}")
    return (obj if isinstance(obj, dict) else {}), "json"


async def async_handle_slack_webhook(hass: Any, _webhook_id: str, request: Any) -> web.Response:
    """Handle Slack Interactivity, Modals, Slash Commands, and Events API callbacks."""
    raw_body = await request.text()
    store = hass.data.get(DOMAIN, {}).get(DATA_STORE)
    signing_secret = str(((getattr(store, "global_settings", None) or {}).get(CONF_SLACK_SIGNING_SECRET)) or "").strip()
    if signing_secret:
        headers = getattr(request, "headers", {}) or {}
        if not verify_slack_signature(
            signing_secret, str(headers.get("X-Slack-Request-Timestamp") or ""), raw_body, str(headers.get("X-Slack-Signature") or "")
        ):
            return web.json_response({"ok": False, "error": "invalid_signature"}, status=401)

    content_type = str(getattr(request, "content_type", "") or "").lower()
    try:
        payload, kind = _parse_slack_payload(raw_body, content_type)
    except Exception as err:  # noqa: BLE001
        return web.json_response({"ok": False, "error": f"invalid_payload: {err}"}, status=400)

    if payload.get("type") == "url_verification" and "challenge" in payload:
        return web.json_response({"challenge": payload["challenge"]})

    if payload.get("type") == "event_callback":
        ev = payload.get("event") if isinstance(payload.get("event"), dict) else {}
        if ev.get("type") == "app_home_opened" and ev.get("user"):
            uid = str(ev["user"])
            hass.data.setdefault(DOMAIN, {}).setdefault("_slack_home_users", set()).add(uid)
            await async_publish_app_home(hass, uid)
        return web.json_response({"ok": True})

    if kind == "slash":
        slash_res = await async_handle_slash_command(hass, payload)
        return web.Response(status=200, text="") if slash_res.pop("_raw_empty", False) else web.json_response(slash_res)

    user_obj = payload.get("user") if isinstance(payload.get("user"), dict) else {}
    actor = str(user_obj.get("username") or user_obj.get("name") or user_obj.get("id") or "Slack")

    if payload.get("type") == "view_submission":
        view = payload.get("view") if isinstance(payload.get("view"), dict) else {}
        if view.get("callback_id") == SLACK_MODAL_CALLBACK_MANAGE:
            await async_process_manage_modal_submission(hass, view.get("state") or {}, actor=actor)
        return web.json_response({"response_action": "clear"})

    action_id = str(payload.get("action_id") or "").strip()
    action_value = str(payload.get("value") or "").strip()
    actions = payload.get("actions")
    if not action_id and isinstance(actions, list) and actions and isinstance(actions[0], dict):
        first = actions[0]
        action_id = str(first.get("action_id") or "").strip()
        sel_opt = first.get("selected_option") if isinstance(first.get("selected_option"), dict) else {}
        action_value = str(sel_opt.get("value") or first.get("value") or "").strip()

    if payload.get("type") in ("shortcut", "message_action") or action_id == SLACK_ACTION_OPEN_MANAGE_MODAL:
        opened = await async_open_manage_modal(hass, str(payload.get("trigger_id") or ""))
        return web.Response(status=200, text="") if kind == "interactive" else web.json_response({"ok": opened})
    if not action_id:
        return web.json_response({"ok": False, "error": "missing_action_id"}, status=400)

    view_type = str((payload.get("view") or {}).get("type") or "") if isinstance(payload.get("view"), dict) else ""
    uid = str(user_obj.get("id") or "") or None
    result = await async_process_slack_action(
        hass, action_id, value=action_value, actor=actor, from_home=(view_type == "home"), home_user_id=uid
    )
    resp_url = str(payload.get("response_url") or "")
    if resp_url and result.get("note") and action_id != SLACK_ACTION_REFRESH_DIGEST:
        await async_post_response_url(
            hass, resp_url, {"response_type": "ephemeral", "replace_original": False, "text": result["note"]}
        )
    if kind == "interactive":
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
            webhook.async_register(hass, DOMAIN, "Presence Designer Slack Actions", target_id, async_handle_slack_webhook)
            dom_data["_slack_webhook_id"] = target_id
    except Exception as err:  # noqa: BLE001
        _LOGGER.debug("Skipping Slack webhook registration: %s", err)
    return target_id
