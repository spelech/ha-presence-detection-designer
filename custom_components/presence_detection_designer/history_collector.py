"""Historical state collector and timeline normalizer from Home Assistant Recorder and PDDStore."""

from __future__ import annotations

import datetime
import logging
from dataclasses import dataclass
from typing import Any

from .bayesian_engine import (
    build_effective_observations,
    friendly_entity_label,
    resolve_observation_weights,
    solo_posterior_pct,
)
from .condition_evaluator import evaluate_condition
from .const import (
    CONF_BOUNDARY_ENTITIES,
    CONF_ROOM_NAME,
    CONF_SUSTAINING_CONDITIONS,
    CONF_TRIGGER_ENTITIES,
    OccupancyState,
)
from .coordinator import _safe_state_getter
from .state_machine import RoomPresenceStateMachine
from .store import async_get_store

_LOGGER = logging.getLogger(__name__)


@dataclass
class _SimStateObj:
    """Lightweight state object used during historical replay."""

    entity_id: str
    state: str
    attributes: dict[str, Any]


def collect_room_tracked_entities(config: dict[str, Any]) -> list[str]:
    """Return all unique entity IDs monitored by a room configuration."""
    seen: list[str] = []

    def _add(raw: Any) -> None:
        if not raw:
            return
        eid = str(raw.get("entity_id") if isinstance(raw, dict) else raw).strip()
        if eid and eid not in seen:
            seen.append(eid)

    for b in config.get(CONF_BOUNDARY_ENTITIES, []) or []:
        _add(b)
    for t in config.get(CONF_TRIGGER_ENTITIES, []) or []:
        _add(t)
    for c in config.get(CONF_SUSTAINING_CONDITIONS, []) or []:
        _add(c)
    for obs in build_effective_observations(config):
        _add(obs)

    if config.get("negative_space_enabled"):
        from .spatial_inference import (
            BLE_TRACKER_ENTITIES,
            BLIND_POCKET_DEFINITIONS,
            CAMERA_WHOLE_FRAME_ENTITY,
            ROOM_SHADE_ENTITIES,
            SUNLIT_STATIC_SUBZONES,
        )

        r_name = str(config.get(CONF_ROOM_NAME, ""))
        bp = BLIND_POCKET_DEFINITIONS.get(r_name)
        if bp:
            for e in bp.get("entry_entities", []):
                _add(e)
            for c_id in bp.get("excluding_cameras", []):
                _add(CAMERA_WHOLE_FRAME_ENTITY.get(c_id))
            for s_eid in bp.get("excluding_sensors", []):
                _add(s_eid)
        for sh_eid in ROOM_SHADE_ENTITIES.get(r_name, ()):
            _add(sh_eid)
        for sun_rule in SUNLIT_STATIC_SUBZONES.values():
            if sun_rule.get("room") == r_name:
                for corr_eid in sun_rule.get("corroborating_entities", ()):
                    _add(corr_eid)
        for wf_eid in CAMERA_WHOLE_FRAME_ENTITY.values():
            _add(wf_eid)
        for ble_eid in BLE_TRACKER_ENTITIES:
            _add(ble_eid)

    return seen


def _ts_to_iso(ts: float) -> str:
    """Format a UNIX timestamp as an ISO-8601 UTC string."""
    return datetime.datetime.fromtimestamp(ts, tz=datetime.UTC).isoformat()


