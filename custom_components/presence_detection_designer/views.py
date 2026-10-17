"""Authenticated HTTP API views for the Presence Detection Designer Visual Studio panel."""

from __future__ import annotations

import itertools
import logging
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
    build_effective_observations,
    config_to_yaml_representations,
    evaluate_bayesian,
    explain_config_in_natural_language,
    normalize_observation,
    parse_yaml_or_dict_to_config,
    prior_and_lrs_to_posterior,
)
from .const import (
    BAYESIAN_PRESET_DESCRIPTIONS,
    BAYESIAN_PRESET_WEIGHTS,
    CONF_BAYESIAN_OBSERVATIONS,
    CONF_BAYESIAN_PRIOR,
    CONF_BAYESIAN_THRESHOLD,
    CONF_ROOM_NAME,
    DEFAULT_BAYESIAN_PRIOR,
    DEFAULT_BAYESIAN_THRESHOLD,
    DOMAIN,
    LLMProviderType,
)
from .coordinator import RoomPresenceCoordinator, _safe_state_getter
from .llm_verifier import LLMVerifier
from .replay_engine import (
    async_fetch_room_history,
    simulate_config_on_timelines,
    simulate_replay_comparison,
)
from .store import async_get_store

_LOGGER = logging.getLogger(__name__)


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

    # Check all pairs of sub-threshold sensors (where both don't already solo-trigger)
    for obs_a, obs_b in itertools.combinations(normalized, 2):
        # Skip pairs of mutually exclusive observations on the exact same entity_id
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
        "is_present": sm.is_present,
        "box_state": str(sm.box_state),
        "perimeter_sealed": sm.is_perimeter_sealed,
        "vacating_countdown": sm.vacating_countdown,
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

    # 1. Persist to .storage/presence_detection_designer with revision snapshot
    await store.async_save_room(
        entry_id=entry_id,
        config=merged,
        note=note,
        record_revision=record_revision,
    )

    # 2. Update Home Assistant ConfigEntry data in-place (without triggering a full entry reload)
    if hasattr(hass, "config_entries") and hasattr(hass.config_entries, "async_get_entry"):
        entry = hass.config_entries.async_get_entry(entry_id)
        if entry is not None and hasattr(hass.config_entries, "async_update_entry"):
            hass.config_entries.async_update_entry(
                entry,
                title=str(merged.get(CONF_ROOM_NAME, getattr(entry, "title", "Room"))),
                data=merged,
            )

    # 3. Hot-update running coordinator in-place
    if isinstance(coordinator, RoomPresenceCoordinator):
        await coordinator.async_apply_config_in_place(merged)
        return serialize_room_coordinator(coordinator, revisions=store.get_revisions(entry_id))

    return {"entry_id": entry_id, "config": merged, "revisions": store.get_revisions(entry_id)}


class PDDOverviewView(HomeAssistantView):
    """Return all rooms, live Bayesian breakdowns, .storage settings, areas, and candidate entities."""

    url = "/api/presence_detection_designer/overview"
    name = "api:presence_detection_designer:overview"
    requires_auth = True

    async def get(self, request: Any) -> Any:
        """Handle GET /api/presence_detection_designer/overview."""
        hass = request.app["hass"]
        store = await async_get_store(hass)

        rooms_payload: list[dict[str, Any]] = []
        domain_data = hass.data.get(DOMAIN, {})
        for eid, coordinator in domain_data.items():
            if not isinstance(coordinator, RoomPresenceCoordinator):
                continue
            revs = store.get_revisions(eid)
            rooms_payload.append(serialize_room_coordinator(coordinator, revisions=revs))

        rooms_payload.sort(key=lambda r: str(r.get("room_name", "")).lower())
        areas, entities = collect_ha_areas_and_entities(hass)

        return self.json(
            {
                "rooms": rooms_payload,
                "global_settings": store.global_settings,
                "areas": areas,
                "entities": entities,
                "presets": build_presets_metadata(),
            }
        )


