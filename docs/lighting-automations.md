# Lighting Automations Guide

PDD is designed so your Home Assistant lighting automations stay **minimal, native, and flicker-free** — trusting PDD's occupancy determination instead of piling on fragile template hacks.

---

## 1. Entry Lighting (Turn On When Entering a Dark Room)

Every `binary_sensor.<room>_presence` entity exposes two attributes specifically built for lighting automations:

- **`meets_lighting_threshold`** (`true` / `false`): Automatically gates entry lighting using each room's spillover-adjusted confidence threshold:
  - **Low-spillover rooms** (e.g., Office, Master Bedroom, Nursery): **`61.4%`**
  - **Medium-spillover rooms** (e.g., Living Room, Guest Room): **`72.0%`**
  - **High-spillover / open-plan rooms** (e.g., Family Room): **`80.0%`**
- **`manual_off_suppressed`** (`true` / `false`): Automatically flips to `true` when PDD detects a manual wall-switch or UI light turn-off while occupied, preventing lights from immediately re-tripping while you're in bed or watching a movie.

### Recommended HA 2026.7+ Entry Automation

```yaml
alias: "Office - Presence Entry Lighting"
description: >
  Activates Office Evening scene when entering a dark Office (via PDD occupancy).
  Respects lights already on and manual-off suppression.
mode: single
triggers:
  - trigger: occupancy.detected
    target:
      entity_id: binary_sensor.office_presence
conditions:
  # Never overwrite lights/scenes that are already on
  - condition: state
    entity_id:
      - light.office_ceiling
      - light.office_lamp
    state: "off"
  # Room-specific spillover-aware confidence gate
  - condition: state
    entity_id: binary_sensor.office_presence
    attribute: meets_lighting_threshold
    state: true
  # Respect manual turn-offs while still in the room
  - condition: state
    entity_id: binary_sensor.office_presence
    attribute: manual_off_suppressed
    state: false
  # Only when dark
  - condition: state
    entity_id: sun.sun
    state: "below_horizon"
actions:
  - action: scene.turn_on
    target:
      entity_id: scene.office_evening
```

---

## 2. Anti-Reset Auto-Off Lighting (Tunable via UI)

Standard `mode: restart` motion-off automations have an annoying flaw: if a noisy sensor blips `on` for 5 seconds while a room is empty, the countdown resets back to zero and lights stay on indefinitely.

Instead, use **`mode: single` + `max_exceeded: silent` + `wait_for_trigger`**:

1. **Triggers** on `state` `to: "off"` (omitting `from:` so transitions through `unavailable` never leave lights stuck on).
2. **Waits** up to `input_number.<room>_auto_off_timeout` minutes while watching for sustained re-occupancy (`on` for `input_number.presence_auto_off_cancel_sustain` seconds, default `30s`):
   - **Brief `<30s` false `on` blip while empty:** Ignored — does **not** reset the countdown!
   - **Real return (`on` for `≥30s`) or brief dip while still in the room:** Immediately terminates the automation (`stop`) so it's ready for the next time you leave.
   - **Walk back in right before timeout:** The final `state == "on"` check catches it and cancels without turning off the lights.
3. **Turns off** the room's lights if the timeout expires and the room is still `off`.

### UI-Tunable Helpers
Create these via **Settings → Devices & Services → Helpers → Number** (omit `initial` so your tuned values persist across HA restarts):
- `input_number.<room>_auto_off_timeout` — Range `1–60 min`, step `1` (start at `5 min`)
- `input_number.presence_auto_off_cancel_sustain` — Shared across rooms, range `5–300 s`, step `5` (start at `30 s`)

### Recommended Auto-Off Automation

```yaml
alias: "Office - Presence Auto-Off Lighting"
description: >
  Turns off Office lights after Office Auto-Off Timeout minutes of vacancy.
  Ignores brief presence blips shorter than Presence Auto-Off Cancel Sustain
  without resetting the countdown, and cancels on sustained re-occupancy.
mode: single
max_exceeded: silent
triggers:
  - trigger: state
    entity_id: binary_sensor.office_presence
    to: "off"
conditions:
  - condition: or
    conditions:
      - condition: state
        entity_id: light.office_ceiling
        state: "on"
      - condition: state
        entity_id: light.office_lamp
        state: "on"
actions:
  - wait_for_trigger:
      - trigger: state
        entity_id: binary_sensor.office_presence
        to: "on"
        for:
          seconds: "{{ states('input_number.presence_auto_off_cancel_sustain') | int(30) }}"
    timeout:
      minutes: "{{ states('input_number.office_auto_off_timeout') | int(5) }}"
    continue_on_timeout: true
  - if:
      - condition: state
        entity_id: binary_sensor.office_presence
        state: "on"
    then:
      - stop: "Office is occupied again — cancelling auto-off."
  - action: light.turn_off
    target:
      entity_id:
        - light.office_ceiling
        - light.office_lamp
```

---

## 3. Why This Pair Works So Well Together

- **Zero mid-sit re-triggers:** Entry lighting only fires when all room lights are `off` AND `binary_sensor.<room>_presence` transitions `off → on`.
- **Zero manual-off fights:** Turning off lights manually sets `manual_off_suppressed: true`, so even a brief occupancy hiccup won't blast the lights back on while you're sleeping or watching TV.
- **No stuck-on lights from hallway blips:** Auto-off ignores sub-30s false spikes without resetting the timer, and tunes in seconds from any HA dashboard.
