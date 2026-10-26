"""Presence Detection Designer custom component."""

from __future__ import annotations

import logging
from typing import Any

from homeassistant.helpers import config_validation as cv

from .bayesian_engine import parse_yaml_or_dict_to_config
from .const import (
    CONF_LLM_AGENT_ID,
    CONF_LLM_API_KEY,
    CONF_LLM_API_URL,
    CONF_LLM_MODEL,
    CONF_LLM_PROVIDER_TYPE,
    CONF_ROOM_NAME,
    DOMAIN,
    EVENT_PRESENCE_EXPLANATION,
    PANEL_REGISTERED,
    VIEWS_REGISTERED,
    LLMProviderType,
)
from .coordinator import RoomPresenceCoordinator
from .llm_verifier import LLMVerifier
from .store import async_get_store
from .views import async_apply_and_persist_room_config, async_register_views

_LOGGER = logging.getLogger(__name__)

PLATFORMS = ["binary_sensor", "sensor", "button", "switch"]

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)


async def _async_ensure_panel_and_views(hass: Any) -> None:
    """Register static path, HTTP API views, and custom sidebar panel once."""
    if not hass or not hasattr(hass, "data") or not isinstance(hass.data, dict):
        return
    domain_data = hass.data.setdefault(DOMAIN, {})

    version = "1.2.3"
    try:
        from homeassistant.loader import async_get_integration

        integration = await async_get_integration(hass, DOMAIN)
        if getattr(integration, "version", None):
            version = str(integration.version)
    except Exception:  # noqa: BLE001
        pass

    if not domain_data.get(VIEWS_REGISTERED):
        try:
            if hasattr(hass, "http") and hasattr(hass.http, "async_register_static_paths"):
                from homeassistant.components.http import StaticPathConfig

                static_dir = hass.config.path(
                    "custom_components/presence_detection_designer/static"
                )
                await hass.http.async_register_static_paths(
                    [
                        StaticPathConfig(
                            "/presence_detection_designer/static",
                            static_dir,
                            False,
                        )
                    ]
                )
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Skipping static path registration: %s", err)

        try:
            async_register_views(hass)
            domain_data[VIEWS_REGISTERED] = True
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Skipping HTTP view registration: %s", err)

    if domain_data.get(PANEL_REGISTERED) != version:
        try:
            from homeassistant.components.frontend import (
                async_register_built_in_panel,
                async_remove_panel,
            )

            if (
                callable(async_register_built_in_panel)
                and type(async_register_built_in_panel).__name__ != "MagicMock"
            ):
                async_remove_panel(hass, DOMAIN, warn_if_unknown=False)
                async_register_built_in_panel(
                    hass=hass,
                    component_name="custom",
                    sidebar_title="Presence Designer",
                    sidebar_icon="mdi:floor-plan",
                    frontend_url_path=DOMAIN,
                    require_admin=False,
                    config={
                        "_panel_custom": {
                            "name": "presence-detection-designer-panel",
                            "js_url": f"/presence_detection_designer/static/panel.js?v={version}",
                        },
                        "version": version,
                    },
                )
                domain_data[PANEL_REGISTERED] = version
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Skipping sidebar panel registration: %s", err)


def _register_service(
    hass: Any,
    service: str,
    handler: Any,
    supports_optional_response: bool = False,
) -> None:
    """Register a HA service, supporting SupportsResponse.OPTIONAL when available."""
    if supports_optional_response:
        try:
            from homeassistant.core import SupportsResponse

            hass.services.async_register(
                DOMAIN,
                service,
                handler,
                supports_response=SupportsResponse.OPTIONAL,
            )
            return
        except (ImportError, TypeError):
            pass
    hass.services.async_register(DOMAIN, service, handler)


def _collect_available_entities_for_room(
    hass: Any, room_name: str | None = None
) -> list[dict[str, str]]:
    """Collect candidate entities from HA state machine matching a room name."""
    if not hass or not hasattr(hass, "states") or not hasattr(hass.states, "async_all"):
        return []
    room_tokens = (
        [t for t in room_name.lower().replace("'", "").split() if len(t) > 2] if room_name else []
    )
    results: list[dict[str, str]] = []
    try:
        for state_obj in hass.states.async_all():
            eid = getattr(state_obj, "entity_id", "")
            if not eid.startswith(
                (
                    "binary_sensor.",
                    "sensor.",
                    "media_player.",
                    "camera.",
                    "light.",
                    "fan.",
                    "switch.",
                )
            ):
                continue
            attrs = getattr(state_obj, "attributes", {}) or {}
            fname = str(attrs.get("friendly_name", eid))
            haystack = f"{eid} {fname}".lower()
            if not room_tokens or all(tok in haystack for tok in room_tokens) or "ble_area" in eid:
                results.append(
                    {
                        "entity_id": eid,
                        "name": fname,
                        "state": str(getattr(state_obj, "state", "")),
                    }
                )
    except Exception:  # noqa: BLE001
        return []
    return results[:80]


