"""Pytest runner for the layered + fuzzed golden dataset suite.

Run clean baseline:
    pytest tests/golden/test_golden_suite.py -m golden -v
"""

from __future__ import annotations

import pytest

from tests.harness.virtual_ha import VirtualHAHarness

from .floorplan_snapshot import HOUSE_ROOM_CONFIGS, load_golden_floorplan
from .scenarios import GOLDEN_SCENARIOS, GoldenScenario
from .scorecard import GoldenScorecard, evaluate_golden_run
from .signal_layers import LayeredSignalGenerator


async def execute_golden_scenario(
    scenario: GoldenScenario,
    *,
    storage_dir,
    noisy: bool = False,
    seed: int = 42,
) -> GoldenScorecard:
    """Run a single GoldenScenario through VirtualHAHarness and return its GoldenScorecard."""
    fp = load_golden_floorplan()
    gen = LayeredSignalGenerator(fp)
    timeline = gen.generate(
        tracks=list(scenario.tracks),
        duration_sec=scenario.duration_sec,
        fuzz=scenario.fuzz_noisy if noisy else scenario.fuzz_clean,
        seed=seed,
    )

    tracked_rooms = [r["room_name"] for r in HOUSE_ROOM_CONFIGS]
    events_by_t = dict(timeline.events)
    actual_timeline: list[set[str]] = []

    with VirtualHAHarness(
        storage_dir=storage_dir,
        start_ts=1795650000.0,
        global_settings=dict(scenario.global_settings),
    ) as harness:
        await harness.async_add_rooms(HOUSE_ROOM_CONFIGS, floorplan=fp)
        cur_tick = [0]
        if timeline.ble_ranges_by_t and getattr(harness, "store", None) is not None:
            harness.store._ble_ranges_provider = lambda _eid, _fp, _ts: (
                timeline.ble_ranges_by_t[cur_tick[0]]
                if cur_tick[0] < len(timeline.ble_ranges_by_t)
                else []
            )
        for eid, val in timeline.initial_states.items():
            harness.set_state(eid, val)

        for t in range(timeline.duration_sec):
            cur_tick[0] = t
            if t > 0:
                harness.advance(1.0)
            for eid, val in (events_by_t.get(t) or {}).items():
                harness.set_state(eid, val)
            occupied_now = {
                rname
                for rname, coord in harness.coordinators.items()
                if coord.state_machine.is_present
            }
            actual_timeline.append(occupied_now)

    return evaluate_golden_run(
        scenario_name=scenario.name,
        seed=seed,
        expected_timeline=timeline.expected_occupied,
        actual_timeline=actual_timeline,
        tracked_rooms=tracked_rooms,
        thresholds=scenario.thresholds,
    )


@pytest.mark.golden
@pytest.mark.asyncio
@pytest.mark.parametrize("scenario", GOLDEN_SCENARIOS, ids=lambda s: s.name)
async def test_golden_scenario_clean(scenario: GoldenScenario, tmp_path) -> None:
    """Verify clean (un-fuzzed) layered trajectory against expected ground truth."""
    card = await execute_golden_scenario(scenario, storage_dir=tmp_path, noisy=False, seed=42)
    assert card.passed, f"{scenario.name} (clean) failed: {card.failures} | {card.summary_dict()}"


@pytest.mark.golden
@pytest.mark.asyncio
@pytest.mark.parametrize("seed", [101, 202, 303])
@pytest.mark.parametrize("scenario", GOLDEN_SCENARIOS, ids=lambda s: s.name)
async def test_golden_scenario_fuzzed(scenario: GoldenScenario, seed: int, tmp_path) -> None:
    """Verify fuzzed (BLE bleed/bounce, frame drops, jitter) trajectory against ground truth."""
    card = await execute_golden_scenario(scenario, storage_dir=tmp_path, noisy=True, seed=seed)
    assert card.passed, (
        f"{scenario.name} (seed={seed}) failed: {card.failures} | {card.summary_dict()}"
    )
