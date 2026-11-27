"""Coupled Continuous-Time Log-Odds HMM / Dynamic Bayesian Network Inference Engine.

Production implementation of the winning Candidate B (`B_Coupled_HMM_ref_04`) architecture
validated in the 5-candidate / 325-config / 15,840-timeline Golden Optimization Sprawl.

Key properties:
- 1 Hz continuous-time log-odds state evolution L_r(t) in [-4.8, 4.6] per room.
- Physical sensor conditioning: shade settling gate, pet exclusion, raycast PIR spillover
  attenuation, exponential PIR latch decay, clear-camera negative space, and bounded seals.
- Supporting-only 2D+Floor EKF continuous drift with GUARD-02 cap (BLE never solo-triggers).
- Schmitt hysteresis output control (theta_enter=0.614, theta_clear=0.506, min-dwell >= 3s).
- Calibrated probability P_r(t) = sigmoid(L_r(t)) + per-room spillover-aware automation
  confidence thresholds and Vision-LLM [0.35, 0.70] ambiguity-band escalation flags.
"""

from __future__ import annotations

import math
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

from .sensor_reliability import ECOBEE_MOTION_ENTITIES, ECOBEE_OCCUPANCY_ENTITIES
from .spatial_catalog import (
    CAMERA_WHOLE_FRAME_ENTITY,
    ROOM_DOG_OCCUPANCY_ENTITIES,
    ROOM_SHADE_ENTITIES,
    SUNLIT_STATIC_SUBZONES,
)
from .spatial_topology import compile_floorplan_topology, compute_pir_spillover_matrix

TRANSIT_ROOMS: frozenset[str] = frozenset(
    {"Front Entry", "Upstairs Hallway & Stairs", "Laundry Room"}
)
SLEEP_BATH_ROOMS: frozenset[str] = frozenset(
    {"Master Bedroom", "Master Bathroom", "Margot's Room", "Guest Room"}
)
EXTERIOR_BIRTH_ROOMS: frozenset[str] = frozenset({"Garage", "Front Entry", "Kitchen"})
OPEN_PLAN_MAIN_ROOMS: frozenset[str] = frozenset(
    {"Dining Room", "Living Room", "Kitchen", "Family Room", "Front Entry"}
)

_L_MIN = -4.8
_L_MAX = 4.6
_L_PRIOR = -2.44235  # logit(0.08)

# Winning B_Coupled_HMM_ref_04 hyperparameters from held-out validation (37/48, 12s FP, 2 flaps)
DEFAULT_HMM_PARAMS: dict[str, float] = {
    "base_exit_hazard": 0.01886,
    "transit_hazard_mult": 3.53188,
    "sustain_hazard_mult": 0.03021,
    "cam_subzone_llr": 2.71150,
    "cam_clear_decay": 0.12399,
    "pir_rise_llr": 1.71109,
    "pir_latch_tau_sec": 12.26053,
    "spillover_discount": 0.52703,
    "handoff_drain_rate": 0.84380,
    "ekf_support_gain": 0.27203,
    "theta_enter": 0.61440,
    "hysteresis_gap": 0.10853,
}


def _sigmoid(x: float) -> float:
    if x >= 25.0:
        return 1.0
    if x <= -25.0:
        return 0.0
    return 1.0 / (1.0 + math.exp(-x))


def _logit(p: float) -> float:
    pc = max(1e-4, min(1.0 - 1e-4, p))
    return math.log(pc / (1.0 - pc))


def _eval_condition(
    raw_state: str | None,
    op: str,
    target: str,
    entity_id: str = "",
) -> bool:
    if raw_state is None:
        return False
    raw_s = str(raw_state).strip()
    raw_low = raw_s.lower()
    if raw_low in ("unavailable", "unknown"):
        return False
    tgt_s = str(target).strip()
    tgt_low = tgt_s.lower()
    if op == "equals":
        # LG webOS / HDMI displays report "on" (never "playing") when displaying an HDMI source.
        if entity_id.startswith("media_player.") and tgt_low == "playing":
            return raw_low in ("playing", "on")
        return raw_low == tgt_low
    if op == "not_equals":
        return raw_low != tgt_low
    if op == "in":
        candidates = [p.strip().lower() for p in tgt_s.split(",") if p.strip()]
        return raw_low in candidates
    if op == "greater_than":
        try:
            return float(raw_s) > float(tgt_s)
        except (TypeError, ValueError):
            return False
    if op == "less_than":
        try:
            return float(raw_s) < float(tgt_s)
        except (TypeError, ValueError):
            return False
    return False


def _classify_confidence_tier(prob: float) -> str:
    if prob >= 0.85:
        return "high_confidence"
    if prob >= 0.70:
        return "occupied"
    if prob >= 0.35:
        return "ambiguous"
    if prob >= 0.20:
        return "low"
    return "vacant"


