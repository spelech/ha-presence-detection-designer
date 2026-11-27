# Whole-House Timeline Playback

The **Timeline Playback** view lets you scrub through historical Home Assistant Recorder data across **every floor and room simultaneously** — making it easy to audit why a room turned on, cleared, or flapped without waiting for real-world edge cases.

---

## Key Capabilities

1. **Multi-Floor Synchronized Playback:**
   - Pick any lookback window (e.g., last 1h, 6h, 24h) and play, pause, step frame-by-frame, or scrub directly to an exact timestamp.
   - Watch room occupancy states, camera sub-zones, PIR triggers, door contacts, and BLE/EKF tracks animate on the floorplan in sync.
2. **Cross-Floor Teleport Suppression (`v0.4.1+`):**
   - The timeline reconstructor filters impossible cross-floor BLE teleports (simultaneous multi-floor occupancy or `<10s` non-adjacent cross-floor jumps) so playback reflects true physical movement.
3. **Driver & Event Audit:**
   - Click any transition marker on the timeline to inspect which exact sensor (`cam:...`, `pir:...`, `sustain:...`, `ekf:...`) drove the state change.
   - Great for spotting stationary Frigate false positives (e.g., hampers or blankets) or verifying that hallway walk-bys stayed below `meets_lighting_threshold`.
