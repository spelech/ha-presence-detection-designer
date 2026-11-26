"""Chronological whole-house spatial timeline reconstruction engine."""

from __future__ import annotations

import inspect
from collections.abc import Callable
from datetime import UTC, datetime
from typing import Any

from .spatial_catalog import (
    BLIND_POCKET_DEFINITIONS,
    ROOM_DOG_OCCUPANCY_ENTITIES,
    SECONDARY_BLE_TRACKER_ENTITIES,
    STEVE_DEFINITIVE_BLE_ENTITIES,
    _normalize_ble_area_to_room,
)
from .spatial_topology import compile_floorplan_topology, get_default_floorplan

_GENERIC_HUMAN_LABELS = frozenset(
    {"", "Occupant", "Guest / Untracked Occupant", "Margot / Untracked Occupant"}
)

_MIN_NON_ADJACENT_FLOOR_TRANSIT_SEC = 10.0


def _build_room_adjacency_pairs(
    fp: dict[str, Any],
    room_configs: dict[str, dict[str, Any]] | None,
) -> set[tuple[str, str]]:
    """Build undirected connected room pairs from floorplan connections and room configs."""
    pairs: set[tuple[str, str]] = set()
    for conn in fp.get("connections") or []:
        if not isinstance(conn, dict):
            continue
        a = str(conn.get("from_room") or conn.get("from") or "").strip()
        b = str(conn.get("to_room") or conn.get("to") or "").strip()
        if a and b and a != b:
            pairs.add((a, b))
            pairs.add((b, a))
    for cfg in (room_configs or {}).values():
        if not isinstance(cfg, dict):
            continue
        src = str(cfg.get("room_name") or "").strip()
        for dst in cfg.get("connected_rooms") or []:
            dst_s = str(dst).strip()
            if src and dst_s and src != dst_s:
                pairs.add((src, dst_s))
                pairs.add((dst_s, src))
    return pairs


def _is_plausible_floor_transition(
    prev_room: str | None,
    prev_floor: str | None,
    curr_room: str,
    curr_floor: str,
    *,
    active_rooms_now: set[str],
    adj_pairs: set[tuple[str, str]],
    elapsed_sec: float | None,
) -> bool:
    """Return False when a cross-floor jump is a simultaneous multi-room activation or vertical BLE bleed."""
    if not prev_room or not prev_floor or prev_floor == curr_floor:
        return True
    # If the previous room on another floor is STILL occupied, treat as a separate occupant arrival
    if prev_room in active_rooms_now:
        return False
    # Direct stair/portal connection across floors is always plausible
    if (prev_room, curr_room) in adj_pairs:
        return True
    # Non-adjacent cross-floor jumps faster than stair transit time are suppressed
    if elapsed_sec is not None and elapsed_sec < _MIN_NON_ADJACENT_FLOOR_TRANSIT_SEC:
        return False
    return True


def _consolidate_frame_occupants(
    raw_occ_list: list[dict[str, Any]],
    telemetry_ble_by_room: dict[str, list[str]],
    recent_positive_ts: dict[str, float],
    house_occupant_count: int | None,
    conservation_enabled: bool,
    guest_mode_enabled: bool,
) -> tuple[list[dict[str, Any]], list[str]]:
    """Enforce BLE telemetry identity hints and prune stale inferred holds."""
    occ_list = [dict(o) for o in (raw_occ_list or [])]
    steve_pinned = any(str(o.get("occupant_label") or "") == "Steve" for o in occ_list)

    for o in occ_list:
        r_name = str(o.get("room") or "")
        r_ble = telemetry_ble_by_room.get(r_name) or []
        lbl = str(o.get("occupant_label") or "").strip()
        if (
            not steve_pinned
            and lbl in _GENERIC_HUMAN_LABELS
            and any(eid in STEVE_DEFINITIVE_BLE_ENTITIES for eid in r_ble)
        ):
            o["occupant_label"] = "Steve"
            o["occupant_type"] = "tracked_human"
            o["detected_people"] = ["Steve"]
            o["definitive_tracker_pinned"] = True
            steve_pinned = True
        elif lbl in _GENERIC_HUMAN_LABELS and any(
            eid in SECONDARY_BLE_TRACKER_ENTITIES for eid in r_ble
        ):
            o["occupant_label"] = "Margot"
            o["occupant_type"] = "untracked_human"
            o["detected_people"] = ["Margot"]

    pruned_inferred_rooms: list[str] = []
    if conservation_enabled and not guest_mode_enabled and house_occupant_count is not None:
        confirmed = [o for o in occ_list if str(o.get("method", "")) != "negative_space"]
        inferred = [o for o in occ_list if str(o.get("method", "")) == "negative_space"]
        cap = max(0, int(house_occupant_count))
        inferred_budget = max(0, cap - len(confirmed))
        if len(inferred) > inferred_budget:
            inferred.sort(
                key=lambda o: (
                    float(recent_positive_ts.get(str(o.get("room") or ""), 0.0)),
                    float(o.get("confidence") or 0.0),
                ),
                reverse=True,
            )
            kept_inferred = inferred[:inferred_budget]
            dropped = inferred[inferred_budget:]
            pruned_inferred_rooms = [str(o.get("room") or "") for o in dropped if o.get("room")]
            occ_list = confirmed + kept_inferred

    return occ_list, pruned_inferred_rooms


