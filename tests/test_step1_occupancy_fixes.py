"""Regression tests for Step 1 room-occupation and categorical whole-house presence mode fixes."""

from __future__ import annotations

import time
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from custom_components.presence_detection_designer.condition_evaluator import is_state_stale
from custom_components.presence_detection_designer.const import (
    CONF_BAYESIAN_OBSERVATIONS,
    CONF_CONNECTED_ROOMS,
    CONF_MODE,
    CONF_PIR_VALIDATION_ENABLED,
    CONF_ROOM_NAME,
    CONF_SUSTAINING_CONDITIONS,
    CONF_TRIGGER_ENTITIES,
    DATA_STORE,
    DOMAIN,
    Mode,
    OccupancyState,
)
from custom_components.presence_detection_designer.coordinator import RoomPresenceCoordinator
from custom_components.presence_detection_designer.evidence_snapshot import RoomEvidenceSnapshot
from custom_components.presence_detection_designer.floorplan_presets import get_default_floorplan
from custom_components.presence_detection_designer.house_perimeter import HousePerimeterTracker


def test_is_state_stale_ignores_mqtt_timestamps_and_only_flags_restored() -> None:
    """Old MQTT/Zigbee timestamp or last_seen attributes (>60s) must never suppress valid live HA states."""
    old_ts = time.time() - 7200.0
    zigbee_live = SimpleNamespace(
        state="on",
        attributes={"timestamp": old_ts, "last_seen": "2020-01-01T00:00:00Z"},
    )
    assert is_state_stale(zigbee_live, max_age_seconds=60.0) is False

    restored_state = SimpleNamespace(state="on", attributes={"restored": True})
    assert is_state_stale(restored_state, max_age_seconds=60.0) is True
    assert is_state_stale(None) is True


@pytest.mark.anyio
async def test_excluded_floorplan_sensors_never_occupy_vacant_room(mock_hass) -> None:
    """Sensors present on the floorplan but excluded from trigger_entities must never start occupancy."""
    store = MagicMock()
    store.global_settings = {
        "negative_space_enabled": False,
        "guest_mode_enabled": False,
        "ble_decider_enabled": False,
    }
    store.get_floorplan = MagicMock(return_value=get_default_floorplan())
    mock_hass.data[DOMAIN] = {DATA_STORE: store}

    active_floorplan_sensors = {
        "binary_sensor.office_person_occupancy": "on",
        "binary_sensor.office_motion": "on",
        "binary_sensor.laundry_room_ring_motion": "on",
    }
    mock_hass.states.get = MagicMock(
        side_effect=lambda eid: SimpleNamespace(
            state=active_floorplan_sensors.get(eid, "off"),
            attributes={},
        )
    )

    office = RoomPresenceCoordinator(
        mock_hass,
        "entry_office",
        {
            CONF_ROOM_NAME: "Office",
            CONF_MODE: str(Mode.OPEN),
            CONF_PIR_VALIDATION_ENABLED: False,
            CONF_TRIGGER_ENTITIES: ["binary_sensor.office_motion_occupancy"],
            CONF_BAYESIAN_OBSERVATIONS: [
                {"entity_id": "binary_sensor.office_person_occupancy", "preset": "decisive"}
            ],
        },
    )
    laundry = RoomPresenceCoordinator(
        mock_hass,
        "entry_laundry",
        {
            CONF_ROOM_NAME: "Laundry Room",
            CONF_MODE: str(Mode.OPEN),
            CONF_PIR_VALIDATION_ENABLED: False,
            CONF_TRIGGER_ENTITIES: [],
        },
    )
    mock_hass.data[DOMAIN]["entry_office"] = office
    mock_hass.data[DOMAIN]["entry_laundry"] = laundry

    office.async_refresh_all_states()
    laundry.async_refresh_all_states()

    assert office.state_machine.state == OccupancyState.VACANT
    assert office.state_machine.is_present is False
    assert laundry.state_machine.state == OccupancyState.VACANT
    assert laundry.state_machine.is_present is False


