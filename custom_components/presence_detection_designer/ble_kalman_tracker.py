"""2D + Floor Extended Kalman Filter (EKF) for multi-proxy BLE trilateration & sensor fusion."""

from __future__ import annotations

import math
import re
import time
from dataclasses import dataclass, field
from typing import Any

# Floorplan coordinate scale (matches spatial_geometry.py default: ~12.5 px per foot)
DEFAULT_PX_PER_FOOT: float = 12.5
FEET_PER_METER: float = 3.28084


@dataclass(frozen=True)
class KalmanConfig:
    """Tunable process, measurement, gating, and floor-hysteresis parameters."""

    px_per_foot: float = DEFAULT_PX_PER_FOOT
    # Process model: human acceleration std-dev (ft/s^2) and velocity damping time constant (s)
    process_accel_ft_s2: float = 1.5
    velocity_tau_sec: float = 2.5
    max_speed_ft_s: float = 10.0
    # BLE heteroscedastic range noise: sigma_ft = base + slope * dist_ft + age_slope * age_sec
    ble_sigma_base_ft: float = 2.2
    ble_sigma_dist_slope: float = 0.16
    ble_sigma_age_slope: float = 0.35
    max_ble_age_sec: float = 15.0
    max_ble_range_ft: float = 45.0
    # Mahalanobis chi-squared gate (1-DOF): 6.63 == 99% confidence (2.58 sigma)
    chi2_gate_1dof: float = 6.63
    # Floor transition hysteresis: competing floor must beat incumbent by this log-likelihood margin
    floor_hysteresis_margin: float = 1.6
    # Cross-floor attenuation penalty (ft) added when a proxy is on another floor
    cross_floor_penalty_ft: float = 10.0
    # Linear measurement noise for Frigate camera sub-zones and fast PIR centroids (ft)
    camera_sigma_ft: float = 2.5
    pir_sigma_ft: float = 6.0
    # Minimum 1-sigma floor (ft) so covariance never collapses to numerical zero
    min_sigma_ft: float = 1.0
    # Multi-occupant 2-DOF Mahalanobis gate (99.5% = 10.60) & max association distance (ft)
    assoc_chi2_2dof: float = 10.60
    assoc_max_dist_ft: float = 16.0
    # Bounded supporting-only EKF likelihood ratio range for Bayesian fusion:
    # max_lr=9.75 (matches calibrated moderate BLE 0.78/0.08): solo posterior <= 63% (< 75% threshold),
    #   yet EKF + Ecobee (~2.4x) = 80.6% (> 75%) to smoothly sustain stationary desk/couch occupancy;
    # min_lr=0.45 -> decays stale holds without overpowering another occupant's decisive camera
    ekf_max_lr: float = 9.75
    ekf_min_lr: float = 0.45


def ekf_room_probability_to_likelihood(
    room_prob: float,
    *,
    sigma_ft: float = 4.0,
    max_lr: float = 9.75,
    min_lr: float = 0.45,
) -> tuple[float, float]:
    """Map continuous EKF room probability [0..1] to bounded supporting Bayesian (p_true, p_false).

    Properties:
    - p = 0.50 (straddling a boundary) -> neutral (0.50, 0.50), LR = 1.0
    - p -> 1.0 (squarely inside room)  -> supporting confirmation up to LR <= max_lr (never solo-triggers)
    - p -> 0.0 (squarely elsewhere)    -> smooth contradiction attenuation down to LR >= min_lr
    - High covariance (large sigma_ft) -> confidence factor tapers smoothly toward neutral (0.50, 0.50)
    """
    p = max(0.0, min(1.0, float(room_prob)))
    # Uncertainty taper: full authority at sigma <= 3 ft, decays smoothly toward 0 as sigma grows
    conf = 1.0 / (1.0 + max(0.0, float(sigma_ft) - 3.0) / 6.0)
    conf = max(0.15, min(1.0, conf))

    # Signed log-likelihood ratio interpolated smoothly across p in [0, 1]
    if p >= 0.5:
        frac = (p - 0.5) / 0.5  # [0, 1]
        log_lr = conf * frac * math.log(max(1.01, float(max_lr)))
    else:
        frac = (0.5 - p) / 0.5  # [0, 1]
        log_lr = -conf * frac * math.log(1.0 / max(0.05, min(0.99, float(min_lr))))

    lr = math.exp(log_lr)
    # Convert symmetric LR to (p_true, p_false) with p_true + p_false = 1 -> p_true / p_false = lr
    p_true = lr / (1.0 + lr)
    p_false = 1.0 / (1.0 + lr)
    return round(max(0.05, min(0.95, p_true)), 3), round(max(0.05, min(0.95, p_false)), 3)


