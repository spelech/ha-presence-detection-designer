"""Unit tests for the 2D + Floor Extended Kalman Filter BLE trilateration tracker."""

from __future__ import annotations

import math
from types import SimpleNamespace
from unittest.mock import MagicMock

from custom_components.presence_detection_designer.ble_kalman_tracker import (
    BLEKalmanTracker,
    BLERangeMeasurement,
    HouseEKFManager,
    KalmanConfig,
    ekf_room_probability_to_likelihood,
    read_bermuda_proxy_ranges,
)
from custom_components.presence_detection_designer.spatial_topology import get_default_floorplan


def _dist_ft(x1: float, y1: float, x2: float, y2: float, scale: float = 12.5) -> float:
    return math.hypot(x1 - x2, y1 - y2) / scale


def test_ekf_stationary_trilateration_converges_to_true_position():
    """Three non-collinear BLE proxies converge the EKF to within 1.5 ft of ground truth."""
    cfg = KalmanConfig(px_per_foot=12.5)
    ekf = BLEKalmanTracker(cfg)
    proxies = [
        ("p1", 150.0, 150.0),
        ("p2", 550.0, 150.0),
        ("p3", 350.0, 450.0),
    ]
    true_x, true_y = 380.0, 240.0

    for t in range(1, 25):
        meas = [
            BLERangeMeasurement(
                proxy_id=pid,
                floor="main",
                x_px=px,
                y_px=py,
                distance_ft=_dist_ft(true_x, true_y, px, py, cfg.px_per_foot),
            )
            for pid, px, py in proxies
        ]
        ekf.update_ble_ranges(meas, now_ts=float(t))

    est = ekf.get_estimate()
    err_ft = _dist_ft(est.x_px, est.y_px, true_x, true_y, cfg.px_per_foot)
    assert est.initialized is True
    assert err_ft < 1.5
    assert est.sigma_x_ft < 3.5
    assert est.sigma_y_ft < 3.5
    assert est.speed_ft_s < 0.5


def test_ekf_tracks_walking_velocity_and_heading():
    """Walking east across main floor produces accurate position and ~0 deg heading."""
    cfg = KalmanConfig(px_per_foot=12.5)
    ekf = BLEKalmanTracker(cfg)
    proxies = [
        ("living", 210.0, 410.0),
        ("dining", 160.0, 190.0),
        ("family", 680.0, 200.0),
        ("nfc_fam", 620.0, 140.0),
    ]
    # Walk East at 3.0 ft/s (37.5 px/s) from x=200 to x=650 along y=220
    for t in range(13):
        tx = 200.0 + 37.5 * t
        ty = 220.0
        meas = [
            BLERangeMeasurement(
                proxy_id=pid,
                floor="main",
                x_px=px,
                y_px=py,
                distance_ft=_dist_ft(tx, ty, px, py, cfg.px_per_foot),
            )
            for pid, px, py in proxies
        ]
        ekf.update_ble_ranges(meas, now_ts=float(t))

    est = ekf.get_estimate()
    assert est.speed_ft_s > 1.0
    assert est.heading_deg is not None
    # East is 0 deg (allow wraparound 330..360 or 0..30)
    ang_err = min(est.heading_deg, 360.0 - est.heading_deg)
    assert ang_err < 25.0


