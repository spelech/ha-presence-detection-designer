# Configuration & Reference

---

## Entities per Room

| Entity | Domain | Description |
| :--- | :--- | :--- |
| `binary_sensor.<room>_presence` | `binary_sensor` (`occupancy`) | Primary room presence entity (`on` = occupied, `off` = vacant). |
| `sensor.<room>_occupancy_probability` | `sensor` (`%`) | Continuous `0.0–100.0%` occupancy probability from `HouseHMMEngine`. |
| `button.<room>_verify_presence` | `button` | Triggers an immediate camera snapshot + Vision LLM verification check. |
| `switch.<room>_presence_override` | `switch` | Manually locks room presence `on` indefinitely. |

---

## Key Attributes on `binary_sensor.<room>_presence`

| Attribute | Type | Meaning |
| :--- | :--- | :--- |
| `inference_engine` | `string` | Active engine (`coupled_hmm`). |
| `bayesian_probability_pct` | `float` | Live occupancy confidence (`0.0–100.0%`). |
| `theta_enter_pct` / `theta_clear_pct` | `float` | HMM entry (`61.4%`) and clear (`50.6%`) thresholds. |
| `confidence_tier` | `string` | `vacant`, `low`, `ambiguous`, `occupied`, or `high_confidence`. |
| `spillover_exposure_pct` | `float` | Raycast PIR spillover exposure from adjacent rooms (`0–100%`). |
| `recommended_lighting_threshold_pct` | `float` | Spillover-adjusted confidence threshold for lighting (`61.4%`, `72.0%`, or `80.0%`). |
| `meets_lighting_threshold` | `bool` | `true` when occupied and confidence ≥ `recommended_lighting_threshold_pct`. |
| `manual_off_suppressed` | `bool` | `true` when user manually turned off lights while occupied (resets on vacancy). |
| `hmm_active_drivers` | `list[str]` | Currently active evidence drivers (e.g., `cam:...`, `pir:...`, `sustain:...`, `ekf:99%`, `ecobee_sustain`). |
| `ekf_room_probability_pct` | `float` | Analytic 2D Gaussian integral of the EKF track inside this room (`0–100%`). |
| `ekf_track` | `dict` | Live EKF telemetry (`floor`, `top_room`, `top_room_prob_pct`, `sigma_x_ft`, `sigma_y_ft`, `speed_ft_s`, `active_proxy_count`). |
| `natural_language_explanation` | `string` | Plain-English summary of why the room is occupied or vacant. |
| `transition_history` | `list[dict]` | Recent occupancy state transitions with timestamps, triggers, and reasons. |

---

## Global Feature Toggles (`store.global_settings`)

| Setting | Default | Description |
| :--- | :---: | :--- |
| `ekf_floor_stability_v2` | `true` | Enables v2 EKF floor scoring (best-proxy + `0.15×` secondary tiebreaker, no Bermuda area double-counting, incumbent-floor camera corroboration). Set `false` to revert to legacy v1 floor scoring. |
| `negative_space_enabled` | `true` | Enables wall-clipped clear-camera negative-space decay. Automatically paused when `guest_mode_enabled` is `true`. |
| `guest_mode_enabled` | `false` | Relaxes single-occupant assumptions and allows uncorroborated PIRs when guests without tracked phones are present. |
| `ble_decider_enabled` | `false` | Controls whether raw BLE area sensors can act as standalone deciders outside EKF supporting fusion. |
| `notifications_enabled` | `true` | Enables Slack presence alerts & daily summary threads when configured. |

---

## Services / Actions

| Action | Purpose |
| :--- | :--- |
| `presence_detection_designer.explain_presence` | Returns live probability, active drivers, rule guide, and optional LLM explanation for a room (`room_name`, `use_llm`). |
| `presence_detection_designer.translate_config` | Bidirectionally translates natural-language room descriptions ↔ Designer / HA YAML (`direction: to_yaml \| to_nl`). |
| `presence_detection_designer.configure_room` | Updates a room's configuration live and reloads it. |
| `presence_detection_designer.verify_presence` | Triggers an on-demand Vision LLM snapshot check. |
| `presence_detection_designer.force_refresh` | Immediately re-evaluates all rooms and refreshes entity states. |
| `presence_detection_designer.reset_manual_override` | Clears `manual_off_suppressed` / manual intent back to `auto` for one or all rooms. |

---

## Troubleshooting

### 1. Room turns on when nobody is inside
- Check `transition_history` on `binary_sensor.<room>_presence` to see the exact driver (`cam:...`, `pir:...`, `ekf:...`).
- **If `cam:...`:** Pull Frigate's live annotated snapshot (`/api/<camera>/latest.jpg?bbox=1&zones=1`). Stationary objects like laundry hampers or rumpled blankets often false-trigger `person`. Add a targeted `objects.filters.person.mask` over stationary clutter or raise `objects.filters.person.threshold` (e.g., `0.85–0.90`).
- **If `pir:...`:** Check `spillover_exposure_pct` and make sure your entry lighting automation checks `meets_lighting_threshold == true`.

### 2. Room drops occupancy while watching TV or playing console on HDMI
- Ensure the room has a sustaining condition on its TV `media_player` entity.
- On `v0.4.2+`, `media_player.*` `equals "playing"` automatically accepts `"on"` so LG webOS and HDMI inputs sustain cleanly. Verify `sustain:media_player.<tv>` appears in `hmm_active_drivers`.

### 3. Vacant room above/below you shows 25–40% probability
- This is typically vertical BLE floor bleed in Bermuda (`Master Bedroom ↔ Living Room`).
- Verify `ekf_floor_stability_v2` is `true` (`v0.4.2+`), and verify Bermuda's `ref_power` matches the anchor value your `rssi_offsets` were calibrated against. Note that PDD's `61.4%` threshold prevents a 25–40% BLE bleed from triggering occupancy on its own.
