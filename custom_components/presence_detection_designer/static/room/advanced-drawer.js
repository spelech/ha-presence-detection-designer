// Advanced diagnostics, YAML editor, AI translator, and revision history drawer.

export function renderAdvancedDrawer(panel, selRoom, cfg, prev, areas, presets, activeMap) {
  const priorPct = Math.round(Number(cfg.bayesian_prior ?? 0.2) * 100);
  const threshPct = Math.round(Number(cfg.bayesian_threshold ?? 0.75) * 100);
  const livePct = Number(
    prev.probability_pct ?? (selRoom ? selRoom.bayesian_probability_pct : 0)
  ).toFixed(1);
  const comb = prev.combinatorics || {};

  return `
    <div class="ha-card">
      <div class="sub-tabs">
        <button class="sub-tab ${
          panel._advTab === "tuning" ? "active" : ""
        }" data-adv-tab="tuning">Bayesian &amp; Vision Tuning</button>
        <button class="sub-tab ${
          panel._advTab === "truth" ? "active" : ""
        }" data-adv-tab="truth">Combination Truth Table</button>
        <button class="sub-tab ${
          panel._advTab === "automations" ? "active" : ""
        }" data-adv-tab="automations">Automations &amp; Blueprints</button>
        <button class="sub-tab ${
          panel._advTab === "yaml" ? "active" : ""
        }" data-adv-tab="yaml">YAML &amp; AI Rules</button>
        <button class="sub-tab ${
          panel._advTab === "revisions" ? "active" : ""
        }" data-adv-tab="revisions">Saved Revisions (${(selRoom.revisions || []).length})</button>
        <div style="flex:1;"></div>
        <button class="btn btn-sm" id="btn-open-global">Global AI Settings</button>
        <button class="btn btn-sm" id="btn-jump-to-replay">Open Replay Simulator</button>
      </div>

      ${
        panel._advTab === "tuning"
          ? `
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:14px;margin-bottom:20px;">
          <div>
            <div class="setting-label" style="font-size:12.5px;margin-bottom:4px;">Home Assistant Area</div>
            <select class="select" id="cfg-area-id">
              <option value="">— None —</option>
              ${areas
                .map(
                  (a) =>
                    `<option value="${panel._escape(a.id)}" ${
                      cfg.area_id === a.id ? "selected" : ""
                    }>${panel._escape(a.name)}</option>`
                )
                .join("")}
            </select>
          </div>
          <div>
            <div class="setting-label" style="font-size:12.5px;margin-bottom:4px;">Prior Baseline: ${priorPct}%</div>
            <input type="range" min="5" max="50" step="1" id="cfg-prior-slider" value="${priorPct}" style="width:100%;" />
          </div>
          <div>
            <div class="setting-label" style="font-size:12.5px;margin-bottom:4px;">Activation Threshold: ${threshPct}%</div>
            <input type="range" min="50" max="95" step="1" id="cfg-thresh-slider" value="${threshPct}" style="width:100%;" />
          </div>
          <div>
            <div class="setting-label" style="font-size:12.5px;margin-bottom:4px;">Camera Entity (AI Vision)</div>
            <div style="display:flex;gap:6px;">
              <select class="select" id="cfg-camera-entity" title="Select Home Assistant camera entity by friendly name">
                ${panel._renderCameraSelectOptions(cfg.camera_entity || "", entities)}
              </select>
              <button
                type="button"
                class="btn btn-sm"
                id="btn-room-verify"
                data-tip="Captures a live snapshot from the selected camera and runs Vision AI."
                data-tip-align="right"
                title="Run AI Vision Check now"
                ${panel._verifyingRoomId === selRoom.entry_id ? "disabled" : ""}
              >${panel._verifyingRoomId === selRoom.entry_id ? "⏳ Checking..." : "Check"}</button>
            </div>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:8px;flex-wrap:wrap;">
          <div>
            <div class="setting-label">Detailed Sensor Probabilities — Current Score: ${livePct}%</div>
            <div style="font-size:12px;color:var(--ha-muted);">Bayesians score confidence and hold existing occupancy (BAYES-01); camera &amp; PIR off remain neutral (BAYES-04).</div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-sm" id="btn-add-ble">+ Add Household BLE</button>
            <button class="btn btn-sm" id="btn-sync-triggers">Sync Human Triggers</button>
          </div>
        </div>

        <div style="overflow:auto;">
          <table class="bayesian-table">
            <thead>
              <tr style="border-bottom:1px solid var(--ha-divider);text-align:left;color:var(--ha-muted);">
                <th style="padding:8px 6px;">Entity ID &amp; Label</th>
                <th style="padding:8px 6px;">Signal / Tempering</th>
                <th style="padding:8px 6px;">Preset</th>
                <th style="padding:8px 6px;">P(E|Occ)</th>
                <th style="padding:8px 6px;">P(E|Vac)</th>
                <th style="padding:8px 6px;">Operator &amp; State</th>
                <th style="padding:8px 6px;"></th>
              </tr>
            </thead>
            <tbody>
              ${(cfg.bayesian_observations || [])
                .map((obs, idx) => {
                  const presetVal = obs.preset || obs.weight || "moderate";
                  const pDefaults = presets[presetVal] || {
                    prob_given_true: 0.72,
                    prob_given_false: 0.12,
                  };
                  const pTrue = Number(obs.prob_given_true ?? pDefaults.prob_given_true);
                  const pFalse = Number(obs.prob_given_false ?? pDefaults.prob_given_false);
                  const wMeta = panel._sensorWeightMap(selRoom, prev)[obs.entity_id] || {};
                  const isHuman = panel._isHumanExclusiveCandidate(obs.entity_id, {
                    [obs.entity_id]: wMeta,
                  });
                  const cdSec = Number(obs.cooldown_sec ?? wMeta.cooldown_sec ?? 0);
                  const tempered = Boolean(obs.cooldown_weighted || obs.signal_weighted);
                  const badLift = pTrue <= pFalse || (presetVal === "supporting" && pTrue < 0.5);
                  const inactItem = (prev.inactive_observations || []).find(
                    (i) => i.entity_id === obs.entity_id
                  );
                  const lrOff = inactItem ? Number(inactItem.likelihood_ratio ?? 1.0) : 1.0;
                  const offText =
                    lrOff < 0.99 ? `Off LR ${lrOff.toFixed(2)} (Confirmed BLE)` : "Off: Neutral";
                  return `
                  <tr style="border-bottom:1px solid var(--ha-divider);">
                    <td style="padding:8px 6px;">
                      <input type="text" class="input obs-field" data-idx="${idx}" data-key="entity_id" list="pdd-all-entities" value="${panel._escape(
                    obs.entity_id || ""
                  )}" style="margin-bottom:4px;font-family:monospace;font-size:11.5px;" />
                      <input type="text" class="input obs-field" data-idx="${idx}" data-key="label" value="${panel._escape(
                    obs.label || ""
                  )}" placeholder="Label" />
                    </td>
                    <td style="padding:8px 6px;min-width:155px;font-size:11.5px;">
                      <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:3px;">
                        <span style="padding:1px 6px;border-radius:999px;font-weight:600;background:${
                          isHuman ? "rgba(16,185,129,0.14)" : "rgba(148,163,184,0.16)"
                        };color:${
                    isHuman ? "var(--ha-success-text)" : "var(--ha-muted)"
                  };">${isHuman ? "Person" : "Supporting"}</span>
                        ${
                          cdSec > 0
                            ? `<span style="padding:1px 6px;border-radius:999px;background:var(--ha-subtle);border:1px solid var(--ha-divider);">${cdSec}s</span>`
                            : ""
                        }
                        ${
                          tempered
                            ? `<span style="padding:1px 6px;border-radius:999px;background:var(--ha-accent-cyan-bg);color:var(--ha-accent-cyan-text);" title="Single-pass tempered">1x weighted</span>`
                            : ""
                        }
                      </div>
                      <div style="color:${
                        badLift
                          ? "var(--ha-danger-text)"
                          : lrOff < 0.99
                          ? "var(--ha-warning-text)"
                          : "var(--ha-muted)"
                      };">${
                    badLift ? "⚠ Fix weights (P(E|Occ) > P(E|Vac))" : offText
                  }</div>
                    </td>
                    <td style="padding:8px 6px;width:125px;">
                      <select class="select obs-preset" data-idx="${idx}">
                        ${["decisive", "strong", "moderate", "supporting", "weak_hint", "custom"]
                          .map(
                            (p) =>
                              `<option value="${p}" ${presetVal === p ? "selected" : ""}>${p}</option>`
                          )
                          .join("")}
                      </select>
                    </td>
                    <td style="padding:8px 6px;width:85px;">
                      <input type="number" step="0.01" min="0.01" max="0.99" class="input obs-prob" data-idx="${idx}" data-key="prob_given_true" value="${pTrue.toFixed(
                    2
                  )}" />
                    </td>
                    <td style="padding:8px 6px;width:85px;">
                      <input type="number" step="0.01" min="0.01" max="0.99" class="input obs-prob" data-idx="${idx}" data-key="prob_given_false" value="${pFalse.toFixed(
                    2
                  )}" />
                    </td>
                    <td style="padding:8px 6px;width:185px;">
                      <div style="display:flex;gap:4px;">
                        <select class="select obs-field" data-idx="${idx}" data-key="operator">
                          ${["equals", "in", "greater_than", "less_than", "not_equals"]
                            .map(
                              (op) =>
                                `<option value="${op}" ${
                                  (obs.operator || "equals") === op ? "selected" : ""
                                }>${op}</option>`
                            )
                            .join("")}
                        </select>
                        <input type="text" class="input obs-field" data-idx="${idx}" data-key="state" value="${panel._escape(
                    obs.state ?? "on"
                  )}" style="width:80px;min-width:72px;" />
                      </div>
                    </td>
                    <td style="padding:8px 6px;text-align:right;">
                      <button class="btn-danger-text obs-del" data-idx="${idx}" title="Remove observation">×</button>
                    </td>
                  </tr>`;
                })
                .join("")}
            </tbody>
          </table>
        </div>
      `
          : panel._advTab === "truth"
          ? `
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:16px;">
          <div>
            <div class="setting-label" style="margin-bottom:8px;">Solo sensors crossing score/hold threshold (&ge; ${threshPct}%)</div>
            <div style="font-size:11.5px;color:var(--ha-muted);margin-bottom:6px;">Scores confidence and holds existing occupancy; never starts occupancy from vacant (BAYES-01).</div>
            ${
              (comb.solo_triggers || []).length === 0
                ? `<div style="font-size:13px;color:var(--ha-muted);">None — at least 2 sensors must agree to hold.</div>`
                : (comb.solo_triggers || [])
                    .map(
                      (s) => `
                    <div style="display:flex;justify-content:space-between;padding:8px 10px;background:var(--ha-subtle);border:1px solid var(--ha-divider);border-radius:8px;margin-bottom:6px;font-size:13px;">
                      <span>${panel._escape(s.label)}</span>
                      <strong style="color:var(--ha-success-text);">${s.posterior_pct}%</strong>
                    </div>`
                    )
                    .join("")
            }
          </div>
          <div>
            <div class="setting-label" style="margin-bottom:8px;">2-sensor combinations crossing hold threshold (&ge; ${threshPct}%)</div>
            ${
              (comb.pair_triggers || []).length === 0
                ? `<div style="font-size:13px;color:var(--ha-muted);">No 2-sensor combinations cross threshold.</div>`
                : (comb.pair_triggers || [])
                    .slice(0, 8)
                    .map(
                      (p) => `
                    <div style="display:flex;justify-content:space-between;padding:8px 10px;background:var(--ha-subtle);border:1px solid var(--ha-divider);border-radius:8px;margin-bottom:6px;font-size:13px;">
                      <span>${panel._escape(p.labels)}</span>
                      <strong style="color:var(--ha-primary-text);">${p.posterior_pct}%</strong>
                    </div>`
                    )
                    .join("")
            }
          </div>
          <div>
            <div class="setting-label" style="margin-bottom:8px;">Ignored combinations (&lt; ${threshPct}%)</div>
            ${
              (comb.pair_sub_threshold || []).length === 0
                ? `<div style="font-size:13px;color:var(--ha-muted);">None</div>`
                : (comb.pair_sub_threshold || [])
                    .slice(0, 6)
                    .map(
                      (p) => `
                    <div style="display:flex;justify-content:space-between;padding:8px 10px;background:var(--ha-subtle);border:1px solid var(--ha-divider);border-radius:8px;margin-bottom:6px;font-size:13px;color:var(--ha-muted);">
                      <span>${panel._escape(p.labels)}</span>
                      <span>${p.posterior_pct}%</span>
                    </div>`
                    )
                    .join("")
            }
          </div>
        </div>
      `
          : panel._advTab === "automations"
          ? (() => {
              const slug = panel._slugifyRoom(cfg.room_name || selRoom.room_name);
              const entityId = `binary_sensor.${slug}_presence`;
              const lightingYaml = `alias: "${cfg.room_name || selRoom.room_name} — PDD Lighting (State & Warning Dim)"
description: "Uses PDD occupancy_state, manual_off_suppressed, and human_present attributes"
use_blueprint:
path: spelech/pdd_presence_lighting.yaml
input:
  presence_sensor: ${entityId}
  respect_manual_off: true
  ignore_pets: true
  enable_warning_dim: true`;
              const stateYaml = `alias: "${cfg.room_name || selRoom.room_name} — Occupancy State Automation"
mode: restart
trigger:
- platform: state
  entity_id: ${entityId}
  attribute: occupancy_state
action:
- choose:
    - conditions:
        - condition: template
          value_template: >
            {{ state_attr('${entityId}', 'occupancy_state') == 'occupied_confirmed'
               and state_attr('${entityId}', 'human_present') | default(true, true)
               and not (state_attr('${entityId}', 'manual_off_suppressed') | default(false, true)) }}
      sequence:
        - service: light.turn_on
          target:
            area_id: ${cfg.area_id || slug}
    - conditions:
        - condition: template
          value_template: "{{ state_attr('${entityId}', 'is_cooling_down') == true }}"
      sequence:
        - service: light.turn_on
          target:
            area_id: ${cfg.area_id || slug}
          data:
            brightness_pct: 35
    - conditions:
        - condition: state
          entity_id: ${entityId}
          state: "off"
      sequence:
        - service: light.turn_off
          target:
            area_id: ${cfg.area_id || slug}`;
              return `
        <div style="margin-bottom:14px;">
          <div class="setting-label" style="margin-bottom:4px;">Entity &amp; Blueprint Contract (<code>${panel._escape(entityId)}</code>)</div>
          <div style="font-size:12.5px;color:var(--ha-muted);">
            Automations should consume <code>occupancy_state</code> (<code>occupied_confirmed</code>, <code>occupied_holding</code>, <code>occupied_cooling</code>, <code>vacant</code>), <code>verified_by</code>, <code>is_cooling_down</code>, <code>human_present</code>, and <code>manual_off_suppressed</code>.
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px;">
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <span class="setting-label" style="font-size:12.5px;">Blueprint Config (<code>pdd_presence_lighting.yaml</code>)</span>
              <button class="btn btn-sm btn-copy-auto" data-auto-target="auto-yaml-blueprint">Copy</button>
            </div>
            <textarea class="code-area" id="auto-yaml-blueprint" readonly style="min-height:190px;">${panel._escape(lightingYaml)}</textarea>
          </div>
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <span class="setting-label" style="font-size:12.5px;">Direct State-Aware Automation YAML</span>
              <button class="btn btn-sm btn-copy-auto" data-auto-target="auto-yaml-direct">Copy</button>
            </div>
            <textarea class="code-area" id="auto-yaml-direct" readonly style="min-height:190px;">${panel._escape(stateYaml)}</textarea>
          </div>
        </div>`;
            })()
          : panel._advTab === "yaml"
          ? `
        <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;">
          <button class="btn btn-sm ${panel._rightTab === "yaml" ? "btn-primary" : ""}" data-rtab="yaml">Room YAML</button>
          <button class="btn btn-sm ${panel._rightTab === "ha_yaml" ? "btn-primary" : ""}" data-rtab="ha_yaml">Native HA Bayesian YAML</button>
          <button class="btn btn-sm ${panel._rightTab === "nl" ? "btn-primary" : ""}" data-rtab="nl">Plain-English AI Builder</button>
        </div>
        ${
          panel._rightTab === "yaml"
            ? `
          <textarea class="code-area" id="yaml-draft-editor">${panel._escape(
            panel._yamlDraft
          )}</textarea>
          <div style="display:flex;justify-content:flex-end;margin-top:8px;">
            <button class="btn btn-primary btn-sm" id="btn-apply-yaml">Apply YAML</button>
          </div>`
            : panel._rightTab === "ha_yaml"
            ? `<textarea class="code-area" readonly>${panel._escape(
                prev.ha_bayesian_yaml || ""
              )}</textarea>`
            : `
          <textarea class="code-area" id="nl-prompt-input" style="min-height:90px;" placeholder="Describe how this room should behave in plain English...">${panel._escape(
            panel._nlPrompt
          )}</textarea>
          <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;">
            <button class="btn btn-primary btn-sm" id="btn-nl-to-yaml">Generate Rules</button>
            <button class="btn btn-sm" id="btn-yaml-to-nl">Explain Current Rules</button>
          </div>
          ${
            panel._nlOutput
              ? `<div style="margin-top:10px;padding:12px;background:var(--ha-subtle);border:1px solid var(--ha-divider);border-radius:8px;font-size:13px;white-space:pre-wrap;">${panel._escape(
                  panel._nlOutput
                )}</div>`
              : ""
          }`
        }
      `
          : `
        ${
          (selRoom.revisions || []).length === 0
            ? `<div style="font-size:13px;color:var(--ha-muted);">No saved revisions yet.</div>`
            : (selRoom.revisions || [])
                .map(
                  (rev) => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--ha-divider);font-size:13px;">
                  <div>
                    <div style="font-weight:500;">${panel._escape(rev.note || "Saved settings")}</div>
                    <div style="font-size:12px;color:var(--ha-muted);">${panel._escape(
                      rev.timestamp
                    )}</div>
                  </div>
                  <button class="btn btn-sm btn-rollback" data-rev-idx="${rev.index}">Restore</button>
                </div>`
                )
                .join("")
        }
      `
      }
    </div>
  `;
}

