"""Chronological whole-house spatial timeline reconstruction engine."""

from __future__ import annotations

from typing import Any

from .spatial_catalog import (
    ROOM_DOG_OCCUPANCY_ENTITIES,
    SECONDARY_BLE_TRACKER_ENTITIES,
    STEVE_DEFINITIVE_BLE_ENTITIES,
    _normalize_ble_area_to_room,
)

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
