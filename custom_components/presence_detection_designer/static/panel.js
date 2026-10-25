/**
 * Presence Detection Designer — Clean Home Assistant Material Design Panel
 * Custom Element: <presence-detection-designer-panel>
 */

const PDD_DEFAULT_FLOORPLAN = {"cameras": [{"floor": "main", "fov_deg": 65, "heading_deg": 355, "host_room": "Living Room", "id": "camera.living_room", "name": "Living Room Camera", "notes": "Covers Living Room and sightline projects directly through open archway into Front Entry.", "range_px": 350, "spills_into": ["Front Entry"], "x": 175, "y": 530, "zones": ["living_room_couch", "living_room_floor", "living_room_bay_windows", "living_room_entry"]}, {"floor": "main", "fov_deg": 55, "heading_deg": 85, "host_room": "Dining Room", "id": "camera.dining_room", "name": "Dining Room Camera", "notes": "Covers Dining Room table and projects sightline down table into Living Room couch.", "range_px": 240, "spills_into": ["Living Room"], "x": 175, "y": 135, "zones": ["dining_room_table", "rileys_food"]}, {"floor": "main", "fov_deg": 75, "heading_deg": 180, "host_room": "Family Room", "id": "camera.family_room", "name": "Family Room Camera", "notes": "Catches Family Room couch, flanks Kitchen Island, and sees pathway to Entryway and Basement.", "range_px": 420, "spills_into": ["Kitchen", "Front Entry"], "x": 830, "y": 135, "zones": ["family_room_couch", "family_room_recliner", "family_room_floor", "kitchen_island"]}, {"floor": "main", "fov_deg": 64, "heading_deg": 90, "host_room": "Garage", "id": "camera.garage", "name": "Garage Camera", "notes": "Mounted on interior wall looking South down parked car toward roll-up garage door.", "range_px": 170, "spills_into": [], "x": 680, "y": 390, "zones": ["garage_parking"]}, {"floor": "upstairs", "fov_deg": 80, "heading_deg": 69, "host_room": "Master Bedroom", "id": "camera.master_bedroom", "name": "Master Bedroom Camera", "notes": "Catches Master Bedroom plus entries to Upstairs Hallway and Master Bathroom/Closet.", "range_px": 480, "spills_into": ["Upstairs Hallway & Stairs", "Master Bathroom"], "x": 150, "y": 50, "zones": ["master_bed", "master_open_area", "master_bedroom_walkway", "master_bedroom_entryway", "master_bathroom"]}, {"floor": "upstairs", "fov_deg": 75, "heading_deg": 230, "host_room": "Margot's Room", "id": "camera.nursery", "name": "Nursery Camera", "notes": "Mounted on south wall looking northwest across bed, play floor, and dresser.", "range_px": 280, "spills_into": [], "x": 550, "y": 230, "zones": ["nursery_bed"]}, {"floor": "upstairs", "fov_deg": 80, "heading_deg": 250, "host_room": "Office", "id": "camera.office", "name": "Office Camera", "notes": "Covers Steve's desk and sim rig with hallway door on the left periphery.", "range_px": 320, "spills_into": ["Upstairs Hallway & Stairs"], "x": 855, "y": 525, "zones": ["steves_desk", "sim_rig", "office_floor", "office_entryway"]}, {"floor": "basement", "fov_deg": 90, "heading_deg": 235, "host_room": "Basement Theater", "id": "camera.basement_theater", "name": "Basement Theater Camera", "notes": "Covers media lounge sectional, wet bar, and catches stairwell.", "range_px": 350, "spills_into": ["Basement Play Area"], "x": 765, "y": 520, "zones": ["basement_theater_couch", "basement_theater_playpen", "basement_theater_floor", "basement_bar", "basement_play_area_far", "basement_stairwell"]}, {"floor": "basement", "fov_deg": 85, "heading_deg": 40, "host_room": "Basement Play Area", "id": "camera.basement_play_area", "name": "Basement Play Area Camera", "notes": "Covers Play Area & Counter; sees into Theater. Storage Room & Basement Bath are out of frame on left.", "range_px": 480, "spills_into": ["Basement Theater"], "x": 235, "y": 520, "zones": ["basement_play_floor", "basement_counter", "theater_rear_view"]}, {"floor": "basement", "fov_deg": 75, "heading_deg": 110, "host_room": "Storage Room", "id": "camera.storage_room", "name": "Storage Room Camera", "notes": "Covers interior Storage Room / Gym floor looking toward door to finished basement.", "range_px": 170, "spills_into": [], "x": 650, "y": 55, "zones": ["storage_room_workout"]}], "canvas": {"height": 600, "width": 1000}, "connections": [{"from_room": "Front Entry", "id": "conn_entry_lr", "label": "Open Archway (Entry <-> Living Room)", "to_room": "Living Room", "type": "open_passage"}, {"from_room": "Front Entry", "id": "conn_entry_kitchen", "label": "Pathway (Entry <-> Kitchen)", "to_room": "Kitchen", "type": "open_passage"}, {"from_room": "Front Entry", "id": "conn_entry_fr", "label": "Pathway (Entry <-> Family/Laundry/Basement)", "to_room": "Family Room", "type": "open_passage"}, {"from_room": "Living Room", "id": "conn_lr_dr", "label": "Open Passage (Living <-> Dining)", "to_room": "Dining Room", "type": "open_passage"}, {"from_room": "Dining Room", "id": "conn_dr_kitchen", "label": "Open Passage (Dining <-> Kitchen)", "to_room": "Kitchen", "type": "open_passage"}, {"from_room": "Kitchen", "id": "conn_kitchen_fr", "label": "Open Concept (Kitchen <-> Family Room)", "to_room": "Family Room", "type": "open_passage"}, {"entity_id": "binary_sensor.utility_room_door", "from_room": "Family Room", "id": "conn_fr_garage", "label": "Laundry / Garage Pathway", "to_room": "Garage", "type": "unmonitored_door"}, {"from_room": "Front Entry", "id": "conn_entry_upstairs", "label": "Main Stairs to Upstairs", "to_room": "Upstairs Hallway & Stairs", "type": "stairs"}, {"from_room": "Family Room", "id": "conn_fr_basement_play", "label": "Basement Stairs", "to_room": "Basement Play Area", "type": "stairs"}, {"from_room": "Family Room", "id": "conn_fr_basement_theater", "label": "Basement Stairs (Partial Sightline)", "to_room": "Basement Theater", "type": "stairs"}, {"from_room": "Upstairs Hallway & Stairs", "id": "conn_hall_office", "label": "Office Doorway (Next to Stairs)", "to_room": "Office", "type": "unmonitored_door"}, {"from_room": "Upstairs Hallway & Stairs", "id": "conn_hall_guest", "label": "Guest Room Doorway (No Sensor)", "to_room": "Guest Room", "type": "unmonitored_door"}, {"from_room": "Upstairs Hallway & Stairs", "id": "conn_hall_nursery", "label": "Nursery Doorway (Seen Partially by Cam)", "to_room": "Margot's Room", "type": "unmonitored_door"}, {"from_room": "Upstairs Hallway & Stairs", "id": "conn_hall_master", "label": "Master Bedroom Entryway", "to_room": "Master Bedroom", "type": "unmonitored_door"}, {"from_room": "Master Bedroom", "id": "conn_master_bath", "label": "Master Bath / Shower Stall Entry", "to_room": "Master Bathroom", "type": "unmonitored_door"}, {"from_room": "Upstairs Hallway & Stairs", "id": "conn_hall_ubath", "label": "Shared Bathroom (Double Vanity & Tub)", "to_room": "Upstairs Bathroom", "type": "unmonitored_door"}, {"from_room": "Basement Play Area", "id": "conn_play_theater", "label": "Open Basement Divide (Play <-> Theater)", "to_room": "Basement Theater", "type": "open_passage"}, {"from_room": "Basement Play Area", "id": "conn_play_storage", "label": "Storage Room Door (No Sensor, Out of Frame Left)", "to_room": "Storage Room", "type": "unmonitored_door"}, {"from_room": "Basement Play Area", "id": "conn_play_bbath", "label": "Basement Bath Door (No Sensor, Out of Frame Left)", "to_room": "Basement Bathroom", "type": "unmonitored_door"}], "floors": [{"id": "upstairs", "name": "Upstairs Level", "order": 0}, {"id": "main", "name": "Main Floor", "order": 1}, {"id": "basement", "name": "Basement Level", "order": 2}], "rooms": [{"entryways": [{"id": "door_master_hallway", "offset": 230, "target_room": "Upstairs Hallway & Stairs", "type": "door", "wall": "right", "width": 40}, {"id": "door_master_bath", "offset": 360, "target_room": "Master Bathroom", "type": "door", "wall": "right", "width": 40}], "floor": "upstairs", "height": 505, "id": "master_bedroom", "name": "Master Bedroom", "notes": "West wing front-to-back. Camera catches bed, doorway to Upstairs Hallway, and entry to Master Bath / WIC.", "room_type": "room", "width": 225, "x": 135, "y": 35}, {"entryways": [{"id": "door_mbath_master", "offset": 15, "target_room": "Master Bedroom", "type": "door", "wall": "left", "width": 40}], "floor": "upstairs", "height": 160, "id": "master_bathroom", "name": "Master Bathroom", "notes": "En-suite bath next to WIC with single sink and shower stall; entry caught by master bedroom camera.", "room_type": "room", "width": 140, "x": 360, "y": 380}, {"entryways": [{"id": "door_ubath_hall", "offset": 35, "target_room": "Upstairs Hallway & Stairs", "type": "door", "wall": "top", "width": 36}], "floor": "upstairs", "height": 160, "id": "upstairs_bathroom", "name": "Upstairs Bathroom", "notes": "Shared upstairs bathroom with double vanity and soaking tub, opening off hallway.", "room_type": "room", "width": 110, "x": 500, "y": 380}, {"entryways": [{"id": "door_margot_hallway", "offset": 160, "target_room": "Upstairs Hallway & Stairs", "type": "door", "wall": "bottom", "width": 36}], "floor": "upstairs", "height": 215, "id": "margots_room", "name": "Margot's Room", "notes": "Top-middle bedroom; doorway opens to Upstairs Hallway.", "room_type": "room", "width": 250, "x": 360, "y": 35}, {"entryways": [{"id": "door_guest_hallway", "offset": 30, "target_room": "Upstairs Hallway & Stairs", "type": "door", "wall": "bottom", "width": 36}], "floor": "upstairs", "height": 215, "id": "guest_room", "name": "Guest Room", "notes": "Top-right bedroom; doorway opens to Upstairs Hallway.", "room_type": "room", "width": 260, "x": 610, "y": 35}, {"entryways": [{"id": "door_office_hallway", "offset": 20, "target_room": "Upstairs Hallway & Stairs", "type": "door", "wall": "left", "width": 40}], "floor": "upstairs", "height": 290, "id": "office", "name": "Office", "notes": "Bottom-right bedroom / office next to stairs landing; camera sees desk, rig, and doorway.", "room_type": "room", "width": 260, "x": 610, "y": 250}, {"entryways": [{"id": "door_hall_master", "offset": 15, "target_room": "Master Bedroom", "type": "door", "wall": "left", "width": 40}, {"id": "door_hall_margot", "offset": 160, "target_room": "Margot's Room", "type": "door", "wall": "top", "width": 36}, {"id": "door_hall_guest", "offset": 10, "target_room": "Guest Room", "type": "door", "wall": "right", "width": 36}, {"id": "door_hall_office", "offset": 20, "target_room": "Office", "type": "door", "wall": "right", "width": 40}, {"id": "passage_hall_stairs", "offset": 180, "target_room": "Front Entry", "type": "open_passage", "wall": "bottom", "width": 55}], "floor": "upstairs", "height": 130, "id": "upstairs_hallway", "name": "Upstairs Hallway & Stairs", "notes": "Connects Master Bedroom, Margot's Room, Guest Room, Office, Bathrooms, and Stairs to Front Entry.", "room_type": "transit", "width": 250, "x": 360, "y": 250}, {"entryways": [{"id": "arch_dr_kitchen", "offset": 20, "target_room": "Kitchen", "type": "open_passage", "wall": "right", "width": 160}, {"id": "arch_dr_lr", "offset": 20, "target_room": "Living Room", "type": "open_passage", "wall": "bottom", "width": 120}], "floor": "main", "height": 205, "id": "dining_room", "name": "Dining Room", "notes": "Northwest room opening to Kitchen and Living Room.", "room_type": "room", "width": 160, "x": 160, "y": 120}, {"entryways": [{"id": "arch_lr_dr", "offset": 20, "target_room": "Dining Room", "type": "open_passage", "wall": "top", "width": 120}, {"id": "arch_lr_entry", "offset": 30, "target_room": "Front Entry", "type": "open_passage", "wall": "right", "width": 130}], "floor": "main", "height": 220, "id": "living_room", "name": "Living Room", "notes": "Southwest room with front bay windows; opens to Dining Room and Front Entryway.", "room_type": "room", "width": 235, "x": 160, "y": 325}, {"entryways": [{"id": "arch_kitchen_dr", "offset": 20, "target_room": "Dining Room", "type": "open_passage", "wall": "left", "width": 160}, {"id": "arch_kitchen_fr", "offset": 20, "target_room": "Family Room", "type": "open_passage", "wall": "right", "width": 170}, {"id": "path_kitchen_entry", "offset": 75, "target_room": "Front Entry", "type": "open_passage", "wall": "bottom", "width": 100}], "floor": "main", "height": 205, "id": "kitchen", "name": "Kitchen", "notes": "Central kitchen with island counter and breakfast nook; open to Family Room, Dining Room, and Front Entry.", "room_type": "room", "width": 245, "x": 320, "y": 120}, {"entryways": [{"id": "arch_entry_lr", "offset": 30, "target_room": "Living Room", "type": "open_passage", "wall": "left", "width": 130}, {"id": "path_entry_kitchen", "offset": 0, "target_room": "Kitchen", "type": "open_passage", "wall": "top", "width": 100}, {"id": "path_entry_fr", "offset": 10, "target_room": "Family Room", "type": "open_passage", "wall": "right", "width": 60}, {"id": "door_front_entry", "offset": 60, "target_room": "Exterior", "type": "door", "wall": "bottom", "width": 45}], "floor": "main", "height": 220, "id": "front_entry", "name": "Front Entry", "notes": "Main foyer with front door, powder room, stairs up to Floor 3, and pathways to Living Room and Kitchen.", "room_type": "room", "width": 170, "x": 395, "y": 325}, {"entryways": [{"id": "arch_fr_kitchen", "offset": 20, "target_room": "Kitchen", "type": "open_passage", "wall": "left", "width": 170}, {"id": "path_fr_entry", "offset": 10, "target_room": "Front Entry", "type": "open_passage", "wall": "bottom", "width": 60}, {"id": "door_fr_laundry", "offset": 40, "target_room": "Garage", "type": "door", "wall": "bottom", "width": 40}], "floor": "main", "height": 250, "id": "family_room", "name": "Family Room", "notes": "East living area with north fireplace; open to Kitchen and connects to Laundry and Front Entry.", "room_type": "room", "width": 280, "x": 565, "y": 120}, {"entryways": [{"id": "door_garage_fr", "offset": 40, "target_room": "Family Room", "type": "door", "wall": "top", "width": 40}], "floor": "main", "height": 175, "id": "garage", "name": "Garage", "notes": "Includes laundry room and garage entry walkway connecting off Family Room.", "room_type": "room", "width": 280, "x": 565, "y": 370}, {"entryways": [{"id": "door_play_storage", "offset": 40, "target_room": "Storage Room", "type": "door", "wall": "right", "width": 40}, {"id": "door_play_bbath", "offset": 235, "target_room": "Basement Bathroom", "type": "door", "wall": "right", "width": 36}, {"id": "arch_play_theater", "offset": 375, "target_room": "Basement Theater", "type": "open_passage", "wall": "right", "width": 110}], "floor": "basement", "height": 495, "id": "basement_play_area", "name": "Basement Play Area", "notes": "Main basement recreation room with west fireplace and south alcoves; connects to Storage and Theater.", "room_type": "room", "width": 415, "x": 220, "y": 40}, {"entryways": [{"id": "door_storage_play", "offset": 40, "target_room": "Basement Play Area", "type": "door", "wall": "left", "width": 40}], "floor": "basement", "height": 185, "id": "storage_room", "name": "Storage Room", "notes": "Upper northeast wet bar / storage area; door connects to Recreation Room.", "room_type": "room", "width": 145, "x": 635, "y": 40}, {"entryways": [{"id": "door_bbath_play", "offset": 10, "target_room": "Basement Play Area", "type": "door", "wall": "left", "width": 36}], "floor": "basement", "height": 145, "id": "basement_bathroom", "name": "Basement Bathroom", "notes": "Full basement bathroom off recreation hallway.", "room_type": "transit", "width": 145, "x": 635, "y": 225}, {"entryways": [{"id": "arch_theater_play", "offset": 5, "target_room": "Basement Play Area", "type": "open_passage", "wall": "left", "width": 110}], "floor": "basement", "height": 165, "id": "basement_theater", "name": "Basement Theater", "notes": "Lower northeast basement hallway / media lounge and stair exit.", "room_type": "room", "width": 145, "x": 635, "y": 370}], "version": 2};

