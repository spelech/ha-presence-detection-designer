# Architecture: Presence Detection Designer

This document defines the reworked architecture, module boundaries, `transitions` state-flow model, and bounded-liveness guarantees for **Presence Detection Designer (`ha-presence-detection-designer`)**.

---

## High-Level System Architecture

```mermaid
flowchart TD
    subgraph Sensors["Home Assistant Sensor & Topology Inputs"]
        HA["HA State Changes<br/>(Cameras, PIRs, Conditions, BLE)"]
        FP["Floorplan Geometry & Wall Raycasting<br/>(spatial_topology / spatial_room_evaluator)"]
    end

    subgraph Evidence["Evidence Normalization Layer"]
        EV["RoomEvidenceSnapshot<br/>(human_evidence, pet_only, hold_evidence, camera_confirmed)"]
    end

    subgraph Core["transitions State Machine Engine (Per Room)"]
        SM["RoomPresenceStateMachine<br/>(HierarchicalGraphMachine)"]
        Timer["Entry/Exit Timer & Virtual Clock"]
        Audit["Transition Audit Ring Buffer"]
        Mermaid["Live Mermaid Diagram Exporter"]
    end

    subgraph Outputs["Home Assistant & Observability Outputs"]
        BS["binary_sensor.<room>_presence<br/>(+ automation attributes)"]
        API["HTTP Views (/state_graph, /overview)"]
        UI["panel.js Live State Diagram & Audit Feed"]
        Slack["Slack Transition Cards"]
    end

    HA --> FP
    HA --> EV
    FP --> EV
    EV --> SM
    SM --> Timer
    SM --> Audit
    SM --> Mermaid
    SM --> BS
    Audit --> API
    Mermaid --> API
    API --> UI
    SM --> Slack
```

---

## Room State Machine Flow (`HierarchicalGraphMachine`)

```mermaid
stateDiagram-v2
    [*] --> vacant

    vacant --> occupied_confirmed : evidence_detected [has_human_evidence]
    vacant --> override : enable_override

    state occupied {
        [*] --> confirmed
        confirmed --> holding : evidence_cleared [has_hold_evidence]
        confirmed --> cooling : evidence_cleared [no_hold_evidence]
        holding --> confirmed : evidence_detected [has_human_evidence]
        holding --> cooling : hold_cleared
        holding --> cooling : hold_timeout
        cooling --> confirmed : evidence_detected [has_human_evidence]
        cooling --> verifying : countdown_expired [llm_enabled]
        verifying --> confirmed : evidence_detected [has_human_evidence]
        verifying --> cooling : llm_person_detected
    }

    occupied_confirmed --> vacant : adjacent_handoff [can_handoff_clear]
    occupied_holding --> vacant : adjacent_handoff [can_handoff_clear]
    occupied_cooling --> vacant : adjacent_handoff [can_handoff_clear]
    occupied_cooling --> vacant : countdown_expired [not llm_enabled]
    occupied_verifying --> vacant : llm_room_empty
    occupied_verifying --> vacant : verify_timeout

    occupied --> override : enable_override
    occupied --> vacant : force_clear

    override --> occupied_confirmed : disable_override [has_human_evidence]
    override --> vacant : disable_override [no_human_evidence]
```

## PIR Validation State Machine (`PIRValidationStateMachine` — Per Room)

```mermaid
stateDiagram-v2
    [*] --> idle
    idle --> confirmed : pir_triggered [has_corroboration]
    idle --> candidate : pir_triggered [not has_corroboration]
    candidate --> confirmed : pir_triggered [has_corroboration]
    candidate --> confirmed : corroborated
    candidate --> suppressed : candidate_expired [has_active_pir]
    candidate --> idle : candidate_expired [not has_active_pir]
    confirmed --> idle : pir_cleared [not has_active_pir]
    suppressed --> confirmed : corroborated [has_active_pir]
    suppressed --> confirmed : pir_triggered [has_corroboration]
    suppressed --> idle : pir_cleared [not has_active_pir]
```

