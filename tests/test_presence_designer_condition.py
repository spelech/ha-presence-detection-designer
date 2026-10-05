"""Test Presence Detection Designer condition evaluator."""

from unittest.mock import MagicMock

from custom_components.presence_detection_designer.condition_evaluator import (
    evaluate_all,
    evaluate_condition,
)
from custom_components.presence_detection_designer.const import ConditionOperator


def test_evaluate_condition_equals():
    """Test equals operator."""
    cond = {
        "entity_id": "media_player.tv",
        "operator": ConditionOperator.EQUALS,
        "state": "playing",
    }
    assert evaluate_condition(cond, "playing") is True
    assert evaluate_condition(cond, "Playing") is True  # case insensitive
    assert evaluate_condition(cond, "paused") is False
    assert evaluate_condition(cond, None) is False


def test_evaluate_condition_not_equals():
    """Test not_equals operator."""
    cond = {
        "entity_id": "media_player.tv",
        "operator": ConditionOperator.NOT_EQUALS,
        "state": "off",
    }
    assert evaluate_condition(cond, "playing") is True
    assert evaluate_condition(cond, "idle") is True
    assert evaluate_condition(cond, "off") is False
    assert evaluate_condition(cond, "Off") is False
    assert evaluate_condition(cond, None) is False  # unavailable is not satisfied


def test_evaluate_condition_numeric():
    """Test numeric operators greater_than and less_than."""
    cond_gt = {
        "entity_id": "sensor.tv_power",
        "operator": ConditionOperator.GREATER_THAN,
        "state": "25.0",
    }
    assert evaluate_condition(cond_gt, "45.2") is True
    assert evaluate_condition(cond_gt, "10.0") is False
    assert evaluate_condition(cond_gt, "not_a_number") is False

    cond_lt = {
        "entity_id": "sensor.light_level",
        "operator": ConditionOperator.LESS_THAN,
        "state": "50",
    }
    assert evaluate_condition(cond_lt, "30") is True
    assert evaluate_condition(cond_lt, "80") is False


def test_evaluate_all():
    """Test evaluating a list of conditions."""
    conditions = [
        {
            "entity_id": "media_player.tv",
            "operator": ConditionOperator.EQUALS,
            "state": "playing",
        },
        {
            "entity_id": "light.lamp",
            "operator": ConditionOperator.EQUALS,
            "state": "on",
        },
    ]

    mock_state_tv = MagicMock(state="playing")
    mock_state_lamp = MagicMock(state="off")

    def state_getter(entity_id: str):
        if entity_id == "media_player.tv":
            return mock_state_tv
        if entity_id == "light.lamp":
            return mock_state_lamp
        return None

    any_active, active_descriptions = evaluate_all(conditions, state_getter)
    assert any_active is True
    assert len(active_descriptions) == 1
    assert "media_player.tv equals playing" in active_descriptions[0]
