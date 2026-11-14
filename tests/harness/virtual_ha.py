"""In-memory Home Assistant runtime and deterministic virtual clock for E2E scenarios."""

from __future__ import annotations

import datetime
import logging
from collections.abc import Callable
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any
from unittest.mock import patch

from custom_components.presence_detection_designer.binary_sensor import PresenceBinarySensor
from custom_components.presence_detection_designer.const import (
    CONF_ROOM_NAME,
    DATA_STORE,
    DOMAIN,
)
from custom_components.presence_detection_designer.coordinator import RoomPresenceCoordinator
from custom_components.presence_detection_designer.sensor import OccupancyProbabilitySensor
from custom_components.presence_detection_designer.store import PDDStore

from .feedback_envelope import ActionHistoryTap, HarnessLogTap


@dataclass
class InMemoryState:
    """Lightweight Home Assistant State mirror with UTC timestamps."""

    entity_id: str
    state: str
    attributes: dict[str, Any] = field(default_factory=dict)
    last_changed: datetime.datetime = field(
        default_factory=lambda: datetime.datetime(2026, 11, 14, 12, 0, 0, tzinfo=datetime.UTC)
    )
    last_updated: datetime.datetime = field(
        default_factory=lambda: datetime.datetime(2026, 11, 14, 12, 0, 0, tzinfo=datetime.UTC)
    )


@dataclass
class InMemoryEvent:
    """Minimal HA Event object delivered to track_state_change_event listeners."""

    event_type: str
    data: dict[str, Any]
    time_fired: datetime.datetime


class VirtualClock:
    """Deterministic virtual clock and ordered timer queue (no wall-clock sleeps)."""

    def __init__(self, start_ts: float = 1794657600.0) -> None:
        self._now = float(start_ts)
        self._timers: list[tuple[float, int, Callable[[Any], Any], bool]] = []
        self._intervals: list[tuple[float, float, int, Callable[[Any], Any], bool]] = []
        self._seq = 0

    def now(self) -> float:
        """Return current UNIX timestamp."""
        return self._now

    def dt_now(self) -> datetime.datetime:
        """Return current UTC datetime."""
        return datetime.datetime.fromtimestamp(self._now, tz=datetime.UTC)

    def schedule_later(self, delay: float, cb: Callable[[Any], Any]) -> Callable[[], None]:
        """Schedule a one-shot callback after `delay` virtual seconds."""
        self._seq += 1
        token = self._seq
        fire_at = self._now + max(0.0, float(delay))
        entry = [fire_at, token, cb, True]
        self._timers.append(entry)  # type: ignore[arg-type]

        def _cancel() -> None:
            entry[3] = False

        return _cancel

    def schedule_interval(self, period: float, cb: Callable[[Any], Any]) -> Callable[[], None]:
        """Schedule a repeating callback every `period` virtual seconds."""
        self._seq += 1
        token = self._seq
        p = max(0.1, float(period))
        entry = [self._now + p, p, token, cb, True]
        self._intervals.append(entry)  # type: ignore[arg-type]

        def _cancel() -> None:
            entry[4] = False

        return _cancel


class _StateRegistry:
    """In-memory hass.states backing store triggering entity listeners on mutation."""

    def __init__(self, harness: VirtualHAHarness) -> None:
        self._harness = harness
        self._states: dict[str, InMemoryState] = {}

    def get(self, entity_id: str) -> InMemoryState | None:
        return self._states.get(entity_id)

    def async_all(self) -> list[InMemoryState]:
        return list(self._states.values())

    def set_state(
        self,
        entity_id: str,
        state: str,
        attributes: dict[str, Any] | None = None,
        *,
        last_changed: datetime.datetime | None = None,
        fire_event: bool = True,
    ) -> InMemoryState:
        old_state = self._states.get(entity_id)
        now_dt = last_changed or self._harness.clock.dt_now()
        new_state = InMemoryState(
            entity_id=entity_id,
            state=str(state),
            attributes=dict(attributes or {}),
            last_changed=now_dt,
            last_updated=now_dt,
        )
        self._states[entity_id] = new_state
        if fire_event:
            self._harness.dispatch_state_change(entity_id, old_state, new_state)
        return new_state


class _Bus:
    """In-memory event bus capturing emitted PDD bus events."""

    def __init__(self, harness: VirtualHAHarness) -> None:
        self._harness = harness
        self.events: list[dict[str, Any]] = []

    def async_fire(self, event_type: str, event_data: dict[str, Any] | None = None) -> None:
        payload = {
            "ts": round(self._harness.clock.now(), 3),
            "event_type": event_type,
            "data": dict(event_data or {}),
        }
        self.events.append(payload)


class _Config:
    def __init__(self, storage_dir: Path) -> None:
        self._storage_dir = storage_dir
        self.config_dir = str(storage_dir)

    def path(self, *parts: str) -> str:
        return str(self._storage_dir.joinpath(*parts))


