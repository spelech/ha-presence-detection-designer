"""Declarative whole-house scenario runner with 6-part feedback envelopes."""

from __future__ import annotations

import json
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from .feedback_envelope import ScenarioAssertionError, build_feedback_envelope
from .virtual_ha import VirtualHAHarness


@dataclass
class ScenarioResult:
    """Structured output of a completed scenario execution."""

    name: str
    snapshots: dict[str, dict[str, Any]]
    transitions: list[dict[str, Any]]
    bus_events: list[dict[str, Any]]
    mermaids: dict[str, str]
    action_history: list[dict[str, Any]] = field(default_factory=list)
    captured_logs: list[str] = field(default_factory=list)


def load_scenario_file(path: str | Path) -> dict[str, Any]:
    """Load a scenario specification from a JSON (or YAML if PyYAML installed) file."""
    p = Path(path)
    raw = p.read_text(encoding="utf-8")
    if p.suffix.lower() in (".yaml", ".yml"):
        import yaml  # type: ignore[import-untyped]

        data = yaml.safe_load(raw)
        if not isinstance(data, dict):
            raise ValueError(f"Scenario YAML must parse to a dict: {p}")
        return data
    data = json.loads(raw)
    if not isinstance(data, dict):
        raise ValueError(f"Scenario JSON must parse to a dict: {p}")
    return data


def _resolve_target_ts(step: dict[str, Any], current_ts: float, base_ts: float) -> float | None:
    if "at" in step:
        raw_at = float(step["at"])
        return raw_at if raw_at >= 1_000_000_000 else base_ts + raw_at
    if "after" in step:
        return current_ts + max(0.0, float(step["after"]))
    return None


async def run_scenario(
    spec: dict[str, Any],
    *,
    reproduction_command: str = "pytest tests/test_e2e_harness.py",
    storage_dir: Path | None = None,
) -> ScenarioResult:
    """Execute a declarative multi-room scenario end-to-end through real PDD coordinators."""
    name = str(spec.get("name", "unnamed_scenario"))
    start_ts = float(spec.get("start_ts", 1794657600.0))
    rooms = list(spec.get("rooms") or [])
    assumptions = list(spec.get("assumptions") or [f"{len(rooms)} rooms initialized vacant"])
    global_settings = dict(spec.get("global_settings") or {})

    tmp_ctx = tempfile.TemporaryDirectory() if storage_dir is None else None
    work_dir = Path(tmp_ctx.name) if tmp_ctx is not None else storage_dir

    try:
        with VirtualHAHarness(
            storage_dir=work_dir,
            start_ts=start_ts,
            global_settings=global_settings,
        ) as harness:
            await harness.async_add_rooms(rooms, floorplan=spec.get("floorplan"))

            for eid, val in (spec.get("initial_states") or {}).items():
                if isinstance(val, dict):
                    harness.set_state(
                        eid,
                        str(val.get("state", "off")),
                        attributes=val.get("attributes"),
                    )
                else:
                    harness.set_state(eid, str(val))

            for step_idx, step in enumerate(spec.get("steps") or [], start=1):
                target_ts = _resolve_target_ts(step, harness.clock.now(), start_ts)
                if target_ts is not None and target_ts > harness.clock.now():
                    harness.advance(target_ts - harness.clock.now())

                if "advance" in step:
                    harness.advance(float(step["advance"]))

                for eid, val in (step.get("set") or {}).items():
                    if isinstance(val, dict):
                        harness.set_state(
                            eid,
                            str(val.get("state", "off")),
                            attributes=val.get("attributes"),
                        )
                    else:
                        harness.set_state(eid, str(val))

                if "override" in step:
                    ov = step["override"]
                    harness.coordinators[ov["room"]].state_machine.set_override(
                        bool(ov.get("enabled", True))
                    )

                if "force_clear" in step:
                    fc = step["force_clear"]
                    harness.coordinators[fc["room"]].state_machine.force_clear(
                        reason=fc.get("reason")
                    )

                if "llm_result" in step:
                    lr = step["llm_result"]
                    coord = harness.coordinators[lr["room"]]
                    coord.state_machine.handle_llm_result(
                        bool(lr.get("person_detected", False)),
                        str(lr.get("reason", "Harness LLM result")),
                    )
                    coord.async_update_listeners()

                if "expect" in step:
                    _assert_expectations(
                        harness=harness,
                        expected_map=step["expect"],
                        step_idx=step_idx,
                        spec=spec,
                        assumptions=assumptions,
                        reproduction_command=reproduction_command,
                    )

            snapshots = {r: harness.room_snapshot(r) for r in harness.coordinators}
            mermaids = {
                r: c.state_machine.get_mermaid_diagram() for r, c in harness.coordinators.items()
            }
            return ScenarioResult(
                name=name,
                snapshots=snapshots,
                transitions=harness.all_room_transitions(),
                bus_events=list(harness.hass.bus.events),
                mermaids=mermaids,
                action_history=list(harness.tap.events),
                captured_logs=harness.log_tap.lines,
            )
    finally:
        if tmp_ctx is not None:
            tmp_ctx.cleanup()


def _assert_expectations(
    *,
    harness: VirtualHAHarness,
    expected_map: dict[str, dict[str, Any]],
    step_idx: int,
    spec: dict[str, Any],
    assumptions: list[str],
    reproduction_command: str,
) -> None:
    deltas: dict[str, Any] = {}
    for room_name, expected in expected_map.items():
        if room_name not in harness.coordinators:
            deltas[room_name] = {"error": f"Unknown room '{room_name}'"}
            continue
        actual = harness.room_snapshot(room_name)
        room_deltas: dict[str, Any] = {}
        for field_name, exp_val in expected.items():
            act_val = actual.get(field_name)
            if act_val != exp_val:
                room_deltas[field_name] = {"expected": exp_val, "actual": act_val}
        if room_deltas:
            deltas[room_name] = room_deltas

    if deltas:
        active_settings = {
            r.get("room_name", f"room_{i}"): {
                "inactivity_timeout": r.get("inactivity_timeout"),
                "max_hold_timeout": r.get("max_hold_timeout"),
                "llm_enabled": r.get("llm_enabled", False),
                "bayesian_threshold": r.get("bayesian_threshold"),
            }
            for i, r in enumerate(spec.get("rooms") or [])
        }
        envelope = build_feedback_envelope(
            test_name=f"{spec.get('name', 'scenario')} [step #{step_idx}]",
            inputs={
                "scenario": spec.get("name"),
                "step_index": step_idx,
                "virtual_ts": round(harness.clock.now(), 3),
                "room_count": len(harness.coordinators),
            },
            assumptions=assumptions,
            active_settings=active_settings,
            action_history=harness.all_room_transitions()[-25:],
            output_delta=deltas,
            captured_logs=harness.log_tap.lines,
            reproduction_command=reproduction_command,
        )
        raise ScenarioAssertionError(envelope)
