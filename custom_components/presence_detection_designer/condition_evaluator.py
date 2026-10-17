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
    Supports optional 'attribute' key in condition to evaluate an attribute value
    instead of the primary state string.
    """
    attr_name = condition.get("attribute")
    if attr_name:
        if not current_attributes or attr_name not in current_attributes:
            return False
        raw_val = current_attributes.get(attr_name)
        if raw_val is None:
            return False
        eval_value = str(raw_val)
    else:
        if current_state is None or str(current_state).lower() in ("unavailable", "unknown"):
            return False
        eval_value = str(current_state)

    operator = condition.get("operator", ConditionOperator.EQUALS)
    target_state = condition.get("state", "on")

    # Compare numeric if operator requires
    if operator in (ConditionOperator.GREATER_THAN, ConditionOperator.LESS_THAN):
        curr_num = _to_float(eval_value)
        target_num = _to_float(target_state)
        if curr_num is None or target_num is None:
            return False
        if operator == ConditionOperator.GREATER_THAN:
            return curr_num > target_num
        return curr_num < target_num

    # Set / list membership operator ("in")
    if operator == ConditionOperator.IN:
        if isinstance(target_state, (list, tuple, set)):
            candidates = [str(item).strip().lower() for item in target_state]
        else:
            candidates = [
                part.strip().lower() for part in str(target_state).split(",") if part.strip()
            ]
        return eval_value.strip().lower() in candidates

    # For equals / not_equals, check if both are numeric first
    curr_num = _to_float(eval_value)
    target_num = _to_float(target_state)
    if curr_num is not None and target_num is not None:
        is_match = curr_num == target_num
    else:
        is_match = eval_value.strip().lower() == str(target_state).strip().lower()

    if operator == ConditionOperator.EQUALS:
        return is_match
    if operator == ConditionOperator.NOT_EQUALS:
        return not is_match

    return False


def format_condition_description(condition: dict[str, Any]) -> str:
    """Return human-readable representation of condition."""
    label = condition.get("label")
    entity_id = condition.get("entity_id", "")
    attr_name = condition.get("attribute")
    op = str(condition.get("operator", ConditionOperator.EQUALS))
    val = condition.get("state", "on")
    subject = f"{entity_id}.{attr_name}" if attr_name else entity_id
    base = f"{subject} {op} {val}"
    if label:
        return f"{label} ({base})"
    return base


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
