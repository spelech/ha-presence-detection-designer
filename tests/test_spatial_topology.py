"""Tests for 2D Spatial Floorplan & Camera View Cone Compiler, Cross-Room Hand-Off, and 0% Idle Probability."""

from __future__ import annotations

import json
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest

from custom_components.presence_detection_designer.bayesian_engine import evaluate_bayesian
from custom_components.presence_detection_designer.const import (
    CONF_BAYESIAN_OBSERVATIONS,
    CONF_BOUNDARY_ENTITIES,
    CONF_CONNECTED_ROOMS,
    CONF_MODE,
    CONF_ROOM_NAME,
    CONF_TRIGGER_ENTITIES,
    DOMAIN,
    BoxState,
    Mode,
)
from custom_components.presence_detection_designer.coordinator import RoomPresenceCoordinator
from custom_components.presence_detection_designer.spatial_topology import (
    DEVICE_MODEL_PRESETS,
    apply_compiled_topology_to_config,
    compile_floorplan_topology,
    compute_camera_visibility_polygon,
    compute_cone_room_overlap_pct,
    extract_floor_wall_segments,
    get_default_floorplan,
    line_segment_intersects_solid_wall,
    point_in_cone,
    ray_segment_intersection,
)
from custom_components.presence_detection_designer.state_machine import RoomStateMachine
from custom_components.presence_detection_designer.views import PDDFloorplanView


def _unpack(resp: Any) -> tuple[int, dict[str, Any]]:
    """Extract (status_code, json_dict) from either aiohttp.web.Response or fallback dict."""
    if isinstance(resp, dict) and "status_code" in resp:
        return int(resp["status_code"]), resp["body"]
    status = getattr(resp, "status", 200)
    raw_body = getattr(resp, "body", b"{}")
    if isinstance(raw_body, bytes):
        return status, json.loads(raw_body.decode("utf-8"))
    return status, json.loads(str(raw_body))


def test_zero_percent_probability_when_idle_and_timer_decay():
    """Verify 0.0% probability when no observations are active, and smooth decay during TIMER_ACTIVE."""
    obs = [
        {
            "entity_id": "binary_sensor.living_room_couch_person_occupancy",
            "label": "Couch Zone",
            "preset": "decisive",
            "state": "on",
        }
    ]
    eval_idle = evaluate_bayesian(
        observations=obs,
        state_getter=lambda _eid: MagicMock(state="off", attributes={}),
        prior=0.20,
        threshold=0.75,
    )
    assert eval_idle.probability == 0.0
    assert eval_idle.probability_pct == 0.0
    assert eval_idle.is_occupied is False

    sm = RoomStateMachine(
        name="Living Room",
        mode=Mode.OPEN,
        inactivity_timeout=100,
        llm_enabled=False,
        bayesian_prior=0.20,
        bayesian_threshold=0.75,
    )
    assert sm.bayesian_probability_pct == 0.0

    # Activate presence via Bayesian
    eval_active = evaluate_bayesian(
        observations=obs,
        state_getter=lambda _eid: MagicMock(state="on", attributes={}),
        prior=0.20,
        threshold=0.75,
    )
    assert eval_active.probability_pct > 80.0
    sm.handle_bayesian(
        probability=eval_active.probability,
        probability_pct=eval_active.probability_pct,
        is_occupied=True,
        summary=eval_active.natural_language_summary,
        active_observations=eval_active.active_observations,
        inactive_observations=[],
    )
    assert sm.is_present is True
    assert sm.box_state == BoxState.OCCUPIED

    # Sensor clears -> starts 100s countdown timer
    sm.handle_bayesian(
        probability=0.0,
        probability_pct=0.0,
        is_occupied=False,
        summary="Idle",
        active_observations=[],
        inactive_observations=eval_idle.inactive_observations,
    )
    assert sm.box_state == BoxState.TIMER_ACTIVE
    assert sm.vacating_countdown == 100
    assert sm.bayesian_probability_pct > 0.0

    # Tick 50s -> probability decays halfway toward 0.0%
    sm.handle_tick(50)
    mid_pct = sm.bayesian_probability_pct
    assert 0.0 < mid_pct < 75.0

    # Tick remaining 50s -> vacates to 0.0%
    action = sm.handle_tick(50)
    assert action == "VACATED"
    assert sm.is_present is False
    assert sm.box_state == BoxState.IDLE_CLEAR
    assert sm.bayesian_probability_pct == 0.0


