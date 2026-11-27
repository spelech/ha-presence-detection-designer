import { PDD_DEFAULT_FLOORPLAN } from "./defaults.js";
import { escapeHtml } from "./formatters.js";
import { roomLabelAnchor } from "./geometry.js";


export function hslToRgb(h, s, l) {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}


export function colorFromHex(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return {
    hex,
    border: `rgba(${r}, ${g}, ${b}, 0.52)`,
    bg: `rgba(${r}, ${g}, ${b}, 0.14)`,
  };
}


export function getRoomColor(panel, roomName) {
  const palette = [
    "#0284c7", // Sky Blue
    "#16a34a", // Emerald Green
    "#ea580c", // Vivid Orange
    "#9333ea", // Royal Purple
    "#db2777", // Hot Pink
    "#0d9488", // Teal
    "#d97706", // Amber Gold
    "#2563eb", // Cobalt Blue
    "#dc2626", // Crimson Red
    "#65a30d", // Olive Lime
    "#0891b2", // Cyan
    "#c026d3", // Fuchsia
    "#4f46e5", // Indigo
    "#b45309", // Bronze
    "#059669", // Mint Emerald
    "#e11d48", // Rose
    "#6366f1", // Periwinkle
    "#0f766e", // Deep Teal
    "#ca8a04", // Mustard
    "#be185d", // Berry
    "#1d4ed8", // Navy Blue
    "#15803d", // Forest Green
    "#9a3412", // Terracotta
    "#7c3aed", // Violet
  ];
  const key = String(roomName || "").trim();
  if (!key) return { hex: "#64748b", border: "rgba(100, 116, 139, 0.45)", bg: "rgba(100, 116, 139, 0.1)" };

  const fp = panel._floorplan || panel._overview?.floorplan || PDD_DEFAULT_FLOORPLAN;
  const floorOrderMap = new Map();
  (fp.floors || []).forEach((fl, i) => {
    if (fl && fl.id) floorOrderMap.set(fl.id, Number(fl.order ?? i));
  });

  const roomFloorMap = new Map();
  (fp.rooms || []).forEach((b) => {
    const n = b && (b.name || b.room_name);
    if (n) roomFloorMap.set(n, b.floor || "main");
  });
  ((panel._overview && panel._overview.rooms) || []).forEach((r) => {
    if (r && r.room_name && !roomFloorMap.has(r.room_name)) {
      roomFloorMap.set(r.room_name, r.floor || r.area || "unassigned");
    }
  });

  const floorGroups = new Map();
  Array.from(roomFloorMap.keys())
    .sort((a, b) => a.localeCompare(b))
    .forEach((n) => {
      const fl = roomFloorMap.get(n) || "unassigned";
      if (!floorGroups.has(fl)) floorGroups.set(fl, []);
      floorGroups.get(fl).push(n);
    });

  const sortedFloors = Array.from(floorGroups.keys()).sort((a, b) => {
    const oa = floorOrderMap.has(a) ? floorOrderMap.get(a) : 99;
    const ob = floorOrderMap.has(b) ? floorOrderMap.get(b) : 99;
    return oa !== ob ? oa - ob : a.localeCompare(b);
  });

  const totalKnown = roomFloorMap.size;
  const assigned = new Map();
  if (totalKnown <= palette.length) {
    let cursor = 0;
    sortedFloors.forEach((fl) => {
      (floorGroups.get(fl) || []).forEach((rn) => {
        assigned.set(rn, colorFromHex(palette[cursor++]));
      });
    });
  } else {
    sortedFloors.forEach((fl, fIdx) => {
      const names = floorGroups.get(fl) || [];
      const floorOffset = (fIdx * 7) % palette.length;
      names.forEach((rn, rIdx) => {
        if (rIdx < palette.length) {
          assigned.set(rn, colorFromHex(palette[(rIdx + floorOffset) % palette.length]));
        } else {
          const hue = Math.round(((rIdx * 137.508 + fIdx * 47) % 360));
          const [r, g, b] = hslToRgb(hue, 72, 46);
          const toHex = (n) => n.toString(16).padStart(2, "0");
          assigned.set(rn, {
            hex: `#${toHex(r)}${toHex(g)}${toHex(b)}`,
            border: `rgba(${r}, ${g}, ${b}, 0.52)`,
            bg: `rgba(${r}, ${g}, ${b}, 0.14)`,
          });
        }
      });
    });
  }

  if (assigned.has(key)) return assigned.get(key);

  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0;
  }
  return colorFromHex(palette[h % palette.length]);
}


