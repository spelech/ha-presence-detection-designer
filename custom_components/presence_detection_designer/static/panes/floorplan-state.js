import { PDD_DEFAULT_FLOORPLAN } from "../components/defaults.js";
// Floorplan editor state, undo/redo history, keyboard nudging, and presets.


export function loadFpLayers(panel) {
  const defaults = {
    underlay: true,
    rooms: true,
    cameras: true,
    subzones: true,
    pir: true,
    doors: true,
    ble: false,
    connections: false,
    overlaps: true,
    occupants: true,
  };
  try {
    const raw = localStorage.getItem("pdd_fp_layers_v1");
    if (raw) {
      return { ...defaults, ...JSON.parse(raw) };
    }
  } catch (_e) {}
  return defaults;
}


export function saveFpLayers(panel) {
  try {
    localStorage.setItem("pdd_fp_layers_v1", JSON.stringify(panel._fpLayers || {}));
  } catch (_e) {}
}


export function getDefaultFloorplan(panel) {
  return JSON.parse(JSON.stringify(PDD_DEFAULT_FLOORPLAN));
}


export function loadLocalOrDefaultFloorplan(panel) {
  try {
    const saved = window.localStorage.getItem("pdd_floorplan_layout_v4");
    if (saved) {
      const parsed = JSON.loads ? JSON.loads(saved) : JSON.parse(saved);
      if (parsed && Array.isArray(parsed.floors) && Array.isArray(parsed.rooms)) {
        return parsed;
      }
    }
  } catch (_e) {
    // ignore storage errors
  }
  return panel._getDefaultFloorplan();
}


export function pushFpUndo(panel, snapshotJson = null) {
  if (!panel._floorplan) return;
  try {
    const snap = snapshotJson || JSON.stringify(panel._floorplan);
    if (panel._fpUndoStack.length > 0 && panel._fpUndoStack[panel._fpUndoStack.length - 1] === snap) {
      return;
    }
    panel._fpUndoStack.push(snap);
    if (panel._fpUndoStack.length > 50) {
      panel._fpUndoStack.shift();
    }
    panel._fpRedoStack = [];
    panel._fpDirty = true;
  } catch (_e) {}
}


export function undoFp(panel) {
  if (!panel._fpUndoStack || panel._fpUndoStack.length === 0) return;
  try {
    const current = panel._floorplan ? JSON.stringify(panel._floorplan) : null;
    const prev = panel._fpUndoStack.pop();
    if (!prev) return;
    if (current) panel._fpRedoStack.push(current);
    panel._floorplan = JSON.parse(prev);
    panel._fpDirty = true;
    panel._compiledTopology = panel._compileFloorplanClient(panel._floorplan);
    panel._debounceSaveFloorplan();
    panel.render();
    panel.showToast("Undid last floorplan change", "info");
  } catch (_e) {}
}


export function redoFp(panel) {
  if (!panel._fpRedoStack || panel._fpRedoStack.length === 0) return;
  try {
    const current = panel._floorplan ? JSON.stringify(panel._floorplan) : null;
    const next = panel._fpRedoStack.pop();
    if (!next) return;
    if (current) panel._fpUndoStack.push(current);
    panel._floorplan = JSON.parse(next);
    panel._fpDirty = true;
    panel._compiledTopology = panel._compileFloorplanClient(panel._floorplan);
    panel._debounceSaveFloorplan();
    panel.render();
    panel.showToast("Redid floorplan change", "info");
  } catch (_e) {}
}


export function resetFloorplanRooms(panel, floorOnly = true, singleRoomName = null) {
  if (!panel._floorplan || typeof PDD_DEFAULT_FLOORPLAN === "undefined") return;
  const defRooms = PDD_DEFAULT_FLOORPLAN.rooms || [];
  const activeFloorId = panel._selectedFloorId || "main";
  panel._pushFpUndo();
  const rooms = panel._floorplan.rooms || [];
  let restored = 0;
  for (let i = 0; i < rooms.length; i++) {
    const r = rooms[i];
    const rName = r.name || r.room_name;
    if (singleRoomName && rName !== singleRoomName) continue;
    if (!singleRoomName && floorOnly && (r.floor || "main") !== activeFloorId) continue;
    const def = defRooms.find(
      (d) => (d.id && d.id === r.id) || (d.name || d.room_name) === rName
    );
    if (!def) continue;
    const clone = JSON.parse(JSON.stringify(def));
    rooms[i] = clone;
    restored++;
  }
  panel._compiledTopology = panel._compileFloorplanClient(panel._floorplan);
  panel._debounceSaveFloorplan();
  panel.render();
  panel.showToast(
    singleRoomName
      ? `Restored ${singleRoomName} to exact default blueprint`
      : `Restored ${restored} rooms on this floor (sensors & cameras preserved)`,
    "info"
  );
}


