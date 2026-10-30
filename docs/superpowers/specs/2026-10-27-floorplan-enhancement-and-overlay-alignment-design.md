# Floorplan Image Enhancement, Stepped Room Topology, Raycast Wall Occlusion & Device Model Presets

**Date:** 2026-10-27
**Component:** `ha-presence-detection-designer` (`custom_components/presence_detection_designer`)

---

## 1. Problem Statement & Root Causes

When reviewing the initial 2D Floorplan Designer in Presence Detection Designer, several visual and geometric defects were identified:

1. **Low-Resolution & Uncropped Floorplan Underlays:**
   - The original `.webp` floorplan crops (`floor_upstairs.webp` `320×230`, `floor_main.webp` `390×380`, `floor_basement.webp` `250×225`) suffered from WebP compression ringing, washed-out gray backgrounds, and included outdoor patio margins on the Main Floor that compressed the indoor rooms vertically.
2. **Missing Underlay Definition & Opaque Room Fills (`panel.js`):**
   - `PDD_FLOOR_UNDERLAYS` had been omitted from the top of `panel.js`, preventing `<image id="fp-blueprint-underlay">` from rendering.
   - `.fp-room-rect` used opaque fills (`#ffffff`, `#f0fdf4`, `#fffbeb`, `#f8fafc`) painted *on top* of `underlaySvg`, completely obscuring the Matterport architectural walls, doorways, closets, and dimension labels.
3. **Room & Closet Misattributions:**
   - **Upper Level:** `Upstairs Bathroom` (`7'8" × 4'11"`, opening North to the Hallway) and `Master Bathroom` (`6'5" × 7'7"`, opening West to the Master Bedroom vestibule) are vertically stacked (`Y=316..449` and `Y=417..548`) rather than side-by-side; `Master W.I.C` (`6'3" × 7'0"`, `X=353..462, Y=355..484`) needed to be a standalone room separated from the bathrooms; the hallway reach-in closet (`Y=316..355`) opens North into `Upstairs Hallway & Stairs`; and the vertical closet column (`X=563..610, Y=32..254`) between `Margot's Room` and `Guest Room` is split at `Y=143` (top closet opens East into `Guest Room`, bottom closet opens West into `Margot's Room`).
   - **Main Floor:** Missing `Powder Bath` (`4'3" × 4'11"`) and `Laundry Room` (`11'3" × 8'5"`), plus an erroneous doorway gap in the solid green South wall (`Y=290, X=534..832`) between `Family Room` and `Laundry Room` (whose actual door is on the West wall `X=534`).
   - **Basement:** `Basement Theater` (West side, `X=93..360`) and `Basement Play Area` (East side with Wet Bar, `X=360..695`) were reversed left-to-right, and `Storage Room` (`X=695..915, Y=42..360`) is to the East of the basement hallway.
4. **Camera Corner Positions, Uniform Tapo C110 FOV & Wall-Clipped Sightlines:**
   - All 10 cameras are **TP-Link Tapo C110** wide-angle cameras (`110°` horizontal FOV in standard corner/wall mounts, or `164°` projected 2D floor azimuth when mounted high on the North Garage wall pointing steeply down).
   - Several cameras were placed in the wrong room corners or had narrow `55°–85°` cones that failed to touch both walls emerging from their mounting corner or stopped short of the far walls.

---

## 2. Calibrated Architecture & Design

### 2.1 4× Enhanced Architectural Blueprint Assets
- **Pipeline:** Crop excess outdoor dead space -> build dilated ink mask (`img < 215` dilated with `5×5` ellipse) to zero out background WebP artifacts to pure white (`#ffffff`) while preserving anti-aliased text strokes -> 4× bicubic upscale -> unsharp mask (`σ=1.1`) -> contrast stretch -> lossless WebP export:
  - `static/floor_upstairs.webp` (`1252×876`, mapped to SVG `x=114, y=20, width=772, height=540`)
  - `static/floor_main.webp` (`1496×992`, mapped to SVG `x=60, y=30, width=784, height=520`)
  - `static/floor_basement.webp` (`984×824`, mapped to SVG `x=80, y=30, width=620, height=520`)

