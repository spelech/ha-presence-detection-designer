"""Component-log based chronological timeline reconstruction."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from ..spatial.spatial_catalog import (
    ROOM_DOG_OCCUPANCY_ENTITIES,
)
from .timeline_models import (
    _build_room_adjacency_pairs,
    _extract_drivers_from_entity_states,
    _is_plausible_floor_transition,
)


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
                        "occupant_label": "Household Pet (Dog)",
                        "detected_animals": ["Household Pet (Dog)"],
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
                if occ_label == "Resident A"
                else ("untracked_human" if occ_label == "Resident B" else "human")
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
                    "detected_animals": ["Household Pet (Dog)"]
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
            pet_label = str(pet.get("occupant_label") or "Household Pet (Dog)")
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
