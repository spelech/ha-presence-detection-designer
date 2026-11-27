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
    Mode,
    OccupancyState,
)
from custom_components.presence_detection_designer.engine.coordinator import RoomPresenceCoordinator
from custom_components.presence_detection_designer.engine.evidence_snapshot import (
    RoomEvidenceSnapshot,
)
from custom_components.presence_detection_designer.sensor import (
    HouseHeadcountSensor,
)
from custom_components.presence_detection_designer.spatial.house_perimeter import (
    HousePerimeterTracker,
    get_house_perimeter_tracker,
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
    return coord


def test_house_perimeter_tracker_singleton(mock_hass):
    """Verify singleton retrieval and initialization in hass.data."""
    mock_hass.data[DOMAIN] = {}
    t1 = get_house_perimeter_tracker(mock_hass)
    t2 = get_house_perimeter_tracker(mock_hass)
    assert t1 is t2
    assert isinstance(t1, HousePerimeterTracker)
    assert t1.state.count == 1
    assert t1.state.mode == "occupied"


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
    assert tracker.state.mode == "occupied"
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
    front_entry_coord.state_machine.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.front_entry_pir"}),
            human_present=True,
            last_trigger_entity="binary_sensor.front_entry_pir",
        )
    )
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


@pytest.mark.requirement("GUARD-03", category="GUARD", req_type="FailClosedGuardrail")
def test_headcount_zero_and_conservation_law_decoupled_from_rooms(mock_hass):
    """@requirement GUARD-03: Whole-house headcount changes and enforce_conservation_law never clear rooms."""
    office_coord = _make_mock_coord(mock_hass, "Office")
    living_coord = _make_mock_coord(mock_hass, "Living Room")

    mock_hass.data[DOMAIN] = {
        office_coord.entry_id: office_coord,
        living_coord.entry_id: living_coord,
    }

    office_coord.state_machine.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.office_motion"}), human_present=True
        )
    )
    living_coord.state_machine.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.living_room_motion"}), human_present=True
        )
    )
    living_coord.state_machine.apply_evidence(RoomEvidenceSnapshot())
    assert office_coord.state_machine.state == OccupancyState.OCCUPIED_CONFIRMED
    assert living_coord.state_machine.state == OccupancyState.OCCUPIED_COOLING

    tracker = HousePerimeterTracker(mock_hass)
    tracker.set_headcount(0)
    cleared = tracker.enforce_conservation_law(newly_occupied_room="Kitchen")

    assert cleared == []
    assert office_coord.state_machine.is_present is True
    assert living_coord.state_machine.is_present is True


def test_house_headcount_sensor_attributes_and_updates(mock_hass):
    """Verify HouseHeadcountSensor native value, attributes, and update listener reactivity."""
    # An occupant is home in another room, so an arrival through the front door
    # is physically plausible and should increment the count.
    living = _make_mock_coord(mock_hass, "Living Room")
    mock_hass.data[DOMAIN] = {living.entry_id: living}
    living.state_machine.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.living_room_motion"}),
            human_present=True,
            last_trigger_entity="binary_sensor.living_room_motion",
        )
    )

    tracker = HousePerimeterTracker(mock_hass)
    tracker.set_headcount(0)

    sensor = HouseHeadcountSensor(tracker)
    assert sensor.name == "House Occupant Count"
    assert sensor.unique_id == f"{DOMAIN}_house_occupant_count"
    assert sensor.native_value == 0
    assert sensor.extra_state_attributes["occupancy_mode"] == "vacant"
    assert sensor.extra_state_attributes["last_perimeter_door"] is None

    # Simulate arrival door transit from vacant -> occupied
    now = time.time()
    tracker.handle_door_state_change("binary_sensor.front_door", True, now_ts=now)
    tracker.handle_door_state_change("binary_sensor.front_door", False, now_ts=now + 3.0)

    attrs = sensor.extra_state_attributes
    assert sensor.native_value == 1
    assert attrs["occupancy_mode"] == "occupied"
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
    call = MagicMock(data={"mode": "guest"})
    with patch(
        "custom_components.presence_detection_designer.async_get_store",
        AsyncMock(return_value=mock_store),
    ):
        await handler(call)

    tracker = get_house_perimeter_tracker(mock_hass)
    assert tracker.state.count == 2
    assert tracker.state.mode == "guest"
    mock_store.async_update_global_settings.assert_called_once_with(
        {
            "house_occupancy_mode": "guest",
            "house_occupant_count": 2,
            "guest_mode_enabled": True,
        }
    )


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
    assert tracker.state.mode == "occupied"


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
    living.state_machine.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.living_room_motion"}),
            human_present=True,
            last_trigger_entity="binary_sensor.living_room_motion",
        )
    )

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
    """Any numeric override >= 2 normalizes immediately to categorical guest mode (count=2)."""
    _install_global_settings(mock_hass, **{CONF_MAX_OCCUPANTS: 2})
    tracker = HousePerimeterTracker(mock_hass)
    tracker.set_headcount(7)

    assert tracker.state.count == 2
    assert tracker.state.mode == "guest"
    changed = tracker.reconcile_headcount(now_ts=time.time(), force=True)
    assert changed is False
    assert tracker.state.count == 2
    assert tracker.state.mode == "guest"


