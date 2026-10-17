"""Test Bayesian Sensor Fusion Engine, Probability Sensor, and Bidirectional LLM/YAML Translation."""

from __future__ import annotations

import json
from unittest.mock import AsyncMock, MagicMock

import pytest

from custom_components.presence_detection_designer import (
    async_setup,
    async_setup_entry,
)
from custom_components.presence_detection_designer.bayesian_engine import (
    config_to_yaml_representations,
    evaluate_bayesian,
    explain_config_in_natural_language,
    infer_preset_from_weights,
    parse_yaml_or_dict_to_config,
    resolve_observation_weights,
    solo_posterior_pct,
)
from custom_components.presence_detection_designer.condition_evaluator import (
    evaluate_condition,
    format_condition_description,
)
from custom_components.presence_detection_designer.const import (
    CONF_AREA_ID,
    CONF_BAYESIAN_OBSERVATIONS,
    CONF_BAYESIAN_PRIOR,
    CONF_BAYESIAN_THRESHOLD,
    CONF_BOUNDARY_ENTITIES,
    CONF_CAMERA_ENTITY,
    CONF_LLM_API_URL,
    CONF_LLM_ENABLED,
    CONF_MODE,
    CONF_ROOM_NAME,
    CONF_SUSTAINING_CONDITIONS,
    CONF_TRIGGER_ENTITIES,
    DOMAIN,
    BayesianWeightPreset,
    ConditionOperator,
    LLMProviderType,
    Mode,
)
from custom_components.presence_detection_designer.coordinator import (
    RoomPresenceCoordinator,
)
from custom_components.presence_detection_designer.llm_verifier import LLMVerifier
from custom_components.presence_detection_designer.sensor import (
    OccupancyProbabilitySensor,
)
from custom_components.presence_detection_designer.sensor import (
    async_setup_entry as async_setup_sensor,
)


def test_condition_in_and_attribute_matching():
    """Test ConditionOperator.IN and attribute evaluation."""
    cond_in_str = {
        "entity_id": "media_player.shield",
        "operator": ConditionOperator.IN,
        "state": "playing,paused",
        "label": "Shield Active",
    }
    assert evaluate_condition(cond_in_str, "playing") is True
    assert evaluate_condition(cond_in_str, "paused") is True
    assert evaluate_condition(cond_in_str, "off") is False
    assert "Shield Active" in format_condition_description(cond_in_str)

    cond_in_list = {
        "entity_id": "sensor.steve_ble_area",
        "operator": ConditionOperator.IN,
        "state": ["Office", "Steve's Office"],
    }
    assert evaluate_condition(cond_in_list, "Office") is True
    assert evaluate_condition(cond_in_list, "Kitchen") is False

    cond_attr = {
        "entity_id": "climate.thermostat",
        "attribute": "hvac_action",
        "operator": ConditionOperator.EQUALS,
        "state": "heating",
    }
    assert evaluate_condition(cond_attr, "heat", {"hvac_action": "heating"}) is True
    assert evaluate_condition(cond_attr, "heat", {"hvac_action": "idle"}) is False
    assert evaluate_condition(cond_attr, "heat", {}) is False


