"""Native HA Bluetooth scanner hub feeding raw per-proxy RSSI ranges into PDD's EKF."""

from __future__ import annotations

import logging
import re
import time
from typing import Any

from .ble_calibration import (
    get_scanner_adapter,
    resolve_calibration_params,
    rssi_to_distance_ft,
)
from .ble_ekf_models import BLERangeMeasurement
from .ble_irk_resolver import BLEIrkResolver, is_valid_mac, normalize_mac, parse_irk

_LOGGER = logging.getLogger(__name__)
_PRUNE_INTERVAL_SEC = 60.0


def _norm_token(val: Any) -> str:
    return re.sub(r"[^a-z0-9]+", "_", str(val or "").lower()).strip("_")


def _monotonic_now() -> float:
    try:
        from bluetooth_data_tools import monotonic_time_coarse

        return float(monotonic_time_coarse())
    except Exception:  # noqa: BLE001
        return time.monotonic()


def _parse_manual_tracker_spec(resolver: BLEIrkResolver, spec: str) -> str | None:
    """Parse a manual tracker spec (MAC, irk:<hex>, ibeacon:<uuid>[:maj[:min]]) if applicable."""
    raw = str(spec or "").strip()
    if not raw:
        return None

    # Optional "label=spec" prefix for friendly naming of manual IRKs/MACs/iBeacons
    label: str | None = None
    body = raw
    if "=" in raw:
        lhs, rhs = raw.split("=", 1)
        if lhs.strip() and rhs.strip():
            label = lhs.strip()
            body = rhs.strip()

    low = body.lower()
    if low.startswith("irk:"):
        irk_hex = body[4:].strip()
        tid = label or f"ble_irk_{irk_hex[:8].lower()}"
        return tid if resolver.register_irk(tid, irk_hex, aliases=(raw,)) else None

    if low.startswith("mac:"):
        mac_str = body[4:].strip()
        tid = label or f"ble_{normalize_mac(mac_str).replace(':', '')}"
        return tid if resolver.register_static_mac(tid, mac_str, aliases=(raw,)) else None

    if low.startswith("ibeacon:"):
        parts = [p.strip() for p in body[8:].split(":") if p.strip()]
        if not parts:
            return None
        b_uuid = parts[0]
        major = int(parts[1]) if len(parts) >= 2 and parts[1].isdigit() else None
        minor = int(parts[2]) if len(parts) >= 3 and parts[2].isdigit() else None
        tid = label or f"ibeacon_{b_uuid[:8].lower()}"
        return (
            tid
            if resolver.register_ibeacon(tid, b_uuid, major=major, minor=minor, aliases=(raw,))
            else None
        )

    if is_valid_mac(body):
        tid = label or f"ble_{normalize_mac(body).replace(':', '')}"
        return tid if resolver.register_static_mac(tid, body, aliases=(raw,)) else None

    if parse_irk(body) is not None:
        tid = label or f"ble_irk_{body[:8].lower()}"
        return tid if resolver.register_irk(tid, body, aliases=(raw,)) else None

    return None


def _get_ha_scanners(hass: Any) -> list[Any]:
    """Return active HA Bluetooth scanners from HA's Bluetooth manager."""
    if hass is None:
        return []
    try:
        from homeassistant.components.bluetooth.api import _get_manager

        mgr = _get_manager(hass)
        if mgr is not None and hasattr(mgr, "async_current_scanners"):
            scanners = mgr.async_current_scanners()
            if scanners is not None:
                return list(scanners)
    except Exception:  # noqa: BLE001
        pass
    try:
        from homeassistant.components import bluetooth

        if hasattr(bluetooth, "async_current_scanners"):
            scanners = bluetooth.async_current_scanners(hass)
            if scanners is not None:
                return list(scanners)
    except Exception:  # noqa: BLE001
        pass
    return []


