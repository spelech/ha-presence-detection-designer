import { PDD_DEFAULT_COMPILED_TOPOLOGY } from "./defaults.js";
import { computeCameraVisibilityPolygon, extractFloorWallSegments } from "./geometry.js";

export function compileFloorplanClient(panel, fpInput) {
  const fp = fpInput && Array.isArray(fpInput.rooms) ? fpInput : panel._getDefaultFloorplan();
  const base = JSON.parse(JSON.stringify(PDD_DEFAULT_COMPILED_TOPOLOGY));
  const rooms = fp.rooms || [];
  const conns = fp.connections || [];
  const cams = fp.cameras || [];
  const roomMap = {};
  rooms.forEach((r) => {
    roomMap[r.name || r.room_name] = r;
  });

  // Compute bidirectional connected_rooms_map expanding through transit spaces
  const adj = {};
  rooms.forEach((r) => {
    adj[r.name || r.room_name] = new Set();
  });
  conns.forEach((c) => {
    if (adj[c.from_room] && adj[c.to_room]) {
      adj[c.from_room].add(c.to_room);
      adj[c.to_room].add(c.from_room);
    }
  });
  const isTransit = (name) => {
    const r = roomMap[name];
    return r && (r.room_type === "transit" || Boolean(r.is_transit));
  };
  const connectedRoomsMap = {};
  Object.keys(adj).forEach((rName) => {
    if (isTransit(rName)) return;
    const visited = new Set([rName]);
    const queue = [...adj[rName]];
    const linked = new Set();
    while (queue.length > 0) {
      const cur = queue.shift();
      if (visited.has(cur)) continue;
      visited.add(cur);
      if (isTransit(cur)) {
        adj[cur]?.forEach((nxt) => {
          if (!visited.has(nxt)) queue.push(nxt);
        });
      } else {
        linked.add(cur);
      }
    }
    connectedRoomsMap[rName] = [...linked].sort();
  });
  base.connected_rooms_map = connectedRoomsMap;

  // Solid segments per floor
  const floorSegments = {};
  (fp.floors || []).forEach((fl) => {
    const flRooms = rooms.filter((r) => r.floor === fl.id);
    floorSegments[fl.id] = extractFloorWallSegments(flRooms, fp || panel._floorplan);
  });

  const pointInCone = (px, py, cam) => {
    const dx = px - Number(cam.x || 0);
    const dy = py - Number(cam.y || 0);
    const dist = Math.hypot(dx, dy);
    const range = Number(cam.range_px || 200);
    if (dist > range) return false;
    if (dist < 1e-3) return true;
    let ang = (Math.atan2(dy, dx) * 180) / Math.PI;
    let diff = ((ang - Number(cam.heading_deg || 0) + 540) % 360) - 180;
    return Math.abs(diff) <= Number(cam.fov_deg || 90) / 2;
  };

  const roomCoverage = {};
  rooms.forEach((r) => {
    const rName = r.name || r.room_name;
    const FloorCams = cams.filter((c) => c.floor === r.floor);
    const segments = floorSegments[r.floor] || [];
    let maxPct = 0;
    const rx = Number(r.x || 0);
    const ry = Number(r.y || 0);
    const rw = Number(r.width ?? r.w ?? 200);
    const rh = Number(r.height ?? r.h ?? 150);
    FloorCams.forEach((cam) => {
      let hits = 0;
      const total = 16;
      for (let ix = 0; ix < 4; ix++) {
        for (let iy = 0; iy < 4; iy++) {
          const sx = rx + ((ix + 0.5) * rw) / 4;
          const sy = ry + ((iy + 0.5) * rh) / 4;
          if (pointInCone(sx, sy, cam)) {
            if (
              !panel._lineSegmentIntersectsSolidWall(
                Number(cam.x || 0),
                Number(cam.y || 0),
                sx,
                sy,
                segments
              )
            ) {
              hits++;
            }
          }
        }
      }
      let pct = Math.round((hits / total) * 100);
      if (cam.host_room === rName) pct = Math.max(pct, 65);
      if (pct > maxPct) maxPct = pct;
    });
    roomCoverage[rName] = { max_coverage_pct: maxPct };
  });
  base.room_coverage = roomCoverage;

  // Update camera analysis with visibility polygons and occluded spillovers
  const cameraAnalysis = [];
  cams.forEach((cam) => {
    const camId = cam.id || cam.camera_entity;
    const hostRoom = cam.host_room || "";
    const camFloor = cam.floor || "";
    const segments = floorSegments[camFloor] || [];
    const declaredSpills = new Set(cam.spills_into || []);
    const overlaps = [];
    const visPoly = computeCameraVisibilityPolygon(cam, segments);

    rooms.forEach((r) => {
      if (r.floor !== camFloor) return;
      const rName = r.name || r.room_name;
      const rx = Number(r.x || 0);
      const ry = Number(r.y || 0);
      const rw = Number(r.width ?? r.w ?? 200);
      const rh = Number(r.height ?? r.h ?? 150);
      let hits = 0;
      const total = 16;
      for (let ix = 0; ix < 4; ix++) {
        for (let iy = 0; iy < 4; iy++) {
          const sx = rx + ((ix + 0.5) * rw) / 4;
          const sy = ry + ((iy + 0.5) * rh) / 4;
          if (pointInCone(sx, sy, cam)) {
            if (
              !panel._lineSegmentIntersectsSolidWall(
                Number(cam.x || 0),
                Number(cam.y || 0),
                sx,
                sy,
                segments
              )
            ) {
              hits++;
            }
          }
        }
      }
      const pct = Math.round((hits / total) * 100);
      if (rName !== hostRoom && (pct >= 5 || declaredSpills.has(rName))) {
        const effPct = Math.max(pct, declaredSpills.has(rName) ? 18 : pct);
        overlaps.push({ room_name: rName, overlap_pct: effPct });
      }
    });

    cameraAnalysis.push({
      camera_id: camId,
      name: cam.name || camId,
      host_room: hostRoom,
      floor: camFloor,
      zones: Array.isArray(cam.zones) ? cam.zones : [],
      spillover_targets: overlaps,
      has_multi_room_bleed: overlaps.length > 0,
      visibility_polygon: visPoly,
    });
  });
  base.camera_analysis = cameraAnalysis;

  return base;
}

