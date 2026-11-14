"""Separate transitions state machine for PIR candidate validation and multi-source corroboration."""

from __future__ import annotations

import logging
import time
from collections import deque
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

from transitions import EventData
from transitions.extensions import GraphMachine

from .const import DEFAULT_PIR_CANDIDATE_WINDOW, PIRValidationState

_LOGGER = logging.getLogger(__name__)
TimerScheduler = Callable[[float, Callable[[], None]], Callable[[], None] | None]

_I = PIRValidationState.IDLE.value
_CAND = PIRValidationState.CANDIDATE.value
_CONF = PIRValidationState.CONFIRMED.value
_SUPP = PIRValidationState.SUPPRESSED.value

_PIR_STATES: list[str] = [_I, _CAND, _CONF, _SUPP]


def _tx(trigger: str, source: Any, dest: str, **extra: Any) -> dict[str, Any]:
    return {"trigger": trigger, "source": source, "dest": dest, **extra}


_PIR_TRANSITIONS: list[dict[str, Any]] = [
    _tx("pir_triggered", _I, _CONF, conditions="_guard_has_corroboration"),
    _tx("pir_triggered", _I, _CAND, unless="_guard_has_corroboration"),
    _tx("pir_triggered", _CAND, _CONF, conditions="_guard_has_corroboration"),
    _tx("pir_triggered", _SUPP, _CONF, conditions="_guard_has_corroboration"),
    _tx("corroborated", _CAND, _CONF, conditions="_guard_has_corroboration"),
    _tx("corroborated", _SUPP, _CONF, conditions="_guard_supp_corroboration"),
    _tx("candidate_expired", _CAND, _SUPP, conditions="_guard_has_active_pir"),
    _tx("candidate_expired", _CAND, _I, unless="_guard_has_active_pir"),
    _tx("pir_cleared", _CONF, _I, unless="_guard_has_active_pir"),
    _tx("pir_cleared", _SUPP, _I, unless="_guard_has_active_pir"),
]


@dataclass(frozen=True)
class PIRCorroborationContext:
    """Normalized pluggable corroboration signals available when evaluating a PIR trigger."""

    camera_confirmed: bool = False
    camera_detail: str | None = None
    trajectory_valid: bool = False
    trajectory_detail: str | None = None
    ble_corroborated: bool = False
    ble_detail: str | None = None
    extra_active_sensors: frozenset[str] = field(default_factory=frozenset)


