import { renderFloorplanInspector } from "./floorplan-inspector.js";

export function renderFloorplanPane(panel, selRoom) {
  const bundle = panel._renderFloorplanSvgBundle(selRoom);
  if (!bundle) {
    return `<div class="ha-card">Loading floorplan...</div>`;
  }
  const {
    ctx,
    svgInner,
    hudHtml,
    overlapCounts,
    totalOverlapPairs,
    subZoneCount,
    blindRoomCount,
    doorSensorsList,
    pirSensorsList,
    liveEstimates,
    ambiguities,
  } = bundle;
  const { floors, activeFloor, fRooms, fConns, fCams, fSensors, fProxies, selSensor, selCam, selBox } = ctx;
  const layers = panel._fpLayers || {};
  const layerOn = (k) => layers[k] !== false;
  const selBoxName = selBox ? selBox.name || selBox.room_name : selRoom?.room_name || "Room";
  const selCamId = selCam ? selCam.id || selCam.camera_entity : "";
  const selBoxEntryways = selBox && Array.isArray(selBox.entryways) ? selBox.entryways : [];
  const undoCount = (panel._fpUndoStack || []).length;
  const redoCount = (panel._fpRedoStack || []).length;

  return `
    <div class="ha-card">
      <div class="card-head" style="flex-wrap:wrap;">
        <div>
          <h2 class="card-title" style="font-size:18px;">House Floorplan, Camera Sub-Zones &amp; Sensor Placement</h2>
          <div class="card-desc">
            Rooms are locked by default so clicking sensors never grabs a room. Drag any camera/PIR pin, aim its <strong>LOS vector</strong>, or switch modes anytime.
          </div>
        </div>

      </div>

      <!-- Section 1: Canvas Edit Tool (what clicking/dragging grabs) -->
      <div class="fp-control-section">
        <div class="fp-section-head">
          <span class="fp-section-title">
            1. Canvas Edit Tool (What Click &amp; Drag Grabs)
            <span class="pdd-hint-badge" data-tip="Controls which pins or boxes respond to dragging on the map. Unlike Map Visibility layers below, this does not hide anything.">i</span>
          </span>
          <span class="fp-section-sub">Choose what your mouse grabs on the map</span>
        </div>
        <div class="seg-group" id="fp-mode-switcher" style="margin-top:0;">
          <button class="seg-btn ${panel._floorplanMode === "devices" ? "active" : ""}" id="btn-fp-mode-devices" style="padding:6px 12px;" data-tip="Move &amp; aim any camera, PIR, door sensor, BLE proxy, or sub-zone without grabbing rooms." title="Move & aim any camera, PIR, door sensor, BLE proxy, or sub-zone">
            🎯 Sensors &amp; Cameras
          </button>
          <button class="seg-btn ${panel._floorplanMode === "cameras" ? "active" : ""}" id="btn-fp-mode-cameras" style="padding:6px 12px;" data-tip="Only cameras, camera LOS arrows, FOV handles, and sub-zones are draggable." title="Drag cameras, LOS arrows, and sub-zones only">
            📹 Cameras Only
          </button>
          <button class="seg-btn ${panel._floorplanMode === "sensors" ? "active" : ""}" id="btn-fp-mode-sensors" style="padding:6px 12px;" data-tip="Only PIR motion cones, door contact pins, and BLE proxies are draggable." title="Drag PIR, door, and BLE pins only">
            📡 PIR &amp; BLE Only
          </button>
          <button class="seg-btn ${panel._floorplanMode === "rooms" ? "active" : ""}" id="btn-fp-mode-rooms" style="padding:6px 12px;" data-tip="Click rooms &amp; doorway handles to inspect or reposition room boundaries (unlock rooms to resize)." title="Select/edit room boxes and doorways">
            🏠 Rooms &amp; Doors
          </button>
        </div>
      </div>

      <!-- Section: Map Editing & Room Sync -->
      <div class="fp-utility-bar" style="flex-direction:column;align-items:stretch;">
        <div class="fp-section-head">
          <span class="fp-section-title">
            🛠️ Map Editing &amp; Room Sync
            <span class="pdd-hint-badge" data-tip="Lock room walls while placing sensors, undo/redo map edits, save layout, or sync hallway/door connections back to every room's config.">i</span>
          </span>
          <span class="fp-section-sub">Protect walls, save floorplan changes, or push map room connections to room hand-off rules</span>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
          <div class="fp-utility-group">
            <button type="button" class="btn btn-sm fp-lock-btn ${panel._roomsLocked ? "locked" : "unlocked"}" id="btn-fp-lock-rooms" data-tip="${panel._roomsLocked ? "Currently locked so clicking sensors never drags a room. Click to unlock room boxes." : "Rooms are unlocked and draggable. Click to lock room walls again."}" title="${panel._roomsLocked ? "Unlock to allow dragging/resizing room boxes" : "Lock room boxes so clicks never move rooms"}">
              ${panel._roomsLocked ? "🔒 Rooms Locked" : "🔓 Rooms Unlocked"}
            </button>
            <button type="button" class="btn btn-sm" id="btn-fp-undo" ${undoCount === 0 ? "disabled" : ""} title="Undo last edit (Ctrl+Z)">
              ↩ Undo${undoCount > 0 ? ` (${undoCount})` : ""}
            </button>
            <button type="button" class="btn btn-sm" id="btn-fp-redo" ${redoCount === 0 ? "disabled" : ""} title="Redo edit (Ctrl+Shift+Z)">
              ↪ Redo
            </button>
            <button type="button" class="btn btn-sm" id="btn-fp-reset-rooms" data-tip="Restores default wall shapes on this floor without moving your cameras or sensors." title="Restore exact default room boxes on this floor without moving your cameras or sensors">
              ↺ Reset Floor Rooms
            </button>
            <button type="button" class="btn btn-sm" id="btn-fp-reset-all" data-tip="Resets all floors, rooms, cameras, and sensors back to factory layout." title="Restore entire floorplan (rooms + sensors) to default">
              ↺ Reset All
            </button>
          </div>

          <div class="fp-utility-group">
            <div style="display:flex;align-items:center;gap:6px;background:var(--ha-subtle);padding:3px 9px;border-radius:6px;border:1px solid var(--ha-divider);font-size:12px;" data-tip="Show or adjust opacity of the underlying architectural floorplan image.">
              <label style="display:flex;align-items:center;gap:5px;cursor:pointer;">
                <input type="checkbox" id="toggle-blueprint-underlay" ${layerOn("underlay") ? "checked" : ""} style="cursor:pointer;" />
                <span>Blueprint</span>
              </label>
              ${
                layerOn("underlay")
                  ? `<input type="range" id="blueprint-opacity-slider" min="5" max="100" step="5" value="${Math.round(panel._underlayOpacity * 100)}" style="width:68px;cursor:pointer;" title="Underlay Opacity" />
                     <span style="font-size:11px;color:var(--ha-muted);min-width:24px;">${Math.round(panel._underlayOpacity * 100)}%</span>`
                  : ""
              }
            </div>
            <span id="fp-save-state" class="fp-save-badge ${panel._fpDirty ? "dirty" : "saved"}">${panel._fpDirty ? "Unsaved" : "Saved ✓"}</span>
            <button type="button" class="btn btn-sm ${panel._fpDirty ? "btn-primary" : ""}" id="btn-fp-save-top" data-tip="Save all sensor, proxy, camera, and room positions immediately (edits also auto-save).">💾 Save Floorplan</button>
        ${renderFloorplanInspector(panel, { selRoom, bundle, ctx, floors, activeFloor, fRooms, fConns, fCams, fSensors, fProxies, selSensor, selCam, selBox, layers, layerOn, selBoxName, selCamId, selBoxEntryways, doorSensorsList, pirSensorsList, liveEstimates, ambiguities })}
      </div>
    `;
}
