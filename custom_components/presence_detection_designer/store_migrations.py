"""Schema migrations, floorplan sensor backfills, and ConfigEntry synchronization for PDDStore."""

from __future__ import annotations

import copy
import logging
from typing import Any

from .const import (
    CONF_LLM_AGENT_ID,
    CONF_LLM_API_KEY,
    CONF_LLM_API_URL,
    CONF_LLM_MODEL,
    CONF_LLM_PROVIDER_TYPE,
    CONF_NOTIFY_ON_CLEARED,
    CONF_NOTIFY_ON_OCCUPIED,
    CONF_NOTIFY_SLACK,
    DEFAULT_NOTIFY_SLACK,
    DOMAIN,
)
from .sensor_reliability import temper_observation_dict_reliability
from .spatial_topology import get_default_floorplan

_LOGGER = logging.getLogger(__name__)

_REMOVED_SENSOR_IDS: frozenset[str] = frozenset(
    {
        "binary_sensor.motion_detector_basement1",
        "binary_sensor.ratgdov25i_47a250_motion",
        "binary_sensor.motion_utility_room",
        "binary_sensor.wyzesense_77a63dd9",
        "binary_sensor.wyzesense_77a64d3c",
        "binary_sensor.wyzesense_77a65433",
        "binary_sensor.wyzesense_77a64d08",
        "binary_sensor.ring_motion_sensor_55812",
        "binary_sensor.family_room_motion_4",
        "binary_sensor.family_room_motion",
        "binary_sensor.motion_sensor_gen2_motion_detection",
        "binary_sensor.basement_motion",
        "binary_sensor.basement_stairs_ring_motion",
        "binary_sensor.utility_room_door",
        "binary_sensor.kitchen_motion",
        "binary_sensor.laundry_room_motion",
        "binary_sensor.master_bathroom_motion",
        "binary_sensor.upstairs_hallway_motion",
        "binary_sensor.upstairs_stairs_motion",
        "binary_sensor.keypad_v2_motion_detection",
    }
)

_BACKFILL_SENSOR_IDS: tuple[str, ...] = (
    "binary_sensor.family_room_ecobee_motion",
    "binary_sensor.family_room_ring_motion",
    "binary_sensor.family_room_motion_occupancy",
    "binary_sensor.kitchen_motion_occupancy",
    "binary_sensor.living_room_motion_occupancy",
    "binary_sensor.dining_room_motion_occupancy",
    "binary_sensor.master_bedroom_motion_occupancy",
    "binary_sensor.master_bathroom_motion_occupancy",
    "binary_sensor.upstairs_hallway_motion_occupancy",
    "binary_sensor.office_motion_occupancy",
    "binary_sensor.guest_room_motion_occupancy",
    "binary_sensor.laundry_room_ring_motion",
    "binary_sensor.basement_stairs_top_motion",
    "binary_sensor.basement_stairs_bottom_motion",
    "binary_sensor.upstairs_stairs_bottom_motion",
    "binary_sensor.garage_ring_motion",
    "binary_sensor.garage_keypad_motion",
    "binary_sensor.basement_ecobee_motion",
    "binary_sensor.laundry_room_door",
)


