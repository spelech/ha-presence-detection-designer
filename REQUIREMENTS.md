# Software Requirements Specification: Presence Detection Designer

This specification defines the functional requirements, category taxonomy, guardrails, and automated test traceability matrix for the **Presence Detection Designer (`ha-presence-detection-designer`)** state-machine rework.

> **Architectural Scope & Breaking Redesign Decisions**
> - **Wasp-in-a-Box Retired:** Door-bounded indefinite latching (`OCCUPIED_SEALED`, `Mode.BOUNDED` infinite holds) is removed entirely.
> - **No Backwards Compatibility:** Legacy `BoxState` strings, attributes, and old WIB test assumptions are abandoned in favor of a clean `transitions` state machine contract.
> - **Floorplan & Spatial Engine Preserved:** Existing 2D floorplan geometry, doorway occlusion, camera raycasting, and spatial classification remain the evidence foundation.
> - **Pets Excluded from Occupancy:** Pet-only detections (`pet_present=True`, `human_present=False`) must not mark a room occupied.
> - **Headcount Decoupled:** Whole-house headcount and conservation-law stomping are decoupled from room state machines and deferred to a separate specification.
> - **Phased Rollout:** Phase 1 locks down the `transitions` engine, guardrails, entities, and UI observability; Phase 2 adds PIR false-positive validation (`PIR-01`..`PIR-03`) on top of the `transitions` engine.

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
| **`STATE-07`** | `STATE` | `PositiveFeature` | **Clock-Anchored Timer & Scheduler Parity** | Explicit `now_ts` calls anchor to `time.time()` so subsequent `timer_scheduler` callbacks (`_on_fire`) and 1s ticks observe elapsed clock time instead of stale `_virtual_now`. | `tests/test_transitions_state_machine.py::test_clock_anchored_scheduler_prevents_stale_virtual_now` |
| **`GUARD-01`** | `GUARD` | `FailClosedGuardrail` | **Bounded Liveness (No Stuck Occupied Rooms)** | Every `occupied` sub-state has a finite timeout path toward `vacant` (`holding` -> `cooling` on `max_hold_timeout`, `cooling` -> `vacant`/`verifying`, `verifying` -> `vacant` on `verify_timeout`). | `tests/test_transitions_guardrails.py::test_bounded_liveness_prevents_stuck_occupied` |
| **`GUARD-02`** | `GUARD` | `FailClosedGuardrail` | **Pet-Only Detections Never Mark Occupied** | When evidence indicates only a pet (`pet_present=True`, `human_present=False`), `RoomEvidenceSnapshot` does not activate human occupancy and `is_present` stays `False`. | `tests/test_transitions_guardrails.py::test_pet_only_never_marks_occupied` |
| **`GUARD-03`** | `GUARD` | `FailClosedGuardrail` | **Headcount Decoupled from Room Occupancy** | Whole-house headcount changes (including `count == 0`) never `force_clear` or block room occupancy state machines. | `tests/test_transitions_guardrails.py::test_zero_headcount_does_not_clear_occupied_room` |
| **`GUARD-04`** | `GUARD` | `FailClosedGuardrail` | **Manual Override Isolation & Recovery** | Enabling override forces `override` (`is_present=True`) and ignores sensor events; clearing override re-evaluates the live `RoomEvidenceSnapshot` immediately. | `tests/test_transitions_guardrails.py::test_override_isolation_and_live_recovery` |
| **`GUARD-05`** | `GUARD` | `FailClosedGuardrail` | **LLM Verification Timeout Fail-Safe** | If Vision/LLM verification hangs, errors, or returns malformed data while in `occupied_verifying`, `verify_timeout` fails closed toward `vacant` instead of wedging. | `tests/test_transitions_guardrails.py::test_llm_verify_timeout_fails_to_vacant` |
| **`GUARD-06`** | `GUARD` | `FailClosedGuardrail` | **Sustaining Actuator Boundary** | Actuators outside `trigger_entities` (e.g., `sustaining_conditions` like TVs/switches) never enter `_active_triggers`, discard cleanly on `off`, and never inject manual-entry Bayesian pulses. | `tests/test_transitions_guardrails.py::test_sustaining_actuator_never_latches_triggers_or_injects_manual_entry` |
| **`GUARD-07`** | `GUARD` | `FailClosedGuardrail` | **Hold-Only Spatial Normalization** | `negative_space` / `blind_pocket` spatial holds with no direct `positive_drivers` normalize to `spatial_blind_pocket_hold=True` and `human_present=False`, entering `occupied_holding` with bounded `max_hold_timeout`. | `tests/test_transitions_guardrails.py::test_hold_only_spatial_estimate_maps_to_occupied_holding` |
| **`PIR-01`** | `PIR` | `FailClosedGuardrail` | **Separate `transitions` PIR Validation Gate** | Uncorroborated PIR/slow-sensor triggers enter `PIRValidationStateMachine` `candidate` (`10s` window, `is_present=False`) and expire to `suppressed`/`idle` without falsifying occupancy. | `tests/test_pir_validation.py` |
| **`PIR-02`** | `PIR` | `PositiveFeature` | **Pluggable Any-One-Of PIR Corroboration** | A `candidate` or `suppressed` PIR promotes to `confirmed` (driving `occupied_confirmed`) when ANY ONE of `camera`, `trajectory`, `ble`, or `time_history` corroborates presence. | `tests/test_pir_validation.py` |
| **`PIR-03`** | `PIR` | `PositiveFeature` | **Cooldown-Based Sensor Reliability Weighting** | Slow PIR/occupancy sensors (Ecobee 300s/1800s, battery camera PIR `family_room_ring_motion`) are monotonically downweighted by `weight_from_cooldown(cooldown_sec)` via Bayesian log-odds tempering so they cannot solo-trigger occupancy. | `tests/test_pir_validation.py` |
| **`SIGNAL-01`** | `SIGNAL` | `FailClosedGuardrail` | **Person-Coupled Trigger Gate** | Non-human-exclusive signals (UPS power, left-on lights/switches/fans, media players, humidity derivative `dhumidity`, static contacts) cannot trigger `vacant -> occupied` solo or combined; entry requires Vision, validated PIR, BLE proximity. | `tests/test_signal_exclusivity.py` |
| **`SIGNAL-02`** | `SIGNAL` | `PositiveFeature` | **Non-Exclusive Signal Classification & Demotion** | `sensor_reliability.py` classifies machine/device/environmental signals (`is_human_exclusive=False`, `reliability_weight=0.35`), removes UPS spatial location pinning, demotes stored/compiled Bayesian weights idempotently, and exposes `human_exclusive` in `/state_graph`. | `tests/test_signal_exclusivity.py` |
| **`SIGNAL-03`** | `SIGNAL` | `FailClosedGuardrail` | **Contradictory Resident BLE Guard on Machine Power Holds** | When a machine power condition (e.g., `sensor.office_ups_used_watts_filtered > 140`) holds `occupied_holding` while primary triggers are clear and a primary resident BLE tracker places Steve in a different room or `Away`, the UPS hold is suppressed so remote-control CPU load drops cleanly to `occupied_cooling -> vacant`. | `tests/test_signal_exclusivity.py` & `tests/test_e2e_harness.py` |
| **`ENTITY-01`** | `ENTITY` | `PositiveFeature` | **Presence Binary Sensor & Attributes Contract** | `binary_sensor.<room>_presence` reports `is_on` (`occupied.*` or `override`) and exposes `occupancy_state`, `state_reason`, `cooling_remaining_sec`, `verified_by`, `transition_history`, and spatial/causal attributes. | `tests/test_presence_designer_entities.py` |
| **`REPLAY-01`** | `REPLAY` | `PositiveFeature` | **Deterministic Replay & Scenario Simulation** | Replaying historical or synthetic sensor timelines through the `transitions` engine produces deterministic state durations and transition counts. | `tests/test_replay_and_statistics.py` |
| **`REPLAY-02`** | `REPLAY` | `PositiveFeature` | **E2E Multi-Room Scenario & HA Playback Harness** | Declarative scenarios, disturbance injections (`unavailable`/`unknown`), and HA Recorder / `.storage` timelines execute real multi-room coordinators with a 6-part diagnostic envelope. | `tests/test_e2e_harness.py` |
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