def _extract_drivers_from_entity_states(
    room_name: str, entity_states: dict[str, Any]
) -> tuple[list[str], str | None, bool]:
    """Derive active positive drivers, BLE identity label, and pet detection from logged entity states."""
    drivers: list[str] = []
    dog_entities = set(ROOM_DOG_OCCUPANCY_ENTITIES.get(room_name, ()))
    pet_on = False
    identity: str | None = None

    for eid, raw_val in (entity_states or {}).items():
        s_eid = str(eid)
        val_str = str(raw_val or "").strip()
        val_lower = val_str.lower()
        if s_eid in STEVE_DEFINITIVE_BLE_ENTITIES:
            if _normalize_ble_area_to_room(val_str) == room_name:
                identity = "Steve"
                drivers.append(s_eid)
            continue
        if s_eid in SECONDARY_BLE_TRACKER_ENTITIES:
            if _normalize_ble_area_to_room(val_str) == room_name and identity is None:
                identity = "Margot"
                drivers.append(s_eid)
            continue
        if s_eid in dog_entities:
            if val_lower == "on":
                pet_on = True
            continue
        if val_lower in ("on", "playing", "open", "home"):
            drivers.append(s_eid)

    if identity is None and room_name == "Margot's Room":
        identity = "Margot"
    return sorted(set(drivers)), identity, pet_on