def _resolve_scanner_device_info(hass: Any, scanner: Any) -> tuple[list[str], str]:
    """Resolve scanner's Device Registry names and Area Registry name."""
    dev_names: list[str] = []
    direct_area = getattr(scanner, "area_name", None)
    area_name = direct_area.strip() if isinstance(direct_area, str) and direct_area.strip() else ""
    if hass is None:
        return dev_names, area_name
    src = str(getattr(scanner, "source", "") or "").strip()
    if not src:
        return dev_names, area_name
    try:
        from homeassistant.helpers import area_registry as ar
        from homeassistant.helpers import device_registry as dr

        dev_reg = dr.async_get(hass)
        area_reg = ar.async_get(hass)
        if dev_reg is None:
            return dev_names, area_name
        dev = dev_reg.async_get_device(connections={(dr.CONNECTION_BLUETOOTH, src.upper())})
        if dev is None:
            dev = dev_reg.async_get_device(connections={(dr.CONNECTION_NETWORK_MAC, src.lower())})
        if dev is not None:
            for attr in ("name_by_user", "name"):
                val = getattr(dev, attr, None)
                if isinstance(val, str) and val.strip():
                    cleaned = re.sub(r"\s*\([0-9A-Fa-f:]{17}\)\s*$", "", val.strip())
                    if cleaned and cleaned not in dev_names:
                        dev_names.append(cleaned)
            if not area_name and area_reg is not None:
                area_id = getattr(dev, "area_id", None)
                if area_id:
                    area = area_reg.async_get_area(area_id)
                    if area is not None and getattr(area, "name", None):
                        area_name = str(area.name)
    except Exception:  # noqa: BLE001
        pass
    return dev_names, area_name


def _index_floorplan_proxies(
    floorplan: dict[str, Any] | None,
) -> tuple[dict[str, dict[str, Any]], dict[str, dict[str, Any]], dict[str, list[dict[str, Any]]]]:
    """Build fast lookup tables from scanner source/name/area to floorplan `ble_proxies`."""
    by_source: dict[str, dict[str, Any]] = {}
    by_key: dict[str, dict[str, Any]] = {}
    by_room: dict[str, list[dict[str, Any]]] = {}
    if not isinstance(floorplan, dict):
        return by_source, by_key, by_room

    for proxy in floorplan.get("ble_proxies") or []:
        if not isinstance(proxy, dict):
            continue
        src = str(proxy.get("scanner_source") or "").strip().lower()
        if src:
            by_source[src] = proxy
            if is_valid_mac(src):
                by_source[normalize_mac(src)] = proxy
        for k in (proxy.get("id"), proxy.get("name"), proxy.get("entity_id")):
            if k:
                raw_k = str(k).replace("esphome.", "").replace("bluetooth.", "")
                norm = _norm_token(raw_k)
                if norm:
                    by_key[norm] = proxy
        for rk in (proxy.get("host_room"), proxy.get("area_name")):
            rn = _norm_token(rk)
            if rn:
                by_room.setdefault(rn, []).append(proxy)
    return by_source, by_key, by_room


def _match_scanner_to_proxy(
    hass: Any,
    scanner: Any,
    by_source: dict[str, dict[str, Any]],
    by_key: dict[str, dict[str, Any]],
    by_room: dict[str, list[dict[str, Any]]],
) -> dict[str, Any] | None:
    """Match an HA BaseHaScanner to a configured floorplan BLE proxy."""
    src = str(getattr(scanner, "source", "") or "").strip().lower()
    if src:
        if src in by_source:
            return by_source[src]
        norm_src = normalize_mac(src) if is_valid_mac(src) else src
        if norm_src in by_source:
            return by_source[norm_src]

    s_name = str(getattr(scanner, "name", "") or "")
    dev_names, area_name = _resolve_scanner_device_info(hass, scanner)
    candidate_norms = [n for n in (_norm_token(x) for x in [s_name, *dev_names]) if n]

    for c_norm in candidate_norms:
        if c_norm in by_key:
            return by_key[c_norm]
    for c_norm in candidate_norms:
        for key, proxy in by_key.items():
            if len(key) >= 4 and (key in c_norm or c_norm in key):
                return proxy

    s_area = _norm_token(area_name)
    if s_area:
        cands = by_room.get(s_area) or []
        if len(cands) == 1:
            return cands[0]
        if cands and candidate_norms:
            for c_norm in candidate_norms:
                hit = next(
                    (
                        c
                        for c in cands
                        if _norm_token(c.get("id")) in c_norm
                        or c_norm in _norm_token(c.get("name"))
                    ),
                    None,
                )
                if hit is not None:
                    return hit
            return cands[0]
    return None


