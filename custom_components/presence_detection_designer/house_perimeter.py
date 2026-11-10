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
    CONF_EXIT_CORROBORATION_WINDOW,
    CONF_EXIT_CORROBORATORS,
    DATA_STORE,
    DEFAULT_DOOR_DUPLICATE_WINDOW,
    DEFAULT_EXIT_CORROBORATION_WINDOW,
    DEFAULT_EXIT_CORROBORATORS,
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
        self._unsub_trackers: list[Callable[[], None]] = []
        self._door_opened_ts: dict[str, float] = {}
        self._door_is_open: dict[str, bool] = {}
        self._last_vector_by_door: dict[str, str] = {}
        self._last_vector_ts_by_door: dict[str, float] = {}
        self._exterior_last_active_ts: dict[str, float] = {}
        self._pending_exit_corroborations: list[dict[str, Any]] = []
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

    def _setting_num(self, key: str, default: float, is_int: bool = False) -> Any:
        try:
            val = float(self._global_settings().get(key, default))
            return max(0, int(val)) if is_int else max(0.0, val)
        except (TypeError, ValueError):
            return int(default) if is_int else float(default)

    def _max_occupants(self) -> int:
        return self._setting_num("max_occupants", DEFAULT_MAX_OCCUPANTS, is_int=True)

    def _stale_count_timeout(self) -> float:
        return self._setting_num("stale_count_timeout", DEFAULT_STALE_COUNT_TIMEOUT)

    def _door_duplicate_window(self) -> float:
        return self._setting_num("door_duplicate_window", DEFAULT_DOOR_DUPLICATE_WINDOW)

    def _exit_corroboration_window(self) -> float:
        return self._setting_num(CONF_EXIT_CORROBORATION_WINDOW, DEFAULT_EXIT_CORROBORATION_WINDOW)

    def get_configured_exit_corroborators(self) -> dict[str, list[str]]:
        """Return dict of exit corroborator motion sensors per door entity."""
        cfg = dict(DEFAULT_EXIT_CORROBORATORS)
        custom = self._global_settings().get(CONF_EXIT_CORROBORATORS)
        if isinstance(custom, dict) and custom:
            for door, sensors in custom.items():
                if isinstance(sensors, (list, tuple)):
                    cfg[door] = [str(s) for s in sensors]
        return cfg

    def _find_active_corroborator(self, corroborators: list[str], since_ts: float) -> str | None:
        """Return first active corroborator sensor if active since since_ts."""
        for c in corroborators:
            if self._exterior_last_active_ts.get(c, 0.0) >= since_ts:
                return c
            if self.hass and hasattr(self.hass, "states"):
                st = self.hass.states.get(c)
                if st and st.state in ("on", "open", "active", "detected"):
                    return c
        return None

    def handle_exterior_state_change(
        self, entity_id: str, is_active: bool, now_ts: float | None = None
    ) -> list[DoorTransitionRecord]:
        """Record exterior motion and resolve any pending exit corroborations."""
        now = now_ts if now_ts is not None else time.time()
        if is_active:
            self._exterior_last_active_ts[entity_id] = now
            return self.check_pending_exit_corroborations(now_ts=now)
        return []

    def check_pending_exit_corroborations(
        self, now_ts: float | None = None
    ) -> list[DoorTransitionRecord]:
        """Check and resolve pending exit corroborations based on exterior motion or timeout."""
        from .perimeter_helpers import resolve_pending_exit_corroborations

        return resolve_pending_exit_corroborations(self, now_ts=now_ts)

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
        if vector == "pending_egress":
            corroborators = self.get_configured_exit_corroborators().get(entity_id, [])
            self._pending_exit_corroborations.append(
                {
                    "door_entity": entity_id,
                    "room_name": host_room,
                    "opened_ts": opened_at,
                    "closed_ts": now,
                    "deadline_ts": now + self._exit_corroboration_window(),
                    "corroborators": corroborators,
                }
            )
            _LOGGER.info(
                "House Perimeter: exit on %s (%s) held pending exterior corroboration",
                entity_id,
                host_room,
            )
            return DoorTransitionRecord(
                entity_id=entity_id,
                room_name=host_room,
                opened_ts=opened_at,
                closed_ts=now,
                vector="pending_egress",
                confidence=confidence,
                details=details,
            )

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

    def _vet_exit_vector(
        self,
        door_entity: str,
        host_room: str,
        opened_ts: float,
        confidence: float,
        details: str,
    ) -> tuple[str, float, str]:
        """Check if egress requires exterior corroboration before confirming."""
        from .perimeter_helpers import vet_exit_vector

        return vet_exit_vector(self, door_entity, host_room, opened_ts, confidence, details)

    def _infer_door_vector(
        self,
        door_entity: str,
        host_room: str,
        opened_ts: float,
        closed_ts: float,
    ) -> tuple[str, float, str]:
        """Directionally vector door transit into ingress vs egress based on sensor timings."""
        from .perimeter_helpers import infer_door_vector

        return infer_door_vector(self, door_entity, host_room, opened_ts, closed_ts)

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
        self.check_pending_exit_corroborations(now_ts=now)
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
        """Enforce conservation law: total occupied rooms must not exceed house occupant count."""
        from .perimeter_helpers import enforce_conservation_law

        return enforce_conservation_law(self, newly_occupied_room=newly_occupied_room)

    async def async_setup(self) -> None:
        """Subscribe to state changes on configured exterior corroborators."""
        from .perimeter_helpers import async_setup_perimeter_tracking

        await async_setup_perimeter_tracking(self)


def get_house_perimeter_tracker(hass: Any) -> HousePerimeterTracker:
    """Retrieve or initialize singleton HousePerimeterTracker in hass.data."""
    if DOMAIN not in hass.data:
        hass.data[DOMAIN] = {}
    tracker = hass.data[DOMAIN].get("_house_perimeter_tracker")
    if tracker is None or not isinstance(tracker, HousePerimeterTracker):
        tracker = HousePerimeterTracker(hass)
        hass.data[DOMAIN]["_house_perimeter_tracker"] = tracker
        if hasattr(hass, "async_create_task"):
            coro = tracker.async_setup()
            hass.async_create_task(coro)
            if type(hass.async_create_task).__name__ == "MagicMock" and hasattr(coro, "close"):
                coro.close()
    return tracker
