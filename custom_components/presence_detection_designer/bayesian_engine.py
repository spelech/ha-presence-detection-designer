"""Configurable and explainable Bayesian sensor fusion engine."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

from .condition_evaluator import evaluate_condition, format_condition_description
from .const import (
    BAYESIAN_PRESET_WEIGHTS,
    CONF_AREA_ID,
    CONF_BAYESIAN_ENABLED,
    CONF_BAYESIAN_OBSERVATIONS,
    CONF_BAYESIAN_PRIOR,
    CONF_BAYESIAN_THRESHOLD,
    CONF_BOUNDARY_ENTITIES,
    CONF_CAMERA_ENTITY,
    CONF_EXTEND_TIMEOUT,
    CONF_GRACE_TIMEOUT,
    CONF_INACTIVITY_TIMEOUT,
    CONF_LLM_ENABLED,
    CONF_LLM_MODEL,
    CONF_MODE,
    CONF_ROOM_NAME,
    CONF_SUSTAINING_CONDITIONS,
    CONF_TRIGGER_ENTITIES,
    DEFAULT_BAYESIAN_PRIOR,
    DEFAULT_BAYESIAN_THRESHOLD,
    DEFAULT_EXTEND_TIMEOUT,
    DEFAULT_GRACE_TIMEOUT,
    DEFAULT_INACTIVITY_TIMEOUT,
    BayesianWeightPreset,
    ConditionOperator,
    Mode,
)


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
        return preset_raw, pt, pf

    if has_explicit:
        pt = _clamp_prob(obs.get("prob_given_true", 0.85))
        pf = _clamp_prob(obs.get("prob_given_false", 0.05))
        preset_name = (
            preset_raw
            if preset_raw in BAYESIAN_PRESET_WEIGHTS
            else infer_preset_from_weights(pt, pf)
        )
        return preset_name, pt, pf

    # Default to strong if unspecified
    pt, pf = BAYESIAN_PRESET_WEIGHTS[BayesianWeightPreset.STRONG]
    return str(BayesianWeightPreset.STRONG), pt, pf


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


def build_effective_observations(config: dict[str, Any]) -> list[dict[str, Any]]:
    """Build the complete list of Bayesian observations from room configuration.

    Merges explicit `bayesian_observations` with any `trigger_entities` and
    `sustaining_conditions` not already listed so every configured sensor
    participates in the explainable Bayesian model.
    """
    explicit_obs = list(config.get(CONF_BAYESIAN_OBSERVATIONS, []) or [])
    seen_keys: set[tuple[str, str, str]] = set()
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
        seen_keys.add((eid, op, st))
        entry = dict(obs)
        entry["entity_id"] = eid
        entry["operator"] = op
        entry["state"] = st
        normalized.append(entry)

    # Synthesize from trigger_entities if not already covered
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
        if not trig_eid:
            continue
        key = (trig_eid, str(ConditionOperator.EQUALS), "on")
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

    # Synthesize from sustaining_conditions if not already covered
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
        key = (eid, op, st)
        if key in seen_keys:
            continue
        seen_keys.add(key)
        normalized.append(
            {
                "entity_id": eid,
                "operator": op,
                "state": st,
                "attribute": cond.get("attribute"),
                "label": cond.get("label"),
                "preset": str(cond.get("preset", BayesianWeightPreset.STRONG)),
            }
        )

    return normalized


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

    final_prob = round(current_prob, 4)
    final_pct = round(current_prob * 100.0, 1)
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
            f"{final_pct}% probability ({status_word}; threshold {thresh_pct}%, "
            f"baseline {prior_pct}%). No active occupancy evidence across "
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


def explain_config_in_natural_language(config: dict[str, Any]) -> str:
    """Generate a plain-English explanation of a room's Bayesian & Wasp-in-a-Box config."""
    room_name = config.get(CONF_ROOM_NAME, "Room")
    mode = config.get(CONF_MODE, Mode.OPEN)
    prior = float(config.get(CONF_BAYESIAN_PRIOR, DEFAULT_BAYESIAN_PRIOR))
    threshold = float(config.get(CONF_BAYESIAN_THRESHOLD, DEFAULT_BAYESIAN_THRESHOLD))
    prior_pct = round(prior * 100.0, 1)
    thresh_pct = round(threshold * 100.0, 1)
    inactivity = config.get(CONF_INACTIVITY_TIMEOUT, DEFAULT_INACTIVITY_TIMEOUT)
    grace = config.get(CONF_GRACE_TIMEOUT, DEFAULT_GRACE_TIMEOUT)
    extend = config.get(CONF_EXTEND_TIMEOUT, DEFAULT_EXTEND_TIMEOUT)
    boundaries = config.get(CONF_BOUNDARY_ENTITIES, []) or []
    conditions = config.get(CONF_SUSTAINING_CONDITIONS, []) or []
    observations = build_effective_observations(config)

    lines: list[str] = [
        f"### {room_name} — Presence Architecture & Bayesian Sensor Guide",
        f"- **Architecture Mode**: `{mode}` "
        + (
            f"(Wasp-in-a-Box sealed by {', '.join(boundaries)}; grace timeout {grace}s when unsealed)"
            if mode == Mode.BOUNDED and boundaries
            else f"(Open zone with {inactivity}s inactivity countdown)"
        ),
        f"- **Bayesian Baseline & Threshold**: Starts at a **{prior_pct}%** baseline prior and declares occupancy when combined evidence reaches **{thresh_pct}%**.",
    ]

    if observations:
        lines.append("- **Bayesian Sensor Evidence Tiers**:")
        for obs in observations:
            preset_name, pt, pf = resolve_observation_weights(obs)
            solo_pct = solo_posterior_pct(prior, pt, pf)
            crosses = "triggers occupancy solo" if solo_pct >= thresh_pct else "needs corroboration"
            label = friendly_entity_label(obs)
            rule = format_condition_description(obs)
            lines.append(
                f"  - **{label}** (`{rule}`): **{preset_name.upper()}** weight "
                f"(P(E|T)={pt:.2f}, P(E|F)={pf:.2f} -> **{solo_pct}%** solo; {crosses})"
            )

    if conditions:
        cond_strs = [format_condition_description(c) for c in conditions]
        lines.append(
            f"- **Sustaining Conditions (Hold Presence Without Motion)**: {', '.join(cond_strs)}"
        )

    if config.get(CONF_LLM_ENABLED):
        cam = config.get(CONF_CAMERA_ENTITY) or "configured snapshot URL"
        model = config.get(CONF_LLM_MODEL, "gpt-4o-mini")
        lines.append(
            f"- **Pre-Vacate Vision AI Check**: Enabled on `{cam}` using `{model}` "
            f"(extends occupancy by {extend}s if a stationary human is seen before clearing)."
        )

    return "\n".join(lines)


