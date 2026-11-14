"""End-to-end deterministic simulation and HA playback test harness."""

from .feedback_envelope import (
    DiagnosticEnvelope,
    HarnessLogTap,
    ScenarioAssertionError,
    build_feedback_envelope,
)
from .ha_playback import (
    PlaybackEvent,
    PlaybackReport,
    load_ha_history_json,
    load_pdd_storage_playback,
    load_recorder_sqlite,
    playback_ha_history,
)
from .scenario_runner import ScenarioResult, load_scenario_file, run_scenario
from .virtual_ha import VirtualClock, VirtualHAHarness

__all__ = [
    "DiagnosticEnvelope",
    "HarnessLogTap",
    "PlaybackEvent",
    "PlaybackReport",
    "ScenarioAssertionError",
    "ScenarioResult",
    "VirtualClock",
    "VirtualHAHarness",
    "build_feedback_envelope",
    "load_ha_history_json",
    "load_pdd_storage_playback",
    "load_recorder_sqlite",
    "load_scenario_file",
    "playback_ha_history",
    "run_scenario",
]
