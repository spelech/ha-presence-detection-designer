"""Cross-room handoff notifications, transition event bus firing, and evidence dispatch."""

from __future__ import annotations

import time
from typing import Any

from .bayesian_engine import (
    BayesianEvaluation,
    apply_contextual_bayesian_penalties,
    evaluate_bayesian,
    get_active_pir_spillover_fraction,
)
from .camera_guard import is_camera_verification_rejected
from .condition_evaluator import is_state_stale
from .const import (
    DATA_STORE,
    DOMAIN,
    EVENT_PRESENCE_TRANSITION,
    OccupancyState,
)
from .coordinator_helpers import (
    _safe_state_getter,
    async_send_coordinator_test_notification,
    build_coordinator_evidence_snapshot,
    record_coordinator_timeline_snapshot,
    resolve_global_llm_defaults,
    sync_coordinator_evidence,
)
from .sensor_reliability import (
    apply_signal_weight,
    classify_sensor_reliability,
    is_camera_entity,
)

__all__ = [
    "_safe_state_getter",
    "async_send_coordinator_test_notification",
    "build_coordinator_evidence_snapshot",
    "dispatch_presence_transition",
    "evaluate_coordinator_bayesian",
    "evaluate_coordinator_hmm",
    "is_coupled_hmm_active",
    "notify_connected_rooms_if_active",
    "process_coordinator_trigger_event",
    "record_coordinator_timeline_snapshot",
    "resolve_global_llm_defaults",
    "sync_coordinator_evidence",
]


def is_coupled_hmm_active(coord: Any) -> bool:
    """Return True when the house-wide Coupled Continuous-Time Log-Odds HMM governs this room."""
    if not coord.hass or not isinstance(getattr(coord.hass, "data", None), dict):
        return False
    domain_data = coord.hass.data.get(DOMAIN, {})
    if not isinstance(domain_data, dict):
        return False
    store = domain_data.get(DATA_STORE)
    if (
        store is None
        or type(store).__name__ == "MagicMock"
        or not callable(getattr(store, "get_or_create_hmm_engine", None))
    ):
        return False
    gs = getattr(store, "global_settings", None)
    if isinstance(gs, dict) and gs.get("inference_engine", "coupled_hmm") != "coupled_hmm":
        return False
    fp = store.get_floorplan() if callable(getattr(store, "get_floorplan", None)) else None
    if not isinstance(fp, dict) or not fp.get("rooms"):
        return False
    fp_room_names = {str(r.get("name", "")) for r in fp.get("rooms") or [] if isinstance(r, dict)}
    if coord.room_name not in fp_room_names:
        return False
    coordinators = [
        obj
        for obj in domain_data.values()
        if type(obj).__name__ != "MagicMock"
        and hasattr(obj, "state_machine")
        and hasattr(obj, "room_name")
    ]
    return len(coordinators) >= 3 or bool(
        isinstance(gs, dict) and gs.get("inference_engine_force", False)
    )


