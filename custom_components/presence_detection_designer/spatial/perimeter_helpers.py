"""Perimeter vectoring, conservation law, and corroboration helpers."""

from __future__ import annotations

import inspect
import logging
import time
from typing import Any

from ..const import DOMAIN

_LOGGER = logging.getLogger(__name__)


def host_room_had_recent_activity(tracker: Any, host_room: str, now: float) -> bool:
    """Snapshot whether host_room already had interior motion/presence before door opened."""
    from ..engine.coordinator_helpers import get_all_room_coordinators

    for coord in get_all_room_coordinators(tracker.hass):
        if getattr(coord, "room_name", "") != host_room:
            continue
        sm = getattr(coord, "state_machine", None)
        if not sm:
            return False
        if getattr(coord, "_active_triggers", None) or getattr(
            getattr(sm, "snapshot", None), "active_triggers", None
        ):
            return True
        if getattr(sm, "is_present", False):
            return True
        last_occ = getattr(sm, "last_occupied_time", 0.0)
        if last_occ and 0.0 <= (now - last_occ) < 30.0:
            return True
    return False


def vet_exit_vector(
    tracker: Any,
    door_entity: str,
    host_room: str,
    opened_ts: float,
    confidence: float,
    details: str,
) -> tuple[str, float, str]:
    """Check if egress requires exterior corroboration before confirming."""
    corroborators = tracker.get_configured_exit_corroborators().get(door_entity)
    if not corroborators:
        return "egress", confidence, details

    active = tracker._find_active_corroborator(corroborators, opened_ts - 15.0)
    if active:
        return "egress", max(confidence, 0.90), f"{details} (corroborated by {active})"
    return "pending_egress", 0.50, f"Pending exterior corroboration on {', '.join(corroborators)}"


def infer_door_vector(
    tracker: Any,
    door_entity: str,
    host_room: str,
    opened_ts: float,
    closed_ts: float,
    had_motion_on_open: bool | None = None,
) -> tuple[str, float, str]:
    """Directionally vector door transit into ingress vs egress based on sensor timings."""
    from ..engine.coordinator_helpers import get_all_room_coordinators

    coords = {getattr(c, "room_name", ""): c for c in get_all_room_coordinators(tracker.hass)}
    host_coord = coords.get(host_room)

    # Use activity snapshot captured when the door opened when available so
    # arrival motion (e.g., pulling into the garage) is never mistaken for exit.
    if had_motion_on_open is not None:
        interior_motion_before = bool(had_motion_on_open)
    else:
        interior_motion_before = False
        if host_coord and hasattr(host_coord, "state_machine"):
            sm = host_coord.state_machine
            if getattr(host_coord, "_active_triggers", None) or sm.snapshot.active_triggers:
                interior_motion_before = True
            elif sm.last_occupied_time and 0.0 <= (opened_ts - sm.last_occupied_time) < 30.0:
                interior_motion_before = True

    from ..const import OccupancyState

    # Check other actively occupied interior rooms (exclude passive occupied_cooling
    # trailing cooldowns from the departing occupant walking toward the exit).
    other_occupied = [
        r
        for r, c in coords.items()
        if r != host_room
        and getattr(c, "state_machine", None)
        and c.state_machine.is_present
        and getattr(c.state_machine, "state", None)
        not in (OccupancyState.OCCUPIED_COOLING, str(OccupancyState.OCCUPIED_COOLING))
    ]
    guest_mode = bool(tracker._global_settings().get("guest_mode_enabled", False)) or (
        getattr(getattr(tracker, "state", None), "mode", "") == "guest"
    )

    # Case 1: House is vacant or pet_only -> arrival sets house to occupied (never egress at 0).
    if tracker.state.count <= 0:
        if not interior_motion_before:
            return "ingress", 0.95, "Arrival from vacant state"
        return (
            "ambiguous",
            0.40,
            f"Interior motion in {host_room} with vacant count; skipping egress",
        )

    # Case 2: Interior motion in host room before door opened -> only vacate when no other
    # interior rooms remain occupied and Guest Mode is not active (prevents dog let-outs or
    # single-person departures from marking the house vacant while others remain inside).
    if interior_motion_before:
        if other_occupied or guest_mode:
            active_ctx = ", ".join(other_occupied) if other_occupied else "Guest Mode"
            return (
                "ambiguous",
                0.45,
                f"Door cycled on {host_room} while {active_ctx} remains active",
            )
        return vet_exit_vector(
            tracker,
            door_entity,
            host_room,
            opened_ts,
            0.85,
            f"Occupant in {host_room} exited through perimeter",
        )

    # Case 3: House is already occupied -> door contact sensors do not increment integer headcount.
    return "ambiguous", 0.50, f"Door cycled on {host_room} while house already occupied"


