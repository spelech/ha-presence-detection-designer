import { PDD_DEFAULT_FLOORPLAN, PDD_DEVICE_MODEL_PRESETS } from "./defaults.js";
// Shared 2D floorplan geometry, raycasting, and SVG path utilities.


export function fitSvgLabel(text, maxWidthPx, fontSize = 12) {
  const str = String(text || "");
  if (!str || maxWidthPx < 20) return "";
  const charW = fontSize * 0.65;
  const maxChars = Math.floor(maxWidthPx / charW);
  if (maxChars < 2) return "";
  if (str.length <= maxChars) return str;
  if (maxChars >= 4) return `${str.slice(0, maxChars - 1)}…`;
  return str.slice(0, maxChars);
}


export function roomLabelAnchor(box) {
  const rx = Number(box.x || 0);
  const ry = Number(box.y || 0);
  const rw = Number(box.width ?? box.w ?? 200);
  const rh = Number(box.height ?? box.h ?? 150);
  const svgPath = box.svg_path;
  if (!svgPath || typeof svgPath !== "string") {
    return { x: rx, y: ry, w: rw, h: rh };
  }
  const pts = [];
  const re = /[ML]\s*(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/gi;
  let m;
  while ((m = re.exec(svgPath)) !== null) {
    pts.push([Number(m[1]), Number(m[2])]);
  }
  if (pts.length < 3) {
    return { x: rx, y: ry, w: rw, h: rh };
  }
  const bestSpanAt = (scanY) => {
    const xs = [];
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[(i + 1) % pts.length];
      if ((y1 <= scanY && y2 > scanY) || (y2 <= scanY && y1 > scanY)) {
        xs.push(x1 + ((scanY - y1) * (x2 - x1)) / (y2 - y1));
      }
    }
    xs.sort((a, b) => a - b);
    let best = null;
    for (let i = 0; i + 1 < xs.length; i += 2) {
      const spanW = xs[i + 1] - xs[i];
      if (!best || spanW > best.w) {
        best = { x: xs[i], w: spanW };
      }
    }
    return best;
  };
  const topSpan = bestSpanAt(ry + Math.min(20, rh * 0.25));
  const midSpan = bestSpanAt(ry + rh * 0.55);
  if (topSpan && topSpan.w >= 70) {
    return { x: topSpan.x, y: ry, w: topSpan.w, h: rh };
  }
  if (midSpan && (!topSpan || midSpan.w > topSpan.w)) {
    return { x: midSpan.x, y: ry + Math.max(0, rh * 0.55 - 24), w: midSpan.w, h: rh };
  }
  if (topSpan) {
    return { x: topSpan.x, y: ry, w: topSpan.w, h: rh };
  }
  return { x: rx, y: ry, w: rw, h: rh };
}


export function snapValue(val, step = 10) {
  return Math.round(val / step) * step;
}


