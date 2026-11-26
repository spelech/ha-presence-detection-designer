"""Candidate A Baseline Wrapper: runs unmodified production v6.1 VirtualHAHarness."""

from __future__ import annotations

import asyncio
import tempfile
import time
from pathlib import Path
from typing import Any

from tests.harness.virtual_ha import VirtualHAHarness

from .dataset import ScenarioBundle, get_tracked_rooms
from .metrics import RunEvaluation, SuiteEvaluation, evaluate_run_metrics, evaluate_suite


async def _run_single_bundle(
    bundle: ScenarioBundle,
    *,
    floorplan: dict[str, Any],
    room_configs: list[dict[str, Any]],
    tracked_rooms: list[str],
    storage_dir: Path,
) -> RunEvaluation:
    tl = bundle.timeline
    actual_timeline: list[set[str]] = []
    prob_timeline: list[dict[str, float]] = []

    with VirtualHAHarness(
        storage_dir=storage_dir,
        start_ts=1795650000.0,
        global_settings=dict(bundle.scenario.global_settings),
    ) as harness:
        await harness.async_add_rooms(room_configs, floorplan=floorplan)
        cur_tick = [0]
        if tl.ble_ranges_by_t and getattr(harness, "store", None) is not None:
            harness.store._ble_ranges_provider = lambda _eid, _fp, _ts: (
                tl.ble_ranges_by_t[cur_tick[0]] if cur_tick[0] < len(tl.ble_ranges_by_t) else []
            )
        for eid, val in tl.initial_states.items():
            harness.set_state(eid, val)

        for t in range(tl.duration_sec):
            cur_tick[0] = t
            if t > 0:
                harness.advance(1.0)
            for eid, val in (bundle.events_by_t.get(t) or {}).items():
                harness.set_state(eid, val)
            occupied_now = {
                rname
                for rname, coord in harness.coordinators.items()
                if coord.state_machine.is_present
            }
            probs_now = {
                rname: max(
                    0.0,
                    min(
                        1.0,
                        float(harness.prob_sensors[rname].native_value or 0.0) / 100.0,
                    ),
                )
                for rname in tracked_rooms
            }
            actual_timeline.append(occupied_now)
            prob_timeline.append(probs_now)

    return evaluate_run_metrics(
        run_key=bundle.run_key,
        scenario_name=bundle.scenario.name,
        split_label=bundle.split_label,
        seed=bundle.seed,
        expected_timeline=tl.expected_occupied,
        actual_timeline=actual_timeline,
        prob_timeline=prob_timeline,
        thresholds=bundle.scenario.thresholds,
        tracked_rooms=tracked_rooms,
    )


async def _evaluate_all_bundles(
    bundles: list[ScenarioBundle],
    *,
    floorplan: dict[str, Any],
    room_configs: list[dict[str, Any]],
) -> list[RunEvaluation]:
    tracked_rooms = get_tracked_rooms()
    runs: list[RunEvaluation] = []
    for bundle in bundles:
        with tempfile.TemporaryDirectory() as tmpdir:
            res = await _run_single_bundle(
                bundle,
                floorplan=floorplan,
                room_configs=room_configs,
                tracked_rooms=tracked_rooms,
                storage_dir=Path(tmpdir),
            )
            runs.append(res)
    return runs


def evaluate_candidate_a(
    bundles: list[ScenarioBundle],
    *,
    floorplan: dict[str, Any],
    room_configs: list[dict[str, Any]],
    split_name: str,
) -> SuiteEvaluation:
    """Evaluate production v6.1 PDD baseline synchronously on pre-generated bundles."""
    t0 = time.perf_counter()
    runs = asyncio.run(
        _evaluate_all_bundles(bundles, floorplan=floorplan, room_configs=room_configs)
    )
    elapsed = time.perf_counter() - t0
    return evaluate_suite(
        candidate_name="A_Baseline_v6_1",
        config_id="A_prod_v6_1",
        split_name=split_name,
        params={},
        runs=runs,
        runtime_sec=elapsed,
    )
