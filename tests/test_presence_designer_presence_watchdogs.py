"""Tests for the sealed-box and stuck-trigger Vision AI watchdogs (Issues #18 and #19)."""

from __future__ import annotations

import time
from unittest.mock import AsyncMock, MagicMock

import pytest

from custom_components.presence_detection_designer.const import (
    CONF_BOUNDARY_ENTITIES,
    CONF_GRACE_TIMEOUT,
    CONF_LLM_ENABLED,
    CONF_MODE,
    CONF_ROOM_NAME,
    CONF_SEALED_VERIFY_TIMEOUT,
    CONF_TRIGGER_ENTITIES,
    CONF_TRIGGER_STUCK_TIMEOUT,
    DOMAIN,
    Mode,
)
from custom_components.presence_detection_designer.coordinator import RoomPresenceCoordinator
from custom_components.presence_detection_designer.coordinator_dispatch import (
    evaluate_coordinator_bayesian,
)

WALKWAY_ZONE = "binary_sensor.master_bedroom_walkway_person_occupancy"


def _make_hass() -> MagicMock:
    hass = MagicMock()
    hass.bus = MagicMock()
    hass.states = MagicMock()
    hass.states.get = MagicMock(return_value=None)
    hass.data = {DOMAIN: {}}
    hass.async_create_task = MagicMock(side_effect=lambda coro: coro)
    return hass


@pytest.mark.asyncio
async def test_sealed_room_is_reverified_and_cleared_when_vision_reports_vacant():
    """Issue #18: a bounded room sealed by transient motion is unsealed when Vision AI sees an empty room."""
    hass = _make_hass()
    config = {
        CONF_ROOM_NAME: "Garage",
        CONF_MODE: Mode.BOUNDED,
        CONF_BOUNDARY_ENTITIES: ["binary_sensor.garage_side_door"],
        CONF_TRIGGER_ENTITIES: ["binary_sensor.garage_ring_motion"],
        CONF_LLM_ENABLED: True,
        CONF_GRACE_TIMEOUT: 10,
        CONF_SEALED_VERIFY_TIMEOUT: 5,
    }
    coord = RoomPresenceCoordinator(hass, "garage_entry", config)
    sm = coord.state_machine

    sm.handle_trigger("binary_sensor.garage_ring_motion", is_active=True)
    sm.handle_boundary("binary_sensor.garage_side_door", is_open=False)
    sm.handle_trigger("binary_sensor.garage_ring_motion", is_active=False)
    assert sm.box_state == "occupied_sealed"
    assert sm.is_present is True

    coord.verifier.async_acquire_snapshot = AsyncMock(return_value=b"snapshot")
    coord.verifier.async_verify = AsyncMock(
        return_value=(False, "Parked vehicle only, no occupants visible")
    )

    # Backdate the quiet clock beyond the sealed verification timeout.
    sm._sealed_clear_since = time.time() - 10.0
    await coord._async_maybe_reverify_sealed()

    assert sm.is_present is False
    assert sm.box_state == "idle_clear"
    assert sm.vision_confirmed_vacant is True


@pytest.mark.asyncio
async def test_sealed_room_snapshot_failure_does_not_clear():
    """A failed sealed-box snapshot must not vacate a possibly-occupied sealed room."""
    hass = _make_hass()
    config = {
        CONF_ROOM_NAME: "Garage",
        CONF_MODE: Mode.BOUNDED,
        CONF_BOUNDARY_ENTITIES: ["binary_sensor.garage_side_door"],
        CONF_TRIGGER_ENTITIES: ["binary_sensor.garage_ring_motion"],
        CONF_LLM_ENABLED: True,
        CONF_GRACE_TIMEOUT: 10,
        CONF_SEALED_VERIFY_TIMEOUT: 5,
    }
    coord = RoomPresenceCoordinator(hass, "garage_entry", config)
    sm = coord.state_machine
    sm.handle_trigger("binary_sensor.garage_ring_motion", is_active=True)
    sm.handle_boundary("binary_sensor.garage_side_door", is_open=False)
    sm.handle_trigger("binary_sensor.garage_ring_motion", is_active=False)

    coord.verifier.async_acquire_snapshot = AsyncMock(return_value=None)
    sm._sealed_clear_since = time.time() - 10.0
    await coord._async_maybe_reverify_sealed()

    assert sm.is_present is True
    assert sm.box_state == "occupied_sealed"


