"""Sensor platform for Presence Detection Designer (Bayesian Occupancy Probability & Occupant Identity)."""

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


from .binary_sensor import _extract_spatial_and_causal_attrs
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
        spatial_causal = _extract_spatial_and_causal_attrs(self.coordinator, sm.is_present)
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
            **spatial_causal,
        }


class RoomOccupantSensor(PresenceDesignerEntityMixin, SensorEntity):
    """Sensor exposing the identified room occupant summary (people, pets, and causal intent)."""

    def __init__(self, coordinator: RoomPresenceCoordinator, entry_id: str) -> None:
        self._init_designer_entity(coordinator, entry_id, "occupant", "Occupant")
        self._attr_icon = "mdi:account-multiple-check"

    @property
    def icon(self) -> str:
        """Return icon."""
        return self._attr_icon

    @property
    def native_value(self) -> str:
        """Return current occupant summary string (e.g. 'Steve', 'Dog', 'Steve + Dog', 'Occupant', 'Vacant')."""
        is_present = bool(self.coordinator.state_machine.is_present)
        attrs = _extract_spatial_and_causal_attrs(self.coordinator, is_present)
        return str(attrs.get("presence_summary") or ("Occupant" if is_present else "Vacant"))

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return occupant classification, detected people/animals, and causal manual state."""
        is_present = bool(self.coordinator.state_machine.is_present)
        attrs = _extract_spatial_and_causal_attrs(self.coordinator, is_present)
        return {
            "occupant_type": attrs["occupant_type"],
            "occupant_label": attrs["occupant_label"],
            "human_present": attrs["human_present"],
            "pet_present": attrs["pet_present"],
            "detected_people": attrs["detected_people"],
            "detected_animals": attrs["detected_animals"],
            "definitive_tracker_pinned": attrs["definitive_tracker_pinned"],
            "inferred_subregion": attrs["inferred_subregion"],
            "spatial_method": attrs["spatial_method"],
            "manual_intent": attrs["manual_intent"],
            "manual_off_suppressed": attrs["manual_off_suppressed"],
            "last_manual_actor": attrs["last_manual_actor"],
            "last_manual_entity": attrs["last_manual_entity"],
        }


class HouseHeadcountSensor(SensorEntity):
    """Sensor exposing whole-house occupant count, mode, and perimeter events."""

    _attr_has_entity_name = True

    def __init__(self, tracker: Any) -> None:
        self.tracker = tracker
        self._attr_name = "House Occupant Count"
        self._attr_unique_id = f"{DOMAIN}_house_occupant_count"
        self._attr_icon = "mdi:account-group"
        self._attr_state_class = SensorStateClass.MEASUREMENT
        self._unsub: Any = None

    @property
    def name(self) -> str:
        """Return sensor name."""
        return self._attr_name

    @property
    def unique_id(self) -> str:
        """Return unique id."""
        return self._attr_unique_id

    @property
    def icon(self) -> str:
        """Return icon."""
        return self._attr_icon

    @property
    def native_value(self) -> int:
        """Return estimated headcount."""
        return self.tracker.state.count

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return whole-house occupancy mode and perimeter transition history."""
        st = self.tracker.state
        return {
            "occupancy_mode": st.mode,
            "last_perimeter_door": st.last_event_door,
            "last_vector_type": st.last_event_type,
            "last_event_ts": st.last_event_ts,
            "recent_door_events": [
                {
                    "door": r.entity_id,
                    "room": r.room_name,
                    "vector": r.vector,
                    "confidence": r.confidence,
                    "details": r.details,
                    "duration_open_sec": round(r.closed_ts - r.opened_ts, 1),
                }
                for r in reversed(st.history[-5:])
            ],
        }

    async def async_added_to_hass(self) -> None:
        """Register listener for headcount changes."""
        self._unsub = self.tracker.async_add_listener(self._handle_tracker_update)

    async def async_will_remove_from_hass(self) -> None:
        """Unsubscribe listener."""
        if self._unsub:
            self._unsub()
            self._unsub = None

    def _handle_tracker_update(self) -> None:
        """Update sensor state when headcount changes."""
        if hasattr(self, "async_write_ha_state"):
            self.async_write_ha_state()


async def async_setup_entry(hass: Any, entry: Any, async_add_entities: Any) -> None:
    """Set up the sensor platform."""
    from .house_perimeter import get_house_perimeter_tracker

    coordinator: RoomPresenceCoordinator = hass.data[DOMAIN][entry.entry_id]
    entities: list[SensorEntity] = [OccupancyProbabilitySensor(coordinator, entry.entry_id)]
    if coordinator.config.get("expose_occupant_sensor"):
        entities.append(RoomOccupantSensor(coordinator, entry.entry_id))

    tracker = get_house_perimeter_tracker(hass)
    if not hass.data[DOMAIN].get("_house_sensor_registered"):
        entities.append(HouseHeadcountSensor(tracker))
        hass.data[DOMAIN]["_house_sensor_registered"] = True

    async_add_entities(entities)
