"""2D Spatial Floorplan, Camera View Cone & Logical Room Linkage Compiler."""

from __future__ import annotations

import copy
import math
from typing import Any

from .const import (
    CONF_BAYESIAN_OBSERVATIONS,
    CONF_BOUNDARY_ENTITIES,
    CONF_CONNECTED_ROOMS,
    CONF_INACTIVITY_TIMEOUT,
    CONF_MODE,
    CONF_ROOM_NAME,
    CONF_TRIGGER_ENTITIES,
    BayesianWeightPreset,
    Mode,
)

# Whole-frame camera person entities that span into adjacent rooms/doorways/pathways
SPILLOVER_CAMERA_ENTITIES: dict[str, list[str]] = {
    "Living Room": ["binary_sensor.living_room_person_occupancy"],
    "Family Room": ["binary_sensor.family_room_person_occupancy"],
    "Master Bedroom": [
        "binary_sensor.master_bedroom_person_occupancy",
        "binary_sensor.master_bedroom_entryway_person_occupancy",
    ],
    "Office": [
        "binary_sensor.office_person_occupancy",
        "binary_sensor.office_entryway_person_occupancy",
    ],
    "Margot's Room": ["binary_sensor.nursery_person_occupancy"],
    "Basement Theater": [
        "binary_sensor.basement_theater_person_occupancy",
        "binary_sensor.basement_stairwell_person_occupancy",
    ],
    "Basement Play Area": [
        "binary_sensor.basement_play_area_person_occupancy",
        "binary_sensor.basement_stairwell_person_occupancy",
    ],
}

RECOMMENDED_INACTIVITY_TIMEOUTS: dict[str, int] = {
    "Front Entry": 60,
    "Living Room": 180,
    "Dining Room": 180,
    "Kitchen": 180,
    "Family Room": 180,
    "Garage": 180,
    "Master Bedroom": 300,
    "Master Bathroom": 600,
    "Office": 240,
    "Margot's Room": 300,
    "Guest Room": 300,
    "Basement Theater": 240,
    "Basement Play Area": 180,
    "Storage Room": 180,
}

