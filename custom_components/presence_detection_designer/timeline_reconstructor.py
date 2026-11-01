"""Chronological whole-house spatial timeline reconstruction engine."""

from __future__ import annotations

from collections.abc import Callable
from datetime import UTC, datetime
from typing import Any

from .spatial_catalog import BLIND_POCKET_DEFINITIONS
from .spatial_topology import compile_floorplan_topology, get_default_floorplan


def reconstruct_house_timeline(
    floorplan: dict[str, Any] | None,
    room_configs: dict[str, dict[str, Any]] | None,
    entity_timelines: dict[str, list[tuple[float, str]]],
    start_ts: float,
    end_ts: float,
    negative_space_enabled: bool = True,
    min_step_sec: float = 2.0,
    max_frames: int = 350,
    frame_evaluator: Callable[..., dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Reconstruct a chronological whole-house spatial timeline across all sensors and rooms."""
    if frame_evaluator is None:
        from .spatial_inference import evaluate_spatial_frame

        frame_evaluator = evaluate_spatial_frame

    fp = (
        floorplan
        if isinstance(floorplan, dict) and floorplan.get("rooms")
        else get_default_floorplan()
    )
    compiled = compile_floorplan_topology(fp, room_configs)

    raw_timestamps: set[float] = {float(start_ts), float(end_ts)}
    for _eid, events in (entity_timelines or {}).items():
        for ts, _state in events:
            if start_ts <= ts <= end_ts:
                raw_timestamps.add(float(ts))

    sorted_ts = sorted(raw_timestamps)
    coalesced_ts: list[float] = []
    for ts in sorted_ts:
        if not coalesced_ts or (ts - coalesced_ts[-1]) >= min_step_sec or ts == end_ts:
            coalesced_ts.append(ts)

    if len(coalesced_ts) > max_frames:
        stride = max(1, len(coalesced_ts) // max_frames)
        sampled = coalesced_ts[::stride]
        if sampled[-1] != coalesced_ts[-1]:
            sampled.append(coalesced_ts[-1])
        coalesced_ts = sampled

    sorted_timelines: dict[str, list[tuple[float, str]]] = {
        eid: sorted(events, key=lambda x: x[0]) for eid, events in (entity_timelines or {}).items()
    }
    pointers: dict[str, int] = {eid: 0 for eid in sorted_timelines}
    current_states: dict[str, str] = {eid: "off" for eid in sorted_timelines}

    frames: list[dict[str, Any]] = []
    transitions: list[dict[str, Any]] = []

    prev_frame_on: dict[str, Any] | None = None
    prev_frame_off: dict[str, Any] | None = None
    last_primary_room: str | None = None
    last_primary_subregion: str | None = None

    blind_pocket_holds_count = 0
    uncovered_subregion_count = 0
    shade_sunlight_exclusions_count = 0
    per_room_on_frames: dict[str, int] = {}
    per_room_off_frames: dict[str, int] = {}

    for ts in coalesced_ts:
        for eid, ev_list in sorted_timelines.items():
            idx = pointers[eid]
            while idx < len(ev_list) and ev_list[idx][0] <= ts:
                current_states[eid] = str(ev_list[idx][1])
                idx += 1
            pointers[eid] = idx

        eval_on = frame_evaluator(
            floorplan=fp,
            compiled_topology=compiled,
            state_getter=lambda eid: current_states.get(eid, "off"),
            prev_frame=prev_frame_on,
            now_ts=ts,
            negative_space_enabled=True,
        )
        eval_off = frame_evaluator(
            floorplan=fp,
            compiled_topology=compiled,
            state_getter=lambda eid: current_states.get(eid, "off"),
            prev_frame=prev_frame_off,
            now_ts=ts,
            negative_space_enabled=False,
        )
        prev_frame_on = eval_on
        prev_frame_off = eval_off

        if eval_on.get("active_shade_exclusions"):
            shade_sunlight_exclusions_count += 1

        active_rooms_on = sorted(
            r_name for r_name, est in eval_on["room_estimates"].items() if est.get("occupied")
        )
        active_rooms_off = sorted(
            r_name for r_name, est in eval_off["room_estimates"].items() if est.get("occupied")
        )

        for r_name in active_rooms_on:
            per_room_on_frames[r_name] = per_room_on_frames.get(r_name, 0) + 1
            est = eval_on["room_estimates"][r_name]
            if est.get("should_hold_occupied") and r_name in BLIND_POCKET_DEFINITIONS:
                blind_pocket_holds_count += 1
            elif est.get("method") in ("negative_space", "hybrid"):
                uncovered_subregion_count += 1
        for r_name in active_rooms_off:
            per_room_off_frames[r_name] = per_room_off_frames.get(r_name, 0) + 1

        chosen_eval = eval_on if negative_space_enabled else eval_off
        chosen_active_rooms = active_rooms_on if negative_space_enabled else active_rooms_off
        iso_str = datetime.fromtimestamp(ts, tz=UTC).isoformat()

        occ_list = chosen_eval["occupant_estimates"]
        if occ_list:
            primary = occ_list[0]
            curr_room = str(primary["room"])
            curr_sub = str(primary["subregion"])
            if curr_room != last_primary_room or curr_sub != last_primary_subregion:
                transitions.append(
                    {
                        "ts": ts,
                        "iso": iso_str,
                        "from_room": last_primary_room,
                        "to_room": curr_room,
                        "floor": primary["floor"],
                        "x": primary["x"],
                        "y": primary["y"],
                        "subregion": curr_sub,
                        "method": primary["method"],
                        "explanation": primary["explanation"],
                        "positive_drivers": primary["positive_drivers"],
                        "negative_space_evidence": primary["negative_exclusions"],
                    }
                )
                last_primary_room = curr_room
                last_primary_subregion = curr_sub

        frames.append(
            {
                "ts": ts,
                "iso": iso_str,
                "occupant_estimates": chosen_eval["occupant_estimates"],
                "active_rooms": chosen_active_rooms,
                "active_rooms_with_negative_space": active_rooms_on,
                "active_rooms_baseline": active_rooms_off,
                "active_positive_sensors": chosen_eval["active_positive_sensors"],
                "active_negative_exclusions": chosen_eval["active_negative_exclusions"],
                "active_shade_exclusions": chosen_eval.get("active_shade_exclusions", []),
            }
        )

    all_seen_rooms = sorted(set(per_room_on_frames.keys()) | set(per_room_off_frames.keys()))
    per_room_delta = {
        r_name: {
            "frames_with_negative_space": per_room_on_frames.get(r_name, 0),
            "frames_baseline": per_room_off_frames.get(r_name, 0),
            "delta_frames": per_room_on_frames.get(r_name, 0) - per_room_off_frames.get(r_name, 0),
        }
        for r_name in all_seen_rooms
    }

    return {
        "negative_space_enabled": negative_space_enabled,
        "start_ts": start_ts,
        "end_ts": end_ts,
        "frame_count": len(frames),
        "frames": frames,
        "transitions": transitions,
        "comparison_summary": {
            "blind_pocket_holds_count": blind_pocket_holds_count,
            "uncovered_subregion_localizations": uncovered_subregion_count,
            "shade_sunlight_exclusions_count": shade_sunlight_exclusions_count,
            "per_room_delta": per_room_delta,
        },
    }
