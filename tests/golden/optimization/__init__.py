"""Isolated 4-candidate signal-processing race and multi-seed Pareto optimization harness."""

from __future__ import annotations

from .candidate_a_baseline import evaluate_candidate_a
from .candidate_b_hmm import CandidateBRunner
from .candidate_c_grid import CandidateCRunner
from .candidate_d_phd import CandidateDRunner
from .candidate_e_hybrid import CandidateERunner
from .dataset import (
    CEILING_KITCHEN_SPECS,
    TRAIN_SPECS,
    VAL_SPECS,
    ScenarioBundle,
    build_ceiling_kitchen_floorplan,
    build_dataset,
)
from .metrics import (
    RunEvaluation,
    SuiteEvaluation,
    compute_scalar_loss,
    evaluate_run_metrics,
    evaluate_suite,
    extract_pareto_frontier,
)
from .sensor_model import HouseTopologyIndex

__all__ = [
    "CEILING_KITCHEN_SPECS",
    "TRAIN_SPECS",
    "VAL_SPECS",
    "CandidateBRunner",
    "CandidateCRunner",
    "CandidateDRunner",
    "CandidateERunner",
    "HouseTopologyIndex",
    "RunEvaluation",
    "ScenarioBundle",
    "SuiteEvaluation",
    "build_ceiling_kitchen_floorplan",
    "build_dataset",
    "compute_scalar_loss",
    "evaluate_candidate_a",
    "evaluate_run_metrics",
    "evaluate_suite",
    "extract_pareto_frontier",
]
