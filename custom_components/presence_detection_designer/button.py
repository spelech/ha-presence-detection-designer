"""Button platform for Presence Detection Designer."""

from __future__ import annotations

from typing import Any

from .const import DOMAIN
from .coordinator import RoomPresenceCoordinator


class VerifyPresenceButton:
    """Button to manually trigger snapshot LLM verification."""

    def __init__(self, coordinator: RoomPresenceCoordinator, entry_id: str) -> None:
        self.coordinator = coordinator
        self.entry_id = entry_id
        self._attr_name = f"{coordinator.room_name} Verify Presence"
        self._attr_unique_id = f"{entry_id}_verify"
        self._attr_icon = "mdi:eye-check"

    @property
    def name(self) -> str:
        """Return the name of the button."""
        return self._attr_name

    @property
    def unique_id(self) -> str:
        """Return unique ID."""
        return self._attr_unique_id

    @property
    def icon(self) -> str:
        """Return icon."""
        return self._attr_icon

    async def async_press(self) -> None:
        """Press the button to verify presence."""
        await self.coordinator.async_manual_verify()


async def async_setup_entry(hass: Any, entry: Any, async_add_entities: Any) -> None:
    """Set up the button platform."""
    coordinator: RoomPresenceCoordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([VerifyPresenceButton(coordinator, entry.entry_id)])
