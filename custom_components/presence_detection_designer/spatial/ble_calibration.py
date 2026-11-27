"""BLE RSSI-to-distance calibration and pluggable scanner quirk adapters."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from .ble_ekf_models import FEET_PER_METER

DEFAULT_REF_POWER = -55.0
DEFAULT_ATTENUATION = 3.0
MIN_VALID_RSSI = -126.0
MAX_VALID_RSSI = 10.0
MIN_DISTANCE_M = 0.1
MAX_DISTANCE_M = 50.0


@dataclass(frozen=True, slots=True)
class NormalizedAdvert:
    """Normalized raw BLE advertisement ready for IRK resolution and calibration."""

    scanner_source: str
    scanner_name: str
    scanner_area: str
    address: str
    rssi: float
    stamp_mono: float
    manufacturer_data: dict[int, bytes]
    tx_power: float | None = None


ScannerAdapter = Callable[
    [Any, Any, Any, float | None, float],
    NormalizedAdvert | None,
]


def standard_scanner_adapter(
    scanner: Any,
    ble_device: Any,
    adv_data: Any,
    stamp_mono: float | None,
    now_mono: float,
) -> NormalizedAdvert | None:
    """Default adapter for standard HA Bluetooth scanners (ESPHome proxies, etc.)."""
    raw_rssi = getattr(adv_data, "rssi", None)
    if raw_rssi is None:
        return None
    try:
        rssi = float(raw_rssi)
    except (TypeError, ValueError):
        return None
    if rssi < MIN_VALID_RSSI or rssi > MAX_VALID_RSSI:
        return None

    address = str(getattr(ble_device, "address", "") or "").strip()
    if not address:
        return None

    raw_tx = getattr(adv_data, "tx_power", None)
    tx_power: float | None = None
    if raw_tx is not None:
        try:
            tx_val = float(raw_tx)
            if -100.0 <= tx_val <= 20.0:
                tx_power = tx_val
        except (TypeError, ValueError):
            tx_power = None

    mfr = getattr(adv_data, "manufacturer_data", None)
    mfr_dict = dict(mfr) if isinstance(mfr, dict) else {}

    return NormalizedAdvert(
        scanner_source=str(getattr(scanner, "source", "") or ""),
        scanner_name=str(getattr(scanner, "name", "") or ""),
        scanner_area=str(getattr(scanner, "area_name", "") or ""),
        address=address,
        rssi=rssi,
        stamp_mono=float(stamp_mono) if stamp_mono is not None else float(now_mono),
        manufacturer_data=mfr_dict,
        tx_power=tx_power,
    )


_SCANNER_ADAPTERS: dict[str, ScannerAdapter] = {
    "standard": standard_scanner_adapter,
}


def register_scanner_adapter(name: str, adapter: ScannerAdapter) -> None:
    """Register a named custom scanner adapter for hardware-specific quirk handling."""
    key = str(name or "").strip().lower()
    if not key:
        raise ValueError("Scanner adapter name must be non-empty")
    if not callable(adapter):
        raise TypeError("Scanner adapter must be callable")
    _SCANNER_ADAPTERS[key] = adapter


def unregister_scanner_adapter(name: str) -> None:
    """Remove a previously registered custom scanner adapter (cannot remove 'standard')."""
    key = str(name or "").strip().lower()
    if key and key != "standard":
        _SCANNER_ADAPTERS.pop(key, None)


def get_scanner_adapter(name: str | None = None) -> ScannerAdapter:
    """Look up a registered scanner adapter, falling back to 'standard'."""
    key = str(name or "standard").strip().lower()
    return _SCANNER_ADAPTERS.get(key, standard_scanner_adapter)


def list_scanner_adapters() -> tuple[str, ...]:
    """Return all registered scanner adapter names."""
    return tuple(sorted(_SCANNER_ADAPTERS))


def rssi_to_distance_m(
    rssi: float,
    *,
    ref_power: float = DEFAULT_REF_POWER,
    attenuation: float = DEFAULT_ATTENUATION,
    rssi_offset: float = 0.0,
) -> float:
    """Convert raw RSSI (dBm) to distance in meters via log-distance path-loss model."""
    adj_rssi = float(rssi) + float(rssi_offset)
    n = max(0.5, float(attenuation))
    dist_m = 10.0 ** ((float(ref_power) - adj_rssi) / (10.0 * n))
    return max(MIN_DISTANCE_M, min(MAX_DISTANCE_M, dist_m))


def rssi_to_distance_ft(
    rssi: float,
    *,
    ref_power: float = DEFAULT_REF_POWER,
    attenuation: float = DEFAULT_ATTENUATION,
    rssi_offset: float = 0.0,
) -> float:
    """Convert raw RSSI (dBm) to distance in feet."""
    return (
        rssi_to_distance_m(
            rssi,
            ref_power=ref_power,
            attenuation=attenuation,
            rssi_offset=rssi_offset,
        )
        * FEET_PER_METER
    )


def resolve_calibration_params(
    proxy: dict[str, Any] | None,
    device_overrides: dict[str, Any] | None = None,
) -> tuple[float, float, float, str]:
    """Resolve (ref_power, attenuation, rssi_offset, quirk_profile) for a proxy + device."""
    p = proxy if isinstance(proxy, dict) else {}
    d = device_overrides if isinstance(device_overrides, dict) else {}
    ref_power = float(
        d.get("ref_power")
        if d.get("ref_power") is not None
        else p.get("ref_power", DEFAULT_REF_POWER)
    )
    attenuation = float(
        d.get("attenuation")
        if d.get("attenuation") is not None
        else p.get("attenuation", DEFAULT_ATTENUATION)
    )
    rssi_offset = float(p.get("rssi_offset", 0.0) or 0.0) + float(d.get("rssi_offset", 0.0) or 0.0)
    quirk_profile = str(p.get("quirk_profile") or "standard").strip().lower() or "standard"
    return ref_power, attenuation, rssi_offset, quirk_profile
