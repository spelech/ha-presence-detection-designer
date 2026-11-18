"""Regression tests for resuming hold from cooling/verifying and Vision AI gating of distant camera triggers."""

from __future__ import annotations

import asyncio
import time
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest

from custom_components.presence_detection_designer.const import (
    CONF_BAYESIAN_OBSERVATIONS,
    CONF_BAYESIAN_PRIOR,
    CONF_BAYESIAN_THRESHOLD,
    CONF_CAMERA_ENTITY,
    CONF_CONNECTED_ROOMS,
    CONF_INACTIVITY_TIMEOUT,
    CONF_LLM_ENABLED,
    CONF_MODE,
    CONF_PIR_VALIDATION_ENABLED,
    CONF_ROOM_NAME,
    CONF_SUSTAINING_CONDITIONS,
    CONF_TRIGGER_ENTITIES,
    DATA_STORE,
    DOMAIN,
    Mode,
    OccupancyState,
    PIRValidationState,
)
from custom_components.presence_detection_designer.coordinator import RoomPresenceCoordinator
from custom_components.presence_detection_designer.evidence_snapshot import RoomEvidenceSnapshot
from custom_components.presence_detection_designer.floorplan_presets import get_default_floorplan
from custom_components.presence_detection_designer.state_machine import RoomPresenceStateMachine
from tests.harness.virtual_ha import VirtualHAHarness


def _make_async_hass(
    floorplan: dict | None = None, guest_mode: bool = False
) -> tuple[MagicMock, list[asyncio.Task]]:
    tasks: list[asyncio.Task] = []
    states: dict[str, MagicMock] = {}

    hass = MagicMock()
    hass.states.get = lambda eid: states.get(eid)
    hass._state_map = states

    store = MagicMock()
    store.global_settings = {
        "guest_mode_enabled": guest_mode,
        "negative_space_enabled": False,
        "notifications_enabled": False,
        "transit_window_sec": 90.0,
        "ble_trackers": ["sensor.steve_s_s25_ble_area"],
    }
    store.get_floorplan = MagicMock(return_value=floorplan or get_default_floorplan())
    store._last_spatial_frame = {}
    store.record_timeline_event = MagicMock()

    hass.data = {DOMAIN: {DATA_STORE: store}}

    def _create_task(coro):
        task = asyncio.create_task(coro)
        tasks.append(task)
        return task

    hass.async_create_task = _create_task
    return hass, tasks


def _set_state(hass: MagicMock, entity_id: str, value: str) -> MagicMock:
    st = MagicMock()
    st.state = value
    st.attributes = {}
    hass._state_map[entity_id] = st
    return st


