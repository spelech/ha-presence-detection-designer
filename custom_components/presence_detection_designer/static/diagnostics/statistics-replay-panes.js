// Statistics swimlanes and historical replay simulator panes.

export function renderStatisticsPane(panel, selRoom) {
  if (!selRoom) {
    return `<div class="ha-card">Select a room to view its activity history.</div>`;
  }
  const st = panel._statsData;
  if (!st || st.entry_id !== selRoom.entry_id) {
    return `<div class="ha-card">Loading activity history for <strong>${panel._escape(
      selRoom.room_name
    )}</strong>...</div>`;
  }
  const sum = st.summary || {};
  const series = st.series || [];
  const swimlanes = st.swimlanes || [];
  const W = 900;
  const H = 160;
  const { linePath, areaPath } = panel._buildStepSvgPaths(series, W, H);
  const threshY = H - (Number(st.threshold_pct || 75) / 100) * (H - 12) - 6;

  return `
    <div class="ha-card">
      <div class="card-head" style="flex-wrap:wrap;">
        <div>
          <h2 class="card-title" style="font-size:18px;">${panel._escape(
            selRoom.room_name
          )} — Activity History</h2>
          <div class="card-desc">
            Occupied for ${Number(sum.occupied_minutes || 0).toFixed(0)} minutes (${Number(
    sum.occupied_pct || 0
  ).toFixed(1)}%) over the last ${sum.window_hours || panel._historyHours} hours.
          </div>
        </div>

        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <div class="seg-group" style="margin-top:0;">
            ${[
              { h: 1, label: "1h" },
              { h: 6, label: "6h" },
              { h: 24, label: "24h" },
              { h: 168, label: "7d" },
            ]
              .map(
                (w) =>
                  `<button class="seg-btn ${
                    Number(panel._historyHours) === w.h ? "active" : ""
                  }" data-history-hours="${w.h}" style="padding:5px 10px;">${w.label}</button>`
              )
              .join("")}
          </div>
          <button class="btn btn-sm" id="btn-open-house-timeline">🎯 Whole-House Timeline</button>
          <button class="btn btn-sm" id="btn-jump-to-replay">What-If Simulator</button>
        </div>
      </div>

      <div style="background:var(--ha-subtle);border:1px solid var(--ha-divider);border-radius:10px;padding:12px;margin-bottom:16px;">
        <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:160px;display:block;">
          <line x1="0" y1="${threshY.toFixed(1)}" x2="${W}" y2="${threshY.toFixed(
    1
  )}" stroke="#d97706" stroke-width="1.2" stroke-dasharray="5,4" />
          <path d="${areaPath}" fill="rgba(2, 132, 199, 0.12)" />
          <path d="${linePath}" fill="none" stroke="#0284c7" stroke-width="2" />
        </svg>
      </div>

      <div class="setting-label" style="margin-bottom:8px;">Sensor Activity Timeline</div>
      <div class="list-divider">
        ${swimlanes
          .map((lane) => {
            const segsHtml = (lane.segments || [])
              .map(
                (seg) =>
                  `<div style="position:absolute;top:2px;bottom:2px;left:${seg.start_pct}%;width:${seg.width_pct}%;background:var(--ha-primary);border-radius:3px;"></div>`
              )
              .join("");
            return `
              <div class="swimlane-row">
                <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${panel._escape(
                  lane.label
                )}</div>
                <div style="position:relative;height:14px;background:var(--ha-subtle);border:1px solid var(--ha-divider);border-radius:4px;overflow:hidden;">${segsHtml}</div>
                <div style="text-align:right;color:var(--ha-muted);font-size:12px;">${Number(
                  lane.active_minutes || 0
                ).toFixed(0)}m</div>
              </div>`;
          })
          .join("")}
      </div>
    </div>
  `;
}


export function renderReplayPane(panel, selRoom, presets) {
  if (!selRoom) {
    return `<div class="ha-card">Select a room to run the What-If Replay Simulator.</div>`;
  }
  const cand = panel._replayCandidate || panel._draftConfig || {};
  const rep = panel._replayData;
  const candPriorPct = Math.round(Number(cand.bayesian_prior ?? 0.2) * 100);
  const candThreshPct = Math.round(Number(cand.bayesian_threshold ?? 0.75) * 100);

  if (!rep || rep.entry_id !== selRoom.entry_id) {
    return `<div class="ha-card">Simulating historical replay for <strong>${panel._escape(
      selRoom.room_name
    )}</strong>...</div>`;
  }

  const baseRes = rep.baseline || {};
  const candRes = rep.candidate || {};
  const divergences = rep.divergence_windows || [];
  const W = 900;
  const H = 170;
  const basePaths = panel._buildStepSvgPaths(baseRes.series || [], W, H);
  const candPaths = panel._buildStepSvgPaths(candRes.series || [], W, H);

  return `
    <div class="ha-card">
      <div class="card-head" style="flex-wrap:wrap;">
        <div>
          <h2 class="card-title" style="font-size:18px;">${panel._escape(
            selRoom.room_name
          )} — What-If Replay Simulator (${panel._historyHours}h)</h2>
          <div class="card-desc">
            Test different timeout, threshold, or Negative-Space Exclusion settings against recorded sensor history before saving.
          </div>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-sm" id="btn-back-to-stats">Back to Activity History</button>
          <button class="btn btn-sm" id="btn-replay-reset">Reset</button>
          <button class="btn btn-primary btn-sm" id="btn-replay-apply">Apply to Room</button>
        </div>
      </div>

      <div class="replay-controls-grid">
        <div>
          <div class="setting-label" style="font-size:12.5px;">Candidate Prior: ${candPriorPct}%</div>
          <input type="range" min="5" max="50" step="1" id="rep-prior-slider" value="${candPriorPct}" style="width:100%;" />
        </div>
        <div>
          <div class="setting-label" style="font-size:12.5px;">Candidate Threshold: ${candThreshPct}%</div>
          <input type="range" min="50" max="95" step="1" id="rep-thresh-slider" value="${candThreshPct}" style="width:100%;" />
        </div>
        <div>
          <div class="setting-label" style="font-size:12.5px;">Clear Delay (sec)</div>
          <input type="number" class="input" id="rep-inactivity" value="${Number(
            cand.inactivity_timeout ?? 180
          )}" />
        </div>
        <div style="padding:8px 10px;background:var(--ha-accent-purple-bg);border:1px solid var(--ha-accent-purple-border);border-radius:8px;">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12.5px;font-weight:600;color:var(--ha-accent-purple-text);" data-tip="Compare what the historical Bayesian curve would look like with Negative-Space Exclusion ON vs OFF." data-tip-align="right">
            <input type="checkbox" id="rep-neg-space-toggle" ${
              panel._replayNegativeSpace ? "checked" : ""
            } />
            <span>🎯 Negative-Space Exclusion</span>
          </label>
        </div>
      </div>

      <div style="background:var(--ha-subtle);border:1px solid var(--ha-divider);border-radius:10px;padding:12px;margin-bottom:14px;">
        <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:170px;display:block;">
          <path d="${basePaths.linePath}" fill="none" stroke="#94a3b8" stroke-width="1.6" stroke-dasharray="4,3" />
          <path d="${candPaths.linePath}" fill="none" stroke="#0284c7" stroke-width="2.2" />
        </svg>
      </div>

      <div style="font-size:13px;color:var(--ha-muted);">
        ${divergences.length} differences between current settings and candidate settings over the last ${panel._historyHours} hours.
      </div>
    </div>
  `;
}

