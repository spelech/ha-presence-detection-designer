"""Hierarchical transitions-backed State Machine for Presence Detection Designer."""

from __future__ import annotations

import datetime
import time
from collections import deque
from collections.abc import Callable
from typing import Any

from transitions.extensions import HierarchicalGraphMachine

from .const import (
    DEFAULT_BAYESIAN_PRIOR,
    DEFAULT_BAYESIAN_THRESHOLD,
    DEFAULT_EXTEND_TIMEOUT,
    DEFAULT_INACTIVITY_TIMEOUT,
    DEFAULT_MAX_HOLD_TIMEOUT,
    DEFAULT_VERIFY_TIMEOUT,
    OccupancyState,
)
from .evidence_snapshot import RoomEvidenceSnapshot

TimerScheduler = Callable[[float, Callable[[], None]], Callable[[], None] | None]

_MACHINE_STATES: list[Any] = [
    OccupancyState.VACANT.value,
    {
        "name": "occupied",
        "initial": "confirmed",
        "children": ["confirmed", "holding", "cooling", "verifying"],
    },
    OccupancyState.OVERRIDE.value,
]


def _tx(trigger: str, source: Any, dest: str, **extra: Any) -> dict[str, Any]:
    return {"trigger": trigger, "source": source, "dest": dest, **extra}


_V = OccupancyState.VACANT.value
_CONF = OccupancyState.OCCUPIED_CONFIRMED.value
_HOLD = OccupancyState.OCCUPIED_HOLDING.value
_COOL = OccupancyState.OCCUPIED_COOLING.value
_VER = OccupancyState.OCCUPIED_VERIFYING.value
_OVR = OccupancyState.OVERRIDE.value

_MACHINE_TRANSITIONS: list[dict[str, Any]] = [
    _tx("evidence_detected", _V, _CONF, conditions="_guard_has_human_evidence"),
    _tx("evidence_cleared", _CONF, _HOLD, conditions="_guard_has_hold_only"),
    _tx("evidence_cleared", _CONF, _COOL, conditions="_guard_no_human_or_hold"),
    _tx("evidence_detected", [_HOLD, _COOL, _VER], _CONF, conditions="_guard_has_human_evidence"),
    _tx("hold_cleared", _HOLD, _COOL),
    _tx("hold_timeout", _HOLD, _COOL),
    _tx("countdown_expired", _COOL, _VER, conditions="_guard_llm_enabled"),
    _tx("countdown_expired", _COOL, _V, unless="_guard_llm_enabled"),
    _tx("llm_person_detected", _VER, _COOL),
    _tx("llm_room_empty", _VER, _V),
    _tx("verify_timeout", _VER, _V),
    _tx("adjacent_handoff", [_CONF, _HOLD, _COOL], _V, conditions="_guard_can_handoff_clear"),
    _tx("enable_override", [_V, "occupied"], _OVR),
    _tx("force_clear", ["occupied", _OVR], _V),
    _tx("disable_override", _OVR, _CONF, conditions="_guard_has_human_evidence"),
    _tx("disable_override", _OVR, _V, unless="_guard_has_human_evidence"),
]


