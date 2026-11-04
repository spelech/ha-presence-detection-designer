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
    DEFAULT_PERIMETER_DOORS,
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
        self.state = HouseOccupancyState()
        self._load_initial_count()

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

        host_room = configured_doors[entity_id]

        if is_open:
            self._door_opened_ts[entity_id] = now
            return None

        # Door just closed
        opened_at = self._door_opened_ts.pop(entity_id, None)
        if opened_at is None:
            opened_at = now - 5.0  # reasonable default if we missed open

        vector, confidence, details = self._infer_door_vector(entity_id, host_room, opened_at, now)
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

        # Case 1: Vacant house -> ANY door open/close is ingress
        if self.state.count <= 0 or not other_occupied:
            if not interior_motion_before:
                return "ingress", 0.95, "Arrival from vacant state"

        # Case 2: Interior motion was active in host room before door opened -> Egress
        if interior_motion_before and not other_occupied:
            return "egress", 0.85, f"Occupant in {host_room} exited through perimeter"

        # Case 3: Multiple interior rooms occupied -> ambiguous or ingress
        if other_occupied and not interior_motion_before:
            return "ingress", 0.80, f"Arrival while {', '.join(other_occupied)} occupied"

        return "ambiguous", 0.50, f"Door cycled on {host_room} with neutral priors"

    def _apply_vector(self, record: DoorTransitionRecord) -> None:
        """Update headcount and mode based on vector transition."""
        old_count = self.state.count
        if record.vector == "ingress":
            self.state.count = max(1, self.state.count + 1)
        elif record.vector == "egress":
            self.state.count = max(0, self.state.count - 1)

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
        self._update_mode()
        self.enforce_conservation_law()
        self._notify_listeners()

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
