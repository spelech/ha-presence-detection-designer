"""Regression tests for resuming hold from cooling/verifying and Vision AI gating of distant camera triggers."""

from __future__ import annotations

import asyncio
from unittest.mock import MagicMock

import pytest

from custom_components.presence_detection_designer.const import (
    DATA_STORE,
    DOMAIN,
    OccupancyState,
)
from custom_components.presence_detection_designer.evidence_snapshot import RoomEvidenceSnapshot
from custom_components.presence_detection_designer.floorplan_presets import get_default_floorplan
from custom_components.presence_detection_designer.state_machine import RoomPresenceStateMachine


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


@pytest.mark.requirement("STATE-09", category="STATE", req_type="FailClosedGuardrail")
def test_llm_room_empty_always_vacates_even_when_tv_hold_active():
    """@requirement STATE-09: Vision AI empty verdict always routes OCCUPIED_VERIFYING -> VACANT, and hold_timeout locks out cooling hold resumption."""
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

    # Even if TV condition / BLE hold is present (e.g. occupant walked to kitchen leaving TV playing),
    # apply_evidence in VERIFYING must NOT override verification and llm_room_empty MUST vacate.
    hold_snap = RoomEvidenceSnapshot(
        active_conditions=("media_player.family_room_tv equals playing",),
        bayesian_occupied=True,
        bayesian_probability=0.814,
        bayesian_probability_pct=81.4,
    )
    sm.apply_evidence(hold_snap, now_ts=171.0)
    assert sm.state == OccupancyState.OCCUPIED_VERIFYING

    sm.handle_llm_result(False, "Empty room; occupant left TV playing", now_ts=172.0)
    assert sm.state == OccupancyState.VACANT
    assert sm.is_present is False

    # Bounded liveness (GUARD-07): if hold_timeout fires, hold MUST NOT resume during cooling
    sm.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.fr_floor_person"}),
            human_present=True,
            camera_confirmed=True,
        ),
        now_ts=200.0,
    )
    sm.apply_evidence(hold_snap, now_ts=210.0)
    assert sm.state == OccupancyState.OCCUPIED_HOLDING
    assert sm.advance_time(600.0, now_ts=810.0) == "HOLD_EXPIRED"
    assert sm.state == OccupancyState.OCCUPIED_COOLING
    sm.apply_evidence(hold_snap, now_ts=820.0)
    assert sm.state == OccupancyState.OCCUPIED_COOLING
    assert sm.advance_time(60.0, now_ts=870.0) == "REQUEST_LLM_VERIFY"
    sm.handle_llm_result(False, "Still empty after hold timeout", now_ts=872.0)
    assert sm.state == OccupancyState.VACANT
