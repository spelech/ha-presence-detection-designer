# How It Works

Presence Detection Designer (`v0.4.2`) replaces brittle binary rules with a **3-layer spatial & statistical pipeline**. For full mathematical proofs and derivations, see [Architecture & Mathematical Reference](ARCHITECTURE_AND_MATH.md).

---

## Layer 1: 3D Floorplan Geometry & Physical Conditioning

Before any sensor vote reaches the occupancy engine, PDD conditions it using your floorplan's physical geometry:

1. **Wall-Clipped Raycast Spillover Matrix (`spatial_topology.py`):**
   - Each PIR sensor's field-of-view cone is raycast against your walls and doorways.
   - If a bedroom PIR's cone leaks 12% into the hallway (or a family room PIR leaks 81% into open-plan neighbors), PDD automatically computes that spillover fraction, attenuates PIR weight when adjacent rooms are active, and raises the room's `recommended_lighting_threshold_pct` (`61.4%` → `72%` → `80%`).
2. **Negative-Space Clear-Camera Decay:**
   - When a Frigate camera has high visual coverage of a room and reports **clear** (no person detected), PDD accelerates occupancy decay — unless a sustaining condition (TV/HDMI, UPS power, Ecobee + EKF) or bounded-room door seal is active.
3. **Pet & Moving-Shade Guards:**
   - Active dog detections suppress non-pet-immune PIRs in the same room (and open-plan neighbors when uncorroborated).
   - Motorized shade movements temporarily suppress uncorroborated camera false triggers during the settling window.

---

## Layer 2A: 2D + Floor Extended Kalman Filter (`ble_kalman_tracker.py`)

Standalone BLE integrations evaluate unconstrained spherical RSSI distances, which causes vertical floor-hopping in multi-story wood-frame homes. PDD's EKF models each tracked phone as a continuous 2D state `[x, y, vx, vy]` on a discrete `floor`:

- **Nonlinear Multi-Proxy BLE Updates:** Reads live per-proxy ranges directly from Bermuda's `runtime_data` and rejects multipath outliers with a 1-DOF Mahalanobis $\chi^2$ gate (`6.63`, 99% confidence).
- **Gated Camera & PIR Fusion:** Snaps the EKF track to Frigate camera sub-zone centroids and fresh PIR rising edges — gated by a 2-DOF Mahalanobis check so another occupant in another room never hijacks your phone's track.
- **Analytic Room Integrals:** Integrates the EKF's 2D Gaussian uncertainty ellipse over every room polygon on the active floor (`erf` integral) to produce smooth `0–100%` per-room EKF probabilities.
- **Floor Stability v2 (`ekf_floor_stability_v2`, default `True` in `v0.4.2`):**
  1. **Unbiased Floor Scoring:** Scores each floor by its closest proxy plus a `0.15×` secondary tiebreaker (preventing a 2-proxy floor from getting a free 2× count advantage over a 1-proxy floor).
  2. **No Bermuda Double-Counting:** Only applies the `bermuda_area_floor` fallback hint when live per-proxy BLE ranges are absent.
  3. **Incumbent-Floor Camera Corroboration:** If an active camera on your current floor sees an occupant within association range of your EKF track, it reinforces holding your current floor (`+2.5`), while still blocking unattributed other-floor cameras from pulling your track.

---

## Layer 2B: Coupled Continuous-Time Log-Odds HMM (`hmm_engine.py`)

Selected as the winner of our [4-Candidate Signal-Processing Benchmark](SIGNAL_PROCESSING_OPTIMIZATION_REPORT.md) (`325` configs, `15,840` simulated timelines), the **`HouseHMMEngine`** (`coupled_hmm`) evolves a continuous log-odds belief $L_r(t)$ for every room simultaneously:

- **Asymmetric Hysteresis Thresholds:** Enters occupancy at **`61.4%`** (`theta_enter_pct`) and clears at **`50.6%`** (`theta_clear_pct`), preventing chatter around a single boundary.
- **Evidence Sources:**
  - **Frigate Camera Sub-Zones:** Strong positive log-likelihood gain on detection + adjacency boost when a connected room was recently active.
  - **Fast PIRs:** Exponentially decaying latch weights, attenuated by the raycast spillover matrix and gated against pets.
  - **Door Contacts:** Entry boost to connected rooms on opening edges.
  - **EKF Room Probability:** Bounded supporting signal (`ekf_gain`) — can sustain or softly attenuate occupancy, and is damped when contradicting an active camera or sustaining condition.
  - **Sustaining Conditions:** Reduces hazard decay (`sustain_mult`) and clear-camera decay (`0.08×`) while active. Since `v0.4.2`, `media_player.*` `equals "playing"` conditions automatically accept `"on"` so LG webOS / HDMI displays sustain reliably.
  - **Cross-Room Handoff Drain:** When a connected neighboring room fires a fresh human trigger and the current room has no active camera/sustain, the HMM smoothly drains the vacated room's log-odds.

---

## Layer 3: Causal Intent, Confidence Tiers & Playback

- **Manual-Off Suppression (`causal_context.py`):** Monitors room lights/switches for physical switch presses or UI user actions (`user_id` present, non-automation context). When you turn off a room's lights while occupied, `manual_off_suppressed` flips to `true` until the room clears.
- **Confidence Tiers:** Every room reports `confidence_tier` (`vacant`, `low`, `ambiguous`, `occupied`, `high_confidence`), `spillover_exposure_pct`, `recommended_lighting_threshold_pct`, and `meets_lighting_threshold`.
- **Historical Playback (`timeline_reconstructor.py`):** Reconstructs whole-house timelines from HA Recorder history with cross-floor teleport suppression so you can audit and tune sensor behavior without waiting for real-world edge cases.