async def async_fetch_room_history(
    hass: Any,
    entry_id: str,
    config: dict[str, Any],
    hours: float = 6.0,
    extra_configs: list[dict[str, Any]] | None = None,
) -> tuple[dict[str, list[dict[str, Any]]], float, float]:
    """Fetch chronological entity state transitions from HA Recorder and PDDStore timeline buffer."""
    now_dt = datetime.datetime.now(datetime.UTC)
    end_ts = now_dt.timestamp()
    clamped_hours = max(0.25, min(168.0, float(hours or 6.0)))
    start_ts = end_ts - (clamped_hours * 3600.0)
    start_dt = datetime.datetime.fromtimestamp(start_ts, tz=datetime.UTC)

    tracked_eids = collect_room_tracked_entities(config)
    for extra in extra_configs or []:
        for eid in collect_room_tracked_entities(extra):
            if eid not in tracked_eids:
                tracked_eids.append(eid)

    timelines: dict[str, list[dict[str, Any]]] = {eid: [] for eid in tracked_eids}
    shade_eids_set: set[str] = {
        eid for eid in tracked_eids if eid.startswith("cover.") and "garage" not in eid
    }
    non_shade_eids: list[str] = [eid for eid in tracked_eids if eid not in shade_eids_set]

    if hass and tracked_eids:
        try:
            from homeassistant.components.recorder import get_instance
            from homeassistant.components.recorder.history import get_significant_states

            if type(get_significant_states).__name__ != "MagicMock":
                rec_inst = get_instance(hass)
                hist_map: dict[str, list[Any]] = {}
                if non_shade_eids:
                    res_main = await rec_inst.async_add_executor_job(
                        get_significant_states,
                        hass,
                        start_dt,
                        now_dt,
                        non_shade_eids,
                        None,
                        True,
                        True,
                    )
                    if isinstance(res_main, dict):
                        hist_map.update(res_main)
                if shade_eids_set:
                    res_shades = await rec_inst.async_add_executor_job(
                        get_significant_states,
                        hass,
                        start_dt,
                        now_dt,
                        sorted(shade_eids_set),
                        None,
                        False,
                        False,
                    )
                    if isinstance(res_shades, dict):
                        hist_map.update(res_shades)

                for eid, states in hist_map.items():
                    if eid not in timelines:
                        continue
                    for st in states or []:
                        st_val = getattr(st, "state", None)
                        if not isinstance(st_val, str):
                            continue
                        lc = getattr(st, "last_changed", None) or getattr(st, "last_updated", None)
                        ts_val = lc.timestamp() if hasattr(lc, "timestamp") else start_ts
                        timelines[eid].append(
                            {
                                "ts": max(start_ts, min(end_ts, float(ts_val))),
                                "state": st_val,
                                "attributes": dict(getattr(st, "attributes", {}) or {}),
                            }
                        )
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Recorder query unavailable or skipped for %s: %s", entry_id, err)

    try:
        store = await async_get_store(hass)
        store_events = store.get_timeline_events(entry_id)
        for ev in store_events:
            ev_ts = float(ev.get("ts", 0.0))
            if ev_ts < start_ts or ev_ts > end_ts:
                continue
            ent_map = ev.get("entity_states") or {}
            if not isinstance(ent_map, dict):
                continue
            for eid, st_val in ent_map.items():
                if eid in timelines and isinstance(st_val, str):
                    timelines[eid].append(
                        {
                            "ts": ev_ts,
                            "state": st_val,
                            "attributes": {},
                        }
                    )
    except Exception as err:  # noqa: BLE001
        _LOGGER.debug("PDDStore timeline merge skipped for %s: %s", entry_id, err)

    for eid in tracked_eids:
        live_obj = _safe_state_getter(hass, eid) if hass else None
        live_state = str(live_obj.state) if live_obj is not None else "off"
        live_attrs = dict(getattr(live_obj, "attributes", {}) or {}) if live_obj else {}

        pts = sorted(timelines.get(eid) or [], key=lambda x: float(x["ts"]))
        cleaned: list[dict[str, Any]] = []
        if eid in shade_eids_set:
            prev_pos: Any = None
            prev_tilt: Any = None
            for idx, pt in enumerate(pts):
                ts_val = float(pt["ts"])
                st_str = str(pt["state"])
                attrs = pt.get("attributes") or live_attrs
                pos = attrs.get("current_position")
                tilt = attrs.get("current_tilt_position")
                is_mov = (
                    bool(attrs.get("is_moving"))
                    or (prev_pos is not None and pos is not None and pos != prev_pos)
                    or (prev_tilt is not None and tilt is not None and tilt != prev_tilt)
                )
                prev_pos = pos if pos is not None else prev_pos
                prev_tilt = tilt if tilt is not None else prev_tilt
                eff_state = "moving" if is_mov else st_str
                if not cleaned or cleaned[-1]["state"] != eff_state:
                    cleaned.append(
                        {
                            "ts": ts_val,
                            "state": eff_state,
                            "attributes": attrs,
                        }
                    )
                if eff_state == "moving":
                    next_ts = float(pts[idx + 1]["ts"]) if (idx + 1) < len(pts) else end_ts
                    settle_ts = min(end_ts, ts_val + 90.0)
                    if settle_ts < next_ts:
                        cleaned.append(
                            {
                                "ts": settle_ts,
                                "state": st_str if st_str != "moving" else "open",
                                "attributes": attrs,
                            }
                        )
        else:
            for pt in pts:
                if not cleaned or cleaned[-1]["state"] != pt["state"]:
                    cleaned.append(
                        {
                            "ts": float(pt["ts"]),
                            "state": str(pt["state"]),
                            "attributes": pt.get("attributes") or live_attrs,
                        }
                    )

        if not cleaned:
            cleaned = [
                {
                    "ts": start_ts,
                    "state": live_state,
                    "attributes": live_attrs,
                }
            ]
        elif cleaned[0]["ts"] > start_ts:
            cleaned.insert(
                0,
                {
                    "ts": start_ts,
                    "state": cleaned[0]["state"],
                    "attributes": cleaned[0].get("attributes") or live_attrs,
                },
            )

        timelines[eid] = cleaned

    return timelines, start_ts, end_ts


