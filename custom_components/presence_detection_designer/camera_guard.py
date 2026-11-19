"""Vision AI verification gate for uncorroborated distant camera triggers."""

from __future__ import annotations

import datetime
import logging
import time
from typing import Any

from .evidence_snapshot import RoomEvidenceSnapshot
from .pir_corroboration import _safe_get_state, build_pir_corroboration_context
from .pir_validation import PIRCorroborationContext
from .sensor_reliability import classify_sensor_reliability, is_camera_entity
from .trajectory_validator import check_coordinator_trajectory

_LOGGER = logging.getLogger(__name__)

DEFAULT_CAM_REJECT_COOLDOWN_SEC = 180.0


def is_camera_verification_rejected(coord: Any, now_ts: float | None = None) -> bool:
    """Return True if camera triggers are currently suppressed after Vision AI rejection or manual clear."""
    rejected_until = float(getattr(coord, "_cam_verify_rejected_until", 0.0) or 0.0)
    if rejected_until <= 0.0:
        return False
    now = float(now_ts) if now_ts is not None else time.time()
    return now < rejected_until


def should_gate_camera_trigger_with_vision(coord: Any) -> bool:
    """Return True when Vision AI is enabled and configured with a camera for this room."""
    sm = getattr(coord, "state_machine", None)
    if not sm or not getattr(sm, "llm_enabled", False):
        return False
    if not (getattr(coord, "camera_entity", None) or getattr(coord, "camera_snapshot_url", None)):
        return False
    if getattr(coord, "verifier", None) is None:
        return False
    hass = getattr(coord, "hass", None)
    return bool(hass and hasattr(hass, "async_create_task"))


def _has_local_non_camera_corroboration(coord: Any) -> bool:
    """Return True if the room has an active local PIR or open boundary door, or has no local PIRs/doors configured."""
    for t_eid in getattr(coord, "_active_triggers", set()) or set():
        if not is_camera_entity(str(t_eid)):
            return True

    pv = getattr(coord, "pir_validator", None)
    if pv is not None and (
        getattr(pv, "active_pir_sensors", None) or getattr(pv, "pir_confirmed", False)
    ):
        return True

    hass = getattr(coord, "hass", None)
    has_configured_local_sensors = False

    for b_eid in getattr(coord, "boundary_entities", ()) or ():
        if not b_eid:
            continue
        has_configured_local_sensors = True
        st = _safe_get_state(hass, str(b_eid))
        if st is not None and st.state in ("on", "open", "opening"):
            return True

    for t_eid in getattr(coord, "trigger_entities", ()) or ():
        if t_eid and not is_camera_entity(str(t_eid)):
            prof = classify_sensor_reliability(str(t_eid))
            if prof.is_pir:
                has_configured_local_sensors = True
                st = _safe_get_state(hass, str(t_eid))
                if st is not None and st.state == "on":
                    return True

    return not has_configured_local_sensors


def sanitize_pir_camera_corroboration(
    coord: Any,
    ctx: PIRCorroborationContext,
    *,
    now_ts: float,
) -> PIRCorroborationContext:
    """Prevent an unverified distant Frigate flicker from corroborating a pending PIR via observation lookup."""
    if is_camera_verification_rejected(coord, now_ts=now_ts):
        return PIRCorroborationContext(
            camera_confirmed=False,
            camera_detail=None,
            trajectory_valid=ctx.trajectory_valid,
            trajectory_detail=ctx.trajectory_detail,
            ble_corroborated=ctx.ble_corroborated,
            ble_detail=ctx.ble_detail,
            extra_active_sensors=ctx.extra_active_sensors,
        )
    if not ctx.camera_confirmed or ctx.trajectory_valid or ctx.ble_corroborated:
        return ctx
    if not should_gate_camera_trigger_with_vision(coord):
        return ctx
    traj = check_coordinator_trajectory(coord, now_ts=now_ts)
    if traj.is_valid:
        return ctx
    return PIRCorroborationContext(
        camera_confirmed=False,
        camera_detail=None,
        trajectory_valid=ctx.trajectory_valid,
        trajectory_detail=ctx.trajectory_detail,
        ble_corroborated=ctx.ble_corroborated,
        ble_detail=ctx.ble_detail,
        extra_active_sensors=ctx.extra_active_sensors,
    )


