"""HTTP API views for 2D floorplan compilation, CV camera alignment, and notification verification."""

from __future__ import annotations

import logging
from typing import Any

from .const import DATA_STORE, DOMAIN
from .coordinator import RoomPresenceCoordinator
from .notifications import NotificationDispatcher, TransitionAttribution
from .spatial_topology import (
    apply_compiled_topology_to_config,
    compile_floorplan_topology,
    get_default_floorplan,
)
from .store import async_get_store
from .view_serializers import HomeAssistantView, async_apply_and_persist_room_config

_LOGGER = logging.getLogger(__name__)


class PDDFloorplanView(HomeAssistantView):
    """Get, save, reset, and compile 2D spatial floorplan & camera view cones into room rules."""

    url = "/api/presence_detection_designer/floorplan"
    name = "api:presence_detection_designer:floorplan"
    requires_auth = True

    async def get(self, request: Any) -> Any:
        """Handle GET /api/presence_detection_designer/floorplan."""
        hass = request.app["hass"]
        store = await async_get_store(hass)
        fp = store.get_floorplan()
        return self.json(
            {
                "floorplan": fp,
                "compiled_topology": compile_floorplan_topology(fp),
            }
        )

    async def post(self, request: Any) -> Any:
        """Handle POST /api/presence_detection_designer/floorplan."""
        hass = request.app["hass"]
        store = await async_get_store(hass)
        try:
            body = await request.json()
        except Exception as err:  # noqa: BLE001
            return self.json({"error": f"Invalid JSON: {err}"}, status_code=400)

        action = str(body.get("action") or "save")
        if action == "reset":
            fp = await store.async_save_floorplan(get_default_floorplan())
            compiled = compile_floorplan_topology(fp)
            return self.json(
                {
                    "status": "ok",
                    "floorplan": fp,
                    "compiled_topology": compiled,
                }
            )

        incoming_fp = body.get("floorplan")
        if isinstance(incoming_fp, dict) and incoming_fp.get("floors"):
            fp = await store.async_save_floorplan(incoming_fp)
        else:
            fp = store.get_floorplan()

        compiled = compile_floorplan_topology(fp)
        updated_rooms: list[dict[str, Any]] = []

        if action == "compile_and_apply" or bool(body.get("apply", False)):
            domain_data = hass.data.get(DOMAIN, {}) if hasattr(hass, "data") else {}
            seen_eids: set[str] = set()

            for eid, coordinator in list(domain_data.items()):
                if not isinstance(coordinator, RoomPresenceCoordinator):
                    continue
                seen_eids.add(eid)
                updated_cfg = apply_compiled_topology_to_config(coordinator.config, compiled)
                room_payload = await async_apply_and_persist_room_config(
                    hass=hass,
                    entry_id=eid,
                    raw_config=updated_cfg,
                    note="Compiled from 2D Floorplan & Camera View Cones",
                    record_revision=True,
                )
                updated_rooms.append(room_payload)

            for eid, stored_cfg in store.rooms.items():
                if eid in seen_eids:
                    continue
                updated_cfg = apply_compiled_topology_to_config(stored_cfg, compiled)
                room_payload = await async_apply_and_persist_room_config(
                    hass=hass,
                    entry_id=eid,
                    raw_config=updated_cfg,
                    note="Compiled from 2D Floorplan & Camera View Cones",
                    record_revision=True,
                )
                updated_rooms.append(room_payload)

        return self.json(
            {
                "status": "ok",
                "floorplan": fp,
                "compiled_topology": compiled,
                "updated_rooms": updated_rooms,
            }
        )


