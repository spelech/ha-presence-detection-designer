"""LLM and Vision Verification adapter for Presence Detection Designer."""

from __future__ import annotations

import base64
import json
import logging
import re
from typing import Any

import aiohttp

from .const import (
    DEFAULT_LLM_PROMPT,
    LLMProviderType,
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


class LLMVerifier:
    """Verifies room occupancy via Camera snapshots and Vision LLMs."""

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
            # Use HA aiohttp helper if available
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
                _LOGGER.error("Failed to fetch image from camera entity %s: %s", camera_entity_id, err)

        return None

    async def async_verify(self, image_bytes: bytes) -> tuple[bool, str]:
        """Send image to LLM and evaluate occupancy."""
        if not image_bytes:
            return False, "No snapshot image data provided"

        if self.provider_type == LLMProviderType.VISION_API:
            return await self._async_verify_vision_api(image_bytes)
        elif self.provider_type == LLMProviderType.CONVERSATION:
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
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{b64_image}"
                            },
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

    async def _async_verify_conversation(self, image_bytes: bytes) -> tuple[bool, str]:
        """Call Home Assistant Conversation agent."""
        if self.hass is None:
            return False, "Home Assistant instance not available"

        try:
            from homeassistant.components import conversation
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
