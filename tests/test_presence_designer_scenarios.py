"""End-to-end scenario simulations for Presence Detection Designer (transitions engine)."""

from unittest.mock import AsyncMock, MagicMock

import pytest

from custom_components.presence_detection_designer.binary_sensor import PresenceBinarySensor
from custom_components.presence_detection_designer.const import (
    CONF_EXTEND_TIMEOUT,
    CONF_INACTIVITY_TIMEOUT,
    CONF_LLM_ENABLED,
    CONF_MODE,
    CONF_ROOM_NAME,
    CONF_SUSTAINING_CONDITIONS,
    CONF_TRIGGER_ENTITIES,
    Mode,
    OccupancyState,
)
from custom_components.presence_detection_designer.coordinator import RoomPresenceCoordinator
from custom_components.presence_detection_designer.evidence_snapshot import RoomEvidenceSnapshot


@pytest.fixture
def mock_hass():
    """Mock Home Assistant instance."""
    hass = MagicMock()
    hass.bus = MagicMock()
    hass.states = MagicMock()
    return hass


@pytest.mark.requirement("STATE-01", category="STATE", req_type="PositiveFeature")
@pytest.mark.asyncio
async def test_scenario_a_stationary_tv_watcher(mock_hass):
    """Scenario A: TV playing holds room in occupied_holding; TV off triggers cooling countdown to vacant."""
    config = {
        CONF_ROOM_NAME: "Living Room",
        CONF_MODE: Mode.OPEN,
        CONF_TRIGGER_ENTITIES: ["binary_sensor.lr_pir"],
        CONF_SUSTAINING_CONDITIONS: [
            {"entity_id": "media_player.living_room_tv", "operator": "equals", "state": "playing"}
        ],
        CONF_INACTIVITY_TIMEOUT: 300,
        "max_hold_timeout": 7200,
        CONF_LLM_ENABLED: False,
    }

    tv_state = MagicMock(state="off", attributes={})
    pir_state = MagicMock(state="off", attributes={})
    mock_hass.states.get = lambda eid: (
        tv_state
        if eid == "media_player.living_room_tv"
        else (pir_state if eid == "binary_sensor.lr_pir" else None)
    )

    coordinator = RoomPresenceCoordinator(mock_hass, "lr_entry", config)
    sensor = PresenceBinarySensor(coordinator, "lr_entry")
    assert sensor.is_on is False

    pir_state.state = "on"
    coordinator.async_refresh_all_states()
    assert sensor.is_on is True
    assert sensor.extra_state_attributes["occupancy_state"] == OccupancyState.OCCUPIED_CONFIRMED

    tv_state.state = "playing"
    pir_state.state = "off"
    coordinator.async_refresh_all_states()
    assert sensor.is_on is True
    assert sensor.extra_state_attributes["occupancy_state"] == OccupancyState.OCCUPIED_HOLDING
    assert (
        "media_player.living_room_tv equals playing"
        in sensor.extra_state_attributes["active_conditions"]
    )

    for _ in range(72):
        await coordinator._async_handle_tick(None)
    assert sensor.is_on is True
    assert sensor.extra_state_attributes["occupancy_state"] == OccupancyState.OCCUPIED_HOLDING

    tv_state.state = "off"
    coordinator._eval_conditions_and_update()
    coordinator.async_update_listeners()
    assert sensor.extra_state_attributes["occupancy_state"] == OccupancyState.OCCUPIED_COOLING
    assert sensor.extra_state_attributes["is_cooling_down"] is True
    assert sensor.extra_state_attributes["cooling_remaining_sec"] == 300

    for _ in range(300):
        await coordinator._async_handle_tick(None)
    assert sensor.is_on is False
    assert sensor.extra_state_attributes["occupancy_state"] == OccupancyState.VACANT


