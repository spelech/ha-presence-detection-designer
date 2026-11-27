# Replay Simulator & Statistics

PDD includes two analytics views for tuning parameters safely and monitoring long-term sensor health.

---

## 1. Replay & Tuning Simulator

Test "what-if" configuration changes against your real recorded Home Assistant history **before** touching live automations:

- **Side-by-Side Comparison:** Compare your current live configuration (**Baseline**) against a modified **Candidate** configuration (different thresholds, timeouts, negative-space toggle, or sustaining rules).
- **Negative-Space A/B Toggle:** Quickly compare how enabling or disabling clear-camera negative space affects false holds vs. premature drops on real past events.

- **Delta Metrics:** Review total occupied minutes, flap count, and transition diffs before applying any change live.

---

## 2. Statistics & Timeline Analytics

Monitor each room's historical occupancy patterns and sensor performance:

- **Occupancy Breakdown:** Daily/weekly occupied time per room and transition counts.
- **Sensor Trigger Attribution:** See which sensors most frequently initiate vs. sustain occupancy — helpful for spotting noisy PIRs, dead batteries, or camera zones that need masking.
