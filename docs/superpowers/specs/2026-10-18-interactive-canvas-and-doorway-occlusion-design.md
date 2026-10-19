# Interactive Floorplan Canvas & Doorway-Aware Camera Occlusion Design

## 1. Overview & Problem Statement
The current Floorplan Designer in `ha-presence-detection-designer` requires manual numeric input for room positions $(x, y)$, dimensions $(w, h)$, and camera parameters (heading, FOV, range). Furthermore, camera view cones currently treat rooms as open spaces without wall occlusion, projecting through solid boundaries into adjacent rooms indiscriminately.

This design introduces:
1. **Direct-Manipulation Interactive Canvas**: Drag-and-drop room repositioning, 8-handle bounding-box resizing, smart magnetic alignment/grid snapping, and direct camera positioning, heading rotation, and FOV/range adjustments.
2. **Perimeter Entryway / Opening Placement**: Edge-snapping doorway markers on room boundary walls with customizable widths (doors, archways, cased openings).
3. **2D Wall Occlusion & Ray Casting Engine**: Solid room walls block camera sightlines; entryway apertures allow camera light beams to pass through into adjacent rooms up to the camera's max range.
4. **Automated Cross-Room Spillover & Handover**: Dynamically detects which adjacent rooms are penetrated by camera sightlines through entryways to compute `spills_into` and set Bayesian probability and handover rules without manual coordinate math.

---

## 2. Data Model & Schema

### Room Entryways
Each room object in `floorplan.rooms` supports an `entryways` list:
```json
{
  "id": "margots_room",
  "name": "Margot's Room",
  "floor": "upstairs",
  "x": 60,
  "y": 40,
  "width": 290,
  "height": 150,
  "room_type": "room",
  "entryways": [
    {
      "id": "door_margot_hallway",
      "wall": "right",       // "top" | "bottom" | "left" | "right"
      "offset": 55,          // Offset along the wall from the wall's origin in pixels
      "width": 36,           // Aperture width in pixels (default 36px ~ 3ft)
      "type": "door",        // "door" | "open_archway" | "window"
      "target_room": "Upstairs Hallway & Stairs"
    }
  ]
}
```

### Camera Cone Geometry
```json
{
  "id": "camera.living_room",
  "name": "Living Room Camera",
  "floor": "main",
  "host_room": "Living Room",
  "x": 920,
  "y": 525,
  "heading_deg": 196,
  "fov_deg": 56,
  "range_px": 560,
  "spills_into": ["Front Entry"]
}
```

---

## 3. Direct Manipulation Canvas Interaction

### Room Manipulation
- **Drag to Move**: Clicking and dragging inside a room's bounding box moves it smoothly across the canvas.
- **8-Handle Resize**: When a room is selected, 8 resize handles appear (4 corners: NW, NE, SW, SE; 4 edge centers: N, S, E, W). Dragging any handle resizes the room's width and height.
- **Smart Magnetic Snapping**:
  - Snaps to a subtle 10px grid.
  - Magnetically snaps room edges and corners when within 8px of adjacent room borders to ensure flush walls and seamless shared corridors.

### Entryway Manipulation
- **Door Creation**: When a room is selected, hovering over any of its 4 perimeter walls displays a door insertion cursor (`+ Door`). Clicking drops a doorway marker.
- **Door Positioning**: Dragging the door marker slides it along the wall edge (`offset`).
- **Door Sizing**: Grab tabs on the edges of the door marker allow resizing its aperture width (30px to 180px).
- **Door Deletion**: Selecting a doorway displays a remove button / trash icon or pressing `Delete`/`Backspace` removes it.

### Camera Manipulation
- **Positioning**: Dragging the camera origin circle moves its lens location `(x, y)` inside or near the room.
- **Aiming / Rotation**: A heading control handle along the camera's aim vector allows dragging in a circular arc to smoothly rotate `heading_deg` ($0^\circ$ to $360^\circ$).
- **FOV & Range**: Dragging the arc endpoint handles expands or narrows `fov_deg`. Dragging the outer arc boundary increases or decreases `range_px`.

---

## 4. 2D Ray-Casting & Wall Occlusion Engine

### Ray-Casting Algorithm
1. **Wall Segment Extraction**:
   - For every room on the active floor, extract its 4 outer wall segments:
     - Top: $(x, y) \to (x + w, y)$
     - Bottom: $(x, y + h) \to (x + w, y + h)$
     - Left: $(x, y) \to (x, y + h)$
     - Right: $(x + w, y) \to (x + w, y + h)$
   - Subtract any entryway intervals on that wall, creating solid wall blocker segments and opening apertures.
2. **Visibility Polygon Generation**:
   - For a camera at $(cx, cy)$ with heading $\theta$, field of view $\Delta\theta$, and radius $R$:
   - Cast angular rays between $\theta - \Delta\theta/2$ and $\theta + \Delta\theta/2$ towards the endpoints of all nearby wall segments and door apertures, plus regular angular step rays.
   - For each ray, compute intersection with the closest solid wall segment or the max range arc $R$.
   - Assemble the intersected points into a 2D visibility polygon path (`<path d="M cx cy L ... Z">`).
3. **Penetration & Spillover Compilation**:
   - Check if any ray passing through an entryway enters an adjacent room box.
   - If the visibility polygon covers more than 5% of an adjacent room's area or intersects its boundary doorway, the camera automatically registers that room in `spills_into`.
   - Rooms completely blocked by solid walls are NEVER marked in `spills_into`, eliminating false cross-room camera triggers.

---

## 5. Backend & Client Integration

- **Client (`panel.js`)**:
  - Real-time SVG rendering of rooms, occluded visibility polygons, doors, and interactive control handles.
  - Interactive mouse event handling: `pointerdown`, `pointermove`, `pointerup` with canvas coordinates normalized against SVG viewBox.
  - Direct compilation of topology on drag end, calling `/api/presence_detection_designer/floorplan`.
- **Backend (`spatial_topology.py`)**:
  - `compile_spatial_topology()` updated to ingest `entryways` per room.
  - Validates wall intersections and computes cross-room doorway linkages.
  - Preserves backward compatibility: existing floorplans without `entryways` default to bounding box walls with open doors at connecting passages.

---

## 6. Verification & Test Plan
1. **Unit Tests**:
   - Test entryway serialization and schema validation.
   - Test wall occlusion: verify ray casting stops at solid walls and passes through doorway apertures.
   - Test automated `spills_into` calculation based on ray penetration through doorways.
2. **Browser / UI Verification**:
   - Drag rooms, resize using handles, verify magnetic snapping.
   - Place, slide, and resize doorway openings on room perimeters.
   - Drag cameras, adjust heading/FOV, verify cone casts realistically through doors and is blocked by solid walls.
   - Capture visual UI screenshot for PR requirements.
