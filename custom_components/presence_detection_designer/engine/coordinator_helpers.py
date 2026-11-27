"""Coordinator helper functions for Room Presence Designer."""

from __future__ import annotations

import logging
from typing import Any

from ..const import (
    CONF_AREA_ID,
    CONF_BAYESIAN_ENABLED,
    CONF_BAYESIAN_OBSERVATIONS,
    CONF_BAYESIAN_PRIOR,
    CONF_BAYESIAN_THRESHOLD,
    CONF_BOUNDARY_ENTITIES,
    CONF_CAMERA_ENTITY,
    CONF_CAMERA_SNAPSHOT_URL,
    CONF_CONNECTED_ROOMS,
    CONF_EXTEND_TIMEOUT,
    CONF_INACTIVITY_TIMEOUT,
    CONF_LLM_AGENT_ID,
    CONF_LLM_API_KEY,
    CONF_LLM_API_URL,
    CONF_LLM_ENABLED,
    CONF_LLM_MODEL,
    CONF_LLM_PROMPT,
    CONF_LLM_PROVIDER_TYPE,
    CONF_MODE,
    CONF_NOTIFY_ENABLED,
    CONF_NOTIFY_ON_CLEARED,
    CONF_NOTIFY_ON_OCCUPIED,
    CONF_ROOM_NAME,
    CONF_SUSTAINING_CONDITIONS,
    CONF_TRIGGER_ENTITIES,
    DATA_STORE,
    DEFAULT_BAYESIAN_PRIOR,
    DEFAULT_BAYESIAN_THRESHOLD,
    DEFAULT_EXTEND_TIMEOUT,
    DEFAULT_INACTIVITY_TIMEOUT,
    DEFAULT_LLM_PROMPT,
    DEFAULT_MAX_HOLD_TIMEOUT,
    DEFAULT_PIR_CANDIDATE_WINDOW,
    DEFAULT_VERIFY_TIMEOUT,
    DOMAIN,
    LLMProviderType,
    Mode,
)
from ..llm.config_translator import (
    config_to_yaml_representations,
    explain_config_in_natural_language,
)
from ..llm.llm_verifier import LLMVerifier
from ..spatial.spatial_catalog import (
    PRIMARY_BLE_TRACKER_ENTITIES,
    SECONDARY_BLE_TRACKER_ENTITIES,
    _normalize_ble_area_to_room,
)
from .bayesian_engine import build_effective_observations
from .causal_context import resolve_room_actuator_entities
from .evidence_snapshot import RoomEvidenceSnapshot
from .sensor_reliability import (
    classify_sensor_reliability,
    is_camera_entity,
    is_human_exclusive_initiator,
)
from .state_machine import RoomPresenceStateMachine

_LOGGER = logging.getLogger(__name__)