DEFAULT_HOUSE_FLOORPLAN: dict[str, Any] = {
    "version": 1,
    "canvas": {"width": 1000, "height": 600},
    "floors": [
        {"id": "upstairs", "name": "Upstairs Level", "order": 0},
        {"id": "main", "name": "Main Floor", "order": 1},
        {"id": "basement", "name": "Basement Level", "order": 2},
    ],
    "rooms": [
        # --- UPSTAIRS LEVEL ---
        {
            "id": "margots_room",
            "name": "Margot's Room",
            "floor": "upstairs",
            "x": 60,
            "y": 40,
            "width": 290,
            "height": 150,
            "room_type": "room",
        },
        {
            "id": "guest_room",
            "name": "Guest Room",
            "floor": "upstairs",
            "x": 60,
            "y": 195,
            "width": 290,
            "height": 150,
            "room_type": "room",
            "notes": "Between Nursery and Office; Ecobee sensor pending battery replacement, no camera.",
        },
        {
            "id": "office",
            "name": "Office",
            "floor": "upstairs",
            "x": 60,
            "y": 350,
            "width": 290,
            "height": 200,
            "room_type": "room",
            "notes": "Next to stairs to Front Entryway; camera sees office doorway.",
        },
        {
            "id": "upstairs_hallway",
            "name": "Upstairs Hallway & Stairs",
            "floor": "upstairs",
            "x": 355,
            "y": 150,
            "width": 165,
            "height": 340,
            "room_type": "transit",
            "notes": "Connects Office, Guest Room, Nursery, Master Bedroom, and Stairs to Front Entry.",
        },
        {
            "id": "master_bedroom",
            "name": "Master Bedroom",
            "floor": "upstairs",
            "x": 525,
            "y": 40,
            "width": 415,
            "height": 310,
            "room_type": "room",
            "notes": "Camera catches bed, walkway, entry to Upstairs Hallway, and entry to Master Bath/Closet.",
        },
        {
            "id": "master_bathroom",
            "name": "Master Bathroom",
            "floor": "upstairs",
            "x": 640,
            "y": 355,
            "width": 300,
            "height": 195,
            "room_type": "room",
            "notes": "Master Bathroom & Closet; entry doorway caught by master_bedroom camera.",
        },
        # --- MAIN FLOOR ---
        {
            "id": "family_room",
            "name": "Family Room",
            "floor": "main",
            "x": 60,
            "y": 40,
            "width": 250,
            "height": 310,
            "room_type": "room",
            "notes": "Camera catches Family Room, Kitchen, and pathway to Entryway, Basement, and Laundry.",
        },
        {
            "id": "kitchen",
            "name": "Kitchen",
            "floor": "main",
            "x": 315,
            "y": 40,
            "width": 225,
            "height": 250,
            "room_type": "room",
            "notes": "Connected to Dining Room, Family Room, and Front Entry pathway; caught by Family Room camera.",
        },
        {
            "id": "dining_room",
            "name": "Dining Room",
            "floor": "main",
            "x": 545,
            "y": 40,
            "width": 395,
            "height": 230,
            "room_type": "room",
            "notes": "Connected to Kitchen and Living Room.",
        },
        {
            "id": "living_room",
            "name": "Living Room",
            "floor": "main",
            "x": 545,
            "y": 275,
            "width": 395,
            "height": 275,
            "room_type": "room",
            "notes": "Connected to Dining Room and Front Entryway; camera catches both Living Room and Entryway.",
        },
        {
            "id": "front_entry",
            "name": "Front Entry",
            "floor": "main",
            "x": 315,
            "y": 295,
            "width": 225,
            "height": 255,
            "room_type": "room",
            "notes": "Has front_door sensor, but exits openly to Stairs (Upstairs), Kitchen pathway, and Living Room.",
        },
        {
            "id": "garage",
            "name": "Garage",
            "floor": "main",
            "x": 60,
            "y": 355,
            "width": 250,
            "height": 195,
            "room_type": "room",
            "notes": "Connected via Laundry Room pathway to Family Room.",
        },
        # --- BASEMENT LEVEL ---
        {
            "id": "storage_room",
            "name": "Storage Room",
            "floor": "basement",
            "x": 60,
            "y": 90,
            "width": 250,
            "height": 230,
            "room_type": "room",
            "notes": "Out of frame on left of Play Area camera; has a door WITHOUT a contact sensor.",
        },
        {
            "id": "basement_bathroom",
            "name": "Basement Bathroom",
            "floor": "basement",
            "x": 60,
            "y": 325,
            "width": 250,
            "height": 215,
            "room_type": "transit",
            "notes": "Out of frame on left of Play Area camera; no sensors.",
        },
        {
            "id": "basement_play_area",
            "name": "Basement Play Area",
            "floor": "basement",
            "x": 315,
            "y": 140,
            "width": 310,
            "height": 400,
            "room_type": "room",
            "notes": "Central basement area; Storage Room and Basement Bathroom are out of frame on the left.",
        },
        {
            "id": "basement_theater",
            "name": "Basement Theater",
            "floor": "basement",
            "x": 630,
            "y": 90,
            "width": 310,
            "height": 450,
            "room_type": "room",
            "notes": "Open to Play Area; camera can partially catch someone on the basement stairs.",
        },
    ],
    "connections": [
        # Main floor passages & doors
        {
            "id": "conn_entry_lr",
            "from_room": "Front Entry",
            "to_room": "Living Room",
            "type": "open_passage",
            "label": "Open Archway (Entry <-> Living Room)",
        },
        {
            "id": "conn_entry_kitchen",
            "from_room": "Front Entry",
            "to_room": "Kitchen",
            "type": "open_passage",
            "label": "Pathway (Entry <-> Kitchen)",
        },
        {
            "id": "conn_entry_fr",
            "from_room": "Front Entry",
            "to_room": "Family Room",
            "type": "open_passage",
            "label": "Pathway (Entry <-> Family/Laundry/Basement)",
        },
        {
            "id": "conn_lr_dr",
            "from_room": "Living Room",
            "to_room": "Dining Room",
            "type": "open_passage",
            "label": "Open Passage (Living <-> Dining)",
        },
        {
            "id": "conn_dr_kitchen",
            "from_room": "Dining Room",
            "to_room": "Kitchen",
            "type": "open_passage",
            "label": "Open Passage (Dining <-> Kitchen)",
        },
        {
            "id": "conn_kitchen_fr",
            "from_room": "Kitchen",
            "to_room": "Family Room",
            "type": "open_passage",
            "label": "Open Concept (Kitchen <-> Family Room)",
        },
        {
            "id": "conn_fr_garage",
            "from_room": "Family Room",
            "to_room": "Garage",
            "type": "unmonitored_door",
            "entity_id": "binary_sensor.utility_room_door",
            "label": "Laundry / Utility Room Pathway",
        },
        # Stairs between floors
        {
            "id": "conn_entry_upstairs",
            "from_room": "Front Entry",
            "to_room": "Upstairs Hallway & Stairs",
            "type": "stairs",
            "label": "Main Stairs (Next to Office)",
        },
        {
            "id": "conn_fr_basement_play",
            "from_room": "Family Room",
            "to_room": "Basement Play Area",
            "type": "stairs",
            "label": "Basement Stairs",
        },
        {
            "id": "conn_fr_basement_theater",
            "from_room": "Family Room",
            "to_room": "Basement Theater",
            "type": "stairs",
            "label": "Basement Stairs (Partial Camera Sightline)",
        },
        # Upstairs doorways
        {
            "id": "conn_hall_office",
            "from_room": "Upstairs Hallway & Stairs",
            "to_room": "Office",
            "type": "unmonitored_door",
            "label": "Office Doorway (Next to Stairs)",
        },
        {
            "id": "conn_hall_guest",
            "from_room": "Upstairs Hallway & Stairs",
            "to_room": "Guest Room",
            "type": "unmonitored_door",
            "label": "Guest Room Doorway (No Sensor)",
        },
        {
            "id": "conn_hall_nursery",
            "from_room": "Upstairs Hallway & Stairs",
            "to_room": "Margot's Room",
            "type": "unmonitored_door",
            "label": "Nursery Doorway (Seen Partially by Cam)",
        },
        {
            "id": "conn_hall_master",
            "from_room": "Upstairs Hallway & Stairs",
            "to_room": "Master Bedroom",
            "type": "unmonitored_door",
            "label": "Master Bedroom Entryway",
        },
        {
            "id": "conn_master_bath",
            "from_room": "Master Bedroom",
            "to_room": "Master Bathroom",
            "type": "unmonitored_door",
            "label": "Master Bath / Closet Entry",
        },
        # Basement passages & doors
        {
            "id": "conn_play_theater",
            "from_room": "Basement Play Area",
            "to_room": "Basement Theater",
            "type": "open_passage",
            "label": "Open Basement Divide (Play <-> Theater)",
        },
        {
            "id": "conn_play_storage",
            "from_room": "Basement Play Area",
            "to_room": "Storage Room",
            "type": "unmonitored_door",
            "label": "Storage Room Door (No Sensor, Out of Frame Left)",
        },
        {
            "id": "conn_play_bbath",
            "from_room": "Basement Play Area",
            "to_room": "Basement Bathroom",
            "type": "unmonitored_door",
            "label": "Basement Bath Door (No Sensor, Out of Frame Left)",
        },
    ],
    "cameras": [
        {
            "id": "camera.living_room",
            "name": "Living Room Camera",
            "floor": "main",
            "host_room": "Living Room",
            "x": 920,
            "y": 525,
            "heading_deg": 196,
            "fov_deg": 56,
            "range_px": 560,
            "zones": [
                "living_room_couch",
                "living_room_floor",
                "living_room_bay_windows",
                "living_room_entry",
            ],
            "spills_into": ["Front Entry"],
            "notes": "Catches both Living Room and Front Entryway.",
        },
        {
            "id": "camera.dining_room",
            "name": "Dining Room Camera",
            "floor": "main",
            "host_room": "Dining Room",
            "x": 920,
            "y": 60,
            "heading_deg": 162,
            "fov_deg": 52,
            "range_px": 350,
            "zones": ["dining_room_table", "rileys_food"],
            "spills_into": [],
            "notes": "Covers Dining Room table and Riley's food area.",
        },
        {
            "id": "camera.family_room",
            "name": "Family Room Camera",
            "floor": "main",
            "host_room": "Family Room",
            "x": 80,
            "y": 60,
            "heading_deg": 28,
            "fov_deg": 68,
            "range_px": 460,
            "zones": [
                "family_room_couch",
                "family_room_recliner",
                "family_room_floor",
                "kitchen_island",
            ],
            "spills_into": ["Kitchen", "Front Entry"],
            "notes": "Catches Family Room, Kitchen Island, and pathway to Entryway, Basement, and Laundry.",
        },
        {
            "id": "camera.garage",
            "name": "Garage Camera",
            "floor": "main",
            "host_room": "Garage",
            "x": 80,
            "y": 375,
            "heading_deg": 32,
            "fov_deg": 64,
            "range_px": 230,
            "zones": ["garage_parking"],
            "spills_into": [],
            "notes": "Covers Garage parking bay.",
        },
        {
            "id": "camera.master_bedroom",
            "name": "Master Bedroom Camera",
            "floor": "upstairs",
            "host_room": "Master Bedroom",
            "x": 920,
            "y": 60,
            "heading_deg": 155,
            "fov_deg": 96,
            "range_px": 470,
            "zones": [
                "master_bed",
                "master_open_area",
                "master_bedroom_walkway",
                "master_bedroom_entryway",
                "master_bathroom",
            ],
            "spills_into": ["Upstairs Hallway & Stairs", "Master Bathroom"],
            "notes": "Catches Master Bedroom plus entries to Upstairs Hallway and Master Bathroom/Closet.",
        },
        {
            "id": "camera.nursery",
            "name": "Nursery Camera",
            "floor": "upstairs",
            "host_room": "Margot's Room",
            "x": 80,
            "y": 55,
            "heading_deg": 28,
            "fov_deg": 85,
            "range_px": 310,
            "zones": ["nursery_bed"],
            "spills_into": ["Upstairs Hallway & Stairs"],
            "notes": "Covers Nursery bed and partially sees doorway from Upstairs Hallway.",
        },
        {
            "id": "camera.office",
            "name": "Office Camera",
            "floor": "upstairs",
            "host_room": "Office",
            "x": 80,
            "y": 530,
            "heading_deg": 330,
            "fov_deg": 90,
            "range_px": 330,
            "zones": ["steves_desk", "sim_rig", "office_floor", "office_entryway"],
            "spills_into": ["Upstairs Hallway & Stairs"],
            "notes": "Covers Office desk/sim rig and sees Office doorway next to the stairs.",
        },
        {
            "id": "camera.basement_theater",
            "name": "Basement Theater Camera",
            "floor": "basement",
            "host_room": "Basement Theater",
            "x": 920,
            "y": 515,
            "heading_deg": 212,
            "fov_deg": 96,
            "range_px": 540,
            "zones": [
                "basement_theater_couch",
                "basement_theater_playpen",
                "basement_theater_floor",
                "basement_bar",
                "basement_play_area_far",
                "basement_stairwell",
            ],
            "spills_into": ["Basement Play Area"],
            "notes": "Covers Theater, sees far Play Area/Bar, and partially catches Basement Stairs.",
        },
        {
            "id": "camera.basement_play_area",
            "name": "Basement Play Area Camera",
            "floor": "basement",
            "host_room": "Basement Play Area",
            "x": 340,
            "y": 515,
            "heading_deg": 318,
            "fov_deg": 92,
            "range_px": 450,
            "zones": ["basement_play_floor", "basement_counter", "theater_rear_view"],
            "spills_into": ["Basement Theater"],
            "notes": "Covers Play Area & Counter; sees into Theater. Storage Room & Basement Bath are out of frame on left.",
        },
        {
            "id": "camera.storage_room",
            "name": "Storage Room Camera",
            "floor": "basement",
            "host_room": "Storage Room",
            "x": 80,
            "y": 110,
            "heading_deg": 38,
            "fov_deg": 85,
            "range_px": 240,
            "zones": ["storage_room_workout"],
            "spills_into": [],
            "notes": "Covers interior Storage Room / Gym floor.",
        },
    ],
}


