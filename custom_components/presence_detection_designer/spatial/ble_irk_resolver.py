"""Native BLE Identity Resolving Key (IRK), static MAC, and iBeacon resolver."""

from __future__ import annotations

import logging
import re
import time
import uuid as uuid_lib
from collections import OrderedDict
from dataclasses import dataclass
from typing import Any

_LOGGER = logging.getLogger(__name__)

KNOWN_MAC_TTL_SEC = 900.0
UNKNOWN_MAC_TTL_SEC = 180.0
MAX_MAC_CACHE_SIZE = 2048
_APPLE_COMPANY_ID = 0x004C
_IBEACON_PREFIX = b"\x02\x15"
_MAC_RE = re.compile(r"^[0-9a-f]{2}(:[0-9a-f]{2}){5}$")
_HEX_IRK_RE = re.compile(r"^[0-9a-f]{32}$")


def _monotonic_now() -> float:
    try:
        from bluetooth_data_tools import monotonic_time_coarse

        return float(monotonic_time_coarse())
    except Exception:  # noqa: BLE001
        return time.monotonic()


def normalize_mac(address: str) -> str:
    """Normalize a BLE MAC address to lowercase colon-separated form."""
    cleaned = re.sub(r"[^0-9a-fA-F]", "", str(address or "")).lower()
    if len(cleaned) != 12:
        return str(address or "").strip().lower()
    return ":".join(cleaned[i : i + 2] for i in range(0, 12, 2))


def is_valid_mac(address: str) -> bool:
    """Return True if address is a valid 6-byte MAC."""
    return bool(_MAC_RE.match(normalize_mac(address)))


def is_resolvable_private_address(address: str) -> bool:
    """Return True if BLE address is a Resolvable Private Address (top two bits == 01)."""
    norm = normalize_mac(address)
    if len(norm) < 2:
        return False
    try:
        first_byte = int(norm[:2], 16)
    except ValueError:
        return False
    return (first_byte & 0xC0) == 0x40


def parse_irk(raw: bytes | str) -> bytes | None:
    """Parse a 16-byte IRK from bytes or 32-character hex string."""
    if isinstance(raw, (bytes, bytearray)):
        return bytes(raw) if len(raw) == 16 else None
    cleaned = re.sub(r"[^0-9a-fA-F]", "", str(raw or "")).lower()
    if _HEX_IRK_RE.match(cleaned):
        return bytes.fromhex(cleaned)
    return None


def extract_ibeacon(
    manufacturer_data: dict[int, bytes] | None,
) -> tuple[str, int, int] | None:
    """Extract (uuid_str, major, minor) from Apple iBeacon manufacturer data if present."""
    if not manufacturer_data:
        return None
    payload = manufacturer_data.get(_APPLE_COMPANY_ID)
    if not isinstance(payload, (bytes, bytearray)) or len(payload) < 22:
        return None
    if bytes(payload[:2]) != _IBEACON_PREFIX:
        return None
    beacon_uuid = str(uuid_lib.UUID(bytes=bytes(payload[2:18]))).lower()
    major = int.from_bytes(payload[18:20], "big")
    minor = int.from_bytes(payload[20:22], "big")
    return beacon_uuid, major, minor


@dataclass(slots=True)
class _CachedResolution:
    tracker_id: str | None
    expires_mono: float


