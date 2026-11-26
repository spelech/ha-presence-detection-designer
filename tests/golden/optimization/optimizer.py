"""Multi-seed stratified LHS + local coordinate Pareto optimization sprawl runner."""

from __future__ import annotations

import json
import math
import os
import random
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path
from typing import Any

from tests.golden.floorplan_snapshot import HOUSE_ROOM_CONFIGS, load_golden_floorplan

from .candidate_a_baseline import evaluate_candidate_a
from .candidate_b_hmm import CANDIDATE_B_BOUNDS, CANDIDATE_B_DEFAULTS, CandidateBRunner
from .candidate_c_grid import CANDIDATE_C_BOUNDS, CANDIDATE_C_DEFAULTS, CandidateCRunner
from .candidate_d_phd import CANDIDATE_D_BOUNDS, CANDIDATE_D_DEFAULTS, CandidateDRunner
from .charts import generate_comparison_bars_svg, generate_pareto_frontier_svg
from .dataset import (
    CEILING_KITCHEN_SPECS,
    TRAIN_SPECS,
    VAL_SPECS,
    ScenarioBundle,
    build_ceiling_kitchen_floorplan,
    build_dataset,
    get_tracked_rooms,
)
from .metrics import (
    SuiteEvaluation,
    evaluate_run_metrics,
    evaluate_suite,
    extract_pareto_frontier,
)
from .sensor_model import HouseTopologyIndex

_RUNNER_REGISTRY: dict[
    str, tuple[type[Any], dict[str, tuple[float, float, str]], dict[str, float]]
] = {
    "B_Coupled_HMM": (CandidateBRunner, CANDIDATE_B_BOUNDS, CANDIDATE_B_DEFAULTS),
    "C_2D_Occupancy_Grid": (CandidateCRunner, CANDIDATE_C_BOUNDS, CANDIDATE_C_DEFAULTS),
    "D_RFS_PHD_HSMM": (CandidateDRunner, CANDIDATE_D_BOUNDS, CANDIDATE_D_DEFAULTS),
}

# Worker process global state (initialized once per worker process)
_W_TOPO: HouseTopologyIndex | None = None
_W_BUNDLES: list[ScenarioBundle] | None = None
_W_ROOMS: list[str] | None = None


def _init_worker(
    floorplan: dict[str, Any], bundles: list[ScenarioBundle], rooms: list[str]
) -> None:
    global _W_TOPO, _W_BUNDLES, _W_ROOMS
    _W_TOPO = HouseTopologyIndex(floorplan)
    _W_BUNDLES = bundles
    _W_ROOMS = rooms


def _evaluate_worker(task: tuple[str, str, str, dict[str, float]]) -> dict[str, Any]:
    cname, cid, split_name, params = task
    assert _W_TOPO is not None and _W_BUNDLES is not None and _W_ROOMS is not None
    cls, _, _ = _RUNNER_REGISTRY[cname]
    runner = cls(_W_TOPO, params)
    t0 = time.perf_counter()
    runs = []
    for b in _W_BUNDLES:
        occ, probs = runner.run_timeline(b)
        runs.append(
            evaluate_run_metrics(
                run_key=b.run_key,
                scenario_name=b.scenario.name,
                split_label=b.split_label,
                seed=b.seed,
                expected_timeline=b.timeline.expected_occupied,
                actual_timeline=occ,
                prob_timeline=probs,
                thresholds=b.scenario.thresholds,
                tracked_rooms=_W_ROOMS,
            )
        )
    dt = time.perf_counter() - t0
    suite = evaluate_suite(
        candidate_name=cname,
        config_id=cid,
        split_name=split_name,
        params=params,
        runs=runs,
        runtime_sec=dt,
    )
    return suite.to_summary_dict()


def evaluate_candidate_local(
    *,
    cname: str,
    cid: str,
    split_name: str,
    params: dict[str, float],
    topo: HouseTopologyIndex,
    bundles: list[ScenarioBundle],
    rooms: list[str],
) -> SuiteEvaluation:
    """Evaluate a single candidate configuration in-process."""
    cls, _, _ = _RUNNER_REGISTRY[cname]
    runner = cls(topo, params)
    t0 = time.perf_counter()
    runs = []
    for b in bundles:
        occ, probs = runner.run_timeline(b)
        runs.append(
            evaluate_run_metrics(
                run_key=b.run_key,
                scenario_name=b.scenario.name,
                split_label=b.split_label,
                seed=b.seed,
                expected_timeline=b.timeline.expected_occupied,
                actual_timeline=occ,
                prob_timeline=probs,
                thresholds=b.scenario.thresholds,
                tracked_rooms=rooms,
            )
        )
    dt = time.perf_counter() - t0
    return evaluate_suite(
        candidate_name=cname,
        config_id=cid,
        split_name=split_name,
        params=params,
        runs=runs,
        runtime_sec=dt,
    )


