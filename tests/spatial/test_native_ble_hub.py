"""Unit tests for native HA Bluetooth ingestion, IRK resolution, and calibration adapters."""

from __future__ import annotations

import sys
import uuid
from types import SimpleNamespace
from unittest.mock import MagicMock

from custom_components.presence_detection_designer.spatial.ble_calibration import (
    NormalizedAdvert,
    list_scanner_adapters,
    register_scanner_adapter,
    rssi_to_distance_ft,
    rssi_to_distance_m,
    standard_scanner_adapter,
    unregister_scanner_adapter,
)
from custom_components.presence_detection_designer.spatial.ble_irk_resolver import (
    BLEIrkResolver,
    extract_ibeacon,
    is_resolvable_private_address,
    normalize_mac,
)
from custom_components.presence_detection_designer.spatial.ble_kalman_tracker import (
    HouseEKFManager,
    update_house_ekf_from_hass,
)
from custom_components.presence_detection_designer.spatial.ble_scanner_hub import (
    NativeBLEScannerHub,
)
from custom_components.presence_detection_designer.spatial.spatial_topology import (
    get_default_floorplan,
)


def _make_ibeacon_mfr(beacon_uuid: str, major: int, minor: int) -> dict[int, bytes]:
    payload = (
        b"\x02\x15"
        + uuid.UUID(beacon_uuid).bytes
        + major.to_bytes(2, "big")
        + minor.to_bytes(2, "big")
        + b"\xc5"
    )
    return {0x004C: payload}


def test_ble_calibration_distance_and_custom_quirk_adapter():
    """RSSI path-loss math and user-registered scanner quirk adapters work cleanly."""
    # At ref_power (-55 dBm) with 0 offset -> 1.0 meter (~3.28 ft)
    assert abs(rssi_to_distance_m(-55.0) - 1.0) < 1e-6
    assert abs(rssi_to_distance_ft(-55.0) - 3.28084) < 1e-3

    # Stronger RSSI with +5 dB offset moves closer
    assert rssi_to_distance_m(-60.0, rssi_offset=5.0) == rssi_to_distance_m(-55.0)

    # Standard adapter filters out -127 sentinel RSSI
    scanner = SimpleNamespace(source="AA:BB:CC:DD:EE:01", name="office_speaker", area_name="Office")
    dev = SimpleNamespace(address="44:11:22:33:44:55")
    bad_adv = SimpleNamespace(rssi=-127, tx_power=None, manufacturer_data={})
    assert standard_scanner_adapter(scanner, dev, bad_adv, 100.0, 101.0) is None

    # Register a custom quirk adapter (e.g. boosts RSSI by +6 dB and synthesizes timestamp)
    def _custom_quirk(sc, d, adv, _stamp, now_mono):
        return NormalizedAdvert(
            scanner_source=sc.source,
            scanner_name=sc.name,
            scanner_area=sc.area_name,
            address=d.address,
            rssi=float(adv.rssi) + 6.0,
            stamp_mono=now_mono,
            manufacturer_data={},
        )

    register_scanner_adapter("test_quirk_profile", _custom_quirk)
    try:
        assert "test_quirk_profile" in list_scanner_adapters()
        fp = get_default_floorplan()
        fp["ble_proxies"][0]["quirk_profile"] = "test_quirk_profile"
        fp["ble_proxies"][0]["scanner_source"] = "AA:BB:CC:DD:EE:01"

        hub = NativeBLEScannerHub()
        good_adv = SimpleNamespace(rssi=-61, tx_power=None, manufacturer_data={})
        sc = SimpleNamespace(
            source="AA:BB:CC:DD:EE:01",
            name="custom_proxy",
            area_name="",
            discovered_devices_and_advertisement_data={
                "11:22:33:44:55:66": (SimpleNamespace(address="11:22:33:44:55:66"), good_adv)
            },
            discovered_device_timestamps={},
        )
        trackers, ranges_map = hub.collect_proxy_ranges(
            None,
            fp,
            now_ts=1000.0,
            tracker_specs=["phone=mac:11:22:33:44:55:66"],
            scanners_override=[sc],
            now_mono_override=500.0,
        )
        assert trackers == ["phone"]
        assert len(ranges_map["phone"]) == 1
        # -61 + 6 = -55 dBm -> 1.0 m (~3.28 ft)
        assert abs(ranges_map["phone"][0].rssi - (-55.0)) < 1e-6
        assert abs(ranges_map["phone"][0].distance_ft - 3.28084) < 0.02
    finally:
        unregister_scanner_adapter("test_quirk_profile")