export function nudgeSelectedFloorplanItem(panel, dx, dy, dHeading = 0) {
  if (!panel._floorplan) return;
  const activeFloorId = panel._selectedFloorId || "main";
  const dtype = panel._selectedDeviceType;
  let target = null;
  let kind = dtype;
  if (kind === "camera" || (!kind && panel._selectedCamEntity)) {
    target = (panel._floorplan.cameras || []).find(
      (c) => (c.id || c.camera_entity) === panel._selectedCamEntity && (c.floor || "main") === activeFloorId
    );
    kind = "camera";
  } else if (kind === "sensor" || (!kind && panel._selectedSensorId)) {
    target = (panel._floorplan.sensors || []).find(
      (s) => s.id === panel._selectedSensorId && (s.floor || "main") === activeFloorId
    );
    kind = "sensor";
  } else if (kind === "ble" || (!kind && panel._selectedBleProxyId)) {
    target = (panel._floorplan.ble_proxies || []).find(
      (p) => p.id === panel._selectedBleProxyId && (p.floor || "main") === activeFloorId
    );
    kind = "ble";
  } else if (kind === "subzone" && panel._selectedSubZoneId) {
    const cam = (panel._floorplan.cameras || []).find(
      (c) => (c.id || c.camera_entity) === panel._selectedCamEntity
    );
    target = (cam?.sub_zones || []).find((z) => z.id === panel._selectedSubZoneId);
  } else if (kind === "room" && panel._floorplanMode === "rooms" && !panel._roomsLocked && panel._selectedRoomBoxName) {
    target = (panel._floorplan.rooms || []).find(
      (b) => (b.name || b.room_name) === panel._selectedRoomBoxName
    );
  }
  if (!target) return;
  panel._pushFpUndo();
  if (dx || dy) {
    const nx = Math.max(0, Math.min(990, Number(target.x || 0) + dx));
    const ny = Math.max(0, Math.min(570, Number(target.y || 0) + dy));
    if (kind === "room" && target.svg_path) {
      const rw = Number(target.width ?? target.w ?? 200);
      const rh = Number(target.height ?? target.h ?? 150);
      target.svg_path = panel._transformSvgPath(target.svg_path, Number(target.x), Number(target.y), rw, rh, nx, ny, rw, rh);
    }
    target.x = nx;
    target.y = ny;
  }
  if (dHeading && (kind === "camera" || (kind === "sensor" && target.sensor_type !== "door_contact"))) {
    target.heading_deg = (Math.round(Number(target.heading_deg || 0) + dHeading) % 360 + 360) % 360;
  }
  panel._compiledTopology = panel._compileFloorplanClient(panel._floorplan);
  panel._debounceSaveFloorplan();
  panel._updateFloorplanCanvasInPlace();
  panel._syncQuickBarValuesInPlace();
}


export function handleFloorplanKeyDown(panel, e) {
  if (panel._studioView !== "floorplan") return;
  const active = panel.shadowRoot?.activeElement || document.activeElement;
  if (active && ["INPUT", "TEXTAREA", "SELECT"].includes(active.tagName)) return;
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) {
    e.preventDefault();
    panel._undoFp();
    return;
  }
  if ((mod && e.key.toLowerCase() === "z" && e.shiftKey) || (mod && e.key.toLowerCase() === "y")) {
    e.preventDefault();
    panel._redoFp();
    return;
  }
  const step = e.shiftKey ? 10 : 2;
  const angStep = e.shiftKey ? 15 : 2;
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    panel._nudgeSelectedFloorplanItem(-step, 0, 0);
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    panel._nudgeSelectedFloorplanItem(step, 0, 0);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    panel._nudgeSelectedFloorplanItem(0, -step, 0);
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    panel._nudgeSelectedFloorplanItem(0, step, 0);
  } else if (e.key === "[" || e.key === ",") {
    e.preventDefault();
    panel._nudgeSelectedFloorplanItem(0, 0, -angStep);
  } else if (e.key === "]" || e.key === ".") {
    e.preventDefault();
    panel._nudgeSelectedFloorplanItem(0, 0, angStep);
  }
}


export function selectRoomObject(panel, room, renderAfter = true) {
  if (!room) return;
  panel._selectedRoomId = room.entry_id;
  panel._selectedRoomBoxName = room.room_name;
  if (renderAfter && (panel._studioView === "floorplan" || panel._studioView === "timeline")) {
    const box = (panel._floorplan?.rooms || []).find(
      (b) => (b.name || b.room_name) === room.room_name
    );
    if (box && box.floor) {
      panel._selectedFloorId = box.floor;
      if (panel._studioView === "timeline" && panel._timelineFloor !== "all") {
        panel._timelineFloor = box.floor;
      }
    }
  }
  panel._draftConfig = JSON.parse(JSON.stringify(room.config || {}));
  if (!Array.isArray(panel._draftConfig.bayesian_observations)) {
    panel._draftConfig.bayesian_observations = [];
  }
  if (!Array.isArray(panel._draftConfig.trigger_entities)) {
    panel._draftConfig.trigger_entities = [];
  }
  if (!Array.isArray(panel._draftConfig.boundary_entities)) {
    panel._draftConfig.boundary_entities = [];
  }
  if (!Array.isArray(panel._draftConfig.sustaining_conditions)) {
    panel._draftConfig.sustaining_conditions = [];
  }
  if (!Array.isArray(panel._draftConfig.connected_rooms)) {
    panel._draftConfig.connected_rooms = Array.isArray(room.connected_rooms)
      ? [...room.connected_rooms]
      : [];
  }
  panel._replayCandidate = JSON.parse(JSON.stringify(panel._draftConfig));
  panel._previewData = {
    probability_pct: room.bayesian_probability_pct,
    is_occupied: room.bayesian_occupied,
    prior_pct: room.bayesian_prior_pct,
    threshold_pct: room.bayesian_threshold_pct,
    active_observations: room.active_observations || [],
    inactive_observations: room.inactive_observations || [],
    natural_language_summary: room.natural_language_summary || "",
    combinatorics: room.combinatorics || {},
    sensor_weights: room.sensor_weights || [],
    rule_guide: room.rule_guide || "",
    ha_bayesian_yaml: room.ha_bayesian_yaml || "",
    designer_yaml: room.designer_yaml || "",
  };
  panel._yamlDraft = room.designer_yaml || "";
  panel._dirty = false;
  panel._revisionNote = "";
  if (panel._studioView === "statistics") {
    panel.loadStatistics();
  } else if (panel._studioView === "replay") {
    panel.runReplay();
  } else if (panel._studioView === "floorplan") {
    if (!panel._floorplan) {
      panel.loadFloorplan();
    } else if (renderAfter) {
      panel.render();
    }
  } else if (renderAfter) {
    panel.render();
  }
}


