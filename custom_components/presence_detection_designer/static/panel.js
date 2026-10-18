/**
 * Presence Detection Designer — Clean Home Assistant Material Design Panel
 * Custom Element: <presence-detection-designer-panel>
 */

class PresenceDetectionDesignerPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._overview = null;
    this._selectedRoomId = null;
    this._draftConfig = null;
    this._previewData = null;
    this._dirty = false;
    this._roomSearch = "";
    this._roomFilter = "all"; // "all" | "occupied" | "vacant"
    this._studioView = "design"; // "design" | "floorplan" | "statistics" | "replay"
    this._showAdvanced = false;
    this._advTab = "tuning"; // "tuning" | "truth" | "yaml" | "revisions"
    this._rightTab = "yaml"; // "yaml" | "ha_yaml" | "nl" | "guide"
    this._nlPrompt = "";
    this._nlOutput = "";
    this._yamlDraft = "";
    this._revisionNote = "";
    this._showGlobalModal = false;
    this._globalDraft = null;
    this._floorplan = null;
    this._compiledTopology = null;
    this._selectedFloorId = "main";
    this._selectedCamEntity = null;
    this._showFloorplanInspector = false;
    this._historyHours = 6;
    this._statsData = null;
    this._replayData = null;
    this._replayCandidate = null;
    this._toast = null;
    this._loading = false;
    this._initialized = false;
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._initialized) {
      this._initialized = true;
      this.loadOverview();
    }
  }

  connectedCallback() {
    if (!this._initialized) {
      this._initialized = true;
      this.render();
      this.loadOverview();
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
        ? "var(--error-color, #dc2626)"
        : this._toast.type === "success"
        ? "var(--success-color, #16a34a)"
        : "var(--primary-color, #0284c7)";
    el.innerHTML = `<div style="background:${bg};color:#fff;padding:10px 18px;border-radius:8px;box-shadow:0 4px 14px rgba(0,0,0,0.18);font-weight:500;font-size:13px;">${this._escape(
      this._toast.message
    )}</div>`;
  }

  async _apiCall(method, path, body = null) {
    if (window.__PDD_MOCK_API__) {
      return window.__PDD_MOCK_API__(method, path, body);
    }
    if (this._hass && typeof this._hass.callApi === "function") {
      const cleanPath = path.replace(/^\/api\//, "");
      return await this._hass.callApi(method, cleanPath, body);
    }
    const headers = { "Content-Type": "application/json" };
    if (this._hass && this._hass.auth && this._hass.auth.data && this._hass.auth.data.access_token) {
      headers["Authorization"] = `Bearer ${this._hass.auth.data.access_token}`;
    }
    const opts = { method, headers };
    if (body !== null) opts.body = JSON.stringify(body);
    const resp = await fetch(path, opts);
    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(txt || `HTTP ${resp.status}`);
    }
    return await resp.json();
  }

  async loadOverview(preserveSelection = true) {
    this._loading = true;
    try {
      const data = await this._apiCall("GET", "/api/presence_detection_designer/overview");
      this._overview = data;
      this._globalDraft = JSON.parse(JSON.stringify(data.global_settings || {}));
      if (data.floorplan) {
        this._floorplan = JSON.parse(JSON.stringify(data.floorplan));
      }
      if (data.compiled_topology) {
        this._compiledTopology = data.compiled_topology;
      }
      const rooms = data.rooms || [];
      if (rooms.length > 0) {
        const exists =
          preserveSelection &&
          this._selectedRoomId &&
          rooms.some((r) => r.entry_id === this._selectedRoomId);
        const targetRoom = exists
          ? rooms.find((r) => r.entry_id === this._selectedRoomId)
          : rooms[0];
        this._selectRoomObject(targetRoom, false);
      }
    } catch (err) {
      this.showToast(`Failed to load rooms: ${err.message}`, "error");
    } finally {
      this._loading = false;
      this.render();
    }
  }

  _selectRoomObject(room, renderAfter = true) {
    if (!room) return;
    this._selectedRoomId = room.entry_id;
    this._draftConfig = JSON.parse(JSON.stringify(room.config || {}));
    if (!Array.isArray(this._draftConfig.bayesian_observations)) {
      this._draftConfig.bayesian_observations = [];
    }
    if (!Array.isArray(this._draftConfig.trigger_entities)) {
      this._draftConfig.trigger_entities = [];
    }
    if (!Array.isArray(this._draftConfig.boundary_entities)) {
      this._draftConfig.boundary_entities = [];
    }
    if (!Array.isArray(this._draftConfig.sustaining_conditions)) {
      this._draftConfig.sustaining_conditions = [];
    }
    if (!Array.isArray(this._draftConfig.connected_rooms)) {
      this._draftConfig.connected_rooms = Array.isArray(room.connected_rooms)
        ? [...room.connected_rooms]
        : [];
    }
    this._replayCandidate = JSON.parse(JSON.stringify(this._draftConfig));
    this._previewData = {
      probability_pct: room.bayesian_probability_pct,
      is_occupied: room.bayesian_occupied,
      prior_pct: room.bayesian_prior_pct,
      threshold_pct: room.bayesian_threshold_pct,
      active_observations: room.active_observations || [],
      inactive_observations: room.inactive_observations || [],
      natural_language_summary: room.natural_language_summary || "",
      combinatorics: room.combinatorics || {},
      rule_guide: room.rule_guide || "",
      ha_bayesian_yaml: room.ha_bayesian_yaml || "",
      designer_yaml: room.designer_yaml || "",
    };
    this._yamlDraft = room.designer_yaml || "";
    this._dirty = false;
    this._revisionNote = "";
    if (this._studioView === "statistics") {
      this.loadStatistics();
    } else if (this._studioView === "replay") {
      this.runReplay();
    } else if (this._studioView === "floorplan") {
      if (!this._floorplan) {
        this.loadFloorplan();
      } else if (renderAfter) {
        this.render();
      }
    } else if (renderAfter) {
      this.render();
    }
  }

  async loadFloorplan() {
    try {
      const res = await this._apiCall("GET", "/api/presence_detection_designer/floorplan");
      if (res && res.floorplan) {
        this._floorplan = res.floorplan;
        this._compiledTopology = res.compiled_topology || null;
      }
      this.render();
    } catch (err) {
      this.showToast(`Failed to load floorplan: ${err.message}`, "error");
    }
  }

  async saveOrCompileFloorplan(action = "save") {
    try {
      const res = await this._apiCall("POST", "/api/presence_detection_designer/floorplan", {
        action,
        floorplan: this._floorplan,
      });
      if (res && res.floorplan) {
        this._floorplan = res.floorplan;
        this._compiledTopology = res.compiled_topology || null;
      }
      if (res && Array.isArray(res.updated_rooms) && res.updated_rooms.length > 0 && this._overview) {
        for (const ur of res.updated_rooms) {
          const idx = (this._overview.rooms || []).findIndex((r) => r.entry_id === ur.entry_id);
          if (idx >= 0) {
            this._overview.rooms[idx] = ur;
          }
        }
        const cur = this.selectedRoom;
        if (cur) this._selectRoomObject(cur, false);
      }
      this.render();
      if (action === "compile_and_apply") {
        this.showToast(
          `Updated room connections and camera coverage rules across ${(res?.updated_rooms || []).length} rooms`,
          "success"
        );
      } else if (action === "reset") {
        this.showToast("Reset floorplan to default layout", "info");
      } else {
        this.showToast("Saved floorplan layout", "success");
      }
    } catch (err) {
      this.showToast(`Floorplan update failed: ${err.message}`, "error");
    }
  }

  async loadStatistics() {
    if (!this._selectedRoomId) return;
    try {
      const res = await this._apiCall(
        "GET",
        `/api/presence_detection_designer/room/${this._selectedRoomId}/statistics?hours=${this._historyHours}`
      );
      this._statsData = res;
      this.render();
    } catch (err) {
      this.showToast(`Failed to load history: ${err.message}`, "error");
    }
  }

  async runReplay() {
    if (!this._selectedRoomId || !this._replayCandidate) return;
    try {
      const res = await this._apiCall(
        "POST",
        `/api/presence_detection_designer/room/${this._selectedRoomId}/replay`,
        {
          hours: this._historyHours,
          candidate_config: this._replayCandidate,
        }
      );
      this._replayData = res;
      this.render();
    } catch (err) {
      this.showToast(`Simulation failed: ${err.message}`, "error");
    }
  }

  async applyReplayCandidate() {
    if (!this._selectedRoomId || !this._replayCandidate) return;
    this._draftConfig = JSON.parse(JSON.stringify(this._replayCandidate));
    this._revisionNote = `Applied from ${this._historyHours}h Replay Simulator`;
    await this.saveCurrentRoom();
    await this.runReplay();
  }

  get selectedRoom() {
    if (!this._overview || !this._overview.rooms) return null;
    return this._overview.rooms.find((r) => r.entry_id === this._selectedRoomId) || null;
  }

  async refreshPreview() {
    if (!this._draftConfig) return;
    try {
      const res = await this._apiCall(
        "POST",
        "/api/presence_detection_designer/preview_bayesian",
        { config: this._draftConfig }
      );
      this._previewData = res;
      this._yamlDraft = res.designer_yaml || this._yamlDraft;
      this.render();
    } catch (err) {
      this.showToast(`Preview failed: ${err.message}`, "error");
    }
  }

  async saveCurrentRoom() {
    if (!this._selectedRoomId || !this._draftConfig) return;
    try {
      // Automatically keep trigger_entities synced with main/reliable sensors
      const obs = this._draftConfig.bayesian_observations || [];
      const autoTriggers = [...(this._draftConfig.trigger_entities || [])];
      for (const o of obs) {
        const preset = o.preset || o.weight || "moderate";
        if (
          (preset === "decisive" || preset === "strong") &&
          o.entity_id &&
          o.entity_id.startsWith("binary_sensor.") &&
          !autoTriggers.includes(o.entity_id)
        ) {
          autoTriggers.push(o.entity_id);
        }
      }
      this._draftConfig.trigger_entities = autoTriggers;

      const res = await this._apiCall(
        "POST",
        `/api/presence_detection_designer/room/${this._selectedRoomId}`,
        {
          config: this._draftConfig,
          note: this._revisionNote.trim() || "Saved room settings",
        }
      );
      if (res && res.room && this._overview && Array.isArray(this._overview.rooms)) {
        const idx = this._overview.rooms.findIndex((r) => r.entry_id === this._selectedRoomId);
        if (idx >= 0) this._overview.rooms[idx] = res.room;
        this._selectRoomObject(res.room, true);
      }
      this.showToast(`Saved ${this._draftConfig.room_name}`, "success");
    } catch (err) {
      this.showToast(`Save failed: ${err.message}`, "error");
    }
  }

  async applyYamlDraft() {
    if (!this._selectedRoomId || !this._yamlDraft.trim()) return;
    try {
      const saved = await this._apiCall(
        "POST",
        `/api/presence_detection_designer/room/${this._selectedRoomId}`,
        {
          yaml_config: this._yamlDraft,
          note: "Updated via YAML editor",
        }
      );
      if (saved && saved.room) {
        const idx = this._overview.rooms.findIndex((r) => r.entry_id === this._selectedRoomId);
        if (idx >= 0) this._overview.rooms[idx] = saved.room;
        this._selectRoomObject(saved.room, true);
      }
      this.showToast("Applied YAML configuration", "success");
    } catch (err) {
      this.showToast(`YAML error: ${err.message}`, "error");
    }
  }

  async rollbackRevision(revIndex) {
    if (!this._selectedRoomId) return;
    try {
      const res = await this._apiCall(
        "POST",
        `/api/presence_detection_designer/room/${this._selectedRoomId}/rollback`,
        { revision_index: revIndex }
      );
      if (res && res.room) {
        const idx = this._overview.rooms.findIndex((r) => r.entry_id === this._selectedRoomId);
        if (idx >= 0) this._overview.rooms[idx] = res.room;
        this._selectRoomObject(res.room, true);
        this.showToast("Restored previous room configuration", "success");
      }
    } catch (err) {
      this.showToast(`Restore failed: ${err.message}`, "error");
    }
  }

  async runRoomAction(action, extra = {}) {
    if (!this._selectedRoomId) return;
    try {
      const res = await this._apiCall(
        "POST",
        `/api/presence_detection_designer/room/${this._selectedRoomId}/action`,
        { action, ...extra }
      );
      if (res && res.room) {
        const idx = this._overview.rooms.findIndex((r) => r.entry_id === this._selectedRoomId);
        if (idx >= 0) this._overview.rooms[idx] = res.room;
        if (!this._dirty) {
          this._selectRoomObject(res.room, true);
        } else {
          this.render();
        }
      }
      this.showToast("Updated room state", "success");
    } catch (err) {
      this.showToast(`Action failed: ${err.message}`, "error");
    }
  }

  async runTranslation(direction) {
    const room = this.selectedRoom;
    if (!room) return;
    try {
      const payload = {
        entry_id: room.entry_id,
        room_name: this._draftConfig.room_name || room.room_name,
        direction,
        description: direction === "nl_to_yaml" ? this._nlPrompt : undefined,
        yaml_config: direction === "yaml_to_nl" ? this._draftConfig : undefined,
        use_llm: true,
      };
      const res = await this._apiCall("POST", "/api/presence_detection_designer/translate", payload);
      if (direction === "nl_to_yaml" && res && res.normalized_config) {
        this._draftConfig = { ...this._draftConfig, ...res.normalized_config };
        this._dirty = true;
        this._nlOutput = res.natural_language || "Generated updated rules.";
        await this.refreshPreview();
        this.showToast("Generated room rules from description", "success");
      } else if (res) {
        this._nlOutput = res.natural_language || res.rule_guide || "";
        this.render();
      }
    } catch (err) {
      this.showToast(`Translation failed: ${err.message}`, "error");
    }
  }

  async saveGlobalSettings() {
    if (!this._globalDraft) return;
    try {
      const res = await this._apiCall(
        "POST",
        "/api/presence_detection_designer/global_settings",
        this._globalDraft
      );
      if (res && res.global_settings && this._overview) {
        this._overview.global_settings = res.global_settings;
      }
      this._showGlobalModal = false;
      this.render();
      this.showToast("Saved global settings", "success");
    } catch (err) {
      this.showToast(`Failed to save global settings: ${err.message}`, "error");
    }
  }

  _escape(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  _formatDuration(sec) {
    const s = Math.max(0, Math.round(Number(sec || 0)));
    if (s === 0) return "0s";
    const m = Math.floor(s / 60);
    const rem = s % 60;
    if (m === 0) return `${rem}s`;
    if (rem === 0) return `${m}m`;
    return `${m}m ${rem}s`;
  }

  _friendlyRoleGroup(obs) {
    const p = String(obs.preset || obs.weight || "moderate").toLowerCase();
    if (obs.corroboration_only || p === "weak_hint") return "keepalive";
    if (p === "decisive" || p === "strong") return "primary";
    return "shared";
  }

  _applyFriendlyRoleGroup(obs, group, presets) {
    if (group === "primary") {
      obs.preset = "decisive";
      obs.corroboration_only = false;
      const d = presets.decisive || { prob_given_true: 0.94, prob_given_false: 0.03 };
      obs.prob_given_true = d.prob_given_true;
      obs.prob_given_false = d.prob_given_false;
    } else if (group === "keepalive") {
      obs.preset = "supporting";
      obs.corroboration_only = true;
      obs.prob_given_true = 0.25;
      obs.prob_given_false = 0.22;
    } else {
      obs.preset = "moderate";
      obs.corroboration_only = false;
      const d = presets.moderate || { prob_given_true: 0.72, prob_given_false: 0.12 };
      obs.prob_given_true = d.prob_given_true;
      obs.prob_given_false = d.prob_given_false;
    }
  }

  _roomStatusSummary(r) {
    if (!r) return { dotClass: "clear", label: "Clear", detail: "No activity detected" };
    const state = String(r.box_state || "idle_clear");
    const countdown = Number(r.vacating_countdown || 0);
    if (r.is_present) {
      if (state === "timer_active" && countdown > 0) {
        return {
          dotClass: "clearing",
          label: `Clearing (${this._formatDuration(countdown)})`,
          detail: `Clearing in ${this._formatDuration(countdown)} unless motion resumes`,
        };
      }
      if (state === "occupied_sealed") {
        return {
          dotClass: "occupied",
          label: "Occupied (Doors closed)",
          detail: "Occupied and held while room doors remain closed",
        };
      }
      return {
        dotClass: "occupied",
        label: "Occupied",
        detail: r.last_triggered_by
          ? `Triggered by ${r.last_triggered_by}`
          : "Active sensor detection in room",
      };
    }
    return {
      dotClass: "clear",
      label: "Clear",
      detail: r.last_cleared_by ? `Last cleared by ${r.last_cleared_by}` : "Room is currently unoccupied",
    };
  }

  render() {
    const rooms = (this._overview && this._overview.rooms) || [];
    const areas = (this._overview && this._overview.areas) || [];
    const entities = (this._overview && this._overview.entities) || [];
    const presets = (this._overview && this._overview.presets) || {};
    const occupiedCount = rooms.filter((r) => r.is_present).length;

    const entityNameMap = {};
    entities.forEach((e) => {
      entityNameMap[e.entity_id] = e.name || e.entity_id;
    });

    const filteredRooms = rooms.filter((r) => {
      if (this._roomFilter === "occupied" && !r.is_present) return false;
      if (this._roomFilter === "vacant" && r.is_present) return false;
      if (
        this._roomSearch &&
        !r.room_name.toLowerCase().includes(this._roomSearch.toLowerCase())
      ) {
        return false;
      }
      return true;
    });

    const selRoom = this.selectedRoom;
    const cfg = this._draftConfig || {};
    const prev = this._previewData || {};
    const activeMap = {};
    (prev.active_observations || []).forEach((o) => {
      activeMap[`${o.entity_id}|${o.label}`] = o;
      activeMap[o.entity_id] = o;
    });

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --ha-bg: var(--primary-background-color, #f5f6f8);
          --ha-card: var(--card-background-color, #ffffff);
          --ha-subtle: var(--secondary-background-color, #f8fafc);
          --ha-text: var(--primary-text-color, #1e293b);
          --ha-muted: var(--secondary-text-color, #64748b);
          --ha-divider: var(--divider-color, #e2e8f0);
          --ha-primary: var(--primary-color, #0284c7);
          --ha-success: var(--success-color, #16a34a);
          --ha-warning: var(--warning-color, #d97706);
          --ha-danger: var(--error-color, #dc2626);
          display: block;
          min-height: 100vh;
          background: var(--ha-bg);
          color: var(--ha-text);
          font-family: Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          box-sizing: border-box;
        }
        * { box-sizing: border-box; }

        /* Clean Home Assistant Top App Bar */
        .app-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          height: 56px;
          background: var(--ha-card);
          border-bottom: 1px solid var(--ha-divider);
          position: sticky;
          top: 0;
          z-index: 20;
        }
        .header-left {
          display: flex;
          align-items: baseline;
          gap: 12px;
        }
        .header-title {
          font-size: 18px;
          font-weight: 500;
          margin: 0;
          color: var(--ha-text);
        }
        .header-summary {
          font-size: 13px;
          color: var(--ha-muted);
        }
        .nav-tabs {
          display: flex;
          height: 56px;
          gap: 4px;
        }
        .nav-tab {
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          padding: 0 16px;
          font-size: 14px;
          font-weight: 500;
          color: var(--ha-muted);
          cursor: pointer;
          transition: color 0.15s, border-color 0.15s;
        }
        .nav-tab:hover {
          color: var(--ha-text);
        }
        .nav-tab.active {
          color: var(--ha-primary);
          border-bottom-color: var(--ha-primary);
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Standard Buttons & Inputs */
        .btn {
          background: var(--ha-card);
          color: var(--ha-text);
          border: 1px solid var(--ha-divider);
          padding: 7px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.12s, border-color 0.12s;
        }
        .btn:hover {
          background: var(--ha-subtle);
        }
        .btn-primary {
          background: var(--ha-primary);
          border-color: var(--ha-primary);
          color: #ffffff;
        }
        .btn-primary:hover {
          filter: brightness(0.94);
          background: var(--ha-primary);
        }
        .btn-text {
          background: transparent;
          border: none;
          color: var(--ha-muted);
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
        }
        .btn-text:hover {
          background: var(--ha-subtle);
          color: var(--ha-text);
        }
        .btn-danger-text {
          background: transparent;
          border: none;
          color: var(--ha-muted);
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
        }
        .btn-danger-text:hover {
          color: var(--ha-danger);
          background: rgba(220, 38, 38, 0.08);
        }
        .btn-sm {
          padding: 5px 10px;
          font-size: 12px;
        }

        .input, .select {
          background: var(--ha-card);
          color: var(--ha-text);
          border: 1px solid var(--ha-divider);
          border-radius: 8px;
          padding: 8px 11px;
          font-size: 13px;
          width: 100%;
        }
        .input:focus, .select:focus {
          outline: none;
          border-color: var(--ha-primary);
        }

        /* Layout Workspace */
        .workspace {
          display: grid;
          grid-template-columns: 270px minmax(0, 1fr);
          gap: 24px;
          max-width: 1380px;
          margin: 0 auto;
          padding: 20px 24px 48px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .workspace {
            grid-template-columns: 1fr;
          }
        }

        /* Left Sidebar Room List */
        .sidebar-card {
          background: var(--ha-card);
          border: 1px solid var(--ha-divider);
          border-radius: 12px;
          overflow: hidden;
        }
        .sidebar-top {
          padding: 12px;
          border-bottom: 1px solid var(--ha-divider);
        }
        .seg-group {
          display: flex;
          background: var(--ha-subtle);
          border: 1px solid var(--ha-divider);
          border-radius: 8px;
          padding: 2px;
          margin-top: 8px;
        }
        .seg-btn {
          flex: 1;
          border: none;
          background: transparent;
          color: var(--ha-muted);
          padding: 5px 6px;
          font-size: 12px;
          font-weight: 500;
          border-radius: 6px;
          cursor: pointer;
        }
        .seg-btn.active {
          background: var(--ha-card);
          color: var(--ha-text);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
        }
        .room-list {
          max-height: calc(100vh - 190px);
          overflow-y: auto;
        }
        .room-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 11px 14px;
          border-bottom: 1px solid var(--ha-divider);
          cursor: pointer;
          transition: background 0.12s;
        }
        .room-row:last-child {
          border-bottom: none;
        }
        .room-row:hover {
          background: var(--ha-subtle);
        }
        .room-row.selected {
          background: rgba(2, 132, 199, 0.08);
          border-left: 3px solid var(--ha-primary);
          padding-left: 11px;
        }
        .room-row-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .status-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .status-dot.occupied {
          background: var(--ha-success);
        }
        .status-dot.clearing {
          background: var(--ha-warning);
        }
        .status-dot.clear {
          background: #94a3b8;
          opacity: 0.45;
        }
        .room-row-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--ha-text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .room-row-status {
          font-size: 12px;
          color: var(--ha-muted);
          flex-shrink: 0;
        }
        .room-row-status.occupied {
          color: var(--ha-success);
          font-weight: 500;
        }
        .room-row-status.clearing {
          color: var(--ha-warning);
          font-weight: 500;
        }

        /* Content Cards */
        .content-stack {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 920px;
        }
        .content-stack.wide {
          max-width: 100%;
        }
        .ha-card {
          background: var(--ha-card);
          border: 1px solid var(--ha-divider);
          border-radius: 12px;
          padding: 20px;
        }
        .card-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 16px;
        }
        .card-title {
          font-size: 16px;
          font-weight: 500;
          margin: 0;
          color: var(--ha-text);
        }
        .card-desc {
          font-size: 13px;
          color: var(--ha-muted);
          margin-top: 3px;
          line-height: 1.4;
        }

        /* Clean List Rows inside Cards */
        .list-divider {
          border-top: 1px solid var(--ha-divider);
        }
        .sensor-row {
          display: grid;
          grid-template-columns: minmax(180px, 1.3fr) minmax(210px, 1.3fr) auto;
          gap: 12px;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid var(--ha-divider);
        }
        .sensor-row:last-child {
          border-bottom: none;
        }
        @media (max-width: 700px) {
          .sensor-row {
            grid-template-columns: 1fr;
          }
        }
        .sensor-info {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .sensor-title {
          font-size: 14px;
          font-weight: 500;
          color: var(--ha-text);
        }
        .sensor-sub {
          font-size: 12px;
          color: var(--ha-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Chips */
        .chip-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }
        .ha-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--ha-subtle);
          border: 1px solid var(--ha-divider);
          border-radius: 999px;
          padding: 5px 12px;
          font-size: 13px;
          color: var(--ha-text);
        }
        .ha-chip button {
          background: none;
          border: none;
          color: var(--ha-muted);
          cursor: pointer;
          font-size: 14px;
          line-height: 1;
          padding: 0;
        }
        .ha-chip button:hover {
          color: var(--ha-danger);
        }

        /* Setting Rows */
        .setting-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 14px 0;
          border-bottom: 1px solid var(--ha-divider);
        }
        .setting-row:first-of-type {
          padding-top: 0;
        }
        .setting-row:last-of-type {
          border-bottom: none;
          padding-bottom: 0;
        }
        .setting-label {
          font-size: 14px;
          font-weight: 500;
          color: var(--ha-text);
        }
        .setting-help {
          font-size: 12.5px;
          color: var(--ha-muted);
          margin-top: 2px;
        }

        /* Expandable Advanced Drawer */
        .advanced-toggle-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--ha-card);
          border: 1px solid var(--ha-divider);
          border-radius: 12px;
          padding: 14px 20px;
          cursor: pointer;
          user-select: none;
        }
        .advanced-toggle-bar:hover {
          background: var(--ha-subtle);
        }

        .sub-tabs {
          display: flex;
          gap: 6px;
          border-bottom: 1px solid var(--ha-divider);
          padding-bottom: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .sub-tab {
          background: var(--ha-subtle);
          border: 1px solid var(--ha-divider);
          color: var(--ha-muted);
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12.5px;
          font-weight: 500;
          cursor: pointer;
        }
        .sub-tab.active {
          background: var(--ha-primary);
          border-color: var(--ha-primary);
          color: #fff;
        }

        .code-area {
          width: 100%;
          min-height: 200px;
          background: var(--ha-subtle);
          color: var(--ha-text);
          border: 1px solid var(--ha-divider);
          border-radius: 8px;
          padding: 12px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 12px;
          line-height: 1.5;
          resize: vertical;
        }

        /* Modal */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }
        .modal-card {
          background: var(--ha-card);
          border: 1px solid var(--ha-divider);
          border-radius: 12px;
          width: 480px;
          max-width: 92vw;
          padding: 20px;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
        }
      </style>

      <div id="pdd-toast-container" style="position:fixed;bottom:20px;right:24px;z-index:200;"></div>

      <datalist id="pdd-all-entities">
        ${entities
          .map(
            (e) =>
              `<option value="${this._escape(e.entity_id)}">${this._escape(e.name)} (${this._escape(
                e.state
              )})</option>`
          )
          .join("")}
      </datalist>

      <!-- Clean Home Assistant Header Bar -->
      <div class="app-header">
        <div class="header-left">
          <h1 class="header-title">Presence Detection</h1>
          <span class="header-summary">${occupiedCount} of ${rooms.length} rooms occupied</span>
        </div>

        <div class="nav-tabs">
          <button class="nav-tab ${this._studioView === "design" ? "active" : ""}" data-studio-view="design">Rooms</button>
          <button class="nav-tab ${this._studioView === "floorplan" ? "active" : ""}" data-studio-view="floorplan">Floorplan</button>
          <button class="nav-tab ${
            this._studioView === "statistics" || this._studioView === "replay" ? "active" : ""
          }" data-studio-view="statistics">Activity History</button>
        </div>

        <div class="header-actions">
          <button class="btn btn-sm" id="btn-refresh-overview">Refresh</button>
        </div>
      </div>

      <div class="workspace">
        <!-- LEFT SIDEBAR: Simple Room List -->
        <div class="sidebar-card">
          <div class="sidebar-top">
            <input
              type="text"
              class="input"
              id="room-search-input"
              placeholder="Search rooms..."
              value="${this._escape(this._roomSearch)}"
            />
            <div class="seg-group">
              ${[
                { id: "all", label: "All" },
                { id: "occupied", label: "Occupied" },
                { id: "vacant", label: "Clear" },
              ]
                .map(
                  (f) => `
                <button class="seg-btn ${this._roomFilter === f.id ? "active" : ""}" data-filter="${f.id}">
                  ${f.label}
                </button>`
                )
                .join("")}
            </div>
          </div>

          <div class="room-list">
            ${filteredRooms
              .map((r) => {
                const st = this._roomStatusSummary(r);
                return `
                  <div class="room-row ${
                    r.entry_id === this._selectedRoomId ? "selected" : ""
                  }" data-room-id="${this._escape(r.entry_id)}">
                    <div class="room-row-left">
                      <span class="status-dot ${st.dotClass}"></span>
                      <span class="room-row-name">${this._escape(r.room_name)}</span>
                    </div>
                    <span class="room-row-status ${st.dotClass}">${this._escape(st.label)}</span>
                  </div>`;
              })
              .join("")}
          </div>
        </div>

        <!-- MAIN WORKSPACE -->
        ${
          this._studioView === "floorplan"
            ? `<div class="content-stack wide">${this._renderFloorplanPane(selRoom)}</div>`
            : this._studioView === "statistics"
            ? `<div class="content-stack wide">${this._renderStatisticsPane(selRoom)}</div>`
            : this._studioView === "replay"
            ? `<div class="content-stack wide">${this._renderReplayPane(selRoom, presets)}</div>`
            : `<div class="content-stack">${this._renderSimpleRoomEditor(
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

      ${
        this._showGlobalModal
          ? `
        <div class="modal-backdrop" id="global-modal-backdrop">
          <div class="modal-card">
            <div class="card-head">
              <h3 class="card-title">Global AI &amp; Tracker Settings</h3>
              <button class="btn-text" id="btn-close-global">✕</button>
            </div>
            <div style="display:flex;flex-direction:column;gap:12px;">
              <div>
                <div class="setting-label" style="margin-bottom:4px;">Vision AI Provider</div>
                <select class="select" id="gl-provider">
                  <option value="vision_api" ${
                    (this._globalDraft?.llm_provider_type || "vision_api") === "vision_api"
                      ? "selected"
                      : ""
                  }>OpenAI-Compatible Vision API (LiteLLM)</option>
                  <option value="conversation" ${
                    this._globalDraft?.llm_provider_type === "conversation" ? "selected" : ""
                  }>Home Assistant Conversation Agent</option>
                  <option value="ai_task" ${
                    this._globalDraft?.llm_provider_type === "ai_task" ? "selected" : ""
                  }>Home Assistant AI Task</option>
                </select>
              </div>
              <div>
                <div class="setting-label" style="margin-bottom:4px;">API Endpoint URL</div>
                <input type="text" class="input" id="gl-api-url" value="${this._escape(
                  this._globalDraft?.llm_api_url || ""
                )}" placeholder="http://10.0.0.10:8448/v1/chat/completions" />
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <div>
                  <div class="setting-label" style="margin-bottom:4px;">Model Name</div>
                  <input type="text" class="input" id="gl-model" value="${this._escape(
                    this._globalDraft?.llm_model || "gemini-2.5-flash"
                  )}" />
                </div>
                <div>
                  <div class="setting-label" style="margin-bottom:4px;">HA Conversation Agent</div>
                  <input type="text" class="input" id="gl-agent-id" value="${this._escape(
                    this._globalDraft?.llm_agent_id || ""
                  )}" placeholder="conversation.google_ai_conversation" />
                </div>
              </div>
              <div>
                <div class="setting-label" style="margin-bottom:4px;">Household BLE Area Trackers</div>
                <input type="text" class="input" id="gl-ble" value="${this._escape(
                  (this._globalDraft?.ble_trackers || []).join(", ")
                )}" />
              </div>
              <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px;">
                <button class="btn" id="btn-cancel-global">Cancel</button>
                <button class="btn btn-primary" id="btn-save-global">Save</button>
              </div>
            </div>
          </div>
        </div>`
          : ""
      }
    `;

    this.renderToastOnly();
    this._bindEvents();
  }

  _renderSimpleRoomEditor(
    selRoom,
    cfg,
    prev,
    rooms,
    areas,
    entities,
    entityNameMap,
    presets,
    activeMap
  ) {
    if (!selRoom) {
      return `<div class="ha-card">Select a room on the left to view or edit its settings.</div>`;
    }

    const st = this._roomStatusSummary(selRoom);
    const observations = cfg.bayesian_observations || [];
    const conditions = cfg.sustaining_conditions || [];
    const connectedRooms = cfg.connected_rooms || [];
    const boundaries = cfg.boundary_entities || [];
    const hasDoorSeal = cfg.mode === "bounded";
    const timeoutSec = Number(cfg.inactivity_timeout ?? 180);
    const timeoutMinText = this._formatDuration(timeoutSec);

    return `
      <!-- 1. Compact Status & Action Header Card -->
      <div class="ha-card" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
        <div style="display:flex;align-items:center;gap:14px;">
          <span class="status-dot ${st.dotClass}" style="width:12px;height:12px;"></span>
          <div>
            <div style="display:flex;align-items:center;gap:10px;">
              <h2 style="margin:0;font-size:20px;font-weight:500;">${this._escape(
                cfg.room_name || selRoom.room_name
              )}</h2>
              <span style="font-size:12.5px;font-weight:500;padding:2px 10px;border-radius:999px;background:var(--ha-subtle);border:1px solid var(--ha-divider);color:${
                st.dotClass === "occupied"
                  ? "var(--ha-success)"
                  : st.dotClass === "clearing"
                  ? "var(--ha-warning)"
                  : "var(--ha-muted)"
              };">
                ${this._escape(st.label)}
              </span>
              ${
                this._dirty
                  ? `<span style="font-size:12px;color:var(--ha-warning);font-weight:500;">• Unsaved changes</span>`
                  : ""
              }
            </div>
            <div style="font-size:13px;color:var(--ha-muted);margin-top:3px;">
              ${this._escape(st.detail)}
            </div>
          </div>
        </div>

        <div style="display:flex;align-items:center;gap:8px;">
          <button class="btn" id="btn-room-override">
            ${selRoom.override ? "Release Manual Hold" : "Hold Occupied"}
          </button>
          <button class="btn" id="btn-room-refresh">Recalculate</button>
          <button class="btn btn-primary" id="btn-save-room">Save Changes</button>
        </div>
      </div>

      <!-- 2. Card 1: Presence & Motion Sensors -->
      <div class="ha-card">
        <div class="card-head">
          <div>
            <h3 class="card-title">Presence &amp; Motion Sensors</h3>
            <div class="card-desc">
              Choose which sensors detect people in this room and whether they can trigger occupancy on their own or need confirmation from another sensor.
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
                    const roleGroup = this._friendlyRoleGroup(obs);
                    return `
                    <div class="sensor-row" data-obs-idx="${idx}">
                      <div class="sensor-info">
                        <span class="status-dot ${isAct ? "occupied" : "clear"}" title="${
                      isAct ? "Currently active" : "Clear"
                    }"></span>
                        <div style="min-width:0;">
                          <div class="sensor-title">${this._escape(friendlyName)}</div>
                          <div class="sensor-sub">${this._escape(obs.entity_id)}${
                      obs.state && obs.state !== "on" ? ` = ${this._escape(obs.state)}` : ""
                    }</div>
                        </div>
                      </div>

                      <div>
                        <select class="select obs-role-simple" data-idx="${idx}">
                          <option value="primary" ${
                            roleGroup === "primary" ? "selected" : ""
                          }>Main room sensor (triggers room alone)</option>
                          <option value="shared" ${
                            roleGroup === "shared" ? "selected" : ""
                          }>Shared / hallway view (needs confirmation)</option>
                          <option value="keepalive" ${
                            roleGroup === "keepalive" ? "selected" : ""
                          }>Keep-alive only (extends timer once occupied)</option>
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

        <div style="display:grid;grid-template-columns:1.3fr 1.2fr auto;gap:10px;margin-top:14px;padding-top:14px;border-top:1px solid var(--ha-divider);align-items:center;">
          <input
            type="text"
            class="input"
            id="simple-add-obs-entity"
            list="pdd-all-entities"
            placeholder="Add sensor (e.g. binary_sensor.living_room_motion)..."
          />
          <select class="select" id="simple-add-obs-role">
            <option value="primary">Main room sensor (triggers room alone)</option>
            <option value="shared" selected>Shared / hallway view (needs confirmation)</option>
            <option value="keepalive">Keep-alive only (extends timer once occupied)</option>
          </select>
          <button class="btn" id="btn-simple-add-obs">+ Add Sensor</button>
        </div>
      </div>

      <!-- 3. Card 2: Keep Occupied While Active (TV, Media, Appliances) -->
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
                  <div style="display:grid;grid-template-columns:1.4fr 120px 120px auto;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid var(--ha-divider);">
                    <input
                      type="text"
                      class="input cond-field"
                      data-idx="${idx}"
                      data-key="entity_id"
                      list="pdd-all-entities"
                      placeholder="media_player.living_room_tv"
                      value="${this._escape(c.entity_id || "")}"
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
                      value="${this._escape(c.state ?? "playing")}"
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

      <!-- 4. Card 3: Clearing & Room Connections -->
      <div class="ha-card">
        <div class="card-head">
          <div>
            <h3 class="card-title">Clearing &amp; Room Connections</h3>
            <div class="card-desc">
              Control how long the room stays occupied after activity stops, and which neighboring rooms immediately clear the countdown when someone walks out.
            </div>
          </div>
        </div>

        <div class="list-divider">
          <!-- Clear Delay -->
          <div class="setting-row">
            <div>
              <div class="setting-label">Clear after inactivity</div>
              <div class="setting-help">How long to wait after all sensors stop seeing activity (${timeoutMinText}).</div>
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

          <!-- Adjacent Rooms Hand-Off -->
          <div class="setting-row" style="align-items:flex-start;flex-direction:column;">
            <div style="width:100%;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
              <div>
                <div class="setting-label">Connected adjacent rooms</div>
                <div class="setting-help">
                  If this room is only counting down and someone is detected in a connected room, clear the countdown immediately.
                </div>
              </div>
              <button class="btn btn-sm" id="btn-open-floorplan-tab">Edit on Floorplan</button>
            </div>

            <div class="chip-row" style="margin-top:8px;">
              ${
                connectedRooms.length === 0
                  ? `<span style="font-size:13px;color:var(--ha-muted);">No adjacent rooms linked.</span>`
                  : connectedRooms
                      .map(
                        (rname, i) => `
                      <span class="ha-chip">
                        ${this._escape(rname)}
                        <button class="del-connected-room" data-idx="${i}" title="Unlink room">×</button>
                      </span>`
                      )
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
                        `<option value="${this._escape(r.room_name)}">${this._escape(
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
            <label style="display:flex;align-items:center;gap:10px;cursor:pointer;">
              <input
                type="checkbox"
                id="cfg-bounded-toggle"
                ${hasDoorSeal ? "checked" : ""}
                style="width:16px;height:16px;"
              />
              <div>
                <div class="setting-label">Closed doors trap occupancy in this room</div>
                <div class="setting-help">
                  Enable only if every exit from this room has a physical door contact sensor.
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
                      ? `<span style="font-size:12.5px;color:var(--ha-warning);">Add at least one door contact sensor below so the room can seal when closed.</span>`
                      : boundaries
                          .map(
                            (eid, i) => `
                          <span class="ha-chip">
                            ${this._escape(eid)}
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

      <!-- 5. Progressive Disclosure: Collapsible Advanced Settings & Diagnostics -->
      <div class="advanced-toggle-bar" id="btn-toggle-advanced">
        <div>
          <div style="font-size:14px;font-weight:500;color:var(--ha-text);">
            ${this._showAdvanced ? "▾ Hide Advanced Settings & Diagnostics" : "▸ Advanced Settings & Diagnostics"}
          </div>
          <div style="font-size:12.5px;color:var(--ha-muted);margin-top:2px;">
            Bayesian weights, AI camera vision check, sensor combination truth table, YAML editor, and revision history
          </div>
        </div>
        <span style="font-size:12.5px;color:var(--ha-primary);font-weight:500;">
          ${this._showAdvanced ? "Collapse" : "Expand"}
        </span>
      </div>

      ${
        this._showAdvanced
          ? this._renderAdvancedDrawer(selRoom, cfg, prev, areas, presets, activeMap)
          : ""
      }
    `;
  }

  _renderAdvancedDrawer(selRoom, cfg, prev, areas, presets, activeMap) {
    const priorPct = Math.round(Number(cfg.bayesian_prior ?? 0.2) * 100);
    const threshPct = Math.round(Number(cfg.bayesian_threshold ?? 0.75) * 100);
    const livePct = Number(
      prev.probability_pct ?? (selRoom ? selRoom.bayesian_probability_pct : 0)
    ).toFixed(1);
    const comb = prev.combinatorics || {};

    return `
      <div class="ha-card">
        <div class="sub-tabs">
          <button class="sub-tab ${
            this._advTab === "tuning" ? "active" : ""
          }" data-adv-tab="tuning">Bayesian &amp; Vision Tuning</button>
          <button class="sub-tab ${
            this._advTab === "truth" ? "active" : ""
          }" data-adv-tab="truth">Combination Truth Table</button>
          <button class="sub-tab ${
            this._advTab === "yaml" ? "active" : ""
          }" data-adv-tab="yaml">YAML &amp; AI Rules</button>
          <button class="sub-tab ${
            this._advTab === "revisions" ? "active" : ""
          }" data-adv-tab="revisions">Saved Revisions (${(selRoom.revisions || []).length})</button>
          <div style="flex:1;"></div>
          <button class="btn btn-sm" id="btn-open-global">Global AI Settings</button>
          <button class="btn btn-sm" id="btn-jump-to-replay">Open Replay Simulator</button>
        </div>

        ${
          this._advTab === "tuning"
            ? `
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:14px;margin-bottom:20px;">
            <div>
              <div class="setting-label" style="font-size:12.5px;margin-bottom:4px;">Home Assistant Area</div>
              <select class="select" id="cfg-area-id">
                <option value="">— None —</option>
                ${areas
                  .map(
                    (a) =>
                      `<option value="${this._escape(a.id)}" ${
                        cfg.area_id === a.id ? "selected" : ""
                      }>${this._escape(a.name)}</option>`
                  )
                  .join("")}
              </select>
            </div>
            <div>
              <div class="setting-label" style="font-size:12.5px;margin-bottom:4px;">Prior Baseline: ${priorPct}%</div>
              <input type="range" min="5" max="50" step="1" id="cfg-prior-slider" value="${priorPct}" style="width:100%;" />
            </div>
            <div>
              <div class="setting-label" style="font-size:12.5px;margin-bottom:4px;">Activation Threshold: ${threshPct}%</div>
              <input type="range" min="50" max="95" step="1" id="cfg-thresh-slider" value="${threshPct}" style="width:100%;" />
            </div>
            <div>
              <div class="setting-label" style="font-size:12.5px;margin-bottom:4px;">Camera Entity (AI Vision)</div>
              <div style="display:flex;gap:6px;">
                <input type="text" class="input" id="cfg-camera-entity" list="pdd-all-entities" value="${this._escape(
                  cfg.camera_entity || ""
                )}" placeholder="camera.living_room" />
                <button class="btn btn-sm" id="btn-room-verify" title="Run AI Vision Check now">Check</button>
              </div>
            </div>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <div class="setting-label">Detailed Sensor Probabilities — Current Score: ${livePct}%</div>
            <div style="display:flex;gap:8px;">
              <button class="btn btn-sm" id="btn-add-ble">+ Add Household BLE</button>
              <button class="btn btn-sm" id="btn-sync-triggers">Sync Instant Triggers</button>
            </div>
          </div>

          <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:12.5px;">
              <thead>
                <tr style="border-bottom:1px solid var(--ha-divider);text-align:left;color:var(--ha-muted);">
                  <th style="padding:8px 6px;">Entity ID &amp; Label</th>
                  <th style="padding:8px 6px;">Preset</th>
                  <th style="padding:8px 6px;">P(E|Occ)</th>
                  <th style="padding:8px 6px;">P(E|Vac)</th>
                  <th style="padding:8px 6px;">Operator &amp; State</th>
                </tr>
              </thead>
              <tbody>
                ${(cfg.bayesian_observations || [])
                  .map((obs, idx) => {
                    const presetVal = obs.preset || obs.weight || "moderate";
                    const pDefaults = presets[presetVal] || {
                      prob_given_true: 0.72,
                      prob_given_false: 0.12,
                    };
                    const pTrue = Number(obs.prob_given_true ?? pDefaults.prob_given_true);
                    const pFalse = Number(obs.prob_given_false ?? pDefaults.prob_given_false);
                    return `
                    <tr style="border-bottom:1px solid var(--ha-divider);">
                      <td style="padding:8px 6px;">
                        <input type="text" class="input obs-field" data-idx="${idx}" data-key="entity_id" list="pdd-all-entities" value="${this._escape(
                      obs.entity_id || ""
                    )}" style="margin-bottom:4px;font-family:monospace;font-size:11.5px;" />
                        <input type="text" class="input obs-field" data-idx="${idx}" data-key="label" value="${this._escape(
                      obs.label || ""
                    )}" placeholder="Label" />
                      </td>
                      <td style="padding:8px 6px;width:130px;">
                        <select class="select obs-preset" data-idx="${idx}">
                          ${["decisive", "strong", "moderate", "supporting", "weak_hint", "custom"]
                            .map(
                              (p) =>
                                `<option value="${p}" ${presetVal === p ? "selected" : ""}>${p}</option>`
                            )
                            .join("")}
                        </select>
                      </td>
                      <td style="padding:8px 6px;width:90px;">
                        <input type="number" step="0.01" min="0.01" max="0.99" class="input obs-prob" data-idx="${idx}" data-key="prob_given_true" value="${pTrue.toFixed(
                      2
                    )}" />
                      </td>
                      <td style="padding:8px 6px;width:90px;">
                        <input type="number" step="0.01" min="0.01" max="0.99" class="input obs-prob" data-idx="${idx}" data-key="prob_given_false" value="${pFalse.toFixed(
                      2
                    )}" />
                      </td>
                      <td style="padding:8px 6px;width:190px;">
                        <div style="display:flex;gap:4px;">
                          <select class="select obs-field" data-idx="${idx}" data-key="operator">
                            ${["equals", "in", "greater_than", "less_than", "not_equals"]
                              .map(
                                (op) =>
                                  `<option value="${op}" ${
                                    (obs.operator || "equals") === op ? "selected" : ""
                                  }>${op}</option>`
                              )
                              .join("")}
                          </select>
                          <input type="text" class="input obs-field" data-idx="${idx}" data-key="state" value="${this._escape(
                      obs.state ?? "on"
                    )}" style="width:80px;" />
                        </div>
                      </td>
                    </tr>`;
                  })
                  .join("")}
              </tbody>
            </table>
          </div>
        `
            : this._advTab === "truth"
            ? `
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:16px;">
            <div>
              <div class="setting-label" style="margin-bottom:8px;">Sensors that trigger occupancy alone (&ge; ${threshPct}%)</div>
              ${
                (comb.solo_triggers || []).length === 0
                  ? `<div style="font-size:13px;color:var(--ha-muted);">None — at least 2 sensors must agree.</div>`
                  : (comb.solo_triggers || [])
                      .map(
                        (s) => `
                      <div style="display:flex;justify-content:space-between;padding:8px 10px;background:var(--ha-subtle);border:1px solid var(--ha-divider);border-radius:8px;margin-bottom:6px;font-size:13px;">
                        <span>${this._escape(s.label)}</span>
                        <strong style="color:var(--ha-success);">${s.posterior_pct}%</strong>
                      </div>`
                      )
                      .join("")
              }
            </div>
            <div>
              <div class="setting-label" style="margin-bottom:8px;">2-sensor combinations that trigger (&ge; ${threshPct}%)</div>
              ${
                (comb.pair_triggers || []).length === 0
                  ? `<div style="font-size:13px;color:var(--ha-muted);">No 2-sensor combinations cross threshold.</div>`
                  : (comb.pair_triggers || [])
                      .slice(0, 8)
                      .map(
                        (p) => `
                      <div style="display:flex;justify-content:space-between;padding:8px 10px;background:var(--ha-subtle);border:1px solid var(--ha-divider);border-radius:8px;margin-bottom:6px;font-size:13px;">
                        <span>${this._escape(p.labels)}</span>
                        <strong style="color:var(--ha-primary);">${p.posterior_pct}%</strong>
                      </div>`
                      )
                      .join("")
              }
            </div>
            <div>
              <div class="setting-label" style="margin-bottom:8px;">Ignored combinations (&lt; ${threshPct}%)</div>
              ${
                (comb.pair_sub_threshold || []).length === 0
                  ? `<div style="font-size:13px;color:var(--ha-muted);">None</div>`
                  : (comb.pair_sub_threshold || [])
                      .slice(0, 6)
                      .map(
                        (p) => `
                      <div style="display:flex;justify-content:space-between;padding:8px 10px;background:var(--ha-subtle);border:1px solid var(--ha-divider);border-radius:8px;margin-bottom:6px;font-size:13px;color:var(--ha-muted);">
                        <span>${this._escape(p.labels)}</span>
                        <span>${p.posterior_pct}%</span>
                      </div>`
                      )
                      .join("")
              }
            </div>
          </div>
        `
            : this._advTab === "yaml"
            ? `
          <div style="display:flex;gap:6px;margin-bottom:10px;">
            <button class="btn btn-sm ${this._rightTab === "yaml" ? "btn-primary" : ""}" data-rtab="yaml">Room YAML</button>
            <button class="btn btn-sm ${this._rightTab === "ha_yaml" ? "btn-primary" : ""}" data-rtab="ha_yaml">Native HA Bayesian YAML</button>
            <button class="btn btn-sm ${this._rightTab === "nl" ? "btn-primary" : ""}" data-rtab="nl">Plain-English AI Builder</button>
          </div>
          ${
            this._rightTab === "yaml"
              ? `
            <textarea class="code-area" id="yaml-draft-editor">${this._escape(
              this._yamlDraft
            )}</textarea>
            <div style="display:flex;justify-content:flex-end;margin-top:8px;">
              <button class="btn btn-primary btn-sm" id="btn-apply-yaml">Apply YAML</button>
            </div>`
              : this._rightTab === "ha_yaml"
              ? `<textarea class="code-area" readonly>${this._escape(
                  prev.ha_bayesian_yaml || ""
                )}</textarea>`
              : `
            <textarea class="code-area" id="nl-prompt-input" style="min-height:90px;" placeholder="Describe how this room should behave in plain English...">${this._escape(
              this._nlPrompt
            )}</textarea>
            <div style="display:flex;gap:8px;margin-top:8px;">
              <button class="btn btn-primary btn-sm" id="btn-nl-to-yaml">Generate Rules</button>
              <button class="btn btn-sm" id="btn-yaml-to-nl">Explain Current Rules</button>
            </div>
            ${
              this._nlOutput
                ? `<div style="margin-top:10px;padding:12px;background:var(--ha-subtle);border:1px solid var(--ha-divider);border-radius:8px;font-size:13px;white-space:pre-wrap;">${this._escape(
                    this._nlOutput
                  )}</div>`
                : ""
            }`
          }
        `
            : `
          ${
            (selRoom.revisions || []).length === 0
              ? `<div style="font-size:13px;color:var(--ha-muted);">No saved revisions yet.</div>`
              : (selRoom.revisions || [])
                  .map(
                    (rev) => `
                  <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--ha-divider);font-size:13px;">
                    <div>
                      <div style="font-weight:500;">${this._escape(rev.note || "Saved settings")}</div>
                      <div style="font-size:12px;color:var(--ha-muted);">${this._escape(
                        rev.timestamp
                      )}</div>
                    </div>
                    <button class="btn btn-sm btn-rollback" data-rev-idx="${rev.index}">Restore</button>
                  </div>`
                  )
                  .join("")
          }
        `
        }
      </div>
    `;
  }

  _buildStepSvgPaths(series, width = 900, height = 170) {
    const pts = series || [];
    if (pts.length === 0) {
      return { linePath: "", areaPath: "" };
    }
    const coords = [];
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const x = Math.max(0, Math.min(width, (Number(p.offset_pct || 0) / 100) * width));
      const y = Math.max(
        6,
        Math.min(height - 6, height - (Number(p.probability_pct || 0) / 100) * (height - 12) - 6)
      );
      if (i > 0) {
        const prevY = coords[coords.length - 1][1];
        coords.push([x, prevY]);
      }
      coords.push([x, y]);
    }
    const lastY = coords[coords.length - 1][1];
    coords.push([width, lastY]);

    const linePath = coords
      .map((c, idx) => `${idx === 0 ? "M" : "L"}${c[0].toFixed(1)},${c[1].toFixed(1)}`)
      .join(" ");
    const areaPath = `${linePath} L${width},${height} L0,${height} Z`;
    return { linePath, areaPath };
  }

  _coneSvgPath(cam) {
    const cx = Number(cam.x || 0);
    const cy = Number(cam.y || 0);
    const r = Math.max(20, Number(cam.range_px || 180));
    const heading = Number(cam.heading_deg || 0);
    const fov = Math.max(10, Math.min(350, Number(cam.fov_deg || 90)));
    const startDeg = heading - fov / 2.0;
    const endDeg = heading + fov / 2.0;
    const startRad = (startDeg * Math.PI) / 180.0;
    const endRad = (endDeg * Math.PI) / 180.0;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const largeArc = fov > 180 ? 1 : 0;
    return `M ${cx.toFixed(1)},${cy.toFixed(1)} L ${x1.toFixed(1)},${y1.toFixed(
      1
    )} A ${r.toFixed(1)},${r.toFixed(1)} 0 ${largeArc},1 ${x2.toFixed(1)},${y2.toFixed(1)} Z`;
  }

  _renderFloorplanPane(selRoom) {
    const fp = this._floorplan || this._overview?.floorplan;
    const compiled = this._compiledTopology || this._overview?.compiled_topology || {};
    if (!fp || !Array.isArray(fp.floors)) {
      return `<div class="ha-card">Loading floorplan...</div>`;
    }
    const floors = fp.floors;
    const activeFloor = floors.find((f) => f.id === this._selectedFloorId) || floors[1] || floors[0];
    this._selectedFloorId = activeFloor.id;

    const liveRoomsByName = {};
    ((this._overview && this._overview.rooms) || []).forEach((r) => {
      liveRoomsByName[r.room_name] = r;
    });

    const allFpRooms = fp.rooms || [];
    const allFpConns = fp.connections || [];
    const allFpCams = fp.cameras || [];

    const fRooms =
      activeFloor.rooms || allFpRooms.filter((r) => r.floor === activeFloor.id);
    const floorRoomNames = new Set(fRooms.map((r) => r.name || r.room_name));
    const fConns =
      activeFloor.connections ||
      allFpConns.filter(
        (c) => floorRoomNames.has(c.from_room) || floorRoomNames.has(c.to_room)
      );
    const fCams =
      activeFloor.cameras || allFpCams.filter((c) => c.floor === activeFloor.id);

    if (
      fCams.length > 0 &&
      (!this._selectedCamEntity ||
        !fCams.some((c) => (c.id || c.camera_entity) === this._selectedCamEntity))
    ) {
      this._selectedCamEntity = fCams[0].id || fCams[0].camera_entity;
    }
    const selCam =
      fCams.find((c) => (c.id || c.camera_entity) === this._selectedCamEntity) ||
      fCams[0] ||
      null;
    const selBox =
      fRooms.find(
        (b) => selRoom && (b.name || b.room_name) === selRoom.room_name
      ) ||
      fRooms[0] ||
      null;

    const roomBoxMap = {};
    fRooms.forEach((b) => {
      roomBoxMap[b.name || b.room_name] = b;
    });

    const camAnalysis = compiled.camera_analysis || [];
    const ambiguities = compiled.ambiguities || [];
    const connMap = compiled.connected_rooms_map || {};
    const roomCoverage = compiled.room_coverage || {};

    const conesSvg = fCams
      .map((cam) => {
        const camId = cam.id || cam.camera_entity;
        const camLabel = (cam.name || cam.label || camId).replace(" Camera", "");
        const isSelectedCam = selCam && (selCam.id || selCam.camera_entity) === camId;
        const hasSpill =
          (Array.isArray(cam.spills_into) && cam.spills_into.length > 0) ||
          camAnalysis.some((ca) => ca.camera_id === camId && ca.has_multi_room_bleed);
        const coneColor = hasSpill ? "#d97706" : "#0284c7";
        const pathD = this._coneSvgPath(cam);
        const rad = (Number(cam.heading_deg || 0) * Math.PI) / 180.0;
        const labelDist = Math.min(125, Number(cam.range_px || 200) * 0.45);
        const labelX = Math.max(70, Math.min(930, Number(cam.x) + Math.cos(rad) * labelDist));
        const labelY = Math.max(20, Math.min(560, Number(cam.y) + Math.sin(rad) * labelDist));
        return `
          <g class="fp-cam-group" data-cam-entity="${this._escape(camId)}" style="cursor:pointer;">
            <path
              d="${pathD}"
              fill="${hasSpill ? "rgba(217, 119, 6, 0.12)" : "rgba(2, 132, 199, 0.11)"}"
              stroke="${coneColor}"
              stroke-width="${isSelectedCam ? "2.2" : "1.2"}"
              stroke-dasharray="${hasSpill ? "5,4" : "none"}"
            />
            <circle
              cx="${Number(cam.x).toFixed(1)}"
              cy="${Number(cam.y).toFixed(1)}"
              r="${isSelectedCam ? "7" : "5"}"
              fill="${coneColor}"
              stroke="#ffffff"
              stroke-width="1.5"
            />
            <text
              x="${labelX.toFixed(1)}"
              y="${labelY.toFixed(1)}"
              text-anchor="middle"
              fill="${coneColor}"
              font-size="11"
              font-weight="600"
            >${this._escape(camLabel)}</text>
          </g>
        `;
      })
      .join("");

    const roomsSvg = fRooms
      .map((box) => {
        const rName = box.name || box.room_name;
        const live = liveRoomsByName[rName];
        const isSel = selRoom && selRoom.room_name === rName;
        const isOcc = live ? Boolean(live.is_present) : false;
        const isTransit = box.room_type === "transit" || Boolean(box.is_transit);
        const covPct = Number(roomCoverage[rName]?.max_coverage_pct ?? 100);
        const hasBlindSpot = !isTransit && covPct === 0;

        let strokeColor = isSel ? "#0284c7" : "#cbd5e1";
        let fillColor = "#ffffff";
        if (isOcc) {
          strokeColor = "#16a34a";
          fillColor = "#f0fdf4";
        } else if (hasBlindSpot) {
          strokeColor = "#d97706";
          fillColor = "#fffbeb";
        } else if (isTransit) {
          strokeColor = "#cbd5e1";
          fillColor = "#f8fafc";
        }

        const rx = Number(box.x);
        const ry = Number(box.y);
        const rw = Number(box.width ?? box.w ?? 200);
        const rh = Number(box.height ?? box.h ?? 150);
        const statusSummary = this._roomStatusSummary(live);

        return `
          <g class="fp-room-box" data-room-name="${this._escape(rName)}" style="cursor:pointer;">
            <rect
              x="${rx}"
              y="${ry}"
              width="${rw}"
              height="${rh}"
              rx="10"
              fill="${fillColor}"
              stroke="${strokeColor}"
              stroke-width="${isSel ? "2.5" : "1.5"}"
              stroke-dasharray="${isTransit ? "4,4" : "none"}"
            />
            <text
              x="${rx + 14}"
              y="${ry + 24}"
              fill="#1e293b"
              font-size="13.5"
              font-weight="600"
            >${this._escape(rName)}</text>
            <text
              x="${rx + 14}"
              y="${ry + 44}"
              fill="${isOcc ? "#16a34a" : "#64748b"}"
              font-size="11.5"
            >${isTransit ? "Shared walkway / stairs" : this._escape(statusSummary.label)}</text>
            ${
              hasBlindSpot
                ? `<text x="${rx + 14}" y="${ry + rh - 12}" fill="#d97706" font-size="10.5" font-weight="500">No camera cone (uses motion / BLE)</text>`
                : ""
            }
          </g>
        `;
      })
      .join("");

    const connsSvg = fConns
      .map((conn) => {
        const bFrom = roomBoxMap[conn.from_room];
        const bTo = roomBoxMap[conn.to_room];
        if (!bFrom || !bTo) return "";
        const w1 = Number(bFrom.width ?? bFrom.w ?? 200);
        const h1 = Number(bFrom.height ?? bFrom.h ?? 150);
        const w2 = Number(bTo.width ?? bTo.w ?? 200);
        const h2 = Number(bTo.height ?? bTo.h ?? 150);
        const x1 = Number(bFrom.x) + w1 / 2;
        const y1 = Number(bFrom.y) + h1 / 2;
        const x2 = Number(bTo.x) + w2 / 2;
        const y2 = Number(bTo.y) + h2 / 2;
        return `
          <line
            x1="${x1.toFixed(1)}"
            y1="${y1.toFixed(1)}"
            x2="${x2.toFixed(1)}"
            y2="${y2.toFixed(1)}"
            stroke="#94a3b8"
            stroke-width="1.5"
            stroke-dasharray="4,4"
            opacity="0.65"
          />
        `;
      })
      .join("");

    const selBoxName = selBox ? selBox.name || selBox.room_name : selRoom?.room_name || "Room";
    const selCamId = selCam ? selCam.id || selCam.camera_entity : "";

    return `
      <div class="ha-card">
        <div class="card-head" style="flex-wrap:wrap;">
          <div>
            <h2 class="card-title" style="font-size:18px;">House Floorplan &amp; Camera Coverage</h2>
            <div class="card-desc">
              Click any room to view its connections, or click <strong>Apply Connections to Rooms</strong> to sync adjacent room hand-offs.
            </div>
          </div>

          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            <div class="seg-group" style="margin-top:0;">
              ${floors
                .map(
                  (fl) => `
                <button class="seg-btn ${
                  fl.id === activeFloor.id ? "active" : ""
                }" data-floor-id="${this._escape(fl.id)}" style="padding:6px 12px;">
                  ${this._escape(fl.name.replace(/\s*\(.*\)/, ""))}
                </button>`
                )
                .join("")}
            </div>
            <button class="btn btn-sm" id="btn-toggle-fp-inspector">
              ${this._showFloorplanInspector ? "Hide Geometry Editor" : "Edit Boxes & Cameras"}
            </button>
            <button class="btn btn-primary btn-sm" id="btn-fp-compile">Apply Connections to Rooms</button>
          </div>
        </div>

        <div style="background:#f8fafc;border:1px solid var(--ha-divider);border-radius:10px;padding:10px;overflow:hidden;">
          <svg id="fp-svg-canvas" viewBox="0 0 1000 580" style="width:100%;height:auto;min-height:420px;display:block;user-select:none;">
            ${connsSvg}
            ${roomsSvg}
            ${conesSvg}
          </svg>
        </div>

        ${
          this._showFloorplanInspector
            ? `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px;padding-top:16px;border-top:1px solid var(--ha-divider);">
            <div>
              <div class="setting-label" style="margin-bottom:8px;">Camera Cone Geometry</div>
              ${
                !selCam
                  ? `<div style="font-size:13px;color:var(--ha-muted);">No cameras on this floor.</div>`
                  : `
                <select class="select" id="fp-cam-select" style="margin-bottom:10px;">
                  ${fCams
                    .map((c) => {
                      const cid = c.id || c.camera_entity;
                      return `<option value="${this._escape(cid)}" ${
                        cid === selCamId ? "selected" : ""
                      }>${this._escape(c.name || cid)}</option>`;
                    })
                    .join("")}
                </select>
                <div style="display:grid;grid-template-columns:repeat(5, 1fr);gap:8px;">
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
                  )}" /></div>
                  <div><small>Range</small><input type="number" class="input fp-cam-field" data-key="range_px" value="${Number(
                    selCam.range_px
                  )}" /></div>
                </div>`
              }
            </div>

            <div>
              <div class="setting-label" style="margin-bottom:8px;">Room Box: ${this._escape(
                selBoxName
              )}</div>
              ${
                !selBox
                  ? ""
                  : `
                <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:8px;margin-bottom:10px;">
                  <div><small>X</small><input type="number" class="input fp-box-field" data-room="${this._escape(
                    selBoxName
                  )}" data-key="x" value="${Number(selBox.x)}" /></div>
                  <div><small>Y</small><input type="number" class="input fp-box-field" data-room="${this._escape(
                    selBoxName
                  )}" data-key="y" value="${Number(selBox.y)}" /></div>
                  <div><small>Width</small><input type="number" class="input fp-box-field" data-room="${this._escape(
                    selBoxName
                  )}" data-key="width" value="${Number(selBox.width ?? 200)}" /></div>
                  <div><small>Height</small><input type="number" class="input fp-box-field" data-room="${this._escape(
                    selBoxName
                  )}" data-key="height" value="${Number(selBox.height ?? 150)}" /></div>
                </div>
                <div style="display:flex;gap:8px;">
                  <button class="btn btn-sm" id="btn-fp-save">Save Layout</button>
                  <button class="btn btn-sm" id="btn-fp-reset">Reset Default Layout</button>
                </div>`
              }
            </div>
          </div>`
            : ""
        }
      </div>

      <!-- Collapsible Coverage Notes Bar -->
      <div class="advanced-toggle-bar" id="btn-toggle-fp-notes">
        <div>
          <div style="font-size:14px;font-weight:500;color:var(--ha-text);">
            ${this._showFloorplanNotes ? "▾ Hide Coverage & Shared Camera Notes" : `▸ Coverage & Shared Camera Notes (${ambiguities.length})`}
          </div>
          <div style="font-size:12.5px;color:var(--ha-muted);margin-top:2px;">
            Areas where a camera sees into a neighboring room or where a room has no direct camera coverage
          </div>
        </div>
        <span style="font-size:12.5px;color:var(--ha-primary);font-weight:500;">
          ${this._showFloorplanNotes ? "Collapse" : "Expand"}
        </span>
      </div>

      ${
        this._showFloorplanNotes
          ? `
        <div class="ha-card">
          <div class="list-divider" style="border-top:none;">
            ${ambiguities
              .map(
                (amb) => `
              <div style="padding:12px 0;border-bottom:1px solid var(--ha-divider);">
                <div style="font-size:14px;font-weight:500;">${this._escape(
                  amb.title || amb.room || (amb.rooms || []).join(" ↔ ")
                )}</div>
                <div style="font-size:13px;color:var(--ha-muted);margin-top:2px;">${this._escape(
                  amb.description
                )}</div>
                <div style="font-size:12.5px;color:var(--ha-primary);margin-top:4px;">${this._escape(
                  amb.resolution || amb.recommendation || ""
                )}</div>
              </div>`
              )
              .join("")}
          </div>
        </div>`
          : ""
      }
    `;
  }

  _renderStatisticsPane(selRoom) {
    if (!selRoom) {
      return `<div class="ha-card">Select a room to view its activity history.</div>`;
    }
    const st = this._statsData;
    if (!st || st.entry_id !== selRoom.entry_id) {
      return `<div class="ha-card">Loading activity history for <strong>${this._escape(
        selRoom.room_name
      )}</strong>...</div>`;
    }
    const sum = st.summary || {};
    const series = st.series || [];
    const swimlanes = st.swimlanes || [];
    const W = 900;
    const H = 160;
    const { linePath, areaPath } = this._buildStepSvgPaths(series, W, H);
    const threshY = H - (Number(st.threshold_pct || 75) / 100) * (H - 12) - 6;

    return `
      <div class="ha-card">
        <div class="card-head" style="flex-wrap:wrap;">
          <div>
            <h2 class="card-title" style="font-size:18px;">${this._escape(
              selRoom.room_name
            )} — Activity History</h2>
            <div class="card-desc">
              Occupied for ${Number(sum.occupied_minutes || 0).toFixed(0)} minutes (${Number(
      sum.occupied_pct || 0
    ).toFixed(1)}%) over the last ${sum.window_hours || this._historyHours} hours.
            </div>
          </div>

          <div style="display:flex;gap:8px;align-items:center;">
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
                      Number(this._historyHours) === w.h ? "active" : ""
                    }" data-history-hours="${w.h}" style="padding:5px 10px;">${w.label}</button>`
                )
                .join("")}
            </div>
            <button class="btn btn-sm" id="btn-jump-to-replay">What-If Simulator</button>
          </div>
        </div>

        <div style="background:var(--ha-subtle);border:1px solid var(--ha-divider);border-radius:10px;padding:12px;margin-bottom:16px;">
          <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:160px;display:block;">
            <line x1="0" y1="${threshY.toFixed(1)}" x2="${W}" y2="${threshY.toFixed(
      1
    )}" stroke="#d97706" stroke-width="1.2" stroke-dasharray="5,4" />
            <path d="${areaPath}" fill="rgba(2, 132, 199, 0.12)" />
            <path d="${linePath}" fill="none" stroke="#0284c7" stroke-width="2" />
          </svg>
        </div>

        <div class="setting-label" style="margin-bottom:8px;">Sensor Activity Timeline</div>
        <div class="list-divider">
          ${swimlanes
            .map((lane) => {
              const segsHtml = (lane.segments || [])
                .map(
                  (seg) =>
                    `<div style="position:absolute;top:2px;bottom:2px;left:${seg.start_pct}%;width:${seg.width_pct}%;background:var(--ha-primary);border-radius:3px;"></div>`
                )
                .join("");
              return `
                <div style="display:grid;grid-template-columns:220px 1fr 80px;gap:12px;align-items:center;padding:8px 0;border-bottom:1px solid var(--ha-divider);font-size:13px;">
                  <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${this._escape(
                    lane.label
                  )}</div>
                  <div style="position:relative;height:14px;background:var(--ha-subtle);border:1px solid var(--ha-divider);border-radius:4px;overflow:hidden;">${segsHtml}</div>
                  <div style="text-align:right;color:var(--ha-muted);font-size:12px;">${Number(
                    lane.active_minutes || 0
                  ).toFixed(0)}m</div>
                </div>`;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  _renderReplayPane(selRoom, presets) {
    if (!selRoom) {
      return `<div class="ha-card">Select a room to run the What-If Replay Simulator.</div>`;
    }
    const cand = this._replayCandidate || this._draftConfig || {};
    const rep = this._replayData;
    const candPriorPct = Math.round(Number(cand.bayesian_prior ?? 0.2) * 100);
    const candThreshPct = Math.round(Number(cand.bayesian_threshold ?? 0.75) * 100);

    if (!rep || rep.entry_id !== selRoom.entry_id) {
      return `<div class="ha-card">Simulating historical replay for <strong>${this._escape(
        selRoom.room_name
      )}</strong>...</div>`;
    }

    const baseRes = rep.baseline || {};
    const candRes = rep.candidate || {};
    const divergences = rep.divergence_windows || [];
    const W = 900;
    const H = 170;
    const basePaths = this._buildStepSvgPaths(baseRes.series || [], W, H);
    const candPaths = this._buildStepSvgPaths(candRes.series || [], W, H);

    return `
      <div class="ha-card">
        <div class="card-head" style="flex-wrap:wrap;">
          <div>
            <h2 class="card-title" style="font-size:18px;">${this._escape(
              selRoom.room_name
            )} — What-If Replay Simulator (${this._historyHours}h)</h2>
            <div class="card-desc">
              Test different timeout or threshold settings against recorded sensor history before saving.
            </div>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-sm" id="btn-back-to-stats">Back to Activity History</button>
            <button class="btn btn-sm" id="btn-replay-reset">Reset</button>
            <button class="btn btn-primary btn-sm" id="btn-replay-apply">Apply to Room</button>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:12px;margin-bottom:16px;">
          <div>
            <div class="setting-label" style="font-size:12.5px;">Candidate Prior: ${candPriorPct}%</div>
            <input type="range" min="5" max="50" step="1" id="rep-prior-slider" value="${candPriorPct}" style="width:100%;" />
          </div>
          <div>
            <div class="setting-label" style="font-size:12.5px;">Candidate Threshold: ${candThreshPct}%</div>
            <input type="range" min="50" max="95" step="1" id="rep-thresh-slider" value="${candThreshPct}" style="width:100%;" />
          </div>
          <div>
            <div class="setting-label" style="font-size:12.5px;">Clear Delay (sec)</div>
            <input type="number" class="input" id="rep-inactivity" value="${Number(
              cand.inactivity_timeout ?? 180
            )}" />
          </div>
        </div>

        <div style="background:var(--ha-subtle);border:1px solid var(--ha-divider);border-radius:10px;padding:12px;margin-bottom:14px;">
          <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:170px;display:block;">
            <path d="${basePaths.linePath}" fill="none" stroke="#94a3b8" stroke-width="1.6" stroke-dasharray="4,3" />
            <path d="${candPaths.linePath}" fill="none" stroke="#0284c7" stroke-width="2.2" />
          </svg>
        </div>

        <div style="font-size:13px;color:var(--ha-muted);">
          ${divergences.length} differences between current settings and candidate settings over the last ${this._historyHours} hours.
        </div>
      </div>
    `;
  }

  _bindEvents() {
    const root = this.shadowRoot;
    const presets = (this._overview && this._overview.presets) || {};

    root.querySelectorAll(".nav-tab[data-studio-view]").forEach((el) => {
      el.addEventListener("click", () => {
        const v = el.getAttribute("data-studio-view");
        this._studioView = v;
        if (v === "statistics") {
          this.loadStatistics();
        } else if (v === "replay") {
          if (!this._replayCandidate && this._draftConfig) {
            this._replayCandidate = JSON.parse(JSON.stringify(this._draftConfig));
          }
          this.runReplay();
        } else if (v === "floorplan") {
          if (!this._floorplan) {
            this.loadFloorplan();
          } else {
            this.render();
          }
        } else {
          this.render();
        }
      });
    });

    // Advanced drawer toggle & tabs
    root.querySelector("#btn-toggle-advanced")?.addEventListener("click", () => {
      this._showAdvanced = !this._showAdvanced;
      this.render();
    });
    root.querySelectorAll(".sub-tab[data-adv-tab]").forEach((el) => {
      el.addEventListener("click", () => {
        this._advTab = el.getAttribute("data-adv-tab") || "tuning";
        this.render();
      });
    });

    // Simple Sensor Role selector & Add Sensor
    root.querySelectorAll(".obs-role-simple").forEach((el) => {
      el.addEventListener("change", () => {
        const idx = Number(el.getAttribute("data-idx"));
        const obs = this._draftConfig?.bayesian_observations?.[idx];
        if (!obs) return;
        this._applyFriendlyRoleGroup(obs, el.value, presets);
        this._dirty = true;
        this.refreshPreview();
      });
    });

    root.querySelector("#btn-simple-add-obs")?.addEventListener("click", () => {
      const entityInput = root.querySelector("#simple-add-obs-entity");
      const roleSelect = root.querySelector("#simple-add-obs-role");
      const eid = entityInput?.value?.trim() || "";
      if (!eid) {
        this.showToast("Select a sensor entity to add", "info");
        return;
      }
      const entities = (this._overview && this._overview.entities) || [];
      const found = entities.find((e) => e.entity_id === eid);
      const newObs = {
        entity_id: eid,
        label: found?.name || eid,
        operator: "equals",
        state: "on",
      };
      this._applyFriendlyRoleGroup(newObs, roleSelect?.value || "shared", presets);
      this._draftConfig.bayesian_observations.push(newObs);
      this._dirty = true;
      this.refreshPreview();
    });

    // Bounded Door Toggle
    root.querySelector("#cfg-bounded-toggle")?.addEventListener("change", (e) => {
      this._draftConfig.mode = e.target.checked ? "bounded" : "open";
      if (!e.target.checked) {
        this._draftConfig.boundary_entities = [];
      }
      this._dirty = true;
      this.refreshPreview();
    });

    // Connected room dropdown auto-add on select
    root.querySelector("#add-connected-room-input")?.addEventListener("change", (e) => {
      const val = e.target.value?.trim();
      if (!val) return;
      if (!this._draftConfig.connected_rooms) this._draftConfig.connected_rooms = [];
      if (!this._draftConfig.connected_rooms.includes(val)) {
        this._draftConfig.connected_rooms.push(val);
        this._dirty = true;
        this.refreshPreview();
      }
    });

    root.querySelectorAll(".del-connected-room").forEach((el) => {
      el.addEventListener("click", () => {
        const idx = Number(el.getAttribute("data-idx"));
        if (Array.isArray(this._draftConfig.connected_rooms)) {
          this._draftConfig.connected_rooms.splice(idx, 1);
          this._dirty = true;
          this.refreshPreview();
        }
      });
    });

    // Floorplan view events
    root.querySelectorAll(".seg-btn[data-floor-id]").forEach((el) => {
      el.addEventListener("click", () => {
        this._selectedFloorId = el.getAttribute("data-floor-id") || "main";
        this._selectedCamEntity = null;
        this.render();
      });
    });
    root.querySelector("#btn-toggle-fp-inspector")?.addEventListener("click", () => {
      this._showFloorplanInspector = !this._showFloorplanInspector;
      this.render();
    });
    root.querySelector("#btn-toggle-fp-notes")?.addEventListener("click", () => {
      this._showFloorplanNotes = !this._showFloorplanNotes;
      this.render();
    });
    root.querySelector("#btn-fp-save")?.addEventListener("click", () =>
      this.saveOrCompileFloorplan("save")
    );
    root.querySelector("#btn-fp-reset")?.addEventListener("click", () =>
      this.saveOrCompileFloorplan("reset")
    );
    root.querySelector("#btn-fp-compile")?.addEventListener("click", () =>
      this.saveOrCompileFloorplan("compile_and_apply")
    );
    root.querySelector("#fp-cam-select")?.addEventListener("change", (e) => {
      this._selectedCamEntity = e.target.value;
      this.render();
    });
    root.querySelectorAll(".fp-cam-group").forEach((el) => {
      el.addEventListener("click", () => {
        this._selectedCamEntity = el.getAttribute("data-cam-entity");
        this.render();
      });
    });
    root.querySelectorAll(".fp-room-box").forEach((el) => {
      el.addEventListener("click", () => {
        const rname = el.getAttribute("data-room-name");
        const room = (this._overview?.rooms || []).find((r) => r.room_name === rname);
        if (room) {
          this._selectRoomObject(room, true);
        }
      });
    });
    root.querySelectorAll(".fp-cam-field").forEach((el) => {
      el.addEventListener("change", () => {
        const key = el.getAttribute("data-key");
        const cams = this._floorplan?.cameras || [];
        const cam = cams.find((c) => (c.id || c.camera_entity) === this._selectedCamEntity);
        if (!cam || !key) return;
        cam[key] = Number(el.value);
        this.render();
      });
    });
    root.querySelectorAll(".fp-box-field").forEach((el) => {
      el.addEventListener("change", () => {
        const rname = el.getAttribute("data-room");
        const key = el.getAttribute("data-key");
        const boxes = this._floorplan?.rooms || [];
        const box = boxes.find((b) => (b.name || b.room_name) === rname);
        if (!box || !key) return;
        box[key] = Number(el.value);
        this.render();
      });
    });
    root.querySelector("#btn-open-floorplan-tab")?.addEventListener("click", () => {
      this._studioView = "floorplan";
      this.render();
    });

    root.querySelectorAll(".seg-btn[data-history-hours]").forEach((el) => {
      el.addEventListener("click", () => {
        this._historyHours = Number(el.getAttribute("data-history-hours") || 6);
        if (this._studioView === "statistics") {
          this.loadStatistics();
        } else if (this._studioView === "replay") {
          this.runReplay();
        }
      });
    });

    root.querySelector("#btn-jump-to-replay")?.addEventListener("click", () => {
      this._studioView = "replay";
      this._replayCandidate = JSON.parse(JSON.stringify(this._draftConfig || {}));
      this.runReplay();
    });
    root.querySelector("#btn-back-to-stats")?.addEventListener("click", () => {
      this._studioView = "statistics";
      this.loadStatistics();
    });

    // Replay Simulator events
    root.querySelector("#btn-replay-reset")?.addEventListener("click", () => {
      this._replayCandidate = JSON.parse(JSON.stringify(this._draftConfig || {}));
      this.runReplay();
    });
    root.querySelector("#btn-replay-apply")?.addEventListener("click", () =>
      this.applyReplayCandidate()
    );
    root.querySelector("#rep-prior-slider")?.addEventListener("change", (e) => {
      this._replayCandidate.bayesian_prior = Number(e.target.value) / 100.0;
      this.runReplay();
    });
    root.querySelector("#rep-thresh-slider")?.addEventListener("change", (e) => {
      this._replayCandidate.bayesian_threshold = Number(e.target.value) / 100.0;
      this.runReplay();
    });
    root.querySelector("#rep-inactivity")?.addEventListener("change", (e) => {
      this._replayCandidate.inactivity_timeout = Number(e.target.value);
      this.runReplay();
    });

    root.querySelector("#btn-refresh-overview")?.addEventListener("click", () => {
      this.loadOverview(true);
    });
    root.querySelector("#btn-open-global")?.addEventListener("click", () => {
      this._showGlobalModal = true;
      this.render();
    });
    root.querySelector("#btn-close-global")?.addEventListener("click", () => {
      this._showGlobalModal = false;
      this.render();
    });
    root.querySelector("#btn-cancel-global")?.addEventListener("click", () => {
      this._showGlobalModal = false;
      this.render();
    });
    root.querySelector("#btn-save-global")?.addEventListener("click", () => {
      this._globalDraft = {
        ...this._globalDraft,
        llm_provider_type: root.querySelector("#gl-provider")?.value || "vision_api",
        llm_api_url: root.querySelector("#gl-api-url")?.value || "",
        llm_model: root.querySelector("#gl-model")?.value || "",
        llm_agent_id: root.querySelector("#gl-agent-id")?.value || "",
        ble_trackers: root.querySelector("#gl-ble")?.value || "",
      };
      this.saveGlobalSettings();
    });

    root.querySelector("#room-search-input")?.addEventListener("input", (e) => {
      this._roomSearch = e.target.value;
      this.render();
    });
    root.querySelectorAll(".seg-btn[data-filter]").forEach((el) => {
      el.addEventListener("click", () => {
        this._roomFilter = el.getAttribute("data-filter");
        this.render();
      });
    });
    root.querySelectorAll(".room-row[data-room-id]").forEach((el) => {
      el.addEventListener("click", () => {
        const rid = el.getAttribute("data-room-id");
        const room = (this._overview?.rooms || []).find((r) => r.entry_id === rid);
        if (room) this._selectRoomObject(room, true);
      });
    });

    // Room Header & Core Controls
    root.querySelector("#btn-save-room")?.addEventListener("click", () => this.saveCurrentRoom());
    root.querySelector("#btn-room-refresh")?.addEventListener("click", () =>
      this.runRoomAction("force_refresh")
    );
    root.querySelector("#btn-room-verify")?.addEventListener("click", () =>
      this.runRoomAction("verify_presence")
    );
    root.querySelector("#btn-room-override")?.addEventListener("click", () =>
      this.runRoomAction("set_override")
    );

    root.querySelector("#cfg-area-id")?.addEventListener("change", (e) => {
      this._draftConfig.area_id = e.target.value || null;
      this._dirty = true;
      this.render();
    });
    root.querySelector("#cfg-camera-entity")?.addEventListener("change", (e) => {
      this._draftConfig.camera_entity = e.target.value;
      this._dirty = true;
    });
    root.querySelector("#cfg-prior-slider")?.addEventListener("change", (e) => {
      this._draftConfig.bayesian_prior = Number(e.target.value) / 100.0;
      this._dirty = true;
      this.refreshPreview();
    });
    root.querySelector("#cfg-thresh-slider")?.addEventListener("change", (e) => {
      this._draftConfig.bayesian_threshold = Number(e.target.value) / 100.0;
      this._dirty = true;
      this.refreshPreview();
    });
    root.querySelector("#cfg-inactivity-timeout")?.addEventListener("change", (e) => {
      this._draftConfig.inactivity_timeout = Number(e.target.value);
      this._dirty = true;
      this.render();
    });

    root.querySelector("#btn-add-ble")?.addEventListener("click", () => {
      const rname = this._draftConfig.room_name || "Room";
      const trackers =
        (this._overview &&
          this._overview.global_settings &&
          this._overview.global_settings.ble_trackers) || [
          "sensor.steve_s_s25_ble_area",
          "sensor.tab_s10_lite_ble_area",
        ];
      const obs = this._draftConfig.bayesian_observations || [];
      trackers.forEach((eid, idx) => {
        if (!obs.some((o) => o.entity_id === eid)) {
          obs.push({
            entity_id: eid,
            label: idx === 0 ? `Primary Phone BLE (${rname})` : `Secondary BLE (${rname})`,
            preset: idx === 0 ? "moderate" : "supporting",
            prob_given_true: idx === 0 ? 0.72 : 0.35,
            prob_given_false: idx === 0 ? 0.12 : 0.22,
            operator: "equals",
            state: rname,
          });
        }
      });
      this._draftConfig.bayesian_observations = obs;
      this._dirty = true;
      this.refreshPreview();
    });

    root.querySelector("#btn-sync-triggers")?.addEventListener("click", () => {
      const obs = this._draftConfig.bayesian_observations || [];
      const triggers = [];
      for (const o of obs) {
        const preset = o.preset || o.weight || "moderate";
        if (
          (preset === "decisive" || preset === "strong") &&
          o.entity_id &&
          o.entity_id.startsWith("binary_sensor.")
        ) {
          if (!triggers.includes(o.entity_id)) triggers.push(o.entity_id);
        }
      }
      this._draftConfig.trigger_entities = triggers;
      this._dirty = true;
      this.showToast(`Synced ${triggers.length} main sensors`, "info");
    });

    root.querySelectorAll(".obs-field").forEach((el) => {
      el.addEventListener("change", () => {
        const idx = Number(el.getAttribute("data-idx"));
        const key = el.getAttribute("data-key");
        const obs = this._draftConfig.bayesian_observations[idx];
        if (!obs) return;
        obs[key] = el.value;
        this._dirty = true;
        this.refreshPreview();
      });
    });

    root.querySelectorAll(".obs-preset").forEach((el) => {
      el.addEventListener("change", () => {
        const idx = Number(el.getAttribute("data-idx"));
        const obs = this._draftConfig.bayesian_observations[idx];
        if (!obs) return;
        const p = el.value;
        obs.preset = p;
        if (presets[p] && p !== "custom") {
          obs.prob_given_true = presets[p].prob_given_true;
          obs.prob_given_false = presets[p].prob_given_false;
        }
        this._dirty = true;
        this.refreshPreview();
      });
    });

    root.querySelectorAll(".obs-prob").forEach((el) => {
      el.addEventListener("change", () => {
        const idx = Number(el.getAttribute("data-idx"));
        const key = el.getAttribute("data-key");
        const obs = this._draftConfig.bayesian_observations[idx];
        if (!obs) return;
        obs[key] = Number(el.value);
        obs.preset = "custom";
        this._dirty = true;
        this.refreshPreview();
      });
    });

    root.querySelectorAll(".obs-del").forEach((el) => {
      el.addEventListener("click", () => {
        const idx = Number(el.getAttribute("data-idx"));
        this._draftConfig.bayesian_observations.splice(idx, 1);
        this._dirty = true;
        this.refreshPreview();
      });
    });

    // Boundaries & Sustaining Conditions
    root.querySelector("#btn-add-boundary")?.addEventListener("click", () => {
      const val = root.querySelector("#add-boundary-input")?.value?.trim();
      if (val && !this._draftConfig.boundary_entities.includes(val)) {
        this._draftConfig.boundary_entities.push(val);
        this._dirty = true;
        this.refreshPreview();
      }
    });
    root.querySelectorAll(".del-boundary").forEach((el) => {
      el.addEventListener("click", () => {
        const idx = Number(el.getAttribute("data-idx"));
        this._draftConfig.boundary_entities.splice(idx, 1);
        this._dirty = true;
        this.refreshPreview();
      });
    });

    root.querySelector("#btn-add-condition")?.addEventListener("click", () => {
      this._draftConfig.sustaining_conditions.push({
        entity_id: "",
        label: "Keep Occupied Rule",
        operator: "equals",
        state: "playing",
      });
      this._dirty = true;
      this.render();
    });
    root.querySelectorAll(".cond-field").forEach((el) => {
      el.addEventListener("change", () => {
        const idx = Number(el.getAttribute("data-idx"));
        const key = el.getAttribute("data-key");
        const cond = this._draftConfig.sustaining_conditions[idx];
        if (!cond) return;
        cond[key] = el.value;
        this._dirty = true;
        this.refreshPreview();
      });
    });
    root.querySelectorAll(".cond-del").forEach((el) => {
      el.addEventListener("click", () => {
        const idx = Number(el.getAttribute("data-idx"));
        this._draftConfig.sustaining_conditions.splice(idx, 1);
        this._dirty = true;
        this.refreshPreview();
      });
    });

    // Advanced YAML & AI sub-tabs
    root.querySelectorAll("[data-rtab]").forEach((el) => {
      el.addEventListener("click", () => {
        this._rightTab = el.getAttribute("data-rtab");
        this.render();
      });
    });
    root.querySelector("#yaml-draft-editor")?.addEventListener("input", (e) => {
      this._yamlDraft = e.target.value;
    });
    root.querySelector("#btn-apply-yaml")?.addEventListener("click", () => this.applyYamlDraft());
    root.querySelector("#nl-prompt-input")?.addEventListener("input", (e) => {
      this._nlPrompt = e.target.value;
    });
    root.querySelector("#btn-nl-to-yaml")?.addEventListener("click", () =>
      this.runTranslation("nl_to_yaml")
    );
    root.querySelector("#btn-yaml-to-nl")?.addEventListener("click", () =>
      this.runTranslation("yaml_to_nl")
    );
    root.querySelectorAll(".btn-rollback").forEach((el) => {
      el.addEventListener("click", () => {
        const idx = Number(el.getAttribute("data-rev-idx"));
        this.rollbackRevision(idx);
      });
    });
  }
}

if (!customElements.get("presence-detection-designer-panel")) {
  customElements.define("presence-detection-designer-panel", PresenceDetectionDesignerPanel);
}
