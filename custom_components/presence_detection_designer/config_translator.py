"""Bidirectional Natural-Language <-> YAML/Designer Config translation and heuristic builder."""

from __future__ import annotations

import json
import re
from typing import Any

from .bayesian_engine import (
    config_to_yaml_representations,
    explain_config_in_natural_language,
    parse_yaml_or_dict_to_config,
)
from .const import (
    CONF_BAYESIAN_OBSERVATIONS,
    CONF_BAYESIAN_PRIOR,
    CONF_BAYESIAN_THRESHOLD,
    CONF_BOUNDARY_ENTITIES,
    CONF_CAMERA_ENTITY,
    CONF_INACTIVITY_TIMEOUT,
    CONF_MODE,
    CONF_ROOM_NAME,
    CONF_SUSTAINING_CONDITIONS,
    CONF_TRIGGER_ENTITIES,
    DEFAULT_BAYESIAN_PRIOR,
    DEFAULT_BAYESIAN_THRESHOLD,
    DEFAULT_INACTIVITY_TIMEOUT,
    BayesianWeightPreset,
    ConditionOperator,
    Mode,
)


def _extract_json_dict(raw_text: str) -> dict[str, Any] | None:
    """Extract a JSON object from LLM text output if present."""
    if not raw_text:
        return None
    match = re.search(r"\{.*\}", raw_text, re.DOTALL)
    if not match:
        return None
    try:
        parsed = json.loads(match.group(0))
        if isinstance(parsed, dict):
            return parsed
    except Exception:  # noqa: BLE001
        return None
    return None


def _heuristic_config_from_entities(
    room_name: str,
    description: str,
    available_entities: list[dict[str, str]],
) -> dict[str, Any]:
    """Deterministic fallback that builds a Designer config from entity metadata and text."""
    boundaries: list[str] = []
    triggers: list[str] = []
    conditions: list[dict[str, Any]] = []
    observations: list[dict[str, Any]] = []
    camera_entity: str | None = None

    for ent in available_entities:
        eid = ent.get("entity_id", "")
        fname = ent.get("name") or eid
        lower_id = eid.lower()

        if eid.startswith("camera.") and not camera_entity:
            camera_entity = eid
            continue

        if eid.startswith("binary_sensor."):
            if "door" in lower_id:
                boundaries.append(eid)
            elif "person_occupancy" in lower_id:
                is_zone = any(
                    z in lower_id
                    for z in ("couch", "desk", "bed", "recliner", "table", "sim_rig", "island")
                )
                preset = BayesianWeightPreset.DECISIVE if is_zone else BayesianWeightPreset.STRONG
                triggers.append(eid)
                observations.append(
                    {
                        "entity_id": eid,
                        "label": fname,
                        "preset": str(preset),
                        "operator": str(ConditionOperator.EQUALS),
                        "state": "on",
                    }
                )
            elif "motion" in lower_id:
                triggers.append(eid)
                observations.append(
                    {
                        "entity_id": eid,
                        "label": fname,
                        "preset": str(BayesianWeightPreset.MODERATE),
                        "operator": str(ConditionOperator.EQUALS),
                        "state": "on",
                    }
                )
            elif "occupancy" in lower_id:
                observations.append(
                    {
                        "entity_id": eid,
                        "label": fname,
                        "preset": str(BayesianWeightPreset.SUPPORTING),
                        "operator": str(ConditionOperator.EQUALS),
                        "state": "on",
                    }
                )
        elif eid.startswith("media_player."):
            conditions.append(
                {
                    "entity_id": eid,
                    "operator": str(ConditionOperator.EQUALS),
                    "state": "playing",
                }
            )
            observations.append(
                {
                    "entity_id": eid,
                    "label": fname,
                    "preset": str(BayesianWeightPreset.STRONG),
                    "operator": str(ConditionOperator.EQUALS),
                    "state": "playing",
                }
            )
        elif eid.startswith("sensor.") and "ble_area" in lower_id:
            observations.append(
                {
                    "entity_id": eid,
                    "label": fname,
                    "preset": str(BayesianWeightPreset.MODERATE),
                    "operator": str(ConditionOperator.EQUALS),
                    "state": room_name,
                }
            )

    for match in re.findall(
        r"\b(?:binary_sensor|sensor|media_player|camera|light)\.[a-z0-9_]+\b", description
    ):
        if match.startswith("camera.") and not camera_entity:
            camera_entity = match
        elif match.startswith("binary_sensor.") and "door" in match and match not in boundaries:
            boundaries.append(match)
        elif match.startswith("binary_sensor.") and match not in triggers:
            triggers.append(match)
            observations.append(
                {
                    "entity_id": match,
                    "preset": str(BayesianWeightPreset.STRONG),
                    "operator": str(ConditionOperator.EQUALS),
                    "state": "on",
                }
            )
        elif match.startswith("media_player."):
            conditions.append(
                {
                    "entity_id": match,
                    "operator": str(ConditionOperator.EQUALS),
                    "state": "playing",
                }
            )

    mode = Mode.BOUNDED if boundaries else Mode.OPEN
    result: dict[str, Any] = {
        CONF_ROOM_NAME: room_name,
        CONF_MODE: str(mode),
        CONF_BAYESIAN_PRIOR: DEFAULT_BAYESIAN_PRIOR,
        CONF_BAYESIAN_THRESHOLD: DEFAULT_BAYESIAN_THRESHOLD,
        CONF_INACTIVITY_TIMEOUT: DEFAULT_INACTIVITY_TIMEOUT,
        CONF_BOUNDARY_ENTITIES: boundaries,
        CONF_TRIGGER_ENTITIES: triggers,
        CONF_SUSTAINING_CONDITIONS: conditions,
        CONF_BAYESIAN_OBSERVATIONS: observations,
    }
    if camera_entity:
        result[CONF_CAMERA_ENTITY] = camera_entity
    return result


