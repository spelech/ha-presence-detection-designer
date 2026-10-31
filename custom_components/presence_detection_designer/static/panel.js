/**
 * Presence Detection Designer — Clean Home Assistant Material Design Panel
 * Custom Element: <presence-detection-designer-panel>
 */

const PDD_DEFAULT_FLOORPLAN = {"ble_proxies": [{"entity_id": "sensor.living_room_speaker_bluetooth_proxy_status", "floor": "main", "host_room": "Living Room", "id": "living_room_speaker", "model_preset": "google_home_speaker_ble", "name": "Living Room Speaker BLE Proxy", "radius_px": 210, "x": 210, "y": 410}, {"entity_id": "sensor.family_room_speaker_bluetooth_proxy_status", "floor": "main", "host_room": "Family Room", "id": "family_room_speaker", "model_preset": "google_home_speaker_ble", "name": "Family Room Speaker BLE Proxy", "radius_px": 210, "x": 680, "y": 200}, {"entity_id": "sensor.master_bedroom_speaker_bluetooth_proxy_status", "floor": "upstairs", "host_room": "Master Bedroom", "id": "master_bedroom_speaker", "model_preset": "google_home_speaker_ble", "name": "Master Bedroom Speaker BLE Proxy", "radius_px": 210, "x": 230, "y": 180}, {"entity_id": "sensor.nursery_speaker_bluetooth_proxy_status", "floor": "upstairs", "host_room": "Margot's Room", "id": "nursery_speaker", "model_preset": "google_home_speaker_ble", "name": "Nursery Speaker BLE Proxy", "radius_px": 190, "x": 465, "y": 140}, {"entity_id": "sensor.office_speaker_bluetooth_proxy_status", "floor": "upstairs", "host_room": "Office", "id": "office_speaker", "model_preset": "google_home_speaker_ble", "name": "Office Speaker BLE Proxy", "radius_px": 200, "x": 765, "y": 400}, {"entity_id": "sensor.basement_speaker_bluetooth_proxy_status", "floor": "basement", "host_room": "Basement Play Area", "id": "basement_speaker", "model_preset": "google_home_speaker_ble", "name": "Basement Speaker BLE Proxy", "radius_px": 260, "x": 450, "y": 295}], "cameras": [{"floor": "main", "fov_deg": 110, "heading_deg": 30, "host_room": "Living Room", "id": "camera.living_room", "model_preset": "tapo_c110_corner", "name": "Living Room Camera", "notes": "Mounted on West wall below Dining opening; sees North cube shelf wall, Foyer archway/stairs, and South bay windows.", "range_px": 520, "spills_into": ["Front Entry"], "sub_zones": [{"entity_id": "binary_sensor.living_room_couch_person_occupancy", "height": 100, "id": "living_room_couch", "label": "Living Room Couch", "room": "Living Room", "width": 125, "x": 105, "y": 355}, {"entity_id": "binary_sensor.living_room_floor_person_occupancy", "height": 100, "id": "living_room_floor", "label": "Living Room Floor", "room": "Living Room", "width": 95, "x": 235, "y": 365}, {"entity_id": "binary_sensor.living_room_bay_windows_person_occupancy", "height": 38, "id": "living_room_bay_windows", "label": "Bay Windows", "room": "Living Room", "width": 165, "x": 115, "y": 468}, {"entity_id": "binary_sensor.living_room_entry_person_occupancy", "height": 80, "id": "living_room_entry", "label": "Front Entry Archway", "room": "Front Entry", "width": 80, "x": 350, "y": 415}], "x": 76, "y": 335, "zones": ["living_room_couch", "living_room_floor", "living_room_bay_windows", "living_room_entry"]}, {"floor": "main", "fov_deg": 110, "heading_deg": 128, "host_room": "Dining Room", "id": "camera.dining_room", "model_preset": "tapo_c110_corner", "name": "Dining Room Camera", "notes": "Upper-right corner of Dining Room looking SW across dining table and through wide opening into Living Room.", "range_px": 320, "spills_into": ["Living Room"], "sub_zones": [{"entity_id": "binary_sensor.dining_room_table_person_occupancy", "height": 110, "id": "dining_room_table", "label": "Dining Table", "room": "Dining Room", "width": 110, "x": 105, "y": 145}, {"entity_id": "binary_sensor.rileys_food_person_occupancy", "height": 42, "id": "rileys_food", "label": "Riley's Food Corner", "room": "Dining Room", "width": 65, "x": 170, "y": 96}], "x": 242, "y": 96, "zones": ["dining_room_table", "rileys_food"]}, {"floor": "main", "fov_deg": 110, "heading_deg": 142, "host_room": "Family Room", "id": "camera.family_room", "model_preset": "tapo_c110_corner", "name": "Family Room Camera", "notes": "Mounted on North wall to the right of the right window looking left across Family Room, green South couch wall, and Kitchen.", "range_px": 620, "spills_into": ["Kitchen", "Front Entry"], "sub_zones": [{"entity_id": "binary_sensor.family_room_couch_person_occupancy", "height": 88, "id": "family_room_couch", "label": "Family Room Couch", "room": "Family Room", "width": 150, "x": 635, "y": 195}, {"entity_id": "binary_sensor.family_room_recliner_person_occupancy", "height": 75, "id": "family_room_recliner", "label": "Family Room Recliner", "room": "Family Room", "width": 80, "x": 545, "y": 115}, {"entity_id": "binary_sensor.family_room_floor_person_occupancy", "height": 88, "id": "family_room_floor", "label": "Family Room Floor", "room": "Family Room", "width": 85, "x": 545, "y": 195}, {"entity_id": "binary_sensor.kitchen_island_person_occupancy", "height": 95, "id": "kitchen_island", "label": "Kitchen Island", "room": "Kitchen", "width": 120, "x": 335, "y": 155}], "x": 818, "y": 96, "zones": ["family_room_couch", "family_room_recliner", "family_room_floor", "kitchen_island"]}, {"floor": "main", "fov_deg": 164, "heading_deg": 90, "host_room": "Garage", "id": "camera.garage", "model_preset": "tapo_c110_overhead", "name": "Garage Camera", "notes": "Mounted high on North interior wall pointing steeply down, covering nearly the full North wall and parking bay.", "range_px": 250, "spills_into": [], "sub_zones": [{"entity_id": "binary_sensor.garage_parking_person_occupancy", "height": 108, "id": "garage_parking", "label": "Garage Parking Bay", "room": "Garage", "width": 170, "x": 595, "y": 438}], "x": 680, "y": 423, "zones": ["garage_parking"]}, {"floor": "upstairs", "fov_deg": 110, "heading_deg": 313, "host_room": "Master Bedroom", "id": "camera.master_bedroom", "model_preset": "tapo_c110_corner", "name": "Master Bedroom Camera", "notes": "Lower-left corner of Master Bedroom looking NE; hugs West headboard wall, clips W.I.C, and sees into Master Bath & Hallway doors.", "range_px": 620, "spills_into": ["Upstairs Hallway & Stairs", "Master Bathroom"], "sub_zones": [{"entity_id": "binary_sensor.master_bed_person_occupancy", "height": 155, "id": "master_bed", "label": "Master Bed", "room": "Master Bedroom", "width": 135, "x": 134, "y": 250}, {"entity_id": "binary_sensor.master_open_area_person_occupancy", "height": 165, "id": "master_open_area", "label": "Master Open Floor", "room": "Master Bedroom", "width": 145, "x": 140, "y": 55}, {"entity_id": "binary_sensor.master_bedroom_walkway_person_occupancy", "height": 220, "id": "master_bedroom_walkway", "label": "Master Walkway", "room": "Master Bedroom", "width": 68, "x": 278, "y": 225}, {"entity_id": "binary_sensor.master_bedroom_entryway_person_occupancy", "height": 56, "id": "master_bedroom_entryway", "label": "Master Hallway Entry", "room": "Master Bedroom", "width": 48, "x": 305, "y": 256}, {"entity_id": "binary_sensor.master_bathroom_person_occupancy", "height": 56, "id": "master_bathroom", "label": "Master Bath Doorway", "room": "Master Bathroom", "width": 55, "x": 425, "y": 486}], "x": 134, "y": 536, "zones": ["master_bed", "master_open_area", "master_bedroom_walkway", "master_bedroom_entryway", "master_bathroom"]}, {"floor": "upstairs", "fov_deg": 110, "heading_deg": 311, "host_room": "Margot's Room", "id": "camera.nursery", "model_preset": "tapo_c110_corner", "name": "Nursery Camera", "notes": "Lower-left corner of Nursery looking NE; sees West wall posters, bed, dresser, open East reach-in closet, and hallway door.", "range_px": 340, "spills_into": [], "sub_zones": [{"entity_id": "binary_sensor.nursery_bed_person_occupancy", "height": 115, "id": "nursery_bed", "label": "Nursery Bed", "room": "Margot's Room", "width": 125, "x": 370, "y": 95}], "x": 358, "y": 246, "zones": ["nursery_bed"]}, {"floor": "upstairs", "fov_deg": 110, "heading_deg": 313, "host_room": "Office", "id": "camera.office", "model_preset": "tapo_c110_corner", "name": "Office Camera", "notes": "Lower-left corner of Office looking NE; sees West wall and Office door, open North closet, Steve's desk, and sim rig.", "range_px": 380, "spills_into": ["Upstairs Hallway & Stairs"], "sub_zones": [{"entity_id": "binary_sensor.steves_desk_person_occupancy", "height": 95, "id": "steves_desk", "label": "Steve's Desk", "room": "Office", "width": 105, "x": 745, "y": 360}, {"entity_id": "binary_sensor.sim_rig_person_occupancy", "height": 95, "id": "sim_rig", "label": "Sim Rig", "room": "Office", "width": 65, "x": 680, "y": 425}, {"entity_id": "binary_sensor.office_floor_person_occupancy", "height": 95, "id": "office_floor", "label": "Office Center Floor", "room": "Office", "width": 95, "x": 685, "y": 310}, {"entity_id": "binary_sensor.office_entryway_person_occupancy", "height": 55, "id": "office_entryway", "label": "Office Doorway", "room": "Office", "width": 45, "x": 665, "y": 258}], "x": 678, "y": 538, "zones": ["steves_desk", "sim_rig", "office_floor", "office_entryway"]}, {"floor": "basement", "fov_deg": 110, "heading_deg": 42, "host_room": "Basement Theater", "id": "camera.basement_theater", "model_preset": "tapo_c110_corner", "name": "Basement Theater Camera", "notes": "Upper-left corner of Basement Theater looking SE; sees North wall ballpit leading to Wet Bar, sectional couch, South closets, and East wall.", "range_px": 700, "spills_into": ["Basement Play Area"], "sub_zones": [{"entity_id": "binary_sensor.basement_theater_couch_person_occupancy", "height": 165, "id": "basement_theater_couch", "label": "Theater Couch", "room": "Basement Theater", "width": 165, "x": 150, "y": 235}, {"entity_id": "binary_sensor.basement_theater_playpen_person_occupancy", "height": 75, "id": "basement_theater_playpen", "label": "Ballpit / Playpen", "room": "Basement Theater", "width": 165, "x": 160, "y": 50}, {"entity_id": "binary_sensor.basement_theater_floor_person_occupancy", "height": 90, "id": "basement_theater_floor", "label": "Theater Floor", "room": "Basement Theater", "width": 165, "x": 160, "y": 135}, {"entity_id": "binary_sensor.basement_bar_person_occupancy", "height": 140, "id": "basement_bar", "label": "Basement Wet Bar", "room": "Basement Play Area", "width": 150, "x": 365, "y": 55}, {"entity_id": "binary_sensor.basement_play_area_far_person_occupancy", "height": 175, "id": "basement_play_area_far", "label": "Play Area East", "room": "Basement Play Area", "width": 190, "x": 370, "y": 230}, {"entity_id": "binary_sensor.basement_stairwell_person_occupancy", "height": 105, "id": "basement_stairwell", "label": "Basement Stairwell", "room": "Basement Play Area", "width": 75, "x": 495, "y": 415}], "x": 104, "y": 64, "zones": ["basement_theater_couch", "basement_theater_playpen", "basement_theater_floor", "basement_bar", "basement_play_area_far", "basement_stairwell"]}, {"floor": "basement", "fov_deg": 110, "heading_deg": 121, "host_room": "Basement Play Area", "id": "camera.basement_play_area", "model_preset": "tapo_c110_corner", "name": "Basement Play Area Camera", "notes": "Behind Wet Bar looking SW across bar counter, East basement wall (not into stairs), play mats, and Theater.", "range_px": 680, "spills_into": ["Basement Theater"], "sub_zones": [{"entity_id": "binary_sensor.basement_play_floor_person_occupancy", "height": 220, "id": "basement_play_floor", "label": "Play Area Main Floor", "room": "Basement Play Area", "width": 195, "x": 365, "y": 225}, {"entity_id": "binary_sensor.basement_counter_person_occupancy", "height": 140, "id": "basement_counter", "label": "Wet Bar Counter", "room": "Basement Play Area", "width": 150, "x": 365, "y": 60}, {"entity_id": "binary_sensor.theater_rear_view_person_occupancy", "height": 175, "id": "theater_rear_view", "label": "Theater Rear View", "room": "Basement Theater", "width": 185, "x": 135, "y": 230}], "x": 505, "y": 68, "zones": ["basement_play_floor", "basement_counter", "theater_rear_view"]}, {"floor": "basement", "fov_deg": 110, "heading_deg": 135, "host_room": "Storage Room", "id": "camera.storage_room", "model_preset": "tapo_c110_corner", "name": "Storage Room Camera", "notes": "Upper-right corner of Storage Room looking SW across green gym floor toward South storage shelves and West door to hallway.", "range_px": 420, "spills_into": [], "sub_zones": [{"entity_id": "binary_sensor.storage_room_workout_person_occupancy", "height": 210, "id": "storage_room_workout", "label": "Gym / Workout Mat", "room": "Storage Room", "width": 165, "x": 715, "y": 110}], "x": 905, "y": 54, "zones": ["storage_room_workout"]}], "canvas": {"height": 580, "width": 1000}, "connections": [{"from_room": "Front Entry", "id": "conn_entry_lr", "label": "Open Archway (Entry <-> Living Room)", "to_room": "Living Room", "type": "open_passage"}, {"from_room": "Front Entry", "id": "conn_entry_kitchen", "label": "Pathway (Entry <-> Kitchen)", "to_room": "Kitchen", "type": "open_passage"}, {"from_room": "Front Entry", "id": "conn_entry_fr", "label": "Pathway (Entry <-> Family/Laundry/Basement)", "to_room": "Family Room", "type": "open_passage"}, {"from_room": "Front Entry", "id": "conn_entry_powder", "label": "Powder Bath Doorway", "to_room": "Powder Bath", "type": "unmonitored_door"}, {"from_room": "Front Entry", "id": "conn_entry_laundry", "label": "Laundry Room Doorway", "to_room": "Laundry Room", "type": "unmonitored_door"}, {"from_room": "Living Room", "id": "conn_lr_dr", "label": "Open Passage (Living <-> Dining)", "to_room": "Dining Room", "type": "open_passage"}, {"from_room": "Dining Room", "id": "conn_dr_kitchen", "label": "Open Passage (Dining <-> Kitchen)", "to_room": "Kitchen", "type": "open_passage"}, {"from_room": "Kitchen", "id": "conn_kitchen_fr", "label": "Open Concept (Kitchen <-> Family Room)", "to_room": "Family Room", "type": "open_passage"}, {"entity_id": "binary_sensor.utility_room_door", "from_room": "Family Room", "id": "conn_fr_garage", "label": "Laundry / Garage Pathway", "to_room": "Garage", "type": "unmonitored_door"}, {"entity_id": "binary_sensor.utility_room_door", "from_room": "Laundry Room", "id": "conn_laundry_garage", "label": "Laundry -> Garage Door", "to_room": "Garage", "type": "unmonitored_door"}, {"from_room": "Front Entry", "id": "conn_entry_upstairs", "label": "Main Stairs to Upstairs", "to_room": "Upstairs Hallway & Stairs", "type": "stairs"}, {"from_room": "Family Room", "id": "conn_fr_basement_play", "label": "Basement Stairs", "to_room": "Basement Play Area", "type": "stairs"}, {"from_room": "Family Room", "id": "conn_fr_basement_theater", "label": "Basement Stairs (Partial Sightline)", "to_room": "Basement Theater", "type": "stairs"}, {"from_room": "Upstairs Hallway & Stairs", "id": "conn_hall_office", "label": "Office Doorway (Next to Stairs)", "to_room": "Office", "type": "unmonitored_door"}, {"from_room": "Upstairs Hallway & Stairs", "id": "conn_hall_guest", "label": "Guest Room Doorway (No Sensor)", "to_room": "Guest Room", "type": "unmonitored_door"}, {"from_room": "Upstairs Hallway & Stairs", "id": "conn_hall_nursery", "label": "Nursery Doorway (Seen Partially by Cam)", "to_room": "Margot's Room", "type": "unmonitored_door"}, {"from_room": "Upstairs Hallway & Stairs", "id": "conn_hall_master", "label": "Master Bedroom Entryway", "to_room": "Master Bedroom", "type": "unmonitored_door"}, {"from_room": "Master Bedroom", "id": "conn_master_wic", "label": "Master Walk-In Closet Door", "to_room": "Master W.I.C", "type": "unmonitored_door"}, {"from_room": "Master Bedroom", "id": "conn_master_bath", "label": "Master Bath / Shower Stall Entry", "to_room": "Master Bathroom", "type": "unmonitored_door"}, {"from_room": "Upstairs Hallway & Stairs", "id": "conn_hall_ubath", "label": "Shared Bathroom (Double Vanity & Tub)", "to_room": "Upstairs Bathroom", "type": "unmonitored_door"}, {"from_room": "Basement Play Area", "id": "conn_play_theater", "label": "Open Basement Divide (Play <-> Theater)", "to_room": "Basement Theater", "type": "open_passage"}, {"from_room": "Basement Play Area", "id": "conn_play_storage", "label": "Storage Room Door (Off East Basement Hall)", "to_room": "Storage Room", "type": "unmonitored_door"}, {"from_room": "Basement Play Area", "id": "conn_play_bbath", "label": "Basement Bath Door (Off East Basement Hall)", "to_room": "Basement Bathroom", "type": "unmonitored_door"}], "floor_wall_segments": {"basement": [[[93, 42], [695, 42]], [[93, 42], [93, 532]], [[93, 478], [130, 478]], [[220, 478], [265, 478]], [[355, 478], [430, 478]], [[430, 478], [445, 495]], [[445, 495], [445, 532]], [[93, 532], [635, 532]], [[572, 230], [572, 532]], [[635, 410], [635, 532]], [[524, 42], [524, 135]], [[524, 135], [575, 135]], [[620, 135], [695, 135]], [[572, 230], [695, 230]], [[695, 42], [695, 145]], [[695, 215], [695, 360]], [[695, 42], [915, 42]], [[915, 42], [915, 360]], [[695, 360], [915, 360]]], "main": [[[68, 87], [832, 87]], [[68, 87], [68, 508]], [[68, 508], [534, 508]], [[832, 87], [832, 290]], [[251, 87], [251, 190]], [[251, 250], [251, 290]], [[68, 290], [96, 290]], [[212, 290], [251, 290]], [[251, 290], [410, 290]], [[341, 290], [341, 418]], [[410, 290], [410, 345]], [[341, 382], [410, 382]], [[410, 382], [410, 418]], [[341, 502], [341, 508]], [[534, 290], [832, 290]], [[534, 290], [534, 300]], [[534, 348], [534, 508]], [[708, 290], [708, 421]], [[534, 421], [832, 421]], [[534, 421], [534, 555]], [[832, 421], [832, 555]], [[534, 555], [832, 555]]], "upstairs": [[[126, 32], [874, 32]], [[874, 32], [874, 548]], [[126, 548], [874, 548]], [[126, 32], [126, 548]], [[353, 32], [353, 256]], [[353, 312], [353, 484]], [[563, 32], [563, 143]], [[563, 143], [610, 143]], [[610, 32], [610, 42]], [[610, 130], [610, 254]], [[563, 143], [563, 152]], [[563, 242], [563, 254]], [[353, 254], [508, 254]], [[508, 254], [508, 258]], [[508, 258], [558, 258]], [[558, 258], [558, 254]], [[558, 254], [612, 254]], [[662, 254], [874, 254]], [[353, 316], [368, 316]], [[446, 316], [508, 316]], [[553, 316], [610, 316]], [[353, 355], [462, 355]], [[462, 316], [462, 449]], [[353, 484], [398, 484]], [[398, 484], [440, 484]], [[440, 449], [560, 449]], [[560, 417], [610, 417]], [[560, 417], [560, 449]], [[610, 316], [610, 548]], [[440, 449], [440, 498]], [[440, 544], [440, 548]], [[671, 254], [671, 258]], [[671, 258], [665, 258]], [[665, 258], [665, 315]], [[665, 315], [671, 315]], [[671, 315], [671, 548]], [[735, 254], [735, 296]], [[735, 296], [750, 296]], [[858, 296], [874, 296]]]}, "floors": [{"id": "upstairs", "name": "Upstairs Level", "order": 0, "underlay_svg": {"height": 540, "url": "/presence_detection_designer_static/floor_upstairs.webp?v=4", "width": 772, "x": 114, "y": 20}}, {"id": "main", "name": "Main Floor", "order": 1, "underlay_svg": {"height": 520, "url": "/presence_detection_designer_static/floor_main.webp?v=4", "width": 784, "x": 60, "y": 30}}, {"id": "basement", "name": "Basement Level", "order": 2, "underlay_svg": {"height": 520, "url": "/presence_detection_designer_static/floor_basement.webp?v=4", "width": 620, "x": 80, "y": 30}}], "rooms": [{"entryways": [{"id": "door_master_hallway", "offset": 224, "target_room": "Upstairs Hallway & Stairs", "type": "door", "wall": "right", "width": 56}, {"id": "door_master_bath", "offset": 452, "target_room": "Master Bathroom", "type": "door", "wall": "right", "width": 60}], "floor": "upstairs", "height": 516, "id": "master_bedroom", "name": "Master Bedroom", "notes": "West wing front-to-back with lower vestibule leading to Master W.I.C and Master Bathroom.", "room_type": "room", "svg_path": "M 126,32 L 353,32 L 353,484 L 440,484 L 440,548 L 126,548 Z", "width": 227, "x": 126, "y": 32}, {"entryways": [{"id": "door_wic_master", "offset": 45, "target_room": "Master Bedroom", "type": "door", "wall": "bottom", "width": 42}], "floor": "upstairs", "height": 129, "id": "master_wic", "name": "Master W.I.C", "notes": "Standalone Master Walk-In Closet (6'3\" x 7'0\") opening South into the Master Bedroom vestibule.", "room_type": "room", "width": 109, "x": 353, "y": 355}, {"entryways": [{"id": "door_ubath_hall", "offset": 46, "target_room": "Upstairs Hallway & Stairs", "type": "door", "wall": "top", "width": 45}], "floor": "upstairs", "height": 133, "id": "upstairs_bathroom", "name": "Upstairs Bathroom", "notes": "Upper shared bathroom (7'8\" x 4'11\") with tub & vanity opening North into Upstairs Hallway.", "room_type": "room", "svg_path": "M 462,316 L 610,316 L 610,417 L 560,417 L 560,449 L 462,449 Z", "width": 148, "x": 462, "y": 316}, {"entryways": [{"id": "door_mbath_master", "offset": 81, "target_room": "Master Bedroom", "type": "door", "wall": "left", "width": 46}], "floor": "upstairs", "height": 131, "id": "master_bathroom", "name": "Master Bathroom", "notes": "Lower en-suite Master Bathroom (6'5\" x 7'7\") with double vanity and walk-in shower stall.", "room_type": "room", "svg_path": "M 440,449 L 560,449 L 560,417 L 610,417 L 610,548 L 440,548 Z", "width": 170, "x": 440, "y": 417}, {"entryways": [{"id": "door_margot_hallway", "offset": 155, "target_room": "Upstairs Hallway & Stairs", "type": "door", "wall": "bottom", "width": 50}], "floor": "upstairs", "height": 222, "id": "margots_room", "name": "Margot's Room", "notes": "Top-center Nursery (10'6\" x 11'5\") including lower-right reach-in closet (Y=143..254).", "room_type": "room", "svg_path": "M 353,32 L 563,32 L 563,143 L 610,143 L 610,254 L 353,254 Z", "width": 257, "x": 353, "y": 32}, {"entryways": [{"id": "door_guest_hallway", "offset": 49, "target_room": "Upstairs Hallway & Stairs", "type": "door", "wall": "bottom", "width": 50}], "floor": "upstairs", "height": 222, "id": "guest_room", "name": "Guest Room", "notes": "Top-right Guest Room (13'6\" x 11'5\") including upper-left reach-in closet (Y=32..143).", "room_type": "room", "svg_path": "M 563,32 L 874,32 L 874,254 L 610,254 L 610,143 L 563,143 Z", "width": 311, "x": 563, "y": 32}, {"entryways": [{"id": "door_office_hallway", "offset": 4, "target_room": "Upstairs Hallway & Stairs", "type": "door", "wall": "left", "width": 57}], "floor": "upstairs", "height": 294, "id": "office", "name": "Office", "notes": "Bottom-right Office (10'3\" x 13'1\") including upper reach-in closet.", "room_type": "room", "width": 203, "x": 671, "y": 254}, {"entryways": [{"id": "door_hall_master", "offset": 2, "target_room": "Master Bedroom", "type": "door", "wall": "left", "width": 56}, {"id": "door_hall_margot", "offset": 155, "target_room": "Margot's Room", "type": "door", "wall": "top", "width": 50}, {"id": "door_hall_guest", "offset": 259, "target_room": "Guest Room", "type": "door", "wall": "top", "width": 50}, {"id": "door_hall_office", "offset": 4, "target_room": "Office", "type": "door", "wall": "right", "width": 57}], "floor": "upstairs", "height": 101, "id": "upstairs_hallway", "name": "Upstairs Hallway & Stairs", "notes": "Central upstairs hallway (16'3\" x 3'2\"), North-facing hallway linen closet, and stairwell.", "room_type": "transit", "svg_path": "M 353,254 L 671,254 L 671,548 L 610,548 L 610,316 L 462,316 L 462,355 L 353,355 Z", "width": 318, "x": 353, "y": 254}, {"entryways": [{"id": "arch_dr_kitchen", "offset": 103, "target_room": "Kitchen", "type": "open_passage", "wall": "right", "width": 60}, {"id": "arch_dr_lr", "offset": 28, "target_room": "Living Room", "type": "open_passage", "wall": "bottom", "width": 116}], "floor": "main", "height": 203, "id": "dining_room", "name": "Dining Room", "notes": "Northwest Dining Room (11'5\" x 13'0\") opening to Kitchen and Living Room.", "room_type": "room", "width": 183, "x": 68, "y": 87}, {"entryways": [{"id": "arch_lr_dr", "offset": 28, "target_room": "Dining Room", "type": "open_passage", "wall": "top", "width": 116}, {"id": "arch_lr_entry", "offset": 128, "target_room": "Front Entry", "type": "open_passage", "wall": "right", "width": 84}], "floor": "main", "height": 218, "id": "living_room", "name": "Living Room", "notes": "Southwest Living Room (17'5\" x 13'9\") with South bay windows and wide opening to Foyer.", "room_type": "room", "width": 273, "x": 68, "y": 290}, {"entryways": [{"id": "arch_kitchen_dr", "offset": 103, "target_room": "Dining Room", "type": "open_passage", "wall": "left", "width": 60}, {"id": "arch_kitchen_fr", "offset": 10, "target_room": "Family Room", "type": "open_passage", "wall": "right", "width": 185}, {"id": "path_kitchen_entry", "offset": 159, "target_room": "Front Entry", "type": "open_passage", "wall": "bottom", "width": 124}], "floor": "main", "height": 203, "id": "kitchen", "name": "Kitchen", "notes": "Central Kitchen (10'3\" x 13'0\") and Breakfast Nook (8'1\" x 13'0\") with island counter.", "room_type": "room", "width": 283, "x": 251, "y": 87}, {"entryways": [{"id": "door_powder_foyer", "offset": 55, "target_room": "Front Entry", "type": "door", "wall": "right", "width": 33}], "floor": "main", "height": 92, "id": "powder_bath", "name": "Powder Bath", "notes": "Main floor half-bath (4'3\" x 4'11\") off Foyer.", "room_type": "room", "width": 69, "x": 341, "y": 290}, {"entryways": [{"id": "arch_entry_lr", "offset": 128, "target_room": "Living Room", "type": "open_passage", "wall": "left", "width": 84}, {"id": "path_entry_kitchen", "offset": 69, "target_room": "Kitchen", "type": "open_passage", "wall": "top", "width": 124}, {"id": "door_front_entry", "offset": 85, "target_room": "Exterior", "type": "door", "wall": "bottom", "width": 50}], "floor": "main", "height": 218, "id": "front_entry", "name": "Front Entry", "notes": "Main Foyer (8'9\" x 13'6\"), coat closet, front door, and stairs to Upper Level.", "room_type": "room", "svg_path": "M 410,290 L 534,290 L 534,508 L 341,508 L 341,382 L 410,382 Z", "width": 193, "x": 341, "y": 290}, {"entryways": [{"id": "arch_fr_kitchen", "offset": 10, "target_room": "Kitchen", "type": "open_passage", "wall": "left", "width": 185}], "floor": "main", "height": 203, "id": "family_room", "name": "Family Room", "notes": "East Family Room (19'4\" x 12'9\") with North fireplace and solid green South wall.", "room_type": "room", "width": 298, "x": 534, "y": 87}, {"entryways": [{"id": "door_laundry_hall", "offset": 10, "target_room": "Front Entry", "type": "door", "wall": "left", "width": 48}, {"id": "door_fr_laundry", "offset": 85, "target_room": "Garage", "type": "door", "wall": "bottom", "width": 48}], "floor": "main", "height": 131, "id": "laundry_room", "name": "Laundry Room", "notes": "Main floor Laundry / Mudroom (11'3\" x 8'5\") with door on West wall to Hallway/Foyer and South door to Garage.", "room_type": "room", "width": 174, "x": 534, "y": 290}, {"entryways": [{"id": "door_garage_fr", "offset": 85, "target_room": "Laundry Room", "type": "door", "wall": "top", "width": 48}], "floor": "main", "height": 134, "id": "garage", "name": "Garage", "notes": "2-car Garage below Laundry Room.", "room_type": "room", "width": 298, "x": 534, "y": 421}, {"entryways": [{"id": "arch_theater_play", "offset": 20, "target_room": "Basement Play Area", "type": "open_passage", "wall": "right", "width": 430}], "floor": "basement", "height": 490, "id": "basement_theater", "name": "Basement Theater", "notes": "West side of Recreation Room with TV/fireplace wall, sectional couch, North wall ballpit, and South bi-fold closets.", "room_type": "room", "width": 267, "x": 93, "y": 42}, {"entryways": [{"id": "arch_play_theater", "offset": 20, "target_room": "Basement Theater", "type": "open_passage", "wall": "left", "width": 430}, {"id": "door_play_bbath", "offset": 215, "target_room": "Basement Bathroom", "type": "door", "wall": "top", "width": 45}, {"id": "door_play_storage", "offset": 103, "target_room": "Storage Room", "type": "door", "wall": "right", "width": 70}], "floor": "basement", "height": 490, "id": "basement_play_area", "name": "Basement Play Area", "notes": "East side of Recreation Room including Wet Bar (9'0\" x 8'5\"), Play Area mats, East hallway (7'0\" x 4'8\"), and stairs.", "room_type": "room", "svg_path": "M 360,42 L 524,42 L 524,135 L 695,135 L 695,230 L 572,230 L 572,410 L 635,410 L 635,532 L 360,532 Z", "width": 335, "x": 360, "y": 42}, {"entryways": [{"id": "door_bbath_play", "offset": 51, "target_room": "Basement Play Area", "type": "door", "wall": "bottom", "width": 45}], "floor": "basement", "height": 93, "id": "basement_bathroom", "name": "Basement Bathroom", "notes": "Basement Bathroom (5'11\" x 4'7\") to the right of Wet Bar opening South into basement hallway.", "room_type": "transit", "width": 171, "x": 524, "y": 42}, {"entryways": [{"id": "door_storage_play", "offset": 103, "target_room": "Basement Play Area", "type": "door", "wall": "left", "width": 70}], "floor": "basement", "height": 318, "id": "storage_room", "name": "Storage Room", "notes": "East Storage Room / Gym opening West into the basement hallway.", "room_type": "room", "width": 220, "x": 695, "y": 42}], "sensors": [{"entity_id": "binary_sensor.family_room_motion", "floor": "main", "fov_deg": 90, "heading_deg": 225, "host_room": "Family Room", "id": "binary_sensor.family_room_motion", "model_preset": "ring_alarm_pir_gen2", "name": "Family Room PIR (Ring)", "range_px": 260, "sensor_type": "pir_motion", "x": 820, "y": 278}, {"entity_id": "binary_sensor.family_room_motion_4", "floor": "main", "fov_deg": 110, "heading_deg": 165, "host_room": "Family Room", "id": "binary_sensor.family_room_motion_4", "model_preset": "ecobee_smart_sensor", "name": "Family/Kitchen PIR (Ecobee)", "range_px": 230, "sensor_type": "pir_motion", "x": 555, "y": 115}, {"entity_id": "binary_sensor.thermostat_motion", "floor": "main", "fov_deg": 110, "heading_deg": 180, "host_room": "Dining Room", "id": "binary_sensor.thermostat_motion", "model_preset": "ecobee_smart_sensor", "name": "Main Thermostat PIR", "range_px": 180, "sensor_type": "pir_motion", "x": 242, "y": 180}, {"entity_id": "binary_sensor.keypad_motion", "floor": "main", "fov_deg": 100, "heading_deg": 295, "host_room": "Front Entry", "id": "binary_sensor.keypad_motion", "model_preset": "ring_keypad_pir", "name": "Front Entry Keypad PIR", "range_px": 165, "sensor_type": "pir_motion", "x": 415, "y": 495}, {"entity_id": "binary_sensor.ratgdov25i_47a250_motion", "floor": "main", "fov_deg": 100, "heading_deg": 90, "host_room": "Garage", "id": "binary_sensor.ratgdov25i_47a250_motion", "model_preset": "ratgdo_pir", "name": "Garage Opener PIR", "range_px": 175, "sensor_type": "pir_motion", "x": 680, "y": 430}, {"entity_id": "binary_sensor.master_bedroom_motion", "floor": "upstairs", "fov_deg": 110, "heading_deg": 0, "host_room": "Master Bedroom", "id": "binary_sensor.master_bedroom_motion", "model_preset": "ecobee_smart_sensor", "name": "Master Bedroom PIR (Ecobee)", "range_px": 230, "sensor_type": "pir_motion", "x": 140, "y": 280}, {"entity_id": "binary_sensor.nursery_motion", "floor": "upstairs", "fov_deg": 110, "heading_deg": 315, "host_room": "Margot's Room", "id": "binary_sensor.nursery_motion", "model_preset": "ecobee_smart_sensor", "name": "Nursery PIR (Ecobee)", "range_px": 230, "sensor_type": "pir_motion", "x": 370, "y": 235}, {"entity_id": "binary_sensor.guest_room_motion", "floor": "upstairs", "fov_deg": 110, "heading_deg": 140, "host_room": "Guest Room", "id": "binary_sensor.guest_room_motion", "model_preset": "ecobee_smart_sensor", "name": "Guest Room PIR (Ecobee)", "range_px": 230, "sensor_type": "pir_motion", "x": 858, "y": 48}, {"entity_id": "binary_sensor.office_motion", "floor": "upstairs", "fov_deg": 110, "heading_deg": 145, "host_room": "Office", "id": "binary_sensor.office_motion", "model_preset": "ecobee_smart_sensor", "name": "Office PIR (Ecobee)", "range_px": 230, "sensor_type": "pir_motion", "x": 858, "y": 305}, {"entity_id": "binary_sensor.upper_level_keypad_motion", "floor": "upstairs", "fov_deg": 100, "heading_deg": 90, "host_room": "Upstairs Hallway & Stairs", "id": "binary_sensor.upper_level_keypad_motion", "model_preset": "ring_keypad_pir", "name": "Upstairs Hallway Keypad PIR", "range_px": 165, "sensor_type": "pir_motion", "x": 485, "y": 262}, {"entity_id": "binary_sensor.motion_sensor_gen2_motion_detection", "floor": "basement", "fov_deg": 90, "heading_deg": 180, "host_room": "Basement Play Area", "id": "binary_sensor.motion_sensor_gen2_motion_detection", "model_preset": "ring_alarm_pir_gen2", "name": "Basement Play Area PIR (Z-Wave)", "range_px": 260, "sensor_type": "pir_motion", "x": 560, "y": 245}, {"entity_id": "binary_sensor.basement_motion", "floor": "basement", "fov_deg": 110, "heading_deg": 270, "host_room": "Basement Play Area", "id": "binary_sensor.basement_motion", "model_preset": "ecobee_smart_sensor", "name": "Basement PIR (Ecobee)", "range_px": 230, "sensor_type": "pir_motion", "x": 420, "y": 518}, {"door_id": "door_front_entry", "entity_id": "binary_sensor.front_door", "floor": "main", "host_room": "Front Entry", "id": "binary_sensor.front_door", "model_preset": "ring_contact_sensor", "name": "Front Door Contact", "sensor_type": "door_contact", "x": 452, "y": 508}, {"door_id": "door_fr_laundry", "entity_id": "binary_sensor.utility_room_door", "floor": "main", "host_room": "Laundry Room", "id": "binary_sensor.utility_room_door", "model_preset": "ring_contact_sensor", "name": "Laundry / Garage Door Contact", "sensor_type": "door_contact", "x": 642, "y": 395}, {"entity_id": "binary_sensor.back_door", "floor": "main", "host_room": "Kitchen", "id": "binary_sensor.back_door", "model_preset": "ring_contact_sensor", "name": "Back Patio Door Contact", "sensor_type": "door_contact", "x": 475, "y": 87}, {"entity_id": "binary_sensor.garage_side_door", "floor": "main", "host_room": "Garage", "id": "binary_sensor.garage_side_door", "model_preset": "ring_contact_sensor", "name": "Garage Side Door Contact", "sensor_type": "door_contact", "x": 832, "y": 465}, {"entity_id": "cover.garage_door", "floor": "main", "host_room": "Garage", "id": "cover.garage_door", "name": "Garage Roll-Up Door", "sensor_type": "door_contact", "x": 680, "y": 555}], "version": 4};

