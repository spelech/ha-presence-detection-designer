import { PDD_DEVICE_MODEL_PRESETS } from "../shared/defaults.js";
// Floorplan floor-context resolver, HUD strip, camera alignment details, and quick adjust bar.


export function getActiveFloorContext(panel, selRoom) {
  const fp = panel._floorplan || panel._overview?.floorplan;
  const floors = fp?.floors || [];
  const activeFloor = floors.find((f) => f.id === panel._selectedFloorId) || floors[1] || floors[0];
  if (activeFloor) panel._selectedFloorId = activeFloor.id;
  const allFpRooms = fp?.rooms || [];
  const allFpConns = fp?.connections || [];
  const allFpCams = fp?.cameras || [];
  const allFpSensors = fp?.sensors || [];
  const allFpProxies = fp?.ble_proxies || [];

  const fRooms = activeFloor
    ? activeFloor.rooms || allFpRooms.filter((r) => r.floor === activeFloor.id)
    : [];
  const floorRoomNames = new Set(fRooms.map((r) => r.name || r.room_name));
  const fConns = activeFloor
    ? activeFloor.connections ||
      allFpConns.filter((c) => floorRoomNames.has(c.from_room) || floorRoomNames.has(c.to_room))
    : [];
  const fCams = activeFloor
    ? activeFloor.cameras || allFpCams.filter((c) => c.floor === activeFloor.id)
    : [];
  const fSensors = activeFloor ? allFpSensors.filter((s) => s.floor === activeFloor.id) : [];
  const fProxies = activeFloor ? allFpProxies.filter((p) => p.floor === activeFloor.id) : [];

  if (
    fSensors.length > 0 &&
    (!panel._selectedSensorId || !fSensors.some((s) => s.id === panel._selectedSensorId))
  ) {
    panel._selectedSensorId = fSensors[0].id;
  }
  const selSensor = fSensors.find((s) => s.id === panel._selectedSensorId) || fSensors[0] || null;

  if (
    fCams.length > 0 &&
    (!panel._selectedCamEntity ||
      !fCams.some((c) => (c.id || c.camera_entity) === panel._selectedCamEntity))
  ) {
    panel._selectedCamEntity = fCams[0].id || fCams[0].camera_entity;
  }
  const selCam =
    fCams.find((c) => (c.id || c.camera_entity) === panel._selectedCamEntity) || fCams[0] || null;

  if (
    fProxies.length > 0 &&
    (!panel._selectedBleProxyId || !fProxies.some((p) => p.id === panel._selectedBleProxyId))
  ) {
    panel._selectedBleProxyId = fProxies[0].id;
  }
  const selBleProxy =
    fProxies.find((p) => p.id === panel._selectedBleProxyId) || fProxies[0] || null;

  const selBox =
    fRooms.find(
      (b) =>
        (panel._selectedRoomBoxName && (b.name || b.room_name) === panel._selectedRoomBoxName) ||
        (selRoom && (b.name || b.room_name) === selRoom.room_name)
    ) ||
    fRooms[0] ||
    null;
  if (selBox) {
    panel._selectedRoomBoxName = selBox.name || selBox.room_name;
  }

  if (!panel._selectedDeviceType) {
    if (panel._floorplanMode === "rooms") panel._selectedDeviceType = "room";
    else if (panel._floorplanMode === "sensors") panel._selectedDeviceType = selSensor ? "sensor" : selBleProxy ? "ble" : "room";
    else if (selCam) panel._selectedDeviceType = "camera";
    else if (selSensor) panel._selectedDeviceType = "sensor";
    else if (selBleProxy) panel._selectedDeviceType = "ble";
    else panel._selectedDeviceType = "room";
  }

  return {
    fp,
    floors,
    activeFloor,
    fRooms,
    fConns,
    fCams,
    fSensors,
    fProxies,
    selSensor,
    selCam,
    selBleProxy,
    selBox,
  };
}


export function isSpecLocked(panel, item) {
  return Boolean(
    item &&
      item.model_preset &&
      typeof PDD_DEVICE_MODEL_PRESETS !== "undefined" &&
      PDD_DEVICE_MODEL_PRESETS[item.model_preset]
  );
}


