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


def _extract_spatial_and_causal_attrs(coordinator: Any, is_present: bool) -> dict[str, Any]:
    """Extract people, animal, and causal actuation attributes safely."""
    raw_est = getattr(coordinator, "last_spatial_estimate", None)
    est: dict[str, Any] = raw_est if isinstance(raw_est, dict) else {}

    guest_fn = getattr(coordinator, "_is_guest_mode_active", None)
    guest_val = guest_fn() if callable(guest_fn) else False
    guest_mode_enabled = guest_val if isinstance(guest_val, bool) else False

    tracker = getattr(coordinator, "actuation_tracker", None)
    tracker_attrs_raw = (
        tracker.as_attributes()
        if tracker is not None and callable(getattr(tracker, "as_attributes", None))
        else None
    )
    tracker_attrs: dict[str, Any] = tracker_attrs_raw if isinstance(tracker_attrs_raw, dict) else {}
    manual_intent = str(tracker_attrs.get("manual_intent", "auto"))

    return {
        "occupant_type": est.get("occupant_type", "human" if is_present else "none"),
        "occupant_label": est.get("occupant_label", "Occupant" if is_present else ""),
        "presence_summary": est.get("presence_summary", "Occupant" if is_present else "Vacant"),
        "human_present": bool(est.get("human_present", is_present)),
        "pet_present": bool(est.get("pet_present", False)),
        "detected_people": list(est.get("detected_people", ["Occupant"] if is_present else [])),
        "detected_animals": list(est.get("detected_animals", [])),
        "definitive_tracker_pinned": bool(est.get("definitive_tracker_pinned", False)),
        "inferred_subregion": est.get("inferred_subregion"),
        "spatial_method": est.get("method", "none"),
        "guest_mode_enabled": guest_mode_enabled,
        "manual_intent": manual_intent,
        "manual_off_suppressed": bool(
            tracker_attrs.get("manual_off_suppressed", manual_intent == "manual_off_suppressed")
        ),
        "last_manual_actor": tracker_attrs.get("last_manual_actor"),
        "last_manual_entity": tracker_attrs.get("last_manual_entity"),
        "last_manual_action": tracker_attrs.get("last_manual_action"),
        "last_manual_ts": tracker_attrs.get("last_manual_ts"),
    }


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
        """Return state attributes including Bayesian probability, occupant identity, and causal actuation."""
        sm = self.coordinator.state_machine
        is_present = bool(sm.is_present)
        attrs: dict[str, Any] = {
            "mode": str(self.coordinator.mode),
            "occupancy_state": str(sm.state),
            "is_cooling_down": sm.is_cooling_down,
            "cooling_remaining_sec": sm.cooling_remaining_sec,
            "state_reason": sm.state_reason,
            "verified_by": sm.verified_by,
            "pir_validation_state": str(pv.state)
            if (pv := getattr(self.coordinator, "pir_validator", None)) is not None
            else "disabled",
            "pir_corroboration_source": pv.last_corroboration_source if pv is not None else None,
            "pir_candidate_remaining_sec": pv.candidate_remaining_sec if pv is not None else 0,
            "transition_history": sm.transition_history[-10:],
            "active_conditions": sm.active_conditions,
            "last_trigger_entity": sm.last_trigger_entity,
            "last_llm_check": sm.last_llm_result,
            "override": sm.override,
            "bayesian_probability": sm.bayesian_probability,
            "bayesian_probability_pct": sm.bayesian_probability_pct,
            "bayesian_threshold_pct": round(sm.bayesian_threshold * 100.0, 1),
            "bayesian_occupied": sm.bayesian_occupied,
            "active_evidence": [obs.get("explanation") for obs in sm.active_observations],
            "natural_language_explanation": sm.build_natural_language_explanation(),
        }
        attrs.update(_extract_spatial_and_causal_attrs(self.coordinator, is_present))
        return attrs


async def async_setup_entry(hass: Any, entry: Any, async_add_entities: Any) -> None:
    """Set up the binary sensor platform."""
    coordinator: RoomPresenceCoordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([PresenceBinarySensor(coordinator, entry.entry_id)])