def resolve_pending_exit_corroborations(tracker: Any, now_ts: float | None = None) -> list[Any]:
    """Check and resolve pending exit corroborations based on exterior motion or timeout."""
    from .house_perimeter import DoorTransitionRecord

    now = now_ts if now_ts is not None else time.time()
    resolved: list[DoorTransitionRecord] = []
    still_pending = []

    for p in tracker._pending_exit_corroborations:
        corroborator = tracker._find_active_corroborator(p["corroborators"], p["opened_ts"] - 15.0)
        if corroborator:
            record = DoorTransitionRecord(
                entity_id=p["door_entity"],
                room_name=p["room_name"],
                opened_ts=p["opened_ts"],
                closed_ts=p["closed_ts"],
                vector="egress",
                confidence=0.85,
                details=f"Exterior motion on {corroborator} corroborated exit",
            )
            tracker._apply_vector(record)
            resolved.append(record)
        elif now > p["deadline_ts"]:
            _LOGGER.info(
                "House Perimeter: exit corroboration window expired for %s without motion",
                p["door_entity"],
            )
            record = DoorTransitionRecord(
                entity_id=p["door_entity"],
                room_name=p["room_name"],
                opened_ts=p["opened_ts"],
                closed_ts=p["closed_ts"],
                vector="ambiguous",
                confidence=0.0,
                details="Exit uncorroborated by exterior motion before window expiry",
            )
            tracker.state.history.append(record)
            if len(tracker.state.history) > 20:
                tracker.state.history.pop(0)
            resolved.append(record)
        else:
            still_pending.append(p)

    tracker._pending_exit_corroborations = still_pending
    return resolved


def enforce_conservation_law(tracker: Any, newly_occupied_room: str | None = None) -> list[str]:
    """No-op under GUARD-03: whole-house state is decoupled from room state machines."""
    _LOGGER.debug(
        "Headcount conservation law skipped (GUARD-03 decoupled; newly_occupied_room=%s, mode=%s)",
        newly_occupied_room,
        getattr(getattr(tracker, "state", None), "mode", None),
    )
    return []


def has_active_pet_presence(tracker: Any) -> bool:
    """Return True if any room coordinator or Frigate dog sensor currently detects a pet."""
    hass = getattr(tracker, "hass", None)
    if not hass:
        return False
    from ..engine.coordinator_helpers import get_all_room_coordinators
    from .spatial_catalog import ROOM_DOG_OCCUPANCY_ENTITIES

    for coord in get_all_room_coordinators(hass):
        sm = getattr(coord, "state_machine", None)
        snap = getattr(sm, "snapshot", None) if sm is not None else None
        if snap is not None and bool(getattr(snap, "pet_present", False)):
            return True
        sp = getattr(coord, "last_spatial_estimate", None)
        if isinstance(sp, dict) and bool(sp.get("pet_present", False)):
            return True

    states_obj = getattr(hass, "states", None)
    if states_obj is not None and callable(getattr(states_obj, "get", None)):
        for dog_eids in ROOM_DOG_OCCUPANCY_ENTITIES.values():
            for dog_eid in dog_eids:
                st = states_obj.get(dog_eid)
                if st is not None and str(getattr(st, "state", "")).strip().lower() == "on":
                    return True
    return False


def schedule_coro_safely(hass: Any, coro: Any) -> None:
    """Schedule an awaitable onto HA's event loop without leaking unawaited mock coroutines."""
    if not hass or not hasattr(hass, "async_create_task"):
        if hasattr(coro, "close"):
            coro.close()
        return
    act = hass.async_create_task
    if type(act).__name__ == "MagicMock" and getattr(act, "side_effect", None) is None:
        act(coro)
        if hasattr(coro, "close"):
            coro.close()
        return
    loop = getattr(hass, "loop", None)
    try:
        import asyncio

        running = asyncio.get_running_loop()
    except RuntimeError:
        running = None
    if (
        loop is not None
        and type(loop).__name__ != "MagicMock"
        and callable(getattr(loop, "is_running", None))
        and loop.is_running()
        and loop is not running
        and callable(getattr(loop, "call_soon_threadsafe", None))
    ):
        loop.call_soon_threadsafe(act, coro)
    else:
        act(coro)