class PDDRoomConfigView(HomeAssistantView):
    """Save and hot-apply configuration updates for a room."""

    url = "/api/presence_detection_designer/room/{entry_id}"
    name = "api:presence_detection_designer:room_config"
    requires_auth = True

    async def post(self, request: Any, entry_id: str) -> Any:
        """Handle POST /api/presence_detection_designer/room/{entry_id}."""
        hass = request.app["hass"]
        try:
            body = await request.json()
        except Exception as err:  # noqa: BLE001
            return self.json({"error": f"Invalid JSON body: {err}"}, status_code=400)

        raw_cfg = body.get("yaml_config") or body.get("config") or body
        note = str(body.get("note") or "Updated via Design Studio")

        try:
            room_payload = await async_apply_and_persist_room_config(
                hass=hass,
                entry_id=entry_id,
                raw_config=raw_cfg,
                note=note,
                record_revision=True,
            )
            return self.json({"status": "ok", "room": room_payload})
        except Exception as err:  # noqa: BLE001
            _LOGGER.error("Failed to update room %s: %s", entry_id, err)
            return self.json({"error": str(err)}, status_code=400)


class PDDRoomRollbackView(HomeAssistantView):
    """Rollback a room's configuration to a previous .storage revision."""

    url = "/api/presence_detection_designer/room/{entry_id}/rollback"
    name = "api:presence_detection_designer:room_rollback"
    requires_auth = True

    async def post(self, request: Any, entry_id: str) -> Any:
        """Handle POST /api/presence_detection_designer/room/{entry_id}/rollback."""
        hass = request.app["hass"]
        store = await async_get_store(hass)
        try:
            body = await request.json()
        except Exception:  # noqa: BLE001
            body = {}

        rev_idx = int(body.get("revision_index", 0))
        try:
            restored_cfg = await store.async_rollback_room(entry_id, rev_idx)
            room_payload = await async_apply_and_persist_room_config(
                hass=hass,
                entry_id=entry_id,
                raw_config=restored_cfg,
                note="Restored from revision",
                record_revision=False,
            )
            return self.json({"status": "ok", "room": room_payload})
        except Exception as err:  # noqa: BLE001
            return self.json({"error": str(err)}, status_code=400)


class PDDRoomActionView(HomeAssistantView):
    """Trigger immediate room actions (force_refresh, verify_presence, set_override)."""

    url = "/api/presence_detection_designer/room/{entry_id}/action"
    name = "api:presence_detection_designer:room_action"
    requires_auth = True

    async def post(self, request: Any, entry_id: str) -> Any:
        """Handle POST /api/presence_detection_designer/room/{entry_id}/action."""
        hass = request.app["hass"]
        store = await async_get_store(hass)
        coordinator = hass.data.get(DOMAIN, {}).get(entry_id)
        if not isinstance(coordinator, RoomPresenceCoordinator):
            return self.json({"error": f"Room {entry_id} not found"}, status_code=404)

        try:
            body = await request.json()
        except Exception:  # noqa: BLE001
            body = {}

        action = str(body.get("action", "force_refresh"))
        if action == "verify_presence":
            await coordinator.async_manual_verify()
        elif action == "set_override":
            enabled = bool(body.get("enabled", not coordinator.state_machine.override))
            coordinator.state_machine.set_override(enabled)
            coordinator.async_update_listeners()
        else:
            coordinator.async_refresh_all_states()
            coordinator.async_update_listeners()

        return self.json(
            {
                "status": "ok",
                "room": serialize_room_coordinator(
                    coordinator, revisions=store.get_revisions(entry_id)
                ),
            }
        )


class PDDPreviewBayesianView(HomeAssistantView):
    """Stateless live preview of draft Bayesian parameters and observations."""

    url = "/api/presence_detection_designer/preview_bayesian"
    name = "api:presence_detection_designer:preview_bayesian"
    requires_auth = True

    async def post(self, request: Any) -> Any:
        """Handle POST /api/presence_detection_designer/preview_bayesian."""
        hass = request.app["hass"]
        try:
            body = await request.json()
        except Exception as err:  # noqa: BLE001
            return self.json({"error": f"Invalid JSON: {err}"}, status_code=400)

        raw_cfg = body.get("yaml_config") or body.get("config") or body
        normalized = parse_yaml_or_dict_to_config(raw_cfg)

        prior = float(normalized.get(CONF_BAYESIAN_PRIOR, DEFAULT_BAYESIAN_PRIOR))
        threshold = float(normalized.get(CONF_BAYESIAN_THRESHOLD, DEFAULT_BAYESIAN_THRESHOLD))
        observations = normalized.get(CONF_BAYESIAN_OBSERVATIONS) or build_effective_observations(
            normalized
        )

        evaluation = evaluate_bayesian(
            observations=observations,
            state_getter=lambda eid: _safe_state_getter(hass, eid),
            prior=prior,
            threshold=threshold,
        )
        combinatorics = build_combinatorics_preview(
            prior=prior,
            threshold=threshold,
            observations=observations,
        )
        yamls = config_to_yaml_representations(normalized)
        guide = explain_config_in_natural_language(normalized)

        return self.json(
            {
                "probability": evaluation.probability,
                "probability_pct": evaluation.probability_pct,
                "is_occupied": evaluation.is_occupied,
                "prior_pct": round(prior * 100.0, 1),
                "threshold_pct": round(threshold * 100.0, 1),
                "active_observations": evaluation.active_observations,
                "inactive_observations": evaluation.inactive_observations,
                "natural_language_summary": evaluation.natural_language_summary,
                "combinatorics": combinatorics,
                "rule_guide": guide,
                "ha_bayesian_yaml": yamls.get("ha_bayesian_yaml", ""),
                "designer_yaml": yamls.get("designer_yaml", ""),
            }
        )


