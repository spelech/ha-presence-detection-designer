import { PDD_DEFAULT_FLOORPLAN } from "../shared/defaults.js";
// Whole-house spatial timeline playback controls and pane renderer.


export function toggleTimelinePlay(panel, forceState = null) {
  panel._timelinePlaying =
    forceState !== null && forceState !== undefined
      ? Boolean(forceState)
      : !panel._timelinePlaying;
  clearInterval(panel._timelineTimer);
  if (panel._timelinePlaying) {
    const intervalMs = Math.max(80, Math.round(600 / (panel._timelineSpeed || 1)));
    panel._timelineTimer = setInterval(() => {
      const frames = panel._timelineData?.frames || [];
      if (frames.length === 0) {
        panel._timelinePlaying = false;
        clearInterval(panel._timelineTimer);
        return;
      }
      panel._timelineFrameIdx = (panel._timelineFrameIdx + 1) % frames.length;
      if (!panel._updateTimelineFrameInPlace()) {
        panel.render();
      }
    }, intervalMs);
  }
  const playBtn = panel.shadowRoot?.querySelector?.("#btn-tl-play");
  if (playBtn && panel._studioView === "timeline") {
    playBtn.textContent = panel._timelinePlaying ? "⏸ Pause" : "▶ Play";
  } else {
    panel.render();
  }
}


