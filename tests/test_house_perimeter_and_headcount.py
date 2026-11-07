"""Unit tests for House Perimeter Transition Tracker, Directional Vectoring, and Head Counter."""

from __future__ import annotations

import time
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest

from custom_components.presence_detection_designer.const import (
    CONF_BAYESIAN_OBSERVATIONS,
    CONF_BOUNDARY_ENTITIES,
    CONF_CONNECTED_ROOMS,
    CONF_DOOR_DUPLICATE_WINDOW,
    CONF_EXIT_CORROBORATION_WINDOW,
    CONF_EXIT_CORROBORATORS,
    CONF_INTERIOR_DOORS,
    CONF_MAX_OCCUPANTS,
    CONF_MODE,
    CONF_PERIMETER_DOORS,
    CONF_ROOM_NAME,
    CONF_STALE_COUNT_TIMEOUT,
    CONF_TRIGGER_ENTITIES,
    DATA_STORE,
    DEFAULT_PERIMETER_DOORS,
    DOMAIN,
    BoxState,
    Mode,
)
from custom_components.presence_detection_designer.coordinator import RoomPresenceCoordinator
from custom_components.presence_detection_designer.house_perimeter import (
    HousePerimeterTracker,
    get_house_perimeter_tracker,
)
from custom_components.presence_detection_designer.sensor import (
    HouseHeadcountSensor,
)


def _make_mock_coord(
    hass: Any,
    room_name: str,
    boundary_entities: list[str] | None = None,
    trigger_entities: list[str] | None = None,
    mode: Mode = Mode.OPEN,
) -> RoomPresenceCoordinator:
    entry_id = f"entry_{room_name.lower().replace(' ', '_')}"
    config = {
        CONF_ROOM_NAME: room_name,
        CONF_MODE: str(mode),
        CONF_CONNECTED_ROOMS: [],
        CONF_TRIGGER_ENTITIES: trigger_entities
        or [f"binary_sensor.{room_name.lower().replace(' ', '_')}_motion"],
        CONF_BOUNDARY_ENTITIES: boundary_entities or [],
        CONF_BAYESIAN_OBSERVATIONS: [],
    }
    coord = RoomPresenceCoordinator(hass, entry_id, config)
    coord.state_machine.inactivity_timeout = 180
    coord.state_machine.grace_timeout = 60
    return coord


def test_house_perimeter_tracker_singleton(mock_hass):
    """Verify singleton retrieval and initialization in hass.data."""
    mock_hass.data[DOMAIN] = {}
    t1 = get_house_perimeter_tracker(mock_hass)
    t2 = get_house_perimeter_tracker(mock_hass)
    assert t1 is t2
    assert isinstance(t1, HousePerimeterTracker)
    assert t1.state.count == 1
    assert t1.state.mode == "single_occupant"


def test_unconfigured_door_ignored(mock_hass):
    """Verify non-perimeter door events return None and do not affect headcount."""
    tracker = HousePerimeterTracker(mock_hass)
    tracker.set_headcount(1)

    rec = tracker.handle_door_state_change("binary_sensor.random_closet_door", True)
    assert rec is None
    rec_close = tracker.handle_door_state_change("binary_sensor.random_closet_door", False)
    assert rec_close is None
    assert tracker.state.count == 1


def test_ingress_transition_from_vacant(mock_hass):
    """Verify door cycle on front door when vacant vectors as ingress and increments headcount."""
    tracker = HousePerimeterTracker(mock_hass)
    tracker.set_headcount(0)
    assert tracker.state.mode == "vacant"

    now = time.time()
    # Door opens
    tracker.handle_door_state_change("binary_sensor.front_door", True, now_ts=now)
    # Door closes 4 seconds later
    rec = tracker.handle_door_state_change("binary_sensor.front_door", False, now_ts=now + 4.0)

    assert rec is not None
    assert rec.vector == "ingress"
    assert rec.room_name == "Front Entry"
    assert rec.confidence >= 0.8
    assert tracker.state.count == 1
    assert tracker.state.mode == "single_occupant"
    assert tracker.state.last_event_door == "binary_sensor.front_door"
    assert tracker.state.last_event_type == "ingress"


