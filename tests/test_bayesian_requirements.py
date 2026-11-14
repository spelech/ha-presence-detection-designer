"""Tests for BAYES-01..BAYES-04: Score/hold-only Bayesian, no double-tempering, explicit obs, and BLE penalties."""

from __future__ import annotations

import copy

import pytest

from custom_components.presence_detection_designer.bayesian_engine import (
    apply_contextual_bayesian_penalties,
    build_effective_observations,
    evaluate_bayesian,
    resolve_observation_weights,
    solo_posterior_pct,
)
from custom_components.presence_detection_designer.const import (
    CONF_BAYESIAN_OBSERVATIONS,
    CONF_BAYESIAN_PRIOR,
    CONF_BAYESIAN_THRESHOLD,
    CONF_ROOM_NAME,
    CONF_SUSTAINING_CONDITIONS,
    CONF_TRIGGER_ENTITIES,
    OccupancyState,
)
from custom_components.presence_detection_designer.evidence_snapshot import RoomEvidenceSnapshot
from custom_components.presence_detection_designer.sensor_reliability import (
    temper_observation_dict_reliability,
)
from custom_components.presence_detection_designer.state_machine import RoomPresenceStateMachine
from custom_components.presence_detection_designer.store import (
    DEFAULT_GLOBAL_SETTINGS,
    _default_store_data,
)
from custom_components.presence_detection_designer.store_migrations import (
    migrate_and_backfill_store_payload,
)
from tests.harness.virtual_ha import VirtualHAHarness


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
            active_triggers=frozenset({"binary_sensor.steves_desk_person_occupancy"}),
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

    # Migration purges 0.5/0.5 dead entries, duplicates, and stray penalize_when_off on cameras/PIRs
    payload = copy.deepcopy(_default_store_data())
    payload["rooms"] = {
        "guest_id": {
            CONF_ROOM_NAME: "Guest Room",
            CONF_BAYESIAN_PRIOR: 0.12,
            CONF_BAYESIAN_THRESHOLD: 0.75,
            CONF_BAYESIAN_OBSERVATIONS: [
                {
                    "entity_id": "binary_sensor.guest_room_motion_occupancy",
                    "preset": "strong",
                    "penalize_when_off": True,
                },
                {"entity_id": "binary_sensor.guest_room_motion_occupancy", "preset": "strong"},
                {
                    "entity_id": "light.guest_room_nightstands",
                    "preset": "strong",
                    "prob_given_true": 0.5,
                    "prob_given_false": 0.5,
                },
                {
                    "entity_id": "binary_sensor.guest_room_occupancy",
                    "preset": "supporting",
                    "prob_given_true": 0.45,
                    "prob_given_false": 0.20,
                },
            ],
        }
    }
    migrated, dirty = migrate_and_backfill_store_payload(
        mock_hass, payload, _default_store_data, DEFAULT_GLOBAL_SETTINGS
    )
    assert dirty is True
    g_obs = migrated["rooms"]["guest_id"][CONF_BAYESIAN_OBSERVATIONS]
    assert (
        len([o for o in g_obs if o["entity_id"] == "binary_sensor.guest_room_motion_occupancy"])
        == 1
    )
    assert not any(o["entity_id"] == "light.guest_room_nightstands" for o in g_obs)
    assert not any(o.get("penalize_when_off") for o in g_obs)
    occ_g = next(o for o in g_obs if o["entity_id"] == "binary_sensor.guest_room_occupancy")
    assert occ_g["prob_given_true"] > 0.50 and occ_g["prob_given_true"] > occ_g["prob_given_false"]

    migrated2, dirty2 = migrate_and_backfill_store_payload(
        mock_hass, migrated, _default_store_data, DEFAULT_GLOBAL_SETTINGS
    )
    assert dirty2 is False
    assert migrated2["rooms"]["guest_id"][CONF_BAYESIAN_OBSERVATIONS] == g_obs