### 2.2 Translucent Stepped Room Polygons & Doorway-Occluded Wall Segments
- Rooms support both bounding boxes (`x, y, width, height`) for drag/resize handles and optional `svg_path` stepped polygons so L-shaped bedrooms, closets, and bathrooms trace the exact Matterport walls.
- Room fills in `panel.js` use translucent RGBA (`0.08–0.18` alpha) so the architectural drawing remains crisp underneath.
- `DEFAULT_HOUSE_FLOORPLAN["floor_wall_segments"]` stores the exact calibrated 2D wall segments (with doorway and closet openings) per floor, used by `extract_floor_wall_segments` and `compute_camera_visibility_polygon` whenever room boxes are at their calibrated coordinates.

### 2.3 Device Model Presets (`DEVICE_MODEL_PRESETS`)
- Standardize camera and sensor cone geometry via reusable hardware model presets (`DEVICE_MODEL_PRESETS` in `spatial_topology.py` and `PDD_DEVICE_MODEL_PRESETS` in `panel.js`):
  - `tapo_c110_corner`: TP-Link Tapo C110 (Corner / Wall Mount) — `fov_deg: 110`, `default_range_px: 540`
  - `tapo_c110_overhead`: TP-Link Tapo C110 (High Wall Steep Downward Pitch) — `fov_deg: 164`, `default_range_px: 250`
  - `reolink_rlc_810a`: Reolink PoE Bullet — `fov_deg: 87`, `default_range_px: 500`
  - `unifi_g4_instant`: UniFi Protect G4/G5 Instant — `fov_deg: 102`, `default_range_px: 450`
  - `ecobee_smart_sensor`: Ecobee SmartSensor PIR — `fov_deg: 110`, `default_range_px: 230`
  - `ring_alarm_pir_gen2`: Ring Alarm Motion Detector Gen 2 — `fov_deg: 90`, `default_range_px: 260`
  - `ring_keypad_pir`: Ring Alarm Keypad PIR — `fov_deg: 100`, `default_range_px: 165`
  - `aqara_fp2_mmwave`: Aqara FP2 60GHz mmWave Radar — `fov_deg: 120`, `default_range_px: 340`
  - `apollo_msr_2`: Apollo MSR-2 mmWave Radar — `fov_deg: 110`, `default_range_px: 300`
  - `ratgdo_pir`: ratgdo v2.5i Garage Opener PIR — `fov_deg: 100`, `default_range_px: 175`

---

## 3. Repeatable Calibration Process (Synthesized Workflow)

1. **Blueprint Normalization & Tight Indoor Cropping:** Upscale 4× with dilated-ink background whitening and crop outdoor patio/margin dead space so indoor walls fill a consistent `1000×580` SVG coordinate frame.
2. **Closet & Bathroom Door-Swing Attribution:** Attribute every reach-in or walk-in closet to the room its door arc swings into; separate en-suite vs. hallway bathrooms and walk-in closets into distinct room polygons.
3. **Wall-Segment & Doorway Aperture Extraction:** Encode interior walls as 2D line segments with open doorway intervals (and recessed closed-door leaves where a camera sees a closed door on an adjacent wall).
4. **Hardware Model Preset Selection:** Assign the camera/sensor's hardware model preset (e.g., `tapo_c110_corner` = `110°` FOV, or `tapo_c110_overhead` = `164°` projected floor FOV for steep downward pitch) so FOV is uniform across identical devices.
5. **Corner & Landmark Raycast Alignment:** Place each camera in its physical mounting corner, set `range_px` ≥ room diagonal so cones reach the far walls, and align `heading_deg` against 2–3 visible photo landmarks (e.g., adjacent wall posters/headboards, doorway jambs, countertops).