def test_open_vs_bounded_box_state_no_fake_sealed():
    """Verify Mode.OPEN never reports BoxState.OCCUPIED_SEALED, and Mode.BOUNDED without doors does not seal."""
    sm_open = RoomStateMachine(name="Front Entry", mode=Mode.OPEN, inactivity_timeout=60)
    sm_open.handle_trigger("binary_sensor.entry_motion", is_active=True)
    assert sm_open.box_state == BoxState.OCCUPIED

    sm_bounded_no_doors = RoomStateMachine(
        name="Storage Room", mode=Mode.BOUNDED, inactivity_timeout=60, has_boundaries=False
    )
    sm_bounded_no_doors.handle_trigger("binary_sensor.storage_person", is_active=True)
    assert sm_bounded_no_doors.box_state == BoxState.OCCUPIED

    sm_bounded_with_door = RoomStateMachine(
        name="Master Bedroom", mode=Mode.BOUNDED, inactivity_timeout=60
    )
    sm_bounded_with_door.handle_boundary("binary_sensor.master_bedroom_door", is_open=False)
    sm_bounded_with_door.handle_trigger("binary_sensor.bed_person", is_active=True)
    assert sm_bounded_with_door.box_state == BoxState.OCCUPIED_SEALED


def test_cross_room_timer_handoff(mock_hass):
    """Verify that when an adjacent connected room detects a person, a vacating timer zeros out immediately."""
    lr_cfg = {
        CONF_ROOM_NAME: "Living Room",
        CONF_MODE: Mode.OPEN,
        CONF_CONNECTED_ROOMS: ["Dining Room", "Front Entry"],
        CONF_TRIGGER_ENTITIES: ["binary_sensor.lr_zone"],
        "inactivity_timeout": 240,
    }
    dr_cfg = {
        CONF_ROOM_NAME: "Dining Room",
        CONF_MODE: Mode.OPEN,
        CONF_CONNECTED_ROOMS: ["Living Room", "Kitchen"],
        CONF_TRIGGER_ENTITIES: ["binary_sensor.dr_zone"],
        "inactivity_timeout": 180,
    }

    states = {
        "binary_sensor.lr_zone": MagicMock(state="off", attributes={}),
        "binary_sensor.dr_zone": MagicMock(state="off", attributes={}),
    }
    mock_hass.states.get = lambda eid: states.get(eid)

    lr_coord = RoomPresenceCoordinator(mock_hass, "entry_lr", lr_cfg)
    dr_coord = RoomPresenceCoordinator(mock_hass, "entry_dr", dr_cfg)
    mock_hass.data[DOMAIN] = {
        "entry_lr": lr_coord,
        "entry_dr": dr_coord,
    }

    # 1. Person detected in Living Room, then leaves Living Room zone (timer starts at 240s)
    lr_coord.state_machine.handle_trigger("binary_sensor.lr_zone", is_active=True)
    lr_coord.state_machine.handle_trigger("binary_sensor.lr_zone", is_active=False)
    assert lr_coord.state_machine.is_present is True
    assert lr_coord.state_machine.box_state == BoxState.TIMER_ACTIVE
    assert lr_coord.state_machine.vacating_countdown == 240

    # 2. Person enters adjacent Dining Room -> Living Room timer immediately zeros out!
    states["binary_sensor.dr_zone"].state = "on"
    dr_coord.state_machine.handle_trigger("binary_sensor.dr_zone", is_active=True)
    dr_coord._notify_connected_rooms_if_active()

    assert lr_coord.state_machine.vacating_countdown == 0
    assert lr_coord.state_machine.is_present is False
    assert lr_coord.state_machine.box_state == BoxState.IDLE_CLEAR
    assert lr_coord.state_machine.bayesian_probability_pct == 0.0
    assert lr_coord.state_machine.last_handoff_room == "Dining Room"

    # 3. Multi-person safety: if Living Room still has an active sensor, adjacent room does NOT vacate it
    lr_coord.state_machine.handle_trigger("binary_sensor.lr_zone", is_active=True)
    assert lr_coord.state_machine.is_present is True
    assert lr_coord.notify_adjacent_occupancy("Dining Room") is False
    assert lr_coord.state_machine.is_present is True


