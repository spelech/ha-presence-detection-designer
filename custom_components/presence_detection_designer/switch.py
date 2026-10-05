"""Switch platform for Presence Detection Designer."""

from __future__ import annotations

from typing import Any

from .const import DOMAIN
from .coordinator import RoomPresenceCoordinator


class PresenceOverrideSwitch:
    """Switch to manually lock room presence on."""

    def __init__(self, coordinator: RoomPresenceCoordinator, entry_id: str) -> None:
        self.coordinator = coordinator
        self.entry_id = entry_id
        self._attr_name = f"{coordinator.room_name} Presence Override"
        self._attr_unique_id = f"{entry_id}_override"
        self._attr_icon = "mdi:lock-alert"

    @property
    def name(self) -> str:
        """Return the name of the switch."""
        return self._attr_name

    @property
    def unique_id(self) -> str:
        """Return unique ID."""
        return self._attr_unique_id

    @property
    def icon(self) -> str:
        """Return icon."""
        return self._attr_icon

    @property
    def is_on(self) -> bool:
        """Return true if override is active."""
        return self.coordinator.state_machine.override

    async def async_turn_on(self, **kwargs: Any) -> None:
        """Turn on override."""
        self.coordinator.state_machine.set_override(True)
        self.coordinator.async_update_listeners()

    async def async_turn_off(self, **kwargs: Any) -> None:
        """Turn off override."""
        self.coordinator.state_machine.set_override(False)
        self.coordinator.async_update_listeners()


async def async_setup_entry(hass: Any, entry: Any, async_add_entities: Any) -> None:
    """Set up the switch platform."""
    coordinator: RoomPresenceCoordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([PresenceOverrideSwitch(coordinator, entry.entry_id)])
