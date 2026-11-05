"""Coordinator managing room state machine, Bayesian fusion, entity tracking, and LLM verification."""

from __future__ import annotations

import logging
import time
from collections.abc import Callable
from typing import Any

try:
    from homeassistant.core import callback

    if type(callback).__name__ == "MagicMock":
        raise ImportError
except Exception:  # noqa: BLE001

    def callback(func: Any) -> Any:  # type: ignore[misc]
        """Fallback callback decorator when running outside Home Assistant."""
        return func


from .bayesian_engine import (
    BayesianEvaluation,
    build_effective_observations,
    config_to_yaml_representations,
    explain_config_in_natural_language,
)
from .causal_context import (
    RoomActuationTracker,
    process_coordinator_actuator_event,
    resolve_room_actuator_entities,
)
from .condition_evaluator import evaluate_all, is_state_stale
from .const import (
    CONF_AREA_ID,
    CONF_BAYESIAN_ENABLED,
    CONF_BAYESIAN_OBSERVATIONS,
    CONF_BAYESIAN_PRIOR,
    CONF_BAYESIAN_THRESHOLD,
    CONF_BOUNDARY_ENTITIES,
    CONF_CAMERA_ENTITY,
    CONF_CAMERA_SNAPSHOT_URL,
    CONF_CONNECTED_ROOMS,
    CONF_EXTEND_TIMEOUT,
    CONF_GRACE_TIMEOUT,
    CONF_INACTIVITY_TIMEOUT,
    CONF_LLM_AGENT_ID,
    CONF_LLM_API_KEY,
    CONF_LLM_API_URL,
    CONF_LLM_ENABLED,
    CONF_LLM_MODEL,
    CONF_LLM_PROMPT,
    CONF_LLM_PROVIDER_TYPE,
    CONF_MODE,
    CONF_NOTIFY_ON_CLEARED,
    CONF_NOTIFY_ON_OCCUPIED,
    CONF_NOTIFY_SLACK,
    CONF_ROOM_NAME,
    CONF_SEALED_VERIFY_TIMEOUT,
    CONF_SUSTAINING_CONDITIONS,
    CONF_TRIGGER_ENTITIES,
    CONF_TRIGGER_STUCK_TIMEOUT,
    DATA_STORE,
    DEFAULT_BAYESIAN_PRIOR,
    DEFAULT_BAYESIAN_THRESHOLD,
    DEFAULT_EXTEND_TIMEOUT,
    DEFAULT_GRACE_TIMEOUT,
    DEFAULT_INACTIVITY_TIMEOUT,
    DEFAULT_LLM_PROMPT,
    DEFAULT_SEALED_VERIFY_TIMEOUT,
    DEFAULT_TRIGGER_STUCK_TIMEOUT,
    DOMAIN,
    BoxState,
    Mode,
)
from .coordinator_dispatch import (
    _safe_state_getter,
    async_send_coordinator_test_notification,
    dispatch_presence_transition,
    evaluate_coordinator_bayesian,
    notify_connected_rooms_if_active,
    process_coordinator_trigger_event,
    record_coordinator_timeline_snapshot,
    resolve_global_llm_defaults,
)
from .llm_verifier import LLMVerifier
from .notifications import NotificationDispatcher
from .state_machine import RoomStateMachine

__all__ = ["RoomPresenceCoordinator", "_safe_state_getter", "_is_camera_person_entity"]

_LOGGER = logging.getLogger(__name__)


def _is_camera_person_entity(entity_id: str) -> bool:
    """Return True for Frigate/camera person occupancy whole-frame or sub-zone entities."""
    return "person_occupancy" in str(entity_id).lower()