def persist_and_notify_headcount(
    tracker: Any,
    *,
    persist: bool = True,
    notify_digest: bool = False,
    force_digest: bool = False,
    sync_guest_flag: bool = False,
) -> None:
    """Persist updated house occupancy state to global_settings."""
    hass = getattr(tracker, "hass", None)
    if not hass or not isinstance(getattr(hass, "data", None), dict):
        return
    from ..const import DATA_STORE, DOMAIN

    if persist:
        store = hass.data.get(DOMAIN, {}).get(DATA_STORE)
        gs = getattr(store, "global_settings", None) if store else None
        if isinstance(gs, dict):
            updates: dict[str, Any] = {}
            if gs.get("house_occupant_count") != tracker.state.count:
                updates["house_occupant_count"] = tracker.state.count
            if gs.get("house_occupancy_mode") != tracker.state.mode:
                updates["house_occupancy_mode"] = tracker.state.mode
            if sync_guest_flag:
                want_guest = tracker.state.mode == "guest"
                if bool(gs.get("guest_mode_enabled", False)) != want_guest:
                    updates["guest_mode_enabled"] = want_guest
            if updates:
                gs.update(updates)
                updater = getattr(store, "async_update_global_settings", None)
                if callable(updater):
                    res = updater(updates)
                    if inspect.isawaitable(res):
                        schedule_coro_safely(hass, res)


async def async_reset_house_vacancy(hass: Any, *, clear_rooms: bool = False) -> None:
    """Reset house occupancy mode to vacant (0) and optionally force-clear all occupied rooms."""
    from ..const import DOMAIN
    from ..engine.coordinator import RoomPresenceCoordinator
    from ..store import async_get_store
    from .house_perimeter import get_house_perimeter_tracker

    tracker = get_house_perimeter_tracker(hass)
    tracker.set_house_mode("vacant", persist=False, notify_digest=False)
    store = await async_get_store(hass)
    await store.async_update_global_settings(
        {
            "house_occupancy_mode": "vacant",
            "house_occupant_count": 0,
            "guest_mode_enabled": False,
        }
    )
    if clear_rooms and hass and isinstance(getattr(hass, "data", None), dict):
        for coord in hass.data.get(DOMAIN, {}).values():
            if isinstance(coord, RoomPresenceCoordinator):
                if (
                    getattr(coord, "state_machine", None) is not None
                    and coord.state_machine.is_present
                ):
                    coord.state_machine.force_clear(reason="House vacancy reset")
                    coord.async_update_listeners()


async def async_apply_global_settings_side_effects(
    hass: Any, body: dict[str, Any], updated_gs: dict[str, Any]
) -> None:
    """Sync runtime perimeter tracking after global settings changes."""
    from .house_perimeter import get_house_perimeter_tracker

    tracker = get_house_perimeter_tracker(hass)
    if "house_occupancy_mode" in body and body["house_occupancy_mode"] is not None:
        tracker.set_house_mode(
            str(updated_gs.get("house_occupancy_mode", "occupied")),
            persist=False,
            notify_digest=False,
        )
    elif "house_occupant_count" in body and body["house_occupant_count"] is not None:
        tracker.set_headcount(
            int(updated_gs.get("house_occupant_count", 0)),
            persist=False,
            notify_digest=False,
        )
    elif "guest_mode_enabled" in body and body["guest_mode_enabled"] is not None:
        if bool(updated_gs.get("guest_mode_enabled", False)):
            tracker.set_house_mode("guest", persist=False, notify_digest=False)
        elif tracker.state.mode == "guest":
            tracker.set_house_mode("occupied", persist=False, notify_digest=False)
    if any(k in body for k in ("perimeter_doors", "exit_corroborators")):
        await tracker.async_setup()
    if "designer_ui_enabled" in body:
        from .. import _async_ensure_panel_and_views

        await _async_ensure_panel_and_views(hass)


