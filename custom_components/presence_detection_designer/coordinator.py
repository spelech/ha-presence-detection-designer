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
    evaluate_bayesian,
    explain_config_in_natural_language,
)
from .condition_evaluator import evaluate_all
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
    CONF_SUSTAINING_CONDITIONS,
    CONF_TRIGGER_ENTITIES,
    DATA_STORE,
    DEFAULT_BAYESIAN_PRIOR,
    DEFAULT_BAYESIAN_THRESHOLD,
    DEFAULT_EXTEND_TIMEOUT,
    DEFAULT_GRACE_TIMEOUT,
    DEFAULT_INACTIVITY_TIMEOUT,
    DEFAULT_LLM_PROMPT,
    DOMAIN,
    EVENT_PRESENCE_TRANSITION,
    BoxState,
    LLMProviderType,
    Mode,
)
from .llm_verifier import LLMVerifier
from .notifications import NotificationDispatcher
from .state_machine import RoomStateMachine

_LOGGER = logging.getLogger(__name__)


def _safe_state_getter(hass: Any, entity_id: str) -> Any:
    """Return HA state object only if its `.state` attribute is a concrete string."""
    if not hass or not hasattr(hass, "states"):
        return None
    state_obj = hass.states.get(entity_id)
    if state_obj is None:
        return None
    if not isinstance(getattr(state_obj, "state", None), str):
        return None
    return state_obj


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
        self.last_bayesian_eval: BayesianEvaluation | None = None
        self.state_machine: RoomStateMachine = None  # type: ignore[assignment]

        self._apply_config_fields(self.config, preserve_state=False)

    def _resolve_global_llm_defaults(self, config: dict[str, Any]) -> dict[str, Any]:
        """Merge global_settings from PDDStore for any unset LLM fields."""
        from .const import DATA_STORE, DOMAIN

        gs: dict[str, Any] = {}
        if self.hass and isinstance(getattr(self.hass, "data", None), dict):
            store = self.hass.data.get(DOMAIN, {}).get(DATA_STORE)
            if store is not None and hasattr(store, "global_settings"):
                gs = store.global_settings or {}

        return {
            CONF_LLM_PROVIDER_TYPE: (
                config.get(CONF_LLM_PROVIDER_TYPE)
                or gs.get("llm_provider_type")
                or LLMProviderType.VISION_API
            ),
            CONF_LLM_AGENT_ID: config.get(CONF_LLM_AGENT_ID) or gs.get("llm_agent_id"),
            CONF_LLM_API_URL: config.get(CONF_LLM_API_URL) or gs.get("llm_api_url"),
            CONF_LLM_API_KEY: config.get(CONF_LLM_API_KEY) or gs.get("llm_api_key"),
            CONF_LLM_MODEL: config.get(CONF_LLM_MODEL) or gs.get("llm_model"),
        }

    def _apply_config_fields(self, config: dict[str, Any], preserve_state: bool = False) -> None:
        """Populate coordinator attributes and state machine from config dict."""
        self.config = dict(config)
        self.room_name: str = config.get(CONF_ROOM_NAME, "Room")
        self.area_id: str | None = config.get(CONF_AREA_ID)
        self.boundary_entities: list[str] = list(config.get(CONF_BOUNDARY_ENTITIES, []) or [])
        self.trigger_entities: list[str] = list(config.get(CONF_TRIGGER_ENTITIES, []) or [])
        self.connected_rooms: list[str] = [
            str(r) for r in (config.get(CONF_CONNECTED_ROOMS, []) or []) if r
        ]
        self.conditions: list[dict[str, Any]] = list(
            config.get(CONF_SUSTAINING_CONDITIONS, []) or []
        )

        # Bayesian configuration
        self.bayesian_enabled: bool = bool(config.get(CONF_BAYESIAN_ENABLED, True))
        self.bayesian_prior: float = float(config.get(CONF_BAYESIAN_PRIOR, DEFAULT_BAYESIAN_PRIOR))
        self.bayesian_threshold: float = float(
            config.get(CONF_BAYESIAN_THRESHOLD, DEFAULT_BAYESIAN_THRESHOLD)
        )
        self.has_explicit_bayesian: bool = bool(config.get(CONF_BAYESIAN_OBSERVATIONS))
        self.bayesian_observations: list[dict[str, Any]] = build_effective_observations(config)

        mode_val = config.get(CONF_MODE)
        if not mode_val:
            self.mode = Mode.BOUNDED if len(self.boundary_entities) > 0 else Mode.OPEN
        else:
            self.mode = Mode(mode_val)

        # Slack & Notification configuration
        self.notify_slack: bool = bool(config.get(CONF_NOTIFY_SLACK, False))
        self.notify_on_occupied: bool = bool(config.get(CONF_NOTIFY_ON_OCCUPIED, True))
        self.notify_on_cleared: bool = bool(config.get(CONF_NOTIFY_ON_CLEARED, True))

        inactivity_timeout = int(config.get(CONF_INACTIVITY_TIMEOUT, DEFAULT_INACTIVITY_TIMEOUT))
        grace_timeout = int(config.get(CONF_GRACE_TIMEOUT, DEFAULT_GRACE_TIMEOUT))
        extend_timeout = int(config.get(CONF_EXTEND_TIMEOUT, DEFAULT_EXTEND_TIMEOUT))
        llm_enabled = bool(config.get(CONF_LLM_ENABLED, False))

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
        """Notify all registered entity listeners."""
        for update_callback in self._listeners:
            try:
                update_callback()
            except Exception as err:  # noqa: BLE001
                _LOGGER.error("Error updating presence listener: %s", err)

        # Check for presence transition event
        curr_presence = self.state_machine.is_present
        if curr_presence != self._previous_presence:
            from_state = "occupied" if self._previous_presence else "clear"
            to_state = "occupied" if curr_presence else "clear"
            self._previous_presence = curr_presence

            now_ts = time.time()
            duration_sec: float | None = None
            if to_state == "occupied":
                self._occupied_start_time = now_ts
            elif self._occupied_start_time is not None:
                duration_sec = now_ts - self._occupied_start_time
                self._occupied_start_time = None

            if self.hass and hasattr(self.hass, "bus"):
                try:
                    self.hass.bus.async_fire(
                        EVENT_PRESENCE_TRANSITION,
                        {
                            "entry_id": self.entry_id,
                            "room_name": self.room_name,
                            "presence": curr_presence,
                            "from_state": from_state,
                            "to_state": to_state,
                            "box_state": self.state_machine.box_state,
                            "bayesian_probability": self.state_machine.bayesian_probability,
                            "bayesian_probability_pct": self.state_machine.bayesian_probability_pct,
                            "natural_language_explanation": (
                                self.state_machine.build_natural_language_explanation()
                            ),
                            "last_trigger": self.state_machine.last_trigger_entity,
                            "active_conditions": self.state_machine.active_conditions,
                            "duration_seconds": duration_sec,
                        },
                    )
                except Exception:  # noqa: BLE001
                    pass

            # Dispatch Slack notification if enabled
            if self.hass and self.notify_slack:
                global_settings: dict[str, Any] = {}
                if hasattr(self.hass, "data") and isinstance(self.hass.data, dict):
                    store = self.hass.data.get(DOMAIN, {}).get(DATA_STORE)
                    if store is not None and hasattr(store, "global_settings"):
                        global_settings = store.global_settings or {}

                curr_eval: dict[str, Any] = {
                    "probability": self.state_machine.bayesian_probability,
                    "is_occupied": self.state_machine.is_present,
                    "active_entities": [self.state_machine.last_trigger_entity]
                    if self.state_machine.last_trigger_entity
                    else [],
                    "active_sustaining_conditions": self.state_machine.active_conditions,
                    "driver_entity": self.state_machine.last_trigger_entity,
                }
                if self.last_bayesian_eval:
                    curr_eval["probability"] = self.last_bayesian_eval.probability
                    curr_eval["active_entities"] = list(
                        self.last_bayesian_eval.active_observations.keys()
                    )

                attribution = self._notification_dispatcher.resolve_transition_driver(
                    room_id=self.entry_id,
                    room_name=self.room_name,
                    from_state=from_state,
                    to_state=to_state,
                    room_config=self.config,
                    prev_eval=None,
                    curr_eval=curr_eval,
                    adjacent_context=self._last_adjacent_arrival,
                    duration_seconds=duration_sec,
                )
                self._last_adjacent_arrival = None

                if hasattr(self.hass, "async_create_task"):
                    self.hass.async_create_task(
                        self._notification_dispatcher.async_dispatch_notification(
                            self.hass,
                            attribution,
                            global_settings,
                            self.config,
                        )
                    )

    async def async_setup(self) -> None:
        """Start listening to entity state changes and timer ticks."""
        if not self.hass or not hasattr(self.hass, "states"):
            return

        import datetime

        from homeassistant.helpers.event import (
            async_track_state_change_event,
            async_track_time_interval,
        )

        # Track triggers
        if self.trigger_entities:
            unsub = async_track_state_change_event(
                self.hass,
                self.trigger_entities,
                self._handle_trigger_change,
            )
            self._unsub_trackers.append(unsub)

        # Track boundary doors
        if self.boundary_entities:
            unsub = async_track_state_change_event(
                self.hass,
                self.boundary_entities,
                self._handle_boundary_change,
            )
            self._unsub_trackers.append(unsub)

        # Track sustaining condition entities
        cond_entities = [c["entity_id"] for c in self.conditions if c.get("entity_id")]
        if cond_entities:
            unsub = async_track_state_change_event(
                self.hass,
                cond_entities,
                self._handle_condition_change,
            )
            self._unsub_trackers.append(unsub)

        # Track additional Bayesian observation entities
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

        # Track 1-second timer tick
        unsub_tick = async_track_time_interval(
            self.hass,
            self._async_handle_tick,
            datetime.timedelta(seconds=1),
        )
        self._unsub_trackers.append(unsub_tick)

        # Initial evaluation of live states on startup
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

        # 1. Boundaries
        for b_eid in self.boundary_entities:
            st_obj = _safe_state_getter(self.hass, b_eid)
            if st_obj is not None:
                is_open = st_obj.state in ("on", "open")
                self.state_machine.handle_boundary(b_eid, is_open)

        # 2. Instant triggers
        for t_eid in self.trigger_entities:
            st_obj = _safe_state_getter(self.hass, t_eid)
            if st_obj is not None:
                is_active = st_obj.state in ("on", "playing", "home")
                if is_active:
                    self.state_machine.handle_trigger(t_eid, True)

        # 3. Sustaining conditions & Bayesian evaluation
        self._eval_conditions_and_update()

    def _eval_bayesian_and_update(self) -> BayesianEvaluation | None:
        """Evaluate Bayesian sensor fusion across all configured observations."""
        if not self.hass or not hasattr(self.hass, "states") or not self.bayesian_enabled:
            return None

        evaluation = evaluate_bayesian(
            self.bayesian_observations,
            lambda eid: _safe_state_getter(self.hass, eid),
            prior=self.bayesian_prior,
            threshold=self.bayesian_threshold,
        )
        self.last_bayesian_eval = evaluation
        self.state_machine.handle_bayesian(
            probability=evaluation.probability,
            probability_pct=evaluation.probability_pct,
            is_occupied=evaluation.is_occupied,
            summary=evaluation.natural_language_summary,
            active_observations=evaluation.active_observations,
            inactive_observations=evaluation.inactive_observations,
            trigger_state_machine=self.has_explicit_bayesian,
        )
        self._record_timeline_snapshot()
        if evaluation.is_occupied and self.has_explicit_bayesian:
            self._notify_connected_rooms_if_active()
        return evaluation

    def notify_adjacent_occupancy(self, from_room_name: str) -> bool:
        """Clear vacating timer immediately if an adjacent connected room just detected an occupant."""
        if self.state_machine.handle_adjacent_room_occupied(from_room_name):
            self._last_adjacent_arrival = f"Entered from {from_room_name}"
            self._record_timeline_snapshot()
            self.async_update_listeners()
            return True
        return False

    def _notify_connected_rooms_if_active(self) -> None:
        """Notify connected adjacent rooms when this room actively detects an occupant."""
        from .const import DOMAIN

        if not self.hass or not isinstance(getattr(self.hass, "data", None), dict):
            return
        if not self.state_machine.is_present or self.state_machine.box_state not in (
            BoxState.OCCUPIED,
            BoxState.OCCUPIED_SEALED,
            BoxState.OCCUPIED_UNSEALED,
        ):
            return

        domain_data = self.hass.data.get(DOMAIN, {})
        if not isinstance(domain_data, dict):
            return

        my_tokens = {
            self.room_name.strip().lower(),
            self.entry_id.strip().lower(),
            self.room_name.strip().lower().replace("'", "").replace(" ", "_"),
        }
        if self.area_id:
            my_tokens.add(str(self.area_id).strip().lower())

        my_connected = {r.strip().lower() for r in self.connected_rooms if r}

        for other in list(domain_data.values()):
            if other is self or not isinstance(other, RoomPresenceCoordinator):
                continue
            other_tokens = {
                other.room_name.strip().lower(),
                other.entry_id.strip().lower(),
                other.room_name.strip().lower().replace("'", "").replace(" ", "_"),
            }
            if other.area_id:
                other_tokens.add(str(other.area_id).strip().lower())
            other_connected = {r.strip().lower() for r in other.connected_rooms if r}

            if (my_connected & other_tokens) or (other_connected & my_tokens):
                other.notify_adjacent_occupancy(self.room_name)

    def _record_timeline_snapshot(self) -> None:
        """Record a compact sensor & state snapshot into PDDStore's rolling timeline buffer."""
        from .const import DATA_STORE, DOMAIN

        if not self.hass or not isinstance(getattr(self.hass, "data", None), dict):
            return
        store = self.hass.data.get(DOMAIN, {}).get(DATA_STORE)
        if store is None or not hasattr(store, "record_timeline_event"):
            return

        entity_states: dict[str, str] = {}
        tracked_eids: set[str] = set(self.boundary_entities) | set(self.trigger_entities)
        for cond in self.conditions:
            if isinstance(cond, dict) and cond.get("entity_id"):
                tracked_eids.add(str(cond["entity_id"]))
        for obs in self.bayesian_observations:
            if isinstance(obs, dict) and obs.get("entity_id"):
                tracked_eids.add(str(obs["entity_id"]))

        for eid in sorted(tracked_eids):
            st_obj = _safe_state_getter(self.hass, eid)
            if st_obj is not None:
                entity_states[eid] = str(st_obj.state)

        store.record_timeline_event(
            self.entry_id,
            {
                "is_present": self.state_machine.is_present,
                "box_state": str(self.state_machine.box_state),
                "probability_pct": self.state_machine.bayesian_probability_pct,
                "entity_states": entity_states,
            },
        )

    def _eval_conditions_and_update(self) -> None:
        """Evaluate sustaining conditions and Bayesian observations."""
        if not self.hass or not hasattr(self.hass, "states"):
            return

        any_active, descs = evaluate_all(
            self.conditions,
            lambda eid: _safe_state_getter(self.hass, eid),
        )
        self.state_machine.handle_conditions(any_active, descs)
        self._eval_bayesian_and_update()

    @callback
    def _handle_trigger_change(self, event: Any) -> None:
        """Handle trigger sensor event."""
        to_state = event.data.get("new_state")
        entity_id = event.data.get("entity_id")
        if not to_state or not entity_id:
            return

        is_active = to_state.state in ("on", "playing", "home")
        self.state_machine.handle_trigger(entity_id, is_active)
        self._eval_bayesian_and_update()
        if is_active:
            self._notify_connected_rooms_if_active()
        self.async_update_listeners()

    @callback
    def _handle_boundary_change(self, event: Any) -> None:
        """Handle boundary sensor event (door open/close)."""
        to_state = event.data.get("new_state")
        entity_id = event.data.get("entity_id")
        if not to_state or not entity_id:
            return

        is_open = to_state.state in ("on", "open")
        self.state_machine.handle_boundary(entity_id, is_open)
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
            self.async_update_listeners()
            await self.async_run_llm_verification()
        elif action == "VACATED":
            self.async_update_listeners()
        elif self.state_machine.box_state == BoxState.TIMER_ACTIVE:
            self.async_update_listeners()

    async def async_run_llm_verification(self) -> None:
        """Capture snapshot and run LLM verification."""
        image_bytes = await self.verifier.async_acquire_snapshot(
            camera_entity_id=self.camera_entity,
            direct_url=self.camera_snapshot_url,
        )
        if not image_bytes:
            _LOGGER.warning("Could not acquire snapshot for %s, vacating", self.room_name)
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
        self,
        service: str | None = None,
        channel: str | None = None,
    ) -> bool:
        """Send a test diagnostic notification to verify Slack connectivity."""
        from .notifications import TransitionAttribution

        global_settings: dict[str, Any] = {}
        if self.hass and hasattr(self.hass, "data") and isinstance(self.hass.data, dict):
            store = self.hass.data.get(DOMAIN, {}).get(DATA_STORE)
            if store is not None and hasattr(store, "global_settings"):
                global_settings = dict(store.global_settings or {})

        if service:
            global_settings["slack_notify_service"] = service
        if channel:
            global_settings["slack_channel"] = channel

        attribution = TransitionAttribution(
            room_id=self.entry_id,
            room_name=self.room_name,
            from_state="clear",
            to_state="occupied",
            primary_driver="Test Trigger (Manual Studio Verification)",
            driver_type="sensor",
            confidence_pct=95.0,
            threshold_pct=75.0,
            active_sensors=["test_sensor.manual_ping"],
            sustaining_conditions=[],
            arrival_context="Manual Studio Test",
            duration_occupied_str=None,
        )
        return await self._notification_dispatcher.async_dispatch_notification(
            self.hass,
            attribution,
            global_settings,
            {"notify_slack": True, "notify_on_occupied": True},
        )