export function renderTimelinePane(panel) {
  const tl = panel._timelineData;
  const fp = panel._floorplan || panel._overview?.floorplan || PDD_DEFAULT_FLOORPLAN;
  const floors = fp.floors || [];

  if (!tl) {
    return `
      <div class="ha-card">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <h2 class="card-title" style="font-size:18px;">🎯 Whole-House Spatial Timeline &amp; Playback</h2>
            <div class="card-desc">Loading historical occupant positions and room movement records...</div>
          </div>
          <button class="btn btn-sm" id="btn-reload-timeline">Reload Timeline</button>
        </div>
      </div>`;
  }

  const parts = panel._buildTimelineFrameParts();
  const { frames, frameIdx, curTimeStr, occupiedRoomsList, floorParts } = parts;
  const transitions = tl.transitions || [];
  const summary = tl.comparison_summary || tl.summary || {};
  const totalSubregionFrames = Number(
    summary.uncovered_subregion_localizations ?? summary.negative_space_subregion_frames ?? 0
  );
  const totalBlindPocketFrames = Number(
    summary.blind_pocket_holds_count ?? summary.blind_pocket_hold_frames ?? 0
  );
  const totalShadeExclusionFrames = Number(
    summary.shade_sunlight_exclusions_count ?? 0
  );
  const totalDeltaFrames = Object.values(summary.per_room_delta || {}).reduce(
    (acc, d) => acc + Math.abs(Number(d?.delta_frames || 0)),
    0
  );

  const entityNameMap = new Map();
  ((panel._overview && panel._overview.entities) || []).forEach((e) => {
    if (e && e.entity_id) entityNameMap.set(e.entity_id, e.name || e.entity_id);
  });

  const isAllFloors = panel._timelineFloor === "all" && floorParts.length > 1;
  const mapsMarkup = isAllFloors
    ? `<div id="tl-maps-grid" class="tl-all-floors-grid">
        ${floorParts
          .map(
            (fpData) => `
          <div class="tl-floor-card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <span style="font-size:12px;font-weight:700;color:#0f172a;">${panel._escape(
                fpData.floor.name.replace(/\s*\(.*\)/, "")
              )}</span>
              <span data-tl-floor-count="${panel._escape(fpData.floor.id)}" style="font-size:11px;color:#475569;">${fpData.occupantTokens.length} active</span>
            </div>
            <svg class="tl-floor-svg" data-tl-floor-svg="${panel._escape(fpData.floor.id)}" viewBox="0 0 1000 580" style="width:100%;height:auto;min-height:220px;display:block;">
              ${fpData.svgInner}
            </svg>
          </div>`
          )
          .join("")}
      </div>`
    : `<svg id="tl-svg-canvas" viewBox="0 0 1000 580" style="width:100%;height:auto;min-height:360px;display:block;">
        ${parts.svgInner}
      </svg>`;

  return `
    <div class="ha-card">
      <div class="card-head" style="flex-wrap:wrap;gap:12px;">
        <div>
          <h2 class="card-title" style="font-size:18px;">🎯 Whole-House Spatial Timeline &amp; Playback</h2>
          <div class="card-desc">
            Shows where each person, child, and pet is across all floors, with directional arrows from their previous room.
          </div>
        </div>

        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <button
            class="btn btn-sm"
            id="btn-timeline-toggle-neg-space"
            style="background:${panel._timelineNegativeSpace ? "var(--ha-accent-purple-bg)" : "var(--ha-subtle)"};color:${panel._timelineNegativeSpace ? "var(--ha-accent-purple-text)" : "var(--ha-text)"};border-color:${panel._timelineNegativeSpace ? "var(--ha-accent-purple-border)" : "var(--ha-divider)"};font-weight:600;"
            data-tip="Compare timeline playback WITH vs WITHOUT Negative-Space inference."
            data-tip-align="right"
            title="Compare timeline playback WITH vs WITHOUT Negative-Space inference"
          >
            🎯 Negative-Space: ${panel._timelineNegativeSpace ? "ON" : "OFF"}
          </button>

          <div class="seg-group" style="margin-top:0;">
            ${[
              { h: 1, label: "1h" },
              { h: 6, label: "6h" },
              { h: 24, label: "24h" },
              { h: 168, label: "7d" },
            ]
              .map(
                (w) =>
                  `<button class="seg-btn ${
                    Number(panel._timelineHours) === w.h ? "active" : ""
                  }" data-timeline-hours="${w.h}" style="padding:5px 10px;">${w.label}</button>`
              )
              .join("")}
          </div>
        </div>
      </div>

      <!-- KPI Summary Bar -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(170px, 1fr));gap:10px;margin-bottom:14px;">
        <div style="background:var(--ha-subtle);border:1px solid var(--ha-divider);border-radius:8px;padding:8px 12px;">
          <div style="font-size:11px;color:var(--ha-muted);">Timeline Window (${summary.window_hours || panel._timelineHours}h · ${tl.source === "component_logs" ? "Component Logs" : "Sensor Replay"})</div>
          <div style="font-size:16px;font-weight:700;">${Number(tl.frame_count || frames.length)} frames · ${Number(transitions.length)} events</div>
        </div>
        <div style="background:var(--ha-accent-cyan-bg);border:1px solid var(--ha-accent-cyan-border);border-radius:8px;padding:8px 12px;">
          <div style="font-size:11px;color:var(--ha-accent-cyan-text);">Inferred Uncovered Areas</div>
          <div style="font-size:16px;font-weight:700;color:var(--ha-accent-cyan-text);">${totalSubregionFrames} localizations</div>
        </div>
        <div style="background:var(--ha-accent-cyan-bg);border:1px solid var(--ha-accent-cyan-border);border-radius:8px;padding:8px 12px;">
          <div style="font-size:11px;color:var(--ha-accent-cyan-text);">Blind-Room Holds (Bathrooms)</div>
          <div style="font-size:16px;font-weight:700;color:var(--ha-accent-cyan-text);">${totalBlindPocketFrames} frames (${totalDeltaFrames} A/B diffs)</div>
        </div>
        <div style="background:var(--ha-accent-amber-bg);border:1px solid var(--ha-accent-amber-border);border-radius:8px;padding:8px 12px;">
          <div style="font-size:11px;color:var(--ha-accent-amber-text);">Moving Shades Filtered</div>
          <div style="font-size:16px;font-weight:700;color:var(--ha-accent-amber-text);">☀️ ${totalShadeExclusionFrames} frames ignored</div>
        </div>
      </div>

      <!-- Scrubber Transport Controls -->
      <div style="display:flex;align-items:center;gap:10px;background:var(--ha-subtle);border:1px solid var(--ha-divider);border-radius:10px;padding:10px 14px;margin-bottom:14px;flex-wrap:wrap;">
        <button class="btn btn-sm" id="btn-tl-prev" title="Previous Frame">⏮</button>
        <button class="btn btn-primary btn-sm" id="btn-tl-play" style="min-width:78px;">
          ${panel._timelinePlaying ? "⏸ Pause" : "▶ Play"}
        </button>
        <button class="btn btn-sm" id="btn-tl-next" title="Next Frame">⏭</button>

        <div class="seg-group" style="margin-top:0;">
          ${[1, 5, 15]
            .map(
              (spd) =>
                `<button class="seg-btn tl-speed-btn ${
                  Number(panel._timelineSpeed) === spd ? "active" : ""
                }" data-tl-speed="${spd}" style="padding:3px 8px;font-size:11.5px;">${spd}x</button>`
            )
            .join("")}
        </div>

        <input
          type="range"
          id="tl-scrubber-slider"
          min="0"
          max="${Math.max(0, frames.length - 1)}"
          step="1"
          value="${frameIdx}"
          style="flex:1;min-width:180px;cursor:pointer;"
        />

        <div id="tl-time-readout" style="font-family:var(--ha-mono);font-size:12.5px;font-weight:600;min-width:155px;text-align:right;">
          ${panel._escape(curTimeStr)} <span style="color:var(--ha-muted);font-weight:400;">(${frameIdx + 1}/${frames.length})</span>
        </div>
      </div>

      <!-- Split 2D Floorplan Playback + ASD-STE100 Movement Log -->
      <div class="timeline-split-grid">
        <div style="background:#f8fafc;color:#0f172a;border:1px solid var(--ha-divider);border-radius:10px;padding:10px;">
          <div class="fp-map-toolbar">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <span style="font-size:12px;font-weight:700;color:#0f172a;">Floor:</span>
              <div class="seg-group" style="margin-top:0;background:rgba(15,23,42,0.06);border-color:rgba(15,23,42,0.12);">
                <button class="seg-btn ${panel._timelineFloor === "all" ? "active" : ""}" data-tl-floor="all" style="padding:4px 11px;">
                  All Floors
                </button>
                ${floors
                  .map(
                    (fl) => `
                  <button class="seg-btn ${panel._timelineFloor === fl.id ? "active" : ""}" data-tl-floor="${panel._escape(fl.id)}" style="padding:4px 11px;">
                    ${panel._escape(fl.name.replace(/\s*\(.*\)/, ""))}
                  </button>`
                  )
                  .join("")}
              </div>
            </div>
            <span id="tl-floor-label" style="font-size:11.5px;color:#475569;font-weight:500;">${
              panel._timelineFloor === "all"
                ? `All ${floors.length} Floors`
                : panel._escape(parts.activeFloor.name.replace(/\s*\(.*\)/, ""))
            }</span>
          </div>
          ${mapsMarkup}
          <div style="display:flex;justify-content:space-between;align-items:center;padding-top:8px;font-size:11.5px;color:#475569;flex-wrap:wrap;gap:8px;">
            <span style="display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap;">
              <span style="display:inline-flex;align-items:center;gap:4px;"><span style="display:inline-block;width:11px;height:11px;border-radius:50%;border:2.5px solid #16a34a;vertical-align:middle;"></span>Confirmed</span>
              <span>&middot;</span>
              <span style="display:inline-flex;align-items:center;gap:4px;"><span style="display:inline-block;width:11px;height:11px;border-radius:50%;border:2.5px dashed #0284c7;vertical-align:middle;"></span>Inferred</span>
              <span>&middot;</span>
              <span>┄▶ Moved From</span>
              <span>&middot;</span>
              <span>🩵 Clear Camera Cone</span>
            </span>
            <span>
              House Mode: <strong id="tl-visible-occupants-count">${panel._escape(panel._formatTimelineHouseMode(frames[frameIdx] || {}, tl))}</strong>
              &nbsp;|&nbsp; Active Rooms: <strong id="tl-active-rooms">${panel._escape(occupiedRoomsList.join(", ") || "None")}</strong>
            </span>
          </div>
        </div>

        <div id="tl-log-scroll" style="background:var(--ha-subtle);border:1px solid var(--ha-divider);border-radius:10px;padding:12px;max-height:680px;overflow:auto;">
          <div style="font-weight:600;font-size:13px;margin-bottom:8px;">Movement &amp; Inference Log (${transitions.length})</div>
          ${
            transitions.length === 0
              ? `<div style="font-size:12.5px;color:var(--ha-muted);">No room changes occurred in this time range.</div>`
              : transitions
                  .slice()
                  .reverse()
                  .map((tr) => {
                    const rawTrTs = tr.iso || tr.timestamp;
                    const tStr = rawTrTs
                      ? new Date(rawTrTs).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                      : "";
                    const fIdx = frames.findIndex((f) => (f.iso || f.timestamp) === rawTrTs);
                    const ste = panel._formatTransitionSte100(tr, entityNameMap);
                    const toColor = panel._getRoomColor(ste.toRoom);
                    const borderAccent = ste.isPet
                      ? "var(--ha-accent-amber-border)"
                      : ste.isInferred
                      ? "var(--ha-accent-cyan-border)"
                      : "var(--ha-divider)";
                    return `
                      <div
                        class="tl-transition-row"
                        data-frame-idx="${fIdx >= 0 ? fIdx : 0}"
                        style="padding:8px 10px;margin-bottom:6px;background:var(--ha-card);border:1px solid ${borderAccent};border-radius:8px;cursor:pointer;font-size:12px;"
                      >
                        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
                          <span style="display:inline-flex;align-items:center;gap:6px;font-weight:700;color:var(--ha-text);">
                            <span class="room-color-dot" style="background:${toColor.hex};"></span>
                            ${panel._escape(ste.actionText)}
                          </span>
                          <span style="font-family:var(--ha-mono);font-size:11px;color:var(--ha-muted);white-space:nowrap;">${panel._escape(tStr)}</span>
                        </div>
                        <div style="color:${ste.isPet ? "var(--ha-accent-amber-text)" : ste.isInferred ? "var(--ha-accent-cyan-text)" : "var(--ha-success-text)"};font-weight:500;margin-top:3px;">
                          Zone: ${panel._escape(ste.zoneText)}
                        </div>
                        ${
                          ste.reasonText
                            ? `<div style="font-size:11.5px;color:var(--ha-muted);margin-top:3px;line-height:1.4;">${panel._escape(
                                ste.reasonText
                              )}</div>`
                            : ""
                        }
                      </div>`;
                  })
                  .join("")
          }
        </div>
      </div>
    </div>
  `;
}

