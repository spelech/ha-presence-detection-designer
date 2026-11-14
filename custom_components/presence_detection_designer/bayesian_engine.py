"""Configurable and explainable Bayesian sensor fusion engine."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

from .bayesian_serializer import (
    config_to_yaml_representations,
    explain_config_in_natural_language,
    parse_yaml_or_dict_to_config,
)
from .condition_evaluator import evaluate_condition, format_condition_description
from .const import (
    BAYESIAN_PRESET_WEIGHTS,
    CONF_BAYESIAN_OBSERVATIONS,
    CONF_SUSTAINING_CONDITIONS,
    CONF_TRIGGER_ENTITIES,
    DEFAULT_BAYESIAN_PRIOR,
    DEFAULT_BAYESIAN_THRESHOLD,
    DOMAIN,
    BayesianWeightPreset,
    ConditionOperator,
    OccupancyState,
)
from .sensor_reliability import (
    apply_cooldown_weight,
    apply_signal_weight,
    classify_sensor_reliability,
)
from .spatial_catalog import _normalize_ble_area_to_room

__all__ = [
    "BayesianEvaluation",
    "_clamp_prob",
    "apply_contextual_bayesian_penalties",
    "build_effective_observations",
    "config_to_yaml_representations",
    "evaluate_bayesian",
    "explain_config_in_natural_language",
    "friendly_entity_label",
    "infer_preset_from_weights",
    "normalize_observation",
    "parse_yaml_or_dict_to_config",
    "prior_and_lrs_to_posterior",
    "resolve_observation_weights",
    "solo_posterior_pct",
]


@dataclass
class BayesianEvaluation:
    """Result of evaluating all Bayesian observations for a room."""

    probability: float
    probability_pct: float
    prior: float
    threshold: float
    is_occupied: bool
    active_observations: list[dict[str, Any]] = field(default_factory=list)
    inactive_observations: list[dict[str, Any]] = field(default_factory=list)
    natural_language_summary: str = ""


def _clamp_prob(value: float, low: float = 0.001, high: float = 0.999) -> float:
    """Clamp probability to open interval (0, 1) to avoid division by zero in odds."""
    try:
        val = float(value)
    except (ValueError, TypeError):
        val = DEFAULT_BAYESIAN_PRIOR
    return max(low, min(high, val))


def infer_preset_from_weights(prob_given_true: float, prob_given_false: float) -> str:
    """Infer the closest human-readable preset name from raw probabilities."""
    lr = _clamp_prob(prob_given_true) / _clamp_prob(prob_given_false)
    for preset, (pt, pf) in BAYESIAN_PRESET_WEIGHTS.items():
        if abs(prob_given_true - pt) < 0.03 and abs(prob_given_false - pf) < 0.03:
            return str(preset)
    if lr >= 30.0:
        return str(BayesianWeightPreset.DECISIVE)
    if lr >= 10.0:
        return str(BayesianWeightPreset.STRONG)
    if lr >= 4.0:
        return str(BayesianWeightPreset.MODERATE)
    return str(BayesianWeightPreset.SUPPORTING)


def resolve_observation_weights(obs: dict[str, Any]) -> tuple[str, float, float]:
    """Resolve (preset_name, prob_given_true, prob_given_false) for an observation."""
    preset_raw = str(obs.get("preset", "")).strip().lower()
    has_explicit = "prob_given_true" in obs and "prob_given_false" in obs

    if preset_raw in BAYESIAN_PRESET_WEIGHTS and not has_explicit:
        pt, pf = BAYESIAN_PRESET_WEIGHTS[preset_raw]
        preset_name = preset_raw
    elif has_explicit:
        pt = _clamp_prob(obs.get("prob_given_true", 0.85))
        pf = _clamp_prob(obs.get("prob_given_false", 0.05))
        preset_name = (
            preset_raw
            if preset_raw in BAYESIAN_PRESET_WEIGHTS
            else infer_preset_from_weights(pt, pf)
        )
    else:
        pt, pf = BAYESIAN_PRESET_WEIGHTS[BayesianWeightPreset.STRONG]
        preset_name = str(BayesianWeightPreset.STRONG)

    already_weighted = (
        obs.get("cooldown_weighted") is not None or obs.get("signal_weighted") is not None
    )
    raw_cd = obs.get("cooldown_sec")
    if not already_weighted and (
        raw_cd is not None or obs.get("auto_cooldown_weight") or obs.get("auto_signal_weight")
    ):
        eid = str(obs.get("entity_id", ""))
        prof = classify_sensor_reliability(
            eid,
            cooldown_sec=float(raw_cd) if raw_cd is not None else None,
            battery_powered=obs.get("battery_powered"),
        )
        if prof.reliability_weight < 0.999:
            if prof.is_pir:
                pt, pf = apply_cooldown_weight(
                    pt,
                    pf,
                    prof.cooldown_sec,
                    battery_powered=prof.battery_powered,
                )
            else:
                pt, pf = apply_signal_weight(pt, pf, prof.reliability_weight)
            preset_name = infer_preset_from_weights(pt, pf)

    return preset_name, pt, pf


def friendly_entity_label(obs: dict[str, Any], entity_state_obj: Any = None) -> str:
    """Return a clean human-readable label for an observation."""
    if obs.get("label"):
        return str(obs["label"])
    if entity_state_obj is not None:
        attrs = getattr(entity_state_obj, "attributes", {}) or {}
        if attrs.get("friendly_name"):
            return str(attrs["friendly_name"])
    entity_id = str(obs.get("entity_id", "sensor"))
    slug = entity_id.split(".", 1)[-1]
    return slug.replace("_", " ").title()


def normalize_observation(obs: dict[str, Any]) -> dict[str, Any]:
    """Return a normalized Bayesian observation dictionary with resolved weights and likelihood ratio."""
    raw_eid = obs.get("entity_id", "sensor.unknown")
    eid = str(raw_eid.get("entity_id") if isinstance(raw_eid, dict) else raw_eid)
    op = str(obs.get("operator", ConditionOperator.EQUALS))
    st = str(obs.get("state", "on"))
    preset_name, pt, pf = resolve_observation_weights(obs)
    lr = _clamp_prob(pt) / _clamp_prob(pf)
    return {
        "entity_id": eid,
        "label": friendly_entity_label({**obs, "entity_id": eid}),
        "preset": preset_name,
        "operator": op,
        "state": st,
        "attribute": obs.get("attribute"),
        "prob_given_true": round(pt, 3),
        "prob_given_false": round(pf, 3),
        "likelihood_ratio": round(lr, 2),
        "penalize_when_off": bool(obs.get("penalize_when_off", False)),
        "cooldown_sec": obs.get("cooldown_sec"),
    }


def prior_and_lrs_to_posterior(prior: float, likelihood_ratios: list[float]) -> float:
    """Compute Bayesian posterior probability (0..1) from prior and a list of likelihood ratios."""
    p0 = _clamp_prob(prior)
    odds = p0 / (1.0 - p0)
    for lr in likelihood_ratios:
        odds *= max(0.001, float(lr))
    return odds / (1.0 + odds)


def build_effective_observations(config: dict[str, Any]) -> list[dict[str, Any]]:
    """Build the Bayesian observation list without silently injecting clutter when explicit obs exist."""
    explicit_obs = list(config.get(CONF_BAYESIAN_OBSERVATIONS, []) or [])
    seen_keys: set[tuple[str, str, str, str | None]] = set()
    normalized: list[dict[str, Any]] = []

    for obs in explicit_obs:
        if isinstance(obs, str):
            obs = {"entity_id": obs}
        elif not isinstance(obs, dict):
            continue
        raw_eid = obs.get("entity_id")
        if not raw_eid:
            continue
        eid = str(raw_eid.get("entity_id") if isinstance(raw_eid, dict) else raw_eid)
        op = str(obs.get("operator", ConditionOperator.EQUALS))
        st = str(obs.get("state", "on"))
        attr = obs.get("attribute")
        key = (eid, op, st, str(attr) if attr is not None else None)
        if key in seen_keys:
            continue
        seen_keys.add(key)
        entry = dict(obs)
        entry["entity_id"] = eid
        entry["operator"] = op
        entry["state"] = st
        normalized.append(entry)

    # BAYES-02: Respect explicit bayesian_observations without re-injecting excluded triggers/conditions.
    if normalized:
        return normalized

    subzone_keywords = (
        "couch",
        "desk",
        "sim_rig",
        "bed",
        "recliner",
        "table",
        "island",
        "playpen",
        "workout",
        "bay_windows",
    )
    for raw_trig in config.get(CONF_TRIGGER_ENTITIES, []) or []:
        trig_eid = str(raw_trig.get("entity_id") if isinstance(raw_trig, dict) else raw_trig)
        if not trig_eid or not classify_sensor_reliability(trig_eid).is_human_exclusive:
            continue
        key = (trig_eid, str(ConditionOperator.EQUALS), "on", None)
        if key in seen_keys:
            continue
        seen_keys.add(key)
        is_subzone = any(k in trig_eid.lower() for k in subzone_keywords)
        default_preset = (
            BayesianWeightPreset.DECISIVE if is_subzone else BayesianWeightPreset.STRONG
        )
        normalized.append(
            {
                "entity_id": trig_eid,
                "operator": str(ConditionOperator.EQUALS),
                "state": "on",
                "preset": str(default_preset),
            }
        )

    for cond in config.get(CONF_SUSTAINING_CONDITIONS, []) or []:
        if isinstance(cond, str):
            cond = {"entity_id": cond}
        elif not isinstance(cond, dict):
            continue
        raw_eid = cond.get("entity_id")
        if not raw_eid:
            continue
        eid = str(raw_eid.get("entity_id") if isinstance(raw_eid, dict) else raw_eid)
        op = str(cond.get("operator", ConditionOperator.EQUALS))
        st = str(cond.get("state", "on"))
        attr = cond.get("attribute")
        key = (eid, op, st, str(attr) if attr is not None else None)
        if key in seen_keys:
            continue
        seen_keys.add(key)
        normalized.append(
            {
                "entity_id": eid,
                "operator": op,
                "state": st,
                "attribute": attr,
                "label": cond.get("label"),
                "preset": str(cond.get("preset", BayesianWeightPreset.SUPPORTING)),
                "auto_signal_weight": True,
            }
        )

    return normalized


def apply_contextual_bayesian_penalties(
    observations: list[dict[str, Any]],
    *,
    room_name: str,
    spatial_frame: dict[str, Any] | None = None,
    hass: Any = None,
    guest_mode_enabled: bool = False,
) -> list[dict[str, Any]]:
    """Enforce BAYES-04: camera/PIR off stays neutral; BLE off penalizes only when confirmed elsewhere."""
    if not observations:
        return []
    frame = spatial_frame if isinstance(spatial_frame, dict) else {}
    room_estimates = frame.get("room_estimates") or {}
    raw_ble_positions = frame.get("raw_ble_positions") or {}
    telemetry_ble_by_room = frame.get("telemetry_ble_by_room") or {}

    confirmed_rooms: set[str] = set()
    for r_name, est in room_estimates.items():
        if not isinstance(est, dict) or not est.get("human_present"):
            continue
        drivers = est.get("positive_drivers") or []
        if any(classify_sensor_reliability(str(d)).category != "ble_tracker" for d in drivers):
            confirmed_rooms.add(str(r_name).strip().lower())

    domain_data = (
        hass.data.get(DOMAIN, {}) if hass and isinstance(getattr(hass, "data", None), dict) else {}
    )
    for peer in domain_data.values():
        peer_sm = getattr(peer, "state_machine", None)
        peer_name = getattr(peer, "room_name", None)
        if peer_sm and peer_name and peer_sm.state == OccupancyState.OCCUPIED_CONFIRMED:
            snap = getattr(peer_sm, "snapshot", None)
            if snap and (
                snap.camera_confirmed
                or any(
                    classify_sensor_reliability(t).category != "ble_tracker"
                    for t in snap.active_triggers
                )
            ):
                confirmed_rooms.add(str(peer_name).strip().lower())

    room_low = room_name.strip().lower()
    has_ble_here = bool(telemetry_ble_by_room.get(room_name))
    if not has_ble_here:
        for raw_area in raw_ble_positions.values():
            norm = _normalize_ble_area_to_room(str(raw_area)) or str(raw_area).strip()
            if norm.lower() == room_low:
                has_ble_here = True
                break

    contextual: list[dict[str, Any]] = []
    for obs in observations:
        entry = dict(obs)
        eid = str(entry.get("entity_id", ""))
        prof = classify_sensor_reliability(eid)
        if prof.category == "ble_tracker":
            raw_area = raw_ble_positions.get(eid)
            if raw_area is None and hass and hasattr(hass, "states"):
                st_obj = hass.states.get(eid)
                raw_area = getattr(st_obj, "state", None) if st_obj is not None else None
            target_room = (
                (_normalize_ble_area_to_room(str(raw_area)) or str(raw_area).strip())
                if raw_area is not None
                else ""
            )
            t_low = target_room.lower()
            is_known_other = (
                bool(t_low)
                and t_low not in ("unknown", "unavailable", "none", "away", "not_home")
                and t_low != room_low
            )
            entry["penalize_when_off"] = bool(
                not guest_mode_enabled
                and not has_ble_here
                and is_known_other
                and t_low in confirmed_rooms
            )
        else:
            # Camera off, PIR off, and non-exclusive sensors remain strictly neutral
            entry["penalize_when_off"] = False
        contextual.append(entry)
    return contextual


def evaluate_bayesian(
    observations: list[dict[str, Any]],
    state_getter: Callable[[str], Any],
    prior: float = DEFAULT_BAYESIAN_PRIOR,
    threshold: float = DEFAULT_BAYESIAN_THRESHOLD,
) -> BayesianEvaluation:
    """Evaluate Bayesian posterior probability and generate natural-language explanation."""
    prior_clamped = _clamp_prob(prior)
    threshold_clamped = _clamp_prob(threshold)

    odds = prior_clamped / (1.0 - prior_clamped)
    current_prob = prior_clamped

    active_list: list[dict[str, Any]] = []
    inactive_list: list[dict[str, Any]] = []

    for obs in observations:
        entity_id = obs.get("entity_id")
        if not entity_id:
            continue

        entity_state_obj = state_getter(entity_id)
        state_val = getattr(entity_state_obj, "state", None) if entity_state_obj else None
        attrs = getattr(entity_state_obj, "attributes", {}) if entity_state_obj else {}

        is_active = evaluate_condition(obs, state_val, attrs)
        preset_name, pt, pf = resolve_observation_weights(obs)
        label = friendly_entity_label(obs, entity_state_obj)
        rule_desc = format_condition_description(obs)

        if is_active:
            lr = pt / pf
            prev_prob = current_prob
            odds *= lr
            current_prob = odds / (1.0 + odds)
            delta_pct = round((current_prob - prev_prob) * 100.0, 1)
            active_list.append(
                {
                    "entity_id": entity_id,
                    "label": label,
                    "preset": preset_name,
                    "current_state": state_val,
                    "rule": rule_desc,
                    "prob_given_true": round(pt, 3),
                    "prob_given_false": round(pf, 3),
                    "likelihood_ratio": round(lr, 2),
                    "probability_delta_pct": delta_pct,
                    "explanation": f"{label} [{preset_name}, +{delta_pct:.1f}%]",
                }
            )
        else:
            penalize_off = bool(obs.get("penalize_when_off", False))
            delta_pct = 0.0
            lr = 1.0
            if penalize_off and state_val not in (None, "unavailable", "unknown"):
                lr = (1.0 - pt) / (1.0 - pf)
                prev_prob = current_prob
                odds *= lr
                current_prob = odds / (1.0 + odds)
                delta_pct = round((current_prob - prev_prob) * 100.0, 1)

            inactive_list.append(
                {
                    "entity_id": entity_id,
                    "label": label,
                    "preset": preset_name,
                    "current_state": state_val,
                    "rule": rule_desc,
                    "prob_given_true": round(pt, 3),
                    "prob_given_false": round(pf, 3),
                    "likelihood_ratio": round(lr, 2),
                    "probability_delta_pct": delta_pct,
                }
            )

    if active_list:
        final_prob = round(current_prob, 4)
        final_pct = round(current_prob * 100.0, 1)
    else:
        final_prob = 0.0
        final_pct = 0.0

    prior_pct = round(prior_clamped * 100.0, 1)
    thresh_pct = round(threshold_clamped * 100.0, 1)
    is_occupied = final_prob >= threshold_clamped

    status_word = "Occupied" if is_occupied else "Below threshold (Vacant)"
    if active_list:
        active_str = ", ".join(item["explanation"] for item in active_list)
        summary = (
            f"{final_pct}% probability ({status_word}; threshold {thresh_pct}%, "
            f"baseline {prior_pct}%). Active evidence: {active_str}."
        )
    else:
        summary = (
            f"0.0% probability ({status_word}; threshold {thresh_pct}%, "
            f"prior {prior_pct}% when triggered). No active occupancy evidence across "
            f"{len(inactive_list)} monitored sensors."
        )

    return BayesianEvaluation(
        probability=final_prob,
        probability_pct=final_pct,
        prior=round(prior_clamped, 3),
        threshold=round(threshold_clamped, 3),
        is_occupied=is_occupied,
        active_observations=active_list,
        inactive_observations=inactive_list,
        natural_language_summary=summary,
    )


def solo_posterior_pct(prior: float, pt: float, pf: float) -> float:
    """Compute what posterior percentage a single observation achieves from the prior."""
    p0 = _clamp_prob(prior)
    odds = (p0 / (1.0 - p0)) * (_clamp_prob(pt) / _clamp_prob(pf))
    return round((odds / (1.0 + odds)) * 100.0, 1)