class BLEIrkResolver:
    """Resolve rotating Private BLE MACs, static MACs, and iBeacons to stable tracker IDs."""

    def __init__(
        self,
        *,
        max_cache_size: int = MAX_MAC_CACHE_SIZE,
        known_ttl_sec: float = KNOWN_MAC_TTL_SEC,
        unknown_ttl_sec: float = UNKNOWN_MAC_TTL_SEC,
    ) -> None:
        self._max_cache_size = max(64, int(max_cache_size))
        self._known_ttl_sec = float(known_ttl_sec)
        self._unknown_ttl_sec = float(unknown_ttl_sec)
        # irk_bytes -> (tracker_id, prepared_cipher)
        self._irks: dict[bytes, tuple[str, Any]] = {}
        # normalized_mac -> tracker_id
        self._static_macs: dict[str, str] = {}
        # (uuid_lower, major_or_none, minor_or_none) -> tracker_id
        self._ibeacons: dict[tuple[str, int | None, int | None], str] = {}
        # normalized_mac -> _CachedResolution (LRU bounded)
        self._mac_cache: OrderedDict[str, _CachedResolution] = OrderedDict()
        # alias (lowered slug / friendly name / entry_id) -> canonical tracker_id
        self._aliases: dict[str, str] = {}

    @property
    def registered_tracker_ids(self) -> tuple[str, ...]:
        """Return deduplicated list of all registered canonical tracker IDs."""
        ids: list[str] = []
        for tid, _ in self._irks.values():
            if tid not in ids:
                ids.append(tid)
        for tid in self._static_macs.values():
            if tid not in ids:
                ids.append(tid)
        for tid in self._ibeacons.values():
            if tid not in ids:
                ids.append(tid)
        return tuple(ids)

    def resolve_alias(self, token: str) -> str | None:
        """Map an entity_id, entry_id, or slug to a registered canonical tracker_id."""
        key = str(token or "").strip().lower()
        if not key:
            return None
        if key in self._aliases:
            return self._aliases[key]
        norm = re.sub(r"[^a-z0-9]+", "_", key).strip("_")
        return self._aliases.get(norm)

    def _add_aliases(self, tracker_id: str, *extras: str) -> None:
        for raw in (tracker_id, *extras):
            low = str(raw or "").strip().lower()
            if not low:
                continue
            self._aliases[low] = tracker_id
            norm = re.sub(r"[^a-z0-9]+", "_", low).strip("_")
            if norm:
                self._aliases[norm] = tracker_id

    def register_irk(
        self,
        tracker_id: str,
        irk: bytes | str,
        *,
        aliases: tuple[str, ...] = (),
    ) -> bool:
        """Register an IRK for `tracker_id`. Returns True if valid and registered."""
        irk_bytes = parse_irk(irk)
        if irk_bytes is None:
            return False
        tid = str(tracker_id).strip()
        if not tid:
            return False
        existing = self._irks.get(irk_bytes)
        if existing is not None and existing[0] == tid:
            self._add_aliases(tid, *aliases)
            return True
        try:
            from bluetooth_data_tools import get_cipher_for_irk

            cipher = get_cipher_for_irk(irk_bytes)
        except Exception as err:  # noqa: BLE001
            _LOGGER.warning("Failed to prepare IRK cipher for %s: %s", tid, err)
            return False
        self._irks[irk_bytes] = (tid, cipher)
        self._add_aliases(tid, *aliases)
        # Invalidate negative cache entries so previously unseen MACs can resolve now
        to_drop = [mac for mac, entry in self._mac_cache.items() if entry.tracker_id is None]
        for mac in to_drop:
            del self._mac_cache[mac]
        return True

    def register_static_mac(
        self,
        tracker_id: str,
        mac: str,
        *,
        aliases: tuple[str, ...] = (),
    ) -> bool:
        """Register a static MAC address for `tracker_id`."""
        norm = normalize_mac(mac)
        if not is_valid_mac(norm):
            return False
        tid = str(tracker_id).strip() or f"ble_{norm.replace(':', '')}"
        self._static_macs[norm] = tid
        self._add_aliases(tid, norm, *aliases)
        return True

    def register_ibeacon(
        self,
        tracker_id: str,
        beacon_uuid: str,
        major: int | None = None,
        minor: int | None = None,
        *,
        aliases: tuple[str, ...] = (),
    ) -> bool:
        """Register an iBeacon UUID (and optional major/minor) for `tracker_id`."""
        try:
            norm_uuid = str(uuid_lib.UUID(str(beacon_uuid).strip())).lower()
        except ValueError:
            return False
        tid = str(tracker_id).strip() or f"ibeacon_{norm_uuid[:8]}"
        self._ibeacons[(norm_uuid, major, minor)] = tid
        self._add_aliases(tid, norm_uuid, *aliases)
        return True

    def _put_cache(self, mac: str, tracker_id: str | None, now_mono: float) -> None:
        ttl = self._known_ttl_sec if tracker_id is not None else self._unknown_ttl_sec
        self._mac_cache[mac] = _CachedResolution(tracker_id=tracker_id, expires_mono=now_mono + ttl)
        self._mac_cache.move_to_end(mac)
        while len(self._mac_cache) > self._max_cache_size:
            self._mac_cache.popitem(last=False)

    def resolve(
        self,
        address: str,
        *,
        manufacturer_data: dict[int, bytes] | None = None,
        now_mono: float | None = None,
    ) -> str | None:
        """Resolve a BLE advertisement to a registered tracker_id, or None if untracked."""
        norm = normalize_mac(address)
        if norm in self._static_macs:
            return self._static_macs[norm]

        if self._ibeacons and manufacturer_data:
            ib = extract_ibeacon(manufacturer_data)
            if ib is not None:
                b_uuid, b_maj, b_min = ib
                for key in (
                    (b_uuid, b_maj, b_min),
                    (b_uuid, b_maj, None),
                    (b_uuid, None, None),
                ):
                    if key in self._ibeacons:
                        return self._ibeacons[key]

        if not self._irks:
            return None

        now = _monotonic_now() if now_mono is None else float(now_mono)
        cached = self._mac_cache.get(norm)
        if cached is not None:
            if cached.expires_mono > now:
                self._mac_cache.move_to_end(norm)
                return cached.tracker_id
            del self._mac_cache[norm]

        if not is_resolvable_private_address(norm):
            self._put_cache(norm, None, now)
            return None

        try:
            from bluetooth_data_tools import resolve_private_address
        except Exception:  # noqa: BLE001
            return None

        for _irk_bytes, (tid, cipher) in self._irks.items():
            try:
                if resolve_private_address(cipher, norm):
                    self._put_cache(norm, tid, now)
                    return tid
            except Exception:  # noqa: BLE001
                continue

        self._put_cache(norm, None, now)
        return None

    def prune(self, now_mono: float | None = None) -> int:
        """Expire stale entries from the MAC resolution cache."""
        now = _monotonic_now() if now_mono is None else float(now_mono)
        expired = [mac for mac, entry in self._mac_cache.items() if entry.expires_mono <= now]
        for mac in expired:
            del self._mac_cache[mac]
        return len(expired)

    def sync_private_ble_devices(self, hass: Any) -> list[str]:
        """Auto-discover IRKs from HA's built-in `private_ble_device` config entries."""
        if hass is None:
            return []
        cfg_entries = getattr(hass, "config_entries", None)
        if cfg_entries is None or not hasattr(cfg_entries, "async_entries"):
            return []

        ent_reg = None
        try:
            from homeassistant.helpers import entity_registry as er

            ent_reg = er.async_get(hass)
        except Exception:  # noqa: BLE001
            ent_reg = None

        discovered: list[str] = []
        for entry in cfg_entries.async_entries("private_ble_device"):
            data = getattr(entry, "data", None) or {}
            raw_irk = data.get("irk")
            if not raw_irk:
                continue
            entry_id = str(getattr(entry, "entry_id", "") or "")
            title = str(getattr(entry, "title", "") or "")
            tracker_eid = self._find_private_ble_tracker_entity(ent_reg, entry_id)
            canonical_id = tracker_eid or f"private_ble.{entry_id or title}"
            aliases = tuple(x for x in (entry_id, title, tracker_eid) if x)
            if self.register_irk(canonical_id, raw_irk, aliases=aliases):
                discovered.append(canonical_id)
        return discovered

    @staticmethod
    def _find_private_ble_tracker_entity(ent_reg: Any, entry_id: str) -> str | None:
        if ent_reg is None or not entry_id:
            return None
        try:
            from homeassistant.helpers import entity_registry as er

            entries = er.async_entries_for_config_entry(ent_reg, entry_id)
        except Exception:  # noqa: BLE001
            return None
        for ent in entries or ():
            eid = str(getattr(ent, "entity_id", "") or "")
            if eid.startswith("device_tracker."):
                return eid
        return None