@dataclass(frozen=True)
class SubZoneBinding:
    """Floorplan camera person sub-zone or whole-frame trigger bound to a room."""

    entity_id: str
    room: str
    camera_id: str
    floor: str
    is_sunlit: bool = False
    is_whole_frame: bool = False


@dataclass(frozen=True)
class PIRBinding:
    """Fast PIR motion sensor bound to a host room."""

    entity_id: str
    host_room: str
    floor: str
    is_pet_immune: bool = False
    model_preset: str = ""


@dataclass(frozen=True)
class RoomBeliefSnapshot:
    """Immutable per-room output of the Coupled Log-Odds HMM at one timestamp."""

    room_name: str
    probability: float
    probability_pct: float
    log_odds: float
    is_occupied: bool
    theta_enter: float
    theta_clear: float
    confidence_tier: str
    spillover_exposure: float
    recommended_lighting_threshold: float
    llm_ambiguity_active: bool
    ambiguity_dwell_sec: float
    sustaining_active: bool
    bounded_sealed: bool
    ekf_room_prob: float
    active_drivers: tuple[str, ...] = ()
    last_human_phys_age_sec: float = 999999.0


class HouseTopologyModel:
    """Precomputed floorplan sensor bindings, room graph, coverage, and PIR spillover matrix."""

    def __init__(
        self,
        floorplan: dict[str, Any],
        room_configs: dict[str, dict[str, Any]] | None = None,
    ) -> None:
        self.floorplan = floorplan
        self.room_configs: dict[str, dict[str, Any]] = {
            str(k): dict(v) for k, v in (room_configs or {}).items()
        }

        fp_rooms = [
            str(r["name"])
            for r in (floorplan.get("rooms") or [])
            if isinstance(r, dict) and r.get("name")
        ]
        # Track union of floorplan rooms and configured rooms (preserving order)
        ordered: list[str] = list(dict.fromkeys([*fp_rooms, *self.room_configs.keys()]))
        self.tracked_rooms: tuple[str, ...] = tuple(ordered)
        self.tracked_set: frozenset[str] = frozenset(self.tracked_rooms)

        self.room_floor: dict[str, str] = {}
        for r_box in floorplan.get("rooms") or []:
            if isinstance(r_box, dict) and r_box.get("name"):
                self.room_floor[str(r_box["name"])] = str(r_box.get("floor", "main"))
        for r in self.tracked_rooms:
            self.room_floor.setdefault(r, "main")

        # Graph adjacency from both room configs and floorplan connections
        adj: dict[str, set[str]] = {r: set() for r in self.tracked_rooms}
        for r, cfg in self.room_configs.items():
            for dst in cfg.get("connected_rooms") or []:
                dst_s = str(dst)
                if dst_s in self.tracked_set and dst_s != r:
                    adj[r].add(dst_s)
                    adj[dst_s].add(r)
        for conn in floorplan.get("connections") or []:
            if not isinstance(conn, dict):
                continue
            a = str(conn.get("from_room") or conn.get("from") or "")
            b = str(conn.get("to_room") or conn.get("to") or "")
            if a in self.tracked_set and b in self.tracked_set and a != b:
                adj[a].add(b)
                adj[b].add(a)
        self.connected_rooms: dict[str, tuple[str, ...]] = {
            r: tuple(sorted(adj[r])) for r in self.tracked_rooms
        }

        self.is_bounded_room: dict[str, bool] = {}
        for r in self.tracked_rooms:
            cfg = self.room_configs.get(r, {})
            mode_val = str(cfg.get("mode", "auto")).lower()
            if mode_val == "bounded":
                self.is_bounded_room[r] = True
            elif mode_val == "open":
                self.is_bounded_room[r] = False
            else:
                self.is_bounded_room[r] = bool(cfg.get("boundary_entities"))

        compiled = compile_floorplan_topology(floorplan)
        self.room_coverage: dict[str, dict[str, Any]] = compiled.get("room_coverage", {})
        self.pir_spillover: dict[str, dict[str, float]] = compute_pir_spillover_matrix(
            floorplan, min_overlap_pct=5.0
        )

        # Index cameras & Frigate sub-zones
        self.room_has_dedicated_camera: dict[str, bool] = {r: False for r in self.tracked_rooms}
        self.room_camera_subzones: dict[str, list[SubZoneBinding]] = {
            r: [] for r in self.tracked_rooms
        }
        seen_cam_eids: dict[str, set[str]] = {r: set() for r in self.tracked_rooms}

        for cam in floorplan.get("cameras") or []:
            if not isinstance(cam, dict):
                continue
            cam_id = str(cam.get("id", ""))
            host = str(cam.get("host_room", ""))
            fl = str(cam.get("floor", "main"))
            if host in self.room_has_dedicated_camera:
                self.room_has_dedicated_camera[host] = True

            for sz in cam.get("sub_zones") or []:
                if not isinstance(sz, dict):
                    continue
                eid = str(sz.get("entity_id", ""))
                sz_room = str(sz.get("room") or host)
                if not eid or sz_room not in self.tracked_set:
                    continue
                spec = SubZoneBinding(
                    entity_id=eid,
                    room=sz_room,
                    camera_id=cam_id,
                    floor=fl,
                    is_sunlit=(eid in SUNLIT_STATIC_SUBZONES or sz_room in ROOM_SHADE_ENTITIES),
                    is_whole_frame=False,
                )
                self.room_camera_subzones[sz_room].append(spec)
                seen_cam_eids[sz_room].add(eid)

        # Include whole-frame primary camera triggers (e.g., Storage Room)
        wf_to_cam = {v: k for k, v in CAMERA_WHOLE_FRAME_ENTITY.items()}
        for r, cfg in self.room_configs.items():
            if r not in self.tracked_set:
                continue
            for eid in cfg.get("trigger_entities") or []:
                eid_s = str(eid)
                if eid_s in wf_to_cam and eid_s not in seen_cam_eids[r]:
                    cid = wf_to_cam[eid_s]
                    spec = SubZoneBinding(
                        entity_id=eid_s,
                        room=r,
                        camera_id=cid,
                        floor=self.room_floor.get(r, "main"),
                        is_sunlit=(r in ROOM_SHADE_ENTITIES),
                        is_whole_frame=True,
                    )
                    self.room_camera_subzones[r].append(spec)
                    seen_cam_eids[r].add(eid_s)

        # Index fast PIRs, Ecobee sensors, door contacts, sustaining conditions, dogs, shades
        self.room_fast_pirs: dict[str, list[PIRBinding]] = {r: [] for r in self.tracked_rooms}
        self.room_door_contacts: dict[str, list[str]] = {r: [] for r in self.tracked_rooms}
        self.door_connected_rooms: dict[str, tuple[str, ...]] = {}
        self.room_ecobee_motion: dict[str, list[str]] = {r: [] for r in self.tracked_rooms}
        self.room_ecobee_occupancy: dict[str, list[str]] = {r: [] for r in self.tracked_rooms}

        for sen in floorplan.get("sensors") or []:
            if not isinstance(sen, dict):
                continue
            eid = str(sen.get("entity_id", ""))
            if not eid:
                continue
            stype = str(sen.get("sensor_type", "pir_motion"))
            host = str(sen.get("host_room", ""))
            fl = str(sen.get("floor", "main"))
            if stype == "door_contact":
                if eid.startswith("binary_sensor.") and host in self.room_door_contacts:
                    if eid not in self.room_door_contacts[host]:
                        self.room_door_contacts[host].append(eid)
                continue
            if eid in ECOBEE_MOTION_ENTITIES:
                if host in self.room_ecobee_motion and eid not in self.room_ecobee_motion[host]:
                    self.room_ecobee_motion[host].append(eid)
                    occ_eid = eid.replace("_motion", "_occupancy")
                    if occ_eid in ECOBEE_OCCUPANCY_ENTITIES:
                        self.room_ecobee_occupancy[host].append(occ_eid)
                continue
            preset = str(sen.get("model_preset") or "")
            pspec = PIRBinding(
                entity_id=eid,
                host_room=host,
                floor=fl,
                is_pet_immune=(preset == "ring_alarm_pir_gen2"),
                model_preset=preset,
            )
            if host in self.room_fast_pirs:
                self.room_fast_pirs[host].append(pspec)

        # Boundary entities and Ecobee observations declared in room configs
        for r, cfg in self.room_configs.items():
            if r not in self.tracked_set:
                continue
            for beid in cfg.get("boundary_entities") or []:
                beid_s = str(beid)
                if beid_s.startswith("binary_sensor."):
                    self.door_connected_rooms[beid_s] = tuple(
                        sorted(set(self.door_connected_rooms.get(beid_s, ())) | {r})
                    )
                    if beid_s not in self.room_door_contacts[r]:
                        self.room_door_contacts[r].append(beid_s)
            for obs in cfg.get("bayesian_observations") or []:
                if not isinstance(obs, dict):
                    continue
                oeid = str(obs.get("entity_id", ""))
                if oeid in ECOBEE_MOTION_ENTITIES and oeid not in self.room_ecobee_motion[r]:
                    self.room_ecobee_motion[r].append(oeid)
                if oeid in ECOBEE_OCCUPANCY_ENTITIES and oeid not in self.room_ecobee_occupancy[r]:
                    self.room_ecobee_occupancy[r].append(oeid)

        self.room_sustaining: dict[str, tuple[dict[str, Any], ...]] = {
            r: tuple(self.room_configs.get(r, {}).get("sustaining_conditions") or ())
            for r in self.tracked_rooms
        }
        self.room_dog_entities: dict[str, tuple[str, ...]] = {
            r: tuple(ROOM_DOG_OCCUPANCY_ENTITIES.get(r, ())) for r in self.tracked_rooms
        }
        self.room_shade_entities: dict[str, tuple[str, ...]] = {
            r: tuple(ROOM_SHADE_ENTITIES.get(r, ())) for r in self.tracked_rooms
        }

        # Per-room spillover exposure for automation confidence recommendations
        self.room_spillover_exposure: dict[str, float] = {r: 0.0 for r in self.tracked_rooms}
        for r in self.tracked_rooms:
            max_exp = 0.0
            for pir in self.room_fast_pirs[r]:
                for frac in self.pir_spillover.get(pir.entity_id, {}).values():
                    max_exp = max(max_exp, float(frac))
            self.room_spillover_exposure[r] = round(max_exp, 3)

        # Collect all watched entity IDs so edge tracking stays fast and bounded
        watched: set[str] = set()
        for r in self.tracked_rooms:
            for sz in self.room_camera_subzones[r]:
                watched.add(sz.entity_id)
            for pir in self.room_fast_pirs[r]:
                watched.add(pir.entity_id)
            watched.update(self.room_door_contacts[r])
            watched.update(self.room_ecobee_motion[r])
            watched.update(self.room_ecobee_occupancy[r])
            watched.update(self.room_dog_entities[r])
            watched.update(self.room_shade_entities[r])
            for cond in self.room_sustaining[r]:
                if cond.get("entity_id"):
                    watched.add(str(cond["entity_id"]))
        self.watched_entities: tuple[str, ...] = tuple(sorted(watched))