### `STATE-07`: Clock-Anchored Timer & Scheduler Parity
- **Category**: `STATE` (`PositiveFeature`)
- **Description**: Whenever `apply_evidence()` or `advance_time()` receives an explicit `now_ts`, `RoomPresenceStateMachine._now()` must anchor that timestamp to `_virtual_wall_base = time.time()`. Subsequent `timer_scheduler` callbacks (`_on_fire()`) and periodic coordinator ticks advance by `max(0.0, time.time() - _virtual_wall_base)` so a live `verify_timeout` or cooling deadline cannot prematurely expire against a stale cached `_virtual_now`.
- **Verification**: Unit regression test in `tests/test_transitions_state_machine.py::test_clock_anchored_scheduler_prevents_stale_virtual_now` and E2E scenario execution in `tests/test_e2e_harness.py`.

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

### `GUARD-06`: Sustaining Actuator Boundary (No Trigger Latching or Manual Entry Pulse)
- **Category**: `GUARD` (`FailClosedGuardrail`)
- **Description**: Monitored room actuators not listed in `trigger_entities` (including entities in `sustaining_conditions` such as `media_player.*` or `switch.*`) must never be added to `coord._active_triggers`, must cleanly discard on `off`, and must be excluded from `__manual_actuation_context__` entry pulses in `evaluate_coordinator_bayesian`. Sustaining conditions hold occupancy only via `occupied_holding` (bounded by `GUARD-01`) and transition cleanly to `occupied_cooling` when turned off.
- **Verification**: Full-coordinator regression test in `tests/test_transitions_guardrails.py::test_sustaining_actuator_never_latches_triggers_or_injects_manual_entry`.

