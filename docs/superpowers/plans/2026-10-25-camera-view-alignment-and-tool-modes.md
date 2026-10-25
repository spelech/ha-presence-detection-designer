# Camera View Alignment & Canvas Tool Modes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide an explicit tool mode switcher (`rooms` vs `cameras`) on the floorplan canvas to eliminate interaction ambiguity, and implement a computer vision camera view alignment engine that analyzes real camera snapshots to calculate downward tilt and physical doorway bearings, with 1-click 2D heading calibration.

**Architecture:** Pure Python CV module (`camera_alignment_cv.py`) extracting vanishing lines, horizon line, and doorway jambs from camera snapshots; an authenticated HTTP API view in `views.py`; a segmented toolbar mode switcher and alignment inspector drawer in `panel.js` with real-time SVG visual feedback.

**Tech Stack:** Python 3.12, PIL, NumPy, Home Assistant HTTP Component, pytest, vanilla Web Components (Shadow DOM + SVG).

## Global Constraints
- Standalone repo: `~/Repos/ha-presence-detection-designer` on branch `feature/camera-view-alignment-and-tool-modes`.
- Do not commit or open PRs for this component inside `823SCD-HomeAssistant` repo; only sync deployed files to `/ha/823SCD-Docker/custom_components/presence_detection_designer/`.
- All CI workflows (Hassfest, HACS, Pytest, Ruff check & format) must pass.
- Any UI pull requests must include visual screenshots in the PR description.

---

### Task 1: Computer Vision Camera Alignment Engine (`camera_alignment_cv.py`)

**Files:**
- Create: `custom_components/presence_detection_designer/camera_alignment_cv.py`
- Test: `tests/test_camera_alignment_cv.py`

**Interfaces:**
- Produces:
  ```python
  def analyze_camera_view_alignment(
      image_bytes: bytes,
      camera_dict: dict[str, Any],
      room_entryways: list[dict[str, Any]],
      room_box: dict[str, Any],
  ) -> dict[str, Any]:
      """Analyze camera perspective image to estimate pitch/tilt, detect doorway openings,
      compare with 2D floorplan bearings, and return annotated image with recommendations."""
  ```

- [ ] **Step 1: Write the failing unit tests for CV alignment analysis**
  Create `tests/test_camera_alignment_cv.py` creating a synthetic calibration room image with a known horizon and two door openings, verifying tilt estimation and opening azimuth detection.

- [ ] **Step 2: Run pytest to verify test failure**
  Run `cd /home/steve/Repos/ha-presence-detection-designer && uv run pytest tests/test_camera_alignment_cv.py` to confirm `ModuleNotFoundError: No module named 'custom_components.presence_detection_designer.camera_alignment_cv'`.

- [ ] **Step 3: Implement `camera_alignment_cv.py`**
  Implement:
  - `estimate_horizon_and_pitch(image, hfov_deg, vfov_deg)`: extracts perspective lines and computes vanishing horizon line and downward tilt.
  - `detect_vertical_openings(image, hfov_deg)`: detects vertical pairs representing doorways and computes their horizontal azimuth relative to lens center.
  - `match_openings_to_floorplan(detected_openings, camera_dict, room_box, room_entryways)`: computes predicted 2D bearings and discrepancies.
  - `generate_annotated_image(image, horizon_y, detected_openings, predicted_rays)`: draws cyan horizon line, amber doorway boxes, and green predicted bearing guides.
  - `analyze_camera_view_alignment(...)`: main coordinator function returning the full alignment report.

- [ ] **Step 4: Run pytest and ruff to confirm passing tests**
  Run `cd /home/steve/Repos/ha-presence-detection-designer && uv run pytest tests/test_camera_alignment_cv.py && uv run ruff check custom_components/presence_detection_designer/camera_alignment_cv.py`.

- [ ] **Step 5: Commit changes**
  Run `git add custom_components/presence_detection_designer/camera_alignment_cv.py tests/test_camera_alignment_cv.py && git commit -m "feat(cv): implement camera view alignment and opening azimuth detection engine"`.

---

### Task 2: Backend Alignment HTTP Endpoint (`views.py`)

**Files:**
- Modify: `custom_components/presence_detection_designer/views.py`
- Modify: `tests/test_views.py`

**Interfaces:**
- Consumes: `analyze_camera_view_alignment` from `camera_alignment_cv.py`
- Produces: `POST /api/presence_detection_designer/camera/<camera_id>/align`

- [ ] **Step 1: Write the failing unit test for the camera alignment API route**
  Add `test_camera_alignment_view_endpoint()` in `tests/test_views.py`.

- [ ] **Step 2: Run pytest to verify test failure**
  Run `cd /home/steve/Repos/ha-presence-detection-designer && uv run pytest tests/test_views.py -k test_camera_alignment`.

- [ ] **Step 3: Implement `CameraAlignmentView` in `views.py`**
  - Register route `PresenceDesignerCameraAlignmentView` at `/api/presence_detection_designer/camera/{camera_id}/align`.
  - Fetch camera snapshot from HA entity registry / camera component proxy, or use synthetic mock frame in test environment.
  - Call `analyze_camera_view_alignment`.
  - Return JSON payload with `tilt_deg`, `roll_deg`, `current_heading_deg`, `recommended_heading_deg`, `openings`, and `annotated_image`.