class RoomPresenceStateMachine:
    """Hierarchical transitions state machine governing single-room occupancy."""

    state: str

    def __init__(
        self,
        name: str,
        inactivity_timeout: int = DEFAULT_INACTIVITY_TIMEOUT,
        extend_timeout: int = DEFAULT_EXTEND_TIMEOUT,
        max_hold_timeout: int = DEFAULT_MAX_HOLD_TIMEOUT,
        verify_timeout: int = DEFAULT_VERIFY_TIMEOUT,
        llm_enabled: bool = False,
        bayesian_prior: float = DEFAULT_BAYESIAN_PRIOR,
        bayesian_threshold: float = DEFAULT_BAYESIAN_THRESHOLD,
        timer_scheduler: TimerScheduler | None = None,
        on_timer_expired: Callable[[str], None] | None = None,
    ) -> None:
        self.name = name
        self.inactivity_timeout = max(1, int(inactivity_timeout))
        self.extend_timeout = max(1, int(extend_timeout))
        self.max_hold_timeout = max(1, int(max_hold_timeout))
        self.verify_timeout = max(1, int(verify_timeout))
        self.llm_enabled = bool(llm_enabled)
        self.bayesian_prior = float(bayesian_prior)
        self.bayesian_threshold = float(bayesian_threshold)
        self._timer_scheduler = timer_scheduler
        self._on_timer_expired = on_timer_expired

        self.snapshot = RoomEvidenceSnapshot()
        self.last_occupied_time: float = 0.0
        self.last_cleared_time: float = 0.0
        self.retrigger_cooldown: float = 20.0
        self.last_handoff_room: str | None = None
        self.last_trigger_entity: str | None = None
        self.last_llm_result: dict[str, Any] | None = None
        self.last_transition_reason: str = "Initialized vacant"

        self.bayesian_probability: float = 0.0
        self.bayesian_probability_pct: float = 0.0
        self.bayesian_occupied: bool = False
        self.bayesian_summary: str = (
            f"0.0% probability (Vacant; threshold {round(self.bayesian_threshold * 100.0, 1)}%, "
            f"prior {round(self.bayesian_prior * 100.0, 1)}%)."
        )
        self.active_observations: list[dict[str, Any]] = []
        self.inactive_observations: list[dict[str, Any]] = []
        self.active_conditions: list[str] = []

        self._virtual_now: float | None = None
        self._virtual_wall_base: float | None = None
        self._deadline_ts: float | None = None
        self._next_cooling_duration: int | None = None
        self._timer_cancel: Callable[[], None] | None = None
        self._history: deque[dict[str, Any]] = deque(maxlen=50)

        self._machine = HierarchicalGraphMachine(
            model=self,
            states=_MACHINE_STATES,
            transitions=_MACHINE_TRANSITIONS,
            initial=OccupancyState.VACANT.value,
            graph_engine="mermaid",
            auto_transitions=False,
            ignore_invalid_triggers=True,
            send_event=True,
            prepare_event=self._on_prepare_event,
            finalize_event=self._on_finalize_event,
        )

    def _now(self, explicit_ts: float | None = None) -> float:
        wall_now = time.time()
        if explicit_ts is not None:
            self._virtual_now = float(explicit_ts)
            self._virtual_wall_base = wall_now
            return self._virtual_now
        if self._virtual_now is not None and self._virtual_wall_base is not None:
            return self._virtual_now + max(0.0, wall_now - self._virtual_wall_base)
        return wall_now

    @property
    def is_present(self) -> bool:
        """Return True when room is in any occupied sub-state or manual override."""
        return bool(self.is_occupied(allow_substates=True) or self.state == OccupancyState.OVERRIDE)

    @property
    def override(self) -> bool:
        """Return True when manual override state is active."""
        return self.state == OccupancyState.OVERRIDE

    @property
    def is_cooling_down(self) -> bool:
        """Return True when room is actively counting down toward vacancy."""
        return self.state == OccupancyState.OCCUPIED_COOLING

    @property
    def cooling_remaining_sec(self) -> int:
        """Return remaining seconds in cooling countdown, or 0 if not cooling."""
        if self.state != OccupancyState.OCCUPIED_COOLING or self._deadline_ts is None:
            return 0
        return max(0, int(round(self._deadline_ts - self._now())))

    @property
    def vacating_countdown(self) -> int:
        """Return remaining seconds for UI/card compatibility."""
        return self.cooling_remaining_sec

    @property
    def state_reason(self) -> str:
        """Return human-readable reason for the current occupancy state."""
        return self.last_transition_reason

    @property
    def verified_by(self) -> str:
        """Return the primary evidence class backing current occupancy."""
        if self.state == OccupancyState.VACANT:
            return "none"
        if self.override:
            return "manual_override"
        if self.state == OccupancyState.OCCUPIED_VERIFYING:
            return "llm_verifying"
        if self.snapshot.camera_confirmed:
            return "camera"
        if self.snapshot.bayesian_occupied:
            return "bayesian"
        if self.snapshot.active_triggers:
            return "trigger"
        if self.snapshot.human_present:
            return "spatial"
        if self.snapshot.active_conditions:
            return "condition"
        if self.snapshot.spatial_blind_pocket_hold:
            return "blind_pocket"
        if self.is_cooling_down:
            return "cooling"
        return "none"

    @property
    def transition_history(self) -> list[dict[str, Any]]:
        """Return chronological list of recorded transition attempts."""
        return list(self._history)

    def _guard_has_human_evidence(self, _event: Any) -> bool:
        return self.snapshot.human_evidence_active

    def _guard_has_hold_only(self, _event: Any) -> bool:
        return not self.snapshot.human_evidence_active and self.snapshot.has_hold_evidence

    def _guard_no_human_or_hold(self, _event: Any) -> bool:
        return not self.snapshot.human_evidence_active and not self.snapshot.has_hold_evidence

    def _guard_llm_enabled(self, _event: Any) -> bool:
        return self.llm_enabled

    def _guard_can_handoff_clear(self, _event: Any) -> bool:
        if self.snapshot.human_evidence_active or self.snapshot.active_conditions:
            return False
        return self.state in (
            OccupancyState.OCCUPIED_COOLING,
            OccupancyState.OCCUPIED_HOLDING,
            OccupancyState.OCCUPIED_CONFIRMED,
        )

    def _on_prepare_event(self, event: Any) -> None:
        event.kwargs["_source_state"] = self.state

    def _on_finalize_event(self, event: Any) -> None:
        ts = float(event.kwargs.get("now_ts") or self._now())
        src = str(event.kwargs.get("_source_state", self.state))
        dest = str(self.state)
        accepted = bool(event.result)
        reason = str(event.kwargs.get("reason") or "")
        if not reason:
            if accepted:
                reason = f"{event.event.name}: {src} -> {dest}"
            else:
                reason = f"{event.event.name} blocked in {src}"

        if accepted:
            self.last_transition_reason = reason

        self._history.append(
            {
                "timestamp": ts,
                "trigger": str(event.event.name),
                "source": src,
                "dest": dest,
                "accepted": accepted,
                "reason": reason,
                "guards": {
                    "human_evidence_active": self.snapshot.human_evidence_active,
                    "has_hold_evidence": self.snapshot.has_hold_evidence,
                    "is_pet_only": self.snapshot.is_pet_only,
                    "llm_enabled": self.llm_enabled,
                },
            }
        )

    def _cancel_timer(self) -> None:
        if self._timer_cancel is not None:
            try:
                self._timer_cancel()
            except Exception:  # noqa: BLE001
                pass
            self._timer_cancel = None
        self._deadline_ts = None

    def _arm_timer(self, duration_sec: int, expired_trigger: str, now_ts: float) -> None:
        self._cancel_timer()
        self._deadline_ts = now_ts + float(duration_sec)
        if self._timer_scheduler is not None:

            def _on_fire() -> None:
                self.trigger(
                    expired_trigger, now_ts=self._now(), reason=f"{expired_trigger} timer fired"
                )
                if self._on_timer_expired is not None:
                    self._on_timer_expired(expired_trigger)

            self._timer_cancel = self._timer_scheduler(float(duration_sec), _on_fire)

    def on_enter_vacant(self, event: Any) -> None:
        """Reset transient tracking upon entering vacant."""
        now_ts = float(event.kwargs.get("now_ts") or self._now())
        self._cancel_timer()
        self.last_cleared_time = now_ts
        self.bayesian_probability = 0.0
        self.bayesian_probability_pct = 0.0

    def on_enter_occupied_confirmed(self, event: Any) -> None:
        """Mark occupied timestamp and clear pending handoff markers."""
        now_ts = float(event.kwargs.get("now_ts") or self._now())
        self._cancel_timer()
        self.last_occupied_time = now_ts
        self.last_handoff_room = None

    def on_enter_occupied_holding(self, event: Any) -> None:
        """Arm finite max_hold_timeout so holding can never stick indefinitely."""
        now_ts = float(event.kwargs.get("now_ts") or self._now())
        self._arm_timer(self.max_hold_timeout, "hold_timeout", now_ts)

    def on_exit_occupied_holding(self, _event: Any) -> None:
        self._cancel_timer()

    def on_enter_occupied_cooling(self, event: Any) -> None:
        """Arm cooling countdown timer."""
        now_ts = float(event.kwargs.get("now_ts") or self._now())
        duration = self._next_cooling_duration or self.inactivity_timeout
        self._next_cooling_duration = None
        self._arm_timer(duration, "countdown_expired", now_ts)

    def on_exit_occupied_cooling(self, _event: Any) -> None:
        self._cancel_timer()

    def on_enter_occupied_verifying(self, event: Any) -> None:
        """Arm fail-safe verify_timeout for Vision/LLM checks."""
        now_ts = float(event.kwargs.get("now_ts") or self._now())
        self._arm_timer(self.verify_timeout, "verify_timeout", now_ts)

    def on_exit_occupied_verifying(self, _event: Any) -> None:
        self._cancel_timer()

    def on_enter_override(self, _event: Any) -> None:
        self._cancel_timer()

    def apply_evidence(self, snapshot: RoomEvidenceSnapshot, now_ts: float | None = None) -> None:
        """Update live evidence snapshot and dispatch the matching state transition."""
        now = self._now(now_ts)
        self.snapshot = snapshot
        self.active_conditions = list(snapshot.active_conditions)
        self.bayesian_probability = snapshot.bayesian_probability
        self.bayesian_probability_pct = snapshot.bayesian_probability_pct
        self.bayesian_occupied = snapshot.bayesian_occupied
        if snapshot.bayesian_summary:
            self.bayesian_summary = snapshot.bayesian_summary
        self.active_observations = list(snapshot.active_observations)
        self.inactive_observations = list(snapshot.inactive_observations)
        if snapshot.last_trigger_entity:
            self.last_trigger_entity = snapshot.last_trigger_entity

        if self.override:
            return

        if self.state == OccupancyState.VACANT:
            if snapshot.human_evidence_active:
                self.evidence_detected(now_ts=now, reason="Human occupancy evidence detected")
            elif snapshot.is_pet_only or snapshot.active_triggers:
                self.evidence_detected(
                    now_ts=now,
                    reason="Blocked by GUARD-02: pet-only evidence does not occupy room",
                )
            return

        if self.state == OccupancyState.OCCUPIED_CONFIRMED:
            if not snapshot.human_evidence_active:
                self.evidence_cleared(
                    now_ts=now,
                    reason=(
                        "Direct triggers cleared; holding on secondary evidence"
                        if snapshot.has_hold_evidence
                        else "All human evidence cleared; starting cooling countdown"
                    ),
                )
            return

        if self.state == OccupancyState.OCCUPIED_HOLDING:
            if snapshot.human_evidence_active:
                self.evidence_detected(now_ts=now, reason="Direct human evidence resumed")
            elif not snapshot.has_hold_evidence:
                self.hold_cleared(
                    now_ts=now, reason="Holding evidence cleared; starting cooling countdown"
                )
            return

        if self.state in (OccupancyState.OCCUPIED_COOLING, OccupancyState.OCCUPIED_VERIFYING):
            if snapshot.human_evidence_active:
                self.evidence_detected(
                    now_ts=now, reason="Human evidence retriggered during vacate window"
                )

    def handle_adjacent_room_occupied(
        self,
        adjacent_room_name: str,
        now_ts: float | None = None,
    ) -> bool:
        """Clear this room immediately if an adjacent room detects the occupant and no active evidence holds it."""
        now = self._now(now_ts)
        if self.override or not self.is_present:
            return False
        prev_state = self.state
        self.adjacent_handoff(now_ts=now, reason=f"Handoff confirmed to {adjacent_room_name}")
        if self.state == OccupancyState.VACANT and prev_state != OccupancyState.VACANT:
            self.last_handoff_room = adjacent_room_name
            return True
        return False

    def handle_llm_result(
        self,
        person_detected: bool,
        reasoning: str = "",
        now_ts: float | None = None,
    ) -> None:
        """Process Vision/LLM verification result."""
        now = self._now(now_ts)
        self.last_llm_result = {
            "timestamp": datetime.datetime.fromtimestamp(now, tz=datetime.UTC).isoformat(),
            "person_detected": person_detected,
            "reason": reasoning,
        }
        if self.override:
            return
        if person_detected:
            self._next_cooling_duration = self.extend_timeout
            self.llm_person_detected(now_ts=now, reason=f"Vision AI confirmed person: {reasoning}")
        else:
            self.llm_room_empty(now_ts=now, reason=f"Vision AI confirmed empty: {reasoning}")

    def set_override(self, enabled: bool, now_ts: float | None = None) -> None:
        """Enable or disable manual presence override."""
        now = self._now(now_ts)
        if enabled:
            self.enable_override(now_ts=now, reason="Manual override enabled")
        else:
            self.disable_override(
                now_ts=now, reason="Manual override disabled; re-evaluated live snapshot"
            )

    def force_clear(self, reason: str | None = None, now_ts: float | None = None) -> None:
        """Explicitly clear room presence to vacant."""
        now = self._now(now_ts)
        self.force_clear_trigger(now_ts=now, reason=reason or "Explicit force clear")
        if reason:
            self.last_handoff_room = reason

    def force_clear_trigger(self, now_ts: float | None = None, reason: str = "") -> bool:
        """Invoke the transitions force_clear trigger safely."""
        return bool(self.trigger("force_clear", now_ts=now_ts, reason=reason))

    def advance_time(self, seconds: float, now_ts: float | None = None) -> str | None:
        """Advance virtual clock and fire any expired state timer deterministically."""
        if now_ts is not None:
            now = self._now(now_ts)
        else:
            base = self._now()
            now = self._now(base + max(0.0, float(seconds)))

        if self.override or self._deadline_ts is None or now < self._deadline_ts:
            return None

        if self.state == OccupancyState.OCCUPIED_HOLDING:
            self.hold_timeout(now_ts=now, reason="Max hold timeout expired")
            return "HOLD_EXPIRED"

        if self.state == OccupancyState.OCCUPIED_COOLING:
            self.countdown_expired(now_ts=now, reason="Cooling countdown expired")
            if self.state == OccupancyState.OCCUPIED_VERIFYING:
                return "REQUEST_LLM_VERIFY"
            if self.state == OccupancyState.VACANT:
                return "VACATED"
            return None

        if self.state == OccupancyState.OCCUPIED_VERIFYING:
            self.trigger("verify_timeout", now_ts=now, reason="Vision verification timed out")
            if self.state == OccupancyState.VACANT:
                return "VACATED"

        return None

    def get_mermaid_diagram(self) -> str:
        """Return live Mermaid stateDiagram-v2 markup directly from transitions."""
        return str(self.get_graph().draw(None))

    def build_natural_language_explanation(self) -> str:
        """Return plain-English explanation of current occupancy state and recent transition."""
        state_label = "OCCUPIED" if self.is_present else "VACANT"
        parts = [f"{self.name}: {state_label} (state={self.state})."]
        if self.override:
            parts.append("Manual override lock is ON.")
            return " ".join(parts)
        if self.snapshot.is_pet_only:
            parts.append("Pet-only detection ignored (GUARD-02).")
        if self.bayesian_summary:
            parts.append(self.bayesian_summary)
        if self.active_conditions:
            parts.append(f"Holding conditions: {', '.join(self.active_conditions)}.")
        if self.state == OccupancyState.OCCUPIED_COOLING:
            parts.append(f"Cooling countdown active: {self.cooling_remaining_sec}s remaining.")
        if self.last_handoff_room and not self.is_present:
            parts.append(f"Cleared via handoff to {self.last_handoff_room}.")
        if self.last_llm_result:
            det = "person detected" if self.last_llm_result.get("person_detected") else "empty"
            parts.append(f"Last Vision AI check: {det} ({self.last_llm_result.get('reason', '')}).")
        return " ".join(parts)