class PDDGlobalSettingsView(HomeAssistantView):
    """Update shared global settings in .storage/presence_detection_designer."""

    url = "/api/presence_detection_designer/global_settings"
    name = "api:presence_detection_designer:global_settings"
    requires_auth = True

    async def post(self, request: Any) -> Any:
        """Handle POST /api/presence_detection_designer/global_settings."""
        hass = request.app["hass"]
        store = await async_get_store(hass)
        try:
            body = await request.json()
        except Exception as err:  # noqa: BLE001
            return self.json({"error": f"Invalid JSON: {err}"}, status_code=400)

        updated_gs = await store.async_update_global_settings(body)

        # Refresh coordinators so they pick up any updated global LLM defaults
        for coord in hass.data.get(DOMAIN, {}).values():
            if isinstance(coord, RoomPresenceCoordinator):
                coord._apply_config_fields(coord.config, preserve_state=True)

        return self.json({"status": "ok", "global_settings": updated_gs})


class PDDTranslateView(HomeAssistantView):
    """Translate between natural language and YAML/Designer configuration."""

    url = "/api/presence_detection_designer/translate"
    name = "api:presence_detection_designer:translate"
    requires_auth = True

    async def post(self, request: Any) -> Any:
        """Handle POST /api/presence_detection_designer/translate."""
        hass = request.app["hass"]
        store = await async_get_store(hass)
        try:
            body = await request.json()
        except Exception as err:  # noqa: BLE001
            return self.json({"error": f"Invalid JSON: {err}"}, status_code=400)

        entry_id = body.get("entry_id")
        room_name = body.get("room_name")
        raw_dir = str(body.get("direction", "auto"))
        if raw_dir in ("yaml_to_nl", "to_natural_language"):
            direction = "to_natural_language"
        elif raw_dir in ("nl_to_yaml", "to_yaml"):
            direction = "to_yaml"
        else:
            direction = "auto"
        description = body.get("description")
        yaml_config = body.get("yaml_config")
        use_llm = bool(body.get("use_llm", True))

        gs = store.global_settings
        verifier = LLMVerifier(
            hass=hass,
            provider_type=gs.get("llm_provider_type", LLMProviderType.VISION_API),
            agent_id=gs.get("llm_agent_id"),
            api_url=gs.get("llm_api_url"),
            api_key=gs.get("llm_api_key"),
            model=gs.get("llm_model"),
        )

        if entry_id and isinstance(
            hass.data.get(DOMAIN, {}).get(entry_id), RoomPresenceCoordinator
        ):
            coord: RoomPresenceCoordinator = hass.data[DOMAIN][entry_id]
            verifier = coord.verifier
            if not room_name:
                room_name = coord.room_name
            if not yaml_config and not description:
                yaml_config = coord.config

        _, all_entities = collect_ha_areas_and_entities(hass)
        room_tokens = (
            [t for t in str(room_name).lower().replace("'", "").split() if len(t) > 2]
            if room_name
            else []
        )
        candidates = [
            {"entity_id": e["entity_id"], "name": e["name"], "state": e["state"]}
            for e in all_entities
            if not room_tokens
            or any(tok in f"{e['entity_id']} {e['name']}".lower() for tok in room_tokens)
            or "ble_area" in e["entity_id"]
        ][:80]

        result = await verifier.async_translate_config(
            direction=direction,
            room_name=room_name,
            description=description,
            yaml_config=yaml_config,
            available_entities=candidates,
            use_llm=use_llm,
        )
        if "natural_language_explanation" in result and "natural_language" not in result:
            result["natural_language"] = result["natural_language_explanation"]
        if "designer_config" in result and "config" not in result:
            result["config"] = result["designer_config"]
        return self.json(result)


