"""Unit tests for the Visual Design Studio HTTP views and hot-apply coordinator updates."""

from __future__ import annotations

import json
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest

from custom_components.presence_detection_designer.const import (
    CONF_BAYESIAN_OBSERVATIONS,
    CONF_BAYESIAN_PRIOR,
    CONF_BAYESIAN_THRESHOLD,
    CONF_BOUNDARY_ENTITIES,
    CONF_INACTIVITY_TIMEOUT,
    CONF_MODE,
    CONF_ROOM_NAME,
    CONF_TRIGGER_ENTITIES,
    DOMAIN,
    BayesianWeightPreset,
    BoxState,
    Mode,
)
from custom_components.presence_detection_designer.coordinator import (
    RoomPresenceCoordinator,
)
from custom_components.presence_detection_designer.views import (
    PDDGlobalSettingsView,
    PDDOverviewView,
    PDDPreviewBayesianView,
    PDDRoomActionView,
    PDDRoomConfigView,
    PDDRoomRollbackView,
    PDDTranslateView,
    async_apply_and_persist_room_config,
    async_register_views,
    build_combinatorics_preview,
    collect_ha_areas_and_entities,
)


def _unpack(resp: Any) -> tuple[int, dict[str, Any]]:
    """Extract (status_code, json_dict) from either aiohttp.web.Response or fallback dict."""
    if isinstance(resp, dict) and "status_code" in resp:
        return int(resp["status_code"]), resp["body"]
    status = getattr(resp, "status", 200)
    raw_body = getattr(resp, "body", b"{}")
    if isinstance(raw_body, bytes):
        return status, json.loads(raw_body.decode("utf-8"))
    return status, json.loads(str(raw_body))


def _make_request(hass: Any, body: dict[str, Any] | None = None) -> MagicMock:
    """Create a mock aiohttp Request bound to hass."""
    req = MagicMock()
    req.app = {"hass": hass}
    if body is not None:
        req.json = AsyncMock(return_value=body)
    else:
        req.json = AsyncMock(side_effect=ValueError("No JSON body"))
    return req


def test_combinatorics_preview_solo_and_pairs():
    """Verify solo triggers, sub-threshold sensors, and pair corroborations are categorized accurately."""
    observations = [
        {
            "entity_id": "binary_sensor.office_desk_person_occupancy",
            "label": "Office Desk Zone",
            "preset": str(BayesianWeightPreset.DECISIVE),
            "operator": "equals",
            "state": "on",
        },
        {
            "entity_id": "sensor.steve_s_s25_ble_area",
            "label": "Phone BLE in Office",
            "preset": str(BayesianWeightPreset.MODERATE),
            "operator": "equals",
            "state": "Office",
        },
        {
            "entity_id": "binary_sensor.office_occupancy",
            "label": "Ecobee Occupancy",
            "preset": str(BayesianWeightPreset.SUPPORTING),
            "operator": "equals",
            "state": "on",
        },
        {
            "entity_id": "light.office_lights",
            "label": "Office Lights",
            "preset": str(BayesianWeightPreset.SUPPORTING),
            "operator": "equals",
            "state": "on",
        },
    ]

    comb = build_combinatorics_preview(
        prior=0.20,
        threshold=0.75,
        observations=observations,
    )

    assert comb["prior_pct"] == 20.0
    assert comb["threshold_pct"] == 75.0
    assert len(comb["solo_triggers"]) == 1
    assert comb["solo_triggers"][0]["label"] == "Office Desk Zone"
    assert comb["solo_triggers"][0]["posterior_pct"] > 90.0

    # Moderate + Supporting (60% solo + 40.7% solo -> ~80.5% combined) crosses 75%
    pair_labels = [p["labels"] for p in comb["pair_triggers"]]
    assert any("Phone BLE in Office + Ecobee Occupancy" in lbl for lbl in pair_labels)

    # Supporting + Supporting (2.75x * 2.75x from 20% prior -> ~65.4%) stays below 75%
    sub_labels = [p["labels"] for p in comb["pair_sub_threshold"]]
    assert any("Ecobee Occupancy + Office Lights" in lbl for lbl in sub_labels)


