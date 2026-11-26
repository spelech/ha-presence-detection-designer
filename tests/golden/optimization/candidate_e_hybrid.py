"""Candidate E: Hybrid Coupled Log-Odds HMM + HSMM Weibull Dwell Hazard + EKF-Heading Flow.

Combines:
- Candidate B's continuous-time log-odds recursive belief engine & Schmitt hysteresis
  (proven -99.1% FP and minimal room flapping).
- Candidate D's Duong (2005) Hidden Semi-Markov Model (HSMM) Weibull non-exponential
  dwell-time hazard (k_stay=0.72 for stationary persistence, k_transit=1.60 for rapid
  corridor clearance) and EKF-velocity-aligned neighbor handoff weighting.
"""

from __future__ import annotations

import math

from .dataset import ScenarioBundle
from .sensor_model import (
    EXTERIOR_BIRTH_ROOMS,
    SLEEP_BATH_ROOMS,
    TRANSIT_ROOMS,
    HouseTopologyIndex,
    SensorFrameState,
)

CANDIDATE_E_BOUNDS: dict[str, tuple[float, float, str]] = {
    "weibull_eta_stay": (35.0, 220.0, "log"),
    "weibull_eta_transit": (5.0, 32.0, "log"),
    "sustain_hazard_mult": (0.012, 0.22, "log"),
    "cam_subzone_llr": (2.2, 5.2, "linear"),
    "cam_clear_decay": (0.04, 0.55, "log"),
    "pir_rise_llr": (1.6, 4.6, "linear"),
    "pir_latch_tau_sec": (3.0, 20.0, "linear"),
    "spillover_discount": (0.4, 3.0, "linear"),
    "handoff_drain_rate": (0.25, 1.8, "linear"),
    "ekf_support_gain": (0.05, 0.45, "linear"),
    "ekf_heading_boost": (0.0, 1.2, "linear"),
    "theta_enter": (0.58, 0.85, "linear"),
    "hysteresis_gap": (0.08, 0.30, "linear"),
}

CANDIDATE_E_DEFAULTS: dict[str, float] = {
    "weibull_eta_stay": 95.0,
    "weibull_eta_transit": 11.0,
    "sustain_hazard_mult": 0.032,
    "cam_subzone_llr": 3.4,
    "cam_clear_decay": 0.13,
    "pir_rise_llr": 2.4,
    "pir_latch_tau_sec": 10.0,
    "spillover_discount": 0.95,
    "handoff_drain_rate": 0.85,
    "ekf_support_gain": 0.27,
    "ekf_heading_boost": 0.45,
    "theta_enter": 0.64,
    "hysteresis_gap": 0.16,
}

_K_STAY = 0.72
_K_TRANSIT = 1.60
_L_MIN = -4.8
_L_MAX = 4.6
_L_PRIOR = -2.44235  # logit(0.08)


def _sigmoid(x: float) -> float:
    if x >= 25.0:
        return 1.0
    if x <= -25.0:
        return 0.0
    return 1.0 / (1.0 + math.exp(-x))


def _logit(p: float) -> float:
    pc = max(1e-4, min(1.0 - 1e-4, p))
    return math.log(pc / (1.0 - pc))


def _weibull_hazard(tau: float, *, shape_k: float, scale_eta: float) -> float:
    """Instantaneous Weibull exit hazard h(tau) = (k/eta) * (tau/eta)^(k-1)."""
    t_eff = max(1.0, float(tau))
    eta = max(1.0, float(scale_eta))
    return min(1.2, max(1e-4, (shape_k / eta) * math.pow(t_eff / eta, shape_k - 1.0)))


