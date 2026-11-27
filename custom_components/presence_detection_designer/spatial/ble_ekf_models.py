"""2D + Floor Extended Kalman Filter (EKF) for multi-proxy BLE trilateration & sensor fusion."""

from __future__ import annotations

import math
from dataclasses import dataclass, field

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
    # Feature toggle: v2 floor scoring removes 2-proxy count bias, avoids double-counting
    # Bermuda area floor when live per-proxy ranges exist, and allows incumbent-floor camera hold.
    ekf_floor_stability_v2: bool = True


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
