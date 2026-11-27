// Global Settings multi-pane modal (Interface, Detection, AI & Vision, Notifications).

export function renderSettingsModal(panel) {
  if (!panel._showGlobalModal) return "";
  return `

        <div class="modal-backdrop" id="global-modal-backdrop">
<div class="modal-card settings-modal">
  <div class="settings-modal-head">
    <div>
      <h3 class="card-title" style="margin:0;">Global Settings</h3>
      <div style="font-size:12px;color:var(--ha-muted);margin-top:2px;">Interface complexity, spatial inference, AI vision &amp; Slack alerts</div>
    </div>
    <button class="btn-text" id="btn-close-global">✕</button>
  </div>

  <div class="settings-shell">
    <div class="settings-nav" role="tablist" aria-label="Settings Categories">
      ${[
        { id: "interface", icon: "🎛️", label: "Interface & Advanced" },
        { id: "detection", icon: "📡", label: "Detection & Inference" },
        { id: "ai", icon: "🤖", label: "AI & Vision" },
        { id: "notifications", icon: "🔔", label: "Notifications" },
      ]
        .map(
          (tab) => `
        <button
          type="button"
          class="settings-nav-btn ${panel._settingsTab === tab.id ? "active" : ""}"
          data-settings-tab="${tab.id}"
        >
          <span>${tab.icon}</span>
          <span>${tab.label}</span>
        </button>`
        )
        .join("")}
    </div>

    <div class="settings-panes">
      <!-- Pane 1: Interface & Advanced -->
      <div class="settings-pane ${panel._settingsTab === "interface" ? "active" : ""}" data-settings-pane="interface">
        <div class="settings-item">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:6px;">
            <span class="setting-label" style="font-weight:600;display:inline-flex;align-items:center;gap:6px;">
              🔬 Show Advanced Room &amp; Bayesian Controls
              <span class="pdd-hint-badge" data-tip="Exposes Bayesian probability tables, Max Hold Timeout, per-room PIR Gate overrides, Truth Table, YAML editor, and Blueprints.">i</span>
            </span>
            <input type="checkbox" id="gl-ui-advanced-mode" data-tip="Toggle expert Bayesian &amp; YAML editing tools across Rooms." data-tip-align="right" title="Toggle expert Bayesian & YAML editing tools" ${
              panel._isAdvancedMode() ? "checked" : ""
            } />
          </div>
          <div style="font-size:12px;color:var(--ha-muted);line-height:1.45;">
            When OFF (recommended for everyday use), the Rooms tab stays focused on HA Area, inactivity clear time, sensors, rules, doors, and state lifecycle. Turn ON to unlock Bounded Max Hold Timeout, per-room PIR Validation Gate overrides, Bayesian priors &amp; probability tables, Combination Truth Table, Automations &amp; Blueprints, YAML editor, and Saved Revisions.
          </div>
        </div>
      </div>

      <!-- Pane 2: Detection & Inference -->
      <div class="settings-pane ${panel._settingsTab === "detection" ? "active" : ""}" data-settings-pane="detection">
        <div class="settings-item">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:4px;">
            <span class="setting-label" style="font-weight:600;display:inline-flex;align-items:center;gap:6px;">
              🎯 Negative-Space Bayesian Inference ("Where It Isn't")
              <span class="pdd-hint-badge" data-tip="Uses clear cameras and PIR sensors to rule out empty zones and pinpoint occupants inside blind pockets or adjacent sub-zones.">i</span>
            </span>
            <input type="checkbox" id="gl-neg-space-enabled" data-tip="Enable or pause Negative-Space spatial exclusion globally." data-tip-align="right" title="Enable or pause Negative-Space spatial exclusion" ${
              panel._globalDraft?.negative_space_enabled !== false ? "checked" : ""
            } />
          </div>
          <div style="font-size:12px;color:var(--ha-muted);line-height:1.4;">
            Subtract active-clear camera cones and clear PIR cones to localize occupants into uncovered room regions and blind pockets. Toggle off to revert to standard Bayesian evaluation.
          </div>
        </div>

        <div class="settings-item">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:4px;">
            <span class="setting-label" style="font-weight:600;display:inline-flex;align-items:center;gap:6px;">
              🛡️ PIR Validation Gate (Corroborated Motion Entry)
              <span class="pdd-hint-badge" data-tip="Prevents false triggers from HVAC drafts, sunlight, or pets by requiring a second corroborating signal within the candidate window.">i</span>
            </span>
            <input type="checkbox" id="gl-pir-validation-enabled" data-tip="Require corroboration before solo PIR trips mark a room occupied." data-tip-align="right" title="Require corroboration before solo PIR trips mark a room occupied" ${
              panel._globalDraft?.pir_validation_enabled !== false ? "checked" : ""
            } />
          </div>
          <div style="font-size:12px;color:var(--ha-muted);line-height:1.4;margin-bottom:8px;">
            Holds raw PIR trips in a short candidate window unless corroborated by an adjacent occupied room, door contact, camera/BLE confirmation, or sustained motion (rejecting standalone HVAC/sunlight/pet false triggers).
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
            <span style="font-size:12px;color:var(--ha-muted);">Default PIR Candidate Window (seconds)</span>
            <input type="number" min="3" max="120" step="1" class="input" id="gl-pir-candidate-window" style="width:90px;" value="${Number(
              panel._globalDraft?.pir_candidate_window ?? 15
            )}" />
          </div>
        </div>

        <div class="settings-item">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:4px;">
            <span class="setting-label" style="font-weight:600;display:inline-flex;align-items:center;gap:6px;">
              👥 Guest Mode (Multi-Occupant / Low-Compute Mode)
              <span class="pdd-hint-badge" data-tip="Recommended when hosting guests: pauses single-person trajectory clearing, blind-pocket holds, LLM checks, and transition alerts.">i</span>
            </span>
            <input type="checkbox" id="gl-guest-mode-enabled" data-tip="Pause multi-room hand-off clearing &amp; LLM alerts when guests are visiting." data-tip-align="right" title="Pause single-occupant inference heuristics when guests are visiting" ${
              panel._globalDraft?.guest_mode_enabled ? "checked" : ""
            } />
          </div>
          <div style="font-size:12px;color:var(--ha-muted);line-height:1.4;">
            Pauses Negative-Space raycasting, blind-pocket holds, connected-room handoff clearing, LLM camera snapshot checks, and per-room Slack transition alerts when guests are visiting.
          </div>
        </div>

        <div class="settings-item">
          <div class="setting-label" style="font-weight:600;margin-bottom:6px;">Household BLE Area Trackers</div>
          <input type="text" class="input" id="gl-ble" value="${panel._escape(
            (panel._globalDraft?.ble_trackers || []).join(", ")
          )}" style="margin-bottom:10px;" />
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:4px;">
            <span class="setting-label" style="font-weight:600;display:inline-flex;align-items:center;gap:6px;">
              📱 Use BLE Position as Presence Decider
              <span class="pdd-hint-badge" data-tip="OFF = BLE area only logs/pins diagnostics (avoids floor-to-floor bleed); ON = BLE area actively drives room occupancy.">i</span>
            </span>
            <input type="checkbox" id="gl-ble-decider-enabled" data-tip="Allow native BLE / Private BLE trackers to directly trigger room occupancy." data-tip-align="right" title="Allow native BLE / Private BLE trackers to trigger room occupancy" ${
              panel._globalDraft?.ble_decider_enabled ? "checked" : ""
            } />
          </div>
          <div style="font-size:12px;color:var(--ha-muted);line-height:1.4;">
            When enabled, native BLE / proxy phone positions act as active occupancy triggers and occupant pinning. When disabled, BLE positions are logged and graphed for calibration without vertical floor bounce.
          </div>
        </div>
      </div>

      <!-- Pane 3: AI & Vision -->
      <div class="settings-pane ${panel._settingsTab === "ai" ? "active" : ""}" data-settings-pane="ai">
        <div class="settings-item" style="display:flex;flex-direction:column;gap:10px;">
          <div>
            <div class="setting-label" style="margin-bottom:4px;">Vision AI Provider</div>
            <select class="select" id="gl-provider">
              <option value="vision_api" ${
                (panel._globalDraft?.llm_provider_type || "vision_api") === "vision_api"
                  ? "selected"
                  : ""
              }>OpenAI-Compatible Vision API (LiteLLM)</option>
              <option value="conversation" ${
                panel._globalDraft?.llm_provider_type === "conversation" ? "selected" : ""
              }>Home Assistant Conversation Agent</option>
              <option value="ai_task" ${
                panel._globalDraft?.llm_provider_type === "ai_task" ? "selected" : ""
              }>Home Assistant AI Task</option>
            </select>
          </div>
          <div>
            <div class="setting-label" style="margin-bottom:4px;">API Endpoint URL</div>
            <input type="text" class="input" id="gl-api-url" value="${panel._escape(
              panel._globalDraft?.llm_api_url || ""
            )}" placeholder="http://10.0.0.10:8448/v1/chat/completions" />
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div>
              <div class="setting-label" style="margin-bottom:4px;">Model Name</div>
              <input type="text" class="input" id="gl-model" value="${panel._escape(
                panel._globalDraft?.llm_model || "gemini-2.5-flash"
              )}" />
            </div>
            <div>
              <div class="setting-label" style="margin-bottom:4px;">HA Conversation Agent</div>
              <input type="text" class="input" id="gl-agent-id" value="${panel._escape(
                panel._globalDraft?.llm_agent_id || ""
              )}" placeholder="conversation.google_ai_conversation" />
            </div>
          </div>
        </div>
      </div>

      <!-- Pane 4: Notifications (Home Assistant notify.*) -->
      <div class="settings-pane ${panel._settingsTab === "notifications" ? "active" : ""}" data-settings-pane="notifications">
        <div class="settings-item" style="display:flex;flex-direction:column;gap:10px;">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <span class="setting-label" style="font-weight:600;">Presence Notifications</span>
            <input type="checkbox" id="gl-notify-enabled" data-tip="Master toggle for Home Assistant presence transition alerts." data-tip-align="right" title="Master toggle for presence notifications" ${
              panel._globalDraft?.notifications_enabled ? "checked" : ""
            } />
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div>
              <div class="setting-label" style="margin-bottom:4px;">HA Notify Service</div>
              <input type="text" class="input" id="gl-notify-service" value="${panel._escape(
                panel._globalDraft?.notify_service || ""
              )}" placeholder="notify.mobile_app_phone" />
            </div>
            <div>
              <div class="setting-label" style="margin-bottom:4px;">Target (Optional)</div>
              <input type="text" class="input" id="gl-notify-target" value="${panel._escape(
                panel._globalDraft?.notify_target || ""
              )}" placeholder="optional target" />
            </div>
          </div>
          <div>
            <div class="setting-label" style="margin-bottom:4px;">Alert Verbosity</div>
            <select class="select" id="gl-notify-verbosity">
              <option value="minimal" ${panel._globalDraft?.notify_verbosity === "minimal" ? "selected" : ""}>Minimal (1-line summary)</option>
              <option value="compact" ${(!panel._globalDraft?.notify_verbosity || panel._globalDraft?.notify_verbosity === "compact") ? "selected" : ""}>Compact (2-line summary: State + Driver)</option>
              <option value="full" ${panel._globalDraft?.notify_verbosity === "full" ? "selected" : ""}>Full Diagnostic</option>
            </select>
          </div>
          <div style="display:flex;justify-content:flex-end;">
            <button class="btn" id="btn-test-notify-alert" style="font-size:12px;">
              🔔 Send Test Notification
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="settings-footer">
    <span style="font-size:12px;color:var(--ha-muted);">Changes apply across all rooms once saved.</span>
    <div style="display:flex;gap:8px;margin-left:auto;">
      <button class="btn" id="btn-cancel-global">Cancel</button>
      <button class="btn btn-primary" id="btn-save-global">Save Settings</button>
    </div>
  </div>
</div>
        </div>
  `;
}