def test_egress_transition_with_prior_interior_motion(mock_hass):
    """Verify that prior interior room motion before door cycle vectors as egress and decrements headcount."""
    front_entry_coord = _make_mock_coord(
        mock_hass,
        "Front Entry",
        boundary_entities=["binary_sensor.front_door"],
        trigger_entities=["binary_sensor.front_entry_pir"],
    )
    mock_hass.data[DOMAIN] = {
        front_entry_coord.entry_id: front_entry_coord,
    }

    tracker = HousePerimeterTracker(mock_hass)
    tracker.set_headcount(1)

    now = time.time()
    # Occupant moves in Front Entry
    front_entry_coord.state_machine.handle_trigger("binary_sensor.front_entry_pir", True)
    assert front_entry_coord.state_machine.is_present is True

    # Door opens
    tracker.handle_door_state_change("binary_sensor.front_door", True, now_ts=now + 1.0)
    # Occupant exits, door closes
    rec = tracker.handle_door_state_change("binary_sensor.front_door", False, now_ts=now + 5.0)

    assert rec is not None
    assert rec.vector == "egress"
    assert rec.room_name == "Front Entry"
    assert tracker.state.count == 0
    assert tracker.state.mode == "vacant"


def test_conservation_law_vacant_clears_all_rooms(mock_hass):
    """When house headcount becomes 0, all occupied rooms are vacated immediately."""
    office_coord = _make_mock_coord(mock_hass, "Office")
    living_coord = _make_mock_coord(mock_hass, "Living Room")

    mock_hass.data[DOMAIN] = {
        office_coord.entry_id: office_coord,
        living_coord.entry_id: living_coord,
    }

    # Simulate both rooms occupied
    office_coord.state_machine.handle_trigger("binary_sensor.office_motion", True)
    living_coord.state_machine.handle_trigger("binary_sensor.living_room_motion", True)
    assert office_coord.state_machine.is_present is True
    assert living_coord.state_machine.is_present is True

    tracker = HousePerimeterTracker(mock_hass)
    tracker.set_headcount(0)

    # Both rooms must be forcefully cleared
    assert office_coord.state_machine.is_present is False
    assert office_coord.state_machine.box_state == BoxState.IDLE_CLEAR
    assert living_coord.state_machine.is_present is False
    assert living_coord.state_machine.box_state == BoxState.IDLE_CLEAR


def test_conservation_law_single_occupant_clears_prior_room(mock_hass):
    """When headcount == 1, only 1 room can be occupied; activating new room clears the prior room."""
    office_coord = _make_mock_coord(mock_hass, "Office")
    kitchen_coord = _make_mock_coord(mock_hass, "Kitchen")

    mock_hass.data[DOMAIN] = {
        office_coord.entry_id: office_coord,
        kitchen_coord.entry_id: kitchen_coord,
    }

    tracker = HousePerimeterTracker(mock_hass)
    tracker.set_headcount(1)

    # Steve was in Office
    office_coord.state_machine.handle_trigger("binary_sensor.office_motion", True)
    office_coord.state_machine.handle_trigger("binary_sensor.office_motion", False)
    assert office_coord.state_machine.is_present is True
    assert office_coord.state_machine.box_state == BoxState.TIMER_ACTIVE

    # Steve walks into Kitchen
    kitchen_coord.state_machine.handle_trigger("binary_sensor.kitchen_motion", True)
    tracker.enforce_conservation_law(newly_occupied_room="Kitchen")

    assert kitchen_coord.state_machine.is_present is True
    # Office was vacated immediately by conservation law
    assert office_coord.state_machine.is_present is False
    assert office_coord.state_machine.box_state == BoxState.IDLE_CLEAR
    assert "Conservation Law" in office_coord._last_adjacent_arrival


def test_conservation_law_multi_occupant_allows_multiple_rooms(mock_hass):
    """When headcount >= 2, multiple rooms can remain concurrently occupied without vacating."""
    office_coord = _make_mock_coord(mock_hass, "Office")
    kitchen_coord = _make_mock_coord(mock_hass, "Kitchen")

    mock_hass.data[DOMAIN] = {
        office_coord.entry_id: office_coord,
        kitchen_coord.entry_id: kitchen_coord,
    }

    tracker = HousePerimeterTracker(mock_hass)
    tracker.set_headcount(2)
    assert tracker.state.mode == "multi_occupant"

    office_coord.state_machine.handle_trigger("binary_sensor.office_motion", True)
    kitchen_coord.state_machine.handle_trigger("binary_sensor.kitchen_motion", True)

    tracker.enforce_conservation_law(newly_occupied_room="Kitchen")

    # Both rooms remain occupied
    assert office_coord.state_machine.is_present is True
    assert kitchen_coord.state_machine.is_present is True


