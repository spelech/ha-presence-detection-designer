"""Multi-room Home Assistant data playback loaders (PDD storage, HA JSON, Recorder SQLite)."""

from __future__ import annotations

import datetime
import json
import sqlite3
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from .virtual_ha import VirtualHAHarness


@dataclass(frozen=True)
class PlaybackEvent:
    """Single chronological HA entity state transition."""

    ts: float
    entity_id: str
    state: str
    attributes: dict[str, Any] = field(default_factory=dict)


@dataclass
class PlaybackReport:
    """Summary of a multi-room HA history playback run."""

    source: str
    start_ts: float
    end_ts: float
    event_count: int
    rooms: dict[str, dict[str, Any]]
    transitions: list[dict[str, Any]]
    legacy_diffs: list[dict[str, Any]]
    mermaids: dict[str, str]


def _parse_iso_ts(raw: Any) -> float | None:
    if isinstance(raw, (int, float)):
        return float(raw)
    if not isinstance(raw, str) or not raw:
        return None
    try:
        dt = datetime.datetime.fromisoformat(raw.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=datetime.UTC)
        return dt.timestamp()
    except ValueError:
        return None


def load_pdd_storage_playback(
    storage_path: str | Path,
    *,
    room_filter: set[str] | None = None,
) -> tuple[list[dict[str, Any]], list[PlaybackEvent], dict[str, list[dict[str, Any]]]]:
    """Extract room configs, entity transition events, and legacy timelines from `.storage/presence_detection_designer`."""
    payload = json.loads(Path(storage_path).read_text(encoding="utf-8"))
    data = payload.get("data", payload)
    raw_rooms: dict[str, dict[str, Any]] = data.get("rooms") or {}
    raw_timelines: dict[str, list[dict[str, Any]]] = data.get("timeline") or {}

    selected_rooms: list[dict[str, Any]] = []
    legacy_by_room: dict[str, list[dict[str, Any]]] = {}
    last_seen: dict[str, str] = {}
    events_by_key: dict[tuple[float, str], PlaybackEvent] = {}

    for entry_id, cfg in raw_rooms.items():
        r_name = str(cfg.get("room_name", entry_id))
        if room_filter and r_name not in room_filter:
            continue
        room_cfg = dict(cfg)
        room_cfg["entry_id"] = entry_id
        selected_rooms.append(room_cfg)

        frames = sorted(raw_timelines.get(entry_id) or [], key=lambda f: float(f.get("ts", 0.0)))
        legacy_by_room[r_name] = frames
        for frame in frames:
            ts = float(frame.get("ts", 0.0))
            for eid, st in (frame.get("entity_states") or {}).items():
                st_str = str(st)
                if last_seen.get(eid) != st_str:
                    last_seen[eid] = st_str
                    events_by_key[(ts, eid)] = PlaybackEvent(ts=ts, entity_id=eid, state=st_str)

    events = sorted(events_by_key.values(), key=lambda e: (e.ts, e.entity_id))
    return selected_rooms, events, legacy_by_room


def load_ha_history_json(history_path: str | Path) -> list[PlaybackEvent]:
    """Load standard Home Assistant `/api/history/period` or `ha_get_history` JSON payload."""
    raw = json.loads(Path(history_path).read_text(encoding="utf-8"))
    blocks = raw if isinstance(raw, list) else raw.get("history", [])
    events: list[PlaybackEvent] = []
    for item in blocks:
        entries = item if isinstance(item, list) else [item]
        for rec in entries:
            if not isinstance(rec, dict):
                continue
            eid = str(rec.get("entity_id", "")).strip()
            ts = _parse_iso_ts(rec.get("last_changed") or rec.get("last_updated") or rec.get("ts"))
            if not eid or ts is None:
                continue
            events.append(
                PlaybackEvent(
                    ts=ts,
                    entity_id=eid,
                    state=str(rec.get("state", "unknown")),
                    attributes=dict(rec.get("attributes") or {}),
                )
            )
    events.sort(key=lambda e: (e.ts, e.entity_id))
    return events