@pytest.mark.requirement("BAYES-04", category="BAYESIAN", req_type="FailClosedGuardrail")
@pytest.mark.asyncio
async def test_asymmetric_negative_evidence_ble_confirmation_and_neutral_camera_pir(
    tmp_path,
) -> None:
    """@requirement BAYES-04: Camera/PIR off neutral; BLE penalizes only when destination room is corroborated."""
    rooms = [
        {
            CONF_ROOM_NAME: "Office",
            "mode": "open",
            "inactivity_timeout": 20,
            "pir_validation_enabled": False,
            CONF_TRIGGER_ENTITIES: ["binary_sensor.office_occupancy_occupancy"],
            CONF_BAYESIAN_PRIOR: 0.35,
            CONF_BAYESIAN_THRESHOLD: 0.75,
            CONF_BAYESIAN_OBSERVATIONS: [
                {
                    "entity_id": "binary_sensor.office_person_occupancy",
                    "preset": "supporting",
                    "penalize_when_off": True,
                },
                {
                    "entity_id": "binary_sensor.office_occupancy",
                    "preset": "supporting",
                    "prob_given_true": 0.62,
                    "prob_given_false": 0.28,
                    "cooldown_sec": 1800.0,
                    "cooldown_weighted": 1800.0,
                },
                {
                    "entity_id": "sensor.office_ups_used_watts_filtered",
                    "operator": "greater_than",
                    "state": "140",
                    "preset": "supporting",
                    "prob_given_true": 0.68,
                    "prob_given_false": 0.25,
                    "signal_weighted": "power_monitor",
                },
                {
                    "entity_id": "sensor.steve_s_s25_ble_area",
                    "operator": "equals",
                    "state": "Office",
                    "preset": "moderate",
                },
            ],
        },
        {
            CONF_ROOM_NAME: "Living Room",
            "mode": "open",
            "inactivity_timeout": 20,
            "pir_validation_enabled": False,
            CONF_TRIGGER_ENTITIES: ["binary_sensor.living_room_couch_person_occupancy"],
        },
        {
            CONF_ROOM_NAME: "Kitchen",
            "mode": "open",
            "inactivity_timeout": 20,
            "pir_validation_enabled": False,
            CONF_TRIGGER_ENTITIES: ["binary_sensor.kitchen_island_person_occupancy"],
        },
    ]

    with VirtualHAHarness(storage_dir=tmp_path) as harness:
        await harness.async_add_rooms(rooms)
        harness.set_state("binary_sensor.office_person_occupancy", "off")
        harness.set_state("binary_sensor.office_occupancy", "on")
        harness.set_state("sensor.office_ups_used_watts_filtered", "220")
        harness.set_state("sensor.steve_s_s25_ble_area", "Office")
        harness.set_state("binary_sensor.living_room_couch_person_occupancy", "off")
        harness.set_state("binary_sensor.kitchen_island_person_occupancy", "off")

        # Enter Office via PIR, then clear PIR -> Office holds on corroborated Bayesian (BLE + Ecobee + UPS)
        harness.set_state("binary_sensor.office_occupancy_occupancy", "on")
        office = harness.coordinators["Office"]
        assert office.state_machine.state == OccupancyState.OCCUPIED_CONFIRMED
        harness.set_state("binary_sensor.office_occupancy_occupancy", "off")
        assert office.state_machine.state == OccupancyState.OCCUPIED_HOLDING
        # Camera off stayed neutral (never penalized)
        cam_inact = next(
            o
            for o in office.last_bayesian_eval.inactive_observations
            if o["entity_id"] == "binary_sensor.office_person_occupancy"
        )
        assert cam_inact["likelihood_ratio"] == 1.0

        # BLE bleeds to Living Room (Living Room camera/PIR off -> uncorroborated!)
        harness.set_state("sensor.steve_s_s25_ble_area", "Living Room")
        assert office.last_bayesian_eval.is_occupied is True
        assert office.state_machine.state == OccupancyState.OCCUPIED_HOLDING
        ble_inact_unconf = next(
            o
            for o in office.last_bayesian_eval.inactive_observations
            if o["entity_id"] == "sensor.steve_s_s25_ble_area"
        )
        assert ble_inact_unconf["likelihood_ratio"] == 1.0

        # Watch BLE still in Office overrides S25 moving to confirmed Kitchen
        harness.set_state("sensor.steve_watch_ble_area", "Office")
        harness.set_state("sensor.steve_s_s25_ble_area", "Kitchen")
        harness.set_state("binary_sensor.kitchen_island_person_occupancy", "on")
        office._eval_bayesian_and_update()
        assert office.last_bayesian_eval.is_occupied is True

        # Once Watch also leaves Office (so Kitchen is confirmed & no BLE remains in Office), BLE penalizes Office
        harness.set_state("sensor.steve_watch_ble_area", "Kitchen")
        office._eval_bayesian_and_update()
        ble_inact_conf = next(
            o
            for o in office.last_bayesian_eval.inactive_observations
            if o["entity_id"] == "sensor.steve_s_s25_ble_area"
        )
        assert ble_inact_conf["likelihood_ratio"] < 0.35
        assert office.last_bayesian_eval.is_occupied is False
        assert office.state_machine.state == OccupancyState.OCCUPIED_COOLING

        # Guest Mode disables cross-room BLE penalty
        ctx_guest = apply_contextual_bayesian_penalties(
            office.bayesian_observations,
            room_name="Office",
            spatial_frame=office._last_spatial_frame,
            hass=harness.hass,
            guest_mode_enabled=True,
        )
        ble_obs_guest = next(
            o for o in ctx_guest if o["entity_id"] == "sensor.steve_s_s25_ble_area"
        )
        assert ble_obs_guest["penalize_when_off"] is False
        ev_guest = evaluate_bayesian(ctx_guest, harness.hass.states.get, prior=0.35, threshold=0.75)
        assert ev_guest.is_occupied is True
