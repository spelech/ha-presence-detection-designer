"""Pre-generated multi-seed dataset splits and hardware sensitivity floorplans."""

from __future__ import annotations

import copy
from dataclasses import dataclass, field
from typing import Any

from custom_components.presence_detection_designer.spatial_topology import (
    compute_pir_spillover_matrix,
)
from tests.golden.floorplan_snapshot import HOUSE_ROOM_CONFIGS, load_golden_floorplan
from tests.golden.scenarios import GOLDEN_SCENARIOS, GoldenScenario
from tests.golden.signal_layers import GeneratedTimeline, LayeredSignalGenerator

# Train/tuning split (1 clean + 2 fuzzed seeds * 16 scenarios = 48 timelines)
TRAIN_SPECS: tuple[tuple[str, bool, int], ...] = (
    ("clean", False, 42),
    ("fuzz_101", True, 101),
    ("fuzz_202", True, 202),
)

# Strictly held-out validation split (3 unseen fuzzed seeds * 16 scenarios = 48 timelines)
VAL_SPECS: tuple[tuple[str, bool, int], ...] = (
    ("fuzz_303", True, 303),
    ("fuzz_404", True, 404),
    ("fuzz_505", True, 505),
)

# Ceiling-mounted Kitchen PIR sensitivity split (eliminates 31% spillover into Front Entry)
CEILING_KITCHEN_SPECS: tuple[tuple[str, bool, int], ...] = (
    ("clean", False, 42),
    ("fuzz_303", True, 303),
)


@dataclass
class ScenarioBundle:
    """Deterministic pre-generated scenario timeline + expanded 1Hz delta events."""

    scenario: GoldenScenario
    split_label: str
    noisy: bool
    seed: int
    timeline: GeneratedTimeline
    events_by_t: dict[int, dict[str, str]] = field(default_factory=dict)

    @property
    def run_key(self) -> str:
        return f"{self.scenario.name}__{self.split_label}"


def build_ceiling_kitchen_floorplan(base_fp: dict[str, Any] | None = None) -> dict[str, Any]:
    """Return a copy of the floorplan with Kitchen PIR ceiling-mounted at room center (0% spillover)."""
    fp = copy.deepcopy(base_fp if base_fp is not None else load_golden_floorplan())
    kitchen_box = next(
        (r for r in fp.get("rooms", []) if str(r.get("name", "")) == "Kitchen"),
        None,
    )
    if kitchen_box is None:
        return fp

    rx = float(kitchen_box.get("x", 0.0))
    ry = float(kitchen_box.get("y", 0.0))
    rw = float(kitchen_box.get("width", 200.0))
    rh = float(kitchen_box.get("height", 200.0))
    cx = round(rx + rw / 2.0, 1)
    cy = round(ry + rh / 2.0, 1)
    reach = round(min(rw, rh) * 0.48, 1)

    for sen in fp.get("sensors", []):
        if str(sen.get("entity_id", "")) == "binary_sensor.kitchen_motion_occupancy":
            sen["x"] = cx
            sen["y"] = cy
            sen["heading_deg"] = 0
            sen["fov_deg"] = 360
            sen["range_px"] = reach
            break

    spill = compute_pir_spillover_matrix(fp, min_overlap_pct=5.0)
    kitchen_spill = spill.get("binary_sensor.kitchen_motion_occupancy", {})
    if "Front Entry" in kitchen_spill:
        raise AssertionError(
            f"Ceiling-mounted Kitchen PIR still spills into Front Entry: {kitchen_spill}"
        )
    return fp


def build_dataset(
    floorplan: dict[str, Any],
    specs: tuple[tuple[str, bool, int], ...],
    *,
    scenarios: list[GoldenScenario] | None = None,
) -> list[ScenarioBundle]:
    """Pre-generate identical 1Hz GeneratedTimelines for fair head-to-head candidate evaluation."""
    gen = LayeredSignalGenerator(floorplan)
    scens = scenarios if scenarios is not None else GOLDEN_SCENARIOS
    bundles: list[ScenarioBundle] = []
    for split_label, noisy, seed in specs:
        for scen in scens:
            tl = gen.generate(
                tracks=list(scen.tracks),
                duration_sec=scen.duration_sec,
                fuzz=scen.fuzz_noisy if noisy else scen.fuzz_clean,
                seed=seed,
            )
            events_by_t = dict(tl.events)
            bundles.append(
                ScenarioBundle(
                    scenario=scen,
                    split_label=split_label,
                    noisy=noisy,
                    seed=seed,
                    timeline=tl,
                    events_by_t=events_by_t,
                )
            )
    return bundles


def get_tracked_rooms() -> list[str]:
    """Return canonical list of tracked PDD room names in config order."""
    return [str(r["room_name"]) for r in HOUSE_ROOM_CONFIGS]
