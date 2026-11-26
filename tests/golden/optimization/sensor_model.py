"""Shared floorplan topology indexer and 1Hz stateful sensor + EKF conditioning layer."""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Any

from custom_components.presence_detection_designer.ble_kalman_tracker import (
    DEFAULT_PX_PER_FOOT,
    BLERangeMeasurement,
    HouseEKFManager,
    KalmanConfig,
    KalmanEstimate,
)
from custom_components.presence_detection_designer.sensor_reliability import (
    ECOBEE_MOTION_ENTITIES,
    ECOBEE_OCCUPANCY_ENTITIES,
)
from custom_components.presence_detection_designer.spatial_catalog import (
    CAMERA_WHOLE_FRAME_ENTITY,
    ROOM_DOG_OCCUPANCY_ENTITIES,
    ROOM_SHADE_ENTITIES,
    SUNLIT_STATIC_SUBZONES,
)
from custom_components.presence_detection_designer.spatial_geometry import (
    extract_floor_wall_segments,
)
from custom_components.presence_detection_designer.spatial_topology import (
    compile_floorplan_topology,
    compute_pir_spillover_matrix,
)
from tests.golden.floorplan_snapshot import HOUSE_ROOM_CONFIGS

TRANSIT_ROOMS: frozenset[str] = frozenset(
    {"Front Entry", "Upstairs Hallway & Stairs", "Laundry Room"}
)
SLEEP_BATH_ROOMS: frozenset[str] = frozenset(
    {"Master Bedroom", "Master Bathroom", "Margot's Room", "Guest Room"}
)
EXTERIOR_BIRTH_ROOMS: frozenset[str] = frozenset({"Garage", "Front Entry", "Kitchen"})
PRIMARY_BLE_TRACKER: str = "sensor.steve_s_s25_ble_area"

# Floor lookup from Bermuda string reported by sensor.steve_s_s25_ble_area
_BERMUDA_AREA_FLOOR: dict[str, str] = {
    "Basement": "basement",
    "Basement Play Area": "basement",
    "Basement Theater": "basement",
    "Storage Room": "basement",
    "Family Room": "main",
    "Kitchen": "main",
    "Dining Room": "main",
    "Living Room": "main",
    "Front Entry": "main",
    "Laundry Room": "main",
    "Garage": "main",
    "Master Bedroom": "upstairs",
    "Master Bathroom": "upstairs",
    "Margot's Room": "upstairs",
    "Guest Room": "upstairs",
    "Office": "upstairs",
    "Upper Level": "upstairs",
    "Upstairs Hallway & Stairs": "upstairs",
}


@dataclass(frozen=True)
class SubZoneSpec:
    """Geometric & semantic metadata for one Frigate camera person entity."""

    entity_id: str
    room: str
    camera_id: str
    floor: str
    cx: float
    cy: float
    x: float
    y: float
    width: float
    height: float
    is_sunlit: bool
    is_whole_frame: bool = False


@dataclass(frozen=True)
class PIRSpec:
    """Geometric & hardware metadata for one fast PIR motion sensor."""

    entity_id: str
    host_room: str
    floor: str
    x: float
    y: float
    heading_deg: float
    fov_deg: float
    range_px: float
    is_pet_immune: bool
    model_preset: str


@dataclass(frozen=True)
class CameraSpec:
    """Metadata for one physical camera in the floorplan."""

    camera_id: str
    host_room: str
    floor: str
    x: float
    y: float
    heading_deg: float
    fov_deg: float
    range_px: float
    whole_frame_entity: str | None