class PDDCameraAlignView(HomeAssistantView):
    """View to analyze camera snapshots for vanishing horizon tilt and opening azimuth alignment."""

    url = "/api/presence_detection_designer/camera/{camera_id}/align"
    name = "api:presence_detection_designer:camera_align"
    requires_auth = True

    async def post(self, request: Any, camera_id: str) -> Any:
        """Handle POST /api/presence_detection_designer/camera/{camera_id}/align."""
        hass = request.app["hass"]
        store = await async_get_store(hass)
        fp = store.get_floorplan()

        try:
            body = await request.json()
        except Exception:  # noqa: BLE001
            body = {}

        cameras = fp.get("cameras", [])
        cam_dict: dict[str, Any] | None = None
        for c in cameras:
            if c.get("id") == camera_id or c.get("camera_entity") == camera_id:
                cam_dict = dict(c)
                break

        if not cam_dict:
            cam_dict = body.get("camera_dict") or {"id": camera_id}

        if body.get("camera_dict"):
            cam_dict.update(body["camera_dict"])

        image_bytes: bytes | None = None
        image_b64 = body.get("image_b64")
        if image_b64:
            if "," in image_b64:
                image_b64 = image_b64.split(",", 1)[1]
            try:
                import base64

                image_bytes = base64.b64decode(image_b64)
            except Exception as err:  # noqa: BLE001
                return self.json({"error": f"Invalid base64 image: {err}"}, status_code=400)

        if not image_bytes:
            camera_entity = (
                body.get("camera_entity")
                or cam_dict.get("camera_entity")
                or (camera_id if camera_id.startswith("camera.") else None)
            )
            if camera_entity and hass is not None:
                try:
                    from homeassistant.components.camera import async_get_image

                    image_data = await async_get_image(hass, camera_entity)
                    image_bytes = image_data.content
                except Exception as err:  # noqa: BLE001
                    _LOGGER.warning(
                        "Could not fetch camera snapshot for %s: %s", camera_entity, err
                    )

        if not image_bytes:
            return self.json(
                {
                    "error": (
                        f"No image snapshot available for camera '{camera_id}'. "
                        "Provide 'image_b64' or ensure an active HA camera entity exists."
                    )
                },
                status_code=400,
            )

        host_room_name = cam_dict.get("host_room")
        room_box = body.get("room_box")
        entryways = body.get("entryways")

        if not room_box or not entryways:
            rooms = fp.get("rooms", [])
            matched_room = next((r for r in rooms if r.get("name") == host_room_name), None)
            if matched_room:
                if not room_box:
                    room_box = {
                        "name": matched_room.get("name"),
                        "x": matched_room.get("x", 0),
                        "y": matched_room.get("y", 0),
                        "width": matched_room.get("width", 100),
                        "height": matched_room.get("height", 100),
                    }
                if not entryways:
                    entryways = list(matched_room.get("entryways", []))

        if not room_box:
            room_box = {
                "name": host_room_name or "Unknown",
                "x": 0,
                "y": 0,
                "width": 200,
                "height": 200,
            }
        if entryways is None:
            entryways = []

        try:
            from .camera_alignment_cv import analyze_camera_view_alignment

            result = analyze_camera_view_alignment(image_bytes, cam_dict, entryways, room_box)
            return self.json(result)
        except Exception as err:  # noqa: BLE001
            _LOGGER.exception("Failed to analyze camera view alignment: %s", err)
            return self.json({"error": f"Alignment analysis failed: {err}"}, status_code=500)


class PDDNotificationTestView(HomeAssistantView):
    """View to dispatch a test Slack notification."""

    url = "/api/presence_detection_designer/notifications/test"
    name = "api:presence_detection_designer:notifications:test"
    requires_auth = True

    async def post(self, request: Any) -> Any:
        """Handle test notification request."""
        hass = request.app["hass"]
        body: dict[str, Any] = {}
        try:
            body = await request.json()
        except Exception:
            body = {}

        service = body.get("slack_notify_service")
        channel = body.get("slack_channel")

        domain_data = getattr(hass, "data", {}).get(DOMAIN, {})
        coordinators = [c for c in domain_data.values() if isinstance(c, RoomPresenceCoordinator)]
        if coordinators:
            success = await coordinators[0].async_send_test_notification(
                service=service, channel=channel
            )
            return self.json(
                {
                    "success": success,
                    "message": f"Test alert sent via {service or 'notify.scdbots'} to {channel or '#presence-alerts'}",
                }
            )

        store = domain_data.get(DATA_STORE)
        global_settings = dict(getattr(store, "global_settings", {}) or {})
        if service:
            global_settings["slack_notify_service"] = service
        if channel:
            global_settings["slack_channel"] = channel

        dispatcher = NotificationDispatcher()
        attribution = TransitionAttribution(
            room_id="studio_test",
            room_name="Design Studio",
            from_state="clear",
            to_state="occupied",
            primary_driver="Manual Studio Verification Ping",
            driver_type="sensor",
            confidence_pct=95.0,
            threshold_pct=75.0,
            active_sensors=["test_sensor.manual_ping"],
            sustaining_conditions=[],
            arrival_context="Manual Studio Test",
            duration_occupied_str=None,
        )
        success = await dispatcher.async_dispatch_notification(
            hass,
            attribution,
            global_settings,
            {"notify_slack": True, "notify_on_occupied": True},
        )
        return self.json(
            {
                "success": success,
                "message": f"Test alert sent via {global_settings.get('slack_notify_service', 'notify.scdbots')} to {global_settings.get('slack_channel', '#presence-alerts')}",
            }
        )