export function buildFloorplanHudHtml(panel, ctx) {
  const mode = panel._floorplanMode;
  const drag = panel._activeFpDrag;
  const snapHint =
    mode === "rooms"
      ? "Hold Shift for 1px fine move"
      : "Smooth 1°/1px · Hold Shift to snap 15°/10px";

  if (drag) {
    if (drag.type === "move_cam" || drag.type === "cam_handle") {
      const cam = (panel._floorplan?.cameras || []).find(
        (c) => (c.id || c.camera_entity) === drag.camId
      );
      if (cam) {
        return `<span><strong>📹 ${panel._escape(cam.name || drag.camId)}</strong> · (${Math.round(cam.x)}, ${Math.round(cam.y)}) · Heading <strong>${Math.round(cam.heading_deg || 0)}°</strong> · FOV ${Math.round(cam.fov_deg || 90)}° · Range ${Math.round(cam.range_px || 180)}px</span><span>${snapHint}</span>`;
      }
    } else if (drag.type === "move_sensor" || drag.type === "sensor_handle") {
      const sen = (panel._floorplan?.sensors || []).find((s) => s.id === drag.sensorId);
      if (sen) {
        const stats =
          sen.sensor_type === "door_contact"
            ? `(${Math.round(sen.x)}, ${Math.round(sen.y)})`
            : `(${Math.round(sen.x)}, ${Math.round(sen.y)}) · Heading <strong>${Math.round(sen.heading_deg || 0)}°</strong> · FOV ${Math.round(sen.fov_deg || 110)}° · Range ${Math.round(sen.range_px || 180)}px`;
        return `<span><strong>${sen.sensor_type === "door_contact" ? "🚪" : "📡"} ${panel._escape(sen.name || sen.id)}</strong> · ${stats}</span><span>${snapHint}</span>`;
      }
    } else if (drag.type === "move_ble" || drag.type === "ble_radius") {
      const bp = (panel._floorplan?.ble_proxies || []).find((p) => p.id === drag.proxyId);
      if (bp) {
        return `<span><strong>📶 ${panel._escape(bp.name || bp.id)}</strong> · (${Math.round(bp.x)}, ${Math.round(bp.y)}) · Radius <strong>${Math.round(bp.radius_px || 200)}px</strong></span><span>${snapHint}</span>`;
      }
    } else if (drag.type === "move_subzone" || drag.type === "resize_subzone") {
      const cam = (panel._floorplan?.cameras || []).find(
        (c) => (c.id || c.camera_entity) === drag.camId
      );
      const sz = (cam?.sub_zones || []).find((z) => z.id === drag.subZoneId);
      if (sz) {
        return `<span><strong>🎯 ${panel._escape(sz.label || sz.id)}</strong> · (${Math.round(sz.x)}, ${Math.round(sz.y)}) · ${Math.round(sz.width)}×${Math.round(sz.height)}</span><span>${snapHint}</span>`;
      }
    } else if (drag.type === "move_room" || drag.type === "resize_room") {
      const box = (panel._floorplan?.rooms || []).find(
        (b) => (b.name || b.room_name) === drag.roomName
      );
      if (box) {
        return `<span><strong>🏠 ${panel._escape(drag.roomName)}</strong> · (${Math.round(box.x)}, ${Math.round(box.y)}) · ${Math.round(box.width ?? box.w ?? 200)}×${Math.round(box.height ?? box.h ?? 150)}</span><span>${snapHint}</span>`;
      }
    }
  }

  const focusedName = panel.selectedRoom?.room_name || ctx.selBox?.name || ctx.selBox?.room_name || "";
  const focusTag = focusedName ? ` · Focused: <strong>${panel._escape(focusedName)}</strong>` : "";
  if (mode === "rooms") {
    if (panel._roomsLocked) {
      return `<span><strong>🏠 Rooms Locked</strong> — Click a room to inspect or adjust doors. Click <strong>🔓 Rooms Unlocked</strong> to move/resize boxes.${focusTag}</span><span>Ctrl+Z to Undo</span>`;
    }
    return `<span><strong>🔓 Editing Room Boxes</strong> — Drag rooms or corners (polygons stay intact). Lock rooms again when finished.${focusTag}</span><span>${snapHint}</span>`;
  }
  if (mode === "cameras") {
    return `<span><strong>📹 Camera Mode</strong> — Drag any camera pin, its <strong>LOS arrow</strong> (rotate), <strong>tip square</strong> (range), cone edges (FOV), or sub-zones.${focusTag}</span><span>Arrow keys nudge · [ ] rotate</span>`;
  }
  if (mode === "sensors") {
    return `<span><strong>📡 Sensor Mode</strong> — Drag PIR, door, or BLE pins &amp; <strong>LOS vector handles</strong> freely; rooms cannot be moved here.${focusTag}</span><span>Arrow keys nudge · [ ] rotate</span>`;
  }
  return `<span><strong>🎯 Devices Mode (Rooms Locked)</strong> — Click any camera, PIR, door sensor, BLE proxy, or sub-zone to move or aim its <strong>LOS vector</strong>.${focusTag}</span><span>Arrow keys nudge · [ ] rotate</span>`;
}