def apply_coordinator_config_fields(
    coord: Any, config: dict[str, Any], preserve_state: bool = False
) -> None:
    """Populate coordinator attributes and state machine from config dict."""
    coord.config = dict(config)
    coord.room_name = config.get(CONF_ROOM_NAME, "Room")
    coord.area_id = config.get(CONF_AREA_ID)
    coord.boundary_entities = list(config.get(CONF_BOUNDARY_ENTITIES, []) or [])
    coord.trigger_entities = list(config.get(CONF_TRIGGER_ENTITIES, []) or [])
    coord.monitored_actuator_entities = resolve_room_actuator_entities(coord.room_name, config)
    coord.connected_rooms = [str(r) for r in (config.get(CONF_CONNECTED_ROOMS, []) or []) if r]
    coord.conditions = list(config.get(CONF_SUSTAINING_CONDITIONS, []) or [])

    coord.bayesian_enabled = bool(config.get(CONF_BAYESIAN_ENABLED, True))
    coord.bayesian_prior = float(config.get(CONF_BAYESIAN_PRIOR, DEFAULT_BAYESIAN_PRIOR))
    coord.bayesian_threshold = float(
        config.get(CONF_BAYESIAN_THRESHOLD, DEFAULT_BAYESIAN_THRESHOLD)
    )
    coord.has_explicit_bayesian = bool(config.get(CONF_BAYESIAN_OBSERVATIONS))
    coord.bayesian_observations = build_effective_observations(config)

    mode_val = config.get(CONF_MODE)
    if not mode_val or str(mode_val).lower() == "auto":
        coord.mode = Mode.BOUNDED if len(coord.boundary_entities) > 0 else Mode.OPEN
    else:
        try:
            coord.mode = Mode(mode_val)
        except ValueError:
            coord.mode = Mode.BOUNDED if len(coord.boundary_entities) > 0 else Mode.OPEN

    raw_notify_enabled = config.get(CONF_NOTIFY_ENABLED)
    coord.notify_enabled = False if raw_notify_enabled is None else bool(raw_notify_enabled)
    raw_notify_occ = config.get(CONF_NOTIFY_ON_OCCUPIED)
    coord.notify_on_occupied = True if raw_notify_occ is None else bool(raw_notify_occ)
    raw_notify_clr = config.get(CONF_NOTIFY_ON_CLEARED)
    coord.notify_on_cleared = True if raw_notify_clr is None else bool(raw_notify_clr)

    inactivity_timeout = int(config.get(CONF_INACTIVITY_TIMEOUT, DEFAULT_INACTIVITY_TIMEOUT))
    extend_timeout = int(config.get(CONF_EXTEND_TIMEOUT, DEFAULT_EXTEND_TIMEOUT))
    max_hold_timeout = int(config.get("max_hold_timeout", DEFAULT_MAX_HOLD_TIMEOUT))
    verify_timeout = int(config.get("verify_timeout", DEFAULT_VERIFY_TIMEOUT))
    llm_enabled = bool(config.get(CONF_LLM_ENABLED, False))

    if preserve_state and coord.state_machine is not None:
        coord.state_machine.name = coord.room_name
        coord.state_machine.inactivity_timeout = max(1, inactivity_timeout)
        coord.state_machine.extend_timeout = max(1, extend_timeout)
        coord.state_machine.max_hold_timeout = max(1, max_hold_timeout)
        coord.state_machine.verify_timeout = max(1, verify_timeout)
        coord.state_machine.llm_enabled = llm_enabled
        coord.state_machine.bayesian_prior = coord.bayesian_prior
        coord.state_machine.bayesian_threshold = coord.bayesian_threshold
        coord._active_triggers.intersection_update(coord.trigger_entities)
    else:
        coord.state_machine = RoomPresenceStateMachine(
            name=coord.room_name,
            inactivity_timeout=inactivity_timeout,
            extend_timeout=extend_timeout,
            max_hold_timeout=max_hold_timeout,
            verify_timeout=verify_timeout,
            llm_enabled=llm_enabled,
            bayesian_prior=coord.bayesian_prior,
            bayesian_threshold=coord.bayesian_threshold,
        )

    coord.pir_validation_enabled = False
    coord.pir_candidate_window = float(DEFAULT_PIR_CANDIDATE_WINDOW)
    coord.pir_validator = None

    llm_cfg = coord._resolve_global_llm_defaults(config)
    coord.verifier = LLMVerifier(
        hass=coord.hass,
        provider_type=llm_cfg[CONF_LLM_PROVIDER_TYPE],
        agent_id=llm_cfg[CONF_LLM_AGENT_ID],
        api_url=llm_cfg[CONF_LLM_API_URL],
        api_key=llm_cfg[CONF_LLM_API_KEY],
        model=llm_cfg[CONF_LLM_MODEL],
        prompt=config.get(CONF_LLM_PROMPT, DEFAULT_LLM_PROMPT),
    )

    coord.camera_entity = config.get(CONF_CAMERA_ENTITY)
    coord.camera_snapshot_url = config.get(CONF_CAMERA_SNAPSHOT_URL)

    coord.rule_guide = explain_config_in_natural_language(config)
    coord.yaml_representations = config_to_yaml_representations(config)


