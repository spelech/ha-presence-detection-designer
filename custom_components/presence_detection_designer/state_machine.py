"""Wasp-in-a-Box + Bayesian State Machine for Presence Detection Designer."""

from __future__ import annotations

import datetime
from typing import Any

from .const import (
    DEFAULT_BAYESIAN_PRIOR,
    DEFAULT_BAYESIAN_THRESHOLD,
    DEFAULT_EXTEND_TIMEOUT,
    DEFAULT_GRACE_TIMEOUT,
    DEFAULT_INACTIVITY_TIMEOUT,
    BoxState,
    Mode,
)


class RoomStateMachine:
    """State machine governing room occupancy using Wasp-in-a-Box and Bayesian fusion."""

    def __init__(
        self,
        name: str,
        mode: Mode = Mode.OPEN,
        inactivity_timeout: int = DEFAULT_INACTIVITY_TIMEOUT,
        grace_timeout: int = DEFAULT_GRACE_TIMEOUT,
        extend_timeout: int = DEFAULT_EXTEND_TIMEOUT,
        llm_enabled: bool = False,
        bayesian_prior: float = DEFAULT_BAYESIAN_PRIOR,
        bayesian_threshold: float = DEFAULT_BAYESIAN_THRESHOLD,
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

        # Bayesian state tracking
        self.bayesian_probability: float = bayesian_prior
        self.bayesian_probability_pct: float = round(bayesian_prior * 100.0, 1)
        self.bayesian_prior: float = bayesian_prior
        self.bayesian_threshold: float = bayesian_threshold
        self.bayesian_occupied: bool = False
        self.bayesian_summary: str = (
            f"{round(bayesian_prior * 100.0, 1)}% probability (Below threshold; "
            f"threshold {round(bayesian_threshold * 100.0, 1)}%, "
            f"baseline {round(bayesian_prior * 100.0, 1)}%)."
        )
        self.active_observations: list[dict[str, Any]] = []
        self.inactive_observations: list[dict[str, Any]] = []

        # Tracking active sensors
        self._active_triggers: set[str] = set()
        self._open_boundaries: set[str] = set()
        self._bayesian_active: bool = False

    @property
    def is_perimeter_sealed(self) -> bool:
        """Return True if bounded perimeter has no open boundary doors."""
        return self.mode == Mode.BOUNDED and len(self._open_boundaries) == 0

    def set_override(self, enabled: bool) -> None:
        """Set manual override state."""
        self.override = enabled
        if enabled:
            self.is_present = True
            self.box_state = BoxState.OVERRIDE
            self.vacating_countdown = 0
        else:
            self._recalculate_state()

    def _activate_occupied_state(self) -> None:
        """Transition state machine into occupied state respecting boundary doors."""
        self.is_present = True
        self.vacating_countdown = 0
        if self.mode == Mode.BOUNDED and len(self._open_boundaries) > 0:
            self.box_state = BoxState.OCCUPIED_UNSEALED
        else:
            self.box_state = BoxState.OCCUPIED_SEALED

    def _check_begin_countdown_if_clear(self) -> None:
        """Start vacating countdown if all triggers, conditions, and Bayesian fusion are clear."""
        if not self._active_triggers and not self.active_conditions and not self._bayesian_active:
            if (
                self.mode == Mode.BOUNDED
                and len(self._open_boundaries) == 0
                and self.box_state == BoxState.OCCUPIED_SEALED
            ):
                # Sealed box: doors closed and was sealed, keep presence sealed without motion!
                return
            if self.is_present:
                self.box_state = BoxState.TIMER_ACTIVE
                timeout = (
                    self.grace_timeout if self.mode == Mode.BOUNDED else self.inactivity_timeout
                )
                self.vacating_countdown = timeout

    def handle_trigger(self, entity_id: str, is_active: bool) -> None:
        """Handle PIR/Frigate trigger state update."""
        if self.override:
            return

        if is_active:
            self._active_triggers.add(entity_id)
            self.last_trigger_entity = entity_id
            self._activate_occupied_state()
        else:
            self._active_triggers.discard(entity_id)
            self._check_begin_countdown_if_clear()

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
                if self._active_triggers or self.active_conditions or self._bayesian_active:
                    # Door closed with someone actively moving or sustained condition
                    self.box_state = BoxState.OCCUPIED_SEALED
                    self.vacating_countdown = 0
                else:
                    # Door closed without active motion: begin grace countdown
                    self.box_state = BoxState.TIMER_ACTIVE
                    self.vacating_countdown = self.grace_timeout

    def handle_conditions(self, any_active: bool, active_descriptions: list[str]) -> None:
        """Handle sustaining conditions update (TV, media, power draw)."""
        self.active_conditions = active_descriptions
        if self.override:
            return

        if any_active:
            self._activate_occupied_state()
        else:
            self._check_begin_countdown_if_clear()

    def handle_bayesian(
        self,
        probability: float,
        probability_pct: float,
        is_occupied: bool,
        summary: str,
        active_observations: list[dict[str, Any]] | None = None,
        inactive_observations: list[dict[str, Any]] | None = None,
        trigger_state_machine: bool = True,
    ) -> None:
        """Update Bayesian sensor fusion state and optionally drive occupancy."""
        self.bayesian_probability = probability
        self.bayesian_probability_pct = probability_pct
        self.bayesian_occupied = is_occupied
        self.bayesian_summary = summary
        self.active_observations = active_observations or []
        self.inactive_observations = inactive_observations or []

        if not trigger_state_machine or self.override:
            return

        if is_occupied:
            self._bayesian_active = True
            if self.active_observations and not self._active_triggers:
                self.last_trigger_entity = self.active_observations[0].get("entity_id")
            self._activate_occupied_state()
        else:
            was_active = self._bayesian_active
            self._bayesian_active = False
            if was_active:
                self._check_begin_countdown_if_clear()

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

    def build_natural_language_explanation(self) -> str:
        """Return a complete plain-English explanation of the room's current presence state."""
        state_label = "OCCUPIED" if self.is_present else "VACANT"
        parts = [f"{self.name}: {state_label} (state={self.box_state})."]

        if self.override:
            parts.append("Manual override lock is ON.")
            return " ".join(parts)

        parts.append(self.bayesian_summary)

        if self.active_conditions:
            parts.append(
                f"Sustaining conditions holding presence: {', '.join(self.active_conditions)}."
            )

        if self.mode == Mode.BOUNDED:
            if len(self._open_boundaries) == 0 and self.is_present:
                parts.append("Perimeter doors are closed (Wasp-in-a-Box sealed).")
            elif self._open_boundaries:
                parts.append(
                    f"Perimeter unsealed (open: {', '.join(sorted(self._open_boundaries))})."
                )

        if self.box_state == BoxState.TIMER_ACTIVE:
            parts.append(f"Vacating countdown active: {self.vacating_countdown}s remaining.")

        if self.last_llm_result:
            det = "person detected" if self.last_llm_result.get("person_detected") else "empty"
            reason = self.last_llm_result.get("reason", "")
            parts.append(f"Last Vision AI check: {det} ({reason}).")

        return " ".join(parts)

    def _recalculate_state(self) -> None:
        """Recalculate presence state after override is turned off."""
        if self._active_triggers or self.active_conditions or self._bayesian_active:
            self._activate_occupied_state()
        else:
            self.is_present = False
            self.box_state = BoxState.IDLE_CLEAR
            self.vacating_countdown = 0
