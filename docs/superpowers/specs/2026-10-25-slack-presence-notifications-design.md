# Slack Presence Notifications & Diagnostic Attribution Design

**Date:** 2026-10-25  
**Component:** `ha-presence-detection-designer`  
**Status:** Approved  

---

## 1. Overview & Objective

Provide automated, real-time Slack notifications via Home Assistant's existing Slack integration (`notify.scdbots`) whenever configured rooms experience presence transitions (`clear` $\rightarrow$ `occupied` or `occupied` $\rightarrow$ `clear`).

Each notification delivers a rich diagnostic card detailing the exact primary driver behind the state change (e.g., Frigate camera person detection, mmWave sensor, sustaining condition such as TV playback, or inactivity timeout expiration), the Bayesian confidence score, active sensors, and cross-room arrival context.

Notifications are configurable per room with granular controls for occupied/cleared triggers, global master controls, and a dedicated test button.

---

## 2. Architecture & Data Flow

```
                      +---------------------------------------+
                      | Home Assistant Entity State Changes   |
                      | (PIR, mmWave, Cameras, Media Players) |
                      +-------------------+-------------------+
                                          |
                                          v
                      +---------------------------------------+
                      | PresenceCoordinator & Bayesian Engine |
                      | - Evaluates observations              |
                      | - Computes P(occupied)                |
                      | - Evaluates sustaining conditions     |
                      +-------------------+-------------------+
                                          |
                                          v
                      +---------------------------------------+
                      | RoomStateMachine Transition Check     |
                      | Detects:                              |
                      | - clear -> occupied                   |
                      | - occupied -> clear                   |
                      +-------------------+-------------------+
                                          |
                                          v
                      +---------------------------------------+
                      | NotificationDispatcher                |
                      | 1. Checks global & per-room settings  |
                      | 2. Debounces rapid flickers (< 5s)   |
                      | 3. Resolves primary driver & context  |
                      | 4. Formats Slack Block Kit / Markdown |
                      | 5. Emits HA event bus transition      |
                      | 6. Calls notify.scdbots async         |
                      +-------------------+-------------------+
                                          |
                                          v
                      +---------------------------------------+
                      | Slack Channel: #presence-alerts       |
                      +---------------------------------------+
```

---

## 3. Data Model & Configuration Schemas

### 3.1 Global Settings (`global_settings` in Store)
```python
{
    "notifications_enabled": True,  # Master toggle
    "slack_notify_service": "notify.scdbots",
    "slack_channel": "#presence-alerts",
}
```

### 3.2 Per-Room Settings (`RoomConfig` in Store)
```python
{
    "notify_slack": False,  # Opt-in per room
    "notify_on_occupied": True,
    "notify_on_cleared": True,
}
```

---

## 4. Driver Attribution Engine

When a state transition occurs, the coordinator resolves the driver attribution:

### 4.1 On Occupied (`clear` $\rightarrow$ `occupied`)
- **Primary Driver**: Identifies the specific entity that changed state or had the greatest positive delta impact on $P(\text{occupied})$ crossing the activation threshold.
- **Bayesian Confidence**: Current $P(\text{occupied})$ and the room threshold.
- **Active Observations**: All other binary sensors/entities in this room currently in `on` / active state.
- **Sustaining Conditions**: Any active sustaining rules (e.g. `media_player.living_room_tv` is `playing`).
- **Arrival Context**: Adjacent room transition context (if an adjacent room transitioned or had activity within the last 30 seconds).

### 4.2 On Cleared (`occupied` $\rightarrow$ `clear`)
- **Primary Reason**:
  - **Inactivity Timeout**: Expiration of the configured inactivity timer after all sensors returned to `off`.
  - **Sustaining Condition Drop**: Sustaining entity turned off, followed by inactivity window elapse.
  - **Bounded Room Exit**: Bounded door opened and adjacent transit area tripped.
- **Occupancy Duration**: Formatted duration string ($H\text{h } M\text{m } S\text{s}$) indicating how long the room remained continuously occupied.
- **Final Confidence**: Final $P(\text{occupied})$ score.

---

## 5. Message Formatting & Dispatcher

### 5.1 Slack Card Layout
Using Slack Markdown and attachments:

* **Occupied Format**:
  ```
  🟢 *Living Room → Occupied*
  • *Primary Driver:* `binary_sensor.living_room_person_occupancy` (Frigate Camera)
  • *Bayesian Probability:* 88% (Threshold: 70%)
  • *Active Sensors:* `living_room_motion` (PIR), `living_room_couch` (mmWave)
  • *Sustaining Conditions:* `media_player.living_room_appletv` (playing)
  • *Arrival Context:* Entered from `Kitchen` (active 8s ago)
  ```

* **Cleared Format**:
  ```
  ⚪ *Living Room → Cleared*
  • *Clearance Driver:* Inactivity timeout (180s) expired with zero active sensors
  • *Duration of Occupancy:* 34m 18s
  • *Final Probability:* 12%
  ```

### 5.2 Dispatcher Rules
- **Targeting**: Calls `notify.scdbots` with `target: ["#presence-alerts"]` and `data: {"channel": "#presence-alerts"}`.
- **Non-blocking Execution**: Dispatched as an async background task within Home Assistant.
- **Error Resiliency**: Graceful warning log if Slack API fails; will never block presence state evaluation.
- **Flicker Debounce**: If a room oscillates within 5 seconds, debounce to prevent notification storms.
- **Home Assistant Event**: Fires `presence_detection_designer_transition` event containing the full diagnostic dictionary.

---

## 6. User Interface Controls

1. **Global Settings Modal**:
   - Master Switch: "Enable Slack Notifications"
   - Service Selector / Input: Defaulting to `notify.scdbots`
   - Channel Input: Defaulting to `#presence-alerts`
   - "Send Test Alert" button calling backend endpoint `POST /api/presence_detection_designer/notifications/test`

2. **Room Inspector**:
   - New "Slack Notifications" section card:
     - Checkbox: "Enable Slack Alerts for this room"
     - Checkbox: "Alert on Occupied"
     - Checkbox: "Alert on Cleared"

---

## 7. Testing Strategy
- Unit tests for driver attribution logic on simulated transitions (`clear` $\rightarrow$ `occupied`, `occupied` $\rightarrow$ `clear`).
- Unit tests for `NotificationDispatcher` payload formatting and debounce logic.
- Mock tests for Home Assistant service calls to `notify.scdbots` and `presence_detection_designer_transition` event firing.
- API tests for `/api/presence_detection_designer/notifications/test` endpoint.
