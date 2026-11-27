import { PDD_DEVICE_MODEL_PRESETS } from "../shared/defaults.js";
// Floorplan inspector 3rd column: PIR Motion, Door Contact & BLE Proxy placement.

export function renderFloorplanSensorsColumn(panel, {
  fRooms, fSensors, fProxies, selSensor, selBleProxy, doorSensorsList, pirSensorsList,
}) {
  return `
          <!-- 3rd Column: PIR Motion, Door Contact & BLE Proxy Placement -->
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:6px;">
              <div class="setting-label" style="margin-bottom:0;">📡 PIR Motion &amp; Door Sensors (${fSensors.length})</div>
              <div style="display:flex;gap:6px;flex-wrap:wrap;">
                <button class="btn btn-sm" id="btn-fp-add-pir-sensor" style="padding:3px 8px;font-size:11.5px;">+ PIR Sensor</button>
                <button class="btn btn-sm" id="btn-fp-add-door-sensor" style="padding:3px 8px;font-size:11.5px;">+ Door Sensor</button>
              </div>
            </div>
            ${
              !selSensor
                ? `<div style="font-size:13px;color:var(--ha-muted);">No PIR or door sensors on this floor yet.</div>`
                : `
              <select class="select" id="fp-sensor-select" style="margin-bottom:10px;">
                ${fSensors
                  .map(
                    (s) =>
                      `<option value="${panel._escape(s.id)}" ${
                        s.id === selSensor.id ? "selected" : ""
                      }>${s.sensor_type === "door_contact" ? "🚪" : "📡"} ${panel._escape(
                        s.name || s.id
                      )} (${panel._escape(s.host_room || "")})</option>`
                  )
                  .join("")}
              </select>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
                <div>
                  <small>Entity ID</small>
                  <input type="text" class="input fp-sensor-field" data-key="entity_id" value="${panel._escape(
                    selSensor.entity_id || ""
                  )}" style="font-size:12px;" />
                </div>
                <div>
                  <small>Host Room</small>
                  <select class="select fp-sensor-field" data-key="host_room" style="font-size:12px;">
                    ${fRooms
                      .map((r) => {
                        const rn = r.name || r.room_name;
                        return `<option value="${panel._escape(rn)}" ${
                          rn === selSensor.host_room ? "selected" : ""
                        }>${panel._escape(rn)}</option>`;
                      })
                      .join("")}
                  </select>
                </div>
              </div>
              <div style="margin-bottom:8px;">
                <small style="display:block;margin-bottom:2px;color:var(--ha-muted);">Sensor Hardware Preset (auto-sets specs, FOV &amp; Range)</small>
                <select class="select" id="fp-sensor-preset-select" style="font-size:12px;">
                  <option value="">Custom / Manual (${
                    selSensor.sensor_type === "door_contact"
                      ? "Contact Sensor"
                      : `${Number(selSensor.fov_deg || 110)}° FOV`
                  })</option>
                  ${Object.values(typeof PDD_DEVICE_MODEL_PRESETS !== "undefined" ? PDD_DEVICE_MODEL_PRESETS : {})
                    .filter(
                      (p) =>
                        (p.category || p.device_type) ===
                        (selSensor.sensor_type === "door_contact" ? "door_contact" : "pir_motion")
                    )
                    .map(
                      (p) =>
                        `<option value="${panel._escape(p.id)}" ${
                          selSensor.model_preset === p.id ? "selected" : ""
                        }>${panel._escape(p.label || p.name)}${
                          p.fov_deg ? ` — ${Number(p.fov_deg)}° FOV` : ""
                        }</option>`
                    )
                    .join("")}
                </select>
              </div>
              <div class="fp-fields-5">
                <div><small>X</small><input type="number" class="input fp-sensor-field" data-key="x" value="${Number(
                  selSensor.x || 0
                )}" /></div>
                <div><small>Y</small><input type="number" class="input fp-sensor-field" data-key="y" value="${Number(
                  selSensor.y || 0
                )}" /></div>
                <div><small>Angle°</small><input type="number" class="input fp-sensor-field" data-key="heading_deg" value="${Number(
                  selSensor.heading_deg || 0
                )}" ${selSensor.sensor_type === "door_contact" ? "disabled" : ""} /></div>
                <div><small>FOV°</small><input type="number" class="input fp-sensor-field" data-key="fov_deg" value="${Number(
                  selSensor.fov_deg || 110
                )}" ${selSensor.sensor_type === "door_contact" || panel._isSpecLocked(selSensor) ? 'disabled title="Locked to hardware preset spec"' : ""} /></div>
                <div><small>Range</small><input type="number" class="input fp-sensor-field" data-key="range_px" value="${Number(
                  selSensor.range_px || 180
                )}" ${selSensor.sensor_type === "door_contact" || panel._isSpecLocked(selSensor) ? 'disabled title="Locked to hardware preset spec"' : ""} /></div>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;flex-wrap:wrap;gap:6px;">
                <span style="font-size:11.5px;color:var(--ha-muted);">Tip: Switch to <strong>📡 PIR &amp; BLE Sensors</strong> mode to drag on canvas.</span>
                <button class="btn btn-sm" id="btn-fp-delete-sensor" data-sensor-id="${panel._escape(
                  selSensor.id
                )}" style="padding:2px 8px;color:var(--ha-danger-text);font-size:11.5px;">Delete Sensor</button>
              </div>`
            }

            <!-- BLE Proxies on this floor -->
            <div style="margin-top:12px;padding-top:10px;border-top:1px dashed var(--ha-divider);">
              <div style="font-size:12.5px;font-weight:600;margin-bottom:6px;">📶 BLE Proxy Anchors on Floor (${fProxies.length})</div>
              <div style="display:flex;flex-direction:column;gap:4px;max-height:110px;overflow:auto;">
                ${fProxies
                  .map(
                    (bp) => `
                  <div style="display:flex;justify-content:space-between;align-items:center;background:var(--ha-subtle);padding:4px 8px;border-radius:6px;font-size:11.5px;">
                    <span><strong>${panel._escape(bp.name || bp.id)}</strong> (${panel._escape(bp.host_room)})</span>
                    <span style="font-family:var(--ha-mono);color:var(--ha-muted);">(${Number(bp.x)}, ${Number(bp.y)}) r=${Number(bp.radius_px || 200)}</span>
                  </div>`
                  )
                  .join("")}
              </div>
            </div>
  `;
}
