"""Shared base entity for Presence Detection Designer platforms."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

try:
    from homeassistant.core import callback

    if type(callback).__name__ == "MagicMock":
        raise ImportError
except Exception:  # noqa: BLE001

    def callback(func: Any) -> Any:  # type: ignore[misc]
        """Fallback callback decorator when running outside Home Assistant."""
        return func


try:
    from homeassistant.helpers.device_registry import DeviceInfo

    if type(DeviceInfo).__name__ == "MagicMock":
        raise ImportError
except Exception:  # noqa: BLE001

    class DeviceInfo:  # type: ignore[no-redef]
        """Fallback DeviceInfo when running outside Home Assistant."""

        def __init__(self, **kwargs: Any) -> None:
            self.kwargs = kwargs


from .const import DOMAIN

if TYPE_CHECKING:
    from .coordinator import RoomPresenceCoordinator


class PresenceDesignerEntityMixin:
    """DRY mixin providing shared DeviceInfo and listener registration."""

    coordinator: RoomPresenceCoordinator
    entry_id: str
    _attr_name: str
    _attr_unique_id: str
    _attr_device_info: DeviceInfo

    def _init_designer_entity(
        self,
        coordinator: RoomPresenceCoordinator,
        entry_id: str,
        suffix: str,
        name_suffix: str,
    ) -> None:
        """Initialize common entity attributes and device info."""
        self.coordinator = coordinator
        self.entry_id = entry_id
        self._attr_name = f"{coordinator.room_name} {name_suffix}"
        self._attr_unique_id = f"{entry_id}_{suffix}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry_id)},
            name=coordinator.room_name,
            manufacturer="Steven T. Pelech",
            model="Presence Detection Designer",
        )

    @property
    def name(self) -> str:
        """Return the name of the entity."""
        return self._attr_name

    @property
    def unique_id(self) -> str:
        """Return the unique ID of the entity."""
        return self._attr_unique_id

    @property
    def device_info(self) -> DeviceInfo:
        """Return device registry info."""
        return self._attr_device_info

    async def async_added_to_hass(self) -> None:
        """Register coordinator listener when entity is added to HA."""
        on_remove = getattr(self, "async_on_remove", None)
        unsub = self.coordinator.async_add_listener(self.async_write_ha_state)
        if callable(on_remove):
            on_remove(unsub)

    @callback
    def async_write_ha_state(self) -> None:
        """Safely write state to Home Assistant when running in HA or unit tests."""
        super_method = getattr(super(), "async_write_ha_state", None)
        if callable(super_method):
            super_method()