- **Any-One-Of Corroborators (`PIR-02`)**: `camera` (Frigate person/subzone), `trajectory` (adjacent room/path/door), `ble` (Bermuda room/adjacent), `time_history` (2+ sensors or 2+ fast-PIR pulses in `60s`).
- **Cooldown Reliability Weighting (`PIR-03`)**: `sensor_reliability.py` computes `weight_from_cooldown(cooldown_sec)` and tempers Bayesian log-odds (`odds^w`) so Ecobee (`300s`/`1800s`) and battery camera PIR (`family_room_ring_motion`) remain supporting evidence only.

---

## Module Boundaries (`<= 500 LOC` per module)

```text
custom_components/presence_detection_designer/
├── state_machine.py          # HierarchicalGraphMachine model, TransitionRecord, Mermaid export
├── pir_validation.py         # Separate GraphMachine PIR candidate gate (10s window, 4 corroborators)
├── sensor_reliability.py     # Cooldown-based Bayesian weighting & hardware reliability catalog
├── evidence_snapshot.py      # RoomEvidenceSnapshot normalization (spatial + triggers + optional Bayesian/conditions)
├── coordinator.py            # HA event subscriptions, timer scheduling, coordinator lifecycle
├── coordinator_dispatch.py   # Transition event bus, Slack attribution, adjacent handoff dispatch
├── binary_sensor.py          # binary_sensor.<room>_presence + automation attributes
├── spatial_topology.py       # Preserved 2D floorplan & doorway-occluded raycasting
├── spatial_room_evaluator.py # Preserved positive/negative-space & human/pet classification
├── coordinator_helpers.py    # Evidence snapshot normalization (direct vs. hold-only spatial boundaries)
├── causal_context.py         # Manual vs. auto actuator tracking strictly bounded from trigger_entities
└── static/panel.js           # Floorplan studio, live state diagram view, timeline & replay UI

tests/harness/ & scripts/
├── virtual_ha.py             # Deterministic VirtualClock + InMemoryHass wiring real coordinators & sensors
├── scenario_runner.py        # Declarative JSON/YAML multi-room scenario executor
├── ha_playback.py            # HA Recorder SQLite, History JSON, and PDD .storage playback engine
├── feedback_envelope.py      # 6-part diagnostic failure envelope & action/log taps
└── replay_scenario.py        # CLI runner for synthetic scenarios and real HA data playback
```

---

## Core Design Guarantees

1. **Bounded Liveness (`GUARD-01`)**: No state can hold occupancy indefinitely; `holding`, `cooling`, and `verifying` each arm an entry timer and cancel it on exit.
2. **Pet Exclusion (`GUARD-02`)**: Pet-only spatial detections (`pet_present=True`, `human_present=False`) set `human_evidence_active=False` and never drive `vacant -> occupied`.
3. **Decoupled Headcount (`GUARD-03`)**: Whole-house headcount tracking cannot mutate or clear room occupancy state machines.
4. **Deterministic Replay & Clock-Anchor Parity (`REPLAY-01`, `REPLAY-02`, `STATE-07`)**: The exact same `RoomPresenceStateMachine` drives live Home Assistant timers, `replay_engine.py`, and `VirtualHAHarness` via clock-anchored timestamps (`_virtual_now` + `_virtual_wall_base`) so scheduled callbacks never observe stale virtual timestamps.
5. **Strict Trigger vs. Sustaining Hold Boundary (`GUARD-06`, `GUARD-07`)**: Non-trigger sustaining actuators (`sustaining_conditions`) and hold-only spatial exclusions (`negative_space` / `blind_pocket` without `positive_drivers`) feed only `has_hold_evidence` (`occupied_holding`, bounded by `max_hold_timeout`) and cannot enter `_active_triggers` or inject manual entry pulses.