@dataclass(frozen=True)
class BLERangeMeasurement:
    """Single calibrated range reading from one BLE proxy to a tracked device."""

    proxy_id: str
    floor: str
    x_px: float
    y_px: float
    distance_ft: float
    age_sec: float = 0.0
    rssi: float | None = None
    host_room: str = ""


@dataclass
class KalmanEstimate:
    """Output state snapshot from the 2D+Floor EKF."""

    floor: str
    x_px: float
    y_px: float
    vx_px_s: float
    vy_px_s: float
    speed_ft_s: float
    heading_deg: float | None
    sigma_x_ft: float
    sigma_y_ft: float
    room_probabilities: dict[str, float] = field(default_factory=dict)
    top_room: str | None = None
    top_room_prob: float = 0.0
    active_proxy_count: int = 0
    rejected_outliers: int = 0
    initialized: bool = False


def _mat4_mul(a: list[list[float]], b: list[list[float]]) -> list[list[float]]:
    out = [[0.0] * 4 for _ in range(4)]
    for i in range(4):
        ai = a[i]
        oi = out[i]
        for k in range(4):
            aik = ai[k]
            if aik == 0.0:
                continue
            bk = b[k]
            oi[0] += aik * bk[0]
            oi[1] += aik * bk[1]
            oi[2] += aik * bk[2]
            oi[3] += aik * bk[3]
    return out


def _mat4_transpose(a: list[list[float]]) -> list[list[float]]:
    return [[a[j][i] for j in range(4)] for i in range(4)]


def _norm_cdf(z: float) -> float:
    return 0.5 * (1.0 + math.erf(z / math.sqrt(2.0)))


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
    ) -> str:
        """Update discrete floor estimate using hysteretic multi-proxy + PIR/camera log-likelihood."""
        by_floor: dict[str, list[BLERangeMeasurement]] = {}
        for m in ble_ranges:
            if (
                m.age_sec <= self.cfg.max_ble_age_sec
                and 0.0 <= m.distance_ft <= self.cfg.max_ble_range_ft
            ):
                by_floor.setdefault(m.floor, []).append(m)

        scores: dict[str, float] = {}
        for fl, ms in by_floor.items():
            # Score floor by the inverse-distance evidence of its top-2 closest proxies
            ms_sorted = sorted(ms, key=lambda r: r.distance_ft)[:2]
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
    ) -> None:
        """Fuse multi-proxy BLE range measurements via sequential nonlinear EKF updates."""
        valid = [
            m
            for m in measurements
            if m.age_sec <= self.cfg.max_ble_age_sec
            and 0.0 <= m.distance_ft <= self.cfg.max_ble_range_ft
        ]
        self.update_floor(valid, floor_hints=floor_hints)
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


def _norm_token(val: Any) -> str:
    return re.sub(r"[^a-z0-9]+", "_", str(val or "").lower()).strip("_")


