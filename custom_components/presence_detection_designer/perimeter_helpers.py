"""Perimeter vectoring, conservation law, and corroboration helpers."""

from __future__ import annotations

import inspect
import logging
import time
from typing import Any

_LOGGER = logging.getLogger(__name__)


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
) -> tuple[str, float, str]:
    """Directionally vector door transit into ingress vs egress based on sensor timings."""
    from .trajectory_validator import get_all_room_coordinators

    coords = {getattr(c, "room_name", ""): c for c in get_all_room_coordinators(tracker.hass)}
    host_coord = coords.get(host_room)

    # Check if interior room motion occurred BEFORE door opened
    interior_motion_before = False
    if host_coord and hasattr(host_coord, "state_machine"):
        sm = host_coord.state_machine
        if getattr(host_coord, "_active_triggers", None) or sm.snapshot.active_triggers:
            interior_motion_before = True
        elif sm.last_occupied_time and (opened_ts - sm.last_occupied_time) < 30.0:
            interior_motion_before = True

    # Check other occupied interior rooms
    other_occupied = [
        r
        for r, c in coords.items()
        if r != host_room and getattr(c, "state_machine", None) and c.state_machine.is_present
    ]

    # Case 1: The house is genuinely vacant -> any perimeter cycle is an arrival.
    if tracker.state.count <= 0:
        if not interior_motion_before:
            return "ingress", 0.95, "Arrival from vacant state"
        return vet_exit_vector(
            tracker,
            door_entity,
            host_room,
            opened_ts,
            0.60,
            f"Interior motion in {host_room} contradicts vacant count",
        )

    # Case 2: Interior motion in the host room before the door opened -> egress.
    if interior_motion_before:
        return vet_exit_vector(
            tracker,
            door_entity,
            host_room,
            opened_ts,
            0.85,
            f"Occupant in {host_room} exited through perimeter",
        )

    # Case 3: No prior interior motion. An arrival is only plausible while the
    # head count does not already exceed the rooms we can physically observe.
    observed_rooms = len(other_occupied)
    if host_coord and getattr(host_coord, "state_machine", None):
        if host_coord.state_machine.is_present:
            observed_rooms += 1
    if observed_rooms > 0 and tracker.state.count <= observed_rooms:
        return "ingress", 0.80, f"Arrival while {', '.join(other_occupied)} occupied"

    if other_occupied:
        return (
            "ambiguous",
            0.40,
            f"Door cycled while headcount ({tracker.state.count}) exceeds observed rooms",
        )

    return "ambiguous", 0.50, f"Door cycled on {host_room} with neutral priors"


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
    """No-op under GUARD-03: whole-house headcount is decoupled from room state machines."""
    _LOGGER.debug(
        "Headcount conservation law skipped (GUARD-03 decoupled; newly_occupied_room=%s, count=%s)",
        newly_occupied_room,
        getattr(getattr(tracker, "state", None), "count", None),
    )
    return []


def persist_and_notify_headcount(
    tracker: Any,
    *,
    persist: bool = True,
    notify_digest: bool = True,
    force_digest: bool = False,
) -> None:
    """Persist updated headcount to global_settings and schedule a Slack digest refresh."""
    hass = getattr(tracker, "hass", None)
    if not hass or not isinstance(getattr(hass, "data", None), dict):
        return
    from .const import DATA_STORE, DOMAIN
    from .slack_blocks import schedule_coro_safely, schedule_slack_daily_digest_update

    if persist:
        store = hass.data.get(DOMAIN, {}).get(DATA_STORE)
        gs = getattr(store, "global_settings", None) if store else None
        if isinstance(gs, dict) and gs.get("house_occupant_count") != tracker.state.count:
            gs["house_occupant_count"] = tracker.state.count
            updater = getattr(store, "async_update_global_settings", None)
            if callable(updater):
                res = updater({"house_occupant_count": tracker.state.count})
                if inspect.isawaitable(res):
                    schedule_coro_safely(hass, res)

    if notify_digest:
        schedule_slack_daily_digest_update(hass, force=force_digest)


async def async_apply_global_settings_side_effects(
    hass: Any, body: dict[str, Any], updated_gs: dict[str, Any]
) -> None:
    """Sync runtime perimeter tracking and Slack daily card after global settings changes."""
    from .house_perimeter import get_house_perimeter_tracker
    from .slack_blocks import async_refresh_slack_daily_digest

    tracker = get_house_perimeter_tracker(hass)
    if "house_occupant_count" in body and body["house_occupant_count"] is not None:
        tracker.set_headcount(
            int(updated_gs.get("house_occupant_count", 0)),
            persist=False,
            notify_digest=False,
        )
    if any(k in body for k in ("perimeter_doors", "exit_corroborators")):
        await tracker.async_setup()
    digest_keys = (
        "house_occupant_count",
        "slack_notify_transitions",
        "slack_channel",
        "slack_daily_thread",
        "notifications_enabled",
        "slack_verbosity",
    )
    if any(k in body for k in digest_keys):
        await async_refresh_slack_daily_digest(hass, force=True)


async def async_setup_perimeter_tracking(tracker: Any) -> None:
    """Subscribe to state changes on configured perimeter doors and exterior corroborators."""
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
