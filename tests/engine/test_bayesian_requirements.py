"""Tests for BAYES-01..BAYES-04: Score/hold-only Bayesian, no double-tempering, explicit obs, and BLE penalties."""

from __future__ import annotations

import pytest

from custom_components.presence_detection_designer.const import (
    CONF_BAYESIAN_OBSERVATIONS,
    CONF_ROOM_NAME,
    CONF_SUSTAINING_CONDITIONS,
    CONF_TRIGGER_ENTITIES,
    OccupancyState,
)
from custom_components.presence_detection_designer.engine.bayesian_engine import (
    build_effective_observations,
    resolve_observation_weights,
    solo_posterior_pct,
)
from custom_components.presence_detection_designer.engine.evidence_snapshot import (
    RoomEvidenceSnapshot,
)
from custom_components.presence_detection_designer.engine.sensor_reliability import (
    temper_observation_dict_reliability,
)
from custom_components.presence_detection_designer.engine.state_machine import (
    RoomPresenceStateMachine,
)


@pytest.mark.requirement("BAYES-01", category="BAYESIAN", req_type="FailClosedGuardrail")
def test_bayesian_never_starts_occupancy_from_vacant_and_holds_when_occupied() -> None:
    """@requirement BAYES-01: RoomEvidenceSnapshot with only bayesian_occupied stays vacant, holds once occupied."""
    sm = RoomPresenceStateMachine(name="Office", inactivity_timeout=20, max_hold_timeout=120)
    sm.apply_evidence(
        RoomEvidenceSnapshot(
            bayesian_occupied=True,
            bayesian_probability=0.91,
            bayesian_probability_pct=91.0,
        ),
        now_ts=10.0,
    )
    assert sm.state == OccupancyState.VACANT
    assert sm.is_present is False

    # Direct trigger enters occupied_confirmed
    sm.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.office_desk_person_occupancy"}),
            camera_confirmed=True,
            bayesian_occupied=True,
            bayesian_probability=0.95,
            bayesian_probability_pct=95.0,
        ),
        now_ts=20.0,
    )
    assert sm.state == OccupancyState.OCCUPIED_CONFIRMED
    assert sm.verified_by == "camera"

    # Trigger clears while Bayesian stays >= threshold -> bounded occupied_holding
    sm.apply_evidence(
        RoomEvidenceSnapshot(
            bayesian_occupied=True,
            bayesian_probability=0.81,
            bayesian_probability_pct=81.0,
        ),
        now_ts=30.0,
    )
    assert sm.state == OccupancyState.OCCUPIED_HOLDING
    assert sm.verified_by == "bayesian"

    # Bounded liveness expires holding -> cooling -> vacant
    sm.advance_time(120.0, now_ts=150.0)
    assert sm.state == OccupancyState.OCCUPIED_COOLING
    sm.advance_time(20.0, now_ts=170.0)
    assert sm.state == OccupancyState.VACANT


@pytest.mark.requirement("BAYES-02", category="BAYESIAN", req_type="PositiveFeature")
def test_build_effective_observations_respects_explicit_list_without_clutter_injection() -> None:
    """@requirement BAYES-02: Explicit bayesian_observations blocks silent trigger/sustaining injection."""
    cfg = {
        CONF_ROOM_NAME: "Guest Room",
        CONF_TRIGGER_ENTITIES: [
            "binary_sensor.guest_room_motion_occupancy",
            "light.guest_room_fan_light",
        ],
        CONF_SUSTAINING_CONDITIONS: [
            {"entity_id": "switch.guest_room_nightstands", "state": "on"},
            {"entity_id": "media_player.guest_tv", "state": "playing"},
        ],
        CONF_BAYESIAN_OBSERVATIONS: [
            {"entity_id": "binary_sensor.guest_room_motion_occupancy", "preset": "strong"},
            {"entity_id": "binary_sensor.guest_room_motion_occupancy", "preset": "strong"},
        ],
    }
    obs = build_effective_observations(cfg)
    assert [o["entity_id"] for o in obs] == ["binary_sensor.guest_room_motion_occupancy"]

    # Empty bayesian_observations bootstrap skips non-exclusive triggers and demotes sustaining
    bootstrap_cfg = {
        CONF_ROOM_NAME: "Guest Room",
        CONF_TRIGGER_ENTITIES: [
            "binary_sensor.guest_room_motion_occupancy",
            "light.guest_room_fan_light",
        ],
        CONF_SUSTAINING_CONDITIONS: [{"entity_id": "switch.guest_room_nightstands", "state": "on"}],
    }
    boot = build_effective_observations(bootstrap_cfg)
    eids = {o["entity_id"]: o for o in boot}
    assert "light.guest_room_fan_light" not in eids
    assert "binary_sensor.guest_room_motion_occupancy" in eids
    assert eids["switch.guest_room_nightstands"]["preset"] == "supporting"
    assert eids["switch.guest_room_nightstands"].get("auto_signal_weight") is True


@pytest.mark.requirement("BAYES-03", category="BAYESIAN", req_type="PositiveFeature")
def test_single_pass_tempering_supporting_floor_and_store_cleanup(mock_hass) -> None:
    """@requirement BAYES-03: No double-tempering on cooldown_sec; 0.45->0.55 repair; dead 0.5/0.5 purged."""
    eco_motion = {
        "entity_id": "binary_sensor.office_motion",
        "preset": "moderate",
        "prob_given_true": 0.78,
        "prob_given_false": 0.08,
    }
    assert temper_observation_dict_reliability(eco_motion) is True
    assert eco_motion["cooldown_sec"] == 300.0
    assert eco_motion["cooldown_weighted"] == 300.0
    pt_once, pf_once = eco_motion["prob_given_true"], eco_motion["prob_given_false"]
    assert pt_once > 0.58 and pf_once < 0.32
    assert solo_posterior_pct(0.15, pt_once, pf_once) > 25.0

    # Runtime resolve must NOT temper a second time
    _, pt_rt, pf_rt = resolve_observation_weights(eco_motion)
    assert (pt_rt, pf_rt) == (pt_once, pf_once)
    # Second temper call is idempotent
    assert temper_observation_dict_reliability(eco_motion) is False

    # Legacy broken 0.45/0.20 supporting floor on Ecobee occupancy repairs cleanly to >= 0.50 positive lift
    eco_occ = {
        "entity_id": "binary_sensor.office_occupancy",
        "preset": "supporting",
        "prob_given_true": 0.45,
        "prob_given_false": 0.20,
    }
    assert temper_observation_dict_reliability(eco_occ) is True
    assert eco_occ["prob_given_true"] > 0.50
    assert eco_occ["prob_given_true"] > eco_occ["prob_given_false"]
    assert eco_occ["cooldown_weighted"] == 1800.0
    _, pt_occ_rt, pf_occ_rt = resolve_observation_weights(eco_occ)
    assert (pt_occ_rt, pf_occ_rt) == (eco_occ["prob_given_true"], eco_occ["prob_given_false"])
