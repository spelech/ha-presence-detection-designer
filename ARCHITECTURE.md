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

*(Phase 2 will insert the `candidate` PIR validation state between `vacant` and `occupied_confirmed` once the `transitions` foundation is verified.)*

---

## Module Boundaries (`<= 500 LOC` per module)

```text
custom_components/presence_detection_designer/
├── state_machine.py          # HierarchicalGraphMachine model, TransitionRecord, Mermaid export
├── evidence_snapshot.py      # RoomEvidenceSnapshot normalization (spatial + triggers + optional Bayesian/conditions)
├── coordinator.py            # HA event subscriptions, timer scheduling, coordinator lifecycle
├── coordinator_dispatch.py   # Transition event bus, Slack attribution, adjacent handoff dispatch
├── binary_sensor.py          # binary_sensor.<room>_presence + automation attributes
├── spatial_topology.py       # Preserved 2D floorplan & doorway-occluded raycasting
├── spatial_room_evaluator.py # Preserved positive/negative-space & human/pet classification
└── static/panel.js           # Floorplan studio, live state diagram view, timeline & replay UI
```

---

## Core Design Guarantees

1. **Bounded Liveness (`GUARD-01`)**: No state can hold occupancy indefinitely; `holding`, `cooling`, and `verifying` each arm an entry timer and cancel it on exit.
2. **Pet Exclusion (`GUARD-02`)**: Pet-only spatial detections (`pet_present=True`, `human_present=False`) set `human_evidence_active=False` and never drive `vacant -> occupied`.
3. **Decoupled Headcount (`GUARD-03`)**: Whole-house headcount tracking cannot mutate or clear room occupancy state machines.
4. **Deterministic Replay Parity (`REPLAY-01`)**: The exact same `RoomPresenceStateMachine` drives live Home Assistant timers and `replay_engine.py` virtual clock steps.