def resolve_global_llm_defaults(hass: Any, config: dict[str, Any]) -> dict[str, Any]:
    """Merge global_settings from PDDStore for any unset LLM fields."""
    gs: dict[str, Any] = {}
    if hass and isinstance(getattr(hass, "data", None), dict):
        store = hass.data.get(DOMAIN, {}).get(DATA_STORE)
        if store is not None and hasattr(store, "global_settings"):
            gs = store.global_settings or {}

    return {
        CONF_LLM_PROVIDER_TYPE: (
            config.get(CONF_LLM_PROVIDER_TYPE)
            or gs.get("llm_provider_type")
            or LLMProviderType.VISION_API
        ),
        CONF_LLM_AGENT_ID: config.get(CONF_LLM_AGENT_ID) or gs.get("llm_agent_id"),
        CONF_LLM_API_URL: config.get(CONF_LLM_API_URL) or gs.get("llm_api_url"),
        CONF_LLM_API_KEY: config.get(CONF_LLM_API_KEY) or gs.get("llm_api_key"),
        CONF_LLM_MODEL: config.get(CONF_LLM_MODEL) or gs.get("llm_model"),
    }


def _safe_state_getter(hass: Any, entity_id: str) -> Any:
    """Return HA state object only if its `.state` attribute is a concrete string."""
    if not hass or not hasattr(hass, "states"):
        return None
    state_obj = hass.states.get(entity_id)
    if state_obj is None or not isinstance(getattr(state_obj, "state", None), str):
        return None
    return state_obj


