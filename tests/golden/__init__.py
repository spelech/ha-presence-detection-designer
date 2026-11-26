"""Layered, fuzzed golden dataset generator, scenarios, and scorecard for PDD."""

from .floorplan_snapshot import HOUSE_ROOM_CONFIGS, ZONE_GROUPS, load_golden_floorplan
from .scenarios import GOLDEN_SCENARIOS, GoldenScenario, build_all_golden_scenarios
from .scorecard import GoldenScorecard, RoomMetrics, ZoneMetrics, evaluate_golden_run
from .signal_layers import (
    ActorWaypoint,
    FuzzProfile,
    GeneratedTimeline,
    HardwareTimingProfile,
    LayeredSignalGenerator,
)

__all__ = [
    "ActorWaypoint",
    "FuzzProfile",
    "GOLDEN_SCENARIOS",
    "GeneratedTimeline",
    "GoldenScenario",
    "GoldenScorecard",
    "HOUSE_ROOM_CONFIGS",
    "HardwareTimingProfile",
    "LayeredSignalGenerator",
    "RoomMetrics",
    "ZONE_GROUPS",
    "ZoneMetrics",
    "build_all_golden_scenarios",
    "evaluate_golden_run",
    "load_golden_floorplan",
]
