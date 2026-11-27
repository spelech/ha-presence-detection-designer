/**
 * Presence Detection Designer - Native Home Assistant Design Studio Panel
 * Modular ES module shell delegating to ./components/ and ./panes/ (zero build step).
 */

import {
  analyzeCameraAlignment,
  apiCall,
  applyReplayCandidate,
  debounceSaveFloorplan,
  loadFloorplan,
  loadOverview,
  loadStatistics,
  loadTimeline,
  refreshStateGraph,
  runReplay,
  saveOrCompileFloorplan,
} from "./shared/api-client.js";
import {
  applyYamlDraft,
  refreshPreview,
  rollbackRevision,
  runRoomAction,
  runTranslation,
  saveCurrentRoom,
  saveGlobalSettings,
} from "./shared/api-room-actions.js";
import {
  buildOccupantTokenSvg,
  colorFromHex,
  getRoomColor,
  getRoomInteriorAnchor,
  hslToRgb,
  resolveOccupantProfile,
} from "./shared/colors.js";
import { compileFloorplanClient } from "./shared/floorplan-compiler.js";
import {
  applyFriendlyRoleGroup,
  escapeHtml,
  formatDuration,
  formatInlineCode,
  formatTimelineHouseMode,
  formatTransitionSte100,
  friendlyEntityName,
  friendlyRoleGroup,
  isHumanExclusiveCandidate,
  roomStatusSummary,
  sensorWeightMap,
  slugifyRoom,
} from "./shared/formatters.js";
import {
  buildStepSvgPaths,
  computeCameraVisibilityPolygon,
  coneSvgPath,
  extractFloorWallSegments,
  fitSvgLabel,
  getSvgPoint,
  lineSegmentIntersectsSolidWall,
  raySegmentIntersection,
  roomLabelAnchor,
  snapRoomGeometry,
  snapValue,
  transformSvgPath,
} from "./shared/geometry.js";
import { buildLosAndConeHandlesSvg, renderCameraSelectOptions } from "./shared/ui-primitives.js";
import { renderAdvancedDrawer } from "./room/advanced-drawer.js";
import { bindCanvasDragEvents } from "./floorplan/events-canvas-drag.js";
import { bindFloorplanDoorEvents } from "./floorplan/events-floorplan-doors.js";
import { bindFloorplanEvents } from "./floorplan/events-floorplan.js";
import { bindRoomEvents } from "./room/events-room.js";
import { bindTimelineAndModalEvents } from "./diagnostics/events-timeline-modals.js";
import { renderFloorplanPane } from "./floorplan/floorplan-pane.js";
import {
  detectActiveFpPreset,
  getDefaultFloorplan,
  getFpPresetsMap,
  handleFloorplanKeyDown,
  loadFpLayers,
  loadLocalOrDefaultFloorplan,
  nudgeSelectedFloorplanItem,
  pushFpUndo,
  redoFp,
  resetFloorplanRooms,
  saveFpLayers,
  scheduleCanvasRender,
  selectRoomObject,
  syncQuickBarValuesInPlace,
  undoFp,
  updateFloorplanCanvasInPlace,
} from "./floorplan/floorplan-state.js";
import { renderFloorplanSvgBundle } from "./floorplan/floorplan-svg.js";
import {
  buildFloorplanHudHtml,
  getActiveFloorContext,
  isSpecLocked,
  renderCameraAlignmentDetails,
  renderQuickAdjustBar,
} from "./floorplan/floorplan-widgets.js";
import { renderPanelShell } from "./layout/panel-shell.js";
import { renderSimpleRoomEditor } from "./room/room-editor.js";
import { renderStateMachinePane } from "./room/state-machine-pane.js";
import { renderReplayPane, renderStatisticsPane } from "./diagnostics/statistics-replay-panes.js";
import { renderTimelinePane, toggleTimelinePlay } from "./diagnostics/timeline-pane.js";
import {
  buildSingleFloorTimelineParts,
  buildTimelineFrameParts,
  patchSvgTimelineLayers,
  updateTimelineFrameInPlace,
} from "./diagnostics/timeline-svg.js";

class PresenceDetectionDesignerPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._panel = null;
    this._panelVersion = "0.3.3";
    this._overview = null;
    this._selectedRoomId = null;
    this._draftConfig = null;
    this._previewData = null;
    this._dirty = false;
    this._roomSearch = "";
    this._roomFilter = "all"; // "all" | "occupied" | "vacant"
    this._studioView = "design"; // "design" | "floorplan" | "statistics" | "replay"
    this._editorTab = "setup"; // "setup" | "rules" | "diagnostics"
    this._showAdvanced = false;
    this._advTab = "tuning"; // "tuning" | "truth" | "yaml" | "revisions"
    this._rightTab = "yaml"; // "yaml" | "ha_yaml" | "nl" | "guide"
    this._nlPrompt = "";
    this._nlOutput = "";
    this._yamlDraft = "";
    this._revisionNote = "";
    this._showGlobalModal = false;
    this._settingsTab = "interface"; // "interface" | "detection" | "ai" | "notifications"
    this._globalDraft = null;
    this._floorplan = this._loadLocalOrDefaultFloorplan();
    this._compiledTopology = this._compileFloorplanClient(this._floorplan);
    this._selectedFloorId = "main";
    this._selectedCamEntity = null;
    this._showFloorplanInspector = false;
    this._historyHours = 6;
    this._statsData = null;
    this._replayData = null;
    this._replayCandidate = null;
    this._toast = null;
    this._loading = false;
    this._narrow = false;
    this._initialized = false;
    this._selectedRoomBoxName = null;
    this._selectedDoorId = null;
    this._activeFpDrag = null;
    this._saveFpTimeout = null;
    this._saveFpServerTimeout = null;
    this._canvasRenderRaf = null;
    this._fpLayers = this._loadFpLayers();
    this._showBlueprintUnderlay = this._fpLayers.underlay !== false;
    this._underlayOpacity = 0.88;
    this._containerBp = "full";
    this._resizeObserver = null;
    this._floorplanMode = "devices"; // "devices" | "cameras" | "sensors" | "rooms"
    this._roomsLocked = true;
    this._selectedDeviceType = null; // "camera" | "sensor" | "ble" | "subzone" | "room"
    this._fpUndoStack = [];
    this._fpRedoStack = [];
    this._fpDirty = false;
    this._fpSaving = false;
    this._selectedSensorId = null;
    this._selectedSubZoneId = null;
    this._selectedBleProxyId = null;
    this._cameraAlignmentResult = null;
    this._cameraAlignmentError = null;
    this._analyzingCamera = false;
    this._timelineData = null;
    this._timelineFrameIdx = 0;
    this._timelinePlaying = false;
    this._timelineSpeed = 1;
    this._timelineTimer = null;
    this._timelineHours = 6;
    this._timelineFloor = "all";
    this._timelineNegSpace = true;
    this._timelineNegativeSpace = true;
    this._replayNegSpace = true;
    this._replayNegativeSpace = true;
    this._lastRenderedView = null;
    this._verifyingRoomId = null;
    this._lastVerifyFeedback = {};
  }

  set narrow(value) {
    const next = Boolean(value);
    if (this._narrow !== next) {
      this._narrow = next;
      if (this._initialized) {
        this.render();
      }
    }
  }

  set panel(panel) {
    this._panel = panel;
    if (panel && panel.config && panel.config.version) {
      this._panelVersion = String(panel.config.version);
    }
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._initialized || (!this._overview && !this._loading)) {
      this._initialized = true;
      this.loadOverview();
    }
  }


  _loadLocalAdvancedMode() {
    try {
      return localStorage.getItem("pdd_ui_advanced_mode") === "true";
    } catch (_e) {
      return false;
    }
  }

  _saveLocalAdvancedMode(val) {
    try {
      localStorage.setItem("pdd_ui_advanced_mode", val ? "true" : "false");
    } catch (_e) {}
  }

  _isAdvancedMode() {
    if (this._globalDraft && typeof this._globalDraft.ui_advanced_mode === "boolean") {
      return this._globalDraft.ui_advanced_mode;
    }
    if (this._overview?.global_settings && typeof this._overview.global_settings.ui_advanced_mode === "boolean") {
      return this._overview.global_settings.ui_advanced_mode;
    }
    return this._loadLocalAdvancedMode();
  }

  _computeContainerBp(width) {
    const w = Number(width || 0);
    if (w > 0 && w < 680) return "mobile";
    if (w > 0 && w < 1080) return "tablet";
    if (w > 0 && w < 1460) return "compact";
    return "full";
  }

  _updateContainerBp() {
    const rectW = this.clientWidth || this.getBoundingClientRect?.().width || window.innerWidth || 1440;
    const next = this._computeContainerBp(rectW);
    if (next !== this._containerBp) {
      this._containerBp = next;
      const shell = this.shadowRoot?.querySelector(".pdd-shell");
      if (shell) {
        shell.setAttribute("data-bp", next);
      }
    }
  }

  connectedCallback() {
    this._updateContainerBp();
    if (typeof ResizeObserver !== "undefined" && !this._resizeObserver) {
      this._resizeObserver = new ResizeObserver(() => this._updateContainerBp());
      this._resizeObserver.observe(this);
    }
    if (!this._onWindowKeyDown && typeof window !== "undefined") {
      this._onWindowKeyDown = (e) => this._handleFloorplanKeyDown(e);
      window.addEventListener("keydown", this._onWindowKeyDown);
    }
    if (!this._initialized) {
      this._initialized = true;
      this.render();
      if (this._hass || window.__PDD_MOCK_API__) {
        this.loadOverview();
      }
    }
  }

  disconnectedCallback() {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    if (this._onWindowKeyDown && typeof window !== "undefined") {
      window.removeEventListener("keydown", this._onWindowKeyDown);
      this._onWindowKeyDown = null;
    }
  }

  showToast(message, type = "info") {
    this._toast = { message, type };
    this.renderToastOnly();
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      this._toast = null;
      this.renderToastOnly();
    }, 3500);
  }

  renderToastOnly() {
    const el = this.shadowRoot.querySelector("#pdd-toast-container");
    if (!el) return;
    if (!this._toast) {
      el.innerHTML = "";
      return;
    }
    const bg =
      this._toast.type === "error"
        ? "var(--ha-danger, #b91c1c)"
        : this._toast.type === "success"
        ? "var(--ha-success, #15803d)"
        : "var(--ha-primary, #0369a1)";
    el.innerHTML = `<div style="background:${bg};color:#fff;padding:10px 18px;border-radius:8px;box-shadow:0 4px 14px rgba(0,0,0,0.18);font-weight:500;font-size:13px;">${this._escape(
      this._toast.message
    )}</div>`;
  }


  get selectedRoom() {
    if (!this._overview || !this._overview.rooms) return null;
    return this._overview.rooms.find((r) => r.entry_id === this._selectedRoomId) || null;
  }

  // --- Shared component delegates (single source of truth, zero duplication) ---
  _escape(str) { return escapeHtml(str); }
  _formatDuration(sec) { return formatDuration(sec); }
  _friendlyRoleGroup(obs) { return friendlyRoleGroup(obs); }
  _sensorWeightMap() { return sensorWeightMap(this); }
  _isHumanExclusiveCandidate(eid) { return isHumanExclusiveCandidate(this, eid); }
  _slugifyRoom(name) { return slugifyRoom(name); }
  _applyFriendlyRoleGroup(obs, group) { return applyFriendlyRoleGroup(this, obs, group); }
  _roomStatusSummary(room) { return roomStatusSummary(this, room); }
  _friendlyEntityName(eid) { return friendlyEntityName(eid); }
  _formatTransitionSte100(entry, isFirst) { return formatTransitionSte100(this, entry, isFirst); }
  _formatInlineCode(text) { return formatInlineCode(text); }
  _formatTimelineHouseMode(mode, count) { return formatTimelineHouseMode(mode, count); }
  _hslToRgb(h, s, l) { return hslToRgb(h, s, l); }
  _colorFromHex(hex) { return colorFromHex(hex); }
  _getRoomColor(roomName) { return getRoomColor(this, roomName); }
  _getRoomInteriorAnchor(box) { return getRoomInteriorAnchor(box); }
  _resolveOccupantProfile(occ) { return resolveOccupantProfile(occ, this._overview); }
  _buildOccupantTokenSvg(...args) { return buildOccupantTokenSvg(this, ...args); }
  _fitSvgLabel(label, maxPx, fontSize = 11) { return fitSvgLabel(label, maxPx, fontSize); }
  _roomLabelAnchor(box) { return roomLabelAnchor(box); }
  _snapValue(val, step = 10) { return snapValue(val, step); }
  _transformSvgPath(d, ox, oy, ow, oh, nx, ny, nw, nh) { return transformSvgPath(d, ox, oy, ow, oh, nx, ny, nw, nh); }
  _snapRoomGeometry(box, allRooms, thresh = 10) { return snapRoomGeometry(box, allRooms, thresh); }
  _extractFloorWallSegments(rooms) { return extractFloorWallSegments(rooms, this._floorplan); }
  _raySegmentIntersection(ox, oy, dx, dy, x1, y1, x2, y2) { return raySegmentIntersection(ox, oy, dx, dy, x1, y1, x2, y2); }
  _lineSegmentIntersectsSolidWall(x1, y1, x2, y2, segs) { return lineSegmentIntersectsSolidWall(x1, y1, x2, y2, segs); }
  _computeCameraVisibilityPolygon(cam, segs) { return computeCameraVisibilityPolygon(cam, segs); }
  _compileFloorplanClient(fp) { return compileFloorplanClient(this, fp); }
  _buildStepSvgPaths(steps, activeFloor) { return buildStepSvgPaths(steps, activeFloor); }
  _getSvgPoint(evt, svgEl) { return getSvgPoint(evt, svgEl); }
  _coneSvgPath(cx, cy, headingDeg, fovDeg, rangePx, segs) { return coneSvgPath(cx, cy, headingDeg, fovDeg, rangePx, segs); }
  _renderCameraSelectOptions(selectedEntity, entities) { return renderCameraSelectOptions(this, selectedEntity, entities); }
  _buildLosAndConeHandlesSvg(...args) { return buildLosAndConeHandlesSvg(this, ...args); }

  // --- API client delegates ---
  _apiCall(method, path, body) { return apiCall(this, method, path, body); }
  loadOverview() { return loadOverview(this); }
  loadFloorplan() { return loadFloorplan(this); }
  saveOrCompileFloorplan(applyRules = false) { return saveOrCompileFloorplan(this, applyRules); }
  _debounceSaveFloorplan() { return debounceSaveFloorplan(this); }
  _analyzeCameraAlignment(camId) { return analyzeCameraAlignment(this, camId); }
  loadStatistics() { return loadStatistics(this); }
  loadTimeline() { return loadTimeline(this); }
  runReplay() { return runReplay(this); }
  applyReplayCandidate() { return applyReplayCandidate(this); }
  refreshPreview() { return refreshPreview(this); }
  saveCurrentRoom(note) { return saveCurrentRoom(this, note); }
  applyYamlDraft() { return applyYamlDraft(this); }
  rollbackRevision(revIdx) { return rollbackRevision(this, revIdx); }
  runRoomAction(action, extra) { return runRoomAction(this, action, extra); }
  runTranslation(direction) { return runTranslation(this, direction); }
  saveGlobalSettings() { return saveGlobalSettings(this); }
  _refreshStateGraph(entryId) { return refreshStateGraph(this, entryId); }

  // --- Floorplan state & widget delegates ---
  _loadFpLayers() { return loadFpLayers(this); }
  _saveFpLayers() { return saveFpLayers(this); }
  _getDefaultFloorplan() { return getDefaultFloorplan(this); }
  _loadLocalOrDefaultFloorplan() { return loadLocalOrDefaultFloorplan(this); }
  _pushFpUndo(snap) { return pushFpUndo(this, snap); }
  _undoFp() { return undoFp(this); }
  _redoFp() { return redoFp(this); }
  _resetFloorplanRooms() { return resetFloorplanRooms(this); }
  _nudgeSelectedFloorplanItem(dx, dy, dHeading) { return nudgeSelectedFloorplanItem(this, dx, dy, dHeading); }
  _handleFloorplanKeyDown(e) { return handleFloorplanKeyDown(this, e); }
  _selectRoomObject(roomName) { return selectRoomObject(this, roomName); }
  _scheduleCanvasRender() { return scheduleCanvasRender(this); }
  _updateFloorplanCanvasInPlace() { return updateFloorplanCanvasInPlace(this); }
  _syncQuickBarValuesInPlace() { return syncQuickBarValuesInPlace(this); }
  _getFpPresetsMap() { return getFpPresetsMap(this); }
  _detectActiveFpPreset() { return detectActiveFpPreset(this); }
  _getActiveFloorContext(selRoom) { return getActiveFloorContext(this, selRoom); }
  _isSpecLocked(obj) { return isSpecLocked(this, obj); }
  _buildFloorplanHudHtml(ctx, liveEstimates, totalOverlapPairs, blindRoomCount) { return buildFloorplanHudHtml(this, ctx, liveEstimates, totalOverlapPairs, blindRoomCount); }
  _renderCameraAlignmentDetails(res) { return renderCameraAlignmentDetails(this, res); }
  _renderQuickAdjustBar(ctx) { return renderQuickAdjustBar(this, ctx); }

  // --- Pane render & event delegates ---
  render() { return renderPanelShell(this); }
  _renderSimpleRoomEditor(selRoom, cfg, prev, rooms, areas, entities, entityNameMap, presets, activeMap) {
    return renderSimpleRoomEditor(this, selRoom, cfg, prev, rooms, areas, entities, entityNameMap, presets, activeMap);
  }
  _renderStateMachinePane(selRoom) { return renderStateMachinePane(this, selRoom); }
  _renderAdvancedDrawer(selRoom, cfg, prev, areas, presets, activeMap) {
    return renderAdvancedDrawer(this, selRoom, cfg, prev, areas, presets, activeMap);
  }
  _renderFloorplanSvgBundle(selRoom) { return renderFloorplanSvgBundle(this, selRoom); }
  _renderFloorplanPane(selRoom) { return renderFloorplanPane(this, selRoom); }
  _buildSingleFloorTimelineParts(...args) { return buildSingleFloorTimelineParts(this, ...args); }
  _buildTimelineFrameParts(...args) { return buildTimelineFrameParts(this, ...args); }
  _patchSvgTimelineLayers(...args) { return patchSvgTimelineLayers(this, ...args); }
  _updateTimelineFrameInPlace(...args) { return updateTimelineFrameInPlace(this, ...args); }
  _toggleTimelinePlay() { return toggleTimelinePlay(this); }
  _renderTimelinePane() { return renderTimelinePane(this); }
  _renderStatisticsPane(selRoom) { return renderStatisticsPane(this, selRoom); }
  _renderReplayPane(selRoom) { return renderReplayPane(this, selRoom); }

  _bindEvents() {
    const root = this.shadowRoot;
    const presets = (this._overview && this._overview.presets) || {};
    bindRoomEvents(this, root, presets);
    bindFloorplanEvents(this, root);
    bindFloorplanDoorEvents(this, root);
    bindCanvasDragEvents(this, root);
    bindTimelineAndModalEvents(this, root);
  }
}

if (!customElements.get("presence-detection-designer-panel")) {
  customElements.define("presence-detection-designer-panel", PresenceDetectionDesignerPanel);
}
