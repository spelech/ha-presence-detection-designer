"""Toolbelt E2E scenario, disturbance injection, parameter sweep, and HA playback harness tests."""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path

import pytest

from custom_components.presence_detection_designer.const import (
    EVENT_PRESENCE_TRANSITION,
    OccupancyState,
)
from tests.harness.feedback_envelope import ScenarioAssertionError
from tests.harness.ha_playback import (
    load_ha_history_json,
    load_recorder_sqlite,
    playback_ha_history,
)
from tests.harness.scenario_runner import load_scenario_file, run_scenario


@pytest.mark.requirement("STATE-06", category="STATE", req_type="PositiveFeature")
@pytest.mark.asyncio
async def test_e2e_declarative_scenario_handoff_hold_and_llm_clear() -> None:
    """@requirement STATE-06: Run whole-house declarative scenario from entry to handoff, hold, and LLM vacate."""
    scenario_path = Path(__file__).parent / "scenarios" / "evening_handoff_and_tv_hold.json"
    spec = load_scenario_file(scenario_path)
    result = await run_scenario(
        spec,
        reproduction_command="python scripts/replay_scenario.py --scenario tests/scenarios/evening_handoff_and_tv_hold.json",
    )

    assert result.snapshots["Hallway"]["occupancy_state"] == OccupancyState.VACANT
    assert result.snapshots["Living Room"]["occupancy_state"] == OccupancyState.VACANT
    assert any(
        t["room"] == "Hallway" and t["trigger"] == "adjacent_handoff" and t["accepted"]
        for t in result.transitions
    )
    assert any(
        t["room"] == "Living Room" and t["dest"] == OccupancyState.OCCUPIED_HOLDING
        for t in result.transitions
    )
    assert any(ev["event_type"] == EVENT_PRESENCE_TRANSITION for ev in result.bus_events)


@pytest.mark.requirement("GUARD-01", category="GUARD", req_type="FailClosedGuardrail")
@pytest.mark.asyncio
async def test_e2e_feedback_envelope_on_failure() -> None:
    """@requirement GUARD-01: Verify Toolbelt 6-part diagnostic envelope is emitted on expectation delta."""
    failing_spec = {
        "name": "intentional_delta_check",
        "assumptions": ["Kitchen has 30s inactivity timeout"],
        "rooms": [
            {
                "room_name": "Kitchen",
                "mode": "open",
                "inactivity_timeout": 30,
                "trigger_entities": ["binary_sensor.kitchen_pir"],
            }
        ],
        "initial_states": {"binary_sensor.kitchen_pir": "off"},
        "steps": [
            {"at": 10, "set": {"binary_sensor.kitchen_pir": "on"}},
            {"at": 15, "expect": {"Kitchen": {"occupancy_state": "vacant", "is_on": False}}},
        ],
    }

    with pytest.raises(ScenarioAssertionError) as exc_info:
        await run_scenario(
            failing_spec,
            reproduction_command="pytest tests/test_e2e_harness.py -k test_e2e_feedback_envelope_on_failure",
        )

    env = exc_info.value.envelope.to_dict()
    for required_key in (
        "inputs",
        "assumptions",
        "active_settings",
        "action_history",
        "output_delta",
        "captured_logs",
        "reproduction_command",
    ):
        assert required_key in env

    assert env["status"] == "FAILED"
    assert env["output_delta"]["Kitchen"]["occupancy_state"] == {
        "expected": "vacant",
        "actual": OccupancyState.OCCUPIED_CONFIRMED,
    }
    assert any(item["trigger"] == "evidence_detected" for item in env["action_history"])


