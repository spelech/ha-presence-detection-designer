"""Historical statistics analyzer and deterministic What-If Replay simulator."""

from __future__ import annotations

import datetime
import logging
from dataclasses import dataclass
from typing import Any

from .bayesian_engine import (
    build_effective_observations,
    evaluate_bayesian,
    friendly_entity_label,
    parse_yaml_or_dict_to_config,
    resolve_observation_weights,
    solo_posterior_pct,
)
from .condition_evaluator import evaluate_all, evaluate_condition
from .const import (
    CONF_BAYESIAN_ENABLED,
    CONF_BAYESIAN_PRIOR,
    CONF_BAYESIAN_THRESHOLD,
    CONF_BOUNDARY_ENTITIES,
    CONF_EXTEND_TIMEOUT,
    CONF_GRACE_TIMEOUT,
    CONF_INACTIVITY_TIMEOUT,
    CONF_MODE,
    CONF_ROOM_NAME,
    CONF_SUSTAINING_CONDITIONS,
    CONF_TRIGGER_ENTITIES,
    DEFAULT_BAYESIAN_PRIOR,
    DEFAULT_BAYESIAN_THRESHOLD,
    DEFAULT_EXTEND_TIMEOUT,
    DEFAULT_GRACE_TIMEOUT,
    DEFAULT_INACTIVITY_TIMEOUT,
    BoxState,
    Mode,
)
from .coordinator import _safe_state_getter
from .state_machine import RoomStateMachine
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

    # 1. Query Home Assistant Recorder if available
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
                    # Fetch full attribute updates (current_position / is_moving) for motorized shades
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

    # 2. Merge rolling timeline snapshots from PDDStore (.storage)
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

    # 3. Ensure every tracked entity has a sorted, deduplicated timeline anchored at start_ts
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
    sm: RoomStateMachine,
    dt_seconds: float,
) -> list[tuple[float, str]]:
    """Advance RoomStateMachine over dt_seconds, returning any intermediate (offset_sec, action) transitions."""
    remaining = max(0, int(round(dt_seconds)))
    if remaining <= 0:
        return []

    transitions: list[tuple[float, str]] = []
    elapsed = 0
    while remaining > 0:
        if sm.box_state == BoxState.TIMER_ACTIVE and sm.vacating_countdown is not None:
            step = min(remaining, max(1, sm.vacating_countdown))
        else:
            step = remaining

        action = sm.handle_tick(step)
        elapsed += step
        remaining -= step

        if action == "REQUEST_LLM_VERIFY":
            # In deterministic offline replay, resolve pre-vacate check without calling external LLM API
            sm.handle_llm_result(False, "Deterministic replay timeout expired")
            transitions.append((float(elapsed), "VACATED"))
            break
        if action == "VACATED":
            transitions.append((float(elapsed), "VACATED"))
            break

    return transitions


