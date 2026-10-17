"""Coordinator managing room state machine, Bayesian fusion, entity tracking, and LLM verification."""

from __future__ import annotations

import logging
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
    CONF_ROOM_NAME,
    CONF_SUSTAINING_CONDITIONS,
    CONF_TRIGGER_ENTITIES,
    DEFAULT_BAYESIAN_PRIOR,
    DEFAULT_BAYESIAN_THRESHOLD,
    DEFAULT_EXTEND_TIMEOUT,
    DEFAULT_GRACE_TIMEOUT,
    DEFAULT_INACTIVITY_TIMEOUT,
    DEFAULT_LLM_PROMPT,
    EVENT_PRESENCE_TRANSITION,
    BoxState,
    LLMProviderType,
    Mode,
)
from .llm_verifier import LLMVerifier
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
        self.config = config

        self.room_name: str = config.get(CONF_ROOM_NAME, "Room")
        self.area_id: str | None = config.get(CONF_AREA_ID)
        self.boundary_entities: list[str] = list(config.get(CONF_BOUNDARY_ENTITIES, []) or [])
        self.trigger_entities: list[str] = list(config.get(CONF_TRIGGER_ENTITIES, []) or [])
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

        inactivity_timeout = int(config.get(CONF_INACTIVITY_TIMEOUT, DEFAULT_INACTIVITY_TIMEOUT))
        grace_timeout = int(config.get(CONF_GRACE_TIMEOUT, DEFAULT_GRACE_TIMEOUT))
        extend_timeout = int(config.get(CONF_EXTEND_TIMEOUT, DEFAULT_EXTEND_TIMEOUT))
        llm_enabled = bool(config.get(CONF_LLM_ENABLED, False))

        self.state_machine = RoomStateMachine(
            name=self.room_name,
            mode=self.mode,
            inactivity_timeout=inactivity_timeout,
            grace_timeout=grace_timeout,
            extend_timeout=extend_timeout,
            llm_enabled=llm_enabled,
            bayesian_prior=self.bayesian_prior,
            bayesian_threshold=self.bayesian_threshold,
        )

        self.verifier = LLMVerifier(
            hass=hass,
            provider_type=config.get(CONF_LLM_PROVIDER_TYPE, LLMProviderType.VISION_API),
            agent_id=config.get(CONF_LLM_AGENT_ID),
            api_url=config.get(CONF_LLM_API_URL),
            api_key=config.get(CONF_LLM_API_KEY),
            model=config.get(CONF_LLM_MODEL),
            prompt=config.get(CONF_LLM_PROMPT, DEFAULT_LLM_PROMPT),
        )

        self.camera_entity = config.get(CONF_CAMERA_ENTITY)
        self.camera_snapshot_url = config.get(CONF_CAMERA_SNAPSHOT_URL)

        self.rule_guide: str = explain_config_in_natural_language(config)
        self.yaml_representations: dict[str, str] = config_to_yaml_representations(config)
        self.last_bayesian_eval: BayesianEvaluation | None = None

        self._listeners: list[Callable[[], None]] = []
        self._unsub_trackers: list[Callable[[], None]] = []
        self._previous_presence = False

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
            self._previous_presence = curr_presence
            if self.hass and hasattr(self.hass, "bus"):
                try:
                    self.hass.bus.async_fire(
                        EVENT_PRESENCE_TRANSITION,
                        {
                            "entry_id": self.entry_id,
                            "room_name": self.room_name,
                            "presence": curr_presence,
                            "box_state": self.state_machine.box_state,
                            "bayesian_probability": self.state_machine.bayesian_probability,
                            "bayesian_probability_pct": self.state_machine.bayesian_probability_pct,
                            "natural_language_explanation": (
                                self.state_machine.build_natural_language_explanation()
                            ),
                            "last_trigger": self.state_machine.last_trigger_entity,
                            "active_conditions": self.state_machine.active_conditions,
                        },
                    )
                except Exception:  # noqa: BLE001
                    pass

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

    def async_unload(self) -> None:
        """Unsubscribe all entity listeners and timers."""
        for unsub in self._unsub_trackers:
            try:
                unsub()
            except Exception:  # noqa: BLE001
                pass
        self._unsub_trackers.clear()
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
        return evaluation

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
