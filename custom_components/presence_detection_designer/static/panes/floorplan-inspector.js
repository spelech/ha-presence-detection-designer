import { PDD_DEVICE_MODEL_PRESETS } from "../components/defaults.js";
import { renderFloorplanSensorsColumn } from "./floorplan-sensors-inspector.js";

// Floorplan inspector panels (camera, subzones, alignment, doorways, sensors, BLE, coverage notes).

export function renderFloorplanInspector(panel, {
  selRoom, bundle, ctx, floors, activeFloor, fRooms, fConns, fCams, fSensors, fProxies,
  selSensor, selCam, selBox, layers, layerOn, selBoxName, selCamId, selBoxEntryways,
  doorSensorsList, pirSensorsList, liveEstimates, ambiguities,
}) {
  return `
            <button type="button" class="btn btn-sm" id="btn-toggle-fp-inspector" data-tip="Open the side panel to add cameras, PIR/door sensors, BLE proxies, or edit exact coordinates.">
              ${panel._showFloorplanInspector ? "Hide Details" : "Edit Details &amp; Add"}
            </button>
            <button type="button" class="btn btn-primary btn-sm" id="btn-fp-compile" data-tip="Analyzes adjacent rooms &amp; doorways on the map and writes those links into each room's Connected Adjacent Rooms." data-tip-align="right">Apply Connections to Rooms</button>
          </div>
        </div>
      </div>

      <!-- Section 2: Map Visibility (Layers & Quick Presets) -->
      ${(() => {
        const activePreset = panel._detectActiveFpPreset();
        return `
      <div class="fp-layer-bar" style="flex-direction:column;align-items:stretch;">
        <div class="fp-section-head">
          <span class="fp-section-title">
            2. Map Visibility (Layers &amp; Quick Presets)
            <span class="pdd-hint-badge" data-tip="Controls what is drawn on the map. Presets on the right are 1-click bundles of the individual Layer toggles below.">i</span>
          </span>
          <div class="fp-layer-presets">
            <span style="font-size:11px;font-weight:600;color:var(--ha-muted);margin-right:2px;">Quick Presets:</span>
            ${[
              { id: "clean", label: "Clean", tip: "Rooms, doors, blueprint & live targets only" },
              { id: "cameras", label: "Cameras", tip: "Rooms, cameras, sub-zones, doors & overlaps" },
              { id: "motion", label: "Motion + BLE", tip: "Rooms, PIR cones, doors, BLE proxies & overlaps" },
              { id: "all", label: "All Layers", tip: "Turn every visual overlay ON" },
            ]
              .map(
                (pr) => `
              <button
                type="button"
                class="btn btn-sm ${activePreset === pr.id ? "btn-primary active" : ""}"
                data-fp-preset="${pr.id}"
                data-tip="${panel._escape(pr.tip)}"
                style="padding:3px 9px;font-size:11px;"
              >${pr.label}</button>`
              )
              .join("")}
          </div>
        </div>
        <div class="fp-layer-chips">
          <span style="font-size:11.5px;font-weight:600;color:var(--ha-muted);margin-right:2px;">Show Layers:</span>
          ${[
            { id: "rooms", label: `Rooms (${fRooms.length})`, color: "#0284c7" },
            { id: "cameras", label: `Cameras (${fCams.length})`, color: "#0ea5e9" },
            { id: "subzones", label: `Sub-Zones (${subZoneCount})`, color: "#0369a1" },
            { id: "pir", label: `PIR Cones (${pirSensorsList.length})`, color: "#9333ea" },
            { id: "doors", label: `Door Sensors (${doorSensorsList.length})`, color: "#ea580c" },
            { id: "ble", label: `BLE Proxies (${fProxies.length})`, color: "#0d9488" },
            { id: "connections", label: `Adjacency (${fConns.length})`, color: "#64748b" },
            { id: "overlaps", label: `Overlaps (${totalOverlapPairs})`, color: "#d97706" },
            { id: "occupants", label: `Targets (${liveEstimates.length})`, color: "#16a34a" },
          ]
            .map(
              (ly) => `
            <button
              type="button"
              class="fp-layer-chip ${layerOn(ly.id) ? "active" : ""}"
              data-fp-layer="${ly.id}"
              title="Toggle ${panel._escape(ly.label)} layer"
            >
              <span class="fp-layer-check">✓</span>
              <span class="fp-layer-dot" style="background:${ly.color};"></span>
              <span>${panel._escape(ly.label)}</span>
            </button>`
            )
            .join("")}
        </div>
      </div>`;
      })()}

      <div class="fp-canvas-wrap">
        <div class="fp-map-toolbar">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span style="font-size:12px;font-weight:700;color:#0f172a;">Floor:</span>
            <div class="seg-group" style="margin-top:0;background:rgba(15,23,42,0.06);border-color:rgba(15,23,42,0.12);">
              ${floors
                .map(
                  (fl) => `
                <button class="seg-btn ${fl.id === activeFloor.id ? "active" : ""}" data-floor-id="${panel._escape(fl.id)}" style="padding:4px 11px;">
                  ${panel._escape(fl.name.replace(/\s*\(.*\)/, ""))}
                </button>`
                )
                .join("")}
            </div>
          </div>
          <span style="font-size:11.5px;color:#475569;">${fRooms.length} rooms · ${fCams.length} cameras · ${fSensors.length} sensors on ${panel._escape(activeFloor.name.replace(/\s*\(.*\)/, ""))}</span>
        </div>
        <div id="fp-live-hud" class="fp-live-hud">${hudHtml}</div>
        <svg id="fp-svg-canvas" viewBox="0 0 1000 580" style="width:100%;height:auto;min-height:420px;display:block;user-select:none;touch-action:none;">
          ${svgInner}
        </svg>
      </div>

      ${panel._renderQuickAdjustBar(ctx)}

      <!-- Legend & Multi-Sensor Overlap Keys -->
      <div class="fp-legend-panel">
        <div class="fp-legend-grid">
          <div>
            <div class="fp-legend-heading">
              <span>🗺️ Sensor &amp; Floorplan Key</span>
              <span style="font-size:11px;font-weight:500;color:var(--ha-muted);">Click layer pills above to isolate views</span>
            </div>
            <div class="fp-legend-list">
              <div class="fp-legend-item">
                <span class="fp-swatch" style="background:rgba(22,163,74,0.22);border:1.5px solid #16a34a;"></span>
                <span><strong>Occupied Room</strong> — active presence</span>
              </div>
              <div class="fp-legend-item">
                <span class="fp-swatch" style="background:rgba(2,132,199,0.16);border:1.5px solid #0284c7;"></span>
                <span><strong>Camera Cone</strong> — primary room FOV</span>
              </div>
              <div class="fp-legend-item">
                <span class="fp-swatch" style="background:rgba(217,119,6,0.18);border:1.5px dashed #d97706;"></span>
                <span><strong>Camera Bleed</strong> — spills across doorway</span>
              </div>
              <div class="fp-legend-item">
                <span class="fp-swatch" style="background:rgba(14,165,233,0.18);border:1.5px dashed #0ea5e9;"></span>
                <span><strong>Sub-Zone Box</strong> — scoped detection region</span>
              </div>
              <div class="fp-legend-item">
                <span class="fp-swatch" style="background:rgba(147,51,234,0.18);border:1.5px dashed #9333ea;"></span>
                <span><strong>PIR Motion Cone</strong> — passive IR sensor</span>
              </div>
              <div class="fp-legend-item">
                <span class="fp-swatch" style="background:#ea580c;border:1.5px solid #ffffff;"></span>
                <span><strong>Door Contact</strong> / <strong>Brown Line</strong> doorway</span>
              </div>
              <div class="fp-legend-item">
                <span class="fp-swatch" style="background:rgba(13,148,136,0.12);border:1.5px dashed #0d9488;"></span>
                <span><strong>BLE Proxy Ring</strong> — Bluetooth proxy reach</span>
              </div>
              <div class="fp-legend-item">
                <span class="fp-swatch" style="background:rgba(2,132,199,0.18);border:1.5px dashed #0284c7;"></span>
                <span><strong>🎯 Target Estimate</strong> — positive / neg-space</span>
              </div>
            </div>
          </div>

          <div>
            <div class="fp-legend-heading">
              <span>✨ Multi-Sensor Overlap Keys</span>
              <span style="font-size:11px;font-weight:600;color:var(--ha-primary-text);">
                ${
                  layerOn("overlaps")
                    ? `${totalOverlapPairs} overlap${totalOverlapPairs === 1 ? "" : "s"} · ${blindRoomCount} blind pocket${blindRoomCount === 1 ? "" : "s"}`
                    : "Overlaps layer hidden"
                }
              </span>
            </div>
            <div class="fp-legend-list">
              <div class="fp-legend-item">
                <svg class="fp-swatch" viewBox="0 0 24 16"><defs><pattern id="lg-cp" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="rgba(124,58,237,0.16)"/><line x1="0" y1="0" x2="0" y2="6" stroke="#7c3aed" stroke-width="2"/><line x1="3" y1="0" x2="3" y2="6" stroke="#0284c7" stroke-width="2"/></pattern></defs><rect width="24" height="16" fill="url(#lg-cp)" stroke="#7c3aed" stroke-width="1"/></svg>
                <span><strong>Camera + PIR (${overlapCounts.camPir})</strong> — dual-verified vision &amp; motion</span>
              </div>
              <div class="fp-legend-item">
                <svg class="fp-swatch" viewBox="0 0 24 16"><defs><pattern id="lg-mc" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="rgba(217,119,6,0.16)"/><path d="M0,6 L6,0" stroke="#d97706" stroke-width="1.8"/><path d="M0,0 L6,6" stroke="#0284c7" stroke-width="1.1"/></pattern></defs><rect width="24" height="16" fill="url(#lg-mc)" stroke="#d97706" stroke-width="1"/></svg>
                <span><strong>Multi-Camera (${overlapCounts.multiCam})</strong> — shared/bleed zone; tune sub-zones</span>
              </div>
              <div class="fp-legend-item">
                <svg class="fp-swatch" viewBox="0 0 24 16"><defs><pattern id="lg-cb" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="6" height="6" fill="rgba(13,148,136,0.16)"/><line x1="0" y1="0" x2="0" y2="6" stroke="#0d9488" stroke-width="2"/><line x1="3" y1="0" x2="3" y2="6" stroke="#0284c7" stroke-width="2"/></pattern></defs><rect width="24" height="16" fill="url(#lg-cb)" stroke="#0d9488" stroke-width="1"/></svg>
                <span><strong>Camera + BLE (${overlapCounts.camBle})</strong> — visual + radio attribution</span>
              </div>
              <div class="fp-legend-item">
                <svg class="fp-swatch" viewBox="0 0 24 16"><defs><pattern id="lg-pb" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><rect width="6" height="6" fill="rgba(147,51,234,0.15)"/><line x1="0" y1="0" x2="0" y2="6" stroke="#9333ea" stroke-width="2"/><line x1="3" y1="0" x2="3" y2="6" stroke="#0d9488" stroke-width="2"/></pattern></defs><rect width="24" height="16" fill="url(#lg-pb)" stroke="#9333ea" stroke-width="1"/></svg>
                <span><strong>PIR + BLE (${overlapCounts.pirBle})</strong> — motion + radio without camera</span>
              </div>
              <div class="fp-legend-item">
                <span class="fp-swatch" style="background:rgba(245,158,11,0.16);border:1.5px solid #d97706;"></span>
                <span><strong>Blind Pocket (${blindRoomCount})</strong> — 0 cameras; relies on PIR / Neg-Space</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      ${
        panel._showFloorplanInspector
          ? `
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(290px, 1fr));gap:16px;margin-top:16px;padding-top:16px;border-top:1px solid var(--ha-divider);">
          <div>
            <div class="setting-label" style="margin-bottom:8px;">Camera Cone &amp; Sub-Zones</div>
            ${
              !selCam
                ? `<div style="font-size:13px;color:var(--ha-muted);">No cameras on this floor.</div>`
                : `
              <select class="select" id="fp-cam-select" style="margin-bottom:8px;">
                ${fCams
                  .map((c) => {
                    const cid = c.id || c.camera_entity;
                    return `<option value="${panel._escape(cid)}" ${
                      cid === selCamId ? "selected" : ""
                    }>${panel._escape(c.name || cid)}</option>`;
                  })
                  .join("")}
              </select>
              <div style="margin-bottom:8px;">
                <small style="display:block;margin-bottom:2px;color:var(--ha-muted);">Hardware Model Preset (auto-sets FOV &amp; Range)</small>
                <select class="select" id="fp-cam-preset-select" style="font-size:12px;">
                  <option value="">Custom / Manual FOV (${Number(selCam.fov_deg)}°)</option>
                  ${Object.values(typeof PDD_DEVICE_MODEL_PRESETS !== "undefined" ? PDD_DEVICE_MODEL_PRESETS : {})
                    .filter((p) => (p.category || p.device_type) === "camera")
                    .map(
                      (p) =>
                        `<option value="${panel._escape(p.id)}" ${
                          selCam.model_preset === p.id ? "selected" : ""
                        }>${panel._escape(p.label || p.name)} — ${Number(p.fov_deg)}° FOV</option>`
                    )
                    .join("")}
                </select>
              </div>
              <div class="fp-fields-5">
                <div><small>X</small><input type="number" class="input fp-cam-field" data-key="x" value="${Number(
                  selCam.x
                )}" /></div>
                <div><small>Y</small><input type="number" class="input fp-cam-field" data-key="y" value="${Number(
                  selCam.y
                )}" /></div>
                <div><small>Angle°</small><input type="number" class="input fp-cam-field" data-key="heading_deg" value="${Number(
                  selCam.heading_deg
                )}" /></div>
                <div><small>FOV°</small><input type="number" class="input fp-cam-field" data-key="fov_deg" value="${Number(
                  selCam.fov_deg
                )}" ${panel._isSpecLocked(selCam) ? 'disabled title="Locked to hardware preset spec"' : ""} /></div>
                <div><small>Range</small><input type="number" class="input fp-cam-field" data-key="range_px" value="${Number(
                  selCam.range_px
                )}" ${panel._isSpecLocked(selCam) ? 'disabled title="Locked to hardware preset spec"' : ""} /></div>
              </div>

              <!-- Camera Sub-Zones -->
              <div style="margin-top:10px;padding:8px 10px;background:var(--ha-subtle);border:1px solid var(--ha-divider);border-radius:8px;font-size:12px;">
                <div style="font-weight:600;margin-bottom:4px;">Frigate Sub-Zones (${(selCam.sub_zones || []).length})</div>
                ${
                  (selCam.sub_zones || []).length === 0
                    ? `<div style="color:var(--ha-muted);">Whole-frame camera only (no Frigate sub-zones).</div>`
                    : (selCam.sub_zones || [])
                        .map(
                          (sz) => `
                      <div style="display:flex;justify-content:space-between;align-items:center;padding:3px 0;border-bottom:1px dashed var(--ha-divider);">
                        <span>🎯 <strong>${panel._escape(sz.label || sz.id)}</strong> (${panel._escape(sz.room)})</span>
                        <span style="font-family:var(--ha-mono);font-size:11px;color:var(--ha-muted);">(${Number(sz.x)}, ${Number(sz.y)}) ${Number(sz.width)}×${Number(sz.height)}</span>
                      </div>`
                        )
                        .join("")
                }
              </div>

              <!-- Camera View & Physical Horizon/Azimuth Alignment -->
              <div style="margin-top:14px;padding:12px;background:var(--ha-card);border:1px solid var(--ha-divider);border-radius:8px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:6px;">
                  <div>
                    <div style="font-weight:600;font-size:12.5px;">📸 Camera View &amp; Opening Alignment</div>
                    <div style="font-size:11px;color:var(--ha-muted);">CV vanishing horizon tilt &amp; doorway azimuth analysis</div>
                  </div>
                  <button class="btn btn-sm btn-primary" id="btn-fp-analyze-camera" style="padding:4px 10px;font-size:11.5px;" ${panel._analyzingCamera ? "disabled" : ""}>
                    ${panel._analyzingCamera ? "Analyzing..." : "Analyze Alignment"}
                  </button>
                </div>
                ${panel._renderCameraAlignmentDetails(selCam)}
              </div>`
            }
          </div>

          <div>
            <div class="setting-label" style="margin-bottom:8px;">Room Box: ${panel._escape(
              selBoxName
            )}</div>
            ${
              !selBox
                ? ""
                : `
              <div class="fp-fields-4">
                <div><small>X</small><input type="number" class="input fp-box-field" data-room="${panel._escape(
                  selBoxName
                )}" data-key="x" value="${Number(selBox.x)}" /></div>
                <div><small>Y</small><input type="number" class="input fp-box-field" data-room="${panel._escape(
                  selBoxName
                )}" data-key="y" value="${Number(selBox.y)}" /></div>
                <div><small>Width</small><input type="number" class="input fp-box-field" data-room="${panel._escape(
                  selBoxName
                )}" data-key="width" value="${Number(selBox.width ?? 200)}" /></div>
                <div><small>Height</small><input type="number" class="input fp-box-field" data-room="${panel._escape(
                  selBoxName
                )}" data-key="height" value="${Number(selBox.height ?? 150)}" /></div>
              </div>

              <!-- Doorways on this room -->
              <div style="margin-top:12px;padding-top:10px;border-top:1px dashed var(--ha-divider);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:6px;">
                  <div style="font-size:12.5px;font-weight:600;">Perimeter Doorways (${selBoxEntryways.length})</div>
                  <div style="display:flex;gap:6px;flex-wrap:wrap;">
                    <select class="select" id="fp-new-door-wall" style="font-size:12px;padding:3px 6px;width:auto;">
                      <option value="right">Right Wall</option>
                      <option value="left">Left Wall</option>
                      <option value="top">Top Wall</option>
                      <option value="bottom">Bottom Wall</option>
                    </select>
                    <button class="btn btn-sm" id="btn-fp-add-door" data-room="${panel._escape(selBoxName)}" style="padding:3px 8px;font-size:12px;">+ Add Door</button>
                  </div>
                </div>

                ${
                  selBoxEntryways.length === 0
                    ? `<div style="font-size:12px;color:var(--ha-muted);">No doorways on this room yet. Add one so cameras can see in/out.</div>`
                    : `
                  <div style="display:flex;flex-direction:column;gap:6px;">
                    ${selBoxEntryways
                      .map(
                        (ew) => `
                      <div class="fp-door-row">
                        <div style="font-weight:500;text-transform:capitalize;">${panel._escape(
                          ew.wall
                        )}</div>
                        <div><small>Offset</small><input type="number" class="input fp-door-field" data-door-id="${panel._escape(
                          ew.id
                        )}" data-key="offset" value="${Number(
                          ew.offset
                        )}" style="padding:2px 4px;font-size:11.5px;" /></div>
                        <div><small>Width</small><input type="number" class="input fp-door-field" data-door-id="${panel._escape(
                          ew.id
                        )}" data-key="width" value="${Number(
                          ew.width
                        )}" style="padding:2px 4px;font-size:11.5px;" /></div>
                        <div>
                          <small>Type</small>
                          <select class="select fp-door-field" data-door-id="${panel._escape(
                            ew.id
                          )}" data-key="type" style="padding:2px 4px;font-size:11.5px;">
                            <option value="door" ${ew.type === "door" ? "selected" : ""}>Door</option>
                            <option value="open_passage" ${
                              ew.type === "open_passage" ? "selected" : ""
                            }>Open Arch</option>
                          </select>
                        </div>
                        <button class="btn btn-sm btn-fp-delete-door" data-door-id="${panel._escape(
                          ew.id
                        )}" data-room="${panel._escape(
                          selBoxName
                        )}" style="padding:2px 6px;color:var(--ha-danger-text);" title="Delete doorway">✕</button>
                      </div>`
                      )
                      .join("")}
                  </div>`
                }
              </div>

              <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
                <button class="btn btn-sm" id="btn-fp-save">Save Layout</button>
                <button class="btn btn-sm" id="btn-fp-reset">Reset Default Layout</button>
              </div>`
            }
          </div>

            ${renderFloorplanSensorsColumn(panel, { fRooms, fSensors, fProxies, selSensor, selBleProxy: ctx.selBleProxy, doorSensorsList, pirSensorsList })}
          </div>
        </div>`
          : ""
      }
    </div>

    <!-- Collapsible Coverage Notes Bar -->
    <div class="advanced-toggle-bar" id="btn-toggle-fp-notes">
      <div>
        <div style="font-size:14px;font-weight:500;color:var(--ha-text);">
          ${panel._showFloorplanNotes ? "▾ Hide Coverage & Shared Camera Notes" : `▸ Coverage & Shared Camera Notes (${ambiguities.length})`}
        </div>
        <div style="font-size:12.5px;color:var(--ha-muted);margin-top:2px;">
          Areas where a camera sees into a neighboring room or where a room has no direct camera coverage
        </div>
      </div>
      <span style="font-size:12.5px;color:var(--ha-primary-text);font-weight:500;">
        ${panel._showFloorplanNotes ? "Collapse" : "Expand"}
      </span>
    </div>

    ${
      panel._showFloorplanNotes
        ? (() => {
            const catLabels = {
              camera_spillover: "Camera Spillover",
              blind_pocket: "Blind Pocket",
              unsealed_perimeter: "Unsealed Exit",
              vertical_ble_bleed: "Vertical BLE Bleed",
            };
            const hiCnt = ambiguities.filter((a) => a.severity === "high").length;
            const medCnt = ambiguities.filter((a) => a.severity === "medium").length;
            const lowCnt = ambiguities.length - hiCnt - medCnt;
            return `
      <div class="ha-card">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
          <div style="font-size:12.5px;color:var(--ha-muted);">
            Detected spatial overlaps &amp; sensor coverage edge cases. Use the buttons on any card to inspect the camera on the map or tune the room.
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${hiCnt > 0 ? `<span class="cov-badge sev-high">${hiCnt} High</span>` : ""}
            ${medCnt > 0 ? `<span class="cov-badge sev-medium">${medCnt} Medium</span>` : ""}
            ${lowCnt > 0 ? `<span class="cov-badge sev-low">${lowCnt} Info</span>` : ""}
          </div>
        </div>
        ${
          ambiguities.length === 0
            ? `<div style="font-size:13px;color:var(--ha-success-text);padding:8px 0;">✓ No coverage ambiguities detected on this floorplan.</div>`
            : `<div class="cov-notes-grid">
          ${ambiguities
            .map((amb) => {
              const sev = ["high", "medium", "low"].includes(amb.severity) ? amb.severity : "low";
              const cat = catLabels[amb.category] || "Spatial Note";
              const roomList = Array.isArray(amb.rooms) && amb.rooms.length ? amb.rooms : amb.room ? [amb.room] : [];
              const primaryRoom = roomList[0] || "";
              const rec = amb.resolution || amb.recommendation || "";
              return `
            <div class="cov-note-card sev-${sev}">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap;">
                <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;">
                  <span class="cov-badge sev-${sev}">${panel._escape(sev)}</span>
                  <span style="font-size:11px;font-weight:600;color:var(--ha-muted);background:var(--ha-card);border:1px solid var(--ha-divider);padding:2px 7px;border-radius:999px;">${panel._escape(cat)}</span>
                  <span style="font-size:14px;font-weight:600;color:var(--ha-text);">${panel._formatInlineCode(
                    amb.title || amb.room || roomList.join(" ↔ ")
                  )}</span>
                </div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;">
                  ${
                    amb.camera_id
                      ? `<button type="button" class="btn btn-sm" data-focus-fp-cam="${panel._escape(amb.camera_id)}" title="Highlight this camera on the floorplan">📹 Locate Camera</button>`
                      : ""
                  }
                  ${
                    primaryRoom
                      ? `<button type="button" class="btn btn-sm" data-jump-room-name="${panel._escape(primaryRoom)}" title="Open ${panel._escape(primaryRoom)} room settings">Edit ${panel._escape(primaryRoom)} &rarr;</button>`
                      : ""
                  }
                </div>
              </div>
              <div style="font-size:12.5px;color:var(--ha-text);line-height:1.5;">
                <strong style="color:var(--ha-muted);font-size:11.5px;text-transform:uppercase;letter-spacing:0.03em;">Issue:</strong>
                ${panel._formatInlineCode(amb.description)}
              </div>
              ${
                rec
                  ? `<div style="font-size:12.5px;color:var(--ha-primary-text);line-height:1.5;">
                <strong style="font-size:11.5px;text-transform:uppercase;letter-spacing:0.03em;">Suggested Fix:</strong>
                ${panel._formatInlineCode(rec)}
              </div>`
                  : ""
              }
              ${
                roomList.length > 0
                  ? `<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:2px;">
                <span style="font-size:11px;color:var(--ha-muted);">Affected rooms:</span>
                ${roomList
                  .map((rn) => {
                    const rc = panel._getRoomColor(rn);
                    return `<span class="ha-chip" style="padding:2px 8px;font-size:11.5px;border-color:${rc.border};background:${rc.bg};"><span class="room-color-dot" style="background:${rc.hex};"></span>${panel._escape(rn)}</span>`;
                  })
                  .join("")}
              </div>`
                  : ""
              }
            </div>`;
            })
            .join("")}
        </div>`
        }
      </div>`;
          })()
        : ""
    }
  `;
}