class NativeBLEScannerHub:
    """Single-pass native HA Bluetooth ingestion hub for PDD's 2D+Floor EKF."""

    def __init__(self, resolver: BLEIrkResolver | None = None) -> None:
        self.resolver = resolver or BLEIrkResolver()
        self._last_prune_mono: float = 0.0

    def sync_trackers(
        self,
        hass: Any,
        tracker_specs: list[str] | tuple[str, ...] | None = None,
    ) -> list[str]:
        """Auto-discover `private_ble_device` IRKs and parse any manual tracker specs."""
        auto_ids = self.resolver.sync_private_ble_devices(hass)
        raw_specs = [str(s).strip() for s in (tracker_specs or ()) if str(s).strip()]

        if not raw_specs:
            # Option A: when ble_trackers is empty, auto-track all private_ble_device entries
            return list(dict.fromkeys(auto_ids or list(self.resolver.registered_tracker_ids)))

        active: list[str] = []
        matched_any = False
        for spec in raw_specs:
            manual_tid = _parse_manual_tracker_spec(self.resolver, spec)
            if manual_tid is not None:
                matched_any = True
                if manual_tid not in active:
                    active.append(manual_tid)
                continue
            aliased = self.resolver.resolve_alias(spec)
            if aliased is not None:
                matched_any = True
                if aliased not in active:
                    active.append(aliased)
            elif spec not in active:
                active.append(spec)
        if not matched_any and auto_ids:
            # Graceful migration: stale legacy entity IDs (e.g. removed sensor.*_ble_area)
            # fall back to auto-discovered private_ble_device entries rather than tracking nothing.
            return list(dict.fromkeys(auto_ids))
        return active

    def collect_proxy_ranges(
        self,
        hass: Any,
        floorplan: dict[str, Any] | None,
        now_ts: float,
        tracker_specs: list[str] | tuple[str, ...] | None = None,
        *,
        device_overrides: dict[str, dict[str, Any]] | None = None,
        scanners_override: list[Any] | None = None,
        now_mono_override: float | None = None,
    ) -> tuple[list[str], dict[str, list[BLERangeMeasurement]]]:
        """Collect raw calibrated per-proxy ranges for all active trackers in a single pass."""
        active_trackers = self.sync_trackers(hass, tracker_specs)
        if not active_trackers or not isinstance(floorplan, dict):
            return active_trackers, {}

        by_source, by_key, by_room = _index_floorplan_proxies(floorplan)
        if not by_source and not by_key and not by_room:
            return active_trackers, {}

        scanners = scanners_override if scanners_override is not None else _get_ha_scanners(hass)
        if not scanners:
            return active_trackers, {}

        now_mono = _monotonic_now() if now_mono_override is None else float(now_mono_override)
        if (now_mono - self._last_prune_mono) >= _PRUNE_INTERVAL_SEC:
            self.resolver.prune(now_mono)
            self._last_prune_mono = now_mono

        active_set = set(active_trackers)
        overrides_map = device_overrides if isinstance(device_overrides, dict) else {}
        ranges_by_tracker: dict[str, list[BLERangeMeasurement]] = {t: [] for t in active_trackers}
        seen_per_tracker: dict[str, set[str]] = {t: set() for t in active_trackers}

        for scanner in scanners:
            proxy = _match_scanner_to_proxy(hass, scanner, by_source, by_key, by_room)
            if proxy is None:
                continue
            pid = str(proxy.get("id") or _norm_token(getattr(scanner, "name", "")))
            quirk_name = str(proxy.get("quirk_profile") or "standard").strip().lower()
            adapter = get_scanner_adapter(quirk_name)

            discovered = getattr(scanner, "discovered_devices_and_advertisement_data", None) or {}
            stamps = getattr(scanner, "discovered_device_timestamps", None) or {}

            for ble_dev, adv_data in discovered.values():
                raw_addr = str(getattr(ble_dev, "address", "") or "")
                stamp = stamps.get(raw_addr)
                if stamp is None and raw_addr:
                    stamp = stamps.get(raw_addr.upper()) or stamps.get(raw_addr.lower())
                norm_adv = adapter(scanner, ble_dev, adv_data, stamp, now_mono)
                if norm_adv is None:
                    continue

                tid = self.resolver.resolve(
                    norm_adv.address,
                    manufacturer_data=norm_adv.manufacturer_data,
                    now_mono=now_mono,
                )
                if tid is None or tid not in active_set:
                    continue
                if pid in seen_per_tracker[tid]:
                    continue
                seen_per_tracker[tid].add(pid)

                ref_power, attenuation, rssi_offset, _ = resolve_calibration_params(
                    proxy, overrides_map.get(tid)
                )
                dist_ft = rssi_to_distance_ft(
                    norm_adv.rssi,
                    ref_power=ref_power,
                    attenuation=attenuation,
                    rssi_offset=rssi_offset,
                )
                age_sec = max(0.0, now_mono - norm_adv.stamp_mono)
                ranges_by_tracker[tid].append(
                    BLERangeMeasurement(
                        proxy_id=pid,
                        floor=str(proxy.get("floor", "main")),
                        x_px=float(proxy.get("x", 0.0)),
                        y_px=float(proxy.get("y", 0.0)),
                        distance_ft=dist_ft,
                        age_sec=age_sec,
                        rssi=norm_adv.rssi,
                        host_room=str(proxy.get("host_room", "")),
                    )
                )

        return active_trackers, ranges_by_tracker
