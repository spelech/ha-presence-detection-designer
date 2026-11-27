"""Whole-house occupancy headcount reconciliation and vacancy reset logic."""

from __future__ import annotations

import logging
import time
from typing import Any

_LOGGER = logging.getLogger(__name__)


def reconcile_tracker_headcount(
    tracker: Any,
    now_ts: float | None = None,
    occupied_room_names: list[str] | None = None,
    force: bool = False,
) -> bool:
    """Reconcile house occupancy mode on missed exits or pet presence updates."""
    from .perimeter_helpers import active_ble_resident_count, has_active_pet_presence

    now = now_ts if now_ts is not None else time.time()
    tracker.check_pending_exit_corroborations(now_ts=now)
    if not force and (now - tracker._last_reconcile_ts) < 60.0:
        return False
    tracker._last_reconcile_ts = now

    changed = False
    old_mode, old_count = tracker.state.mode, tracker.state.count
    if occupied_room_names is None:
        from ..engine.coordinator_helpers import get_all_room_coordinators

        occupied_room_names = [
            c.room_name
            for c in get_all_room_coordinators(tracker.hass)
            if getattr(c, "state_machine", None) and c.state_machine.is_present
        ]

    ble_active = active_ble_resident_count(tracker)
    if tracker.state.count > 0 and not occupied_room_names and ble_active == 0:
        recent_ambiguous_exit = (
            tracker.state.mode == "occupied"
            and not tracker._is_guest_mode_enabled()
            and tracker.state.last_event_type == "ambiguous"
            and tracker.state.last_event_ts > 0.0
            and 0.0 <= (now - tracker.state.last_event_ts) <= 600.0
        )
        effective_timeout = (
            min(tracker._stale_count_timeout(), 60.0)
            if recent_ambiguous_exit
            else tracker._stale_count_timeout()
        )
        if tracker._all_clear_since is None:
            tracker._all_clear_since = now
        elif now - tracker._all_clear_since >= effective_timeout:
            _LOGGER.info(
                "House Perimeter: all rooms clear for %.0fs; resetting mode %s -> vacant/pet_only",
                now - tracker._all_clear_since,
                tracker.state.mode,
            )
            tracker.state.count = 0
            if tracker.state.mode == "pet_only":
                tracker.state.mode = "vacant"
            changed = True
    else:
        tracker._all_clear_since = None

    if tracker.state.count <= 0:
        tracker.state.count = 0
        if tracker.state.mode != "pet_only" and has_active_pet_presence(tracker):
            tracker.state.mode = "pet_only"
            changed = True
        elif tracker.state.mode not in ("vacant", "pet_only"):
            tracker.state.mode = "vacant"
            changed = True
    elif tracker._is_guest_mode_enabled() or tracker.state.mode == "guest":
        tracker.state.mode = "guest"
        tracker.state.count = 2
    else:
        tracker.state.mode = "occupied"
        tracker.state.count = 1

    if tracker.state.mode != old_mode or tracker.state.count != old_count:
        changed = True

    if changed:
        tracker.enforce_conservation_law()
        tracker._notify_listeners()
        from .perimeter_helpers import persist_and_notify_headcount

        persist_and_notify_headcount(tracker, persist=True, force_digest=False)
    return changed
