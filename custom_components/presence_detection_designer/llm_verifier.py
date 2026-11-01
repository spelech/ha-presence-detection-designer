"""LLM, Vision Verification, and Presence Explanation adapter."""

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
)
from .config_translator import (
    _extract_json_dict,
    _heuristic_config_from_entities,
    async_translate_room_config,
)
from .const import (
    CONF_ROOM_NAME,
    DEFAULT_LLM_PROMPT,
    LLMProviderType,
)

__all__ = [
    "LLMVerifier",
    "_extract_json_dict",
    "_heuristic_config_from_entities",
    "parse_llm_json_response",
]

_LOGGER = logging.getLogger(__name__)


def parse_llm_json_response(raw_text: str) -> tuple[bool, str]:
    """Parse JSON or extract verdict from LLM output."""
    if not raw_text:
        return False, "Empty LLM response"

    match = re.search(r"\{.*\}", raw_text, re.DOTALL)
    if match:
        try:
            data = json.loads(match.group(0))
            if "person_detected" in data:
                return bool(data["person_detected"]), str(data.get("reason", ""))
        except Exception:  # noqa: BLE001
            pass

    lower = raw_text.lower()
    if any(k in lower for k in ("no person", "nobody", "empty", "no human", "no occupant")):
        return False, raw_text.strip()
    if any(k in lower for k in ("person", "human", "occupant", "someone", "man", "woman", "child")):
        return True, raw_text.strip()

    return False, raw_text.strip()


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
        headers = {"Content-Type": "application/json"}
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
                import importlib
                import sys

                ai_task = sys.modules.get(
                    "homeassistant.components.ai_task"
                ) or importlib.import_module("homeassistant.components.ai_task")

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
            import importlib
            import sys

            conversation = sys.modules.get(
                "homeassistant.components.conversation"
            ) or importlib.import_module("homeassistant.components.conversation")

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

        if self.hass is not None:
            if self.provider_type == LLMProviderType.AI_TASK:
                try:
                    import importlib
                    import sys

                    ai_task = sys.modules.get(
                        "homeassistant.components.ai_task"
                    ) or importlib.import_module("homeassistant.components.ai_task")

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
                import importlib
                import sys

                conversation = sys.modules.get(
                    "homeassistant.components.conversation"
                ) or importlib.import_module("homeassistant.components.conversation")

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
        return await async_translate_room_config(
            verifier=self,
            direction=direction,
            room_name=room_name,
            description=description,
            yaml_config=yaml_config,
            available_entities=available_entities,
            use_llm=use_llm,
        )