class PDDStatisticsView(HomeAssistantView):
    """Return historical occupancy statistics, time-series curve, and sensor swimlanes for a room."""

    url = "/api/presence_detection_designer/room/{entry_id}/statistics"
    name = "api:presence_detection_designer:room_statistics"
    requires_auth = True

    async def get(self, request: Any, entry_id: str) -> Any:
        """Handle GET /api/presence_detection_designer/room/{entry_id}/statistics."""
        hass = request.app["hass"]
        store = await async_get_store(hass)
        coordinator = hass.data.get(DOMAIN, {}).get(entry_id)

        if isinstance(coordinator, RoomPresenceCoordinator):
            config = dict(coordinator.config)
        else:
            stored = store.get_room(entry_id)
            if not stored:
                return self.json({"error": f"Room {entry_id} not found"}, status_code=404)
            config = stored

        query = getattr(request, "query", {}) or {}
        try:
            hours = float(query.get("hours", 6.0))
        except (ValueError, TypeError):
            hours = 6.0

        timelines, start_ts, end_ts = await async_fetch_room_history(
            hass=hass,
            entry_id=entry_id,
            config=config,
            hours=hours,
        )
        stats = simulate_config_on_timelines(
            raw_config=config,
            entity_timelines=timelines,
            start_ts=start_ts,
            end_ts=end_ts,
        )
        stats["entry_id"] = entry_id
        return self.json(stats)


class PDDReplayView(HomeAssistantView):
    """Run a historical What-If Replay comparing Baseline vs. Tuned Candidate configuration."""

    url = "/api/presence_detection_designer/room/{entry_id}/replay"
    name = "api:presence_detection_designer:room_replay"
    requires_auth = True

    async def post(self, request: Any, entry_id: str) -> Any:
        """Handle POST /api/presence_detection_designer/room/{entry_id}/replay."""
        hass = request.app["hass"]
        store = await async_get_store(hass)
        coordinator = hass.data.get(DOMAIN, {}).get(entry_id)

        if isinstance(coordinator, RoomPresenceCoordinator):
            baseline_cfg = dict(coordinator.config)
        else:
            stored = store.get_room(entry_id)
            if not stored:
                return self.json({"error": f"Room {entry_id} not found"}, status_code=404)
            baseline_cfg = stored

        try:
            body = await request.json()
        except Exception as err:  # noqa: BLE001
            return self.json({"error": f"Invalid JSON: {err}"}, status_code=400)

        try:
            hours = float(body.get("hours", 6.0))
        except (ValueError, TypeError):
            hours = 6.0

        raw_cand = (
            body.get("candidate_config")
            or body.get("yaml_config")
            or body.get("config")
            or baseline_cfg
        )
        cand_norm = parse_yaml_or_dict_to_config(raw_cand)
        merged_cand = {**baseline_cfg, **cand_norm}

        timelines, start_ts, end_ts = await async_fetch_room_history(
            hass=hass,
            entry_id=entry_id,
            config=baseline_cfg,
            hours=hours,
            extra_configs=[merged_cand],
        )
        comparison = simulate_replay_comparison(
            baseline_config=baseline_cfg,
            candidate_config=merged_cand,
            entity_timelines=timelines,
            start_ts=start_ts,
            end_ts=end_ts,
        )
        comparison["entry_id"] = entry_id
        return self.json(comparison)


def async_register_views(hass: Any) -> None:
    """Register all HTTP API views for Presence Detection Designer once."""
    if not hass or not hasattr(hass, "http") or not hasattr(hass.http, "register_view"):
        return
    for view_cls in (
        PDDOverviewView,
        PDDRoomConfigView,
        PDDRoomRollbackView,
        PDDRoomActionView,
        PDDPreviewBayesianView,
        PDDGlobalSettingsView,
        PDDTranslateView,
        PDDStatisticsView,
        PDDReplayView,
    ):
        hass.http.register_view(view_cls())
