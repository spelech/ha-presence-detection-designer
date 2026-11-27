"""Chronological whole-house spatial timeline reconstruction engine."""

from __future__ import annotations

import inspect
from collections.abc import Callable
from datetime import UTC, datetime
from typing import Any

from .spatial_catalog import (
    BLIND_POCKET_DEFINITIONS,
)
from .spatial_topology import compile_floorplan_topology, get_default_floorplan
from .timeline_log_reconstructor import _reconstruct_from_component_logs
from .timeline_models import (
    _build_room_adjacency_pairs,
    _consolidate_frame_occupants,
    _is_plausible_floor_transition,
)


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
    house_occupant_count: int | None = None,
    house_occupancy_mode: str | None = None,
    conservation_enabled: bool = True,
    guest_mode_enabled: bool = False,
    ble_decider_enabled: bool = False,
    coordinator_timelines: dict[str, list[dict[str, Any]]] | None = None,
) -> dict[str, Any]:
    """Reconstruct a chronological whole-house spatial timeline from component logs or sensor history."""
    fp = (
        floorplan
        if isinstance(floorplan, dict) and floorplan.get("rooms")
        else get_default_floorplan()
    )

    if coordinator_timelines and any(evs for evs in coordinator_timelines.values()):
        return _reconstruct_from_component_logs(
            fp=fp,
            room_configs=room_configs,
            coordinator_timelines=coordinator_timelines,
            start_ts=start_ts,
            end_ts=end_ts,
            negative_space_enabled=negative_space_enabled,
            min_step_sec=min_step_sec,
            max_frames=max_frames,
            house_occupant_count=house_occupant_count,
            house_occupancy_mode=house_occupancy_mode,
        )

    if frame_evaluator is None:
        from .spatial_inference import evaluate_spatial_frame

        frame_evaluator = evaluate_spatial_frame

    try:
        ev_params = inspect.signature(frame_evaluator).parameters
        supports_extra_flags = "guest_mode_enabled" in ev_params or any(
            param.kind == inspect.Parameter.VAR_KEYWORD for param in ev_params.values()
        )
    except (ValueError, TypeError):
        supports_extra_flags = False

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
    last_primary_floor: str | None = None
    last_primary_x: Any = None
    last_primary_y: Any = None
    adj_pairs_rec = _build_room_adjacency_pairs(fp, room_configs)
    last_primary_ts_rec: float | None = None
    last_occupant_loc: dict[str, dict[str, Any]] = {}
    current_leg_by_slot: dict[str, tuple[str | None, str | None]] = {}

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

        eval_kwargs: dict[str, Any] = {
            "floorplan": fp,
            "compiled_topology": compiled,
            "state_getter": lambda eid: current_states.get(eid, "off"),
        }
        if supports_extra_flags:
            eval_kwargs["guest_mode_enabled"] = guest_mode_enabled
            eval_kwargs["ble_decider_enabled"] = ble_decider_enabled

        eval_on = frame_evaluator(
            prev_frame=prev_frame_on,
            now_ts=ts,
            negative_space_enabled=True,
            **eval_kwargs,
        )
        eval_off = frame_evaluator(
            prev_frame=prev_frame_off,
            now_ts=ts,
            negative_space_enabled=False,
            **eval_kwargs,
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
        raw_active_rooms = active_rooms_on if negative_space_enabled else active_rooms_off
        iso_str = datetime.fromtimestamp(ts, tz=UTC).isoformat()

        occ_list, pruned_inferred_rooms = _consolidate_frame_occupants(
            raw_occ_list=chosen_eval.get("occupant_estimates") or [],
            telemetry_ble_by_room=chosen_eval.get("telemetry_ble_by_room") or {},
            recent_positive_ts=chosen_eval.get("recent_positive_ts") or {},
            house_occupant_count=house_occupant_count,
            conservation_enabled=conservation_enabled,
            guest_mode_enabled=guest_mode_enabled,
        )
        for r_name, est in (chosen_eval.get("room_estimates") or {}).items():
            if est.get("blind_pocket_pruned") and r_name not in pruned_inferred_rooms:
                pruned_inferred_rooms.append(str(r_name))
        pruned_set = set(pruned_inferred_rooms)
        chosen_active_rooms = [r for r in raw_active_rooms if r not in pruned_set]
        pet_list = [dict(pt) for pt in (chosen_eval.get("pet_estimates", []) or [])]

        single_slot_mode = (
            conservation_enabled
            and not guest_mode_enabled
            and house_occupant_count == 1
            and len(occ_list) == 1
        )

        if occ_list:
            seen_occ_keys: set[str] = set()
            for idx_occ, occ in enumerate(occ_list):
                raw_label = str(occ.get("occupant_label") or "Occupant").strip()
                occ_key = raw_label
                if occ_key in seen_occ_keys:
                    occ_key = f"{raw_label} #{idx_occ + 1}"
                seen_occ_keys.add(occ_key)
                slot_key = "__primary_occupant__" if single_slot_mode else occ_key

                curr_room = str(occ["room"])
                curr_sub = str(occ.get("subregion") or curr_room)
                curr_floor = str(occ.get("floor") or "main")
                prev_info = (
                    {
                        "room": last_primary_room,
                        "subregion": last_primary_subregion,
                        "floor": last_primary_floor,
                        "x": last_primary_x,
                        "y": last_primary_y,
                    }
                    if single_slot_mode and last_primary_room is not None
                    else last_occupant_loc.get(occ_key)
                )
                if idx_occ == 0:
                    prev_room = prev_info["room"] if prev_info else last_primary_room
                    prev_sub = prev_info["subregion"] if prev_info else last_primary_subregion
                    prev_floor = prev_info["floor"] if prev_info else last_primary_floor
                    prev_x = prev_info["x"] if prev_info else last_primary_x
                    prev_y = prev_info["y"] if prev_info else last_primary_y
                else:
                    prev_room = prev_info["room"] if prev_info else None
                    prev_sub = prev_info["subregion"] if prev_info else None
                    prev_floor = prev_info["floor"] if prev_info else None
                    prev_x = prev_info["x"] if prev_info else None
                    prev_y = prev_info["y"] if prev_info else None

                active_rooms_rec = {str(o["room"]) for o in occ_list}
                prev_ts_rec = (
                    prev_info.get("ts")
                    if prev_info
                    else (last_primary_ts_rec if idx_occ == 0 else None)
                )
                elapsed_rec = (ts - float(prev_ts_rec)) if prev_ts_rec is not None else None
                if not _is_plausible_floor_transition(
                    prev_room,
                    prev_floor,
                    curr_room,
                    curr_floor,
                    active_rooms_now=active_rooms_rec,
                    adj_pairs=adj_pairs_rec,
                    elapsed_sec=elapsed_rec,
                ):
                    prev_room = None
                    prev_sub = None
                    prev_floor = None
                    prev_x = None
                    prev_y = None

                if curr_room != prev_room or curr_sub != prev_sub:
                    if prev_room and prev_room != curr_room:
                        current_leg_by_slot[slot_key] = (prev_room, prev_floor)
                    elif prev_room is None:
                        current_leg_by_slot[slot_key] = (None, None)
                    transitions.append(
                        {
                            "ts": ts,
                            "iso": iso_str,
                            "from_room": prev_room,
                            "to_room": curr_room,
                            "from_floor": prev_floor,
                            "to_floor": curr_floor,
                            "from_x": prev_x,
                            "from_y": prev_y,
                            "floor": curr_floor,
                            "x": occ["x"],
                            "y": occ["y"],
                            "subregion": curr_sub,
                            "method": occ["method"],
                            "explanation": occ["explanation"],
                            "positive_drivers": occ["positive_drivers"],
                            "negative_space_evidence": occ["negative_exclusions"],
                            "occupant_key": occ_key,
                            "occupant_label": raw_label,
                            "occupant_type": str(occ.get("occupant_type") or "human"),
                            "detected_people": list(occ.get("detected_people") or []),
                            "detected_animals": list(occ.get("detected_animals") or []),
                        }
                    )
                    last_occupant_loc[occ_key] = {
                        "room": curr_room,
                        "subregion": curr_sub,
                        "floor": curr_floor,
                        "x": occ["x"],
                        "y": occ["y"],
                        "ts": ts,
                    }
                    if idx_occ == 0:
                        last_primary_room = curr_room
                        last_primary_subregion = curr_sub
                        last_primary_floor = curr_floor
                        last_primary_x = occ["x"]
                        last_primary_y = occ["y"]
                        last_primary_ts_rec = ts

                leg_from_room, leg_from_floor = current_leg_by_slot.get(slot_key, (None, None))
                if leg_from_room and leg_from_room != curr_room:
                    occ["from_room"] = leg_from_room
                    occ["from_floor"] = leg_from_floor

        for pet in pet_list:
            pet_label = str(pet.get("occupant_label") or "Riley (Dog)")
            pet_room = str(pet.get("room") or "")
            if not pet_room:
                continue
            prev_pet = last_occupant_loc.get(pet_label)
            if not prev_pet or prev_pet["room"] != pet_room:
                if prev_pet and prev_pet["room"] != pet_room:
                    current_leg_by_slot[pet_label] = (prev_pet["room"], prev_pet["floor"])
                else:
                    current_leg_by_slot[pet_label] = (None, None)
                transitions.append(
                    {
                        "ts": ts,
                        "iso": iso_str,
                        "from_room": prev_pet["room"] if prev_pet else None,
                        "to_room": pet_room,
                        "from_floor": prev_pet["floor"] if prev_pet else None,
                        "to_floor": str(pet.get("floor") or "main"),
                        "from_x": prev_pet["x"] if prev_pet else None,
                        "from_y": prev_pet["y"] if prev_pet else None,
                        "floor": str(pet.get("floor") or "main"),
                        "x": pet.get("x"),
                        "y": pet.get("y"),
                        "subregion": pet_room,
                        "method": "pet",
                        "explanation": f"{pet_label} detected in {pet_room}.",
                        "positive_drivers": list(pet.get("dog_entities") or []),
                        "negative_space_evidence": [],
                        "occupant_key": pet_label,
                        "occupant_label": pet_label,
                        "occupant_type": "pet",
                        "detected_people": [],
                        "detected_animals": [pet_label],
                    }
                )
                last_occupant_loc[pet_label] = {
                    "room": pet_room,
                    "subregion": pet_room,
                    "floor": str(pet.get("floor") or "main"),
                    "x": pet.get("x"),
                    "y": pet.get("y"),
                }
            pet_leg_room, pet_leg_floor = current_leg_by_slot.get(pet_label, (None, None))
            if pet_leg_room and pet_leg_room != pet_room:
                pet["from_room"] = pet_leg_room
                pet["from_floor"] = pet_leg_floor

        frames.append(
            {
                "ts": ts,
                "iso": iso_str,
                "occupant_estimates": occ_list,
                "pet_estimates": pet_list,
                "active_rooms": chosen_active_rooms,
                "active_rooms_with_negative_space": active_rooms_on,
                "active_rooms_baseline": active_rooms_off,
                "pruned_inferred_rooms": pruned_inferred_rooms,
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
        "source": "sensor_reconstruction",
        "negative_space_enabled": negative_space_enabled,
        "house_occupant_count": house_occupant_count,
        "house_occupancy_mode": house_occupancy_mode,
        "conservation_enabled": conservation_enabled,
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
