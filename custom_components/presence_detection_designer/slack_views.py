"""Slack Block Kit views: interactive action bars, Modals, App Home, and Slash Commands."""

from __future__ import annotations

from typing import Any

from .const import DATA_STORE, DOMAIN

SLACK_ACTION_RESET_VACANT = "pdd_reset_vacant"
SLACK_ACTION_CLEAR_ALL_VACANT = "pdd_clear_all_vacant"
SLACK_ACTION_SET_HOME_1 = "pdd_set_home_1"
SLACK_ACTION_HEADCOUNT_INC = "pdd_headcount_inc"
SLACK_ACTION_REFRESH_DIGEST = "pdd_refresh_digest"
SLACK_ACTION_OPEN_MANAGE_MODAL = "pdd_open_manage_modal"
SLACK_ACTION_ROOM_CLEAR = "pdd_room_clear"
SLACK_ACTION_ROOM_VERIFY = "pdd_room_verify"
SLACK_ACTION_ROOM_OVERRIDE = "pdd_room_override"
SLACK_ACTION_HOME_ROOM_MENU = "pdd_home_room_menu"
SLACK_MODAL_CALLBACK_MANAGE = "pdd_manage_modal"


def _pt(text: str) -> dict[str, Any]:
    return {"type": "plain_text", "text": text[:75], "emoji": True}


def _mrkdwn(text: str) -> dict[str, Any]:
    return {"type": "mrkdwn", "text": text}


def _action_button(
    text: str,
    action_id: str,
    value: str,
    *,
    style: str | None = None,
    confirm: dict[str, Any] | None = None,
) -> dict[str, Any]:
    btn: dict[str, Any] = {
        "type": "button",
        "text": _pt(text),
        "action_id": action_id,
        "value": value[:2000],
    }
    if style in ("primary", "danger"):
        btn["style"] = style
    if confirm:
        btn["confirm"] = confirm
    return btn


def build_refresh_button() -> dict[str, Any]:
    """Return a compact Refresh button suitable as a section accessory."""
    return _action_button("🔄 Refresh", SLACK_ACTION_REFRESH_DIGEST, "refresh")


def build_vacancy_actions_block(*, highlight_set_home: bool = False) -> dict[str, Any]:
    """Return Slack Block Kit actions block with quick house mode and modal controls."""
    clear_confirm = {
        "title": _pt("Clear all occupied rooms?"),
        "text": _mrkdwn(
            "Force-clear every currently occupied room and reset house mode to *Vacant*?"
        ),
        "confirm": _pt("Clear & Reset"),
        "deny": _pt("Cancel"),
        "style": "danger",
    }
    return {
        "type": "actions",
        "block_id": "pdd_vacancy_controls",
        "elements": [
            _action_button("⚪ Reset Vacant", SLACK_ACTION_RESET_VACANT, "vacant"),
            _action_button(
                "🧹 Clear Rooms & Vacant",
                SLACK_ACTION_CLEAR_ALL_VACANT,
                "clear_all",
                confirm=clear_confirm,
            ),
            _action_button(
                "👤 Occupied",
                SLACK_ACTION_SET_HOME_1,
                "occupied",
                style="primary" if highlight_set_home else None,
            ),
            _action_button("👥 Guest Mode", SLACK_ACTION_HEADCOUNT_INC, "guest"),
            _action_button("🎛️ Manage", SLACK_ACTION_OPEN_MANAGE_MODAL, "manage"),
        ],
    }


def build_room_transition_actions_block(room_id: str) -> dict[str, Any]:
    """Return quick per-room actions attached to an occupied transition thread card."""
    return {
        "type": "actions",
        "block_id": f"pdd_room_actions_{room_id}"[:255],
        "elements": [
            _action_button("🧹 Clear Room", SLACK_ACTION_ROOM_CLEAR, room_id),
            _action_button("👁️ Verify Camera", SLACK_ACTION_ROOM_VERIFY, room_id),
            _action_button("🔒 Toggle Override", SLACK_ACTION_ROOM_OVERRIDE, room_id),
        ],
    }


