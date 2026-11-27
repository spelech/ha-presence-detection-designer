// Core Home Assistant API client, overview, floorplan, analytics, and replay calls.


export async function apiCall(panel, method, path, body = null) {
  if (window.__PDD_MOCK_API__) {
    return window.__PDD_MOCK_API__(method, path, body);
  }
  if (panel._hass && typeof panel._hass.callApi === "function") {
    const cleanPath = path.replace(/^\/api\//, "");
    return await panel._hass.callApi(method, cleanPath, body);
  }
  const headers = { "Content-Type": "application/json" };
  if (panel._hass && panel._hass.auth && panel._hass.auth.data && panel._hass.auth.data.access_token) {
    headers["Authorization"] = `Bearer ${panel._hass.auth.data.access_token}`;
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


export async function loadOverview(panel, preserveSelection = true) {
  panel._loading = true;
  try {
    const data = await apiCall(panel, "GET", "/api/presence_detection_designer/overview");
    panel._overview = data;
    panel._globalDraft = JSON.parse(JSON.stringify(data.global_settings || {}));
    if (data.floorplan && !panel._activeFpDrag && !panel._fpDirty) {
      panel._floorplan = JSON.parse(JSON.stringify(data.floorplan));
    } else if (!panel._floorplan) {
      panel._floorplan = panel._loadLocalOrDefaultFloorplan();
    }
    if (data.compiled_topology) {
      panel._compiledTopology = data.compiled_topology;
    } else {
      panel._compiledTopology = panel._compileFloorplanClient(panel._floorplan);
    }
    const rooms = data.rooms || [];
    if (rooms.length > 0) {
      const exists =
        preserveSelection &&
        panel._selectedRoomId &&
        rooms.some((r) => r.entry_id === panel._selectedRoomId);
      const targetRoom = exists
        ? rooms.find((r) => r.entry_id === panel._selectedRoomId)
        : rooms[0];
      panel._selectRoomObject(targetRoom, false);
    }
  } catch (err) {
    panel.showToast(`Failed to load rooms: ${err.message}`, "error");
  } finally {
    panel._loading = false;
    panel.render();
  }
}


export async function loadFloorplan(panel) {
  try {
    const res = await apiCall(panel, "GET", "/api/presence_detection_designer/floorplan");
    if (res && res.floorplan) {
      panel._floorplan = res.floorplan;
      panel._compiledTopology =
        res.compiled_topology || panel._compileFloorplanClient(panel._floorplan);
    }
  } catch (_err) {
    if (!panel._floorplan) {
      panel._floorplan = panel._loadLocalOrDefaultFloorplan();
    }
    panel._compiledTopology = panel._compileFloorplanClient(panel._floorplan);
  }
  panel.render();
}


export async function saveOrCompileFloorplan(panel, action = "save") {
  try {
    const res = await apiCall(panel, "POST", "/api/presence_detection_designer/floorplan", {
      action,
      floorplan: panel._floorplan,
    });
    if (res && res.floorplan) {
      panel._floorplan = res.floorplan;
      panel._fpDirty = false;
      panel._compiledTopology =
        res.compiled_topology || panel._compileFloorplanClient(panel._floorplan);
      try {
        window.localStorage.setItem("pdd_floorplan_layout_v4", JSON.stringify(panel._floorplan));
      } catch (_e) {}
    }
    if (res && Array.isArray(res.updated_rooms) && res.updated_rooms.length > 0 && panel._overview) {
      for (const ur of res.updated_rooms) {
        const idx = (panel._overview.rooms || []).findIndex((r) => r.entry_id === ur.entry_id);
        if (idx >= 0) {
          panel._overview.rooms[idx] = ur;
        }
      }
      const cur = panel.selectedRoom;
      if (cur) panel._selectRoomObject(cur, false);
    }
    panel.render();
    if (action === "compile_and_apply") {
      panel.showToast(
        `Updated room connections and camera coverage rules across ${(res?.updated_rooms || []).length} rooms`,
        "success"
      );
    } else if (action === "reset") {
      panel.showToast("Reset floorplan to default layout", "info");
    } else {
      panel.showToast("Saved floorplan layout", "success");
    }
  } catch (_err) {
    // Fallback when backend HTTP route has not been reloaded yet
    if (action === "reset") {
      panel._floorplan = panel._getDefaultFloorplan();
      try {
        window.localStorage.removeItem("pdd_floorplan_layout_v4");
        window.localStorage.removeItem("pdd_floorplan_layout_v1");
      } catch (_e) {}
      panel._compiledTopology = panel._compileFloorplanClient(panel._floorplan);
      panel.render();
      panel.showToast("Reset floorplan to default layout", "info");
      return;
    }
    try {
      window.localStorage.setItem("pdd_floorplan_layout_v4", JSON.stringify(panel._floorplan));
    } catch (_e) {}
    panel._compiledTopology = panel._compileFloorplanClient(panel._floorplan);
    if (action === "compile_and_apply" && panel._overview && Array.isArray(panel._overview.rooms)) {
      const connMap = panel._compiledTopology?.connected_rooms_map || {};
      let updatedCount = 0;
      for (let i = 0; i < panel._overview.rooms.length; i++) {
        const rm = panel._overview.rooms[i];
        const rName = rm.room_name;
        if (Array.isArray(connMap[rName])) {
          const nextCfg = JSON.parse(JSON.stringify(rm.config || {}));
          nextCfg.connected_rooms = [...connMap[rName]];
          try {
            const saved = await apiCall(panel, 
              "POST",
              `/api/presence_detection_designer/room/${rm.entry_id}`,
              { config: nextCfg, note: "Updated connections from Floorplan" }
            );
            if (saved && saved.room) {
              panel._overview.rooms[i] = saved.room;
            }
            updatedCount++;
          } catch (_roomErr) {}
        }
      }
      const cur = panel.selectedRoom;
      if (cur) panel._selectRoomObject(cur, false);
      panel.render();
      panel.showToast(`Updated room connections across ${updatedCount} rooms`, "success");
      return;
    }
    panel.render();
    panel.showToast("Saved floorplan layout", "success");
  }
}


export function debounceSaveFloorplan(panel) {
  panel._fpDirty = true;
  clearTimeout(panel._saveFpTimeout);
  panel._saveFpTimeout = setTimeout(() => {
    try {
      if (window.localStorage && panel._floorplan) {
        window.localStorage.setItem("pdd_floorplan_layout_v4", JSON.stringify(panel._floorplan));
      }
    } catch (_e) {}
  }, 300);
  clearTimeout(panel._saveFpServerTimeout);
  panel._saveFpServerTimeout = setTimeout(async () => {
    if (!panel._floorplan || panel._activeFpDrag) return;
    try {
      panel._fpSaving = true;
      await apiCall(panel, "POST", "/api/presence_detection_designer/floorplan", {
        action: "save",
        floorplan: panel._floorplan,
      });
      panel._fpDirty = false;
    } catch (_e) {
      // Offline / route unavailable fallback keeps localStorage
    } finally {
      panel._fpSaving = false;
      const badge = panel.shadowRoot?.querySelector("#fp-save-state");
      if (badge) {
        badge.textContent = panel._fpDirty ? "Unsaved" : "Saved ✓";
        badge.className = `fp-save-badge ${panel._fpDirty ? "dirty" : "saved"}`;
      }
    }
  }, 900);
}


export async function analyzeCameraAlignment(panel, camId) {
  if (!camId) return;
  panel._analyzingCamera = true;
  panel._cameraAlignmentError = null;
  panel._cameraAlignmentResult = null;
  panel.render();

  try {
    const cam = (panel._floorplan?.cameras || []).find(
      (c) => (c.id || c.camera_entity) === camId
    );
    if (!cam) throw new Error("Camera not found in floorplan");

    const res = await apiCall(panel, 
      "POST",
      `/api/presence_detection_designer/camera/${encodeURIComponent(camId)}/align`,
      { camera_dict: cam }
    );
    if (res && res.error) {
      throw new Error(res.error);
    }
    panel._cameraAlignmentResult = res;
    panel.showToast("Camera perspective and openings analyzed successfully", "success");
  } catch (err) {
    panel._cameraAlignmentError = String(err.message || err);
    panel.showToast(`Alignment failed: ${panel._cameraAlignmentError}`, "danger");
  } finally {
    panel._analyzingCamera = false;
    panel.render();
  }
}


export async function loadStatistics(panel) {
  if (!panel._selectedRoomId) return;
  try {
    const res = await apiCall(panel, 
      "GET",
      `/api/presence_detection_designer/room/${panel._selectedRoomId}/statistics?hours=${panel._historyHours}`
    );
    panel._statsData = res;
    panel.render();
  } catch (err) {
    panel.showToast(`Failed to load history: ${err.message}`, "error");
  }
}


export async function loadTimeline(panel, hours = null, negSpace = null) {
  if (hours !== null && hours !== undefined) {
    panel._timelineHours = Number(hours);
    panel._historyHours = Number(hours);
  }
  if (negSpace !== null && negSpace !== undefined) {
    panel._timelineNegativeSpace = Boolean(negSpace);
    panel._timelineNegSpace = Boolean(negSpace);
  }
  const h = panel._timelineHours || panel._historyHours || 6;
  const ns =
    panel._timelineNegativeSpace !== undefined
      ? Boolean(panel._timelineNegativeSpace)
      : Boolean(panel._timelineNegSpace);
  try {
    const res = await apiCall(panel, 
      "GET",
      `/api/presence_detection_designer/timeline_reconstruction?hours=${h}&negative_space=${ns}`
    );
    panel._timelineData = res;
    const frames = res?.frames || [];
    if (panel._timelineFrameIdx >= frames.length) {
      panel._timelineFrameIdx = Math.max(0, frames.length - 1);
    }
    panel.render();
  } catch (err) {
    panel.showToast(`Failed to load house timeline: ${err.message}`, "error");
  }
}


export async function runReplay(panel) {
  if (!panel._selectedRoomId || !panel._replayCandidate) return;
  const ns =
    panel._replayNegativeSpace !== undefined
      ? Boolean(panel._replayNegativeSpace)
      : Boolean(panel._replayNegSpace);
  try {
    const res = await apiCall(panel, 
      "POST",
      `/api/presence_detection_designer/room/${panel._selectedRoomId}/replay`,
      {
        hours: panel._historyHours,
        candidate_config: panel._replayCandidate,
        negative_space: ns,
        baseline_negative_space: false,
      }
    );
    panel._replayData = res;
    panel.render();
  } catch (err) {
    panel.showToast(`Simulation failed: ${err.message}`, "error");
  }
}


export async function applyReplayCandidate(panel) {
  if (!panel._selectedRoomId || !panel._replayCandidate) return;
  panel._draftConfig = JSON.parse(JSON.stringify(panel._replayCandidate));
  panel._revisionNote = `Applied from ${panel._historyHours}h Replay Simulator`;
  await panel.saveCurrentRoom();
  await runReplay(panel);
}


export async function refreshStateGraph(panel, entryId) {
  if (!entryId) return;
  try {
    const res = await apiCall(panel, "GET", `/api/presence_detection_designer/state_graph?entry_id=${encodeURIComponent(entryId)}`);
    const fresh = (res && res.rooms && res.rooms[0]) || null;
    if (fresh && panel._overview && Array.isArray(panel._overview.rooms)) {
      const idx = panel._overview.rooms.findIndex((r) => r.entry_id === entryId);
      if (idx !== -1) {
        panel._overview.rooms[idx] = { ...panel._overview.rooms[idx], ...fresh };
      }
      panel.render();
    }
  } catch (err) {
    panel.showToast(`Failed to refresh state graph: ${err.message}`, "error");
  }
}