def test_pir_latched_room_clears_immediately_on_adjacent_handoff_while_camera_blocks(
    mock_hass,
) -> None:
    """@requirement STATE-06: Latched PIR trigger clears on adjacent handoff, while camera/conditions block handoff."""
    mock_hass.data[DOMAIN] = {}
    living = RoomPresenceCoordinator(
        mock_hass,
        "entry_living",
        {
            CONF_ROOM_NAME: "Living Room",
            CONF_MODE: str(Mode.OPEN),
            CONF_PIR_VALIDATION_ENABLED: False,
            CONF_CONNECTED_ROOMS: ["Kitchen"],
            CONF_TRIGGER_ENTITIES: ["binary_sensor.living_room_motion"],
        },
    )
    kitchen = RoomPresenceCoordinator(
        mock_hass,
        "entry_kitchen",
        {
            CONF_ROOM_NAME: "Kitchen",
            CONF_MODE: str(Mode.OPEN),
            CONF_PIR_VALIDATION_ENABLED: False,
            CONF_CONNECTED_ROOMS: ["Living Room"],
            CONF_TRIGGER_ENTITIES: ["binary_sensor.kitchen_island_person_occupancy"],
        },
    )
    mock_hass.data[DOMAIN]["entry_living"] = living
    mock_hass.data[DOMAIN]["entry_kitchen"] = kitchen

    # 1. Living Room is OCCUPIED_CONFIRMED with its hardware PIR still latched ON
    living._active_triggers.add("binary_sensor.living_room_motion")
    living._last_trigger_entity = "binary_sensor.living_room_motion"
    living._sync_state_machine_evidence()
    assert living.state_machine.state == OccupancyState.OCCUPIED_CONFIRMED

    # Adjacent Kitchen detects occupancy -> Living Room clears immediately despite latched PIR
    assert living.notify_adjacent_occupancy("Kitchen") is True
    assert living.state_machine.state == OccupancyState.VACANT
    assert "binary_sensor.living_room_motion" not in living._active_triggers

    # 2. Kitchen is OCCUPIED_CONFIRMED via AI camera person trigger -> handoff MUST NOT clear Kitchen
    kitchen._active_triggers.add("binary_sensor.kitchen_island_person_occupancy")
    kitchen._last_trigger_entity = "binary_sensor.kitchen_island_person_occupancy"
    kitchen._sync_state_machine_evidence()
    assert kitchen.state_machine.state == OccupancyState.OCCUPIED_CONFIRMED
    assert kitchen.notify_adjacent_occupancy("Living Room") is False
    assert kitchen.state_machine.state == OccupancyState.OCCUPIED_CONFIRMED

    # 3. Sustaining condition also blocks handoff clearing
    living_with_cond = RoomPresenceCoordinator(
        mock_hass,
        "entry_living_tv",
        {
            CONF_ROOM_NAME: "Family Room",
            CONF_MODE: str(Mode.OPEN),
            CONF_PIR_VALIDATION_ENABLED: False,
            CONF_TRIGGER_ENTITIES: ["binary_sensor.family_room_motion"],
            CONF_SUSTAINING_CONDITIONS: [],
        },
    )
    living_with_cond._active_triggers.add("binary_sensor.family_room_motion")
    living_with_cond._active_condition_descs = ["media_player.tv == playing"]
    living_with_cond._sync_state_machine_evidence()
    assert living_with_cond.state_machine.state == OccupancyState.OCCUPIED_CONFIRMED
    assert living_with_cond.notify_adjacent_occupancy("Kitchen") is False
    assert living_with_cond.state_machine.state == OccupancyState.OCCUPIED_CONFIRMED