class RoomPresenceCoordinator:
    """Coordinates state machine, Bayesian fusion, entity listeners, and LLM verification."""

    def __init__(
        self,
        hass: Any,
        entry_id: str,
        config: dict[str, Any],
    ) -> None:
        self.hass = hass
        self.entry_id = entry_id
        self.config = dict(config)

        self._listeners: list[Callable[[], None]] = []
        self._unsub_trackers: list[Callable[[], None]] = []
        self._previous_presence = False
        self._occupied_start_time: float | None = None
        self._last_adjacent_arrival: str | None = None
        self._notification_dispatcher = NotificationDispatcher()
        self.actuation_tracker = RoomActuationTracker()
        self.monitored_actuator_entities: list[str] = []
        self.last_bayesian_eval: BayesianEvaluation | None = None
        self.last_spatial_estimate: dict[str, Any] | None = None
        self._last_spatial_frame: dict[str, Any] | None = None
        self._settling_entity: str | None = None
        self._settling_ts: float = 0.0
        self._last_corroborated_path: list[str] | None = None
        self._last_suppressed_reason: str | None = None
        # Stuck / stale camera sub-zone trigger watchdog state.
        self._trigger_on_since: dict[str, float] = {}
        self._stuck_suppressed_entities: set[str] = set()
        self._stuck_verify_ts: dict[str, float] = {}
        self.sealed_verify_timeout: int = DEFAULT_SEALED_VERIFY_TIMEOUT
        self.trigger_stuck_timeout: int = DEFAULT_TRIGGER_STUCK_TIMEOUT
        self.state_machine: RoomStateMachine = None  # type: ignore[assignment]

        self._apply_config_fields(self.config, preserve_state=False)

    def _resolve_global_llm_defaults(self, config: dict[str, Any]) -> dict[str, Any]:
        """Merge global_settings from PDDStore for any unset LLM fields."""
        return resolve_global_llm_defaults(self.hass, config)

    def _apply_config_fields(self, config: dict[str, Any], preserve_state: bool = False) -> None:
        """Populate coordinator attributes and state machine from config dict."""
        self.config = dict(config)
        self.room_name: str = config.get(CONF_ROOM_NAME, "Room")
        self.area_id: str | None = config.get(CONF_AREA_ID)
        self.boundary_entities: list[str] = list(config.get(CONF_BOUNDARY_ENTITIES, []) or [])
        self.trigger_entities: list[str] = list(config.get(CONF_TRIGGER_ENTITIES, []) or [])
        self.monitored_actuator_entities = resolve_room_actuator_entities(self.room_name, config)
        self.connected_rooms: list[str] = [
            str(r) for r in (config.get(CONF_CONNECTED_ROOMS, []) or []) if r
        ]
        self.conditions: list[dict[str, Any]] = list(
            config.get(CONF_SUSTAINING_CONDITIONS, []) or []
        )

        self.bayesian_enabled: bool = bool(config.get(CONF_BAYESIAN_ENABLED, True))
        self.bayesian_prior: float = float(config.get(CONF_BAYESIAN_PRIOR, DEFAULT_BAYESIAN_PRIOR))
        self.bayesian_threshold: float = float(
            config.get(CONF_BAYESIAN_THRESHOLD, DEFAULT_BAYESIAN_THRESHOLD)
        )
        self.has_explicit_bayesian: bool = bool(config.get(CONF_BAYESIAN_OBSERVATIONS))
        self.bayesian_observations: list[dict[str, Any]] = build_effective_observations(config)

        mode_val = config.get(CONF_MODE)
        if not mode_val or str(mode_val).lower() == "auto":
            self.mode = Mode.BOUNDED if len(self.boundary_entities) > 0 else Mode.OPEN
        else:
            try:
                self.mode = Mode(mode_val)
            except ValueError:
                self.mode = Mode.BOUNDED if len(self.boundary_entities) > 0 else Mode.OPEN

        raw_notify_slack = config.get(CONF_NOTIFY_SLACK)
        self.notify_slack: bool = True if raw_notify_slack is None else bool(raw_notify_slack)
        raw_notify_occ = config.get(CONF_NOTIFY_ON_OCCUPIED)
        self.notify_on_occupied: bool = True if raw_notify_occ is None else bool(raw_notify_occ)
        raw_notify_clr = config.get(CONF_NOTIFY_ON_CLEARED)
        self.notify_on_cleared: bool = True if raw_notify_clr is None else bool(raw_notify_clr)

        inactivity_timeout = int(config.get(CONF_INACTIVITY_TIMEOUT, DEFAULT_INACTIVITY_TIMEOUT))
        grace_timeout = int(config.get(CONF_GRACE_TIMEOUT, DEFAULT_GRACE_TIMEOUT))
        extend_timeout = int(config.get(CONF_EXTEND_TIMEOUT, DEFAULT_EXTEND_TIMEOUT))
        llm_enabled = bool(config.get(CONF_LLM_ENABLED, False))
        self.sealed_verify_timeout = int(
            config.get(CONF_SEALED_VERIFY_TIMEOUT, DEFAULT_SEALED_VERIFY_TIMEOUT)
        )
        self.trigger_stuck_timeout = int(
            config.get(CONF_TRIGGER_STUCK_TIMEOUT, DEFAULT_TRIGGER_STUCK_TIMEOUT)
        )

        if preserve_state and self.state_machine is not None:
            self.state_machine.name = self.room_name
            self.state_machine.mode = self.mode
            self.state_machine.has_boundaries = bool(self.boundary_entities)
            self.state_machine.inactivity_timeout = inactivity_timeout
            self.state_machine.grace_timeout = grace_timeout
            self.state_machine.extend_timeout = extend_timeout
            self.state_machine.llm_enabled = llm_enabled
            self.state_machine.bayesian_prior = self.bayesian_prior
            self.state_machine.bayesian_threshold = self.bayesian_threshold
            self.state_machine._active_triggers.intersection_update(self.trigger_entities)
            self.state_machine._open_boundaries.intersection_update(self.boundary_entities)
        else:
            self.state_machine = RoomStateMachine(
                name=self.room_name,
                mode=self.mode,
                inactivity_timeout=inactivity_timeout,
                grace_timeout=grace_timeout,
                extend_timeout=extend_timeout,
                llm_enabled=llm_enabled,
                bayesian_prior=self.bayesian_prior,
                bayesian_threshold=self.bayesian_threshold,
                has_boundaries=bool(self.boundary_entities),
            )

        llm_cfg = self._resolve_global_llm_defaults(config)
        self.verifier = LLMVerifier(
            hass=self.hass,
            provider_type=llm_cfg[CONF_LLM_PROVIDER_TYPE],
            agent_id=llm_cfg[CONF_LLM_AGENT_ID],
            api_url=llm_cfg[CONF_LLM_API_URL],
            api_key=llm_cfg[CONF_LLM_API_KEY],
            model=llm_cfg[CONF_LLM_MODEL],
            prompt=config.get(CONF_LLM_PROMPT, DEFAULT_LLM_PROMPT),
        )

        self.camera_entity = config.get(CONF_CAMERA_ENTITY)
        self.camera_snapshot_url = config.get(CONF_CAMERA_SNAPSHOT_URL)

        self.rule_guide = explain_config_in_natural_language(config)
        self.yaml_representations = config_to_yaml_representations(config)

    async def async_apply_config_in_place(self, new_config: dict[str, Any]) -> None:
        """Hot-apply an updated configuration without losing active room presence or entity listeners."""
        self._unsubscribe_trackers()
        self._apply_config_fields(new_config, preserve_state=True)
        await self.async_setup()
        self.async_update_listeners()

    def async_add_listener(self, update_callback: Callable[[], None]) -> Callable[[], None]:
        """Add listener for state updates."""
        self._listeners.append(update_callback)

        def remove_listener() -> None:
            if update_callback in self._listeners:
                self._listeners.remove(update_callback)

        return remove_listener

    @callback
    def async_update_listeners(self) -> None:
        """Notify all registered entity listeners and dispatch transition events."""
        for update_callback in self._listeners:
            try:
                update_callback()
            except Exception as err:  # noqa: BLE001
                _LOGGER.error("Error updating presence listener: %s", err)

        dispatch_presence_transition(self)

    async def async_setup(self) -> None:
        """Start listening to entity state changes and timer ticks."""
        if not self.hass or not hasattr(self.hass, "states"):
            return

        import datetime

        from homeassistant.helpers.event import (
            async_track_state_change_event,
            async_track_time_interval,
        )

        if self.trigger_entities:
            unsub = async_track_state_change_event(
                self.hass,
                self.trigger_entities,
                self._handle_trigger_change,
            )
            self._unsub_trackers.append(unsub)

        if self.boundary_entities:
            unsub = async_track_state_change_event(
                self.hass,
                self.boundary_entities,
                self._handle_boundary_change,
            )
            self._unsub_trackers.append(unsub)

        cond_entities = [c["entity_id"] for c in self.conditions if c.get("entity_id")]
        if cond_entities:
            unsub = async_track_state_change_event(
                self.hass,
                cond_entities,
                self._handle_condition_change,
            )
            self._unsub_trackers.append(unsub)

        already_tracked = set(self.trigger_entities) | set(cond_entities)
        bayesian_only_entities = [
            obs["entity_id"]
            for obs in self.bayesian_observations
            if obs.get("entity_id") and obs["entity_id"] not in already_tracked
        ]
        if bayesian_only_entities:
            unsub = async_track_state_change_event(
                self.hass,
                list(dict.fromkeys(bayesian_only_entities)),
                self._handle_bayesian_change,
            )
            self._unsub_trackers.append(unsub)

        if self.monitored_actuator_entities:
            unsub = async_track_state_change_event(
                self.hass,
                self.monitored_actuator_entities,
                self._handle_actuator_change,
            )
            self._unsub_trackers.append(unsub)

        unsub_tick = async_track_time_interval(
            self.hass,
            self._async_handle_tick,
            datetime.timedelta(seconds=1),
        )
        self._unsub_trackers.append(unsub_tick)
        self.async_refresh_all_states()

    def _unsubscribe_trackers(self) -> None:
        """Unsubscribe entity state listeners and timer tick without clearing entity listeners."""
        for unsub in self._unsub_trackers:
            try:
                unsub()
            except Exception:  # noqa: BLE001
                pass
        self._unsub_trackers.clear()

    def async_unload(self) -> None:
        """Unsubscribe all entity listeners and timers."""
        self._unsubscribe_trackers()
        self._listeners.clear()

    def async_refresh_all_states(self) -> None:
        """Evaluate current HA states for boundaries, triggers, conditions, and Bayesian fusion."""
        if not self.hass or not hasattr(self.hass, "states"):
            return

        for b_eid in self.boundary_entities:
            st_obj = _safe_state_getter(self.hass, b_eid)
            if st_obj is not None:
                is_open = st_obj.state in ("on", "open")
                self.state_machine.handle_boundary(b_eid, is_open)

        for t_eid in self.trigger_entities:
            st_obj = _safe_state_getter(self.hass, t_eid)
            if st_obj is not None:
                if is_state_stale(st_obj, max_age_seconds=60.0):
                    continue
                is_active = st_obj.state in ("on", "playing", "home")
                if is_active:
                    if t_eid not in self._trigger_on_since:
                        self._trigger_on_since[t_eid] = time.time()
                    self.state_machine.handle_trigger(t_eid, True)
                else:
                    self._trigger_on_since.pop(t_eid, None)
                    self._stuck_suppressed_entities.discard(t_eid)

        self._eval_conditions_and_update()

    def _eval_bayesian_and_update(self) -> BayesianEvaluation | None:
        """Evaluate Bayesian sensor fusion across all configured observations and negative-space geometry."""
        return evaluate_coordinator_bayesian(self)

    def _is_guest_mode_active(self) -> bool:
        """Return True if global Guest Mode is currently enabled."""
        if not self.hass or not isinstance(getattr(self.hass, "data", None), dict):
            return False
        store = self.hass.data.get(DOMAIN, {}).get(DATA_STORE)
        if store is not None and isinstance(getattr(store, "global_settings", None), dict):
            return bool(store.global_settings.get("guest_mode_enabled", False))
        return False

    def _is_definitive_tracker_pinned(self) -> bool:
        """Return True if Steve's definitive BLE tracker or workstation load pins him to this room."""
        return bool(
            isinstance(self.last_spatial_estimate, dict)
            and self.last_spatial_estimate.get("definitive_tracker_pinned")
        )

    def notify_adjacent_occupancy(self, from_room_name: str) -> bool:
        """Clear vacating timer immediately if an adjacent connected room just detected an occupant."""
        if self._is_guest_mode_active() or self._is_definitive_tracker_pinned():
            return False
        if self.state_machine.handle_adjacent_room_occupied(from_room_name):
            self._last_adjacent_arrival = f"Entered from {from_room_name}"
            self._record_timeline_snapshot()
            self.async_update_listeners()
            return True
        return False

    def _notify_connected_rooms_if_active(self) -> None:
        """Notify connected adjacent rooms when this room actively detects an occupant."""
        notify_connected_rooms_if_active(self)

    def _record_timeline_snapshot(self) -> None:
        """Record a compact sensor & state snapshot into PDDStore's rolling timeline buffer."""
        record_coordinator_timeline_snapshot(self)

    def _eval_conditions_and_update(self) -> None:
        """Evaluate sustaining conditions and Bayesian observations."""
        if not self.hass or not hasattr(self.hass, "states"):
            return

        any_active, descs = evaluate_all(
            self.conditions,
            lambda eid: (
                None
                if self.actuation_tracker.is_entity_auto_latched(eid)
                else _safe_state_getter(self.hass, eid)
            ),
        )
        self.state_machine.handle_conditions(any_active, descs)
        self._eval_bayesian_and_update()

    @callback
    def _handle_actuator_change(self, event: Any) -> None:
        """Handle manual wall switch, Google Assistant voice, or UI actuation event."""
        process_coordinator_actuator_event(self, event)

    @callback
    def _handle_trigger_change(self, event: Any) -> None:
        """Handle trigger sensor event with transient shielding and rate-limiting cooldown."""
        entity_id = event.data.get("entity_id")
        if entity_id:
            eid = str(entity_id)
            old_state = event.data.get("old_state")
            new_state = event.data.get("new_state")
            was_on = old_state is not None and getattr(old_state, "state", None) in (
                "on",
                "playing",
                "home",
            )
            is_on = new_state is not None and getattr(new_state, "state", None) in (
                "on",
                "playing",
                "home",
            )
            if is_on and not was_on:
                self._trigger_on_since[eid] = time.time()
            elif not is_on and was_on:
                # Fresh off -> on transition re-arms a previously suppressed stale trigger.
                self._trigger_on_since.pop(eid, None)
                self._stuck_suppressed_entities.discard(eid)
        process_coordinator_trigger_event(self, event)

    @callback
    def _handle_boundary_change(self, event: Any) -> None:
        """Handle boundary sensor event (door open/close)."""
        to_state = event.data.get("new_state")
        entity_id = event.data.get("entity_id")
        if not to_state or not entity_id:
            return

        is_open = to_state.state in ("on", "open")
        self.state_machine.handle_boundary(entity_id, is_open)
        if self.hass:
            from .house_perimeter import get_house_perimeter_tracker

            get_house_perimeter_tracker(self.hass).handle_door_state_change(
                entity_id=entity_id,
                is_open=is_open,
            )
        self.async_update_listeners()

    @callback
    def _handle_condition_change(self, event: Any) -> None:
        """Handle condition entity state change."""
        self._eval_conditions_and_update()
        self.async_update_listeners()

    @callback
    def _handle_bayesian_change(self, event: Any) -> None:
        """Handle state change on a Bayesian observation entity."""
        self._eval_bayesian_and_update()
        self.async_update_listeners()

    async def _async_handle_tick(self, _now: Any) -> None:
        """Execute 1 second tick."""
        action = self.state_machine.handle_tick(1)
        if action == "REQUEST_LLM_VERIFY":
            if self._is_guest_mode_active():
                self.state_machine.handle_llm_result(
                    False, "Skipped LLM verification in Guest Mode"
                )
                self.async_update_listeners()
                return
            self.async_update_listeners()
            await self.async_run_llm_verification()
        elif action == "VACATED":
            self.async_update_listeners()
        elif self.state_machine.box_state == BoxState.TIMER_ACTIVE:
            self.async_update_listeners()
        else:
            await self._async_maybe_reverify_sealed()
            await self._async_maybe_reverify_stuck_triggers()

    async def _async_maybe_reverify_sealed(self) -> None:
        """Periodically Vision-AI verify a bounded sealed room that has no sustaining evidence.

        Prevents a room that sealed while only transient optical motion was active from
        remaining latched in `occupied_sealed` forever once it is actually empty.
        """
        sm = self.state_machine
        if not sm.llm_enabled or self._is_guest_mode_active():
            return
        now = time.time()
        if not sm.sealed_reverification_due(now, float(self.sealed_verify_timeout)):
            return
        sm.mark_sealed_reverification(now)
        self.async_update_listeners()
        await self.async_run_llm_verification(vacate_on_failure=False)

    async def _async_maybe_reverify_stuck_triggers(self) -> None:
        """Detect a stuck camera person sub-zone held ON with no corroboration and re-verify it.

        A static false-positive (laundry pile, chair, clothing) in a Frigate sub-zone can
        stay `on` for hours. When it has no PIR/BLE corroboration and exceeds the stuck
        timeout, a Vision AI pass is run; a vacant verdict suppresses the trigger until it
        transitions off -> on again.
        """
        sm = self.state_machine
        if not sm.llm_enabled or self._is_guest_mode_active():
            return
        now = time.time()
        timeout = float(self.trigger_stuck_timeout)
        for eid in list(sm._active_triggers):
            if eid in self._stuck_suppressed_entities:
                continue
            if not _is_camera_person_entity(eid):
                continue
            on_since = self._trigger_on_since.get(eid)
            if on_since is None:
                self._trigger_on_since[eid] = now
                continue
            if (now - on_since) < timeout:
                continue
            if self._room_has_corroboration(eid):
                continue
            if (now - self._stuck_verify_ts.get(eid, 0.0)) < timeout:
                continue
            self._stuck_verify_ts[eid] = now
            await self.async_run_llm_verification(vacate_on_failure=False)
            result = sm.last_llm_result or {}
            if not result.get("person_detected", False):
                self._stuck_suppressed_entities.add(eid)
                sm.handle_trigger(eid, False)
                self.async_update_listeners()
                _LOGGER.info(
                    "Suppressed stuck camera trigger %s in %s after vacant Vision AI verdict",
                    eid,
                    self.room_name,
                )
            break

    def _room_has_corroboration(self, exclude_eid: str) -> bool:
        """Return True if the room has independent PIR or BLE evidence besides the camera trigger."""
        from .spatial_catalog import BLE_TRACKER_ENTITIES, _normalize_ble_area_to_room

        for eid in self.trigger_entities:
            if eid == exclude_eid or _is_camera_person_entity(eid):
                continue
            st = _safe_state_getter(self.hass, eid)
            if st is not None and str(st.state).lower() in ("on", "playing", "home"):
                return True
        for ble_eid in BLE_TRACKER_ENTITIES:
            st = _safe_state_getter(self.hass, ble_eid)
            if st is not None and _normalize_ble_area_to_room(str(st.state)) == self.room_name:
                return True
        return False

    async def async_run_llm_verification(self, *, vacate_on_failure: bool = True) -> None:
        """Capture snapshot and run LLM verification."""
        image_bytes = await self.verifier.async_acquire_snapshot(
            camera_entity_id=self.camera_entity,
            direct_url=self.camera_snapshot_url,
        )
        if not image_bytes:
            _LOGGER.warning("Could not acquire snapshot for %s, vacating", self.room_name)
            if vacate_on_failure:
                self.state_machine.handle_llm_result(False, "Failed to capture snapshot")
                self.async_update_listeners()
            return

        detected, reasoning = await self.verifier.async_verify(image_bytes)
        self.state_machine.handle_llm_result(detected, reasoning)
        self.async_update_listeners()

    async def async_manual_verify(self) -> None:
        """Trigger immediate LLM verification."""
        self.state_machine.box_state = BoxState.LLM_VERIFYING
        self.async_update_listeners()
        await self.async_run_llm_verification()

    async def async_explain_presence(self, use_llm: bool = True) -> dict[str, Any]:
        """Return natural-language explanation and YAML equivalents for this room."""
        self._eval_bayesian_and_update()
        live_explanation = self.state_machine.build_natural_language_explanation()
        result = await self.verifier.async_explain_presence(
            room_config=self.config,
            live_explanation=live_explanation,
            use_llm=use_llm,
        )
        result["entry_id"] = self.entry_id
        result["bayesian_probability_pct"] = self.state_machine.bayesian_probability_pct
        result["box_state"] = str(self.state_machine.box_state)
        result["is_present"] = self.state_machine.is_present
        return result

    async def async_send_test_notification(
        self, service: str | None = None, channel: str | None = None, verbosity: str | None = None
    ) -> bool:
        """Send a test diagnostic notification to verify Slack connectivity."""
        return await async_send_coordinator_test_notification(
            self, service=service, channel=channel, verbosity=verbosity
        )
