"""Unit & integration tests for the production Coupled Continuous-Time Log-Odds HMM cutover."""

from __future__ import annotations

from pathlib import Path

import pytest

from custom_components.presence_detection_designer.const import OccupancyState
from custom_components.presence_detection_designer.hmm_engine import DEFAULT_HMM_PARAMS
from custom_components.presence_detection_designer.store import DEFAULT_GLOBAL_SETTINGS
from tests.golden.floorplan_snapshot import HOUSE_ROOM_CONFIGS, load_golden_floorplan
from tests.harness.virtual_ha import VirtualHAHarness


def test_default_global_settings_use_coupled_hmm() -> None:
    """Production defaults must activate the winning Coupled Log-Odds HMM (ref_04)."""
    assert "hmm_params" in DEFAULT_GLOBAL_SETTINGS
    assert DEFAULT_HMM_PARAMS["theta_enter"] == pytest.approx(0.61440, abs=1e-4)
    assert DEFAULT_HMM_PARAMS["hysteresis_gap"] == pytest.approx(0.10853, abs=1e-4)


@pytest.mark.asyncio
async def test_production_hmm_entity_confidence_and_spillover_thresholds(tmp_path: Path) -> None:
    """Entities expose calibrated confidence tiers and elevated spillover lighting thresholds."""
    fp = load_golden_floorplan()
    with VirtualHAHarness(storage_dir=tmp_path, start_ts=1795650000.0) as harness:
        await harness.async_add_rooms(HOUSE_ROOM_CONFIGS, floorplan=fp)
        harness.advance(1.0)

        # Kitchen has 31% spillover into Front Entry -> higher recommended lighting threshold
        k_attrs = harness.prob_sensors["Kitchen"].extra_state_attributes
        o_attrs = harness.prob_sensors["Office"].extra_state_attributes
        assert k_attrs["inference_engine"] == "coupled_hmm"
        assert k_attrs["spillover_exposure_pct"] >= 20.0
        assert k_attrs["recommended_lighting_threshold_pct"] == pytest.approx(80.0, abs=0.1)
        assert k_attrs["meets_lighting_threshold"] is False
        assert o_attrs["recommended_lighting_threshold_pct"] == pytest.approx(61.4, abs=0.2)
        assert o_attrs["confidence_tier"] == "vacant"

        # Camera person detection in Family Room elevates confidence & meets lighting threshold
        harness.set_state("binary_sensor.family_room_floor_person_occupancy", "on")
        harness.advance(1.0)
        harness.advance(1.0)
        fr_bin = harness.binary_sensors["Family Room"]
        fr_prob = harness.prob_sensors["Family Room"]
        assert fr_bin.is_on is True
        assert fr_prob.native_value >= 80.0
        assert fr_bin.extra_state_attributes["meets_lighting_threshold"] is True
        assert fr_bin.extra_state_attributes["confidence_tier"] in ("occupied", "high_confidence")


@pytest.mark.asyncio
async def test_production_hmm_pet_exclusion_and_override_guardrails(tmp_path: Path) -> None:
    """Dog-only motion never occupies open-plan rooms, and manual OVERRIDE stays locked."""
    fp = load_golden_floorplan()
    with VirtualHAHarness(storage_dir=tmp_path, start_ts=1795650000.0) as harness:
        await harness.async_add_rooms(HOUSE_ROOM_CONFIGS, floorplan=fp)
        harness.set_state("binary_sensor.living_room_dog_occupancy", "on")
        harness.set_state("binary_sensor.dining_room_motion_occupancy", "on")
        for _ in range(5):
            harness.advance(1.0)
        assert harness.coordinators["Dining Room"].state_machine.is_present is False
        assert harness.coordinators["Living Room"].state_machine.is_present is False

        # Manual override stays locked even when HMM belief is vacant
        office = harness.coordinators["Office"]
        office.state_machine.set_override(True, now_ts=harness.clock.now())
        for _ in range(5):
            harness.advance(1.0)
        assert office.state_machine.state == OccupancyState.OVERRIDE
        assert office.state_machine.is_present is True


def test_playback_suppresses_impossible_cross_floor_teleports() -> None:
    """Simultaneous multi-floor occupancy and rapid non-adjacent cross-floor jumps do not draw fake moves."""
    from custom_components.presence_detection_designer.timeline_reconstructor import (
        reconstruct_house_timeline,
    )

    fp = load_golden_floorplan()
    room_cfgs = {r["room_name"]: r for r in HOUSE_ROOM_CONFIGS}
    start_ts = 1795650000.0
    # Master Bedroom (upstairs) is occupied at t=0; Living Room (main) turns on at t=5 while
    # Master Bedroom is STILL occupied (separate occupant / vertical BLE bounce).
    coord_logs = {
        "Master Bedroom": [
            {
                "ts": start_ts + 1.0,
                "is_present": True,
                "occupancy_state": "occupied_confirmed",
                "probability_pct": 92.0,
                "verified_by": "camera",
                "camera_confirmed": True,
                "entity_states": {"sensor.steve_s_s25_ble_area": "Master Bedroom"},
            }
        ],
        "Living Room": [
            {
                "ts": start_ts + 5.0,
                "is_present": True,
                "occupancy_state": "occupied_confirmed",
                "probability_pct": 88.0,
                "verified_by": "camera",
                "camera_confirmed": True,
                "entity_states": {"sensor.steve_s_s25_ble_area": "Living Room"},
            }
        ],
    }
    res = reconstruct_house_timeline(
        floorplan=fp,
        room_configs=room_cfgs,
        entity_timelines={},
        start_ts=start_ts,
        end_ts=start_ts + 20.0,
        coordinator_timelines=coord_logs,
    )
    lr_txs = [t for t in res["transitions"] if t["to_room"] == "Living Room"]
    assert lr_txs
    assert lr_txs[0]["from_room"] is None
    assert lr_txs[0]["from_floor"] is None


def test_webos_media_player_on_matches_playing_sustain_condition():
    """LG webOS HDMI displays report 'on' instead of 'playing' and must still sustain occupancy."""
    from custom_components.presence_detection_designer.hmm_engine import _eval_condition

    assert (
        _eval_condition(
            "on", "equals", "playing", entity_id="media_player.living_room_display_webos"
        )
        is True
    )
    assert (
        _eval_condition(
            "playing", "equals", "playing", entity_id="media_player.living_room_display_webos"
        )
        is True
    )
    assert (
        _eval_condition(
            "off", "equals", "playing", entity_id="media_player.living_room_display_webos"
        )
        is False
    )
    assert (
        _eval_condition(
            "idle", "equals", "playing", entity_id="media_player.living_room_display_webos"
        )
        is False
    )
    assert (
        _eval_condition(
            "on", "in", "on,playing", entity_id="media_player.living_room_display_webos"
        )
        is True
    )
    assert (
        _eval_condition(
            "on", "not_equals", "off", entity_id="media_player.living_room_display_webos"
        )
        is True
    )