def test_ble_irk_resolver_static_ibeacon_irk_and_bounded_pruning(monkeypatch):
    """BLEIrkResolver resolves static MACs, iBeacons, and rotating IRK MACs with bounded cache."""
    assert normalize_mac("AA-BB-CC-DD-EE-FF") == "aa:bb:cc:dd:ee:ff"
    assert is_resolvable_private_address("52:11:22:33:44:55") is True
    assert is_resolvable_private_address("c0:11:22:33:44:55") is False

    # Stub bluetooth_data_tools for deterministic IRK resolution in unit test
    target_rpa = "52:aa:bb:cc:dd:ee"
    fake_bdt = SimpleNamespace(
        get_cipher_for_irk=lambda irk_bytes: f"cipher:{irk_bytes.hex()}",
        resolve_private_address=lambda cipher, addr: (
            cipher.endswith("00112233445566778899aabbccddeeff") and addr == target_rpa
        ),
        monotonic_time_coarse=lambda: 100.0,
    )
    monkeypatch.setitem(sys.modules, "bluetooth_data_tools", fake_bdt)

    resolver = BLEIrkResolver(max_cache_size=64, known_ttl_sec=60.0, unknown_ttl_sec=10.0)
    assert resolver.register_static_mac("tag_keys", "11:22:33:44:55:66") is True
    assert resolver.resolve("11:22:33:44:55:66") == "tag_keys"

    test_uuid = "12345678-1234-5678-1234-567812345678"
    assert resolver.register_ibeacon("companion_app", test_uuid, major=100, minor=1) is True
    mfr = _make_ibeacon_mfr(test_uuid, 100, 1)
    assert extract_ibeacon(mfr) == (test_uuid, 100, 1)
    assert resolver.resolve("99:99:99:99:99:99", manufacturer_data=mfr) == "companion_app"

    assert resolver.register_irk("device_tracker.pixel", "00112233445566778899aabbccddeeff") is True
    assert resolver.resolve(target_rpa, now_mono=100.0) == "device_tracker.pixel"
    assert resolver.resolve("52:00:00:00:00:01", now_mono=100.0) is None

    # After 15s, unknown MAC expires while known MAC stays cached
    pruned = resolver.prune(now_mono=115.0)
    assert pruned == 1
    assert resolver.resolve(target_rpa, now_mono=115.0) == "device_tracker.pixel"


def test_native_ble_hub_auto_discovers_private_ble_and_feeds_ekf(monkeypatch):
    """Option A: empty ble_trackers auto-discovers private_ble_device entries and updates EKF."""
    rpa = "5a:09:e8:e6:be:a4"
    irk_hex = "aabbccddeeff00112233445566778899"
    fake_bdt = SimpleNamespace(
        get_cipher_for_irk=lambda irk_bytes: f"cipher:{irk_bytes.hex()}",
        resolve_private_address=lambda cipher, addr: cipher.endswith(irk_hex) and addr == rpa,
        monotonic_time_coarse=lambda: 200.0,
    )
    monkeypatch.setitem(sys.modules, "bluetooth_data_tools", fake_bdt)

    # Mock HA private_ble_device config entry + bluetooth.async_current_scanners
    pble_entry = SimpleNamespace(entry_id="pble_1", title="Steve Phone", data={"irk": irk_hex})
    hass = MagicMock()
    hass.config_entries.async_entries.side_effect = lambda domain: (
        [pble_entry] if domain == "private_ble_device" else []
    )
    hass.states.get.return_value = None

    scanner = SimpleNamespace(
        source="esphome_office",
        name="office_speaker",
        area_name="Office",
        discovered_devices_and_advertisement_data={
            rpa: (
                SimpleNamespace(address=rpa),
                SimpleNamespace(rssi=-55, tx_power=None, manufacturer_data={}),
            )
        },
        discovered_device_timestamps={rpa: 199.0},
    )
    fake_bt = SimpleNamespace(async_current_scanners=lambda _hass: [scanner])
    monkeypatch.setitem(sys.modules, "homeassistant.components.bluetooth", fake_bt)

    fp = get_default_floorplan()
    hub = NativeBLEScannerHub()
    mgr = HouseEKFManager()

    # Empty tracker_entities -> auto-discovers private_ble.pble_1 and initializes EKF on upstairs
    tracks = update_house_ekf_from_hass(
        mgr,
        hass,
        fp,
        None,
        now_ts=1000.0,
        tracker_entities=[],
        ble_hub=hub,
    )
    assert "private_ble.pble_1" in tracks
    assert tracks["private_ble.pble_1"]["floor"] == "upstairs"
    assert tracks["private_ble.pble_1"]["active_proxy_count"] == 1
