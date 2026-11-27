import { handleCanvasPointerMove } from "./events-canvas-drag-move.js";

// Pointer-down / pointer-up lifecycle for interactive floorplan SVG dragging.

export function bindCanvasDragEvents(panel, root) {
  // Interactive Canvas Pointer Dragging & Smooth Snapping
  const svgCanvas = root.querySelector("#fp-svg-canvas");
  if (svgCanvas) {
    const startFpDrag = (e, dragObj) => {
      dragObj.snapshotBefore = panel._floorplan ? JSON.stringify(panel._floorplan) : null;
      dragObj.undoPushed = false;
      panel._activeFpDrag = dragObj;
      try {
        svgCanvas.setPointerCapture(e.pointerId);
      } catch (_e) {}
      e.preventDefault();
      e.stopPropagation();
    };

    svgCanvas.addEventListener("pointerdown", (e) => {
      const camHandle = e.target.closest(".fp-cam-handle");
      const sensorHandle = e.target.closest(".fp-sensor-handle");
      const bleHandle = e.target.closest(".fp-ble-handle");
      const subzoneHandle = e.target.closest(".fp-subzone-handle");
      const camOrigin = e.target.closest(".fp-cam-origin");
      const sensorOrigin = e.target.closest(".fp-sensor-origin");
      const bleOrigin = e.target.closest(".fp-ble-origin");
      const doorTab = e.target.closest(".fp-door-tab");
      const doorHandle = e.target.closest(".fp-door-handle");
      const subzoneRect = e.target.closest(".fp-subzone-rect");
      const resizeHandle = e.target.closest(".fp-resize-handle");
      const roomBox = e.target.closest(".fp-room-box");

      const mode = panel._floorplanMode;
      const allowRooms = mode === "rooms";
      const allowCams = mode === "devices" || mode === "cameras";
      const allowSensors = mode === "devices" || mode === "sensors";
      const startPt = panel._getSvgPoint(e, svgCanvas);

      if (allowSensors && sensorHandle) {
        const handle = sensorHandle.getAttribute("data-handle");
        const senId = sensorHandle.getAttribute("data-sensor-id");
        const sen = (panel._floorplan?.sensors || []).find((s) => s.id === senId);
        if (sen) {
          panel._selectedSensorId = senId;
          panel._selectedDeviceType = "sensor";
          startFpDrag(e, {
            type: "sensor_handle",
            handle,
            sensorId: senId,
            hasMoved: false,
            startPt,
          });
        }
        return;
      }

      if (allowCams && camHandle) {
        const handle = camHandle.getAttribute("data-handle");
        const camId = camHandle.getAttribute("data-cam-id");
        const cam = (panel._floorplan?.cameras || []).find(
          (c) => (c.id || c.camera_entity) === camId
        );
        if (cam) {
          panel._selectedCamEntity = camId;
          panel._selectedDeviceType = "camera";
          startFpDrag(e, {
            type: "cam_handle",
            handle,
            camId,
            hasMoved: false,
            startPt,
          });
        }
        return;
      }

      if (allowSensors && bleHandle) {
        const proxyId = bleHandle.getAttribute("data-proxy-id");
        const bp = (panel._floorplan?.ble_proxies || []).find((p) => p.id === proxyId);
        if (bp) {
          panel._selectedBleProxyId = proxyId;
          panel._selectedDeviceType = "ble";
          startFpDrag(e, {
            type: "ble_radius",
            proxyId,
            hasMoved: false,
            startPt,
          });
        }
        return;
      }

      if (allowCams && subzoneHandle) {
        const camId = subzoneHandle.getAttribute("data-cam-id");
        const szId = subzoneHandle.getAttribute("data-subzone-id");
        const cam = (panel._floorplan?.cameras || []).find(
          (c) => (c.id || c.camera_entity) === camId
        );
        const sz = (cam?.sub_zones || []).find((z) => z.id === szId);
        if (cam && sz) {
          panel._selectedCamEntity = camId;
          panel._selectedSubZoneId = szId;
          panel._selectedDeviceType = "subzone";
          startFpDrag(e, {
            type: "resize_subzone",
            camId,
            subZoneId: szId,
            hasMoved: false,
            startPt,
            startSize: { width: Number(sz.width || 60), height: Number(sz.height || 60) },
          });
        }
        return;
      }

      if (allowSensors && sensorOrigin) {
        const senId = sensorOrigin.getAttribute("data-sensor-id");
        const sen = (panel._floorplan?.sensors || []).find((s) => s.id === senId);
        if (sen) {
          panel._selectedSensorId = senId;
          panel._selectedDeviceType = "sensor";
          startFpDrag(e, {
            type: "move_sensor",
            sensorId: senId,
            hasMoved: false,
            startPt,
            startPos: { x: Number(sen.x), y: Number(sen.y) },
          });
        }
        return;
      }

      if (allowCams && camOrigin) {
        const camId = camOrigin.getAttribute("data-cam-entity");
        const cam = (panel._floorplan?.cameras || []).find(
          (c) => (c.id || c.camera_entity) === camId
        );
        if (cam) {
          panel._selectedCamEntity = camId;
          panel._selectedDeviceType = "camera";
          startFpDrag(e, {
            type: "move_cam",
            camId,
            hasMoved: false,
            startPt,
            startCam: { x: Number(cam.x), y: Number(cam.y) },
          });
        }
        return;
      }

      if (allowSensors && bleOrigin) {
        const proxyId = bleOrigin.getAttribute("data-proxy-id");
        const bp = (panel._floorplan?.ble_proxies || []).find((p) => p.id === proxyId);
        if (bp) {
          panel._selectedBleProxyId = proxyId;
          panel._selectedDeviceType = "ble";
          startFpDrag(e, {
            type: "move_ble",
            proxyId,
            hasMoved: false,
            startPt,
            startPos: { x: Number(bp.x), y: Number(bp.y) },
          });
        }
        return;
      }

      if (allowCams && subzoneRect) {
        const camId = subzoneRect.getAttribute("data-cam-id");
        const szId = subzoneRect.getAttribute("data-subzone-id");
        const cam = (panel._floorplan?.cameras || []).find(
          (c) => (c.id || c.camera_entity) === camId
        );
        const sz = (cam?.sub_zones || []).find((z) => z.id === szId);
        if (cam && sz) {
          panel._selectedCamEntity = camId;
          panel._selectedSubZoneId = szId;
          panel._selectedDeviceType = "subzone";
          startFpDrag(e, {
            type: "move_subzone",
            camId,
            subZoneId: szId,
            hasMoved: false,
            startPt,
            startPos: { x: Number(sz.x), y: Number(sz.y) },
          });
        }
        return;
      }

      if (allowRooms && doorTab) {
        const tab = doorTab.getAttribute("data-tab");
        const doorId = doorTab.getAttribute("data-door-id");
        const rname = doorTab.getAttribute("data-room-name");
        const box = (panel._floorplan?.rooms || []).find((b) => (b.name || b.room_name) === rname);
        const ew = (box?.entryways || []).find((d) => d.id === doorId);
        if (box && ew) {
          panel._selectedDoorId = doorId;
          panel._selectedRoomBoxName = rname;
          panel._selectedDeviceType = "room";
          startFpDrag(e, {
            type: "resize_door",
            tab,
            doorId,
            roomName: rname,
            hasMoved: false,
            startPt,
            startOffset: Number(ew.offset || 0),
            startWidth: Number(ew.width || 36),
            wall: ew.wall,
          });
        }
        return;
      }

      if (allowRooms && doorHandle) {
        const doorId = doorHandle.getAttribute("data-door-id");
        const rname = doorHandle.getAttribute("data-room-name");
        const box = (panel._floorplan?.rooms || []).find((b) => (b.name || b.room_name) === rname);
        const ew = (box?.entryways || []).find((d) => d.id === doorId);
        if (box && ew) {
          panel._selectedDoorId = doorId;
          panel._selectedRoomBoxName = rname;
          panel._selectedDeviceType = "room";
          startFpDrag(e, {
            type: "move_door",
            doorId,
            roomName: rname,
            hasMoved: false,
            startPt,
            startOffset: Number(ew.offset || 0),
            startWidth: Number(ew.width || 36),
            wall: ew.wall,
          });
        }
        return;
      }

      if (allowRooms && !panel._roomsLocked && resizeHandle) {
        const handle = resizeHandle.getAttribute("data-handle");
        const rname = resizeHandle.getAttribute("data-room-name");
        const box = (panel._floorplan?.rooms || []).find((b) => (b.name || b.room_name) === rname);
        if (box) {
          panel._selectedRoomBoxName = rname;
          panel._selectedDeviceType = "room";
          startFpDrag(e, {
            type: "resize_room",
            handle,
            roomName: rname,
            hasMoved: false,
            startPt,
            startSvgPath: box.svg_path || null,
            startBox: {
              x: Number(box.x),
              y: Number(box.y),
              width: Number(box.width ?? box.w ?? 200),
              height: Number(box.height ?? box.h ?? 150),
            },
          });
        }
        return;
      }

      if (allowRooms && roomBox) {
        const rname = roomBox.getAttribute("data-room-name");
        const box = (panel._floorplan?.rooms || []).find((b) => (b.name || b.room_name) === rname);
        if (box) {
          panel._selectedRoomBoxName = rname;
          panel._selectedDeviceType = "room";
          const room = (panel._overview?.rooms || []).find((r) => r.room_name === rname);
          if (room) panel._selectRoomObject(room, false);
          if (panel._roomsLocked) {
            panel.render();
            return;
          }
          startFpDrag(e, {
            type: "move_room",
            roomName: rname,
            hasMoved: false,
            startPt,
            startSvgPath: box.svg_path || null,
            startBox: {
              x: Number(box.x),
              y: Number(box.y),
              width: Number(box.width ?? box.w ?? 200),
              height: Number(box.height ?? box.h ?? 150),
            },
          });
        }
        return;
      }

      panel._selectedDoorId = null;
    });

      svgCanvas.addEventListener("pointermove", (e) => handleCanvasPointerMove(panel, e, svgCanvas));

    const onPointerUp = (e) => {
      if (!panel._activeFpDrag) return;
      const wasMoved = panel._activeFpDrag.hasMoved;
      try {
        if (svgCanvas.hasPointerCapture(e.pointerId)) {
          svgCanvas.releasePointerCapture(e.pointerId);
        }
      } catch (_e) {}
      panel._activeFpDrag = null;
      if (wasMoved) {
        panel._debounceSaveFloorplan();
      }
      panel.render();
    };

    svgCanvas.addEventListener("pointerup", onPointerUp);
    svgCanvas.addEventListener("pointercancel", onPointerUp);
  }
  root.querySelector("#btn-open-floorplan-tab")?.addEventListener("click", () => {
    panel._studioView = "floorplan";
    if (!panel._floorplan) {
      panel._floorplan = panel._loadLocalOrDefaultFloorplan();
      panel._compiledTopology = panel._compileFloorplanClient(panel._floorplan);
    }
    const curRoom = panel.selectedRoom;
    const box = (panel._floorplan?.rooms || []).find(
      (b) => curRoom && (b.name || b.room_name) === curRoom.room_name
    );
    if (box && box.floor) {
      panel._selectedFloorId = box.floor;
    }
    panel.render();
  });

  root.querySelectorAll(".seg-btn[data-history-hours]").forEach((el) => {
    el.addEventListener("click", () => {
      panel._historyHours = Number(el.getAttribute("data-history-hours") || 6);
      if (panel._studioView === "statistics") {
        panel.loadStatistics();
      } else if (panel._studioView === "replay") {
        panel.runReplay();
      }
    });
  });

  root.querySelector("#btn-jump-to-replay")?.addEventListener("click", () => {
    panel._studioView = "replay";
    panel._replayCandidate = JSON.parse(JSON.stringify(panel._draftConfig || {}));
    panel.runReplay();
  });
  root.querySelector("#btn-open-house-timeline")?.addEventListener("click", () => {
    panel._studioView = "timeline";
    panel.loadTimeline();
  });
  root.querySelector("#btn-back-to-stats")?.addEventListener("click", () => {
    panel._studioView = "statistics";
    panel.loadStatistics();
  });

}