def test_bayesian_presets_and_corroboration_math():
    """Test Bayesian preset weights, solo thresholds, and multi-sensor corroboration."""
    assert infer_preset_from_weights(0.95, 0.02) == BayesianWeightPreset.DECISIVE
    assert infer_preset_from_weights(0.85, 0.05) == BayesianWeightPreset.STRONG
    assert infer_preset_from_weights(0.72, 0.12) == BayesianWeightPreset.MODERATE
    assert infer_preset_from_weights(0.50, 0.25) == BayesianWeightPreset.SUPPORTING

    preset, pt, pf = resolve_observation_weights({"preset": "decisive"})
    assert preset == "decisive"
    assert pt == 0.95 and pf == 0.02
    assert solo_posterior_pct(0.20, pt, pf) == 92.2

    observations = [
        {
            "entity_id": "binary_sensor.steves_desk_person_occupancy",
            "label": "Person at Steve's Desk",
            "preset": "decisive",
        },
        {
            "entity_id": "sensor.steve_s_s25_ble_area",
            "label": "Steve's Phone in Office",
            "preset": "moderate",
            "operator": "equals",
            "state": "Office",
        },
        {
            "entity_id": "binary_sensor.office_occupancy",
            "label": "Office Ecobee Occupancy",
            "preset": "supporting",
            "penalize_when_off": True,
        },
    ]

    states: dict[str, MagicMock] = {
        "binary_sensor.steves_desk_person_occupancy": MagicMock(state="off", attributes={}),
        "sensor.steve_s_s25_ble_area": MagicMock(state="Kitchen", attributes={}),
        "binary_sensor.office_occupancy": MagicMock(state="off", attributes={}),
    }

    # 1. All off (with penalize_when_off on supporting)
    eval_empty = evaluate_bayesian(
        observations, lambda eid: states.get(eid), prior=0.20, threshold=0.75
    )
    assert eval_empty.is_occupied is False
    assert eval_empty.probability_pct < 20.0
    assert "Below threshold" in eval_empty.natural_language_summary

    # 2. Only slow Ecobee supporting sensor is ON -> 40.7% (below 75% threshold!)
    states["binary_sensor.office_occupancy"].state = "on"
    eval_supp = evaluate_bayesian(
        observations, lambda eid: states.get(eid), prior=0.20, threshold=0.75
    )
    assert eval_supp.is_occupied is False
    assert eval_supp.probability_pct == 40.7

    # 3. Moderate BLE sensor ALSO turns ON -> 80.5% (crosses 75% threshold via corroboration!)
    states["sensor.steve_s_s25_ble_area"].state = "Office"
    eval_combo = evaluate_bayesian(
        observations, lambda eid: states.get(eid), prior=0.20, threshold=0.75
    )
    assert eval_combo.is_occupied is True
    assert eval_combo.probability_pct == 80.5
    assert "Steve's Phone in Office" in eval_combo.natural_language_summary
    assert "Office Ecobee Occupancy" in eval_combo.natural_language_summary

    # 4. Decisive Frigate desk zone turns ON solo -> 92.2%
    states["binary_sensor.office_occupancy"].state = "off"
    states["sensor.steve_s_s25_ble_area"].state = "Kitchen"
    states["binary_sensor.steves_desk_person_occupancy"].state = "on"
    eval_decisive = evaluate_bayesian(
        observations, lambda eid: states.get(eid), prior=0.20, threshold=0.75
    )
    assert eval_decisive.is_occupied is True
    assert eval_decisive.probability_pct > 85.0


def test_yaml_and_natural_language_roundtrip():
    """Test converting between HA platform:bayesian YAML, Designer config, and Natural Language."""
    ha_bayesian_yaml = """
- platform: bayesian
  name: "Bayesian Office"
  unique_id: "bayesian_office_occupancy"
  prior: 0.20
  probability_threshold: 0.75
  observations:
    - platform: state
      entity_id: binary_sensor.steves_desk_person_occupancy
      prob_given_true: 0.95
      prob_given_false: 0.02
      to_state: "on"
    - platform: numeric_state
      entity_id: sensor.office_ups_used_watts_filtered
      prob_given_true: 0.85
      prob_given_false: 0.05
      above: 140
    - platform: state
      entity_id: binary_sensor.office_occupancy
      prob_given_true: 0.55
      prob_given_false: 0.20
      to_state: "on"
"""
    parsed_cfg = parse_yaml_or_dict_to_config(ha_bayesian_yaml)
    assert parsed_cfg[CONF_ROOM_NAME] == "Office"
    assert parsed_cfg[CONF_BAYESIAN_PRIOR] == 0.20
    assert parsed_cfg[CONF_BAYESIAN_THRESHOLD] == 0.75
    assert "binary_sensor.steves_desk_person_occupancy" in parsed_cfg[CONF_TRIGGER_ENTITIES]
    assert len(parsed_cfg[CONF_BAYESIAN_OBSERVATIONS]) == 3

    guide = explain_config_in_natural_language(parsed_cfg)
    assert "Office — Presence Architecture & Bayesian Sensor Guide" in guide
    assert "DECISIVE" in guide
    assert "STRONG" in guide
    assert "SUPPORTING" in guide

    yamls = config_to_yaml_representations(parsed_cfg)
    assert "platform: bayesian" in yamls["ha_bayesian_yaml"]
    assert "above: 140" in yamls["ha_bayesian_yaml"]
    assert "bayesian_observations:" in yamls["designer_yaml"]


