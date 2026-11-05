"""Coordinator helper functions for Room Presence Designer."""

from __future__ import annotations

import logging
from typing import Any

from .const import (
    CONF_LLM_AGENT_ID,
    CONF_LLM_API_KEY,
    CONF_LLM_API_URL,
    CONF_LLM_MODEL,
    CONF_LLM_PROVIDER_TYPE,
    DATA_STORE,
    DOMAIN,
    LLMProviderType,
)

_LOGGER = logging.getLogger(__name__)


def resolve_global_llm_defaults(hass: Any, config: dict[str, Any]) -> dict[str, Any]:
    """Merge global_settings from PDDStore for any unset LLM fields."""
    gs: dict[str, Any] = {}
    if hass and isinstance(getattr(hass, "data", None), dict):
        store = hass.data.get(DOMAIN, {}).get(DATA_STORE)
        if store is not None and hasattr(store, "global_settings"):
            gs = store.global_settings or {}

    return {
        CONF_LLM_PROVIDER_TYPE: (
            config.get(CONF_LLM_PROVIDER_TYPE)
            or gs.get("llm_provider_type")
            or LLMProviderType.VISION_API
        ),
        CONF_LLM_AGENT_ID: config.get(CONF_LLM_AGENT_ID) or gs.get("llm_agent_id"),
        CONF_LLM_API_URL: config.get(CONF_LLM_API_URL) or gs.get("llm_api_url"),
        CONF_LLM_API_KEY: config.get(CONF_LLM_API_KEY) or gs.get("llm_api_key"),
        CONF_LLM_MODEL: config.get(CONF_LLM_MODEL) or gs.get("llm_model"),
    }


async def async_send_coordinator_test_notification(
    coord: Any,
    service: str | None = None,
    channel: str | None = None,
    verbosity: str | None = None,
) -> bool:
    """Send a test diagnostic notification to verify Slack connectivity."""
    from .notifications import TransitionAttribution

    global_settings: dict[str, Any] = {}
    if coord.hass and hasattr(coord.hass, "data") and isinstance(coord.hass.data, dict):
        store = coord.hass.data.get(DOMAIN, {}).get(DATA_STORE)
        if store is not None and hasattr(store, "global_settings"):
            global_settings = dict(store.global_settings or {})

    if service:
        global_settings["slack_notify_service"] = service
    if channel:
        global_settings["slack_channel"] = channel
    if verbosity:
        global_settings["slack_verbosity"] = verbosity

    attribution = TransitionAttribution(
        room_id=coord.entry_id,
        room_name=coord.room_name,
        from_state="clear",
        to_state="occupied",
        primary_driver="Test Trigger (Manual Studio Verification)",
        driver_type="sensor",
        confidence_pct=95.0,
        threshold_pct=75.0,
        active_sensors=["test_sensor.manual_ping"],
        sustaining_conditions=[],
        arrival_context="Manual Studio Test",
        duration_occupied_str=None,
    )
    return await coord._notification_dispatcher.async_dispatch_notification(
        coord.hass,
        attribution,
        global_settings,
        {"notify_slack": True, "notify_on_occupied": True},
    )