def test_house_headcount_sensor_attributes_and_updates(mock_hass):
    """Verify HouseHeadcountSensor native value, attributes, and update listener reactivity."""
    # An occupant is home in another room, so an arrival through the front door
    # is physically plausible and should increment the count.
    living = _make_mock_coord(mock_hass, "Living Room")
    mock_hass.data[DOMAIN] = {living.entry_id: living}
    living.state_machine.handle_trigger("binary_sensor.living_room_motion", True)

    tracker = HousePerimeterTracker(mock_hass)
    tracker.set_headcount(1)

    sensor = HouseHeadcountSensor(tracker)
    assert sensor.name == "House Occupant Count"
    assert sensor.unique_id == f"{DOMAIN}_house_occupant_count"
    assert sensor.native_value == 1
    assert sensor.extra_state_attributes["occupancy_mode"] == "single_occupant"
    assert sensor.extra_state_attributes["last_perimeter_door"] is None

    # Simulate door transit
    now = time.time()
    tracker.handle_door_state_change("binary_sensor.front_door", True, now_ts=now)
    tracker.handle_door_state_change("binary_sensor.front_door", False, now_ts=now + 3.0)

    attrs = sensor.extra_state_attributes
    assert sensor.native_value == 2
    assert attrs["occupancy_mode"] == "multi_occupant"
    assert attrs["last_perimeter_door"] == "binary_sensor.front_door"
    assert attrs["last_vector_type"] == "ingress"
    assert len(attrs["recent_door_events"]) == 1
    assert attrs["recent_door_events"][0]["room"] == "Front Entry"
    assert attrs["recent_door_events"][0]["duration_open_sec"] == 3.0


@pytest.mark.asyncio
async def test_set_house_occupant_count_service(mock_hass):
    """Verify set_house_occupant_count service registers and updates store + headcount."""
    from custom_components.presence_detection_designer import async_setup

    registered_services = {}

    def mock_register(domain, service, handler, **kwargs):
        registered_services[f"{domain}.{service}"] = handler

    mock_hass.services.has_service = MagicMock(return_value=False)
    mock_hass.services.async_register = mock_register

    from unittest.mock import patch

    mock_store = MagicMock()
    mock_store.async_update_global_settings = AsyncMock()
    mock_hass.data[DOMAIN] = {DATA_STORE: mock_store}

    await async_setup(mock_hass, {})
    assert "presence_detection_designer.set_house_occupant_count" in registered_services

    handler = registered_services["presence_detection_designer.set_house_occupant_count"]
    call = MagicMock(data={"count": 3})
    with patch(
        "custom_components.presence_detection_designer.async_get_store",
        AsyncMock(return_value=mock_store),
    ):
        await handler(call)

    tracker = get_house_perimeter_tracker(mock_hass)
    assert tracker.state.count == 3
    assert tracker.state.mode == "multi_occupant"
    mock_store.async_update_global_settings.assert_called_once_with({"house_occupant_count": 3})


def _install_global_settings(mock_hass, **overrides):
    """Install a mock DATA_STORE carrying head-count safety settings."""
    settings = {
        "house_occupant_count": 1,
        CONF_PERIMETER_DOORS: dict(DEFAULT_PERIMETER_DOORS),
        CONF_INTERIOR_DOORS: ["binary_sensor.laundry_room_door"],
        CONF_MAX_OCCUPANTS: 12,
        CONF_STALE_COUNT_TIMEOUT: 900,
        CONF_DOOR_DUPLICATE_WINDOW: 45.0,
    }
    settings.update(overrides)
    store = MagicMock()
    store.global_settings = settings
    mock_hass.data.setdefault(DOMAIN, {})
    mock_hass.data[DOMAIN][DATA_STORE] = store
    return store


