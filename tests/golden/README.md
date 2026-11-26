# PDD Golden Layered Dataset & Fuzzer Suite

Deterministic, geometry-backed ground-truth scenarios for validating room detection, handoffs, BLE supporting-only behavior, pet exclusion, and ambient-lighting readiness—without ML.

## 4-Layer Architecture

1. **Layer 0 — Ground-Truth Trajectories (`ActorTrack` / `ActorWaypoint`):**
   Piecewise-linear actor paths (`steve`, `margot`, `guest`, `riley_dog`) across floors, rooms, and activities (`walking`, `sitting_still`, `sleeping`, `showering`, `desk_work`, `away`). Produces exact 1Hz `expected_occupied_rooms(t)` (pet-only = vacant).
2. **Layer 1 — Geometric Raycast Projection (`signal_layers.py`):**
   Projects each actor's `(x, y)` against the real placed floorplan cameras, Frigate sub-zones, fast PIRs (SONOFF, VALLHORN, Wyze, Ring), Ecobee sensors, door contacts, and calibrated 16-proxy BLE anchors with wall-segment occlusion.
3. **Layer 2 — Hardware Timing & Physics (`HardwareTimingProfile`):**
   Applies real cooldowns (fast PIR `15s`, Ecobee motion `300s`, Ecobee occupancy tail `1800s`), Bermuda's `10s` update cadence, camera stillness dropouts (`25s`), and door contact pulses (`5s`).
4. **Layer 3 — Seeded Fuzzing (`FuzzProfile`):**
   Injects repeatable perturbations per seed:
   - `ble_adjacent_bounce_prob` / `ble_vertical_bleed_prob` / `ble_unknown_dropout_prob`
   - `pir_false_spike_prob` / `camera_frame_drop_prob`
   - `shade_flicker_events` (moving shades + false camera flicker)
   - `remote_ups_watts_windows` (remote workstation load after leaving Office)
   - `event_jitter_max_sec` (event arrival jitter)

## Logical Zone Continuity (`ZONE_GROUPS`)

- **Basement** (`Basement Theater` ∪ `Basement Play Area`): Tracks each room specifically (`nfc_basement` in Theater; `basement_speaker` & `basement_fridge` in Play Area) while verifying the whole Basement zone stays occupied with no dark gap across Theater ↔ Play Area handoffs.
- **Master Suite** (`Master Bedroom` ∪ `Master Bathroom`)
- **Main Floor Open Plan** (`Family Room` ∪ `Kitchen` ∪ `Dining Room` ∪ `Living Room` ∪ `Front Entry`)

## Canonical Scenarios (16)

### Targeted Edge Cases (1–12)

| # | Scenario | Focus / Edge Case | Key Ground-Truth Expectations |
|---|---|---|---|
| 1 | `open_plan_passthrough_front_to_family` | Front Entry → Kitchen → Family Room couch + TV | Fast entry (`<=3s`), 0s FP in Living/Dining, 0 flaps |
| 2 | `living_dining_archway_spillover` | North Living Room near Dining Room PIR (20.3% spillover) | Dining Room & Kitchen stay `0s` FP, 0 flaps |
| 3 | `riley_dog_patrol_main_floor` | Riley patrols all 4 main-floor rooms | `0s` total FP across entire house (`GUARD-02`) |
| 4 | `office_desk_stillness_and_remote_ups_leave` | Desk stillness hold → leave while UPS stays 220W | Holds while BLE=Office; clears when BLE→Master Bedroom (`SIGNAL-03`) |
| 5 | `ble_vertical_floor_bleed_no_false_trigger` | Master Bedroom sleep with 25–40% vertical BLE bleed | `0s` FP in all vacant rooms below (BLE supporting-only) |
| 6 | `master_bedroom_to_master_bath_shower` | Shower blind pocket + `dhumidity > 0.3` hold | Master Suite dark gap `<=5s`, 0 flaps |
| 7 | `basement_theater_play_area_handoff_and_zone` | Stairs → Play Area/Bar → Theater (`nfc_basement` + TV) → Play Area | Whole Basement dark gap `<=3s`, Storage Room `0s` FP, 0 flaps |
| 8 | `upstairs_hallway_to_guest_room_and_margot` | Upstairs pass-by Guest Room (12.5% VALLHORN spillover) → Margot's Room | Guest Room & Office `0s` FP, 0 flaps |
| 9 | `multi_occupant_steve_and_margot_split_rooms` | Steve in Office (BLE) + Margot in Family Room (no BLE, TV) | Both stay occupied (`<=10s` total FN), 0 flaps |
| 10 | `garage_entry_laundry_handoff` | Garage → Laundry Room (door + Ring PIR) → Family Room | Entry `<=3s`, clean handoffs, 0 flaps |
| 11 | `sunlit_shade_movement_false_camera_flicker` | Shade motion + false Frigate flicker in empty Living Room | Living Room `0s` FP, 0 flaps |
| 12 | `storage_room_doorway_bleed_from_play_area` | Walk past open Storage Room door from Play Area | Storage Room `0s` FP, 0 flaps |

### Everyday Multi-Room Routines (13–16)

| # | Scenario | Everyday Flow | Key Ground-Truth Expectations |
|---|---|---|---|
| 13 | `morning_routine_wake_to_work_departure` | Wake → Master Bath → Kitchen back door (Riley out) → Shower → Dress → Office → Coffee → Riley in → Dining Room lunch → Laundry → Garage → Away | Clean 3-floor handoffs, shower hold stays on, house clears cleanly to vacant after departure, 0 flaps |
| 14 | `evening_return_home_with_margot_and_riley` | Return via Garage → Laundry → split (Margot to Family Room TV, Steve to Kitchen back door → Master Bedroom to change → rejoins Family Room) | Margot's Family Room stays continuously occupied while Steve's BLE is upstairs, 0s FP in Living/Dining/Office |
| 15 | `bedtime_margot_room_kitchen_snack_runs` | Margot in bed; Steve makes 2 round trips Margot's Room ↔ Hallway ↔ Front Entry ↔ Kitchen (snacks, then drinks) | `<=3s` entry latency on transit/Kitchen each trip, Margot's Room stays occupied, 0s FP in Guest/Office/Living/Dining |
| 16 | `office_to_storage_room_direct_route` | Office → Upstairs Hallway → Front Entry → Basement Play Area → Storage Room (~90s) → direct return to Office | Clean 3-floor transit, Storage Room occupies & vacates cleanly, 0s FP in Basement Theater/Living/Dining |

## Scorecard Metrics (`scorecard.py`)

- **Entry latency** (`max_entry_latency_sec`): Seconds from ground-truth room entry to PDD `is_present=True`.
- **False-positive time** (`false_positive_sec`): Occupied seconds outside ground truth (after a 20s exit cooling grace).
- **False-negative / premature-vacant time** (`false_negative_sec`): Ground-truth occupied seconds where PDD dropped to `vacant`.
- **Flapping count** (`flap_count`): Rapid `<=30s` `occupied ↔ vacant` oscillations.
- **Zone dark gap** (`dark_gap_sec`): Seconds where a multi-room zone (e.g., whole Basement) drops dark while occupied.