def collect_detailed_rooms(hass: Any) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Return sorted (occupied_rooms, clear_rooms) with entry_id, since_time, driver, override."""
    from .slack_blocks import format_since_time

    occupied: list[dict[str, Any]] = []
    clear: list[dict[str, Any]] = []
    if not hass or not isinstance(getattr(hass, "data", None), dict) or DOMAIN not in hass.data:
        return occupied, clear

    for key, coord in list(hass.data[DOMAIN].items()):
        if not hasattr(coord, "room_name") or not hasattr(coord, "state_machine"):
            continue
        sm = coord.state_machine
        entry_id = str(getattr(coord, "entry_id", None) or key)
        name = str(coord.room_name)
        is_occ = bool(getattr(coord, "is_present", False) or getattr(sm, "is_present", False))
        override = bool(getattr(sm, "override", False))
        has_cam = bool(
            getattr(coord, "camera_entity", None) or getattr(coord, "llm_enabled", False)
        )
        if is_occ:
            raw_occ = getattr(coord, "_occupied_start_time", None)
            if not isinstance(raw_occ, (int, float)) or isinstance(raw_occ, bool) or raw_occ <= 0:
                raw_occ = getattr(sm, "last_occupied_time", None)
            since_time = (
                format_since_time(float(raw_occ))
                if isinstance(raw_occ, (int, float))
                and not isinstance(raw_occ, bool)
                and raw_occ > 0
                else None
            )
            rem = getattr(sm, "cooling_remaining_sec", 0)
            if (
                getattr(sm, "is_cooling_down", False) is True
                and isinstance(rem, (int, float))
                and rem > 0
            ):
                driver = f"Cooling ({rem}s)"
            elif getattr(sm, "last_trigger_entity", None):
                driver = str(sm.last_trigger_entity).split(".")[-1].replace("_", " ").title()
            elif getattr(sm, "active_conditions", None):
                driver = str(sm.active_conditions[0])
            else:
                driver = "Sensor Fusion"
            occupied.append(
                {
                    "entry_id": entry_id,
                    "name": name,
                    "since_time": since_time,
                    "driver": driver,
                    "override": override,
                    "has_cam": has_cam,
                }
            )
        else:
            clear.append(
                {"entry_id": entry_id, "name": name, "override": override, "has_cam": has_cam}
            )
    occupied.sort(key=lambda r: r["name"])
    clear.sort(key=lambda r: r["name"])
    return occupied, clear


def _recent_perimeter_lines(hass: Any, limit: int = 5) -> list[str]:
    from .house_perimeter import get_house_perimeter_tracker
    from .slack_blocks import format_since_time

    try:
        history = list(get_house_perimeter_tracker(hass).state.history)[-limit:]
    except Exception:  # noqa: BLE001
        return []
    lines: list[str] = []
    for rec in reversed(history):
        ts_str = format_since_time(getattr(rec, "closed_ts", None)) or "recent"
        door = str(getattr(rec, "entity_id", "")).split(".")[-1]
        room = str(getattr(rec, "room_name", ""))
        vec = str(getattr(rec, "vector", ""))
        icon = "🟢" if vec == "ingress" else ("🚪" if vec == "egress" else "⚪")
        details = str(getattr(rec, "details", "") or "")[:70]
        lines.append(f"{icon} `{ts_str}` *{room}* (`{door}`) → `{vec}` — {details}")
    return lines


def _house_summary_line(hass: Any, occupied_count: int, clear_count: int) -> str:
    from .house_perimeter import get_house_perimeter_tracker

    store = (
        hass.data.get(DOMAIN, {}).get(DATA_STORE)
        if isinstance(getattr(hass, "data", None), dict)
        else None
    )
    gs = (getattr(store, "global_settings", None) or {}) if store else {}
    guest = bool(gs.get("guest_mode_enabled", False))
    try:
        mode = str(get_house_perimeter_tracker(hass).state.mode or "occupied").lower()
    except Exception:  # noqa: BLE001
        mode = str(gs.get("house_occupancy_mode") or "occupied").lower()

    if mode == "pet_only":
        return f"🐾 *Pet Only* · {occupied_count} occupied · {clear_count} clear"
    if mode == "vacant" and occupied_count > 0:
        return f"⚠️ *Vacant* · *{occupied_count} rooms active* · {clear_count} clear"
    if mode == "vacant":
        return f"⚪ *Vacant* · All {clear_count} rooms clear"
    if mode == "guest" or guest:
        return f"👥 *Guest Mode* · {occupied_count} occupied · {clear_count} clear"
    return f"👤 *Occupied* · {occupied_count} occupied · {clear_count} clear"


def build_manage_modal_view(hass: Any) -> dict[str, Any]:
    """Build the interactive Slack Presence Control Center modal view."""
    from .house_perimeter import get_house_perimeter_tracker

    occupied, clear = collect_detailed_rooms(hass)
    store = (
        hass.data.get(DOMAIN, {}).get(DATA_STORE)
        if isinstance(getattr(hass, "data", None), dict)
        else None
    )
    gs = (getattr(store, "global_settings", None) or {}) if store else {}
    try:
        cur_mode = str(get_house_perimeter_tracker(hass).state.mode or "occupied").lower()
    except Exception:  # noqa: BLE001
        cur_mode = str(gs.get("house_occupancy_mode") or "occupied").lower()

    mode_opts = [
        {"text": _pt("⚪ Vacant"), "value": "vacant"},
        {"text": _pt("🐾 Pet Only"), "value": "pet_only"},
        {"text": _pt("👤 Occupied"), "value": "occupied"},
        {"text": _pt("👥 Guest Mode"), "value": "guest"},
    ]
    init_mode = next((o for o in mode_opts if o["value"] == cur_mode), mode_opts[2])

    toggle_defs = [
        ("guest_mode_enabled", "🧑‍🤝‍🧑 Guest Mode (pause handoff & negative-space auto-clear)"),
        ("slack_notify_transitions", "🧵 Log individual room transitions in daily thread"),
        ("notifications_enabled", "🔔 Slack notifications enabled"),
        ("include_camera_snapshot", "📸 Upload camera snapshots on alerts (files:write)"),
    ]
    toggle_opts = [{"text": _pt(label), "value": key} for key, label in toggle_defs]
    init_toggles = [
        opt
        for opt in toggle_opts
        if bool(gs.get(opt["value"], opt["value"] == "notifications_enabled"))
    ]
    toggles_el: dict[str, Any] = {
        "type": "checkboxes",
        "action_id": "inp_toggles",
        "options": toggle_opts,
    }
    if init_toggles:
        toggles_el["initial_options"] = init_toggles

    blocks: list[dict[str, Any]] = [
        {"type": "section", "text": _mrkdwn(_house_summary_line(hass, len(occupied), len(clear)))},
        {
            "type": "input",
            "block_id": "blk_headcount",
            "label": _pt("House Presence Mode"),
            "element": {
                "type": "static_select",
                "action_id": "inp_headcount",
                "options": mode_opts,
                "initial_option": init_mode,
            },
        },
        {
            "type": "input",
            "block_id": "blk_toggles",
            "optional": True,
            "label": _pt("Modes & Notification Options"),
            "element": toggles_el,
        },
    ]

    if occupied:
        occ_opts = [
            {
                "text": _pt(
                    f"{r['name']} ({'since ' + r['since_time'] if r['since_time'] else r['driver']})"
                ),
                "value": r["entry_id"],
            }
            for r in occupied[:100]
        ]
        blocks.append(
            {
                "type": "input",
                "block_id": "blk_clear_rooms",
                "optional": True,
                "label": _pt("Force-Clear Specific Occupied Rooms"),
                "element": {
                    "type": "multi_static_select",
                    "action_id": "inp_clear_rooms",
                    "placeholder": _pt("Select occupied rooms to clear..."),
                    "options": occ_opts,
                },
            }
        )
    else:
        blocks.append(
            {"type": "context", "elements": [_mrkdwn("_⚪ All rooms are currently clear._")]}
        )

    all_rooms = sorted(occupied + clear, key=lambda r: r["name"])
    if all_rooms:
        cam_opts = [
            {"text": _pt(f"{'🟢' if r in occupied else '⚪'} {r['name']}"), "value": r["entry_id"]}
            for r in all_rooms[:100]
        ]
        blocks.append(
            {
                "type": "input",
                "block_id": "blk_verify_rooms",
                "optional": True,
                "label": _pt("Run Verification / Refresh on Rooms"),
                "element": {
                    "type": "multi_static_select",
                    "action_id": "inp_verify_rooms",
                    "placeholder": _pt("Select rooms to verify now..."),
                    "options": cam_opts,
                },
            }
        )

    perim_lines = _recent_perimeter_lines(hass, limit=4)
    if perim_lines:
        blocks.append({"type": "divider"})
        blocks.append(
            {
                "type": "section",
                "text": _mrkdwn("*Recent Perimeter Door Activity:*\n" + "\n".join(perim_lines)),
            }
        )

    return {
        "type": "modal",
        "callback_id": SLACK_MODAL_CALLBACK_MANAGE,
        "title": _pt("Presence Control"),
        "submit": _pt("Apply"),
        "close": _pt("Cancel"),
        "blocks": blocks[:100],
    }


def build_app_home_view(hass: Any) -> dict[str, Any]:
    """Build the persistent Slack App Home dashboard view (published via views.publish)."""
    from .house_perimeter import get_house_perimeter_tracker
    from .slack_blocks import now_local

    occupied, clear = collect_detailed_rooms(hass)
    try:
        headcount = int(get_house_perimeter_tracker(hass).state.count)
    except Exception:  # noqa: BLE001
        headcount = 0

    now_str = now_local().strftime("%I:%M %p").lstrip("0") or "12:00 AM"
    blocks: list[dict[str, Any]] = [
        {"type": "header", "text": _pt("🏠 Home Presence Control Center")},
        {
            "type": "section",
            "text": _mrkdwn(
                f"{_house_summary_line(hass, len(occupied), len(clear))}\n_Updated {now_str}_"
            ),
            "accessory": build_refresh_button(),
        },
        build_vacancy_actions_block(highlight_set_home=(headcount == 0 and len(occupied) > 0)),
        {"type": "divider"},
        {"type": "section", "text": _mrkdwn(f"*Currently Occupied ({len(occupied)}):*")},
    ]

    if occupied:
        for r in occupied[:20]:
            since_txt = f" _(since {r['since_time']})_" if r.get("since_time") else ""
            ovr_txt = " · 🔒 *Override*" if r.get("override") else ""
            drv_txt = f" via `{r['driver']}`" if r.get("driver") else ""
            menu_opts = [
                {"text": _pt("🧹 Clear Room"), "value": f"clear|{r['entry_id']}"},
                {"text": _pt("👁️ Verify Camera"), "value": f"verify|{r['entry_id']}"},
                {
                    "text": _pt(
                        "🔓 Disable Override" if r.get("override") else "🔒 Enable Override"
                    ),
                    "value": f"override|{r['entry_id']}",
                },
            ]
            blocks.append(
                {
                    "type": "section",
                    "text": _mrkdwn(f"🟢 *{r['name']}*{since_txt}{drv_txt}{ovr_txt}"),
                    "accessory": {
                        "type": "overflow",
                        "action_id": SLACK_ACTION_HOME_ROOM_MENU,
                        "options": menu_opts,
                    },
                }
            )
    else:
        blocks.append({"type": "context", "elements": [_mrkdwn("_⚪ All rooms currently clear._")]})

    clear_names = ", ".join(r["name"] for r in clear[:30]) if clear else "_None_"
    blocks.extend(
        [
            {"type": "divider"},
            {"type": "section", "text": _mrkdwn(f"*Cleared ({len(clear)}):*\n{clear_names}")},
        ]
    )

    perim_lines = _recent_perimeter_lines(hass, limit=5)
    if perim_lines:
        blocks.append(
            {
                "type": "section",
                "text": _mrkdwn("*Recent Perimeter Doors:*\n" + "\n".join(perim_lines)),
            }
        )

    return {"type": "home", "blocks": blocks[:100]}


def parse_manage_modal_submission(view_state: dict[str, Any]) -> dict[str, Any]:
    """Extract house mode, global toggles, rooms to clear, and rooms to verify from Slack view state."""
    values = view_state.get("values") if isinstance(view_state, dict) else {}
    if not isinstance(values, dict):
        values = {}

    mode: str | None = None
    headcount: int | None = None
    hc_sel = ((values.get("blk_headcount") or {}).get("inp_headcount") or {}).get("selected_option")
    if isinstance(hc_sel, dict) and hc_sel.get("value") is not None:
        raw_val = str(hc_sel["value"]).strip().lower()
        if raw_val in ("vacant", "pet_only", "occupied", "guest"):
            mode = raw_val
            headcount = 0 if mode in ("vacant", "pet_only") else (2 if mode == "guest" else 1)
        else:
            try:
                num = int(raw_val)
                mode = "vacant" if num <= 0 else ("guest" if num >= 2 else "occupied")
                headcount = 0 if num <= 0 else (2 if num >= 2 else 1)
            except (TypeError, ValueError):
                mode = None

    selected_toggles = {
        str(opt.get("value"))
        for opt in (
            ((values.get("blk_toggles") or {}).get("inp_toggles") or {}).get("selected_options")
            or []
        )
        if isinstance(opt, dict) and opt.get("value")
    }
    toggles = {
        "guest_mode_enabled": "guest_mode_enabled" in selected_toggles,
        "slack_notify_transitions": "slack_notify_transitions" in selected_toggles,
        "notifications_enabled": "notifications_enabled" in selected_toggles,
        "include_camera_snapshot": "include_camera_snapshot" in selected_toggles,
    }

    clear_ids = [
        str(opt.get("value"))
        for opt in (
            ((values.get("blk_clear_rooms") or {}).get("inp_clear_rooms") or {}).get(
                "selected_options"
            )
            or []
        )
        if isinstance(opt, dict) and opt.get("value")
    ]
    verify_ids = [
        str(opt.get("value"))
        for opt in (
            ((values.get("blk_verify_rooms") or {}).get("inp_verify_rooms") or {}).get(
                "selected_options"
            )
            or []
        )
        if isinstance(opt, dict) and opt.get("value")
    ]
    return {
        "mode": mode,
        "headcount": headcount,
        "toggles": toggles,
        "clear_room_ids": clear_ids,
        "verify_room_ids": verify_ids,
    }


def parse_slash_command_text(raw_text: str) -> tuple[str, str]:
    """Parse `/presence <subcommand> [arg]` into normalized `(verb, arg)`."""
    tokens = str(raw_text or "").strip().split(None, 1)
    if not tokens:
        return "status", ""
    return tokens[0].lower(), (tokens[1].strip() if len(tokens) > 1 else "")


def build_ephemeral_status_response(hass: Any, *, note: str | None = None) -> dict[str, Any]:
    """Build an ephemeral Slack message with live status and interactive controls."""
    from .house_perimeter import get_house_perimeter_tracker

    occupied, clear = collect_detailed_rooms(hass)
    try:
        mode = str(get_house_perimeter_tracker(hass).state.mode or "occupied").lower()
    except Exception:  # noqa: BLE001
        mode = "occupied"

    lines = [note] if note else []
    lines.append(_house_summary_line(hass, len(occupied), len(clear)))
    if occupied:
        occ_bits = [
            f"• *{r['name']}*" + (f" _(since {r['since_time']})_" if r.get("since_time") else "")
            for r in occupied[:12]
        ]
        lines.append("*Occupied:*\n" + "\n".join(occ_bits))
    else:
        lines.append("_All rooms currently clear._")

    return {
        "response_type": "ephemeral",
        "text": lines[0],
        "blocks": [
            {
                "type": "section",
                "text": _mrkdwn("\n".join(lines)),
                "accessory": build_refresh_button(),
            },
            build_vacancy_actions_block(
                highlight_set_home=(mode in ("vacant", "pet_only") and len(occupied) > 0)
            ),
        ],
    }


def build_slash_help_response() -> dict[str, Any]:
    """Build an ephemeral usage guide for `/presence` slash commands."""
    help_text = (
        "*Presence Designer Slash Commands (`/presence`):*\n"
        "• `/presence` or `/presence status` — Private live status card with quick controls\n"
        "• `/presence manage` — Open the interactive Control Center modal\n"
        "• `/presence vacant` — Set house mode to `Vacant`\n"
        "• `/presence pet` — Set house mode to `Pet Only`\n"
        "• `/presence occupied` (or `/presence home`) — Set house mode to `Occupied`\n"
        "• `/presence clear [room]` — Clear one room (e.g. `Office`) or all rooms + vacant\n"
        "• `/presence guest [on|off]` — Toggle or set `Guest Mode`\n"
        "• `/presence verify <room>` — Run verification & upload camera snapshot\n"
        "• `/presence snapshot <room>` — Upload a live camera JPEG into this channel"
    )
    return {
        "response_type": "ephemeral",
        "text": help_text,
        "blocks": [{"type": "section", "text": _mrkdwn(help_text)}],
    }


def find_room_entry_id(hass: Any, query: str) -> str | None:
    """Resolve an entry_id or case-insensitive room name substring to an entry_id."""
    q = str(query or "").strip()
    if not q or not hass or not isinstance(getattr(hass, "data", None), dict):
        return None
    dom_data = hass.data.get(DOMAIN, {})
    if q in dom_data and hasattr(dom_data[q], "state_machine"):
        return q
    q_low = q.lower()
    partial: str | None = None
    for key, coord in list(dom_data.items()):
        if not hasattr(coord, "room_name") or not hasattr(coord, "state_machine"):
            continue
        eid = str(getattr(coord, "entry_id", None) or key)
        rname = str(coord.room_name).strip().lower()
        if rname == q_low:
            return eid
        if q_low in rname and partial is None:
            partial = eid
    return partial