### `GUARD-07`: Hold-Only Spatial Normalization (`negative_space` / `blind_pocket` -> `occupied_holding`)
- **Category**: `GUARD` (`FailClosedGuardrail`)
- **Description**: When spatial inference classifies a room via `negative_space`, `blind_pocket`, or `should_hold_occupied=True` without direct `positive_drivers`, `build_coordinator_evidence_snapshot()` must normalize `human_present=False` and `spatial_blind_pocket_hold=True`. This keeps the room in `occupied_holding` (subject to `max_hold_timeout`) instead of latching `occupied_confirmed` indefinitely.
- **Verification**: Snapshot-normalization and bounded-hold regression test in `tests/test_transitions_guardrails.py::test_hold_only_spatial_estimate_maps_to_occupied_holding`.

### `PIR-01`: Separate `transitions` PIR Validation Gate (`10s` Candidate Window)
- **Category**: `PIR` (`FailClosedGuardrail`)
- **Description**: Every room instantiates a dedicated `PIRValidationStateMachine` (`transitions.extensions.GraphMachine`: `idle -> candidate -> confirmed | suppressed -> idle`) in front of `RoomPresenceStateMachine` when `pir_validation_enabled=True` (default). Uncorroborated PIR or slow-sensor triggers remain `candidate` for `10s` (`is_present=False`) and expire to `suppressed` (if still latched `on`) or `idle` (if cleared) without falsely marking a vacant room occupied.
- **Verification**: `tests/test_pir_validation.py` and `tests/test_e2e_harness.py`.

### `PIR-02`: Pluggable Any-One-Of PIR Corroboration Promotion
- **Category**: `PIR` (`PositiveFeature`)
- **Description**: While in `candidate` (or `suppressed` with active PIR), ANY ONE of four pluggable corroboration paths immediately promotes the PIR gate to `confirmed` and drives `occupied_confirmed`: (1) `camera` (Frigate person/subzone confirmation), (2) `trajectory` (adjacent room occupied/recently cleared, corroborated multi-hop path, or recent connected perimeter door transit), (3) `ble` (Bermuda BLE area matching this room or an adjacent room), or (4) `time_history` (>=2 distinct room sensors active or >=2 fast-PIR pulses within `60s`).
- **Verification**: `tests/test_pir_validation.py`.