@pytest.mark.asyncio
async def test_stuck_camera_subzone_is_reverified_and_suppressed():
    """Issue #19: a stuck Frigate person sub-zone with no corroboration is re-verified and suppressed."""
    hass = _make_hass()
    config = {
        CONF_ROOM_NAME: "Master Bedroom",
        CONF_TRIGGER_ENTITIES: [WALKWAY_ZONE],
        CONF_LLM_ENABLED: True,
        CONF_TRIGGER_STUCK_TIMEOUT: 60,
    }
    coord = RoomPresenceCoordinator(hass, "master_bedroom_entry", config)
    sm = coord.state_machine

    sm.handle_trigger(WALKWAY_ZONE, True)
    assert sm.is_present is True

    coord.verifier.async_acquire_snapshot = AsyncMock(return_value=b"snapshot")
    coord.verifier.async_verify = AsyncMock(
        return_value=(False, "Laundry pile on the walkway, no person")
    )

    # The sub-zone has been continuously ON far beyond the stuck timeout.
    coord._trigger_on_since[WALKWAY_ZONE] = time.time() - 120.0
    await coord._async_maybe_reverify_stuck_triggers()

    assert WALKWAY_ZONE in coord._stuck_suppressed_entities
    assert WALKWAY_ZONE not in sm._active_triggers
    assert sm.is_present is False


@pytest.mark.asyncio
async def test_stuck_subzone_with_pir_corroboration_is_not_suppressed():
    """A camera sub-zone corroborated by an active room PIR must not be treated as stuck."""
    hass = _make_hass()
    pir = "binary_sensor.master_bedroom_motion"
    hass.states.get = MagicMock(
        side_effect=lambda eid: MagicMock(state="on") if eid == pir else None
    )
    config = {
        CONF_ROOM_NAME: "Master Bedroom",
        CONF_TRIGGER_ENTITIES: [WALKWAY_ZONE, pir],
        CONF_LLM_ENABLED: True,
        CONF_TRIGGER_STUCK_TIMEOUT: 60,
    }
    coord = RoomPresenceCoordinator(hass, "master_bedroom_entry", config)
    coord.verifier.async_acquire_snapshot = AsyncMock(return_value=b"snapshot")
    coord.verifier.async_verify = AsyncMock(return_value=(False, "empty"))

    coord.state_machine.handle_trigger(WALKWAY_ZONE, True)
    coord._trigger_on_since[WALKWAY_ZONE] = time.time() - 120.0
    await coord._async_maybe_reverify_stuck_triggers()

    assert WALKWAY_ZONE not in coord._stuck_suppressed_entities
    coord.verifier.async_verify.assert_not_called()


def test_vision_vacant_suppresses_negative_space_boost_for_bounded_room(monkeypatch):
    """Issue #18: a bounded room confirmed vacant must not receive an unconstrained negative-space boost."""
    import custom_components.presence_detection_designer.spatial_inference as spatial_inference

    fake_frame = {
        "ts": time.time(),
        "room_estimates": {
            "Garage": {
                "probability_boost": 0.35,
                "inferred_subregion": "Garage blind pocket",
                "shade_sunlight_excluded_entities": [],
                "pet_excluded_entities": [],
            }
        },
    }
    monkeypatch.setattr(
        spatial_inference,
        "evaluate_spatial_frame",
        lambda **kwargs: fake_frame,
    )

    hass = _make_hass()
    config = {
        CONF_ROOM_NAME: "Garage",
        CONF_MODE: Mode.BOUNDED,
        CONF_BOUNDARY_ENTITIES: ["binary_sensor.garage_side_door"],
        CONF_TRIGGER_ENTITIES: [],
    }
    coord = RoomPresenceCoordinator(hass, "garage_entry", config)

    virtual_eid = "__spatial_negative_space__"

    # Without a Vision AI vacancy verdict the negative-space boost is applied.
    eval_before = evaluate_coordinator_bayesian(coord)
    assert eval_before is not None
    assert any(o.get("entity_id") == virtual_eid for o in eval_before.active_observations)

    # Once Vision AI definitively confirms the bounded room is empty, the boost is suppressed.
    coord.state_machine.vision_confirmed_vacant = True
    eval_after = evaluate_coordinator_bayesian(coord)
    assert eval_after is not None
    assert not any(o.get("entity_id") == virtual_eid for o in eval_after.active_observations)