def read_bermuda_proxy_ranges(
    hass: Any,
    tracker_entity_id: str,
    floorplan: dict[str, Any] | None,
    now_ts: float,
) -> list[BLERangeMeasurement]:
    """Read live per-proxy calibrated distances from Bermuda's in-memory coordinator."""
    if not hass or not isinstance(floorplan, dict):
        return []
    proxies = floorplan.get("ble_proxies") or []
    if not proxies:
        return []

    # Locate Bermuda's active coordinator via config entries runtime_data
    bermuda_coord = None
    cfg_entries = getattr(hass, "config_entries", None)
    if cfg_entries is not None and hasattr(cfg_entries, "async_entries"):
        for entry in cfg_entries.async_entries("bermuda"):
            rt = getattr(entry, "runtime_data", None)
            coord = getattr(rt, "coordinator", None)
            if coord is not None and hasattr(coord, "devices"):
                bermuda_coord = coord
                break
    if bermuda_coord is None:
        return []

    # Resolve target Bermuda device by MAC, IRK advert MAC, or normalized name/slug
    st_obj = hass.states.get(tracker_entity_id) if hasattr(hass, "states") else None
    st_attrs = getattr(st_obj, "attributes", {}) or {}
    cur_mac = str(st_attrs.get("current_mac") or "").lower()
    friendly_norm = _norm_token(str(st_attrs.get("friendly_name") or "").removesuffix("Area"))
    slug = _norm_token(
        tracker_entity_id.split(".", 1)[-1].replace("_ble_area", "").replace("_area", "")
    )

    target_dev = None
    devices = getattr(bermuda_coord, "devices", {}) or {}
    for addr, dev in devices.items():
        if cur_mac and (
            str(addr).lower() == cur_mac
            or str(getattr(dev, "address", "") or "").lower() == cur_mac
            or any(
                str(getattr(a, "device_address", "") or "").lower() == cur_mac
                for a in (getattr(dev, "adverts", {}) or {}).values()
            )
        ):
            target_dev = dev
            break
    if target_dev is None:
        for _addr, dev in devices.items():
            dev_norm = _norm_token(getattr(dev, "name", ""))
            if not dev_norm:
                continue
            if (friendly_norm and (friendly_norm == dev_norm or dev_norm in friendly_norm)) or (
                slug and (slug in dev_norm or dev_norm in slug)
            ):
                if getattr(dev, "adverts", None):
                    target_dev = dev
                    break
    if target_dev is None:
        return []

    # Index floorplan proxies by normalized id, name, entity_id, and unique host_room/area
    proxy_by_key: dict[str, dict[str, Any]] = {}
    proxies_by_room: dict[str, list[dict[str, Any]]] = {}
    for p in proxies:
        if not isinstance(p, dict):
            continue
        for k in (p.get("id"), p.get("name"), p.get("entity_id")):
            if k:
                raw_k = str(k).replace("esphome.", "").replace("bluetooth.", "")
                norm = _norm_token(raw_k)
                if norm:
                    proxy_by_key[norm] = p
        for rk in (p.get("host_room"), p.get("area_name")):
            rn = _norm_token(rk)
            if rn:
                proxies_by_room.setdefault(rn, []).append(p)

    # Bermuda uses monotonic_time_coarse() for advert.stamp; bridge wall-clock vs monotonic cleanly
    try:
        from bluetooth_data_tools import monotonic_time_coarse

        mono_now = float(monotonic_time_coarse())
    except Exception:  # noqa: BLE001
        mono_now = time.monotonic()

    adverts = getattr(target_dev, "adverts", {}) or {}
    out: list[BLERangeMeasurement] = []
    seen_proxy_ids: set[str] = set()
    for _scanner_key, adv in adverts.items():
        dist_m = getattr(adv, "rssi_distance", None)
        if dist_m is None:
            continue
        scanner_dev = getattr(adv, "scanner_device", None)
        s_name = str(getattr(scanner_dev, "name", "") or getattr(adv, "name", "") or "")
        s_norm = _norm_token(s_name)
        matched_proxy = proxy_by_key.get(s_norm)
        if matched_proxy is None and s_norm:
            for key, p in proxy_by_key.items():
                if key in s_norm or s_norm in key:
                    matched_proxy = p
                    break
        if matched_proxy is None:
            adv_area = _norm_token(
                getattr(adv, "area_name", "") or getattr(scanner_dev, "area_name", "")
            )
            cands = proxies_by_room.get(adv_area) or []
            if len(cands) == 1:
                matched_proxy = cands[0]
            elif cands and s_norm:
                matched_proxy = next(
                    (c for c in cands if _norm_token(c.get("id")) in s_norm), cands[0]
                )
        if matched_proxy is None:
            continue

        pid = str(matched_proxy.get("id", s_norm))
        if pid in seen_proxy_ids:
            continue
        seen_proxy_ids.add(pid)

        stamp = getattr(adv, "stamp", None)
        if stamp is None:
            age = 0.0
        else:
            st_f = float(stamp)
            # Detect monotonic clock (< 1e9) vs epoch wall-clock (> 1e9)
            if float(now_ts) > 1e9 and st_f < 1e9:
                age = max(0.0, mono_now - st_f)
            else:
                age = max(0.0, float(now_ts) - st_f)

        out.append(
            BLERangeMeasurement(
                proxy_id=pid,
                floor=str(matched_proxy.get("floor", "main")),
                x_px=float(matched_proxy.get("x", 0.0)),
                y_px=float(matched_proxy.get("y", 0.0)),
                distance_ft=float(dist_m) * FEET_PER_METER,
                age_sec=age,
                rssi=getattr(adv, "rssi", None),
                host_room=str(matched_proxy.get("host_room", "")),
            )
        )
    return out


