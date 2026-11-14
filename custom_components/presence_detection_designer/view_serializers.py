"""View payload serializers, combinatorics calculators, and room persistence routines."""

from __future__ import annotations

import itertools
from typing import Any

try:
    from homeassistant.components.http import HomeAssistantView

    if type(HomeAssistantView).__name__ == "MagicMock":
        raise ImportError
except Exception:  # noqa: BLE001

    class HomeAssistantView:  # type: ignore[no-redef]
        """Fallback HomeAssistantView when running outside Home Assistant."""

        url: str = ""
        name: str = ""
        requires_auth: bool = True

        def json(self, result: Any, status_code: int = 200) -> dict[str, Any]:
            return {"status_code": status_code, "body": result}


from .bayesian_engine import (
    normalize_observation,
    parse_yaml_or_dict_to_config,
    prior_and_lrs_to_posterior,
)
from .const import (
    BAYESIAN_PRESET_DESCRIPTIONS,
    BAYESIAN_PRESET_WEIGHTS,
    CONF_AREA_ID,
    CONF_ROOM_NAME,
    DOMAIN,
)
from .coordinator import RoomPresenceCoordinator
from .store import async_get_store


def build_combinatorics_preview(
    prior: float,
    threshold: float,
    observations: list[dict[str, Any]],
) -> dict[str, Any]:
    """Compute solo and pair Bayesian posteriors to show which sensor combinations cross the threshold."""
    normalized = [normalize_observation(o) for o in observations if isinstance(o, dict)]
    prior_clamped = max(0.01, min(0.99, float(prior)))
    thresh_pct = round(float(threshold) * 100.0, 1)

    solo_triggers: list[dict[str, Any]] = []
    solo_sub_threshold: list[dict[str, Any]] = []

    for obs in normalized:
        lr = float(obs["likelihood_ratio"])
        post = prior_and_lrs_to_posterior(prior_clamped, [lr])
        post_pct = round(post * 100.0, 1)
        item = {
            "entity_id": obs["entity_id"],
            "label": obs["label"],
            "preset": obs["preset"],
            "prob_given_true": obs["prob_given_true"],
            "prob_given_false": obs["prob_given_false"],
            "likelihood_ratio": round(lr, 2),
            "posterior_pct": post_pct,
            "delta_pct": round((post - prior_clamped) * 100.0, 1),
        }
        if post >= threshold:
            solo_triggers.append(item)
        else:
            solo_sub_threshold.append(item)

    solo_triggers.sort(key=lambda x: x["posterior_pct"], reverse=True)
    solo_sub_threshold.sort(key=lambda x: x["posterior_pct"], reverse=True)

    pair_triggers: list[dict[str, Any]] = []
    pair_sub_threshold: list[dict[str, Any]] = []

    for obs_a, obs_b in itertools.combinations(normalized, 2):
        if obs_a["entity_id"] == obs_b["entity_id"]:
            continue
        post_a = prior_and_lrs_to_posterior(prior_clamped, [float(obs_a["likelihood_ratio"])])
        post_b = prior_and_lrs_to_posterior(prior_clamped, [float(obs_b["likelihood_ratio"])])
        if post_a >= threshold or post_b >= threshold:
            continue

        combined = prior_and_lrs_to_posterior(
            prior_clamped,
            [float(obs_a["likelihood_ratio"]), float(obs_b["likelihood_ratio"])],
        )
        combined_pct = round(combined * 100.0, 1)
        pair_item = {
            "labels": f"{obs_a['label']} + {obs_b['label']}",
            "entities": [obs_a["entity_id"], obs_b["entity_id"]],
            "presets": f"{obs_a['preset']} + {obs_b['preset']}",
            "posterior_pct": combined_pct,
            "crosses_threshold": combined >= threshold,
        }
        if combined >= threshold:
            pair_triggers.append(pair_item)
        else:
            pair_sub_threshold.append(pair_item)

    pair_triggers.sort(key=lambda x: x["posterior_pct"], reverse=True)
    pair_sub_threshold.sort(key=lambda x: x["posterior_pct"], reverse=True)

    return {
        "prior_pct": round(prior_clamped * 100.0, 1),
        "threshold_pct": thresh_pct,
        "solo_triggers": solo_triggers,
        "solo_sub_threshold": solo_sub_threshold,
        "pair_triggers": pair_triggers[:20],
        "pair_sub_threshold": pair_sub_threshold[:15],
    }


