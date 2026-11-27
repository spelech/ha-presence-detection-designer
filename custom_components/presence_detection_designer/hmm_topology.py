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
from dataclasses import dataclass
from typing import Any

from .sensor_reliability import (
    ECOBEE_MOTION_ENTITIES,
    ECOBEE_OCCUPANCY_ENTITIES,
    classify_sensor_reliability,
    is_camera_entity,
)
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

        # Include camera triggers declared in room configs (whole-frame or custom sub-zones)
        wf_to_cam = {v: k for k, v in CAMERA_WHOLE_FRAME_ENTITY.items()}
        for r, cfg in self.room_configs.items():
            if r not in self.tracked_set:
                continue
            for eid in cfg.get("trigger_entities") or []:
                eid_s = str(eid)
                if not eid_s or eid_s in seen_cam_eids[r]:
                    continue
                if eid_s in wf_to_cam or is_camera_entity(eid_s):
                    cid = wf_to_cam.get(eid_s, eid_s)
                    spec = SubZoneBinding(
                        entity_id=eid_s,
                        room=r,
                        camera_id=cid,
                        floor=self.room_floor.get(r, "main"),
                        is_sunlit=(r in ROOM_SHADE_ENTITIES),
                        is_whole_frame=(eid_s in wf_to_cam),
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

        # Boundary entities, custom PIR triggers, and Ecobee observations declared in room configs
        seen_pir_eids: dict[str, set[str]] = {
            r: {p.entity_id for p in pirs} for r, pirs in self.room_fast_pirs.items()
        }
        for r, cfg in self.room_configs.items():
            if r not in self.tracked_set:
                continue
            for eid in cfg.get("trigger_entities") or []:
                eid_s = str(eid)
                if (
                    not eid_s
                    or eid_s in seen_cam_eids[r]
                    or eid_s in seen_pir_eids[r]
                    or eid_s in ECOBEE_MOTION_ENTITIES
                ):
                    continue
                if classify_sensor_reliability(eid_s).is_human_exclusive:
                    self.room_fast_pirs[r].append(
                        PIRBinding(
                            entity_id=eid_s,
                            host_room=r,
                            floor=self.room_floor.get(r, "main"),
                            is_pet_immune=False,
                            model_preset="",
                        )
                    )
                    seen_pir_eids[r].add(eid_s)
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


def extract_ekf_room_probs(
    topology: HouseTopologyModel,
    ekf_tracks: dict[str, dict[str, Any]] | None,
) -> tuple[bool, dict[str, tuple[float, float]]]:
    """Extract (initialized, {room: (p_ekf, conf_factor)}) from HouseEKFManager tracks."""
    rooms = topology.tracked_rooms
    if not isinstance(ekf_tracks, dict) or not ekf_tracks:
        return False, {r: (0.0, 0.0) for r in rooms}
    best_tr = next(
        (tr for tr in ekf_tracks.values() if isinstance(tr, dict) and tr.get("floor")),
        None,
    )
    if best_tr is None:
        return False, {r: (0.0, 0.0) for r in rooms}
    sigma = max(
        float(best_tr.get("sigma_x_ft", 10.0) or 10.0),
        float(best_tr.get("sigma_y_ft", 10.0) or 10.0),
    )
    conf = max(0.15, min(1.0, 1.0 / (1.0 + max(0.0, sigma - 3.0) / 6.0)))
    tr_floor = str(best_tr.get("floor", ""))
    rprobs = best_tr.get("room_probabilities") or {}
    out = {
        r: (float(rprobs.get(r, 0.0)), conf)
        if topology.room_floor.get(r) == tr_floor
        else (0.0, conf)
        for r in rooms
    }
    return True, out
