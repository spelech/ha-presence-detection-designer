"""Unit tests for Topological Path Corroboration, High-Confidence Preservation, Branching, and Candidate Settling."""

from __future__ import annotations

import time
from typing import Any
from unittest.mock import MagicMock

from custom_components.presence_detection_designer.const import (
    CONF_BAYESIAN_OBSERVATIONS,
    CONF_BOUNDARY_ENTITIES,
    CONF_CONNECTED_ROOMS,
    CONF_MODE,
    CONF_ROOM_NAME,
    CONF_TRIGGER_ENTITIES,
    DOMAIN,
    Mode,
)
from custom_components.presence_detection_designer.coordinator import RoomPresenceCoordinator
from custom_components.presence_detection_designer.evidence_snapshot import RoomEvidenceSnapshot
from custom_components.presence_detection_designer.floorplan_presets import get_default_floorplan
from custom_components.presence_detection_designer.trajectory_validator import (
    build_topology_graph,
    corroborate_transition_trajectory,
    find_all_simple_paths,
    is_room_high_confidence,
)


def _make_mock_coord(
    hass: Any,
    room_name: str,
    connected_rooms: list[str] | None = None,
    boundary_entities: list[str] | None = None,
    trigger_entities: list[str] | None = None,
    mode: Mode = Mode.OPEN,
) -> RoomPresenceCoordinator:
    entry_id = f"entry_{room_name.lower().replace(' ', '_')}"
    config = {
        CONF_ROOM_NAME: room_name,
        CONF_MODE: str(mode),
        CONF_CONNECTED_ROOMS: connected_rooms or [],
        CONF_TRIGGER_ENTITIES: trigger_entities
        or [f"binary_sensor.{room_name.lower().replace(' ', '_')}_motion"],
        CONF_BOUNDARY_ENTITIES: boundary_entities or [],
        CONF_BAYESIAN_OBSERVATIONS: [],
    }
    coord = RoomPresenceCoordinator(hass, entry_id, config)
    coord.state_machine.inactivity_timeout = 180
    return coord


def test_topology_graph_building_and_path_finding():
    """Verify adjacency graph building and branching path discovery."""
    fp = get_default_floorplan()
    graph = build_topology_graph(fp)

    assert "Master Bedroom" in graph
    assert "Living Room" in graph
    assert "Kitchen" in graph
    assert "Basement Play Area" in graph

    # Master Bedroom -> Living Room paths
    mbr_lr_paths = find_all_simple_paths(graph, "Master Bedroom", "Living Room")
    assert len(mbr_lr_paths) >= 2
    assert mbr_lr_paths[0] == [
        "Master Bedroom",
        "Upstairs Hallway & Stairs",
        "Front Entry",
        "Living Room",
    ]

    # Branching: Kitchen -> Living Room
    kitchen_lr_paths = find_all_simple_paths(graph, "Kitchen", "Living Room")
    assert len(kitchen_lr_paths) >= 2
    # One branch via Dining Room, one via Front Entry
    path_intermediaries = [tuple(p[1:-1]) for p in kitchen_lr_paths]
    assert ("Dining Room",) in path_intermediaries
    assert ("Front Entry",) in path_intermediaries

    # Master Bedroom -> Basement Play Area
    mbr_basement_paths = find_all_simple_paths(graph, "Master Bedroom", "Basement Play Area")
    assert len(mbr_basement_paths) >= 1
    assert "Upstairs Hallway & Stairs" in mbr_basement_paths[0]
    assert "Family Room" in mbr_basement_paths[0]