def _get_default_llm_verifier(hass: Any) -> LLMVerifier:
    """Return an LLMVerifier configured from the first room entry that has LLM settings."""
    for coord in hass.data.get(DOMAIN, {}).values():
        if isinstance(coord, RoomPresenceCoordinator) and (
            coord.verifier.api_url or coord.verifier.agent_id
        ):
            return coord.verifier
    return LLMVerifier(hass=hass, provider_type=LLMProviderType.CONVERSATION)


async def async_setup(hass: Any, config: dict[str, Any]) -> bool:
    """Set up the Presence Detection Designer component."""
    hass.data.setdefault(DOMAIN, {})
    await async_get_store(hass)
    await _async_ensure_panel_and_views(hass)

    async def handle_verify_presence(call: Any) -> None:
        """Service call to verify presence across rooms or specific entry."""
        entry_id = call.data.get("entry_id")
        for eid, coordinator in hass.data[DOMAIN].items():
            if isinstance(coordinator, RoomPresenceCoordinator) and (
                not entry_id or eid == entry_id
            ):
                await coordinator.async_manual_verify()

    async def handle_force_refresh(call: Any) -> None:
        """Service call to refresh conditions and Bayesian observations."""
        entry_id = call.data.get("entry_id")
        for eid, coordinator in hass.data[DOMAIN].items():
            if isinstance(coordinator, RoomPresenceCoordinator) and (
                not entry_id or eid == entry_id
            ):
                coordinator.async_refresh_all_states()
                coordinator.async_update_listeners()

    async def handle_explain_presence(call: Any) -> dict[str, Any] | None:
        """Generate natural-language and YAML explanations for one or all rooms."""
        entry_id = call.data.get("entry_id")
        room_name_filter = call.data.get("room_name", "").strip().lower()
        use_llm = bool(call.data.get("use_llm", True))

        explanations: dict[str, Any] = {}
        for eid, coordinator in hass.data[DOMAIN].items():
            if not isinstance(coordinator, RoomPresenceCoordinator):
                continue
            if entry_id and eid != entry_id:
                continue
            if room_name_filter and coordinator.room_name.lower() != room_name_filter:
                continue
            explanations[coordinator.room_name] = await coordinator.async_explain_presence(
                use_llm=use_llm
            )

        payload = {"rooms": explanations}
        if hasattr(hass, "bus"):
            try:
                hass.bus.async_fire(EVENT_PRESENCE_EXPLANATION, payload)
            except Exception:  # noqa: BLE001
                pass
        if getattr(call, "return_response", True):
            return payload
        return None

    async def handle_translate_config(call: Any) -> dict[str, Any] | None:
        """Translate back and forth between natural-language descriptions and YAML/Designer configs."""
        entry_id = call.data.get("entry_id")
        room_name = call.data.get("room_name")
        direction = call.data.get("direction", "auto")
        description = call.data.get("description")
        yaml_config = call.data.get("yaml_config")
        use_llm = bool(call.data.get("use_llm", True))

        verifier = _get_default_llm_verifier(hass)
        if not yaml_config and (entry_id or (room_name and not description)):
            for eid, coord in hass.data[DOMAIN].items():
                if not isinstance(coord, RoomPresenceCoordinator):
                    continue
                if (entry_id and eid == entry_id) or (
                    room_name and coord.room_name.lower() == room_name.strip().lower()
                ):
                    yaml_config = coord.config
                    room_name = coord.room_name
                    verifier = coord.verifier
                    break

        if call.data.get(CONF_LLM_API_URL) or call.data.get(CONF_LLM_AGENT_ID):
            verifier = LLMVerifier(
                hass=hass,
                provider_type=call.data.get(CONF_LLM_PROVIDER_TYPE, verifier.provider_type),
                agent_id=call.data.get(CONF_LLM_AGENT_ID, verifier.agent_id),
                api_url=call.data.get(CONF_LLM_API_URL, verifier.api_url),
                api_key=call.data.get(CONF_LLM_API_KEY, verifier.api_key),
                model=call.data.get(CONF_LLM_MODEL, verifier.model),
            )

        candidates = _collect_available_entities_for_room(hass, room_name)
        result = await verifier.async_translate_config(
            direction=direction,
            room_name=room_name,
            description=description,
            yaml_config=yaml_config,
            available_entities=candidates,
            use_llm=use_llm,
        )
        if hasattr(hass, "bus"):
            try:
                hass.bus.async_fire(EVENT_PRESENCE_EXPLANATION, result)
            except Exception:  # noqa: BLE001
                pass
        if getattr(call, "return_response", True):
            return result
        return None

    async def handle_configure_room(call: Any) -> dict[str, Any] | None:
        """Apply a YAML or dict room configuration to an existing or matching room entry."""
        entry_id = call.data.get("entry_id")
        room_name = call.data.get("room_name")
        raw_cfg = call.data.get("config") or dict(call.data)
        normalized = parse_yaml_or_dict_to_config(raw_cfg)
        if room_name:
            normalized[CONF_ROOM_NAME] = room_name
        target_name = str(normalized.get(CONF_ROOM_NAME, "")).strip()

        target_entry = None
        if hasattr(hass, "config_entries") and hasattr(hass.config_entries, "async_entries"):
            for entry in hass.config_entries.async_entries(DOMAIN):
                if (entry_id and entry.entry_id == entry_id) or (
                    target_name and entry.title.strip().lower() == target_name.lower()
                ):
                    target_entry = entry
                    break

        if target_entry is not None:
            await async_apply_and_persist_room_config(
                hass=hass,
                entry_id=target_entry.entry_id,
                raw_config=normalized,
                note="Updated via configure_room service",
                record_revision=True,
            )
            out = {
                "status": "updated",
                "entry_id": target_entry.entry_id,
                "room_name": normalized.get(CONF_ROOM_NAME, target_entry.title),
            }
            return out if getattr(call, "return_response", True) else None

        out = {"status": "not_found", "room_name": target_name}
        return out if getattr(call, "return_response", True) else None

    if hasattr(hass, "services") and not hass.services.has_service(DOMAIN, "verify_presence"):
        _register_service(hass, "verify_presence", handle_verify_presence)
        _register_service(hass, "force_refresh", handle_force_refresh)
        _register_service(
            hass, "explain_presence", handle_explain_presence, supports_optional_response=True
        )
        _register_service(
            hass, "translate_config", handle_translate_config, supports_optional_response=True
        )
        _register_service(
            hass, "configure_room", handle_configure_room, supports_optional_response=True
        )

    return True


