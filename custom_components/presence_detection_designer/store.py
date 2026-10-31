"""Native Home Assistant .storage manager for Presence Detection Designer."""

from __future__ import annotations

import copy
import datetime
import logging
from typing import Any

try:
    from homeassistant.helpers.storage import Store

    if type(Store).__name__ == "MagicMock":
        raise ImportError
except Exception:  # noqa: BLE001

    class Store:  # type: ignore[no-redef]
        """In-memory fallback Store when running outside Home Assistant."""

        def __init__(self, hass: Any, version: int, key: str) -> None:
            self.hass = hass
            self.version = version
            self.key = key
            self._mem: dict[str, Any] | None = None

        async def async_load(self) -> dict[str, Any] | None:
            return copy.deepcopy(self._mem)

        async def async_save(self, data: dict[str, Any]) -> None:
            self._mem = copy.deepcopy(data)


from .const import (
    CONF_LLM_AGENT_ID,
    CONF_LLM_API_KEY,
    CONF_LLM_API_URL,
    CONF_LLM_MODEL,
    CONF_LLM_PROVIDER_TYPE,
    CONF_NOTIFY_ON_CLEARED,
    CONF_NOTIFY_ON_OCCUPIED,
    CONF_NOTIFY_SLACK,
    DATA_STORE,
    DEFAULT_BLE_TRACKERS,
    DEFAULT_NEGATIVE_SPACE_ENABLED,
    DEFAULT_NOTIFY_SLACK,
    DEFAULT_SLACK_CHANNEL,
    DEFAULT_SLACK_NOTIFY_SERVICE,
    DOMAIN,
    MAX_ROOM_REVISIONS,
    MAX_TIMELINE_EVENTS,
    STORAGE_KEY,
    STORAGE_VERSION,
    LLMProviderType,
)
from .spatial_topology import get_default_floorplan

_LOGGER = logging.getLogger(__name__)