@pytest.mark.requirement("GUARD-02", category="GUARD", req_type="FailClosedGuardrail")
@pytest.mark.asyncio
async def test_e2e_disturbance_injection_suite() -> None:
    """@requirement GUARD-02: Inject unavailable/unknown flaps, rapid retrigger storms, and actuator off cleanup."""
    spec = {
        "name": "disturbance_flaps_and_actuator_cleanup",
        "rooms": [
            {
                "room_name": "Living Room",
                "mode": "open",
                "inactivity_timeout": 45,
                "max_hold_timeout": 90,
                "trigger_entities": ["binary_sensor.lr_pir"],
                "actuator_entities": ["media_player.lr_tv"],
            }
        ],
        "initial_states": {
            "binary_sensor.lr_pir": "off",
            "media_player.lr_tv": "off",
        },
        "steps": [
            # Sensor flaps to unavailable / unknown while vacant -> must stay vacant
            {"at": 5, "set": {"binary_sensor.lr_pir": "unavailable"}},
            {"at": 6, "set": {"binary_sensor.lr_pir": "unknown"}},
            {"at": 7, "expect": {"Living Room": {"occupancy_state": "vacant", "is_on": False}}},
            # Rapid retrigger storm + actuator manual on then off
            {"at": 10, "set": {"binary_sensor.lr_pir": "on"}},
            {"at": 12, "set": {"binary_sensor.lr_pir": "off"}},
            {"at": 15, "set": {"binary_sensor.lr_pir": "on"}},
            {"at": 18, "set": {"media_player.lr_tv": "playing"}},
            {"at": 20, "set": {"binary_sensor.lr_pir": "off"}},
            {"at": 25, "set": {"media_player.lr_tv": "off"}},
            # Must enter cooling cleanly after actuator turns off, never stay latched
            {
                "at": 26,
                "expect": {
                    "Living Room": {"occupancy_state": "occupied_cooling", "is_cooling_down": True}
                },
            },
            # Mid-cooling sensor unavailable disturbance must NOT lock room occupied
            {"at": 30, "set": {"binary_sensor.lr_pir": "unavailable"}},
            {"advance": 50},
            {"expect": {"Living Room": {"occupancy_state": "vacant", "is_on": False}}},
        ],
    }
    result = await run_scenario(spec)
    assert result.snapshots["Living Room"]["occupancy_state"] == OccupancyState.VACANT
    assert len(result.transitions) <= 50


@pytest.mark.requirement("GUARD-01", category="GUARD", req_type="FailClosedGuardrail")
@pytest.mark.parametrize(
    ("inactivity_timeout", "max_hold_timeout", "threshold"),
    [
        (30, 60, 0.65),
        (60, 120, 0.75),
        (120, 300, 0.85),
    ],
)
@pytest.mark.asyncio
async def test_e2e_parameter_sweep_bounded_liveness(
    inactivity_timeout: int, max_hold_timeout: int, threshold: float
) -> None:
    """@requirement GUARD-01: Bounded liveness holds across timeout and threshold parameter sweeps."""
    spec = {
        "name": f"sweep_{inactivity_timeout}_{max_hold_timeout}_{threshold}",
        "rooms": [
            {
                "room_name": "Study",
                "mode": "open",
                "inactivity_timeout": inactivity_timeout,
                "max_hold_timeout": max_hold_timeout,
                "bayesian_threshold": threshold,
                "trigger_entities": ["binary_sensor.study_pir"],
                "sustaining_conditions": [{"entity_id": "switch.study_desk", "state": "on"}],
            }
        ],
        "initial_states": {"binary_sensor.study_pir": "off", "switch.study_desk": "off"},
        "steps": [
            {"at": 10, "set": {"binary_sensor.study_pir": "on", "switch.study_desk": "on"}},
            {"at": 20, "set": {"binary_sensor.study_pir": "off"}},
            {"at": 21, "expect": {"Study": {"occupancy_state": "occupied_holding"}}},
            # Even with switch stuck ON forever, room MUST vacate after max_hold_timeout + inactivity_timeout
            {"advance": float(max_hold_timeout + inactivity_timeout + 5)},
            {"expect": {"Study": {"occupancy_state": "vacant", "is_on": False}}},
        ],
    }
    result = await run_scenario(spec)
    assert result.snapshots["Study"]["occupancy_state"] == OccupancyState.VACANT