@pytest.mark.asyncio
@pytest.mark.requirement("STATE-08", category="STATE", req_type="PositiveFeature")
async def test_cooling_room_resumes_holding_when_tv_and_ble_activate(tmp_path):
    """@requirement STATE-08: Active TV/Bayesian hold evidence during cooling resumes OCCUPIED_HOLDING instead of vacating."""
    rooms = [
        {
            CONF_ROOM_NAME: "Family Room",
            CONF_MODE: str(Mode.OPEN),
            CONF_INACTIVITY_TIMEOUT: 180,
            "max_hold_timeout": 1800,
            CONF_LLM_ENABLED: True,
            CONF_PIR_VALIDATION_ENABLED: False,
            CONF_TRIGGER_ENTITIES: ["binary_sensor.family_room_floor_person_occupancy"],
            CONF_SUSTAINING_CONDITIONS: [
                {
                    "entity_id": "media_player.family_room_tv",
                    "operator": "equals",
                    "state": "playing",
                }
            ],
            CONF_BAYESIAN_PRIOR: 0.25,
            CONF_BAYESIAN_THRESHOLD: 0.75,
            CONF_BAYESIAN_OBSERVATIONS: [
                {"entity_id": "binary_sensor.family_room_motion_occupancy", "preset": "strong"},
                {
                    "entity_id": "sensor.steve_s_s25_ble_area",
                    "operator": "equals",
                    "state": "Family Room",
                    "preset": "moderate",
                },
                {
                    "entity_id": "media_player.family_room_tv",
                    "operator": "equals",
                    "state": "playing",
                    "preset": "supporting",
                },
            ],
        }
    ]
    with VirtualHAHarness(storage_dir=tmp_path) as harness:
        await harness.async_add_rooms(rooms)
        coord = harness.coordinators["Family Room"]
        harness.set_state("binary_sensor.family_room_floor_person_occupancy", "off")
        harness.set_state("binary_sensor.family_room_motion_occupancy", "off")
        harness.set_state("media_player.family_room_tv", "idle")
        harness.set_state("sensor.steve_s_s25_ble_area", "unknown")

        # 1. Enter room via camera floor zone while PIR active
        harness.set_state("binary_sensor.family_room_motion_occupancy", "on")
        harness.set_state("binary_sensor.family_room_floor_person_occupancy", "on")
        assert coord.state_machine.state == OccupancyState.OCCUPIED_CONFIRMED

        # 2. Sit on couch: camera zone clears -> holding on PIR
        harness.set_state("binary_sensor.family_room_floor_person_occupancy", "off")
        assert coord.state_machine.state == OccupancyState.OCCUPIED_HOLDING

        # 3. PIR clears while TV still idle & BLE unknown -> starts 180s cooling
        harness.set_state("binary_sensor.family_room_motion_occupancy", "off")
        assert coord.state_machine.state == OccupancyState.OCCUPIED_COOLING

        # 4. 90s into cooling, TV starts playing & BLE returns to Family Room -> MUST resume HOLDING
        harness.advance(90)
        harness.set_state("media_player.family_room_tv", "playing")
        harness.set_state("sensor.steve_s_s25_ble_area", "Family Room")
        assert coord.state_machine.state == OccupancyState.OCCUPIED_HOLDING
        assert coord.state_machine.is_present is True

        # 5. Advance past original 180s inactivity window -> still OCCUPIED_HOLDING (not VERIFYING/VACANT)
        harness.advance(120)
        assert coord.state_machine.state == OccupancyState.OCCUPIED_HOLDING
        assert coord.state_machine.is_present is True


@pytest.mark.requirement("STATE-09", category="STATE", req_type="PositiveFeature")
def test_llm_room_empty_holds_when_active_hold_evidence_present_unless_hold_timed_out():
    """@requirement STATE-09: Vision AI empty check holds when active hold evidence is present, unless max_hold_timeout expired."""
    sm = RoomPresenceStateMachine(
        name="Family Room",
        inactivity_timeout=60,
        extend_timeout=30,
        max_hold_timeout=600,
        verify_timeout=30,
        llm_enabled=True,
    )

    sm.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.fr_floor_person"}),
            human_present=True,
            camera_confirmed=True,
        ),
        now_ts=100.0,
    )
    assert sm.state == OccupancyState.OCCUPIED_CONFIRMED

    # Clear triggers without hold -> cooling -> verifying
    sm.apply_evidence(RoomEvidenceSnapshot(), now_ts=110.0)
    assert sm.state == OccupancyState.OCCUPIED_COOLING
    assert sm.advance_time(60.0, now_ts=170.0) == "REQUEST_LLM_VERIFY"
    assert sm.state == OccupancyState.OCCUPIED_VERIFYING

    # Snapshot now gains hold evidence (TV + BLE > threshold) while verifying:
    # if llm_room_empty arrives first, it must transition to OCCUPIED_HOLDING rather than VACANT
    sm.snapshot = RoomEvidenceSnapshot(
        active_conditions=("media_player.family_room_tv equals playing",),
        bayesian_occupied=True,
        bayesian_probability=0.814,
        bayesian_probability_pct=81.4,
    )
    sm.handle_llm_result(False, "Couch has pillows and blanket, no human visible", now_ts=172.0)
    assert sm.state == OccupancyState.OCCUPIED_HOLDING
    assert sm.is_present is True

    # Bounded liveness (GUARD-07): once max_hold_timeout fires, hold MUST NOT resume in cooling or verifying
    assert sm.advance_time(600.0, now_ts=772.0) == "HOLD_EXPIRED"
    assert sm.state == OccupancyState.OCCUPIED_COOLING
    sm.apply_evidence(sm.snapshot, now_ts=780.0)
    assert sm.state == OccupancyState.OCCUPIED_COOLING

    assert sm.advance_time(60.0, now_ts=832.0) == "REQUEST_LLM_VERIFY"
    assert sm.state == OccupancyState.OCCUPIED_VERIFYING
    sm.handle_llm_result(False, "Still empty after hold timeout", now_ts=834.0)
    assert sm.state == OccupancyState.VACANT