def get_default_floorplan() -> dict[str, Any]:
    """Return a deep copy of the default 3-floor house spatial floorplan."""
    return copy.deepcopy(DEFAULT_HOUSE_FLOORPLAN)


def _normalize_angle_diff(angle_a: float, angle_b: float) -> float:
    """Return smallest absolute angle difference in degrees [0, 180]."""
    diff = (angle_a - angle_b + 180.0) % 360.0 - 180.0
    return abs(diff)


def point_in_cone(
    px: float,
    py: float,
    cx: float,
    cy: float,
    heading_deg: float,
    fov_deg: float,
    range_px: float,
) -> bool:
    """Return True if point (px, py) lies inside circular sector (cx, cy, heading_deg, fov_deg, range_px)."""
    dx = px - cx
    dy = py - cy
    dist = math.hypot(dx, dy)
    if dist > range_px:
        return False
    if dist < 1e-3:
        return True
    angle_deg = math.degrees(math.atan2(dy, dx)) % 360.0
    half_fov = max(1.0, float(fov_deg)) / 2.0
    return _normalize_angle_diff(angle_deg, float(heading_deg) % 360.0) <= half_fov


def compute_cone_room_overlap_pct(
    cam: dict[str, Any],
    room_box: dict[str, Any],
    grid_steps: int = 10,
) -> float:
    """Compute percentage (0..100) of `room_box` area covered by `cam`'s 2D view cone on the same floor."""
    if cam.get("floor") != room_box.get("floor"):
        return 0.0
    rx = float(room_box.get("x", 0))
    ry = float(room_box.get("y", 0))
    rw = max(1.0, float(room_box.get("width", 100)))
    rh = max(1.0, float(room_box.get("height", 100)))

    cx = float(cam.get("x", 0))
    cy = float(cam.get("y", 0))
    heading = float(cam.get("heading_deg", 0))
    fov = float(cam.get("fov_deg", 90))
    reach = float(cam.get("range_px", 300))

    hits = 0
    total = grid_steps * grid_steps
    for ix in range(grid_steps):
        px = rx + (ix + 0.5) * (rw / grid_steps)
        for iy in range(grid_steps):
            py = ry + (iy + 0.5) * (rh / grid_steps)
            if point_in_cone(px, py, cx, cy, heading, fov, reach):
                hits += 1
    return round((hits / float(total)) * 100.0, 1)


