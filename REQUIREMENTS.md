# Software Requirements Specification: Presence Detection Designer

This specification defines the functional requirements, category taxonomy, guardrails, and automated test traceability matrix for the **Presence Detection Designer (`ha-presence-detection-designer`)** state-machine rework.

> **Architectural Scope & Breaking Redesign Decisions**
> - **Wasp-in-a-Box Retired:** Door-bounded indefinite latching (`OCCUPIED_SEALED`, `Mode.BOUNDED` infinite holds) is removed entirely.
> - **No Backwards Compatibility:** Legacy `BoxState` strings, attributes, and old WIB test assumptions are abandoned in favor of a clean `transitions` state machine contract.
> - **Floorplan & Spatial Engine Preserved:** Existing 2D floorplan geometry, doorway occlusion, camera raycasting, and spatial classification remain the evidence foundation.
> - **Pets Excluded from Occupancy:** Pet-only detections (`pet_present=True`, `human_present=False`) must not mark a room occupied.
> - **Headcount Decoupled:** Whole-house headcount and conservation-law stomping are decoupled from room state machines and deferred to a separate specification.
> - **Phased Rollout:** Phase 1 locks down the `transitions` engine, guardrails, entities, and UI observability; Phase 2 adds PIR false-positive validation (`PIR-01`..`PIR-02`) on top of the `transitions` engine.

---

## Requirement Category Taxonomy

Requirement identifiers use `<CATEGORY>-<NN>` format (`SPATIAL-01`, `STATE-01`, `GUARD-01`, `PIR-01`, `ENTITY-01`, `REPLAY-01`, `NOTIFY-01`, `UI-01`).

| Category Code | Domain Scope | Proof Types |
| :--- | :--- | :--- |
| **`SPATIAL`** | Floorplan geometry, wall/doorway raycasting, camera cones, human vs. pet localization | `PositiveFeature` / `FailClosedGuardrail` |
| **`STATE`** | `transitions` (`HierarchicalGraphMachine`) room lifecycle, event-driven timers, Mermaid export, audit log | `PositiveFeature` / `FailClosedGuardrail` |
| **`GUARD`** | Bounded liveness (no stuck rooms), pet exclusion, override isolation, decoupled headcount | `FailClosedGuardrail` |
| **`PIR`** | *(Phase 2)* PIR false-positive gating (`candidate` state), camera & time-history corroboration | `PositiveFeature` / `FailClosedGuardrail` |
| **`ENTITY`** | Home Assistant `binary_sensor` occupancy output, automation attributes, switches/buttons/services | `PositiveFeature` / `FailClosedGuardrail` |
| **`REPLAY`** | Deterministic historical/synthetic replay harness and boundary/disturbance sweeps | `PositiveFeature` |
| **`NOTIFY`** | Slack transition cards and transition-driver attribution | `PositiveFeature` / `FailClosedGuardrail` |
| **`UI`** | Live state-flow diagram + fired-transition view, floorplan canvas, reworked automations UI | `PositiveFeature` |

---

## Requirements and Traceability Matrix