def load_recorder_sqlite(
    db_path: str | Path,
    *,
    entity_ids: list[str] | None = None,
    start_ts: float | None = None,
    end_ts: float | None = None,
) -> list[PlaybackEvent]:
    """Read historical state transitions from a Home Assistant `home-assistant_v2.db` SQLite file."""
    con = sqlite3.connect(f"file:{Path(db_path)}?mode=ro", uri=True)
    try:
        cols = {row[1] for row in con.execute("PRAGMA table_info(states)").fetchall()}
        events: list[PlaybackEvent] = []

        if "metadata_id" in cols:
            sql = (
                "SELECT m.entity_id, s.state, s.last_updated_ts, sa.shared_attrs "
                "FROM states s "
                "JOIN states_meta m ON s.metadata_id = m.metadata_id "
                "LEFT JOIN state_attributes sa ON s.attributes_id = sa.attributes_id "
                "WHERE 1=1"
            )
            params: list[Any] = []
            if entity_ids:
                placeholders = ",".join("?" for _ in entity_ids)
                sql += f" AND m.entity_id IN ({placeholders})"
                params.extend(entity_ids)
            if start_ts is not None:
                sql += " AND s.last_updated_ts >= ?"
                params.append(float(start_ts))
            if end_ts is not None:
                sql += " AND s.last_updated_ts <= ?"
                params.append(float(end_ts))
            sql += " ORDER BY s.last_updated_ts ASC"

            for eid, st, ts_val, raw_attrs in con.execute(sql, params):
                if ts_val is None:
                    continue
                attrs = json.loads(raw_attrs) if raw_attrs else {}
                events.append(
                    PlaybackEvent(
                        ts=float(ts_val), entity_id=str(eid), state=str(st), attributes=attrs
                    )
                )
            return events

        # Legacy SQLite schema (< HA 2023.4)
        sql = "SELECT entity_id, state, last_updated, attributes FROM states WHERE 1=1"
        params = []
        if entity_ids:
            placeholders = ",".join("?" for _ in entity_ids)
            sql += f" AND entity_id IN ({placeholders})"
            params.extend(entity_ids)
        sql += " ORDER BY last_updated ASC"
        for eid, st, lu, raw_attrs in con.execute(sql, params):
            ts_val = _parse_iso_ts(lu)
            if ts_val is None:
                continue
            if start_ts is not None and ts_val < start_ts:
                continue
            if end_ts is not None and ts_val > end_ts:
                continue
            attrs = json.loads(raw_attrs) if raw_attrs else {}
            events.append(
                PlaybackEvent(ts=ts_val, entity_id=str(eid), state=str(st), attributes=attrs)
            )
        return events
    finally:
        con.close()


async def playback_ha_history(
    *,
    room_configs: list[dict[str, Any]],
    events: list[PlaybackEvent],
    source_label: str = "ha_playback",
    legacy_timelines: dict[str, list[dict[str, Any]]] | None = None,
    tail_advance_sec: float = 0.0,
) -> PlaybackReport:
    """Replay chronological Home Assistant events through real multi-room PDD coordinators."""
    ordered = sorted(events, key=lambda e: (e.ts, e.entity_id))
    start_ts = ordered[0].ts if ordered else 1794657600.0
    end_ts = ordered[-1].ts + max(0.0, tail_advance_sec) if ordered else start_ts

    with tempfile.TemporaryDirectory() as tmp_dir:
        with VirtualHAHarness(storage_dir=Path(tmp_dir), start_ts=start_ts) as harness:
            await harness.async_add_rooms(room_configs)

            for ev in ordered:
                if ev.ts > harness.clock.now():
                    harness.advance(ev.ts - harness.clock.now())
                harness.set_state(ev.entity_id, ev.state, attributes=ev.attributes)

            if tail_advance_sec > 0.0:
                harness.advance(tail_advance_sec)

            legacy_diffs: list[dict[str, Any]] = []
            if legacy_timelines:
                for room_name, frames in legacy_timelines.items():
                    if not frames or room_name not in harness.coordinators:
                        continue
                    last_legacy = frames[-1]
                    now_snap = harness.room_snapshot(room_name)
                    if bool(last_legacy.get("is_present")) != bool(now_snap["is_on"]):
                        legacy_diffs.append(
                            {
                                "room": room_name,
                                "legacy_is_present": bool(last_legacy.get("is_present")),
                                "legacy_box_state": last_legacy.get("box_state"),
                                "new_is_present": bool(now_snap["is_on"]),
                                "new_occupancy_state": now_snap["occupancy_state"],
                            }
                        )

            return PlaybackReport(
                source=source_label,
                start_ts=start_ts,
                end_ts=end_ts,
                event_count=len(ordered),
                rooms={r: harness.room_snapshot(r) for r in harness.coordinators},
                transitions=harness.all_room_transitions(),
                legacy_diffs=legacy_diffs,
                mermaids={
                    r: c.state_machine.get_mermaid_diagram()
                    for r, c in harness.coordinators.items()
                },
            )