class CandidateERunner:
    """Hybrid Coupled Continuous-Time Log-Odds HMM + Weibull HSMM Dwell + EKF Heading."""

    name = "E_Hybrid_HMM_Weibull"
    param_bounds = CANDIDATE_E_BOUNDS
    default_params = CANDIDATE_E_DEFAULTS

    def __init__(
        self, topology: HouseTopologyIndex, params: dict[str, float] | None = None
    ) -> None:
        self.topo = topology
        merged = dict(CANDIDATE_E_DEFAULTS)
        if params:
            merged.update(params)
        self.p = merged

    def run_timeline(self, bundle: ScenarioBundle) -> tuple[list[set[str]], list[dict[str, float]]]:
        """Step 1Hz hybrid HMM + Weibull HSMM inference and return (occupied, probs)."""
        topo = self.topo
        rooms = topo.tracked_rooms
        p = self.p
        tl = bundle.timeline

        theta_enter = float(p["theta_enter"])
        theta_clear = max(0.25, min(theta_enter - 0.06, theta_enter - float(p["hysteresis_gap"])))
        l_support_cap = _logit(max(0.30, theta_enter - 0.12))

        eta_stay = float(p["weibull_eta_stay"])
        eta_transit = float(p["weibull_eta_transit"])
        sustain_mult = float(p["sustain_hazard_mult"])
        cam_llr = float(p["cam_subzone_llr"])
        clear_decay = float(p["cam_clear_decay"])
        pir_llr = float(p["pir_rise_llr"])
        pir_tau = max(1.0, float(p["pir_latch_tau_sec"]))
        spill_disc = float(p["spillover_discount"])
        handoff_drain = float(p["handoff_drain_rate"])
        ekf_gain = float(p["ekf_support_gain"])
        heading_boost = float(p["ekf_heading_boost"])

        log_odds: dict[str, float] = {r: _L_PRIOR for r in rooms}
        dwell_tau: dict[str, float] = {r: 0.0 for r in rooms}
        occupied: dict[str, bool] = {r: False for r in rooms}
        entered_at: dict[str, int] = {r: -99999 for r in rooms}
        last_human_phys_t: dict[str, int] = {r: -99999 for r in rooms}
        cam_active_ever: dict[str, bool] = {r: False for r in rooms}
        last_fresh_trigger_t: dict[str, int] = {r: -99999 for r in rooms}

        obs_state = SensorFrameState(topology=topo)
        actual_timeline: list[set[str]] = []
        prob_timeline: list[dict[str, float]] = []

        for t in range(tl.duration_sec):
            updates = tl.initial_states if t == 0 else (bundle.events_by_t.get(t) or {})
            ble_ranges = tl.ble_ranges_by_t[t] if t < len(tl.ble_ranges_by_t) else []
            obs_state.step(t, updates, ble_ranges)

            ekf_est = obs_state.ekf_est
            ekf_probs = {r: obs_state.room_ekf_prob(r) for r in rooms}
            has_vel = ekf_est.initialized and ekf_est.speed_ft_s >= 0.45
            vx, vy = ekf_est.vx_px_s, ekf_est.vy_px_s
            v_norm = math.hypot(vx, vy)

            fresh_human_room: dict[str, bool] = {r: False for r in rooms}
            cam_active_room: dict[str, bool] = {r: False for r in rooms}
            sustained_room: dict[str, bool] = {r: False for r in rooms}
            bounded_sealed: dict[str, bool] = {r: False for r in rooms}

            for r in rooms:
                sust = obs_state.is_sustaining_active(r)
                if (
                    topo.is_bounded_room[r]
                    and occupied[r]
                    and cam_active_ever[r]
                    and ekf_est.initialized
                ):
                    nb_fresh_other = any(
                        (t - last_fresh_trigger_t[nb]) <= 4 and not obs_state.is_camera_clear(nb)
                        for nb in topo.connected_rooms[r]
                    )
                    cam_exit = obs_state.is_camera_clear(r) and nb_fresh_other
                    if not cam_exit and not obs_state.is_door_opened_recently(
                        r, t, entered_at[r] + 8
                    ):
                        sust = True
                        bounded_sealed[r] = True
                sustained_room[r] = sust

            # 1) Camera sub-zones (shade-conditioned + EKF heading entry prior)
            for r in rooms:
                shade_settling = obs_state.is_shade_settling(r, t, window_sec=180)
                has_pir_on = any(obs_state.is_on(pir.entity_id) for pir in topo.room_fast_pirs[r])
                has_door_recent = any(
                    obs_state.rise_age(deid, t) <= 15 for deid, _ in topo.room_door_contacts[r]
                )
                p_ekf_r, _ = ekf_probs[r]
                has_corrob = has_pir_on or has_door_recent or p_ekf_r >= 0.35

                active_szs = [
                    sz for sz in topo.room_camera_subzones[r] if obs_state.is_on(sz.entity_id)
                ]
                if active_szs:
                    if shade_settling and not occupied[r] and not has_corrob:
                        continue
                    cam_active_room[r] = True
                    cam_active_ever[r] = True
                    last_human_phys_t[r] = t
                    best_age = min(obs_state.rise_age(sz.entity_id, t) for sz in active_szs)
                    gain = cam_llr if best_age <= 2 else 0.35 * cam_llr
                    adj_boost = (
                        0.45
                        if any(
                            occupied[nb] or (t - last_fresh_trigger_t[nb]) <= 12
                            for nb in topo.connected_rooms[r]
                        )
                        else 0.0
                    )
                    log_odds[r] += gain + adj_boost
                    if best_age <= 1:
                        fresh_human_room[r] = True
                        last_fresh_trigger_t[r] = t

            # 2) Fast PIRs (topological corroboration, pet exclusion, spillover discount, heading boost)
            for r in rooms:
                p_ekf_r, _ = ekf_probs[r]
                crx, cry = topo.room_centroids[r]

                for pir in topo.room_fast_pirs[r]:
                    if not obs_state.is_on(pir.entity_id):
                        continue
                    age = obs_state.rise_age(pir.entity_id, t)
                    if age > 25:
                        continue
                    pet_here = obs_state.is_pet_active(
                        r, t, window_sec=18, pir_entity_id=pir.entity_id
                    ) or (
                        r in ("Dining Room", "Living Room", "Kitchen", "Family Room", "Front Entry")
                        and obs_state.is_any_open_plan_pet_active(t, window_sec=12)
                        and not any(
                            cam_active_room[oroom]
                            for oroom in (
                                "Dining Room",
                                "Living Room",
                                "Kitchen",
                                "Family Room",
                                "Front Entry",
                            )
                        )
                        and p_ekf_r < 0.25
                    )
                    if not pir.is_pet_immune and pet_here and not cam_active_room[r]:
                        continue

                    nb_active = any(
                        occupied[nb] or (t - last_fresh_trigger_t[nb]) <= 20
                        for nb in topo.connected_rooms[r]
                    )
                    ekf_room_ok = ekf_est.initialized and p_ekf_r >= 0.15
                    door_recent = obs_state.is_door_opened_recently(r, t, t - 15) and (
                        ekf_est.initialized
                        or not obs_state.is_any_open_plan_pet_active(t, window_sec=12)
                    )
                    pir_corroborated = (
                        occupied[r] or cam_active_room[r] or nb_active or ekf_room_ok or door_recent
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
                                (t - last_fresh_trigger_t.get(sp_room, -99999)) <= 20
                                or occupied.get(sp_room, False)
                                or (
                                    sp_room in TRANSIT_ROOMS
                                    and any(
                                        (t - last_fresh_trigger_t.get(nb, -99999)) <= 15
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
                        last_human_phys_t[r] = t
                        if age <= 1:
                            fresh_human_room[r] = True
                            last_fresh_trigger_t[r] = t
                    elif occupied[r] and atten >= 0.25:
                        last_human_phys_t[r] = t

                    step_llr = pir_llr * (0.45 if age > 1 else 1.15) * w_latch * atten
                    if nb_active and age <= 1 and atten >= 0.65:
                        step_llr += 0.85
                        # Extra EKF-velocity alignment boost if walking toward room r
                        if has_vel and v_norm > 1e-3 and topo.room_floor[r] == ekf_est.floor:
                            dx, dy = crx - ekf_est.x_px, cry - ekf_est.y_px
                            dn = math.hypot(dx, dy)
                            if dn > 1e-3:
                                cos_al = (dx * vx + dy * vy) / (dn * v_norm)
                                if cos_al > 0.25:
                                    step_llr += heading_boost * cos_al
                    log_odds[r] += step_llr

            # 3) Door contacts
            door_human_ok = ekf_est.initialized or not obs_state.is_any_open_plan_pet_active(
                t, window_sec=12
            )
            if door_human_ok:
                for deid, drooms in topo.door_connected_rooms.items():
                    if obs_state.is_on(deid) and obs_state.rise_age(deid, t) <= 1:
                        for dr in drooms:
                            if dr in log_odds:
                                log_odds[dr] += 0.9
                                last_human_phys_t[dr] = t

            # 4) Weibull HSMM Exit Hazard + EKF-Aligned Graph Handoff + Clear-Camera Negative Space
            next_log_odds: dict[str, float] = {}
            for r in rooms:
                cur_l = log_odds[r]
                p_ekf_r, ekf_conf = ekf_probs[r]
                sust = sustained_room[r]

                is_transit = r in TRANSIT_ROOMS
                if is_transit:
                    h = _weibull_hazard(dwell_tau[r], shape_k=_K_TRANSIT, scale_eta=eta_transit)
                else:
                    scale_r = eta_stay * 1.40 if r in SLEEP_BATH_ROOMS else eta_stay
                    h = _weibull_hazard(dwell_tau[r], shape_k=_K_STAY, scale_eta=scale_r)
                    if r in EXTERIOR_BIRTH_ROOMS and not occupied[r]:
                        h *= 0.9

                ecobee_on = any(obs_state.is_on(eid) for eid in topo.room_ecobee_motion[r]) or any(
                    obs_state.is_on(eid) for eid in topo.room_ecobee_occupancy[r]
                )
                ekf_confirming = p_ekf_r >= 0.40 and ekf_conf >= 0.25
                if sust or (occupied[r] and ekf_confirming and ecobee_on):
                    h *= sustain_mult

                # Non-exponential Weibull drift toward resting prior
                cur_l += h * (_L_PRIOR - cur_l) * 4.0

                if ecobee_on and _sigmoid(cur_l) >= 0.25 and not bounded_sealed[r]:
                    eco_m_on = any(obs_state.is_on(eid) for eid in topo.room_ecobee_motion[r])
                    cur_l += 0.08 if eco_m_on else 0.025

                cov_pct = float(topo.room_coverage[r].get("max_coverage_pct", 0.0))
                if cov_pct > 0.0 and obs_state.is_camera_clear(r) and cur_l > _L_PRIOR:
                    neg_mult = 1.0
                    if sust or (ekf_confirming and ecobee_on):
                        neg_mult = 0.08
                    elif ekf_confirming and not is_transit:
                        neg_mult = 0.35
                    cur_l -= clear_decay * (cov_pct / 100.0) * neg_mult

                # EKF-velocity-modulated competitive graph handoff drain
                if not cam_active_room[r] and not sust and (t - last_fresh_trigger_t[r]) >= 5:
                    crx, cry = topo.room_centroids[r]
                    max_align = 0.0
                    nb_triggered = False
                    for nb in topo.connected_rooms[r]:
                        if fresh_human_room[nb] or (
                            (t - last_fresh_trigger_t[nb]) <= 3
                            and (p_ekf_r < 0.25 or ekf_probs[nb][0] > p_ekf_r)
                        ):
                            nb_triggered = True
                            if has_vel and v_norm > 1e-3 and topo.room_floor[nb] == ekf_est.floor:
                                nbx, nby = topo.room_centroids[nb]
                                dx, dy = nbx - crx, nby - cry
                                dn = math.hypot(dx, dy)
                                if dn > 1e-3:
                                    max_align = max(max_align, (dx * vx + dy * vy) / (dn * v_norm))
                    if nb_triggered:
                        cur_l -= handoff_drain * (1.0 + 0.35 * max(0.0, max_align))

                # Supporting-only EKF drift
                if ekf_est.initialized:
                    signed = (2.0 * p_ekf_r - 1.0) * ekf_conf
                    if signed < 0.0 and (cam_active_room[r] or sust):
                        signed *= 0.12
                    cur_l += ekf_gain * signed

                cur_l = max(_L_MIN, min(_L_MAX, cur_l))
                if (t - last_human_phys_t[r]) > 300 and not occupied[r]:
                    cur_l = min(cur_l, l_support_cap)

                next_log_odds[r] = cur_l

            log_odds = next_log_odds

            # 5) Update HSMM dwell clock + Schmitt Hysteresis Output
            occ_now: set[str] = set()
            probs_now: dict[str, float] = {}
            for r in rooms:
                prob = _sigmoid(log_odds[r])
                if occupied[r] or prob >= 0.45:
                    dwell_tau[r] += 1.0
                else:
                    dwell_tau[r] = max(0.0, dwell_tau[r] * 0.5)

                probs_now[r] = round(prob, 5)
                if not occupied[r]:
                    if prob >= theta_enter and (t - last_human_phys_t[r]) <= 15:
                        occupied[r] = True
                        entered_at[r] = t
                else:
                    if prob <= theta_clear and (t - entered_at[r]) >= 3:
                        occupied[r] = False

                if occupied[r]:
                    occ_now.add(r)

            actual_timeline.append(occ_now)
            prob_timeline.append(probs_now)

        return actual_timeline, prob_timeline
