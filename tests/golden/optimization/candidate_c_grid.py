"""Candidate C: 2D Raycast Spatial Occupancy Grid Filter with Wall-Blocked Diffusion."""

from __future__ import annotations

import math

from custom_components.presence_detection_designer.spatial_geometry import (
    line_segment_intersects_solid_wall,
    point_in_cone,
)

from .dataset import ScenarioBundle
from .sensor_model import (
    SLEEP_BATH_ROOMS,
    TRANSIT_ROOMS,
    HouseTopologyIndex,
    SensorFrameState,
)

CANDIDATE_C_BOUNDS: dict[str, tuple[float, float, str]] = {
    "cell_decay_rate": (0.015, 0.14, "log"),
    "transit_decay_mult": (1.2, 4.0, "linear"),
    "sustain_decay_mult": (0.02, 0.25, "log"),
    "diffusion_rate": (0.015, 0.25, "log"),
    "cam_cell_llr": (2.2, 6.0, "linear"),
    "cam_clear_cell_llr": (0.04, 0.55, "log"),
    "pir_cell_llr": (1.8, 5.2, "linear"),
    "pir_latch_tau_sec": (3.0, 18.0, "linear"),
    "pir_explain_away": (0.4, 3.2, "linear"),
    "ekf_grid_gain": (0.04, 0.40, "linear"),
    "noisy_or_alpha": (0.25, 1.35, "linear"),
    "theta_enter": (0.58, 0.85, "linear"),
    "hysteresis_gap": (0.08, 0.30, "linear"),
}

CANDIDATE_C_DEFAULTS: dict[str, float] = {
    "cell_decay_rate": 0.042,
    "transit_decay_mult": 2.2,
    "sustain_decay_mult": 0.055,
    "diffusion_rate": 0.06,
    "cam_cell_llr": 4.2,
    "cam_clear_cell_llr": 0.18,
    "pir_cell_llr": 3.4,
    "pir_latch_tau_sec": 7.0,
    "pir_explain_away": 1.65,
    "ekf_grid_gain": 0.18,
    "noisy_or_alpha": 0.62,
    "theta_enter": 0.72,
    "hysteresis_gap": 0.18,
}

_L_MIN = -5.5
_L_MAX = 5.2
_L_PRIOR = -3.8
_GRID_PITCH_PX = 48.0


def _sigmoid(x: float) -> float:
    if x >= 25.0:
        return 1.0
    if x <= -25.0:
        return 0.0
    return 1.0 / (1.0 + math.exp(-x))