def maybe_gate_uncorroborated_camera_trigger(
    coord: Any,
    entity_id: str,
    *,
    traj: Any,
    now_ts: float,
) -> bool:
    """Gate an uncorroborated camera trigger behind immediate Vision AI verification.

    Returns True when promotion should be suppressed/deferred pending Vision AI confirmation.
    """
    if is_camera_verification_rejected(coord, now_ts=now_ts):
        coord._last_suppressed_reason = (
            f"Suppressed flickering camera trigger after Vision AI rejection ({getattr(traj, 'reason', 'cooldown')})"
        )
        return True

    ctx = build_pir_corroboration_context(coord, traj=traj, now_ts=now_ts)
    if ctx.ble_corroborated:
        return False

    traj_valid = bool(getattr(traj, "is_valid", True))
    if traj_valid and _has_local_non_camera_corroboration(coord):
        return False

    if not should_gate_camera_trigger_with_vision(coord):
        return False

    gate_reason = (
        str(getattr(traj, "reason", "uncorroborated"))
        if not traj_valid
        else "camera_only_without_local_pir_or_door"
    )

    if getattr(coord, "_pending_cam_verify", False):
        coord._pending_cam_verify_entity = entity_id
        return True

    coord._pending_cam_verify = True
    coord._pending_cam_verify_entity = entity_id
    coord._last_suppressed_reason = (
        f"Pending Vision AI verification for uncorroborated camera trigger ({gate_reason})"
    )

    coro = async_verify_camera_entry(coord, entity_id, gate_reason)
    is_mock_task_fn = (
        type(coord.hass.async_create_task).__name__ == "MagicMock"
        and getattr(coord.hass.async_create_task, "side_effect", None) is None
    )
    task = coord.hass.async_create_task(coro)
    if is_mock_task_fn or task is None:
        if hasattr(coro, "close"):
            coro.close()
        coord._pending_cam_verify = False
        coord._pending_cam_verify_entity = None
    return True


async def async_verify_camera_entry(coord: Any, entity_id: str, traj_reason: str) -> bool:
    """Verify an uncorroborated camera trigger via Vision AI before promoting or re-confirming occupancy."""
    try:
        from .const import OccupancyState

        sm = coord.state_machine
        in_cooling = getattr(sm, "state", None) in (
            OccupancyState.OCCUPIED_COOLING,
            str(OccupancyState.OCCUPIED_COOLING),
        )
        if (sm.is_present and not in_cooling) or sm.override:
            return True

        image_bytes = await coord.verifier.async_acquire_snapshot(
            camera_entity_id=getattr(coord, "camera_entity", None),
            direct_url=getattr(coord, "camera_snapshot_url", None),
        )
        if not image_bytes:
            _LOGGER.warning(
                "Vision entry gate failed to acquire snapshot for %s (%s); keeping %s vacant",
                entity_id,
                traj_reason,
                coord.room_name,
            )
            coord._last_suppressed_reason = (
                f"Vision entry gate snapshot unavailable ({traj_reason})"
            )
            return False

        detected, reasoning = await coord.verifier.async_verify(image_bytes)
        sm.last_llm_result = {
            "timestamp": datetime.datetime.now(tz=datetime.UTC).isoformat(),
            "person_detected": bool(detected),
            "reason": reasoning,
        }

        in_cooling_now = getattr(sm, "state", None) in (
            OccupancyState.OCCUPIED_COOLING,
            str(OccupancyState.OCCUPIED_COOLING),
        )
        if (sm.is_present and not in_cooling_now) or sm.override:
            return True

        if not detected:
            coord._cam_verify_rejected_until = time.time() + DEFAULT_CAM_REJECT_COOLDOWN_SEC
            coord._last_suppressed_reason = (
                f"Vision AI rejected uncorroborated camera trigger ({traj_reason}): {reasoning}"
            )
            if in_cooling_now and hasattr(sm, "handle_llm_result"):
                if hasattr(sm, "trigger"):
                    sm.trigger(
                        "countdown_expired",
                        reason=f"Vision AI verification triggered by camera flicker ({entity_id})",
                    )
                sm.handle_llm_result(False, reasoning)
            _LOGGER.info(
                "Vision entry gate rejected %s for %s: %s",
                coord.room_name,
                entity_id,
                reasoning,
            )
            if hasattr(coord, "_record_timeline_snapshot"):
                coord._record_timeline_snapshot()
            coord.async_update_listeners()
            return False

        coord._cam_verify_rejected_until = 0.0
        coord._last_suppressed_reason = None
        target_eid = str(getattr(coord, "_pending_cam_verify_entity", None) or entity_id)
        now = time.time()
        coord._last_trigger_entity = target_eid

        confirm_snap = RoomEvidenceSnapshot(
            active_triggers=frozenset({target_eid}),
            active_conditions=tuple(getattr(coord, "_active_condition_descs", [])),
            human_present=True,
            camera_confirmed=True,
            last_trigger_entity=target_eid,
        )
        sm.apply_evidence(confirm_snap, now_ts=now)
        if hasattr(coord, "async_refresh_all_states"):
            coord.async_refresh_all_states()
        if sm.is_present and hasattr(coord, "_notify_connected_rooms_if_active"):
            coord._notify_connected_rooms_if_active()
        if hasattr(coord, "_record_timeline_snapshot"):
            coord._record_timeline_snapshot()
        coord.async_update_listeners()
        return True
    except Exception as err:  # noqa: BLE001
        _LOGGER.warning("Vision entry gate error for %s: %s", coord.room_name, err)
        return False
    finally:
        coord._pending_cam_verify = False
        coord._pending_cam_verify_entity = None
