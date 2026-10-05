"""Coordinator managing room state machine, entity tracking, and LLM verification."""

from __future__ import annotations

import logging
from collections.abc import Callable
from typing import Any

from .condition_evaluator import evaluate_all
from .const import (
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


class RoomPresenceCoordinator:
    """Coordinates state machine, entity listeners, and LLM verification for one room."""

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
        self.boundary_entities: list[str] = config.get(CONF_BOUNDARY_ENTITIES, [])
        self.trigger_entities: list[str] = config.get(CONF_TRIGGER_ENTITIES, [])
        self.conditions: list[dict[str, Any]] = config.get(CONF_SUSTAINING_CONDITIONS, [])

        mode_val = config.get(CONF_MODE)
        if not mode_val:
            self.mode = Mode.BOUNDED if len(self.boundary_entities) > 0 else Mode.OPEN
        else:
            self.mode = Mode(mode_val)

        inactivity_timeout = config.get(CONF_INACTIVITY_TIMEOUT, DEFAULT_INACTIVITY_TIMEOUT)
        grace_timeout = config.get(CONF_GRACE_TIMEOUT, DEFAULT_GRACE_TIMEOUT)
        extend_timeout = config.get(CONF_EXTEND_TIMEOUT, DEFAULT_EXTEND_TIMEOUT)
        llm_enabled = config.get(CONF_LLM_ENABLED, False)

        self.state_machine = RoomStateMachine(
            name=self.room_name,
            mode=self.mode,
            inactivity_timeout=inactivity_timeout,
            grace_timeout=grace_timeout,
            extend_timeout=extend_timeout,
            llm_enabled=llm_enabled,
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

        # Track 1-second timer tick
        unsub_tick = async_track_time_interval(
            self.hass,
            self._async_handle_tick,
            datetime.timedelta(seconds=1),
        )
        self._unsub_trackers.append(unsub_tick)

        # Initial evaluation of conditions
        self._eval_conditions_and_update()

    def async_unload(self) -> None:
        """Unsubscribe all entity listeners and timers."""
        for unsub in self._unsub_trackers:
            try:
                unsub()
            except Exception:  # noqa: BLE001
                pass
        self._unsub_trackers.clear()
        self._listeners.clear()

    def _eval_conditions_and_update(self) -> None:
        """Evaluate sustaining conditions."""
        if not self.hass or not hasattr(self.hass, "states"):
            return

        any_active, descs = evaluate_all(
            self.conditions,
            lambda eid: self.hass.states.get(eid),
        )
        self.state_machine.handle_conditions(any_active, descs)

    def _handle_trigger_change(self, event: Any) -> None:
        """Handle trigger sensor event."""
        to_state = event.data.get("new_state")
        entity_id = event.data.get("entity_id")
        if not to_state or not entity_id:
            return

        is_active = to_state.state in ("on", "playing", "home")
        self.state_machine.handle_trigger(entity_id, is_active)
        self.async_update_listeners()

    def _handle_boundary_change(self, event: Any) -> None:
        """Handle boundary sensor event (door open/close)."""
        to_state = event.data.get("new_state")
        entity_id = event.data.get("entity_id")
        if not to_state or not entity_id:
            return

        is_open = to_state.state in ("on", "open")
        self.state_machine.handle_boundary(entity_id, is_open)
        self.async_update_listeners()

    def _handle_condition_change(self, event: Any) -> None:
        """Handle condition entity state change."""
        self._eval_conditions_and_update()
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