async def async_translate_room_config(
    verifier: Any,
    direction: str = "auto",
    room_name: str | None = None,
    description: str | None = None,
    yaml_config: str | dict[str, Any] | None = None,
    available_entities: list[dict[str, str]] | None = None,
    use_llm: bool = True,
) -> dict[str, Any]:
    """Translate back and forth between natural language descriptions and YAML/Designer configs."""
    effective_dir = direction
    if effective_dir in ("yaml_to_nl", "to_natural_language"):
        effective_dir = "to_natural_language"
    elif effective_dir in ("nl_to_yaml", "to_yaml"):
        effective_dir = "to_yaml"
    elif effective_dir == "auto":
        effective_dir = "to_natural_language" if yaml_config else "to_yaml"

    if effective_dir == "to_natural_language" and yaml_config is not None:
        normalized = parse_yaml_or_dict_to_config(yaml_config)
        if room_name:
            normalized[CONF_ROOM_NAME] = room_name
        guide = explain_config_in_natural_language(normalized)
        yaml_out = config_to_yaml_representations(normalized)

        llm_text = None
        if use_llm:
            sys_prompt = (
                "You are a Home Assistant Bayesian & Wasp-in-a-Box Presence expert. "
                "Translate the provided sensor configuration into an intuitive, friendly "
                "natural-language explanation. Explain what triggers occupancy immediately, "
                "what requires multiple corroborating sensors, and how presence is sustained."
            )
            usr_prompt = (
                f"Deterministic Breakdown:\n{guide}\n\n"
                f"YAML Configuration:\n{yaml_out['designer_yaml']}"
            )
            llm_text = await verifier.async_generate_text(sys_prompt, usr_prompt)

        return {
            "direction": "to_natural_language",
            "room_name": normalized.get(CONF_ROOM_NAME, "Room"),
            "designer_config": normalized,
            "designer_yaml": yaml_out["designer_yaml"],
            "ha_bayesian_yaml": yaml_out["ha_bayesian_yaml"],
            "natural_language_explanation": llm_text or guide,
            "deterministic_guide": guide,
        }

    target_room = room_name or "Room"
    nl_desc = description or f"Configure presence detection for {target_room}"
    entities_context = json.dumps(available_entities or [], indent=2)

    generated_config: dict[str, Any] | None = None
    if use_llm:
        sys_prompt = (
            "You convert natural-language Home Assistant room presence descriptions into "
            "a JSON configuration object for `presence_detection_designer`. "
            "Output ONLY valid JSON with these keys:\n"
            "- room_name (str)\n"
            "- mode ('open' or 'bounded')\n"
            "- bayesian_prior (float, default 0.20)\n"
            "- bayesian_threshold (float, default 0.75)\n"
            "- inactivity_timeout (int, seconds, default 300)\n"
            "- grace_timeout (int, seconds, default 60)\n"
            "- extend_timeout (int, seconds, default 300)\n"
            "- boundary_entities (list of door binary_sensor entity_ids)\n"
            "- trigger_entities (list of high-confidence binary_sensor entity_ids)\n"
            "- sustaining_conditions (list of {entity_id, operator, state})\n"
            "- bayesian_observations (list of {entity_id, label, preset, operator, state} "
            "where preset is one of 'decisive', 'strong', 'moderate', 'supporting')"
        )
        usr_prompt = (
            f"Room Name: {target_room}\n"
            f"Natural Language Request: {nl_desc}\n"
            f"Available Entities in Home Assistant:\n{entities_context}"
        )
        llm_raw = await verifier.async_generate_text(sys_prompt, usr_prompt)
        generated_config = _extract_json_dict(llm_raw or "")

    if not generated_config:
        generated_config = _heuristic_config_from_entities(
            target_room, nl_desc, available_entities or []
        )

    normalized = parse_yaml_or_dict_to_config(generated_config)
    guide = explain_config_in_natural_language(normalized)
    yaml_out = config_to_yaml_representations(normalized)

    return {
        "direction": "to_yaml",
        "room_name": normalized.get(CONF_ROOM_NAME, target_room),
        "designer_config": normalized,
        "designer_yaml": yaml_out["designer_yaml"],
        "ha_bayesian_yaml": yaml_out["ha_bayesian_yaml"],
        "natural_language_explanation": guide,
    }