def test_spatial_topology_compiler_and_apply():
    """Test 2D floorplan geometry, camera cone overlap, topology compilation, and config application."""
    assert point_in_cone(100, 50, 50, 50, 0, 90, 100) is True
    assert point_in_cone(0, 50, 50, 50, 0, 90, 100) is False

    overlap = compute_cone_room_overlap_pct(
        {"floor": "main", "x": 10, "y": 50, "heading_deg": 0, "fov_deg": 100, "range_px": 200},
        {"floor": "main", "x": 20, "y": 20, "width": 80, "height": 60},
    )
    assert overlap > 50.0

    fp = get_default_floorplan()
    compiled = compile_floorplan_topology(fp)

    conn_map = compiled["connected_rooms_map"]
    # Verify key house connections described by user
    assert "Living Room" in conn_map["Front Entry"]
    assert "Kitchen" in conn_map["Front Entry"]
    assert "Office" in conn_map["Front Entry"]
    assert "Dining Room" in conn_map["Living Room"]
    assert "Kitchen" in conn_map["Dining Room"]
    assert "Kitchen" in conn_map["Family Room"]
    assert "Front Entry" in conn_map["Family Room"]
    assert "Garage" in conn_map["Family Room"]
    assert "Basement Play Area" in conn_map["Family Room"]
    assert "Storage Room" in conn_map["Basement Play Area"]
    assert "Basement Theater" in conn_map["Basement Play Area"]

    # Verify seal analysis
    seal = compiled["seal_analysis"]
    assert seal["Front Entry"]["can_be_bounded"] is False
    assert seal["Storage Room"]["can_be_bounded"] is False
    assert seal["Garage"]["can_be_bounded"] is False

    # Verify camera cone spillovers detected (Living Room -> Front Entry, Family Room -> Kitchen, etc.)
    spill_cams = {
        ca["camera_id"] for ca in compiled["camera_analysis"] if ca["has_multi_room_bleed"]
    }
    assert "camera.living_room" in spill_cams
    assert "camera.family_room" in spill_cams
    assert "camera.master_bedroom" in spill_cams

    # Verify apply_compiled_topology_to_config fixes fake bounded rooms and downgrades spillover whole-frame sensor
    fe_cfg = {
        CONF_ROOM_NAME: "Front Entry",
        CONF_MODE: "bounded",
        CONF_BOUNDARY_ENTITIES: ["binary_sensor.front_door"],
        CONF_TRIGGER_ENTITIES: ["binary_sensor.front_entry_entryway_person_occupancy"],
        CONF_BAYESIAN_OBSERVATIONS: [
            {
                "entity_id": "binary_sensor.front_entry_entryway_person_occupancy",
                "label": "Front Entry Zone",
                "preset": "decisive",
                "prob_given_true": 0.94,
                "prob_given_false": 0.03,
            }
        ],
    }
    updated_fe = apply_compiled_topology_to_config(fe_cfg, compiled)
    assert updated_fe[CONF_MODE] == "open"
    assert updated_fe[CONF_BOUNDARY_ENTITIES] == []
    assert "Living Room" in updated_fe[CONF_CONNECTED_ROOMS]

    lr_cfg = {
        CONF_ROOM_NAME: "Living Room",
        CONF_MODE: "open",
        CONF_TRIGGER_ENTITIES: [
            "binary_sensor.living_room_couch_person_occupancy",
            "binary_sensor.living_room_person_occupancy",
        ],
        CONF_BAYESIAN_OBSERVATIONS: [
            {
                "entity_id": "binary_sensor.living_room_couch_person_occupancy",
                "label": "Living Room Couch Zone",
                "preset": "decisive",
                "prob_given_true": 0.94,
                "prob_given_false": 0.03,
            },
            {
                "entity_id": "binary_sensor.living_room_person_occupancy",
                "label": "Living Room Camera Person (Full Frame)",
                "preset": "strong",
                "prob_given_true": 0.85,
                "prob_given_false": 0.06,
            },
        ],
    }
    updated_lr = apply_compiled_topology_to_config(lr_cfg, compiled)
    assert "binary_sensor.living_room_person_occupancy" not in updated_lr[CONF_TRIGGER_ENTITIES]
    full_frame_obs = next(
        o
        for o in updated_lr[CONF_BAYESIAN_OBSERVATIONS]
        if o["entity_id"] == "binary_sensor.living_room_person_occupancy"
    )
    assert full_frame_obs["preset"] == "supporting"
    assert full_frame_obs["prob_given_true"] == 0.45
    assert full_frame_obs["prob_given_false"] == 0.20