def sample_lhs(
    bounds: dict[str, tuple[float, float, str]],
    n_samples: int,
    rng: random.Random,
) -> list[dict[str, float]]:
    """Generate stratified Latin Hypercube samples supporting linear & log scales."""
    keys = sorted(bounds.keys())
    perms: dict[str, list[int]] = {}
    for k in keys:
        p = list(range(n_samples))
        rng.shuffle(p)
        perms[k] = p

    samples: list[dict[str, float]] = []
    for i in range(n_samples):
        cfg: dict[str, float] = {}
        for k in keys:
            lo, hi, scale = bounds[k]
            u = (perms[k][i] + rng.random()) / float(n_samples)
            if scale == "log":
                val = math.exp(math.log(lo) + u * (math.log(hi) - math.log(lo)))
            else:
                val = lo + u * (hi - lo)
            cfg[k] = round(val, 5)
        samples.append(cfg)
    return samples


def _clamp_param(val: float, lo: float, hi: float) -> float:
    return round(max(lo, min(hi, val)), 5)


def _generate_refinement_configs(
    seed_cfgs: list[dict[str, float]],
    bounds: dict[str, tuple[float, float, str]],
    rng: random.Random,
    n_refine: int,
) -> list[dict[str, float]]:
    """Generate local coordinate perturbations & directional tweaks around top Pareto anchors."""
    keys = sorted(bounds.keys())
    out: list[dict[str, float]] = []
    seen: set[tuple[tuple[str, float], ...]] = {tuple(sorted(c.items())) for c in seed_cfgs}

    # Systematic coordinate +/- steps on primary best anchor first
    primary = seed_cfgs[0]
    for k in keys:
        lo, hi, scale = bounds[k]
        for direction in (-1.0, 1.0):
            cand = dict(primary)
            if scale == "log":
                span = math.log(hi) - math.log(lo)
                cur_log = math.log(max(lo, cand[k]))
                cand[k] = _clamp_param(math.exp(cur_log + direction * 0.22 * span), lo, hi)
            else:
                span = hi - lo
                cand[k] = _clamp_param(cand[k] + direction * 0.18 * span, lo, hi)
            sig = tuple(sorted(cand.items()))
            if sig not in seen and len(out) < n_refine:
                seen.add(sig)
                out.append(cand)

    # Multi-coordinate local perturbations across all anchors until reaching n_refine
    idx = 0
    while len(out) < n_refine and idx < n_refine * 5:
        anchor = seed_cfgs[idx % len(seed_cfgs)]
        cand = dict(anchor)
        k_sub = rng.sample(keys, k=min(len(keys), rng.randint(2, 5)))
        step_frac = 0.15 if idx % 2 == 0 else 0.08
        for k in k_sub:
            lo, hi, scale = bounds[k]
            delta = rng.uniform(-step_frac, step_frac)
            if scale == "log":
                span = math.log(hi) - math.log(lo)
                cand[k] = _clamp_param(math.exp(math.log(max(lo, cand[k])) + delta * span), lo, hi)
            else:
                cand[k] = _clamp_param(cand[k] + delta * (hi - lo), lo, hi)
        sig = tuple(sorted(cand.items()))
        if sig not in seen:
            seen.add(sig)
            out.append(cand)
        idx += 1
    return out


