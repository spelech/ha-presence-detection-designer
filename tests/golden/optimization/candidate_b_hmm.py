"""Candidate B: Coupled Continuous-Time Log-Odds HMM / Dynamic Bayesian Network."""

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

CANDIDATE_B_BOUNDS: dict[str, tuple[float, float, str]] = {
    "base_exit_hazard": (0.012, 0.085, "log"),
    "transit_hazard_mult": (1.2, 4.5, "linear"),
    "sustain_hazard_mult": (0.015, 0.25, "log"),
    "cam_subzone_llr": (2.2, 5.2, "linear"),
    "cam_clear_decay": (0.04, 0.55, "log"),
    "pir_rise_llr": (1.6, 4.6, "linear"),
    "pir_latch_tau_sec": (3.0, 20.0, "linear"),
    "spillover_discount": (0.5, 3.2, "linear"),
    "handoff_drain_rate": (0.25, 1.8, "linear"),
    "ekf_support_gain": (0.05, 0.45, "linear"),
    "theta_enter": (0.58, 0.85, "linear"),
    "hysteresis_gap": (0.08, 0.30, "linear"),
}

CANDIDATE_B_DEFAULTS: dict[str, float] = {
    "base_exit_hazard": 0.032,
    "transit_hazard_mult": 2.4,
    "sustain_hazard_mult": 0.055,
    "cam_subzone_llr": 3.8,
    "cam_clear_decay": 0.18,
    "pir_rise_llr": 3.1,
    "pir_latch_tau_sec": 7.5,
    "spillover_discount": 1.65,
    "handoff_drain_rate": 0.85,
    "ekf_support_gain": 0.22,
    "theta_enter": 0.72,
    "hysteresis_gap": 0.18,
}

_L_MIN = -4.8
_L_MAX = 4.6
_L_PRIOR = -2.44235  # logit(0.08)
_L_REST_STILL_CAP = -0.35


def _sigmoid(x: float) -> float:
    if x >= 25.0:
        return 1.0
    if x <= -25.0:
        return 0.0
    return 1.0 / (1.0 + math.exp(-x))


def _logit(p: float) -> float:
    pc = max(1e-4, min(1.0 - 1e-4, p))
    return math.log(pc / (1.0 - pc))


