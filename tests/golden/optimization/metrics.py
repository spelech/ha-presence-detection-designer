"""Unified scorecard, proper probabilistic calibration, Vision-LLM ambiguity, and Pareto metrics."""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Any

from tests.golden.floorplan_snapshot import HOUSE_ROOM_CONFIGS
from tests.golden.scorecard import GoldenScorecard, evaluate_golden_run

SAFETY_ONLY_CHECK_ROOMS: dict[str, tuple[str, ...]] = {
    "riley_dog_patrol_main_floor": (),  # Empty tuple means ANY room FP > 0 violates safety
    "ble_vertical_floor_bleed_no_false_trigger": (
        "Living Room",
        "Dining Room",
        "Kitchen",
        "Family Room",
        "Basement Play Area",
    ),
    "sunlit_shade_movement_false_camera_flicker": ("Living Room",),
    "storage_room_doorway_bleed_from_play_area": ("Storage Room",),
}

AMBIGUITY_LOW: float = 0.35
AMBIGUITY_HIGH: float = 0.70
AMBIGUITY_MIN_RUN_SEC: int = 5


@dataclass
class RunEvaluation:
    """Combined scorecard + calibration + ambiguity metrics for one scenario timeline."""

    run_key: str
    scenario_name: str
    split_label: str
    seed: int
    scorecard: GoldenScorecard
    actionable_fn_sec: int
    brier_score: float
    log_loss: float
    ece_score: float
    mean_entry_latency_sec: float
    p95_entry_latency_sec: float
    ambiguity_band_rate: float
    safety_violations: int
    room_second_total: int


@dataclass
class SuiteEvaluation:
    """Aggregated evaluation across an entire split or candidate run."""

    candidate_name: str
    config_id: str
    split_name: str
    params: dict[str, float]
    scenarios_total: int
    scenarios_passed: int
    pass_rate: float
    total_fp_sec: int
    total_fn_sec: int
    total_actionable_fn_sec: int
    total_flaps: int
    mean_brier: float
    mean_log_loss: float
    mean_ece: float
    mean_entry_latency_sec: float
    p95_entry_latency_sec: float
    mean_ambiguity_rate: float
    total_safety_violations: int
    scalar_loss: float
    runtime_sec: float = 0.0
    per_scenario: dict[str, dict[str, Any]] = field(default_factory=dict)

    def to_summary_dict(self) -> dict[str, Any]:
        """Serialize compact summary suitable for JSON persistence and Pareto ranking."""
        return {
            "candidate_name": self.candidate_name,
            "config_id": self.config_id,
            "split_name": self.split_name,
            "params": dict(self.params),
            "scenarios_total": self.scenarios_total,
            "scenarios_passed": self.scenarios_passed,
            "pass_rate": round(self.pass_rate, 4),
            "total_fp_sec": self.total_fp_sec,
            "total_fn_sec": self.total_fn_sec,
            "total_actionable_fn_sec": self.total_actionable_fn_sec,
            "total_flaps": self.total_flaps,
            "mean_brier": round(self.mean_brier, 6),
            "mean_log_loss": round(self.mean_log_loss, 6),
            "mean_ece": round(self.mean_ece, 6),
            "mean_entry_latency_sec": round(self.mean_entry_latency_sec, 3),
            "p95_entry_latency_sec": round(self.p95_entry_latency_sec, 3),
            "mean_ambiguity_rate": round(self.mean_ambiguity_rate, 6),
            "total_safety_violations": self.total_safety_violations,
            "scalar_loss": round(self.scalar_loss, 3),
            "runtime_sec": round(self.runtime_sec, 3),
            "per_scenario": self.per_scenario,
        }


def _percentile(values: list[float], pct: float) -> float:
    if not values:
        return 0.0
    sv = sorted(values)
    idx = (len(sv) - 1) * max(0.0, min(1.0, pct))
    lo = int(math.floor(idx))
    hi = min(len(sv) - 1, lo + 1)
    frac = idx - lo
    return sv[lo] * (1.0 - frac) + sv[hi] * frac


def _compute_ece(probs: list[float], labels: list[int], n_bins: int = 10) -> float:
    total = len(probs)
    if total == 0:
        return 0.0
    bin_sums_p = [0.0] * n_bins
    bin_sums_y = [0] * n_bins
    bin_counts = [0] * n_bins
    for p, y in zip(probs, labels, strict=True):
        idx = min(n_bins - 1, max(0, int(p * n_bins)))
        bin_sums_p[idx] += p
        bin_sums_y[idx] += y
        bin_counts[idx] += 1
    ece = 0.0
    for b in range(n_bins):
        cnt = bin_counts[b]
        if cnt > 0:
            avg_p = bin_sums_p[b] / cnt
            avg_y = bin_sums_y[b] / cnt
            ece += (cnt / total) * abs(avg_p - avg_y)
    return ece


