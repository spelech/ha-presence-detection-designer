"""Candidate D: White-Paper Room-Graph RFS-PHD Filter + HSMM Dwell Survival.

Mathematical Grounding:
- Mahler (2003), Vo & Ma (2006) Random Finite Set Probability Hypothesis Density (RFS-PHD)
  propagating continuous room target intensities lambda_r(t) >= 0 with multi-sensor
  clutter competition kappa_m(t) + sum_j P_D,m(j) * lambda_j^-(t).
- Duong, Bui, Phung & Venkatesh (2005) Hidden Semi-Markov Model (HSMM) Weibull
  dwell-time survival hazard P_S(r, tau_r) capturing stationary stillness vs. transit flow.
- Exact sub-Poisson existence complement P_r(t) = 1 - exp(-beta * lambda_r(t)).
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

CANDIDATE_D_BOUNDS: dict[str, tuple[float, float, str]] = {
    "weibull_eta_stay": (35.0, 220.0, "log"),
    "weibull_eta_transit": (5.0, 32.0, "log"),
    "sustain_survival_boost": (0.01, 0.20, "log"),
    "graph_flow_rate": (0.08, 0.65, "linear"),
    "birth_trigger": (0.8, 2.8, "linear"),
    "pd_cam": (0.75, 0.98, "linear"),
    "pd_pir": (0.55, 0.92, "linear"),
    "clutter_pir": (0.04, 0.35, "log"),
    "pir_latch_tau_sec": (3.0, 18.0, "linear"),
    "clear_pd_scale": (0.05, 0.45, "log"),
    "ekf_phd_gain": (0.05, 0.45, "linear"),
    "existence_beta": (1.8, 4.6, "linear"),
    "theta_enter": (0.60, 0.88, "linear"),
    "hysteresis_gap": (0.08, 0.30, "linear"),
}

CANDIDATE_D_DEFAULTS: dict[str, float] = {
    "weibull_eta_stay": 85.0,
    "weibull_eta_transit": 13.0,
    "sustain_survival_boost": 0.045,
    "graph_flow_rate": 0.35,
    "birth_trigger": 1.45,
    "pd_cam": 0.91,
    "pd_pir": 0.78,
    "clutter_pir": 0.11,
    "pir_latch_tau_sec": 7.0,
    "clear_pd_scale": 0.22,
    "ekf_phd_gain": 0.24,
    "existence_beta": 2.9,
    "theta_enter": 0.74,
    "hysteresis_gap": 0.18,
}

_K_STAY = 0.72
_K_TRANSIT = 1.60
_LAMBDA_MAX = 3.2


def _weibull_survival(
    tau: float,
    *,
    shape_k: float,
    scale_eta: float,
) -> float:
    t_eff = max(1.0, float(tau))
    eta = max(1.0, float(scale_eta))
    hazard = (shape_k / eta) * math.pow(t_eff / eta, shape_k - 1.0)
    return math.exp(-min(2.0, max(1e-4, hazard)))


class CandidateDRunner:
    """Room-Graph Random Finite Set PHD Filter + HSMM Weibull Dwell Survival."""

    name = "D_RFS_PHD_HSMM"
    param_bounds = CANDIDATE_D_BOUNDS
    default_params = CANDIDATE_D_DEFAULTS

    def __init__(
        self, topology: HouseTopologyIndex, params: dict[str, float] | None = None
    ) -> None:
        self.topo = topology
        merged = dict(CANDIDATE_D_DEFAULTS)
        if params:
            merged.update(params)
        self.p = merged

    def run_timeline(self, bundle: ScenarioBundle) -> tuple[list[set[str]], list[dict[str, float]]]:
        """Step 1Hz RFS-PHD intensity propagation, Mahler multi-sensor update & HSMM dwell."""
        topo = self.topo
        rooms = topo.tracked_rooms
        p = self.p
        tl = bundle.timeline

        theta_enter = float(p["theta_enter"])
        theta_clear = max(0.25, min(theta_enter - 0.06, theta_enter - float(p["hysteresis_gap"])))
        eta_stay = float(p["weibull_eta_stay"])
        eta_transit = float(p["weibull_eta_transit"])
        sust_boost = float(p["sustain_survival_boost"])
        flow_rate = float(p["graph_flow_rate"])
        birth_trig = float(p["birth_trigger"])
        pd_cam = float(p["pd_cam"])
        pd_pir = float(p["pd_pir"])
        clutter_pir = float(p["clutter_pir"])
        pir_tau = max(1.0, float(p["pir_latch_tau_sec"]))
        clear_pd_scale = float(p["clear_pd_scale"])
        ekf_gain = float(p["ekf_phd_gain"])
        beta = max(1.0, float(p["existence_beta"]))

        lam_support_cap = -math.log(1.0 - max(0.25, theta_enter - 0.14)) / beta

        lam: dict[str, float] = {r: 0.008 for r in rooms}
        dwell_tau: dict[str, float] = {r: 0.0 for r in rooms}
        occupied: dict[str, bool] = {r: False for r in rooms}
        entered_at: dict[str, int] = {r: -99999 for r in rooms}
        last_human_phys_t: dict[str, int] = {r: -99999 for r in rooms}
        last_fresh_trigger_t: dict[str, int] = {r: -99999 for r in rooms}
        cam_active_ever: dict[str, bool] = {r: False for r in rooms}

        obs_state = SensorFrameState(topology=topo)
        actual_timeline: list[set[str]] = []
        prob_timeline: list[dict[str, float]] = []

        for t in range(tl.duration_sec):
            updates = tl.initial_states if t == 0 else (bundle.events_by_t.get(t) or {})
            ble_ranges = tl.ble_ranges_by_t[t] if t < len(tl.ble_ranges_by_t) else []
            obs_state.step(t, updates, ble_ranges)

            ekf_est = obs_state.ekf_est
            ekf_probs = {r: obs_state.room_ekf_prob(r) for r in rooms}

            sustained_room: dict[str, bool] = {}
            ecobee_room: dict[str, bool] = {}
            cam_active_room: dict[str, bool] = {r: False for r in rooms}
            fresh_phys_room: dict[str, bool] = {r: False for r in rooms}

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
                sustained_room[r] = sust
                ecobee_room[r] = any(
                    obs_state.is_on(eid) for eid in topo.room_ecobee_motion[r]
                ) or any(obs_state.is_on(eid) for eid in topo.room_ecobee_occupancy[r])

            # Pre-scan which rooms have fresh physical camera/PIR rising triggers this second
            # (used to weight HSMM Markov transition flow M_{j->r}(t))
            for r in rooms:
                shade_settling = obs_state.is_shade_settling(r, t, window_sec=180)
                has_pir = any(obs_state.is_on(pr.entity_id) for pr in topo.room_fast_pirs[r])
                has_door = any(
                    obs_state.rise_age(deid, t) <= 15 for deid, _ in topo.room_door_contacts[r]
                )
                p_ekf_r, _ = ekf_probs[r]
                has_corrob = has_pir or has_door or p_ekf_r >= 0.35
                for sz in topo.room_camera_subzones[r]:
                    if obs_state.is_on(sz.entity_id):
                        if not (shade_settling and not occupied[r] and not has_corrob):
                            cam_active_room[r] = True
                            cam_active_ever[r] = True
                            if obs_state.rise_age(sz.entity_id, t) <= 1:
                                fresh_phys_room[r] = True
                if not cam_active_room[r]:
                    for pr in topo.room_fast_pirs[r]:
                        if (
                            obs_state.is_on(pr.entity_id)
                            and obs_state.rise_age(pr.entity_id, t) <= 1
                        ):
                            p_ekf_r, _ = ekf_probs[r]
                            pet_blk = not pr.is_pet_immune and (
                                obs_state.is_pet_active(
                                    r, t, window_sec=18, pir_entity_id=pr.entity_id
                                )
                                or (
                                    r
                                    in (
                                        "Dining Room",
                                        "Living Room",
                                        "Kitchen",
                                        "Family Room",
                                        "Front Entry",
                                    )
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
                            )
                            nb_act = any(
                                occupied[nb] or (t - last_fresh_trigger_t[nb]) <= 20
                                for nb in topo.connected_rooms[r]
                            )
                            ekf_room_ok = ekf_est.initialized and p_ekf_r >= 0.15
                            door_rec = obs_state.is_door_opened_recently(r, t, t - 15) and (
                                ekf_est.initialized
                                or not obs_state.is_any_open_plan_pet_active(t, window_sec=12)
                            )
                            pir_corr = occupied[r] or nb_act or ekf_room_ok or door_rec
                            if not pet_blk and pir_corr:
                                fresh_phys_room[r] = True

            # === STEP A: HSMM Weibull Survival + EKF-Heading-Modulated Markov Flow Predict ===
            # Below-noise floor decays rapidly toward resting prior instead of creeping upward
            lam_pred: dict[str, float] = {
                r: (0.004 if r in EXTERIOR_BIRTH_ROOMS else 0.002) for r in rooms
            }
            has_vel = ekf_est.initialized and ekf_est.speed_ft_s >= 0.45
            vx, vy = ekf_est.vx_px_s, ekf_est.vy_px_s
            v_norm = math.hypot(vx, vy)

            for j in rooms:
                lj = lam[j]
                if lj < 0.12 and not occupied[j]:
                    lam_pred[j] += 0.65 * lj
                    continue
                is_transit = j in TRANSIT_ROOMS
                ps = _weibull_survival(
                    dwell_tau[j],
                    shape_k=(_K_TRANSIT if is_transit else _K_STAY),
                    scale_eta=(
                        eta_transit
                        if is_transit
                        else (eta_stay * 1.45 if j in SLEEP_BATH_ROOMS else eta_stay)
                    ),
                )
                p_ekf_j, ekf_conf_j = ekf_probs[j]
                if sustained_room[j] or (
                    occupied[j] and ecobee_room[j] and p_ekf_j >= 0.40 and ekf_conf_j >= 0.25
                ):
                    ps = 1.0 - (1.0 - ps) * sust_boost

                surv_mass = ps * lj
                nbs = topo.connected_rooms[j]
                if not nbs or sustained_room[j]:
                    lam_pred[j] += surv_mass
                    continue

                # Route transition outflow only to neighbors with recent triggers or EKF alignment
                out_weights: list[float] = []
                cjx, cjy = topo.room_centroids[j]
                for nb in nbs:
                    w = 0.0
                    if fresh_phys_room[nb] or (t - last_fresh_trigger_t[nb]) <= 3:
                        w = 2.0
                    elif has_vel and v_norm > 1e-3 and topo.room_floor[nb] == ekf_est.floor:
                        nbx, nby = topo.room_centroids[nb]
                        dx, dy = nbx - cjx, nby - cjy
                        dn = math.hypot(dx, dy)
                        if dn > 1e-3:
                            cos_align = (dx * vx + dy * vy) / (dn * v_norm)
                            if cos_align > 0.45 and (t - last_human_phys_t[nb]) <= 15:
                                w = cos_align
                    out_weights.append(w)

                # Competitive neighbor pull accelerates exit hazard when neighbor gets fresh entry
                nb_fresh = any(
                    fresh_phys_room[nb] or (t - last_fresh_trigger_t[nb]) <= 2 for nb in nbs
                )
                out_frac = (1.0 - ps) * (1.2 + flow_rate * 2.0)
                if nb_fresh and not cam_active_room[j]:
                    out_frac = max(out_frac, flow_rate * 0.75)
                out_frac = min(0.55, out_frac)

                stay_mass = surv_mass * (1.0 - out_frac)
                flow_mass = surv_mass * out_frac
                lam_pred[j] += stay_mass

                w_sum = sum(out_weights)
                if w_sum > 1e-6:
                    for nb, w in zip(nbs, out_weights, strict=True):
                        if w > 0.0:
                            lam_pred[nb] += flow_mass * (w / w_sum)
                # Unrouted exit hazard decays out of house/room cleanly rather than polluting empty rooms

            # === STEP B: Exact Mahler Multi-Sensor PHD Update ===
            lam_upd = dict(lam_pred)

            # B.1 Active Camera Sub-zones
            for r in rooms:
                shade_settling = obs_state.is_shade_settling(r, t, window_sec=180)
                has_pir = any(obs_state.is_on(pr.entity_id) for pr in topo.room_fast_pirs[r])
                has_door = any(
                    obs_state.rise_age(deid, t) <= 15 for deid, _ in topo.room_door_contacts[r]
                )
                p_ekf_r, _ = ekf_probs[r]
                has_corrob = has_pir or has_door or p_ekf_r >= 0.35

                for sz in topo.room_camera_subzones[r]:
                    if not obs_state.is_on(sz.entity_id):
                        continue
                    age = obs_state.rise_age(sz.entity_id, t)
                    # Dynamic clutter kappa: sunlit shade movement inflates visual clutter
                    kappa = 0.02
                    if shade_settling and not occupied[r] and not has_corrob:
                        kappa = 120.0
                    else:
                        last_human_phys_t[r] = t
                        if age <= 1:
                            last_fresh_trigger_t[r] = t

                    birth_b = birth_trig if age <= 2 else 0.55 * birth_trig
                    tilde = lam_upd[r] + birth_b
                    denom = kappa + pd_cam * tilde
                    post = (1.0 - pd_cam) * lam_upd[r] + (pd_cam * tilde) / denom
                    # Additive intensity lift when already-occupied/fresh to map into sub-Poisson prob
                    gain_lift = (pd_cam * tilde) / denom
                    lam_upd[r] = min(_LAMBDA_MAX, max(lam_upd[r] * 0.4, post + 0.35 * gain_lift))

            # B.2 Active Fast PIRs (spilled rooms share the Mahler competition denominator!)
            for r in rooms:
                p_ekf_r, _ = ekf_probs[r]
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

                    # Dynamic clutter: pet detection or uncorroborated spike raises kappa_pir
                    kappa = clutter_pir
                    if (
                        not pir.is_pet_immune and pet_here and not cam_active_room[r]
                    ) or not pir_corroborated:
                        kappa = 120.0 * clutter_pir

                    w_latch = math.exp(-age / pir_tau)
                    eff_pd_host = pd_pir * w_latch

                    # Build detection footprint P_{D,m}(u) across host + geometrically spilled rooms
                    spills = topo.pir_spillover.get(pir.entity_id, {})
                    footprint: dict[str, float] = {r: eff_pd_host}
                    for sp_room, ov_frac in spills.items():
                        if sp_room in lam_upd:
                            footprint[sp_room] = min(0.85, eff_pd_host * ov_frac * 2.2)

                    # Neighbor/transit activity in spilled rooms elevates competition clutter
                    extra_clutter = 0.0
                    for sp_room, pd_sp in footprint.items():
                        if sp_room == r:
                            continue
                        if (
                            occupied.get(sp_room, False)
                            or (t - last_fresh_trigger_t.get(sp_room, -99999)) <= 20
                        ):
                            extra_clutter += pd_sp * 4.8
                        elif sp_room in TRANSIT_ROOMS and any(
                            (t - last_fresh_trigger_t.get(nb, -99999)) <= 15
                            for nb in topo.connected_rooms.get(sp_room, ())
                            if nb != r
                        ):
                            extra_clutter += pd_sp * 4.5

                    tilde_map: dict[str, float] = {}
                    denom = kappa + extra_clutter
                    for u, pd_u in footprint.items():
                        is_host = u == r
                        b_scale = max(0.08, 1.0 - 0.85 * extra_clutter)
                        b_u = (birth_trig * 0.85 * w_latch * b_scale) if is_host else 0.0
                        if kappa > 5.0 * clutter_pir:
                            b_u = 0.0
                        tu = lam_upd[u] + b_u
                        tilde_map[u] = tu
                        denom += pd_u * tu

                    host_share = (footprint[r] * tilde_map[r]) / max(1e-6, denom)
                    if kappa < 5.0 * clutter_pir and host_share >= 0.42 and w_latch >= 0.35:
                        last_human_phys_t[r] = t
                        if age <= 1:
                            last_fresh_trigger_t[r] = t
                    elif occupied[r] and kappa < 5.0 * clutter_pir and host_share >= 0.25:
                        last_human_phys_t[r] = t

                    for u, pd_u in footprint.items():
                        if u != r:
                            continue
                        upd = (1.0 - pd_u) * lam_upd[u] + (pd_u * tilde_map[u]) / max(1e-6, denom)
                        lam_upd[u] = min(_LAMBDA_MAX, max(lam_upd[u] * 0.5, upd))

            # B.3 Door contacts
            door_human_ok = ekf_est.initialized or not obs_state.is_any_open_plan_pet_active(
                t, window_sec=12
            )
            if door_human_ok:
                for deid, drooms in topo.door_connected_rooms.items():
                    if obs_state.is_on(deid) and obs_state.rise_age(deid, t) <= 1:
                        for dr in drooms:
                            if dr in lam_upd:
                                last_human_phys_t[dr] = t
                                lam_upd[dr] = min(_LAMBDA_MAX, lam_upd[dr] + 0.25)

            # B.4 Missed-detection update (clear primary cameras) + Ecobee & EKF modulation
            for r in rooms:
                p_ekf_r, ekf_conf = ekf_probs[r]
                sust = sustained_room[r]
                ekf_confirming = p_ekf_r >= 0.40 and ekf_conf >= 0.25

                cov_pct = float(topo.room_coverage[r].get("max_coverage_pct", 0.0))
                if cov_pct > 0.0 and obs_state.is_camera_clear(r):
                    pd_clr = clear_pd_scale * (cov_pct / 100.0)
                    if sust or (ekf_confirming and ecobee_room[r]):
                        pd_clr *= 0.08
                    elif ekf_confirming and r not in TRANSIT_ROOMS:
                        pd_clr *= 0.35
                    lam_upd[r] *= max(0.25, 1.0 - pd_clr)

                if ecobee_room[r] and lam_upd[r] >= 0.22:
                    lam_upd[r] = min(_LAMBDA_MAX, lam_upd[r] * 1.04)

                if ekf_est.initialized and ekf_gain > 0.0:
                    signed = (2.0 * p_ekf_r - 1.0) * ekf_conf
                    if signed < 0.0 and (cam_active_room[r] or sust):
                        signed *= 0.12
                    lam_upd[r] *= math.exp(max(-0.6, min(0.6, ekf_gain * signed)))

                lam_upd[r] = max(0.002, min(_LAMBDA_MAX, lam_upd[r]))
                if (t - last_human_phys_t[r]) > 300 and not occupied[r]:
                    lam_upd[r] = min(lam_upd[r], lam_support_cap)

            lam = lam_upd

            # Update HSMM dwell clock tau_r(t) + Poisson existence P_r(t) + Schmitt hysteresis
            occ_now: set[str] = set()
            probs_now: dict[str, float] = {}
            for r in rooms:
                prob = max(0.0, min(1.0, 1.0 - math.exp(-beta * lam[r])))
                if lam[r] >= 0.30 or occupied[r]:
                    dwell_tau[r] += 1.0
                else:
                    dwell_tau[r] = max(0.0, dwell_tau[r] * 0.5)

                if (t - last_human_phys_t[r]) > 300 and not occupied[r]:
                    prob = min(prob, max(0.25, theta_enter - 0.12))

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