@pytest.mark.anyio
async def test_hot_apply_preserves_occupancy_state(mock_hass):
    """Verify async_apply_config_in_place updates room rules without dropping active occupancy."""
    st_door = MagicMock()
    st_door.state = "off"  # closed
    st_door.attributes = {"friendly_name": "Bedroom Door"}

    st_bed = MagicMock()
    st_bed.state = "on"
    st_bed.attributes = {"friendly_name": "Bed Zone"}

    mock_hass.states.get = MagicMock(
        side_effect=lambda eid: {
            "binary_sensor.bedroom_door": st_door,
            "binary_sensor.bed_zone": st_bed,
        }.get(eid)
    )

    initial_cfg = {
        CONF_ROOM_NAME: "Master Bedroom",
        CONF_MODE: str(Mode.BOUNDED),
        CONF_BOUNDARY_ENTITIES: ["binary_sensor.bedroom_door"],
        CONF_TRIGGER_ENTITIES: ["binary_sensor.bed_zone"],
        CONF_BAYESIAN_PRIOR: 0.22,
        CONF_BAYESIAN_THRESHOLD: 0.75,
        CONF_INACTIVITY_TIMEOUT: 300,
    }
    coord = RoomPresenceCoordinator(mock_hass, "entry_mb", initial_cfg)
    await coord.async_setup()

    # Room is occupied & sealed because bed_zone is 'on' and door is 'off'
    assert coord.state_machine.is_present is True
    assert coord.state_machine.box_state == BoxState.OCCUPIED_SEALED

    # Now sensor turns off while person is sleeping inside sealed room
    st_bed.state = "off"
    coord.async_refresh_all_states()
    assert coord.state_machine.is_present is True
    assert coord.state_machine.box_state == BoxState.OCCUPIED_SEALED

    # Hot-apply a new configuration (e.g. changing timeout and threshold) in-place
    new_cfg = {
        **initial_cfg,
        CONF_BAYESIAN_THRESHOLD: 0.78,
        CONF_INACTIVITY_TIMEOUT: 600,
    }
    await coord.async_apply_config_in_place(new_cfg)

    # Active sealed occupancy is preserved without requiring a reload or re-trigger!
    assert coord.state_machine.is_present is True
    assert coord.state_machine.box_state == BoxState.OCCUPIED_SEALED
    assert coord.bayesian_threshold == 0.78
    assert coord.state_machine.inactivity_timeout == 600