def test_stale_positive_count_resets_when_all_rooms_clear(mock_hass):
    """A positive count is reconciled to zero after a sustained whole-house vacancy."""
    _install_global_settings(mock_hass, **{CONF_STALE_COUNT_TIMEOUT: 10})
    tracker = HousePerimeterTracker(mock_hass)
    tracker.set_house_mode("guest")
    mock_hass.data[DOMAIN] = {DATA_STORE: mock_hass.data[DOMAIN][DATA_STORE]}

    assert tracker.reconcile_headcount(now_ts=1000.0, force=True) is False
    assert tracker.state.count == 2
    assert tracker.state.mode == "guest"

    changed = tracker.reconcile_headcount(now_ts=1011.0, force=True)

    assert changed is True
    assert tracker.state.count == 0
    assert tracker.state.mode == "vacant"


def test_ingress_while_others_home_requires_plausible_count(mock_hass):
    """Door cycles while already occupied or in guest mode never inflate integer headcount."""
    living = _make_mock_coord(mock_hass, "Living Room")
    kitchen = _make_mock_coord(mock_hass, "Kitchen")
    mock_hass.data[DOMAIN] = {
        living.entry_id: living,
        kitchen.entry_id: kitchen,
        DATA_STORE: MagicMock(global_settings={}),
    }
    living.state_machine.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.living_room_motion"}),
            human_present=True,
            last_trigger_entity="binary_sensor.living_room_motion",
        )
    )

    tracker = HousePerimeterTracker(mock_hass)
    tracker.set_house_mode("occupied")

    now = time.time()
    tracker.handle_door_state_change("binary_sensor.front_door", True, now_ts=now)
    rec = tracker.handle_door_state_change("binary_sensor.front_door", False, now_ts=now + 4.0)
    assert rec is not None and rec.vector == "ambiguous"
    assert tracker.state.mode == "occupied"
    assert tracker.state.count == 1

    kitchen.state_machine.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.kitchen_motion"}),
            human_present=True,
            last_trigger_entity="binary_sensor.kitchen_motion",
        )
    )
    tracker.handle_door_state_change("binary_sensor.front_door", True, now_ts=now + 10.0)
    rec2 = tracker.handle_door_state_change("binary_sensor.front_door", False, now_ts=now + 14.0)

    assert rec2 is not None and rec2.vector == "ambiguous"
    assert tracker.state.mode == "occupied"
    assert tracker.state.count == 1


def test_side_door_exit_held_pending_without_exterior_motion(mock_hass):
    """Side door exit without exterior motion is held as pending_egress without count decrement."""
    garage = _make_mock_coord(mock_hass, "Garage")
    mock_hass.data.setdefault(DOMAIN, {})
    mock_hass.data[DOMAIN][garage.entry_id] = garage
    garage.state_machine.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.garage_motion"}),
            human_present=True,
            last_trigger_entity="binary_sensor.garage_motion",
        )
    )

    tracker = HousePerimeterTracker(mock_hass)
    tracker.set_headcount(1)

    now = 1000.0
    tracker.handle_door_state_change("binary_sensor.garage_side_door", True, now_ts=now)
    rec = tracker.handle_door_state_change(
        "binary_sensor.garage_side_door", False, now_ts=now + 5.0
    )

    assert rec is not None
    assert rec.vector == "pending_egress"
    assert tracker.state.count == 1
    assert len(tracker._pending_exit_corroborations) == 1
    assert (
        tracker._pending_exit_corroborations[0]["door_entity"] == "binary_sensor.garage_side_door"
    )