@pytest.mark.asyncio
async def test_probability_sensor_and_services(mock_hass):
    """Test OccupancyProbabilitySensor, explain_presence, and translate_config services."""
    config = {
        CONF_ROOM_NAME: "Office",
        CONF_AREA_ID: "office",
        CONF_MODE: Mode.BOUNDED,
        CONF_BOUNDARY_ENTITIES: ["binary_sensor.office_door"],
        CONF_TRIGGER_ENTITIES: ["binary_sensor.steves_desk_person_occupancy"],
        CONF_SUSTAINING_CONDITIONS: [
            {
                "entity_id": "sensor.office_ups_used_watts_filtered",
                "operator": ConditionOperator.GREATER_THAN,
                "state": "140",
                "label": "Workstation Active Load",
            }
        ],
        CONF_BAYESIAN_PRIOR: 0.20,
        CONF_BAYESIAN_THRESHOLD: 0.75,
        CONF_BAYESIAN_OBSERVATIONS: [
            {
                "entity_id": "binary_sensor.steves_desk_person_occupancy",
                "label": "Person at Steve's Desk",
                "preset": "decisive",
            },
            {
                "entity_id": "sensor.steve_s_s25_ble_area",
                "label": "Steve's S25+ in Office",
                "preset": "moderate",
                "operator": "equals",
                "state": "Office",
            },
            {
                "entity_id": "binary_sensor.office_occupancy",
                "label": "Office Ecobee Occupancy",
                "preset": "supporting",
            },
        ],
        CONF_CAMERA_ENTITY: "camera.office",
        CONF_LLM_ENABLED: True,
        CONF_LLM_API_URL: "http://10.0.0.10:8448/v1/chat/completions",
    }

    state_map = {
        "binary_sensor.office_door": MagicMock(
            entity_id="binary_sensor.office_door",
            state="off",
            attributes={"friendly_name": "Office Door"},
        ),
        "binary_sensor.steves_desk_person_occupancy": MagicMock(
            entity_id="binary_sensor.steves_desk_person_occupancy",
            state="off",
            attributes={"friendly_name": "Steve's Desk Person"},
        ),
        "sensor.office_ups_used_watts_filtered": MagicMock(
            entity_id="sensor.office_ups_used_watts_filtered",
            state="90",
            attributes={"friendly_name": "Office UPS Watts"},
        ),
        "sensor.steve_s_s25_ble_area": MagicMock(
            entity_id="sensor.steve_s_s25_ble_area",
            state="Office",
            attributes={"friendly_name": "Steve's S25+ BLE Area"},
        ),
        "binary_sensor.office_occupancy": MagicMock(
            entity_id="binary_sensor.office_occupancy",
            state="on",
            attributes={"friendly_name": "Office Ecobee Occupancy"},
        ),
    }
    mock_hass.states.get = lambda eid: state_map.get(eid)
    mock_hass.states.async_all = lambda: list(state_map.values())

    registered_services = {}

    def mock_register(domain, service, handler, **kwargs):
        registered_services[f"{domain}.{service}"] = handler

    mock_hass.services.has_service = MagicMock(return_value=False)
    mock_hass.services.async_register = mock_register
    mock_hass.config_entries = MagicMock()
    mock_hass.config_entries.async_forward_entry_setups = AsyncMock(return_value=None)

    await async_setup(mock_hass, {})
    assert "presence_detection_designer.explain_presence" in registered_services
    assert "presence_detection_designer.translate_config" in registered_services

    mock_entry = MagicMock(entry_id="office_entry", data=config, options={})
    await async_setup_entry(mock_hass, mock_entry)

    coord: RoomPresenceCoordinator = mock_hass.data[DOMAIN]["office_entry"]
    # Because Steve's S25+ is in Office (moderate) + Ecobee Occupancy is on (supporting),
    # startup evaluation reaches 80.5% (>= 75% threshold) and marks room present!
    assert coord.state_machine.is_present is True
    assert coord.state_machine.bayesian_probability_pct == 80.5

    added_sensors = []
    await async_setup_sensor(mock_hass, mock_entry, lambda ents: added_sensors.extend(ents))
    assert len(added_sensors) == 1
    prob_sensor: OccupancyProbabilitySensor = added_sensors[0]
    await prob_sensor.async_added_to_hass()
    assert prob_sensor.native_value == 80.5
    assert prob_sensor.native_unit_of_measurement == "%"
    assert prob_sensor.extra_state_attributes["bayesian_occupied"] is True
    assert "ha_bayesian_yaml" in prob_sensor.extra_state_attributes

    # Test explain_presence service
    explain_call = MagicMock(data={"room_name": "Office", "use_llm": False})
    explain_res = await registered_services["presence_detection_designer.explain_presence"](
        explain_call
    )
    assert "Office" in explain_res["rooms"]
    assert explain_res["rooms"]["Office"]["bayesian_probability_pct"] == 80.5

    # Test translate_config service (to_natural_language from entry)
    trans_nl_call = MagicMock(
        data={"entry_id": "office_entry", "direction": "to_natural_language", "use_llm": False}
    )
    trans_nl_res = await registered_services["presence_detection_designer.translate_config"](
        trans_nl_call
    )
    assert trans_nl_res["direction"] == "to_natural_language"
    assert "DECISIVE" in trans_nl_res["natural_language_explanation"]

    # Test translate_config service (to_yaml from natural language description)
    trans_yaml_call = MagicMock(
        data={
            "direction": "to_yaml",
            "room_name": "Office",
            "description": (
                "Detect presence in the Office using binary_sensor.steves_desk_person_occupancy "
                "and binary_sensor.office_door with camera.office."
            ),
            "use_llm": False,
        }
    )
    trans_yaml_res = await registered_services["presence_detection_designer.translate_config"](
        trans_yaml_call
    )
    assert trans_yaml_res["direction"] == "to_yaml"
    assert "platform: bayesian" in trans_yaml_res["ha_bayesian_yaml"]
    assert "bayesian_observations:" in trans_yaml_res["designer_yaml"]


