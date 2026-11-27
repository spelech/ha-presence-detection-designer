import { PDD_DEFAULT_FLOORPLAN } from "../shared/defaults.js";
// Whole-house spatial timeline SVG layer builders and in-place DOM patcher.


export function buildSingleFloorTimelineParts(panel, targetFloor, frames, frameIdx, curFrame, occupiedRoomsList, occSet, roomEstimates, negZones, transitions) {
  const fp = panel._floorplan || panel._overview?.floorplan || PDD_DEFAULT_FLOORPLAN;
  const allFpRooms = fp.rooms || [];
  const allFpCams = fp.cameras || [];
  const fRooms = targetFloor.rooms || allFpRooms.filter((r) => r.floor === targetFloor.id);
  const fCams = targetFloor.cameras || allFpCams.filter((c) => c.floor === targetFloor.id);
  const focusedRoomName = panel.selectedRoom?.room_name || "";
  const roomByName = new Map();
  fRooms.forEach((b) => {
    const n = b.name || b.room_name;
    if (n) roomByName.set(n, b);
  });

  const frameOccupants = curFrame.occupant_estimates || curFrame.occupants || [];
  const framePets = curFrame.pet_estimates || [];
  const curTs = Number(curFrame.ts || 0);

  const latestMoveByOcc = new Map();
  for (let i = 0; i < transitions.length; i++) {
    const tr = transitions[i];
    const trTs = Number(tr.ts || 0);
    if (curTs && trTs > curTs) break;
    const trFrameIdx = tr.iso ? frames.findIndex((f) => (f.iso || f.timestamp) === tr.iso) : -1;
    if (trFrameIdx > frameIdx) continue;
    const key = String(tr.occupant_key || tr.occupant_label || (tr.occupant_type === "pet" ? "Riley (Dog)" : "Occupant")).trim();
    latestMoveByOcc.set(key, { tr, trFrameIdx: trFrameIdx >= 0 ? trFrameIdx : i });
  }

  const pbRoomsSvg = fRooms
    .map((box) => {
      const rName = box.name || box.room_name;
      const rc = panel._getRoomColor(rName);
      const isFocused = focusedRoomName && focusedRoomName === rName;
      const isOcc = occSet.has(rName);
      const est = roomEstimates[rName] || {};
      const infType = est.method || est.inference_type || "clear";
      const isNegLocalized =
        isOcc && (String(infType).startsWith("negative_space") || infType === "hybrid");
      const strokeColor = isNegLocalized ? "#0284c7" : isOcc ? "#16a34a" : isFocused ? rc.hex : rc.border;
      const fillColor = isNegLocalized
        ? "rgba(2, 132, 199, 0.14)"
        : isOcc
        ? "rgba(22, 163, 74, 0.14)"
        : isFocused
        ? rc.bg
        : "rgba(148, 163, 184, 0.07)";
      const rx = Number(box.x);
      const ry = Number(box.y);
      const rw = Number(box.width ?? 200);
      const rh = Number(box.height ?? 150);
      const statusShort = isNegLocalized ? "Inferred" : isOcc ? "Confirmed" : "Clear";
      const anchor = panel._roomLabelAnchor(box);
      const padX = anchor.w < 95 ? 8 : 12;
      const titleFontSize = anchor.w < 95 ? 10.5 : 12;
      const availW = Math.max(0, anchor.w - padX * 2 - 12);
      const titleText = panel._fitSvgLabel(rName, availW, titleFontSize);
      const locText = rh >= 48 && isOcc ? panel._fitSvgLabel(statusShort, availW + 12, 10) : "";
      const pbShape = box.svg_path
        ? `<path d="${panel._escape(box.svg_path)}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${isOcc || isFocused ? "2.4" : "1.4"}" />`
        : `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" rx="6" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${isOcc || isFocused ? "2.4" : "1.4"}" />`;
      return `
        <g>
          <title>${panel._escape(rName)} — ${panel._escape(statusShort)}</title>
          ${pbShape}
          ${isFocused && !box.svg_path ? `<rect x="${(rx - 3).toFixed(1)}" y="${(ry - 3).toFixed(1)}" width="${(rw + 6).toFixed(1)}" height="${(rh + 6).toFixed(1)}" rx="8" fill="none" stroke="${rc.hex}" stroke-width="2" stroke-dasharray="6,3" />` : ""}
          ${titleText ? `<rect x="${(anchor.x + padX).toFixed(1)}" y="${(anchor.y + 12).toFixed(1)}" width="8" height="8" rx="2" fill="${rc.hex}" /><text x="${(anchor.x + padX + 12).toFixed(1)}" y="${(anchor.y + 20).toFixed(1)}" fill="#0f172a" font-size="${titleFontSize}" font-weight="600">${panel._escape(titleText)}</text>` : ""}
          ${locText ? `<text x="${(anchor.x + padX).toFixed(1)}" y="${(anchor.y + 34).toFixed(1)}" fill="${isNegLocalized ? "#0369a1" : "#15803d"}" font-size="10" font-weight="600">${panel._escape(locText)}</text>` : ""}
        </g>`;
    })
    .join("");

  const clearCamEntities = new Set(
    negZones.map((z) => z.entity_id || z.sensor_id || z.id).filter(Boolean)
  );
  frameOccupants.forEach((o) => {
    (o.negative_exclusions || []).forEach((cid) => clearCamEntities.add(cid));
  });
  const pbSolidSegments = panel._extractFloorWallSegments(fRooms);
  const pbConesSvg = fCams
    .map((cam) => {
      const camId = cam.id || cam.camera_entity;
      const isClearExclusion = clearCamEntities.has(camId) || clearCamEntities.has(cam.person_binary_sensor);
      const pathD = panel._coneSvgPath(cam, pbSolidSegments);
      return `
        <g style="pointer-events:none;">
          <path d="${pathD}" fill="${isClearExclusion ? "#06b6d4" : "#64748b"}" fill-opacity="${isClearExclusion ? "0.12" : "0.05"}" stroke="${isClearExclusion ? "#0891b2" : "#94a3b8"}" stroke-width="1.2" stroke-dasharray="${isClearExclusion ? "5,3" : "3,3"}" />
          <circle cx="${Number(cam.x)}" cy="${Number(cam.y)}" r="4" fill="${isClearExclusion ? "#0891b2" : "#64748b"}" />
        </g>`;
    })
    .join("");

  const tokensByRoom = new Map();
  const pushToken = (item) => {
    if ((item.floor || "main") !== targetFloor.id) return;
    const rName = item.room;
    if (!rName) return;
    const arr = tokensByRoom.get(rName) || [];
    arr.push(item);
    tokensByRoom.set(rName, arr);
  };
  frameOccupants.forEach(pushToken);
  framePets.forEach(pushToken);

  frameOccupants.forEach((occ) => {
    if ((occ.floor || "main") !== targetFloor.id) return;
    if (occ.pet_present && !framePets.some((p) => p.room === occ.room)) {
      pushToken({
        room: occ.room,
        floor: occ.floor || targetFloor.id,
        occupant_type: "pet",
        occupant_label: (occ.detected_animals && occ.detected_animals[0]) || "Riley (Dog)",
      });
    }
  });

  const arrowsList = [];
  const occupantTokens = [];
  const markerId = `tl-arrow-${targetFloor.id}`;

  tokensByRoom.forEach((rawList, rName) => {
    const box = roomByName.get(rName);
    const anc = box
      ? panel._getRoomInteriorAnchor(box)
      : { x: Number(rawList[0]?.x || 150), y: Number(rawList[0]?.y || 150) };

    // Collapse identical generic/repeated occupant entries in the same room into one icon + count badge
    const groupedList = [];
    const groupIdxByKey = new Map();
    rawList.forEach((item) => {
      const prof = panel._resolveOccupantProfile(item);
      const explicitCount = Number(item.occupant_count || item.count || 1);
      const groupKey = `${prof.role}|${prof.key}|${prof.isInferred ? "inf" : "conf"}`;
      if (prof.role !== "pet" && groupIdxByKey.has(groupKey)) {
        const existing = groupedList[groupIdxByKey.get(groupKey)];
        existing.count += Number.isFinite(explicitCount) && explicitCount > 0 ? explicitCount : 1;
        if (!existing.item.from_room && item.from_room) {
          existing.item = { ...existing.item, from_room: item.from_room, from_floor: item.from_floor };
        }
      } else {
        groupIdxByKey.set(groupKey, groupedList.length);
        groupedList.push({
          item,
          prof,
          count: prof.role === "pet" ? 0 : (Number.isFinite(explicitCount) && explicitCount > 0 ? explicitCount : 1),
        });
      }
    });

    groupedList.forEach((entry, idx) => {
      const { item: tok, prof, count } = entry;
      const offsetX = groupedList.length > 1 ? (idx - (groupedList.length - 1) / 2) * 44 : 0;
      const tx = anc.x + offsetX;
      const ty = anc.y;

      let fromRoom = tok.from_room || null;
      let fromFloor = tok.from_floor || null;
      if (!fromRoom) {
        const moveRec = latestMoveByOcc.get(prof.key);
        if (moveRec && moveRec.tr && (!moveRec.tr.to_room || moveRec.tr.to_room === rName)) {
          fromRoom = moveRec.tr.from_room || null;
          fromFloor = moveRec.tr.from_floor || null;
        }
      }

      let subTag = "";
      if (fromRoom && fromRoom !== rName) {
        const fromBox = roomByName.get(fromRoom);
        if (fromBox && (!fromFloor || fromFloor === targetFloor.id)) {
          const fromAnc = panel._getRoomInteriorAnchor(fromBox);
          const dx = tx - fromAnc.x;
          const dy = ty - fromAnc.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 28) {
            const trimEnd = 22;
            const ex = tx - (dx / dist) * trimEnd;
            const ey = ty - (dy / dist) * trimEnd;
            const mx = (fromAnc.x + ex) / 2 - (dy / dist) * Math.min(24, dist * 0.12);
            const my = (fromAnc.y + ey) / 2 + (dx / dist) * Math.min(24, dist * 0.12);
            arrowsList.push(`
              <g style="pointer-events:none;">
                <path d="M ${fromAnc.x.toFixed(1)} ${fromAnc.y.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}" fill="none" stroke="${prof.color}" stroke-width="2.6" stroke-dasharray="6,4" stroke-linecap="round" marker-end="url(#${markerId})" opacity="0.9" />
              </g>
            `);
          }
        } else if (fromFloor && fromFloor !== targetFloor.id) {
          const flTitle = fromFloor.charAt(0).toUpperCase() + fromFloor.slice(1);
          subTag = `From ${flTitle}`;
          const stubFromLeft = tx > 56;
          const sx = stubFromLeft ? tx - 48 : tx + 48;
          const ex = stubFromLeft ? tx - 22 : tx + 22;
          arrowsList.push(`
            <g style="pointer-events:none;">
              <path d="M ${sx.toFixed(1)} ${ty.toFixed(1)} L ${ex.toFixed(1)} ${ty.toFixed(1)}" fill="none" stroke="${prof.color}" stroke-width="2.4" stroke-dasharray="4,3" stroke-linecap="round" marker-end="url(#${markerId})" opacity="0.9" />
            </g>
          `);
        }
      }

      const svgStr = panel._buildOccupantTokenSvg(prof, tx, ty, `tl-${targetFloor.id}`, {
        subTag,
        isInferred: prof.isInferred,
        count,
      });
      const tokenSig = `${prof.role}|${prof.isInferred ? "inf" : "conf"}|${count}|${subTag}|${prof.pictureUrl || ""}|${prof.shortLabel.slice(0, 14)}`;
      occupantTokens.push({
        key: prof.key,
        sig: tokenSig,
        x: tx,
        y: ty,
        count,
        role: prof.role,
        svg: svgStr,
      });
    });
  });

  const tlUnderlayDef =
    targetFloor.underlay_svg ||
    (typeof PDD_FLOOR_UNDERLAYS !== "undefined" ? PDD_FLOOR_UNDERLAYS[targetFloor.id] : null);
  const underlaySvg =
    tlUnderlayDef && panel._showBlueprintUnderlay
      ? `<image href="${tlUnderlayDef.url}" x="${tlUnderlayDef.x}" y="${tlUnderlayDef.y}" width="${tlUnderlayDef.width}" height="${tlUnderlayDef.height}" opacity="${panel._underlayOpacity}" preserveAspectRatio="xMidYMid meet" style="pointer-events:none;" />`
      : "";

  const defsSvg = `
    <defs>
      <marker id="${markerId}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
        <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#0f172a" />
      </marker>
    </defs>
  `;
  const arrowsSvg = arrowsList.join("");
  const occupantsSvg = occupantTokens.map((t) => t.svg).join("");
  const svgInner = `${defsSvg}<g class="tl-layer-underlay">${underlaySvg}</g><g class="tl-layer-rooms">${pbRoomsSvg}</g><g class="tl-layer-cones">${pbConesSvg}</g><g class="tl-layer-arrows">${arrowsSvg}</g><g class="tl-layer-occupants">${occupantsSvg}</g>`;

  return {
    floor: targetFloor,
    defsSvg,
    underlaySvg,
    roomsSvg: pbRoomsSvg,
    conesSvg: pbConesSvg,
    arrowsSvg,
    occupantsSvg,
    occupantTokens,
    svgInner,
  };
}


export function buildTimelineFrameParts(panel) {
  const tl = panel._timelineData;
  const fp = panel._floorplan || panel._overview?.floorplan || PDD_DEFAULT_FLOORPLAN;
  const floors = fp.floors || [];
  const activeFloor =
    floors.find((f) => f.id === panel._selectedFloorId) || floors[1] || floors[0] || { id: "main", name: "Main Floor" };
  if (panel._timelineFloor !== "all" && floors.some((f) => f.id === panel._timelineFloor)) {
    panel._selectedFloorId = panel._timelineFloor;
  }

  const frames = tl?.frames || [];
  const frameIdx = Math.max(0, Math.min(Math.max(0, frames.length - 1), Number(panel._timelineFrameIdx || 0)));
  const curFrame = frames[frameIdx] || {
    iso: new Date().toISOString(),
    occupant_estimates: [],
    pet_estimates: [],
    negative_space_exclusions: [],
  };
  const frameOccupants = curFrame.occupant_estimates || curFrame.occupants || [];
  const occupiedRoomsList =
    curFrame.occupied_rooms ||
    curFrame.active_rooms ||
    frameOccupants.map((o) => o.room).filter(Boolean);
  const occSet = new Set(occupiedRoomsList);
  const roomEstimates = { ...(curFrame.room_estimates || {}) };
  frameOccupants.forEach((o) => {
    if (o.room && !roomEstimates[o.room]) {
      roomEstimates[o.room] = o;
    }
  });
  const negZones = curFrame.negative_space_exclusions || curFrame.negative_space_zones || [];
  const transitions = tl?.transitions || [];

  const visibleFloors =
    panel._timelineFloor === "all" && floors.length > 0
      ? floors
      : [floors.find((f) => f.id === (panel._timelineFloor === "all" ? activeFloor.id : panel._timelineFloor)) || activeFloor];

  const floorParts = visibleFloors.map((fl) =>
    panel._buildSingleFloorTimelineParts(
      fl,
      frames,
      frameIdx,
      curFrame,
      occupiedRoomsList,
      occSet,
      roomEstimates,
      negZones,
      transitions
    )
  );
  const primaryParts = floorParts.find((p) => p.floor.id === activeFloor.id) || floorParts[0];

  const rawFrameTs = curFrame.iso || curFrame.timestamp;
  const curTimeStr = rawFrameTs
    ? new Date(rawFrameTs).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "--:--";

  return {
    floors,
    activeFloor: primaryParts ? primaryParts.floor : activeFloor,
    floorParts,
    frames,
    frameIdx,
    curTimeStr,
    occupiedRoomsList,
    svgInner: primaryParts ? primaryParts.svgInner : "",
  };
}


export function patchSvgTimelineLayers(panel, svgEl, fpData) {
  if (!svgEl || !fpData) return;
  const roomsLayer = svgEl.querySelector?.(".tl-layer-rooms");
  const conesLayer = svgEl.querySelector?.(".tl-layer-cones");
  const arrowsLayer = svgEl.querySelector?.(".tl-layer-arrows");
  const occLayer = svgEl.querySelector?.(".tl-layer-occupants");
  if (!roomsLayer || !conesLayer || !arrowsLayer || !occLayer) {
    svgEl.innerHTML = fpData.svgInner;
    return;
  }
  roomsLayer.innerHTML = fpData.roomsSvg;
  conesLayer.innerHTML = fpData.conesSvg;
  arrowsLayer.innerHTML = fpData.arrowsSvg;

  const existingNodes = new Map();
  occLayer.querySelectorAll?.(".tl-occ-node[data-occ-key]")?.forEach((node) => {
    existingNodes.set(node.getAttribute("data-occ-key"), node);
  });
  const nextKeys = new Set();
  fpData.occupantTokens.forEach((tok) => {
    nextKeys.add(tok.key);
    const ex = existingNodes.get(tok.key);
    const nextSig = tok.sig || "";
    if (ex && ex.getAttribute && ex.getAttribute("data-token-sig") === nextSig && ex.setAttribute) {
      ex.setAttribute("transform", `translate(${tok.x.toFixed(1)}, ${tok.y.toFixed(1)})`);
    } else if (ex) {
      const tmp = document.createElementNS ? document.createElementNS("http://www.w3.org/2000/svg", "svg") : null;
      if (tmp) {
        tmp.innerHTML = tok.svg;
        if (tmp.firstElementChild && ex.parentNode) {
          ex.parentNode.replaceChild(tmp.firstElementChild, ex);
        }
      } else {
        ex.outerHTML = tok.svg;
      }
    } else {
      const tmp = document.createElementNS ? document.createElementNS("http://www.w3.org/2000/svg", "svg") : null;
      if (tmp) {
        tmp.innerHTML = tok.svg;
        if (tmp.firstElementChild) occLayer.appendChild(tmp.firstElementChild);
      } else {
        occLayer.innerHTML += tok.svg;
      }
    }
  });
  existingNodes.forEach((node, k) => {
    if (!nextKeys.has(k) && node.remove) node.remove();
  });
}


export function updateTimelineFrameInPlace(panel) {
  const root = panel.shadowRoot;
  if (!root || !panel._timelineData) return false;
  const tlSvgSingle = root.querySelector?.("#tl-svg-canvas");
  const multiSvgs = root.querySelectorAll?.(".tl-floor-svg[data-tl-floor-svg]") || [];
  if (!tlSvgSingle && multiSvgs.length === 0) return false;

  const parts = panel._buildTimelineFrameParts();
  if (tlSvgSingle) {
    const targetPart =
      parts.floorParts.find((p) => p.floor.id === parts.activeFloor.id) || parts.floorParts[0];
    if (targetPart) panel._patchSvgTimelineLayers(tlSvgSingle, targetPart);
  }
  if (multiSvgs.length > 0) {
    multiSvgs.forEach((svgEl) => {
      const fid = svgEl.getAttribute("data-tl-floor-svg");
      const matched = parts.floorParts.find((p) => p.floor.id === fid);
      if (matched) panel._patchSvgTimelineLayers(svgEl, matched);
    });
  }

  const slider = root.querySelector("#tl-scrubber-slider");
  if (slider) slider.value = String(parts.frameIdx);

  const timeReadout = root.querySelector("#tl-time-readout");
  if (timeReadout) {
    timeReadout.innerHTML = `${panel._escape(parts.curTimeStr)} <span style="color:var(--ha-muted);font-weight:400;">(${parts.frameIdx + 1}/${parts.frames.length})</span>`;
  }

  const activeRoomsEl = root.querySelector("#tl-active-rooms");
  if (activeRoomsEl) {
    activeRoomsEl.textContent = parts.occupiedRoomsList.join(", ") || "None";
  }
  const visOccEl = root.querySelector("#tl-visible-occupants-count");
  if (visOccEl) {
    const curFr = parts.frames[parts.frameIdx] || {};
    visOccEl.textContent = panel._formatTimelineHouseMode(curFr, panel._timelineData);
  }
  root.querySelectorAll("[data-tl-floor-count]").forEach((badge) => {
    const fid = badge.getAttribute("data-tl-floor-count");
    const matched = parts.floorParts.find((p) => p.floor.id === fid);
    if (matched) badge.textContent = `${matched.occupantTokens.length} active`;
  });

  root.querySelectorAll(".seg-btn[data-tl-floor]").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-tl-floor") === panel._timelineFloor);
  });
  const floorSummaryEl = root.querySelector("#tl-floor-label");
  if (floorSummaryEl) {
    floorSummaryEl.textContent =
      panel._timelineFloor === "all"
        ? `All ${parts.floors.length} Floors`
        : parts.activeFloor.name.replace(/\s*\(.*\)/, "");
  }

  root.querySelectorAll(".tl-transition-row[data-frame-idx]").forEach((row) => {
    row.classList.toggle("active", Number(row.getAttribute("data-frame-idx") || -1) === parts.frameIdx);
  });
  return true;
}