def test_side_door_exit_immediately_corroborated_by_driveway_motion(mock_hass):
    """Side door exit with prior exterior motion immediately vectors to egress and decrements count."""
    garage = _make_mock_coord(mock_hass, "Garage")
    mock_hass.data.setdefault(DOMAIN, {})
    mock_hass.data[DOMAIN][garage.entry_id] = garage
    garage.state_machine.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.garage_motion"}),
            human_present=True,
            last_trigger_entity="binary_sensor.garage_motion",
        )
    )

    tracker = HousePerimeterTracker(mock_hass)
    tracker.set_headcount(1)

    now = 1000.0
    tracker.handle_exterior_state_change(
        "binary_sensor.driveway_spotlight_camera_motion", True, now_ts=now - 2.0
    )
    tracker.handle_door_state_change("binary_sensor.garage_side_door", True, now_ts=now)
    rec = tracker.handle_door_state_change(
        "binary_sensor.garage_side_door", False, now_ts=now + 5.0
    )

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
    garage.state_machine.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.garage_motion"}),
            human_present=True,
            last_trigger_entity="binary_sensor.garage_motion",
        )
    )

    tracker = HousePerimeterTracker(mock_hass)
    tracker.set_house_mode("occupied")

    now = 1000.0
    tracker.handle_door_state_change("binary_sensor.garage_side_door", True, now_ts=now)
    rec = tracker.handle_door_state_change(
        "binary_sensor.garage_side_door", False, now_ts=now + 5.0
    )

    assert rec is not None and rec.vector == "pending_egress"
    assert tracker.state.count == 1
    assert tracker.state.mode == "occupied"

    # Backyard motion trips 15 seconds after door closed (within 30s window)
    resolved = tracker.handle_exterior_state_change(
        "binary_sensor.backyard_motion", True, now_ts=now + 20.0
    )

    assert len(resolved) == 1
    assert resolved[0].vector == "egress"
    assert "binary_sensor.backyard_motion" in resolved[0].details
    assert tracker.state.count == 0
    assert tracker.state.mode == "vacant"
    assert len(tracker._pending_exit_corroborations) == 0


def test_side_door_exit_corroboration_window_expires_as_ambiguous(mock_hass):
    """Uncorroborated side door exit times out into ambiguous with 0 headcount decrement."""
    garage = _make_mock_coord(mock_hass, "Garage")
    mock_hass.data.setdefault(DOMAIN, {})
    mock_hass.data[DOMAIN][garage.entry_id] = garage
    garage.state_machine.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.garage_motion"}),
            human_present=True,
            last_trigger_entity="binary_sensor.garage_motion",
        )
    )

    tracker = HousePerimeterTracker(mock_hass)
    tracker.set_house_mode("occupied")

    now = 1000.0
    tracker.handle_door_state_change("binary_sensor.garage_side_door", True, now_ts=now)
    rec = tracker.handle_door_state_change(
        "binary_sensor.garage_side_door", False, now_ts=now + 5.0
    )
    assert rec is not None and rec.vector == "pending_egress"
    assert tracker.state.count == 1
    assert tracker.state.mode == "occupied"

    # 35 seconds later (window was 30s) reconcile_headcount runs
    resolved = tracker.check_pending_exit_corroborations(now_ts=now + 40.0)

    assert len(resolved) == 1
    assert resolved[0].vector == "ambiguous"
    assert tracker.state.count == 1  # Not decremented!
    assert tracker.state.mode == "occupied"
    assert len(tracker._pending_exit_corroborations) == 0


def test_custom_exit_corroborators_and_window_config(mock_hass):
    """Custom door exit corroborators and window settings are honored from store."""
    _install_global_settings(
        mock_hass,
        **{
            CONF_EXIT_CORROBORATORS: {"binary_sensor.back_door": ["binary_sensor.patio_motion"]},
            CONF_EXIT_CORROBORATION_WINDOW: 15.0,
        },
    )
    kitchen = _make_mock_coord(mock_hass, "Kitchen")
    mock_hass.data.setdefault(DOMAIN, {})
    mock_hass.data[DOMAIN][kitchen.entry_id] = kitchen
    kitchen.state_machine.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.kitchen_motion"}),
            human_present=True,
            last_trigger_entity="binary_sensor.kitchen_motion",
        )
    )

    tracker = HousePerimeterTracker(mock_hass)
    tracker.set_headcount(1)

    now = 2000.0
    tracker.handle_door_state_change("binary_sensor.back_door", True, now_ts=now)
    rec = tracker.handle_door_state_change("binary_sensor.back_door", False, now_ts=now + 4.0)

    assert rec is not None and rec.vector == "pending_egress"
    assert tracker.state.count == 1

    # Driveway motion does NOT corroborate back door
    resolved_wrong = tracker.handle_exterior_state_change(
        "binary_sensor.driveway_camera_motion", True, now_ts=now + 6.0
    )
    assert len(resolved_wrong) == 0
    assert tracker.state.count == 1

    # Patio motion corroborates back door
    resolved = tracker.handle_exterior_state_change(
        "binary_sensor.patio_motion", True, now_ts=now + 8.0
    )
    assert len(resolved) == 1
    assert resolved[0].vector == "egress"
    assert tracker.state.count == 0


