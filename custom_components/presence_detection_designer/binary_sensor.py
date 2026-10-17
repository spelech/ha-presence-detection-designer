"""Binary sensor platform for Presence Detection Designer."""

from __future__ import annotations

from typing import Any

try:
    from homeassistant.components.binary_sensor import (
        BinarySensorDeviceClass,
        BinarySensorEntity,
    )

    if type(BinarySensorEntity).__name__ == "MagicMock":
        raise ImportError
except Exception:  # noqa: BLE001

    class BinarySensorEntity:  # type: ignore[no-redef]
        """Fallback BinarySensorEntity."""

        def async_on_remove(self, func: Any) -> None:
            pass

    class BinarySensorDeviceClass:  # type: ignore[no-redef]
        """Fallback BinarySensorDeviceClass."""

        OCCUPANCY = "occupancy"


from .const import DOMAIN
from .coordinator import RoomPresenceCoordinator
from .entity import PresenceDesignerEntityMixin


class PresenceBinarySensor(PresenceDesignerEntityMixin, BinarySensorEntity):
    """Binary sensor representing room presence."""

    def __init__(self, coordinator: RoomPresenceCoordinator, entry_id: str) -> None:
        self._init_designer_entity(coordinator, entry_id, "presence", "Presence")
        self._attr_device_class = BinarySensorDeviceClass.OCCUPANCY

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
        """Return state attributes including Bayesian probability and plain-English explanation."""
        sm = self.coordinator.state_machine
        return {
            "mode": sm.mode,
            "box_state": sm.box_state,
            "perimeter_sealed": sm.is_perimeter_sealed,
            "active_conditions": sm.active_conditions,
            "last_trigger_entity": sm.last_trigger_entity,
            "vacating_countdown": sm.vacating_countdown,
            "last_llm_check": sm.last_llm_result,
            "override": sm.override,
            "bayesian_probability": sm.bayesian_probability,
            "bayesian_probability_pct": sm.bayesian_probability_pct,
            "bayesian_threshold_pct": round(sm.bayesian_threshold * 100.0, 1),
            "bayesian_occupied": sm.bayesian_occupied,
            "active_evidence": [obs.get("explanation") for obs in sm.active_observations],
            "natural_language_explanation": sm.build_natural_language_explanation(),
        }


async def async_setup_entry(hass: Any, entry: Any, async_add_entities: Any) -> None:
    """Set up the binary sensor platform."""
    coordinator: RoomPresenceCoordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([PresenceBinarySensor(coordinator, entry.entry_id)])