def test_categorical_house_modes_dog_letout_and_pet_only_resolution(mock_hass) -> None:
    """Verify strictly categorical vacant/occupied/guest/pet_only modes and multi-room dog let-out safety."""
    office = RoomPresenceCoordinator(
        mock_hass,
        "entry_office",
        {
            CONF_ROOM_NAME: "Office",
            CONF_MODE: str(Mode.OPEN),
            CONF_PIR_VALIDATION_ENABLED: False,
            CONF_TRIGGER_ENTITIES: ["binary_sensor.office_motion_occupancy"],
        },
    )
    kitchen = RoomPresenceCoordinator(
        mock_hass,
        "entry_kitchen",
        {
            CONF_ROOM_NAME: "Kitchen",
            CONF_MODE: str(Mode.OPEN),
            CONF_PIR_VALIDATION_ENABLED: False,
            CONF_TRIGGER_ENTITIES: ["binary_sensor.kitchen_motion"],
        },
    )
    store = MagicMock()
    store.global_settings = {
        "house_occupancy_mode": "occupied",
        "house_occupant_count": 1,
        "guest_mode_enabled": False,
    }
    mock_hass.data[DOMAIN] = {
        DATA_STORE: store,
        "entry_office": office,
        "entry_kitchen": kitchen,
    }
    dog_active = {"on": False}
    mock_hass.states.get = MagicMock(
        side_effect=lambda eid: SimpleNamespace(
            state="on" if (dog_active["on"] and "dog" in eid) else "off",
            attributes={},
        )
    )

    tracker = HousePerimeterTracker(mock_hass)
    assert tracker.state.mode == "occupied"
    assert tracker.state.count == 1

    # Both Office and Kitchen are occupied; letting the dog out Kitchen's back_door must NOT vacate house
    office.state_machine.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.office_motion_occupancy"}),
            human_present=True,
        )
    )
    kitchen.state_machine.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.kitchen_motion"}),
            human_present=True,
        )
    )
    tracker.handle_door_state_change("binary_sensor.back_door", True, now_ts=100.0)
    rec = tracker.handle_door_state_change("binary_sensor.back_door", False, now_ts=105.0)
    assert rec is not None and rec.vector == "ambiguous"
    assert tracker.state.mode == "occupied"
    assert tracker.state.count == 1

    # Once Office clears and Riley (dog) is detected inside, exiting Kitchen resolves to pet_only (count=0)
    office.state_machine.force_clear(reason="test")
    dog_active["on"] = True
    tracker.handle_door_state_change("binary_sensor.back_door", True, now_ts=200.0)
    rec_exit = tracker.handle_door_state_change("binary_sensor.back_door", False, now_ts=205.0)
    assert rec_exit is not None and rec_exit.vector == "egress"
    assert tracker.state.mode == "pet_only"
    assert tracker.state.count == 0

    # Returning home through front_door transitions pet_only -> occupied (count=1)
    kitchen.state_machine.force_clear(reason="test")
    tracker.handle_door_state_change("binary_sensor.front_door", True, now_ts=300.0)
    rec_return = tracker.handle_door_state_change("binary_sensor.front_door", False, now_ts=304.0)
    assert rec_return is not None and rec_return.vector == "ingress"
    assert tracker.state.mode == "occupied"
    assert tracker.state.count == 1