def test_interior_door_never_changes_headcount(mock_hass):
    """A garage -> laundry interior door transit must not count as an arrival."""
    _install_global_settings(
        mock_hass,
        **{
            CONF_PERIMETER_DOORS: {
                "binary_sensor.front_door": "Front Entry",
                "binary_sensor.laundry_room_door": "Laundry Room",
            }
        },
    )
    tracker = HousePerimeterTracker(mock_hass)
    tracker.set_headcount(2)

    now = time.time()
    assert (
        tracker.handle_door_state_change("binary_sensor.laundry_room_door", True, now_ts=now)
        is None
    )
    rec = tracker.handle_door_state_change(
        "binary_sensor.laundry_room_door", False, now_ts=now + 4.0
    )

    assert rec is None
    assert tracker.state.count == 2
    assert tracker.state.last_event_door != "binary_sensor.laundry_room_door"


def test_positive_count_without_evidence_is_ambiguous(mock_hass):
    """A door cycle when the count is > 0 but no room is occupied must not increment."""
    tracker = HousePerimeterTracker(mock_hass)
    tracker.set_headcount(1)

    now = time.time()
    tracker.handle_door_state_change("binary_sensor.front_door", True, now_ts=now)
    rec = tracker.handle_door_state_change("binary_sensor.front_door", False, now_ts=now + 4.0)

    assert rec is not None
    assert rec.vector == "ambiguous"
    assert tracker.state.count == 1
    assert tracker.state.mode == "single_occupant"


def test_duplicate_close_events_count_once(mock_hass):
    """Covers/binary sensors can emit duplicate close edges; only one may count."""
    tracker = HousePerimeterTracker(mock_hass)
    tracker.set_headcount(0)

    now = time.time()
    tracker.handle_door_state_change("binary_sensor.front_door", True, now_ts=now)
    first = tracker.handle_door_state_change("binary_sensor.front_door", False, now_ts=now + 4.0)
    second = tracker.handle_door_state_change("binary_sensor.front_door", False, now_ts=now + 5.0)

    assert first is not None
    assert first.vector == "ingress"
    assert second is None
    assert tracker.state.count == 1


def test_duplicate_same_direction_transit_suppressed(mock_hass):
    """One person fumbling a door twice in the same direction must count once."""
    living = _make_mock_coord(mock_hass, "Living Room")
    _install_global_settings(mock_hass, **{CONF_DOOR_DUPLICATE_WINDOW: 45.0})
    mock_hass.data[DOMAIN][living.entry_id] = living
    living.state_machine.handle_trigger("binary_sensor.living_room_motion", True)

    tracker = HousePerimeterTracker(mock_hass)
    tracker.set_headcount(0)

    now = time.time()
    tracker.handle_door_state_change("binary_sensor.front_door", True, now_ts=now)
    first = tracker.handle_door_state_change("binary_sensor.front_door", False, now_ts=now + 4.0)
    tracker.handle_door_state_change("binary_sensor.front_door", True, now_ts=now + 10.0)
    second = tracker.handle_door_state_change("binary_sensor.front_door", False, now_ts=now + 14.0)

    assert first is not None and first.vector == "ingress"
    assert second is not None and second.vector == "ambiguous"
    assert tracker.state.count == 1


def test_headcount_clamped_to_max_occupants(mock_hass):
    """An automatically accumulated count is capped by max_occupants."""
    _install_global_settings(mock_hass, **{CONF_MAX_OCCUPANTS: 2})
    tracker = HousePerimeterTracker(mock_hass)
    tracker.set_headcount(7)

    changed = tracker.reconcile_headcount(now_ts=time.time(), force=True)

    assert changed is True
    assert tracker.state.count == 2
    assert tracker.state.mode == "multi_occupant"


def test_stale_positive_count_resets_when_all_rooms_clear(mock_hass):
    """A positive count is reconciled to zero after a sustained whole-house vacancy."""
    _install_global_settings(mock_hass, **{CONF_STALE_COUNT_TIMEOUT: 10})
    tracker = HousePerimeterTracker(mock_hass)
    tracker.set_headcount(3)
    mock_hass.data[DOMAIN] = {DATA_STORE: mock_hass.data[DOMAIN][DATA_STORE]}

    assert tracker.reconcile_headcount(now_ts=1000.0, force=True) is False
    assert tracker.state.count == 3

    changed = tracker.reconcile_headcount(now_ts=1011.0, force=True)

    assert changed is True
    assert tracker.state.count == 0
    assert tracker.state.mode == "vacant"


