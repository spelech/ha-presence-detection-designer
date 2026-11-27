// Event bindings for floorplan doorway/entryway inspector actions.

export function bindFloorplanDoorEvents(panel, root) {
  // Doorway Inspector actions
  root.querySelector("#btn-fp-add-door")?.addEventListener("click", (e) => {
    const rname = e.currentTarget.getAttribute("data-room");
    const wall = root.querySelector("#fp-new-door-wall")?.value || "right";
    const boxes = panel._floorplan?.rooms || [];
    const box = boxes.find((b) => (b.name || b.room_name) === rname);
    if (!box) return;
    panel._pushFpUndo();
    if (!Array.isArray(box.entryways)) box.entryways = [];
    const newDoorId = "door_" + Math.random().toString(36).substring(2, 9);
    const rw = Number(box.width ?? box.w ?? 200);
    const rh = Number(box.height ?? box.h ?? 150);
    const maxLen = wall === "top" || wall === "bottom" ? rw : rh;
    const width = 36;
    const offset = Math.max(0, Math.min(maxLen - width, Math.round((maxLen - width) / 2)));
    box.entryways.push({
      id: newDoorId,
      wall: wall,
      offset: offset,
      width: width,
      type: "door",
    });
    panel._selectedDoorId = newDoorId;
    panel._compiledTopology = panel._compileFloorplanClient(panel._floorplan);
    panel._debounceSaveFloorplan();
    panel.render();
  });

  root.querySelectorAll(".btn-fp-delete-door").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      const doorId = el.getAttribute("data-door-id");
      const rname = el.getAttribute("data-room");
      const boxes = panel._floorplan?.rooms || [];
      const box = boxes.find((b) => (b.name || b.room_name) === rname);
      if (!box || !Array.isArray(box.entryways)) return;
      const idx = box.entryways.findIndex((ew) => ew.id === doorId);
      if (idx >= 0) {
        panel._pushFpUndo();
        box.entryways.splice(idx, 1);
        if (panel._selectedDoorId === doorId) panel._selectedDoorId = null;
        panel._compiledTopology = panel._compileFloorplanClient(panel._floorplan);
        panel._debounceSaveFloorplan();
        panel.render();
      }
    });
  });

  root.querySelectorAll(".fp-door-field").forEach((el) => {
    el.addEventListener("change", () => {
      const doorId = el.getAttribute("data-door-id");
      const key = el.getAttribute("data-key");
      const boxes = panel._floorplan?.rooms || [];
      for (const box of boxes) {
        const ew = (box.entryways || []).find((d) => d.id === doorId);
        if (ew && key) {
          panel._pushFpUndo();
          ew[key] = key === "offset" || key === "width" ? Number(el.value) : el.value;
          panel._compiledTopology = panel._compileFloorplanClient(panel._floorplan);
          panel._debounceSaveFloorplan();
          panel.render();
          break;
        }
      }
    });
  });

  root.querySelectorAll(".fp-cam-field").forEach((el) => {
    el.addEventListener("change", () => {
      const key = el.getAttribute("data-key");
      const cams = panel._floorplan?.cameras || [];
      const cam = cams.find((c) => (c.id || c.camera_entity) === panel._selectedCamEntity);
      if (!cam || !key) return;
      if ((key === "fov_deg" || key === "range_px") && panel._isSpecLocked(cam)) return;
      panel._pushFpUndo();
      cam[key] = Number(el.value);
      panel._compiledTopology = panel._compileFloorplanClient(panel._floorplan);
      panel._debounceSaveFloorplan();
      panel.render();
    });
  });

  root.querySelectorAll(".fp-box-field").forEach((el) => {
    el.addEventListener("change", () => {
      const rname = el.getAttribute("data-room");
      const key = el.getAttribute("data-key");
      const boxes = panel._floorplan?.rooms || [];
      const box = boxes.find((b) => (b.name || b.room_name) === rname);
      if (!box || !key) return;
      panel._pushFpUndo();
      const sx = Number(box.x), sy = Number(box.y);
      const sw = Number(box.width ?? box.w ?? 200), sh = Number(box.height ?? box.h ?? 150);
      box[key] = Number(el.value);
      const nx = Number(box.x), ny = Number(box.y);
      const nw = Math.max(40, Number(box.width ?? box.w ?? 200)), nh = Math.max(40, Number(box.height ?? box.h ?? 150));
      box.width = nw;
      box.height = nh;
      if (box.svg_path) {
        box.svg_path = panel._transformSvgPath(box.svg_path, sx, sy, sw, sh, nx, ny, nw, nh);
      }
      panel._compiledTopology = panel._compileFloorplanClient(panel._floorplan);
      panel._debounceSaveFloorplan();
      panel.render();
    });
  });

}
