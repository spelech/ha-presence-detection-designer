/**
 * Presence Detection Designer — Clean Home Assistant Material Design Panel
 * Custom Element: <presence-detection-designer-panel>
 */

const PDD_DEFAULT_FLOORPLAN = {"ble_proxies": [{"entity_id": "sensor.living_room_speaker_bluetooth_proxy_status", "floor": "main", "host_room": "Living Room", "id": "living_room_speaker", "name": "Living Room Speaker BLE Proxy", "radius_px": 190, "x": 260, "y": 435}, {"entity_id": "sensor.family_room_speaker_bluetooth_proxy_status", "floor": "main", "host_room": "Family Room", "id": "family_room_speaker", "name": "Family Room Speaker BLE Proxy", "radius_px": 210, "x": 710, "y": 240}, {"entity_id": "sensor.master_bedroom_speaker_bluetooth_proxy_status", "floor": "upstairs", "host_room": "Master Bedroom", "id": "master_bedroom_speaker", "name": "Master Bedroom Speaker BLE Proxy", "radius_px": 210, "x": 230, "y": 180}, {"entity_id": "sensor.nursery_speaker_bluetooth_proxy_status", "floor": "upstairs", "host_room": "Margot's Room", "id": "nursery_speaker", "name": "Nursery Speaker BLE Proxy", "radius_px": 180, "x": 480, "y": 135}, {"entity_id": "sensor.office_speaker_bluetooth_proxy_status", "floor": "upstairs", "host_room": "Office", "id": "office_speaker", "name": "Office Speaker BLE Proxy", "radius_px": 195, "x": 745, "y": 395}, {"entity_id": "sensor.basement_speaker_bluetooth_proxy_status", "floor": "basement", "host_room": "Basement Play Area", "id": "basement_speaker", "name": "Basement Speaker BLE Proxy", "radius_px": 260, "x": 450, "y": 310}], "cameras": [{"floor": "main", "fov_deg": 65, "heading_deg": 355, "host_room": "Living Room", "id": "camera.living_room", "name": "Living Room Camera", "notes": "Covers Living Room and sightline projects directly through open archway into Front Entry.", "range_px": 350, "spills_into": ["Front Entry"], "sub_zones": [{"entity_id": "binary_sensor.living_room_couch_person_occupancy", "height": 115, "id": "living_room_couch", "label": "Living Room Couch", "room": "Living Room", "width": 95, "x": 170, "y": 370}, {"entity_id": "binary_sensor.living_room_floor_person_occupancy", "height": 110, "id": "living_room_floor", "label": "Living Room Floor", "room": "Living Room", "width": 90, "x": 270, "y": 380}, {"entity_id": "binary_sensor.living_room_bay_windows_person_occupancy", "height": 42, "id": "living_room_bay_windows", "label": "Bay Windows", "room": "Living Room", "width": 140, "x": 175, "y": 495}, {"entity_id": "binary_sensor.living_room_entry_person_occupancy", "height": 95, "id": "living_room_entry", "label": "Front Entry Archway", "room": "Front Entry", "width": 70, "x": 380, "y": 365}], "x": 175, "y": 530, "zones": ["living_room_couch", "living_room_floor", "living_room_bay_windows", "living_room_entry"]}, {"floor": "main", "fov_deg": 55, "heading_deg": 85, "host_room": "Dining Room", "id": "camera.dining_room", "name": "Dining Room Camera", "notes": "Covers Dining Room table and projects sightline down table into Living Room couch.", "range_px": 240, "spills_into": ["Living Room"], "sub_zones": [{"entity_id": "binary_sensor.dining_room_table_person_occupancy", "height": 110, "id": "dining_room_table", "label": "Dining Table", "room": "Dining Room", "width": 110, "x": 185, "y": 175}, {"entity_id": "binary_sensor.rileys_food_person_occupancy", "height": 44, "id": "rileys_food", "label": "Riley's Food Corner", "room": "Dining Room", "width": 70, "x": 240, "y": 128}], "x": 175, "y": 135, "zones": ["dining_room_table", "rileys_food"]}, {"floor": "main", "fov_deg": 75, "heading_deg": 180, "host_room": "Family Room", "id": "camera.family_room", "name": "Family Room Camera", "notes": "Catches Family Room couch, flanks Kitchen Island, and sees pathway to Entryway and Basement.", "range_px": 420, "spills_into": ["Kitchen", "Front Entry"], "sub_zones": [{"entity_id": "binary_sensor.family_room_couch_person_occupancy", "height": 120, "id": "family_room_couch", "label": "Family Room Couch", "room": "Family Room", "width": 135, "x": 665, "y": 185}, {"entity_id": "binary_sensor.family_room_recliner_person_occupancy", "height": 75, "id": "family_room_recliner", "label": "Family Room Recliner", "room": "Family Room", "width": 80, "x": 585, "y": 135}, {"entity_id": "binary_sensor.family_room_floor_person_occupancy", "height": 115, "id": "family_room_floor", "label": "Family Room Floor", "room": "Family Room", "width": 85, "x": 580, "y": 215}, {"entity_id": "binary_sensor.kitchen_island_person_occupancy", "height": 110, "id": "kitchen_island", "label": "Kitchen Island", "room": "Kitchen", "width": 110, "x": 445, "y": 175}], "x": 830, "y": 135, "zones": ["family_room_couch", "family_room_recliner", "family_room_floor", "kitchen_island"]}, {"floor": "main", "fov_deg": 64, "heading_deg": 90, "host_room": "Garage", "id": "camera.garage", "name": "Garage Camera", "notes": "Mounted on interior wall looking South down parked car toward roll-up garage door.", "range_px": 170, "spills_into": [], "sub_zones": [{"entity_id": "binary_sensor.garage_parking_person_occupancy", "height": 125, "id": "garage_parking", "label": "Garage Parking Bay", "room": "Garage", "width": 140, "x": 615, "y": 410}], "x": 680, "y": 390, "zones": ["garage_parking"]}, {"floor": "upstairs", "fov_deg": 80, "heading_deg": 69, "host_room": "Master Bedroom", "id": "camera.master_bedroom", "name": "Master Bedroom Camera", "notes": "Catches Master Bedroom plus entries to Upstairs Hallway and Master Bathroom/Closet.", "range_px": 480, "spills_into": ["Upstairs Hallway & Stairs", "Master Bathroom"], "sub_zones": [{"entity_id": "binary_sensor.master_bed_person_occupancy", "height": 130, "id": "master_bed", "label": "Master Bed", "room": "Master Bedroom", "width": 130, "x": 145, "y": 95}, {"entity_id": "binary_sensor.master_open_area_person_occupancy", "height": 140, "id": "master_open_area", "label": "Master Open Floor", "room": "Master Bedroom", "width": 130, "x": 155, "y": 240}, {"entity_id": "binary_sensor.master_bedroom_walkway_person_occupancy", "height": 180, "id": "master_bedroom_walkway", "label": "Master Walkway", "room": "Master Bedroom", "width": 65, "x": 290, "y": 175}, {"entity_id": "binary_sensor.master_bedroom_entryway_person_occupancy", "height": 60, "id": "master_bedroom_entryway", "label": "Master Hallway Entry", "room": "Master Bedroom", "width": 45, "x": 315, "y": 250}, {"entity_id": "binary_sensor.master_bathroom_person_occupancy", "height": 60, "id": "master_bathroom", "label": "Master Bath Doorway", "room": "Master Bathroom", "width": 45, "x": 340, "y": 380}], "x": 150, "y": 50, "zones": ["master_bed", "master_open_area", "master_bedroom_walkway", "master_bedroom_entryway", "master_bathroom"]}, {"floor": "upstairs", "fov_deg": 75, "heading_deg": 230, "host_room": "Margot's Room", "id": "camera.nursery", "name": "Nursery Camera", "notes": "Mounted on south wall looking northwest across bed, play floor, and dresser.", "range_px": 280, "spills_into": [], "sub_zones": [{"entity_id": "binary_sensor.nursery_bed_person_occupancy", "height": 110, "id": "nursery_bed", "label": "Nursery Bed", "room": "Margot's Room", "width": 120, "x": 380, "y": 60}], "x": 550, "y": 230, "zones": ["nursery_bed"]}, {"floor": "upstairs", "fov_deg": 80, "heading_deg": 250, "host_room": "Office", "id": "camera.office", "name": "Office Camera", "notes": "Covers Steve's desk and sim rig with hallway door on the left periphery.", "range_px": 320, "spills_into": ["Upstairs Hallway & Stairs"], "sub_zones": [{"entity_id": "binary_sensor.steves_desk_person_occupancy", "height": 95, "id": "steves_desk", "label": "Steve's Desk", "room": "Office", "width": 110, "x": 725, "y": 360}, {"entity_id": "binary_sensor.sim_rig_person_occupancy", "height": 100, "id": "sim_rig", "label": "Sim Rig", "room": "Office", "width": 85, "x": 635, "y": 410}, {"entity_id": "binary_sensor.office_floor_person_occupancy", "height": 95, "id": "office_floor", "label": "Office Center Floor", "room": "Office", "width": 120, "x": 655, "y": 300}, {"entity_id": "binary_sensor.office_entryway_person_occupancy", "height": 55, "id": "office_entryway", "label": "Office Doorway", "room": "Office", "width": 55, "x": 610, "y": 260}], "x": 855, "y": 525, "zones": ["steves_desk", "sim_rig", "office_floor", "office_entryway"]}, {"floor": "basement", "fov_deg": 90, "heading_deg": 235, "host_room": "Basement Theater", "id": "camera.basement_theater", "name": "Basement Theater Camera", "notes": "Covers media lounge sectional, wet bar, and catches stairwell.", "range_px": 350, "spills_into": ["Basement Play Area"], "sub_zones": [{"entity_id": "binary_sensor.basement_theater_couch_person_occupancy", "height": 90, "id": "basement_theater_couch", "label": "Theater Couch", "room": "Basement Theater", "width": 110, "x": 650, "y": 430}, {"entity_id": "binary_sensor.basement_theater_playpen_person_occupancy", "height": 55, "id": "basement_theater_playpen", "label": "Theater Playpen", "room": "Basement Theater", "width": 85, "x": 645, "y": 375}, {"entity_id": "binary_sensor.basement_theater_floor_person_occupancy", "height": 85, "id": "basement_theater_floor", "label": "Theater Floor", "room": "Basement Theater", "width": 95, "x": 635, "y": 395}, {"entity_id": "binary_sensor.basement_bar_person_occupancy", "height": 95, "id": "basement_bar", "label": "Basement Wet Bar", "room": "Basement Play Area", "width": 110, "x": 520, "y": 360}, {"entity_id": "binary_sensor.basement_play_area_far_person_occupancy", "height": 140, "id": "basement_play_area_far", "label": "Play Area East", "room": "Basement Play Area", "width": 160, "x": 440, "y": 280}, {"entity_id": "binary_sensor.basement_stairwell_person_occupancy", "height": 75, "id": "basement_stairwell", "label": "Basement Stairwell", "room": "Basement Play Area", "width": 95, "x": 535, "y": 450}], "x": 765, "y": 520, "zones": ["basement_theater_couch", "basement_theater_playpen", "basement_theater_floor", "basement_bar", "basement_play_area_far", "basement_stairwell"]}, {"floor": "basement", "fov_deg": 85, "heading_deg": 40, "host_room": "Basement Play Area", "id": "camera.basement_play_area", "name": "Basement Play Area Camera", "notes": "Covers Play Area & Counter; sees into Theater. Storage Room & Basement Bath are out of frame on left.", "range_px": 480, "spills_into": ["Basement Theater"], "sub_zones": [{"entity_id": "binary_sensor.basement_play_floor_person_occupancy", "height": 220, "id": "basement_play_floor", "label": "Play Area Main Floor", "room": "Basement Play Area", "width": 220, "x": 260, "y": 240}, {"entity_id": "binary_sensor.basement_counter_person_occupancy", "height": 120, "id": "basement_counter", "label": "Play Area North Counter", "room": "Basement Play Area", "width": 180, "x": 250, "y": 70}, {"entity_id": "binary_sensor.theater_rear_view_person_occupancy", "height": 110, "id": "theater_rear_view", "label": "Theater Rear View", "room": "Basement Theater", "width": 110, "x": 635, "y": 380}], "x": 235, "y": 520, "zones": ["basement_play_floor", "basement_counter", "theater_rear_view"]}, {"floor": "basement", "fov_deg": 75, "heading_deg": 110, "host_room": "Storage Room", "id": "camera.storage_room", "name": "Storage Room Camera", "notes": "Covers interior Storage Room / Gym floor looking toward door to finished basement.", "range_px": 170, "spills_into": [], "sub_zones": [{"entity_id": "binary_sensor.storage_room_workout_person_occupancy", "height": 135, "id": "storage_room_workout", "label": "Gym / Workout Mat", "room": "Storage Room", "width": 125, "x": 645, "y": 75}], "x": 650, "y": 55, "zones": ["storage_room_workout"]}], "canvas": {"height": 600, "width": 1000}, "connections": [{"from_room": "Front Entry", "id": "conn_entry_lr", "label": "Open Archway (Entry <-> Living Room)", "to_room": "Living Room", "type": "open_passage"}, {"from_room": "Front Entry", "id": "conn_entry_kitchen", "label": "Pathway (Entry <-> Kitchen)", "to_room": "Kitchen", "type": "open_passage"}, {"from_room": "Front Entry", "id": "conn_entry_fr", "label": "Pathway (Entry <-> Family/Laundry/Basement)", "to_room": "Family Room", "type": "open_passage"}, {"from_room": "Living Room", "id": "conn_lr_dr", "label": "Open Passage (Living <-> Dining)", "to_room": "Dining Room", "type": "open_passage"}, {"from_room": "Dining Room", "id": "conn_dr_kitchen", "label": "Open Passage (Dining <-> Kitchen)", "to_room": "Kitchen", "type": "open_passage"}, {"from_room": "Kitchen", "id": "conn_kitchen_fr", "label": "Open Concept (Kitchen <-> Family Room)", "to_room": "Family Room", "type": "open_passage"}, {"entity_id": "binary_sensor.utility_room_door", "from_room": "Family Room", "id": "conn_fr_garage", "label": "Laundry / Garage Pathway", "to_room": "Garage", "type": "unmonitored_door"}, {"from_room": "Front Entry", "id": "conn_entry_upstairs", "label": "Main Stairs to Upstairs", "to_room": "Upstairs Hallway & Stairs", "type": "stairs"}, {"from_room": "Family Room", "id": "conn_fr_basement_play", "label": "Basement Stairs", "to_room": "Basement Play Area", "type": "stairs"}, {"from_room": "Family Room", "id": "conn_fr_basement_theater", "label": "Basement Stairs (Partial Sightline)", "to_room": "Basement Theater", "type": "stairs"}, {"from_room": "Upstairs Hallway & Stairs", "id": "conn_hall_office", "label": "Office Doorway (Next to Stairs)", "to_room": "Office", "type": "unmonitored_door"}, {"from_room": "Upstairs Hallway & Stairs", "id": "conn_hall_guest", "label": "Guest Room Doorway (No Sensor)", "to_room": "Guest Room", "type": "unmonitored_door"}, {"from_room": "Upstairs Hallway & Stairs", "id": "conn_hall_nursery", "label": "Nursery Doorway (Seen Partially by Cam)", "to_room": "Margot's Room", "type": "unmonitored_door"}, {"from_room": "Upstairs Hallway & Stairs", "id": "conn_hall_master", "label": "Master Bedroom Entryway", "to_room": "Master Bedroom", "type": "unmonitored_door"}, {"from_room": "Master Bedroom", "id": "conn_master_bath", "label": "Master Bath / Shower Stall Entry", "to_room": "Master Bathroom", "type": "unmonitored_door"}, {"from_room": "Upstairs Hallway & Stairs", "id": "conn_hall_ubath", "label": "Shared Bathroom (Double Vanity & Tub)", "to_room": "Upstairs Bathroom", "type": "unmonitored_door"}, {"from_room": "Basement Play Area", "id": "conn_play_theater", "label": "Open Basement Divide (Play <-> Theater)", "to_room": "Basement Theater", "type": "open_passage"}, {"from_room": "Basement Play Area", "id": "conn_play_storage", "label": "Storage Room Door (No Sensor, Out of Frame Left)", "to_room": "Storage Room", "type": "unmonitored_door"}, {"from_room": "Basement Play Area", "id": "conn_play_bbath", "label": "Basement Bath Door (No Sensor, Out of Frame Left)", "to_room": "Basement Bathroom", "type": "unmonitored_door"}], "floors": [{"id": "upstairs", "name": "Upstairs Level", "order": 0}, {"id": "main", "name": "Main Floor", "order": 1}, {"id": "basement", "name": "Basement Level", "order": 2}], "rooms": [{"entryways": [{"id": "door_master_hallway", "offset": 230, "target_room": "Upstairs Hallway & Stairs", "type": "door", "wall": "right", "width": 40}, {"id": "door_master_bath", "offset": 360, "target_room": "Master Bathroom", "type": "door", "wall": "right", "width": 40}], "floor": "upstairs", "height": 505, "id": "master_bedroom", "name": "Master Bedroom", "notes": "West wing front-to-back. Camera catches bed, doorway to Upstairs Hallway, and entry to Master Bath / WIC.", "room_type": "room", "width": 225, "x": 135, "y": 35}, {"entryways": [{"id": "door_mbath_master", "offset": 15, "target_room": "Master Bedroom", "type": "door", "wall": "left", "width": 40}], "floor": "upstairs", "height": 160, "id": "master_bathroom", "name": "Master Bathroom", "notes": "En-suite bath next to WIC with single sink and shower stall; entry caught by master bedroom camera.", "room_type": "room", "width": 140, "x": 360, "y": 380}, {"entryways": [{"id": "door_ubath_hall", "offset": 35, "target_room": "Upstairs Hallway & Stairs", "type": "door", "wall": "top", "width": 36}], "floor": "upstairs", "height": 160, "id": "upstairs_bathroom", "name": "Upstairs Bathroom", "notes": "Shared upstairs bathroom with double vanity and soaking tub, opening off hallway.", "room_type": "room", "width": 110, "x": 500, "y": 380}, {"entryways": [{"id": "door_margot_hallway", "offset": 160, "target_room": "Upstairs Hallway & Stairs", "type": "door", "wall": "bottom", "width": 36}], "floor": "upstairs", "height": 215, "id": "margots_room", "name": "Margot's Room", "notes": "Top-middle bedroom; doorway opens to Upstairs Hallway.", "room_type": "room", "width": 250, "x": 360, "y": 35}, {"entryways": [{"id": "door_guest_hallway", "offset": 30, "target_room": "Upstairs Hallway & Stairs", "type": "door", "wall": "bottom", "width": 36}], "floor": "upstairs", "height": 215, "id": "guest_room", "name": "Guest Room", "notes": "Top-right bedroom; doorway opens to Upstairs Hallway.", "room_type": "room", "width": 260, "x": 610, "y": 35}, {"entryways": [{"id": "door_office_hallway", "offset": 20, "target_room": "Upstairs Hallway & Stairs", "type": "door", "wall": "left", "width": 40}], "floor": "upstairs", "height": 290, "id": "office", "name": "Office", "notes": "Bottom-right bedroom / office next to stairs landing; camera sees desk, rig, and doorway.", "room_type": "room", "width": 260, "x": 610, "y": 250}, {"entryways": [{"id": "door_hall_master", "offset": 15, "target_room": "Master Bedroom", "type": "door", "wall": "left", "width": 40}, {"id": "door_hall_margot", "offset": 160, "target_room": "Margot's Room", "type": "door", "wall": "top", "width": 36}, {"id": "door_hall_guest", "offset": 10, "target_room": "Guest Room", "type": "door", "wall": "right", "width": 36}, {"id": "door_hall_office", "offset": 20, "target_room": "Office", "type": "door", "wall": "right", "width": 40}, {"id": "passage_hall_stairs", "offset": 180, "target_room": "Front Entry", "type": "open_passage", "wall": "bottom", "width": 55}], "floor": "upstairs", "height": 130, "id": "upstairs_hallway", "name": "Upstairs Hallway & Stairs", "notes": "Connects Master Bedroom, Margot's Room, Guest Room, Office, Bathrooms, and Stairs to Front Entry.", "room_type": "transit", "width": 250, "x": 360, "y": 250}, {"entryways": [{"id": "arch_dr_kitchen", "offset": 20, "target_room": "Kitchen", "type": "open_passage", "wall": "right", "width": 160}, {"id": "arch_dr_lr", "offset": 20, "target_room": "Living Room", "type": "open_passage", "wall": "bottom", "width": 120}], "floor": "main", "height": 205, "id": "dining_room", "name": "Dining Room", "notes": "Northwest room opening to Kitchen and Living Room.", "room_type": "room", "width": 160, "x": 160, "y": 120}, {"entryways": [{"id": "arch_lr_dr", "offset": 20, "target_room": "Dining Room", "type": "open_passage", "wall": "top", "width": 120}, {"id": "arch_lr_entry", "offset": 30, "target_room": "Front Entry", "type": "open_passage", "wall": "right", "width": 130}], "floor": "main", "height": 220, "id": "living_room", "name": "Living Room", "notes": "Southwest room with front bay windows; opens to Dining Room and Front Entryway.", "room_type": "room", "width": 235, "x": 160, "y": 325}, {"entryways": [{"id": "arch_kitchen_dr", "offset": 20, "target_room": "Dining Room", "type": "open_passage", "wall": "left", "width": 160}, {"id": "arch_kitchen_fr", "offset": 20, "target_room": "Family Room", "type": "open_passage", "wall": "right", "width": 170}, {"id": "path_kitchen_entry", "offset": 75, "target_room": "Front Entry", "type": "open_passage", "wall": "bottom", "width": 100}], "floor": "main", "height": 205, "id": "kitchen", "name": "Kitchen", "notes": "Central kitchen with island counter and breakfast nook; open to Family Room, Dining Room, and Front Entry.", "room_type": "room", "width": 245, "x": 320, "y": 120}, {"entryways": [{"id": "arch_entry_lr", "offset": 30, "target_room": "Living Room", "type": "open_passage", "wall": "left", "width": 130}, {"id": "path_entry_kitchen", "offset": 0, "target_room": "Kitchen", "type": "open_passage", "wall": "top", "width": 100}, {"id": "path_entry_fr", "offset": 10, "target_room": "Family Room", "type": "open_passage", "wall": "right", "width": 60}, {"id": "door_front_entry", "offset": 60, "target_room": "Exterior", "type": "door", "wall": "bottom", "width": 45}], "floor": "main", "height": 220, "id": "front_entry", "name": "Front Entry", "notes": "Main foyer with front door, powder room, stairs up to Floor 3, and pathways to Living Room and Kitchen.", "room_type": "room", "width": 170, "x": 395, "y": 325}, {"entryways": [{"id": "arch_fr_kitchen", "offset": 20, "target_room": "Kitchen", "type": "open_passage", "wall": "left", "width": 170}, {"id": "path_fr_entry", "offset": 10, "target_room": "Front Entry", "type": "open_passage", "wall": "bottom", "width": 60}, {"id": "door_fr_laundry", "offset": 40, "target_room": "Garage", "type": "door", "wall": "bottom", "width": 40}], "floor": "main", "height": 250, "id": "family_room", "name": "Family Room", "notes": "East living area with north fireplace; open to Kitchen and connects to Laundry and Front Entry.", "room_type": "room", "width": 280, "x": 565, "y": 120}, {"entryways": [{"id": "door_garage_fr", "offset": 40, "target_room": "Family Room", "type": "door", "wall": "top", "width": 40}], "floor": "main", "height": 175, "id": "garage", "name": "Garage", "notes": "Includes laundry room and garage entry walkway connecting off Family Room.", "room_type": "room", "width": 280, "x": 565, "y": 370}, {"entryways": [{"id": "door_play_storage", "offset": 40, "target_room": "Storage Room", "type": "door", "wall": "right", "width": 40}, {"id": "door_play_bbath", "offset": 235, "target_room": "Basement Bathroom", "type": "door", "wall": "right", "width": 36}, {"id": "arch_play_theater", "offset": 375, "target_room": "Basement Theater", "type": "open_passage", "wall": "right", "width": 110}], "floor": "basement", "height": 495, "id": "basement_play_area", "name": "Basement Play Area", "notes": "Main basement recreation room with west fireplace and south alcoves; connects to Storage and Theater.", "room_type": "room", "width": 415, "x": 220, "y": 40}, {"entryways": [{"id": "door_storage_play", "offset": 40, "target_room": "Basement Play Area", "type": "door", "wall": "left", "width": 40}], "floor": "basement", "height": 185, "id": "storage_room", "name": "Storage Room", "notes": "Upper northeast wet bar / storage area; door connects to Recreation Room.", "room_type": "room", "width": 145, "x": 635, "y": 40}, {"entryways": [{"id": "door_bbath_play", "offset": 10, "target_room": "Basement Play Area", "type": "door", "wall": "left", "width": 36}], "floor": "basement", "height": 145, "id": "basement_bathroom", "name": "Basement Bathroom", "notes": "Full basement bathroom off recreation hallway.", "room_type": "transit", "width": 145, "x": 635, "y": 225}, {"entryways": [{"id": "arch_theater_play", "offset": 5, "target_room": "Basement Play Area", "type": "open_passage", "wall": "left", "width": 110}], "floor": "basement", "height": 165, "id": "basement_theater", "name": "Basement Theater", "notes": "Lower northeast basement hallway / media lounge and stair exit.", "room_type": "room", "width": 145, "x": 635, "y": 370}], "sensors": [{"entity_id": "binary_sensor.family_room_motion", "floor": "main", "fov_deg": 90, "heading_deg": 225, "host_room": "Family Room", "id": "binary_sensor.family_room_motion", "name": "Family Room PIR (Ring)", "range_px": 260, "sensor_type": "pir_motion", "x": 825, "y": 350}, {"entity_id": "binary_sensor.family_room_motion_4", "floor": "main", "fov_deg": 110, "heading_deg": 170, "host_room": "Family Room", "id": "binary_sensor.family_room_motion_4", "name": "Family/Kitchen PIR (Ecobee)", "range_px": 230, "sensor_type": "pir_motion", "x": 575, "y": 145}, {"entity_id": "binary_sensor.thermostat_motion", "floor": "main", "fov_deg": 110, "heading_deg": 180, "host_room": "Dining Room", "id": "binary_sensor.thermostat_motion", "name": "Main Thermostat PIR", "range_px": 180, "sensor_type": "pir_motion", "x": 310, "y": 220}, {"entity_id": "binary_sensor.keypad_motion", "floor": "main", "fov_deg": 100, "heading_deg": 300, "host_room": "Front Entry", "id": "binary_sensor.keypad_motion", "name": "Front Entry Keypad PIR", "range_px": 170, "sensor_type": "pir_motion", "x": 415, "y": 525}, {"entity_id": "binary_sensor.ratgdov25i_47a250_motion", "floor": "main", "fov_deg": 100, "heading_deg": 90, "host_room": "Garage", "id": "binary_sensor.ratgdov25i_47a250_motion", "name": "Garage Opener PIR", "range_px": 170, "sensor_type": "pir_motion", "x": 700, "y": 400}, {"entity_id": "binary_sensor.master_bedroom_motion", "floor": "upstairs", "fov_deg": 110, "heading_deg": 0, "host_room": "Master Bedroom", "id": "binary_sensor.master_bedroom_motion", "name": "Master Bedroom PIR (Ecobee)", "range_px": 220, "sensor_type": "pir_motion", "x": 150, "y": 280}, {"entity_id": "binary_sensor.nursery_motion", "floor": "upstairs", "fov_deg": 110, "heading_deg": 315, "host_room": "Margot's Room", "id": "binary_sensor.nursery_motion", "name": "Nursery PIR (Ecobee)", "range_px": 210, "sensor_type": "pir_motion", "x": 380, "y": 230}, {"entity_id": "binary_sensor.guest_room_motion", "floor": "upstairs", "fov_deg": 110, "heading_deg": 140, "host_room": "Guest Room", "id": "binary_sensor.guest_room_motion", "name": "Guest Room PIR (Ecobee)", "range_px": 240, "sensor_type": "pir_motion", "x": 850, "y": 55}, {"entity_id": "binary_sensor.office_motion", "floor": "upstairs", "fov_deg": 110, "heading_deg": 145, "host_room": "Office", "id": "binary_sensor.office_motion", "name": "Office PIR (Ecobee)", "range_px": 230, "sensor_type": "pir_motion", "x": 850, "y": 275}, {"entity_id": "binary_sensor.upper_level_keypad_motion", "floor": "upstairs", "fov_deg": 120, "heading_deg": 90, "host_room": "Upstairs Hallway & Stairs", "id": "binary_sensor.upper_level_keypad_motion", "name": "Upstairs Hallway Keypad PIR", "range_px": 150, "sensor_type": "pir_motion", "x": 485, "y": 260}, {"entity_id": "binary_sensor.motion_detector_basement1", "floor": "basement", "fov_deg": 100, "heading_deg": 140, "host_room": "Basement Theater", "id": "binary_sensor.motion_detector_basement1", "name": "Basement Theater PIR (Ring)", "range_px": 200, "sensor_type": "pir_motion", "x": 765, "y": 385}, {"entity_id": "binary_sensor.motion_sensor_gen2_motion_detection", "floor": "basement", "fov_deg": 105, "heading_deg": 45, "host_room": "Basement Play Area", "id": "binary_sensor.motion_sensor_gen2_motion_detection", "name": "Basement Play Area PIR (Z-Wave)", "range_px": 300, "sensor_type": "pir_motion", "x": 235, "y": 60}, {"entity_id": "binary_sensor.basement_motion", "floor": "basement", "fov_deg": 110, "heading_deg": 270, "host_room": "Basement Play Area", "id": "binary_sensor.basement_motion", "name": "Basement PIR (Ecobee)", "range_px": 260, "sensor_type": "pir_motion", "x": 420, "y": 515}, {"entity_id": "binary_sensor.motion_utility_room", "floor": "basement", "fov_deg": 100, "heading_deg": 135, "host_room": "Storage Room", "id": "binary_sensor.motion_utility_room", "name": "Storage / Gym PIR", "range_px": 180, "sensor_type": "pir_motion", "x": 765, "y": 55}, {"door_id": "door_front_entry", "entity_id": "binary_sensor.front_door", "floor": "main", "host_room": "Front Entry", "id": "binary_sensor.front_door", "name": "Front Door Contact", "sensor_type": "door_contact", "x": 477, "y": 545}, {"door_id": "door_fr_laundry", "entity_id": "binary_sensor.utility_room_door", "floor": "main", "host_room": "Family Room", "id": "binary_sensor.utility_room_door", "name": "Laundry / Garage Door Contact", "sensor_type": "door_contact", "x": 625, "y": 370}, {"entity_id": "binary_sensor.back_door", "floor": "main", "host_room": "Kitchen", "id": "binary_sensor.back_door", "name": "Back Patio Door Contact", "sensor_type": "door_contact", "x": 520, "y": 120}, {"entity_id": "binary_sensor.garage_side_door", "floor": "main", "host_room": "Garage", "id": "binary_sensor.garage_side_door", "name": "Garage Side Door Contact", "sensor_type": "door_contact", "x": 845, "y": 450}, {"entity_id": "cover.garage_door", "floor": "main", "host_room": "Garage", "id": "cover.garage_door", "name": "Garage Roll-Up Door", "sensor_type": "door_contact", "x": 705, "y": 545}], "version": 2};