def test_ekf_mahalanobis_gate_rejects_multipath_spike():
    """A single wild 35-ft multipath spike is rejected without yanking the EKF."""
    cfg = KalmanConfig(px_per_foot=12.5)
    ekf = BLEKalmanTracker(cfg)
    proxies = [
        ("p1", 150.0, 150.0),
        ("p2", 550.0, 150.0),
        ("p3", 350.0, 450.0),
    ]
    true_x, true_y = 350.0, 220.0

    for t in range(1, 20):
        meas = [
            BLERangeMeasurement(
                proxy_id=pid,
                floor="main",
                x_px=px,
                y_px=py,
                distance_ft=_dist_ft(true_x, true_y, px, py, cfg.px_per_foot),
            )
            for pid, px, py in proxies
        ]
        ekf.update_ble_ranges(meas, now_ts=float(t))

    before = ekf.get_estimate()
    # Inject massive 38-ft outlier on p1 while p2 & p3 stay clean
    spiked = [
        BLERangeMeasurement("p1", "main", 150.0, 150.0, 38.0),
        BLERangeMeasurement("p2", "main", 550.0, 150.0, _dist_ft(true_x, true_y, 550.0, 150.0)),
        BLERangeMeasurement("p3", "main", 350.0, 450.0, _dist_ft(true_x, true_y, 350.0, 450.0)),
    ]
    ekf.update_ble_ranges(spiked, now_ts=20.0)
    after = ekf.get_estimate()
    assert after.rejected_outliers >= 1
    assert _dist_ft(before.x_px, before.y_px, after.x_px, after.y_px) < 1.0


def test_ekf_camera_snap_collapses_uncertainty_and_room_probabilities():
    """Camera position update collapses covariance and yields high room probability."""
    fp = get_default_floorplan()
    main_rooms = [r for r in fp["rooms"] if r["floor"] == "main"]
    ekf = BLEKalmanTracker()

    # Initialize roughly near Kitchen/Family Room border with large uncertainty
    ekf.update_position(520.0, 190.0, sigma_ft=10.0, floor="main", now_ts=1.0)
    est_wide = ekf.get_estimate(main_rooms)
    assert est_wide.room_probabilities["Kitchen"] > 0.2
    assert est_wide.room_probabilities["Family Room"] > 0.2

    # Frigate kitchen_island person sub-zone snaps cleanly inside Kitchen (390, 180)
    ekf.update_position(390.0, 180.0, sigma_ft=2.5, floor="main", now_ts=2.0)
    est_tight = ekf.get_estimate(main_rooms)
    assert est_tight.top_room == "Kitchen"
    assert est_tight.top_room_prob > 0.85
    assert est_tight.sigma_x_ft < est_wide.sigma_x_ft


def test_ekf_floor_hysteresis_resists_single_tick_vertical_bleed():
    """Single-tick cross-floor bleed does not yank floor away from established upstairs lock."""
    ekf = BLEKalmanTracker()
    for t in range(1, 6):
        ekf.update_ble_ranges(
            [
                BLERangeMeasurement("office_speaker", "upstairs", 765.0, 400.0, 3.0),
                BLERangeMeasurement("upstairs_bt_proxy", "upstairs", 730.0, 320.0, 5.0),
            ],
            now_ts=float(t),
        )
    assert ekf.floor == "upstairs"

    # Single-tick bleed from family_room_speaker downstairs while upstairs still visible
    ekf.update_ble_ranges(
        [
            BLERangeMeasurement("office_speaker", "upstairs", 765.0, 400.0, 6.0),
            BLERangeMeasurement("family_room_speaker", "main", 680.0, 200.0, 5.5),
        ],
        now_ts=6.0,
    )
    assert ekf.floor == "upstairs"


def test_read_bermuda_proxy_ranges_from_runtime_data():
    """read_bermuda_proxy_ranges maps Bermuda adverts to floorplan proxy coordinates."""
    fp = get_default_floorplan()
    adv = SimpleNamespace(
        rssi_distance=2.0,  # 2 meters == 6.56 ft
        rssi=-62,
        stamp=999.0,
        scanner_device=SimpleNamespace(name="office_speaker"),
    )
    dev = SimpleNamespace(name="Steve's S25+ (BLE)", adverts={"aa:bb": adv})
    bermuda_entry = SimpleNamespace(
        runtime_data=SimpleNamespace(coordinator=SimpleNamespace(devices={"11:22:33": dev}))
    )
    hass = MagicMock()
    hass.config_entries.async_entries.return_value = [bermuda_entry]
    hass.states.get.return_value = SimpleNamespace(
        state="Office", attributes={"current_mac": "11:22:33"}
    )

    ranges = read_bermuda_proxy_ranges(hass, "sensor.steve_s_s25_ble_area", fp, now_ts=1000.0)
    assert len(ranges) == 1
    assert ranges[0].proxy_id == "office_speaker"
    assert ranges[0].floor == "upstairs"
    assert abs(ranges[0].distance_ft - 6.56) < 0.05
    assert ranges[0].age_sec == 1.0


