"""Sensor reliability classification and cooldown-based Bayesian weight curves."""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any

from .floorplan_presets import DEVICE_MODEL_PRESETS

# Verified Ecobee motion entities across HomeKit Controller (300s reset cooldown)
ECOBEE_MOTION_ENTITIES: frozenset[str] = frozenset(
    {
        "binary_sensor.thermostat_motion",
        "binary_sensor.office_motion",
        "binary_sensor.master_bedroom_motion",
        "binary_sensor.nursery_motion",
        "binary_sensor.guest_room_motion",
        "binary_sensor.family_room_ecobee_motion",
        "binary_sensor.basement_ecobee_motion",
    }
)

# Verified Ecobee occupancy tail entities (~1800s reset cooldown)
ECOBEE_OCCUPANCY_ENTITIES: frozenset[str] = frozenset(
    {
        "binary_sensor.thermostat_occupancy",
        "binary_sensor.office_occupancy",
        "binary_sensor.master_bedroom_occupancy",
        "binary_sensor.nursery_occupancy",
        "binary_sensor.guest_room_occupancy",
        "binary_sensor.family_room_ecobee_occupancy",
        "binary_sensor.basement_ecobee_occupancy",
    }
)

ECOBEE_ENTITIES: frozenset[str] = ECOBEE_MOTION_ENTITIES | ECOBEE_OCCUPANCY_ENTITIES

# Battery-powered camera PIRs with slow wake / missed detection characteristics
BATTERY_CAMERA_PIR_ENTITIES: frozenset[str] = frozenset(
    {
        "binary_sensor.family_room_ring_motion",
    }
)

# Currently placed Wyze Sense V1 PIRs (3 placed: 2 basement stairs, 1 upstairs bottom)
WYZE_PLACED_PIR_ENTITIES: frozenset[str] = frozenset(
    {
        "binary_sensor.basement_stairs_top_motion",
        "binary_sensor.basement_stairs_bottom_motion",
        "binary_sensor.upstairs_stairs_bottom_motion",
    }
)

# Ring Keypads (Main Floor, Master Bedroom, Garage)
RING_KEYPAD_PIR_ENTITIES: frozenset[str] = frozenset(
    {
        "binary_sensor.keypad_motion",
        "binary_sensor.upper_level_keypad_motion",
        "binary_sensor.garage_keypad_motion",
    }
)

_NON_PIR_DOMAINS: frozenset[str] = frozenset(
    {"media_player", "light", "switch", "cover", "fan", "climate", "sensor", "person", "lock"}
)


@dataclass(frozen=True)
class SensorReliabilityProfile:
    """Resolved physical reliability and cooldown profile for an entity."""

    entity_id: str
    category: str
    cooldown_sec: float
    battery_powered: bool
    is_pir: bool
    is_slow: bool
    requires_pir_validation: bool
    reliability_weight: float


def weight_from_cooldown(
    cooldown_sec: float,
    *,
    battery_powered: bool = False,
) -> float:
    """Compute monotonic reliability weight in [0.12, 1.0] from hardware cooldown duration.

    Fast PIRs (<= 60s cooldown) retain full weight 1.0; slower sensors decay smoothly
    so slow thermal sensors (Ecobee 300s/1800s) and battery camera PIRs remain supporting
    evidence without solo-triggering room occupancy.
    """
    cd = max(0.0, float(cooldown_sec))
    base = 1.0 / (1.0 + max(0.0, cd - 60.0) / 150.0)
    if battery_powered:
        base *= 0.65
    return round(max(0.12, min(1.0, base)), 4)


def apply_cooldown_weight(
    prob_given_true: float,
    prob_given_false: float,
    cooldown_sec: float,
    *,
    battery_powered: bool = False,
) -> tuple[float, float]:
    """Temper Bayesian likelihood odds (P(E|T), P(E|F)) by cooldown reliability weight.

    Uses log-odds power tempering: odds_w = odds ** w, keeping w=1.0 exact and decaying
    slow sensors smoothly toward uninformative (0.50, 0.50) without ever inverting LR.
    """
    w = weight_from_cooldown(cooldown_sec, battery_powered=battery_powered)
    pt = max(0.001, min(0.999, float(prob_given_true)))
    pf = max(0.001, min(0.999, float(prob_given_false)))
    if w >= 0.999:
        return round(pt, 3), round(pf, 3)

    odds_t = pt / (1.0 - pt)
    odds_f = pf / (1.0 - pf)
    odds_tw = math.pow(odds_t, w)
    odds_fw = math.pow(odds_f, w)
    pt_w = odds_tw / (1.0 + odds_tw)
    pf_w = odds_fw / (1.0 + odds_fw)
    return round(max(0.01, min(0.99, pt_w)), 3), round(max(0.01, min(0.99, pf_w)), 3)


def is_camera_entity(entity_id: str) -> bool:
    """Return True for Frigate person / camera visual occupancy entities."""
    low = str(entity_id).strip().lower()
    if low.startswith("camera."):
        return True
    if not low.startswith("binary_sensor."):
        return False
    if any(tok in low for tok in ("person_occupancy", "subzone", "_camera_person", "_person_")):
        return True
    return low.endswith(("_person", "_zone"))


