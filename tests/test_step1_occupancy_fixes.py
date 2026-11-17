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