def evaluate_run_metrics(
    *,
    run_key: str,
    scenario_name: str,
    split_label: str,
    seed: int,
    expected_timeline: list[set[str]],
    actual_timeline: list[set[str]],
    prob_timeline: list[dict[str, float]],
    thresholds: dict[str, Any] | None = None,
    tracked_rooms: list[str] | None = None,
) -> RunEvaluation:
    """Evaluate one 1Hz run on GoldenScorecard plus Brier, Log-Loss, ECE, and Ambiguity Band."""
    rooms = tracked_rooms or [str(r["room_name"]) for r in HOUSE_ROOM_CONFIGS]
    card = evaluate_golden_run(
        scenario_name=scenario_name,
        seed=seed,
        expected_timeline=expected_timeline,
        actual_timeline=actual_timeline,
        tracked_rooms=rooms,
        thresholds=thresholds,
    )

    front_entry_rm = card.rooms.get("Front Entry")
    front_fn = front_entry_rm.false_negative_sec if front_entry_rm else 0
    actionable_fn = max(0, card.total_false_negative_sec - front_fn)

    n_t = min(len(expected_timeline), len(actual_timeline), len(prob_timeline))
    brier_sum = 0.0
    logloss_sum = 0.0
    all_probs: list[float] = []
    all_labels: list[int] = []
    ambig_sec = 0

    for room in rooms:
        contig_ambig = 0
        for t in range(n_t):
            y = 1 if room in expected_timeline[t] else 0
            p = max(0.0, min(1.0, float(prob_timeline[t].get(room, 0.0))))
            brier_sum += (p - y) ** 2
            p_clip = max(1e-4, min(1.0 - 1e-4, p))
            logloss_sum += -(y * math.log(p_clip) + (1 - y) * math.log(1.0 - p_clip))
            all_probs.append(p)
            all_labels.append(y)

            if AMBIGUITY_LOW <= p <= AMBIGUITY_HIGH:
                contig_ambig += 1
            else:
                if contig_ambig >= AMBIGUITY_MIN_RUN_SEC:
                    ambig_sec += contig_ambig
                contig_ambig = 0
        if contig_ambig >= AMBIGUITY_MIN_RUN_SEC:
            ambig_sec += contig_ambig

    total_rs = max(1, n_t * len(rooms))
    latencies: list[float] = [
        lat for rm in card.rooms.values() for lat in rm.entry_latencies_sec if lat is not None
    ]
    mean_lat = sum(latencies) / len(latencies) if latencies else 0.0
    p95_lat = _percentile(latencies, 0.95)

    safety_violations = 0
    if scenario_name in SAFETY_ONLY_CHECK_ROOMS:
        check_rooms = SAFETY_ONLY_CHECK_ROOMS[scenario_name]
        if not check_rooms:
            if card.total_false_positive_sec > 0:
                safety_violations += 1
        elif any(
            (card.rooms.get(cr) is not None and card.rooms[cr].false_positive_sec > 0)
            for cr in check_rooms
        ):
            safety_violations += 1

    return RunEvaluation(
        run_key=run_key,
        scenario_name=scenario_name,
        split_label=split_label,
        seed=seed,
        scorecard=card,
        actionable_fn_sec=actionable_fn,
        brier_score=brier_sum / total_rs,
        log_loss=logloss_sum / total_rs,
        ece_score=_compute_ece(all_probs, all_labels),
        mean_entry_latency_sec=mean_lat,
        p95_entry_latency_sec=p95_lat,
        ambiguity_band_rate=ambig_sec / total_rs,
        safety_violations=safety_violations,
        room_second_total=total_rs,
    )


def compute_scalar_loss(
    *,
    total_fp_sec: int,
    total_actionable_fn_sec: int,
    total_flaps: int,
    mean_brier: float,
    mean_entry_latency_sec: float,
    total_safety_violations: int,
    scenarios_failed: int,
) -> float:
    """Multi-objective scalar loss prioritizing hard safety, accuracy, stability, and calibration."""
    return (
        1.0 * float(total_fp_sec)
        + 0.6 * float(total_actionable_fn_sec)
        + 120.0 * float(total_flaps)
        + 2500.0 * float(mean_brier)
        + 25.0 * max(0.0, float(mean_entry_latency_sec) - 2.0)
        + 10000.0 * float(total_safety_violations)
        + 250.0 * float(scenarios_failed)
    )


