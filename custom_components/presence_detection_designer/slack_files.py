"""Slack native image binary upload helpers using files:write external upload API."""

from __future__ import annotations

import ipaddress
import json
import logging
import urllib.parse
import urllib.request
from typing import Any

from .const import DATA_STORE, DOMAIN

_LOGGER = logging.getLogger(__name__)


def is_public_snapshot_url(url: str | None) -> bool:
    """Return True if snapshot_url is an HTTPS URL with a non-private host reachable by Slack."""
    raw = str(url or "").strip()
    if not raw.startswith("https://"):
        return False
    host = urllib.parse.urlparse(raw).hostname or ""
    if not host or host == "localhost":
        return False
    try:
        ip = ipaddress.ip_address(host)
        return not (ip.is_private or ip.is_loopback or ip.is_link_local)
    except ValueError:
        return True


def _fetch_url_bytes_sync(url: str) -> bytes | None:
    req = urllib.request.Request(url, method="GET")
    with urllib.request.urlopen(req, timeout=5) as resp:
        data = resp.read()
        return data if data else None


async def async_fetch_snapshot_bytes(
    hass: Any,
    *,
    camera_entity: str | None = None,
    snapshot_url: str | None = None,
) -> bytes | None:
    """Fetch raw JPEG bytes from a Home Assistant camera entity or local/internal snapshot URL."""
    cam = str(camera_entity or "").strip()
    if cam and hass is not None:
        try:
            from homeassistant.components.camera import async_get_image

            if type(async_get_image).__name__ != "MagicMock":
                img = await async_get_image(hass, cam)
                content = getattr(img, "content", None)
                if isinstance(content, (bytes, bytearray)) and len(content) > 0:
                    return bytes(content)
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("HA camera async_get_image failed for %s: %s", cam, err)

    url = str(snapshot_url or "").strip()
    if url.startswith(("http://", "https://")):
        try:
            if hass is not None and hasattr(hass, "async_add_executor_job"):
                return await hass.async_add_executor_job(_fetch_url_bytes_sync, url)
            return _fetch_url_bytes_sync(url)
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Snapshot URL fetch failed for %s: %s", url, err)
    return None


def upload_slack_image_sync(
    token: str,
    image_bytes: bytes,
    *,
    filename: str,
    channel_id: str,
    thread_ts: str | None = None,
    title: str | None = None,
    initial_comment: str | None = None,
) -> dict[str, Any]:
    """Upload image bytes to Slack via files.getUploadURLExternal + files.completeUploadExternal."""
    meta_req = urllib.request.Request(
        "https://slack.com/api/files.getUploadURLExternal",
        data=urllib.parse.urlencode({"filename": filename, "length": str(len(image_bytes))}).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        method="POST",
    )
    with urllib.request.urlopen(meta_req, timeout=8) as resp:
        meta = json.loads(resp.read().decode("utf-8"))
    if not isinstance(meta, dict) or not meta.get("ok") or not meta.get("upload_url") or not meta.get("file_id"):
        return meta if isinstance(meta, dict) else {"ok": False, "error": "invalid_upload_url_response"}

    put_req = urllib.request.Request(
        str(meta["upload_url"]),
        data=image_bytes,
        headers={"Content-Type": "image/jpeg"},
        method="POST",
    )
    with urllib.request.urlopen(put_req, timeout=10) as put_resp:
        _ = put_resp.read()

    complete_body: dict[str, Any] = {
        "files": [{"id": str(meta["file_id"]), "title": title or filename}],
        "channel_id": channel_id,
    }
    if thread_ts:
        complete_body["thread_ts"] = thread_ts
    if initial_comment:
        complete_body["initial_comment"] = initial_comment

    comp_req = urllib.request.Request(
        "https://slack.com/api/files.completeUploadExternal",
        data=json.dumps(complete_body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json; charset=utf-8",
        },
        method="POST",
    )
    with urllib.request.urlopen(comp_req, timeout=8) as comp_resp:
        res = json.loads(comp_resp.read().decode("utf-8"))
    return res if isinstance(res, dict) else {"ok": False, "error": "invalid_complete_response"}


