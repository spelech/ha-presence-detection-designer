#!/usr/bin/env python3
"""CLI runner for declarative PDD scenarios and Home Assistant data playback."""

from __future__ import annotations

import argparse
import asyncio
import datetime
import json
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from tests.harness.ha_playback import (  # noqa: E402
    load_ha_history_json,
    load_pdd_storage_playback,
    load_recorder_sqlite,
    playback_ha_history,
)
from tests.harness.scenario_runner import load_scenario_file, run_scenario  # noqa: E402


def _fmt_ts(ts: float) -> str:
    return datetime.datetime.fromtimestamp(ts, tz=datetime.UTC).strftime("%H:%M:%S")


def _print_transitions(transitions: list[dict[str, Any]], *, show_blocked: bool = False) -> None:
    print("\n=== Transition Trace ===")
    for item in transitions:
        if not item.get("accepted") and not show_blocked:
            continue
        status = "OK" if item.get("accepted") else "BLOCKED"
        print(
            f"  [{_fmt_ts(float(item.get('timestamp', 0.0)))}] "
            f"{item.get('room'):<18} {status:<7} "
            f"{item.get('source')} -> {item.get('dest')} "
            f"({item.get('trigger')}) :: {item.get('reason')}"
        )


def _print_summary(
    rooms: dict[str, dict[str, Any]], mermaids: dict[str, str], show_mermaid: bool
) -> None:
    print("\n=== Final Room States ===")
    for name, snap in sorted(rooms.items()):
        print(
            f"  {name:<20} state={snap['occupancy_state']:<18} "
            f"is_on={str(snap['is_on']):<5} prob={snap['probability_pct']:>5.1f}% "
            f"cooling={snap['cooling_remaining_sec']}s :: {snap['state_reason']}"
        )
    if show_mermaid and mermaids:
        first_room = sorted(mermaids)[0]
        print(f"\n=== Live Mermaid State Diagram ({first_room}) ===")
        print(mermaids[first_room])


async def _main_async(args: argparse.Namespace) -> int:
    if args.scenario:
        spec = load_scenario_file(args.scenario)
        res = await run_scenario(spec, reproduction_command=" ".join(sys.argv))
        if args.json:
            print(
                json.dumps(
                    {
                        "name": res.name,
                        "rooms": res.snapshots,
                        "transitions": res.transitions,
                        "bus_events": res.bus_events,
                    },
                    indent=2,
                    default=str,
                )
            )
            return 0
        print(f"Scenario '{res.name}' completed ({len(res.transitions)} transition records).")
        _print_transitions(res.transitions, show_blocked=args.show_blocked)
        _print_summary(res.snapshots, res.mermaids, args.mermaid)
        return 0

    room_filter = {r.strip() for r in args.rooms.split(",") if r.strip()} if args.rooms else None
    if args.pdd_storage:
        room_configs, events, legacy = load_pdd_storage_playback(
            args.pdd_storage, room_filter=room_filter
        )
        source_label = f"pdd_storage:{args.pdd_storage}"
    elif args.recorder_db or args.ha_history:
        if not args.rooms_config:
            raise SystemExit("--rooms-config JSON is required with --recorder-db / --ha-history")
        raw_cfg = json.loads(
            await asyncio.to_thread(Path(args.rooms_config).read_text, encoding="utf-8")
        )
        room_configs = raw_cfg if isinstance(raw_cfg, list) else list(raw_cfg.values())
        if room_filter:
            room_configs = [c for c in room_configs if c.get("room_name") in room_filter]
        if args.recorder_db:
            events = load_recorder_sqlite(args.recorder_db)
            source_label = f"recorder_db:{args.recorder_db}"
        else:
            events = load_ha_history_json(args.ha_history)
            source_label = f"ha_history:{args.ha_history}"
        legacy = None
    else:
        raise SystemExit("Provide --scenario, --pdd-storage, --recorder-db, or --ha-history")

    report = await playback_ha_history(
        room_configs=room_configs,
        events=events,
        source_label=source_label,
        legacy_timelines=legacy,
        tail_advance_sec=args.tail_advance,
    )
    if args.json:
        print(
            json.dumps(
                {
                    "source": report.source,
                    "event_count": report.event_count,
                    "rooms": report.rooms,
                    "transitions": report.transitions,
                    "legacy_diffs": report.legacy_diffs,
                },
                indent=2,
                default=str,
            )
        )
        return 0

    print(
        f"Playback '{report.source}' processed {report.event_count} events "
        f"across {len(report.rooms)} rooms."
    )
    _print_transitions(report.transitions, show_blocked=args.show_blocked)
    _print_summary(report.rooms, report.mermaids, args.mermaid)
    if report.legacy_diffs:
        print("\n=== Legacy WIB vs Transitions Final Differences ===")
        for diff in report.legacy_diffs:
            print(
                f"  {diff['room']:<20} legacy={diff['legacy_box_state']}({diff['legacy_is_present']}) "
                f"-> new={diff['new_occupancy_state']}({diff['new_is_present']})"
            )
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Run PDD scenarios or replay Home Assistant data.")
    parser.add_argument("--scenario", help="Path to JSON/YAML scenario description file")
    parser.add_argument(
        "--pdd-storage", help="Path to HA .storage/presence_detection_designer file"
    )
    parser.add_argument("--recorder-db", help="Path to HA home-assistant_v2.db SQLite file")
    parser.add_argument("--ha-history", help="Path to HA /api/history/period JSON export")
    parser.add_argument(
        "--rooms-config", help="Path to room configs JSON (for --recorder-db/--ha-history)"
    )
    parser.add_argument("--rooms", help="Comma-separated room names filter")
    parser.add_argument(
        "--tail-advance", type=float, default=0.0, help="Seconds to advance clock after last event"
    )
    parser.add_argument(
        "--show-blocked", action="store_true", help="Include guard-blocked triggers in trace"
    )
    parser.add_argument(
        "--mermaid", action="store_true", help="Print live Mermaid stateDiagram-v2 markup"
    )
    parser.add_argument("--json", action="store_true", help="Emit JSON output")
    return asyncio.run(_main_async(parser.parse_args()))


if __name__ == "__main__":
    raise SystemExit(main())
