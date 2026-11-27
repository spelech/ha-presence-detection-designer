import { apiCall, loadOverview } from "./api-client.js";


export async function refreshPreview(panel) {
  if (!panel._draftConfig) return;
  try {
    const res = await apiCall(panel, 
      "POST",
      "/api/presence_detection_designer/preview_bayesian",
      { config: panel._draftConfig }
    );
    panel._previewData = res;
    panel._yamlDraft = res.designer_yaml || panel._yamlDraft;
    panel.render();
  } catch (err) {
    panel.showToast(`Preview failed: ${err.message}`, "error");
  }
}


export async function saveCurrentRoom(panel) {
  if (!panel._selectedRoomId || !panel._draftConfig) return;
  try {
    // Keep trigger_entities synced only with human-exclusive binary_sensors (SIGNAL-01)
    const obs = panel._draftConfig.bayesian_observations || [];
    const autoTriggers = (panel._draftConfig.trigger_entities || []).filter((eid) =>
      panel._isHumanExclusiveCandidate(eid)
    );
    for (const o of obs) {
      const preset = o.preset || o.weight || "moderate";
      if (
        (preset === "decisive" || preset === "strong") &&
        o.entity_id &&
        o.entity_id.startsWith("binary_sensor.") &&
        panel._isHumanExclusiveCandidate(o.entity_id) &&
        !autoTriggers.includes(o.entity_id)
      ) {
        autoTriggers.push(o.entity_id);
      }
    }
    panel._draftConfig.trigger_entities = autoTriggers;

    const res = await apiCall(panel, 
      "POST",
      `/api/presence_detection_designer/room/${panel._selectedRoomId}`,
      {
        config: panel._draftConfig,
        note: panel._revisionNote.trim() || "Saved room settings",
      }
    );
    if (res && res.room && panel._overview && Array.isArray(panel._overview.rooms)) {
      const idx = panel._overview.rooms.findIndex((r) => r.entry_id === panel._selectedRoomId);
      if (idx >= 0) panel._overview.rooms[idx] = res.room;
      panel._selectRoomObject(res.room, true);
    }
    panel.showToast(`Saved ${panel._draftConfig.room_name}`, "success");
  } catch (err) {
    panel.showToast(`Save failed: ${err.message}`, "error");
  }
}


export async function applyYamlDraft(panel) {
  if (!panel._selectedRoomId || !panel._yamlDraft.trim()) return;
  try {
    const saved = await apiCall(panel, 
      "POST",
      `/api/presence_detection_designer/room/${panel._selectedRoomId}`,
      {
        yaml_config: panel._yamlDraft,
        note: "Updated via YAML editor",
      }
    );
    if (saved && saved.room) {
      const idx = panel._overview.rooms.findIndex((r) => r.entry_id === panel._selectedRoomId);
      if (idx >= 0) panel._overview.rooms[idx] = saved.room;
      panel._selectRoomObject(saved.room, true);
    }
    panel.showToast("Applied YAML configuration", "success");
  } catch (err) {
    panel.showToast(`YAML error: ${err.message}`, "error");
  }
}


export async function rollbackRevision(panel, revIndex) {
  if (!panel._selectedRoomId) return;
  try {
    const res = await apiCall(panel, 
      "POST",
      `/api/presence_detection_designer/room/${panel._selectedRoomId}/rollback`,
      { revision_index: revIndex }
    );
    if (res && res.room) {
      const idx = panel._overview.rooms.findIndex((r) => r.entry_id === panel._selectedRoomId);
      if (idx >= 0) panel._overview.rooms[idx] = res.room;
      panel._selectRoomObject(res.room, true);
      panel.showToast("Restored previous room configuration", "success");
    }
  } catch (err) {
    panel.showToast(`Restore failed: ${err.message}`, "error");
  }
}


