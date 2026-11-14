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
            "slack_notify_service": "notify.scdbots",
            "slack_channel": "#presence-alerts",
        },
    )

    status, res = _unpack(await view.post(req))
    assert status == 200
    assert res["success"] is True
    assert "#presence-alerts" in res["message"]


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
            CONF_TRIGGER_ENTITIES: ["binary_sensor.kitchen_motion"],
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
    assert payload["pir_validation_enabled"] is True
    assert payload["pir_candidate_window"] == 20.0
    assert "pir_validation_state" in payload
    assert "stateDiagram" in payload["pir_mermaid_diagram"]
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
            }
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
