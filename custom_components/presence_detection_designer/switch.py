"""Switch platform for Presence Detection Designer."""

from __future__ import annotations

from typing import Any

try:
    from homeassistant.components.switch import SwitchEntity

    if type(SwitchEntity).__name__ == "MagicMock":
        raise ImportError
except Exception:  # noqa: BLE001

    class SwitchEntity:  # type: ignore[no-redef]
        """Fallback SwitchEntity."""


from .const import DOMAIN
from .coordinator import RoomPresenceCoordinator
from .entity import PresenceDesignerEntityMixin


class PresenceOverrideSwitch(PresenceDesignerEntityMixin, SwitchEntity):
    """Switch to manually lock room presence on."""

    def __init__(self, coordinator: RoomPresenceCoordinator, entry_id: str) -> None:
        self._init_designer_entity(coordinator, entry_id, "override", "Presence Override")
        self._attr_icon = "mdi:lock-alert"

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