class HouseTopologyIndex:
    """Precomputed floorplan geometry, sensor bindings, and spillover matrices."""

    def __init__(self, floorplan: dict[str, Any]) -> None:
        self.floorplan = floorplan
        self.tracked_rooms: list[str] = [str(r["room_name"]) for r in HOUSE_ROOM_CONFIGS]
        self.tracked_set: frozenset[str] = frozenset(self.tracked_rooms)

        self.room_configs: dict[str, dict[str, Any]] = {
            str(r["room_name"]): dict(r) for r in HOUSE_ROOM_CONFIGS
        }
        self.room_boxes: dict[str, dict[str, Any]] = {
            str(r["name"]): dict(r) for r in (floorplan.get("rooms") or []) if r.get("name")
        }
        self.room_floor: dict[str, str] = {
            r: str(self.room_boxes.get(r, {}).get("floor", "main")) for r in self.tracked_rooms
        }
        self.room_centroids: dict[str, tuple[float, float]] = {}
        for r in self.tracked_rooms:
            box = self.room_boxes.get(r, {})
            self.room_centroids[r] = (
                float(box.get("x", 0.0)) + float(box.get("width", 100.0)) / 2.0,
                float(box.get("y", 0.0)) + float(box.get("height", 100.0)) / 2.0,
            )

        self.rooms_by_floor: dict[str, list[dict[str, Any]]] = {}
        for r_box in floorplan.get("rooms") or []:
            fl = str(r_box.get("floor", "main"))
            self.rooms_by_floor.setdefault(fl, []).append(r_box)

        # Wall segments matching signal_layers.py / spatial_topology.py
        self.wall_segments_by_floor: dict[
            str, list[tuple[tuple[float, float], tuple[float, float]]]
        ] = {}
        explicit_walls = floorplan.get("floor_wall_segments") or {}
        for fl_obj in floorplan.get("floors") or []:
            fl_id = str(fl_obj.get("id", ""))
            if fl_id in explicit_walls:
                self.wall_segments_by_floor[fl_id] = [
                    ((float(s[0][0]), float(s[0][1])), (float(s[1][0]), float(s[1][1])))
                    for s in explicit_walls[fl_id]
                ]
            else:
                self.wall_segments_by_floor[fl_id] = extract_floor_wall_segments(
                    self.rooms_by_floor.get(fl_id, [])
                )

        # Graph adjacency: union of HOUSE_ROOM_CONFIGS connected_rooms and floorplan connections
        adj: dict[str, set[str]] = {r: set() for r in self.tracked_rooms}
        for r, cfg in self.room_configs.items():
            for dst in cfg.get("connected_rooms") or []:
                if dst in self.tracked_set and dst != r:
                    adj[r].add(dst)
                    adj[dst].add(r)
        for conn in floorplan.get("connections") or []:
            a = str(conn.get("from_room") or conn.get("from") or "")
            b = str(conn.get("to_room") or conn.get("to") or "")
            if a in self.tracked_set and b in self.tracked_set and a != b:
                adj[a].add(b)
                adj[b].add(a)
        self.connected_rooms: dict[str, tuple[str, ...]] = {
            r: tuple(sorted(adj[r])) for r in self.tracked_rooms
        }

        self.is_bounded_room: dict[str, bool] = {
            r: str(cfg.get("mode", "open")) == "bounded" for r, cfg in self.room_configs.items()
        }

        compiled = compile_floorplan_topology(floorplan)
        self.room_coverage: dict[str, dict[str, Any]] = compiled.get("room_coverage", {})
        self.pir_spillover: dict[str, dict[str, float]] = compute_pir_spillover_matrix(
            floorplan, min_overlap_pct=5.0
        )

        # Index cameras and Frigate sub-zones
        self.cameras: dict[str, CameraSpec] = {}
        self.room_cameras: dict[str, list[CameraSpec]] = {r: [] for r in self.tracked_rooms}
        self.room_camera_subzones: dict[str, list[SubZoneSpec]] = {
            r: [] for r in self.tracked_rooms
        }
        self.subzone_by_entity: dict[str, SubZoneSpec] = {}
        self.subzones_by_camera: dict[str, list[SubZoneSpec]] = {}

        seen_cam_eids: dict[str, set[str]] = {r: set() for r in self.tracked_rooms}
        for cam in floorplan.get("cameras") or []:
            cam_id = str(cam.get("id", ""))
            host = str(cam.get("host_room", ""))
            fl = str(cam.get("floor", "main"))
            wf_eid = CAMERA_WHOLE_FRAME_ENTITY.get(cam_id)
            cspec = CameraSpec(
                camera_id=cam_id,
                host_room=host,
                floor=fl,
                x=float(cam.get("x", 0.0)),
                y=float(cam.get("y", 0.0)),
                heading_deg=float(cam.get("heading_deg", 0.0)),
                fov_deg=float(cam.get("fov_deg", 110.0)),
                range_px=float(cam.get("range_px", 500.0)),
                whole_frame_entity=wf_eid,
            )
            self.cameras[cam_id] = cspec
            if host in self.room_cameras:
                self.room_cameras[host].append(cspec)
            self.subzones_by_camera[cam_id] = []

            for sz in cam.get("sub_zones") or []:
                eid = str(sz.get("entity_id", ""))
                sz_room = str(sz.get("room") or host)
                if not eid or sz_room not in self.tracked_set:
                    continue
                sx = float(sz.get("x", 0.0))
                sy = float(sz.get("y", 0.0))
                sw = float(sz.get("width", 60.0))
                sh = float(sz.get("height", 60.0))
                spec = SubZoneSpec(
                    entity_id=eid,
                    room=sz_room,
                    camera_id=cam_id,
                    floor=fl,
                    cx=sx + sw / 2.0,
                    cy=sy + sh / 2.0,
                    x=sx,
                    y=sy,
                    width=sw,
                    height=sh,
                    is_sunlit=(eid in SUNLIT_STATIC_SUBZONES or sz_room in ROOM_SHADE_ENTITIES),
                    is_whole_frame=False,
                )
                self.room_camera_subzones[sz_room].append(spec)
                self.subzone_by_entity[eid] = spec
                self.subzones_by_camera[cam_id].append(spec)
                seen_cam_eids[sz_room].add(eid)

        # Include whole-frame primary camera triggers (e.g., Storage Room) if listed in trigger_entities
        wf_to_cam = {v: k for k, v in CAMERA_WHOLE_FRAME_ENTITY.items()}
        for r, cfg in self.room_configs.items():
            for eid in cfg.get("trigger_entities") or []:
                if eid in wf_to_cam and eid not in seen_cam_eids[r]:
                    cid = wf_to_cam[eid]
                    cspec = self.cameras.get(cid)
                    box = self.room_boxes.get(r, {})
                    fl = cspec.floor if cspec else self.room_floor.get(r, "main")
                    cx, cy = self.room_centroids.get(r, (0.0, 0.0))
                    spec = SubZoneSpec(
                        entity_id=eid,
                        room=r,
                        camera_id=cid,
                        floor=fl,
                        cx=cx,
                        cy=cy,
                        x=float(box.get("x", 0.0)),
                        y=float(box.get("y", 0.0)),
                        width=float(box.get("width", 100.0)),
                        height=float(box.get("height", 100.0)),
                        is_sunlit=(r in ROOM_SHADE_ENTITIES),
                        is_whole_frame=True,
                    )
                    self.room_camera_subzones[r].append(spec)
                    self.subzone_by_entity[eid] = spec
                    seen_cam_eids[r].add(eid)

        # Track whether room uses whole-frame triggers as primary (Storage Room)
        self.room_uses_whole_frame_primary: dict[str, bool] = {
            r: any(sz.is_whole_frame for sz in self.room_camera_subzones[r])
            for r in self.tracked_rooms
        }

        # Index fast PIRs, Ecobee sensors, door contacts, sustaining conditions, dogs, shades
        self.room_fast_pirs: dict[str, list[PIRSpec]] = {r: [] for r in self.tracked_rooms}
        self.pir_by_entity: dict[str, PIRSpec] = {}
        self.room_door_contacts: dict[str, list[tuple[str, str]]] = {
            r: [] for r in self.tracked_rooms
        }
        self.door_connected_rooms: dict[str, tuple[str, ...]] = {}
        self.room_ecobee_motion: dict[str, list[str]] = {r: [] for r in self.tracked_rooms}
        self.room_ecobee_occupancy: dict[str, list[str]] = {r: [] for r in self.tracked_rooms}

        for sen in floorplan.get("sensors") or []:
            eid = str(sen.get("entity_id", ""))
            if not eid:
                continue
            stype = str(sen.get("sensor_type", "pir_motion"))
            host = str(sen.get("host_room", ""))
            fl = str(sen.get("floor", "main"))
            if stype == "door_contact":
                if eid.startswith("binary_sensor.") and host in self.room_door_contacts:
                    self.room_door_contacts[host].append((eid, host))
                continue
            if eid in ECOBEE_MOTION_ENTITIES:
                if host in self.room_ecobee_motion:
                    self.room_ecobee_motion[host].append(eid)
                    occ_eid = eid.replace("_motion", "_occupancy")
                    if occ_eid in ECOBEE_OCCUPANCY_ENTITIES:
                        self.room_ecobee_occupancy[host].append(occ_eid)
                continue
            preset = str(sen.get("model_preset") or "")
            pspec = PIRSpec(
                entity_id=eid,
                host_room=host,
                floor=fl,
                x=float(sen.get("x", 0.0)),
                y=float(sen.get("y", 0.0)),
                heading_deg=float(sen.get("heading_deg", 0.0)),
                fov_deg=float(sen.get("fov_deg", 110.0)),
                range_px=float(sen.get("range_px", 190.0)),
                is_pet_immune=(preset == "ring_alarm_pir_gen2"),
                model_preset=preset,
            )
            if host in self.room_fast_pirs:
                self.room_fast_pirs[host].append(pspec)
            self.pir_by_entity[eid] = pspec

        # Include Family Room Ring stickup PIR & boundary entities declared in room configs
        for r, cfg in self.room_configs.items():
            for beid in cfg.get("boundary_entities") or []:
                if beid.startswith("binary_sensor."):
                    self.door_connected_rooms[beid] = tuple(
                        sorted(set(self.door_connected_rooms.get(beid, ())) | {r})
                    )
                    if not any(e == beid for e, _ in self.room_door_contacts[r]):
                        self.room_door_contacts[r].append((beid, r))
            for obs in cfg.get("bayesian_observations") or []:
                oeid = str(obs.get("entity_id", ""))
                if oeid in ECOBEE_MOTION_ENTITIES and oeid not in self.room_ecobee_motion[r]:
                    self.room_ecobee_motion[r].append(oeid)
                if oeid in ECOBEE_OCCUPANCY_ENTITIES and oeid not in self.room_ecobee_occupancy[r]:
                    self.room_ecobee_occupancy[r].append(oeid)

        self.room_sustaining: dict[str, tuple[dict[str, Any], ...]] = {
            r: tuple(cfg.get("sustaining_conditions") or ()) for r, cfg in self.room_configs.items()
        }
        self.room_dog_entities: dict[str, tuple[str, ...]] = {
            r: tuple(ROOM_DOG_OCCUPANCY_ENTITIES.get(r, ())) for r in self.tracked_rooms
        }
        self.room_shade_entities: dict[str, tuple[str, ...]] = {
            r: tuple(ROOM_SHADE_ENTITIES.get(r, ())) for r in self.tracked_rooms
        }
        # Open-plan main-floor camera rooms where Riley can trip fast non-pet-immune PIRs
        self.camera_covered_pir_rooms: frozenset[str] = frozenset(
            r
            for r in self.tracked_rooms
            if self.room_cameras.get(r)
            or (self.room_coverage.get(r, {}).get("max_coverage_pct", 0.0) >= 35.0)
        )


