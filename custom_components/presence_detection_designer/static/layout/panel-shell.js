import { renderSettingsModal } from "./settings-modal.js";

export function renderPanelShell(panel) {
  const scrollPanel = panel.shadowRoot?.querySelector?.(".panel-scroll-frame");
  const prevScroll = scrollPanel
    ? { top: scrollPanel.scrollTop, left: scrollPanel.scrollLeft }
    : null;
  const scrollRoomList = panel.shadowRoot?.querySelector?.(".room-list");
  const prevRoomListScroll = scrollRoomList ? scrollRoomList.scrollTop : null;
  const scrollTlLog = panel.shadowRoot?.querySelector?.("#tl-log-scroll");
  const prevTlLogScroll = scrollTlLog ? scrollTlLog.scrollTop : null;
  const keepMainScroll = panel._lastRenderedView === panel._studioView;
  const rooms = (panel._overview && panel._overview.rooms) || [];
  const areas = (panel._overview && panel._overview.areas) || [];
  const entities = (panel._overview && panel._overview.entities) || [];
  const presets = (panel._overview && panel._overview.presets) || {};
  const occupiedCount = rooms.filter((r) => r.is_present).length;

  const entityNameMap = {};
  entities.forEach((e) => {
    entityNameMap[e.entity_id] = e.name || e.entity_id;
  });

  const filteredRooms = rooms.filter((r) => {
    if (panel._roomFilter === "occupied" && !r.is_present) return false;
    if (panel._roomFilter === "vacant" && r.is_present) return false;
    if (
      panel._roomSearch &&
      !r.room_name.toLowerCase().includes(panel._roomSearch.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const selRoom = panel.selectedRoom;
  const cfg = panel._draftConfig || {};
  const prev = panel._previewData || {};
  const activeMap = {};
  (prev.active_observations || []).forEach((o) => {
    activeMap[`${o.entity_id}|${o.label}`] = o;
    activeMap[o.entity_id] = o;
  });

  const isDarkTheme = Boolean(
    panel._hass?.themes?.darkMode ||
      (typeof document !== "undefined" &&
        (document.documentElement.classList.contains("dark") ||
          document.documentElement.getAttribute("data-theme") === "dark" ||
          (() => {
            try {
              const bg = getComputedStyle(this).getPropertyValue("--primary-background-color").trim();
              return bg.startsWith("#1") || bg.startsWith("#0") || bg.startsWith("#2");
            } catch (_e) {
              return false;
            }
          })()))
  );

  panel.shadowRoot.innerHTML = `
        <link rel="stylesheet" href="/presence_detection_designer/static/panel.css?v=${panel._escape(panel._version || '0.4.3')}" />

    <div class="pdd-shell" data-bp="${panel._escape(panel._containerBp || "full")}">
    <div id="pdd-toast-container" style="position:absolute;bottom:20px;right:24px;z-index:40;"></div>

    <datalist id="pdd-all-entities">
      ${entities
        .map(
          (e) =>
            `<option value="${panel._escape(e.entity_id)}">${panel._escape(e.name)} (${panel._escape(
              e.state
            )})</option>`
        )
        .join("")}
    </datalist>

    <!-- Clean Home Assistant Header Bar -->
    <div class="app-header">
      <div class="header-left">
        ${
          panel._narrow || panel._hass?.dockedSidebar === "always_hidden"
            ? `<button class="btn-text" id="btn-toggle-ha-sidebar" title="Toggle Sidebar" style="font-size:18px;padding:4px 8px;">☰</button>`
            : ""
        }
        <h1 class="header-title">Presence Detection</h1>
        <span style="font-size:11px;font-weight:600;padding:2px 7px;border-radius:999px;background:var(--ha-subtle);border:1px solid var(--ha-divider);color:var(--ha-muted);">v${panel._escape(
          panel._panelVersion || "0.3.2"
        )}</span>
        <span class="header-summary">${occupiedCount} of ${rooms.length} rooms occupied</span>
      </div>

      <div class="nav-tabs">
        <button class="nav-tab ${panel._studioView === "design" ? "active" : ""}" data-studio-view="design">Rooms</button>
        <button class="nav-tab ${panel._studioView === "floorplan" ? "active" : ""}" data-studio-view="floorplan">Floorplan &amp; Sensors</button>
        <button class="nav-tab ${panel._studioView === "timeline" ? "active" : ""}" data-studio-view="timeline">Whole-House Timeline</button>
        <button class="nav-tab ${
          panel._studioView === "statistics" || panel._studioView === "replay" ? "active" : ""
        }" data-studio-view="statistics">Activity History</button>
      </div>

      <div class="header-actions">
        <button
          class="btn btn-sm"
          id="btn-quick-toggle-guest-mode"
          data-tip="Pauses Negative-Space localization, blind-pocket holds, adjacent-room hand-offs, LLM camera checks, and Slack transition alerts when multiple people or guests are visiting."
          data-tip-pos="bottom"
          data-tip-align="right"
          title="Guest Mode: Pause Negative-Space raycasting, blind-pocket holds, adjacent-room timer clearing, LLM snapshot checks, and per-room Slack transition alerts when guests or multiple untracked occupants are moving around"
          style="border-color:${
            panel._overview?.global_settings?.guest_mode_enabled
              ? "var(--ha-warning-text)"
              : "var(--ha-divider)"
          };background:${
            panel._overview?.global_settings?.guest_mode_enabled
              ? "rgba(217, 119, 6, 0.14)"
              : "var(--ha-card)"
          };color:${
            panel._overview?.global_settings?.guest_mode_enabled
              ? "var(--ha-warning-text)"
              : "var(--ha-muted)"
          };font-weight:600;"
        >
          👥 Guest Mode: ${
            panel._overview?.global_settings?.guest_mode_enabled ? "ON" : "OFF"
          }
        </button>
        <button
          class="btn btn-sm"
          id="btn-quick-toggle-neg-space"
          data-tip="Master switch for 'Where It Isn't' spatial exclusion: subtracts clear camera & PIR cones to pinpoint occupants in blind pockets and subregions."
          data-tip-pos="bottom"
          data-tip-align="right"
          title="Global Master Switch: Toggle Negative-Space Spatial Exclusion in live Bayesian room inference"
          style="border-color:${
            panel._overview?.global_settings?.negative_space_enabled !== false &&
            !panel._overview?.global_settings?.guest_mode_enabled
              ? "var(--ha-primary-text)"
              : "var(--ha-divider)"
          };background:${
            panel._overview?.global_settings?.negative_space_enabled !== false &&
            !panel._overview?.global_settings?.guest_mode_enabled
              ? "rgba(3, 105, 161, 0.12)"
              : "var(--ha-card)"
          };color:${
            panel._overview?.global_settings?.negative_space_enabled !== false &&
            !panel._overview?.global_settings?.guest_mode_enabled
              ? "var(--ha-primary-text)"
              : "var(--ha-muted)"
          };font-weight:600;"
        >
          🎯 Negative-Space: ${
            panel._overview?.global_settings?.guest_mode_enabled
              ? "PAUSED"
              : panel._overview?.global_settings?.negative_space_enabled !== false
              ? "ON"
              : "OFF"
          }
        </button>
        <button class="btn btn-sm" id="btn-header-global">⚙️ Settings</button>
        <button class="btn btn-sm" id="btn-refresh-overview">Refresh</button>
      </div>
    </div>

    <div class="panel-scroll-frame">
      <div class="workspace ${panel._studioView === "design" ? "" : "no-sidebar"}">
        ${
          panel._studioView === "design"
            ? `
        <!-- LEFT SIDEBAR: Room List (Rooms tab only) -->
        <div class="sidebar-card">
          <div class="sidebar-top">
            <div style="display:flex;gap:6px;align-items:center;margin-bottom:8px;">
              <input
                type="text"
                class="input"
                id="room-search-input"
                placeholder="Search rooms..."
                value="${panel._escape(panel._roomSearch)}"
                style="flex:1;"
              />
              <button
                class="btn btn-sm"
                id="btn-add-new-room"
                title="Create a new room in Home Assistant"
                style="white-space:nowrap;padding:4px 8px;font-size:12px;font-weight:600;"
              >
                + Add Room
              </button>
            </div>
            <div class="seg-group">
              ${[
                { id: "all", label: "All" },
                { id: "occupied", label: "Occupied" },
                { id: "vacant", label: "Clear" },
              ]
                .map(
                  (f) => `
                <button class="seg-btn ${panel._roomFilter === f.id ? "active" : ""}" data-filter="${f.id}">
                  ${f.label}
                </button>`
                )
                .join("")}
            </div>
          </div>

          <div class="room-list">
            ${filteredRooms
              .map((r) => {
                const st = panel._roomStatusSummary(r);
                const rc = panel._getRoomColor(r.room_name);
                return `
                  <div class="room-row ${
                    r.entry_id === panel._selectedRoomId ? "selected" : ""
                  }" data-room-id="${panel._escape(r.entry_id)}" style="box-shadow:inset 4px 0 0 ${rc.hex};">
                    <div class="room-row-left">
                      <span class="status-dot ${st.dotClass}" title="Occupancy: ${panel._escape(st.label)}"></span>
                      <span class="room-row-name">${panel._escape(r.room_name)}</span>
                    </div>
                    <span class="room-row-status ${st.dotClass}">${panel._escape(st.label)}</span>
                  </div>`;
              })
              .join("")}
          </div>
        </div>`
            : `
        <!-- COMPACT ROOM BADGE STRIP (Non-Rooms tabs) -->
        <div class="room-badge-strip">
          <div class="room-badge-strip-head">
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
              <span style="font-size:12px;font-weight:700;color:var(--ha-text);">${
                panel._studioView === "floorplan" || panel._studioView === "timeline"
                  ? `Focus Room on Map (${occupiedCount}/${rooms.length} occupied)`
                  : `Rooms (${occupiedCount}/${rooms.length} occupied)`
              }</span>
              <div class="seg-group" style="margin-top:0;">
                ${[
                  { id: "all", label: "All" },
                  { id: "occupied", label: "Occupied" },
                  { id: "vacant", label: "Clear" },
                ]
                  .map(
                    (f) => `
                  <button class="seg-btn ${panel._roomFilter === f.id ? "active" : ""}" data-filter="${f.id}" style="padding:3px 9px;min-height:22px;font-size:11.5px;">
                    ${f.label}
                  </button>`
                  )
                  .join("")}
              </div>
              <span style="font-size:11.5px;color:var(--ha-muted);">
                ${
                  panel._studioView === "floorplan" || panel._studioView === "timeline"
                    ? "Click a room pill to jump to its floor &amp; highlight it on the map."
                    : "Click a room pill to inspect its history."
                }
              </span>
            </div>
            <button class="btn-text" id="btn-jump-edit-selected-room" style="font-size:12px;padding:3px 8px;font-weight:600;color:var(--ha-primary-text);">
              Edit ${panel._escape(selRoom?.room_name || "Selected Room")} &rarr;
            </button>
          </div>
          <div class="room-badge-list">
            ${filteredRooms
              .map((r) => {
                const st = panel._roomStatusSummary(r);
                const rc = panel._getRoomColor(r.room_name);
                const isSel = r.entry_id === panel._selectedRoomId;
                return `
                  <button
                    type="button"
                    class="room-badge-pill ${st.dotClass} ${isSel ? "selected" : ""}"
                    data-room-badge-id="${panel._escape(r.entry_id)}"
                    style="border-color:${isSel ? rc.hex : rc.border};background:${isSel ? rc.bg : ""};box-shadow:${isSel ? `0 0 0 1.5px ${rc.hex}` : "none"};"
                    data-tip="${panel._escape(r.room_name)}: ${panel._escape(st.label)}. Click to focus on map or edit."
                    title="${panel._escape(r.room_name)} — ${panel._escape(st.label)}"
                  >
                    <span class="room-color-dot" style="background:${rc.hex};${st.occupied ? "box-shadow:0 0 0 2px #16a34a;" : ""}"></span>
                    <span>${panel._escape(r.room_name)}</span>
                    ${st.occupied ? `<span class="room-live-tag">LIVE</span>` : ""}
                  </button>`;
              })
              .join("")}
          </div>
        </div>`
        }

        <!-- MAIN WORKSPACE -->
        ${
          panel._studioView === "floorplan"
            ? `<div class="content-stack wide">${panel._renderFloorplanPane(selRoom)}</div>`
            : panel._studioView === "timeline"
            ? `<div class="content-stack wide">${panel._renderTimelinePane()}</div>`
            : panel._studioView === "statistics"
            ? `<div class="content-stack wide">${panel._renderStatisticsPane(selRoom)}</div>`
            : panel._studioView === "replay"
            ? `<div class="content-stack wide">${panel._renderReplayPane(selRoom, presets)}</div>`
            : `<div class="content-stack">${panel._renderSimpleRoomEditor(
                selRoom,
                cfg,
                prev,
                rooms,
                areas,
                entities,
                entityNameMap,
                presets,
                activeMap
              )}</div>`
        }
      </div>
    </div>

        ${renderSettingsModal(panel)}
    </div>
  `;

  panel.shadowRoot
    .querySelectorAll(".room-row, .advanced-toggle-bar, .tl-transition-row")
    .forEach((el) => {
      if (!el.getAttribute("role")) {
        el.setAttribute("role", "button");
      }
    });
  panel.shadowRoot
    .querySelectorAll("input, select, textarea, button")
    .forEach((el) => {
      if (!el.getAttribute("aria-label") && !el.getAttribute("title")) {
        const fallback =
          el.getAttribute("placeholder") ||
          el.getAttribute("data-key") ||
          el.id ||
          el.tagName.toLowerCase();
        el.setAttribute("aria-label", fallback);
      }
    });

  panel.renderToastOnly();
  panel._bindEvents();

  const nextPanel = panel.shadowRoot?.querySelector?.(".panel-scroll-frame");
  if (nextPanel) {
    if (keepMainScroll && prevScroll) {
      nextPanel.scrollTop = prevScroll.top;
      nextPanel.scrollLeft = prevScroll.left;
    } else if (!keepMainScroll) {
      nextPanel.scrollTop = 0;
      nextPanel.scrollLeft = 0;
    }
  }
  const nextRoomList = panel.shadowRoot?.querySelector?.(".room-list");
  if (nextRoomList && prevRoomListScroll !== null) {
    nextRoomList.scrollTop = prevRoomListScroll;
  }
  const nextTlLog = panel.shadowRoot?.querySelector?.("#tl-log-scroll");
  if (nextTlLog && prevTlLogScroll !== null) {
    nextTlLog.scrollTop = prevTlLogScroll;
  }
  panel._lastRenderedView = panel._studioView;
}
