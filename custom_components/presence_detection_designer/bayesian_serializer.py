"""Natural-language explanation and YAML/dict serialization for Bayesian room configurations."""

from __future__ import annotations

from typing import Any

from .condition_evaluator import format_condition_description
from .const import (
    CONF_AREA_ID,
    CONF_BAYESIAN_ENABLED,
    CONF_BAYESIAN_OBSERVATIONS,
    CONF_BAYESIAN_PRIOR,
    CONF_BAYESIAN_THRESHOLD,
    CONF_BOUNDARY_ENTITIES,
    CONF_CAMERA_ENTITY,
    CONF_CONNECTED_ROOMS,
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


def explain_config_in_natural_language(config: dict[str, Any]) -> str:
    """Generate a plain-English explanation of a room's Bayesian & state machine config."""
    from .bayesian_engine import (
        build_effective_observations,
        friendly_entity_label,
        resolve_observation_weights,
        solo_posterior_pct,
    )

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
    connected = config.get(CONF_CONNECTED_ROOMS, []) or []
    conditions = config.get(CONF_SUSTAINING_CONDITIONS, []) or []
    observations = build_effective_observations(config)

    lines: list[str] = [
        f"### {room_name} — Presence Architecture & Bayesian Sensor Guide",
        f"- **Architecture Mode**: `{mode}` "
        + (
            f"(Bounded by {', '.join(boundaries)}; cooling timeout {inactivity}s, grace {grace}s)"
            if mode == Mode.BOUNDED and boundaries
            else f"(Open zone with {inactivity}s inactivity countdown)"
        ),
        f"- **Bayesian Baseline & Threshold**: Reports **0.0%** when idle; uses a **{prior_pct}%** base prior when sensors activate and declares occupancy at **{thresh_pct}%**.",
    ]

    if connected:
        lines.append(
            f"- **Connected Rooms (Instant Timer Hand-Off)**: {', '.join(str(r) for r in connected)} "
            "(vacating countdown clears to 0s immediately if an adjacent room detects presence)."
        )

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
    from .bayesian_engine import (
        build_effective_observations,
        friendly_entity_label,
        resolve_observation_weights,
    )

    room_name = config.get(CONF_ROOM_NAME, "Room")
    slug = room_name.lower().replace("'", "").replace(" ", "_")
    prior = float(config.get(CONF_BAYESIAN_PRIOR, DEFAULT_BAYESIAN_PRIOR))
    threshold = float(config.get(CONF_BAYESIAN_THRESHOLD, DEFAULT_BAYESIAN_THRESHOLD))
    observations = build_effective_observations(config)

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
    if config.get(CONF_CONNECTED_ROOMS):
        pdd_lines.append("  connected_rooms:")
        for r in config[CONF_CONNECTED_ROOMS]:
            pdd_lines.append(f'    - "{r}"')
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
    from .bayesian_engine import (
        build_effective_observations,
        friendly_entity_label,
        infer_preset_from_weights,
    )

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