def config_to_yaml_representations(config: dict[str, Any]) -> dict[str, str]:
    """Render both Presence Detection Designer YAML and native HA Bayesian YAML."""
    room_name = config.get(CONF_ROOM_NAME, "Room")
    slug = room_name.lower().replace("'", "").replace(" ", "_")
    prior = float(config.get(CONF_BAYESIAN_PRIOR, DEFAULT_BAYESIAN_PRIOR))
    threshold = float(config.get(CONF_BAYESIAN_THRESHOLD, DEFAULT_BAYESIAN_THRESHOLD))
    observations = build_effective_observations(config)

    # 1. Native Home Assistant `platform: bayesian` YAML
    ha_lines = [
        "- platform: bayesian",
        f'  name: "Bayesian {room_name}"',
        f'  unique_id: "bayesian_{slug}_occupancy"',
        f"  prior: {prior:.2f}",
        f"  probability_threshold: {threshold:.2f}",
        "  device_class: occupancy",
        "  observations:",
    ]

    for obs in observations:
        eid = obs.get("entity_id", "")
        op = str(obs.get("operator", ConditionOperator.EQUALS))
        state_val = obs.get("state", "on")
        preset_name, pt, pf = resolve_observation_weights(obs)
        label = friendly_entity_label(obs)
        ha_lines.append(f"    # {label} ({preset_name})")
        if op in (ConditionOperator.GREATER_THAN, ConditionOperator.LESS_THAN):
            ha_lines.append("    - platform: numeric_state")
            ha_lines.append(f"      entity_id: {eid}")
            ha_lines.append(f"      prob_given_true: {pt:.2f}")
            ha_lines.append(f"      prob_given_false: {pf:.2f}")
            if op == ConditionOperator.GREATER_THAN:
                ha_lines.append(f"      above: {state_val}")
            else:
                ha_lines.append(f"      below: {state_val}")
        else:
            ha_lines.append("    - platform: state")
            ha_lines.append(f"      entity_id: {eid}")
            ha_lines.append(f"      prob_given_true: {pt:.2f}")
            ha_lines.append(f"      prob_given_false: {pf:.2f}")
            ha_lines.append(f'      to_state: "{state_val}"')

    # 2. Presence Detection Designer structured YAML
    pdd_lines = [
        f"{slug}:",
        f'  room_name: "{room_name}"',
        f'  mode: "{config.get(CONF_MODE, Mode.OPEN)}"',
        f"  bayesian_prior: {prior:.2f}",
        f"  bayesian_threshold: {threshold:.2f}",
        f"  inactivity_timeout: {config.get(CONF_INACTIVITY_TIMEOUT, DEFAULT_INACTIVITY_TIMEOUT)}",
        f"  grace_timeout: {config.get(CONF_GRACE_TIMEOUT, DEFAULT_GRACE_TIMEOUT)}",
        f"  extend_timeout: {config.get(CONF_EXTEND_TIMEOUT, DEFAULT_EXTEND_TIMEOUT)}",
    ]
    if config.get(CONF_AREA_ID):
        pdd_lines.append(f'  area_id: "{config[CONF_AREA_ID]}"')
    if config.get(CONF_BOUNDARY_ENTITIES):
        pdd_lines.append("  boundary_entities:")
        for b in config[CONF_BOUNDARY_ENTITIES]:
            pdd_lines.append(f"    - {b}")
    if config.get(CONF_TRIGGER_ENTITIES):
        pdd_lines.append("  trigger_entities:")
        for t in config[CONF_TRIGGER_ENTITIES]:
            pdd_lines.append(f"    - {t}")
    if config.get(CONF_SUSTAINING_CONDITIONS):
        pdd_lines.append("  sustaining_conditions:")
        for c in config[CONF_SUSTAINING_CONDITIONS]:
            pdd_lines.append(f"    - entity_id: {c.get('entity_id')}")
            pdd_lines.append(f"      operator: {c.get('operator', 'equals')}")
            pdd_lines.append(f'      state: "{c.get("state", "on")}"')
    if observations:
        pdd_lines.append("  bayesian_observations:")
        for obs in observations:
            preset_name, pt, pf = resolve_observation_weights(obs)
            pdd_lines.append(f"    - entity_id: {obs.get('entity_id')}")
            pdd_lines.append(f'      label: "{friendly_entity_label(obs)}"')
            pdd_lines.append(f"      preset: {preset_name}")
            pdd_lines.append(f"      operator: {obs.get('operator', 'equals')}")
            pdd_lines.append(f'      state: "{obs.get("state", "on")}"')
            pdd_lines.append(f"      prob_given_true: {pt:.2f}")
            pdd_lines.append(f"      prob_given_false: {pf:.2f}")

    return {
        "designer_yaml": "\n".join(pdd_lines),
        "ha_bayesian_yaml": "\n".join(ha_lines),
    }