export function renderCameraAlignmentDetails(panel, selCam) {
  if (panel._analyzingCamera) {
    return `
      <div style="padding:16px;text-align:center;color:var(--ha-muted);font-size:12px;">
        <div style="margin-bottom:6px;font-weight:600;">🔍 Processing snapshot computer vision...</div>
        <div style="font-size:11px;">Estimating horizon vanishing line, tilt/pitch angle &amp; doorway azimuth rays.</div>
      </div>
    `;
  }

  if (panel._cameraAlignmentError) {
    return `
      <div style="padding:10px;background:rgba(185, 28, 28, 0.12);border:1px solid var(--ha-danger-text);border-radius:6px;color:var(--ha-danger-text);font-size:12px;margin-top:6px;">
        <strong>Alignment Error:</strong> ${panel._escape(panel._cameraAlignmentError)}
      </div>
    `;
  }

  const res = panel._cameraAlignmentResult;
  if (!res || !res.success) {
    return `
      <div style="font-size:12px;color:var(--ha-muted);margin-top:4px;">
        Click <strong>Analyze Alignment</strong> to evaluate this camera's vertical pitch (downward tilt) and horizontal sightline to doorways, computing the optimal 2D cone heading.
      </div>
    `;
  }

  const openings = Array.isArray(res.openings) ? res.openings : [];
  const diffHeading = Math.round((res.recommended_heading_deg - res.current_heading_deg) * 10) / 10;
  const diffSign = diffHeading > 0 ? `+${diffHeading}°` : `${diffHeading}°`;

  return `
    <div style="display:flex;flex-direction:column;gap:10px;margin-top:8px;">
      ${
        res.annotated_image
          ? `<div style="text-align:center;background:#0f172a;border-radius:6px;overflow:hidden;border:1px solid var(--ha-divider);">
               <img src="${res.annotated_image}" style="max-width:100%;max-height:240px;object-fit:contain;display:block;margin:0 auto;" alt="Annotated Camera Alignment" />
             </div>`
          : ""
      }
      <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:8px;text-align:center;font-size:12px;">
        <div style="background:var(--ha-subtle, #f1f5f9);padding:8px 6px;border-radius:6px;border:1px solid var(--ha-divider);">
          <div style="color:var(--ha-muted);font-size:11px;">Vertical Tilt / Pitch</div>
          <div style="font-weight:700;font-size:14px;color:var(--ha-primary-text);">${res.tilt_deg > 0 ? "+" : ""}${res.tilt_deg}°</div>
          <div style="font-size:10px;color:var(--ha-muted);">${res.tilt_deg < 0 ? "Angled Down" : "Level/Up"}</div>
        </div>
        <div style="background:var(--ha-subtle, #f1f5f9);padding:8px 6px;border-radius:6px;border:1px solid var(--ha-divider);">
          <div style="color:var(--ha-muted);font-size:11px;">Camera Roll</div>
          <div style="font-weight:700;font-size:14px;color:var(--ha-primary-text);">${res.roll_deg > 0 ? "+" : ""}${res.roll_deg}°</div>
          <div style="font-size:10px;color:var(--ha-muted);">Horizon Level</div>
        </div>
        <div style="background:var(--ha-subtle, #f1f5f9);padding:8px 6px;border-radius:6px;border:1px solid var(--ha-divider);">
          <div style="color:var(--ha-muted);font-size:11px;">Cone Alignment</div>
          <div style="font-weight:700;font-size:14px;color:${Math.abs(diffHeading) > 3 ? "var(--ha-warning-text)" : "var(--ha-success-text)"};">
            ${res.recommended_heading_deg}° <span style="font-size:11px;font-weight:500;">(Δ ${diffSign})</span>
          </div>
          <div style="font-size:10px;color:var(--ha-muted);">2D Cone: ${res.current_heading_deg}°</div>
        </div>
      </div>

      ${
        openings.length > 0
          ? `
        <div style="font-size:11.5px;border:1px solid var(--ha-divider);border-radius:6px;overflow:hidden;">
          <div style="background:var(--ha-subtle, #f1f5f9);padding:6px 10px;font-weight:600;display:flex;justify-content:space-between;">
            <span>Detected Physical Openings</span>
            <span>Visual vs Expected Azimuth</span>
          </div>
          ${openings
            .map(
              (op) => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px;border-top:1px solid var(--ha-divider);">
              <div>
                <strong style="color:var(--ha-primary-text);">${panel._escape(op.target_room || op.entryway_id || "Passage")}</strong>
                <span style="font-size:10px;color:var(--ha-muted);margin-left:4px;">(Bearing: ${op.bearing_deg ?? "—"}°)</span>
              </div>
              <div style="text-align:right;">
                <span>Azimuth: <strong>${op.azimuth_deg > 0 ? "+" : ""}${op.azimuth_deg}°</strong></span>
                ${
                  op.discrepancy_deg !== undefined
                    ? `<span style="margin-left:6px;color:${Math.abs(op.discrepancy_deg) > 3 ? "var(--ha-warning-text)" : "var(--ha-success-text)"};font-weight:600;">(Δ ${op.discrepancy_deg > 0 ? "+" : ""}${op.discrepancy_deg}°)</span>`
                    : ""
                }
              </div>
            </div>`
            )
            .join("")}
        </div>`
          : `<div style="font-size:11.5px;color:var(--ha-muted);text-align:center;padding:4px;">No distinct doorway openings matched in current FOV cone.</div>`
      }

      <button class="btn btn-sm btn-primary" id="btn-fp-apply-calibrated-heading" style="padding:7px 12px;font-size:12px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:6px;">
        <span>🎯 Auto-Calibrate 2D Heading to Physical Reality (${res.recommended_heading_deg}°)</span>
      </button>
    </div>
  `;
}


export function renderQuickAdjustBar(panel, ctx) {
  const { selCam, selSensor, selBleProxy, selBox, fCams } = ctx;
  const dtype = panel._selectedDeviceType;

  if (dtype === "camera" && selCam) {
    const camId = selCam.id || selCam.camera_entity;
    return `
      <div class="fp-quick-bar" id="fp-quick-bar">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span style="font-size:12.5px;font-weight:700;color:#0284c7;">📹 ${panel._escape(selCam.name || camId)}</span>
          <select class="select" id="fp-quick-cam-select" style="width:auto;padding:3px 8px;font-size:12px;">
            ${fCams.map((c) => {
              const cid = c.id || c.camera_entity;
              return `<option value="${panel._escape(cid)}" ${cid === camId ? "selected" : ""}>${panel._escape(c.name || cid)}</option>`;
            }).join("")}
          </select>
        </div>
        <div class="fp-quick-fields">
          <div class="fp-quick-field"><small>X</small><input type="number" class="input fp-quick-input" data-kind="camera" data-key="x" value="${Math.round(selCam.x || 0)}" /></div>
          <div class="fp-quick-field"><small>Y</small><input type="number" class="input fp-quick-input" data-kind="camera" data-key="y" value="${Math.round(selCam.y || 0)}" /></div>
          <div class="fp-quick-field">
            <small>LOS Angle°</small>
            <div class="fp-nudge-group">
              <button type="button" class="btn btn-sm fp-nudge-ang" data-kind="camera" data-delta="-5" title="Rotate -5°">-5°</button>
              <input type="number" class="input fp-quick-input" data-kind="camera" data-key="heading_deg" value="${Math.round(selCam.heading_deg || 0)}" style="width:54px;" />
              <button type="button" class="btn btn-sm fp-nudge-ang" data-kind="camera" data-delta="5" title="Rotate +5°">+5°</button>
            </div>
          </div>
          <div class="fp-quick-field"><small>FOV°</small><input type="number" class="input fp-quick-input" data-kind="camera" data-key="fov_deg" value="${Math.round(selCam.fov_deg || 90)}" ${panel._isSpecLocked(selCam) ? 'disabled title="Locked to hardware preset spec"' : ""} /></div>
          <div class="fp-quick-field"><small>Range</small><input type="number" class="input fp-quick-input" data-kind="camera" data-key="range_px" value="${Math.round(selCam.range_px || 180)}" ${panel._isSpecLocked(selCam) ? 'disabled title="Locked to hardware preset spec"' : ""} /></div>
        </div>
      </div>
    `;
  }

  if (dtype === "sensor" && selSensor) {
    const isDoor = selSensor.sensor_type === "door_contact";
    return `
      <div class="fp-quick-bar" id="fp-quick-bar">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span style="font-size:12.5px;font-weight:700;color:${isDoor ? "#ea580c" : "#9333ea"};">${isDoor ? "🚪" : "📡"} ${panel._escape(selSensor.name || selSensor.id)}</span>
          <select class="select" id="fp-quick-sensor-select" style="width:auto;padding:3px 8px;font-size:12px;">
            ${ctx.fSensors.map((s) => `<option value="${panel._escape(s.id)}" ${s.id === selSensor.id ? "selected" : ""}>${s.sensor_type === "door_contact" ? "🚪" : "📡"} ${panel._escape(s.name || s.id)}</option>`).join("")}
          </select>
        </div>
        <div class="fp-quick-fields">
          <div class="fp-quick-field"><small>X</small><input type="number" class="input fp-quick-input" data-kind="sensor" data-key="x" value="${Math.round(selSensor.x || 0)}" /></div>
          <div class="fp-quick-field"><small>Y</small><input type="number" class="input fp-quick-input" data-kind="sensor" data-key="y" value="${Math.round(selSensor.y || 0)}" /></div>
          ${
            isDoor
              ? ""
              : `
            <div class="fp-quick-field">
              <small>LOS Angle°</small>
              <div class="fp-nudge-group">
                <button type="button" class="btn btn-sm fp-nudge-ang" data-kind="sensor" data-delta="-5">-5°</button>
                <input type="number" class="input fp-quick-input" data-kind="sensor" data-key="heading_deg" value="${Math.round(selSensor.heading_deg || 0)}" style="width:54px;" />
                <button type="button" class="btn btn-sm fp-nudge-ang" data-kind="sensor" data-delta="5">+5°</button>
              </div>
            </div>
            <div class="fp-quick-field"><small>FOV°</small><input type="number" class="input fp-quick-input" data-kind="sensor" data-key="fov_deg" value="${Math.round(selSensor.fov_deg || 110)}" ${panel._isSpecLocked(selSensor) ? 'disabled title="Locked to hardware preset spec"' : ""} /></div>
            <div class="fp-quick-field"><small>Range</small><input type="number" class="input fp-quick-input" data-kind="sensor" data-key="range_px" value="${Math.round(selSensor.range_px || 180)}" ${panel._isSpecLocked(selSensor) ? 'disabled title="Locked to hardware preset spec"' : ""} /></div>
          `
          }
        </div>
      </div>
    `;
  }

  if (dtype === "ble" && selBleProxy) {
    return `
      <div class="fp-quick-bar" id="fp-quick-bar">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span style="font-size:12.5px;font-weight:700;color:#0d9488;">📶 ${panel._escape(selBleProxy.name || selBleProxy.id)}</span>
        </div>
        <div class="fp-quick-fields">
          <div class="fp-quick-field"><small>X</small><input type="number" class="input fp-quick-input" data-kind="ble" data-key="x" value="${Math.round(selBleProxy.x || 0)}" /></div>
          <div class="fp-quick-field"><small>Y</small><input type="number" class="input fp-quick-input" data-kind="ble" data-key="y" value="${Math.round(selBleProxy.y || 0)}" /></div>
          <div class="fp-quick-field"><small>Radius</small><input type="number" class="input fp-quick-input" data-kind="ble" data-key="radius_px" value="${Math.round(selBleProxy.radius_px || 200)}" ${panel._isSpecLocked(selBleProxy) ? 'disabled title="Locked to hardware preset spec"' : ""} /></div>
        </div>
      </div>
    `;
  }

  if (dtype === "subzone" && panel._selectedSubZoneId) {
    const cam = fCams.find((c) => (c.id || c.camera_entity) === panel._selectedCamEntity);
    const sz = (cam?.sub_zones || []).find((z) => z.id === panel._selectedSubZoneId);
    if (sz) {
      return `
        <div class="fp-quick-bar" id="fp-quick-bar">
          <span style="font-size:12.5px;font-weight:700;color:#0369a1;">🎯 Sub-Zone: ${panel._escape(sz.label || sz.id)}</span>
          <div class="fp-quick-fields">
            <div class="fp-quick-field"><small>X</small><input type="number" class="input fp-quick-input" data-kind="subzone" data-key="x" value="${Math.round(sz.x || 0)}" /></div>
            <div class="fp-quick-field"><small>Y</small><input type="number" class="input fp-quick-input" data-kind="subzone" data-key="y" value="${Math.round(sz.y || 0)}" /></div>
            <div class="fp-quick-field"><small>Width</small><input type="number" class="input fp-quick-input" data-kind="subzone" data-key="width" value="${Math.round(sz.width || 60)}" /></div>
            <div class="fp-quick-field"><small>Height</small><input type="number" class="input fp-quick-input" data-kind="subzone" data-key="height" value="${Math.round(sz.height || 60)}" /></div>
          </div>
        </div>
      `;
    }
  }

  if (selBox) {
    const rName = selBox.name || selBox.room_name;
    return `
      <div class="fp-quick-bar" id="fp-quick-bar">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span style="font-size:12.5px;font-weight:700;">🏠 ${panel._escape(rName)}</span>
          <span style="font-size:11.5px;color:var(--ha-muted);">${panel._roomsLocked ? "🔒 Locked against accidental drag" : "🔓 Unlocked"}</span>
        </div>
        <div class="fp-quick-fields">
          <div class="fp-quick-field"><small>X</small><input type="number" class="input fp-quick-input" data-kind="room" data-key="x" value="${Math.round(selBox.x || 0)}" ${panel._roomsLocked ? "disabled" : ""} /></div>
          <div class="fp-quick-field"><small>Y</small><input type="number" class="input fp-quick-input" data-kind="room" data-key="y" value="${Math.round(selBox.y || 0)}" ${panel._roomsLocked ? "disabled" : ""} /></div>
          <div class="fp-quick-field"><small>Width</small><input type="number" class="input fp-quick-input" data-kind="room" data-key="width" value="${Math.round(selBox.width ?? 200)}" ${panel._roomsLocked ? "disabled" : ""} /></div>
          <div class="fp-quick-field"><small>Height</small><input type="number" class="input fp-quick-input" data-kind="room" data-key="height" value="${Math.round(selBox.height ?? 150)}" ${panel._roomsLocked ? "disabled" : ""} /></div>
          <button type="button" class="btn btn-sm" id="btn-fp-reset-selected-room" data-room="${panel._escape(rName)}" title="Restore this room's exact default shape & position">↺ Restore Room</button>
        </div>
      </div>
    `;
  }
  return "";
}