class PIRValidationStateMachine:
    """Separate transitions GraphMachine gating raw PIR/slow triggers across all rooms."""

    state: str

    def __init__(
        self,
        room_name: str,
        *,
        candidate_window_sec: float = DEFAULT_PIR_CANDIDATE_WINDOW,
        pulse_history_window_sec: float = 60.0,
        timer_scheduler: TimerScheduler | None = None,
        on_timer_expired: Callable[[str], None] | None = None,
    ) -> None:
        self.room_name = room_name
        self.candidate_window_sec = max(1.0, float(candidate_window_sec))
        self.pulse_history_window_sec = max(10.0, float(pulse_history_window_sec))
        self._timer_scheduler = timer_scheduler
        self._on_timer_expired = on_timer_expired

        self.active_pir_sensors: set[str] = set()
        self.candidate_pir_sensors: set[str] = set()
        self._fast_pulse_history: dict[str, deque[float]] = {}
        self.last_corroboration_source: str | None = None
        self.last_corroboration_detail: str | None = None
        self.last_transition_reason: str = "PIR gate idle"

        self._virtual_now: float | None = None
        self._virtual_wall_base: float | None = None
        self._candidate_deadline_ts: float | None = None
        self._timer_cancel: Callable[[], None] | None = None
        self._current_ctx: PIRCorroborationContext = PIRCorroborationContext()
        self._pending_corroboration: tuple[str, str] | None = None
        self._history: deque[dict[str, Any]] = deque(maxlen=40)

        self._machine = GraphMachine(
            model=self,
            states=_PIR_STATES,
            transitions=_PIR_TRANSITIONS,
            initial=_I,
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
    def pir_confirmed(self) -> bool:
        """Return True only when PIR evidence has been corroborated."""
        return self.state == _CONF

    @property
    def pir_candidate(self) -> bool:
        """Return True while waiting for corroboration within the 10s candidate window."""
        return self.state == _CAND

    @property
    def candidate_remaining_sec(self) -> int:
        """Return whole seconds left in the candidate window, or 0 if not in candidate."""
        if self.state != _CAND or self._candidate_deadline_ts is None:
            return 0
        return max(0, int(round(self._candidate_deadline_ts - self._now())))

    @property
    def transition_history(self) -> list[dict[str, Any]]:
        """Return bounded transition audit history for the PIR gate."""
        return list(self._history)

    def get_mermaid_diagram(self) -> str:
        """Return live Mermaid stateDiagram-v2 markup generated from transitions GraphMachine."""
        graph = self._machine.get_graph()
        raw = str(graph.draw(None))
        if raw.startswith("stateDiagram\n"):
            raw = "stateDiagram-v2\n" + raw[len("stateDiagram\n") :]
        return raw

    def _cancel_timer(self) -> None:
        if self._timer_cancel is not None:
            try:
                self._timer_cancel()
            except Exception:  # noqa: BLE001
                pass
            self._timer_cancel = None
        self._candidate_deadline_ts = None

    def _arm_candidate_timer(self, duration: float, now_ts: float) -> None:
        self._cancel_timer()
        self._candidate_deadline_ts = now_ts + max(0.5, duration)
        if self._timer_scheduler is None:
            return

        def _on_fire() -> None:
            self._timer_cancel = None
            fire_ts = self._now()
            if self._candidate_deadline_ts is not None and fire_ts >= self._candidate_deadline_ts:
                self.candidate_expired(now_ts=fire_ts)
                if self._on_timer_expired is not None:
                    self._on_timer_expired("candidate_expired")

        self._timer_cancel = self._timer_scheduler(duration, _on_fire)

    def _prune_pulses(self, now_ts: float) -> None:
        cutoff = now_ts - self.pulse_history_window_sec
        for eid in list(self._fast_pulse_history):
            dq = self._fast_pulse_history[eid]
            while dq and dq[0] < cutoff:
                dq.popleft()
            if not dq:
                del self._fast_pulse_history[eid]

    def evaluate_corroboration(
        self, ctx: PIRCorroborationContext, *, now_ts: float | None = None
    ) -> tuple[str | None, str | None]:
        """Return (source_name, detail) if ANY ONE of the pluggable corroborators matches."""
        now = self._now(now_ts)
        self._prune_pulses(now)

        # 1. Camera / Frigate person visual confirmation
        if ctx.camera_confirmed:
            return ("camera", ctx.camera_detail or "Frigate camera/person confirmation")

        # 2. Topological trajectory / adjacent room / connected perimeter door
        if ctx.trajectory_valid:
            return ("trajectory", ctx.trajectory_detail or "Adjacent room or path trajectory")

        # 3. Bermuda BLE room / adjacent area corroboration
        if ctx.ble_corroborated:
            return ("ble", ctx.ble_detail or "Bermuda BLE tracker proximity match")

        # 4. Time-history corroboration: 2+ distinct active sensors OR 2+ fast-PIR pulses
        distinct_sensors = (
            self.active_pir_sensors | self.candidate_pir_sensors | ctx.extra_active_sensors
        )
        if len(distinct_sensors) >= 2:
            joined = ", ".join(sorted(distinct_sensors))
            return ("time_history", f"Multi-sensor corroboration ({joined})")

        for eid, dq in self._fast_pulse_history.items():
            if len(dq) >= 2:
                return (
                    "time_history",
                    f"Repeated fast-PIR pulses ({len(dq)} hits on {eid} within {int(self.pulse_history_window_sec)}s)",
                )

        return None, None

    # ------------------------------------------------------------------
    # transitions guards & callbacks
    # ------------------------------------------------------------------
    def _guard_has_corroboration(self, event: EventData) -> bool:
        now = event.kwargs.get("now_ts")
        src, detail = self.evaluate_corroboration(self._current_ctx, now_ts=now)
        self._pending_corroboration = (src, detail or "") if src else None
        return src is not None

    def _guard_supp_corroboration(self, event: EventData) -> bool:
        return bool(self.active_pir_sensors) and self._guard_has_corroboration(event)

    def _guard_has_active_pir(self, _event: EventData) -> bool:
        return bool(self.active_pir_sensors)

    def on_enter_idle(self, _event: EventData) -> None:
        self._cancel_timer()
        self.candidate_pir_sensors.clear()
        self.last_corroboration_source = None
        self.last_corroboration_detail = None
        self.last_transition_reason = "PIR gate idle"

    def on_enter_candidate(self, event: EventData) -> None:
        now = self._now(event.kwargs.get("now_ts"))
        self.last_transition_reason = (
            f"Awaiting corroboration within {int(self.candidate_window_sec)}s "
            f"({', '.join(sorted(self.candidate_pir_sensors or self.active_pir_sensors))})"
        )
        self._arm_candidate_timer(self.candidate_window_sec, now)

    def on_enter_confirmed(self, _event: EventData) -> None:
        self._cancel_timer()
        if self._pending_corroboration is not None:
            src, detail = self._pending_corroboration
            self.last_corroboration_source = src
            self.last_corroboration_detail = detail
            self.last_transition_reason = f"Confirmed via {src}: {detail}"
        else:
            self.last_transition_reason = "PIR confirmed"

    def on_enter_suppressed(self, _event: EventData) -> None:
        self._cancel_timer()
        self.candidate_pir_sensors.clear()
        self.last_corroboration_source = None
        self.last_corroboration_detail = None
        self.last_transition_reason = (
            f"Uncorroborated PIR spike suppressed after {int(self.candidate_window_sec)}s window"
        )

    def _on_prepare_event(self, event: EventData) -> None:
        event.kwargs["_prev_state"] = self.state

    def _on_finalize_event(self, event: EventData) -> None:
        prev_state = str(event.kwargs.get("_prev_state", self.state))
        accepted = bool(event.result) and prev_state != self.state
        ts = self._now(event.kwargs.get("now_ts"))
        trigger_name = str(event.event.name)
        reason = self.last_transition_reason
        if not accepted and trigger_name in ("pir_triggered", "corroborated"):
            reason = f"{trigger_name} kept state {self.state} (no corroboration yet)"
        self._history.append(
            {
                "timestamp": ts,
                "room": self.room_name,
                "trigger": trigger_name,
                "source": prev_state,
                "dest": self.state,
                "accepted": accepted,
                "reason": reason,
            }
        )

    # ------------------------------------------------------------------
    # Public driver methods
    # ------------------------------------------------------------------
    def on_pir_triggered(
        self,
        entity_id: str,
        *,
        is_slow: bool = False,
        ctx: PIRCorroborationContext | None = None,
        now_ts: float | None = None,
    ) -> bool:
        """Process an active PIR/slow-sensor trigger and return True if confirmed."""
        now = self._now(now_ts)
        eid = str(entity_id)
        was_active = eid in self.active_pir_sensors
        self.active_pir_sensors.add(eid)
        self.candidate_pir_sensors.add(eid)
        if not is_slow and not was_active:
            dq = self._fast_pulse_history.setdefault(eid, deque(maxlen=10))
            dq.append(now)
        self._current_ctx = ctx or PIRCorroborationContext()
        if self.state != _CONF:
            self.pir_triggered(now_ts=now)
        return self.pir_confirmed

    def on_pir_cleared(self, entity_id: str, *, now_ts: float | None = None) -> None:
        """Process a PIR/slow-sensor clear; keep candidate window open until timeout."""
        now = self._now(now_ts)
        self.active_pir_sensors.discard(str(entity_id))
        if self.state in (_CONF, _SUPP) and not self.active_pir_sensors:
            self.pir_cleared(now_ts=now)

    def on_corroboration_update(
        self,
        ctx: PIRCorroborationContext,
        *,
        now_ts: float | None = None,
    ) -> bool:
        """Re-evaluate corroborators while in candidate/suppressed; promote if any one passes."""
        now = self._now(now_ts)
        self._current_ctx = ctx
        if self.state in (_CAND, _SUPP):
            self.corroborated(now_ts=now)
        return self.pir_confirmed

    def advance_time(self, seconds: float | None = None, *, now_ts: float | None = None) -> None:
        """Advance virtual time deterministically and expire any candidate window if due."""
        if now_ts is not None:
            now = self._now(now_ts)
        elif seconds is not None:
            now = self._now(self._now() + max(0.0, float(seconds)))
        else:
            now = self._now()

        if (
            self.state == _CAND
            and self._candidate_deadline_ts is not None
            and now >= self._candidate_deadline_ts
        ):
            self.candidate_expired(now_ts=now)

    def reset(self, *, now_ts: float | None = None) -> None:
        """Reset all active PIR state back to idle."""
        self._now(now_ts)
        self.active_pir_sensors.clear()
        self.candidate_pir_sensors.clear()
        self._fast_pulse_history.clear()
        self._cancel_timer()
        self.last_corroboration_source = None
        self.last_corroboration_detail = None
        self.last_transition_reason = "PIR gate reset"
        self._machine.set_state(_I)