@pytest.mark.anyio
async def test_floorplan_view_endpoints(mock_hass):
    """Test GET and POST /api/presence_detection_designer/floorplan endpoints."""
    mock_hass.states.get = lambda _eid: None
    coord = RoomPresenceCoordinator(
        mock_hass,
        "entry_fe",
        {
            CONF_ROOM_NAME: "Front Entry",
            CONF_MODE: "bounded",
            CONF_BOUNDARY_ENTITIES: ["binary_sensor.front_door"],
        },
    )
    mock_hass.data[DOMAIN] = {"entry_fe": coord}

    view = PDDFloorplanView()
    req_get = MagicMock()
    req_get.app = {"hass": mock_hass}
    status_get, body_get = _unpack(await view.get(req_get))
    assert status_get == 200
    assert len(body_get["floorplan"]["floors"]) == 3
    assert "connected_rooms_map" in body_get["compiled_topology"]

    req_compile = MagicMock()
    req_compile.app = {"hass": mock_hass}
    req_compile.json = AsyncMock(return_value={"action": "compile_and_apply"})
    status_compile, body_compile = _unpack(await view.post(req_compile))
    assert status_compile == 200
    assert len(body_compile["updated_rooms"]) == 1
    assert coord.mode == Mode.OPEN
    assert "Living Room" in coord.connected_rooms

    req_reset = MagicMock()
    req_reset.app = {"hass": mock_hass}
    req_reset.json = AsyncMock(return_value={"action": "reset"})
    status_reset, _ = _unpack(await view.post(req_reset))
    assert status_reset == 200


def test_extract_floor_wall_segments_and_doorway_subtraction():
    """Verify doorway openings are correctly subtracted from perimeter walls to form solid segments."""
    room = {
        "id": "test_room",
        "name": "Test Room",
        "floor": "main",
        "x": 100,
        "y": 100,
        "width": 200,
        "height": 100,
        "entryways": [
            {
                "id": "door_top",
                "wall": "top",
                "offset": 50,
                "width": 40,
                "type": "door",
            }
        ],
    }
    segments = extract_floor_wall_segments([room])
    # Top wall (length 200): solid from 0..50 -> (100,100)-(150,100), and 90..200 -> (190,100)-(300,100)
    top_segs = [s for s in segments if s[0][1] == 100 and s[1][1] == 100]
    assert len(top_segs) == 2
    assert ((100.0, 100), (150.0, 100)) in top_segs
    assert ((190.0, 100), (300.0, 100)) in top_segs

    # Bottom wall has no door: solid from 100..300 at y=200
    bottom_segs = [s for s in segments if s[0][1] == 200 and s[1][1] == 200]
    assert len(bottom_segs) == 1
    assert bottom_segs[0] == ((100.0, 200), (300.0, 200))