def migrate_and_backfill_store_payload(
    hass: Any,
    stored: dict[str, Any] | None,
    default_store_factory: Any,
    default_global_settings: dict[str, Any],
) -> tuple[dict[str, Any], bool]:
    """Normalize, backfill, and synchronize a loaded .storage payload. Return (payload, dirty)."""
    dirty = False
    if not isinstance(stored, dict):
        stored = default_store_factory()
        dirty = True

    for key, default_val in default_store_factory().items():
        if key not in stored or not isinstance(stored[key], type(default_val)):
            stored[key] = copy.deepcopy(default_val)
            dirty = True

    if not stored.get("floorplan", {}).get("rooms"):
        stored["floorplan"] = get_default_floorplan()
        dirty = True
    else:
        default_fp = get_default_floorplan()
        fp_dict = stored["floorplan"]
        has_blueprint = any(
            isinstance(fl, dict) and fl.get("underlay_svg")
            for fl in fp_dict.get("floors", []) or []
        )
        if not has_blueprint or int(fp_dict.get("version", 0) or 0) < int(
            default_fp.get("version", 5)
        ):
            stored["floorplan"] = copy.deepcopy(default_fp)
            fp_dict = stored["floorplan"]
            dirty = True
        for layer_key in ("sensors", "ble_proxies"):
            if not fp_dict.get(layer_key) and default_fp.get(layer_key):
                fp_dict[layer_key] = copy.deepcopy(default_fp[layer_key])
                dirty = True

        default_cams = {c["id"]: c for c in default_fp.get("cameras", []) if c.get("id")}
        for cam in fp_dict.get("cameras", []):
            cid = cam.get("id")
            if (
                cid in default_cams
                and not cam.get("sub_zones")
                and default_cams[cid].get("sub_zones")
            ):
                cam["sub_zones"] = copy.deepcopy(default_cams[cid]["sub_zones"])
                dirty = True
            elif cid == "camera.storage_room" and cam.get("sub_zones"):
                for sz in cam["sub_zones"]:
                    if (
                        sz.get("id") == "storage_room_workout"
                        and sz.get("label") != "Storage Room Floor"
                    ):
                        sz["label"] = "Storage Room Floor"
                        sz["x"] = 705
                        sz["y"] = 80
                        sz["width"] = 195
                        sz["height"] = 265
                        dirty = True

        for conn in fp_dict.get("connections", []):
            if (
                isinstance(conn, dict)
                and conn.get("entity_id") == "binary_sensor.utility_room_door"
            ):
                conn["entity_id"] = "binary_sensor.laundry_room_door"
                dirty = True

        orig_sensors = list(fp_dict.get("sensors", []) or [])
        filtered_sensors = [s for s in orig_sensors if s.get("id") not in _REMOVED_SENSOR_IDS]
        if len(filtered_sensors) != len(orig_sensors):
            fp_dict["sensors"] = filtered_sensors
            dirty = True

        default_sens = {s["id"]: s for s in default_fp.get("sensors", []) if s.get("id")}
        existing_sensor_ids = {s.get("id") for s in fp_dict.get("sensors", [])}
        for new_sid in _BACKFILL_SENSOR_IDS:
            if new_sid in default_sens and new_sid not in existing_sensor_ids:
                fp_dict.setdefault("sensors", []).insert(1, copy.deepcopy(default_sens[new_sid]))
                dirty = True

        for sen in fp_dict.get("sensors", []):
            sid = sen.get("id")
            if sid in default_sens:
                ds = default_sens[sid]
                if not sen.get("model_preset") and ds.get("model_preset"):
                    sen["model_preset"] = ds["model_preset"]
                    dirty = True
                if (
                    ds.get("model_preset") in ("ecobee_smart_sensor", "ecobee_thermostat_pir")
                    and sen.get("range_px") == 260
                ):
                    for k in ("model_preset", "fov_deg", "range_px"):
                        sen[k] = ds[k]
                    dirty = True
                elif sid in (
                    "binary_sensor.keypad_motion",
                    "binary_sensor.upper_level_keypad_motion",
                ) and (sen.get("x") in (380, 415, 485) or sen.get("y") == 235):
                    for k in ("name", "host_room", "x", "y", "heading_deg"):
                        sen[k] = ds[k]
                    dirty = True
                elif sid == "binary_sensor.guest_room_motion" and sen.get("x") == 858:
                    for k in ("name", "x", "y", "heading_deg"):
                        sen[k] = ds[k]
                    dirty = True

    for k, v in default_global_settings.items():
        if k not in stored["global_settings"]:
            stored["global_settings"][k] = copy.deepcopy(v)
            dirty = True
    if "sensor.tab_s10_lite_ble_area" in (stored["global_settings"].get("ble_trackers") or []):
        stored["global_settings"]["ble_trackers"] = [
            t
            for t in stored["global_settings"]["ble_trackers"]
            if t != "sensor.tab_s10_lite_ble_area"
        ]
        dirty = True

    room_pir_backfills: dict[str, list[tuple[str | None, str, str, str, float, float]]] = {
        "Guest Room": [
            (
                None,
                "binary_sensor.guest_room_motion_occupancy",
                "Guest Room VALLHORN PIR Motion",
                "strong",
                0.90,
                0.05,
            )
        ],
        "Master Bathroom": [
            (
                "binary_sensor.master_bathroom_motion",
                "binary_sensor.master_bathroom_motion_occupancy",
                "Master Bathroom SenseGuard PIR Motion",
                "strong",
                0.90,
                0.05,
            )
        ],
        "Kitchen": [
            (
                "binary_sensor.kitchen_motion",
                "binary_sensor.kitchen_motion_occupancy",
                "Kitchen SenseGuard PIR Motion",
                "strong",
                0.90,
                0.05,
            )
        ],
        "Laundry Room": [
            (
                "binary_sensor.laundry_room_motion",
                "binary_sensor.laundry_room_ring_motion",
                "Laundry Room Ring PIR Motion",
                "strong",
                0.90,
                0.05,
            )
        ],
        "Upstairs Hallway & Stairs": [
            (
                "binary_sensor.upstairs_hallway_motion",
                "binary_sensor.upstairs_hallway_motion_occupancy",
                "Upstairs Hallway SenseGuard PIR Motion",
                "strong",
                0.90,
                0.05,
            ),
            (
                "binary_sensor.upstairs_stairs_motion",
                "binary_sensor.upstairs_stairs_bottom_motion",
                "Upstairs Stairs Bottom Step Wyze PIR (433)",
                "strong",
                0.90,
                0.05,
            ),
        ],
        "Front Entry": [
            (
                None,
                "binary_sensor.basement_stairs_top_motion",
                "Basement Stairs Top Step Wyze PIR (938)",
                "moderate",
                0.78,
                0.08,
            )
        ],
        "Basement Play Area": [
            (
                "binary_sensor.basement_stairs_ring_motion",
                "binary_sensor.basement_stairs_bottom_motion",
                "Basement Stairs Bottom Step Wyze PIR (dd9)",
                "strong",
                0.90,
                0.05,
            )
        ],
        "Family Room": [
            (
                None,
                "binary_sensor.family_room_motion_occupancy",
                "Family Room SenseGuard PIR Motion",
                "moderate",
                0.78,
                0.08,
            )
        ],
        "Living Room": [
            (
                None,
                "binary_sensor.living_room_motion_occupancy",
                "Living Room SenseGuard PIR Motion",
                "moderate",
                0.78,
                0.08,
            )
        ],
        "Dining Room": [
            (
                None,
                "binary_sensor.dining_room_motion_occupancy",
                "Dining Room SenseGuard PIR Motion",
                "moderate",
                0.78,
                0.08,
            )
        ],
        "Master Bedroom": [
            (
                None,
                "binary_sensor.master_bedroom_motion_occupancy",
                "Master Bedroom SenseGuard PIR Motion",
                "moderate",
                0.78,
                0.08,
            )
        ],
        "Office": [
            (
                None,
                "binary_sensor.office_motion_occupancy",
                "Office SenseGuard PIR Motion",
                "moderate",
                0.78,
                0.08,
            )
        ],
        "Garage": [
            (
                "binary_sensor.ring_motion_sensor_55812",
                "binary_sensor.garage_ring_motion",
                "Garage Ring PIR Motion",
                "strong",
                0.90,
                0.05,
            ),
            (
                "binary_sensor.keypad_v2_motion_detection",
                "binary_sensor.garage_keypad_motion",
                "Garage Keypad Proximity Motion",
                "strong",
                0.88,
                0.05,
            ),
        ],
    }

    for _rid, rcfg in stored.get("rooms", {}).items():
        if not isinstance(rcfg, dict):
            continue
        if rcfg.get(CONF_NOTIFY_SLACK) is None:
            rcfg[CONF_NOTIFY_SLACK] = DEFAULT_NOTIFY_SLACK
            dirty = True
        if rcfg.get(CONF_NOTIFY_ON_OCCUPIED) is None:
            rcfg[CONF_NOTIFY_ON_OCCUPIED] = True
            dirty = True
        if rcfg.get(CONF_NOTIFY_ON_CLEARED) is None:
            rcfg[CONF_NOTIFY_ON_CLEARED] = True
            dirty = True

        # Purge any retired/removed sensor entity IDs from observations and triggers
        orig_obs = list(rcfg.get("bayesian_observations") or [])
        cleaned_obs = [
            o
            for o in orig_obs
            if not (isinstance(o, dict) and str(o.get("entity_id", "")) in _REMOVED_SENSOR_IDS)
        ]
        if len(cleaned_obs) != len(orig_obs):
            rcfg["bayesian_observations"] = cleaned_obs
            dirty = True

        orig_trigs = list(rcfg.get("trigger_entities") or [])
        cleaned_trigs = [t for t in orig_trigs if str(t) not in _REMOVED_SENSOR_IDS]
        if len(cleaned_trigs) != len(orig_trigs):
            rcfg["trigger_entities"] = cleaned_trigs
            dirty = True

        for obs_item in rcfg.get("bayesian_observations") or []:
            if isinstance(obs_item, dict) and temper_observation_dict_reliability(obs_item):
                dirty = True

        rname = str(rcfg.get("room_name", ""))
        for old_eid, new_eid, new_label, new_preset, new_pt, new_pf in room_pir_backfills.get(
            rname, []
        ):
            obs = list(rcfg.get("bayesian_observations") or [])
            if old_eid:
                filtered_obs = [
                    o for o in obs if not (isinstance(o, dict) and o.get("entity_id") == old_eid)
                ]
                if len(filtered_obs) != len(obs):
                    obs = filtered_obs
                    rcfg["bayesian_observations"] = obs
                    dirty = True
                trigs = list(rcfg.get("trigger_entities") or [])
                if old_eid in trigs:
                    rcfg["trigger_entities"] = [t for t in trigs if t != old_eid]
                    dirty = True
            if not any(isinstance(o, dict) and o.get("entity_id") == new_eid for o in obs):
                obs.insert(
                    0,
                    {
                        "entity_id": new_eid,
                        "label": new_label,
                        "operator": "equals",
                        "preset": new_preset,
                        "state": "on",
                        "prob_given_true": new_pt,
                        "prob_given_false": new_pf,
                    },
                )
                rcfg["bayesian_observations"] = obs
                dirty = True
            if new_preset == "strong":
                trigs = list(rcfg.get("trigger_entities") or [])
                if new_eid not in trigs:
                    trigs.insert(0, new_eid)
                    rcfg["trigger_entities"] = trigs
                    dirty = True

    if hass and hasattr(hass, "config_entries") and hasattr(hass.config_entries, "async_entries"):
        try:
            entries = hass.config_entries.async_entries(DOMAIN)
            for entry in entries:
                eid = getattr(entry, "entry_id", None)
                if not eid:
                    continue
                merged_cfg = {
                    **(getattr(entry, "data", {}) or {}),
                    **(getattr(entry, "options", {}) or {}),
                }
                if eid not in stored["rooms"] and merged_cfg:
                    stored["rooms"][eid] = copy.deepcopy(merged_cfg)
                    dirty = True
                elif (
                    eid in stored["rooms"]
                    and isinstance(stored["rooms"][eid], dict)
                    and hasattr(hass.config_entries, "async_update_entry")
                ):
                    room_cfg = stored["rooms"][eid]
                    room_obs = room_cfg.get("bayesian_observations")
                    opt_obs = (getattr(entry, "options", {}) or {}).get("bayesian_observations")
                    if room_obs is not None and room_obs != opt_obs:
                        new_opts = dict(getattr(entry, "options", {}) or {})
                        new_opts["bayesian_observations"] = copy.deepcopy(room_obs)
                        hass.config_entries.async_update_entry(
                            entry,
                            data=copy.deepcopy(room_cfg),
                            options=new_opts,
                        )

                gs = stored["global_settings"]
                if not gs.get("llm_api_url") and merged_cfg.get(CONF_LLM_API_URL):
                    gs["llm_api_url"] = str(merged_cfg[CONF_LLM_API_URL])
                    dirty = True
                if not gs.get("llm_api_key") and merged_cfg.get(CONF_LLM_API_KEY):
                    gs["llm_api_key"] = str(merged_cfg[CONF_LLM_API_KEY])
                    dirty = True
                if merged_cfg.get(CONF_LLM_MODEL) and gs.get("llm_model") in (
                    "",
                    "gpt-4o-mini",
                ):
                    gs["llm_model"] = str(merged_cfg[CONF_LLM_MODEL])
                    dirty = True
                if not gs.get("llm_agent_id") and merged_cfg.get(CONF_LLM_AGENT_ID):
                    gs["llm_agent_id"] = str(merged_cfg[CONF_LLM_AGENT_ID])
                    dirty = True
                if merged_cfg.get(CONF_LLM_PROVIDER_TYPE):
                    gs["llm_provider_type"] = str(merged_cfg[CONF_LLM_PROVIDER_TYPE])
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Skipping ConfigEntry sync during store load: %s", err)

    return stored, dirty
