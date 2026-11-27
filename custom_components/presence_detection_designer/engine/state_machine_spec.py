"""State definitions, transition table, and natural-language explanations for RoomPresenceStateMachine."""

from __future__ import annotations

from typing import Any

from ..const import OccupancyState
from .evidence_snapshot import RoomEvidenceSnapshot

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
    _tx("evidence_hold", _COOL, _HOLD, conditions="_guard_can_resume_hold"),
    _tx("hold_cleared", _HOLD, _COOL),
    _tx("hold_timeout", _HOLD, _COOL, after="_on_hold_timeout"),
    _tx("countdown_expired", _COOL, _VER, conditions="_guard_llm_enabled"),
    _tx("countdown_expired", _COOL, _V, unless="_guard_llm_enabled"),
    _tx("llm_person_detected", _VER, _COOL, after="_on_llm_person_detected"),
    _tx("llm_room_empty", _VER, _V),
    _tx("verify_timeout", _VER, _V),
    _tx("adjacent_handoff", [_CONF, _HOLD, _COOL], _V, conditions="_guard_can_handoff_clear"),
    _tx("enable_override", [_V, "occupied"], _OVR),
    _tx("force_clear", ["occupied", _OVR], _V),
    _tx("disable_override", _OVR, _CONF, conditions="_guard_has_human_evidence"),
    _tx("disable_override", _OVR, _V, unless="_guard_has_human_evidence"),
]


def format_state_machine_explanation(sm: Any) -> str:
    """Return plain-English explanation of current occupancy state and recent transition."""
    state_label = "OCCUPIED" if sm.is_present else "VACANT"
    parts = [f"{sm.name}: {state_label} (state={sm.state})."]
    if sm.override:
        parts.append("Manual override lock is ON.")
        return " ".join(parts)
    if sm.snapshot.is_pet_only:
        parts.append("Pet-only detection ignored (GUARD-02).")
    if sm.bayesian_summary:
        parts.append(sm.bayesian_summary)
    if sm.active_conditions:
        parts.append(f"Holding conditions: {', '.join(sm.active_conditions)}.")
    if sm.state == OccupancyState.OCCUPIED_COOLING:
        parts.append(f"Cooling countdown active: {sm.cooling_remaining_sec}s remaining.")
    if sm.last_handoff_room and not sm.is_present:
        parts.append(f"Cleared via handoff to {sm.last_handoff_room}.")
    if sm.last_llm_result:
        det = "person detected" if sm.last_llm_result.get("person_detected") else "empty"
        parts.append(f"Last Vision AI check: {det} ({sm.last_llm_result.get('reason', '')}).")
    return " ".join(parts)


def apply_hmm_belief_to_machine(sm: Any, belief: Any, *, now_ts: float | None = None) -> bool:
    """Synchronize state machine probability and hysteresis occupancy from HouseHMMEngine."""
    now = sm._now(now_ts)
    prev_present = sm.is_present

    sm.bayesian_probability = float(belief.probability)
    sm.bayesian_probability_pct = float(belief.probability_pct)
    sm.bayesian_occupied = bool(belief.is_occupied)
    sm.bayesian_threshold = float(belief.theta_enter)
    drivers = list(getattr(belief, "active_drivers", ()) or ())
    status_label = "Occupied" if belief.is_occupied else "Vacant"
    driver_str = f" Drivers: {', '.join(drivers[:4])}." if drivers else ""
    sm.bayesian_summary = (
        f"{belief.probability_pct:.1f}% probability ({status_label}; "
        f"tier={belief.confidence_tier}, enter={belief.theta_enter * 100.0:.1f}%, "
        f"clear={belief.theta_clear * 100.0:.1f}%).{driver_str}"
    )
    sm.active_observations = [{"entity_id": d, "explanation": d, "label": d} for d in drivers]
    if drivers:
        sm.last_trigger_entity = drivers[0]

    if sm.override:
        return False

    sm.snapshot = RoomEvidenceSnapshot(
        active_triggers=frozenset(drivers) if belief.is_occupied else frozenset(),
        active_conditions=(("sustain",) if belief.sustaining_active else ()),
        bayesian_occupied=bool(belief.is_occupied),
        bayesian_probability=float(belief.probability),
        bayesian_probability_pct=float(belief.probability_pct),
        bayesian_summary=sm.bayesian_summary,
        active_observations=tuple(sm.active_observations),
        human_present=bool(belief.is_occupied),
        camera_confirmed=any(str(d).startswith("cam:") for d in drivers),
        last_trigger_entity=drivers[0] if drivers else sm.last_trigger_entity,
    )

    if belief.is_occupied and not prev_present:
        reason = (
            f"HMM confidence {belief.probability_pct:.1f}% >= "
            f"{belief.theta_enter * 100.0:.1f}%"
            + (f" ({', '.join(drivers[:3])})" if drivers else "")
        )
        sm.trigger("evidence_detected", now_ts=now, reason=reason)
    elif not belief.is_occupied and prev_present:
        reason = (
            f"HMM confidence {belief.probability_pct:.1f}% <= {belief.theta_clear * 100.0:.1f}%"
        )
        sm.force_clear_trigger(now_ts=now, reason=reason)

    return sm.is_present != prev_present
