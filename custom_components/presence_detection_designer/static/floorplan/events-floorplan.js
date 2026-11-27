import { PDD_DEVICE_MODEL_PRESETS } from "../shared/defaults.js";
// Event bindings for floorplan toolbar, layers, camera/sensor/BLE inspector controls.

export function bindFloorplanEvents(panel, root) {
  // Floorplan view events
  root.querySelector("#toggle-blueprint-underlay")?.addEventListener("change", (e) => {
    const checked = Boolean(e.target.checked);
    panel._showBlueprintUnderlay = checked;
    panel._fpLayers = { ...(panel._fpLayers || {}), underlay: checked };
    panel._saveFpLayers();
    panel.render();
  });
  root.querySelectorAll("[data-fp-layer]").forEach((el) => {
    el.addEventListener("click", () => {
      const lid = el.getAttribute("data-fp-layer");
      if (!lid) return;
      const cur = panel._fpLayers?.[lid] !== false;
      panel._fpLayers = { ...(panel._fpLayers || {}), [lid]: !cur };
      if (lid === "underlay") panel._showBlueprintUnderlay = !cur;
      panel._saveFpLayers();
      panel.render();
    });
  });
  root.querySelectorAll("[data-fp-preset]").forEach((el) => {
    el.addEventListener("click", () => {
      const pr = el.getAttribute("data-fp-preset");
      const presetsMap = panel._getFpPresetsMap();
      if (presetsMap[pr]) {
        panel._fpLayers = { ...presetsMap[pr] };
        panel._showBlueprintUnderlay = panel._fpLayers.underlay;
        panel._saveFpLayers();
        panel.render();
      }
    });
  });
  root.querySelector("#blueprint-opacity-slider")?.addEventListener("input", (e) => {
    panel._underlayOpacity = Number(e.target.value) / 100.0;
    const img = root.querySelector("#fp-blueprint-underlay");
    if (img) {
      img.setAttribute("opacity", panel._underlayOpacity);
    }
  });
  root.querySelector("#blueprint-opacity-slider")?.addEventListener("change", (e) => {
    panel._underlayOpacity = Number(e.target.value) / 100.0;
    panel.render();
  });
  root.querySelectorAll(".seg-btn[data-floor-id]").forEach((el) => {
    el.addEventListener("click", () => {
      panel._selectedFloorId = el.getAttribute("data-floor-id") || "main";
      panel._selectedCamEntity = null;
      panel._selectedSensorId = null;
      panel._selectedBleProxyId = null;
      panel._selectedSubZoneId = null;
      panel._selectedRoomBoxName = null;
      panel._selectedDoorId = null;
      panel._selectedDeviceType = null;
      panel.render();
    });
  });
  root.querySelector("#btn-fp-mode-devices")?.addEventListener("click", () => {
    panel._floorplanMode = "devices";
    panel._selectedDoorId = null;
    if (panel._selectedDeviceType === "room") panel._selectedDeviceType = null;
    panel.render();
  });
  root.querySelector("#btn-fp-mode-rooms")?.addEventListener("click", () => {
    panel._floorplanMode = "rooms";
    panel._selectedDeviceType = "room";
    panel.render();
  });
  root.querySelector("#btn-fp-mode-cameras")?.addEventListener("click", () => {
    panel._floorplanMode = "cameras";
    panel._selectedDeviceType = "camera";
    panel._selectedDoorId = null;
    panel.render();
  });
  root.querySelector("#btn-fp-mode-sensors")?.addEventListener("click", () => {
    panel._floorplanMode = "sensors";
    panel._selectedDeviceType = "sensor";
    panel._selectedDoorId = null;
    panel.render();
  });
  root.querySelector("#btn-fp-lock-rooms")?.addEventListener("click", () => {
    panel._roomsLocked = !panel._roomsLocked;
    if (!panel._roomsLocked && panel._floorplanMode !== "rooms") {
      panel._floorplanMode = "rooms";
      panel._selectedDeviceType = "room";
    }
    panel.render();
  });
  root.querySelector("#btn-fp-undo")?.addEventListener("click", () => panel._undoFp());
  root.querySelector("#btn-fp-redo")?.addEventListener("click", () => panel._redoFp());
  root.querySelector("#btn-fp-reset-rooms")?.addEventListener("click", () =>
    panel._resetFloorplanRooms(true)
  );
  root.querySelector("#btn-fp-reset-all")?.addEventListener("click", () => {
    panel._pushFpUndo();
    panel.saveOrCompileFloorplan("reset");
  });
  root.querySelector("#btn-fp-save-top")?.addEventListener("click", () =>
    panel.saveOrCompileFloorplan("save")
  );
  root.querySelector("#btn-fp-reset-selected-room")?.addEventListener("click", (e) => {
    const rName = e.currentTarget.getAttribute("data-room");
    if (rName) panel._resetFloorplanRooms(false, rName);
  });
  root.querySelector("#fp-quick-cam-select")?.addEventListener("change", (e) => {
    panel._selectedCamEntity = e.target.value;
    panel._selectedDeviceType = "camera";
    panel._cameraAlignmentResult = null;
    panel._cameraAlignmentError = null;
    panel.render();
  });
  root.querySelector("#fp-quick-sensor-select")?.addEventListener("change", (e) => {
    panel._selectedSensorId = e.target.value;
    panel._selectedDeviceType = "sensor";
    panel.render();
  });
  root.querySelectorAll(".fp-nudge-ang").forEach((el) => {
    el.addEventListener("click", () => {
      const delta = Number(el.getAttribute("data-delta") || 0);
      const kind = el.getAttribute("data-kind");
      if (kind === "camera") panel._selectedDeviceType = "camera";
      else if (kind === "sensor") panel._selectedDeviceType = "sensor";
      panel._nudgeSelectedFloorplanItem(0, 0, delta);
      panel.render();
    });
  });
  root.querySelectorAll(".fp-quick-input").forEach((el) => {
    el.addEventListener("change", () => {
      const kind = el.getAttribute("data-kind");
      const key = el.getAttribute("data-key");
      const val = Number(el.value);
      if (!key || Number.isNaN(val) || !panel._floorplan) return;
      panel._pushFpUndo();
      if (kind === "camera") {
        const cam = (panel._floorplan.cameras || []).find(
          (c) => (c.id || c.camera_entity) === panel._selectedCamEntity
        );
        if (cam) {
          if ((key === "fov_deg" || key === "range_px") && panel._isSpecLocked(cam)) return;
          cam[key] = key === "heading_deg" ? ((Math.round(val) % 360) + 360) % 360 : val;
        }
      } else if (kind === "sensor") {
        const sen = (panel._floorplan.sensors || []).find((s) => s.id === panel._selectedSensorId);
        if (sen) {
          if ((key === "fov_deg" || key === "range_px") && panel._isSpecLocked(sen)) return;
          sen[key] = key === "heading_deg" ? ((Math.round(val) % 360) + 360) % 360 : val;
        }
      } else if (kind === "ble") {
        const bp = (panel._floorplan.ble_proxies || []).find((p) => p.id === panel._selectedBleProxyId);
        if (bp) {
          if (key === "radius_px" && panel._isSpecLocked(bp)) return;
          bp[key] = key === "radius_px" ? Math.max(30, Math.min(450, val)) : val;
        }
      } else if (kind === "subzone") {
        const cam = (panel._floorplan.cameras || []).find(
          (c) => (c.id || c.camera_entity) === panel._selectedCamEntity
        );
        const sz = (cam?.sub_zones || []).find((z) => z.id === panel._selectedSubZoneId);
        if (sz) sz[key] = key === "width" || key === "height" ? Math.max(24, val) : val;
      } else if (kind === "room" && !panel._roomsLocked) {
        const box = (panel._floorplan.rooms || []).find(
          (b) => (b.name || b.room_name) === panel._selectedRoomBoxName
        );
        if (box) {
          const sx = Number(box.x), sy = Number(box.y);
          const sw = Number(box.width ?? box.w ?? 200), sh = Number(box.height ?? box.h ?? 150);
          box[key] = val;
          const nx = Number(box.x), ny = Number(box.y);
          const nw = Math.max(40, Number(box.width ?? box.w ?? 200)), nh = Math.max(40, Number(box.height ?? box.h ?? 150));
          box.width = nw; box.height = nh;
          if (box.svg_path) {
            box.svg_path = panel._transformSvgPath(box.svg_path, sx, sy, sw, sh, nx, ny, nw, nh);
          }
        }
      }
      panel._compiledTopology = panel._compileFloorplanClient(panel._floorplan);
      panel._debounceSaveFloorplan();
      panel.render();
    });
  });
  root.querySelector("#fp-sensor-select")?.addEventListener("change", (e) => {
    panel._selectedSensorId = e.target.value;
    panel._selectedDeviceType = "sensor";
    panel.render();
  });
  root.querySelectorAll(".fp-sensor-field").forEach((el) => {
    el.addEventListener("change", () => {
      const key = el.getAttribute("data-key");
      const sensors = panel._floorplan?.sensors || [];
      const sen = sensors.find((s) => s.id === panel._selectedSensorId);
      if (!sen || !key) return;
      if ((key === "fov_deg" || key === "range_px") && panel._isSpecLocked(sen)) return;
      panel._pushFpUndo();
      if (["x", "y", "heading_deg", "fov_deg", "range_px"].includes(key)) {
        sen[key] = Number(el.value);
      } else {
        sen[key] = el.value;
      }
      panel._compiledTopology = panel._compileFloorplanClient(panel._floorplan);
      panel._debounceSaveFloorplan();
      panel.render();
    });
  });
  root.querySelector("#btn-fp-add-pir-sensor")?.addEventListener("click", () => {
    if (!panel._floorplan) return;
    panel._pushFpUndo();
    if (!Array.isArray(panel._floorplan.sensors)) panel._floorplan.sensors = [];
    const fRooms = (panel._floorplan.rooms || []).filter(
      (r) => (r.floor || "main") === panel._selectedFloorId
    );
    const hostRoom = fRooms[0]?.name || fRooms[0]?.room_name || "Living Room";
    const rx = Number(fRooms[0]?.x || 200) + 40;
    const ry = Number(fRooms[0]?.y || 200) + 40;
    const newId = "pir_" + Math.random().toString(36).substring(2, 8);
    panel._floorplan.sensors.push({
      id: newId,
      entity_id: `binary_sensor.${newId}_motion`,
      name: "New PIR Sensor",
      sensor_type: "pir_motion",
      floor: panel._selectedFloorId || "main",
      host_room: hostRoom,
      x: rx,
      y: ry,
      heading_deg: 90,
      fov_deg: 110,
      range_px: 180,
    });
    panel._selectedSensorId = newId;
    panel._selectedDeviceType = "sensor";
    if (panel._floorplanMode === "rooms" || panel._floorplanMode === "cameras") {
      panel._floorplanMode = "devices";
    }
    panel._compiledTopology = panel._compileFloorplanClient(panel._floorplan);
    panel._debounceSaveFloorplan();
    panel.render();
  });
  root.querySelector("#btn-fp-add-door-sensor")?.addEventListener("click", () => {
    if (!panel._floorplan) return;
    panel._pushFpUndo();
    if (!Array.isArray(panel._floorplan.sensors)) panel._floorplan.sensors = [];
    const fRooms = (panel._floorplan.rooms || []).filter(
      (r) => (r.floor || "main") === panel._selectedFloorId
    );
    const hostRoom = fRooms[0]?.name || fRooms[0]?.room_name || "Living Room";
    const rx = Number(fRooms[0]?.x || 200);
    const ry = Number(fRooms[0]?.y || 200) + 40;
    const newId = "door_sen_" + Math.random().toString(36).substring(2, 8);
    panel._floorplan.sensors.push({
      id: newId,
      entity_id: `binary_sensor.${newId}_opening`,
      name: "New Door Sensor",
      sensor_type: "door_contact",
      floor: panel._selectedFloorId || "main",
      host_room: hostRoom,
      x: rx,
      y: ry,
    });
    panel._selectedSensorId = newId;
    panel._selectedDeviceType = "sensor";
    if (panel._floorplanMode === "rooms" || panel._floorplanMode === "cameras") {
      panel._floorplanMode = "devices";
    }
    panel._compiledTopology = panel._compileFloorplanClient(panel._floorplan);
    panel._debounceSaveFloorplan();
    panel.render();
  });
  root.querySelector("#btn-fp-delete-sensor")?.addEventListener("click", (e) => {
    const sid = e.currentTarget.getAttribute("data-sensor-id");
    const sensors = panel._floorplan?.sensors || [];
    const idx = sensors.findIndex((s) => s.id === sid);
    if (idx >= 0) {
      panel._pushFpUndo();
      sensors.splice(idx, 1);
      panel._selectedSensorId = null;
      panel._compiledTopology = panel._compileFloorplanClient(panel._floorplan);
      panel._debounceSaveFloorplan();
      panel.render();
    }
  });
  root.querySelector("#btn-toggle-fp-inspector")?.addEventListener("click", () => {
    panel._showFloorplanInspector = !panel._showFloorplanInspector;
    panel.render();
  });
  root.querySelector("#btn-toggle-fp-notes")?.addEventListener("click", () => {
    panel._showFloorplanNotes = !panel._showFloorplanNotes;
    panel.render();
  });
  root.querySelectorAll("[data-focus-fp-cam]").forEach((el) => {
    el.addEventListener("click", () => {
      const camId = el.getAttribute("data-focus-fp-cam");
      const cam = (panel._floorplan?.cameras || []).find(
        (c) => (c.id || c.camera_entity) === camId || c.camera_entity === camId
      );
      if (cam) {
        if (cam.floor) panel._selectedFloorId = cam.floor;
        panel._selectedCamEntity = cam.id || cam.camera_entity;
        panel._selectedDeviceType = "camera";
        if (panel._floorplanMode === "sensors" || panel._floorplanMode === "rooms") {
          panel._floorplanMode = "cameras";
        }
        panel._fpLayers = { ...(panel._fpLayers || {}), cameras: true, subzones: true };
        panel._saveFpLayers();
        panel.render();
        panel.shadowRoot?.querySelector?.(".fp-canvas-wrap")?.scrollIntoView?.({ behavior: "smooth", block: "center" });
      }
    });
  });
  root.querySelectorAll("[data-jump-room-name]").forEach((el) => {
    el.addEventListener("click", () => {
      const rName = el.getAttribute("data-jump-room-name");
      const room = (panel._overview?.rooms || []).find((r) => r.room_name === rName);
      if (room) {
        panel._studioView = "design";
        panel._selectRoomObject(room, true);
      }
    });
  });
  root.querySelector("#btn-fp-save")?.addEventListener("click", () =>
    panel.saveOrCompileFloorplan("save")
  );
  root.querySelector("#btn-fp-reset")?.addEventListener("click", () =>
    panel.saveOrCompileFloorplan("reset")
  );
  root.querySelector("#btn-fp-compile")?.addEventListener("click", () =>
    panel.saveOrCompileFloorplan("compile_and_apply")
  );
  root.querySelector("#fp-cam-select")?.addEventListener("change", (e) => {
    panel._selectedCamEntity = e.target.value;
    panel._selectedDeviceType = "camera";
    panel._cameraAlignmentResult = null;
    panel._cameraAlignmentError = null;
    panel.render();
  });
  root.querySelector("#fp-cam-preset-select")?.addEventListener("change", (e) => {
    const presetId = e.target.value;
    const preset = typeof PDD_DEVICE_MODEL_PRESETS !== "undefined" ? PDD_DEVICE_MODEL_PRESETS[presetId] : null;
    const fCams = (panel._floorplan?.cameras || []).filter(
      (c) => (c.floor || "main") === panel._selectedFloorId
    );
    const selCamId =
      panel._selectedCamEntity ||
      root.querySelector("#fp-cam-select")?.value ||
      (fCams[0]?.id || fCams[0]?.camera_entity);
    const cam = (panel._floorplan?.cameras || []).find(
      (c) => (c.id || c.camera_entity) === selCamId
    );
    if (!cam) return;
    panel._pushFpUndo();
    if (preset) {
      cam.model_preset = preset.id;
      cam.fov_deg = Number(preset.fov_deg);
      if (preset.default_range_px) {
        cam.range_px = Number(preset.default_range_px);
      }
      panel.showToast(`Applied ${preset.label} preset (${preset.fov_deg}° FOV)`, "info");
    } else {
      delete cam.model_preset;
    }
    panel._compiledTopology = panel._compileFloorplanClient(panel._floorplan);
    panel._debounceSaveFloorplan();
    panel.render();
  });
  root.querySelector("#fp-sensor-preset-select")?.addEventListener("change", (e) => {
    const presetId = e.target.value;
    const preset = typeof PDD_DEVICE_MODEL_PRESETS !== "undefined" ? PDD_DEVICE_MODEL_PRESETS[presetId] : null;
    const fSensors = (panel._floorplan?.sensors || []).filter(
      (s) => (s.floor || "main") === panel._selectedFloorId
    );
    const selSenId =
      panel._selectedSensorId ||
      root.querySelector("#fp-sensor-select")?.value ||
      fSensors[0]?.id;
    const sen = (panel._floorplan?.sensors || []).find((s) => s.id === selSenId);
    if (!sen) return;
    panel._pushFpUndo();
    if (preset) {
      sen.model_preset = preset.id;
      if (preset.fov_deg) {
        sen.fov_deg = Number(preset.fov_deg);
      }
      if (preset.default_range_px) {
        sen.range_px = Number(preset.default_range_px);
      }
      if (preset.inner_fov_deg && preset.inner_range_px) {
        sen.inner_fov_deg = Number(preset.inner_fov_deg);
        sen.inner_range_px = Number(preset.inner_range_px);
      } else {
        delete sen.inner_fov_deg;
        delete sen.inner_range_px;
      }
      const label = preset.label || preset.name || preset.id;
      panel.showToast(
        preset.fov_deg ? `Applied ${label} (${preset.fov_deg}° FOV)` : `Applied ${label}`,
        "info"
      );
    } else {
      delete sen.model_preset;
      delete sen.inner_fov_deg;
      delete sen.inner_range_px;
    }
    panel._compiledTopology = panel._compileFloorplanClient(panel._floorplan);
    panel._debounceSaveFloorplan();
    panel.render();
  });
  root.querySelector("#btn-fp-analyze-camera")?.addEventListener("click", () => {
    const fCams = (panel._floorplan?.cameras || []).filter(
      (c) => (c.floor || "main") === panel._selectedFloorId
    );
    const selCamId =
      panel._selectedCamEntity ||
      root.querySelector("#fp-cam-select")?.value ||
      (fCams[0]?.id || fCams[0]?.camera_entity);
    if (selCamId) {
      panel._analyzeCameraAlignment(selCamId);
    }
  });
  root.querySelector("#btn-fp-apply-calibrated-heading")?.addEventListener("click", () => {
    const res = panel._cameraAlignmentResult;
    if (!res || res.recommended_heading_deg === undefined) return;
    const selCamId = res.camera_id || panel._selectedCamEntity;
    const cam = (panel._floorplan?.cameras || []).find(
      (c) => (c.id || c.camera_entity) === selCamId
    );
    if (cam) {
      panel._pushFpUndo();
      cam.heading_deg = Math.round(res.recommended_heading_deg);
      panel._compiledTopology = panel._compileFloorplanClient(panel._floorplan);
      panel._scheduleCanvasRender();
      panel._debounceSaveFloorplan();
      panel.showToast(`Calibrated camera heading to ${cam.heading_deg}°`, "success");
      panel.render();
    }
  });

}