const PDD_DEFAULT_COMPILED_TOPOLOGY = {"floorplan": {"cameras": [{"floor": "main", "fov_deg": 65, "heading_deg": 355, "host_room": "Living Room", "id": "camera.living_room", "name": "Living Room Camera", "notes": "Covers Living Room and sightline projects directly through open archway into Front Entry.", "range_px": 350, "spills_into": ["Front Entry"], "x": 175, "y": 530, "zones": ["living_room_couch", "living_room_floor", "living_room_bay_windows", "living_room_entry"]}, {"floor": "main", "fov_deg": 55, "heading_deg": 85, "host_room": "Dining Room", "id": "camera.dining_room", "name": "Dining Room Camera", "notes": "Covers Dining Room table and projects sightline down table into Living Room couch.", "range_px": 240, "spills_into": ["Living Room"], "x": 175, "y": 135, "zones": ["dining_room_table", "rileys_food"]}, {"floor": "main", "fov_deg": 75, "heading_deg": 180, "host_room": "Family Room", "id": "camera.family_room", "name": "Family Room Camera", "notes": "Catches Family Room couch, flanks Kitchen Island, and sees pathway to Entryway and Basement.", "range_px": 420, "spills_into": ["Kitchen", "Front Entry"], "x": 830, "y": 135, "zones": ["family_room_couch", "family_room_recliner", "family_room_floor", "kitchen_island"]}, {"floor": "main", "fov_deg": 64, "heading_deg": 90, "host_room": "Garage", "id": "camera.garage", "name": "Garage Camera", "notes": "Mounted on interior wall looking South down parked car toward roll-up garage door.", "range_px": 170, "spills_into": [], "x": 680, "y": 390, "zones": ["garage_parking"]}, {"floor": "upstairs", "fov_deg": 80, "heading_deg": 69, "host_room": "Master Bedroom", "id": "camera.master_bedroom", "name": "Master Bedroom Camera", "notes": "Catches Master Bedroom plus entries to Upstairs Hallway and Master Bathroom/Closet.", "range_px": 480, "spills_into": ["Upstairs Hallway & Stairs", "Master Bathroom"], "x": 150, "y": 50, "zones": ["master_bed", "master_open_area", "master_bedroom_walkway", "master_bedroom_entryway", "master_bathroom"]}, {"floor": "upstairs", "fov_deg": 75, "heading_deg": 230, "host_room": "Margot's Room", "id": "camera.nursery", "name": "Nursery Camera", "notes": "Mounted on south wall looking northwest across bed, play floor, and dresser.", "range_px": 280, "spills_into": [], "x": 550, "y": 230, "zones": ["nursery_bed"]}, {"floor": "upstairs", "fov_deg": 80, "heading_deg": 250, "host_room": "Office", "id": "camera.office", "name": "Office Camera", "notes": "Covers Steve's desk and sim rig with hallway door on the left periphery.", "range_px": 320, "spills_into": ["Upstairs Hallway & Stairs"], "x": 855, "y": 525, "zones": ["steves_desk", "sim_rig", "office_floor", "office_entryway"]}, {"floor": "basement", "fov_deg": 90, "heading_deg": 235, "host_room": "Basement Theater", "id": "camera.basement_theater", "name": "Basement Theater Camera", "notes": "Covers media lounge sectional, wet bar, and catches stairwell.", "range_px": 350, "spills_into": ["Basement Play Area"], "x": 765, "y": 520, "zones": ["basement_theater_couch", "basement_theater_playpen", "basement_theater_floor", "basement_bar", "basement_play_area_far", "basement_stairwell"]}, {"floor": "basement", "fov_deg": 85, "heading_deg": 40, "host_room": "Basement Play Area", "id": "camera.basement_play_area", "name": "Basement Play Area Camera", "notes": "Covers Play Area & Counter; sees into Theater. Storage Room & Basement Bath are out of frame on left.", "range_px": 480, "spills_into": ["Basement Theater"], "x": 235, "y": 520, "zones": ["basement_play_floor", "basement_counter", "theater_rear_view"]}, {"floor": "basement", "fov_deg": 75, "heading_deg": 110, "host_room": "Storage Room", "id": "camera.storage_room", "name": "Storage Room Camera", "notes": "Covers interior Storage Room / Gym floor looking toward door to finished basement.", "range_px": 170, "spills_into": [], "x": 650, "y": 55, "zones": ["storage_room_workout"]}], "canvas": {"height": 600, "width": 1000}, "connections": [{"from_room": "Front Entry", "id": "conn_entry_lr", "label": "Open Archway (Entry <-> Living Room)", "to_room": "Living Room", "type": "open_passage"}, {"from_room": "Front Entry", "id": "conn_entry_kitchen", "label": "Pathway (Entry <-> Kitchen)", "to_room": "Kitchen", "type": "open_passage"}, {"from_room": "Front Entry", "id": "conn_entry_fr", "label": "Pathway (Entry <-> Family/Laundry/Basement)", "to_room": "Family Room", "type": "open_passage"}, {"from_room": "Living Room", "id": "conn_lr_dr", "label": "Open Passage (Living <-> Dining)", "to_room": "Dining Room", "type": "open_passage"}, {"from_room": "Dining Room", "id": "conn_dr_kitchen", "label": "Open Passage (Dining <-> Kitchen)", "to_room": "Kitchen", "type": "open_passage"}, {"from_room": "Kitchen", "id": "conn_kitchen_fr", "label": "Open Concept (Kitchen <-> Family Room)", "to_room": "Family Room", "type": "open_passage"}, {"entity_id": "binary_sensor.utility_room_door", "from_room": "Family Room", "id": "conn_fr_garage", "label": "Laundry / Garage Pathway", "to_room": "Garage", "type": "unmonitored_door"}, {"from_room": "Front Entry", "id": "conn_entry_upstairs", "label": "Main Stairs to Upstairs", "to_room": "Upstairs Hallway & Stairs", "type": "stairs"}, {"from_room": "Family Room", "id": "conn_fr_basement_play", "label": "Basement Stairs", "to_room": "Basement Play Area", "type": "stairs"}, {"from_room": "Family Room", "id": "conn_fr_basement_theater", "label": "Basement Stairs (Partial Sightline)", "to_room": "Basement Theater", "type": "stairs"}, {"from_room": "Upstairs Hallway & Stairs", "id": "conn_hall_office", "label": "Office Doorway (Next to Stairs)", "to_room": "Office", "type": "unmonitored_door"}, {"from_room": "Upstairs Hallway & Stairs", "id": "conn_hall_guest", "label": "Guest Room Doorway (No Sensor)", "to_room": "Guest Room", "type": "unmonitored_door"}, {"from_room": "Upstairs Hallway & Stairs", "id": "conn_hall_nursery", "label": "Nursery Doorway (Seen Partially by Cam)", "to_room": "Margot's Room", "type": "unmonitored_door"}, {"from_room": "Upstairs Hallway & Stairs", "id": "conn_hall_master", "label": "Master Bedroom Entryway", "to_room": "Master Bedroom", "type": "unmonitored_door"}, {"from_room": "Master Bedroom", "id": "conn_master_bath", "label": "Master Bath / Shower Stall Entry", "to_room": "Master Bathroom", "type": "unmonitored_door"}, {"from_room": "Upstairs Hallway & Stairs", "id": "conn_hall_ubath", "label": "Shared Bathroom (Double Vanity & Tub)", "to_room": "Upstairs Bathroom", "type": "unmonitored_door"}, {"from_room": "Basement Play Area", "id": "conn_play_theater", "label": "Open Basement Divide (Play <-> Theater)", "to_room": "Basement Theater", "type": "open_passage"}, {"from_room": "Basement Play Area", "id": "conn_play_storage", "label": "Storage Room Door (No Sensor, Out of Frame Left)", "to_room": "Storage Room", "type": "unmonitored_door"}, {"from_room": "Basement Play Area", "id": "conn_play_bbath", "label": "Basement Bath Door (No Sensor, Out of Frame Left)", "to_room": "Basement Bathroom", "type": "unmonitored_door"}], "floors": [{"id": "upstairs", "name": "Upstairs Level", "order": 0}, {"id": "main", "name": "Main Floor", "order": 1}, {"id": "basement", "name": "Basement Level", "order": 2}], "rooms": [{"entryways": [{"id": "door_master_hallway", "offset": 230, "target_room": "Upstairs Hallway & Stairs", "type": "door", "wall": "right", "width": 40}, {"id": "door_master_bath", "offset": 360, "target_room": "Master Bathroom", "type": "door", "wall": "right", "width": 40}], "floor": "upstairs", "height": 505, "id": "master_bedroom", "name": "Master Bedroom", "notes": "West wing front-to-back. Camera catches bed, doorway to Upstairs Hallway, and entry to Master Bath / WIC.", "room_type": "room", "width": 225, "x": 135, "y": 35}, {"entryways": [{"id": "door_mbath_master", "offset": 15, "target_room": "Master Bedroom", "type": "door", "wall": "left", "width": 40}], "floor": "upstairs", "height": 160, "id": "master_bathroom", "name": "Master Bathroom", "notes": "En-suite bath next to WIC with single sink and shower stall; entry caught by master bedroom camera.", "room_type": "room", "width": 140, "x": 360, "y": 380}, {"entryways": [{"id": "door_ubath_hall", "offset": 35, "target_room": "Upstairs Hallway & Stairs", "type": "door", "wall": "top", "width": 36}], "floor": "upstairs", "height": 160, "id": "upstairs_bathroom", "name": "Upstairs Bathroom", "notes": "Shared upstairs bathroom with double vanity and soaking tub, opening off hallway.", "room_type": "room", "width": 110, "x": 500, "y": 380}, {"entryways": [{"id": "door_margot_hallway", "offset": 160, "target_room": "Upstairs Hallway & Stairs", "type": "door", "wall": "bottom", "width": 36}], "floor": "upstairs", "height": 215, "id": "margots_room", "name": "Margot's Room", "notes": "Top-middle bedroom; doorway opens to Upstairs Hallway.", "room_type": "room", "width": 250, "x": 360, "y": 35}, {"entryways": [{"id": "door_guest_hallway", "offset": 30, "target_room": "Upstairs Hallway & Stairs", "type": "door", "wall": "bottom", "width": 36}], "floor": "upstairs", "height": 215, "id": "guest_room", "name": "Guest Room", "notes": "Top-right bedroom; doorway opens to Upstairs Hallway.", "room_type": "room", "width": 260, "x": 610, "y": 35}, {"entryways": [{"id": "door_office_hallway", "offset": 20, "target_room": "Upstairs Hallway & Stairs", "type": "door", "wall": "left", "width": 40}], "floor": "upstairs", "height": 290, "id": "office", "name": "Office", "notes": "Bottom-right bedroom / office next to stairs landing; camera sees desk, rig, and doorway.", "room_type": "room", "width": 260, "x": 610, "y": 250}, {"entryways": [{"id": "door_hall_master", "offset": 15, "target_room": "Master Bedroom", "type": "door", "wall": "left", "width": 40}, {"id": "door_hall_margot", "offset": 160, "target_room": "Margot's Room", "type": "door", "wall": "top", "width": 36}, {"id": "door_hall_guest", "offset": 10, "target_room": "Guest Room", "type": "door", "wall": "right", "width": 36}, {"id": "door_hall_office", "offset": 20, "target_room": "Office", "type": "door", "wall": "right", "width": 40}, {"id": "passage_hall_stairs", "offset": 180, "target_room": "Front Entry", "type": "open_passage", "wall": "bottom", "width": 55}], "floor": "upstairs", "height": 130, "id": "upstairs_hallway", "name": "Upstairs Hallway & Stairs", "notes": "Connects Master Bedroom, Margot's Room, Guest Room, Office, Bathrooms, and Stairs to Front Entry.", "room_type": "transit", "width": 250, "x": 360, "y": 250}, {"entryways": [{"id": "arch_dr_kitchen", "offset": 20, "target_room": "Kitchen", "type": "open_passage", "wall": "right", "width": 160}, {"id": "arch_dr_lr", "offset": 20, "target_room": "Living Room", "type": "open_passage", "wall": "bottom", "width": 120}], "floor": "main", "height": 205, "id": "dining_room", "name": "Dining Room", "notes": "Northwest room opening to Kitchen and Living Room.", "room_type": "room", "width": 160, "x": 160, "y": 120}, {"entryways": [{"id": "arch_lr_dr", "offset": 20, "target_room": "Dining Room", "type": "open_passage", "wall": "top", "width": 120}, {"id": "arch_lr_entry", "offset": 30, "target_room": "Front Entry", "type": "open_passage", "wall": "right", "width": 130}], "floor": "main", "height": 220, "id": "living_room", "name": "Living Room", "notes": "Southwest room with front bay windows; opens to Dining Room and Front Entryway.", "room_type": "room", "width": 235, "x": 160, "y": 325}, {"entryways": [{"id": "arch_kitchen_dr", "offset": 20, "target_room": "Dining Room", "type": "open_passage", "wall": "left", "width": 160}, {"id": "arch_kitchen_fr", "offset": 20, "target_room": "Family Room", "type": "open_passage", "wall": "right", "width": 170}, {"id": "path_kitchen_entry", "offset": 75, "target_room": "Front Entry", "type": "open_passage", "wall": "bottom", "width": 100}], "floor": "main", "height": 205, "id": "kitchen", "name": "Kitchen", "notes": "Central kitchen with island counter and breakfast nook; open to Family Room, Dining Room, and Front Entry.", "room_type": "room", "width": 245, "x": 320, "y": 120}, {"entryways": [{"id": "arch_entry_lr", "offset": 30, "target_room": "Living Room", "type": "open_passage", "wall": "left", "width": 130}, {"id": "path_entry_kitchen", "offset": 0, "target_room": "Kitchen", "type": "open_passage", "wall": "top", "width": 100}, {"id": "path_entry_fr", "offset": 10, "target_room": "Family Room", "type": "open_passage", "wall": "right", "width": 60}, {"id": "door_front_entry", "offset": 60, "target_room": "Exterior", "type": "door", "wall": "bottom", "width": 45}], "floor": "main", "height": 220, "id": "front_entry", "name": "Front Entry", "notes": "Main foyer with front door, powder room, stairs up to Floor 3, and pathways to Living Room and Kitchen.", "room_type": "room", "width": 170, "x": 395, "y": 325}, {"entryways": [{"id": "arch_fr_kitchen", "offset": 20, "target_room": "Kitchen", "type": "open_passage", "wall": "left", "width": 170}, {"id": "path_fr_entry", "offset": 10, "target_room": "Front Entry", "type": "open_passage", "wall": "bottom", "width": 60}, {"id": "door_fr_laundry", "offset": 40, "target_room": "Garage", "type": "door", "wall": "bottom", "width": 40}], "floor": "main", "height": 250, "id": "family_room", "name": "Family Room", "notes": "East living area with north fireplace; open to Kitchen and connects to Laundry and Front Entry.", "room_type": "room", "width": 280, "x": 565, "y": 120}, {"entryways": [{"id": "door_garage_fr", "offset": 40, "target_room": "Family Room", "type": "door", "wall": "top", "width": 40}], "floor": "main", "height": 175, "id": "garage", "name": "Garage", "notes": "Includes laundry room and garage entry walkway connecting off Family Room.", "room_type": "room", "width": 280, "x": 565, "y": 370}, {"entryways": [{"id": "door_play_storage", "offset": 40, "target_room": "Storage Room", "type": "door", "wall": "right", "width": 40}, {"id": "door_play_bbath", "offset": 235, "target_room": "Basement Bathroom", "type": "door", "wall": "right", "width": 36}, {"id": "arch_play_theater", "offset": 375, "target_room": "Basement Theater", "type": "open_passage", "wall": "right", "width": 110}], "floor": "basement", "height": 495, "id": "basement_play_area", "name": "Basement Play Area", "notes": "Main basement recreation room with west fireplace and south alcoves; connects to Storage and Theater.", "room_type": "room", "width": 415, "x": 220, "y": 40}, {"entryways": [{"id": "door_storage_play", "offset": 40, "target_room": "Basement Play Area", "type": "door", "wall": "left", "width": 40}], "floor": "basement", "height": 185, "id": "storage_room", "name": "Storage Room", "notes": "Upper northeast wet bar / storage area; door connects to Recreation Room.", "room_type": "room", "width": 145, "x": 635, "y": 40}, {"entryways": [{"id": "door_bbath_play", "offset": 10, "target_room": "Basement Play Area", "type": "door", "wall": "left", "width": 36}], "floor": "basement", "height": 145, "id": "basement_bathroom", "name": "Basement Bathroom", "notes": "Full basement bathroom off recreation hallway.", "room_type": "transit", "width": 145, "x": 635, "y": 225}, {"entryways": [{"id": "arch_theater_play", "offset": 5, "target_room": "Basement Play Area", "type": "open_passage", "wall": "left", "width": 110}], "floor": "basement", "height": 165, "id": "basement_theater", "name": "Basement Theater", "notes": "Lower northeast basement hallway / media lounge and stair exit.", "room_type": "room", "width": 145, "x": 635, "y": 370}], "version": 2}, "connected_rooms_map": {"Master Bedroom": ["Front Entry", "Guest Room", "Margot's Room", "Master Bathroom", "Office", "Upstairs Bathroom"], "Master Bathroom": ["Master Bedroom"], "Upstairs Bathroom": ["Front Entry", "Guest Room", "Margot's Room", "Master Bedroom", "Office"], "Margot's Room": ["Front Entry", "Guest Room", "Master Bedroom", "Office", "Upstairs Bathroom"], "Guest Room": ["Front Entry", "Margot's Room", "Master Bedroom", "Office", "Upstairs Bathroom"], "Office": ["Front Entry", "Guest Room", "Margot's Room", "Master Bedroom", "Upstairs Bathroom"], "Dining Room": ["Kitchen", "Living Room"], "Living Room": ["Dining Room", "Front Entry"], "Kitchen": ["Dining Room", "Family Room", "Front Entry"], "Front Entry": ["Family Room", "Guest Room", "Kitchen", "Living Room", "Margot's Room", "Master Bedroom", "Office", "Upstairs Bathroom"], "Family Room": ["Basement Play Area", "Basement Theater", "Front Entry", "Garage", "Kitchen"], "Garage": ["Family Room"], "Basement Play Area": ["Basement Theater", "Family Room", "Storage Room"], "Storage Room": ["Basement Play Area"], "Basement Theater": ["Basement Play Area", "Family Room"]}, "seal_analysis": {"Master Bedroom": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)", "Master Bathroom (unmonitored door)"]}, "Master Bathroom": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Master Bedroom (unmonitored door)"]}, "Upstairs Bathroom": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)"]}, "Margot's Room": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)"]}, "Guest Room": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)"]}, "Office": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)"]}, "Dining Room": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Living Room (open passage)", "Kitchen (open passage)"]}, "Living Room": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Front Entry (open passage)", "Dining Room (open passage)"]}, "Kitchen": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Front Entry (open passage)", "Dining Room (open passage)", "Family Room (open passage)"]}, "Front Entry": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Living Room (open passage)", "Kitchen (open passage)", "Family Room (open passage)", "Upstairs Hallway & Stairs (stairs)"]}, "Family Room": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Front Entry (open passage)", "Kitchen (open passage)", "Garage (unmonitored door)", "Basement Play Area (stairs)", "Basement Theater (stairs)"]}, "Garage": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Family Room (unmonitored door)"]}, "Basement Play Area": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Family Room (stairs)", "Basement Theater (open passage)", "Storage Room (unmonitored door)", "Basement Bathroom (unmonitored door)"]}, "Storage Room": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Basement Play Area (unmonitored door)"]}, "Basement Theater": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Family Room (stairs)", "Basement Play Area (open passage)"]}}, "camera_analysis": [{"camera_id": "camera.living_room", "name": "Living Room Camera", "host_room": "Living Room", "floor": "main", "zones": ["living_room_couch", "living_room_floor", "living_room_bay_windows", "living_room_entry"], "spillover_targets": [{"room_name": "Front Entry", "overlap_pct": 38.0}], "has_multi_room_bleed": true, "visibility_polygon": [[175.0, 530.0], [452.67, 316.93], [458.07, 324.16], [463.29, 331.53], [468.31, 339.03], [469.65, 341.1], [469.71, 341.2], [469.78, 341.3], [473.13, 346.65], [477.76, 354.4], [479.78, 357.93], [479.84, 358.04], [479.9, 358.14], [482.19, 362.26], [484.75, 367.04], [484.81, 367.15], [484.86, 367.26], [486.41, 370.24], [487.99, 373.37], [488.05, 373.47], [488.1, 373.58], [490.43, 378.32], [494.23, 386.5], [497.82, 394.78], [498.76, 397.04], [498.81, 397.16], [498.86, 397.27], [499.92, 399.9], [499.97, 400.01], [500.01, 400.13], [501.2, 403.15], [502.98, 407.83], [503.03, 407.94], [503.07, 408.06], [504.36, 411.6], [505.71, 415.4], [505.75, 415.51], [505.79, 415.63], [506.29, 417.09], [506.33, 417.21], [506.37, 417.32], [507.31, 420.13], [510.03, 428.73], [512.53, 437.4], [514.8, 446.14], [516.85, 454.92], [517.88, 459.74], [395.0, 485.0], [395.0, 485.08], [395.0, 487.6], [395.0, 493.45], [395.0, 499.26], [395.0, 505.02], [395.0, 510.75], [395.0, 516.46], [395.0, 522.14], [395.0, 527.82], [395.0, 533.49], [395.0, 538.38], [395.0, 538.46], [395.0, 538.54], [395.0, 539.17], [395.0, 540.08], [395.0, 540.15], [395.0, 540.23], [395.0, 541.71], [395.0, 541.79], [395.0, 541.86], [395.0, 544.86], [395.0, 544.92], [395.0, 545.0], [393.87, 545.0], [335.45, 545.0], [300.45, 545.0], [277.88, 545.0], [262.09, 545.0], [250.41, 545.0], [241.41, 545.0], [234.26, 545.0], [228.43, 545.0], [223.58, 545.0], [219.48, 545.0], [215.96, 545.0], [212.9, 545.0], [210.22, 545.0], [207.85, 545.0], [205.72, 545.0], [203.81, 545.0]]}, {"camera_id": "camera.dining_room", "name": "Dining Room Camera", "host_room": "Dining Room", "floor": "main", "zones": ["dining_room_table", "rileys_food"], "spillover_targets": [{"room_name": "Living Room", "overlap_pct": 18.0}], "has_multi_room_bleed": true, "visibility_polygon": [[175.0, 135.0], [303.95, 337.41], [298.66, 340.69], [293.28, 343.83], [287.82, 346.83], [282.29, 349.68], [276.68, 352.39], [271.01, 354.96], [265.27, 357.38], [259.47, 359.64], [253.62, 361.76], [247.71, 363.72], [241.75, 365.53], [235.75, 367.18], [229.71, 368.68], [223.62, 370.02], [217.51, 371.2], [211.37, 372.23], [205.2, 373.09], [199.02, 373.8], [192.81, 374.34], [186.6, 374.72], [181.4, 374.91], [180.0, 325.0], [179.93, 325.0], [179.26, 325.0], [174.33, 325.0], [169.4, 325.0], [164.46, 325.0], [160.07, 325.0], [160.0, 325.0], [160.0, 324.16], [160.0, 318.93], [160.0, 274.24], [160.0, 246.9], [160.0, 228.42], [160.0, 215.09], [160.0, 205.0], [160.0, 197.09], [160.0, 190.72], [160.0, 185.46], [160.0, 181.05], [160.0, 177.3], [160.0, 174.05], [160.0, 171.21]]}, {"camera_id": "camera.family_room", "name": "Family Room Camera", "host_room": "Family Room", "floor": "main", "zones": ["family_room_couch", "family_room_recliner", "family_room_floor", "kitchen_island"], "spillover_targets": [{"room_name": "Kitchen", "overlap_pct": 51.0}, {"room_name": "Front Entry", "overlap_pct": 18.0}], "has_multi_room_bleed": true, "visibility_polygon": [[830.0, 135.0], [565.0, 338.34], [565.0, 335.15], [565.0, 335.0], [565.0, 334.86], [565.0, 327.53], [565.0, 325.14], [565.0, 325.0], [565.0, 324.86], [565.0, 317.13], [565.0, 310.13], [565.0, 310.0], [542.07, 325.0], [537.43, 325.0], [519.95, 325.0], [500.91, 325.0], [495.27, 325.0], [495.0, 325.0], [464.6, 342.08], [460.9, 335.41], [455.78, 325.68], [455.27, 324.68], [455.21, 324.55], [455.14, 324.42], [450.91, 315.81], [446.31, 305.83], [445.17, 303.25], [445.11, 303.11], [445.05, 302.98], [441.97, 295.73], [437.9, 285.51], [436.48, 281.76], [436.43, 281.63], [436.37, 281.49], [434.69, 276.87], [434.64, 276.73], [434.59, 276.6], [434.09, 275.2], [430.56, 264.79], [430.44, 264.42], [430.39, 264.28], [430.35, 264.14], [427.3, 254.29], [424.31, 243.7], [421.6, 233.05], [419.18, 222.32], [417.03, 211.54], [415.17, 200.7], [413.59, 189.82], [412.3, 178.9], [411.29, 167.95], [410.58, 156.98], [410.14, 145.99], [410.08, 143.07], [565.0, 140.0], [565.0, 139.91], [565.0, 137.69], [565.0, 137.6], [565.0, 137.51], [565.0, 135.0], [565.0, 128.06], [565.0, 127.3], [565.0, 127.21], [565.0, 127.11], [565.0, 121.11], [565.0, 120.09], [565.0, 120.0], [566.63, 120.0], [639.41, 120.0], [687.28, 120.0], [716.06, 120.0], [735.29, 120.0], [749.07, 120.0], [759.43, 120.0], [767.52, 120.0], [774.02, 120.0], [779.36, 120.0], [783.83, 120.0], [787.64, 120.0], [790.92, 120.0], [793.79, 120.0], [796.31, 120.0], [798.55, 120.0], [800.56, 120.0], [802.37, 120.0], [804.02, 120.0], [805.52, 120.0], [806.9, 120.0], [808.17, 120.0], [809.35, 120.0], [810.45, 120.0]]}, {"camera_id": "camera.garage", "name": "Garage Camera", "host_room": "Garage", "floor": "main", "zones": ["garage_parking"], "spillover_targets": [], "has_multi_room_bleed": false, "visibility_polygon": [[680.0, 390.0], [770.09, 534.17], [766.31, 536.46], [762.48, 538.65], [758.59, 540.74], [754.65, 542.73], [750.65, 544.62], [746.02, 545.0], [741.31, 545.0], [736.7, 545.0], [732.18, 545.0], [727.73, 545.0], [723.36, 545.0], [719.05, 545.0], [714.79, 545.0], [710.59, 545.0], [706.42, 545.0], [702.3, 545.0], [698.2, 545.0], [694.13, 545.0], [690.08, 545.0], [686.04, 545.0], [682.01, 545.0], [677.99, 545.0], [673.96, 545.0], [669.92, 545.0], [665.87, 545.0], [661.8, 545.0], [657.7, 545.0], [653.58, 545.0], [649.41, 545.0], [645.21, 545.0], [640.95, 545.0], [636.64, 545.0], [632.27, 545.0], [627.82, 545.0], [623.3, 545.0], [618.69, 545.0], [613.98, 545.0], [609.35, 544.62], [605.35, 542.73], [601.41, 540.74], [597.52, 538.65], [593.69, 536.46], [589.91, 534.17]]}, {"camera_id": "camera.master_bedroom", "name": "Master Bedroom Camera", "host_room": "Master Bedroom", "floor": "upstairs", "zones": ["master_bed", "master_open_area", "master_bedroom_walkway", "master_bedroom_entryway", "master_bathroom"], "spillover_targets": [{"room_name": "Master Bathroom", "overlap_pct": 18.0}, {"room_name": "Upstairs Hallway & Stairs", "overlap_pct": 18.0}], "has_multi_room_bleed": true, "visibility_polygon": [[150.0, 50.0], [360.0, 166.4], [360.0, 168.6], [360.0, 168.7], [360.0, 168.79], [360.0, 173.61], [360.0, 181.03], [360.0, 188.7], [360.0, 196.64], [360.0, 200.54], [360.0, 200.65], [360.0, 200.76], [360.0, 204.87], [360.0, 205.62], [360.0, 205.73], [360.0, 205.84], [360.0, 213.42], [360.0, 214.49], [360.0, 214.61], [360.0, 214.73], [360.0, 222.31], [360.0, 227.57], [360.0, 227.69], [360.0, 227.82], [360.0, 229.87], [360.0, 230.0], [360.0, 230.13], [360.0, 231.6], [360.0, 241.31], [360.0, 247.86], [360.0, 248.0], [360.0, 248.14], [360.0, 249.86], [360.0, 250.0], [360.0, 250.14], [360.0, 251.49], [360.0, 262.18], [360.0, 264.85], [360.0, 265.0], [472.1, 380.0], [460.13, 380.0], [460.01, 380.0], [459.8, 380.0], [459.58, 380.0], [444.44, 380.0], [429.46, 380.0], [421.96, 380.0], [360.0, 305.0], [360.0, 305.18], [360.0, 311.39], [360.0, 325.7], [360.0, 341.01], [360.0, 343.78], [360.0, 344.0], [360.0, 344.22], [360.0, 357.46], [360.0, 375.21], [360.0, 379.75], [360.0, 380.0], [360.0, 380.25], [360.0, 394.44], [360.0, 394.73], [360.0, 395.0], [399.43, 460.1], [389.19, 466.16], [380.0, 471.31], [360.0, 435.0], [360.0, 435.32], [360.0, 438.27], [360.0, 463.47], [356.22, 483.44], [344.95, 488.63], [339.24, 491.12], [339.08, 491.19], [338.93, 491.26], [333.54, 493.52], [322.02, 498.12], [310.37, 502.42], [298.62, 506.41], [286.77, 510.1], [274.83, 513.48], [262.81, 516.56], [250.71, 519.32], [238.54, 521.76], [226.31, 523.89], [214.04, 525.71], [201.72, 527.21], [189.36, 528.38], [176.98, 529.24], [164.58, 529.78], [152.17, 530.0], [139.76, 529.89], [135.48, 529.78], [135.31, 529.78], [135.15, 529.77], [135.0, 367.64], [135.0, 254.99], [135.0, 201.17], [135.0, 169.61], [135.0, 148.84], [135.0, 134.12], [135.0, 123.12], [135.0, 114.59], [135.0, 107.77], [135.0, 102.18], [135.0, 97.52], [135.0, 93.56]]}, {"camera_id": "camera.nursery", "name": "Nursery Camera", "host_room": "Margot's Room", "floor": "upstairs", "zones": ["nursery_bed"], "spillover_targets": [], "has_multi_room_bleed": false, "visibility_polygon": [[550.0, 230.0], [360.0, 187.88], [360.0, 182.63], [360.0, 177.31], [360.0, 171.91], [360.0, 166.43], [360.0, 160.85], [360.0, 155.16], [360.0, 149.35], [360.0, 143.41], [360.0, 137.33], [360.0, 131.09], [360.0, 124.68], [360.0, 118.08], [360.0, 111.27], [360.0, 104.24], [360.0, 96.96], [360.0, 89.41], [360.0, 81.56], [360.0, 73.38], [360.0, 64.84], [360.0, 55.9], [360.0, 46.52], [360.0, 36.65], [360.0, 35.14], [360.0, 35.0], [360.13, 35.0], [368.16, 35.0], [377.48, 35.0], [386.38, 35.0], [394.89, 35.0], [403.06, 35.0], [410.91, 35.0], [418.47, 35.0], [425.77, 35.0], [432.83, 35.0], [439.67, 35.0], [446.32, 35.0], [452.78, 35.0], [459.07, 35.0], [465.21, 35.0], [471.21, 35.0], [477.09, 35.0], [482.86, 35.0], [488.52, 35.0], [494.08, 35.0], [499.57, 35.0], [504.98, 35.0], [510.33, 35.0], [515.62, 35.0], [520.86, 35.0], [526.06, 35.0], [531.22, 35.0], [536.36, 35.0], [541.49, 35.0]]}, {"camera_id": "camera.office", "name": "Office Camera", "host_room": "Office", "floor": "upstairs", "zones": ["steves_desk", "sim_rig", "office_floor", "office_entryway"], "spillover_targets": [{"room_name": "Upstairs Hallway & Stairs", "overlap_pct": 18.0}], "has_multi_room_bleed": true, "visibility_polygon": [[855.0, 525.0], [610.0, 383.55], [610.0, 380.12], [610.0, 380.0], [610.0, 379.88], [610.0, 374.97], [610.0, 366.12], [610.0, 356.97], [610.0, 347.48], [610.0, 337.63], [610.0, 327.39], [610.0, 324.02], [610.0, 323.88], [610.0, 323.74], [611.2, 317.73], [614.41, 314.02], [614.48, 313.93], [614.55, 313.85], [616.64, 311.49], [619.4, 308.46], [619.47, 308.38], [619.55, 308.29], [622.24, 305.4], [628.0, 299.46], [633.22, 294.32], [633.3, 294.25], [633.38, 294.17], [633.9, 293.66], [637.68, 290.11], [637.77, 290.03], [637.85, 289.96], [639.96, 288.03], [642.05, 286.14], [642.13, 286.07], [642.22, 285.99], [646.16, 282.55], [652.49, 277.23], [657.82, 272.97], [657.91, 272.9], [657.99, 272.83], [658.97, 272.07], [665.57, 267.09], [672.3, 262.28], [679.16, 257.64], [680.34, 256.87], [680.43, 256.81], [680.53, 256.75], [686.13, 253.19], [693.85, 250.0], [703.26, 250.0], [712.41, 250.0], [721.31, 250.0], [730.0, 250.0], [738.48, 250.0], [746.78, 250.0], [754.91, 250.0], [762.89, 250.0], [770.73, 250.0], [778.45, 250.0], [786.06, 250.0], [793.57, 250.0], [800.99, 250.0], [808.34, 250.0], [815.63, 250.0], [822.86, 250.0], [830.04, 250.0], [837.2, 250.0], [844.33, 250.0], [851.44, 250.0], [858.56, 250.0], [865.67, 250.0], [869.9, 250.0], [870.0, 250.0], [870.0, 251.75], [870.0, 293.28], [870.0, 359.7], [870.0, 396.67], [870.0, 420.24], [870.0, 436.59], [870.0, 448.62], [870.0, 457.85], [870.0, 465.17], [870.0, 471.11], [870.0, 476.05], [870.0, 480.22], [870.0, 483.79]]}, {"camera_id": "camera.basement_theater", "name": "Basement Theater Camera", "host_room": "Basement Theater", "floor": "basement", "zones": ["basement_theater_couch", "basement_theater_playpen", "basement_theater_floor", "basement_bar", "basement_play_area_far", "basement_stairwell"], "spillover_targets": [{"room_name": "Basement Play Area", "overlap_pct": 18.0}], "has_multi_room_bleed": true, "visibility_polygon": [[765.0, 520.0], [635.0, 497.08], [635.0, 493.55], [635.0, 489.99], [635.0, 486.38], [635.0, 485.05], [635.0, 485.0], [427.07, 428.89], [428.56, 423.53], [431.2, 414.75], [434.07, 406.05], [437.16, 397.43], [440.49, 388.89], [444.03, 380.44], [447.79, 372.08], [451.77, 363.83], [455.97, 355.68], [460.38, 347.65], [464.99, 339.74], [469.81, 331.95], [474.84, 324.28], [480.06, 316.75], [485.48, 309.36], [491.09, 302.12], [492.64, 300.18], [635.0, 415.0], [635.0, 414.93], [635.0, 410.92], [635.0, 404.99], [635.0, 398.77], [635.0, 392.25], [635.0, 385.38], [635.0, 378.13], [635.0, 375.1], [635.0, 375.0], [635.0, 374.9], [635.0, 370.45], [635.0, 370.11], [635.0, 370.0], [635.09, 370.0], [641.35, 370.0], [647.81, 370.0], [654.01, 370.0], [659.97, 370.0], [665.72, 370.0], [671.27, 370.0], [671.63, 370.0], [671.7, 370.0], [671.77, 370.0], [676.64, 370.0], [681.85, 370.0], [685.34, 370.0], [685.41, 370.0], [685.48, 370.0], [686.62, 370.0], [686.69, 370.0], [686.75, 370.0], [686.91, 370.0], [691.84, 370.0], [696.52, 370.0], [696.58, 370.0], [696.64, 370.0], [696.64, 370.0], [698.84, 370.0], [698.9, 370.0], [698.96, 370.0], [701.33, 370.0], [705.91, 370.0], [710.4, 370.0], [714.81, 370.0], [716.19, 370.0], [716.25, 370.0], [716.31, 370.0], [719.14, 370.0], [720.62, 370.0], [720.68, 370.0], [720.74, 370.0], [723.4, 370.0], [724.32, 370.0], [724.37, 370.0], [724.43, 370.0], [727.6, 370.0], [731.75, 370.0], [735.84, 370.0], [739.9, 370.0], [743.92, 370.0], [747.91, 370.0], [751.88, 370.0], [755.83, 370.0], [759.76, 370.0], [763.69, 370.0], [767.62, 370.0], [769.64, 370.0], [769.69, 370.0], [769.74, 370.0], [771.55, 370.0], [772.57, 370.0], [772.63, 370.0], [772.68, 370.0], [775.49, 370.0], [779.44, 370.0], [779.95, 370.0], [780.0, 370.0], [780.0, 370.53], [780.0, 397.83], [780.0, 419.63], [780.0, 434.93]]}, {"camera_id": "camera.basement_play_area", "name": "Basement Play Area Camera", "host_room": "Basement Play Area", "floor": "basement", "zones": ["basement_play_floor", "basement_counter", "theater_rear_view"], "spillover_targets": [{"room_name": "Basement Theater", "overlap_pct": 18.0}], "has_multi_room_bleed": true, "visibility_polygon": [[235.0, 520.0], [635.0, 502.54], [635.0, 512.96], [635.0, 523.37], [635.0, 524.86], [635.0, 525.0], [635.0, 525.14], [635.0, 530.87], [635.0, 531.01], [635.0, 531.15], [635.0, 533.78], [635.0, 534.86], [635.0, 535.0], [631.3, 535.0], [482.74, 535.0], [407.98, 535.0], [367.74, 535.0], [342.57, 535.0], [325.32, 535.0], [312.74, 535.0], [303.15, 535.0], [295.6, 535.0], [289.48, 535.0], [284.41, 535.0], [280.15, 535.0], [276.51, 535.0], [273.36, 535.0], [270.6, 535.0], [268.16, 535.0], [265.98, 535.0], [264.03, 535.0], [262.27, 535.0], [260.66, 535.0], [259.19, 535.0], [257.84, 535.0], [256.6, 535.0], [255.44, 535.0], [254.36, 535.0], [253.36, 535.0], [252.41, 535.0], [251.52, 535.0], [250.68, 535.0], [249.89, 535.0], [249.13, 535.0], [248.41, 535.0], [247.72, 535.0], [247.07, 535.0], [246.44, 535.0], [245.83, 535.0], [245.25, 535.0], [244.69, 535.0], [244.14, 535.0], [243.61, 535.0], [243.1, 535.0], [242.61, 535.0], [242.12, 535.0], [241.65, 535.0], [241.19, 535.0], [240.73, 535.0], [240.29, 535.0], [239.86, 535.0], [239.43, 535.0], [239.01, 535.0], [238.59, 535.0], [238.18, 535.0], [237.78, 535.0], [237.37, 535.0], [236.97, 535.0]]}, {"camera_id": "camera.storage_room", "name": "Storage Room Camera", "host_room": "Storage Room", "floor": "basement", "zones": ["storage_room_workout"], "spillover_targets": [], "has_multi_room_bleed": false, "visibility_polygon": [[650.0, 55.0], [701.12, 217.13], [696.86, 218.41], [692.56, 219.59], [688.24, 220.64], [683.89, 221.59], [679.52, 222.42], [675.13, 223.13], [670.72, 223.73], [666.29, 224.22], [661.86, 224.59], [657.42, 224.84], [652.97, 224.97], [648.52, 224.99], [644.07, 224.9], [639.62, 224.68], [638.5, 224.61], [638.44, 224.61], [638.38, 224.6], [638.28, 224.6], [638.22, 224.59], [638.16, 224.59], [635.94, 224.42], [635.88, 224.41], [635.82, 224.41], [635.18, 224.35], [635.12, 224.35], [635.06, 224.34], [635.0, 224.32], [635.0, 186.65], [635.0, 161.73], [635.0, 144.64], [635.0, 132.17], [635.0, 122.66], [635.0, 120.1], [635.0, 120.0], [611.72, 220.63], [608.87, 219.95], [604.57, 218.82], [600.3, 217.57], [596.06, 216.22], [591.86, 214.75], [587.69, 213.17], [583.58, 211.49], [579.5, 209.69], [575.48, 207.79], [571.5, 205.79], [567.58, 203.69], [563.72, 201.48], [562.59, 200.8], [635.0, 80.0], [635.0, 79.98], [635.0, 79.01], [635.0, 77.66], [635.0, 76.42], [635.0, 75.27], [635.0, 74.2], [635.0, 73.2], [635.0, 72.26], [635.0, 71.37], [635.0, 70.53], [635.0, 69.74], [635.0, 68.99], [635.0, 68.27], [635.0, 67.59], [635.0, 66.93], [635.0, 66.3], [635.0, 65.7], [635.0, 65.12], [635.0, 64.56]]}], "room_coverage": {"Master Bedroom": {"primary_cameras": [{"camera_id": "camera.master_bedroom", "coverage_pct": 82.0}], "spillover_cameras": [], "max_coverage_pct": 82.0}, "Master Bathroom": {"primary_cameras": [], "spillover_cameras": [{"camera_id": "camera.master_bedroom", "host_room": "Master Bedroom", "overlap_pct": 18.0}], "max_coverage_pct": 18.0}, "Upstairs Bathroom": {"primary_cameras": [], "spillover_cameras": [], "max_coverage_pct": 0.0}, "Margot's Room": {"primary_cameras": [{"camera_id": "camera.nursery", "coverage_pct": 65.0}], "spillover_cameras": [], "max_coverage_pct": 65.0}, "Guest Room": {"primary_cameras": [], "spillover_cameras": [], "max_coverage_pct": 0.0}, "Office": {"primary_cameras": [{"camera_id": "camera.office", "coverage_pct": 67.0}], "spillover_cameras": [], "max_coverage_pct": 67.0}, "Upstairs Hallway & Stairs": {"primary_cameras": [], "spillover_cameras": [{"camera_id": "camera.master_bedroom", "host_room": "Master Bedroom", "overlap_pct": 18.0}, {"camera_id": "camera.office", "host_room": "Office", "overlap_pct": 18.0}], "max_coverage_pct": 18.0}, "Dining Room": {"primary_cameras": [{"camera_id": "camera.dining_room", "coverage_pct": 65.0}], "spillover_cameras": [], "max_coverage_pct": 65.0}, "Living Room": {"primary_cameras": [{"camera_id": "camera.living_room", "coverage_pct": 65.0}], "spillover_cameras": [{"camera_id": "camera.dining_room", "host_room": "Dining Room", "overlap_pct": 18.0}], "max_coverage_pct": 65.0}, "Kitchen": {"primary_cameras": [], "spillover_cameras": [{"camera_id": "camera.family_room", "host_room": "Family Room", "overlap_pct": 51.0}], "max_coverage_pct": 51.0}, "Front Entry": {"primary_cameras": [], "spillover_cameras": [{"camera_id": "camera.living_room", "host_room": "Living Room", "overlap_pct": 38.0}, {"camera_id": "camera.family_room", "host_room": "Family Room", "overlap_pct": 18.0}], "max_coverage_pct": 38.0}, "Family Room": {"primary_cameras": [{"camera_id": "camera.family_room", "coverage_pct": 65.0}], "spillover_cameras": [], "max_coverage_pct": 65.0}, "Garage": {"primary_cameras": [{"camera_id": "camera.garage", "coverage_pct": 65.0}], "spillover_cameras": [], "max_coverage_pct": 65.0}, "Basement Play Area": {"primary_cameras": [{"camera_id": "camera.basement_play_area", "coverage_pct": 65.0}], "spillover_cameras": [{"camera_id": "camera.basement_theater", "host_room": "Basement Theater", "overlap_pct": 18.0}], "max_coverage_pct": 65.0}, "Storage Room": {"primary_cameras": [{"camera_id": "camera.storage_room", "coverage_pct": 65.0}], "spillover_cameras": [], "max_coverage_pct": 65.0}, "Basement Bathroom": {"primary_cameras": [], "spillover_cameras": [], "max_coverage_pct": 0.0}, "Basement Theater": {"primary_cameras": [{"camera_id": "camera.basement_theater", "coverage_pct": 82.0}], "spillover_cameras": [{"camera_id": "camera.basement_play_area", "host_room": "Basement Play Area", "overlap_pct": 18.0}], "max_coverage_pct": 82.0}}, "ambiguities": [{"severity": "high", "category": "camera_spillover", "title": "Living Room Camera cone spills into Front Entry", "rooms": ["Living Room", "Front Entry"], "camera_id": "camera.living_room", "description": "`camera.living_room` (hosted in Living Room) also sees Front Entry. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Living Room occupied.", "resolution": "Downgrade binary_sensor.living_room_person_occupancy to `supporting` and trigger Living Room only from interior Frigate sub-zones."}, {"severity": "high", "category": "camera_spillover", "title": "Dining Room Camera cone spills into Living Room", "rooms": ["Dining Room", "Living Room"], "camera_id": "camera.dining_room", "description": "`camera.dining_room` (hosted in Dining Room) also sees Living Room. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Dining Room occupied.", "resolution": "Downgrade whole-frame camera person to `supporting` and trigger Dining Room only from interior Frigate sub-zones."}, {"severity": "high", "category": "camera_spillover", "title": "Family Room Camera cone spills into Kitchen, Front Entry", "rooms": ["Family Room", "Kitchen", "Front Entry"], "camera_id": "camera.family_room", "description": "`camera.family_room` (hosted in Family Room) also sees Kitchen, Front Entry. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Family Room occupied.", "resolution": "Downgrade binary_sensor.family_room_person_occupancy to `supporting` and trigger Family Room only from interior Frigate sub-zones."}, {"severity": "high", "category": "camera_spillover", "title": "Master Bedroom Camera cone spills into Master Bathroom, Upstairs Hallway & Stairs", "rooms": ["Master Bedroom", "Master Bathroom", "Upstairs Hallway & Stairs"], "camera_id": "camera.master_bedroom", "description": "`camera.master_bedroom` (hosted in Master Bedroom) also sees Master Bathroom, Upstairs Hallway & Stairs. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Master Bedroom occupied.", "resolution": "Downgrade binary_sensor.master_bedroom_person_occupancy, binary_sensor.master_bedroom_entryway_person_occupancy to `supporting` and trigger Master Bedroom only from interior Frigate sub-zones."}, {"severity": "high", "category": "camera_spillover", "title": "Office Camera cone spills into Upstairs Hallway & Stairs", "rooms": ["Office", "Upstairs Hallway & Stairs"], "camera_id": "camera.office", "description": "`camera.office` (hosted in Office) also sees Upstairs Hallway & Stairs. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Office occupied.", "resolution": "Downgrade binary_sensor.office_person_occupancy, binary_sensor.office_entryway_person_occupancy to `supporting` and trigger Office only from interior Frigate sub-zones."}, {"severity": "high", "category": "camera_spillover", "title": "Basement Theater Camera cone spills into Basement Play Area", "rooms": ["Basement Theater", "Basement Play Area"], "camera_id": "camera.basement_theater", "description": "`camera.basement_theater` (hosted in Basement Theater) also sees Basement Play Area. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Basement Theater occupied.", "resolution": "Downgrade binary_sensor.basement_theater_person_occupancy, binary_sensor.basement_stairwell_person_occupancy to `supporting` and trigger Basement Theater only from interior Frigate sub-zones."}, {"severity": "high", "category": "camera_spillover", "title": "Basement Play Area Camera cone spills into Basement Theater", "rooms": ["Basement Play Area", "Basement Theater"], "camera_id": "camera.basement_play_area", "description": "`camera.basement_play_area` (hosted in Basement Play Area) also sees Basement Theater. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Basement Play Area occupied.", "resolution": "Downgrade binary_sensor.basement_play_area_person_occupancy, binary_sensor.basement_stairwell_person_occupancy to `supporting` and trigger Basement Play Area only from interior Frigate sub-zones."}, {"severity": "medium", "category": "blind_pocket", "title": "Guest Room (between Nursery & Office) has zero camera coverage", "rooms": ["Guest Room", "Margot's Room", "Office"], "camera_id": null, "description": "Guest Room sits between Margot's Room and Office off the Upstairs Hallway with no camera view cone and its Ecobee sensor awaiting battery replacement.", "resolution": "Use `guest_room_motion` (moderate) + `guest_room_occupancy` (supporting) + BLE corroboration, with instant timer hand-off to Office, Nursery, and Master Bedroom."}, {"severity": "low", "category": "blind_pocket", "title": "Basement Bathroom is out of frame left of Play Area camera", "rooms": ["Basement Play Area", "Storage Room"], "camera_id": "camera.basement_play_area", "description": "Located to the left of `camera.basement_play_area` alongside Storage Room, with an unmonitored door and no interior sensors.", "resolution": "Treat left edge exit from Basement Play Area as an unsealed transition; Storage Room uses its internal `camera.storage_room` to distinguish gym/storage entry."}, {"severity": "medium", "category": "vertical_ble_bleed", "title": "Vertical BLE stack: Master Bedroom directly above Dining Room (100% overlap)", "rooms": ["Master Bedroom", "Dining Room"], "camera_id": null, "description": "Master Bedroom (Upstairs) sits directly over Dining Room (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.", "resolution": "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor."}, {"severity": "medium", "category": "vertical_ble_bleed", "title": "Vertical BLE stack: Master Bedroom directly above Living Room (83% overlap)", "rooms": ["Master Bedroom", "Living Room"], "camera_id": null, "description": "Master Bedroom (Upstairs) sits directly over Living Room (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.", "resolution": "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor."}, {"severity": "medium", "category": "vertical_ble_bleed", "title": "Vertical BLE stack: Master Bathroom directly above Front Entry (75% overlap)", "rooms": ["Master Bathroom", "Front Entry"], "camera_id": null, "description": "Master Bathroom (Upstairs) sits directly over Front Entry (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.", "resolution": "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor."}, {"severity": "medium", "category": "vertical_ble_bleed", "title": "Vertical BLE stack: Upstairs Bathroom directly above Front Entry (59% overlap)", "rooms": ["Upstairs Bathroom", "Front Entry"], "camera_id": null, "description": "Upstairs Bathroom (Upstairs) sits directly over Front Entry (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.", "resolution": "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor."}, {"severity": "medium", "category": "vertical_ble_bleed", "title": "Vertical BLE stack: Upstairs Bathroom directly above Garage (41% overlap)", "rooms": ["Upstairs Bathroom", "Garage"], "camera_id": null, "description": "Upstairs Bathroom (Upstairs) sits directly over Garage (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.", "resolution": "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor."}, {"severity": "medium", "category": "vertical_ble_bleed", "title": "Vertical BLE stack: Margot's Room directly above Kitchen (53% overlap)", "rooms": ["Margot's Room", "Kitchen"], "camera_id": null, "description": "Margot's Room (Upstairs) sits directly over Kitchen (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.", "resolution": "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor."}, {"severity": "medium", "category": "vertical_ble_bleed", "title": "Vertical BLE stack: Guest Room directly above Family Room (55% overlap)", "rooms": ["Guest Room", "Family Room"], "camera_id": null, "description": "Guest Room (Upstairs) sits directly over Family Room (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.", "resolution": "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor."}, {"severity": "medium", "category": "vertical_ble_bleed", "title": "Vertical BLE stack: Office directly above Family Room (40% overlap)", "rooms": ["Office", "Family Room"], "camera_id": null, "description": "Office (Upstairs) sits directly over Family Room (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.", "resolution": "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor."}, {"severity": "medium", "category": "vertical_ble_bleed", "title": "Vertical BLE stack: Office directly above Garage (82% overlap)", "rooms": ["Office", "Garage"], "camera_id": null, "description": "Office (Upstairs) sits directly over Garage (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.", "resolution": "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor."}], "compiled_room_rules": {"Master Bedroom": {"room_name": "Master Bedroom", "connected_rooms": ["Front Entry", "Guest Room", "Margot's Room", "Master Bathroom", "Office", "Upstairs Bathroom"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)", "Master Bathroom (unmonitored door)"], "recommended_inactivity_timeout": 300, "spillover_entities_to_downgrade": ["binary_sensor.master_bedroom_person_occupancy", "binary_sensor.master_bedroom_entryway_person_occupancy"], "max_camera_coverage_pct": 82.0}, "Master Bathroom": {"room_name": "Master Bathroom", "connected_rooms": ["Master Bedroom"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Master Bedroom (unmonitored door)"], "recommended_inactivity_timeout": 600, "spillover_entities_to_downgrade": [], "max_camera_coverage_pct": 18.0}, "Upstairs Bathroom": {"room_name": "Upstairs Bathroom", "connected_rooms": ["Front Entry", "Guest Room", "Margot's Room", "Master Bedroom", "Office"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)"], "recommended_inactivity_timeout": 180, "spillover_entities_to_downgrade": [], "max_camera_coverage_pct": 0.0}, "Margot's Room": {"room_name": "Margot's Room", "connected_rooms": ["Front Entry", "Guest Room", "Master Bedroom", "Office", "Upstairs Bathroom"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)"], "recommended_inactivity_timeout": 300, "spillover_entities_to_downgrade": ["binary_sensor.nursery_person_occupancy"], "max_camera_coverage_pct": 65.0}, "Guest Room": {"room_name": "Guest Room", "connected_rooms": ["Front Entry", "Margot's Room", "Master Bedroom", "Office", "Upstairs Bathroom"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)"], "recommended_inactivity_timeout": 300, "spillover_entities_to_downgrade": [], "max_camera_coverage_pct": 0.0}, "Office": {"room_name": "Office", "connected_rooms": ["Front Entry", "Guest Room", "Margot's Room", "Master Bedroom", "Upstairs Bathroom"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)"], "recommended_inactivity_timeout": 240, "spillover_entities_to_downgrade": ["binary_sensor.office_person_occupancy", "binary_sensor.office_entryway_person_occupancy"], "max_camera_coverage_pct": 67.0}, "Dining Room": {"room_name": "Dining Room", "connected_rooms": ["Kitchen", "Living Room"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Living Room (open passage)", "Kitchen (open passage)"], "recommended_inactivity_timeout": 180, "spillover_entities_to_downgrade": [], "max_camera_coverage_pct": 65.0}, "Living Room": {"room_name": "Living Room", "connected_rooms": ["Dining Room", "Front Entry"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Front Entry (open passage)", "Dining Room (open passage)"], "recommended_inactivity_timeout": 180, "spillover_entities_to_downgrade": ["binary_sensor.living_room_person_occupancy"], "max_camera_coverage_pct": 65.0}, "Kitchen": {"room_name": "Kitchen", "connected_rooms": ["Dining Room", "Family Room", "Front Entry"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Front Entry (open passage)", "Dining Room (open passage)", "Family Room (open passage)"], "recommended_inactivity_timeout": 180, "spillover_entities_to_downgrade": [], "max_camera_coverage_pct": 51.0}, "Front Entry": {"room_name": "Front Entry", "connected_rooms": ["Family Room", "Guest Room", "Kitchen", "Living Room", "Margot's Room", "Master Bedroom", "Office", "Upstairs Bathroom"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Living Room (open passage)", "Kitchen (open passage)", "Family Room (open passage)", "Upstairs Hallway & Stairs (stairs)"], "recommended_inactivity_timeout": 60, "spillover_entities_to_downgrade": [], "max_camera_coverage_pct": 38.0}, "Family Room": {"room_name": "Family Room", "connected_rooms": ["Basement Play Area", "Basement Theater", "Front Entry", "Garage", "Kitchen"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Front Entry (open passage)", "Kitchen (open passage)", "Garage (unmonitored door)", "Basement Play Area (stairs)", "Basement Theater (stairs)"], "recommended_inactivity_timeout": 180, "spillover_entities_to_downgrade": ["binary_sensor.family_room_person_occupancy"], "max_camera_coverage_pct": 65.0}, "Garage": {"room_name": "Garage", "connected_rooms": ["Family Room"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Family Room (unmonitored door)"], "recommended_inactivity_timeout": 180, "spillover_entities_to_downgrade": [], "max_camera_coverage_pct": 65.0}, "Basement Play Area": {"room_name": "Basement Play Area", "connected_rooms": ["Basement Theater", "Family Room", "Storage Room"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Family Room (stairs)", "Basement Theater (open passage)", "Storage Room (unmonitored door)", "Basement Bathroom (unmonitored door)"], "recommended_inactivity_timeout": 180, "spillover_entities_to_downgrade": ["binary_sensor.basement_play_area_person_occupancy", "binary_sensor.basement_stairwell_person_occupancy"], "max_camera_coverage_pct": 65.0}, "Storage Room": {"room_name": "Storage Room", "connected_rooms": ["Basement Play Area"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Basement Play Area (unmonitored door)"], "recommended_inactivity_timeout": 180, "spillover_entities_to_downgrade": [], "max_camera_coverage_pct": 65.0}, "Basement Theater": {"room_name": "Basement Theater", "connected_rooms": ["Basement Play Area", "Family Room"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Family Room (stairs)", "Basement Play Area (open passage)"], "recommended_inactivity_timeout": 240, "spillover_entities_to_downgrade": ["binary_sensor.basement_theater_person_occupancy", "binary_sensor.basement_stairwell_person_occupancy"], "max_camera_coverage_pct": 82.0}}};

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
    this._showBlueprintUnderlay = true;
    this._underlayOpacity = 0.5;
    this._floorplanMode = "rooms"; // "rooms" | "cameras"
    this._cameraAlignmentResult = null;
    this._cameraAlignmentError = null;
    this._analyzingCamera = false;
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
      const saved = window.localStorage.getItem("pdd_floorplan_layout_v3");
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
          window.localStorage.setItem("pdd_floorplan_layout_v3", JSON.stringify(this._floorplan));
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
          window.localStorage.removeItem("pdd_floorplan_layout_v3");
          window.localStorage.removeItem("pdd_floorplan_layout_v1");
        } catch (_e) {}
        this._compiledTopology = this._compileFloorplanClient(this._floorplan);
        this.render();
        this.showToast("Reset floorplan to default layout", "info");
        return;
      }
      try {
        window.localStorage.setItem("pdd_floorplan_layout_v3", JSON.stringify(this._floorplan));
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
          window.localStorage.setItem("pdd_floorplan_layout_v3", JSON.stringify(this._floorplan));
        }
      } catch (_e) {}
    }, 400);
  }

  async _analyzeCameraAlignment(camId) {
    if (!camId) return;
    this._analyzingCamera = true;
    this._cameraAlignmentError = null;
    this._cameraAlignmentResult = null;
    this.render();

    try {
      const cam = (this._floorplan?.cameras || []).find(
        (c) => (c.id || c.camera_entity) === camId
      );
      if (!cam) throw new Error("Camera not found in floorplan");

      const res = await this._apiCall(
        "POST",
        `/api/presence_detection_designer/camera/${encodeURIComponent(camId)}/align`,
        { camera_dict: cam }
      );
      if (res && res.error) {
        throw new Error(res.error);
      }
      this._cameraAlignmentResult = res;
      this.showToast("Camera perspective and openings analyzed successfully", "success");
    } catch (err) {
      this._cameraAlignmentError = String(err.message || err);
      this.showToast(`Alignment failed: ${this._cameraAlignmentError}`, "danger");
    } finally {
      this._analyzingCamera = false;
      this.render();
    }
  }

  _renderCameraAlignmentDetails(selCam) {
    if (this._analyzingCamera) {
      return `
        <div style="padding:16px;text-align:center;color:var(--ha-muted);font-size:12px;">
          <div style="margin-bottom:6px;font-weight:600;">🔍 Processing snapshot computer vision...</div>
          <div style="font-size:11px;">Estimating horizon vanishing line, tilt/pitch angle &amp; doorway azimuth rays.</div>
        </div>
      `;
    }

    if (this._cameraAlignmentError) {
      return `
        <div style="padding:10px;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;color:#b91c1c;font-size:12px;margin-top:6px;">
          <strong>Alignment Error:</strong> ${this._escape(this._cameraAlignmentError)}
        </div>
      `;
    }

    const res = this._cameraAlignmentResult;
    if (!res || !res.success) {
      return `
        <div style="font-size:12px;color:var(--ha-muted);margin-top:4px;">
          Click <strong>Analyze Alignment</strong> to evaluate this camera's vertical pitch (downward tilt) and horizontal sightline to doorways, computing the optimal 2D cone heading.
        </div>
      `;
    }

    const openings = Array.isArray(res.openings) ? res.openings : [];
    const diffHeading = Math.round((res.recommended_heading_deg - res.current_heading_deg) * 10) / 10;
    const diffSign = diffHeading > 0 ? `+${diffHeading}°` : `${diffHeading}°`;

    return `
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:8px;">
        ${
          res.annotated_image
            ? `<div style="text-align:center;background:#0f172a;border-radius:6px;overflow:hidden;border:1px solid var(--ha-divider);">
                 <img src="${res.annotated_image}" style="max-width:100%;max-height:240px;object-fit:contain;display:block;margin:0 auto;" alt="Annotated Camera Alignment" />
               </div>`
            : ""
        }
        <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:8px;text-align:center;font-size:12px;">
          <div style="background:var(--ha-subtle, #f1f5f9);padding:8px 6px;border-radius:6px;border:1px solid var(--ha-divider);">
            <div style="color:var(--ha-muted);font-size:11px;">Vertical Tilt / Pitch</div>
            <div style="font-weight:700;font-size:14px;color:#0284c7;">${res.tilt_deg > 0 ? "+" : ""}${res.tilt_deg}°</div>
            <div style="font-size:10px;color:var(--ha-muted);">${res.tilt_deg < 0 ? "Angled Down" : "Level/Up"}</div>
          </div>
          <div style="background:var(--ha-subtle, #f1f5f9);padding:8px 6px;border-radius:6px;border:1px solid var(--ha-divider);">
            <div style="color:var(--ha-muted);font-size:11px;">Camera Roll</div>
            <div style="font-weight:700;font-size:14px;color:#0284c7;">${res.roll_deg > 0 ? "+" : ""}${res.roll_deg}°</div>
            <div style="font-size:10px;color:var(--ha-muted);">Horizon Level</div>
          </div>
          <div style="background:var(--ha-subtle, #f1f5f9);padding:8px 6px;border-radius:6px;border:1px solid var(--ha-divider);">
            <div style="color:var(--ha-muted);font-size:11px;">Cone Alignment</div>
            <div style="font-weight:700;font-size:14px;color:${Math.abs(diffHeading) > 3 ? "#d97706" : "#16a34a"};">
              ${res.recommended_heading_deg}° <span style="font-size:11px;font-weight:500;">(Δ ${diffSign})</span>
            </div>
            <div style="font-size:10px;color:var(--ha-muted);">2D Cone: ${res.current_heading_deg}°</div>
          </div>
        </div>

        ${
          openings.length > 0
            ? `
          <div style="font-size:11.5px;border:1px solid var(--ha-divider);border-radius:6px;overflow:hidden;">
            <div style="background:var(--ha-subtle, #f1f5f9);padding:6px 10px;font-weight:600;display:flex;justify-content:space-between;">
              <span>Detected Physical Openings</span>
              <span>Visual vs Expected Azimuth</span>
            </div>
            ${openings
              .map(
                (op) => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px;border-top:1px solid var(--ha-divider);">
                <div>
                  <strong style="color:#0284c7;">${this._escape(op.target_room || op.entryway_id || "Passage")}</strong>
                  <span style="font-size:10px;color:var(--ha-muted);margin-left:4px;">(Bearing: ${op.bearing_deg ?? "—"}°)</span>
                </div>
                <div style="text-align:right;">
                  <span>Azimuth: <strong>${op.azimuth_deg > 0 ? "+" : ""}${op.azimuth_deg}°</strong></span>
                  ${
                    op.discrepancy_deg !== undefined
                      ? `<span style="margin-left:6px;color:${Math.abs(op.discrepancy_deg) > 3 ? "#d97706" : "#16a34a"};font-weight:600;">(Δ ${op.discrepancy_deg > 0 ? "+" : ""}${op.discrepancy_deg}°)</span>`
                      : ""
                  }
                </div>
              </div>`
              )
              .join("")}
          </div>`
            : `<div style="font-size:11.5px;color:var(--ha-muted);text-align:center;padding:4px;">No distinct doorway openings matched in current FOV cone.</div>`
        }

        <button class="btn btn-sm btn-primary" id="btn-fp-apply-calibrated-heading" style="padding:7px 12px;font-size:12px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:6px;">
          <span>🎯 Auto-Calibrate 2D Heading to Physical Reality (${res.recommended_heading_deg}°)</span>
        </button>
      </div>
    `;
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
    const isCamMode = this._floorplanMode === "cameras";
    const conesSvg = fCams
      .map((cam) => {
        const camId = cam.id || cam.camera_entity;
        const camLabel = (cam.name || cam.label || camId).replace(" Camera", "");
        const isSelectedCam = selCam && (selCam.id || selCam.camera_entity) === camId && isCamMode;
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
        if (isSelectedCam && isCamMode) {
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
          <g class="fp-cam-group" data-cam-entity="${this._escape(camId)}" style="${isCamMode ? "" : "opacity:0.4;"}">
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
              style="${isCamMode ? "cursor:move;pointer-events:all;" : "pointer-events:none;"}"
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
    const isRoomMode = this._floorplanMode === "rooms";
    const roomsSvg = fRooms
      .map((box) => {
        const rName = box.name || box.room_name;
        const live = liveRoomsByName[rName];
        const isSel = (selBox && (selBox.name || selBox.room_name) === rName && isRoomMode);
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
            const isSelDoor = this._selectedDoorId === ew.id && isRoomMode;
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
              <g class="fp-door-group" data-room-name="${this._escape(rName)}" data-door-id="${this._escape(ew.id)}" style="${isRoomMode ? "" : "pointer-events:none;"}">
                <line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#ffffff" stroke-width="5" stroke-linecap="round" />
                <line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${doorColor}" stroke-width="${isSelDoor ? "3" : "2"}" stroke-dasharray="${isPassage ? "4,3" : "none"}" />
                <circle class="fp-door-handle" data-room-name="${this._escape(rName)}" data-door-id="${this._escape(ew.id)}" cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="${isSelDoor ? "6.5" : "5"}" fill="${doorColor}" stroke="#ffffff" stroke-width="1.5" style="${isRoomMode ? "cursor:grab;pointer-events:all;" : "pointer-events:none;display:none;"}" />
                ${
                  isSelDoor && isRoomMode
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
        if (isSel && isRoomMode) {
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
          <g class="fp-room-box" data-room-name="${this._escape(rName)}" style="${isRoomMode ? "" : "pointer-events:none;"}">
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
              style="${isRoomMode ? "cursor:move;pointer-events:all;" : "pointer-events:none;"}"
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

    // Blueprint Underlay for active floor
    let underlaySvg = "";
    const activeFloorId = activeFloor.id || "main";
    const underlayDef = typeof PDD_FLOOR_UNDERLAYS !== "undefined" ? PDD_FLOOR_UNDERLAYS[activeFloorId] : null;
    if (underlayDef && this._showBlueprintUnderlay) {
      underlaySvg = `
        <image
          id="fp-blueprint-underlay"
          href="${underlayDef.url}"
          x="${underlayDef.x}"
          y="${underlayDef.y}"
          width="${underlayDef.width}"
          height="${underlayDef.height}"
          opacity="${this._underlayOpacity}"
          preserveAspectRatio="none"
          style="pointer-events:none;transition:opacity 0.2s ease;"
        />
      `;
    }

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
            <div class="seg-group" id="fp-mode-switcher" style="margin-top:0;">
              <button class="seg-btn ${
                this._floorplanMode === "rooms" ? "active" : ""
              }" id="btn-fp-mode-rooms" style="padding:6px 12px;font-weight:600;">
                🏠 Rooms & Doors
              </button>
              <button class="seg-btn ${
                this._floorplanMode === "cameras" ? "active" : ""
              }" id="btn-fp-mode-cameras" style="padding:6px 12px;font-weight:600;">
                📹 Cameras & Cones
              </button>
            </div>
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
            <div style="display:flex;align-items:center;gap:6px;background:var(--ha-subtle);padding:3px 10px;border-radius:6px;border:1px solid var(--ha-divider);font-size:12px;">
              <label style="display:flex;align-items:center;gap:5px;cursor:pointer;">
                <input type="checkbox" id="toggle-blueprint-underlay" ${this._showBlueprintUnderlay ? "checked" : ""} style="cursor:pointer;" />
                <span>Blueprint Underlay</span>
              </label>
              ${this._showBlueprintUnderlay ? `
                <input type="range" id="blueprint-opacity-slider" min="5" max="100" step="5" value="${Math.round(this._underlayOpacity * 100)}" style="width:70px;cursor:pointer;" title="Underlay Opacity" />
                <span style="font-size:11px;color:var(--ha-muted);min-width:24px;">${Math.round(this._underlayOpacity * 100)}%</span>
              ` : ""}
            </div>
            <button class="btn btn-sm" id="btn-toggle-fp-inspector">
              ${this._showFloorplanInspector ? "Hide Geometry & Doorway Editor" : "Edit Boxes, Cameras & Doorways"}
            </button>
            <button class="btn btn-primary btn-sm" id="btn-fp-compile">Apply Connections to Rooms</button>
          </div>
        </div>

        <div style="background:#f8fafc;border:1px solid var(--ha-divider);border-radius:10px;padding:10px;overflow:hidden;touch-action:none;">
          <svg id="fp-svg-canvas" viewBox="0 0 1000 580" style="width:100%;height:auto;min-height:420px;display:block;user-select:none;touch-action:none;">
            ${underlaySvg}
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
                </div>

                <!-- Camera View & Physical Horizon/Azimuth Alignment -->
                <div style="margin-top:14px;padding:12px;background:var(--ha-card-background, #ffffff);border:1px solid var(--ha-divider);border-radius:8px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:6px;">
                    <div>
                      <div style="font-weight:600;font-size:12.5px;">📸 Camera View &amp; Opening Alignment</div>
                      <div style="font-size:11px;color:var(--ha-muted);">CV vanishing horizon tilt &amp; doorway azimuth analysis</div>
                    </div>
                    <button class="btn btn-sm btn-primary" id="btn-fp-analyze-camera" style="padding:4px 10px;font-size:11.5px;" ${this._analyzingCamera ? "disabled" : ""}>
                      ${this._analyzingCamera ? "Analyzing..." : "Analyze Alignment"}
                    </button>
                  </div>
                  ${this._renderCameraAlignmentDetails(selCam)}
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
    root.querySelector("#toggle-blueprint-underlay")?.addEventListener("change", (e) => {
      this._showBlueprintUnderlay = Boolean(e.target.checked);
      this.render();
    });
    root.querySelector("#blueprint-opacity-slider")?.addEventListener("input", (e) => {
      this._underlayOpacity = Number(e.target.value) / 100.0;
      const img = root.querySelector("#fp-blueprint-underlay");
      if (img) {
        img.setAttribute("opacity", this._underlayOpacity);
      }
    });
    root.querySelector("#blueprint-opacity-slider")?.addEventListener("change", (e) => {
      this._underlayOpacity = Number(e.target.value) / 100.0;
      this.render();
    });
    root.querySelectorAll(".seg-btn[data-floor-id]").forEach((el) => {
      el.addEventListener("click", () => {
        this._selectedFloorId = el.getAttribute("data-floor-id") || "main";
        this._selectedCamEntity = null;
        this.render();
      });
    });
    root.querySelector("#btn-fp-mode-rooms")?.addEventListener("click", () => {
      this._floorplanMode = "rooms";
      this._selectedCamEntity = null;
      this.render();
    });
    root.querySelector("#btn-fp-mode-cameras")?.addEventListener("click", () => {
      this._floorplanMode = "cameras";
      this._selectedRoomBoxName = null;
      this._selectedDoorId = null;
      this.render();
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
      this._cameraAlignmentResult = null;
      this._cameraAlignmentError = null;
      this.render();
    });
    root.querySelector("#btn-fp-analyze-camera")?.addEventListener("click", () => {
      const fCams = (this._floorplan?.cameras || []).filter(
        (c) => (c.floor || "main") === this._selectedFloorId
      );
      const selCamId =
        this._selectedCamEntity ||
        root.querySelector("#fp-cam-select")?.value ||
        (fCams[0]?.id || fCams[0]?.camera_entity);
      if (selCamId) {
        this._analyzeCameraAlignment(selCamId);
      }
    });
    root.querySelector("#btn-fp-apply-calibrated-heading")?.addEventListener("click", () => {
      const res = this._cameraAlignmentResult;
      if (!res || res.recommended_heading_deg === undefined) return;
      const selCamId = res.camera_id || this._selectedCamEntity;
      const cam = (this._floorplan?.cameras || []).find(
        (c) => (c.id || c.camera_entity) === selCamId
      );
      if (cam) {
        cam.heading_deg = Math.round(res.recommended_heading_deg);
        this._compiledTopology = this._compileFloorplanClient(this._floorplan);
        this._scheduleCanvasRender();
        this._debounceSaveFloorplan();
        this.showToast(`Calibrated camera heading to ${cam.heading_deg}°`, "success");
        this.render();
      }
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

        // Enforce active floorplan tool mode isolation
        if (this._floorplanMode === "rooms" && (camHandle || camOrigin)) {
          return;
        }
        if (this._floorplanMode === "cameras" && (resizeHandle || doorTab || doorHandle || roomBox)) {
          return;
        }

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