@pytest.mark.asyncio
@pytest.mark.requirement("GUARD-08", category="GUARD", req_type="FailClosedGuardrail")
async def test_uncorroborated_distant_camera_trigger_rejected_by_vision_ai():
    """@requirement GUARD-08: Uncorroborated distant camera flicker (e.g. dog/light spill) is gated by Vision AI."""
    fp = get_default_floorplan()
    hass, tasks = _make_async_hass(floorplan=fp)

    fr = RoomPresenceCoordinator(
        hass,
        "entry_fr",
        {
            CONF_ROOM_NAME: "Family Room",
            CONF_MODE: str(Mode.OPEN),
            CONF_PIR_VALIDATION_ENABLED: False,
            CONF_CONNECTED_ROOMS: ["Kitchen"],
            CONF_TRIGGER_ENTITIES: ["binary_sensor.family_room_floor_person_occupancy"],
        },
    )
    mbr = RoomPresenceCoordinator(
        hass,
        "entry_mbr",
        {
            CONF_ROOM_NAME: "Master Bedroom",
            CONF_MODE: str(Mode.BOUNDED),
            CONF_LLM_ENABLED: True,
            CONF_CAMERA_ENTITY: "camera.master_bedroom",
            CONF_PIR_VALIDATION_ENABLED: True,
            CONF_CONNECTED_ROOMS: ["Upstairs Hallway & Stairs", "Master Bathroom"],
            CONF_TRIGGER_ENTITIES: ["binary_sensor.master_bedroom_walkway_person_occupancy"],
        },
    )
    hass.data[DOMAIN][fr.entry_id] = fr
    hass.data[DOMAIN][mbr.entry_id] = mbr

    # Steve is in Family Room; BLE is Family Room; Upstairs Hallway is clear & stale
    fr.state_machine.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.family_room_floor_person_occupancy"}),
            human_present=True,
            camera_confirmed=True,
        ),
        now_ts=time.time(),
    )
    _set_state(hass, "sensor.steve_s_s25_ble_area", "Family Room")
    _set_state(hass, "binary_sensor.master_bedroom_walkway_person_occupancy", "on")

    mbr.verifier.async_acquire_snapshot = AsyncMock(return_value=b"fake_jpeg")
    mbr.verifier.async_verify = AsyncMock(
        return_value=(False, "Empty bedroom; dog walked toward closet")
    )

    event = SimpleNamespace(
        data={
            "entity_id": "binary_sensor.master_bedroom_walkway_person_occupancy",
            "new_state": _set_state(
                hass, "binary_sensor.master_bedroom_walkway_person_occupancy", "on"
            ),
        }
    )
    mbr._handle_trigger_change(event)

    # Stays VACANT immediately while Vision AI runs
    assert mbr.state_machine.is_present is False
    assert len(tasks) == 1
    await tasks[0]

    # Vision AI rejected -> remains VACANT
    assert mbr.state_machine.state == OccupancyState.VACANT
    assert mbr.state_machine.is_present is False
    assert mbr.verifier.async_verify.await_count == 1

    # Flicker again within cooldown -> suppressed without extra Vision AI call
    mbr._handle_trigger_change(event)
    assert len(tasks) == 1
    assert mbr.state_machine.is_present is False