def classify_sensor_reliability(
    entity_id: str,
    *,
    model_preset: str | None = None,
    cooldown_sec: float | None = None,
    battery_powered: bool | None = None,
    floorplan: dict[str, Any] | None = None,
) -> SensorReliabilityProfile:
    """Classify any HA entity into its PIR validation and cooldown reliability profile."""
    eid = str(entity_id).strip()
    low = eid.lower()
    domain = low.split(".", 1)[0] if "." in low else ""

    preset_id = model_preset
    if not preset_id and isinstance(floorplan, dict):
        for sen in floorplan.get("sensors") or []:
            if isinstance(sen, dict) and str(sen.get("entity_id") or sen.get("id") or "") == eid:
                preset_id = sen.get("model_preset")
                if cooldown_sec is None and sen.get("cooldown_sec") is not None:
                    cooldown_sec = float(sen["cooldown_sec"])
                break

    preset_info = DEVICE_MODEL_PRESETS.get(str(preset_id or ""), {})
    is_batt = (
        bool(battery_powered) if battery_powered is not None else eid in BATTERY_CAMERA_PIR_ENTITIES
    )

    if is_camera_entity(eid):
        return SensorReliabilityProfile(
            entity_id=eid,
            category="camera",
            cooldown_sec=0.0,
            battery_powered=False,
            is_pir=False,
            is_slow=False,
            requires_pir_validation=False,
            reliability_weight=1.0,
        )

    if eid in ECOBEE_OCCUPANCY_ENTITIES or (
        preset_id in ("ecobee_smart_sensor", "ecobee_thermostat_pir") and low.endswith("_occupancy")
    ):
        cd = float(
            cooldown_sec
            if cooldown_sec is not None
            else preset_info.get("occupancy_cooldown_sec", 1800.0)
        )
        return SensorReliabilityProfile(
            entity_id=eid,
            category="ecobee_occupancy",
            cooldown_sec=cd,
            battery_powered=is_batt,
            is_pir=True,
            is_slow=True,
            requires_pir_validation=True,
            reliability_weight=weight_from_cooldown(cd, battery_powered=is_batt),
        )

    if (
        eid in ECOBEE_MOTION_ENTITIES
        or "ecobee" in low
        or preset_id in ("ecobee_smart_sensor", "ecobee_thermostat_pir")
    ):
        cd = float(
            cooldown_sec if cooldown_sec is not None else preset_info.get("cooldown_sec", 300.0)
        )
        return SensorReliabilityProfile(
            entity_id=eid,
            category="ecobee_motion",
            cooldown_sec=cd,
            battery_powered=is_batt,
            is_pir=True,
            is_slow=True,
            requires_pir_validation=True,
            reliability_weight=weight_from_cooldown(cd, battery_powered=is_batt),
        )

    if eid in BATTERY_CAMERA_PIR_ENTITIES or preset_id == "ring_stick_up_cam_gen3":
        cd = float(cooldown_sec if cooldown_sec is not None else 180.0)
        return SensorReliabilityProfile(
            entity_id=eid,
            category="battery_camera_pir",
            cooldown_sec=cd,
            battery_powered=True,
            is_pir=True,
            is_slow=True,
            requires_pir_validation=True,
            reliability_weight=weight_from_cooldown(cd, battery_powered=True),
        )

    if domain in _NON_PIR_DOMAINS or any(
        tok in low for tok in ("_door", "door_", "_window", "contact", "ble_area", "_watts", "_fan")
    ):
        return SensorReliabilityProfile(
            entity_id=eid,
            category="non_pir",
            cooldown_sec=0.0,
            battery_powered=is_batt,
            is_pir=False,
            is_slow=False,
            requires_pir_validation=False,
            reliability_weight=1.0,
        )

    if domain == "binary_sensor" or any(tok in low for tok in ("motion", "pir", "occupancy")):
        default_cd = float(preset_info.get("cooldown_sec", 30.0))
        if eid in WYZE_PLACED_PIR_ENTITIES:
            default_cd = 45.0
        elif eid in RING_KEYPAD_PIR_ENTITIES:
            default_cd = 30.0
        cd = float(cooldown_sec if cooldown_sec is not None else default_cd)
        is_slow = cd >= 120.0
        return SensorReliabilityProfile(
            entity_id=eid,
            category="slow_pir" if is_slow else "fast_pir",
            cooldown_sec=cd,
            battery_powered=is_batt,
            is_pir=True,
            is_slow=is_slow,
            requires_pir_validation=True,
            reliability_weight=weight_from_cooldown(cd, battery_powered=is_batt),
        )

    return SensorReliabilityProfile(
        entity_id=eid,
        category="non_pir",
        cooldown_sec=0.0,
        battery_powered=is_batt,
        is_pir=False,
        is_slow=False,
        requires_pir_validation=False,
        reliability_weight=1.0,
    )
