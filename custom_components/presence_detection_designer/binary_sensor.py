"""Binary sensor platform for Presence Detection Designer."""

from __future__ import annotations

from typing import Any

try:
    from homeassistant.components.binary_sensor import (
        BinarySensorDeviceClass,
        BinarySensorEntity,
    )
    from homeassistant.helpers.device_registry import DeviceInfo

    if type(BinarySensorEntity).__name__ == "MagicMock":
        raise ImportError
except Exception:  # noqa: BLE001

    class BinarySensorEntity:
        """Fallback BinarySensorEntity."""

        def async_on_remove(self, func: Any) -> None:
            pass

    class BinarySensorDeviceClass:
        """Fallback BinarySensorDeviceClass."""

        OCCUPANCY = "occupancy"

    class DeviceInfo:
        """Fallback DeviceInfo."""

        def __init__(self, **kwargs: Any) -> None:
            pass


from .const import DOMAIN
from .coordinator import RoomPresenceCoordinator


class PresenceBinarySensor(BinarySensorEntity):
    """Binary sensor representing room presence."""

    def __init__(self, coordinator: RoomPresenceCoordinator, entry_id: str) -> None:
        self.coordinator = coordinator
        self.entry_id = entry_id
        self._attr_name = f"{coordinator.room_name} Presence"
        self._attr_unique_id = f"{entry_id}_presence"
        self._attr_device_class = BinarySensorDeviceClass.OCCUPANCY
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry_id)},
            name=coordinator.room_name,
            manufacturer="Steven T. Pelech",
            model="Presence Detection Designer",
        )

    @property
    def name(self) -> str:
        """Return the name of the sensor."""
        return self._attr_name

    @property
    def unique_id(self) -> str:
        """Return unique ID."""
        return self._attr_unique_id

    @property
    def device_class(self) -> str:
        """Return device class."""
        return self._attr_device_class

    @property
    def is_on(self) -> bool:
        """Return true if room is occupied."""
        return self.coordinator.state_machine.is_present

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return state attributes."""
        sm = self.coordinator.state_machine
        return {
            "mode": sm.mode,
            "box_state": sm.box_state,
            "active_conditions": sm.active_conditions,
            "last_trigger_entity": sm.last_trigger_entity,
            "vacating_countdown": sm.vacating_countdown,
            "last_llm_check": sm.last_llm_result,
            "override": sm.override,
        }

    async def async_added_to_hass(self) -> None:
        """Register update callback."""
        self.async_on_remove(self.coordinator.async_add_listener(self.async_write_ha_state))

    def async_write_ha_state(self) -> None:
        """Write HA state."""
        super_method = getattr(super(), "async_write_ha_state", None)
        if callable(super_method):
            super_method()


async def async_setup_entry(hass: Any, entry: Any, async_add_entities: Any) -> None:
    """Set up the binary sensor platform."""
    coordinator: RoomPresenceCoordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([PresenceBinarySensor(coordinator, entry.entry_id)])