const PDD_DEFAULT_COMPILED_TOPOLOGY = {"ambiguities": [{"camera_id": "camera.living_room", "category": "camera_spillover", "description": "`camera.living_room` (hosted in Living Room) also sees Front Entry. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Living Room occupied.", "resolution": "Downgrade binary_sensor.living_room_person_occupancy to `supporting` and trigger Living Room only from interior Frigate sub-zones.", "rooms": ["Living Room", "Front Entry"], "severity": "high", "title": "Living Room Camera cone spills into Front Entry"}, {"camera_id": "camera.dining_room", "category": "camera_spillover", "description": "`camera.dining_room` (hosted in Dining Room) also sees Living Room. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Dining Room occupied.", "resolution": "Downgrade whole-frame camera person to `supporting` and trigger Dining Room only from interior Frigate sub-zones.", "rooms": ["Dining Room", "Living Room"], "severity": "high", "title": "Dining Room Camera cone spills into Living Room"}, {"camera_id": "camera.family_room", "category": "camera_spillover", "description": "`camera.family_room` (hosted in Family Room) also sees Dining Room, Kitchen, Powder Bath, Front Entry. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Family Room occupied.", "resolution": "Downgrade binary_sensor.family_room_person_occupancy to `supporting` and trigger Family Room only from interior Frigate sub-zones.", "rooms": ["Family Room", "Dining Room", "Kitchen", "Powder Bath", "Front Entry"], "severity": "high", "title": "Family Room Camera cone spills into Dining Room, Kitchen, Powder Bath, Front Entry"}, {"camera_id": "camera.master_bedroom", "category": "camera_spillover", "description": "`camera.master_bedroom` (hosted in Master Bedroom) also sees Master Bathroom, Upstairs Hallway & Stairs. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Master Bedroom occupied.", "resolution": "Downgrade binary_sensor.master_bedroom_person_occupancy, binary_sensor.master_bedroom_entryway_person_occupancy to `supporting` and trigger Master Bedroom only from interior Frigate sub-zones.", "rooms": ["Master Bedroom", "Master Bathroom", "Upstairs Hallway & Stairs"], "severity": "high", "title": "Master Bedroom Camera cone spills into Master Bathroom, Upstairs Hallway & Stairs"}, {"camera_id": "camera.nursery", "category": "camera_spillover", "description": "`camera.nursery` (hosted in Margot's Room) also sees Guest Room. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Margot's Room occupied.", "resolution": "Downgrade binary_sensor.nursery_person_occupancy to `supporting` and trigger Margot's Room only from interior Frigate sub-zones.", "rooms": ["Margot's Room", "Guest Room"], "severity": "high", "title": "Nursery Camera cone spills into Guest Room"}, {"camera_id": "camera.office", "category": "camera_spillover", "description": "`camera.office` (hosted in Office) also sees Upstairs Hallway & Stairs. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Office occupied.", "resolution": "Downgrade binary_sensor.office_person_occupancy, binary_sensor.office_entryway_person_occupancy to `supporting` and trigger Office only from interior Frigate sub-zones.", "rooms": ["Office", "Upstairs Hallway & Stairs"], "severity": "high", "title": "Office Camera cone spills into Upstairs Hallway & Stairs"}, {"camera_id": "camera.basement_theater", "category": "camera_spillover", "description": "`camera.basement_theater` (hosted in Basement Theater) also sees Basement Play Area, Storage Room. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Basement Theater occupied.", "resolution": "Downgrade binary_sensor.basement_theater_person_occupancy, binary_sensor.basement_stairwell_person_occupancy to `supporting` and trigger Basement Theater only from interior Frigate sub-zones.", "rooms": ["Basement Theater", "Basement Play Area", "Storage Room"], "severity": "high", "title": "Basement Theater Camera cone spills into Basement Play Area, Storage Room"}, {"camera_id": "camera.basement_play_area", "category": "camera_spillover", "description": "`camera.basement_play_area` (hosted in Basement Play Area) also sees Basement Theater. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Basement Play Area occupied.", "resolution": "Downgrade binary_sensor.basement_play_area_person_occupancy, binary_sensor.basement_stairwell_person_occupancy to `supporting` and trigger Basement Play Area only from interior Frigate sub-zones.", "rooms": ["Basement Play Area", "Basement Theater"], "severity": "high", "title": "Basement Play Area Camera cone spills into Basement Theater"}, {"camera_id": "camera.storage_room", "category": "camera_spillover", "description": "`camera.storage_room` (hosted in Storage Room) also sees Basement Play Area. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Storage Room occupied.", "resolution": "Downgrade whole-frame camera person to `supporting` and trigger Storage Room only from interior Frigate sub-zones.", "rooms": ["Storage Room", "Basement Play Area"], "severity": "high", "title": "Storage Room Camera cone spills into Basement Play Area"}, {"camera_id": "camera.master_bedroom", "category": "blind_pocket", "description": "`camera.master_bedroom` catches the Master Bathroom/Closet entry doorway (`binary_sensor.master_bathroom_person_occupancy`), but the interior shower, vanity, and closet are out of frame.", "resolution": "Trigger on `master_bathroom_person_occupancy` doorway entry, sustain on shower fan, lights, or humidity derivative (`> 0.3`), and hand off timer when returning to Master Bedroom.", "rooms": ["Master Bathroom", "Master Bedroom"], "severity": "medium", "title": "Master Bathroom & Closet interior is out of camera view"}, {"camera_id": "camera.basement_play_area", "category": "blind_pocket", "description": "Located to the left of `camera.basement_play_area` alongside Storage Room, with an unmonitored door and no interior sensors.", "resolution": "Treat left edge exit from Basement Play Area as an unsealed transition; Storage Room uses its internal `camera.storage_room` to distinguish gym/storage entry.", "rooms": ["Basement Play Area", "Storage Room"], "severity": "low", "title": "Basement Bathroom is out of frame left of Play Area camera"}, {"camera_id": null, "category": "vertical_ble_bleed", "description": "Master Bedroom (Upstairs) sits directly over Dining Room (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.", "resolution": "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor.", "rooms": ["Master Bedroom", "Dining Room"], "severity": "medium", "title": "Vertical BLE stack: Master Bedroom directly above Dining Room (68% overlap)"}, {"camera_id": null, "category": "vertical_ble_bleed", "description": "Master Bedroom (Upstairs) sits directly over Living Room (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.", "resolution": "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor.", "rooms": ["Master Bedroom", "Living Room"], "severity": "medium", "title": "Vertical BLE stack: Master Bedroom directly above Living Room (79% overlap)"}, {"camera_id": null, "category": "vertical_ble_bleed", "description": "Master Bedroom (Upstairs) sits directly over Kitchen (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.", "resolution": "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor.", "rooms": ["Master Bedroom", "Kitchen"], "severity": "medium", "title": "Vertical BLE stack: Master Bedroom directly above Kitchen (36% overlap)"}, {"camera_id": null, "category": "vertical_ble_bleed", "description": "Master W.I.C (Upstairs) sits directly over Front Entry (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.", "resolution": "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor.", "rooms": ["Master W.I.C", "Front Entry"], "severity": "medium", "title": "Vertical BLE stack: Master W.I.C directly above Front Entry (100% overlap)"}, {"camera_id": null, "category": "vertical_ble_bleed", "description": "Upstairs Bathroom (Upstairs) sits directly over Front Entry (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.", "resolution": "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor.", "rooms": ["Upstairs Bathroom", "Front Entry"], "severity": "medium", "title": "Vertical BLE stack: Upstairs Bathroom directly above Front Entry (49% overlap)"}, {"camera_id": null, "category": "vertical_ble_bleed", "description": "Upstairs Bathroom (Upstairs) sits directly over Laundry Room (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.", "resolution": "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor.", "rooms": ["Upstairs Bathroom", "Laundry Room"], "severity": "medium", "title": "Vertical BLE stack: Upstairs Bathroom directly above Laundry Room (41% overlap)"}, {"camera_id": null, "category": "vertical_ble_bleed", "description": "Master Bathroom (Upstairs) sits directly over Front Entry (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.", "resolution": "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor.", "rooms": ["Master Bathroom", "Front Entry"], "severity": "medium", "title": "Vertical BLE stack: Master Bathroom directly above Front Entry (38% overlap)"}, {"camera_id": null, "category": "vertical_ble_bleed", "description": "Master Bathroom (Upstairs) sits directly over Garage (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.", "resolution": "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor.", "rooms": ["Master Bathroom", "Garage"], "severity": "medium", "title": "Vertical BLE stack: Master Bathroom directly above Garage (43% overlap)"}, {"camera_id": null, "category": "vertical_ble_bleed", "description": "Margot's Room (Upstairs) sits directly over Kitchen (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.", "resolution": "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor.", "rooms": ["Margot's Room", "Kitchen"], "severity": "medium", "title": "Vertical BLE stack: Margot's Room directly above Kitchen (53% overlap)"}, {"camera_id": null, "category": "vertical_ble_bleed", "description": "Guest Room (Upstairs) sits directly over Family Room (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.", "resolution": "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor.", "rooms": ["Guest Room", "Family Room"], "severity": "medium", "title": "Vertical BLE stack: Guest Room directly above Family Room (74% overlap)"}, {"camera_id": null, "category": "vertical_ble_bleed", "description": "Office (Upstairs) sits directly over Garage (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.", "resolution": "Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor.", "rooms": ["Office", "Garage"], "severity": "medium", "title": "Vertical BLE stack: Office directly above Garage (51% overlap)"}], "ble_proxy_analysis": [{"area_name": "Living Room", "floor": "main", "host_room": "Living Room", "id": "living_room_speaker", "name": "Living Room Speaker BLE Proxy", "radius_px": 210.0, "reachable_rooms": ["Dining Room", "Living Room", "Kitchen", "Powder Bath", "Front Entry"], "x": 210.0, "y": 410.0}, {"area_name": "Family Room", "floor": "main", "host_room": "Family Room", "id": "family_room_speaker", "name": "Family Room Speaker BLE Proxy", "radius_px": 210.0, "reachable_rooms": ["Kitchen", "Front Entry", "Family Room", "Laundry Room"], "x": 680.0, "y": 200.0}, {"area_name": "Master Bedroom", "floor": "upstairs", "host_room": "Master Bedroom", "id": "master_bedroom_speaker", "name": "Master Bedroom Speaker BLE Proxy", "radius_px": 210.0, "reachable_rooms": ["Master Bedroom", "Margot's Room", "Upstairs Hallway & Stairs"], "x": 230.0, "y": 180.0}, {"area_name": "Margot's Room", "floor": "upstairs", "host_room": "Margot's Room", "id": "nursery_speaker", "name": "Nursery Speaker BLE Proxy", "radius_px": 190.0, "reachable_rooms": ["Master Bedroom", "Upstairs Bathroom", "Margot's Room", "Guest Room", "Upstairs Hallway & Stairs"], "x": 465.0, "y": 140.0}, {"area_name": "Office", "floor": "upstairs", "host_room": "Office", "id": "office_speaker", "name": "Office Speaker BLE Proxy", "radius_px": 200.0, "reachable_rooms": ["Upstairs Bathroom", "Master Bathroom", "Guest Room", "Office", "Upstairs Hallway & Stairs"], "x": 765.0, "y": 400.0}, {"area_name": "Basement Play Area", "floor": "basement", "host_room": "Basement Play Area", "id": "basement_speaker", "name": "Basement Speaker BLE Proxy", "radius_px": 260.0, "reachable_rooms": ["Basement Theater", "Basement Play Area", "Basement Bathroom", "Storage Room"], "x": 450.0, "y": 295.0}], "camera_analysis": [{"camera_id": "camera.living_room", "floor": "main", "has_multi_room_bleed": true, "host_room": "Living Room", "name": "Living Room Camera", "spillover_targets": [{"overlap_pct": 27.0, "room_name": "Front Entry"}], "sub_zones": [{"entity_id": "binary_sensor.living_room_couch_person_occupancy", "height": 100, "id": "living_room_couch", "label": "Living Room Couch", "room": "Living Room", "width": 125, "x": 105, "y": 355}, {"entity_id": "binary_sensor.living_room_floor_person_occupancy", "height": 100, "id": "living_room_floor", "label": "Living Room Floor", "room": "Living Room", "width": 95, "x": 235, "y": 365}, {"entity_id": "binary_sensor.living_room_bay_windows_person_occupancy", "height": 38, "id": "living_room_bay_windows", "label": "Bay Windows", "room": "Living Room", "width": 165, "x": 115, "y": 468}, {"entity_id": "binary_sensor.living_room_entry_person_occupancy", "height": 80, "id": "living_room_entry", "label": "Front Entry Archway", "room": "Front Entry", "width": 80, "x": 350, "y": 415}], "visibility_polygon": [[76.0, 335.0], [251.0, 253.4], [251.0, 258.86], [251.0, 264.2], [251.0, 269.43], [251.0, 274.56], [251.0, 277.03], [212.0, 290.0], [212.16, 290.0], [218.14, 290.0], [232.1, 290.0], [248.82, 290.0], [250.75, 290.0], [251.0, 290.0], [251.25, 290.0], [269.25, 290.0], [294.8, 290.0], [327.74, 290.0], [340.44, 290.0], [341.0, 290.0], [341.0, 290.1], [341.0, 294.69], [341.0, 299.2], [341.0, 299.3], [341.0, 299.39], [341.0, 301.7], [341.0, 308.66], [341.0, 308.87], [341.0, 308.96], [341.0, 309.06], [341.0, 314.66], [341.0, 314.75], [341.0, 314.84], [341.0, 315.59], [341.0, 316.04], [341.0, 316.13], [341.0, 316.22], [341.0, 319.13], [341.0, 319.23], [341.0, 319.32], [341.0, 322.49], [341.0, 329.37], [341.0, 336.25], [341.0, 342.43], [341.0, 342.52], [341.0, 342.61], [341.0, 342.84], [341.0, 342.93], [341.0, 343.03], [341.0, 343.13], [341.0, 350.02], [341.0, 356.93], [341.0, 363.86], [341.0, 365.05], [341.0, 365.15], [341.0, 365.24], [341.0, 370.84], [341.0, 370.97], [341.0, 371.06], [341.0, 371.15], [341.0, 372.2], [341.0, 372.29], [341.0, 372.38], [341.0, 377.87], [341.0, 381.9], [341.0, 382.0], [341.0, 382.1], [341.0, 384.66], [341.0, 384.76], [341.0, 384.86], [341.0, 384.96], [341.0, 392.11], [341.0, 399.35], [341.0, 400.76], [341.0, 400.85], [341.0, 400.95], [341.0, 406.68], [341.0, 414.11], [341.0, 417.9], [341.0, 418.0], [534.0, 478.62], [534.0, 484.77], [534.0, 498.04], [534.0, 507.82], [534.0, 508.0], [533.52, 508.0], [524.78, 508.0], [492.27, 508.0], [463.58, 508.0], [438.04, 508.0], [436.48, 508.0], [436.15, 508.0], [435.83, 508.0], [415.14, 508.0], [394.45, 508.0], [375.64, 508.0], [358.46, 508.0], [350.73, 508.0], [341.0, 502.0], [341.0, 502.13], [341.0, 506.92], [341.0, 507.87], [341.0, 508.0], [340.8, 508.0], [328.1, 508.0], [314.59, 508.0], [302.01, 508.0], [290.26, 508.0], [279.24, 508.0], [268.87, 508.0], [259.08, 508.0], [249.82, 508.0], [241.03, 508.0], [232.66, 508.0], [224.68, 508.0], [217.04, 508.0], [209.72, 508.0], [202.69, 508.0], [195.92, 508.0], [189.39, 508.0], [183.08, 508.0], [176.97, 508.0], [171.04, 508.0], [165.28, 508.0], [159.67, 508.0], [154.2, 508.0], [148.86, 508.0], [143.63, 508.0], [138.51, 508.0], [133.48, 508.0], [128.53, 508.0], [123.67, 508.0], [118.87, 508.0], [114.14, 508.0], [109.46, 508.0], [104.82, 508.0], [100.23, 508.0], [95.67, 508.0], [91.14, 508.0]], "zones": ["living_room_couch", "living_room_floor", "living_room_bay_windows", "living_room_entry"]}, {"camera_id": "camera.dining_room", "floor": "main", "has_multi_room_bleed": true, "host_room": "Dining Room", "name": "Dining Room Camera", "spillover_targets": [{"overlap_pct": 23.0, "room_name": "Living Room"}], "sub_zones": [{"entity_id": "binary_sensor.dining_room_table_person_occupancy", "height": 110, "id": "dining_room_table", "label": "Dining Table", "room": "Dining Room", "width": 110, "x": 105, "y": 145}, {"entity_id": "binary_sensor.rileys_food_person_occupancy", "height": 42, "id": "rileys_food", "label": "Riley's Food Corner", "room": "Dining Room", "width": 65, "x": 170, "y": 96}], "visibility_polygon": [[242.0, 96.0], [251.0, 125.44], [251.0, 128.42], [251.0, 132.02], [251.0, 132.85], [251.0, 132.91], [251.0, 132.97], [251.0, 133.4], [251.0, 133.45], [251.0, 133.51], [251.0, 136.46], [251.0, 142.07], [251.0, 149.39], [251.0, 159.39], [251.0, 173.85], [251.0, 189.66], [251.0, 190.0], [260.51, 290.0], [259.34, 290.0], [254.28, 290.0], [253.41, 290.0], [253.34, 290.0], [251.0, 250.93], [251.0, 288.55], [251.0, 290.0], [250.93, 290.0], [249.23, 290.0], [244.2, 290.0], [239.16, 290.0], [234.13, 290.0], [229.08, 290.0], [224.01, 290.0], [218.92, 290.0], [213.8, 290.0], [212.07, 290.0], [212.0, 290.0], [192.99, 412.22], [187.77, 411.37], [179.61, 409.86], [171.49, 408.13], [163.41, 406.2], [155.39, 404.06], [147.43, 401.71], [139.53, 399.15], [131.7, 396.39], [123.95, 393.43], [117.6, 390.83], [117.5, 390.79], [117.4, 390.74], [116.27, 390.27], [108.68, 386.91], [101.18, 383.35], [93.77, 379.6], [86.46, 375.66], [79.26, 371.53], [72.17, 367.22], [68.0, 358.48], [68.0, 344.25], [68.0, 331.03], [68.0, 327.37], [96.0, 290.0], [95.89, 290.0], [90.43, 290.0], [82.16, 290.0], [73.52, 290.0], [68.12, 290.0], [68.0, 290.0], [68.0, 289.86], [68.0, 286.16], [68.0, 276.52], [68.0, 267.39], [68.0, 258.72], [68.0, 250.46], [68.0, 242.56], [68.0, 235.01], [68.0, 227.76], [68.0, 220.8], [68.0, 214.08], [68.0, 207.6], [68.0, 201.33], [68.0, 195.26], [68.0, 189.36], [68.0, 183.63], [68.0, 178.04], [68.0, 172.59], [68.0, 167.26], [68.0, 162.04], [68.0, 156.92], [68.0, 151.9], [68.0, 146.96], [68.0, 142.1], [68.0, 137.3], [68.0, 132.56], [68.0, 127.87], [68.0, 123.22], [68.0, 118.62], [68.0, 114.04], [68.0, 109.49], [68.0, 104.95], [68.0, 100.43], [68.0, 95.92], [68.0, 91.4], [68.0, 87.06], [68.0, 87.0], [69.17, 87.0], [70.27, 87.0]], "zones": ["dining_room_table", "rileys_food"]}, {"camera_id": "camera.family_room", "floor": "main", "has_multi_room_bleed": true, "host_room": "Family Room", "name": "Family Room Camera", "spillover_targets": [{"overlap_pct": 6.0, "room_name": "Dining Room"}, {"overlap_pct": 100.0, "room_name": "Kitchen"}, {"overlap_pct": 17.0, "room_name": "Powder Bath"}, {"overlap_pct": 18.0, "room_name": "Front Entry"}], "sub_zones": [{"entity_id": "binary_sensor.family_room_couch_person_occupancy", "height": 88, "id": "family_room_couch", "label": "Family Room Couch", "room": "Family Room", "width": 150, "x": 635, "y": 195}, {"entity_id": "binary_sensor.family_room_recliner_person_occupancy", "height": 75, "id": "family_room_recliner", "label": "Family Room Recliner", "room": "Family Room", "width": 80, "x": 545, "y": 115}, {"entity_id": "binary_sensor.family_room_floor_person_occupancy", "height": 88, "id": "family_room_floor", "label": "Family Room Floor", "room": "Family Room", "width": 85, "x": 545, "y": 195}, {"entity_id": "binary_sensor.kitchen_island_person_occupancy", "height": 95, "id": "kitchen_island", "label": "Kitchen Island", "room": "Kitchen", "width": 120, "x": 335, "y": 155}], "visibility_polygon": [[818.0, 96.0], [828.17, 290.0], [826.42, 290.0], [826.36, 290.0], [826.29, 290.0], [823.98, 290.0], [823.92, 290.0], [823.85, 290.0], [823.13, 290.0], [818.09, 290.0], [813.06, 290.0], [808.02, 290.0], [802.96, 290.0], [797.89, 290.0], [792.79, 290.0], [787.65, 290.0], [782.47, 290.0], [777.24, 290.0], [771.96, 290.0], [766.61, 290.0], [761.18, 290.0], [755.67, 290.0], [752.41, 290.0], [752.34, 290.0], [752.26, 290.0], [750.07, 290.0], [744.37, 290.0], [738.55, 290.0], [732.61, 290.0], [726.53, 290.0], [720.3, 290.0], [713.91, 290.0], [708.09, 290.0], [708.0, 290.0], [707.91, 290.0], [707.33, 290.0], [700.56, 290.0], [698.06, 290.0], [697.97, 290.0], [697.87, 290.0], [693.57, 290.0], [686.34, 290.0], [684.37, 290.0], [684.27, 290.0], [684.17, 290.0], [678.86, 290.0], [671.09, 290.0], [663.01, 290.0], [654.59, 290.0], [648.59, 290.0], [648.47, 290.0], [648.35, 290.0], [645.79, 290.0], [636.58, 290.0], [626.91, 290.0], [616.73, 290.0], [605.99, 290.0], [599.52, 290.0], [599.36, 290.0], [599.21, 290.0], [594.62, 290.0], [593.55, 290.0], [593.39, 290.0], [593.23, 290.0], [590.24, 290.0], [590.07, 290.0], [589.91, 290.0], [582.55, 290.0], [572.36, 290.0], [572.19, 290.0], [572.01, 290.0], [569.69, 290.0], [555.95, 290.0], [548.12, 290.0], [547.92, 290.0], [547.72, 290.0], [541.45, 290.0], [541.24, 290.0], [541.22, 290.0], [541.04, 290.0], [534.21, 290.0], [534.0, 290.0], [399.01, 382.0], [394.65, 382.0], [394.33, 382.0], [394.01, 382.0], [386.56, 382.0], [361.26, 382.0], [349.74, 382.0], [410.0, 345.0], [410.0, 344.8], [410.0, 340.82], [410.0, 340.63], [410.0, 340.44], [410.0, 336.98], [410.0, 322.91], [410.0, 320.31], [410.0, 320.13], [410.0, 319.94], [410.0, 309.25], [410.0, 295.95], [410.0, 290.17], [410.0, 290.0], [409.63, 290.0], [394.69, 290.0], [363.94, 290.0], [341.48, 290.0], [341.0, 290.0], [340.52, 290.0], [329.22, 290.0], [289.65, 290.0], [251.65, 290.0], [251.0, 290.0], [251.0, 289.78], [251.0, 287.65], [251.0, 277.73], [251.0, 277.51], [251.0, 277.3], [251.0, 271.4], [251.0, 255.41], [251.0, 250.21], [219.68, 258.51], [219.62, 258.3], [219.29, 257.09], [219.24, 256.89], [219.18, 256.68], [217.81, 251.47], [217.76, 251.26], [217.7, 251.05], [216.99, 248.26], [213.24, 232.62], [209.9, 216.88], [206.97, 201.07], [206.38, 197.62], [251.0, 190.0], [251.0, 189.8], [251.0, 178.42], [251.0, 163.45], [251.0, 148.57], [251.0, 133.77], [251.0, 119.01], [251.0, 104.29], [251.0, 89.58], [251.0, 89.39], [251.0, 89.2], [251.0, 89.0], [251.0, 87.2], [251.01, 87.0], [263.22, 87.0], [576.6, 87.0], [675.8, 87.0], [717.32, 87.0], [740.15, 87.0], [754.61, 87.0], [764.61, 87.0], [771.93, 87.0], [777.54, 87.0], [781.98, 87.0], [785.58, 87.0], [788.56, 87.0]], "zones": ["family_room_couch", "family_room_recliner", "family_room_floor", "kitchen_island"]}, {"camera_id": "camera.garage", "floor": "main", "has_multi_room_bleed": false, "host_room": "Garage", "name": "Garage Camera", "spillover_targets": [], "sub_zones": [{"entity_id": "binary_sensor.garage_parking_person_occupancy", "height": 108, "id": "garage_parking", "label": "Garage Parking Bay", "room": "Garage", "width": 170, "x": 595, "y": 438}], "visibility_polygon": [[680.0, 423.0], [832.0, 444.36], [832.0, 448.41], [832.0, 452.5], [832.0, 456.62], [832.0, 460.8], [832.0, 465.02], [832.0, 469.31], [832.0, 473.67], [832.0, 478.11], [832.0, 482.62], [832.0, 487.24], [832.0, 491.95], [832.0, 496.78], [832.0, 501.73], [832.0, 506.81], [832.0, 512.05], [832.0, 517.44], [832.0, 523.02], [832.0, 528.79], [832.0, 534.77], [832.0, 540.98], [832.0, 547.45], [832.0, 554.2], [832.0, 554.91], [832.0, 555.0], [831.89, 555.0], [825.11, 555.0], [817.74, 555.0], [810.75, 555.0], [804.11, 555.0], [797.8, 555.0], [791.76, 555.0], [785.99, 555.0], [780.46, 555.0], [775.14, 555.0], [770.01, 555.0], [765.07, 555.0], [760.29, 555.0], [755.65, 555.0], [751.16, 555.0], [746.78, 555.0], [742.52, 555.0], [738.37, 555.0], [734.31, 555.0], [730.33, 555.0], [726.44, 555.0], [722.61, 555.0], [718.85, 555.0], [715.14, 555.0], [711.49, 555.0], [707.88, 555.0], [704.31, 555.0], [700.78, 555.0], [697.27, 555.0], [693.79, 555.0], [690.33, 555.0], [686.88, 555.0], [683.44, 555.0], [680.0, 555.0], [676.56, 555.0], [673.12, 555.0], [669.67, 555.0], [666.21, 555.0], [662.73, 555.0], [659.22, 555.0], [655.69, 555.0], [652.12, 555.0], [648.51, 555.0], [644.86, 555.0], [641.15, 555.0], [637.39, 555.0], [633.56, 555.0], [629.67, 555.0], [625.69, 555.0], [621.63, 555.0], [617.48, 555.0], [613.22, 555.0], [608.84, 555.0], [604.35, 555.0], [599.71, 555.0], [594.93, 555.0], [589.99, 555.0], [584.86, 555.0], [579.54, 555.0], [574.01, 555.0], [568.24, 555.0], [562.2, 555.0], [555.89, 555.0], [549.25, 555.0], [542.26, 555.0], [534.89, 555.0], [534.1, 555.0], [534.0, 555.0], [534.0, 554.91], [534.0, 549.02], [534.0, 542.54], [534.0, 536.32], [534.0, 530.35], [534.0, 524.61], [534.0, 519.07], [534.0, 513.72], [534.0, 508.53], [534.0, 508.07], [534.0, 508.0], [534.0, 507.93], [534.0, 503.51], [534.0, 498.62], [534.0, 493.87], [534.0, 489.23], [534.0, 484.7], [534.0, 480.27], [534.0, 475.93], [534.0, 471.67], [534.0, 467.48], [534.0, 463.36], [534.0, 459.66], [534.0, 459.61], [534.0, 459.55], [534.0, 459.3], [534.0, 457.08], [534.0, 457.02], [534.0, 456.97], [534.0, 455.29], [534.0, 451.33], [534.0, 447.41], [534.0, 443.52]], "zones": ["garage_parking"]}, {"camera_id": "camera.master_bedroom", "floor": "upstairs", "has_multi_room_bleed": true, "host_room": "Master Bedroom", "name": "Master Bedroom Camera", "spillover_targets": [{"overlap_pct": 46.0, "room_name": "Master Bathroom"}, {"overlap_pct": 18.0, "room_name": "Upstairs Hallway & Stairs"}], "sub_zones": [{"entity_id": "binary_sensor.master_bed_person_occupancy", "height": 155, "id": "master_bed", "label": "Master Bed", "room": "Master Bedroom", "width": 135, "x": 134, "y": 250}, {"entity_id": "binary_sensor.master_open_area_person_occupancy", "height": 165, "id": "master_open_area", "label": "Master Open Floor", "room": "Master Bedroom", "width": 145, "x": 140, "y": 55}, {"entity_id": "binary_sensor.master_bedroom_walkway_person_occupancy", "height": 220, "id": "master_bedroom_walkway", "label": "Master Walkway", "room": "Master Bedroom", "width": 68, "x": 278, "y": 225}, {"entity_id": "binary_sensor.master_bedroom_entryway_person_occupancy", "height": 56, "id": "master_bedroom_entryway", "label": "Master Hallway Entry", "room": "Master Bedroom", "width": 48, "x": 305, "y": 256}, {"entity_id": "binary_sensor.master_bathroom_person_occupancy", "height": 56, "id": "master_bathroom", "label": "Master Bath Doorway", "room": "Master Bathroom", "width": 55, "x": 425, "y": 486}], "visibility_polygon": [[134.0, 536.0], [126.0, 498.36], [126.0, 492.89], [126.0, 485.64], [126.0, 475.56], [126.0, 460.57], [126.0, 435.86], [126.0, 387.38], [126.0, 248.63], [126.0, 42.86], [126.0, 32.01], [126.18, 32.0], [133.05, 32.0], [146.13, 32.0], [159.22, 32.0], [172.35, 32.0], [185.53, 32.0], [198.78, 32.0], [212.12, 32.0], [225.57, 32.0], [239.14, 32.0], [252.86, 32.0], [266.76, 32.0], [280.84, 32.0], [295.13, 32.0], [309.67, 32.0], [324.47, 32.0], [339.57, 32.0], [352.79, 32.0], [353.0, 32.0], [353.0, 32.48], [353.0, 36.53], [353.0, 69.8], [353.0, 99.59], [353.0, 126.45], [353.0, 150.83], [353.0, 173.08], [353.0, 193.49], [353.0, 212.31], [353.0, 229.74], [353.0, 245.95], [353.0, 253.8], [353.0, 254.0], [353.0, 254.2], [353.0, 255.8], [353.0, 256.0], [354.72, 254.0], [358.64, 254.0], [370.85, 254.0], [373.87, 254.0], [374.04, 254.0], [374.21, 254.0], [383.61, 254.0], [396.97, 254.0], [400.15, 254.0], [400.33, 254.0], [400.52, 254.0], [405.53, 254.0], [405.72, 254.0], [405.91, 254.0], [409.51, 254.0], [353.0, 312.0], [353.0, 312.16], [353.0, 313.04], [353.0, 315.85], [353.0, 316.0], [353.0, 316.15], [353.0, 324.31], [353.0, 329.96], [353.0, 330.1], [353.0, 330.25], [353.0, 335.04], [353.0, 335.24], [353.0, 335.38], [353.0, 335.52], [353.0, 339.83], [353.0, 339.97], [353.0, 340.11], [353.0, 345.26], [353.0, 349.07], [353.0, 349.21], [353.0, 349.34], [353.0, 354.87], [353.0, 355.0], [353.0, 355.04], [353.0, 355.06], [353.0, 355.13], [353.0, 355.19], [353.0, 355.32], [353.0, 364.4], [353.0, 370.75], [353.0, 370.87], [353.0, 370.99], [353.0, 373.1], [353.0, 373.21], [353.0, 373.33], [353.0, 373.39], [353.0, 381.46], [353.0, 381.58], [353.0, 381.69], [353.0, 382.04], [353.0, 385.8], [353.0, 385.92], [353.0, 386.03], [353.0, 386.73], [353.0, 386.84], [353.0, 386.96], [353.0, 389.0], [353.0, 389.11], [353.0, 389.22], [353.0, 390.23], [353.0, 390.34], [353.0, 390.38], [353.0, 390.45], [353.0, 391.93], [353.0, 392.04], [353.0, 392.15], [353.0, 392.3], [353.0, 392.41], [353.0, 392.52], [353.0, 398.43], [353.0, 406.15], [353.0, 406.23], [353.0, 406.26], [353.0, 406.36], [353.0, 406.7], [353.0, 406.8], [353.0, 406.9], [353.0, 407.07], [353.0, 407.18], [353.0, 407.28], [353.0, 413.79], [353.0, 415.05], [353.0, 415.15], [353.0, 415.25], [353.0, 418.94], [353.0, 419.03], [353.0, 419.13], [353.0, 420.9], [353.0, 420.91], [353.0, 420.99], [353.0, 421.01], [353.0, 421.09], [353.0, 421.11], [353.0, 421.14], [353.0, 421.25], [353.0, 421.34], [353.0, 421.44], [353.0, 422.53], [353.0, 422.63], [353.0, 422.72], [353.0, 428.29], [353.0, 433.15], [353.0, 433.24], [353.0, 433.33], [353.0, 434.69], [353.0, 434.78], [353.0, 434.87], [353.0, 435.26], [353.0, 442.06], [353.0, 444.76], [353.0, 444.85], [353.0, 444.94], [353.0, 445.78], [353.0, 445.87], [353.0, 445.96], [353.0, 448.46], [353.0, 448.55], [353.0, 448.63], [353.0, 448.72], [353.0, 450.59], [353.0, 450.68], [353.0, 450.76], [353.0, 452.46], [353.0, 452.54], [353.0, 452.63], [353.0, 455.24], [353.0, 461.63], [353.0, 463.32], [353.0, 463.4], [353.0, 463.49], [353.0, 464.89], [353.0, 464.97], [353.0, 465.06], [353.0, 467.91], [353.0, 473.65], [353.0, 473.74], [353.0, 473.82], [353.0, 474.1], [353.0, 474.74], [353.0, 474.82], [353.0, 474.91], [353.0, 477.83], [353.0, 477.91], [353.0, 477.99], [353.0, 480.19], [353.0, 481.17], [353.0, 481.25], [353.0, 481.33], [353.0, 483.92], [353.0, 484.0], [353.34, 484.0], [362.68, 484.0], [388.17, 484.0], [388.62, 484.0], [389.08, 484.0], [393.66, 484.0], [397.51, 484.0], [398.0, 484.0], [398.49, 484.0], [433.87, 484.0], [439.35, 484.0], [440.0, 484.0], [440.0, 484.11], [440.0, 491.08], [440.0, 497.89], [440.0, 498.0], [610.0, 477.06], [610.0, 478.69], [610.0, 491.19], [610.0, 503.62], [610.0, 516.0], [610.0, 528.37], [610.0, 540.72], [610.0, 543.55], [610.0, 543.72], [610.0, 543.88], [610.0, 546.47], [610.0, 546.64], [610.0, 546.8], [610.0, 547.83], [610.0, 548.0], [603.5, 548.0], [599.21, 548.0], [440.0, 544.0], [440.0, 544.11], [440.0, 546.98], [440.0, 547.89], [440.0, 548.0], [437.3, 548.0], [327.95, 548.0], [270.42, 548.0], [239.1, 548.0], [219.38, 548.0]], "zones": ["master_bed", "master_open_area", "master_bedroom_walkway", "master_bedroom_entryway", "master_bathroom"]}, {"camera_id": "camera.nursery", "floor": "upstairs", "has_multi_room_bleed": true, "host_room": "Margot's Room", "name": "Nursery Camera", "spillover_targets": [{"overlap_pct": 8.0, "room_name": "Guest Room"}], "sub_zones": [{"entity_id": "binary_sensor.nursery_bed_person_occupancy", "height": 115, "id": "nursery_bed", "label": "Nursery Bed", "room": "Margot's Room", "width": 125, "x": 370, "y": 95}], "visibility_polygon": [[358.0, 246.0], [353.0, 225.95], [353.0, 223.47], [353.0, 220.34], [353.0, 216.25], [353.0, 210.67], [353.0, 202.57], [353.0, 189.77], [353.0, 166.41], [353.0, 110.17], [353.0, 35.15], [353.0, 32.0], [353.07, 32.0], [355.68, 32.0], [361.23, 32.0], [366.79, 32.0], [372.36, 32.0], [377.94, 32.0], [383.56, 32.0], [389.21, 32.0], [394.9, 32.0], [400.65, 32.0], [406.45, 32.0], [412.32, 32.0], [418.27, 32.0], [424.31, 32.0], [430.45, 32.0], [436.69, 32.0], [443.06, 32.0], [449.55, 32.0], [456.2, 32.0], [463.0, 32.0], [469.98, 32.0], [477.15, 32.0], [484.53, 32.0], [492.14, 32.0], [500.01, 32.0], [508.15, 32.0], [516.59, 32.0], [525.36, 32.0], [534.49, 32.0], [544.03, 32.0], [554.0, 32.0], [562.86, 32.0], [563.0, 32.0], [563.0, 32.15], [563.0, 33.52], [563.0, 44.26], [563.0, 54.47], [563.0, 64.2], [563.0, 71.79], [563.0, 71.91], [563.0, 72.04], [563.0, 73.49], [563.0, 79.93], [563.0, 80.05], [563.0, 80.17], [563.0, 82.38], [563.0, 90.91], [563.0, 99.12], [563.0, 107.02], [563.0, 114.65], [563.0, 122.03], [563.0, 129.19], [563.0, 136.13], [563.0, 142.88], [563.0, 142.91], [563.0, 143.0], [563.0, 143.09], [563.0, 149.46], [563.0, 151.55], [563.0, 151.64], [563.0, 151.72], [563.0, 151.91], [563.0, 152.0], [582.83, 143.0], [592.31, 143.0], [609.75, 143.0], [609.85, 143.0], [610.0, 143.0], [610.0, 143.1], [610.0, 150.49], [610.0, 157.9], [610.0, 165.17], [610.0, 172.32], [610.0, 179.37], [610.0, 186.32], [610.0, 193.18], [610.0, 199.97], [610.0, 206.7], [610.0, 213.37], [610.0, 219.99], [610.0, 226.59], [610.0, 233.15], [610.0, 239.7], [610.0, 241.0], [563.0, 242.0], [563.0, 242.07], [563.0, 246.19], [563.0, 250.28], [563.0, 250.35], [563.0, 250.42], [563.0, 251.17], [563.0, 251.24], [563.0, 251.31], [563.0, 251.32], [563.0, 251.39], [563.0, 251.47], [563.0, 251.51], [563.0, 252.39], [563.0, 252.44], [563.0, 252.46], [563.0, 252.51], [563.0, 252.53], [563.0, 252.58], [563.0, 253.79], [563.0, 253.86], [563.0, 253.93], [563.0, 253.93], [563.0, 253.94], [563.0, 254.0], [562.67, 254.0], [561.18, 254.0], [560.86, 254.0], [559.76, 254.0], [558.0, 254.0], [558.0, 254.07], [558.0, 256.58], [558.0, 256.6], [508.0, 254.0], [507.02, 254.0], [492.12, 254.0], [491.33, 254.0], [490.56, 254.0], [459.34, 254.0], [458.44, 254.0], [458.0, 254.0], [457.56, 254.0], [438.28, 254.0], [438.0, 254.0], [437.72, 254.0], [434.11, 254.0]], "zones": ["nursery_bed"]}, {"camera_id": "camera.office", "floor": "upstairs", "has_multi_room_bleed": true, "host_room": "Office", "name": "Office Camera", "spillover_targets": [{"overlap_pct": 18.0, "room_name": "Upstairs Hallway & Stairs"}], "sub_zones": [{"entity_id": "binary_sensor.steves_desk_person_occupancy", "height": 95, "id": "steves_desk", "label": "Steve's Desk", "room": "Office", "width": 105, "x": 745, "y": 360}, {"entity_id": "binary_sensor.sim_rig_person_occupancy", "height": 95, "id": "sim_rig", "label": "Sim Rig", "room": "Office", "width": 65, "x": 680, "y": 425}, {"entity_id": "binary_sensor.office_floor_person_occupancy", "height": 95, "id": "office_floor", "label": "Office Center Floor", "room": "Office", "width": 95, "x": 685, "y": 310}, {"entity_id": "binary_sensor.office_entryway_person_occupancy", "height": 55, "id": "office_entryway", "label": "Office Doorway", "room": "Office", "width": 45, "x": 665, "y": 258}], "visibility_polygon": [[678.0, 538.0], [671.0, 505.07], [671.0, 500.28], [671.0, 497.42], [671.0, 497.34], [671.0, 497.25], [671.0, 496.09], [671.0, 496.0], [671.0, 495.91], [671.0, 493.94], [671.0, 487.07], [671.0, 486.94], [671.0, 486.81], [671.0, 486.05], [671.0, 485.91], [671.0, 485.77], [671.0, 485.12], [671.0, 472.0], [671.0, 450.38], [671.0, 418.64], [671.0, 417.92], [671.0, 417.2], [671.0, 414.52], [671.0, 413.75], [671.0, 412.97], [671.0, 407.95], [671.0, 388.36], [671.0, 387.23], [671.0, 386.09], [671.0, 317.45], [669.21, 258.0], [669.31, 258.0], [670.21, 258.0], [670.9, 258.0], [671.0, 258.0], [671.0, 257.96], [671.0, 254.03], [671.0, 254.0], [671.1, 254.0], [677.46, 254.0], [684.83, 254.0], [692.21, 254.0], [699.61, 254.0], [707.04, 254.0], [714.5, 254.0], [722.02, 254.0], [729.6, 254.0], [734.9, 254.0], [735.0, 254.0], [735.0, 254.51], [735.0, 264.77], [735.0, 295.62], [735.0, 296.0], [735.07, 296.0], [735.09, 296.0], [741.74, 296.0], [748.51, 296.0], [749.91, 296.0], [750.0, 296.0], [762.6, 254.0], [768.8, 254.0], [776.99, 254.0], [785.33, 254.0], [787.89, 254.0], [788.01, 254.0], [788.12, 254.0], [793.84, 254.0], [802.52, 254.0], [811.41, 254.0], [820.52, 254.0], [829.87, 254.0], [839.48, 254.0], [849.37, 254.0], [859.59, 254.0], [870.15, 254.0], [873.85, 254.0], [874.0, 254.0], [874.0, 254.21], [874.0, 263.9], [874.0, 274.3], [874.0, 274.49], [858.13, 296.0], [860.72, 296.0], [870.77, 296.0], [873.86, 296.0], [874.0, 296.0], [874.0, 296.17], [874.0, 304.64], [874.0, 316.57], [874.0, 327.82], [874.0, 338.45], [874.0, 348.55], [874.0, 358.14], [874.0, 367.29], [874.0, 376.04], [874.0, 384.42], [874.0, 392.47], [874.0, 400.21], [874.0, 407.67], [874.0, 414.88], [874.0, 421.86], [874.0, 428.63], [874.0, 435.2], [874.0, 441.6], [874.0, 447.84], [874.0, 453.93], [874.0, 459.88], [874.0, 465.72], [874.0, 471.44], [874.0, 477.06], [874.0, 482.6], [874.0, 488.05], [874.0, 493.43], [874.0, 498.75], [874.0, 504.01], [874.0, 509.23], [874.0, 514.4], [874.0, 519.55], [874.0, 524.67], [874.0, 529.77], [874.0, 534.86], [874.0, 539.94], [874.0, 545.03], [874.0, 547.93], [874.0, 548.0], [872.67, 548.0], [839.62, 548.0], [791.68, 548.0], [765.59, 548.0], [749.15, 548.0]], "zones": ["steves_desk", "sim_rig", "office_floor", "office_entryway"]}, {"camera_id": "camera.basement_theater", "floor": "basement", "has_multi_room_bleed": true, "host_room": "Basement Theater", "name": "Basement Theater Camera", "spillover_targets": [{"overlap_pct": 63.0, "room_name": "Basement Play Area"}, {"overlap_pct": 8.0, "room_name": "Storage Room"}], "sub_zones": [{"entity_id": "binary_sensor.basement_theater_couch_person_occupancy", "height": 165, "id": "basement_theater_couch", "label": "Theater Couch", "room": "Basement Theater", "width": 165, "x": 150, "y": 235}, {"entity_id": "binary_sensor.basement_theater_playpen_person_occupancy", "height": 75, "id": "basement_theater_playpen", "label": "Ballpit / Playpen", "room": "Basement Theater", "width": 165, "x": 160, "y": 50}, {"entity_id": "binary_sensor.basement_theater_floor_person_occupancy", "height": 90, "id": "basement_theater_floor", "label": "Theater Floor", "room": "Basement Theater", "width": 165, "x": 160, "y": 135}, {"entity_id": "binary_sensor.basement_bar_person_occupancy", "height": 140, "id": "basement_bar", "label": "Basement Wet Bar", "room": "Basement Play Area", "width": 150, "x": 365, "y": 55}, {"entity_id": "binary_sensor.basement_play_area_far_person_occupancy", "height": 175, "id": "basement_play_area_far", "label": "Play Area East", "room": "Basement Play Area", "width": 190, "x": 370, "y": 230}, {"entity_id": "binary_sensor.basement_stairwell_person_occupancy", "height": 105, "id": "basement_stairwell", "label": "Basement Stairwell", "room": "Basement Play Area", "width": 75, "x": 495, "y": 415}], "visibility_polygon": [[104.0, 64.0], [199.29, 42.0], [212.0, 42.0], [228.43, 42.0], [250.5, 42.0], [281.79, 42.0], [329.69, 42.0], [412.34, 42.0], [521.21, 42.0], [524.0, 42.0], [524.0, 42.15], [524.0, 44.97], [524.0, 48.22], [524.0, 48.37], [524.0, 48.51], [524.0, 52.46], [524.0, 52.61], [524.0, 52.75], [524.0, 55.88], [524.0, 66.77], [524.0, 77.68], [524.0, 88.6], [524.0, 99.55], [524.0, 110.55], [524.0, 114.31], [524.0, 114.46], [524.0, 114.61], [524.0, 121.41], [524.0, 121.56], [524.0, 121.61], [524.0, 121.64], [524.0, 121.71], [524.0, 121.79], [524.0, 121.94], [524.0, 127.16], [524.0, 127.31], [524.0, 127.46], [524.0, 132.76], [524.0, 134.85], [524.0, 135.0], [794.17, 180.92], [791.64, 194.97], [788.01, 212.77], [783.92, 230.46], [782.27, 237.05], [695.0, 215.0], [695.0, 215.22], [695.0, 225.05], [695.0, 229.78], [695.0, 230.0], [694.21, 230.0], [656.27, 230.0], [608.41, 230.0], [572.52, 230.0], [572.0, 230.0], [572.0, 230.18], [572.0, 231.59], [572.0, 234.63], [572.0, 234.81], [572.0, 235.0], [572.0, 245.42], [572.0, 259.54], [572.0, 273.96], [572.0, 288.72], [572.0, 298.19], [572.0, 298.4], [572.0, 298.6], [572.0, 303.85], [572.0, 319.39], [572.0, 335.38], [572.0, 351.85], [572.0, 368.72], [572.0, 368.87], [572.0, 368.95], [572.0, 369.18], [572.0, 386.46], [572.0, 404.7], [572.0, 423.63], [572.0, 443.34], [572.0, 463.9], [572.0, 476.18], [572.0, 476.47], [572.0, 476.76], [572.0, 485.39], [572.0, 507.91], [572.0, 531.56], [572.0, 531.67], [572.0, 532.0], [571.67, 532.0], [548.74, 532.0], [526.19, 532.0], [504.67, 532.0], [484.08, 532.0], [474.54, 532.0], [474.27, 532.0], [442.65, 492.34], [432.19, 480.48], [430.0, 478.0], [429.77, 478.0], [422.76, 478.0], [405.98, 478.0], [405.88, 478.0], [405.65, 478.0], [405.43, 478.0], [389.83, 478.0], [374.24, 478.0], [359.18, 478.0], [355.2, 478.0], [355.0, 478.0], [387.52, 532.0], [375.97, 532.0], [359.96, 532.0], [344.41, 532.0], [329.26, 532.0], [314.49, 532.0], [300.05, 532.0], [286.19, 532.0], [265.0, 478.0], [264.94, 478.0], [264.83, 478.0], [252.7, 478.0], [240.68, 478.0], [228.87, 478.0], [220.16, 478.0], [220.0, 478.0], [234.95, 532.0], [232.01, 532.0], [219.05, 532.0], [206.25, 532.0], [193.6, 532.0], [181.07, 532.0], [168.65, 532.0], [156.32, 532.0], [144.06, 532.0], [133.56, 532.0], [130.0, 478.0], [129.86, 478.0], [128.64, 478.0], [117.87, 478.0], [107.12, 478.0], [96.38, 478.0], [94.41, 478.0], [94.27, 478.0], [94.12, 478.0], [93.14, 478.0], [93.0, 478.0], [93.0, 472.63], [93.0, 311.92], [93.0, 220.25], [93.0, 177.96], [93.0, 153.59]], "zones": ["basement_theater_couch", "basement_theater_playpen", "basement_theater_floor", "basement_bar", "basement_play_area_far", "basement_stairwell"]}, {"camera_id": "camera.basement_play_area", "floor": "basement", "has_multi_room_bleed": true, "host_room": "Basement Play Area", "name": "Basement Play Area Camera", "spillover_targets": [{"overlap_pct": 87.0, "room_name": "Basement Theater"}], "sub_zones": [{"entity_id": "binary_sensor.basement_play_floor_person_occupancy", "height": 220, "id": "basement_play_floor", "label": "Play Area Main Floor", "room": "Basement Play Area", "width": 195, "x": 365, "y": 225}, {"entity_id": "binary_sensor.basement_counter_person_occupancy", "height": 140, "id": "basement_counter", "label": "Wet Bar Counter", "room": "Basement Play Area", "width": 150, "x": 365, "y": 60}, {"entity_id": "binary_sensor.theater_rear_view_person_occupancy", "height": 175, "id": "theater_rear_view", "label": "Theater Rear View", "room": "Basement Theater", "width": 185, "x": 135, "y": 230}], "visibility_polygon": [[505.0, 68.0], [524.0, 110.67], [524.0, 113.84], [524.0, 113.89], [524.0, 113.94], [524.0, 113.99], [524.0, 117.43], [524.0, 117.93], [524.0, 117.98], [524.0, 118.04], [524.0, 121.53], [524.0, 126.29], [524.0, 131.87], [524.0, 134.91], [524.0, 135.0], [572.0, 304.58], [572.0, 306.82], [572.0, 307.14], [572.0, 307.46], [572.0, 316.64], [572.0, 345.06], [572.0, 380.31], [572.0, 425.27], [572.0, 484.66], [572.0, 530.86], [572.0, 532.0], [571.83, 532.0], [567.31, 532.0], [555.1, 532.0], [542.95, 532.0], [530.85, 532.0], [518.79, 532.0], [506.75, 532.0], [494.71, 532.0], [482.66, 532.0], [470.57, 532.0], [458.44, 532.0], [446.25, 532.0], [445.16, 532.0], [445.0, 532.0], [445.0, 530.73], [445.0, 496.08], [445.0, 495.0], [444.87, 494.85], [440.43, 489.82], [431.09, 479.23], [430.12, 478.14], [430.0, 478.0], [429.85, 478.0], [420.27, 478.0], [409.12, 478.0], [397.83, 478.0], [386.39, 478.0], [374.77, 478.0], [362.96, 478.0], [355.16, 478.0], [355.0, 478.0], [335.06, 532.0], [330.64, 532.0], [316.77, 532.0], [302.6, 532.0], [288.1, 532.0], [273.25, 532.0], [258.01, 532.0], [242.34, 532.0], [233.61, 532.0], [233.39, 532.0], [264.81, 478.0], [258.65, 478.0], [243.94, 478.0], [228.73, 478.0], [220.21, 478.0], [220.0, 478.0], [182.22, 532.0], [174.53, 532.0], [156.04, 532.0], [136.81, 532.0], [116.78, 532.0], [95.85, 532.0], [93.29, 532.0], [93.0, 532.0], [93.0, 531.67], [93.0, 518.77], [130.0, 478.0], [129.74, 478.0], [124.11, 478.0], [103.8, 478.0], [93.29, 478.0], [93.0, 478.0], [93.0, 477.71], [93.0, 467.75], [93.0, 447.5], [93.0, 428.2], [93.0, 409.75], [93.0, 392.09], [93.0, 375.13], [93.0, 358.81], [93.0, 343.08], [93.0, 327.88], [93.0, 313.18], [93.0, 298.92], [93.0, 285.07], [93.0, 271.6], [93.0, 258.46], [93.0, 245.64], [93.0, 233.1], [93.0, 220.82], [93.0, 208.78], [93.0, 196.94], [93.0, 185.3], [93.0, 173.83], [93.0, 162.5], [93.0, 151.32], [93.0, 140.25], [93.0, 129.28], [93.0, 118.39], [93.0, 107.57], [93.0, 96.81]], "zones": ["basement_play_floor", "basement_counter", "theater_rear_view"]}, {"camera_id": "camera.storage_room", "floor": "basement", "has_multi_room_bleed": true, "host_room": "Storage Room", "name": "Storage Room Camera", "spillover_targets": [{"overlap_pct": 6.0, "room_name": "Basement Play Area"}], "sub_zones": [{"entity_id": "binary_sensor.storage_room_workout_person_occupancy", "height": 210, "id": "storage_room_workout", "label": "Gym / Workout Mat", "room": "Storage Room", "width": 165, "x": 715, "y": 110}], "visibility_polygon": [[905.0, 54.0], [915.0, 110.71], [915.0, 120.8], [915.0, 135.13], [915.0, 157.09], [915.0, 195.09], [915.0, 277.0], [915.0, 356.77], [915.0, 360.0], [914.89, 360.0], [910.77, 360.0], [902.83, 360.0], [894.89, 360.0], [886.94, 360.0], [878.96, 360.0], [870.94, 360.0], [862.88, 360.0], [854.76, 360.0], [846.57, 360.0], [838.3, 360.0], [829.93, 360.0], [821.46, 360.0], [812.86, 360.0], [804.14, 360.0], [795.26, 360.0], [786.21, 360.0], [776.98, 360.0], [767.55, 360.0], [757.89, 360.0], [747.99, 360.0], [737.83, 360.0], [732.3, 360.0], [732.15, 360.0], [732.01, 360.0], [727.37, 360.0], [716.59, 360.0], [705.46, 360.0], [695.16, 360.0], [695.0, 360.0], [695.0, 359.77], [695.0, 358.47], [695.0, 355.67], [695.0, 355.44], [695.0, 355.22], [695.0, 342.18], [695.0, 331.09], [695.0, 330.89], [695.0, 330.69], [695.0, 327.01], [695.0, 312.83], [695.0, 299.53], [695.0, 287.01], [695.0, 275.19], [695.0, 264.0], [695.0, 253.38], [695.0, 243.26], [695.0, 233.61], [695.0, 230.12], [695.0, 230.0], [695.0, 229.88], [695.0, 224.38], [695.0, 215.53], [695.0, 215.12], [695.0, 215.0], [675.27, 230.0], [663.48, 230.0], [649.82, 230.0], [635.1, 230.0], [619.16, 230.0], [601.81, 230.0], [582.84, 230.0], [572.28, 230.0], [572.0, 230.0], [533.6, 250.13], [531.32, 245.73], [526.47, 235.98], [521.88, 226.1], [519.68, 221.13], [695.0, 145.0], [695.0, 144.91], [695.0, 141.86], [695.0, 135.52], [695.0, 135.08], [695.0, 135.0], [695.0, 134.92], [695.0, 129.31], [695.0, 123.22], [695.0, 117.23], [695.0, 113.76], [695.0, 113.68], [695.0, 113.6], [695.0, 111.33], [695.0, 105.62], [695.0, 105.55], [695.0, 105.52], [695.0, 105.47], [695.0, 99.78], [695.0, 98.72], [695.0, 98.65], [695.0, 98.57], [695.0, 94.1], [695.0, 88.48], [695.0, 82.91], [695.0, 77.37], [695.0, 71.87], [695.0, 66.4], [695.0, 60.94], [695.0, 55.49], [695.0, 50.04], [695.0, 47.46], [695.0, 47.39], [695.0, 47.31], [695.0, 44.58], [695.0, 42.07], [695.0, 42.0], [696.28, 42.0], [735.69, 42.0], [781.29, 42.0], [807.65, 42.0], [824.84, 42.0], [836.94, 42.0]], "zones": ["storage_room_workout"]}], "compiled_room_rules": {"Basement Play Area": {"can_be_bounded": false, "connected_rooms": ["Basement Theater", "Family Room", "Storage Room"], "max_camera_coverage_pct": 65.0, "recommended_inactivity_timeout": 180, "recommended_mode": "open", "room_name": "Basement Play Area", "spillover_entities_to_downgrade": ["binary_sensor.basement_play_area_person_occupancy", "binary_sensor.basement_stairwell_person_occupancy"], "unsealed_exits": ["Family Room (stairs)", "Basement Theater (open passage)", "Storage Room (unmonitored door)", "Basement Bathroom (unmonitored door)"]}, "Basement Theater": {"can_be_bounded": false, "connected_rooms": ["Basement Play Area", "Family Room"], "max_camera_coverage_pct": 97.0, "recommended_inactivity_timeout": 240, "recommended_mode": "open", "room_name": "Basement Theater", "spillover_entities_to_downgrade": ["binary_sensor.basement_theater_person_occupancy", "binary_sensor.basement_stairwell_person_occupancy"], "unsealed_exits": ["Family Room (stairs)", "Basement Play Area (open passage)"]}, "Dining Room": {"can_be_bounded": false, "connected_rooms": ["Kitchen", "Living Room"], "max_camera_coverage_pct": 100.0, "recommended_inactivity_timeout": 180, "recommended_mode": "open", "room_name": "Dining Room", "spillover_entities_to_downgrade": [], "unsealed_exits": ["Living Room (open passage)", "Kitchen (open passage)"]}, "Family Room": {"can_be_bounded": false, "connected_rooms": ["Basement Play Area", "Basement Theater", "Front Entry", "Garage", "Kitchen"], "max_camera_coverage_pct": 100.0, "recommended_inactivity_timeout": 180, "recommended_mode": "open", "room_name": "Family Room", "spillover_entities_to_downgrade": ["binary_sensor.family_room_person_occupancy"], "unsealed_exits": ["Front Entry (open passage)", "Kitchen (open passage)", "Garage (unmonitored door)", "Basement Play Area (stairs)", "Basement Theater (stairs)"]}, "Front Entry": {"can_be_bounded": false, "connected_rooms": ["Family Room", "Guest Room", "Kitchen", "Laundry Room", "Living Room", "Margot's Room", "Master Bedroom", "Office", "Powder Bath", "Upstairs Bathroom"], "max_camera_coverage_pct": 27.0, "recommended_inactivity_timeout": 60, "recommended_mode": "open", "room_name": "Front Entry", "spillover_entities_to_downgrade": [], "unsealed_exits": ["Living Room (open passage)", "Kitchen (open passage)", "Family Room (open passage)", "Powder Bath (unmonitored door)", "Laundry Room (unmonitored door)", "Upstairs Hallway & Stairs (stairs)"]}, "Garage": {"can_be_bounded": false, "connected_rooms": ["Family Room", "Laundry Room"], "max_camera_coverage_pct": 90.0, "recommended_inactivity_timeout": 180, "recommended_mode": "open", "room_name": "Garage", "spillover_entities_to_downgrade": [], "unsealed_exits": ["Family Room (unmonitored door)", "Laundry Room (unmonitored door)"]}, "Guest Room": {"can_be_bounded": false, "connected_rooms": ["Front Entry", "Margot's Room", "Master Bedroom", "Office", "Upstairs Bathroom"], "max_camera_coverage_pct": 8.0, "recommended_inactivity_timeout": 300, "recommended_mode": "open", "room_name": "Guest Room", "spillover_entities_to_downgrade": [], "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)"]}, "Kitchen": {"can_be_bounded": false, "connected_rooms": ["Dining Room", "Family Room", "Front Entry"], "max_camera_coverage_pct": 100.0, "recommended_inactivity_timeout": 180, "recommended_mode": "open", "room_name": "Kitchen", "spillover_entities_to_downgrade": [], "unsealed_exits": ["Front Entry (open passage)", "Dining Room (open passage)", "Family Room (open passage)"]}, "Laundry Room": {"can_be_bounded": false, "connected_rooms": ["Front Entry", "Garage"], "max_camera_coverage_pct": 0.0, "recommended_inactivity_timeout": 180, "recommended_mode": "open", "room_name": "Laundry Room", "spillover_entities_to_downgrade": [], "unsealed_exits": ["Front Entry (unmonitored door)", "Garage (unmonitored door)"]}, "Living Room": {"can_be_bounded": false, "connected_rooms": ["Dining Room", "Front Entry"], "max_camera_coverage_pct": 91.0, "recommended_inactivity_timeout": 180, "recommended_mode": "open", "room_name": "Living Room", "spillover_entities_to_downgrade": ["binary_sensor.living_room_person_occupancy"], "unsealed_exits": ["Front Entry (open passage)", "Dining Room (open passage)"]}, "Margot's Room": {"can_be_bounded": false, "connected_rooms": ["Front Entry", "Guest Room", "Master Bedroom", "Office", "Upstairs Bathroom"], "max_camera_coverage_pct": 88.0, "recommended_inactivity_timeout": 300, "recommended_mode": "open", "room_name": "Margot's Room", "spillover_entities_to_downgrade": ["binary_sensor.nursery_person_occupancy"], "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)"]}, "Master Bathroom": {"can_be_bounded": false, "connected_rooms": ["Master Bedroom"], "max_camera_coverage_pct": 46.0, "recommended_inactivity_timeout": 600, "recommended_mode": "open", "room_name": "Master Bathroom", "spillover_entities_to_downgrade": [], "unsealed_exits": ["Master Bedroom (unmonitored door)"]}, "Master Bedroom": {"can_be_bounded": false, "connected_rooms": ["Front Entry", "Guest Room", "Margot's Room", "Master Bathroom", "Master W.I.C", "Office", "Upstairs Bathroom"], "max_camera_coverage_pct": 100.0, "recommended_inactivity_timeout": 300, "recommended_mode": "open", "room_name": "Master Bedroom", "spillover_entities_to_downgrade": ["binary_sensor.master_bedroom_person_occupancy", "binary_sensor.master_bedroom_entryway_person_occupancy"], "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)", "Master W.I.C (unmonitored door)", "Master Bathroom (unmonitored door)"]}, "Master W.I.C": {"can_be_bounded": false, "connected_rooms": ["Master Bedroom"], "max_camera_coverage_pct": 0.0, "recommended_inactivity_timeout": 300, "recommended_mode": "open", "room_name": "Master W.I.C", "spillover_entities_to_downgrade": [], "unsealed_exits": ["Master Bedroom (unmonitored door)"]}, "Office": {"can_be_bounded": false, "connected_rooms": ["Front Entry", "Guest Room", "Margot's Room", "Master Bedroom", "Upstairs Bathroom"], "max_camera_coverage_pct": 99.0, "recommended_inactivity_timeout": 240, "recommended_mode": "open", "room_name": "Office", "spillover_entities_to_downgrade": ["binary_sensor.office_person_occupancy", "binary_sensor.office_entryway_person_occupancy"], "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)"]}, "Powder Bath": {"can_be_bounded": false, "connected_rooms": ["Front Entry"], "max_camera_coverage_pct": 17.0, "recommended_inactivity_timeout": 300, "recommended_mode": "open", "room_name": "Powder Bath", "spillover_entities_to_downgrade": [], "unsealed_exits": ["Front Entry (unmonitored door)"]}, "Storage Room": {"can_be_bounded": false, "connected_rooms": ["Basement Play Area"], "max_camera_coverage_pct": 100.0, "recommended_inactivity_timeout": 180, "recommended_mode": "open", "room_name": "Storage Room", "spillover_entities_to_downgrade": [], "unsealed_exits": ["Basement Play Area (unmonitored door)"]}, "Upstairs Bathroom": {"can_be_bounded": false, "connected_rooms": ["Front Entry", "Guest Room", "Margot's Room", "Master Bedroom", "Office"], "max_camera_coverage_pct": 0.0, "recommended_inactivity_timeout": 600, "recommended_mode": "open", "room_name": "Upstairs Bathroom", "spillover_entities_to_downgrade": [], "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)"]}}, "connected_rooms_map": {"Basement Play Area": ["Basement Theater", "Family Room", "Storage Room"], "Basement Theater": ["Basement Play Area", "Family Room"], "Dining Room": ["Kitchen", "Living Room"], "Family Room": ["Basement Play Area", "Basement Theater", "Front Entry", "Garage", "Kitchen"], "Front Entry": ["Family Room", "Guest Room", "Kitchen", "Laundry Room", "Living Room", "Margot's Room", "Master Bedroom", "Office", "Powder Bath", "Upstairs Bathroom"], "Garage": ["Family Room", "Laundry Room"], "Guest Room": ["Front Entry", "Margot's Room", "Master Bedroom", "Office", "Upstairs Bathroom"], "Kitchen": ["Dining Room", "Family Room", "Front Entry"], "Laundry Room": ["Front Entry", "Garage"], "Living Room": ["Dining Room", "Front Entry"], "Margot's Room": ["Front Entry", "Guest Room", "Master Bedroom", "Office", "Upstairs Bathroom"], "Master Bathroom": ["Master Bedroom"], "Master Bedroom": ["Front Entry", "Guest Room", "Margot's Room", "Master Bathroom", "Master W.I.C", "Office", "Upstairs Bathroom"], "Master W.I.C": ["Master Bedroom"], "Office": ["Front Entry", "Guest Room", "Margot's Room", "Master Bedroom", "Upstairs Bathroom"], "Powder Bath": ["Front Entry"], "Storage Room": ["Basement Play Area"], "Upstairs Bathroom": ["Front Entry", "Guest Room", "Margot's Room", "Master Bedroom", "Office"]}, "device_model_presets": {"apollo_msr_2": {"category": "pir_motion", "cooldown_sec": 5, "default_range_px": 300, "description": "24GHz mmWave radar presence sensor.", "device_type": "pir_motion", "fov_deg": 110, "id": "apollo_msr_2", "label": "Apollo MSR-2 / LD2410 mmWave (110\u00b0)", "manufacturer": "Apollo Automation", "model": "MSR-2 (HLK-LD2410B)", "name": "Apollo MSR-2 / LD2410 mmWave (110\u00b0)", "range_ft": 19.0, "range_m": 5.8}, "aqara_fp2_mmwave": {"category": "pir_motion", "cooldown_sec": 5, "default_range_px": 340, "description": "Wide 120\u00b0 multi-zone 60GHz mmWave radar presence sensor.", "device_type": "pir_motion", "fov_deg": 120, "id": "aqara_fp2_mmwave", "label": "Aqara FP2 60GHz mmWave Radar (120\u00b0)", "manufacturer": "Aqara", "model": "PS-S02D (FP2)", "name": "Aqara FP2 60GHz mmWave Radar (120\u00b0)", "range_ft": 21.5, "range_m": 6.5}, "ecobee_smart_sensor": {"category": "pir_motion", "cooldown_sec": 1800, "default_range_px": 230, "description": "110\u00b0 horizontal thermal PIR occupancy/motion sensor (15 ft / 4.5 m range).", "device_type": "pir_motion", "fov_deg": 110, "id": "ecobee_smart_sensor", "label": "Ecobee SmartSensor (110\u00b0 Thermal PIR)", "manufacturer": "ecobee", "model": "SmartSensor / Room Sensor", "name": "Ecobee SmartSensor (110\u00b0 Thermal PIR)", "range_ft": 15.0, "range_m": 4.5}, "google_home_speaker_ble": {"category": "ble_proxy", "description": "Indoor smart speaker Bluetooth Low Energy RSSI anchor.", "device_type": "ble_proxy", "id": "google_home_speaker_ble", "label": "Google Home / Nest Speaker BLE Proxy", "name": "Google Home / Nest Speaker BLE Proxy", "radius_px": 210}, "ikea_vallhorn_pir": {"category": "pir_motion", "cooldown_sec": 60, "default_range_px": 260, "description": "Zigbee 3.0 dual-lobe Fresnel PIR: 120\u00b0 wide-angle peripheral zone to 5m (16.4 ft / 260px) plus 60\u00b0 center beam reaching 10m (32.8 ft / 520px).", "device_type": "pir_motion", "fov_deg": 120, "id": "ikea_vallhorn_pir", "inner_fov_deg": 60, "inner_range_ft": 32.8, "inner_range_m": 10.0, "inner_range_px": 520, "label": "IKEA VALLHORN Wireless Motion Sensor (120\u00b0/5m + 60\u00b0/10m)", "manufacturer": "IKEA of Sweden", "model": "VALLHORN E2134 (405.043.48)", "name": "IKEA VALLHORN Wireless Motion Sensor (120\u00b0/5m + 60\u00b0/10m Dual-Lobe PIR)", "range_ft": 16.4, "range_m": 5.0}, "ratgdo_pir": {"category": "pir_motion", "cooldown_sec": 60, "default_range_px": 175, "description": "Garage door wall control panel motion sensor.", "device_type": "pir_motion", "fov_deg": 100, "id": "ratgdo_pir", "label": "ratgdo v2.5i Garage Opener PIR (100\u00b0)", "manufacturer": "ratgdo", "model": "v2.5i Security+ Wall Panel", "name": "ratgdo v2.5i Garage Opener PIR (100\u00b0)", "range_ft": 11.0, "range_m": 3.4}, "reolink_rlc_810a": {"category": "camera", "default_range_px": 500, "description": "4K PoE bullet camera with 87\u00b0 horizontal field of view.", "device_type": "camera", "fov_deg": 87, "horizontal_fov_deg": 87, "id": "reolink_rlc_810a", "label": "Reolink RLC-810A / PoE Bullet (87\u00b0 FOV)", "mount_pitch_deg": 15, "name": "Reolink RLC-810A / PoE Bullet (87\u00b0 FOV)", "vertical_fov_deg": 47}, "ring_alarm_pir_gen2": {"category": "pir_motion", "cooldown_sec": 60, "default_range_px": 260, "description": "90\u00b0 corner/wall Z-Wave PIR motion detector.", "device_type": "pir_motion", "fov_deg": 90, "id": "ring_alarm_pir_gen2", "label": "Ring Alarm Motion Detector Gen 2 (90\u00b0 PIR)", "manufacturer": "Ring", "model": "4SP1SZ (Gen 2 Z-Wave)", "name": "Ring Alarm Motion Detector Gen 2 (90\u00b0 PIR)", "range_ft": 16.5, "range_m": 5.0}, "ring_contact_sensor": {"actuation_gap_mm": 25, "category": "door_contact", "description": "Z-Wave perimeter door and window magnetic reed contact sensor.", "device_type": "door_contact", "id": "ring_contact_sensor", "label": "Ring Alarm Contact Sensor Gen 2 (Z-Wave)", "manufacturer": "Ring", "model": "5AT2S2 (Gen 2 Z-Wave)", "name": "Ring Alarm Contact Sensor Gen 2 (Z-Wave Reed)", "response_ms": 200}, "ring_keypad_pir": {"category": "pir_motion", "cooldown_sec": 30, "default_range_px": 165, "description": "Short-range proximity PIR built into wall keypad.", "device_type": "pir_motion", "fov_deg": 100, "id": "ring_keypad_pir", "label": "Ring Alarm Keypad Proximity PIR (100\u00b0)", "manufacturer": "Ring", "model": "4AK1SZ Keypad", "name": "Ring Alarm Keypad Proximity PIR (100\u00b0)", "range_ft": 10.5, "range_m": 3.2}, "tapo_c110_corner": {"category": "camera", "default_range_px": 560, "description": "Standard 110\u00b0 wide-angle corner or upper-wall mount covering both adjacent walls.", "device_type": "camera", "fov_deg": 110, "horizontal_fov_deg": 110, "id": "tapo_c110_corner", "label": "TP-Link Tapo C110 (Corner / Wall Mount)", "mount_pitch_deg": 15, "name": "TP-Link Tapo C110 (Corner / Wall Mount)", "vertical_fov_deg": 62}, "tapo_c110_overhead": {"category": "camera", "default_range_px": 250, "description": "Same Tapo C110 110\u00b0 sensor pitched steeply down (~62\u00b0) on a flat wall (e.g., Garage), widening the near-wall 2D floor footprint to 164\u00b0.", "device_type": "camera", "fov_deg": 164, "horizontal_fov_deg": 110, "id": "tapo_c110_overhead", "label": "TP-Link Tapo C110 (High Steep Downward Pitch)", "mount_pitch_deg": 62, "name": "TP-Link Tapo C110 (High Steep Downward Pitch)", "vertical_fov_deg": 62}, "unifi_g4_instant": {"category": "camera", "default_range_px": 450, "description": "Compact wide-angle Wi-Fi camera with 102\u00b0 horizontal field of view.", "device_type": "camera", "fov_deg": 102, "horizontal_fov_deg": 102, "id": "unifi_g4_instant", "label": "UniFi Protect G4/G5 Instant (102\u00b0 FOV)", "mount_pitch_deg": 15, "name": "UniFi Protect G4/G5 Instant (102\u00b0 FOV)", "vertical_fov_deg": 55}, "wyze_sense_contact": {"actuation_gap_mm": 20, "category": "door_contact", "description": "Ultra-compact 915MHz magnetic door/window reed contact sensor (<=20mm actuation gap) via WyzeSense2MQTT bridge.", "device_type": "door_contact", "id": "wyze_sense_contact", "label": "Wyze Sense Contact Sensor v1 (915MHz Reed)", "manufacturer": "Wyze", "model": "WYZESENSE-CONTACT (WYZEC1)", "name": "Wyze Sense Contact Sensor v1 (915MHz Magnetic Reed)", "response_ms": 150}, "wyze_sense_pir": {"category": "pir_motion", "cooldown_sec": 45, "default_range_px": 405, "description": "915MHz ultra-compact 120\u00b0 wide-angle PIR motion sensor with downward-slanted Fresnel lens and 25-26 ft (7.8m / 405px) range.", "device_type": "pir_motion", "fov_deg": 120, "id": "wyze_sense_pir", "label": "Wyze Sense Motion Sensor v1 (120\u00b0 PIR, 26 ft)", "manufacturer": "Wyze", "model": "WYZESENSE-PIR (WYZEMS1)", "mount_pitch_deg": 12, "name": "Wyze Sense Motion Sensor v1 (120\u00b0 Wide PIR, 26 ft / 7.8m)", "range_ft": 25.5, "range_m": 7.8}}, "floorplan": {"ble_proxies": [{"entity_id": "sensor.living_room_speaker_bluetooth_proxy_status", "floor": "main", "host_room": "Living Room", "id": "living_room_speaker", "model_preset": "google_home_speaker_ble", "name": "Living Room Speaker BLE Proxy", "radius_px": 210, "x": 210, "y": 410}, {"entity_id": "sensor.family_room_speaker_bluetooth_proxy_status", "floor": "main", "host_room": "Family Room", "id": "family_room_speaker", "model_preset": "google_home_speaker_ble", "name": "Family Room Speaker BLE Proxy", "radius_px": 210, "x": 680, "y": 200}, {"entity_id": "sensor.master_bedroom_speaker_bluetooth_proxy_status", "floor": "upstairs", "host_room": "Master Bedroom", "id": "master_bedroom_speaker", "model_preset": "google_home_speaker_ble", "name": "Master Bedroom Speaker BLE Proxy", "radius_px": 210, "x": 230, "y": 180}, {"entity_id": "sensor.nursery_speaker_bluetooth_proxy_status", "floor": "upstairs", "host_room": "Margot's Room", "id": "nursery_speaker", "model_preset": "google_home_speaker_ble", "name": "Nursery Speaker BLE Proxy", "radius_px": 190, "x": 465, "y": 140}, {"entity_id": "sensor.office_speaker_bluetooth_proxy_status", "floor": "upstairs", "host_room": "Office", "id": "office_speaker", "model_preset": "google_home_speaker_ble", "name": "Office Speaker BLE Proxy", "radius_px": 200, "x": 765, "y": 400}, {"entity_id": "sensor.basement_speaker_bluetooth_proxy_status", "floor": "basement", "host_room": "Basement Play Area", "id": "basement_speaker", "model_preset": "google_home_speaker_ble", "name": "Basement Speaker BLE Proxy", "radius_px": 260, "x": 450, "y": 295}], "cameras": [{"floor": "main", "fov_deg": 110, "heading_deg": 30, "host_room": "Living Room", "id": "camera.living_room", "model_preset": "tapo_c110_corner", "name": "Living Room Camera", "notes": "Mounted on West wall below Dining opening; sees North cube shelf wall, Foyer archway/stairs, and South bay windows.", "range_px": 520, "spills_into": ["Front Entry"], "sub_zones": [{"entity_id": "binary_sensor.living_room_couch_person_occupancy", "height": 100, "id": "living_room_couch", "label": "Living Room Couch", "room": "Living Room", "width": 125, "x": 105, "y": 355}, {"entity_id": "binary_sensor.living_room_floor_person_occupancy", "height": 100, "id": "living_room_floor", "label": "Living Room Floor", "room": "Living Room", "width": 95, "x": 235, "y": 365}, {"entity_id": "binary_sensor.living_room_bay_windows_person_occupancy", "height": 38, "id": "living_room_bay_windows", "label": "Bay Windows", "room": "Living Room", "width": 165, "x": 115, "y": 468}, {"entity_id": "binary_sensor.living_room_entry_person_occupancy", "height": 80, "id": "living_room_entry", "label": "Front Entry Archway", "room": "Front Entry", "width": 80, "x": 350, "y": 415}], "x": 76, "y": 335, "zones": ["living_room_couch", "living_room_floor", "living_room_bay_windows", "living_room_entry"]}, {"floor": "main", "fov_deg": 110, "heading_deg": 128, "host_room": "Dining Room", "id": "camera.dining_room", "model_preset": "tapo_c110_corner", "name": "Dining Room Camera", "notes": "Upper-right corner of Dining Room looking SW across dining table and through wide opening into Living Room.", "range_px": 320, "spills_into": ["Living Room"], "sub_zones": [{"entity_id": "binary_sensor.dining_room_table_person_occupancy", "height": 110, "id": "dining_room_table", "label": "Dining Table", "room": "Dining Room", "width": 110, "x": 105, "y": 145}, {"entity_id": "binary_sensor.rileys_food_person_occupancy", "height": 42, "id": "rileys_food", "label": "Riley's Food Corner", "room": "Dining Room", "width": 65, "x": 170, "y": 96}], "x": 242, "y": 96, "zones": ["dining_room_table", "rileys_food"]}, {"floor": "main", "fov_deg": 110, "heading_deg": 142, "host_room": "Family Room", "id": "camera.family_room", "model_preset": "tapo_c110_corner", "name": "Family Room Camera", "notes": "Mounted on North wall to the right of the right window looking left across Family Room, green South couch wall, and Kitchen.", "range_px": 620, "spills_into": ["Kitchen", "Front Entry"], "sub_zones": [{"entity_id": "binary_sensor.family_room_couch_person_occupancy", "height": 88, "id": "family_room_couch", "label": "Family Room Couch", "room": "Family Room", "width": 150, "x": 635, "y": 195}, {"entity_id": "binary_sensor.family_room_recliner_person_occupancy", "height": 75, "id": "family_room_recliner", "label": "Family Room Recliner", "room": "Family Room", "width": 80, "x": 545, "y": 115}, {"entity_id": "binary_sensor.family_room_floor_person_occupancy", "height": 88, "id": "family_room_floor", "label": "Family Room Floor", "room": "Family Room", "width": 85, "x": 545, "y": 195}, {"entity_id": "binary_sensor.kitchen_island_person_occupancy", "height": 95, "id": "kitchen_island", "label": "Kitchen Island", "room": "Kitchen", "width": 120, "x": 335, "y": 155}], "x": 818, "y": 96, "zones": ["family_room_couch", "family_room_recliner", "family_room_floor", "kitchen_island"]}, {"floor": "main", "fov_deg": 164, "heading_deg": 90, "host_room": "Garage", "id": "camera.garage", "model_preset": "tapo_c110_overhead", "name": "Garage Camera", "notes": "Mounted high on North interior wall pointing steeply down, covering nearly the full North wall and parking bay.", "range_px": 250, "spills_into": [], "sub_zones": [{"entity_id": "binary_sensor.garage_parking_person_occupancy", "height": 108, "id": "garage_parking", "label": "Garage Parking Bay", "room": "Garage", "width": 170, "x": 595, "y": 438}], "x": 680, "y": 423, "zones": ["garage_parking"]}, {"floor": "upstairs", "fov_deg": 110, "heading_deg": 313, "host_room": "Master Bedroom", "id": "camera.master_bedroom", "model_preset": "tapo_c110_corner", "name": "Master Bedroom Camera", "notes": "Lower-left corner of Master Bedroom looking NE; hugs West headboard wall, clips W.I.C, and sees into Master Bath & Hallway doors.", "range_px": 620, "spills_into": ["Upstairs Hallway & Stairs", "Master Bathroom"], "sub_zones": [{"entity_id": "binary_sensor.master_bed_person_occupancy", "height": 155, "id": "master_bed", "label": "Master Bed", "room": "Master Bedroom", "width": 135, "x": 134, "y": 250}, {"entity_id": "binary_sensor.master_open_area_person_occupancy", "height": 165, "id": "master_open_area", "label": "Master Open Floor", "room": "Master Bedroom", "width": 145, "x": 140, "y": 55}, {"entity_id": "binary_sensor.master_bedroom_walkway_person_occupancy", "height": 220, "id": "master_bedroom_walkway", "label": "Master Walkway", "room": "Master Bedroom", "width": 68, "x": 278, "y": 225}, {"entity_id": "binary_sensor.master_bedroom_entryway_person_occupancy", "height": 56, "id": "master_bedroom_entryway", "label": "Master Hallway Entry", "room": "Master Bedroom", "width": 48, "x": 305, "y": 256}, {"entity_id": "binary_sensor.master_bathroom_person_occupancy", "height": 56, "id": "master_bathroom", "label": "Master Bath Doorway", "room": "Master Bathroom", "width": 55, "x": 425, "y": 486}], "x": 134, "y": 536, "zones": ["master_bed", "master_open_area", "master_bedroom_walkway", "master_bedroom_entryway", "master_bathroom"]}, {"floor": "upstairs", "fov_deg": 110, "heading_deg": 311, "host_room": "Margot's Room", "id": "camera.nursery", "model_preset": "tapo_c110_corner", "name": "Nursery Camera", "notes": "Lower-left corner of Nursery looking NE; sees West wall posters, bed, dresser, open East reach-in closet, and hallway door.", "range_px": 340, "spills_into": [], "sub_zones": [{"entity_id": "binary_sensor.nursery_bed_person_occupancy", "height": 115, "id": "nursery_bed", "label": "Nursery Bed", "room": "Margot's Room", "width": 125, "x": 370, "y": 95}], "x": 358, "y": 246, "zones": ["nursery_bed"]}, {"floor": "upstairs", "fov_deg": 110, "heading_deg": 313, "host_room": "Office", "id": "camera.office", "model_preset": "tapo_c110_corner", "name": "Office Camera", "notes": "Lower-left corner of Office looking NE; sees West wall and Office door, open North closet, Steve's desk, and sim rig.", "range_px": 380, "spills_into": ["Upstairs Hallway & Stairs"], "sub_zones": [{"entity_id": "binary_sensor.steves_desk_person_occupancy", "height": 95, "id": "steves_desk", "label": "Steve's Desk", "room": "Office", "width": 105, "x": 745, "y": 360}, {"entity_id": "binary_sensor.sim_rig_person_occupancy", "height": 95, "id": "sim_rig", "label": "Sim Rig", "room": "Office", "width": 65, "x": 680, "y": 425}, {"entity_id": "binary_sensor.office_floor_person_occupancy", "height": 95, "id": "office_floor", "label": "Office Center Floor", "room": "Office", "width": 95, "x": 685, "y": 310}, {"entity_id": "binary_sensor.office_entryway_person_occupancy", "height": 55, "id": "office_entryway", "label": "Office Doorway", "room": "Office", "width": 45, "x": 665, "y": 258}], "x": 678, "y": 538, "zones": ["steves_desk", "sim_rig", "office_floor", "office_entryway"]}, {"floor": "basement", "fov_deg": 110, "heading_deg": 42, "host_room": "Basement Theater", "id": "camera.basement_theater", "model_preset": "tapo_c110_corner", "name": "Basement Theater Camera", "notes": "Upper-left corner of Basement Theater looking SE; sees North wall ballpit leading to Wet Bar, sectional couch, South closets, and East wall.", "range_px": 700, "spills_into": ["Basement Play Area"], "sub_zones": [{"entity_id": "binary_sensor.basement_theater_couch_person_occupancy", "height": 165, "id": "basement_theater_couch", "label": "Theater Couch", "room": "Basement Theater", "width": 165, "x": 150, "y": 235}, {"entity_id": "binary_sensor.basement_theater_playpen_person_occupancy", "height": 75, "id": "basement_theater_playpen", "label": "Ballpit / Playpen", "room": "Basement Theater", "width": 165, "x": 160, "y": 50}, {"entity_id": "binary_sensor.basement_theater_floor_person_occupancy", "height": 90, "id": "basement_theater_floor", "label": "Theater Floor", "room": "Basement Theater", "width": 165, "x": 160, "y": 135}, {"entity_id": "binary_sensor.basement_bar_person_occupancy", "height": 140, "id": "basement_bar", "label": "Basement Wet Bar", "room": "Basement Play Area", "width": 150, "x": 365, "y": 55}, {"entity_id": "binary_sensor.basement_play_area_far_person_occupancy", "height": 175, "id": "basement_play_area_far", "label": "Play Area East", "room": "Basement Play Area", "width": 190, "x": 370, "y": 230}, {"entity_id": "binary_sensor.basement_stairwell_person_occupancy", "height": 105, "id": "basement_stairwell", "label": "Basement Stairwell", "room": "Basement Play Area", "width": 75, "x": 495, "y": 415}], "x": 104, "y": 64, "zones": ["basement_theater_couch", "basement_theater_playpen", "basement_theater_floor", "basement_bar", "basement_play_area_far", "basement_stairwell"]}, {"floor": "basement", "fov_deg": 110, "heading_deg": 121, "host_room": "Basement Play Area", "id": "camera.basement_play_area", "model_preset": "tapo_c110_corner", "name": "Basement Play Area Camera", "notes": "Behind Wet Bar looking SW across bar counter, East basement wall (not into stairs), play mats, and Theater.", "range_px": 680, "spills_into": ["Basement Theater"], "sub_zones": [{"entity_id": "binary_sensor.basement_play_floor_person_occupancy", "height": 220, "id": "basement_play_floor", "label": "Play Area Main Floor", "room": "Basement Play Area", "width": 195, "x": 365, "y": 225}, {"entity_id": "binary_sensor.basement_counter_person_occupancy", "height": 140, "id": "basement_counter", "label": "Wet Bar Counter", "room": "Basement Play Area", "width": 150, "x": 365, "y": 60}, {"entity_id": "binary_sensor.theater_rear_view_person_occupancy", "height": 175, "id": "theater_rear_view", "label": "Theater Rear View", "room": "Basement Theater", "width": 185, "x": 135, "y": 230}], "x": 505, "y": 68, "zones": ["basement_play_floor", "basement_counter", "theater_rear_view"]}, {"floor": "basement", "fov_deg": 110, "heading_deg": 135, "host_room": "Storage Room", "id": "camera.storage_room", "model_preset": "tapo_c110_corner", "name": "Storage Room Camera", "notes": "Upper-right corner of Storage Room looking SW across green gym floor toward South storage shelves and West door to hallway.", "range_px": 420, "spills_into": [], "sub_zones": [{"entity_id": "binary_sensor.storage_room_workout_person_occupancy", "height": 210, "id": "storage_room_workout", "label": "Gym / Workout Mat", "room": "Storage Room", "width": 165, "x": 715, "y": 110}], "x": 905, "y": 54, "zones": ["storage_room_workout"]}], "canvas": {"height": 580, "width": 1000}, "connections": [{"from_room": "Front Entry", "id": "conn_entry_lr", "label": "Open Archway (Entry <-> Living Room)", "to_room": "Living Room", "type": "open_passage"}, {"from_room": "Front Entry", "id": "conn_entry_kitchen", "label": "Pathway (Entry <-> Kitchen)", "to_room": "Kitchen", "type": "open_passage"}, {"from_room": "Front Entry", "id": "conn_entry_fr", "label": "Pathway (Entry <-> Family/Laundry/Basement)", "to_room": "Family Room", "type": "open_passage"}, {"from_room": "Front Entry", "id": "conn_entry_powder", "label": "Powder Bath Doorway", "to_room": "Powder Bath", "type": "unmonitored_door"}, {"from_room": "Front Entry", "id": "conn_entry_laundry", "label": "Laundry Room Doorway", "to_room": "Laundry Room", "type": "unmonitored_door"}, {"from_room": "Living Room", "id": "conn_lr_dr", "label": "Open Passage (Living <-> Dining)", "to_room": "Dining Room", "type": "open_passage"}, {"from_room": "Dining Room", "id": "conn_dr_kitchen", "label": "Open Passage (Dining <-> Kitchen)", "to_room": "Kitchen", "type": "open_passage"}, {"from_room": "Kitchen", "id": "conn_kitchen_fr", "label": "Open Concept (Kitchen <-> Family Room)", "to_room": "Family Room", "type": "open_passage"}, {"entity_id": "binary_sensor.utility_room_door", "from_room": "Family Room", "id": "conn_fr_garage", "label": "Laundry / Garage Pathway", "to_room": "Garage", "type": "unmonitored_door"}, {"entity_id": "binary_sensor.utility_room_door", "from_room": "Laundry Room", "id": "conn_laundry_garage", "label": "Laundry -> Garage Door", "to_room": "Garage", "type": "unmonitored_door"}, {"from_room": "Front Entry", "id": "conn_entry_upstairs", "label": "Main Stairs to Upstairs", "to_room": "Upstairs Hallway & Stairs", "type": "stairs"}, {"from_room": "Family Room", "id": "conn_fr_basement_play", "label": "Basement Stairs", "to_room": "Basement Play Area", "type": "stairs"}, {"from_room": "Family Room", "id": "conn_fr_basement_theater", "label": "Basement Stairs (Partial Sightline)", "to_room": "Basement Theater", "type": "stairs"}, {"from_room": "Upstairs Hallway & Stairs", "id": "conn_hall_office", "label": "Office Doorway (Next to Stairs)", "to_room": "Office", "type": "unmonitored_door"}, {"from_room": "Upstairs Hallway & Stairs", "id": "conn_hall_guest", "label": "Guest Room Doorway (No Sensor)", "to_room": "Guest Room", "type": "unmonitored_door"}, {"from_room": "Upstairs Hallway & Stairs", "id": "conn_hall_nursery", "label": "Nursery Doorway (Seen Partially by Cam)", "to_room": "Margot's Room", "type": "unmonitored_door"}, {"from_room": "Upstairs Hallway & Stairs", "id": "conn_hall_master", "label": "Master Bedroom Entryway", "to_room": "Master Bedroom", "type": "unmonitored_door"}, {"from_room": "Master Bedroom", "id": "conn_master_wic", "label": "Master Walk-In Closet Door", "to_room": "Master W.I.C", "type": "unmonitored_door"}, {"from_room": "Master Bedroom", "id": "conn_master_bath", "label": "Master Bath / Shower Stall Entry", "to_room": "Master Bathroom", "type": "unmonitored_door"}, {"from_room": "Upstairs Hallway & Stairs", "id": "conn_hall_ubath", "label": "Shared Bathroom (Double Vanity & Tub)", "to_room": "Upstairs Bathroom", "type": "unmonitored_door"}, {"from_room": "Basement Play Area", "id": "conn_play_theater", "label": "Open Basement Divide (Play <-> Theater)", "to_room": "Basement Theater", "type": "open_passage"}, {"from_room": "Basement Play Area", "id": "conn_play_storage", "label": "Storage Room Door (Off East Basement Hall)", "to_room": "Storage Room", "type": "unmonitored_door"}, {"from_room": "Basement Play Area", "id": "conn_play_bbath", "label": "Basement Bath Door (Off East Basement Hall)", "to_room": "Basement Bathroom", "type": "unmonitored_door"}], "floor_wall_segments": {"basement": [[[93, 42], [695, 42]], [[93, 42], [93, 532]], [[93, 478], [130, 478]], [[220, 478], [265, 478]], [[355, 478], [430, 478]], [[430, 478], [445, 495]], [[445, 495], [445, 532]], [[93, 532], [635, 532]], [[572, 230], [572, 532]], [[635, 410], [635, 532]], [[524, 42], [524, 135]], [[524, 135], [575, 135]], [[620, 135], [695, 135]], [[572, 230], [695, 230]], [[695, 42], [695, 145]], [[695, 215], [695, 360]], [[695, 42], [915, 42]], [[915, 42], [915, 360]], [[695, 360], [915, 360]]], "main": [[[68, 87], [832, 87]], [[68, 87], [68, 508]], [[68, 508], [534, 508]], [[832, 87], [832, 290]], [[251, 87], [251, 190]], [[251, 250], [251, 290]], [[68, 290], [96, 290]], [[212, 290], [251, 290]], [[251, 290], [410, 290]], [[341, 290], [341, 418]], [[410, 290], [410, 345]], [[341, 382], [410, 382]], [[410, 382], [410, 418]], [[341, 502], [341, 508]], [[534, 290], [832, 290]], [[534, 290], [534, 300]], [[534, 348], [534, 508]], [[708, 290], [708, 421]], [[534, 421], [832, 421]], [[534, 421], [534, 555]], [[832, 421], [832, 555]], [[534, 555], [832, 555]]], "upstairs": [[[126, 32], [874, 32]], [[874, 32], [874, 548]], [[126, 548], [874, 548]], [[126, 32], [126, 548]], [[353, 32], [353, 256]], [[353, 312], [353, 484]], [[563, 32], [563, 143]], [[563, 143], [610, 143]], [[610, 32], [610, 42]], [[610, 130], [610, 254]], [[563, 143], [563, 152]], [[563, 242], [563, 254]], [[353, 254], [508, 254]], [[508, 254], [508, 258]], [[508, 258], [558, 258]], [[558, 258], [558, 254]], [[558, 254], [612, 254]], [[662, 254], [874, 254]], [[353, 316], [368, 316]], [[446, 316], [508, 316]], [[553, 316], [610, 316]], [[353, 355], [462, 355]], [[462, 316], [462, 449]], [[353, 484], [398, 484]], [[398, 484], [440, 484]], [[440, 449], [560, 449]], [[560, 417], [610, 417]], [[560, 417], [560, 449]], [[610, 316], [610, 548]], [[440, 449], [440, 498]], [[440, 544], [440, 548]], [[671, 254], [671, 258]], [[671, 258], [665, 258]], [[665, 258], [665, 315]], [[665, 315], [671, 315]], [[671, 315], [671, 548]], [[735, 254], [735, 296]], [[735, 296], [750, 296]], [[858, 296], [874, 296]]]}, "floors": [{"id": "upstairs", "name": "Upstairs Level", "order": 0, "underlay_svg": {"height": 540, "url": "/presence_detection_designer_static/floor_upstairs.webp?v=4", "width": 772, "x": 114, "y": 20}}, {"id": "main", "name": "Main Floor", "order": 1, "underlay_svg": {"height": 520, "url": "/presence_detection_designer_static/floor_main.webp?v=4", "width": 784, "x": 60, "y": 30}}, {"id": "basement", "name": "Basement Level", "order": 2, "underlay_svg": {"height": 520, "url": "/presence_detection_designer_static/floor_basement.webp?v=4", "width": 620, "x": 80, "y": 30}}], "rooms": [{"entryways": [{"id": "door_master_hallway", "offset": 224, "target_room": "Upstairs Hallway & Stairs", "type": "door", "wall": "right", "width": 56}, {"id": "door_master_bath", "offset": 452, "target_room": "Master Bathroom", "type": "door", "wall": "right", "width": 60}], "floor": "upstairs", "height": 516, "id": "master_bedroom", "name": "Master Bedroom", "notes": "West wing front-to-back with lower vestibule leading to Master W.I.C and Master Bathroom.", "room_type": "room", "svg_path": "M 126,32 L 353,32 L 353,484 L 440,484 L 440,548 L 126,548 Z", "width": 227, "x": 126, "y": 32}, {"entryways": [{"id": "door_wic_master", "offset": 45, "target_room": "Master Bedroom", "type": "door", "wall": "bottom", "width": 42}], "floor": "upstairs", "height": 129, "id": "master_wic", "name": "Master W.I.C", "notes": "Standalone Master Walk-In Closet (6'3\" x 7'0\") opening South into the Master Bedroom vestibule.", "room_type": "room", "width": 109, "x": 353, "y": 355}, {"entryways": [{"id": "door_ubath_hall", "offset": 46, "target_room": "Upstairs Hallway & Stairs", "type": "door", "wall": "top", "width": 45}], "floor": "upstairs", "height": 133, "id": "upstairs_bathroom", "name": "Upstairs Bathroom", "notes": "Upper shared bathroom (7'8\" x 4'11\") with tub & vanity opening North into Upstairs Hallway.", "room_type": "room", "svg_path": "M 462,316 L 610,316 L 610,417 L 560,417 L 560,449 L 462,449 Z", "width": 148, "x": 462, "y": 316}, {"entryways": [{"id": "door_mbath_master", "offset": 81, "target_room": "Master Bedroom", "type": "door", "wall": "left", "width": 46}], "floor": "upstairs", "height": 131, "id": "master_bathroom", "name": "Master Bathroom", "notes": "Lower en-suite Master Bathroom (6'5\" x 7'7\") with double vanity and walk-in shower stall.", "room_type": "room", "svg_path": "M 440,449 L 560,449 L 560,417 L 610,417 L 610,548 L 440,548 Z", "width": 170, "x": 440, "y": 417}, {"entryways": [{"id": "door_margot_hallway", "offset": 155, "target_room": "Upstairs Hallway & Stairs", "type": "door", "wall": "bottom", "width": 50}], "floor": "upstairs", "height": 222, "id": "margots_room", "name": "Margot's Room", "notes": "Top-center Nursery (10'6\" x 11'5\") including lower-right reach-in closet (Y=143..254).", "room_type": "room", "svg_path": "M 353,32 L 563,32 L 563,143 L 610,143 L 610,254 L 353,254 Z", "width": 257, "x": 353, "y": 32}, {"entryways": [{"id": "door_guest_hallway", "offset": 49, "target_room": "Upstairs Hallway & Stairs", "type": "door", "wall": "bottom", "width": 50}], "floor": "upstairs", "height": 222, "id": "guest_room", "name": "Guest Room", "notes": "Top-right Guest Room (13'6\" x 11'5\") including upper-left reach-in closet (Y=32..143).", "room_type": "room", "svg_path": "M 563,32 L 874,32 L 874,254 L 610,254 L 610,143 L 563,143 Z", "width": 311, "x": 563, "y": 32}, {"entryways": [{"id": "door_office_hallway", "offset": 4, "target_room": "Upstairs Hallway & Stairs", "type": "door", "wall": "left", "width": 57}], "floor": "upstairs", "height": 294, "id": "office", "name": "Office", "notes": "Bottom-right Office (10'3\" x 13'1\") including upper reach-in closet.", "room_type": "room", "width": 203, "x": 671, "y": 254}, {"entryways": [{"id": "door_hall_master", "offset": 2, "target_room": "Master Bedroom", "type": "door", "wall": "left", "width": 56}, {"id": "door_hall_margot", "offset": 155, "target_room": "Margot's Room", "type": "door", "wall": "top", "width": 50}, {"id": "door_hall_guest", "offset": 259, "target_room": "Guest Room", "type": "door", "wall": "top", "width": 50}, {"id": "door_hall_office", "offset": 4, "target_room": "Office", "type": "door", "wall": "right", "width": 57}], "floor": "upstairs", "height": 101, "id": "upstairs_hallway", "name": "Upstairs Hallway & Stairs", "notes": "Central upstairs hallway (16'3\" x 3'2\"), North-facing hallway linen closet, and stairwell.", "room_type": "transit", "svg_path": "M 353,254 L 671,254 L 671,548 L 610,548 L 610,316 L 462,316 L 462,355 L 353,355 Z", "width": 318, "x": 353, "y": 254}, {"entryways": [{"id": "arch_dr_kitchen", "offset": 103, "target_room": "Kitchen", "type": "open_passage", "wall": "right", "width": 60}, {"id": "arch_dr_lr", "offset": 28, "target_room": "Living Room", "type": "open_passage", "wall": "bottom", "width": 116}], "floor": "main", "height": 203, "id": "dining_room", "name": "Dining Room", "notes": "Northwest Dining Room (11'5\" x 13'0\") opening to Kitchen and Living Room.", "room_type": "room", "width": 183, "x": 68, "y": 87}, {"entryways": [{"id": "arch_lr_dr", "offset": 28, "target_room": "Dining Room", "type": "open_passage", "wall": "top", "width": 116}, {"id": "arch_lr_entry", "offset": 128, "target_room": "Front Entry", "type": "open_passage", "wall": "right", "width": 84}], "floor": "main", "height": 218, "id": "living_room", "name": "Living Room", "notes": "Southwest Living Room (17'5\" x 13'9\") with South bay windows and wide opening to Foyer.", "room_type": "room", "width": 273, "x": 68, "y": 290}, {"entryways": [{"id": "arch_kitchen_dr", "offset": 103, "target_room": "Dining Room", "type": "open_passage", "wall": "left", "width": 60}, {"id": "arch_kitchen_fr", "offset": 10, "target_room": "Family Room", "type": "open_passage", "wall": "right", "width": 185}, {"id": "path_kitchen_entry", "offset": 159, "target_room": "Front Entry", "type": "open_passage", "wall": "bottom", "width": 124}], "floor": "main", "height": 203, "id": "kitchen", "name": "Kitchen", "notes": "Central Kitchen (10'3\" x 13'0\") and Breakfast Nook (8'1\" x 13'0\") with island counter.", "room_type": "room", "width": 283, "x": 251, "y": 87}, {"entryways": [{"id": "door_powder_foyer", "offset": 55, "target_room": "Front Entry", "type": "door", "wall": "right", "width": 33}], "floor": "main", "height": 92, "id": "powder_bath", "name": "Powder Bath", "notes": "Main floor half-bath (4'3\" x 4'11\") off Foyer.", "room_type": "room", "width": 69, "x": 341, "y": 290}, {"entryways": [{"id": "arch_entry_lr", "offset": 128, "target_room": "Living Room", "type": "open_passage", "wall": "left", "width": 84}, {"id": "path_entry_kitchen", "offset": 69, "target_room": "Kitchen", "type": "open_passage", "wall": "top", "width": 124}, {"id": "door_front_entry", "offset": 85, "target_room": "Exterior", "type": "door", "wall": "bottom", "width": 50}], "floor": "main", "height": 218, "id": "front_entry", "name": "Front Entry", "notes": "Main Foyer (8'9\" x 13'6\"), coat closet, front door, and stairs to Upper Level.", "room_type": "room", "svg_path": "M 410,290 L 534,290 L 534,508 L 341,508 L 341,382 L 410,382 Z", "width": 193, "x": 341, "y": 290}, {"entryways": [{"id": "arch_fr_kitchen", "offset": 10, "target_room": "Kitchen", "type": "open_passage", "wall": "left", "width": 185}], "floor": "main", "height": 203, "id": "family_room", "name": "Family Room", "notes": "East Family Room (19'4\" x 12'9\") with North fireplace and solid green South wall.", "room_type": "room", "width": 298, "x": 534, "y": 87}, {"entryways": [{"id": "door_laundry_hall", "offset": 10, "target_room": "Front Entry", "type": "door", "wall": "left", "width": 48}, {"id": "door_fr_laundry", "offset": 85, "target_room": "Garage", "type": "door", "wall": "bottom", "width": 48}], "floor": "main", "height": 131, "id": "laundry_room", "name": "Laundry Room", "notes": "Main floor Laundry / Mudroom (11'3\" x 8'5\") with door on West wall to Hallway/Foyer and South door to Garage.", "room_type": "room", "width": 174, "x": 534, "y": 290}, {"entryways": [{"id": "door_garage_fr", "offset": 85, "target_room": "Laundry Room", "type": "door", "wall": "top", "width": 48}], "floor": "main", "height": 134, "id": "garage", "name": "Garage", "notes": "2-car Garage below Laundry Room.", "room_type": "room", "width": 298, "x": 534, "y": 421}, {"entryways": [{"id": "arch_theater_play", "offset": 20, "target_room": "Basement Play Area", "type": "open_passage", "wall": "right", "width": 430}], "floor": "basement", "height": 490, "id": "basement_theater", "name": "Basement Theater", "notes": "West side of Recreation Room with TV/fireplace wall, sectional couch, North wall ballpit, and South bi-fold closets.", "room_type": "room", "width": 267, "x": 93, "y": 42}, {"entryways": [{"id": "arch_play_theater", "offset": 20, "target_room": "Basement Theater", "type": "open_passage", "wall": "left", "width": 430}, {"id": "door_play_bbath", "offset": 215, "target_room": "Basement Bathroom", "type": "door", "wall": "top", "width": 45}, {"id": "door_play_storage", "offset": 103, "target_room": "Storage Room", "type": "door", "wall": "right", "width": 70}], "floor": "basement", "height": 490, "id": "basement_play_area", "name": "Basement Play Area", "notes": "East side of Recreation Room including Wet Bar (9'0\" x 8'5\"), Play Area mats, East hallway (7'0\" x 4'8\"), and stairs.", "room_type": "room", "svg_path": "M 360,42 L 524,42 L 524,135 L 695,135 L 695,230 L 572,230 L 572,410 L 635,410 L 635,532 L 360,532 Z", "width": 335, "x": 360, "y": 42}, {"entryways": [{"id": "door_bbath_play", "offset": 51, "target_room": "Basement Play Area", "type": "door", "wall": "bottom", "width": 45}], "floor": "basement", "height": 93, "id": "basement_bathroom", "name": "Basement Bathroom", "notes": "Basement Bathroom (5'11\" x 4'7\") to the right of Wet Bar opening South into basement hallway.", "room_type": "transit", "width": 171, "x": 524, "y": 42}, {"entryways": [{"id": "door_storage_play", "offset": 103, "target_room": "Basement Play Area", "type": "door", "wall": "left", "width": 70}], "floor": "basement", "height": 318, "id": "storage_room", "name": "Storage Room", "notes": "East Storage Room / Gym opening West into the basement hallway.", "room_type": "room", "width": 220, "x": 695, "y": 42}], "sensors": [{"entity_id": "binary_sensor.family_room_motion", "floor": "main", "fov_deg": 90, "heading_deg": 225, "host_room": "Family Room", "id": "binary_sensor.family_room_motion", "model_preset": "ring_alarm_pir_gen2", "name": "Family Room PIR (Ring)", "range_px": 260, "sensor_type": "pir_motion", "x": 820, "y": 278}, {"entity_id": "binary_sensor.family_room_motion_4", "floor": "main", "fov_deg": 110, "heading_deg": 165, "host_room": "Family Room", "id": "binary_sensor.family_room_motion_4", "model_preset": "ecobee_smart_sensor", "name": "Family/Kitchen PIR (Ecobee)", "range_px": 230, "sensor_type": "pir_motion", "x": 555, "y": 115}, {"entity_id": "binary_sensor.thermostat_motion", "floor": "main", "fov_deg": 110, "heading_deg": 180, "host_room": "Dining Room", "id": "binary_sensor.thermostat_motion", "model_preset": "ecobee_smart_sensor", "name": "Main Thermostat PIR", "range_px": 180, "sensor_type": "pir_motion", "x": 242, "y": 180}, {"entity_id": "binary_sensor.keypad_motion", "floor": "main", "fov_deg": 100, "heading_deg": 295, "host_room": "Front Entry", "id": "binary_sensor.keypad_motion", "model_preset": "ring_keypad_pir", "name": "Front Entry Keypad PIR", "range_px": 165, "sensor_type": "pir_motion", "x": 415, "y": 495}, {"entity_id": "binary_sensor.ratgdov25i_47a250_motion", "floor": "main", "fov_deg": 100, "heading_deg": 90, "host_room": "Garage", "id": "binary_sensor.ratgdov25i_47a250_motion", "model_preset": "ratgdo_pir", "name": "Garage Opener PIR", "range_px": 175, "sensor_type": "pir_motion", "x": 680, "y": 430}, {"entity_id": "binary_sensor.master_bedroom_motion", "floor": "upstairs", "fov_deg": 110, "heading_deg": 0, "host_room": "Master Bedroom", "id": "binary_sensor.master_bedroom_motion", "model_preset": "ecobee_smart_sensor", "name": "Master Bedroom PIR (Ecobee)", "range_px": 230, "sensor_type": "pir_motion", "x": 140, "y": 280}, {"entity_id": "binary_sensor.nursery_motion", "floor": "upstairs", "fov_deg": 110, "heading_deg": 315, "host_room": "Margot's Room", "id": "binary_sensor.nursery_motion", "model_preset": "ecobee_smart_sensor", "name": "Nursery PIR (Ecobee)", "range_px": 230, "sensor_type": "pir_motion", "x": 370, "y": 235}, {"entity_id": "binary_sensor.guest_room_motion", "floor": "upstairs", "fov_deg": 110, "heading_deg": 140, "host_room": "Guest Room", "id": "binary_sensor.guest_room_motion", "model_preset": "ecobee_smart_sensor", "name": "Guest Room PIR (Ecobee)", "range_px": 230, "sensor_type": "pir_motion", "x": 858, "y": 48}, {"entity_id": "binary_sensor.office_motion", "floor": "upstairs", "fov_deg": 110, "heading_deg": 145, "host_room": "Office", "id": "binary_sensor.office_motion", "model_preset": "ecobee_smart_sensor", "name": "Office PIR (Ecobee)", "range_px": 230, "sensor_type": "pir_motion", "x": 858, "y": 305}, {"entity_id": "binary_sensor.upper_level_keypad_motion", "floor": "upstairs", "fov_deg": 100, "heading_deg": 90, "host_room": "Upstairs Hallway & Stairs", "id": "binary_sensor.upper_level_keypad_motion", "model_preset": "ring_keypad_pir", "name": "Upstairs Hallway Keypad PIR", "range_px": 165, "sensor_type": "pir_motion", "x": 485, "y": 262}, {"entity_id": "binary_sensor.motion_sensor_gen2_motion_detection", "floor": "basement", "fov_deg": 90, "heading_deg": 180, "host_room": "Basement Play Area", "id": "binary_sensor.motion_sensor_gen2_motion_detection", "model_preset": "ring_alarm_pir_gen2", "name": "Basement Play Area PIR (Z-Wave)", "range_px": 260, "sensor_type": "pir_motion", "x": 560, "y": 245}, {"entity_id": "binary_sensor.basement_motion", "floor": "basement", "fov_deg": 110, "heading_deg": 270, "host_room": "Basement Play Area", "id": "binary_sensor.basement_motion", "model_preset": "ecobee_smart_sensor", "name": "Basement PIR (Ecobee)", "range_px": 230, "sensor_type": "pir_motion", "x": 420, "y": 518}, {"door_id": "door_front_entry", "entity_id": "binary_sensor.front_door", "floor": "main", "host_room": "Front Entry", "id": "binary_sensor.front_door", "model_preset": "ring_contact_sensor", "name": "Front Door Contact", "sensor_type": "door_contact", "x": 452, "y": 508}, {"door_id": "door_fr_laundry", "entity_id": "binary_sensor.utility_room_door", "floor": "main", "host_room": "Laundry Room", "id": "binary_sensor.utility_room_door", "model_preset": "ring_contact_sensor", "name": "Laundry / Garage Door Contact", "sensor_type": "door_contact", "x": 642, "y": 395}, {"entity_id": "binary_sensor.back_door", "floor": "main", "host_room": "Kitchen", "id": "binary_sensor.back_door", "model_preset": "ring_contact_sensor", "name": "Back Patio Door Contact", "sensor_type": "door_contact", "x": 475, "y": 87}, {"entity_id": "binary_sensor.garage_side_door", "floor": "main", "host_room": "Garage", "id": "binary_sensor.garage_side_door", "model_preset": "ring_contact_sensor", "name": "Garage Side Door Contact", "sensor_type": "door_contact", "x": 832, "y": 465}, {"entity_id": "cover.garage_door", "floor": "main", "host_room": "Garage", "id": "cover.garage_door", "name": "Garage Roll-Up Door", "sensor_type": "door_contact", "x": 680, "y": 555}], "version": 4}, "pir_analysis": [{"covered_rooms": [{"coverage_pct": 81.2, "room_name": "Family Room"}], "entity_id": "binary_sensor.family_room_motion", "floor": "main", "fov_deg": 90.0, "heading_deg": 225.0, "host_room": "Family Room", "id": "binary_sensor.family_room_motion", "name": "Family Room PIR (Ring)", "range_px": 260.0, "visibility_polygon": [[820.0, 278.0], [560.0, 278.0], [560.09, 271.19], [560.36, 264.39], [560.8, 257.6], [561.42, 250.82], [562.22, 244.06], [563.2, 237.33], [564.35, 230.62], [565.68, 223.94], [567.18, 217.3], [568.86, 210.71], [570.71, 204.16], [572.73, 197.66], [574.91, 191.21], [577.27, 184.82], [579.79, 178.5], [582.48, 172.25], [585.33, 166.07], [588.34, 159.96], [591.51, 153.94], [594.83, 148.0], [598.31, 142.15], [601.95, 136.39], [605.73, 130.73], [609.66, 125.18], [613.73, 119.72], [617.94, 114.38], [622.29, 109.14], [626.78, 104.03], [631.4, 99.03], [636.15, 94.15], [641.03, 89.4], [648.02, 87.0], [656.87, 87.0], [665.33, 87.0], [673.44, 87.0], [681.23, 87.0], [688.73, 87.0], [695.96, 87.0], [702.96, 87.0], [709.73, 87.0], [716.3, 87.0], [722.68, 87.0], [728.9, 87.0], [734.96, 87.0], [740.89, 87.0], [746.68, 87.0], [752.36, 87.0], [757.94, 87.0], [763.42, 87.0], [768.82, 87.0], [774.14, 87.0], [779.4, 87.0], [784.6, 87.0], [789.75, 87.0], [794.85, 87.0], [799.93, 87.0], [804.97, 87.0], [809.99, 87.0], [815.0, 87.0], [820.0, 87.0]], "x": 820.0, "y": 278.0}, {"covered_rooms": [{"coverage_pct": 62.5, "room_name": "Kitchen"}, {"coverage_pct": 45.0, "room_name": "Family Room"}], "entity_id": "binary_sensor.family_room_motion_4", "floor": "main", "fov_deg": 110.0, "heading_deg": 165.0, "host_room": "Family Room", "id": "binary_sensor.family_room_motion_4", "name": "Family/Kitchen PIR (Ecobee)", "range_px": 230.0, "visibility_polygon": [[555.0, 115.0], [476.34, 331.13], [470.76, 329.02], [465.23, 326.76], [459.77, 324.36], [455.79, 322.5], [455.72, 322.47], [455.64, 322.43], [454.37, 321.82], [449.04, 319.14], [445.31, 317.16], [445.24, 317.12], [445.16, 317.08], [443.78, 316.32], [438.59, 313.37], [433.49, 310.28], [432.41, 309.61], [432.34, 309.56], [432.27, 309.52], [428.46, 307.06], [423.52, 303.72], [418.67, 300.24], [413.91, 296.64], [411.22, 294.52], [411.16, 294.47], [411.09, 294.42], [410.0, 292.0], [410.0, 290.12], [410.0, 290.0], [409.9, 290.0], [404.68, 289.08], [400.22, 285.12], [395.85, 281.05], [391.6, 276.87], [387.46, 272.57], [383.42, 268.17], [379.51, 263.67], [377.0, 260.66], [376.95, 260.6], [376.9, 260.54], [375.71, 259.07], [372.03, 254.37], [368.48, 249.58], [365.05, 244.69], [361.75, 239.72], [358.58, 234.67], [355.54, 229.53], [352.64, 224.32], [349.87, 219.03], [347.24, 213.67], [344.83, 208.42], [344.79, 208.35], [344.76, 208.27], [344.75, 208.25], [342.4, 202.77], [340.2, 197.22], [338.14, 191.62], [336.22, 185.97], [334.46, 180.27], [332.84, 174.53], [331.71, 170.17], [331.7, 170.09], [331.68, 170.01], [331.37, 168.75], [330.05, 162.93], [328.88, 157.07], [327.87, 151.19], [327.0, 145.29], [326.29, 139.37], [325.74, 133.42], [325.34, 127.47], [325.09, 121.51], [325.0, 115.54], [325.06, 109.58], [325.28, 103.61], [325.65, 97.66], [325.96, 93.99], [325.97, 93.91], [325.98, 93.83], [326.18, 91.71], [336.34, 87.0], [373.79, 87.0], [400.47, 87.0], [420.46, 87.0], [436.02, 87.0], [448.5, 87.0], [458.72, 87.0], [467.28, 87.0], [474.55, 87.0], [480.8, 87.0], [486.26, 87.0], [491.06, 87.0], [495.32, 87.0], [499.14, 87.0], [502.58, 87.0], [505.7, 87.0], [508.55, 87.0], [511.16, 87.0], [513.57, 87.0], [515.8, 87.0], [517.88, 87.0], [519.82, 87.0], [521.63, 87.0]], "x": 555.0, "y": 115.0}, {"covered_rooms": [{"coverage_pct": 71.9, "room_name": "Dining Room"}], "entity_id": "binary_sensor.thermostat_motion", "floor": "main", "fov_deg": 110.0, "heading_deg": 180.0, "host_room": "Dining Room", "id": "binary_sensor.thermostat_motion", "name": "Main Thermostat PIR", "range_px": 180.0, "visibility_polygon": [[242.0, 180.0], [138.76, 327.45], [134.97, 324.72], [131.25, 321.89], [127.6, 318.97], [124.04, 315.96], [120.55, 312.85], [117.14, 309.66], [113.82, 306.38], [110.59, 303.01], [107.44, 299.56], [104.39, 296.03], [101.42, 292.42], [98.55, 288.73], [98.27, 288.37], [98.24, 288.31], [98.2, 288.26], [95.78, 284.98], [93.11, 281.15], [90.53, 277.25], [89.89, 276.24], [89.85, 276.18], [89.82, 276.13], [88.06, 273.29], [85.69, 269.26], [83.43, 265.18], [81.27, 261.04], [79.23, 256.84], [77.29, 252.59], [75.46, 248.29], [73.74, 243.95], [72.14, 239.56], [70.65, 235.14], [69.28, 230.67], [68.02, 226.18], [68.0, 221.38], [68.0, 216.64], [68.0, 211.95], [68.0, 207.31], [68.0, 202.7], [68.0, 198.12], [68.0, 193.57], [68.0, 189.04], [68.0, 184.52], [68.0, 180.0], [68.0, 175.48], [68.0, 170.96], [68.0, 166.43], [68.0, 161.88], [68.0, 157.3], [68.0, 152.69], [68.0, 148.05], [68.0, 143.36], [68.0, 138.62], [68.02, 133.82], [69.28, 129.33], [70.65, 124.86], [72.14, 120.44], [73.74, 116.05], [75.46, 111.71], [77.29, 107.41], [79.23, 103.16], [81.27, 98.96], [83.22, 95.21], [83.25, 95.15], [83.28, 95.1], [83.43, 94.82], [85.69, 90.74], [88.54, 87.0], [97.15, 87.0], [105.1, 87.0], [112.46, 87.0], [119.31, 87.0], [125.7, 87.0], [131.7, 87.0], [137.33, 87.0], [142.65, 87.0], [147.67, 87.0], [152.44, 87.0], [156.98, 87.0], [161.31, 87.0], [165.45, 87.0], [169.41, 87.0], [173.22, 87.0], [176.88, 87.0]], "x": 242.0, "y": 180.0}, {"covered_rooms": [{"coverage_pct": 45.3, "room_name": "Front Entry"}], "entity_id": "binary_sensor.keypad_motion", "floor": "main", "fov_deg": 100.0, "heading_deg": 295.0, "host_room": "Front Entry", "id": "binary_sensor.keypad_motion", "name": "Front Entry Keypad PIR", "range_px": 165.0, "visibility_polygon": [[415.0, 495.0], [362.31, 382.0], [365.85, 382.0], [369.31, 382.0], [372.7, 382.0], [374.17, 382.0], [374.21, 382.0], [374.25, 382.0], [376.03, 382.0], [379.29, 382.0], [382.5, 382.0], [385.67, 382.0], [388.79, 382.0], [391.87, 382.0], [394.92, 382.0], [397.95, 382.0], [400.95, 382.0], [403.93, 382.0], [406.89, 382.0], [407.62, 382.0], [410.0, 418.0], [410.0, 417.58], [410.0, 385.39], [410.0, 382.89], [410.0, 382.0], [407.76, 330.16], [409.45, 330.09], [409.5, 330.09], [410.0, 343.41], [410.92, 330.05], [410.98, 330.05], [411.03, 330.05], [411.78, 330.03], [416.07, 330.0], [420.37, 330.09], [424.67, 330.28], [428.95, 330.59], [433.23, 331.01], [437.5, 331.54], [441.75, 332.18], [445.98, 332.93], [450.19, 333.8], [454.37, 334.77], [458.53, 335.85], [462.67, 337.03], [466.76, 338.33], [470.83, 339.73], [474.85, 341.24], [478.84, 342.85], [482.78, 344.56], [486.67, 346.38], [490.52, 348.3], [494.32, 350.31], [497.79, 352.27], [497.84, 352.3], [497.89, 352.33], [498.06, 352.43], [500.9, 354.12], [500.95, 354.15], [501.0, 354.18], [501.74, 354.64], [505.37, 356.95], [508.93, 359.35], [512.44, 361.84], [515.87, 364.42], [518.77, 366.72], [518.82, 366.75], [518.86, 366.79], [519.24, 367.1], [522.53, 369.85], [525.76, 372.7], [528.91, 375.62], [531.98, 378.63], [534.0, 382.63], [534.0, 388.36], [534.0, 393.82], [534.0, 399.05], [534.0, 404.06], [534.0, 408.87], [534.0, 413.51], [534.0, 417.98], [534.0, 420.94], [534.0, 421.0], [534.0, 421.06], [534.0, 422.31], [534.0, 426.5], [534.0, 430.57], [534.0, 434.52], [534.0, 438.37], [534.0, 442.13], [534.0, 445.8], [534.0, 449.39], [534.0, 452.91], [534.0, 456.37], [534.0, 459.77], [534.0, 463.11]], "x": 415.0, "y": 495.0}, {"covered_rooms": [{"coverage_pct": 46.9, "room_name": "Garage"}], "entity_id": "binary_sensor.ratgdov25i_47a250_motion", "floor": "main", "fov_deg": 100.0, "heading_deg": 90.0, "host_room": "Garage", "id": "binary_sensor.ratgdov25i_47a250_motion", "name": "Garage Opener PIR", "range_px": 175.0, "visibility_polygon": [[680.0, 430.0], [814.06, 542.49], [811.08, 545.94], [808.02, 549.32], [804.87, 552.61], [800.84, 555.0], [794.69, 555.0], [788.83, 555.0], [783.23, 555.0], [777.87, 555.0], [772.72, 555.0], [767.77, 555.0], [762.99, 555.0], [758.38, 555.0], [753.92, 555.0], [749.59, 555.0], [745.38, 555.0], [741.29, 555.0], [737.3, 555.0], [733.41, 555.0], [729.6, 555.0], [725.87, 555.0], [722.2, 555.0], [718.61, 555.0], [715.07, 555.0], [711.58, 555.0], [708.14, 555.0], [704.74, 555.0], [701.37, 555.0], [698.03, 555.0], [694.72, 555.0], [691.43, 555.0], [688.15, 555.0], [684.89, 555.0], [681.63, 555.0], [678.37, 555.0], [675.11, 555.0], [671.85, 555.0], [668.57, 555.0], [665.28, 555.0], [661.97, 555.0], [658.63, 555.0], [655.26, 555.0], [651.86, 555.0], [648.42, 555.0], [644.93, 555.0], [641.39, 555.0], [637.8, 555.0], [634.13, 555.0], [630.4, 555.0], [626.59, 555.0], [622.7, 555.0], [618.71, 555.0], [614.62, 555.0], [610.41, 555.0], [606.08, 555.0], [601.62, 555.0], [597.01, 555.0], [592.23, 555.0], [587.28, 555.0], [582.13, 555.0], [576.77, 555.0], [571.17, 555.0], [565.31, 555.0], [559.16, 555.0], [555.13, 552.61], [551.98, 549.32], [548.92, 545.94], [547.11, 543.86], [547.07, 543.81], [547.03, 543.77], [545.94, 542.49]], "x": 680.0, "y": 430.0}, {"covered_rooms": [{"coverage_pct": 45.0, "room_name": "Master Bedroom"}], "entity_id": "binary_sensor.master_bedroom_motion", "floor": "upstairs", "fov_deg": 110.0, "heading_deg": 0.0, "host_room": "Master Bedroom", "id": "binary_sensor.master_bedroom_motion", "name": "Master Bedroom PIR (Ecobee)", "range_px": 230.0, "visibility_polygon": [[140.0, 280.0], [271.92, 91.6], [276.77, 95.08], [281.52, 98.69], [286.17, 102.42], [289.79, 105.47], [289.86, 105.52], [289.92, 105.57], [290.73, 106.27], [295.19, 110.24], [299.54, 114.33], [303.78, 118.52], [307.92, 122.82], [311.94, 127.23], [315.84, 131.74], [319.63, 136.36], [323.29, 141.06], [326.84, 145.86], [330.25, 150.76], [333.54, 155.74], [336.7, 160.8], [339.73, 165.94], [342.62, 171.16], [345.37, 176.45], [347.99, 181.82], [350.47, 187.24], [352.8, 192.74], [353.0, 199.04], [353.0, 205.31], [353.0, 211.46], [353.0, 217.51], [353.0, 223.46], [353.0, 229.34], [353.0, 235.15], [353.0, 240.89], [353.0, 246.57], [353.0, 252.21], [353.0, 253.92], [353.0, 254.0], [353.0, 254.08], [353.0, 255.92], [353.0, 256.0], [368.56, 254.33], [368.76, 256.17], [369.3, 262.12], [369.69, 268.07], [369.92, 274.03], [370.0, 280.0], [369.92, 285.97], [369.69, 291.93], [369.3, 297.88], [368.76, 303.83], [368.58, 305.48], [368.58, 305.55], [368.57, 305.63], [368.43, 306.79], [368.42, 306.87], [368.42, 306.95], [368.07, 309.75], [367.46, 314.09], [353.0, 312.0], [353.0, 312.08], [353.0, 313.43], [353.0, 313.56], [353.0, 313.63], [353.0, 313.71], [353.0, 315.92], [353.0, 316.0], [353.0, 316.08], [353.0, 319.11], [353.0, 324.85], [353.0, 329.53], [353.0, 329.61], [353.0, 329.69], [353.0, 330.66], [353.0, 336.54], [353.0, 342.49], [353.0, 348.54], [353.0, 354.69], [353.0, 354.92], [353.0, 355.0], [353.0, 355.08], [353.0, 360.96], [352.8, 367.26], [350.47, 372.76], [347.99, 378.18], [345.37, 383.55], [342.62, 388.84], [340.43, 392.82], [340.39, 392.89], [340.35, 392.96], [339.73, 394.06], [336.7, 399.2], [333.54, 404.26], [330.25, 409.24], [326.84, 414.14], [323.29, 418.94], [320.47, 422.59], [320.42, 422.65], [320.37, 422.72], [319.63, 423.64], [315.84, 428.26], [311.94, 432.77], [307.92, 437.18], [306.16, 439.03], [306.11, 439.09], [306.05, 439.15], [303.78, 441.48], [299.54, 445.67], [295.19, 449.76], [290.73, 453.73], [286.17, 457.58], [281.52, 461.31], [276.77, 464.92], [271.92, 468.4]], "x": 140.0, "y": 280.0}, {"covered_rooms": [{"coverage_pct": 84.4, "room_name": "Margot's Room"}, {"coverage_pct": 6.2, "room_name": "Guest Room"}], "entity_id": "binary_sensor.nursery_motion", "floor": "upstairs", "fov_deg": 110.0, "heading_deg": 315.0, "host_room": "Margot's Room", "id": "binary_sensor.nursery_motion", "name": "Nursery PIR (Ecobee)", "range_px": 230.0, "visibility_polygon": [[370.0, 235.0], [353.0, 138.59], [353.0, 121.43], [353.0, 97.08], [353.0, 59.75], [353.0, 32.85], [353.0, 32.0], [353.07, 32.0], [355.61, 32.0], [360.9, 32.0], [366.17, 32.0], [371.44, 32.0], [376.71, 32.0], [381.98, 32.0], [387.28, 32.0], [392.6, 32.0], [397.94, 32.0], [403.33, 32.0], [408.76, 32.0], [414.25, 32.0], [419.8, 32.0], [425.42, 32.0], [431.12, 32.0], [436.91, 32.0], [442.8, 32.0], [448.8, 32.0], [454.93, 32.0], [461.19, 32.0], [467.59, 32.0], [474.16, 32.0], [480.27, 33.16], [485.47, 36.09], [490.59, 39.15], [495.63, 42.34], [500.59, 45.67], [505.45, 49.12], [510.23, 52.69], [514.91, 56.39], [519.5, 60.21], [523.98, 64.15], [528.36, 68.2], [528.42, 68.26], [528.48, 68.31], [528.54, 68.37], [532.63, 72.37], [536.8, 76.64], [540.85, 81.02], [544.79, 85.5], [545.55, 86.4], [545.61, 86.47], [545.66, 86.53], [548.61, 90.09], [549.18, 90.8], [549.23, 90.87], [549.29, 90.93], [552.31, 94.77], [555.88, 99.55], [559.33, 104.41], [562.66, 109.37], [563.0, 116.17], [563.0, 122.96], [563.0, 129.56], [563.0, 135.97], [563.0, 142.22], [563.0, 142.92], [563.0, 143.0], [563.0, 143.08], [563.0, 148.31], [563.0, 150.48], [563.0, 150.56], [563.0, 150.64], [563.0, 151.92], [563.0, 152.0], [581.32, 144.21], [582.18, 146.23], [584.41, 151.77], [584.73, 152.6], [584.76, 152.67], [584.79, 152.75], [586.5, 157.36], [588.44, 163.0], [590.23, 168.69], [591.88, 174.42], [593.38, 180.2], [594.72, 186.01], [595.92, 191.86], [596.96, 197.73], [597.85, 203.64], [598.59, 209.56], [599.17, 215.49], [599.6, 221.45], [599.87, 227.41], [599.99, 233.37], [599.96, 239.34], [599.85, 243.26], [563.0, 242.0], [563.0, 242.07], [563.0, 243.65], [563.0, 247.12], [563.0, 247.18], [563.0, 247.25], [563.0, 247.49], [563.0, 247.56], [563.0, 247.63], [563.0, 248.68], [563.0, 249.68], [563.0, 249.75], [563.0, 249.82], [563.0, 249.98], [563.0, 250.05], [563.0, 250.09], [563.0, 250.12], [563.0, 250.15], [563.0, 250.21], [563.0, 250.22], [563.0, 250.28], [563.0, 250.35], [563.0, 253.72], [563.0, 253.93], [563.0, 254.0], [562.31, 254.0], [558.66, 254.0], [558.0, 254.0], [558.0, 254.07], [558.0, 257.93], [558.0, 258.0], [557.46, 258.0], [556.59, 258.0], [537.48, 258.0], [508.0, 254.0], [507.64, 254.0], [496.93, 254.0], [484.25, 254.0], [484.0, 254.0], [483.76, 254.0], [477.75, 254.0]], "x": 370.0, "y": 235.0}, {"covered_rooms": [{"coverage_pct": 67.2, "room_name": "Guest Room"}], "entity_id": "binary_sensor.guest_room_motion", "floor": "upstairs", "fov_deg": 110.0, "heading_deg": 140.0, "host_room": "Guest Room", "id": "binary_sensor.guest_room_motion", "name": "Guest Room PIR (Ecobee)", "range_px": 230.0, "visibility_polygon": [[858.0, 48.0], [874.0, 230.88], [874.0, 253.07], [874.0, 254.0], [873.93, 254.0], [871.36, 254.0], [871.29, 254.0], [871.22, 254.0], [870.65, 254.0], [865.29, 254.0], [859.94, 254.0], [858.07, 254.0], [858.0, 254.0], [857.93, 254.0], [854.6, 254.0], [849.25, 254.0], [843.89, 254.0], [838.51, 254.0], [833.1, 254.0], [827.66, 254.0], [822.18, 254.0], [816.64, 254.0], [811.06, 254.0], [805.4, 254.0], [799.67, 254.0], [793.85, 254.0], [787.94, 254.0], [781.92, 254.0], [775.79, 254.0], [769.52, 254.0], [768.38, 254.0], [768.29, 254.0], [768.2, 254.0], [763.12, 254.0], [756.56, 254.0], [755.92, 254.0], [755.83, 254.0], [755.74, 254.0], [751.08, 251.64], [745.83, 248.79], [740.66, 245.82], [740.16, 245.52], [740.09, 245.48], [740.02, 245.44], [735.57, 242.71], [730.56, 239.46], [726.12, 236.44], [726.06, 236.39], [725.99, 236.34], [725.63, 236.09], [723.33, 234.45], [723.26, 234.4], [723.2, 234.35], [720.8, 232.6], [716.06, 228.97], [711.41, 225.23], [706.86, 221.37], [705.1, 219.82], [705.04, 219.77], [704.98, 219.72], [703.47, 218.35], [703.41, 218.3], [703.35, 218.24], [702.42, 217.4], [702.41, 217.39], [702.36, 217.34], [702.31, 217.29], [699.52, 214.68], [699.46, 214.63], [699.4, 214.57], [698.07, 213.3], [693.84, 209.09], [689.71, 204.78], [685.7, 200.36], [681.81, 195.84], [681.71, 195.73], [681.66, 195.67], [681.61, 195.6], [681.13, 195.02], [681.08, 194.96], [681.02, 194.9], [678.03, 191.22], [674.38, 186.5], [670.85, 181.69], [667.44, 176.79], [664.17, 171.81], [661.02, 166.74], [658.01, 161.59], [655.13, 156.36], [652.38, 151.06], [649.78, 145.69], [647.31, 140.26], [644.99, 134.76], [643.25, 130.35], [643.22, 130.28], [643.19, 130.2], [642.81, 129.21], [641.11, 124.55], [641.09, 124.47], [641.06, 124.4], [640.78, 123.6], [639.65, 120.28], [639.63, 120.2], [639.6, 120.13], [639.1, 118.58], [639.07, 118.5], [639.05, 118.43], [638.89, 117.94], [637.15, 112.23], [635.56, 106.48], [634.12, 100.69], [632.83, 94.86], [631.69, 89.01], [630.7, 83.12], [629.86, 77.21], [629.18, 71.29], [628.65, 65.34], [628.28, 59.39], [628.06, 53.42], [628.0, 47.46], [628.07, 42.52], [628.07, 42.44], [628.07, 42.36], [628.09, 41.49], [628.33, 35.62], [628.34, 35.54], [628.34, 35.53], [628.34, 35.46], [628.47, 33.27], [628.48, 33.19], [628.48, 33.11], [658.9, 32.0], [707.82, 32.0], [737.57, 32.0], [757.59, 32.0], [772.01, 32.0], [782.9, 32.0], [791.42, 32.0], [798.29, 32.0]], "x": 858.0, "y": 48.0}, {"covered_rooms": [{"coverage_pct": 65.6, "room_name": "Office"}], "entity_id": "binary_sensor.office_motion", "floor": "upstairs", "fov_deg": 110.0, "heading_deg": 145.0, "host_room": "Office", "id": "binary_sensor.office_motion", "name": "Office PIR (Ecobee)", "range_px": 230.0, "visibility_polygon": [[858.0, 305.0], [858.0, 535.0], [852.03, 534.92], [846.07, 534.69], [840.12, 534.3], [834.17, 533.76], [828.25, 533.07], [822.34, 532.22], [816.46, 531.22], [810.6, 530.06], [804.78, 528.76], [799.0, 527.3], [793.25, 525.7], [787.55, 523.94], [781.89, 522.04], [776.28, 519.99], [770.74, 517.8], [765.24, 515.47], [759.82, 512.99], [754.45, 510.37], [749.16, 507.62], [743.94, 504.73], [738.8, 501.7], [733.74, 498.54], [728.76, 495.25], [723.86, 491.84], [719.06, 488.29], [717.79, 487.32], [717.73, 487.28], [717.67, 487.23], [714.36, 484.63], [709.74, 480.84], [705.23, 476.94], [700.82, 472.92], [696.52, 468.78], [692.33, 464.54], [688.24, 460.19], [684.27, 455.73], [680.42, 451.17], [676.69, 446.52], [673.08, 441.77], [671.0, 435.94], [671.0, 428.84], [671.0, 421.97], [671.0, 415.33], [671.0, 408.89], [671.0, 402.63], [671.0, 396.53], [671.0, 395.44], [671.0, 395.36], [671.0, 395.28], [671.0, 390.59], [671.0, 389.53], [671.0, 389.45], [671.0, 389.37], [671.0, 384.79], [671.0, 379.12], [671.0, 375.36], [671.0, 375.28], [671.0, 375.21], [671.0, 373.56], [671.0, 368.11], [671.0, 362.75], [671.0, 357.48], [671.0, 352.28], [671.0, 347.15], [671.0, 342.08], [671.0, 337.06], [671.0, 332.09], [671.0, 327.16], [671.0, 322.25], [671.0, 317.37], [671.0, 315.07], [671.0, 315.0], [669.77, 315.0], [666.29, 315.0], [665.0, 315.0], [665.0, 314.93], [665.0, 313.63], [665.0, 313.56], [665.0, 313.49], [665.0, 312.74], [665.0, 312.03], [665.0, 311.96], [665.0, 311.89], [665.0, 307.73], [665.0, 302.72], [665.0, 297.71], [665.0, 292.69], [665.0, 290.95], [735.0, 296.0], [735.59, 296.0], [749.54, 296.0], [750.0, 296.0], [735.0, 294.71], [735.0, 293.95], [735.0, 290.72], [735.0, 287.48], [735.0, 285.77], [735.0, 285.73], [735.0, 285.69], [735.0, 284.21], [735.0, 284.13], [735.0, 284.09], [735.0, 284.05], [735.0, 283.78], [735.0, 283.74], [735.0, 283.69], [735.0, 280.91], [735.0, 279.75], [735.0, 279.71], [735.0, 279.66], [735.0, 279.54], [735.0, 279.5], [735.0, 279.46], [735.0, 278.78], [735.0, 278.73], [735.0, 278.69], [735.0, 277.58], [735.0, 275.09], [735.0, 275.05], [735.0, 275.0], [735.0, 274.21], [735.0, 274.13], [735.0, 274.09], [735.0, 274.04], [735.0, 273.04], [735.0, 272.99], [735.0, 272.95], [735.0, 271.5], [735.0, 271.45], [735.0, 271.41], [735.0, 270.8], [735.0, 267.33], [735.0, 263.81], [735.0, 260.23]], "x": 858.0, "y": 305.0}, {"covered_rooms": [{"coverage_pct": 25.0, "room_name": "Upstairs Bathroom"}, {"coverage_pct": 45.0, "room_name": "Upstairs Hallway & Stairs"}], "entity_id": "binary_sensor.upper_level_keypad_motion", "floor": "upstairs", "fov_deg": 100.0, "heading_deg": 90.0, "host_room": "Upstairs Hallway & Stairs", "id": "binary_sensor.upper_level_keypad_motion", "name": "Upstairs Hallway Keypad PIR", "range_px": 165.0, "visibility_polygon": [[485.0, 262.0], [610.0, 366.89], [608.59, 371.32], [605.7, 374.5], [602.73, 377.6], [599.68, 380.63], [596.55, 383.58], [593.35, 386.44], [590.07, 389.22], [588.62, 390.4], [588.58, 390.44], [588.53, 390.47], [586.72, 391.92], [583.3, 394.52], [579.82, 397.04], [576.27, 399.46], [572.66, 401.79], [568.98, 404.03], [565.26, 406.17], [561.47, 408.21], [557.64, 410.15], [556.92, 410.5], [556.87, 410.53], [556.82, 410.55], [553.76, 411.99], [549.83, 413.73], [549.71, 413.78], [508.0, 316.0], [507.98, 316.0], [506.68, 316.0], [506.66, 316.0], [506.64, 316.0], [506.43, 316.0], [504.81, 316.0], [503.23, 316.0], [501.68, 316.0], [500.15, 316.0], [498.64, 316.0], [497.16, 316.0], [495.69, 316.0], [494.23, 316.0], [492.79, 316.0], [491.36, 316.0], [489.94, 316.0], [488.52, 316.0], [487.11, 316.0], [485.7, 316.0], [484.3, 316.0], [482.89, 316.0], [481.48, 316.0], [480.06, 316.0], [478.64, 316.0], [478.38, 316.0], [478.36, 316.0], [478.34, 316.0], [477.21, 316.0], [475.77, 316.0], [474.72, 316.0], [474.7, 316.0], [474.68, 316.0], [474.31, 316.0], [474.07, 316.0], [474.05, 316.0], [474.03, 316.0], [472.84, 316.0], [472.03, 316.0], [472.01, 316.0], [471.99, 316.0], [471.67, 316.0], [471.65, 316.0], [471.63, 316.0], [471.36, 316.0], [469.85, 316.0], [468.32, 316.0], [466.77, 316.0], [465.19, 316.0], [463.86, 316.0], [463.84, 316.0], [463.82, 316.0], [463.57, 316.0], [462.02, 316.0], [462.0, 316.0], [461.98, 316.0], [461.93, 316.0], [460.25, 316.0], [458.52, 316.0], [456.76, 316.0], [454.94, 316.0], [453.07, 316.0], [451.14, 316.0], [449.15, 316.0], [447.08, 316.0], [446.03, 316.0], [446.0, 316.0], [417.78, 355.0], [416.01, 355.0], [412.18, 355.0], [408.19, 355.0], [404.03, 355.0], [399.67, 355.0], [395.1, 355.0], [390.29, 355.0], [385.22, 355.0], [379.85, 355.0], [374.17, 355.0]], "x": 485.0, "y": 262.0}, {"covered_rooms": [{"coverage_pct": 10.9, "room_name": "Basement Theater"}, {"coverage_pct": 45.0, "room_name": "Basement Play Area"}], "entity_id": "binary_sensor.motion_sensor_gen2_motion_detection", "floor": "basement", "fov_deg": 90.0, "heading_deg": 180.0, "host_room": "Basement Play Area", "id": "binary_sensor.motion_sensor_gen2_motion_detection", "name": "Basement Play Area PIR (Z-Wave)", "range_px": 260.0, "visibility_polygon": [[560.0, 245.0], [376.15, 428.85], [371.4, 423.97], [366.78, 418.97], [362.29, 413.86], [357.94, 408.62], [356.02, 406.22], [355.97, 406.15], [355.91, 406.08], [353.73, 403.28], [349.66, 397.82], [345.73, 392.27], [341.95, 386.61], [338.31, 380.85], [334.83, 375.0], [331.51, 369.06], [328.34, 363.04], [325.33, 356.93], [322.48, 350.75], [319.79, 344.5], [317.27, 338.18], [314.91, 331.79], [312.73, 325.34], [310.71, 318.84], [308.86, 312.29], [307.18, 305.7], [305.68, 299.06], [304.35, 292.38], [303.2, 285.67], [302.22, 278.94], [301.42, 272.18], [300.8, 265.4], [300.36, 258.61], [300.09, 251.81], [300.0, 245.0], [300.09, 238.19], [300.36, 231.39], [300.8, 224.6], [301.42, 217.82], [302.22, 211.06], [303.2, 204.33], [304.35, 197.62], [305.68, 190.94], [307.18, 184.3], [308.86, 177.71], [310.71, 171.16], [312.73, 164.66], [314.91, 158.21], [317.27, 151.82], [319.79, 145.5], [322.48, 139.25], [325.33, 133.07], [328.34, 126.96], [331.51, 120.94], [334.83, 115.0], [338.31, 109.15], [341.95, 103.39], [345.73, 97.73], [349.66, 92.18], [353.73, 86.72], [357.94, 81.38], [362.29, 76.14], [366.78, 71.03], [371.4, 66.03], [376.15, 61.15]], "x": 560.0, "y": 245.0}, {"covered_rooms": [{"coverage_pct": 45.0, "room_name": "Basement Play Area"}], "entity_id": "binary_sensor.basement_motion", "floor": "basement", "fov_deg": 110.0, "heading_deg": 270.0, "host_room": "Basement Play Area", "id": "binary_sensor.basement_motion", "name": "Basement PIR (Ecobee)", "range_px": 230.0, "visibility_polygon": [[420.0, 518.0], [362.87, 478.0], [365.92, 478.0], [368.75, 478.0], [371.41, 478.0], [373.9, 478.0], [376.24, 478.0], [378.46, 478.0], [380.56, 478.0], [382.56, 478.0], [384.46, 478.0], [386.27, 478.0], [388.01, 478.0], [389.68, 478.0], [391.28, 478.0], [392.83, 478.0], [394.32, 478.0], [395.76, 478.0], [397.16, 478.0], [398.51, 478.0], [399.83, 478.0], [401.12, 478.0], [402.37, 478.0], [403.6, 478.0], [404.8, 478.0], [405.97, 478.0], [407.13, 478.0], [408.26, 478.0], [409.38, 478.0], [410.49, 478.0], [411.58, 478.0], [412.65, 478.0], [413.72, 478.0], [414.78, 478.0], [415.83, 478.0], [416.88, 478.0], [417.92, 478.0], [418.96, 478.0], [420.0, 478.0], [421.04, 478.0], [422.08, 478.0], [423.12, 478.0], [424.17, 478.0], [425.22, 478.0], [426.28, 478.0], [427.35, 478.0], [428.42, 478.0], [429.51, 478.0], [429.99, 478.0], [430.0, 478.0], [430.01, 478.01], [430.47, 478.54], [431.3, 479.48], [432.1, 480.38], [432.88, 481.27], [433.64, 482.12], [434.37, 482.95], [435.09, 483.77], [435.79, 484.56], [436.47, 485.33], [436.94, 485.87], [436.95, 485.88], [436.96, 485.89], [437.14, 486.09], [437.8, 486.84], [438.44, 487.57], [439.08, 488.29], [439.7, 489.0], [440.32, 489.7], [440.93, 490.39], [441.53, 491.07], [442.13, 491.75], [442.73, 492.42], [443.32, 493.09], [443.9, 493.76], [444.49, 494.42], [444.99, 494.99], [445.0, 495.0], [445.0, 495.02], [445.0, 495.15], [445.0, 496.31], [445.0, 497.42], [445.0, 498.49], [445.0, 499.51], [445.0, 500.49]], "x": 420.0, "y": 518.0}], "room_coverage": {"Basement Bathroom": {"ble_proxies": [{"host_room": "Basement Play Area", "id": "basement_speaker", "name": "Basement Speaker BLE Proxy"}], "max_coverage_pct": 0.0, "pir_sensors": [], "primary_cameras": [], "spillover_cameras": [], "sub_zones": [], "uncovered_pct": 100.0}, "Basement Play Area": {"ble_proxies": [{"host_room": "Basement Play Area", "id": "basement_speaker", "name": "Basement Speaker BLE Proxy"}], "max_coverage_pct": 65.0, "pir_sensors": [{"coverage_pct": 45.0, "entity_id": "binary_sensor.motion_sensor_gen2_motion_detection", "id": "binary_sensor.motion_sensor_gen2_motion_detection", "name": "Basement Play Area PIR (Z-Wave)"}, {"coverage_pct": 45.0, "entity_id": "binary_sensor.basement_motion", "id": "binary_sensor.basement_motion", "name": "Basement PIR (Ecobee)"}], "primary_cameras": [{"camera_id": "camera.basement_play_area", "coverage_pct": 65.0}], "spillover_cameras": [{"camera_id": "camera.basement_theater", "host_room": "Basement Theater", "overlap_pct": 63.0}, {"camera_id": "camera.storage_room", "host_room": "Storage Room", "overlap_pct": 6.0}], "sub_zones": [{"camera_id": "camera.basement_theater", "entity_id": "binary_sensor.basement_bar_person_occupancy", "floor": "basement", "height": 140.0, "id": "basement_bar", "label": "Basement Wet Bar", "room": "Basement Play Area", "width": 150.0, "x": 365.0, "y": 55.0}, {"camera_id": "camera.basement_theater", "entity_id": "binary_sensor.basement_play_area_far_person_occupancy", "floor": "basement", "height": 175.0, "id": "basement_play_area_far", "label": "Play Area East", "room": "Basement Play Area", "width": 190.0, "x": 370.0, "y": 230.0}, {"camera_id": "camera.basement_theater", "entity_id": "binary_sensor.basement_stairwell_person_occupancy", "floor": "basement", "height": 105.0, "id": "basement_stairwell", "label": "Basement Stairwell", "room": "Basement Play Area", "width": 75.0, "x": 495.0, "y": 415.0}, {"camera_id": "camera.basement_play_area", "entity_id": "binary_sensor.basement_play_floor_person_occupancy", "floor": "basement", "height": 220.0, "id": "basement_play_floor", "label": "Play Area Main Floor", "room": "Basement Play Area", "width": 195.0, "x": 365.0, "y": 225.0}, {"camera_id": "camera.basement_play_area", "entity_id": "binary_sensor.basement_counter_person_occupancy", "floor": "basement", "height": 140.0, "id": "basement_counter", "label": "Wet Bar Counter", "room": "Basement Play Area", "width": 150.0, "x": 365.0, "y": 60.0}], "uncovered_pct": 35.0}, "Basement Theater": {"ble_proxies": [{"host_room": "Basement Play Area", "id": "basement_speaker", "name": "Basement Speaker BLE Proxy"}], "max_coverage_pct": 97.0, "pir_sensors": [{"coverage_pct": 10.9, "entity_id": "binary_sensor.motion_sensor_gen2_motion_detection", "id": "binary_sensor.motion_sensor_gen2_motion_detection", "name": "Basement Play Area PIR (Z-Wave)"}], "primary_cameras": [{"camera_id": "camera.basement_theater", "coverage_pct": 97.0}], "spillover_cameras": [{"camera_id": "camera.basement_play_area", "host_room": "Basement Play Area", "overlap_pct": 87.0}], "sub_zones": [{"camera_id": "camera.basement_theater", "entity_id": "binary_sensor.basement_theater_couch_person_occupancy", "floor": "basement", "height": 165.0, "id": "basement_theater_couch", "label": "Theater Couch", "room": "Basement Theater", "width": 165.0, "x": 150.0, "y": 235.0}, {"camera_id": "camera.basement_theater", "entity_id": "binary_sensor.basement_theater_playpen_person_occupancy", "floor": "basement", "height": 75.0, "id": "basement_theater_playpen", "label": "Ballpit / Playpen", "room": "Basement Theater", "width": 165.0, "x": 160.0, "y": 50.0}, {"camera_id": "camera.basement_theater", "entity_id": "binary_sensor.basement_theater_floor_person_occupancy", "floor": "basement", "height": 90.0, "id": "basement_theater_floor", "label": "Theater Floor", "room": "Basement Theater", "width": 165.0, "x": 160.0, "y": 135.0}, {"camera_id": "camera.basement_play_area", "entity_id": "binary_sensor.theater_rear_view_person_occupancy", "floor": "basement", "height": 175.0, "id": "theater_rear_view", "label": "Theater Rear View", "room": "Basement Theater", "width": 185.0, "x": 135.0, "y": 230.0}], "uncovered_pct": 3.0}, "Dining Room": {"ble_proxies": [{"host_room": "Living Room", "id": "living_room_speaker", "name": "Living Room Speaker BLE Proxy"}], "max_coverage_pct": 100.0, "pir_sensors": [{"coverage_pct": 71.9, "entity_id": "binary_sensor.thermostat_motion", "id": "binary_sensor.thermostat_motion", "name": "Main Thermostat PIR"}], "primary_cameras": [{"camera_id": "camera.dining_room", "coverage_pct": 100.0}], "spillover_cameras": [{"camera_id": "camera.family_room", "host_room": "Family Room", "overlap_pct": 6.0}], "sub_zones": [{"camera_id": "camera.dining_room", "entity_id": "binary_sensor.dining_room_table_person_occupancy", "floor": "main", "height": 110.0, "id": "dining_room_table", "label": "Dining Table", "room": "Dining Room", "width": 110.0, "x": 105.0, "y": 145.0}, {"camera_id": "camera.dining_room", "entity_id": "binary_sensor.rileys_food_person_occupancy", "floor": "main", "height": 42.0, "id": "rileys_food", "label": "Riley's Food Corner", "room": "Dining Room", "width": 65.0, "x": 170.0, "y": 96.0}], "uncovered_pct": 0.0}, "Family Room": {"ble_proxies": [{"host_room": "Family Room", "id": "family_room_speaker", "name": "Family Room Speaker BLE Proxy"}], "max_coverage_pct": 100.0, "pir_sensors": [{"coverage_pct": 81.2, "entity_id": "binary_sensor.family_room_motion", "id": "binary_sensor.family_room_motion", "name": "Family Room PIR (Ring)"}, {"coverage_pct": 45.0, "entity_id": "binary_sensor.family_room_motion_4", "id": "binary_sensor.family_room_motion_4", "name": "Family/Kitchen PIR (Ecobee)"}], "primary_cameras": [{"camera_id": "camera.family_room", "coverage_pct": 100.0}], "spillover_cameras": [], "sub_zones": [{"camera_id": "camera.family_room", "entity_id": "binary_sensor.family_room_couch_person_occupancy", "floor": "main", "height": 88.0, "id": "family_room_couch", "label": "Family Room Couch", "room": "Family Room", "width": 150.0, "x": 635.0, "y": 195.0}, {"camera_id": "camera.family_room", "entity_id": "binary_sensor.family_room_recliner_person_occupancy", "floor": "main", "height": 75.0, "id": "family_room_recliner", "label": "Family Room Recliner", "room": "Family Room", "width": 80.0, "x": 545.0, "y": 115.0}, {"camera_id": "camera.family_room", "entity_id": "binary_sensor.family_room_floor_person_occupancy", "floor": "main", "height": 88.0, "id": "family_room_floor", "label": "Family Room Floor", "room": "Family Room", "width": 85.0, "x": 545.0, "y": 195.0}], "uncovered_pct": 0.0}, "Front Entry": {"ble_proxies": [{"host_room": "Living Room", "id": "living_room_speaker", "name": "Living Room Speaker BLE Proxy"}, {"host_room": "Family Room", "id": "family_room_speaker", "name": "Family Room Speaker BLE Proxy"}], "max_coverage_pct": 27.0, "pir_sensors": [{"coverage_pct": 45.3, "entity_id": "binary_sensor.keypad_motion", "id": "binary_sensor.keypad_motion", "name": "Front Entry Keypad PIR"}], "primary_cameras": [], "spillover_cameras": [{"camera_id": "camera.living_room", "host_room": "Living Room", "overlap_pct": 27.0}, {"camera_id": "camera.family_room", "host_room": "Family Room", "overlap_pct": 18.0}], "sub_zones": [{"camera_id": "camera.living_room", "entity_id": "binary_sensor.living_room_entry_person_occupancy", "floor": "main", "height": 80.0, "id": "living_room_entry", "label": "Front Entry Archway", "room": "Front Entry", "width": 80.0, "x": 350.0, "y": 415.0}], "uncovered_pct": 73.0}, "Garage": {"ble_proxies": [], "max_coverage_pct": 90.0, "pir_sensors": [{"coverage_pct": 46.9, "entity_id": "binary_sensor.ratgdov25i_47a250_motion", "id": "binary_sensor.ratgdov25i_47a250_motion", "name": "Garage Opener PIR"}], "primary_cameras": [{"camera_id": "camera.garage", "coverage_pct": 90.0}], "spillover_cameras": [], "sub_zones": [{"camera_id": "camera.garage", "entity_id": "binary_sensor.garage_parking_person_occupancy", "floor": "main", "height": 108.0, "id": "garage_parking", "label": "Garage Parking Bay", "room": "Garage", "width": 170.0, "x": 595.0, "y": 438.0}], "uncovered_pct": 10.0}, "Guest Room": {"ble_proxies": [{"host_room": "Margot's Room", "id": "nursery_speaker", "name": "Nursery Speaker BLE Proxy"}, {"host_room": "Office", "id": "office_speaker", "name": "Office Speaker BLE Proxy"}], "max_coverage_pct": 8.0, "pir_sensors": [{"coverage_pct": 6.2, "entity_id": "binary_sensor.nursery_motion", "id": "binary_sensor.nursery_motion", "name": "Nursery PIR (Ecobee)"}, {"coverage_pct": 67.2, "entity_id": "binary_sensor.guest_room_motion", "id": "binary_sensor.guest_room_motion", "name": "Guest Room PIR (Ecobee)"}], "primary_cameras": [], "spillover_cameras": [{"camera_id": "camera.nursery", "host_room": "Margot's Room", "overlap_pct": 8.0}], "sub_zones": [], "uncovered_pct": 92.0}, "Kitchen": {"ble_proxies": [{"host_room": "Living Room", "id": "living_room_speaker", "name": "Living Room Speaker BLE Proxy"}, {"host_room": "Family Room", "id": "family_room_speaker", "name": "Family Room Speaker BLE Proxy"}], "max_coverage_pct": 100.0, "pir_sensors": [{"coverage_pct": 62.5, "entity_id": "binary_sensor.family_room_motion_4", "id": "binary_sensor.family_room_motion_4", "name": "Family/Kitchen PIR (Ecobee)"}], "primary_cameras": [], "spillover_cameras": [{"camera_id": "camera.family_room", "host_room": "Family Room", "overlap_pct": 100.0}], "sub_zones": [{"camera_id": "camera.family_room", "entity_id": "binary_sensor.kitchen_island_person_occupancy", "floor": "main", "height": 95.0, "id": "kitchen_island", "label": "Kitchen Island", "room": "Kitchen", "width": 120.0, "x": 335.0, "y": 155.0}], "uncovered_pct": 0.0}, "Laundry Room": {"ble_proxies": [{"host_room": "Family Room", "id": "family_room_speaker", "name": "Family Room Speaker BLE Proxy"}], "max_coverage_pct": 0.0, "pir_sensors": [], "primary_cameras": [], "spillover_cameras": [], "sub_zones": [], "uncovered_pct": 100.0}, "Living Room": {"ble_proxies": [{"host_room": "Living Room", "id": "living_room_speaker", "name": "Living Room Speaker BLE Proxy"}], "max_coverage_pct": 91.0, "pir_sensors": [], "primary_cameras": [{"camera_id": "camera.living_room", "coverage_pct": 91.0}], "spillover_cameras": [{"camera_id": "camera.dining_room", "host_room": "Dining Room", "overlap_pct": 23.0}], "sub_zones": [{"camera_id": "camera.living_room", "entity_id": "binary_sensor.living_room_couch_person_occupancy", "floor": "main", "height": 100.0, "id": "living_room_couch", "label": "Living Room Couch", "room": "Living Room", "width": 125.0, "x": 105.0, "y": 355.0}, {"camera_id": "camera.living_room", "entity_id": "binary_sensor.living_room_floor_person_occupancy", "floor": "main", "height": 100.0, "id": "living_room_floor", "label": "Living Room Floor", "room": "Living Room", "width": 95.0, "x": 235.0, "y": 365.0}, {"camera_id": "camera.living_room", "entity_id": "binary_sensor.living_room_bay_windows_person_occupancy", "floor": "main", "height": 38.0, "id": "living_room_bay_windows", "label": "Bay Windows", "room": "Living Room", "width": 165.0, "x": 115.0, "y": 468.0}], "uncovered_pct": 9.0}, "Margot's Room": {"ble_proxies": [{"host_room": "Master Bedroom", "id": "master_bedroom_speaker", "name": "Master Bedroom Speaker BLE Proxy"}, {"host_room": "Margot's Room", "id": "nursery_speaker", "name": "Nursery Speaker BLE Proxy"}], "max_coverage_pct": 88.0, "pir_sensors": [{"coverage_pct": 84.4, "entity_id": "binary_sensor.nursery_motion", "id": "binary_sensor.nursery_motion", "name": "Nursery PIR (Ecobee)"}], "primary_cameras": [{"camera_id": "camera.nursery", "coverage_pct": 88.0}], "spillover_cameras": [], "sub_zones": [{"camera_id": "camera.nursery", "entity_id": "binary_sensor.nursery_bed_person_occupancy", "floor": "upstairs", "height": 115.0, "id": "nursery_bed", "label": "Nursery Bed", "room": "Margot's Room", "width": 125.0, "x": 370.0, "y": 95.0}], "uncovered_pct": 12.0}, "Master Bathroom": {"ble_proxies": [{"host_room": "Office", "id": "office_speaker", "name": "Office Speaker BLE Proxy"}], "max_coverage_pct": 46.0, "pir_sensors": [], "primary_cameras": [], "spillover_cameras": [{"camera_id": "camera.master_bedroom", "host_room": "Master Bedroom", "overlap_pct": 46.0}], "sub_zones": [{"camera_id": "camera.master_bedroom", "entity_id": "binary_sensor.master_bathroom_person_occupancy", "floor": "upstairs", "height": 56.0, "id": "master_bathroom", "label": "Master Bath Doorway", "room": "Master Bathroom", "width": 55.0, "x": 425.0, "y": 486.0}], "uncovered_pct": 54.0}, "Master Bedroom": {"ble_proxies": [{"host_room": "Master Bedroom", "id": "master_bedroom_speaker", "name": "Master Bedroom Speaker BLE Proxy"}, {"host_room": "Margot's Room", "id": "nursery_speaker", "name": "Nursery Speaker BLE Proxy"}], "max_coverage_pct": 100.0, "pir_sensors": [{"coverage_pct": 45.0, "entity_id": "binary_sensor.master_bedroom_motion", "id": "binary_sensor.master_bedroom_motion", "name": "Master Bedroom PIR (Ecobee)"}], "primary_cameras": [{"camera_id": "camera.master_bedroom", "coverage_pct": 100.0}], "spillover_cameras": [], "sub_zones": [{"camera_id": "camera.master_bedroom", "entity_id": "binary_sensor.master_bed_person_occupancy", "floor": "upstairs", "height": 155.0, "id": "master_bed", "label": "Master Bed", "room": "Master Bedroom", "width": 135.0, "x": 134.0, "y": 250.0}, {"camera_id": "camera.master_bedroom", "entity_id": "binary_sensor.master_open_area_person_occupancy", "floor": "upstairs", "height": 165.0, "id": "master_open_area", "label": "Master Open Floor", "room": "Master Bedroom", "width": 145.0, "x": 140.0, "y": 55.0}, {"camera_id": "camera.master_bedroom", "entity_id": "binary_sensor.master_bedroom_walkway_person_occupancy", "floor": "upstairs", "height": 220.0, "id": "master_bedroom_walkway", "label": "Master Walkway", "room": "Master Bedroom", "width": 68.0, "x": 278.0, "y": 225.0}, {"camera_id": "camera.master_bedroom", "entity_id": "binary_sensor.master_bedroom_entryway_person_occupancy", "floor": "upstairs", "height": 56.0, "id": "master_bedroom_entryway", "label": "Master Hallway Entry", "room": "Master Bedroom", "width": 48.0, "x": 305.0, "y": 256.0}], "uncovered_pct": 0.0}, "Master W.I.C": {"ble_proxies": [], "max_coverage_pct": 0.0, "pir_sensors": [], "primary_cameras": [], "spillover_cameras": [], "sub_zones": [], "uncovered_pct": 100.0}, "Office": {"ble_proxies": [{"host_room": "Office", "id": "office_speaker", "name": "Office Speaker BLE Proxy"}], "max_coverage_pct": 99.0, "pir_sensors": [{"coverage_pct": 65.6, "entity_id": "binary_sensor.office_motion", "id": "binary_sensor.office_motion", "name": "Office PIR (Ecobee)"}], "primary_cameras": [{"camera_id": "camera.office", "coverage_pct": 99.0}], "spillover_cameras": [], "sub_zones": [{"camera_id": "camera.office", "entity_id": "binary_sensor.steves_desk_person_occupancy", "floor": "upstairs", "height": 95.0, "id": "steves_desk", "label": "Steve's Desk", "room": "Office", "width": 105.0, "x": 745.0, "y": 360.0}, {"camera_id": "camera.office", "entity_id": "binary_sensor.sim_rig_person_occupancy", "floor": "upstairs", "height": 95.0, "id": "sim_rig", "label": "Sim Rig", "room": "Office", "width": 65.0, "x": 680.0, "y": 425.0}, {"camera_id": "camera.office", "entity_id": "binary_sensor.office_floor_person_occupancy", "floor": "upstairs", "height": 95.0, "id": "office_floor", "label": "Office Center Floor", "room": "Office", "width": 95.0, "x": 685.0, "y": 310.0}, {"camera_id": "camera.office", "entity_id": "binary_sensor.office_entryway_person_occupancy", "floor": "upstairs", "height": 55.0, "id": "office_entryway", "label": "Office Doorway", "room": "Office", "width": 45.0, "x": 665.0, "y": 258.0}], "uncovered_pct": 1.0}, "Powder Bath": {"ble_proxies": [{"host_room": "Living Room", "id": "living_room_speaker", "name": "Living Room Speaker BLE Proxy"}], "max_coverage_pct": 17.0, "pir_sensors": [], "primary_cameras": [], "spillover_cameras": [{"camera_id": "camera.family_room", "host_room": "Family Room", "overlap_pct": 17.0}], "sub_zones": [], "uncovered_pct": 83.0}, "Storage Room": {"ble_proxies": [{"host_room": "Basement Play Area", "id": "basement_speaker", "name": "Basement Speaker BLE Proxy"}], "max_coverage_pct": 100.0, "pir_sensors": [], "primary_cameras": [{"camera_id": "camera.storage_room", "coverage_pct": 100.0}], "spillover_cameras": [{"camera_id": "camera.basement_theater", "host_room": "Basement Theater", "overlap_pct": 8.0}], "sub_zones": [{"camera_id": "camera.storage_room", "entity_id": "binary_sensor.storage_room_workout_person_occupancy", "floor": "basement", "height": 210.0, "id": "storage_room_workout", "label": "Gym / Workout Mat", "room": "Storage Room", "width": 165.0, "x": 715.0, "y": 110.0}], "uncovered_pct": 0.0}, "Upstairs Bathroom": {"ble_proxies": [{"host_room": "Margot's Room", "id": "nursery_speaker", "name": "Nursery Speaker BLE Proxy"}, {"host_room": "Office", "id": "office_speaker", "name": "Office Speaker BLE Proxy"}], "max_coverage_pct": 0.0, "pir_sensors": [{"coverage_pct": 25.0, "entity_id": "binary_sensor.upper_level_keypad_motion", "id": "binary_sensor.upper_level_keypad_motion", "name": "Upstairs Hallway Keypad PIR"}], "primary_cameras": [], "spillover_cameras": [], "sub_zones": [], "uncovered_pct": 100.0}, "Upstairs Hallway & Stairs": {"ble_proxies": [{"host_room": "Master Bedroom", "id": "master_bedroom_speaker", "name": "Master Bedroom Speaker BLE Proxy"}, {"host_room": "Margot's Room", "id": "nursery_speaker", "name": "Nursery Speaker BLE Proxy"}, {"host_room": "Office", "id": "office_speaker", "name": "Office Speaker BLE Proxy"}], "max_coverage_pct": 18.0, "pir_sensors": [{"coverage_pct": 45.0, "entity_id": "binary_sensor.upper_level_keypad_motion", "id": "binary_sensor.upper_level_keypad_motion", "name": "Upstairs Hallway Keypad PIR"}], "primary_cameras": [], "spillover_cameras": [{"camera_id": "camera.master_bedroom", "host_room": "Master Bedroom", "overlap_pct": 18.0}, {"camera_id": "camera.office", "host_room": "Office", "overlap_pct": 18.0}], "sub_zones": [], "uncovered_pct": 82.0}}, "seal_analysis": {"Basement Play Area": {"can_be_bounded": false, "monitored_doors": [], "recommended_mode": "open", "unsealed_exits": ["Family Room (stairs)", "Basement Theater (open passage)", "Storage Room (unmonitored door)", "Basement Bathroom (unmonitored door)"]}, "Basement Theater": {"can_be_bounded": false, "monitored_doors": [], "recommended_mode": "open", "unsealed_exits": ["Family Room (stairs)", "Basement Play Area (open passage)"]}, "Dining Room": {"can_be_bounded": false, "monitored_doors": [], "recommended_mode": "open", "unsealed_exits": ["Living Room (open passage)", "Kitchen (open passage)"]}, "Family Room": {"can_be_bounded": false, "monitored_doors": [], "recommended_mode": "open", "unsealed_exits": ["Front Entry (open passage)", "Kitchen (open passage)", "Garage (unmonitored door)", "Basement Play Area (stairs)", "Basement Theater (stairs)"]}, "Front Entry": {"can_be_bounded": false, "monitored_doors": [], "recommended_mode": "open", "unsealed_exits": ["Living Room (open passage)", "Kitchen (open passage)", "Family Room (open passage)", "Powder Bath (unmonitored door)", "Laundry Room (unmonitored door)", "Upstairs Hallway & Stairs (stairs)"]}, "Garage": {"can_be_bounded": false, "monitored_doors": [], "recommended_mode": "open", "unsealed_exits": ["Family Room (unmonitored door)", "Laundry Room (unmonitored door)"]}, "Guest Room": {"can_be_bounded": false, "monitored_doors": [], "recommended_mode": "open", "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)"]}, "Kitchen": {"can_be_bounded": false, "monitored_doors": [], "recommended_mode": "open", "unsealed_exits": ["Front Entry (open passage)", "Dining Room (open passage)", "Family Room (open passage)"]}, "Laundry Room": {"can_be_bounded": false, "monitored_doors": [], "recommended_mode": "open", "unsealed_exits": ["Front Entry (unmonitored door)", "Garage (unmonitored door)"]}, "Living Room": {"can_be_bounded": false, "monitored_doors": [], "recommended_mode": "open", "unsealed_exits": ["Front Entry (open passage)", "Dining Room (open passage)"]}, "Margot's Room": {"can_be_bounded": false, "monitored_doors": [], "recommended_mode": "open", "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)"]}, "Master Bathroom": {"can_be_bounded": false, "monitored_doors": [], "recommended_mode": "open", "unsealed_exits": ["Master Bedroom (unmonitored door)"]}, "Master Bedroom": {"can_be_bounded": false, "monitored_doors": [], "recommended_mode": "open", "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)", "Master W.I.C (unmonitored door)", "Master Bathroom (unmonitored door)"]}, "Master W.I.C": {"can_be_bounded": false, "monitored_doors": [], "recommended_mode": "open", "unsealed_exits": ["Master Bedroom (unmonitored door)"]}, "Office": {"can_be_bounded": false, "monitored_doors": [], "recommended_mode": "open", "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)"]}, "Powder Bath": {"can_be_bounded": false, "monitored_doors": [], "recommended_mode": "open", "unsealed_exits": ["Front Entry (unmonitored door)"]}, "Storage Room": {"can_be_bounded": false, "monitored_doors": [], "recommended_mode": "open", "unsealed_exits": ["Basement Play Area (unmonitored door)"]}, "Upstairs Bathroom": {"can_be_bounded": false, "monitored_doors": [], "recommended_mode": "open", "unsealed_exits": ["Upstairs Hallway & Stairs (unmonitored door)"]}}, "sub_zone_analysis": [{"camera_id": "camera.living_room", "entity_id": "binary_sensor.living_room_couch_person_occupancy", "floor": "main", "height": 100.0, "id": "living_room_couch", "label": "Living Room Couch", "room": "Living Room", "width": 125.0, "x": 105.0, "y": 355.0}, {"camera_id": "camera.living_room", "entity_id": "binary_sensor.living_room_floor_person_occupancy", "floor": "main", "height": 100.0, "id": "living_room_floor", "label": "Living Room Floor", "room": "Living Room", "width": 95.0, "x": 235.0, "y": 365.0}, {"camera_id": "camera.living_room", "entity_id": "binary_sensor.living_room_bay_windows_person_occupancy", "floor": "main", "height": 38.0, "id": "living_room_bay_windows", "label": "Bay Windows", "room": "Living Room", "width": 165.0, "x": 115.0, "y": 468.0}, {"camera_id": "camera.living_room", "entity_id": "binary_sensor.living_room_entry_person_occupancy", "floor": "main", "height": 80.0, "id": "living_room_entry", "label": "Front Entry Archway", "room": "Front Entry", "width": 80.0, "x": 350.0, "y": 415.0}, {"camera_id": "camera.dining_room", "entity_id": "binary_sensor.dining_room_table_person_occupancy", "floor": "main", "height": 110.0, "id": "dining_room_table", "label": "Dining Table", "room": "Dining Room", "width": 110.0, "x": 105.0, "y": 145.0}, {"camera_id": "camera.dining_room", "entity_id": "binary_sensor.rileys_food_person_occupancy", "floor": "main", "height": 42.0, "id": "rileys_food", "label": "Riley's Food Corner", "room": "Dining Room", "width": 65.0, "x": 170.0, "y": 96.0}, {"camera_id": "camera.family_room", "entity_id": "binary_sensor.family_room_couch_person_occupancy", "floor": "main", "height": 88.0, "id": "family_room_couch", "label": "Family Room Couch", "room": "Family Room", "width": 150.0, "x": 635.0, "y": 195.0}, {"camera_id": "camera.family_room", "entity_id": "binary_sensor.family_room_recliner_person_occupancy", "floor": "main", "height": 75.0, "id": "family_room_recliner", "label": "Family Room Recliner", "room": "Family Room", "width": 80.0, "x": 545.0, "y": 115.0}, {"camera_id": "camera.family_room", "entity_id": "binary_sensor.family_room_floor_person_occupancy", "floor": "main", "height": 88.0, "id": "family_room_floor", "label": "Family Room Floor", "room": "Family Room", "width": 85.0, "x": 545.0, "y": 195.0}, {"camera_id": "camera.family_room", "entity_id": "binary_sensor.kitchen_island_person_occupancy", "floor": "main", "height": 95.0, "id": "kitchen_island", "label": "Kitchen Island", "room": "Kitchen", "width": 120.0, "x": 335.0, "y": 155.0}, {"camera_id": "camera.garage", "entity_id": "binary_sensor.garage_parking_person_occupancy", "floor": "main", "height": 108.0, "id": "garage_parking", "label": "Garage Parking Bay", "room": "Garage", "width": 170.0, "x": 595.0, "y": 438.0}, {"camera_id": "camera.master_bedroom", "entity_id": "binary_sensor.master_bed_person_occupancy", "floor": "upstairs", "height": 155.0, "id": "master_bed", "label": "Master Bed", "room": "Master Bedroom", "width": 135.0, "x": 134.0, "y": 250.0}, {"camera_id": "camera.master_bedroom", "entity_id": "binary_sensor.master_open_area_person_occupancy", "floor": "upstairs", "height": 165.0, "id": "master_open_area", "label": "Master Open Floor", "room": "Master Bedroom", "width": 145.0, "x": 140.0, "y": 55.0}, {"camera_id": "camera.master_bedroom", "entity_id": "binary_sensor.master_bedroom_walkway_person_occupancy", "floor": "upstairs", "height": 220.0, "id": "master_bedroom_walkway", "label": "Master Walkway", "room": "Master Bedroom", "width": 68.0, "x": 278.0, "y": 225.0}, {"camera_id": "camera.master_bedroom", "entity_id": "binary_sensor.master_bedroom_entryway_person_occupancy", "floor": "upstairs", "height": 56.0, "id": "master_bedroom_entryway", "label": "Master Hallway Entry", "room": "Master Bedroom", "width": 48.0, "x": 305.0, "y": 256.0}, {"camera_id": "camera.master_bedroom", "entity_id": "binary_sensor.master_bathroom_person_occupancy", "floor": "upstairs", "height": 56.0, "id": "master_bathroom", "label": "Master Bath Doorway", "room": "Master Bathroom", "width": 55.0, "x": 425.0, "y": 486.0}, {"camera_id": "camera.nursery", "entity_id": "binary_sensor.nursery_bed_person_occupancy", "floor": "upstairs", "height": 115.0, "id": "nursery_bed", "label": "Nursery Bed", "room": "Margot's Room", "width": 125.0, "x": 370.0, "y": 95.0}, {"camera_id": "camera.office", "entity_id": "binary_sensor.steves_desk_person_occupancy", "floor": "upstairs", "height": 95.0, "id": "steves_desk", "label": "Steve's Desk", "room": "Office", "width": 105.0, "x": 745.0, "y": 360.0}, {"camera_id": "camera.office", "entity_id": "binary_sensor.sim_rig_person_occupancy", "floor": "upstairs", "height": 95.0, "id": "sim_rig", "label": "Sim Rig", "room": "Office", "width": 65.0, "x": 680.0, "y": 425.0}, {"camera_id": "camera.office", "entity_id": "binary_sensor.office_floor_person_occupancy", "floor": "upstairs", "height": 95.0, "id": "office_floor", "label": "Office Center Floor", "room": "Office", "width": 95.0, "x": 685.0, "y": 310.0}, {"camera_id": "camera.office", "entity_id": "binary_sensor.office_entryway_person_occupancy", "floor": "upstairs", "height": 55.0, "id": "office_entryway", "label": "Office Doorway", "room": "Office", "width": 45.0, "x": 665.0, "y": 258.0}, {"camera_id": "camera.basement_theater", "entity_id": "binary_sensor.basement_theater_couch_person_occupancy", "floor": "basement", "height": 165.0, "id": "basement_theater_couch", "label": "Theater Couch", "room": "Basement Theater", "width": 165.0, "x": 150.0, "y": 235.0}, {"camera_id": "camera.basement_theater", "entity_id": "binary_sensor.basement_theater_playpen_person_occupancy", "floor": "basement", "height": 75.0, "id": "basement_theater_playpen", "label": "Ballpit / Playpen", "room": "Basement Theater", "width": 165.0, "x": 160.0, "y": 50.0}, {"camera_id": "camera.basement_theater", "entity_id": "binary_sensor.basement_theater_floor_person_occupancy", "floor": "basement", "height": 90.0, "id": "basement_theater_floor", "label": "Theater Floor", "room": "Basement Theater", "width": 165.0, "x": 160.0, "y": 135.0}, {"camera_id": "camera.basement_theater", "entity_id": "binary_sensor.basement_bar_person_occupancy", "floor": "basement", "height": 140.0, "id": "basement_bar", "label": "Basement Wet Bar", "room": "Basement Play Area", "width": 150.0, "x": 365.0, "y": 55.0}, {"camera_id": "camera.basement_theater", "entity_id": "binary_sensor.basement_play_area_far_person_occupancy", "floor": "basement", "height": 175.0, "id": "basement_play_area_far", "label": "Play Area East", "room": "Basement Play Area", "width": 190.0, "x": 370.0, "y": 230.0}, {"camera_id": "camera.basement_theater", "entity_id": "binary_sensor.basement_stairwell_person_occupancy", "floor": "basement", "height": 105.0, "id": "basement_stairwell", "label": "Basement Stairwell", "room": "Basement Play Area", "width": 75.0, "x": 495.0, "y": 415.0}, {"camera_id": "camera.basement_play_area", "entity_id": "binary_sensor.basement_play_floor_person_occupancy", "floor": "basement", "height": 220.0, "id": "basement_play_floor", "label": "Play Area Main Floor", "room": "Basement Play Area", "width": 195.0, "x": 365.0, "y": 225.0}, {"camera_id": "camera.basement_play_area", "entity_id": "binary_sensor.basement_counter_person_occupancy", "floor": "basement", "height": 140.0, "id": "basement_counter", "label": "Wet Bar Counter", "room": "Basement Play Area", "width": 150.0, "x": 365.0, "y": 60.0}, {"camera_id": "camera.basement_play_area", "entity_id": "binary_sensor.theater_rear_view_person_occupancy", "floor": "basement", "height": 175.0, "id": "theater_rear_view", "label": "Theater Rear View", "room": "Basement Theater", "width": 185.0, "x": 135.0, "y": 230.0}, {"camera_id": "camera.storage_room", "entity_id": "binary_sensor.storage_room_workout_person_occupancy", "floor": "basement", "height": 210.0, "id": "storage_room_workout", "label": "Gym / Workout Mat", "room": "Storage Room", "width": 165.0, "x": 715.0, "y": 110.0}]};

