"""Authenticated HTTP API views for the Presence Detection Designer Visual Studio panel."""

from __future__ import annotations

import logging
import time
from typing import Any

from .bayesian_engine import (
    build_effective_observations,
    config_to_yaml_representations,
    evaluate_bayesian,
    explain_config_in_natural_language,
    parse_yaml_or_dict_to_config,
)
from .const import (
    CONF_BAYESIAN_OBSERVATIONS,
    CONF_BAYESIAN_PRIOR,
    CONF_BAYESIAN_THRESHOLD,
    DEFAULT_BAYESIAN_PRIOR,
    DEFAULT_BAYESIAN_THRESHOLD,
    DOMAIN,
    LLMProviderType,
)
from .coordinator import RoomPresenceCoordinator, _safe_state_getter
from .llm_verifier import LLMVerifier
from .spatial_inference import evaluate_spatial_frame
from .spatial_topology import compile_floorplan_topology
from .store import async_get_store
from .view_serializers import (
    HomeAssistantView,
    async_apply_and_persist_room_config,
    build_combinatorics_preview,
    build_presets_metadata,
    collect_ha_areas_and_entities,
    serialize_room_coordinator,
)
from .views_analytics import (
    PDDReplayView,
    PDDStatisticsView,
    PDDTimelineReconstructionView,
)
from .views_spatial import (
    PDDCameraAlignView,
    PDDFloorplanView,
    PDDNotificationTestView,
)

__all__ = [
    "HomeAssistantView",
    "PDDCameraAlignView",
    "PDDFloorplanView",
    "PDDGlobalSettingsView",
    "PDDNotificationTestView",
    "PDDOverviewView",
    "PDDPreviewBayesianView",
    "PDDReplayView",
    "PDDRoomActionView",
    "PDDRoomConfigView",
    "PDDRoomRollbackView",
    "PDDStateGraphView",
    "PDDStatisticsView",
    "PDDTimelineReconstructionView",
    "PDDTranslateView",
    "async_apply_and_persist_room_config",
    "async_register_views",
    "build_combinatorics_preview",
    "build_presets_metadata",
    "collect_ha_areas_and_entities",
    "serialize_room_coordinator",
]

_LOGGER = logging.getLogger(__name__)


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
        floorplan = store.get_floorplan()
        compiled_topology = compile_floorplan_topology(floorplan)
        guest_mode_enabled = bool(store.global_settings.get("guest_mode_enabled", False))
        neg_space_enabled = (
            bool(store.global_settings.get("negative_space_enabled", True))
            and not guest_mode_enabled
        )
        ble_decider_enabled = bool(store.global_settings.get("ble_decider_enabled", False))

        def _live_state_str(eid: str) -> str:
            st = _safe_state_getter(hass, eid)
            return str(st.state) if st is not None else "off"

        spatial_inference = evaluate_spatial_frame(
            floorplan=floorplan,
            compiled_topology=compiled_topology,
            state_getter=_live_state_str,
            now_ts=time.time(),
            negative_space_enabled=neg_space_enabled,
            guest_mode_enabled=guest_mode_enabled,
            ble_decider_enabled=ble_decider_enabled,
        )

        return self.json(
            {
                "rooms": rooms_payload,
                "global_settings": store.global_settings,
                "areas": areas,
                "entities": entities,
                "presets": build_presets_metadata(),
                "floorplan": floorplan,
                "compiled_topology": compiled_topology,
                "spatial_inference": spatial_inference,
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


class PDDStateGraphView(HomeAssistantView):
    """Return live transitions Mermaid diagram, active state, and audit feed per room."""

    url = "/api/presence_detection_designer/state_graph"
    name = "api:presence_detection_designer:state_graph"
    requires_auth = True

    async def get(self, request: Any) -> Any:
        """Handle GET /api/presence_detection_designer/state_graph."""
        hass = request.app["hass"]
        entry_filter = None
        if hasattr(request, "query") and request.query:
            entry_filter = request.query.get("entry_id")

        rooms: list[dict[str, Any]] = []
        for eid, coord in hass.data.get(DOMAIN, {}).items():
            if not isinstance(coord, RoomPresenceCoordinator):
                continue
            if entry_filter and eid != entry_filter:
                continue
            sm = coord.state_machine
            rooms.append(
                {
                    "entry_id": coord.entry_id,
                    "room_name": coord.room_name,
                    "occupancy_state": str(sm.state),
                    "is_present": sm.is_present,
                    "is_cooling_down": sm.is_cooling_down,
                    "cooling_remaining_sec": sm.cooling_remaining_sec,
                    "state_reason": sm.state_reason,
                    "verified_by": sm.verified_by,
                    "override": sm.override,
                    "mermaid_diagram": sm.get_mermaid_diagram(),
                    "transition_history": sm.transition_history,
                }
            )
        rooms.sort(key=lambda r: str(r.get("room_name", "")).lower())
        return self.json({"rooms": rooms})


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
        PDDStateGraphView,
        PDDStatisticsView,
        PDDReplayView,
        PDDFloorplanView,
        PDDCameraAlignView,
        PDDNotificationTestView,
        PDDTimelineReconstructionView,
    ):
        hass.http.register_view(view_cls())