def test_unconfigured_door_does_not_require_exterior_corroboration(mock_hass):
    """Perimeter doors without configured exit corroborators exit directly."""
    entry = _make_mock_coord(mock_hass, "Front Entry")
    mock_hass.data.setdefault(DOMAIN, {})
    mock_hass.data[DOMAIN][entry.entry_id] = entry
    entry.state_machine.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.front_entry_motion"}),
            human_present=True,
            last_trigger_entity="binary_sensor.front_entry_motion",
        )
    )

    tracker = HousePerimeterTracker(mock_hass)
    tracker.set_headcount(1)

    now = 3000.0
    tracker.handle_door_state_change("binary_sensor.front_door", True, now_ts=now)
    rec = tracker.handle_door_state_change("binary_sensor.front_door", False, now_ts=now + 4.0)

    assert rec is not None
    assert rec.vector == "egress"
    assert tracker.state.count == 0


@pytest.mark.asyncio
async def test_async_setup_subscribes_perimeter_doors_and_persists_digest(
    mock_hass, monkeypatch: pytest.MonkeyPatch
):
    """async_setup subscribes to all configured perimeter doors, seeds state, ignores unavailable, and persists/updates Slack."""
    from types import SimpleNamespace

    _install_global_settings(mock_hass, house_occupant_count=0)
    tracker = HousePerimeterTracker(mock_hass)
    assert tracker.state.count == 0

    subscribed: list[tuple[list[str], Any]] = []
    unsub_calls = 0

    def _fake_track(hass_arg, entities, cb):
        subscribed.append((list(entities), cb))

        def _unsub():
            nonlocal unsub_calls
            unsub_calls += 1

        return _unsub

    mock_hass.states.get = lambda eid: SimpleNamespace(
        state="on" if eid == "binary_sensor.back_door" else "off"
    )
    monkeypatch.setattr(
        "homeassistant.helpers.event.async_track_state_change_event",
        _fake_track,
    )

    await tracker.async_setup()
    # Re-running async_setup must clean up previous listeners
    await tracker.async_setup()
    assert unsub_calls == 2
    assert tracker._door_is_open["binary_sensor.back_door"] is True
    assert tracker._door_is_open["binary_sensor.front_door"] is False

    door_entities, door_cb = subscribed[-2]
    assert "binary_sensor.front_door" in door_entities
    assert "binary_sensor.back_door" in door_entities

    # Unavailable/unknown transitions must be ignored
    door_cb(
        SimpleNamespace(
            data={
                "entity_id": "binary_sensor.front_door",
                "new_state": SimpleNamespace(state="unavailable"),
            }
        )
    )
    assert tracker.state.count == 0

    # Real open -> close cycle on front_door (with no room boundary_entities) increments headcount & persists
    door_cb(
        SimpleNamespace(
            data={
                "entity_id": "binary_sensor.front_door",
                "new_state": SimpleNamespace(state="on"),
            }
        )
    )
    door_cb(
        SimpleNamespace(
            data={
                "entity_id": "binary_sensor.front_door",
                "new_state": SimpleNamespace(state="off"),
            }
        )
    )
    assert tracker.state.count == 1
    assert tracker.state.mode == "occupied"
    assert mock_hass.data[DOMAIN][DATA_STORE].global_settings["house_occupant_count"] == 1


