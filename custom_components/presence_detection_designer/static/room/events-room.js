// Event bindings for navigation, room sidebar, room header, sensors, boundaries, and YAML/AI.

export function bindRoomEvents(panel, root, presets) {

  root.querySelectorAll(".nav-tab[data-studio-view]").forEach((el) => {
    el.addEventListener("click", () => {
      const v = el.getAttribute("data-studio-view");
      panel._studioView = v;
      panel.render();
      if (v === "statistics") {
        panel.loadStatistics();
      } else if (v === "replay") {
        if (!panel._replayCandidate && panel._draftConfig) {
          panel._replayCandidate = JSON.parse(JSON.stringify(panel._draftConfig));
        }
        panel.runReplay();
      } else if (v === "timeline") {
        panel.loadTimeline();
      } else if (v === "floorplan" && !panel._floorplan) {
        panel.loadFloorplan();
      }
    });
  });

  // Editor tab navigation (tabs + quick state-chart jump pills)
  root.querySelectorAll("[data-editor-tab]").forEach((el) => {
    el.addEventListener("click", () => {
      panel._editorTab = el.getAttribute("data-editor-tab") || "setup";
      panel.render();
    });
  });

  // Sidebar: Add Room button
  root.querySelector("#btn-add-new-room")?.addEventListener("click", () => {
    const url = "/config/integrations/dashboard/add?domain=presence_detection_designer";
    if (window.top && window.top.location) {
      window.top.location.href = url;
    } else {
      window.location.href = url;
    }
  });

  // Advanced drawer toggle & tabs
  root.querySelector("#btn-toggle-advanced")?.addEventListener("click", () => {
    panel._showAdvanced = !panel._showAdvanced;
    panel.render();
  });
  root.querySelectorAll(".sub-tab[data-adv-tab]").forEach((el) => {
    el.addEventListener("click", () => {
      panel._advTab = el.getAttribute("data-adv-tab") || "tuning";
      panel.render();
    });
  });

  // Simple Sensor Role selector & Add Sensor
  root.querySelectorAll(".obs-role-simple").forEach((el) => {
    el.addEventListener("change", () => {
      const idx = Number(el.getAttribute("data-idx"));
      const obs = panel._draftConfig?.bayesian_observations?.[idx];
      if (!obs) return;
      panel._applyFriendlyRoleGroup(obs, el.value, presets);
      panel._dirty = true;
      panel.refreshPreview();
    });
  });

  root.querySelector("#btn-simple-add-obs")?.addEventListener("click", () => {
    const entityInput = root.querySelector("#simple-add-obs-entity");
    const roleSelect = root.querySelector("#simple-add-obs-role");
    const eid = entityInput?.value?.trim() || "";
    if (!eid) {
      panel.showToast("Select a sensor entity to add", "info");
      return;
    }
    const entities = (panel._overview && panel._overview.entities) || [];
    const found = entities.find((e) => e.entity_id === eid);
    const newObs = {
      entity_id: eid,
      label: found?.name || eid,
      operator: "equals",
      state: "on",
    };
    let chosenRole = roleSelect?.value || "shared";
    if (!panel._isHumanExclusiveCandidate(eid) && chosenRole !== "keepalive") {
      chosenRole = "keepalive";
      panel.showToast("Non-human signal assigned Supporting Hold role (SIGNAL-01)", "info");
    }
    panel._applyFriendlyRoleGroup(newObs, chosenRole, presets);
    panel._draftConfig.bayesian_observations.push(newObs);
    panel._dirty = true;
    panel.refreshPreview();
  });

  // Bounded Door Toggle
  root.querySelector("#cfg-bounded-toggle")?.addEventListener("change", (e) => {
    panel._draftConfig.mode = e.target.checked ? "bounded" : "open";
    if (!e.target.checked) {
      panel._draftConfig.boundary_entities = [];
    }
    panel._dirty = true;
    panel.refreshPreview();
  });

  // Connected room dropdown auto-add on select
  root.querySelector("#add-connected-room-input")?.addEventListener("change", (e) => {
    const val = e.target.value?.trim();
    if (!val) return;
    if (!panel._draftConfig.connected_rooms) panel._draftConfig.connected_rooms = [];
    if (!panel._draftConfig.connected_rooms.includes(val)) {
      panel._draftConfig.connected_rooms.push(val);
      panel._dirty = true;
      panel.refreshPreview();
    }
  });

  root.querySelectorAll(".del-connected-room").forEach((el) => {
    el.addEventListener("click", () => {
      const idx = Number(el.getAttribute("data-idx"));
      if (Array.isArray(panel._draftConfig.connected_rooms)) {
        panel._draftConfig.connected_rooms.splice(idx, 1);
        panel._dirty = true;
        panel.refreshPreview();
      }
    });
  });


  // Room Header & Core Controls
  root.querySelector("#btn-save-room")?.addEventListener("click", () => panel.saveCurrentRoom());
  root.querySelector("#btn-room-refresh")?.addEventListener("click", () =>
    panel.runRoomAction("force_refresh")
  );
  root.querySelector("#btn-room-verify")?.addEventListener("click", () => {
    const camEntity =
      root.querySelector("#cfg-camera-entity")?.value ??
      panel._draftConfig?.camera_entity ??
      panel.selectedRoom?.config?.camera_entity ??
      "";
    if (!String(camEntity).trim()) {
      panel.showToast("Select a Primary AI Vision Camera first to run a Check.", "warning");
      return;
    }
    panel.runRoomAction("verify_presence", { camera_entity: String(camEntity).trim() });
  });
  root.querySelector("#btn-room-override")?.addEventListener("click", () =>
    panel.runRoomAction("set_override")
  );
  root.querySelector("#btn-refresh-state-graph")?.addEventListener("click", () =>
    panel._refreshStateGraph(panel._selectedRoomId)
  );
  root.querySelector("#btn-copy-mermaid")?.addEventListener("click", () => {
    const sel = (panel._overview?.rooms || []).find((r) => r.entry_id === panel._selectedRoomId);
    const src = sel?.mermaid_diagram || "";
    if (src && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(src);
      panel.showToast("Copied live Mermaid diagram to clipboard", "success");
    }
  });

  root.querySelector("#cfg-area-id")?.addEventListener("change", (e) => {
    panel._draftConfig.area_id = e.target.value || null;
    panel._dirty = true;
    panel.render();
  });
  root.querySelector("#cfg-camera-entity")?.addEventListener("change", (e) => {
    panel._draftConfig.camera_entity = e.target.value;
    panel._dirty = true;
    panel.render();
  });
  root.querySelector("#cfg-prior-slider")?.addEventListener("change", (e) => {
    panel._draftConfig.bayesian_prior = Number(e.target.value) / 100.0;
    panel._dirty = true;
    panel.refreshPreview();
  });
  root.querySelector("#cfg-thresh-slider")?.addEventListener("change", (e) => {
    panel._draftConfig.bayesian_threshold = Number(e.target.value) / 100.0;
    panel._dirty = true;
    panel.refreshPreview();
  });
  root.querySelector("#cfg-inactivity-timeout")?.addEventListener("change", (e) => {
    panel._draftConfig.inactivity_timeout = Number(e.target.value);
    panel._dirty = true;
    panel.render();
  });
  root.querySelector("#cfg-max-hold-timeout")?.addEventListener("change", (e) => {
    panel._draftConfig.max_hold_timeout = Math.max(60, Number(e.target.value) || 1800);
    panel._dirty = true;
    panel.render();
  });
  root.querySelector("#cfg-pir-validation-enabled")?.addEventListener("change", (e) => {
    panel._draftConfig.pir_validation_enabled = Boolean(e.target.checked);
    panel._dirty = true;
    panel.render();
  });
  root.querySelector("#cfg-pir-candidate-window")?.addEventListener("change", (e) => {
    panel._draftConfig.pir_candidate_window = Math.max(3, Number(e.target.value) || 15);
    panel._dirty = true;
    panel.render();
  });

  root.querySelector("#cfg-notify-slack")?.addEventListener("change", (e) => {
    panel._draftConfig.notify_slack = e.target.checked;
    panel._dirty = true;
    panel.render();
  });
  root.querySelector("#cfg-notify-on-occupied")?.addEventListener("change", (e) => {
    panel._draftConfig.notify_on_occupied = e.target.checked;
    panel._dirty = true;
  });
  root.querySelector("#cfg-notify-on-cleared")?.addEventListener("change", (e) => {
    panel._draftConfig.notify_on_cleared = e.target.checked;
    panel._dirty = true;
  });
  root.querySelector("#cfg-include-camera-snapshot")?.addEventListener("change", (e) => {
    panel._draftConfig.include_camera_snapshot = e.target.checked;
    panel._dirty = true;
  });

  root.querySelector("#btn-add-ble")?.addEventListener("click", () => {
    const rname = panel._draftConfig.room_name || "Room";
    const trackers =
      (panel._overview &&
        panel._overview.global_settings &&
        panel._overview.global_settings.ble_trackers) || [
        "sensor.resident_a_phone_ble_area",
      ];
    const obs = panel._draftConfig.bayesian_observations || [];
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
    panel._draftConfig.bayesian_observations = obs;
    panel._dirty = true;
    panel.refreshPreview();
  });

  root.querySelector("#btn-sync-triggers")?.addEventListener("click", () => {
    const obs = panel._draftConfig.bayesian_observations || [];
    const triggers = [];
    for (const o of obs) {
      const preset = o.preset || o.weight || "moderate";
      if (
        (preset === "decisive" || preset === "strong") &&
        o.entity_id &&
        o.entity_id.startsWith("binary_sensor.") &&
        panel._isHumanExclusiveCandidate(o.entity_id)
      ) {
        if (!triggers.includes(o.entity_id)) triggers.push(o.entity_id);
      }
    }
    panel._draftConfig.trigger_entities = triggers;
    panel._dirty = true;
    panel.showToast(`Synced ${triggers.length} person-coupled triggers`, "info");
  });

  root.querySelectorAll(".btn-copy-auto").forEach((el) => {
    el.addEventListener("click", () => {
      const tid = el.getAttribute("data-auto-target");
      const ta = tid ? root.querySelector(`#${tid}`) : null;
      if (ta && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(ta.value || "");
        panel.showToast("Copied automation YAML to clipboard", "success");
      }
    });
  });

  root.querySelectorAll(".obs-field").forEach((el) => {
    el.addEventListener("change", () => {
      const idx = Number(el.getAttribute("data-idx"));
      const key = el.getAttribute("data-key");
      const obs = panel._draftConfig.bayesian_observations[idx];
      if (!obs) return;
      obs[key] = el.value;
      panel._dirty = true;
      panel.refreshPreview();
    });
  });

  root.querySelectorAll(".obs-preset").forEach((el) => {
    el.addEventListener("change", () => {
      const idx = Number(el.getAttribute("data-idx"));
      const obs = panel._draftConfig.bayesian_observations[idx];
      if (!obs) return;
      const p = el.value;
      obs.preset = p;
      if (presets[p] && p !== "custom") {
        obs.prob_given_true = presets[p].prob_given_true;
        obs.prob_given_false = presets[p].prob_given_false;
        delete obs.cooldown_weighted;
        delete obs.signal_weighted;
      }
      panel._dirty = true;
      panel.refreshPreview();
    });
  });

  root.querySelectorAll(".obs-prob").forEach((el) => {
    el.addEventListener("change", () => {
      const idx = Number(el.getAttribute("data-idx"));
      const key = el.getAttribute("data-key");
      const obs = panel._draftConfig.bayesian_observations[idx];
      if (!obs) return;
      obs[key] = Number(el.value);
      obs.preset = "custom";
      panel._dirty = true;
      panel.refreshPreview();
    });
  });

  root.querySelectorAll(".obs-del").forEach((el) => {
    el.addEventListener("click", () => {
      const idx = Number(el.getAttribute("data-idx"));
      panel._draftConfig.bayesian_observations.splice(idx, 1);
      panel._dirty = true;
      panel.refreshPreview();
    });
  });

  // Boundaries & Sustaining Conditions
  root.querySelector("#btn-add-boundary")?.addEventListener("click", () => {
    const val = root.querySelector("#add-boundary-input")?.value?.trim();
    if (val && !panel._draftConfig.boundary_entities.includes(val)) {
      panel._draftConfig.boundary_entities.push(val);
      panel._dirty = true;
      panel.refreshPreview();
    }
  });
  root.querySelectorAll(".del-boundary").forEach((el) => {
    el.addEventListener("click", () => {
      const idx = Number(el.getAttribute("data-idx"));
      panel._draftConfig.boundary_entities.splice(idx, 1);
      panel._dirty = true;
      panel.refreshPreview();
    });
  });

  root.querySelector("#btn-add-condition")?.addEventListener("click", () => {
    panel._draftConfig.sustaining_conditions.push({
      entity_id: "",
      label: "Keep Occupied Rule",
      operator: "equals",
      state: "playing",
    });
    panel._dirty = true;
    panel.render();
  });
  root.querySelectorAll(".cond-field").forEach((el) => {
    el.addEventListener("change", () => {
      const idx = Number(el.getAttribute("data-idx"));
      const key = el.getAttribute("data-key");
      const cond = panel._draftConfig.sustaining_conditions[idx];
      if (!cond) return;
      cond[key] = el.value;
      panel._dirty = true;
      panel.refreshPreview();
    });
  });
  root.querySelectorAll(".cond-del").forEach((el) => {
    el.addEventListener("click", () => {
      const idx = Number(el.getAttribute("data-idx"));
      panel._draftConfig.sustaining_conditions.splice(idx, 1);
      panel._dirty = true;
      panel.refreshPreview();
    });
  });

  // Advanced YAML & AI sub-tabs
  root.querySelectorAll("[data-rtab]").forEach((el) => {
    el.addEventListener("click", () => {
      panel._rightTab = el.getAttribute("data-rtab");
      panel.render();
    });
  });
  root.querySelector("#yaml-draft-editor")?.addEventListener("input", (e) => {
    panel._yamlDraft = e.target.value;
  });
  root.querySelector("#btn-apply-yaml")?.addEventListener("click", () => panel.applyYamlDraft());
  root.querySelector("#nl-prompt-input")?.addEventListener("input", (e) => {
    panel._nlPrompt = e.target.value;
  });
  root.querySelector("#btn-nl-to-yaml")?.addEventListener("click", () =>
    panel.runTranslation("nl_to_yaml")
  );
  root.querySelector("#btn-yaml-to-nl")?.addEventListener("click", () =>
    panel.runTranslation("yaml_to_nl")
  );
  root.querySelectorAll(".btn-rollback").forEach((el) => {
    el.addEventListener("click", () => {
      const idx = Number(el.getAttribute("data-rev-idx"));
      panel.rollbackRevision(idx);
    });
  });
}