const PDD_DEVICE_MODEL_PRESETS = {"apollo_msr_2": {"category": "pir_motion", "cooldown_sec": 5, "default_range_px": 300, "description": "24GHz mmWave radar presence sensor.", "device_type": "pir_motion", "fov_deg": 110, "id": "apollo_msr_2", "label": "Apollo MSR-2 / LD2410 mmWave (110\u00b0)", "manufacturer": "Apollo Automation", "model": "MSR-2 (HLK-LD2410B)", "name": "Apollo MSR-2 / LD2410 mmWave (110\u00b0)", "range_ft": 19.0, "range_m": 5.8}, "aqara_fp2_mmwave": {"category": "pir_motion", "cooldown_sec": 5, "default_range_px": 340, "description": "Wide 120\u00b0 multi-zone 60GHz mmWave radar presence sensor.", "device_type": "pir_motion", "fov_deg": 120, "id": "aqara_fp2_mmwave", "label": "Aqara FP2 60GHz mmWave Radar (120\u00b0)", "manufacturer": "Aqara", "model": "PS-S02D (FP2)", "name": "Aqara FP2 60GHz mmWave Radar (120\u00b0)", "range_ft": 21.5, "range_m": 6.5}, "ecobee_smart_sensor": {"category": "pir_motion", "cooldown_sec": 1800, "default_range_px": 230, "description": "110\u00b0 horizontal thermal PIR occupancy/motion sensor (15 ft / 4.5 m range).", "device_type": "pir_motion", "fov_deg": 110, "id": "ecobee_smart_sensor", "label": "Ecobee SmartSensor (110\u00b0 Thermal PIR)", "manufacturer": "ecobee", "model": "SmartSensor / Room Sensor", "name": "Ecobee SmartSensor (110\u00b0 Thermal PIR)", "range_ft": 15.0, "range_m": 4.5}, "google_home_speaker_ble": {"category": "ble_proxy", "description": "Indoor smart speaker Bluetooth Low Energy RSSI anchor.", "device_type": "ble_proxy", "id": "google_home_speaker_ble", "label": "Google Home / Nest Speaker BLE Proxy", "name": "Google Home / Nest Speaker BLE Proxy", "radius_px": 210}, "ikea_vallhorn_pir": {"category": "pir_motion", "cooldown_sec": 60, "default_range_px": 260, "description": "Zigbee 3.0 dual-lobe Fresnel PIR: 120\u00b0 wide-angle peripheral zone to 5m (16.4 ft / 260px) plus 60\u00b0 center beam reaching 10m (32.8 ft / 520px).", "device_type": "pir_motion", "fov_deg": 120, "id": "ikea_vallhorn_pir", "inner_fov_deg": 60, "inner_range_ft": 32.8, "inner_range_m": 10.0, "inner_range_px": 520, "label": "IKEA VALLHORN Wireless Motion Sensor (120\u00b0/5m + 60\u00b0/10m)", "manufacturer": "IKEA of Sweden", "model": "VALLHORN E2134 (405.043.48)", "name": "IKEA VALLHORN Wireless Motion Sensor (120\u00b0/5m + 60\u00b0/10m Dual-Lobe PIR)", "range_ft": 16.4, "range_m": 5.0}, "ratgdo_pir": {"category": "pir_motion", "cooldown_sec": 60, "default_range_px": 175, "description": "Garage door wall control panel motion sensor.", "device_type": "pir_motion", "fov_deg": 100, "id": "ratgdo_pir", "label": "ratgdo v2.5i Garage Opener PIR (100\u00b0)", "manufacturer": "ratgdo", "model": "v2.5i Security+ Wall Panel", "name": "ratgdo v2.5i Garage Opener PIR (100\u00b0)", "range_ft": 11.0, "range_m": 3.4}, "reolink_rlc_810a": {"category": "camera", "default_range_px": 500, "description": "4K PoE bullet camera with 87\u00b0 horizontal field of view.", "device_type": "camera", "fov_deg": 87, "horizontal_fov_deg": 87, "id": "reolink_rlc_810a", "label": "Reolink RLC-810A / PoE Bullet (87\u00b0 FOV)", "mount_pitch_deg": 15, "name": "Reolink RLC-810A / PoE Bullet (87\u00b0 FOV)", "vertical_fov_deg": 47}, "ring_alarm_pir_gen2": {"category": "pir_motion", "cooldown_sec": 60, "default_range_px": 260, "description": "90\u00b0 corner/wall Z-Wave PIR motion detector.", "device_type": "pir_motion", "fov_deg": 90, "id": "ring_alarm_pir_gen2", "label": "Ring Alarm Motion Detector Gen 2 (90\u00b0 PIR)", "manufacturer": "Ring", "model": "4SP1SZ (Gen 2 Z-Wave)", "name": "Ring Alarm Motion Detector Gen 2 (90\u00b0 PIR)", "range_ft": 16.5, "range_m": 5.0}, "ring_contact_sensor": {"actuation_gap_mm": 25, "category": "door_contact", "description": "Z-Wave perimeter door and window magnetic reed contact sensor.", "device_type": "door_contact", "id": "ring_contact_sensor", "label": "Ring Alarm Contact Sensor Gen 2 (Z-Wave)", "manufacturer": "Ring", "model": "5AT2S2 (Gen 2 Z-Wave)", "name": "Ring Alarm Contact Sensor Gen 2 (Z-Wave Reed)", "response_ms": 200}, "ring_keypad_pir": {"category": "pir_motion", "cooldown_sec": 30, "default_range_px": 165, "description": "Short-range proximity PIR built into wall keypad.", "device_type": "pir_motion", "fov_deg": 100, "id": "ring_keypad_pir", "label": "Ring Alarm Keypad Proximity PIR (100\u00b0)", "manufacturer": "Ring", "model": "4AK1SZ Keypad", "name": "Ring Alarm Keypad Proximity PIR (100\u00b0)", "range_ft": 10.5, "range_m": 3.2}, "tapo_c110_corner": {"category": "camera", "default_range_px": 560, "description": "Standard 110\u00b0 wide-angle corner or upper-wall mount covering both adjacent walls.", "device_type": "camera", "fov_deg": 110, "horizontal_fov_deg": 110, "id": "tapo_c110_corner", "label": "TP-Link Tapo C110 (Corner / Wall Mount)", "mount_pitch_deg": 15, "name": "TP-Link Tapo C110 (Corner / Wall Mount)", "vertical_fov_deg": 62}, "tapo_c110_overhead": {"category": "camera", "default_range_px": 250, "description": "Same Tapo C110 110\u00b0 sensor pitched steeply down (~62\u00b0) on a flat wall (e.g., Garage), widening the near-wall 2D floor footprint to 164\u00b0.", "device_type": "camera", "fov_deg": 164, "horizontal_fov_deg": 110, "id": "tapo_c110_overhead", "label": "TP-Link Tapo C110 (High Steep Downward Pitch)", "mount_pitch_deg": 62, "name": "TP-Link Tapo C110 (High Steep Downward Pitch)", "vertical_fov_deg": 62}, "unifi_g4_instant": {"category": "camera", "default_range_px": 450, "description": "Compact wide-angle Wi-Fi camera with 102\u00b0 horizontal field of view.", "device_type": "camera", "fov_deg": 102, "horizontal_fov_deg": 102, "id": "unifi_g4_instant", "label": "UniFi Protect G4/G5 Instant (102\u00b0 FOV)", "mount_pitch_deg": 15, "name": "UniFi Protect G4/G5 Instant (102\u00b0 FOV)", "vertical_fov_deg": 55}, "wyze_sense_contact": {"actuation_gap_mm": 20, "category": "door_contact", "description": "Ultra-compact 915MHz magnetic door/window reed contact sensor (<=20mm actuation gap) via WyzeSense2MQTT bridge.", "device_type": "door_contact", "id": "wyze_sense_contact", "label": "Wyze Sense Contact Sensor v1 (915MHz Reed)", "manufacturer": "Wyze", "model": "WYZESENSE-CONTACT (WYZEC1)", "name": "Wyze Sense Contact Sensor v1 (915MHz Magnetic Reed)", "response_ms": 150}, "wyze_sense_pir": {"category": "pir_motion", "cooldown_sec": 45, "default_range_px": 405, "description": "915MHz ultra-compact 120\u00b0 wide-angle PIR motion sensor with downward-slanted Fresnel lens and 25-26 ft (7.8m / 405px) range.", "device_type": "pir_motion", "fov_deg": 120, "id": "wyze_sense_pir", "label": "Wyze Sense Motion Sensor v1 (120\u00b0 PIR, 26 ft)", "manufacturer": "Wyze", "model": "WYZESENSE-PIR (WYZEMS1)", "mount_pitch_deg": 12, "name": "Wyze Sense Motion Sensor v1 (120\u00b0 Wide PIR, 26 ft / 7.8m)", "range_ft": 25.5, "range_m": 7.8}};

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
    this._underlayOpacity = 0.88;
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
      const saved = window.localStorage.getItem("pdd_floorplan_layout_v4");
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
    const roomList = rooms || [];
    if (roomList.length > 0 && this._floorplan && this._floorplan.floor_wall_segments) {
      const floorId = roomList[0].floor || "main";
      const calibrated = this._floorplan.floor_wall_segments[floorId];
      if (Array.isArray(calibrated) && calibrated.length > 0) {
        const defRooms = (PDD_DEFAULT_FLOORPLAN.rooms || []).filter((r) => (r.floor || "main") === floorId);
        const matchesDefault =
          defRooms.length === roomList.length &&
          roomList.every((r) => {
            const dr = defRooms.find((d) => (d.id && d.id === r.id) || (d.name || d.room_name) === (r.name || r.room_name));
            return (
              dr &&
              Number(r.x) === Number(dr.x) &&
              Number(r.y) === Number(dr.y) &&
              Number(r.width ?? r.w) === Number(dr.width ?? dr.w) &&
              Number(r.height ?? r.h) === Number(dr.height ?? dr.h)
            );
          });
        if (matchesDefault) {
          return calibrated;
        }
      }
    }
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

    const preset =
      typeof PDD_DEVICE_MODEL_PRESETS !== "undefined" && cam.model_preset
        ? PDD_DEVICE_MODEL_PRESETS[cam.model_preset] || {}
        : {};
    const innerFov = Number(cam.inner_fov_deg || preset.inner_fov_deg || 0);
    const innerReach = Number(cam.inner_range_px || preset.inner_range_px || 0);
    const hasDualLobe = innerFov > 0 && innerFov < fov && innerReach > reach;
    const maxReach = hasDualLobe ? Math.max(reach, innerReach) : reach;

    const startDeg = heading - fov / 2.0;
    const endDeg = heading + fov / 2.0;

    const angleSet = new Set();
    const numSteps = Math.max(8, Math.ceil(fov / stepDeg));
    for (let i = 0; i <= numSteps; i++) {
      angleSet.add(Number((startDeg + (i / numSteps) * fov).toFixed(3)));
    }

    if (hasDualLobe) {
      const lobeLeft = heading - innerFov / 2.0;
      const lobeRight = heading + innerFov / 2.0;
      [lobeLeft, lobeRight].forEach((edgeDeg) => {
        angleSet.add(Number((edgeDeg - 0.05).toFixed(3)));
        angleSet.add(Number(edgeDeg.toFixed(3)));
        angleSet.add(Number((edgeDeg + 0.05).toFixed(3)));
      });
    }

    if (Array.isArray(solidSegments)) {
      solidSegments.forEach(([[x1, y1], [x2, y2]]) => {
        [[x1, y1], [x2, y2]].forEach(([px, py]) => {
          const dx = px - cx;
          const dy = py - cy;
          const dist = Math.hypot(dx, dy);
          if (dist < 1e-3 || dist > maxReach * 1.5) return;
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
      const rayReach =
        hasDualLobe && Math.abs(deg - heading) <= innerFov / 2.0 + 1e-3 ? innerReach : reach;
      let minT = rayReach;
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
          window.localStorage.setItem("pdd_floorplan_layout_v4", JSON.stringify(this._floorplan));
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
          window.localStorage.removeItem("pdd_floorplan_layout_v4");
          window.localStorage.removeItem("pdd_floorplan_layout_v1");
        } catch (_e) {}
        this._compiledTopology = this._compileFloorplanClient(this._floorplan);
        this.render();
        this.showToast("Reset floorplan to default layout", "info");
        return;
      }
      try {
        window.localStorage.setItem("pdd_floorplan_layout_v4", JSON.stringify(this._floorplan));
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
          window.localStorage.setItem("pdd_floorplan_layout_v4", JSON.stringify(this._floorplan));
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

        let strokeColor = isSel ? "#0284c7" : "#0284c7";
        let fillColor = isSel ? "rgba(2, 132, 199, 0.16)" : "rgba(2, 132, 199, 0.08)";
        if (isOcc) {
          strokeColor = "#16a34a";
          fillColor = "rgba(22, 163, 74, 0.18)";
        } else if (hasBlindSpot) {
          strokeColor = "#d97706";
          fillColor = "rgba(245, 158, 11, 0.12)";
        } else if (isTransit) {
          strokeColor = "#64748b";
          fillColor = "rgba(100, 116, 139, 0.10)";
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

        const roomShapeSvg = box.svg_path
          ? `<path
              class="fp-room-rect"
              data-room-name="${this._escape(rName)}"
              d="${this._escape(box.svg_path)}"
              fill="${fillColor}"
              stroke="${strokeColor}"
              stroke-width="${isSel ? "2.5" : "1.6"}"
              stroke-dasharray="${isTransit ? "4,4" : "none"}"
              style="${isRoomMode ? "cursor:move;pointer-events:all;" : "pointer-events:none;"}"
            />`
          : `<rect
              class="fp-room-rect"
              data-room-name="${this._escape(rName)}"
              x="${rx}"
              y="${ry}"
              width="${rw}"
              height="${rh}"
              rx="6"
              fill="${fillColor}"
              stroke="${strokeColor}"
              stroke-width="${isSel ? "2.5" : "1.6"}"
              stroke-dasharray="${isTransit ? "4,4" : "none"}"
              style="${isRoomMode ? "cursor:move;pointer-events:all;" : "pointer-events:none;"}"
            />`;

        return `
          <g class="fp-room-box" data-room-name="${this._escape(rName)}" style="${isRoomMode ? "" : "pointer-events:none;"}">
            ${roomShapeSvg}
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
          preserveAspectRatio="xMidYMid meet"
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
                <select class="select" id="fp-cam-select" style="margin-bottom:8px;">
                  ${fCams
                    .map((c) => {
                      const cid = c.id || c.camera_entity;
                      return `<option value="${this._escape(cid)}" ${
                        cid === selCamId ? "selected" : ""
                      }>${this._escape(c.name || cid)}</option>`;
                    })
                    .join("")}
                </select>
                <div style="margin-bottom:8px;">
                  <small style="display:block;margin-bottom:2px;color:var(--ha-muted);">Hardware Model Preset (auto-sets FOV &amp; Range)</small>
                  <select class="select" id="fp-cam-preset-select" style="font-size:12px;">
                    <option value="">Custom / Manual FOV (${Number(selCam.fov_deg)}°)</option>
                    ${Object.values(typeof PDD_DEVICE_MODEL_PRESETS !== "undefined" ? PDD_DEVICE_MODEL_PRESETS : {})
                      .filter((p) => (p.category || p.device_type) === "camera")
                      .map(
                        (p) =>
                          `<option value="${this._escape(p.id)}" ${
                            selCam.model_preset === p.id ? "selected" : ""
                          }>${this._escape(p.label || p.name)} — ${Number(p.fov_deg)}° FOV</option>`
                      )
                      .join("")}
                  </select>
                </div>
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
                <div style="margin-bottom:8px;">
                  <small style="display:block;margin-bottom:2px;color:var(--ha-muted);">Sensor Hardware Preset (auto-sets specs, FOV &amp; Range)</small>
                  <select class="select" id="fp-sensor-preset-select" style="font-size:12px;">
                    <option value="">Custom / Manual (${
                      selSensor.sensor_type === "door_contact"
                        ? "Contact Sensor"
                        : `${Number(selSensor.fov_deg || 110)}° FOV`
                    })</option>
                    ${Object.values(typeof PDD_DEVICE_MODEL_PRESETS !== "undefined" ? PDD_DEVICE_MODEL_PRESETS : {})
                      .filter(
                        (p) =>
                          (p.category || p.device_type) ===
                          (selSensor.sensor_type === "door_contact" ? "door_contact" : "pir_motion")
                      )
                      .map(
                        (p) =>
                          `<option value="${this._escape(p.id)}" ${
                            selSensor.model_preset === p.id ? "selected" : ""
                          }>${this._escape(p.label || p.name)}${
                            p.fov_deg ? ` — ${Number(p.fov_deg)}° FOV` : ""
                          }</option>`
                      )
                      .join("")}
                  </select>
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
        const strokeColor = isNegLocalized ? "#7c3aed" : isOcc ? "#16a34a" : "#0284c7";
        const fillColor = isNegLocalized
          ? "rgba(124, 58, 237, 0.18)"
          : isOcc
          ? "rgba(22, 163, 74, 0.18)"
          : "rgba(2, 132, 199, 0.08)";
        const rx = Number(box.x);
        const ry = Number(box.y);
        const rw = Number(box.width ?? 200);
        const rh = Number(box.height ?? 150);
        const locLabel = est.subregion || est.inferred_location || (isOcc ? "Occupied" : "Clear");
        const maxTitleChars = Math.max(8, Math.floor((rw - 20) / 7.2));
        const maxLocChars = Math.max(10, Math.floor((rw - 20) / 6.2));
        const pbShape = box.svg_path
          ? `<path d="${this._escape(box.svg_path)}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${isOcc ? "2.5" : "1.5"}" />`
          : `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" rx="6" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${isOcc ? "2.5" : "1.5"}" />`;
        return `
          <g>
            ${pbShape}
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
              ${
                typeof PDD_FLOOR_UNDERLAYS !== "undefined" && PDD_FLOOR_UNDERLAYS[activeFloor.id] && this._showBlueprintUnderlay
                  ? `<image href="${PDD_FLOOR_UNDERLAYS[activeFloor.id].url}" x="${PDD_FLOOR_UNDERLAYS[activeFloor.id].x}" y="${PDD_FLOOR_UNDERLAYS[activeFloor.id].y}" width="${PDD_FLOOR_UNDERLAYS[activeFloor.id].width}" height="${PDD_FLOOR_UNDERLAYS[activeFloor.id].height}" opacity="${this._underlayOpacity}" preserveAspectRatio="xMidYMid meet" style="pointer-events:none;" />`
                  : ""
              }
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
    root.querySelector("#fp-cam-preset-select")?.addEventListener("change", (e) => {
      const presetId = e.target.value;
      const preset = typeof PDD_DEVICE_MODEL_PRESETS !== "undefined" ? PDD_DEVICE_MODEL_PRESETS[presetId] : null;
      const fCams = (this._floorplan?.cameras || []).filter(
        (c) => (c.floor || "main") === this._selectedFloorId
      );
      const selCamId =
        this._selectedCamEntity ||
        root.querySelector("#fp-cam-select")?.value ||
        (fCams[0]?.id || fCams[0]?.camera_entity);
      const cam = (this._floorplan?.cameras || []).find(
        (c) => (c.id || c.camera_entity) === selCamId
      );
      if (!cam) return;
      if (preset) {
        cam.model_preset = preset.id;
        cam.fov_deg = Number(preset.fov_deg);
        if (preset.default_range_px && !cam.range_px) {
          cam.range_px = Number(preset.default_range_px);
        }
        this.showToast(`Applied ${preset.label} preset (${preset.fov_deg}° FOV)`, "info");
      } else {
        delete cam.model_preset;
      }
      this._compiledTopology = this._compileFloorplanClient(this._floorplan);
      this._debounceSaveFloorplan();
      this.render();
    });
    root.querySelector("#fp-sensor-preset-select")?.addEventListener("change", (e) => {
      const presetId = e.target.value;
      const preset = typeof PDD_DEVICE_MODEL_PRESETS !== "undefined" ? PDD_DEVICE_MODEL_PRESETS[presetId] : null;
      const fSensors = (this._floorplan?.sensors || []).filter(
        (s) => (s.floor || "main") === this._selectedFloorId
      );
      const selSenId =
        this._selectedSensorId ||
        root.querySelector("#fp-sensor-select")?.value ||
        fSensors[0]?.id;
      const sen = (this._floorplan?.sensors || []).find((s) => s.id === selSenId);
      if (!sen) return;
      if (preset) {
        sen.model_preset = preset.id;
        if (preset.fov_deg) {
          sen.fov_deg = Number(preset.fov_deg);
        }
        if (preset.default_range_px) {
          sen.range_px = Number(preset.default_range_px);
        }
        if (preset.inner_fov_deg && preset.inner_range_px) {
          sen.inner_fov_deg = Number(preset.inner_fov_deg);
          sen.inner_range_px = Number(preset.inner_range_px);
        } else {
          delete sen.inner_fov_deg;
          delete sen.inner_range_px;
        }
        const label = preset.label || preset.name || preset.id;
        this.showToast(
          preset.fov_deg ? `Applied ${label} (${preset.fov_deg}° FOV)` : `Applied ${label}`,
          "info"
        );
      } else {
        delete sen.model_preset;
        delete sen.inner_fov_deg;
        delete sen.inner_range_px;
      }
      this._compiledTopology = this._compileFloorplanClient(this._floorplan);
      this._debounceSaveFloorplan();
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
        delete box.svg_path;
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
          if (drag.hasMoved) delete box.svg_path;
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
          if (drag.hasMoved) delete box.svg_path;
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