class HouseEKFManager:
    """Manage per-tracker 2D+Floor EKF instances and fuse live Bermuda + camera/PIR hits."""

    def __init__(self, config: KalmanConfig | None = None) -> None:
        self.cfg = config or KalmanConfig()
        self.trackers: dict[str, BLEKalmanTracker] = {}

    def get_tracker(self, tracker_entity_id: str) -> BLEKalmanTracker:
        """Return or create a persistent BLEKalmanTracker for `tracker_entity_id`."""
        eid = str(tracker_entity_id).strip()
        if eid not in self.trackers:
            self.trackers[eid] = BLEKalmanTracker(self.cfg)
        return self.trackers[eid]

    def update_from_observations(
        self,
        *,
        tracker_entity_id: str,
        ble_ranges: list[BLERangeMeasurement],
        floorplan: dict[str, Any] | None,
        now_ts: float,
        active_camera_hits: list[tuple[str, float, float]] | None = None,
        active_pir_hits: list[tuple[str, float, float]] | None = None,
        bermuda_area_floor: str | None = None,
    ) -> KalmanEstimate:
        """Update one tracker with BLE ranges + Mahalanobis-gated camera/PIR observations."""
        ekf = self.get_tracker(tracker_entity_id)
        fp = floorplan if isinstance(floorplan, dict) else {}

        # Floor hints: only use Bermuda's own calibrated floor or hits consistent with BLE
        floor_hints: dict[str, float] = {}
        if bermuda_area_floor:
            floor_hints[bermuda_area_floor] = floor_hints.get(bermuda_area_floor, 0.0) + 1.5

        # If BLE has live proxies on at least one floor, do NOT inject unattributed other-floor hints
        live_ble_floors = {
            m.floor
            for m in ble_ranges
            if m.age_sec <= self.cfg.max_ble_age_sec and m.distance_ft <= self.cfg.max_ble_range_ft
        }
        if not live_ble_floors:
            for cfl, _cx, _cy in active_camera_hits or []:
                floor_hints[cfl] = floor_hints.get(cfl, 0.0) + 3.0
            for pfl, _px, _py in active_pir_hits or []:
                floor_hints[pfl] = floor_hints.get(pfl, 0.0) + 1.5

        ekf.update_ble_ranges(ble_ranges, now_ts=now_ts, floor_hints=floor_hints)

        # Fuse camera sub-zones first (tight sigma), gated so other occupants never pull this track
        fused_cam = False
        for cfl, cx, cy in active_camera_hits or []:
            if ekf.update_position_gated(
                cx, cy, sigma_ft=self.cfg.camera_sigma_ft, floor=cfl, now_ts=now_ts
            ):
                fused_cam = True

        # Fuse fast PIR centroids only when no camera snapped this tick (prevents double-pull)
        if not fused_cam:
            for pfl, px, py in active_pir_hits or []:
                ekf.update_position_gated(
                    px, py, sigma_ft=self.cfg.pir_sigma_ft, floor=pfl, now_ts=now_ts
                )

        rooms_on_floor = [
            r
            for r in (fp.get("rooms") or [])
            if isinstance(r, dict) and str(r.get("floor") or "") == ekf.floor
        ]
        return ekf.get_estimate(rooms_on_floor)

    def serialize_tracks(self, floorplan: dict[str, Any] | None) -> dict[str, dict[str, Any]]:
        """Serialize all initialized EKF tracks for API/UI rendering and Bayesian fusion."""
        fp = floorplan if isinstance(floorplan, dict) else {}
        rooms = fp.get("rooms") or []
        out: dict[str, dict[str, Any]] = {}
        for eid, ekf in self.trackers.items():
            if not ekf.initialized:
                continue
            rooms_on_floor = [
                r for r in rooms if isinstance(r, dict) and str(r.get("floor") or "") == ekf.floor
            ]
            est = ekf.get_estimate(rooms_on_floor)
            out[eid] = {
                "entity_id": eid,
                "floor": est.floor,
                "x_px": est.x_px,
                "y_px": est.y_px,
                "vx_px_s": est.vx_px_s,
                "vy_px_s": est.vy_px_s,
                "speed_ft_s": est.speed_ft_s,
                "heading_deg": est.heading_deg,
                "sigma_x_ft": est.sigma_x_ft,
                "sigma_y_ft": est.sigma_y_ft,
                "sigma_x_px": round(est.sigma_x_ft * ekf.cfg.px_per_foot, 1),
                "sigma_y_px": round(est.sigma_y_ft * ekf.cfg.px_per_foot, 1),
                "room_probabilities": est.room_probabilities,
                "top_room": est.top_room,
                "top_room_prob": est.top_room_prob,
                "active_proxy_count": est.active_proxy_count,
                "rejected_outliers": est.rejected_outliers,
            }
        return out