def parse_yaml_or_dict_to_config(raw_data: str | dict[str, Any]) -> dict[str, Any]:
    """Parse either a HA `platform: bayesian` YAML/dict or Designer YAML/dict into a normalized Designer config."""
    if isinstance(raw_data, str):
        try:
            import yaml

            parsed = yaml.safe_load(raw_data)
        except Exception:  # noqa: BLE001
            parsed = {}
    else:
        parsed = dict(raw_data)

    if isinstance(parsed, list) and len(parsed) > 0 and isinstance(parsed[0], dict):
        parsed = parsed[0]

    if not isinstance(parsed, dict):
        return {CONF_ROOM_NAME: "Room", CONF_MODE: str(Mode.OPEN)}

    # Unwrap single top-level room key if present
    if (
        len(parsed) == 1
        and CONF_ROOM_NAME not in parsed
        and "platform" not in parsed
        and isinstance(next(iter(parsed.values())), dict)
    ):
        top_key = next(iter(parsed.keys()))
        inner = dict(parsed[top_key])
        inner.setdefault(CONF_ROOM_NAME, str(top_key).replace("_", " ").title())
        parsed = inner

    # Check if this is a native HA `platform: bayesian` definition
    if parsed.get("platform") == "bayesian" or "observations" in parsed:
        raw_name = str(parsed.get("name", "Room")).replace("Bayesian ", "").strip()
        prior = float(parsed.get("prior", DEFAULT_BAYESIAN_PRIOR))
        threshold = float(parsed.get("probability_threshold", DEFAULT_BAYESIAN_THRESHOLD))
        bayesian_obs: list[dict[str, Any]] = []
        triggers: list[str] = []
        conditions: list[dict[str, Any]] = []

        for item in parsed.get("observations", []) or []:
            if not isinstance(item, dict) or not item.get("entity_id"):
                continue
            eid = str(item["entity_id"])
            pt = float(item.get("prob_given_true", 0.80))
            pf = float(item.get("prob_given_false", 0.10))
            preset = infer_preset_from_weights(pt, pf)

            if item.get("platform") == "numeric_state":
                if "above" in item:
                    op = str(ConditionOperator.GREATER_THAN)
                    st = str(item["above"])
                else:
                    op = str(ConditionOperator.LESS_THAN)
                    st = str(item.get("below", 0))
            else:
                op = str(ConditionOperator.EQUALS)
                st = str(item.get("to_state", "on"))

            obs_entry = {
                "entity_id": eid,
                "label": friendly_entity_label({"entity_id": eid}),
                "preset": preset,
                "operator": op,
                "state": st,
                "prob_given_true": pt,
                "prob_given_false": pf,
            }
            bayesian_obs.append(obs_entry)

            if (
                eid.startswith("binary_sensor.")
                and st == "on"
                and preset
                in (
                    BayesianWeightPreset.DECISIVE,
                    BayesianWeightPreset.STRONG,
                )
            ):
                triggers.append(eid)
            elif eid.startswith(("media_player.", "sensor.")):
                conditions.append({"entity_id": eid, "operator": op, "state": st})

        return {
            CONF_ROOM_NAME: raw_name,
            CONF_MODE: str(Mode.OPEN),
            CONF_BAYESIAN_ENABLED: True,
            CONF_BAYESIAN_PRIOR: prior,
            CONF_BAYESIAN_THRESHOLD: threshold,
            CONF_TRIGGER_ENTITIES: triggers,
            CONF_SUSTAINING_CONDITIONS: conditions,
            CONF_BAYESIAN_OBSERVATIONS: bayesian_obs,
            CONF_INACTIVITY_TIMEOUT: DEFAULT_INACTIVITY_TIMEOUT,
            CONF_GRACE_TIMEOUT: DEFAULT_GRACE_TIMEOUT,
            CONF_EXTEND_TIMEOUT: DEFAULT_EXTEND_TIMEOUT,
        }

    # Otherwise normalize a Designer config dict
    result = dict(parsed)
    result.setdefault(CONF_ROOM_NAME, "Room")
    result.setdefault(CONF_MODE, str(Mode.OPEN))
    result.setdefault(CONF_BAYESIAN_ENABLED, True)
    result.setdefault(CONF_BAYESIAN_PRIOR, DEFAULT_BAYESIAN_PRIOR)
    result.setdefault(CONF_BAYESIAN_THRESHOLD, DEFAULT_BAYESIAN_THRESHOLD)
    if CONF_BOUNDARY_ENTITIES in result and isinstance(result[CONF_BOUNDARY_ENTITIES], list):
        result[CONF_BOUNDARY_ENTITIES] = [
            str(b.get("entity_id") if isinstance(b, dict) else b)
            for b in result[CONF_BOUNDARY_ENTITIES]
            if b
        ]
    if CONF_TRIGGER_ENTITIES in result and isinstance(result[CONF_TRIGGER_ENTITIES], list):
        result[CONF_TRIGGER_ENTITIES] = [
            str(t.get("entity_id") if isinstance(t, dict) else t)
            for t in result[CONF_TRIGGER_ENTITIES]
            if t
        ]
    if CONF_SUSTAINING_CONDITIONS in result and isinstance(
        result[CONF_SUSTAINING_CONDITIONS], list
    ):
        norm_conds: list[dict[str, Any]] = []
        for c in result[CONF_SUSTAINING_CONDITIONS]:
            if isinstance(c, str):
                norm_conds.append({"entity_id": c, "operator": "equals", "state": "on"})
            elif isinstance(c, dict) and c.get("entity_id"):
                norm_conds.append(
                    {
                        "entity_id": str(c["entity_id"]),
                        "operator": str(c.get("operator", "equals")),
                        "state": str(c.get("state", "on")),
                    }
                )
        result[CONF_SUSTAINING_CONDITIONS] = norm_conds
    result[CONF_BAYESIAN_OBSERVATIONS] = build_effective_observations(result)
    return result