@pytest.mark.requirement("GUARD-07", category="GUARD", req_type="FailClosedGuardrail")
def test_garage_does_not_latch_on_uncovered_subregion_after_sensors_clear(mock_hass) -> None:
    """Verify camera rooms (like Garage) go to normal occupied_cooling when sensors clear instead of latching on uncovered-subregion negative space."""
    from custom_components.presence_detection_designer.spatial_inference import (
        evaluate_spatial_frame,
    )

    fp = get_default_floorplan()
    # T1: Person is in Garage
    states_t1 = {
        "binary_sensor.garage_parking_person_occupancy": "on",
        "binary_sensor.garage_ring_motion": "on",
        "cover.garage_door": "open",
    }
    frame_t1 = evaluate_spatial_frame(
        floorplan=fp,
        state_getter=lambda eid: states_t1.get(eid, "off"),
        now_ts=1000.0,
        negative_space_enabled=True,
        ble_decider_enabled=False,
    )
    assert frame_t1["room_estimates"]["Garage"]["occupied"] is True

    # T2: Garage door closes and all Garage sensors clear
    states_t2 = {
        "binary_sensor.garage_parking_person_occupancy": "off",
        "binary_sensor.garage_person_occupancy": "off",
        "binary_sensor.garage_ring_motion": "off",
        "cover.garage_door": "closed",
    }
    frame_t2 = evaluate_spatial_frame(
        floorplan=fp,
        state_getter=lambda eid: states_t2.get(eid, "off"),
        prev_frame=frame_t1,
        now_ts=1015.0,
        negative_space_enabled=True,
        ble_decider_enabled=False,
    )
    garage_est = frame_t2["room_estimates"]["Garage"]
    assert garage_est["occupied"] is False
    assert garage_est["should_hold_occupied"] is False

    # Verify Garage coordinator enters OCCUPIED_COOLING (not OCCUPIED_HOLDING) when triggers clear
    store = MagicMock()
    store.global_settings = {
        "negative_space_enabled": True,
        "guest_mode_enabled": False,
        "ble_decider_enabled": False,
    }
    store.get_floorplan = MagicMock(return_value=fp)
    mock_hass.data[DOMAIN] = {DATA_STORE: store}

    live_states = dict(states_t1)
    mock_hass.states.get = MagicMock(
        side_effect=lambda eid: SimpleNamespace(
            state=live_states.get(eid, "off"),
            attributes={},
        )
    )
    garage_coord = RoomPresenceCoordinator(
        mock_hass,
        "entry_garage",
        {
            CONF_ROOM_NAME: "Garage",
            CONF_MODE: str(Mode.BOUNDED),
            CONF_PIR_VALIDATION_ENABLED: False,
            CONF_TRIGGER_ENTITIES: [
                "binary_sensor.garage_parking_person_occupancy",
                "binary_sensor.garage_ring_motion",
            ],
            CONF_BAYESIAN_OBSERVATIONS: [
                {"entity_id": "binary_sensor.garage_parking_person_occupancy", "preset": "decisive"}
            ],
        },
    )
    mock_hass.data[DOMAIN]["entry_garage"] = garage_coord
    garage_coord.async_refresh_all_states()
    assert garage_coord.state_machine.state == OccupancyState.OCCUPIED_CONFIRMED

    # Clear sensors -> goes straight to OCCUPIED_COOLING (normal cooldown)
    live_states.update(states_t2)
    garage_coord.async_refresh_all_states()
    assert garage_coord.state_machine.state == OccupancyState.OCCUPIED_COOLING
    assert garage_coord.state_machine.snapshot.spatial_blind_pocket_hold is False


