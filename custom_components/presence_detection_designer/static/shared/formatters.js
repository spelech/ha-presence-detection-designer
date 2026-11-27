// Shared formatting, escaping, role-mapping, and status-summary helpers.


export function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}


export function formatDuration(sec) {
  const s = Math.max(0, Math.round(Number(sec || 0)));
  if (s === 0) return "0s";
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m === 0) return `${rem}s`;
  if (rem === 0) return `${m}m`;
  return `${m}m ${rem}s`;
}


export function friendlyRoleGroup(obs) {
  const p = String(obs.preset || obs.weight || "moderate").toLowerCase();
  if (obs.corroboration_only || p === "weak_hint") return "keepalive";
  if (p === "decisive" || p === "strong") return "primary";
  return "shared";
}


export function sensorWeightMap(panel, selRoom, prev) {
  const map = {};
  const lists = [prev?.sensor_weights, selRoom?.sensor_weights];
  for (const lst of lists) {
    if (!Array.isArray(lst)) continue;
    for (const item of lst) {
      if (item && item.entity_id && !map[item.entity_id]) {
        map[item.entity_id] = item;
      }
    }
  }
  return map;
}


export function isHumanExclusiveCandidate(panel, eid, weightMap = null) {
  if (!eid) return false;
  const w = weightMap ? weightMap[eid] : sensorWeightMap(panel, panel.selectedRoom, panel._previewData)[eid];
  if (w && typeof w.human_exclusive === "boolean") {
    return w.human_exclusive;
  }
  const low = String(eid).toLowerCase();
  if (
    low.startsWith("light.") ||
    low.startsWith("switch.") ||
    low.startsWith("fan.") ||
    low.startsWith("media_player.") ||
    low.startsWith("climate.") ||
    low.startsWith("cover.")
  ) {
    return false;
  }
  if (low.startsWith("sensor.")) {
    return low.includes("ble_area") || low.includes("private_ble");
  }
  if (low.startsWith("binary_sensor.")) {
    const nonHuman = [
      "media_playing",
      "_door",
      "door_",
      "_window",
      "contact",
      "_battery",
      "_connectivity",
      "_update",
    ];
    return !nonHuman.some((tok) => low.includes(tok));
  }
  return low.startsWith("camera.") || low.startsWith("device_tracker.") || low.startsWith("person.");
}


export function slugifyRoom(name) {
  return (
    String(name || "room")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "room"
  );
}


export function applyFriendlyRoleGroup(panel, obs, group, presets) {
  if (group === "primary") {
    obs.preset = "decisive";
    obs.corroboration_only = false;
    const d = presets.decisive || { prob_given_true: 0.94, prob_given_false: 0.03 };
    obs.prob_given_true = d.prob_given_true;
    obs.prob_given_false = d.prob_given_false;
  } else if (group === "keepalive") {
    obs.preset = "supporting";
    obs.corroboration_only = true;
    const d = presets.supporting || { prob_given_true: 0.55, prob_given_false: 0.2 };
    obs.prob_given_true = Math.max(0.55, Number(d.prob_given_true ?? 0.55));
    obs.prob_given_false = Number(d.prob_given_false ?? 0.2);
  } else {
    obs.preset = "moderate";
    obs.corroboration_only = false;
    const d = presets.moderate || { prob_given_true: 0.72, prob_given_false: 0.12 };
    obs.prob_given_true = d.prob_given_true;
    obs.prob_given_false = d.prob_given_false;
  }
  delete obs.cooldown_weighted;
  delete obs.signal_weighted;
}


export function roomStatusSummary(panel, r) {
  if (!r) return { dotClass: "clear", label: "Vacant", detail: "No activity detected" };
  const state = String(r.occupancy_state || "vacant");
  const countdown = Number(r.cooling_remaining_sec || 0);
  const reason = r.state_reason || r.last_transition_reason || "";
  if (r.is_present) {
    if (state === "override") {
      return {
        dotClass: "occupied",
        label: "Override Lock",
        detail: reason || "Manual presence override active",
      };
    }
    if (state === "occupied_cooling") {
      const durLabel = countdown > 0 ? ` (${panel._formatDuration(countdown)})` : "";
      return {
        dotClass: "clearing",
        label: `Cooling${durLabel}`,
        detail: reason || `Cooling down toward vacancy${durLabel}`,
      };
    }
    if (state === "occupied_verifying") {
      return {
        dotClass: "clearing",
        label: "Verifying (Vision AI)",
        detail: reason || "Running bounded Vision/LLM occupancy check",
      };
    }
    if (state === "occupied_holding") {
      return {
        dotClass: "occupied",
        label: "Occupied (Holding)",
        detail: reason || "Held by secondary condition or blind-pocket rule",
      };
    }
    return {
      dotClass: "occupied",
      label: "Occupied",
      detail: reason || (r.last_trigger_entity ? `Triggered by ${r.last_trigger_entity}` : "Confirmed human presence"),
    };
  }
  return {
    dotClass: "clear",
    label: "Vacant",
    detail: reason || "Room is currently unoccupied",
  };
}


