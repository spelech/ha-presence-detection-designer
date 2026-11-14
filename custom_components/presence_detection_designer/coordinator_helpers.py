"""Coordinator helper functions for Room Presence Designer."""

from __future__ import annotations

import logging
from typing import Any

from .bayesian_engine import build_effective_observations
from .causal_context import resolve_room_actuator_entities
from .config_translator import (
    config_to_yaml_representations,
    explain_config_in_natural_language,
)
from .const import (
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
    CONF_NOTIFY_ON_CLEARED,
    CONF_NOTIFY_ON_OCCUPIED,
    CONF_NOTIFY_SLACK,
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
    DEFAULT_VERIFY_TIMEOUT,
    DOMAIN,
    LLMProviderType,
    Mode,
)
from .evidence_snapshot import RoomEvidenceSnapshot
from .llm_verifier import LLMVerifier
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

    raw_notify_slack = config.get(CONF_NOTIFY_SLACK)
    coord.notify_slack = True if raw_notify_slack is None else bool(raw_notify_slack)
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


async def async_send_coordinator_test_notification(
    coord: Any,
    service: str | None = None,
    channel: str | None = None,
    verbosity: str | None = None,
) -> bool:
    """Send a test diagnostic notification to verify Slack connectivity."""
    from .notifications import TransitionAttribution

    global_settings: dict[str, Any] = {}
    if coord.hass and hasattr(coord.hass, "data") and isinstance(coord.hass.data, dict):
        store = coord.hass.data.get(DOMAIN, {}).get(DATA_STORE)
        if store is not None and hasattr(store, "global_settings"):
            global_settings = dict(store.global_settings or {})

    if service:
        global_settings["slack_notify_service"] = service
    if channel:
        global_settings["slack_channel"] = channel
    if verbosity:
        global_settings["slack_verbosity"] = verbosity

    attribution = TransitionAttribution(
        room_id=coord.entry_id,
        room_name=coord.room_name,
        from_state="clear",
        to_state="occupied",
        primary_driver="Test Trigger (Manual Studio Verification)",
        driver_type="sensor",
        confidence_pct=95.0,
        threshold_pct=75.0,
        active_sensors=["test_sensor.manual_ping"],
        sustaining_conditions=[],
        arrival_context="Manual Studio Test",
        duration_occupied_str=None,
    )
    return await coord._notification_dispatcher.async_dispatch_notification(
        coord.hass,
        attribution,
        global_settings,
        {"notify_slack": True, "notify_on_occupied": True},
    )


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
    sp = coord.last_spatial_estimate if isinstance(coord.last_spatial_estimate, dict) else {}
    raw_human = bool(sp.get("human_present", False))
    pet_present = bool(sp.get("pet_present", False))
    drivers = sp.get("positive_drivers") or []
    is_hold_only_spatial = bool(
        sp.get("method") in ("negative_space", "blind_pocket")
        or (sp.get("should_hold_occupied", False) and not drivers)
    )
    human_present = raw_human and not is_hold_only_spatial
    spatial_hold = bool(
        raw_human
        and is_hold_only_spatial
        and (sp.get("should_hold_occupied", False) or sp.get("should_hold", False))
    )
    camera_confirmed = bool(
        human_present
        and any(
            k in str(drv).lower()
            for drv in drivers
            for k in ("camera", "person", "subzone", "zone")
        )
    )
    last_trig = getattr(coord, "_last_trigger_entity", None)
    if not last_trig and eval_obj and eval_obj.active_observations:
        last_trig = eval_obj.active_observations[0].get("entity_id")

    return RoomEvidenceSnapshot(
        active_triggers=frozenset(getattr(coord, "_active_triggers", set())),
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
