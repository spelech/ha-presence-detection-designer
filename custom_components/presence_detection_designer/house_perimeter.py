"""House Perimeter, Door Vectoring, and Head Counter for Presence Detection Designer.

Tracks perimeter boundary ingress/egress sequences across exterior contact sensors,
directionally infers entries vs exits, maintains total house occupant headcount,
and enforces the Occupant Conservation Law across room wasp boxes.
"""

from __future__ import annotations

import logging
import time
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

from .const import (
    DATA_STORE,
    DEFAULT_DOOR_DUPLICATE_WINDOW,
    DEFAULT_INTERIOR_DOORS,
    DEFAULT_MAX_OCCUPANTS,
    DEFAULT_PERIMETER_DOORS,
    DEFAULT_STALE_COUNT_TIMEOUT,
    DOMAIN,
)

_LOGGER = logging.getLogger(__name__)

ENTRY_TRANSIT_WINDOW_SEC = 45.0


@dataclass
class DoorTransitionRecord:
    """Record of a recent perimeter door cycle."""

    entity_id: str
    room_name: str
    opened_ts: float
    closed_ts: float
    vector: str  # "ingress", "egress", "ambiguous"
    confidence: float
    details: str = ""


@dataclass
class HouseOccupancyState:
    """Current state of whole-house occupancy and head count."""

    count: int = 1
    mode: str = "single_occupant"  # "vacant", "single_occupant", "multi_occupant"
    last_event_ts: float = 0.0
    last_event_door: str | None = None
    last_event_type: str | None = None
    history: list[DoorTransitionRecord] = field(default_factory=list)