def test_high_confidence_source_preservation_blocks_impossible_jump(mock_hass):
    """Verify that high confidence in Master Bedroom suppresses impossible direct jump to Living Room."""
    mbr_coord = _make_mock_coord(
        mock_hass, "Master Bedroom", connected_rooms=["Upstairs Hallway & Stairs"]
    )
    lr_coord = _make_mock_coord(
        mock_hass, "Living Room", connected_rooms=["Front Entry", "Dining Room"]
    )

    mock_hass.data[DOMAIN] = {
        mbr_coord.entry_id: mbr_coord,
        lr_coord.entry_id: lr_coord,
    }

    # Master Bedroom has high-confidence visual presence via Frigate camera
    mbr_coord.state_machine.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.master_bedroom_camera_person"}),
            human_present=True,
            camera_confirmed=True,
            last_trigger_entity="binary_sensor.master_bedroom_camera_person",
        )
    )
    mbr_coord.last_spatial_estimate = {
        "human_present": True,
        "occupant_type": "human",
        "method": "positive",
        "positive_drivers": ["camera.master_bedroom_person_occupancy"],
    }
    assert is_room_high_confidence(mbr_coord) is True

    # Living Room receives a motion trigger with NO hallway activity
    trigger_event = MagicMock()
    trigger_event.data = {
        "entity_id": "binary_sensor.living_room_motion",
        "new_state": MagicMock(state="on"),
    }

    now = time.time()
    recent_act: dict[str, float] = {
        "Master Bedroom": now
    }  # Zero activity in Upstairs Hallway or Front Entry

    traj = corroborate_transition_trajectory(
        candidate_room="Living Room",
        all_coordinators=[mbr_coord, lr_coord],
        recent_activity_ts=recent_act,
        now_ts=now,
    )

    assert traj.is_valid is False
    assert "physically_impossible_jump" in traj.reason
    assert traj.source_room == "Master Bedroom"

    # Process trigger event on lr_coord
    lr_coord._handle_trigger_change(trigger_event)
    assert lr_coord.state_machine.is_present is False
    assert getattr(lr_coord, "_last_suppressed_reason", None) is not None


def test_corroborated_path_transition_success(mock_hass):
    """Verify transition succeeds when connecting hallway and entry sensors corroborate transit."""
    mbr_coord = _make_mock_coord(mock_hass, "Master Bedroom")
    lr_coord = _make_mock_coord(mock_hass, "Living Room")

    mock_hass.data[DOMAIN] = {
        mbr_coord.entry_id: mbr_coord,
        lr_coord.entry_id: lr_coord,
    }

    mbr_coord.state_machine.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.mbr_person"}),
            human_present=True,
            camera_confirmed=True,
            last_trigger_entity="binary_sensor.mbr_person",
        )
    )
    mbr_coord.last_spatial_estimate = {
        "human_present": True,
        "occupant_type": "human",
        "method": "positive",
        "positive_drivers": ["camera.master_bedroom"],
    }

    now = time.time()
    # Upstairs Hallway PIR fired 15 seconds ago, Front Entry keypad motion fired 5 seconds ago
    recent_act: dict[str, float] = {
        "Master Bedroom": now - 30.0,
        "Upstairs Hallway & Stairs": now - 15.0,
        "Front Entry": now - 5.0,
    }

    traj = corroborate_transition_trajectory(
        candidate_room="Living Room",
        all_coordinators=[mbr_coord, lr_coord],
        recent_activity_ts=recent_act,
        now_ts=now,
    )

    assert traj.is_valid is True
    assert traj.corroborated_path == [
        "Master Bedroom",
        "Upstairs Hallway & Stairs",
        "Front Entry",
        "Living Room",
    ]
    assert "corroborated_via" in traj.reason


def test_branching_path_corroboration(mock_hass):
    """Verify that branching routes (e.g. Dining Room vs Front Entry) confirm transition."""
    kitchen_coord = _make_mock_coord(mock_hass, "Kitchen")
    lr_coord = _make_mock_coord(mock_hass, "Living Room")

    mock_hass.data[DOMAIN] = {
        kitchen_coord.entry_id: kitchen_coord,
        lr_coord.entry_id: lr_coord,
    }

    kitchen_coord.state_machine.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.kitchen_person"}),
            human_present=True,
            camera_confirmed=True,
            last_trigger_entity="binary_sensor.kitchen_person",
        )
    )
    kitchen_coord.last_spatial_estimate = {
        "human_present": True,
        "occupant_type": "human",
        "method": "positive",
        "positive_drivers": ["camera.kitchen"],
    }

    now = time.time()
    # Branch 1: Person walked through Dining Room
    recent_act_dining: dict[str, float] = {
        "Kitchen": now - 10.0,
        "Dining Room": now - 3.0,
    }

    traj_dining = corroborate_transition_trajectory(
        candidate_room="Living Room",
        all_coordinators=[kitchen_coord, lr_coord],
        recent_activity_ts=recent_act_dining,
        now_ts=now,
    )
    assert traj_dining.is_valid is True
    assert traj_dining.corroborated_path == ["Kitchen", "Dining Room", "Living Room"]

    # Branch 2: Person walked through Front Entry
    recent_act_entry: dict[str, float] = {
        "Kitchen": now - 10.0,
        "Front Entry": now - 2.0,
    }
    traj_entry = corroborate_transition_trajectory(
        candidate_room="Living Room",
        all_coordinators=[kitchen_coord, lr_coord],
        recent_activity_ts=recent_act_entry,
        now_ts=now,
    )
    assert traj_entry.is_valid is True
    assert traj_entry.corroborated_path == ["Kitchen", "Front Entry", "Living Room"]