const PDD_DEFAULT_COMPILED_TOPOLOGY = {"ambiguities": [{"camera_id": "camera.living_room", "category": "camera_spillover", "description": "`camera.living_room` (hosted in Living Room) also sees Front Entry. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Living Room occupied.", "resolution": "Downgrade binary_sensor.living_room_person_occupancy to `supporting` and trigger Living Room only from interior Frigate sub-zones.", "rooms": ["Living Room", "Front Entry"], "severity": "high", "title": "Living Room Camera cone spills into Front Entry"}, {"camera_id": "camera.dining_room", "category": "camera_spillover", "description": "`camera.dining_room` (hosted in Dining Room) also sees Living Room. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Dining Room occupied.", "resolution": "Downgrade whole-frame camera person to `supporting` and trigger Dining Room only from interior Frigate sub-zones.", "rooms": ["Dining Room", "Living Room"], "severity": "high", "title": "Dining Room Camera cone spills into Living Room"}, {"camera_id": "camera.family_room", "category": "camera_spillover", "description": "`camera.family_room` (hosted in Family Room) also sees Kitchen, Front Entry. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Family Room occupied.", "resolution": "Downgrade binary_sensor.family_room_person_occupancy to `supporting` and trigger Family Room only from interior Frigate sub-zones.", "rooms": ["Family Room", "Kitchen", "Front Entry"], "severity": "high", "title": "Family Room Camera cone spills into Kitchen, Front Entry"}, {"camera_id": "camera.master_bedroom", "category": "camera_spillover", "description": "`camera.master_bedroom` (hosted in Master Bedroom) also sees Master Bathroom, Upstairs Hallway & Stairs. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Master Bedroom occupied.", "resolution": "Downgrade binary_sensor.master_bedroom_person_occupancy, binary_sensor.master_bedroom_entryway_person_occupancy to `supporting` and trigger Master Bedroom only from interior Frigate sub-zones.", "rooms": ["Master Bedroom", "Master Bathroom", "Upstairs Hallway & Stairs"], "severity": "high", "title": "Master Bedroom Camera cone spills into Master Bathroom, Upstairs Hallway & Stairs"}, {"camera_id": "camera.office", "category": "camera_spillover", "description": "`camera.office` (hosted in Office) also sees Upstairs Hallway & Stairs. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Office occupied.", "resolution": "Downgrade binary_sensor.office_person_occupancy, binary_sensor.office_entryway_person_occupancy to `supporting` and trigger Office only from interior Frigate sub-zones.", "rooms": ["Office", "Upstairs Hallway & Stairs"], "severity": "high", "title": "Office Camera cone spills into Upstairs Hallway & Stairs"}, {"camera_id": "camera.basement_theater", "category": "camera_spillover", "description": "`camera.basement_theater` (hosted in Basement Theater) also sees Basement Play Area. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Basement Theater occupied.", "resolution": "Downgrade binary_sensor.basement_theater_person_occupancy, binary_sensor.basement_stairwell_person_occupancy to `supporting` and trigger Basement Theater only from interior Frigate sub-zones.", "rooms": ["Basement Theater", "Basement Play Area"], "severity": "high", "title": "Basement Theater Camera cone spills into Basement Play Area"}, {"camera_id": "camera.basement_play_area", "category": "camera_spillover", "description": "`camera.basement_play_area` (hosted in Basement Play Area) also sees Basement Theater. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Basement Play Area occupied.", "resolution": "Downgrade binary_sensor.basement_play_area_person_occupancy, binary_sensor.basement_stairwell_person_occupancy to `supporting` and trigger Basement Play Area only from interior Frigate sub-zones.", "rooms": ["Basement Play Area", "Basement Theater"], "severity": "high", "title": "Basement Play Area Camera cone spills into Basement Theater"}, {"camera_id": null, "category": "blind_pocket", "description": "Guest Room sits between Margot's Room and Office off the Upstairs Hallway with no camera view cone and its Ecobee sensor awaiting battery replacement.", "resolution": "Use `guest_room_motion` (moderate) + `guest_room_occupancy` (supporting) + BLE corroboration, with instant timer hand-off to Office, Nursery, and Master Bedroom.", "rooms": ["Guest Room", "Margot's Room", "Office"], "severity": "medium", "title": "Guest Room (between Nursery & Office) has zero camera coverage"}, {"camera_id": "camera.basement_play_area", "category": "blind_pocket", "description": "Located to the left of `camera.basement_play_area` alongside Storage Room, with an unmonitored door and no interior sensors.", "resolution": "Treat left edge exit from Basement Play Area as an unsealed transition; Storage Room uses its internal `camera.storage_room` to distinguish gym/storage entry.", "rooms": ["Basement Play Area", "Storage Room"], "severity": "low", "title": "Basement Bathroom is out of frame left of Play Area camera"}, {"camera_id": null, "category": "vertical_ble_bleed", "description": "Master Bedroom (Upstairs) sits directly over Dining Room (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.", "resolution": "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor.", "rooms": ["Master Bedroom", "Dining Room"], "severity": "medium", "title": "Vertical BLE stack: Master Bedroom directly above Dining Room (100% overlap)"}, {"camera_id": null, "category": "vertical_ble_bleed", "description": "Master Bedroom (Upstairs) sits directly over Living Room (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.", "resolution": "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor.", "rooms": ["Master Bedroom", "Living Room"], "severity": "medium", "title": "Vertical BLE stack: Master Bedroom directly above Living Room (83% overlap)"}, {"camera_id": null, "category": "vertical_ble_bleed", "description": "Master Bathroom (Upstairs) sits directly over Front Entry (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.", "resolution": "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor.", "rooms": ["Master Bathroom", "Front Entry"], "severity": "medium", "title": "Vertical BLE stack: Master Bathroom directly above Front Entry (75% overlap)"}, {"camera_id": null, "category": "vertical_ble_bleed", "description": "Upstairs Bathroom (Upstairs) sits directly over Front Entry (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.", "resolution": "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor.", "rooms": ["Upstairs Bathroom", "Front Entry"], "severity": "medium", "title": "Vertical BLE stack: Upstairs Bathroom directly above Front Entry (59% overlap)"}, {"camera_id": null, "category": "vertical_ble_bleed", "description": "Upstairs Bathroom (Upstairs) sits directly over Garage (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.", "resolution": "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor.", "rooms": ["Upstairs Bathroom", "Garage"], "severity": "medium", "title": "Vertical BLE stack: Upstairs Bathroom directly above Garage (41% overlap)"}, {"camera_id": null, "category": "vertical_ble_bleed", "description": "Margot's Room (Upstairs) sits directly over Kitchen (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.", "resolution": "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor.", "rooms": ["Margot's Room", "Kitchen"], "severity": "medium", "title": "Vertical BLE stack: Margot's Room directly above Kitchen (53% overlap)"}, {"camera_id": null, "category": "vertical_ble_bleed", "description": "Guest Room (Upstairs) sits directly over Family Room (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.", "resolution": "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor.", "rooms": ["Guest Room", "Family Room"], "severity": "medium", "title": "Vertical BLE stack: Guest Room directly above Family Room (55% overlap)"}, {"camera_id": null, "category": "vertical_ble_bleed", "description": "Office (Upstairs) sits directly over Family Room (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.", "resolution": "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor.", "rooms": ["Office", "Family Room"], "severity": "medium", "title": "Vertical BLE stack: Office directly above Family Room (40% overlap)"}, {"camera_id": null, "category": "vertical_ble_bleed", "description": "Office (Upstairs) sits directly over Garage (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.", "resolution": "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor.", "rooms": ["Office", "Garage"], "severity": "medium", "title": "Vertical BLE stack: Office directly above Garage (82% overlap)"}], "ble_proxy_analysis": [{"area_name": "Living Room", "floor": "main", "host_room": "Living Room", "id": "living_room_speaker", "name": "Living Room Speaker BLE Proxy", "radius_px": 190.0, "reachable_rooms": ["Dining Room", "Living Room", "Kitchen", "Front Entry"], "x": 260.0, "y": 435.0}, {"area_name": "Family Room", "floor": "main", "host_room": "Family Room", "id": "family_room_speaker", "name": "Family Room Speaker BLE Proxy", "radius_px": 210.0, "reachable_rooms": ["Kitchen", "Front Entry", "Family Room", "Garage"], "x": 710.0, "y": 240.0}, {"area_name": "Master Bedroom", "floor": "upstairs", "host_room": "Master Bedroom", "id": "master_bedroom_speaker", "name": "Master Bedroom Speaker BLE Proxy", "radius_px": 210.0, "reachable_rooms": ["Master Bedroom", "Margot's Room", "Upstairs Hallway & Stairs"], "x": 230.0, "y": 180.0}, {"area_name": "Margot's Room", "floor": "upstairs", "host_room": "Margot's Room", "id": "nursery_speaker", "name": "Nursery Speaker BLE Proxy", "radius_px": 180.0, "reachable_rooms": ["Master Bedroom", "Margot's Room", "Guest Room", "Office", "Upstairs Hallway & Stairs"], "x": 480.0, "y": 135.0}, {"area_name": "Office", "floor": "upstairs", "host_room": "Office", "id": "office_speaker", "name": "Office Speaker BLE Proxy", "radius_px": 195.0, "reachable_rooms": ["Upstairs Bathroom", "Guest Room", "Office", "Upstairs Hallway & Stairs"], "x": 745.0, "y": 395.0}, {"area_name": "Basement Play Area", "floor": "basement", "host_room": "Basement Play Area", "id": "basement_speaker", "name": "Basement Speaker BLE Proxy", "radius_px": 260.0, "reachable_rooms": ["Basement Play Area", "Storage Room", "Basement Bathroom", "Basement Theater"], "x": 450.0, "y": 310.0}], "camera_analysis": [{"camera_id": "camera.living_room", "floor": "main", "has_multi_room_bleed": true, "host_room": "Living Room", "name": "Living Room Camera", "spillover_targets": [{"overlap_pct": 38.0, "room_name": "Front Entry"}], "sub_zones": [{"entity_id": "binary_sensor.living_room_couch_person_occupancy", "height": 115, "id": "living_room_couch", "label": "Living Room Couch", "room": "Living Room", "width": 95, "x": 170, "y": 370}, {"entity_id": "binary_sensor.living_room_floor_person_occupancy", "height": 110, "id": "living_room_floor", "label": "Living Room Floor", "room": "Living Room", "width": 90, "x": 270, "y": 380}, {"entity_id": "binary_sensor.living_room_bay_windows_person_occupancy", "height": 42, "id": "living_room_bay_windows", "label": "Bay Windows", "room": "Living Room", "width": 140, "x": 175, "y": 495}, {"entity_id": "binary_sensor.living_room_entry_person_occupancy", "height": 95, "id": "living_room_entry", "label": "Front Entry Archway", "room": "Front Entry", "width": 70, "x": 380, "y": 365}], "visibility_polygon": [[175.0, 530.0], [452.67, 316.93], [458.07, 324.16], [463.29, 331.53], [468.31, 339.03], [469.65, 341.1], [469.71, 341.2], [469.78, 341.3], [473.13, 346.65], [477.76, 354.4], [479.78, 357.93], [479.84, 358.04], [479.9, 358.14], [482.19, 362.26], [484.75, 367.04], [484.81, 367.15], [484.86, 367.26], [486.41, 370.24], [487.99, 373.37], [488.05, 373.47], [488.1, 373.58], [490.43, 378.32], [494.23, 386.5], [497.82, 394.78], [498.76, 397.04], [498.81, 397.16], [498.86, 397.27], [499.92, 399.9], [499.97, 400.01], [500.01, 400.13], [501.2, 403.15], [502.98, 407.83], [503.03, 407.94], [503.07, 408.06], [504.36, 411.6], [505.71, 415.4], [505.75, 415.51], [505.79, 415.63], [506.29, 417.09], [506.33, 417.21], [506.37, 417.32], [507.31, 420.13], [510.03, 428.73], [512.53, 437.4], [514.8, 446.14], [516.85, 454.92], [517.88, 459.74], [395.0, 485.0], [395.0, 485.08], [395.0, 487.6], [395.0, 493.45], [395.0, 499.26], [395.0, 505.02], [395.0, 510.75], [395.0, 516.46], [395.0, 522.14], [395.0, 527.82], [395.0, 533.49], [395.0, 538.38], [395.0, 538.46], [395.0, 538.54], [395.0, 539.17], [395.0, 540.08], [395.0, 540.15], [395.0, 540.23], [395.0, 541.71], [395.0, 541.79], [395.0, 541.86], [395.0, 544.86], [395.0, 544.92], [395.0, 545.0], [393.87, 545.0], [335.45, 545.0], [300.45, 545.0], [277.88, 545.0], [262.09, 545.0], [250.41, 545.0], [241.41, 545.0], [234.26, 545.0], [228.43, 545.0], [223.58, 545.0], [219.48, 545.0], [215.96, 545.0], [212.9, 545.0], [210.22, 545.0], [207.85, 545.0], [205.72, 545.0], [203.81, 545.0]], "zones": ["living_room_couch", "living_room_floor", "living_room_bay_windows", "living_room_entry"]}, {"camera_id": "camera.dining_room", "floor": "main", "has_multi_room_bleed": true, "host_room": "Dining Room", "name": "Dining Room Camera", "spillover_targets": [{"overlap_pct": 18.0, "room_name": "Living Room"}], "sub_zones": [{"entity_id": "binary_sensor.dining_room_table_person_occupancy", "height": 110, "id": "dining_room_table", "label": "Dining Table", "room": "Dining Room", "width": 110, "x": 185, "y": 175}, {"entity_id": "binary_sensor.rileys_food_person_occupancy", "height": 44, "id": "rileys_food", "label": "Riley's Food Corner", "room": "Dining Room", "width": 70, "x": 240, "y": 128}], "visibility_polygon": [[175.0, 135.0], [303.95, 337.41], [298.66, 340.69], [293.28, 343.83], [287.82, 346.83], [282.29, 349.68], [276.68, 352.39], [271.01, 354.96], [265.27, 357.38], [259.47, 359.64], [253.62, 361.76], [247.71, 363.72], [241.75, 365.53], [235.75, 367.18], [229.71, 368.68], [223.62, 370.02], [217.51, 371.2], [211.37, 372.23], [205.2, 373.09], [199.02, 373.8], [192.81, 374.34], [186.6, 374.72], [181.4, 374.91], [180.0, 325.0], [179.93, 325.0], [179.26, 325.0], [174.33, 325.0], [169.4, 325.0], [164.46, 325.0], [160.07, 325.0], [160.0, 325.0], [160.0, 324.16], [160.0, 318.93], [160.0, 274.24], [160.0, 246.9], [160.0, 228.42], [160.0, 215.09], [160.0, 205.0], [160.0, 197.09], [160.0, 190.72], [160.0, 185.46], [160.0, 181.05], [160.0, 177.3], [160.0, 174.05], [160.0, 171.21]], "zones": ["dining_room_table", "rileys_food"]}, {"camera_id": "camera.family_room", "floor": "main", "has_multi_room_bleed": true, "host_room": "Family Room", "name": "Family Room Camera", "spillover_targets": [{"overlap_pct": 51.0, "room_name": "Kitchen"}, {"overlap_pct": 18.0, "room_name": "Front Entry"}], "sub_zones": [{"entity_id": "binary_sensor.family_room_couch_person_occupancy", "height": 120, "id": "family_room_couch", "label": "Family Room Couch", "room": "Family Room", "width": 135, "x": 665, "y": 185}, {"entity_id": "binary_sensor.family_room_recliner_person_occupancy", "height": 75, "id": "family_room_recliner", "label": "Family Room Recliner", "room": "Family Room", "width": 80, "x": 585, "y": 135}, {"entity_id": "binary_sensor.family_room_floor_person_occupancy", "height": 115, "id": "family_room_floor", "label": "Family Room Floor", "room": "Family Room", "width": 85, "x": 580, "y": 215}, {"entity_id": "binary_sensor.kitchen_island_person_occupancy", "height": 110, "id": "kitchen_island", "label": "Kitchen Island", "room": "Kitchen", "width": 110, "x": 445, "y": 175}], "visibility_polygon": [[830.0, 135.0], [565.0, 338.34], [565.0, 335.15], [565.0, 335.0], [565.0, 334.86], [565.0, 327.53], [565.0, 325.14], [565.0, 325.0], [565.0, 324.86], [565.0, 317.13], [565.0, 310.13], [565.0, 310.0], [542.07, 325.0], [537.43, 325.0], [519.95, 325.0], [500.91, 325.0], [495.27, 325.0], [495.0, 325.0], [464.6, 342.08], [460.9, 335.41], [455.78, 325.68], [455.27, 324.68], [455.21, 324.55], [455.14, 324.42], [450.91, 315.81], [446.31, 305.83], [445.17, 303.25], [445.11, 303.11], [445.05, 302.98], [441.97, 295.73], [437.9, 285.51], [436.48, 281.76], [436.43, 281.63], [436.37, 281.49], [434.69, 276.87], [434.64, 276.73], [434.59, 276.6], [434.09, 275.2], [430.56, 264.79], [430.44, 264.42], [430.39, 264.28], [430.35, 264.14], [427.3, 254.29], [424.31, 243.7], [421.6, 233.05], [419.18, 222.32], [417.03, 211.54], [415.17, 200.7], [413.59, 189.82], [412.3, 178.9], [411.29, 167.95], [410.58, 156.98], [410.14, 145.99], [410.08, 143.07], [565.0, 140.0], [565.0, 139.91], [565.0, 137.69], [565.0, 137.6], [565.0, 137.51], [565.0, 135.0], [565.0, 128.06], [565.0, 127.3], [565.0, 127.21], [565.0, 127.11], [565.0, 121.11], [565.0, 120.09], [565.0, 120.0], [566.63, 120.0], [639.41, 120.0], [687.28, 120.0], [716.06, 120.0], [735.29, 120.0], [749.07, 120.0], [759.43, 120.0], [767.52, 120.0], [774.02, 120.0], [779.36, 120.0], [783.83, 120.0], [787.64, 120.0], [790.92, 120.0], [793.79, 120.0], [796.31, 120.0], [798.55, 120.0], [800.56, 120.0], [802.37, 120.0], [804.02, 120.0], [805.52, 120.0], [806.9, 120.0], [808.17, 120.0], [809.35, 120.0], [810.45, 120.0]], "zones": ["family_room_couch", "family_room_recliner", "family_room_floor", "kitchen_island"]}, {"camera_id": "camera.garage", "floor": "main", "has_multi_room_bleed": false, "host_room": "Garage", "name": "Garage Camera", "spillover_targets": [], "sub_zones": [{"entity_id": "binary_sensor.garage_parking_person_occupancy", "height": 125, "id": "garage_parking", "label": "Garage Parking Bay", "room": "Garage", "width": 140, "x": 615, "y": 410}], "visibility_polygon": [[680.0, 390.0], [770.09, 534.17], [766.31, 536.46], [762.48, 538.65], [758.59, 540.74], [754.65, 542.73], [750.65, 544.62], [746.02, 545.0], [741.31, 545.0], [736.7, 545.0], [732.18, 545.0], [727.73, 545.0], [723.36, 545.0], [719.05, 545.0], [714.79, 545.0], [710.59, 545.0], [706.42, 545.0], [702.3, 545.0], [698.2, 545.0], [694.13, 545.0], [690.08, 545.0], [686.04, 545.0], [682.01, 545.0], [677.99, 545.0], [673.96, 545.0], [669.92, 545.0], [665.87, 545.0], [661.8, 545.0], [657.7, 545.0], [653.58, 545.0], [649.41, 545.0], [645.21, 545.0], [640.95, 545.0], [636.64, 545.0], [632.27, 545.0], [627.82, 545.0], [623.3, 545.0], [618.69, 545.0], [613.98, 545.0], [609.35, 544.62], [605.35, 542.73], [601.41, 540.74], [597.52, 538.65], [593.69, 536.46], [589.91, 534.17]], "zones": ["garage_parking"]}, {"camera_id": "camera.master_bedroom", "floor": "upstairs", "has_multi_room_bleed": true, "host_room": "Master Bedroom", "name": "Master Bedroom Camera", "spillover_targets": [{"overlap_pct": 18.0, "room_name": "Master Bathroom"}, {"overlap_pct": 18.0, "room_name": "Upstairs Hallway & Stairs"}], "sub_zones": [{"entity_id": "binary_sensor.master_bed_person_occupancy", "height": 130, "id": "master_bed", "label": "Master Bed", "room": "Master Bedroom", "width": 130, "x": 145, "y": 95}, {"entity_id": "binary_sensor.master_open_area_person_occupancy", "height": 140, "id": "master_open_area", "label": "Master Open Floor", "room": "Master Bedroom", "width": 130, "x": 155, "y": 240}, {"entity_id": "binary_sensor.master_bedroom_walkway_person_occupancy", "height": 180, "id": "master_bedroom_walkway", "label": "Master Walkway", "room": "Master Bedroom", "width": 65, "x": 290, "y": 175}, {"entity_id": "binary_sensor.master_bedroom_entryway_person_occupancy", "height": 60, "id": "master_bedroom_entryway", "label": "Master Hallway Entry", "room": "Master Bedroom", "width": 45, "x": 315, "y": 250}, {"entity_id": "binary_sensor.master_bathroom_person_occupancy", "height": 60, "id": "master_bathroom", "label": "Master Bath Doorway", "room": "Master Bathroom", "width": 45, "x": 340, "y": 380}], "visibility_polygon": [[150.0, 50.0], [360.0, 166.4], [360.0, 168.6], [360.0, 168.7], [360.0, 168.79], [360.0, 173.61], [360.0, 181.03], [360.0, 188.7], [360.0, 196.64], [360.0, 200.54], [360.0, 200.65], [360.0, 200.76], [360.0, 204.87], [360.0, 205.62], [360.0, 205.73], [360.0, 205.84], [360.0, 213.42], [360.0, 214.49], [360.0, 214.61], [360.0, 214.73], [360.0, 222.31], [360.0, 227.57], [360.0, 227.69], [360.0, 227.82], [360.0, 229.87], [360.0, 230.0], [360.0, 230.13], [360.0, 231.6], [360.0, 241.31], [360.0, 247.86], [360.0, 248.0], [360.0, 248.14], [360.0, 249.86], [360.0, 250.0], [360.0, 250.14], [360.0, 251.49], [360.0, 262.18], [360.0, 264.85], [360.0, 265.0], [472.1, 380.0], [460.13, 380.0], [460.01, 380.0], [459.8, 380.0], [459.58, 380.0], [444.44, 380.0], [429.46, 380.0], [421.96, 380.0], [360.0, 305.0], [360.0, 305.18], [360.0, 311.39], [360.0, 325.7], [360.0, 341.01], [360.0, 343.78], [360.0, 344.0], [360.0, 344.22], [360.0, 357.46], [360.0, 375.21], [360.0, 379.75], [360.0, 380.0], [360.0, 380.25], [360.0, 394.44], [360.0, 394.73], [360.0, 395.0], [399.43, 460.1], [389.19, 466.16], [380.0, 471.31], [360.0, 435.0], [360.0, 435.32], [360.0, 438.27], [360.0, 463.47], [356.22, 483.44], [344.95, 488.63], [339.24, 491.12], [339.08, 491.19], [338.93, 491.26], [333.54, 493.52], [322.02, 498.12], [310.37, 502.42], [298.62, 506.41], [286.77, 510.1], [274.83, 513.48], [262.81, 516.56], [250.71, 519.32], [238.54, 521.76], [226.31, 523.89], [214.04, 525.71], [201.72, 527.21], [189.36, 528.38], [176.98, 529.24], [164.58, 529.78], [152.17, 530.0], [139.76, 529.89], [135.48, 529.78], [135.31, 529.78], [135.15, 529.77], [135.0, 367.64], [135.0, 254.99], [135.0, 201.17], [135.0, 169.61], [135.0, 148.84], [135.0, 134.12], [135.0, 123.12], [135.0, 114.59], [135.0, 107.77], [135.0, 102.18], [135.0, 97.52], [135.0, 93.56]], "zones": ["master_bed", "master_open_area", "master_bedroom_walkway", "master_bedroom_entryway", "master_bathroom"]}, {"camera_id": "camera.nursery", "floor": "upstairs", "has_multi_room_bleed": false, "host_room": "Margot's Room", "name": "Nursery Camera", "spillover_targets": [], "sub_zones": [{"entity_id": "binary_sensor.nursery_bed_person_occupancy", "height": 110, "id": "nursery_bed", "label": "Nursery Bed", "room": "Margot's Room", "width": 120, "x": 380, "y": 60}], "visibility_polygon": [[550.0, 230.0], [360.0, 187.88], [360.0, 182.63], [360.0, 177.31], [360.0, 171.91], [360.0, 166.43], [360.0, 160.85], [360.0, 155.16], [360.0, 149.35], [360.0, 143.41], [360.0, 137.33], [360.0, 131.09], [360.0, 124.68], [360.0, 118.08], [360.0, 111.27], [360.0, 104.24], [360.0, 96.96], [360.0, 89.41], [360.0, 81.56], [360.0, 73.38], [360.0, 64.84], [360.0, 55.9], [360.0, 46.52], [360.0, 36.65], [360.0, 35.14], [360.0, 35.0], [360.13, 35.0], [368.16, 35.0], [377.48, 35.0], [386.38, 35.0], [394.89, 35.0], [403.06, 35.0], [410.91, 35.0], [418.47, 35.0], [425.77, 35.0], [432.83, 35.0], [439.67, 35.0], [446.32, 35.0], [452.78, 35.0], [459.07, 35.0], [465.21, 35.0], [471.21, 35.0], [477.09, 35.0], [482.86, 35.0], [488.52, 35.0], [494.08, 35.0], [499.57, 35.0], [504.98, 35.0], [510.33, 35.0], [515.62, 35.0], [520.86, 35.0], [526.06, 35.0], [531.22, 35.0], [536.36, 35.0], [541.49, 35.0]], "zones": ["nursery_bed"]}, {"camera_id": "camera.office", "floor": "upstairs", "has_multi_room_bleed": true, "host_room": "Office", "name": "Office Camera", "spillover_targets": [{"overlap_pct": 18.0, "room_name": "Upstairs Hallway & Stairs"}], "sub_zones": [{"entity_id": "binary_sensor.steves_desk_person_occupancy", "height": 95, "id": "steves_desk", "label": "Steve's Desk", "room": "Office", "width": 110, "x": 725, "y": 360}, {"entity_id": "binary_sensor.sim_rig_person_occupancy", "height": 100, "id": "sim_rig", "label": "Sim Rig", "room": "Office", "width": 85, "x": 635, "y": 410}, {"entity_id": "binary_sensor.office_floor_person_occupancy", "height": 95, "id": "office_floor", "label": "Office Center Floor", "room": "Office", "width": 120, "x": 655, "y": 300}, {"entity_id": "binary_sensor.office_entryway_person_occupancy", "height": 55, "id": "office_entryway", "label": "Office Doorway", "room": "Office", "width": 55, "x": 610, "y": 260}], "visibility_polygon": [[855.0, 525.0], [610.0, 383.55], [610.0, 380.12], [610.0, 380.0], [610.0, 379.88], [610.0, 374.97], [610.0, 366.12], [610.0, 356.97], [610.0, 347.48], [610.0, 337.63], [610.0, 327.39], [610.0, 324.02], [610.0, 323.88], [610.0, 323.74], [611.2, 317.73], [614.41, 314.02], [614.48, 313.93], [614.55, 313.85], [616.64, 311.49], [619.4, 308.46], [619.47, 308.38], [619.55, 308.29], [622.24, 305.4], [628.0, 299.46], [633.22, 294.32], [633.3, 294.25], [633.38, 294.17], [633.9, 293.66], [637.68, 290.11], [637.77, 290.03], [637.85, 289.96], [639.96, 288.03], [642.05, 286.14], [642.13, 286.07], [642.22, 285.99], [646.16, 282.55], [652.49, 277.23], [657.82, 272.97], [657.91, 272.9], [657.99, 272.83], [658.97, 272.07], [665.57, 267.09], [672.3, 262.28], [679.16, 257.64], [680.34, 256.87], [680.43, 256.81], [680.53, 256.75], [686.13, 253.19], [693.85, 250.0], [703.26, 250.0], [712.41, 250.0], [721.31, 250.0], [730.0, 250.0], [738.48, 250.0], [746.78, 250.0], [754.91, 250.0], [762.89, 250.0], [770.73, 250.0], [778.45, 250.0], [786.06, 250.0], [793.57, 250.0], [800.99, 250.0], [808.34, 250.0], [815.63, 250.0], [822.86, 250.0], [830.04, 250.0], [837.2, 250.0], [844.33, 250.0], [851.44, 250.0], [858.56, 250.0], [865.67, 250.0], [869.9, 250.0], [870.0, 250.0], [870.0, 251.75], [870.0, 293.28], [870.0, 359.7], [870.0, 396.67], [870.0, 420.24], [870.0, 436.59], [870.0, 448.62], [870.0, 457.85], [870.0, 465.17], [870.0, 471.11], [870.0, 476.05], [870.0, 480.22], [870.0, 483.79]], "zones": ["steves_desk", "sim_rig", "office_floor", "office_entryway"]}, {"camera_id": "camera.basement_theater", "floor": "basement", "has_multi_room_bleed": true, "host_room": "Basement Theater", "name": "Basement Theater Camera", "spillover_targets": [{"overlap_pct": 18.0, "room_name": "Basement Play Area"}], "sub_zones": [{"entity_id": "binary_sensor.basement_theater_couch_person_occupancy", "height": 90, "id": "basement_theater_couch", "label": "Theater Couch", "room": "Basement Theater", "width": 110, "x": 650, "y": 430}, {"entity_id": "binary_sensor.basement_theater_playpen_person_occupancy", "height": 55, "id": "basement_theater_playpen", "label": "Theater Playpen", "room": "Basement Theater", "width": 85, "x": 645, "y": 375}, {"entity_id": "binary_sensor.basement_theater_floor_person_occupancy", "height": 85, "id": "basement_theater_floor", "label": "Theater Floor", "room": "Basement Theater", "width": 95, "x": 635, "y": 395}, {"entity_id": "binary_sensor.basement_bar_person_occupancy", "height": 95, "id": "basement_bar", "label": "Basement Wet Bar", "room": "Basement Play Area", "width": 110, "x": 520, "y": 360}, {"entity_id": "binary_sensor.basement_play_area_far_person_occupancy", "height": 140, "id": "basement_play_area_far", "label": "Play Area East", "room": "Basement Play Area", "width": 160, "x": 440, "y": 280}, {"entity_id": "binary_sensor.basement_stairwell_person_occupancy", "height": 75, "id": "basement_stairwell", "label": "Basement Stairwell", "room": "Basement Play Area", "width": 95, "x": 535, "y": 450}], "visibility_polygon": [[765.0, 520.0], [635.0, 497.08], [635.0, 493.55], [635.0, 489.99], [635.0, 486.38], [635.0, 485.05], [635.0, 485.0], [427.07, 428.89], [428.56, 423.53], [431.2, 414.75], [434.07, 406.05], [437.16, 397.43], [440.49, 388.89], [444.03, 380.44], [447.79, 372.08], [451.77, 363.83], [455.97, 355.68], [460.38, 347.65], [464.99, 339.74], [469.81, 331.95], [474.84, 324.28], [480.06, 316.75], [485.48, 309.36], [491.09, 302.12], [492.64, 300.18], [635.0, 415.0], [635.0, 414.93], [635.0, 410.92], [635.0, 404.99], [635.0, 398.77], [635.0, 392.25], [635.0, 385.38], [635.0, 378.13], [635.0, 375.1], [635.0, 375.0], [635.0, 374.9], [635.0, 370.45], [635.0, 370.11], [635.0, 370.0], [635.09, 370.0], [641.35, 370.0], [647.81, 370.0], [654.01, 370.0], [659.97, 370.0], [665.72, 370.0], [671.27, 370.0], [671.63, 370.0], [671.7, 370.0], [671.77, 370.0], [676.64, 370.0], [681.85, 370.0], [685.34, 370.0], [685.41, 370.0], [685.48, 370.0], [686.62, 370.0], [686.69, 370.0], [686.75, 370.0], [686.91, 370.0], [691.84, 370.0], [696.52, 370.0], [696.58, 370.0], [696.64, 370.0], [696.64, 370.0], [698.84, 370.0], [698.9, 370.0], [698.96, 370.0], [701.33, 370.0], [705.91, 370.0], [710.4, 370.0], [714.81, 370.0], [716.19, 370.0], [716.25, 370.0], [716.31, 370.0], [719.14, 370.0], [720.62, 370.0], [720.68, 370.0], [720.74, 370.0], [723.4, 370.0], [724.32, 370.0], [724.37, 370.0], [724.43, 370.0], [727.6, 370.0], [731.75, 370.0], [735.84, 370.0], [739.9, 370.0], [743.92, 370.0], [747.91, 370.0], [751.88, 370.0], [755.83, 370.0], [759.76, 370.0], [763.69, 370.0], [767.62, 370.0], [769.64, 370.0], [769.69, 370.0], [769.74, 370.0], [771.55, 370.0], [772.57, 370.0], [772.63, 370.0], [772.68, 370.0], [775.49, 370.0], [779.44, 370.0], [779.95, 370.0], [780.0, 370.0], [780.0, 370.53], [780.0, 397.83], [780.0, 419.63], [780.0, 434.93]], "zones": ["basement_theater_couch", "basement_theater_playpen", "basement_theater_floor", "basement_bar", "basement_play_area_far", "basement_stairwell"]}, {"camera_id": "camera.basement_play_area", "floor": "basement", "has_multi_room_bleed": true, "host_room": "Basement Play Area", "name": "Basement Play Area Camera", "spillover_targets": [{"overlap_pct": 18.0, "room_name": "Basement Theater"}], "sub_zones": [{"entity_id": "binary_sensor.basement_play_floor_person_occupancy", "height": 220, "id": "basement_play_floor", "label": "Play Area Main Floor", "room": "Basement Play Area", "width": 220, "x": 260, "y": 240}, {"entity_id": "binary_sensor.basement_counter_person_occupancy", "height": 120, "id": "basement_counter", "label": "Play Area North Counter", "room": "Basement Play Area", "width": 180, "x": 250, "y": 70}, {"entity_id": "binary_sensor.theater_rear_view_person_occupancy", "height": 110, "id": "theater_rear_view", "label": "Theater Rear View", "room": "Basement Theater", "width": 110, "x": 635, "y": 380}], "visibility_polygon": [[235.0, 520.0], [635.0, 502.54], [635.0, 512.96], [635.0, 523.37], [635.0, 524.86], [635.0, 525.0], [635.0, 525.14], [635.0, 530.87], [635.0, 531.01], [635.0, 531.15], [635.0, 533.78], [635.0, 534.86], [635.0, 535.0], [631.3, 535.0], [482.74, 535.0], [407.98, 535.0], [367.74, 535.0], [342.57, 535.0], [325.32, 535.0], [312.74, 535.0], [303.15, 535.0], [295.6, 535.0], [289.48, 535.0], [284.41, 535.0], [280.15, 535.0], [276.51, 535.0], [273.36, 535.0], [270.6, 535.0], [268.16, 535.0], [265.98, 535.0], [264.03, 535.0], [262.27, 535.0], [260.66, 535.0], [259.19, 535.0], [257.84, 535.0], [256.6, 535.0], [255.44, 535.0], [254.36, 535.0], [253.36, 535.0], [252.41, 535.0], [251.52, 535.0], [250.68, 535.0], [249.89, 535.0], [249.13, 535.0], [248.41, 535.0], [247.72, 535.0], [247.07, 535.0], [246.44, 535.0], [245.83, 535.0], [245.25, 535.0], [244.69, 535.0], [244.14, 535.0], [243.61, 535.0], [243.1, 535.0], [242.61, 535.0], [242.12, 535.0], [241.65, 535.0], [241.19, 535.0], [240.73, 535.0], [240.29, 535.0], [239.86, 535.0], [239.43, 535.0], [239.01, 535.0], [238.59, 535.0], [238.18, 535.0], [237.78, 535.0], [237.37, 535.0], [236.97, 535.0]], "zones": ["basement_play_floor", "basement_counter", "theater_rear_view"]}, {"camera_id": "camera.storage_room", "floor": "basement", "has_multi_room_bleed": false, "host_room": "Storage Room", "name": "Storage Room Camera", "spillover_targets": [], "sub_zones": [{"entity_id": "binary_sensor.storage_room_workout_person_occupancy", "height": 135, "id": "storage_room_workout", "label": "Gym / Workout Mat", "room": "Storage Room", "width": 125, "x": 645, "y": 75}], "visibility_polygon": [[650.0, 55.0], [701.12, 217.13], [696.86, 218.41], [692.56, 219.59], [688.24, 220.64], [683.89, 221.59], [679.52, 222.42], [675.13, 223.13], [670.72, 223.73], [666.29, 224.22], [661.86, 224.59], [657.42, 224.84], [652.97, 224.97], [648.52, 224.99], [644.07, 224.9], [639.62, 224.68], [638.5, 224.61], [638.44, 224.61], [638.38, 224.6], [638.28, 224.6], [638.22, 224.59], [638.16, 224.59], [635.94, 224.42], [635.88, 224.41], [635.82, 224.41], [635.18, 224.35], [635.12, 224.35], [635.06, 224.34], [635.0, 224.32], [635.0, 186.65], [635.0, 161.73], [635.0, 144.64], [635.0, 132.17], [635.0, 122.66], [635.0, 120.1], [635.0, 120.0], [611.72, 220.63], [608.87, 219.95], [604.57, 218.82], [600.3, 217.57], [596.06, 216.22], [591.86, 214.75], [587.69, 213.17], [583.58, 211.49], [579.5, 209.69], [575.48, 207.79], [571.5, 205.79], [567.58, 203.69], [563.72, 201.48], [562.59, 200.8], [635.0, 80.0], [635.0, 79.98], [635.0, 79.01], [635.0, 77.66], [635.0, 76.42], [635.0, 75.27], [635.0, 74.2], [635.0, 73.2], [635.0, 72.26], [635.0, 71.37], [635.0, 70.53], [635.0, 69.74], [635.0, 68.99], [635.0, 68.27], [635.0, 67.59], [635.0, 66.93], [635.0, 66.3], [635.0, 65.7], [635.0, 65.12], [635.0, 64.56]], "zones": ["storage_room_workout"]}], "compiled_room_rules": {"Basement Play Area": {"can_be_bounded": false, "connected_rooms": ["Basement Theater", "Family Room", "Storage Room"], "max_camera_coverage_pct": 65.0, "recommended_inactivity_timeout": 180, "recommended_mode": "open", "room_name": "Basement Play Area", "spillover_entities_to_downgrade": ["binary_sensor.basement_play_area_person_occupancy", "binary_sensor.basement_stairwell_person_occupancy"], "unsealed_exits": ["Family Room (stairs)", "Basement Theater (open passage)", "Storage Room (unmonitored door)", "Basement Bathroom (unmonitored door)"]}, "Basement Theater": {"can_be_bounded": false, "connected_rooms": ["Basement Play Area", "Family Room"], "max_camera_coverage_pct": 82.0, "recommended_inactivity_timeout": 240, "recommended_mode": "open", "room_name": "Basement Theater", "spillover_entities_to_downgrade": ["binary_sensor.basement_theater_person_occupancy", "binary_sensor.basement_stairwell_person_occupancy"], "unsealed_exits": ["Family Room (stairs)", "Basement Play Area (open passage)"]}, "Dining Room": {"can_be_bounded": false, "connected_rooms": ["Kitchen", "Living Room"], "max_camera_coverage_pct": 65.0, "recommended_inactivity_timeout": 180, "recommended_mode": "open", "room_name": "Dining Room", "spillover_entities_to_downgrade": [], "unsealed_exits": ["Living Room (open passage)", "Kitchen (open passage)"]}, "Family Room": {"can_be_bounded": false, "connected_rooms": ["Basement Play Area", "Basement Theater", "Front Entry", "Garage", "Kitchen"], "max_camera_coverage_pct": 65.0, "recommended_inactivity_timeout": 180, "recommended_mode": "open", "room_name": "Family Room", "spillover_entities_to_downgrade": ["binary_sensor.family_room_person_occupancy"], "unsealed_exits": ["Front Entry (open passage)", "Kitchen (open passage)", "Garage (unmonitored door)", "Basement Play Area (stairs)", "Basement Theater (stairs)"]}, "Front Entry": {"can_be_bounded": false, "connected_rooms": ["Family Room", "Guest Room", "Kitchen", "Living Room", "Margot's Room", "Master Bedroom", "Office", "Upstairs Bathroom"], "max_camera_coverage_pct": 38.0, "recommended_inactivity_timeout": 60, "recommended_mode": "open", "room_name": "Front Entry", "spillover_entities_to_downgrade": [], "unsealed_exits": ["Living Room (open passage)", "Kitchen (open passage)", "Family Room (open passage)", "Upstairs Hallway & Stairs (stairs)"]}, "Garage": {"can_be_bounded": false, "connected_rooms": ["Family Room"], "max_camera_coverage_pct": 65.0, "recommended_inactivity_timeout": 180, "recommended_mode": "open", "room_name": "Garage", "spillover_entities_to_downgrade": [], "unsealed_exits": ["Family Room (unmonitored door)"]}, "Guest Room": {"can_be_bounded": false, "connected_rooms": ["Front Entry", "Margot's Room", "Master Bedroom", "Office", "Upstairs Bathroom"], "max_camera_coverage_pct": 0.0, "recommended_inactivity_timeout": 300, "recommended_mode": "open", "room_name": "Guest Room", "spillover_entities_to_downgrade": [], "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)"]}, "Kitchen": {"can_be_bounded": false, "connected_rooms": ["Dining Room", "Family Room", "Front Entry"], "max_camera_coverage_pct": 51.0, "recommended_inactivity_timeout": 180, "recommended_mode": "open", "room_name": "Kitchen", "spillover_entities_to_downgrade": [], "unsealed_exits": ["Front Entry (open passage)", "Dining Room (open passage)", "Family Room (open passage)"]}, "Living Room": {"can_be_bounded": false, "connected_rooms": ["Dining Room", "Front Entry"], "max_camera_coverage_pct": 65.0, "recommended_inactivity_timeout": 180, "recommended_mode": "open", "room_name": "Living Room", "spillover_entities_to_downgrade": ["binary_sensor.living_room_person_occupancy"], "unsealed_exits": ["Front Entry (open passage)", "Dining Room (open passage)"]}, "Margot's Room": {"can_be_bounded": false, "connected_rooms": ["Front Entry", "Guest Room", "Master Bedroom", "Office", "Upstairs Bathroom"], "max_camera_coverage_pct": 65.0, "recommended_inactivity_timeout": 300, "recommended_mode": "open", "room_name": "Margot's Room", "spillover_entities_to_downgrade": ["binary_sensor.nursery_person_occupancy"], "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)"]}, "Master Bathroom": {"can_be_bounded": false, "connected_rooms": ["Master Bedroom"], "max_camera_coverage_pct": 18.0, "recommended_inactivity_timeout": 600, "recommended_mode": "open", "room_name": "Master Bathroom", "spillover_entities_to_downgrade": [], "unsealed_exits": ["Master Bedroom (unmonitored door)"]}, "Master Bedroom": {"can_be_bounded": false, "connected_rooms": ["Front Entry", "Guest Room", "Margot's Room", "Master Bathroom", "Office", "Upstairs Bathroom"], "max_camera_coverage_pct": 82.0, "recommended_inactivity_timeout": 300, "recommended_mode": "open", "room_name": "Master Bedroom", "spillover_entities_to_downgrade": ["binary_sensor.master_bedroom_person_occupancy", "binary_sensor.master_bedroom_entryway_person_occupancy"], "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)", "Master Bathroom (unmonitored door)"]}, "Office": {"can_be_bounded": false, "connected_rooms": ["Front Entry", "Guest Room", "Margot's Room", "Master Bedroom", "Upstairs Bathroom"], "max_camera_coverage_pct": 67.0, "recommended_inactivity_timeout": 240, "recommended_mode": "open", "room_name": "Office", "spillover_entities_to_downgrade": ["binary_sensor.office_person_occupancy", "binary_sensor.office_entryway_person_occupancy"], "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)"]}, "Storage Room": {"can_be_bounded": false, "connected_rooms": ["Basement Play Area"], "max_camera_coverage_pct": 65.0, "recommended_inactivity_timeout": 180, "recommended_mode": "open", "room_name": "Storage Room", "spillover_entities_to_downgrade": [], "unsealed_exits": ["Basement Play Area (unmonitored door)"]}, "Upstairs Bathroom": {"can_be_bounded": false, "connected_rooms": ["Front Entry", "Guest Room", "Margot's Room", "Master Bedroom", "Office"], "max_camera_coverage_pct": 0.0, "recommended_inactivity_timeout": 180, "recommended_mode": "open", "room_name": "Upstairs Bathroom", "spillover_entities_to_downgrade": [], "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)"]}}, "connected_rooms_map": {"Basement Play Area": ["Basement Theater", "Family Room", "Storage Room"], "Basement Theater": ["Basement Play Area", "Family Room"], "Dining Room": ["Kitchen", "Living Room"], "Family Room": ["Basement Play Area", "Basement Theater", "Front Entry", "Garage", "Kitchen"], "Front Entry": ["Family Room", "Guest Room", "Kitchen", "Living Room", "Margot's Room", "Master Bedroom", "Office", "Upstairs Bathroom"], "Garage": ["Family Room"], "Guest Room": ["Front Entry", "Margot's Room", "Master Bedroom", "Office", "Upstairs Bathroom"], "Kitchen": ["Dining Room", "Family Room", "Front Entry"], "Living Room": ["Dining Room", "Front Entry"], "Margot's Room": ["Front Entry", "Guest Room", "Master Bedroom", "Office", "Upstairs Bathroom"], "Master Bathroom": ["Master Bedroom"], "Master Bedroom": ["Front Entry", "Guest Room", "Margot's Room", "Master Bathroom", "Office", "Upstairs Bathroom"], "Office": ["Front Entry", "Guest Room", "Margot's Room", "Master Bedroom", "Upstairs Bathroom"], "Storage Room": ["Basement Play Area"], "Upstairs Bathroom": ["Front Entry", "Guest Room", "Margot's Room", "Master Bedroom", "Office"]}, "floorplan": {"ble_proxies": [{"entity_id": "sensor.living_room_speaker_bluetooth_proxy_status", "floor": "main", "host_room": "Living Room", "id": "living_room_speaker", "name": "Living Room Speaker BLE Proxy", "radius_px": 190, "x": 260, "y": 435}, {"entity_id": "sensor.family_room_speaker_bluetooth_proxy_status", "floor": "main", "host_room": "Family Room", "id": "family_room_speaker", "name": "Family Room Speaker BLE Proxy", "radius_px": 210, "x": 710, "y": 240}, {"entity_id": "sensor.master_bedroom_speaker_bluetooth_proxy_status", "floor": "upstairs", "host_room": "Master Bedroom", "id": "master_bedroom_speaker", "name": "Master Bedroom Speaker BLE Proxy", "radius_px": 210, "x": 230, "y": 180}, {"entity_id": "sensor.nursery_speaker_bluetooth_proxy_status", "floor": "upstairs", "host_room": "Margot's Room", "id": "nursery_speaker", "name": "Nursery Speaker BLE Proxy", "radius_px": 180, "x": 480, "y": 135}, {"entity_id": "sensor.office_speaker_bluetooth_proxy_status", "floor": "upstairs", "host_room": "Office", "id": "office_speaker", "name": "Office Speaker BLE Proxy", "radius_px": 195, "x": 745, "y": 395}, {"entity_id": "sensor.basement_speaker_bluetooth_proxy_status", "floor": "basement", "host_room": "Basement Play Area", "id": "basement_speaker", "name": "Basement Speaker BLE Proxy", "radius_px": 260, "x": 450, "y": 310}], "cameras": [{"floor": "main", "fov_deg": 65, "heading_deg": 355, "host_room": "Living Room", "id": "camera.living_room", "name": "Living Room Camera", "notes": "Covers Living Room and sightline projects directly through open archway into Front Entry.", "range_px": 350, "spills_into": ["Front Entry"], "sub_zones": [{"entity_id": "binary_sensor.living_room_couch_person_occupancy", "height": 115, "id": "living_room_couch", "label": "Living Room Couch", "room": "Living Room", "width": 95, "x": 170, "y": 370}, {"entity_id": "binary_sensor.living_room_floor_person_occupancy", "height": 110, "id": "living_room_floor", "label": "Living Room Floor", "room": "Living Room", "width": 90, "x": 270, "y": 380}, {"entity_id": "binary_sensor.living_room_bay_windows_person_occupancy", "height": 42, "id": "living_room_bay_windows", "label": "Bay Windows", "room": "Living Room", "width": 140, "x": 175, "y": 495}, {"entity_id": "binary_sensor.living_room_entry_person_occupancy", "height": 95, "id": "living_room_entry", "label": "Front Entry Archway", "room": "Front Entry", "width": 70, "x": 380, "y": 365}], "x": 175, "y": 530, "zones": ["living_room_couch", "living_room_floor", "living_room_bay_windows", "living_room_entry"]}, {"floor": "main", "fov_deg": 55, "heading_deg": 85, "host_room": "Dining Room", "id": "camera.dining_room", "name": "Dining Room Camera", "notes": "Covers Dining Room table and projects sightline down table into Living Room couch.", "range_px": 240, "spills_into": ["Living Room"], "sub_zones": [{"entity_id": "binary_sensor.dining_room_table_person_occupancy", "height": 110, "id": "dining_room_table", "label": "Dining Table", "room": "Dining Room", "width": 110, "x": 185, "y": 175}, {"entity_id": "binary_sensor.rileys_food_person_occupancy", "height": 44, "id": "rileys_food", "label": "Riley's Food Corner", "room": "Dining Room", "width": 70, "x": 240, "y": 128}], "x": 175, "y": 135, "zones": ["dining_room_table", "rileys_food"]}, {"floor": "main", "fov_deg": 75, "heading_deg": 180, "host_room": "Family Room", "id": "camera.family_room", "name": "Family Room Camera", "notes": "Catches Family Room couch, flanks Kitchen Island, and sees pathway to Entryway and Basement.", "range_px": 420, "spills_into": ["Kitchen", "Front Entry"], "sub_zones": [{"entity_id": "binary_sensor.family_room_couch_person_occupancy", "height": 120, "id": "family_room_couch", "label": "Family Room Couch", "room": "Family Room", "width": 135, "x": 665, "y": 185}, {"entity_id": "binary_sensor.family_room_recliner_person_occupancy", "height": 75, "id": "family_room_recliner", "label": "Family Room Recliner", "room": "Family Room", "width": 80, "x": 585, "y": 135}, {"entity_id": "binary_sensor.family_room_floor_person_occupancy", "height": 115, "id": "family_room_floor", "label": "Family Room Floor", "room": "Family Room", "width": 85, "x": 580, "y": 215}, {"entity_id": "binary_sensor.kitchen_island_person_occupancy", "height": 110, "id": "kitchen_island", "label": "Kitchen Island", "room": "Kitchen", "width": 110, "x": 445, "y": 175}], "x": 830, "y": 135, "zones": ["family_room_couch", "family_room_recliner", "family_room_floor", "kitchen_island"]}, {"floor": "main", "fov_deg": 64, "heading_deg": 90, "host_room": "Garage", "id": "camera.garage", "name": "Garage Camera", "notes": "Mounted on interior wall looking South down parked car toward roll-up garage door.", "range_px": 170, "spills_into": [], "sub_zones": [{"entity_id": "binary_sensor.garage_parking_person_occupancy", "height": 125, "id": "garage_parking", "label": "Garage Parking Bay", "room": "Garage", "width": 140, "x": 615, "y": 410}], "x": 680, "y": 390, "zones": ["garage_parking"]}, {"floor": "upstairs", "fov_deg": 80, "heading_deg": 69, "host_room": "Master Bedroom", "id": "camera.master_bedroom", "name": "Master Bedroom Camera", "notes": "Catches Master Bedroom plus entries to Upstairs Hallway and Master Bathroom/Closet.", "range_px": 480, "spills_into": ["Upstairs Hallway & Stairs", "Master Bathroom"], "sub_zones": [{"entity_id": "binary_sensor.master_bed_person_occupancy", "height": 130, "id": "master_bed", "label": "Master Bed", "room": "Master Bedroom", "width": 130, "x": 145, "y": 95}, {"entity_id": "binary_sensor.master_open_area_person_occupancy", "height": 140, "id": "master_open_area", "label": "Master Open Floor", "room": "Master Bedroom", "width": 130, "x": 155, "y": 240}, {"entity_id": "binary_sensor.master_bedroom_walkway_person_occupancy", "height": 180, "id": "master_bedroom_walkway", "label": "Master Walkway", "room": "Master Bedroom", "width": 65, "x": 290, "y": 175}, {"entity_id": "binary_sensor.master_bedroom_entryway_person_occupancy", "height": 60, "id": "master_bedroom_entryway", "label": "Master Hallway Entry", "room": "Master Bedroom", "width": 45, "x": 315, "y": 250}, {"entity_id": "binary_sensor.master_bathroom_person_occupancy", "height": 60, "id": "master_bathroom", "label": "Master Bath Doorway", "room": "Master Bathroom", "width": 45, "x": 340, "y": 380}], "x": 150, "y": 50, "zones": ["master_bed", "master_open_area", "master_bedroom_walkway", "master_bedroom_entryway", "master_bathroom"]}, {"floor": "upstairs", "fov_deg": 75, "heading_deg": 230, "host_room": "Margot's Room", "id": "camera.nursery", "name": "Nursery Camera", "notes": "Mounted on south wall looking northwest across bed, play floor, and dresser.", "range_px": 280, "spills_into": [], "sub_zones": [{"entity_id": "binary_sensor.nursery_bed_person_occupancy", "height": 110, "id": "nursery_bed", "label": "Nursery Bed", "room": "Margot's Room", "width": 120, "x": 380, "y": 60}], "x": 550, "y": 230, "zones": ["nursery_bed"]}, {"floor": "upstairs", "fov_deg": 80, "heading_deg": 250, "host_room": "Office", "id": "camera.office", "name": "Office Camera", "notes": "Covers Steve's desk and sim rig with hallway door on the left periphery.", "range_px": 320, "spills_into": ["Upstairs Hallway & Stairs"], "sub_zones": [{"entity_id": "binary_sensor.steves_desk_person_occupancy", "height": 95, "id": "steves_desk", "label": "Steve's Desk", "room": "Office", "width": 110, "x": 725, "y": 360}, {"entity_id": "binary_sensor.sim_rig_person_occupancy", "height": 100, "id": "sim_rig", "label": "Sim Rig", "room": "Office", "width": 85, "x": 635, "y": 410}, {"entity_id": "binary_sensor.office_floor_person_occupancy", "height": 95, "id": "office_floor", "label": "Office Center Floor", "room": "Office", "width": 120, "x": 655, "y": 300}, {"entity_id": "binary_sensor.office_entryway_person_occupancy", "height": 55, "id": "office_entryway", "label": "Office Doorway", "room": "Office", "width": 55, "x": 610, "y": 260}], "x": 855, "y": 525, "zones": ["steves_desk", "sim_rig", "office_floor", "office_entryway"]}, {"floor": "basement", "fov_deg": 90, "heading_deg": 235, "host_room": "Basement Theater", "id": "camera.basement_theater", "name": "Basement Theater Camera", "notes": "Covers media lounge sectional, wet bar, and catches stairwell.", "range_px": 350, "spills_into": ["Basement Play Area"], "sub_zones": [{"entity_id": "binary_sensor.basement_theater_couch_person_occupancy", "height": 90, "id": "basement_theater_couch", "label": "Theater Couch", "room": "Basement Theater", "width": 110, "x": 650, "y": 430}, {"entity_id": "binary_sensor.basement_theater_playpen_person_occupancy", "height": 55, "id": "basement_theater_playpen", "label": "Theater Playpen", "room": "Basement Theater", "width": 85, "x": 645, "y": 375}, {"entity_id": "binary_sensor.basement_theater_floor_person_occupancy", "height": 85, "id": "basement_theater_floor", "label": "Theater Floor", "room": "Basement Theater", "width": 95, "x": 635, "y": 395}, {"entity_id": "binary_sensor.basement_bar_person_occupancy", "height": 95, "id": "basement_bar", "label": "Basement Wet Bar", "room": "Basement Play Area", "width": 110, "x": 520, "y": 360}, {"entity_id": "binary_sensor.basement_play_area_far_person_occupancy", "height": 140, "id": "basement_play_area_far", "label": "Play Area East", "room": "Basement Play Area", "width": 160, "x": 440, "y": 280}, {"entity_id": "binary_sensor.basement_stairwell_person_occupancy", "height": 75, "id": "basement_stairwell", "label": "Basement Stairwell", "room": "Basement Play Area", "width": 95, "x": 535, "y": 450}], "x": 765, "y": 520, "zones": ["basement_theater_couch", "basement_theater_playpen", "basement_theater_floor", "basement_bar", "basement_play_area_far", "basement_stairwell"]}, {"floor": "basement", "fov_deg": 85, "heading_deg": 40, "host_room": "Basement Play Area", "id": "camera.basement_play_area", "name": "Basement Play Area Camera", "notes": "Covers Play Area & Counter; sees into Theater. Storage Room & Basement Bath are out of frame on left.", "range_px": 480, "spills_into": ["Basement Theater"], "sub_zones": [{"entity_id": "binary_sensor.basement_play_floor_person_occupancy", "height": 220, "id": "basement_play_floor", "label": "Play Area Main Floor", "room": "Basement Play Area", "width": 220, "x": 260, "y": 240}, {"entity_id": "binary_sensor.basement_counter_person_occupancy", "height": 120, "id": "basement_counter", "label": "Play Area North Counter", "room": "Basement Play Area", "width": 180, "x": 250, "y": 70}, {"entity_id": "binary_sensor.theater_rear_view_person_occupancy", "height": 110, "id": "theater_rear_view", "label": "Theater Rear View", "room": "Basement Theater", "width": 110, "x": 635, "y": 380}], "x": 235, "y": 520, "zones": ["basement_play_floor", "basement_counter", "theater_rear_view"]}, {"floor": "basement", "fov_deg": 75, "heading_deg": 110, "host_room": "Storage Room", "id": "camera.storage_room", "name": "Storage Room Camera", "notes": "Covers interior Storage Room / Gym floor looking toward door to finished basement.", "range_px": 170, "spills_into": [], "sub_zones": [{"entity_id": "binary_sensor.storage_room_workout_person_occupancy", "height": 135, "id": "storage_room_workout", "label": "Gym / Workout Mat", "room": "Storage Room", "width": 125, "x": 645, "y": 75}], "x": 650, "y": 55, "zones": ["storage_room_workout"]}], "canvas": {"height": 600, "width": 1000}, "connections": [{"from_room": "Front Entry", "id": "conn_entry_lr", "label": "Open Archway (Entry <-> Living Room)", "to_room": "Living Room", "type": "open_passage"}, {"from_room": "Front Entry", "id": "conn_entry_kitchen", "label": "Pathway (Entry <-> Kitchen)", "to_room": "Kitchen", "type": "open_passage"}, {"from_room": "Front Entry", "id": "conn_entry_fr", "label": "Pathway (Entry <-> Family/Laundry/Basement)", "to_room": "Family Room", "type": "open_passage"}, {"from_room": "Living Room", "id": "conn_lr_dr", "label": "Open Passage (Living <-> Dining)", "to_room": "Dining Room", "type": "open_passage"}, {"from_room": "Dining Room", "id": "conn_dr_kitchen", "label": "Open Passage (Dining <-> Kitchen)", "to_room": "Kitchen", "type": "open_passage"}, {"from_room": "Kitchen", "id": "conn_kitchen_fr", "label": "Open Concept (Kitchen <-> Family Room)", "to_room": "Family Room", "type": "open_passage"}, {"entity_id": "binary_sensor.utility_room_door", "from_room": "Family Room", "id": "conn_fr_garage", "label": "Laundry / Garage Pathway", "to_room": "Garage", "type": "unmonitored_door"}, {"from_room": "Front Entry", "id": "conn_entry_upstairs", "label": "Main Stairs to Upstairs", "to_room": "Upstairs Hallway & Stairs", "type": "stairs"}, {"from_room": "Family Room", "id": "conn_fr_basement_play", "label": "Basement Stairs", "to_room": "Basement Play Area", "type": "stairs"}, {"from_room": "Family Room", "id": "conn_fr_basement_theater", "label": "Basement Stairs (Partial Sightline)", "to_room": "Basement Theater", "type": "stairs"}, {"from_room": "Upstairs Hallway & Stairs", "id": "conn_hall_office", "label": "Office Doorway (Next to Stairs)", "to_room": "Office", "type": "unmonitored_door"}, {"from_room": "Upstairs Hallway & Stairs", "id": "conn_hall_guest", "label": "Guest Room Doorway (No Sensor)", "to_room": "Guest Room", "type": "unmonitored_door"}, {"from_room": "Upstairs Hallway & Stairs", "id": "conn_hall_nursery", "label": "Nursery Doorway (Seen Partially by Cam)", "to_room": "Margot's Room", "type": "unmonitored_door"}, {"from_room": "Upstairs Hallway & Stairs", "id": "conn_hall_master", "label": "Master Bedroom Entryway", "to_room": "Master Bedroom", "type": "unmonitored_door"}, {"from_room": "Master Bedroom", "id": "conn_master_bath", "label": "Master Bath / Shower Stall Entry", "to_room": "Master Bathroom", "type": "unmonitored_door"}, {"from_room": "Upstairs Hallway & Stairs", "id": "conn_hall_ubath", "label": "Shared Bathroom (Double Vanity & Tub)", "to_room": "Upstairs Bathroom", "type": "unmonitored_door"}, {"from_room": "Basement Play Area", "id": "conn_play_theater", "label": "Open Basement Divide (Play <-> Theater)", "to_room": "Basement Theater", "type": "open_passage"}, {"from_room": "Basement Play Area", "id": "conn_play_storage", "label": "Storage Room Door (No Sensor, Out of Frame Left)", "to_room": "Storage Room", "type": "unmonitored_door"}, {"from_room": "Basement Play Area", "id": "conn_play_bbath", "label": "Basement Bath Door (No Sensor, Out of Frame Left)", "to_room": "Basement Bathroom", "type": "unmonitored_door"}], "floors": [{"id": "upstairs", "name": "Upstairs Level", "order": 0}, {"id": "main", "name": "Main Floor", "order": 1}, {"id": "basement", "name": "Basement Level", "order": 2}], "rooms": [{"entryways": [{"id": "door_master_hallway", "offset": 230, "target_room": "Upstairs Hallway & Stairs", "type": "door", "wall": "right", "width": 40}, {"id": "door_master_bath", "offset": 360, "target_room": "Master Bathroom", "type": "door", "wall": "right", "width": 40}], "floor": "upstairs", "height": 505, "id": "master_bedroom", "name": "Master Bedroom", "notes": "West wing front-to-back. Camera catches bed, doorway to Upstairs Hallway, and entry to Master Bath / WIC.", "room_type": "room", "width": 225, "x": 135, "y": 35}, {"entryways": [{"id": "door_mbath_master", "offset": 15, "target_room": "Master Bedroom", "type": "door", "wall": "left", "width": 40}], "floor": "upstairs", "height": 160, "id": "master_bathroom", "name": "Master Bathroom", "notes": "En-suite bath next to WIC with single sink and shower stall; entry caught by master bedroom camera.", "room_type": "room", "width": 140, "x": 360, "y": 380}, {"entryways": [{"id": "door_ubath_hall", "offset": 35, "target_room": "Upstairs Hallway & Stairs", "type": "door", "wall": "top", "width": 36}], "floor": "upstairs", "height": 160, "id": "upstairs_bathroom", "name": "Upstairs Bathroom", "notes": "Shared upstairs bathroom with double vanity and soaking tub, opening off hallway.", "room_type": "room", "width": 110, "x": 500, "y": 380}, {"entryways": [{"id": "door_margot_hallway", "offset": 160, "target_room": "Upstairs Hallway & Stairs", "type": "door", "wall": "bottom", "width": 36}], "floor": "upstairs", "height": 215, "id": "margots_room", "name": "Margot's Room", "notes": "Top-middle bedroom; doorway opens to Upstairs Hallway.", "room_type": "room", "width": 250, "x": 360, "y": 35}, {"entryways": [{"id": "door_guest_hallway", "offset": 30, "target_room": "Upstairs Hallway & Stairs", "type": "door", "wall": "bottom", "width": 36}], "floor": "upstairs", "height": 215, "id": "guest_room", "name": "Guest Room", "notes": "Top-right bedroom; doorway opens to Upstairs Hallway.", "room_type": "room", "width": 260, "x": 610, "y": 35}, {"entryways": [{"id": "door_office_hallway", "offset": 20, "target_room": "Upstairs Hallway & Stairs", "type": "door", "wall": "left", "width": 40}], "floor": "upstairs", "height": 290, "id": "office", "name": "Office", "notes": "Bottom-right bedroom / office next to stairs landing; camera sees desk, rig, and doorway.", "room_type": "room", "width": 260, "x": 610, "y": 250}, {"entryways": [{"id": "door_hall_master", "offset": 15, "target_room": "Master Bedroom", "type": "door", "wall": "left", "width": 40}, {"id": "door_hall_margot", "offset": 160, "target_room": "Margot's Room", "type": "door", "wall": "top", "width": 36}, {"id": "door_hall_guest", "offset": 10, "target_room": "Guest Room", "type": "door", "wall": "right", "width": 36}, {"id": "door_hall_office", "offset": 20, "target_room": "Office", "type": "door", "wall": "right", "width": 40}, {"id": "passage_hall_stairs", "offset": 180, "target_room": "Front Entry", "type": "open_passage", "wall": "bottom", "width": 55}], "floor": "upstairs", "height": 130, "id": "upstairs_hallway", "name": "Upstairs Hallway & Stairs", "notes": "Connects Master Bedroom, Margot's Room, Guest Room, Office, Bathrooms, and Stairs to Front Entry.", "room_type": "transit", "width": 250, "x": 360, "y": 250}, {"entryways": [{"id": "arch_dr_kitchen", "offset": 20, "target_room": "Kitchen", "type": "open_passage", "wall": "right", "width": 160}, {"id": "arch_dr_lr", "offset": 20, "target_room": "Living Room", "type": "open_passage", "wall": "bottom", "width": 120}], "floor": "main", "height": 205, "id": "dining_room", "name": "Dining Room", "notes": "Northwest room opening to Kitchen and Living Room.", "room_type": "room", "width": 160, "x": 160, "y": 120}, {"entryways": [{"id": "arch_lr_dr", "offset": 20, "target_room": "Dining Room", "type": "open_passage", "wall": "top", "width": 120}, {"id": "arch_lr_entry", "offset": 30, "target_room": "Front Entry", "type": "open_passage", "wall": "right", "width": 130}], "floor": "main", "height": 220, "id": "living_room", "name": "Living Room", "notes": "Southwest room with front bay windows; opens to Dining Room and Front Entryway.", "room_type": "room", "width": 235, "x": 160, "y": 325}, {"entryways": [{"id": "arch_kitchen_dr", "offset": 20, "target_room": "Dining Room", "type": "open_passage", "wall": "left", "width": 160}, {"id": "arch_kitchen_fr", "offset": 20, "target_room": "Family Room", "type": "open_passage", "wall": "right", "width": 170}, {"id": "path_kitchen_entry", "offset": 75, "target_room": "Front Entry", "type": "open_passage", "wall": "bottom", "width": 100}], "floor": "main", "height": 205, "id": "kitchen", "name": "Kitchen", "notes": "Central kitchen with island counter and breakfast nook; open to Family Room, Dining Room, and Front Entry.", "room_type": "room", "width": 245, "x": 320, "y": 120}, {"entryways": [{"id": "arch_entry_lr", "offset": 30, "target_room": "Living Room", "type": "open_passage", "wall": "left", "width": 130}, {"id": "path_entry_kitchen", "offset": 0, "target_room": "Kitchen", "type": "open_passage", "wall": "top", "width": 100}, {"id": "path_entry_fr", "offset": 10, "target_room": "Family Room", "type": "open_passage", "wall": "right", "width": 60}, {"id": "door_front_entry", "offset": 60, "target_room": "Exterior", "type": "door", "wall": "bottom", "width": 45}], "floor": "main", "height": 220, "id": "front_entry", "name": "Front Entry", "notes": "Main foyer with front door, powder room, stairs up to Floor 3, and pathways to Living Room and Kitchen.", "room_type": "room", "width": 170, "x": 395, "y": 325}, {"entryways": [{"id": "arch_fr_kitchen", "offset": 20, "target_room": "Kitchen", "type": "open_passage", "wall": "left", "width": 170}, {"id": "path_fr_entry", "offset": 10, "target_room": "Front Entry", "type": "open_passage", "wall": "bottom", "width": 60}, {"id": "door_fr_laundry", "offset": 40, "target_room": "Garage", "type": "door", "wall": "bottom", "width": 40}], "floor": "main", "height": 250, "id": "family_room", "name": "Family Room", "notes": "East living area with north fireplace; open to Kitchen and connects to Laundry and Front Entry.", "room_type": "room", "width": 280, "x": 565, "y": 120}, {"entryways": [{"id": "door_garage_fr", "offset": 40, "target_room": "Family Room", "type": "door", "wall": "top", "width": 40}], "floor": "main", "height": 175, "id": "garage", "name": "Garage", "notes": "Includes laundry room and garage entry walkway connecting off Family Room.", "room_type": "room", "width": 280, "x": 565, "y": 370}, {"entryways": [{"id": "door_play_storage", "offset": 40, "target_room": "Storage Room", "type": "door", "wall": "right", "width": 40}, {"id": "door_play_bbath", "offset": 235, "target_room": "Basement Bathroom", "type": "door", "wall": "right", "width": 36}, {"id": "arch_play_theater", "offset": 375, "target_room": "Basement Theater", "type": "open_passage", "wall": "right", "width": 110}], "floor": "basement", "height": 495, "id": "basement_play_area", "name": "Basement Play Area", "notes": "Main basement recreation room with west fireplace and south alcoves; connects to Storage and Theater.", "room_type": "room", "width": 415, "x": 220, "y": 40}, {"entryways": [{"id": "door_storage_play", "offset": 40, "target_room": "Basement Play Area", "type": "door", "wall": "left", "width": 40}], "floor": "basement", "height": 185, "id": "storage_room", "name": "Storage Room", "notes": "Upper northeast wet bar / storage area; door connects to Recreation Room.", "room_type": "room", "width": 145, "x": 635, "y": 40}, {"entryways": [{"id": "door_bbath_play", "offset": 10, "target_room": "Basement Play Area", "type": "door", "wall": "left", "width": 36}], "floor": "basement", "height": 145, "id": "basement_bathroom", "name": "Basement Bathroom", "notes": "Full basement bathroom off recreation hallway.", "room_type": "transit", "width": 145, "x": 635, "y": 225}, {"entryways": [{"id": "arch_theater_play", "offset": 5, "target_room": "Basement Play Area", "type": "open_passage", "wall": "left", "width": 110}], "floor": "basement", "height": 165, "id": "basement_theater", "name": "Basement Theater", "notes": "Lower northeast basement hallway / media lounge and stair exit.", "room_type": "room", "width": 145, "x": 635, "y": 370}], "sensors": [{"entity_id": "binary_sensor.family_room_motion", "floor": "main", "fov_deg": 90, "heading_deg": 225, "host_room": "Family Room", "id": "binary_sensor.family_room_motion", "name": "Family Room PIR (Ring)", "range_px": 260, "sensor_type": "pir_motion", "x": 825, "y": 350}, {"entity_id": "binary_sensor.family_room_motion_4", "floor": "main", "fov_deg": 110, "heading_deg": 170, "host_room": "Family Room", "id": "binary_sensor.family_room_motion_4", "name": "Family/Kitchen PIR (Ecobee)", "range_px": 230, "sensor_type": "pir_motion", "x": 575, "y": 145}, {"entity_id": "binary_sensor.thermostat_motion", "floor": "main", "fov_deg": 110, "heading_deg": 180, "host_room": "Dining Room", "id": "binary_sensor.thermostat_motion", "name": "Main Thermostat PIR", "range_px": 180, "sensor_type": "pir_motion", "x": 310, "y": 220}, {"entity_id": "binary_sensor.keypad_motion", "floor": "main", "fov_deg": 100, "heading_deg": 300, "host_room": "Front Entry", "id": "binary_sensor.keypad_motion", "name": "Front Entry Keypad PIR", "range_px": 170, "sensor_type": "pir_motion", "x": 415, "y": 525}, {"entity_id": "binary_sensor.ratgdov25i_47a250_motion", "floor": "main", "fov_deg": 100, "heading_deg": 90, "host_room": "Garage", "id": "binary_sensor.ratgdov25i_47a250_motion", "name": "Garage Opener PIR", "range_px": 170, "sensor_type": "pir_motion", "x": 700, "y": 400}, {"entity_id": "binary_sensor.master_bedroom_motion", "floor": "upstairs", "fov_deg": 110, "heading_deg": 0, "host_room": "Master Bedroom", "id": "binary_sensor.master_bedroom_motion", "name": "Master Bedroom PIR (Ecobee)", "range_px": 220, "sensor_type": "pir_motion", "x": 150, "y": 280}, {"entity_id": "binary_sensor.nursery_motion", "floor": "upstairs", "fov_deg": 110, "heading_deg": 315, "host_room": "Margot's Room", "id": "binary_sensor.nursery_motion", "name": "Nursery PIR (Ecobee)", "range_px": 210, "sensor_type": "pir_motion", "x": 380, "y": 230}, {"entity_id": "binary_sensor.guest_room_motion", "floor": "upstairs", "fov_deg": 110, "heading_deg": 140, "host_room": "Guest Room", "id": "binary_sensor.guest_room_motion", "name": "Guest Room PIR (Ecobee)", "range_px": 240, "sensor_type": "pir_motion", "x": 850, "y": 55}, {"entity_id": "binary_sensor.office_motion", "floor": "upstairs", "fov_deg": 110, "heading_deg": 145, "host_room": "Office", "id": "binary_sensor.office_motion", "name": "Office PIR (Ecobee)", "range_px": 230, "sensor_type": "pir_motion", "x": 850, "y": 275}, {"entity_id": "binary_sensor.upper_level_keypad_motion", "floor": "upstairs", "fov_deg": 120, "heading_deg": 90, "host_room": "Upstairs Hallway & Stairs", "id": "binary_sensor.upper_level_keypad_motion", "name": "Upstairs Hallway Keypad PIR", "range_px": 150, "sensor_type": "pir_motion", "x": 485, "y": 260}, {"entity_id": "binary_sensor.motion_detector_basement1", "floor": "basement", "fov_deg": 100, "heading_deg": 140, "host_room": "Basement Theater", "id": "binary_sensor.motion_detector_basement1", "name": "Basement Theater PIR (Ring)", "range_px": 200, "sensor_type": "pir_motion", "x": 765, "y": 385}, {"entity_id": "binary_sensor.motion_sensor_gen2_motion_detection", "floor": "basement", "fov_deg": 105, "heading_deg": 45, "host_room": "Basement Play Area", "id": "binary_sensor.motion_sensor_gen2_motion_detection", "name": "Basement Play Area PIR (Z-Wave)", "range_px": 300, "sensor_type": "pir_motion", "x": 235, "y": 60}, {"entity_id": "binary_sensor.basement_motion", "floor": "basement", "fov_deg": 110, "heading_deg": 270, "host_room": "Basement Play Area", "id": "binary_sensor.basement_motion", "name": "Basement PIR (Ecobee)", "range_px": 260, "sensor_type": "pir_motion", "x": 420, "y": 515}, {"entity_id": "binary_sensor.motion_utility_room", "floor": "basement", "fov_deg": 100, "heading_deg": 135, "host_room": "Storage Room", "id": "binary_sensor.motion_utility_room", "name": "Storage / Gym PIR", "range_px": 180, "sensor_type": "pir_motion", "x": 765, "y": 55}, {"door_id": "door_front_entry", "entity_id": "binary_sensor.front_door", "floor": "main", "host_room": "Front Entry", "id": "binary_sensor.front_door", "name": "Front Door Contact", "sensor_type": "door_contact", "x": 477, "y": 545}, {"door_id": "door_fr_laundry", "entity_id": "binary_sensor.utility_room_door", "floor": "main", "host_room": "Family Room", "id": "binary_sensor.utility_room_door", "name": "Laundry / Garage Door Contact", "sensor_type": "door_contact", "x": 625, "y": 370}, {"entity_id": "binary_sensor.back_door", "floor": "main", "host_room": "Kitchen", "id": "binary_sensor.back_door", "name": "Back Patio Door Contact", "sensor_type": "door_contact", "x": 520, "y": 120}, {"entity_id": "binary_sensor.garage_side_door", "floor": "main", "host_room": "Garage", "id": "binary_sensor.garage_side_door", "name": "Garage Side Door Contact", "sensor_type": "door_contact", "x": 845, "y": 450}, {"entity_id": "cover.garage_door", "floor": "main", "host_room": "Garage", "id": "cover.garage_door", "name": "Garage Roll-Up Door", "sensor_type": "door_contact", "x": 705, "y": 545}], "version": 2}, "pir_analysis": [{"covered_rooms": [{"coverage_pct": 65.6, "room_name": "Family Room"}], "entity_id": "binary_sensor.family_room_motion", "floor": "main", "fov_deg": 90.0, "heading_deg": 225.0, "host_room": "Family Room", "id": "binary_sensor.family_room_motion", "name": "Family Room PIR (Ring)", "range_px": 260.0, "visibility_polygon": [[825.0, 350.0], [565.0, 350.0], [565.09, 343.19], [565.36, 336.39], [565.43, 335.12], [565.43, 335.02], [565.44, 334.93], [565.74, 330.45], [565.74, 330.36], [565.75, 330.27], [565.8, 329.6], [566.18, 325.21], [566.19, 325.11], [566.2, 325.02], [566.42, 322.82], [567.22, 316.06], [568.01, 310.55], [568.02, 310.46], [568.04, 310.38], [568.2, 309.33], [569.35, 302.62], [570.68, 295.94], [572.18, 289.3], [573.86, 282.71], [575.71, 276.16], [577.73, 269.66], [579.91, 263.21], [582.27, 256.82], [584.79, 250.5], [587.48, 244.25], [590.33, 238.07], [593.34, 231.96], [596.51, 225.94], [599.83, 220.0], [603.31, 214.15], [606.95, 208.39], [610.73, 202.73], [614.66, 197.18], [618.73, 191.72], [622.68, 186.7], [622.74, 186.63], [622.79, 186.56], [622.94, 186.38], [627.29, 181.14], [630.2, 177.8], [630.26, 177.73], [630.32, 177.66], [631.78, 176.03], [636.4, 171.03], [641.15, 166.15], [646.03, 161.4], [651.03, 156.78], [656.14, 152.29], [661.38, 147.94], [666.72, 143.73], [672.18, 139.66], [677.73, 135.73], [683.39, 131.95], [689.15, 128.31], [695.0, 124.83], [700.94, 121.51], [707.81, 120.0], [715.3, 120.0], [722.6, 120.0], [729.73, 120.0], [736.71, 120.0], [743.55, 120.0], [750.27, 120.0], [756.87, 120.0], [763.37, 120.0], [769.78, 120.0], [776.11, 120.0], [782.37, 120.0], [788.57, 120.0], [794.72, 120.0], [800.83, 120.0], [806.9, 120.0], [812.95, 120.0], [818.98, 120.0], [825.0, 120.0]], "x": 825.0, "y": 350.0}, {"covered_rooms": [{"coverage_pct": 70.3, "room_name": "Kitchen"}, {"coverage_pct": 45.0, "room_name": "Family Room"}], "entity_id": "binary_sensor.family_room_motion_4", "floor": "main", "fov_deg": 110.0, "heading_deg": 170.0, "host_room": "Family Room", "id": "binary_sensor.family_room_motion_4", "name": "Family/Kitchen PIR (Ecobee)", "range_px": 230.0, "visibility_polygon": [[575.0, 145.0], [477.8, 353.45], [472.42, 350.86], [467.12, 348.13], [461.88, 345.26], [456.73, 342.26], [451.65, 339.13], [446.66, 335.86], [441.75, 332.47], [436.93, 328.95], [432.2, 325.3], [427.57, 321.54], [425.38, 319.68], [425.32, 319.63], [425.26, 319.58], [423.04, 317.65], [418.62, 313.65], [414.29, 309.54], [412.42, 307.69], [412.37, 307.63], [412.31, 307.58], [410.08, 305.32], [405.98, 300.98], [401.99, 296.55], [398.11, 292.01], [394.36, 287.37], [390.73, 282.64], [387.22, 277.81], [387.14, 277.7], [387.1, 277.64], [387.05, 277.57], [383.84, 272.89], [382.6, 271.03], [382.56, 270.96], [382.51, 270.89], [380.58, 267.89], [378.5, 264.53], [378.46, 264.47], [378.42, 264.4], [377.46, 262.81], [374.47, 257.64], [371.62, 252.4], [368.9, 247.09], [366.32, 241.71], [363.88, 236.26], [361.59, 230.76], [359.43, 225.19], [357.42, 219.57], [355.56, 213.9], [353.85, 208.19], [352.29, 202.43], [350.87, 196.63], [349.61, 190.8], [348.49, 184.94], [347.53, 179.05], [346.73, 173.14], [346.07, 167.21], [345.58, 161.26], [345.23, 155.3], [345.04, 149.34], [345.01, 143.37], [345.04, 140.57], [345.04, 140.49], [345.05, 140.41], [345.13, 137.41], [345.4, 131.45], [345.83, 125.49], [346.09, 122.64], [346.1, 122.56], [346.11, 122.48], [350.4, 120.0], [393.39, 120.0], [422.74, 120.0], [444.08, 120.0], [460.31, 120.0], [473.09, 120.0], [483.43, 120.0], [491.97, 120.0], [499.15, 120.0], [505.29, 120.0], [510.6, 120.0], [515.24, 120.0], [519.34, 120.0], [523.0, 120.0], [524.96, 120.0], [565.0, 140.0], [565.0, 140.0], [565.0, 139.87], [565.0, 139.54], [565.0, 139.2], [565.0, 138.84], [565.0, 138.48], [565.0, 138.1], [565.0, 137.71], [565.0, 137.31], [565.0, 136.89], [565.0, 136.45], [565.0, 135.99], [565.0, 135.51], [565.0, 135.0]], "x": 575.0, "y": 145.0}, {"covered_rooms": [{"coverage_pct": 68.8, "room_name": "Dining Room"}], "entity_id": "binary_sensor.thermostat_motion", "floor": "main", "fov_deg": 110.0, "heading_deg": 180.0, "host_room": "Dining Room", "id": "binary_sensor.thermostat_motion", "name": "Main Thermostat PIR", "range_px": 180.0, "visibility_polygon": [[310.0, 220.0], [206.76, 367.45], [202.97, 364.72], [199.25, 361.89], [195.6, 358.97], [192.04, 355.96], [188.55, 352.85], [185.14, 349.66], [181.82, 346.38], [178.59, 343.01], [175.44, 339.56], [172.39, 336.03], [170.01, 333.15], [180.0, 325.0], [179.91, 325.0], [178.7, 325.0], [171.48, 325.0], [163.78, 324.98], [162.57, 323.27], [162.54, 323.22], [162.5, 323.17], [161.11, 321.15], [160.0, 316.31], [160.0, 310.9], [160.0, 305.66], [160.0, 300.57], [160.0, 295.63], [160.0, 290.81], [160.0, 286.11], [160.0, 281.51], [160.0, 277.01], [160.0, 272.6], [160.0, 268.27], [160.0, 264.01], [160.0, 259.81], [160.0, 255.68], [160.0, 251.59], [160.0, 247.54], [160.0, 243.54], [160.0, 239.57], [160.0, 235.62], [160.0, 231.7], [160.0, 227.79], [160.0, 223.89], [160.0, 220.0], [160.0, 216.11], [160.0, 212.21], [160.0, 208.3], [160.0, 204.38], [160.0, 200.43], [160.0, 196.46], [160.0, 192.46], [160.0, 188.41], [160.0, 184.32], [160.0, 180.19], [160.0, 175.99], [160.0, 171.73], [160.0, 167.4], [160.0, 162.99], [160.0, 158.49], [160.0, 153.89], [160.0, 149.19], [160.0, 144.37], [160.0, 139.43], [160.0, 134.34], [160.0, 129.1], [160.0, 123.69], [160.2, 120.21], [160.23, 120.15], [160.27, 120.1], [162.79, 120.0], [170.71, 120.0], [178.07, 120.0], [184.95, 120.0], [191.39, 120.0], [197.45, 120.0], [203.17, 120.0], [208.57, 120.0], [213.7, 120.0], [218.58, 120.0], [223.24, 120.0], [227.69, 120.0], [231.95, 120.0], [236.04, 120.0], [239.98, 120.0]], "x": 310.0, "y": 220.0}, {"covered_rooms": [{"coverage_pct": 60.9, "room_name": "Front Entry"}], "entity_id": "binary_sensor.keypad_motion", "floor": "main", "fov_deg": 100.0, "heading_deg": 300.0, "host_room": "Front Entry", "id": "binary_sensor.keypad_motion", "name": "Front Entry Keypad PIR", "range_px": 170.0, "visibility_polygon": [[415.0, 525.0], [356.86, 365.25], [361.04, 363.79], [365.25, 362.44], [369.51, 361.2], [373.79, 360.07], [378.1, 359.05], [382.43, 358.15], [386.79, 357.36], [391.17, 356.68], [395.08, 356.17], [395.14, 356.16], [395.2, 356.16], [395.56, 356.12], [398.03, 355.85], [398.08, 355.84], [398.14, 355.84], [399.96, 355.67], [404.38, 355.33], [408.8, 355.11], [413.23, 355.01], [417.66, 355.02], [422.08, 355.15], [426.51, 355.39], [430.92, 355.75], [435.32, 356.22], [439.71, 356.81], [444.08, 357.51], [448.44, 358.32], [452.77, 359.25], [457.07, 360.29], [461.35, 361.44], [465.59, 362.7], [469.8, 364.08], [473.97, 365.56], [478.08, 367.14], [478.11, 367.15], [478.14, 367.16], [478.19, 367.18], [482.2, 368.84], [486.24, 370.65], [490.24, 372.56], [494.18, 374.57], [498.08, 376.68], [501.91, 378.9], [505.69, 381.21], [509.4, 383.62], [513.05, 386.13], [516.64, 388.73], [516.95, 388.96], [517.0, 389.0], [517.05, 389.04], [520.15, 391.42], [520.29, 391.53], [520.34, 391.57], [520.39, 391.61], [523.59, 394.2], [526.96, 397.08], [530.26, 400.04], [533.18, 402.8], [533.22, 402.84], [533.26, 402.88], [533.47, 403.08], [536.61, 406.21], [537.06, 406.67], [537.1, 406.71], [537.14, 406.76], [539.66, 409.42], [542.63, 412.7], [543.43, 413.62], [543.47, 413.66], [543.51, 413.71], [545.51, 416.07], [546.69, 417.49], [546.73, 417.54], [546.76, 417.58], [548.3, 419.5], [551.01, 423.01], [553.62, 426.59], [556.13, 430.23], [558.55, 433.94], [560.88, 437.71], [563.1, 441.54], [565.0, 445.54], [565.0, 450.48], [565.0, 455.29], [565.0, 459.99], [565.0, 464.58], [565.0, 469.07], [565.0, 473.48], [565.0, 477.81], [565.0, 482.07], [565.0, 486.27], [565.0, 490.41], [565.0, 494.5], [565.0, 498.55]], "x": 415.0, "y": 525.0}, {"covered_rooms": [{"coverage_pct": 45.3, "room_name": "Garage"}], "entity_id": "binary_sensor.ratgdov25i_47a250_motion", "floor": "main", "fov_deg": 100.0, "heading_deg": 90.0, "host_room": "Garage", "id": "binary_sensor.ratgdov25i_47a250_motion", "name": "Garage Opener PIR", "range_px": 170.0, "visibility_polygon": [[700.0, 400.0], [830.23, 509.27], [827.34, 512.63], [824.36, 515.91], [821.3, 519.11], [820.25, 520.17], [820.21, 520.21], [820.17, 520.25], [818.16, 522.23], [814.93, 525.26], [811.63, 528.21], [808.25, 531.08], [804.8, 533.85], [801.28, 536.54], [797.69, 539.13], [794.03, 541.63], [790.31, 544.03], [785.74, 545.0], [780.72, 545.0], [775.84, 545.0], [771.1, 545.0], [766.47, 545.0], [761.95, 545.0], [757.53, 545.0], [753.2, 545.0], [748.96, 545.0], [744.79, 545.0], [740.68, 545.0], [736.63, 545.0], [732.64, 545.0], [728.69, 545.0], [724.79, 545.0], [720.92, 545.0], [717.08, 545.0], [713.26, 545.0], [709.46, 545.0], [705.67, 545.0], [701.89, 545.0], [698.11, 545.0], [694.33, 545.0], [690.54, 545.0], [686.74, 545.0], [682.92, 545.0], [679.08, 545.0], [675.21, 545.0], [671.31, 545.0], [667.36, 545.0], [663.37, 545.0], [659.32, 545.0], [655.21, 545.0], [651.04, 545.0], [646.8, 545.0], [642.47, 545.0], [638.05, 545.0], [633.53, 545.0], [628.9, 545.0], [624.16, 545.0], [619.28, 545.0], [614.26, 545.0], [609.69, 544.03], [605.97, 541.63], [602.31, 539.13], [598.72, 536.54], [595.2, 533.85], [591.75, 531.08], [588.37, 528.21], [585.07, 525.26], [584.2, 524.46], [584.16, 524.42], [584.12, 524.38], [581.84, 522.23], [578.7, 519.11], [575.64, 515.91], [572.66, 512.63], [569.77, 509.27]], "x": 700.0, "y": 400.0}, {"covered_rooms": [{"coverage_pct": 45.0, "room_name": "Master Bedroom"}], "entity_id": "binary_sensor.master_bedroom_motion", "floor": "upstairs", "fov_deg": 110.0, "heading_deg": 0.0, "host_room": "Master Bedroom", "id": "binary_sensor.master_bedroom_motion", "name": "Master Bedroom PIR (Ecobee)", "range_px": 220.0, "visibility_polygon": [[150.0, 280.0], [276.19, 99.79], [280.82, 103.12], [285.36, 106.57], [289.82, 110.14], [293.12, 112.91], [293.17, 112.96], [293.23, 113.01], [294.18, 113.83], [298.44, 117.62], [302.6, 121.53], [306.66, 125.54], [310.61, 129.66], [314.46, 133.87], [318.2, 138.19], [321.82, 142.6], [325.32, 147.1], [328.71, 151.7], [331.98, 156.38], [335.13, 161.14], [338.15, 165.98], [341.04, 170.9], [343.81, 175.89], [346.44, 180.96], [348.95, 186.08], [351.32, 191.28], [353.55, 196.53], [355.65, 201.84], [357.61, 207.2], [359.42, 212.61], [360.0, 218.39], [360.0, 224.26], [360.0, 230.05], [360.0, 235.78], [360.0, 241.44], [360.0, 247.04], [360.0, 249.93], [360.0, 250.0], [360.0, 250.07], [360.0, 252.6], [360.0, 258.13], [360.0, 263.62], [360.0, 264.93], [360.0, 265.0], [369.45, 264.4], [369.7, 268.59], [369.93, 274.29], [370.0, 280.0], [369.93, 285.71], [369.7, 291.41], [369.33, 297.11], [368.82, 302.79], [368.47, 305.93], [360.0, 305.0], [360.0, 305.07], [360.0, 307.4], [360.0, 312.96], [360.0, 318.56], [360.0, 324.22], [360.0, 329.95], [360.0, 335.74], [360.0, 341.61], [359.42, 347.39], [357.61, 352.8], [355.65, 358.16], [353.55, 363.47], [351.32, 368.72], [348.95, 373.92], [348.66, 374.52], [348.63, 374.59], [348.6, 374.65], [346.44, 379.04], [343.81, 384.11], [343.0, 385.6], [342.96, 385.67], [342.92, 385.74], [341.04, 389.1], [338.15, 394.02], [335.13, 398.86], [331.98, 403.62], [328.71, 408.3], [327.05, 410.59], [327.01, 410.65], [326.96, 410.71], [325.32, 412.9], [321.82, 417.4], [318.2, 421.81], [314.46, 426.13], [310.61, 430.34], [306.66, 434.46], [302.6, 438.47], [298.44, 442.38], [294.18, 446.17], [289.82, 449.86], [285.36, 453.43], [280.82, 456.88], [276.19, 460.21]], "x": 150.0, "y": 280.0}, {"covered_rooms": [{"coverage_pct": 73.4, "room_name": "Margot's Room"}], "entity_id": "binary_sensor.nursery_motion", "floor": "upstairs", "fov_deg": 110.0, "heading_deg": 315.0, "host_room": "Margot's Room", "id": "binary_sensor.nursery_motion", "name": "Nursery PIR (Ecobee)", "range_px": 210.0, "visibility_polygon": [[380.0, 230.0], [360.0, 116.57], [360.0, 96.39], [360.0, 67.75], [360.0, 35.67], [360.0, 35.0], [360.07, 35.0], [361.08, 35.0], [366.18, 35.0], [371.26, 35.0], [376.32, 35.0], [381.38, 35.0], [386.44, 35.0], [391.51, 35.0], [396.6, 35.0], [401.71, 35.0], [406.84, 35.0], [412.02, 35.0], [417.24, 35.0], [422.51, 35.0], [427.84, 35.0], [433.24, 35.0], [438.71, 35.0], [444.28, 35.0], [449.93, 35.0], [455.7, 35.0], [461.05, 36.27], [466.05, 38.44], [470.99, 40.74], [475.87, 43.16], [480.68, 45.71], [485.43, 48.38], [490.1, 51.18], [494.71, 54.1], [499.23, 57.13], [503.68, 60.28], [508.04, 63.55], [512.31, 66.92], [516.5, 70.41], [520.59, 74.01], [524.59, 77.71], [528.49, 81.51], [532.29, 85.41], [535.99, 89.41], [539.59, 93.5], [540.13, 94.14], [540.18, 94.2], [540.23, 94.25], [543.08, 97.69], [546.45, 101.96], [549.72, 106.32], [552.87, 110.77], [555.9, 115.29], [558.82, 119.9], [561.62, 124.57], [564.29, 129.32], [566.84, 134.13], [569.26, 139.01], [571.56, 143.95], [573.73, 148.95], [575.77, 154.0], [577.67, 159.11], [579.44, 164.26], [581.08, 169.45], [582.59, 174.69], [583.95, 179.97], [585.18, 185.27], [586.27, 190.61], [587.23, 195.98], [588.04, 201.36], [588.71, 206.77], [589.24, 212.19], [589.64, 217.62], [589.89, 223.07], [589.99, 228.51], [589.96, 233.96], [589.79, 239.41], [589.53, 244.08], [589.52, 244.16], [589.52, 244.23], [589.47, 244.85], [589.39, 246.03], [589.38, 246.11], [589.38, 246.18], [589.22, 248.12], [589.21, 248.19], [589.2, 248.27], [586.18, 250.0], [556.55, 250.0], [588.66, 253.71], [588.65, 253.78], [588.42, 255.69], [588.25, 257.09], [588.24, 257.16], [588.23, 257.23], [587.9, 259.63], [520.0, 250.0], [519.65, 250.0], [513.61, 250.0], [495.24, 250.0], [495.0, 250.0], [494.76, 250.0], [493.43, 250.0]], "x": 380.0, "y": 230.0}, {"covered_rooms": [{"coverage_pct": 85.9, "room_name": "Guest Room"}], "entity_id": "binary_sensor.guest_room_motion", "floor": "upstairs", "fov_deg": 110.0, "heading_deg": 140.0, "host_room": "Guest Room", "id": "binary_sensor.guest_room_motion", "name": "Guest Room PIR (Ecobee)", "range_px": 240.0, "visibility_polygon": [[850.0, 55.0], [867.06, 250.0], [861.97, 250.0], [856.9, 250.0], [851.84, 250.0], [846.78, 250.0], [841.72, 250.0], [836.64, 250.0], [831.55, 250.0], [826.43, 250.0], [821.28, 250.0], [816.09, 250.0], [810.85, 250.0], [805.56, 250.0], [800.21, 250.0], [794.78, 250.0], [789.27, 250.0], [783.68, 250.0], [777.98, 250.0], [772.18, 250.0], [766.25, 250.0], [760.19, 250.0], [753.98, 250.0], [747.61, 250.0], [741.07, 250.0], [734.33, 250.0], [727.38, 250.0], [720.2, 250.0], [712.77, 250.0], [706.83, 247.62], [701.88, 243.84], [697.04, 239.94], [692.29, 235.91], [690.27, 234.13], [690.21, 234.07], [690.15, 234.02], [687.65, 231.76], [685.57, 229.83], [685.51, 229.77], [685.45, 229.71], [683.12, 227.48], [678.7, 223.1], [674.4, 218.6], [674.19, 218.37], [674.13, 218.31], [674.07, 218.25], [671.3, 215.2], [671.24, 215.14], [671.18, 215.08], [670.21, 213.99], [667.56, 210.94], [667.51, 210.88], [667.46, 210.81], [666.15, 209.27], [663.79, 206.41], [663.73, 206.34], [663.68, 206.28], [662.21, 204.45], [658.4, 199.53], [654.71, 194.51], [651.16, 189.39], [650.04, 187.73], [649.99, 187.66], [649.95, 187.59], [647.74, 184.19], [644.46, 178.9], [641.31, 173.53], [638.31, 168.07], [635.44, 162.54], [632.73, 156.94], [630.15, 151.27], [627.73, 145.54], [625.46, 139.74], [623.33, 133.89], [621.36, 127.98], [619.55, 122.02], [617.89, 116.02], [616.38, 109.98], [615.03, 103.9], [613.85, 97.79], [612.81, 91.65], [611.94, 85.48], [611.23, 79.3], [610.68, 73.1], [610.29, 66.88], [610.07, 60.66], [610.0, 54.43], [610.1, 48.21], [610.35, 41.99], [610.77, 35.77], [610.82, 35.15], [610.83, 35.07], [611.01, 35.0], [662.27, 35.0], [699.46, 35.0], [724.49, 35.0], [742.51, 35.0], [756.12, 35.0], [766.78, 35.0], [775.36, 35.0]], "x": 850.0, "y": 55.0}, {"covered_rooms": [{"coverage_pct": 57.8, "room_name": "Office"}], "entity_id": "binary_sensor.office_motion", "floor": "upstairs", "fov_deg": 110.0, "heading_deg": 145.0, "host_room": "Office", "id": "binary_sensor.office_motion", "name": "Office PIR (Ecobee)", "range_px": 230.0, "visibility_polygon": [[850.0, 275.0], [850.0, 505.0], [844.03, 504.92], [838.07, 504.69], [832.12, 504.3], [826.17, 503.76], [820.25, 503.07], [814.34, 502.22], [808.46, 501.22], [802.6, 500.06], [796.78, 498.76], [791.0, 497.3], [785.25, 495.7], [779.55, 493.94], [773.89, 492.04], [768.28, 489.99], [762.74, 487.8], [757.24, 485.47], [751.82, 482.99], [746.45, 480.37], [741.16, 477.62], [735.94, 474.73], [730.8, 471.7], [725.74, 468.54], [720.76, 465.25], [715.86, 461.84], [711.06, 458.29], [706.36, 454.63], [701.74, 450.84], [697.23, 446.94], [692.82, 442.92], [688.52, 438.78], [684.33, 434.54], [680.24, 430.19], [676.27, 425.73], [672.42, 421.17], [668.69, 416.52], [665.08, 411.77], [661.6, 406.92], [658.24, 401.99], [655.01, 396.97], [651.91, 391.87], [648.94, 386.7], [646.11, 381.44], [643.42, 376.12], [640.87, 370.72], [639.32, 367.26], [639.28, 367.19], [639.25, 367.11], [638.45, 365.27], [637.35, 362.65], [637.32, 362.57], [637.29, 362.5], [636.18, 359.75], [634.77, 356.09], [634.74, 356.01], [634.71, 355.94], [634.06, 354.17], [632.18, 348.86], [632.16, 348.79], [632.13, 348.71], [632.08, 348.55], [631.83, 347.81], [631.8, 347.73], [631.78, 347.66], [630.24, 342.87], [628.55, 337.14], [627.02, 331.38], [625.63, 325.58], [624.39, 319.74], [623.31, 313.87], [622.42, 308.27], [622.41, 308.19], [622.4, 308.11], [622.38, 307.98], [621.6, 302.06], [620.97, 296.13], [620.5, 290.18], [620.18, 284.22], [620.02, 278.25], [620.02, 272.29], [620.05, 270.29], [620.05, 270.21], [620.05, 270.13], [620.16, 266.32], [620.44, 260.73], [620.45, 260.65], [620.45, 260.57], [620.47, 260.36], [620.65, 257.71], [620.66, 257.63], [620.66, 257.55], [620.82, 255.59], [620.83, 255.51], [620.83, 255.43], [620.92, 254.41], [621.23, 251.25], [621.24, 251.17], [621.25, 251.09], [634.64, 250.0], [639.37, 250.0], [640.0, 250.0], [640.62, 250.0], [674.52, 250.0], [675.57, 250.0], [676.0, 250.0], [676.43, 250.0], [702.11, 250.0], [722.35, 250.0], [737.86, 250.0], [750.13, 250.0], [760.1, 250.0], [768.37, 250.0], [775.34, 250.0], [781.31, 250.0]], "x": 850.0, "y": 275.0}, {"covered_rooms": [{"coverage_pct": 62.5, "room_name": "Upstairs Hallway & Stairs"}], "entity_id": "binary_sensor.upper_level_keypad_motion", "floor": "upstairs", "fov_deg": 120.0, "heading_deg": 90.0, "host_room": "Upstairs Hallway & Stairs", "id": "binary_sensor.upper_level_keypad_motion", "name": "Upstairs Hallway Keypad PIR", "range_px": 150.0, "visibility_polygon": [[485.0, 260.0], [610.0, 332.17], [610.0, 336.6], [610.0, 341.18], [608.62, 344.96], [606.35, 348.17], [604.0, 351.31], [601.57, 354.4], [599.06, 357.42], [596.47, 360.37], [593.81, 363.25], [593.24, 363.84], [593.21, 363.88], [593.17, 363.92], [591.07, 366.07], [588.25, 368.81], [586.4, 370.54], [586.36, 370.57], [586.32, 370.61], [585.37, 371.47], [582.42, 374.06], [579.4, 376.57], [576.31, 379.0], [572.19, 380.0], [571.06, 380.0], [571.0, 380.0], [572.34, 381.95], [569.96, 383.62], [566.7, 385.8], [563.37, 387.9], [560.0, 389.9], [556.57, 391.82], [553.1, 393.65], [549.58, 395.39], [547.55, 396.34], [540.0, 380.0], [539.95, 380.0], [538.43, 380.0], [535.05, 380.0], [535.0, 380.0], [534.95, 380.0], [534.71, 380.0], [531.06, 380.0], [527.49, 380.0], [523.99, 380.0], [520.55, 380.0], [517.15, 380.0], [513.81, 380.0], [510.51, 380.0], [507.24, 380.0], [504.01, 380.0], [500.8, 380.0], [500.04, 380.0], [500.0, 380.0], [499.96, 380.0], [497.61, 380.0], [494.44, 380.0], [491.29, 380.0], [488.14, 380.0], [485.0, 380.0], [481.86, 380.0], [478.71, 380.0], [475.56, 380.0], [472.39, 380.0], [469.2, 380.0], [465.99, 380.0], [462.76, 380.0], [459.49, 380.0], [456.19, 380.0], [452.85, 380.0], [449.45, 380.0], [446.01, 380.0], [442.51, 380.0], [438.94, 380.0], [435.29, 380.0], [431.57, 380.0], [427.76, 380.0], [423.86, 380.0], [419.85, 380.0], [415.72, 380.0], [411.46, 380.0], [407.07, 380.0], [402.53, 380.0], [399.35, 380.0], [399.29, 380.0], [399.22, 380.0], [397.81, 380.0], [393.69, 379.0], [390.6, 376.57], [387.58, 374.06], [384.63, 371.47], [383.13, 370.1], [383.09, 370.06], [383.05, 370.03], [381.75, 368.81], [378.93, 366.07], [376.83, 363.92], [376.79, 363.88], [376.76, 363.84], [376.19, 363.25], [373.53, 360.37], [370.94, 357.42], [368.43, 354.4], [366.0, 351.31], [363.65, 348.17], [361.38, 344.96], [360.0, 341.18], [360.0, 336.6], [360.0, 332.17]], "x": 485.0, "y": 260.0}, {"covered_rooms": [{"coverage_pct": 85.9, "room_name": "Basement Theater"}], "entity_id": "binary_sensor.motion_detector_basement1", "floor": "basement", "fov_deg": 100.0, "heading_deg": 140.0, "host_room": "Basement Theater", "id": "binary_sensor.motion_detector_basement1", "name": "Basement Theater PIR (Ring)", "range_px": 200.0, "visibility_polygon": [[765.0, 385.0], [765.0, 535.0], [761.09, 535.0], [757.18, 535.0], [753.25, 535.0], [749.31, 535.0], [745.35, 535.0], [741.36, 535.0], [737.34, 535.0], [733.28, 535.0], [729.17, 535.0], [725.02, 535.0], [720.8, 535.0], [716.52, 535.0], [712.17, 535.0], [707.73, 535.0], [703.21, 535.0], [698.59, 535.0], [693.86, 535.0], [689.01, 535.0], [684.04, 535.0], [678.92, 535.0], [673.64, 535.0], [668.2, 535.0], [662.57, 535.0], [656.73, 535.0], [650.68, 535.0], [644.37, 535.0], [637.8, 535.0], [635.09, 535.0], [635.0, 535.0], [635.0, 534.89], [635.0, 530.44], [635.0, 525.1], [635.0, 525.0], [635.0, 524.9], [635.0, 523.03], [635.0, 516.02], [635.0, 509.37], [635.0, 503.04], [635.0, 497.0], [635.0, 491.23], [635.0, 485.7], [635.0, 485.07], [635.0, 485.0], [606.43, 506.89], [603.75, 503.31], [600.72, 499.07], [597.81, 494.76], [595.0, 490.36], [592.32, 485.9], [589.75, 481.37], [587.3, 476.77], [584.97, 472.11], [582.76, 467.39], [580.68, 462.62], [578.72, 457.79], [576.88, 452.91], [575.18, 447.99], [573.6, 443.03], [572.16, 438.02], [570.84, 432.98], [570.14, 430.04], [635.0, 415.0], [635.0, 414.95], [635.0, 413.55], [635.0, 410.02], [635.0, 406.53], [635.0, 403.06], [635.0, 399.62], [635.0, 396.2], [635.0, 392.8], [635.0, 389.4], [635.0, 386.02], [635.0, 382.63], [635.0, 379.24], [635.0, 375.84], [635.0, 375.05], [635.0, 375.0], [635.0, 374.95], [635.0, 372.43], [635.0, 370.05], [635.0, 370.0], [635.4, 370.0], [643.1, 370.0], [664.72, 370.0], [679.93, 370.0]], "x": 765.0, "y": 385.0}, {"covered_rooms": [{"coverage_pct": 45.0, "room_name": "Basement Play Area"}], "entity_id": "binary_sensor.motion_sensor_gen2_motion_detection", "floor": "basement", "fov_deg": 105.0, "heading_deg": 45.0, "host_room": "Basement Play Area", "id": "binary_sensor.motion_sensor_gen2_motion_detection", "name": "Basement Play Area PIR (Z-Wave)", "range_px": 300.0, "visibility_polygon": [[235.0, 60.0], [386.92, 40.0], [425.29, 40.0], [489.12, 40.0], [534.59, 44.3], [534.62, 44.91], [534.63, 45.02], [534.63, 45.12], [534.9, 52.15], [535.0, 60.0], [534.9, 67.85], [534.63, 74.88], [534.63, 74.98], [534.62, 75.09], [534.59, 75.7], [534.08, 83.54], [533.36, 91.36], [532.43, 99.16], [531.7, 104.4], [531.68, 104.5], [531.67, 104.61], [531.31, 106.93], [529.98, 114.67], [528.44, 122.37], [526.71, 130.03], [524.78, 137.65], [522.65, 145.2], [520.32, 152.71], [517.79, 160.14], [515.07, 167.51], [512.37, 174.3], [512.33, 174.4], [512.29, 174.5], [512.16, 174.81], [509.89, 180.15], [509.85, 180.25], [509.81, 180.34], [509.06, 182.02], [505.78, 189.15], [502.3, 196.2], [498.65, 203.15], [494.81, 210.0], [490.79, 216.75], [486.6, 223.39], [482.24, 229.92], [477.71, 236.34], [473.01, 242.63], [468.14, 248.8], [463.12, 254.83], [457.94, 260.74], [452.61, 266.51], [447.13, 272.13], [441.51, 277.61], [435.74, 282.94], [429.83, 288.12], [423.8, 293.14], [417.63, 298.01], [411.34, 302.71], [404.92, 307.24], [398.39, 311.6], [391.75, 315.79], [385.0, 319.81], [378.15, 323.65], [371.2, 327.3], [364.15, 330.78], [357.02, 334.06], [349.81, 337.16], [342.51, 340.07], [335.14, 342.79], [327.71, 345.32], [320.2, 347.65], [312.65, 349.78], [305.03, 351.71], [297.37, 353.44], [289.67, 354.98], [281.93, 356.31], [274.16, 357.43], [266.36, 358.36], [258.54, 359.08], [250.7, 359.59], [242.85, 359.9], [235.0, 360.0], [227.15, 359.9], [220.0, 346.22], [220.0, 250.59], [220.0, 202.72], [220.0, 173.94]], "x": 235.0, "y": 60.0}, {"covered_rooms": [{"coverage_pct": 45.0, "room_name": "Basement Play Area"}], "entity_id": "binary_sensor.basement_motion", "floor": "basement", "fov_deg": 110.0, "heading_deg": 270.0, "host_room": "Basement Play Area", "id": "binary_sensor.basement_motion", "name": "Basement PIR (Ecobee)", "range_px": 260.0, "visibility_polygon": [[420.0, 515.0], [220.0, 374.96], [220.0, 367.08], [220.0, 358.89], [220.0, 350.37], [223.61, 344.61], [228.1, 339.57], [232.72, 334.65], [237.46, 329.86], [242.32, 325.18], [247.31, 320.64], [252.41, 316.22], [257.62, 311.94], [262.94, 307.8], [268.37, 303.79], [273.9, 299.93], [279.53, 296.21], [285.25, 292.64], [291.06, 289.22], [296.96, 285.95], [302.95, 282.84], [309.01, 279.88], [315.15, 277.08], [321.35, 274.44], [327.63, 271.96], [333.96, 269.65], [340.36, 267.5], [346.8, 265.52], [353.3, 263.7], [359.84, 262.06], [366.42, 260.58], [373.04, 259.28], [379.69, 258.14], [386.37, 257.18], [393.07, 256.4], [399.78, 255.79], [406.52, 255.35], [413.26, 255.09], [420.0, 255.0], [426.74, 255.09], [433.48, 255.35], [440.22, 255.79], [446.93, 256.4], [453.63, 257.18], [460.31, 258.14], [466.96, 259.28], [473.58, 260.58], [480.16, 262.06], [486.7, 263.7], [493.2, 265.52], [499.64, 267.5], [506.04, 269.65], [512.37, 271.96], [518.65, 274.44], [524.85, 277.08], [530.99, 279.88], [537.05, 282.84], [543.04, 285.95], [548.94, 289.22], [554.75, 292.64], [560.47, 296.21], [566.1, 299.93], [571.63, 303.79], [574.77, 306.08], [574.85, 306.14], [574.92, 306.19], [577.06, 307.8], [578.27, 308.73], [578.35, 308.78], [578.42, 308.84], [582.38, 311.94], [587.59, 316.22], [591.82, 319.87], [591.89, 319.93], [591.96, 319.99], [592.69, 320.64], [593.42, 321.28], [593.48, 321.34], [593.55, 321.4], [597.68, 325.18], [602.54, 329.86], [607.28, 334.65], [608.55, 335.97], [608.61, 336.04], [608.67, 336.11], [611.9, 339.57], [616.39, 344.61], [620.74, 349.76], [624.96, 355.02], [629.04, 360.4], [632.98, 365.87]], "x": 420.0, "y": 515.0}, {"covered_rooms": [{"coverage_pct": 85.9, "room_name": "Storage Room"}], "entity_id": "binary_sensor.motion_utility_room", "floor": "basement", "fov_deg": 100.0, "heading_deg": 135.0, "host_room": "Storage Room", "id": "binary_sensor.motion_utility_room", "name": "Storage / Gym PIR", "range_px": 180.0, "visibility_polygon": [[765.0, 55.0], [779.87, 225.0], [775.42, 225.0], [770.98, 225.0], [766.55, 225.0], [762.12, 225.0], [757.69, 225.0], [753.25, 225.0], [748.79, 225.0], [744.31, 225.0], [739.8, 225.0], [735.25, 225.0], [730.67, 225.0], [726.03, 225.0], [721.34, 225.0], [716.59, 225.0], [711.76, 225.0], [706.86, 225.0], [702.34, 223.74], [697.96, 222.05], [693.63, 220.25], [689.35, 218.33], [685.13, 216.31], [680.95, 214.17], [676.83, 211.93], [673.48, 210.0], [673.43, 209.97], [673.37, 209.93], [672.78, 209.58], [672.23, 209.25], [672.18, 209.22], [672.13, 209.19], [668.78, 207.12], [664.85, 204.57], [660.99, 201.91], [659.66, 200.96], [659.61, 200.92], [659.56, 200.89], [657.2, 199.15], [655.71, 198.02], [655.66, 197.98], [655.61, 197.95], [653.48, 196.29], [649.84, 193.34], [646.27, 190.29], [642.79, 187.15], [639.39, 183.93], [636.07, 180.61], [635.0, 175.22], [635.0, 169.08], [635.0, 163.22], [635.0, 157.61], [635.0, 152.22], [635.0, 147.04], [635.0, 142.05], [635.0, 137.23], [635.0, 132.56], [635.0, 128.04], [635.0, 123.65], [635.0, 120.06], [635.0, 120.0], [603.98, 135.44], [603.69, 134.87], [601.67, 130.65], [599.75, 126.37], [597.95, 122.04], [596.26, 117.66], [594.68, 113.25], [593.23, 108.79], [591.88, 104.3], [590.66, 99.77], [589.55, 95.22], [588.56, 90.63], [588.25, 89.05], [635.0, 80.0], [635.0, 79.95], [635.0, 77.75], [635.0, 74.27], [635.0, 70.82], [635.0, 67.4], [635.0, 63.99], [635.0, 60.59], [635.0, 57.2], [635.0, 53.81], [635.0, 50.43], [635.0, 47.03], [635.0, 43.63]], "x": 765.0, "y": 55.0}], "room_coverage": {"Basement Bathroom": {"ble_proxies": [{"host_room": "Basement Play Area", "id": "basement_speaker", "name": "Basement Speaker BLE Proxy"}], "max_coverage_pct": 0.0, "pir_sensors": [], "primary_cameras": [], "spillover_cameras": [], "sub_zones": [], "uncovered_pct": 100.0}, "Basement Play Area": {"ble_proxies": [{"host_room": "Basement Play Area", "id": "basement_speaker", "name": "Basement Speaker BLE Proxy"}], "max_coverage_pct": 65.0, "pir_sensors": [{"coverage_pct": 45.0, "entity_id": "binary_sensor.motion_sensor_gen2_motion_detection", "id": "binary_sensor.motion_sensor_gen2_motion_detection", "name": "Basement Play Area PIR (Z-Wave)"}, {"coverage_pct": 45.0, "entity_id": "binary_sensor.basement_motion", "id": "binary_sensor.basement_motion", "name": "Basement PIR (Ecobee)"}], "primary_cameras": [{"camera_id": "camera.basement_play_area", "coverage_pct": 65.0}], "spillover_cameras": [{"camera_id": "camera.basement_theater", "host_room": "Basement Theater", "overlap_pct": 18.0}], "sub_zones": [{"camera_id": "camera.basement_theater", "entity_id": "binary_sensor.basement_bar_person_occupancy", "floor": "basement", "height": 95.0, "id": "basement_bar", "label": "Basement Wet Bar", "room": "Basement Play Area", "width": 110.0, "x": 520.0, "y": 360.0}, {"camera_id": "camera.basement_theater", "entity_id": "binary_sensor.basement_play_area_far_person_occupancy", "floor": "basement", "height": 140.0, "id": "basement_play_area_far", "label": "Play Area East", "room": "Basement Play Area", "width": 160.0, "x": 440.0, "y": 280.0}, {"camera_id": "camera.basement_theater", "entity_id": "binary_sensor.basement_stairwell_person_occupancy", "floor": "basement", "height": 75.0, "id": "basement_stairwell", "label": "Basement Stairwell", "room": "Basement Play Area", "width": 95.0, "x": 535.0, "y": 450.0}, {"camera_id": "camera.basement_play_area", "entity_id": "binary_sensor.basement_play_floor_person_occupancy", "floor": "basement", "height": 220.0, "id": "basement_play_floor", "label": "Play Area Main Floor", "room": "Basement Play Area", "width": 220.0, "x": 260.0, "y": 240.0}, {"camera_id": "camera.basement_play_area", "entity_id": "binary_sensor.basement_counter_person_occupancy", "floor": "basement", "height": 120.0, "id": "basement_counter", "label": "Play Area North Counter", "room": "Basement Play Area", "width": 180.0, "x": 250.0, "y": 70.0}], "uncovered_pct": 35.0}, "Basement Theater": {"ble_proxies": [{"host_room": "Basement Play Area", "id": "basement_speaker", "name": "Basement Speaker BLE Proxy"}], "max_coverage_pct": 82.0, "pir_sensors": [{"coverage_pct": 85.9, "entity_id": "binary_sensor.motion_detector_basement1", "id": "binary_sensor.motion_detector_basement1", "name": "Basement Theater PIR (Ring)"}], "primary_cameras": [{"camera_id": "camera.basement_theater", "coverage_pct": 82.0}], "spillover_cameras": [{"camera_id": "camera.basement_play_area", "host_room": "Basement Play Area", "overlap_pct": 18.0}], "sub_zones": [{"camera_id": "camera.basement_theater", "entity_id": "binary_sensor.basement_theater_couch_person_occupancy", "floor": "basement", "height": 90.0, "id": "basement_theater_couch", "label": "Theater Couch", "room": "Basement Theater", "width": 110.0, "x": 650.0, "y": 430.0}, {"camera_id": "camera.basement_theater", "entity_id": "binary_sensor.basement_theater_playpen_person_occupancy", "floor": "basement", "height": 55.0, "id": "basement_theater_playpen", "label": "Theater Playpen", "room": "Basement Theater", "width": 85.0, "x": 645.0, "y": 375.0}, {"camera_id": "camera.basement_theater", "entity_id": "binary_sensor.basement_theater_floor_person_occupancy", "floor": "basement", "height": 85.0, "id": "basement_theater_floor", "label": "Theater Floor", "room": "Basement Theater", "width": 95.0, "x": 635.0, "y": 395.0}, {"camera_id": "camera.basement_play_area", "entity_id": "binary_sensor.theater_rear_view_person_occupancy", "floor": "basement", "height": 110.0, "id": "theater_rear_view", "label": "Theater Rear View", "room": "Basement Theater", "width": 110.0, "x": 635.0, "y": 380.0}], "uncovered_pct": 18.0}, "Dining Room": {"ble_proxies": [{"host_room": "Living Room", "id": "living_room_speaker", "name": "Living Room Speaker BLE Proxy"}], "max_coverage_pct": 65.0, "pir_sensors": [{"coverage_pct": 68.8, "entity_id": "binary_sensor.thermostat_motion", "id": "binary_sensor.thermostat_motion", "name": "Main Thermostat PIR"}], "primary_cameras": [{"camera_id": "camera.dining_room", "coverage_pct": 65.0}], "spillover_cameras": [], "sub_zones": [{"camera_id": "camera.dining_room", "entity_id": "binary_sensor.dining_room_table_person_occupancy", "floor": "main", "height": 110.0, "id": "dining_room_table", "label": "Dining Table", "room": "Dining Room", "width": 110.0, "x": 185.0, "y": 175.0}, {"camera_id": "camera.dining_room", "entity_id": "binary_sensor.rileys_food_person_occupancy", "floor": "main", "height": 44.0, "id": "rileys_food", "label": "Riley's Food Corner", "room": "Dining Room", "width": 70.0, "x": 240.0, "y": 128.0}], "uncovered_pct": 35.0}, "Family Room": {"ble_proxies": [{"host_room": "Family Room", "id": "family_room_speaker", "name": "Family Room Speaker BLE Proxy"}], "max_coverage_pct": 65.0, "pir_sensors": [{"coverage_pct": 65.6, "entity_id": "binary_sensor.family_room_motion", "id": "binary_sensor.family_room_motion", "name": "Family Room PIR (Ring)"}, {"coverage_pct": 45.0, "entity_id": "binary_sensor.family_room_motion_4", "id": "binary_sensor.family_room_motion_4", "name": "Family/Kitchen PIR (Ecobee)"}], "primary_cameras": [{"camera_id": "camera.family_room", "coverage_pct": 65.0}], "spillover_cameras": [], "sub_zones": [{"camera_id": "camera.family_room", "entity_id": "binary_sensor.family_room_couch_person_occupancy", "floor": "main", "height": 120.0, "id": "family_room_couch", "label": "Family Room Couch", "room": "Family Room", "width": 135.0, "x": 665.0, "y": 185.0}, {"camera_id": "camera.family_room", "entity_id": "binary_sensor.family_room_recliner_person_occupancy", "floor": "main", "height": 75.0, "id": "family_room_recliner", "label": "Family Room Recliner", "room": "Family Room", "width": 80.0, "x": 585.0, "y": 135.0}, {"camera_id": "camera.family_room", "entity_id": "binary_sensor.family_room_floor_person_occupancy", "floor": "main", "height": 115.0, "id": "family_room_floor", "label": "Family Room Floor", "room": "Family Room", "width": 85.0, "x": 580.0, "y": 215.0}], "uncovered_pct": 35.0}, "Front Entry": {"ble_proxies": [{"host_room": "Living Room", "id": "living_room_speaker", "name": "Living Room Speaker BLE Proxy"}, {"host_room": "Family Room", "id": "family_room_speaker", "name": "Family Room Speaker BLE Proxy"}], "max_coverage_pct": 38.0, "pir_sensors": [{"coverage_pct": 60.9, "entity_id": "binary_sensor.keypad_motion", "id": "binary_sensor.keypad_motion", "name": "Front Entry Keypad PIR"}], "primary_cameras": [], "spillover_cameras": [{"camera_id": "camera.living_room", "host_room": "Living Room", "overlap_pct": 38.0}, {"camera_id": "camera.family_room", "host_room": "Family Room", "overlap_pct": 18.0}], "sub_zones": [{"camera_id": "camera.living_room", "entity_id": "binary_sensor.living_room_entry_person_occupancy", "floor": "main", "height": 95.0, "id": "living_room_entry", "label": "Front Entry Archway", "room": "Front Entry", "width": 70.0, "x": 380.0, "y": 365.0}], "uncovered_pct": 62.0}, "Garage": {"ble_proxies": [{"host_room": "Family Room", "id": "family_room_speaker", "name": "Family Room Speaker BLE Proxy"}], "max_coverage_pct": 65.0, "pir_sensors": [{"coverage_pct": 45.3, "entity_id": "binary_sensor.ratgdov25i_47a250_motion", "id": "binary_sensor.ratgdov25i_47a250_motion", "name": "Garage Opener PIR"}], "primary_cameras": [{"camera_id": "camera.garage", "coverage_pct": 65.0}], "spillover_cameras": [], "sub_zones": [{"camera_id": "camera.garage", "entity_id": "binary_sensor.garage_parking_person_occupancy", "floor": "main", "height": 125.0, "id": "garage_parking", "label": "Garage Parking Bay", "room": "Garage", "width": 140.0, "x": 615.0, "y": 410.0}], "uncovered_pct": 35.0}, "Guest Room": {"ble_proxies": [{"host_room": "Margot's Room", "id": "nursery_speaker", "name": "Nursery Speaker BLE Proxy"}, {"host_room": "Office", "id": "office_speaker", "name": "Office Speaker BLE Proxy"}], "max_coverage_pct": 0.0, "pir_sensors": [{"coverage_pct": 85.9, "entity_id": "binary_sensor.guest_room_motion", "id": "binary_sensor.guest_room_motion", "name": "Guest Room PIR (Ecobee)"}], "primary_cameras": [], "spillover_cameras": [], "sub_zones": [], "uncovered_pct": 100.0}, "Kitchen": {"ble_proxies": [{"host_room": "Living Room", "id": "living_room_speaker", "name": "Living Room Speaker BLE Proxy"}, {"host_room": "Family Room", "id": "family_room_speaker", "name": "Family Room Speaker BLE Proxy"}], "max_coverage_pct": 51.0, "pir_sensors": [{"coverage_pct": 70.3, "entity_id": "binary_sensor.family_room_motion_4", "id": "binary_sensor.family_room_motion_4", "name": "Family/Kitchen PIR (Ecobee)"}], "primary_cameras": [], "spillover_cameras": [{"camera_id": "camera.family_room", "host_room": "Family Room", "overlap_pct": 51.0}], "sub_zones": [{"camera_id": "camera.family_room", "entity_id": "binary_sensor.kitchen_island_person_occupancy", "floor": "main", "height": 110.0, "id": "kitchen_island", "label": "Kitchen Island", "room": "Kitchen", "width": 110.0, "x": 445.0, "y": 175.0}], "uncovered_pct": 49.0}, "Living Room": {"ble_proxies": [{"host_room": "Living Room", "id": "living_room_speaker", "name": "Living Room Speaker BLE Proxy"}], "max_coverage_pct": 65.0, "pir_sensors": [], "primary_cameras": [{"camera_id": "camera.living_room", "coverage_pct": 65.0}], "spillover_cameras": [{"camera_id": "camera.dining_room", "host_room": "Dining Room", "overlap_pct": 18.0}], "sub_zones": [{"camera_id": "camera.living_room", "entity_id": "binary_sensor.living_room_couch_person_occupancy", "floor": "main", "height": 115.0, "id": "living_room_couch", "label": "Living Room Couch", "room": "Living Room", "width": 95.0, "x": 170.0, "y": 370.0}, {"camera_id": "camera.living_room", "entity_id": "binary_sensor.living_room_floor_person_occupancy", "floor": "main", "height": 110.0, "id": "living_room_floor", "label": "Living Room Floor", "room": "Living Room", "width": 90.0, "x": 270.0, "y": 380.0}, {"camera_id": "camera.living_room", "entity_id": "binary_sensor.living_room_bay_windows_person_occupancy", "floor": "main", "height": 42.0, "id": "living_room_bay_windows", "label": "Bay Windows", "room": "Living Room", "width": 140.0, "x": 175.0, "y": 495.0}], "uncovered_pct": 35.0}, "Margot's Room": {"ble_proxies": [{"host_room": "Master Bedroom", "id": "master_bedroom_speaker", "name": "Master Bedroom Speaker BLE Proxy"}, {"host_room": "Margot's Room", "id": "nursery_speaker", "name": "Nursery Speaker BLE Proxy"}], "max_coverage_pct": 65.0, "pir_sensors": [{"coverage_pct": 73.4, "entity_id": "binary_sensor.nursery_motion", "id": "binary_sensor.nursery_motion", "name": "Nursery PIR (Ecobee)"}], "primary_cameras": [{"camera_id": "camera.nursery", "coverage_pct": 65.0}], "spillover_cameras": [], "sub_zones": [{"camera_id": "camera.nursery", "entity_id": "binary_sensor.nursery_bed_person_occupancy", "floor": "upstairs", "height": 110.0, "id": "nursery_bed", "label": "Nursery Bed", "room": "Margot's Room", "width": 120.0, "x": 380.0, "y": 60.0}], "uncovered_pct": 35.0}, "Master Bathroom": {"ble_proxies": [], "max_coverage_pct": 18.0, "pir_sensors": [], "primary_cameras": [], "spillover_cameras": [{"camera_id": "camera.master_bedroom", "host_room": "Master Bedroom", "overlap_pct": 18.0}], "sub_zones": [{"camera_id": "camera.master_bedroom", "entity_id": "binary_sensor.master_bathroom_person_occupancy", "floor": "upstairs", "height": 60.0, "id": "master_bathroom", "label": "Master Bath Doorway", "room": "Master Bathroom", "width": 45.0, "x": 340.0, "y": 380.0}], "uncovered_pct": 82.0}, "Master Bedroom": {"ble_proxies": [{"host_room": "Master Bedroom", "id": "master_bedroom_speaker", "name": "Master Bedroom Speaker BLE Proxy"}, {"host_room": "Margot's Room", "id": "nursery_speaker", "name": "Nursery Speaker BLE Proxy"}], "max_coverage_pct": 82.0, "pir_sensors": [{"coverage_pct": 45.0, "entity_id": "binary_sensor.master_bedroom_motion", "id": "binary_sensor.master_bedroom_motion", "name": "Master Bedroom PIR (Ecobee)"}], "primary_cameras": [{"camera_id": "camera.master_bedroom", "coverage_pct": 82.0}], "spillover_cameras": [], "sub_zones": [{"camera_id": "camera.master_bedroom", "entity_id": "binary_sensor.master_bed_person_occupancy", "floor": "upstairs", "height": 130.0, "id": "master_bed", "label": "Master Bed", "room": "Master Bedroom", "width": 130.0, "x": 145.0, "y": 95.0}, {"camera_id": "camera.master_bedroom", "entity_id": "binary_sensor.master_open_area_person_occupancy", "floor": "upstairs", "height": 140.0, "id": "master_open_area", "label": "Master Open Floor", "room": "Master Bedroom", "width": 130.0, "x": 155.0, "y": 240.0}, {"camera_id": "camera.master_bedroom", "entity_id": "binary_sensor.master_bedroom_walkway_person_occupancy", "floor": "upstairs", "height": 180.0, "id": "master_bedroom_walkway", "label": "Master Walkway", "room": "Master Bedroom", "width": 65.0, "x": 290.0, "y": 175.0}, {"camera_id": "camera.master_bedroom", "entity_id": "binary_sensor.master_bedroom_entryway_person_occupancy", "floor": "upstairs", "height": 60.0, "id": "master_bedroom_entryway", "label": "Master Hallway Entry", "room": "Master Bedroom", "width": 45.0, "x": 315.0, "y": 250.0}], "uncovered_pct": 18.0}, "Office": {"ble_proxies": [{"host_room": "Margot's Room", "id": "nursery_speaker", "name": "Nursery Speaker BLE Proxy"}, {"host_room": "Office", "id": "office_speaker", "name": "Office Speaker BLE Proxy"}], "max_coverage_pct": 67.0, "pir_sensors": [{"coverage_pct": 57.8, "entity_id": "binary_sensor.office_motion", "id": "binary_sensor.office_motion", "name": "Office PIR (Ecobee)"}], "primary_cameras": [{"camera_id": "camera.office", "coverage_pct": 67.0}], "spillover_cameras": [], "sub_zones": [{"camera_id": "camera.office", "entity_id": "binary_sensor.steves_desk_person_occupancy", "floor": "upstairs", "height": 95.0, "id": "steves_desk", "label": "Steve's Desk", "room": "Office", "width": 110.0, "x": 725.0, "y": 360.0}, {"camera_id": "camera.office", "entity_id": "binary_sensor.sim_rig_person_occupancy", "floor": "upstairs", "height": 100.0, "id": "sim_rig", "label": "Sim Rig", "room": "Office", "width": 85.0, "x": 635.0, "y": 410.0}, {"camera_id": "camera.office", "entity_id": "binary_sensor.office_floor_person_occupancy", "floor": "upstairs", "height": 95.0, "id": "office_floor", "label": "Office Center Floor", "room": "Office", "width": 120.0, "x": 655.0, "y": 300.0}, {"camera_id": "camera.office", "entity_id": "binary_sensor.office_entryway_person_occupancy", "floor": "upstairs", "height": 55.0, "id": "office_entryway", "label": "Office Doorway", "room": "Office", "width": 55.0, "x": 610.0, "y": 260.0}], "uncovered_pct": 33.0}, "Storage Room": {"ble_proxies": [{"host_room": "Basement Play Area", "id": "basement_speaker", "name": "Basement Speaker BLE Proxy"}], "max_coverage_pct": 65.0, "pir_sensors": [{"coverage_pct": 85.9, "entity_id": "binary_sensor.motion_utility_room", "id": "binary_sensor.motion_utility_room", "name": "Storage / Gym PIR"}], "primary_cameras": [{"camera_id": "camera.storage_room", "coverage_pct": 65.0}], "spillover_cameras": [], "sub_zones": [{"camera_id": "camera.storage_room", "entity_id": "binary_sensor.storage_room_workout_person_occupancy", "floor": "basement", "height": 135.0, "id": "storage_room_workout", "label": "Gym / Workout Mat", "room": "Storage Room", "width": 125.0, "x": 645.0, "y": 75.0}], "uncovered_pct": 35.0}, "Upstairs Bathroom": {"ble_proxies": [{"host_room": "Office", "id": "office_speaker", "name": "Office Speaker BLE Proxy"}], "max_coverage_pct": 0.0, "pir_sensors": [], "primary_cameras": [], "spillover_cameras": [], "sub_zones": [], "uncovered_pct": 100.0}, "Upstairs Hallway & Stairs": {"ble_proxies": [{"host_room": "Master Bedroom", "id": "master_bedroom_speaker", "name": "Master Bedroom Speaker BLE Proxy"}, {"host_room": "Margot's Room", "id": "nursery_speaker", "name": "Nursery Speaker BLE Proxy"}, {"host_room": "Office", "id": "office_speaker", "name": "Office Speaker BLE Proxy"}], "max_coverage_pct": 18.0, "pir_sensors": [{"coverage_pct": 62.5, "entity_id": "binary_sensor.upper_level_keypad_motion", "id": "binary_sensor.upper_level_keypad_motion", "name": "Upstairs Hallway Keypad PIR"}], "primary_cameras": [], "spillover_cameras": [{"camera_id": "camera.master_bedroom", "host_room": "Master Bedroom", "overlap_pct": 18.0}, {"camera_id": "camera.office", "host_room": "Office", "overlap_pct": 18.0}], "sub_zones": [], "uncovered_pct": 82.0}}, "seal_analysis": {"Basement Play Area": {"can_be_bounded": false, "monitored_doors": [], "recommended_mode": "open", "unsealed_exits": ["Family Room (stairs)", "Basement Theater (open passage)", "Storage Room (unmonitored door)", "Basement Bathroom (unmonitored door)"]}, "Basement Theater": {"can_be_bounded": false, "monitored_doors": [], "recommended_mode": "open", "unsealed_exits": ["Family Room (stairs)", "Basement Play Area (open passage)"]}, "Dining Room": {"can_be_bounded": false, "monitored_doors": [], "recommended_mode": "open", "unsealed_exits": ["Living Room (open passage)", "Kitchen (open passage)"]}, "Family Room": {"can_be_bounded": false, "monitored_doors": [], "recommended_mode": "open", "unsealed_exits": ["Front Entry (open passage)", "Kitchen (open passage)", "Garage (unmonitored door)", "Basement Play Area (stairs)", "Basement Theater (stairs)"]}, "Front Entry": {"can_be_bounded": false, "monitored_doors": [], "recommended_mode": "open", "unsealed_exits": ["Living Room (open passage)", "Kitchen (open passage)", "Family Room (open passage)", "Upstairs Hallway & Stairs (stairs)"]}, "Garage": {"can_be_bounded": false, "monitored_doors": [], "recommended_mode": "open", "unsealed_exits": ["Family Room (unmonitored door)"]}, "Guest Room": {"can_be_bounded": false, "monitored_doors": [], "recommended_mode": "open", "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)"]}, "Kitchen": {"can_be_bounded": false, "monitored_doors": [], "recommended_mode": "open", "unsealed_exits": ["Front Entry (open passage)", "Dining Room (open passage)", "Family Room (open passage)"]}, "Living Room": {"can_be_bounded": false, "monitored_doors": [], "recommended_mode": "open", "unsealed_exits": ["Front Entry (open passage)", "Dining Room (open passage)"]}, "Margot's Room": {"can_be_bounded": false, "monitored_doors": [], "recommended_mode": "open", "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)"]}, "Master Bathroom": {"can_be_bounded": false, "monitored_doors": [], "recommended_mode": "open", "unsealed_exits": ["Master Bedroom (unmonitored door)"]}, "Master Bedroom": {"can_be_bounded": false, "monitored_doors": [], "recommended_mode": "open", "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)", "Master Bathroom (unmonitored door)"]}, "Office": {"can_be_bounded": false, "monitored_doors": [], "recommended_mode": "open", "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)"]}, "Storage Room": {"can_be_bounded": false, "monitored_doors": [], "recommended_mode": "open", "unsealed_exits": ["Basement Play Area (unmonitored door)"]}, "Upstairs Bathroom": {"can_be_bounded": false, "monitored_doors": [], "recommended_mode": "open", "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)"]}}, "sub_zone_analysis": [{"camera_id": "camera.living_room", "entity_id": "binary_sensor.living_room_couch_person_occupancy", "floor": "main", "height": 115.0, "id": "living_room_couch", "label": "Living Room Couch", "room": "Living Room", "width": 95.0, "x": 170.0, "y": 370.0}, {"camera_id": "camera.living_room", "entity_id": "binary_sensor.living_room_floor_person_occupancy", "floor": "main", "height": 110.0, "id": "living_room_floor", "label": "Living Room Floor", "room": "Living Room", "width": 90.0, "x": 270.0, "y": 380.0}, {"camera_id": "camera.living_room", "entity_id": "binary_sensor.living_room_bay_windows_person_occupancy", "floor": "main", "height": 42.0, "id": "living_room_bay_windows", "label": "Bay Windows", "room": "Living Room", "width": 140.0, "x": 175.0, "y": 495.0}, {"camera_id": "camera.living_room", "entity_id": "binary_sensor.living_room_entry_person_occupancy", "floor": "main", "height": 95.0, "id": "living_room_entry", "label": "Front Entry Archway", "room": "Front Entry", "width": 70.0, "x": 380.0, "y": 365.0}, {"camera_id": "camera.dining_room", "entity_id": "binary_sensor.dining_room_table_person_occupancy", "floor": "main", "height": 110.0, "id": "dining_room_table", "label": "Dining Table", "room": "Dining Room", "width": 110.0, "x": 185.0, "y": 175.0}, {"camera_id": "camera.dining_room", "entity_id": "binary_sensor.rileys_food_person_occupancy", "floor": "main", "height": 44.0, "id": "rileys_food", "label": "Riley's Food Corner", "room": "Dining Room", "width": 70.0, "x": 240.0, "y": 128.0}, {"camera_id": "camera.family_room", "entity_id": "binary_sensor.family_room_couch_person_occupancy", "floor": "main", "height": 120.0, "id": "family_room_couch", "label": "Family Room Couch", "room": "Family Room", "width": 135.0, "x": 665.0, "y": 185.0}, {"camera_id": "camera.family_room", "entity_id": "binary_sensor.family_room_recliner_person_occupancy", "floor": "main", "height": 75.0, "id": "family_room_recliner", "label": "Family Room Recliner", "room": "Family Room", "width": 80.0, "x": 585.0, "y": 135.0}, {"camera_id": "camera.family_room", "entity_id": "binary_sensor.family_room_floor_person_occupancy", "floor": "main", "height": 115.0, "id": "family_room_floor", "label": "Family Room Floor", "room": "Family Room", "width": 85.0, "x": 580.0, "y": 215.0}, {"camera_id": "camera.family_room", "entity_id": "binary_sensor.kitchen_island_person_occupancy", "floor": "main", "height": 110.0, "id": "kitchen_island", "label": "Kitchen Island", "room": "Kitchen", "width": 110.0, "x": 445.0, "y": 175.0}, {"camera_id": "camera.garage", "entity_id": "binary_sensor.garage_parking_person_occupancy", "floor": "main", "height": 125.0, "id": "garage_parking", "label": "Garage Parking Bay", "room": "Garage", "width": 140.0, "x": 615.0, "y": 410.0}, {"camera_id": "camera.master_bedroom", "entity_id": "binary_sensor.master_bed_person_occupancy", "floor": "upstairs", "height": 130.0, "id": "master_bed", "label": "Master Bed", "room": "Master Bedroom", "width": 130.0, "x": 145.0, "y": 95.0}, {"camera_id": "camera.master_bedroom", "entity_id": "binary_sensor.master_open_area_person_occupancy", "floor": "upstairs", "height": 140.0, "id": "master_open_area", "label": "Master Open Floor", "room": "Master Bedroom", "width": 130.0, "x": 155.0, "y": 240.0}, {"camera_id": "camera.master_bedroom", "entity_id": "binary_sensor.master_bedroom_walkway_person_occupancy", "floor": "upstairs", "height": 180.0, "id": "master_bedroom_walkway", "label": "Master Walkway", "room": "Master Bedroom", "width": 65.0, "x": 290.0, "y": 175.0}, {"camera_id": "camera.master_bedroom", "entity_id": "binary_sensor.master_bedroom_entryway_person_occupancy", "floor": "upstairs", "height": 60.0, "id": "master_bedroom_entryway", "label": "Master Hallway Entry", "room": "Master Bedroom", "width": 45.0, "x": 315.0, "y": 250.0}, {"camera_id": "camera.master_bedroom", "entity_id": "binary_sensor.master_bathroom_person_occupancy", "floor": "upstairs", "height": 60.0, "id": "master_bathroom", "label": "Master Bath Doorway", "room": "Master Bathroom", "width": 45.0, "x": 340.0, "y": 380.0}, {"camera_id": "camera.nursery", "entity_id": "binary_sensor.nursery_bed_person_occupancy", "floor": "upstairs", "height": 110.0, "id": "nursery_bed", "label": "Nursery Bed", "room": "Margot's Room", "width": 120.0, "x": 380.0, "y": 60.0}, {"camera_id": "camera.office", "entity_id": "binary_sensor.steves_desk_person_occupancy", "floor": "upstairs", "height": 95.0, "id": "steves_desk", "label": "Steve's Desk", "room": "Office", "width": 110.0, "x": 725.0, "y": 360.0}, {"camera_id": "camera.office", "entity_id": "binary_sensor.sim_rig_person_occupancy", "floor": "upstairs", "height": 100.0, "id": "sim_rig", "label": "Sim Rig", "room": "Office", "width": 85.0, "x": 635.0, "y": 410.0}, {"camera_id": "camera.office", "entity_id": "binary_sensor.office_floor_person_occupancy", "floor": "upstairs", "height": 95.0, "id": "office_floor", "label": "Office Center Floor", "room": "Office", "width": 120.0, "x": 655.0, "y": 300.0}, {"camera_id": "camera.office", "entity_id": "binary_sensor.office_entryway_person_occupancy", "floor": "upstairs", "height": 55.0, "id": "office_entryway", "label": "Office Doorway", "room": "Office", "width": 55.0, "x": 610.0, "y": 260.0}, {"camera_id": "camera.basement_theater", "entity_id": "binary_sensor.basement_theater_couch_person_occupancy", "floor": "basement", "height": 90.0, "id": "basement_theater_couch", "label": "Theater Couch", "room": "Basement Theater", "width": 110.0, "x": 650.0, "y": 430.0}, {"camera_id": "camera.basement_theater", "entity_id": "binary_sensor.basement_theater_playpen_person_occupancy", "floor": "basement", "height": 55.0, "id": "basement_theater_playpen", "label": "Theater Playpen", "room": "Basement Theater", "width": 85.0, "x": 645.0, "y": 375.0}, {"camera_id": "camera.basement_theater", "entity_id": "binary_sensor.basement_theater_floor_person_occupancy", "floor": "basement", "height": 85.0, "id": "basement_theater_floor", "label": "Theater Floor", "room": "Basement Theater", "width": 95.0, "x": 635.0, "y": 395.0}, {"camera_id": "camera.basement_theater", "entity_id": "binary_sensor.basement_bar_person_occupancy", "floor": "basement", "height": 95.0, "id": "basement_bar", "label": "Basement Wet Bar", "room": "Basement Play Area", "width": 110.0, "x": 520.0, "y": 360.0}, {"camera_id": "camera.basement_theater", "entity_id": "binary_sensor.basement_play_area_far_person_occupancy", "floor": "basement", "height": 140.0, "id": "basement_play_area_far", "label": "Play Area East", "room": "Basement Play Area", "width": 160.0, "x": 440.0, "y": 280.0}, {"camera_id": "camera.basement_theater", "entity_id": "binary_sensor.basement_stairwell_person_occupancy", "floor": "basement", "height": 75.0, "id": "basement_stairwell", "label": "Basement Stairwell", "room": "Basement Play Area", "width": 95.0, "x": 535.0, "y": 450.0}, {"camera_id": "camera.basement_play_area", "entity_id": "binary_sensor.basement_play_floor_person_occupancy", "floor": "basement", "height": 220.0, "id": "basement_play_floor", "label": "Play Area Main Floor", "room": "Basement Play Area", "width": 220.0, "x": 260.0, "y": 240.0}, {"camera_id": "camera.basement_play_area", "entity_id": "binary_sensor.basement_counter_person_occupancy", "floor": "basement", "height": 120.0, "id": "basement_counter", "label": "Play Area North Counter", "room": "Basement Play Area", "width": 180.0, "x": 250.0, "y": 70.0}, {"camera_id": "camera.basement_play_area", "entity_id": "binary_sensor.theater_rear_view_person_occupancy", "floor": "basement", "height": 110.0, "id": "theater_rear_view", "label": "Theater Rear View", "room": "Basement Theater", "width": 110.0, "x": 635.0, "y": 380.0}, {"camera_id": "camera.storage_room", "entity_id": "binary_sensor.storage_room_workout_person_occupancy", "floor": "basement", "height": 135.0, "id": "storage_room_workout", "label": "Gym / Workout Mat", "room": "Storage Room", "width": 125.0, "x": 645.0, "y": 75.0}]};

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
    this._floorplanMode = "rooms"; // "rooms" | "cameras" | "sensors"
    this._selectedSensorId = null;
    this._selectedSubZoneId = null;
    this._selectedBleProxyId = null;
    this._cameraAlignmentResult = null;
    this._cameraAlignmentError = null;
    this._analyzingCamera = false;
    this._timelineData = null;
    this._timelineFrameIdx = 0;
    this._timelinePlaying = false;
    this._timelineSpeed = 1;
    this._timelineTimer = null;
    this._timelineHours = 6;
    this._timelineNegSpace = true;
    this._timelineNegativeSpace = true;
    this._replayNegSpace = true;
    this._replayNegativeSpace = true;
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
    if (!this._initialized || (!this._overview && !this._loading)) {
      this._initialized = true;
      this.loadOverview();
    }
  }

  connectedCallback() {
    if (!this._initialized) {
      this._initialized = true;
      this.render();
      if (this._hass || window.__PDD_MOCK_API__) {
        this.loadOverview();
      }
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

  async loadTimeline(hours = null, negSpace = null) {
    if (hours !== null && hours !== undefined) {
      this._timelineHours = Number(hours);
      this._historyHours = Number(hours);
    }
    if (negSpace !== null && negSpace !== undefined) {
      this._timelineNegativeSpace = Boolean(negSpace);
      this._timelineNegSpace = Boolean(negSpace);
    }
    const h = this._timelineHours || this._historyHours || 6;
    const ns =
      this._timelineNegativeSpace !== undefined
        ? Boolean(this._timelineNegativeSpace)
        : Boolean(this._timelineNegSpace);
    try {
      const res = await this._apiCall(
        "GET",
        `/api/presence_detection_designer/timeline_reconstruction?hours=${h}&negative_space=${ns}`
      );
      this._timelineData = res;
      const frames = res?.frames || [];
      if (this._timelineFrameIdx >= frames.length) {
        this._timelineFrameIdx = Math.max(0, frames.length - 1);
      }
      this.render();
    } catch (err) {
      this.showToast(`Failed to load house timeline: ${err.message}`, "error");
    }
  }

  _toggleTimelinePlay(forceState = null) {
    this._timelinePlaying =
      forceState !== null && forceState !== undefined
        ? Boolean(forceState)
        : !this._timelinePlaying;
    clearInterval(this._timelineTimer);
    if (this._timelinePlaying) {
      const intervalMs = Math.max(80, Math.round(600 / (this._timelineSpeed || 1)));
      this._timelineTimer = setInterval(() => {
        const frames = this._timelineData?.frames || [];
        if (frames.length === 0) {
          this._timelinePlaying = false;
          clearInterval(this._timelineTimer);
          return;
        }
        this._timelineFrameIdx = (this._timelineFrameIdx + 1) % frames.length;
        const curFrame = frames[this._timelineFrameIdx];
        const firstOcc = (curFrame?.occupant_estimates || [])[0];
        if (firstOcc && firstOcc.floor) {
          this._selectedFloorId = firstOcc.floor;
        }
        this.render();
      }, intervalMs);
    }
    this.render();
  }

  async runReplay() {
    if (!this._selectedRoomId || !this._replayCandidate) return;
    const ns =
      this._replayNegativeSpace !== undefined
        ? Boolean(this._replayNegativeSpace)
        : Boolean(this._replayNegSpace);
    try {
      const res = await this._apiCall(
        "POST",
        `/api/presence_detection_designer/room/${this._selectedRoomId}/replay`,
        {
          hours: this._historyHours,
          candidate_config: this._replayCandidate,
          negative_space: ns,
          baseline_negative_space: false,
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
          <button class="nav-tab ${this._studioView === "floorplan" ? "active" : ""}" data-studio-view="floorplan">Floorplan &amp; Sensors</button>
          <button class="nav-tab ${this._studioView === "timeline" ? "active" : ""}" data-studio-view="timeline">Whole-House Timeline</button>
          <button class="nav-tab ${
            this._studioView === "statistics" || this._studioView === "replay" ? "active" : ""
          }" data-studio-view="statistics">Activity History</button>
        </div>

        <div class="header-actions">
          <button
            class="btn btn-sm"
            id="btn-quick-toggle-neg-space"
            title="Global Master Switch: Toggle Negative-Space Spatial Exclusion in live Bayesian room inference"
            style="border-color:${
              this._overview?.global_settings?.negative_space_enabled !== false
                ? "#0284c7"
                : "var(--ha-divider)"
            };background:${
              this._overview?.global_settings?.negative_space_enabled !== false
                ? "rgba(2, 132, 199, 0.1)"
                : "var(--ha-card)"
            };color:${
              this._overview?.global_settings?.negative_space_enabled !== false
                ? "#0284c7"
                : "var(--ha-muted)"
            };font-weight:600;"
          >
            🎯 Negative-Space: ${
              this._overview?.global_settings?.negative_space_enabled !== false ? "ON" : "OFF"
            }
          </button>
          <button class="btn btn-sm" id="btn-header-global">⚙️ Settings</button>
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
              : this._studioView === "timeline"
              ? `<div class="content-stack wide">${this._renderTimelinePane()}</div>`
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

              <div style="border-top:1px solid var(--ha-divider, #e5e7eb);padding-top:12px;margin-top:4px;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
                  <span class="setting-label" style="font-weight:600;">🎯 Negative-Space Bayesian Inference ("Where It Isn't")</span>
                  <input type="checkbox" id="gl-neg-space-enabled" ${
                    this._globalDraft?.negative_space_enabled !== false ? "checked" : ""
                  } />
                </div>
                <div style="font-size:12px;color:var(--ha-muted);line-height:1.4;">
                  Subtract active-clear camera cones and clear PIR cones to localize occupants into uncovered room regions and blind pockets (Master Bathroom, Guest Room, Basement Bathroom). Toggle off to revert to standard Bayesian evaluation.
                </div>
              </div>

              <div style="border-top:1px solid var(--ha-divider, #e5e7eb);padding-top:12px;margin-top:4px;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                  <span class="setting-label" style="font-weight:600;">Slack Presence Notifications</span>
                  <input type="checkbox" id="gl-notify-enabled" ${
                    this._globalDraft?.notifications_enabled !== false ? "checked" : ""
                  } />
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                  <div>
                    <div class="setting-label" style="margin-bottom:4px;">Notify Service</div>
                    <input type="text" class="input" id="gl-slack-service" value="${this._escape(
                      this._globalDraft?.slack_notify_service || "notify.scdbots"
                    )}" placeholder="notify.scdbots" />
                  </div>
                  <div>
                    <div class="setting-label" style="margin-bottom:4px;">Target Channel</div>
                    <input type="text" class="input" id="gl-slack-channel" value="${this._escape(
                      this._globalDraft?.slack_channel || "#presence-alerts"
                    )}" placeholder="#presence-alerts" />
                  </div>
                </div>
                <div style="margin-top:10px;display:flex;justify-content:flex-end;">
                  <button class="btn btn-secondary" id="btn-test-slack-alert" style="font-size:12px;">
                    🔔 Send Test Alert to Slack
                  </button>
                </div>
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

      <!-- 4b. Slack Presence Notifications Card -->
      <div class="ha-card">
        <div class="card-head">
          <div>
            <h3 class="card-title">Slack Presence Notifications</h3>
            <div class="card-desc">
              Send diagnostic alerts to <code>#presence-alerts</code> when presence transitions in this room.
            </div>
          </div>
        </div>

        <div class="list-divider">
          <div class="setting-row">
            <div>
              <div class="setting-label">Enable Slack alerts for this room</div>
              <div class="setting-help">Send real-time cards detailing what sensor or rule caused this room to occupy or clear.</div>
            </div>
            <div>
              <input type="checkbox" id="cfg-notify-slack" ${cfg.notify_slack ? "checked" : ""} style="width:16px;height:16px;" />
            </div>
          </div>

          <div class="setting-row" style="opacity:${cfg.notify_slack ? "1" : "0.5"};pointer-events:${cfg.notify_slack ? "auto" : "none"};">
            <div>
              <div class="setting-label">Transition Triggers</div>
              <div class="setting-help">Choose which presence transitions trigger a Slack notification.</div>
            </div>
            <div style="display:flex;gap:18px;">
              <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;">
                <input type="checkbox" id="cfg-notify-on-occupied" ${cfg.notify_on_occupied !== false ? "checked" : ""} />
                Alert on Occupied
              </label>
              <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;">
                <input type="checkbox" id="cfg-notify-on-cleared" ${cfg.notify_on_cleared !== false ? "checked" : ""} />
                Alert on Cleared
              </label>
            </div>
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
    const allFpSensors = fp.sensors || [];
    const allFpProxies = fp.ble_proxies || [];

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
    const fSensors = allFpSensors.filter((s) => s.floor === activeFloor.id);
    const fProxies = allFpProxies.filter((p) => p.floor === activeFloor.id);

    if (
      fSensors.length > 0 &&
      (!this._selectedSensorId || !fSensors.some((s) => s.id === this._selectedSensorId))
    ) {
      this._selectedSensorId = fSensors[0].id;
    }
    const selSensor = fSensors.find((s) => s.id === this._selectedSensorId) || fSensors[0] || null;

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
    const isSensorMode = this._floorplanMode === "sensors";

    // 3. Camera Sub-Zones (2D bounding boxes inside camera cones)
    const subZonesSvg = fCams
      .map((cam) => {
        const camId = cam.id || cam.camera_entity;
        return (cam.sub_zones || [])
          .map((sz) => {
            const sx = Number(sz.x || 0);
            const sy = Number(sz.y || 0);
            const sw = Math.max(24, Number(sz.width || 60));
            const sh = Math.max(24, Number(sz.height || 60));
            const isSelSz = this._selectedSubZoneId === sz.id && isCamMode;
            return `
              <g class="fp-subzone-group" data-cam-id="${this._escape(camId)}" data-subzone-id="${this._escape(sz.id)}" style="${isCamMode ? "opacity:0.95;" : "opacity:0.55;pointer-events:none;"}">
                <rect
                  class="fp-subzone-rect"
                  data-cam-id="${this._escape(camId)}"
                  data-subzone-id="${this._escape(sz.id)}"
                  x="${sx.toFixed(1)}"
                  y="${sy.toFixed(1)}"
                  width="${sw.toFixed(1)}"
                  height="${sh.toFixed(1)}"
                  rx="4"
                  fill="rgba(14, 165, 233, 0.14)"
                  stroke="${isSelSz ? "#0369a1" : "#0ea5e9"}"
                  stroke-width="${isSelSz ? "2.2" : "1.3"}"
                  stroke-dasharray="3,2"
                  style="${isCamMode ? "cursor:move;pointer-events:all;" : "pointer-events:none;"}"
                />
                <text
                  x="${(sx + sw / 2).toFixed(1)}"
                  y="${(sy + sh / 2 + 3).toFixed(1)}"
                  text-anchor="middle"
                  fill="#0369a1"
                  font-size="9.5"
                  font-weight="600"
                  style="pointer-events:none;user-select:none;"
                >${this._escape(sz.label || sz.id)}</text>
              </g>
            `;
          })
          .join("");
      })
      .join("");

    // 4. PIR Motion Cones, Door Contact Badges & BLE Proxy Anchors
    const bleProxiesSvg = fProxies
      .map((proxy) => {
        const px = Number(proxy.x || 0);
        const py = Number(proxy.y || 0);
        const rad = Number(proxy.radius_px || 230);
        return `
          <g class="fp-ble-group" data-proxy-id="${this._escape(proxy.id)}" style="${isSensorMode ? "opacity:0.95;" : "opacity:0.45;pointer-events:none;"}">
            <circle
              cx="${px.toFixed(1)}"
              cy="${py.toFixed(1)}"
              r="${rad.toFixed(1)}"
              fill="rgba(13, 148, 136, 0.04)"
              stroke="#0d9488"
              stroke-width="1"
              stroke-dasharray="4,4"
              style="pointer-events:none;"
            />
            <circle
              class="fp-ble-origin"
              data-proxy-id="${this._escape(proxy.id)}"
              cx="${px.toFixed(1)}"
              cy="${py.toFixed(1)}"
              r="7"
              fill="#0d9488"
              stroke="#ffffff"
              stroke-width="2"
              style="${isSensorMode ? "cursor:move;pointer-events:all;" : "pointer-events:none;"}"
            />
            <text
              x="${px.toFixed(1)}"
              y="${(py - 10).toFixed(1)}"
              text-anchor="middle"
              fill="#0f766e"
              font-size="10"
              font-weight="600"
              style="pointer-events:none;user-select:none;"
            >🔊 ${this._escape((proxy.name || proxy.id).replace(" BLE Proxy", ""))}</text>
          </g>
        `;
      })
      .join("");

    const sensorsSvg = fSensors
      .map((s) => {
        const sx = Number(s.x || 0);
        const sy = Number(s.y || 0);
        const isSelSens = selSensor && selSensor.id === s.id && isSensorMode;
        if (s.sensor_type === "door_contact") {
          return `
            <g class="fp-sensor-group" data-sensor-id="${this._escape(s.id)}" style="${isSensorMode ? "opacity:1;" : "opacity:0.75;pointer-events:none;"}">
              <rect
                class="fp-sensor-origin"
                data-sensor-id="${this._escape(s.id)}"
                x="${(sx - 8).toFixed(1)}"
                y="${(sy - 8).toFixed(1)}"
                width="16"
                height="16"
                rx="4"
                fill="#ea580c"
                stroke="#ffffff"
                stroke-width="${isSelSens ? "2.5" : "1.5"}"
                style="${isSensorMode ? "cursor:move;pointer-events:all;" : "pointer-events:none;"}"
              />
              <text
                x="${sx.toFixed(1)}"
                y="${(sy - 11).toFixed(1)}"
                text-anchor="middle"
                fill="#c2410c"
                font-size="9.5"
                font-weight="600"
                style="pointer-events:none;user-select:none;"
              >🚪 ${this._escape(s.name || s.id)}</text>
            </g>
          `;
        }
        const conePath = this._coneSvgPath(s, solidSegments);
        const rad = (Number(s.heading_deg || 0) * Math.PI) / 180.0;
        const aimX = sx + Math.cos(rad) * 38;
        const aimY = sy + Math.sin(rad) * 38;
        return `
          <g class="fp-sensor-group" data-sensor-id="${this._escape(s.id)}" style="${isSensorMode ? "opacity:0.95;" : "opacity:0.42;pointer-events:none;"}">
            <path
              d="${conePath}"
              fill="rgba(147, 51, 234, 0.12)"
              stroke="#9333ea"
              stroke-width="${isSelSens ? "2.2" : "1.1"}"
              stroke-dasharray="3,3"
              style="pointer-events:none;"
            />
            <circle
              class="fp-sensor-origin"
              data-sensor-id="${this._escape(s.id)}"
              cx="${sx.toFixed(1)}"
              cy="${sy.toFixed(1)}"
              r="${isSelSens ? "7.5" : "6"}"
              fill="#9333ea"
              stroke="#ffffff"
              stroke-width="2"
              style="${isSensorMode ? "cursor:move;pointer-events:all;" : "pointer-events:none;"}"
            />
            ${
              isSelSens && isSensorMode
                ? `<line x1="${sx.toFixed(1)}" y1="${sy.toFixed(1)}" x2="${aimX.toFixed(1)}" y2="${aimY.toFixed(1)}" stroke="#9333ea" stroke-width="2" />
                   <circle class="fp-sensor-handle" data-sensor-id="${this._escape(s.id)}" data-handle="heading" cx="${aimX.toFixed(1)}" cy="${aimY.toFixed(1)}" r="6" fill="#ffffff" stroke="#9333ea" stroke-width="2.2" style="cursor:crosshair;pointer-events:all;" />`
                : ""
            }
            <text
              x="${sx.toFixed(1)}"
              y="${(sy - 10).toFixed(1)}"
              text-anchor="middle"
              fill="#7e22ce"
              font-size="9.5"
              font-weight="600"
              style="pointer-events:none;user-select:none;"
            >📡 ${this._escape((s.name || s.id).replace(" PIR", ""))}</text>
          </g>
        `;
      })
      .join("");

    // 5. Live Negative-Space & Positive Occupant Estimates on this floor
    const liveEstimates = (this._overview?.spatial_inference?.occupant_estimates || []).filter(
      (est) => est.floor === activeFloor.id
    );
    const occupantsSvg = liveEstimates
      .map((est) => {
        const ox = Number(est.x || 0);
        const oy = Number(est.y || 0);
        const isNeg = est.method === "negative_space" || est.method === "hybrid";
        const badgeColor = isNeg ? "#0284c7" : "#16a34a";
        return `
          <g class="fp-occupant-marker" style="pointer-events:none;">
            <circle cx="${ox.toFixed(1)}" cy="${oy.toFixed(1)}" r="15" fill="${
          isNeg ? "rgba(2, 132, 199, 0.22)" : "rgba(22, 163, 74, 0.22)"
        }" stroke="${badgeColor}" stroke-width="1.5" stroke-dasharray="${isNeg ? "3,2" : "none"}" />
            <circle cx="${ox.toFixed(1)}" cy="${oy.toFixed(1)}" r="6" fill="${badgeColor}" stroke="#ffffff" stroke-width="2" />
            <rect x="${Math.max(10, Math.min(760, ox - 110)).toFixed(1)}" y="${Math.max(8, oy - 34).toFixed(1)}" width="220" height="18" rx="9" fill="${badgeColor}" opacity="0.92" />
            <text x="${Math.max(120, Math.min(870, ox)).toFixed(1)}" y="${Math.max(20, oy - 22).toFixed(1)}" text-anchor="middle" fill="#ffffff" font-size="9.5" font-weight="600">
              🎯 ${this._escape((est.subregion || est.room).slice(0, 36))}
            </text>
          </g>
        `;
      })
      .join("");

    return `
      <div class="ha-card">
        <div class="card-head" style="flex-wrap:wrap;">
          <div>
            <h2 class="card-title" style="font-size:18px;">House Floorplan, Camera Sub-Zones &amp; Sensor Placement</h2>
            <div class="card-desc">
              Switch between <strong>Rooms &amp; Doors</strong>, <strong>Cameras &amp; Sub-Zones</strong>, and <strong>PIR &amp; BLE Sensors</strong> to place and align all spatial layers. Live 🎯 markers show positive sub-zone and negative-space occupant localization.
            </div>
          </div>

          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            <div class="seg-group" id="fp-mode-switcher" style="margin-top:0;">
              <button class="seg-btn ${
                this._floorplanMode === "rooms" ? "active" : ""
              }" id="btn-fp-mode-rooms" style="padding:6px 12px;font-weight:600;">
                🏠 Rooms &amp; Doors
              </button>
              <button class="seg-btn ${
                this._floorplanMode === "cameras" ? "active" : ""
              }" id="btn-fp-mode-cameras" style="padding:6px 12px;font-weight:600;">
                📹 Cameras &amp; Sub-Zones
              </button>
              <button class="seg-btn ${
                this._floorplanMode === "sensors" ? "active" : ""
              }" id="btn-fp-mode-sensors" style="padding:6px 12px;font-weight:600;">
                📡 PIR &amp; BLE Sensors
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
              ${this._showFloorplanInspector ? "Hide Geometry & Sensor Editor" : "Edit Boxes, Cameras & Sensors"}
            </button>
            <button class="btn btn-primary btn-sm" id="btn-fp-compile">Apply Connections to Rooms</button>
          </div>
        </div>

        <div style="background:#f8fafc;border:1px solid var(--ha-divider);border-radius:10px;padding:10px;overflow:hidden;touch-action:none;">
          <svg id="fp-svg-canvas" viewBox="0 0 1000 580" style="width:100%;height:auto;min-height:420px;display:block;user-select:none;touch-action:none;">
            ${underlaySvg}
            ${connsSvg}
            ${roomsSvg}
            ${bleProxiesSvg}
            ${conesSvg}
            ${subZonesSvg}
            ${sensorsSvg}
            ${occupantsSvg}
          </svg>
        </div>

        ${
          this._showFloorplanInspector
            ? `
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(290px, 1fr));gap:16px;margin-top:16px;padding-top:16px;border-top:1px solid var(--ha-divider);">
            <div>
              <div class="setting-label" style="margin-bottom:8px;">Camera Cone &amp; Sub-Zones</div>
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

                <!-- Camera Sub-Zones -->
                <div style="margin-top:10px;padding:8px 10px;background:var(--ha-subtle);border:1px solid var(--ha-divider);border-radius:8px;font-size:12px;">
                  <div style="font-weight:600;margin-bottom:4px;">Frigate Sub-Zones (${(selCam.sub_zones || []).length})</div>
                  ${
                    (selCam.sub_zones || []).length === 0
                      ? `<div style="color:var(--ha-muted);">Whole-frame camera only (no Frigate sub-zones).</div>`
                      : (selCam.sub_zones || [])
                          .map(
                            (sz) => `
                        <div style="display:flex;justify-content:space-between;align-items:center;padding:3px 0;border-bottom:1px dashed var(--ha-divider);">
                          <span>🎯 <strong>${this._escape(sz.label || sz.id)}</strong> (${this._escape(sz.room)})</span>
                          <span style="font-family:var(--ha-mono);font-size:11px;color:var(--ha-muted);">(${Number(sz.x)}, ${Number(sz.y)}) ${Number(sz.width)}×${Number(sz.height)}</span>
                        </div>`
                          )
                          .join("")
                  }
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

            <!-- 3rd Column: PIR Motion, Door Contact & BLE Proxy Placement -->
            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <div class="setting-label" style="margin-bottom:0;">📡 PIR Motion &amp; Door Sensors (${fSensors.length})</div>
                <div style="display:flex;gap:6px;">
                  <button class="btn btn-sm" id="btn-fp-add-pir-sensor" style="padding:3px 8px;font-size:11.5px;">+ PIR Sensor</button>
                  <button class="btn btn-sm" id="btn-fp-add-door-sensor" style="padding:3px 8px;font-size:11.5px;">+ Door Sensor</button>
                </div>
              </div>
              ${
                !selSensor
                  ? `<div style="font-size:13px;color:var(--ha-muted);">No PIR or door sensors on this floor yet.</div>`
                  : `
                <select class="select" id="fp-sensor-select" style="margin-bottom:10px;">
                  ${fSensors
                    .map(
                      (s) =>
                        `<option value="${this._escape(s.id)}" ${
                          s.id === selSensor.id ? "selected" : ""
                        }>${s.sensor_type === "door_contact" ? "🚪" : "📡"} ${this._escape(
                          s.name || s.id
                        )} (${this._escape(s.host_room || "")})</option>`
                    )
                    .join("")}
                </select>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
                  <div>
                    <small>Entity ID</small>
                    <input type="text" class="input fp-sensor-field" data-key="entity_id" value="${this._escape(
                      selSensor.entity_id || ""
                    )}" style="font-size:12px;" />
                  </div>
                  <div>
                    <small>Host Room</small>
                    <select class="select fp-sensor-field" data-key="host_room" style="font-size:12px;">
                      ${fRooms
                        .map((r) => {
                          const rn = r.name || r.room_name;
                          return `<option value="${this._escape(rn)}" ${
                            rn === selSensor.host_room ? "selected" : ""
                          }>${this._escape(rn)}</option>`;
                        })
                        .join("")}
                    </select>
                  </div>
                </div>
                <div style="display:grid;grid-template-columns:repeat(5, 1fr);gap:8px;">
                  <div><small>X</small><input type="number" class="input fp-sensor-field" data-key="x" value="${Number(
                    selSensor.x || 0
                  )}" /></div>
                  <div><small>Y</small><input type="number" class="input fp-sensor-field" data-key="y" value="${Number(
                    selSensor.y || 0
                  )}" /></div>
                  <div><small>Angle°</small><input type="number" class="input fp-sensor-field" data-key="heading_deg" value="${Number(
                    selSensor.heading_deg || 0
                  )}" ${selSensor.sensor_type === "door_contact" ? "disabled" : ""} /></div>
                  <div><small>FOV°</small><input type="number" class="input fp-sensor-field" data-key="fov_deg" value="${Number(
                    selSensor.fov_deg || 110
                  )}" ${selSensor.sensor_type === "door_contact" ? "disabled" : ""} /></div>
                  <div><small>Range</small><input type="number" class="input fp-sensor-field" data-key="range_px" value="${Number(
                    selSensor.range_px || 180
                  )}" ${selSensor.sensor_type === "door_contact" ? "disabled" : ""} /></div>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">
                  <span style="font-size:11.5px;color:var(--ha-muted);">Tip: Switch to <strong>📡 PIR &amp; BLE Sensors</strong> mode to drag on canvas.</span>
                  <button class="btn btn-sm" id="btn-fp-delete-sensor" data-sensor-id="${this._escape(
                    selSensor.id
                  )}" style="padding:2px 8px;color:#dc2626;font-size:11.5px;">Delete Sensor</button>
                </div>`
              }

              <!-- BLE Proxies on this floor -->
              <div style="margin-top:12px;padding-top:10px;border-top:1px dashed var(--ha-divider);">
                <div style="font-size:12.5px;font-weight:600;margin-bottom:6px;">📶 BLE Proxy Anchors on Floor (${fProxies.length})</div>
                <div style="display:flex;flex-direction:column;gap:4px;max-height:110px;overflow-y:auto;">
                  ${fProxies
                    .map(
                      (bp) => `
                    <div style="display:flex;justify-content:space-between;align-items:center;background:var(--ha-subtle);padding:4px 8px;border-radius:6px;font-size:11.5px;">
                      <span><strong>${this._escape(bp.name || bp.id)}</strong> (${this._escape(bp.host_room)})</span>
                      <span style="font-family:var(--ha-mono);color:var(--ha-muted);">(${Number(bp.x)}, ${Number(bp.y)}) r=${Number(bp.radius_px || 200)}</span>
                    </div>`
                    )
                    .join("")}
                </div>
              </div>
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

  _renderTimelinePane() {
    const tl = this._timelineData;
    const fp = this._floorplan || this._overview?.floorplan || PDD_DEFAULT_FLOORPLAN;
    const floors = fp.floors || [];
    const activeFloor =
      floors.find((f) => f.id === this._selectedFloorId) || floors[1] || floors[0] || { id: "main", name: "Main Floor" };
    this._selectedFloorId = activeFloor.id;

    if (!tl) {
      return `
        <div class="ha-card">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <h2 class="card-title" style="font-size:18px;">🎯 Whole-House Spatial Timeline &amp; Negative-Space Playback</h2>
              <div class="card-desc">Reconstructing historical occupant trajectories, positive sub-zones, and negative-space camera/PIR exclusions...</div>
            </div>
            <button class="btn btn-sm" id="btn-reload-timeline">Reload Timeline</button>
          </div>
        </div>`;
    }

    const frames = tl.frames || [];
    const transitions = tl.transitions || [];
    const summary = tl.comparison_summary || tl.summary || {};
    const frameIdx = Math.max(0, Math.min(frames.length - 1, Number(this._timelineFrameIdx || 0)));
    const curFrame = frames[frameIdx] || {
      iso: new Date().toISOString(),
      occupant_estimates: [],
      negative_space_exclusions: [],
    };
    const frameOccupants = curFrame.occupant_estimates || curFrame.occupants || [];
    const occupiedRoomsList =
      curFrame.occupied_rooms ||
      curFrame.active_rooms ||
      frameOccupants.map((o) => o.room).filter(Boolean);
    const occSet = new Set(occupiedRoomsList);
    const roomEstimates = curFrame.room_estimates || {};
    frameOccupants.forEach((o) => {
      if (o.room && !roomEstimates[o.room]) {
        roomEstimates[o.room] = o;
      }
    });
    const negZones = curFrame.negative_space_exclusions || curFrame.negative_space_zones || [];

    const allFpRooms = fp.rooms || [];
    const allFpCams = fp.cameras || [];
    const fRooms = activeFloor.rooms || allFpRooms.filter((r) => r.floor === activeFloor.id);
    const fCams = activeFloor.cameras || allFpCams.filter((c) => c.floor === activeFloor.id);

    // Build breadcrumb trail from recent frames up to frameIdx on this floor
    const trailPts = [];
    const startTrailIdx = Math.max(0, frameIdx - 12);
    for (let i = startTrailIdx; i <= frameIdx; i++) {
      const f = frames[i];
      const fOccs = f?.occupant_estimates || f?.occupants || [];
      if (!Array.isArray(fOccs)) continue;
      fOccs.forEach((occ) => {
        if ((occ.floor || "main") === activeFloor.id && occ.x !== undefined && occ.y !== undefined) {
          trailPts.push({ x: Number(occ.x), y: Number(occ.y), idx: i });
        }
      });
    }
    const trailSvg =
      trailPts.length >= 2
        ? `<polyline points="${trailPts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}" fill="none" stroke="#7c3aed" stroke-width="2.5" stroke-dasharray="5,4" opacity="0.75" style="pointer-events:none;" />`
        : "";

    // Render rooms for playback
    const pbRoomsSvg = fRooms
      .map((box) => {
        const rName = box.name || box.room_name;
        const isOcc = occSet.has(rName);
        const est = roomEstimates[rName] || {};
        const infType = est.method || est.inference_type || "clear";
        const isNegLocalized =
          isOcc && (String(infType).startsWith("negative_space") || infType === "hybrid");
        const strokeColor = isNegLocalized ? "#7c3aed" : isOcc ? "#16a34a" : "#cbd5e1";
        const fillColor = isNegLocalized ? "#f5f3ff" : isOcc ? "#f0fdf4" : "#ffffff";
        const rx = Number(box.x);
        const ry = Number(box.y);
        const rw = Number(box.width ?? 200);
        const rh = Number(box.height ?? 150);
        const locLabel = est.subregion || est.inferred_location || (isOcc ? "Occupied" : "Clear");
        const maxTitleChars = Math.max(8, Math.floor((rw - 20) / 7.2));
        const maxLocChars = Math.max(10, Math.floor((rw - 20) / 6.2));
        return `
          <g>
            <rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" rx="8" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${isOcc ? "2.5" : "1.5"}" />
            <text x="${rx + 12}" y="${ry + 22}" fill="#0f172a" font-size="12.5" font-weight="600">${this._escape(rName.slice(0, maxTitleChars))}</text>
            <text x="${rx + 12}" y="${ry + 38}" fill="${isNegLocalized ? "#6d28d9" : isOcc ? "#15803d" : "#64748b"}" font-size="10.5" font-weight="${isOcc ? "600" : "400"}">
              ${this._escape(locLabel.slice(0, maxLocChars))}
            </text>
          </g>`;
      })
      .join("");

    // Render camera cones (highlighting active negative-space exclusion cones in cyan dashed)
    const clearCamEntities = new Set(
      negZones.map((z) => z.entity_id || z.sensor_id || z.id).filter(Boolean)
    );
    frameOccupants.forEach((o) => {
      (o.negative_exclusions || []).forEach((cid) => clearCamEntities.add(cid));
    });
    const pbSolidSegments = this._extractFloorWallSegments(fRooms);
    const pbConesSvg = fCams
      .map((cam) => {
        const camId = cam.id || cam.camera_entity;
        const isClearExclusion = clearCamEntities.has(camId) || clearCamEntities.has(cam.person_binary_sensor);
        const pathD = this._coneSvgPath(cam, pbSolidSegments);
        return `
          <g style="pointer-events:none;">
            <path d="${pathD}" fill="${isClearExclusion ? "#06b6d4" : "#64748b"}" fill-opacity="${isClearExclusion ? "0.14" : "0.06"}" stroke="${isClearExclusion ? "#0891b2" : "#94a3b8"}" stroke-width="1.4" stroke-dasharray="${isClearExclusion ? "5,3" : "3,3"}" />
            <circle cx="${Number(cam.x)}" cy="${Number(cam.y)}" r="4.5" fill="${isClearExclusion ? "#0891b2" : "#64748b"}" />
          </g>`;
      })
      .join("");

    // Render occupant pins for current frame
    const pbOccupantsSvg = frameOccupants
      .filter((occ) => (occ.floor || "main") === activeFloor.id)
      .map((occ) => {
        const ox = Number(occ.x || 0);
        const oy = Number(occ.y || 0);
        const infMethod = String(occ.method || occ.inference_type || "");
        const isNeg = infMethod.startsWith("negative_space") || infMethod === "hybrid";
        const color = isNeg ? "#7c3aed" : "#15803d";
        const label = (occ.subregion || occ.inferred_location || occ.room || "").slice(0, 32);
        return `
          <g style="pointer-events:none;">
            <circle cx="${ox.toFixed(1)}" cy="${oy.toFixed(1)}" r="15" fill="${color}" fill-opacity="0.22" />
            <circle cx="${ox.toFixed(1)}" cy="${oy.toFixed(1)}" r="8.5" fill="${color}" stroke="#ffffff" stroke-width="2" />
            <rect x="${Math.max(8, Math.min(780, ox - 105)).toFixed(1)}" y="${Math.max(6, oy - 32).toFixed(1)}" width="210" height="19" rx="9.5" fill="${color}" opacity="0.94" />
            <text x="${Math.max(113, Math.min(885, ox)).toFixed(1)}" y="${Math.max(19, oy - 19).toFixed(1)}" text-anchor="middle" fill="#ffffff" font-size="9.5" font-weight="600">🎯 ${this._escape(label)}</text>
          </g>`;
      })
      .join("");

    const rawFrameTs = curFrame.iso || curFrame.timestamp;
    const curTimeStr = rawFrameTs
      ? new Date(rawFrameTs).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      : "--:--";
    const totalSubregionFrames = Number(
      summary.uncovered_subregion_localizations ?? summary.negative_space_subregion_frames ?? 0
    );
    const totalBlindPocketFrames = Number(
      summary.blind_pocket_holds_count ?? summary.blind_pocket_hold_frames ?? 0
    );
    const totalShadeExclusionFrames = Number(
      summary.shade_sunlight_exclusions_count ?? 0
    );
    const totalDeltaFrames = Object.values(summary.per_room_delta || {}).reduce(
      (acc, d) => acc + Math.abs(Number(d?.delta_frames || 0)),
      0
    );

    return `
      <div class="ha-card">
        <div class="card-head" style="flex-wrap:wrap;gap:12px;">
          <div>
            <h2 class="card-title" style="font-size:18px;">🎯 Whole-House Spatial Timeline &amp; Negative-Space Playback</h2>
            <div class="card-desc">
              "The missile knows where it is because it knows where it isn't" — combines positive Frigate sub-zones &amp; PIR cones with negative-space exclusion and doorway trajectory conservation.
            </div>
          </div>

          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            <button
              class="btn btn-sm"
              id="btn-timeline-toggle-neg-space"
              style="background:${this._timelineNegativeSpace ? "#f5f3ff" : "#f1f5f9"};color:${this._timelineNegativeSpace ? "#6d28d9" : "#475569"};border-color:${this._timelineNegativeSpace ? "#c4b5fd" : "#cbd5e1"};font-weight:600;"
              title="A/B compare timeline reconstruction WITH vs WITHOUT Negative-Space Exclusion"
            >
              🎯 A/B Negative-Space: ${this._timelineNegativeSpace ? "ON (Active)" : "OFF (Standard Bayesian)"}
            </button>

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
                      Number(this._timelineHours) === w.h ? "active" : ""
                    }" data-timeline-hours="${w.h}" style="padding:5px 10px;">${w.label}</button>`
                )
                .join("")}
            </div>

            <div class="seg-group" style="margin-top:0;">
              ${floors
                .map(
                  (fl) => `
                <button class="seg-btn ${
                  fl.id === activeFloor.id ? "active" : ""
                }" data-floor-id="${this._escape(fl.id)}" style="padding:5px 10px;">
                  ${this._escape(fl.name.replace(/\s*\(.*\)/, ""))}
                </button>`
                )
                .join("")}
            </div>
          </div>
        </div>

        <!-- KPI Summary Bar -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(170px, 1fr));gap:10px;margin-bottom:14px;">
          <div style="background:var(--ha-subtle);border:1px solid var(--ha-divider);border-radius:8px;padding:8px 12px;">
            <div style="font-size:11px;color:var(--ha-muted);">Timeline Frames (${summary.window_hours || this._timelineHours}h)</div>
            <div style="font-size:16px;font-weight:700;">${Number(tl.frame_count || frames.length)} frames · ${Number(transitions.length)} moves</div>
          </div>
          <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:8px 12px;">
            <div style="font-size:11px;color:#6d28d9;">Negative-Space Subregion Localizations</div>
            <div style="font-size:16px;font-weight:700;color:#5b21b6;">${totalSubregionFrames} localizations</div>
          </div>
          <div style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:8px;padding:8px 12px;">
            <div style="font-size:11px;color:#0e7490;">Blind-Pocket Holds (Bathrooms / Guest)</div>
            <div style="font-size:16px;font-weight:700;color:#155e75;">${totalBlindPocketFrames} frames (${totalDeltaFrames} A/B diffs)</div>
          </div>
          <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:8px 12px;">
            <div style="font-size:11px;color:#b45309;">Moving Shades / Sun Excluded</div>
            <div style="font-size:16px;font-weight:700;color:#92400e;">☀️ ${totalShadeExclusionFrames} frames filtered</div>
          </div>
        </div>

        <!-- Scrubber Transport Controls -->
        <div style="display:flex;align-items:center;gap:10px;background:var(--ha-subtle);border:1px solid var(--ha-divider);border-radius:10px;padding:10px 14px;margin-bottom:14px;flex-wrap:wrap;">
          <button class="btn btn-sm" id="btn-tl-prev" title="Previous Frame">⏮</button>
          <button class="btn btn-primary btn-sm" id="btn-tl-play" style="min-width:78px;">
            ${this._timelinePlaying ? "⏸ Pause" : "▶ Play"}
          </button>
          <button class="btn btn-sm" id="btn-tl-next" title="Next Frame">⏭</button>

          <div class="seg-group" style="margin-top:0;">
            ${[1, 5, 15]
              .map(
                (spd) =>
                  `<button class="seg-btn tl-speed-btn ${
                    Number(this._timelineSpeed) === spd ? "active" : ""
                  }" data-tl-speed="${spd}" style="padding:3px 8px;font-size:11.5px;">${spd}x</button>`
              )
              .join("")}
          </div>

          <input
            type="range"
            id="tl-scrubber-slider"
            min="0"
            max="${Math.max(0, frames.length - 1)}"
            step="1"
            value="${frameIdx}"
            style="flex:1;min-width:180px;cursor:pointer;"
          />

          <div style="font-family:var(--ha-mono);font-size:12.5px;font-weight:600;min-width:155px;text-align:right;">
            ${this._escape(curTimeStr)} <span style="color:var(--ha-muted);font-weight:400;">(${frameIdx + 1}/${frames.length})</span>
          </div>
        </div>

        <!-- Split 2D Floorplan Playback + Movement Transitions Log -->
        <div style="display:grid;grid-template-columns:1.65fr 1fr;gap:14px;align-items:start;">
          <div style="background:#f8fafc;border:1px solid var(--ha-divider);border-radius:10px;padding:10px;">
            <svg viewBox="0 0 1000 580" style="width:100%;height:auto;min-height:360px;display:block;">
              ${pbRoomsSvg}
              ${pbConesSvg}
              ${trailSvg}
              ${pbOccupantsSvg}
            </svg>
            <div style="display:flex;justify-content:space-between;align-items:center;padding-top:8px;font-size:11.5px;color:var(--ha-muted);flex-wrap:wrap;gap:8px;">
              <span>🟢 Direct Positive Detection &nbsp;|&nbsp; 🟣 Negative-Space Localization &nbsp;|&nbsp; 🩵 Dashed Cyan = Clear Camera Exclusion Cone</span>
              <span>Active Rooms: <strong>${occupiedRoomsList.join(", ") || "None"}</strong></span>
            </div>
          </div>

          <div style="background:var(--ha-subtle);border:1px solid var(--ha-divider);border-radius:10px;padding:12px;max-height:430px;overflow-y:auto;">
            <div style="font-weight:600;font-size:13px;margin-bottom:8px;">Chronological Movement &amp; Inference Log (${transitions.length})</div>
            ${
              transitions.length === 0
                ? `<div style="font-size:12.5px;color:var(--ha-muted);">No room transitions recorded in this window.</div>`
                : transitions
                    .slice()
                    .reverse()
                    .map((tr) => {
                      const rawTrTs = tr.iso || tr.timestamp;
                      const tStr = rawTrTs
                        ? new Date(rawTrTs).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                        : "";
                      const infM = String(tr.method || tr.inference_type || "");
                      const isNeg = infM.startsWith("negative_space") || infM === "hybrid";
                      const fIdx = frames.findIndex((f) => (f.iso || f.timestamp) === rawTrTs);
                      const trLoc = tr.subregion || tr.inferred_location || tr.to_room || tr.room || "";
                      return `
                        <div
                          class="tl-transition-row"
                          data-frame-idx="${fIdx >= 0 ? fIdx : 0}"
                          style="padding:8px 10px;margin-bottom:6px;background:#ffffff;border:1px solid ${
                            isNeg ? "#c4b5fd" : "var(--ha-divider)"
                          };border-radius:8px;cursor:pointer;font-size:12px;"
                        >
                          <div style="display:flex;justify-content:space-between;align-items:center;">
                            <strong>${this._escape(tr.from_room ? `${tr.from_room} → ${tr.to_room}` : `${tr.to_room || tr.room}`)}</strong>
                            <span style="font-family:var(--ha-mono);font-size:11px;color:var(--ha-muted);">${this._escape(tStr)}</span>
                          </div>
                          <div style="color:${isNeg ? "#6d28d9" : "#15803d"};font-weight:500;margin-top:2px;">
                            🎯 ${this._escape(trLoc)}
                          </div>
                          ${
                            tr.explanation
                              ? `<div style="font-size:11px;color:var(--ha-muted);margin-top:2px;">${this._escape(
                                  tr.explanation
                                )}</div>`
                              : (tr.negative_space_evidence || []).length > 0
                              ? `<div style="font-size:11px;color:var(--ha-muted);margin-top:2px;">🚫 Clear: ${this._escape(
                                  tr.negative_space_evidence.join(", ")
                                )}</div>`
                              : ""
                          }
                        </div>`;
                    })
                    .join("")
            }
          </div>
        </div>
      </div>
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

          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
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
            <button class="btn btn-sm" id="btn-open-house-timeline">🎯 Whole-House Timeline</button>
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
              Test different timeout, threshold, or Negative-Space Exclusion settings against recorded sensor history before saving.
            </div>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-sm" id="btn-back-to-stats">Back to Activity History</button>
            <button class="btn btn-sm" id="btn-replay-reset">Reset</button>
            <button class="btn btn-primary btn-sm" id="btn-replay-apply">Apply to Room</button>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:12px;margin-bottom:16px;align-items:end;">
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
          <div style="padding:8px 10px;background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12.5px;font-weight:600;color:#5b21b6;">
              <input type="checkbox" id="rep-neg-space-toggle" ${
                this._replayNegativeSpace ? "checked" : ""
              } />
              <span>🎯 Negative-Space Exclusion</span>
            </label>
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
        } else if (v === "timeline") {
          this.loadTimeline();
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
    root.querySelector("#btn-fp-mode-sensors")?.addEventListener("click", () => {
      this._floorplanMode = "sensors";
      this._selectedRoomBoxName = null;
      this._selectedDoorId = null;
      this.render();
    });
    root.querySelector("#fp-sensor-select")?.addEventListener("change", (e) => {
      this._selectedSensorId = e.target.value;
      this.render();
    });
    root.querySelectorAll(".fp-sensor-field").forEach((el) => {
      el.addEventListener("change", () => {
        const key = el.getAttribute("data-key");
        const sensors = this._floorplan?.sensors || [];
        const sen = sensors.find((s) => s.id === this._selectedSensorId);
        if (!sen || !key) return;
        if (["x", "y", "heading_deg", "fov_deg", "range_px"].includes(key)) {
          sen[key] = Number(el.value);
        } else {
          sen[key] = el.value;
        }
        this._compiledTopology = this._compileFloorplanClient(this._floorplan);
        this._debounceSaveFloorplan();
        this.render();
      });
    });
    root.querySelector("#btn-fp-add-pir-sensor")?.addEventListener("click", () => {
      if (!this._floorplan) return;
      if (!Array.isArray(this._floorplan.sensors)) this._floorplan.sensors = [];
      const fRooms = (this._floorplan.rooms || []).filter(
        (r) => (r.floor || "main") === this._selectedFloorId
      );
      const hostRoom = fRooms[0]?.name || fRooms[0]?.room_name || "Living Room";
      const rx = Number(fRooms[0]?.x || 200) + 40;
      const ry = Number(fRooms[0]?.y || 200) + 40;
      const newId = "pir_" + Math.random().toString(36).substring(2, 8);
      this._floorplan.sensors.push({
        id: newId,
        entity_id: `binary_sensor.${newId}_motion`,
        name: "New PIR Sensor",
        sensor_type: "pir_motion",
        floor: this._selectedFloorId || "main",
        host_room: hostRoom,
        x: rx,
        y: ry,
        heading_deg: 90,
        fov_deg: 110,
        range_px: 180,
      });
      this._selectedSensorId = newId;
      this._floorplanMode = "sensors";
      this._compiledTopology = this._compileFloorplanClient(this._floorplan);
      this._debounceSaveFloorplan();
      this.render();
    });
    root.querySelector("#btn-fp-add-door-sensor")?.addEventListener("click", () => {
      if (!this._floorplan) return;
      if (!Array.isArray(this._floorplan.sensors)) this._floorplan.sensors = [];
      const fRooms = (this._floorplan.rooms || []).filter(
        (r) => (r.floor || "main") === this._selectedFloorId
      );
      const hostRoom = fRooms[0]?.name || fRooms[0]?.room_name || "Living Room";
      const rx = Number(fRooms[0]?.x || 200);
      const ry = Number(fRooms[0]?.y || 200) + 40;
      const newId = "door_sen_" + Math.random().toString(36).substring(2, 8);
      this._floorplan.sensors.push({
        id: newId,
        entity_id: `binary_sensor.${newId}_opening`,
        name: "New Door Sensor",
        sensor_type: "door_contact",
        floor: this._selectedFloorId || "main",
        host_room: hostRoom,
        x: rx,
        y: ry,
      });
      this._selectedSensorId = newId;
      this._floorplanMode = "sensors";
      this._compiledTopology = this._compileFloorplanClient(this._floorplan);
      this._debounceSaveFloorplan();
      this.render();
    });
    root.querySelector("#btn-fp-delete-sensor")?.addEventListener("click", (e) => {
      const sid = e.currentTarget.getAttribute("data-sensor-id");
      const sensors = this._floorplan?.sensors || [];
      const idx = sensors.findIndex((s) => s.id === sid);
      if (idx >= 0) {
        sensors.splice(idx, 1);
        this._selectedSensorId = null;
        this._compiledTopology = this._compileFloorplanClient(this._floorplan);
        this._debounceSaveFloorplan();
        this.render();
      }
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
        const subzoneRect = e.target.closest(".fp-subzone-rect");
        const sensorHandle = e.target.closest(".fp-sensor-handle");
        const sensorOrigin = e.target.closest(".fp-sensor-origin");
        const bleOrigin = e.target.closest(".fp-ble-origin");
        const doorTab = e.target.closest(".fp-door-tab");
        const doorHandle = e.target.closest(".fp-door-handle");
        const roomBox = e.target.closest(".fp-room-box");

        // Enforce active floorplan tool mode isolation
        if (this._floorplanMode === "rooms" && (camHandle || camOrigin || subzoneRect || sensorHandle || sensorOrigin || bleOrigin)) {
          return;
        }
        if (this._floorplanMode === "cameras" && (resizeHandle || doorTab || doorHandle || roomBox || sensorHandle || sensorOrigin || bleOrigin)) {
          return;
        }
        if (this._floorplanMode === "sensors" && (resizeHandle || doorTab || doorHandle || roomBox || camHandle || camOrigin || subzoneRect)) {
          return;
        }

        const startPt = this._getSvgPoint(e, svgCanvas);

        if (sensorHandle) {
          const handle = sensorHandle.getAttribute("data-handle");
          const senId = sensorHandle.getAttribute("data-sensor-id");
          const sen = (this._floorplan?.sensors || []).find((s) => s.id === senId);
          if (sen) {
            this._selectedSensorId = senId;
            this._activeFpDrag = {
              type: "sensor_handle",
              handle,
              sensorId: senId,
              hasMoved: false,
              startPt,
            };
            try {
              svgCanvas.setPointerCapture(e.pointerId);
            } catch (_e) {}
            e.preventDefault();
            e.stopPropagation();
          }
          return;
        }

        if (sensorOrigin) {
          const senId = sensorOrigin.getAttribute("data-sensor-id");
          const sen = (this._floorplan?.sensors || []).find((s) => s.id === senId);
          if (sen) {
            this._selectedSensorId = senId;
            this._activeFpDrag = {
              type: "move_sensor",
              sensorId: senId,
              hasMoved: false,
              startPt,
              startPos: { x: Number(sen.x), y: Number(sen.y) },
            };
            try {
              svgCanvas.setPointerCapture(e.pointerId);
            } catch (_e) {}
            e.preventDefault();
            e.stopPropagation();
          }
          return;
        }

        if (bleOrigin) {
          const proxyId = bleOrigin.getAttribute("data-proxy-id");
          const bp = (this._floorplan?.ble_proxies || []).find((p) => p.id === proxyId);
          if (bp) {
            this._activeFpDrag = {
              type: "move_ble",
              proxyId,
              hasMoved: false,
              startPt,
              startPos: { x: Number(bp.x), y: Number(bp.y) },
            };
            try {
              svgCanvas.setPointerCapture(e.pointerId);
            } catch (_e) {}
            e.preventDefault();
            e.stopPropagation();
          }
          return;
        }

        if (subzoneRect) {
          const camId = subzoneRect.getAttribute("data-cam-id");
          const szId = subzoneRect.getAttribute("data-subzone-id");
          const cam = (this._floorplan?.cameras || []).find(
            (c) => (c.id || c.camera_entity) === camId
          );
          const sz = (cam?.sub_zones || []).find((z) => z.id === szId);
          if (cam && sz) {
            this._selectedCamEntity = camId;
            this._selectedSubZoneId = szId;
            this._activeFpDrag = {
              type: "move_subzone",
              camId,
              subZoneId: szId,
              hasMoved: false,
              startPt,
              startPos: { x: Number(sz.x), y: Number(sz.y) },
            };
            try {
              svgCanvas.setPointerCapture(e.pointerId);
            } catch (_e) {}
            e.preventDefault();
            e.stopPropagation();
          }
          return;
        }

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
        } else if (drag.type === "move_sensor") {
          const sen = (this._floorplan?.sensors || []).find((s) => s.id === drag.sensorId);
          if (!sen) return;
          let nx = drag.startPos.x + dx;
          let ny = drag.startPos.y + dy;
          if (!e.shiftKey) {
            nx = this._snapValue(nx, 5);
            ny = this._snapValue(ny, 5);
          }
          sen.x = Math.max(10, Math.min(990, Math.round(nx)));
          sen.y = Math.max(10, Math.min(570, Math.round(ny)));
          this._compiledTopology = this._compileFloorplanClient(this._floorplan);
          this._scheduleCanvasRender();
        } else if (drag.type === "sensor_handle") {
          const sen = (this._floorplan?.sensors || []).find((s) => s.id === drag.sensorId);
          if (!sen) return;
          const sx = Number(sen.x);
          const sy = Number(sen.y);
          let deg = (Math.atan2(pt.y - sy, pt.x - sx) * 180) / Math.PI;
          if (deg < 0) deg += 360;
          if (!e.shiftKey) deg = Math.round(deg / 5) * 5;
          sen.heading_deg = Math.round(deg) % 360;
          const dist = Math.hypot(pt.x - sx, pt.y - sy);
          let r = Math.max(40, Math.min(450, Math.round(dist)));
          if (!e.shiftKey) r = Math.round(r / 5) * 5;
          sen.range_px = r;
          this._compiledTopology = this._compileFloorplanClient(this._floorplan);
          this._scheduleCanvasRender();
        } else if (drag.type === "move_ble") {
          const bp = (this._floorplan?.ble_proxies || []).find((p) => p.id === drag.proxyId);
          if (!bp) return;
          let nx = drag.startPos.x + dx;
          let ny = drag.startPos.y + dy;
          if (!e.shiftKey) {
            nx = this._snapValue(nx, 5);
            ny = this._snapValue(ny, 5);
          }
          bp.x = Math.max(10, Math.min(990, Math.round(nx)));
          bp.y = Math.max(10, Math.min(570, Math.round(ny)));
          this._compiledTopology = this._compileFloorplanClient(this._floorplan);
          this._scheduleCanvasRender();
        } else if (drag.type === "move_subzone") {
          const cam = (this._floorplan?.cameras || []).find(
            (c) => (c.id || c.camera_entity) === drag.camId
          );
          const sz = (cam?.sub_zones || []).find((z) => z.id === drag.subZoneId);
          if (!sz) return;
          let nx = drag.startPos.x + dx;
          let ny = drag.startPos.y + dy;
          if (!e.shiftKey) {
            nx = this._snapValue(nx, 5);
            ny = this._snapValue(ny, 5);
          }
          sz.x = Math.max(0, Math.min(960, Math.round(nx)));
          sz.y = Math.max(0, Math.min(540, Math.round(ny)));
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
    root.querySelector("#btn-open-house-timeline")?.addEventListener("click", () => {
      this._studioView = "timeline";
      this.loadTimeline();
    });
    root.querySelector("#btn-back-to-stats")?.addEventListener("click", () => {
      this._studioView = "statistics";
      this.loadStatistics();
    });

    // Whole-House Timeline & Playback events
    root.querySelector("#btn-reload-timeline")?.addEventListener("click", () => {
      this.loadTimeline();
    });
    root.querySelector("#btn-timeline-toggle-neg-space")?.addEventListener("click", () => {
      this._timelineNegativeSpace = !this._timelineNegativeSpace;
      this.loadTimeline(this._timelineHours, this._timelineNegativeSpace);
    });
    root.querySelectorAll(".seg-btn[data-timeline-hours]").forEach((el) => {
      el.addEventListener("click", () => {
        this._timelineHours = Number(el.getAttribute("data-timeline-hours") || 6);
        this.loadTimeline(this._timelineHours, this._timelineNegativeSpace);
      });
    });
    root.querySelector("#btn-tl-play")?.addEventListener("click", () => {
      this._toggleTimelinePlay();
    });
    root.querySelector("#btn-tl-prev")?.addEventListener("click", () => {
      if (this._timelinePlaying) this._toggleTimelinePlay(false);
      this._timelineFrameIdx = Math.max(0, Number(this._timelineFrameIdx || 0) - 1);
      this.render();
    });
    root.querySelector("#btn-tl-next")?.addEventListener("click", () => {
      if (this._timelinePlaying) this._toggleTimelinePlay(false);
      const maxIdx = Math.max(0, (this._timelineData?.frames?.length || 1) - 1);
      this._timelineFrameIdx = Math.min(maxIdx, Number(this._timelineFrameIdx || 0) + 1);
      this.render();
    });
    root.querySelectorAll(".tl-speed-btn[data-tl-speed]").forEach((el) => {
      el.addEventListener("click", () => {
        this._timelineSpeed = Number(el.getAttribute("data-tl-speed") || 1);
        if (this._timelinePlaying) {
          this._toggleTimelinePlay(false);
          this._toggleTimelinePlay(true);
        } else {
          this.render();
        }
      });
    });
    root.querySelector("#tl-scrubber-slider")?.addEventListener("input", (e) => {
      if (this._timelinePlaying) this._toggleTimelinePlay(false);
      this._timelineFrameIdx = Number(e.target.value || 0);
      this.render();
    });
    root.querySelectorAll(".tl-transition-row[data-frame-idx]").forEach((el) => {
      el.addEventListener("click", () => {
        if (this._timelinePlaying) this._toggleTimelinePlay(false);
        this._timelineFrameIdx = Number(el.getAttribute("data-frame-idx") || 0);
        this.render();
      });
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
    root.querySelector("#rep-neg-space-toggle")?.addEventListener("change", (e) => {
      this._replayNegativeSpace = Boolean(e.target.checked);
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
    root.querySelector("#btn-header-global")?.addEventListener("click", () => {
      this._showGlobalModal = true;
      this.render();
    });
    root.querySelector("#btn-quick-toggle-neg-space")?.addEventListener("click", async () => {
      const curVal =
        this._globalDraft?.negative_space_enabled !== undefined
          ? Boolean(this._globalDraft.negative_space_enabled)
          : this._overview?.global_settings?.negative_space_enabled !== undefined
          ? Boolean(this._overview.global_settings.negative_space_enabled)
          : true;
      const nextVal = !curVal;
      this._globalDraft = {
        ...this._globalDraft,
        negative_space_enabled: nextVal,
      };
      this._timelineNegativeSpace = nextVal;
      this._replayNegativeSpace = nextVal;
      await this.saveGlobalSettings();
      if (this._studioView === "timeline") {
        this.loadTimeline(this._timelineHours, nextVal);
      } else if (this._studioView === "replay") {
        this.runReplay();
      }
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
        ble_trackers: (root.querySelector("#gl-ble")?.value || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        notifications_enabled: Boolean(root.querySelector("#gl-notify-enabled")?.checked),
        slack_notify_service: root.querySelector("#gl-slack-service")?.value || "notify.scdbots",
        slack_channel: root.querySelector("#gl-slack-channel")?.value || "#presence-alerts",
        negative_space_enabled: Boolean(root.querySelector("#gl-neg-space-enabled")?.checked),
      };
      this.saveGlobalSettings();
    });

    root.querySelector("#btn-test-slack-alert")?.addEventListener("click", async () => {
      const btn = root.querySelector("#btn-test-slack-alert");
      if (btn) btn.disabled = true;
      try {
        const service = root.querySelector("#gl-slack-service")?.value || "notify.scdbots";
        const channel = root.querySelector("#gl-slack-channel")?.value || "#presence-alerts";
        const res = await this._apiCall("POST", "/api/presence_detection_designer/notifications/test", {
          slack_notify_service: service,
          slack_channel: channel,
        });
        this.showToast(res?.message || "Test alert dispatched to Slack!", "success");
      } catch (err) {
        this.showToast("Failed to send test alert: " + (err.message || err), "error");
      } finally {
        if (btn) btn.disabled = false;
      }
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

    root.querySelector("#cfg-notify-slack")?.addEventListener("change", (e) => {
      this._draftConfig.notify_slack = e.target.checked;
      this._dirty = true;
      this.render();
    });
    root.querySelector("#cfg-notify-on-occupied")?.addEventListener("change", (e) => {
      this._draftConfig.notify_on_occupied = e.target.checked;
      this._dirty = true;
    });
    root.querySelector("#cfg-notify-on-cleared")?.addEventListener("change", (e) => {
      this._draftConfig.notify_on_cleared = e.target.checked;
      this._dirty = true;
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