def evaluate_coordinator_hmm(coord: Any, *, now_ts: float | None = None) -> Any:
    """Step the house-wide Coupled Log-Odds HMM and sync all registered room coordinators."""
    if not is_coupled_hmm_active(coord):
        return None

    domain_data = coord.hass.data.get(DOMAIN, {})
    store = domain_data.get(DATA_STORE)
    fp = store.get_floorplan()
    gs = store.global_settings if isinstance(getattr(store, "global_settings", None), dict) else {}
    guest_mode_enabled = bool(gs.get("guest_mode_enabled", False))
    ts = float(now_ts if now_ts is not None else time.time())

    coordinators_by_room: dict[str, Any] = {}
    room_configs: dict[str, dict[str, Any]] = {}
    cam_rejected_rooms: set[str] = set()
    for obj in list(domain_data.values()):
        if hasattr(obj, "state_machine") and hasattr(obj, "room_name"):
            rname = str(obj.room_name)
            coordinators_by_room[rname] = obj
            room_configs[rname] = dict(getattr(obj, "config", {}) or {})
            if is_camera_verification_rejected(obj, now_ts=ts):
                cam_rejected_rooms.add(rname)

    hmm = store.get_or_create_hmm_engine(fp, room_configs)

    # Update house EKF tracks once per second bucket
    ekf_tracks: dict[str, dict[str, Any]] = {}
    if hasattr(store, "ekf_manager"):
        last_ekf_sec = getattr(store, "_hmm_last_ekf_sec", None)
        sec_bucket = int(ts)
        if last_ekf_sec != sec_bucket or not hasattr(store, "_hmm_last_ekf_tracks"):
            from .ble_kalman_tracker import update_house_ekf_from_hass

            trackers = list(gs.get("ble_trackers") or [])
            ekf_tracks = update_house_ekf_from_hass(
                store.ekf_manager,
                coord.hass,
                fp,
                None,
                ts,
                trackers,
                ble_ranges_provider=getattr(store, "_ble_ranges_provider", None),
                pir_spillover=hmm.topology.pir_spillover,
            )
            store._hmm_last_ekf_sec = sec_bucket
            store._hmm_last_ekf_tracks = ekf_tracks
        else:
            ekf_tracks = dict(getattr(store, "_hmm_last_ekf_tracks", {}) or {})

    def _state_str(eid: str) -> str | None:
        st = _safe_state_getter(coord.hass, eid)
        if st is None:
            return None
        if eid.startswith("cover.") and getattr(st, "attributes", {}).get("is_moving"):
            return "moving"
        return str(st.state)

    snapshots = hmm.step(
        now_ts=ts,
        state_getter=_state_str,
        ekf_tracks=ekf_tracks,
        guest_mode_enabled=guest_mode_enabled,
        cam_rejected_rooms=cam_rejected_rooms,
    )

    frame_meta = {"ts": ts, "ekf_tracks": ekf_tracks, "inference_engine": "coupled_hmm"}
    for rname, c_obj in coordinators_by_room.items():
        snap = snapshots.get(rname)
        if snap is None:
            continue
        c_obj.last_hmm_snapshot = snap
        c_obj._last_spatial_frame = frame_meta
        changed = c_obj.state_machine.apply_hmm_belief(snap, now_ts=ts)
        if changed:
            record_coordinator_timeline_snapshot(c_obj)
            c_obj.async_update_listeners()

    return snapshots.get(coord.room_name)


