/**
 * Presence Detection Designer — Native Home Assistant Visual Design Studio & .storage Panel
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
    this._roomFilter = "all";
    this._rightTab = "yaml"; // "yaml" | "ha_yaml" | "nl" | "guide"
    this._nlPrompt = "";
    this._nlOutput = "";
    this._yamlDraft = "";
    this._revisionNote = "";
    this._showGlobalModal = false;
    this._globalDraft = null;
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
    }, 4000);
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
        ? "#ef4444"
        : this._toast.type === "success"
        ? "#10b981"
        : "#3b82f6";
    el.innerHTML = `<div style="background:${bg};color:#fff;padding:10px 18px;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.35);font-weight:600;font-size:13px;">${this._escape(
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
      this.showToast(`Failed to load overview: ${err.message}`, "error");
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
    if (renderAfter) this.render();
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
      const res = await this._apiCall(
        "POST",
        `/api/presence_detection_designer/room/${this._selectedRoomId}`,
        {
          config: this._draftConfig,
          note: this._revisionNote.trim() || "Updated via Visual Design Studio",
        }
      );
      if (res && res.room && this._overview && Array.isArray(this._overview.rooms)) {
        const idx = this._overview.rooms.findIndex((r) => r.entry_id === this._selectedRoomId);
        if (idx >= 0) this._overview.rooms[idx] = res.room;
        this._selectRoomObject(res.room, true);
      }
      this.showToast(`Saved ${this._draftConfig.room_name} to .storage & hot-updated coordinator`, "success");
    } catch (err) {
      this.showToast(`Save failed: ${err.message}`, "error");
    }
  }

  async applyYamlDraft() {
    if (!this._selectedRoomId || !this._yamlDraft.trim()) return;
    try {
      const res = await this._apiCall(
        "POST",
        "/api/presence_detection_designer/preview_bayesian",
        { yaml_config: this._yamlDraft }
      );
      const saved = await this._apiCall(
        "POST",
        `/api/presence_detection_designer/room/${this._selectedRoomId}`,
        {
          yaml_config: this._yamlDraft,
          note: "Updated via Designer YAML editor",
        }
      );
      if (saved && saved.room) {
        const idx = this._overview.rooms.findIndex((r) => r.entry_id === this._selectedRoomId);
        if (idx >= 0) this._overview.rooms[idx] = saved.room;
        this._selectRoomObject(saved.room, true);
      } else if (res) {
        this._previewData = res;
        this.render();
      }
      this.showToast("Applied YAML configuration to room", "success");
    } catch (err) {
      this.showToast(`YAML parse error: ${err.message}`, "error");
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
        this.showToast("Restored room configuration from .storage revision", "success");
      }
    } catch (err) {
      this.showToast(`Rollback failed: ${err.message}`, "error");
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
      this.showToast(`Executed ${action}`, "success");
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
        this.showToast("Translated natural language into Bayesian rules (Review & Save)", "success");
      } else if (res) {
        this._nlOutput = res.natural_language || res.rule_guide || "";
        this.render();
        this.showToast("Generated plain-English explanation", "success");
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
      this.showToast("Saved shared global settings to .storage", "success");
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

  _syncTriggersFromStrongObservations() {
    if (!this._draftConfig) return;
    const obs = this._draftConfig.bayesian_observations || [];
    const triggers = [];
    for (const o of obs) {
      const preset = o.preset || o.weight || "moderate";
      if ((preset === "decisive" || preset === "strong") && o.entity_id && o.entity_id.startsWith("binary_sensor.")) {
        if (!triggers.includes(o.entity_id)) triggers.push(o.entity_id);
      }
    }
    this._draftConfig.trigger_entities = triggers;
    this._dirty = true;
    this.render();
    this.showToast(`Synced ${triggers.length} decisive/strong binary sensors to Instant Triggers`, "info");
  }

  _addHouseholdBleTrackers() {
    if (!this._draftConfig) return;
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
          label: idx === 0 ? `Primary BLE in ${rname}` : `Secondary BLE in ${rname}`,
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
  }

  render() {
    const rooms = (this._overview && this._overview.rooms) || [];
    const areas = (this._overview && this._overview.areas) || [];
    const entities = (this._overview && this._overview.entities) || [];
    const presets = (this._overview && this._overview.presets) || {};
    const occupiedCount = rooms.filter((r) => r.is_present).length;

    const filteredRooms = rooms.filter((r) => {
      if (this._roomFilter === "occupied" && !r.is_present) return false;
      if (this._roomFilter === "vacant" && r.is_present) return false;
      if (this._roomFilter === "bounded" && r.mode !== "bounded") return false;
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
    const comb = prev.combinatorics || {};
    const activeMap = {};
    (prev.active_observations || []).forEach((o) => {
      activeMap[`${o.entity_id}|${o.label}`] = o;
      activeMap[o.entity_id] = o;
    });
    const inactiveMap = {};
    (prev.inactive_observations || []).forEach((o) => {
      inactiveMap[`${o.entity_id}|${o.label}`] = o;
      inactiveMap[o.entity_id] = o;
    });

    const priorPct = Math.round(Number(cfg.bayesian_prior ?? 0.2) * 100);
    const threshPct = Math.round(Number(cfg.bayesian_threshold ?? 0.75) * 100);
    const livePct = Number(prev.probability_pct ?? (selRoom ? selRoom.bayesian_probability_pct : 20)).toFixed(1);
    const isOccupied = selRoom ? selRoom.is_present : false;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          min-height: 100vh;
          background: var(--primary-background-color, #0b1120);
          color: var(--primary-text-color, #f1f5f9);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif;
          box-sizing: border-box;
        }
        * { box-sizing: border-box; }
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 22px;
          background: #111827;
          border-bottom: 1px solid #1e293b;
          position: sticky;
          top: 0;
          z-index: 20;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .brand-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #3b82f6, #10b981);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          color: #fff;
          font-size: 16px;
        }
        .brand h1 {
          margin: 0;
          font-size: 17px;
          font-weight: 700;
          color: #f8fafc;
        }
        .brand-sub {
          font-size: 12px;
          color: #94a3b8;
        }
        .top-pills {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .stat-pill {
          background: #1e293b;
          border: 1px solid #334155;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 12px;
          color: #cbd5e1;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .stat-pill strong { color: #38bdf8; }
        .btn {
          background: #1e293b;
          color: #e2e8f0;
          border: 1px solid #334155;
          padding: 7px 13px;
          border-radius: 7px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn:hover { background: #334155; border-color: #475569; }
        .btn-primary {
          background: #2563eb;
          border-color: #3b82f6;
          color: #fff;
        }
        .btn-primary:hover { background: #1d4ed8; }
        .btn-success {
          background: #059669;
          border-color: #10b981;
          color: #fff;
        }
        .btn-success:hover { background: #047857; }
        .btn-sm { padding: 4px 9px; font-size: 11px; }

        .studio-grid {
          display: grid;
          grid-template-columns: 280px 1fr 410px;
          gap: 16px;
          padding: 16px 20px;
          align-items: start;
        }
        @media (max-width: 1360px) {
          .studio-grid { grid-template-columns: 250px 1fr; }
          .col-right { grid-column: 1 / -1; }
        }
        @media (max-width: 900px) {
          .studio-grid { grid-template-columns: 1fr; }
        }

        .panel-card {
          background: #111827;
          border: 1px solid #1e293b;
          border-radius: 12px;
          padding: 15px;
          margin-bottom: 14px;
        }
        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          gap: 8px;
        }
        .card-title {
          font-size: 14px;
          font-weight: 700;
          color: #f8fafc;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .card-subtitle {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 2px;
        }

        /* Left Sidebar Room List */
        .search-input, .text-input, .select-input, .num-input {
          background: #0b1120;
          color: #f1f5f9;
          border: 1px solid #334155;
          border-radius: 7px;
          padding: 7px 10px;
          font-size: 12px;
          width: 100%;
        }
        .search-input:focus, .text-input:focus, .select-input:focus, .num-input:focus {
          outline: none;
          border-color: #38bdf8;
        }
        .filter-tabs {
          display: flex;
          gap: 4px;
          margin: 8px 0 12px;
        }
        .filter-tab {
          flex: 1;
          text-align: center;
          padding: 5px 4px;
          font-size: 11px;
          font-weight: 600;
          border-radius: 6px;
          cursor: pointer;
          background: #0b1120;
          color: #94a3b8;
          border: 1px solid #1e293b;
        }
        .filter-tab.active {
          background: #1e3a8a;
          color: #93c5fd;
          border-color: #3b82f6;
        }
        .room-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: calc(100vh - 210px);
          overflow-y: auto;
          padding-right: 2px;
        }
        .room-item {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 10px;
          padding: 10px 12px;
          cursor: pointer;
          transition: all 0.14s;
        }
        .room-item:hover { border-color: #334155; background: #162033; }
        .room-item.selected {
          border-color: #38bdf8;
          background: #172554;
          box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.3);
        }
        .room-item-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          margin-bottom: 6px;
        }
        .room-item-name {
          font-weight: 700;
          font-size: 13px;
          color: #f8fafc;
        }
        .occ-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 999px;
          text-transform: uppercase;
        }
        .occ-badge.on {
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.45);
        }
        .occ-badge.off {
          background: rgba(100, 116, 139, 0.18);
          color: #94a3b8;
          border: 1px solid rgba(100, 116, 139, 0.3);
        }
        .prob-bar-bg {
          height: 6px;
          background: #090d16;
          border-radius: 4px;
          position: relative;
          overflow: hidden;
          margin-bottom: 5px;
        }
        .prob-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.25s;
        }
        .room-item-meta {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #94a3b8;
        }

        /* Center Builder */
        .form-grid-4 {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        .form-grid-5 {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
        }
        .field-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
          margin-bottom: 4px;
        }
        .obs-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        .obs-table th {
          text-align: left;
          font-size: 11px;
          color: #94a3b8;
          padding: 6px 6px;
          border-bottom: 1px solid #1e293b;
        }
        .obs-table td {
          padding: 6px 5px;
          border-bottom: 1px solid #1e293b;
          vertical-align: middle;
        }
        .obs-status-pill {
          display: inline-block;
          padding: 3px 7px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
        }
        .obs-status-pill.active {
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.4);
        }
        .obs-status-pill.idle {
          background: #0b1120;
          color: #64748b;
          border: 1px solid #1e293b;
        }
        .chip-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 8px;
        }
        .entity-chip {
          background: #1e293b;
          border: 1px solid #334155;
          color: #e2e8f0;
          border-radius: 6px;
          padding: 4px 8px;
          font-size: 11px;
          font-family: monospace;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .entity-chip button {
          background: none;
          border: none;
          color: #f87171;
          cursor: pointer;
          font-weight: 700;
          padding: 0;
        }

        /* Right Column: Gauge, Combinatorics, YAML & Revisions */
        .gauge-box {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px;
          background: #0b1120;
          border: 1px solid #1e293b;
          border-radius: 10px;
          margin-bottom: 12px;
        }
        .gauge-num {
          font-size: 28px;
          font-weight: 800;
          line-height: 1;
        }
        .comb-section {
          margin-top: 10px;
        }
        .comb-title {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 6px;
        }
        .comb-pill {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #0b1120;
          border: 1px solid #1e293b;
          border-radius: 7px;
          padding: 6px 9px;
          margin-bottom: 5px;
          font-size: 11px;
        }
        .comb-pill.trigger { border-left: 3px solid #10b981; }
        .comb-pill.pair { border-left: 3px solid #38bdf8; }
        .comb-pill.safe { border-left: 3px solid #64748b; color: #94a3b8; }

        .code-area {
          width: 100%;
          min-height: 230px;
          background: #090d16;
          color: #e2e8f0;
          border: 1px solid #334155;
          border-radius: 8px;
          padding: 10px;
          font-family: "JetBrains Mono", Consolas, monospace;
          font-size: 11.5px;
          line-height: 1.45;
          resize: vertical;
        }
        .rev-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 7px 9px;
          background: #0b1120;
          border: 1px solid #1e293b;
          border-radius: 7px;
          margin-bottom: 6px;
          font-size: 11px;
        }
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }
        .modal-card {
          background: #111827;
          border: 1px solid #334155;
          border-radius: 12px;
          width: 520px;
          max-width: 94vw;
          padding: 20px;
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

      <div class="topbar">
        <div class="brand">
          <div class="brand-icon">PDD</div>
          <div>
            <h1>Presence Detection Designer</h1>
            <div class="brand-sub">Visual Bayesian Fusion Studio &amp; Native <code>.storage</code> Manager (v1.2.0)</div>
          </div>
        </div>
        <div class="top-pills">
          <div class="stat-pill">Occupied: <strong>${occupiedCount} / ${rooms.length}</strong></div>
          <div class="stat-pill">Storage: <strong>.storage/presence_detection_designer</strong></div>
          <button class="btn" id="btn-open-global">⚙ Global .storage Settings</button>
          <button class="btn" id="btn-refresh-overview">↻ Refresh States</button>
        </div>
      </div>

      <div class="studio-grid">
        <!-- LEFT COLUMN: 14-Room Navigator -->
        <div class="col-left">
          <div class="panel-card">
            <div class="card-header">
              <h2 class="card-title">Rooms (${filteredRooms.length})</h2>
            </div>
            <input
              type="text"
              class="search-input"
              id="room-search-input"
              placeholder="Filter rooms..."
              value="${this._escape(this._roomSearch)}"
            />
            <div class="filter-tabs">
              ${["all", "occupied", "vacant", "bounded"]
                .map(
                  (f) => `
                <div class="filter-tab ${this._roomFilter === f ? "active" : ""}" data-filter="${f}">
                  ${f.toUpperCase()}
                </div>`
                )
                .join("")}
            </div>
            <div class="room-list">
              ${filteredRooms
                .map((r) => {
                  const pct = Number(r.bayesian_probability_pct || 0);
                  const thresh = Number(r.bayesian_threshold_pct || 75);
                  const barColor = r.is_present
                    ? "#10b981"
                    : pct >= thresh * 0.75
                    ? "#f59e0b"
                    : "#3b82f6";
                  return `
                  <div class="room-item ${
                    r.entry_id === this._selectedRoomId ? "selected" : ""
                  }" data-room-id="${this._escape(r.entry_id)}">
                    <div class="room-item-top">
                      <span class="room-item-name">${this._escape(r.room_name)}</span>
                      <span class="occ-badge ${r.is_present ? "on" : "off"}">
                        ${r.is_present ? "Occupied" : "Vacant"}
                      </span>
                    </div>
                    <div class="prob-bar-bg">
                      <div class="prob-bar-fill" style="width:${Math.min(
                        100,
                        pct
                      )}%;background:${barColor};"></div>
                    </div>
                    <div class="room-item-meta">
                      <span><strong>${pct.toFixed(1)}%</strong> / ${thresh.toFixed(0)}%</span>
                      <span>${this._escape(r.box_state)} · ${(r.active_observations || []).length} active</span>
                    </div>
                  </div>`;
                })
                .join("")}
            </div>
          </div>
        </div>

        <!-- CENTER COLUMN: Interactive Room & Bayesian Weight Builder -->
        <div class="col-center">
          ${
            !selRoom
              ? `<div class="panel-card">Select a room to configure.</div>`
              : `
            <!-- Header & Save Bar -->
            <div class="panel-card">
              <div class="card-header" style="flex-wrap:wrap;">
                <div>
                  <h2 class="card-title" style="font-size:18px;">
                    ${this._escape(cfg.room_name || selRoom.room_name)}
                    ${
                      this._dirty
                        ? `<span style="background:#f59e0b;color:#000;font-size:10px;padding:2px 7px;border-radius:999px;">Unsaved Changes</span>`
                        : `<span style="background:#1e293b;color:#94a3b8;font-size:10px;padding:2px 7px;border-radius:999px;">Synced in .storage</span>`
                    }
                  </h2>
                  <div class="card-subtitle">${this._escape(
                    selRoom.natural_language_explanation
                  )}</div>
                </div>
                <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                  <button class="btn btn-sm" id="btn-room-refresh">↻ Eval Now</button>
                  <button class="btn btn-sm" id="btn-room-verify">📷 Vision Check</button>
                  <button class="btn btn-sm" id="btn-room-override">
                    ${selRoom.override ? "🔓 Clear Override" : "🔒 Lock Override"}
                  </button>
                  <input
                    type="text"
                    class="text-input"
                    id="input-rev-note"
                    placeholder="Revision note (optional)..."
                    style="width:170px;"
                    value="${this._escape(this._revisionNote)}"
                  />
                  <button class="btn btn-success" id="btn-save-room">💾 Save to .storage</button>
                </div>
              </div>

              <div class="form-grid-4" style="margin-top:12px;">
                <div>
                  <label class="field-label">Room Name</label>
                  <input type="text" class="text-input" id="cfg-room-name" value="${this._escape(
                    cfg.room_name || ""
                  )}" />
                </div>
                <div>
                  <label class="field-label">Home Assistant Area</label>
                  <select class="select-input" id="cfg-area-id">
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
                  <label class="field-label">Perimeter Mode</label>
                  <select class="select-input" id="cfg-mode">
                    <option value="open" ${cfg.mode === "open" ? "selected" : ""}>Open Area (Timer-based)</option>
                    <option value="bounded" ${cfg.mode === "bounded" ? "selected" : ""}>Bounded (Wasp-in-a-Box Door Latch)</option>
                  </select>
                </div>
                <div>
                  <label class="field-label">Camera Entity (Vision AI)</label>
                  <input type="text" class="text-input" id="cfg-camera-entity" list="pdd-all-entities" value="${this._escape(
                    cfg.camera_entity || ""
                  )}" placeholder="camera.master_bedroom" />
                </div>
              </div>

              <div class="form-grid-5" style="margin-top:12px;">
                <div>
                  <label class="field-label">Baseline Prior: <strong style="color:#38bdf8;">${priorPct}%</strong></label>
                  <input type="range" min="5" max="50" step="1" id="cfg-prior-slider" value="${priorPct}" style="width:100%;" />
                </div>
                <div>
                  <label class="field-label">Occupied Threshold: <strong style="color:#10b981;">${threshPct}%</strong></label>
                  <input type="range" min="50" max="95" step="1" id="cfg-thresh-slider" value="${threshPct}" style="width:100%;" />
                </div>
                <div>
                  <label class="field-label">Inactivity Timeout (s)</label>
                  <input type="number" class="num-input" id="cfg-inactivity-timeout" value="${Number(
                    cfg.inactivity_timeout ?? 240
                  )}" />
                </div>
                <div>
                  <label class="field-label">Door Grace Timeout (s)</label>
                  <input type="number" class="num-input" id="cfg-grace-timeout" value="${Number(
                    cfg.grace_timeout ?? 60
                  )}" />
                </div>
                <div>
                  <label class="field-label">Vision Extend Timeout (s)</label>
                  <input type="number" class="num-input" id="cfg-extend-timeout" value="${Number(
                    cfg.extend_timeout ?? 300
                  )}" />
                </div>
              </div>
            </div>

            <!-- Bayesian Observations Table -->
            <div class="panel-card">
              <div class="card-header" style="flex-wrap:wrap;">
                <div>
                  <h3 class="card-title">Bayesian Sensor Observations (${
                    (cfg.bayesian_observations || []).length
                  })</h3>
                  <div class="card-subtitle">
                    Configure how each sensor shifts room probability from the ${priorPct}% baseline toward the ${threshPct}% threshold.
                  </div>
                </div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;">
                  <button class="btn btn-sm" id="btn-add-ble">+ Household BLE</button>
                  <button class="btn btn-sm" id="btn-sync-triggers">⚡ Sync Instant Triggers</button>
                  <button class="btn btn-primary btn-sm" id="btn-add-obs">+ Add Observation</button>
                </div>
              </div>

              <div style="overflow-x:auto;">
                <table class="obs-table">
                  <thead>
                    <tr>
                      <th>Live Status</th>
                      <th>Entity ID &amp; Label</th>
                      <th>Reliability Preset</th>
                      <th>P(E|Occ)</th>
                      <th>P(E|Vac)</th>
                      <th>Operator &amp; Target State</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    ${(cfg.bayesian_observations || [])
                      .map((obs, idx) => {
                        const key = `${obs.entity_id}|${obs.label}`;
                        const act = activeMap[key] || activeMap[obs.entity_id];
                        const presetVal = obs.preset || obs.weight || "moderate";
                        const pDefaults = presets[presetVal] || {
                          prob_given_true: 0.72,
                          prob_given_false: 0.12,
                        };
                        const pTrue = Number(obs.prob_given_true ?? pDefaults.prob_given_true);
                        const pFalse = Number(obs.prob_given_false ?? pDefaults.prob_given_false);
                        const p0 = Math.max(0.01, Math.min(0.99, Number(cfg.bayesian_prior ?? 0.2)));
                        const soloOdds = (p0 / (1 - p0)) * (Math.max(0.001, pTrue) / Math.max(0.001, pFalse));
                        const soloPct = ((soloOdds / (1 + soloOdds)) * 100).toFixed(1);
                        const deltaPct = act
                          ? Number(act.probability_delta_pct ?? act.contribution_pct ?? 0).toFixed(1)
                          : "0.0";
                        return `
                        <tr data-obs-idx="${idx}">
                          <td>
                            ${
                              act
                                ? `<span class="obs-status-pill active">ON (+${deltaPct}%)</span>`
                                : `<span class="obs-status-pill idle">idle (${soloPct}% solo)</span>`
                            }
                          </td>
                          <td style="min-width:210px;">
                            <input
                              type="text"
                              class="text-input obs-field"
                              data-idx="${idx}"
                              data-key="entity_id"
                              list="pdd-all-entities"
                              placeholder="binary_sensor.motion"
                              value="${this._escape(obs.entity_id || "")}"
                              style="margin-bottom:4px;font-family:monospace;font-size:11px;"
                            />
                            <input
                              type="text"
                              class="text-input obs-field"
                              data-idx="${idx}"
                              data-key="label"
                              placeholder="Friendly sensor label"
                              value="${this._escape(obs.label || "")}"
                            />
                          </td>
                          <td style="min-width:125px;">
                            <select class="select-input obs-preset" data-idx="${idx}">
                              ${["decisive", "strong", "moderate", "supporting", "custom"]
                                .map(
                                  (p) =>
                                    `<option value="${p}" ${
                                      presetVal === p ? "selected" : ""
                                    }>${p.toUpperCase()}</option>`
                                )
                                .join("")}
                            </select>
                          </td>
                          <td style="width:76px;">
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              max="0.99"
                              class="num-input obs-prob"
                              data-idx="${idx}"
                              data-key="prob_given_true"
                              value="${Number(pTrue).toFixed(2)}"
                            />
                          </td>
                          <td style="width:76px;">
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              max="0.99"
                              class="num-input obs-prob"
                              data-idx="${idx}"
                              data-key="prob_given_false"
                              value="${Number(pFalse).toFixed(2)}"
                            />
                          </td>
                          <td style="min-width:165px;">
                            <div style="display:flex;gap:4px;">
                              <select class="select-input obs-field" data-idx="${idx}" data-key="operator" style="width:82px;">
                                ${["equals", "in", "greater_than", "less_than", "not_equals"]
                                  .map(
                                    (op) =>
                                      `<option value="${op}" ${
                                        (obs.operator || "equals") === op ? "selected" : ""
                                      }>${op}</option>`
                                  )
                                  .join("")}
                              </select>
                              <input
                                type="text"
                                class="text-input obs-field"
                                data-idx="${idx}"
                                data-key="state"
                                value="${this._escape(obs.state ?? "on")}"
                                style="width:85px;"
                              />
                            </div>
                          </td>
                          <td>
                            <button class="btn btn-sm obs-del" data-idx="${idx}" style="color:#f87171;">✕</button>
                          </td>
                        </tr>`;
                      })
                      .join("")}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Wasp-in-a-Box Boundaries, Instant Triggers & Sustaining Conditions -->
            <div class="panel-card">
              <h3 class="card-title" style="margin-bottom:10px;">Wasp-in-a-Box Doors, Instant Triggers &amp; Sustaining Conditions</h3>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:12px;">
                <div>
                  <label class="field-label">Boundary Doors (Seal room when closed)</label>
                  <div class="chip-list">
                    ${(cfg.boundary_entities || [])
                      .map(
                        (eid, i) => `
                      <span class="entity-chip">${this._escape(eid)}
                        <button class="del-boundary" data-idx="${i}">×</button>
                      </span>`
                      )
                      .join("")}
                  </div>
                  <div style="display:flex;gap:6px;">
                    <input type="text" class="text-input" id="add-boundary-input" list="pdd-all-entities" placeholder="binary_sensor.room_door" />
                    <button class="btn btn-sm" id="btn-add-boundary">+ Add</button>
                  </div>
                </div>

                <div>
                  <label class="field-label">Instant Trigger Entities (Decisive/Strong sensors)</label>
                  <div class="chip-list">
                    ${(cfg.trigger_entities || [])
                      .map(
                        (eid, i) => `
                      <span class="entity-chip">${this._escape(eid)}
                        <button class="del-trigger" data-idx="${i}">×</button>
                      </span>`
                      )
                      .join("")}
                  </div>
                  <div style="display:flex;gap:6px;">
                    <input type="text" class="text-input" id="add-trigger-input" list="pdd-all-entities" placeholder="binary_sensor.zone_person_occupancy" />
                    <button class="btn btn-sm" id="btn-add-trigger">+ Add</button>
                  </div>
                </div>
              </div>

              <div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                  <label class="field-label" style="margin:0;">Sustaining Conditions (Hold presence while active)</label>
                  <button class="btn btn-sm" id="btn-add-condition">+ Add Condition</button>
                </div>
                ${(cfg.sustaining_conditions || [])
                  .map(
                    (c, idx) => `
                  <div style="display:grid;grid-template-columns:1.4fr 1.2fr 110px 90px 32px;gap:6px;margin-bottom:6px;">
                    <input type="text" class="text-input cond-field" data-idx="${idx}" data-key="entity_id" list="pdd-all-entities" placeholder="media_player.tv" value="${this._escape(
                      c.entity_id || ""
                    )}" />
                    <input type="text" class="text-input cond-field" data-idx="${idx}" data-key="label" placeholder="Label" value="${this._escape(
                      c.label || ""
                    )}" />
                    <select class="select-input cond-field" data-idx="${idx}" data-key="operator">
                      ${["equals", "greater_than", "less_than", "not_equals", "in"]
                        .map(
                          (op) =>
                            `<option value="${op}" ${
                              (c.operator || "equals") === op ? "selected" : ""
                            }>${op}</option>`
                        )
                        .join("")}
                    </select>
                    <input type="text" class="text-input cond-field" data-idx="${idx}" data-key="state" value="${this._escape(
                      c.state ?? "on"
                    )}" />
                    <button class="btn btn-sm cond-del" data-idx="${idx}" style="color:#f87171;">✕</button>
                  </div>`
                  )
                  .join("")}
              </div>
            </div>
          `
          }
        </div>

        <!-- RIGHT COLUMN: Live Combinatorics, NL <-> YAML Studio & .storage Revisions -->
        <div class="col-right">
          ${
            !selRoom
              ? ""
              : `
            <!-- Live Probability & Threshold Combinatorics Matrix -->
            <div class="panel-card">
              <div class="card-header">
                <h3 class="card-title">Live Bayesian Combinatorics</h3>
                <span class="occ-badge ${isOccupied ? "on" : "off"}">
                  ${isOccupied ? "Occupied" : "Vacant"}
                </span>
              </div>

              <div class="gauge-box">
                <div>
                  <div class="gauge-num" style="color:${
                    Number(livePct) >= threshPct ? "#10b981" : "#38bdf8"
                  };">${livePct}%</div>
                  <div style="font-size:10px;color:#94a3b8;margin-top:2px;">
                    Threshold: ${threshPct}% · Prior: ${priorPct}%
                  </div>
                </div>
                <div style="font-size:11.5px;color:#cbd5e1;line-height:1.4;">
                  ${this._escape(prev.natural_language_summary || selRoom.natural_language_summary)}
                </div>
              </div>

              <div class="comb-section">
                <div class="comb-title">✓ Solo Triggers (&ge; ${threshPct}% Alone)</div>
                ${
                  (comb.solo_triggers || []).length === 0
                    ? `<div style="font-size:11px;color:#64748b;">No single sensor crosses ${threshPct}% alone.</div>`
                    : (comb.solo_triggers || [])
                        .map(
                          (s) => `
                        <div class="comb-pill trigger">
                          <span><strong>${this._escape(s.label)}</strong> <small style="color:#94a3b8;">(${this._escape(
                            s.preset
                          )})</small></span>
                          <strong style="color:#34d399;">${s.posterior_pct}%</strong>
                        </div>`
                        )
                        .join("")
                }
              </div>

              <div class="comb-section">
                <div class="comb-title">⚡ Corroborated Pairs Crossing ${threshPct}%</div>
                ${
                  (comb.pair_triggers || []).length === 0
                    ? `<div style="font-size:11px;color:#64748b;">No 2-sensor sub-threshold pairs cross ${threshPct}%.</div>`
                    : (comb.pair_triggers || [])
                        .slice(0, 6)
                        .map(
                          (p) => `
                        <div class="comb-pill pair">
                          <span>${this._escape(p.labels)}</span>
                          <strong style="color:#38bdf8;">${p.posterior_pct}%</strong>
                        </div>`
                        )
                        .join("")
                }
              </div>

              <div class="comb-section">
                <div class="comb-title">🛡 Blocked Sub-Threshold Pairs (&lt; ${threshPct}%)</div>
                ${
                  (comb.pair_sub_threshold || []).length === 0
                    ? `<div style="font-size:11px;color:#64748b;">None</div>`
                    : (comb.pair_sub_threshold || [])
                        .slice(0, 4)
                        .map(
                          (p) => `
                        <div class="comb-pill safe">
                          <span>${this._escape(p.labels)}</span>
                          <span>${p.posterior_pct}%</span>
                        </div>`
                        )
                        .join("")
                }
              </div>
            </div>

            <!-- Bidirectional NL <-> YAML Studio -->
            <div class="panel-card">
              <div class="card-header">
                <h3 class="card-title">NL &harr; YAML Studio</h3>
              </div>
              <div class="filter-tabs" style="margin-top:0;">
                <div class="filter-tab ${this._rightTab === "yaml" ? "active" : ""}" data-rtab="yaml">Designer YAML</div>
                <div class="filter-tab ${this._rightTab === "ha_yaml" ? "active" : ""}" data-rtab="ha_yaml">HA Bayesian</div>
                <div class="filter-tab ${this._rightTab === "nl" ? "active" : ""}" data-rtab="nl">AI Translator</div>
                <div class="filter-tab ${this._rightTab === "guide" ? "active" : ""}" data-rtab="guide">Rule Guide</div>
              </div>

              ${
                this._rightTab === "yaml"
                  ? `
                <textarea class="code-area" id="yaml-draft-editor">${this._escape(
                  this._yamlDraft
                )}</textarea>
                <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px;">
                  <button class="btn btn-primary btn-sm" id="btn-apply-yaml">Apply YAML to Room</button>
                </div>`
                  : this._rightTab === "ha_yaml"
                  ? `
                <textarea class="code-area" readonly>${this._escape(
                  prev.ha_bayesian_yaml || ""
                )}</textarea>`
                  : this._rightTab === "guide"
                  ? `
                <textarea class="code-area" readonly>${this._escape(
                  prev.rule_guide || ""
                )}</textarea>`
                  : `
                <label class="field-label">Describe desired room behavior in plain English:</label>
                <textarea class="code-area" id="nl-prompt-input" style="min-height:95px;" placeholder="e.g. Require either a Frigate bed/walkway zone or both Master Bedroom motion and Steve's S25+ BLE to mark Master Bedroom occupied...">${this._escape(
                  this._nlPrompt
                )}</textarea>
                <div style="display:flex;gap:6px;margin:8px 0;">
                  <button class="btn btn-primary btn-sm" id="btn-nl-to-yaml">✨ Generate Rules from NL</button>
                  <button class="btn btn-sm" id="btn-yaml-to-nl">📖 Explain Current Rules</button>
                </div>
                ${
                  this._nlOutput
                    ? `<div style="background:#090d16;border:1px solid #1e293b;border-radius:8px;padding:10px;font-size:11.5px;white-space:pre-wrap;color:#cbd5e1;max-height:180px;overflow-y:auto;">${this._escape(
                        this._nlOutput
                      )}</div>`
                    : ""
                }`
              }
            </div>

            <!-- .storage Revision History -->
            <div class="panel-card">
              <div class="card-header">
                <h3 class="card-title">.storage Revision History (${
                  (selRoom.revisions || []).length
                })</h3>
              </div>
              ${
                (selRoom.revisions || []).length === 0
                  ? `<div style="font-size:11.5px;color:#64748b;">No prior revisions saved yet for this room. Saving changes automatically records a rollback snapshot in <code>.storage</code>.</div>`
                  : (selRoom.revisions || [])
                      .map(
                        (rev) => `
                      <div class="rev-row">
                        <div>
                          <div style="font-weight:600;color:#e2e8f0;">${this._escape(
                            rev.note || "Saved config"
                          )}</div>
                          <div style="color:#64748b;font-size:10px;">${this._escape(
                            rev.timestamp
                          )}</div>
                        </div>
                        <button class="btn btn-sm btn-rollback" data-rev-idx="${
                          rev.index
                        }">↺ Restore</button>
                      </div>`
                      )
                      .join("")
              }
            </div>
          `
          }
        </div>
      </div>

      ${
        this._showGlobalModal
          ? `
        <div class="modal-backdrop" id="global-modal-backdrop">
          <div class="modal-card">
            <div class="card-header">
              <h3 class="card-title" style="font-size:16px;">Shared Global Settings (.storage)</h3>
              <button class="btn btn-sm" id="btn-close-global">✕</button>
            </div>
            <div style="display:flex;flex-direction:column;gap:10px;">
              <div>
                <label class="field-label">Default LLM Provider Type</label>
                <select class="select-input" id="gl-provider">
                  <option value="vision_api" ${
                    (this._globalDraft?.llm_provider_type || "vision_api") === "vision_api"
                      ? "selected"
                      : ""
                  }>OpenAI-Compatible Vision / Chat API (LiteLLM)</option>
                  <option value="conversation" ${
                    this._globalDraft?.llm_provider_type === "conversation" ? "selected" : ""
                  }>Home Assistant Conversation Agent</option>
                  <option value="ai_task" ${
                    this._globalDraft?.llm_provider_type === "ai_task" ? "selected" : ""
                  }>Home Assistant AI Task</option>
                </select>
              </div>
              <div>
                <label class="field-label">Shared LLM API URL</label>
                <input type="text" class="text-input" id="gl-api-url" value="${this._escape(
                  this._globalDraft?.llm_api_url || ""
                )}" placeholder="http://10.0.0.10:8448/v1/chat/completions" />
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <div>
                  <label class="field-label">Shared LLM Model</label>
                  <input type="text" class="text-input" id="gl-model" value="${this._escape(
                    this._globalDraft?.llm_model || "gemini-2.5-flash"
                  )}" />
                </div>
                <div>
                  <label class="field-label">HA Conversation Agent ID</label>
                  <input type="text" class="text-input" id="gl-agent-id" value="${this._escape(
                    this._globalDraft?.llm_agent_id || ""
                  )}" placeholder="conversation.google_ai_conversation" />
                </div>
              </div>
              <div>
                <label class="field-label">Household BLE Area Trackers (comma-separated)</label>
                <input type="text" class="text-input" id="gl-ble" value="${this._escape(
                  (this._globalDraft?.ble_trackers || []).join(", ")
                )}" />
              </div>
              <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px;">
                <button class="btn" id="btn-cancel-global">Cancel</button>
                <button class="btn btn-primary" id="btn-save-global">Save Global Settings</button>
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

  _bindEvents() {
    const root = this.shadowRoot;
    const presets = (this._overview && this._overview.presets) || {};

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
    root.querySelectorAll(".filter-tab[data-filter]").forEach((el) => {
      el.addEventListener("click", () => {
        this._roomFilter = el.getAttribute("data-filter");
        this.render();
      });
    });
    root.querySelectorAll(".room-item[data-room-id]").forEach((el) => {
      el.addEventListener("click", () => {
        const rid = el.getAttribute("data-room-id");
        const room = (this._overview?.rooms || []).find((r) => r.entry_id === rid);
        if (room) this._selectRoomObject(room, true);
      });
    });

    // Room Header & Core Sliders
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
    root.querySelector("#input-rev-note")?.addEventListener("input", (e) => {
      this._revisionNote = e.target.value;
    });

    root.querySelector("#cfg-room-name")?.addEventListener("change", (e) => {
      this._draftConfig.room_name = e.target.value;
      this._dirty = true;
      this.refreshPreview();
    });
    root.querySelector("#cfg-area-id")?.addEventListener("change", (e) => {
      this._draftConfig.area_id = e.target.value || null;
      this._dirty = true;
      this.render();
    });
    root.querySelector("#cfg-mode")?.addEventListener("change", (e) => {
      this._draftConfig.mode = e.target.value;
      this._dirty = true;
      this.refreshPreview();
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
    });
    root.querySelector("#cfg-grace-timeout")?.addEventListener("change", (e) => {
      this._draftConfig.grace_timeout = Number(e.target.value);
      this._dirty = true;
    });
    root.querySelector("#cfg-extend-timeout")?.addEventListener("change", (e) => {
      this._draftConfig.extend_timeout = Number(e.target.value);
      this._dirty = true;
    });

    // Observations Table
    root.querySelector("#btn-add-obs")?.addEventListener("click", () => {
      this._draftConfig.bayesian_observations.push({
        entity_id: "",
        label: "New Sensor Observation",
        preset: "moderate",
        prob_given_true: 0.72,
        prob_given_false: 0.12,
        operator: "equals",
        state: "on",
      });
      this._dirty = true;
      this.render();
    });
    root.querySelector("#btn-add-ble")?.addEventListener("click", () =>
      this._addHouseholdBleTrackers()
    );
    root.querySelector("#btn-sync-triggers")?.addEventListener("click", () =>
      this._syncTriggersFromStrongObservations()
    );

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

    // Boundaries, Triggers & Sustaining Conditions
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

    root.querySelector("#btn-add-trigger")?.addEventListener("click", () => {
      const val = root.querySelector("#add-trigger-input")?.value?.trim();
      if (val && !this._draftConfig.trigger_entities.includes(val)) {
        this._draftConfig.trigger_entities.push(val);
        this._dirty = true;
        this.refreshPreview();
      }
    });
    root.querySelectorAll(".del-trigger").forEach((el) => {
      el.addEventListener("click", () => {
        const idx = Number(el.getAttribute("data-idx"));
        this._draftConfig.trigger_entities.splice(idx, 1);
        this._dirty = true;
        this.refreshPreview();
      });
    });

    root.querySelector("#btn-add-condition")?.addEventListener("click", () => {
      this._draftConfig.sustaining_conditions.push({
        entity_id: "",
        label: "Sustaining Condition",
        operator: "equals",
        state: "on",
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

    // Right Column Tabs, YAML & Revisions
    root.querySelectorAll(".filter-tab[data-rtab]").forEach((el) => {
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