def test_ray_segment_intersection_and_solid_wall_occlusion():
    """Test 2D ray-segment intersection and solid blocker detection."""
    # Ray along +X axis
    t_hit = ray_segment_intersection(0, 50, 1, 0, 100, 0, 100, 100)
    assert t_hit == 100.0

    # Ray misses segment
    t_miss = ray_segment_intersection(0, 50, 1, 0, 100, 60, 100, 100)
    assert t_miss is None

    # Line of sight occlusion test
    solid_segs = [((100, 0), (100, 40)), ((100, 60), (100, 100))]
    # Sightline through the doorway gap [40..60] is NOT occluded
    assert not line_segment_intersects_solid_wall(10, 50, 200, 50, solid_segs)
    # Sightline through solid wall [0..40] IS occluded
    assert line_segment_intersects_solid_wall(10, 20, 200, 20, solid_segs)


def test_camera_visibility_polygon_doorway_pass_through():
    """Verify camera visibility polygon stops at solid walls and passes through doorway apertures."""
    solid_segs = [
        ((100.0, 0.0), (100.0, 40.0)),
        ((100.0, 60.0), (100.0, 100.0)),
        ((250.0, 0.0), (250.0, 100.0)),  # far wall behind door
    ]
    cam = {
        "x": 10,
        "y": 50,
        "heading_deg": 0,
        "fov_deg": 90,
        "range_px": 300,
        "floor": "main",
    }
    poly = compute_camera_visibility_polygon(cam, solid_segs)
    assert len(poly) > 10
    # Origin is first vertex
    assert poly[0] == (10.0, 50.0)

    # The ray aimed through the door at y=50 hits the far wall at x=250
    center_rays = [p for p in poly if abs(p[1] - 50.0) < 1.0 and p[0] > 10.0]
    assert any(abs(p[0] - 250.0) < 2.0 for p in center_rays)

    # Rays aimed at solid walls stop around x=100
    blocked_rays = [p for p in poly if abs(p[1] - 20.0) < 2.0]
    assert any(abs(p[0] - 100.0) < 2.0 for p in blocked_rays)


def test_occluded_cone_room_overlap_pct_doorway_penetration():
    """Verify compute_cone_room_overlap_pct detects zero coverage when blocked by a solid wall and positive coverage when open."""
    cam = {
        "x": 50,
        "y": 50,
        "heading_deg": 0,
        "fov_deg": 90,
        "range_px": 200,
        "floor": "main",
    }
    adj_room = {"floor": "main", "x": 110, "y": 20, "width": 80, "height": 60}

    # 1. Solid wall completely blocking adjacent room
    solid_wall = [((100.0, 0.0), (100.0, 100.0))]
    pct_blocked = compute_cone_room_overlap_pct(
        cam, adj_room, grid_steps=10, solid_segments=solid_wall
    )
    assert pct_blocked == 0.0

    # 2. Doorway opening in the wall allows cone to penetrate adjacent room
    door_wall = [((100.0, 0.0), (100.0, 35.0)), ((100.0, 65.0), (100.0, 100.0))]
    pct_door = compute_cone_room_overlap_pct(cam, adj_room, grid_steps=10, solid_segments=door_wall)
    assert pct_door > 20.0