export function transformSvgPath(svgPath, sx, sy, oldW, oldH, nx, ny, nw, nh) {
  if (!svgPath || typeof svgPath !== "string") return svgPath;
  const scaleX = oldW > 0 ? nw / oldW : 1;
  const scaleY = oldH > 0 ? nh / oldH : 1;
  return svgPath.replace(
    /(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/g,
    (_m, px, py) => {
      const rx = nx + (Number(px) - sx) * scaleX;
      const ry = ny + (Number(py) - sy) * scaleY;
      return `${Math.round(rx * 10) / 10},${Math.round(ry * 10) / 10}`;
    }
  );
}


export function snapRoomGeometry(box, otherRooms, snapDist = 8) {
  let x = snapValue(box.x);
  let y = snapValue(box.y);
  let w = Math.max(60, snapValue(box.width ?? box.w ?? 200));
  let h = Math.max(50, snapValue(box.height ?? box.h ?? 150));
  const r = x + w;
  const b = y + h;

  for (const other of otherRooms) {
    if (other === box) continue;
    const ox = Number(other.x);
    const oy = Number(other.y);
    const ow = Number(other.width ?? other.w ?? 200);
    const oh = Number(other.height ?? other.h ?? 150);
    const oright = ox + ow;
    const obottom = oy + oh;

    if (Math.abs(x - ox) <= snapDist) x = ox;
    else if (Math.abs(x - oright) <= snapDist) x = oright;
    else if (Math.abs(r - ox) <= snapDist) x = ox - w;
    else if (Math.abs(r - oright) <= snapDist) x = oright - w;

    if (Math.abs(y - oy) <= snapDist) y = oy;
    else if (Math.abs(y - obottom) <= snapDist) y = obottom;
    else if (Math.abs(b - oy) <= snapDist) y = oy - h;
    else if (Math.abs(b - obottom) <= snapDist) y = obottom - h;
  }

  box.x = x;
  box.y = y;
  box.width = w;
  box.height = h;
}


export function extractFloorWallSegments(rooms, floorplan = null) {
  const roomList = rooms || [];
  if (roomList.length > 0 && floorplan && floorplan.floor_wall_segments) {
    const floorId = roomList[0].floor || "main";
    const calibrated = floorplan.floor_wall_segments[floorId];
    if (Array.isArray(calibrated) && calibrated.length > 0) {
      const defRooms = (PDD_DEFAULT_FLOORPLAN.rooms || []).filter((r) => (r.floor || "main") === floorId);
      const matchesDefault =
        defRooms.length === roomList.length &&
        roomList.every((r) => {
          const dr = defRooms.find((d) => (d.id && d.id === r.id) || (d.name || d.room_name) === (r.name || r.room_name));
          return (
            dr &&
            Number(r.x) === Number(dr.x) &&
            Number(r.y) === Number(dr.y) &&
            Number(r.width ?? r.w) === Number(dr.width ?? dr.w) &&
            Number(r.height ?? r.h) === Number(dr.height ?? dr.h)
          );
        });
      if (matchesDefault) {
        return calibrated;
      }
    }
  }
  const solidSegments = [];
  (rooms || []).forEach((r) => {
    const rx = Number(r.x || 0);
    const ry = Number(r.y || 0);
    const rw = Math.max(1, Number(r.width ?? r.w ?? 100));
    const rh = Math.max(1, Number(r.height ?? r.h ?? 100));
    const entryways = Array.isArray(r.entryways) ? r.entryways : [];

    const walls = {
      top: [rw, [[rx, ry], [rx + rw, ry]]],
      bottom: [rw, [[rx, ry + rh], [rx + rw, ry + rh]]],
      left: [rh, [[rx, ry], [rx, ry + rh]]],
      right: [rh, [[rx + rw, ry], [rx + rw, ry + rh]]],
    };

    Object.keys(walls).forEach((wallName) => {
      const [length, [[x1, y1], [x2, y2]]] = walls[wallName];
      const wallOpenings = [];
      entryways.forEach((ew) => {
        if (ew.wall === wallName) {
          const offset = Math.max(0, Number(ew.offset || 0));
          const width = Math.max(1, Number(ew.width || 36));
          const start = Math.max(0, Math.min(length, offset));
          const end = Math.max(0, Math.min(length, offset + width));
          if (start < end) wallOpenings.push([start, end]);
        }
      });
      wallOpenings.sort((a, b) => a[0] - b[0]);
      const merged = [];
      wallOpenings.forEach(([start, end]) => {
        if (merged.length > 0 && merged[merged.length - 1][1] >= start) {
          merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], end);
        } else {
          merged.push([start, end]);
        }
      });

      let cur = 0;
      merged.forEach(([start, end]) => {
        if (start > cur + 0.001) {
          if (wallName === "top" || wallName === "bottom") {
            solidSegments.push([[rx + cur, y1], [rx + start, y1]]);
          } else {
            solidSegments.push([[x1, ry + cur], [x1, ry + start]]);
          }
        }
        cur = Math.max(cur, end);
      });
      if (cur < length - 0.001) {
        if (wallName === "top" || wallName === "bottom") {
          solidSegments.push([[rx + cur, y1], [rx + length, y1]]);
        } else {
          solidSegments.push([[x1, ry + cur], [x1, ry + length]]);
        }
      }
    });
  });
  return solidSegments;
}


