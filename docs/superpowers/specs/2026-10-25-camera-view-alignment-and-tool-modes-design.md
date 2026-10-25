# Design Specification: Camera View Alignment & Canvas Tool Modes

**Date:** 2026-10-25  
**Status:** Approved  
**Target Repository:** `~/Repos/ha-presence-detection-designer`  
**Branch:** `feature/camera-view-alignment-and-tool-modes`

---

## 1. Overview & Problem Statement

Users configuring house presence detection in Home Assistant need to position rooms, doorways, and cameras accurately. Currently, interaction on the SVG floorplan canvas can feel cumbersome because clicking or dragging near wall boundaries can ambiguously grab camera handles, room resize handles, doorway markers, or room backgrounds.

Furthermore, cameras exist in physical 3D space with mounting height ($Z$) and downward tilt/pitch, whereas the floorplan is 2D ($X, Y$). Users need a reliable, automated way to verify that a camera's 2D sightline cone and heading actually line up with the physical openings (doorways, archways) visible in the camera's real video feed.

---

## 2. Core Features & Architecture

### 2.1 Explicit Tool Mode Switcher (Rooms vs. Cameras)

Add a segmented mode toggle to the floorplan canvas header:
* `[ 🏠 Edit Rooms & Doors ]` (`rooms` mode)
* `[ 📹 Edit Cameras & Cones ]` (`cameras` mode)

#### Mode Interaction Rules:
1. **Rooms Mode (`this._floorplanMode === 'rooms'`):**
   * **Interactive Elements:** Room rectangles (click/drag), 8 bounding-box resize handles, and doorway markers/tabs.
   * **Cameras & Cones:** Rendered with `pointer-events: none` as visual reference guides. Clicks near walls never accidentally move or alter cameras.
   * **Inspector:** Displays Room Box dimensions, coordinates, and Perimeter Doorways Manager.
2. **Cameras Mode (`this._floorplanMode === 'cameras'`):**
   * **Interactive Elements:** Camera origins, heading aim vector knobs, FOV arc knobs, and range tip handles.
   * **Rooms & Doors:** Room boxes and resize handles have `pointer-events: none` (or select-only if clicking the room interior without handles). Room boxes cannot be inadvertently resized or repositioned.
   * **Inspector:** Displays Camera Cone Geometry, Mounting Height ($Z$), Downward Pitch/Tilt, and the **Camera View & Physical Alignment** tool.

---

### 2.2 Computer Vision Camera View Alignment Engine (`camera_alignment_cv.py`)

A pure Python module utilizing standard image processing (PIL / NumPy / progressive edge & line analysis) that operates on snapshots fetched from Home Assistant camera entities:

1. **Snapshot Ingestion:**
   * Fetches the camera snapshot from `camera.<entity_id>` using Home Assistant's camera proxy.
2. **Line Segment & Architectural Edge Extraction:**
   * Converts the frame to grayscale and computes gradient magnitude.
   * Extracts horizontal/perspective lines (ceiling-wall intersections, baseboards) and vertical lines (door jambs, wall corners).
3. **Horizon & Downward Tilt (Pitch) Estimation:**
   * Calculates the primary vanishing point $VP = (x_{vp}, y_{vp})$ from converging perspective lines.
   * Determines the camera horizon line $y_{\text{horizon}}$.
   * Derives downward tilt angle:
     $$\theta_{\text{tilt}} = \arctan\left(\frac{y_{\text{horizon}} - H/2}{f_y}\right)$$
   * Derives leveling roll angle from vertical line tilt.
4. **Doorway & Opening Azimuth Detection:**
   * Locates vertical pairs corresponding to doorway openings.
   * Calculates horizontal angular bearing for each opening:
     $$\phi_{\text{detected}} = \arctan\left(\frac{x_{\text{center}} - W/2}{f_x}\right)$$
   * Projects 2D rays from the camera's position on the floorplan to known doorways in that room to find the expected bearing $\phi_{\text{expected}}$.
   * Calculates discrepancy: $\Delta\phi = \phi_{\text{detected}} - \phi_{\text{expected}}$.
   * Recommends optimal camera heading adjustment:
     $$\text{recommended\_heading} = (\text{current\_heading} + \Delta\phi) \pmod{360}$$
5. **Annotated Frame Generation:**
   * Generates a visual overlay containing:
     * Cyan line: Camera horizon / tilt level.
     * Amber bounding boxes: Detected doorways and archways.
     * Green ray guides: 2D floorplan predicted opening bearings.
   * Returns base64 or URL for direct rendering in the UI.

---

### 2.3 Backend API Endpoint (`views.py`)

* **Endpoint:** `POST /api/presence_detection_designer/camera/<camera_id>/align`
* **Request Body:**
  ```json
  {
    "floorplan": { ... },
    "camera_id": "camera.living_room",
    "camera_entity": "camera.living_room_ptz"
  }
  ```
* **Response Body:**
  ```json
  {
    "success": true,
    "camera_id": "camera.living_room",
    "tilt_deg": -24.5,
    "roll_deg": 0.3,
    "current_heading_deg": 18.0,
    "recommended_heading_deg": 22.5,
    "openings": [
      {
        "name": "Front Entry Archway",
        "detected_azimuth_deg": 22.5,
        "expected_azimuth_deg": 18.0,
        "discrepancy_deg": 4.5,
        "bbox": [120, 180, 240, 480]
      }
    ],
    "annotated_image": "data:image/jpeg;base64,..."
  }
  ```

---

### 2.4 Alignment Drawer UI in Frontend (`panel.js`)

1. **Toolbar Mode Switcher:**
   * Segmented button group: `[ 🏠 Rooms ] [ 📹 Cameras ]`.
   * Toggling mode re-renders canvas interactivity state cleanly without losing draft state.
2. **Camera Alignment Inspector Card:**
   * Appears in the inspector when in Cameras mode.
   * Includes button: `[ 🔍 Analyze Camera Alignment ]`.
   * Displays loading spinner during CV execution.
   * Displays annotated snapshot with horizon and opening guides.
   * Displays alignment metrics table (estimated pitch, detected vs expected bearing).
   * Button: `[ ⚡ Auto-Calibrate 2D Heading ]` which automatically updates `cam.heading_deg = result.recommended_heading_deg`, recompiles topology, and refreshes the canvas.

---

## 3. Testing & Verification

1. **Unit Tests (`tests/test_camera_alignment_cv.py`):**
   * Synthetic perspective test frame with known horizon and doorway bounding boxes.
   * Verify horizon estimation accuracy within $\pm 2.0^\circ$.
   * Verify doorway azimuth detection accuracy within $\pm 1.5^\circ$.
   * Verify recommended heading computation.
2. **Existing Test Suite:**
   * Ensure all 52 existing tests pass (`uv run pytest`).
   * Ensure Ruff lint and formatting checks pass (`uv run ruff check .` and `uv run ruff format --check .`).
3. **End-to-End Visual Verification:**
   * Test in browser preview via `agent-preview`.
   * Capture screenshot of Tool Mode Switcher and Camera Alignment Drawer for PR documentation.