def test_ingress_while_others_home_requires_plausible_count(mock_hass):
    """Arrivals while others are home are allowed only when the count fits observed rooms."""
    living = _make_mock_coord(mock_hass, "Living Room")
    kitchen = _make_mock_coord(mock_hass, "Kitchen")
    mock_hass.data[DOMAIN] = {
        living.entry_id: living,
        kitchen.entry_id: kitchen,
        DATA_STORE: MagicMock(global_settings={}),
    }
    living.state_machine.handle_trigger("binary_sensor.living_room_motion", True)

    tracker = HousePerimeterTracker(mock_hass)
    tracker.set_headcount(2)

    now = time.time()
    tracker.handle_door_state_change("binary_sensor.front_door", True, now_ts=now)
    rec = tracker.handle_door_state_change("binary_sensor.front_door", False, now_ts=now + 4.0)
    assert rec is not None and rec.vector == "ambiguous"
    assert tracker.state.count == 2

    kitchen.state_machine.handle_trigger("binary_sensor.kitchen_motion", True)
    tracker.handle_door_state_change("binary_sensor.front_door", True, now_ts=now + 10.0)
    rec2 = tracker.handle_door_state_change("binary_sensor.front_door", False, now_ts=now + 14.0)

    assert rec2 is not None and rec2.vector == "ingress"
    assert tracker.state.count == 3


def test_side_door_exit_held_pending_without_exterior_motion(mock_hass):
    """Side door exit without exterior motion is held as pending_egress without count decrement."""
    garage = _make_mock_coord(mock_hass, "Garage")
    mock_hass.data.setdefault(DOMAIN, {})
    mock_hass.data[DOMAIN][garage.entry_id] = garage
    garage.state_machine.handle_trigger("binary_sensor.garage_motion", True)

    tracker = HousePerimeterTracker(mock_hass)
    tracker.set_headcount(1)

    now = 1000.0
    tracker.handle_door_state_change("binary_sensor.garage_side_door", True, now_ts=now)
    rec = tracker.handle_door_state_change("binary_sensor.garage_side_door", False, now_ts=now + 5.0)

    assert rec is not None
    assert rec.vector == "pending_egress"
    assert tracker.state.count == 1
    assert len(tracker._pending_exit_corroborations) == 1
    assert tracker._pending_exit_corroborations[0]["door_entity"] == "binary_sensor.garage_side_door"


def test_side_door_exit_immediately_corroborated_by_driveway_motion(mock_hass):
    """Side door exit with prior exterior motion immediately vectors to egress and decrements count."""
    garage = _make_mock_coord(mock_hass, "Garage")
    mock_hass.data.setdefault(DOMAIN, {})
    mock_hass.data[DOMAIN][garage.entry_id] = garage
    garage.state_machine.handle_trigger("binary_sensor.garage_motion", True)

    tracker = HousePerimeterTracker(mock_hass)
    tracker.set_headcount(1)

    now = 1000.0
    tracker.handle_exterior_state_change("binary_sensor.driveway_spotlight_camera_motion", True, now_ts=now - 2.0)
    tracker.handle_door_state_change("binary_sensor.garage_side_door", True, now_ts=now)
    rec = tracker.handle_door_state_change("binary_sensor.garage_side_door", False, now_ts=now + 5.0)

    assert rec is not None
    assert rec.vector == "egress"
    assert "binary_sensor.driveway_spotlight_camera_motion" in rec.details
    assert tracker.state.count == 0
    assert tracker.state.mode == "vacant"
    assert len(tracker._pending_exit_corroborations) == 0


def test_side_door_exit_delayed_corroboration_by_backyard_motion(mock_hass):
    """Side door exit confirmed when backyard motion trips within corroboration window."""
    garage = _make_mock_coord(mock_hass, "Garage")
    mock_hass.data.setdefault(DOMAIN, {})
    mock_hass.data[DOMAIN][garage.entry_id] = garage
    garage.state_machine.handle_trigger("binary_sensor.garage_motion", True)

    tracker = HousePerimeterTracker(mock_hass)
    tracker.set_headcount(2)

    now = 1000.0
    tracker.handle_door_state_change("binary_sensor.garage_side_door", True, now_ts=now)
    rec = tracker.handle_door_state_change("binary_sensor.garage_side_door", False, now_ts=now + 5.0)

    assert rec is not None and rec.vector == "pending_egress"
    assert tracker.state.count == 2

    # Backyard motion trips 15 seconds after door closed (within 30s window)
    resolved = tracker.handle_exterior_state_change("binary_sensor.backyard_motion", True, now_ts=now + 20.0)

    assert len(resolved) == 1
    assert resolved[0].vector == "egress"
    assert "binary_sensor.backyard_motion" in resolved[0].details
    assert tracker.state.count == 1
    assert tracker.state.mode == "single_occupant"
    assert len(tracker._pending_exit_corroborations) == 0


