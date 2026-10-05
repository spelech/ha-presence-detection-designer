"""Presence Detection Designer custom component."""

from __future__ import annotations

import logging
from typing import Any

from .const import DOMAIN
from .coordinator import RoomPresenceCoordinator

_LOGGER = logging.getLogger(__name__)

PLATFORMS = ["binary_sensor", "button", "switch"]


async def async_setup(hass: Any, config: dict[str, Any]) -> bool:
    """Set up the Presence Detection Designer component."""
    hass.data.setdefault(DOMAIN, {})

    async def handle_verify_presence(call: Any) -> None:
        """Service call to verify presence across rooms or specific entry."""
        entry_id = call.data.get("entry_id")
        for eid, coordinator in hass.data[DOMAIN].items():
            if not entry_id or eid == entry_id:
                await coordinator.async_manual_verify()

    async def handle_force_refresh(call: Any) -> None:
        """Service call to refresh conditions."""
        entry_id = call.data.get("entry_id")
        for eid, coordinator in hass.data[DOMAIN].items():
            if not entry_id or eid == entry_id:
                coordinator._eval_conditions_and_update()
                coordinator.async_update_listeners()

    if hasattr(hass, "services") and not hass.services.has_service(DOMAIN, "verify_presence"):
        hass.services.async_register(DOMAIN, "verify_presence", handle_verify_presence)
        hass.services.async_register(DOMAIN, "force_refresh", handle_force_refresh)

    return True


async def async_setup_entry(hass: Any, entry: Any) -> bool:
    """Set up Presence Detection Designer from a config entry."""
    hass.data.setdefault(DOMAIN, {})

    config_data = {**entry.data, **entry.options}
    coordinator = RoomPresenceCoordinator(hass, entry.entry_id, config_data)
    await coordinator.async_setup()

    hass.data[DOMAIN][entry.entry_id] = coordinator

    if hasattr(hass.config_entries, "async_forward_entry_setups"):
        await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    else:
        for platform in PLATFORMS:
            await hass.config_entries.async_forward_entry_setup(entry, platform)

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

    return unload_ok