def update_house_ekf_from_hass(
    ekf_manager: HouseEKFManager,
    hass: Any,
    floorplan: dict[str, Any] | None,
    spatial_frame: dict[str, Any] | None,
    now_ts: float,
    tracker_entities: list[str] | tuple[str, ...],
    *,
    ble_ranges_provider: Any = None,
    pir_spillover: dict[str, dict[str, float]] | None = None,
) -> dict[str, dict[str, Any]]:
    """Update all configured BLE EKF tracks from live Bermuda ranges + gated cameras/PIRs."""
    fp = floorplan if isinstance(floorplan, dict) else {}
    if not tracker_entities or not fp.get("rooms"):
        return {}

    states_obj = getattr(hass, "states", None)

    def _is_on(eid: str) -> bool:
        if states_obj is None:
            return False
        st = states_obj.get(eid)
        return st is not None and str(getattr(st, "state", "")).strip().lower() in ("on", "playing")

    # Collect active Frigate sub-zone centroids and fast PIR centroids for gated fusion
    cam_hits: list[tuple[str, float, float]] = []
    for cam in fp.get("cameras") or []:
        if not isinstance(cam, dict):
            continue
        cfl = str(cam.get("floor") or "")
        for sz in cam.get("sub_zones") or []:
            if not isinstance(sz, dict):
                continue
            eid = str(sz.get("entity_id") or "")
            if eid and _is_on(eid):
                cx = float(sz.get("x", 0.0)) + float(sz.get("width", 0.0)) / 2.0
                cy = float(sz.get("y", 0.0)) + float(sz.get("height", 0.0)) / 2.0
                cam_hits.append((cfl, cx, cy))

    from .spatial_catalog import ROOM_DOG_OCCUPANCY_ENTITIES
    from .spatial_topology import compute_pir_spillover_matrix

    pet_active_rooms = {
        r_name
        for r_name, dog_eids in ROOM_DOG_OCCUPANCY_ENTITIES.items()
        if any(_is_on(deid) for deid in dog_eids)
    }
    cam_active_rooms: set[str] = set()
    for cam in fp.get("cameras") or []:
        if not isinstance(cam, dict):
            continue
        chost = str(cam.get("host_room") or "")
        for sz in cam.get("sub_zones") or []:
            if isinstance(sz, dict) and sz.get("entity_id") and _is_on(str(sz["entity_id"])):
                cam_active_rooms.add(str(sz.get("room") or chost))
    if pir_spillover is not None:
        pir_spill = pir_spillover
    else:
        cache_key = (len(fp.get("rooms") or []), len(fp.get("sensors") or []))
        if getattr(ekf_manager, "_pir_spill_key", None) != cache_key:
            ekf_manager._pir_spill_cache = compute_pir_spillover_matrix(fp, min_overlap_pct=5.0)  # type: ignore[attr-defined]
            ekf_manager._pir_spill_key = cache_key  # type: ignore[attr-defined]
        pir_spill = getattr(ekf_manager, "_pir_spill_cache", {})

    pir_hits: list[tuple[str, float, float]] = []
    for sen in fp.get("sensors") or []:
        if not isinstance(sen, dict) or sen.get("sensor_type") != "pir_motion":
            continue
        if "ecobee" in str(sen.get("model_preset") or "").lower():
            continue
        host_r = str(sen.get("host_room") or "")
        if host_r in pet_active_rooms or host_r in cam_active_rooms:
            continue
        eid = str(sen.get("entity_id") or sen.get("id") or "")
        if not eid or not _is_on(eid):
            continue
        if host_r == "Kitchen" and pir_spill.get(eid):
            continue
        # Only fuse fresh PIR rising edges (<= 3s) so 15-30s hardware latches never pin EKF
        st_obj = states_obj.get(eid) if states_obj is not None else None
        lc = getattr(st_obj, "last_changed", None)
        if lc is not None and hasattr(lc, "timestamp"):
            if (now_ts - float(lc.timestamp())) > 3.5:
                continue
        rad = math.radians(float(sen.get("heading_deg", 0.0)))
        range_px = float(sen.get("range_px", 150.0) or 150.0)
        px = float(sen.get("x", 0.0)) + 0.35 * range_px * math.cos(rad)
        py = float(sen.get("y", 0.0)) + 0.35 * range_px * math.sin(rad)
        pir_hits.append((str(sen.get("floor") or ""), px, py))

    # Map room names to floor ids for Bermuda area floor hints
    room_to_floor: dict[str, str] = {
        str(r.get("name")): str(r.get("floor"))
        for r in (fp.get("rooms") or [])
        if isinstance(r, dict) and r.get("name") and r.get("floor")
    }
    raw_ble = (spatial_frame or {}).get("raw_ble_positions") or {}

    from .spatial_catalog import _normalize_ble_area_to_room

    for ble_eid in tracker_entities:
        eid_str = str(ble_eid).strip()
        if not eid_str:
            continue
        if callable(ble_ranges_provider):
            ranges = list(ble_ranges_provider(eid_str, fp, now_ts) or [])
        else:
            ranges = read_bermuda_proxy_ranges(hass, eid_str, fp, now_ts)

        raw_area = raw_ble.get(eid_str)
        if raw_area is None and states_obj is not None:
            st = states_obj.get(eid_str)
            raw_area = getattr(st, "state", None) if st is not None else None
        raw_area_norm = str(raw_area or "").strip().lower()
        if not ranges and raw_area_norm in ("away", "not_home", "unknown", "unavailable"):
            tr_obj = ekf_manager.get_tracker(eid_str)
            if tr_obj.initialized:
                tr_obj.reset()
            continue
        mapped_room = _normalize_ble_area_to_room(raw_area) if raw_area is not None else None
        area_floor = room_to_floor.get(mapped_room) if mapped_room else None

        if not ranges and not ekf_manager.get_tracker(eid_str).initialized:
            continue

        ekf_manager.update_from_observations(
            tracker_entity_id=eid_str,
            ble_ranges=ranges,
            floorplan=fp,
            now_ts=now_ts,
            active_camera_hits=cam_hits,
            active_pir_hits=pir_hits,
            bermuda_area_floor=area_floor,
        )

    return ekf_manager.serialize_tracks(fp)
