"""Native Home Assistant .storage persistence repository for Presence Detection Designer."""

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
    DATA_STORE,
    DEFAULT_BLE_DECIDER_ENABLED,
    DEFAULT_BLE_TRACKERS,
    DEFAULT_DOOR_DUPLICATE_WINDOW,
    DEFAULT_EXIT_CORROBORATION_WINDOW,
    DEFAULT_EXIT_CORROBORATORS,
    DEFAULT_GUEST_MODE_ENABLED,
    DEFAULT_INTERIOR_DOORS,
    DEFAULT_MAX_OCCUPANTS,
    DEFAULT_NEGATIVE_SPACE_ENABLED,
    DEFAULT_PERIMETER_DOORS,
    DEFAULT_PIR_CANDIDATE_WINDOW,
    DEFAULT_PIR_VALIDATION_ENABLED,
    DEFAULT_SLACK_CHANNEL,
    DEFAULT_SLACK_NOTIFY_SERVICE,
    DEFAULT_SLACK_VERBOSITY,
    DEFAULT_STALE_COUNT_TIMEOUT,
    DOMAIN,
    MAX_ROOM_REVISIONS,
    MAX_TIMELINE_EVENTS,
    STORAGE_KEY,
    STORAGE_VERSION,
    LLMProviderType,
)
from .spatial_topology import get_default_floorplan
from .store_migrations import migrate_and_backfill_store_payload

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
    "slack_verbosity": DEFAULT_SLACK_VERBOSITY,
    "slack_daily_thread": True,
    "slack_notify_transitions": False,
    "include_camera_snapshot": False,
    "negative_space_enabled": DEFAULT_NEGATIVE_SPACE_ENABLED,
    "guest_mode_enabled": DEFAULT_GUEST_MODE_ENABLED,
    "ble_decider_enabled": DEFAULT_BLE_DECIDER_ENABLED,
    "pir_validation_enabled": DEFAULT_PIR_VALIDATION_ENABLED,
    "pir_candidate_window": DEFAULT_PIR_CANDIDATE_WINDOW,
    "transit_window_sec": 90.0,
    "settling_window_sec": 2.0,
    "house_occupant_count": 1,
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
        "daily_threads": {},
    }


class PDDStore:
    """Persist and retrieve .storage state for Presence Detection Designer."""

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

        stored, dirty = migrate_and_backfill_store_payload(
            self.hass,
            stored,
            _default_store_data,
            DEFAULT_GLOBAL_SETTINGS,
        )

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
            "occupancy_state": str(event.get("occupancy_state", "vacant")),
            "probability_pct": float(event.get("probability_pct", 0.0)),
            "entity_states": dict(event.get("entity_states") or {}),
        }
        if events:
            last = events[-1]
            if (
                last.get("is_present") == payload["is_present"]
                and last.get("occupancy_state") == payload["occupancy_state"]
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
            "slack_verbosity",
        ):
            if key in updates and updates[key] is not None:
                gs[key] = str(updates[key]).strip()

        for bkey in (
            "notifications_enabled",
            "negative_space_enabled",
            "guest_mode_enabled",
            "ble_decider_enabled",
            "slack_daily_thread",
            "slack_notify_transitions",
            "include_camera_snapshot",
            "enable_conservation_law",
        ):
            if bkey in updates and updates[bkey] is not None:
                gs[bkey] = bool(updates[bkey])

        if "house_occupant_count" in updates and updates["house_occupant_count"] is not None:
            gs["house_occupant_count"] = max(0, int(updates["house_occupant_count"]))

        if "ble_trackers" in updates and updates["ble_trackers"] is not None:
            raw_ble = updates["ble_trackers"]
            if isinstance(raw_ble, str):
                gs["ble_trackers"] = [x.strip() for x in raw_ble.split(",") if x.strip()]
            elif isinstance(raw_ble, list):
                gs["ble_trackers"] = [str(x).strip() for x in raw_ble if str(x).strip()]

        await self.async_save()
        return copy.deepcopy(gs)

    async def async_save_global_settings(self, updates: dict[str, Any]) -> dict[str, Any]:
        """Alias for async_update_global_settings."""
        return await self.async_update_global_settings(updates)

    def get_daily_threads(self) -> dict[str, Any]:
        """Return cached daily thread metadata map."""
        return self._data.setdefault("daily_threads", {})

    async def async_save_daily_thread(self, channel: str, data: dict[str, Any]) -> None:
        """Persist daily thread timestamp for a channel."""
        self._data.setdefault("daily_threads", {})[channel] = copy.deepcopy(data)
        await self.async_save()

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
        from .trajectory_validator import clear_topology_cache

        clear_topology_cache()
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