export async function runRoomAction(panel, action, extra = {}) {
  if (!panel._selectedRoomId) return;
  const targetRoomId = panel._selectedRoomId;
  if (action === "verify_presence") {
    panel._verifyingRoomId = targetRoomId;
    const vBtn = panel.shadowRoot?.querySelector?.("#btn-room-verify");
    if (vBtn) {
      vBtn.disabled = true;
      vBtn.textContent = "⏳ Checking...";
    }
    const vBadge = panel.shadowRoot?.querySelector?.("#cfg-verify-feedback");
    if (vBadge) {
      vBadge.textContent = "Capturing camera snapshot and running Vision AI check...";
      vBadge.style.color = "var(--ha-primary-text)";
    }
  }
  try {
    const res = await apiCall(panel, 
      "POST",
      `/api/presence_detection_designer/room/${targetRoomId}/action`,
      { action, ...extra }
    );
    if (action === "verify_presence") {
      panel._verifyingRoomId = null;
    }
    if (res && res.room) {
      if (action === "verify_presence") {
        const llm = res.room.last_llm_result || {};
        const reason = llm.reason || res.room.state_reason || res.room.last_transition_reason || "Check completed";
        const detected = Boolean(llm.person_detected ?? res.room.is_present);
        panel._lastVerifyFeedback = {
          ...(panel._lastVerifyFeedback || {}),
          [targetRoomId]: {
            ts: llm.timestamp || new Date().toISOString(),
            detected,
            reason,
            camera_entity: extra.camera_entity || res.room.config?.camera_entity || "",
          },
        };
      }
      const idx = panel._overview.rooms.findIndex((r) => r.entry_id === targetRoomId);
      if (idx >= 0) panel._overview.rooms[idx] = res.room;
      if (!panel._dirty) {
        panel._selectRoomObject(res.room, true);
      } else {
        panel.render();
      }
    }
    if (action === "verify_presence") {
      const fb = panel._lastVerifyFeedback?.[targetRoomId];
      if (fb) {
        const failedSnap = String(fb.reason || "").toLowerCase().includes("failed to capture");
        panel.showToast(
          `Vision AI (${fb.camera_entity || "camera"}): ${
            failedSnap ? fb.reason : `${fb.detected ? "Person detected" : "Clear"} — ${fb.reason}`
          }`,
          failedSnap ? "warning" : fb.detected ? "success" : "info"
        );
      } else {
        panel.showToast("Vision AI check completed", "success");
      }
    } else {
      panel.showToast("Updated room state", "success");
    }
  } catch (err) {
    if (action === "verify_presence") {
      panel._verifyingRoomId = null;
      panel.render();
    }
    panel.showToast(`Action failed: ${err.message}`, "error");
  }
}


export async function runTranslation(panel, direction) {
  const room = panel.selectedRoom;
  if (!room) return;
  try {
    const payload = {
      entry_id: room.entry_id,
      room_name: panel._draftConfig.room_name || room.room_name,
      direction,
      description: direction === "nl_to_yaml" ? panel._nlPrompt : undefined,
      yaml_config: direction === "yaml_to_nl" ? panel._draftConfig : undefined,
      use_llm: true,
    };
    const res = await apiCall(panel, "POST", "/api/presence_detection_designer/translate", payload);
    if (direction === "nl_to_yaml" && res && res.normalized_config) {
      panel._draftConfig = { ...panel._draftConfig, ...res.normalized_config };
      panel._dirty = true;
      panel._nlOutput = res.natural_language || "Generated updated rules.";
      await refreshPreview(panel);
      panel.showToast("Generated room rules from description", "success");
    } else if (res) {
      panel._nlOutput = res.natural_language || res.rule_guide || "";
      panel.render();
    }
  } catch (err) {
    panel.showToast(`Translation failed: ${err.message}`, "error");
  }
}


export async function saveGlobalSettings(panel) {
  if (!panel._globalDraft) return;
  try {
    const payload = { ...panel._globalDraft };
    delete payload.house_occupant_count;
    delete payload.house_occupancy_mode;
    const res = await apiCall(panel, 
      "POST",
      "/api/presence_detection_designer/global_settings",
      payload
    );
    if (typeof panel._globalDraft?.ui_advanced_mode === "boolean") {
      panel._saveLocalAdvancedMode(panel._globalDraft.ui_advanced_mode);
    }
    if (res && res.global_settings) {
      panel._globalDraft = { ...res.global_settings };
      if (panel._overview) {
        panel._overview.global_settings = res.global_settings;
      }
    }
    panel._showGlobalModal = false;
    panel.render();
    panel.showToast("Saved global settings", "success");
  } catch (err) {
    panel.showToast(`Failed to save global settings: ${err.message}`, "error");
  }
}

