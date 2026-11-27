# Global Settings Modal

Click the **Settings (⚙)** icon in the PDD Studio header to open the **Global Settings Modal**. Changes here apply house-wide and persist natively in Home Assistant's `.storage/presence_detection_designer`.

---

## 1. Inference Engine & Feature Toggles

| Setting | Default | What It Controls |
| :--- | :---: | :--- |
| **Inference Engine** | `coupled_hmm` | Uses the production `HouseHMMEngine` continuous-time log-odds HMM. |
| **EKF Floor Stability v2** (`ekf_floor_stability_v2`) | `On` | Removes 2-proxy count bias in floor scoring, stops Bermuda area double-counting when live per-proxy BLE ranges exist, and enables incumbent-floor camera corroboration. |
| **Negative-Space Inference** (`negative_space_enabled`) | `On` | Uses wall-clipped clear-camera views to accelerate decay when a room is visually empty. |
| **Guest Mode** (`guest_mode_enabled`) | `Off` | Relaxes single-occupant assumptions and allows uncorroborated PIRs when guests without tracked phones are in the house. |
| **BLE Decider** (`ble_decider_enabled`) | `Off` | Keeps BLE in supporting/EKF mode (recommended) instead of letting raw BLE area sensors solo-trigger rooms. |
| **Advanced UI Mode** (`ui_advanced_mode`) | `Off` | Reveals the **Diagnostics** tab in the Room Editor (raw log-odds, EKF covariance, and JSON/YAML exports). |

---

## 2. BLE Trackers & House Perimeter

- **Tracked BLE Entities:** List the Bermuda area sensors (e.g., `sensor.resident_phone_ble_area`) that PDD's 2D+Floor EKF should track across floors.
- **Perimeter & Interior Doors:** Configure exterior doors and exit corroborators for house occupancy mode (`occupied`, `vacant`, `guest`, `pet_only`).

---

## 3. Vision LLM & Slack Notifications

- **Vision LLM:** Choose your Home Assistant conversation/AI agent ID and model for pre-vacate snapshot verification and NL ↔ YAML translation.
- **Global Slack Alerts:** Configure your notify service, target channel, verbosity (`minimal`, `compact`, `full`), optional camera snapshot attachments, and daily summary threads.