DEFAULT_GLOBAL_SETTINGS: dict[str, Any] = {
    "llm_provider_type": str(LLMProviderType.VISION_API),
    "llm_api_url": "",
    "llm_api_key": "",
    "llm_model": "gemini-2.5-flash",
    "llm_agent_id": "",
    "ble_trackers": list(DEFAULT_BLE_TRACKERS),
    "notifications_enabled": True,
    "slack_notify_service": DEFAULT_SLACK_NOTIFY_SERVICE,
    "slack_channel": DEFAULT_SLACK_CHANNEL,
    "negative_space_enabled": DEFAULT_NEGATIVE_SPACE_ENABLED,
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


class PDDStore:
    """Manage persistent .storage state for Presence Detection Designer."""

    def __init__(self, hass: Any) -> None:
        self.hass = hass
        self._store: Any = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self._data: dict[str, Any] = _default_store_data()
        self._loaded: bool = False

    async def async_load(self) -> dict[str, Any]:
        """Load .storage data and synchronize any existing ConfigEntries."""
        try:
            stored = await self._store.async_load()
        except Exception as err:  # noqa: BLE001
            _LOGGER.warning("Could not load .storage/%s: %s", STORAGE_KEY, err)
            stored = None

        dirty = False
        if not isinstance(stored, dict):
            stored = _default_store_data()
            dirty = True

        for key, default_val in _default_store_data().items():
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
                default_fp.get("version", 4)
            ):
                stored["floorplan"] = copy.deepcopy(default_fp)
                fp_dict = stored["floorplan"]
                dirty = True
            for layer_key in ("sensors", "ble_proxies"):
                if not fp_dict.get(layer_key) and default_fp.get(layer_key):
                    fp_dict[layer_key] = copy.deepcopy(default_fp[layer_key])
                    dirty = True
            # Backfill camera sub_zones if missing on stored cameras
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
            # Remove decommissioned basement Wyze PIR sensors and old Ring Stick Up Cam motion entity
            removed_sensor_ids = {
                "binary_sensor.motion_detector_basement1",
                "binary_sensor.motion_utility_room",
                "binary_sensor.family_room_motion",
            }
            orig_sensors = list(fp_dict.get("sensors", []) or [])
            filtered_sensors = [s for s in orig_sensors if s.get("id") not in removed_sensor_ids]
            if len(filtered_sensors) != len(orig_sensors):
                fp_dict["sensors"] = filtered_sensors
                dirty = True
            default_sens = {s["id"]: s for s in default_fp.get("sensors", []) if s.get("id")}
            for sen in fp_dict.get("sensors", []):
                sid = sen.get("id")
                if sid in default_sens:
                    ds = default_sens[sid]
                    if not sen.get("model_preset") and ds.get("model_preset"):
                        sen["model_preset"] = ds["model_preset"]
                        dirty = True
                    if sid == "binary_sensor.motion_sensor_gen2_motion_detection" and (
                        sen.get("range_px") == 260 or sen.get("x") == 525
                    ):
                        for k in ("name", "x", "y", "heading_deg", "fov_deg", "range_px"):
                            sen[k] = ds[k]
                        dirty = True
                    elif (
                        ds.get("model_preset") in ("ecobee_smart_sensor", "ecobee_thermostat_pir")
                        and sen.get("range_px") == 260
                    ):
                        for k in ("model_preset", "fov_deg", "range_px"):
                            sen[k] = ds[k]
                        dirty = True

        for k, v in DEFAULT_GLOBAL_SETTINGS.items():
            if k not in stored["global_settings"]:
                stored["global_settings"][k] = copy.deepcopy(v)
                dirty = True

        for _rid, rcfg in stored.get("rooms", {}).items():
            if isinstance(rcfg, dict):
                if rcfg.get(CONF_NOTIFY_SLACK) is None:
                    rcfg[CONF_NOTIFY_SLACK] = DEFAULT_NOTIFY_SLACK
                    dirty = True
                if rcfg.get(CONF_NOTIFY_ON_OCCUPIED) is None:
                    rcfg[CONF_NOTIFY_ON_OCCUPIED] = True
                    dirty = True
                if rcfg.get(CONF_NOTIFY_ON_CLEARED) is None:
                    rcfg[CONF_NOTIFY_ON_CLEARED] = True
                    dirty = True

        # Synchronize existing ConfigEntries into .storage rooms and global_settings
        if (
            self.hass
            and hasattr(self.hass, "config_entries")
            and hasattr(self.hass.config_entries, "async_entries")
        ):
            try:
                entries = self.hass.config_entries.async_entries(DOMAIN)
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

                    # Auto-populate global_settings from first room that has LLM settings
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

        self._data = stored
        self._loaded = True
        if dirty:
            await self.async_save()
        return self._data

    async def async_save(self) -> None:
        """Persist current store state to .storage."""
        try:
            await self._store.async_save(self._data)
        except Exception as err:  # noqa: BLE001
            _LOGGER.warning("Failed to save .storage/%s: %s", STORAGE_KEY, err)

    @property
    def global_settings(self) -> dict[str, Any]:
        """Return global shared settings."""
        return self._data["global_settings"]

    @property
    def rooms(self) -> dict[str, dict[str, Any]]:
        """Return mapping of entry_id -> room config."""
        return self._data["rooms"]

    def get_room(self, entry_id: str) -> dict[str, Any] | None:
        """Return stored config for a specific room entry_id."""
        room = self._data["rooms"].get(entry_id)
        return copy.deepcopy(room) if isinstance(room, dict) else None

    def get_revisions(self, entry_id: str) -> list[dict[str, Any]]:
        """Return list of saved revisions for a room (most recent first)."""
        revs = self._data["revisions"].get(entry_id, [])
        return copy.deepcopy(revs) if isinstance(revs, list) else []

    async def async_save_room(
        self,
        entry_id: str,
        config: dict[str, Any],
        note: str = "Updated via Design Studio",
        record_revision: bool = True,
    ) -> dict[str, Any]:
        """Save a room's configuration to .storage and push previous config to revisions."""
        prev = self._data["rooms"].get(entry_id)
        if record_revision and isinstance(prev, dict) and prev != config:
            rev_list = list(self._data["revisions"].get(entry_id) or [])
            rev_list.insert(
                0,
                {
                    "timestamp": datetime.datetime.now(datetime.UTC).isoformat(),
                    "note": note,
                    "config": copy.deepcopy(prev),
                },
            )
            self._data["revisions"][entry_id] = rev_list[:MAX_ROOM_REVISIONS]

        self._data["rooms"][entry_id] = copy.deepcopy(config)
        await self.async_save()
        return copy.deepcopy(config)

    async def async_rollback_room(
        self,
        entry_id: str,
        revision_index: int = 0,
    ) -> dict[str, Any]:
        """Restore a room configuration from its revision history."""
        rev_list = list(self._data["revisions"].get(entry_id) or [])
        if revision_index < 0 or revision_index >= len(rev_list):
            raise ValueError(f"Revision index {revision_index} out of range for {entry_id}")

        target_rev = rev_list.pop(revision_index)
        restored_cfg = copy.deepcopy(target_rev["config"])
        current_cfg = self._data["rooms"].get(entry_id)

        if isinstance(current_cfg, dict) and current_cfg != restored_cfg:
            rev_list.insert(
                0,
                {
                    "timestamp": datetime.datetime.now(datetime.UTC).isoformat(),
                    "note": f"Before rollback to {target_rev.get('timestamp', 'prior revision')}",
                    "config": copy.deepcopy(current_cfg),
                },
            )

        self._data["revisions"][entry_id] = rev_list[:MAX_ROOM_REVISIONS]
        self._data["rooms"][entry_id] = copy.deepcopy(restored_cfg)
        await self.async_save()
        return restored_cfg

    async def async_remove_room(self, entry_id: str) -> None:
        """Remove a room and its revisions/timeline from .storage."""
        changed = False
        if entry_id in self._data["rooms"]:
            self._data["rooms"].pop(entry_id, None)
            changed = True
        if entry_id in self._data["revisions"]:
            self._data["revisions"].pop(entry_id, None)
            changed = True
        if entry_id in self._data.get("timeline", {}):
            self._data["timeline"].pop(entry_id, None)
            changed = True
        if changed:
            await self.async_save()

    def get_timeline_events(self, entry_id: str) -> list[dict[str, Any]]:
        """Return chronological timeline events recorded for a room."""
        events = self._data.get("timeline", {}).get(entry_id, [])
        return copy.deepcopy(events) if isinstance(events, list) else []

    def record_timeline_event(
        self,
        entry_id: str,
        event: dict[str, Any],
    ) -> None:
        """Append a state transition / sensor snapshot to the room's rolling timeline buffer."""
        timeline_dict = self._data.setdefault("timeline", {})
        events = list(timeline_dict.get(entry_id) or [])
        now_dt = datetime.datetime.now(datetime.UTC)
        payload = {
            "ts": float(event.get("ts") or now_dt.timestamp()),
            "iso": str(event.get("iso") or now_dt.isoformat()),
            "is_present": bool(event.get("is_present", False)),
            "box_state": str(event.get("box_state", "idle_clear")),
            "probability_pct": float(event.get("probability_pct", 0.0)),
            "entity_states": dict(event.get("entity_states") or {}),
        }
        # Deduplicate if state and sensor map are identical to last event within 60s
        if events:
            last = events[-1]
            if (
                last.get("is_present") == payload["is_present"]
                and last.get("box_state") == payload["box_state"]
                and last.get("probability_pct") == payload["probability_pct"]
                and last.get("entity_states") == payload["entity_states"]
                and (payload["ts"] - float(last.get("ts", 0.0))) < 60.0
            ):
                return

        events.append(payload)
        if len(events) > MAX_TIMELINE_EVENTS:
            events = events[-MAX_TIMELINE_EVENTS:]
        timeline_dict[entry_id] = events

    async def async_update_global_settings(self, updates: dict[str, Any]) -> dict[str, Any]:
        """Update shared global settings in .storage."""
        gs = self._data["global_settings"]
        for key in (
            "llm_provider_type",
            "llm_api_url",
            "llm_api_key",
            "llm_model",
            "llm_agent_id",
            "slack_notify_service",
            "slack_channel",
        ):
            if key in updates and updates[key] is not None:
                gs[key] = str(updates[key]).strip()

        for bkey in ("notifications_enabled", "negative_space_enabled"):
            if bkey in updates and updates[bkey] is not None:
                gs[bkey] = bool(updates[bkey])

        if "ble_trackers" in updates and updates["ble_trackers"] is not None:
            raw_ble = updates["ble_trackers"]
            if isinstance(raw_ble, str):
                gs["ble_trackers"] = [x.strip() for x in raw_ble.split(",") if x.strip()]
            elif isinstance(raw_ble, list):
                gs["ble_trackers"] = [str(x).strip() for x in raw_ble if str(x).strip()]

        await self.async_save()
        return copy.deepcopy(gs)

    def get_floorplan(self) -> dict[str, Any]:
        """Return a deep copy of the stored 2D spatial floorplan and camera view cones."""
        fp = self._data.get("floorplan")
        if not isinstance(fp, dict) or not fp.get("floors"):
            fp = get_default_floorplan()
            self._data["floorplan"] = fp
        else:
            default_fp = get_default_floorplan()
            for layer_key in ("sensors", "ble_proxies"):
                if not fp.get(layer_key) and default_fp.get(layer_key):
                    fp[layer_key] = copy.deepcopy(default_fp[layer_key])
            default_cams = {c["id"]: c for c in default_fp.get("cameras", []) if c.get("id")}
            for cam in fp.get("cameras", []):
                cid = cam.get("id")
                if (
                    cid in default_cams
                    and not cam.get("sub_zones")
                    and default_cams[cid].get("sub_zones")
                ):
                    cam["sub_zones"] = copy.deepcopy(default_cams[cid]["sub_zones"])
        return copy.deepcopy(fp)

    async def async_save_floorplan(self, floorplan: dict[str, Any]) -> dict[str, Any]:
        """Persist an updated 2D spatial floorplan to .storage."""
        if not isinstance(floorplan, dict) or not floorplan.get("floors"):
            floorplan = get_default_floorplan()
        self._data["floorplan"] = copy.deepcopy(floorplan)
        await self.async_save()
        return copy.deepcopy(self._data["floorplan"])


async def async_get_store(hass: Any) -> PDDStore:
    """Get or initialize the singleton PDDStore in hass.data."""
    if not hasattr(hass, "data") or not isinstance(hass.data, dict):
        store = PDDStore(hass)
        await store.async_load()
        return store

    domain_data = hass.data.setdefault(DOMAIN, {})
    store = domain_data.get(DATA_STORE)
    if not isinstance(store, PDDStore):
        store = PDDStore(hass)
        await store.async_load()
        domain_data[DATA_STORE] = store
    return store
