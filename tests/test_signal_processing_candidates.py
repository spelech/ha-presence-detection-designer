"""Unit & safety-invariant tests for the 4-candidate optimization framework & B/C/D engines."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest

from custom_components.presence_detection_designer.spatial_topology import (
    compute_pir_spillover_matrix,
)
from tests.golden.floorplan_snapshot import load_golden_floorplan
from tests.golden.optimization.candidate_b_hmm import CandidateBRunner
from tests.golden.optimization.candidate_c_grid import CandidateCRunner
from tests.golden.optimization.candidate_d_phd import CandidateDRunner
from tests.golden.optimization.candidate_e_hybrid import CandidateERunner
from tests.golden.optimization.dataset import (
    build_ceiling_kitchen_floorplan,
    build_dataset,
    get_tracked_rooms,
)
from tests.golden.optimization.metrics import (
    compute_scalar_loss,
    evaluate_run_metrics,
    extract_pareto_frontier,
)
from tests.golden.optimization.sensor_model import HouseTopologyIndex
from tests.golden.scenarios import GOLDEN_SCENARIOS

_RESULTS_PATH = (
    Path(__file__).resolve().parent
    / "golden"
    / "optimization"
    / "results"
    / "optimization_results.json"
)

_SAFETY_SCENARIOS: tuple[str, ...] = (
    "riley_dog_patrol_main_floor",
    "ble_vertical_floor_bleed_no_false_trigger",
    "sunlit_shade_movement_false_camera_flicker",
    "storage_room_doorway_bleed_from_play_area",
)


def _load_frozen_params(candidate_name: str) -> dict[str, float] | None:
    if not _RESULTS_PATH.exists():
        return None
    data = json.loads(_RESULTS_PATH.read_text(encoding="utf-8"))
    bal = (data.get("train_winners", {}).get(candidate_name) or {}).get("balanced")
    if isinstance(bal, dict) and isinstance(bal.get("params"), dict):
        return {k: float(v) for k, v in bal["params"].items()}
    return None


@pytest.fixture(scope="module")
def safety_bundles() -> tuple[HouseTopologyIndex, list[Any], list[str]]:
    fp = load_golden_floorplan()
    topo = HouseTopologyIndex(fp)
    scens = [s for s in GOLDEN_SCENARIOS if s.name in _SAFETY_SCENARIOS]
    bundles = build_dataset(
        fp,
        (("clean", False, 42), ("fuzz_303", True, 303)),
        scenarios=scens,
    )
    return topo, bundles, get_tracked_rooms()


@pytest.mark.parametrize(
    "runner_cls",
    [CandidateBRunner, CandidateCRunner, CandidateDRunner, CandidateERunner],
    ids=lambda cls: cls.name,
)
def test_candidate_bounds_determinism_and_safety_invariants(
    runner_cls: type[Any],
    safety_bundles: tuple[HouseTopologyIndex, list[Any], list[str]],
) -> None:
    """Verify probabilities stay in [0,1], outputs are deterministic, and all 4 safety guards hold."""
    topo, bundles, rooms = safety_bundles
    params = _load_frozen_params(runner_cls.name)
    runner = runner_cls(topo, params)

    for bundle in bundles:
        occ_1, probs_1 = runner.run_timeline(bundle)
        occ_2, probs_2 = runner.run_timeline(bundle)
        assert occ_1 == occ_2, f"{runner_cls.name} non-deterministic occupancy on {bundle.run_key}"
        assert probs_1 == probs_2, f"{runner_cls.name} non-deterministic probs on {bundle.run_key}"
        assert len(occ_1) == bundle.timeline.duration_sec
        assert len(probs_1) == bundle.timeline.duration_sec

        for t, p_map in enumerate(probs_1):
            for r in rooms:
                val = p_map[r]
                assert 0.0 <= val <= 1.0, (
                    f"{runner_cls.name} out-of-range prob {val} at {bundle.run_key} t={t} room={r}"
                )

        ev = evaluate_run_metrics(
            run_key=bundle.run_key,
            scenario_name=bundle.scenario.name,
            split_label=bundle.split_label,
            seed=bundle.seed,
            expected_timeline=bundle.timeline.expected_occupied,
            actual_timeline=occ_1,
            prob_timeline=probs_1,
            thresholds=bundle.scenario.thresholds,
            tracked_rooms=rooms,
        )
        assert ev.safety_violations == 0, (
            f"{runner_cls.name} failed safety guard on {bundle.run_key}: {ev.scorecard.failures}"
        )


def test_ceiling_kitchen_pir_eliminates_front_entry_spillover() -> None:
    """Verify ceiling-mounted Kitchen PIR eliminates spillover into Front Entry."""
    base_fp = load_golden_floorplan()
    base_spill = compute_pir_spillover_matrix(base_fp, min_overlap_pct=5.0)
    assert "Front Entry" in base_spill.get("binary_sensor.kitchen_motion_occupancy", {})

    ceil_fp = build_ceiling_kitchen_floorplan(base_fp)
    ceil_spill = compute_pir_spillover_matrix(ceil_fp, min_overlap_pct=5.0)
    assert "Front Entry" not in ceil_spill.get("binary_sensor.kitchen_motion_occupancy", {})


def test_pareto_frontier_and_scalar_loss_ordering() -> None:
    """Verify Pareto extractor enforces safety=0 first and returns exact non-dominated set."""
    pts = [
        {
            "config_id": "unsafe_low_fp",
            "total_fp_sec": 0,
            "total_actionable_fn_sec": 0,
            "mean_brier": 0.001,
            "total_flaps": 0,
            "total_safety_violations": 1,
        },
        {
            "config_id": "pareto_fp",
            "total_fp_sec": 10,
            "total_actionable_fn_sec": 200,
            "mean_brier": 0.010,
            "total_flaps": 0,
            "total_safety_violations": 0,
        },
        {
            "config_id": "pareto_fn",
            "total_fp_sec": 40,
            "total_actionable_fn_sec": 80,
            "mean_brier": 0.009,
            "total_flaps": 0,
            "total_safety_violations": 0,
        },
        {
            "config_id": "dominated",
            "total_fp_sec": 50,
            "total_actionable_fn_sec": 120,
            "mean_brier": 0.012,
            "total_flaps": 1,
            "total_safety_violations": 0,
        },
    ]
    front = extract_pareto_frontier(pts)
    ids = [p["config_id"] for p in front]
    assert ids == ["pareto_fp", "pareto_fn"]

    loss_good = compute_scalar_loss(
        total_fp_sec=20,
        total_actionable_fn_sec=100,
        total_flaps=0,
        mean_brier=0.008,
        mean_entry_latency_sec=1.5,
        total_safety_violations=0,
        scenarios_failed=0,
    )
    loss_unsafe = compute_scalar_loss(
        total_fp_sec=0,
        total_actionable_fn_sec=0,
        total_flaps=0,
        mean_brier=0.001,
        mean_entry_latency_sec=1.0,
        total_safety_violations=1,
        scenarios_failed=0,
    )
    assert loss_good < loss_unsafe