class _Loop:
    """Minimal loop marker so coordinator attaches HA timer hooks."""

    def call_soon_threadsafe(self, cb: Callable[..., Any], *args: Any) -> None:
        cb(*args)


class _InMemoryHass:
    """Concrete in-memory HomeAssistant facade for real PDD coordinators."""

    def __init__(self, harness: VirtualHAHarness, storage_dir: Path) -> None:
        self.states = _StateRegistry(harness)
        self.bus = _Bus(harness)
        self.config = _Config(storage_dir)
        self.loop = _Loop()
        self.data: dict[str, Any] = {}
        self._pending_coros: list[Any] = []

    def async_create_task(self, coro: Any) -> Any:
        # Close unawaited notification/LLM background coroutines cleanly in sync driver;
        # callers needing async execution await explicitly.
        if hasattr(coro, "close"):
            coro.close()
        return None


class VirtualHAHarness:
    """Multi-room deterministic E2E harness wiring real PDD coordinators & entities."""

    def __init__(
        self,
        *,
        storage_dir: Path,
        start_ts: float = 1794657600.0,
        global_settings: dict[str, Any] | None = None,
    ) -> None:
        self.clock = VirtualClock(start_ts=start_ts)
        self.hass = _InMemoryHass(self, storage_dir)
        self.store = PDDStore(self.hass)
        if global_settings:
            self.store._data["global_settings"].update(global_settings)
        self.hass.data.setdefault(DOMAIN, {})[DATA_STORE] = self.store

        self.coordinators: dict[str, RoomPresenceCoordinator] = {}
        self.binary_sensors: dict[str, PresenceBinarySensor] = {}
        self.prob_sensors: dict[str, OccupancyProbabilitySensor] = {}
        self._state_watchers: dict[str, list[Callable[[InMemoryEvent], Any]]] = {}

        self.tap = ActionHistoryTap(maxlen=1000)
        self.log_tap = HarnessLogTap(maxlen=200)
        self._step_counter = 0
        self._time_patch: Any = None
        self._event_patches: list[Any] = []

    def __enter__(self) -> VirtualHAHarness:
        import homeassistant.helpers.event as ha_event

        logging.getLogger("custom_components.presence_detection_designer").addHandler(self.log_tap)
        self._time_patch = patch("time.time", side_effect=self.clock.now)
        self._time_patch.start()

        def _track_state(
            _hass: Any,
            entity_ids: list[str] | str,
            action: Callable[[InMemoryEvent], Any],
        ) -> Callable[[], None]:
            eids = [entity_ids] if isinstance(entity_ids, str) else list(entity_ids)
            for eid in eids:
                self._state_watchers.setdefault(eid, []).append(action)

            def _unsub() -> None:
                for eid in eids:
                    if eid in self._state_watchers and action in self._state_watchers[eid]:
                        self._state_watchers[eid].remove(action)

            return _unsub

        def _call_later(
            _hass: Any, delay: float, action: Callable[[Any], Any]
        ) -> Callable[[], None]:
            return self.clock.schedule_later(delay, action)

        def _track_interval(
            _hass: Any, action: Callable[[Any], Any], interval: datetime.timedelta
        ) -> Callable[[], None]:
            return self.clock.schedule_interval(interval.total_seconds(), action)

        for target, impl in (
            ("async_track_state_change_event", _track_state),
            ("async_call_later", _call_later),
            ("async_track_time_interval", _track_interval),
        ):
            p = patch.object(ha_event, target, new=impl)
            p.start()
            self._event_patches.append(p)
        return self

    def __exit__(self, *_args: Any) -> None:
        for coord in self.coordinators.values():
            coord.async_unload()
        for p in self._event_patches:
            p.stop()
        self._event_patches.clear()
        if self._time_patch is not None:
            self._time_patch.stop()
            self._time_patch = None
        logging.getLogger("custom_components.presence_detection_designer").removeHandler(
            self.log_tap
        )

    async def async_add_rooms(
        self,
        room_configs: list[dict[str, Any]],
        *,
        floorplan: dict[str, Any] | None = None,
    ) -> None:
        """Instantiate and set up real coordinators + entities for all scenario rooms."""
        from custom_components.presence_detection_designer.trajectory_validator import (
            clear_topology_cache,
        )

        if floorplan and isinstance(floorplan, dict) and floorplan.get("rooms"):
            fp_copy = dict(floorplan)
            fp_copy.setdefault("floors", [{"id": "main", "name": "Main Floor"}])
            self.store._data["floorplan"] = fp_copy
        elif any(cfg.get("connected_rooms") for cfg in room_configs):
            fp_rooms = [
                {"name": str(cfg.get(CONF_ROOM_NAME, f"Room {i + 1}")), "floor": "main"}
                for i, cfg in enumerate(room_configs)
            ]
            fp_conns = []
            seen_edges: set[tuple[str, str]] = set()
            for i, cfg in enumerate(room_configs):
                src = str(cfg.get(CONF_ROOM_NAME, f"Room {i + 1}"))
                for dst in cfg.get("connected_rooms") or []:
                    edge = tuple(sorted((src, str(dst))))
                    if edge not in seen_edges:
                        seen_edges.add(edge)
                        fp_conns.append({"from_room": src, "to_room": str(dst), "type": "door"})
            self.store._data["floorplan"] = {
                "floors": [{"id": "main", "name": "Main Floor"}],
                "rooms": fp_rooms,
                "connections": fp_conns,
            }
        clear_topology_cache()

        for idx, raw_cfg in enumerate(room_configs):
            cfg = dict(raw_cfg)
            room_name = str(cfg.get(CONF_ROOM_NAME, f"Room {idx + 1}"))
            entry_id = str(
                cfg.get("entry_id") or f"entry_{idx}_{room_name.lower().replace(' ', '_')}"
            )
            self.store._data["rooms"][entry_id] = cfg
            coord = RoomPresenceCoordinator(self.hass, entry_id, cfg)
            self.hass.data[DOMAIN][entry_id] = coord
            self.coordinators[room_name] = coord
            self.binary_sensors[room_name] = PresenceBinarySensor(coord, entry_id)
            self.prob_sensors[room_name] = OccupancyProbabilitySensor(coord, entry_id)
            await coord.async_setup()

    def dispatch_state_change(
        self,
        entity_id: str,
        old_state: InMemoryState | None,
        new_state: InMemoryState,
    ) -> None:
        """Deliver HA state_changed event synchronously to registered coordinator callbacks."""
        callbacks = list(self._state_watchers.get(entity_id, ()))
        if not callbacks:
            return
        evt = InMemoryEvent(
            event_type="state_changed",
            data={"entity_id": entity_id, "old_state": old_state, "new_state": new_state},
            time_fired=self.clock.dt_now(),
        )
        for cb in callbacks:
            cb(evt)

    def set_state(
        self,
        entity_id: str,
        state: str,
        attributes: dict[str, Any] | None = None,
        *,
        last_changed: datetime.datetime | None = None,
        fire_event: bool = True,
    ) -> None:
        """Mutate an entity state and record diagnostic tap."""
        self._step_counter += 1
        self.tap.record(
            self._step_counter,
            self.clock.now(),
            "entity_state",
            entity_id=entity_id,
            state=state,
        )
        self.hass.states.set_state(
            entity_id,
            state,
            attributes=attributes,
            last_changed=last_changed,
            fire_event=fire_event,
        )

    def advance(self, seconds: float) -> None:
        """Advance virtual clock and execute expired state timers in chronological order."""
        target = self.clock.now() + max(0.0, float(seconds))
        self._step_counter += 1
        self.tap.record(self._step_counter, target, "advance_clock", seconds=seconds)

        # Fire scheduled HA one-shot timers in chronological order up to target
        while True:
            due = [t for t in self.clock._timers if t[3] and t[0] <= target]
            if not due:
                break
            due.sort(key=lambda t: (t[0], t[1]))
            entry = due[0]
            entry[3] = False
            self.clock._now = entry[0]
            entry[2](self.clock.dt_now())

        self.clock._now = target
        for coord in self.coordinators.values():
            sm = coord.state_machine
            sm.advance_time(0.0, now_ts=target)

    def room_snapshot(self, room_name: str) -> dict[str, Any]:
        """Return live state, attributes, and probability snapshot for a room."""
        coord = self.coordinators[room_name]
        bs = self.binary_sensors[room_name]
        ps = self.prob_sensors[room_name]
        attrs = bs.extra_state_attributes
        return {
            "room_name": room_name,
            "is_on": bs.is_on,
            "occupancy_state": attrs["occupancy_state"],
            "is_cooling_down": attrs["is_cooling_down"],
            "cooling_remaining_sec": attrs["cooling_remaining_sec"],
            "state_reason": attrs["state_reason"],
            "verified_by": attrs["verified_by"],
            "probability_pct": ps.native_value,
            "human_present": attrs["human_present"],
            "pet_present": attrs["pet_present"],
            "transition_count": len(coord.state_machine.transition_history),
        }

    def all_room_transitions(self) -> list[dict[str, Any]]:
        """Merge per-room state machine transition histories chronologically."""
        merged: list[dict[str, Any]] = []
        for room_name, coord in self.coordinators.items():
            for entry in coord.state_machine.transition_history:
                merged.append({"room": room_name, **entry})
        merged.sort(key=lambda item: float(item.get("timestamp", 0.0)))
        return merged