class HousePerimeterTracker:
    """Manages house perimeter door events, vectoring, and headcount."""

    def __init__(self, hass: Any) -> None:
        self.hass = hass
        self._listeners: list[Callable[[], None]] = []
        self._door_opened_ts: dict[str, float] = {}
        self._door_is_open: dict[str, bool] = {}
        # Last counted vector per door, used to suppress duplicate transits.
        self._last_vector_by_door: dict[str, str] = {}
        self._last_vector_ts_by_door: dict[str, float] = {}
        # Timestamp when every room was last observed clear (for stale-count reset).
        self._all_clear_since: float | None = None
        self._last_reconcile_ts: float = 0.0
        self.state = HouseOccupancyState()
        self._load_initial_count()

    def _global_settings(self) -> dict[str, Any]:
        """Return the current integration global settings, or an empty dict."""
        if not self.hass or not hasattr(self.hass, "data") or not isinstance(self.hass.data, dict):
            return {}
        store = self.hass.data.get(DOMAIN, {}).get(DATA_STORE)
        if store is None or not hasattr(store, "global_settings"):
            return {}
        settings = store.global_settings
        return settings if isinstance(settings, dict) else {}

    def _interior_doors(self) -> set[str]:
        """Return configured interior doors whose transits must not change headcount."""
        configured = self._global_settings().get("interior_doors", DEFAULT_INTERIOR_DOORS)
        if not isinstance(configured, (list, tuple, set)):
            configured = DEFAULT_INTERIOR_DOORS
        return {str(entity_id) for entity_id in configured}

    def _max_occupants(self) -> int:
        """Return the automatic headcount ceiling."""
        try:
            return max(0, int(self._global_settings().get("max_occupants", DEFAULT_MAX_OCCUPANTS)))
        except (TypeError, ValueError):
            return DEFAULT_MAX_OCCUPANTS

    def _stale_count_timeout(self) -> float:
        """Return seconds of whole-house vacancy required to reset a stale count."""
        try:
            return max(
                0.0,
                float(
                    self._global_settings().get("stale_count_timeout", DEFAULT_STALE_COUNT_TIMEOUT)
                ),
            )
        except (TypeError, ValueError):
            return float(DEFAULT_STALE_COUNT_TIMEOUT)

    def _door_duplicate_window(self) -> float:
        """Return seconds within which a repeated same-vector door transit is ignored."""
        try:
            return max(
                0.0,
                float(
                    self._global_settings().get(
                        "door_duplicate_window", DEFAULT_DOOR_DUPLICATE_WINDOW
                    )
                ),
            )
        except (TypeError, ValueError):
            return float(DEFAULT_DOOR_DUPLICATE_WINDOW)

    def _load_initial_count(self) -> None:
        """Load initial headcount from store global_settings if present."""
        if not self.hass or not hasattr(self.hass, "data") or not isinstance(self.hass.data, dict):
            return
        store = self.hass.data.get(DOMAIN, {}).get(DATA_STORE)
        if store is not None and hasattr(store, "global_settings"):
            gs = store.global_settings or {}
            self.state.count = max(0, int(gs.get("house_occupant_count", 1)))
            self._update_mode()

    def _update_mode(self) -> None:
        """Update occupancy mode string based on current head count."""
        if self.state.count <= 0:
            self.state.mode = "vacant"
        elif self.state.count == 1:
            self.state.mode = "single_occupant"
        else:
            self.state.mode = "multi_occupant"

    def async_add_listener(self, update_callback: Callable[[], None]) -> Callable[[], None]:
        """Register listener for headcount changes."""
        self._listeners.append(update_callback)

        def remove_listener() -> None:
            if update_callback in self._listeners:
                self._listeners.remove(update_callback)

        return remove_listener

    def _notify_listeners(self) -> None:
        """Notify registered sensor and entity listeners."""
        for cb in self._listeners:
            try:
                cb()
            except Exception as err:  # noqa: BLE001
                _LOGGER.error("Error in house perimeter listener: %s", err)

    def get_configured_perimeter_doors(self) -> dict[str, str]:
        """Return dict of configured perimeter doors (entity_id -> host_room)."""
        doors = dict(DEFAULT_PERIMETER_DOORS)
        if not self.hass or not hasattr(self.hass, "data") or not isinstance(self.hass.data, dict):
            return doors
        store = self.hass.data.get(DOMAIN, {}).get(DATA_STORE)
        if store is not None and hasattr(store, "global_settings"):
            gs = store.global_settings or {}
            custom = gs.get("perimeter_doors")
            if isinstance(custom, dict) and custom:
                doors.update(custom)
        return doors

    def handle_door_state_change(
        self,
        entity_id: str,
        is_open: bool,
        now_ts: float | None = None,
    ) -> DoorTransitionRecord | None:
        """Handle contact sensor open/close event on a perimeter boundary."""
        now = now_ts if now_ts is not None else time.time()
        configured_doors = self.get_configured_perimeter_doors()
        if entity_id not in configured_doors:
            return None

        # Interior doors (garage -> laundry, etc.) are tracked by the room state
        # machines but cannot change the whole-house occupant count. Counting
        # them as perimeter ingress is what previously inflated the count.
        if entity_id in self._interior_doors():
            _LOGGER.debug("House Perimeter: ignoring interior door %s", entity_id)
            return None

        host_room = configured_doors[entity_id]

        # Guard against duplicate/transitional events (covers emit opening/open,
        # closing/closed). Only a real closed->open or open->closed edge counts.
        was_open = self._door_is_open.get(entity_id, False)
        if is_open == was_open:
            return None
        self._door_is_open[entity_id] = is_open

        if is_open:
            self._door_opened_ts[entity_id] = now
            return None

        # Door just closed
        opened_at = self._door_opened_ts.pop(entity_id, None)
        if opened_at is None:
            opened_at = now - 5.0  # reasonable default if we missed open

        vector, confidence, details = self._infer_door_vector(entity_id, host_room, opened_at, now)
        if self._is_duplicate_vector(entity_id, vector, now):
            _LOGGER.debug("House Perimeter: suppressed duplicate %s on %s", vector, entity_id)
            vector = "ambiguous"
            confidence = 0.0
            details = "Duplicate same-direction transit suppressed"
        record = DoorTransitionRecord(
            entity_id=entity_id,
            room_name=host_room,
            opened_ts=opened_at,
            closed_ts=now,
            vector=vector,
            confidence=confidence,
            details=details,
        )

        self._apply_vector(record)
        return record

    def _infer_door_vector(
        self,
        door_entity: str,
        host_room: str,
        opened_ts: float,
        closed_ts: float,
    ) -> tuple[str, float, str]:
        """Directionally vector door transit into ingress vs egress based on sensor timings."""
        from .trajectory_validator import get_all_room_coordinators

        coords = {getattr(c, "room_name", ""): c for c in get_all_room_coordinators(self.hass)}
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
        if self.state.count <= 0:
            if not interior_motion_before:
                return "ingress", 0.95, "Arrival from vacant state"
            # Contradictory evidence: the count says vacant but someone just moved
            # inside the host room. Treat the door cycle as an exit rather than
            # inventing a second occupant.
            return "egress", 0.60, f"Interior motion in {host_room} contradicts vacant count"

        # Case 2: Interior motion in the host room before the door opened -> egress.
        # This remains valid even when other rooms are occupied.
        if interior_motion_before:
            return "egress", 0.85, f"Occupant in {host_room} exited through perimeter"

        # Case 3: No prior interior motion. An arrival is only plausible while the
        # head count does not already exceed the rooms we can physically observe.
        # This is the guard that stops a stuck door from inflating the count.
        observed_rooms = len(other_occupied)
        if host_coord and getattr(host_coord, "state_machine", None):
            if host_coord.state_machine.is_present:
                observed_rooms += 1
        if observed_rooms > 0 and self.state.count <= observed_rooms:
            return "ingress", 0.80, f"Arrival while {', '.join(other_occupied)} occupied"

        if other_occupied:
            return (
                "ambiguous",
                0.40,
                f"Door cycled while headcount ({self.state.count}) exceeds observed rooms",
            )

        return "ambiguous", 0.50, f"Door cycled on {host_room} with neutral priors"

    def _is_duplicate_vector(self, entity_id: str, vector: str, now: float) -> bool:
        """Return True for a repeated same-direction transit of the same door."""
        if vector not in ("ingress", "egress"):
            return False
        window = self._door_duplicate_window()
        if window <= 0:
            return False
        last_vector = self._last_vector_by_door.get(entity_id)
        last_ts = self._last_vector_ts_by_door.get(entity_id, 0.0)
        if last_vector == vector and (now - last_ts) <= window:
            return True
        return False

    def _apply_vector(self, record: DoorTransitionRecord) -> None:
        """Update headcount and mode based on vector transition."""
        old_count = self.state.count
        if record.vector == "ingress":
            self.state.count = min(self._max_occupants(), max(1, self.state.count + 1))
            self._last_vector_by_door[record.entity_id] = "ingress"
            self._last_vector_ts_by_door[record.entity_id] = record.closed_ts
        elif record.vector == "egress":
            self.state.count = max(0, self.state.count - 1)
            self._last_vector_by_door[record.entity_id] = "egress"
            self._last_vector_ts_by_door[record.entity_id] = record.closed_ts

        # A real perimeter cycle means the house is not necessarily all-clear;
        # reset the stale-count vacancy timer.
        if record.vector in ("ingress", "egress"):
            self._all_clear_since = None

        self.state.last_event_ts = record.closed_ts
        self.state.last_event_door = record.entity_id
        self.state.last_event_type = record.vector
        self.state.history.append(record)
        if len(self.state.history) > 20:
            self.state.history.pop(0)

        self._update_mode()
        _LOGGER.info(
            "House Perimeter: %s on %s (%s). Count %d -> %d (mode: %s)",
            record.vector,
            record.entity_id,
            record.room_name,
            old_count,
            self.state.count,
            self.state.mode,
        )

        # Enforce conservation law if count dropped to 0 or 1
        self.enforce_conservation_law()
        self._notify_listeners()

    def set_headcount(self, count: int) -> None:
        """Manually override the current house occupant count."""
        self.state.count = max(0, int(count))
        self._all_clear_since = None
        self._update_mode()
        self.enforce_conservation_law()
        self._notify_listeners()

    def reconcile_headcount(
        self,
        now_ts: float | None = None,
        occupied_room_names: list[str] | None = None,
        force: bool = False,
    ) -> bool:
        """Apply automatic head-count safety constraints and return True if changed.

        - Caps an automatically accumulated count at ``max_occupants``.
        - Resets a positive count to zero when every room has been clear for
          ``stale_count_timeout`` seconds (catches missed egress events).
        """
        now = now_ts if now_ts is not None else time.time()
        if not force and (now - self._last_reconcile_ts) < 60.0:
            return False
        self._last_reconcile_ts = now

        changed = False
        cap = self._max_occupants()
        if self.state.count > cap:
            _LOGGER.info(
                "House Perimeter: clamping stale headcount %d -> %d (max_occupants)",
                self.state.count,
                cap,
            )
            self.state.count = cap
            changed = True

        if occupied_room_names is None:
            from .trajectory_validator import get_all_room_coordinators

            occupied_room_names = [
                c.room_name
                for c in get_all_room_coordinators(self.hass)
                if getattr(c, "state_machine", None) and c.state_machine.is_present
            ]

        if self.state.count > 0 and not occupied_room_names:
            if self._all_clear_since is None:
                self._all_clear_since = now
            elif now - self._all_clear_since >= self._stale_count_timeout():
                _LOGGER.info(
                    "House Perimeter: all rooms clear for %.0fs; resetting headcount %d -> 0",
                    now - self._all_clear_since,
                    self.state.count,
                )
                self.state.count = 0
                changed = True
        else:
            self._all_clear_since = None

        if changed:
            self._update_mode()
            self.enforce_conservation_law()
            self._notify_listeners()
        return changed

    def enforce_conservation_law(self, newly_occupied_room: str | None = None) -> list[str]:
        """Enforce conservation law: total occupied rooms must not exceed house occupant count.

        When count == 0: all rooms are vacated immediately.
        When count == 1: at most 1 room can be occupied; when a new room is occupied,
        all other rooms without active triggers or high-confidence anchors are vacated.
        Returns list of room names vacated by conservation law.
        """
        vacated_rooms: list[str] = []
        if not self.hass or not hasattr(self.hass, "data") or not isinstance(self.hass.data, dict):
            return vacated_rooms

        store = self.hass.data.get(DOMAIN, {}).get(DATA_STORE)
        if store is not None and hasattr(store, "global_settings"):
            gs = store.global_settings or {}
            if not gs.get("enable_conservation_law", True):
                return vacated_rooms

        from .trajectory_validator import get_all_room_coordinators

        coordinators = get_all_room_coordinators(self.hass)
        occupied = [c for c in coordinators if c.state_machine and c.state_machine.is_present]

        # Case 0: House is vacant -> all rooms must be clear
        if self.state.count == 0:
            for c in occupied:
                c.state_machine.force_clear()
                vacated_rooms.append(c.room_name)
                c.async_update_listeners()
            return vacated_rooms

        # Case 1: Single occupant -> at most 1 room occupied
        if self.state.count == 1 and len(occupied) > 1:
            target_keep = newly_occupied_room
            if not target_keep:
                # Keep room with most recent trigger or highest probability
                target_keep = max(
                    occupied,
                    key=lambda c: getattr(c.state_machine, "last_occupied_time", 0.0),
                ).room_name

            for c in occupied:
                if c.room_name != target_keep:
                    # Clear timer and presence immediately
                    c.state_machine.force_clear()
                    c._last_adjacent_arrival = (
                        f"Vacated by Conservation Law (single occupant in {target_keep})"
                    )
                    vacated_rooms.append(c.room_name)
                    c.async_update_listeners()

        return vacated_rooms


def get_house_perimeter_tracker(hass: Any) -> HousePerimeterTracker:
    """Retrieve or initialize singleton HousePerimeterTracker in hass.data."""
    if DOMAIN not in hass.data:
        hass.data[DOMAIN] = {}
    tracker = hass.data[DOMAIN].get("_house_perimeter_tracker")
    if tracker is None or not isinstance(tracker, HousePerimeterTracker):
        tracker = HousePerimeterTracker(hass)
        hass.data[DOMAIN]["_house_perimeter_tracker"] = tracker
    return tracker