| Requirement ID | Category | Type | Summary | Acceptance Criteria | Automated Test Proof |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`SPATIAL-01`** | `SPATIAL` | `PositiveFeature` | **Wall & Doorway Occluded Raycasting** | Solid walls block camera/PIR cones; doorway apertures pass sightlines into adjacent rooms. | `tests/test_spatial_topology.py` |
| **`SPATIAL-02`** | `SPATIAL` | `PositiveFeature` | **Spatial Localization & Human/Pet Classification** | Computes per-room `human_present`, `pet_present`, `occupant_type`, `inferred_subregion`, and blind-pocket coverage. | `tests/test_spatial_inference.py` |
| **`STATE-01`** | `STATE` | `PositiveFeature` | **Hierarchical `transitions` Room Lifecycle** | Each room uses a fixed `HierarchicalGraphMachine` (`vacant`, `occupied.{confirmed,holding,cooling,verifying}`, `override`); no external module mutates internal state flags. | `tests/test_transitions_state_machine.py::test_nominal_occupancy_lifecycle` |
| **`STATE-02`** | `STATE` | `PositiveFeature` | **Event-Driven Entry/Exit Timers** | Timed states (`holding`, `cooling`, `verifying`) schedule a single timeout on enter and cancel it on any exit; virtual clock stepping works identically for replay. | `tests/test_transitions_state_machine.py::test_timer_lifecycle_and_retrigger_cancellation` |
| **`STATE-03`** | `STATE` | `PositiveFeature` | **Transition Audit Log & Guard Attribution** | Every attempted trigger appends a structured `TransitionRecord` (`timestamp`, `trigger`, `source`, `dest`, `accepted`, `reason`, `guards`) to a bounded ring buffer. | `tests/test_transitions_state_machine.py::test_audit_log_records_accepted_and_blocked_transitions` |
| **`STATE-04`** | `STATE` | `PositiveFeature` | **Live Mermaid Diagram Generation** | `get_mermaid_diagram()` returns a valid `stateDiagram-v2` string directly from `HierarchicalGraphMachine.get_graph().draw(None)`. | `tests/test_transitions_state_machine.py::test_mermaid_diagram_generation` |
| **`STATE-05`** | `STATE` | `PositiveFeature` | **Normalized Evidence Snapshot Adapter** | State machine evaluates transitions exclusively from a typed `RoomEvidenceSnapshot`, decoupling Bayesian/condition tuning from transition logic. | `tests/test_transitions_state_machine.py::test_evidence_snapshot_drives_transitions` |
| **`STATE-06`** | `STATE` | `PositiveFeature` | **Adjacent Room Handoff During Cooling** | When an adjacent connected room enters `occupied` and this room is `occupied_cooling` (or has no active evidence), it clears cleanly to `vacant` with handoff attribution. | `tests/test_transitions_state_machine.py::test_adjacent_handoff_clears_cooling_room` |
| **`GUARD-01`** | `GUARD` | `FailClosedGuardrail` | **Bounded Liveness (No Stuck Occupied Rooms)** | Every `occupied` sub-state has a finite timeout path toward `vacant` (`holding` -> `cooling` on `max_hold_timeout`, `cooling` -> `vacant`/`verifying`, `verifying` -> `vacant` on `verify_timeout`). | `tests/test_transitions_guardrails.py::test_bounded_liveness_prevents_stuck_occupied` |
| **`GUARD-02`** | `GUARD` | `FailClosedGuardrail` | **Pet-Only Detections Never Mark Occupied** | When evidence indicates only a pet (`pet_present=True`, `human_present=False`), `RoomEvidenceSnapshot` does not activate human occupancy and `is_present` stays `False`. | `tests/test_transitions_guardrails.py::test_pet_only_never_marks_occupied` |
| **`GUARD-03`** | `GUARD` | `FailClosedGuardrail` | **Headcount Decoupled from Room Occupancy** | Whole-house headcount changes (including `count == 0`) never `force_clear` or block room occupancy state machines. | `tests/test_transitions_guardrails.py::test_zero_headcount_does_not_clear_occupied_room` |
| **`GUARD-04`** | `GUARD` | `FailClosedGuardrail` | **Manual Override Isolation & Recovery** | Enabling override forces `override` (`is_present=True`) and ignores sensor events; clearing override re-evaluates the live `RoomEvidenceSnapshot` immediately. | `tests/test_transitions_guardrails.py::test_override_isolation_and_live_recovery` |
| **`GUARD-05`** | `GUARD` | `FailClosedGuardrail` | **LLM Verification Timeout Fail-Safe** | If Vision/LLM verification hangs, errors, or returns malformed data while in `occupied_verifying`, `verify_timeout` fails closed toward `vacant` instead of wedging. | `tests/test_transitions_guardrails.py::test_llm_verify_timeout_fails_to_vacant` |
| **`PIR-01`** | `PIR` | `FailClosedGuardrail` | **Uncorroborated PIR Gate *(Phase 2)*** | Raw PIR triggers without camera/high-confidence/trajectory corroboration enter `candidate` (`is_present=False`) and drop back to `vacant` on verification timeout. | `tests/test_pir_validation.py` *(Phase 2)* |
| **`PIR-02`** | `PIR` | `PositiveFeature` | **PIR Corroboration Promotion *(Phase 2)*** | A `candidate` room promotes to `occupied_confirmed` on camera confirmation, valid time-history corroboration, or adjacent-room trajectory. | `tests/test_pir_validation.py` *(Phase 2)* |
| **`ENTITY-01`** | `ENTITY` | `PositiveFeature` | **Presence Binary Sensor & Attributes Contract** | `binary_sensor.<room>_presence` reports `is_on` (`occupied.*` or `override`) and exposes `occupancy_state`, `state_reason`, `cooling_remaining_sec`, `verified_by`, `transition_history`, and spatial/causal attributes. | `tests/test_presence_designer_entities.py` |
| **`REPLAY-01`** | `REPLAY` | `PositiveFeature` | **Deterministic Replay & Scenario Simulation** | Replaying historical or synthetic sensor timelines through the `transitions` engine produces deterministic state durations and transition counts. | `tests/test_replay_and_statistics.py` |
| **`NOTIFY-01`** | `NOTIFY` | `PositiveFeature` | **Slack Transition Driver Attribution** | Room transitions dispatch Slack notifications referencing the `transitions` trigger, source/dest state, and primary evidence driver. | `tests/test_presence_designer_coordinator_notifications.py` |
| **`UI-01`** | `UI` | `PositiveFeature` | **Live State Diagram & Fired-Transition View** | PDD panel renders the `transitions` Mermaid state diagram per room, highlights the active state and last transition, and shows the guard audit feed. | `tests/test_views.py` + UI audit |
| **`UI-02`** | `UI` | `PositiveFeature` | **Reworked Automations UI** | Automations UI consumes `binary_sensor.<room>_presence` and new `transitions` state attributes cleanly without legacy `box_state` coupling. | UI / Playwright layout audit |