def _advance_state_machine_over_interval(
    sm: RoomPresenceStateMachine,
    dt_seconds: float,
) -> list[tuple[float, str]]:
    """Advance RoomPresenceStateMachine over dt_seconds, returning intermediate (offset_sec, action) transitions."""
    remaining = max(0.0, float(dt_seconds))
    if remaining <= 0.0:
        return []

    transitions: list[tuple[float, str]] = []
    elapsed = 0.0
    while remaining > 1e-6:
        if (
            sm.state
            in (
                OccupancyState.OCCUPIED_HOLDING,
                OccupancyState.OCCUPIED_COOLING,
                OccupancyState.OCCUPIED_VERIFYING,
            )
            and sm._deadline_ts is not None
        ):
            rem_deadline = max(0.001, sm._deadline_ts - sm._now())
            step = min(remaining, rem_deadline)
        else:
            step = remaining

        action = sm.advance_time(step)
        elapsed += step
        remaining -= step

        if action == "HOLD_EXPIRED":
            transitions.append((float(elapsed), "HOLD_EXPIRED"))
            continue
        if action == "REQUEST_LLM_VERIFY":
            sm.handle_llm_result(False, "Deterministic replay timeout expired")
            transitions.append((float(elapsed), "VACATED"))
            break
        if action == "VACATED":
            transitions.append((float(elapsed), "VACATED"))
            break

    return transitions


