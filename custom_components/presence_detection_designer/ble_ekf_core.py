"""2D+Floor Extended Kalman Filter core tracker for BLE proxy range measurements."""

from __future__ import annotations

import math
from typing import Any

from .ble_ekf_models import (
    BLERangeMeasurement,
    KalmanConfig,
    KalmanEstimate,
    _mat4_mul,
    _mat4_transpose,
    _norm_cdf,
)


class BLEKalmanTracker:
    """Pure-Python 2D+Floor Extended Kalman Filter fusing BLE ranges, cameras, and PIRs."""

    def __init__(self, config: KalmanConfig | None = None) -> None:
        self.cfg = config or KalmanConfig()
        self.initialized: bool = False
        self.floor: str = "main"
        self.last_ts: float | None = None
        # State vector [x_px, y_px, vx_px_s, vy_px_s]
        self.x: list[float] = [0.0, 0.0, 0.0, 0.0]
        # 4x4 covariance matrix P
        s0 = (10.0 * self.cfg.px_per_foot) ** 2
        v0 = (3.0 * self.cfg.px_per_foot) ** 2
        self.P: list[list[float]] = [
            [s0, 0.0, 0.0, 0.0],
            [0.0, s0, 0.0, 0.0],
            [0.0, 0.0, v0, 0.0],
            [0.0, 0.0, 0.0, v0],
        ]
        self._floor_scores: dict[str, float] = {}
        self.last_active_proxies: int = 0
        self.last_rejected_outliers: int = 0

    def reset(self) -> None:
        """Reset filter to uninitialized state."""
        self.initialized = False
        self.last_ts = None
        self._floor_scores.clear()
        self.last_active_proxies = 0
        self.last_rejected_outliers = 0

    def _init_from_xy(
        self, x_px: float, y_px: float, floor: str, sigma_ft: float, now_ts: float
    ) -> None:
        s2 = (max(self.cfg.min_sigma_ft, sigma_ft) * self.cfg.px_per_foot) ** 2
        v2 = (3.0 * self.cfg.px_per_foot) ** 2
        self.x = [float(x_px), float(y_px), 0.0, 0.0]
        self.P = [
            [s2, 0.0, 0.0, 0.0],
            [0.0, s2, 0.0, 0.0],
            [0.0, 0.0, v2, 0.0],
            [0.0, 0.0, 0.0, v2],
        ]
        self.floor = floor
        self.last_ts = now_ts
        self.initialized = True

    def predict(self, now_ts: float) -> None:
        """Propagate state and covariance forward with damped constant-velocity dynamics."""
        if not self.initialized:
            return
        if self.last_ts is None:
            self.last_ts = now_ts
            return
        dt = max(0.0, float(now_ts) - self.last_ts)
        if dt <= 1e-6:
            return
        dt = min(dt, 30.0)
        self.last_ts = now_ts

        gamma = math.exp(-dt / max(0.25, self.cfg.velocity_tau_sec))
        # State transition matrix F
        F = [
            [1.0, 0.0, dt, 0.0],
            [0.0, 1.0, 0.0, dt],
            [0.0, 0.0, gamma, 0.0],
            [0.0, 0.0, 0.0, gamma],
        ]
        # x = F * x
        nx = self.x[0] + dt * self.x[2]
        ny = self.x[1] + dt * self.x[3]
        nvx = gamma * self.x[2]
        nvy = gamma * self.x[3]
        max_v = self.cfg.max_speed_ft_s * self.cfg.px_per_foot
        spd = math.hypot(nvx, nvy)
        if spd > max_v and spd > 1e-6:
            scale = max_v / spd
            nvx *= scale
            nvy *= scale
        self.x = [nx, ny, nvx, nvy]

        # Discrete white-noise acceleration process covariance Q(dt)
        sa = self.cfg.process_accel_ft_s2 * self.cfg.px_per_foot
        sa2 = sa * sa
        q_pp = 0.25 * (dt**4) * sa2
        q_pv = 0.5 * (dt**3) * sa2
        q_vv = (dt**2) * sa2
        Q = [
            [q_pp, 0.0, q_pv, 0.0],
            [0.0, q_pp, 0.0, q_pv],
            [q_pv, 0.0, q_vv, 0.0],
            [0.0, q_pv, 0.0, q_vv],
        ]
        FP = _mat4_mul(F, self.P)
        P_pred = _mat4_mul(FP, _mat4_transpose(F))
        for i in range(4):
            for j in range(4):
                P_pred[i][j] += Q[i][j]
        self.P = P_pred

    def update_floor(
        self,
        ble_ranges: list[BLERangeMeasurement],
        *,
        floor_hints: dict[str, float] | None = None,
        floor_stability_v2: bool | None = None,
    ) -> str:
        """Update discrete floor estimate using hysteretic multi-proxy + PIR/camera log-likelihood."""
        use_v2 = (
            self.cfg.ekf_floor_stability_v2
            if floor_stability_v2 is None
            else bool(floor_stability_v2)
        )
        by_floor: dict[str, list[BLERangeMeasurement]] = {}
        for m in ble_ranges:
            if (
                m.age_sec <= self.cfg.max_ble_age_sec
                and 0.0 <= m.distance_ft <= self.cfg.max_ble_range_ft
            ):
                by_floor.setdefault(m.floor, []).append(m)

        scores: dict[str, float] = {}
        for fl, ms in by_floor.items():
            ms_sorted = sorted(ms, key=lambda r: r.distance_ft)[:2]
            if use_v2:
                # Score floor by its closest proxy plus a small secondary tiebreaker so a
                # 2-proxy floor does not get a 2x count advantage over a 1-proxy floor.
                best_inv = 1.0 / max(1.5, ms_sorted[0].distance_ft)
                second_inv = (
                    (1.0 / max(1.5, ms_sorted[1].distance_ft)) if len(ms_sorted) > 1 else 0.0
                )
                ble_score = (best_inv + 0.15 * second_inv) * 6.0
            else:
                # Legacy v1: unnormalized sum of top-2 closest proxies
                ble_score = sum(1.0 / max(1.5, r.distance_ft) for r in ms_sorted) * 6.0
            scores[fl] = ble_score

        for fl, hint_w in (floor_hints or {}).items():
            scores[fl] = scores.get(fl, 0.0) + float(hint_w)

        if not scores:
            return self.floor

        # Exponential smoothing of floor scores prevents single-tick cross-floor bounce
        alpha = 0.45
        for fl in set(self._floor_scores) | set(scores):
            prev = self._floor_scores.get(fl, 0.0)
            cur = scores.get(fl, 0.0)
            self._floor_scores[fl] = alpha * cur + (1.0 - alpha) * prev

        best_fl = max(self._floor_scores, key=lambda k: self._floor_scores[k])
        if not self.initialized:
            self.floor = best_fl
            return self.floor

        if best_fl != self.floor:
            incumbent_score = self._floor_scores.get(self.floor, 0.0)
            best_score = self._floor_scores[best_fl]
            has_strong_hint = bool(floor_hints and floor_hints.get(best_fl, 0.0) >= 3.0)
            if (
                has_strong_hint
                or (best_score - incumbent_score) >= self.cfg.floor_hysteresis_margin
            ):
                self.floor = best_fl
                # Inflate position covariance on floor change so new floor proxies snap cleanly
                s_jump = (12.0 * self.cfg.px_per_foot) ** 2
                self.P[0][0] = max(self.P[0][0], s_jump)
                self.P[1][1] = max(self.P[1][1], s_jump)
                self.x[2] = 0.0
                self.x[3] = 0.0
        return self.floor

    def _scalar_ekf_update(
        self,
        h_vec: list[float],
        innovation: float,
        r_var: float,
        *,
        gate: bool = True,
    ) -> bool:
        """Apply a single scalar EKF update in Joseph form; return False if gated as outlier."""
        # P * H^T
        ph = [sum(self.P[i][j] * h_vec[j] for j in range(4)) for i in range(4)]
        s_var = sum(h_vec[i] * ph[i] for i in range(4)) + max(1e-6, r_var)
        if gate and (innovation * innovation) / s_var > self.cfg.chi2_gate_1dof:
            return False

        k_gain = [ph[i] / s_var for i in range(4)]
        for i in range(4):
            self.x[i] += k_gain[i] * innovation

        # Joseph form: P = (I - K H) P (I - K H)^T + K R K^T
        ikh = [
            [(1.0 if i == j else 0.0) - k_gain[i] * h_vec[j] for j in range(4)] for i in range(4)
        ]
        p_new = _mat4_mul(_mat4_mul(ikh, self.P), _mat4_transpose(ikh))
        min_var = (self.cfg.min_sigma_ft * self.cfg.px_per_foot) ** 2
        for i in range(4):
            for j in range(4):
                p_new[i][j] += k_gain[i] * r_var * k_gain[j]
        p_new[0][0] = max(p_new[0][0], min_var)
        p_new[1][1] = max(p_new[1][1], min_var)
        self.P = p_new
        return True

    def update_ble_ranges(
        self,
        measurements: list[BLERangeMeasurement],
        now_ts: float,
        *,
        floor_hints: dict[str, float] | None = None,
        floor_stability_v2: bool | None = None,
    ) -> None:
        """Fuse multi-proxy BLE range measurements via sequential nonlinear EKF updates."""
        valid = [
            m
            for m in measurements
            if m.age_sec <= self.cfg.max_ble_age_sec
            and 0.0 <= m.distance_ft <= self.cfg.max_ble_range_ft
        ]
        self.update_floor(valid, floor_hints=floor_hints, floor_stability_v2=floor_stability_v2)
        on_floor = [m for m in valid if m.floor == self.floor]
        self.last_active_proxies = len(on_floor)
        self.last_rejected_outliers = 0
        if not on_floor:
            return

        if not self.initialized:
            # Cold-start: inverse-distance-squared weighted centroid of closest proxies on floor
            top = sorted(on_floor, key=lambda r: r.distance_ft)[:4]
            w_sum = 0.0
            cx = 0.0
            cy = 0.0
            for m in top:
                w = 1.0 / (max(1.5, m.distance_ft) ** 2)
                cx += w * m.x_px
                cy += w * m.y_px
                w_sum += w
            if w_sum > 0:
                self._init_from_xy(cx / w_sum, cy / w_sum, self.floor, sigma_ft=8.0, now_ts=now_ts)
            return

        self.predict(now_ts)

        # Sequential nonlinear range updates, closest proxies first for best conditioning
        scale = self.cfg.px_per_foot
        for m in sorted(on_floor, key=lambda r: r.distance_ft):
            dx = self.x[0] - m.x_px
            dy = self.x[1] - m.y_px
            pred_dist_px = math.hypot(dx, dy)
            pred_dist_ft = pred_dist_px / scale
            meas_dist_px = max(0.5, m.distance_ft) * scale
            # Evaluate heteroscedastic noise at predicted range so positive multipath spikes cannot self-inflate R
            sigma_ft = (
                self.cfg.ble_sigma_base_ft
                + self.cfg.ble_sigma_dist_slope * pred_dist_ft
                + self.cfg.ble_sigma_age_slope * max(0.0, m.age_sec)
            )
            r_var = (sigma_ft * scale) ** 2

            if pred_dist_px < 1e-3:
                # If state sits right on top of the proxy, fall back to a gentle position pull
                continue
            h_vec = [dx / pred_dist_px, dy / pred_dist_px, 0.0, 0.0]
            innov = meas_dist_px - pred_dist_px
            accepted = self._scalar_ekf_update(h_vec, innov, r_var, gate=True)
            if not accepted:
                self.last_rejected_outliers += 1

    def update_position(
        self,
        x_px: float,
        y_px: float,
        *,
        sigma_ft: float,
        floor: str,
        now_ts: float,
        gate: bool = False,
    ) -> bool:
        """Fuse a direct 2D position observation (Frigate camera sub-zone or PIR centroid)."""
        if not self.initialized:
            self._init_from_xy(x_px, y_px, floor, sigma_ft=sigma_ft, now_ts=now_ts)
            return True
        if floor != self.floor:
            if gate:
                return False
            self.floor = floor
            self._init_from_xy(x_px, y_px, floor, sigma_ft=sigma_ft, now_ts=now_ts)
            return True

        self.predict(now_ts)
        scale = self.cfg.px_per_foot
        r_var = (max(self.cfg.min_sigma_ft, sigma_ft) * scale) ** 2
        if gate:
            dx = float(x_px) - self.x[0]
            dy = float(y_px) - self.x[1]
            dist_ft = math.hypot(dx, dy) / scale
            if dist_ft > self.cfg.assoc_max_dist_ft:
                return False
            # 2-DOF Mahalanobis check using marginal variances
            sx2 = max(1e-6, self.P[0][0] + r_var)
            sy2 = max(1e-6, self.P[1][1] + r_var)
            d2 = (dx * dx) / sx2 + (dy * dy) / sy2
            if d2 > self.cfg.assoc_chi2_2dof:
                return False

        self._scalar_ekf_update([1.0, 0.0, 0.0, 0.0], float(x_px) - self.x[0], r_var, gate=False)
        self._scalar_ekf_update([0.0, 1.0, 0.0, 0.0], float(y_px) - self.x[1], r_var, gate=False)
        return True

    def update_position_gated(
        self,
        x_px: float,
        y_px: float,
        *,
        sigma_ft: float,
        floor: str,
        now_ts: float,
        allow_floor_jump_when_ble_absent: bool = True,
    ) -> bool:
        """Multi-occupant safe position fusion: rejects hits that belong to another person.

        When BLE proxies are actively tracking this person, only camera/PIR detections
        on the same floor and within the 2-DOF Mahalanobis & distance association gate
        are fused. When BLE has 0 active proxies (e.g., Garage), allows unassociated
        snapping so coverage gaps remain seamlessly tracked.
        """
        if not self.initialized:
            self._init_from_xy(x_px, y_px, floor, sigma_ft=sigma_ft, now_ts=now_ts)
            return True

        has_live_ble = self.last_active_proxies > 0
        if floor != self.floor:
            if has_live_ble or not allow_floor_jump_when_ble_absent:
                return False
            return self.update_position(
                x_px, y_px, sigma_ft=sigma_ft, floor=floor, now_ts=now_ts, gate=False
            )

        return self.update_position(
            x_px,
            y_px,
            sigma_ft=sigma_ft,
            floor=floor,
            now_ts=now_ts,
            gate=has_live_ble,
        )

    def compute_room_probabilities(
        self,
        rooms_on_floor: list[dict[str, Any]],
        *,
        lead_sec: float = 0.0,
    ) -> dict[str, float]:
        """Integrate 2D Gaussian N(p + lead*v, P_xy) over axis-aligned room boxes analytically."""
        if not self.initialized or not rooms_on_floor:
            return {}
        px = self.x[0] + lead_sec * self.x[2]
        py = self.x[1] + lead_sec * self.x[3]
        sx = max(self.cfg.min_sigma_ft * self.cfg.px_per_foot, math.sqrt(max(1e-6, self.P[0][0])))
        sy = max(self.cfg.min_sigma_ft * self.cfg.px_per_foot, math.sqrt(max(1e-6, self.P[1][1])))

        raw: dict[str, float] = {}
        total = 0.0
        for r in rooms_on_floor:
            rname = str(r.get("name") or "")
            if not rname or str(r.get("floor") or "") != self.floor:
                continue
            x1 = float(r.get("x", 0.0))
            y1 = float(r.get("y", 0.0))
            x2 = x1 + float(r.get("width", 0.0))
            y2 = y1 + float(r.get("height", 0.0))
            prob_x = max(0.0, _norm_cdf((x2 - px) / sx) - _norm_cdf((x1 - px) / sx))
            prob_y = max(0.0, _norm_cdf((y2 - py) / sy) - _norm_cdf((y1 - py) / sy))
            p_room = prob_x * prob_y
            raw[rname] = p_room
            total += p_room

        if total > 1e-9:
            return {k: round(v / total, 4) for k, v in raw.items()}
        return {k: 0.0 for k in raw}

    def get_estimate(
        self,
        rooms_on_floor: list[dict[str, Any]] | None = None,
        *,
        lead_sec: float = 0.0,
    ) -> KalmanEstimate:
        """Return current position, velocity/heading, uncertainty, and room probabilities."""
        scale = self.cfg.px_per_foot
        vx, vy = self.x[2], self.x[3]
        speed_ft = math.hypot(vx, vy) / scale
        heading_deg = (
            round(math.degrees(math.atan2(vy, vx)) % 360.0, 1) if speed_ft >= 0.35 else None
        )
        sx_ft = round(math.sqrt(max(1e-6, self.P[0][0])) / scale, 2)
        sy_ft = round(math.sqrt(max(1e-6, self.P[1][1])) / scale, 2)
        probs = self.compute_room_probabilities(rooms_on_floor or [], lead_sec=lead_sec)
        top_room = max(probs, key=lambda k: probs[k]) if probs else None
        top_prob = probs[top_room] if top_room is not None else 0.0
        return KalmanEstimate(
            floor=self.floor,
            x_px=round(self.x[0], 1),
            y_px=round(self.x[1], 1),
            vx_px_s=round(vx, 2),
            vy_px_s=round(vy, 2),
            speed_ft_s=round(speed_ft, 2),
            heading_deg=heading_deg,
            sigma_x_ft=sx_ft,
            sigma_y_ft=sy_ft,
            room_probabilities=probs,
            top_room=top_room,
            top_room_prob=round(top_prob, 4),
            active_proxy_count=self.last_active_proxies,
            rejected_outliers=self.last_rejected_outliers,
            initialized=self.initialized,
        )
