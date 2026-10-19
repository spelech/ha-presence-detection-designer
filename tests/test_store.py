"""Unit tests for the native .storage manager (PDDStore)."""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest

from custom_components.presence_detection_designer.const import (
    CONF_BAYESIAN_PRIOR,
    CONF_BAYESIAN_THRESHOLD,
    CONF_LLM_API_KEY,
    CONF_LLM_API_URL,
    CONF_LLM_MODEL,
    CONF_LLM_PROVIDER_TYPE,
    CONF_MODE,
    CONF_ROOM_NAME,
    MAX_ROOM_REVISIONS,
    Mode,
)
from custom_components.presence_detection_designer.store import (
    PDDStore,
    async_get_store,
)


@pytest.mark.anyio
async def test_store_load_and_config_entry_sync(mock_hass):
    """Test PDDStore initializes default structure and syncs existing ConfigEntries."""
    entry = MagicMock()
    entry.entry_id = "entry_office"
    entry.data = {
        CONF_ROOM_NAME: "Office",
        CONF_MODE: str(Mode.OPEN),
        CONF_LLM_API_URL: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        CONF_LLM_API_KEY: "test-secret-key",
        CONF_LLM_MODEL: "gemini-2.5-flash",
        CONF_LLM_PROVIDER_TYPE: "vision_api",
    }
    entry.options = {CONF_BAYESIAN_THRESHOLD: 0.78}
    mock_hass.config_entries.async_entries = MagicMock(return_value=[entry])

    store = await async_get_store(mock_hass)
    # Calling async_get_store again returns the exact same singleton
    assert await async_get_store(mock_hass) is store

    office = store.get_room("entry_office")
    assert office is not None
    assert office[CONF_ROOM_NAME] == "Office"
    assert office[CONF_BAYESIAN_THRESHOLD] == 0.78
    assert store.global_settings["llm_api_key"] == "test-secret-key"
    assert store.global_settings["llm_model"] == "gemini-2.5-flash"


@pytest.mark.anyio
async def test_store_revisions_and_rollback(mock_hass):
    """Test saving room revisions, capping at MAX_ROOM_REVISIONS, and rolling back."""
    store = PDDStore(mock_hass)
    await store.async_load()

    initial_cfg = {
        CONF_ROOM_NAME: "Master Bedroom",
        CONF_MODE: str(Mode.BOUNDED),
        CONF_BAYESIAN_PRIOR: 0.22,
        CONF_BAYESIAN_THRESHOLD: 0.75,
    }
    await store.async_save_room("entry_mb", initial_cfg, note="Initial setup")
    assert store.get_revisions("entry_mb") == []

    # Saving identical config does not add a duplicate revision
    await store.async_save_room("entry_mb", initial_cfg, note="No-op save")
    assert store.get_revisions("entry_mb") == []

    # Push 18 revisions and verify cap at MAX_ROOM_REVISIONS (15)
    for idx in range(1, 19):
        updated = dict(initial_cfg)
        updated[CONF_BAYESIAN_THRESHOLD] = round(0.50 + idx * 0.01, 2)
        await store.async_save_room("entry_mb", updated, note=f"Tune #{idx}")

    revs = store.get_revisions("entry_mb")
    assert len(revs) == MAX_ROOM_REVISIONS
    # Most recent revision (before #18 was applied) had threshold from #17 (0.67)
    assert revs[0]["config"][CONF_BAYESIAN_THRESHOLD] == 0.67
    assert revs[0]["note"] == "Tune #18"

    # Rollback to index 0 (restores 0.67 and records 0.68 in revision history)
    restored = await store.async_rollback_room("entry_mb", 0)
    assert restored[CONF_BAYESIAN_THRESHOLD] == 0.67
    assert store.get_room("entry_mb")[CONF_BAYESIAN_THRESHOLD] == 0.67
    revs_after = store.get_revisions("entry_mb")
    assert revs_after[0]["config"][CONF_BAYESIAN_THRESHOLD] == 0.68

    # Out-of-bounds rollback raises ValueError
    with pytest.raises(ValueError, match="out of range"):
        await store.async_rollback_room("entry_mb", 99)


@pytest.mark.anyio
async def test_store_global_settings_and_remove_room(mock_hass):
    """Test updating global settings (string and list BLE trackers) and removing rooms."""
    store = PDDStore(mock_hass)
    await store.async_load()

    await store.async_save_room("entry_temp", {CONF_ROOM_NAME: "Temp"})
    await store.async_save_room("entry_temp", {CONF_ROOM_NAME: "Temp 2"})
    assert store.get_room("entry_temp") is not None
    assert len(store.get_revisions("entry_temp")) == 1

    await store.async_remove_room("entry_temp")
    assert store.get_room("entry_temp") is None
    assert store.get_revisions("entry_temp") == []

    gs = await store.async_update_global_settings(
        {
            "llm_model": "gemini-2.5-pro",
            "ble_trackers": "sensor.phone_a_ble, sensor.tablet_b_ble",
        }
    )
    assert gs["llm_model"] == "gemini-2.5-pro"
    assert gs["ble_trackers"] == ["sensor.phone_a_ble", "sensor.tablet_b_ble"]

    gs2 = await store.async_update_global_settings({"ble_trackers": ["sensor.watch_ble"]})
    assert gs2["ble_trackers"] == ["sensor.watch_ble"]