def build_coordinator_evidence_snapshot(
    coord: Any,
    *,
    trigger_bayesian: bool | None = None,
) -> RoomEvidenceSnapshot:
    """Build an immutable RoomEvidenceSnapshot from coordinator triggers, conditions, Bayesian, and spatial state."""
    eval_obj = coord.last_bayesian_eval
    should_trigger_bayes = (
        getattr(coord, "_bayesian_drives_occupancy", False)
        if trigger_bayesian is None
        else bool(trigger_bayesian)
    )
    from .camera_guard import is_camera_verification_rejected

    cam_rejected = is_camera_verification_rejected(coord)
    sp = coord.last_spatial_estimate if isinstance(coord.last_spatial_estimate, dict) else {}
    raw_human = bool(sp.get("human_present", False))
    pet_present = bool(sp.get("pet_present", False))
    raw_drivers = [
        str(d)
        for d in (sp.get("positive_drivers") or [])
        if d and not (cam_rejected and is_camera_entity(str(d)))
    ]
    raw_triggers = {
        t
        for t in getattr(coord, "_active_triggers", set())
        if not (cam_rejected and is_camera_entity(str(t)))
    }
    configured_triggers = getattr(coord, "trigger_entities", None)
    if isinstance(configured_triggers, (list, tuple, set)):
        allowed_set = {str(t) for t in configured_triggers if t and str(t) in raw_triggers}
        drivers = [d for d in raw_drivers if d in allowed_set]
    else:
        drivers = raw_drivers
    if cam_rejected and not drivers:
        raw_human = False

    is_hold_only_spatial = bool(
        sp.get("method") in ("negative_space", "blind_pocket")
        or (sp.get("should_hold_occupied", False) and not raw_drivers)
    )
    human_present = bool(
        raw_human and not is_hold_only_spatial and (bool(drivers) or configured_triggers is None)
    )
    spatial_hold = bool(
        raw_human
        and is_hold_only_spatial
        and (sp.get("should_hold_occupied", False) or sp.get("should_hold", False))
    )

    pv = getattr(coord, "pir_validator", None)
    pir_gate_active = bool(getattr(coord, "pir_validation_enabled", False) and pv is not None)
    sm_present = bool(getattr(getattr(coord, "state_machine", None), "is_present", False))
    pir_confirmed = bool(pv is not None and pv.pir_confirmed)

    # SIGNAL-01: Only person-coupled sensors (Vision, validated PIR, BLE) may initiate or drive triggers.
    effective_triggers = frozenset(
        t
        for t in raw_triggers
        if is_human_exclusive_initiator(
            t,
            pir_confirmed=pir_confirmed,
            pir_gate_active=pir_gate_active and not sm_present,
        )
    )
    camera_confirmed = bool(
        (
            human_present
            and any(
                is_camera_entity(drv)
                or any(k in drv.lower() for k in ("camera", "person", "subzone", "zone"))
                for drv in drivers
            )
        )
        or any(is_camera_entity(t) for t in effective_triggers)
    )
    if pir_gate_active and not sm_present and not pir_confirmed:
        if human_present and not camera_confirmed:
            has_human_driver = any(
                is_human_exclusive_initiator(str(drv), pir_confirmed=False, pir_gate_active=True)
                for drv in drivers
            )
            if not has_human_driver:
                human_present = False
    else:
        if pir_gate_active and pir_confirmed and not effective_triggers:
            human_present = True

    if eval_obj and eval_obj.is_occupied and should_trigger_bayes and not camera_confirmed:
        has_human_obs = any(
            is_human_exclusive_initiator(
                str(obs.get("entity_id", "")),
                pir_confirmed=pir_confirmed,
                pir_gate_active=pir_gate_active and not sm_present,
            )
            for obs in (eval_obj.active_observations or [])
            if isinstance(obs, dict)
        )
        if not has_human_obs:
            should_trigger_bayes = False

    last_trig = getattr(coord, "_last_trigger_entity", None)
    if last_trig and not classify_sensor_reliability(str(last_trig)).is_human_exclusive:
        last_trig = None
    if not last_trig and pv is not None and pv.pir_confirmed and pv.candidate_pir_sensors:
        last_trig = sorted(pv.candidate_pir_sensors)[0]
    if not last_trig and should_trigger_bayes and eval_obj and eval_obj.active_observations:
        last_trig = eval_obj.active_observations[0].get("entity_id")

    return RoomEvidenceSnapshot(
        active_triggers=effective_triggers,
        active_conditions=tuple(getattr(coord, "_active_condition_descs", [])),
        bayesian_occupied=bool(eval_obj and eval_obj.is_occupied and should_trigger_bayes),
        bayesian_probability=eval_obj.probability if eval_obj else 0.0,
        bayesian_probability_pct=eval_obj.probability_pct if eval_obj else 0.0,
        bayesian_summary=eval_obj.natural_language_summary if eval_obj else "",
        active_observations=tuple(eval_obj.active_observations) if eval_obj else (),
        inactive_observations=tuple(eval_obj.inactive_observations) if eval_obj else (),
        human_present=human_present,
        pet_present=pet_present,
        spatial_blind_pocket_hold=spatial_hold,
        camera_confirmed=camera_confirmed,
        last_trigger_entity=last_trig,
    )


def sync_coordinator_evidence(
    coord: Any,
    *,
    trigger_bayesian: bool | None = None,
    now_ts: float | None = None,
) -> RoomEvidenceSnapshot:
    """Build normalized evidence snapshot and apply it to the transitions state machine."""
    snapshot = build_coordinator_evidence_snapshot(coord, trigger_bayesian=trigger_bayesian)
    coord.state_machine.apply_evidence(snapshot, now_ts=now_ts)
    return snapshot


