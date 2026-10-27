"""Tests for negative-space spatial inference and whole-house timeline reconstruction."""

from __future__ import annotations

from custom_components.presence_detection_designer.spatial_inference import (
    evaluate_spatial_frame,
    reconstruct_house_timeline,
)
from custom_components.presence_detection_designer.spatial_topology import (
    compile_floorplan_topology,
    get_default_floorplan,
)


def test_positive_subzone_localization() -> None:
    """Active Frigate sub-zone localizes directly to the sub-zone 2D box."""
    fp = get_default_floorplan()
    compiled = compile_floorplan_topology(fp)

    states = {
        "binary_sensor.steves_desk_person_occupancy": "on",
        "binary_sensor.office_person_occupancy": "on",
    }
    frame = evaluate_spatial_frame(
        floorplan=fp,
        compiled_topology=compiled,
        state_getter=lambda eid: states.get(eid, "off"),
        now_ts=1000.0,
        negative_space_enabled=True,
    )

    office_est = frame["room_estimates"]["Office"]
    assert office_est["occupied"] is True
    assert "Steve's Desk" in (office_est["inferred_subregion"] or "")
    # Steve's Desk sub-zone is at x=725..835, y=360..455 -> center ~(780, 407.5)
    assert 725 <= office_est["inferred_x"] <= 835
    assert 360 <= office_est["inferred_y"] <= 455


def test_negative_space_uncovered_subregion_in_kitchen() -> None:
    """When Kitchen has BLE/entry evidence but camera.kitchen (Island cone) is off, localize to uncovered counter."""
    fp = get_default_floorplan()
    compiled = compile_floorplan_topology(fp)

    # Step 1: Person enters Kitchen via Kitchen Entryway
    states_t1 = {
        "binary_sensor.kitchen_entryway_person_occupancy": "on",
        "sensor.steve_fold_ble_area": "Kitchen",
        "binary_sensor.kitchen_person_occupancy": "on",
        "binary_sensor.kitchen_island_person_occupancy": "off",
    }
    frame_t1 = evaluate_spatial_frame(
        floorplan=fp,
        compiled_topology=compiled,
        state_getter=lambda eid: states_t1.get(eid, "off"),
        now_ts=1000.0,
        negative_space_enabled=True,
    )

    # Step 2: Person moves to the north prep counter (outside camera.kitchen Island cone);
    # camera.kitchen and camera.family_room and camera.living_room are all OFF, BLE still in Kitchen.
    states_t2 = {
        "binary_sensor.kitchen_entryway_person_occupancy": "off",
        "binary_sensor.kitchen_person_occupancy": "off",
        "binary_sensor.kitchen_island_person_occupancy": "off",
        "binary_sensor.family_room_person_occupancy": "off",
        "binary_sensor.living_room_person_occupancy": "off",
        "sensor.steve_fold_ble_area": "Kitchen",
    }
    frame_on = evaluate_spatial_frame(
        floorplan=fp,
        compiled_topology=compiled,
        state_getter=lambda eid: states_t2.get(eid, "off"),
        prev_frame=frame_t1,
        now_ts=1030.0,
        negative_space_enabled=True,
    )
    frame_off = evaluate_spatial_frame(
        floorplan=fp,
        compiled_topology=compiled,
        state_getter=lambda eid: states_t2.get(eid, "off"),
        prev_frame=frame_t1,
        now_ts=1030.0,
        negative_space_enabled=False,
    )

    k_on = frame_on["room_estimates"]["Kitchen"]
    k_off = frame_off["room_estimates"]["Kitchen"]

    assert k_on["probability_boost"] > 0.0
    assert k_off["probability_boost"] == 0.0
    assert "camera.family_room" in k_on["negative_exclusions"]
    assert k_on["inferred_subregion"] is not None
    assert "Uncovered" in k_on["inferred_subregion"] or "Prep" in k_on["inferred_subregion"]