class CandidateBRunner:
    """Coupled Continuous-Time Log-Odds HMM evaluating 1Hz multi-room presence probability."""

    name = "B_Coupled_HMM"
    param_bounds = CANDIDATE_B_BOUNDS
    default_params = CANDIDATE_B_DEFAULTS

    def __init__(
        self, topology: HouseTopologyIndex, params: dict[str, float] | None = None
    ) -> None:
        self.topo = topology
        merged = dict(CANDIDATE_B_DEFAULTS)
        if params:
            merged.update(params)
        self.p = merged

    def run_timeline(self, bundle: ScenarioBundle) -> tuple[list[set[str]], list[dict[str, float]]]:
        """Step through bundle at 1Hz and return (occupied_rooms_by_t, room_probs_by_t)."""
        topo = self.topo
        rooms = topo.tracked_rooms
        p = self.p
        tl = bundle.timeline

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

        log_odds: dict[str, float] = {r: _L_PRIOR for r in rooms}
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

            ekf_probs = {r: obs_state.room_ekf_prob(r) for r in rooms}

            # Detect per-room current physical triggers before cross-room coupling
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
                    and obs_state.ekf_est.initialized
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

            # 1) Camera sub-zone likelihoods (shade-conditioned)
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
                    # Reject false flicker bursts while shades settle without human corroboration
                    if shade_settling and not occupied[r] and not has_corrob:
                        continue
                    cam_active_room[r] = True
                    cam_active_ever[r] = True
                    last_human_phys_t[r] = t
                    best_age = min(obs_state.rise_age(sz.entity_id, t) for sz in active_szs)
                    gain = cam_llr if best_age <= 2 else 0.35 * cam_llr
                    # Extra credit when multiple sub-zones agree or rising from neighbor transit
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

            # 2) Fast PIR likelihoods (exponential latch decay, pet & spillover conditioning)
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
                    # Pet suppression for non-pet-immune PIRs unless human camera is active
                    if not pir.is_pet_immune and pet_here and not cam_active_room[r]:
                        continue

                    nb_active = any(
                        occupied[nb] or (t - last_fresh_trigger_t[nb]) <= 20
                        for nb in topo.connected_rooms[r]
                    )
                    ekf_room_ok = obs_state.ekf_est.initialized and p_ekf_r >= 0.15
                    door_recent = obs_state.is_door_opened_recently(r, t, t - 15) and (
                        obs_state.ekf_est.initialized
                        or not obs_state.is_any_open_plan_pet_active(t, window_sec=12)
                    )
                    pir_corroborated = (
                        occupied[r] or cam_active_room[r] or nb_active or ekf_room_ok or door_recent
                    )
                    if not pir_corroborated:
                        continue

                    w_latch = math.exp(-age / pir_tau)

                    # Geometric spillover discount when spilled room (or its transit) was recently active
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
                    log_odds[r] += step_llr

            # 3) Door contacts (entry boost to connected rooms when not pure pet noise)
            door_human_ok = (
                obs_state.ekf_est.initialized
                or not obs_state.is_any_open_plan_pet_active(t, window_sec=12)
            )
            if door_human_ok:
                for deid, drooms in topo.door_connected_rooms.items():
                    if obs_state.is_on(deid) and obs_state.rise_age(deid, t) <= 1:
                        for dr in drooms:
                            if dr in log_odds:
                                log_odds[dr] += 0.9
                                last_human_phys_t[dr] = t

            # 4) Continuous-time hazard decay, clear-camera negative space & graph coupling
            next_log_odds: dict[str, float] = {}
            for r in rooms:
                cur_l = log_odds[r]
                p_ekf_r, ekf_conf = ekf_probs[r]
                sust = sustained_room[r]

                # Continuous-time decay rate
                h = base_hazard
                if r in TRANSIT_ROOMS:
                    h *= transit_mult
                elif r in SLEEP_BATH_ROOMS:
                    h *= 0.65
                elif r in EXTERIOR_BIRTH_ROOMS and not occupied[r]:
                    h *= 0.9

                # Check if EKF + Ecobee actively confirm stationary stillness in this room
                ecobee_on = any(obs_state.is_on(eid) for eid in topo.room_ecobee_motion[r]) or any(
                    obs_state.is_on(eid) for eid in topo.room_ecobee_occupancy[r]
                )
                ekf_confirming = p_ekf_r >= 0.40 and ekf_conf >= 0.25
                if sust or (occupied[r] and ekf_confirming and ecobee_on):
                    h *= sustain_mult

                # Drift toward resting prior
                cur_l += h * (_L_PRIOR - cur_l) * 3.5

                # Supporting Ecobee gently maintains occupied log-odds
                if ecobee_on and _sigmoid(cur_l) >= 0.25 and not bounded_sealed[r]:
                    eco_m_on = any(obs_state.is_on(eid) for eid in topo.room_ecobee_motion[r])
                    cur_l += 0.08 if eco_m_on else 0.025

                # Clear camera negative-space attenuation (scaled down under TV/shower/EKF+Ecobee)
                cov_pct = float(topo.room_coverage[r].get("max_coverage_pct", 0.0))
                if cov_pct > 0.0 and obs_state.is_camera_clear(r) and cur_l > _L_PRIOR:
                    neg_mult = 1.0
                    if sust or (ekf_confirming and ecobee_on):
                        neg_mult = 0.08
                    elif ekf_confirming and r not in TRANSIT_ROOMS:
                        neg_mult = 0.35
                    cur_l -= clear_decay * (cov_pct / 100.0) * neg_mult

                # Competitive graph handoff drain: connected neighbor got fresh human trigger
                if not cam_active_room[r] and not sust and (t - last_fresh_trigger_t[r]) >= 5:
                    nb_fresh = any(
                        fresh_human_room[nb]
                        or (
                            (t - last_fresh_trigger_t[nb]) <= 3
                            and (p_ekf_r < 0.25 or ekf_probs[nb][0] > p_ekf_r)
                        )
                        for nb in topo.connected_rooms[r]
                    )
                    if nb_fresh:
                        cur_l -= handoff_drain

                # Supporting-only EKF continuous drift (never solo-triggers, never erases camera/TV)
                if obs_state.ekf_est.initialized:
                    signed = (2.0 * p_ekf_r - 1.0) * ekf_conf
                    if signed < 0.0 and (cam_active_room[r] or sust):
                        signed *= 0.12
                    cur_l += ekf_gain * signed

                # Enforce GUARD-02 / supporting-only cap when no recent human physical evidence
                cur_l = max(_L_MIN, min(_L_MAX, cur_l))
                if (t - last_human_phys_t[r]) > 300 and not occupied[r]:
                    cur_l = min(cur_l, l_support_cap)

                next_log_odds[r] = cur_l

            log_odds = next_log_odds

            # 5) Schmitt Hysteresis & Binary State Output
            occ_now: set[str] = set()
            probs_now: dict[str, float] = {}
            for r in rooms:
                prob = _sigmoid(log_odds[r])
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