def test_garage_arrival_when_vacant_ignores_motion_after_door_opens(mock_hass):
    """Arriving via cover.garage_door trips Garage motion while open, and must still count as ingress."""
    garage = _make_mock_coord(mock_hass, "Garage")
    mock_hass.data.setdefault(DOMAIN, {})
    mock_hass.data[DOMAIN][garage.entry_id] = garage

    tracker = HousePerimeterTracker(mock_hass)
    tracker.set_headcount(0)

    now = 1000.0
    # Garage is empty when door starts opening
    assert garage.state_machine.is_present is False
    tracker.handle_door_state_change("cover.garage_door", True, now_ts=now)

    # Car enters Garage while door is open, activating Garage motion BEFORE door closes
    garage.state_machine.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.garage_ring_motion"}),
            human_present=True,
            last_trigger_entity="binary_sensor.garage_ring_motion",
        ),
        now_ts=now + 6.0,
    )
    assert garage.state_machine.is_present is True

    # Garage door closes -> must classify as ingress (0 -> 1), NEVER egress (0 -> 0)
    rec = tracker.handle_door_state_change("cover.garage_door", False, now_ts=now + 20.0)
    assert rec is not None
    assert rec.vector == "ingress"
    assert tracker.state.count == 1
    assert tracker.state.mode == "occupied"


def test_garage_arrival_while_spouse_home_increments_headcount(mock_hass):
    """Second occupant arriving via garage door while Living Room is occupied increments 1 -> 2."""
    living = _make_mock_coord(mock_hass, "Living Room")
    garage = _make_mock_coord(mock_hass, "Garage")
    mock_hass.data.setdefault(DOMAIN, {})
    mock_hass.data[DOMAIN][living.entry_id] = living
    mock_hass.data[DOMAIN][garage.entry_id] = garage

    living.state_machine.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.living_room_motion"}),
            human_present=True,
            last_trigger_entity="binary_sensor.living_room_motion",
        ),
        now_ts=900.0,
    )

    tracker = HousePerimeterTracker(mock_hass)
    tracker.set_headcount(1)

    now = 1000.0
    tracker.handle_door_state_change("cover.garage_door", True, now_ts=now)
    garage.state_machine.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.garage_ring_motion"}),
            human_present=True,
            last_trigger_entity="binary_sensor.garage_ring_motion",
        ),
        now_ts=now + 5.0,
    )

    rec = tracker.handle_door_state_change("cover.garage_door", False, now_ts=now + 18.0)
    assert rec is not None
    assert rec.vector == "ambiguous"
    assert tracker.state.count == 1
    assert tracker.state.mode == "occupied"


def test_vacant_count_never_emits_egress_on_interior_door_cycle(mock_hass):
    """When count is 0 and host room already had motion, door cycle must not emit a bogus egress."""
    kitchen = _make_mock_coord(mock_hass, "Kitchen")
    mock_hass.data.setdefault(DOMAIN, {})
    mock_hass.data[DOMAIN][kitchen.entry_id] = kitchen
    kitchen.state_machine.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.kitchen_motion"}),
            human_present=True,
            last_trigger_entity="binary_sensor.kitchen_motion",
        ),
        now_ts=995.0,
    )

    tracker = HousePerimeterTracker(mock_hass)
    tracker.set_headcount(0)

    now = 1000.0
    tracker.handle_door_state_change("binary_sensor.back_door", True, now_ts=now)
    rec = tracker.handle_door_state_change("binary_sensor.back_door", False, now_ts=now + 4.0)
    assert rec is not None
    assert rec.vector == "ambiguous"
    assert tracker.state.count == 0


def test_reconcile_headcount_preserves_count_when_ble_resident_active(mock_hass):
    """Configured BLE resident trackers in an active area prevent false stale-count resets to 0."""
    _install_global_settings(
        mock_hass,
        **{
            CONF_STALE_COUNT_TIMEOUT: 10,
            "ble_trackers": ["sensor.steve_s_s25_ble_area"],
        },
    )
    mock_hass.states.get = MagicMock(return_value=MagicMock(state="Family Room"))
    tracker = HousePerimeterTracker(mock_hass)
    tracker.set_headcount(1)
    mock_hass.data[DOMAIN] = {DATA_STORE: mock_hass.data[DOMAIN][DATA_STORE]}

    assert tracker.reconcile_headcount(now_ts=1000.0, force=True) is False
    assert tracker.reconcile_headcount(now_ts=1050.0, force=True) is False
    assert tracker.state.count == 1

    # Once BLE tracker reports away/unknown and all rooms stay clear, stale timeout applies
    mock_hass.states.get = MagicMock(return_value=MagicMock(state="unknown"))
    assert tracker.reconcile_headcount(now_ts=1100.0, force=True) is False
    assert tracker.reconcile_headcount(now_ts=1111.0, force=True) is True
    assert tracker.state.count == 0


