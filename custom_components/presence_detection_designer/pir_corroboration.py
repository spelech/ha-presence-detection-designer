"""Coordinator-to-PIRValidationStateMachine corroboration context and dispatch bridge."""

from __future__ import annotations

import time
from typing import Any

from .const import DATA_STORE, DOMAIN, PIRValidationState
from .pir_validation import PIRCorroborationContext
from .sensor_reliability import classify_sensor_reliability, is_camera_entity
from .spatial_catalog import (
    PRIMARY_BLE_TRACKER_ENTITIES,
    SECONDARY_BLE_TRACKER_ENTITIES,
    _normalize_ble_area_to_room,
)


def _safe_get_state(hass: Any, entity_id: str) -> Any:
    if not hass or not hasattr(hass, "states"):
        return None
    st = hass.states.get(entity_id)
    if st is None or not isinstance(getattr(st, "state", None), str):
        return None
    return st


def build_pir_corroboration_context(
    coord: Any,
    *,
    traj: Any | None = None,
    now_ts: float | None = None,
) -> PIRCorroborationContext:
    """Gather camera, trajectory, BLE, and multi-sensor context for PIR validation."""
    now = float(now_ts) if now_ts is not None else time.time()
    hass = getattr(coord, "hass", None)
    sp = coord.last_spatial_estimate if isinstance(coord.last_spatial_estimate, dict) else {}
    drivers = sp.get("positive_drivers") or []

    cam_confirmed = bool(
        sp.get("human_present")
        and any(
            k in str(drv).lower()
            for drv in drivers
            for k in ("camera", "person", "subzone", "zone")
        )
    )
    cam_detail: str | None = None
    if cam_confirmed:
        cam_detail = f"Spatial camera confirmation ({', '.join(str(d) for d in drivers)})"

    if not cam_confirmed:
        for t_eid in getattr(coord, "_active_triggers", set()):
            if is_camera_entity(t_eid):
                cam_confirmed = True
                cam_detail = f"Camera person trigger active ({t_eid})"
                break

    if not cam_confirmed and hass and hasattr(hass, "states"):
        for obs in getattr(coord, "bayesian_observations", ()) or ():
            eid = str(obs.get("entity_id", ""))
            if eid and is_camera_entity(eid):
                st = _safe_get_state(hass, eid)
                if st is not None and st.state == "on":
                    cam_confirmed = True
                    cam_detail = f"Camera observation active ({eid})"
                    break

    traj_valid = False
    traj_detail: str | None = None
    if traj is not None and bool(getattr(traj, "is_valid", False)):
        if getattr(traj, "is_adjacent", False) or getattr(traj, "corroborated_path", None):
            traj_valid = True
            traj_detail = str(getattr(traj, "reason", "Corroborated trajectory"))

    if not traj_valid and hass and isinstance(getattr(hass, "data", None), dict):
        domain_data = hass.data.get(DOMAIN, {})
        conn_names = {r.strip().lower() for r in getattr(coord, "connected_rooms", []) if r}
        for other in list(domain_data.values()):
            if other is coord or not hasattr(other, "state_machine"):
                continue
            oname = str(getattr(other, "room_name", "")).strip()
            other_conns = {r.strip().lower() for r in getattr(other, "connected_rooms", []) if r}
            is_adj = (oname.lower() in conn_names) or (
                coord.room_name.strip().lower() in other_conns
            )
            if not is_adj:
                continue
            osm = other.state_machine
            if osm.is_present or (
                osm.last_cleared_time > 0 and (now - osm.last_cleared_time) <= 90.0
            ):
                traj_valid = True
                traj_detail = f"Connected room {oname} occupied or recently vacated"
                break

    if not traj_valid and hass and hasattr(hass, "states"):
        for b_eid in getattr(coord, "boundary_entities", []) or []:
            st = _safe_get_state(hass, b_eid)
            if st is not None and st.state in ("on", "open", "opening"):
                traj_valid = True
                traj_detail = f"Connected door active ({b_eid})"
                break

    ble_corroborated = False
    ble_detail: str | None = None
    ble_trackers: list[str] = []
    store = (
        hass.data.get(DOMAIN, {}).get(DATA_STORE)
        if hass and isinstance(getattr(hass, "data", None), dict)
        else None
    )
    if store is not None and isinstance(getattr(store, "global_settings", None), dict):
        ble_trackers = list(store.global_settings.get("ble_trackers") or [])
    if not ble_trackers and sp.get("ble_telemetry"):
        ble_trackers = list(sp["ble_telemetry"].keys())

    conn_rooms_norm = {r.strip() for r in getattr(coord, "connected_rooms", []) if r}
    target_rooms = {coord.room_name} | conn_rooms_norm
    if hass and hasattr(hass, "states"):
        for tracker_eid in ble_trackers:
            st = _safe_get_state(hass, tracker_eid)
            if st is None:
                continue
            norm_area = _normalize_ble_area_to_room(st.state) or str(st.state).strip()
            if norm_area in target_rooms:
                ble_corroborated = True
                ble_detail = f"{tracker_eid} in {norm_area}"
                break
    if not ble_corroborated and isinstance(sp.get("ble_telemetry"), dict):
        for tracker_eid, raw_area in sp["ble_telemetry"].items():
            norm_area = _normalize_ble_area_to_room(str(raw_area)) or str(raw_area).strip()
            if norm_area in target_rooms:
                ble_corroborated = True
                ble_detail = f"{tracker_eid} in {norm_area}"
                break

    extra_active: set[str] = set()
    for t_eid in getattr(coord, "_active_triggers", set()):
        prof = classify_sensor_reliability(t_eid)
        if prof.is_pir and prof.category != "ecobee_occupancy":
            extra_active.add(str(t_eid))
    if hass and hasattr(hass, "states"):
        for obs in getattr(coord, "bayesian_observations", ()) or ():
            eid = str(obs.get("entity_id", ""))
            if not eid:
                continue
            prof = classify_sensor_reliability(eid)
            if prof.is_pir and prof.category != "ecobee_occupancy":
                st = _safe_get_state(hass, eid)
                if st is not None and st.state == str(obs.get("state", "on")):
                    extra_active.add(eid)

    return PIRCorroborationContext(
        camera_confirmed=cam_confirmed,
        camera_detail=cam_detail,
        trajectory_valid=traj_valid,
        trajectory_detail=traj_detail,
        ble_corroborated=ble_corroborated,
        ble_detail=ble_detail,
        extra_active_sensors=frozenset(extra_active),
    )


