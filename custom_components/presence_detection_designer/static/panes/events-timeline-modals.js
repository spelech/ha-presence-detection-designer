// Event bindings for timeline playback, replay simulator, and global settings modal.

export function bindTimelineAndModalEvents(panel, root) {
  // Whole-House Timeline & Playback events
  root.querySelector("#btn-reload-timeline")?.addEventListener("click", () => {
    panel.loadTimeline();
  });
  root.querySelector("#btn-timeline-toggle-neg-space")?.addEventListener("click", () => {
    panel._timelineNegativeSpace = !panel._timelineNegativeSpace;
    panel.loadTimeline(panel._timelineHours, panel._timelineNegativeSpace);
  });
  root.querySelectorAll(".seg-btn[data-timeline-hours]").forEach((el) => {
    el.addEventListener("click", () => {
      panel._timelineHours = Number(el.getAttribute("data-timeline-hours") || 6);
      panel.loadTimeline(panel._timelineHours, panel._timelineNegativeSpace);
    });
  });
  root.querySelector("#btn-tl-play")?.addEventListener("click", () => {
    panel._toggleTimelinePlay();
  });
  root.querySelector("#btn-tl-prev")?.addEventListener("click", () => {
    if (panel._timelinePlaying) panel._toggleTimelinePlay(false);
    panel._timelineFrameIdx = Math.max(0, Number(panel._timelineFrameIdx || 0) - 1);
    if (!panel._updateTimelineFrameInPlace()) panel.render();
  });
  root.querySelector("#btn-tl-next")?.addEventListener("click", () => {
    if (panel._timelinePlaying) panel._toggleTimelinePlay(false);
    const maxIdx = Math.max(0, (panel._timelineData?.frames?.length || 1) - 1);
    panel._timelineFrameIdx = Math.min(maxIdx, Number(panel._timelineFrameIdx || 0) + 1);
    if (!panel._updateTimelineFrameInPlace()) panel.render();
  });
  root.querySelectorAll(".tl-speed-btn[data-tl-speed]").forEach((el) => {
    el.addEventListener("click", () => {
      panel._timelineSpeed = Number(el.getAttribute("data-tl-speed") || 1);
      root.querySelectorAll(".tl-speed-btn[data-tl-speed]").forEach((btn) => {
        btn.classList.toggle("active", Number(btn.getAttribute("data-tl-speed") || 1) === panel._timelineSpeed);
      });
      if (panel._timelinePlaying) {
        panel._toggleTimelinePlay(false);
        panel._toggleTimelinePlay(true);
      }
    });
  });
  root.querySelectorAll(".seg-btn[data-tl-floor]").forEach((el) => {
    el.addEventListener("click", () => {
      panel._timelineFloor = el.getAttribute("data-tl-floor") || "all";
      if (panel._timelineFloor !== "all") {
        panel._selectedFloorId = panel._timelineFloor;
      }
      panel.render();
    });
  });
  root.querySelector("#tl-scrubber-slider")?.addEventListener("input", (e) => {
    if (panel._timelinePlaying) panel._toggleTimelinePlay(false);
    panel._timelineFrameIdx = Number(e.target.value || 0);
    if (!panel._updateTimelineFrameInPlace()) panel.render();
  });
  root.querySelectorAll(".tl-transition-row[data-frame-idx]").forEach((el) => {
    el.addEventListener("click", () => {
      if (panel._timelinePlaying) panel._toggleTimelinePlay(false);
      panel._timelineFrameIdx = Number(el.getAttribute("data-frame-idx") || 0);
      if (!panel._updateTimelineFrameInPlace()) panel.render();
    });
  });

  // Replay Simulator events
  root.querySelector("#btn-replay-reset")?.addEventListener("click", () => {
    panel._replayCandidate = JSON.parse(JSON.stringify(panel._draftConfig || {}));
    panel.runReplay();
  });
  root.querySelector("#btn-replay-apply")?.addEventListener("click", () =>
    panel.applyReplayCandidate()
  );
  root.querySelector("#rep-prior-slider")?.addEventListener("change", (e) => {
    panel._replayCandidate.bayesian_prior = Number(e.target.value) / 100.0;
    panel.runReplay();
  });
  root.querySelector("#rep-thresh-slider")?.addEventListener("change", (e) => {
    panel._replayCandidate.bayesian_threshold = Number(e.target.value) / 100.0;
    panel.runReplay();
  });
  root.querySelector("#rep-inactivity")?.addEventListener("change", (e) => {
    panel._replayCandidate.inactivity_timeout = Number(e.target.value);
    panel.runReplay();
  });
  root.querySelector("#rep-neg-space-toggle")?.addEventListener("change", (e) => {
    panel._replayNegativeSpace = Boolean(e.target.checked);
    panel.runReplay();
  });

  root.querySelector("#btn-toggle-ha-sidebar")?.addEventListener("click", () => {
    panel.dispatchEvent(new CustomEvent("hass-toggle-menu", { bubbles: true, composed: true }));
  });
  root.querySelector("#btn-refresh-overview")?.addEventListener("click", () => {
    panel.loadOverview(true);
  });
  root.querySelector("#btn-open-global")?.addEventListener("click", () => {
    panel._showGlobalModal = true;
    panel.render();
  });
  root.querySelector("#btn-header-global")?.addEventListener("click", () => {
    panel._showGlobalModal = true;
    panel.render();
  });
  root.querySelector("#btn-open-adv-settings-link")?.addEventListener("click", () => {
    panel._settingsTab = "interface";
    panel._showGlobalModal = true;
    panel.render();
  });
  root.querySelector("#btn-open-adv-settings-card")?.addEventListener("click", () => {
    panel._settingsTab = "interface";
    panel._showGlobalModal = true;
    panel.render();
  });
  root.querySelectorAll("[data-settings-tab]").forEach((el) => {
    el.addEventListener("click", () => {
      panel._settingsTab = el.getAttribute("data-settings-tab") || "interface";
      root.querySelectorAll("[data-settings-tab]").forEach((b) =>
        b.classList.toggle("active", b.getAttribute("data-settings-tab") === panel._settingsTab)
      );
      root.querySelectorAll("[data-settings-pane]").forEach((p) =>
        p.classList.toggle("active", p.getAttribute("data-settings-pane") === panel._settingsTab)
      );
    });
  });
  root.querySelector("#btn-jump-edit-selected-room")?.addEventListener("click", () => {
    panel._studioView = "design";
    panel.render();
  });
  root.querySelectorAll("[data-room-badge-id]").forEach((el) => {
    el.addEventListener("click", () => {
      const rid = el.getAttribute("data-room-badge-id");
      const room = (panel._overview?.rooms || []).find((r) => r.entry_id === rid);
      if (room) panel._selectRoomObject(room, true);
    });
  });
  root.querySelector("#btn-quick-toggle-guest-mode")?.addEventListener("click", async () => {
    const curVal =
      panel._globalDraft?.guest_mode_enabled !== undefined
        ? Boolean(panel._globalDraft.guest_mode_enabled)
        : Boolean(panel._overview?.global_settings?.guest_mode_enabled);
    const nextVal = !curVal;
    panel._globalDraft = {
      ...panel._globalDraft,
      guest_mode_enabled: nextVal,
    };
    await panel.saveGlobalSettings();
    await panel.loadOverview(true);
  });
  root.querySelector("#btn-quick-toggle-neg-space")?.addEventListener("click", async () => {
    const curVal =
      panel._globalDraft?.negative_space_enabled !== undefined
        ? Boolean(panel._globalDraft.negative_space_enabled)
        : panel._overview?.global_settings?.negative_space_enabled !== undefined
        ? Boolean(panel._overview.global_settings.negative_space_enabled)
        : true;
    const nextVal = !curVal;
    panel._globalDraft = {
      ...panel._globalDraft,
      negative_space_enabled: nextVal,
    };
    panel._timelineNegativeSpace = nextVal;
    panel._replayNegativeSpace = nextVal;
    await panel.saveGlobalSettings();
    if (panel._studioView === "timeline") {
      panel.loadTimeline(panel._timelineHours, nextVal);
    } else if (panel._studioView === "replay") {
      panel.runReplay();
    }
  });
  root.querySelector("#btn-close-global")?.addEventListener("click", () => {
    panel._showGlobalModal = false;
    panel.render();
  });
  root.querySelector("#btn-cancel-global")?.addEventListener("click", () => {
    panel._showGlobalModal = false;
    panel.render();
  });
  root.querySelector("#btn-save-global")?.addEventListener("click", () => {
    panel._globalDraft = {
      ...panel._globalDraft,
      llm_provider_type: root.querySelector("#gl-provider")?.value || "vision_api",
      llm_api_url: root.querySelector("#gl-api-url")?.value || "",
      llm_model: root.querySelector("#gl-model")?.value || "",
      llm_agent_id: root.querySelector("#gl-agent-id")?.value || "",
      ble_trackers: (root.querySelector("#gl-ble")?.value || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      notifications_enabled: Boolean(root.querySelector("#gl-notify-enabled")?.checked),
      notify_service: root.querySelector("#gl-notify-service")?.value || "",
      notify_target: root.querySelector("#gl-notify-target")?.value || "",
      notify_verbosity: root.querySelector("#gl-notify-verbosity")?.value || "compact",
      negative_space_enabled: Boolean(root.querySelector("#gl-neg-space-enabled")?.checked),
      guest_mode_enabled: Boolean(root.querySelector("#gl-guest-mode-enabled")?.checked),
      ble_decider_enabled: Boolean(root.querySelector("#gl-ble-decider-enabled")?.checked),
      pir_validation_enabled: Boolean(root.querySelector("#gl-pir-validation-enabled")?.checked !== false),
      pir_candidate_window: Math.max(
        3,
        Number(root.querySelector("#gl-pir-candidate-window")?.value ?? 15)
      ),
      ui_advanced_mode: Boolean(root.querySelector("#gl-ui-advanced-mode")?.checked),
    };
    panel.saveGlobalSettings();
  });

  root.querySelector("#btn-test-notify-alert")?.addEventListener("click", async () => {
    const btn = root.querySelector("#btn-test-notify-alert");
    if (btn) btn.disabled = true;
    try {
      const service = root.querySelector("#gl-notify-service")?.value || "";
      const target = root.querySelector("#gl-notify-target")?.value || "";
      const verbosity = root.querySelector("#gl-notify-verbosity")?.value || "compact";
      const res = await panel._apiCall("POST", "/api/presence_detection_designer/notifications/test", {
        notify_service: service,
        notify_target: target,
        notify_verbosity: verbosity,
      });
      panel.showToast(res?.message || "Test notification dispatched!", "success");
    } catch (err) {
      panel.showToast("Failed to send test alert: " + (err.message || err), "error");
    } finally {
      if (btn) btn.disabled = false;
    }
  });

  root.querySelector("#room-search-input")?.addEventListener("input", (e) => {
    panel._roomSearch = e.target.value;
    panel.render();
  });
  root.querySelectorAll(".seg-btn[data-filter]").forEach((el) => {
    el.addEventListener("click", () => {
      panel._roomFilter = el.getAttribute("data-filter");
      panel.render();
    });
  });
  root.querySelectorAll(".room-row[data-room-id]").forEach((el) => {
    el.addEventListener("click", () => {
      const rid = el.getAttribute("data-room-id");
      const room = (panel._overview?.rooms || []).find((r) => r.entry_id === rid);
      if (room) panel._selectRoomObject(room, true);
    });
  });

}
