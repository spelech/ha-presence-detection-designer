"""Ground-truth scorecard for evaluating PDD runs against golden expected occupancy."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from .floorplan_snapshot import ZONE_GROUPS


@dataclass
class RoomMetrics:
    """Per-room accuracy, latency, and stability metrics for a single scenario run."""

    room_name: str
    expected_occupied_sec: int = 0
    actual_occupied_sec: int = 0
    true_positive_sec: int = 0
    false_positive_sec: int = 0
    false_negative_sec: int = 0
    entry_latencies_sec: list[float] = field(default_factory=list)
    flap_count: int = 0
    transition_count: int = 0

    @property
    def precision(self) -> float:
        denom = self.true_positive_sec + self.false_positive_sec
        return 1.0 if denom == 0 else self.true_positive_sec / denom

    @property
    def recall(self) -> float:
        denom = self.true_positive_sec + self.false_negative_sec
        return 1.0 if denom == 0 else self.true_positive_sec / denom

    @property
    def max_entry_latency_sec(self) -> float:
        return max(self.entry_latencies_sec) if self.entry_latencies_sec else 0.0


@dataclass
class ZoneMetrics:
    """Whole-zone continuity metrics (e.g., Basement = Theater OR Play Area)."""

    zone_name: str
    rooms: tuple[str, ...]
    expected_occupied_sec: int = 0
    actual_occupied_sec: int = 0
    dark_gap_sec: int = 0
    false_positive_sec: int = 0
    flap_count: int = 0


@dataclass
class GoldenScorecard:
    """Aggregated scorecard for a golden scenario execution."""

    scenario_name: str
    seed: int
    total_duration_sec: int
    rooms: dict[str, RoomMetrics] = field(default_factory=dict)
    zones: dict[str, ZoneMetrics] = field(default_factory=dict)
    failures: list[str] = field(default_factory=list)

    @property
    def total_false_positive_sec(self) -> int:
        return sum(r.false_positive_sec for r in self.rooms.values())

    @property
    def total_false_negative_sec(self) -> int:
        return sum(r.false_negative_sec for r in self.rooms.values())

    @property
    def total_flaps(self) -> int:
        return sum(r.flap_count for r in self.rooms.values())

    @property
    def passed(self) -> bool:
        return len(self.failures) == 0

    def summary_dict(self) -> dict[str, Any]:
        return {
            "scenario": self.scenario_name,
            "seed": self.seed,
            "passed": self.passed,
            "total_fp_sec": self.total_false_positive_sec,
            "total_fn_sec": self.total_false_negative_sec,
            "total_flaps": self.total_flaps,
            "failures": list(self.failures),
        }


def evaluate_golden_run(
    *,
    scenario_name: str,
    seed: int,
    expected_timeline: list[set[str]],
    actual_timeline: list[set[str]],
    tracked_rooms: list[str],
    thresholds: dict[str, Any] | None = None,
    flap_window_sec: int = 30,
    cooling_grace_sec: int = 20,
) -> GoldenScorecard:
    """Compare 1Hz expected ground truth against 1Hz actual PDD room occupancy."""
    n = min(len(expected_timeline), len(actual_timeline))
    card = GoldenScorecard(scenario_name=scenario_name, seed=seed, total_duration_sec=n)
    limits = dict(thresholds or {})

    for room in tracked_rooms:
        rm = RoomMetrics(room_name=room)
        prev_actual = False
        prev_expected = False
        last_on_t: int | None = None
        last_off_t: int | None = None
        pending_entry_t: int | None = None
        last_expected_on_t: int | None = None

        for t in range(n):
            exp = room in expected_timeline[t]
            act = room in actual_timeline[t]

            if exp:
                rm.expected_occupied_sec += 1
                last_expected_on_t = t
            if act:
                rm.actual_occupied_sec += 1

            # Entry latency tracking
            if exp and not prev_expected:
                pending_entry_t = t
            if pending_entry_t is not None and act:
                rm.entry_latencies_sec.append(float(t - pending_entry_t))
                pending_entry_t = None
            elif not exp:
                pending_entry_t = None

            # TP / FP / FN (allow configured cooling grace right after expected exit)
            if exp and act:
                rm.true_positive_sec += 1
            elif act and not exp:
                in_cooling_grace = (
                    last_expected_on_t is not None and (t - last_expected_on_t) <= cooling_grace_sec
                )
                if not in_cooling_grace:
                    rm.false_positive_sec += 1
            elif exp and not act:
                rm.false_negative_sec += 1

            # Transitions & true flapping (unexpected oscillation, not legitimate brief pass-throughs)
            if act != prev_actual:
                rm.transition_count += 1
                if act:
                    # Off -> On -> Off -> On while expected occupied = premature drop/recovery flap
                    if exp and last_off_t is not None and (t - last_off_t) <= flap_window_sec:
                        rm.flap_count += 1
                    last_on_t = t
                else:
                    # Off -> On -> Off while expected vacant = spurious false-trigger flicker
                    if not exp and last_on_t is not None and (t - last_on_t) <= flap_window_sec:
                        if (
                            last_expected_on_t is None
                            or (t - last_expected_on_t) > cooling_grace_sec
                        ):
                            rm.flap_count += 1
                    last_off_t = t

            prev_actual = act
            prev_expected = exp

        card.rooms[room] = rm

    # Zone-level continuity (e.g., whole Basement stays occupied across Theater <-> Play Area)
    for zname, zrooms in ZONE_GROUPS.items():
        zm = ZoneMetrics(zone_name=zname, rooms=zrooms)
        prev_z_act = False
        last_z_off: int | None = None
        for t in range(n):
            z_exp = any(r in expected_timeline[t] for r in zrooms)
            z_act = any(r in actual_timeline[t] for r in zrooms)
            if z_exp:
                zm.expected_occupied_sec += 1
            if z_act:
                zm.actual_occupied_sec += 1
            if z_exp and not z_act:
                zm.dark_gap_sec += 1
            elif z_act and not z_exp:
                zm.false_positive_sec += 1
            if z_act != prev_z_act:
                if z_act and last_z_off is not None and (t - last_z_off) <= flap_window_sec:
                    zm.flap_count += 1
                elif not z_act:
                    last_z_off = t
            prev_z_act = z_act
        card.zones[zname] = zm

    # Threshold assertions
    max_fp = limits.get("max_total_fp_sec")
    if max_fp is not None and card.total_false_positive_sec > int(max_fp):
        card.failures.append(
            f"total_false_positive_sec={card.total_false_positive_sec} > max {max_fp}"
        )

    max_fn = limits.get("max_total_fn_sec")
    if max_fn is not None and card.total_false_negative_sec > int(max_fn):
        card.failures.append(
            f"total_false_negative_sec={card.total_false_negative_sec} > max {max_fn}"
        )

    max_flaps = limits.get("max_total_flaps")
    if max_flaps is not None and card.total_flaps > int(max_flaps):
        card.failures.append(f"total_flaps={card.total_flaps} > max {max_flaps}")

    for room, max_room_fp in (limits.get("max_room_fp_sec") or {}).items():
        rm = card.rooms.get(room)
        if rm and rm.false_positive_sec > int(max_room_fp):
            card.failures.append(f"{room}: fp_sec={rm.false_positive_sec} > max {max_room_fp}")

    for room, max_lat in (limits.get("max_entry_latency_sec") or {}).items():
        rm = card.rooms.get(room)
        if rm and rm.max_entry_latency_sec > float(max_lat):
            card.failures.append(
                f"{room}: max_entry_latency={rm.max_entry_latency_sec}s > max {max_lat}s"
            )

    for zname, max_gap in (limits.get("max_zone_dark_gap_sec") or {}).items():
        zm = card.zones.get(zname)
        if zm and zm.dark_gap_sec > int(max_gap):
            card.failures.append(f"Zone {zname}: dark_gap_sec={zm.dark_gap_sec} > max {max_gap}")

    return card
