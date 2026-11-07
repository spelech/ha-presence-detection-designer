"""Perimeter vectoring, conservation law, and corroboration helpers."""

from __future__ import annotations

import logging
import time
from typing import Any

from .const import DATA_STORE, DOMAIN

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
        if sm._active_triggers:
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


def resolve_pending_exit_corroborations(
    tracker: Any, now_ts: float | None = None
) -> list[Any]:
    """Check and resolve pending exit corroborations based on exterior motion or timeout."""
    from .house_perimeter import DoorTransitionRecord

    now = now_ts if now_ts is not None else time.time()
    resolved: list[DoorTransitionRecord] = []
    still_pending = []

    for p in tracker._pending_exit_corroborations:
        corroborator = tracker._find_active_corroborator(
            p["corroborators"], p["opened_ts"] - 15.0
        )
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


def enforce_conservation_law(
    tracker: Any, newly_occupied_room: str | None = None
) -> list[str]:
    """Enforce conservation law: total occupied rooms must not exceed house occupant count."""
    vacated_rooms: list[str] = []
    if not tracker.hass or not hasattr(tracker.hass, "data") or not isinstance(tracker.hass.data, dict):
        return vacated_rooms

    store = tracker.hass.data.get(DOMAIN, {}).get(DATA_STORE)
    if store is not None and hasattr(store, "global_settings"):
        gs = store.global_settings or {}
        if not gs.get("enable_conservation_law", True):
            return vacated_rooms

    from .trajectory_validator import get_all_room_coordinators

    coordinators = get_all_room_coordinators(tracker.hass)
    occupied = [c for c in coordinators if c.state_machine and c.state_machine.is_present]

    # Case 0: House is vacant -> all rooms must be clear
    if tracker.state.count == 0:
        for c in occupied:
            c.state_machine.force_clear()
            vacated_rooms.append(c.room_name)
            c.async_update_listeners()
        return vacated_rooms

    # Case 1: Single occupant -> at most 1 room occupied
    if tracker.state.count == 1 and len(occupied) > 1:
        target_keep = newly_occupied_room
        if not target_keep:
            target_keep = max(
                occupied,
                key=lambda c: getattr(c.state_machine, "last_occupied_time", 0.0),
            ).room_name

        for c in occupied:
            if c.room_name != target_keep:
                c.state_machine.force_clear()
                c._last_adjacent_arrival = (
                    f"Vacated by Conservation Law (single occupant in {target_keep})"
                )
                vacated_rooms.append(c.room_name)
                c.async_update_listeners()

    return vacated_rooms


async def async_setup_perimeter_tracking(tracker: Any) -> None:
    """Subscribe to state changes on configured exterior corroborators."""
    if not tracker.hass or not hasattr(tracker.hass, "bus"):
        return
    corroborators: set[str] = set()
    for sensors in tracker.get_configured_exit_corroborators().values():
        corroborators.update(sensors)
    if not corroborators:
        return

    try:
        from homeassistant.core import callback
        from homeassistant.helpers.event import async_track_state_change_event

        @callback
        def _handle_ext_change(event: Any) -> None:
            to_state = event.data.get("new_state")
            entity_id = event.data.get("entity_id")
            if not to_state or not entity_id:
                return
            is_active = to_state.state in ("on", "open", "active", "detected")
            tracker.handle_exterior_state_change(entity_id, is_active)

        unsub = async_track_state_change_event(
            tracker.hass,
            list(corroborators),
            _handle_ext_change,
        )
        tracker._unsub_trackers.append(unsub)
    except Exception as err:
        _LOGGER.debug("Could not track exterior events: %s", err)