def active_ble_resident_count(tracker: Any) -> int:
    """Return number of tracked BLE resident devices actively detected in a room or home."""
    hass = getattr(tracker, "hass", None)
    domain_data = (getattr(hass, "data", None) or {}).get(DOMAIN, {}) if hass else {}
    store = domain_data.get("_store") if isinstance(domain_data, dict) else None
    ekf_mgr = getattr(store, "ekf_manager", None) if store is not None else None
    if ekf_mgr is not None and getattr(ekf_mgr, "trackers", None):
        ekf_active = sum(
            1 for ekf in ekf_mgr.trackers.values() if getattr(ekf, "initialized", False)
        )
        if ekf_active > 0:
            return ekf_active

    states_obj = getattr(hass, "states", None) if hass else None
    if states_obj is None or not callable(getattr(states_obj, "get", None)):
        return 0
    ble_hub = getattr(store, "ble_hub", None) if store is not None else None
    trackers = list(tracker._global_settings().get("ble_trackers") or [])
    if not trackers and ble_hub is not None:
        trackers = list(ble_hub.resolver.registered_tracker_ids)
    inactive = {"", "unknown", "unavailable", "off", "away", "not_home", "none"}
    count = 0
    for eid in trackers:
        resolved = ble_hub.resolver.resolve_alias(str(eid)) if ble_hub is not None else None
        st = states_obj.get(resolved or str(eid))
        raw = getattr(st, "state", None) if st is not None else None
        if isinstance(raw, str) and raw.strip().lower() not in inactive:
            count += 1
    return count


async def async_setup_perimeter_tracking(tracker: Any) -> None:
    """Subscribe to state changes on configured perimeter doors and exterior corroborators."""
    if getattr(getattr(tracker, "state", None), "last_event_ts", 0.0) == 0.0 and hasattr(
        tracker, "_load_initial_count"
    ):
        tracker._load_initial_count()
    for unsub in list(getattr(tracker, "_unsub_trackers", [])):
        if callable(unsub):
            try:
                unsub()
            except Exception:  # noqa: BLE001
                pass
    tracker._unsub_trackers.clear()

    if not tracker.hass or not hasattr(tracker.hass, "bus"):
        return

    perimeter_doors = sorted(tracker.get_configured_perimeter_doors().keys())
    corroborators: set[str] = set()
    for sensors in tracker.get_configured_exit_corroborators().values():
        corroborators.update(sensors)

    states_obj = getattr(tracker.hass, "states", None)
    if states_obj is not None and callable(getattr(states_obj, "get", None)):
        for door_eid in perimeter_doors:
            st = states_obj.get(door_eid)
            state_val = getattr(st, "state", None) if st is not None else None
            if isinstance(state_val, str) and state_val not in ("unknown", "unavailable"):
                tracker._door_is_open[door_eid] = state_val in ("on", "open", "opening")

    if not perimeter_doors and not corroborators:
        return

    try:
        from homeassistant.core import callback
        from homeassistant.helpers.event import async_track_state_change_event

        if type(callback).__name__ == "MagicMock":

            def callback(fn: Any) -> Any:  # type: ignore[no-redef]
                return fn

        if perimeter_doors:

            @callback
            def _handle_door_change(event: Any) -> None:
                to_state = event.data.get("new_state")
                entity_id = event.data.get("entity_id")
                if not to_state or not entity_id:
                    return
                state_val = getattr(to_state, "state", None)
                if state_val in (None, "unknown", "unavailable"):
                    return
                is_open = state_val in ("on", "open", "opening")
                tracker.handle_door_state_change(entity_id, is_open)

            tracker._unsub_trackers.append(
                async_track_state_change_event(tracker.hass, perimeter_doors, _handle_door_change)
            )

        if corroborators:

            @callback
            def _handle_ext_change(event: Any) -> None:
                to_state = event.data.get("new_state")
                entity_id = event.data.get("entity_id")
                if not to_state or not entity_id:
                    return
                state_val = getattr(to_state, "state", None)
                if state_val in (None, "unknown", "unavailable"):
                    return
                is_active = state_val in ("on", "open", "active", "detected")
                tracker.handle_exterior_state_change(entity_id, is_active)

            tracker._unsub_trackers.append(
                async_track_state_change_event(
                    tracker.hass, sorted(corroborators), _handle_ext_change
                )
            )
    except Exception as err:
        _LOGGER.debug("Could not track perimeter events: %s", err)