@pytest.mark.asyncio
@pytest.mark.requirement("GUARD-09", category="GUARD", req_type="PositiveFeature")
async def test_uncorroborated_distant_camera_trigger_confirmed_by_vision_ai_promotes():
    """@requirement GUARD-09: If Vision AI confirms a real person on an uncorroborated camera trigger, room becomes occupied."""
    fp = get_default_floorplan()
    hass, tasks = _make_async_hass(floorplan=fp)

    fr = RoomPresenceCoordinator(
        hass,
        "entry_fr",
        {
            CONF_ROOM_NAME: "Family Room",
            CONF_MODE: str(Mode.OPEN),
            CONF_PIR_VALIDATION_ENABLED: False,
            CONF_CONNECTED_ROOMS: ["Kitchen"],
            CONF_TRIGGER_ENTITIES: ["binary_sensor.family_room_floor_person_occupancy"],
        },
    )
    mbr = RoomPresenceCoordinator(
        hass,
        "entry_mbr",
        {
            CONF_ROOM_NAME: "Master Bedroom",
            CONF_MODE: str(Mode.BOUNDED),
            CONF_LLM_ENABLED: True,
            CONF_CAMERA_ENTITY: "camera.master_bedroom",
            CONF_PIR_VALIDATION_ENABLED: False,
            CONF_CONNECTED_ROOMS: ["Upstairs Hallway & Stairs", "Master Bathroom"],
            CONF_TRIGGER_ENTITIES: ["binary_sensor.master_bedroom_walkway_person_occupancy"],
        },
    )
    hass.data[DOMAIN][fr.entry_id] = fr
    hass.data[DOMAIN][mbr.entry_id] = mbr

    fr.state_machine.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.family_room_floor_person_occupancy"}),
            human_present=True,
            camera_confirmed=True,
        ),
        now_ts=time.time(),
    )
    _set_state(hass, "sensor.steve_s_s25_ble_area", "Family Room")
    _set_state(hass, "binary_sensor.master_bedroom_walkway_person_occupancy", "on")

    mbr.verifier.async_acquire_snapshot = AsyncMock(return_value=b"fake_jpeg")
    mbr.verifier.async_verify = AsyncMock(return_value=(True, "Person standing by bed"))

    event = SimpleNamespace(
        data={
            "entity_id": "binary_sensor.master_bedroom_walkway_person_occupancy",
            "new_state": _set_state(
                hass, "binary_sensor.master_bedroom_walkway_person_occupancy", "on"
            ),
        }
    )
    mbr._handle_trigger_change(event)
    assert mbr.state_machine.is_present is False
    assert len(tasks) == 1

    await tasks[0]
    assert mbr.state_machine.state == OccupancyState.OCCUPIED_CONFIRMED
    assert mbr.state_machine.is_present is True


@pytest.mark.asyncio
@pytest.mark.requirement("GUARD-10", category="GUARD", req_type="PositiveFeature")
async def test_corroborated_camera_trigger_skips_vision_entry_gate():
    """@requirement GUARD-10: BLE-corroborated or trajectory-valid camera triggers promote immediately without Vision AI latency."""
    fp = get_default_floorplan()
    hass, tasks = _make_async_hass(floorplan=fp)

    fr = RoomPresenceCoordinator(
        hass,
        "entry_fr",
        {
            CONF_ROOM_NAME: "Family Room",
            CONF_MODE: str(Mode.OPEN),
            CONF_PIR_VALIDATION_ENABLED: False,
            CONF_TRIGGER_ENTITIES: ["binary_sensor.family_room_floor_person_occupancy"],
        },
    )
    mbr = RoomPresenceCoordinator(
        hass,
        "entry_mbr",
        {
            CONF_ROOM_NAME: "Master Bedroom",
            CONF_MODE: str(Mode.BOUNDED),
            CONF_LLM_ENABLED: True,
            CONF_CAMERA_ENTITY: "camera.master_bedroom",
            CONF_PIR_VALIDATION_ENABLED: False,
            CONF_CONNECTED_ROOMS: ["Upstairs Hallway & Stairs", "Master Bathroom"],
            CONF_TRIGGER_ENTITIES: ["binary_sensor.master_bedroom_walkway_person_occupancy"],
        },
    )
    hass.data[DOMAIN][fr.entry_id] = fr
    hass.data[DOMAIN][mbr.entry_id] = mbr

    fr.state_machine.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.family_room_floor_person_occupancy"}),
            human_present=True,
            camera_confirmed=True,
        ),
        now_ts=time.time(),
    )
    # BLE confirms resident phone is in Master Bedroom
    _set_state(hass, "sensor.steve_s_s25_ble_area", "Master Bedroom")
    _set_state(hass, "binary_sensor.master_bedroom_walkway_person_occupancy", "on")

    mbr.verifier.async_verify = AsyncMock(return_value=(False, "should not be called"))

    event = SimpleNamespace(
        data={
            "entity_id": "binary_sensor.master_bedroom_walkway_person_occupancy",
            "new_state": _set_state(
                hass, "binary_sensor.master_bedroom_walkway_person_occupancy", "on"
            ),
        }
    )
    mbr._handle_trigger_change(event)
    assert mbr.state_machine.state == OccupancyState.OCCUPIED_CONFIRMED
    assert len(tasks) == 0
    assert mbr.verifier.async_verify.await_count == 0


