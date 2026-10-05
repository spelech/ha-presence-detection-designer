"""Test Presence Detection Designer constants and manifest."""

import json
from pathlib import Path

from custom_components.presence_detection_designer.const import (
    CONF_BOUNDARY_ENTITIES,
    CONF_CAMERA_ENTITY,
    CONF_INACTIVITY_TIMEOUT,
    CONF_LLM_ENABLED,
    CONF_LLM_PROVIDER_TYPE,
    CONF_MODE,
    CONF_ROOM_NAME,
    CONF_SUSTAINING_CONDITIONS,
    CONF_TRIGGER_ENTITIES,
    DEFAULT_GRACE_TIMEOUT,
    DEFAULT_INACTIVITY_TIMEOUT,
    DOMAIN,
    BoxState,
    Mode,
)


def test_constants_defined():
    """Verify essential constants are set properly."""
    assert DOMAIN == "presence_detection_designer"
    assert CONF_ROOM_NAME == "room_name"
    assert CONF_MODE == "mode"
    assert CONF_BOUNDARY_ENTITIES == "boundary_entities"
    assert CONF_TRIGGER_ENTITIES == "trigger_entities"
    assert CONF_SUSTAINING_CONDITIONS == "sustaining_conditions"
    assert CONF_INACTIVITY_TIMEOUT == "inactivity_timeout"
    assert CONF_LLM_ENABLED == "llm_enabled"
    assert CONF_CAMERA_ENTITY == "camera_entity"
    assert CONF_LLM_PROVIDER_TYPE == "llm_provider_type"
    assert DEFAULT_INACTIVITY_TIMEOUT == 300
    assert DEFAULT_GRACE_TIMEOUT == 60

    assert BoxState.IDLE_CLEAR == "idle_clear"
    assert BoxState.OCCUPIED_SEALED == "occupied_sealed"
    assert BoxState.OCCUPIED_UNSEALED == "occupied_unsealed"
    assert BoxState.TIMER_ACTIVE == "timer_active"
    assert BoxState.LLM_VERIFYING == "llm_verifying"
    assert BoxState.OVERRIDE == "override"

    assert Mode.BOUNDED == "bounded"
    assert Mode.OPEN == "open"


def test_manifest_valid():
    """Verify manifest.json is well formed."""
    manifest_path = Path("custom_components/presence_detection_designer/manifest.json")
    assert manifest_path.exists(), "manifest.json must exist"
    data = json.loads(manifest_path.read_text())
    assert data["domain"] == DOMAIN
    assert data["name"] == "Presence Detection Designer"
    assert "version" in data
    assert "config_flow" in data and data["config_flow"] is True