def serialize_room_coordinator(
    coordinator: RoomPresenceCoordinator,
    revisions: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Serialize a RoomPresenceCoordinator and its live state for the Design Studio UI."""
    coordinator._eval_conditions_and_update()
    sm = coordinator.state_machine
    combinatorics = build_combinatorics_preview(
        prior=coordinator.bayesian_prior,
        threshold=coordinator.bayesian_threshold,
        observations=coordinator.bayesian_observations,
    )
    return {
        "entry_id": coordinator.entry_id,
        "room_name": coordinator.room_name,
        "area_id": coordinator.area_id,
        "mode": str(coordinator.mode),
        "connected_rooms": coordinator.connected_rooms,
        "is_present": sm.is_present,
        "occupancy_state": str(sm.state),
        "is_cooling_down": sm.is_cooling_down,
        "cooling_remaining_sec": sm.cooling_remaining_sec,
        "state_reason": sm.state_reason,
        "last_transition_reason": sm.last_transition_reason,
        "verified_by": sm.verified_by,
        "transition_history": sm.transition_history,
        "mermaid_diagram": sm.get_mermaid_diagram(),
        "override": sm.override,
        "bayesian_probability": sm.bayesian_probability,
        "bayesian_probability_pct": sm.bayesian_probability_pct,
        "bayesian_prior": coordinator.bayesian_prior,
        "bayesian_prior_pct": round(coordinator.bayesian_prior * 100.0, 1),
        "bayesian_threshold": coordinator.bayesian_threshold,
        "bayesian_threshold_pct": round(coordinator.bayesian_threshold * 100.0, 1),
        "bayesian_occupied": sm.bayesian_occupied,
        "active_observations": sm.active_observations,
        "inactive_observations": sm.inactive_observations,
        "active_conditions": sm.active_conditions,
        "last_trigger_entity": sm.last_trigger_entity,
        "last_llm_result": sm.last_llm_result,
        "natural_language_summary": sm.bayesian_summary,
        "natural_language_explanation": sm.build_natural_language_explanation(),
        "rule_guide": coordinator.rule_guide,
        "ha_bayesian_yaml": coordinator.yaml_representations.get("ha_bayesian_yaml", ""),
        "designer_yaml": coordinator.yaml_representations.get("designer_yaml", ""),
        "combinatorics": combinatorics,
        "spatial_estimate": coordinator.last_spatial_estimate,
        "config": coordinator.config,
        "revisions": [
            {
                "index": idx,
                "timestamp": rev.get("timestamp", ""),
                "note": rev.get("note", ""),
                "config": rev.get("config", {}),
            }
            for idx, rev in enumerate(revisions or [])
        ],
    }


def collect_ha_areas_and_entities(hass: Any) -> tuple[list[dict[str, str]], list[dict[str, Any]]]:
    """Collect Home Assistant areas and candidate entities for the Design Studio."""
    areas: list[dict[str, str]] = []
    entity_area_map: dict[str, str] = {}

    if hass:
        try:
            from homeassistant.helpers import (
                area_registry as ar,
            )
            from homeassistant.helpers import (
                device_registry as dr,
            )
            from homeassistant.helpers import (
                entity_registry as er,
            )

            area_reg = ar.async_get(hass)
            if hasattr(area_reg, "async_list_areas"):
                for area in area_reg.async_list_areas():
                    areas.append({"id": str(area.id), "name": str(area.name)})

            dev_reg = dr.async_get(hass)
            ent_reg = er.async_get(hass)
            if hasattr(ent_reg, "entities") and isinstance(ent_reg.entities, dict):
                for eid, entry in ent_reg.entities.items():
                    aid = getattr(entry, "area_id", None)
                    if (
                        not aid
                        and getattr(entry, "device_id", None)
                        and hasattr(dev_reg, "async_get")
                    ):
                        dev = dev_reg.async_get(entry.device_id)
                        if dev:
                            aid = getattr(dev, "area_id", None)
                    if aid:
                        entity_area_map[str(eid)] = str(aid)
        except Exception:  # noqa: BLE001
            pass

    areas.sort(key=lambda a: a["name"].lower())

    entities: list[dict[str, Any]] = []
    allowed_prefixes = (
        "binary_sensor.",
        "sensor.",
        "media_player.",
        "camera.",
        "light.",
        "fan.",
        "switch.",
        "person.",
        "device_tracker.",
        "input_boolean.",
    )
    if hass and hasattr(hass, "states") and hasattr(hass.states, "async_all"):
        try:
            for st in hass.states.async_all():
                eid = str(getattr(st, "entity_id", ""))
                if not eid.startswith(allowed_prefixes):
                    continue
                attrs = getattr(st, "attributes", {}) or {}
                entities.append(
                    {
                        "entity_id": eid,
                        "name": str(attrs.get("friendly_name", eid)),
                        "domain": eid.split(".", 1)[0],
                        "state": str(getattr(st, "state", "")),
                        "device_class": str(attrs.get("device_class", "")),
                        "area_id": entity_area_map.get(eid, ""),
                    }
                )
        except Exception:  # noqa: BLE001
            pass

    entities.sort(key=lambda e: e["entity_id"])
    return areas, entities


def build_presets_metadata() -> dict[str, dict[str, Any]]:
    """Return metadata for each Bayesian weight preset."""
    presets: dict[str, dict[str, Any]] = {}
    for preset_key, (p_true, p_false) in BAYESIAN_PRESET_WEIGHTS.items():
        presets[str(preset_key)] = {
            "prob_given_true": p_true,
            "prob_given_false": p_false,
            "likelihood_ratio": round(p_true / p_false, 2),
            "description": BAYESIAN_PRESET_DESCRIPTIONS.get(preset_key, ""),
        }
    presets["custom"] = {
        "prob_given_true": 0.75,
        "prob_given_false": 0.15,
        "likelihood_ratio": 5.0,
        "description": BAYESIAN_PRESET_DESCRIPTIONS.get("custom", ""),
    }
    return presets


async def async_apply_and_persist_room_config(
    hass: Any,
    entry_id: str,
    raw_config: dict[str, Any] | str,
    note: str = "Updated via Design Studio",
    record_revision: bool = True,
) -> dict[str, Any]:
    """Normalize, persist to .storage + ConfigEntry, and hot-apply a room configuration."""
    store = await async_get_store(hass)
    normalized = parse_yaml_or_dict_to_config(raw_config)

    coordinator: RoomPresenceCoordinator | None = hass.data.get(DOMAIN, {}).get(entry_id)
    base_cfg: dict[str, Any] = {}
    if isinstance(coordinator, RoomPresenceCoordinator):
        base_cfg = dict(coordinator.config)
    else:
        stored_room = store.get_room(entry_id)
        if stored_room:
            base_cfg = stored_room

    merged = {**base_cfg, **normalized}

    await store.async_save_room(
        entry_id=entry_id,
        config=merged,
        note=note,
        record_revision=record_revision,
    )

    if hasattr(hass, "config_entries") and hasattr(hass.config_entries, "async_get_entry"):
        entry = hass.config_entries.async_get_entry(entry_id)
        if entry is not None and hasattr(hass.config_entries, "async_update_entry"):
            update_kwargs: dict[str, Any] = {
                "title": str(merged.get(CONF_ROOM_NAME, getattr(entry, "title", "Room"))),
                "data": merged,
            }
            if getattr(entry, "options", None):
                update_kwargs["options"] = {**entry.options, **merged}
            hass.config_entries.async_update_entry(
                entry,
                **update_kwargs,
            )

    try:
        from homeassistant.helpers import device_registry as dr

        dev_reg = dr.async_get(hass)
        if hasattr(dev_reg, "async_get_device") and hasattr(dev_reg, "async_update_device"):
            dev = dev_reg.async_get_device(identifiers={(DOMAIN, entry_id)})
            if dev is not None:
                new_area_id = merged.get(CONF_AREA_ID) or None
                if getattr(dev, "area_id", None) != new_area_id:
                    dev_reg.async_update_device(dev.id, area_id=new_area_id)
    except Exception:  # noqa: BLE001
        pass

    if isinstance(coordinator, RoomPresenceCoordinator):
        await coordinator.async_apply_config_in_place(merged)
        return serialize_room_coordinator(coordinator, revisions=store.get_revisions(entry_id))

    return {"entry_id": entry_id, "config": merged, "revisions": store.get_revisions(entry_id)}
