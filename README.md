# Presence Detection Designer for Home Assistant

[![CI](https://github.com/spelech/ha-presence-detection-designer/actions/workflows/ci.yml/badge.svg)](https://github.com/spelech/ha-presence-detection-designer/actions/workflows/ci.yml)
[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/default)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Presence Detection Designer** is an intelligent room presence integration for Home Assistant combining the classic **Wasp-in-a-Box (WIB)** boundary algorithm with **dynamic entity condition matrices** and **VLM / Vision LLM snapshot verification**.

---

## 🧐 The Problem with Standard Presence Detection

Standard passive infrared (PIR) motion sensors and even smart edge person detectors (such as Frigate NVR) share a common limitation: **they lose tracking when occupants remain stationary**.

* Watching a 2-hour movie on the couch? Motion stops, edge bounding boxes disappear, and lights abruptly shut off.
* Reading a book quietly in an armchair? Motion timeouts expire.
* Sleeping or working at a desk? Presence is lost.

Traditional workarounds (huge 45-minute inactivity timeouts) result in rooms staying illuminated long after everyone has left.

---

## 💡 The Solution: Wasp-in-a-Box + Sustained State + AI Vision Guard

```
                          [ Any Trigger = ON ]
             +---------------------------------------------+
             |                                             |
             v                                             |
     +---------------+                                     |
     |   OCCUPIED    | <--------------------+              |
     | (Room = ON)   |                      |              |
     +-------+-------+                      |              |
             |                              |              |
    [ Door Opens / Inactivity ]    [ Motion Detected /     |
             |                      Sustaining Cond TRUE ] |
             v                              |              |
     +---------------+                      |              |
     | VACATING_WAIT | ---------------------+              |
     | (Timer runs)  |                                     |
     +-------+-------+                                     |
             | [ Timer Reaches 0 ]                         |
             v                                             |
     +---------------+                                     |
     | LLM_VERIFYING |                                     |
     +-------+-------+                                     |
      |             |                                      |
 [Person Found]  [No Person]                               |
      |             |                                      |
      |             v                                      |
      |      +---------------+                             |
      |      |     CLEAR     | ----------------------------+
      |      |  (Room = OFF) |
      v      +---------------+
  Extend Timer /
  Remain Occupied
```

### 1. Bounded Rooms (Door Sensors Available)
Uses physical perimeter boundaries (contact sensors):
* Once motion is detected inside and the door closes, the room transitions to `occupied_sealed`.
* Presence remains locked `ON` **indefinitely** while the door remains shut—even if PIR motion stops completely.
* When the door opens and closes, a brief grace countdown begins (e.g. 60 seconds). If no subsequent motion or sustaining activity occurs, it verifies absence before turning `OFF`.

### 2. Open-Concept Rooms (No Door Sensors)
Designed specifically for living rooms, kitchens, and open layouts:
* Immediate activation on motion or camera detection.
* While **sustaining conditions** are active (e.g., TV is playing, PC power draw > 30W), the timer is frozen and presence stays locked `ON`.
* When sustaining conditions clear and motion stops, an inactivity timer counts down.

### 3. VLM / Vision LLM Pre-Vacate Guard
Before flipping presence to `OFF`, the engine captures a camera snapshot (from an HA camera or direct Frigate snapshot URL) and asks a Vision model (*"Is there a person in this room?"*):
* **Occupant Found?** Presence is extended for another window without lights cutting out.
* **Room Empty?** Presence immediately turns `OFF`.

Compatible with:
* Direct Vision APIs (OpenAI, Gemini API, Ollama, LocalAI)
* Home Assistant Conversation Agents (`conversation.process`)

---

## 📦 Entities Created per Room

Each configured room creates a Home Assistant device containing:

| Entity | Type | Description |
| :--- | :--- | :--- |
| `binary_sensor.<room>_presence` | Binary Sensor (`occupancy`) | Primary occupancy state (`on`/`off`) with rich diagnostic attributes. |
| `button.<room>_verify_presence` | Button | Manually triggers an immediate camera snapshot + LLM verification check. |
| `switch.<room>_presence_override` | Switch | Manual override to force and hold presence `ON` (great for guests/parties). |

### Diagnostic Attributes on `binary_sensor.<room>_presence`
* `mode`: `bounded` or `open`
* `box_state`: `idle_clear`, `occupied_sealed`, `occupied_unsealed`, `timer_active`, `llm_verifying`, or `override`
* `active_conditions`: List of currently satisfied sustaining conditions (e.g. `["media_player.tv equals playing"]`)
* `last_trigger_entity`: Entity ID of the most recent trigger sensor
* `vacating_countdown`: Remaining seconds before turning off or calling LLM verification
* `last_llm_check`: Timestamp, verdict (`person_detected: true/false`), and reasoning

---

## 🚀 Installation

### Option 1: Via HACS (Recommended)
1. Open **HACS** in Home Assistant.
2. Click the three dots in the top right corner and select **Custom repositories**.
3. Enter `https://github.com/spelech/ha-presence-detection-designer` and choose category **Integration**.
4. Click **Download**, then restart Home Assistant.

### Option 2: Manual Installation
1. Download `presence_detection_designer.zip` from the latest [GitHub Release](https://github.com/spelech/ha-presence-detection-designer/releases).
2. Extract the folder into your Home Assistant directory:
   `<config_dir>/custom_components/presence_detection_designer/`
3. Restart Home Assistant.

---

## ⚙️ Configuration

1. In Home Assistant, go to **Settings** -> **Devices & Services** -> **Add Integration**.
2. Search for **Presence Detection Designer**.
3. Configure your room:
   * **Room Name**: e.g., "Living Room" or "Master Bedroom".
   * **Mode**: Bounded (with door sensors) or Open Area.
   * **Boundary Sensors**: Door/window contact sensors.
   * **Trigger Sensors**: PIR motion, Frigate person detection sensors, mmWave radar.
   * **Timers**: Inactivity timeout (open rooms), unsealed grace timeout, occupancy extension timeout.
   * **LLM Snapshot Verification (Optional)**:
     * Camera entity or Frigate snapshot URL (`http://<frigate_ip>:8301/api/<cam>/latest.jpg`)
     * Provider (Vision API / HA Conversation Agent)
     * API endpoint, API key, model (e.g. `gpt-4o-mini`, `gemini-1.5-flash`, `llama3.2-vision`)

You can edit these settings at any time by clicking **Configure** on the integration card.

---

## 🛠️ Actions / Services

* **`presence_detection_designer.verify_presence`**:
  Manually triggers a snapshot and AI evaluation cycle.
  ```yaml
  action: presence_detection_designer.verify_presence
  data:
    entry_id: "your_room_entry_id"  # Optional, verifies all if omitted
  ```
* **`presence_detection_designer.force_refresh`**:
  Re-evaluates all sustaining conditions immediately.

---

## 🧪 Testing & Verification

The integration includes a full test suite with unit tests and scenario simulations:

```bash
uv run pytest --cov=custom_components/presence_detection_designer -v
```

All scenarios (stationary TV watcher, closed-door stillness, vacate transitions, and LLM couch relaxer extensions) run with 100% test coverage.

---

## 📄 License

MIT License © 2026 Steven T. Pelech