def test_adjacent_transit_not_blocked_by_wasp_in_box_seal(mock_hass):
    """Verify legacy WIB perimeter seal never blocks adjacent room trajectory transitions."""
    mbr_coord = _make_mock_coord(
        mock_hass,
        "Master Bedroom",
        connected_rooms=["Upstairs Hallway & Stairs"],
        boundary_entities=["binary_sensor.master_bedroom_door"],
        mode=Mode.BOUNDED,
    )
    hall_coord = _make_mock_coord(
        mock_hass, "Upstairs Hallway & Stairs", connected_rooms=["Master Bedroom"]
    )

    mock_hass.data[DOMAIN] = {
        mbr_coord.entry_id: mbr_coord,
        hall_coord.entry_id: hall_coord,
    }

    mbr_coord.state_machine.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.mbr_person"}), human_present=True
        )
    )
    now = time.time()
    traj = corroborate_transition_trajectory(
        candidate_room="Upstairs Hallway & Stairs",
        all_coordinators=[mbr_coord, hall_coord],
        recent_activity_ts={"Master Bedroom": now},
        now_ts=now,
    )
    assert traj.is_valid is True


def test_vacant_house_initial_entry(mock_hass):
    """Verify that entry points can trigger immediately when the house is vacant."""
    entry_coord = _make_mock_coord(mock_hass, "Front Entry")
    garage_coord = _make_mock_coord(mock_hass, "Garage")

    mock_hass.data[DOMAIN] = {
        entry_coord.entry_id: entry_coord,
        garage_coord.entry_id: garage_coord,
    }

    traj = corroborate_transition_trajectory(
        candidate_room="Front Entry",
        all_coordinators=[entry_coord, garage_coord],
        recent_activity_ts={},
        now_ts=time.time(),
    )
    assert traj.is_valid is True
    assert traj.reason == "house_vacant_initial_entry"


def test_candidate_settling_and_debounce(mock_hass):
    """Verify that unverified PIR pulses on non-adjacent rooms defer for settling, and fleeting spikes are discarded."""
    office_coord = _make_mock_coord(mock_hass, "Office")
    living_coord = _make_mock_coord(mock_hass, "Living Room")
    living_coord.config["settling_window_sec"] = 2.0

    mock_hass.data[DOMAIN] = {
        office_coord.entry_id: office_coord,
        living_coord.entry_id: living_coord,
    }

    # Office is occupied
    office_coord.state_machine.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.office_pir"}),
            human_present=True,
            last_trigger_entity="binary_sensor.office_pir",
        )
    )
    assert office_coord.state_machine.is_present is True

    # Hallway and Entry had corroborating activity
    now = time.time()
    mock_hass.data[DOMAIN]["_store"] = MagicMock()
    mock_hass.data[DOMAIN]["_store"].global_settings = {
        "transit_window_sec": 90.0,
        "settling_window_sec": 2.0,
    }
    mock_hass.data[DOMAIN]["_store"].get_floorplan = MagicMock(return_value=get_default_floorplan())
    mock_hass.data[DOMAIN]["_store"]._last_spatial_frame = {
        "recent_activity_ts": {
            "Office": now,
            "Upstairs Hallway & Stairs": now - 10.0,
            "Front Entry": now - 3.0,
        }
    }

    # Pulse 1: Single unverified PIR pulse in Living Room arrives
    pulse_on = MagicMock()
    pulse_on.data = {
        "entity_id": "binary_sensor.living_room_motion",
        "new_state": MagicMock(state="on"),
    }
    living_coord._handle_trigger_change(pulse_on)

    # Deferral: Living Room does NOT immediately become occupied!
    assert living_coord.state_machine.is_present is False
    assert living_coord._settling_entity == "binary_sensor.living_room_motion"

    # If the sensor turns off before settling completes (fleeting 300ms spike):
    pulse_off = MagicMock()
    pulse_off.data = {
        "entity_id": "binary_sensor.living_room_motion",
        "new_state": MagicMock(state="off"),
    }
    living_coord._handle_trigger_change(pulse_off)
    assert living_coord.state_machine.is_present is False
    assert living_coord._settling_entity is None

    # Sustained: Now test when motion is confirmed by a second hit
    living_coord._handle_trigger_change(pulse_on)
    assert living_coord._settling_entity == "binary_sensor.living_room_motion"

    # Second hit confirms presence
    living_coord._handle_trigger_change(pulse_on)
    assert living_coord.state_machine.is_present is True
    assert living_coord._settling_entity is None