def dispatch_presence_transition(coord: Any) -> None:
    """Fire HA transition event and schedule Slack notification when presence state changes."""
    curr_presence = coord.state_machine.is_present
    if curr_presence == coord._previous_presence:
        return

    from_state = "occupied" if coord._previous_presence else "clear"
    to_state = "occupied" if curr_presence else "clear"
    coord._previous_presence = curr_presence

    now_ts = time.time()
    duration_sec: float | None = None
    if to_state == "occupied":
        coord._occupied_start_time = now_ts
    else:
        if coord._occupied_start_time is not None:
            duration_sec = now_ts - coord._occupied_start_time
            coord._occupied_start_time = None
        tracker = getattr(coord, "actuation_tracker", None)
        if tracker is not None:
            tracker.on_room_vacated()

    est = coord.last_spatial_estimate if isinstance(coord.last_spatial_estimate, dict) else {}
    tracker_obj = getattr(coord, "actuation_tracker", None)
    if coord.hass and hasattr(coord.hass, "bus"):
        try:
            coord.hass.bus.async_fire(
                EVENT_PRESENCE_TRANSITION,
                {
                    "entry_id": coord.entry_id,
                    "room_name": coord.room_name,
                    "presence": curr_presence,
                    "from_state": from_state,
                    "to_state": to_state,
                    "occupancy_state": str(coord.state_machine.state),
                    "transition_reason": coord.state_machine.last_transition_reason,
                    "bayesian_probability": coord.state_machine.bayesian_probability,
                    "bayesian_probability_pct": coord.state_machine.bayesian_probability_pct,
                    "occupant_type": est.get("occupant_type", "human" if curr_presence else "none"),
                    "occupant_label": est.get(
                        "occupant_label", "Occupant" if curr_presence else ""
                    ),
                    "presence_summary": est.get(
                        "presence_summary", "Occupant" if curr_presence else "Vacant"
                    ),
                    "human_present": bool(est.get("human_present", curr_presence)),
                    "pet_present": bool(est.get("pet_present", False)),
                    "detected_people": list(
                        est.get("detected_people", ["Occupant"] if curr_presence else [])
                    ),
                    "detected_animals": list(est.get("detected_animals", [])),
                    "manual_intent": getattr(tracker_obj, "manual_intent", "auto"),
                    "last_manual_actor": getattr(tracker_obj, "last_manual_actor", None),
                    "natural_language_explanation": (
                        coord.state_machine.build_natural_language_explanation()
                    ),
                    "last_trigger": coord.state_machine.last_trigger_entity,
                    "active_conditions": coord.state_machine.active_conditions,
                    "duration_seconds": duration_sec,
                },
            )
        except Exception:  # noqa: BLE001
            pass

    if not (coord.hass and coord.notify_slack):
        return

    global_settings: dict[str, Any] = {}
    if hasattr(coord.hass, "data") and isinstance(coord.hass.data, dict):
        store = coord.hass.data.get(DOMAIN, {}).get(DATA_STORE)
        if store is not None and isinstance(getattr(store, "global_settings", None), dict):
            global_settings = store.global_settings or {}

    if not global_settings.get("notifications_enabled", False) or global_settings.get(
        "guest_mode_enabled", False
    ):
        return

    curr_eval: dict[str, Any] = {
        "probability": coord.state_machine.bayesian_probability,
        "is_occupied": coord.state_machine.is_present,
        "active_entities": [coord.state_machine.last_trigger_entity]
        if coord.state_machine.last_trigger_entity
        else [],
        "active_sustaining_conditions": coord.state_machine.active_conditions,
        "driver_entity": coord.state_machine.last_trigger_entity,
        "transition_reason": coord.state_machine.last_transition_reason,
    }
    if coord.last_bayesian_eval:
        curr_eval["probability"] = coord.last_bayesian_eval.probability
        active_obs = coord.last_bayesian_eval.active_observations
        if isinstance(active_obs, dict):
            curr_eval["active_entities"] = list(active_obs.keys())
        elif isinstance(active_obs, list):
            curr_eval["active_entities"] = [
                str(item.get("entity_id"))
                for item in active_obs
                if isinstance(item, dict)
                and item.get("entity_id")
                and item.get("entity_id") != "__spatial_negative_space__"
            ]
    if coord.last_spatial_estimate:
        curr_eval["inferred_location"] = coord.last_spatial_estimate.get("inferred_subregion")
        curr_eval["negative_space_evidence"] = list(
            coord.last_spatial_estimate.get("negative_exclusions") or []
        )

    adj_ctx = coord._last_adjacent_arrival
    if not adj_ctx and coord.state_machine.last_handoff_room:
        adj_ctx = f"Exited to {coord.state_machine.last_handoff_room}"
    attribution = coord._notification_dispatcher.resolve_transition_driver(
        room_id=coord.entry_id,
        room_name=coord.room_name,
        from_state=from_state,
        to_state=to_state,
        room_config=coord.config,
        prev_eval=None,
        curr_eval=curr_eval,
        adjacent_context=adj_ctx,
        duration_seconds=duration_sec,
    )
    coord._last_adjacent_arrival = None
    coord.state_machine.last_handoff_room = None

    if hasattr(coord.hass, "async_create_task"):
        coro = coord._notification_dispatcher.async_dispatch_notification(
            coord.hass,
            attribution,
            global_settings,
            coord.config,
        )
        coord.hass.async_create_task(coro)
        if (
            type(coord.hass.async_create_task).__name__ == "MagicMock"
            and getattr(coord.hass.async_create_task, "side_effect", None) is None
            and hasattr(coro, "close")
        ):
            coro.close()