---

## Requirement Definitions

### `SPATIAL-01`: Wall & Doorway Occluded Raycasting
- **Category**: `SPATIAL` (`PositiveFeature`)
- **Description**: Compute 2D camera and PIR visibility polygons clipped by solid floorplan wall segments while allowing sightlines through calibrated doorway apertures (`spills_into`).
- **Verification**: Real geometry calculations in `tests/test_spatial_topology.py`.

### `SPATIAL-02`: Spatial Localization & Human/Pet Classification
- **Category**: `SPATIAL` (`PositiveFeature`)
- **Description**: Evaluate live camera zones, PIR cones, BLE telemetry, and blind pockets to determine `human_present`, `pet_present`, `occupant_type`, `inferred_subregion`, and pet/sunlight entity exclusions.
- **Verification**: Real spatial evaluator tests in `tests/test_spatial_inference.py`.

### `STATE-01`: Hierarchical `transitions` Room Lifecycle
- **Category**: `STATE` (`PositiveFeature`)
- **Description**: Replace the ad-hoc `RoomStateMachine` flag bag with a fixed, non-user-modifiable `HierarchicalGraphMachine` per room containing states `vacant`, `occupied` (`confirmed`, `holding`, `cooling`, `verifying`), and `override`.
- **Verification**: Real `transitions` state machine lifecycle tests asserting state names, `is_present`, and valid/invalid transitions.

### `STATE-02`: Event-Driven Entry/Exit Timers
- **Category**: `STATE` (`PositiveFeature`)
- **Description**: Timed states (`occupied_holding`, `occupied_cooling`, `occupied_verifying`) schedule a single timeout deadline upon `on_enter` and cancel any pending callback on `on_exit`, supporting both live `asyncio` timers and deterministic virtual clock advancement (`advance_time`).
- **Verification**: Boundary (`0-1-N`) timer tests verifying cancellation on retrigger and exact expiration behavior.

### `STATE-03`: Transition Audit Log & Guard Attribution
- **Category**: `STATE` (`PositiveFeature`)
- **Description**: Record every attempted transition trigger in a bounded ring buffer (`transition_history`) capturing timestamp, trigger name, source state, destination state, `accepted` boolean, guard results, and human-readable reason.
- **Verification**: Assert exact `transition_history` payloads for both accepted transitions and guard-blocked no-ops.

### `STATE-04`: Live Mermaid Diagram Generation
- **Category**: `STATE` (`PositiveFeature`)
- **Description**: Generate a live Mermaid `stateDiagram-v2` definition directly from the `HierarchicalGraphMachine` (`graph_engine="mermaid"`) so UI diagrams never drift from Python logic.
- **Verification**: Unit test validating generated Mermaid syntax contains all declared states and transitions.

### `STATE-05`: Normalized Evidence Snapshot Adapter
- **Category**: `STATE` (`PositiveFeature`)
- **Description**: Aggregate raw triggers, camera detections, spatial results, optional Bayesian probability, and optional sustaining conditions into an immutable `RoomEvidenceSnapshot` before dispatching events to the `transitions` machine.
- **Verification**: Snapshot-driven tests proving state transitions respond strictly to normalized evidence without reading raw HA state objects inside the state machine.

### `STATE-06`: Adjacent Room Handoff During Cooling
- **Category**: `STATE` (`PositiveFeature`)
- **Description**: When an adjacent connected room transitions to `occupied` while a room has no active evidence (or is in `occupied_cooling`), clear the prior room to `vacant` and record the handoff target in `last_handoff_room`.
- **Verification**: Multi-room coordinator/state-machine handoff tests.