@pytest.mark.asyncio
@pytest.mark.requirement("SIGNAL-04", category="SIGNAL", req_type="FailClosedGuardrail")
async def test_unverified_distant_camera_observation_cannot_corroborate_pending_pir():
    """@requirement SIGNAL-04: Unverified distant camera flicker in observations cannot promote a pending PIR without Vision AI."""
    fp = get_default_floorplan()
    hass, _tasks = _make_async_hass(floorplan=fp)

    fr = RoomPresenceCoordinator(
        hass,
        "entry_fr",
        {
            CONF_ROOM_NAME: "Family Room",
            CONF_MODE: str(Mode.OPEN),
            CONF_PIR_VALIDATION_ENABLED: False,
            CONF_TRIGGER_ENTITIES: ["binary_sensor.family_room_floor_person_occupancy"],
        },
    )
    mbr = RoomPresenceCoordinator(
        hass,
        "entry_mbr",
        {
            CONF_ROOM_NAME: "Master Bedroom",
            CONF_MODE: str(Mode.BOUNDED),
            CONF_LLM_ENABLED: True,
            CONF_CAMERA_ENTITY: "camera.master_bedroom",
            CONF_PIR_VALIDATION_ENABLED: True,
            CONF_CONNECTED_ROOMS: ["Upstairs Hallway & Stairs", "Master Bathroom"],
            CONF_TRIGGER_ENTITIES: ["binary_sensor.master_bedroom_motion_occupancy"],
            CONF_BAYESIAN_PRIOR: 0.2,
            CONF_BAYESIAN_THRESHOLD: 0.75,
            CONF_BAYESIAN_OBSERVATIONS: [
                {
                    "entity_id": "binary_sensor.master_bedroom_walkway_person_occupancy",
                    "preset": "decisive",
                }
            ],
        },
    )
    hass.data[DOMAIN][fr.entry_id] = fr
    hass.data[DOMAIN][mbr.entry_id] = mbr

    fr.state_machine.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.family_room_floor_person_occupancy"}),
            human_present=True,
            camera_confirmed=True,
        ),
        now_ts=time.time(),
    )
    _set_state(hass, "sensor.steve_s_s25_ble_area", "Family Room")
    _set_state(hass, "binary_sensor.master_bedroom_motion_occupancy", "on")
    _set_state(hass, "binary_sensor.master_bedroom_walkway_person_occupancy", "on")

    # Seed PIR into CANDIDATE state (uncorroborated single PIR)
    mbr.pir_validator.on_pir_triggered(
        "binary_sensor.master_bedroom_motion_occupancy", now_ts=time.time()
    )
    assert mbr.pir_validator.state == PIRValidationState.CANDIDATE

    # Evaluating bayesian must NOT let unverified distant Frigate flicker promote pending PIR
    mbr._eval_bayesian_and_update()
    assert mbr.pir_validator.state == PIRValidationState.CANDIDATE
    assert mbr.state_machine.is_present is False