@pytest.mark.anyio
async def test_views_end_to_end(mock_hass):
    """Test Overview, RoomConfig, Rollback, RoomAction, PreviewBayesian, GlobalSettings, and Translate views."""
    st_desk = MagicMock()
    st_desk.entity_id = "binary_sensor.office_desk_person_occupancy"
    st_desk.state = "on"
    st_desk.attributes = {"friendly_name": "Office Desk Person", "device_class": "occupancy"}

    mock_hass.states.async_all = MagicMock(return_value=[st_desk])
    mock_hass.states.get = MagicMock(
        side_effect=lambda eid: (
            st_desk if eid == "binary_sensor.office_desk_person_occupancy" else None
        )
    )
    mock_hass.http = MagicMock()
    async_register_views(mock_hass)
    assert mock_hass.http.register_view.call_count == 9

    coord = RoomPresenceCoordinator(
        mock_hass,
        "entry_office",
        {
            CONF_ROOM_NAME: "Office",
            CONF_MODE: str(Mode.OPEN),
            CONF_TRIGGER_ENTITIES: ["binary_sensor.office_desk_person_occupancy"],
            CONF_BAYESIAN_PRIOR: 0.20,
            CONF_BAYESIAN_THRESHOLD: 0.75,
        },
    )
    await coord.async_setup()
    mock_hass.data.setdefault(DOMAIN, {})["entry_office"] = coord

    # 1. Overview view
    overview_view = PDDOverviewView()
    status, data = _unpack(await overview_view.get(_make_request(mock_hass)))
    assert status == 200
    assert len(data["rooms"]) == 1
    assert data["rooms"][0]["room_name"] == "Office"
    assert data["rooms"][0]["is_present"] is True
    assert "decisive" in data["presets"]

    # 2. RoomConfig view (save update and create revision)
    cfg_view = PDDRoomConfigView()
    req_save = _make_request(
        mock_hass,
        {
            "note": "Raise threshold to 80%",
            "config": {
                CONF_ROOM_NAME: "Office",
                CONF_MODE: str(Mode.OPEN),
                CONF_TRIGGER_ENTITIES: ["binary_sensor.office_desk_person_occupancy"],
                CONF_BAYESIAN_PRIOR: 0.20,
                CONF_BAYESIAN_THRESHOLD: 0.80,
            },
        },
    )
    status, save_res = _unpack(await cfg_view.post(req_save, "entry_office"))
    assert status == 200
    assert save_res["room"]["bayesian_threshold"] == 0.80

    # Save a second update so we have a revision to roll back to
    req_save2 = _make_request(
        mock_hass,
        {
            "note": "Raise threshold to 85%",
            "config": {
                CONF_ROOM_NAME: "Office",
                CONF_MODE: str(Mode.OPEN),
                CONF_TRIGGER_ENTITIES: ["binary_sensor.office_desk_person_occupancy"],
                CONF_BAYESIAN_PRIOR: 0.20,
                CONF_BAYESIAN_THRESHOLD: 0.85,
            },
        },
    )
    status, save_res2 = _unpack(await cfg_view.post(req_save2, "entry_office"))
    assert status == 200
    assert save_res2["room"]["bayesian_threshold"] == 0.85
    assert len(save_res2["room"]["revisions"]) >= 1

    # 3. Rollback view
    rb_view = PDDRoomRollbackView()
    status, rb_res = _unpack(
        await rb_view.post(
            _make_request(mock_hass, {"revision_index": 0}),
            "entry_office",
        )
    )
    assert status == 200
    assert rb_res["room"]["bayesian_threshold"] == 0.80

    # 4. RoomAction view (set_override and force_refresh)
    act_view = PDDRoomActionView()
    status, act_res = _unpack(
        await act_view.post(
            _make_request(mock_hass, {"action": "set_override", "enabled": True}),
            "entry_office",
        )
    )
    assert status == 200
    assert act_res["room"]["override"] is True

    status, act_res2 = _unpack(
        await act_view.post(
            _make_request(mock_hass, {"action": "force_refresh"}),
            "entry_office",
        )
    )
    assert status == 200

    # Missing room returns 404
    status_404, _ = _unpack(await act_view.post(_make_request(mock_hass, {}), "nonexistent_room"))
    assert status_404 == 404

    # 5. PreviewBayesian view
    prev_view = PDDPreviewBayesianView()
    status, prev_res = _unpack(
        await prev_view.post(
            _make_request(
                mock_hass,
                {
                    "config": {
                        CONF_ROOM_NAME: "Office",
                        CONF_BAYESIAN_PRIOR: 0.20,
                        CONF_BAYESIAN_THRESHOLD: 0.75,
                        CONF_BAYESIAN_OBSERVATIONS: [
                            {
                                "entity_id": "binary_sensor.office_desk_person_occupancy",
                                "label": "Office Desk",
                                "preset": "decisive",
                                "operator": "equals",
                                "state": "on",
                            }
                        ],
                    }
                },
            )
        )
    )
    assert status == 200
    assert prev_res["is_occupied"] is True
    assert prev_res["probability_pct"] > 90.0
    assert "platform: bayesian" in prev_res["ha_bayesian_yaml"]

    # 6. GlobalSettings view
    gs_view = PDDGlobalSettingsView()
    status, gs_res = _unpack(
        await gs_view.post(
            _make_request(
                mock_hass,
                {
                    "llm_model": "gemini-2.5-flash",
                    "ble_trackers": ["sensor.steve_s_s25_ble_area"],
                },
            )
        )
    )
    assert status == 200
    assert gs_res["global_settings"]["llm_model"] == "gemini-2.5-flash"

    # 7. Translate view (deterministic fallback with use_llm=False)
    tr_view = PDDTranslateView()
    status, tr_res = _unpack(
        await tr_view.post(
            _make_request(
                mock_hass,
                {
                    "entry_id": "entry_office",
                    "direction": "yaml_to_nl",
                    "use_llm": False,
                },
            )
        )
    )
    assert status == 200
    assert "Office" in tr_res["natural_language"]
    assert "platform: bayesian" in tr_res["ha_bayesian_yaml"]

    # Also test collect_ha_areas_and_entities directly
    areas, entities = collect_ha_areas_and_entities(mock_hass)
    assert isinstance(areas, list)
    assert len(entities) == 1
    assert entities[0]["entity_id"] == "binary_sensor.office_desk_person_occupancy"

    # Also test async_apply_and_persist_room_config when no coordinator is running
    res_unloaded = await async_apply_and_persist_room_config(
        mock_hass,
        "entry_unloaded",
        {CONF_ROOM_NAME: "Guest Room"},
    )
    assert res_unloaded["config"][CONF_ROOM_NAME] == "Guest Room"