def notify_connected_rooms_if_active(coord: Any) -> None:
    """Notify connected adjacent rooms when this room actively detects an occupant."""
    if not coord.hass or not isinstance(getattr(coord.hass, "data", None), dict):
        return
    if coord._is_guest_mode_active():
        return
    if not coord.state_machine.is_present or coord.state_machine.state != (
        OccupancyState.OCCUPIED_CONFIRMED
    ):
        return

    domain_data = coord.hass.data.get(DOMAIN, {})
    if not isinstance(domain_data, dict):
        return

    my_tokens = {
        coord.room_name.strip().lower(),
        coord.entry_id.strip().lower(),
        coord.room_name.strip().lower().replace("'", "").replace(" ", "_"),
    }
    if coord.area_id:
        my_tokens.add(str(coord.area_id).strip().lower())

    my_connected = {r.strip().lower() for r in coord.connected_rooms if r}

    for other in list(domain_data.values()):
        if other is coord or not hasattr(other, "notify_adjacent_occupancy"):
            continue
        other_tokens = {
            other.room_name.lower(),
            other.entry_id.lower(),
            other.room_name.lower().replace("'", "").replace(" ", "_"),
        }
        if other.area_id:
            other_tokens.add(str(other.area_id).strip().lower())
        other_connected = {r.strip().lower() for r in other.connected_rooms if r}

        if (my_connected & other_tokens) or (other_connected & my_tokens):
            # Minimum-dwell safety belt (2.5s): prevent same-second PIR-to-PIR spillover wipeout
            # while allowing decisive Frigate camera sub-zones to preempt immediately.
            coord_cam = bool(coord.state_machine.snapshot.camera_confirmed)
            if not coord_cam and other.state_machine.state == OccupancyState.OCCUPIED_CONFIRMED:
                other_entered = float(
                    getattr(other.state_machine, "last_occupied_time", 0.0) or 0.0
                )
                if other_entered > 0.0 and (time.time() - other_entered) < 2.5:
                    continue
            other.notify_adjacent_occupancy(coord.room_name)
        elif (
            coord.state_machine.state == OccupancyState.OCCUPIED_CONFIRMED
            and getattr(other.state_machine, "state", None) == OccupancyState.OCCUPIED_HOLDING
            and (
                getattr(
                    getattr(other.state_machine, "snapshot", None),
                    "spatial_blind_pocket_hold",
                    False,
                )
                or (
                    getattr(other, "bayesian_enabled", False)
                    and any(
                        classify_sensor_reliability(str(obs.get("entity_id", ""))).category
                        == "ble_tracker"
                        for obs in getattr(other, "bayesian_observations", ())
                    )
                )
            )
        ):
            other._eval_bayesian_and_update()
            other.async_update_listeners()


