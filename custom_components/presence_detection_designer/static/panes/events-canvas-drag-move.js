// Pointer-move drag handler for interactive floorplan canvas editing and snapping.

export function handleCanvasPointerMove(panel, e, svgCanvas) {
    if (!panel._activeFpDrag) return;
    const drag = panel._activeFpDrag;
    const pt = panel._getSvgPoint(e, svgCanvas);
    const dx = pt.x - drag.startPt.x;
    const dy = pt.y - drag.startPt.y;

    if (!drag.hasMoved) {
      if (Math.hypot(dx, dy) < 4) return;
      drag.hasMoved = true;
      if (!drag.undoPushed && drag.snapshotBefore) {
        panel._pushFpUndo(drag.snapshotBefore);
        drag.undoPushed = true;
      }
    }

    if (drag.type === "move_room") {
      const box = (panel._floorplan?.rooms || []).find(
        (b) => (b.name || b.room_name) === drag.roomName
      );
      if (!box) return;
      let nx = drag.startBox.x + dx;
      let ny = drag.startBox.y + dy;
      nx = Math.max(0, Math.min(1000 - drag.startBox.width, nx));
      ny = Math.max(0, Math.min(580 - drag.startBox.height, ny));
      box.x = Math.round(nx);
      box.y = Math.round(ny);
      box.width = drag.startBox.width;
      box.height = drag.startBox.height;
      if (!e.shiftKey) {
        panel._snapRoomGeometry(box, panel._floorplan?.rooms || [], 10);
      }
      if (drag.startSvgPath) {
        box.svg_path = panel._transformSvgPath(
          drag.startSvgPath,
          drag.startBox.x,
          drag.startBox.y,
          drag.startBox.width,
          drag.startBox.height,
          box.x,
          box.y,
          box.width,
          box.height
        );
      }
      panel._compiledTopology = panel._compileFloorplanClient(panel._floorplan);
      panel._scheduleCanvasRender();
    } else if (drag.type === "resize_room") {
      const box = (panel._floorplan?.rooms || []).find(
        (b) => (b.name || b.room_name) === drag.roomName
      );
      if (!box) return;
      let { x, y, width, height } = drag.startBox;
      if (drag.handle.includes("e")) width += dx;
      if (drag.handle.includes("s")) height += dy;
      if (drag.handle.includes("w")) {
        x += dx;
        width -= dx;
      }
      if (drag.handle.includes("n")) {
        y += dy;
        height -= dy;
      }
      if (width < 50) {
        if (drag.handle.includes("w")) x -= 50 - width;
        width = 50;
      }
      if (height < 50) {
        if (drag.handle.includes("n")) y -= 50 - height;
        height = 50;
      }
      if (!e.shiftKey) {
        x = panel._snapValue(x, 10);
        y = panel._snapValue(y, 10);
        width = panel._snapValue(width, 10);
        height = panel._snapValue(height, 10);
      }
      box.x = Math.round(Math.max(0, x));
      box.y = Math.round(Math.max(0, y));
      box.width = Math.round(Math.max(50, width));
      box.height = Math.round(Math.max(50, height));
      if (drag.startSvgPath) {
        box.svg_path = panel._transformSvgPath(
          drag.startSvgPath,
          drag.startBox.x,
          drag.startBox.y,
          drag.startBox.width,
          drag.startBox.height,
          box.x,
          box.y,
          box.width,
          box.height
        );
      }
      panel._compiledTopology = panel._compileFloorplanClient(panel._floorplan);
      panel._scheduleCanvasRender();
    } else if (drag.type === "move_cam") {
      const cam = (panel._floorplan?.cameras || []).find(
        (c) => (c.id || c.camera_entity) === drag.camId
      );
      if (!cam) return;
      let nx = drag.startCam.x + dx;
      let ny = drag.startCam.y + dy;
      if (e.shiftKey) {
        nx = panel._snapValue(nx, 10);
        ny = panel._snapValue(ny, 10);
      }
      cam.x = Math.max(10, Math.min(990, Math.round(nx)));
      cam.y = Math.max(10, Math.min(570, Math.round(ny)));
      panel._compiledTopology = panel._compileFloorplanClient(panel._floorplan);
      panel._scheduleCanvasRender();
    } else if (drag.type === "cam_handle") {
      const cam = (panel._floorplan?.cameras || []).find(
        (c) => (c.id || c.camera_entity) === drag.camId
      );
      if (!cam) return;
      const cx = Number(cam.x);
      const cy = Number(cam.y);
      if (drag.handle === "heading") {
        let deg = (Math.atan2(pt.y - cy, pt.x - cx) * 180) / Math.PI;
        if (deg < 0) deg += 360;
        if (e.shiftKey) deg = Math.round(deg / 15) * 15;
        cam.heading_deg = ((Math.round(deg) % 360) + 360) % 360;
      } else if (drag.handle === "range") {
        if (panel._isSpecLocked(cam)) return;
        const dist = Math.hypot(pt.x - cx, pt.y - cy);
        let r = Math.max(40, Math.min(700, Math.round(dist)));
        if (e.shiftKey) r = Math.round(r / 10) * 10;
        cam.range_px = r;
      } else if (drag.handle === "fov_start" || drag.handle === "fov_end") {
        if (panel._isSpecLocked(cam)) return;
        let pointerAngle = (Math.atan2(pt.y - cy, pt.x - cx) * 180) / Math.PI;
        if (pointerAngle < 0) pointerAngle += 360;
        const heading = Number(cam.heading_deg || 0);
        const angleDiff = Math.abs(((pointerAngle - heading + 540) % 360) - 180);
        let newFov = Math.max(15, Math.min(180, Math.round(angleDiff * 2)));
        if (e.shiftKey) newFov = Math.round(newFov / 5) * 5;
        cam.fov_deg = newFov;
      }
      panel._compiledTopology = panel._compileFloorplanClient(panel._floorplan);
      panel._scheduleCanvasRender();
    } else if (drag.type === "move_sensor") {
      const sen = (panel._floorplan?.sensors || []).find((s) => s.id === drag.sensorId);
      if (!sen) return;
      let nx = drag.startPos.x + dx;
      let ny = drag.startPos.y + dy;
      if (e.shiftKey) {
        nx = panel._snapValue(nx, 10);
        ny = panel._snapValue(ny, 10);
      }
      sen.x = Math.max(10, Math.min(990, Math.round(nx)));
      sen.y = Math.max(10, Math.min(570, Math.round(ny)));
      panel._compiledTopology = panel._compileFloorplanClient(panel._floorplan);
      panel._scheduleCanvasRender();
    } else if (drag.type === "sensor_handle") {
      const sen = (panel._floorplan?.sensors || []).find((s) => s.id === drag.sensorId);
      if (!sen) return;
      const sx = Number(sen.x);
      const sy = Number(sen.y);
      if (drag.handle === "heading") {
        let deg = (Math.atan2(pt.y - sy, pt.x - sx) * 180) / Math.PI;
        if (deg < 0) deg += 360;
        if (e.shiftKey) deg = Math.round(deg / 15) * 15;
        sen.heading_deg = ((Math.round(deg) % 360) + 360) % 360;
      } else if (drag.handle === "range") {
        if (panel._isSpecLocked(sen)) return;
        const dist = Math.hypot(pt.x - sx, pt.y - sy);
        let r = Math.max(35, Math.min(450, Math.round(dist)));
        if (e.shiftKey) r = Math.round(r / 10) * 10;
        sen.range_px = r;
      } else if (drag.handle === "fov_start" || drag.handle === "fov_end") {
        if (panel._isSpecLocked(sen)) return;
        let pointerAngle = (Math.atan2(pt.y - sy, pt.x - sx) * 180) / Math.PI;
        if (pointerAngle < 0) pointerAngle += 360;
        const heading = Number(sen.heading_deg || 0);
        const angleDiff = Math.abs(((pointerAngle - heading + 540) % 360) - 180);
        let newFov = Math.max(15, Math.min(180, Math.round(angleDiff * 2)));
        if (e.shiftKey) newFov = Math.round(newFov / 5) * 5;
        sen.fov_deg = newFov;
      }
      panel._compiledTopology = panel._compileFloorplanClient(panel._floorplan);
      panel._scheduleCanvasRender();
    } else if (drag.type === "move_ble") {
      const bp = (panel._floorplan?.ble_proxies || []).find((p) => p.id === drag.proxyId);
      if (!bp) return;
      let nx = drag.startPos.x + dx;
      let ny = drag.startPos.y + dy;
      if (e.shiftKey) {
        nx = panel._snapValue(nx, 10);
        ny = panel._snapValue(ny, 10);
      }
      bp.x = Math.max(10, Math.min(990, Math.round(nx)));
      bp.y = Math.max(10, Math.min(570, Math.round(ny)));
      panel._compiledTopology = panel._compileFloorplanClient(panel._floorplan);
      panel._scheduleCanvasRender();
    } else if (drag.type === "ble_radius") {
      const bp = (panel._floorplan?.ble_proxies || []).find((p) => p.id === drag.proxyId);
      if (!bp || panel._isSpecLocked(bp)) return;
      const dist = Math.hypot(pt.x - Number(bp.x || 0), pt.y - Number(bp.y || 0));
      let r = Math.max(40, Math.min(450, Math.round(dist)));
      if (e.shiftKey) r = Math.round(r / 10) * 10;
      bp.radius_px = r;
      panel._compiledTopology = panel._compileFloorplanClient(panel._floorplan);
      panel._scheduleCanvasRender();
    } else if (drag.type === "move_subzone") {
      const cam = (panel._floorplan?.cameras || []).find(
        (c) => (c.id || c.camera_entity) === drag.camId
      );
      const sz = (cam?.sub_zones || []).find((z) => z.id === drag.subZoneId);
      if (!sz) return;
      let nx = drag.startPos.x + dx;
      let ny = drag.startPos.y + dy;
      if (e.shiftKey) {
        nx = panel._snapValue(nx, 10);
        ny = panel._snapValue(ny, 10);
      }
      sz.x = Math.max(0, Math.min(960, Math.round(nx)));
      sz.y = Math.max(0, Math.min(540, Math.round(ny)));
      panel._compiledTopology = panel._compileFloorplanClient(panel._floorplan);
      panel._scheduleCanvasRender();
    } else if (drag.type === "resize_subzone") {
      const cam = (panel._floorplan?.cameras || []).find(
        (c) => (c.id || c.camera_entity) === drag.camId
      );
      const sz = (cam?.sub_zones || []).find((z) => z.id === drag.subZoneId);
      if (!sz) return;
      let nw = drag.startSize.width + dx;
      let nh = drag.startSize.height + dy;
      if (e.shiftKey) {
        nw = panel._snapValue(nw, 10);
        nh = panel._snapValue(nh, 10);
      }
      sz.width = Math.max(24, Math.min(400, Math.round(nw)));
      sz.height = Math.max(24, Math.min(400, Math.round(nh)));
      panel._compiledTopology = panel._compileFloorplanClient(panel._floorplan);
      panel._scheduleCanvasRender();
    } else if (drag.type === "move_door") {
      const box = (panel._floorplan?.rooms || []).find(
        (b) => (b.name || b.room_name) === drag.roomName
      );
      const ew = (box?.entryways || []).find((d) => d.id === drag.doorId);
      if (!box || !ew) return;
      const rx = Number(box.x);
      const ry = Number(box.y);
      const rw = Number(box.width ?? box.w ?? 200);
      const rh = Number(box.height ?? box.h ?? 150);
      if (drag.wall === "top" || drag.wall === "bottom") {
        let offset = pt.x - rx - ew.width / 2;
        offset = Math.max(0, Math.min(rw - ew.width, offset));
        if (!e.shiftKey) offset = panel._snapValue(offset, 5);
        ew.offset = offset;
      } else {
        let offset = pt.y - ry - ew.width / 2;
        offset = Math.max(0, Math.min(rh - ew.width, offset));
        if (!e.shiftKey) offset = panel._snapValue(offset, 5);
        ew.offset = offset;
      }
      panel._compiledTopology = panel._compileFloorplanClient(panel._floorplan);
      panel._scheduleCanvasRender();
    } else if (drag.type === "resize_door") {
      const box = (panel._floorplan?.rooms || []).find(
        (b) => (b.name || b.room_name) === drag.roomName
      );
      const ew = (box?.entryways || []).find((d) => d.id === drag.doorId);
      if (!box || !ew) return;
      const rx = Number(box.x);
      const ry = Number(box.y);
      const rw = Number(box.width ?? box.w ?? 200);
      const rh = Number(box.height ?? box.h ?? 150);
      if (drag.tab === "end") {
        if (drag.wall === "top" || drag.wall === "bottom") {
          let newWidth = pt.x - (rx + ew.offset);
          newWidth = Math.max(16, Math.min(rw - ew.offset, newWidth));
          if (!e.shiftKey) newWidth = panel._snapValue(newWidth, 5);
          ew.width = newWidth;
        } else {
          let newWidth = pt.y - (ry + ew.offset);
          newWidth = Math.max(16, Math.min(rh - ew.offset, newWidth));
          if (!e.shiftKey) newWidth = panel._snapValue(newWidth, 5);
          ew.width = newWidth;
        }
      } else if (drag.tab === "start") {
        if (drag.wall === "top" || drag.wall === "bottom") {
          const endX = rx + drag.startOffset + drag.startWidth;
          let newOffset = pt.x - rx;
          newOffset = Math.max(0, Math.min(drag.startOffset + drag.startWidth - 16, newOffset));
          if (!e.shiftKey) newOffset = panel._snapValue(newOffset, 5);
          ew.offset = newOffset;
          ew.width = endX - (rx + newOffset);
        } else {
          const endY = ry + drag.startOffset + drag.startWidth;
          let newOffset = pt.y - ry;
          newOffset = Math.max(0, Math.min(drag.startOffset + drag.startWidth - 16, newOffset));
          if (!e.shiftKey) newOffset = panel._snapValue(newOffset, 5);
          ew.offset = newOffset;
          ew.width = endY - (ry + newOffset);
        }
      }
      panel._compiledTopology = panel._compileFloorplanClient(panel._floorplan);
      panel._scheduleCanvasRender();
    }
}