def _select_winners(points: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    """Select balanced, lowest_fp, and lowest_brier configs among safe Pareto points."""
    safe = [p for p in points if int(p.get("total_safety_violations", 0)) == 0]
    pool = safe if safe else points
    balanced = min(pool, key=lambda p: float(p["scalar_loss"]))
    pareto = extract_pareto_frontier(pool) or [balanced]
    lowest_fp = min(
        pareto,
        key=lambda p: (
            int(p["total_fp_sec"]),
            float(p["scalar_loss"]),
        ),
    )
    lowest_brier = min(
        pareto,
        key=lambda p: (
            float(p["mean_brier"]),
            float(p["scalar_loss"]),
        ),
    )
    out = {"balanced": balanced}
    if lowest_fp["config_id"] != balanced["config_id"]:
        out["lowest_fp"] = lowest_fp
    if lowest_brier["config_id"] not in (
        balanced["config_id"],
        lowest_fp["config_id"],
    ):
        out["lowest_brier"] = lowest_brier
    return out


def _run_pool_batch(
    tasks: list[tuple[str, str, str, dict[str, float]]],
    floorplan: dict[str, Any],
    bundles: list[ScenarioBundle],
    rooms: list[str],
    max_workers: int,
) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    if max_workers <= 1 or len(tasks) <= 2:
        topo = HouseTopologyIndex(floorplan)
        for cname, cid, split_name, params in tasks:
            res = evaluate_candidate_local(
                cname=cname,
                cid=cid,
                split_name=split_name,
                params=params,
                topo=topo,
                bundles=bundles,
                rooms=rooms,
            )
            results.append(res.to_summary_dict())
        return results

    with ProcessPoolExecutor(
        max_workers=max_workers,
        initializer=_init_worker,
        initargs=(floorplan, bundles, rooms),
    ) as pool:
        futs = [pool.submit(_evaluate_worker, t) for t in tasks]
        for fut in as_completed(futs):
            results.append(fut.result())
    results.sort(key=lambda r: r["config_id"])
    return results


def run_optimization_sprawl(
    *,
    lhs_samples: int = 44,
    refine_samples: int = 36,
    seed: int = 2026,
    max_workers: int | None = None,
    results_path: Path | None = None,
) -> dict[str, Any]:
    """Execute full 4-candidate optimization sprawl & held-out validation."""
    t_start = time.perf_counter()
    rng = random.Random(seed)
    workers = max_workers or max(1, min(10, (os.cpu_count() or 4) - 1))

    fp = load_golden_floorplan()
    ceiling_fp = build_ceiling_kitchen_floorplan(fp)
    rooms = get_tracked_rooms()
    topo = HouseTopologyIndex(fp)
    ceiling_topo = HouseTopologyIndex(ceiling_fp)

    train_bundles = build_dataset(fp, TRAIN_SPECS)
    val_bundles = build_dataset(fp, VAL_SPECS)
    ceiling_bundles = build_dataset(ceiling_fp, CEILING_KITCHEN_SPECS)

    print(
        f"[opt] Dataset ready: train={len(train_bundles)}, val={len(val_bundles)}, "
        f"ceiling={len(ceiling_bundles)} | workers={workers}"
    )

    # 1. Baseline A on Train, Held-Out Val, and Ceiling Sensitivity
    print("[opt] Evaluating Candidate A (Production v6.1 Baseline)...")
    a_train = evaluate_candidate_a(
        train_bundles, floorplan=fp, room_configs=HOUSE_ROOM_CONFIGS, split_name="train"
    ).to_summary_dict()
    a_val = evaluate_candidate_a(
        val_bundles, floorplan=fp, room_configs=HOUSE_ROOM_CONFIGS, split_name="val_heldout"
    ).to_summary_dict()
    a_ceil = evaluate_candidate_a(
        ceiling_bundles,
        floorplan=ceiling_fp,
        room_configs=HOUSE_ROOM_CONFIGS,
        split_name="ceiling_kitchen",
    ).to_summary_dict()
    print(
        f"  A_Baseline_v6_1 train: pass={a_train['scenarios_passed']}/{a_train['scenarios_total']} "
        f"fp={a_train['total_fp_sec']}s act_fn={a_train['total_actionable_fn_sec']}s "
        f"flaps={a_train['total_flaps']} brier={a_train['mean_brier']:.4f} loss={a_train['scalar_loss']:.1f}"
    )
    print(
        f"  A_Baseline_v6_1 val  : pass={a_val['scenarios_passed']}/{a_val['scenarios_total']} "
        f"fp={a_val['total_fp_sec']}s act_fn={a_val['total_actionable_fn_sec']}s "
        f"flaps={a_val['total_flaps']} brier={a_val['mean_brier']:.4f} loss={a_val['scalar_loss']:.1f}"
    )

    train_sprawl: dict[str, list[dict[str, Any]]] = {}
    train_pareto: dict[str, list[dict[str, Any]]] = {}
    train_winners: dict[str, dict[str, Any]] = {}
    heldout_validation: dict[str, Any] = {"A_Baseline_v6_1": a_val}
    ceiling_sensitivity: dict[str, Any] = {"A_Baseline_v6_1": a_ceil}

    for cname in ("B_Coupled_HMM", "C_2D_Occupancy_Grid", "D_RFS_PHD_HSMM"):
        _, bounds, defaults = _RUNNER_REGISTRY[cname]
        print(f"\n[opt] Stage 1 LHS ({lhs_samples} configs + default) for {cname}...")
        lhs_cfgs = [dict(defaults)] + sample_lhs(bounds, lhs_samples, rng)
        stage1_tasks = [
            (cname, f"{cname}_lhs_{i:02d}", "train", cfg) for i, cfg in enumerate(lhs_cfgs)
        ]
        stage1_res = _run_pool_batch(stage1_tasks, fp, train_bundles, rooms, workers)

        # Select top-3 diverse anchors for Stage 2 coordinate refinement
        s1_winners = _select_winners(stage1_res)
        anchors = [v["params"] for v in s1_winners.values()]
        s1_best = s1_winners["balanced"]
        print(
            f"  Stage 1 best ({s1_best['config_id']}): pass={s1_best['scenarios_passed']}/{s1_best['scenarios_total']} "
            f"fp={s1_best['total_fp_sec']}s act_fn={s1_best['total_actionable_fn_sec']}s "
            f"flaps={s1_best['total_flaps']} brier={s1_best['mean_brier']:.4f} saf={s1_best['total_safety_violations']} "
            f"loss={s1_best['scalar_loss']:.1f}"
        )

        refine_cfgs = _generate_refinement_configs(anchors, bounds, rng, refine_samples)
        print(f"[opt] Stage 2 Local Refinement ({len(refine_cfgs)} configs) for {cname}...")
        stage2_tasks = [
            (cname, f"{cname}_ref_{i:02d}", "train", cfg) for i, cfg in enumerate(refine_cfgs)
        ]
        stage2_res = _run_pool_batch(stage2_tasks, fp, train_bundles, rooms, workers)

        all_pts = stage1_res + stage2_res
        train_sprawl[cname] = all_pts
        train_pareto[cname] = extract_pareto_frontier(all_pts)
        winners = _select_winners(all_pts)
        train_winners[cname] = winners

        bal_tr = winners["balanced"]
        print(
            f"  Train Balanced Winner ({bal_tr['config_id']}): pass={bal_tr['scenarios_passed']}/{bal_tr['scenarios_total']} "
            f"fp={bal_tr['total_fp_sec']}s act_fn={bal_tr['total_actionable_fn_sec']}s "
            f"flaps={bal_tr['total_flaps']} brier={bal_tr['mean_brier']:.4f} saf={bal_tr['total_safety_violations']} "
            f"loss={bal_tr['scalar_loss']:.1f}"
        )

        # Stage 3: Unseen Held-Out Validation & Ceiling Kitchen Sensitivity
        ho_map: dict[str, Any] = {}
        for role, wdata in winners.items():
            ho_res = evaluate_candidate_local(
                cname=cname,
                cid=f"{wdata['config_id']}__heldout",
                split_name="val_heldout",
                params=wdata["params"],
                topo=topo,
                bundles=val_bundles,
                rooms=rooms,
            ).to_summary_dict()
            ho_map[role] = ho_res
        heldout_validation[cname] = ho_map

        ceil_res = evaluate_candidate_local(
            cname=cname,
            cid=f"{bal_tr['config_id']}__ceiling_kitchen",
            split_name="ceiling_kitchen",
            params=bal_tr["params"],
            topo=ceiling_topo,
            bundles=ceiling_bundles,
            rooms=rooms,
        ).to_summary_dict()
        ceiling_sensitivity[cname] = ceil_res

        hb = ho_map["balanced"]
        print(
            f"  Held-Out Val ({cname}): pass={hb['scenarios_passed']}/{hb['scenarios_total']} "
            f"fp={hb['total_fp_sec']}s act_fn={hb['total_actionable_fn_sec']}s "
            f"flaps={hb['total_flaps']} brier={hb['mean_brier']:.4f} ece={hb['mean_ece']:.4f} "
            f"lat={hb['mean_entry_latency_sec']:.2f}s saf={hb['total_safety_violations']} loss={hb['scalar_loss']:.1f}"
        )

    total_time = round(time.perf_counter() - t_start, 2)
    results_payload: dict[str, Any] = {
        "metadata": {
            "seed": seed,
            "train_specs": TRAIN_SPECS,
            "val_specs": VAL_SPECS,
            "ceiling_specs": CEILING_KITCHEN_SPECS,
            "total_configs_evaluated": sum(len(v) for v in train_sprawl.values()) + 1,
            "total_scenario_runs": (
                sum(len(v) for v in train_sprawl.values()) * len(train_bundles)
                + len(train_bundles)
                + len(val_bundles) * 4
            ),
            "elapsed_sec": total_time,
        },
        "train_baseline_a": a_train,
        "train_sprawl": train_sprawl,
        "train_pareto": train_pareto,
        "train_winners": train_winners,
        "heldout_validation": heldout_validation,
        "ceiling_kitchen_sensitivity": ceiling_sensitivity,
    }

    out_json = results_path or (
        Path(__file__).resolve().parent / "results" / "optimization_results.json"
    )
    out_json.parent.mkdir(parents=True, exist_ok=True)
    out_json.write_text(json.dumps(results_payload, indent=2), encoding="utf-8")

    docs_img_dir = Path(__file__).resolve().parents[3] / "docs" / "images"
    generate_pareto_frontier_svg(results_payload, docs_img_dir / "optimization_pareto_frontier.svg")
    generate_comparison_bars_svg(results_payload, docs_img_dir / "candidate_comparison_bars.svg")

    print(f"\n[opt] Completed full optimization sprawl in {total_time:.1f}s -> {out_json}")
    return results_payload


if __name__ == "__main__":
    run_optimization_sprawl()
