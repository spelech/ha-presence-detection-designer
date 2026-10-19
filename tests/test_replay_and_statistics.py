"""Unit tests for Phase 2 (Statistics & Timeline) and Phase 3 (Historical What-If Replay Simulator)."""

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
    CONF_GRACE_TIMEOUT,
    CONF_INACTIVITY_TIMEOUT,
    CONF_MODE,
    CONF_ROOM_NAME,
    CONF_TRIGGER_ENTITIES,
    DOMAIN,
    Mode,
)
from custom_components.presence_detection_designer.coordinator import (
    RoomPresenceCoordinator,
)
from custom_components.presence_detection_designer.replay_engine import (
    collect_room_tracked_entities,
    simulate_replay_comparison,
)
from custom_components.presence_detection_designer.store import async_get_store
from custom_components.presence_detection_designer.views import (
    PDDReplayView,
    PDDStatisticsView,
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


def test_simulate_config_and_replay_comparison_eliminates_false_positives():
    """Verify historical simulation and What-If Replay accurately detect and eliminate false positives."""
    start_ts = 1_700_000_000.0
    end_ts = start_ts + 3600.0  # 1 hour window

    # Baseline config has Tablet BLE mistakenly set to 'moderate' (0.72 / 0.12)
    # and Ecobee Occupancy set to 'supporting' (0.55 / 0.20) -> together they cross 75% (80.5%)!
    baseline_cfg = {
        CONF_ROOM_NAME: "Living Room",
        CONF_MODE: str(Mode.OPEN),
        CONF_BAYESIAN_PRIOR: 0.20,
        CONF_BAYESIAN_THRESHOLD: 0.75,
        CONF_INACTIVITY_TIMEOUT: 240,
        CONF_TRIGGER_ENTITIES: ["binary_sensor.living_room_couch_person_occupancy"],
        CONF_BAYESIAN_OBSERVATIONS: [
            {
                "entity_id": "binary_sensor.living_room_couch_person_occupancy",
                "label": "Couch Person Zone",
                "preset": "decisive",
                "prob_given_true": 0.95,
                "prob_given_false": 0.02,
                "operator": "equals",
                "state": "on",
            },
            {
                "entity_id": "sensor.tab_s10_lite_ble_area",
                "label": "Tab S10 Lite BLE",
                "preset": "moderate",
                "prob_given_true": 0.72,
                "prob_given_false": 0.12,
                "operator": "equals",
                "state": "Living Room",
            },
            {
                "entity_id": "binary_sensor.living_room_ecobee_occupancy",
                "label": "Ecobee 30m Tail",
                "preset": "supporting",
                "prob_given_true": 0.55,
                "prob_given_false": 0.20,
                "operator": "equals",
                "state": "on",
            },
        ],
    }

    # Candidate config tunes Tab S10 Lite BLE down to 'supporting' (0.35 / 0.22)
    candidate_cfg = {
        **baseline_cfg,
        CONF_BAYESIAN_OBSERVATIONS: [
            baseline_cfg[CONF_BAYESIAN_OBSERVATIONS][0],
            {
                "entity_id": "sensor.tab_s10_lite_ble_area",
                "label": "Tab S10 Lite BLE",
                "preset": "supporting",
                "prob_given_true": 0.35,
                "prob_given_false": 0.22,
                "operator": "equals",
                "state": "Living Room",
            },
            baseline_cfg[CONF_BAYESIAN_OBSERVATIONS][2],
        ],
    }

    tracked = collect_room_tracked_entities(baseline_cfg)
    assert len(tracked) == 3

    # Construct a 1-hour timeline:
    # - t=0..1200s (20m): True human sitting on couch (Couch Zone ON)
    # - t=1200..2400s (20m): Human leaves, but Tablet BLE + Ecobee 30m Tail remain active (false positive in baseline!)
    # - t=2400..3600s (20m): All sensors clear
    entity_timelines = {
        "binary_sensor.living_room_couch_person_occupancy": [
            {"ts": start_ts, "state": "on"},
            {"ts": start_ts + 1200.0, "state": "off"},
        ],
        "sensor.tab_s10_lite_ble_area": [
            {"ts": start_ts, "state": "Living Room"},
            {"ts": start_ts + 2400.0, "state": "Family Room"},
        ],
        "binary_sensor.living_room_ecobee_occupancy": [
            {"ts": start_ts, "state": "on"},
            {"ts": start_ts + 2400.0, "state": "off"},
        ],
    }

    comparison = simulate_replay_comparison(
        baseline_config=baseline_cfg,
        candidate_config=candidate_cfg,
        entity_timelines=entity_timelines,
        start_ts=start_ts,
        end_ts=end_ts,
    )

    # Baseline remained occupied during t=1200..2400s (+240s inactivity timeout = 2640s = 44 min)
    # Candidate vacated 240s after Couch Zone turned off at t=1200s (1440s = 24 min)
    assert comparison["baseline"]["summary"]["occupied_minutes"] == 44.0
    assert comparison["candidate"]["summary"]["occupied_minutes"] == 24.0
    assert comparison["deltas"]["false_positive_eliminated_minutes"] == 20.0
    assert comparison["deltas"]["occupied_minutes_delta"] == -20.0
    assert len(comparison["divergence_windows"]) >= 1
    assert comparison["divergence_windows"][0]["type"] == "false_positive_eliminated"


@pytest.mark.anyio
async def test_statistics_and_replay_views_and_timeline_buffer(mock_hass):
    """Test PDDStatisticsView, PDDReplayView, and PDDStore rolling timeline recording."""
    store = await async_get_store(mock_hass)

    st_bed = MagicMock()
    st_bed.entity_id = "binary_sensor.master_bed_person"
    st_bed.state = "on"
    st_bed.attributes = {"friendly_name": "Master Bed Zone"}

    st_door = MagicMock()
    st_door.entity_id = "binary_sensor.bedroom_door"
    st_door.state = "off"
    st_door.attributes = {"friendly_name": "Bedroom Door"}

    mock_hass.states.get = MagicMock(
        side_effect=lambda eid: {
            "binary_sensor.master_bed_person": st_bed,
            "binary_sensor.bedroom_door": st_door,
        }.get(eid)
    )

    cfg = {
        CONF_ROOM_NAME: "Master Bedroom",
        CONF_MODE: str(Mode.BOUNDED),
        CONF_BOUNDARY_ENTITIES: ["binary_sensor.bedroom_door"],
        CONF_TRIGGER_ENTITIES: ["binary_sensor.master_bed_person"],
        CONF_BAYESIAN_PRIOR: 0.22,
        CONF_BAYESIAN_THRESHOLD: 0.75,
        CONF_INACTIVITY_TIMEOUT: 240,
        CONF_GRACE_TIMEOUT: 90,
    }
    coord = RoomPresenceCoordinator(mock_hass, "entry_mb", cfg)
    mock_hass.data.setdefault(DOMAIN, {})["entry_mb"] = coord
    await coord.async_setup()

    # Verify coordinator automatically recorded a timeline snapshot in PDDStore
    events = store.get_timeline_events("entry_mb")
    assert len(events) >= 1
    assert events[-1]["is_present"] is True

    # 1. Test PDDStatisticsView
    stats_view = PDDStatisticsView()
    req_stats = MagicMock()
    req_stats.app = {"hass": mock_hass}
    req_stats.query = {"hours": "6"}
    status, stats_body = _unpack(await stats_view.get(req_stats, "entry_mb"))
    assert status == 200
    assert stats_body["room_name"] == "Master Bedroom"
    assert "summary" in stats_body
    assert len(stats_body["swimlanes"]) >= 2

    # 2. Test PDDReplayView
    replay_view = PDDReplayView()
    req_replay = MagicMock()
    req_replay.app = {"hass": mock_hass}
    req_replay.json = AsyncMock(
        return_value={
            "hours": 6,
            "candidate_config": {
                **cfg,
                CONF_BAYESIAN_THRESHOLD: 0.85,
            },
        }
    )
    status, rep_body = _unpack(await replay_view.post(req_replay, "entry_mb"))
    assert status == 200
    assert rep_body["candidate"]["threshold_pct"] == 85.0
    assert "deltas" in rep_body
    assert "divergence_windows" in rep_body