def _reconstruct_from_component_logs(
    fp: dict[str, Any],
    room_configs: dict[str, dict[str, Any]] | None,
    coordinator_timelines: dict[str, list[dict[str, Any]]],
    start_ts: float,
    end_ts: float,
    negative_space_enabled: bool,
    min_step_sec: float,
    max_frames: int,
    house_occupant_count: int | None,
    house_occupancy_mode: str | None = None,
) -> dict[str, Any]:
    """Reconstruct playback directly from recorded RoomPresenceCoordinator timeline logs."""
    fp_rooms = {
        str(r.get("name")): r
        for r in (fp.get("rooms") or [])
        if isinstance(r, dict) and r.get("name")
    }
    cfgs = room_configs or {}
    events_by_room: dict[str, list[dict[str, Any]]] = {}
    for eid, evs in (coordinator_timelines or {}).items():
        if not evs:
            continue
        r_name = str((cfgs.get(eid) or {}).get("room_name") or eid)
        sorted_evs = sorted(
            (dict(ev) for ev in evs if isinstance(ev, dict) and ev.get("ts") is not None),
            key=lambda x: float(x["ts"]),
        )
        if sorted_evs:
            events_by_room.setdefault(r_name, []).extend(sorted_evs)

    for evs in events_by_room.values():
        evs.sort(key=lambda x: float(x["ts"]))

    # Seed initial state at start_ts from latest event <= start_ts, collect transition timestamps
    cur_state: dict[str, dict[str, Any]] = {}
    in_window_events: list[tuple[float, str, dict[str, Any]]] = []
    earliest_window_ts: float | None = None

    for r_name, evs in events_by_room.items():
        for ev in evs:
            ev_ts = float(ev["ts"])
            if ev_ts <= start_ts:
                cur_state[r_name] = ev
            elif ev_ts <= end_ts:
                in_window_events.append((ev_ts, r_name, ev))
                if earliest_window_ts is None or ev_ts < earliest_window_ts:
                    earliest_window_ts = ev_ts

    in_window_events.sort(key=lambda item: item[0])

    effective_start = start_ts
    if not cur_state and earliest_window_ts is not None and earliest_window_ts > start_ts:
        effective_start = earliest_window_ts

    # Identify exact timestamps where room occupancy/state/pet or BLE room mapping changed
    sim_state = dict(cur_state)

    def _sig_for(r_name: str, ev: dict[str, Any] | None) -> tuple[Any, ...]:
        if not ev:
            return (False, "vacant", False, None)
        _drv, ident, pet_on = _extract_drivers_from_entity_states(
            r_name, ev.get("entity_states") or {}
        )
        return (
            bool(ev.get("is_present", False)),
            str(ev.get("occupancy_state", "vacant")),
            bool(ev.get("pet_present") or pet_on),
            ident,
        )

    last_sig = {r_name: _sig_for(r_name, ev) for r_name, ev in sim_state.items()}
    change_timestamps: set[float] = {float(effective_start), float(end_ts)}

    for ev_ts, r_name, ev in in_window_events:
        sig = _sig_for(r_name, ev)
        if sig != last_sig.get(r_name):
            change_timestamps.add(ev_ts)
            last_sig[r_name] = sig

    sorted_ts = sorted(ts for ts in change_timestamps if effective_start <= ts <= end_ts)
    if not sorted_ts:
        sorted_ts = [float(effective_start), float(end_ts)]

    if len(sorted_ts) > max_frames:
        coalesced: list[float] = []
        for ts in sorted_ts:
            if not coalesced or (ts - coalesced[-1]) >= min_step_sec or ts == sorted_ts[-1]:
                coalesced.append(ts)
        if len(coalesced) > max_frames:
            stride = max(1, len(coalesced) // max_frames)
            sampled = coalesced[::stride]
            if sampled[-1] != coalesced[-1]:
                sampled.append(coalesced[-1])
            sorted_ts = sampled
        else:
            sorted_ts = coalesced

    # Walk chronologically across selected timestamps
    pointers = {r_name: 0 for r_name in events_by_room}
    live_ev: dict[str, dict[str, Any]] = {}
    for r_name, evs in events_by_room.items():
        idx = 0
        while idx < len(evs) and float(evs[idx]["ts"]) <= sorted_ts[0]:
            live_ev[r_name] = evs[idx]
            idx += 1
        pointers[r_name] = idx

    frames: list[dict[str, Any]] = []
    transitions: list[dict[str, Any]] = []
    last_primary_room: str | None = None
    last_primary_floor: str | None = None
    adj_pairs = _build_room_adjacency_pairs(fp, cfgs)
    last_primary_ts: float | None = None
    last_occupant_loc: dict[str, dict[str, Any]] = {}
    current_leg_by_slot: dict[str, tuple[str | None, str | None]] = {}
    per_room_on_frames: dict[str, int] = {}
    per_room_off_frames: dict[str, int] = {}
    inferred_hold_frames_count = 0

    for ts in sorted_ts:
        for r_name, evs in events_by_room.items():
            idx = pointers[r_name]
            while idx < len(evs) and float(evs[idx]["ts"]) <= ts:
                live_ev[r_name] = evs[idx]
                idx += 1
            pointers[r_name] = idx

        iso_str = datetime.fromtimestamp(ts, tz=UTC).isoformat()
        occ_list: list[dict[str, Any]] = []
        pet_list: list[dict[str, Any]] = []
        active_with_inferred: list[str] = []
        active_confirmed_only: list[str] = []
        active_positive_sensors: list[str] = []
        latest_logged_count: int | None = None
        latest_logged_mode: str | None = None
        latest_logged_ts = -1.0

        for r_name, ev in sorted(live_ev.items()):
            ev_ts = float(ev.get("ts") or 0.0)
            if (
                ev.get("house_occupant_count") is not None
                or ev.get("house_occupancy_mode") is not None
            ) and ev_ts >= latest_logged_ts:
                latest_logged_ts = ev_ts
                if ev.get("house_occupant_count") is not None:
                    latest_logged_count = int(ev["house_occupant_count"])
                if ev.get("house_occupancy_mode"):
                    latest_logged_mode = str(ev["house_occupancy_mode"])

            box = fp_rooms.get(r_name, {})
            fl_id = str(box.get("floor", "main"))
            rx = round(float(box.get("x", 100.0)) + float(box.get("width", 100.0)) / 2.0, 1)
            ry = round(float(box.get("y", 100.0)) + float(box.get("height", 100.0)) / 2.0, 1)

            entity_states = ev.get("entity_states") or {}
            drivers, ident, pet_on = _extract_drivers_from_entity_states(r_name, entity_states)
            logged_drivers = list(ev.get("positive_drivers") or [])
            if logged_drivers:
                drivers = logged_drivers

            if bool(ev.get("pet_present")) or pet_on:
                pet_list.append(
                    {
                        "room": r_name,
                        "floor": fl_id,
                        "x": rx,
                        "y": ry,
                        "occupant_type": "pet",
                        "occupant_label": "Riley (Dog)",
                        "detected_animals": ["Riley (Dog)"],
                        "human_present": bool(ev.get("is_present", False)),
                        "pet_present": True,
                        "dog_entities": [
                            eid
                            for eid in ROOM_DOG_OCCUPANCY_ENTITIES.get(r_name, ())
                            if str(entity_states.get(eid, "")).lower() == "on"
                        ],
                    }
                )

            if not bool(ev.get("is_present", False)):
                continue

            occ_state = str(ev.get("occupancy_state") or "occupied_confirmed").lower()
            prob_pct = float(ev.get("probability_pct") or 0.0)
            verified_by = str(ev.get("verified_by") or "").lower()
            camera_confirmed = bool(ev.get("camera_confirmed")) or verified_by == "camera"
            is_confirmed = occ_state == "occupied_confirmed" or camera_confirmed
            method = "positive" if is_confirmed else "negative_space"

            active_with_inferred.append(r_name)
            per_room_on_frames[r_name] = per_room_on_frames.get(r_name, 0) + 1
            if is_confirmed:
                active_confirmed_only.append(r_name)
                per_room_off_frames[r_name] = per_room_off_frames.get(r_name, 0) + 1
            else:
                inferred_hold_frames_count += 1

            if not negative_space_enabled and not is_confirmed:
                continue

            for drv in drivers:
                if drv not in active_positive_sensors:
                    active_positive_sensors.append(drv)

            occ_label = ident or "Occupant"
            occ_type = (
                "tracked_human"
                if occ_label == "Steve"
                else ("untracked_human" if occ_label == "Margot" else "human")
            )
            reason = str(ev.get("reason") or "").strip()
            subregion = str(ev.get("inferred_subregion") or r_name)
            explanation = reason or (f"Bayesian {prob_pct:.1f}% ({occ_state.replace('_', ' ')})")

            occ_list.append(
                {
                    "room": r_name,
                    "floor": fl_id,
                    "x": rx,
                    "y": ry,
                    "subregion": subregion,
                    "human_present": True,
                    "pet_present": bool(ev.get("pet_present") or pet_on),
                    "detected_people": [occ_label],
                    "detected_animals": ["Riley (Dog)"]
                    if (ev.get("pet_present") or pet_on)
                    else [],
                    "occupant_type": occ_type,
                    "occupant_label": occ_label,
                    "confidence": round(min(1.0, max(0.0, prob_pct / 100.0)), 2),
                    "probability_pct": round(prob_pct, 1),
                    "occupancy_state": occ_state,
                    "verified_by": verified_by or ("camera" if camera_confirmed else "bayesian"),
                    "method": method,
                    "positive_drivers": drivers,
                    "negative_exclusions": list(ev.get("negative_exclusions") or []),
                    "last_handoff_room": ev.get("last_handoff_room"),
                    "explanation": explanation,
                    "_ev_ts": ev_ts,
                }
            )

        # Sort newest-activated room first for primary continuity
        occ_list.sort(
            key=lambda o: (
                1 if o["method"] == "positive" else 0,
                float(o.get("_ev_ts") or 0.0),
                float(o.get("probability_pct") or 0.0),
            ),
            reverse=True,
        )

        active_rooms_now = {str(o["room"]) for o in occ_list}
        seen_occ_keys: set[str] = set()
        for idx_occ, occ in enumerate(occ_list):
            occ.pop("_ev_ts", None)
            raw_label = str(occ.get("occupant_label") or "Occupant").strip()
            occ_key = raw_label
            if occ_key in seen_occ_keys:
                occ_key = f"{raw_label} #{idx_occ + 1}"
            seen_occ_keys.add(occ_key)

            curr_room = str(occ["room"])
            curr_floor = str(occ.get("floor") or "main")
            prev_info = last_occupant_loc.get(occ_key)
            if idx_occ == 0:
                prev_room = prev_info["room"] if prev_info else last_primary_room
                prev_floor = prev_info["floor"] if prev_info else last_primary_floor
                prev_x = prev_info["x"] if prev_info else None
                prev_y = prev_info["y"] if prev_info else None
                prev_ts = prev_info.get("ts") if prev_info else last_primary_ts
            else:
                prev_room = prev_info["room"] if prev_info else None
                prev_floor = prev_info["floor"] if prev_info else None
                prev_x = prev_info["x"] if prev_info else None
                prev_y = prev_info["y"] if prev_info else None
                prev_ts = prev_info.get("ts") if prev_info else None

            if not prev_room and occ.get("last_handoff_room"):
                prev_room = str(occ["last_handoff_room"])
                prev_floor = str((fp_rooms.get(prev_room) or {}).get("floor") or curr_floor)

            elapsed_sec = (ts - float(prev_ts)) if prev_ts is not None else None
            if not _is_plausible_floor_transition(
                prev_room,
                prev_floor,
                curr_room,
                curr_floor,
                active_rooms_now=active_rooms_now,
                adj_pairs=adj_pairs,
                elapsed_sec=elapsed_sec,
            ):
                prev_room = None
                prev_floor = None
                prev_x = None
                prev_y = None

            if curr_room != prev_room:
                if prev_room:
                    current_leg_by_slot[occ_key] = (prev_room, prev_floor)
                else:
                    current_leg_by_slot[occ_key] = (None, None)
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
                        "subregion": occ["subregion"],
                        "method": occ["method"],
                        "occupancy_state": occ["occupancy_state"],
                        "probability_pct": occ["probability_pct"],
                        "verified_by": occ["verified_by"],
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
                    "floor": curr_floor,
                    "x": occ["x"],
                    "y": occ["y"],
                    "ts": ts,
                }
                if idx_occ == 0:
                    last_primary_room = curr_room
                    last_primary_floor = curr_floor
                    last_primary_ts = ts

            leg_room, leg_floor = current_leg_by_slot.get(occ_key, (None, None))
            if leg_room and leg_room != curr_room:
                occ["from_room"] = leg_room
                occ["from_floor"] = leg_floor

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
                    "floor": str(pet.get("floor") or "main"),
                    "x": pet.get("x"),
                    "y": pet.get("y"),
                }
            pet_leg_room, pet_leg_floor = current_leg_by_slot.get(pet_label, (None, None))
            if pet_leg_room and pet_leg_room != pet_room:
                pet["from_room"] = pet_leg_room
                pet["from_floor"] = pet_leg_floor

        chosen_active = active_with_inferred if negative_space_enabled else active_confirmed_only
        frame_house_count = (
            latest_logged_count if latest_logged_count is not None else house_occupant_count
        )
        frame_house_mode = latest_logged_mode or house_occupancy_mode
        if not frame_house_mode:
            if not occ_list and pet_list:
                frame_house_mode = "pet_only"
            elif frame_house_count is not None:
                frame_house_mode = (
                    "vacant"
                    if frame_house_count <= 0
                    else ("guest" if frame_house_count >= 2 else "occupied")
                )
            else:
                frame_house_mode = "occupied" if occ_list else "vacant"
        frames.append(
            {
                "ts": ts,
                "iso": iso_str,
                "house_occupant_count": frame_house_count,
                "house_occupancy_mode": frame_house_mode,
                "occupant_estimates": occ_list,
                "pet_estimates": pet_list,
                "active_rooms": sorted(chosen_active),
                "active_rooms_with_negative_space": sorted(active_with_inferred),
                "active_rooms_baseline": sorted(active_confirmed_only),
                "active_positive_sensors": active_positive_sensors,
                "active_negative_exclusions": [],
                "active_shade_exclusions": [],
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
        "source": "component_logs",
        "negative_space_enabled": negative_space_enabled,
        "house_occupant_count": house_occupant_count,
        "house_occupancy_mode": house_occupancy_mode,
        "start_ts": float(sorted_ts[0]),
        "end_ts": float(sorted_ts[-1]),
        "frame_count": len(frames),
        "frames": frames,
        "transitions": transitions,
        "comparison_summary": {
            "blind_pocket_holds_count": inferred_hold_frames_count,
            "uncovered_subregion_localizations": 0,
            "shade_sunlight_exclusions_count": 0,
            "per_room_delta": per_room_delta,
        },
    }


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
