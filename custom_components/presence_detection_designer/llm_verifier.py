"""LLM, Vision Verification, and Bidirectional Config/Explanation adapter."""

from __future__ import annotations

import base64
import json
import logging
import re
from typing import Any

import aiohttp

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
    DEFAULT_LLM_PROMPT,
    BayesianWeightPreset,
    ConditionOperator,
    LLMProviderType,
    Mode,
)

_LOGGER = logging.getLogger(__name__)


def parse_llm_json_response(raw_text: str) -> tuple[bool, str]:
    """Parse JSON or extract verdict from LLM output."""
    if not raw_text:
        return False, "Empty LLM response"

    # Attempt regex to find JSON {...}
    match = re.search(r"\{.*\}", raw_text, re.DOTALL)
    if match:
        try:
            data = json.loads(match.group(0))
            if "person_detected" in data:
                return bool(data["person_detected"]), str(data.get("reason", ""))
        except Exception:  # noqa: BLE001
            pass

    # Keyword fallback
    lower = raw_text.lower()
    if any(k in lower for k in ("no person", "nobody", "empty", "no human", "no occupant")):
        return False, raw_text.strip()
    if any(k in lower for k in ("person", "human", "occupant", "someone", "man", "woman", "child")):
        return True, raw_text.strip()

    return False, raw_text.strip()


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


