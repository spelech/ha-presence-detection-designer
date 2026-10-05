"""Button platform for Presence Detection Designer."""

from __future__ import annotations

from typing import Any

try:
    from homeassistant.components.button import ButtonEntity
    from homeassistant.helpers.device_registry import DeviceInfo

    if type(ButtonEntity).__name__ == "MagicMock":
        raise ImportError
except Exception:  # noqa: BLE001

    class ButtonEntity:
        """Fallback ButtonEntity."""

    class DeviceInfo:
        """Fallback DeviceInfo."""

        def __init__(self, **kwargs: Any) -> None:
            pass


from .const import DOMAIN
from .coordinator import RoomPresenceCoordinator


class VerifyPresenceButton(ButtonEntity):
    """Button to manually trigger snapshot LLM verification."""

    def __init__(self, coordinator: RoomPresenceCoordinator, entry_id: str) -> None:
        self.coordinator = coordinator
        self.entry_id = entry_id
        self._attr_name = f"{coordinator.room_name} Verify Presence"
        self._attr_unique_id = f"{entry_id}_verify"
        self._attr_icon = "mdi:eye-check"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry_id)},
            name=coordinator.room_name,
            manufacturer="Steven T. Pelech",
            model="Presence Detection Designer",
        )

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
