"""Button platform for Presence Detection Designer."""

from __future__ import annotations

from typing import Any

try:
    from homeassistant.components.button import ButtonEntity

    if type(ButtonEntity).__name__ == "MagicMock":
        raise ImportError
except Exception:  # noqa: BLE001

    class ButtonEntity:  # type: ignore[no-redef]
        """Fallback ButtonEntity."""


from .const import DOMAIN
from .coordinator import RoomPresenceCoordinator
from .entity import PresenceDesignerEntityMixin


class VerifyPresenceButton(PresenceDesignerEntityMixin, ButtonEntity):
    """Button to manually trigger snapshot LLM verification."""

    def __init__(self, coordinator: RoomPresenceCoordinator, entry_id: str) -> None:
        self._init_designer_entity(coordinator, entry_id, "verify", "Verify Presence")
        self._attr_icon = "mdi:eye-check"

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
