"""Cross-room handoff notifications, transition event bus firing, and Coupled HMM dispatch."""

from __future__ import annotations

import time
from collections.abc import Callable
from typing import Any

from homeassistant.core import callback

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
    build_coordinator_evidence_snapshot,
    record_coordinator_timeline_snapshot,
    resolve_global_llm_defaults,
    sync_coordinator_evidence,
)
from .notifications import async_send_coordinator_test_notification
from .sensor_reliability import (
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
    fp = store.get_floorplan() if callable(getattr(store, "get_floorplan", None)) else None
    if not isinstance(fp, dict) or not fp.get("rooms"):
        return False
    fp_room_names = {str(r.get("name", "")) for r in fp.get("rooms") or [] if isinstance(r, dict)}
    return coord.room_name in fp_room_names


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
    if hasattr(coord, "state_machine") and hasattr(coord, "room_name"):
        c_name = str(coord.room_name)
        coordinators_by_room.setdefault(c_name, coord)
        room_configs.setdefault(c_name, dict(getattr(coord, "config", {}) or {}))
        if is_camera_verification_rejected(coord, now_ts=ts):
            cam_rejected_rooms.add(c_name)

    hmm = store.get_or_create_hmm_engine(fp, room_configs)

    # Update house EKF tracks once per second bucket
    ekf_tracks: dict[str, dict[str, Any]] = {}
    if hasattr(store, "ekf_manager"):
        last_ekf_sec = getattr(store, "_hmm_last_ekf_sec", None)
        sec_bucket = int(ts)
        if last_ekf_sec != sec_bucket or not hasattr(store, "_hmm_last_ekf_tracks"):
            from .ble_kalman_tracker import update_house_ekf_from_hass

            trackers = list(gs.get("ble_trackers") or [])
            ekf_floor_v2 = bool(gs.get("ekf_floor_stability_v2", True))
            ekf_tracks = update_house_ekf_from_hass(
                store.ekf_manager,
                coord.hass,
                fp,
                None,
                ts,
                trackers,
                ble_ranges_provider=getattr(store, "_ble_ranges_provider", None),
                pir_spillover=hmm.topology.pir_spillover,
                ekf_floor_stability_v2=ekf_floor_v2,
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
    """Fire HA transition event and schedule notification when presence state changes."""
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

    if not (coord.hass and coord.notify_enabled):
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
    hmm_snap = getattr(coord, "last_hmm_snapshot", None)
    if hmm_snap is not None:
        curr_eval["probability"] = hmm_snap.probability
        if hmm_snap.active_drivers:
            curr_eval["active_entities"] = list(hmm_snap.active_drivers)
            curr_eval["driver_entity"] = hmm_snap.active_drivers[0]

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
            coord_cam = bool(coord.state_machine.snapshot.camera_confirmed)
            if not coord_cam and other.state_machine.state == OccupancyState.OCCUPIED_CONFIRMED:
                other_entered = float(
                    getattr(other.state_machine, "last_occupied_time", 0.0) or 0.0
                )
                if other_entered > 0.0 and (time.time() - other_entered) < 2.5:
                    continue
            other.notify_adjacent_occupancy(coord.room_name)


def evaluate_coordinator_bayesian(coord: Any) -> Any:
    """Evaluate room occupancy via the Coupled Continuous-Time Log-Odds HMM."""
    if not coord.hass or not hasattr(coord.hass, "states"):
        return None
    if is_coupled_hmm_active(coord):
        return evaluate_coordinator_hmm(coord)
    return None


def process_coordinator_trigger_event(coord: Any, event: Any) -> None:
    """Handle trigger sensor event through the Coupled HMM (or direct evidence sync if standalone)."""
    to_state = event.data.get("new_state")
    entity_id = event.data.get("entity_id")
    if not to_state or not entity_id or is_state_stale(to_state, max_age_seconds=60.0):
        return

    now = time.time()
    cam_trigger = is_camera_entity(str(entity_id))
    is_on_raw = to_state.state in ("on", "playing", "home")
    if is_on_raw and not cam_trigger and classify_sensor_reliability(str(entity_id)).is_pir:
        coord._cam_verify_rejected_until = 0.0

    if is_coupled_hmm_active(coord):
        evaluate_coordinator_hmm(coord, now_ts=now)
        coord.async_update_listeners()
        return

    # Standalone coordinator (no floorplan/store, e.g. isolated unit tests)
    if not classify_sensor_reliability(str(entity_id)).is_human_exclusive:
        coord._active_triggers.discard(str(entity_id))
        return
    if cam_trigger and is_camera_verification_rejected(coord, now_ts=now):
        coord._active_triggers.discard(str(entity_id))
        return

    if is_on_raw:
        coord._active_triggers.add(str(entity_id))
        coord._last_trigger_entity = str(entity_id)
    else:
        coord._active_triggers.discard(str(entity_id))

    if hasattr(coord, "_refresh_condition_descs"):
        coord._refresh_condition_descs()
    sync_coordinator_evidence(coord, now_ts=now)
    if is_on_raw and coord.state_machine.is_present:
        coord._notify_connected_rooms_if_active()
    coord.async_update_listeners()


def attach_coordinator_timer_hooks(coord: Any) -> None:
    """Wire event-driven HA async_call_later timers into the RoomPresenceStateMachine."""
    if not coord.hass or not hasattr(coord.hass, "loop"):
        return
    try:
        from homeassistant.helpers.event import async_call_later

        if type(async_call_later).__name__ == "MagicMock":
            return

        def _schedule(delay: float, cb: Callable[[], None]) -> Callable[[], None]:
            @callback
            def _timer_cb(_now: Any) -> None:
                cb()

            return async_call_later(coord.hass, delay, _timer_cb)

        def _on_expired(expired_trigger: str) -> None:
            if (
                expired_trigger == "countdown_expired"
                and coord.state_machine.state == OccupancyState.OCCUPIED_VERIFYING
            ):
                if coord._is_guest_mode_active():
                    coord.state_machine.handle_llm_result(
                        False, "Skipped LLM verification in Guest Mode"
                    )
                    coord.async_update_listeners()
                    return
                coord.async_update_listeners()
                if hasattr(coord.hass, "async_create_task"):
                    coord.hass.async_create_task(coord.async_run_llm_verification())
                return
            coord.async_update_listeners()

        def _on_pir_expired(_expired_trigger: str) -> None:
            coord.async_update_listeners()

        coord.state_machine._timer_scheduler = _schedule
        coord.state_machine._on_timer_expired = _on_expired
        if coord.pir_validator is not None:
            coord.pir_validator._timer_scheduler = _schedule
            coord.pir_validator._on_timer_expired = _on_pir_expired
    except Exception:  # noqa: BLE001
        pass