export function raySegmentIntersection(ox, oy, dx, dy, x1, y1, x2, y2) {
  const vx = x2 - x1;
  const vy = y2 - y1;
  const denom = dx * vy - dy * vx;
  if (Math.abs(denom) < 1e-9) return null;
  const wx = x1 - ox;
  const wy = y1 - oy;
  const t = (wx * vy - wy * vx) / denom;
  const u = (wx * dy - wy * dx) / denom;
  if (t > 1e-4 && u >= -1e-5 && u <= 1.00001) {
    return t;
  }
  return null;
}


export function lineSegmentIntersectsSolidWall(x1, y1, x2, y2, solidSegments, eps = 1e-3) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  for (let i = 0; i < solidSegments.length; i++) {
    const [[sx1, sy1], [sx2, sy2]] = solidSegments[i];
    const vx = sx2 - sx1;
    const vy = sy2 - sy1;
    const denom = dx * vy - dy * vx;
    if (Math.abs(denom) < 1e-9) continue;
    const wx = sx1 - x1;
    const wy = sy1 - y1;
    const t = (wx * vy - wy * vx) / denom;
    const u = (wx * dy - wy * dx) / denom;
    if (t >= eps && t <= 1.0 - eps && u >= -1e-5 && u <= 1.00001) {
      return true;
    }
  }
  return false;
}


export function computeCameraVisibilityPolygon(cam, solidSegments, stepDeg = 2.0) {
  const cx = Number(cam.x || 0);
  const cy = Number(cam.y || 0);
  const heading = Number(cam.heading_deg || 0);
  const fov = Math.max(5, Math.min(360, Number(cam.fov_deg || 90)));
  const reach = Math.max(10, Number(cam.range_px || 200));

  const preset =
    typeof PDD_DEVICE_MODEL_PRESETS !== "undefined" && cam.model_preset
      ? PDD_DEVICE_MODEL_PRESETS[cam.model_preset] || {}
      : {};
  const innerFov = Number(cam.inner_fov_deg || preset.inner_fov_deg || 0);
  const innerReach = Number(cam.inner_range_px || preset.inner_range_px || 0);
  const hasDualLobe = innerFov > 0 && innerFov < fov && innerReach > reach;
  const maxReach = hasDualLobe ? Math.max(reach, innerReach) : reach;

  const startDeg = heading - fov / 2.0;
  const endDeg = heading + fov / 2.0;

  const angleSet = new Set();
  const numSteps = Math.max(8, Math.ceil(fov / stepDeg));
  for (let i = 0; i <= numSteps; i++) {
    angleSet.add(Number((startDeg + (i / numSteps) * fov).toFixed(3)));
  }

  if (hasDualLobe) {
    const lobeLeft = heading - innerFov / 2.0;
    const lobeRight = heading + innerFov / 2.0;
    [lobeLeft, lobeRight].forEach((edgeDeg) => {
      angleSet.add(Number((edgeDeg - 0.05).toFixed(3)));
      angleSet.add(Number(edgeDeg.toFixed(3)));
      angleSet.add(Number((edgeDeg + 0.05).toFixed(3)));
    });
  }

  if (Array.isArray(solidSegments)) {
    solidSegments.forEach(([[x1, y1], [x2, y2]]) => {
      [[x1, y1], [x2, y2]].forEach(([px, py]) => {
        const dx = px - cx;
        const dy = py - cy;
        const dist = Math.hypot(dx, dy);
        if (dist < 1e-3 || dist > maxReach * 1.5) return;
        const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
        const diff = ((deg - heading + 540) % 360) - 180;
        const candDeg = heading + diff;
        if (candDeg >= startDeg && candDeg <= endDeg) {
          angleSet.add(Number((candDeg - 0.02).toFixed(3)));
          angleSet.add(Number(candDeg.toFixed(3)));
          angleSet.add(Number((candDeg + 0.02).toFixed(3)));
        }
      });
    });
  }

  const sortedAngles = Array.from(angleSet).sort((a, b) => a - b);
  const points = [];
  sortedAngles.forEach((deg) => {
    const rad = (deg * Math.PI) / 180;
    const dx = Math.cos(rad);
    const dy = Math.sin(rad);
    const rayReach =
      hasDualLobe && Math.abs(deg - heading) <= innerFov / 2.0 + 1e-3 ? innerReach : reach;
    let minT = rayReach;
    if (Array.isArray(solidSegments)) {
      for (let i = 0; i < solidSegments.length; i++) {
        const [[x1, y1], [x2, y2]] = solidSegments[i];
        const t = raySegmentIntersection(cx, cy, dx, dy, x1, y1, x2, y2);
        if (t !== null && t < minT) minT = t;
      }
    }
    points.push([Number((cx + minT * dx).toFixed(1)), Number((cy + minT * dy).toFixed(1))]);
  });

  return [[cx, cy], ...points];
}