@pytest.mark.asyncio
async def test_llm_verifier_text_generation_and_ai_task(mock_hass):
    """Test LLMVerifier text generation via Chat API and AI Task."""
    mock_session = MagicMock()
    mock_response = AsyncMock()
    mock_response.status = 200
    mock_response.json = AsyncMock(
        return_value={
            "choices": [
                {
                    "message": {
                        "content": json.dumps(
                            {
                                "room_name": "Kitchen",
                                "mode": "open",
                                "bayesian_prior": 0.20,
                                "bayesian_threshold": 0.75,
                                "trigger_entities": [
                                    {"entity_id": "binary_sensor.kitchen_island_person_occupancy"}
                                ],
                                "boundary_entities": [{"entity_id": "binary_sensor.kitchen_door"}],
                                "sustaining_conditions": ["media_player.kitchen_display"],
                                "bayesian_observations": [
                                    {
                                        "entity_id": "binary_sensor.kitchen_island_person_occupancy",
                                        "label": "Kitchen Island Person",
                                        "preset": "decisive",
                                        "operator": "equals",
                                        "state": "on",
                                    }
                                ],
                            }
                        )
                    }
                }
            ]
        }
    )
    mock_session.post.return_value.__aenter__.return_value = mock_response

    verifier = LLMVerifier(
        hass=mock_hass,
        provider_type=LLMProviderType.VISION_API,
        api_url="http://10.0.0.10:8448/v1/chat/completions",
        api_key="test-key",
        model="gemini-2.5-flash",
        session=mock_session,
    )
    res = await verifier.async_translate_config(
        direction="to_yaml",
        room_name="Kitchen",
        description="Trigger Kitchen when someone is at the island",
        use_llm=True,
    )
    assert res["room_name"] == "Kitchen"
    assert "binary_sensor.kitchen_island_person_occupancy" in res["designer_yaml"]
    assert res["designer_config"]["trigger_entities"] == [
        "binary_sensor.kitchen_island_person_occupancy"
    ]
    assert res["designer_config"]["boundary_entities"] == ["binary_sensor.kitchen_door"]