@pytest.mark.requirement("GUARD-01", category="GUARD", req_type="FailClosedGuardrail")
@pytest.mark.asyncio
async def test_scenario_b_hold_cap_prevents_indefinite_occupancy(mock_hass):
    """Scenario B: Bounded hold cannot stay occupied forever when direct human evidence stops."""
    config = {
        CONF_ROOM_NAME: "Office",
        CONF_MODE: Mode.BOUNDED,
        CONF_TRIGGER_ENTITIES: ["binary_sensor.office_pir"],
        CONF_SUSTAINING_CONDITIONS: [
            {"entity_id": "binary_sensor.office_chair", "operator": "equals", "state": "on"}
        ],
        CONF_INACTIVITY_TIMEOUT: 10,
        "max_hold_timeout": 30,
        CONF_LLM_ENABLED: False,
    }
    chair_state = MagicMock(state="off", attributes={})
    pir_state = MagicMock(state="off", attributes={})
    mock_hass.states.get = lambda eid: (
        chair_state
        if eid == "binary_sensor.office_chair"
        else (pir_state if eid == "binary_sensor.office_pir" else None)
    )

    coordinator = RoomPresenceCoordinator(mock_hass, "office_entry", config)
    sensor = PresenceBinarySensor(coordinator, "office_entry")

    pir_state.state = "on"
    chair_state.state = "on"
    coordinator.async_refresh_all_states()
    assert sensor.extra_state_attributes["occupancy_state"] == OccupancyState.OCCUPIED_CONFIRMED

    pir_state.state = "off"
    coordinator.async_refresh_all_states()
    assert sensor.extra_state_attributes["occupancy_state"] == OccupancyState.OCCUPIED_HOLDING

    for _ in range(30):
        await coordinator._async_handle_tick(None)
    assert sensor.extra_state_attributes["occupancy_state"] == OccupancyState.OCCUPIED_COOLING

    for _ in range(10):
        await coordinator._async_handle_tick(None)
    assert sensor.is_on is False
    assert sensor.extra_state_attributes["occupancy_state"] == OccupancyState.VACANT


@pytest.mark.requirement("GUARD-05", category="GUARD", req_type="FailClosedGuardrail")
@pytest.mark.asyncio
async def test_scenario_c_llm_verify_empty_vacates(mock_hass):
    """Scenario C: Cooling expires into occupied_verifying, LLM confirms empty room -> vacant."""
    config = {
        CONF_ROOM_NAME: "Office",
        CONF_MODE: Mode.OPEN,
        CONF_TRIGGER_ENTITIES: ["binary_sensor.office_pir"],
        CONF_INACTIVITY_TIMEOUT: 10,
        CONF_LLM_ENABLED: True,
    }
    coordinator = RoomPresenceCoordinator(mock_hass, "office_entry", config)
    sensor = PresenceBinarySensor(coordinator, "office_entry")

    coordinator.state_machine.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.office_pir"}), human_present=True
        )
    )
    coordinator.state_machine.apply_evidence(RoomEvidenceSnapshot())
    assert sensor.extra_state_attributes["occupancy_state"] == OccupancyState.OCCUPIED_COOLING
    assert sensor.extra_state_attributes["cooling_remaining_sec"] == 10

    coordinator.verifier.async_acquire_snapshot = AsyncMock(return_value=b"snapshot_bytes")
    coordinator.verifier.async_verify = AsyncMock(return_value=(False, "No person in office"))

    for _ in range(10):
        await coordinator._async_handle_tick(None)

    assert sensor.is_on is False
    assert sensor.extra_state_attributes["occupancy_state"] == OccupancyState.VACANT
    assert sensor.extra_state_attributes["last_llm_check"]["person_detected"] is False


@pytest.mark.requirement("STATE-02", category="STATE", req_type="PositiveFeature")
@pytest.mark.asyncio
async def test_scenario_d_llm_extension_resets_cooling(mock_hass):
    """Scenario D: LLM confirms person present -> transitions verifying -> cooling with extend_timeout."""
    config = {
        CONF_ROOM_NAME: "Living Room",
        CONF_MODE: Mode.OPEN,
        CONF_TRIGGER_ENTITIES: ["binary_sensor.lr_pir"],
        CONF_INACTIVITY_TIMEOUT: 5,
        CONF_EXTEND_TIMEOUT: 300,
        CONF_LLM_ENABLED: True,
    }
    coordinator = RoomPresenceCoordinator(mock_hass, "lr_entry", config)
    sensor = PresenceBinarySensor(coordinator, "lr_entry")

    coordinator.state_machine.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.lr_pir"}), human_present=True
        )
    )
    coordinator.state_machine.apply_evidence(RoomEvidenceSnapshot())
    assert sensor.is_on is True
    assert sensor.extra_state_attributes["cooling_remaining_sec"] == 5

    coordinator.verifier.async_acquire_snapshot = AsyncMock(return_value=b"snapshot_bytes")
    coordinator.verifier.async_verify = AsyncMock(return_value=(True, "Person seated reading book"))

    for _ in range(5):
        await coordinator._async_handle_tick(None)

    assert sensor.is_on is True
    assert sensor.extra_state_attributes["occupancy_state"] == OccupancyState.OCCUPIED_COOLING
    assert sensor.extra_state_attributes["cooling_remaining_sec"] == 300
    assert sensor.extra_state_attributes["last_llm_check"]["person_detected"] is True
    assert sensor.extra_state_attributes["last_llm_check"]["reason"] == "Person seated reading book"
