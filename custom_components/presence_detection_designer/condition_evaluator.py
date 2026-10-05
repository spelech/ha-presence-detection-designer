"""Condition evaluator for Presence Detection Designer."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

from .const import ConditionOperator


def _to_float(value: Any) -> float | None:
    """Attempt to parse float, return None on failure."""
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


def evaluate_condition(
    condition: dict[str, Any],
    current_state: str | None,
    current_attributes: dict[str, Any] | None = None,
) -> bool:
    """Evaluate a single condition against current state and attributes.

    Returns False if current_state is None, 'unavailable', or 'unknown'.
    """
    if current_state is None or current_state.lower() in ("unavailable", "unknown"):
        return False

    operator = condition.get("operator", ConditionOperator.EQUALS)
    target_state = condition.get("state", "")

    # Compare numeric if operator requires or both are floats
    if operator in (ConditionOperator.GREATER_THAN, ConditionOperator.LESS_THAN):
        curr_num = _to_float(current_state)
        target_num = _to_float(target_state)
        if curr_num is None or target_num is None:
            return False
        if operator == ConditionOperator.GREATER_THAN:
            return curr_num > target_num
        return curr_num < target_num

    # For equals / not_equals, check if both are numeric first
    curr_num = _to_float(current_state)
    target_num = _to_float(target_state)
    if curr_num is not None and target_num is not None:
        is_match = curr_num == target_num
    else:
        is_match = str(current_state).strip().lower() == str(target_state).strip().lower()

    if operator == ConditionOperator.EQUALS:
        return is_match
    if operator == ConditionOperator.NOT_EQUALS:
        return not is_match

    return False


def format_condition_description(condition: dict[str, Any]) -> str:
    """Return human-readable representation of condition."""
    entity_id = condition.get("entity_id", "")
    op = condition.get("operator", ConditionOperator.EQUALS)
    val = condition.get("state", "")
    return f"{entity_id} {op} {val}"


def evaluate_all(
    conditions: list[dict[str, Any]],
    state_getter: Callable[[str], Any],
) -> tuple[bool, list[str]]:
    """Evaluate all conditions and return whether any are active and their descriptions."""
    active_descriptions: list[str] = []

    for cond in conditions:
        entity_id = cond.get("entity_id")
        if not entity_id:
            continue
        entity_state_obj = state_getter(entity_id)
        if entity_state_obj is None:
            continue

        state_val = getattr(entity_state_obj, "state", None)
        attrs = getattr(entity_state_obj, "attributes", {})

        if evaluate_condition(cond, state_val, attrs):
            active_descriptions.append(format_condition_description(cond))

    return (len(active_descriptions) > 0, active_descriptions)