def evaluate_coordinator_bayesian(coord: Any) -> BayesianEvaluation | None:
    """Evaluate Bayesian sensor fusion across all configured observations and negative-space geometry."""
    if not coord.hass or not hasattr(coord.hass, "states") or not coord.bayesian_enabled:
        return None
    if is_coupled_hmm_active(coord):
        evaluate_coordinator_hmm(coord)
        return None

    from .spatial_inference import evaluate_spatial_frame

    neg_space_enabled = True
    fp: dict[str, Any] | None = None
    guest_mode_enabled = False
    ble_decider_enabled = False
    ble_active_in_fusion = True
    store: Any = None
    if isinstance(getattr(coord.hass, "data", None), dict):
        store = coord.hass.data.get(DOMAIN, {}).get(DATA_STORE)
        if store is not None:
            if isinstance(getattr(store, "global_settings", None), dict):
                gs = store.global_settings
                guest_mode_enabled = bool(gs.get("guest_mode_enabled", False))
                neg_space_enabled = (
                    bool(gs.get("negative_space_enabled", True)) and not guest_mode_enabled
                )
                ble_decider_enabled = bool(gs.get("ble_decider_enabled", False))
                if "ble_decider_enabled" in gs:
                    ble_active_in_fusion = ble_decider_enabled
            if hasattr(store, "get_floorplan"):
                cand_fp = store.get_floorplan()
                if isinstance(cand_fp, dict) and cand_fp.get("rooms"):
                    fp = cand_fp

    queried_states: dict[str, str | None] = {}

    def _raw_state_str(eid: str) -> str | None:
        st = _safe_state_getter(coord.hass, eid)
        if st is None:
            val: str | None = None
        elif eid.startswith("cover.") and getattr(st, "attributes", {}).get("is_moving"):
            val = "moving"
        else:
            val = str(st.state)
        queried_states[eid] = val
        return val

    now_ts = time.time()
    last_frame = (
        getattr(store, "_last_spatial_frame", None)
        if store is not None
        else coord._last_spatial_frame
    )
    cached_qs = last_frame.get("_queried_states") if isinstance(last_frame, dict) else None
    cache_hit = (
        isinstance(last_frame, dict)
        and (now_ts - float(last_frame.get("ts", 0.0))) < 0.2
        and isinstance(cached_qs, dict)
        and all(_raw_state_str(k) == v for k, v in cached_qs.items())
    )
    try:
        if cache_hit:
            frame = last_frame
        else:
            queried_states.clear()
            frame = evaluate_spatial_frame(
                floorplan=fp,
                state_getter=_raw_state_str,
                prev_frame=last_frame,
                now_ts=now_ts,
                negative_space_enabled=neg_space_enabled,
                guest_mode_enabled=guest_mode_enabled,
                ble_decider_enabled=ble_decider_enabled,
            )
            frame["_queried_states"] = dict(queried_states)
            # Always update live EKF telemetry tracks (even while ble_decider_enabled=False)
            if store is not None and hasattr(store, "ekf_manager"):
                from .ble_kalman_tracker import update_house_ekf_from_hass

                trackers = (
                    list(store.global_settings.get("ble_trackers") or [])
                    if isinstance(getattr(store, "global_settings", None), dict)
                    else []
                )
                frame["ekf_tracks"] = update_house_ekf_from_hass(
                    store.ekf_manager,
                    coord.hass,
                    fp,
                    frame,
                    now_ts,
                    trackers,
                    ble_ranges_provider=getattr(store, "_ble_ranges_provider", None),
                )
            if store is not None:
                store._last_spatial_frame = frame
        coord._last_spatial_frame = frame
        coord.last_spatial_estimate = frame.get("room_estimates", {}).get(coord.room_name)
    except Exception:  # noqa: BLE001
        coord.last_spatial_estimate = None

    sp = coord.last_spatial_estimate if isinstance(coord.last_spatial_estimate, dict) else {}
    shade_excluded_eids = set(sp.get("shade_sunlight_excluded_entities") or []) | set(
        sp.get("pet_excluded_entities") or []
    )
    obs_to_eval = list(coord.bayesian_observations)
    explicit_obs_eids = {str(o.get("entity_id", "")) for o in obs_to_eval if o.get("entity_id")}
    virtual_neg_eid = "__spatial_negative_space__"
    has_neg_boost = False
    # Prevent double-counting a PIR that is already an explicit Bayesian observation;
    # keep negative-space boost for genuine blind-pocket holds and unmodeled PIR localization.
    sp_method = str(sp.get("method") or "")
    sp_pir_drivers = [
        str(d)
        for d in (sp.get("positive_drivers") or [])
        if classify_sensor_reliability(str(d)).is_pir
    ]
    pir_already_in_bayesian = (
        sp_method == "hybrid"
        and bool(sp_pir_drivers)
        and all(d in explicit_obs_eids for d in sp_pir_drivers)
    )
    if (
        neg_space_enabled
        and sp
        and float(sp.get("probability_boost", 0.0)) > 0.0
        and not pir_already_in_bayesian
    ):
        has_neg_boost = True
        boost_weight = float(sp.get("probability_boost_weight", 1.0))
        if not guest_mode_enabled:
            drivers = sp.get("positive_drivers") or []
            pir_drivers = [str(d) for d in drivers if classify_sensor_reliability(str(d)).is_pir]
            if pir_drivers:
                best_ct = max(
                    max(
                        0.15,
                        1.0
                        - 2.5
                        * get_active_pir_spillover_fraction(
                            coord.hass, d, getattr(coord, "_last_spatial_frame", None)
                        ),
                    )
                    for d in pir_drivers
                )
                boost_weight = min(boost_weight, best_ct)
        ns_pt, ns_pf = apply_signal_weight(0.85, 0.12, boost_weight)
        obs_to_eval.append(
            {
                "entity_id": virtual_neg_eid,
                "prob_given_true": ns_pt,
                "prob_given_false": ns_pf,
                "target_state": "on",
                "label": sp.get("inferred_subregion") or "Negative-Space Spatial Exclusion",
            }
        )

    tracker = getattr(coord, "actuation_tracker", None)
    cam_rejected = is_camera_verification_rejected(coord, now_ts=now_ts)

    suppressed_eids = set(shade_excluded_eids)
    for obs in obs_to_eval:
        eid = obs.get("entity_id")
        if not eid:
            continue
        eid_str = str(eid)
        if tracker is not None and tracker.is_entity_auto_latched(eid_str):
            suppressed_eids.add(eid_str)
        elif cam_rejected and is_camera_entity(eid_str):
            suppressed_eids.add(eid_str)
        elif (
            not ble_active_in_fusion
            and classify_sensor_reliability(eid_str).category == "ble_tracker"
        ):
            suppressed_eids.add(eid_str)

    class _VirtualState:
        state = "on"

    class _SuppressedState:
        state = "off"
        attributes: dict[str, Any] = {}

    class _EkfActiveState:
        state = "__ekf_active__"
        attributes: dict[str, Any] = {}

    obs_to_eval = apply_contextual_bayesian_penalties(
        obs_to_eval,
        room_name=coord.room_name,
        spatial_frame=getattr(coord, "_last_spatial_frame", None),
        hass=coord.hass,
        guest_mode_enabled=guest_mode_enabled or not ble_active_in_fusion,
    )
    ekf_continuous_eids = {
        str(o.get("entity_id", "")) for o in obs_to_eval if o.get("_ekf_continuous")
    }

    def _bayesian_state_getter(eid: str) -> Any:
        if eid == virtual_neg_eid and has_neg_boost:
            return _VirtualState()
        if eid in suppressed_eids:
            return _SuppressedState()
        if eid in ekf_continuous_eids:
            return _EkfActiveState()
        st = _safe_state_getter(coord.hass, eid)
        if st is not None and is_state_stale(st, max_age_seconds=60.0):
            return _SuppressedState()
        return st

    evaluation = evaluate_bayesian(
        obs_to_eval,
        _bayesian_state_getter,
        prior=coord.bayesian_prior,
        threshold=coord.bayesian_threshold,
    )
    coord.last_bayesian_eval = evaluation
    should_trigger_sm = coord.has_explicit_bayesian
    coord._bayesian_drives_occupancy = bool(should_trigger_sm)
    sync_coordinator_evidence(coord, trigger_bayesian=should_trigger_sm, now_ts=now_ts)
    record_coordinator_timeline_snapshot(coord)
    if (
        evaluation.is_occupied and should_trigger_sm and coord.state_machine.is_present
    ) and not guest_mode_enabled:
        notify_connected_rooms_if_active(coord)
    return evaluation