def test_side_door_exit_corroboration_window_expires_as_ambiguous(mock_hass):
    """Uncorroborated side door exit times out into ambiguous with 0 headcount decrement."""
    garage = _make_mock_coord(mock_hass, "Garage")
    mock_hass.data.setdefault(DOMAIN, {})
    mock_hass.data[DOMAIN][garage.entry_id] = garage
    garage.state_machine.handle_trigger("binary_sensor.garage_motion", True)

    tracker = HousePerimeterTracker(mock_hass)
    tracker.set_headcount(2)

    now = 1000.0
    tracker.handle_door_state_change("binary_sensor.garage_side_door", True, now_ts=now)
    rec = tracker.handle_door_state_change("binary_sensor.garage_side_door", False, now_ts=now + 5.0)
    assert rec is not None and rec.vector == "pending_egress"
    assert tracker.state.count == 2

    # 35 seconds later (window was 30s) reconcile_headcount runs
    resolved = tracker.check_pending_exit_corroborations(now_ts=now + 40.0)

    assert len(resolved) == 1
    assert resolved[0].vector == "ambiguous"
    assert tracker.state.count == 2  # Not decremented!
    assert len(tracker._pending_exit_corroborations) == 0


def test_custom_exit_corroborators_and_window_config(mock_hass):
    """Custom door exit corroborators and window settings are honored from store."""
    _install_global_settings(
        mock_hass,
        **{
            CONF_EXIT_CORROBORATORS: {
                "binary_sensor.back_door": ["binary_sensor.patio_motion"]
            },
            CONF_EXIT_CORROBORATION_WINDOW: 15.0,
        },
    )
    kitchen = _make_mock_coord(mock_hass, "Kitchen")
    mock_hass.data.setdefault(DOMAIN, {})
    mock_hass.data[DOMAIN][kitchen.entry_id] = kitchen
    kitchen.state_machine.handle_trigger("binary_sensor.kitchen_motion", True)

    tracker = HousePerimeterTracker(mock_hass)
    tracker.set_headcount(1)

    now = 2000.0
    tracker.handle_door_state_change("binary_sensor.back_door", True, now_ts=now)
    rec = tracker.handle_door_state_change("binary_sensor.back_door", False, now_ts=now + 4.0)

    assert rec is not None and rec.vector == "pending_egress"
    assert tracker.state.count == 1

    # Driveway motion does NOT corroborate back door
    resolved_wrong = tracker.handle_exterior_state_change("binary_sensor.driveway_camera_motion", True, now_ts=now + 6.0)
    assert len(resolved_wrong) == 0
    assert tracker.state.count == 1

    # Patio motion corroborates back door
    resolved = tracker.handle_exterior_state_change("binary_sensor.patio_motion", True, now_ts=now + 8.0)
    assert len(resolved) == 1
    assert resolved[0].vector == "egress"
    assert tracker.state.count == 0


def test_unconfigured_door_does_not_require_exterior_corroboration(mock_hass):
    """Perimeter doors without configured exit corroborators exit directly."""
    entry = _make_mock_coord(mock_hass, "Front Entry")
    mock_hass.data.setdefault(DOMAIN, {})
    mock_hass.data[DOMAIN][entry.entry_id] = entry
    entry.state_machine.handle_trigger("binary_sensor.front_entry_motion", True)

    tracker = HousePerimeterTracker(mock_hass)
    tracker.set_headcount(1)

    now = 3000.0
    tracker.handle_door_state_change("binary_sensor.front_door", True, now_ts=now)
    rec = tracker.handle_door_state_change("binary_sensor.front_door", False, now_ts=now + 4.0)

    assert rec is not None
    assert rec.vector == "egress"
    assert tracker.state.count == 0