@dataclass
class HouseHMMEngine:
    """House-wide 1 Hz Coupled Continuous-Time Log-Odds HMM inference engine."""

    topology: HouseTopologyModel
    params: dict[str, float] = field(default_factory=lambda: dict(DEFAULT_HMM_PARAMS))

    log_odds: dict[str, float] = field(init=False)
    occupied: dict[str, bool] = field(init=False)
    entered_at: dict[str, float] = field(init=False)
    last_human_phys_ts: dict[str, float] = field(init=False)
    cam_active_ever: dict[str, bool] = field(init=False)
    last_fresh_trigger_ts: dict[str, float] = field(init=False)
    ambiguity_dwell_sec: dict[str, float] = field(init=False)

    _prev_states: dict[str, str] = field(default_factory=dict, init=False)
    _last_rise_ts: dict[str, float] = field(default_factory=dict, init=False)
    _last_dog_ts: dict[str, float] = field(default_factory=dict, init=False)
    _last_shade_move_ts: dict[str, float] = field(default_factory=dict, init=False)
    _last_door_open_ts: dict[str, float] = field(default_factory=dict, init=False)
    _last_decay_ts: float | None = field(default=None, init=False)
    _applied_sec_bucket: dict[tuple[str, str], int] = field(default_factory=dict, init=False)
    _snapshots: dict[str, RoomBeliefSnapshot] = field(default_factory=dict, init=False)

    def __post_init__(self) -> None:
        merged = dict(DEFAULT_HMM_PARAMS)
        merged.update(self.params or {})
        self.params = merged
        rooms = self.topology.tracked_rooms
        self.log_odds = {r: _L_PRIOR for r in rooms}
        self.occupied = {r: False for r in rooms}
        self.entered_at = {r: -1e9 for r in rooms}
        self.last_human_phys_ts = {r: -1e9 for r in rooms}
        self.cam_active_ever = {r: False for r in rooms}
        self.last_fresh_trigger_ts = {r: -1e9 for r in rooms}
        self.ambiguity_dwell_sec = {r: 0.0 for r in rooms}

    def get_snapshot(self, room_name: str) -> RoomBeliefSnapshot | None:
        """Return latest belief snapshot for a room."""
        return self._snapshots.get(room_name)

    def _rise_age(self, eid: str, now_ts: float) -> float:
        rt = self._last_rise_ts.get(eid)
        return 999999.0 if rt is None else max(0.0, now_ts - rt)

    def _is_pet_active(
        self,
        room: str,
        now_ts: float,
        window_sec: float = 18.0,
        *,
        pir_entity_id: str | None = None,
    ) -> bool:
        dt = self._last_dog_ts.get(room)
        if dt is not None and (now_ts - dt) <= window_sec:
            return True
        if pir_entity_id:
            for sp_room in self.topology.pir_spillover.get(pir_entity_id, ()):
                sdt = self._last_dog_ts.get(sp_room)
                if sdt is not None and (now_ts - sdt) <= window_sec:
                    return True
        return False

    def _is_any_open_plan_pet_active(self, now_ts: float, window_sec: float = 18.0) -> bool:
        for r in ("Dining Room", "Living Room", "Kitchen", "Family Room"):
            if self._is_pet_active(r, now_ts, window_sec=window_sec):
                return True
        return False

    def _is_shade_settling(self, room: str, now_ts: float, window_sec: float = 180.0) -> bool:
        st = self._last_shade_move_ts.get(room)
        return st is not None and (now_ts - st) <= window_sec

    def _is_door_opened_recently(self, room: str, now_ts: float, after_ts: float) -> bool:
        dt = self._last_door_open_ts.get(room)
        return dt is not None and after_ts <= dt <= now_ts

    def _is_camera_clear(self, room: str, states: dict[str, str]) -> bool:
        if not self.topology.room_has_dedicated_camera.get(room, False):
            return False
        for sz in self.topology.room_camera_subzones.get(room, ()):
            if states.get(sz.entity_id) == "on":
                return False
        return True

    def _extract_ekf_room_probs(
        self,
        ekf_tracks: dict[str, dict[str, Any]] | None,
    ) -> tuple[bool, dict[str, tuple[float, float]]]:
        """Extract (initialized, {room: (p_ekf, conf_factor)}) from HouseEKFManager tracks."""
        rooms = self.topology.tracked_rooms
        if not isinstance(ekf_tracks, dict) or not ekf_tracks:
            return False, {r: (0.0, 0.0) for r in rooms}

        # Pick the most confident active track (primary phone tracker)
        best_tr: dict[str, Any] | None = None
        for tr in ekf_tracks.values():
            if isinstance(tr, dict) and tr.get("floor"):
                best_tr = tr
                break
        if best_tr is None:
            return False, {r: (0.0, 0.0) for r in rooms}

        sigma = max(
            float(best_tr.get("sigma_x_ft", 10.0) or 10.0),
            float(best_tr.get("sigma_y_ft", 10.0) or 10.0),
        )
        conf = max(0.15, min(1.0, 1.0 / (1.0 + max(0.0, sigma - 3.0) / 6.0)))
        tr_floor = str(best_tr.get("floor", ""))
        rprobs = best_tr.get("room_probabilities") or {}
        out: dict[str, tuple[float, float]] = {}
        for r in rooms:
            if self.topology.room_floor.get(r) != tr_floor:
                out[r] = (0.0, conf)
            else:
                out[r] = (float(rprobs.get(r, 0.0)), conf)
        return True, out

    def step(
        self,
        *,
        now_ts: float,
        state_getter: Callable[[str], str | None],
        ekf_tracks: dict[str, dict[str, Any]] | None = None,
        guest_mode_enabled: bool = False,
        cam_rejected_rooms: set[str] | None = None,
    ) -> dict[str, RoomBeliefSnapshot]:
        """Advance house-wide HMM belief state and return updated per-room snapshots.

        Safe to call both on 1 Hz ticks and on mid-second state-change events:
        - Continuous-time decay, clear-camera drain, and EKF drift run once per >=0.95s step.
        - Newly risen camera/PIR/door edges are applied immediately (at most once per second
          bucket) so fast PIR/camera triggers incur zero latency.
        """
        topo = self.topology
        rooms = topo.tracked_rooms
        p = self.params
        sec_bucket = int(math.floor(now_ts))
        rejected = cam_rejected_rooms or set()

        # 0) Sample current watched entity states & update edge clocks
        states: dict[str, str] = {}
        for eid in topo.watched_entities:
            raw = state_getter(eid)
            val = str(raw).strip().lower() if raw is not None else "off"
            states[eid] = val
            prev = self._prev_states.get(eid)
            if val == "on" and prev != "on":
                self._last_rise_ts[eid] = now_ts
        self._prev_states = states

        for r in rooms:
            for deid in topo.room_dog_entities[r]:
                if states.get(deid) == "on":
                    self._last_dog_ts[r] = now_ts
            for seid in topo.room_shade_entities[r]:
                if states.get(seid) in ("moving", "opening", "closing"):
                    self._last_shade_move_ts[r] = now_ts
            for d_eid in topo.room_door_contacts[r]:
                if states.get(d_eid) in ("on", "open"):
                    self._last_door_open_ts[r] = now_ts

        # Determine whether to advance the atomic 1 Hz coupled predict+update+decay step.
        # Mid-second event arrivals (dt < 0.95s) capture edge clocks above without mutating
        # log_odds out-of-phase with continuous-time decay, preventing un-decayed phantom latches.
        if self._last_decay_ts is None:
            dt = 1.0
            self._last_decay_ts = now_ts
        else:
            raw_dt = now_ts - self._last_decay_ts
            if raw_dt < 0.95:
                return dict(self._snapshots)
            dt = min(5.0, max(1.0, round(raw_dt)))
            self._last_decay_ts = now_ts

        theta_enter = float(p["theta_enter"])
        theta_clear = max(0.25, min(theta_enter - 0.06, theta_enter - float(p["hysteresis_gap"])))
        l_support_cap = _logit(max(0.30, theta_enter - 0.12))

        base_hazard = float(p["base_exit_hazard"])
        transit_mult = float(p["transit_hazard_mult"])
        sustain_mult = float(p["sustain_hazard_mult"])
        cam_llr = float(p["cam_subzone_llr"])
        clear_decay = float(p["cam_clear_decay"])
        pir_llr = float(p["pir_rise_llr"])
        pir_tau = max(1.0, float(p["pir_latch_tau_sec"]))
        spill_disc = float(p["spillover_discount"])
        handoff_drain = float(p["handoff_drain_rate"])
        ekf_gain = float(p["ekf_support_gain"])

        ekf_init, ekf_probs = self._extract_ekf_room_probs(
            None if guest_mode_enabled else ekf_tracks
        )

        fresh_human_room: dict[str, bool] = {r: False for r in rooms}
        cam_active_room: dict[str, bool] = {r: False for r in rooms}
        sustained_room: dict[str, bool] = {r: False for r in rooms}
        bounded_sealed: dict[str, bool] = {r: False for r in rooms}
        active_drivers: dict[str, list[str]] = {r: [] for r in rooms}

        for r in rooms:
            sust = False
            for cond in topo.room_sustaining.get(r, ()):
                eid = str(cond.get("entity_id", ""))
                op = str(cond.get("operator", "equals"))
                target = str(cond.get("state", ""))
                if _eval_condition(state_getter(eid), op, target, entity_id=eid):
                    sust = True
                    active_drivers[r].append(f"sustain:{eid}")
                    break
            if (
                topo.is_bounded_room[r]
                and self.occupied[r]
                and self.cam_active_ever[r]
                and ekf_init
            ):
                nb_fresh_other = any(
                    (now_ts - self.last_fresh_trigger_ts[nb]) <= 4.0
                    and not self._is_camera_clear(nb, states)
                    for nb in topo.connected_rooms[r]
                )
                cam_exit = self._is_camera_clear(r, states) and nb_fresh_other
                if not cam_exit and not self._is_door_opened_recently(
                    r, now_ts, self.entered_at[r] + 8.0
                ):
                    sust = True
                    bounded_sealed[r] = True
                    active_drivers[r].append("bounded_seal")
            sustained_room[r] = sust

        # 1) Camera sub-zone likelihoods (shade-conditioned, deduplicated per second bucket)
        for r in rooms:
            if r in rejected:
                continue
            shade_settling = self._is_shade_settling(r, now_ts, window_sec=180.0)
            has_pir_on = any(states.get(pir.entity_id) == "on" for pir in topo.room_fast_pirs[r])
            has_door_recent = any(
                self._rise_age(deid, now_ts) <= 15.0 for deid in topo.room_door_contacts[r]
            )
            p_ekf_r, _ = ekf_probs[r]
            has_corrob = has_pir_on or has_door_recent or p_ekf_r >= 0.35

            active_szs = [
                sz for sz in topo.room_camera_subzones[r] if states.get(sz.entity_id) == "on"
            ]
            if active_szs:
                if shade_settling and not self.occupied[r] and not has_corrob:
                    continue
                cam_active_room[r] = True
                self.cam_active_ever[r] = True
                self.last_human_phys_ts[r] = now_ts
                best_age = min(self._rise_age(sz.entity_id, now_ts) for sz in active_szs)
                active_drivers[r].append(f"cam:{active_szs[0].entity_id}")

                key = (f"__cam__{r}", r)
                if self._applied_sec_bucket.get(key) != sec_bucket:
                    self._applied_sec_bucket[key] = sec_bucket
                    gain = cam_llr if best_age <= 2.0 else 0.35 * cam_llr
                    adj_boost = (
                        0.45
                        if any(
                            self.occupied[nb] or (now_ts - self.last_fresh_trigger_ts[nb]) <= 12.0
                            for nb in topo.connected_rooms[r]
                        )
                        else 0.0
                    )
                    self.log_odds[r] += gain + adj_boost
                if best_age <= 1.0:
                    fresh_human_room[r] = True
                    self.last_fresh_trigger_ts[r] = now_ts

        # 2) Fast PIR likelihoods (exponential latch decay, pet & spillover conditioning)
        for r in rooms:
            p_ekf_r, _ = ekf_probs[r]
            for pir in topo.room_fast_pirs[r]:
                if states.get(pir.entity_id) != "on":
                    continue
                age = self._rise_age(pir.entity_id, now_ts)
                if age > 25.0:
                    continue
                pet_here = self._is_pet_active(
                    r, now_ts, window_sec=18.0, pir_entity_id=pir.entity_id
                ) or (
                    r in OPEN_PLAN_MAIN_ROOMS
                    and self._is_any_open_plan_pet_active(now_ts, window_sec=12.0)
                    and not any(cam_active_room.get(oroom, False) for oroom in OPEN_PLAN_MAIN_ROOMS)
                    and p_ekf_r < 0.25
                )
                if not pir.is_pet_immune and pet_here and not cam_active_room[r]:
                    continue

                nb_active = any(
                    self.occupied[nb] or (now_ts - self.last_fresh_trigger_ts[nb]) <= 20.0
                    for nb in topo.connected_rooms[r]
                )
                ekf_room_ok = ekf_init and p_ekf_r >= 0.15
                door_recent = self._is_door_opened_recently(r, now_ts, now_ts - 15.0) and (
                    ekf_init or not self._is_any_open_plan_pet_active(now_ts, window_sec=12.0)
                )
                pir_corroborated = (
                    self.occupied[r]
                    or cam_active_room[r]
                    or nb_active
                    or ekf_room_ok
                    or door_recent
                    or guest_mode_enabled
                )
                if not pir_corroborated:
                    continue

                w_latch = math.exp(-age / pir_tau)

                atten = 1.0
                spills = topo.pir_spillover.get(pir.entity_id, {})
                if spills and not cam_active_room[r]:
                    spill_pressure = 0.0
                    for sp_room, ov_frac in spills.items():
                        sp_recent = (
                            (now_ts - self.last_fresh_trigger_ts.get(sp_room, -1e9)) <= 20.0
                            or self.occupied.get(sp_room, False)
                            or (
                                sp_room in TRANSIT_ROOMS
                                and any(
                                    (now_ts - self.last_fresh_trigger_ts.get(nb, -1e9)) <= 15.0
                                    for nb in topo.connected_rooms.get(sp_room, ())
                                    if nb != r
                                )
                            )
                        )
                        if sp_recent:
                            spill_pressure += ov_frac
                    if spill_pressure > 0.0:
                        atten = max(0.05, 1.0 - spill_disc * spill_pressure)

                if atten >= 0.45 and w_latch >= 0.35:
                    self.last_human_phys_ts[r] = now_ts
                    if age <= 1.0:
                        fresh_human_room[r] = True
                        self.last_fresh_trigger_ts[r] = now_ts
                elif self.occupied[r] and atten >= 0.25:
                    self.last_human_phys_ts[r] = now_ts

                active_drivers[r].append(f"pir:{pir.entity_id}")
                key = (pir.entity_id, r)
                if self._applied_sec_bucket.get(key) != sec_bucket:
                    self._applied_sec_bucket[key] = sec_bucket
                    step_llr = pir_llr * (0.45 if age > 1.0 else 1.15) * w_latch * atten
                    if nb_active and age <= 1.0 and atten >= 0.65:
                        step_llr += 0.85
                    self.log_odds[r] += step_llr

        # 3) Door contacts (entry boost to connected rooms when not pure pet noise)
        door_human_ok = ekf_init or not self._is_any_open_plan_pet_active(now_ts, window_sec=12.0)
        if door_human_ok:
            for deid, drooms in topo.door_connected_rooms.items():
                if states.get(deid) in ("on", "open") and self._rise_age(deid, now_ts) <= 1.0:
                    for dr in drooms:
                        if dr in self.log_odds:
                            key = (deid, dr)
                            if self._applied_sec_bucket.get(key) != sec_bucket:
                                self._applied_sec_bucket[key] = sec_bucket
                                self.log_odds[dr] += 0.9
                            self.last_human_phys_ts[dr] = now_ts
                            active_drivers[dr].append(f"door:{deid}")

        # 4) Continuous-time hazard decay, clear-camera negative space & graph coupling
        next_log_odds: dict[str, float] = {}
        for r in rooms:
            cur_l = self.log_odds[r]
            p_ekf_r, ekf_conf = ekf_probs[r]
            sust = sustained_room[r]

            h = base_hazard
            if r in TRANSIT_ROOMS:
                h *= transit_mult
            elif r in SLEEP_BATH_ROOMS:
                h *= 0.65
            elif r in EXTERIOR_BIRTH_ROOMS and not self.occupied[r]:
                h *= 0.9

            ecobee_on = any(states.get(eid) == "on" for eid in topo.room_ecobee_motion[r]) or any(
                states.get(eid) == "on" for eid in topo.room_ecobee_occupancy[r]
            )
            ekf_confirming = p_ekf_r >= 0.40 and ekf_conf >= 0.25
            other_room_active = any(
                cam_active_room.get(other, False)
                or (now_ts - self.last_fresh_trigger_ts[other]) <= 60.0
                for other in rooms
                if other != r
            )
            ekf_stationary_hold = (
                self.occupied[r]
                and r not in TRANSIT_ROOMS
                and p_ekf_r >= 0.70
                and ekf_conf >= 0.30
                and not other_room_active
            )
            if sust or ekf_stationary_hold or (self.occupied[r] and ekf_confirming and ecobee_on):
                h *= sustain_mult

            cur_l += h * (_L_PRIOR - cur_l) * 3.5 * dt

            if ecobee_on and _sigmoid(cur_l) >= 0.25 and not bounded_sealed[r]:
                eco_m_on = any(states.get(eid) == "on" for eid in topo.room_ecobee_motion[r])
                cur_l += (0.08 if eco_m_on else 0.025) * dt
                active_drivers[r].append("ecobee_sustain")

            cov_pct = float(topo.room_coverage.get(r, {}).get("max_coverage_pct", 0.0))
            if cov_pct > 0.0 and self._is_camera_clear(r, states) and cur_l > _L_PRIOR:
                neg_mult = 1.0
                if sust or ekf_stationary_hold or (ekf_confirming and ecobee_on):
                    neg_mult = 0.08
                elif ekf_confirming and r not in TRANSIT_ROOMS and not other_room_active:
                    neg_mult = 0.35
                cur_l -= clear_decay * (cov_pct / 100.0) * neg_mult * dt

            if (
                not cam_active_room[r]
                and not sust
                and (now_ts - self.last_fresh_trigger_ts[r]) >= 5.0
            ):
                nb_fresh = any(
                    fresh_human_room[nb]
                    or (
                        (now_ts - self.last_fresh_trigger_ts[nb]) <= 3.0
                        and (p_ekf_r < 0.25 or ekf_probs[nb][0] > p_ekf_r)
                    )
                    for nb in topo.connected_rooms[r]
                )
                if nb_fresh:
                    hkey = (f"__handoff__{r}", r)
                    if self._applied_sec_bucket.get(hkey) != sec_bucket:
                        self._applied_sec_bucket[hkey] = sec_bucket
                        cur_l -= handoff_drain * dt

            if ekf_init:
                signed = (2.0 * p_ekf_r - 1.0) * ekf_conf
                if signed < 0.0 and (cam_active_room[r] or sust):
                    signed *= 0.12
                cur_l += ekf_gain * signed * dt
                if p_ekf_r >= 0.35:
                    active_drivers[r].append(f"ekf:{round(p_ekf_r * 100)}%")

            cur_l = max(_L_MIN, min(_L_MAX, cur_l))
            if (now_ts - self.last_human_phys_ts[r]) > 300.0 and not self.occupied[r]:
                cur_l = min(cur_l, l_support_cap)

            next_log_odds[r] = cur_l

        self.log_odds = next_log_odds

        # 5) Schmitt Hysteresis & Snapshot Emission
        snapshots: dict[str, RoomBeliefSnapshot] = {}
        for r in rooms:
            prob = _sigmoid(self.log_odds[r])
            phys_age = max(0.0, now_ts - self.last_human_phys_ts[r])
            if not self.occupied[r]:
                if prob >= theta_enter and phys_age <= 15.0:
                    self.occupied[r] = True
                    self.entered_at[r] = now_ts
            else:
                if prob <= theta_clear and (now_ts - self.entered_at[r]) >= 3.0:
                    self.occupied[r] = False

            if 0.35 <= prob <= 0.70:
                self.ambiguity_dwell_sec[r] += dt
            else:
                self.ambiguity_dwell_sec[r] = 0.0

            spill_exp = topo.room_spillover_exposure.get(r, 0.0)
            cfg_thresh = topo.room_configs.get(r, {}).get("lighting_confidence_threshold")
            if cfg_thresh is not None:
                rec_thresh = float(cfg_thresh)
            elif spill_exp >= 0.20:
                rec_thresh = max(theta_enter, 0.80)
            elif spill_exp >= 0.08:
                rec_thresh = max(theta_enter, 0.72)
            else:
                rec_thresh = theta_enter

            p_ekf_r, _ = ekf_probs[r]
            snapshots[r] = RoomBeliefSnapshot(
                room_name=r,
                probability=round(prob, 5),
                probability_pct=round(prob * 100.0, 1),
                log_odds=round(self.log_odds[r], 4),
                is_occupied=bool(self.occupied[r]),
                theta_enter=round(theta_enter, 4),
                theta_clear=round(theta_clear, 4),
                confidence_tier=_classify_confidence_tier(prob),
                spillover_exposure=spill_exp,
                recommended_lighting_threshold=round(rec_thresh, 4),
                llm_ambiguity_active=bool(self.ambiguity_dwell_sec[r] >= 5.0),
                ambiguity_dwell_sec=round(self.ambiguity_dwell_sec[r], 1),
                sustaining_active=bool(sustained_room[r]),
                bounded_sealed=bool(bounded_sealed[r]),
                ekf_room_prob=round(p_ekf_r, 4),
                active_drivers=tuple(dict.fromkeys(active_drivers[r])),
                last_human_phys_age_sec=round(phys_age, 1),
            )

        self._snapshots = snapshots
        return snapshots