export function friendlyEntityName(eid, entityNameMap) {
  const raw = String(eid || "").trim();
  if (!raw) return "";
  if (entityNameMap && entityNameMap.has(raw)) return entityNameMap.get(raw);
  return raw
    .replace(/^(binary_sensor|sensor|cover|camera|light|switch|fan)\./, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}


export function formatTransitionSte100(panel, tr, entityNameMap) {
  const whoRaw = String(tr.occupant_label || (tr.detected_people && tr.detected_people[0]) || "").trim();
  const who =
    String(tr.occupant_type || "") === "pet"
      ? whoRaw || "Riley (Dog)"
      : whoRaw || "Person";
  const fromRoom = tr.from_room ? String(tr.from_room).trim() : "";
  const toRoom = String(tr.to_room || tr.room || "").trim();
  const actionText = fromRoom && fromRoom !== toRoom
    ? `${who} moved from ${fromRoom} to ${toRoom}.`
    : fromRoom && fromRoom === toRoom
    ? `${who} remained in ${toRoom}.`
    : `${who} entered ${toRoom}.`;

  const rawLoc = String(tr.subregion || tr.inferred_location || toRoom || "").trim();
  const zoneText = rawLoc && rawLoc !== toRoom
    ? rawLoc.replace(/\s*\u2014\s*/g, " — ")
    : `${toRoom} (room area)`;

  const drivers = (tr.positive_drivers || []).map((d) => friendlyEntityName(d, entityNameMap)).filter(Boolean);
  const clearCams = (tr.negative_space_evidence || []).map((c) => friendlyEntityName(c, entityNameMap)).filter(Boolean);
  const infM = String(tr.method || tr.inference_type || "").toLowerCase();
  let reasonText = "";
  if (infM === "pet") {
    reasonText = drivers.length
      ? `Camera detected ${who} via ${drivers.slice(0, 2).join(", ")}. Motion trigger ignored.`
      : `Camera detected ${who} with no person present.`;
  } else if (infM === "hybrid") {
    const drv = drivers.length ? drivers.slice(0, 2).join(", ") : "room motion sensor";
    const clr = clearCams.length ? clearCams.slice(0, 2).join(", ") : "room camera";
    reasonText = `Sensor ${drv} detected motion. Camera ${clr} shows no person. System infers ${who.toLowerCase()} is outside the camera view.`;
  } else if (infM.startsWith("negative_space")) {
    if (clearCams.length && !drivers.length) {
      reasonText = `Entry recorded from ${fromRoom || "adjacent room"}. Camera ${clearCams.slice(0, 2).join(", ")} shows no person. Room stays occupied.`;
    } else {
      const drv = drivers.length ? drivers.slice(0, 2).join(", ") : "room entry";
      const clr = clearCams.length ? clearCams.slice(0, 2).join(", ") : "camera";
      reasonText = `Active signal from ${drv}. Camera ${clr} shows no person. System infers ${who.toLowerCase()} is in an uncovered area.`;
    }
  } else if (tr.occupancy_state && tr.probability_pct != null) {
    const stateLabel = String(tr.occupancy_state).replace(/_/g, " ");
    const drvSuffix = drivers.length ? ` Active: ${drivers.slice(0, 3).join(", ")}.` : "";
    reasonText = `Coordinator state ${stateLabel} (${Number(tr.probability_pct).toFixed(1)}% Bayesian probability).${drvSuffix}`;
  } else if (drivers.length) {
    reasonText = `Confirmed by ${drivers.slice(0, 3).join(", ")}.`;
  } else if (tr.explanation) {
    reasonText = String(tr.explanation);
  }

  return {
    who,
    fromRoom,
    toRoom,
    actionText,
    zoneText,
    reasonText,
    isInferred: infM.startsWith("negative_space") || infM === "hybrid",
    isPet: infM === "pet",
  };
}


export function formatInlineCode(text) {
  const escaped = escapeHtml(text || "");
  return escaped.replace(/`([^`]+)`/g, '<code class="pdd-inline-code">$1</code>');
}


export function formatTimelineHouseMode(frame, tlData) {
  const fr = frame || {};
  const tl = tlData || {};
  let mode = String(fr.house_occupancy_mode || tl.house_occupancy_mode || "").trim().toLowerCase();
  if (!mode) {
    const hc = fr.house_occupant_count ?? tl.house_occupant_count;
    const hasPet = (fr.pet_estimates || []).length > 0;
    const hasHuman = (fr.occupant_estimates || fr.occupants || []).length > 0;
    if (!hasHuman && hasPet) mode = "pet_only";
    else if (hc != null) mode = hc <= 0 ? "vacant" : hc >= 2 ? "guest" : "occupied";
    else mode = hasHuman ? "occupied" : "vacant";
  }
  const labels = {
    vacant: "Vacant",
    occupied: "Occupied",
    guest: "Guest",
    pet_only: "Pet Only",
  };
  return labels[mode] || "Occupied";
}