export function scheduleCanvasRender(panel) {
  if (panel._canvasRenderRaf) return;
  panel._canvasRenderRaf = requestAnimationFrame(() => {
    panel._canvasRenderRaf = null;
    if (panel._activeFpDrag) {
      panel._updateFloorplanCanvasInPlace();
      panel._syncQuickBarValuesInPlace();
    } else {
      panel.render();
    }
  });
}


export function updateFloorplanCanvasInPlace(panel) {
  const root = panel.shadowRoot;
  if (!root) return;
  const svg = root.querySelector("#fp-svg-canvas");
  if (!svg) return;
  const bundle = panel._renderFloorplanSvgBundle(panel.selectedRoom);
  if (!bundle) return;
  svg.innerHTML = bundle.svgInner;
  const hud = root.querySelector("#fp-live-hud");
  if (hud && bundle.hudHtml !== undefined) {
    hud.innerHTML = bundle.hudHtml;
  }
}


export function syncQuickBarValuesInPlace(panel) {
  const root = panel.shadowRoot;
  if (!root || !panel._floorplan) return;
  const activeFloorId = panel._selectedFloorId || "main";
  let item = null;
  if (panel._selectedDeviceType === "camera") {
    item = (panel._floorplan.cameras || []).find(
      (c) => (c.id || c.camera_entity) === panel._selectedCamEntity && (c.floor || "main") === activeFloorId
    );
  } else if (panel._selectedDeviceType === "sensor") {
    item = (panel._floorplan.sensors || []).find(
      (s) => s.id === panel._selectedSensorId && (s.floor || "main") === activeFloorId
    );
  } else if (panel._selectedDeviceType === "ble") {
    item = (panel._floorplan.ble_proxies || []).find(
      (p) => p.id === panel._selectedBleProxyId && (p.floor || "main") === activeFloorId
    );
  } else if (panel._selectedDeviceType === "subzone") {
    const cam = (panel._floorplan.cameras || []).find(
      (c) => (c.id || c.camera_entity) === panel._selectedCamEntity
    );
    item = (cam?.sub_zones || []).find((z) => z.id === panel._selectedSubZoneId);
  } else if (panel._selectedDeviceType === "room") {
    item = (panel._floorplan.rooms || []).find(
      (b) => (b.name || b.room_name) === panel._selectedRoomBoxName
    );
  }
  if (!item) return;
  root.querySelectorAll(".fp-quick-input").forEach((inp) => {
    const k = inp.getAttribute("data-key");
    if (!k) return;
    const val = k === "width" ? (item.width ?? item.w) : k === "height" ? (item.height ?? item.h) : item[k];
    if (val !== undefined && document.activeElement !== inp) {
      inp.value = Math.round(Number(val));
    }
  });
}


export function getFpPresetsMap(panel) {
  return {
    clean: { underlay: true, rooms: true, cameras: false, subzones: false, pir: false, doors: true, ble: false, connections: false, overlaps: false, occupants: true },
    cameras: { underlay: true, rooms: true, cameras: true, subzones: true, pir: false, doors: true, ble: false, connections: false, overlaps: true, occupants: true },
    motion: { underlay: true, rooms: true, cameras: false, subzones: false, pir: true, doors: true, ble: true, connections: false, overlaps: true, occupants: true },
    all: { underlay: true, rooms: true, cameras: true, subzones: true, pir: true, doors: true, ble: true, connections: true, overlaps: true, occupants: true },
  };
}


export function detectActiveFpPreset(panel) {
  const layers = panel._fpLayers || {};
  const presets = panel._getFpPresetsMap();
  for (const [key, spec] of Object.entries(presets)) {
    const match = Object.entries(spec).every(([lk, lv]) => (layers[lk] !== false) === lv);
    if (match) return key;
  }
  return null;
}