async def async_setup_entry(hass: Any, entry: Any) -> bool:
    """Set up Presence Detection Designer from a config entry."""
    hass.data.setdefault(DOMAIN, {})
    store = await async_get_store(hass)
    await _async_ensure_panel_and_views(hass)

    config_data = {**entry.data, **entry.options}
    stored_room = store.get_room(entry.entry_id)
    if stored_room:
        config_data = {**entry.data, **stored_room, **entry.options}

    await store.async_save_room(
        entry.entry_id,
        config_data,
        note="Initial entry setup",
        record_revision=False,
    )

    coordinator = RoomPresenceCoordinator(hass, entry.entry_id, config_data)
    await coordinator.async_setup()

    hass.data[DOMAIN][entry.entry_id] = coordinator

    if hasattr(hass.config_entries, "async_forward_entry_setups"):
        await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    else:
        for platform in PLATFORMS:
            await hass.config_entries.async_forward_entry_setup(entry, platform)

    # Assign created device to configured area_id if specified
    if coordinator.area_id:
        try:
            from homeassistant.helpers import device_registry as dr

            dev_reg = dr.async_get(hass)
            device = None
            if hasattr(dev_reg, "async_get_device_by_identifier"):
                device = dev_reg.async_get_device_by_identifier(
                    (DOMAIN, entry.entry_id), entry.entry_id
                )
            elif hasattr(dev_reg, "async_get_device"):
                device = dev_reg.async_get_device(identifiers={(DOMAIN, entry.entry_id)})
            if device and getattr(device, "area_id", None) != coordinator.area_id:
                dev_reg.async_update_device(device.id, area_id=coordinator.area_id)
        except Exception:  # noqa: BLE001
            pass

    entry.async_on_unload(entry.add_update_listener(async_update_options))
    return True


async def async_update_options(hass: Any, entry: Any) -> None:
    """Handle options update."""
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(hass: Any, entry: Any) -> bool:
    """Unload a config entry."""
    coordinator: RoomPresenceCoordinator | None = hass.data[DOMAIN].pop(entry.entry_id, None)
    if coordinator:
        coordinator.async_unload()

    if hasattr(hass.config_entries, "async_unload_platforms"):
        unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    else:
        unload_ok = True

    remaining_coords = [
        v for v in hass.data.get(DOMAIN, {}).values() if isinstance(v, RoomPresenceCoordinator)
    ]
    if not remaining_coords and hass.data.get(DOMAIN, {}).get(PANEL_REGISTERED):
        try:
            from homeassistant.components.frontend import async_remove_panel

            async_remove_panel(hass, DOMAIN, warn_if_unknown=False)
            hass.data[DOMAIN][PANEL_REGISTERED] = False
        except Exception:  # noqa: BLE001
            pass

    return unload_ok


async def async_remove_entry(hass: Any, entry: Any) -> None:
    """Handle removal of a room config entry from .storage."""
    store = await async_get_store(hass)
    await store.async_remove_room(entry.entry_id)
