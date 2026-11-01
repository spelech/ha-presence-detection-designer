"""HTTP API views for historical statistics, What-If Replay, and whole-house timeline reconstruction."""

from __future__ import annotations

from typing import Any

from .bayesian_engine import parse_yaml_or_dict_to_config
from .const import DOMAIN
from .coordinator import RoomPresenceCoordinator
from .replay_engine import (
    async_fetch_room_history,
    simulate_config_on_timelines,
    simulate_replay_comparison,
)
from .spatial_inference import (
    ALL_SHADE_ENTITIES,
    BLE_TRACKER_ENTITIES,
    CAMERA_WHOLE_FRAME_ENTITY,
    SUNLIT_STATIC_SUBZONES,
    reconstruct_house_timeline,
)
from .store import async_get_store
from .view_serializers import HomeAssistantView


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
        if "negative_space" in body:
            merged_cand["negative_space_enabled"] = bool(body["negative_space"])
        if "baseline_negative_space" in body:
            baseline_cfg = {
                **baseline_cfg,
                "negative_space_enabled": bool(body["baseline_negative_space"]),
            }

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


class PDDTimelineReconstructionView(HomeAssistantView):
    """Reconstruct a chronological whole-house spatial timeline across all floorplan sensors and cameras."""

    url = "/api/presence_detection_designer/timeline_reconstruction"
    name = "api:presence_detection_designer:timeline_reconstruction"
    requires_auth = True

    async def get(self, request: Any) -> Any:
        """Handle GET /api/presence_detection_designer/timeline_reconstruction?hours=6&negative_space=true."""
        hass = request.app["hass"]
        store = await async_get_store(hass)
        fp = store.get_floorplan()

        query = getattr(request, "query", {}) or {}
        try:
            hours = float(query.get("hours", 6.0))
        except (ValueError, TypeError):
            hours = 6.0

        raw_ns = query.get("negative_space")
        if raw_ns is None:
            neg_space_enabled = bool(store.global_settings.get("negative_space_enabled", True))
        else:
            neg_space_enabled = str(raw_ns).strip().lower() not in ("false", "0", "no", "off")

        house_entities: list[str] = (
            list(CAMERA_WHOLE_FRAME_ENTITY.values())
            + list(BLE_TRACKER_ENTITIES)
            + list(ALL_SHADE_ENTITIES)
        )
        for sun_rule in SUNLIT_STATIC_SUBZONES.values():
            for corr_eid in sun_rule.get("corroborating_entities", ()):
                if corr_eid and corr_eid not in house_entities:
                    house_entities.append(corr_eid)
        for cam in fp.get("cameras", []) or []:
            for sz in cam.get("sub_zones", []) or []:
                eid = str(sz.get("entity_id", ""))
                if eid and eid not in house_entities:
                    house_entities.append(eid)
        for sensor in fp.get("sensors", []) or []:
            eid = str(sensor.get("entity_id", ""))
            if eid and eid not in house_entities:
                house_entities.append(eid)

        room_configs: dict[str, dict[str, Any]] = {}
        extra_cfgs: list[dict[str, Any]] = []
        domain_data = hass.data.get(DOMAIN, {}) if hasattr(hass, "data") else {}
        for eid, coord in domain_data.items():
            if isinstance(coord, RoomPresenceCoordinator):
                room_configs[eid] = dict(coord.config)
                extra_cfgs.append(coord.config)
        for eid, scfg in store.rooms.items():
            if eid not in room_configs:
                room_configs[eid] = dict(scfg)
                extra_cfgs.append(scfg)

        synthetic_cfg = {"trigger_entities": house_entities}
        raw_timelines, start_ts, end_ts = await async_fetch_room_history(
            hass=hass,
            entry_id="house_timeline",
            config=synthetic_cfg,
            hours=hours,
            extra_configs=extra_cfgs,
        )

        tuple_timelines: dict[str, list[tuple[float, str]]] = {}
        for eid, pts in raw_timelines.items():
            tuple_timelines[eid] = [
                (float(pt["ts"]), str(pt.get("state", "off"))) for pt in (pts or [])
            ]

        for r_eid in room_configs:
            for ev in store.get_timeline_events(r_eid):
                ev_ts = float(ev.get("ts", 0.0))
                if start_ts <= ev_ts <= end_ts:
                    ent_map = ev.get("entity_states") or {}
                    if isinstance(ent_map, dict):
                        for s_eid, s_val in ent_map.items():
                            tuple_timelines.setdefault(str(s_eid), []).append((ev_ts, str(s_val)))

        result = reconstruct_house_timeline(
            floorplan=fp,
            room_configs=room_configs,
            entity_timelines=tuple_timelines,
            start_ts=start_ts,
            end_ts=end_ts,
            negative_space_enabled=neg_space_enabled,
        )
        return self.json(result)