export function getRoomInteriorAnchor(box) {
  if (!box) return { x: 100, y: 100 };
  if (box.svg_path) {
    const anc = roomLabelAnchor(box);
    return {
      x: Math.round(anc.x + Math.max(40, (anc.w || 120) * 0.48)),
      y: Math.round(anc.y + Math.max(44, Math.min(82, (anc.h || 100) * 0.58))),
    };
  }
  const rx = Number(box.x || 0);
  const ry = Number(box.y || 0);
  const rw = Number(box.width ?? 180);
  const rh = Number(box.height ?? 140);
  return {
    x: Math.round(rx + rw / 2),
    y: Math.round(ry + Math.max(Math.min(rh - 18, 46), rh * 0.6)),
  };
}


export function resolveOccupantProfile(occ, overview = null) {
  const rawLabel = String(occ?.occupant_label || (occ?.detected_people && occ.detected_people[0]) || occ?.occupant_type || "Person").trim();
  const lower = rawLabel.toLowerCase();
  const oType = String(occ?.occupant_type || "").toLowerCase();
  const methodStr = String(occ?.method || occ?.inference_type || "").toLowerCase();
  const isInferred = methodStr === "negative_space" || methodStr.startsWith("negative_space_");

  if (oType === "pet" || lower.includes("dog") || lower.includes("pet")) {
    return {
      key: rawLabel || "Household Pet (Dog)",
      shortLabel: rawLabel.replace(/\s*\(Dog\)/i, "").trim() || "Household Pet",
      role: "pet",
      isInferred: false,
      color: "#d97706",
      bg: "#fef3c7",
      pictureUrl: null,
    };
  }
  if (lower.includes("resident b") || lower.includes("resident_b") || lower.includes("kid") || lower.includes("child")) {
    return {
      key: rawLabel || "Resident B",
      shortLabel: rawLabel || "Resident B",
      role: "kid",
      isInferred,
      color: isInferred ? "#0284c7" : "#db2777",
      bg: isInferred ? "#e0f2fe" : "#fce7f3",
      pictureUrl: null,
    };
  }

  const entities = overview?.entities || [];
  const personEnt = entities.find((e) => {
    if (!e || e.domain !== "person") return false;
    const eName = String(e.name || "").trim().toLowerCase();
    const eSlug = String(e.entity_id || "").replace(/^person\./, "").toLowerCase();
    return eName === lower || eSlug === lower || lower.startsWith(eName + " ");
  });

  const pic = personEnt && personEnt.entity_picture ? String(personEnt.entity_picture).trim() : "";
  const shortName = rawLabel.includes("/") ? rawLabel.split("/")[0].trim() : rawLabel;
  return {
    key: rawLabel || "Person",
    shortLabel: shortName || "Person",
    role: "person",
    isInferred,
    color: isInferred ? "#0284c7" : "#16a34a",
    bg: isInferred ? "#e0f2fe" : "#dcfce7",
    pictureUrl: pic || null,
  };
}


