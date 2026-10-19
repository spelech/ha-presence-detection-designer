/**
 * Presence Detection Designer — Clean Home Assistant Material Design Panel
 * Custom Element: <presence-detection-designer-panel>
 */

const PDD_DEFAULT_FLOORPLAN = {"version": 1, "canvas": {"width": 1000, "height": 600}, "floors": [{"id": "upstairs", "name": "Upstairs Level", "order": 0}, {"id": "main", "name": "Main Floor", "order": 1}, {"id": "basement", "name": "Basement Level", "order": 2}], "rooms": [{"id": "margots_room", "name": "Margot's Room", "floor": "upstairs", "x": 60, "y": 40, "width": 290, "height": 150, "room_type": "room", "entryways": [{"id": "door_margot_hallway", "wall": "right", "offset": 115, "width": 35, "type": "door", "target_room": "Upstairs Hallway & Stairs"}]}, {"id": "guest_room", "name": "Guest Room", "floor": "upstairs", "x": 60, "y": 195, "width": 290, "height": 150, "room_type": "room", "notes": "Between Nursery and Office; Ecobee sensor pending battery replacement, no camera.", "entryways": [{"id": "door_guest_hallway", "wall": "right", "offset": 20, "width": 36, "type": "door", "target_room": "Upstairs Hallway & Stairs"}]}, {"id": "office", "name": "Office", "floor": "upstairs", "x": 60, "y": 350, "width": 290, "height": 200, "room_type": "room", "notes": "Next to stairs to Front Entryway; camera sees office doorway.", "entryways": [{"id": "door_office_hallway", "wall": "right", "offset": 30, "width": 40, "type": "door", "target_room": "Upstairs Hallway & Stairs"}]}, {"id": "upstairs_hallway", "name": "Upstairs Hallway & Stairs", "floor": "upstairs", "x": 355, "y": 150, "width": 165, "height": 340, "room_type": "transit", "notes": "Connects Office, Guest Room, Nursery, Master Bedroom, and Stairs to Front Entry.", "entryways": [{"id": "door_hall_margot", "wall": "left", "offset": 5, "width": 35, "type": "door", "target_room": "Margot's Room"}, {"id": "door_hall_guest", "wall": "left", "offset": 65, "width": 36, "type": "door", "target_room": "Guest Room"}, {"id": "door_hall_office", "wall": "left", "offset": 230, "width": 40, "type": "door", "target_room": "Office"}, {"id": "door_hall_master", "wall": "right", "offset": 30, "width": 40, "type": "door", "target_room": "Master Bedroom"}, {"id": "passage_hall_stairs", "wall": "bottom", "offset": 60, "width": 45, "type": "open_passage", "target_room": "Front Entry"}]}, {"id": "master_bedroom", "name": "Master Bedroom", "floor": "upstairs", "x": 525, "y": 40, "width": 415, "height": 310, "room_type": "room", "notes": "Camera catches bed, walkway, entry to Upstairs Hallway, and entry to Master Bath/Closet.", "entryways": [{"id": "door_master_hallway", "wall": "left", "offset": 140, "width": 40, "type": "door", "target_room": "Upstairs Hallway & Stairs"}, {"id": "door_master_bath", "wall": "bottom", "offset": 200, "width": 40, "type": "door", "target_room": "Master Bathroom"}]}, {"id": "master_bathroom", "name": "Master Bathroom", "floor": "upstairs", "x": 640, "y": 355, "width": 300, "height": 195, "room_type": "room", "notes": "Master Bathroom & Closet; entry doorway caught by master_bedroom camera.", "entryways": [{"id": "door_bath_master", "wall": "top", "offset": 85, "width": 40, "type": "door", "target_room": "Master Bedroom"}]}, {"id": "family_room", "name": "Family Room", "floor": "main", "x": 60, "y": 40, "width": 250, "height": 310, "room_type": "room", "notes": "Camera catches Family Room, Kitchen, and pathway to Entryway, Basement, and Laundry.", "entryways": [{"id": "arch_fr_kitchen", "wall": "right", "offset": 30, "width": 180, "type": "open_passage", "target_room": "Kitchen"}, {"id": "door_fr_garage", "wall": "bottom", "offset": 40, "width": 36, "type": "door", "target_room": "Garage"}, {"id": "path_fr_entry", "wall": "right", "offset": 260, "width": 45, "type": "open_passage", "target_room": "Front Entry"}]}, {"id": "kitchen", "name": "Kitchen", "floor": "main", "x": 315, "y": 40, "width": 225, "height": 250, "room_type": "room", "notes": "Connected to Dining Room, Family Room, and Front Entry pathway; caught by Family Room camera.", "entryways": [{"id": "arch_kitchen_fr", "wall": "left", "offset": 30, "width": 180, "type": "open_passage", "target_room": "Family Room"}, {"id": "arch_kitchen_dr", "wall": "right", "offset": 20, "width": 180, "type": "open_passage", "target_room": "Dining Room"}, {"id": "path_kitchen_entry", "wall": "bottom", "offset": 30, "width": 100, "type": "open_passage", "target_room": "Front Entry"}]}, {"id": "dining_room", "name": "Dining Room", "floor": "main", "x": 545, "y": 40, "width": 395, "height": 230, "room_type": "room", "notes": "Connected to Kitchen and Living Room.", "entryways": [{"id": "arch_dr_kitchen", "wall": "left", "offset": 20, "width": 180, "type": "open_passage", "target_room": "Kitchen"}, {"id": "arch_dr_lr", "wall": "bottom", "offset": 40, "width": 200, "type": "open_passage", "target_room": "Living Room"}]}, {"id": "living_room", "name": "Living Room", "floor": "main", "x": 545, "y": 275, "width": 395, "height": 275, "room_type": "room", "notes": "Connected to Dining Room and Front Entryway; camera catches both Living Room and Entryway.", "entryways": [{"id": "arch_lr_dr", "wall": "top", "offset": 40, "width": 200, "type": "open_passage", "target_room": "Dining Room"}, {"id": "arch_lr_entry", "wall": "left", "offset": 60, "width": 120, "type": "open_passage", "target_room": "Front Entry"}]}, {"id": "front_entry", "name": "Front Entry", "floor": "main", "x": 315, "y": 295, "width": 225, "height": 255, "room_type": "room", "notes": "Has front_door sensor, but exits openly to Stairs (Upstairs), Kitchen pathway, and Living Room.", "entryways": [{"id": "arch_entry_lr", "wall": "right", "offset": 40, "width": 120, "type": "open_passage", "target_room": "Living Room"}, {"id": "path_entry_kitchen", "wall": "top", "offset": 30, "width": 100, "type": "open_passage", "target_room": "Kitchen"}, {"id": "path_entry_fr", "wall": "left", "offset": 5, "width": 45, "type": "open_passage", "target_room": "Family Room"}, {"id": "door_front_entry", "wall": "bottom", "offset": 90, "width": 40, "type": "door", "target_room": "Exterior"}]}, {"id": "garage", "name": "Garage", "floor": "main", "x": 60, "y": 355, "width": 250, "height": 195, "room_type": "room", "notes": "Connected via Laundry Room pathway to Family Room.", "entryways": [{"id": "door_garage_fr", "wall": "top", "offset": 40, "width": 36, "type": "door", "target_room": "Family Room"}]}, {"id": "storage_room", "name": "Storage Room", "floor": "basement", "x": 60, "y": 90, "width": 250, "height": 230, "room_type": "room", "notes": "Out of frame on left of Play Area camera; has a door WITHOUT a contact sensor.", "entryways": [{"id": "door_storage_play", "wall": "right", "offset": 60, "width": 36, "type": "door", "target_room": "Basement Play Area"}]}, {"id": "basement_bathroom", "name": "Basement Bathroom", "floor": "basement", "x": 60, "y": 325, "width": 250, "height": 215, "room_type": "transit", "notes": "Out of frame on left of Play Area camera; no sensors.", "entryways": [{"id": "door_bbath_play", "wall": "right", "offset": 40, "width": 36, "type": "door", "target_room": "Basement Play Area"}]}, {"id": "basement_play_area", "name": "Basement Play Area", "floor": "basement", "x": 315, "y": 140, "width": 310, "height": 400, "room_type": "room", "notes": "Central basement area; Storage Room and Basement Bathroom are out of frame on the left.", "entryways": [{"id": "door_play_storage", "wall": "left", "offset": 10, "width": 36, "type": "door", "target_room": "Storage Room"}, {"id": "door_play_bbath", "wall": "left", "offset": 225, "width": 36, "type": "door", "target_room": "Basement Bathroom"}, {"id": "arch_play_theater", "wall": "right", "offset": 20, "width": 260, "type": "open_passage", "target_room": "Basement Theater"}]}, {"id": "basement_theater", "name": "Basement Theater", "floor": "basement", "x": 630, "y": 90, "width": 310, "height": 450, "room_type": "room", "notes": "Open to Play Area; camera can partially catch someone on the basement stairs.", "entryways": [{"id": "arch_theater_play", "wall": "left", "offset": 70, "width": 260, "type": "open_passage", "target_room": "Basement Play Area"}]}], "connections": [{"id": "conn_entry_lr", "from_room": "Front Entry", "to_room": "Living Room", "type": "open_passage", "label": "Open Archway (Entry <-> Living Room)"}, {"id": "conn_entry_kitchen", "from_room": "Front Entry", "to_room": "Kitchen", "type": "open_passage", "label": "Pathway (Entry <-> Kitchen)"}, {"id": "conn_entry_fr", "from_room": "Front Entry", "to_room": "Family Room", "type": "open_passage", "label": "Pathway (Entry <-> Family/Laundry/Basement)"}, {"id": "conn_lr_dr", "from_room": "Living Room", "to_room": "Dining Room", "type": "open_passage", "label": "Open Passage (Living <-> Dining)"}, {"id": "conn_dr_kitchen", "from_room": "Dining Room", "to_room": "Kitchen", "type": "open_passage", "label": "Open Passage (Dining <-> Kitchen)"}, {"id": "conn_kitchen_fr", "from_room": "Kitchen", "to_room": "Family Room", "type": "open_passage", "label": "Open Concept (Kitchen <-> Family Room)"}, {"id": "conn_fr_garage", "from_room": "Family Room", "to_room": "Garage", "type": "unmonitored_door", "entity_id": "binary_sensor.utility_room_door", "label": "Laundry / Utility Room Pathway"}, {"id": "conn_entry_upstairs", "from_room": "Front Entry", "to_room": "Upstairs Hallway & Stairs", "type": "stairs", "label": "Main Stairs (Next to Office)"}, {"id": "conn_fr_basement_play", "from_room": "Family Room", "to_room": "Basement Play Area", "type": "stairs", "label": "Basement Stairs"}, {"id": "conn_fr_basement_theater", "from_room": "Family Room", "to_room": "Basement Theater", "type": "stairs", "label": "Basement Stairs (Partial Camera Sightline)"}, {"id": "conn_hall_office", "from_room": "Upstairs Hallway & Stairs", "to_room": "Office", "type": "unmonitored_door", "label": "Office Doorway (Next to Stairs)"}, {"id": "conn_hall_guest", "from_room": "Upstairs Hallway & Stairs", "to_room": "Guest Room", "type": "unmonitored_door", "label": "Guest Room Doorway (No Sensor)"}, {"id": "conn_hall_nursery", "from_room": "Upstairs Hallway & Stairs", "to_room": "Margot's Room", "type": "unmonitored_door", "label": "Nursery Doorway (Seen Partially by Cam)"}, {"id": "conn_hall_master", "from_room": "Upstairs Hallway & Stairs", "to_room": "Master Bedroom", "type": "unmonitored_door", "label": "Master Bedroom Entryway"}, {"id": "conn_master_bath", "from_room": "Master Bedroom", "to_room": "Master Bathroom", "type": "unmonitored_door", "label": "Master Bath / Closet Entry"}, {"id": "conn_play_theater", "from_room": "Basement Play Area", "to_room": "Basement Theater", "type": "open_passage", "label": "Open Basement Divide (Play <-> Theater)"}, {"id": "conn_play_storage", "from_room": "Basement Play Area", "to_room": "Storage Room", "type": "unmonitored_door", "label": "Storage Room Door (No Sensor, Out of Frame Left)"}, {"id": "conn_play_bbath", "from_room": "Basement Play Area", "to_room": "Basement Bathroom", "type": "unmonitored_door", "label": "Basement Bath Door (No Sensor, Out of Frame Left)"}], "cameras": [{"id": "camera.living_room", "name": "Living Room Camera", "floor": "main", "host_room": "Living Room", "x": 920, "y": 525, "heading_deg": 196, "fov_deg": 56, "range_px": 560, "zones": ["living_room_couch", "living_room_floor", "living_room_bay_windows", "living_room_entry"], "spills_into": ["Front Entry"], "notes": "Catches both Living Room and Front Entryway."}, {"id": "camera.dining_room", "name": "Dining Room Camera", "floor": "main", "host_room": "Dining Room", "x": 920, "y": 60, "heading_deg": 162, "fov_deg": 52, "range_px": 350, "zones": ["dining_room_table", "rileys_food"], "spills_into": [], "notes": "Covers Dining Room table and Riley's food area."}, {"id": "camera.family_room", "name": "Family Room Camera", "floor": "main", "host_room": "Family Room", "x": 80, "y": 60, "heading_deg": 28, "fov_deg": 68, "range_px": 460, "zones": ["family_room_couch", "family_room_recliner", "family_room_floor", "kitchen_island"], "spills_into": ["Kitchen", "Front Entry"], "notes": "Catches Family Room, Kitchen Island, and pathway to Entryway, Basement, and Laundry."}, {"id": "camera.garage", "name": "Garage Camera", "floor": "main", "host_room": "Garage", "x": 80, "y": 375, "heading_deg": 32, "fov_deg": 64, "range_px": 230, "zones": ["garage_parking"], "spills_into": [], "notes": "Covers Garage parking bay."}, {"id": "camera.master_bedroom", "name": "Master Bedroom Camera", "floor": "upstairs", "host_room": "Master Bedroom", "x": 920, "y": 60, "heading_deg": 155, "fov_deg": 96, "range_px": 470, "zones": ["master_bed", "master_open_area", "master_bedroom_walkway", "master_bedroom_entryway", "master_bathroom"], "spills_into": ["Upstairs Hallway & Stairs", "Master Bathroom"], "notes": "Catches Master Bedroom plus entries to Upstairs Hallway and Master Bathroom/Closet."}, {"id": "camera.nursery", "name": "Nursery Camera", "floor": "upstairs", "host_room": "Margot's Room", "x": 80, "y": 55, "heading_deg": 28, "fov_deg": 85, "range_px": 310, "zones": ["nursery_bed"], "spills_into": ["Upstairs Hallway & Stairs"], "notes": "Covers Nursery bed and partially sees doorway from Upstairs Hallway."}, {"id": "camera.office", "name": "Office Camera", "floor": "upstairs", "host_room": "Office", "x": 80, "y": 530, "heading_deg": 330, "fov_deg": 90, "range_px": 330, "zones": ["steves_desk", "sim_rig", "office_floor", "office_entryway"], "spills_into": ["Upstairs Hallway & Stairs"], "notes": "Covers Office desk/sim rig and sees Office doorway next to the stairs."}, {"id": "camera.basement_theater", "name": "Basement Theater Camera", "floor": "basement", "host_room": "Basement Theater", "x": 920, "y": 515, "heading_deg": 212, "fov_deg": 96, "range_px": 540, "zones": ["basement_theater_couch", "basement_theater_playpen", "basement_theater_floor", "basement_bar", "basement_play_area_far", "basement_stairwell"], "spills_into": ["Basement Play Area"], "notes": "Covers Theater, sees far Play Area/Bar, and partially catches Basement Stairs."}, {"id": "camera.basement_play_area", "name": "Basement Play Area Camera", "floor": "basement", "host_room": "Basement Play Area", "x": 340, "y": 515, "heading_deg": 318, "fov_deg": 92, "range_px": 450, "zones": ["basement_play_floor", "basement_counter", "theater_rear_view"], "spills_into": ["Basement Theater"], "notes": "Covers Play Area & Counter; sees into Theater. Storage Room & Basement Bath are out of frame on left."}, {"id": "camera.storage_room", "name": "Storage Room Camera", "floor": "basement", "host_room": "Storage Room", "x": 80, "y": 110, "heading_deg": 38, "fov_deg": 85, "range_px": 240, "zones": ["storage_room_workout"], "spills_into": [], "notes": "Covers interior Storage Room / Gym floor."}]};
const PDD_DEFAULT_COMPILED_TOPOLOGY = {"floorplan": {"version": 1, "canvas": {"width": 1000, "height": 600}, "floors": [{"id": "upstairs", "name": "Upstairs Level", "order": 0}, {"id": "main", "name": "Main Floor", "order": 1}, {"id": "basement", "name": "Basement Level", "order": 2}], "rooms": [{"id": "margots_room", "name": "Margot's Room", "floor": "upstairs", "x": 60, "y": 40, "width": 290, "height": 150, "room_type": "room", "entryways": [{"id": "door_margot_hallway", "wall": "right", "offset": 115, "width": 35, "type": "door", "target_room": "Upstairs Hallway & Stairs"}]}, {"id": "guest_room", "name": "Guest Room", "floor": "upstairs", "x": 60, "y": 195, "width": 290, "height": 150, "room_type": "room", "notes": "Between Nursery and Office; Ecobee sensor pending battery replacement, no camera.", "entryways": [{"id": "door_guest_hallway", "wall": "right", "offset": 20, "width": 36, "type": "door", "target_room": "Upstairs Hallway & Stairs"}]}, {"id": "office", "name": "Office", "floor": "upstairs", "x": 60, "y": 350, "width": 290, "height": 200, "room_type": "room", "notes": "Next to stairs to Front Entryway; camera sees office doorway.", "entryways": [{"id": "door_office_hallway", "wall": "right", "offset": 30, "width": 40, "type": "door", "target_room": "Upstairs Hallway & Stairs"}]}, {"id": "upstairs_hallway", "name": "Upstairs Hallway & Stairs", "floor": "upstairs", "x": 355, "y": 150, "width": 165, "height": 340, "room_type": "transit", "notes": "Connects Office, Guest Room, Nursery, Master Bedroom, and Stairs to Front Entry.", "entryways": [{"id": "door_hall_margot", "wall": "left", "offset": 5, "width": 35, "type": "door", "target_room": "Margot's Room"}, {"id": "door_hall_guest", "wall": "left", "offset": 65, "width": 36, "type": "door", "target_room": "Guest Room"}, {"id": "door_hall_office", "wall": "left", "offset": 230, "width": 40, "type": "door", "target_room": "Office"}, {"id": "door_hall_master", "wall": "right", "offset": 30, "width": 40, "type": "door", "target_room": "Master Bedroom"}, {"id": "passage_hall_stairs", "wall": "bottom", "offset": 60, "width": 45, "type": "open_passage", "target_room": "Front Entry"}]}, {"id": "master_bedroom", "name": "Master Bedroom", "floor": "upstairs", "x": 525, "y": 40, "width": 415, "height": 310, "room_type": "room", "notes": "Camera catches bed, walkway, entry to Upstairs Hallway, and entry to Master Bath/Closet.", "entryways": [{"id": "door_master_hallway", "wall": "left", "offset": 140, "width": 40, "type": "door", "target_room": "Upstairs Hallway & Stairs"}, {"id": "door_master_bath", "wall": "bottom", "offset": 200, "width": 40, "type": "door", "target_room": "Master Bathroom"}]}, {"id": "master_bathroom", "name": "Master Bathroom", "floor": "upstairs", "x": 640, "y": 355, "width": 300, "height": 195, "room_type": "room", "notes": "Master Bathroom & Closet; entry doorway caught by master_bedroom camera.", "entryways": [{"id": "door_bath_master", "wall": "top", "offset": 85, "width": 40, "type": "door", "target_room": "Master Bedroom"}]}, {"id": "family_room", "name": "Family Room", "floor": "main", "x": 60, "y": 40, "width": 250, "height": 310, "room_type": "room", "notes": "Camera catches Family Room, Kitchen, and pathway to Entryway, Basement, and Laundry.", "entryways": [{"id": "arch_fr_kitchen", "wall": "right", "offset": 30, "width": 180, "type": "open_passage", "target_room": "Kitchen"}, {"id": "door_fr_garage", "wall": "bottom", "offset": 40, "width": 36, "type": "door", "target_room": "Garage"}, {"id": "path_fr_entry", "wall": "right", "offset": 260, "width": 45, "type": "open_passage", "target_room": "Front Entry"}]}, {"id": "kitchen", "name": "Kitchen", "floor": "main", "x": 315, "y": 40, "width": 225, "height": 250, "room_type": "room", "notes": "Connected to Dining Room, Family Room, and Front Entry pathway; caught by Family Room camera.", "entryways": [{"id": "arch_kitchen_fr", "wall": "left", "offset": 30, "width": 180, "type": "open_passage", "target_room": "Family Room"}, {"id": "arch_kitchen_dr", "wall": "right", "offset": 20, "width": 180, "type": "open_passage", "target_room": "Dining Room"}, {"id": "path_kitchen_entry", "wall": "bottom", "offset": 30, "width": 100, "type": "open_passage", "target_room": "Front Entry"}]}, {"id": "dining_room", "name": "Dining Room", "floor": "main", "x": 545, "y": 40, "width": 395, "height": 230, "room_type": "room", "notes": "Connected to Kitchen and Living Room.", "entryways": [{"id": "arch_dr_kitchen", "wall": "left", "offset": 20, "width": 180, "type": "open_passage", "target_room": "Kitchen"}, {"id": "arch_dr_lr", "wall": "bottom", "offset": 40, "width": 200, "type": "open_passage", "target_room": "Living Room"}]}, {"id": "living_room", "name": "Living Room", "floor": "main", "x": 545, "y": 275, "width": 395, "height": 275, "room_type": "room", "notes": "Connected to Dining Room and Front Entryway; camera catches both Living Room and Entryway.", "entryways": [{"id": "arch_lr_dr", "wall": "top", "offset": 40, "width": 200, "type": "open_passage", "target_room": "Dining Room"}, {"id": "arch_lr_entry", "wall": "left", "offset": 60, "width": 120, "type": "open_passage", "target_room": "Front Entry"}]}, {"id": "front_entry", "name": "Front Entry", "floor": "main", "x": 315, "y": 295, "width": 225, "height": 255, "room_type": "room", "notes": "Has front_door sensor, but exits openly to Stairs (Upstairs), Kitchen pathway, and Living Room.", "entryways": [{"id": "arch_entry_lr", "wall": "right", "offset": 40, "width": 120, "type": "open_passage", "target_room": "Living Room"}, {"id": "path_entry_kitchen", "wall": "top", "offset": 30, "width": 100, "type": "open_passage", "target_room": "Kitchen"}, {"id": "path_entry_fr", "wall": "left", "offset": 5, "width": 45, "type": "open_passage", "target_room": "Family Room"}, {"id": "door_front_entry", "wall": "bottom", "offset": 90, "width": 40, "type": "door", "target_room": "Exterior"}]}, {"id": "garage", "name": "Garage", "floor": "main", "x": 60, "y": 355, "width": 250, "height": 195, "room_type": "room", "notes": "Connected via Laundry Room pathway to Family Room.", "entryways": [{"id": "door_garage_fr", "wall": "top", "offset": 40, "width": 36, "type": "door", "target_room": "Family Room"}]}, {"id": "storage_room", "name": "Storage Room", "floor": "basement", "x": 60, "y": 90, "width": 250, "height": 230, "room_type": "room", "notes": "Out of frame on left of Play Area camera; has a door WITHOUT a contact sensor.", "entryways": [{"id": "door_storage_play", "wall": "right", "offset": 60, "width": 36, "type": "door", "target_room": "Basement Play Area"}]}, {"id": "basement_bathroom", "name": "Basement Bathroom", "floor": "basement", "x": 60, "y": 325, "width": 250, "height": 215, "room_type": "transit", "notes": "Out of frame on left of Play Area camera; no sensors.", "entryways": [{"id": "door_bbath_play", "wall": "right", "offset": 40, "width": 36, "type": "door", "target_room": "Basement Play Area"}]}, {"id": "basement_play_area", "name": "Basement Play Area", "floor": "basement", "x": 315, "y": 140, "width": 310, "height": 400, "room_type": "room", "notes": "Central basement area; Storage Room and Basement Bathroom are out of frame on the left.", "entryways": [{"id": "door_play_storage", "wall": "left", "offset": 10, "width": 36, "type": "door", "target_room": "Storage Room"}, {"id": "door_play_bbath", "wall": "left", "offset": 225, "width": 36, "type": "door", "target_room": "Basement Bathroom"}, {"id": "arch_play_theater", "wall": "right", "offset": 20, "width": 260, "type": "open_passage", "target_room": "Basement Theater"}]}, {"id": "basement_theater", "name": "Basement Theater", "floor": "basement", "x": 630, "y": 90, "width": 310, "height": 450, "room_type": "room", "notes": "Open to Play Area; camera can partially catch someone on the basement stairs.", "entryways": [{"id": "arch_theater_play", "wall": "left", "offset": 70, "width": 260, "type": "open_passage", "target_room": "Basement Play Area"}]}], "connections": [{"id": "conn_entry_lr", "from_room": "Front Entry", "to_room": "Living Room", "type": "open_passage", "label": "Open Archway (Entry <-> Living Room)"}, {"id": "conn_entry_kitchen", "from_room": "Front Entry", "to_room": "Kitchen", "type": "open_passage", "label": "Pathway (Entry <-> Kitchen)"}, {"id": "conn_entry_fr", "from_room": "Front Entry", "to_room": "Family Room", "type": "open_passage", "label": "Pathway (Entry <-> Family/Laundry/Basement)"}, {"id": "conn_lr_dr", "from_room": "Living Room", "to_room": "Dining Room", "type": "open_passage", "label": "Open Passage (Living <-> Dining)"}, {"id": "conn_dr_kitchen", "from_room": "Dining Room", "to_room": "Kitchen", "type": "open_passage", "label": "Open Passage (Dining <-> Kitchen)"}, {"id": "conn_kitchen_fr", "from_room": "Kitchen", "to_room": "Family Room", "type": "open_passage", "label": "Open Concept (Kitchen <-> Family Room)"}, {"id": "conn_fr_garage", "from_room": "Family Room", "to_room": "Garage", "type": "unmonitored_door", "entity_id": "binary_sensor.utility_room_door", "label": "Laundry / Utility Room Pathway"}, {"id": "conn_entry_upstairs", "from_room": "Front Entry", "to_room": "Upstairs Hallway & Stairs", "type": "stairs", "label": "Main Stairs (Next to Office)"}, {"id": "conn_fr_basement_play", "from_room": "Family Room", "to_room": "Basement Play Area", "type": "stairs", "label": "Basement Stairs"}, {"id": "conn_fr_basement_theater", "from_room": "Family Room", "to_room": "Basement Theater", "type": "stairs", "label": "Basement Stairs (Partial Camera Sightline)"}, {"id": "conn_hall_office", "from_room": "Upstairs Hallway & Stairs", "to_room": "Office", "type": "unmonitored_door", "label": "Office Doorway (Next to Stairs)"}, {"id": "conn_hall_guest", "from_room": "Upstairs Hallway & Stairs", "to_room": "Guest Room", "type": "unmonitored_door", "label": "Guest Room Doorway (No Sensor)"}, {"id": "conn_hall_nursery", "from_room": "Upstairs Hallway & Stairs", "to_room": "Margot's Room", "type": "unmonitored_door", "label": "Nursery Doorway (Seen Partially by Cam)"}, {"id": "conn_hall_master", "from_room": "Upstairs Hallway & Stairs", "to_room": "Master Bedroom", "type": "unmonitored_door", "label": "Master Bedroom Entryway"}, {"id": "conn_master_bath", "from_room": "Master Bedroom", "to_room": "Master Bathroom", "type": "unmonitored_door", "label": "Master Bath / Closet Entry"}, {"id": "conn_play_theater", "from_room": "Basement Play Area", "to_room": "Basement Theater", "type": "open_passage", "label": "Open Basement Divide (Play <-> Theater)"}, {"id": "conn_play_storage", "from_room": "Basement Play Area", "to_room": "Storage Room", "type": "unmonitored_door", "label": "Storage Room Door (No Sensor, Out of Frame Left)"}, {"id": "conn_play_bbath", "from_room": "Basement Play Area", "to_room": "Basement Bathroom", "type": "unmonitored_door", "label": "Basement Bath Door (No Sensor, Out of Frame Left)"}], "cameras": [{"id": "camera.living_room", "name": "Living Room Camera", "floor": "main", "host_room": "Living Room", "x": 920, "y": 525, "heading_deg": 196, "fov_deg": 56, "range_px": 560, "zones": ["living_room_couch", "living_room_floor", "living_room_bay_windows", "living_room_entry"], "spills_into": ["Front Entry"], "notes": "Catches both Living Room and Front Entryway."}, {"id": "camera.dining_room", "name": "Dining Room Camera", "floor": "main", "host_room": "Dining Room", "x": 920, "y": 60, "heading_deg": 162, "fov_deg": 52, "range_px": 350, "zones": ["dining_room_table", "rileys_food"], "spills_into": [], "notes": "Covers Dining Room table and Riley's food area."}, {"id": "camera.family_room", "name": "Family Room Camera", "floor": "main", "host_room": "Family Room", "x": 80, "y": 60, "heading_deg": 28, "fov_deg": 68, "range_px": 460, "zones": ["family_room_couch", "family_room_recliner", "family_room_floor", "kitchen_island"], "spills_into": ["Kitchen", "Front Entry"], "notes": "Catches Family Room, Kitchen Island, and pathway to Entryway, Basement, and Laundry."}, {"id": "camera.garage", "name": "Garage Camera", "floor": "main", "host_room": "Garage", "x": 80, "y": 375, "heading_deg": 32, "fov_deg": 64, "range_px": 230, "zones": ["garage_parking"], "spills_into": [], "notes": "Covers Garage parking bay."}, {"id": "camera.master_bedroom", "name": "Master Bedroom Camera", "floor": "upstairs", "host_room": "Master Bedroom", "x": 920, "y": 60, "heading_deg": 155, "fov_deg": 96, "range_px": 470, "zones": ["master_bed", "master_open_area", "master_bedroom_walkway", "master_bedroom_entryway", "master_bathroom"], "spills_into": ["Upstairs Hallway & Stairs", "Master Bathroom"], "notes": "Catches Master Bedroom plus entries to Upstairs Hallway and Master Bathroom/Closet."}, {"id": "camera.nursery", "name": "Nursery Camera", "floor": "upstairs", "host_room": "Margot's Room", "x": 80, "y": 55, "heading_deg": 28, "fov_deg": 85, "range_px": 310, "zones": ["nursery_bed"], "spills_into": ["Upstairs Hallway & Stairs"], "notes": "Covers Nursery bed and partially sees doorway from Upstairs Hallway."}, {"id": "camera.office", "name": "Office Camera", "floor": "upstairs", "host_room": "Office", "x": 80, "y": 530, "heading_deg": 330, "fov_deg": 90, "range_px": 330, "zones": ["steves_desk", "sim_rig", "office_floor", "office_entryway"], "spills_into": ["Upstairs Hallway & Stairs"], "notes": "Covers Office desk/sim rig and sees Office doorway next to the stairs."}, {"id": "camera.basement_theater", "name": "Basement Theater Camera", "floor": "basement", "host_room": "Basement Theater", "x": 920, "y": 515, "heading_deg": 212, "fov_deg": 96, "range_px": 540, "zones": ["basement_theater_couch", "basement_theater_playpen", "basement_theater_floor", "basement_bar", "basement_play_area_far", "basement_stairwell"], "spills_into": ["Basement Play Area"], "notes": "Covers Theater, sees far Play Area/Bar, and partially catches Basement Stairs."}, {"id": "camera.basement_play_area", "name": "Basement Play Area Camera", "floor": "basement", "host_room": "Basement Play Area", "x": 340, "y": 515, "heading_deg": 318, "fov_deg": 92, "range_px": 450, "zones": ["basement_play_floor", "basement_counter", "theater_rear_view"], "spills_into": ["Basement Theater"], "notes": "Covers Play Area & Counter; sees into Theater. Storage Room & Basement Bath are out of frame on left."}, {"id": "camera.storage_room", "name": "Storage Room Camera", "floor": "basement", "host_room": "Storage Room", "x": 80, "y": 110, "heading_deg": 38, "fov_deg": 85, "range_px": 240, "zones": ["storage_room_workout"], "spills_into": [], "notes": "Covers interior Storage Room / Gym floor."}]}, "connected_rooms_map": {"Margot's Room": ["Front Entry", "Guest Room", "Master Bedroom", "Office"], "Guest Room": ["Front Entry", "Margot's Room", "Master Bedroom", "Office"], "Office": ["Front Entry", "Guest Room", "Margot's Room", "Master Bedroom"], "Master Bedroom": ["Front Entry", "Guest Room", "Margot's Room", "Master Bathroom", "Office"], "Master Bathroom": ["Master Bedroom"], "Family Room": ["Basement Play Area", "Basement Theater", "Front Entry", "Garage", "Kitchen"], "Kitchen": ["Dining Room", "Family Room", "Front Entry"], "Dining Room": ["Kitchen", "Living Room"], "Living Room": ["Dining Room", "Front Entry"], "Front Entry": ["Family Room", "Guest Room", "Kitchen", "Living Room", "Margot's Room", "Master Bedroom", "Office"], "Garage": ["Family Room"], "Storage Room": ["Basement Play Area"], "Basement Play Area": ["Basement Theater", "Family Room", "Storage Room"], "Basement Theater": ["Basement Play Area", "Family Room"]}, "seal_analysis": {"Margot's Room": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)"]}, "Guest Room": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)"]}, "Office": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)"]}, "Master Bedroom": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)", "Master Bathroom (unmonitored door)"]}, "Master Bathroom": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Master Bedroom (unmonitored door)"]}, "Family Room": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Front Entry (open passage)", "Kitchen (open passage)", "Garage (unmonitored door)", "Basement Play Area (stairs)", "Basement Theater (stairs)"]}, "Kitchen": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Front Entry (open passage)", "Dining Room (open passage)", "Family Room (open passage)"]}, "Dining Room": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Living Room (open passage)", "Kitchen (open passage)"]}, "Living Room": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Front Entry (open passage)", "Dining Room (open passage)"]}, "Front Entry": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Living Room (open passage)", "Kitchen (open passage)", "Family Room (open passage)", "Upstairs Hallway & Stairs (stairs)"]}, "Garage": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Family Room (unmonitored door)"]}, "Storage Room": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Basement Play Area (unmonitored door)"]}, "Basement Play Area": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Family Room (stairs)", "Basement Theater (open passage)", "Storage Room (unmonitored door)", "Basement Bathroom (unmonitored door)"]}, "Basement Theater": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Family Room (stairs)", "Basement Play Area (open passage)"]}}, "camera_analysis": [{"camera_id": "camera.living_room", "name": "Living Room Camera", "host_room": "Living Room", "floor": "main", "zones": ["living_room_couch", "living_room_floor", "living_room_bay_windows", "living_room_entry"], "spillover_targets": [{"room_name": "Kitchen", "overlap_pct": 7.0}, {"room_name": "Dining Room", "overlap_pct": 6.0}, {"room_name": "Front Entry", "overlap_pct": 35.0}], "has_multi_room_bleed": true, "visibility_polygon": [[920.0, 525.0], [802.38, 550.0], [785.46, 550.0], [763.09, 550.0], [732.11, 550.0], [686.27, 550.0], [611.41, 550.0], [546.96, 550.0], [545.0, 550.0], [545.0, 549.87], [545.0, 549.8], [545.0, 549.67], [545.0, 549.54], [545.0, 545.69], [545.0, 544.87], [545.0, 544.74], [545.0, 544.61], [545.0, 543.34], [545.0, 543.2], [545.0, 543.07], [545.0, 540.63], [545.0, 540.5], [545.0, 540.5], [545.0, 540.37], [545.0, 540.36], [545.0, 540.24], [545.0, 536.03], [545.0, 526.38], [545.0, 516.73], [545.0, 507.07], [545.0, 497.39], [545.0, 487.67], [545.0, 477.91], [545.0, 468.08], [545.0, 458.17], [545.0, 456.06], [545.0, 455.92], [545.0, 455.79], [545.0, 455.14], [545.0, 455.0], [369.54, 422.05], [371.4, 412.6], [371.62, 411.51], [371.66, 411.32], [371.7, 411.13], [372.29, 408.31], [372.33, 408.12], [372.37, 407.93], [372.68, 406.52], [372.72, 406.33], [372.76, 406.14], [373.41, 403.19], [373.45, 403.0], [373.49, 402.81], [374.47, 398.53], [377.9, 384.54], [380.5, 374.85], [380.56, 374.66], [380.61, 374.48], [381.66, 370.76], [381.69, 370.64], [381.71, 370.57], [381.77, 370.39], [382.84, 366.7], [382.9, 366.51], [382.95, 366.32], [383.2, 365.49], [383.25, 365.31], [383.31, 365.12], [385.84, 356.85], [390.34, 343.17], [394.53, 331.39], [394.6, 331.21], [394.67, 331.02], [395.05, 329.98], [395.12, 329.8], [395.19, 329.61], [395.19, 329.61], [396.48, 326.18], [396.55, 326.0], [396.62, 325.82], [397.93, 322.42], [398.0, 322.24], [398.07, 322.06], [399.98, 317.2], [400.05, 317.02], [400.13, 316.84], [400.39, 316.17], [401.55, 313.32], [401.62, 313.14], [401.7, 312.96], [405.93, 302.88], [409.4, 295.03], [409.48, 294.85], [409.56, 294.67], [410.11, 293.45], [410.19, 293.27], [410.28, 293.09], [411.82, 289.73], [415.89, 281.12], [445.0, 295.0], [445.42, 295.0], [454.7, 295.0], [454.95, 295.0], [455.11, 295.0], [455.51, 295.0], [459.6, 295.0], [540.0, 335.0], [540.0, 334.83], [540.0, 332.63], [545.0, 335.0], [545.0, 334.84], [545.0, 327.37], [545.0, 314.88], [545.0, 302.02], [545.0, 298.2], [545.0, 298.03], [545.0, 297.85], [545.0, 293.27], [545.0, 293.09], [545.0, 292.91], [545.0, 288.75], [545.0, 275.19], [545.0, 275.06], [545.0, 275.0], [545.28, 275.0], [552.08, 275.0], [552.35, 275.0], [552.63, 275.0], [565.05, 275.0], [583.76, 275.0], [584.59, 275.0], [584.76, 275.0], [584.83, 275.0], [585.0, 275.0], [578.38, 270.0], [578.55, 270.0], [579.75, 270.0], [580.0, 270.0], [580.25, 270.0], [580.69, 270.0], [580.93, 270.0], [581.18, 270.0], [584.23, 270.0], [584.47, 270.0], [584.72, 270.0], [584.76, 270.0], [585.0, 270.0], [474.52, 185.66], [479.35, 179.42], [481.54, 176.64], [481.66, 176.49], [481.79, 176.33], [482.94, 174.88], [483.07, 174.73], [483.19, 174.58], [488.38, 168.2], [497.7, 157.22], [507.3, 146.48], [517.17, 135.99]]}, {"camera_id": "camera.dining_room", "name": "Dining Room Camera", "host_room": "Dining Room", "floor": "main", "zones": ["dining_room_table", "rileys_food"], "spillover_targets": [], "has_multi_room_bleed": false, "visibility_polygon": [[920.0, 60.0], [668.23, 303.13], [662.01, 296.52], [655.97, 289.75], [650.1, 282.83], [644.41, 275.76], [638.91, 268.54], [637.83, 267.08], [637.76, 266.98], [637.69, 266.88], [636.53, 265.29], [636.46, 265.19], [636.39, 265.1], [633.6, 261.18], [628.48, 253.69], [625.51, 249.15], [625.44, 249.04], [625.38, 248.94], [623.55, 246.06], [623.51, 246.0], [623.45, 245.9], [623.38, 245.79], [622.39, 244.19], [622.32, 244.09], [622.26, 243.99], [620.64, 241.34], [620.58, 241.23], [620.51, 241.13], [618.83, 238.31], [616.43, 234.19], [616.36, 234.08], [616.3, 233.98], [614.68, 231.12], [614.62, 231.01], [614.56, 230.9], [614.31, 230.45], [609.99, 222.46], [605.88, 214.37], [604.52, 211.57], [604.47, 211.46], [604.41, 211.35], [603.74, 209.94], [603.69, 209.83], [603.64, 209.72], [601.99, 206.17], [598.3, 197.88], [594.84, 189.49], [591.59, 181.02], [588.56, 172.46], [585.76, 163.83], [583.18, 155.13], [580.82, 146.37], [578.7, 137.54], [576.8, 128.67], [575.14, 119.75], [573.7, 110.78], [572.5, 101.79], [571.54, 92.76], [570.8, 83.72], [570.31, 74.66], [570.04, 65.58], [570.0, 60.12], [570.0, 60.0], [570.0, 59.88], [570.02, 56.51], [570.23, 47.44], [570.48, 41.73], [570.48, 41.6], [570.49, 41.48], [570.49, 41.48], [570.5, 41.36], [570.5, 41.24], [596.97, 40.0], [692.71, 40.0], [744.85, 40.0], [777.69, 40.0]]}, {"camera_id": "camera.family_room", "name": "Family Room Camera", "host_room": "Family Room", "floor": "main", "zones": ["family_room_couch", "family_room_recliner", "family_room_floor", "kitchen_island"], "spillover_targets": [{"room_name": "Kitchen", "overlap_pct": 78.0}, {"room_name": "Front Entry", "overlap_pct": 18.0}], "has_multi_room_bleed": true, "visibility_polygon": [[80.0, 60.0], [270.29, 40.0], [309.08, 40.0], [310.0, 40.0], [310.0, 40.08], [310.0, 40.34], [310.0, 40.43], [310.0, 40.51], [310.0, 41.81], [310.0, 47.77], [310.0, 49.92], [310.0, 50.0], [310.0, 50.03], [310.0, 50.08], [310.0, 50.11], [310.0, 50.19], [310.0, 53.72], [310.0, 59.65], [310.0, 59.92], [310.0, 60.0], [310.0, 60.08], [310.0, 65.59], [310.0, 69.71], [310.0, 69.79], [310.0, 69.87], [310.0, 69.92], [310.0, 70.0], [539.56, 80.14], [539.42, 83.03], [538.68, 94.87], [537.62, 106.69], [536.27, 118.48], [534.61, 130.24], [532.64, 141.94], [530.38, 153.59], [527.81, 165.18], [524.95, 176.7], [521.79, 188.13], [518.34, 199.49], [514.6, 210.75], [510.56, 221.91], [509.04, 225.91], [508.98, 226.06], [508.92, 226.21], [508.43, 227.47], [508.37, 227.62], [508.31, 227.77], [506.24, 232.97], [504.8, 236.48], [504.74, 236.62], [504.68, 236.77], [503.3, 240.04], [503.24, 240.19], [503.18, 240.34], [501.64, 243.9], [499.3, 249.18], [499.23, 249.33], [499.16, 249.48], [497.6, 252.91], [497.53, 253.05], [497.46, 253.2], [496.75, 254.72], [491.59, 265.41], [491.51, 265.57], [491.44, 265.72], [491.36, 265.86], [489.71, 269.13], [489.64, 269.27], [489.57, 269.42], [486.16, 275.96], [480.45, 286.36], [469.22, 290.0], [468.91, 290.0], [468.6, 290.0], [465.03, 290.0], [464.73, 290.0], [464.42, 290.0], [463.44, 290.0], [445.28, 290.0], [445.0, 290.0], [452.65, 295.0], [449.8, 295.0], [445.28, 295.0], [445.0, 295.0], [466.68, 309.15], [461.75, 316.65], [455.0, 326.41], [448.0, 336.0], [440.76, 345.4], [437.81, 349.09], [315.0, 250.0], [315.0, 250.14], [315.0, 253.99], [310.0, 250.0], [310.0, 250.14], [310.0, 251.81], [310.0, 255.24], [310.0, 255.38], [310.0, 255.51], [310.0, 257.36], [310.0, 257.5], [310.0, 257.64], [310.0, 259.48], [310.0, 259.62], [310.0, 259.76], [310.0, 262.09], [310.0, 263.82], [310.0, 263.96], [310.0, 264.11], [310.0, 272.85], [310.0, 284.14], [310.0, 284.95], [310.0, 285.11], [310.0, 285.26], [310.0, 289.84], [310.0, 290.0], [310.0, 290.16], [310.0, 294.73], [310.0, 294.89], [310.0, 295.06], [310.0, 296.01], [310.0, 299.83], [310.0, 300.0], [398.16, 392.23], [396.76, 393.56], [396.65, 393.67], [396.53, 393.78], [394.96, 395.26], [394.84, 395.37], [394.72, 395.48], [392.44, 397.61], [383.63, 405.56], [374.61, 413.28], [372.77, 414.81], [315.0, 345.0], [315.0, 345.2], [315.0, 350.99], [310.0, 345.0], [310.0, 345.2], [310.0, 349.79], [310.0, 350.0], [309.84, 350.0], [309.42, 350.0], [306.26, 350.0], [306.1, 350.0], [305.94, 350.0], [297.5, 350.0], [296.18, 350.0], [296.02, 350.0], [295.86, 350.0], [286.03, 350.0], [274.97, 350.0], [272.49, 350.0], [272.35, 350.0], [272.2, 350.0], [264.29, 350.0], [253.95, 350.0], [243.93, 350.0], [234.2, 350.0]]}, {"camera_id": "camera.garage", "name": "Garage Camera", "host_room": "Garage", "floor": "main", "zones": ["garage_parking"], "spillover_targets": [], "has_multi_room_bleed": false, "visibility_polygon": [[80.0, 375.0], [310.0, 375.0], [309.92, 380.97], [309.69, 386.94], [309.3, 392.91], [308.76, 398.86], [308.06, 404.79], [307.21, 410.7], [306.21, 416.59], [305.05, 422.45], [303.74, 428.28], [302.28, 434.08], [300.67, 439.83], [298.92, 445.54], [297.01, 451.2], [294.96, 456.81], [292.76, 462.37], [290.42, 467.87], [287.94, 473.3], [285.31, 478.67], [282.55, 483.97], [279.65, 489.19], [276.62, 494.34], [273.45, 499.4], [270.15, 504.39], [266.73, 509.28], [264.52, 512.31], [264.47, 512.37], [264.42, 512.44], [263.18, 514.09], [263.09, 514.21], [263.04, 514.27], [262.99, 514.33], [259.5, 518.8], [255.71, 523.41], [251.8, 527.93], [247.76, 532.34], [243.62, 536.64], [239.37, 540.84], [235.01, 544.92], [230.54, 548.89], [223.72, 550.0], [216.27, 550.0], [209.11, 550.0], [202.22, 550.0], [195.57, 550.0], [189.15, 550.0], [182.94, 550.0], [176.91, 550.0], [171.05, 550.0], [165.35, 550.0]]}, {"camera_id": "camera.master_bedroom", "name": "Master Bedroom Camera", "host_room": "Master Bedroom", "floor": "upstairs", "zones": ["master_bed", "master_open_area", "master_bedroom_walkway", "master_bedroom_entryway", "master_bathroom"], "spillover_targets": [{"room_name": "Upstairs Hallway & Stairs", "overlap_pct": 18.0}, {"room_name": "Master Bathroom", "overlap_pct": 18.0}], "has_multi_room_bleed": true, "visibility_polygon": [[920.0, 60.0], [831.34, 350.0], [822.97, 350.0], [814.45, 350.0], [805.77, 350.0], [796.9, 350.0], [787.84, 350.0], [778.56, 350.0], [769.04, 350.0], [767.76, 350.0], [767.63, 350.0], [767.5, 350.0], [765.13, 350.0], [765.0, 350.0], [698.31, 474.43], [692.14, 471.07], [686.96, 468.16], [686.81, 468.07], [686.67, 467.99], [681.46, 464.97], [670.94, 458.58], [660.96, 452.17], [725.0, 355.0], [724.85, 355.0], [724.74, 355.0], [721.79, 355.0], [725.0, 350.0], [724.85, 350.0], [716.94, 350.0], [705.41, 350.0], [693.43, 350.0], [680.94, 350.0], [667.91, 350.0], [654.26, 350.0], [650.42, 350.0], [650.23, 350.0], [650.04, 350.0], [644.94, 350.0], [644.75, 350.0], [644.55, 350.0], [639.95, 350.0], [624.89, 350.0], [609.98, 350.0], [609.77, 350.0], [609.55, 350.0], [609.01, 350.0], [592.21, 350.0], [579.66, 350.0], [579.42, 350.0], [579.18, 350.0], [574.39, 350.0], [555.42, 350.0], [544.64, 342.85], [541.24, 338.28], [541.14, 338.15], [541.05, 338.02], [537.37, 332.93], [530.35, 322.82], [525.0, 311.88], [525.0, 311.68], [525.0, 311.64], [525.0, 311.49], [525.0, 309.67], [525.0, 309.47], [525.0, 309.28], [525.0, 297.34], [525.0, 283.9], [525.0, 283.72], [525.0, 283.53], [525.0, 283.48], [525.0, 281.94], [525.0, 281.75], [525.0, 281.57], [525.0, 270.03], [525.0, 261.14], [525.0, 260.96], [525.0, 260.79], [525.0, 257.67], [525.0, 257.5], [525.0, 257.33], [525.0, 256.94], [525.0, 244.19], [525.0, 231.75], [525.0, 220.16], [525.0, 220.0], [520.0, 221.86], [520.0, 221.61], [520.0, 220.16], [520.0, 220.0], [483.56, 234.4], [479.76, 224.6], [475.61, 213.02], [474.81, 210.67], [474.75, 210.52], [474.7, 210.36], [474.41, 209.49], [474.35, 209.33], [474.3, 209.18], [471.75, 201.33], [470.34, 196.78], [525.0, 180.0], [525.0, 179.85], [525.0, 178.65], [525.0, 178.5], [525.0, 178.35], [525.0, 173.26], [525.0, 168.51], [525.0, 168.36], [525.0, 168.21], [525.0, 167.56], [525.0, 167.41], [525.0, 167.26], [525.0, 162.15], [525.0, 153.7], [525.0, 153.55], [525.0, 153.41], [525.0, 151.19], [525.0, 151.03], [525.0, 150.89], [525.0, 150.74], [525.0, 150.23], [525.0, 150.09], [525.0, 149.94], [525.0, 149.02], [525.0, 148.88], [525.0, 148.73], [525.0, 140.36], [525.0, 129.65], [525.0, 126.56], [525.0, 126.42], [525.0, 126.27], [525.0, 125.97], [525.0, 125.83], [525.0, 125.69], [525.0, 123.06], [525.0, 122.92], [525.0, 122.78], [525.0, 119.03], [525.0, 108.5], [525.0, 98.03], [525.0, 87.62], [525.0, 77.25], [525.0, 66.89], [525.0, 56.55], [525.0, 46.28], [525.0, 46.21], [525.0, 46.14], [525.0, 46.0], [525.0, 40.14], [525.0, 40.0], [527.71, 40.0], [593.0, 40.0], [691.4, 40.0], [744.46, 40.0], [777.69, 40.0], [800.48, 40.0], [817.11, 40.0], [829.79, 40.0], [839.78, 40.0], [847.88, 40.0], [854.58, 40.0], [860.23, 40.0], [865.05, 40.0], [869.23, 40.0], [872.88, 40.0]]}, {"camera_id": "camera.nursery", "name": "Nursery Camera", "host_room": "Margot's Room", "floor": "upstairs", "zones": ["nursery_bed"], "spillover_targets": [{"room_name": "Upstairs Hallway & Stairs", "overlap_pct": 18.0}], "has_multi_room_bleed": true, "visibility_polygon": [[80.0, 55.0], [138.0, 40.0], [144.93, 40.0], [153.61, 40.0], [164.84, 40.0], [179.95, 40.0], [201.4, 40.0], [234.3, 40.0], [291.26, 40.0], [348.31, 40.0], [350.0, 40.0], [350.0, 40.09], [350.0, 42.88], [350.0, 45.8], [350.0, 45.9], [350.0, 45.99], [350.0, 49.92], [350.0, 56.94], [350.0, 63.97], [350.0, 71.02], [350.0, 78.08], [350.0, 85.18], [350.0, 92.31], [350.0, 99.5], [350.0, 106.75], [350.0, 113.2], [350.0, 113.3], [350.0, 113.39], [350.0, 114.08], [350.0, 121.48], [350.0, 128.99], [350.0, 130.74], [350.0, 130.84], [350.0, 130.94], [350.0, 131.6], [350.0, 131.7], [350.0, 131.81], [350.0, 136.6], [350.0, 144.33], [350.0, 148.17], [350.0, 148.27], [350.0, 148.38], [350.0, 152.2], [350.0, 153.08], [350.0, 153.18], [350.0, 153.29], [350.0, 154.89], [350.0, 155.0], [370.66, 162.77], [368.84, 167.55], [365.82, 175.03], [362.6, 182.43], [359.19, 189.74], [358.32, 191.51], [355.0, 190.0], [355.0, 190.12], [355.0, 192.38], [350.0, 190.0], [349.76, 190.0], [342.07, 190.0], [340.58, 190.0], [340.36, 190.0], [340.13, 190.0], [326.12, 190.0], [312.22, 190.0], [312.03, 190.0], [311.85, 190.0], [311.61, 190.0], [307.99, 190.0], [307.81, 190.0], [307.63, 190.0], [298.34, 190.0], [286.15, 190.0], [274.89, 190.0], [269.55, 190.0], [269.41, 190.0], [269.27, 190.0], [266.11, 190.0], [265.97, 190.0], [265.83, 190.0], [264.44, 190.0], [254.71, 190.0], [245.62, 190.0], [237.09, 190.0], [229.06, 190.0], [221.48, 190.0], [214.3, 190.0], [207.48, 190.0], [205.78, 190.0], [205.69, 190.0], [205.6, 190.0], [203.65, 190.0], [203.56, 190.0], [203.47, 190.0], [200.99, 190.0], [194.8, 190.0], [194.31, 190.0], [194.23, 190.0], [194.15, 190.0], [192.23, 190.0], [192.15, 190.0], [192.07, 190.0], [188.88, 190.0], [183.2, 190.0], [181.79, 190.0], [181.71, 190.0], [181.64, 190.0], [179.94, 190.0], [179.86, 190.0], [179.79, 190.0], [177.74, 190.0], [172.48, 190.0], [167.41, 190.0], [162.5, 190.0], [157.75, 190.0], [153.14, 190.0], [148.66, 190.0], [144.29, 190.0], [140.03, 190.0], [135.87, 190.0], [131.8, 190.0], [127.81, 190.0]]}, {"camera_id": "camera.office", "name": "Office Camera", "host_room": "Office", "floor": "upstairs", "zones": ["steves_desk", "sim_rig", "office_floor", "office_entryway"], "spillover_targets": [{"room_name": "Upstairs Hallway & Stairs", "overlap_pct": 18.0}], "has_multi_room_bleed": true, "visibility_polygon": [[80.0, 530.0], [128.23, 350.0], [133.32, 350.0], [138.49, 350.0], [143.74, 350.0], [149.1, 350.0], [154.56, 350.0], [160.14, 350.0], [165.86, 350.0], [171.71, 350.0], [177.73, 350.0], [183.92, 350.0], [190.3, 350.0], [196.89, 350.0], [203.71, 350.0], [209.5, 350.0], [209.6, 350.0], [209.7, 350.0], [210.17, 350.0], [210.26, 350.0], [210.36, 350.0], [210.78, 350.0], [211.9, 350.0], [212.0, 350.0], [212.1, 350.0], [218.12, 350.0], [222.84, 350.0], [222.94, 350.0], [223.04, 350.0], [224.97, 350.0], [225.07, 350.0], [225.18, 350.0], [225.48, 350.0], [225.59, 350.0], [225.69, 350.0], [225.76, 350.0], [233.73, 350.0], [234.18, 350.0], [234.29, 350.0], [234.39, 350.0], [237.03, 350.0], [237.14, 350.0], [237.25, 350.0], [242.07, 350.0], [250.81, 350.0], [254.07, 350.0], [254.19, 350.0], [254.32, 350.0], [257.3, 350.0], [257.42, 350.0], [257.54, 350.0], [260.0, 350.0], [269.68, 350.0], [279.91, 350.0], [290.75, 350.0], [302.28, 350.0], [314.58, 350.0], [327.75, 350.0], [341.9, 350.0], [342.51, 350.0], [342.7, 350.0], [342.9, 350.0], [349.8, 350.0], [350.0, 350.0], [350.0, 350.14], [350.0, 354.66], [350.0, 364.54], [350.0, 374.12], [350.0, 379.88], [350.0, 380.0], [355.0, 377.35], [355.0, 379.88], [355.0, 380.0], [369.76, 372.08], [370.01, 372.54], [374.03, 380.18], [377.85, 387.93], [381.47, 395.78], [384.88, 403.71], [385.57, 405.39], [350.0, 420.0], [350.0, 420.11], [350.0, 420.68], [350.0, 420.79], [350.0, 420.9], [350.0, 421.89], [350.0, 422.0], [350.0, 422.11], [350.0, 426.36], [350.0, 434.39], [350.0, 442.27], [350.0, 450.02], [350.0, 457.65], [350.0, 465.18], [350.0, 472.61], [350.0, 479.96], [350.0, 487.24], [350.0, 490.63], [350.0, 490.73], [350.0, 490.82], [350.0, 494.45], [350.0, 497.67], [350.0, 497.76], [350.0, 497.86], [350.0, 501.48], [350.0, 501.58], [350.0, 501.62], [350.0, 501.67], [350.0, 505.36], [350.0, 505.45], [350.0, 505.55], [350.0, 508.75], [350.0, 515.85], [350.0, 522.93], [350.0, 530.0], [350.0, 537.07], [350.0, 544.15], [350.0, 549.91], [350.0, 550.0], [348.73, 550.0], [334.12, 550.0], [270.29, 550.0], [231.92, 550.0], [206.28, 550.0], [187.91, 550.0], [174.09, 550.0], [163.31, 550.0], [154.64, 550.0]]}, {"camera_id": "camera.basement_theater", "name": "Basement Theater Camera", "host_room": "Basement Theater", "floor": "basement", "zones": ["basement_theater_couch", "basement_theater_playpen", "basement_theater_floor", "basement_bar", "basement_play_area_far", "basement_stairwell"], "spillover_targets": [{"room_name": "Basement Play Area", "overlap_pct": 35.0}], "has_multi_room_bleed": true, "visibility_polygon": [[920.0, 515.0], [832.81, 540.0], [823.33, 540.0], [811.71, 540.0], [797.12, 540.0], [778.22, 540.0], [752.72, 540.0], [716.39, 540.0], [660.37, 540.0], [631.18, 540.0], [630.0, 540.0], [630.0, 539.9], [630.0, 539.68], [630.0, 539.58], [630.0, 539.47], [630.0, 535.28], [630.0, 527.66], [630.0, 527.08], [630.0, 526.99], [630.0, 526.98], [630.0, 526.89], [630.0, 526.88], [630.0, 526.78], [630.0, 520.06], [630.0, 512.47], [630.0, 504.87], [630.0, 497.26], [630.0, 489.63], [630.0, 481.96], [630.0, 474.24], [630.0, 466.47], [630.0, 460.91], [630.0, 460.8], [630.0, 460.7], [630.0, 460.46], [630.0, 460.36], [630.0, 460.25], [630.0, 458.63], [630.0, 450.71], [630.0, 443.8], [630.0, 443.69], [630.0, 443.58], [630.0, 443.21], [630.0, 443.1], [630.0, 442.99], [630.0, 442.69], [630.0, 434.58], [630.0, 426.34], [630.0, 424.78], [630.0, 424.67], [630.0, 424.56], [630.0, 422.41], [630.0, 422.3], [630.0, 422.18], [630.0, 421.72], [630.0, 421.61], [630.0, 421.5], [630.0, 420.11], [630.0, 420.0], [406.89, 346.71], [407.91, 343.66], [412.57, 330.31], [417.57, 317.09], [422.93, 304.01], [428.62, 291.07], [434.65, 278.28], [441.01, 265.66], [444.63, 258.83], [444.72, 258.66], [444.81, 258.5], [445.52, 257.19], [445.61, 257.02], [445.7, 256.86], [447.71, 253.2], [454.72, 240.93], [456.52, 237.89], [456.62, 237.73], [456.72, 237.57], [457.53, 236.21], [457.63, 236.05], [457.73, 235.89], [460.92, 230.67], [461.02, 230.51], [461.12, 230.35], [462.05, 228.84], [469.7, 216.95], [476.83, 206.46], [476.93, 206.31], [477.04, 206.15], [477.66, 205.27], [485.92, 193.8], [494.47, 182.54], [503.32, 171.52], [512.46, 160.73], [521.87, 150.18], [531.68, 140.0], [551.49, 140.0], [570.31, 140.0], [588.23, 140.0], [605.34, 140.0], [608.16, 140.0], [625.0, 160.0], [625.0, 159.75], [625.0, 154.14], [630.0, 160.0], [630.0, 159.75], [630.0, 150.42], [630.0, 146.62], [630.0, 146.36], [630.0, 146.09], [630.0, 130.16], [630.0, 108.43], [630.0, 90.32], [630.0, 90.0], [630.22, 90.0], [633.33, 90.0], [649.25, 90.0], [664.63, 90.0], [679.55, 90.0], [694.02, 90.0], [708.1, 90.0], [721.82, 90.0], [735.2, 90.0], [748.29, 90.0], [761.1, 90.0], [773.66, 90.0], [786.0, 90.0], [798.13, 90.0], [810.09, 90.0], [821.88, 90.0], [833.53, 90.0], [845.06, 90.0]]}, {"camera_id": "camera.basement_play_area", "name": "Basement Play Area Camera", "host_room": "Basement Play Area", "floor": "basement", "zones": ["basement_play_floor", "basement_counter", "theater_rear_view"], "spillover_targets": [{"room_name": "Basement Theater", "overlap_pct": 18.0}], "has_multi_room_bleed": true, "visibility_polygon": [[340.0, 515.0], [353.1, 140.0], [362.83, 140.0], [372.6, 140.0], [382.4, 140.0], [392.27, 140.0], [402.21, 140.0], [412.24, 140.0], [422.36, 140.0], [432.6, 140.0], [442.97, 140.0], [453.5, 140.0], [464.18, 140.0], [475.06, 140.0], [486.13, 140.0], [497.44, 140.0], [508.99, 140.0], [520.81, 140.0], [532.94, 140.0], [545.39, 140.0], [558.2, 140.0], [571.4, 140.0], [585.03, 140.0], [593.51, 143.2], [593.64, 143.29], [593.77, 143.38], [595.82, 144.79], [605.32, 151.54], [612.16, 156.63], [612.29, 156.73], [612.41, 156.82], [614.65, 158.53], [621.59, 163.99], [621.72, 164.09], [621.84, 164.19], [623.78, 165.76], [624.57, 166.4], [624.69, 166.5], [624.81, 166.6], [632.73, 173.23], [641.49, 180.92], [650.04, 188.84], [658.38, 196.98], [666.51, 205.33], [674.42, 213.89], [682.1, 222.65], [689.56, 231.61], [696.78, 240.76], [703.76, 250.09], [710.5, 259.6], [716.99, 269.28], [723.22, 279.12], [729.2, 289.12], [734.92, 299.28], [740.38, 309.58], [745.56, 320.01], [750.47, 330.58], [755.11, 341.27], [759.47, 352.08], [763.55, 363.0], [766.86, 372.55], [625.0, 420.0], [625.0, 420.11], [625.0, 420.98], [625.0, 421.53], [625.0, 421.64], [625.0, 421.75], [625.0, 429.09], [625.0, 437.08], [625.0, 444.96], [625.0, 452.74], [625.0, 460.43], [625.0, 468.05], [625.0, 475.6], [625.0, 483.1], [625.0, 490.55], [625.0, 497.97], [625.0, 505.37], [625.0, 512.75], [625.0, 520.14], [625.0, 526.78], [625.0, 526.87], [625.0, 526.97], [625.0, 527.52], [625.0, 534.93]]}, {"camera_id": "camera.storage_room", "name": "Storage Room Camera", "host_room": "Storage Room", "floor": "basement", "zones": ["storage_room_workout"], "spillover_targets": [], "has_multi_room_bleed": false, "visibility_polygon": [[80.0, 110.0], [310.0, 91.9], [310.0, 97.91], [310.0, 103.91], [310.0, 109.89], [310.0, 115.88], [310.0, 121.88], [310.0, 127.89], [310.0, 133.92], [310.0, 139.28], [310.0, 139.36], [310.0, 139.44], [310.0, 139.99], [310.0, 146.1], [310.0, 149.07], [310.0, 149.15], [310.0, 149.23], [310.0, 149.92], [310.0, 150.0], [316.44, 151.2], [316.05, 153.38], [314.84, 159.5], [313.47, 165.6], [311.95, 171.66], [310.26, 177.67], [308.42, 183.64], [308.38, 183.77], [308.36, 183.85], [308.33, 183.93], [307.91, 185.22], [307.88, 185.3], [307.86, 185.38], [306.43, 189.56], [304.28, 195.42], [301.98, 201.23], [299.53, 206.98], [296.94, 212.66], [294.19, 218.27], [291.3, 223.81], [288.27, 229.27], [285.09, 234.65], [281.78, 239.94], [278.33, 245.15], [274.75, 250.26], [271.03, 255.29], [267.18, 260.21], [263.21, 265.03], [259.11, 269.74], [257.29, 271.76], [257.24, 271.82], [257.18, 271.89], [255.38, 273.83], [255.33, 273.89], [255.27, 273.95], [254.9, 274.35], [250.56, 278.85], [246.11, 283.23], [242.71, 286.43], [242.64, 286.49], [242.58, 286.54], [241.54, 287.49], [240.81, 288.16], [240.74, 288.22], [240.68, 288.27], [236.87, 291.64], [232.09, 295.66], [227.21, 299.55], [222.23, 303.32], [217.15, 306.95], [211.97, 310.46], [206.71, 313.82], [201.37, 317.05], [195.86, 320.0], [188.83, 320.0], [181.99, 320.0], [175.31, 320.0], [168.8, 320.0], [162.42, 320.0], [156.18, 320.0], [150.05, 320.0], [144.03, 320.0], [138.1, 320.0], [132.26, 320.0], [126.49, 320.0], [120.79, 320.0], [115.14, 320.0]]}], "room_coverage": {"Margot's Room": {"primary_cameras": [{"camera_id": "camera.nursery", "coverage_pct": 84.0}], "spillover_cameras": [], "max_coverage_pct": 84.0}, "Guest Room": {"primary_cameras": [], "spillover_cameras": [], "max_coverage_pct": 0.0}, "Office": {"primary_cameras": [{"camera_id": "camera.office", "coverage_pct": 84.0}], "spillover_cameras": [], "max_coverage_pct": 84.0}, "Upstairs Hallway & Stairs": {"primary_cameras": [], "spillover_cameras": [{"camera_id": "camera.master_bedroom", "host_room": "Master Bedroom", "overlap_pct": 18.0}, {"camera_id": "camera.nursery", "host_room": "Margot's Room", "overlap_pct": 18.0}, {"camera_id": "camera.office", "host_room": "Office", "overlap_pct": 18.0}], "max_coverage_pct": 18.0}, "Master Bedroom": {"primary_cameras": [{"camera_id": "camera.master_bedroom", "coverage_pct": 84.0}], "spillover_cameras": [], "max_coverage_pct": 84.0}, "Master Bathroom": {"primary_cameras": [], "spillover_cameras": [{"camera_id": "camera.master_bedroom", "host_room": "Master Bedroom", "overlap_pct": 18.0}], "max_coverage_pct": 18.0}, "Family Room": {"primary_cameras": [{"camera_id": "camera.family_room", "coverage_pct": 65.0}], "spillover_cameras": [], "max_coverage_pct": 65.0}, "Kitchen": {"primary_cameras": [], "spillover_cameras": [{"camera_id": "camera.living_room", "host_room": "Living Room", "overlap_pct": 7.0}, {"camera_id": "camera.family_room", "host_room": "Family Room", "overlap_pct": 78.0}], "max_coverage_pct": 78.0}, "Dining Room": {"primary_cameras": [{"camera_id": "camera.dining_room", "coverage_pct": 65.0}], "spillover_cameras": [{"camera_id": "camera.living_room", "host_room": "Living Room", "overlap_pct": 6.0}], "max_coverage_pct": 65.0}, "Living Room": {"primary_cameras": [{"camera_id": "camera.living_room", "coverage_pct": 65.0}], "spillover_cameras": [], "max_coverage_pct": 65.0}, "Front Entry": {"primary_cameras": [], "spillover_cameras": [{"camera_id": "camera.living_room", "host_room": "Living Room", "overlap_pct": 35.0}, {"camera_id": "camera.family_room", "host_room": "Family Room", "overlap_pct": 18.0}], "max_coverage_pct": 35.0}, "Garage": {"primary_cameras": [{"camera_id": "camera.garage", "coverage_pct": 65.0}], "spillover_cameras": [], "max_coverage_pct": 65.0}, "Storage Room": {"primary_cameras": [{"camera_id": "camera.storage_room", "coverage_pct": 70.0}], "spillover_cameras": [], "max_coverage_pct": 70.0}, "Basement Bathroom": {"primary_cameras": [], "spillover_cameras": [], "max_coverage_pct": 0.0}, "Basement Play Area": {"primary_cameras": [{"camera_id": "camera.basement_play_area", "coverage_pct": 88.0}], "spillover_cameras": [{"camera_id": "camera.basement_theater", "host_room": "Basement Theater", "overlap_pct": 35.0}], "max_coverage_pct": 88.0}, "Basement Theater": {"primary_cameras": [{"camera_id": "camera.basement_theater", "coverage_pct": 82.0}], "spillover_cameras": [{"camera_id": "camera.basement_play_area", "host_room": "Basement Play Area", "overlap_pct": 18.0}], "max_coverage_pct": 82.0}}, "ambiguities": [{"severity": "high", "category": "camera_spillover", "title": "Living Room Camera cone spills into Kitchen, Dining Room, Front Entry", "rooms": ["Living Room", "Kitchen", "Dining Room", "Front Entry"], "camera_id": "camera.living_room", "description": "`camera.living_room` (hosted in Living Room) also sees Kitchen, Dining Room, Front Entry. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Living Room occupied.", "resolution": "Downgrade binary_sensor.living_room_person_occupancy to `supporting` and trigger Living Room only from interior Frigate sub-zones."}, {"severity": "high", "category": "camera_spillover", "title": "Family Room Camera cone spills into Kitchen, Front Entry", "rooms": ["Family Room", "Kitchen", "Front Entry"], "camera_id": "camera.family_room", "description": "`camera.family_room` (hosted in Family Room) also sees Kitchen, Front Entry. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Family Room occupied.", "resolution": "Downgrade binary_sensor.family_room_person_occupancy to `supporting` and trigger Family Room only from interior Frigate sub-zones."}, {"severity": "high", "category": "camera_spillover", "title": "Master Bedroom Camera cone spills into Upstairs Hallway & Stairs, Master Bathroom", "rooms": ["Master Bedroom", "Upstairs Hallway & Stairs", "Master Bathroom"], "camera_id": "camera.master_bedroom", "description": "`camera.master_bedroom` (hosted in Master Bedroom) also sees Upstairs Hallway & Stairs, Master Bathroom. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Master Bedroom occupied.", "resolution": "Downgrade binary_sensor.master_bedroom_person_occupancy, binary_sensor.master_bedroom_entryway_person_occupancy to `supporting` and trigger Master Bedroom only from interior Frigate sub-zones."}, {"severity": "high", "category": "camera_spillover", "title": "Nursery Camera cone spills into Upstairs Hallway & Stairs", "rooms": ["Margot's Room", "Upstairs Hallway & Stairs"], "camera_id": "camera.nursery", "description": "`camera.nursery` (hosted in Margot's Room) also sees Upstairs Hallway & Stairs. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Margot's Room occupied.", "resolution": "Downgrade binary_sensor.nursery_person_occupancy to `supporting` and trigger Margot's Room only from interior Frigate sub-zones."}, {"severity": "high", "category": "camera_spillover", "title": "Office Camera cone spills into Upstairs Hallway & Stairs", "rooms": ["Office", "Upstairs Hallway & Stairs"], "camera_id": "camera.office", "description": "`camera.office` (hosted in Office) also sees Upstairs Hallway & Stairs. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Office occupied.", "resolution": "Downgrade binary_sensor.office_person_occupancy, binary_sensor.office_entryway_person_occupancy to `supporting` and trigger Office only from interior Frigate sub-zones."}, {"severity": "high", "category": "camera_spillover", "title": "Basement Theater Camera cone spills into Basement Play Area", "rooms": ["Basement Theater", "Basement Play Area"], "camera_id": "camera.basement_theater", "description": "`camera.basement_theater` (hosted in Basement Theater) also sees Basement Play Area. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Basement Theater occupied.", "resolution": "Downgrade binary_sensor.basement_theater_person_occupancy, binary_sensor.basement_stairwell_person_occupancy to `supporting` and trigger Basement Theater only from interior Frigate sub-zones."}, {"severity": "high", "category": "camera_spillover", "title": "Basement Play Area Camera cone spills into Basement Theater", "rooms": ["Basement Play Area", "Basement Theater"], "camera_id": "camera.basement_play_area", "description": "`camera.basement_play_area` (hosted in Basement Play Area) also sees Basement Theater. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Basement Play Area occupied.", "resolution": "Downgrade binary_sensor.basement_play_area_person_occupancy, binary_sensor.basement_stairwell_person_occupancy to `supporting` and trigger Basement Play Area only from interior Frigate sub-zones."}, {"severity": "medium", "category": "blind_pocket", "title": "Guest Room (between Nursery & Office) has zero camera coverage", "rooms": ["Guest Room", "Margot's Room", "Office"], "camera_id": null, "description": "Guest Room sits between Margot's Room and Office off the Upstairs Hallway with no camera view cone and its Ecobee sensor awaiting battery replacement.", "resolution": "Use `guest_room_motion` (moderate) + `guest_room_occupancy` (supporting) + BLE corroboration, with instant timer hand-off to Office, Nursery, and Master Bedroom."}, {"severity": "low", "category": "blind_pocket", "title": "Basement Bathroom is out of frame left of Play Area camera", "rooms": ["Basement Play Area", "Storage Room"], "camera_id": "camera.basement_play_area", "description": "Located to the left of `camera.basement_play_area` alongside Storage Room, with an unmonitored door and no interior sensors.", "resolution": "Treat left edge exit from Basement Play Area as an unsealed transition; Storage Room uses its internal `camera.storage_room` to distinguish gym/storage entry."}, {"severity": "medium", "category": "vertical_ble_bleed", "title": "Vertical BLE stack: Margot's Room directly above Family Room (86% overlap)", "rooms": ["Margot's Room", "Family Room"], "camera_id": null, "description": "Margot's Room (Upstairs) sits directly over Family Room (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.", "resolution": "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor."}, {"severity": "medium", "category": "vertical_ble_bleed", "title": "Vertical BLE stack: Guest Room directly above Family Room (86% overlap)", "rooms": ["Guest Room", "Family Room"], "camera_id": null, "description": "Guest Room (Upstairs) sits directly over Family Room (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.", "resolution": "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor."}, {"severity": "medium", "category": "vertical_ble_bleed", "title": "Vertical BLE stack: Office directly above Garage (100% overlap)", "rooms": ["Office", "Garage"], "camera_id": null, "description": "Office (Upstairs) sits directly over Garage (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.", "resolution": "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor."}, {"severity": "medium", "category": "vertical_ble_bleed", "title": "Vertical BLE stack: Master Bedroom directly above Dining Room (100% overlap)", "rooms": ["Master Bedroom", "Dining Room"], "camera_id": null, "description": "Master Bedroom (Upstairs) sits directly over Dining Room (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.", "resolution": "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor."}, {"severity": "medium", "category": "vertical_ble_bleed", "title": "Vertical BLE stack: Master Bathroom directly above Living Room (100% overlap)", "rooms": ["Master Bathroom", "Living Room"], "camera_id": null, "description": "Master Bathroom (Upstairs) sits directly over Living Room (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.", "resolution": "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor."}], "compiled_room_rules": {"Margot's Room": {"room_name": "Margot's Room", "connected_rooms": ["Front Entry", "Guest Room", "Master Bedroom", "Office"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)"], "recommended_inactivity_timeout": 300, "spillover_entities_to_downgrade": ["binary_sensor.nursery_person_occupancy"], "max_camera_coverage_pct": 84.0}, "Guest Room": {"room_name": "Guest Room", "connected_rooms": ["Front Entry", "Margot's Room", "Master Bedroom", "Office"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)"], "recommended_inactivity_timeout": 300, "spillover_entities_to_downgrade": [], "max_camera_coverage_pct": 0.0}, "Office": {"room_name": "Office", "connected_rooms": ["Front Entry", "Guest Room", "Margot's Room", "Master Bedroom"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)"], "recommended_inactivity_timeout": 240, "spillover_entities_to_downgrade": ["binary_sensor.office_person_occupancy", "binary_sensor.office_entryway_person_occupancy"], "max_camera_coverage_pct": 84.0}, "Master Bedroom": {"room_name": "Master Bedroom", "connected_rooms": ["Front Entry", "Guest Room", "Margot's Room", "Master Bathroom", "Office"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)", "Master Bathroom (unmonitored door)"], "recommended_inactivity_timeout": 300, "spillover_entities_to_downgrade": ["binary_sensor.master_bedroom_person_occupancy", "binary_sensor.master_bedroom_entryway_person_occupancy"], "max_camera_coverage_pct": 84.0}, "Master Bathroom": {"room_name": "Master Bathroom", "connected_rooms": ["Master Bedroom"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Master Bedroom (unmonitored door)"], "recommended_inactivity_timeout": 600, "spillover_entities_to_downgrade": [], "max_camera_coverage_pct": 18.0}, "Family Room": {"room_name": "Family Room", "connected_rooms": ["Basement Play Area", "Basement Theater", "Front Entry", "Garage", "Kitchen"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Front Entry (open passage)", "Kitchen (open passage)", "Garage (unmonitored door)", "Basement Play Area (stairs)", "Basement Theater (stairs)"], "recommended_inactivity_timeout": 180, "spillover_entities_to_downgrade": ["binary_sensor.family_room_person_occupancy"], "max_camera_coverage_pct": 65.0}, "Kitchen": {"room_name": "Kitchen", "connected_rooms": ["Dining Room", "Family Room", "Front Entry"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Front Entry (open passage)", "Dining Room (open passage)", "Family Room (open passage)"], "recommended_inactivity_timeout": 180, "spillover_entities_to_downgrade": [], "max_camera_coverage_pct": 78.0}, "Dining Room": {"room_name": "Dining Room", "connected_rooms": ["Kitchen", "Living Room"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Living Room (open passage)", "Kitchen (open passage)"], "recommended_inactivity_timeout": 180, "spillover_entities_to_downgrade": [], "max_camera_coverage_pct": 65.0}, "Living Room": {"room_name": "Living Room", "connected_rooms": ["Dining Room", "Front Entry"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Front Entry (open passage)", "Dining Room (open passage)"], "recommended_inactivity_timeout": 180, "spillover_entities_to_downgrade": ["binary_sensor.living_room_person_occupancy"], "max_camera_coverage_pct": 65.0}, "Front Entry": {"room_name": "Front Entry", "connected_rooms": ["Family Room", "Guest Room", "Kitchen", "Living Room", "Margot's Room", "Master Bedroom", "Office"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Living Room (open passage)", "Kitchen (open passage)", "Family Room (open passage)", "Upstairs Hallway & Stairs (stairs)"], "recommended_inactivity_timeout": 60, "spillover_entities_to_downgrade": [], "max_camera_coverage_pct": 35.0}, "Garage": {"room_name": "Garage", "connected_rooms": ["Family Room"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Family Room (unmonitored door)"], "recommended_inactivity_timeout": 180, "spillover_entities_to_downgrade": [], "max_camera_coverage_pct": 65.0}, "Storage Room": {"room_name": "Storage Room", "connected_rooms": ["Basement Play Area"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Basement Play Area (unmonitored door)"], "recommended_inactivity_timeout": 180, "spillover_entities_to_downgrade": [], "max_camera_coverage_pct": 70.0}, "Basement Play Area": {"room_name": "Basement Play Area", "connected_rooms": ["Basement Theater", "Family Room", "Storage Room"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Family Room (stairs)", "Basement Theater (open passage)", "Storage Room (unmonitored door)", "Basement Bathroom (unmonitored door)"], "recommended_inactivity_timeout": 180, "spillover_entities_to_downgrade": ["binary_sensor.basement_play_area_person_occupancy", "binary_sensor.basement_stairwell_person_occupancy"], "max_camera_coverage_pct": 88.0}, "Basement Theater": {"room_name": "Basement Theater", "connected_rooms": ["Basement Play Area", "Family Room"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Family Room (stairs)", "Basement Play Area (open passage)"], "recommended_inactivity_timeout": 240, "spillover_entities_to_downgrade": ["binary_sensor.basement_theater_person_occupancy", "binary_sensor.basement_stairwell_person_occupancy"], "max_camera_coverage_pct": 82.0}}};

class PresenceDetectionDesignerPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._overview = null;
    this._selectedRoomId = null;
    this._draftConfig = null;
    this._previewData = null;
    this._dirty = false;
    this._roomSearch = "";
    this._roomFilter = "all"; // "all" | "occupied" | "vacant"
    this._studioView = "design"; // "design" | "floorplan" | "statistics" | "replay"
    this._showAdvanced = false;
    this._advTab = "tuning"; // "tuning" | "truth" | "yaml" | "revisions"
    this._rightTab = "yaml"; // "yaml" | "ha_yaml" | "nl" | "guide"
    this._nlPrompt = "";
    this._nlOutput = "";
    this._yamlDraft = "";
    this._revisionNote = "";
    this._showGlobalModal = false;
    this._globalDraft = null;
    this._floorplan = this._loadLocalOrDefaultFloorplan();
    this._compiledTopology = this._compileFloorplanClient(this._floorplan);
    this._selectedFloorId = "main";
    this._selectedCamEntity = null;
    this._showFloorplanInspector = false;
    this._historyHours = 6;
    this._statsData = null;
    this._replayData = null;
    this._replayCandidate = null;
    this._toast = null;
    this._loading = false;
    this._narrow = false;
    this._initialized = false;
    this._selectedRoomBoxName = null;
    this._selectedDoorId = null;
    this._activeFpDrag = null;
    this._saveFpTimeout = null;
    this._canvasRenderRaf = null;
  }

  set narrow(value) {
    const next = Boolean(value);
    if (this._narrow !== next) {
      this._narrow = next;
      if (this._initialized) {
        this.render();
      }
    }
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._initialized) {
      this._initialized = true;
      this.loadOverview();
    }
  }

  connectedCallback() {
    if (!this._initialized) {
      this._initialized = true;
      this.render();
      this.loadOverview();
    }
  }

  showToast(message, type = "info") {
    this._toast = { message, type };
    this.renderToastOnly();
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      this._toast = null;
      this.renderToastOnly();
    }, 3500);
  }

  renderToastOnly() {
    const el = this.shadowRoot.querySelector("#pdd-toast-container");
    if (!el) return;
    if (!this._toast) {
      el.innerHTML = "";
      return;
    }
    const bg =
      this._toast.type === "error"
        ? "var(--error-color, #dc2626)"
        : this._toast.type === "success"
        ? "var(--success-color, #16a34a)"
        : "var(--primary-color, #0284c7)";
    el.innerHTML = `<div style="background:${bg};color:#fff;padding:10px 18px;border-radius:8px;box-shadow:0 4px 14px rgba(0,0,0,0.18);font-weight:500;font-size:13px;">${this._escape(
      this._toast.message
    )}</div>`;
  }

  async _apiCall(method, path, body = null) {
    if (window.__PDD_MOCK_API__) {
      return window.__PDD_MOCK_API__(method, path, body);
    }
    if (this._hass && typeof this._hass.callApi === "function") {
      const cleanPath = path.replace(/^\/api\//, "");
      return await this._hass.callApi(method, cleanPath, body);
    }
    const headers = { "Content-Type": "application/json" };
    if (this._hass && this._hass.auth && this._hass.auth.data && this._hass.auth.data.access_token) {
      headers["Authorization"] = `Bearer ${this._hass.auth.data.access_token}`;
    }
    const opts = { method, headers };
    if (body !== null) opts.body = JSON.stringify(body);
    const resp = await fetch(path, opts);
    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(txt || `HTTP ${resp.status}`);
    }
    return await resp.json();
  }

  _getDefaultFloorplan() {
    return JSON.parse(JSON.stringify(PDD_DEFAULT_FLOORPLAN));
  }

  _loadLocalOrDefaultFloorplan() {
    try {
      const saved = window.localStorage.getItem("pdd_floorplan_layout_v1");
      if (saved) {
        const parsed = JSON.loads ? JSON.loads(saved) : JSON.parse(saved);
        if (parsed && Array.isArray(parsed.floors) && Array.isArray(parsed.rooms)) {
          return parsed;
        }
      }
    } catch (_e) {
      // ignore storage errors
    }
    return this._getDefaultFloorplan();
  }

  _snapValue(val, step = 10) {
    return Math.round(val / step) * step;
  }

  _snapRoomGeometry(box, otherRooms, snapDist = 8) {
    let x = this._snapValue(box.x);
    let y = this._snapValue(box.y);
    let w = Math.max(60, this._snapValue(box.width ?? box.w ?? 200));
    let h = Math.max(50, this._snapValue(box.height ?? box.h ?? 150));
    const r = x + w;
    const b = y + h;

    for (const other of otherRooms) {
      if (other === box) continue;
      const ox = Number(other.x);
      const oy = Number(other.y);
      const ow = Number(other.width ?? other.w ?? 200);
      const oh = Number(other.height ?? other.h ?? 150);
      const oright = ox + ow;
      const obottom = oy + oh;

      if (Math.abs(x - ox) <= snapDist) x = ox;
      else if (Math.abs(x - oright) <= snapDist) x = oright;
      else if (Math.abs(r - ox) <= snapDist) x = ox - w;
      else if (Math.abs(r - oright) <= snapDist) x = oright - w;

      if (Math.abs(y - oy) <= snapDist) y = oy;
      else if (Math.abs(y - obottom) <= snapDist) y = obottom;
      else if (Math.abs(b - oy) <= snapDist) y = oy - h;
      else if (Math.abs(b - obottom) <= snapDist) y = obottom - h;
    }

    box.x = x;
    box.y = y;
    box.width = w;
    box.height = h;
  }

  _extractFloorWallSegments(rooms) {
    const solidSegments = [];
    (rooms || []).forEach((r) => {
      const rx = Number(r.x || 0);
      const ry = Number(r.y || 0);
      const rw = Math.max(1, Number(r.width ?? r.w ?? 100));
      const rh = Math.max(1, Number(r.height ?? r.h ?? 100));
      const entryways = Array.isArray(r.entryways) ? r.entryways : [];

      const walls = {
        top: [rw, [[rx, ry], [rx + rw, ry]]],
        bottom: [rw, [[rx, ry + rh], [rx + rw, ry + rh]]],
        left: [rh, [[rx, ry], [rx, ry + rh]]],
        right: [rh, [[rx + rw, ry], [rx + rw, ry + rh]]],
      };

      Object.keys(walls).forEach((wallName) => {
        const [length, [[x1, y1], [x2, y2]]] = walls[wallName];
        const wallOpenings = [];
        entryways.forEach((ew) => {
          if (ew.wall === wallName) {
            const offset = Math.max(0, Number(ew.offset || 0));
            const width = Math.max(1, Number(ew.width || 36));
            const start = Math.max(0, Math.min(length, offset));
            const end = Math.max(0, Math.min(length, offset + width));
            if (start < end) wallOpenings.push([start, end]);
          }
        });
        wallOpenings.sort((a, b) => a[0] - b[0]);
        const merged = [];
        wallOpenings.forEach(([start, end]) => {
          if (merged.length > 0 && merged[merged.length - 1][1] >= start) {
            merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], end);
          } else {
            merged.push([start, end]);
          }
        });

        let cur = 0;
        merged.forEach(([start, end]) => {
          if (start > cur + 0.001) {
            if (wallName === "top" || wallName === "bottom") {
              solidSegments.push([[rx + cur, y1], [rx + start, y1]]);
            } else {
              solidSegments.push([[x1, ry + cur], [x1, ry + start]]);
            }
          }
          cur = Math.max(cur, end);
        });
        if (cur < length - 0.001) {
          if (wallName === "top" || wallName === "bottom") {
            solidSegments.push([[rx + cur, y1], [rx + length, y1]]);
          } else {
            solidSegments.push([[x1, ry + cur], [x1, ry + length]]);
          }
        }
      });
    });
    return solidSegments;
  }

  _raySegmentIntersection(ox, oy, dx, dy, x1, y1, x2, y2) {
    const vx = x2 - x1;
    const vy = y2 - y1;
    const denom = dx * vy - dy * vx;
    if (Math.abs(denom) < 1e-9) return null;
    const wx = x1 - ox;
    const wy = y1 - oy;
    const t = (wx * vy - wy * vx) / denom;
    const u = (wx * dy - wy * dx) / denom;
    if (t > 1e-4 && u >= -1e-5 && u <= 1.00001) {
      return t;
    }
    return null;
  }

  _lineSegmentIntersectsSolidWall(x1, y1, x2, y2, solidSegments, eps = 1e-3) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    for (let i = 0; i < solidSegments.length; i++) {
      const [[sx1, sy1], [sx2, sy2]] = solidSegments[i];
      const vx = sx2 - sx1;
      const vy = sy2 - sy1;
      const denom = dx * vy - dy * vx;
      if (Math.abs(denom) < 1e-9) continue;
      const wx = sx1 - x1;
      const wy = sy1 - y1;
      const t = (wx * vy - wy * vx) / denom;
      const u = (wx * dy - wy * dx) / denom;
      if (t >= eps && t <= 1.0 - eps && u >= -1e-5 && u <= 1.00001) {
        return true;
      }
    }
    return false;
  }

  _computeCameraVisibilityPolygon(cam, solidSegments, stepDeg = 2.0) {
    const cx = Number(cam.x || 0);
    const cy = Number(cam.y || 0);
    const heading = Number(cam.heading_deg || 0);
    const fov = Math.max(5, Math.min(360, Number(cam.fov_deg || 90)));
    const reach = Math.max(10, Number(cam.range_px || 200));

    const startDeg = heading - fov / 2.0;
    const endDeg = heading + fov / 2.0;

    const angleSet = new Set();
    const numSteps = Math.max(8, Math.ceil(fov / stepDeg));
    for (let i = 0; i <= numSteps; i++) {
      angleSet.add(Number((startDeg + (i / numSteps) * fov).toFixed(3)));
    }

    if (Array.isArray(solidSegments)) {
      solidSegments.forEach(([[x1, y1], [x2, y2]]) => {
        [[x1, y1], [x2, y2]].forEach(([px, py]) => {
          const dx = px - cx;
          const dy = py - cy;
          const dist = Math.hypot(dx, dy);
          if (dist < 1e-3 || dist > reach * 1.5) return;
          const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
          const diff = ((deg - heading + 540) % 360) - 180;
          const candDeg = heading + diff;
          if (candDeg >= startDeg && candDeg <= endDeg) {
            angleSet.add(Number((candDeg - 0.02).toFixed(3)));
            angleSet.add(Number(candDeg.toFixed(3)));
            angleSet.add(Number((candDeg + 0.02).toFixed(3)));
          }
        });
      });
    }

    const sortedAngles = Array.from(angleSet).sort((a, b) => a - b);
    const points = [];
    sortedAngles.forEach((deg) => {
      const rad = (deg * Math.PI) / 180;
      const dx = Math.cos(rad);
      const dy = Math.sin(rad);
      let minT = reach;
      if (Array.isArray(solidSegments)) {
        for (let i = 0; i < solidSegments.length; i++) {
          const [[x1, y1], [x2, y2]] = solidSegments[i];
          const t = this._raySegmentIntersection(cx, cy, dx, dy, x1, y1, x2, y2);
          if (t !== null && t < minT) minT = t;
        }
      }
      points.push([Number((cx + minT * dx).toFixed(1)), Number((cy + minT * dy).toFixed(1))]);
    });

    return [[cx, cy], ...points];
  }

  _compileFloorplanClient(fpInput) {
    const fp = fpInput && Array.isArray(fpInput.rooms) ? fpInput : this._getDefaultFloorplan();
    const base = JSON.parse(JSON.stringify(PDD_DEFAULT_COMPILED_TOPOLOGY));
    const rooms = fp.rooms || [];
    const conns = fp.connections || [];
    const cams = fp.cameras || [];
    const roomMap = {};
    rooms.forEach((r) => {
      roomMap[r.name || r.room_name] = r;
    });

    // Compute bidirectional connected_rooms_map expanding through transit spaces
    const adj = {};
    rooms.forEach((r) => {
      adj[r.name || r.room_name] = new Set();
    });
    conns.forEach((c) => {
      if (adj[c.from_room] && adj[c.to_room]) {
        adj[c.from_room].add(c.to_room);
        adj[c.to_room].add(c.from_room);
      }
    });
    const isTransit = (name) => {
      const r = roomMap[name];
      return r && (r.room_type === "transit" || Boolean(r.is_transit));
    };
    const connectedRoomsMap = {};
    Object.keys(adj).forEach((rName) => {
      if (isTransit(rName)) return;
      const visited = new Set([rName]);
      const queue = [...adj[rName]];
      const linked = new Set();
      while (queue.length > 0) {
        const cur = queue.shift();
        if (visited.has(cur)) continue;
        visited.add(cur);
        if (isTransit(cur)) {
          adj[cur]?.forEach((nxt) => {
            if (!visited.has(nxt)) queue.push(nxt);
          });
        } else {
          linked.add(cur);
        }
      }
      connectedRoomsMap[rName] = [...linked].sort();
    });
    base.connected_rooms_map = connectedRoomsMap;

    // Solid segments per floor
    const floorSegments = {};
    (fp.floors || []).forEach((fl) => {
      const flRooms = rooms.filter((r) => r.floor === fl.id);
      floorSegments[fl.id] = this._extractFloorWallSegments(flRooms);
    });

    const pointInCone = (px, py, cam) => {
      const dx = px - Number(cam.x || 0);
      const dy = py - Number(cam.y || 0);
      const dist = Math.hypot(dx, dy);
      const range = Number(cam.range_px || 200);
      if (dist > range) return false;
      if (dist < 1e-3) return true;
      let ang = (Math.atan2(dy, dx) * 180) / Math.PI;
      let diff = ((ang - Number(cam.heading_deg || 0) + 540) % 360) - 180;
      return Math.abs(diff) <= Number(cam.fov_deg || 90) / 2;
    };

    const roomCoverage = {};
    rooms.forEach((r) => {
      const rName = r.name || r.room_name;
      const FloorCams = cams.filter((c) => c.floor === r.floor);
      const segments = floorSegments[r.floor] || [];
      let maxPct = 0;
      const rx = Number(r.x || 0);
      const ry = Number(r.y || 0);
      const rw = Number(r.width ?? r.w ?? 200);
      const rh = Number(r.height ?? r.h ?? 150);
      FloorCams.forEach((cam) => {
        let hits = 0;
        const total = 16;
        for (let ix = 0; ix < 4; ix++) {
          for (let iy = 0; iy < 4; iy++) {
            const sx = rx + ((ix + 0.5) * rw) / 4;
            const sy = ry + ((iy + 0.5) * rh) / 4;
            if (pointInCone(sx, sy, cam)) {
              if (
                !this._lineSegmentIntersectsSolidWall(
                  Number(cam.x || 0),
                  Number(cam.y || 0),
                  sx,
                  sy,
                  segments
                )
              ) {
                hits++;
              }
            }
          }
        }
        let pct = Math.round((hits / total) * 100);
        if (cam.host_room === rName) pct = Math.max(pct, 65);
        if (pct > maxPct) maxPct = pct;
      });
      roomCoverage[rName] = { max_coverage_pct: maxPct };
    });
    base.room_coverage = roomCoverage;

    // Update camera analysis with visibility polygons and occluded spillovers
    const cameraAnalysis = [];
    cams.forEach((cam) => {
      const camId = cam.id || cam.camera_entity;
      const hostRoom = cam.host_room || "";
      const camFloor = cam.floor || "";
      const segments = floorSegments[camFloor] || [];
      const declaredSpills = new Set(cam.spills_into || []);
      const overlaps = [];
      const visPoly = this._computeCameraVisibilityPolygon(cam, segments);

      rooms.forEach((r) => {
        if (r.floor !== camFloor) return;
        const rName = r.name || r.room_name;
        const rx = Number(r.x || 0);
        const ry = Number(r.y || 0);
        const rw = Number(r.width ?? r.w ?? 200);
        const rh = Number(r.height ?? r.h ?? 150);
        let hits = 0;
        const total = 16;
        for (let ix = 0; ix < 4; ix++) {
          for (let iy = 0; iy < 4; iy++) {
            const sx = rx + ((ix + 0.5) * rw) / 4;
            const sy = ry + ((iy + 0.5) * rh) / 4;
            if (pointInCone(sx, sy, cam)) {
              if (
                !this._lineSegmentIntersectsSolidWall(
                  Number(cam.x || 0),
                  Number(cam.y || 0),
                  sx,
                  sy,
                  segments
                )
              ) {
                hits++;
              }
            }
          }
        }
        const pct = Math.round((hits / total) * 100);
        if (rName !== hostRoom && (pct >= 5 || declaredSpills.has(rName))) {
          const effPct = Math.max(pct, declaredSpills.has(rName) ? 18 : pct);
          overlaps.push({ room_name: rName, overlap_pct: effPct });
        }
      });

      cameraAnalysis.push({
        camera_id: camId,
        name: cam.name || camId,
        host_room: hostRoom,
        floor: camFloor,
        zones: Array.isArray(cam.zones) ? cam.zones : [],
        spillover_targets: overlaps,
        has_multi_room_bleed: overlaps.length > 0,
        visibility_polygon: visPoly,
      });
    });
    base.camera_analysis = cameraAnalysis;

    return base;
  }

  async loadOverview(preserveSelection = true) {
    this._loading = true;
    try {
      const data = await this._apiCall("GET", "/api/presence_detection_designer/overview");
      this._overview = data;
      this._globalDraft = JSON.parse(JSON.stringify(data.global_settings || {}));
      if (data.floorplan) {
        this._floorplan = JSON.parse(JSON.stringify(data.floorplan));
      } else if (!this._floorplan) {
        this._floorplan = this._loadLocalOrDefaultFloorplan();
      }
      if (data.compiled_topology) {
        this._compiledTopology = data.compiled_topology;
      } else {
        this._compiledTopology = this._compileFloorplanClient(this._floorplan);
      }
      const rooms = data.rooms || [];
      if (rooms.length > 0) {
        const exists =
          preserveSelection &&
          this._selectedRoomId &&
          rooms.some((r) => r.entry_id === this._selectedRoomId);
        const targetRoom = exists
          ? rooms.find((r) => r.entry_id === this._selectedRoomId)
          : rooms[0];
        this._selectRoomObject(targetRoom, false);
      }
    } catch (err) {
      this.showToast(`Failed to load rooms: ${err.message}`, "error");
    } finally {
      this._loading = false;
      this.render();
    }
  }

  _selectRoomObject(room, renderAfter = true) {
    if (!room) return;
    this._selectedRoomId = room.entry_id;
    this._draftConfig = JSON.parse(JSON.stringify(room.config || {}));
    if (!Array.isArray(this._draftConfig.bayesian_observations)) {
      this._draftConfig.bayesian_observations = [];
    }
    if (!Array.isArray(this._draftConfig.trigger_entities)) {
      this._draftConfig.trigger_entities = [];
    }
    if (!Array.isArray(this._draftConfig.boundary_entities)) {
      this._draftConfig.boundary_entities = [];
    }
    if (!Array.isArray(this._draftConfig.sustaining_conditions)) {
      this._draftConfig.sustaining_conditions = [];
    }
    if (!Array.isArray(this._draftConfig.connected_rooms)) {
      this._draftConfig.connected_rooms = Array.isArray(room.connected_rooms)
        ? [...room.connected_rooms]
        : [];
    }
    this._replayCandidate = JSON.parse(JSON.stringify(this._draftConfig));
    this._previewData = {
      probability_pct: room.bayesian_probability_pct,
      is_occupied: room.bayesian_occupied,
      prior_pct: room.bayesian_prior_pct,
      threshold_pct: room.bayesian_threshold_pct,
      active_observations: room.active_observations || [],
      inactive_observations: room.inactive_observations || [],
      natural_language_summary: room.natural_language_summary || "",
      combinatorics: room.combinatorics || {},
      rule_guide: room.rule_guide || "",
      ha_bayesian_yaml: room.ha_bayesian_yaml || "",
      designer_yaml: room.designer_yaml || "",
    };
    this._yamlDraft = room.designer_yaml || "";
    this._dirty = false;
    this._revisionNote = "";
    if (this._studioView === "statistics") {
      this.loadStatistics();
    } else if (this._studioView === "replay") {
      this.runReplay();
    } else if (this._studioView === "floorplan") {
      if (!this._floorplan) {
        this.loadFloorplan();
      } else if (renderAfter) {
        this.render();
      }
    } else if (renderAfter) {
      this.render();
    }
  }

  async loadFloorplan() {
    try {
      const res = await this._apiCall("GET", "/api/presence_detection_designer/floorplan");
      if (res && res.floorplan) {
        this._floorplan = res.floorplan;
        this._compiledTopology =
          res.compiled_topology || this._compileFloorplanClient(this._floorplan);
      }
    } catch (_err) {
      if (!this._floorplan) {
        this._floorplan = this._loadLocalOrDefaultFloorplan();
      }
      this._compiledTopology = this._compileFloorplanClient(this._floorplan);
    }
    this.render();
  }

  async saveOrCompileFloorplan(action = "save") {
    try {
      const res = await this._apiCall("POST", "/api/presence_detection_designer/floorplan", {
        action,
        floorplan: this._floorplan,
      });
      if (res && res.floorplan) {
        this._floorplan = res.floorplan;
        this._compiledTopology =
          res.compiled_topology || this._compileFloorplanClient(this._floorplan);
        try {
          window.localStorage.setItem("pdd_floorplan_layout_v1", JSON.stringify(this._floorplan));
        } catch (_e) {}
      }
      if (res && Array.isArray(res.updated_rooms) && res.updated_rooms.length > 0 && this._overview) {
        for (const ur of res.updated_rooms) {
          const idx = (this._overview.rooms || []).findIndex((r) => r.entry_id === ur.entry_id);
          if (idx >= 0) {
            this._overview.rooms[idx] = ur;
          }
        }
        const cur = this.selectedRoom;
        if (cur) this._selectRoomObject(cur, false);
      }
      this.render();
      if (action === "compile_and_apply") {
        this.showToast(
          `Updated room connections and camera coverage rules across ${(res?.updated_rooms || []).length} rooms`,
          "success"
        );
      } else if (action === "reset") {
        this.showToast("Reset floorplan to default layout", "info");
      } else {
        this.showToast("Saved floorplan layout", "success");
      }
    } catch (_err) {
      // Fallback when backend HTTP route has not been reloaded yet
      if (action === "reset") {
        this._floorplan = this._getDefaultFloorplan();
        try {
          window.localStorage.removeItem("pdd_floorplan_layout_v1");
        } catch (_e) {}
        this._compiledTopology = this._compileFloorplanClient(this._floorplan);
        this.render();
        this.showToast("Reset floorplan to default layout", "info");
        return;
      }
      try {
        window.localStorage.setItem("pdd_floorplan_layout_v1", JSON.stringify(this._floorplan));
      } catch (_e) {}
      this._compiledTopology = this._compileFloorplanClient(this._floorplan);
      if (action === "compile_and_apply" && this._overview && Array.isArray(this._overview.rooms)) {
        const connMap = this._compiledTopology?.connected_rooms_map || {};
        let updatedCount = 0;
        for (let i = 0; i < this._overview.rooms.length; i++) {
          const rm = this._overview.rooms[i];
          const rName = rm.room_name;
          if (Array.isArray(connMap[rName])) {
            const nextCfg = JSON.parse(JSON.stringify(rm.config || {}));
            nextCfg.connected_rooms = [...connMap[rName]];
            try {
              const saved = await this._apiCall(
                "POST",
                `/api/presence_detection_designer/room/${rm.entry_id}`,
                { config: nextCfg, note: "Updated connections from Floorplan" }
              );
              if (saved && saved.room) {
                this._overview.rooms[i] = saved.room;
              }
              updatedCount++;
            } catch (_roomErr) {}
          }
        }
        const cur = this.selectedRoom;
        if (cur) this._selectRoomObject(cur, false);
        this.render();
        this.showToast(`Updated room connections across ${updatedCount} rooms`, "success");
        return;
      }
      this.render();
      this.showToast("Saved floorplan layout", "success");
    }
  }

  _debounceSaveFloorplan() {
    clearTimeout(this._saveFpTimeout);
    this._saveFpTimeout = setTimeout(() => {
      try {
        if (window.localStorage && this._floorplan) {
          window.localStorage.setItem("pdd_floorplan_layout_v1", JSON.stringify(this._floorplan));
        }
      } catch (_e) {}
    }, 400);
  }

  _scheduleCanvasRender() {
    if (this._canvasRenderRaf) return;
    this._canvasRenderRaf = requestAnimationFrame(() => {
      this._canvasRenderRaf = null;
      this.render();
    });
  }

  async loadStatistics() {
    if (!this._selectedRoomId) return;
    try {
      const res = await this._apiCall(
        "GET",
        `/api/presence_detection_designer/room/${this._selectedRoomId}/statistics?hours=${this._historyHours}`
      );
      this._statsData = res;
      this.render();
    } catch (err) {
      this.showToast(`Failed to load history: ${err.message}`, "error");
    }
  }

  async runReplay() {
    if (!this._selectedRoomId || !this._replayCandidate) return;
    try {
      const res = await this._apiCall(
        "POST",
        `/api/presence_detection_designer/room/${this._selectedRoomId}/replay`,
        {
          hours: this._historyHours,
          candidate_config: this._replayCandidate,
        }
      );
      this._replayData = res;
      this.render();
    } catch (err) {
      this.showToast(`Simulation failed: ${err.message}`, "error");
    }
  }

  async applyReplayCandidate() {
    if (!this._selectedRoomId || !this._replayCandidate) return;
    this._draftConfig = JSON.parse(JSON.stringify(this._replayCandidate));
    this._revisionNote = `Applied from ${this._historyHours}h Replay Simulator`;
    await this.saveCurrentRoom();
    await this.runReplay();
  }

  get selectedRoom() {
    if (!this._overview || !this._overview.rooms) return null;
    return this._overview.rooms.find((r) => r.entry_id === this._selectedRoomId) || null;
  }

  async refreshPreview() {
    if (!this._draftConfig) return;
    try {
      const res = await this._apiCall(
        "POST",
        "/api/presence_detection_designer/preview_bayesian",
        { config: this._draftConfig }
      );
      this._previewData = res;
      this._yamlDraft = res.designer_yaml || this._yamlDraft;
      this.render();
    } catch (err) {
      this.showToast(`Preview failed: ${err.message}`, "error");
    }
  }

  async saveCurrentRoom() {
    if (!this._selectedRoomId || !this._draftConfig) return;
    try {
      // Automatically keep trigger_entities synced with main/reliable sensors
      const obs = this._draftConfig.bayesian_observations || [];
      const autoTriggers = [...(this._draftConfig.trigger_entities || [])];
      for (const o of obs) {
        const preset = o.preset || o.weight || "moderate";
        if (
          (preset === "decisive" || preset === "strong") &&
          o.entity_id &&
          o.entity_id.startsWith("binary_sensor.") &&
          !autoTriggers.includes(o.entity_id)
        ) {
          autoTriggers.push(o.entity_id);
        }
      }
      this._draftConfig.trigger_entities = autoTriggers;

      const res = await this._apiCall(
        "POST",
        `/api/presence_detection_designer/room/${this._selectedRoomId}`,
        {
          config: this._draftConfig,
          note: this._revisionNote.trim() || "Saved room settings",
        }
      );
      if (res && res.room && this._overview && Array.isArray(this._overview.rooms)) {
        const idx = this._overview.rooms.findIndex((r) => r.entry_id === this._selectedRoomId);
        if (idx >= 0) this._overview.rooms[idx] = res.room;
        this._selectRoomObject(res.room, true);
      }
      this.showToast(`Saved ${this._draftConfig.room_name}`, "success");
    } catch (err) {
      this.showToast(`Save failed: ${err.message}`, "error");
    }
  }

  async applyYamlDraft() {
    if (!this._selectedRoomId || !this._yamlDraft.trim()) return;
    try {
      const saved = await this._apiCall(
        "POST",
        `/api/presence_detection_designer/room/${this._selectedRoomId}`,
        {
          yaml_config: this._yamlDraft,
          note: "Updated via YAML editor",
        }
      );
      if (saved && saved.room) {
        const idx = this._overview.rooms.findIndex((r) => r.entry_id === this._selectedRoomId);
        if (idx >= 0) this._overview.rooms[idx] = saved.room;
        this._selectRoomObject(saved.room, true);
      }
      this.showToast("Applied YAML configuration", "success");
    } catch (err) {
      this.showToast(`YAML error: ${err.message}`, "error");
    }
  }

  async rollbackRevision(revIndex) {
    if (!this._selectedRoomId) return;
    try {
      const res = await this._apiCall(
        "POST",
        `/api/presence_detection_designer/room/${this._selectedRoomId}/rollback`,
        { revision_index: revIndex }
      );
      if (res && res.room) {
        const idx = this._overview.rooms.findIndex((r) => r.entry_id === this._selectedRoomId);
        if (idx >= 0) this._overview.rooms[idx] = res.room;
        this._selectRoomObject(res.room, true);
        this.showToast("Restored previous room configuration", "success");
      }
    } catch (err) {
      this.showToast(`Restore failed: ${err.message}`, "error");
    }
  }

  async runRoomAction(action, extra = {}) {
    if (!this._selectedRoomId) return;
    try {
      const res = await this._apiCall(
        "POST",
        `/api/presence_detection_designer/room/${this._selectedRoomId}/action`,
        { action, ...extra }
      );
      if (res && res.room) {
        const idx = this._overview.rooms.findIndex((r) => r.entry_id === this._selectedRoomId);
        if (idx >= 0) this._overview.rooms[idx] = res.room;
        if (!this._dirty) {
          this._selectRoomObject(res.room, true);
        } else {
          this.render();
        }
      }
      this.showToast("Updated room state", "success");
    } catch (err) {
      this.showToast(`Action failed: ${err.message}`, "error");
    }
  }

  async runTranslation(direction) {
    const room = this.selectedRoom;
    if (!room) return;
    try {
      const payload = {
        entry_id: room.entry_id,
        room_name: this._draftConfig.room_name || room.room_name,
        direction,
        description: direction === "nl_to_yaml" ? this._nlPrompt : undefined,
        yaml_config: direction === "yaml_to_nl" ? this._draftConfig : undefined,
        use_llm: true,
      };
      const res = await this._apiCall("POST", "/api/presence_detection_designer/translate", payload);
      if (direction === "nl_to_yaml" && res && res.normalized_config) {
        this._draftConfig = { ...this._draftConfig, ...res.normalized_config };
        this._dirty = true;
        this._nlOutput = res.natural_language || "Generated updated rules.";
        await this.refreshPreview();
        this.showToast("Generated room rules from description", "success");
      } else if (res) {
        this._nlOutput = res.natural_language || res.rule_guide || "";
        this.render();
      }
    } catch (err) {
      this.showToast(`Translation failed: ${err.message}`, "error");
    }
  }

  async saveGlobalSettings() {
    if (!this._globalDraft) return;
    try {
      const res = await this._apiCall(
        "POST",
        "/api/presence_detection_designer/global_settings",
        this._globalDraft
      );
      if (res && res.global_settings && this._overview) {
        this._overview.global_settings = res.global_settings;
      }
      this._showGlobalModal = false;
      this.render();
      this.showToast("Saved global settings", "success");
    } catch (err) {
      this.showToast(`Failed to save global settings: ${err.message}`, "error");
    }
  }

  _escape(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  _formatDuration(sec) {
    const s = Math.max(0, Math.round(Number(sec || 0)));
    if (s === 0) return "0s";
    const m = Math.floor(s / 60);
    const rem = s % 60;
    if (m === 0) return `${rem}s`;
    if (rem === 0) return `${m}m`;
    return `${m}m ${rem}s`;
  }

  _friendlyRoleGroup(obs) {
    const p = String(obs.preset || obs.weight || "moderate").toLowerCase();
    if (obs.corroboration_only || p === "weak_hint") return "keepalive";
    if (p === "decisive" || p === "strong") return "primary";
    return "shared";
  }

  _applyFriendlyRoleGroup(obs, group, presets) {
    if (group === "primary") {
      obs.preset = "decisive";
      obs.corroboration_only = false;
      const d = presets.decisive || { prob_given_true: 0.94, prob_given_false: 0.03 };
      obs.prob_given_true = d.prob_given_true;
      obs.prob_given_false = d.prob_given_false;
    } else if (group === "keepalive") {
      obs.preset = "supporting";
      obs.corroboration_only = true;
      obs.prob_given_true = 0.25;
      obs.prob_given_false = 0.22;
    } else {
      obs.preset = "moderate";
      obs.corroboration_only = false;
      const d = presets.moderate || { prob_given_true: 0.72, prob_given_false: 0.12 };
      obs.prob_given_true = d.prob_given_true;
      obs.prob_given_false = d.prob_given_false;
    }
  }

  _roomStatusSummary(r) {
    if (!r) return { dotClass: "clear", label: "Clear", detail: "No activity detected" };
    const state = String(r.box_state || "idle_clear");
    const countdown = Number(r.vacating_countdown || 0);
    if (r.is_present) {
      if (state === "timer_active" && countdown > 0) {
        return {
          dotClass: "clearing",
          label: `Clearing (${this._formatDuration(countdown)})`,
          detail: `Clearing in ${this._formatDuration(countdown)} unless motion resumes`,
        };
      }
      const hasDoorSeal =
        (r.mode || r.config?.mode) === "bounded" &&
        Array.isArray(r.config?.boundary_entities) &&
        r.config.boundary_entities.length > 0;
      if (state === "occupied_sealed" && hasDoorSeal) {
        return {
          dotClass: "occupied",
          label: "Occupied (Doors closed)",
          detail: "Occupied and held while room doors remain closed",
        };
      }
      return {
        dotClass: "occupied",
        label: "Occupied",
        detail: r.last_triggered_by
          ? `Triggered by ${r.last_triggered_by}`
          : "Active sensor detection in room",
      };
    }
    return {
      dotClass: "clear",
      label: "Clear",
      detail: r.last_cleared_by ? `Last cleared by ${r.last_cleared_by}` : "Room is currently unoccupied",
    };
  }

  render() {
    const rooms = (this._overview && this._overview.rooms) || [];
    const areas = (this._overview && this._overview.areas) || [];
    const entities = (this._overview && this._overview.entities) || [];
    const presets = (this._overview && this._overview.presets) || {};
    const occupiedCount = rooms.filter((r) => r.is_present).length;

    const entityNameMap = {};
    entities.forEach((e) => {
      entityNameMap[e.entity_id] = e.name || e.entity_id;
    });

    const filteredRooms = rooms.filter((r) => {
      if (this._roomFilter === "occupied" && !r.is_present) return false;
      if (this._roomFilter === "vacant" && r.is_present) return false;
      if (
        this._roomSearch &&
        !r.room_name.toLowerCase().includes(this._roomSearch.toLowerCase())
      ) {
        return false;
      }
      return true;
    });

    const selRoom = this.selectedRoom;
    const cfg = this._draftConfig || {};
    const prev = this._previewData || {};
    const activeMap = {};
    (prev.active_observations || []).forEach((o) => {
      activeMap[`${o.entity_id}|${o.label}`] = o;
      activeMap[o.entity_id] = o;
    });

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --ha-bg: var(--primary-background-color, #f5f6f8);
          --ha-card: var(--card-background-color, #ffffff);
          --ha-subtle: var(--secondary-background-color, #f8fafc);
          --ha-text: var(--primary-text-color, #1e293b);
          --ha-muted: var(--secondary-text-color, #64748b);
          --ha-divider: var(--divider-color, #e2e8f0);
          --ha-primary: var(--primary-color, #0284c7);
          --ha-success: var(--success-color, #16a34a);
          --ha-warning: var(--warning-color, #d97706);
          --ha-danger: var(--error-color, #dc2626);
          display: flex;
          flex-direction: column;
          position: relative;
          isolation: isolate;
          z-index: 1;
          width: 100%;
          max-width: 100%;
          height: calc(100vh - var(--safe-area-inset-top, 0px) - var(--safe-area-inset-bottom, 0px));
          height: calc(100dvh - var(--safe-area-inset-top, 0px) - var(--safe-area-inset-bottom, 0px));
          overflow: hidden;
          contain: layout paint;
          background: var(--ha-bg);
          color: var(--ha-text);
          font-family: Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          box-sizing: border-box;
        }
        * { box-sizing: border-box; }

        /* Clean Home Assistant Top App Bar */
        .app-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          height: 56px;
          flex-shrink: 0;
          width: 100%;
          max-width: 100%;
          background: var(--ha-card);
          border-bottom: 1px solid var(--ha-divider);
          position: relative;
          z-index: 2;
        }
        .panel-scroll-frame {
          flex: 1;
          min-height: 0;
          width: 100%;
          max-width: 100%;
          overflow-y: auto;
          overflow-x: hidden;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }
        .header-title {
          font-size: 18px;
          font-weight: 500;
          margin: 0;
          color: var(--ha-text);
        }
        .header-summary {
          font-size: 13px;
          color: var(--ha-muted);
        }
        .nav-tabs {
          display: flex;
          height: 56px;
          gap: 4px;
        }
        .nav-tab {
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          padding: 0 16px;
          font-size: 14px;
          font-weight: 500;
          color: var(--ha-muted);
          cursor: pointer;
          transition: color 0.15s, border-color 0.15s;
        }
        .nav-tab:hover {
          color: var(--ha-text);
        }
        .nav-tab.active {
          color: var(--ha-primary);
          border-bottom-color: var(--ha-primary);
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Standard Buttons & Inputs */
        .btn {
          background: var(--ha-card);
          color: var(--ha-text);
          border: 1px solid var(--ha-divider);
          padding: 7px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.12s, border-color 0.12s;
        }
        .btn:hover {
          background: var(--ha-subtle);
        }
        .btn-primary {
          background: var(--ha-primary);
          border-color: var(--ha-primary);
          color: #ffffff;
        }
        .btn-primary:hover {
          filter: brightness(0.94);
          background: var(--ha-primary);
        }
        .btn-text {
          background: transparent;
          border: none;
          color: var(--ha-muted);
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
        }
        .btn-text:hover {
          background: var(--ha-subtle);
          color: var(--ha-text);
        }
        .btn-danger-text {
          background: transparent;
          border: none;
          color: var(--ha-muted);
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
        }
        .btn-danger-text:hover {
          color: var(--ha-danger);
          background: rgba(220, 38, 38, 0.08);
        }
        .btn-sm {
          padding: 5px 10px;
          font-size: 12px;
        }

        .input, .select {
          background: var(--ha-card);
          color: var(--ha-text);
          border: 1px solid var(--ha-divider);
          border-radius: 8px;
          padding: 8px 11px;
          font-size: 13px;
          width: 100%;
        }
        .input:focus, .select:focus {
          outline: none;
          border-color: var(--ha-primary);
        }

        /* Layout Workspace */
        .workspace {
          display: grid;
          grid-template-columns: 260px minmax(0, 1fr);
          gap: 24px;
          width: 100%;
          min-width: 0;
          max-width: 1380px;
          margin: 0 auto;
          padding: 20px 24px 48px;
          align-items: start;
        }
        @media (max-width: 1100px) {
          .workspace {
            grid-template-columns: minmax(0, 1fr);
          }
        }

        /* Left Sidebar Room List */
        .sidebar-card {
          background: var(--ha-card);
          border: 1px solid var(--ha-divider);
          border-radius: 12px;
          overflow: hidden;
          min-width: 0;
        }
        .sidebar-top {
          padding: 12px;
          border-bottom: 1px solid var(--ha-divider);
        }
        .seg-group {
          display: flex;
          background: var(--ha-subtle);
          border: 1px solid var(--ha-divider);
          border-radius: 8px;
          padding: 2px;
          margin-top: 8px;
        }
        .seg-btn {
          flex: 1;
          border: none;
          background: transparent;
          color: var(--ha-muted);
          padding: 5px 6px;
          font-size: 12px;
          font-weight: 500;
          border-radius: 6px;
          cursor: pointer;
        }
        .seg-btn.active {
          background: var(--ha-card);
          color: var(--ha-text);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
        }
        .room-list {
          max-height: calc(100vh - 190px);
          overflow-y: auto;
        }
        .room-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 11px 14px;
          border-bottom: 1px solid var(--ha-divider);
          cursor: pointer;
          transition: background 0.12s;
        }
        .room-row:last-child {
          border-bottom: none;
        }
        .room-row:hover {
          background: var(--ha-subtle);
        }
        .room-row.selected {
          background: rgba(2, 132, 199, 0.08);
          border-left: 3px solid var(--ha-primary);
          padding-left: 11px;
        }
        .room-row-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .status-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .status-dot.occupied {
          background: var(--ha-success);
        }
        .status-dot.clearing {
          background: var(--ha-warning);
        }
        .status-dot.clear {
          background: #94a3b8;
          opacity: 0.45;
        }
        .room-row-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--ha-text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .room-row-status {
          font-size: 12px;
          color: var(--ha-muted);
          flex-shrink: 0;
        }
        .room-row-status.occupied {
          color: var(--ha-success);
          font-weight: 500;
        }
        .room-row-status.clearing {
          color: var(--ha-warning);
          font-weight: 500;
        }

        /* Content Cards */
        .content-stack {
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-width: 0;
          width: 100%;
          max-width: 920px;
        }
        .content-stack.wide {
          max-width: 100%;
        }
        .ha-card {
          background: var(--ha-card);
          border: 1px solid var(--ha-divider);
          border-radius: 12px;
          padding: 20px;
          min-width: 0;
          max-width: 100%;
          overflow-x: hidden;
        }
        .card-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 16px;
        }
        .card-title {
          font-size: 16px;
          font-weight: 500;
          margin: 0;
          color: var(--ha-text);
        }
        .card-desc {
          font-size: 13px;
          color: var(--ha-muted);
          margin-top: 3px;
          line-height: 1.4;
        }

        /* Clean List Rows inside Cards */
        .list-divider {
          border-top: 1px solid var(--ha-divider);
        }
        .sensor-row {
          display: grid;
          grid-template-columns: minmax(0, 1.3fr) minmax(0, 1.3fr) auto;
          gap: 12px;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid var(--ha-divider);
        }
        .sensor-row:last-child {
          border-bottom: none;
        }
        @media (max-width: 850px) {
          .sensor-row {
            grid-template-columns: 1fr;
          }
        }
        .sensor-info {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .sensor-title {
          font-size: 14px;
          font-weight: 500;
          color: var(--ha-text);
        }
        .sensor-sub {
          font-size: 12px;
          color: var(--ha-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Chips */
        .chip-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }
        .ha-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--ha-subtle);
          border: 1px solid var(--ha-divider);
          border-radius: 999px;
          padding: 5px 12px;
          font-size: 13px;
          color: var(--ha-text);
        }
        .ha-chip button {
          background: none;
          border: none;
          color: var(--ha-muted);
          cursor: pointer;
          font-size: 14px;
          line-height: 1;
          padding: 0;
        }
        .ha-chip button:hover {
          color: var(--ha-danger);
        }

        /* Setting Rows */
        .setting-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 14px 0;
          border-bottom: 1px solid var(--ha-divider);
        }
        .setting-row:first-of-type {
          padding-top: 0;
        }
        .setting-row:last-of-type {
          border-bottom: none;
          padding-bottom: 0;
        }
        .setting-label {
          font-size: 14px;
          font-weight: 500;
          color: var(--ha-text);
        }
        .setting-help {
          font-size: 12.5px;
          color: var(--ha-muted);
          margin-top: 2px;
        }

        /* Expandable Advanced Drawer */
        .advanced-toggle-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--ha-card);
          border: 1px solid var(--ha-divider);
          border-radius: 12px;
          padding: 14px 20px;
          cursor: pointer;
          user-select: none;
        }
        .advanced-toggle-bar:hover {
          background: var(--ha-subtle);
        }

        .sub-tabs {
          display: flex;
          gap: 6px;
          border-bottom: 1px solid var(--ha-divider);
          padding-bottom: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .sub-tab {
          background: var(--ha-subtle);
          border: 1px solid var(--ha-divider);
          color: var(--ha-muted);
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12.5px;
          font-weight: 500;
          cursor: pointer;
        }
        .sub-tab.active {
          background: var(--ha-primary);
          border-color: var(--ha-primary);
          color: #fff;
        }

        .code-area {
          width: 100%;
          min-height: 200px;
          background: var(--ha-subtle);
          color: var(--ha-text);
          border: 1px solid var(--ha-divider);
          border-radius: 8px;
          padding: 12px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 12px;
          line-height: 1.5;
          resize: vertical;
        }

        /* Modal */
        .modal-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 30;
        }
        .modal-card {
          background: var(--ha-card);
          border: 1px solid var(--ha-divider);
          border-radius: 12px;
          width: 480px;
          max-width: 92%;
          padding: 20px;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
        }
      </style>

      <div id="pdd-toast-container" style="position:absolute;bottom:20px;right:24px;z-index:40;"></div>

      <datalist id="pdd-all-entities">
        ${entities
          .map(
            (e) =>
              `<option value="${this._escape(e.entity_id)}">${this._escape(e.name)} (${this._escape(
                e.state
              )})</option>`
          )
          .join("")}
      </datalist>

      <!-- Clean Home Assistant Header Bar -->
      <div class="app-header">
        <div class="header-left">
          ${
            this._narrow || this._hass?.dockedSidebar === "always_hidden"
              ? `<button class="btn-text" id="btn-toggle-ha-sidebar" title="Toggle Sidebar" style="font-size:18px;padding:4px 8px;">☰</button>`
              : ""
          }
          <h1 class="header-title">Presence Detection</h1>
          <span class="header-summary">${occupiedCount} of ${rooms.length} rooms occupied</span>
        </div>

        <div class="nav-tabs">
          <button class="nav-tab ${this._studioView === "design" ? "active" : ""}" data-studio-view="design">Rooms</button>
          <button class="nav-tab ${this._studioView === "floorplan" ? "active" : ""}" data-studio-view="floorplan">Floorplan</button>
          <button class="nav-tab ${
            this._studioView === "statistics" || this._studioView === "replay" ? "active" : ""
          }" data-studio-view="statistics">Activity History</button>
        </div>

        <div class="header-actions">
          <button class="btn btn-sm" id="btn-refresh-overview">Refresh</button>
        </div>
      </div>

      <div class="panel-scroll-frame">
        <div class="workspace">
          <!-- LEFT SIDEBAR: Simple Room List -->
          <div class="sidebar-card">
            <div class="sidebar-top">
              <input
                type="text"
                class="input"
                id="room-search-input"
                placeholder="Search rooms..."
                value="${this._escape(this._roomSearch)}"
              />
              <div class="seg-group">
                ${[
                  { id: "all", label: "All" },
                  { id: "occupied", label: "Occupied" },
                  { id: "vacant", label: "Clear" },
                ]
                  .map(
                    (f) => `
                  <button class="seg-btn ${this._roomFilter === f.id ? "active" : ""}" data-filter="${f.id}">
                    ${f.label}
                  </button>`
                  )
                  .join("")}
              </div>
            </div>

            <div class="room-list">
              ${filteredRooms
                .map((r) => {
                  const st = this._roomStatusSummary(r);
                  return `
                    <div class="room-row ${
                      r.entry_id === this._selectedRoomId ? "selected" : ""
                    }" data-room-id="${this._escape(r.entry_id)}">
                      <div class="room-row-left">
                        <span class="status-dot ${st.dotClass}"></span>
                        <span class="room-row-name">${this._escape(r.room_name)}</span>
                      </div>
                      <span class="room-row-status ${st.dotClass}">${this._escape(st.label)}</span>
                    </div>`;
                })
                .join("")}
            </div>
          </div>

          <!-- MAIN WORKSPACE -->
          ${
            this._studioView === "floorplan"
              ? `<div class="content-stack wide">${this._renderFloorplanPane(selRoom)}</div>`
              : this._studioView === "statistics"
              ? `<div class="content-stack wide">${this._renderStatisticsPane(selRoom)}</div>`
              : this._studioView === "replay"
              ? `<div class="content-stack wide">${this._renderReplayPane(selRoom, presets)}</div>`
              : `<div class="content-stack">${this._renderSimpleRoomEditor(
                  selRoom,
                  cfg,
                  prev,
                  rooms,
                  areas,
                  entities,
                  entityNameMap,
                  presets,
                  activeMap
                )}</div>`
          }
        </div>
      </div>

      ${
        this._showGlobalModal
          ? `
        <div class="modal-backdrop" id="global-modal-backdrop">
          <div class="modal-card">
            <div class="card-head">
              <h3 class="card-title">Global AI &amp; Tracker Settings</h3>
              <button class="btn-text" id="btn-close-global">✕</button>
            </div>
            <div style="display:flex;flex-direction:column;gap:12px;">
              <div>
                <div class="setting-label" style="margin-bottom:4px;">Vision AI Provider</div>
                <select class="select" id="gl-provider">
                  <option value="vision_api" ${
                    (this._globalDraft?.llm_provider_type || "vision_api") === "vision_api"
                      ? "selected"
                      : ""
                  }>OpenAI-Compatible Vision API (LiteLLM)</option>
                  <option value="conversation" ${
                    this._globalDraft?.llm_provider_type === "conversation" ? "selected" : ""
                  }>Home Assistant Conversation Agent</option>
                  <option value="ai_task" ${
                    this._globalDraft?.llm_provider_type === "ai_task" ? "selected" : ""
                  }>Home Assistant AI Task</option>
                </select>
              </div>
              <div>
                <div class="setting-label" style="margin-bottom:4px;">API Endpoint URL</div>
                <input type="text" class="input" id="gl-api-url" value="${this._escape(
                  this._globalDraft?.llm_api_url || ""
                )}" placeholder="http://10.0.0.10:8448/v1/chat/completions" />
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <div>
                  <div class="setting-label" style="margin-bottom:4px;">Model Name</div>
                  <input type="text" class="input" id="gl-model" value="${this._escape(
                    this._globalDraft?.llm_model || "gemini-2.5-flash"
                  )}" />
                </div>
                <div>
                  <div class="setting-label" style="margin-bottom:4px;">HA Conversation Agent</div>
                  <input type="text" class="input" id="gl-agent-id" value="${this._escape(
                    this._globalDraft?.llm_agent_id || ""
                  )}" placeholder="conversation.google_ai_conversation" />
                </div>
              </div>
              <div>
                <div class="setting-label" style="margin-bottom:4px;">Household BLE Area Trackers</div>
                <input type="text" class="input" id="gl-ble" value="${this._escape(
                  (this._globalDraft?.ble_trackers || []).join(", ")
                )}" />
              </div>
              <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px;">
                <button class="btn" id="btn-cancel-global">Cancel</button>
                <button class="btn btn-primary" id="btn-save-global">Save</button>
              </div>
            </div>
          </div>
        </div>`
          : ""
      }
    `;

    this.renderToastOnly();
    this._bindEvents();
  }

  _renderSimpleRoomEditor(
    selRoom,
    cfg,
    prev,
    rooms,
    areas,
    entities,
    entityNameMap,
    presets,
    activeMap
  ) {
    if (!selRoom) {
      return `<div class="ha-card">Select a room on the left to view or edit its settings.</div>`;
    }

    const st = this._roomStatusSummary(selRoom);
    const observations = cfg.bayesian_observations || [];
    const conditions = cfg.sustaining_conditions || [];
    const connectedRooms = cfg.connected_rooms || [];
    const boundaries = cfg.boundary_entities || [];
    const hasDoorSeal = cfg.mode === "bounded";
    const timeoutSec = Number(cfg.inactivity_timeout ?? 180);
    const timeoutMinText = this._formatDuration(timeoutSec);

    return `
      <!-- 1. Compact Status & Action Header Card -->
      <div class="ha-card" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
        <div style="display:flex;align-items:center;gap:14px;">
          <span class="status-dot ${st.dotClass}" style="width:12px;height:12px;"></span>
          <div>
            <div style="display:flex;align-items:center;gap:10px;">
              <h2 style="margin:0;font-size:20px;font-weight:500;">${this._escape(
                cfg.room_name || selRoom.room_name
              )}</h2>
              <span style="font-size:12.5px;font-weight:500;padding:2px 10px;border-radius:999px;background:var(--ha-subtle);border:1px solid var(--ha-divider);color:${
                st.dotClass === "occupied"
                  ? "var(--ha-success)"
                  : st.dotClass === "clearing"
                  ? "var(--ha-warning)"
                  : "var(--ha-muted)"
              };">
                ${this._escape(st.label)}
              </span>
              ${
                this._dirty
                  ? `<span style="font-size:12px;color:var(--ha-warning);font-weight:500;">• Unsaved changes</span>`
                  : ""
              }
            </div>
            <div style="font-size:13px;color:var(--ha-muted);margin-top:3px;">
              ${this._escape(st.detail)}
            </div>
          </div>
        </div>

        <div style="display:flex;align-items:center;gap:8px;">
          <button class="btn" id="btn-room-override">
            ${selRoom.override ? "Release Manual Hold" : "Hold Occupied"}
          </button>
          <button class="btn" id="btn-room-refresh">Recalculate</button>
          <button class="btn btn-primary" id="btn-save-room">Save Changes</button>
        </div>
      </div>

      <!-- 2. Card 1: Presence & Motion Sensors -->
      <div class="ha-card">
        <div class="card-head">
          <div>
            <h3 class="card-title">Presence &amp; Motion Sensors</h3>
            <div class="card-desc">
              Choose which sensors detect people in this room and whether they can trigger occupancy on their own or need confirmation from another sensor.
            </div>
          </div>
        </div>

        <div class="list-divider">
          ${
            observations.length === 0
              ? `<div style="padding:16px 0;font-size:13px;color:var(--ha-muted);">No sensors added to this room yet.</div>`
              : observations
                  .map((obs, idx) => {
                    const key = `${obs.entity_id}|${obs.label}`;
                    const isAct = Boolean(activeMap[key] || activeMap[obs.entity_id]);
                    const friendlyName =
                      obs.label || entityNameMap[obs.entity_id] || obs.entity_id || "Sensor";
                    const roleGroup = this._friendlyRoleGroup(obs);
                    return `
                    <div class="sensor-row" data-obs-idx="${idx}">
                      <div class="sensor-info">
                        <span class="status-dot ${isAct ? "occupied" : "clear"}" title="${
                      isAct ? "Currently active" : "Clear"
                    }"></span>
                        <div style="min-width:0;">
                          <div class="sensor-title">${this._escape(friendlyName)}</div>
                          <div class="sensor-sub">${this._escape(obs.entity_id)}${
                      obs.state && obs.state !== "on" ? ` = ${this._escape(obs.state)}` : ""
                    }</div>
                        </div>
                      </div>

                      <div>
                        <select class="select obs-role-simple" data-idx="${idx}">
                          <option value="primary" ${
                            roleGroup === "primary" ? "selected" : ""
                          }>Main room sensor (triggers room alone)</option>
                          <option value="shared" ${
                            roleGroup === "shared" ? "selected" : ""
                          }>Shared / hallway view (needs confirmation)</option>
                          <option value="keepalive" ${
                            roleGroup === "keepalive" ? "selected" : ""
                          }>Keep-alive only (extends timer once occupied)</option>
                        </select>
                      </div>

                      <div style="text-align:right;">
                        <button class="btn-danger-text obs-del" data-idx="${idx}">Remove</button>
                      </div>
                    </div>`;
                  })
                  .join("")
          }
        </div>

        <div style="display:grid;grid-template-columns:minmax(0, 1.3fr) minmax(0, 1.2fr) auto;gap:10px;margin-top:14px;padding-top:14px;border-top:1px solid var(--ha-divider);align-items:center;">
          <input
            type="text"
            class="input"
            id="simple-add-obs-entity"
            list="pdd-all-entities"
            placeholder="Add sensor (e.g. binary_sensor.living_room_motion)..."
          />
          <select class="select" id="simple-add-obs-role">
            <option value="primary">Main room sensor (triggers room alone)</option>
            <option value="shared" selected>Shared / hallway view (needs confirmation)</option>
            <option value="keepalive">Keep-alive only (extends timer once occupied)</option>
          </select>
          <button class="btn" id="btn-simple-add-obs">+ Add Sensor</button>
        </div>
      </div>

      <!-- 3. Card 2: Keep Occupied While Active (TV, Media, Appliances) -->
      <div class="ha-card">
        <div class="card-head">
          <div>
            <h3 class="card-title">Keep Occupied While Active</h3>
            <div class="card-desc">
              Prevent the room from clearing when someone is sitting still watching TV, listening to music, or using a device.
            </div>
          </div>
        </div>

        <div class="list-divider">
          ${
            conditions.length === 0
              ? `<div style="padding:14px 0;font-size:13px;color:var(--ha-muted);">No keep-occupied media or appliance rules configured.</div>`
              : conditions
                  .map(
                    (c, idx) => `
                  <div style="display:grid;grid-template-columns:minmax(0, 1.4fr) minmax(90px, 120px) minmax(90px, 120px) auto;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid var(--ha-divider);">
                    <input
                      type="text"
                      class="input cond-field"
                      data-idx="${idx}"
                      data-key="entity_id"
                      list="pdd-all-entities"
                      placeholder="media_player.living_room_tv"
                      value="${this._escape(c.entity_id || "")}"
                    />
                    <select class="select cond-field" data-idx="${idx}" data-key="operator">
                      <option value="equals" ${(c.operator || "equals") === "equals" ? "selected" : ""}>is</option>
                      <option value="not_equals" ${c.operator === "not_equals" ? "selected" : ""}>is not</option>
                      <option value="greater_than" ${c.operator === "greater_than" ? "selected" : ""}>above</option>
                      <option value="less_than" ${c.operator === "less_than" ? "selected" : ""}>below</option>
                    </select>
                    <input
                      type="text"
                      class="input cond-field"
                      data-idx="${idx}"
                      data-key="state"
                      placeholder="playing"
                      value="${this._escape(c.state ?? "playing")}"
                    />
                    <button class="btn-danger-text cond-del" data-idx="${idx}">Remove</button>
                  </div>`
                  )
                  .join("")
          }
        </div>

        <div style="margin-top:12px;">
          <button class="btn btn-sm" id="btn-add-condition">+ Add Keep-Occupied Rule</button>
        </div>
      </div>

      <!-- 4. Card 3: Clearing & Room Connections -->
      <div class="ha-card">
        <div class="card-head">
          <div>
            <h3 class="card-title">Clearing &amp; Room Connections</h3>
            <div class="card-desc">
              Control how long the room stays occupied after activity stops, and which neighboring rooms immediately clear the countdown when someone walks out.
            </div>
          </div>
        </div>

        <div class="list-divider">
          <!-- Clear Delay -->
          <div class="setting-row">
            <div>
              <div class="setting-label">Clear after inactivity</div>
              <div class="setting-help">How long to wait after all sensors stop seeing activity (${timeoutMinText}).</div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;width:150px;">
              <input
                type="number"
                class="input"
                id="cfg-inactivity-timeout"
                min="15"
                max="3600"
                step="15"
                value="${timeoutSec}"
              />
              <span style="font-size:13px;color:var(--ha-muted);">sec</span>
            </div>
          </div>

          <!-- Adjacent Rooms Hand-Off -->
          <div class="setting-row" style="align-items:flex-start;flex-direction:column;">
            <div style="width:100%;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
              <div>
                <div class="setting-label">Connected adjacent rooms</div>
                <div class="setting-help">
                  If this room is only counting down and someone is detected in a connected room, clear the countdown immediately.
                </div>
              </div>
              <button class="btn btn-sm" id="btn-open-floorplan-tab">Edit on Floorplan</button>
            </div>

            <div class="chip-row" style="margin-top:8px;">
              ${
                connectedRooms.length === 0
                  ? `<span style="font-size:13px;color:var(--ha-muted);">No adjacent rooms linked.</span>`
                  : connectedRooms
                      .map(
                        (rname, i) => `
                      <span class="ha-chip">
                        ${this._escape(rname)}
                        <button class="del-connected-room" data-idx="${i}" title="Unlink room">×</button>
                      </span>`
                      )
                      .join("")
              }
              <div style="display:inline-flex;gap:6px;align-items:center;">
                <select class="select" id="add-connected-room-input" style="width:190px;padding:5px 10px;">
                  <option value="">+ Link adjacent room...</option>
                  ${rooms
                    .filter(
                      (r) =>
                        r.room_name !== (cfg.room_name || selRoom.room_name) &&
                        !connectedRooms.includes(r.room_name)
                    )
                    .map(
                      (r) =>
                        `<option value="${this._escape(r.room_name)}">${this._escape(
                          r.room_name
                        )}</option>`
                    )
                    .join("")}
                </select>
              </div>
            </div>
          </div>

          <!-- Closed Door Latch Toggle -->
          <div class="setting-row" style="align-items:flex-start;flex-direction:column;">
            <label style="display:flex;align-items:center;gap:10px;cursor:pointer;">
              <input
                type="checkbox"
                id="cfg-bounded-toggle"
                ${hasDoorSeal ? "checked" : ""}
                style="width:16px;height:16px;"
              />
              <div>
                <div class="setting-label">Closed doors trap occupancy in this room</div>
                <div class="setting-help">
                  Enable only if every exit from this room has a physical door contact sensor.
                </div>
              </div>
            </label>

            ${
              hasDoorSeal
                ? `
              <div style="margin-top:12px;width:100%;padding:12px;background:var(--ha-subtle);border-radius:8px;border:1px solid var(--ha-divider);">
                <div style="font-size:12.5px;font-weight:500;margin-bottom:8px;">Door contact sensors for this room</div>
                <div class="chip-row" style="margin-bottom:10px;">
                  ${
                    boundaries.length === 0
                      ? `<span style="font-size:12.5px;color:var(--ha-warning);">Add at least one door contact sensor below so the room can seal when closed.</span>`
                      : boundaries
                          .map(
                            (eid, i) => `
                          <span class="ha-chip">
                            ${this._escape(eid)}
                            <button class="del-boundary" data-idx="${i}">×</button>
                          </span>`
                          )
                          .join("")
                  }
                </div>
                <div style="display:flex;gap:8px;max-width:420px;">
                  <input type="text" class="input" id="add-boundary-input" list="pdd-all-entities" placeholder="binary_sensor.room_door" />
                  <button class="btn btn-sm" id="btn-add-boundary">Add Door</button>
                </div>
              </div>`
                : ""
            }
          </div>
        </div>
      </div>

      <!-- 5. Progressive Disclosure: Collapsible Advanced Settings & Diagnostics -->
      <div class="advanced-toggle-bar" id="btn-toggle-advanced">
        <div>
          <div style="font-size:14px;font-weight:500;color:var(--ha-text);">
            ${this._showAdvanced ? "▾ Hide Advanced Settings & Diagnostics" : "▸ Advanced Settings & Diagnostics"}
          </div>
          <div style="font-size:12.5px;color:var(--ha-muted);margin-top:2px;">
            Bayesian weights, AI camera vision check, sensor combination truth table, YAML editor, and revision history
          </div>
        </div>
        <span style="font-size:12.5px;color:var(--ha-primary);font-weight:500;">
          ${this._showAdvanced ? "Collapse" : "Expand"}
        </span>
      </div>

      ${
        this._showAdvanced
          ? this._renderAdvancedDrawer(selRoom, cfg, prev, areas, presets, activeMap)
          : ""
      }
    `;
  }

  _renderAdvancedDrawer(selRoom, cfg, prev, areas, presets, activeMap) {
    const priorPct = Math.round(Number(cfg.bayesian_prior ?? 0.2) * 100);
    const threshPct = Math.round(Number(cfg.bayesian_threshold ?? 0.75) * 100);
    const livePct = Number(
      prev.probability_pct ?? (selRoom ? selRoom.bayesian_probability_pct : 0)
    ).toFixed(1);
    const comb = prev.combinatorics || {};

    return `
      <div class="ha-card">
        <div class="sub-tabs">
          <button class="sub-tab ${
            this._advTab === "tuning" ? "active" : ""
          }" data-adv-tab="tuning">Bayesian &amp; Vision Tuning</button>
          <button class="sub-tab ${
            this._advTab === "truth" ? "active" : ""
          }" data-adv-tab="truth">Combination Truth Table</button>
          <button class="sub-tab ${
            this._advTab === "yaml" ? "active" : ""
          }" data-adv-tab="yaml">YAML &amp; AI Rules</button>
          <button class="sub-tab ${
            this._advTab === "revisions" ? "active" : ""
          }" data-adv-tab="revisions">Saved Revisions (${(selRoom.revisions || []).length})</button>
          <div style="flex:1;"></div>
          <button class="btn btn-sm" id="btn-open-global">Global AI Settings</button>
          <button class="btn btn-sm" id="btn-jump-to-replay">Open Replay Simulator</button>
        </div>

        ${
          this._advTab === "tuning"
            ? `
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:14px;margin-bottom:20px;">
            <div>
              <div class="setting-label" style="font-size:12.5px;margin-bottom:4px;">Home Assistant Area</div>
              <select class="select" id="cfg-area-id">
                <option value="">— None —</option>
                ${areas
                  .map(
                    (a) =>
                      `<option value="${this._escape(a.id)}" ${
                        cfg.area_id === a.id ? "selected" : ""
                      }>${this._escape(a.name)}</option>`
                  )
                  .join("")}
              </select>
            </div>
            <div>
              <div class="setting-label" style="font-size:12.5px;margin-bottom:4px;">Prior Baseline: ${priorPct}%</div>
              <input type="range" min="5" max="50" step="1" id="cfg-prior-slider" value="${priorPct}" style="width:100%;" />
            </div>
            <div>
              <div class="setting-label" style="font-size:12.5px;margin-bottom:4px;">Activation Threshold: ${threshPct}%</div>
              <input type="range" min="50" max="95" step="1" id="cfg-thresh-slider" value="${threshPct}" style="width:100%;" />
            </div>
            <div>
              <div class="setting-label" style="font-size:12.5px;margin-bottom:4px;">Camera Entity (AI Vision)</div>
              <div style="display:flex;gap:6px;">
                <input type="text" class="input" id="cfg-camera-entity" list="pdd-all-entities" value="${this._escape(
                  cfg.camera_entity || ""
                )}" placeholder="camera.living_room" />
                <button class="btn btn-sm" id="btn-room-verify" title="Run AI Vision Check now">Check</button>
              </div>
            </div>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <div class="setting-label">Detailed Sensor Probabilities — Current Score: ${livePct}%</div>
            <div style="display:flex;gap:8px;">
              <button class="btn btn-sm" id="btn-add-ble">+ Add Household BLE</button>
              <button class="btn btn-sm" id="btn-sync-triggers">Sync Instant Triggers</button>
            </div>
          </div>

          <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:12.5px;">
              <thead>
                <tr style="border-bottom:1px solid var(--ha-divider);text-align:left;color:var(--ha-muted);">
                  <th style="padding:8px 6px;">Entity ID &amp; Label</th>
                  <th style="padding:8px 6px;">Preset</th>
                  <th style="padding:8px 6px;">P(E|Occ)</th>
                  <th style="padding:8px 6px;">P(E|Vac)</th>
                  <th style="padding:8px 6px;">Operator &amp; State</th>
                </tr>
              </thead>
              <tbody>
                ${(cfg.bayesian_observations || [])
                  .map((obs, idx) => {
                    const presetVal = obs.preset || obs.weight || "moderate";
                    const pDefaults = presets[presetVal] || {
                      prob_given_true: 0.72,
                      prob_given_false: 0.12,
                    };
                    const pTrue = Number(obs.prob_given_true ?? pDefaults.prob_given_true);
                    const pFalse = Number(obs.prob_given_false ?? pDefaults.prob_given_false);
                    return `
                    <tr style="border-bottom:1px solid var(--ha-divider);">
                      <td style="padding:8px 6px;">
                        <input type="text" class="input obs-field" data-idx="${idx}" data-key="entity_id" list="pdd-all-entities" value="${this._escape(
                      obs.entity_id || ""
                    )}" style="margin-bottom:4px;font-family:monospace;font-size:11.5px;" />
                        <input type="text" class="input obs-field" data-idx="${idx}" data-key="label" value="${this._escape(
                      obs.label || ""
                    )}" placeholder="Label" />
                      </td>
                      <td style="padding:8px 6px;width:130px;">
                        <select class="select obs-preset" data-idx="${idx}">
                          ${["decisive", "strong", "moderate", "supporting", "weak_hint", "custom"]
                            .map(
                              (p) =>
                                `<option value="${p}" ${presetVal === p ? "selected" : ""}>${p}</option>`
                            )
                            .join("")}
                        </select>
                      </td>
                      <td style="padding:8px 6px;width:90px;">
                        <input type="number" step="0.01" min="0.01" max="0.99" class="input obs-prob" data-idx="${idx}" data-key="prob_given_true" value="${pTrue.toFixed(
                      2
                    )}" />
                      </td>
                      <td style="padding:8px 6px;width:90px;">
                        <input type="number" step="0.01" min="0.01" max="0.99" class="input obs-prob" data-idx="${idx}" data-key="prob_given_false" value="${pFalse.toFixed(
                      2
                    )}" />
                      </td>
                      <td style="padding:8px 6px;width:190px;">
                        <div style="display:flex;gap:4px;">
                          <select class="select obs-field" data-idx="${idx}" data-key="operator">
                            ${["equals", "in", "greater_than", "less_than", "not_equals"]
                              .map(
                                (op) =>
                                  `<option value="${op}" ${
                                    (obs.operator || "equals") === op ? "selected" : ""
                                  }>${op}</option>`
                              )
                              .join("")}
                          </select>
                          <input type="text" class="input obs-field" data-idx="${idx}" data-key="state" value="${this._escape(
                      obs.state ?? "on"
                    )}" style="width:80px;" />
                        </div>
                      </td>
                    </tr>`;
                  })
                  .join("")}
              </tbody>
            </table>
          </div>
        `
            : this._advTab === "truth"
            ? `
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:16px;">
            <div>
              <div class="setting-label" style="margin-bottom:8px;">Sensors that trigger occupancy alone (&ge; ${threshPct}%)</div>
              ${
                (comb.solo_triggers || []).length === 0
                  ? `<div style="font-size:13px;color:var(--ha-muted);">None — at least 2 sensors must agree.</div>`
                  : (comb.solo_triggers || [])
                      .map(
                        (s) => `
                      <div style="display:flex;justify-content:space-between;padding:8px 10px;background:var(--ha-subtle);border:1px solid var(--ha-divider);border-radius:8px;margin-bottom:6px;font-size:13px;">
                        <span>${this._escape(s.label)}</span>
                        <strong style="color:var(--ha-success);">${s.posterior_pct}%</strong>
                      </div>`
                      )
                      .join("")
              }
            </div>
            <div>
              <div class="setting-label" style="margin-bottom:8px;">2-sensor combinations that trigger (&ge; ${threshPct}%)</div>
              ${
                (comb.pair_triggers || []).length === 0
                  ? `<div style="font-size:13px;color:var(--ha-muted);">No 2-sensor combinations cross threshold.</div>`
                  : (comb.pair_triggers || [])
                      .slice(0, 8)
                      .map(
                        (p) => `
                      <div style="display:flex;justify-content:space-between;padding:8px 10px;background:var(--ha-subtle);border:1px solid var(--ha-divider);border-radius:8px;margin-bottom:6px;font-size:13px;">
                        <span>${this._escape(p.labels)}</span>
                        <strong style="color:var(--ha-primary);">${p.posterior_pct}%</strong>
                      </div>`
                      )
                      .join("")
              }
            </div>
            <div>
              <div class="setting-label" style="margin-bottom:8px;">Ignored combinations (&lt; ${threshPct}%)</div>
              ${
                (comb.pair_sub_threshold || []).length === 0
                  ? `<div style="font-size:13px;color:var(--ha-muted);">None</div>`
                  : (comb.pair_sub_threshold || [])
                      .slice(0, 6)
                      .map(
                        (p) => `
                      <div style="display:flex;justify-content:space-between;padding:8px 10px;background:var(--ha-subtle);border:1px solid var(--ha-divider);border-radius:8px;margin-bottom:6px;font-size:13px;color:var(--ha-muted);">
                        <span>${this._escape(p.labels)}</span>
                        <span>${p.posterior_pct}%</span>
                      </div>`
                      )
                      .join("")
              }
            </div>
          </div>
        `
            : this._advTab === "yaml"
            ? `
          <div style="display:flex;gap:6px;margin-bottom:10px;">
            <button class="btn btn-sm ${this._rightTab === "yaml" ? "btn-primary" : ""}" data-rtab="yaml">Room YAML</button>
            <button class="btn btn-sm ${this._rightTab === "ha_yaml" ? "btn-primary" : ""}" data-rtab="ha_yaml">Native HA Bayesian YAML</button>
            <button class="btn btn-sm ${this._rightTab === "nl" ? "btn-primary" : ""}" data-rtab="nl">Plain-English AI Builder</button>
          </div>
          ${
            this._rightTab === "yaml"
              ? `
            <textarea class="code-area" id="yaml-draft-editor">${this._escape(
              this._yamlDraft
            )}</textarea>
            <div style="display:flex;justify-content:flex-end;margin-top:8px;">
              <button class="btn btn-primary btn-sm" id="btn-apply-yaml">Apply YAML</button>
            </div>`
              : this._rightTab === "ha_yaml"
              ? `<textarea class="code-area" readonly>${this._escape(
                  prev.ha_bayesian_yaml || ""
                )}</textarea>`
              : `
            <textarea class="code-area" id="nl-prompt-input" style="min-height:90px;" placeholder="Describe how this room should behave in plain English...">${this._escape(
              this._nlPrompt
            )}</textarea>
            <div style="display:flex;gap:8px;margin-top:8px;">
              <button class="btn btn-primary btn-sm" id="btn-nl-to-yaml">Generate Rules</button>
              <button class="btn btn-sm" id="btn-yaml-to-nl">Explain Current Rules</button>
            </div>
            ${
              this._nlOutput
                ? `<div style="margin-top:10px;padding:12px;background:var(--ha-subtle);border:1px solid var(--ha-divider);border-radius:8px;font-size:13px;white-space:pre-wrap;">${this._escape(
                    this._nlOutput
                  )}</div>`
                : ""
            }`
          }
        `
            : `
          ${
            (selRoom.revisions || []).length === 0
              ? `<div style="font-size:13px;color:var(--ha-muted);">No saved revisions yet.</div>`
              : (selRoom.revisions || [])
                  .map(
                    (rev) => `
                  <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--ha-divider);font-size:13px;">
                    <div>
                      <div style="font-weight:500;">${this._escape(rev.note || "Saved settings")}</div>
                      <div style="font-size:12px;color:var(--ha-muted);">${this._escape(
                        rev.timestamp
                      )}</div>
                    </div>
                    <button class="btn btn-sm btn-rollback" data-rev-idx="${rev.index}">Restore</button>
                  </div>`
                  )
                  .join("")
          }
        `
        }
      </div>
    `;
  }

  _buildStepSvgPaths(series, width = 900, height = 170) {
    const pts = series || [];
    if (pts.length === 0) {
      return { linePath: "", areaPath: "" };
    }
    const coords = [];
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const x = Math.max(0, Math.min(width, (Number(p.offset_pct || 0) / 100) * width));
      const y = Math.max(
        6,
        Math.min(height - 6, height - (Number(p.probability_pct || 0) / 100) * (height - 12) - 6)
      );
      if (i > 0) {
        const prevY = coords[coords.length - 1][1];
        coords.push([x, prevY]);
      }
      coords.push([x, y]);
    }
    const lastY = coords[coords.length - 1][1];
    coords.push([width, lastY]);

    const linePath = coords
      .map((c, idx) => `${idx === 0 ? "M" : "L"}${c[0].toFixed(1)},${c[1].toFixed(1)}`)
      .join(" ");
    const areaPath = `${linePath} L${width},${height} L0,${height} Z`;
    return { linePath, areaPath };
  }

  _getSvgPoint(e, svgEl) {
    if (!svgEl) return { x: 0, y: 0 };
    const pt = svgEl.createSVGPoint ? svgEl.createSVGPoint() : null;
    if (pt && svgEl.getScreenCTM) {
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = svgEl.getScreenCTM();
      if (ctm) {
        const transformed = pt.matrixTransform(ctm.inverse());
        return { x: transformed.x, y: transformed.y };
      }
    }
    const rect = svgEl.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / Math.max(1, rect.width)) * 1000,
      y: ((e.clientY - rect.top) / Math.max(1, rect.height)) * 580,
    };
  }

  _coneSvgPath(cam, solidSegments = null) {
    if (solidSegments && solidSegments.length > 0) {
      const poly = this._computeCameraVisibilityPolygon(cam, solidSegments);
      if (poly && poly.length >= 3) {
        return (
          poly
            .map((pt, idx) => `${idx === 0 ? "M" : "L"} ${pt[0].toFixed(1)},${pt[1].toFixed(1)}`)
            .join(" ") + " Z"
        );
      }
    }
    const cx = Number(cam.x || 0);
    const cy = Number(cam.y || 0);
    const r = Math.max(20, Number(cam.range_px || 180));
    const heading = Number(cam.heading_deg || 0);
    const fov = Math.max(10, Math.min(350, Number(cam.fov_deg || 90)));
    const startDeg = heading - fov / 2.0;
    const endDeg = heading + fov / 2.0;
    const startRad = (startDeg * Math.PI) / 180.0;
    const endRad = (endDeg * Math.PI) / 180.0;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const largeArc = fov > 180 ? 1 : 0;
    return `M ${cx.toFixed(1)},${cy.toFixed(1)} L ${x1.toFixed(1)},${y1.toFixed(
      1
    )} A ${r.toFixed(1)},${r.toFixed(1)} 0 ${largeArc},1 ${x2.toFixed(1)},${y2.toFixed(1)} Z`;
  }

  _renderFloorplanPane(selRoom) {
    const fp = this._floorplan || this._overview?.floorplan;
    const compiled = this._compiledTopology || this._overview?.compiled_topology || {};
    if (!fp || !Array.isArray(fp.floors)) {
      return `<div class="ha-card">Loading floorplan...</div>`;
    }
    const floors = fp.floors;
    const activeFloor = floors.find((f) => f.id === this._selectedFloorId) || floors[1] || floors[0];
    this._selectedFloorId = activeFloor.id;

    const liveRoomsByName = {};
    ((this._overview && this._overview.rooms) || []).forEach((r) => {
      liveRoomsByName[r.room_name] = r;
    });

    const allFpRooms = fp.rooms || [];
    const allFpConns = fp.connections || [];
    const allFpCams = fp.cameras || [];

    const fRooms =
      activeFloor.rooms || allFpRooms.filter((r) => r.floor === activeFloor.id);
    const floorRoomNames = new Set(fRooms.map((r) => r.name || r.room_name));
    const fConns =
      activeFloor.connections ||
      allFpConns.filter(
        (c) => floorRoomNames.has(c.from_room) || floorRoomNames.has(c.to_room)
      );
    const fCams =
      activeFloor.cameras || allFpCams.filter((c) => c.floor === activeFloor.id);

    if (
      fCams.length > 0 &&
      (!this._selectedCamEntity ||
        !fCams.some((c) => (c.id || c.camera_entity) === this._selectedCamEntity))
    ) {
      this._selectedCamEntity = fCams[0].id || fCams[0].camera_entity;
    }
    const selCam =
      fCams.find((c) => (c.id || c.camera_entity) === this._selectedCamEntity) ||
      fCams[0] ||
      null;

    const selBox =
      fRooms.find(
        (b) =>
          (this._selectedRoomBoxName && (b.name || b.room_name) === this._selectedRoomBoxName) ||
          (selRoom && (b.name || b.room_name) === selRoom.room_name)
      ) ||
      fRooms[0] ||
      null;
    if (selBox) {
      this._selectedRoomBoxName = selBox.name || selBox.room_name;
    }

    const roomBoxMap = {};
    fRooms.forEach((b) => {
      roomBoxMap[b.name || b.room_name] = b;
    });

    const camAnalysis = compiled.camera_analysis || [];
    const ambiguities = compiled.ambiguities || [];
    const connMap = compiled.connected_rooms_map || {};
    const roomCoverage = compiled.room_coverage || {};

    const solidSegments = this._extractFloorWallSegments(fRooms);

    // 1. Cones & camera controls
    const conesSvg = fCams
      .map((cam) => {
        const camId = cam.id || cam.camera_entity;
        const camLabel = (cam.name || cam.label || camId).replace(" Camera", "");
        const isSelectedCam = selCam && (selCam.id || selCam.camera_entity) === camId;
        const hasSpill =
          (Array.isArray(cam.spills_into) && cam.spills_into.length > 0) ||
          camAnalysis.some((ca) => ca.camera_id === camId && ca.has_multi_room_bleed);
        const coneColor = hasSpill ? "#d97706" : "#0284c7";
        const pathD = this._coneSvgPath(cam, solidSegments);
        const rad = (Number(cam.heading_deg || 0) * Math.PI) / 180.0;
        const labelDist = Math.min(125, Number(cam.range_px || 200) * 0.45);
        const labelX = Math.max(70, Math.min(930, Number(cam.x) + Math.cos(rad) * labelDist));
        const labelY = Math.max(20, Math.min(560, Number(cam.y) + Math.sin(rad) * labelDist));

        // Interactive control handles for selected camera
        let camHandlesSvg = "";
        if (isSelectedCam) {
          const aimDist = 45;
          const aimX = Number(cam.x) + Math.cos(rad) * aimDist;
          const aimY = Number(cam.y) + Math.sin(rad) * aimDist;
          const fov = Number(cam.fov_deg || 90);
          const reach = Number(cam.range_px || 200);
          const startRad = ((Number(cam.heading_deg || 0) - fov / 2.0) * Math.PI) / 180.0;
          const endRad = ((Number(cam.heading_deg || 0) + fov / 2.0) * Math.PI) / 180.0;
          const fovHandleDist = Math.min(120, reach * 0.85);
          const fov1X = Number(cam.x) + Math.cos(startRad) * fovHandleDist;
          const fov1Y = Number(cam.y) + Math.sin(startRad) * fovHandleDist;
          const fov2X = Number(cam.x) + Math.cos(endRad) * fovHandleDist;
          const fov2Y = Number(cam.y) + Math.sin(endRad) * fovHandleDist;
          const tipX = Number(cam.x) + Math.cos(rad) * reach;
          const tipY = Number(cam.y) + Math.sin(rad) * reach;

          camHandlesSvg = `
            <line x1="${Number(cam.x).toFixed(1)}" y1="${Number(cam.y).toFixed(1)}" x2="${aimX.toFixed(1)}" y2="${aimY.toFixed(1)}" stroke="${coneColor}" stroke-width="2.5" stroke-linecap="round" />
            <circle class="fp-cam-handle" data-handle="heading" data-cam-id="${this._escape(camId)}" cx="${aimX.toFixed(1)}" cy="${aimY.toFixed(1)}" r="6.5" fill="#ffffff" stroke="${coneColor}" stroke-width="2.5" style="cursor:crosshair;" />
            <circle class="fp-cam-handle" data-handle="fov_start" data-cam-id="${this._escape(camId)}" cx="${fov1X.toFixed(1)}" cy="${fov1Y.toFixed(1)}" r="5.5" fill="#ffffff" stroke="${coneColor}" stroke-width="2" style="cursor:ew-resize;" />
            <circle class="fp-cam-handle" data-handle="fov_end" data-cam-id="${this._escape(camId)}" cx="${fov2X.toFixed(1)}" cy="${fov2Y.toFixed(1)}" r="5.5" fill="#ffffff" stroke="${coneColor}" stroke-width="2" style="cursor:ew-resize;" />
            <circle class="fp-cam-handle" data-handle="range" data-cam-id="${this._escape(camId)}" cx="${tipX.toFixed(1)}" cy="${tipY.toFixed(1)}" r="6" fill="${coneColor}" stroke="#ffffff" stroke-width="2" style="cursor:nwse-resize;" />
          `;
        }

        return `
          <g class="fp-cam-group" data-cam-entity="${this._escape(camId)}">
            <path
              d="${pathD}"
              fill="${hasSpill ? "rgba(217, 119, 6, 0.15)" : "rgba(2, 132, 199, 0.13)"}"
              stroke="${coneColor}"
              stroke-width="${isSelectedCam ? "2.4" : "1.2"}"
              stroke-dasharray="${hasSpill ? "5,4" : "none"}"
              style="pointer-events:none;"
            />
            <circle
              class="fp-cam-origin"
              data-cam-entity="${this._escape(camId)}"
              cx="${Number(cam.x).toFixed(1)}"
              cy="${Number(cam.y).toFixed(1)}"
              r="${isSelectedCam ? "8" : "6"}"
              fill="${coneColor}"
              stroke="#ffffff"
              stroke-width="2"
              style="cursor:move;"
            />
            ${camHandlesSvg}
            <text
              x="${labelX.toFixed(1)}"
              y="${labelY.toFixed(1)}"
              text-anchor="middle"
              fill="${coneColor}"
              font-size="11"
              font-weight="600"
              style="pointer-events:none;user-select:none;"
            >${this._escape(camLabel)}</text>
          </g>
        `;
      })
      .join("");

    // 2. Rooms, entryways & resize handles
    const roomsSvg = fRooms
      .map((box) => {
        const rName = box.name || box.room_name;
        const live = liveRoomsByName[rName];
        const isSel = (selBox && (selBox.name || selBox.room_name) === rName);
        const isOcc = live ? Boolean(live.is_present) : false;
        const isTransit = box.room_type === "transit" || Boolean(box.is_transit);
        const covPct = Number(roomCoverage[rName]?.max_coverage_pct ?? 100);
        const hasBlindSpot = !isTransit && covPct === 0;

        let strokeColor = isSel ? "#0284c7" : "#cbd5e1";
        let fillColor = "#ffffff";
        if (isOcc) {
          strokeColor = "#16a34a";
          fillColor = "#f0fdf4";
        } else if (hasBlindSpot) {
          strokeColor = "#d97706";
          fillColor = "#fffbeb";
        } else if (isTransit) {
          strokeColor = "#cbd5e1";
          fillColor = "#f8fafc";
        }

        const rx = Number(box.x);
        const ry = Number(box.y);
        const rw = Number(box.width ?? box.w ?? 200);
        const rh = Number(box.height ?? box.h ?? 150);
        const statusSummary = this._roomStatusSummary(live);

        // Render entryways for this room
        const entryways = Array.isArray(box.entryways) ? box.entryways : [];
        const entrywaysSvg = entryways
          .map((ew) => {
            const isSelDoor = this._selectedDoorId === ew.id;
            const offset = Math.max(0, Number(ew.offset || 0));
            const width = Math.max(10, Number(ew.width || 36));
            let x1 = rx,
              y1 = ry,
              x2 = rx,
              y2 = ry,
              bx = rx,
              by = ry;
            if (ew.wall === "top") {
              x1 = rx + offset;
              y1 = ry;
              x2 = x1 + width;
              y2 = ry;
              bx = x1 + width / 2;
              by = ry;
            } else if (ew.wall === "bottom") {
              x1 = rx + offset;
              y1 = ry + rh;
              x2 = x1 + width;
              y2 = ry + rh;
              bx = x1 + width / 2;
              by = ry + rh;
            } else if (ew.wall === "left") {
              x1 = rx;
              y1 = ry + offset;
              x2 = rx;
              y2 = y1 + width;
              bx = rx;
              by = y1 + width / 2;
            } else if (ew.wall === "right") {
              x1 = rx + rw;
              y1 = ry + offset;
              x2 = rx + rw;
              y2 = y1 + width;
              bx = rx + rw;
              by = y1 + width / 2;
            }
            const isPassage = ew.type === "open_passage";
            const doorColor = isSelDoor ? "#0284c7" : isPassage ? "#64748b" : "#b45309";
            return `
              <g class="fp-door-group" data-room-name="${this._escape(rName)}" data-door-id="${this._escape(ew.id)}">
                <line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#ffffff" stroke-width="5" stroke-linecap="round" />
                <line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${doorColor}" stroke-width="${isSelDoor ? "3" : "2"}" stroke-dasharray="${isPassage ? "4,3" : "none"}" />
                <circle class="fp-door-handle" data-room-name="${this._escape(rName)}" data-door-id="${this._escape(ew.id)}" cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="${isSelDoor ? "6.5" : "5"}" fill="${doorColor}" stroke="#ffffff" stroke-width="1.5" style="cursor:grab;" />
                ${
                  isSelDoor
                    ? `
                  <rect class="fp-door-tab" data-tab="start" data-room-name="${this._escape(rName)}" data-door-id="${this._escape(ew.id)}" x="${(x1 - 3).toFixed(1)}" y="${(y1 - 3).toFixed(1)}" width="6" height="6" fill="#0284c7" stroke="#ffffff" stroke-width="1" style="cursor:crosshair;" />
                  <rect class="fp-door-tab" data-tab="end" data-room-name="${this._escape(rName)}" data-door-id="${this._escape(ew.id)}" x="${(x2 - 3).toFixed(1)}" y="${(y2 - 3).toFixed(1)}" width="6" height="6" fill="#0284c7" stroke="#ffffff" stroke-width="1" style="cursor:crosshair;" />
                `
                    : ""
                }
              </g>
            `;
          })
          .join("");

        // 8 Resize Handles when room is selected
        let resizeHandlesSvg = "";
        if (isSel) {
          const handles = [
            { id: "nw", x: rx, y: ry, cursor: "nwse-resize" },
            { id: "n", x: rx + rw / 2, y: ry, cursor: "ns-resize" },
            { id: "ne", x: rx + rw, y: ry, cursor: "nesw-resize" },
            { id: "e", x: rx + rw, y: ry + rh / 2, cursor: "ew-resize" },
            { id: "se", x: rx + rw, y: ry + rh, cursor: "nwse-resize" },
            { id: "s", x: rx + rw / 2, y: ry + rh, cursor: "ns-resize" },
            { id: "sw", x: rx, y: ry + rh, cursor: "nesw-resize" },
            { id: "w", x: rx, y: ry + rh / 2, cursor: "ew-resize" },
          ];
          resizeHandlesSvg = handles
            .map(
              (h) => `
            <rect
              class="fp-resize-handle"
              data-handle="${h.id}"
              data-room-name="${this._escape(rName)}"
              x="${(h.x - 5).toFixed(1)}"
              y="${(h.y - 5).toFixed(1)}"
              width="10"
              height="10"
              fill="#ffffff"
              stroke="#0284c7"
              stroke-width="2"
              rx="2"
              style="cursor:${h.cursor};"
            />
          `
            )
            .join("");
        }

        return `
          <g class="fp-room-box" data-room-name="${this._escape(rName)}">
            <rect
              class="fp-room-rect"
              data-room-name="${this._escape(rName)}"
              x="${rx}"
              y="${ry}"
              width="${rw}"
              height="${rh}"
              rx="8"
              fill="${fillColor}"
              stroke="${strokeColor}"
              stroke-width="${isSel ? "2.5" : "1.5"}"
              stroke-dasharray="${isTransit ? "4,4" : "none"}"
              style="cursor:move;"
            />
            <text
              x="${rx + 14}"
              y="${ry + 24}"
              fill="#1e293b"
              font-size="13.5"
              font-weight="600"
              style="pointer-events:none;user-select:none;"
            >${this._escape(rName)}</text>
            <text
              x="${rx + 14}"
              y="${ry + 44}"
              fill="${isOcc ? "#16a34a" : "#64748b"}"
              font-size="11.5"
              style="pointer-events:none;user-select:none;"
            >${isTransit ? "Shared walkway / stairs" : this._escape(statusSummary.label)}</text>
            ${
              hasBlindSpot
                ? `<text x="${rx + 14}" y="${ry + rh - 12}" fill="#d97706" font-size="10.5" font-weight="500" style="pointer-events:none;">No camera cone (uses motion / BLE)</text>`
                : ""
            }
            ${entrywaysSvg}
            ${resizeHandlesSvg}
          </g>
        `;
      })
      .join("");

    const connsSvg = fConns
      .map((conn) => {
        const bFrom = roomBoxMap[conn.from_room];
        const bTo = roomBoxMap[conn.to_room];
        if (!bFrom || !bTo) return "";
        const w1 = Number(bFrom.width ?? bFrom.w ?? 200);
        const h1 = Number(bFrom.height ?? bFrom.h ?? 150);
        const w2 = Number(bTo.width ?? bTo.w ?? 200);
        const h2 = Number(bTo.height ?? bTo.h ?? 150);
        const x1 = Number(bFrom.x) + w1 / 2;
        const y1 = Number(bFrom.y) + h1 / 2;
        const x2 = Number(bTo.x) + w2 / 2;
        const y2 = Number(bTo.y) + h2 / 2;
        return `
          <line
            x1="${x1.toFixed(1)}"
            y1="${y1.toFixed(1)}"
            x2="${x2.toFixed(1)}"
            y2="${y2.toFixed(1)}"
            stroke="#94a3b8"
            stroke-width="1.5"
            stroke-dasharray="4,4"
            opacity="0.65"
            style="pointer-events:none;"
          />
        `;
      })
      .join("");

    const selBoxName = selBox ? selBox.name || selBox.room_name : selRoom?.room_name || "Room";
    const selCamId = selCam ? selCam.id || selCam.camera_entity : "";
    const selBoxEntryways = selBox && Array.isArray(selBox.entryways) ? selBox.entryways : [];

    return `
      <div class="ha-card">
        <div class="card-head" style="flex-wrap:wrap;">
          <div>
            <h2 class="card-title" style="font-size:18px;">House Floorplan &amp; Camera Coverage</h2>
            <div class="card-desc">
              Drag rooms to move or use 8 handles to resize (smart snapping active). Drag cameras to reposition, rotate aim vector, or adjust FOV arc. Solid walls occlude camera sightlines; beams penetrate through doorways.
            </div>
          </div>

          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            <div class="seg-group" style="margin-top:0;">
              ${floors
                .map(
                  (fl) => `
                <button class="seg-btn ${
                  fl.id === activeFloor.id ? "active" : ""
                }" data-floor-id="${this._escape(fl.id)}" style="padding:6px 12px;">
                  ${this._escape(fl.name.replace(/\s*\(.*\)/, ""))}
                </button>`
                )
                .join("")}
            </div>
            <button class="btn btn-sm" id="btn-toggle-fp-inspector">
              ${this._showFloorplanInspector ? "Hide Geometry & Doorway Editor" : "Edit Boxes, Cameras & Doorways"}
            </button>
            <button class="btn btn-primary btn-sm" id="btn-fp-compile">Apply Connections to Rooms</button>
          </div>
        </div>

        <div style="background:#f8fafc;border:1px solid var(--ha-divider);border-radius:10px;padding:10px;overflow:hidden;touch-action:none;">
          <svg id="fp-svg-canvas" viewBox="0 0 1000 580" style="width:100%;height:auto;min-height:420px;display:block;user-select:none;touch-action:none;">
            ${connsSvg}
            ${roomsSvg}
            ${conesSvg}
          </svg>
        </div>

        ${
          this._showFloorplanInspector
            ? `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px;padding-top:16px;border-top:1px solid var(--ha-divider);">
            <div>
              <div class="setting-label" style="margin-bottom:8px;">Camera Cone Geometry</div>
              ${
                !selCam
                  ? `<div style="font-size:13px;color:var(--ha-muted);">No cameras on this floor.</div>`
                  : `
                <select class="select" id="fp-cam-select" style="margin-bottom:10px;">
                  ${fCams
                    .map((c) => {
                      const cid = c.id || c.camera_entity;
                      return `<option value="${this._escape(cid)}" ${
                        cid === selCamId ? "selected" : ""
                      }>${this._escape(c.name || cid)}</option>`;
                    })
                    .join("")}
                </select>
                <div style="display:grid;grid-template-columns:repeat(5, 1fr);gap:8px;">
                  <div><small>X</small><input type="number" class="input fp-cam-field" data-key="x" value="${Number(
                    selCam.x
                  )}" /></div>
                  <div><small>Y</small><input type="number" class="input fp-cam-field" data-key="y" value="${Number(
                    selCam.y
                  )}" /></div>
                  <div><small>Angle°</small><input type="number" class="input fp-cam-field" data-key="heading_deg" value="${Number(
                    selCam.heading_deg
                  )}" /></div>
                  <div><small>FOV°</small><input type="number" class="input fp-cam-field" data-key="fov_deg" value="${Number(
                    selCam.fov_deg
                  )}" /></div>
                  <div><small>Range</small><input type="number" class="input fp-cam-field" data-key="range_px" value="${Number(
                    selCam.range_px
                  )}" /></div>
                </div>`
              }
            </div>

            <div>
              <div class="setting-label" style="margin-bottom:8px;">Room Box: ${this._escape(
                selBoxName
              )}</div>
              ${
                !selBox
                  ? ""
                  : `
                <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:8px;margin-bottom:10px;">
                  <div><small>X</small><input type="number" class="input fp-box-field" data-room="${this._escape(
                    selBoxName
                  )}" data-key="x" value="${Number(selBox.x)}" /></div>
                  <div><small>Y</small><input type="number" class="input fp-box-field" data-room="${this._escape(
                    selBoxName
                  )}" data-key="y" value="${Number(selBox.y)}" /></div>
                  <div><small>Width</small><input type="number" class="input fp-box-field" data-room="${this._escape(
                    selBoxName
                  )}" data-key="width" value="${Number(selBox.width ?? 200)}" /></div>
                  <div><small>Height</small><input type="number" class="input fp-box-field" data-room="${this._escape(
                    selBoxName
                  )}" data-key="height" value="${Number(selBox.height ?? 150)}" /></div>
                </div>

                <!-- Doorways on this room -->
                <div style="margin-top:12px;padding-top:10px;border-top:1px dashed var(--ha-divider);">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <div style="font-size:12.5px;font-weight:600;">Perimeter Doorways (${selBoxEntryways.length})</div>
                    <div style="display:flex;gap:6px;">
                      <select class="select" id="fp-new-door-wall" style="font-size:12px;padding:3px 6px;width:auto;">
                        <option value="right">Right Wall</option>
                        <option value="left">Left Wall</option>
                        <option value="top">Top Wall</option>
                        <option value="bottom">Bottom Wall</option>
                      </select>
                      <button class="btn btn-sm" id="btn-fp-add-door" data-room="${this._escape(selBoxName)}" style="padding:3px 8px;font-size:12px;">+ Add Door</button>
                    </div>
                  </div>

                  ${
                    selBoxEntryways.length === 0
                      ? `<div style="font-size:12px;color:var(--ha-muted);">No doorways on this room yet. Add one so cameras can see in/out.</div>`
                      : `
                    <div style="display:flex;flex-direction:column;gap:6px;max-height:140px;overflow-y:auto;">
                      ${selBoxEntryways
                        .map(
                          (ew) => `
                        <div style="display:grid;grid-template-columns:80px 1fr 1fr 1fr auto;gap:6px;align-items:center;background:var(--ha-subtle);padding:4px 8px;border-radius:6px;font-size:12px;">
                          <div style="font-weight:500;text-transform:capitalize;">${this._escape(
                            ew.wall
                          )}</div>
                          <div><small>Offset</small><input type="number" class="input fp-door-field" data-door-id="${this._escape(
                            ew.id
                          )}" data-key="offset" value="${Number(
                            ew.offset
                          )}" style="padding:2px 4px;font-size:11.5px;" /></div>
                          <div><small>Width</small><input type="number" class="input fp-door-field" data-door-id="${this._escape(
                            ew.id
                          )}" data-key="width" value="${Number(
                            ew.width
                          )}" style="padding:2px 4px;font-size:11.5px;" /></div>
                          <div>
                            <small>Type</small>
                            <select class="select fp-door-field" data-door-id="${this._escape(
                              ew.id
                            )}" data-key="type" style="padding:2px 4px;font-size:11.5px;">
                              <option value="door" ${ew.type === "door" ? "selected" : ""}>Door</option>
                              <option value="open_passage" ${
                                ew.type === "open_passage" ? "selected" : ""
                              }>Open Arch</option>
                            </select>
                          </div>
                          <button class="btn btn-sm btn-fp-delete-door" data-door-id="${this._escape(
                            ew.id
                          )}" data-room="${this._escape(
                            selBoxName
                          )}" style="padding:2px 6px;color:#dc2626;" title="Delete doorway">✕</button>
                        </div>`
                        )
                        .join("")}
                    </div>`
                  }
                </div>

                <div style="display:flex;gap:8px;margin-top:12px;">
                  <button class="btn btn-sm" id="btn-fp-save">Save Layout</button>
                  <button class="btn btn-sm" id="btn-fp-reset">Reset Default Layout</button>
                </div>`
              }
            </div>
          </div>`
            : ""
        }
      </div>

      <!-- Collapsible Coverage Notes Bar -->
      <div class="advanced-toggle-bar" id="btn-toggle-fp-notes">
        <div>
          <div style="font-size:14px;font-weight:500;color:var(--ha-text);">
            ${this._showFloorplanNotes ? "▾ Hide Coverage & Shared Camera Notes" : `▸ Coverage & Shared Camera Notes (${ambiguities.length})`}
          </div>
          <div style="font-size:12.5px;color:var(--ha-muted);margin-top:2px;">
            Areas where a camera sees into a neighboring room or where a room has no direct camera coverage
          </div>
        </div>
        <span style="font-size:12.5px;color:var(--ha-primary);font-weight:500;">
          ${this._showFloorplanNotes ? "Collapse" : "Expand"}
        </span>
      </div>

      ${
        this._showFloorplanNotes
          ? `
        <div class="ha-card">
          <div class="list-divider" style="border-top:none;">
            ${ambiguities
              .map(
                (amb) => `
              <div style="padding:12px 0;border-bottom:1px solid var(--ha-divider);">
                <div style="font-size:14px;font-weight:500;">${this._escape(
                  amb.title || amb.room || (amb.rooms || []).join(" ↔ ")
                )}</div>
                <div style="font-size:13px;color:var(--ha-muted);margin-top:2px;">${this._escape(
                  amb.description
                )}</div>
                <div style="font-size:12.5px;color:var(--ha-primary);margin-top:4px;">${this._escape(
                  amb.resolution || amb.recommendation || ""
                )}</div>
              </div>`
              )
              .join("")}
          </div>
        </div>`
          : ""
      }
    `;
  }

  _renderStatisticsPane(selRoom) {
    if (!selRoom) {
      return `<div class="ha-card">Select a room to view its activity history.</div>`;
    }
    const st = this._statsData;
    if (!st || st.entry_id !== selRoom.entry_id) {
      return `<div class="ha-card">Loading activity history for <strong>${this._escape(
        selRoom.room_name
      )}</strong>...</div>`;
    }
    const sum = st.summary || {};
    const series = st.series || [];
    const swimlanes = st.swimlanes || [];
    const W = 900;
    const H = 160;
    const { linePath, areaPath } = this._buildStepSvgPaths(series, W, H);
    const threshY = H - (Number(st.threshold_pct || 75) / 100) * (H - 12) - 6;

    return `
      <div class="ha-card">
        <div class="card-head" style="flex-wrap:wrap;">
          <div>
            <h2 class="card-title" style="font-size:18px;">${this._escape(
              selRoom.room_name
            )} — Activity History</h2>
            <div class="card-desc">
              Occupied for ${Number(sum.occupied_minutes || 0).toFixed(0)} minutes (${Number(
      sum.occupied_pct || 0
    ).toFixed(1)}%) over the last ${sum.window_hours || this._historyHours} hours.
            </div>
          </div>

          <div style="display:flex;gap:8px;align-items:center;">
            <div class="seg-group" style="margin-top:0;">
              ${[
                { h: 1, label: "1h" },
                { h: 6, label: "6h" },
                { h: 24, label: "24h" },
                { h: 168, label: "7d" },
              ]
                .map(
                  (w) =>
                    `<button class="seg-btn ${
                      Number(this._historyHours) === w.h ? "active" : ""
                    }" data-history-hours="${w.h}" style="padding:5px 10px;">${w.label}</button>`
                )
                .join("")}
            </div>
            <button class="btn btn-sm" id="btn-jump-to-replay">What-If Simulator</button>
          </div>
        </div>

        <div style="background:var(--ha-subtle);border:1px solid var(--ha-divider);border-radius:10px;padding:12px;margin-bottom:16px;">
          <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:160px;display:block;">
            <line x1="0" y1="${threshY.toFixed(1)}" x2="${W}" y2="${threshY.toFixed(
      1
    )}" stroke="#d97706" stroke-width="1.2" stroke-dasharray="5,4" />
            <path d="${areaPath}" fill="rgba(2, 132, 199, 0.12)" />
            <path d="${linePath}" fill="none" stroke="#0284c7" stroke-width="2" />
          </svg>
        </div>

        <div class="setting-label" style="margin-bottom:8px;">Sensor Activity Timeline</div>
        <div class="list-divider">
          ${swimlanes
            .map((lane) => {
              const segsHtml = (lane.segments || [])
                .map(
                  (seg) =>
                    `<div style="position:absolute;top:2px;bottom:2px;left:${seg.start_pct}%;width:${seg.width_pct}%;background:var(--ha-primary);border-radius:3px;"></div>`
                )
                .join("");
              return `
                <div style="display:grid;grid-template-columns:220px 1fr 80px;gap:12px;align-items:center;padding:8px 0;border-bottom:1px solid var(--ha-divider);font-size:13px;">
                  <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${this._escape(
                    lane.label
                  )}</div>
                  <div style="position:relative;height:14px;background:var(--ha-subtle);border:1px solid var(--ha-divider);border-radius:4px;overflow:hidden;">${segsHtml}</div>
                  <div style="text-align:right;color:var(--ha-muted);font-size:12px;">${Number(
                    lane.active_minutes || 0
                  ).toFixed(0)}m</div>
                </div>`;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  _renderReplayPane(selRoom, presets) {
    if (!selRoom) {
      return `<div class="ha-card">Select a room to run the What-If Replay Simulator.</div>`;
    }
    const cand = this._replayCandidate || this._draftConfig || {};
    const rep = this._replayData;
    const candPriorPct = Math.round(Number(cand.bayesian_prior ?? 0.2) * 100);
    const candThreshPct = Math.round(Number(cand.bayesian_threshold ?? 0.75) * 100);

    if (!rep || rep.entry_id !== selRoom.entry_id) {
      return `<div class="ha-card">Simulating historical replay for <strong>${this._escape(
        selRoom.room_name
      )}</strong>...</div>`;
    }

    const baseRes = rep.baseline || {};
    const candRes = rep.candidate || {};
    const divergences = rep.divergence_windows || [];
    const W = 900;
    const H = 170;
    const basePaths = this._buildStepSvgPaths(baseRes.series || [], W, H);
    const candPaths = this._buildStepSvgPaths(candRes.series || [], W, H);

    return `
      <div class="ha-card">
        <div class="card-head" style="flex-wrap:wrap;">
          <div>
            <h2 class="card-title" style="font-size:18px;">${this._escape(
              selRoom.room_name
            )} — What-If Replay Simulator (${this._historyHours}h)</h2>
            <div class="card-desc">
              Test different timeout or threshold settings against recorded sensor history before saving.
            </div>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-sm" id="btn-back-to-stats">Back to Activity History</button>
            <button class="btn btn-sm" id="btn-replay-reset">Reset</button>
            <button class="btn btn-primary btn-sm" id="btn-replay-apply">Apply to Room</button>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:12px;margin-bottom:16px;">
          <div>
            <div class="setting-label" style="font-size:12.5px;">Candidate Prior: ${candPriorPct}%</div>
            <input type="range" min="5" max="50" step="1" id="rep-prior-slider" value="${candPriorPct}" style="width:100%;" />
          </div>
          <div>
            <div class="setting-label" style="font-size:12.5px;">Candidate Threshold: ${candThreshPct}%</div>
            <input type="range" min="50" max="95" step="1" id="rep-thresh-slider" value="${candThreshPct}" style="width:100%;" />
          </div>
          <div>
            <div class="setting-label" style="font-size:12.5px;">Clear Delay (sec)</div>
            <input type="number" class="input" id="rep-inactivity" value="${Number(
              cand.inactivity_timeout ?? 180
            )}" />
          </div>
        </div>

        <div style="background:var(--ha-subtle);border:1px solid var(--ha-divider);border-radius:10px;padding:12px;margin-bottom:14px;">
          <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:170px;display:block;">
            <path d="${basePaths.linePath}" fill="none" stroke="#94a3b8" stroke-width="1.6" stroke-dasharray="4,3" />
            <path d="${candPaths.linePath}" fill="none" stroke="#0284c7" stroke-width="2.2" />
          </svg>
        </div>

        <div style="font-size:13px;color:var(--ha-muted);">
          ${divergences.length} differences between current settings and candidate settings over the last ${this._historyHours} hours.
        </div>
      </div>
    `;
  }

  _bindEvents() {
    const root = this.shadowRoot;
    const presets = (this._overview && this._overview.presets) || {};

    root.querySelectorAll(".nav-tab[data-studio-view]").forEach((el) => {
      el.addEventListener("click", () => {
        const v = el.getAttribute("data-studio-view");
        this._studioView = v;
        if (v === "statistics") {
          this.loadStatistics();
        } else if (v === "replay") {
          if (!this._replayCandidate && this._draftConfig) {
            this._replayCandidate = JSON.parse(JSON.stringify(this._draftConfig));
          }
          this.runReplay();
        } else if (v === "floorplan") {
          if (!this._floorplan) {
            this.loadFloorplan();
          } else {
            this.render();
          }
        } else {
          this.render();
        }
      });
    });

    // Advanced drawer toggle & tabs
    root.querySelector("#btn-toggle-advanced")?.addEventListener("click", () => {
      this._showAdvanced = !this._showAdvanced;
      this.render();
    });
    root.querySelectorAll(".sub-tab[data-adv-tab]").forEach((el) => {
      el.addEventListener("click", () => {
        this._advTab = el.getAttribute("data-adv-tab") || "tuning";
        this.render();
      });
    });

    // Simple Sensor Role selector & Add Sensor
    root.querySelectorAll(".obs-role-simple").forEach((el) => {
      el.addEventListener("change", () => {
        const idx = Number(el.getAttribute("data-idx"));
        const obs = this._draftConfig?.bayesian_observations?.[idx];
        if (!obs) return;
        this._applyFriendlyRoleGroup(obs, el.value, presets);
        this._dirty = true;
        this.refreshPreview();
      });
    });

    root.querySelector("#btn-simple-add-obs")?.addEventListener("click", () => {
      const entityInput = root.querySelector("#simple-add-obs-entity");
      const roleSelect = root.querySelector("#simple-add-obs-role");
      const eid = entityInput?.value?.trim() || "";
      if (!eid) {
        this.showToast("Select a sensor entity to add", "info");
        return;
      }
      const entities = (this._overview && this._overview.entities) || [];
      const found = entities.find((e) => e.entity_id === eid);
      const newObs = {
        entity_id: eid,
        label: found?.name || eid,
        operator: "equals",
        state: "on",
      };
      this._applyFriendlyRoleGroup(newObs, roleSelect?.value || "shared", presets);
      this._draftConfig.bayesian_observations.push(newObs);
      this._dirty = true;
      this.refreshPreview();
    });

    // Bounded Door Toggle
    root.querySelector("#cfg-bounded-toggle")?.addEventListener("change", (e) => {
      this._draftConfig.mode = e.target.checked ? "bounded" : "open";
      if (!e.target.checked) {
        this._draftConfig.boundary_entities = [];
      }
      this._dirty = true;
      this.refreshPreview();
    });

    // Connected room dropdown auto-add on select
    root.querySelector("#add-connected-room-input")?.addEventListener("change", (e) => {
      const val = e.target.value?.trim();
      if (!val) return;
      if (!this._draftConfig.connected_rooms) this._draftConfig.connected_rooms = [];
      if (!this._draftConfig.connected_rooms.includes(val)) {
        this._draftConfig.connected_rooms.push(val);
        this._dirty = true;
        this.refreshPreview();
      }
    });

    root.querySelectorAll(".del-connected-room").forEach((el) => {
      el.addEventListener("click", () => {
        const idx = Number(el.getAttribute("data-idx"));
        if (Array.isArray(this._draftConfig.connected_rooms)) {
          this._draftConfig.connected_rooms.splice(idx, 1);
          this._dirty = true;
          this.refreshPreview();
        }
      });
    });

    // Floorplan view events
    root.querySelectorAll(".seg-btn[data-floor-id]").forEach((el) => {
      el.addEventListener("click", () => {
        this._selectedFloorId = el.getAttribute("data-floor-id") || "main";
        this._selectedCamEntity = null;
        this.render();
      });
    });
    root.querySelector("#btn-toggle-fp-inspector")?.addEventListener("click", () => {
      this._showFloorplanInspector = !this._showFloorplanInspector;
      this.render();
    });
    root.querySelector("#btn-toggle-fp-notes")?.addEventListener("click", () => {
      this._showFloorplanNotes = !this._showFloorplanNotes;
      this.render();
    });
    root.querySelector("#btn-fp-save")?.addEventListener("click", () =>
      this.saveOrCompileFloorplan("save")
    );
    root.querySelector("#btn-fp-reset")?.addEventListener("click", () =>
      this.saveOrCompileFloorplan("reset")
    );
    root.querySelector("#btn-fp-compile")?.addEventListener("click", () =>
      this.saveOrCompileFloorplan("compile_and_apply")
    );
    root.querySelector("#fp-cam-select")?.addEventListener("change", (e) => {
      this._selectedCamEntity = e.target.value;
      this.render();
    });

    // Doorway Inspector actions
    root.querySelector("#btn-fp-add-door")?.addEventListener("click", (e) => {
      const rname = e.currentTarget.getAttribute("data-room");
      const wall = root.querySelector("#fp-new-door-wall")?.value || "right";
      const boxes = this._floorplan?.rooms || [];
      const box = boxes.find((b) => (b.name || b.room_name) === rname);
      if (!box) return;
      if (!Array.isArray(box.entryways)) box.entryways = [];
      const newDoorId = "door_" + Math.random().toString(36).substring(2, 9);
      const rw = Number(box.width ?? box.w ?? 200);
      const rh = Number(box.height ?? box.h ?? 150);
      const maxLen = wall === "top" || wall === "bottom" ? rw : rh;
      const width = 36;
      const offset = Math.max(0, Math.min(maxLen - width, Math.round((maxLen - width) / 2)));
      box.entryways.push({
        id: newDoorId,
        wall: wall,
        offset: offset,
        width: width,
        type: "door",
      });
      this._selectedDoorId = newDoorId;
      this._compiledTopology = this._compileFloorplanClient(this._floorplan);
      this._debounceSaveFloorplan();
      this.render();
    });

    root.querySelectorAll(".btn-fp-delete-door").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        const doorId = el.getAttribute("data-door-id");
        const rname = el.getAttribute("data-room");
        const boxes = this._floorplan?.rooms || [];
        const box = boxes.find((b) => (b.name || b.room_name) === rname);
        if (!box || !Array.isArray(box.entryways)) return;
        const idx = box.entryways.findIndex((ew) => ew.id === doorId);
        if (idx >= 0) {
          box.entryways.splice(idx, 1);
          if (this._selectedDoorId === doorId) this._selectedDoorId = null;
          this._compiledTopology = this._compileFloorplanClient(this._floorplan);
          this._debounceSaveFloorplan();
          this.render();
        }
      });
    });

    root.querySelectorAll(".fp-door-field").forEach((el) => {
      el.addEventListener("change", () => {
        const doorId = el.getAttribute("data-door-id");
        const key = el.getAttribute("data-key");
        const boxes = this._floorplan?.rooms || [];
        for (const box of boxes) {
          const ew = (box.entryways || []).find((d) => d.id === doorId);
          if (ew && key) {
            ew[key] = key === "offset" || key === "width" ? Number(el.value) : el.value;
            this._compiledTopology = this._compileFloorplanClient(this._floorplan);
            this._debounceSaveFloorplan();
            this.render();
            break;
          }
        }
      });
    });

    root.querySelectorAll(".fp-cam-field").forEach((el) => {
      el.addEventListener("change", () => {
        const key = el.getAttribute("data-key");
        const cams = this._floorplan?.cameras || [];
        const cam = cams.find((c) => (c.id || c.camera_entity) === this._selectedCamEntity);
        if (!cam || !key) return;
        cam[key] = Number(el.value);
        this._compiledTopology = this._compileFloorplanClient(this._floorplan);
        this._debounceSaveFloorplan();
        this.render();
      });
    });

    root.querySelectorAll(".fp-box-field").forEach((el) => {
      el.addEventListener("change", () => {
        const rname = el.getAttribute("data-room");
        const key = el.getAttribute("data-key");
        const boxes = this._floorplan?.rooms || [];
        const box = boxes.find((b) => (b.name || b.room_name) === rname);
        if (!box || !key) return;
        box[key] = Number(el.value);
        this._compiledTopology = this._compileFloorplanClient(this._floorplan);
        this._debounceSaveFloorplan();
        this.render();
      });
    });

    // Interactive Canvas Pointer Dragging & Snapping
    const svgCanvas = root.querySelector("#fp-svg-canvas");
    if (svgCanvas) {
      svgCanvas.addEventListener("pointerdown", (e) => {
        const resizeHandle = e.target.closest(".fp-resize-handle");
        const camHandle = e.target.closest(".fp-cam-handle");
        const camOrigin = e.target.closest(".fp-cam-origin");
        const doorTab = e.target.closest(".fp-door-tab");
        const doorHandle = e.target.closest(".fp-door-handle");
        const roomBox = e.target.closest(".fp-room-box");

        const startPt = this._getSvgPoint(e, svgCanvas);

        if (resizeHandle) {
          const handle = resizeHandle.getAttribute("data-handle");
          const rname = resizeHandle.getAttribute("data-room-name");
          const box = (this._floorplan?.rooms || []).find((b) => (b.name || b.room_name) === rname);
          if (box) {
            this._selectedRoomBoxName = rname;
            this._activeFpDrag = {
              type: "resize_room",
              handle,
              roomName: rname,
              hasMoved: false,
              startPt,
              startBox: {
                x: Number(box.x),
                y: Number(box.y),
                width: Number(box.width ?? box.w ?? 200),
                height: Number(box.height ?? box.h ?? 150),
              },
            };
            try {
              svgCanvas.setPointerCapture(e.pointerId);
            } catch (_e) {}
            e.preventDefault();
            e.stopPropagation();
          }
          return;
        }

        if (camHandle) {
          const handle = camHandle.getAttribute("data-handle");
          const camId = camHandle.getAttribute("data-cam-id");
          const cam = (this._floorplan?.cameras || []).find(
            (c) => (c.id || c.camera_entity) === camId
          );
          if (cam) {
            this._selectedCamEntity = camId;
            this._activeFpDrag = {
              type: "cam_handle",
              handle,
              camId,
              hasMoved: false,
              startPt,
              startCam: {
                x: Number(cam.x),
                y: Number(cam.y),
                heading_deg: Number(cam.heading_deg || 0),
                fov_deg: Number(cam.fov_deg || 90),
                range_px: Number(cam.range_px || 180),
              },
            };
            try {
              svgCanvas.setPointerCapture(e.pointerId);
            } catch (_e) {}
            e.preventDefault();
            e.stopPropagation();
          }
          return;
        }

        if (camOrigin) {
          const camId = camOrigin.getAttribute("data-cam-entity");
          const cam = (this._floorplan?.cameras || []).find(
            (c) => (c.id || c.camera_entity) === camId
          );
          if (cam) {
            this._selectedCamEntity = camId;
            this._activeFpDrag = {
              type: "move_cam",
              camId,
              hasMoved: false,
              startPt,
              startCam: {
                x: Number(cam.x),
                y: Number(cam.y),
              },
            };
            try {
              svgCanvas.setPointerCapture(e.pointerId);
            } catch (_e) {}
            e.preventDefault();
            e.stopPropagation();
          }
          return;
        }

        if (doorTab) {
          const tab = doorTab.getAttribute("data-tab");
          const doorId = doorTab.getAttribute("data-door-id");
          const rname = doorTab.getAttribute("data-room-name");
          const box = (this._floorplan?.rooms || []).find((b) => (b.name || b.room_name) === rname);
          const ew = (box?.entryways || []).find((d) => d.id === doorId);
          if (box && ew) {
            this._selectedDoorId = doorId;
            this._selectedRoomBoxName = rname;
            this._activeFpDrag = {
              type: "resize_door",
              tab,
              doorId,
              roomName: rname,
              hasMoved: false,
              startPt,
              startOffset: Number(ew.offset || 0),
              startWidth: Number(ew.width || 36),
              wall: ew.wall,
              boxGeometry: {
                x: Number(box.x),
                y: Number(box.y),
                width: Number(box.width ?? box.w ?? 200),
                height: Number(box.height ?? box.h ?? 150),
              },
            };
            try {
              svgCanvas.setPointerCapture(e.pointerId);
            } catch (_e) {}
            e.preventDefault();
            e.stopPropagation();
          }
          return;
        }

        if (doorHandle) {
          const doorId = doorHandle.getAttribute("data-door-id");
          const rname = doorHandle.getAttribute("data-room-name");
          const box = (this._floorplan?.rooms || []).find((b) => (b.name || b.room_name) === rname);
          const ew = (box?.entryways || []).find((d) => d.id === doorId);
          if (box && ew) {
            this._selectedDoorId = doorId;
            this._selectedRoomBoxName = rname;
            this._activeFpDrag = {
              type: "move_door",
              doorId,
              roomName: rname,
              hasMoved: false,
              startPt,
              startOffset: Number(ew.offset || 0),
              startWidth: Number(ew.width || 36),
              wall: ew.wall,
              boxGeometry: {
                x: Number(box.x),
                y: Number(box.y),
                width: Number(box.width ?? box.w ?? 200),
                height: Number(box.height ?? box.h ?? 150),
              },
            };
            try {
              svgCanvas.setPointerCapture(e.pointerId);
            } catch (_e) {}
            e.preventDefault();
            e.stopPropagation();
          }
          return;
        }

        if (roomBox) {
          const rname = roomBox.getAttribute("data-room-name");
          const box = (this._floorplan?.rooms || []).find((b) => (b.name || b.room_name) === rname);
          if (box) {
            this._selectedRoomBoxName = rname;
            const room = (this._overview?.rooms || []).find((r) => r.room_name === rname);
            if (room) this._selectRoomObject(room, false);
            this._activeFpDrag = {
              type: "move_room",
              roomName: rname,
              hasMoved: false,
              startPt,
              startBox: {
                x: Number(box.x),
                y: Number(box.y),
                width: Number(box.width ?? box.w ?? 200),
                height: Number(box.height ?? box.h ?? 150),
              },
            };
            try {
              svgCanvas.setPointerCapture(e.pointerId);
            } catch (_e) {}
            e.preventDefault();
          }
          return;
        }

        // Empty canvas click
        this._selectedDoorId = null;
      });

      svgCanvas.addEventListener("pointermove", (e) => {
        if (!this._activeFpDrag) return;
        const drag = this._activeFpDrag;
        const pt = this._getSvgPoint(e, svgCanvas);
        const dx = pt.x - drag.startPt.x;
        const dy = pt.y - drag.startPt.y;

        if (!drag.hasMoved && Math.hypot(dx, dy) > 2) {
          drag.hasMoved = true;
        }

        if (drag.type === "move_room") {
          const box = (this._floorplan?.rooms || []).find(
            (b) => (b.name || b.room_name) === drag.roomName
          );
          if (!box) return;
          let nx = drag.startBox.x + dx;
          let ny = drag.startBox.y + dy;
          nx = Math.max(0, Math.min(1000 - drag.startBox.width, nx));
          ny = Math.max(0, Math.min(580 - drag.startBox.height, ny));
          box.x = nx;
          box.y = ny;
          box.width = drag.startBox.width;
          box.height = drag.startBox.height;
          if (!e.shiftKey) {
            this._snapRoomGeometry(box, this._floorplan?.rooms || [], 10);
          }
          this._compiledTopology = this._compileFloorplanClient(this._floorplan);
          this._scheduleCanvasRender();
        } else if (drag.type === "resize_room") {
          const box = (this._floorplan?.rooms || []).find(
            (b) => (b.name || b.room_name) === drag.roomName
          );
          if (!box) return;
          let { x, y, width, height } = drag.startBox;
          if (drag.handle.includes("e")) width += dx;
          if (drag.handle.includes("s")) height += dy;
          if (drag.handle.includes("w")) {
            x += dx;
            width -= dx;
          }
          if (drag.handle.includes("n")) {
            y += dy;
            height -= dy;
          }
          if (width < 50) {
            if (drag.handle.includes("w")) x -= 50 - width;
            width = 50;
          }
          if (height < 50) {
            if (drag.handle.includes("n")) y -= 50 - height;
            height = 50;
          }
          if (!e.shiftKey) {
            x = this._snapValue(x, 10);
            y = this._snapValue(y, 10);
            width = this._snapValue(width, 10);
            height = this._snapValue(height, 10);
          }
          box.x = Math.max(0, x);
          box.y = Math.max(0, y);
          box.width = Math.max(50, width);
          box.height = Math.max(50, height);
          this._compiledTopology = this._compileFloorplanClient(this._floorplan);
          this._scheduleCanvasRender();
        } else if (drag.type === "move_cam") {
          const cam = (this._floorplan?.cameras || []).find(
            (c) => (c.id || c.camera_entity) === drag.camId
          );
          if (!cam) return;
          let nx = drag.startCam.x + dx;
          let ny = drag.startCam.y + dy;
          if (!e.shiftKey) {
            nx = this._snapValue(nx, 5);
            ny = this._snapValue(ny, 5);
          }
          cam.x = Math.max(10, Math.min(990, Math.round(nx)));
          cam.y = Math.max(10, Math.min(570, Math.round(ny)));
          this._compiledTopology = this._compileFloorplanClient(this._floorplan);
          this._scheduleCanvasRender();
        } else if (drag.type === "cam_handle") {
          const cam = (this._floorplan?.cameras || []).find(
            (c) => (c.id || c.camera_entity) === drag.camId
          );
          if (!cam) return;
          const cx = Number(cam.x);
          const cy = Number(cam.y);
          if (drag.handle === "heading") {
            let deg = (Math.atan2(pt.y - cy, pt.x - cx) * 180) / Math.PI;
            if (deg < 0) deg += 360;
            if (!e.shiftKey) deg = Math.round(deg / 5) * 5;
            cam.heading_deg = Math.round(deg) % 360;
          } else if (drag.handle === "range") {
            const dist = Math.hypot(pt.x - cx, pt.y - cy);
            let r = Math.max(40, Math.min(700, Math.round(dist)));
            if (!e.shiftKey) r = Math.round(r / 5) * 5;
            cam.range_px = r;
          } else if (drag.handle === "fov_start" || drag.handle === "fov_end") {
            let pointerAngle = (Math.atan2(pt.y - cy, pt.x - cx) * 180) / Math.PI;
            if (pointerAngle < 0) pointerAngle += 360;
            const heading = Number(cam.heading_deg || 0);
            const angleDiff = Math.abs(((pointerAngle - heading + 540) % 360) - 180);
            let newFov = Math.max(15, Math.min(160, Math.round(angleDiff * 2)));
            if (!e.shiftKey) newFov = Math.round(newFov / 5) * 5;
            cam.fov_deg = newFov;
          }
          this._compiledTopology = this._compileFloorplanClient(this._floorplan);
          this._scheduleCanvasRender();
        } else if (drag.type === "move_door") {
          const box = (this._floorplan?.rooms || []).find(
            (b) => (b.name || b.room_name) === drag.roomName
          );
          const ew = (box?.entryways || []).find((d) => d.id === drag.doorId);
          if (!box || !ew) return;
          const rx = Number(box.x);
          const ry = Number(box.y);
          const rw = Number(box.width ?? box.w ?? 200);
          const rh = Number(box.height ?? box.h ?? 150);
          if (drag.wall === "top" || drag.wall === "bottom") {
            let offset = pt.x - rx - ew.width / 2;
            offset = Math.max(0, Math.min(rw - ew.width, offset));
            if (!e.shiftKey) offset = this._snapValue(offset, 5);
            ew.offset = offset;
          } else {
            let offset = pt.y - ry - ew.width / 2;
            offset = Math.max(0, Math.min(rh - ew.width, offset));
            if (!e.shiftKey) offset = this._snapValue(offset, 5);
            ew.offset = offset;
          }
          this._compiledTopology = this._compileFloorplanClient(this._floorplan);
          this._scheduleCanvasRender();
        } else if (drag.type === "resize_door") {
          const box = (this._floorplan?.rooms || []).find(
            (b) => (b.name || b.room_name) === drag.roomName
          );
          const ew = (box?.entryways || []).find((d) => d.id === drag.doorId);
          if (!box || !ew) return;
          const rx = Number(box.x);
          const ry = Number(box.y);
          const rw = Number(box.width ?? box.w ?? 200);
          const rh = Number(box.height ?? box.h ?? 150);
          if (drag.tab === "end") {
            if (drag.wall === "top" || drag.wall === "bottom") {
              let newWidth = pt.x - (rx + ew.offset);
              newWidth = Math.max(16, Math.min(rw - ew.offset, newWidth));
              if (!e.shiftKey) newWidth = this._snapValue(newWidth, 5);
              ew.width = newWidth;
            } else {
              let newWidth = pt.y - (ry + ew.offset);
              newWidth = Math.max(16, Math.min(rh - ew.offset, newWidth));
              if (!e.shiftKey) newWidth = this._snapValue(newWidth, 5);
              ew.width = newWidth;
            }
          } else if (drag.tab === "start") {
            if (drag.wall === "top" || drag.wall === "bottom") {
              const endX = rx + drag.startOffset + drag.startWidth;
              let newOffset = pt.x - rx;
              newOffset = Math.max(0, Math.min(drag.startOffset + drag.startWidth - 16, newOffset));
              if (!e.shiftKey) newOffset = this._snapValue(newOffset, 5);
              ew.offset = newOffset;
              ew.width = endX - (rx + newOffset);
            } else {
              const endY = ry + drag.startOffset + drag.startWidth;
              let newOffset = pt.y - ry;
              newOffset = Math.max(0, Math.min(drag.startOffset + drag.startWidth - 16, newOffset));
              if (!e.shiftKey) newOffset = this._snapValue(newOffset, 5);
              ew.offset = newOffset;
              ew.width = endY - (ry + newOffset);
            }
          }
          this._compiledTopology = this._compileFloorplanClient(this._floorplan);
          this._scheduleCanvasRender();
        }
      });

      const onPointerUp = (e) => {
        if (!this._activeFpDrag) return;
        try {
          if (svgCanvas.hasPointerCapture(e.pointerId)) {
            svgCanvas.releasePointerCapture(e.pointerId);
          }
        } catch (_e) {}
        this._activeFpDrag = null;
        this._debounceSaveFloorplan();
        this.render();
      };

      svgCanvas.addEventListener("pointerup", onPointerUp);
      svgCanvas.addEventListener("pointercancel", onPointerUp);
    }
    root.querySelector("#btn-open-floorplan-tab")?.addEventListener("click", () => {
      this._studioView = "floorplan";
      if (!this._floorplan) {
        this._floorplan = this._loadLocalOrDefaultFloorplan();
        this._compiledTopology = this._compileFloorplanClient(this._floorplan);
      }
      const curRoom = this.selectedRoom;
      const box = (this._floorplan?.rooms || []).find(
        (b) => curRoom && (b.name || b.room_name) === curRoom.room_name
      );
      if (box && box.floor) {
        this._selectedFloorId = box.floor;
      }
      this.render();
    });

    root.querySelectorAll(".seg-btn[data-history-hours]").forEach((el) => {
      el.addEventListener("click", () => {
        this._historyHours = Number(el.getAttribute("data-history-hours") || 6);
        if (this._studioView === "statistics") {
          this.loadStatistics();
        } else if (this._studioView === "replay") {
          this.runReplay();
        }
      });
    });

    root.querySelector("#btn-jump-to-replay")?.addEventListener("click", () => {
      this._studioView = "replay";
      this._replayCandidate = JSON.parse(JSON.stringify(this._draftConfig || {}));
      this.runReplay();
    });
    root.querySelector("#btn-back-to-stats")?.addEventListener("click", () => {
      this._studioView = "statistics";
      this.loadStatistics();
    });

    // Replay Simulator events
    root.querySelector("#btn-replay-reset")?.addEventListener("click", () => {
      this._replayCandidate = JSON.parse(JSON.stringify(this._draftConfig || {}));
      this.runReplay();
    });
    root.querySelector("#btn-replay-apply")?.addEventListener("click", () =>
      this.applyReplayCandidate()
    );
    root.querySelector("#rep-prior-slider")?.addEventListener("change", (e) => {
      this._replayCandidate.bayesian_prior = Number(e.target.value) / 100.0;
      this.runReplay();
    });
    root.querySelector("#rep-thresh-slider")?.addEventListener("change", (e) => {
      this._replayCandidate.bayesian_threshold = Number(e.target.value) / 100.0;
      this.runReplay();
    });
    root.querySelector("#rep-inactivity")?.addEventListener("change", (e) => {
      this._replayCandidate.inactivity_timeout = Number(e.target.value);
      this.runReplay();
    });

    root.querySelector("#btn-toggle-ha-sidebar")?.addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent("hass-toggle-menu", { bubbles: true, composed: true }));
    });
    root.querySelector("#btn-refresh-overview")?.addEventListener("click", () => {
      this.loadOverview(true);
    });
    root.querySelector("#btn-open-global")?.addEventListener("click", () => {
      this._showGlobalModal = true;
      this.render();
    });
    root.querySelector("#btn-close-global")?.addEventListener("click", () => {
      this._showGlobalModal = false;
      this.render();
    });
    root.querySelector("#btn-cancel-global")?.addEventListener("click", () => {
      this._showGlobalModal = false;
      this.render();
    });
    root.querySelector("#btn-save-global")?.addEventListener("click", () => {
      this._globalDraft = {
        ...this._globalDraft,
        llm_provider_type: root.querySelector("#gl-provider")?.value || "vision_api",
        llm_api_url: root.querySelector("#gl-api-url")?.value || "",
        llm_model: root.querySelector("#gl-model")?.value || "",
        llm_agent_id: root.querySelector("#gl-agent-id")?.value || "",
        ble_trackers: root.querySelector("#gl-ble")?.value || "",
      };
      this.saveGlobalSettings();
    });

    root.querySelector("#room-search-input")?.addEventListener("input", (e) => {
      this._roomSearch = e.target.value;
      this.render();
    });
    root.querySelectorAll(".seg-btn[data-filter]").forEach((el) => {
      el.addEventListener("click", () => {
        this._roomFilter = el.getAttribute("data-filter");
        this.render();
      });
    });
    root.querySelectorAll(".room-row[data-room-id]").forEach((el) => {
      el.addEventListener("click", () => {
        const rid = el.getAttribute("data-room-id");
        const room = (this._overview?.rooms || []).find((r) => r.entry_id === rid);
        if (room) this._selectRoomObject(room, true);
      });
    });

    // Room Header & Core Controls
    root.querySelector("#btn-save-room")?.addEventListener("click", () => this.saveCurrentRoom());
    root.querySelector("#btn-room-refresh")?.addEventListener("click", () =>
      this.runRoomAction("force_refresh")
    );
    root.querySelector("#btn-room-verify")?.addEventListener("click", () =>
      this.runRoomAction("verify_presence")
    );
    root.querySelector("#btn-room-override")?.addEventListener("click", () =>
      this.runRoomAction("set_override")
    );

    root.querySelector("#cfg-area-id")?.addEventListener("change", (e) => {
      this._draftConfig.area_id = e.target.value || null;
      this._dirty = true;
      this.render();
    });
    root.querySelector("#cfg-camera-entity")?.addEventListener("change", (e) => {
      this._draftConfig.camera_entity = e.target.value;
      this._dirty = true;
    });
    root.querySelector("#cfg-prior-slider")?.addEventListener("change", (e) => {
      this._draftConfig.bayesian_prior = Number(e.target.value) / 100.0;
      this._dirty = true;
      this.refreshPreview();
    });
    root.querySelector("#cfg-thresh-slider")?.addEventListener("change", (e) => {
      this._draftConfig.bayesian_threshold = Number(e.target.value) / 100.0;
      this._dirty = true;
      this.refreshPreview();
    });
    root.querySelector("#cfg-inactivity-timeout")?.addEventListener("change", (e) => {
      this._draftConfig.inactivity_timeout = Number(e.target.value);
      this._dirty = true;
      this.render();
    });

    root.querySelector("#btn-add-ble")?.addEventListener("click", () => {
      const rname = this._draftConfig.room_name || "Room";
      const trackers =
        (this._overview &&
          this._overview.global_settings &&
          this._overview.global_settings.ble_trackers) || [
          "sensor.steve_s_s25_ble_area",
          "sensor.tab_s10_lite_ble_area",
        ];
      const obs = this._draftConfig.bayesian_observations || [];
      trackers.forEach((eid, idx) => {
        if (!obs.some((o) => o.entity_id === eid)) {
          obs.push({
            entity_id: eid,
            label: idx === 0 ? `Primary Phone BLE (${rname})` : `Secondary BLE (${rname})`,
            preset: idx === 0 ? "moderate" : "supporting",
            prob_given_true: idx === 0 ? 0.72 : 0.35,
            prob_given_false: idx === 0 ? 0.12 : 0.22,
            operator: "equals",
            state: rname,
          });
        }
      });
      this._draftConfig.bayesian_observations = obs;
      this._dirty = true;
      this.refreshPreview();
    });

    root.querySelector("#btn-sync-triggers")?.addEventListener("click", () => {
      const obs = this._draftConfig.bayesian_observations || [];
      const triggers = [];
      for (const o of obs) {
        const preset = o.preset || o.weight || "moderate";
        if (
          (preset === "decisive" || preset === "strong") &&
          o.entity_id &&
          o.entity_id.startsWith("binary_sensor.")
        ) {
          if (!triggers.includes(o.entity_id)) triggers.push(o.entity_id);
        }
      }
      this._draftConfig.trigger_entities = triggers;
      this._dirty = true;
      this.showToast(`Synced ${triggers.length} main sensors`, "info");
    });

    root.querySelectorAll(".obs-field").forEach((el) => {
      el.addEventListener("change", () => {
        const idx = Number(el.getAttribute("data-idx"));
        const key = el.getAttribute("data-key");
        const obs = this._draftConfig.bayesian_observations[idx];
        if (!obs) return;
        obs[key] = el.value;
        this._dirty = true;
        this.refreshPreview();
      });
    });

    root.querySelectorAll(".obs-preset").forEach((el) => {
      el.addEventListener("change", () => {
        const idx = Number(el.getAttribute("data-idx"));
        const obs = this._draftConfig.bayesian_observations[idx];
        if (!obs) return;
        const p = el.value;
        obs.preset = p;
        if (presets[p] && p !== "custom") {
          obs.prob_given_true = presets[p].prob_given_true;
          obs.prob_given_false = presets[p].prob_given_false;
        }
        this._dirty = true;
        this.refreshPreview();
      });
    });

    root.querySelectorAll(".obs-prob").forEach((el) => {
      el.addEventListener("change", () => {
        const idx = Number(el.getAttribute("data-idx"));
        const key = el.getAttribute("data-key");
        const obs = this._draftConfig.bayesian_observations[idx];
        if (!obs) return;
        obs[key] = Number(el.value);
        obs.preset = "custom";
        this._dirty = true;
        this.refreshPreview();
      });
    });

    root.querySelectorAll(".obs-del").forEach((el) => {
      el.addEventListener("click", () => {
        const idx = Number(el.getAttribute("data-idx"));
        this._draftConfig.bayesian_observations.splice(idx, 1);
        this._dirty = true;
        this.refreshPreview();
      });
    });

    // Boundaries & Sustaining Conditions
    root.querySelector("#btn-add-boundary")?.addEventListener("click", () => {
      const val = root.querySelector("#add-boundary-input")?.value?.trim();
      if (val && !this._draftConfig.boundary_entities.includes(val)) {
        this._draftConfig.boundary_entities.push(val);
        this._dirty = true;
        this.refreshPreview();
      }
    });
    root.querySelectorAll(".del-boundary").forEach((el) => {
      el.addEventListener("click", () => {
        const idx = Number(el.getAttribute("data-idx"));
        this._draftConfig.boundary_entities.splice(idx, 1);
        this._dirty = true;
        this.refreshPreview();
      });
    });

    root.querySelector("#btn-add-condition")?.addEventListener("click", () => {
      this._draftConfig.sustaining_conditions.push({
        entity_id: "",
        label: "Keep Occupied Rule",
        operator: "equals",
        state: "playing",
      });
      this._dirty = true;
      this.render();
    });
    root.querySelectorAll(".cond-field").forEach((el) => {
      el.addEventListener("change", () => {
        const idx = Number(el.getAttribute("data-idx"));
        const key = el.getAttribute("data-key");
        const cond = this._draftConfig.sustaining_conditions[idx];
        if (!cond) return;
        cond[key] = el.value;
        this._dirty = true;
        this.refreshPreview();
      });
    });
    root.querySelectorAll(".cond-del").forEach((el) => {
      el.addEventListener("click", () => {
        const idx = Number(el.getAttribute("data-idx"));
        this._draftConfig.sustaining_conditions.splice(idx, 1);
        this._dirty = true;
        this.refreshPreview();
      });
    });

    // Advanced YAML & AI sub-tabs
    root.querySelectorAll("[data-rtab]").forEach((el) => {
      el.addEventListener("click", () => {
        this._rightTab = el.getAttribute("data-rtab");
        this.render();
      });
    });
    root.querySelector("#yaml-draft-editor")?.addEventListener("input", (e) => {
      this._yamlDraft = e.target.value;
    });
    root.querySelector("#btn-apply-yaml")?.addEventListener("click", () => this.applyYamlDraft());
    root.querySelector("#nl-prompt-input")?.addEventListener("input", (e) => {
      this._nlPrompt = e.target.value;
    });
    root.querySelector("#btn-nl-to-yaml")?.addEventListener("click", () =>
      this.runTranslation("nl_to_yaml")
    );
    root.querySelector("#btn-yaml-to-nl")?.addEventListener("click", () =>
      this.runTranslation("yaml_to_nl")
    );
    root.querySelectorAll(".btn-rollback").forEach((el) => {
      el.addEventListener("click", () => {
        const idx = Number(el.getAttribute("data-rev-idx"));
        this.rollbackRevision(idx);
      });
    });
  }
}

if (!customElements.get("presence-detection-designer-panel")) {
  customElements.define("presence-detection-designer-panel", PresenceDetectionDesignerPanel);
}
