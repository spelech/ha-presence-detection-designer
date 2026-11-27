"""4-layer synthetic sensor signal generator & seeded fuzzer grounded in real floorplan geometry.

Layer 0: Ground-truth actor trajectories (t, actor, floor, x, y, activity) -> expected_occupied_rooms(t)
Layer 1: Geometric raycast projection against actual placed cameras, sub-zones, PIRs, Ecobee, doors, BLE proxies
Layer 2: Hardware timing & physics (PIR cooldowns, Ecobee 300s/1800s tails, Bermuda 10s update lag, stillness dropouts)
Layer 3: Seeded fuzzing (BLE bounce/vertical bleed, PIR spillover, Household Pet pet trips, shade flickers, remote UPS, jitter)
"""

from __future__ import annotations

import math
import random
from dataclasses import dataclass, field
from typing import Any

from custom_components.presence_detection_designer.engine.sensor_reliability import (
    ECOBEE_MOTION_ENTITIES,
)
from custom_components.presence_detection_designer.spatial.ble_kalman_tracker import (
    DEFAULT_PX_PER_FOOT,
    BLERangeMeasurement,
)
from custom_components.presence_detection_designer.spatial.spatial_catalog import (
    CAMERA_WHOLE_FRAME_ENTITY,
    ROOM_DOG_OCCUPANCY_ENTITIES,
    ROOM_SHADE_ENTITIES,
)
from custom_components.presence_detection_designer.spatial.spatial_geometry import (
    extract_floor_wall_segments,
    line_segment_intersects_solid_wall,
    point_in_cone,
)

# Map floorplan BLE proxy host_room -> Bermuda area string reported by sensor.resident_a_phone_ble_area
PROXY_ROOM_TO_BERMUDA_AREA: dict[str, str] = {
    "Basement Play Area": "Basement",
    "Basement Theater": "Basement Theater",
    "Storage Room": "Storage Room",
    "Family Room": "Family Room",
    "Kitchen": "Kitchen",
    "Dining Room": "Dining Room",
    "Living Room": "Living Room",
    "Front Entry": "Front Entry",
    "Laundry Room": "Laundry Room",
    "Garage": "Garage",
    "Master Bedroom": "Master Bedroom",
    "Master Bathroom": "Master Bathroom",
    "Kids Room": "Kids Room",
    "Guest Room": "Guest Room",
    "Office": "Office",
    "Upstairs Hallway & Stairs": "Upper Level",
}

# Vertical stack pairs (floor_a_room, floor_b_room) prone to through-floor BLE bleed
VERTICAL_BLE_PAIRS: tuple[tuple[str, str], ...] = (
    ("Master Bedroom", "Living Room"),
    ("Master Bedroom", "Dining Room"),
    ("Master Bedroom", "Kitchen"),
    ("Kids Room", "Kitchen"),
    ("Guest Room", "Family Room"),
    ("Office", "Garage"),
    ("Family Room", "Basement Play Area"),
    ("Living Room", "Basement Theater"),
)


@dataclass(frozen=True)
class ActorWaypoint:
    """Single waypoint in a ground-truth actor trajectory."""

    t: int
    floor: str
    x: float
    y: float
    room: str | None  # Expected logical room name (None when away/outside)
    activity: str = "walking"  # walking | sitting_still | sleeping | showering | desk_work | away


@dataclass(frozen=True)
class ActorTrack:
    """Named household occupant or pet with a piecewise-linear trajectory."""

    actor_id: str
    actor_type: str  # "resident_a" | "resident_b" | "guest" | "household_pet"
    has_ble_tracker: bool = False
    waypoints: tuple[ActorWaypoint, ...] = ()

    @property
    def is_human(self) -> bool:
        return self.actor_type != "household_pet"


@dataclass(frozen=True)
class HardwareTimingProfile:
    """Physical timing & cooldown constants for each sensor class."""

    fast_pir_cooldown_sec: int = 15
    ecobee_motion_cooldown_sec: int = 300
    ecobee_occupancy_tail_sec: int = 1800
    bermuda_update_interval_sec: int = 10
    camera_stillness_dropout_after_sec: int = 25
    door_contact_pulse_sec: int = 5