def record_coordinator_timeline_snapshot(coord: Any) -> None:
    """Record a compact sensor & state snapshot into PDDStore's rolling timeline buffer."""
    if not coord.hass or not isinstance(getattr(coord.hass, "data", None), dict):
        return
    store = coord.hass.data.get(DOMAIN, {}).get(DATA_STORE)
    if store is None or not hasattr(store, "record_timeline_event"):
        return

    from ..spatial.spatial_catalog import BLE_TRACKER_ENTITIES

    entity_states: dict[str, str] = {}
    tracked_eids: set[str] = (
        set(coord.boundary_entities) | set(coord.trigger_entities) | set(BLE_TRACKER_ENTITIES)
    )
    for cond in coord.conditions:
        if isinstance(cond, dict) and cond.get("entity_id"):
            tracked_eids.add(str(cond["entity_id"]))
    for obs in coord.bayesian_observations:
        if isinstance(obs, dict) and obs.get("entity_id"):
            tracked_eids.add(str(obs["entity_id"]))

    for eid in sorted(tracked_eids):
        st_obj = _safe_state_getter(coord.hass, eid)
        if st_obj is not None:
            entity_states[eid] = str(st_obj.state)

    sp = coord.last_spatial_estimate if isinstance(coord.last_spatial_estimate, dict) else {}
    snap = getattr(coord.state_machine, "snapshot", None)
    house_count: int | None = None
    house_mode: str | None = None
    try:
        tracker = (
            coord.hass.data.get(DOMAIN, {}).get("_house_perimeter_tracker")
            if coord.hass and isinstance(getattr(coord.hass, "data", None), dict)
            else None
        )
        if tracker is not None and getattr(tracker, "state", None) is not None:
            house_count = max(0, int(tracker.state.count))
            house_mode = str(tracker.state.mode)
        elif store is not None and isinstance(getattr(store, "global_settings", None), dict):
            gs = store.global_settings
            raw_cnt = gs.get("house_occupant_count")
            if raw_cnt is not None:
                house_count = max(0, int(raw_cnt))
            if gs.get("guest_mode_enabled"):
                house_mode = "guest"
            elif house_count is not None:
                house_mode = "occupied" if house_count > 0 else "vacant"
    except Exception:  # noqa: BLE001
        house_count = None
        house_mode = None

    pos_drivers = [
        str(d)
        for d in (sp.get("positive_drivers") or [])
        if d in set(getattr(coord, "trigger_entities", ()) or ())
    ]
    if not pos_drivers and snap is not None:
        pos_drivers = sorted(getattr(snap, "active_triggers", ()) or ())

    store.record_timeline_event(
        coord.entry_id,
        {
            "is_present": coord.state_machine.is_present,
            "occupancy_state": str(coord.state_machine.state),
            "probability_pct": coord.state_machine.bayesian_probability_pct,
            "verified_by": coord.state_machine.verified_by,
            "reason": coord.state_machine.last_transition_reason,
            "camera_confirmed": bool(getattr(snap, "camera_confirmed", False)),
            "pet_present": bool(getattr(snap, "pet_present", False)),
            "last_handoff_room": getattr(coord.state_machine, "last_handoff_room", None),
            "inferred_subregion": sp.get("inferred_subregion"),
            "positive_drivers": pos_drivers,
            "negative_exclusions": list(sp.get("negative_exclusions") or []),
            "house_occupant_count": house_count,
            "house_occupancy_mode": house_mode,
            "entity_states": entity_states,
        },
    )


def get_all_room_coordinators(hass: Any) -> list[Any]:
    """Retrieve all RoomPresenceCoordinator instances from hass.data."""
    if not hass or not isinstance(getattr(hass, "data", None), dict):
        return []
    domain_data = hass.data.get(DOMAIN, {})
    if not isinstance(domain_data, dict):
        return []
    return [
        obj
        for obj in domain_data.values()
        if type(obj).__name__ != "MagicMock"
        and hasattr(obj, "state_machine")
        and isinstance(getattr(obj, "room_name", None), str)
    ]


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
        gs = store.global_settings
        if "ble_decider_enabled" in gs and not bool(gs.get("ble_decider_enabled", False)):
            return False
        trackers = [
            str(t)
            for t in (gs.get("ble_trackers") or [])
            if t and str(t) not in SECONDARY_BLE_TRACKER_ENTITIES
        ]
    if not trackers:
        trackers = list(PRIMARY_BLE_TRACKER_ENTITIES)

    room_low = str(getattr(coord, "room_name", "")).strip().lower()
    in_this_room = False
    contradicted = False
    for tracker_eid in trackers:
        st = _safe_state_getter(hass, tracker_eid)
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