def _boxes_overlap_2d(box_a: dict[str, Any], box_b: dict[str, Any]) -> float:
    """Return 2D intersection area ratio (0..1) of two room boxes regardless of floor."""
    ax1, ay1 = float(box_a.get("x", 0)), float(box_a.get("y", 0))
    ax2, ay2 = ax1 + float(box_a.get("width", 0)), ay1 + float(box_a.get("height", 0))
    bx1, by1 = float(box_b.get("x", 0)), float(box_b.get("y", 0))
    bx2, by2 = bx1 + float(box_b.get("width", 0)), by1 + float(box_b.get("height", 0))

    ix = max(0.0, min(ax2, bx2) - max(ax1, bx1))
    iy = max(0.0, min(ay2, by2) - max(ay1, by1))
    inter = ix * iy
    if inter <= 0:
        return 0.0
    min_area = max(
        1.0,
        min(
            float(box_a.get("width", 1)) * float(box_a.get("height", 1)),
            float(box_b.get("width", 1)) * float(box_b.get("height", 1)),
        ),
    )
    return round(inter / min_area, 2)


def compile_floorplan_topology(
    floorplan: dict[str, Any] | None = None,
    room_configs: dict[str, dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Compile a 2D floorplan + camera view cones into logical room linkages, coverage, and ambiguities."""
    fp = (
        floorplan
        if isinstance(floorplan, dict) and floorplan.get("rooms")
        else get_default_floorplan()
    )
    rooms_list: list[dict[str, Any]] = list(fp.get("rooms", []) or [])
    connections_list: list[dict[str, Any]] = list(fp.get("connections", []) or [])
    cameras_list: list[dict[str, Any]] = list(fp.get("cameras", []) or [])

    rooms_by_name: dict[str, dict[str, Any]] = {
        str(r.get("name")): r for r in rooms_list if r.get("name")
    }
    transit_rooms: set[str] = {
        str(r.get("name")) for r in rooms_list if r.get("room_type") == "transit" and r.get("name")
    }

    # 1. Build raw adjacency & connection types per room
    raw_adj: dict[str, set[str]] = {name: set() for name in rooms_by_name}
    room_connections: dict[str, list[dict[str, Any]]] = {name: [] for name in rooms_by_name}

    for conn in connections_list:
        a = str(conn.get("from_room", ""))
        b = str(conn.get("to_room", ""))
        if not a or not b:
            continue
        raw_adj.setdefault(a, set()).add(b)
        raw_adj.setdefault(b, set()).add(a)
        room_connections.setdefault(a, []).append(conn)
        room_connections.setdefault(b, []).append(conn)

    # Expand 2-hop connections through transit hubs (e.g. Upstairs Hallway & Stairs)
    connected_rooms_map: dict[str, list[str]] = {}
    for r_name, r_obj in rooms_by_name.items():
        if r_obj.get("room_type") == "transit":
            continue
        linked: set[str] = set()
        for neighbor in raw_adj.get(r_name, set()):
            if neighbor in transit_rooms:
                for hop2 in raw_adj.get(neighbor, set()):
                    if hop2 != r_name and hop2 not in transit_rooms:
                        linked.add(hop2)
            else:
                linked.add(neighbor)
        connected_rooms_map[r_name] = sorted(linked)

    # 2. Evaluate perimeter seal eligibility (`can_be_bounded`)
    seal_analysis: dict[str, dict[str, Any]] = {}
    for r_name, r_obj in rooms_by_name.items():
        if r_obj.get("room_type") == "transit":
            continue
        conns = room_connections.get(r_name, [])
        unsealed_exits: list[str] = []
        monitored_doors: list[str] = []
        for c in conns:
            ctype = str(c.get("type", "open_passage"))
            other = c.get("to_room") if c.get("from_room") == r_name else c.get("from_room")
            if ctype == "sensor_door" and c.get("entity_id"):
                monitored_doors.append(str(c["entity_id"]))
            else:
                unsealed_exits.append(f"{other} ({ctype.replace('_', ' ')})")
        can_seal = bool(monitored_doors) and len(unsealed_exits) == 0
        seal_analysis[r_name] = {
            "can_be_bounded": can_seal,
            "recommended_mode": str(Mode.BOUNDED if can_seal else Mode.OPEN),
            "monitored_doors": sorted(set(monitored_doors)),
            "unsealed_exits": unsealed_exits,
        }

    # 3. Compute camera cone coverage & cross-room spillover
    room_coverage: dict[str, dict[str, Any]] = {
        name: {
            "primary_cameras": [],
            "spillover_cameras": [],
            "max_coverage_pct": 0.0,
        }
        for name in rooms_by_name
    }
    camera_analysis: list[dict[str, Any]] = []

    for cam in cameras_list:
        cam_id = str(cam.get("id", ""))
        host_room = str(cam.get("host_room", ""))
        declared_spills = set(cam.get("spills_into", []) or [])
        overlaps: list[dict[str, Any]] = []

        for r_name, r_box in rooms_by_name.items():
            if r_box.get("floor") != cam.get("floor"):
                continue
            pct = compute_cone_room_overlap_pct(cam, r_box)
            if r_name == host_room:
                pct = max(pct, 65.0)
                room_coverage[r_name]["primary_cameras"].append(
                    {"camera_id": cam_id, "coverage_pct": pct}
                )
                room_coverage[r_name]["max_coverage_pct"] = max(
                    room_coverage[r_name]["max_coverage_pct"], pct
                )
            elif pct >= 8.0 or r_name in declared_spills:
                eff_pct = max(pct, 18.0 if r_name in declared_spills else pct)
                overlaps.append({"room_name": r_name, "overlap_pct": eff_pct})
                if r_name in room_coverage:
                    room_coverage[r_name]["spillover_cameras"].append(
                        {
                            "camera_id": cam_id,
                            "host_room": host_room,
                            "overlap_pct": eff_pct,
                        }
                    )
                    room_coverage[r_name]["max_coverage_pct"] = max(
                        room_coverage[r_name]["max_coverage_pct"], eff_pct
                    )

        camera_analysis.append(
            {
                "camera_id": cam_id,
                "name": cam.get("name", cam_id),
                "host_room": host_room,
                "floor": cam.get("floor"),
                "zones": list(cam.get("zones", []) or []),
                "spillover_targets": overlaps,
                "has_multi_room_bleed": len(overlaps) > 0,
            }
        )

    # 4. Identify spatial ambiguities & blind spots
    ambiguities: list[dict[str, Any]] = []

    # 4a. Camera spillover ambiguities
    for ca in camera_analysis:
        if ca["spillover_targets"]:
            spill_names = [t["room_name"] for t in ca["spillover_targets"]]
            host = ca["host_room"]
            downgraded = SPILLOVER_CAMERA_ENTITIES.get(host, [])
            ambiguities.append(
                {
                    "severity": "high",
                    "category": "camera_spillover",
                    "title": f"{ca['name']} cone spills into {', '.join(spill_names)}",
                    "rooms": [host, *spill_names],
                    "camera_id": ca["camera_id"],
                    "description": (
                        f"`{ca['camera_id']}` (hosted in {host}) also sees {', '.join(spill_names)}. "
                        "If whole-frame person detection is weighted as `strong`, movement in the adjacent "
                        f"entryway/hallway/room will falsely mark {host} occupied."
                    ),
                    "resolution": (
                        f"Downgrade {', '.join(downgraded) if downgraded else 'whole-frame camera person'} "
                        f"to `supporting` and trigger {host} only from interior Frigate sub-zones."
                    ),
                }
            )

    # 4b. Blind / out-of-frame pockets
    for r_name, _r_obj in rooms_by_name.items():
        cov = room_coverage.get(r_name, {})
        if cov.get("max_coverage_pct", 0.0) == 0.0:
            if r_name == "Master Bathroom":
                ambiguities.append(
                    {
                        "severity": "medium",
                        "category": "blind_pocket",
                        "title": "Master Bathroom & Closet interior is out of camera view",
                        "rooms": ["Master Bathroom", "Master Bedroom"],
                        "camera_id": "camera.master_bedroom",
                        "description": (
                            "`camera.master_bedroom` catches the Master Bathroom/Closet entry doorway "
                            "(`binary_sensor.master_bathroom_person_occupancy`), but the interior shower, vanity, "
                            "and closet are out of frame."
                        ),
                        "resolution": (
                            "Trigger on `master_bathroom_person_occupancy` doorway entry, sustain on shower fan, "
                            "lights, or humidity derivative (`> 0.3`), and hand off timer when returning to Master Bedroom."
                        ),
                    }
                )
            elif r_name == "Guest Room":
                ambiguities.append(
                    {
                        "severity": "medium",
                        "category": "blind_pocket",
                        "title": "Guest Room (between Nursery & Office) has zero camera coverage",
                        "rooms": ["Guest Room", "Margot's Room", "Office"],
                        "camera_id": None,
                        "description": (
                            "Guest Room sits between Margot's Room and Office off the Upstairs Hallway with "
                            "no camera view cone and its Ecobee sensor awaiting battery replacement."
                        ),
                        "resolution": (
                            "Use `guest_room_motion` (moderate) + `guest_room_occupancy` (supporting) + BLE "
                            "corroboration, with instant timer hand-off to Office, Nursery, and Master Bedroom."
                        ),
                    }
                )
            elif r_name == "Basement Bathroom":
                ambiguities.append(
                    {
                        "severity": "low",
                        "category": "blind_pocket",
                        "title": "Basement Bathroom is out of frame left of Play Area camera",
                        "rooms": ["Basement Play Area", "Storage Room"],
                        "camera_id": "camera.basement_play_area",
                        "description": (
                            "Located to the left of `camera.basement_play_area` alongside Storage Room, "
                            "with an unmonitored door and no interior sensors."
                        ),
                        "resolution": (
                            "Treat left edge exit from Basement Play Area as an unsealed transition; "
                            "Storage Room uses its internal `camera.storage_room` to distinguish gym/storage entry."
                        ),
                    }
                )

    # 4c. Fake sealed perimeter warnings
    if room_configs:
        for entry_id, cfg in room_configs.items():
            r_name = str(cfg.get(CONF_ROOM_NAME, entry_id))
            seal_info = seal_analysis.get(r_name)
            if seal_info and cfg.get(CONF_MODE) == Mode.BOUNDED and not seal_info["can_be_bounded"]:
                ambiguities.append(
                    {
                        "severity": "high",
                        "category": "unsealed_perimeter",
                        "title": f"{r_name} is set to `bounded`, but has unsealed exits",
                        "rooms": [r_name],
                        "camera_id": None,
                        "description": (
                            f"{r_name} has unmonitored exits: {', '.join(seal_info['unsealed_exits'])}. "
                            "Using Wasp-in-a-Box `bounded` mode locks occupancy as `occupied_sealed` when "
                            "the exterior door is closed."
                        ),
                        "resolution": f"Switch {r_name} to `mode: open` with Cross-Room Timer Hand-Off.",
                    }
                )

    # 4d. Vertical BLE floor-to-floor stack detection
    upstairs_boxes = [
        r for r in rooms_list if r.get("floor") == "upstairs" and r.get("room_type") == "room"
    ]
    main_boxes = [
        r for r in rooms_list if r.get("floor") == "main" and r.get("room_type") == "room"
    ]
    for u_box in upstairs_boxes:
        for m_box in main_boxes:
            overlap_ratio = _boxes_overlap_2d(u_box, m_box)
            if overlap_ratio >= 0.35:
                ambiguities.append(
                    {
                        "severity": "medium",
                        "category": "vertical_ble_bleed",
                        "title": f"Vertical BLE stack: {u_box['name']} directly above {m_box['name']} ({int(overlap_ratio * 100)}% overlap)",
                        "rooms": [str(u_box["name"]), str(m_box["name"])],
                        "camera_id": None,
                        "description": (
                            f"{u_box['name']} (Upstairs) sits directly over {m_box['name']} (Main Floor). "
                            "Phone/tablet BLE proxies can bleed vertically through the floor."
                        ),
                        "resolution": (
                            "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary "
                            "tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor."
                        ),
                    }
                )

    # 5. Build compiled per-room rules summary
    compiled_room_rules: dict[str, dict[str, Any]] = {}
    for r_name, connected in connected_rooms_map.items():
        seal_info = seal_analysis.get(r_name, {})
        cov_info = room_coverage.get(r_name, {})
        compiled_room_rules[r_name] = {
            "room_name": r_name,
            "connected_rooms": connected,
            "recommended_mode": seal_info.get("recommended_mode", str(Mode.OPEN)),
            "can_be_bounded": seal_info.get("can_be_bounded", False),
            "unsealed_exits": seal_info.get("unsealed_exits", []),
            "recommended_inactivity_timeout": RECOMMENDED_INACTIVITY_TIMEOUTS.get(r_name, 180),
            "spillover_entities_to_downgrade": SPILLOVER_CAMERA_ENTITIES.get(r_name, []),
            "max_camera_coverage_pct": cov_info.get("max_coverage_pct", 0.0),
        }

    return {
        "floorplan": fp,
        "connected_rooms_map": connected_rooms_map,
        "seal_analysis": seal_analysis,
        "camera_analysis": camera_analysis,
        "room_coverage": room_coverage,
        "ambiguities": ambiguities,
        "compiled_room_rules": compiled_room_rules,
    }


def apply_compiled_topology_to_config(
    config: dict[str, Any],
    compiled_topology: dict[str, Any],
) -> dict[str, Any]:
    """Consume compiled floorplan linkages, open-mode enforcement, and camera spillover rules into a room config."""
    updated = copy.deepcopy(config)
    room_name = str(updated.get(CONF_ROOM_NAME, ""))
    rules = compiled_topology.get("compiled_room_rules", {}).get(room_name)
    if not rules:
        return updated

    # 1. Set logical connected_rooms for instant Cross-Room Timer Hand-Off
    updated[CONF_CONNECTED_ROOMS] = list(rules.get("connected_rooms", []))

    # 2. Enforce Mode.OPEN if the room has unsealed exits
    if not rules.get("can_be_bounded", False):
        updated[CONF_MODE] = str(Mode.OPEN)
        updated[CONF_BOUNDARY_ENTITIES] = []

    # 3. Apply tuned inactivity timeout so vacated rooms hand off cleanly
    if rules.get("recommended_inactivity_timeout"):
        updated[CONF_INACTIVITY_TIMEOUT] = int(rules["recommended_inactivity_timeout"])

    # 4. Downgrade whole-frame spillover camera sensors & doorway bleed sensors
    spillover_eids = set(rules.get("spillover_entities_to_downgrade", []) or [])
    if room_name == "Guest Room":
        # Ensure Guest Room motion is moderate (not strong solo) and sticky occupancy is supporting
        spillover_eids.add("binary_sensor.guest_room_motion")

    if spillover_eids:
        triggers = [
            t
            for t in (updated.get(CONF_TRIGGER_ENTITIES, []) or [])
            if str(t.get("entity_id") if isinstance(t, dict) else t) not in spillover_eids
        ]
        updated[CONF_TRIGGER_ENTITIES] = triggers

    obs_list = list(updated.get(CONF_BAYESIAN_OBSERVATIONS, []) or [])
    new_obs: list[dict[str, Any]] = []
    for obs in obs_list:
        if not isinstance(obs, dict):
            continue
        item = dict(obs)
        eid = str(item.get("entity_id", ""))
        if eid in spillover_eids:
            if eid in ("binary_sensor.nursery_person_occupancy", "binary_sensor.guest_room_motion"):
                item["preset"] = str(BayesianWeightPreset.MODERATE)
                item["prob_given_true"] = 0.72
                item["prob_given_false"] = 0.12
            else:
                item["preset"] = str(BayesianWeightPreset.SUPPORTING)
                item["prob_given_true"] = 0.45
                item["prob_given_false"] = 0.20
        elif room_name == "Guest Room" and eid == "binary_sensor.guest_room_occupancy":
            item["preset"] = str(BayesianWeightPreset.SUPPORTING)
            item["prob_given_true"] = 0.45
            item["prob_given_false"] = 0.20
        elif eid == "sensor.tab_s10_lite_ble_area" and room_name != "Master Bedroom":
            # Prevent dual-BLE vertical bleed from crossing 75% without a room sensor
            item["preset"] = str(BayesianWeightPreset.SUPPORTING)
            item["prob_given_true"] = 0.45
            item["prob_given_false"] = 0.25
        new_obs.append(item)
    updated[CONF_BAYESIAN_OBSERVATIONS] = new_obs

    return updated