@dataclass(frozen=True)
class FuzzProfile:
    """Controlled perturbation knobs for seeded stress-testing."""

    ble_adjacent_bounce_prob: float = 0.0
    ble_vertical_bleed_prob: float = 0.0
    ble_unknown_dropout_prob: float = 0.0
    pir_false_spike_prob: float = 0.0
    camera_frame_drop_prob: float = 0.0
    shade_flicker_events: tuple[tuple[int, str, str], ...] = ()  # (t, room, camera_subzone_eid)
    remote_ups_watts_windows: tuple[tuple[int, int, float], ...] = ()  # (t_start, t_end, watts)
    tv_playing_windows: tuple[tuple[int, int, str], ...] = ()  # (t_start, t_end, media_player_eid)
    shower_humidity_windows: tuple[tuple[int, int, float], ...] = ()  # (t_start, t_end, dhumidity)
    event_jitter_max_sec: int = 0


@dataclass
class GeneratedTimeline:
    """1Hz ground truth + entity state-change event stream ready for VirtualHAHarness."""

    duration_sec: int
    seed: int
    expected_occupied: list[set[str]]  # index = second t, value = expected occupied rooms
    initial_states: dict[str, str]
    events: list[tuple[int, dict[str, str]]] = field(default_factory=list)
    ble_ranges_by_t: list[list[BLERangeMeasurement]] = field(default_factory=list)


def _interpolate_actor(
    track: ActorTrack,
    t: int,
    rooms_by_name: dict[str, dict[str, Any]] | None = None,
) -> ActorWaypoint:
    """Linearly interpolate an actor's position and activity at integer second t.

    When `rooms_by_name` is supplied and the actor moves between two rooms on the
    same floor, resolves `room` against the physical floorplan bounding boxes so
    ground-truth occupancy matches the actor's physical coordinates rather than
    flipping rooms prematurely behind a wall at `frac == 0.5`.
    """
    wps = track.waypoints
    if not wps:
        return ActorWaypoint(t=t, floor="main", x=0.0, y=0.0, room=None, activity="away")
    if t <= wps[0].t:
        return ActorWaypoint(
            t=t,
            floor=wps[0].floor,
            x=wps[0].x,
            y=wps[0].y,
            room=wps[0].room,
            activity=wps[0].activity,
        )
    if t >= wps[-1].t:
        return ActorWaypoint(
            t=t,
            floor=wps[-1].floor,
            x=wps[-1].x,
            y=wps[-1].y,
            room=wps[-1].room,
            activity=wps[-1].activity,
        )
    for i in range(len(wps) - 1):
        a, b = wps[i], wps[i + 1]
        if a.t <= t <= b.t:
            if a.floor != b.floor or b.t == a.t:
                return ActorWaypoint(
                    t=t, floor=a.floor, x=a.x, y=a.y, room=a.room, activity=a.activity
                )
            frac = (t - a.t) / float(b.t - a.t)
            x = a.x + (b.x - a.x) * frac
            y = a.y + (b.y - a.y) * frac
            if a.room == b.room or not rooms_by_name:
                room = a.room if frac < 0.5 else b.room
            else:
                box_a = rooms_by_name.get(a.room) if a.room else None
                box_b = rooms_by_name.get(b.room) if b.room else None
                in_a = box_a is not None and _point_in_rect(x, y, box_a)
                in_b = box_b is not None and _point_in_rect(x, y, box_b)
                if in_a and not in_b:
                    room = a.room
                elif in_b and not in_a:
                    room = b.room
                else:
                    room = a.room if frac < 0.5 else b.room
            return ActorWaypoint(t=t, floor=a.floor, x=x, y=y, room=room, activity=a.activity)
    return wps[-1]


def _has_line_of_sight(
    p1: tuple[float, float],
    p2: tuple[float, float],
    wall_segments: list[tuple[tuple[float, float], tuple[float, float]]],
) -> bool:
    """Return True if segment p1->p2 does not cross any solid wall segment."""
    return not line_segment_intersects_solid_wall(p1[0], p1[1], p2[0], p2[1], wall_segments)


