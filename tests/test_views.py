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
    Mode,
    OccupancyState,
)
from custom_components.presence_detection_designer.coordinator import (
    RoomPresenceCoordinator,
)
from custom_components.presence_detection_designer.views import (
    PDDCameraAlignView,
    PDDGlobalSettingsView,
    PDDOverviewView,
    PDDPreviewBayesianView,
    PDDRoomActionView,
    PDDRoomConfigView,
    PDDRoomRollbackView,
    PDDStateGraphView,
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

    # Room is occupied_confirmed because bed_zone is 'on'
    assert coord.state_machine.is_present is True
    assert coord.state_machine.state == OccupancyState.OCCUPIED_CONFIRMED

    # Now sensor turns off -> room enters bounded occupied_cooling (not stuck OCCUPIED_SEALED)
    st_bed.state = "off"
    coord.async_refresh_all_states()
    assert coord.state_machine.is_present is True
    assert coord.state_machine.state == OccupancyState.OCCUPIED_COOLING

    # Hot-apply a new configuration (e.g. changing timeout and threshold) in-place
    new_cfg = {
        **initial_cfg,
        CONF_BAYESIAN_THRESHOLD: 0.78,
        CONF_INACTIVITY_TIMEOUT: 600,
    }
    await coord.async_apply_config_in_place(new_cfg)

    # Active cooling occupancy is preserved without requiring a reload or re-trigger!
    assert coord.state_machine.is_present is True
    assert coord.state_machine.state == OccupancyState.OCCUPIED_COOLING
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
    assert mock_hass.http.register_view.call_count == 14

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
    assert data["rooms"][0]["occupancy_state"] == "occupied_confirmed"
    assert "stateDiagram" in data["rooms"][0]["mermaid_diagram"]

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


async def test_camera_alignment_view(mock_hass):
    """Test PDDCameraAlignView endpoint with synthetic snapshot."""
    import base64

    from tests.test_camera_alignment_cv import create_synthetic_room_snapshot

    img_bytes = create_synthetic_room_snapshot(width=640, height=480, horizon_y=190)
    img_b64 = "data:image/jpeg;base64," + base64.b64encode(img_bytes).decode("ascii")

    align_view = PDDCameraAlignView()
    req = _make_request(
        mock_hass,
        {
            "image_b64": img_b64,
            "camera_dict": {
                "id": "camera.living_room",
                "x": 175,
                "y": 530,
                "heading_deg": 18.0,
                "fov_deg": 65.0,
                "host_room": "Living Room",
            },
            "room_box": {
                "name": "Living Room",
                "x": 160,
                "y": 325,
                "width": 235,
                "height": 220,
            },
            "entryways": [
                {
                    "id": "arch_lr_entry",
                    "wall": "right",
                    "offset": 30,
                    "width": 130,
                    "type": "open_passage",
                    "target_room": "Front Entry",
                }
            ],
        },
    )

    status, res = _unpack(await align_view.post(req, "camera.living_room"))
    assert status == 200
    assert res["success"] is True
    assert "tilt_deg" in res
    assert "recommended_heading_deg" in res
    assert res["annotated_image"].startswith("data:image/jpeg;base64,")


async def test_notification_test_view(mock_hass):
    """Test PDDNotificationTestView endpoint."""
    from custom_components.presence_detection_designer.views import PDDNotificationTestView

    view = PDDNotificationTestView()
    req = _make_request(
        mock_hass,
        {
            "notify_service": "notify.mobile_app_phone",
            "notify_target": "phone",
        },
    )

    status, res = _unpack(await view.post(req))
    assert status == 200
    assert res["success"] is True
    assert "notify.mobile_app_phone" in res["message"]


async def test_timeline_reconstruction_view(mock_hass):
    """Test PDDTimelineReconstructionView with negative_space=true and false."""
    from custom_components.presence_detection_designer.views import PDDTimelineReconstructionView

    view = PDDTimelineReconstructionView()
    req_on = _make_request(mock_hass, {})
    req_on.query = {"hours": "2", "negative_space": "true"}

    status_on, res_on = _unpack(await view.get(req_on))
    assert status_on == 200
    assert res_on["negative_space_enabled"] is True
    assert "frames" in res_on
    assert "transitions" in res_on
    assert "comparison_summary" in res_on

    req_off = _make_request(mock_hass, {})
    req_off.query = {"hours": "2", "negative_space": "false"}
    status_off, res_off = _unpack(await view.get(req_off))
    assert status_off == 200
    assert res_off["negative_space_enabled"] is False


@pytest.mark.requirement("UI-01", category="UI", req_type="PositiveFeature")
@pytest.mark.anyio
async def test_state_graph_view_returns_mermaid_and_history(mock_hass):
    """@requirement UI-01: State graph endpoint returns live Mermaid diagram and transition audit feed."""
    mock_hass.states.get = MagicMock(return_value=MagicMock(state="on", attributes={}))
    coord = RoomPresenceCoordinator(
        mock_hass,
        "entry_sg",
        {
            CONF_ROOM_NAME: "Kitchen",
            CONF_MODE: str(Mode.OPEN),
            CONF_TRIGGER_ENTITIES: ["binary_sensor.kitchen_island_person_occupancy"],
        },
    )
    await coord.async_setup()
    mock_hass.data.setdefault(DOMAIN, {})["entry_sg"] = coord

    view = PDDStateGraphView()
    req = _make_request(mock_hass)
    req.query = {}
    status, body = _unpack(await view.get(req))
    assert status == 200
    assert len(body["rooms"]) == 1
    room = body["rooms"][0]
    assert room["occupancy_state"] == OccupancyState.OCCUPIED_CONFIRMED
    assert "stateDiagram" in room["mermaid_diagram"]
    assert isinstance(room["transition_history"], list)
    assert len(room["transition_history"]) >= 1


@pytest.mark.requirement("UI-01", category="UI", req_type="PositiveFeature")
@pytest.mark.anyio
async def test_serialize_room_coordinator_includes_pir_gate_and_sensor_weights(mock_hass):
    """@requirement UI-01: Room serializer exposes PIR Gate telemetry and sensor reliability weights."""
    from custom_components.presence_detection_designer.view_serializers import (
        serialize_room_coordinator,
    )

    mock_hass.states.get = MagicMock(return_value=MagicMock(state="off", attributes={}))
    coord = RoomPresenceCoordinator(
        mock_hass,
        "entry_ser",
        {
            CONF_ROOM_NAME: "Bedroom",
            CONF_MODE: str(Mode.OPEN),
            CONF_TRIGGER_ENTITIES: ["binary_sensor.bedroom_pir_motion"],
            CONF_BAYESIAN_OBSERVATIONS: [
                {
                    "entity_id": "binary_sensor.bedroom_pir_motion",
                    "label": "Bedroom PIR",
                    "preset": "strong",
                    "operator": "equals",
                    "state": "on",
                },
                {
                    "entity_id": "sensor.office_ups_used_watts_filtered",
                    "label": "Office UPS",
                    "preset": "supporting",
                    "operator": "greater_than",
                    "state": "140",
                },
            ],
            "max_hold_timeout": 2400,
            "pir_validation_enabled": True,
            "pir_candidate_window": 20.0,
        },
    )
    await coord.async_setup()

    payload = serialize_room_coordinator(coord)
    assert payload["max_hold_timeout"] == 2400
    assert payload["pir_validation_enabled"] is False
    assert payload["pir_validation_state"] == "disabled"
    assert isinstance(payload["pir_transition_history"], list)

    weights = {w["entity_id"]: w for w in payload["sensor_weights"]}
    assert weights["binary_sensor.bedroom_pir_motion"]["human_exclusive"] is True
    assert weights["binary_sensor.bedroom_pir_motion"]["requires_pir_validation"] is True
    assert weights["sensor.office_ups_used_watts_filtered"]["human_exclusive"] is False


@pytest.mark.requirement("UI-01", category="UI", req_type="PositiveFeature")
@pytest.mark.anyio
async def test_preview_bayesian_view_applies_contextual_ble_penalties_and_neutral_camera(mock_hass):
    """@requirement UI-01: Bayesian preview penalizes confirmed other-room BLE while keeping camera/PIR off neutral."""

    def _state_getter(entity_id: str):
        states = {
            "sensor.steve_s_s25_ble_area": MagicMock(state="Living Room", attributes={}),
            "binary_sensor.living_room_person_occupancy": MagicMock(state="on", attributes={}),
            "binary_sensor.office_person_occupancy": MagicMock(state="off", attributes={}),
            "binary_sensor.office_motion_occupancy": MagicMock(state="off", attributes={}),
        }
        return states.get(entity_id)

    mock_hass.states.get = MagicMock(side_effect=_state_getter)
    lr_coord = RoomPresenceCoordinator(
        mock_hass,
        "entry_lr",
        {
            CONF_ROOM_NAME: "Living Room",
            CONF_MODE: str(Mode.OPEN),
            CONF_TRIGGER_ENTITIES: ["binary_sensor.living_room_person_occupancy"],
        },
    )
    await lr_coord.async_setup()
    mock_hass.data.setdefault(DOMAIN, {})["entry_lr"] = lr_coord

    preview = PDDPreviewBayesianView()
    req = _make_request(
        mock_hass,
        {
            "ble_decider_enabled": True,
            "config": {
                "room_name": "Office",
                "bayesian_prior": 0.2,
                "bayesian_threshold": 0.75,
                "bayesian_observations": [
                    {
                        "entity_id": "sensor.steve_s_s25_ble_area",
                        "label": "Steve BLE",
                        "preset": "moderate",
                        "operator": "equals",
                        "state": "Office",
                    },
                    {
                        "entity_id": "binary_sensor.office_person_occupancy",
                        "label": "Office Camera Person",
                        "preset": "decisive",
                        "operator": "equals",
                        "state": "on",
                    },
                    {
                        "entity_id": "binary_sensor.office_motion_occupancy",
                        "label": "Office PIR",
                        "preset": "strong",
                        "operator": "equals",
                        "state": "on",
                    },
                ],
            },
        },
    )

    status, res = _unpack(await preview.post(req))
    assert status == 200
    assert res["probability"] == 0.0
    inactive = {o["entity_id"]: o for o in res["inactive_observations"]}
    assert inactive["sensor.steve_s_s25_ble_area"]["likelihood_ratio"] < 0.99
    assert inactive["binary_sensor.office_person_occupancy"]["likelihood_ratio"] == 1.0
    assert inactive["binary_sensor.office_motion_occupancy"]["likelihood_ratio"] == 1.0
    assert len(res["sensor_weights"]) == 3


@pytest.mark.requirement("UI-02", category="UI", req_type="PositiveFeature")
def test_blueprints_consume_occupancy_state_without_box_state():
    """@requirement UI-02: PDD automation blueprints use occupancy_state cleanly without legacy box_state."""
    from pathlib import Path

    import yaml

    class _HALoader(yaml.SafeLoader):
        pass

    _HALoader.add_constructor(
        "!input", lambda loader, node: f"!input:{loader.construct_scalar(node)}"
    )

    repo_root = Path(__file__).resolve().parent.parent
    bp_dir = repo_root / "blueprints" / "automation" / "spelech"
    pdd_blueprints = sorted(bp_dir.glob("pdd_*.yaml"))
    assert len(pdd_blueprints) >= 3

    for bp_path in pdd_blueprints:
        raw = bp_path.read_text(encoding="utf-8")
        for stale in ("box_state", "timer_active", "occupied_sealed", "occupied_unsealed"):
            assert stale not in raw, f"Stale attribute/state {stale!r} in {bp_path.name}"
        parsed = yaml.load(raw, Loader=_HALoader)
        assert parsed["blueprint"]["domain"] == "automation"

    lighting_raw = (bp_dir / "pdd_presence_lighting.yaml").read_text(encoding="utf-8")
    for required_tok in (
        "attribute: occupancy_state",
        "occupied_cooling",
        "occupied_confirmed",
        "occupied_holding",
        "override",
    ):
        assert required_tok in lighting_raw


@pytest.mark.requirement("UI-02", category="UI", req_type="PositiveFeature")
def test_panel_js_ui_contracts():
    """@requirement UI-02: panel.js exposes PIR Gate, max_hold_timeout, Automations tab, and valid presets."""
    from pathlib import Path

    repo_root = Path(__file__).resolve().parent.parent
    panel_js = (
        repo_root / "custom_components" / "presence_detection_designer" / "static" / "panel.js"
    ).read_text(encoding="utf-8")

    for stale in ("box_state", "timer_active", "occupied_sealed", "occupied_unsealed"):
        assert stale not in panel_js, f"Found legacy token {stale!r} in panel.js"

    assert "prob_given_true ?? 0.25" not in panel_js
    assert "this._api(" not in panel_js
    for required_id in (
        "cfg-max-hold-timeout",
        "cfg-pir-validation-enabled",
        "cfg-pir-candidate-window",
        "gl-pir-validation-enabled",
        "gl-pir-candidate-window",
        "PIR Validation Gate",
        "Automations &amp; Blueprints",
        "pdd_presence_lighting.yaml",
        "Solo sensors crossing score/hold threshold",
    ):
        assert required_id in panel_js, f"Missing UI contract token {required_id!r} in panel.js"


@pytest.mark.requirement("UI-02", category="UI", req_type="PositiveFeature")
def test_panel_js_responsive_and_state_chart_strip():
    """@requirement UI-02: panel.js includes container-query HA-sidebar layout, floorplan layers/legend, badge strip, and multipane settings."""
    from pathlib import Path

    repo_root = Path(__file__).resolve().parent.parent
    panel_js = (
        repo_root / "custom_components" / "presence_detection_designer" / "static" / "panel.js"
    ).read_text(encoding="utf-8")

    for tok in (
        "@container pdd (max-width: 1460px)",
        "ResizeObserver",
        ".room-badge-strip",
        ".fp-layer-bar",
        ".fp-legend-panel",
        ".settings-nav",
        "#gl-ui-advanced-mode",
        "gl-ui-advanced-mode",
        ".sm-lifecycle-strip",
        "View State Chart",
        "set panel(panel)",
        "_panelVersion",
        'this._floorplanMode = "devices"',
        "this._roomsLocked = true",
        "btn-fp-mode-devices",
        "btn-fp-lock-rooms",
        "btn-fp-undo",
        "btn-fp-redo",
        "btn-fp-reset-rooms",
        "btn-fp-reset-selected-room",
        "_transformSvgPath",
        "_updateFloorplanCanvasInPlace",
        "_buildLosAndConeHandlesSvg",
        "fp-controls-layer",
        "fp-hit-target",
        "fp-quick-bar",
        "fp-live-hud",
    ):
        assert tok in panel_js, f"Missing UI layout/state-chart token {tok!r}"


@pytest.mark.asyncio
@pytest.mark.requirement("UI-02", category="UI", req_type="PositiveFeature")
async def test_store_global_settings_persists_ui_advanced_and_pir_gate(mock_hass):
    """@requirement UI-02: GlobalSettings view and PDDStore persist ui_advanced_mode, pir_validation_enabled, and clamped pir_candidate_window."""
    from custom_components.presence_detection_designer.store import async_get_store

    store = await async_get_store(mock_hass)
    assert store.global_settings["ui_advanced_mode"] is False

    gs_view = PDDGlobalSettingsView()
    status, gs_res = _unpack(
        await gs_view.post(
            _make_request(
                mock_hass,
                {
                    "ui_advanced_mode": True,
                    "pir_validation_enabled": False,
                    "pir_candidate_window": 1,
                },
            )
        )
    )
    assert status == 200
    assert gs_res["global_settings"]["ui_advanced_mode"] is True
    assert gs_res["global_settings"]["pir_validation_enabled"] is False
    assert gs_res["global_settings"]["pir_candidate_window"] == 3
    assert store.global_settings["ui_advanced_mode"] is True
    assert store.global_settings["pir_validation_enabled"] is False
    assert store.global_settings["pir_candidate_window"] == 3


@pytest.mark.asyncio
async def test_ensure_panel_and_views_registers_static_alias_and_serializes(monkeypatch):
    """_async_ensure_panel_and_views registers both static paths and serializes concurrent calls."""
    import asyncio
    from types import SimpleNamespace

    from custom_components.presence_detection_designer import _async_ensure_panel_and_views

    registered_paths = []
    view_calls = 0

    class FakeHttp:
        async def async_register_static_paths(self, configs):
            await asyncio.sleep(0.01)
            registered_paths.extend(c.url_path for c in configs)

    hass = SimpleNamespace(
        data={},
        http=FakeHttp(),
        config=SimpleNamespace(path=lambda p: f"/tmp/{p}"),
    )

    def fake_register_views(_hass):
        nonlocal view_calls
        view_calls += 1

    monkeypatch.setattr(
        "custom_components.presence_detection_designer.async_register_views",
        fake_register_views,
    )

    await asyncio.gather(
        _async_ensure_panel_and_views(hass),
        _async_ensure_panel_and_views(hass),
        _async_ensure_panel_and_views(hass),
    )

    assert "/presence_detection_designer/static" in registered_paths
    assert "/presence_detection_designer_static" in registered_paths
    assert registered_paths.count("/presence_detection_designer/static") == 1
    assert view_calls == 1


def test_coordinator_timer_hook_uses_ha_callback(monkeypatch):
    """RoomPresenceCoordinator._attach_ha_timer_hooks decorates async_call_later callback with @callback."""
    from types import SimpleNamespace

    from homeassistant.core import is_callback

    from custom_components.presence_detection_designer.coordinator import RoomPresenceCoordinator

    captured = []

    def fake_async_call_later(_hass, _delay, action):
        captured.append(action)
        return lambda: None

    monkeypatch.setattr(
        "homeassistant.helpers.event.async_call_later",
        fake_async_call_later,
    )

    hass = SimpleNamespace(loop=object(), data={}, states=None)
    coord = RoomPresenceCoordinator(
        hass,
        "entry_cb_1",
        {"room_name": "Callback Room", "trigger_entities": []},
    )
    coord._attach_ha_timer_hooks()
    assert coord.state_machine._timer_scheduler is not None
    coord.state_machine._timer_scheduler(1.0, lambda: None)
    assert len(captured) == 1
    assert is_callback(captured[0]) is True


@pytest.mark.requirement("UI-03", category="UI", req_type="PositiveFeature")
def test_panel_js_floorplan_pointer_ux():
    """@requirement UI-03: Floorplan defaults to device editing with locked rooms, dead-zone, smooth PIR/camera LOS handles, polygon preservation, and undo/reset."""
    import shutil
    import subprocess
    from pathlib import Path

    node_bin = shutil.which("node")
    if not node_bin:
        pytest.skip("node executable not available for JS behavioral verification")

    repo_root = Path(__file__).resolve().parent.parent
    panel_path = (
        repo_root / "custom_components" / "presence_detection_designer" / "static" / "panel.js"
    )
    js_test = r"""
const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

const src = fs.readFileSync(process.argv[1], "utf8");

function makeElement(tag = "div") {
  return {
    tagName: tag.toUpperCase(),
    attributes: {},
    listeners: {},
    children: [],
    style: {},
    value: "",
    innerHTML: "",
    classList: { contains: () => false, add: () => {}, remove: () => {} },
    setAttribute(k, v) { this.attributes[k] = String(v); },
    getAttribute(k) { return this.attributes[k] ?? null; },
    addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    closest() { return null; },
    setPointerCapture() {},
    releasePointerCapture() {},
    hasPointerCapture() { return false; },
    getScreenCTM() { return { inverse: () => ({}) }; },
  };
}

class FakeHTMLElement {
  constructor() {
    this.shadowRoot = makeElement("shadow-root");
  }
  attachShadow() { return this.shadowRoot; }
}

const defined = {};
const sandbox = {
  HTMLElement: FakeHTMLElement,
  customElements: { define(n, c) { defined[n] = c; }, get(n) { return defined[n]; } },
  document: {
    createElement: (t) => makeElement(t),
    addEventListener: () => {},
    removeEventListener: () => {},
    activeElement: null,
  },
  window: { addEventListener: () => {}, removeEventListener: () => {} },
  localStorage: { _m: {}, getItem(k) { return this._m[k] || null; }, setItem(k, v) { this._m[k] = String(v); } },
  requestAnimationFrame: (fn) => { fn(); return 1; },
  cancelAnimationFrame: () => {},
  ResizeObserver: class { observe() {} disconnect() {} },
  console,
  setTimeout,
  clearTimeout,
  Math,
  JSON,
  Number,
  String,
  Array,
  Object,
  Map,
  Set,
};
sandbox.globalThis = sandbox;
vm.runInNewContext(src, sandbox);

const PanelClass = defined["presence-detection-designer-panel"];
assert(PanelClass, "Panel custom element should register");

const panel = new PanelClass();
assert.strictEqual(panel._floorplanMode, "devices");
assert.strictEqual(panel._roomsLocked, true);

panel._floorplan = panel._loadLocalOrDefaultFloorplan();
panel._compiledTopology = panel._compileFloorplanClient(panel._floorplan);
panel._studioView = "floorplan";
panel._selectedFloorId = "main";
panel._hass = {
  callApi: async () => ({ status: "ok" }),
  states: {},
};

const svgCanvas = makeElement("svg");
svgCanvas.id = "fp-svg-canvas";
svgCanvas.createSVGPoint = () => ({ x: 0, y: 0, matrixTransform: function() { return { x: this.x, y: this.y }; } });
svgCanvas.getScreenCTM = () => ({ inverse: () => ({}) });

const hudEl = makeElement("div");
const saveEl = makeElement("span");
const rootSelectors = {
  "#fp-svg-canvas": svgCanvas,
  "#fp-live-hud": hudEl,
  "#fp-save-state": saveEl,
};
panel.shadowRoot.querySelector = (sel) => rootSelectors[sel] || null;
panel.shadowRoot.querySelectorAll = () => [];
panel.render = () => {};

// Wire pointer handlers on fake svgCanvas via _attachListeners slice or direct setup:
// Re-run _attachListeners with guarded root queries so all canvas pointer listeners attach.
panel._bindEvents();

const lRoom = panel._floorplan.rooms.find((r) => r.svg_path && (r.floor || "main") === "main");
assert(lRoom, "Default floorplan should include L-shaped svg_path room");
const origRoomX = lRoom.x;
const origRoomY = lRoom.y;
const origSvgPath = lRoom.svg_path;

// 1. Clicking/dragging a room in default 'devices' mode must NOT grab or move the room.
const fakeRoomTarget = {
  closest(sel) {
    if (sel === ".fp-room-box") return { getAttribute: (k) => (k === "data-room-name" ? (lRoom.name || lRoom.room_name) : null) };
    return null;
  },
};
const fire = (type, props) => {
  for (const fn of (svgCanvas.listeners[type] || [])) {
    fn({ preventDefault() {}, stopPropagation() {}, pointerId: 1, shiftKey: false, ...props });
  }
};
fire("pointerdown", { clientX: origRoomX + 20, clientY: origRoomY + 20, target: fakeRoomTarget });
fire("pointermove", { clientX: origRoomX + 60, clientY: origRoomY + 60, target: fakeRoomTarget });
fire("pointerup", { clientX: origRoomX + 60, clientY: origRoomY + 60, target: fakeRoomTarget });
assert.strictEqual(lRoom.x, origRoomX, "Room X must stay unchanged in devices mode");
assert.strictEqual(lRoom.y, origRoomY, "Room Y must stay unchanged in devices mode");
assert.strictEqual(panel._fpUndoStack.length, 0, "No undo pushed when room is protected");

// 2. Micro-movement (< 4px dead-zone) on PIR origin must NOT mutate coordinates or push undo.
const pir = panel._floorplan.sensors.find((s) => s.sensor_type !== "door_contact");
assert(pir, "Default floorplan should contain a PIR sensor");
const origPirX = pir.x;
const origPirY = pir.y;
const origPirRange = pir.range_px || 180;
const fakePirOrigin = {
  closest(sel) {
    if (sel === ".fp-sensor-origin") return { getAttribute: (k) => (k === "data-sensor-id" ? pir.id : null) };
    return null;
  },
};
fire("pointerdown", { clientX: origPirX, clientY: origPirY, target: fakePirOrigin });
fire("pointermove", { clientX: origPirX + 2, clientY: origPirY + 2, target: fakePirOrigin });
fire("pointerup", { clientX: origPirX + 2, clientY: origPirY + 2, target: fakePirOrigin });
assert.strictEqual(pir.x, origPirX);
assert.strictEqual(pir.y, origPirY);
assert.strictEqual(panel._fpUndoStack.length, 0, "Dead-zone click must not push undo");

// 3. Dragging PIR heading handle rotates LOS without clobbering range_px.
const fakePirHeading = {
  closest(sel) {
    if (sel === ".fp-sensor-handle") {
      return {
        getAttribute: (k) => (k === "data-handle" ? "heading" : k === "data-sensor-id" ? pir.id : null),
      };
    }
    return null;
  },
};
fire("pointerdown", { clientX: origPirX + 45, clientY: origPirY, target: fakePirHeading });
fire("pointermove", { clientX: origPirX, clientY: origPirY - 45, target: fakePirHeading });
fire("pointerup", { clientX: origPirX, clientY: origPirY - 45, target: fakePirHeading });
assert.strictEqual(pir.heading_deg, 270, "Dragging directly up from PIR should aim 270 deg");
assert.strictEqual(pir.range_px || 180, origPirRange, "Heading drag must NOT collapse PIR range_px");
assert.strictEqual(panel._fpUndoStack.length, 1);

// 4. Dragging unlocked room in 'rooms' mode preserves svg_path, and _resetFloorplanRooms(true) restores exact room while keeping PIR aim.
panel._floorplanMode = "rooms";
panel._roomsLocked = false;
fire("pointerdown", { clientX: origRoomX + 20, clientY: origRoomY + 20, target: fakeRoomTarget });
fire("pointermove", { clientX: origRoomX + 40, clientY: origRoomY + 50, target: fakeRoomTarget });
fire("pointerup", { clientX: origRoomX + 40, clientY: origRoomY + 50, target: fakeRoomTarget });
assert.notStrictEqual(lRoom.x, origRoomX);
assert(lRoom.svg_path && lRoom.svg_path.length > 0, "Moving room must preserve svg_path polygon");
assert.notStrictEqual(lRoom.svg_path, origSvgPath, "Moving room must translate svg_path coordinates");

panel._resetFloorplanRooms(true);
const restoredRoom = panel._floorplan.rooms.find((r) => (r.name || r.room_name) === (lRoom.name || lRoom.room_name));
assert.strictEqual(restoredRoom.x, origRoomX);
assert.strictEqual(restoredRoom.y, origRoomY);
assert.strictEqual(restoredRoom.svg_path, origSvgPath);
assert.strictEqual(
  panel._floorplan.sensors.find((s) => s.id === pir.id).heading_deg,
  270,
  "Restoring rooms must keep sensor edits intact"
);

// 5. Undo/redo round-trip works cleanly.
panel._undoFp();
assert.notStrictEqual(
  panel._floorplan.rooms.find((r) => (r.name || r.room_name) === (lRoom.name || lRoom.room_name)).x,
  origRoomX
);
panel._redoFp();
assert.strictEqual(
  panel._floorplan.rooms.find((r) => (r.name || r.room_name) === (lRoom.name || lRoom.room_name)).x,
  origRoomX
);
"""
    proc = subprocess.run(
        [node_bin, "-e", js_test, str(panel_path)],
        capture_output=True,
        text=True,
        timeout=20,
    )
    assert proc.returncode == 0, (
        f"Node floorplan UX test failed:\nSTDOUT:{proc.stdout}\nSTDERR:{proc.stderr}"
    )


@pytest.mark.requirement("UI-03", category="UI", req_type="PositiveFeature")
def test_panel_js_ui_polish_behaviors():
    """@requirement UI-03: panel.js provides room colors, camera friendly-name select, preset detection, room-pill floor focus, and scroll-safe timeline playback."""
    import shutil
    import subprocess
    from pathlib import Path

    node_bin = shutil.which("node")
    if not node_bin:
        pytest.skip("Node.js not installed")

    panel_path = (
        Path(__file__).resolve().parent.parent
        / "custom_components"
        / "presence_detection_designer"
        / "static"
        / "panel.js"
    )
    panel_text = panel_path.read_text(encoding="utf-8")
    for tok in (
        "1. Canvas Edit Tool",
        "2. Map Visibility",
        "Map Editing &amp; Room Sync",
        "Focus Room on Map",
        "cfg-verify-feedback",
        "Locate Camera",
        "data-tip=",
        '<select class="select" id="cfg-camera-entity"',
    ):
        assert tok in panel_text, f"Missing UI polish token {tok!r}"

    js_test = r"""
const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

const src = fs.readFileSync(process.argv[1], "utf8");
function makeElement(tag) {
  return {
    tagName: tag,
    style: {},
    innerHTML: "",
    textContent: "",
    value: "",
    listeners: {},
    classList: {
      _set: new Set(),
      add(c) { this._set.add(c); },
      remove(c) { this._set.delete(c); },
      toggle(c, force) {
        if (force === undefined) {
          if (this._set.has(c)) this._set.delete(c); else this._set.add(c);
        } else if (force) this._set.add(c); else this._set.delete(c);
      },
      contains(c) { return this._set.has(c); },
    },
    addEventListener(type, fn) {
      if (!this.listeners[type]) this.listeners[type] = [];
      this.listeners[type].push(fn);
    },
    setAttribute() {},
    getAttribute() { return null; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
  };
}
class FakeHTMLElement {
  constructor() {
    this.shadowRoot = {
      innerHTML: "",
      querySelector: () => null,
      querySelectorAll: () => [],
    };
  }
  attachShadow() { return this.shadowRoot; }
}
const defined = {};
const sandbox = {
  HTMLElement: FakeHTMLElement,
  customElements: { define(n, c) { defined[n] = c; }, get(n) { return defined[n]; } },
  document: {
    createElement: (t) => makeElement(t),
    addEventListener: () => {},
    removeEventListener: () => {},
    activeElement: null,
  },
  window: { addEventListener: () => {}, removeEventListener: () => {} },
  localStorage: { _m: {}, getItem(k) { return this._m[k] || null; }, setItem(k, v) { this._m[k] = String(v); } },
  requestAnimationFrame: (fn) => { fn(); return 1; },
  cancelAnimationFrame: () => {},
  ResizeObserver: class { observe() {} disconnect() {} },
  console,
  setTimeout,
  clearTimeout,
  Math,
  JSON,
  Number,
  String,
  Array,
  Object,
  Map,
  Set,
  Date,
};
sandbox.globalThis = sandbox;
vm.runInNewContext(src, sandbox);

const PanelClass = defined["presence-detection-designer-panel"];
const panel = new PanelClass();
panel._floorplan = panel._loadLocalOrDefaultFloorplan();
panel._overview = {
  rooms: [
    { entry_id: "r1", room_name: "Kitchen", config: {}, connected_rooms: [] },
    { entry_id: "r2", room_name: "Office", config: {}, connected_rooms: [] },
    { entry_id: "r3", room_name: "Living Room", config: {}, connected_rooms: [] },
  ],
  entities: [
    { entity_id: "camera.kitchen_cam", name: "Kitchen Camera", domain: "camera" },
    { entity_id: "camera.office_cam", name: "Office Desk Cam", domain: "camera" },
    { entity_id: "binary_sensor.kitchen_pir", name: "Kitchen PIR", domain: "binary_sensor" },
  ],
};

// 1. Per-room deterministic colors
const c1 = panel._getRoomColor("Kitchen");
const c2 = panel._getRoomColor("Office");
assert.strictEqual(c1.hex, panel._getRoomColor("Kitchen").hex);
assert.notStrictEqual(c1.hex, c2.hex, "Different rooms should receive distinct colors");

// 2. Camera select options use friendly names and exclude non-cameras
const camOptsHtml = panel._renderCameraSelectOptions("camera.office_cam", panel._overview.entities);
assert(camOptsHtml.includes("Kitchen Camera (camera.kitchen_cam)"));
assert(camOptsHtml.includes("Office Desk Cam (camera.office_cam)"));
assert(!camOptsHtml.includes("binary_sensor.kitchen_pir"));

// 3. Preset detection
const presetsMap = panel._getFpPresetsMap();
panel._fpLayers = { ...presetsMap.cameras };
assert.strictEqual(panel._detectActiveFpPreset(), "cameras");
panel._fpLayers.ble = true;
assert.strictEqual(panel._detectActiveFpPreset(), null);

// 4. Selecting room pill on floorplan jumps to that room's floor
panel._studioView = "floorplan";
panel._selectedFloorId = "main";
const upstairsRoom = panel._floorplan.rooms.find((r) => r.floor && r.floor !== "main");
assert(upstairsRoom, "Default floorplan should have a non-main floor room");
const upstairsName = upstairsRoom.name || upstairsRoom.room_name;
let renderCalls = 0;
panel.render = () => { renderCalls++; };
panel._selectRoomObject({ entry_id: "rx", room_name: upstairsName, config: {}, connected_rooms: [] }, true);
assert.strictEqual(panel._selectedFloorId, upstairsRoom.floor, "Room pill focus should jump to room floor");
assert.strictEqual(panel._selectedRoomBoxName, upstairsName);
assert.strictEqual(renderCalls, 1);

// 5. Timeline scrubbing updates DOM in-place without calling render()
panel._studioView = "timeline";
panel._selectedFloorId = "main";
panel._timelineData = {
  frames: [
    { iso: "2026-11-16T20:00:00Z", occupied_rooms: ["Kitchen"], occupant_estimates: [{ room: "Kitchen", floor: "main", x: 100, y: 100 }] },
    { iso: "2026-11-16T20:05:00Z", occupied_rooms: ["Living Room"], occupant_estimates: [{ room: "Living Room", floor: "main", x: 300, y: 200 }] },
  ],
};
panel._timelineFrameIdx = 1;
const tlSvg = makeElement("svg");
const tlReadout = makeElement("div");
const tlSlider = makeElement("input");
const tlActive = makeElement("span");
const selectorMap = {
  "#tl-svg-canvas": tlSvg,
  "#tl-time-readout": tlReadout,
  "#tl-scrubber-slider": tlSlider,
  "#tl-active-rooms": tlActive,
};
panel.shadowRoot.querySelector = (sel) => selectorMap[sel] || null;
panel.shadowRoot.querySelectorAll = () => [];
renderCalls = 0;
const ok = panel._updateTimelineFrameInPlace();
assert.strictEqual(ok, true);
assert.strictEqual(renderCalls, 0, "In-place timeline frame update must NOT call render()");
assert.strictEqual(tlSlider.value, "1");
assert.strictEqual(tlActive.textContent, "Living Room");
assert(tlSvg.innerHTML.includes("Living Room"));

// 6. Per-floor room colors NEVER repeat on the same floor even with 20+ rooms
const seenPerFloor = {};
for (const r of panel._floorplan.rooms) {
  const fl = r.floor || "main";
  const rn = r.name || r.room_name;
  const col = panel._getRoomColor(rn).hex;
  if (!seenPerFloor[fl]) seenPerFloor[fl] = new Set();
  assert(!seenPerFloor[fl].has(col), `Duplicate color ${col} on floor ${fl} for ${rn}`);
  seenPerFloor[fl].add(col);
}

// 7. All-floors timeline parts render every floor simultaneously + person picture / kid / dog + arrows
panel._overview.entities.push({
  entity_id: "person.steve",
  name: "Steve",
  domain: "person",
  entity_picture: "/api/image/serve/steve_avatar/512x512",
});
panel._timelineFloor = "all";
panel._timelineData = {
  frames: [
    {
      ts: 1000,
      iso: "2026-11-16T20:00:00Z",
      occupied_rooms: ["Kitchen"],
      occupant_estimates: [{ room: "Kitchen", floor: "main", occupant_label: "Steve", occupant_type: "tracked_human", method: "positive" }],
    },
    {
      ts: 1020,
      iso: "2026-11-16T20:00:20Z",
      occupied_rooms: ["Living Room", "Margot's Room"],
      occupant_estimates: [
        { room: "Living Room", floor: "main", occupant_label: "Steve", occupant_type: "tracked_human", method: "positive" },
        { room: "Margot's Room", floor: "upstairs", occupant_label: "Margot", occupant_type: "untracked_human", method: "positive" },
      ],
      pet_estimates: [{ room: "Dining Room", floor: "main", occupant_label: "Riley (Dog)", occupant_type: "pet" }],
    },
  ],
  transitions: [
    {
      ts: 1020,
      iso: "2026-11-16T20:00:20Z",
      from_room: "Kitchen",
      to_room: "Living Room",
      from_floor: "main",
      to_floor: "main",
      occupant_key: "Steve",
      occupant_label: "Steve",
      occupant_type: "tracked_human",
      method: "hybrid",
      positive_drivers: ["binary_sensor.kitchen_pir"],
      negative_space_evidence: ["camera.living_room"],
    },
  ],
};
panel._timelineFrameIdx = 1;
const multiParts = panel._buildTimelineFrameParts();
assert.strictEqual(multiParts.floorParts.length, panel._floorplan.floors.length, "All Floors mode must render every floor");
const mainPart = multiParts.floorParts.find((fp) => fp.floor.id === "main");
const upPart = multiParts.floorParts.find((fp) => fp.floor.id === "upstairs");
assert(mainPart.svgInner.includes("/api/image/serve/steve_avatar/512x512"), "Confirmed person should use entity_picture");
assert(mainPart.svgInner.includes("🐶"), "Dog should use dog icon");
assert(mainPart.arrowsSvg.includes("marker-end"), "Same-floor transition should draw directional arrow");
assert(upPart.svgInner.includes("🧒"), "Kid should use kid icon");

// 8. ASD-STE100 transition formatter uses short active-voice sentences
const ste = panel._formatTransitionSte100(panel._timelineData.transitions[0], new Map([["binary_sensor.kitchen_pir", "Kitchen PIR"], ["camera.living_room", "Living Room Cam"]]));
assert.strictEqual(ste.actionText, "Steve moved from Kitchen to Living Room.");
assert(ste.reasonText.includes("Sensor Kitchen PIR detected motion. Camera Living Room Cam shows no person."));

// 9. Solid vs Dashed rings, lower-right count badge, persistent dashed arrows, and clean cross-floor
assert(mainPart.arrowsSvg.includes('stroke-dasharray="6,4"'), "Same-floor movement arrow must be dashed");
assert(!mainPart.occupantsSvg.includes('tl-occ-count-badge'), "Count badge must stay hidden when count === 1");
assert(!mainPart.occupantsSvg.includes('stroke-dasharray="5,3"'), "Confirmed occupant should render solid ring border");

// Test inferred occupant (dashed ring), grouped room count badge (2), persistent arrow past 8 frames, and clean cross-floor
const manyFrames = [];
for (let i = 0; i < 16; i++) {
  manyFrames.push({
    ts: 2000 + i * 10,
    iso: `2026-11-16T21:00:${String(i).padStart(2, "0")}Z`,
    occupied_rooms: i === 0 ? ["Kitchen"] : ["Living Room", "Master Bathroom"],
    occupant_estimates: i === 0
      ? [{ room: "Kitchen", floor: "main", occupant_label: "Steve", occupant_type: "tracked_human", method: "positive" }]
      : [
          { room: "Living Room", floor: "main", occupant_label: "Occupant", occupant_type: "human", method: "negative_space", from_room: "Kitchen", from_floor: "main" },
          { room: "Living Room", floor: "main", occupant_label: "Occupant", occupant_type: "human", method: "negative_space" },
          { room: "Master Bathroom", floor: "upstairs", occupant_label: "Steve", occupant_type: "tracked_human", method: "positive", from_room: "Kitchen", from_floor: "main" },
        ],
  });
}
panel._timelineData = { frames: manyFrames, transitions: [], house_occupant_count: 2 };
panel._timelineFrameIdx = 15;
const ringParts = panel._buildTimelineFrameParts();
const ringMain = ringParts.floorParts.find((fp) => fp.floor.id === "main");
const ringUp = ringParts.floorParts.find((fp) => fp.floor.id === "upstairs");
assert(ringMain.occupantsSvg.includes('stroke-dasharray="5,3"'), "Inferred occupant must render dashed ring");
assert(ringMain.occupantsSvg.includes('tl-occ-count-badge') && ringMain.occupantsSvg.includes('>2</text>'), "Grouped identical generic occupants (>1) in same room must show count badge 2");
assert(ringMain.arrowsSvg.includes('stroke-dasharray="6,4"'), "Dashed movement arrow must persist beyond 8 frames while in room");
assert(ringUp.occupantsSvg.includes("From Main"), "Cross-floor transition must show clean From <Floor> pill");
assert(ringUp.arrowsSvg.includes('stroke-dasharray="4,3"'), "Cross-floor transition must show compact dashed entry stub");
"""
    proc = subprocess.run(
        [node_bin, "-e", js_test, str(panel_path)],
        capture_output=True,
        text=True,
        timeout=20,
    )
    assert proc.returncode == 0, (
        f"Node UI polish test failed:\nSTDOUT:{proc.stdout}\nSTDERR:{proc.stderr}"
    )


@pytest.mark.asyncio
@pytest.mark.requirement("UI-03", category="API", req_type="PositiveFeature")
async def test_room_action_verify_presence_camera_override(mock_hass):
    """@requirement UI-03: PDDRoomActionView passes selected camera_entity to async_manual_verify."""
    from unittest.mock import patch

    room_cfg = {
        CONF_ROOM_NAME: "Kitchen",
        CONF_MODE: str(Mode.BOUNDED),
        CONF_TRIGGER_ENTITIES: ["binary_sensor.kitchen_pir"],
    }
    coordinator = RoomPresenceCoordinator(mock_hass, "entry_verify_ui", room_cfg)
    coordinator.state_machine.handle_llm_result(False, "Empty room check")
    mock_hass.data.setdefault(DOMAIN, {})["entry_verify_ui"] = coordinator

    view = PDDRoomActionView()
    with patch.object(coordinator, "async_manual_verify", new_callable=AsyncMock) as mock_verify:
        status, body = _unpack(
            await view.post(
                _make_request(
                    mock_hass,
                    {"action": "verify_presence", "camera_entity": "camera.test_override"},
                ),
                "entry_verify_ui",
            )
        )
    assert status == 200
    assert body["status"] == "ok"
    mock_verify.assert_awaited_once_with(camera_entity="camera.test_override")


@pytest.mark.asyncio
async def test_timeline_reconstruction_view_uses_component_logs(mock_hass):
    """PDDTimelineReconstructionView plays back recorded PDDStore component logs directly."""
    import time

    from custom_components.presence_detection_designer.store import async_get_store
    from custom_components.presence_detection_designer.views import PDDTimelineReconstructionView

    store = await async_get_store(mock_hass)
    now = time.time()
    await store.async_save_room("entry_kitchen", {"room_name": "Kitchen"})
    await store.async_save_room("entry_office", {"room_name": "Office"})
    store.record_timeline_event(
        "entry_kitchen",
        {
            "ts": now - 120.0,
            "is_present": True,
            "occupancy_state": "occupied_confirmed",
            "probability_pct": 94.5,
            "verified_by": "camera",
            "camera_confirmed": True,
            "house_occupant_count": 1,
            "entity_states": {"binary_sensor.kitchen_person_occupancy": "on"},
        },
    )
    store.record_timeline_event(
        "entry_kitchen",
        {
            "ts": now - 60.0,
            "is_present": True,
            "occupancy_state": "occupied_holding",
            "probability_pct": 72.0,
            "entity_states": {},
        },
    )
    store.record_timeline_event(
        "entry_office",
        {
            "ts": now - 55.0,
            "is_present": True,
            "occupancy_state": "occupied_confirmed",
            "probability_pct": 91.2,
            "entity_states": {
                "binary_sensor.office_person_occupancy": "on",
                "sensor.steve_s_s25_ble_area": "Office",
            },
        },
    )

    view = PDDTimelineReconstructionView()
    req = _make_request(mock_hass, {})
    req.query = {"hours": "1", "negative_space": "true"}
    status, body = _unpack(await view.get(req))
    assert status == 200
    assert body["source"] == "component_logs"
    assert len(body["frames"]) >= 2
    last_occ = body["frames"][-1]["occupant_estimates"]
    office_occ = next(o for o in last_occ if o["room"] == "Office")
    kitchen_occ = next(o for o in last_occ if o["room"] == "Kitchen")
    assert office_occ["method"] == "positive"
    assert office_occ["occupant_label"] == "Steve"
    assert office_occ["probability_pct"] == 91.2
    assert kitchen_occ["method"] == "negative_space"
    assert kitchen_occ["occupancy_state"] == "occupied_holding"