async def async_upload_room_snapshot(
    hass: Any,
    room_name: str,
    *,
    camera_entity: str | None = None,
    snapshot_url: str | None = None,
    channel: str | None = None,
    thread_ts: str | None = None,
    initial_comment: str | None = None,
) -> bool:
    """Fetch a room camera JPEG and upload it directly to Slack (thread or channel)."""
    from .notifications import format_duration
    from .slack_cards import get_slack_daily_thread_manager

    if not hass or not isinstance(getattr(hass, "data", None), dict):
        return False
    mgr = get_slack_daily_thread_manager(hass)
    token = mgr.get_slack_token(hass)
    if not token:
        return False

    img_bytes = await async_fetch_snapshot_bytes(
        hass, camera_entity=camera_entity, snapshot_url=snapshot_url
    )
    if not img_bytes:
        return False

    store = hass.data.get(DOMAIN, {}).get(DATA_STORE)
    gs = (getattr(store, "global_settings", None) or {}) if store else {}
    target_ch = str(channel or gs.get("slack_channel") or "#presence-alerts").strip()
    channel_id = await mgr.async_resolve_channel_id(hass, target_ch, token)

    resolved_thread = thread_ts
    if resolved_thread is None and channel is None and bool(gs.get("slack_daily_thread", True)):
        resolved_thread = await mgr.async_get_or_create_daily_thread(
            hass, target_ch, token, format_duration
        )

    safe_slug = "".join(c.lower() if c.isalnum() else "_" for c in room_name).strip("_") or "room"
    filename = f"{safe_slug}_snapshot.jpg"
    title = f"📸 {room_name} Camera Snapshot"
    if hasattr(hass, "async_add_executor_job"):
        res = await hass.async_add_executor_job(
            lambda: upload_slack_image_sync(
                token,
                img_bytes,
                filename=filename,
                channel_id=channel_id,
                thread_ts=resolved_thread,
                title=title,
                initial_comment=initial_comment,
            )
        )
    else:
        res = upload_slack_image_sync(
            token,
            img_bytes,
            filename=filename,
            channel_id=channel_id,
            thread_ts=resolved_thread,
            title=title,
            initial_comment=initial_comment,
        )
    ok = bool(isinstance(res, dict) and res.get("ok"))
    if not ok:
        _LOGGER.warning("Slack snapshot upload failed for %s: %s", room_name, res)
    return ok


def _post_response_url_sync(response_url: str, payload: dict[str, Any]) -> None:
    req = urllib.request.Request(
        response_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=5):
        pass


async def async_post_response_url(hass: Any, response_url: str, payload: dict[str, Any]) -> None:
    """Send an asynchronous ephemeral confirmation to a Slack interaction response_url."""
    url = str(response_url or "").strip()
    if not url.startswith("https://"):
        return
    try:
        if hasattr(hass, "async_add_executor_job"):
            await hass.async_add_executor_job(_post_response_url_sync, url, payload)
        else:
            _post_response_url_sync(url, payload)
    except Exception as err:  # noqa: BLE001
        _LOGGER.debug("Slack response_url post failed: %s", err)


async def async_handle_snapshot_slash(hass: Any, coord: Any, *, actor: str, channel_id: str | None) -> dict[str, Any]:
    """Capture and upload a live room snapshot for `/presence snapshot <room>`."""
    cam, url = getattr(coord, "camera_entity", None), getattr(coord, "camera_snapshot_url", None)
    if not cam and not url:
        return {"response_type": "ephemeral", "text": f"⚠️ *{coord.room_name}* has no camera configured."}
    ok = await async_upload_room_snapshot(
        hass, str(coord.room_name), camera_entity=cam, snapshot_url=url,
        channel=channel_id, initial_comment=f"📸 Live snapshot requested by *{actor}* for *{coord.room_name}*",
    )
    msg = (
        f"📸 Uploaded live snapshot for *{coord.room_name}*."
        if ok
        else f"⚠️ Failed to capture snapshot for *{coord.room_name}*."
    )
    return {"response_type": "ephemeral", "text": msg}
