"""Sensor platform for Presence Detection Designer (Bayesian Occupancy Probability)."""

from __future__ import annotations

from typing import Any

try:
    from homeassistant.components.sensor import (
        SensorEntity,
        SensorStateClass,
    )

    if type(SensorEntity).__name__ == "MagicMock":
        raise ImportError
except Exception:  # noqa: BLE001

    class SensorEntity:  # type: ignore[no-redef]
        """Fallback SensorEntity."""

        def async_on_remove(self, func: Any) -> None:
            pass

    class SensorStateClass:  # type: ignore[no-redef]
        """Fallback SensorStateClass."""

        MEASUREMENT = "measurement"


from .const import DOMAIN
from .coordinator import RoomPresenceCoordinator
from .entity import PresenceDesignerEntityMixin


class OccupancyProbabilitySensor(PresenceDesignerEntityMixin, SensorEntity):
    """Sensor exposing the 0-100% Bayesian occupancy probability and natural-language breakdown."""

    def __init__(self, coordinator: RoomPresenceCoordinator, entry_id: str) -> None:
        self._init_designer_entity(
            coordinator, entry_id, "occupancy_probability", "Occupancy Probability"
        )
        self._attr_icon = "mdi:chart-bell-curve-cumulative"
        self._attr_native_unit_of_measurement = "%"
        self._attr_state_class = SensorStateClass.MEASUREMENT

    @property
    def icon(self) -> str:
        """Return icon."""
        return self._attr_icon

    @property
    def native_unit_of_measurement(self) -> str:
        """Return unit of measurement."""
        return self._attr_native_unit_of_measurement

    @property
    def state_class(self) -> str:
        """Return sensor state class."""
        return self._attr_state_class

    @property
    def native_value(self) -> float:
        """Return current Bayesian occupancy probability (0.0 to 100.0%)."""
        return self.coordinator.state_machine.bayesian_probability_pct

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return detailed Bayesian breakdown, natural-language guide, and YAML equivalents."""
        sm = self.coordinator.state_machine
        return {
            "probability": sm.bayesian_probability,
            "prior_pct": round(sm.bayesian_prior * 100.0, 1),
            "threshold_pct": round(sm.bayesian_threshold * 100.0, 1),
            "bayesian_occupied": sm.bayesian_occupied,
            "is_present": sm.is_present,
            "box_state": sm.box_state,
            "natural_language_summary": sm.bayesian_summary,
            "natural_language_explanation": sm.build_natural_language_explanation(),
            "active_observations": sm.active_observations,
            "inactive_observations": [
                f"{obs.get('label')} ({obs.get('preset')})" for obs in sm.inactive_observations
            ],
            "rule_guide": self.coordinator.rule_guide,
            "ha_bayesian_yaml": self.coordinator.yaml_representations.get("ha_bayesian_yaml"),
            "designer_yaml": self.coordinator.yaml_representations.get("designer_yaml"),
        }


async def async_setup_entry(hass: Any, entry: Any, async_add_entities: Any) -> None:
    """Set up the sensor platform."""
    coordinator: RoomPresenceCoordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([OccupancyProbabilitySensor(coordinator, entry.entry_id)])