- [ ] **Step 4: Run pytest and ruff to confirm all views pass**
  Run `cd /home/steve/Repos/ha-presence-detection-designer && uv run pytest tests/test_views.py && uv run ruff check custom_components/presence_detection_designer/views.py`.

- [ ] **Step 5: Commit changes**
  Run `git add custom_components/presence_detection_designer/views.py tests/test_views.py && git commit -m "feat(api): add camera view alignment analysis endpoint"`.

---

### Task 3: Canvas Tool Mode Switcher in `panel.js`

**Files:**
- Modify: `custom_components/presence_detection_designer/static/panel.js`

**Interfaces:**
- Canvas interaction modes:
  - `this._floorplanMode = 'rooms' | 'cameras'`

- [ ] **Step 1: Add mode state and UI segmented buttons**
  - Initialize `this._floorplanMode = "rooms"` in constructor.
  - In `_renderFloorplanPane`, add segmented button group on toolbar:
    - `[ 🏠 Edit Rooms & Doors ]` (`data-fp-mode="rooms"`)
    - `[ 📹 Edit Cameras & Cones ]` (`data-fp-mode="cameras"`)

- [ ] **Step 2: Update canvas pointer-events and handle visibility per mode**
  - In `_renderFloorplanPane`:
    - When `this._floorplanMode === 'rooms'`:
      - Room rectangles have `cursor: move` and are interactive.
      - 8 resize handles and doorway markers/tabs are rendered and interactive.
      - Camera cones and origin circles have `pointer-events: none` and muted stroke/fill so they never intercept room clicks.
    - When `this._floorplanMode === 'cameras'`:
      - Room rectangles and doorway markers have `pointer-events: none`.
      - 8 room resize handles are completely omitted.
      - Camera origins, heading aim vector knobs, FOV arc knobs, and range handles are fully interactive and highlighted.

- [ ] **Step 3: Update `_bindEvents` for mode toggling**
  - Add click listener for `button[data-fp-mode]` updating `this._floorplanMode` and calling `this.render()`.
  - Validate JS syntax with `node -c custom_components/presence_detection_designer/static/panel.js`.

- [ ] **Step 4: Commit changes**
  Run `git add custom_components/presence_detection_designer/static/panel.js && git commit -m "feat(ui): add dedicated rooms vs cameras tool mode switcher to floorplan canvas"`.

---

### Task 4: Camera Alignment Drawer & Auto-Calibrate Action in `panel.js`

**Files:**
- Modify: `custom_components/presence_detection_designer/static/panel.js`

**Interfaces:**
- Calls: `POST /api/presence_detection_designer/camera/<camera_id>/align`
- Updates: `cam.heading_deg = recommended_heading_deg`

- [ ] **Step 1: Implement Camera Alignment Inspector Card**
  - In `_renderFloorplanPane`, when `this._floorplanMode === 'cameras'` and a camera is selected:
    - Render **"Camera View & Physical Alignment"** card.
    - Include **"Analyze Camera Alignment"** button (`#btn-fp-analyze-camera`).
    - If analysis data exists, render:
      - The annotated snapshot image with horizon and opening guides.
      - Alignment stats: Estimated Pitch/Tilt, Leveling Roll, Opening Discrepancies.
      - **"Auto-Calibrate 2D Heading"** button (`#btn-fp-apply-calibrated-heading`).

- [ ] **Step 2: Implement Alignment Event Handlers**
  - Wire `#btn-fp-analyze-camera`: sets loading spinner, calls API `_apiCall("POST", "/api/presence_detection_designer/camera/" + encodeURIComponent(camId) + "/align", ...)`, stores result in `this._cameraAlignmentResults[camId]`, and renders.
  - Wire `#btn-fp-apply-calibrated-heading`: updates `cam.heading_deg = Math.round(result.recommended_heading_deg)`, recompiles topology client, debounces save, shows toast notification, and re-renders canvas.

- [ ] **Step 3: Validate syntax and verify in browser preview**
  - Check with `node -c custom_components/presence_detection_designer/static/panel.js`.
  - Publish preview via `agent-preview` and verify mode switching and inspector controls.

- [ ] **Step 4: Commit changes**
  Run `git add custom_components/presence_detection_designer/static/panel.js && git commit -m "feat(ui): add camera physical alignment analysis drawer and auto-calibrate action"`.

---

### Task 5: End-to-End Verification, Deployment & GitHub PR

**Files:**
- Deploy: `/ha/823SCD-Docker/custom_components/presence_detection_designer/`
- Documentation screenshot: `docs/screenshots/camera_mode_and_alignment_analysis.png`

- [ ] **Step 1: Run complete test suite and code quality checks**
  Run `uv run pytest && uv run ruff check . && uv run ruff format --check .`.

- [ ] **Step 2: Capture visual demonstration screenshot**
  Use `chrome-devtools` to capture screenshot showing both the Tool Mode Switcher active and the Camera Alignment analysis card. Save to `docs/screenshots/camera_mode_and_alignment_analysis.png`.

- [ ] **Step 3: Sync to HA custom_components**
  Run `rsync -av custom_components/presence_detection_designer/ /ha/823SCD-Docker/custom_components/presence_detection_designer/`.

- [ ] **Step 4: Push branch and open PR**
  Push `feature/camera-view-alignment-and-tool-modes`, open PR via `gh pr create` with embedded screenshot, and monitor CI checks until green.
