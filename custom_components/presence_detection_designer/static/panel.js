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
    this._studioView = "design"; // "design" | "floorplan" | "statistics" | "replay"
    this._floorplan = null;
    this._compiledTopology = null;
    this._selectedFloorId = "main";
    this._selectedCamEntity = null;
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
          `Compiled floorplan topology & applied linkages/spillover rules to ${(res?.updated_rooms || []).length} rooms!`,
          "success"
        );
      } else if (action === "reset") {
        this.showToast("Reset floorplan layout to default house geometry", "info");
      } else {
        this.showToast("Saved 2D floorplan & camera view cones to .storage", "success");
      }
    } catch (err) {
      this.showToast(`Floorplan action failed: ${err.message}`, "error");
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
      this.showToast(`Failed to load statistics: ${err.message}`, "error");
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
      this.showToast(`Replay simulation failed: ${err.message}`, "error");
    }
  }

  async applyReplayCandidate() {
    if (!this._selectedRoomId || !this._replayCandidate) return;
    this._draftConfig = JSON.parse(JSON.stringify(this._replayCandidate));
    this._revisionNote = `Applied tuned configuration from ${this._historyHours}h Replay Simulator`;
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
    const livePct = Number(prev.probability_pct ?? (selRoom ? selRoom.bayesian_probability_pct : 0)).toFixed(1);
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
        .mode-switcher {
          display: flex;
          background: #0b1120;
          border: 1px solid #334155;
          border-radius: 9px;
          padding: 3px;
          gap: 4px;
        }
        .mode-btn {
          background: transparent;
          color: #94a3b8;
          border: none;
          padding: 6px 13px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
        }
        .mode-btn.active {
          background: #2563eb;
          color: #fff;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.35);
        }
        .kpi-grid-6 {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 10px;
          margin-bottom: 14px;
        }
        @media (max-width: 1280px) {
          .kpi-grid-6 { grid-template-columns: repeat(3, 1fr); }
        }
        .kpi-card {
          background: #0b1120;
          border: 1px solid #1e293b;
          border-radius: 10px;
          padding: 11px 13px;
        }
        .kpi-label {
          font-size: 10.5px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #94a3b8;
          font-weight: 600;
        }
        .kpi-val {
          font-size: 21px;
          font-weight: 800;
          margin-top: 4px;
          color: #f8fafc;
        }
        .kpi-sub {
          font-size: 11px;
          color: #64748b;
          margin-top: 2px;
        }
        .swimlane-row {
          display: grid;
          grid-template-columns: 240px 1fr 90px;
          align-items: center;
          gap: 10px;
          padding: 6px 0;
          border-bottom: 1px solid #1e293b;
          font-size: 11.5px;
        }
        .swimlane-track {
          position: relative;
          height: 18px;
          background: #090d16;
          border: 1px solid #1e293b;
          border-radius: 5px;
          overflow: hidden;
        }
        .swimlane-seg {
          position: absolute;
          top: 2px;
          bottom: 2px;
          border-radius: 3px;
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
            <div class="brand-sub">Visual Bayesian Fusion Studio, Timeline Analytics &amp; Replay Simulator (v1.2.0)</div>
          </div>
        </div>

        <div class="mode-switcher">
          <button class="mode-btn ${this._studioView === "design" ? "active" : ""}" data-studio-view="design">🎨 Design Studio</button>
          <button class="mode-btn ${this._studioView === "floorplan" ? "active" : ""}" data-studio-view="floorplan">🗺️ Floorplan &amp; Coverage</button>
          <button class="mode-btn ${this._studioView === "statistics" ? "active" : ""}" data-studio-view="statistics">📈 Statistics &amp; Timeline</button>
          <button class="mode-btn ${this._studioView === "replay" ? "active" : ""}" data-studio-view="replay">⏮️ Replay &amp; Tuning Simulator</button>
        </div>

        <div class="top-pills">
          ${
            this._studioView === "statistics" || this._studioView === "replay"
              ? `<div class="mode-switcher" style="margin-right:4px;">
                  ${[
                    { h: 1, label: "1h" },
                    { h: 6, label: "6h" },
                    { h: 24, label: "24h" },
                    { h: 168, label: "7d" },
                  ]
                    .map(
                      (w) =>
                        `<button class="mode-btn ${
                          Number(this._historyHours) === w.h ? "active" : ""
                        }" data-history-hours="${w.h}" style="padding:4px 9px;font-size:11px;">${
                          w.label
                        }</button>`
                    )
                    .join("")}
                </div>`
              : ""
          }
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

        ${
          this._studioView === "floorplan"
            ? `<div style="grid-column: 2 / -1;">${this._renderFloorplanPane(selRoom)}</div>`
            : this._studioView === "statistics"
            ? `<div style="grid-column: 2 / -1;">${this._renderStatisticsPane(selRoom)}</div>`
            : this._studioView === "replay"
            ? `<div style="grid-column: 2 / -1;">${this._renderReplayPane(selRoom, presets)}</div>`
            : `
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

              <div style="margin-top:12px;padding-top:12px;border-top:1px solid #1e293b;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                  <label class="field-label" style="margin:0;">Connected Adjacent Rooms (Cross-Room Timer Hand-Off — Zeroes Countdown on Adjacent Entry)</label>
                  <button class="btn btn-sm" id="btn-open-floorplan-tab" style="color:#38bdf8;">🗺️ Edit in Floorplan</button>
                </div>
                <div class="chip-list">
                  ${(cfg.connected_rooms || []).length === 0
                    ? `<span style="font-size:11px;color:#64748b;">No connected rooms linked yet. Use the 🗺️ Floorplan &amp; Coverage tab or add below.</span>`
                    : (cfg.connected_rooms || [])
                        .map(
                          (rname, i) => `
                        <span class="entity-chip" style="border-color:#38bdf8;color:#bae6fd;">🔗 ${this._escape(rname)}
                          <button class="del-connected-room" data-idx="${i}">×</button>
                        </span>`
                        )
                        .join("")}
                </div>
                <div style="display:flex;gap:6px;max-width:360px;">
                  <select class="select-input" id="add-connected-room-input">
                    <option value="">— Select adjacent room —</option>
                    ${rooms
                      .filter((r) => r.room_name !== (cfg.room_name || selRoom.room_name))
                      .map(
                        (r) =>
                          `<option value="${this._escape(r.room_name)}">${this._escape(
                            r.room_name
                          )}</option>`
                      )
                      .join("")}
                  </select>
                  <button class="btn btn-sm" id="btn-add-connected-room">+ Link Room</button>
                </div>
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
        `
        }
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

  _buildStepSvgPaths(series, width = 940, height = 185) {
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

  _presetColor(preset) {
    const p = String(preset || "").toLowerCase();
    if (p === "decisive") return "#10b981";
    if (p === "strong") return "#38bdf8";
    if (p === "moderate") return "#818cf8";
    if (p === "supporting") return "#f59e0b";
    if (p === "door") return "#a855f7";
    return "#64748b";
  }

  _renderStatisticsPane(selRoom) {
    if (!selRoom) {
      return `<div class="panel-card">Select a room to inspect statistics.</div>`;
    }
    const st = this._statsData;
    if (!st || st.entry_id !== selRoom.entry_id) {
      return `<div class="panel-card">Loading ${this._historyHours}h historical timeline &amp; sensor attribution for <strong>${this._escape(
        selRoom.room_name
      )}</strong>...</div>`;
    }
    const sum = st.summary || {};
    const series = st.series || [];
    const swimlanes = st.swimlanes || [];
    const W = 940;
    const H = 185;
    const { linePath, areaPath } = this._buildStepSvgPaths(series, W, H);
    const threshY = H - (Number(st.threshold_pct || 75) / 100) * (H - 12) - 6;
    const priorY = H - (Number(st.prior_pct || 20) / 100) * (H - 12) - 6;

    const occBands = series
      .filter((s) => s.is_present && Number(s.width_pct || 0) > 0)
      .map((s) => {
        const x = (Number(s.offset_pct || 0) / 100) * W;
        const w = Math.max(2, (Number(s.width_pct || 0) / 100) * W);
        return `<rect x="${x.toFixed(1)}" y="0" width="${w.toFixed(
          1
        )}" height="${H}" fill="rgba(16, 185, 129, 0.14)" />`;
      })
      .join("");

    return `
      <div class="panel-card">
        <div class="card-header" style="flex-wrap:wrap;">
          <div>
            <h2 class="card-title" style="font-size:18px;">
              📈 ${this._escape(selRoom.room_name)} — ${sum.window_hours || this._historyHours}h Occupancy &amp; Bayesian Signal Analytics
            </h2>
            <div class="card-subtitle">
              Window: ${this._escape((st.start_iso || "").slice(11, 19))} UTC &rarr; ${this._escape(
      (st.end_iso || "").slice(11, 19)
    )} UTC · Threshold: ${st.threshold_pct}% · Baseline Prior: ${st.prior_pct}%
            </div>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-sm" id="btn-reload-stats">↻ Refresh Analytics</button>
            <button class="btn btn-primary btn-sm" id="btn-jump-to-replay">⏮️ Open in Replay Simulator</button>
          </div>
        </div>

        <div class="kpi-grid-6" style="margin-top:12px;">
          <div class="kpi-card">
            <div class="kpi-label">Occupancy Duty Cycle</div>
            <div class="kpi-val" style="color:#10b981;">${Number(sum.occupied_pct || 0).toFixed(1)}%</div>
            <div class="kpi-sub">${Number(sum.occupied_minutes || 0).toFixed(1)} min occupied</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">State Transitions</div>
            <div class="kpi-val" style="color:#38bdf8;">${sum.transition_count || 0}</div>
            <div class="kpi-sub">Vacant &rarr; Occupied entries</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Wasp-in-a-Box Hold</div>
            <div class="kpi-val" style="color:#a855f7;">${Number(sum.sealed_hold_minutes || 0).toFixed(
              1
            )}m</div>
            <div class="kpi-sub">Held by sealed door latch</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Deflected Noise</div>
            <div class="kpi-val" style="color:#f59e0b;">${sum.sub_threshold_deflections || 0}</div>
            <div class="kpi-sub">Sub-threshold events blocked</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Mean Occupied Prob</div>
            <div class="kpi-val">${Number(sum.avg_occupied_probability_pct || 0).toFixed(1)}%</div>
            <div class="kpi-sub">Threshold: ${st.threshold_pct}%</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Peak Posterior Prob</div>
            <div class="kpi-val" style="color:#34d399;">${Number(sum.peak_probability_pct || 0).toFixed(
              1
            )}%</div>
            <div class="kpi-sub">Baseline Prior: ${st.prior_pct}%</div>
          </div>
        </div>

        <!-- SVG Probability & Occupancy Timeline Chart -->
        <div style="background:#090d16;border:1px solid #1e293b;border-radius:10px;padding:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:11.5px;color:#94a3b8;">
            <span><strong>Bayesian Posterior Probability Curve (0–100%)</strong> &amp; Shaded Occupied Intervals</span>
            <div style="display:flex;gap:14px;">
              <span><span style="display:inline-block;width:10px;height:10px;background:rgba(16,185,129,0.35);border:1px solid #10b981;margin-right:5px;"></span>Occupied State</span>
              <span><span style="display:inline-block;width:12px;height:2px;background:#38bdf8;vertical-align:middle;margin-right:5px;"></span>Posterior %</span>
              <span><span style="display:inline-block;width:12px;height:2px;background:#f59e0b;vertical-align:middle;margin-right:5px;"></span>Threshold (${st.threshold_pct}%)</span>
            </div>
          </div>
          <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:190px;display:block;">
            <defs>
              <linearGradient id="probGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.35" />
                <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.02" />
              </linearGradient>
            </defs>
            ${occBands}
            <line x1="0" y1="${threshY.toFixed(1)}" x2="${W}" y2="${threshY.toFixed(
      1
    )}" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="6,4" />
            <line x1="0" y1="${priorY.toFixed(1)}" x2="${W}" y2="${priorY.toFixed(
      1
    )}" stroke="#475569" stroke-width="1" stroke-dasharray="3,4" />
            <path d="${areaPath}" fill="url(#probGrad)" />
            <path d="${linePath}" fill="none" stroke="#38bdf8" stroke-width="2.2" />
            <text x="8" y="${Math.max(12, threshY - 5).toFixed(
              1
            )}" fill="#f59e0b" font-size="10" font-weight="700">Threshold ${st.threshold_pct}%</text>
            <text x="8" y="${Math.max(12, priorY - 5).toFixed(
              1
            )}" fill="#64748b" font-size="10">Prior ${st.prior_pct}%</text>
          </svg>
        </div>
      </div>

      <!-- Synchronized Multi-Track Sensor Swimlanes -->
      <div class="panel-card">
        <div class="card-header">
          <div>
            <h3 class="card-title">Synchronized Sensor Activity Swimlanes (${swimlanes.length} Tracked Signals)</h3>
            <div class="card-subtitle">Each horizontal bar shows when a sensor matched its active occupancy condition across the ${
              sum.window_hours || this._historyHours
            }h window.</div>
          </div>
        </div>
        <div>
          ${swimlanes
            .map((lane) => {
              const color = this._presetColor(lane.preset);
              const segsHtml = (lane.segments || [])
                .map(
                  (seg) =>
                    `<div class="swimlane-seg" title="${this._escape(lane.label)}: ${this._escape(
                      seg.state
                    )} (${this._escape(seg.start_iso.slice(11, 19))} - ${this._escape(
                      seg.end_iso.slice(11, 19)
                    )})" style="left:${seg.start_pct}%;width:${seg.width_pct}%;background:${color};"></div>`
                )
                .join("");
              return `
                <div class="swimlane-row">
                  <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:6px;"></span>
                    <strong style="color:#e2e8f0;">${this._escape(lane.label)}</strong>
                    <span style="color:#64748b;font-size:10px;margin-left:4px;">(${this._escape(
                      lane.preset
                    )})</span>
                  </div>
                  <div class="swimlane-track">${segsHtml}</div>
                  <div style="text-align:right;color:#cbd5e1;font-size:11px;">
                    <strong>${Number(lane.active_pct || 0).toFixed(1)}%</strong>
                    <span style="color:#64748b;">(${Number(lane.active_minutes || 0).toFixed(
                      0
                    )}m)</span>
                  </div>
                </div>`;
            })
            .join("")}
        </div>
      </div>

      <!-- Sensor Attribution & False-Alarm Deflection Table -->
      <div class="panel-card">
        <div class="card-header">
          <div>
            <h3 class="card-title">Sensor Signal Attribution &amp; Noise Deflection Breakdown</h3>
            <div class="card-subtitle">Evaluate which sensors reliably corroborate occupancy versus which sensors fire alone without crossing the ${
              st.threshold_pct
            }% threshold.</div>
          </div>
        </div>
        <div style="overflow-x:auto;">
          <table class="obs-table">
            <thead>
              <tr>
                <th>Sensor Label &amp; Entity ID</th>
                <th>Tier / Preset</th>
                <th>Weights P(E|T) / P(E|F)</th>
                <th>Solo Posterior</th>
                <th>Active Duty</th>
                <th>Activations</th>
                <th>Corroborated Occupancies</th>
                <th>Deflected Below Threshold</th>
              </tr>
            </thead>
            <tbody>
              ${swimlanes
                .map(
                  (lane) => `
                <tr>
                  <td>
                    <div style="font-weight:600;color:#f1f5f9;">${this._escape(lane.label)}</div>
                    <div style="font-family:monospace;font-size:10.5px;color:#64748b;">${this._escape(
                      lane.entity_id
                    )}</div>
                  </td>
                  <td><span class="occ-badge" style="background:#1e293b;color:${this._presetColor(
                    lane.preset
                  )};">${this._escape(lane.preset.toUpperCase())}</span></td>
                  <td><code>${Number(lane.prob_given_true).toFixed(2)} / ${Number(
                    lane.prob_given_false
                  ).toFixed(2)}</code></td>
                  <td><strong>${Number(lane.solo_posterior_pct).toFixed(1)}%</strong></td>
                  <td>${Number(lane.active_pct).toFixed(1)}% (${Number(lane.active_minutes).toFixed(
                    1
                  )}m)</td>
                  <td>${lane.activation_count}</td>
                  <td style="color:#34d399;font-weight:700;">${lane.corroborated_count}</td>
                  <td style="color:${lane.deflected_count > 0 ? "#f59e0b" : "#64748b"};font-weight:700;">
                    ${lane.deflected_count} ${lane.deflected_count > 0 ? "(blocked solo noise)" : ""}
                  </td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  _renderReplayPane(selRoom, presets) {
    if (!selRoom) {
      return `<div class="panel-card">Select a room to run historical replay &amp; parameter tuning.</div>`;
    }
    const cand = this._replayCandidate || this._draftConfig || {};
    const rep = this._replayData;
    const candPriorPct = Math.round(Number(cand.bayesian_prior ?? 0.2) * 100);
    const candThreshPct = Math.round(Number(cand.bayesian_threshold ?? 0.75) * 100);

    if (!rep || rep.entry_id !== selRoom.entry_id) {
      return `<div class="panel-card">Simulating historical What-If Replay for <strong>${this._escape(
        selRoom.room_name
      )}</strong>...</div>`;
    }

    const baseRes = rep.baseline || {};
    const candRes = rep.candidate || {};
    const deltas = rep.deltas || {};
    const divergences = rep.divergence_windows || [];
    const W = 940;
    const H = 195;
    const basePaths = this._buildStepSvgPaths(baseRes.series || [], W, H);
    const candPaths = this._buildStepSvgPaths(candRes.series || [], W, H);
    const candThreshY = H - (candThreshPct / 100) * (H - 12) - 6;

    const divBands = divergences
      .map((d) => {
        const x = (Number(d.start_pct || 0) / 100) * W;
        const w = Math.max(3, (Number(d.width_pct || 0) / 100) * W);
        const fill =
          d.type === "false_positive_eliminated"
            ? "rgba(244, 63, 94, 0.24)"
            : "rgba(16, 185, 129, 0.24)";
        return `<rect x="${x.toFixed(1)}" y="0" width="${w.toFixed(
          1
        )}" height="${H}" fill="${fill}" />`;
      })
      .join("");

    return `
      <!-- Top Delta Comparison & Action Bar -->
      <div class="panel-card">
        <div class="card-header" style="flex-wrap:wrap;">
          <div>
            <h2 class="card-title" style="font-size:18px;">
              ⏮️ ${this._escape(selRoom.room_name)} — Historical What-If Replay &amp; Bayesian Tuning Simulator (${
      this._historyHours
    }h)
            </h2>
            <div class="card-subtitle">
              Tune prior, threshold, timeouts, or sensor weights below and immediately see how historical occupancy decisions change against saved baseline.
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-sm" id="btn-replay-reset">↺ Reset to Saved Baseline</button>
            <button class="btn btn-primary btn-sm" id="btn-replay-run">▶ Run Replay</button>
            <button class="btn btn-success btn-sm" id="btn-replay-apply">💾 Apply Tuned Config to Room (.storage)</button>
          </div>
        </div>

        <div class="kpi-grid-6" style="margin-top:12px;">
          <div class="kpi-card">
            <div class="kpi-label">Baseline Occupied</div>
            <div class="kpi-val">${Number(baseRes.summary?.occupied_pct || 0).toFixed(1)}%</div>
            <div class="kpi-sub">${Number(baseRes.summary?.occupied_minutes || 0).toFixed(
              1
            )}m (${baseRes.summary?.transition_count || 0} transitions)</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Tuned Candidate Occupied</div>
            <div class="kpi-val" style="color:#38bdf8;">${Number(
              candRes.summary?.occupied_pct || 0
            ).toFixed(1)}%</div>
            <div class="kpi-sub">${Number(candRes.summary?.occupied_minutes || 0).toFixed(
              1
            )}m (${candRes.summary?.transition_count || 0} transitions)</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Duty Cycle Delta</div>
            <div class="kpi-val" style="color:${
              Number(deltas.occupied_pct_delta || 0) < 0
                ? "#f43f5e"
                : Number(deltas.occupied_pct_delta || 0) > 0
                ? "#10b981"
                : "#94a3b8"
            };">${Number(deltas.occupied_pct_delta || 0) >= 0 ? "+" : ""}${Number(
      deltas.occupied_pct_delta || 0
    ).toFixed(1)}%</div>
            <div class="kpi-sub">${
              Number(deltas.occupied_minutes_delta || 0) >= 0 ? "+" : ""
            }${Number(deltas.occupied_minutes_delta || 0).toFixed(1)} min vs baseline</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">False Positives Cut</div>
            <div class="kpi-val" style="color:#f43f5e;">${Number(
              deltas.false_positive_eliminated_minutes || 0
            ).toFixed(1)}m</div>
            <div class="kpi-sub">Baseline Occupied &rarr; Tuned Vacant</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Dropouts Prevented</div>
            <div class="kpi-val" style="color:#10b981;">${Number(
              deltas.occupancy_gained_minutes || 0
            ).toFixed(1)}m</div>
            <div class="kpi-sub">Baseline Vacant &rarr; Tuned Occupied</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Timeline Agreement</div>
            <div class="kpi-val">${Number(deltas.agreement_pct ?? 100).toFixed(1)}%</div>
            <div class="kpi-sub">${deltas.divergence_count || 0} divergence windows</div>
          </div>
        </div>

        <!-- Dual-Curve Overlay SVG Chart -->
        <div style="background:#090d16;border:1px solid #1e293b;border-radius:10px;padding:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:11.5px;color:#94a3b8;flex-wrap:wrap;gap:8px;">
            <span><strong>Baseline vs. Tuned Candidate Posterior Probability Overlay</strong></span>
            <div style="display:flex;gap:14px;flex-wrap:wrap;">
              <span><span style="display:inline-block;width:12px;height:2px;background:#94a3b8;vertical-align:middle;margin-right:5px;"></span>Saved Baseline (%)</span>
              <span><span style="display:inline-block;width:12px;height:2px;background:#38bdf8;vertical-align:middle;margin-right:5px;"></span>Tuned Candidate (%)</span>
              <span><span style="display:inline-block;width:10px;height:10px;background:rgba(244,63,94,0.35);border:1px solid #f43f5e;margin-right:5px;"></span>False Positive Cut</span>
              <span><span style="display:inline-block;width:10px;height:10px;background:rgba(16,185,129,0.35);border:1px solid #10b981;margin-right:5px;"></span>Occupancy Gained</span>
            </div>
          </div>
          <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:195px;display:block;">
            ${divBands}
            <line x1="0" y1="${candThreshY.toFixed(1)}" x2="${W}" y2="${candThreshY.toFixed(
      1
    )}" stroke="#10b981" stroke-width="1.4" stroke-dasharray="6,4" />
            <path d="${basePaths.linePath}" fill="none" stroke="#94a3b8" stroke-width="1.8" stroke-dasharray="4,3" />
            <path d="${candPaths.linePath}" fill="none" stroke="#38bdf8" stroke-width="2.4" />
            <text x="8" y="${Math.max(12, candThreshY - 5).toFixed(
              1
            )}" fill="#10b981" font-size="10" font-weight="700">Candidate Threshold ${candThreshPct}%</text>
          </svg>
        </div>
      </div>

      <!-- Side-by-Side Candidate Sandbox & Divergence Windows Inspector -->
      <div style="display:grid;grid-template-columns:1.25fr 1fr;gap:16px;align-items:start;">
        <div class="panel-card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Candidate Tuning Sandbox (What-If Parameters)</h3>
              <div class="card-subtitle">Adjust sliders or sensor weights to test how they would have performed over the last ${
                this._historyHours
              } hours.</div>
            </div>
          </div>

          <div class="form-grid-4" style="margin-bottom:12px;">
            <div>
              <label class="field-label">Candidate Prior: <strong style="color:#38bdf8;">${candPriorPct}%</strong></label>
              <input type="range" min="5" max="50" step="1" id="rep-prior-slider" value="${candPriorPct}" style="width:100%;" />
            </div>
            <div>
              <label class="field-label">Candidate Threshold: <strong style="color:#10b981;">${candThreshPct}%</strong></label>
              <input type="range" min="50" max="95" step="1" id="rep-thresh-slider" value="${candThreshPct}" style="width:100%;" />
            </div>
            <div>
              <label class="field-label">Inactivity Timeout (s)</label>
              <input type="number" class="num-input" id="rep-inactivity" value="${Number(
                cand.inactivity_timeout ?? 240
              )}" />
            </div>
            <div>
              <label class="field-label">Door Grace Timeout (s)</label>
              <input type="number" class="num-input" id="rep-grace" value="${Number(
                cand.grace_timeout ?? 60
              )}" />
            </div>
          </div>

          <div style="overflow-x:auto;">
            <table class="obs-table">
              <thead>
                <tr>
                  <th>Sensor Label</th>
                  <th>Candidate Preset</th>
                  <th>P(E|Occ)</th>
                  <th>P(E|Vac)</th>
                  <th>Solo %</th>
                </tr>
              </thead>
              <tbody>
                ${(cand.bayesian_observations || [])
                  .map((obs, idx) => {
                    const presetVal = obs.preset || "moderate";
                    const pDefaults = presets[presetVal] || {
                      prob_given_true: 0.72,
                      prob_given_false: 0.12,
                    };
                    const pTrue = Number(obs.prob_given_true ?? pDefaults.prob_given_true);
                    const pFalse = Number(obs.prob_given_false ?? pDefaults.prob_given_false);
                    const p0 = Math.max(0.01, Math.min(0.99, Number(cand.bayesian_prior ?? 0.2)));
                    const soloOdds =
                      (p0 / (1 - p0)) * (Math.max(0.001, pTrue) / Math.max(0.001, pFalse));
                    const soloPct = ((soloOdds / (1 + soloOdds)) * 100).toFixed(1);
                    return `
                      <tr>
                        <td>
                          <div style="font-weight:600;color:#e2e8f0;">${this._escape(
                            obs.label || obs.entity_id
                          )}</div>
                          <div style="font-size:10px;color:#64748b;font-family:monospace;">${this._escape(
                            obs.entity_id
                          )}</div>
                        </td>
                        <td>
                          <select class="select-input rep-obs-preset" data-idx="${idx}">
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
                        <td style="width:78px;">
                          <input type="number" step="0.01" min="0.01" max="0.99" class="num-input rep-obs-prob" data-idx="${idx}" data-key="prob_given_true" value="${pTrue.toFixed(
                      2
                    )}" />
                        </td>
                        <td style="width:78px;">
                          <input type="number" step="0.01" min="0.01" max="0.99" class="num-input rep-obs-prob" data-idx="${idx}" data-key="prob_given_false" value="${pFalse.toFixed(
                      2
                    )}" />
                        </td>
                        <td><strong style="color:${
                          Number(soloPct) >= candThreshPct ? "#34d399" : "#94a3b8"
                        };">${soloPct}%</strong></td>
                      </tr>`;
                  })
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>

        <div class="panel-card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Divergence Inspector (${divergences.length} Windows)</h3>
              <div class="card-subtitle">Exact intervals where Tuned Candidate changed the room occupancy decision vs. Saved Baseline.</div>
            </div>
          </div>
          ${
            divergences.length === 0
              ? `<div style="padding:18px;text-align:center;color:#64748b;font-size:12px;background:#090d16;border-radius:8px;border:1px solid #1e293b;">
                  No occupancy divergences between Baseline and Candidate over this window (100% agreement). Adjust Candidate Threshold, Prior, or Sensor Weights on the left to test sensitivity!
                </div>`
              : divergences
                  .slice(0, 12)
                  .map(
                    (d) => `
                  <div style="background:#090d16;border-left:3px solid ${
                    d.type === "false_positive_eliminated" ? "#f43f5e" : "#10b981"
                  };border-radius:7px;padding:10px 12px;margin-bottom:8px;font-size:11.5px;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                      <strong style="color:${
                        d.type === "false_positive_eliminated" ? "#fda4af" : "#6ee7b7"
                      };">
                        ${
                          d.type === "false_positive_eliminated"
                            ? "🛡 False Positive Eliminated"
                            : "⚡ Occupancy Gained / Held"
                        }
                      </strong>
                      <span style="color:#94a3b8;font-family:monospace;font-size:10.5px;">
                        ${this._escape(d.start_iso.slice(11, 19))} &rarr; ${this._escape(
                      d.end_iso.slice(11, 19)
                    )} (${d.duration_sec}s)
                      </span>
                    </div>
                    <div style="color:#cbd5e1;line-height:1.4;">${this._escape(
                      d.explanation
                    )}</div>
                  </div>`
                  )
                  .join("")
          }
        </div>
      </div>
    `;
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
      return `<div class="panel-card">Loading 2D Spatial Floorplan &amp; Camera View Cones...</div>`;
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
    const sealAnalysis = compiled.seal_analysis || {};
    const connMap = compiled.connected_rooms_map || {};
    const roomCoverage = compiled.room_coverage || {};

    // Build SVG grid lines (1000 x 580 canvas)
    const gridLines = [];
    for (let gx = 80; gx < 1000; gx += 80) {
      gridLines.push(
        `<line x1="${gx}" y1="0" x2="${gx}" y2="580" stroke="#1e293b" stroke-width="0.6" stroke-dasharray="2,4" />`
      );
    }
    for (let gy = 80; gy < 580; gy += 80) {
      gridLines.push(
        `<line x1="0" y1="${gy}" x2="1000" y2="${gy}" stroke="#1e293b" stroke-width="0.6" stroke-dasharray="2,4" />`
      );
    }

    // Build SVG camera cones (with translucent fill)
    const conesSvg = fCams
      .map((cam) => {
        const camId = cam.id || cam.camera_entity;
        const camLabel = (cam.name || cam.label || camId).replace(" Camera", "");
        const isSelectedCam = selCam && (selCam.id || selCam.camera_entity) === camId;
        const hasSpill =
          (Array.isArray(cam.spills_into) && cam.spills_into.length > 0) ||
          camAnalysis.some((ca) => ca.camera_id === camId && ca.has_multi_room_bleed);
        const coneColor = hasSpill ? "#f59e0b" : "#38bdf8";
        const pathD = this._coneSvgPath(cam);
        const rad = (Number(cam.heading_deg || 0) * Math.PI) / 180.0;
        const labelDist = Math.min(130, Number(cam.range_px || 200) * 0.45);
        const labelX = Math.max(70, Math.min(930, Number(cam.x) + Math.cos(rad) * labelDist));
        const labelY = Math.max(20, Math.min(560, Number(cam.y) + Math.sin(rad) * labelDist));
        return `
          <g class="fp-cam-group" data-cam-entity="${this._escape(camId)}" style="cursor:pointer;">
            <path
              d="${pathD}"
              fill="${hasSpill ? "rgba(245, 158, 11, 0.18)" : "rgba(56, 189, 248, 0.16)"}"
              stroke="${coneColor}"
              stroke-width="${isSelectedCam ? "2.6" : "1.4"}"
              stroke-dasharray="${hasSpill ? "6,4" : "none"}"
            />
            <circle
              cx="${Number(cam.x).toFixed(1)}"
              cy="${Number(cam.y).toFixed(1)}"
              r="${isSelectedCam ? "8" : "6"}"
              fill="${coneColor}"
              stroke="#090d16"
              stroke-width="2"
            />
            <rect
              x="${(labelX - 66).toFixed(1)}"
              y="${(labelY - 11).toFixed(1)}"
              width="132"
              height="20"
              rx="5"
              fill="rgba(9, 13, 22, 0.88)"
              stroke="${coneColor}"
              stroke-width="1"
            />
            <text
              x="${labelX.toFixed(1)}"
              y="${(labelY + 3).toFixed(1)}"
              text-anchor="middle"
              fill="${hasSpill ? "#fde68a" : "#bae6fd"}"
              font-size="10.5"
              font-weight="700"
            >📷 ${this._escape(camLabel)} (${cam.fov_deg}°)</text>
          </g>
        `;
      })
      .join("");

    // Build SVG room boxes
    const roomsSvg = fRooms
      .map((box) => {
        const rName = box.name || box.room_name;
        const live = liveRoomsByName[rName];
        const isSel = selRoom && selRoom.room_name === rName;
        const isOcc = live ? Boolean(live.is_present) : false;
        const probPct = live ? Number(live.bayesian_probability_pct || 0).toFixed(1) : "0.0";
        const boxState = live ? String(live.box_state || "idle_clear") : "transit";
        const sealInfo = sealAnalysis[rName] || {};
        const canSeal = Boolean(sealInfo.can_be_bounded || sealInfo.can_seal);
        const isTransit = box.room_type === "transit" || Boolean(box.is_transit);
        const covPct = Number(roomCoverage[rName]?.max_coverage_pct ?? 100);
        const hasBlindSpot = !isTransit && covPct === 0;

        let strokeColor = isSel ? "#38bdf8" : "#334155";
        let fillColor = "rgba(15, 23, 42, 0.80)";
        if (isOcc) {
          strokeColor = "#10b981";
          fillColor = "rgba(6, 78, 59, 0.44)";
        } else if (hasBlindSpot) {
          strokeColor = "#f59e0b";
          fillColor = "rgba(120, 53, 15, 0.25)";
        } else if (isTransit) {
          strokeColor = "#475569";
          fillColor = "rgba(30, 41, 59, 0.48)";
        }

        const rx = Number(box.x);
        const ry = Number(box.y);
        const rw = Number(box.width ?? box.w ?? 200);
        const rh = Number(box.height ?? box.h ?? 150);

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
              stroke-width="${isSel ? "3.0" : "1.8"}"
              stroke-dasharray="${isTransit ? "5,4" : "none"}"
            />
            <text
              x="${rx + 12}"
              y="${ry + 22}"
              fill="#f8fafc"
              font-size="13.5"
              font-weight="800"
            >${this._escape(rName)}</text>
            ${
              live
                ? `<text
                    x="${rx + rw - 10}"
                    y="${ry + 22}"
                    text-anchor="end"
                    fill="${isOcc ? "#34d399" : "#94a3b8"}"
                    font-size="11.5"
                    font-weight="700"
                  >${isOcc ? `OCC ${probPct}%` : `VAC ${probPct}%`}</text>`
                : `<text
                    x="${rx + rw - 10}"
                    y="${ry + 22}"
                    text-anchor="end"
                    fill="#64748b"
                    font-size="10.5"
                  >Transit / Shared</text>`
            }
            <text
              x="${rx + 12}"
              y="${ry + 42}"
              fill="${canSeal ? "#c084fc" : "#38bdf8"}"
              font-size="10.5"
              font-weight="600"
            >${
              isTransit
                ? "↕ Multi-Room Transit Hub"
                : canSeal
                ? "🔒 Bounded (Sensor Door Seal)"
                : "🌊 Open Passage / Timer Hand-Off"
            }</text>
            ${
              live
                ? `<text
                    x="${rx + 12}"
                    y="${ry + 60}"
                    fill="#94a3b8"
                    font-size="10.5"
                  >State: ${this._escape(boxState)}${
                    live.vacating_countdown ? ` (${live.vacating_countdown}s)` : ""
                  } · Linked: ${(connMap[rName] || []).length} rooms</text>`
                : ""
            }
            ${
              box.notes
                ? `<text
                    x="${rx + 12}"
                    y="${ry + rh - (hasBlindSpot ? 24 : 10)}"
                    fill="#64748b"
                    font-size="9.5"
                  >${this._escape(
                    box.notes.length > 52 ? box.notes.slice(0, 50) + "…" : box.notes
                  )}</text>`
                : ""
            }
            ${
              hasBlindSpot
                ? `<text
                    x="${rx + 12}"
                    y="${ry + rh - 9}"
                    fill="#fbbf24"
                    font-size="10"
                    font-weight="700"
                  >⚠️ No Direct Camera View Cone (Relies on PIR / Doorway / BLE)</text>`
                : ""
            }
          </g>
        `;
      })
      .join("");

    // Build SVG logical connections between room centers
    const connsSvg = fConns
      .map((conn) => {
        const bFrom = roomBoxMap[conn.from_room];
        const bTo = roomBoxMap[conn.to_room];
        if (!bFrom || !bTo) {
          const localBox = bFrom || bTo;
          if (!localBox) return "";
          const otherName = bFrom ? conn.to_room : conn.from_room;
          const lw = Number(localBox.width ?? localBox.w ?? 200);
          const lh = Number(localBox.height ?? localBox.h ?? 150);
          const cx = Number(localBox.x) + lw / 2;
          const cy = Number(localBox.y) + lh - 16;
          return `
            <g>
              <rect x="${(cx - 82).toFixed(1)}" y="${(cy - 10).toFixed(
            1
          )}" width="164" height="19" rx="5" fill="#1e1b4b" stroke="#a855f7" stroke-width="1.2" />
              <text x="${cx.toFixed(1)}" y="${(cy + 3).toFixed(
            1
          )}" text-anchor="middle" fill="#e9d5ff" font-size="10" font-weight="700">🪜 Stairs &harr; ${this._escape(
            otherName
          )}</text>
            </g>`;
        }
        const w1 = Number(bFrom.width ?? bFrom.w ?? 200);
        const h1 = Number(bFrom.height ?? bFrom.h ?? 150);
        const w2 = Number(bTo.width ?? bTo.w ?? 200);
        const h2 = Number(bTo.height ?? bTo.h ?? 150);
        const x1 = Number(bFrom.x) + w1 / 2;
        const y1 = Number(bFrom.y) + h1 / 2;
        const x2 = Number(bTo.x) + w2 / 2;
        const y2 = Number(bTo.y) + h2 / 2;
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        let color = "#38bdf8";
        let icon = "↔";
        if (conn.type === "sensor_door") {
          color = "#10b981";
          icon = "🚪";
        } else if (conn.type === "unmonitored_door") {
          color = "#f59e0b";
          icon = "🔓";
        } else if (conn.type === "stairs") {
          color = "#a855f7";
          icon = "🪜";
        }
        return `
          <g>
            <line
              x1="${x1.toFixed(1)}"
              y1="${y1.toFixed(1)}"
              x2="${x2.toFixed(1)}"
              y2="${y2.toFixed(1)}"
              stroke="${color}"
              stroke-width="2.2"
              stroke-dasharray="${conn.type === "sensor_door" ? "none" : "6,4"}"
              opacity="0.85"
            />
            <circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="11" fill="#090d16" stroke="${color}" stroke-width="1.5" />
            <text x="${mx.toFixed(1)}" y="${(my + 4).toFixed(1)}" text-anchor="middle" font-size="10.5">${icon}</text>
          </g>
        `;
      })
      .join("");

    const selBoxName = selBox ? selBox.name || selBox.room_name : selRoom?.room_name || "Room";
    const selCamId = selCam ? selCam.id || selCam.camera_entity : "";
    const spilloverCount = camAnalysis.filter((c) => c.has_multi_room_bleed).length;

    return `
      <!-- Top Floorplan Header & Compiler Bar -->
      <div class="panel-card">
        <div class="card-header" style="flex-wrap:wrap;">
          <div>
            <h2 class="card-title" style="font-size:18px;">
              🗺️ 2D House Floorplan, Camera View Cones &amp; Logical Room Linkage Compiler
            </h2>
            <div class="card-subtitle">
              Place room boxes and camera field-of-view (FOV) cones to automatically compile adjacent room hand-offs, validate Wasp-in-a-Box door seals, and detect cross-room camera spillover or sensor blind spots.
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
            <div class="mode-switcher">
              ${floors
                .map(
                  (fl) => `
                <button class="mode-btn ${
                  fl.id === activeFloor.id ? "active" : ""
                }" data-floor-id="${this._escape(fl.id)}">
                  ${
                    fl.id === "upstairs"
                      ? "🛏️ Upstairs"
                      : fl.id === "basement"
                      ? "🎬 Basement"
                      : "🏠 Main Floor"
                  }
                </button>`
                )
                .join("")}
            </div>
            <button class="btn btn-sm" id="btn-fp-reset">↺ Reset Default Layout</button>
            <button class="btn btn-sm" id="btn-fp-save">💾 Save Layout</button>
            <button class="btn btn-success btn-sm" id="btn-fp-compile">⚡ Compile Floorplan &rarr; Apply Linkages &amp; Rules</button>
          </div>
        </div>

        <div class="kpi-grid-6" style="margin-top:10px;margin-bottom:4px;">
          <div class="kpi-card">
            <div class="kpi-label">Active Floor</div>
            <div class="kpi-val" style="font-size:16px;color:#38bdf8;">${this._escape(
              activeFloor.name
            )}</div>
            <div class="kpi-sub">${fRooms.length} room boxes · ${fCams.length} cameras</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Total Camera Cones</div>
            <div class="kpi-val" style="color:#38bdf8;">${allFpCams.length || 10}</div>
            <div class="kpi-sub">2D FOV coverage wedges</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Cross-Room Spillovers</div>
            <div class="kpi-val" style="color:#f59e0b;">${spilloverCount}</div>
            <div class="kpi-sub">Whole-frame downgraded to supporting</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Open / Unsealed Rooms</div>
            <div class="kpi-val" style="color:#a855f7;">${
              Object.values(sealAnalysis).filter((v) => !v.can_be_bounded).length
            }</div>
            <div class="kpi-sub">Prevented fake occupied_sealed latches</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Adjacent Hand-Off Links</div>
            <div class="kpi-val" style="color:#10b981;">${
              Object.values(connMap).reduce((acc, arr) => acc + (arr ? arr.length : 0), 0)
            }</div>
            <div class="kpi-sub">Zeroes vacating timer on hand-off</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Ambiguities &amp; Blind Spots</div>
            <div class="kpi-val" style="color:#f43f5e;">${ambiguities.length}</div>
            <div class="kpi-sub">Spatial coverage &amp; bleed findings</div>
          </div>
        </div>
      </div>

      <!-- Main 2-Column Canvas + Camera Cone & Room Box Inspector -->
      <div style="display:grid;grid-template-columns:1.55fr 1fr;gap:16px;align-items:start;">
        <div class="panel-card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:12.5px;font-weight:700;color:#e2e8f0;">
              ${this._escape(activeFloor.name)} — Interactive Room Boxes, Passages &amp; Camera FOV Cones
            </span>
            <div style="display:flex;gap:12px;font-size:11px;color:#94a3b8;flex-wrap:wrap;">
              <span>🚪 <strong style="color:#10b981;">Sensor Door</strong></span>
              <span>🔓 <strong style="color:#f59e0b;">Unmonitored Door</strong></span>
              <span>↔ <strong style="color:#38bdf8;">Open Passage</strong></span>
              <span>🪜 <strong style="color:#a855f7;">Stairs</strong></span>
              <span>📷 <strong style="color:#fde68a;">Spillover FOV Cone</strong></span>
            </div>
          </div>

          <div style="background:#090d16;border:1px solid #1e293b;border-radius:10px;padding:8px;overflow:hidden;">
            <svg id="fp-svg-canvas" viewBox="0 0 1000 580" style="width:100%;height:auto;min-height:410px;display:block;user-select:none;">
              ${gridLines.join("")}
              ${roomsSvg}
              ${connsSvg}
              ${conesSvg}
            </svg>
          </div>
          <div style="font-size:11px;color:#64748b;margin-top:6px;">
            💡 Click any <strong>Room Box</strong> to select that room, or click any <strong>📷 Camera Cone</strong> to tune its position, heading angle, FOV wedge, and range on the right.
          </div>
        </div>

        <!-- Right Inspector: Camera Cone Tuner & Room Linkage Summary -->
        <div>
          <!-- Camera View Cone Tuner -->
          <div class="panel-card">
            <div class="card-header">
              <div>
                <h3 class="card-title">📷 Camera View Cone Inspector</h3>
                <div class="card-subtitle">Adjust camera placement, heading (°), FOV angle (°), and range to see which rooms fall inside its view cone.</div>
              </div>
            </div>
            ${
              !selCam
                ? `<div style="font-size:12px;color:#64748b;">No cameras on this floor.</div>`
                : `
              <div style="margin-bottom:10px;">
                <label class="field-label">Select Camera on ${this._escape(activeFloor.name)}</label>
                <select class="select-input" id="fp-cam-select">
                  ${fCams
                    .map((c) => {
                      const cid = c.id || c.camera_entity;
                      const cname = c.name || c.label || cid;
                      return `<option value="${this._escape(cid)}" ${
                        cid === selCamId ? "selected" : ""
                      }>${this._escape(cname)} (${this._escape(cid)})</option>`;
                    })
                    .join("")}
                </select>
              </div>
              <div class="form-grid-5" style="margin-bottom:10px;">
                <div>
                  <label class="field-label">Origin X</label>
                  <input type="number" class="num-input fp-cam-field" data-key="x" value="${Number(
                    selCam.x
                  )}" />
                </div>
                <div>
                  <label class="field-label">Origin Y</label>
                  <input type="number" class="num-input fp-cam-field" data-key="y" value="${Number(
                    selCam.y
                  )}" />
                </div>
                <div>
                  <label class="field-label">Heading (°)</label>
                  <input type="number" class="num-input fp-cam-field" data-key="heading_deg" value="${Number(
                    selCam.heading_deg
                  )}" />
                </div>
                <div>
                  <label class="field-label">FOV (°)</label>
                  <input type="number" class="num-input fp-cam-field" data-key="fov_deg" min="20" max="180" value="${Number(
                    selCam.fov_deg
                  )}" />
                </div>
                <div>
                  <label class="field-label">Range (px)</label>
                  <input type="number" class="num-input fp-cam-field" data-key="range_px" min="40" max="700" value="${Number(
                    selCam.range_px
                  )}" />
                </div>
              </div>
              <div style="background:#090d16;border:1px solid #1e293b;border-radius:8px;padding:10px;font-size:11.5px;color:#cbd5e1;">
                <div><strong>Host Room:</strong> <span style="color:#38bdf8;">${this._escape(
                  selCam.host_room || selCam.primary_room || ""
                )}</span></div>
                ${
                  (selCam.spills_into || []).length > 0
                    ? `<div style="margin-top:4px;"><strong>Spills Into:</strong> <span style="color:#fbbf24;">${this._escape(
                        (selCam.spills_into || []).join(", ")
                      )}</span></div>`
                    : ""
                }
                <div style="margin-top:4px;"><strong>Coverage Notes:</strong> ${this._escape(
                  selCam.notes || "Covers primary room."
                )}</div>
              </div>
            `
            }
          </div>

          <!-- Selected Room Box & Compiled Topology Preview -->
          <div class="panel-card">
            <div class="card-header">
              <div>
                <h3 class="card-title">📦 Selected Room Topology: ${this._escape(selBoxName)}</h3>
                <div class="card-subtitle">Compiled linkages &amp; Wasp-in-a-Box seal eligibility from 2D floorplan</div>
              </div>
            </div>
            ${
              !selBox
                ? ""
                : `
              <div class="form-grid-4" style="margin-bottom:10px;">
                <div>
                  <label class="field-label">Box X</label>
                  <input type="number" class="num-input fp-box-field" data-room="${this._escape(
                    selBoxName
                  )}" data-key="x" value="${Number(selBox.x)}" />
                </div>
                <div>
                  <label class="field-label">Box Y</label>
                  <input type="number" class="num-input fp-box-field" data-room="${this._escape(
                    selBoxName
                  )}" data-key="y" value="${Number(selBox.y)}" />
                </div>
                <div>
                  <label class="field-label">Width</label>
                  <input type="number" class="num-input fp-box-field" data-room="${this._escape(
                    selBoxName
                  )}" data-key="width" value="${Number(selBox.width ?? selBox.w ?? 200)}" />
                </div>
                <div>
                  <label class="field-label">Height</label>
                  <input type="number" class="num-input fp-box-field" data-room="${this._escape(
                    selBoxName
                  )}" data-key="height" value="${Number(selBox.height ?? selBox.h ?? 150)}" />
                </div>
              </div>
              <div style="background:#090d16;border:1px solid #1e293b;border-radius:8px;padding:10px;font-size:11.5px;line-height:1.5;">
                <div>
                  <strong>Recommended Mode:</strong>
                  <span style="color:${
                    sealAnalysis[selBoxName]?.can_be_bounded ? "#c084fc" : "#38bdf8"
                  };font-weight:700;">
                    ${
                      sealAnalysis[selBoxName]?.can_be_bounded
                        ? "BOUNDED (All Exits Monitored by Door Sensors)"
                        : "OPEN (Has Open Passages / Stairs / Unmonitored Doors)"
                    }
                  </span>
                </div>
                ${
                  (sealAnalysis[selBoxName]?.unsealed_exits || []).length > 0
                    ? `<div style="margin-top:4px;color:#94a3b8;"><strong>Unsealed Exits:</strong> ${this._escape(
                        (sealAnalysis[selBoxName]?.unsealed_exits || []).join(", ")
                      )}</div>`
                    : ""
                }
                <div style="margin-top:6px;">
                  <strong>Connected Hand-Off Rooms (${
                    (connMap[selBoxName] || []).length
                  }):</strong>
                  <div class="chip-list" style="margin-top:4px;margin-bottom:0;">
                    ${
                      (connMap[selBoxName] || []).length === 0
                        ? `<span style="color:#64748b;">None</span>`
                        : (connMap[selBoxName] || [])
                            .map(
                              (rn) =>
                                `<span class="entity-chip" style="border-color:#10b981;color:#6ee7b7;">🔗 ${this._escape(
                                  rn
                                )}</span>`
                            )
                            .join("")
                    }
                  </div>
                </div>
              </div>
            `
            }
          </div>
        </div>
      </div>

      <!-- Bottom Card: Automated Ambiguity, Camera Spillover & Blind-Spot Report -->
      <div class="panel-card">
        <div class="card-header">
          <div>
            <h3 class="card-title">🔍 Automated Spatial Ambiguity, Camera Cone Spillover &amp; Blind-Spot Report (${
              ambiguities.length
            } Findings)</h3>
            <div class="card-subtitle">
              Derived directly from the 2D room boxes, passage linkages, and camera view cones above. Clicking <strong>⚡ Compile Floorplan &rarr; Apply Linkages &amp; Rules</strong> automatically configures these mitigations across all rooms.
            </div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          ${ambiguities
            .map((amb) => {
              const cat = amb.category || amb.type || "";
              const borderColor =
                cat === "camera_spillover"
                  ? "#f59e0b"
                  : cat === "unsealed_perimeter" || cat === "unsealed_boundary"
                  ? "#38bdf8"
                  : cat === "vertical_ble_bleed"
                  ? "#a855f7"
                  : "#f43f5e";
              const badgeLabel =
                cat === "camera_spillover"
                  ? "📐 CAMERA CONE SPILLOVER"
                  : cat === "unsealed_perimeter" || cat === "unsealed_boundary"
                  ? "🔓 UNSEALED EXIT PATHWAY"
                  : cat === "vertical_ble_bleed"
                  ? "📶 VERTICAL BLE STACK"
                  : "⚠️ BLIND POCKET / SENSOR GAP";
              const titleText = amb.title || amb.room || (amb.rooms || []).join(" ↔ ");
              return `
                <div style="background:#090d16;border:1px solid #1e293b;border-left:3px solid ${borderColor};border-radius:8px;padding:10px 12px;font-size:11.5px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;gap:6px;">
                    <strong style="color:#f8fafc;">${badgeLabel}: ${this._escape(titleText)}</strong>
                    <span style="font-size:10px;color:#94a3b8;font-family:monospace;">${this._escape(
                      amb.camera_id || amb.camera_entity || amb.severity || ""
                    )}</span>
                  </div>
                  <div style="color:#cbd5e1;line-height:1.45;margin-bottom:4px;">${this._escape(
                    amb.description
                  )}</div>
                  <div style="color:#34d399;font-size:11px;"><strong>Rule Mitigation:</strong> ${this._escape(
                    amb.resolution || amb.recommendation || ""
                  )}</div>
                </div>
              `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  _bindEvents() {
    const root = this.shadowRoot;
    const presets = (this._overview && this._overview.presets) || {};

    root.querySelectorAll(".mode-btn[data-studio-view]").forEach((el) => {
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

    // Floorplan view events
    root.querySelectorAll(".mode-btn[data-floor-id]").forEach((el) => {
      el.addEventListener("click", () => {
        this._selectedFloorId = el.getAttribute("data-floor-id") || "main";
        this._selectedCamEntity = null;
        this.render();
      });
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
    root.querySelector("#btn-add-connected-room")?.addEventListener("click", () => {
      const val = root.querySelector("#add-connected-room-input")?.value?.trim();
      if (!this._draftConfig.connected_rooms) this._draftConfig.connected_rooms = [];
      if (val && !this._draftConfig.connected_rooms.includes(val)) {
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

    root.querySelectorAll(".mode-btn[data-history-hours]").forEach((el) => {
      el.addEventListener("click", () => {
        this._historyHours = Number(el.getAttribute("data-history-hours") || 6);
        if (this._studioView === "statistics") {
          this.loadStatistics();
        } else if (this._studioView === "replay") {
          this.runReplay();
        }
      });
    });

    root.querySelector("#btn-reload-stats")?.addEventListener("click", () => this.loadStatistics());
    root.querySelector("#btn-jump-to-replay")?.addEventListener("click", () => {
      this._studioView = "replay";
      this._replayCandidate = JSON.parse(JSON.stringify(this._draftConfig || {}));
      this.runReplay();
    });

    // Replay Simulator events
    root.querySelector("#btn-replay-run")?.addEventListener("click", () => this.runReplay());
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
    root.querySelector("#rep-grace")?.addEventListener("change", (e) => {
      this._replayCandidate.grace_timeout = Number(e.target.value);
      this.runReplay();
    });
    root.querySelectorAll(".rep-obs-preset").forEach((el) => {
      el.addEventListener("change", () => {
        const idx = Number(el.getAttribute("data-idx"));
        const obs = this._replayCandidate?.bayesian_observations?.[idx];
        if (!obs) return;
        const p = el.value;
        obs.preset = p;
        if (presets[p] && p !== "custom") {
          obs.prob_given_true = presets[p].prob_given_true;
          obs.prob_given_false = presets[p].prob_given_false;
        }
        this.runReplay();
      });
    });
    root.querySelectorAll(".rep-obs-prob").forEach((el) => {
      el.addEventListener("change", () => {
        const idx = Number(el.getAttribute("data-idx"));
        const key = el.getAttribute("data-key");
        const obs = this._replayCandidate?.bayesian_observations?.[idx];
        if (!obs) return;
        obs[key] = Number(el.value);
        obs.preset = "custom";
        this.runReplay();
      });
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