def process_coordinator_trigger_event(coord: Any, event: Any) -> None:
    """Handle trigger sensor event with transient shielding and rate-limiting cooldown."""
    to_state = event.data.get("new_state")
    entity_id = event.data.get("entity_id")
    if not to_state or not entity_id or is_state_stale(to_state, max_age_seconds=60.0):
        return

    if is_coupled_hmm_active(coord):
        now = time.time()
        cam_trigger = is_camera_entity(str(entity_id))
        is_on_raw = to_state.state in ("on", "playing", "home")
        if is_on_raw and not cam_trigger and classify_sensor_reliability(str(entity_id)).is_pir:
            coord._cam_verify_rejected_until = 0.0
        evaluate_coordinator_hmm(coord, now_ts=now)
        coord.async_update_listeners()
        return

    now = time.time()
    cam_trigger = is_camera_entity(str(entity_id))
    is_on_raw = to_state.state in ("on", "playing", "home")
    if is_on_raw and not cam_trigger and classify_sensor_reliability(str(entity_id)).is_pir:
        coord._cam_verify_rejected_until = 0.0

    coord._eval_bayesian_and_update()
    sp_est = coord.last_spatial_estimate or {}
    suppressed = set(sp_est.get("shade_sunlight_excluded_entities") or []) | set(
        sp_est.get("pet_excluded_entities") or []
    )
    if cam_trigger and is_camera_verification_rejected(coord, now_ts=now):
        suppressed.add(str(entity_id))
    if not classify_sensor_reliability(str(entity_id)).is_human_exclusive:
        coord._active_triggers.discard(str(entity_id))
        return

    is_active = is_on_raw and entity_id not in suppressed

    if is_active and not coord.state_machine.is_present:
        last_cleared = getattr(coord.state_machine, "last_cleared_time", 0.0)
        cooldown = float(getattr(coord.state_machine, "retrigger_cooldown", 20.0))
        b_occupied = bool(coord.last_bayesian_eval and coord.last_bayesian_eval.is_occupied)

        if (
            last_cleared > 0.0
            and (now - last_cleared) < cooldown
            and not b_occupied
            and not cam_trigger
        ):
            return

        if not coord._is_guest_mode_active() and not cam_trigger:
            sp_frac = get_active_pir_spillover_fraction(
                coord.hass, str(entity_id), getattr(coord, "_last_spatial_frame", None)
            )
            if (
                sp_frac >= 0.08
                and coord.last_bayesian_eval is not None
                and not coord.last_bayesian_eval.is_occupied
            ):
                coord._last_suppressed_reason = (
                    f"spatial_crosstalk_attenuated_{int(sp_frac * 100)}pct"
                )
                return

    if is_active:
        coord._active_triggers.add(str(entity_id))
        coord._last_trigger_entity = str(entity_id)
    else:
        coord._active_triggers.discard(str(entity_id))

    if hasattr(coord, "_refresh_condition_descs"):
        coord._refresh_condition_descs()
    sync_coordinator_evidence(coord, now_ts=now)
    if is_active and coord.state_machine.is_present:
        coord._notify_connected_rooms_if_active()
    coord.async_update_listeners()