def _point_in_rect(x: float, y: float, box: dict[str, Any]) -> bool:
    bx = float(box.get("x", 0))
    by = float(box.get("y", 0))
    bw = float(box.get("width", 0))
    bh = float(box.get("height", 0))
    return bx <= x <= bx + bw and by <= y <= by + bh


class LayeredSignalGenerator:
    """Projects Layer 0 actor trajectories through Layers 1-3 using real floorplan geometry."""

    def __init__(
        self,
        floorplan: dict[str, Any],
        timing: HardwareTimingProfile | None = None,
    ) -> None:
        self.floorplan = floorplan
        self.timing = timing or HardwareTimingProfile()
        self.wall_segments_by_floor: dict[
            str, list[tuple[tuple[float, float], tuple[float, float]]]
        ] = {}
        explicit_walls = floorplan.get("floor_wall_segments") or {}
        for fl in floorplan.get("floors", []):
            fl_id = str(fl.get("id", ""))
            if fl_id in explicit_walls:
                self.wall_segments_by_floor[fl_id] = [
                    ((float(s[0][0]), float(s[0][1])), (float(s[1][0]), float(s[1][1])))
                    for s in explicit_walls[fl_id]
                ]
            else:
                fl_rooms = [r for r in floorplan.get("rooms", []) if r.get("floor") == fl_id]
                self.wall_segments_by_floor[fl_id] = extract_floor_wall_segments(fl_rooms)

        self.rooms_by_name: dict[str, dict[str, Any]] = {
            str(r["name"]): r for r in floorplan.get("rooms", []) if r.get("name")
        }
        self.adjacent_rooms: dict[str, list[str]] = {}
        for conn in floorplan.get("connections", []):
            a = str(conn.get("from_room") or conn.get("from") or "")
            b = str(conn.get("to_room") or conn.get("to") or "")
            if a and b:
                self.adjacent_rooms.setdefault(a, []).append(b)
                self.adjacent_rooms.setdefault(b, []).append(a)

    def generate(
        self,
        *,
        tracks: list[ActorTrack],
        duration_sec: int,
        fuzz: FuzzProfile | None = None,
        seed: int = 42,
    ) -> GeneratedTimeline:
        """Generate a deterministic 1Hz ground-truth + fuzzed entity timeline."""
        rng = random.Random(seed)
        fz = fuzz or FuzzProfile()

        expected_occupied: list[set[str]] = []
        raw_frames: list[dict[str, str]] = []
        ble_ranges_by_t: list[list[BLERangeMeasurement]] = []

        # Layer 2 stateful cooldown / stillness trackers
        pir_hold_until: dict[str, int] = {}
        ecobee_occ_until: dict[str, int] = {}
        actor_still_sec: dict[str, int] = {tr.actor_id: 0 for tr in tracks}
        last_ble_area = "Away"

        for t in range(duration_sec):
            poses = {tr.actor_id: _interpolate_actor(tr, t, self.rooms_by_name) for tr in tracks}

            # Layer 0: Ground truth = rooms containing >= 1 human
            exp_rooms: set[str] = set()
            for tr in tracks:
                pose = poses[tr.actor_id]
                if pose.activity in ("sitting_still", "sleeping", "desk_work"):
                    actor_still_sec[tr.actor_id] += 1
                else:
                    actor_still_sec[tr.actor_id] = 0
                if tr.is_human and pose.room:
                    exp_rooms.add(pose.room)
            expected_occupied.append(exp_rooms)

            state_map: dict[str, str] = {}

            # --- Layer 1 + 2: Cameras & Frigate Sub-zones ---
            for cam in self.floorplan.get("cameras", []):
                cam_id = str(cam.get("id", ""))
                cam_fl = str(cam.get("floor", ""))
                cx, cy = float(cam.get("x", 0)), float(cam.get("y", 0))
                heading = float(cam.get("heading_deg", 0))
                fov = float(cam.get("fov_deg", 110))
                reach = float(cam.get("range_px", 560))
                walls = self.wall_segments_by_floor.get(cam_fl, [])

                wf_eid = CAMERA_WHOLE_FRAME_ENTITY.get(cam_id)
                wf_human = False

                for sz in cam.get("sub_zones", []):
                    sz_eid = str(sz.get("entity_id", ""))
                    if not sz_eid:
                        continue
                    sz_human = False
                    for tr in tracks:
                        if not tr.is_human:
                            continue
                        pose = poses[tr.actor_id]
                        if pose.floor != cam_fl or pose.room is None:
                            continue
                        if not _point_in_rect(pose.x, pose.y, sz):
                            continue
                        if not point_in_cone(pose.x, pose.y, cx, cy, heading, fov, reach):
                            continue
                        if not _has_line_of_sight((cx, cy), (pose.x, pose.y), walls):
                            continue
                        # Layer 2: stillness dropout after configured seconds
                        if (
                            actor_still_sec[tr.actor_id]
                            >= self.timing.camera_stillness_dropout_after_sec
                        ):
                            continue
                        # Layer 3: random frame drop
                        if (
                            fz.camera_frame_drop_prob > 0
                            and rng.random() < fz.camera_frame_drop_prob
                        ):
                            continue
                        sz_human = True
                        wf_human = True
                    state_map[sz_eid] = "on" if sz_human else "off"

                if wf_eid:
                    # Also check whole-frame visibility outside sub-zones
                    # (Storage Room's Frigate zone masks out the doorway to Basement Play Area)
                    if not wf_human:
                        for tr in tracks:
                            if not tr.is_human:
                                continue
                            pose = poses[tr.actor_id]
                            if pose.floor != cam_fl or pose.room is None:
                                continue
                            if cam_id == "camera.storage_room" and pose.room != "Storage Room":
                                continue
                            if not point_in_cone(pose.x, pose.y, cx, cy, heading, fov, reach):
                                continue
                            if not _has_line_of_sight((cx, cy), (pose.x, pose.y), walls):
                                continue
                            if (
                                actor_still_sec[tr.actor_id]
                                >= self.timing.camera_stillness_dropout_after_sec
                            ):
                                continue
                            if (
                                fz.camera_frame_drop_prob > 0
                                and rng.random() < fz.camera_frame_drop_prob
                            ):
                                continue
                            wf_human = True
                    state_map[wf_eid] = "on" if wf_human else "off"

            # --- Dog occupancy sensors (Household Pet) ---
            for dog_room, dog_eids in ROOM_DOG_OCCUPANCY_ENTITIES.items():
                dog_here = any(
                    not tr.is_human and poses[tr.actor_id].room == dog_room for tr in tracks
                )
                for deid in dog_eids:
                    state_map[deid] = "on" if dog_here else "off"

            # --- Layer 1 + 2: PIRs, Ecobee, and Door Contacts ---
            for sen in self.floorplan.get("sensors", []):
                eid = str(sen.get("entity_id", ""))
                if not eid:
                    continue
                stype = str(sen.get("sensor_type", "pir_motion"))
                sfl = str(sen.get("floor", ""))
                sx, sy = float(sen.get("x", 0)), float(sen.get("y", 0))
                walls = self.wall_segments_by_floor.get(sfl, [])

                if stype == "door_contact":
                    near_door = any(
                        poses[tr.actor_id].floor == sfl
                        and poses[tr.actor_id].activity == "walking"
                        and math.hypot(poses[tr.actor_id].x - sx, poses[tr.actor_id].y - sy) <= 22.0
                        for tr in tracks
                    )
                    if near_door:
                        pir_hold_until[eid] = max(
                            pir_hold_until.get(eid, -1), t + self.timing.door_contact_pulse_sec
                        )
                    state_map[eid] = "on" if t <= pir_hold_until.get(eid, -1) else "off"
                    continue

                heading = float(sen.get("heading_deg", 0))
                fov = float(sen.get("fov_deg", 110))
                reach = float(sen.get("range_px", 190))
                is_ecobee = eid in ECOBEE_MOTION_ENTITIES
                is_pet_immune = str(sen.get("model_preset", "")) == "ring_alarm_pir_gen2"

                triggered_now = False
                for tr in tracks:
                    if is_pet_immune and not tr.is_human:
                        continue
                    pose = poses[tr.actor_id]
                    if pose.floor != sfl or pose.room is None:
                        continue
                    if pose.activity != "walking":
                        continue
                    if not point_in_cone(pose.x, pose.y, sx, sy, heading, fov, reach):
                        continue
                    if not _has_line_of_sight((sx, sy), (pose.x, pose.y), walls):
                        continue
                    triggered_now = True
                    break

                # Layer 3: random single-pulse PIR false spike
                if not triggered_now and not is_ecobee and fz.pir_false_spike_prob > 0:
                    if rng.random() < fz.pir_false_spike_prob:
                        triggered_now = True

                cooldown = (
                    self.timing.ecobee_motion_cooldown_sec
                    if is_ecobee
                    else self.timing.fast_pir_cooldown_sec
                )
                if triggered_now:
                    pir_hold_until[eid] = max(pir_hold_until.get(eid, -1), t + cooldown)
                    if is_ecobee:
                        occ_eid = eid.replace("_motion", "_occupancy")
                        ecobee_occ_until[occ_eid] = max(
                            ecobee_occ_until.get(occ_eid, -1),
                            t + self.timing.ecobee_occupancy_tail_sec,
                        )

                state_map[eid] = "on" if t <= pir_hold_until.get(eid, -1) else "off"
                if is_ecobee:
                    occ_eid = eid.replace("_motion", "_occupancy")
                    state_map[occ_eid] = "on" if t <= ecobee_occ_until.get(occ_eid, -1) else "off"

            # --- Layer 1 + 2 + 3: Calibrated BLE (sensor.resident_a_phone_ble_area) ---
            resident_a_track = next((tr for tr in tracks if tr.has_ble_tracker), None)
            if resident_a_track is not None and (t % self.timing.bermuda_update_interval_sec == 0):
                spose = poses[resident_a_track.actor_id]
                if spose.room is None or spose.activity == "away":
                    last_ble_area = "Away"
                else:
                    # Nearest proxy on Resident A's floor
                    fl_proxies = [
                        p
                        for p in self.floorplan.get("ble_proxies", [])
                        if p.get("floor") == spose.floor
                    ]
                    if fl_proxies:
                        nearest = min(
                            fl_proxies,
                            key=lambda p: math.hypot(
                                float(p.get("x", 0)) - spose.x, float(p.get("y", 0)) - spose.y
                            ),
                        )
                        host_room = str(nearest.get("host_room") or spose.room)
                    else:
                        host_room = spose.room

                    # Layer 3: BLE fuzzing (unknown dropout, vertical bleed, adjacent bounce)
                    if (
                        fz.ble_unknown_dropout_prob > 0
                        and rng.random() < fz.ble_unknown_dropout_prob
                    ):
                        last_ble_area = "unknown"
                    elif (
                        fz.ble_vertical_bleed_prob > 0 and rng.random() < fz.ble_vertical_bleed_prob
                    ):
                        v_targets = [
                            b if a == host_room else a
                            for a, b in VERTICAL_BLE_PAIRS
                            if host_room in (a, b)
                        ]
                        bled = rng.choice(v_targets) if v_targets else host_room
                        last_ble_area = PROXY_ROOM_TO_BERMUDA_AREA.get(bled, bled)
                    elif (
                        fz.ble_adjacent_bounce_prob > 0
                        and rng.random() < fz.ble_adjacent_bounce_prob
                    ):
                        adj = self.adjacent_rooms.get(host_room) or [host_room]
                        bounced = rng.choice(adj)
                        last_ble_area = PROXY_ROOM_TO_BERMUDA_AREA.get(bounced, bounced)
                    else:
                        last_ble_area = PROXY_ROOM_TO_BERMUDA_AREA.get(host_room, host_room)
            state_map["sensor.resident_a_phone_ble_area"] = last_ble_area

            # --- Layer 4B: Multi-proxy BLE calibrated range readings (1Hz for EKF trilateration) ---
            t_ranges: list[BLERangeMeasurement] = []
            if resident_a_track is not None:
                spose_r = poses[resident_a_track.actor_id]
                if spose_r.room is not None and spose_r.activity != "away":
                    is_fuzzed_ble = (
                        fz.ble_adjacent_bounce_prob > 0
                        or fz.ble_vertical_bleed_prob > 0
                        or fz.event_jitter_max_sec > 0
                    )
                    for p in self.floorplan.get("ble_proxies", []):
                        px_f = float(p.get("x", 0.0))
                        py_f = float(p.get("y", 0.0))
                        d_ft = math.hypot(spose_r.x - px_f, spose_r.y - py_f) / DEFAULT_PX_PER_FOOT
                        if str(p.get("floor", "")) != spose_r.floor:
                            d_ft = math.hypot(d_ft, 11.0) + 4.0
                        if d_ft > 38.0:
                            continue
                        if is_fuzzed_ble:
                            noise = rng.gauss(0.0, 1.5 + 0.12 * d_ft)
                            if rng.random() < 0.08:
                                noise += rng.uniform(15.0, 25.0)
                        else:
                            noise = rng.gauss(0.0, 0.6 + 0.05 * d_ft)
                        t_ranges.append(
                            BLERangeMeasurement(
                                proxy_id=str(p.get("id", "")),
                                floor=str(p.get("floor", "main")),
                                x_px=px_f,
                                y_px=py_f,
                                distance_ft=max(0.5, d_ft + noise),
                                age_sec=0.0,
                                host_room=str(p.get("host_room", "")),
                            )
                        )
            ble_ranges_by_t.append(t_ranges)

            # --- Sustaining actuators (UPS, TVs, Shower Humidity, Shades) ---
            ups_val = 45.0
            for t0, t1, watts in fz.remote_ups_watts_windows:
                if t0 <= t <= t1:
                    ups_val = watts
            state_map["sensor.office_ups_used_watts_filtered"] = f"{ups_val:.1f}"

            dhum_val = 0.0
            for t0, t1, dh in fz.shower_humidity_windows:
                if t0 <= t <= t1:
                    dhum_val = dh
            state_map["sensor.master_bathroom_dhumidity"] = f"{dhum_val:.2f}"

            for mp_eid in (
                "media_player.family_room_tv",
                "media_player.living_room_display_webos",
                "media_player.master_bedroom_tv_androidtv",
                "media_player.resident_b_s_tv",
                "media_player.basement_display_webos",
            ):
                playing = any(
                    t0 <= t <= t1 and eid == mp_eid for t0, t1, eid in fz.tv_playing_windows
                )
                state_map[mp_eid] = "playing" if playing else "idle"

            # Layer 3: Sunlit shade movement + false camera flicker
            for sh_t, sh_room, flick_eid in fz.shade_flicker_events:
                for sh_eid in ROOM_SHADE_ENTITIES.get(sh_room, ()):
                    if sh_t <= t <= sh_t + 10:
                        state_map[sh_eid] = "opening"
                    else:
                        state_map.setdefault(sh_eid, "open")
                if sh_t + 2 <= t <= sh_t + 6:
                    state_map[flick_eid] = "on"

            raw_frames.append(state_map)

        # Compress 1Hz frames into delta events (preserving strict per-entity causal ordering under jitter)
        initial_states = dict(raw_frames[0]) if raw_frames else {}
        prev_states = dict(initial_states)
        scheduled: dict[int, dict[str, str]] = {}
        last_eid_t: dict[str, int] = {}

        for t in range(1, len(raw_frames)):
            frame = raw_frames[t]
            for eid, val in frame.items():
                if prev_states.get(eid) != val:
                    prev_states[eid] = val
                    jitter = (
                        rng.randint(0, fz.event_jitter_max_sec)
                        if fz.event_jitter_max_sec > 0
                        else 0
                    )
                    min_t = last_eid_t.get(eid, 0) + 1 if eid in last_eid_t else t
                    ev_t = min(duration_sec - 1, max(min_t, t + jitter))
                    last_eid_t[eid] = ev_t
                    scheduled.setdefault(ev_t, {})[eid] = val

        events = sorted(scheduled.items(), key=lambda kv: kv[0])
        return GeneratedTimeline(
            duration_sec=duration_sec,
            seed=seed,
            expected_occupied=expected_occupied,
            initial_states=initial_states,
            events=events,
            ble_ranges_by_t=ble_ranges_by_t,
        )
