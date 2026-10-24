/**
 * Presence Detection Designer — Clean Home Assistant Material Design Panel
 * Custom Element: <presence-detection-designer-panel>
 */

const PDD_DEFAULT_FLOORPLAN = {"cameras": [{"floor": "main", "fov_deg": 65, "heading_deg": 18, "host_room": "Living Room", "id": "camera.living_room", "name": "Living Room Camera", "notes": "Catches Living Room and sightline projects through open archway into Front Entry.", "range_px": 350, "spills_into": ["Front Entry"], "x": 175, "y": 530, "zones": ["living_room_couch", "living_room_floor", "living_room_bay_windows", "living_room_entry"]}, {"floor": "main", "fov_deg": 55, "heading_deg": 125, "host_room": "Dining Room", "id": "camera.dining_room", "name": "Dining Room Camera", "notes": "Covers Dining Room table and Riley's food area.", "range_px": 240, "spills_into": [], "x": 175, "y": 135, "zones": ["dining_room_table", "rileys_food"]}, {"floor": "main", "fov_deg": 75, "heading_deg": 210, "host_room": "Family Room", "id": "camera.family_room", "name": "Family Room Camera", "notes": "Catches Family Room, Kitchen Island, and pathway to Entryway, Basement, and Laundry.", "range_px": 420, "spills_into": ["Kitchen", "Front Entry"], "x": 830, "y": 135, "zones": ["family_room_couch", "family_room_recliner", "family_room_floor", "kitchen_island"]}, {"floor": "main", "fov_deg": 64, "heading_deg": 35, "host_room": "Garage", "id": "camera.garage", "name": "Garage Camera", "notes": "Covers Garage / Laundry parking bay.", "range_px": 230, "spills_into": [], "x": 580, "y": 530, "zones": ["garage_parking"]}, {"floor": "upstairs", "fov_deg": 80, "heading_deg": 70, "host_room": "Master Bedroom", "id": "camera.master_bedroom", "name": "Master Bedroom Camera", "notes": "Catches Master Bedroom plus entries to Upstairs Hallway and Master Bathroom/Closet.", "range_px": 480, "spills_into": ["Upstairs Hallway & Stairs", "Master Bathroom"], "x": 150, "y": 50, "zones": ["master_bed", "master_open_area", "master_bedroom_walkway", "master_bedroom_entryway", "master_bathroom"]}, {"floor": "upstairs", "fov_deg": 75, "heading_deg": 75, "host_room": "Margot's Room", "id": "camera.nursery", "name": "Nursery Camera", "notes": "Covers Nursery bed and partially sees doorway from Upstairs Hallway.", "range_px": 270, "spills_into": ["Upstairs Hallway & Stairs"], "x": 375, "y": 50, "zones": ["nursery_bed"]}, {"floor": "upstairs", "fov_deg": 80, "heading_deg": 215, "host_room": "Office", "id": "camera.office", "name": "Office Camera", "notes": "Covers Office desk/sim rig and sees Office doorway next to the stairs.", "range_px": 320, "spills_into": ["Upstairs Hallway & Stairs"], "x": 855, "y": 525, "zones": ["steves_desk", "sim_rig", "office_floor", "office_entryway"]}, {"floor": "basement", "fov_deg": 90, "heading_deg": 215, "host_room": "Basement Theater", "id": "camera.basement_theater", "name": "Basement Theater Camera", "notes": "Covers Theater, sees far Play Area/Bar, and partially catches Basement Stairs.", "range_px": 350, "spills_into": ["Basement Play Area"], "x": 765, "y": 520, "zones": ["basement_theater_couch", "basement_theater_playpen", "basement_theater_floor", "basement_bar", "basement_play_area_far", "basement_stairwell"]}, {"floor": "basement", "fov_deg": 85, "heading_deg": 40, "host_room": "Basement Play Area", "id": "camera.basement_play_area", "name": "Basement Play Area Camera", "notes": "Covers Play Area & Counter; sees into Theater. Storage Room & Basement Bath are out of frame on left.", "range_px": 480, "spills_into": ["Basement Theater"], "x": 235, "y": 520, "zones": ["basement_play_floor", "basement_counter", "theater_rear_view"]}, {"floor": "basement", "fov_deg": 75, "heading_deg": 125, "host_room": "Storage Room", "id": "camera.storage_room", "name": "Storage Room Camera", "notes": "Covers interior Storage Room / Gym floor.", "range_px": 170, "spills_into": [], "x": 650, "y": 55, "zones": ["storage_room_workout"]}], "canvas": {"height": 600, "width": 1000}, "connections": [{"from_room": "Front Entry", "id": "conn_entry_lr", "label": "Open Archway (Entry <-> Living Room)", "to_room": "Living Room", "type": "open_passage"}, {"from_room": "Front Entry", "id": "conn_entry_kitchen", "label": "Pathway (Entry <-> Kitchen)", "to_room": "Kitchen", "type": "open_passage"}, {"from_room": "Front Entry", "id": "conn_entry_fr", "label": "Pathway (Entry <-> Family/Laundry/Basement)", "to_room": "Family Room", "type": "open_passage"}, {"from_room": "Living Room", "id": "conn_lr_dr", "label": "Open Passage (Living <-> Dining)", "to_room": "Dining Room", "type": "open_passage"}, {"from_room": "Dining Room", "id": "conn_dr_kitchen", "label": "Open Passage (Dining <-> Kitchen)", "to_room": "Kitchen", "type": "open_passage"}, {"from_room": "Kitchen", "id": "conn_kitchen_fr", "label": "Open Concept (Kitchen <-> Family Room)", "to_room": "Family Room", "type": "open_passage"}, {"entity_id": "binary_sensor.utility_room_door", "from_room": "Family Room", "id": "conn_fr_garage", "label": "Laundry / Garage Pathway", "to_room": "Garage", "type": "unmonitored_door"}, {"from_room": "Front Entry", "id": "conn_entry_upstairs", "label": "Main Stairs to Upstairs", "to_room": "Upstairs Hallway & Stairs", "type": "stairs"}, {"from_room": "Family Room", "id": "conn_fr_basement_play", "label": "Basement Stairs", "to_room": "Basement Play Area", "type": "stairs"}, {"from_room": "Family Room", "id": "conn_fr_basement_theater", "label": "Basement Stairs (Partial Sightline)", "to_room": "Basement Theater", "type": "stairs"}, {"from_room": "Upstairs Hallway & Stairs", "id": "conn_hall_office", "label": "Office Doorway (Next to Stairs)", "to_room": "Office", "type": "unmonitored_door"}, {"from_room": "Upstairs Hallway & Stairs", "id": "conn_hall_guest", "label": "Guest Room Doorway (No Sensor)", "to_room": "Guest Room", "type": "unmonitored_door"}, {"from_room": "Upstairs Hallway & Stairs", "id": "conn_hall_nursery", "label": "Nursery Doorway (Seen Partially by Cam)", "to_room": "Margot's Room", "type": "unmonitored_door"}, {"from_room": "Upstairs Hallway & Stairs", "id": "conn_hall_master", "label": "Master Bedroom Entryway", "to_room": "Master Bedroom", "type": "unmonitored_door"}, {"from_room": "Master Bedroom", "id": "conn_master_bath", "label": "Master Bath / Shower Stall Entry", "to_room": "Master Bathroom", "type": "unmonitored_door"}, {"from_room": "Upstairs Hallway & Stairs", "id": "conn_hall_ubath", "label": "Shared Bathroom (Double Vanity & Tub)", "to_room": "Upstairs Bathroom", "type": "unmonitored_door"}, {"from_room": "Basement Play Area", "id": "conn_play_theater", "label": "Open Basement Divide (Play <-> Theater)", "to_room": "Basement Theater", "type": "open_passage"}, {"from_room": "Basement Play Area", "id": "conn_play_storage", "label": "Storage Room Door (No Sensor, Out of Frame Left)", "to_room": "Storage Room", "type": "unmonitored_door"}, {"from_room": "Basement Play Area", "id": "conn_play_bbath", "label": "Basement Bath Door (No Sensor, Out of Frame Left)", "to_room": "Basement Bathroom", "type": "unmonitored_door"}], "floors": [{"id": "upstairs", "name": "Upstairs Level", "order": 0}, {"id": "main", "name": "Main Floor", "order": 1}, {"id": "basement", "name": "Basement Level", "order": 2}], "rooms": [{"entryways": [{"id": "door_master_hallway", "offset": 230, "target_room": "Upstairs Hallway & Stairs", "type": "door", "wall": "right", "width": 40}, {"id": "door_master_bath", "offset": 360, "target_room": "Master Bathroom", "type": "door", "wall": "right", "width": 40}], "floor": "upstairs", "height": 505, "id": "master_bedroom", "name": "Master Bedroom", "notes": "West wing front-to-back. Camera catches bed, doorway to Upstairs Hallway, and entry to Master Bath / WIC.", "room_type": "room", "width": 225, "x": 135, "y": 35}, {"entryways": [{"id": "door_mbath_master", "offset": 15, "target_room": "Master Bedroom", "type": "door", "wall": "left", "width": 40}], "floor": "upstairs", "height": 160, "id": "master_bathroom", "name": "Master Bathroom", "notes": "En-suite bath next to WIC with single sink and shower stall; entry caught by master bedroom camera.", "room_type": "room", "width": 140, "x": 360, "y": 380}, {"entryways": [{"id": "door_ubath_hall", "offset": 35, "target_room": "Upstairs Hallway & Stairs", "type": "door", "wall": "top", "width": 36}], "floor": "upstairs", "height": 160, "id": "upstairs_bathroom", "name": "Upstairs Bathroom", "notes": "Shared upstairs bathroom with double vanity and soaking tub, opening off hallway.", "room_type": "room", "width": 110, "x": 500, "y": 380}, {"entryways": [{"id": "door_margot_hallway", "offset": 160, "target_room": "Upstairs Hallway & Stairs", "type": "door", "wall": "bottom", "width": 36}], "floor": "upstairs", "height": 215, "id": "margots_room", "name": "Margot's Room", "notes": "Top-middle bedroom; doorway opens to Upstairs Hallway.", "room_type": "room", "width": 250, "x": 360, "y": 35}, {"entryways": [{"id": "door_guest_hallway", "offset": 30, "target_room": "Upstairs Hallway & Stairs", "type": "door", "wall": "bottom", "width": 36}], "floor": "upstairs", "height": 215, "id": "guest_room", "name": "Guest Room", "notes": "Top-right bedroom; doorway opens to Upstairs Hallway.", "room_type": "room", "width": 260, "x": 610, "y": 35}, {"entryways": [{"id": "door_office_hallway", "offset": 20, "target_room": "Upstairs Hallway & Stairs", "type": "door", "wall": "left", "width": 40}], "floor": "upstairs", "height": 290, "id": "office", "name": "Office", "notes": "Bottom-right bedroom / office next to stairs landing; camera sees desk, rig, and doorway.", "room_type": "room", "width": 260, "x": 610, "y": 250}, {"entryways": [{"id": "door_hall_master", "offset": 15, "target_room": "Master Bedroom", "type": "door", "wall": "left", "width": 40}, {"id": "door_hall_margot", "offset": 160, "target_room": "Margot's Room", "type": "door", "wall": "top", "width": 36}, {"id": "door_hall_guest", "offset": 10, "target_room": "Guest Room", "type": "door", "wall": "right", "width": 36}, {"id": "door_hall_office", "offset": 20, "target_room": "Office", "type": "door", "wall": "right", "width": 40}, {"id": "passage_hall_stairs", "offset": 180, "target_room": "Front Entry", "type": "open_passage", "wall": "bottom", "width": 55}], "floor": "upstairs", "height": 130, "id": "upstairs_hallway", "name": "Upstairs Hallway & Stairs", "notes": "Connects Master Bedroom, Margot's Room, Guest Room, Office, Bathrooms, and Stairs to Front Entry.", "room_type": "transit", "width": 250, "x": 360, "y": 250}, {"entryways": [{"id": "arch_dr_kitchen", "offset": 20, "target_room": "Kitchen", "type": "open_passage", "wall": "right", "width": 160}, {"id": "arch_dr_lr", "offset": 20, "target_room": "Living Room", "type": "open_passage", "wall": "bottom", "width": 120}], "floor": "main", "height": 205, "id": "dining_room", "name": "Dining Room", "notes": "Northwest room opening to Kitchen and Living Room.", "room_type": "room", "width": 160, "x": 160, "y": 120}, {"entryways": [{"id": "arch_lr_dr", "offset": 20, "target_room": "Dining Room", "type": "open_passage", "wall": "top", "width": 120}, {"id": "arch_lr_entry", "offset": 30, "target_room": "Front Entry", "type": "open_passage", "wall": "right", "width": 130}], "floor": "main", "height": 220, "id": "living_room", "name": "Living Room", "notes": "Southwest room with front bay windows; opens to Dining Room and Front Entryway.", "room_type": "room", "width": 235, "x": 160, "y": 325}, {"entryways": [{"id": "arch_kitchen_dr", "offset": 20, "target_room": "Dining Room", "type": "open_passage", "wall": "left", "width": 160}, {"id": "arch_kitchen_fr", "offset": 20, "target_room": "Family Room", "type": "open_passage", "wall": "right", "width": 170}, {"id": "path_kitchen_entry", "offset": 75, "target_room": "Front Entry", "type": "open_passage", "wall": "bottom", "width": 100}], "floor": "main", "height": 205, "id": "kitchen", "name": "Kitchen", "notes": "Central kitchen with island counter and breakfast nook; open to Family Room, Dining Room, and Front Entry.", "room_type": "room", "width": 245, "x": 320, "y": 120}, {"entryways": [{"id": "arch_entry_lr", "offset": 30, "target_room": "Living Room", "type": "open_passage", "wall": "left", "width": 130}, {"id": "path_entry_kitchen", "offset": 0, "target_room": "Kitchen", "type": "open_passage", "wall": "top", "width": 100}, {"id": "path_entry_fr", "offset": 10, "target_room": "Family Room", "type": "open_passage", "wall": "right", "width": 60}, {"id": "door_front_entry", "offset": 60, "target_room": "Exterior", "type": "door", "wall": "bottom", "width": 45}], "floor": "main", "height": 220, "id": "front_entry", "name": "Front Entry", "notes": "Main foyer with front door, powder room, stairs up to Floor 3, and pathways to Living Room and Kitchen.", "room_type": "room", "width": 170, "x": 395, "y": 325}, {"entryways": [{"id": "arch_fr_kitchen", "offset": 20, "target_room": "Kitchen", "type": "open_passage", "wall": "left", "width": 170}, {"id": "path_fr_entry", "offset": 10, "target_room": "Front Entry", "type": "open_passage", "wall": "bottom", "width": 60}, {"id": "door_fr_laundry", "offset": 40, "target_room": "Garage", "type": "door", "wall": "bottom", "width": 40}], "floor": "main", "height": 250, "id": "family_room", "name": "Family Room", "notes": "East living area with north fireplace; open to Kitchen and connects to Laundry and Front Entry.", "room_type": "room", "width": 280, "x": 565, "y": 120}, {"entryways": [{"id": "door_garage_fr", "offset": 40, "target_room": "Family Room", "type": "door", "wall": "top", "width": 40}], "floor": "main", "height": 175, "id": "garage", "name": "Garage", "notes": "Includes laundry room and garage entry walkway connecting off Family Room.", "room_type": "room", "width": 280, "x": 565, "y": 370}, {"entryways": [{"id": "door_play_storage", "offset": 40, "target_room": "Storage Room", "type": "door", "wall": "right", "width": 40}, {"id": "door_play_bbath", "offset": 235, "target_room": "Basement Bathroom", "type": "door", "wall": "right", "width": 36}, {"id": "arch_play_theater", "offset": 375, "target_room": "Basement Theater", "type": "open_passage", "wall": "right", "width": 110}], "floor": "basement", "height": 495, "id": "basement_play_area", "name": "Basement Play Area", "notes": "Main basement recreation room with west fireplace and south alcoves; connects to Storage and Theater.", "room_type": "room", "width": 415, "x": 220, "y": 40}, {"entryways": [{"id": "door_storage_play", "offset": 40, "target_room": "Basement Play Area", "type": "door", "wall": "left", "width": 40}], "floor": "basement", "height": 185, "id": "storage_room", "name": "Storage Room", "notes": "Upper northeast wet bar / storage area; door connects to Recreation Room.", "room_type": "room", "width": 145, "x": 635, "y": 40}, {"entryways": [{"id": "door_bbath_play", "offset": 10, "target_room": "Basement Play Area", "type": "door", "wall": "left", "width": 36}], "floor": "basement", "height": 145, "id": "basement_bathroom", "name": "Basement Bathroom", "notes": "Full basement bathroom off recreation hallway.", "room_type": "transit", "width": 145, "x": 635, "y": 225}, {"entryways": [{"id": "arch_theater_play", "offset": 5, "target_room": "Basement Play Area", "type": "open_passage", "wall": "left", "width": 110}], "floor": "basement", "height": 165, "id": "basement_theater", "name": "Basement Theater", "notes": "Lower northeast basement hallway / media lounge and stair exit.", "room_type": "room", "width": 145, "x": 635, "y": 370}], "version": 2};
const PDD_DEFAULT_COMPILED_TOPOLOGY = {"floorplan": {"cameras": [{"floor": "main", "fov_deg": 65, "heading_deg": 18, "host_room": "Living Room", "id": "camera.living_room", "name": "Living Room Camera", "notes": "Catches Living Room and sightline projects through open archway into Front Entry.", "range_px": 350, "spills_into": ["Front Entry"], "x": 175, "y": 530, "zones": ["living_room_couch", "living_room_floor", "living_room_bay_windows", "living_room_entry"]}, {"floor": "main", "fov_deg": 55, "heading_deg": 125, "host_room": "Dining Room", "id": "camera.dining_room", "name": "Dining Room Camera", "notes": "Covers Dining Room table and Riley's food area.", "range_px": 240, "spills_into": [], "x": 175, "y": 135, "zones": ["dining_room_table", "rileys_food"]}, {"floor": "main", "fov_deg": 75, "heading_deg": 210, "host_room": "Family Room", "id": "camera.family_room", "name": "Family Room Camera", "notes": "Catches Family Room, Kitchen Island, and pathway to Entryway, Basement, and Laundry.", "range_px": 420, "spills_into": ["Kitchen", "Front Entry"], "x": 830, "y": 135, "zones": ["family_room_couch", "family_room_recliner", "family_room_floor", "kitchen_island"]}, {"floor": "main", "fov_deg": 64, "heading_deg": 35, "host_room": "Garage", "id": "camera.garage", "name": "Garage Camera", "notes": "Covers Garage / Laundry parking bay.", "range_px": 230, "spills_into": [], "x": 580, "y": 530, "zones": ["garage_parking"]}, {"floor": "upstairs", "fov_deg": 80, "heading_deg": 70, "host_room": "Master Bedroom", "id": "camera.master_bedroom", "name": "Master Bedroom Camera", "notes": "Catches Master Bedroom plus entries to Upstairs Hallway and Master Bathroom/Closet.", "range_px": 480, "spills_into": ["Upstairs Hallway & Stairs", "Master Bathroom"], "x": 150, "y": 50, "zones": ["master_bed", "master_open_area", "master_bedroom_walkway", "master_bedroom_entryway", "master_bathroom"]}, {"floor": "upstairs", "fov_deg": 75, "heading_deg": 75, "host_room": "Margot's Room", "id": "camera.nursery", "name": "Nursery Camera", "notes": "Covers Nursery bed and partially sees doorway from Upstairs Hallway.", "range_px": 270, "spills_into": ["Upstairs Hallway & Stairs"], "x": 375, "y": 50, "zones": ["nursery_bed"]}, {"floor": "upstairs", "fov_deg": 80, "heading_deg": 215, "host_room": "Office", "id": "camera.office", "name": "Office Camera", "notes": "Covers Office desk/sim rig and sees Office doorway next to the stairs.", "range_px": 320, "spills_into": ["Upstairs Hallway & Stairs"], "x": 855, "y": 525, "zones": ["steves_desk", "sim_rig", "office_floor", "office_entryway"]}, {"floor": "basement", "fov_deg": 90, "heading_deg": 215, "host_room": "Basement Theater", "id": "camera.basement_theater", "name": "Basement Theater Camera", "notes": "Covers Theater, sees far Play Area/Bar, and partially catches Basement Stairs.", "range_px": 350, "spills_into": ["Basement Play Area"], "x": 765, "y": 520, "zones": ["basement_theater_couch", "basement_theater_playpen", "basement_theater_floor", "basement_bar", "basement_play_area_far", "basement_stairwell"]}, {"floor": "basement", "fov_deg": 85, "heading_deg": 40, "host_room": "Basement Play Area", "id": "camera.basement_play_area", "name": "Basement Play Area Camera", "notes": "Covers Play Area & Counter; sees into Theater. Storage Room & Basement Bath are out of frame on left.", "range_px": 480, "spills_into": ["Basement Theater"], "x": 235, "y": 520, "zones": ["basement_play_floor", "basement_counter", "theater_rear_view"]}, {"floor": "basement", "fov_deg": 75, "heading_deg": 125, "host_room": "Storage Room", "id": "camera.storage_room", "name": "Storage Room Camera", "notes": "Covers interior Storage Room / Gym floor.", "range_px": 170, "spills_into": [], "x": 650, "y": 55, "zones": ["storage_room_workout"]}], "canvas": {"height": 600, "width": 1000}, "connections": [{"from_room": "Front Entry", "id": "conn_entry_lr", "label": "Open Archway (Entry <-> Living Room)", "to_room": "Living Room", "type": "open_passage"}, {"from_room": "Front Entry", "id": "conn_entry_kitchen", "label": "Pathway (Entry <-> Kitchen)", "to_room": "Kitchen", "type": "open_passage"}, {"from_room": "Front Entry", "id": "conn_entry_fr", "label": "Pathway (Entry <-> Family/Laundry/Basement)", "to_room": "Family Room", "type": "open_passage"}, {"from_room": "Living Room", "id": "conn_lr_dr", "label": "Open Passage (Living <-> Dining)", "to_room": "Dining Room", "type": "open_passage"}, {"from_room": "Dining Room", "id": "conn_dr_kitchen", "label": "Open Passage (Dining <-> Kitchen)", "to_room": "Kitchen", "type": "open_passage"}, {"from_room": "Kitchen", "id": "conn_kitchen_fr", "label": "Open Concept (Kitchen <-> Family Room)", "to_room": "Family Room", "type": "open_passage"}, {"entity_id": "binary_sensor.utility_room_door", "from_room": "Family Room", "id": "conn_fr_garage", "label": "Laundry / Garage Pathway", "to_room": "Garage", "type": "unmonitored_door"}, {"from_room": "Front Entry", "id": "conn_entry_upstairs", "label": "Main Stairs to Upstairs", "to_room": "Upstairs Hallway & Stairs", "type": "stairs"}, {"from_room": "Family Room", "id": "conn_fr_basement_play", "label": "Basement Stairs", "to_room": "Basement Play Area", "type": "stairs"}, {"from_room": "Family Room", "id": "conn_fr_basement_theater", "label": "Basement Stairs (Partial Sightline)", "to_room": "Basement Theater", "type": "stairs"}, {"from_room": "Upstairs Hallway & Stairs", "id": "conn_hall_office", "label": "Office Doorway (Next to Stairs)", "to_room": "Office", "type": "unmonitored_door"}, {"from_room": "Upstairs Hallway & Stairs", "id": "conn_hall_guest", "label": "Guest Room Doorway (No Sensor)", "to_room": "Guest Room", "type": "unmonitored_door"}, {"from_room": "Upstairs Hallway & Stairs", "id": "conn_hall_nursery", "label": "Nursery Doorway (Seen Partially by Cam)", "to_room": "Margot's Room", "type": "unmonitored_door"}, {"from_room": "Upstairs Hallway & Stairs", "id": "conn_hall_master", "label": "Master Bedroom Entryway", "to_room": "Master Bedroom", "type": "unmonitored_door"}, {"from_room": "Master Bedroom", "id": "conn_master_bath", "label": "Master Bath / Shower Stall Entry", "to_room": "Master Bathroom", "type": "unmonitored_door"}, {"from_room": "Upstairs Hallway & Stairs", "id": "conn_hall_ubath", "label": "Shared Bathroom (Double Vanity & Tub)", "to_room": "Upstairs Bathroom", "type": "unmonitored_door"}, {"from_room": "Basement Play Area", "id": "conn_play_theater", "label": "Open Basement Divide (Play <-> Theater)", "to_room": "Basement Theater", "type": "open_passage"}, {"from_room": "Basement Play Area", "id": "conn_play_storage", "label": "Storage Room Door (No Sensor, Out of Frame Left)", "to_room": "Storage Room", "type": "unmonitored_door"}, {"from_room": "Basement Play Area", "id": "conn_play_bbath", "label": "Basement Bath Door (No Sensor, Out of Frame Left)", "to_room": "Basement Bathroom", "type": "unmonitored_door"}], "floors": [{"id": "upstairs", "name": "Upstairs Level", "order": 0}, {"id": "main", "name": "Main Floor", "order": 1}, {"id": "basement", "name": "Basement Level", "order": 2}], "rooms": [{"entryways": [{"id": "door_master_hallway", "offset": 230, "target_room": "Upstairs Hallway & Stairs", "type": "door", "wall": "right", "width": 40}, {"id": "door_master_bath", "offset": 360, "target_room": "Master Bathroom", "type": "door", "wall": "right", "width": 40}], "floor": "upstairs", "height": 505, "id": "master_bedroom", "name": "Master Bedroom", "notes": "West wing front-to-back. Camera catches bed, doorway to Upstairs Hallway, and entry to Master Bath / WIC.", "room_type": "room", "width": 225, "x": 135, "y": 35}, {"entryways": [{"id": "door_mbath_master", "offset": 15, "target_room": "Master Bedroom", "type": "door", "wall": "left", "width": 40}], "floor": "upstairs", "height": 160, "id": "master_bathroom", "name": "Master Bathroom", "notes": "En-suite bath next to WIC with single sink and shower stall; entry caught by master bedroom camera.", "room_type": "room", "width": 140, "x": 360, "y": 380}, {"entryways": [{"id": "door_ubath_hall", "offset": 35, "target_room": "Upstairs Hallway & Stairs", "type": "door", "wall": "top", "width": 36}], "floor": "upstairs", "height": 160, "id": "upstairs_bathroom", "name": "Upstairs Bathroom", "notes": "Shared upstairs bathroom with double vanity and soaking tub, opening off hallway.", "room_type": "room", "width": 110, "x": 500, "y": 380}, {"entryways": [{"id": "door_margot_hallway", "offset": 160, "target_room": "Upstairs Hallway & Stairs", "type": "door", "wall": "bottom", "width": 36}], "floor": "upstairs", "height": 215, "id": "margots_room", "name": "Margot's Room", "notes": "Top-middle bedroom; doorway opens to Upstairs Hallway.", "room_type": "room", "width": 250, "x": 360, "y": 35}, {"entryways": [{"id": "door_guest_hallway", "offset": 30, "target_room": "Upstairs Hallway & Stairs", "type": "door", "wall": "bottom", "width": 36}], "floor": "upstairs", "height": 215, "id": "guest_room", "name": "Guest Room", "notes": "Top-right bedroom; doorway opens to Upstairs Hallway.", "room_type": "room", "width": 260, "x": 610, "y": 35}, {"entryways": [{"id": "door_office_hallway", "offset": 20, "target_room": "Upstairs Hallway & Stairs", "type": "door", "wall": "left", "width": 40}], "floor": "upstairs", "height": 290, "id": "office", "name": "Office", "notes": "Bottom-right bedroom / office next to stairs landing; camera sees desk, rig, and doorway.", "room_type": "room", "width": 260, "x": 610, "y": 250}, {"entryways": [{"id": "door_hall_master", "offset": 15, "target_room": "Master Bedroom", "type": "door", "wall": "left", "width": 40}, {"id": "door_hall_margot", "offset": 160, "target_room": "Margot's Room", "type": "door", "wall": "top", "width": 36}, {"id": "door_hall_guest", "offset": 10, "target_room": "Guest Room", "type": "door", "wall": "right", "width": 36}, {"id": "door_hall_office", "offset": 20, "target_room": "Office", "type": "door", "wall": "right", "width": 40}, {"id": "passage_hall_stairs", "offset": 180, "target_room": "Front Entry", "type": "open_passage", "wall": "bottom", "width": 55}], "floor": "upstairs", "height": 130, "id": "upstairs_hallway", "name": "Upstairs Hallway & Stairs", "notes": "Connects Master Bedroom, Margot's Room, Guest Room, Office, Bathrooms, and Stairs to Front Entry.", "room_type": "transit", "width": 250, "x": 360, "y": 250}, {"entryways": [{"id": "arch_dr_kitchen", "offset": 20, "target_room": "Kitchen", "type": "open_passage", "wall": "right", "width": 160}, {"id": "arch_dr_lr", "offset": 20, "target_room": "Living Room", "type": "open_passage", "wall": "bottom", "width": 120}], "floor": "main", "height": 205, "id": "dining_room", "name": "Dining Room", "notes": "Northwest room opening to Kitchen and Living Room.", "room_type": "room", "width": 160, "x": 160, "y": 120}, {"entryways": [{"id": "arch_lr_dr", "offset": 20, "target_room": "Dining Room", "type": "open_passage", "wall": "top", "width": 120}, {"id": "arch_lr_entry", "offset": 30, "target_room": "Front Entry", "type": "open_passage", "wall": "right", "width": 130}], "floor": "main", "height": 220, "id": "living_room", "name": "Living Room", "notes": "Southwest room with front bay windows; opens to Dining Room and Front Entryway.", "room_type": "room", "width": 235, "x": 160, "y": 325}, {"entryways": [{"id": "arch_kitchen_dr", "offset": 20, "target_room": "Dining Room", "type": "open_passage", "wall": "left", "width": 160}, {"id": "arch_kitchen_fr", "offset": 20, "target_room": "Family Room", "type": "open_passage", "wall": "right", "width": 170}, {"id": "path_kitchen_entry", "offset": 75, "target_room": "Front Entry", "type": "open_passage", "wall": "bottom", "width": 100}], "floor": "main", "height": 205, "id": "kitchen", "name": "Kitchen", "notes": "Central kitchen with island counter and breakfast nook; open to Family Room, Dining Room, and Front Entry.", "room_type": "room", "width": 245, "x": 320, "y": 120}, {"entryways": [{"id": "arch_entry_lr", "offset": 30, "target_room": "Living Room", "type": "open_passage", "wall": "left", "width": 130}, {"id": "path_entry_kitchen", "offset": 0, "target_room": "Kitchen", "type": "open_passage", "wall": "top", "width": 100}, {"id": "path_entry_fr", "offset": 10, "target_room": "Family Room", "type": "open_passage", "wall": "right", "width": 60}, {"id": "door_front_entry", "offset": 60, "target_room": "Exterior", "type": "door", "wall": "bottom", "width": 45}], "floor": "main", "height": 220, "id": "front_entry", "name": "Front Entry", "notes": "Main foyer with front door, powder room, stairs up to Floor 3, and pathways to Living Room and Kitchen.", "room_type": "room", "width": 170, "x": 395, "y": 325}, {"entryways": [{"id": "arch_fr_kitchen", "offset": 20, "target_room": "Kitchen", "type": "open_passage", "wall": "left", "width": 170}, {"id": "path_fr_entry", "offset": 10, "target_room": "Front Entry", "type": "open_passage", "wall": "bottom", "width": 60}, {"id": "door_fr_laundry", "offset": 40, "target_room": "Garage", "type": "door", "wall": "bottom", "width": 40}], "floor": "main", "height": 250, "id": "family_room", "name": "Family Room", "notes": "East living area with north fireplace; open to Kitchen and connects to Laundry and Front Entry.", "room_type": "room", "width": 280, "x": 565, "y": 120}, {"entryways": [{"id": "door_garage_fr", "offset": 40, "target_room": "Family Room", "type": "door", "wall": "top", "width": 40}], "floor": "main", "height": 175, "id": "garage", "name": "Garage", "notes": "Includes laundry room and garage entry walkway connecting off Family Room.", "room_type": "room", "width": 280, "x": 565, "y": 370}, {"entryways": [{"id": "door_play_storage", "offset": 40, "target_room": "Storage Room", "type": "door", "wall": "right", "width": 40}, {"id": "door_play_bbath", "offset": 235, "target_room": "Basement Bathroom", "type": "door", "wall": "right", "width": 36}, {"id": "arch_play_theater", "offset": 375, "target_room": "Basement Theater", "type": "open_passage", "wall": "right", "width": 110}], "floor": "basement", "height": 495, "id": "basement_play_area", "name": "Basement Play Area", "notes": "Main basement recreation room with west fireplace and south alcoves; connects to Storage and Theater.", "room_type": "room", "width": 415, "x": 220, "y": 40}, {"entryways": [{"id": "door_storage_play", "offset": 40, "target_room": "Basement Play Area", "type": "door", "wall": "left", "width": 40}], "floor": "basement", "height": 185, "id": "storage_room", "name": "Storage Room", "notes": "Upper northeast wet bar / storage area; door connects to Recreation Room.", "room_type": "room", "width": 145, "x": 635, "y": 40}, {"entryways": [{"id": "door_bbath_play", "offset": 10, "target_room": "Basement Play Area", "type": "door", "wall": "left", "width": 36}], "floor": "basement", "height": 145, "id": "basement_bathroom", "name": "Basement Bathroom", "notes": "Full basement bathroom off recreation hallway.", "room_type": "transit", "width": 145, "x": 635, "y": 225}, {"entryways": [{"id": "arch_theater_play", "offset": 5, "target_room": "Basement Play Area", "type": "open_passage", "wall": "left", "width": 110}], "floor": "basement", "height": 165, "id": "basement_theater", "name": "Basement Theater", "notes": "Lower northeast basement hallway / media lounge and stair exit.", "room_type": "room", "width": 145, "x": 635, "y": 370}], "version": 2}, "connected_rooms_map": {"Master Bedroom": ["Front Entry", "Guest Room", "Margot's Room", "Master Bathroom", "Office", "Upstairs Bathroom"], "Master Bathroom": ["Master Bedroom"], "Upstairs Bathroom": ["Front Entry", "Guest Room", "Margot's Room", "Master Bedroom", "Office"], "Margot's Room": ["Front Entry", "Guest Room", "Master Bedroom", "Office", "Upstairs Bathroom"], "Guest Room": ["Front Entry", "Margot's Room", "Master Bedroom", "Office", "Upstairs Bathroom"], "Office": ["Front Entry", "Guest Room", "Margot's Room", "Master Bedroom", "Upstairs Bathroom"], "Dining Room": ["Kitchen", "Living Room"], "Living Room": ["Dining Room", "Front Entry"], "Kitchen": ["Dining Room", "Family Room", "Front Entry"], "Front Entry": ["Family Room", "Guest Room", "Kitchen", "Living Room", "Margot's Room", "Master Bedroom", "Office", "Upstairs Bathroom"], "Family Room": ["Basement Play Area", "Basement Theater", "Front Entry", "Garage", "Kitchen"], "Garage": ["Family Room"], "Basement Play Area": ["Basement Theater", "Family Room", "Storage Room"], "Storage Room": ["Basement Play Area"], "Basement Theater": ["Basement Play Area", "Family Room"]}, "seal_analysis": {"Master Bedroom": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)", "Master Bathroom (unmonitored door)"]}, "Master Bathroom": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Master Bedroom (unmonitored door)"]}, "Upstairs Bathroom": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)"]}, "Margot's Room": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)"]}, "Guest Room": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)"]}, "Office": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)"]}, "Dining Room": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Living Room (open passage)", "Kitchen (open passage)"]}, "Living Room": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Front Entry (open passage)", "Dining Room (open passage)"]}, "Kitchen": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Front Entry (open passage)", "Dining Room (open passage)", "Family Room (open passage)"]}, "Front Entry": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Living Room (open passage)", "Kitchen (open passage)", "Family Room (open passage)", "Upstairs Hallway & Stairs (stairs)"]}, "Family Room": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Front Entry (open passage)", "Kitchen (open passage)", "Garage (unmonitored door)", "Basement Play Area (stairs)", "Basement Theater (stairs)"]}, "Garage": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Family Room (unmonitored door)"]}, "Basement Play Area": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Family Room (stairs)", "Basement Theater (open passage)", "Storage Room (unmonitored door)", "Basement Bathroom (unmonitored door)"]}, "Storage Room": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Basement Play Area (unmonitored door)"]}, "Basement Theater": {"can_be_bounded": false, "recommended_mode": "open", "monitored_doors": [], "unsealed_exits": ["Family Room (stairs)", "Basement Play Area (open passage)"]}}, "camera_analysis": [{"camera_id": "camera.living_room", "name": "Living Room Camera", "host_room": "Living Room", "floor": "main", "zones": ["living_room_couch", "living_room_floor", "living_room_bay_windows", "living_room_entry"], "spillover_targets": [{"room_name": "Front Entry", "overlap_pct": 18.0}], "has_multi_room_bleed": true, "visibility_polygon": [[175.0, 530.0], [513.85, 442.37], [516.0, 451.13], [517.88, 459.74], [395.0, 485.0], [395.0, 485.06], [395.0, 485.08], [395.0, 490.94], [395.0, 496.76], [395.0, 502.54], [395.0, 508.29], [395.0, 514.0], [395.0, 519.7], [395.0, 525.37], [395.0, 531.05], [395.0, 536.72], [395.0, 538.38], [395.0, 538.46], [395.0, 538.54], [395.0, 540.08], [395.0, 540.15], [395.0, 540.23], [395.0, 541.71], [395.0, 541.79], [395.0, 541.86], [395.0, 542.41], [395.0, 544.92], [395.0, 545.0], [393.87, 545.0], [357.27, 545.0], [313.49, 545.0], [286.54, 545.0], [268.27, 545.0], [255.05, 545.0], [245.02, 545.0], [237.15, 545.0], [230.8, 545.0], [225.57, 545.0], [221.17, 545.0], [217.41, 545.0], [214.17, 545.0], [211.34, 545.0], [208.83, 545.0], [206.61, 545.0], [204.61, 545.0], [202.81, 545.0], [201.17, 545.0], [199.68, 545.0], [198.3, 545.0], [197.03, 545.0], [195.85, 545.0], [194.76, 545.0], [193.74, 545.0], [192.78, 545.0], [191.87, 545.0], [191.02, 545.0], [190.22, 545.0], [189.45, 545.0], [188.72, 545.0], [188.03, 545.0], [187.37, 545.0]]}, {"camera_id": "camera.dining_room", "name": "Dining Room Camera", "host_room": "Dining Room", "floor": "main", "zones": ["dining_room_table", "rileys_food"], "spillover_targets": [], "has_multi_room_bleed": false, "visibility_polygon": [[175.0, 135.0], [160.0, 248.94], [160.0, 229.85], [160.0, 216.15], [160.0, 205.82], [160.0, 197.74], [160.0, 191.25], [160.0, 185.9], [160.0, 181.43], [160.0, 177.61], [160.0, 174.33], [160.0, 171.46], [160.0, 168.93], [160.0, 166.68], [160.0, 164.66], [160.0, 162.85], [160.0, 161.19], [160.0, 159.69], [160.0, 158.3], [160.0, 157.02], [160.0, 155.84], [160.0, 154.74], [160.0, 153.71], [160.0, 152.75], [160.0, 151.84], [160.0, 150.99], [160.0, 150.18], [160.0, 149.41], [160.0, 148.68], [160.0, 147.98], [160.0, 147.32], [160.0, 146.68], [160.0, 146.07], [160.0, 145.48], [160.0, 144.91], [160.0, 144.36], [160.0, 143.83], [160.0, 143.31], [160.0, 142.81]]}, {"camera_id": "camera.family_room", "name": "Family Room Camera", "host_room": "Family Room", "floor": "main", "zones": ["family_room_couch", "family_room_recliner", "family_room_floor", "kitchen_island"], "spillover_targets": [{"room_name": "Kitchen", "overlap_pct": 18.0}, {"room_name": "Front Entry", "overlap_pct": 18.0}], "has_multi_room_bleed": true, "visibility_polygon": [[830.0, 135.0], [413.59, 189.82], [412.3, 178.9], [411.29, 167.95], [410.58, 156.98], [410.14, 145.99], [410.08, 143.07], [565.0, 140.0], [565.0, 139.91], [565.0, 137.69], [565.0, 137.6], [565.0, 137.51], [565.0, 135.0], [565.0, 128.06], [565.0, 127.3], [565.0, 127.21], [565.0, 127.11], [565.0, 121.11], [565.0, 120.09], [565.0, 120.0], [566.63, 120.0], [639.41, 120.0], [687.28, 120.0], [716.06, 120.0], [735.29, 120.0], [749.07, 120.0], [759.43, 120.0], [767.52, 120.0], [774.02, 120.0], [779.36, 120.0], [783.83, 120.0], [787.64, 120.0], [790.92, 120.0], [793.79, 120.0], [796.31, 120.0], [798.55, 120.0], [800.56, 120.0], [802.37, 120.0], [804.02, 120.0], [805.52, 120.0], [806.9, 120.0], [808.17, 120.0], [809.35, 120.0], [810.45, 120.0], [811.48, 120.0], [812.44, 120.0], [813.34, 120.0], [814.19, 120.0], [815.0, 120.0], [815.77, 120.0], [816.49, 120.0], [817.19, 120.0], [817.85, 120.0], [818.49, 120.0], [819.1, 120.0], [819.69, 120.0], [820.26, 120.0], [820.81, 120.0], [821.34, 120.0], [821.86, 120.0], [822.36, 120.0], [822.85, 120.0], [823.32, 120.0], [823.79, 120.0]]}, {"camera_id": "camera.garage", "name": "Garage Camera", "host_room": "Garage", "floor": "main", "zones": ["garage_parking"], "spillover_targets": [], "has_multi_room_bleed": false, "visibility_polygon": [[580.0, 530.0], [809.68, 542.04], [809.64, 542.92], [809.63, 543.0], [809.63, 543.08], [771.09, 545.0], [723.28, 545.0], [694.48, 545.0], [675.21, 545.0], [661.39, 545.0], [650.99, 545.0], [642.87, 545.0], [636.35, 545.0], [630.98, 545.0], [626.49, 545.0], [622.66, 545.0], [619.36, 545.0], [616.49, 545.0], [613.95, 545.0], [611.7, 545.0], [609.68, 545.0], [607.86, 545.0], [606.2, 545.0], [604.69, 545.0], [603.3, 545.0], [602.03, 545.0], [600.84, 545.0], [599.74, 545.0], [598.71, 545.0], [597.74, 545.0], [596.84, 545.0], [595.98, 545.0], [595.17, 545.0], [594.4, 545.0], [593.67, 545.0], [592.98, 545.0], [592.31, 545.0], [591.67, 545.0], [591.06, 545.0], [590.47, 545.0], [589.9, 545.0], [589.35, 545.0], [588.82, 545.0], [588.3, 545.0], [587.8, 545.0], [587.31, 545.0], [586.83, 545.0], [586.37, 545.0]]}, {"camera_id": "camera.master_bedroom", "name": "Master Bedroom Camera", "host_room": "Master Bedroom", "floor": "upstairs", "zones": ["master_bed", "master_open_area", "master_bedroom_walkway", "master_bedroom_entryway", "master_bathroom"], "spillover_targets": [{"room_name": "Master Bathroom", "overlap_pct": 18.0}, {"room_name": "Upstairs Hallway & Stairs", "overlap_pct": 18.0}], "has_multi_room_bleed": true, "visibility_polygon": [[150.0, 50.0], [360.0, 171.24], [360.0, 178.59], [360.0, 186.18], [360.0, 194.03], [360.0, 200.54], [360.0, 200.65], [360.0, 200.76], [360.0, 202.16], [360.0, 205.62], [360.0, 205.73], [360.0, 205.84], [360.0, 210.6], [360.0, 214.49], [360.0, 214.61], [360.0, 214.73], [360.0, 219.38], [360.0, 227.57], [360.0, 227.69], [360.0, 227.82], [360.0, 228.54], [360.0, 229.87], [360.0, 230.0], [360.0, 230.13], [360.0, 238.1], [360.0, 247.86], [360.0, 248.0], [360.0, 248.12], [360.0, 248.14], [360.0, 249.86], [360.0, 250.0], [360.0, 250.14], [360.0, 258.65], [360.0, 264.85], [360.0, 265.0], [472.1, 380.0], [465.4, 380.0], [460.01, 380.0], [459.8, 380.0], [459.58, 380.0], [449.46, 380.0], [434.25, 380.0], [421.96, 380.0], [360.0, 305.0], [360.0, 305.18], [360.0, 306.94], [360.0, 320.95], [360.0, 335.92], [360.0, 343.78], [360.0, 344.0], [360.0, 344.22], [360.0, 351.98], [360.0, 369.29], [360.0, 379.75], [360.0, 380.0], [360.0, 380.25], [360.0, 388.01], [360.0, 394.73], [360.0, 395.0], [399.43, 460.1], [392.68, 464.13], [381.89, 470.27], [380.0, 471.31], [360.0, 435.0], [360.0, 435.32], [360.0, 455.0], [359.86, 481.69], [348.63, 486.97], [339.24, 491.12], [339.08, 491.19], [338.93, 491.26], [337.27, 491.96], [325.78, 496.66], [314.17, 501.05], [302.45, 505.15], [290.63, 508.94], [278.72, 512.42], [266.72, 515.59], [254.65, 518.45], [242.5, 521.0], [230.29, 523.24], [218.03, 525.15], [205.72, 526.75], [193.38, 528.04], [181.01, 529.0], [168.61, 529.64], [156.21, 529.96], [143.79, 529.96], [135.48, 529.78], [135.31, 529.78], [135.15, 529.77], [135.0, 436.56], [135.0, 281.72], [135.0, 215.3], [135.0, 178.33], [135.0, 154.76], [135.0, 138.41], [135.0, 126.38], [135.0, 117.15], [135.0, 109.83], [135.0, 103.89], [135.0, 98.95], [135.0, 94.78], [135.0, 91.21]]}, {"camera_id": "camera.nursery", "name": "Nursery Camera", "host_room": "Margot's Room", "floor": "upstairs", "zones": ["nursery_bed"], "spillover_targets": [{"room_name": "Upstairs Hallway & Stairs", "overlap_pct": 18.0}], "has_multi_room_bleed": true, "visibility_polygon": [[375.0, 50.0], [589.21, 214.37], [584.83, 219.92], [580.68, 224.92], [580.62, 224.99], [580.55, 225.06], [580.31, 225.35], [576.39, 229.84], [576.33, 229.91], [576.26, 229.98], [575.65, 230.67], [572.17, 234.46], [572.11, 234.52], [572.04, 234.59], [570.85, 235.86], [565.92, 240.92], [560.86, 245.85], [556.13, 250.0], [556.0, 250.0], [556.12, 250.24], [556.1, 250.25], [556.05, 250.31], [555.98, 250.37], [555.67, 250.65], [550.35, 255.31], [544.92, 259.83], [539.37, 264.21], [533.7, 268.43], [533.56, 268.54], [520.0, 250.0], [519.89, 250.0], [512.46, 250.0], [508.43, 250.0], [508.33, 250.0], [508.23, 250.0], [504.88, 250.0], [497.56, 250.0], [493.88, 250.0], [493.79, 250.0], [493.69, 250.0], [490.47, 250.0], [483.59, 250.0], [476.91, 250.0], [475.09, 250.0], [475.0, 250.0], [474.91, 250.0], [472.06, 250.0], [471.97, 250.0], [471.88, 250.0], [470.4, 250.0], [464.05, 250.0], [457.84, 250.0], [451.77, 250.0], [450.84, 250.0], [450.76, 250.0], [450.68, 250.0], [445.82, 250.0], [439.98, 250.0], [434.24, 250.0], [428.59, 250.0], [423.02, 250.0], [417.51, 250.0], [412.07, 250.0], [406.68, 250.0], [401.33, 250.0], [396.02, 250.0], [390.74, 250.0], [385.48, 250.0], [380.24, 250.0], [375.0, 250.0], [369.76, 250.0], [367.28, 250.0], [367.21, 250.0], [367.14, 250.0], [366.37, 250.0], [366.3, 250.0], [366.23, 250.0], [365.98, 250.0], [365.91, 250.0], [365.84, 250.0], [364.52, 250.0], [363.31, 250.0], [363.24, 250.0], [363.17, 250.0], [361.12, 250.0], [361.05, 250.0], [360.98, 250.0], [360.07, 250.0], [360.0, 250.0], [360.0, 249.07], [360.0, 240.59], [360.0, 192.72], [360.0, 163.94], [360.0, 144.71], [360.0, 130.93], [360.0, 120.57], [360.0, 112.48], [360.0, 105.98], [360.0, 100.64], [360.0, 96.17], [360.0, 92.36], [360.0, 89.08], [360.0, 86.21]]}, {"camera_id": "camera.office", "name": "Office Camera", "host_room": "Office", "floor": "upstairs", "zones": ["steves_desk", "sim_rig", "office_floor", "office_entryway"], "spillover_targets": [{"room_name": "Upstairs Hallway & Stairs", "overlap_pct": 18.0}], "has_multi_room_bleed": true, "visibility_polygon": [[855.0, 525.0], [683.55, 540.0], [611.39, 540.0], [611.04, 540.0], [610.0, 540.0], [610.0, 539.91], [610.0, 535.44], [610.0, 535.35], [610.0, 535.27], [610.0, 533.71], [610.0, 527.38], [610.0, 521.04], [610.0, 514.7], [610.0, 508.35], [610.0, 501.97], [610.0, 495.56], [610.0, 489.11], [610.0, 482.62], [610.0, 476.06], [610.0, 469.44], [610.0, 462.74], [610.0, 455.95], [610.0, 449.06], [610.0, 442.05], [610.0, 434.93], [610.0, 427.67], [610.0, 425.03], [610.0, 424.93], [610.0, 424.83], [610.0, 420.26], [610.0, 414.09], [610.0, 413.98], [610.0, 413.88], [610.0, 412.68], [610.0, 412.33], [610.0, 412.22], [610.0, 412.12], [610.0, 404.92], [610.0, 400.02], [610.0, 399.91], [610.0, 399.8], [610.0, 396.96], [610.0, 388.78], [610.0, 388.48], [610.0, 388.37], [610.0, 388.25], [610.0, 380.36], [610.0, 380.12], [610.0, 380.0], [610.0, 379.88], [610.0, 371.69], [610.0, 362.72], [610.0, 353.45], [610.0, 343.83], [610.0, 333.84], [610.0, 324.02], [610.0, 323.88], [610.0, 323.74], [610.0, 323.44], [613.22, 315.37], [614.41, 314.02], [614.48, 313.93], [614.55, 313.85], [618.72, 309.19], [619.4, 308.46], [619.47, 308.38], [619.55, 308.29], [624.38, 303.16], [630.19, 297.27], [633.22, 294.32], [633.3, 294.25], [633.38, 294.17], [636.16, 291.53], [637.68, 290.11], [637.77, 290.03], [637.85, 289.96], [642.05, 286.14], [642.13, 286.07], [642.22, 285.99], [642.27, 285.95], [648.52, 280.53], [654.91, 275.28], [657.82, 272.97], [657.91, 272.9], [657.99, 272.83], [661.43, 270.19], [668.08, 265.27], [674.86, 260.52], [680.34, 256.87], [680.43, 256.81], [680.53, 256.75], [681.76, 255.95], [688.77, 251.56], [697.41, 250.0], [706.72, 250.0], [715.77, 250.0], [724.59, 250.0], [733.2, 250.0], [741.61, 250.0], [749.85, 250.0], [757.92, 250.0], [765.84, 250.0], [773.64, 250.0], [781.31, 250.0]]}, {"camera_id": "camera.basement_theater", "name": "Basement Theater Camera", "host_room": "Basement Theater", "floor": "basement", "zones": ["basement_theater_couch", "basement_theater_playpen", "basement_theater_floor", "basement_bar", "basement_play_area_far", "basement_stairwell"], "spillover_targets": [{"room_name": "Basement Play Area", "overlap_pct": 18.0}], "has_multi_room_bleed": true, "visibility_polygon": [[765.0, 520.0], [679.93, 535.0], [664.63, 535.0], [642.83, 535.0], [635.4, 535.0], [635.0, 535.0], [635.0, 534.95], [635.0, 532.52], [635.0, 529.09], [635.0, 525.68], [635.0, 525.05], [635.0, 525.0], [635.0, 524.95], [635.0, 522.27], [635.0, 518.87], [635.0, 515.46], [635.0, 512.05], [635.0, 508.63], [635.0, 505.19], [635.0, 501.73], [635.0, 498.25], [635.0, 494.73], [635.0, 491.18], [635.0, 487.59], [635.0, 485.05], [635.0, 485.0], [427.07, 428.89], [427.73, 426.47], [430.29, 417.67], [433.09, 408.94], [436.11, 400.29], [439.35, 391.72], [442.82, 383.24], [446.51, 374.86], [450.42, 366.57], [454.55, 358.39], [458.88, 350.32], [463.43, 342.36], [468.18, 334.53], [473.14, 326.82], [478.3, 319.25], [483.65, 311.81], [489.2, 304.52], [492.64, 300.18], [635.0, 415.0], [635.0, 414.93], [635.0, 412.84], [635.0, 406.99], [635.0, 400.88], [635.0, 394.46], [635.0, 387.71], [635.0, 380.59], [635.0, 375.1], [635.0, 375.0], [635.0, 374.9], [635.0, 373.06], [635.0, 370.11], [635.0, 370.0], [635.09, 370.0], [639.14, 370.0], [645.68, 370.0], [651.97, 370.0], [658.01, 370.0], [663.82, 370.0], [669.44, 370.0], [671.63, 370.0], [671.7, 370.0], [671.77, 370.0], [674.87, 370.0], [680.13, 370.0], [685.24, 370.0], [685.34, 370.0], [685.41, 370.0], [685.48, 370.0], [686.62, 370.0], [686.69, 370.0], [686.75, 370.0], [690.21, 370.0], [695.05, 370.0], [696.52, 370.0], [696.58, 370.0], [696.64, 370.0], [698.84, 370.0], [698.9, 370.0], [698.96, 370.0], [699.78, 370.0], [704.4, 370.0], [708.92, 370.0], [713.35, 370.0], [716.19, 370.0], [716.25, 370.0], [716.31, 370.0], [717.71, 370.0], [720.62, 370.0], [720.68, 370.0], [720.74, 370.0], [721.99, 370.0], [724.32, 370.0], [724.37, 370.0], [724.43, 370.0], [726.21, 370.0], [730.37, 370.0], [734.48, 370.0], [738.55, 370.0]]}, {"camera_id": "camera.basement_play_area", "name": "Basement Play Area Camera", "host_room": "Basement Play Area", "floor": "basement", "zones": ["basement_play_floor", "basement_counter", "theater_rear_view"], "spillover_targets": [{"room_name": "Basement Theater", "overlap_pct": 18.0}], "has_multi_room_bleed": true, "visibility_polygon": [[235.0, 520.0], [635.0, 502.54], [635.0, 512.96], [635.0, 523.37], [635.0, 524.86], [635.0, 525.0], [635.0, 525.14], [635.0, 530.87], [635.0, 531.01], [635.0, 531.15], [635.0, 533.78], [635.0, 534.86], [635.0, 535.0], [631.3, 535.0], [482.74, 535.0], [407.98, 535.0], [367.74, 535.0], [342.57, 535.0], [325.32, 535.0], [312.74, 535.0], [303.15, 535.0], [295.6, 535.0], [289.48, 535.0], [284.41, 535.0], [280.15, 535.0], [276.51, 535.0], [273.36, 535.0], [270.6, 535.0], [268.16, 535.0], [265.98, 535.0], [264.03, 535.0], [262.27, 535.0], [260.66, 535.0], [259.19, 535.0], [257.84, 535.0], [256.6, 535.0], [255.44, 535.0], [254.36, 535.0], [253.36, 535.0], [252.41, 535.0], [251.52, 535.0], [250.68, 535.0], [249.89, 535.0], [249.13, 535.0], [248.41, 535.0], [247.72, 535.0], [247.07, 535.0], [246.44, 535.0], [245.83, 535.0], [245.25, 535.0], [244.69, 535.0], [244.14, 535.0], [243.61, 535.0], [243.1, 535.0], [242.61, 535.0], [242.12, 535.0], [241.65, 535.0], [241.19, 535.0], [240.73, 535.0], [240.29, 535.0], [239.86, 535.0], [239.43, 535.0], [239.01, 535.0], [238.59, 535.0], [238.18, 535.0], [237.78, 535.0], [237.37, 535.0], [236.97, 535.0]]}, {"camera_id": "camera.storage_room", "name": "Storage Room Camera", "host_room": "Storage Room", "floor": "basement", "zones": ["storage_room_workout"], "spillover_targets": [], "has_multi_room_bleed": false, "visibility_polygon": [[650.0, 55.0], [657.42, 224.84], [652.97, 224.97], [648.52, 224.99], [644.07, 224.9], [639.62, 224.68], [638.5, 224.61], [638.44, 224.61], [638.38, 224.6], [638.28, 224.6], [638.22, 224.59], [638.16, 224.59], [635.94, 224.42], [635.88, 224.41], [635.82, 224.41], [635.18, 224.35], [635.12, 224.35], [635.06, 224.34], [635.0, 224.32], [635.0, 186.65], [635.0, 161.73], [635.0, 144.64], [635.0, 132.17], [635.0, 122.66], [635.0, 120.1], [635.0, 120.0], [611.72, 220.63], [608.87, 219.95], [604.57, 218.82], [600.3, 217.57], [596.06, 216.22], [591.86, 214.75], [587.69, 213.17], [583.58, 211.49], [579.5, 209.69], [575.48, 207.79], [571.5, 205.79], [567.58, 203.69], [563.72, 201.48], [562.59, 200.8], [635.0, 80.0], [635.0, 79.98], [635.0, 79.01], [635.0, 77.66], [635.0, 76.42], [635.0, 75.27], [635.0, 74.2], [635.0, 73.2], [635.0, 72.26], [635.0, 71.37], [635.0, 70.53], [635.0, 69.74], [635.0, 68.99], [635.0, 68.27], [635.0, 67.59], [635.0, 66.93], [635.0, 66.3], [635.0, 65.7], [635.0, 65.12], [635.0, 64.56], [635.0, 64.01], [635.0, 63.49], [635.0, 62.98], [635.0, 62.48], [635.0, 61.99], [635.0, 61.52], [635.0, 61.06], [635.0, 60.61], [635.0, 60.16], [635.0, 59.73]]}], "room_coverage": {"Master Bedroom": {"primary_cameras": [{"camera_id": "camera.master_bedroom", "coverage_pct": 80.0}], "spillover_cameras": [], "max_coverage_pct": 80.0}, "Master Bathroom": {"primary_cameras": [], "spillover_cameras": [{"camera_id": "camera.master_bedroom", "host_room": "Master Bedroom", "overlap_pct": 18.0}], "max_coverage_pct": 18.0}, "Upstairs Bathroom": {"primary_cameras": [], "spillover_cameras": [], "max_coverage_pct": 0.0}, "Margot's Room": {"primary_cameras": [{"camera_id": "camera.nursery", "coverage_pct": 65.0}], "spillover_cameras": [], "max_coverage_pct": 65.0}, "Guest Room": {"primary_cameras": [], "spillover_cameras": [], "max_coverage_pct": 0.0}, "Office": {"primary_cameras": [{"camera_id": "camera.office", "coverage_pct": 78.0}], "spillover_cameras": [], "max_coverage_pct": 78.0}, "Upstairs Hallway & Stairs": {"primary_cameras": [], "spillover_cameras": [{"camera_id": "camera.master_bedroom", "host_room": "Master Bedroom", "overlap_pct": 18.0}, {"camera_id": "camera.nursery", "host_room": "Margot's Room", "overlap_pct": 18.0}, {"camera_id": "camera.office", "host_room": "Office", "overlap_pct": 18.0}], "max_coverage_pct": 18.0}, "Dining Room": {"primary_cameras": [{"camera_id": "camera.dining_room", "coverage_pct": 65.0}], "spillover_cameras": [], "max_coverage_pct": 65.0}, "Living Room": {"primary_cameras": [{"camera_id": "camera.living_room", "coverage_pct": 65.0}], "spillover_cameras": [], "max_coverage_pct": 65.0}, "Kitchen": {"primary_cameras": [], "spillover_cameras": [{"camera_id": "camera.family_room", "host_room": "Family Room", "overlap_pct": 18.0}], "max_coverage_pct": 18.0}, "Front Entry": {"primary_cameras": [], "spillover_cameras": [{"camera_id": "camera.living_room", "host_room": "Living Room", "overlap_pct": 18.0}, {"camera_id": "camera.family_room", "host_room": "Family Room", "overlap_pct": 18.0}], "max_coverage_pct": 18.0}, "Family Room": {"primary_cameras": [{"camera_id": "camera.family_room", "coverage_pct": 65.0}], "spillover_cameras": [], "max_coverage_pct": 65.0}, "Garage": {"primary_cameras": [{"camera_id": "camera.garage", "coverage_pct": 65.0}], "spillover_cameras": [], "max_coverage_pct": 65.0}, "Basement Play Area": {"primary_cameras": [{"camera_id": "camera.basement_play_area", "coverage_pct": 65.0}], "spillover_cameras": [{"camera_id": "camera.basement_theater", "host_room": "Basement Theater", "overlap_pct": 18.0}], "max_coverage_pct": 65.0}, "Storage Room": {"primary_cameras": [{"camera_id": "camera.storage_room", "coverage_pct": 65.0}], "spillover_cameras": [], "max_coverage_pct": 65.0}, "Basement Bathroom": {"primary_cameras": [], "spillover_cameras": [], "max_coverage_pct": 0.0}, "Basement Theater": {"primary_cameras": [{"camera_id": "camera.basement_theater", "coverage_pct": 78.0}], "spillover_cameras": [{"camera_id": "camera.basement_play_area", "host_room": "Basement Play Area", "overlap_pct": 18.0}], "max_coverage_pct": 78.0}}, "ambiguities": [{"severity": "high", "category": "camera_spillover", "title": "Living Room Camera cone spills into Front Entry", "rooms": ["Living Room", "Front Entry"], "camera_id": "camera.living_room", "description": "`camera.living_room` (hosted in Living Room) also sees Front Entry. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Living Room occupied.", "resolution": "Downgrade binary_sensor.living_room_person_occupancy to `supporting` and trigger Living Room only from interior Frigate sub-zones."}, {"severity": "high", "category": "camera_spillover", "title": "Family Room Camera cone spills into Kitchen, Front Entry", "rooms": ["Family Room", "Kitchen", "Front Entry"], "camera_id": "camera.family_room", "description": "`camera.family_room` (hosted in Family Room) also sees Kitchen, Front Entry. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Family Room occupied.", "resolution": "Downgrade binary_sensor.family_room_person_occupancy to `supporting` and trigger Family Room only from interior Frigate sub-zones."}, {"severity": "high", "category": "camera_spillover", "title": "Master Bedroom Camera cone spills into Master Bathroom, Upstairs Hallway & Stairs", "rooms": ["Master Bedroom", "Master Bathroom", "Upstairs Hallway & Stairs"], "camera_id": "camera.master_bedroom", "description": "`camera.master_bedroom` (hosted in Master Bedroom) also sees Master Bathroom, Upstairs Hallway & Stairs. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Master Bedroom occupied.", "resolution": "Downgrade binary_sensor.master_bedroom_person_occupancy, binary_sensor.master_bedroom_entryway_person_occupancy to `supporting` and trigger Master Bedroom only from interior Frigate sub-zones."}, {"severity": "high", "category": "camera_spillover", "title": "Nursery Camera cone spills into Upstairs Hallway & Stairs", "rooms": ["Margot's Room", "Upstairs Hallway & Stairs"], "camera_id": "camera.nursery", "description": "`camera.nursery` (hosted in Margot's Room) also sees Upstairs Hallway & Stairs. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Margot's Room occupied.", "resolution": "Downgrade binary_sensor.nursery_person_occupancy to `supporting` and trigger Margot's Room only from interior Frigate sub-zones."}, {"severity": "high", "category": "camera_spillover", "title": "Office Camera cone spills into Upstairs Hallway & Stairs", "rooms": ["Office", "Upstairs Hallway & Stairs"], "camera_id": "camera.office", "description": "`camera.office` (hosted in Office) also sees Upstairs Hallway & Stairs. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Office occupied.", "resolution": "Downgrade binary_sensor.office_person_occupancy, binary_sensor.office_entryway_person_occupancy to `supporting` and trigger Office only from interior Frigate sub-zones."}, {"severity": "high", "category": "camera_spillover", "title": "Basement Theater Camera cone spills into Basement Play Area", "rooms": ["Basement Theater", "Basement Play Area"], "camera_id": "camera.basement_theater", "description": "`camera.basement_theater` (hosted in Basement Theater) also sees Basement Play Area. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Basement Theater occupied.", "resolution": "Downgrade binary_sensor.basement_theater_person_occupancy, binary_sensor.basement_stairwell_person_occupancy to `supporting` and trigger Basement Theater only from interior Frigate sub-zones."}, {"severity": "high", "category": "camera_spillover", "title": "Basement Play Area Camera cone spills into Basement Theater", "rooms": ["Basement Play Area", "Basement Theater"], "camera_id": "camera.basement_play_area", "description": "`camera.basement_play_area` (hosted in Basement Play Area) also sees Basement Theater. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Basement Play Area occupied.", "resolution": "Downgrade binary_sensor.basement_play_area_person_occupancy, binary_sensor.basement_stairwell_person_occupancy to `supporting` and trigger Basement Play Area only from interior Frigate sub-zones."}, {"severity": "medium", "category": "blind_pocket", "title": "Guest Room (between Nursery & Office) has zero camera coverage", "rooms": ["Guest Room", "Margot's Room", "Office"], "camera_id": null, "description": "Guest Room sits between Margot's Room and Office off the Upstairs Hallway with no camera view cone and its Ecobee sensor awaiting battery replacement.", "resolution": "Use `guest_room_motion` (moderate) + `guest_room_occupancy` (supporting) + BLE corroboration, with instant timer hand-off to Office, Nursery, and Master Bedroom."}, {"severity": "low", "category": "blind_pocket", "title": "Basement Bathroom is out of frame left of Play Area camera", "rooms": ["Basement Play Area", "Storage Room"], "camera_id": "camera.basement_play_area", "description": "Located to the left of `camera.basement_play_area` alongside Storage Room, with an unmonitored door and no interior sensors.", "resolution": "Treat left edge exit from Basement Play Area as an unsealed transition; Storage Room uses its internal `camera.storage_room` to distinguish gym/storage entry."}, {"severity": "medium", "category": "vertical_ble_bleed", "title": "Vertical BLE stack: Master Bedroom directly above Dining Room (100% overlap)", "rooms": ["Master Bedroom", "Dining Room"], "camera_id": null, "description": "Master Bedroom (Upstairs) sits directly over Dining Room (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.", "resolution": "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor."}, {"severity": "medium", "category": "vertical_ble_bleed", "title": "Vertical BLE stack: Master Bedroom directly above Living Room (83% overlap)", "rooms": ["Master Bedroom", "Living Room"], "camera_id": null, "description": "Master Bedroom (Upstairs) sits directly over Living Room (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.", "resolution": "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor."}, {"severity": "medium", "category": "vertical_ble_bleed", "title": "Vertical BLE stack: Master Bathroom directly above Front Entry (75% overlap)", "rooms": ["Master Bathroom", "Front Entry"], "camera_id": null, "description": "Master Bathroom (Upstairs) sits directly over Front Entry (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.", "resolution": "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor."}, {"severity": "medium", "category": "vertical_ble_bleed", "title": "Vertical BLE stack: Upstairs Bathroom directly above Front Entry (59% overlap)", "rooms": ["Upstairs Bathroom", "Front Entry"], "camera_id": null, "description": "Upstairs Bathroom (Upstairs) sits directly over Front Entry (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.", "resolution": "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor."}, {"severity": "medium", "category": "vertical_ble_bleed", "title": "Vertical BLE stack: Upstairs Bathroom directly above Garage (41% overlap)", "rooms": ["Upstairs Bathroom", "Garage"], "camera_id": null, "description": "Upstairs Bathroom (Upstairs) sits directly over Garage (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.", "resolution": "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor."}, {"severity": "medium", "category": "vertical_ble_bleed", "title": "Vertical BLE stack: Margot's Room directly above Kitchen (53% overlap)", "rooms": ["Margot's Room", "Kitchen"], "camera_id": null, "description": "Margot's Room (Upstairs) sits directly over Kitchen (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.", "resolution": "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor."}, {"severity": "medium", "category": "vertical_ble_bleed", "title": "Vertical BLE stack: Guest Room directly above Family Room (55% overlap)", "rooms": ["Guest Room", "Family Room"], "camera_id": null, "description": "Guest Room (Upstairs) sits directly over Family Room (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.", "resolution": "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor."}, {"severity": "medium", "category": "vertical_ble_bleed", "title": "Vertical BLE stack: Office directly above Family Room (40% overlap)", "rooms": ["Office", "Family Room"], "camera_id": null, "description": "Office (Upstairs) sits directly over Family Room (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.", "resolution": "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor."}, {"severity": "medium", "category": "vertical_ble_bleed", "title": "Vertical BLE stack: Office directly above Garage (82% overlap)", "rooms": ["Office", "Garage"], "camera_id": null, "description": "Office (Upstairs) sits directly over Garage (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.", "resolution": "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor."}], "compiled_room_rules": {"Master Bedroom": {"room_name": "Master Bedroom", "connected_rooms": ["Front Entry", "Guest Room", "Margot's Room", "Master Bathroom", "Office", "Upstairs Bathroom"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)", "Master Bathroom (unmonitored door)"], "recommended_inactivity_timeout": 300, "spillover_entities_to_downgrade": ["binary_sensor.master_bedroom_person_occupancy", "binary_sensor.master_bedroom_entryway_person_occupancy"], "max_camera_coverage_pct": 80.0}, "Master Bathroom": {"room_name": "Master Bathroom", "connected_rooms": ["Master Bedroom"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Master Bedroom (unmonitored door)"], "recommended_inactivity_timeout": 600, "spillover_entities_to_downgrade": [], "max_camera_coverage_pct": 18.0}, "Upstairs Bathroom": {"room_name": "Upstairs Bathroom", "connected_rooms": ["Front Entry", "Guest Room", "Margot's Room", "Master Bedroom", "Office"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)"], "recommended_inactivity_timeout": 180, "spillover_entities_to_downgrade": [], "max_camera_coverage_pct": 0.0}, "Margot's Room": {"room_name": "Margot's Room", "connected_rooms": ["Front Entry", "Guest Room", "Master Bedroom", "Office", "Upstairs Bathroom"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)"], "recommended_inactivity_timeout": 300, "spillover_entities_to_downgrade": ["binary_sensor.nursery_person_occupancy"], "max_camera_coverage_pct": 65.0}, "Guest Room": {"room_name": "Guest Room", "connected_rooms": ["Front Entry", "Margot's Room", "Master Bedroom", "Office", "Upstairs Bathroom"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)"], "recommended_inactivity_timeout": 300, "spillover_entities_to_downgrade": [], "max_camera_coverage_pct": 0.0}, "Office": {"room_name": "Office", "connected_rooms": ["Front Entry", "Guest Room", "Margot's Room", "Master Bedroom", "Upstairs Bathroom"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)"], "recommended_inactivity_timeout": 240, "spillover_entities_to_downgrade": ["binary_sensor.office_person_occupancy", "binary_sensor.office_entryway_person_occupancy"], "max_camera_coverage_pct": 78.0}, "Dining Room": {"room_name": "Dining Room", "connected_rooms": ["Kitchen", "Living Room"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Living Room (open passage)", "Kitchen (open passage)"], "recommended_inactivity_timeout": 180, "spillover_entities_to_downgrade": [], "max_camera_coverage_pct": 65.0}, "Living Room": {"room_name": "Living Room", "connected_rooms": ["Dining Room", "Front Entry"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Front Entry (open passage)", "Dining Room (open passage)"], "recommended_inactivity_timeout": 180, "spillover_entities_to_downgrade": ["binary_sensor.living_room_person_occupancy"], "max_camera_coverage_pct": 65.0}, "Kitchen": {"room_name": "Kitchen", "connected_rooms": ["Dining Room", "Family Room", "Front Entry"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Front Entry (open passage)", "Dining Room (open passage)", "Family Room (open passage)"], "recommended_inactivity_timeout": 180, "spillover_entities_to_downgrade": [], "max_camera_coverage_pct": 18.0}, "Front Entry": {"room_name": "Front Entry", "connected_rooms": ["Family Room", "Guest Room", "Kitchen", "Living Room", "Margot's Room", "Master Bedroom", "Office", "Upstairs Bathroom"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Living Room (open passage)", "Kitchen (open passage)", "Family Room (open passage)", "Upstairs Hallway & Stairs (stairs)"], "recommended_inactivity_timeout": 60, "spillover_entities_to_downgrade": [], "max_camera_coverage_pct": 18.0}, "Family Room": {"room_name": "Family Room", "connected_rooms": ["Basement Play Area", "Basement Theater", "Front Entry", "Garage", "Kitchen"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Front Entry (open passage)", "Kitchen (open passage)", "Garage (unmonitored door)", "Basement Play Area (stairs)", "Basement Theater (stairs)"], "recommended_inactivity_timeout": 180, "spillover_entities_to_downgrade": ["binary_sensor.family_room_person_occupancy"], "max_camera_coverage_pct": 65.0}, "Garage": {"room_name": "Garage", "connected_rooms": ["Family Room"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Family Room (unmonitored door)"], "recommended_inactivity_timeout": 180, "spillover_entities_to_downgrade": [], "max_camera_coverage_pct": 65.0}, "Basement Play Area": {"room_name": "Basement Play Area", "connected_rooms": ["Basement Theater", "Family Room", "Storage Room"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Family Room (stairs)", "Basement Theater (open passage)", "Storage Room (unmonitored door)", "Basement Bathroom (unmonitored door)"], "recommended_inactivity_timeout": 180, "spillover_entities_to_downgrade": ["binary_sensor.basement_play_area_person_occupancy", "binary_sensor.basement_stairwell_person_occupancy"], "max_camera_coverage_pct": 65.0}, "Storage Room": {"room_name": "Storage Room", "connected_rooms": ["Basement Play Area"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Basement Play Area (unmonitored door)"], "recommended_inactivity_timeout": 180, "spillover_entities_to_downgrade": [], "max_camera_coverage_pct": 65.0}, "Basement Theater": {"room_name": "Basement Theater", "connected_rooms": ["Basement Play Area", "Family Room"], "recommended_mode": "open", "can_be_bounded": false, "unsealed_exits": ["Family Room (stairs)", "Basement Play Area (open passage)"], "recommended_inactivity_timeout": 240, "spillover_entities_to_downgrade": ["binary_sensor.basement_theater_person_occupancy", "binary_sensor.basement_stairwell_person_occupancy"], "max_camera_coverage_pct": 78.0}}};
const PDD_FLOOR_UNDERLAYS = {"main": {"url": "data:image/webp;base64,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", "x": 151, "y": -125, "width": 718, "height": 699}, "upstairs": {"url": "data:image/webp;base64,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", "x": 116, "y": 16, "width": 768, "height": 552}, "basement": {"url": "data:image/webp;base64,UklGRvAYAABXRUJQVlA4IOQYAADQXQCdASr6AOEAPhkMhEGhBEKrfAQAYS0t34fB542yMH/7R/dPxu/cv1v8XHeD1n/t/+1/vn4DYL/pvgA9y/5h9g/rX93/Xr94/+F92f63/PflB+x3rb74P6X8qvgC/EP41/X/x8/sv7Vcphqv0zfAL6j/KP7V/bP2k/r37W/Y/9t/hPxc9y/rp/afzA+gD+M/yf+1/1f9m/75/6/rP/c+Ih9V/x/+m/LH6AP45/NP73/b/2P/wH/t+db+1/yH7j/6L///An9B/vv+v/y/+O/4v9t/9/4Dfxv+W/3/+3f4v/d/3v///8r7j/W/+2XsV/q2RcAcD3CCIShYiV+gSsT0vYFHOP2V+HtICLx1eW/xT05MlFggm7rpAk+3wvLkNdVc0NOgna9GvdmGMs65R+D87oNmiPcoCDlBkzWW/H1yeIsACYKHi4dfHPVXxstIKiCtUDvBXtWi6ccGmctJiHGWtfSZAtq5/XbaFcuFkemQAFXIc4iM1WXFYJrxzOg8vtOxQbjceksUucb3DpG1tE8rfD/J0IK2G2TfD9KYXl49n0OJwApRnwdptV3V1GR9wtahZAKVCbS/dQXJ5m3B28zgaTIa6lTM3amN0VF9qDS3JeZmQm5AgT1pON2j1IFVg2++ufFOVE1o/VgCfoE0hGJchlUB14je9SUfbMJ8SEIP4h6J6cfxbIUWnUhhbys7rOhaBAH7lvdDmtWc8HBa43erlLfaMP1lnvhiOtUkndpmYNUmbg/3d6YGDZN+YSUQ4PFQSlLq70ImnsMT46XRRXL1FPJZB27gxPjlQfd7cPc8L9SpEu5fkXj87YlXf4l/yCVxSIjdvt8CaXHStH/zZCYQdzymkPRLyiGPjWcf2I5Q+RvHBU3z8CaOrRMOxYk37V4dIqCZrGVOFlL/ww6pXvB/1WcamefxtOuzSHgKmyXHMVYyXgXtxQNtdunPtdN6qYE4P2BzdhY3MJgz2vwBp5CtaYdYoZs8oSTIdwYnx005qZN+hJMh1oAA/v//gaH77AlwLNPLeExewd1YKtVh4FeEk2KfyPE1eLRtSLhsBITdAkavA8BSO7oGLHW2RyXLFQrswOlASNBL7tuhhf817XIDueEFKEZhMWeZTaSmtb+OzoUvT5D2lfJv+R8bVtEtIPrlhae1mYhNr4ehXI6yFmOHuW0oRPzoQnQkPmuVVg4d57vEetZhxUIEdi/KMadCX/vmko+WZtvSI+NJYu8sSbNlXqthvrmmOPkva8w9+OvSjH8h41tzeFEoxjGKi0w7tnZ1lueOmuVL9Lh5mLKdBc3kQGmMguxfECCRMFIWHgDCOTNNA6QwZAz6LvXShcA6WFXYrDa/CDZ/5DQVmWzdPJoWqQkTQ/jdNxhLBvjs7XB4xIMfTyPYQs0mAT87Qva4EEgd8vFi8wuPCLKGW6KP4ySgizJYlNTj5ofgpYIAQ7J5D8i1tKt7dAp0c5gLwBvsxGB7UzAl9jOOVPoLL1sYhaddyGHMC0Ll38ttiJFq/RUBVL5ztjjzfg3ZiUzPSbNv1zrOsKvAku20B/hU6m51XJWrjXAtiTDv++smJADYHHkrDPKUgYUalCX8WC195gsTqu4ar/xXac1ubbeQHqQVVfHQTqIwpybeCBlNy+GpFwBJCTZtHoFe9eQUnuFdFTEaC7Wb65UNzI4HU7m+7sePPlDMRBqLSOvYExDR03LSxRtvT+ajXCtlON+rf4h8sq8FbvF3lqQWYeARb0VlprvzTr4rfufucnEWx3kamPMHEt7SPIvAeR6aYprF6tJoKzor46BlYkIR/K9T2+nX6N7VpHawnafC2y7nPMQc22x0xMjGPqeqBYBsvGOT0cf0dfO6Z/AN850OybvwdIpyyPqt1VpFEI/vz5li3GtX3GEWE6/YKTPar4VbTYIkD5pdFoANxSFyCk48KIgf8d4qm6oczdQuqIiuXf/X6E9ElIa/I47txmkDPC3oZXDdTCHPvMyDAmBRm0/ybYgR3QUgTe72NwtoAt7Vwij4bxZ8r32Fws0HOzd6G4OwkNIj+BknZeHjaHqK6B9Mhm87ef1p85aivwuv3DNpABNjNkXFI0WBYPWTxKPBOAQEblQLsGscmalOopcO833idlveXmm6uN0puqGeGLGv+ME4j6FGmNNOQBZ0Vfuci3A+Jdc66+bhRS0YDiY0RU5925PrroXm2hoIW6C0GeZk8slVDEMGGTK0E+2tvtTZcUieCxKsiiGBj9gpwEHsr2/S0jmJRzLpCjHTYRwk6npoR6YV4dwsY4z7KgQt0PgqqMaxAnpJR8mGrLa51raEV8BGHHTXvztbJlaQUToPlVKfs03JTPEUyd5EXvUZWZzSpen+nnNgm/tsS2b5RiN7XUUKHnjCYJFNH+RxNEDVQ0RqEUyZI6meejzbkohtyygCCmLfE5EKBLNRY8Uzz/AzZiFIrCjh8L50a7I2R5Y4mEzs62TtQk4wT1Osb3AGS42IPmhUfeR+2pmOqLqHzPLrxHPKDSIOQW0Uf/pu56k/FspALE/MKcn8cWdBSHd0MdPkaBBRsRk0iQvmD2+su+1qpld8MAqgWtgcYtTQk8iM1RBTRUovdZxzHrMhdaXp4lHF7udzdAxSJ7af1pSypcxfkC3+FNkBglMQqVkImP9LSkwxEvuLkABjsyiSeQjyOqHFNJRJvHdiuGLL7MVTpS2MAkiKo1Qrsl2ovJsX4tk6xlXA/0EkHtKpp04Duy0BzNzGzVrL2KNsDXs7OEunJ9HufuCz5OBDGJ+seX252C8x03KOj8shOpDhUGeSIf8j9EjAhOgKpEaihK6ZFxM8MdAwMVRmn6YQrz91ESofAZRIo2B3Ej6LBxsejWoyLDHsAVsPBUxAW79ZhOVNrwePXZDjjOuNDEt9zU7WrtLz3E+m6eTvDWL3R7KU4u0TAAtf4mQyhifLDB0vsdtfy9ErHYuvlStD3Q7s+E9sa5K7Ua36WkBTVRXi5YUMcmecyYIUsgPUyYNJnO93R3q7G6vhujhm1Fxvp83hGiUmx0xSs/dLAZgomT/0M1vQLDvowJ6MthGnlwbwZwlubaMIh/rXaP5S6dasDmFXDL/12lNDEhEiIvRGvhncHOmcPHC6o5rlY65VJDVrhps9IJw83ndZPdIbibuabs+B9UlB6P5lDOPbFGG7XdQDP4khlWAYMpGmWDUHpzYNlv3oOw5+QhQcyr6LeL5Y5waQnAPfaWLZ83ggQI+NCtzaEWW2+Ls7isnZNfYML/zc/ZHB6f897ud0ZJF5lUSPArNNt+dLJqXhqckKhl86IUtS60Gn2qkTI6HQ4yg/zfHZq85XagFOPJEQAfh0jS+0NZ5GaM64bvayz6OV6waTcfBr1nJz2VWM2sR65BMcWPqwnRe/5iFTHK7LsXT+rrh9DsU7XAPGWHW8RHCUGEz4ehRdKSM6UnOCNTrzhkHdj0BZI9Xb3X05PFBAVvLEs32lxMapCZ4XrjOnekfFsmd9gkZgf8WONXpRo4ib+yFOo3qOH9KnJZLH+We7w7h9jz+oF47BUVP3lGbIlXv5m0APOyOXAsGTYxe66JQ7sckxB9/3RbQ1AMiQr0K2Lb61INCKPwlfX8ja+HGTHVt7ZTpF3bH7ARovxB7txG23QmtOqZVW+qIAshAvGQ7aomREGlGGonoZx3hqSreIsZ0mezbURZbRaqFoteVA4iZUouo3a5i8CAVcsZLxN+ALYuFIX6nhhuNT3rrcoFdX5/jPN3BCWaano4uc/mvvPZxP/9O8702a3Ox6nLNGKVw9BmBrzwg5s2zrVJ3o3sngNwv/8aI2e0kGdZ0NUpDmhsd6dQ5zewZE3E8/9LawEe6fVTXf2f8VtOus/PsSnEaCk+967rQeIPVSq3wucqQuiIAySh/V8QTO9QKAZ1EbBXRwoyLNGxP1HNIJtnjxsoX8X72A8j3Hs5GyKxucNepINItVDIP+KLcAon5zlrQVDEC22xbgll6GqALb36WLGivFEc42ljNa8lRyd+O9PYNQJeuZzViGYF/w0OztRfOngK+jTASLxG3lqwMTjALioR6Fs4L08F6KnuGvcZMnjAcbGDGa8Qa8RYB1O2p1UX0krXN042EICjdT5/mIRZkyedsRCVsIRHXHCVJ6037Ag4oNGuSBuGxt2VdhvepRbiNVddzXO0vO2akMHpV9KHF/ayTdhtkSqKJRPa3EDYhqsCN/qO2YaVJkH2xezL/dwc+tuMUhhKIXz3L2r6YaoB5RD19Wk21gK2KUKyG/RQi/dFw37xH+SYlLo8eo9V6Ui6RLM4vUrxZZ9wZ8W6D+JTmcxhoeW0KeGRcLSRtXZYT/tVG+jtbwburkOG3VgkAnqbkvOjyhgH6j/HDaKKIg9OVUFtpuLgQXgXzo1S0K54tiDEhW30EeQjSRrPbM978vbFM0S5d+Y/I/iUIJmR40sopaooSOo6LtS/HsS5UT/4ejlj+wUKHOqbNIKIn+FH14u63Ufubdzx/iDCH59QRdUu5yb3IMAWnhjgGy/50UX9kZLLz6uP3UZ5cNjYUb+ULL7hBYe4YldT8wiARXfVNMgqQUhs31L0egg46+LY3qDDTlY33Ck+WcmqoKpe99rPrGQ01gITBEtj1w8RjINzI+HwPei3IZ/kY592TaYyhIjmE4h3Io8+0NeAWNkCwuiq3yy7b9Xp40SuWqiexzsOCmI9324cW+IIIxzrmIYPA6u8V3me2RhgEIH+GiwY8w5GSEi+0XdX9h2QlxLs1hEdqxQXzrsq5QcU5kKRopjg8xK7cQuChKK0sC8iDGswF0kgjpQCXiItkJjAcZyI5nBuVuww+RwNHuWKNjxN/YjEqSRtyFMkNHb3YzFPNGG+PJZt68FJYDQoPrCDlaraeNJ3PROI+YA1QrNaVT5HasF/6l0/ziV5Pj4hvH4Rtg6Zt6vyWICXgV1hiOnTuq/aD/OB+iD/4JY1JdL24+F9sjRqncp+v7+vFyu3TgoblvyyU0U4saFax48BwQjuEOMy/4Zsmy4GTg7RhMOZGsPEyjK33+xZHB/vZK+Kirtg4154e5YlWtBIfzwYj+sHG1IkaQPaucZSzxisqxm0NnkW03aEZb2H6DRG043yyOqQsoYmAXLdaZYbEsfkD4GKlGF7jJhOrwGWcMoFdMpTu2F525oL9MOqXws1XMoHhBdZKB91+x17LW41Ak9qpkUUYZgf5naqAE08a/xFa2pp3YipxpyNuFql5IMR2ehIFsacc7lPtCCeXkwzlglEAnPjJaQLS/foBSPjBogku0MCCxDbbYX38geJ0SxfB4jBIItvkjMaKpBRovG1NVSCcqKbCVP0P7kXcD+QKLtNyMrL6NB9TWLZZk3lz/879S4oMkugplHsqY2zPBw9kH7H2Zib8fuzEt3gxuHXDdXRjOeRieD4V/q7iHML71Q71XgwWUaO3F4FKQj15qiw6Ih5H27n4dC+k7fy+Hull9zE9lkXcG4U95sP3IlDdJlmrVU0amLiB6Ts2z2QyncaiN5lx9dJXOYcqP/8l9DO1uJB11s+T81uAuPzWMk2Oep28z+NK0+Iu7BMuJ1H2V3njE6bFXj9Jjv8fUZmAqm8YSJxTuN5WJyU7F0b7GgCZ+lv2x1l62mPhRxTp408BU7ZeXHa9/A/53UJEiED/IQBc8spjYfKJzzIsUEcwCuWWWcGWuM3kWDcw9SftvTFmpBGurX7Ej36HAnwYjEh5DuyY13gnqDVfQqF/iQxChTrlwOt3zHWnkjc04sD4YPmAP4IImqhvmWlsr2gPI64R6c7nO02vIbzBxinxmHRIPugu2wpeEAJI5OeGswmnrSuw8kUXP49faGW5qVEEf+CUxGOiG4KAv30h5Cbhy5Sx2fqB2iHvbOyXtslrg3zsAShwN0eG00J2EOUn1h6aZ2gT+rYuyeRD0KiyHzQ+u4DAcG0+w6XD7uvf76TvAkLMv5glk7saixFQvLWNDoR+B+dk3xyszHhLdpcGQp1QAdIFFlMzL3ghzrQkV/pKZWgKVqd8a+8gMNpt1tCs9g9FJGHeNVj3kavkJ9Si9M3XktSbgVUGfqbWc3gB0U/MJOWat6QTbcDZi3Gq8dYbkpQAg6QnzTbjPd8QboGxtZrGTvQDbQe9QyCgPyAOo3XkoAFOeu+pkr9rWHQ3Rar+9o6zjuHHEk5roB9D1KWjkOs/il/ub1wEfoNaAqkaTta9j3RjOrXNU+Q3JK/4MYsQlVbjmhlpZkg86/fBmi0/dTITxwt117O1HvRimJo5BZX85t2E+dWV1MfO7J5teYSrlVlqqSXOKUOuqpb4tjxGsm4ZNKQd4r4cBKJb11ue70TTBe+yWy15sZeN5lKM4lHpVYLmwGChvSnftM8nSuzJllYV3l3FTUj2zqaf+hHtyy4dAhr1tRNTF4lhQHMiiWXoLkcFy7kg/J/P7GRT4G7oz24oFsRbLuRbjmCcovKGrd/BCuVdPI3UDS2UsUf00BEaQ90MSWTL2wFu7F5ICO3XztEXWjyMy/cTxT+bY6UiSurvPw8ITT83s6J0LJGZ3lBJIzQFbYlC5NEZhrHAbe1b3TdJsIaX8YelU5Z3+hQyzmxgnxeAV5StCn2sWXBM/6N+WJk4AId8ZYZTPk3cc9LhA6owa0lhg8wSvkt+dtzyjkEiRQKsgWZxQjOPRvKhOfzMi7EWpZ/IV0kj8fXSEr0mMFR/pFn+TnqRLkpeRLFU7s7FBdI63XrNhhuooRsrDuMNiVM20g8hqi6mj4isHBzs9xXnmUhsQ829yfU9WdULfutieK7CqMbh677rk2hB/2rC9IfIwBV5AB8SwXoxoRhYDRpSJeXXesK6anlAS9V/w+8Eu5r554sLF+77nfJmZjidIZdEzVIdwHqTPUgGh36QgYZ2O2L9GqILmiO0MmhD5s++U/ut4G3NolUVil+bbg5nmYuTA99CmcZL0aiqbxCEvEX9P2/aoDTsfHa2S4CiQktFeYCKX009CtPP00lNsquoxVbM1TPBhQaAPo31OcVuoifrle0BDt+nkRI3vQLxVx0OpZwDtO+rftoh3TbhsUaRZQwY6vPpVO3/iOnk/KDHNcrtQm9rNeMJZMA4V/6jOqNiAM950HQzLKKP2PIL90mYlWmD8wzuMdubCRl4Vc1Ho8V+5Cv84ntAKolJNcopWBaUm3zA7VoKxb9hPrPwvZokzrlcvQX0XUeRQji9+RMSeAx0IZhzqrznqL8q5KMwjd8KBzbWypAgkmkCAXMPoy8mlIl7zDnfKrPo791SUfNqPQp5LKC3xYl7oolYZRidTlwHN1uqkQhEkVxpIKxnYOR5BGQSDx4IM9lBIdnyuXoMdqpUc5uq+Fs1NnkmygZaE37z9cDosUizIt/WFF3WXhrAptK8nX3Kxwwnx9JuTSky8QGTgmc4bGN+VeR/aVD2uOgi/wiw97iXFr2JKf5lHtGucIgOVmpF/3s6w9uwpudoxH5grjoJ4crJqgjg8vczE/0F9/8wU1nCYg8A/8PFtnk0xF7hRbxz+q1c41D8dnDrobd33E2APjEAP20iygMh6c8EKYAg7hZyOiWvVj0s6tmhb4LSWlw5lt7At+b6R9MGlktvrjsAYDtqdXFOrhkhPA1SASOlZ4HuhIZtx330MWdQ09GwK/eVNLlaIqcHTzd9U6W0385zPS5bQz0kGlQF2e6zJ/SV//UX4QK3lPLqAORg+g4vib41l5YYM8dnS2+lsAUmTSgpPn7xO0vilvBh6wsvy+/b86Jo4BTR01Z9jdGW4VIHnFimuEJJTy0V00YSbAwypUtZ06csFGUPlVmXmZgd4M7NqeRCcoVSc3aRZr8cdCYfV5gLmvlppEW0f0kZWF9Vzaqe3PdhI7IcHd8SxuKNBQ2txKKMEN2uz3rcuJ4+Sm/jlEaU/7Q8VxvvXRfI/1keCCfFeg9eqXwl8g9rPGX28ge2q0uDiFQhD4k/xwptDo9mBvRdXK3gvQtW7/UI0svFIM8YvzSZIB49ZaW3GugM1pMeq/02Sms214fR2Sz6KUOh1IKnuTk/LdsRpdYABHnjxaH8Q9OJ8pbRC0xAJ9prnTr+Or0wDasJYH21r33q9Ks7+WszASaG9TWt/rI4V/Xgm4m+wmS3efFSZoHmrxDpGy/g4udF0AW2TWwER89/B/gmACaxcFpLsOhENpt1Hx+BqBxPsN7m0ZARCoZCkpJ1/eZ6p0iZP8wNV5nb1vGxBBEWkagkme9LgaAS1UtRQyQjxGviU1bE2QP1pGtcXlDrq5Jn3avURrko0NWoKYenlGwIJl3c/28/jAi2YBBECGRMjgbivUG0SVxc1MajbkRxsRQYmKUR6tE62RR5Nnk8AW33gbDFekSsRDyjr7zZa6LtXze8UpMXUxPFBZqvEKdRVS7hRPJEHJ8YL2vVlppRjwRfz4P/ICvMNSTlAqa74lLAV5HUDRxiMfCcwNeVi4YxH3nXm/GSwYjWx23NIodCAq0/X9K8afSVt8ow678akc5NLPdGWv0z8YxMd2h8xAAAAAAA=", "x": 201, "y": 21, "width": 602, "height": 542}};

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
      const saved = window.localStorage.getItem("pdd_floorplan_layout_v2");
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
          window.localStorage.setItem("pdd_floorplan_layout_v2", JSON.stringify(this._floorplan));
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
          window.localStorage.removeItem("pdd_floorplan_layout_v2");
          window.localStorage.removeItem("pdd_floorplan_layout_v1");
        } catch (_e) {}
        this._compiledTopology = this._compileFloorplanClient(this._floorplan);
        this.render();
        this.showToast("Reset floorplan to default layout", "info");
        return;
      }
      try {
        window.localStorage.setItem("pdd_floorplan_layout_v2", JSON.stringify(this._floorplan));
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
          window.localStorage.setItem("pdd_floorplan_layout_v2", JSON.stringify(this._floorplan));
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
