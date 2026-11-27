"""House-wide BLE 2D+Floor EKF manager fed by PDD's native HA Bluetooth scanner hub."""

from __future__ import annotations

import math
from typing import Any

from .ble_ekf_core import BLEKalmanTracker
from .ble_ekf_models import (
    DEFAULT_PX_PER_FOOT,
    FEET_PER_METER,
    BLERangeMeasurement,
    KalmanConfig,
    KalmanEstimate,
    ekf_room_probability_to_likelihood,
)
from .ble_scanner_hub import NativeBLEScannerHub
from .spatial_catalog import _normalize_ble_area_to_room

__all__ = [
    "BLEKalmanTracker",
    "BLERangeMeasurement",
    "DEFAULT_PX_PER_FOOT",
    "FEET_PER_METER",
    "HouseEKFManager",
    "KalmanConfig",
    "KalmanEstimate",
    "NativeBLEScannerHub",
    "ekf_room_probability_to_likelihood",
    "update_house_ekf_from_hass",
]


class HouseEKFManager:
    """Manage per-tracker 2D+Floor EKF instances and fuse live native BLE + camera/PIR hits."""

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
        area_floor_hint: str | None = None,
        ekf_floor_stability_v2: bool | None = None,
    ) -> KalmanEstimate:
        """Update one tracker with BLE ranges + Mahalanobis-gated camera/PIR observations."""
        ekf = self.get_tracker(tracker_entity_id)
        fp = floorplan if isinstance(floorplan, dict) else {}
        use_v2 = (
            self.cfg.ekf_floor_stability_v2
            if ekf_floor_stability_v2 is None
            else bool(ekf_floor_stability_v2)
        )

        # If BLE has live proxies on at least one floor, do NOT inject unattributed other-floor hints
        live_ble_floors = {
            m.floor
            for m in ble_ranges
            if m.age_sec <= self.cfg.max_ble_age_sec and m.distance_ft <= self.cfg.max_ble_range_ft
        }

        floor_hints: dict[str, float] = {}
        if area_floor_hint and (not use_v2 or not live_ble_floors):
            # In v2, only use an area-floor hint when live per-proxy ranges are absent
            # (prevents double-counting on top of per-proxy BLE floor scores).
            floor_hints[area_floor_hint] = floor_hints.get(area_floor_hint, 0.0) + 1.5

        if not live_ble_floors:
            for cfl, _cx, _cy in active_camera_hits or []:
                floor_hints[cfl] = floor_hints.get(cfl, 0.0) + 3.0
            for pfl, _px, _py in active_pir_hits or []:
                floor_hints[pfl] = floor_hints.get(pfl, 0.0) + 1.5
        elif use_v2 and ekf.initialized:
            # Incumbent-floor camera corroboration: if a camera on the current floor actively sees
            # an occupant within association range of this track, reinforce holding the current floor
            # (still blocks other-floor unattributed cameras from pulling this track).
            scale = max(1e-6, self.cfg.px_per_foot)
            for cfl, cx, cy in active_camera_hits or []:
                if cfl == ekf.floor:
                    dist_ft = math.hypot(cx - ekf.x[0], cy - ekf.x[1]) / scale
                    if dist_ft <= self.cfg.assoc_max_dist_ft:
                        floor_hints[cfl] = floor_hints.get(cfl, 0.0) + 2.5
                        break

        ekf.update_ble_ranges(
            ble_ranges,
            now_ts=now_ts,
            floor_hints=floor_hints,
            floor_stability_v2=use_v2,
        )

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
    ble_hub: NativeBLEScannerHub | None = None,
    ble_ranges_provider: Any = None,
    pir_spillover: dict[str, dict[str, float]] | None = None,
    ekf_floor_stability_v2: bool | None = None,
) -> dict[str, dict[str, Any]]:
    """Update all tracked BLE EKF instances from native HA Bluetooth ranges + gated cameras/PIRs."""
    fp = floorplan if isinstance(floorplan, dict) else {}
    if not fp.get("rooms"):
        return {}

    hub = ble_hub if ble_hub is not None else getattr(ekf_manager, "_ble_hub", None)
    if hub is None:
        hub = NativeBLEScannerHub()
        ekf_manager._ble_hub = hub  # type: ignore[attr-defined]

    # Single-pass native BLE ingestion when no custom provider override is supplied
    native_ranges_by_tracker: dict[str, list[BLERangeMeasurement]] = {}
    if callable(ble_ranges_provider):
        active_trackers = [str(e).strip() for e in (tracker_entities or ()) if str(e).strip()]
    else:
        active_trackers, native_ranges_by_tracker = hub.collect_proxy_ranges(
            hass, fp, now_ts, tracker_entities
        )
    if not active_trackers:
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

    # Map room names to floor ids for optional area-floor hints
    room_to_floor: dict[str, str] = {
        str(r.get("name")): str(r.get("floor"))
        for r in (fp.get("rooms") or [])
        if isinstance(r, dict) and r.get("name") and r.get("floor")
    }
    raw_ble = (spatial_frame or {}).get("raw_ble_positions") or {}

    for ble_eid in active_trackers:
        eid_str = str(ble_eid).strip()
        if not eid_str:
            continue
        if callable(ble_ranges_provider):
            ranges = list(ble_ranges_provider(eid_str, fp, now_ts) or [])
        else:
            ranges = list(native_ranges_by_tracker.get(eid_str) or [])

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
            area_floor_hint=area_floor,
            ekf_floor_stability_v2=ekf_floor_stability_v2,
        )

    return ekf_manager.serialize_tracks(fp)
