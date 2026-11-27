import { escapeHtml } from "./formatters.js";


export function renderCameraSelectOptions(panel, selectedEntityId, entities) {
  const cur = String(selectedEntityId || "").trim();
  const cams = (entities || [])
    .filter((e) => e.domain === "camera" || String(e.entity_id || "").startsWith("camera."))
    .slice()
    .sort((a, b) =>
      String(a.name || a.entity_id || "").localeCompare(String(b.name || b.entity_id || ""))
    );
  const hasCur = !cur || cams.some((c) => c.entity_id === cur);
  const opts = [
    `<option value="" ${!cur ? "selected" : ""}>None (No AI Vision Camera)</option>`,
  ];
  cams.forEach((c) => {
    const label =
      c.name && c.name !== c.entity_id ? `${c.name} (${c.entity_id})` : c.entity_id;
    opts.push(
      `<option value="${escapeHtml(c.entity_id)}" ${
        c.entity_id === cur ? "selected" : ""
      }>${escapeHtml(label)}</option>`
    );
  });
  if (!hasCur) {
    opts.push(
      `<option value="${escapeHtml(cur)}" selected>${escapeHtml(cur)} (custom / offline)</option>`
    );
  }
  return opts.join("");
}


export function renderToastHtml(toast) {
  if (!toast) return "";
  return `<div class="toast ${escapeHtml(toast.type || "info")}">${escapeHtml(toast.msg || "")}</div>`;
}

export function buildLosAndConeHandlesSvg(panel, {
  kind,
  id,
  x,
  y,
  headingDeg,
  fovDeg,
  rangePx,
  color,
  isDoorContact = false,
  specLocked = false,
}) {
  const cx = Number(x || 0);
  const cy = Number(y || 0);
  if (isDoorContact) return "";
  const rad = (Number(headingDeg || 0) * Math.PI) / 180.0;
  const fov = Math.max(10, Math.min(350, Number(fovDeg || 90)));
  const reach = Math.max(25, Number(rangePx || 180));
  const aimDist = reach >= 85 ? Math.max(42, Math.min(68, reach * 0.45)) : reach + 24;
  const aimX = cx + Math.cos(rad) * aimDist;
  const aimY = cy + Math.sin(rad) * aimDist;
  const tipX = cx + Math.cos(rad) * reach;
  const tipY = cy + Math.sin(rad) * reach;
  const startRad = ((Number(headingDeg || 0) - fov / 2.0) * Math.PI) / 180.0;
  const endRad = ((Number(headingDeg || 0) + fov / 2.0) * Math.PI) / 180.0;
  const fovHandleDist = Math.min(118, Math.max(36, reach * 0.68));
  const fov1X = cx + Math.cos(startRad) * fovHandleDist;
  const fov1Y = cy + Math.sin(startRad) * fovHandleDist;
  const fov2X = cx + Math.cos(endRad) * fovHandleDist;
  const fov2Y = cy + Math.sin(endRad) * fovHandleDist;

  const cls = kind === "camera" ? "fp-cam-handle" : "fp-sensor-handle";
  const idAttr =
    kind === "camera"
      ? `data-cam-id="${escapeHtml(id)}"`
      : `data-sensor-id="${escapeHtml(id)}"`;

  const arrowTipBack1X = aimX - Math.cos(rad - 0.42) * 8;
  const arrowTipBack1Y = aimY - Math.sin(rad - 0.42) * 8;
  const arrowTipBack2X = aimX - Math.cos(rad + 0.42) * 8;
  const arrowTipBack2Y = aimY - Math.sin(rad + 0.42) * 8;

  return `
    <line x1="${cx.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${tipX.toFixed(1)}" y2="${tipY.toFixed(1)}" stroke="${color}" stroke-width="1.4" stroke-dasharray="4,3" opacity="0.65" style="pointer-events:none;" />
    <line x1="${cx.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${aimX.toFixed(1)}" y2="${aimY.toFixed(1)}" stroke="${color}" stroke-width="2.6" stroke-linecap="round" style="pointer-events:none;" />
    <polyline points="${arrowTipBack1X.toFixed(1)},${arrowTipBack1Y.toFixed(1)} ${aimX.toFixed(1)},${aimY.toFixed(1)} ${arrowTipBack2X.toFixed(1)},${arrowTipBack2Y.toFixed(1)}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none;" />

    <g class="fp-handle-group ${cls}" data-handle="heading" ${idAttr} style="cursor:grab;">
      <title>Drag to rotate Line of Sight (${Math.round(Number(headingDeg || 0))}°) — Hold Shift to snap 15°</title>
      <circle class="fp-hit-target" cx="${aimX.toFixed(1)}" cy="${aimY.toFixed(1)}" r="15" />
      <circle class="fp-handle-visible" cx="${aimX.toFixed(1)}" cy="${aimY.toFixed(1)}" r="7" fill="#ffffff" stroke="${color}" stroke-width="2.5" style="pointer-events:none;" />
    </g>
    ${
      specLocked
        ? ""
        : `
    <g class="fp-handle-group ${cls}" data-handle="range" ${idAttr} style="cursor:ew-resize;">
      <title>Drag to resize Range (${Math.round(reach)}px)</title>
      <circle class="fp-hit-target" cx="${tipX.toFixed(1)}" cy="${tipY.toFixed(1)}" r="15" />
      <rect class="fp-handle-visible" x="${(tipX - 5.5).toFixed(1)}" y="${(tipY - 5.5).toFixed(1)}" width="11" height="11" rx="3" fill="${color}" stroke="#ffffff" stroke-width="2" style="pointer-events:none;" />
    </g>

    <g class="fp-handle-group ${cls}" data-handle="fov_start" ${idAttr} style="cursor:ew-resize;">
      <title>Drag to widen/narrow FOV (${Math.round(fov)}°)</title>
      <circle class="fp-hit-target" cx="${fov1X.toFixed(1)}" cy="${fov1Y.toFixed(1)}" r="14" />
      <circle class="fp-handle-visible" cx="${fov1X.toFixed(1)}" cy="${fov1Y.toFixed(1)}" r="5.5" fill="#ffffff" stroke="${color}" stroke-width="2" style="pointer-events:none;" />
    </g>

    <g class="fp-handle-group ${cls}" data-handle="fov_end" ${idAttr} style="cursor:ew-resize;">
      <title>Drag to widen/narrow FOV (${Math.round(fov)}°)</title>
      <circle class="fp-hit-target" cx="${fov2X.toFixed(1)}" cy="${fov2Y.toFixed(1)}" r="14" />
      <circle class="fp-handle-visible" cx="${fov2X.toFixed(1)}" cy="${fov2Y.toFixed(1)}" r="5.5" fill="#ffffff" stroke="${color}" stroke-width="2" style="pointer-events:none;" />
    </g>`
    }
  `;
}