@pytest.mark.asyncio
async def test_async_setup_reloads_initial_headcount_when_store_loaded_late(mock_hass):
    """If tracker is constructed before store loads, async_setup picks up saved headcount."""
    mock_hass.data[DOMAIN] = {}
    tracker = HousePerimeterTracker(mock_hass)
    assert tracker.state.count == 1

    _install_global_settings(mock_hass, house_occupancy_mode="guest", house_occupant_count=2)
    await tracker.async_setup()
    assert tracker.state.mode == "guest"
    assert tracker.state.count == 2


def test_panel_js_strips_house_occupant_count_from_global_settings_save():
    """Global settings UI save must never re-submit stale house_occupant_count."""
    from pathlib import Path

    static_dir = (
        Path(__file__).resolve().parents[2]
        / "custom_components"
        / "presence_detection_designer"
        / "static"
    )
    panel_js = "\n".join(p.read_text(encoding="utf-8") for p in sorted(static_dir.rglob("*.js")))
    assert "delete payload.house_occupant_count;" in panel_js


def test_cooling_rooms_do_not_block_single_occupant_garage_egress(mock_hass):
    """Trailing occupied_cooling rooms from a departing resident must not block garage egress."""
    office = _make_mock_coord(mock_hass, "Office")
    garage = _make_mock_coord(mock_hass, "Garage")
    mock_hass.data.setdefault(DOMAIN, {})
    mock_hass.data[DOMAIN][office.entry_id] = office
    mock_hass.data[DOMAIN][garage.entry_id] = garage

    now = 1000.0
    office.state_machine.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.office_motion"}),
            human_present=True,
            last_trigger_entity="binary_sensor.office_motion",
        ),
        now_ts=now,
    )
    # Person leaves Office toward Garage -> Office enters passive occupied_cooling
    office.state_machine.apply_evidence(RoomEvidenceSnapshot(), now_ts=now + 10.0)
    assert office.state_machine.state == OccupancyState.OCCUPIED_COOLING

    # Garage becomes active before garage door opens
    garage.state_machine.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.garage_ring_motion"}),
            human_present=True,
            last_trigger_entity="binary_sensor.garage_ring_motion",
        ),
        now_ts=now + 20.0,
    )

    tracker = HousePerimeterTracker(mock_hass)
    tracker.set_house_mode("occupied")

    tracker.handle_door_state_change("cover.garage_door", True, now_ts=now + 25.0)
    rec = tracker.handle_door_state_change("cover.garage_door", False, now_ts=now + 45.0)
    assert rec is not None
    assert rec.vector == "egress"
    assert tracker.state.mode == "vacant"
    assert tracker.state.count == 0


def test_reconcile_uses_short_settle_after_recent_ambiguous_door_exit(mock_hass):
    """A recent ambiguous perimeter door cycle reconciles 60s after all rooms and BLE clear."""
    _install_global_settings(
        mock_hass,
        **{
            CONF_STALE_COUNT_TIMEOUT: 900,
            "ble_trackers": ["sensor.steve_s_s25_ble_area"],
        },
    )
    mock_hass.states.get = MagicMock(return_value=MagicMock(state="unknown"))
    tracker = HousePerimeterTracker(mock_hass)
    tracker.set_house_mode("occupied")
    mock_hass.data[DOMAIN] = {DATA_STORE: mock_hass.data[DOMAIN][DATA_STORE]}

    # Simulate a recent ambiguous perimeter door closure (e.g. lingering room motion)
    tracker.state.last_event_type = "ambiguous"
    tracker.state.last_event_ts = 1000.0

    # All rooms and BLE are now clear at t=1120 -> sets _all_clear_since=1120
    assert tracker.reconcile_headcount(now_ts=1120.0, occupied_room_names=[], force=True) is False
    # Still occupied before 60s settle
    assert tracker.reconcile_headcount(now_ts=1150.0, occupied_room_names=[], force=True) is False
    # Reconciles to vacant after 60s without waiting the full 900s
    assert tracker.reconcile_headcount(now_ts=1181.0, occupied_room_names=[], force=True) is True
    assert tracker.state.mode == "vacant"
    assert tracker.state.count == 0
