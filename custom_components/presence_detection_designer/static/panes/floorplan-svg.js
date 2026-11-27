import { renderFloorplanSvgOverlays } from "./floorplan-svg-overlays.js";

export function renderFloorplanSvgBundle(panel, selRoom) {
  const fp = panel._floorplan || panel._overview?.floorplan;
  const compiled = panel._compiledTopology || panel._overview?.compiled_topology || {};
  if (!fp || !Array.isArray(fp.floors)) return null;

  const ctx = panel._getActiveFloorContext(selRoom);
  const {
    activeFloor,
    fRooms,
    fConns,
    fCams,
    fSensors,
    fProxies,
    selSensor,
    selCam,
    selBleProxy,
    selBox,
  } = ctx;

  const liveRoomsByName = {};
  ((panel._overview && panel._overview.rooms) || []).forEach((r) => {
    liveRoomsByName[r.room_name] = r;
  });

  const roomBoxMap = {};
  fRooms.forEach((b) => {
    roomBoxMap[b.name || b.room_name] = b;
  });

  const camAnalysis = compiled.camera_analysis || [];
  const ambiguities = compiled.ambiguities || [];
  const connMap = compiled.connected_rooms_map || {};
  const roomCoverage = compiled.room_coverage || {};

  const layers = panel._fpLayers || {};
  const layerOn = (k) => layers[k] !== false;
  const solidSegments = panel._extractFloorWallSegments(fRooms);
  const polyBbox = (pts) => {
    if (!Array.isArray(pts) || pts.length === 0) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const pt of pts) {
      if (pt[0] < minX) minX = pt[0];
      if (pt[1] < minY) minY = pt[1];
      if (pt[0] > maxX) maxX = pt[0];
      if (pt[1] > maxY) maxY = pt[1];
    }
    return { minX, minY, maxX, maxY };
  };
  const boxesOverlap = (a, b) =>
    Boolean(a && b && a.minX < b.maxX && a.maxX > b.minX && a.minY < b.maxY && a.maxY > b.minY);

  const mode = panel._floorplanMode;
  const isRoomMode = mode === "rooms";
  const canDragRooms = isRoomMode && !panel._roomsLocked;
  const canEditCam = mode === "devices" || mode === "cameras";
  const canEditSensor = mode === "devices" || mode === "sensors";
  const canEditBle = mode === "devices" || mode === "sensors";

  const camGeoms = fCams.map((cam, idx) => {
    const poly = panel._computeCameraVisibilityPolygon(cam, solidSegments);
    const pathD = panel._coneSvgPath(cam, solidSegments);
    const cx = Number(cam.x || 0), cy = Number(cam.y || 0), r = Math.max(20, Number(cam.range_px || 180));
    return {
      idx,
      id: cam.id || cam.camera_entity || `cam_${idx}`,
      pathD,
      bbox: poly ? polyBbox(poly) : { minX: cx - r, minY: cy - r, maxX: cx + r, maxY: cy + r },
    };
  });
  const pirGeoms = fSensors
    .filter((s) => s.sensor_type !== "door_contact")
    .map((s, idx) => {
      const poly = panel._computeCameraVisibilityPolygon(s, solidSegments);
      const pathD = panel._coneSvgPath(s, solidSegments);
      const cx = Number(s.x || 0), cy = Number(s.y || 0), r = Math.max(20, Number(s.range_px || 160));
      return {
        idx,
        id: s.id || `pir_${idx}`,
        pathD,
        bbox: poly ? polyBbox(poly) : { minX: cx - r, minY: cy - r, maxX: cx + r, maxY: cy + r },
      };
    });
  const bleGeoms = fProxies.map((proxy, idx) => {
    const px = Number(proxy.x || 0), py = Number(proxy.y || 0), rad = Number(proxy.radius_px || 230);
    return {
      idx,
      id: proxy.id || `ble_${idx}`,
      px,
      py,
      rad,
      bbox: { minX: px - rad, minY: py - rad, maxX: px + rad, maxY: py + rad },
    };
  });

  const camConesSvg = fCams
    .map((cam) => {
      const camId = cam.id || cam.camera_entity;
      const isSelectedCam =
        canEditCam &&
        (panel._selectedDeviceType === "camera" || mode === "cameras") &&
        selCam &&
        (selCam.id || selCam.camera_entity) === camId;
      const hasSpill =
        (Array.isArray(cam.spills_into) && cam.spills_into.length > 0) ||
        camAnalysis.some((ca) => ca.camera_id === camId && ca.has_multi_room_bleed);
      const coneColor = hasSpill ? "#d97706" : "#0284c7";
      const pathD = panel._coneSvgPath(cam, solidSegments);
      return `
        <path
          d="${pathD}"
          fill="${hasSpill ? "rgba(217, 119, 6, 0.15)" : "rgba(2, 132, 199, 0.13)"}"
          stroke="${coneColor}"
          stroke-width="${isSelectedCam ? "2.4" : "1.2"}"
          stroke-dasharray="${hasSpill ? "5,4" : "none"}"
          opacity="${canEditCam ? "1" : "0.45"}"
          style="pointer-events:none;"
        />
      `;
    })
    .join("");

  const roomsSvg = fRooms
    .map((box) => {
      const rName = box.name || box.room_name;
      const live = liveRoomsByName[rName];
      const rc = panel._getRoomColor(rName);
      const isFocused = Boolean(selRoom && selRoom.room_name === rName);
      const isSel = selBox && (selBox.name || selBox.room_name) === rName && isRoomMode;
      const isOcc = live ? Boolean(live.is_present) : false;
      const isTransit = box.room_type === "transit" || Boolean(box.is_transit);
      const covPct = Number(roomCoverage[rName]?.max_coverage_pct ?? 100);
      const hasBlindSpot = !isTransit && covPct === 0;

      let strokeColor = isFocused ? rc.hex : rc.border;
      let fillColor = isSel || isFocused ? rc.bg : "rgba(148, 163, 184, 0.08)";
      if (isOcc) {
        strokeColor = "#16a34a";
        fillColor = "rgba(22, 163, 74, 0.18)";
      } else if (hasBlindSpot) {
        strokeColor = "#d97706";
        fillColor = "rgba(245, 158, 11, 0.12)";
      } else if (isTransit) {
        strokeColor = "#64748b";
        fillColor = "rgba(100, 116, 139, 0.10)";
      }

      const rx = Number(box.x);
      const ry = Number(box.y);
      const rw = Number(box.width ?? box.w ?? 200);
      const rh = Number(box.height ?? box.h ?? 150);
      const statusSummary = panel._roomStatusSummary(live);

      const entryways = Array.isArray(box.entryways) ? box.entryways : [];
      const entrywaysSvg = entryways
        .map((ew) => {
          const isSelDoor = panel._selectedDoorId === ew.id && isRoomMode;
          const offset = Math.max(0, Number(ew.offset || 0));
          const width = Math.max(10, Number(ew.width || 36));
          let x1 = rx, y1 = ry, x2 = rx, y2 = ry, bx = rx, by = ry;
          if (ew.wall === "top") {
            x1 = rx + offset; y1 = ry; x2 = x1 + width; y2 = ry; bx = x1 + width / 2; by = ry;
          } else if (ew.wall === "bottom") {
            x1 = rx + offset; y1 = ry + rh; x2 = x1 + width; y2 = ry + rh; bx = x1 + width / 2; by = ry + rh;
          } else if (ew.wall === "left") {
            x1 = rx; y1 = ry + offset; x2 = rx; y2 = y1 + width; bx = rx; by = y1 + width / 2;
          } else if (ew.wall === "right") {
            x1 = rx + rw; y1 = ry + offset; x2 = rx + rw; y2 = y1 + width; bx = rx + rw; by = y1 + width / 2;
          }
          const isPassage = ew.type === "open_passage";
          const doorColor = isSelDoor ? "#0284c7" : isPassage ? "#64748b" : "#b45309";
          return `
            <g class="fp-door-group" data-room-name="${panel._escape(rName)}" data-door-id="${panel._escape(ew.id)}" style="${isRoomMode ? "" : "pointer-events:none;"}">
              <line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#ffffff" stroke-width="5" stroke-linecap="round" />
              <line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${doorColor}" stroke-width="${isSelDoor ? "3" : "2"}" stroke-dasharray="${isPassage ? "4,3" : "none"}" />
              <circle class="fp-door-handle" data-room-name="${panel._escape(rName)}" data-door-id="${panel._escape(ew.id)}" cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="${isSelDoor ? "6.5" : "5"}" fill="${doorColor}" stroke="#ffffff" stroke-width="1.5" style="${isRoomMode ? "cursor:grab;pointer-events:all;" : "pointer-events:none;display:none;"}" />
              ${
                isSelDoor && isRoomMode
                  ? `
                <rect class="fp-door-tab" data-tab="start" data-room-name="${panel._escape(rName)}" data-door-id="${panel._escape(ew.id)}" x="${(x1 - 3).toFixed(1)}" y="${(y1 - 3).toFixed(1)}" width="6" height="6" fill="#0284c7" stroke="#ffffff" stroke-width="1" style="cursor:crosshair;" />
                <rect class="fp-door-tab" data-tab="end" data-room-name="${panel._escape(rName)}" data-door-id="${panel._escape(ew.id)}" x="${(x2 - 3).toFixed(1)}" y="${(y2 - 3).toFixed(1)}" width="6" height="6" fill="#0284c7" stroke="#ffffff" stroke-width="1" style="cursor:crosshair;" />
              `
                  : ""
              }
            </g>
          `;
        })
        .join("");

      let resizeHandlesSvg = "";
      if (isSel && canDragRooms) {
        const handles = [
          { id: "nw", x: rx, y: ry, cursor: "nwse-resize" },
          { id: "n", x: rx + rw / 2, y: ry, cursor: "ns-resize" },
          { id: "ne", x: rx + rw, y: ry, cursor: "nesw-resize" },
          { id: "e", x: rx + rw, y: ry + rh / 2, cursor: "ew-resize" },
          { id: "se", x: rx + rw, y: ry + rh, cursor: "nwse-resize" },
          { id: "s", x: rx + rw / 2, y: ry + rh, cursor: "ns-resize" },
          { id: "sw", x: rx, y: ry + rh, cursor: "nesw-resize" },
          { id: "w", x: rx, y: ry + rh / 2, cursor: "ew-resize" },
        ];
        resizeHandlesSvg = handles
          .map(
            (h) => `
          <rect
            class="fp-resize-handle"
            data-handle="${h.id}"
            data-room-name="${panel._escape(rName)}"
            x="${(h.x - 5).toFixed(1)}"
            y="${(h.y - 5).toFixed(1)}"
            width="10"
            height="10"
            fill="#ffffff"
            stroke="#0284c7"
            stroke-width="2"
            rx="2"
            style="cursor:${h.cursor};pointer-events:all;"
          />
        `
          )
          .join("");
      }

      const roomPointerStyle = canDragRooms
        ? "cursor:move;pointer-events:all;"
        : isRoomMode
        ? "cursor:pointer;pointer-events:all;"
        : "pointer-events:none;";

      const roomShapeSvg = box.svg_path
        ? `<path
            class="fp-room-rect"
            data-room-name="${panel._escape(rName)}"
            d="${panel._escape(box.svg_path)}"
            fill="${fillColor}"
            stroke="${strokeColor}"
            stroke-width="${isSel || isFocused ? "3" : "1.7"}"
            stroke-dasharray="${isTransit ? "4,4" : "none"}"
            style="${roomPointerStyle}"
          />`
        : `<rect
            class="fp-room-rect"
            data-room-name="${panel._escape(rName)}"
            x="${rx}"
            y="${ry}"
            width="${rw}"
            height="${rh}"
            rx="6"
            fill="${fillColor}"
            stroke="${strokeColor}"
            stroke-width="${isSel || isFocused ? "3" : "1.7"}"
            stroke-dasharray="${isTransit ? "4,4" : "none"}"
            style="${roomPointerStyle}"
          />`;

      const anchor = panel._roomLabelAnchor(box);
      const padX = anchor.w < 100 ? 8 : 12;
      const titleFs = anchor.w < 100 ? 11 : 13;
      const availW = Math.max(0, anchor.w - padX * 2);
      const roomTitle = panel._fitSvgLabel(rName, availW, titleFs);
      const rawSub = isTransit ? "Shared walkway / stairs" : statusSummary.label;
      const roomSub = rh >= 48 ? panel._fitSvgLabel(rawSub, availW, 11) : "";
      const blindText =
        hasBlindSpot && rh >= 74 && anchor.w >= 95
          ? panel._fitSvgLabel("No camera cone (uses motion / BLE)", availW, 10)
          : "";

      return `
        <g class="fp-room-box" data-room-name="${panel._escape(rName)}" style="${isRoomMode ? "" : "pointer-events:none;"}">
          <title>${panel._escape(rName)} — ${panel._escape(rawSub)}</title>
          ${roomShapeSvg}
          ${
            isFocused && !box.svg_path
              ? `<rect x="${(rx - 3).toFixed(1)}" y="${(ry - 3).toFixed(1)}" width="${(rw + 6).toFixed(1)}" height="${(rh + 6).toFixed(1)}" rx="8" fill="none" stroke="${rc.hex}" stroke-width="2" stroke-dasharray="6,3" style="pointer-events:none;" />`
              : ""
          }
          ${
            roomTitle
              ? `<rect x="${(anchor.x + padX).toFixed(1)}" y="${(anchor.y + 12.5).toFixed(1)}" width="8" height="8" rx="2" fill="${rc.hex}" style="pointer-events:none;" />
                 <text x="${(anchor.x + padX + 12).toFixed(1)}" y="${(anchor.y + 21).toFixed(1)}" fill="#1e293b" font-size="${titleFs}" font-weight="600" style="pointer-events:none;user-select:none;">${panel._escape(roomTitle)}</text>`
              : ""
          }
          ${
            roomSub
              ? `<text x="${(anchor.x + padX).toFixed(1)}" y="${(anchor.y + 40).toFixed(1)}" fill="${isOcc ? "#16a34a" : "#64748b"}" font-size="11" style="pointer-events:none;user-select:none;">${panel._escape(roomSub)}</text>`
              : ""
          }
          ${
            blindText
              ? `<text x="${(anchor.x + padX).toFixed(1)}" y="${(ry + rh - 10).toFixed(1)}" fill="#d97706" font-size="10" font-weight="500" style="pointer-events:none;">${panel._escape(blindText)}</text>`
              : ""
          }
          ${entrywaysSvg}
          ${resizeHandlesSvg}
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
        <line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.65" style="pointer-events:none;" />
      `;
    })
    .join("");

  let underlaySvg = "";
  const activeFloorId = activeFloor.id || "main";
  const underlayDef =
    activeFloor.underlay_svg ||
    (typeof PDD_FLOOR_UNDERLAYS !== "undefined" ? PDD_FLOOR_UNDERLAYS[activeFloorId] : null);
  if (underlayDef && layerOn("underlay")) {
    underlaySvg = `
      <image
        id="fp-blueprint-underlay"
        href="${underlayDef.url}"
        x="${underlayDef.x}"
        y="${underlayDef.y}"
        width="${underlayDef.width}"
        height="${underlayDef.height}"
        opacity="${panel._underlayOpacity}"
        preserveAspectRatio="xMidYMid meet"
        style="pointer-events:none;transition:opacity 0.2s ease;"
      />
    `;
  }

  const roomLabelBands = fRooms.map((b) => {
    const a = panel._roomLabelAnchor(b);
    return { x1: a.x, x2: a.x + Math.min(a.w, 160), y1: a.y + 8, y2: a.y + 46 };
  });
  const placedSzLabels = [];
  const subZonesSvg = fCams
    .map((cam) => {
      const camId = cam.id || cam.camera_entity;
      return (cam.sub_zones || [])
        .map((sz) => {
          const sx = Number(sz.x || 0);
          const sy = Number(sz.y || 0);
          const sw = Math.max(24, Number(sz.width || 60));
          const sh = Math.max(24, Number(sz.height || 60));
          const isSelSz =
            canEditCam &&
            panel._selectedDeviceType === "subzone" &&
            panel._selectedSubZoneId === sz.id;
          const szLabelFit = canEditCam ? panel._fitSvgLabel(sz.label || sz.id, sw - 8, 9.5) : "";
          let labelY = sy + sh / 2 + 3;
          if (szLabelFit) {
            const cx = sx + sw / 2;
            for (const band of roomLabelBands) {
              if (cx >= band.x1 - 20 && cx <= band.x2 + 20 && labelY >= band.y1 && labelY <= band.y2 + 6) {
                labelY = Math.max(labelY, Math.min(sy + sh - 5, band.y2 + 12));
              }
            }
            for (const prevLbl of placedSzLabels) {
              if (Math.abs(prevLbl.cx - cx) < 75 && Math.abs(prevLbl.y - labelY) < 13) {
                labelY = prevLbl.y + 14;
              }
            }
            labelY = Math.min(sy + sh - 5, Math.max(sy + 12, labelY));
            placedSzLabels.push({ cx, y: labelY });
          }
          return `
            <g class="fp-subzone-group" data-cam-id="${panel._escape(camId)}" data-subzone-id="${panel._escape(sz.id)}" style="${canEditCam ? "opacity:0.95;" : "opacity:0.55;pointer-events:none;"}">
              <title>${panel._escape(sz.label || sz.id)}</title>
              <rect
                class="fp-subzone-rect"
                data-cam-id="${panel._escape(camId)}"
                data-subzone-id="${panel._escape(sz.id)}"
                x="${sx.toFixed(1)}"
                y="${sy.toFixed(1)}"
                width="${sw.toFixed(1)}"
                height="${sh.toFixed(1)}"
                rx="4"
                fill="rgba(14, 165, 233, 0.14)"
                stroke="${isSelSz ? "#0369a1" : "#0ea5e9"}"
                stroke-width="${isSelSz ? "2.4" : "1.3"}"
                stroke-dasharray="3,2"
                style="${canEditCam ? "cursor:move;pointer-events:all;" : "pointer-events:none;"}"
              />
              ${
                szLabelFit
                  ? `<text x="${(sx + sw / 2).toFixed(1)}" y="${labelY.toFixed(1)}" text-anchor="middle" fill="#0369a1" font-size="9.5" font-weight="600" style="pointer-events:none;user-select:none;">${panel._escape(szLabelFit)}</text>`
                  : ""
              }
              ${
                isSelSz
                  ? `<g class="fp-handle-group fp-subzone-handle" data-cam-id="${panel._escape(camId)}" data-subzone-id="${panel._escape(sz.id)}" style="cursor:nwse-resize;">
                       <circle class="fp-hit-target" cx="${(sx + sw).toFixed(1)}" cy="${(sy + sh).toFixed(1)}" r="12" />
                       <rect class="fp-handle-visible" x="${(sx + sw - 5).toFixed(1)}" y="${(sy + sh - 5).toFixed(1)}" width="10" height="10" rx="2" fill="#ffffff" stroke="#0369a1" stroke-width="2" style="pointer-events:none;" />
                     </g>`
                  : ""
              }
            </g>
          `;
        })
        .join("");
    })
    .join("");

  return renderFloorplanSvgOverlays(panel, { selBox, selBleProxy, selCam, selSensor, fProxies, fSensors, fCams, fConns, fRooms, activeFloor, selRoom, fp, compiled, ctx, liveRoomsByName, roomBoxMap, camAnalysis, ambiguities, connMap, roomCoverage, layers, layerOn, solidSegments, polyBbox, boxesOverlap, mode, isRoomMode, canDragRooms, canEditCam, canEditSensor, canEditBle, camGeoms, pirGeoms, bleGeoms, camConesSvg, roomsSvg, connsSvg, underlaySvg, activeFloorId, underlayDef, roomLabelBands, placedSzLabels, subZonesSvg });
}