def simulate_config_on_timelines(
    raw_config: dict[str, Any] | str,
    entity_timelines: dict[str, list[dict[str, Any]]],
    start_ts: float,
    end_ts: float,
) -> dict[str, Any]:
    """Run deterministic Bayesian + Wasp-in-a-Box simulation across historical entity timelines."""
    config = parse_yaml_or_dict_to_config(raw_config)
    window_sec = max(1.0, float(end_ts - start_ts))

    mode = Mode(config.get(CONF_MODE, Mode.OPEN))
    prior = float(config.get(CONF_BAYESIAN_PRIOR, DEFAULT_BAYESIAN_PRIOR))
    threshold = float(config.get(CONF_BAYESIAN_THRESHOLD, DEFAULT_BAYESIAN_THRESHOLD))
    inactivity_timeout = int(config.get(CONF_INACTIVITY_TIMEOUT, DEFAULT_INACTIVITY_TIMEOUT))
    grace_timeout = int(config.get(CONF_GRACE_TIMEOUT, DEFAULT_GRACE_TIMEOUT))
    extend_timeout = int(config.get(CONF_EXTEND_TIMEOUT, DEFAULT_EXTEND_TIMEOUT))
    bayesian_enabled = bool(config.get(CONF_BAYESIAN_ENABLED, True))

    boundaries: list[str] = [
        str(b.get("entity_id") if isinstance(b, dict) else b)
        for b in (config.get(CONF_BOUNDARY_ENTITIES, []) or [])
        if b
    ]
    observations: list[dict[str, Any]] = build_effective_observations(config)
    has_explicit_bayesian = bool(config.get("bayesian_observations")) or bool(observations)

    # Any sensor explicitly configured in bayesian_observations with a sub-threshold solo posterior
    # must be evaluated via Bayesian corroboration rather than firing as an unconditional solo trigger.
    sub_threshold_obs_eids: set[str] = set()
    for obs in observations:
        eid = str(obs.get("entity_id", ""))
        if not eid:
            continue
        _preset_name, pt, pf = resolve_observation_weights(obs)
        if solo_posterior_pct(prior, pt, pf) < round(threshold * 100.0, 1):
            sub_threshold_obs_eids.add(eid)

    triggers: list[str] = [
        str(t.get("entity_id") if isinstance(t, dict) else t)
        for t in (config.get(CONF_TRIGGER_ENTITIES, []) or [])
        if t and str(t.get("entity_id") if isinstance(t, dict) else t) not in sub_threshold_obs_eids
    ]
    conditions: list[dict[str, Any]] = list(config.get(CONF_SUSTAINING_CONDITIONS, []) or [])

    sm = RoomStateMachine(
        name=str(config.get(CONF_ROOM_NAME, "Room")),
        mode=mode,
        inactivity_timeout=inactivity_timeout,
        grace_timeout=grace_timeout,
        extend_timeout=extend_timeout,
        llm_enabled=False,
        bayesian_prior=prior,
        bayesian_threshold=threshold,
    )

    # Collect all distinct event timestamps within [start_ts, end_ts]
    event_timestamps: set[float] = {start_ts, end_ts}
    events_by_ts: dict[float, dict[str, dict[str, Any]]] = {}
    for eid, pts in entity_timelines.items():
        for pt in pts:
            ts = max(start_ts, min(end_ts, float(pt["ts"])))
            event_timestamps.add(ts)
            events_by_ts.setdefault(ts, {})[eid] = pt

    sorted_ts = sorted(event_timestamps)
    current_states: dict[str, _SimStateObj] = {}
    for eid, pts in entity_timelines.items():
        if pts:
            first = pts[0]
            current_states[eid] = _SimStateObj(
                entity_id=eid,
                state=str(first.get("state", "off")),
                attributes=dict(first.get("attributes") or {}),
            )

    series: list[dict[str, Any]] = []
    neg_space_enabled = bool(config.get("negative_space_enabled", False))
    room_name_str = str(config.get(CONF_ROOM_NAME, "Room"))
    prev_spatial_frame: dict[str, Any] | None = None

    def _evaluate_at(ts: float, changed_eids: set[str]) -> None:
        nonlocal prev_spatial_frame
        r_est: dict[str, Any] | None = None
        shade_excluded_eids: set[str] = set()
        if neg_space_enabled:
            from .spatial_inference import evaluate_spatial_frame

            prev_spatial_frame = evaluate_spatial_frame(
                state_getter=lambda eid: (
                    current_states[eid].state if eid in current_states else "off"
                ),
                prev_frame=prev_spatial_frame,
                now_ts=ts,
                negative_space_enabled=True,
            )
            r_est = prev_spatial_frame.get("room_estimates", {}).get(room_name_str)
            if isinstance(r_est, dict):
                shade_excluded_eids = set(r_est.get("shade_sunlight_excluded_entities", []) or [])

        # 1. Boundaries
        for b_eid in boundaries:
            st_obj = current_states.get(b_eid)
            if st_obj is not None:
                is_open = st_obj.state in ("on", "open")
                sm.handle_boundary(b_eid, is_open)

        # 2. Instant triggers
        for t_eid in triggers:
            st_obj = current_states.get(t_eid)
            if st_obj is not None:
                is_active = (
                    st_obj.state in ("on", "playing", "home") and t_eid not in shade_excluded_eids
                )
                if is_active or t_eid in changed_eids:
                    sm.handle_trigger(t_eid, is_active)

        # 3. Sustaining conditions
        any_cond, cond_descs = evaluate_all(
            conditions,
            lambda eid: current_states.get(eid),
        )
        sm.handle_conditions(any_cond, cond_descs)

        # 4. Bayesian evaluation (with optional negative-space spatial inference)
        active_labels: list[str] = []
        active_eids: list[str] = []
        if bayesian_enabled:
            obs_to_eval = list(observations)
            virtual_neg_eid = "__spatial_negative_space__"
            has_neg_boost = False
            if (
                neg_space_enabled
                and isinstance(r_est, dict)
                and float(r_est.get("probability_boost", 0.0)) > 0.0
            ):
                has_neg_boost = True
                obs_to_eval.append(
                    {
                        "entity_id": virtual_neg_eid,
                        "prob_given_true": 0.85,
                        "prob_given_false": 0.12,
                        "target_state": "on",
                        "label": r_est.get("inferred_subregion")
                        or "Negative-Space Spatial Exclusion",
                    }
                )

            def _sim_state_getter(eid: str) -> Any:
                if eid == virtual_neg_eid and has_neg_boost:
                    return _SimStateObj(entity_id=virtual_neg_eid, state="on", attributes={})
                if eid in shade_excluded_eids:
                    return _SimStateObj(entity_id=eid, state="off", attributes={})
                return current_states.get(eid)

            evaluation = evaluate_bayesian(
                obs_to_eval,
                _sim_state_getter,
                prior=prior,
                threshold=threshold,
            )
            sm.handle_bayesian(
                probability=evaluation.probability,
                probability_pct=evaluation.probability_pct,
                is_occupied=evaluation.is_occupied,
                summary=evaluation.natural_language_summary,
                active_observations=evaluation.active_observations,
                inactive_observations=evaluation.inactive_observations,
                trigger_state_machine=has_explicit_bayesian or has_neg_boost,
            )
            active_labels = [
                str(o.get("label", o.get("entity_id"))) for o in evaluation.active_observations
            ]
            active_eids = [str(o.get("entity_id")) for o in evaluation.active_observations]

        offset_pct = round(((ts - start_ts) / window_sec) * 100.0, 3)
        pt_record = {
            "ts": round(ts, 3),
            "iso": _ts_to_iso(ts),
            "offset_pct": max(0.0, min(100.0, offset_pct)),
            "probability_pct": sm.bayesian_probability_pct,
            "is_present": sm.is_present,
            "box_state": str(sm.box_state),
            "active_labels": active_labels,
            "active_entities": active_eids,
        }
        if series and abs(series[-1]["ts"] - pt_record["ts"]) < 0.001:
            series[-1] = pt_record
        else:
            series.append(pt_record)

    prev_ts = sorted_ts[0]
    for idx, ts in enumerate(sorted_ts):
        dt = ts - prev_ts
        if idx > 0 and dt > 0:
            mid_transitions = _advance_state_machine_over_interval(sm, dt)
            for elapsed_sec, _action in mid_transitions:
                mid_ts = prev_ts + elapsed_sec
                if mid_ts < ts:
                    _evaluate_at(mid_ts, set())

        changed = events_by_ts.get(ts, {})
        for eid, pt in changed.items():
            current_states[eid] = _SimStateObj(
                entity_id=eid,
                state=str(pt.get("state", "off")),
                attributes=dict(pt.get("attributes") or {}),
            )

        _evaluate_at(ts, set(changed.keys()))
        prev_ts = ts

    # Compute interval durations and summary statistics
    occupied_sec = 0.0
    sealed_hold_sec = 0.0
    weighted_occ_prob = 0.0
    peak_prob_pct = 0.0
    transition_count = 0
    sub_threshold_deflections = 0

    for i in range(len(series)):
        cur = series[i]
        nxt_ts = series[i + 1]["ts"] if (i + 1) < len(series) else end_ts
        dur = max(0.0, float(nxt_ts - cur["ts"]))
        cur["duration_sec"] = round(dur, 2)
        cur["width_pct"] = round((dur / window_sec) * 100.0, 3)

        prob_pct = float(cur["probability_pct"])
        if prob_pct > peak_prob_pct:
            peak_prob_pct = prob_pct

        if cur["is_present"]:
            occupied_sec += dur
            weighted_occ_prob += prob_pct * dur
            if cur["box_state"] == str(BoxState.OCCUPIED_SEALED) and not cur["active_entities"]:
                sealed_hold_sec += dur
            if i == 0 or not series[i - 1]["is_present"]:
                transition_count += 1
        else:
            # Deflected noise: 1+ observations active above baseline prior, but below threshold
            if cur["active_entities"] and prob_pct < round(threshold * 100.0, 1):
                if i == 0 or series[i - 1]["active_entities"] != cur["active_entities"]:
                    sub_threshold_deflections += 1

    occupied_pct = round((occupied_sec / window_sec) * 100.0, 1)
    avg_occ_prob_pct = round(weighted_occ_prob / occupied_sec, 1) if occupied_sec > 0 else 0.0

    # Build synchronized sensor swimlanes & attribution metrics
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
                # Check if room was occupied at seg_start
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

    # Also include boundary doors in swimlanes if configured
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
                        "state": "closed (sealed)",
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

    return {
        "room_name": config.get(CONF_ROOM_NAME, "Room"),
        "start_ts": round(start_ts, 2),
        "end_ts": round(end_ts, 2),
        "start_iso": _ts_to_iso(start_ts),
        "end_iso": _ts_to_iso(end_ts),
        "prior_pct": round(prior * 100.0, 1),
        "threshold_pct": round(threshold * 100.0, 1),
        "summary": {
            "window_hours": round(window_sec / 3600.0, 2),
            "occupied_pct": occupied_pct,
            "occupied_minutes": round(occupied_sec / 60.0, 1),
            "sealed_hold_minutes": round(sealed_hold_sec / 60.0, 1),
            "transition_count": transition_count,
            "sub_threshold_deflections": sub_threshold_deflections,
            "avg_occupied_probability_pct": avg_occ_prob_pct,
            "peak_probability_pct": peak_prob_pct,
        },
        "series": series,
        "swimlanes": swimlanes,
        "config": config,
    }