@pytest.mark.requirement("REPLAY-01", category="REPLAY", req_type="PositiveFeature")
@pytest.mark.asyncio
async def test_e2e_ha_recorder_sqlite_and_json_playback(tmp_path: Path) -> None:
    """@requirement REPLAY-01: Replay real HA Recorder SQLite DB and HA History JSON through multi-room harness."""
    db_path = tmp_path / "home-assistant_v2.db"
    con = sqlite3.connect(db_path)
    try:
        con.executescript(
            """
            CREATE TABLE states_meta (metadata_id INTEGER PRIMARY KEY, entity_id TEXT UNIQUE);
            CREATE TABLE state_attributes (attributes_id INTEGER PRIMARY KEY, shared_attrs TEXT);
            CREATE TABLE states (
                state_id INTEGER PRIMARY KEY,
                metadata_id INTEGER,
                state TEXT,
                last_updated_ts REAL,
                attributes_id INTEGER
            );
            INSERT INTO states_meta VALUES (1, 'binary_sensor.kitchen_pir');
            INSERT INTO states_meta VALUES (2, 'binary_sensor.dining_pir');
            INSERT INTO state_attributes VALUES (1, '{}');
            INSERT INTO states VALUES (1, 1, 'on', 1794657610.0, 1);
            INSERT INTO states VALUES (2, 1, 'off', 1794657620.0, 1);
            INSERT INTO states VALUES (3, 2, 'on', 1794657625.0, 1);
            INSERT INTO states VALUES (4, 2, 'off', 1794657635.0, 1);
            """
        )
        con.commit()
    finally:
        con.close()

    rooms = [
        {
            "room_name": "Kitchen",
            "mode": "open",
            "inactivity_timeout": 30,
            "trigger_entities": ["binary_sensor.kitchen_pir"],
            "connected_rooms": ["Dining Room"],
        },
        {
            "room_name": "Dining Room",
            "mode": "open",
            "inactivity_timeout": 30,
            "trigger_entities": ["binary_sensor.dining_pir"],
            "connected_rooms": ["Kitchen"],
        },
    ]

    sqlite_events = load_recorder_sqlite(db_path)
    assert len(sqlite_events) == 4
    report = await playback_ha_history(
        room_configs=rooms,
        events=sqlite_events,
        source_label="sqlite_test",
        tail_advance_sec=40.0,
    )
    assert report.event_count == 4
    assert report.rooms["Kitchen"]["occupancy_state"] == OccupancyState.VACANT
    assert report.rooms["Dining Room"]["occupancy_state"] == OccupancyState.VACANT
    assert any(
        t["room"] == "Kitchen" and t["trigger"] == "adjacent_handoff" and t["accepted"]
        for t in report.transitions
    )

    # Verify HA /api/history/period JSON format parity
    hist_json = tmp_path / "ha_history.json"
    hist_json.write_text(
        json.dumps(
            [
                [
                    {
                        "entity_id": "binary_sensor.kitchen_pir",
                        "state": "on",
                        "last_changed": "2026-11-14T12:00:10+00:00",
                    },
                    {
                        "entity_id": "binary_sensor.kitchen_pir",
                        "state": "off",
                        "last_changed": "2026-11-14T12:00:20+00:00",
                    },
                ],
                [
                    {
                        "entity_id": "binary_sensor.dining_pir",
                        "state": "on",
                        "last_changed": "2026-11-14T12:00:25+00:00",
                    },
                    {
                        "entity_id": "binary_sensor.dining_pir",
                        "state": "off",
                        "last_changed": "2026-11-14T12:00:35+00:00",
                    },
                ],
            ]
        ),
        encoding="utf-8",
    )
    json_events = load_ha_history_json(hist_json)
    report_json = await playback_ha_history(
        room_configs=rooms,
        events=json_events,
        source_label="json_test",
        tail_advance_sec=40.0,
    )
    assert report_json.rooms["Kitchen"]["occupancy_state"] == OccupancyState.VACANT
    assert report_json.rooms["Dining Room"]["occupancy_state"] == OccupancyState.VACANT