class LLMVerifier:
    """Verifies room occupancy via Camera snapshots and translates/explains Bayesian configs."""

    def __init__(
        self,
        hass: Any = None,
        provider_type: LLMProviderType = LLMProviderType.VISION_API,
        agent_id: str | None = None,
        api_url: str | None = None,
        api_key: str | None = None,
        model: str | None = None,
        prompt: str = DEFAULT_LLM_PROMPT,
        session: aiohttp.ClientSession | None = None,
    ) -> None:
        self.hass = hass
        self.provider_type = provider_type
        self.agent_id = agent_id
        self.api_url = api_url
        self.api_key = api_key
        self.model = model or "gpt-4o-mini"
        self.prompt = prompt
        self._session = session

    async def _get_session(self) -> aiohttp.ClientSession:
        if self._session is not None:
            if getattr(self._session, "closed", False) is True:
                self._session = None
            else:
                return self._session
        if self.hass is not None and hasattr(self.hass, "helpers"):
            try:
                from homeassistant.helpers.aiohttp_client import async_get_clientsession

                return async_get_clientsession(self.hass)
            except Exception:  # noqa: BLE001
                pass
        self._session = aiohttp.ClientSession()
        return self._session

    async def async_acquire_snapshot(
        self,
        camera_entity_id: str | None = None,
        direct_url: str | None = None,
    ) -> bytes | None:
        """Acquire snapshot bytes from direct URL or HA camera entity."""
        session = await self._get_session()

        if direct_url:
            try:
                async with session.get(direct_url, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                    if resp.status == 200:
                        return await resp.read()
                    _LOGGER.warning("Direct snapshot URL returned status %s", resp.status)
            except Exception as err:  # noqa: BLE001
                _LOGGER.error("Failed to fetch camera snapshot from URL %s: %s", direct_url, err)
                return None

        if camera_entity_id and self.hass is not None:
            try:
                from homeassistant.components.camera import async_get_image

                image_data = await async_get_image(self.hass, camera_entity_id)
                return image_data.content
            except Exception as err:  # noqa: BLE001
                _LOGGER.error(
                    "Failed to fetch image from camera entity %s: %s", camera_entity_id, err
                )

        return None

    async def async_verify(self, image_bytes: bytes) -> tuple[bool, str]:
        """Send image to LLM and evaluate occupancy."""
        if not image_bytes:
            return False, "No snapshot image data provided"

        if self.provider_type == LLMProviderType.VISION_API:
            return await self._async_verify_vision_api(image_bytes)
        if self.provider_type == LLMProviderType.AI_TASK:
            return await self._async_verify_ai_task(image_bytes)
        if self.provider_type == LLMProviderType.CONVERSATION:
            return await self._async_verify_conversation(image_bytes)

        return False, "Unknown provider type"

    async def _async_verify_vision_api(self, image_bytes: bytes) -> tuple[bool, str]:
        """Call OpenAI-compatible vision completion endpoint."""
        if not self.api_url:
            return False, "No Vision API URL configured"

        session = await self._get_session()
        b64_image = base64.b64encode(image_bytes).decode("utf-8")
        headers = {
            "Content-Type": "application/json",
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": self.prompt},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{b64_image}"},
                        },
                    ],
                }
            ],
            "response_format": {"type": "json_object"},
        }

        try:
            async with session.post(
                self.api_url,
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=20),
            ) as resp:
                if resp.status != 200:
                    text = await resp.text()
                    _LOGGER.error("Vision API error %s: %s", resp.status, text)
                    return False, f"Vision API HTTP error {resp.status}"

                data = await resp.json()
                content = data["choices"][0]["message"]["content"]
                return parse_llm_json_response(content)
        except Exception as err:  # noqa: BLE001
            _LOGGER.error("Exception calling Vision API: %s", err)
            return False, f"Vision API call failed: {err}"

    async def _async_verify_ai_task(self, image_bytes: bytes) -> tuple[bool, str]:
        """Call Home Assistant AI Task component if available, falling back to Vision API."""
        if self.hass is not None:
            try:
                from homeassistant.components import ai_task

                result = await ai_task.async_generate_data(
                    self.hass,
                    task_name="presence_detection_verify",
                    entity_id=self.agent_id,
                    instructions=self.prompt,
                )
                raw = getattr(result, "data", "") or str(result)
                return parse_llm_json_response(str(raw))
            except Exception as err:  # noqa: BLE001
                _LOGGER.debug("AI Task verification fallback: %s", err)

        if self.api_url:
            return await self._async_verify_vision_api(image_bytes)
        return False, "AI Task unavailable and no Vision API URL configured"

    async def _async_verify_conversation(self, image_bytes: bytes) -> tuple[bool, str]:
        """Call Home Assistant Conversation agent."""
        if self.hass is None:
            return False, "Home Assistant instance not available"

        try:
            from homeassistant.components import conversation

            try:
                from homeassistant.core import Context

                ctx = Context()
                result = await conversation.async_converse(
                    self.hass,
                    text=self.prompt,
                    conversation_id=None,
                    context=ctx,
                    agent_id=self.agent_id,
                )
            except TypeError:
                result = await conversation.async_converse(
                    self.hass,
                    text=self.prompt,
                    conversation_id=None,
                    agent_id=self.agent_id,
                )
            resp_text = result.response.speech.get("plain", {}).get("speech", "")
            return parse_llm_json_response(resp_text)
        except Exception as err:  # noqa: BLE001
            _LOGGER.error("Exception calling conversation agent: %s", err)
            return False, f"Conversation agent error: {err}"

    async def async_generate_text(self, system_prompt: str, user_prompt: str) -> str | None:
        """Query the configured LLM (Vision/Chat API, AI Task, or HA Conversation) for text generation."""
        # 1. Try OpenAI-compatible Chat API if configured
        if self.api_url:
            try:
                session = await self._get_session()
                headers = {"Content-Type": "application/json"}
                if self.api_key:
                    headers["Authorization"] = f"Bearer {self.api_key}"
                payload = {
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                }
                async with session.post(
                    self.api_url,
                    headers=headers,
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=25),
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return str(data["choices"][0]["message"]["content"]).strip()
            except Exception as err:  # noqa: BLE001
                _LOGGER.warning("Chat API text generation failed: %s", err)

        # 2. Try HA AI Task or Conversation integration if available
        if self.hass is not None:
            if self.provider_type == LLMProviderType.AI_TASK:
                try:
                    from homeassistant.components import ai_task

                    res = await ai_task.async_generate_data(
                        self.hass,
                        task_name="presence_detection_designer",
                        entity_id=self.agent_id,
                        instructions=f"{system_prompt}\n\n{user_prompt}",
                    )
                    return str(getattr(res, "data", res)).strip()
                except Exception as err:  # noqa: BLE001
                    _LOGGER.debug("AI Task text generation skipped: %s", err)

            try:
                from homeassistant.components import conversation

                combined = f"{system_prompt}\n\n{user_prompt}"
                try:
                    from homeassistant.core import Context

                    res = await conversation.async_converse(
                        self.hass,
                        text=combined,
                        conversation_id=None,
                        context=Context(),
                        agent_id=self.agent_id,
                    )
                except TypeError:
                    res = await conversation.async_converse(
                        self.hass,
                        text=combined,
                        conversation_id=None,
                        agent_id=self.agent_id,
                    )
                speech = res.response.speech.get("plain", {}).get("speech", "")
                if speech and "Sorry, I am not aware" not in speech:
                    return str(speech).strip()
            except Exception as err:  # noqa: BLE001
                _LOGGER.debug("Conversation text generation skipped: %s", err)

        return None

    async def async_explain_presence(
        self,
        room_config: dict[str, Any],
        live_explanation: str,
        use_llm: bool = True,
    ) -> dict[str, Any]:
        """Generate a complete natural-language and YAML explanation of a room's presence state."""
        config_guide = explain_config_in_natural_language(room_config)
        yaml_snippets = config_to_yaml_representations(room_config)

        llm_narrative: str | None = None
        if use_llm:
            sys_prompt = (
                "You are a Home Assistant Presence Detection & Bayesian Sensor Fusion expert. "
                "Explain clearly and concisely in plain English why this room is currently "
                "occupied or vacant, how each active and inactive sensor affects the Bayesian "
                "probability, and offer 1-2 brief, practical tuning tips if relevant."
            )
            usr_prompt = (
                f"Live Status:\n{live_explanation}\n\n"
                f"Room Architecture & Bayesian Rules:\n{config_guide}\n\n"
                f"Designer YAML:\n{yaml_snippets['designer_yaml']}"
            )
            llm_narrative = await self.async_generate_text(sys_prompt, usr_prompt)

        return {
            "room_name": room_config.get(CONF_ROOM_NAME, "Room"),
            "live_summary": live_explanation,
            "rule_guide": config_guide,
            "llm_explanation": llm_narrative or f"{live_explanation}\n\n{config_guide}",
            "designer_yaml": yaml_snippets["designer_yaml"],
            "ha_bayesian_yaml": yaml_snippets["ha_bayesian_yaml"],
        }

    async def async_translate_config(
        self,
        direction: str = "auto",
        room_name: str | None = None,
        description: str | None = None,
        yaml_config: str | dict[str, Any] | None = None,
        available_entities: list[dict[str, str]] | None = None,
        use_llm: bool = True,
    ) -> dict[str, Any]:
        """Translate back and forth between natural language descriptions and YAML/Designer configs."""
        effective_dir = direction
        if effective_dir == "auto":
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
                llm_text = await self.async_generate_text(sys_prompt, usr_prompt)

            return {
                "direction": "to_natural_language",
                "room_name": normalized.get(CONF_ROOM_NAME, "Room"),
                "designer_config": normalized,
                "designer_yaml": yaml_out["designer_yaml"],
                "ha_bayesian_yaml": yaml_out["ha_bayesian_yaml"],
                "natural_language_explanation": llm_text or guide,
                "deterministic_guide": guide,
            }

        # Direction: Natural Language -> YAML & Designer Config
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
            llm_raw = await self.async_generate_text(sys_prompt, usr_prompt)
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

    # Also extract any explicit entity_ids mentioned in the description text
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