def test_ekf_multi_occupant_gating_ignores_distant_person():
    """Margot triggering upstairs or in Family Room must not pull Steve's Kitchen EKF track."""
    fp = get_default_floorplan()
    mgr = HouseEKFManager()

    # Steve is cleanly tracked in Kitchen on main floor via BLE proxies
    kitchen_x, kitchen_y = 390.0, 180.0
    main_proxies = [p for p in fp["ble_proxies"] if p["floor"] == "main"]
    for t in range(1, 12):
        meas = [
            BLERangeMeasurement(
                proxy_id=p["id"],
                floor="main",
                x_px=float(p["x"]),
                y_px=float(p["y"]),
                distance_ft=_dist_ft(kitchen_x, kitchen_y, float(p["x"]), float(p["y"])),
            )
            for p in main_proxies
        ]
        # Simultaneously, Margot sits in Margot's Room (upstairs) and triggers a distant Family Room camera
        est = mgr.update_from_observations(
            tracker_entity_id="sensor.steve_s_s25_ble_area",
            ble_ranges=meas,
            floorplan=fp,
            now_ts=float(t),
            active_camera_hits=[("upstairs", 460.0, 120.0), ("main", 720.0, 220.0)],
        )

    assert est.floor == "main"
    assert est.top_room == "Kitchen"
    assert _dist_ft(est.x_px, est.y_px, kitchen_x, kitchen_y) < 3.0


def test_ekf_room_probability_to_likelihood_is_smooth_and_bounded():
    """Continuous EKF probability maps smoothly to supporting-only bounded Bayesian likelihoods."""
    # Straddling a border -> neutral (0.50, 0.50)
    pt_mid, pf_mid = ekf_room_probability_to_likelihood(0.50, sigma_ft=3.0)
    assert pt_mid == 0.5
    assert pf_mid == 0.5

    # High confidence inside room -> bounded positive confirmation (LR <= 9.75, never solo-trigger)
    pt_hi, pf_hi = ekf_room_probability_to_likelihood(0.98, sigma_ft=2.5)
    lr_hi = pt_hi / pf_hi
    assert 6.0 < lr_hi <= 10.0

    # High confidence elsewhere -> smooth contradiction attenuation (LR >= 0.45 so cameras stay safe)
    pt_lo, pf_lo = ekf_room_probability_to_likelihood(0.02, sigma_ft=2.5)
    lr_lo = pt_lo / pf_lo
    assert 0.42 <= lr_lo <= 0.55

    # Large uncertainty tapers toward neutral
    pt_unc, pf_unc = ekf_room_probability_to_likelihood(0.95, sigma_ft=14.0)
    assert (pt_unc / pf_unc) < lr_hi


def test_read_bermuda_proxy_ranges_handles_irk_mac_and_monotonic_stamp():
    """Live Bermuda IRK devices with monotonic_time_coarse stamps produce fresh ranges."""
    import time

    fp = get_default_floorplan()
    mono_stamp = time.monotonic() - 2.0
    adv = SimpleNamespace(
        device_address="73:09:e8:e6:be:a4",
        rssi_distance=1.5,
        rssi=-58,
        stamp=mono_stamp,
        area_name="Master Bedroom",
        scanner_device=SimpleNamespace(name="Master Bedroom Speaker", area_name="Master Bedroom"),
    )
    dev = SimpleNamespace(
        name="Steve's S25+ (BLE)", address="irk_abc123", adverts={("x", "y"): adv}
    )
    bermuda_entry = SimpleNamespace(
        runtime_data=SimpleNamespace(coordinator=SimpleNamespace(devices={"irk_abc123": dev}))
    )
    hass = MagicMock()
    hass.config_entries.async_entries.return_value = [bermuda_entry]
    hass.states.get.return_value = SimpleNamespace(
        state="Master Bedroom",
        attributes={"current_mac": "73:09:e8:e6:be:a4", "friendly_name": "Steve's S25+ (BLE) Area"},
    )

    ranges = read_bermuda_proxy_ranges(hass, "sensor.steve_s_s25_ble_area", fp, now_ts=1795665580.0)
    assert len(ranges) == 1
    assert ranges[0].proxy_id == "master_bedroom_speaker"
    assert ranges[0].age_sec < 5.0