### `GUARD-01`: Bounded Liveness (No Stuck Occupied Rooms)
- **Category**: `GUARD` (`FailClosedGuardrail`)
- **Description**: Eliminate `OCCUPIED_SEALED` and indefinite door holds. Every `occupied` sub-state must enforce a finite maximum duration (`max_hold_timeout`, `inactivity_timeout`, `verify_timeout`) that returns the room to `vacant` when no fresh human evidence arrives.
- **Verification**: Time-advancement disturbance tests proving every occupied state eventually reaches `vacant` when evidence ceases.

### `GUARD-02`: Pet-Only Detections Never Mark Occupied
- **Category**: `GUARD` (`FailClosedGuardrail`)
- **Description**: When active room evidence is attributable solely to pets (`pet_present=True` and `human_present=False`), `RoomEvidenceSnapshot.human_evidence_active` must evaluate `False`, keeping the room `vacant` (`is_present=False`).
- **Verification**: Scenario test injecting pet-only detections and asserting `vacant` state and `is_present is False`.

### `GUARD-03`: Headcount Decoupled from Room Occupancy
- **Category**: `GUARD` (`FailClosedGuardrail`)
- **Description**: Whole-house headcount tracking must not call `force_clear()` on room state machines or block room occupancy transitions when `house_occupant_count == 0`.
- **Verification**: Integration test asserting active room occupancy survives `house_occupant_count == 0` without flapping.

### `GUARD-04`: Manual Override Isolation & Recovery
- **Category**: `GUARD` (`FailClosedGuardrail`)
- **Description**: Entering `override` locks `is_present=True` and ignores sensor/timer events; exiting `override` immediately evaluates the current `RoomEvidenceSnapshot` into `occupied_confirmed` or `vacant`.
- **Verification**: Override toggle tests with both active and empty live evidence on release.

### `GUARD-05`: LLM Verification Timeout Fail-Safe
- **Category**: `GUARD` (`FailClosedGuardrail`)
- **Description**: Entering `occupied_verifying` arms a bounded `verify_timeout`; if the Vision/LLM call fails, times out, or raises an exception, the room transitions cleanly to `vacant`.
- **Verification**: Fault-injection test simulating stalled/errored LLM verification.

### `PIR-01` & `PIR-02`: PIR False-Positive Validation *(Phase 2 — Post-Migration)*
- **Category**: `PIR` (`FailClosedGuardrail` / `PositiveFeature`)
- **Description**: To be detailed and implemented immediately after the `transitions` migration: introduce a `candidate` pre-occupancy state where uncorroborated PIR triggers wait for camera confirmation, time-history corroboration, or adjacent-room trajectory before setting `is_present=True`.
- **Verification**: Dedicated `tests/test_pir_validation.py` suite in Phase 2.

### `ENTITY-01`: Presence Binary Sensor & Attributes Contract
- **Category**: `ENTITY` (`PositiveFeature`)
- **Description**: Expose `binary_sensor.<room>_presence` (`is_on` when in `occupied.*` or `override`) with clean automation attributes: `occupancy_state`, `is_cooling_down`, `cooling_remaining_sec`, `state_reason`, `verified_by`, `transition_history`, plus spatial/causal attributes (`human_present`, `pet_present`, `occupant_type`, `inferred_subregion`, `manual_intent`, `manual_off_suppressed`).
- **Verification**: Entity state and attribute contract tests in `tests/test_presence_designer_entities.py`.

### `REPLAY-01`: Deterministic Replay & Scenario Simulation
- **Category**: `REPLAY` (`PositiveFeature`)
- **Description**: Drive historical and synthetic timelines through `RoomPresenceStateMachine` using deterministic virtual clock steps, verifying parity with live execution.
- **Verification**: Replay engine unit and scenario tests in `tests/test_replay_and_statistics.py`.

### `NOTIFY-01`: Slack Transition Driver Attribution
- **Category**: `NOTIFY` (`PositiveFeature`)
- **Description**: Emit Slack transition alerts using the `transitions` audit record (`trigger`, `source -> dest`, `reason`, and active spatial/sensor evidence).
- **Verification**: Notification dispatcher tests in `tests/test_presence_designer_coordinator_notifications.py`.

### `UI-01` & `UI-02`: Live State Diagram & Reworked Automations UI
- **Category**: `UI` (`PositiveFeature`)
- **Description**: Expose `/api/presence_detection_designer/...` state-graph and transition-history endpoints and render a live Mermaid state diagram + fired-transition log in `panel.js`, alongside updated automation templates/UI consuming the new entity attributes.
- **Verification**: View API serialization tests in `tests/test_views.py` and UI layout/E2E verification.
