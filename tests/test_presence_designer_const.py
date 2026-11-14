"""Test Presence Detection Designer constants and manifest."""

import json
from pathlib import Path

import pytest

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
    DEFAULT_INACTIVITY_TIMEOUT,
    DEFAULT_MAX_HOLD_TIMEOUT,
    DEFAULT_VERIFY_TIMEOUT,
    DOMAIN,
    Mode,
    OccupancyState,
)


@pytest.mark.requirement("STATE-01", category="STATE", req_type="PositiveFeature")
def test_constants_defined():
    """Verify essential constants and OccupancyState enum values are set properly."""
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
    assert DEFAULT_MAX_HOLD_TIMEOUT == 1800
    assert DEFAULT_VERIFY_TIMEOUT == 30

    assert OccupancyState.VACANT == "vacant"
    assert OccupancyState.OCCUPIED_CONFIRMED == "occupied_confirmed"
    assert OccupancyState.OCCUPIED_HOLDING == "occupied_holding"
    assert OccupancyState.OCCUPIED_COOLING == "occupied_cooling"
    assert OccupancyState.OCCUPIED_VERIFYING == "occupied_verifying"
    assert OccupancyState.OVERRIDE == "override"

    assert Mode.BOUNDED == "bounded"
    assert Mode.OPEN == "open"


def test_manifest_valid():
    """Verify manifest.json is well formed and declares transitions dependency."""
    manifest_path = Path(
        "/home/steve/Repos/ha-presence-detection-designer/custom_components/presence_detection_designer/manifest.json"
    )
    assert manifest_path.exists(), "manifest.json must exist"
    data = json.loads(manifest_path.read_text())
    assert data["domain"] == DOMAIN
    assert data["name"] == "Presence Detection Designer"
    assert "version" in data
    assert "config_flow" in data and data["config_flow"] is True
    assert any("transitions" in req for req in data.get("requirements", []))
