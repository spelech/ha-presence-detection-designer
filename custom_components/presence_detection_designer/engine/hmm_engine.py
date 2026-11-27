"""Coupled Continuous-Time Log-Odds HMM / Dynamic Bayesian Network Inference Engine."""

from __future__ import annotations

import math
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

from .hmm_topology import (
    _L_MAX,
    _L_MIN,
    _L_PRIOR,
    DEFAULT_HMM_PARAMS,
    EXTERIOR_BIRTH_ROOMS,
    OPEN_PLAN_MAIN_ROOMS,
    SLEEP_BATH_ROOMS,
    TRANSIT_ROOMS,
    HouseTopologyModel,
    PIRBinding,
    RoomBeliefSnapshot,
    SubZoneBinding,
    _eval_condition,
    _logit,
    _sigmoid,
    build_room_belief_snapshot,
    extract_ekf_room_probs,
)

__all__ = [
    "DEFAULT_HMM_PARAMS",
    "EXTERIOR_BIRTH_ROOMS",
    "OPEN_PLAN_MAIN_ROOMS",
    "SLEEP_BATH_ROOMS",
    "TRANSIT_ROOMS",
    "HouseHMMEngine",
    "HouseTopologyModel",
    "PIRBinding",
    "RoomBeliefSnapshot",
    "SubZoneBinding",
]


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

        ekf_init, ekf_probs = extract_ekf_room_probs(
            self.topology, None if guest_mode_enabled else ekf_tracks
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

            p_ekf_r, _ = ekf_probs[r]
            snapshots[r] = build_room_belief_snapshot(
                topo,
                r,
                prob=prob,
                log_odds=self.log_odds[r],
                is_occupied=self.occupied[r],
                theta_enter=theta_enter,
                theta_clear=theta_clear,
                ambiguity_dwell_sec=self.ambiguity_dwell_sec[r],
                sustaining_active=sustained_room[r],
                bounded_sealed=bounded_sealed[r],
                ekf_room_prob=p_ekf_r,
                active_drivers=active_drivers[r],
                phys_age=phys_age,
            )

        self._snapshots = snapshots
        return snapshots