def test_negative_space_blind_pocket_master_bathroom() -> None:
    """Crossing master_bathroom_person_occupancy then clearing Master Bedroom camera holds Master Bathroom."""
    fp = get_default_floorplan()
    compiled = compile_floorplan_topology(fp)

    # T1: Person seen at Master Bathroom doorway zone on camera.master_bedroom
    states_t1 = {
        "binary_sensor.master_bathroom_person_occupancy": "on",
        "binary_sensor.master_bedroom_person_occupancy": "on",
    }
    frame_t1 = evaluate_spatial_frame(
        floorplan=fp,
        compiled_topology=compiled,
        state_getter=lambda eid: states_t1.get(eid, "off"),
        now_ts=2000.0,
        negative_space_enabled=True,
    )

    # T2: Doorway sensor and Master Bedroom camera both go OFF; Upstairs Hallway is also OFF.
    # The person must be inside the Master Bathroom blind pocket!
    states_t2 = {
        "binary_sensor.master_bathroom_person_occupancy": "off",
        "binary_sensor.master_bedroom_person_occupancy": "off",
        "binary_sensor.master_bed_person_occupancy": "off",
        "binary_sensor.upstairs_hallway_motion": "off",
    }
    frame_on = evaluate_spatial_frame(
        floorplan=fp,
        compiled_topology=compiled,
        state_getter=lambda eid: states_t2.get(eid, "off"),
        prev_frame=frame_t1,
        now_ts=2045.0,
        negative_space_enabled=True,
    )
    frame_off = evaluate_spatial_frame(
        floorplan=fp,
        compiled_topology=compiled,
        state_getter=lambda eid: states_t2.get(eid, "off"),
        prev_frame=frame_t1,
        now_ts=2045.0,
        negative_space_enabled=False,
    )

    mbath_on = frame_on["room_estimates"]["Master Bathroom"]
    mbath_off = frame_off["room_estimates"]["Master Bathroom"]

    assert mbath_on["should_hold_occupied"] is True
    assert mbath_on["probability_boost"] >= 0.25
    assert "camera.master_bedroom" in mbath_on["negative_exclusions"]
    assert mbath_off["should_hold_occupied"] is False
    assert mbath_off["probability_boost"] == 0.0


def test_reconstruct_house_timeline_ab_comparison() -> None:
    """Whole-house timeline reconstructs movement across rooms and blind pockets."""
    fp = get_default_floorplan()
    entity_timelines = {
        "binary_sensor.office_desk_person_occupancy": [
            (1000.0, "on"),
            (1060.0, "off"),
        ],
        "binary_sensor.office_person_occupancy": [
            (1000.0, "on"),
            (1060.0, "off"),
        ],
        "binary_sensor.upstairs_hallway_motion": [
            (1062.0, "on"),
            (1075.0, "off"),
        ],
        "binary_sensor.master_bedroom_person_occupancy": [
            (1075.0, "on"),
            (1110.0, "off"),
        ],
        "binary_sensor.master_bathroom_person_occupancy": [
            (1100.0, "on"),
            (1110.0, "off"),
        ],
    }

    res_on = reconstruct_house_timeline(
        floorplan=fp,
        room_configs={},
        entity_timelines=entity_timelines,
        start_ts=1000.0,
        end_ts=1200.0,
        negative_space_enabled=True,
    )
    res_off = reconstruct_house_timeline(
        floorplan=fp,
        room_configs={},
        entity_timelines=entity_timelines,
        start_ts=1000.0,
        end_ts=1200.0,
        negative_space_enabled=False,
    )

    assert res_on["negative_space_enabled"] is True
    assert res_off["negative_space_enabled"] is False
    assert len(res_on["frames"]) >= 4
    assert len(res_on["transitions"]) >= 3

    # At t=1110+, with negative_space_enabled=True, Master Bathroom remains occupied via negative space
    final_frame_on = res_on["frames"][-1]
    final_frame_off = res_off["frames"][-1]
    assert "Master Bathroom" in final_frame_on["active_rooms"]
    assert "Master Bathroom" not in final_frame_off["active_rooms"]
    assert res_on["comparison_summary"]["blind_pocket_holds_count"] >= 1