def sync_coordinator_pir_corroboration(
    coord: Any,
    *,
    traj: Any | None = None,
    now_ts: float | None = None,
) -> bool:
    """Re-evaluate PIR corroboration when async camera, BLE, or adjacent events arrive."""
    from .coordinator_helpers import sync_coordinator_evidence

    pv = getattr(coord, "pir_validator", None)
    if pv is None or not getattr(coord, "pir_validation_enabled", True):
        return False
    if pv.state not in (PIRValidationState.CANDIDATE, PIRValidationState.SUPPRESSED):
        return bool(pv.pir_confirmed)
    ctx = build_pir_corroboration_context(coord, traj=traj, now_ts=now_ts)
    promoted = pv.on_corroboration_update(ctx, now_ts=now_ts)
    if promoted:
        sync_coordinator_evidence(coord, now_ts=now_ts)
        if not pv.active_pir_sensors:
            pv.pir_cleared(now_ts=now_ts)
            sync_coordinator_evidence(coord, now_ts=now_ts)
        coord.async_update_listeners()
    return promoted


def handle_pir_validation_for_trigger(
    coord: Any,
    entity_id: str,
    is_active: bool,
    *,
    traj: Any | None = None,
    now_ts: float | None = None,
) -> bool:
    """Route a trigger event through PIRValidationStateMachine; return True if trigger is cleared/confirmed."""
    pv = getattr(coord, "pir_validator", None)
    if pv is None or not getattr(coord, "pir_validation_enabled", True):
        return is_active

    now = float(now_ts) if now_ts is not None else time.time()
    fp = None
    if coord.hass and isinstance(getattr(coord.hass, "data", None), dict):
        st = coord.hass.data.get(DOMAIN, {}).get(DATA_STORE)
        if st is not None and hasattr(st, "get_floorplan"):
            fp = st.get_floorplan()

    prof = classify_sensor_reliability(entity_id, floorplan=fp)
    if is_active:
        if prof.requires_pir_validation and not coord.state_machine.is_present:
            ctx = build_pir_corroboration_context(coord, traj=traj, now_ts=now)
            return pv.on_pir_triggered(
                str(entity_id),
                is_slow=prof.is_slow,
                ctx=ctx,
                now_ts=now,
            )
        if not prof.requires_pir_validation and pv.state in (
            PIRValidationState.CANDIDATE,
            PIRValidationState.SUPPRESSED,
        ):
            ctx = build_pir_corroboration_context(coord, traj=traj, now_ts=now)
            pv.on_corroboration_update(ctx, now_ts=now)
        return True

    if prof.requires_pir_validation:
        pv.on_pir_cleared(str(entity_id), now_ts=now)
    return False


def is_condition_contradicted_by_ble(coord: Any, entity_id: str) -> bool:
    """Return True when a power-monitor hold is contradicted by primary resident BLE telemetry (SIGNAL-03)."""
    prof = classify_sensor_reliability(entity_id)
    if prof.category != "power_monitor":
        return False
    if getattr(coord, "_active_triggers", None):
        return False
    if callable(getattr(coord, "_is_guest_mode_active", None)) and coord._is_guest_mode_active():
        return False

    hass = getattr(coord, "hass", None)
    if not hass or not hasattr(hass, "states"):
        return False

    store = (
        hass.data.get(DOMAIN, {}).get(DATA_STORE)
        if isinstance(getattr(hass, "data", None), dict)
        else None
    )
    trackers: list[str] = []
    if store is not None and isinstance(getattr(store, "global_settings", None), dict):
        trackers = [
            str(t)
            for t in (store.global_settings.get("ble_trackers") or [])
            if t and str(t) not in SECONDARY_BLE_TRACKER_ENTITIES
        ]
    if not trackers:
        trackers = list(PRIMARY_BLE_TRACKER_ENTITIES)

    room_low = str(getattr(coord, "room_name", "")).strip().lower()
    in_this_room = False
    contradicted = False
    for tracker_eid in trackers:
        st = _safe_get_state(hass, tracker_eid)
        if st is None:
            continue
        raw = str(st.state).strip()
        low = raw.lower().replace("_", " ")
        if low in ("unknown", "unavailable", "none", ""):
            continue
        if low in ("away", "not home", "not_home"):
            contradicted = True
            continue
        norm = (_normalize_ble_area_to_room(raw) or raw).strip().lower()
        if norm == room_low:
            in_this_room = True
        else:
            contradicted = True

    return contradicted and not in_this_room