def _build_sensor_swimlanes(
    observations: list[dict[str, Any]],
    boundaries: list[str],
    entity_timelines: dict[str, list[dict[str, Any]]],
    series: list[dict[str, Any]],
    start_ts: float,
    end_ts: float,
    window_sec: float,
    prior: float,
    threshold: float,
) -> list[dict[str, Any]]:
    """Build synchronized sensor and boundary door swimlanes for the statistics/replay chart."""
    swimlanes: list[dict[str, Any]] = []
    for obs in observations:
        eid = str(obs.get("entity_id", ""))
        if not eid:
            continue
        preset_name, pt, pf = resolve_observation_weights(obs)
        solo_pct = solo_posterior_pct(prior, pt, pf)
        label = friendly_entity_label(obs)

        pts = entity_timelines.get(eid) or []
        segments: list[dict[str, Any]] = []
        active_dur_sec = 0.0
        activation_count = 0
        corroborated_count = 0
        deflected_count = 0

        for j in range(len(pts)):
            seg_start = max(start_ts, float(pts[j]["ts"]))
            seg_end = min(end_ts, float(pts[j + 1]["ts"])) if (j + 1) < len(pts) else end_ts
            if seg_end <= seg_start:
                continue
            st_val = str(pts[j].get("state", "off"))
            attrs = pts[j].get("attributes") or {}
            is_match = evaluate_condition(obs, st_val, attrs)
            if is_match:
                dur = seg_end - seg_start
                active_dur_sec += dur
                activation_count += 1
                occ_at_start = any(
                    s["is_present"]
                    for s in series
                    if s["ts"] <= seg_start + 0.5
                    and (s["ts"] + s.get("duration_sec", 0.0)) >= seg_start
                )
                if occ_at_start or solo_pct >= round(threshold * 100.0, 1):
                    corroborated_count += 1
                else:
                    deflected_count += 1

                segments.append(
                    {
                        "start_ts": round(seg_start, 2),
                        "end_ts": round(seg_end, 2),
                        "start_iso": _ts_to_iso(seg_start),
                        "end_iso": _ts_to_iso(seg_end),
                        "start_pct": round(((seg_start - start_ts) / window_sec) * 100.0, 3),
                        "width_pct": max(
                            0.4, round(((seg_end - seg_start) / window_sec) * 100.0, 3)
                        ),
                        "state": st_val,
                    }
                )

        swimlanes.append(
            {
                "entity_id": eid,
                "label": label,
                "preset": preset_name,
                "prob_given_true": round(pt, 3),
                "prob_given_false": round(pf, 3),
                "solo_posterior_pct": solo_pct,
                "active_pct": round((active_dur_sec / window_sec) * 100.0, 1),
                "active_minutes": round(active_dur_sec / 60.0, 1),
                "activation_count": activation_count,
                "corroborated_count": corroborated_count,
                "deflected_count": deflected_count,
                "segments": segments,
            }
        )

    for b_eid in boundaries:
        pts = entity_timelines.get(b_eid) or []
        segments = []
        sealed_dur = 0.0
        close_count = 0
        for j in range(len(pts)):
            seg_start = max(start_ts, float(pts[j]["ts"]))
            seg_end = min(end_ts, float(pts[j + 1]["ts"])) if (j + 1) < len(pts) else end_ts
            if seg_end <= seg_start:
                continue
            st_val = str(pts[j].get("state", "off"))
            is_closed = st_val not in ("on", "open", "unavailable", "unknown")
            if is_closed:
                sealed_dur += seg_end - seg_start
                close_count += 1
                segments.append(
                    {
                        "start_ts": round(seg_start, 2),
                        "end_ts": round(seg_end, 2),
                        "start_iso": _ts_to_iso(seg_start),
                        "end_iso": _ts_to_iso(seg_end),
                        "start_pct": round(((seg_start - start_ts) / window_sec) * 100.0, 3),
                        "width_pct": max(
                            0.4, round(((seg_end - seg_start) / window_sec) * 100.0, 3)
                        ),
                        "state": "closed (holding)",
                    }
                )
        swimlanes.append(
            {
                "entity_id": b_eid,
                "label": f"{friendly_entity_label({'entity_id': b_eid})} (Boundary Door)",
                "preset": "door",
                "prob_given_true": 1.0,
                "prob_given_false": 1.0,
                "solo_posterior_pct": round(prior * 100.0, 1),
                "active_pct": round((sealed_dur / window_sec) * 100.0, 1),
                "active_minutes": round(sealed_dur / 60.0, 1),
                "activation_count": close_count,
                "corroborated_count": close_count,
                "deflected_count": 0,
                "segments": segments,
            }
        )

    return swimlanes
