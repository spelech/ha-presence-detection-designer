// Floorplan SVG sensor/BLE/EKF overlays and interactive control handles.

export function renderFloorplanSvgOverlays(panel, { selBox, selBleProxy, selCam, selSensor, fProxies, fSensors, fCams, fConns, fRooms, activeFloor, selRoom, fp, compiled, ctx, liveRoomsByName, roomBoxMap, camAnalysis, ambiguities, connMap, roomCoverage, layers, layerOn, solidSegments, polyBbox, boxesOverlap, mode, isRoomMode, canDragRooms, canEditCam, canEditSensor, canEditBle, camGeoms, pirGeoms, bleGeoms, camConesSvg, roomsSvg, connsSvg, underlaySvg, activeFloorId, underlayDef, roomLabelBands, placedSzLabels, subZonesSvg }) {
  const bleRingsSvg = fProxies
    .map((proxy) => {
      const px = Number(proxy.x || 0);
      const py = Number(proxy.y || 0);
      const rad = Number(proxy.radius_px || 230);
      const isSelBle =
        canEditBle &&
        panel._selectedDeviceType === "ble" &&
        selBleProxy &&
        selBleProxy.id === proxy.id;
      return `
        <path
          d="M ${(px - rad).toFixed(1)} ${py.toFixed(1)} a ${rad.toFixed(1)} ${rad.toFixed(1)} 0 1 0 ${(rad * 2).toFixed(1)} 0 a ${rad.toFixed(1)} ${rad.toFixed(1)} 0 1 0 -${(rad * 2).toFixed(1)} 0"
          fill="rgba(13, 148, 136, 0.04)"
          stroke="#0d9488"
          stroke-width="${isSelBle ? "1.8" : "1"}"
          stroke-dasharray="4,4"
          opacity="${canEditBle ? "0.95" : "0.45"}"
          style="pointer-events:none;"
        />
      `;
    })
    .join("");

  const doorSensorsList = fSensors.filter((s) => s.sensor_type === "door_contact");
  const pirSensorsList = fSensors.filter((s) => s.sensor_type !== "door_contact");

  const pirConesSvg = pirSensorsList
    .map((s) => {
      const isSelSens =
        canEditSensor &&
        panel._selectedDeviceType === "sensor" &&
        selSensor &&
        selSensor.id === s.id;
      const conePath = panel._coneSvgPath(s, solidSegments);
      return `
        <path
          d="${conePath}"
          fill="rgba(147, 51, 234, 0.12)"
          stroke="#9333ea"
          stroke-width="${isSelSens ? "2.3" : "1.2"}"
          stroke-dasharray="3,3"
          opacity="${canEditSensor ? "0.95" : "0.65"}"
          style="pointer-events:none;"
        />
      `;
    })
    .join("");

  const clipDefs = [];
  const overlapShapes = [];
  const overlapCounts = { multiCam: 0, camPir: 0, camBle: 0, pirBle: 0 };
  const safeClipPrefix = `pdd-clip-${activeFloorId.replace(/[^a-z0-9_-]/gi, "_")}`;

  if (layerOn("overlaps")) {
    if (layerOn("cameras") && camGeoms.length >= 2) {
      camGeoms.forEach((cg, i) => {
        clipDefs.push(`<clipPath id="${safeClipPrefix}-cam-${i}"><path d="${cg.pathD}" /></clipPath>`);
        for (let j = i + 1; j < camGeoms.length; j++) {
          if (boxesOverlap(cg.bbox, camGeoms[j].bbox)) {
            overlapCounts.multiCam++;
            overlapShapes.push(
              `<g clip-path="url(#${safeClipPrefix}-cam-${i})"><path d="${camGeoms[j].pathD}" fill="url(#pdd-pat-multi-cam)" stroke="#d97706" stroke-width="1" stroke-opacity="0.7" /></g>`
            );
          }
        }
      });
    } else if (layerOn("cameras")) {
      camGeoms.forEach((cg, i) => {
        clipDefs.push(`<clipPath id="${safeClipPrefix}-cam-${i}"><path d="${cg.pathD}" /></clipPath>`);
      });
    }

    if (layerOn("cameras") && layerOn("pir")) {
      camGeoms.forEach((cg, i) => {
        pirGeoms.forEach((pg) => {
          if (boxesOverlap(cg.bbox, pg.bbox)) {
            overlapCounts.camPir++;
            overlapShapes.push(
              `<g clip-path="url(#${safeClipPrefix}-cam-${i})"><path d="${pg.pathD}" fill="url(#pdd-pat-cam-pir)" stroke="#7c3aed" stroke-width="1" stroke-opacity="0.75" /></g>`
            );
          }
        });
      });
    }

    if (layerOn("cameras") && layerOn("ble")) {
      camGeoms.forEach((cg, i) => {
        bleGeoms.forEach((bg) => {
          if (boxesOverlap(cg.bbox, bg.bbox)) {
            overlapCounts.camBle++;
            overlapShapes.push(
              `<g clip-path="url(#${safeClipPrefix}-cam-${i})"><circle cx="${bg.px.toFixed(1)}" cy="${bg.py.toFixed(1)}" r="${bg.rad.toFixed(1)}" fill="url(#pdd-pat-cam-ble)" /></g>`
            );
          }
        });
      });
    }

    if (layerOn("pir") && layerOn("ble")) {
      pirGeoms.forEach((pg, i) => {
        clipDefs.push(`<clipPath id="${safeClipPrefix}-pir-${i}"><path d="${pg.pathD}" /></clipPath>`);
        bleGeoms.forEach((bg) => {
          if (boxesOverlap(pg.bbox, bg.bbox)) {
            overlapCounts.pirBle++;
            overlapShapes.push(
              `<g clip-path="url(#${safeClipPrefix}-pir-${i})"><circle cx="${bg.px.toFixed(1)}" cy="${bg.py.toFixed(1)}" r="${bg.rad.toFixed(1)}" fill="url(#pdd-pat-pir-ble)" /></g>`
            );
          }
        });
      });
    }
  }

  const totalOverlapPairs =
    overlapCounts.multiCam + overlapCounts.camPir + overlapCounts.camBle + overlapCounts.pirBle;
  const subZoneCount = fCams.reduce((acc, c) => acc + (c.sub_zones || []).length, 0);
  const blindRoomCount = fRooms.filter((b) => {
    const rName = b.name || b.room_name;
    const isT = b.room_type === "transit" || Boolean(b.is_transit);
    return !isT && Number(roomCoverage[rName]?.max_coverage_pct ?? 100) === 0;
  }).length;

  const livePeople = (panel._overview?.spatial_inference?.occupant_estimates || []).filter(
    (est) => est.floor === activeFloor.id
  );
  const liveEstimates = livePeople;
  const livePets = (panel._overview?.spatial_inference?.pet_estimates || []).filter(
    (est) => est.floor === activeFloor.id
  );
  const liveAllTokens = [];
  const liveByRoom = new Map();
  livePeople.forEach((est) => {
    const list = liveByRoom.get(est.room) || [];
    list.push(est);
    liveByRoom.set(est.room, list);
  });
  livePets.forEach((pet) => {
    const list = liveByRoom.get(pet.room) || [];
    list.push(pet);
    liveByRoom.set(pet.room, list);
  });
  liveByRoom.forEach((list, rName) => {
    const box = fRooms.find((b) => (b.name || b.room_name) === rName);
    const anc = box ? panel._getRoomInteriorAnchor(box) : { x: Number(list[0]?.x || 100), y: Number(list[0]?.y || 100) };
    list.forEach((tok, idx) => {
      const offsetX = list.length > 1 ? (idx - (list.length - 1) / 2) * 44 : 0;
      const prof = panel._resolveOccupantProfile(tok);
      liveAllTokens.push(panel._buildOccupantTokenSvg(prof, anc.x + offsetX, anc.y, `fp-${activeFloor.id}`));
    });
  });
  const occupantsSvg = liveAllTokens.join("");

  // Live 2D+Floor EKF tracks: 2-sigma/1-sigma uncertainty ellipses, heading vector, and position dot
  const ekfTracksMap = panel._overview?.spatial_inference?.ekf_tracks || {};
  const ekfTracksOnFloor = Object.values(ekfTracksMap).filter(
    (tr) => tr && tr.floor === activeFloor.id && Number.isFinite(Number(tr.x_px))
  );
  const ekfTracksSvg = ekfTracksOnFloor
    .map((tr) => {
      const ex = Math.max(8, Math.min(992, Number(tr.x_px || 0)));
      const ey = Math.max(8, Math.min(572, Number(tr.y_px || 0)));
      const sx = Math.max(10, Math.min(260, Number(tr.sigma_x_px || 30)));
      const sy = Math.max(10, Math.min(260, Number(tr.sigma_y_px || 30)));
      const spd = Number(tr.speed_ft_s || 0);
      const hdg = tr.heading_deg != null ? Number(tr.heading_deg) : null;
      const topRoom = tr.top_room || "—";
      const topPct = Math.round(Number(tr.top_room_prob || 0) * 100);
      const sxFt = Number(tr.sigma_x_ft || 0).toFixed(1);
      const syFt = Number(tr.sigma_y_ft || 0).toFixed(1);
      const proxiesN = Number(tr.active_proxy_count || 0);
      const gatedN = Number(tr.rejected_outliers || 0);
      const tip = `EKF (${tr.entity_id || "BLE"}): ${topRoom} (${topPct}%) | pos=(${Math.round(ex)},${Math.round(ey)}) | ±${sxFt}×${syFt}ft (1σ) | ${spd.toFixed(1)} ft/s${hdg != null ? ` @ ${Math.round(hdg)}°` : ""} | proxies=${proxiesN}, gated=${gatedN}`;

      let headingSvg = "";
      if (hdg != null && spd >= 0.35) {
        const rad = (hdg * Math.PI) / 180.0;
        const len = Math.max(22, Math.min(68, spd * 14));
        const x2 = ex + Math.cos(rad) * len;
        const y2 = ey + Math.sin(rad) * len;
        const headLen = 9;
        const a1 = rad + 2.55;
        const a2 = rad - 2.55;
        headingSvg = `
          <line x1="${ex.toFixed(1)}" y1="${ey.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#06b6d4" stroke-width="2.6" stroke-linecap="round" />
          <polygon points="${x2.toFixed(1)},${y2.toFixed(1)} ${(x2 + Math.cos(a1) * headLen).toFixed(1)},${(y2 + Math.sin(a1) * headLen).toFixed(1)} ${(x2 + Math.cos(a2) * headLen).toFixed(1)},${(y2 + Math.sin(a2) * headLen).toFixed(1)}" fill="#06b6d4" />
        `;
      }

      const badgeY = ey - 16 < 20 ? ey + 24 : ey - 14;
      const labelText = `EKF ${topRoom} ${topPct}% (±${sxFt}ft)`;
      return `
        <g class="fp-ekf-track" data-tracker="${panel._escape(tr.entity_id || "")}">
          <title>${panel._escape(tip)}</title>
          <ellipse cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" rx="${(sx * 2).toFixed(1)}" ry="${(sy * 2).toFixed(1)}" fill="rgba(6, 182, 212, 0.06)" stroke="#06b6d4" stroke-width="1.2" stroke-dasharray="5,4" style="pointer-events:none;" />
          <ellipse cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" rx="${sx.toFixed(1)}" ry="${sy.toFixed(1)}" fill="rgba(6, 182, 212, 0.16)" stroke="#0891b2" stroke-width="1.6" style="pointer-events:none;" />
          ${headingSvg}
          <circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="6" fill="#06b6d4" stroke="#ffffff" stroke-width="2" />
          <text x="${ex.toFixed(1)}" y="${badgeY.toFixed(1)}" text-anchor="middle" font-size="10.5" font-weight="700" fill="#0e7490" stroke="#ffffff" stroke-width="3" paint-order="stroke" style="pointer-events:none;">${panel._escape(labelText)}</text>
        </g>
      `;
    })
    .join("");

  const bleControlsSvg = layerOn("ble")
    ? fProxies
        .map((proxy) => {
          const px = Number(proxy.x || 0);
          const py = Number(proxy.y || 0);
          const rad = Number(proxy.radius_px || 230);
          const isSelBle =
            canEditBle &&
            panel._selectedDeviceType === "ble" &&
            selBleProxy &&
            selBleProxy.id === proxy.id;
          const angToCenter = Math.atan2(290 - py, 500 - px);
          const hx = Math.max(14, Math.min(986, px + Math.cos(angToCenter) * rad));
          const hy = Math.max(14, Math.min(566, py + Math.sin(angToCenter) * rad));
          return `
            <g class="fp-ble-group" data-proxy-id="${panel._escape(proxy.id)}" style="${canEditBle ? "opacity:1;" : "opacity:0.45;pointer-events:none;"}">
              <title>📶 ${panel._escape(proxy.name || proxy.id)} (r=${Math.round(rad)}px)</title>
              ${isSelBle ? `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="13" fill="rgba(13, 148, 136, 0.16)" stroke="#0d9488" stroke-width="1.5" style="pointer-events:none;" />` : ""}
              <g class="fp-handle-group fp-ble-origin" data-proxy-id="${panel._escape(proxy.id)}" style="${canEditBle ? "cursor:move;pointer-events:all;" : "pointer-events:none;"}">
                <circle class="fp-hit-target" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="15" />
                <circle class="fp-handle-visible" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${isSelBle ? "8" : "6.5"}" fill="#0d9488" stroke="#ffffff" stroke-width="2" style="pointer-events:none;" />
              </g>
              ${
                isSelBle && !panel._isSpecLocked(proxy)
                  ? `<line x1="${px.toFixed(1)}" y1="${py.toFixed(1)}" x2="${hx.toFixed(1)}" y2="${hy.toFixed(1)}" stroke="#0d9488" stroke-width="1.5" stroke-dasharray="3,3" style="pointer-events:none;" />
                     <g class="fp-handle-group fp-ble-handle" data-handle="ble_radius" data-proxy-id="${panel._escape(proxy.id)}" style="cursor:ew-resize;pointer-events:all;">
                       <title>Drag to resize BLE radius (${Math.round(rad)}px)</title>
                       <circle class="fp-hit-target" cx="${hx.toFixed(1)}" cy="${hy.toFixed(1)}" r="14" />
                       <circle class="fp-handle-visible" cx="${hx.toFixed(1)}" cy="${hy.toFixed(1)}" r="6" fill="#ffffff" stroke="#0d9488" stroke-width="2.2" style="pointer-events:none;" />
                     </g>`
                  : ""
              }
            </g>
          `;
        })
        .join("")
    : "";

  const doorControlsSvg = layerOn("doors")
    ? doorSensorsList
        .map((s) => {
          const sx = Number(s.x || 0);
          const sy = Number(s.y || 0);
          const isSelSens =
            canEditSensor &&
            panel._selectedDeviceType === "sensor" &&
            selSensor &&
            selSensor.id === s.id;
          return `
            <g class="fp-sensor-group" data-sensor-id="${panel._escape(s.id)}" style="${canEditSensor ? "opacity:1;" : "opacity:0.6;pointer-events:none;"}">
              <title>🚪 ${panel._escape(s.name || s.id)}</title>
              ${isSelSens ? `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="14" fill="rgba(234, 88, 12, 0.16)" stroke="#ea580c" stroke-width="1.5" style="pointer-events:none;" />` : ""}
              <g class="fp-handle-group fp-sensor-origin" data-sensor-id="${panel._escape(s.id)}" style="${canEditSensor ? "cursor:move;pointer-events:all;" : "pointer-events:none;"}">
                <circle class="fp-hit-target" cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="15" />
                <rect class="fp-handle-visible" x="${(sx - 8).toFixed(1)}" y="${(sy - 8).toFixed(1)}" width="16" height="16" rx="4" fill="#ea580c" stroke="#ffffff" stroke-width="${isSelSens ? "2.5" : "1.8"}" style="pointer-events:none;" />
              </g>
            </g>
          `;
        })
        .join("")
    : "";

  const pirControlsSvg = layerOn("pir")
    ? pirSensorsList
        .map((s) => {
          const sx = Number(s.x || 0);
          const sy = Number(s.y || 0);
          const isSelSens =
            canEditSensor &&
            panel._selectedDeviceType === "sensor" &&
            selSensor &&
            selSensor.id === s.id;
          const rad = (Number(s.heading_deg || 0) * Math.PI) / 180.0;
          const previewLen = 28;
          const px2 = sx + Math.cos(rad) * previewLen;
          const py2 = sy + Math.sin(rad) * previewLen;
          const handlesSvg = isSelSens
            ? panel._buildLosAndConeHandlesSvg({
                kind: "sensor",
                id: s.id,
                x: sx,
                y: sy,
                headingDeg: s.heading_deg || 0,
                fovDeg: s.fov_deg || 110,
                rangePx: s.range_px || 180,
                color: "#9333ea",
                isDoorContact: false,
                specLocked: panel._isSpecLocked(s),
              })
            : `<line x1="${sx.toFixed(1)}" y1="${sy.toFixed(1)}" x2="${px2.toFixed(1)}" y2="${py2.toFixed(1)}" stroke="#9333ea" stroke-width="1.8" opacity="0.7" style="pointer-events:none;" />`;
          return `
            <g class="fp-sensor-group" data-sensor-id="${panel._escape(s.id)}" style="${canEditSensor ? "opacity:1;" : "opacity:0.55;pointer-events:none;"}">
              <title>📡 ${panel._escape(s.name || s.id)} (${Number(s.fov_deg || 110)}° FOV, ${Math.round(Number(s.heading_deg || 0))}°)</title>
              ${isSelSens ? `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="13" fill="rgba(147, 51, 234, 0.16)" stroke="#9333ea" stroke-width="1.5" style="pointer-events:none;" />` : ""}
              ${handlesSvg}
              <g class="fp-handle-group fp-sensor-origin" data-sensor-id="${panel._escape(s.id)}" style="${canEditSensor ? "cursor:move;pointer-events:all;" : "pointer-events:none;"}">
                <circle class="fp-hit-target" cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="15" />
                <circle class="fp-handle-visible" cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${isSelSens ? "8" : "6.5"}" fill="#9333ea" stroke="#ffffff" stroke-width="2" style="pointer-events:none;" />
              </g>
            </g>
          `;
        })
        .join("")
    : "";

  const camControlsSvg = layerOn("cameras")
    ? fCams
        .map((cam) => {
          const camId = cam.id || cam.camera_entity;
          const camLabel = (cam.name || cam.label || camId).replace(" Camera", "");
          const isSelectedCam =
            canEditCam &&
            (panel._selectedDeviceType === "camera" || mode === "cameras") &&
            selCam &&
            (selCam.id || selCam.camera_entity) === camId;
          const hasSpill =
            (Array.isArray(cam.spills_into) && cam.spills_into.length > 0) ||
            camAnalysis.some((ca) => ca.camera_id === camId && ca.has_multi_room_bleed);
          const coneColor = hasSpill ? "#d97706" : "#0284c7";
          const cx = Number(cam.x || 0);
          const cy = Number(cam.y || 0);
          const rad = (Number(cam.heading_deg || 0) * Math.PI) / 180.0;
          const previewLen = 30;
          const px2 = cx + Math.cos(rad) * previewLen;
          const py2 = cy + Math.sin(rad) * previewLen;
          const camHandlesSvg = isSelectedCam
            ? panel._buildLosAndConeHandlesSvg({
                kind: "camera",
                id: camId,
                x: cx,
                y: cy,
                headingDeg: cam.heading_deg || 0,
                fovDeg: cam.fov_deg || 90,
                rangePx: cam.range_px || 180,
                color: coneColor,
                isDoorContact: false,
                specLocked: panel._isSpecLocked(cam),
              })
            : `<line x1="${cx.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${px2.toFixed(1)}" y2="${py2.toFixed(1)}" stroke="${coneColor}" stroke-width="2" opacity="0.75" style="pointer-events:none;" />`;

          return `
            <g class="fp-cam-group" data-cam-entity="${panel._escape(camId)}" style="${canEditCam ? "opacity:1;" : "opacity:0.45;pointer-events:none;"}">
              <title>📹 ${panel._escape(camLabel)} (${Math.round(Number(cam.heading_deg || 0))}°, ${Math.round(Number(cam.fov_deg || 90))}° FOV)</title>
              ${isSelectedCam ? `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="14" fill="rgba(2, 132, 199, 0.16)" stroke="${coneColor}" stroke-width="1.5" style="pointer-events:none;" />` : ""}
              ${camHandlesSvg}
              <g class="fp-handle-group fp-cam-origin" data-cam-entity="${panel._escape(camId)}" style="${canEditCam ? "cursor:move;pointer-events:all;" : "pointer-events:none;"}">
                <circle class="fp-hit-target" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="16" />
                <circle class="fp-handle-visible" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${isSelectedCam ? "8.5" : "6.5"}" fill="${coneColor}" stroke="#ffffff" stroke-width="2" style="pointer-events:none;" />
              </g>
            </g>
          `;
        })
        .join("")
    : "";

  const svgInner = `
    <defs>
      <pattern id="pdd-pat-cam-pir" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="10" height="10" fill="rgba(124, 58, 237, 0.14)" />
        <line x1="0" y1="0" x2="0" y2="10" stroke="#7c3aed" stroke-width="2.5" stroke-opacity="0.55" />
        <line x1="5" y1="0" x2="5" y2="10" stroke="#0284c7" stroke-width="2.5" stroke-opacity="0.55" />
      </pattern>
      <pattern id="pdd-pat-multi-cam" width="10" height="10" patternUnits="userSpaceOnUse">
        <rect width="10" height="10" fill="rgba(217, 119, 6, 0.16)" />
        <path d="M 0,10 L 10,0 M -2,2 L 2,-2 M 8,12 L 12,8" stroke="#d97706" stroke-width="2" stroke-opacity="0.65" />
        <path d="M 0,0 L 10,10" stroke="#0284c7" stroke-width="1.3" stroke-opacity="0.45" />
      </pattern>
      <pattern id="pdd-pat-cam-ble" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
        <rect width="10" height="10" fill="rgba(13, 148, 136, 0.14)" />
        <line x1="0" y1="0" x2="0" y2="10" stroke="#0d9488" stroke-width="2.4" stroke-opacity="0.55" />
        <line x1="5" y1="0" x2="5" y2="10" stroke="#0284c7" stroke-width="2.4" stroke-opacity="0.5" />
      </pattern>
      <pattern id="pdd-pat-pir-ble" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
        <rect width="10" height="10" fill="rgba(147, 51, 234, 0.13)" />
        <line x1="0" y1="0" x2="0" y2="10" stroke="#9333ea" stroke-width="2.2" stroke-opacity="0.5" />
        <line x1="5" y1="0" x2="5" y2="10" stroke="#0d9488" stroke-width="2.2" stroke-opacity="0.55" />
      </pattern>
      ${clipDefs.join("")}
    </defs>
    ${underlaySvg}
    ${layerOn("connections") ? connsSvg : ""}
    ${layerOn("rooms") ? roomsSvg : ""}
    ${layerOn("ble") ? bleRingsSvg : ""}
    ${layerOn("cameras") ? camConesSvg : ""}
    ${layerOn("overlaps") ? `<g class="fp-overlaps-layer" style="pointer-events:none;">${overlapShapes.join("")}</g>` : ""}
    ${layerOn("subzones") ? subZonesSvg : ""}
    ${layerOn("pir") ? pirConesSvg : ""}
    ${layerOn("occupants") || layerOn("ble") ? `<g class="fp-ekf-layer">${ekfTracksSvg}</g>` : ""}
    ${layerOn("occupants") ? occupantsSvg : ""}
    <g class="fp-controls-layer">
      ${bleControlsSvg}
      ${doorControlsSvg}
      ${pirControlsSvg}
      ${camControlsSvg}
    </g>
  `;

  return {
    ctx,
    svgInner,
    hudHtml: panel._buildFloorplanHudHtml(ctx),
    overlapCounts,
    totalOverlapPairs,
    subZoneCount,
    blindRoomCount,
    doorSensorsList,
    pirSensorsList,
    liveEstimates,
    ambiguities,
    connMap,
  };
}

