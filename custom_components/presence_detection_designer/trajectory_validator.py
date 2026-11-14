"""Topological Trajectory & Path Corroboration Engine for Room Presence Transitions.

Enforces physical reality constraints on occupancy transitions:
1. High-Confidence Source Preservation:
   If an occupant is localized with high confidence in Room A (Frigate visual detection,
   confirmed camera detection, bed sensor, or workstation load), a non-adjacent Room B cannot suddenly
   become occupied without an unbroken physical trajectory.
2. Topological Path Corroboration with Branching:
   Discovers all simple paths between currently occupied rooms and candidate room B.
   Verifies that intermediate connecting spaces (hallways, stairs, doorways) had recent
   corroborating activity within a realistic transit window (default 90s).
3. Candidate Settling & Debounce:
   Distinguishes immediate high-confidence transitions from unverified transient triggers,
   preventing fleeting sensor pulses from triggering premature transitions or ping-ponging
   adjacent room clearings.
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from typing import Any

from .const import (
    DATA_STORE,
    DEFAULT_TRANSIT_WINDOW_SEC,
    DOMAIN,
    OccupancyState,
)
from .coordinator_helpers import (
    async_send_coordinator_test_notification,
    resolve_global_llm_defaults,
)
from .floorplan_presets import get_default_floorplan

__all__ = [
    "CorroborationResult",
    "_TOPOLOGY_CACHE",
    "async_send_coordinator_test_notification",
    "build_topology_graph",
    "check_coordinator_trajectory",
    "clear_topology_cache",
    "corroborate_transition_trajectory",
    "find_all_simple_paths",
    "get_all_room_coordinators",
    "get_topology_and_paths",
    "is_room_high_confidence",
    "is_trigger_high_confidence",
    "resolve_corroborating_activity_map",
    "resolve_global_llm_defaults",
    "should_defer_for_settling",
]

_LOGGER = logging.getLogger(__name__)

DEFAULT_SETTLING_WINDOW_SEC = 2.0


@dataclass
class CorroborationResult:
    """Result of topological path corroboration between active rooms and candidate room."""

    is_valid: bool
    is_adjacent: bool = False
    corroborated_path: list[str] | None = None
    all_candidate_paths: list[list[str]] = field(default_factory=list)
    source_room: str | None = None
    reason: str = ""


_TOPOLOGY_CACHE: dict[str, tuple[dict[str, set[str]], dict[tuple[str, str], list[list[str]]]]] = {}


def clear_topology_cache() -> None:
    """Clear cached topology graphs and precomputed paths."""
    _TOPOLOGY_CACHE.clear()


def _get_floorplan_cache_key(floorplan: dict[str, Any] | None) -> str:
    """Derive a stable cache key for a floorplan."""
    if not floorplan or not isinstance(floorplan, dict):
        return "__default__"
    conns = tuple(
        sorted(
            (str(c.get("from_room", "")), str(c.get("to_room", "")))
            for c in (floorplan.get("connections") or [])
        )
    )
    rooms = tuple(sorted(str(r.get("name", "")) for r in (floorplan.get("rooms") or [])))
    return f"{hash(conns)}_{hash(rooms)}"


def build_topology_graph(floorplan: dict[str, Any] | None = None) -> dict[str, set[str]]:
    """Build an undirected adjacency graph from floorplan connections."""
    fp = (
        floorplan
        if isinstance(floorplan, dict) and floorplan.get("rooms")
        else get_default_floorplan()
    )
    connections = fp.get("connections", []) or []
    rooms = fp.get("rooms", []) or []

    graph: dict[str, set[str]] = {str(r.get("name")): set() for r in rooms if r.get("name")}

    for conn in connections:
        a = str(conn.get("from_room", ""))
        b = str(conn.get("to_room", ""))
        if a and b:
            graph.setdefault(a, set()).add(b)
            graph.setdefault(b, set()).add(a)

    return graph


def find_all_simple_paths(
    graph: dict[str, set[str]],
    start: str,
    goal: str,
    max_depth: int = 5,
) -> list[list[str]]:
    """Find all simple paths between start and goal up to max_depth hops."""
    if start == goal or start not in graph or goal not in graph:
        return []

    results: list[list[str]] = []
    queue: list[list[str]] = [[start]]

    while queue:
        path = queue.pop(0)
        curr = path[-1]

        if curr == goal:
            results.append(path)
            continue

        if len(path) > max_depth:
            continue

        for neighbor in sorted(graph.get(curr, set())):
            if neighbor not in path:
                queue.append([*path, neighbor])

    results.sort(key=len)
    return results


def get_topology_and_paths(
    floorplan: dict[str, Any] | None = None,
    max_depth: int = 5,
) -> tuple[dict[str, set[str]], dict[tuple[str, str], list[list[str]]]]:
    """Retrieve or build-once the topology graph and all precomputed room paths."""
    cache_key = _get_floorplan_cache_key(floorplan)
    cached = _TOPOLOGY_CACHE.get(cache_key)
    if cached is not None:
        return cached

    graph = build_topology_graph(floorplan)
    paths: dict[tuple[str, str], list[list[str]]] = {}
    room_names = list(graph.keys())
    for i, start in enumerate(room_names):
        for goal in room_names[i + 1 :]:
            fwd = find_all_simple_paths(graph, start, goal, max_depth=max_depth)
            paths[(start, goal)] = fwd
            paths[(goal, start)] = [list(reversed(p)) for p in fwd]

    _TOPOLOGY_CACHE[cache_key] = (graph, paths)
    return graph, paths


def is_room_high_confidence(coord: Any) -> bool:
    """Determine if a room is occupied with high confidence.

    High confidence criteria:
    - Frigate camera visual detection of human (subzone or whole-frame person active)
    - Confirmed hold state (sustained occupancy evidence active)
    - Bed occupancy / workstation load (>190W) / Steve definitive BLE pinned
    - Bayesian probability >= 0.80 with active observations
    """
    if not coord or not getattr(coord, "state_machine", None):
        return False
    sm = coord.state_machine
    if not sm.is_present:
        return False

    sp = getattr(coord, "last_spatial_estimate", None)
    if isinstance(sp, dict):
        if sp.get("definitive_tracker_pinned"):
            return True
        if sp.get("human_present") and sp.get("occupant_type") in (
            "human",
            "tracked_human",
            "untracked_human",
        ):
            if sp.get("method") in ("positive", "hybrid"):
                return True
        for drv in sp.get("positive_drivers", []):
            drv_lower = str(drv).lower()
            if any(k in drv_lower for k in ("camera", "person", "subzone", "zone")):
                return True

    if getattr(sm, "active_conditions", None):
        if any(
            any(k in str(c).lower() for k in ("bed", "workstation", "desk", "sleep", "tv", "media"))
            for c in sm.active_conditions
        ):
            return True

    if getattr(sm, "bayesian_probability", 0.0) >= 0.80 and getattr(
        sm, "active_observations", None
    ):
        return True

    return False


def is_trigger_high_confidence(coord: Any, entity_id: str, is_active: bool) -> bool:
    """Determine if an incoming trigger signal is high-confidence and should settle immediately."""
    if not is_active:
        return False

    eid_lower = str(entity_id).lower()
    if any(k in eid_lower for k in ("camera", "person_occupancy", "subzone", "zone_")):
        return True

    tracker = getattr(coord, "actuation_tracker", None)
    if tracker is not None and getattr(tracker, "manual_intent", None) == "manual_on":
        return True

    sm = getattr(coord, "state_machine", None)
    if sm and sm.active_conditions:
        return True

    sp = getattr(coord, "last_spatial_estimate", None)
    if isinstance(sp, dict) and sp.get("human_present") and sp.get("method") == "positive":
        return True

    return False


def get_all_room_coordinators(hass: Any) -> list[Any]:
    """Retrieve all RoomPresenceCoordinator instances from hass.data."""
    if not hass or not hasattr(hass, "data") or not isinstance(hass.data, dict):
        return []
    domain_data = hass.data.get(DOMAIN, {})
    if not isinstance(domain_data, dict):
        return []

    from .coordinator import RoomPresenceCoordinator

    return [c for c in domain_data.values() if isinstance(c, RoomPresenceCoordinator)]


def resolve_corroborating_activity_map(
    hass: Any,
    store: Any | None = None,
    now_ts: float | None = None,
) -> dict[str, float]:
    """Extract rolling room activity timestamps across all sensors, cameras, and coordinators."""
    now = now_ts if now_ts is not None else time.time()
    activity: dict[str, float] = {}

    st = store
    if st is None and hass and hasattr(hass, "data") and isinstance(hass.data, dict):
        st = hass.data.get(DOMAIN, {}).get(DATA_STORE)

    if st is not None and hasattr(st, "_last_spatial_frame"):
        sf = getattr(st, "_last_spatial_frame", None)
        if isinstance(sf, dict):
            for r, t in (sf.get("recent_activity_ts") or {}).items():
                activity[str(r)] = float(t)
            for r, t in (sf.get("recent_positive_ts") or {}).items():
                activity[str(r)] = max(activity.get(str(r), 0.0), float(t))

    for coord in get_all_room_coordinators(hass):
        r_name = getattr(coord, "room_name", "")
        if not r_name:
            continue
        sm = getattr(coord, "state_machine", None)
        if sm:
            if getattr(coord, "_active_triggers", None) or sm.snapshot.active_triggers:
                activity[r_name] = now
            if sm.is_present and sm.state != OccupancyState.VACANT:
                activity[r_name] = max(activity.get(r_name, 0.0), now - 5.0)
            if getattr(sm, "last_cleared_time", 0.0) > 0:
                activity[r_name] = max(activity.get(r_name, 0.0), float(sm.last_cleared_time))

    return activity


def corroborate_transition_trajectory(
    candidate_room: str,
    all_coordinators: list[Any],
    recent_activity_ts: dict[str, float] | None = None,
    floorplan: dict[str, Any] | None = None,
    now_ts: float | None = None,
    transit_window_sec: float = DEFAULT_TRANSIT_WINDOW_SEC,
    guest_mode_enabled: bool = False,
) -> CorroborationResult:
    """Validate whether candidate_room can transition to occupied based on topological paths."""
    now = now_ts if now_ts is not None else time.time()
    act_ts = recent_activity_ts or {}

    if guest_mode_enabled:
        return CorroborationResult(
            is_valid=True,
            is_adjacent=False,
            source_room=None,
            reason="guest_mode_enabled_multi_occupant_unrestricted",
        )

    occupied_coords: list[Any] = [
        c
        for c in all_coordinators
        if getattr(c, "room_name", "") != candidate_room
        and getattr(c, "state_machine", None)
        and c.state_machine.is_present
    ]

    if not occupied_coords:
        return CorroborationResult(
            is_valid=True,
            is_adjacent=False,
            source_room=None,
            reason="house_vacant_initial_entry",
        )

    graph, paths_cache = get_topology_and_paths(floorplan)

    # 1. Direct Adjacency Check (1 hop)
    for c in occupied_coords:
        occ_name = getattr(c, "room_name", "")
        if candidate_room in graph.get(occ_name, set()):
            return CorroborationResult(
                is_valid=True,
                is_adjacent=True,
                corroborated_path=[occ_name, candidate_room],
                all_candidate_paths=[[occ_name, candidate_room]],
                source_room=occ_name,
                reason="direct_adjacent_transition",
            )

    # 2. Multi-hop Candidate Path Corroboration with Branching
    high_conf_occupied: list[Any] = [c for c in occupied_coords if is_room_high_confidence(c)]
    rooms_to_check = high_conf_occupied if high_conf_occupied else occupied_coords

    all_paths_found: list[list[str]] = []
    for c in rooms_to_check:
        occ_name = getattr(c, "room_name", "")
        paths = paths_cache.get((occ_name, candidate_room), [])
        all_paths_found.extend(paths)

        for path in paths:
            intermediate = path[1:-1]
            if not intermediate:
                continue

            corroborated = False
            for inter_room in intermediate:
                last_act = act_ts.get(inter_room, 0.0)
                if (now - last_act) <= transit_window_sec:
                    corroborated = True
                    break

            if corroborated:
                return CorroborationResult(
                    is_valid=True,
                    is_adjacent=False,
                    corroborated_path=path,
                    all_candidate_paths=paths,
                    source_room=occ_name,
                    reason=f"corroborated_via_{'->'.join(path)}",
                )

    high_names = [getattr(c, "room_name", "") for c in high_conf_occupied]
    if high_conf_occupied:
        return CorroborationResult(
            is_valid=False,
            is_adjacent=False,
            corroborated_path=None,
            all_candidate_paths=all_paths_found,
            source_room=high_names[0],
            reason=f"physically_impossible_jump_from_{'/'.join(high_names)}_no_path_corroboration",
        )

    return CorroborationResult(
        is_valid=False,
        is_adjacent=False,
        corroborated_path=None,
        all_candidate_paths=all_paths_found,
        source_room=getattr(occupied_coords[0], "room_name", None),
        reason="uncorroborated_distant_transition",
    )


def check_coordinator_trajectory(coord: Any, now_ts: float | None = None) -> CorroborationResult:
    """Convenience helper to corroborate trajectory for a RoomPresenceCoordinator."""
    if not coord or not coord.hass:
        return CorroborationResult(is_valid=True, reason="no_hass_context")
    if coord._is_guest_mode_active():
        return CorroborationResult(is_valid=True, reason="guest_mode_active")

    now = now_ts if now_ts is not None else time.time()
    all_coords = get_all_room_coordinators(coord.hass)
    store = coord.hass.data.get(DOMAIN, {}).get(DATA_STORE) if coord.hass else None
    fp = store.get_floorplan() if store and hasattr(store, "get_floorplan") else None
    gs = store.global_settings if store and hasattr(store, "global_settings") else {}
    transit_win = float(gs.get("transit_window_sec", DEFAULT_TRANSIT_WINDOW_SEC))
    act_map = resolve_corroborating_activity_map(coord.hass, store=store, now_ts=now)

    traj = corroborate_transition_trajectory(
        candidate_room=coord.room_name,
        all_coordinators=all_coords,
        recent_activity_ts=act_map,
        floorplan=fp,
        now_ts=now,
        transit_window_sec=transit_win,
        guest_mode_enabled=False,
    )
    if traj.corroborated_path and len(traj.corroborated_path) > 1:
        coord._last_corroborated_path = traj.corroborated_path
        coord._last_adjacent_arrival = f"Corroborated path: {' → '.join(traj.corroborated_path)}"
    return traj


def should_defer_for_settling(
    coord: Any,
    entity_id: str,
    is_active: bool,
    traj_result: CorroborationResult,
    now_ts: float,
) -> bool:
    """Return True if an unverified trigger on an unoccupied room should defer for settling."""
    if not is_active or traj_result.is_adjacent:
        return False
    if traj_result.reason == "house_vacant_initial_entry":
        return False
    if is_trigger_high_confidence(coord, entity_id, is_active):
        return False

    store = coord.hass.data.get(DOMAIN, {}).get(DATA_STORE) if coord.hass else None
    gs = store.global_settings if store and hasattr(store, "global_settings") else {}
    settle_win = float(
        coord.config.get("settling_window_sec") or gs.get("settling_window_sec", 0.0) or 0.0
    )
    if settle_win <= 0.0:
        return False

    if getattr(coord, "_settling_entity", None) == entity_id:
        coord._settling_entity = None
        return False

    coord._settling_entity = entity_id
    coord._settling_ts = now_ts
    return True
