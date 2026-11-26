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

    raw_frame = getattr(coordinator, "_last_spatial_frame", None)
    ekf_tracks = raw_frame.get("ekf_tracks") if isinstance(raw_frame, dict) else None
    ekf_room_prob: float | None = None
    ekf_summary: dict[str, Any] | None = None
    if isinstance(ekf_tracks, dict) and ekf_tracks:
        r_name = getattr(coordinator, "room_name", "")
        best_p = -1.0
        for _tid, tr in ekf_tracks.items():
            if not isinstance(tr, dict):
                continue
            p = float((tr.get("room_probabilities") or {}).get(r_name, 0.0))
            if p > best_p:
                best_p = p
                ekf_room_prob = round(p * 100.0, 1)
                ekf_summary = {
                    "floor": tr.get("floor"),
                    "top_room": tr.get("top_room"),
                    "top_room_prob_pct": round(float(tr.get("top_room_prob", 0.0)) * 100.0, 1),
                    "sigma_x_ft": tr.get("sigma_x_ft"),
                    "sigma_y_ft": tr.get("sigma_y_ft"),
                    "speed_ft_s": tr.get("speed_ft_s"),
                    "heading_deg": tr.get("heading_deg"),
                    "active_proxy_count": tr.get("active_proxy_count"),
                }

    hmm_snap = getattr(coordinator, "last_hmm_snapshot", None)
    hmm_attrs: dict[str, Any] = {}
    if hmm_snap is not None:
        hmm_attrs = {
            "inference_engine": "coupled_hmm",
            "hmm_log_odds": hmm_snap.log_odds,
            "confidence_tier": hmm_snap.confidence_tier,
            "theta_enter_pct": round(hmm_snap.theta_enter * 100.0, 1),
            "theta_clear_pct": round(hmm_snap.theta_clear * 100.0, 1),
            "spillover_exposure_pct": round(hmm_snap.spillover_exposure * 100.0, 1),
            "recommended_lighting_threshold_pct": round(
                hmm_snap.recommended_lighting_threshold * 100.0, 1
            ),
            "meets_lighting_threshold": bool(
                hmm_snap.probability >= hmm_snap.recommended_lighting_threshold
            ),
            "llm_ambiguity_active": hmm_snap.llm_ambiguity_active,
            "ambiguity_dwell_sec": hmm_snap.ambiguity_dwell_sec,
            "hmm_active_drivers": list(hmm_snap.active_drivers),
        }

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
        "spatial_method": est.get("method", "coupled_hmm" if hmm_snap is not None else "none"),
        "ekf_room_probability_pct": ekf_room_prob,
        "ekf_track": ekf_summary,
        "guest_mode_enabled": guest_mode_enabled,
        "manual_intent": manual_intent,
        "manual_off_suppressed": bool(
            tracker_attrs.get("manual_off_suppressed", manual_intent == "manual_off_suppressed")
        ),
        "last_manual_actor": tracker_attrs.get("last_manual_actor"),
        "last_manual_entity": tracker_attrs.get("last_manual_entity"),
        "last_manual_action": tracker_attrs.get("last_manual_action"),
        "last_manual_ts": tracker_attrs.get("last_manual_ts"),
        **hmm_attrs,
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