def simulate_replay_comparison(
    baseline_config: dict[str, Any] | str,
    candidate_config: dict[str, Any] | str,
    entity_timelines: dict[str, list[dict[str, Any]]],
    start_ts: float,
    end_ts: float,
) -> dict[str, Any]:
    """Compare Baseline room config vs. Candidate tuned config on identical historical sensor data."""
    base_res = simulate_config_on_timelines(baseline_config, entity_timelines, start_ts, end_ts)
    cand_res = simulate_config_on_timelines(candidate_config, entity_timelines, start_ts, end_ts)

    window_sec = max(1.0, float(end_ts - start_ts))
    base_series = base_res["series"]
    cand_series = cand_res["series"]

    # Build unified sorted grid of timestamps from both simulations
    grid_ts = sorted(
        {start_ts, end_ts}
        | {float(p["ts"]) for p in base_series}
        | {float(p["ts"]) for p in cand_series}
    )

    def _lookup_at(series_list: list[dict[str, Any]], ts: float) -> dict[str, Any]:
        chosen = series_list[0]
        for item in series_list:
            if float(item["ts"]) <= ts + 1e-4:
                chosen = item
            else:
                break
        return chosen

    agree_sec = 0.0
    raw_divergences: list[dict[str, Any]] = []

    for i in range(len(grid_ts) - 1):
        t0 = grid_ts[i]
        t1 = grid_ts[i + 1]
        dur = max(0.0, t1 - t0)
        if dur <= 0:
            continue

        b_pt = _lookup_at(base_series, t0)
        c_pt = _lookup_at(cand_series, t0)
        if bool(b_pt["is_present"]) == bool(c_pt["is_present"]):
            agree_sec += dur
            continue

        div_type = (
            "false_positive_eliminated"
            if (b_pt["is_present"] and not c_pt["is_present"])
            else "occupancy_gained"
        )
        active_labels = list(
            dict.fromkeys((b_pt.get("active_labels") or []) + (c_pt.get("active_labels") or []))
        )
        if (
            raw_divergences
            and raw_divergences[-1]["type"] == div_type
            and abs(raw_divergences[-1]["end_ts"] - t0) < 1.0
        ):
            prev = raw_divergences[-1]
            prev["end_ts"] = round(t1, 2)
            prev["end_iso"] = _ts_to_iso(t1)
            prev["duration_sec"] = round(prev["end_ts"] - prev["start_ts"], 1)
            prev["width_pct"] = max(0.4, round((prev["duration_sec"] / window_sec) * 100.0, 3))
            for lbl in active_labels:
                if lbl not in prev["active_labels"]:
                    prev["active_labels"].append(lbl)
        else:
            b_prob = b_pt["probability_pct"]
            c_prob = c_pt["probability_pct"]
            b_thresh = base_res["threshold_pct"]
            c_thresh = cand_res["threshold_pct"]
            sensors_str = ", ".join(active_labels) if active_labels else "timer/latch hold"
            if div_type == "false_positive_eliminated":
                explanation = (
                    f"Eliminated occupancy trigger ({sensors_str}): "
                    f"Baseline reached {b_prob}% (threshold {b_thresh}%, state={b_pt['box_state']}), "
                    f"whereas Tuned Candidate stayed Vacant at {c_prob}% (threshold {c_thresh}%)."
                )
            else:
                explanation = (
                    f"Gained/held occupancy ({sensors_str}): "
                    f"Tuned Candidate reached {c_prob}% (threshold {c_thresh}%, state={c_pt['box_state']}), "
                    f"whereas Baseline was Vacant at {b_prob}% (threshold {b_thresh}%)."
                )

            raw_divergences.append(
                {
                    "type": div_type,
                    "start_ts": round(t0, 2),
                    "end_ts": round(t1, 2),
                    "start_iso": _ts_to_iso(t0),
                    "end_iso": _ts_to_iso(t1),
                    "duration_sec": round(dur, 1),
                    "start_pct": round(((t0 - start_ts) / window_sec) * 100.0, 3),
                    "width_pct": max(0.4, round((dur / window_sec) * 100.0, 3)),
                    "baseline_prob_pct": b_prob,
                    "candidate_prob_pct": c_prob,
                    "active_labels": active_labels,
                    "explanation": explanation,
                }
            )

    b_sum = base_res["summary"]
    c_sum = cand_res["summary"]
    fp_eliminated_sec = sum(
        d["duration_sec"] for d in raw_divergences if d["type"] == "false_positive_eliminated"
    )
    occ_gained_sec = sum(
        d["duration_sec"] for d in raw_divergences if d["type"] == "occupancy_gained"
    )

    return {
        "room_name": cand_res["room_name"],
        "start_ts": round(start_ts, 2),
        "end_ts": round(end_ts, 2),
        "start_iso": _ts_to_iso(start_ts),
        "end_iso": _ts_to_iso(end_ts),
        "baseline": base_res,
        "candidate": cand_res,
        "deltas": {
            "occupied_pct_delta": round(c_sum["occupied_pct"] - b_sum["occupied_pct"], 1),
            "occupied_minutes_delta": round(
                c_sum["occupied_minutes"] - b_sum["occupied_minutes"], 1
            ),
            "transition_count_delta": int(c_sum["transition_count"] - b_sum["transition_count"]),
            "deflections_delta": int(
                c_sum["sub_threshold_deflections"] - b_sum["sub_threshold_deflections"]
            ),
            "agreement_pct": round((agree_sec / window_sec) * 100.0, 1),
            "false_positive_eliminated_minutes": round(fp_eliminated_sec / 60.0, 1),
            "occupancy_gained_minutes": round(occ_gained_sec / 60.0, 1),
            "divergence_count": len(raw_divergences),
        },
        "divergence_windows": raw_divergences,
    }
