import { renderRoomSetupTab } from "./room-editor-setup.js";

export function renderSimpleRoomEditor(panel, selRoom,
  cfg,
  prev,
  rooms,
  areas,
  entities,
  entityNameMap,
  presets,
  activeMap) {
  if (!selRoom) {
    return `<div class="ha-card">Select a room on the left to view or edit its settings.</div>`;
  }

  const st = panel._roomStatusSummary(selRoom);
  const observations = cfg.bayesian_observations || [];
  const conditions = cfg.sustaining_conditions || [];
  const connectedRooms = cfg.connected_rooms || [];
  const boundaries = cfg.boundary_entities || [];
  const hasDoorSeal = cfg.mode === "bounded";
  const timeoutSec = Number(cfg.inactivity_timeout ?? 180);
  const timeoutMinText = panel._formatDuration(timeoutSec);
  const spEst = selRoom.spatial_estimate || {};
  const occLabel = spEst.occupant_label || "";
  const occType = spEst.occupant_type || "";
  const isPinned = Boolean(spEst.definitive_tracker_pinned);
  const isAdv = panel._isAdvancedMode();
  const rawTab = panel._editorTab || "setup";
  const editorTab = !isAdv && rawTab === "diagnostics" ? "setup" : rawTab;

  return `
    <!-- 1. Compact Status & Action Header Card -->
    <div class="ha-card" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
      <div style="display:flex;align-items:center;gap:14px;">
        <span class="status-dot ${st.dotClass}" style="width:12px;height:12px;"></span>
        <div>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <span class="room-color-dot" style="width:12px;height:12px;background:${panel._getRoomColor(cfg.room_name || selRoom.room_name).hex};" title="Assigned color for ${panel._escape(cfg.room_name || selRoom.room_name)}"></span>
            <h2 style="margin:0;font-size:20px;font-weight:500;">${panel._escape(
              cfg.room_name || selRoom.room_name
            )}</h2>
            <span style="font-size:12.5px;font-weight:500;padding:2px 10px;border-radius:999px;background:var(--ha-subtle);border:1px solid var(--ha-divider);color:${
              st.dotClass === "occupied"
                ? "var(--ha-success-text)"
                : st.dotClass === "clearing"
                ? "var(--ha-warning-text)"
                : "var(--ha-muted)"
            };">
              ${panel._escape(st.label)}
            </span>
            ${
              selRoom.verified_by && selRoom.verified_by !== "none"
                ? `<span style="font-size:11.5px;font-weight:600;padding:2px 8px;border-radius:999px;background:var(--ha-subtle);border:1px solid var(--ha-divider);color:var(--ha-primary-text);" title="Current evidence source verifying occupancy">
                    verified: ${panel._escape(selRoom.verified_by)}
                  </span>`
                : ""
            }
            ${
              (isAdv || selRoom.pir_validation_state === "suppressed") &&
              selRoom.pir_validation_state &&
              selRoom.pir_validation_state !== "idle" &&
              selRoom.pir_validation_state !== "disabled"
                ? `<span style="font-size:11.5px;font-weight:600;padding:2px 8px;border-radius:999px;background:${
                    selRoom.pir_validation_state === "suppressed"
                      ? "rgba(245,158,11,0.16)"
                      : selRoom.pir_validation_state === "candidate"
                      ? "rgba(56,189,248,0.16)"
                      : "rgba(16,185,129,0.16)"
                  };border:1px solid var(--ha-divider);color:${
                    selRoom.pir_validation_state === "suppressed"
                      ? "var(--ha-warning-text)"
                      : selRoom.pir_validation_state === "candidate"
                      ? "var(--ha-primary-text)"
                      : "var(--ha-success-text)"
                  };" title="PIR Validation Gate state">
                    PIR Gate: ${panel._escape(selRoom.pir_validation_state)}
                  </span>`
                : ""
            }
            ${
              occLabel
                ? `<span style="font-size:12px;font-weight:600;padding:2px 10px;border-radius:999px;background:${
                    occType === "pet"
                      ? "var(--ha-accent-amber-bg)"
                      : isPinned
                      ? "var(--ha-accent-cyan-bg)"
                      : "var(--ha-accent-purple-bg)"
                  };border:1px solid ${
                    occType === "pet"
                      ? "var(--ha-accent-amber-border)"
                      : isPinned
                      ? "var(--ha-accent-cyan-border)"
                      : "var(--ha-accent-purple-border)"
                  };color:${
                    occType === "pet"
                      ? "var(--ha-accent-amber-text)"
                      : isPinned
                      ? "var(--ha-accent-cyan-text)"
                      : "var(--ha-accent-purple-text)"
                  };" title="${
                    occType === "pet"
                      ? "Pet-only motion detected — PIR triggers suppressed"
                      : isPinned
                      ? "Definitive tracker pinned in room — protected from adjacent handoff clearing"
                      : "Inferred occupant attribution"
                  }">
                    ${occType === "pet" ? "🐕 " : isPinned ? "📌👤 " : occType === "untracked_human" ? "👧 " : "👤 "}${panel._escape(occLabel)}
                  </span>`
                : ""
            }
            ${
              panel._dirty
                ? `<span style="font-size:12px;color:var(--ha-warning-text);font-weight:500;">• Unsaved changes</span>`
                : ""
            }
          </div>
          <div style="font-size:13px;color:var(--ha-muted);margin-top:3px;">
            ${panel._escape(st.detail)}
          </div>
        </div>
      </div>

      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <button class="btn" id="btn-room-override">
          ${selRoom.override ? "Release Manual Hold" : "Hold Occupied"}
        </button>
        <button class="btn" id="btn-room-refresh">Recalculate</button>
        <button class="btn btn-primary" id="btn-save-room">Save Changes</button>
      </div>

      <div class="sm-lifecycle-strip">
        <div class="sm-pill-track" title="Live Transitions State Machine — click any state to open the full State Chart">
          ${[
            { id: "vacant", label: "vacant" },
            { id: "occupied_confirmed", label: "confirmed" },
            { id: "occupied_holding", label: "holding" },
            { id: "occupied_cooling", label: "cooling" },
            { id: "occupied_verifying", label: "verifying" },
            { id: "override", label: "override" },
          ]
            .map((step, i) => {
              const cur = String(selRoom.occupancy_state || "vacant");
              const isAct = cur === step.id;
              const cls = !isAct
                ? ""
                : step.id === "vacant"
                ? "active-vacant"
                : step.id === "override"
                ? "active-override"
                : step.id === "occupied_cooling" || step.id === "occupied_verifying"
                ? "active-cooling"
                : "active-occupied";
              const sep = i > 0 ? `<span class="sm-arrow">${step.id === "override" ? "|" : "&rarr;"}</span>` : "";
              return `${sep}<button type="button" class="sm-pill ${cls}" data-editor-tab="state_machine">${step.label}</button>`;
            })
            .join("")}
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          ${(() => {
            const hist = Array.isArray(selRoom.transition_history) ? selRoom.transition_history : [];
            const lastAcc = [...hist].reverse().find((h) => h.accepted);
            return lastAcc
              ? `<span style="font-size:11.5px;color:var(--ha-muted);">Last: <code>${panel._escape(
                  lastAcc.trigger
                )}</code> (<code>${panel._escape(lastAcc.source)}</code> &rarr; <code>${panel._escape(
                  lastAcc.dest
                )}</code>)</span>`
              : "";
          })()}
          <button type="button" class="btn btn-sm" data-editor-tab="state_machine">🔀 View State Chart</button>
        </div>
      </div>
    </div>

    <!-- 2. Editor Navigation Tabs -->
    <div class="editor-tabs-bar" style="align-items:center;">
      <button class="editor-tab-btn ${editorTab === "setup" ? "active" : ""}" data-editor-tab="setup">
        ⚙️ Room Setup
      </button>
      <button class="editor-tab-btn ${editorTab === "rules" ? "active" : ""}" data-editor-tab="rules">
        ⚡ Sensors &amp; Rules
      </button>
      <button class="editor-tab-btn ${editorTab === "state_machine" ? "active" : ""}" data-editor-tab="state_machine">
        🔀 State Machine
      </button>
      ${
        isAdv
          ? `<button class="editor-tab-btn ${editorTab === "diagnostics" ? "active" : ""}" data-editor-tab="diagnostics">
               🔬 Advanced &amp; Diagnostics
             </button>`
          : `<div style="flex:1;"></div>
             <button type="button" class="btn-text" id="btn-open-adv-settings-link" style="font-size:12px;">
               🔬 Enable Advanced Controls
             </button>`
      }
    </div>

    <!-- 3. Tab Contents -->
    ${
      editorTab === "setup"
          ? renderRoomSetupTab(panel, { selRoom, cfg, rooms, areas, entities, entityNameMap, connectedRooms, boundaries, hasDoorSeal, timeoutSec, timeoutMinText })
        : editorTab === "rules"
        ? `
      <!-- Card 1: Presence & Motion Sensors -->
      <div class="ha-card">
        <div class="card-head">
          <div>
            <h3 class="card-title">Presence &amp; Motion Sensors</h3>
            <div class="card-desc">
              Choose which sensors detect people in this room and assign whether they trigger alone or require corroboration.
            </div>
          </div>
        </div>

        <div class="list-divider">
          ${
            observations.length === 0
              ? `<div style="padding:16px 0;font-size:13px;color:var(--ha-muted);">No sensors added to this room yet.</div>`
              : observations
                  .map((obs, idx) => {
                    const key = `${obs.entity_id}|${obs.label}`;
                    const isAct = Boolean(activeMap[key] || activeMap[obs.entity_id]);
                    const friendlyName =
                      obs.label || entityNameMap[obs.entity_id] || obs.entity_id || "Sensor";
                    const roleGroup = panel._friendlyRoleGroup(obs);
                    const weightInfo = panel._sensorWeightMap(selRoom, prev)[obs.entity_id] || {};
                    const isHuman = panel._isHumanExclusiveCandidate(obs.entity_id, {
                      [obs.entity_id]: weightInfo,
                    });
                    const cooldownSec = Number(obs.cooldown_sec ?? weightInfo.cooldown_sec ?? 0);
                    const pirReq = Boolean(weightInfo.requires_pir_validation);
                    return `
                    <div class="sensor-row" data-obs-idx="${idx}">
                      <div class="sensor-info">
                        <span class="status-dot ${isAct ? "occupied" : "clear"}" title="${
                      isAct ? "Currently active" : "Clear"
                    }"></span>
                        <div style="min-width:0;">
                          <div class="sensor-title" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                            <span>${panel._escape(friendlyName)}</span>
                            <span style="padding:1px 7px;border-radius:999px;font-size:10.5px;font-weight:600;background:${
                              isHuman ? "rgba(16,185,129,0.14)" : "rgba(148,163,184,0.16)"
                            };color:${
                      isHuman ? "var(--ha-success-text)" : "var(--ha-muted)"
                    };">${isHuman ? "Person-coupled" : "Supporting only"}</span>
                            ${
                              isAdv && cooldownSec > 0
                                ? `<span style="padding:1px 6px;border-radius:999px;font-size:10.5px;background:var(--ha-subtle);border:1px solid var(--ha-divider);color:var(--ha-muted);">${cooldownSec}s cooldown</span>`
                                : ""
                            }
                            ${
                              isAdv && pirReq
                                ? `<span style="padding:1px 6px;border-radius:999px;font-size:10.5px;background:var(--ha-accent-amber-bg);color:var(--ha-accent-amber-text);">PIR Gate</span>`
                                : ""
                            }
                          </div>
                          <div class="sensor-sub">${panel._escape(obs.entity_id)}${
                      obs.state && obs.state !== "on" ? ` = ${panel._escape(obs.state)}` : ""
                    }</div>
                        </div>
                      </div>

                      <div>
                        <select class="select obs-role-simple" data-idx="${idx}">
                          ${
                            isHuman
                              ? `<option value="primary" ${
                                  roleGroup === "primary" ? "selected" : ""
                                }>Main human sensor (high confidence / trigger)</option>
                                 <option value="shared" ${
                                   roleGroup === "shared" ? "selected" : ""
                                 }>Corroborated sensor (moderate weight)</option>`
                              : ""
                          }
                          <option value="keepalive" ${
                            roleGroup === "keepalive" || !isHuman ? "selected" : ""
                          }>Supporting hold only (scores/holds once occupied)</option>
                        </select>
                      </div>

                      <div style="text-align:right;">
                        <button class="btn-danger-text obs-del" data-idx="${idx}">Remove</button>
                      </div>
                    </div>`;
                  })
                  .join("")
          }
        </div>

        <div class="add-obs-grid">
          <input
            type="text"
            class="input"
            id="simple-add-obs-entity"
            list="pdd-all-entities"
            placeholder="Add sensor (e.g. binary_sensor.living_room_motion)..."
          />
          <select class="select" id="simple-add-obs-role">
            <option value="primary">Main human sensor (high confidence / trigger)</option>
            <option value="shared" selected>Corroborated sensor (moderate weight)</option>
            <option value="keepalive">Supporting hold only (scores/holds once occupied)</option>
          </select>
          <button class="btn" id="btn-simple-add-obs">+ Add Sensor</button>
        </div>
      </div>

      <!-- Card 2: Keep Occupied While Active (TV, Media, Appliances) -->
      <div class="ha-card">
        <div class="card-head">
          <div>
            <h3 class="card-title">Keep Occupied While Active</h3>
            <div class="card-desc">
              Prevent the room from clearing when someone is sitting still watching TV, listening to music, or using a device.
            </div>
          </div>
        </div>

        <div class="list-divider">
          ${
            conditions.length === 0
              ? `<div style="padding:14px 0;font-size:13px;color:var(--ha-muted);">No keep-occupied media or appliance rules configured.</div>`
              : conditions
                  .map(
                    (c, idx) => `
                  <div class="cond-row">
                    <input
                      type="text"
                      class="input cond-field"
                      data-idx="${idx}"
                      data-key="entity_id"
                      list="pdd-all-entities"
                      placeholder="media_player.living_room_tv"
                      value="${panel._escape(c.entity_id || "")}"
                    />
                    <select class="select cond-field" data-idx="${idx}" data-key="operator">
                      <option value="equals" ${(c.operator || "equals") === "equals" ? "selected" : ""}>is</option>
                      <option value="not_equals" ${c.operator === "not_equals" ? "selected" : ""}>is not</option>
                      <option value="greater_than" ${c.operator === "greater_than" ? "selected" : ""}>above</option>
                      <option value="less_than" ${c.operator === "less_than" ? "selected" : ""}>below</option>
                    </select>
                    <input
                      type="text"
                      class="input cond-field"
                      data-idx="${idx}"
                      data-key="state"
                      placeholder="playing"
                      value="${panel._escape(c.state ?? "playing")}"
                    />
                    <button class="btn-danger-text cond-del" data-idx="${idx}">Remove</button>
                  </div>`
                  )
                  .join("")
          }
        </div>

        <div style="margin-top:12px;">
          <button class="btn btn-sm" id="btn-add-condition">+ Add Keep-Occupied Rule</button>
        </div>
      </div>

      <!-- Card 3: Presence Notifications -->
      <div class="ha-card">
        <div class="card-head">
          <div>
            <h3 class="card-title">Presence Notifications</h3>
            <div class="card-desc">
              Send Home Assistant notifications when presence transitions in this room.
            </div>
          </div>
        </div>

        <div class="list-divider">
          <div class="setting-row">
            <div>
              <div class="setting-label">Enable alerts for this room</div>
              <div class="setting-help">Send real-time notifications detailing what sensor or rule caused this room to occupy or clear.</div>
            </div>
            <div>
              <input type="checkbox" id="cfg-notify-enabled" data-tip="Send alerts when this room transitions between occupied and vacant." data-tip-align="right" title="Send alerts for this room" ${cfg.notify_enabled ? "checked" : ""} style="width:16px;height:16px;" />
            </div>
          </div>

          <div class="setting-row" style="opacity:${cfg.notify_enabled ? "1" : "0.5"};pointer-events:${cfg.notify_enabled ? "auto" : "none"};">
            <div>
              <div class="setting-label">Transition Triggers</div>
              <div class="setting-help">Choose which presence transitions trigger a notification.</div>
            </div>
            <div style="display:flex;gap:18px;">
              <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;">
                <input type="checkbox" id="cfg-notify-on-occupied" ${cfg.notify_on_occupied !== false ? "checked" : ""} />
                Alert on Occupied
              </label>
              <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;">
                <input type="checkbox" id="cfg-notify-on-cleared" ${cfg.notify_on_cleared !== false ? "checked" : ""} />
                Alert on Cleared
              </label>
            </div>
          </div>
        </div>
      </div>
    `
        : editorTab === "state_machine"
        ? panel._renderStateMachinePane(selRoom)
        : panel._renderAdvancedDrawer(selRoom, cfg, prev, areas, presets, activeMap)
    }
  `;
}