### `PIR-03`: Cooldown-Based Sensor Reliability Weighting & Hardware Re-Inventory
- **Category**: `PIR` (`PositiveFeature`)
- **Description**: Apply continuous cooldown reliability weighting `weight_from_cooldown(cooldown_sec, battery_powered=...)` via log-odds tempering to slow Ecobee entities (`*_motion` ~300s, `*_occupancy` ~1800s across all 7 Ecobee devices) and battery camera PIR (`binary_sensor.family_room_ring_motion`) so slow/unreliable sensors cannot solo-trigger occupancy. Maintain accurate physical placement for the 3 Ring keypads (`binary_sensor.garage_keypad_motion` moved from Laundry Room to Garage, `binary_sensor.keypad_motion`, `binary_sensor.upper_level_keypad_motion`) and 3 placed Wyze sensors (`basement_stairs_top_motion`, `basement_stairs_bottom_motion`, `upstairs_stairs_bottom_motion`).
- **Verification**: `tests/test_pir_validation.py`.

### `SIGNAL-01`: Person-Coupled Trigger Gate
- **Category**: `SIGNAL` (`FailClosedGuardrail`)
- **Description**: Transitioning a `vacant` room to `occupied_confirmed` requires at least one active person-coupled initiator passing `is_human_exclusive_initiator(...)`: **Vision/Camera** (`camera.*`, Frigate person/subzone), **Validated PIR** (passed `PIRValidationStateMachine`), **BLE proximity** (`sensor.*_ble_area`, `device_tracker.*`), or `__spatial_negative_space__`. Machine/environmental/device signals (UPS power, left-on `light.*`/`switch.*`/`fan.*`, `media_player.*`, `binary_sensor.basement_media_playing`, `sensor.*_dhumidity`) cannot initiate occupancy from `vacant`, even when multiple non-exclusive signals fire simultaneously.
- **Verification**: `tests/test_signal_exclusivity.py`.

### `SIGNAL-02`: Non-Exclusive Signal Classification, De-Pinning & Bayesian Demotion
- **Category**: `SIGNAL` (`PositiveFeature`)
- **Description**: `sensor_reliability.py` sets `is_human_exclusive=False` and `reliability_weight=0.35` for `power_monitor`, `media_player`, `actuator`, `environmental`, `contact_static`, and generic `sensor.*` entities. `spatial_inference.py` does not pin `steve_pinned_rooms` from `sensor.office_ups_used_watts_filtered`. Store migration (`store_migrations.py`) and topology compilation (`topology_rule_applier.py`) idempotently temper non-human-exclusive `bayesian_observations` to `supporting`, and `PDDStateGraphView` + `panel.js` surface `human_exclusive` (`Person` vs `Supporting`) per sensor.
- **Verification**: `tests/test_signal_exclusivity.py`.

### `SIGNAL-03`: Contradictory Resident BLE Guard on Machine Power Holds
- **Category**: `SIGNAL` (`FailClosedGuardrail`)
- **Description**: While a room is already occupied (`occupied_confirmed`/`occupied_holding`), machine power thresholds (e.g., `sensor.office_ups_used_watts_filtered > 140`) may corroborate hold evidence only while no primary resident BLE tracker contradicts the room. If active triggers are clear and a primary resident BLE tracker reports a known room other than the room or `Away`, `is_condition_contradicted_by_ble()` suppresses the power hold condition and transitions the room to `occupied_cooling -> vacant` (preventing remote-control CPU workloads from holding `Office` occupied indefinitely).
- **Verification**: `tests/test_signal_exclusivity.py` and `tests/test_e2e_harness.py`.
### `BAYES-01`: Bayesians Never Start Occupancy (Score & Corroborated Hold Only)
- **Category**: `BAYESIAN` (`FailClosedGuardrail`)
- **Description**: `bayesian_occupied` alone never transitions a `vacant` room to `occupied_confirmed`. Entry from `vacant` requires direct human-coupled evidence (`active_triggers`, `camera_confirmed`, `human_present`) or manual override. Once occupied, `bayesian_occupied` contributes confidence scoring and bounded hold/corroboration (`has_hold_evidence -> occupied_holding`), never triggering adjacent handoffs while `vacant`.
- **Verification**: `tests/test_bayesian_requirements.py` and `tests/test_e2e_harness.py`.

### `BAYES-02`: Explicit-Only Bayesian Observations (No Silent Clutter Injection)
- **Category**: `BAYESIAN` (`PositiveFeature`)
- **Description**: When a room configures explicit `bayesian_observations`, `build_effective_observations()` evaluates only those explicit deduplicated entries without silently appending excluded `trigger_entities` or `sustaining_conditions`. Empty bootstrap configs include only human-exclusive triggers and demoted `supporting` sustaining signals.
- **Verification**: `tests/test_bayesian_requirements.py`.