def test_moving_shades_and_sunlight_exclusion_vs_corroborated_pir():
    """Verify moving shades / open window sun transients are excluded unless corroborated by thermal PIR or BLE."""
    fp = get_default_floorplan()
    compiled = compile_floorplan_topology(fp, {})

    # 1. Afternoon sun + moving bedside_shade triggers master_bed & master_bedroom_walkway while PIR is off
    uncorroborated_states = {
        "cover.bedside_shade": "moving",
        "binary_sensor.master_bed_person_occupancy": "on",
        "binary_sensor.master_bedroom_walkway_person_occupancy": "on",
        "binary_sensor.master_bedroom_person_occupancy": "on",
        "binary_sensor.master_bedroom_motion": "off",
        "binary_sensor.master_open_area_person_occupancy": "off",
    }
    frame_excluded = evaluate_spatial_frame(
        floorplan=fp,
        compiled_topology=compiled,
        state_getter=lambda eid: uncorroborated_states.get(eid, "off"),
        prev_frame=None,
        now_ts=2000.0,
        negative_space_enabled=True,
    )
    mb_est = frame_excluded["room_estimates"]["Master Bedroom"]
    assert mb_est["occupied"] is False
    assert "binary_sensor.master_bed_person_occupancy" in mb_est["shade_sunlight_excluded_entities"]
    assert "Excluded moving-shade / sunlight transient" in mb_est["explanation"]

    # When negative_space_enabled=False, baseline accepts the raw sub-zone trigger
    frame_baseline = evaluate_spatial_frame(
        floorplan=fp,
        compiled_topology=compiled,
        state_getter=lambda eid: uncorroborated_states.get(eid, "off"),
        prev_frame=None,
        now_ts=2000.0,
        negative_space_enabled=False,
    )
    assert frame_baseline["room_estimates"]["Master Bedroom"]["occupied"] is True

    # 2. When physical thermal PIR (binary_sensor.master_bedroom_motion) is ON, Master Bed IS corroborated
    corroborated_states = dict(uncorroborated_states)
    corroborated_states["binary_sensor.master_bedroom_motion"] = "on"
    frame_corroborated = evaluate_spatial_frame(
        floorplan=fp,
        compiled_topology=compiled,
        state_getter=lambda eid: corroborated_states.get(eid, "off"),
        prev_frame=None,
        now_ts=2010.0,
        negative_space_enabled=True,
    )
    mb_corr_est = frame_corroborated["room_estimates"]["Master Bedroom"]
    assert mb_corr_est["occupied"] is True
    assert mb_corr_est["shade_sunlight_excluded_entities"] == []


def test_replay_comparison_eliminates_moving_shade_false_positives():
    """Verify single-room What-If Replay eliminates moving-shade false positives when negative_space_enabled is toggled on."""
    from custom_components.presence_detection_designer.replay_engine import (
        simulate_replay_comparison,
    )

    base_cfg = {
        "room_name": "Master Bedroom",
        "mode": "open",
        "bayesian_enabled": True,
        "bayesian_prior": 0.15,
        "bayesian_threshold": 0.75,
        "inactivity_timeout": 60,
        "negative_space_enabled": False,
        "trigger_entities": ["binary_sensor.master_bed_person_occupancy"],
        "bayesian_observations": [
            {
                "entity_id": "binary_sensor.master_bed_person_occupancy",
                "preset": "decisive",
            },
            {
                "entity_id": "binary_sensor.master_bedroom_motion",
                "preset": "moderate",
            },
        ],
    }
    cand_cfg = dict(base_cfg, negative_space_enabled=True)

    timelines = {
        "cover.bedside_shade": [
            {"ts": 1000.0, "state": "moving", "attributes": {"is_moving": True}},
            {"ts": 1300.0, "state": "open", "attributes": {"is_moving": False}},
        ],
        "binary_sensor.master_bed_person_occupancy": [
            {"ts": 1000.0, "state": "off", "attributes": {}},
            {"ts": 1020.0, "state": "on", "attributes": {}},
            {"ts": 1080.0, "state": "off", "attributes": {}},
        ],
        "binary_sensor.master_bedroom_motion": [
            {"ts": 1000.0, "state": "off", "attributes": {}},
        ],
    }

    comp = simulate_replay_comparison(base_cfg, cand_cfg, timelines, 1000.0, 1300.0)
    assert comp["baseline"]["summary"]["occupied_minutes"] > 0.0
    assert comp["candidate"]["summary"]["occupied_minutes"] == 0.0
    assert comp["deltas"]["false_positive_eliminated_minutes"] > 0.0
