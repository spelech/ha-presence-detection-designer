"""Wasp-in-a-Box State Machine for Presence Detection Designer."""

from __future__ import annotations

import datetime
from typing import Any

from .const import (
    DEFAULT_EXTEND_TIMEOUT,
    DEFAULT_GRACE_TIMEOUT,
    DEFAULT_INACTIVITY_TIMEOUT,
    BoxState,
    Mode,
)


class RoomStateMachine:
    """State machine governing room occupancy using Wasp-in-a-Box principles."""

    def __init__(
        self,
        name: str,
        mode: Mode = Mode.OPEN,
        inactivity_timeout: int = DEFAULT_INACTIVITY_TIMEOUT,
        grace_timeout: int = DEFAULT_GRACE_TIMEOUT,
        extend_timeout: int = DEFAULT_EXTEND_TIMEOUT,
        llm_enabled: bool = False,
    ) -> None:
        self.name = name
        self.mode = mode
        self.inactivity_timeout = inactivity_timeout
        self.grace_timeout = grace_timeout
        self.extend_timeout = extend_timeout
        self.llm_enabled = llm_enabled

        self.is_present = False
        self.box_state = BoxState.IDLE_CLEAR
        self.vacating_countdown = 0
        self.active_conditions: list[str] = []
        self.last_trigger_entity: str | None = None
        self.override = False
        self.last_llm_result: dict[str, Any] | None = None

        # Tracking active sensors
        self._active_triggers: set[str] = set()
        self._open_boundaries: set[str] = set()

    def set_override(self, enabled: bool) -> None:
        """Set manual override state."""
        self.override = enabled
        if enabled:
            self.is_present = True
            self.box_state = BoxState.OVERRIDE
            self.vacating_countdown = 0
        else:
            self._recalculate_state()

    def handle_trigger(self, entity_id: str, is_active: bool) -> None:
        """Handle PIR/Frigate trigger state update."""
        if self.override:
            return

        if is_active:
            self._active_triggers.add(entity_id)
            self.last_trigger_entity = entity_id
            self.is_present = True
            self.vacating_countdown = 0

            if self.mode == Mode.BOUNDED:
                if len(self._open_boundaries) > 0:
                    self.box_state = BoxState.OCCUPIED_UNSEALED
                else:
                    self.box_state = BoxState.OCCUPIED_SEALED
            else:
                self.box_state = BoxState.OCCUPIED_SEALED
        else:
            self._active_triggers.discard(entity_id)
            if not self._active_triggers and not self.active_conditions:
                if (
                    self.mode == Mode.BOUNDED
                    and len(self._open_boundaries) == 0
                    and self.box_state == BoxState.OCCUPIED_SEALED
                ):
                    # Sealed box: doors closed and was sealed, keep presence sealed without motion!
                    pass
                else:
                    self.box_state = BoxState.TIMER_ACTIVE
                    timeout = (
                        self.grace_timeout if self.mode == Mode.BOUNDED else self.inactivity_timeout
                    )
                    self.vacating_countdown = timeout

    def handle_boundary(self, entity_id: str, is_open: bool) -> None:
        """Handle perimeter boundary sensor update (door/gate)."""
        if self.override:
            return

        if is_open:
            self._open_boundaries.add(entity_id)
            if self.is_present:
                self.box_state = BoxState.OCCUPIED_UNSEALED
        else:
            self._open_boundaries.discard(entity_id)
            if self.is_present and self.mode == Mode.BOUNDED:
                if self._active_triggers or self.active_conditions:
                    # Door closed with someone actively moving or sustained condition
                    self.box_state = BoxState.OCCUPIED_SEALED
                    self.vacating_countdown = 0
                else:
                    # Door closed without active motion: begin grace countdown
                    self.box_state = BoxState.TIMER_ACTIVE
                    self.vacating_countdown = self.grace_timeout

    def handle_conditions(self, any_active: bool, active_descriptions: list[str]) -> None:
        """Handle sustaining conditions update (TV, media, lights)."""
        self.active_conditions = active_descriptions
        if self.override:
            return

        if any_active:
            self.is_present = True
            self.vacating_countdown = 0
            if self.mode == Mode.BOUNDED and len(self._open_boundaries) > 0:
                self.box_state = BoxState.OCCUPIED_UNSEALED
            else:
                self.box_state = BoxState.OCCUPIED_SEALED
        else:
            if self.is_present and not self._active_triggers:
                if (
                    self.mode == Mode.BOUNDED
                    and len(self._open_boundaries) == 0
                    and self.box_state == BoxState.OCCUPIED_SEALED
                ):
                    # Still sealed in box
                    pass
                else:
                    self.box_state = BoxState.TIMER_ACTIVE
                    timeout = (
                        self.grace_timeout if self.mode == Mode.BOUNDED else self.inactivity_timeout
                    )
                    self.vacating_countdown = timeout

    def handle_tick(self, seconds: int = 1) -> str | None:
        """Tick down the vacating countdown timer if active."""
        if self.override:
            return None

        if self.box_state != BoxState.TIMER_ACTIVE:
            return None

        self.vacating_countdown = max(0, self.vacating_countdown - seconds)
        if self.vacating_countdown == 0:
            if self.llm_enabled:
                self.box_state = BoxState.LLM_VERIFYING
                return "REQUEST_LLM_VERIFY"
            else:
                self.is_present = False
                self.box_state = BoxState.IDLE_CLEAR
                return "VACATED"

        return None

    def handle_llm_result(self, person_detected: bool, reasoning: str = "") -> None:
        """Process result from LLM verification."""
        self.last_llm_result = {
            "timestamp": datetime.datetime.now().isoformat(),
            "person_detected": person_detected,
            "reason": reasoning,
        }

        if person_detected:
            self.is_present = True
            self.box_state = BoxState.TIMER_ACTIVE
            self.vacating_countdown = self.extend_timeout
        else:
            self.is_present = False
            self.box_state = BoxState.IDLE_CLEAR
            self.vacating_countdown = 0

    def _recalculate_state(self) -> None:
        """Recalculate presence state after override is turned off."""
        if self._active_triggers or self.active_conditions:
            self.is_present = True
            if self.mode == Mode.BOUNDED and len(self._open_boundaries) > 0:
                self.box_state = BoxState.OCCUPIED_UNSEALED
            else:
                self.box_state = BoxState.OCCUPIED_SEALED
        else:
            self.is_present = False
            self.box_state = BoxState.IDLE_CLEAR
            self.vacating_countdown = 0