def test_floorplan_multi_sensor_layers_and_compilation():
    """Verify PIR motion cones, Frigate 2D sub-zones, door contacts, and BLE proxy anchors compile on the floorplan."""
    fp = get_default_floorplan()
    assert len(fp.get("sensors", [])) >= 12
    assert len(fp.get("ble_proxies", [])) == 6

    pir_sensors = [s for s in fp["sensors"] if s.get("sensor_type") == "pir_motion"]
    door_sensors = [s for s in fp["sensors"] if s.get("sensor_type") == "door_contact"]
    assert len(pir_sensors) >= 10
    assert len(door_sensors) >= 4

    # Every camera has 2D sub_zones mapped onto the floorplan
    for cam in fp["cameras"]:
        assert len(cam.get("sub_zones", [])) >= 1
        for sz in cam["sub_zones"]:
            assert "entity_id" in sz
            assert "x" in sz and "y" in sz and "width" in sz and "height" in sz

    compiled = compile_floorplan_topology(fp)
    assert len(compiled.get("pir_analysis", [])) == len(pir_sensors)
    assert len(compiled.get("sub_zone_analysis", [])) >= 20
    assert len(compiled.get("ble_proxy_analysis", [])) == 6

    # PIR analysis includes wall-occluded visibility polygons
    first_pir = compiled["pir_analysis"][0]
    assert len(first_pir["visibility_polygon"]) > 5

    # Room coverage tracks uncovered negative-space percentage
    assert "uncovered_pct" in compiled["room_coverage"]["Master Bathroom"]
    assert compiled["room_coverage"]["Master Bathroom"]["uncovered_pct"] >= 50.0


def test_calibrated_v4_floorplan_and_device_model_presets():
    """Verify v4 blueprint calibration, uniform Tapo C110 model presets, and stepped room polygons."""
    assert "tapo_c110_corner" in DEVICE_MODEL_PRESETS
    assert DEVICE_MODEL_PRESETS["tapo_c110_corner"]["fov_deg"] == 110
    assert "tapo_c110_overhead" in DEVICE_MODEL_PRESETS
    assert DEVICE_MODEL_PRESETS["tapo_c110_overhead"]["fov_deg"] == 164

    fp = get_default_floorplan()
    assert fp["version"] == 4
    assert "floor_wall_segments" in fp
    assert set(fp["floor_wall_segments"].keys()) == {"upstairs", "main", "basement"}

    rooms_by_name = {r["name"]: r for r in fp["rooms"]}
    for required_room in (
        "Master W.I.C",
        "Upstairs Bathroom",
        "Master Bathroom",
        "Powder Bath",
        "Laundry Room",
    ):
        assert required_room in rooms_by_name

    # Verify stepped polygons on interlocking rooms
    assert rooms_by_name["Upstairs Bathroom"].get("svg_path", "").startswith("M ")
    assert rooms_by_name["Master Bathroom"].get("svg_path", "").startswith("M ")
    assert rooms_by_name["Margot's Room"].get("svg_path", "").startswith("M ")
    assert rooms_by_name["Guest Room"].get("svg_path", "").startswith("M ")

    # Verify uniform Tapo C110 camera presets (9 corner @ 110 deg + 1 high overhead garage @ 164 deg)
    cams_by_id = {c["id"]: c for c in fp["cameras"]}
    assert len(cams_by_id) == 10
    for cid, cam in cams_by_id.items():
        if cid == "camera.garage":
            assert cam["model_preset"] == "tapo_c110_overhead"
            assert cam["fov_deg"] == 164
        else:
            assert cam["model_preset"] == "tapo_c110_corner"
            assert cam["fov_deg"] == 110

    # Verify Family Room camera does not leak through solid wall into Laundry Room
    compiled = compile_floorplan_topology(fp)
    fr_cam = next(
        ca for ca in compiled["camera_analysis"] if ca["camera_id"] == "camera.family_room"
    )
    spill_rooms = {t["room_name"] for t in fr_cam["spillover_targets"]}
    assert "Kitchen" in spill_rooms
    assert "Laundry Room" not in spill_rooms