def evaluate_suite(
    *,
    candidate_name: str,
    config_id: str,
    split_name: str,
    params: dict[str, float],
    runs: list[RunEvaluation],
    runtime_sec: float = 0.0,
) -> SuiteEvaluation:
    """Aggregate RunEvaluations into a SuiteEvaluation."""
    n = len(runs)
    if n == 0:
        raise ValueError("Cannot evaluate an empty list of runs")

    passed = sum(1 for r in runs if r.scorecard.passed)
    total_fp = sum(r.scorecard.total_false_positive_sec for r in runs)
    total_fn = sum(r.scorecard.total_false_negative_sec for r in runs)
    total_act_fn = sum(r.actionable_fn_sec for r in runs)
    total_flaps = sum(r.scorecard.total_flaps for r in runs)
    total_safety = sum(r.safety_violations for r in runs)

    total_rs = sum(r.room_second_total for r in runs)
    mean_brier = sum(r.brier_score * r.room_second_total for r in runs) / max(1, total_rs)
    mean_logloss = sum(r.log_loss * r.room_second_total for r in runs) / max(1, total_rs)
    mean_ece = sum(r.ece_score * r.room_second_total for r in runs) / max(1, total_rs)
    mean_ambig = sum(r.ambiguity_band_rate * r.room_second_total for r in runs) / max(1, total_rs)

    all_latencies = [
        lat
        for r in runs
        for rm in r.scorecard.rooms.values()
        for lat in rm.entry_latencies_sec
        if lat is not None
    ]
    mean_lat = sum(all_latencies) / len(all_latencies) if all_latencies else 0.0
    p95_lat = _percentile(all_latencies, 0.95)

    scalar = compute_scalar_loss(
        total_fp_sec=total_fp,
        total_actionable_fn_sec=total_act_fn,
        total_flaps=total_flaps,
        mean_brier=mean_brier,
        mean_entry_latency_sec=mean_lat,
        total_safety_violations=total_safety,
        scenarios_failed=n - passed,
    )

    per_scen: dict[str, dict[str, Any]] = {}
    for r in runs:
        entry = per_scen.setdefault(
            r.scenario_name,
            {
                "runs": 0,
                "passed": 0,
                "fp_sec": 0,
                "fn_sec": 0,
                "actionable_fn_sec": 0,
                "flaps": 0,
                "brier_sum": 0.0,
                "ambig_sum": 0.0,
                "latencies": [],
                "failures": [],
            },
        )
        entry["runs"] += 1
        entry["passed"] += 1 if r.scorecard.passed else 0
        entry["fp_sec"] += r.scorecard.total_false_positive_sec
        entry["fn_sec"] += r.scorecard.total_false_negative_sec
        entry["actionable_fn_sec"] += r.actionable_fn_sec
        entry["flaps"] += r.scorecard.total_flaps
        entry["brier_sum"] += r.brier_score
        entry["ambig_sum"] += r.ambiguity_band_rate
        for rm in r.scorecard.rooms.values():
            entry["latencies"].extend(rm.entry_latencies_sec)
        for fail in r.scorecard.failures:
            tag = f"{r.split_label}: {fail}"
            if tag not in entry["failures"]:
                entry["failures"].append(tag)

    clean_per_scen: dict[str, dict[str, Any]] = {}
    for sname, data in per_scen.items():
        lats = data["latencies"]
        clean_per_scen[sname] = {
            "runs": data["runs"],
            "passed": data["passed"],
            "fp_sec": data["fp_sec"],
            "fn_sec": data["fn_sec"],
            "actionable_fn_sec": data["actionable_fn_sec"],
            "flaps": data["flaps"],
            "mean_brier": round(data["brier_sum"] / max(1, data["runs"]), 6),
            "mean_ambiguity_rate": round(data["ambig_sum"] / max(1, data["runs"]), 6),
            "mean_latency_sec": round(sum(lats) / len(lats), 2) if lats else 0.0,
            "failures": data["failures"],
        }

    return SuiteEvaluation(
        candidate_name=candidate_name,
        config_id=config_id,
        split_name=split_name,
        params=dict(params),
        scenarios_total=n,
        scenarios_passed=passed,
        pass_rate=passed / float(n),
        total_fp_sec=total_fp,
        total_fn_sec=total_fn,
        total_actionable_fn_sec=total_act_fn,
        total_flaps=total_flaps,
        mean_brier=mean_brier,
        mean_log_loss=mean_logloss,
        mean_ece=mean_ece,
        mean_entry_latency_sec=mean_lat,
        p95_entry_latency_sec=p95_lat,
        mean_ambiguity_rate=mean_ambig,
        total_safety_violations=total_safety,
        scalar_loss=scalar,
        runtime_sec=runtime_sec,
        per_scenario=clean_per_scen,
    )


def _dominates(a: dict[str, Any], b: dict[str, Any], keys: tuple[str, ...]) -> bool:
    le_all = all(float(a[k]) <= float(b[k]) + 1e-12 for k in keys)
    lt_one = any(float(a[k]) < float(b[k]) - 1e-12 for k in keys)
    return le_all and lt_one


def extract_pareto_frontier(
    points: list[dict[str, Any]],
    *,
    objectives: tuple[str, ...] = (
        "total_fp_sec",
        "total_actionable_fn_sec",
        "mean_brier",
        "total_flaps",
    ),
) -> list[dict[str, Any]]:
    """Return non-dominated Pareto frontier sorted by FP asc then Actionable FN asc."""
    if not points:
        return []
    safe_pts = [p for p in points if int(p.get("total_safety_violations", 0)) == 0]
    pool = (
        safe_pts
        if safe_pts
        else sorted(points, key=lambda p: int(p.get("total_safety_violations", 0)))[
            : max(1, len(points) // 4)
        ]
    )

    frontier: list[dict[str, Any]] = []
    for cand in pool:
        if not any(_dominates(other, cand, objectives) for other in pool if other is not cand):
            frontier.append(cand)
    frontier.sort(
        key=lambda p: (
            int(p["total_fp_sec"]),
            int(p["total_actionable_fn_sec"]),
            float(p["mean_brier"]),
        )
    )
    return frontier