def test_ekf_floor_stability_v2_prevents_2proxy_count_bias():
    """With v2 enabled, 2 slightly farther upstairs proxies cannot overpower 1 main-floor proxy."""
    # v2 enabled (default): 1 main proxy at 3.5 ft holds against 2 upstairs proxies at 3.3 + 4.0 ft
    ekf_v2 = BLEKalmanTracker(KalmanConfig(ekf_floor_stability_v2=True))
    init_main = [BLERangeMeasurement("lr_spk", "main", 210.0, 410.0, 3.5)]
    for t in range(1, 6):
        ekf_v2.update_ble_ranges(init_main, now_ts=float(t))
    assert ekf_v2.floor == "main"

    contested = [
        BLERangeMeasurement("lr_spk", "main", 210.0, 410.0, 3.5),
        BLERangeMeasurement("mb_nfc", "upstairs", 210.0, 410.0, 3.3),
        BLERangeMeasurement("up_pxy", "upstairs", 260.0, 410.0, 3.6),
    ]
    for t in range(6, 15):
        ekf_v2.update_ble_ranges(contested, now_ts=float(t))
    assert ekf_v2.floor == "main"

    # Legacy v1 (toggle off): 2-proxy sum on upstairs beats 1-proxy main and flips floors
    ekf_v1 = BLEKalmanTracker(KalmanConfig(ekf_floor_stability_v2=False))
    for t in range(1, 6):
        ekf_v1.update_ble_ranges(init_main, now_ts=float(t))
    for t in range(6, 15):
        ekf_v1.update_ble_ranges(contested, now_ts=float(t))
    assert ekf_v1.floor == "upstairs"


def test_ekf_floor_stability_v2_no_bermuda_double_count_and_camera_hold():
    """With v2 enabled, Bermuda area bounce is not double-counted and incumbent camera holds floor."""
    fp = get_default_floorplan()
    mgr = HouseEKFManager(KalmanConfig(ekf_floor_stability_v2=True))
    tid = "sensor.steve_s_s25_ble_area"

    # Establish track on main floor in Living Room (near x=210, y=410)
    main_ble = [BLERangeMeasurement("lr_spk", "main", 210.0, 410.0, 4.0)]
    for t in range(1, 6):
        mgr.update_from_observations(
            tracker_entity_id=tid,
            ble_ranges=main_ble,
            floorplan=fp,
            now_ts=float(t),
            active_camera_hits=[("main", 215.0, 405.0)],
            bermuda_area_floor="main",
        )
    assert mgr.get_tracker(tid).floor == "main"

    # Bermuda area bounces to upstairs + weak upstairs BLE, while Living Room camera still sees occupant
    noisy = [
        BLERangeMeasurement("lr_spk", "main", 210.0, 410.0, 6.0),
        BLERangeMeasurement("mb_nfc", "upstairs", 210.0, 410.0, 3.0),
    ]
    for t in range(6, 15):
        mgr.update_from_observations(
            tracker_entity_id=tid,
            ble_ranges=noisy,
            floorplan=fp,
            now_ts=float(t),
            active_camera_hits=[("main", 215.0, 405.0)],
            bermuda_area_floor="upstairs",
        )
    assert mgr.get_tracker(tid).floor == "main"

    # Unattributed camera on another floor must NOT pull the track while live BLE is present
    for t in range(15, 22):
        mgr.update_from_observations(
            tracker_entity_id=tid,
            ble_ranges=main_ble,
            floorplan=fp,
            now_ts=float(t),
            active_camera_hits=[("upstairs", 215.0, 405.0)],
            bermuda_area_floor="main",
        )
    assert mgr.get_tracker(tid).floor == "main"