export function buildOccupantTokenSvg(panel, prof, x, y, prefixId, opts = "") {
  const cfg = typeof opts === "string" ? { subTag: opts } : (opts || {});
  const subTag = String(cfg.subTag || "");
  const isInferred = cfg.isInferred !== undefined ? Boolean(cfg.isInferred) : Boolean(prof.isInferred);
  const count = cfg.count !== undefined ? Number(cfg.count) : (prof.role === "pet" ? 0 : 1);
  const ringColor = cfg.ringColor || (prof.role === "pet" ? "#d97706" : isInferred ? "#0284c7" : prof.role === "kid" ? "#db2777" : "#16a34a");
  const ringDashAttr = isInferred ? ` stroke-dasharray="5,3"` : "";
  const ringWidth = isInferred ? "2.8" : "3";

  const safeKey = String(prof.key || "occ").replace(/[^a-zA-Z0-9_-]/g, "_");
  const clipId = `${prefixId}-clip-${safeKey}`;
  const r = 17;
  let innerAvatar = "";
  if (prof.pictureUrl) {
    innerAvatar = `
      <clipPath id="${clipId}">
        <circle cx="0" cy="0" r="${r - 2}" />
      </clipPath>
      <circle cx="0" cy="0" r="${r}" fill="#ffffff" stroke="${ringColor}" stroke-width="${ringWidth}"${ringDashAttr} />
      <image href="${escapeHtml(prof.pictureUrl)}" x="${-(r - 2)}" y="${-(r - 2)}" width="${(r - 2) * 2}" height="${(r - 2) * 2}" clip-path="url(#${clipId})" preserveAspectRatio="xMidYMid slice" />
    `;
  } else if (prof.role === "pet") {
    innerAvatar = `
      <circle cx="0" cy="0" r="${r}" fill="${prof.bg}" stroke="${ringColor}" stroke-width="${ringWidth}"${ringDashAttr} />
      <text x="0" y="6" text-anchor="middle" font-size="18">🐶</text>
    `;
  } else if (prof.role === "kid") {
    innerAvatar = `
      <circle cx="0" cy="0" r="${r}" fill="${prof.bg}" stroke="${ringColor}" stroke-width="${ringWidth}"${ringDashAttr} />
      <text x="0" y="6" text-anchor="middle" font-size="18">🧒</text>
    `;
  } else {
    innerAvatar = `
      <circle cx="0" cy="0" r="${r}" fill="${prof.bg}" stroke="${ringColor}" stroke-width="${ringWidth}"${ringDashAttr} />
      <circle cx="0" cy="-4.5" r="5" fill="${ringColor}" />
      <path d="M -8.5 10 C -8.5 4.2, -4.5 2.5, 0 2.5 C 4.5 2.5, 8.5 4.2, 8.5 10 Z" fill="${ringColor}" />
    `;
  }
  const labelText = prof.shortLabel.slice(0, 14);
  const pillW = Math.max(46, Math.min(118, labelText.length * 6.5 + 14));
  const subTagSvg = subTag
    ? `<rect x="${(-pillW / 2 - 6).toFixed(1)}" y="${(-r - 17).toFixed(1)}" width="${(pillW + 12).toFixed(1)}" height="14" rx="7" fill="#0f172a" opacity="0.86" />
       <text x="0" y="${(-r - 7).toFixed(1)}" text-anchor="middle" fill="#f8fafc" font-size="8.5" font-weight="600">${escapeHtml(subTag)}</text>`
    : "";
  const showCountBadge = prof.role !== "pet" && Number.isFinite(count) && count > 1;
  const badgeColor = isInferred ? "#0284c7" : "#15803d";
  const countBadgeSvg = showCountBadge
    ? `<g class="tl-occ-count-badge" transform="translate(${(r * 0.74).toFixed(1)}, ${(r * 0.74).toFixed(1)})">
         <circle cx="0" cy="0" r="8" fill="${badgeColor}" stroke="#ffffff" stroke-width="1.8" />
         <text x="0" y="3.3" text-anchor="middle" fill="#ffffff" font-size="9.5" font-weight="800">${Math.round(count)}</text>
       </g>`
    : "";
  const tokenSig = `${prof.role}|${isInferred ? "inf" : "conf"}|${count}|${subTag}|${prof.pictureUrl || ""}|${labelText}`;
  return `
    <g class="tl-occ-node" data-occ-key="${escapeHtml(prof.key)}" data-token-sig="${escapeHtml(tokenSig)}" transform="translate(${x.toFixed(1)}, ${y.toFixed(1)})" style="pointer-events:none;">
      ${subTagSvg}
      <circle cx="0" cy="0" r="${r + 4}" fill="${ringColor}" fill-opacity="0.14"${ringDashAttr} />
      ${innerAvatar}
      ${countBadgeSvg}
      <rect x="${(-pillW / 2).toFixed(1)}" y="${(r + 3).toFixed(1)}" width="${pillW.toFixed(1)}" height="16" rx="8" fill="#0f172a" opacity="0.9" />
      <text x="0" y="${(r + 14).toFixed(1)}" text-anchor="middle" fill="#ffffff" font-size="9.5" font-weight="700">${escapeHtml(labelText)}</text>
    </g>
  `;
}