def test_high_confidence_trigger_settles_immediately(mock_hass):
    """Verify that high-confidence Frigate visual detection settles immediately without deferral."""
    office_coord = _make_mock_coord(mock_hass, "Office")
    living_coord = _make_mock_coord(mock_hass, "Living Room")
    living_coord.config["settling_window_sec"] = 2.0

    mock_hass.data[DOMAIN] = {
        office_coord.entry_id: office_coord,
        living_coord.entry_id: living_coord,
    }

    office_coord.state_machine.apply_evidence(
        RoomEvidenceSnapshot(
            active_triggers=frozenset({"binary_sensor.office_pir"}),
            human_present=True,
            last_trigger_entity="binary_sensor.office_pir",
        )
    )

    now = time.time()
    mock_hass.data[DOMAIN]["_store"] = MagicMock()
    mock_hass.data[DOMAIN]["_store"].global_settings = {
        "transit_window_sec": 90.0,
        "settling_window_sec": 2.0,
    }
    mock_hass.data[DOMAIN]["_store"].get_floorplan = MagicMock(return_value=get_default_floorplan())
    mock_hass.data[DOMAIN]["_store"]._last_spatial_frame = {
        "recent_activity_ts": {
            "Office": now,
            "Upstairs Hallway & Stairs": now - 10.0,
            "Front Entry": now - 3.0,
        }
    }

    # Camera visual person detection arrives
    cam_event = MagicMock()
    cam_event.data = {
        "entity_id": "camera.living_room_person_occupancy",
        "new_state": MagicMock(state="on"),
    }
    living_coord._handle_trigger_change(cam_event)

    # Immediately promotes to occupied
    assert living_coord.state_machine.is_present is True
    assert living_coord._settling_entity is None


def test_topology_and_paths_built_once_and_cached():
    """Verify topology graph and multi-hop paths are precomputed once and cached."""
    from unittest.mock import patch

    from custom_components.presence_detection_designer.trajectory_validator import (
        _TOPOLOGY_CACHE,
        clear_topology_cache,
        get_topology_and_paths,
    )

    clear_topology_cache()
    assert len(_TOPOLOGY_CACHE) == 0

    # First call builds and caches graph + paths
    graph1, paths1 = get_topology_and_paths()
    assert len(_TOPOLOGY_CACHE) == 1
    assert "Living Room" in graph1
    assert ("Master Bedroom", "Living Room") in paths1
    assert len(paths1[("Master Bedroom", "Living Room")]) > 0

    # Second call returns exact cached references without rebuilding
    with patch(
        "custom_components.presence_detection_designer.trajectory_validator.build_topology_graph"
    ) as mock_build:
        graph2, paths2 = get_topology_and_paths()
        mock_build.assert_not_called()
        assert graph1 is graph2
        assert paths1 is paths2

    # Clear cache resets it
    clear_topology_cache()
    assert len(_TOPOLOGY_CACHE) == 0
