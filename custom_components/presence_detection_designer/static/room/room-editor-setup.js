// Room Editor: Setup tab (Room identity, area assignment, connections, and boundaries).

export function renderRoomSetupTab(panel, {
  selRoom, cfg, rooms, areas, entities, entityNameMap, connectedRooms, boundaries, hasDoorSeal, timeoutSec, timeoutMinText,
}) {
  return `
  <!-- Card: Room Identity & Area Assignment -->
  <div class="ha-card">
    <div class="card-head">
      <div>
        <h3 class="card-title">Room Identity &amp; Area Assignment</h3>
        <div class="card-desc">
          Assign this room to a Home Assistant physical area and configure clear timeouts.
        </div>
      </div>
    </div>

    <div class="list-divider">
      <div class="setting-row">
        <div>
          <div class="setting-label">Home Assistant Area</div>
          <div class="setting-help">
            Link this room to a physical area to align entity discovery, device placement, and automations.
          </div>
        </div>
        <div style="min-width:220px;">
          <select class="select" id="cfg-area-id">
            <option value="">— None —</option>
            ${areas
              .map(
                (a) =>
                  `<option value="${panel._escape(a.id)}" ${
                    cfg.area_id === a.id ? "selected" : ""
                  }>${panel._escape(a.name)}</option>`
              )
              .join("")}
          </select>
        </div>
      </div>

      <div class="setting-row">
        <div>
          <div class="setting-label">Clear after inactivity</div>
          <div class="setting-help">How long to wait after all sensors stop seeing activity before clearing occupancy (${timeoutMinText}).</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;width:150px;">
          <input
            type="number"
            class="input"
            id="cfg-inactivity-timeout"
            min="15"
            max="3600"
            step="15"
            value="${timeoutSec}"
          />
          <span style="font-size:13px;color:var(--ha-muted);">sec</span>
        </div>
      </div>

      <div class="setting-row">
        <div>
          <div class="setting-label">Primary AI Vision Camera (optional)</div>
          <div class="setting-help">Frigate or HA camera used to visually confirm or verify room occupancy.</div>
          ${(() => {
            const fb = panel._lastVerifyFeedback?.[selRoom.entry_id];
            const isVerifying = panel._verifyingRoomId === selRoom.entry_id;
            if (isVerifying) {
              return `<div id="cfg-verify-feedback" style="font-size:12px;color:var(--ha-primary-text);margin-top:4px;font-weight:500;">⏳ Capturing camera snapshot and running Vision AI check...</div>`;
            }
            if (fb) {
              const tStr = fb.ts ? new Date(fb.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "";
              const failedSnap = String(fb.reason || "").toLowerCase().includes("failed to capture");
              const color = failedSnap ? "var(--ha-warning-text)" : fb.detected ? "var(--ha-success-text)" : "var(--ha-muted)";
              const badge = failedSnap ? "⚠️ Snapshot issue" : fb.detected ? "✓ Person detected" : "○ Clear";
              return `<div id="cfg-verify-feedback" style="font-size:12px;color:${color};margin-top:4px;font-weight:500;">Last check (${panel._escape(tStr)}): <strong>${badge}</strong> — ${panel._escape(fb.reason)}</div>`;
            }
            return `<div id="cfg-verify-feedback" style="font-size:11.5px;color:var(--ha-muted);margin-top:4px;">Click <strong>Check</strong> to test live Vision AI on the selected camera.</div>`;
          })()}
        </div>
        <div style="display:flex;align-items:center;gap:6px;min-width:280px;max-width:380px;">
          <select class="select" id="cfg-camera-entity" title="Select Home Assistant camera entity by friendly name">
            ${panel._renderCameraSelectOptions(cfg.camera_entity || "", entities)}
          </select>
          <button
            type="button"
            class="btn btn-sm"
            id="btn-room-verify"
            data-tip="Captures a live snapshot from the selected camera and asks Vision AI whether a person is present."
            data-tip-align="right"
            title="Run AI Vision Check now"
            ${panel._verifyingRoomId === selRoom.entry_id ? "disabled" : ""}
          >${panel._verifyingRoomId === selRoom.entry_id ? "⏳ Checking..." : "Check"}</button>
        </div>
      </div>

      ${
        isAdv
          ? `
      <div class="setting-row">
        <div>
          <div class="setting-label">Bounded max hold timeout</div>
          <div class="setting-help">Maximum time <code>occupied_holding</code> can remain active on secondary signals (Bayesian/condition/blind-pocket) before cooling down (${panel._formatDuration(Number(cfg.max_hold_timeout ?? selRoom.max_hold_timeout ?? 1800))}).</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;width:150px;">
          <input
            type="number"
            class="input"
            id="cfg-max-hold-timeout"
            min="60"
            max="14400"
            step="60"
            value="${Number(cfg.max_hold_timeout ?? selRoom.max_hold_timeout ?? 1800)}"
          />
          <span style="font-size:13px;color:var(--ha-muted);">sec</span>
        </div>
      </div>

      <div class="setting-row">
        <div>
          <div class="setting-label">PIR validation gate (corroboration)</div>
          <div class="setting-help">Require transient PIR motion to be corroborated within the candidate window (camera, adjacent room, door, BLE, or second pulse) before confirming occupancy.</div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <label style="display:flex;align-items:center;gap:6px;font-size:12.5px;cursor:pointer;" data-tip="Hold solo PIR motion briefly until corroborated by an adjacent room, door, camera, BLE, or second pulse." data-tip-align="right">
            <input
              type="checkbox"
              id="cfg-pir-validation-enabled"
              ${cfg.pir_validation_enabled !== false ? "checked" : ""}
            />
            <span>Enabled</span>
          </label>
          <div style="display:flex;align-items:center;gap:6px;width:110px;">
            <input
              type="number"
              class="input"
              id="cfg-pir-candidate-window"
              min="3"
              max="120"
              step="1"
              value="${Number(cfg.pir_candidate_window ?? selRoom.pir_candidate_window ?? 15)}"
              ${cfg.pir_validation_enabled === false ? "disabled" : ""}
            />
            <span style="font-size:12.5px;color:var(--ha-muted);">s</span>
          </div>
        </div>
      </div>`
          : `
      <div style="padding-top:10px;font-size:12px;color:var(--ha-muted);display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
        <span>Expert timing (Max Hold Timeout &amp; per-room PIR Gate overrides) and Bayesian probability tables are hidden in clean mode.</span>
        <button type="button" class="btn btn-sm" id="btn-open-adv-settings-card">⚙️ Advanced Settings</button>
      </div>`
      }
    </div>
  </div>

  <!-- Card: Room Connections & Boundaries -->
  <div class="ha-card">
    <div class="card-head">
      <div>
        <h3 class="card-title">Room Connections &amp; Boundaries</h3>
        <div class="card-desc">
          Configure adjacent room hand-offs and door boundary latches to eliminate false clearing.
        </div>
      </div>
    </div>

    <div class="list-divider">
      <!-- Adjacent Rooms Hand-Off -->
      <div class="setting-row" style="align-items:flex-start;flex-direction:column;">
        <div style="width:100%;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
          <div>
            <div class="setting-label">Connected adjacent rooms</div>
            <div class="setting-help">
              If this room is counting down and motion is detected in a connected room, clear this room immediately.
            </div>
          </div>
          <button class="btn btn-sm" id="btn-open-floorplan-tab">Edit on Floorplan</button>
        </div>

        <div class="chip-row" style="margin-top:8px;">
          ${
            connectedRooms.length === 0
              ? `<span style="font-size:13px;color:var(--ha-muted);">No adjacent rooms linked.</span>`
              : connectedRooms
                  .map((rname, i) => {
                    const rc = panel._getRoomColor(rname);
                    return `
                  <span class="ha-chip" style="border-color:${rc.border};background:${rc.bg};">
                    <span class="room-color-dot" style="background:${rc.hex};"></span>
                    <span>${panel._escape(rname)}</span>
                    <button class="del-connected-room" data-idx="${i}" title="Unlink ${panel._escape(rname)}">×</button>
                  </span>`;
                  })
                  .join("")
          }
          <div style="display:inline-flex;gap:6px;align-items:center;">
            <select class="select" id="add-connected-room-input" style="width:190px;padding:5px 10px;">
              <option value="">+ Link adjacent room...</option>
              ${rooms
                .filter(
                  (r) =>
                    r.room_name !== (cfg.room_name || selRoom.room_name) &&
                    !connectedRooms.includes(r.room_name)
                )
                .map(
                  (r) =>
                    `<option value="${panel._escape(r.room_name)}">${panel._escape(
                      r.room_name
                    )}</option>`
                )
                .join("")}
            </select>
          </div>
        </div>
      </div>

      <!-- Closed Door Latch Toggle -->
      <div class="setting-row" style="align-items:flex-start;flex-direction:column;">
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;" data-tip="Track door contact sensors for room perimeter topology &amp; closed-door corridor validation." data-tip-align="left">
          <input
            type="checkbox"
            id="cfg-bounded-toggle"
            ${hasDoorSeal ? "checked" : ""}
            style="width:16px;height:16px;"
          />
          <div>
            <div class="setting-label">Bounded room perimeter (door contact sensors)</div>
            <div class="setting-help">
              Track door contact sensors for room boundary topology and corridor validation. Occupancy always uses bounded cooling timeouts rather than indefinite latching.
            </div>
          </div>
        </label>

        ${
          hasDoorSeal
            ? `
          <div style="margin-top:12px;width:100%;padding:12px;background:var(--ha-subtle);border-radius:8px;border:1px solid var(--ha-divider);">
            <div style="font-size:12.5px;font-weight:500;margin-bottom:8px;">Door contact sensors for this room</div>
            <div class="chip-row" style="margin-bottom:10px;">
              ${
                boundaries.length === 0
                  ? `<span style="font-size:12.5px;color:var(--ha-warning);">Add at least one door contact sensor below so the room can latch when closed.</span>`
                  : boundaries
                      .map(
                        (eid, i) => `
                      <span class="ha-chip">
                        ${panel._escape(eid)}
                        <button class="del-boundary" data-idx="${i}">×</button>
                      </span>`
                      )
                      .join("")
              }
            </div>
            <div style="display:flex;gap:8px;max-width:420px;">
              <input type="text" class="input" id="add-boundary-input" list="pdd-all-entities" placeholder="binary_sensor.room_door" />
              <button class="btn btn-sm" id="btn-add-boundary">Add Door</button>
            </div>
          </div>`
            : ""
        }
      </div>
    </div>
  </div>
  `;
}