### `BAYES-03`: Single-Pass Cooldown/Signal Tempering & Supporting Floor Repair
- **Category**: `BAYESIAN` (`PositiveFeature`)
- **Description**: Persisted tempered observations record `cooldown_weighted` / `signal_weighted` markers so `resolve_observation_weights()` never double-tempers `cooldown_sec` entities at runtime. `_PRESET_BASE_WEIGHTS["supporting"]` and topology/migration helpers align on `(0.55, 0.20)`, repair legacy inverted `< 0.50` supporting floors, and drop zero-lift (`pt == pf`) dead entries idempotently.
- **Verification**: `tests/test_bayesian_requirements.py`.

### `BAYES-04`: Asymmetric Negative Evidence (Confirmed BLE Contradiction Only; Camera & PIR Off Neutral)
- **Category**: `BAYESIAN` (`FailClosedGuardrail`)
- **Description**: Camera whole-frame/zone `off` and PIR `off` observations remain strictly neutral (`penalize_when_off=False`, `LR=1.0`). A `ble_tracker` observation pointing elsewhere applies negative evidence `(1-pt)/(1-pf)` only when Guest Mode is disabled, no other resident BLE tracker reports this room, and the destination room has confirmed non-BLE physical human corroboration (preventing cross-floor BLE bleed jumps from falsely penalizing rooms).
- **Verification**: `tests/test_bayesian_requirements.py` and `tests/test_e2e_harness.py`.

### `ENTITY-01`: Presence Binary Sensor & Attributes Contract
- **Category**: `ENTITY` (`PositiveFeature`)
- **Description**: Expose `binary_sensor.<room>_presence` (`is_on` when in `occupied.*` or `override`) with clean automation attributes: `occupancy_state`, `is_cooling_down`, `cooling_remaining_sec`, `state_reason`, `verified_by`, `transition_history`, plus spatial/causal attributes (`human_present`, `pet_present`, `occupant_type`, `inferred_subregion`, `manual_intent`, `manual_off_suppressed`).
- **Verification**: Entity state and attribute contract tests in `tests/test_presence_designer_entities.py`.

### `REPLAY-01`: Deterministic Replay & Scenario Simulation
- **Category**: `REPLAY` (`PositiveFeature`)
- **Description**: Drive historical and synthetic timelines through `RoomPresenceStateMachine` using deterministic virtual clock steps, verifying parity with live execution.
- **Verification**: Replay engine unit and scenario tests in `tests/test_replay_and_statistics.py`.

### `REPLAY-02`: E2E Multi-Room Scenario & HA Recorder Playback Harness
- **Category**: `REPLAY` (`PositiveFeature`)
- **Description**: Provide a zero-sleep deterministic `VirtualHAHarness`, declarative JSON/YAML `scenario_runner`, HA Recorder SQLite / History JSON / PDD `.storage` playback loader (`ha_playback`), CLI runner (`scripts/replay_scenario.py`), and 6-part `ScenarioAssertionError` diagnostic envelope executing real multi-room coordinators and entity classes end-to-end.
- **Verification**: Full E2E scenario, disturbance injection (`unavailable`/`unknown`), parameter sweep, and SQLite/JSON playback tests in `tests/test_e2e_harness.py`.

### `NOTIFY-01`: Slack Transition Driver Attribution
- **Category**: `NOTIFY` (`PositiveFeature`)
- **Description**: Emit Slack transition alerts using the `transitions` audit record (`trigger`, `source -> dest`, `reason`, and active spatial/sensor evidence).
- **Verification**: Notification dispatcher tests in `tests/test_presence_designer_coordinator_notifications.py`.

### `UI-01` & `UI-02`: Live State Diagram & Reworked Automations UI
- **Category**: `UI` (`PositiveFeature`)
- **Description**: Expose `/api/presence_detection_designer/...` state-graph and transition-history endpoints and render a live Mermaid state diagram + fired-transition log in `panel.js`, alongside updated automation templates/UI consuming the new entity attributes.
- **Verification**: View API serialization tests in `tests/test_views.py` and UI layout/E2E verification.