def _eval_condition(raw_state: str | None, op: str, target: str) -> bool:
    if raw_state is None:
        return False
    if op == "equals":
        return raw_state == target
    if op == "greater_than":
        try:
            return float(raw_state) > float(target)
        except ValueError:
            return False
    return False


@dataclass
class SensorFrameState:
    """1Hz stateful sensor + EKF observer stepping through one ScenarioBundle."""

    topology: HouseTopologyIndex
    ekf_config: KalmanConfig | None = None
    states: dict[str, str] = field(default_factory=dict)
    prev_states: dict[str, str] = field(default_factory=dict)
    last_rise_t: dict[str, int] = field(default_factory=dict)
    last_dog_t: dict[str, int] = field(default_factory=dict)
    last_shade_move_t: dict[str, int] = field(default_factory=dict)
    last_door_open_t: dict[str, int] = field(default_factory=dict)
    ekf_manager: HouseEKFManager = field(init=False)
    ekf_est: KalmanEstimate = field(init=False)

    def __post_init__(self) -> None:
        self.ekf_manager = HouseEKFManager(self.ekf_config or KalmanConfig())
        self.ekf_est = KalmanEstimate(
            floor="main",
            x_px=0.0,
            y_px=0.0,
            vx_px_s=0.0,
            vy_px_s=0.0,
            speed_ft_s=0.0,
            heading_deg=None,
            sigma_x_ft=10.0,
            sigma_y_ft=10.0,
        )

    def step(
        self,
        t: int,
        updates: dict[str, str],
        ble_ranges: list[BLERangeMeasurement],
        base_ts: float = 1795650000.0,
    ) -> None:
        """Advance state by 1 second, apply updates, track edges, and update 2D+Floor EKF."""
        self.prev_states = dict(self.states)
        if updates:
            self.states.update(updates)

        topo = self.topology
        for eid, val in (updates if t > 0 else self.states).items():
            prev = self.prev_states.get(eid)
            if val == "on" and (t == 0 or prev != "on"):
                self.last_rise_t[eid] = t

        for r in topo.tracked_rooms:
            for deid in topo.room_dog_entities[r]:
                if self.states.get(deid) == "on":
                    self.last_dog_t[r] = t
            for seid in topo.room_shade_entities[r]:
                if self.states.get(seid) in ("opening", "closing"):
                    self.last_shade_move_t[r] = t
            for d_eid, _ in topo.room_door_contacts[r]:
                if self.states.get(d_eid) == "on":
                    self.last_door_open_t[r] = t

        # Collect Mahalanobis-gated camera/PIR position observations (exclude pet/shade noise)
        cam_hits: list[tuple[str, float, float]] = []
        pir_hits: list[tuple[str, float, float]] = []
        for r in topo.tracked_rooms:
            shade_active = self.is_shade_settling(r, t, window_sec=20)
            pet_active = self.is_pet_active(r, t, window_sec=6)
            r_cam_hit = False
            for sz in topo.room_camera_subzones[r]:
                if self.states.get(sz.entity_id) == "on":
                    if shade_active and not any(
                        self.states.get(p.entity_id) == "on" for p in topo.room_fast_pirs[r]
                    ):
                        continue
                    cam_hits.append((sz.floor, sz.cx, sz.cy))
                    r_cam_hit = True
            if not r_cam_hit and not pet_active:
                for p in topo.room_fast_pirs[r]:
                    if self.states.get(p.entity_id) == "on" and self.rise_age(p.entity_id, t) <= 3:
                        if not (r == "Kitchen" and topo.pir_spillover.get(p.entity_id)):
                            # Normal fast PIR centroid shifted halfway along its heading
                            px = p.x + 0.35 * p.range_px * math.cos(math.radians(p.heading_deg))
                            py = p.y + 0.35 * p.range_px * math.sin(math.radians(p.heading_deg))
                            pir_hits.append((p.floor, px, py))

        area_str = self.states.get(PRIMARY_BLE_TRACKER, "")
        if not ble_ranges and area_str in ("Away", "not_home"):
            self.ekf_manager.get_tracker(PRIMARY_BLE_TRACKER).reset()
            self.ekf_est = KalmanEstimate(
                floor="main",
                x_px=0.0,
                y_px=0.0,
                vx_px_s=0.0,
                vy_px_s=0.0,
                speed_ft_s=0.0,
                heading_deg=None,
                sigma_x_ft=10.0,
                sigma_y_ft=10.0,
                initialized=False,
            )
            return

        bermuda_floor = _BERMUDA_AREA_FLOOR.get(area_str)
        self.ekf_est = self.ekf_manager.update_from_observations(
            tracker_entity_id=PRIMARY_BLE_TRACKER,
            ble_ranges=ble_ranges,
            floorplan=topo.floorplan,
            now_ts=base_ts + float(t),
            active_camera_hits=cam_hits,
            active_pir_hits=pir_hits,
            bermuda_area_floor=bermuda_floor,
        )

    def rise_age(self, eid: str, t: int) -> int:
        rt = self.last_rise_t.get(eid)
        return 999999 if rt is None else max(0, t - rt)

    def is_on(self, eid: str) -> bool:
        return self.states.get(eid) == "on"

    def is_sustaining_active(self, room: str) -> bool:
        for cond in self.topology.room_sustaining.get(room, ()):
            eid = str(cond.get("entity_id", ""))
            op = str(cond.get("operator", "equals"))
            target = str(cond.get("state", ""))
            if _eval_condition(self.states.get(eid), op, target):
                return True
        return False

    def is_pet_active(
        self,
        room: str,
        t: int,
        window_sec: int = 18,
        *,
        pir_entity_id: str | None = None,
    ) -> bool:
        """Return True if a dog was detected in `room` or in a room spilled into by `pir_entity_id`."""
        dt = self.last_dog_t.get(room)
        if dt is not None and (t - dt) <= window_sec:
            return True
        if pir_entity_id:
            for sp_room in self.topology.pir_spillover.get(pir_entity_id, ()):
                sdt = self.last_dog_t.get(sp_room)
                if sdt is not None and (t - sdt) <= window_sec:
                    return True
        return False

    def is_any_open_plan_pet_active(self, t: int, window_sec: int = 18) -> bool:
        for r in ("Dining Room", "Living Room", "Kitchen", "Family Room"):
            if self.is_pet_active(r, t, window_sec=window_sec):
                return True
        return False

    def is_shade_settling(self, room: str, t: int, window_sec: int = 180) -> bool:
        st = self.last_shade_move_t.get(room)
        return st is not None and (t - st) <= window_sec

    def is_door_opened_recently(self, room: str, t: int, after_t: int) -> bool:
        dt = self.last_door_open_t.get(room)
        return dt is not None and dt >= after_t and dt <= t

    def is_camera_clear(self, room: str) -> bool:
        """Return True when a room's dedicated interior camera sees no person in that room's zones."""
        topo = self.topology
        if not topo.room_cameras.get(room):
            return False
        for sz in topo.room_camera_subzones.get(room, ()):
            if self.states.get(sz.entity_id) == "on":
                return False
        return True

    def room_ekf_prob(self, room: str) -> tuple[float, float]:
        """Return (p_ekf_room, conf_factor) where conf_factor accounts for floor covariance."""
        if not self.ekf_est.initialized:
            return 0.0, 0.0
        sigma = max(self.ekf_est.sigma_x_ft, self.ekf_est.sigma_y_ft)
        conf = max(0.15, min(1.0, 1.0 / (1.0 + max(0.0, sigma - 3.0) / 6.0)))
        if self.topology.room_floor.get(room) != self.ekf_est.floor:
            return 0.0, conf
        return float(self.ekf_est.room_probabilities.get(room, 0.0)), conf


__all__ = [
    "DEFAULT_PX_PER_FOOT",
    "EXTERIOR_BIRTH_ROOMS",
    "SLEEP_BATH_ROOMS",
    "TRANSIT_ROOMS",
    "HouseTopologyIndex",
    "PIRSpec",
    "SensorFrameState",
    "SubZoneSpec",
]