export function buildStepSvgPaths(series, width = 900, height = 170) {
  const pts = series || [];
  if (pts.length === 0) {
    return { linePath: "", areaPath: "" };
  }
  const coords = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const x = Math.max(0, Math.min(width, (Number(p.offset_pct || 0) / 100) * width));
    const y = Math.max(
      6,
      Math.min(height - 6, height - (Number(p.probability_pct || 0) / 100) * (height - 12) - 6)
    );
    if (i > 0) {
      const prevY = coords[coords.length - 1][1];
      coords.push([x, prevY]);
    }
    coords.push([x, y]);
  }
  const lastY = coords[coords.length - 1][1];
  coords.push([width, lastY]);

  const linePath = coords
    .map((c, idx) => `${idx === 0 ? "M" : "L"}${c[0].toFixed(1)},${c[1].toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;
  return { linePath, areaPath };
}


export function getSvgPoint(e, svgEl) {
  if (!svgEl) return { x: 0, y: 0 };
  const pt = svgEl.createSVGPoint ? svgEl.createSVGPoint() : null;
  if (pt && svgEl.getScreenCTM) {
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svgEl.getScreenCTM();
    if (ctm) {
      const transformed = pt.matrixTransform(ctm.inverse());
      return { x: transformed.x, y: transformed.y };
    }
  }
  const rect = svgEl.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / Math.max(1, rect.width)) * 1000,
    y: ((e.clientY - rect.top) / Math.max(1, rect.height)) * 580,
  };
}


export function coneSvgPath(cam, solidSegments = null) {
  if (solidSegments && solidSegments.length > 0) {
    const poly = computeCameraVisibilityPolygon(cam, solidSegments);
    if (poly && poly.length >= 3) {
      return (
        poly
          .map((pt, idx) => `${idx === 0 ? "M" : "L"} ${pt[0].toFixed(1)},${pt[1].toFixed(1)}`)
          .join(" ") + " Z"
      );
    }
  }
  const cx = Number(cam.x || 0);
  const cy = Number(cam.y || 0);
  const r = Math.max(20, Number(cam.range_px || 180));
  const heading = Number(cam.heading_deg || 0);
  const fov = Math.max(10, Math.min(350, Number(cam.fov_deg || 90)));
  const startDeg = heading - fov / 2.0;
  const endDeg = heading + fov / 2.0;
  const startRad = (startDeg * Math.PI) / 180.0;
  const endRad = (endDeg * Math.PI) / 180.0;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const largeArc = fov > 180 ? 1 : 0;
  return `M ${cx.toFixed(1)},${cy.toFixed(1)} L ${x1.toFixed(1)},${y1.toFixed(
    1
  )} A ${r.toFixed(1)},${r.toFixed(1)} 0 ${largeArc},1 ${x2.toFixed(1)},${y2.toFixed(1)} Z`;
}