class SpatialGridIndex:
    """Precomputed 2D floorplan lattice, wall-blocked neighbors, stair portals, and sensor cells."""

    def __init__(self, topo: HouseTopologyIndex, pitch_px: float = _GRID_PITCH_PX) -> None:
        self.pitch_px = pitch_px
        self.cell_x: list[float] = []
        self.cell_y: list[float] = []
        self.cell_floor: list[str] = []
        self.cell_room: list[str] = []
        self.room_cells: dict[str, list[int]] = {r: [] for r in topo.tracked_rooms}
        self.floor_cells: dict[str, list[int]] = {}

        # Discretize interior of every tracked room on a regular pitch_px lattice
        coords_by_floor: dict[str, dict[tuple[int, int], int]] = {}
        for r in topo.tracked_rooms:
            box = topo.room_boxes.get(r)
            if not box:
                continue
            fl = str(box.get("floor", "main"))
            rx = float(box.get("x", 0.0))
            ry = float(box.get("y", 0.0))
            rw = max(1.0, float(box.get("width", 100.0)))
            rh = max(1.0, float(box.get("height", 100.0)))
            nx = max(1, int(round(rw / pitch_px)))
            ny = max(1, int(round(rh / pitch_px)))
            sx = rw / nx
            sy = rh / ny
            fl_coords = coords_by_floor.setdefault(fl, {})
            for ix in range(nx):
                cx = rx + (ix + 0.5) * sx
                for iy in range(ny):
                    cy = ry + (iy + 0.5) * sy
                    idx = len(self.cell_x)
                    self.cell_x.append(cx)
                    self.cell_y.append(cy)
                    self.cell_floor.append(fl)
                    self.cell_room.append(r)
                    self.room_cells[r].append(idx)
                    self.floor_cells.setdefault(fl, []).append(idx)
                    fl_coords[(round(cx / pitch_px), round(cy / pitch_px))] = idx

        self.n_cells = len(self.cell_x)

        # Build wall-blocked geometric neighbors + stair portal links
        adj: list[set[int]] = [set() for _ in range(self.n_cells)]
        for i in range(self.n_cells):
            fl = self.cell_floor[i]
            walls = topo.wall_segments_by_floor.get(fl, [])
            xi, yi = self.cell_x[i], self.cell_y[i]
            for j in self.floor_cells.get(fl, ()):
                if j <= i:
                    continue
                if math.hypot(self.cell_x[j] - xi, self.cell_y[j] - yi) <= pitch_px * 1.45:
                    if not line_segment_intersects_solid_wall(
                        xi, yi, self.cell_x[j], self.cell_y[j], walls
                    ):
                        adj[i].add(j)
                        adj[j].add(i)

        # Connect stair portals across floors
        portal_pairs = (
            ("Front Entry", "Upstairs Hallway & Stairs"),
            ("Front Entry", "Basement Play Area"),
        )
        for ra, rb in portal_pairs:
            ca_list = self.room_cells.get(ra, [])
            cb_list = self.room_cells.get(rb, [])
            if ca_list and cb_list:
                pa = ca_list[len(ca_list) // 2]
                pb = cb_list[len(cb_list) // 2]
                adj[pa].add(pb)
                adj[pb].add(pa)

        self.neighbors: list[tuple[int, ...]] = [tuple(sorted(s)) for s in adj]

        # Precompute sensor-to-cell raycast inverse sensor mappings
        self.subzone_cells: dict[str, tuple[int, ...]] = {}
        for r in topo.tracked_rooms:
            for sz in topo.room_camera_subzones[r]:
                hits: list[int] = []
                for c in self.room_cells[r]:
                    if (
                        sz.x <= self.cell_x[c] <= sz.x + sz.width
                        and sz.y <= self.cell_y[c] <= sz.y + sz.height
                    ):
                        hits.append(c)
                if not hits and self.room_cells[r]:
                    nearest = min(
                        self.room_cells[r],
                        key=lambda c: math.hypot(self.cell_x[c] - sz.cx, self.cell_y[c] - sz.cy),
                    )
                    hits.append(nearest)
                self.subzone_cells[sz.entity_id] = tuple(hits)

        self.camera_vis_cells: dict[str, tuple[int, ...]] = {}
        for cam_id, cam in topo.cameras.items():
            walls = topo.wall_segments_by_floor.get(cam.floor, [])
            vis: list[int] = []
            for c in self.floor_cells.get(cam.floor, ()):
                cx, cy = self.cell_x[c], self.cell_y[c]
                if point_in_cone(cx, cy, cam.x, cam.y, cam.heading_deg, cam.fov_deg, cam.range_px):
                    if not line_segment_intersects_solid_wall(cam.x, cam.y, cx, cy, walls):
                        vis.append(c)
            self.camera_vis_cells[cam_id] = tuple(vis)

        self.room_clear_cells: dict[str, tuple[int, ...]] = {}
        for r in topo.tracked_rooms:
            rcells = set(self.room_cells[r])
            vis_in_room: list[int] = []
            for cam in topo.room_cameras.get(r, ()):
                for c in self.camera_vis_cells.get(cam.camera_id, ()):
                    if c in rcells:
                        vis_in_room.append(c)
            if (
                not vis_in_room
                and float(topo.room_coverage[r].get("max_coverage_pct", 0.0)) >= 45.0
            ):
                vis_in_room = list(self.room_cells[r])
            self.room_clear_cells[r] = tuple(sorted(set(vis_in_room)))

        # PIR cone cells (include all wall-LOS cone cells across rooms on same floor!)
        self.pir_cone_cells: dict[str, list[tuple[int, str, float]]] = {}
        for eid, pir in topo.pir_by_entity.items():
            walls = topo.wall_segments_by_floor.get(pir.floor, [])
            entries: list[tuple[int, str, float]] = []
            for c in self.floor_cells.get(pir.floor, ()):
                cx, cy = self.cell_x[c], self.cell_y[c]
                if point_in_cone(cx, cy, pir.x, pir.y, pir.heading_deg, pir.fov_deg, pir.range_px):
                    if not line_segment_intersects_solid_wall(pir.x, pir.y, cx, cy, walls):
                        dist_frac = math.hypot(cx - pir.x, cy - pir.y) / max(1.0, pir.range_px)
                        w = max(0.35, 1.0 - 0.55 * dist_frac)
                        entries.append((c, self.cell_room[c], w))
            if not entries and self.room_cells.get(pir.host_room):
                c0 = self.room_cells[pir.host_room][0]
                entries.append((c0, pir.host_room, 0.8))
            self.pir_cone_cells[eid] = entries


_GRID_CACHE: dict[int, SpatialGridIndex] = {}


def _get_grid_index(topo: HouseTopologyIndex) -> SpatialGridIndex:
    key = id(topo)
    cached = _GRID_CACHE.get(key)
    if cached is None:
        cached = SpatialGridIndex(topo)
        _GRID_CACHE[key] = cached
    return cached


class CandidateCRunner:
    """2D Raycast Spatial Occupancy Grid Filter with wall-blocked diffusion and Noisy-OR."""

    name = "C_2D_Occupancy_Grid"
    param_bounds = CANDIDATE_C_BOUNDS
    default_params = CANDIDATE_C_DEFAULTS

    def __init__(
        self, topology: HouseTopologyIndex, params: dict[str, float] | None = None
    ) -> None:
        self.topo = topology
        self.grid = _get_grid_index(topology)
        merged = dict(CANDIDATE_C_DEFAULTS)
        if params:
            merged.update(params)
        self.p = merged

    def run_timeline(self, bundle: ScenarioBundle) -> tuple[list[set[str]], list[dict[str, float]]]:
        """Run 1Hz 2D spatial grid filtering across all floorplan interior cells."""
        topo = self.topo
        grid = self.grid
        rooms = topo.tracked_rooms
        p = self.p
        tl = bundle.timeline

        theta_enter = float(p["theta_enter"])
        theta_clear = max(0.25, min(theta_enter - 0.06, theta_enter - float(p["hysteresis_gap"])))
        decay_base = float(p["cell_decay_rate"])
        transit_mult = float(p["transit_decay_mult"])
        sustain_mult = float(p["sustain_decay_mult"])
        diff_rate = float(p["diffusion_rate"])
        cam_llr = float(p["cam_cell_llr"])
        clear_llr = float(p["cam_clear_cell_llr"])
        pir_llr = float(p["pir_cell_llr"])
        pir_tau = max(1.0, float(p["pir_latch_tau_sec"]))
        explain_away = float(p["pir_explain_away"])
        ekf_gain = float(p["ekf_grid_gain"])
        noisy_alpha = float(p["noisy_or_alpha"])

        cell_l = [_L_PRIOR] * grid.n_cells
        cell_room = grid.cell_room
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

            ekf_probs = {r: obs_state.room_ekf_prob(r) for r in rooms}
            sustained_room: dict[str, bool] = {}
            cam_active_room: dict[str, bool] = {r: False for r in rooms}
            fresh_human_room: dict[str, bool] = {r: False for r in rooms}
            room_max_cell_p: dict[str, float] = {
                r: max((_sigmoid(cell_l[c]) for c in grid.room_cells[r]), default=0.02)
                for r in rooms
            }

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
                sustained_room[r] = sust

            # 1) Predict step: continuous cell regression + wall-blocked diffusion
            next_l = [_L_PRIOR] * grid.n_cells
            neighbors = grid.neighbors
            for c in range(grid.n_cells):
                r = cell_room[c]
                cur = cell_l[c]
                rate = decay_base
                if r in TRANSIT_ROOMS:
                    rate *= transit_mult
                elif r in SLEEP_BATH_ROOMS:
                    rate *= 0.65

                p_ekf_r, ekf_conf = ekf_probs[r]
                ecobee_on = any(obs_state.is_on(eid) for eid in topo.room_ecobee_motion[r]) or any(
                    obs_state.is_on(eid) for eid in topo.room_ecobee_occupancy[r]
                )
                ekf_confirming = p_ekf_r >= 0.40 and ekf_conf >= 0.25
                if sustained_room[r] or (occupied[r] and ekf_confirming and ecobee_on):
                    rate *= sustain_mult

                decayed = cur + rate * (_L_PRIOR - cur) * 3.0
                nbs = neighbors[c]
                if nbs and diff_rate > 0.0:
                    nb_mean = sum(cell_l[j] for j in nbs) / len(nbs)
                    if nb_mean > decayed:
                        decayed += diff_rate * (nb_mean - decayed)
                next_l[c] = decayed
            cell_l = next_l

            # 2) Camera sub-zones inverse sensor model
            for r in rooms:
                shade_settling = obs_state.is_shade_settling(r, t, window_sec=180)
                has_pir_on = any(obs_state.is_on(pir.entity_id) for pir in topo.room_fast_pirs[r])
                has_door_recent = any(
                    obs_state.rise_age(deid, t) <= 15 for deid, _ in topo.room_door_contacts[r]
                )
                p_ekf_r, _ = ekf_probs[r]
                has_corrob = has_pir_on or has_door_recent or p_ekf_r >= 0.35

                for sz in topo.room_camera_subzones[r]:
                    if not obs_state.is_on(sz.entity_id):
                        continue
                    if shade_settling and not occupied[r] and not has_corrob:
                        continue
                    cam_active_room[r] = True
                    cam_active_ever[r] = True
                    last_human_phys_t[r] = t
                    age = obs_state.rise_age(sz.entity_id, t)
                    if age <= 1:
                        fresh_human_room[r] = True
                        last_fresh_trigger_t[r] = t
                    boost = cam_llr if age <= 2 else 0.35 * cam_llr
                    for c in grid.subzone_cells.get(sz.entity_id, ()):
                        cell_l[c] += boost

            # 3) Fast PIR inverse sensor model across raycast cone cells
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
                    cone_cells = grid.pir_cone_cells.get(pir.entity_id, ())

                    # Explaining-away pressure: if another room in/near cone is active
                    spills = topo.pir_spillover.get(pir.entity_id, {})
                    host_atten = 1.0
                    if spills and not cam_active_room[r]:
                        spill_p = sum(
                            ov
                            for sp_r, ov in spills.items()
                            if (t - last_fresh_trigger_t.get(sp_r, -99999)) <= 20
                            or occupied.get(sp_r, False)
                            or (
                                sp_r in TRANSIT_ROOMS
                                and any(
                                    (t - last_fresh_trigger_t.get(nb, -99999)) <= 15
                                    for nb in topo.connected_rooms.get(sp_r, ())
                                    if nb != r
                                )
                            )
                        )
                        if spill_p > 0.0:
                            host_atten = max(0.05, 1.0 - explain_away * spill_p)

                    if host_atten >= 0.45 and w_latch >= 0.35:
                        last_human_phys_t[r] = t
                        if age <= 1:
                            fresh_human_room[r] = True
                            last_fresh_trigger_t[r] = t
                    elif occupied[r] and host_atten >= 0.25:
                        last_human_phys_t[r] = t

                    base_step = pir_llr * (0.45 if age > 1 else 1.2) * w_latch
                    if nb_active and age <= 1 and host_atten >= 0.65:
                        base_step += 0.80
                    for c, cr, weight in cone_cells:
                        if cr == r:
                            cell_l[c] += base_step * weight * host_atten
                        else:
                            # Attenuate non-host cone spillover cells when host or nearby has mass
                            other_exp = max(room_max_cell_p[r], room_max_cell_p.get(cr, 0.0) * 0.5)
                            cr_atten = max(0.05, 1.0 - explain_away * other_exp)
                            cell_l[c] += 0.35 * base_step * weight * cr_atten

            # 4) Door contacts
            door_human_ok = (
                obs_state.ekf_est.initialized
                or not obs_state.is_any_open_plan_pet_active(t, window_sec=12)
            )
            if door_human_ok:
                for deid, drooms in topo.door_connected_rooms.items():
                    if obs_state.is_on(deid) and obs_state.rise_age(deid, t) <= 1:
                        for dr in drooms:
                            last_human_phys_t[dr] = t
                            for c in grid.room_cells.get(dr, ()):
                                cell_l[c] += 0.35

            # 5) Clear-camera raycast negative space + Ecobee sustain + handoff drain
            for r in rooms:
                p_ekf_r, ekf_conf = ekf_probs[r]
                sust = sustained_room[r]
                ecobee_on = any(obs_state.is_on(eid) for eid in topo.room_ecobee_motion[r]) or any(
                    obs_state.is_on(eid) for eid in topo.room_ecobee_occupancy[r]
                )
                ekf_confirming = p_ekf_r >= 0.40 and ekf_conf >= 0.25

                if ecobee_on and room_max_cell_p[r] >= 0.25:
                    for c in grid.room_cells[r]:
                        if cell_l[c] > -1.2:
                            cell_l[c] += 0.06

                if obs_state.is_camera_clear(r):
                    neg_mult = 1.0
                    if sust or (ekf_confirming and ecobee_on):
                        neg_mult = 0.08
                    elif ekf_confirming and r not in TRANSIT_ROOMS:
                        neg_mult = 0.35
                    drop = clear_llr * neg_mult
                    for c in grid.room_clear_cells.get(r, ()):
                        if cell_l[c] > _L_PRIOR:
                            cell_l[c] -= drop

                if not cam_active_room[r] and not sust and (t - last_fresh_trigger_t[r]) >= 5:
                    if any(
                        fresh_human_room[nb]
                        or (
                            (t - last_fresh_trigger_t[nb]) <= 3
                            and (p_ekf_r < 0.25 or ekf_probs[nb][0] > p_ekf_r)
                        )
                        for nb in topo.connected_rooms[r]
                    ):
                        for c in grid.room_cells[r]:
                            if cell_l[c] > _L_PRIOR:
                                cell_l[c] -= 0.55

            # 6) Supporting 2D EKF Gaussian spatial density over grid cells
            if obs_state.ekf_est.initialized and ekf_gain > 0.0:
                est = obs_state.ekf_est
                scale_px = 12.5
                sx_px = max(25.0, est.sigma_x_ft * scale_px)
                sy_px = max(25.0, est.sigma_y_ft * scale_px)
                inv_2sx2 = 1.0 / (2.0 * sx_px * sx_px)
                inv_2sy2 = 1.0 / (2.0 * sy_px * sy_px)
                sigma = max(est.sigma_x_ft, est.sigma_y_ft)
                conf = max(0.15, min(1.0, 1.0 / (1.0 + max(0.0, sigma - 3.0) / 6.0)))
                ex, ey, efl = est.x_px, est.y_px, est.floor

                for c in range(grid.n_cells):
                    r = cell_room[c]
                    if grid.cell_floor[c] == efl:
                        dx = grid.cell_x[c] - ex
                        dy = grid.cell_y[c] - ey
                        gauss_w = math.exp(-(dx * dx * inv_2sx2 + dy * dy * inv_2sy2))
                        signed = (2.0 * gauss_w - 0.55) * conf
                    else:
                        signed = -0.55 * conf
                    if signed < 0.0 and (cam_active_room[r] or sustained_room[r]):
                        signed *= 0.12
                    cell_l[c] += ekf_gain * signed

            # Clamp cells & normalize Noisy-OR to produce calibrated room probabilities + Schmitt FSM
            for c in range(grid.n_cells):
                cell_l[c] = max(_L_MIN, min(_L_MAX, cell_l[c]))

            occ_now: set[str] = set()
            probs_now: dict[str, float] = {}
            for r in rooms:
                rcells = grid.room_cells[r]
                if not rcells:
                    probs_now[r] = 0.02
                    continue
                log_empty = 0.0
                weight_exp = noisy_alpha / max(1.0, len(rcells) / 6.0)
                for c in rcells:
                    pc = _sigmoid(cell_l[c])
                    log_empty += weight_exp * math.log(max(1e-6, 1.0 - pc))
                prob = max(0.0, min(1.0, 1.0 - math.exp(log_empty)))

                # Guard-02: EKF-only cannot cross threshold in uncorroborated rooms
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