@pytest.mark.requirement("SPATIAL-02", category="SPATIAL", req_type="PositiveFeature")
def test_master_bathroom_blind_pocket_releases_on_credible_transition_and_no_self_refresh() -> None:
    """Verify Master Bathroom blind pocket does not refresh its own entry timestamp and clears when occupant credibly transitions to another room."""
    from custom_components.presence_detection_designer.spatial_inference import (
        evaluate_spatial_frame,
    )

    fp = get_default_floorplan()
    # 1. Parent room activity alone (without Master Bathroom entry) does NOT start a Master Bathroom blind pocket
    states_bedroom_only = {
        "binary_sensor.master_bedroom_person_occupancy": "on",
    }
    f_bed = evaluate_spatial_frame(
        floorplan=fp,
        state_getter=lambda eid: states_bedroom_only.get(eid, "off"),
        now_ts=1000.0,
        negative_space_enabled=True,
    )
    f_bed_clear = evaluate_spatial_frame(
        floorplan=fp,
        state_getter=lambda _eid: "off",
        prev_frame=f_bed,
        now_ts=1010.0,
        negative_space_enabled=True,
    )
    assert f_bed_clear["room_estimates"]["Master Bathroom"]["occupied"] is False
    assert f_bed_clear["room_estimates"]["Master Bathroom"]["should_hold_occupied"] is False

    # 2. Actual Master Bathroom entry starts blind pocket hold, and holding does NOT overwrite recent_activity_ts
    states_bath_entry = {
        "binary_sensor.master_bathroom_motion_occupancy": "on",
    }
    f_bath1 = evaluate_spatial_frame(
        floorplan=fp,
        state_getter=lambda eid: states_bath_entry.get(eid, "off"),
        now_ts=2000.0,
        negative_space_enabled=True,
    )
    f_bath_hold = evaluate_spatial_frame(
        floorplan=fp,
        state_getter=lambda _eid: "off",
        prev_frame=f_bath1,
        now_ts=2060.0,
        negative_space_enabled=True,
    )
    assert f_bath_hold["room_estimates"]["Master Bathroom"]["should_hold_occupied"] is True
    assert f_bath_hold["recent_activity_ts"]["Master Bathroom"] == 2000.0

    # 3. Occupant walks downstairs and triggers Living Room 45s later -> credible Taxicab transition releases Master Bathroom hold
    states_downstairs = {
        "binary_sensor.living_room_person_occupancy": "on",
    }
    f_downstairs = evaluate_spatial_frame(
        floorplan=fp,
        state_getter=lambda eid: states_downstairs.get(eid, "off"),
        prev_frame=f_bath_hold,
        now_ts=2045.0,
        negative_space_enabled=True,
    )
    assert f_downstairs["room_estimates"]["Master Bathroom"]["occupied"] is False
    assert f_downstairs["room_estimates"]["Master Bathroom"]["should_hold_occupied"] is False
    assert f_downstairs["room_estimates"]["Master Bathroom"]["blind_pocket_pruned"] is True


@pytest.mark.requirement("SPATIAL-02", category="SPATIAL", req_type="PositiveFeature")
def test_taxicab_distance_and_walking_speed_credibility(mock_hass) -> None:
    """Verify Taxicab (L1) distance calculation across floors and walking speed kinematic validation."""
    from custom_components.presence_detection_designer.spatial_geometry import (
        compute_taxicab_distance,
        evaluate_walking_speed_credibility,
    )

    fp = get_default_floorplan()
    same_floor = compute_taxicab_distance("Kitchen", "Living Room", floorplan=fp)
    assert same_floor["floor_changes"] == 0
    assert 10.0 <= float(same_floor["distance_ft"]) <= 35.0

    cross_floor = compute_taxicab_distance("Master Bedroom", "Garage", floorplan=fp)
    assert cross_floor["floor_changes"] == 1
    assert float(cross_floor["distance_ft"]) >= 45.0

    two_floors = compute_taxicab_distance("Master Bedroom", "Basement Theater", floorplan=fp)
    assert two_floors["floor_changes"] == 2
    assert float(two_floors["distance_ft"]) > float(cross_floor["distance_ft"])

    # Impossible teleportation speed (e.g. 60 ft in 0.5s = 120 ft/s) is rejected for non-adjacent rooms
    fast_kin = evaluate_walking_speed_credibility(60.0, 0.5, is_adjacent=False)
    assert fast_kin["is_credible"] is False
    assert "kinematic_speed_exceeded" in fast_kin["reason"]

    # Normal walking speed (60 ft in 15s = 4.0 ft/s) is credible with high score
    normal_kin = evaluate_walking_speed_credibility(60.0, 15.0, is_adjacent=False)
    assert normal_kin["is_credible"] is True
    assert normal_kin["credibility_score"] == 1.0
