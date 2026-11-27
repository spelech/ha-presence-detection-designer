// State machine visualization and sensor reliability weights pane.

export function renderStateMachinePane(panel, selRoom) {
  const state = String(selRoom.occupancy_state || "vacant");
  const history = Array.isArray(selRoom.transition_history) ? selRoom.transition_history : [];
  const reversedHistory = [...history].reverse();
  const lastAccepted = reversedHistory.find((h) => h.accepted) || null;
  const lastAttempt = reversedHistory[0] || null;
  const coolingSec = Number(selRoom.cooling_remaining_sec || 0);
  const verifiedBy = selRoom.verified_by || "none";
  const reason = selRoom.state_reason || selRoom.last_transition_reason || "Initialized vacant";
  const mermaidSrc = selRoom.mermaid_diagram || "";
  const pirState = String(selRoom.pir_validation_state || "idle");
  const pirSource = selRoom.pir_corroboration_source || "none";
  const pirDetail = selRoom.pir_corroboration_detail || "Awaiting PIR / corroboration";
  const pirRemain = Number(selRoom.pir_candidate_remaining_sec || 0);
  const pirMermaid = selRoom.pir_mermaid_diagram || "";
  const pirHistory = Array.isArray(selRoom.pir_transition_history) ? [...selRoom.pir_transition_history].reverse() : [];
  const sensorWeights = Array.isArray(selRoom.sensor_weights) ? selRoom.sensor_weights : [];

  const nodeStyle = (id) => {
    const active = state === id;
    if (active) {
      if (id === "vacant") {
        return { fill: "rgba(148,163,184,0.22)", stroke: "#94a3b8", text: "#f1f5f9", width: 2.5 };
      }
      if (id === "override") {
        return { fill: "rgba(168,85,247,0.25)", stroke: "#c084fc", text: "#f3e8ff", width: 2.5 };
      }
      if (id === "occupied_cooling" || id === "occupied_verifying") {
        return { fill: "rgba(245,158,11,0.25)", stroke: "#fbbf24", text: "#fef3c7", width: 2.5 };
      }
      return { fill: "rgba(16,185,129,0.25)", stroke: "#34d399", text: "#d1fae5", width: 2.5 };
    }
    return { fill: "rgba(15,23,42,0.7)", stroke: "rgba(148,163,184,0.35)", text: "#94a3b8", width: 1.2 };
  };

  const edgeColor = (src, dst) => {
    if (lastAccepted && lastAccepted.source === src && lastAccepted.dest === dst) {
      return "#22d3ee";
    }
    return "rgba(148,163,184,0.4)";
  };
  const edgeWidth = (src, dst) =>
    lastAccepted && lastAccepted.source === src && lastAccepted.dest === dst ? "2.8" : "1.4";

  const nodes = [
    { id: "vacant", label: "vacant", sub: "is_present=false", x: 35, y: 125, w: 145, h: 64 },
    { id: "occupied_confirmed", label: "occupied_confirmed", sub: "Human active", x: 255, y: 55, w: 185, h: 60 },
    { id: "occupied_holding", label: "occupied_holding", sub: "Bounded hold", x: 495, y: 55, w: 175, h: 60 },
    { id: "occupied_cooling", label: "occupied_cooling", sub: coolingSec > 0 ? `Cooling (${coolingSec}s)` : "Countdown", x: 255, y: 195, w: 185, h: 60 },
    { id: "occupied_verifying", label: "occupied_verifying", sub: "Vision / LLM", x: 495, y: 195, w: 175, h: 60 },
    { id: "override", label: "override", sub: "Manual lock", x: 35, y: 270, w: 145, h: 56 },
  ];

  const edges = [
    { s: "vacant", d: "occupied_confirmed", x1: 180, y1: 142, x2: 255, y2: 92, lx: 196, ly: 105, lbl: "evidence_detected" },
    { s: "occupied_confirmed", d: "occupied_holding", x1: 440, y1: 75, x2: 495, y2: 75, lx: 468, ly: 66, lbl: "hold_only" },
    { s: "occupied_holding", d: "occupied_confirmed", x1: 495, y1: 98, x2: 440, y2: 98, lx: 468, ly: 112, lbl: "resumed" },
    { s: "occupied_confirmed", d: "occupied_cooling", x1: 347, y1: 115, x2: 347, y2: 195, lx: 354, ly: 158, lbl: "evidence_cleared" },
    { s: "occupied_holding", d: "occupied_cooling", x1: 540, y1: 115, x2: 425, y2: 195, lx: 495, ly: 158, lbl: "hold_cleared/timeout" },
    { s: "occupied_cooling", d: "occupied_verifying", x1: 440, y1: 215, x2: 495, y2: 215, lx: 468, ly: 206, lbl: "llm_enabled" },
    { s: "occupied_verifying", d: "occupied_cooling", x1: 495, y1: 240, x2: 440, y2: 240, lx: 468, ly: 254, lbl: "person_detected" },
    { s: "occupied_cooling", d: "vacant", x1: 255, y1: 215, x2: 180, y2: 170, lx: 194, ly: 208, lbl: "expired / handoff" },
    { s: "vacant", d: "override", x1: 108, y1: 189, x2: 108, y2: 270, lx: 114, ly: 234, lbl: "override" },
  ];

  return `
    <div class="ha-card">
      <div class="card-head">
        <div>
          <h3 class="card-title">Live Transitions State Diagram</h3>
          <div class="card-desc">Fixed <code>transitions.extensions.HierarchicalGraphMachine</code> runtime topology and last fired transition.</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-sm" id="btn-refresh-state-graph">Refresh Graph</button>
          <button class="btn btn-sm" id="btn-copy-mermaid">Copy Mermaid</button>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-bottom:14px;">
        <div style="padding:10px 12px;border-radius:10px;background:var(--ha-subtle);border:1px solid var(--ha-divider);">
          <div style="font-size:11px;color:var(--ha-muted);text-transform:uppercase;">Active State</div>
          <div style="font-size:14px;font-weight:600;margin-top:2px;"><code>${panel._escape(state)}</code></div>
        </div>
        <div style="padding:10px 12px;border-radius:10px;background:var(--ha-subtle);border:1px solid var(--ha-divider);">
          <div style="font-size:11px;color:var(--ha-muted);text-transform:uppercase;">Verified By</div>
          <div style="font-size:14px;font-weight:600;margin-top:2px;"><code>${panel._escape(verifiedBy)}</code></div>
        </div>
        <div style="padding:10px 12px;border-radius:10px;background:var(--ha-subtle);border:1px solid var(--ha-divider);">
          <div style="font-size:11px;color:var(--ha-muted);text-transform:uppercase;">Cooling Countdown</div>
          <div style="font-size:14px;font-weight:600;margin-top:2px;">${coolingSec > 0 ? `${coolingSec}s` : "Inactive"}</div>
        </div>
        <div style="padding:10px 12px;border-radius:10px;background:var(--ha-subtle);border:1px solid var(--ha-divider);">
          <div style="font-size:11px;color:var(--ha-muted);text-transform:uppercase;">Last Reason</div>
          <div style="font-size:12.5px;font-weight:500;margin-top:2px;">${panel._escape(reason)}</div>
        </div>
      </div>

      ${
        lastAccepted
          ? `<div style="margin-bottom:12px;padding:8px 12px;border-radius:8px;background:rgba(34,211,238,0.1);border:1px solid rgba(34,211,238,0.35);font-size:12.5px;">
              <strong>Last Fired:</strong> <code>${panel._escape(lastAccepted.trigger)}</code>
              (<code>${panel._escape(lastAccepted.source)}</code> &rarr; <code>${panel._escape(lastAccepted.dest)}</code>)
              — ${panel._escape(lastAccepted.reason || "")}
            </div>`
          : ""
      }
      ${
        lastAttempt && !lastAttempt.accepted
          ? `<div style="margin-bottom:12px;padding:8px 12px;border-radius:8px;background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.35);font-size:12.5px;">
              <strong>Guard Blocked:</strong> <code>${panel._escape(lastAttempt.trigger)}</code> in <code>${panel._escape(lastAttempt.source)}</code>
              — ${panel._escape(lastAttempt.reason || "")}
            </div>`
          : ""
      }

      <div style="width:100%;overflow-x:auto;background:rgba(15,23,42,0.92);border:1px solid var(--ha-divider);border-radius:12px;padding:10px;">
        <svg viewBox="0 0 710 345" style="width:100%;max-width:760px;height:auto;display:block;margin:0 auto;">
          <defs>
            <marker id="sm-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="rgba(148,163,184,0.75)"></path>
            </marker>
            <marker id="sm-arrow-active" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#22d3ee"></path>
            </marker>
          </defs>
          <rect x="235" y="20" width="455" height="270" rx="14" fill="rgba(16,185,129,0.04)" stroke="rgba(16,185,129,0.28)" stroke-dasharray="5,4" stroke-width="1.2"></rect>
          <text x="250" y="39" fill="#6ee7b7" font-size="11" font-weight="600">occupied (hierarchical super-state)</text>
          ${edges
            .map((e) => {
              const isHot = lastAccepted && lastAccepted.source === e.s && lastAccepted.dest === e.d;
              return `
                <line x1="${e.x1}" y1="${e.y1}" x2="${e.x2}" y2="${e.y2}"
                      stroke="${edgeColor(e.s, e.d)}" stroke-width="${edgeWidth(e.s, e.d)}"
                      marker-end="url(#${isHot ? "sm-arrow-active" : "sm-arrow"})" />
                <text x="${e.lx}" y="${e.ly}" fill="${isHot ? "#22d3ee" : "#94a3b8"}"
                      font-size="9.5" text-anchor="middle">${panel._escape(e.lbl)}</text>
              `;
            })
            .join("")}
          ${nodes
            .map((n) => {
              const st = nodeStyle(n.id);
              const isActive = state === n.id;
              return `
                <g>
                  <rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="10"
                        fill="${st.fill}" stroke="${st.stroke}" stroke-width="${st.width}"></rect>
                  <text x="${n.x + n.w / 2}" y="${n.y + 24}" fill="${st.text}"
                        font-size="12" font-weight="600" text-anchor="middle">${panel._escape(n.label)}</text>
                  <text x="${n.x + n.w / 2}" y="${n.y + 43}" fill="${isActive ? st.text : "#94a3b8"}"
                        font-size="10.5" text-anchor="middle">${panel._escape(isActive ? `ACTIVE • ${n.sub}` : n.sub)}</text>
                </g>
              `;
            })
            .join("")}
        </svg>
      </div>
    </div>

    <div class="ha-card">
      <div class="card-head">
        <div>
          <h3 class="card-title">Transition &amp; Guard Audit Log (${reversedHistory.length})</h3>
          <div class="card-desc">Bounded chronological ring buffer of accepted transitions and guard-blocked trigger attempts.</div>
        </div>
      </div>
      ${
        reversedHistory.length === 0
          ? `<div style="font-size:13px;color:var(--ha-muted);">No transition events recorded yet.</div>`
          : `<div style="overflow-x:auto;">
              <table class="bayesian-table">
                <thead>
                  <tr style="border-bottom:1px solid var(--ha-divider);text-align:left;color:var(--ha-muted);">
                    <th style="padding:8px 6px;">Status</th>
                    <th style="padding:8px 6px;">Trigger</th>
                    <th style="padding:8px 6px;">Transition</th>
                    <th style="padding:8px 6px;">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  ${reversedHistory
                    .slice(0, 20)
                    .map((ev) => {
                      const badgeBg = ev.accepted ? "rgba(16,185,129,0.16)" : "rgba(245,158,11,0.18)";
                      const badgeFg = ev.accepted ? "#34d399" : "#fbbf24";
                      return `
                        <tr style="border-bottom:1px solid var(--ha-divider);">
                          <td style="padding:8px 6px;">
                            <span style="padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;background:${badgeBg};color:${badgeFg};">
                              ${ev.accepted ? "ACCEPTED" : "BLOCKED"}
                            </span>
                          </td>
                          <td style="padding:8px 6px;"><code>${panel._escape(ev.trigger || "")}</code></td>
                          <td style="padding:8px 6px;"><code>${panel._escape(ev.source || "")}</code> &rarr; <code>${panel._escape(ev.dest || "")}</code></td>
                          <td style="padding:8px 6px;color:var(--ha-muted);">${panel._escape(ev.reason || "")}</td>
                        </tr>
                      `;
                    })
                    .join("")}
                </tbody>
              </table>
            </div>`
      }
      <details style="margin-top:14px;">
        <summary style="cursor:pointer;font-size:12.5px;color:var(--ha-muted);">Raw Live Mermaid Definition (from Python transitions)</summary>
        <textarea class="code-area" readonly style="margin-top:8px;min-height:140px;">${panel._escape(mermaidSrc)}</textarea>
      </details>
    </div>

    <div class="ha-card">
      <div class="card-head">
        <div>
          <h3 class="card-title">PIR Validation Gate &amp; Cooldown Reliability</h3>
          <div class="card-desc">Separate <code>transitions.extensions.GraphMachine</code> gate (<code>${Number(selRoom.pir_candidate_window ?? selRoom.config?.pir_candidate_window ?? 15)}s</code> candidate window, any-one-of corroboration: Camera / Trajectory / BLE / Time-History).</div>
        </div>
        <span style="font-size:12px;font-weight:600;padding:3px 10px;border-radius:999px;background:var(--ha-subtle);border:1px solid var(--ha-divider);">PIR: <code>${panel._escape(pirState)}</code></span>
      </div>
      <div style="width:100%;overflow-x:auto;background:rgba(15,23,42,0.92);border:1px solid var(--ha-divider);border-radius:12px;padding:10px;margin-bottom:12px;">
        <svg viewBox="0 0 680 120" style="width:100%;max-width:740px;height:auto;display:block;margin:0 auto;">
          ${[
            { id: "idle", label: "idle", sub: "No PIR pulse", x: 18, y: 32, w: 120, h: 52 },
            { id: "candidate", label: "candidate", sub: pirRemain > 0 ? `Window (${pirRemain}s)` : "Hold window", x: 205, y: 32, w: 140, h: 52 },
            { id: "corroborated", label: "corroborated", sub: "Promotes room", x: 420, y: 10, w: 145, h: 46 },
            { id: "suppressed", label: "suppressed", sub: "False pulse blocked", x: 420, y: 66, w: 145, h: 46 },
          ]
            .map((n) => {
              const active = pirState === n.id;
              const col =
                active && n.id === "corroborated"
                  ? { fill: "rgba(16,185,129,0.24)", stroke: "#34d399", text: "#d1fae5" }
                  : active && n.id === "suppressed"
                  ? { fill: "rgba(245,158,11,0.24)", stroke: "#fbbf24", text: "#fef3c7" }
                  : active && n.id === "candidate"
                  ? { fill: "rgba(56,189,248,0.24)", stroke: "#38bdf8", text: "#e0f2fe" }
                  : active
                  ? { fill: "rgba(148,163,184,0.22)", stroke: "#94a3b8", text: "#f1f5f9" }
                  : { fill: "rgba(15,23,42,0.7)", stroke: "rgba(148,163,184,0.35)", text: "#94a3b8" };
              return `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="10" fill="${col.fill}" stroke="${col.stroke}" stroke-width="${active ? 2.4 : 1.2}"></rect>
                <text x="${n.x + n.w / 2}" y="${n.y + 21}" fill="${col.text}" font-size="11.5" font-weight="700" text-anchor="middle">${panel._escape(n.label)}</text>
                <text x="${n.x + n.w / 2}" y="${n.y + 37}" fill="#94a3b8" font-size="9.5" text-anchor="middle">${panel._escape(n.sub)}</text>`;
            })
            .join("")}
          <line x1="138" y1="58" x2="205" y2="58" stroke="rgba(148,163,184,0.55)" stroke-width="1.5" marker-end="url(#sm-arrow)" />
          <text x="171" y="50" fill="#94a3b8" font-size="9" text-anchor="middle">pir_tripped</text>
          <line x1="345" y1="48" x2="420" y2="34" stroke="rgba(52,211,153,0.65)" stroke-width="1.5" marker-end="url(#sm-arrow)" />
          <text x="382" y="33" fill="#6ee7b7" font-size="9" text-anchor="middle">corroborated</text>
          <line x1="345" y1="68" x2="420" y2="88" stroke="rgba(251,191,36,0.65)" stroke-width="1.5" marker-end="url(#sm-arrow)" />
          <text x="382" y="92" fill="#fcd34d" font-size="9" text-anchor="middle">window_expired</text>
        </svg>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-bottom:14px;">
        <div style="padding:10px 12px;border-radius:10px;background:var(--ha-subtle);border:1px solid var(--ha-divider);">
          <div style="font-size:11px;color:var(--ha-muted);text-transform:uppercase;">PIR Gate State</div>
          <div style="font-size:14px;font-weight:600;margin-top:2px;"><code>${panel._escape(pirState)}</code></div>
        </div>
        <div style="padding:10px 12px;border-radius:10px;background:var(--ha-subtle);border:1px solid var(--ha-divider);">
          <div style="font-size:11px;color:var(--ha-muted);text-transform:uppercase;">Corroborator</div>
          <div style="font-size:14px;font-weight:600;margin-top:2px;"><code>${panel._escape(pirSource)}</code></div>
        </div>
        <div style="padding:10px 12px;border-radius:10px;background:var(--ha-subtle);border:1px solid var(--ha-divider);">
          <div style="font-size:11px;color:var(--ha-muted);text-transform:uppercase;">Candidate Window</div>
          <div style="font-size:14px;font-weight:600;margin-top:2px;">${pirRemain > 0 ? `${pirRemain}s` : "Inactive"}</div>
        </div>
        <div style="padding:10px 12px;border-radius:10px;background:var(--ha-subtle);border:1px solid var(--ha-divider);">
          <div style="font-size:11px;color:var(--ha-muted);text-transform:uppercase;">Detail</div>
          <div style="font-size:12.5px;font-weight:500;margin-top:2px;">${panel._escape(pirDetail)}</div>
        </div>
      </div>
      ${
        sensorWeights.length > 0
          ? `<div style="overflow-x:auto;margin-bottom:12px;">
              <table style="width:100%;border-collapse:collapse;font-size:12.5px;">
                <thead>
                  <tr style="border-bottom:1px solid var(--ha-divider);text-align:left;color:var(--ha-muted);">
                    <th style="padding:6px;">Sensor</th>
                    <th style="padding:6px;">Category</th>
                    <th style="padding:6px;">Cooldown</th>
                    <th style="padding:6px;">Weight</th>
                    <th style="padding:6px;">Signal</th>
                    <th style="padding:6px;">PIR Gate</th>
                  </tr>
                </thead>
                <tbody>
                  ${sensorWeights
                    .map(
                      (sw) => `
                        <tr style="border-bottom:1px solid var(--ha-divider);">
                          <td style="padding:6px;"><code>${panel._escape(sw.entity_id || "")}</code></td>
                          <td style="padding:6px;">${panel._escape(sw.category || "")}</td>
                          <td style="padding:6px;">${Number(sw.cooldown_sec || 0)}s</td>
                          <td style="padding:6px;">${Number(sw.reliability_weight ?? 1).toFixed(2)}</td>
                          <td style="padding:6px;"><span style="padding:2px 6px;border-radius:999px;font-size:11px;font-weight:600;background:${sw.human_exclusive !== false ? "rgba(16,185,129,0.16)" : "rgba(148,163,184,0.18)"};color:${sw.human_exclusive !== false ? "var(--ha-success-text)" : "var(--ha-muted)"};">${sw.human_exclusive !== false ? "Person" : "Supporting"}</span></td>
                          <td style="padding:6px;">${sw.requires_pir_validation ? "Required" : "Bypass"}</td>
                        </tr>
                      `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>`
          : ""
      }
      ${
        pirHistory.length > 0
          ? `<div style="font-size:12px;color:var(--ha-muted);margin-bottom:8px;">Recent PIR Gate Events: ${pirHistory
              .slice(0, 5)
              .map((h) => `<code>${panel._escape(h.trigger || "")}</code> (${panel._escape(h.source || "")}&rarr;${panel._escape(h.dest || "")})`)
              .join(" · ")}</div>`
          : ""
      }
      ${
        pirMermaid
          ? `<details>
              <summary style="cursor:pointer;font-size:12.5px;color:var(--ha-muted);">Raw PIR Validation Mermaid Definition</summary>
              <textarea class="code-area" readonly style="margin-top:8px;min-height:110px;">${panel._escape(pirMermaid)}</textarea>
            </details>`
          : ""
      }
    </div>
  `;
}

