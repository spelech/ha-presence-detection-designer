"""Default global settings and payload normalization for PDDStore."""

from __future__ import annotations

import copy
from typing import Any

from .const import (
    DEFAULT_BLE_DECIDER_ENABLED,
    DEFAULT_BLE_TRACKERS,
    DEFAULT_DOOR_DUPLICATE_WINDOW,
    DEFAULT_EKF_FLOOR_STABILITY_V2,
    DEFAULT_EXIT_CORROBORATION_WINDOW,
    DEFAULT_EXIT_CORROBORATORS,
    DEFAULT_GUEST_MODE_ENABLED,
    DEFAULT_INTERIOR_DOORS,
    DEFAULT_MAX_OCCUPANTS,
    DEFAULT_NEGATIVE_SPACE_ENABLED,
    DEFAULT_NOTIFY_SERVICE,
    DEFAULT_NOTIFY_TARGET,
    DEFAULT_NOTIFY_VERBOSITY,
    DEFAULT_PERIMETER_DOORS,
    DEFAULT_PIR_CANDIDATE_WINDOW,
    DEFAULT_PIR_VALIDATION_ENABLED,
    DEFAULT_STALE_COUNT_TIMEOUT,
    DOMAIN,
    LLMProviderType,
)
from .hmm_engine import DEFAULT_HMM_PARAMS
from .spatial_topology import get_default_floorplan

DEFAULT_GLOBAL_SETTINGS: dict[str, Any] = {
    "llm_provider_type": str(LLMProviderType.VISION_API),
    "llm_api_url": "",
    "llm_api_key": "",
    "llm_model": "gemini-2.5-flash",
    "llm_agent_id": "",
    "ble_trackers": list(DEFAULT_BLE_TRACKERS),
    "notifications_enabled": False,
    "notify_service": DEFAULT_NOTIFY_SERVICE,
    "notify_target": DEFAULT_NOTIFY_TARGET,
    "notify_verbosity": DEFAULT_NOTIFY_VERBOSITY,
    "designer_ui_enabled": True,
    "negative_space_enabled": DEFAULT_NEGATIVE_SPACE_ENABLED,
    "guest_mode_enabled": DEFAULT_GUEST_MODE_ENABLED,
    "ble_decider_enabled": DEFAULT_BLE_DECIDER_ENABLED,
    "ekf_floor_stability_v2": DEFAULT_EKF_FLOOR_STABILITY_V2,
    "hmm_params": dict(DEFAULT_HMM_PARAMS),
    "pir_validation_enabled": DEFAULT_PIR_VALIDATION_ENABLED,
    "pir_candidate_window": DEFAULT_PIR_CANDIDATE_WINDOW,
    "ui_advanced_mode": False,
    "transit_window_sec": 90.0,
    "settling_window_sec": 2.0,
    "house_occupant_count": 1,
    "house_occupancy_mode": "occupied",
    "enable_conservation_law": False,
    "perimeter_doors": dict(DEFAULT_PERIMETER_DOORS),
    "interior_doors": list(DEFAULT_INTERIOR_DOORS),
    "max_occupants": DEFAULT_MAX_OCCUPANTS,
    "stale_count_timeout": DEFAULT_STALE_COUNT_TIMEOUT,
    "door_duplicate_window": DEFAULT_DOOR_DUPLICATE_WINDOW,
    "exit_corroborators": dict(DEFAULT_EXIT_CORROBORATORS),
    "exit_corroboration_window": DEFAULT_EXIT_CORROBORATION_WINDOW,
}


def _default_store_data() -> dict[str, Any]:
    """Return default .storage payload."""
    return {
        "global_settings": copy.deepcopy(DEFAULT_GLOBAL_SETTINGS),
        "rooms": {},
        "revisions": {},
        "timeline": {},
        "floorplan": get_default_floorplan(),
    }


def _normalize_store_payload(hass: Any, stored: Any) -> tuple[dict[str, Any], bool]:
    """Ensure loaded .storage payload has all required keys and sync ConfigEntries."""
    if not isinstance(stored, dict):
        stored = _default_store_data()
        dirty = True
    else:
        dirty = False
    defaults = _default_store_data()
    for key, default_val in defaults.items():
        if key not in stored or not isinstance(stored[key], type(default_val)):
            stored[key] = copy.deepcopy(default_val)
            dirty = True
    gs = stored["global_settings"]
    for key, default_val in DEFAULT_GLOBAL_SETTINGS.items():
        if key not in gs:
            gs[key] = copy.deepcopy(default_val)
            dirty = True

    if hass and hasattr(hass, "config_entries") and hasattr(hass.config_entries, "async_entries"):
        rooms = stored["rooms"]
        for entry in hass.config_entries.async_entries(DOMAIN):
            eid = getattr(entry, "entry_id", None)
            if not eid or eid in rooms:
                continue
            merged = {
                **(getattr(entry, "data", None) or {}),
                **(getattr(entry, "options", None) or {}),
            }
            rooms[eid] = copy.deepcopy(merged)
            dirty = True
            for llm_key in (
                "llm_provider_type",
                "llm_api_url",
                "llm_api_key",
                "llm_model",
                "llm_agent_id",
            ):
                if merged.get(llm_key) and not gs.get(llm_key):
                    gs[llm_key] = merged[llm_key]
    return stored, dirty
