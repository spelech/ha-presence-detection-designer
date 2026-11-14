/**
 * Presence Detection Designer — Clean Home Assistant Material Design Panel
 * Custom Element: <presence-detection-designer-panel>
 */

const PDD_DEFAULT_FLOORPLAN = {"version":5,"canvas":{"width":1000,"height":580},"floor_wall_segments":{"upstairs":[[[126,32],[874,32]],[[874,32],[874,548]],[[126,548],[874,548]],[[126,32],[126,548]],[[353,32],[353,256]],[[353,312],[353,484]],[[563,32],[563,143]],[[563,143],[610,143]],[[610,32],[610,42]],[[610,130],[610,254]],[[563,143],[563,152]],[[563,242],[563,254]],[[353,254],[508,254]],[[508,254],[508,258]],[[508,258],[558,258]],[[558,258],[558,254]],[[558,254],[612,254]],[[662,254],[874,254]],[[353,316],[368,316]],[[446,316],[508,316]],[[553,316],[610,316]],[[353,355],[462,355]],[[462,316],[462,449]],[[353,484],[398,484]],[[398,484],[440,484]],[[440,449],[560,449]],[[560,417],[610,417]],[[560,417],[560,449]],[[610,316],[610,548]],[[440,449],[440,498]],[[440,544],[440,548]],[[671,254],[671,258]],[[671,258],[665,258]],[[665,258],[665,315]],[[665,315],[671,315]],[[671,315],[671,548]],[[735,254],[735,296]],[[735,296],[750,296]],[[858,296],[874,296]]],"main":[[[68,87],[832,87]],[[68,87],[68,508]],[[68,508],[534,508]],[[832,87],[832,290]],[[251,87],[251,190]],[[251,250],[251,290]],[[68,290],[96,290]],[[212,290],[251,290]],[[251,290],[410,290]],[[341,290],[341,418]],[[410,290],[410,345]],[[341,382],[410,382]],[[410,382],[410,418]],[[341,502],[341,508]],[[534,290],[832,290]],[[534,290],[534,300]],[[534,348],[534,508]],[[708,290],[708,421]],[[534,421],[832,421]],[[534,421],[534,555]],[[832,421],[832,555]],[[534,555],[832,555]]],"basement":[[[93,42],[695,42]],[[93,42],[93,532]],[[93,478],[130,478]],[[220,478],[265,478]],[[355,478],[430,478]],[[430,478],[445,495]],[[445,495],[445,532]],[[93,532],[635,532]],[[572,230],[572,532]],[[635,410],[635,532]],[[524,42],[524,135]],[[524,135],[575,135]],[[620,135],[695,135]],[[572,230],[695,230]],[[695,42],[695,145]],[[695,215],[695,360]],[[695,42],[915,42]],[[915,42],[915,360]],[[695,360],[915,360]]]},"floors":[{"id":"upstairs","name":"Upstairs Level","order":0,"underlay_svg":{"url":"/presence_detection_designer_static/floor_upstairs.webp?v=4","x":114,"y":20,"width":772,"height":540}},{"id":"main","name":"Main Floor","order":1,"underlay_svg":{"url":"/presence_detection_designer_static/floor_main.webp?v=4","x":60,"y":30,"width":784,"height":520}},{"id":"basement","name":"Basement Level","order":2,"underlay_svg":{"url":"/presence_detection_designer_static/floor_basement.webp?v=4","x":80,"y":30,"width":620,"height":520}}],"cameras":[{"id":"camera.living_room","name":"Living Room Camera","floor":"main","host_room":"Living Room","model_preset":"tapo_c110_corner","x":76,"y":335,"heading_deg":30,"fov_deg":110,"range_px":520,"spills_into":["Front Entry"],"notes":"Mounted on West wall below Dining opening; sees North cube shelf wall, Foyer archway/stairs, and South bay windows.","zones":["living_room_couch","living_room_floor","living_room_bay_windows","living_room_entry"],"sub_zones":[{"id":"living_room_couch","entity_id":"binary_sensor.living_room_couch_person_occupancy","label":"Living Room Couch","room":"Living Room","x":105,"y":355,"width":125,"height":100},{"id":"living_room_floor","entity_id":"binary_sensor.living_room_floor_person_occupancy","label":"Living Room Floor","room":"Living Room","x":235,"y":365,"width":95,"height":100},{"id":"living_room_bay_windows","entity_id":"binary_sensor.living_room_bay_windows_person_occupancy","label":"Bay Windows","room":"Living Room","x":115,"y":468,"width":165,"height":38},{"id":"living_room_entry","entity_id":"binary_sensor.living_room_entry_person_occupancy","label":"Front Entry Archway","room":"Front Entry","x":350,"y":415,"width":80,"height":80}]},{"id":"camera.dining_room","name":"Dining Room Camera","floor":"main","host_room":"Dining Room","model_preset":"tapo_c110_corner","x":242,"y":96,"heading_deg":128,"fov_deg":110,"range_px":320,"spills_into":["Living Room"],"notes":"Upper-right corner of Dining Room looking SW across dining table and through wide opening into Living Room.","zones":["dining_room_table","rileys_food"],"sub_zones":[{"id":"dining_room_table","entity_id":"binary_sensor.dining_room_table_person_occupancy","label":"Dining Table","room":"Dining Room","x":105,"y":145,"width":110,"height":110},{"id":"rileys_food","entity_id":"binary_sensor.rileys_food_person_occupancy","label":"Riley's Food Corner","room":"Dining Room","x":170,"y":96,"width":65,"height":42}]},{"id":"camera.family_room","name":"Family Room Camera","floor":"main","host_room":"Family Room","model_preset":"tapo_c110_corner","x":818,"y":96,"heading_deg":142,"fov_deg":110,"range_px":620,"spills_into":["Kitchen","Front Entry"],"notes":"Mounted on North wall to the right of the right window looking left across Family Room, green South couch wall, and Kitchen.","zones":["family_room_couch","family_room_recliner","family_room_floor","kitchen_island"],"sub_zones":[{"id":"family_room_couch","entity_id":"binary_sensor.family_room_couch_person_occupancy","label":"Family Room Couch","room":"Family Room","x":635,"y":195,"width":150,"height":88},{"id":"family_room_recliner","entity_id":"binary_sensor.family_room_recliner_person_occupancy","label":"Family Room Recliner","room":"Family Room","x":545,"y":115,"width":80,"height":75},{"id":"family_room_floor","entity_id":"binary_sensor.family_room_floor_person_occupancy","label":"Family Room Floor","room":"Family Room","x":545,"y":195,"width":85,"height":88},{"id":"kitchen_island","entity_id":"binary_sensor.kitchen_island_person_occupancy","label":"Kitchen Island","room":"Kitchen","x":335,"y":155,"width":120,"height":95}]},{"id":"camera.garage","name":"Garage Camera","floor":"main","host_room":"Garage","model_preset":"tapo_c110_overhead","x":680,"y":423,"heading_deg":90,"fov_deg":164,"range_px":250,"spills_into":[],"notes":"Mounted high on North interior wall pointing steeply down, covering nearly the full North wall and parking bay.","zones":["garage_parking"],"sub_zones":[{"id":"garage_parking","entity_id":"binary_sensor.garage_parking_person_occupancy","label":"Garage Parking Bay","room":"Garage","x":595,"y":438,"width":170,"height":108}]},{"id":"camera.master_bedroom","name":"Master Bedroom Camera","floor":"upstairs","host_room":"Master Bedroom","model_preset":"tapo_c110_corner","x":134,"y":536,"heading_deg":313,"fov_deg":110,"range_px":620,"spills_into":["Upstairs Hallway & Stairs","Master Bathroom"],"notes":"Lower-left corner of Master Bedroom looking NE; hugs West headboard wall, clips W.I.C, and sees into Master Bath & Hallway doors.","zones":["master_bed","master_open_area","master_bedroom_walkway","master_bedroom_entryway","master_bathroom"],"sub_zones":[{"id":"master_bed","entity_id":"binary_sensor.master_bed_person_occupancy","label":"Master Bed","room":"Master Bedroom","x":134,"y":250,"width":135,"height":155},{"id":"master_open_area","entity_id":"binary_sensor.master_open_area_person_occupancy","label":"Master Open Floor","room":"Master Bedroom","x":140,"y":55,"width":145,"height":165},{"id":"master_bedroom_walkway","entity_id":"binary_sensor.master_bedroom_walkway_person_occupancy","label":"Master Walkway","room":"Master Bedroom","x":278,"y":225,"width":68,"height":220},{"id":"master_bedroom_entryway","entity_id":"binary_sensor.master_bedroom_entryway_person_occupancy","label":"Master Hallway Entry","room":"Master Bedroom","x":305,"y":256,"width":48,"height":56},{"id":"master_bathroom","entity_id":"binary_sensor.master_bathroom_person_occupancy","label":"Master Bath Doorway","room":"Master Bathroom","x":425,"y":486,"width":55,"height":56}]},{"id":"camera.nursery","name":"Nursery Camera","floor":"upstairs","host_room":"Margot's Room","model_preset":"tapo_c110_corner","x":358,"y":246,"heading_deg":311,"fov_deg":110,"range_px":340,"spills_into":[],"notes":"Lower-left corner of Nursery looking NE; sees West wall posters, bed, dresser, open East reach-in closet, and hallway door.","zones":["nursery_bed"],"sub_zones":[{"id":"nursery_bed","entity_id":"binary_sensor.nursery_bed_person_occupancy","label":"Nursery Bed","room":"Margot's Room","x":370,"y":95,"width":125,"height":115}]},{"id":"camera.office","name":"Office Camera","floor":"upstairs","host_room":"Office","model_preset":"tapo_c110_corner","x":678,"y":538,"heading_deg":313,"fov_deg":110,"range_px":380,"spills_into":["Upstairs Hallway & Stairs"],"notes":"Lower-left corner of Office looking NE; sees West wall and Office door, open North closet, Steve's desk, and sim rig.","zones":["steves_desk","sim_rig","office_floor","office_entryway"],"sub_zones":[{"id":"steves_desk","entity_id":"binary_sensor.steves_desk_person_occupancy","label":"Steve's Desk","room":"Office","x":745,"y":360,"width":105,"height":95},{"id":"sim_rig","entity_id":"binary_sensor.sim_rig_person_occupancy","label":"Sim Rig","room":"Office","x":680,"y":425,"width":65,"height":95},{"id":"office_floor","entity_id":"binary_sensor.office_floor_person_occupancy","label":"Office Center Floor","room":"Office","x":685,"y":310,"width":95,"height":95},{"id":"office_entryway","entity_id":"binary_sensor.office_entryway_person_occupancy","label":"Office Doorway","room":"Office","x":665,"y":258,"width":45,"height":55}]},{"id":"camera.basement_theater","name":"Basement Theater Camera","floor":"basement","host_room":"Basement Theater","model_preset":"tapo_c110_corner","x":104,"y":64,"heading_deg":42,"fov_deg":110,"range_px":700,"spills_into":["Basement Play Area"],"notes":"Upper-left corner of Basement Theater looking SE; sees North wall ballpit leading to Wet Bar, sectional couch, South closets, and East wall.","zones":["basement_theater_couch","basement_theater_playpen","basement_theater_floor","basement_bar","basement_play_area_far","basement_stairwell"],"sub_zones":[{"id":"basement_theater_couch","entity_id":"binary_sensor.basement_theater_couch_person_occupancy","label":"Theater Couch","room":"Basement Theater","x":150,"y":235,"width":165,"height":165},{"id":"basement_theater_playpen","entity_id":"binary_sensor.basement_theater_playpen_person_occupancy","label":"Ballpit / Playpen","room":"Basement Theater","x":160,"y":50,"width":165,"height":75},{"id":"basement_theater_floor","entity_id":"binary_sensor.basement_theater_floor_person_occupancy","label":"Theater Floor","room":"Basement Theater","x":160,"y":135,"width":165,"height":90},{"id":"basement_bar","entity_id":"binary_sensor.basement_bar_person_occupancy","label":"Basement Wet Bar","room":"Basement Play Area","x":365,"y":55,"width":150,"height":140},{"id":"basement_play_area_far","entity_id":"binary_sensor.basement_play_area_far_person_occupancy","label":"Play Area East","room":"Basement Play Area","x":370,"y":230,"width":190,"height":175},{"id":"basement_stairwell","entity_id":"binary_sensor.basement_stairwell_person_occupancy","label":"Basement Stairwell","room":"Basement Play Area","x":495,"y":415,"width":75,"height":105}]},{"id":"camera.basement_play_area","name":"Basement Play Area Camera","floor":"basement","host_room":"Basement Play Area","model_preset":"tapo_c110_corner","x":505,"y":68,"heading_deg":121,"fov_deg":110,"range_px":680,"spills_into":["Basement Theater"],"notes":"Behind Wet Bar looking SW across bar counter, East basement wall (not into stairs), play mats, and Theater.","zones":["basement_play_floor","basement_counter","theater_rear_view"],"sub_zones":[{"id":"basement_play_floor","entity_id":"binary_sensor.basement_play_floor_person_occupancy","label":"Play Area Main Floor","room":"Basement Play Area","x":365,"y":225,"width":195,"height":220},{"id":"basement_counter","entity_id":"binary_sensor.basement_counter_person_occupancy","label":"Wet Bar Counter","room":"Basement Play Area","x":365,"y":60,"width":150,"height":140},{"id":"theater_rear_view","entity_id":"binary_sensor.theater_rear_view_person_occupancy","label":"Theater Rear View","room":"Basement Theater","x":135,"y":230,"width":185,"height":175}]},{"id":"camera.storage_room","name":"Storage Room Camera","floor":"basement","host_room":"Storage Room","model_preset":"tapo_c110_corner","x":905,"y":54,"heading_deg":135,"fov_deg":110,"range_px":420,"spills_into":[],"notes":"Upper-right corner of Storage Room looking SW across green gym floor toward South storage shelves and West door to hallway.","zones":["storage_room_workout"],"sub_zones":[{"id":"storage_room_workout","entity_id":"binary_sensor.storage_room_workout_person_occupancy","label":"Storage Room Floor","room":"Storage Room","x":705,"y":80,"width":195,"height":265}]}],"sensors":[{"id":"binary_sensor.family_room_ecobee_motion","entity_id":"binary_sensor.family_room_ecobee_motion","name":"Family Room PIR (Ecobee)","sensor_type":"pir_motion","model_preset":"ecobee_smart_sensor","floor":"main","host_room":"Family Room","x":555,"y":115,"heading_deg":165,"fov_deg":110,"range_px":190},{"id":"binary_sensor.family_room_ring_motion","entity_id":"binary_sensor.family_room_ring_motion","name":"Family Room Ring Cam Motion (Kitchen / Back Door)","sensor_type":"pir_motion","model_preset":"ring_stick_up_cam_gen3","floor":"main","host_room":"Family Room","x":635,"y":275,"heading_deg":215,"fov_deg":110,"range_px":380},{"id":"binary_sensor.thermostat_motion","entity_id":"binary_sensor.thermostat_motion","name":"Main Thermostat PIR (Ecobee4)","sensor_type":"pir_motion","model_preset":"ecobee_thermostat_pir","floor":"main","host_room":"Dining Room","x":242,"y":180,"heading_deg":180,"fov_deg":120,"range_px":220},{"id":"binary_sensor.keypad_motion","entity_id":"binary_sensor.keypad_motion","name":"Main Floor Keypad PIR (Between Peninsula & Powder Bath)","sensor_type":"pir_motion","model_preset":"ring_keypad_pir","floor":"main","host_room":"Front Entry","x":410,"y":315,"heading_deg":0,"fov_deg":100,"range_px":165},{"id":"binary_sensor.garage_ring_motion","entity_id":"binary_sensor.garage_ring_motion","name":"Garage PIR (Ring Alarm Gen 2)","sensor_type":"pir_motion","model_preset":"ring_alarm_pir_gen2","floor":"main","host_room":"Garage","x":685,"y":428,"heading_deg":135,"fov_deg":90,"range_px":475},{"id":"binary_sensor.master_bedroom_motion","entity_id":"binary_sensor.master_bedroom_motion","name":"Master Bedroom PIR (Ecobee)","sensor_type":"pir_motion","model_preset":"ecobee_smart_sensor","floor":"upstairs","host_room":"Master Bedroom","x":140,"y":280,"heading_deg":0,"fov_deg":110,"range_px":190},{"id":"binary_sensor.nursery_motion","entity_id":"binary_sensor.nursery_motion","name":"Nursery PIR (Ecobee)","sensor_type":"pir_motion","model_preset":"ecobee_smart_sensor","floor":"upstairs","host_room":"Margot's Room","x":370,"y":235,"heading_deg":315,"fov_deg":110,"range_px":190},{"id":"binary_sensor.guest_room_motion_occupancy","entity_id":"binary_sensor.guest_room_motion_occupancy","name":"Guest Room PIR (IKEA VALLHORN)","sensor_type":"pir_motion","model_preset":"ikea_vallhorn_pir","floor":"upstairs","host_room":"Guest Room","x":860,"y":42,"heading_deg":135,"fov_deg":120,"range_px":260,"inner_fov_deg":60,"inner_range_px":520},{"id":"binary_sensor.guest_room_motion","entity_id":"binary_sensor.guest_room_motion","name":"Guest Room PIR (Ecobee)","sensor_type":"pir_motion","model_preset":"ecobee_smart_sensor","floor":"upstairs","host_room":"Guest Room","x":745,"y":48,"heading_deg":90,"fov_deg":110,"range_px":190},{"id":"binary_sensor.office_motion","entity_id":"binary_sensor.office_motion","name":"Office PIR (Ecobee)","sensor_type":"pir_motion","model_preset":"ecobee_smart_sensor","floor":"upstairs","host_room":"Office","x":858,"y":305,"heading_deg":145,"fov_deg":110,"range_px":190},{"id":"binary_sensor.upper_level_keypad_motion","entity_id":"binary_sensor.upper_level_keypad_motion","name":"Master Bedside Keypad PIR","sensor_type":"pir_motion","model_preset":"ring_keypad_pir","floor":"upstairs","host_room":"Master Bedroom","x":138,"y":420,"heading_deg":0,"fov_deg":100,"range_px":165},{"id":"binary_sensor.basement_ecobee_motion","entity_id":"binary_sensor.basement_ecobee_motion","name":"Basement Theater PIR (Ecobee)","sensor_type":"pir_motion","model_preset":"ecobee_smart_sensor","floor":"basement","host_room":"Basement Theater","x":420,"y":518,"heading_deg":270,"fov_deg":110,"range_px":190},{"id":"binary_sensor.family_room_motion_occupancy","entity_id":"binary_sensor.family_room_motion_occupancy","name":"Family Room PIR (SONOFF SenseGuard SNZB-03PR2)","sensor_type":"pir_motion","model_preset":"sonoff_snzb_03pr2","floor":"main","host_room":"Family Room","x":818,"y":96,"heading_deg":138,"fov_deg":120,"range_px":315},{"id":"binary_sensor.kitchen_motion_occupancy","entity_id":"binary_sensor.kitchen_motion_occupancy","name":"Kitchen PIR (SONOFF SenseGuard SNZB-03PR2)","sensor_type":"pir_motion","model_preset":"sonoff_snzb_03pr2","floor":"main","host_room":"Kitchen","x":522,"y":92,"heading_deg":145,"fov_deg":120,"range_px":315},{"id":"binary_sensor.living_room_motion_occupancy","entity_id":"binary_sensor.living_room_motion_occupancy","name":"Living Room PIR (SONOFF SenseGuard SNZB-03PR2)","sensor_type":"pir_motion","model_preset":"sonoff_snzb_03pr2","floor":"main","host_room":"Living Room","x":333,"y":500,"heading_deg":215,"fov_deg":120,"range_px":315},{"id":"binary_sensor.dining_room_motion_occupancy","entity_id":"binary_sensor.dining_room_motion_occupancy","name":"Dining Room PIR (SONOFF SenseGuard SNZB-03PR2)","sensor_type":"pir_motion","model_preset":"sonoff_snzb_03pr2","floor":"main","host_room":"Dining Room","x":245,"y":92,"heading_deg":135,"fov_deg":120,"range_px":315},{"id":"binary_sensor.master_bedroom_motion_occupancy","entity_id":"binary_sensor.master_bedroom_motion_occupancy","name":"Master Bedroom PIR (SONOFF SenseGuard SNZB-03PR2)","sensor_type":"pir_motion","model_preset":"sonoff_snzb_03pr2","floor":"upstairs","host_room":"Master Bedroom","x":134,"y":536,"heading_deg":313,"fov_deg":120,"range_px":315},{"id":"binary_sensor.master_bathroom_motion_occupancy","entity_id":"binary_sensor.master_bathroom_motion_occupancy","name":"Master Bathroom PIR (SONOFF SenseGuard SNZB-03PR2)","sensor_type":"pir_motion","model_preset":"sonoff_snzb_03pr2","floor":"upstairs","host_room":"Master Bathroom","x":605,"y":543,"heading_deg":215,"fov_deg":120,"range_px":315},{"id":"binary_sensor.upstairs_hallway_motion_occupancy","entity_id":"binary_sensor.upstairs_hallway_motion_occupancy","name":"Upstairs Hallway PIR (SONOFF SenseGuard SNZB-03PR2)","sensor_type":"pir_motion","model_preset":"sonoff_snzb_03pr2","floor":"upstairs","host_room":"Upstairs Hallway & Stairs","x":663,"y":256,"heading_deg":135,"fov_deg":120,"range_px":315},{"id":"binary_sensor.office_motion_occupancy","entity_id":"binary_sensor.office_motion_occupancy","name":"Office PIR (SONOFF SenseGuard SNZB-03PR2)","sensor_type":"pir_motion","model_preset":"sonoff_snzb_03pr2","floor":"upstairs","host_room":"Office","x":868,"y":542,"heading_deg":225,"fov_deg":120,"range_px":315},{"id":"binary_sensor.laundry_room_ring_motion","entity_id":"binary_sensor.laundry_room_ring_motion","name":"Laundry Room PIR (Ring Alarm Gen 2)","sensor_type":"pir_motion","model_preset":"ring_alarm_pir_gen2","floor":"main","host_room":"Laundry Room","x":700,"y":298,"heading_deg":145,"fov_deg":90,"range_px":475},{"id":"binary_sensor.upstairs_stairs_bottom_motion","entity_id":"binary_sensor.upstairs_stairs_bottom_motion","name":"Upstairs Stairs Bottom Step PIR (Wyze 433)","sensor_type":"pir_motion","model_preset":"wyze_sense_pir","floor":"upstairs","host_room":"Upstairs Hallway & Stairs","x":640,"y":540,"heading_deg":270,"fov_deg":120,"range_px":95},{"id":"binary_sensor.basement_stairs_top_motion","entity_id":"binary_sensor.basement_stairs_top_motion","name":"Basement Stairs Top Step PIR (Wyze 938)","sensor_type":"pir_motion","model_preset":"wyze_sense_pir","floor":"main","host_room":"Front Entry","x":535,"y":330,"heading_deg":90,"fov_deg":120,"range_px":95},{"id":"binary_sensor.basement_stairs_bottom_motion","entity_id":"binary_sensor.basement_stairs_bottom_motion","name":"Basement Stairs Bottom Step PIR (Wyze dd9)","sensor_type":"pir_motion","model_preset":"wyze_sense_pir","floor":"basement","host_room":"Basement Play Area","x":535,"y":395,"heading_deg":90,"fov_deg":120,"range_px":95},{"id":"binary_sensor.front_door","entity_id":"binary_sensor.front_door","name":"Front Door Contact","sensor_type":"door_contact","model_preset":"ring_contact_sensor","floor":"main","host_room":"Front Entry","door_id":"door_front_entry","x":452,"y":508},{"id":"binary_sensor.laundry_room_door","entity_id":"binary_sensor.laundry_room_door","name":"Laundry / Garage Door Contact","sensor_type":"door_contact","model_preset":"ring_contact_sensor","floor":"main","host_room":"Laundry Room","door_id":"door_fr_laundry","x":642,"y":395},{"id":"binary_sensor.back_door","entity_id":"binary_sensor.back_door","name":"Back Patio Door Contact","sensor_type":"door_contact","model_preset":"ring_contact_sensor","floor":"main","host_room":"Kitchen","x":475,"y":87},{"id":"binary_sensor.garage_side_door","entity_id":"binary_sensor.garage_side_door","name":"Garage Side Door Contact","sensor_type":"door_contact","model_preset":"ring_contact_sensor","floor":"main","host_room":"Garage","x":832,"y":465},{"id":"cover.garage_door","entity_id":"cover.garage_door","name":"Garage Roll-Up Door","sensor_type":"door_contact","floor":"main","host_room":"Garage","x":680,"y":555}],"ble_proxies":[{"id":"living_room_speaker","entity_id":"sensor.living_room_speaker_bluetooth_proxy_status","name":"Living Room Speaker BLE Proxy","model_preset":"google_home_speaker_ble","floor":"main","host_room":"Living Room","x":210,"y":410,"radius_px":210},{"id":"family_room_speaker","entity_id":"sensor.family_room_speaker_bluetooth_proxy_status","name":"Family Room Speaker BLE Proxy","model_preset":"google_home_speaker_ble","floor":"main","host_room":"Family Room","x":680,"y":200,"radius_px":210},{"id":"master_bedroom_speaker","entity_id":"sensor.master_bedroom_speaker_bluetooth_proxy_status","name":"Master Bedroom Speaker BLE Proxy","model_preset":"google_home_speaker_ble","floor":"upstairs","host_room":"Master Bedroom","x":230,"y":180,"radius_px":210},{"id":"nursery_speaker","entity_id":"sensor.nursery_speaker_bluetooth_proxy_status","name":"Nursery Speaker BLE Proxy","model_preset":"google_home_speaker_ble","floor":"upstairs","host_room":"Margot's Room","x":465,"y":140,"radius_px":190},{"id":"office_speaker","entity_id":"sensor.office_speaker_bluetooth_proxy_status","name":"Office Speaker BLE Proxy","model_preset":"google_home_speaker_ble","floor":"upstairs","host_room":"Office","x":765,"y":400,"radius_px":200},{"id":"basement_speaker","entity_id":"sensor.basement_speaker_bluetooth_proxy_status","name":"Basement Speaker BLE Proxy","model_preset":"google_home_speaker_ble","floor":"basement","host_room":"Basement Play Area","x":450,"y":295,"radius_px":260}],"connections":[{"from_room":"Front Entry","id":"conn_entry_lr","label":"Open Archway (Entry <-> Living Room)","to_room":"Living Room","type":"open_passage"},{"from_room":"Front Entry","id":"conn_entry_kitchen","label":"Pathway (Entry <-> Kitchen)","to_room":"Kitchen","type":"open_passage"},{"from_room":"Front Entry","id":"conn_entry_fr","label":"Pathway (Entry <-> Family/Laundry/Basement)","to_room":"Family Room","type":"open_passage"},{"from_room":"Front Entry","id":"conn_entry_powder","label":"Powder Bath Doorway","to_room":"Powder Bath","type":"unmonitored_door"},{"from_room":"Front Entry","id":"conn_entry_laundry","label":"Laundry Room Doorway","to_room":"Laundry Room","type":"unmonitored_door"},{"from_room":"Living Room","id":"conn_lr_dr","label":"Open Passage (Living <-> Dining)","to_room":"Dining Room","type":"open_passage"},{"from_room":"Dining Room","id":"conn_dr_kitchen","label":"Open Passage (Dining <-> Kitchen)","to_room":"Kitchen","type":"open_passage"},{"from_room":"Kitchen","id":"conn_kitchen_fr","label":"Open Concept (Kitchen <-> Family Room)","to_room":"Family Room","type":"open_passage"},{"entity_id":"binary_sensor.laundry_room_door","from_room":"Family Room","id":"conn_fr_garage","label":"Laundry / Garage Pathway","to_room":"Garage","type":"unmonitored_door"},{"entity_id":"binary_sensor.laundry_room_door","from_room":"Laundry Room","id":"conn_laundry_garage","label":"Laundry -> Garage Door","to_room":"Garage","type":"unmonitored_door"},{"from_room":"Front Entry","id":"conn_entry_upstairs","label":"Main Stairs to Upstairs","to_room":"Upstairs Hallway & Stairs","type":"stairs"},{"from_room":"Family Room","id":"conn_fr_basement_play","label":"Basement Stairs","to_room":"Basement Play Area","type":"stairs"},{"from_room":"Family Room","id":"conn_fr_basement_theater","label":"Basement Stairs (Partial Sightline)","to_room":"Basement Theater","type":"stairs"},{"from_room":"Upstairs Hallway & Stairs","id":"conn_hall_office","label":"Office Doorway (Next to Stairs)","to_room":"Office","type":"unmonitored_door"},{"from_room":"Upstairs Hallway & Stairs","id":"conn_hall_guest","label":"Guest Room Doorway (No Sensor)","to_room":"Guest Room","type":"unmonitored_door"},{"from_room":"Upstairs Hallway & Stairs","id":"conn_hall_nursery","label":"Nursery Doorway (Seen Partially by Cam)","to_room":"Margot's Room","type":"unmonitored_door"},{"from_room":"Upstairs Hallway & Stairs","id":"conn_hall_master","label":"Master Bedroom Entryway","to_room":"Master Bedroom","type":"unmonitored_door"},{"from_room":"Master Bedroom","id":"conn_master_wic","label":"Master Walk-In Closet Door","to_room":"Master W.I.C","type":"unmonitored_door"},{"from_room":"Master Bedroom","id":"conn_master_bath","label":"Master Bath / Shower Stall Entry","to_room":"Master Bathroom","type":"unmonitored_door"},{"from_room":"Upstairs Hallway & Stairs","id":"conn_hall_ubath","label":"Shared Bathroom (Double Vanity & Tub)","to_room":"Upstairs Bathroom","type":"unmonitored_door"},{"from_room":"Basement Play Area","id":"conn_play_theater","label":"Open Basement Divide (Play <-> Theater)","to_room":"Basement Theater","type":"open_passage"},{"from_room":"Basement Play Area","id":"conn_play_storage","label":"Storage Room Door (Off East Basement Hall)","to_room":"Storage Room","type":"unmonitored_door"},{"from_room":"Basement Play Area","id":"conn_play_bbath","label":"Basement Bath Door (Off East Basement Hall)","to_room":"Basement Bathroom","type":"unmonitored_door"}],"rooms":[{"id":"master_bedroom","name":"Master Bedroom","floor":"upstairs","room_type":"room","x":126,"y":32,"width":227,"height":516,"svg_path":"M 126,32 L 353,32 L 353,484 L 440,484 L 440,548 L 126,548 Z","notes":"West wing front-to-back with lower vestibule leading to Master W.I.C and Master Bathroom.","entryways":[{"id":"door_master_hallway","wall":"right","offset":224,"width":56,"type":"door","target_room":"Upstairs Hallway & Stairs"},{"id":"door_master_bath","wall":"right","offset":452,"width":60,"type":"door","target_room":"Master Bathroom"}]},{"id":"master_wic","name":"Master W.I.C","floor":"upstairs","room_type":"room","x":353,"y":355,"width":109,"height":129,"notes":"Standalone Master Walk-In Closet (6'3\" x 7'0\") opening South into the Master Bedroom vestibule.","entryways":[{"id":"door_wic_master","wall":"bottom","offset":45,"width":42,"type":"door","target_room":"Master Bedroom"}]},{"id":"upstairs_bathroom","name":"Upstairs Bathroom","floor":"upstairs","room_type":"room","x":462,"y":316,"width":148,"height":133,"svg_path":"M 462,316 L 610,316 L 610,417 L 560,417 L 560,449 L 462,449 Z","notes":"Upper shared bathroom (7'8\" x 4'11\") with tub & vanity opening North into Upstairs Hallway.","entryways":[{"id":"door_ubath_hall","wall":"top","offset":46,"width":45,"type":"door","target_room":"Upstairs Hallway & Stairs"}]},{"id":"master_bathroom","name":"Master Bathroom","floor":"upstairs","room_type":"room","x":440,"y":417,"width":170,"height":131,"svg_path":"M 440,449 L 560,449 L 560,417 L 610,417 L 610,548 L 440,548 Z","notes":"Lower en-suite Master Bathroom (6'5\" x 7'7\") with double vanity and walk-in shower stall.","entryways":[{"id":"door_mbath_master","wall":"left","offset":81,"width":46,"type":"door","target_room":"Master Bedroom"}]},{"id":"margots_room","name":"Margot's Room","floor":"upstairs","room_type":"room","x":353,"y":32,"width":257,"height":222,"svg_path":"M 353,32 L 563,32 L 563,143 L 610,143 L 610,254 L 353,254 Z","notes":"Top-center Nursery (10'6\" x 11'5\") including lower-right reach-in closet (Y=143..254).","entryways":[{"id":"door_margot_hallway","wall":"bottom","offset":155,"width":50,"type":"door","target_room":"Upstairs Hallway & Stairs"}]},{"id":"guest_room","name":"Guest Room","floor":"upstairs","room_type":"room","x":563,"y":32,"width":311,"height":222,"svg_path":"M 563,32 L 874,32 L 874,254 L 610,254 L 610,143 L 563,143 Z","notes":"Top-right Guest Room (13'6\" x 11'5\") including upper-left reach-in closet (Y=32..143).","entryways":[{"id":"door_guest_hallway","wall":"bottom","offset":49,"width":50,"type":"door","target_room":"Upstairs Hallway & Stairs"}]},{"id":"office","name":"Office","floor":"upstairs","room_type":"room","x":671,"y":254,"width":203,"height":294,"notes":"Bottom-right Office (10'3\" x 13'1\") including upper reach-in closet.","entryways":[{"id":"door_office_hallway","wall":"left","offset":4,"width":57,"type":"door","target_room":"Upstairs Hallway & Stairs"}]},{"id":"upstairs_hallway","name":"Upstairs Hallway & Stairs","floor":"upstairs","room_type":"transit","x":353,"y":254,"width":318,"height":101,"svg_path":"M 353,254 L 671,254 L 671,548 L 610,548 L 610,316 L 462,316 L 462,355 L 353,355 Z","notes":"Central upstairs hallway (16'3\" x 3'2\"), North-facing hallway linen closet, and stairwell.","entryways":[{"id":"door_hall_master","wall":"left","offset":2,"width":56,"type":"door","target_room":"Master Bedroom"},{"id":"door_hall_margot","wall":"top","offset":155,"width":50,"type":"door","target_room":"Margot's Room"},{"id":"door_hall_guest","wall":"top","offset":259,"width":50,"type":"door","target_room":"Guest Room"},{"id":"door_hall_office","wall":"right","offset":4,"width":57,"type":"door","target_room":"Office"}]},{"id":"dining_room","name":"Dining Room","floor":"main","room_type":"room","x":68,"y":87,"width":183,"height":203,"notes":"Northwest Dining Room (11'5\" x 13'0\") opening to Kitchen and Living Room.","entryways":[{"id":"arch_dr_kitchen","wall":"right","offset":103,"width":60,"type":"open_passage","target_room":"Kitchen"},{"id":"arch_dr_lr","wall":"bottom","offset":28,"width":116,"type":"open_passage","target_room":"Living Room"}]},{"id":"living_room","name":"Living Room","floor":"main","room_type":"room","x":68,"y":290,"width":273,"height":218,"notes":"Southwest Living Room (17'5\" x 13'9\") with South bay windows and wide opening to Foyer.","entryways":[{"id":"arch_lr_dr","wall":"top","offset":28,"width":116,"type":"open_passage","target_room":"Dining Room"},{"id":"arch_lr_entry","wall":"right","offset":128,"width":84,"type":"open_passage","target_room":"Front Entry"}]},{"id":"kitchen","name":"Kitchen","floor":"main","room_type":"room","x":251,"y":87,"width":283,"height":203,"notes":"Central Kitchen (10'3\" x 13'0\") and Breakfast Nook (8'1\" x 13'0\") with island counter.","entryways":[{"id":"arch_kitchen_dr","wall":"left","offset":103,"width":60,"type":"open_passage","target_room":"Dining Room"},{"id":"arch_kitchen_fr","wall":"right","offset":10,"width":185,"type":"open_passage","target_room":"Family Room"},{"id":"path_kitchen_entry","wall":"bottom","offset":159,"width":124,"type":"open_passage","target_room":"Front Entry"}]},{"id":"powder_bath","name":"Powder Bath","floor":"main","room_type":"room","x":341,"y":290,"width":69,"height":92,"notes":"Main floor half-bath (4'3\" x 4'11\") off Foyer.","entryways":[{"id":"door_powder_foyer","wall":"right","offset":55,"width":33,"type":"door","target_room":"Front Entry"}]},{"id":"front_entry","name":"Front Entry","floor":"main","room_type":"room","x":341,"y":290,"width":193,"height":218,"svg_path":"M 410,290 L 534,290 L 534,508 L 341,508 L 341,382 L 410,382 Z","notes":"Main Foyer (8'9\" x 13'6\"), coat closet, front door, and stairs to Upper Level.","entryways":[{"id":"arch_entry_lr","wall":"left","offset":128,"width":84,"type":"open_passage","target_room":"Living Room"},{"id":"path_entry_kitchen","wall":"top","offset":69,"width":124,"type":"open_passage","target_room":"Kitchen"},{"id":"door_front_entry","wall":"bottom","offset":85,"width":50,"type":"door","target_room":"Exterior"}]},{"id":"family_room","name":"Family Room","floor":"main","room_type":"room","x":534,"y":87,"width":298,"height":203,"notes":"East Family Room (19'4\" x 12'9\") with North fireplace and solid green South wall.","entryways":[{"id":"arch_fr_kitchen","wall":"left","offset":10,"width":185,"type":"open_passage","target_room":"Kitchen"}]},{"id":"laundry_room","name":"Laundry Room","floor":"main","room_type":"room","x":534,"y":290,"width":174,"height":131,"notes":"Main floor Laundry / Mudroom (11'3\" x 8'5\") with door on West wall to Hallway/Foyer and South door to Garage.","entryways":[{"id":"door_laundry_hall","wall":"left","offset":10,"width":48,"type":"door","target_room":"Front Entry"},{"id":"door_fr_laundry","wall":"bottom","offset":85,"width":48,"type":"door","target_room":"Garage"}]},{"id":"garage","name":"Garage","floor":"main","room_type":"room","x":534,"y":421,"width":298,"height":134,"notes":"2-car Garage below Laundry Room.","entryways":[{"id":"door_garage_fr","wall":"top","offset":85,"width":48,"type":"door","target_room":"Laundry Room"}]},{"id":"basement_theater","name":"Basement Theater","floor":"basement","room_type":"room","x":93,"y":42,"width":267,"height":490,"notes":"West side of Recreation Room with TV/fireplace wall, sectional couch, North wall ballpit, and South bi-fold closets.","entryways":[{"id":"arch_theater_play","wall":"right","offset":20,"width":430,"type":"open_passage","target_room":"Basement Play Area"}]},{"id":"basement_play_area","name":"Basement Play Area","floor":"basement","room_type":"room","x":360,"y":42,"width":335,"height":490,"svg_path":"M 360,42 L 524,42 L 524,135 L 695,135 L 695,230 L 572,230 L 572,410 L 635,410 L 635,532 L 360,532 Z","notes":"East side of Recreation Room including Wet Bar (9'0\" x 8'5\"), Play Area mats, East hallway (7'0\" x 4'8\"), and stairs.","entryways":[{"id":"arch_play_theater","wall":"left","offset":20,"width":430,"type":"open_passage","target_room":"Basement Theater"},{"id":"door_play_bbath","wall":"top","offset":215,"width":45,"type":"door","target_room":"Basement Bathroom"},{"id":"door_play_storage","wall":"right","offset":103,"width":70,"type":"door","target_room":"Storage Room"}]},{"id":"basement_bathroom","name":"Basement Bathroom","floor":"basement","room_type":"transit","x":524,"y":42,"width":171,"height":93,"notes":"Basement Bathroom (5'11\" x 4'7\") to the right of Wet Bar opening South into basement hallway.","entryways":[{"id":"door_bbath_play","wall":"bottom","offset":51,"width":45,"type":"door","target_room":"Basement Play Area"}]},{"id":"storage_room","name":"Storage Room","floor":"basement","room_type":"room","x":695,"y":42,"width":220,"height":318,"notes":"East Storage Room / Gym opening West into the basement hallway.","entryways":[{"id":"door_storage_play","wall":"left","offset":103,"width":70,"type":"door","target_room":"Basement Play Area"}]}]};

const PDD_DEFAULT_COMPILED_TOPOLOGY = {"floorplan":{"version":5,"canvas":{"width":1000,"height":580},"floor_wall_segments":{"upstairs":[[[126,32],[874,32]],[[874,32],[874,548]],[[126,548],[874,548]],[[126,32],[126,548]],[[353,32],[353,256]],[[353,312],[353,484]],[[563,32],[563,143]],[[563,143],[610,143]],[[610,32],[610,42]],[[610,130],[610,254]],[[563,143],[563,152]],[[563,242],[563,254]],[[353,254],[508,254]],[[508,254],[508,258]],[[508,258],[558,258]],[[558,258],[558,254]],[[558,254],[612,254]],[[662,254],[874,254]],[[353,316],[368,316]],[[446,316],[508,316]],[[553,316],[610,316]],[[353,355],[462,355]],[[462,316],[462,449]],[[353,484],[398,484]],[[398,484],[440,484]],[[440,449],[560,449]],[[560,417],[610,417]],[[560,417],[560,449]],[[610,316],[610,548]],[[440,449],[440,498]],[[440,544],[440,548]],[[671,254],[671,258]],[[671,258],[665,258]],[[665,258],[665,315]],[[665,315],[671,315]],[[671,315],[671,548]],[[735,254],[735,296]],[[735,296],[750,296]],[[858,296],[874,296]]],"main":[[[68,87],[832,87]],[[68,87],[68,508]],[[68,508],[534,508]],[[832,87],[832,290]],[[251,87],[251,190]],[[251,250],[251,290]],[[68,290],[96,290]],[[212,290],[251,290]],[[251,290],[410,290]],[[341,290],[341,418]],[[410,290],[410,345]],[[341,382],[410,382]],[[410,382],[410,418]],[[341,502],[341,508]],[[534,290],[832,290]],[[534,290],[534,300]],[[534,348],[534,508]],[[708,290],[708,421]],[[534,421],[832,421]],[[534,421],[534,555]],[[832,421],[832,555]],[[534,555],[832,555]]],"basement":[[[93,42],[695,42]],[[93,42],[93,532]],[[93,478],[130,478]],[[220,478],[265,478]],[[355,478],[430,478]],[[430,478],[445,495]],[[445,495],[445,532]],[[93,532],[635,532]],[[572,230],[572,532]],[[635,410],[635,532]],[[524,42],[524,135]],[[524,135],[575,135]],[[620,135],[695,135]],[[572,230],[695,230]],[[695,42],[695,145]],[[695,215],[695,360]],[[695,42],[915,42]],[[915,42],[915,360]],[[695,360],[915,360]]]},"floors":[{"id":"upstairs","name":"Upstairs Level","order":0,"underlay_svg":{"url":"/presence_detection_designer_static/floor_upstairs.webp?v=4","x":114,"y":20,"width":772,"height":540}},{"id":"main","name":"Main Floor","order":1,"underlay_svg":{"url":"/presence_detection_designer_static/floor_main.webp?v=4","x":60,"y":30,"width":784,"height":520}},{"id":"basement","name":"Basement Level","order":2,"underlay_svg":{"url":"/presence_detection_designer_static/floor_basement.webp?v=4","x":80,"y":30,"width":620,"height":520}}],"cameras":[{"id":"camera.living_room","name":"Living Room Camera","floor":"main","host_room":"Living Room","model_preset":"tapo_c110_corner","x":76,"y":335,"heading_deg":30,"fov_deg":110,"range_px":520,"spills_into":["Front Entry"],"notes":"Mounted on West wall below Dining opening; sees North cube shelf wall, Foyer archway/stairs, and South bay windows.","zones":["living_room_couch","living_room_floor","living_room_bay_windows","living_room_entry"],"sub_zones":[{"id":"living_room_couch","entity_id":"binary_sensor.living_room_couch_person_occupancy","label":"Living Room Couch","room":"Living Room","x":105,"y":355,"width":125,"height":100},{"id":"living_room_floor","entity_id":"binary_sensor.living_room_floor_person_occupancy","label":"Living Room Floor","room":"Living Room","x":235,"y":365,"width":95,"height":100},{"id":"living_room_bay_windows","entity_id":"binary_sensor.living_room_bay_windows_person_occupancy","label":"Bay Windows","room":"Living Room","x":115,"y":468,"width":165,"height":38},{"id":"living_room_entry","entity_id":"binary_sensor.living_room_entry_person_occupancy","label":"Front Entry Archway","room":"Front Entry","x":350,"y":415,"width":80,"height":80}]},{"id":"camera.dining_room","name":"Dining Room Camera","floor":"main","host_room":"Dining Room","model_preset":"tapo_c110_corner","x":242,"y":96,"heading_deg":128,"fov_deg":110,"range_px":320,"spills_into":["Living Room"],"notes":"Upper-right corner of Dining Room looking SW across dining table and through wide opening into Living Room.","zones":["dining_room_table","rileys_food"],"sub_zones":[{"id":"dining_room_table","entity_id":"binary_sensor.dining_room_table_person_occupancy","label":"Dining Table","room":"Dining Room","x":105,"y":145,"width":110,"height":110},{"id":"rileys_food","entity_id":"binary_sensor.rileys_food_person_occupancy","label":"Riley's Food Corner","room":"Dining Room","x":170,"y":96,"width":65,"height":42}]},{"id":"camera.family_room","name":"Family Room Camera","floor":"main","host_room":"Family Room","model_preset":"tapo_c110_corner","x":818,"y":96,"heading_deg":142,"fov_deg":110,"range_px":620,"spills_into":["Kitchen","Front Entry"],"notes":"Mounted on North wall to the right of the right window looking left across Family Room, green South couch wall, and Kitchen.","zones":["family_room_couch","family_room_recliner","family_room_floor","kitchen_island"],"sub_zones":[{"id":"family_room_couch","entity_id":"binary_sensor.family_room_couch_person_occupancy","label":"Family Room Couch","room":"Family Room","x":635,"y":195,"width":150,"height":88},{"id":"family_room_recliner","entity_id":"binary_sensor.family_room_recliner_person_occupancy","label":"Family Room Recliner","room":"Family Room","x":545,"y":115,"width":80,"height":75},{"id":"family_room_floor","entity_id":"binary_sensor.family_room_floor_person_occupancy","label":"Family Room Floor","room":"Family Room","x":545,"y":195,"width":85,"height":88},{"id":"kitchen_island","entity_id":"binary_sensor.kitchen_island_person_occupancy","label":"Kitchen Island","room":"Kitchen","x":335,"y":155,"width":120,"height":95}]},{"id":"camera.garage","name":"Garage Camera","floor":"main","host_room":"Garage","model_preset":"tapo_c110_overhead","x":680,"y":423,"heading_deg":90,"fov_deg":164,"range_px":250,"spills_into":[],"notes":"Mounted high on North interior wall pointing steeply down, covering nearly the full North wall and parking bay.","zones":["garage_parking"],"sub_zones":[{"id":"garage_parking","entity_id":"binary_sensor.garage_parking_person_occupancy","label":"Garage Parking Bay","room":"Garage","x":595,"y":438,"width":170,"height":108}]},{"id":"camera.master_bedroom","name":"Master Bedroom Camera","floor":"upstairs","host_room":"Master Bedroom","model_preset":"tapo_c110_corner","x":134,"y":536,"heading_deg":313,"fov_deg":110,"range_px":620,"spills_into":["Upstairs Hallway & Stairs","Master Bathroom"],"notes":"Lower-left corner of Master Bedroom looking NE; hugs West headboard wall, clips W.I.C, and sees into Master Bath & Hallway doors.","zones":["master_bed","master_open_area","master_bedroom_walkway","master_bedroom_entryway","master_bathroom"],"sub_zones":[{"id":"master_bed","entity_id":"binary_sensor.master_bed_person_occupancy","label":"Master Bed","room":"Master Bedroom","x":134,"y":250,"width":135,"height":155},{"id":"master_open_area","entity_id":"binary_sensor.master_open_area_person_occupancy","label":"Master Open Floor","room":"Master Bedroom","x":140,"y":55,"width":145,"height":165},{"id":"master_bedroom_walkway","entity_id":"binary_sensor.master_bedroom_walkway_person_occupancy","label":"Master Walkway","room":"Master Bedroom","x":278,"y":225,"width":68,"height":220},{"id":"master_bedroom_entryway","entity_id":"binary_sensor.master_bedroom_entryway_person_occupancy","label":"Master Hallway Entry","room":"Master Bedroom","x":305,"y":256,"width":48,"height":56},{"id":"master_bathroom","entity_id":"binary_sensor.master_bathroom_person_occupancy","label":"Master Bath Doorway","room":"Master Bathroom","x":425,"y":486,"width":55,"height":56}]},{"id":"camera.nursery","name":"Nursery Camera","floor":"upstairs","host_room":"Margot's Room","model_preset":"tapo_c110_corner","x":358,"y":246,"heading_deg":311,"fov_deg":110,"range_px":340,"spills_into":[],"notes":"Lower-left corner of Nursery looking NE; sees West wall posters, bed, dresser, open East reach-in closet, and hallway door.","zones":["nursery_bed"],"sub_zones":[{"id":"nursery_bed","entity_id":"binary_sensor.nursery_bed_person_occupancy","label":"Nursery Bed","room":"Margot's Room","x":370,"y":95,"width":125,"height":115}]},{"id":"camera.office","name":"Office Camera","floor":"upstairs","host_room":"Office","model_preset":"tapo_c110_corner","x":678,"y":538,"heading_deg":313,"fov_deg":110,"range_px":380,"spills_into":["Upstairs Hallway & Stairs"],"notes":"Lower-left corner of Office looking NE; sees West wall and Office door, open North closet, Steve's desk, and sim rig.","zones":["steves_desk","sim_rig","office_floor","office_entryway"],"sub_zones":[{"id":"steves_desk","entity_id":"binary_sensor.steves_desk_person_occupancy","label":"Steve's Desk","room":"Office","x":745,"y":360,"width":105,"height":95},{"id":"sim_rig","entity_id":"binary_sensor.sim_rig_person_occupancy","label":"Sim Rig","room":"Office","x":680,"y":425,"width":65,"height":95},{"id":"office_floor","entity_id":"binary_sensor.office_floor_person_occupancy","label":"Office Center Floor","room":"Office","x":685,"y":310,"width":95,"height":95},{"id":"office_entryway","entity_id":"binary_sensor.office_entryway_person_occupancy","label":"Office Doorway","room":"Office","x":665,"y":258,"width":45,"height":55}]},{"id":"camera.basement_theater","name":"Basement Theater Camera","floor":"basement","host_room":"Basement Theater","model_preset":"tapo_c110_corner","x":104,"y":64,"heading_deg":42,"fov_deg":110,"range_px":700,"spills_into":["Basement Play Area"],"notes":"Upper-left corner of Basement Theater looking SE; sees North wall ballpit leading to Wet Bar, sectional couch, South closets, and East wall.","zones":["basement_theater_couch","basement_theater_playpen","basement_theater_floor","basement_bar","basement_play_area_far","basement_stairwell"],"sub_zones":[{"id":"basement_theater_couch","entity_id":"binary_sensor.basement_theater_couch_person_occupancy","label":"Theater Couch","room":"Basement Theater","x":150,"y":235,"width":165,"height":165},{"id":"basement_theater_playpen","entity_id":"binary_sensor.basement_theater_playpen_person_occupancy","label":"Ballpit / Playpen","room":"Basement Theater","x":160,"y":50,"width":165,"height":75},{"id":"basement_theater_floor","entity_id":"binary_sensor.basement_theater_floor_person_occupancy","label":"Theater Floor","room":"Basement Theater","x":160,"y":135,"width":165,"height":90},{"id":"basement_bar","entity_id":"binary_sensor.basement_bar_person_occupancy","label":"Basement Wet Bar","room":"Basement Play Area","x":365,"y":55,"width":150,"height":140},{"id":"basement_play_area_far","entity_id":"binary_sensor.basement_play_area_far_person_occupancy","label":"Play Area East","room":"Basement Play Area","x":370,"y":230,"width":190,"height":175},{"id":"basement_stairwell","entity_id":"binary_sensor.basement_stairwell_person_occupancy","label":"Basement Stairwell","room":"Basement Play Area","x":495,"y":415,"width":75,"height":105}]},{"id":"camera.basement_play_area","name":"Basement Play Area Camera","floor":"basement","host_room":"Basement Play Area","model_preset":"tapo_c110_corner","x":505,"y":68,"heading_deg":121,"fov_deg":110,"range_px":680,"spills_into":["Basement Theater"],"notes":"Behind Wet Bar looking SW across bar counter, East basement wall (not into stairs), play mats, and Theater.","zones":["basement_play_floor","basement_counter","theater_rear_view"],"sub_zones":[{"id":"basement_play_floor","entity_id":"binary_sensor.basement_play_floor_person_occupancy","label":"Play Area Main Floor","room":"Basement Play Area","x":365,"y":225,"width":195,"height":220},{"id":"basement_counter","entity_id":"binary_sensor.basement_counter_person_occupancy","label":"Wet Bar Counter","room":"Basement Play Area","x":365,"y":60,"width":150,"height":140},{"id":"theater_rear_view","entity_id":"binary_sensor.theater_rear_view_person_occupancy","label":"Theater Rear View","room":"Basement Theater","x":135,"y":230,"width":185,"height":175}]},{"id":"camera.storage_room","name":"Storage Room Camera","floor":"basement","host_room":"Storage Room","model_preset":"tapo_c110_corner","x":905,"y":54,"heading_deg":135,"fov_deg":110,"range_px":420,"spills_into":[],"notes":"Upper-right corner of Storage Room looking SW across green gym floor toward South storage shelves and West door to hallway.","zones":["storage_room_workout"],"sub_zones":[{"id":"storage_room_workout","entity_id":"binary_sensor.storage_room_workout_person_occupancy","label":"Storage Room Floor","room":"Storage Room","x":705,"y":80,"width":195,"height":265}]}],"sensors":[{"id":"binary_sensor.family_room_ecobee_motion","entity_id":"binary_sensor.family_room_ecobee_motion","name":"Family Room PIR (Ecobee)","sensor_type":"pir_motion","model_preset":"ecobee_smart_sensor","floor":"main","host_room":"Family Room","x":555,"y":115,"heading_deg":165,"fov_deg":110,"range_px":190},{"id":"binary_sensor.family_room_ring_motion","entity_id":"binary_sensor.family_room_ring_motion","name":"Family Room Ring Cam Motion (Kitchen / Back Door)","sensor_type":"pir_motion","model_preset":"ring_stick_up_cam_gen3","floor":"main","host_room":"Family Room","x":635,"y":275,"heading_deg":215,"fov_deg":110,"range_px":380},{"id":"binary_sensor.thermostat_motion","entity_id":"binary_sensor.thermostat_motion","name":"Main Thermostat PIR (Ecobee4)","sensor_type":"pir_motion","model_preset":"ecobee_thermostat_pir","floor":"main","host_room":"Dining Room","x":242,"y":180,"heading_deg":180,"fov_deg":120,"range_px":220},{"id":"binary_sensor.keypad_motion","entity_id":"binary_sensor.keypad_motion","name":"Main Floor Keypad PIR (Between Peninsula & Powder Bath)","sensor_type":"pir_motion","model_preset":"ring_keypad_pir","floor":"main","host_room":"Front Entry","x":410,"y":315,"heading_deg":0,"fov_deg":100,"range_px":165},{"id":"binary_sensor.garage_ring_motion","entity_id":"binary_sensor.garage_ring_motion","name":"Garage PIR (Ring Alarm Gen 2)","sensor_type":"pir_motion","model_preset":"ring_alarm_pir_gen2","floor":"main","host_room":"Garage","x":685,"y":428,"heading_deg":135,"fov_deg":90,"range_px":475},{"id":"binary_sensor.master_bedroom_motion","entity_id":"binary_sensor.master_bedroom_motion","name":"Master Bedroom PIR (Ecobee)","sensor_type":"pir_motion","model_preset":"ecobee_smart_sensor","floor":"upstairs","host_room":"Master Bedroom","x":140,"y":280,"heading_deg":0,"fov_deg":110,"range_px":190},{"id":"binary_sensor.nursery_motion","entity_id":"binary_sensor.nursery_motion","name":"Nursery PIR (Ecobee)","sensor_type":"pir_motion","model_preset":"ecobee_smart_sensor","floor":"upstairs","host_room":"Margot's Room","x":370,"y":235,"heading_deg":315,"fov_deg":110,"range_px":190},{"id":"binary_sensor.guest_room_motion_occupancy","entity_id":"binary_sensor.guest_room_motion_occupancy","name":"Guest Room PIR (IKEA VALLHORN)","sensor_type":"pir_motion","model_preset":"ikea_vallhorn_pir","floor":"upstairs","host_room":"Guest Room","x":860,"y":42,"heading_deg":135,"fov_deg":120,"range_px":260,"inner_fov_deg":60,"inner_range_px":520},{"id":"binary_sensor.guest_room_motion","entity_id":"binary_sensor.guest_room_motion","name":"Guest Room PIR (Ecobee)","sensor_type":"pir_motion","model_preset":"ecobee_smart_sensor","floor":"upstairs","host_room":"Guest Room","x":745,"y":48,"heading_deg":90,"fov_deg":110,"range_px":190},{"id":"binary_sensor.office_motion","entity_id":"binary_sensor.office_motion","name":"Office PIR (Ecobee)","sensor_type":"pir_motion","model_preset":"ecobee_smart_sensor","floor":"upstairs","host_room":"Office","x":858,"y":305,"heading_deg":145,"fov_deg":110,"range_px":190},{"id":"binary_sensor.upper_level_keypad_motion","entity_id":"binary_sensor.upper_level_keypad_motion","name":"Master Bedside Keypad PIR","sensor_type":"pir_motion","model_preset":"ring_keypad_pir","floor":"upstairs","host_room":"Master Bedroom","x":138,"y":420,"heading_deg":0,"fov_deg":100,"range_px":165},{"id":"binary_sensor.basement_ecobee_motion","entity_id":"binary_sensor.basement_ecobee_motion","name":"Basement Theater PIR (Ecobee)","sensor_type":"pir_motion","model_preset":"ecobee_smart_sensor","floor":"basement","host_room":"Basement Theater","x":420,"y":518,"heading_deg":270,"fov_deg":110,"range_px":190},{"id":"binary_sensor.family_room_motion_occupancy","entity_id":"binary_sensor.family_room_motion_occupancy","name":"Family Room PIR (SONOFF SenseGuard SNZB-03PR2)","sensor_type":"pir_motion","model_preset":"sonoff_snzb_03pr2","floor":"main","host_room":"Family Room","x":818,"y":96,"heading_deg":138,"fov_deg":120,"range_px":315},{"id":"binary_sensor.kitchen_motion_occupancy","entity_id":"binary_sensor.kitchen_motion_occupancy","name":"Kitchen PIR (SONOFF SenseGuard SNZB-03PR2)","sensor_type":"pir_motion","model_preset":"sonoff_snzb_03pr2","floor":"main","host_room":"Kitchen","x":522,"y":92,"heading_deg":145,"fov_deg":120,"range_px":315},{"id":"binary_sensor.living_room_motion_occupancy","entity_id":"binary_sensor.living_room_motion_occupancy","name":"Living Room PIR (SONOFF SenseGuard SNZB-03PR2)","sensor_type":"pir_motion","model_preset":"sonoff_snzb_03pr2","floor":"main","host_room":"Living Room","x":333,"y":500,"heading_deg":215,"fov_deg":120,"range_px":315},{"id":"binary_sensor.dining_room_motion_occupancy","entity_id":"binary_sensor.dining_room_motion_occupancy","name":"Dining Room PIR (SONOFF SenseGuard SNZB-03PR2)","sensor_type":"pir_motion","model_preset":"sonoff_snzb_03pr2","floor":"main","host_room":"Dining Room","x":245,"y":92,"heading_deg":135,"fov_deg":120,"range_px":315},{"id":"binary_sensor.master_bedroom_motion_occupancy","entity_id":"binary_sensor.master_bedroom_motion_occupancy","name":"Master Bedroom PIR (SONOFF SenseGuard SNZB-03PR2)","sensor_type":"pir_motion","model_preset":"sonoff_snzb_03pr2","floor":"upstairs","host_room":"Master Bedroom","x":134,"y":536,"heading_deg":313,"fov_deg":120,"range_px":315},{"id":"binary_sensor.master_bathroom_motion_occupancy","entity_id":"binary_sensor.master_bathroom_motion_occupancy","name":"Master Bathroom PIR (SONOFF SenseGuard SNZB-03PR2)","sensor_type":"pir_motion","model_preset":"sonoff_snzb_03pr2","floor":"upstairs","host_room":"Master Bathroom","x":605,"y":543,"heading_deg":215,"fov_deg":120,"range_px":315},{"id":"binary_sensor.upstairs_hallway_motion_occupancy","entity_id":"binary_sensor.upstairs_hallway_motion_occupancy","name":"Upstairs Hallway PIR (SONOFF SenseGuard SNZB-03PR2)","sensor_type":"pir_motion","model_preset":"sonoff_snzb_03pr2","floor":"upstairs","host_room":"Upstairs Hallway & Stairs","x":663,"y":256,"heading_deg":135,"fov_deg":120,"range_px":315},{"id":"binary_sensor.office_motion_occupancy","entity_id":"binary_sensor.office_motion_occupancy","name":"Office PIR (SONOFF SenseGuard SNZB-03PR2)","sensor_type":"pir_motion","model_preset":"sonoff_snzb_03pr2","floor":"upstairs","host_room":"Office","x":868,"y":542,"heading_deg":225,"fov_deg":120,"range_px":315},{"id":"binary_sensor.laundry_room_ring_motion","entity_id":"binary_sensor.laundry_room_ring_motion","name":"Laundry Room PIR (Ring Alarm Gen 2)","sensor_type":"pir_motion","model_preset":"ring_alarm_pir_gen2","floor":"main","host_room":"Laundry Room","x":700,"y":298,"heading_deg":145,"fov_deg":90,"range_px":475},{"id":"binary_sensor.upstairs_stairs_bottom_motion","entity_id":"binary_sensor.upstairs_stairs_bottom_motion","name":"Upstairs Stairs Bottom Step PIR (Wyze 433)","sensor_type":"pir_motion","model_preset":"wyze_sense_pir","floor":"upstairs","host_room":"Upstairs Hallway & Stairs","x":640,"y":540,"heading_deg":270,"fov_deg":120,"range_px":95},{"id":"binary_sensor.basement_stairs_top_motion","entity_id":"binary_sensor.basement_stairs_top_motion","name":"Basement Stairs Top Step PIR (Wyze 938)","sensor_type":"pir_motion","model_preset":"wyze_sense_pir","floor":"main","host_room":"Front Entry","x":535,"y":330,"heading_deg":90,"fov_deg":120,"range_px":95},{"id":"binary_sensor.basement_stairs_bottom_motion","entity_id":"binary_sensor.basement_stairs_bottom_motion","name":"Basement Stairs Bottom Step PIR (Wyze dd9)","sensor_type":"pir_motion","model_preset":"wyze_sense_pir","floor":"basement","host_room":"Basement Play Area","x":535,"y":395,"heading_deg":90,"fov_deg":120,"range_px":95},{"id":"binary_sensor.front_door","entity_id":"binary_sensor.front_door","name":"Front Door Contact","sensor_type":"door_contact","model_preset":"ring_contact_sensor","floor":"main","host_room":"Front Entry","door_id":"door_front_entry","x":452,"y":508},{"id":"binary_sensor.laundry_room_door","entity_id":"binary_sensor.laundry_room_door","name":"Laundry / Garage Door Contact","sensor_type":"door_contact","model_preset":"ring_contact_sensor","floor":"main","host_room":"Laundry Room","door_id":"door_fr_laundry","x":642,"y":395},{"id":"binary_sensor.back_door","entity_id":"binary_sensor.back_door","name":"Back Patio Door Contact","sensor_type":"door_contact","model_preset":"ring_contact_sensor","floor":"main","host_room":"Kitchen","x":475,"y":87},{"id":"binary_sensor.garage_side_door","entity_id":"binary_sensor.garage_side_door","name":"Garage Side Door Contact","sensor_type":"door_contact","model_preset":"ring_contact_sensor","floor":"main","host_room":"Garage","x":832,"y":465},{"id":"cover.garage_door","entity_id":"cover.garage_door","name":"Garage Roll-Up Door","sensor_type":"door_contact","floor":"main","host_room":"Garage","x":680,"y":555}],"ble_proxies":[{"id":"living_room_speaker","entity_id":"sensor.living_room_speaker_bluetooth_proxy_status","name":"Living Room Speaker BLE Proxy","model_preset":"google_home_speaker_ble","floor":"main","host_room":"Living Room","x":210,"y":410,"radius_px":210},{"id":"family_room_speaker","entity_id":"sensor.family_room_speaker_bluetooth_proxy_status","name":"Family Room Speaker BLE Proxy","model_preset":"google_home_speaker_ble","floor":"main","host_room":"Family Room","x":680,"y":200,"radius_px":210},{"id":"master_bedroom_speaker","entity_id":"sensor.master_bedroom_speaker_bluetooth_proxy_status","name":"Master Bedroom Speaker BLE Proxy","model_preset":"google_home_speaker_ble","floor":"upstairs","host_room":"Master Bedroom","x":230,"y":180,"radius_px":210},{"id":"nursery_speaker","entity_id":"sensor.nursery_speaker_bluetooth_proxy_status","name":"Nursery Speaker BLE Proxy","model_preset":"google_home_speaker_ble","floor":"upstairs","host_room":"Margot's Room","x":465,"y":140,"radius_px":190},{"id":"office_speaker","entity_id":"sensor.office_speaker_bluetooth_proxy_status","name":"Office Speaker BLE Proxy","model_preset":"google_home_speaker_ble","floor":"upstairs","host_room":"Office","x":765,"y":400,"radius_px":200},{"id":"basement_speaker","entity_id":"sensor.basement_speaker_bluetooth_proxy_status","name":"Basement Speaker BLE Proxy","model_preset":"google_home_speaker_ble","floor":"basement","host_room":"Basement Play Area","x":450,"y":295,"radius_px":260}],"connections":[{"from_room":"Front Entry","id":"conn_entry_lr","label":"Open Archway (Entry <-> Living Room)","to_room":"Living Room","type":"open_passage"},{"from_room":"Front Entry","id":"conn_entry_kitchen","label":"Pathway (Entry <-> Kitchen)","to_room":"Kitchen","type":"open_passage"},{"from_room":"Front Entry","id":"conn_entry_fr","label":"Pathway (Entry <-> Family/Laundry/Basement)","to_room":"Family Room","type":"open_passage"},{"from_room":"Front Entry","id":"conn_entry_powder","label":"Powder Bath Doorway","to_room":"Powder Bath","type":"unmonitored_door"},{"from_room":"Front Entry","id":"conn_entry_laundry","label":"Laundry Room Doorway","to_room":"Laundry Room","type":"unmonitored_door"},{"from_room":"Living Room","id":"conn_lr_dr","label":"Open Passage (Living <-> Dining)","to_room":"Dining Room","type":"open_passage"},{"from_room":"Dining Room","id":"conn_dr_kitchen","label":"Open Passage (Dining <-> Kitchen)","to_room":"Kitchen","type":"open_passage"},{"from_room":"Kitchen","id":"conn_kitchen_fr","label":"Open Concept (Kitchen <-> Family Room)","to_room":"Family Room","type":"open_passage"},{"entity_id":"binary_sensor.laundry_room_door","from_room":"Family Room","id":"conn_fr_garage","label":"Laundry / Garage Pathway","to_room":"Garage","type":"unmonitored_door"},{"entity_id":"binary_sensor.laundry_room_door","from_room":"Laundry Room","id":"conn_laundry_garage","label":"Laundry -> Garage Door","to_room":"Garage","type":"unmonitored_door"},{"from_room":"Front Entry","id":"conn_entry_upstairs","label":"Main Stairs to Upstairs","to_room":"Upstairs Hallway & Stairs","type":"stairs"},{"from_room":"Family Room","id":"conn_fr_basement_play","label":"Basement Stairs","to_room":"Basement Play Area","type":"stairs"},{"from_room":"Family Room","id":"conn_fr_basement_theater","label":"Basement Stairs (Partial Sightline)","to_room":"Basement Theater","type":"stairs"},{"from_room":"Upstairs Hallway & Stairs","id":"conn_hall_office","label":"Office Doorway (Next to Stairs)","to_room":"Office","type":"unmonitored_door"},{"from_room":"Upstairs Hallway & Stairs","id":"conn_hall_guest","label":"Guest Room Doorway (No Sensor)","to_room":"Guest Room","type":"unmonitored_door"},{"from_room":"Upstairs Hallway & Stairs","id":"conn_hall_nursery","label":"Nursery Doorway (Seen Partially by Cam)","to_room":"Margot's Room","type":"unmonitored_door"},{"from_room":"Upstairs Hallway & Stairs","id":"conn_hall_master","label":"Master Bedroom Entryway","to_room":"Master Bedroom","type":"unmonitored_door"},{"from_room":"Master Bedroom","id":"conn_master_wic","label":"Master Walk-In Closet Door","to_room":"Master W.I.C","type":"unmonitored_door"},{"from_room":"Master Bedroom","id":"conn_master_bath","label":"Master Bath / Shower Stall Entry","to_room":"Master Bathroom","type":"unmonitored_door"},{"from_room":"Upstairs Hallway & Stairs","id":"conn_hall_ubath","label":"Shared Bathroom (Double Vanity & Tub)","to_room":"Upstairs Bathroom","type":"unmonitored_door"},{"from_room":"Basement Play Area","id":"conn_play_theater","label":"Open Basement Divide (Play <-> Theater)","to_room":"Basement Theater","type":"open_passage"},{"from_room":"Basement Play Area","id":"conn_play_storage","label":"Storage Room Door (Off East Basement Hall)","to_room":"Storage Room","type":"unmonitored_door"},{"from_room":"Basement Play Area","id":"conn_play_bbath","label":"Basement Bath Door (Off East Basement Hall)","to_room":"Basement Bathroom","type":"unmonitored_door"}],"rooms":[{"id":"master_bedroom","name":"Master Bedroom","floor":"upstairs","room_type":"room","x":126,"y":32,"width":227,"height":516,"svg_path":"M 126,32 L 353,32 L 353,484 L 440,484 L 440,548 L 126,548 Z","notes":"West wing front-to-back with lower vestibule leading to Master W.I.C and Master Bathroom.","entryways":[{"id":"door_master_hallway","wall":"right","offset":224,"width":56,"type":"door","target_room":"Upstairs Hallway & Stairs"},{"id":"door_master_bath","wall":"right","offset":452,"width":60,"type":"door","target_room":"Master Bathroom"}]},{"id":"master_wic","name":"Master W.I.C","floor":"upstairs","room_type":"room","x":353,"y":355,"width":109,"height":129,"notes":"Standalone Master Walk-In Closet (6'3\" x 7'0\") opening South into the Master Bedroom vestibule.","entryways":[{"id":"door_wic_master","wall":"bottom","offset":45,"width":42,"type":"door","target_room":"Master Bedroom"}]},{"id":"upstairs_bathroom","name":"Upstairs Bathroom","floor":"upstairs","room_type":"room","x":462,"y":316,"width":148,"height":133,"svg_path":"M 462,316 L 610,316 L 610,417 L 560,417 L 560,449 L 462,449 Z","notes":"Upper shared bathroom (7'8\" x 4'11\") with tub & vanity opening North into Upstairs Hallway.","entryways":[{"id":"door_ubath_hall","wall":"top","offset":46,"width":45,"type":"door","target_room":"Upstairs Hallway & Stairs"}]},{"id":"master_bathroom","name":"Master Bathroom","floor":"upstairs","room_type":"room","x":440,"y":417,"width":170,"height":131,"svg_path":"M 440,449 L 560,449 L 560,417 L 610,417 L 610,548 L 440,548 Z","notes":"Lower en-suite Master Bathroom (6'5\" x 7'7\") with double vanity and walk-in shower stall.","entryways":[{"id":"door_mbath_master","wall":"left","offset":81,"width":46,"type":"door","target_room":"Master Bedroom"}]},{"id":"margots_room","name":"Margot's Room","floor":"upstairs","room_type":"room","x":353,"y":32,"width":257,"height":222,"svg_path":"M 353,32 L 563,32 L 563,143 L 610,143 L 610,254 L 353,254 Z","notes":"Top-center Nursery (10'6\" x 11'5\") including lower-right reach-in closet (Y=143..254).","entryways":[{"id":"door_margot_hallway","wall":"bottom","offset":155,"width":50,"type":"door","target_room":"Upstairs Hallway & Stairs"}]},{"id":"guest_room","name":"Guest Room","floor":"upstairs","room_type":"room","x":563,"y":32,"width":311,"height":222,"svg_path":"M 563,32 L 874,32 L 874,254 L 610,254 L 610,143 L 563,143 Z","notes":"Top-right Guest Room (13'6\" x 11'5\") including upper-left reach-in closet (Y=32..143).","entryways":[{"id":"door_guest_hallway","wall":"bottom","offset":49,"width":50,"type":"door","target_room":"Upstairs Hallway & Stairs"}]},{"id":"office","name":"Office","floor":"upstairs","room_type":"room","x":671,"y":254,"width":203,"height":294,"notes":"Bottom-right Office (10'3\" x 13'1\") including upper reach-in closet.","entryways":[{"id":"door_office_hallway","wall":"left","offset":4,"width":57,"type":"door","target_room":"Upstairs Hallway & Stairs"}]},{"id":"upstairs_hallway","name":"Upstairs Hallway & Stairs","floor":"upstairs","room_type":"transit","x":353,"y":254,"width":318,"height":101,"svg_path":"M 353,254 L 671,254 L 671,548 L 610,548 L 610,316 L 462,316 L 462,355 L 353,355 Z","notes":"Central upstairs hallway (16'3\" x 3'2\"), North-facing hallway linen closet, and stairwell.","entryways":[{"id":"door_hall_master","wall":"left","offset":2,"width":56,"type":"door","target_room":"Master Bedroom"},{"id":"door_hall_margot","wall":"top","offset":155,"width":50,"type":"door","target_room":"Margot's Room"},{"id":"door_hall_guest","wall":"top","offset":259,"width":50,"type":"door","target_room":"Guest Room"},{"id":"door_hall_office","wall":"right","offset":4,"width":57,"type":"door","target_room":"Office"}]},{"id":"dining_room","name":"Dining Room","floor":"main","room_type":"room","x":68,"y":87,"width":183,"height":203,"notes":"Northwest Dining Room (11'5\" x 13'0\") opening to Kitchen and Living Room.","entryways":[{"id":"arch_dr_kitchen","wall":"right","offset":103,"width":60,"type":"open_passage","target_room":"Kitchen"},{"id":"arch_dr_lr","wall":"bottom","offset":28,"width":116,"type":"open_passage","target_room":"Living Room"}]},{"id":"living_room","name":"Living Room","floor":"main","room_type":"room","x":68,"y":290,"width":273,"height":218,"notes":"Southwest Living Room (17'5\" x 13'9\") with South bay windows and wide opening to Foyer.","entryways":[{"id":"arch_lr_dr","wall":"top","offset":28,"width":116,"type":"open_passage","target_room":"Dining Room"},{"id":"arch_lr_entry","wall":"right","offset":128,"width":84,"type":"open_passage","target_room":"Front Entry"}]},{"id":"kitchen","name":"Kitchen","floor":"main","room_type":"room","x":251,"y":87,"width":283,"height":203,"notes":"Central Kitchen (10'3\" x 13'0\") and Breakfast Nook (8'1\" x 13'0\") with island counter.","entryways":[{"id":"arch_kitchen_dr","wall":"left","offset":103,"width":60,"type":"open_passage","target_room":"Dining Room"},{"id":"arch_kitchen_fr","wall":"right","offset":10,"width":185,"type":"open_passage","target_room":"Family Room"},{"id":"path_kitchen_entry","wall":"bottom","offset":159,"width":124,"type":"open_passage","target_room":"Front Entry"}]},{"id":"powder_bath","name":"Powder Bath","floor":"main","room_type":"room","x":341,"y":290,"width":69,"height":92,"notes":"Main floor half-bath (4'3\" x 4'11\") off Foyer.","entryways":[{"id":"door_powder_foyer","wall":"right","offset":55,"width":33,"type":"door","target_room":"Front Entry"}]},{"id":"front_entry","name":"Front Entry","floor":"main","room_type":"room","x":341,"y":290,"width":193,"height":218,"svg_path":"M 410,290 L 534,290 L 534,508 L 341,508 L 341,382 L 410,382 Z","notes":"Main Foyer (8'9\" x 13'6\"), coat closet, front door, and stairs to Upper Level.","entryways":[{"id":"arch_entry_lr","wall":"left","offset":128,"width":84,"type":"open_passage","target_room":"Living Room"},{"id":"path_entry_kitchen","wall":"top","offset":69,"width":124,"type":"open_passage","target_room":"Kitchen"},{"id":"door_front_entry","wall":"bottom","offset":85,"width":50,"type":"door","target_room":"Exterior"}]},{"id":"family_room","name":"Family Room","floor":"main","room_type":"room","x":534,"y":87,"width":298,"height":203,"notes":"East Family Room (19'4\" x 12'9\") with North fireplace and solid green South wall.","entryways":[{"id":"arch_fr_kitchen","wall":"left","offset":10,"width":185,"type":"open_passage","target_room":"Kitchen"}]},{"id":"laundry_room","name":"Laundry Room","floor":"main","room_type":"room","x":534,"y":290,"width":174,"height":131,"notes":"Main floor Laundry / Mudroom (11'3\" x 8'5\") with door on West wall to Hallway/Foyer and South door to Garage.","entryways":[{"id":"door_laundry_hall","wall":"left","offset":10,"width":48,"type":"door","target_room":"Front Entry"},{"id":"door_fr_laundry","wall":"bottom","offset":85,"width":48,"type":"door","target_room":"Garage"}]},{"id":"garage","name":"Garage","floor":"main","room_type":"room","x":534,"y":421,"width":298,"height":134,"notes":"2-car Garage below Laundry Room.","entryways":[{"id":"door_garage_fr","wall":"top","offset":85,"width":48,"type":"door","target_room":"Laundry Room"}]},{"id":"basement_theater","name":"Basement Theater","floor":"basement","room_type":"room","x":93,"y":42,"width":267,"height":490,"notes":"West side of Recreation Room with TV/fireplace wall, sectional couch, North wall ballpit, and South bi-fold closets.","entryways":[{"id":"arch_theater_play","wall":"right","offset":20,"width":430,"type":"open_passage","target_room":"Basement Play Area"}]},{"id":"basement_play_area","name":"Basement Play Area","floor":"basement","room_type":"room","x":360,"y":42,"width":335,"height":490,"svg_path":"M 360,42 L 524,42 L 524,135 L 695,135 L 695,230 L 572,230 L 572,410 L 635,410 L 635,532 L 360,532 Z","notes":"East side of Recreation Room including Wet Bar (9'0\" x 8'5\"), Play Area mats, East hallway (7'0\" x 4'8\"), and stairs.","entryways":[{"id":"arch_play_theater","wall":"left","offset":20,"width":430,"type":"open_passage","target_room":"Basement Theater"},{"id":"door_play_bbath","wall":"top","offset":215,"width":45,"type":"door","target_room":"Basement Bathroom"},{"id":"door_play_storage","wall":"right","offset":103,"width":70,"type":"door","target_room":"Storage Room"}]},{"id":"basement_bathroom","name":"Basement Bathroom","floor":"basement","room_type":"transit","x":524,"y":42,"width":171,"height":93,"notes":"Basement Bathroom (5'11\" x 4'7\") to the right of Wet Bar opening South into basement hallway.","entryways":[{"id":"door_bbath_play","wall":"bottom","offset":51,"width":45,"type":"door","target_room":"Basement Play Area"}]},{"id":"storage_room","name":"Storage Room","floor":"basement","room_type":"room","x":695,"y":42,"width":220,"height":318,"notes":"East Storage Room / Gym opening West into the basement hallway.","entryways":[{"id":"door_storage_play","wall":"left","offset":103,"width":70,"type":"door","target_room":"Basement Play Area"}]}]},"connected_rooms_map":{"Master Bedroom":["Front Entry","Guest Room","Margot's Room","Master Bathroom","Master W.I.C","Office","Upstairs Bathroom"],"Master W.I.C":["Master Bedroom"],"Upstairs Bathroom":["Front Entry","Guest Room","Margot's Room","Master Bedroom","Office"],"Master Bathroom":["Master Bedroom"],"Margot's Room":["Front Entry","Guest Room","Master Bedroom","Office","Upstairs Bathroom"],"Guest Room":["Front Entry","Margot's Room","Master Bedroom","Office","Upstairs Bathroom"],"Office":["Front Entry","Guest Room","Margot's Room","Master Bedroom","Upstairs Bathroom"],"Dining Room":["Kitchen","Living Room"],"Living Room":["Dining Room","Front Entry"],"Kitchen":["Dining Room","Family Room","Front Entry"],"Powder Bath":["Front Entry"],"Front Entry":["Family Room","Guest Room","Kitchen","Laundry Room","Living Room","Margot's Room","Master Bedroom","Office","Powder Bath","Upstairs Bathroom"],"Family Room":["Basement Play Area","Basement Theater","Front Entry","Garage","Kitchen"],"Laundry Room":["Front Entry","Garage"],"Garage":["Family Room","Laundry Room"],"Basement Theater":["Basement Play Area","Family Room"],"Basement Play Area":["Basement Theater","Family Room","Storage Room"],"Storage Room":["Basement Play Area"]},"seal_analysis":{"Master Bedroom":{"can_be_bounded":false,"recommended_mode":"open","monitored_doors":[],"unsealed_exits":["Upstairs Hallway & Stairs (unmonitored door)","Master W.I.C (unmonitored door)","Master Bathroom (unmonitored door)"]},"Master W.I.C":{"can_be_bounded":false,"recommended_mode":"open","monitored_doors":[],"unsealed_exits":["Master Bedroom (unmonitored door)"]},"Upstairs Bathroom":{"can_be_bounded":false,"recommended_mode":"open","monitored_doors":[],"unsealed_exits":["Upstairs Hallway & Stairs (unmonitored door)"]},"Master Bathroom":{"can_be_bounded":false,"recommended_mode":"open","monitored_doors":[],"unsealed_exits":["Master Bedroom (unmonitored door)"]},"Margot's Room":{"can_be_bounded":false,"recommended_mode":"open","monitored_doors":[],"unsealed_exits":["Upstairs Hallway & Stairs (unmonitored door)"]},"Guest Room":{"can_be_bounded":false,"recommended_mode":"open","monitored_doors":[],"unsealed_exits":["Upstairs Hallway & Stairs (unmonitored door)"]},"Office":{"can_be_bounded":false,"recommended_mode":"open","monitored_doors":[],"unsealed_exits":["Upstairs Hallway & Stairs (unmonitored door)"]},"Dining Room":{"can_be_bounded":false,"recommended_mode":"open","monitored_doors":[],"unsealed_exits":["Living Room (open passage)","Kitchen (open passage)"]},"Living Room":{"can_be_bounded":false,"recommended_mode":"open","monitored_doors":[],"unsealed_exits":["Front Entry (open passage)","Dining Room (open passage)"]},"Kitchen":{"can_be_bounded":false,"recommended_mode":"open","monitored_doors":[],"unsealed_exits":["Front Entry (open passage)","Dining Room (open passage)","Family Room (open passage)"]},"Powder Bath":{"can_be_bounded":false,"recommended_mode":"open","monitored_doors":[],"unsealed_exits":["Front Entry (unmonitored door)"]},"Front Entry":{"can_be_bounded":false,"recommended_mode":"open","monitored_doors":[],"unsealed_exits":["Living Room (open passage)","Kitchen (open passage)","Family Room (open passage)","Powder Bath (unmonitored door)","Laundry Room (unmonitored door)","Upstairs Hallway & Stairs (stairs)"]},"Family Room":{"can_be_bounded":false,"recommended_mode":"open","monitored_doors":[],"unsealed_exits":["Front Entry (open passage)","Kitchen (open passage)","Garage (unmonitored door)","Basement Play Area (stairs)","Basement Theater (stairs)"]},"Laundry Room":{"can_be_bounded":false,"recommended_mode":"open","monitored_doors":[],"unsealed_exits":["Front Entry (unmonitored door)","Garage (unmonitored door)"]},"Garage":{"can_be_bounded":false,"recommended_mode":"open","monitored_doors":[],"unsealed_exits":["Family Room (unmonitored door)","Laundry Room (unmonitored door)"]},"Basement Theater":{"can_be_bounded":false,"recommended_mode":"open","monitored_doors":[],"unsealed_exits":["Family Room (stairs)","Basement Play Area (open passage)"]},"Basement Play Area":{"can_be_bounded":false,"recommended_mode":"open","monitored_doors":[],"unsealed_exits":["Family Room (stairs)","Basement Theater (open passage)","Storage Room (unmonitored door)","Basement Bathroom (unmonitored door)"]},"Storage Room":{"can_be_bounded":false,"recommended_mode":"open","monitored_doors":[],"unsealed_exits":["Basement Play Area (unmonitored door)"]}},"camera_analysis":[{"camera_id":"camera.living_room","name":"Living Room Camera","host_room":"Living Room","floor":"main","zones":["living_room_couch","living_room_floor","living_room_bay_windows","living_room_entry"],"sub_zones":[{"id":"living_room_couch","entity_id":"binary_sensor.living_room_couch_person_occupancy","label":"Living Room Couch","room":"Living Room","x":105,"y":355,"width":125,"height":100},{"id":"living_room_floor","entity_id":"binary_sensor.living_room_floor_person_occupancy","label":"Living Room Floor","room":"Living Room","x":235,"y":365,"width":95,"height":100},{"id":"living_room_bay_windows","entity_id":"binary_sensor.living_room_bay_windows_person_occupancy","label":"Bay Windows","room":"Living Room","x":115,"y":468,"width":165,"height":38},{"id":"living_room_entry","entity_id":"binary_sensor.living_room_entry_person_occupancy","label":"Front Entry Archway","room":"Front Entry","x":350,"y":415,"width":80,"height":80}],"spillover_targets":[{"room_name":"Front Entry","overlap_pct":27.0}],"has_multi_room_bleed":true,"visibility_polygon":[[76.0,335.0],[251.0,253.4],[251.0,258.86],[251.0,264.2],[251.0,269.43],[251.0,274.56],[251.0,277.03],[212.0,290.0],[212.16,290.0],[218.14,290.0],[232.1,290.0],[248.82,290.0],[250.75,290.0],[251.0,290.0],[251.25,290.0],[269.25,290.0],[294.8,290.0],[327.74,290.0],[340.44,290.0],[341.0,290.0],[341.0,290.1],[341.0,294.69],[341.0,299.2],[341.0,299.3],[341.0,299.39],[341.0,301.7],[341.0,308.66],[341.0,308.87],[341.0,308.96],[341.0,309.06],[341.0,314.66],[341.0,314.75],[341.0,314.84],[341.0,315.59],[341.0,316.04],[341.0,316.13],[341.0,316.22],[341.0,319.13],[341.0,319.23],[341.0,319.32],[341.0,322.49],[341.0,329.37],[341.0,336.25],[341.0,342.43],[341.0,342.52],[341.0,342.61],[341.0,342.84],[341.0,342.93],[341.0,343.03],[341.0,343.13],[341.0,350.02],[341.0,356.93],[341.0,363.86],[341.0,365.05],[341.0,365.15],[341.0,365.24],[341.0,370.84],[341.0,370.97],[341.0,371.06],[341.0,371.15],[341.0,372.2],[341.0,372.29],[341.0,372.38],[341.0,377.87],[341.0,381.9],[341.0,382.0],[341.0,382.1],[341.0,384.66],[341.0,384.76],[341.0,384.86],[341.0,384.96],[341.0,392.11],[341.0,399.35],[341.0,400.76],[341.0,400.85],[341.0,400.95],[341.0,406.68],[341.0,414.11],[341.0,417.9],[341.0,418.0],[534.0,478.62],[534.0,484.77],[534.0,498.04],[534.0,507.82],[534.0,508.0],[533.52,508.0],[524.78,508.0],[492.27,508.0],[463.58,508.0],[438.04,508.0],[436.48,508.0],[436.15,508.0],[435.83,508.0],[415.14,508.0],[394.45,508.0],[375.64,508.0],[358.46,508.0],[350.73,508.0],[341.0,502.0],[341.0,502.13],[341.0,506.92],[341.0,507.87],[341.0,508.0],[340.8,508.0],[328.1,508.0],[314.59,508.0],[302.01,508.0],[290.26,508.0],[279.24,508.0],[268.87,508.0],[259.08,508.0],[249.82,508.0],[241.03,508.0],[232.66,508.0],[224.68,508.0],[217.04,508.0],[209.72,508.0],[202.69,508.0],[195.92,508.0],[189.39,508.0],[183.08,508.0],[176.97,508.0],[171.04,508.0],[165.28,508.0],[159.67,508.0],[154.2,508.0],[148.86,508.0],[143.63,508.0],[138.51,508.0],[133.48,508.0],[128.53,508.0],[123.67,508.0],[118.87,508.0],[114.14,508.0],[109.46,508.0],[104.82,508.0],[100.23,508.0],[95.67,508.0],[91.14,508.0]]},{"camera_id":"camera.dining_room","name":"Dining Room Camera","host_room":"Dining Room","floor":"main","zones":["dining_room_table","rileys_food"],"sub_zones":[{"id":"dining_room_table","entity_id":"binary_sensor.dining_room_table_person_occupancy","label":"Dining Table","room":"Dining Room","x":105,"y":145,"width":110,"height":110},{"id":"rileys_food","entity_id":"binary_sensor.rileys_food_person_occupancy","label":"Riley's Food Corner","room":"Dining Room","x":170,"y":96,"width":65,"height":42}],"spillover_targets":[{"room_name":"Living Room","overlap_pct":23.0}],"has_multi_room_bleed":true,"visibility_polygon":[[242.0,96.0],[251.0,125.44],[251.0,128.42],[251.0,132.02],[251.0,132.85],[251.0,132.91],[251.0,132.97],[251.0,133.4],[251.0,133.45],[251.0,133.51],[251.0,136.46],[251.0,142.07],[251.0,149.39],[251.0,159.39],[251.0,173.85],[251.0,189.66],[251.0,190.0],[260.51,290.0],[259.34,290.0],[254.28,290.0],[253.41,290.0],[253.34,290.0],[251.0,250.93],[251.0,288.55],[251.0,290.0],[250.93,290.0],[249.23,290.0],[244.2,290.0],[239.16,290.0],[234.13,290.0],[229.08,290.0],[224.01,290.0],[218.92,290.0],[213.8,290.0],[212.07,290.0],[212.0,290.0],[192.99,412.22],[187.77,411.37],[179.61,409.86],[171.49,408.13],[163.41,406.2],[155.39,404.06],[147.43,401.71],[139.53,399.15],[131.7,396.39],[123.95,393.43],[117.6,390.83],[117.5,390.79],[117.4,390.74],[116.27,390.27],[108.68,386.91],[101.18,383.35],[93.77,379.6],[86.46,375.66],[79.26,371.53],[72.17,367.22],[68.0,358.48],[68.0,344.25],[68.0,331.03],[68.0,327.37],[96.0,290.0],[95.89,290.0],[90.43,290.0],[82.16,290.0],[73.52,290.0],[68.12,290.0],[68.0,290.0],[68.0,289.86],[68.0,286.16],[68.0,276.52],[68.0,267.39],[68.0,258.72],[68.0,250.46],[68.0,242.56],[68.0,235.01],[68.0,227.76],[68.0,220.8],[68.0,214.08],[68.0,207.6],[68.0,201.33],[68.0,195.26],[68.0,189.36],[68.0,183.63],[68.0,178.04],[68.0,172.59],[68.0,167.26],[68.0,162.04],[68.0,156.92],[68.0,151.9],[68.0,146.96],[68.0,142.1],[68.0,137.3],[68.0,132.56],[68.0,127.87],[68.0,123.22],[68.0,118.62],[68.0,114.04],[68.0,109.49],[68.0,104.95],[68.0,100.43],[68.0,95.92],[68.0,91.4],[68.0,87.06],[68.0,87.0],[69.17,87.0],[70.27,87.0]]},{"camera_id":"camera.family_room","name":"Family Room Camera","host_room":"Family Room","floor":"main","zones":["family_room_couch","family_room_recliner","family_room_floor","kitchen_island"],"sub_zones":[{"id":"family_room_couch","entity_id":"binary_sensor.family_room_couch_person_occupancy","label":"Family Room Couch","room":"Family Room","x":635,"y":195,"width":150,"height":88},{"id":"family_room_recliner","entity_id":"binary_sensor.family_room_recliner_person_occupancy","label":"Family Room Recliner","room":"Family Room","x":545,"y":115,"width":80,"height":75},{"id":"family_room_floor","entity_id":"binary_sensor.family_room_floor_person_occupancy","label":"Family Room Floor","room":"Family Room","x":545,"y":195,"width":85,"height":88},{"id":"kitchen_island","entity_id":"binary_sensor.kitchen_island_person_occupancy","label":"Kitchen Island","room":"Kitchen","x":335,"y":155,"width":120,"height":95}],"spillover_targets":[{"room_name":"Dining Room","overlap_pct":6.0},{"room_name":"Kitchen","overlap_pct":100.0},{"room_name":"Powder Bath","overlap_pct":17.0},{"room_name":"Front Entry","overlap_pct":18.0}],"has_multi_room_bleed":true,"visibility_polygon":[[818.0,96.0],[828.17,290.0],[826.42,290.0],[826.36,290.0],[826.29,290.0],[823.98,290.0],[823.92,290.0],[823.85,290.0],[823.13,290.0],[818.09,290.0],[813.06,290.0],[808.02,290.0],[802.96,290.0],[797.89,290.0],[792.79,290.0],[787.65,290.0],[782.47,290.0],[777.24,290.0],[771.96,290.0],[766.61,290.0],[761.18,290.0],[755.67,290.0],[752.41,290.0],[752.34,290.0],[752.26,290.0],[750.07,290.0],[744.37,290.0],[738.55,290.0],[732.61,290.0],[726.53,290.0],[720.3,290.0],[713.91,290.0],[708.09,290.0],[708.0,290.0],[707.91,290.0],[707.33,290.0],[700.56,290.0],[698.06,290.0],[697.97,290.0],[697.87,290.0],[693.57,290.0],[686.34,290.0],[684.37,290.0],[684.27,290.0],[684.17,290.0],[678.86,290.0],[671.09,290.0],[663.01,290.0],[654.59,290.0],[648.59,290.0],[648.47,290.0],[648.35,290.0],[645.79,290.0],[636.58,290.0],[626.91,290.0],[616.73,290.0],[605.99,290.0],[599.52,290.0],[599.36,290.0],[599.21,290.0],[594.62,290.0],[593.55,290.0],[593.39,290.0],[593.23,290.0],[590.24,290.0],[590.07,290.0],[589.91,290.0],[582.55,290.0],[572.36,290.0],[572.19,290.0],[572.01,290.0],[569.69,290.0],[555.95,290.0],[548.12,290.0],[547.92,290.0],[547.72,290.0],[541.45,290.0],[541.24,290.0],[541.22,290.0],[541.04,290.0],[534.21,290.0],[534.0,290.0],[399.01,382.0],[394.65,382.0],[394.33,382.0],[394.01,382.0],[386.56,382.0],[361.26,382.0],[349.74,382.0],[410.0,345.0],[410.0,344.8],[410.0,340.82],[410.0,340.63],[410.0,340.44],[410.0,336.98],[410.0,322.91],[410.0,320.31],[410.0,320.13],[410.0,319.94],[410.0,309.25],[410.0,295.95],[410.0,290.17],[410.0,290.0],[409.63,290.0],[394.69,290.0],[363.94,290.0],[341.48,290.0],[341.0,290.0],[340.52,290.0],[329.22,290.0],[289.65,290.0],[251.65,290.0],[251.0,290.0],[251.0,289.78],[251.0,287.65],[251.0,277.73],[251.0,277.51],[251.0,277.3],[251.0,271.4],[251.0,255.41],[251.0,250.21],[219.68,258.51],[219.62,258.3],[219.29,257.09],[219.24,256.89],[219.18,256.68],[217.81,251.47],[217.76,251.26],[217.7,251.05],[216.99,248.26],[213.24,232.62],[209.9,216.88],[206.97,201.07],[206.38,197.62],[251.0,190.0],[251.0,189.8],[251.0,178.42],[251.0,163.45],[251.0,148.57],[251.0,133.77],[251.0,119.01],[251.0,104.29],[251.0,89.58],[251.0,89.39],[251.0,89.2],[251.0,89.0],[251.0,87.2],[251.01,87.0],[263.22,87.0],[576.6,87.0],[675.8,87.0],[717.32,87.0],[740.15,87.0],[754.61,87.0],[764.61,87.0],[771.93,87.0],[777.54,87.0],[781.98,87.0],[785.58,87.0],[788.56,87.0]]},{"camera_id":"camera.garage","name":"Garage Camera","host_room":"Garage","floor":"main","zones":["garage_parking"],"sub_zones":[{"id":"garage_parking","entity_id":"binary_sensor.garage_parking_person_occupancy","label":"Garage Parking Bay","room":"Garage","x":595,"y":438,"width":170,"height":108}],"spillover_targets":[],"has_multi_room_bleed":false,"visibility_polygon":[[680.0,423.0],[832.0,444.36],[832.0,448.41],[832.0,452.5],[832.0,456.62],[832.0,460.8],[832.0,465.02],[832.0,469.31],[832.0,473.67],[832.0,478.11],[832.0,482.62],[832.0,487.24],[832.0,491.95],[832.0,496.78],[832.0,501.73],[832.0,506.81],[832.0,512.05],[832.0,517.44],[832.0,523.02],[832.0,528.79],[832.0,534.77],[832.0,540.98],[832.0,547.45],[832.0,554.2],[832.0,554.91],[832.0,555.0],[831.89,555.0],[825.11,555.0],[817.74,555.0],[810.75,555.0],[804.11,555.0],[797.8,555.0],[791.76,555.0],[785.99,555.0],[780.46,555.0],[775.14,555.0],[770.01,555.0],[765.07,555.0],[760.29,555.0],[755.65,555.0],[751.16,555.0],[746.78,555.0],[742.52,555.0],[738.37,555.0],[734.31,555.0],[730.33,555.0],[726.44,555.0],[722.61,555.0],[718.85,555.0],[715.14,555.0],[711.49,555.0],[707.88,555.0],[704.31,555.0],[700.78,555.0],[697.27,555.0],[693.79,555.0],[690.33,555.0],[686.88,555.0],[683.44,555.0],[680.0,555.0],[676.56,555.0],[673.12,555.0],[669.67,555.0],[666.21,555.0],[662.73,555.0],[659.22,555.0],[655.69,555.0],[652.12,555.0],[648.51,555.0],[644.86,555.0],[641.15,555.0],[637.39,555.0],[633.56,555.0],[629.67,555.0],[625.69,555.0],[621.63,555.0],[617.48,555.0],[613.22,555.0],[608.84,555.0],[604.35,555.0],[599.71,555.0],[594.93,555.0],[589.99,555.0],[584.86,555.0],[579.54,555.0],[574.01,555.0],[568.24,555.0],[562.2,555.0],[555.89,555.0],[549.25,555.0],[542.26,555.0],[534.89,555.0],[534.1,555.0],[534.0,555.0],[534.0,554.91],[534.0,549.02],[534.0,542.54],[534.0,536.32],[534.0,530.35],[534.0,524.61],[534.0,519.07],[534.0,513.72],[534.0,508.53],[534.0,508.07],[534.0,508.0],[534.0,507.93],[534.0,503.51],[534.0,498.62],[534.0,493.87],[534.0,489.23],[534.0,484.7],[534.0,480.27],[534.0,475.93],[534.0,471.67],[534.0,467.48],[534.0,463.36],[534.0,459.66],[534.0,459.61],[534.0,459.55],[534.0,459.3],[534.0,457.08],[534.0,457.02],[534.0,456.97],[534.0,455.29],[534.0,451.33],[534.0,447.41],[534.0,443.52]]},{"camera_id":"camera.master_bedroom","name":"Master Bedroom Camera","host_room":"Master Bedroom","floor":"upstairs","zones":["master_bed","master_open_area","master_bedroom_walkway","master_bedroom_entryway","master_bathroom"],"sub_zones":[{"id":"master_bed","entity_id":"binary_sensor.master_bed_person_occupancy","label":"Master Bed","room":"Master Bedroom","x":134,"y":250,"width":135,"height":155},{"id":"master_open_area","entity_id":"binary_sensor.master_open_area_person_occupancy","label":"Master Open Floor","room":"Master Bedroom","x":140,"y":55,"width":145,"height":165},{"id":"master_bedroom_walkway","entity_id":"binary_sensor.master_bedroom_walkway_person_occupancy","label":"Master Walkway","room":"Master Bedroom","x":278,"y":225,"width":68,"height":220},{"id":"master_bedroom_entryway","entity_id":"binary_sensor.master_bedroom_entryway_person_occupancy","label":"Master Hallway Entry","room":"Master Bedroom","x":305,"y":256,"width":48,"height":56},{"id":"master_bathroom","entity_id":"binary_sensor.master_bathroom_person_occupancy","label":"Master Bath Doorway","room":"Master Bathroom","x":425,"y":486,"width":55,"height":56}],"spillover_targets":[{"room_name":"Master Bathroom","overlap_pct":46.0},{"room_name":"Upstairs Hallway & Stairs","overlap_pct":18.0}],"has_multi_room_bleed":true,"visibility_polygon":[[134.0,536.0],[126.0,498.36],[126.0,492.89],[126.0,485.64],[126.0,475.56],[126.0,460.57],[126.0,435.86],[126.0,387.38],[126.0,248.63],[126.0,42.86],[126.0,32.01],[126.18,32.0],[133.05,32.0],[146.13,32.0],[159.22,32.0],[172.35,32.0],[185.53,32.0],[198.78,32.0],[212.12,32.0],[225.57,32.0],[239.14,32.0],[252.86,32.0],[266.76,32.0],[280.84,32.0],[295.13,32.0],[309.67,32.0],[324.47,32.0],[339.57,32.0],[352.79,32.0],[353.0,32.0],[353.0,32.48],[353.0,36.53],[353.0,69.8],[353.0,99.59],[353.0,126.45],[353.0,150.83],[353.0,173.08],[353.0,193.49],[353.0,212.31],[353.0,229.74],[353.0,245.95],[353.0,253.8],[353.0,254.0],[353.0,254.2],[353.0,255.8],[353.0,256.0],[354.72,254.0],[358.64,254.0],[370.85,254.0],[373.87,254.0],[374.04,254.0],[374.21,254.0],[383.61,254.0],[396.97,254.0],[400.15,254.0],[400.33,254.0],[400.52,254.0],[405.53,254.0],[405.72,254.0],[405.91,254.0],[409.51,254.0],[353.0,312.0],[353.0,312.16],[353.0,313.04],[353.0,315.85],[353.0,316.0],[353.0,316.15],[353.0,324.31],[353.0,329.96],[353.0,330.1],[353.0,330.25],[353.0,335.04],[353.0,335.24],[353.0,335.38],[353.0,335.52],[353.0,339.83],[353.0,339.97],[353.0,340.11],[353.0,345.26],[353.0,349.07],[353.0,349.21],[353.0,349.34],[353.0,354.87],[353.0,355.0],[353.0,355.04],[353.0,355.06],[353.0,355.13],[353.0,355.19],[353.0,355.32],[353.0,364.4],[353.0,370.75],[353.0,370.87],[353.0,370.99],[353.0,373.1],[353.0,373.21],[353.0,373.33],[353.0,373.39],[353.0,381.46],[353.0,381.58],[353.0,381.69],[353.0,382.04],[353.0,385.8],[353.0,385.92],[353.0,386.03],[353.0,386.73],[353.0,386.84],[353.0,386.96],[353.0,389.0],[353.0,389.11],[353.0,389.22],[353.0,390.23],[353.0,390.34],[353.0,390.38],[353.0,390.45],[353.0,391.93],[353.0,392.04],[353.0,392.15],[353.0,392.3],[353.0,392.41],[353.0,392.52],[353.0,398.43],[353.0,406.15],[353.0,406.23],[353.0,406.26],[353.0,406.36],[353.0,406.7],[353.0,406.8],[353.0,406.9],[353.0,407.07],[353.0,407.18],[353.0,407.28],[353.0,413.79],[353.0,415.05],[353.0,415.15],[353.0,415.25],[353.0,418.94],[353.0,419.03],[353.0,419.13],[353.0,420.9],[353.0,420.91],[353.0,420.99],[353.0,421.01],[353.0,421.09],[353.0,421.11],[353.0,421.14],[353.0,421.25],[353.0,421.34],[353.0,421.44],[353.0,422.53],[353.0,422.63],[353.0,422.72],[353.0,428.29],[353.0,433.15],[353.0,433.24],[353.0,433.33],[353.0,434.69],[353.0,434.78],[353.0,434.87],[353.0,435.26],[353.0,442.06],[353.0,444.76],[353.0,444.85],[353.0,444.94],[353.0,445.78],[353.0,445.87],[353.0,445.96],[353.0,448.46],[353.0,448.55],[353.0,448.63],[353.0,448.72],[353.0,450.59],[353.0,450.68],[353.0,450.76],[353.0,452.46],[353.0,452.54],[353.0,452.63],[353.0,455.24],[353.0,461.63],[353.0,463.32],[353.0,463.4],[353.0,463.49],[353.0,464.89],[353.0,464.97],[353.0,465.06],[353.0,467.91],[353.0,473.65],[353.0,473.74],[353.0,473.82],[353.0,474.1],[353.0,474.74],[353.0,474.82],[353.0,474.91],[353.0,477.83],[353.0,477.91],[353.0,477.99],[353.0,480.19],[353.0,481.17],[353.0,481.25],[353.0,481.33],[353.0,483.92],[353.0,484.0],[353.34,484.0],[362.68,484.0],[388.17,484.0],[388.62,484.0],[389.08,484.0],[393.66,484.0],[397.51,484.0],[398.0,484.0],[398.49,484.0],[433.87,484.0],[439.35,484.0],[440.0,484.0],[440.0,484.11],[440.0,491.08],[440.0,497.89],[440.0,498.0],[610.0,477.06],[610.0,478.69],[610.0,491.19],[610.0,503.62],[610.0,516.0],[610.0,528.37],[610.0,540.72],[610.0,543.55],[610.0,543.72],[610.0,543.88],[610.0,546.47],[610.0,546.64],[610.0,546.8],[610.0,547.83],[610.0,548.0],[603.5,548.0],[599.21,548.0],[440.0,544.0],[440.0,544.11],[440.0,546.98],[440.0,547.89],[440.0,548.0],[437.3,548.0],[327.95,548.0],[270.42,548.0],[239.1,548.0],[219.38,548.0]]},{"camera_id":"camera.nursery","name":"Nursery Camera","host_room":"Margot's Room","floor":"upstairs","zones":["nursery_bed"],"sub_zones":[{"id":"nursery_bed","entity_id":"binary_sensor.nursery_bed_person_occupancy","label":"Nursery Bed","room":"Margot's Room","x":370,"y":95,"width":125,"height":115}],"spillover_targets":[{"room_name":"Guest Room","overlap_pct":8.0}],"has_multi_room_bleed":true,"visibility_polygon":[[358.0,246.0],[353.0,225.95],[353.0,223.47],[353.0,220.34],[353.0,216.25],[353.0,210.67],[353.0,202.57],[353.0,189.77],[353.0,166.41],[353.0,110.17],[353.0,35.15],[353.0,32.0],[353.07,32.0],[355.68,32.0],[361.23,32.0],[366.79,32.0],[372.36,32.0],[377.94,32.0],[383.56,32.0],[389.21,32.0],[394.9,32.0],[400.65,32.0],[406.45,32.0],[412.32,32.0],[418.27,32.0],[424.31,32.0],[430.45,32.0],[436.69,32.0],[443.06,32.0],[449.55,32.0],[456.2,32.0],[463.0,32.0],[469.98,32.0],[477.15,32.0],[484.53,32.0],[492.14,32.0],[500.01,32.0],[508.15,32.0],[516.59,32.0],[525.36,32.0],[534.49,32.0],[544.03,32.0],[554.0,32.0],[562.86,32.0],[563.0,32.0],[563.0,32.15],[563.0,33.52],[563.0,44.26],[563.0,54.47],[563.0,64.2],[563.0,71.79],[563.0,71.91],[563.0,72.04],[563.0,73.49],[563.0,79.93],[563.0,80.05],[563.0,80.17],[563.0,82.38],[563.0,90.91],[563.0,99.12],[563.0,107.02],[563.0,114.65],[563.0,122.03],[563.0,129.19],[563.0,136.13],[563.0,142.88],[563.0,142.91],[563.0,143.0],[563.0,143.09],[563.0,149.46],[563.0,151.55],[563.0,151.64],[563.0,151.72],[563.0,151.91],[563.0,152.0],[582.83,143.0],[592.31,143.0],[609.75,143.0],[609.85,143.0],[610.0,143.0],[610.0,143.1],[610.0,150.49],[610.0,157.9],[610.0,165.17],[610.0,172.32],[610.0,179.37],[610.0,186.32],[610.0,193.18],[610.0,199.97],[610.0,206.7],[610.0,213.37],[610.0,219.99],[610.0,226.59],[610.0,233.15],[610.0,239.7],[610.0,241.0],[563.0,242.0],[563.0,242.07],[563.0,246.19],[563.0,250.28],[563.0,250.35],[563.0,250.42],[563.0,251.17],[563.0,251.24],[563.0,251.31],[563.0,251.32],[563.0,251.39],[563.0,251.47],[563.0,251.51],[563.0,252.39],[563.0,252.44],[563.0,252.46],[563.0,252.51],[563.0,252.53],[563.0,252.58],[563.0,253.79],[563.0,253.86],[563.0,253.93],[563.0,253.93],[563.0,253.94],[563.0,254.0],[562.67,254.0],[561.18,254.0],[560.86,254.0],[559.76,254.0],[558.0,254.0],[558.0,254.07],[558.0,256.58],[558.0,256.6],[508.0,254.0],[507.02,254.0],[492.12,254.0],[491.33,254.0],[490.56,254.0],[459.34,254.0],[458.44,254.0],[458.0,254.0],[457.56,254.0],[438.28,254.0],[438.0,254.0],[437.72,254.0],[434.11,254.0]]},{"camera_id":"camera.office","name":"Office Camera","host_room":"Office","floor":"upstairs","zones":["steves_desk","sim_rig","office_floor","office_entryway"],"sub_zones":[{"id":"steves_desk","entity_id":"binary_sensor.steves_desk_person_occupancy","label":"Steve's Desk","room":"Office","x":745,"y":360,"width":105,"height":95},{"id":"sim_rig","entity_id":"binary_sensor.sim_rig_person_occupancy","label":"Sim Rig","room":"Office","x":680,"y":425,"width":65,"height":95},{"id":"office_floor","entity_id":"binary_sensor.office_floor_person_occupancy","label":"Office Center Floor","room":"Office","x":685,"y":310,"width":95,"height":95},{"id":"office_entryway","entity_id":"binary_sensor.office_entryway_person_occupancy","label":"Office Doorway","room":"Office","x":665,"y":258,"width":45,"height":55}],"spillover_targets":[{"room_name":"Upstairs Hallway & Stairs","overlap_pct":18.0}],"has_multi_room_bleed":true,"visibility_polygon":[[678.0,538.0],[671.0,505.07],[671.0,500.28],[671.0,497.42],[671.0,497.34],[671.0,497.25],[671.0,496.09],[671.0,496.0],[671.0,495.91],[671.0,493.94],[671.0,487.07],[671.0,486.94],[671.0,486.81],[671.0,486.05],[671.0,485.91],[671.0,485.77],[671.0,485.12],[671.0,472.0],[671.0,450.38],[671.0,418.64],[671.0,417.92],[671.0,417.2],[671.0,414.52],[671.0,413.75],[671.0,412.97],[671.0,407.95],[671.0,388.36],[671.0,387.23],[671.0,386.09],[671.0,317.45],[669.21,258.0],[669.31,258.0],[670.21,258.0],[670.9,258.0],[671.0,258.0],[671.0,257.96],[671.0,254.03],[671.0,254.0],[671.1,254.0],[677.46,254.0],[684.83,254.0],[692.21,254.0],[699.61,254.0],[707.04,254.0],[714.5,254.0],[722.02,254.0],[729.6,254.0],[734.9,254.0],[735.0,254.0],[735.0,254.51],[735.0,264.77],[735.0,295.62],[735.0,296.0],[735.07,296.0],[735.09,296.0],[741.74,296.0],[748.51,296.0],[749.91,296.0],[750.0,296.0],[762.6,254.0],[768.8,254.0],[776.99,254.0],[785.33,254.0],[787.89,254.0],[788.01,254.0],[788.12,254.0],[793.84,254.0],[802.52,254.0],[811.41,254.0],[820.52,254.0],[829.87,254.0],[839.48,254.0],[849.37,254.0],[859.59,254.0],[870.15,254.0],[873.85,254.0],[874.0,254.0],[874.0,254.21],[874.0,263.9],[874.0,274.3],[874.0,274.49],[858.13,296.0],[860.72,296.0],[870.77,296.0],[873.86,296.0],[874.0,296.0],[874.0,296.17],[874.0,304.64],[874.0,316.57],[874.0,327.82],[874.0,338.45],[874.0,348.55],[874.0,358.14],[874.0,367.29],[874.0,376.04],[874.0,384.42],[874.0,392.47],[874.0,400.21],[874.0,407.67],[874.0,414.88],[874.0,421.86],[874.0,428.63],[874.0,435.2],[874.0,441.6],[874.0,447.84],[874.0,453.93],[874.0,459.88],[874.0,465.72],[874.0,471.44],[874.0,477.06],[874.0,482.6],[874.0,488.05],[874.0,493.43],[874.0,498.75],[874.0,504.01],[874.0,509.23],[874.0,514.4],[874.0,519.55],[874.0,524.67],[874.0,529.77],[874.0,534.86],[874.0,539.94],[874.0,545.03],[874.0,547.93],[874.0,548.0],[872.67,548.0],[839.62,548.0],[791.68,548.0],[765.59,548.0],[749.15,548.0]]},{"camera_id":"camera.basement_theater","name":"Basement Theater Camera","host_room":"Basement Theater","floor":"basement","zones":["basement_theater_couch","basement_theater_playpen","basement_theater_floor","basement_bar","basement_play_area_far","basement_stairwell"],"sub_zones":[{"id":"basement_theater_couch","entity_id":"binary_sensor.basement_theater_couch_person_occupancy","label":"Theater Couch","room":"Basement Theater","x":150,"y":235,"width":165,"height":165},{"id":"basement_theater_playpen","entity_id":"binary_sensor.basement_theater_playpen_person_occupancy","label":"Ballpit / Playpen","room":"Basement Theater","x":160,"y":50,"width":165,"height":75},{"id":"basement_theater_floor","entity_id":"binary_sensor.basement_theater_floor_person_occupancy","label":"Theater Floor","room":"Basement Theater","x":160,"y":135,"width":165,"height":90},{"id":"basement_bar","entity_id":"binary_sensor.basement_bar_person_occupancy","label":"Basement Wet Bar","room":"Basement Play Area","x":365,"y":55,"width":150,"height":140},{"id":"basement_play_area_far","entity_id":"binary_sensor.basement_play_area_far_person_occupancy","label":"Play Area East","room":"Basement Play Area","x":370,"y":230,"width":190,"height":175},{"id":"basement_stairwell","entity_id":"binary_sensor.basement_stairwell_person_occupancy","label":"Basement Stairwell","room":"Basement Play Area","x":495,"y":415,"width":75,"height":105}],"spillover_targets":[{"room_name":"Basement Play Area","overlap_pct":63.0},{"room_name":"Storage Room","overlap_pct":8.0}],"has_multi_room_bleed":true,"visibility_polygon":[[104.0,64.0],[199.29,42.0],[212.0,42.0],[228.43,42.0],[250.5,42.0],[281.79,42.0],[329.69,42.0],[412.34,42.0],[521.21,42.0],[524.0,42.0],[524.0,42.15],[524.0,44.97],[524.0,48.22],[524.0,48.37],[524.0,48.51],[524.0,52.46],[524.0,52.61],[524.0,52.75],[524.0,55.88],[524.0,66.77],[524.0,77.68],[524.0,88.6],[524.0,99.55],[524.0,110.55],[524.0,114.31],[524.0,114.46],[524.0,114.61],[524.0,121.41],[524.0,121.56],[524.0,121.61],[524.0,121.64],[524.0,121.71],[524.0,121.79],[524.0,121.94],[524.0,127.16],[524.0,127.31],[524.0,127.46],[524.0,132.76],[524.0,134.85],[524.0,135.0],[794.17,180.92],[791.64,194.97],[788.01,212.77],[783.92,230.46],[782.27,237.05],[695.0,215.0],[695.0,215.22],[695.0,225.05],[695.0,229.78],[695.0,230.0],[694.21,230.0],[656.27,230.0],[608.41,230.0],[572.52,230.0],[572.0,230.0],[572.0,230.18],[572.0,231.59],[572.0,234.63],[572.0,234.81],[572.0,235.0],[572.0,245.42],[572.0,259.54],[572.0,273.96],[572.0,288.72],[572.0,298.19],[572.0,298.4],[572.0,298.6],[572.0,303.85],[572.0,319.39],[572.0,335.38],[572.0,351.85],[572.0,368.72],[572.0,368.87],[572.0,368.95],[572.0,369.18],[572.0,386.46],[572.0,404.7],[572.0,423.63],[572.0,443.34],[572.0,463.9],[572.0,476.18],[572.0,476.47],[572.0,476.76],[572.0,485.39],[572.0,507.91],[572.0,531.56],[572.0,531.67],[572.0,532.0],[571.67,532.0],[548.74,532.0],[526.19,532.0],[504.67,532.0],[484.08,532.0],[474.54,532.0],[474.27,532.0],[442.65,492.34],[432.19,480.48],[430.0,478.0],[429.77,478.0],[422.76,478.0],[405.98,478.0],[405.88,478.0],[405.65,478.0],[405.43,478.0],[389.83,478.0],[374.24,478.0],[359.18,478.0],[355.2,478.0],[355.0,478.0],[387.52,532.0],[375.97,532.0],[359.96,532.0],[344.41,532.0],[329.26,532.0],[314.49,532.0],[300.05,532.0],[286.19,532.0],[265.0,478.0],[264.94,478.0],[264.83,478.0],[252.7,478.0],[240.68,478.0],[228.87,478.0],[220.16,478.0],[220.0,478.0],[234.95,532.0],[232.01,532.0],[219.05,532.0],[206.25,532.0],[193.6,532.0],[181.07,532.0],[168.65,532.0],[156.32,532.0],[144.06,532.0],[133.56,532.0],[130.0,478.0],[129.86,478.0],[128.64,478.0],[117.87,478.0],[107.12,478.0],[96.38,478.0],[94.41,478.0],[94.27,478.0],[94.12,478.0],[93.14,478.0],[93.0,478.0],[93.0,472.63],[93.0,311.92],[93.0,220.25],[93.0,177.96],[93.0,153.59]]},{"camera_id":"camera.basement_play_area","name":"Basement Play Area Camera","host_room":"Basement Play Area","floor":"basement","zones":["basement_play_floor","basement_counter","theater_rear_view"],"sub_zones":[{"id":"basement_play_floor","entity_id":"binary_sensor.basement_play_floor_person_occupancy","label":"Play Area Main Floor","room":"Basement Play Area","x":365,"y":225,"width":195,"height":220},{"id":"basement_counter","entity_id":"binary_sensor.basement_counter_person_occupancy","label":"Wet Bar Counter","room":"Basement Play Area","x":365,"y":60,"width":150,"height":140},{"id":"theater_rear_view","entity_id":"binary_sensor.theater_rear_view_person_occupancy","label":"Theater Rear View","room":"Basement Theater","x":135,"y":230,"width":185,"height":175}],"spillover_targets":[{"room_name":"Basement Theater","overlap_pct":87.0}],"has_multi_room_bleed":true,"visibility_polygon":[[505.0,68.0],[524.0,110.67],[524.0,113.84],[524.0,113.89],[524.0,113.94],[524.0,113.99],[524.0,117.43],[524.0,117.93],[524.0,117.98],[524.0,118.04],[524.0,121.53],[524.0,126.29],[524.0,131.87],[524.0,134.91],[524.0,135.0],[572.0,304.58],[572.0,306.82],[572.0,307.14],[572.0,307.46],[572.0,316.64],[572.0,345.06],[572.0,380.31],[572.0,425.27],[572.0,484.66],[572.0,530.86],[572.0,532.0],[571.83,532.0],[567.31,532.0],[555.1,532.0],[542.95,532.0],[530.85,532.0],[518.79,532.0],[506.75,532.0],[494.71,532.0],[482.66,532.0],[470.57,532.0],[458.44,532.0],[446.25,532.0],[445.16,532.0],[445.0,532.0],[445.0,530.73],[445.0,496.08],[445.0,495.0],[444.87,494.85],[440.43,489.82],[431.09,479.23],[430.12,478.14],[430.0,478.0],[429.85,478.0],[420.27,478.0],[409.12,478.0],[397.83,478.0],[386.39,478.0],[374.77,478.0],[362.96,478.0],[355.16,478.0],[355.0,478.0],[335.06,532.0],[330.64,532.0],[316.77,532.0],[302.6,532.0],[288.1,532.0],[273.25,532.0],[258.01,532.0],[242.34,532.0],[233.61,532.0],[233.39,532.0],[264.81,478.0],[258.65,478.0],[243.94,478.0],[228.73,478.0],[220.21,478.0],[220.0,478.0],[182.22,532.0],[174.53,532.0],[156.04,532.0],[136.81,532.0],[116.78,532.0],[95.85,532.0],[93.29,532.0],[93.0,532.0],[93.0,531.67],[93.0,518.77],[130.0,478.0],[129.74,478.0],[124.11,478.0],[103.8,478.0],[93.29,478.0],[93.0,478.0],[93.0,477.71],[93.0,467.75],[93.0,447.5],[93.0,428.2],[93.0,409.75],[93.0,392.09],[93.0,375.13],[93.0,358.81],[93.0,343.08],[93.0,327.88],[93.0,313.18],[93.0,298.92],[93.0,285.07],[93.0,271.6],[93.0,258.46],[93.0,245.64],[93.0,233.1],[93.0,220.82],[93.0,208.78],[93.0,196.94],[93.0,185.3],[93.0,173.83],[93.0,162.5],[93.0,151.32],[93.0,140.25],[93.0,129.28],[93.0,118.39],[93.0,107.57],[93.0,96.81]]},{"camera_id":"camera.storage_room","name":"Storage Room Camera","host_room":"Storage Room","floor":"basement","zones":["storage_room_workout"],"sub_zones":[{"id":"storage_room_workout","entity_id":"binary_sensor.storage_room_workout_person_occupancy","label":"Storage Room Floor","room":"Storage Room","x":705,"y":80,"width":195,"height":265}],"spillover_targets":[{"room_name":"Basement Play Area","overlap_pct":6.0}],"has_multi_room_bleed":true,"visibility_polygon":[[905.0,54.0],[915.0,110.71],[915.0,120.8],[915.0,135.13],[915.0,157.09],[915.0,195.09],[915.0,277.0],[915.0,356.77],[915.0,360.0],[914.89,360.0],[910.77,360.0],[902.83,360.0],[894.89,360.0],[886.94,360.0],[878.96,360.0],[870.94,360.0],[862.88,360.0],[854.76,360.0],[846.57,360.0],[838.3,360.0],[829.93,360.0],[821.46,360.0],[812.86,360.0],[804.14,360.0],[795.26,360.0],[786.21,360.0],[776.98,360.0],[767.55,360.0],[757.89,360.0],[747.99,360.0],[737.83,360.0],[732.3,360.0],[732.15,360.0],[732.01,360.0],[727.37,360.0],[716.59,360.0],[705.46,360.0],[695.16,360.0],[695.0,360.0],[695.0,359.77],[695.0,358.47],[695.0,355.67],[695.0,355.44],[695.0,355.22],[695.0,342.18],[695.0,331.09],[695.0,330.89],[695.0,330.69],[695.0,327.01],[695.0,312.83],[695.0,299.53],[695.0,287.01],[695.0,275.19],[695.0,264.0],[695.0,253.38],[695.0,243.26],[695.0,233.61],[695.0,230.12],[695.0,230.0],[695.0,229.88],[695.0,224.38],[695.0,215.53],[695.0,215.12],[695.0,215.0],[675.27,230.0],[663.48,230.0],[649.82,230.0],[635.1,230.0],[619.16,230.0],[601.81,230.0],[582.84,230.0],[572.28,230.0],[572.0,230.0],[533.6,250.13],[531.32,245.73],[526.47,235.98],[521.88,226.1],[519.68,221.13],[695.0,145.0],[695.0,144.91],[695.0,141.86],[695.0,135.52],[695.0,135.08],[695.0,135.0],[695.0,134.92],[695.0,129.31],[695.0,123.22],[695.0,117.23],[695.0,113.76],[695.0,113.68],[695.0,113.6],[695.0,111.33],[695.0,105.62],[695.0,105.55],[695.0,105.52],[695.0,105.47],[695.0,99.78],[695.0,98.72],[695.0,98.65],[695.0,98.57],[695.0,94.1],[695.0,88.48],[695.0,82.91],[695.0,77.37],[695.0,71.87],[695.0,66.4],[695.0,60.94],[695.0,55.49],[695.0,50.04],[695.0,47.46],[695.0,47.39],[695.0,47.31],[695.0,44.58],[695.0,42.07],[695.0,42.0],[696.28,42.0],[735.69,42.0],[781.29,42.0],[807.65,42.0],[824.84,42.0],[836.94,42.0]]}],"pir_analysis":[{"id":"binary_sensor.family_room_ecobee_motion","entity_id":"binary_sensor.family_room_ecobee_motion","name":"Family Room PIR (Ecobee)","host_room":"Family Room","floor":"main","x":555.0,"y":115.0,"heading_deg":165.0,"fov_deg":110.0,"range_px":190.0,"covered_rooms":[{"room_name":"Kitchen","coverage_pct":45.3},{"room_name":"Family Room","coverage_pct":45.0}],"visibility_polygon":[[555.0,115.0],[490.02,293.54],[485.41,291.8],[480.84,289.93],[476.33,287.95],[471.87,285.85],[467.47,283.64],[463.12,281.31],[458.84,278.87],[454.62,276.32],[453.73,275.76],[453.67,275.73],[453.62,275.69],[450.47,273.66],[446.39,270.9],[442.38,268.03],[438.45,265.05],[434.6,261.98],[433.83,261.35],[433.78,261.3],[433.73,261.26],[430.82,258.81],[427.13,255.54],[423.53,252.17],[420.02,248.71],[416.59,245.17],[413.26,241.53],[410.03,237.81],[407.96,235.33],[407.92,235.28],[407.88,235.23],[406.89,234.01],[403.85,230.13],[400.92,226.17],[398.09,222.14],[395.36,218.03],[392.74,213.85],[390.23,209.61],[387.83,205.31],[385.55,200.94],[383.37,196.51],[381.32,192.03],[379.38,187.5],[377.56,182.92],[375.85,178.3],[374.27,173.63],[372.81,168.92],[371.47,164.18],[370.26,159.4],[369.17,154.59],[368.21,149.76],[367.37,144.9],[366.65,140.02],[366.07,135.13],[365.61,130.22],[365.28,125.3],[365.08,120.38],[365.0,115.45],[365.05,110.52],[365.23,105.59],[365.54,100.67],[365.98,95.76],[366.54,90.87],[373.79,87.0],[400.47,87.0],[420.46,87.0],[436.02,87.0],[448.5,87.0],[458.72,87.0],[467.28,87.0],[474.55,87.0],[480.8,87.0],[486.26,87.0],[491.06,87.0],[495.32,87.0],[499.14,87.0],[502.58,87.0],[505.7,87.0],[508.55,87.0],[511.16,87.0],[513.57,87.0],[515.8,87.0],[517.88,87.0],[519.82,87.0],[521.63,87.0]]},{"id":"binary_sensor.family_room_ring_motion","entity_id":"binary_sensor.family_room_ring_motion","name":"Family Room Ring Cam Motion (Kitchen / Back Door)","host_room":"Family Room","floor":"main","x":635.0,"y":275.0,"heading_deg":215.0,"fov_deg":110.0,"range_px":380.0,"covered_rooms":[{"room_name":"Kitchen","coverage_pct":95.3},{"room_name":"Family Room","coverage_pct":45.0}],"visibility_polygon":[[635.0,275.0],[593.83,290.0],[593.79,290.0],[593.79,290.0],[593.74,290.0],[590.2,290.0],[586.84,290.0],[586.79,290.0],[586.73,290.0],[586.02,290.0],[581.06,290.0],[575.08,290.0],[574.49,290.0],[574.4,290.0],[574.31,290.0],[567.72,290.0],[558.41,290.0],[546.26,290.0],[534.24,290.0],[534.0,290.0],[410.0,308.34],[410.0,307.05],[410.0,301.12],[410.0,295.22],[410.0,290.08],[410.0,290.0],[408.81,290.0],[399.77,290.0],[343.0,290.0],[341.0,290.0],[338.97,290.0],[255.29,289.97],[255.29,289.83],[255.28,289.7],[255.27,289.34],[255.24,288.6],[255.24,288.47],[255.23,288.33],[255.15,285.7],[255.15,285.57],[255.14,285.44],[255.14,285.18],[255.13,285.05],[255.13,284.92],[255.03,279.48],[255.04,269.62],[255.31,259.77],[255.79,250.45],[255.8,250.31],[255.81,250.18],[255.83,249.92],[256.61,240.1],[257.64,230.29],[258.93,220.52],[260.47,210.78],[262.26,201.09],[263.95,193.0],[263.98,192.87],[264.01,192.74],[264.3,191.44],[266.59,181.85],[269.13,172.33],[271.92,162.87],[274.95,153.49],[278.22,144.19],[281.74,134.98],[285.49,125.86],[289.48,116.85],[293.65,108.03],[293.69,107.94],[293.71,107.91],[293.77,107.79],[298.14,99.14],[302.82,90.46],[316.35,87.0],[334.45,87.0],[351.11,87.0],[366.51,87.0],[380.81,87.0],[394.14,87.0],[406.61,87.0],[418.32,87.0],[429.35,87.0],[439.77,87.0],[449.64,87.0],[459.02,87.0],[467.96,87.0],[476.49,87.0],[484.66,87.0],[492.5,87.0],[500.03,87.0],[507.29,87.0],[514.29,87.0],[521.07,87.0],[527.64,87.0],[534.01,87.0],[540.21,87.0],[546.25,87.0],[552.15,87.0],[557.91,87.0],[563.54,87.0],[569.07,87.0],[574.5,87.0],[579.84,87.0],[585.1,87.0],[590.29,87.0],[595.41,87.0],[600.48,87.0],[605.5,87.0],[610.47,87.0],[615.42,87.0],[620.34,87.0],[625.24,87.0],[630.12,87.0],[635.0,87.0]]},{"id":"binary_sensor.thermostat_motion","entity_id":"binary_sensor.thermostat_motion","name":"Main Thermostat PIR (Ecobee4)","host_room":"Dining Room","floor":"main","x":242.0,"y":180.0,"heading_deg":180.0,"fov_deg":120.0,"range_px":220.0,"covered_rooms":[{"room_name":"Dining Room","coverage_pct":79.7},{"room_name":"Living Room","coverage_pct":10.9}],"visibility_polygon":[[242.0,180.0],[132.0,370.53],[127.05,367.58],[122.18,364.51],[117.39,361.31],[112.69,357.98],[108.07,354.54],[103.55,350.97],[99.12,347.29],[94.79,343.49],[90.56,339.58],[86.44,335.56],[82.42,331.44],[78.51,327.21],[74.71,322.88],[71.03,318.45],[68.0,313.51],[68.0,311.19],[96.0,290.0],[95.89,290.0],[90.6,290.0],[81.95,290.0],[72.61,290.0],[68.13,290.0],[68.0,290.0],[68.0,289.91],[68.0,286.63],[68.0,280.46],[68.0,274.47],[68.0,268.66],[68.0,262.99],[68.0,257.47],[68.0,252.07],[68.0,246.79],[68.0,241.62],[68.0,236.54],[68.0,231.54],[68.0,226.62],[68.0,221.77],[68.0,216.98],[68.0,212.25],[68.0,207.56],[68.0,202.91],[68.0,198.29],[68.0,193.69],[68.0,189.12],[68.0,184.56],[68.0,180.0],[68.0,175.44],[68.0,170.88],[68.0,166.31],[68.0,161.71],[68.0,157.09],[68.0,152.44],[68.0,147.75],[68.0,143.02],[68.0,138.23],[68.0,133.38],[68.0,128.46],[68.0,123.46],[68.0,118.38],[68.0,113.21],[68.0,107.93],[68.0,102.53],[68.0,97.01],[68.0,91.34],[68.0,87.08],[68.0,87.0],[68.15,87.0],[70.72,87.0],[80.92,87.0],[90.24,87.0],[98.79,87.0],[106.68,87.0],[114.0,87.0],[120.8,87.0],[127.15,87.0],[133.11,87.0],[138.71,87.0],[144.0,87.0],[149.0,87.0],[153.75,87.0],[158.26,87.0],[162.57,87.0],[166.69,87.0],[170.64,87.0],[174.43,87.0],[178.08,87.0],[181.61,87.0],[185.01,87.0],[188.31,87.0]]},{"id":"binary_sensor.keypad_motion","entity_id":"binary_sensor.keypad_motion","name":"Main Floor Keypad PIR (Between Peninsula & Powder Bath)","host_room":"Front Entry","floor":"main","x":410.0,"y":315.0,"heading_deg":0.0,"fov_deg":100.0,"range_px":165.0,"covered_rooms":[{"room_name":"Kitchen","coverage_pct":10.9},{"room_name":"Front Entry","coverage_pct":45.0},{"room_name":"Laundry Room","coverage_pct":10.9}],"visibility_polygon":[[410.0,315.0],[516.06,188.6],[519.32,191.41],[522.5,194.3],[525.6,197.27],[528.63,200.32],[531.58,203.45],[534.44,206.65],[537.22,209.93],[539.92,213.28],[542.52,216.7],[545.04,220.18],[547.46,223.73],[549.79,227.34],[552.03,231.02],[554.17,234.74],[556.21,238.53],[558.15,242.36],[559.99,246.24],[561.73,250.17],[563.37,254.15],[564.9,258.16],[566.33,262.22],[567.65,266.31],[568.87,270.43],[569.97,274.58],[570.97,278.76],[571.73,282.33],[534.0,290.0],[534.0,290.04],[534.0,290.46],[534.0,293.8],[534.0,297.11],[534.0,299.96],[534.0,300.0],[573.81,295.24],[573.87,295.7],[574.31,299.98],[574.65,304.26],[574.87,308.55],[574.99,312.85],[574.99,317.15],[574.87,321.45],[574.65,325.74],[574.31,330.02],[573.87,334.3],[573.31,338.56],[572.64,342.81],[571.86,347.03],[570.97,351.24],[569.97,355.42],[569.46,357.38],[534.0,348.0],[534.0,348.05],[534.0,349.79],[534.0,353.3],[534.0,356.87],[534.0,360.5],[534.0,364.2],[534.0,367.98],[534.0,371.84],[534.0,375.8],[534.0,379.86],[534.0,384.03],[534.0,388.32],[534.0,392.75],[534.0,397.33],[534.0,402.07],[534.0,406.98],[534.0,412.09],[534.0,417.41],[534.0,420.93],[534.0,421.0],[534.0,421.07],[534.0,422.96],[531.58,426.55],[528.63,429.68],[525.6,432.73],[522.5,435.7],[519.32,438.59],[516.06,441.4]]},{"id":"binary_sensor.garage_ring_motion","entity_id":"binary_sensor.garage_ring_motion","name":"Garage PIR (Ring Alarm Gen 2)","host_room":"Garage","floor":"main","x":685.0,"y":428.0,"heading_deg":135.0,"fov_deg":90.0,"range_px":475.0,"covered_rooms":[{"room_name":"Garage","coverage_pct":50.0}],"visibility_polygon":[[685.0,428.0],[685.0,555.0],[681.67,555.0],[678.34,555.0],[675.0,555.0],[671.65,555.0],[668.28,555.0],[664.89,555.0],[661.46,555.0],[658.01,555.0],[654.51,555.0],[650.97,555.0],[647.38,555.0],[643.74,555.0],[640.03,555.0],[636.25,555.0],[632.39,555.0],[628.46,555.0],[624.42,555.0],[620.29,555.0],[616.04,555.0],[611.68,555.0],[607.17,555.0],[602.53,555.0],[597.72,555.0],[592.73,555.0],[587.55,555.0],[582.16,555.0],[576.53,555.0],[570.65,555.0],[564.48,555.0],[558.0,555.0],[551.17,555.0],[543.95,555.0],[536.3,555.0],[534.11,555.0],[534.0,555.0],[534.0,554.91],[534.0,550.28],[534.0,543.87],[534.0,537.71],[534.0,531.78],[534.0,526.06],[534.0,520.53],[534.0,515.18],[534.0,509.99],[534.0,508.07],[534.0,508.0],[534.0,507.93],[534.0,504.94],[534.0,500.02],[534.0,495.23],[534.0,490.55],[534.0,485.96],[534.0,481.47],[534.0,477.06],[534.0,472.73],[534.0,468.46],[534.0,464.25],[534.0,463.17],[534.0,463.12],[534.0,463.06],[534.0,460.54],[534.0,460.48],[534.0,460.43],[534.0,460.1],[534.0,455.99],[534.0,451.92],[534.0,447.88],[534.0,447.63],[534.0,447.58],[534.0,447.52],[534.0,443.87],[534.0,439.88],[534.0,435.91],[534.0,431.95],[534.0,428.0]]},{"id":"binary_sensor.master_bedroom_motion","entity_id":"binary_sensor.master_bedroom_motion","name":"Master Bedroom PIR (Ecobee)","host_room":"Master Bedroom","floor":"upstairs","x":140.0,"y":280.0,"heading_deg":0.0,"fov_deg":110.0,"range_px":190.0,"covered_rooms":[{"room_name":"Master Bedroom","coverage_pct":45.0}],"visibility_polygon":[[140.0,280.0],[248.98,124.36],[252.98,127.24],[256.91,130.22],[260.75,133.31],[264.52,136.49],[268.2,139.77],[271.79,143.14],[275.3,146.6],[278.71,150.16],[282.03,153.8],[285.26,157.53],[288.39,161.34],[291.42,165.23],[294.34,169.19],[297.17,173.23],[299.88,177.35],[302.49,181.53],[304.99,185.78],[307.38,190.09],[309.66,194.46],[311.82,198.89],[313.86,203.38],[315.79,207.91],[317.6,212.5],[319.3,217.13],[320.87,221.8],[322.32,226.51],[323.64,231.26],[324.84,236.04],[325.92,240.85],[326.88,245.68],[327.7,250.54],[328.4,255.42],[328.59,256.91],[328.6,256.98],[328.61,257.04],[328.8,258.66],[328.81,258.73],[328.81,258.79],[328.98,260.32],[329.42,265.23],[329.74,270.15],[329.94,275.07],[330.0,280.0],[329.94,284.93],[329.74,289.85],[329.42,294.77],[328.98,299.68],[328.4,304.58],[327.9,308.16],[327.89,308.23],[327.88,308.29],[327.7,309.46],[327.69,309.57],[327.67,309.63],[327.66,309.7],[327.35,311.6],[327.34,311.66],[327.33,311.73],[326.88,314.32],[325.92,319.15],[324.84,323.96],[323.64,328.74],[322.32,333.49],[320.87,338.2],[319.3,342.87],[319.24,343.04],[319.21,343.1],[319.19,343.17],[317.6,347.5],[315.79,352.09],[313.86,356.62],[311.82,361.11],[309.66,365.54],[307.38,369.91],[304.99,374.22],[302.49,378.47],[299.88,382.65],[297.17,386.77],[294.34,390.81],[291.42,394.77],[288.39,398.66],[285.26,402.47],[282.03,406.2],[278.71,409.84],[275.3,413.4],[271.79,416.86],[268.2,420.23],[264.52,423.51],[260.75,426.69],[256.91,429.78],[252.98,432.76],[248.98,435.64]]},{"id":"binary_sensor.nursery_motion","entity_id":"binary_sensor.nursery_motion","name":"Nursery PIR (Ecobee)","host_room":"Margot's Room","floor":"upstairs","x":370.0,"y":235.0,"heading_deg":315.0,"fov_deg":110.0,"range_px":190.0,"covered_rooms":[{"room_name":"Margot's Room","coverage_pct":59.4}],"visibility_polygon":[[370.0,235.0],[353.0,138.59],[353.0,121.43],[353.0,97.08],[353.0,59.75],[354.08,45.67],[354.14,45.66],[354.21,45.66],[356.57,45.48],[361.49,45.19],[366.42,45.03],[371.34,45.0],[376.27,45.1],[381.2,45.33],[386.11,45.68],[391.02,46.17],[395.91,46.77],[400.78,47.51],[405.64,48.37],[410.47,49.36],[415.27,50.47],[420.04,51.71],[424.78,53.07],[429.48,54.55],[434.14,56.15],[438.76,57.88],[443.33,59.72],[447.85,61.68],[452.32,63.76],[456.74,65.95],[461.09,68.26],[465.39,70.68],[469.62,73.21],[473.78,75.85],[477.88,78.59],[481.9,81.45],[485.84,84.4],[489.71,87.46],[493.5,90.61],[497.2,93.86],[500.82,97.21],[500.87,97.26],[500.92,97.3],[500.96,97.35],[504.35,100.65],[507.79,104.18],[511.14,107.8],[514.39,111.5],[517.54,115.29],[520.6,119.16],[523.55,123.1],[526.41,127.12],[529.15,131.22],[531.79,135.38],[534.32,139.61],[536.74,143.91],[539.05,148.26],[541.24,152.68],[541.48,153.18],[541.51,153.24],[541.54,153.3],[543.32,157.15],[544.04,158.78],[544.07,158.84],[544.1,158.91],[544.52,159.88],[544.54,159.94],[544.57,160.0],[545.28,161.67],[547.12,166.24],[547.39,166.93],[547.41,166.99],[547.44,167.05],[548.85,170.86],[550.45,175.52],[551.93,180.22],[553.29,184.96],[554.53,189.73],[555.64,194.53],[556.63,199.36],[557.49,204.22],[558.23,209.09],[558.83,213.98],[559.32,218.89],[559.67,223.8],[559.9,228.73],[560.0,233.66],[559.97,238.58],[559.88,241.82],[559.88,241.89],[559.87,241.95],[559.81,243.51],[559.52,248.43],[559.42,249.81],[559.42,249.87],[559.41,249.93],[559.41,249.94],[559.41,249.99],[559.4,250.06],[559.11,253.34],[559.09,253.55],[559.09,253.61],[559.08,253.68],[558.66,254.0],[558.0,254.0],[558.0,254.07],[558.0,257.93],[558.0,258.0],[557.46,258.0],[556.59,258.0],[537.48,258.0],[508.0,254.0],[507.64,254.0],[496.93,254.0],[484.25,254.0],[484.0,254.0],[483.76,254.0],[477.75,254.0]]},{"id":"binary_sensor.guest_room_motion_occupancy","entity_id":"binary_sensor.guest_room_motion_occupancy","name":"Guest Room PIR (IKEA VALLHORN)","host_room":"Guest Room","floor":"upstairs","x":860.0,"y":42.0,"heading_deg":135.0,"fov_deg":120.0,"range_px":260.0,"covered_rooms":[{"room_name":"Guest Room","coverage_pct":89.1},{"room_name":"Upstairs Hallway & Stairs","coverage_pct":12.5}],"visibility_polygon":[[860.0,42.0],[874.0,94.25],[874.0,100.31],[874.0,107.86],[874.0,117.54],[874.0,130.39],[874.0,148.34],[874.0,175.2],[874.0,219.89],[874.0,252.88],[874.0,254.0],[873.93,254.0],[871.76,254.0],[871.68,254.0],[871.61,254.0],[871.11,254.0],[865.94,254.0],[865.87,254.0],[865.79,254.0],[865.55,254.0],[860.0,254.0],[858.4,254.0],[858.33,254.0],[858.26,254.0],[854.45,254.0],[848.89,254.0],[843.32,254.0],[837.72,254.0],[832.09,254.0],[826.42,254.0],[820.71,254.0],[814.94,254.0],[809.1,254.0],[803.39,254.0],[803.19,254.0],[803.0,254.0],[797.2,254.0],[791.12,254.0],[784.93,254.0],[780.9,254.0],[780.81,254.0],[780.73,254.0],[778.62,254.0],[772.19,254.0],[768.28,254.0],[768.19,254.0],[768.1,254.0],[765.61,254.0],[758.88,254.0],[755.76,254.0],[755.67,254.0],[755.58,254.0],[755.35,254.0],[755.26,254.0],[755.17,254.0],[751.98,254.0],[744.89,254.0],[737.6,254.0],[735.1,254.0],[735.0,254.0],[734.9,254.0],[730.09,254.0],[722.33,254.0],[718.77,254.0],[718.67,254.0],[718.56,254.0],[714.3,254.0],[713.34,254.0],[713.23,254.0],[713.12,254.0],[708.68,254.0],[708.57,254.0],[708.46,254.0],[705.97,254.0],[703.85,254.0],[703.73,254.0],[703.62,254.0],[697.33,254.0],[690.52,254.0],[690.4,254.0],[690.28,254.0],[688.33,254.0],[684.16,254.0],[684.03,254.0],[683.91,254.0],[682.75,254.0],[682.63,254.0],[682.5,254.0],[678.93,254.0],[674.63,254.0],[674.5,254.0],[674.37,254.0],[671.13,254.0],[671.0,254.0],[670.87,254.0],[669.11,254.0],[668.75,254.0],[668.61,254.0],[668.48,254.0],[666.7,254.0],[666.57,254.0],[666.43,254.0],[664.87,254.0],[664.74,254.0],[664.6,254.0],[662.14,254.0],[662.0,254.0],[603.92,316.0],[599.98,316.0],[599.82,316.0],[599.64,316.0],[599.46,316.0],[592.25,316.0],[592.06,316.0],[591.87,316.0],[586.0,316.0],[577.45,316.0],[577.25,316.0],[577.05,316.0],[573.8,316.0],[573.6,316.0],[573.4,316.0],[571.26,316.0],[555.69,316.0],[553.22,316.0],[553.0,316.0],[471.92,388.12],[468.16,383.85],[468.04,383.71],[467.92,383.57],[464.85,380.02],[612.0,254.0],[611.82,254.0],[611.78,254.0],[610.18,254.0],[610.0,254.0],[610.0,253.85],[610.0,244.45],[610.0,238.75],[610.0,238.61],[610.0,238.47],[610.0,236.74],[610.0,236.6],[610.0,236.46],[610.0,233.83],[610.0,223.64],[610.0,220.94],[610.0,220.81],[610.0,220.68],[610.0,220.58],[610.0,220.45],[610.0,220.32],[610.0,217.63],[610.0,217.5],[610.0,217.37],[610.0,214.24],[610.0,214.11],[610.0,213.98],[610.0,213.82],[610.0,210.48],[610.0,210.35],[610.0,210.22],[610.0,207.58],[610.0,207.46],[610.0,207.33],[610.0,204.35],[610.0,196.46],[610.0,196.34],[610.0,196.22],[610.0,195.53],[610.0,195.41],[610.0,195.29],[610.0,195.2],[610.0,192.69],[610.0,192.57],[610.0,192.45],[610.0,186.34],[610.0,181.34],[610.0,181.23],[610.0,181.11],[610.0,177.74],[610.0,177.22],[610.0,177.11],[610.0,177.0],[610.0,175.25],[610.0,175.14],[610.0,175.02],[610.0,169.38],[610.0,161.24],[610.0,153.31],[610.0,147.63],[610.0,147.52],[610.0,147.42],[610.0,146.64],[610.0,146.54],[610.0,146.43],[610.0,145.55],[610.0,143.1],[610.0,143.0],[610.0,142.9],[610.0,137.97],[610.0,134.69],[610.0,134.59],[610.0,134.49],[610.0,130.53],[610.0,130.1],[610.0,130.0],[572.75,143.0],[563.34,143.0],[563.0,143.0],[563.0,142.88],[563.0,138.5],[563.0,129.98],[563.0,121.86],[563.0,121.58],[608.8,109.07],[607.18,102.7],[605.68,96.06],[604.35,89.38],[603.2,82.67],[602.22,75.94],[601.42,69.18],[600.8,62.4],[600.36,55.61],[600.09,48.81],[600.0,42.09],[610.0,42.0],[610.0,41.91],[610.0,38.68],[610.0,38.59],[610.0,38.51],[610.0,37.16],[610.0,37.07],[610.0,36.98],[610.0,35.45],[610.0,33.67],[610.0,33.58],[610.0,33.5],[610.0,32.09],[610.0,32.0],[612.17,32.0],[669.19,32.0],[732.94,32.0],[764.86,32.0],[784.04,32.0],[796.86,32.0],[806.04,32.0],[812.95,32.0],[818.35,32.0],[822.68,32.0]]},{"id":"binary_sensor.guest_room_motion","entity_id":"binary_sensor.guest_room_motion","name":"Guest Room PIR (Ecobee)","host_room":"Guest Room","floor":"upstairs","x":745.0,"y":48.0,"heading_deg":90.0,"fov_deg":110.0,"range_px":190.0,"covered_rooms":[{"room_name":"Guest Room","coverage_pct":48.4}],"visibility_polygon":[[745.0,48.0],[874.0,138.33],[874.0,143.41],[874.0,148.69],[874.0,154.19],[874.0,159.92],[874.0,165.93],[874.0,172.22],[874.0,178.84],[874.0,185.81],[871.2,190.03],[867.47,193.26],[863.66,196.39],[859.77,199.42],[855.81,202.34],[851.77,205.17],[847.65,207.88],[845.9,209.0],[845.84,209.03],[845.78,209.07],[843.47,210.49],[839.22,212.99],[834.91,215.38],[832.74,216.53],[832.68,216.56],[832.62,216.59],[830.54,217.66],[826.11,219.82],[823.84,220.87],[823.78,220.9],[823.72,220.93],[821.62,221.86],[817.09,223.79],[812.5,225.6],[807.87,227.3],[803.2,228.87],[798.49,230.32],[793.74,231.64],[788.96,232.84],[784.15,233.92],[779.32,234.88],[774.46,235.7],[769.58,236.4],[764.68,236.98],[759.77,237.42],[754.85,237.74],[749.93,237.94],[748.9,237.96],[748.83,237.96],[748.76,237.96],[745.0,238.0],[740.07,237.94],[737.41,237.85],[737.34,237.85],[737.28,237.84],[735.85,237.78],[735.79,237.78],[735.72,237.77],[735.15,237.74],[730.23,237.42],[725.32,236.98],[720.42,236.4],[715.54,235.7],[710.68,234.88],[705.85,233.92],[701.04,232.84],[696.26,231.64],[694.32,231.12],[694.25,231.1],[694.19,231.08],[691.51,230.32],[690.53,230.02],[690.47,230.01],[690.4,229.99],[686.8,228.87],[682.13,227.3],[681.92,227.22],[681.85,227.2],[681.79,227.18],[680.83,226.84],[680.77,226.81],[680.7,226.79],[677.5,225.6],[677.42,225.58],[677.36,225.55],[677.3,225.53],[674.06,224.26],[673.99,224.23],[673.93,224.21],[672.91,223.79],[668.38,221.86],[663.89,219.82],[659.46,217.66],[655.09,215.38],[650.78,212.99],[646.53,210.49],[642.35,207.88],[642.0,207.66],[641.94,207.62],[641.89,207.59],[640.91,206.95],[640.86,206.92],[640.8,206.88],[638.23,205.17],[634.19,202.34],[630.23,199.42],[626.34,196.39],[622.53,193.26],[619.25,190.43],[619.2,190.39],[619.15,190.34],[618.8,190.03],[618.69,189.94],[618.65,189.9],[618.6,189.85],[617.34,188.73],[617.29,188.68],[617.25,188.64],[615.16,186.71],[615.05,186.61],[615.0,186.57],[614.96,186.52],[611.6,183.3],[610.0,178.0],[610.0,171.41],[610.0,165.13],[610.0,159.13],[610.0,153.37],[610.0,147.85],[610.0,143.07],[610.0,143.0],[610.0,142.93],[610.0,142.53]]},{"id":"binary_sensor.office_motion","entity_id":"binary_sensor.office_motion","name":"Office PIR (Ecobee)","host_room":"Office","floor":"upstairs","x":858.0,"y":305.0,"heading_deg":145.0,"fov_deg":110.0,"range_px":190.0,"covered_rooms":[{"room_name":"Office","coverage_pct":50.0}],"visibility_polygon":[[858.0,305.0],[858.0,495.0],[853.07,494.94],[848.15,494.74],[843.23,494.42],[838.32,493.98],[833.42,493.4],[828.54,492.7],[823.68,491.88],[818.85,490.92],[814.04,489.84],[809.26,488.64],[804.51,487.32],[799.8,485.87],[795.13,484.3],[790.5,482.6],[785.91,480.79],[781.38,478.86],[776.89,476.82],[772.46,474.66],[768.09,472.38],[763.78,469.99],[759.53,467.49],[755.35,464.88],[751.23,462.17],[747.19,459.34],[743.23,456.42],[739.34,453.39],[735.53,450.26],[731.8,447.03],[728.16,443.71],[724.6,440.3],[721.14,436.79],[717.77,433.2],[714.49,429.52],[711.31,425.75],[708.22,421.91],[705.24,417.98],[702.36,413.98],[699.59,409.91],[696.92,405.76],[694.36,401.55],[691.91,397.27],[689.57,392.93],[687.35,388.53],[685.24,384.08],[684.87,383.26],[684.84,383.2],[684.81,383.14],[683.24,379.57],[681.37,375.01],[679.61,370.4],[677.98,365.75],[676.46,361.06],[675.07,356.34],[673.8,351.57],[672.65,346.78],[671.63,341.96],[671.0,337.06],[671.0,332.09],[671.0,327.16],[671.0,322.25],[671.0,317.37],[671.0,315.07],[671.0,315.0],[669.77,315.0],[668.26,314.9],[668.25,314.83],[668.25,314.77],[668.19,313.49],[668.19,313.42],[668.18,313.35],[668.15,312.62],[668.02,307.69],[668.01,302.76],[668.14,297.83],[668.39,292.91],[668.5,291.2],[735.0,296.0],[735.59,296.0],[749.54,296.0],[750.0,296.0],[735.0,294.71],[735.0,293.95],[735.0,290.72],[735.0,287.48],[735.0,284.21],[735.0,280.91],[735.0,279.75],[735.0,279.71],[735.0,279.66],[735.0,279.54],[735.0,279.5],[735.0,279.46],[735.0,277.58],[735.0,275.09],[735.0,275.05],[735.0,275.0],[735.0,274.21],[735.0,274.13],[735.0,274.09],[735.0,274.04],[735.0,273.04],[735.0,272.99],[735.0,272.95],[735.0,271.5],[735.0,271.45],[735.0,271.41],[735.0,270.8],[735.0,267.33],[735.0,263.81],[735.0,260.23]]},{"id":"binary_sensor.upper_level_keypad_motion","entity_id":"binary_sensor.upper_level_keypad_motion","name":"Master Bedside Keypad PIR","host_room":"Master Bedroom","floor":"upstairs","x":138.0,"y":420.0,"heading_deg":0.0,"fov_deg":100.0,"range_px":165.0,"covered_rooms":[{"room_name":"Master Bedroom","coverage_pct":45.0}],"visibility_polygon":[[138.0,420.0],[244.06,293.6],[247.32,296.41],[250.5,299.3],[253.6,302.27],[256.63,305.32],[259.58,308.45],[262.44,311.65],[265.22,314.93],[267.92,318.28],[270.52,321.7],[273.04,325.18],[275.46,328.73],[277.79,332.34],[280.03,336.02],[282.17,339.74],[284.21,343.53],[285.42,345.88],[285.44,345.94],[285.47,345.99],[286.15,347.36],[286.51,348.1],[286.54,348.15],[286.56,348.2],[287.99,351.24],[289.73,355.17],[291.37,359.15],[292.9,363.16],[294.33,367.22],[295.65,371.31],[295.92,372.2],[295.94,372.25],[295.96,372.31],[296.87,375.43],[297.97,379.58],[298.97,383.76],[299.86,387.97],[300.64,392.19],[301.31,396.44],[301.87,400.7],[302.31,404.98],[302.65,409.26],[302.87,413.55],[302.99,417.85],[302.99,422.15],[302.87,426.45],[302.65,430.74],[302.31,435.02],[301.87,439.3],[301.31,443.56],[300.64,447.81],[299.86,452.03],[298.97,456.24],[297.97,460.42],[296.87,464.57],[296.16,467.02],[296.14,467.07],[296.13,467.13],[295.65,468.69],[294.33,472.78],[292.9,476.84],[291.37,480.85],[289.73,484.83],[287.99,488.76],[286.15,492.64],[284.21,496.47],[282.17,500.26],[280.03,503.98],[277.79,507.66],[275.46,511.27],[273.04,514.82],[270.52,518.3],[267.92,521.72],[265.22,525.07],[262.44,528.35],[259.58,531.55],[256.63,534.68],[253.6,537.73],[250.5,540.7],[247.32,543.59],[244.06,546.4]]},{"id":"binary_sensor.basement_ecobee_motion","entity_id":"binary_sensor.basement_ecobee_motion","name":"Basement Theater PIR (Ecobee)","host_room":"Basement Theater","floor":"basement","x":420.0,"y":518.0,"heading_deg":270.0,"fov_deg":110.0,"range_px":190.0,"covered_rooms":[{"room_name":"Basement Theater","coverage_pct":45.0}],"visibility_polygon":[[420.0,518.0],[362.87,478.0],[365.92,478.0],[368.75,478.0],[371.41,478.0],[373.9,478.0],[376.24,478.0],[378.46,478.0],[380.56,478.0],[382.56,478.0],[384.46,478.0],[386.27,478.0],[388.01,478.0],[389.68,478.0],[391.28,478.0],[392.83,478.0],[394.32,478.0],[395.76,478.0],[397.16,478.0],[398.51,478.0],[399.83,478.0],[401.12,478.0],[402.37,478.0],[403.6,478.0],[404.8,478.0],[405.97,478.0],[407.13,478.0],[408.26,478.0],[409.38,478.0],[410.49,478.0],[411.58,478.0],[412.65,478.0],[413.72,478.0],[414.78,478.0],[415.83,478.0],[416.88,478.0],[417.92,478.0],[418.96,478.0],[420.0,478.0],[421.04,478.0],[422.08,478.0],[423.12,478.0],[424.17,478.0],[425.22,478.0],[426.28,478.0],[427.35,478.0],[428.42,478.0],[429.51,478.0],[429.99,478.0],[430.0,478.0],[430.01,478.01],[430.47,478.54],[431.3,479.48],[432.1,480.38],[432.88,481.27],[433.64,482.12],[434.37,482.95],[435.09,483.77],[435.79,484.56],[436.47,485.33],[437.14,486.09],[437.8,486.84],[438.44,487.57],[439.08,488.29],[439.7,489.0],[440.32,489.7],[440.93,490.39],[441.53,491.07],[442.13,491.75],[442.73,492.42],[443.32,493.09],[443.9,493.76],[444.49,494.42],[444.99,494.99],[445.0,495.0],[445.0,495.02],[445.0,495.15],[445.0,496.31],[445.0,497.42],[445.0,498.49],[445.0,499.51],[445.0,500.49]]},{"id":"binary_sensor.family_room_motion_occupancy","entity_id":"binary_sensor.family_room_motion_occupancy","name":"Family Room PIR (SONOFF SenseGuard SNZB-03PR2)","host_room":"Family Room","floor":"main","x":818.0,"y":96.0,"heading_deg":138.0,"fov_deg":120.0,"range_px":315.0,"covered_rooms":[{"room_name":"Kitchen","coverage_pct":6.2},{"room_name":"Family Room","coverage_pct":98.4}],"visibility_polygon":[[818.0,96.0],[832.0,161.86],[832.0,171.54],[832.0,184.39],[832.0,202.34],[832.0,229.2],[832.0,273.89],[832.0,289.06],[832.0,290.0],[831.93,290.0],[828.17,290.0],[826.42,290.0],[826.36,290.0],[826.29,290.0],[823.98,290.0],[823.92,290.0],[823.85,290.0],[823.08,290.0],[818.0,290.0],[812.92,290.0],[807.83,290.0],[802.73,290.0],[797.61,290.0],[792.46,290.0],[787.27,290.0],[782.04,290.0],[776.76,290.0],[771.42,290.0],[766.02,290.0],[760.53,290.0],[754.97,290.0],[752.41,290.0],[752.34,290.0],[752.26,290.0],[749.3,290.0],[743.53,290.0],[737.64,290.0],[731.63,290.0],[725.47,290.0],[719.15,290.0],[712.67,290.0],[708.09,290.0],[708.0,290.0],[707.91,290.0],[705.99,290.0],[699.12,290.0],[692.01,290.0],[684.67,290.0],[677.05,290.0],[669.14,290.0],[660.9,290.0],[652.31,290.0],[648.59,290.0],[648.47,290.0],[648.35,290.0],[643.32,290.0],[633.9,290.0],[624.0,290.0],[613.57,290.0],[602.54,290.0],[599.52,290.0],[599.36,290.0],[599.21,290.0],[590.86,290.0],[578.43,290.0],[568.09,287.76],[563.16,281.15],[562.23,279.86],[562.16,279.77],[562.1,279.68],[558.4,274.42],[557.96,273.77],[557.89,273.68],[557.83,273.59],[553.82,267.56],[549.42,260.59],[545.2,253.5],[541.17,246.31],[537.33,239.01],[533.69,231.61],[533.57,231.37],[533.52,231.27],[533.47,231.17],[530.23,224.12],[526.98,216.55],[523.92,208.89],[521.07,201.15],[518.42,193.34],[515.97,185.46],[513.73,177.53],[511.7,169.54],[509.88,161.49],[508.27,153.4],[506.88,145.28],[505.69,137.12],[504.73,128.93],[503.97,120.71],[503.43,112.49],[503.11,104.25],[503.0,96.0],[503.11,87.75],[646.27,87.0],[703.64,87.0],[732.37,87.0],[749.64,87.0],[761.18,87.0],[769.44,87.0],[775.66,87.0],[780.51,87.0],[784.41,87.0],[787.62,87.0],[790.3,87.0]]},{"id":"binary_sensor.kitchen_motion_occupancy","entity_id":"binary_sensor.kitchen_motion_occupancy","name":"Kitchen PIR (SONOFF SenseGuard SNZB-03PR2)","host_room":"Kitchen","floor":"main","x":522.0,"y":92.0,"heading_deg":145.0,"fov_deg":120.0,"range_px":315.0,"covered_rooms":[{"room_name":"Kitchen","coverage_pct":100.0},{"room_name":"Front Entry","coverage_pct":31.2}],"visibility_polygon":[[522.0,92.0],[539.32,290.0],[534.11,290.0],[534.07,290.0],[534.0,290.0],[534.0,291.15],[534.0,298.74],[534.0,300.0],[540.03,406.48],[536.86,406.65],[536.75,406.65],[534.0,349.92],[533.59,406.79],[533.48,406.79],[533.37,406.79],[532.99,406.81],[531.19,406.87],[531.08,406.87],[530.97,406.87],[530.27,406.89],[530.16,406.89],[530.05,406.9],[524.75,406.99],[516.5,406.95],[508.26,406.7],[500.03,406.23],[491.81,405.55],[483.61,404.65],[475.44,403.54],[467.3,402.21],[459.2,400.68],[451.14,398.93],[443.13,396.97],[435.17,394.8],[427.28,392.42],[419.75,389.94],[419.65,389.91],[419.55,389.87],[419.45,389.84],[411.68,387.05],[410.0,382.3],[410.0,382.0],[409.88,382.0],[404.83,382.0],[396.43,380.89],[396.39,380.87],[396.32,380.84],[396.22,380.8],[394.88,380.21],[394.78,380.17],[394.68,380.12],[394.59,380.08],[410.0,345.0],[410.0,344.76],[410.0,332.18],[410.0,316.64],[410.0,302.64],[410.0,293.89],[410.0,293.72],[410.0,293.56],[410.0,290.16],[410.0,290.0],[409.98,290.0],[409.91,290.0],[403.03,290.0],[398.52,290.0],[398.42,290.0],[398.32,290.0],[395.86,290.0],[388.45,290.0],[380.77,290.0],[372.8,290.0],[364.5,290.0],[355.86,290.0],[346.82,290.0],[341.13,290.0],[341.0,290.0],[340.87,290.0],[337.36,290.0],[327.43,290.0],[316.96,290.0],[305.92,290.0],[294.23,290.0],[281.81,290.0],[273.78,285.93],[268.79,279.37],[267.72,277.92],[267.65,277.83],[267.59,277.74],[263.97,272.68],[259.33,265.86],[256.59,261.65],[256.53,261.56],[256.47,261.47],[254.86,258.92],[251.0,251.63],[251.0,250.13],[251.0,250.0],[249.82,250.56],[246.49,244.72],[242.59,237.45],[238.88,230.09],[236.39,224.87],[236.35,224.77],[236.3,224.67],[235.36,222.63],[232.04,215.08],[228.92,207.45],[226.0,199.74],[225.81,199.23],[251.0,190.0],[251.0,189.89],[251.0,182.68],[251.0,174.85],[251.0,167.15],[251.0,159.57],[251.0,152.08],[251.0,144.68],[251.0,137.35],[251.0,130.09],[251.0,122.88],[251.0,115.71],[251.0,108.58],[251.0,101.46],[251.0,94.36],[251.0,89.11],[251.0,89.02],[251.0,88.92],[251.0,87.27],[251.0,87.09],[251.0,87.0],[256.03,87.0],[407.48,87.0],[450.5,87.0],[470.07,87.0],[481.28,87.0],[488.54,87.0],[493.64,87.0],[497.42,87.0],[500.34,87.0],[502.67,87.0],[504.56,87.0],[506.14,87.0],[507.48,87.0],[508.63,87.0],[509.62,87.0],[510.5,87.0],[511.28,87.0]]},{"id":"binary_sensor.living_room_motion_occupancy","entity_id":"binary_sensor.living_room_motion_occupancy","name":"Living Room PIR (SONOFF SenseGuard SNZB-03PR2)","host_room":"Living Room","floor":"main","x":333.0,"y":500.0,"heading_deg":215.0,"fov_deg":120.0,"range_px":315.0,"covered_rooms":[{"room_name":"Dining Room","coverage_pct":9.4},{"room_name":"Living Room","coverage_pct":98.4}],"visibility_polygon":[[333.0,500.0],[315.84,508.0],[314.6,508.0],[313.2,508.0],[311.6,508.0],[309.77,508.0],[307.63,508.0],[305.1,508.0],[302.07,508.0],[298.35,508.0],[293.68,508.0],[287.63,508.0],[279.47,508.0],[267.85,508.0],[249.92,508.0],[218.59,508.0],[149.77,508.0],[71.04,508.0],[68.01,508.0],[68.0,507.91],[68.0,504.63],[68.0,497.69],[68.0,490.75],[68.0,483.79],[68.0,476.82],[68.0,469.81],[68.0,462.76],[68.0,455.65],[68.0,448.49],[68.0,441.25],[68.0,433.93],[68.0,426.51],[68.0,418.98],[68.0,411.33],[68.0,403.55],[68.0,395.61],[68.0,387.51],[68.0,379.23],[68.0,370.75],[68.0,362.05],[68.0,353.11],[68.0,343.9],[68.0,334.41],[70.33,326.14],[74.97,319.32],[79.79,312.63],[84.78,306.07],[86.05,304.45],[86.12,304.36],[86.19,304.27],[89.94,299.64],[95.27,293.34],[97.16,291.18],[97.24,291.1],[97.31,291.01],[100.76,287.19],[106.41,281.18],[112.21,275.33],[118.17,269.62],[124.27,264.08],[130.52,258.7],[136.91,253.48],[143.43,248.43],[150.08,243.55],[156.85,238.85],[163.75,234.33],[170.76,229.99],[175.64,227.12],[212.0,290.0],[212.1,290.0],[214.19,290.0],[221.34,290.0],[228.3,290.0],[235.08,290.0],[241.69,290.0],[248.15,290.0],[250.92,290.0],[251.0,290.0],[251.08,290.0],[254.48,290.0],[260.69,290.0],[264.04,290.0],[264.12,290.0],[264.2,290.0],[266.79,290.0],[272.78,290.0],[277.37,290.0],[277.45,290.0],[277.53,290.0],[278.69,290.0],[284.52,290.0],[290.28,290.0],[291.23,290.0],[291.3,290.0],[291.38,290.0],[295.97,290.0],[301.62,290.0],[307.22,290.0],[312.78,290.0],[318.32,290.0],[323.83,290.0],[329.33,290.0],[334.83,290.0],[340.33,290.0],[340.93,290.0],[341.0,290.0],[341.0,291.91],[341.0,369.2],[341.0,381.39],[341.0,382.0],[341.0,382.61],[341.0,408.56]]},{"id":"binary_sensor.dining_room_motion_occupancy","entity_id":"binary_sensor.dining_room_motion_occupancy","name":"Dining Room PIR (SONOFF SenseGuard SNZB-03PR2)","host_room":"Dining Room","floor":"main","x":245.0,"y":92.0,"heading_deg":135.0,"fov_deg":120.0,"range_px":315.0,"covered_rooms":[{"room_name":"Dining Room","coverage_pct":100.0},{"room_name":"Living Room","coverage_pct":20.3}],"visibility_polygon":[[245.0,92.0],[251.0,114.39],[251.0,116.99],[251.0,117.58],[251.0,117.62],[251.0,117.67],[251.0,117.96],[251.0,118.0],[251.0,118.04],[251.0,120.23],[251.0,124.37],[251.0,129.88],[251.0,137.57],[251.0,149.09],[251.0,168.24],[251.0,189.44],[251.0,190.0],[257.05,290.0],[255.38,290.0],[252.59,290.0],[251.0,250.0],[251.0,251.47],[251.0,287.74],[251.0,290.0],[250.93,290.0],[250.18,290.0],[245.0,290.0],[239.82,290.0],[234.62,290.0],[229.42,290.0],[224.19,290.0],[218.93,290.0],[213.64,290.0],[212.07,290.0],[212.0,290.0],[193.11,402.7],[187.6,401.73],[179.51,400.12],[171.46,398.3],[163.47,396.27],[155.54,394.03],[147.66,391.58],[139.85,388.93],[132.11,386.08],[124.45,383.02],[121.77,381.9],[121.67,381.85],[121.57,381.81],[116.88,379.77],[109.39,376.31],[101.99,372.67],[94.69,368.83],[87.5,364.8],[80.41,360.58],[73.44,356.18],[68.0,349.54],[68.0,335.62],[68.0,327.38],[96.0,290.0],[95.89,290.0],[93.07,290.0],[84.66,290.0],[75.89,290.0],[68.12,290.0],[68.0,290.0],[68.0,289.86],[68.0,288.58],[68.0,278.52],[68.0,269.0],[68.0,259.97],[68.0,251.37],[68.0,243.17],[68.0,235.33],[68.0,227.82],[68.0,220.6],[68.0,213.65],[68.0,206.95],[68.0,200.47],[68.0,194.19],[68.0,188.1],[68.0,182.19],[68.0,176.42],[68.0,170.81],[68.0,165.32],[68.0,159.94],[68.0,154.68],[68.0,149.51],[68.0,144.43],[68.0,139.43],[68.0,134.49],[68.0,129.62],[68.0,124.81],[68.0,120.03],[68.0,115.3],[68.0,110.6],[68.0,105.93],[68.0,101.28],[68.0,96.63],[68.0,92.0],[68.0,87.37],[68.0,87.06],[68.0,87.0],[70.16,87.0],[149.59,87.0],[181.47,87.0],[197.43,87.0],[207.02,87.0],[213.43,87.0],[218.02,87.0],[221.48,87.0],[224.17,87.0],[226.34,87.0]]},{"id":"binary_sensor.master_bedroom_motion_occupancy","entity_id":"binary_sensor.master_bedroom_motion_occupancy","name":"Master Bedroom PIR (SONOFF SenseGuard SNZB-03PR2)","host_room":"Master Bedroom","floor":"upstairs","x":134.0,"y":536.0,"heading_deg":313.0,"fov_deg":120.0,"range_px":315.0,"covered_rooms":[{"room_name":"Master Bedroom","coverage_pct":57.8}],"visibility_polygon":[[134.0,536.0],[126.0,509.83],[126.0,507.15],[126.0,503.91],[126.0,499.91],[126.0,494.84],[126.0,488.19],[126.0,479.08],[126.0,465.78],[126.0,444.56],[126.0,405.2],[126.0,306.91],[131.25,221.01],[139.5,221.05],[147.74,221.3],[155.97,221.77],[164.19,222.45],[172.39,223.35],[180.56,224.46],[188.7,225.79],[196.8,227.32],[204.86,229.07],[212.87,231.03],[220.83,233.2],[228.72,235.58],[236.55,238.16],[244.32,240.95],[252.0,243.94],[259.61,247.13],[267.12,250.51],[274.55,254.1],[281.88,257.87],[289.11,261.84],[296.24,265.99],[303.25,270.33],[310.15,274.85],[316.92,279.55],[323.57,284.43],[327.12,287.14],[327.21,287.21],[327.3,287.28],[327.98,287.81],[328.07,287.88],[328.15,287.95],[330.09,289.48],[336.48,294.7],[342.73,300.08],[348.83,305.62],[354.13,310.68],[353.0,312.0],[353.0,312.16],[353.0,313.14],[353.0,315.85],[353.0,316.0],[353.0,316.15],[353.0,324.51],[353.0,329.96],[353.0,330.1],[353.0,330.25],[353.0,335.32],[353.0,345.63],[353.0,354.87],[353.0,355.0],[353.0,355.13],[353.0,355.47],[353.0,364.9],[353.0,370.75],[353.0,370.87],[353.0,370.99],[353.0,373.1],[353.0,373.21],[353.0,373.33],[353.0,373.95],[353.0,381.46],[353.0,381.58],[353.0,381.69],[353.0,382.65],[353.0,389.0],[353.0,389.11],[353.0,389.22],[353.0,391.05],[353.0,399.15],[353.0,407.0],[353.0,407.07],[353.0,407.18],[353.0,407.28],[353.0,414.61],[353.0,415.05],[353.0,415.15],[353.0,415.25],[353.0,422.0],[353.0,429.19],[353.0,436.2],[353.0,443.04],[353.0,449.73],[353.0,456.29],[353.0,462.72],[353.0,469.04],[353.0,473.65],[353.0,473.74],[353.0,473.82],[353.0,474.74],[353.0,474.82],[353.0,474.91],[353.0,475.27],[353.0,477.83],[353.0,477.91],[353.0,477.99],[353.0,481.4],[353.0,483.92],[353.0,484.0],[353.34,484.0],[368.56,484.0],[388.17,484.0],[388.62,484.0],[389.08,484.0],[397.51,484.0],[398.0,484.0],[398.49,484.0],[401.52,484.0],[439.35,484.0],[440.0,484.0],[440.0,484.11],[440.0,484.79],[440.0,492.99],[440.0,497.89],[440.0,498.0],[446.61,497.29],[446.98,500.34],[447.8,508.55],[448.41,516.77],[448.81,525.01],[448.99,533.25],[448.95,541.5],[448.9,544.12],[440.0,544.0],[440.0,544.11],[440.0,547.89],[440.0,548.0],[437.3,548.0],[408.85,548.0],[305.61,548.0],[258.62,548.0],[231.73,548.0],[214.29,548.0],[202.06,548.0],[192.98,548.0],[185.98,548.0]]},{"id":"binary_sensor.master_bathroom_motion_occupancy","entity_id":"binary_sensor.master_bathroom_motion_occupancy","name":"Master Bathroom PIR (SONOFF SenseGuard SNZB-03PR2)","host_room":"Master Bathroom","floor":"upstairs","x":605.0,"y":543.0,"heading_deg":215.0,"fov_deg":120.0,"range_px":315.0,"covered_rooms":[{"room_name":"Master W.I.C","coverage_pct":6.2},{"room_name":"Upstairs Bathroom","coverage_pct":9.4},{"room_name":"Master Bathroom","coverage_pct":81.2}],"visibility_polygon":[[605.0,543.0],[594.28,548.0],[593.5,548.0],[592.62,548.0],[591.63,548.0],[590.48,548.0],[589.14,548.0],[587.56,548.0],[585.67,548.0],[583.34,548.0],[580.42,548.0],[576.64,548.0],[571.54,548.0],[564.28,548.0],[553.07,548.0],[533.5,548.0],[490.48,548.0],[441.88,548.0],[440.0,548.0],[440.0,547.94],[440.0,545.88],[440.0,544.06],[290.01,544.91],[290.01,544.8],[290.01,540.25],[290.19,532.01],[290.59,523.77],[291.2,515.55],[292.02,507.34],[293.07,499.16],[294.32,491.01],[295.79,482.9],[297.47,474.82],[298.27,471.3],[353.0,484.0],[353.39,484.0],[368.36,484.0],[388.37,484.0],[440.0,498.0],[440.0,497.94],[440.0,497.24],[440.0,496.03],[440.0,495.97],[440.0,495.91],[440.0,492.55],[440.0,487.79],[440.0,484.07],[440.0,484.0],[440.0,483.94],[440.0,482.94],[440.0,478.0],[440.0,472.96],[440.0,467.81],[440.0,462.52],[440.0,457.11],[440.0,451.54],[440.0,449.08],[440.0,449.0],[440.13,449.0],[445.42,449.0],[454.57,449.0],[461.89,449.0],[462.0,449.0],[462.11,449.0],[462.98,449.0],[470.75,449.0],[477.97,449.0],[478.91,449.0],[479.0,449.0],[479.09,449.0],[484.69,449.0],[490.97,449.0],[496.87,449.0],[500.57,449.0],[500.65,449.0],[500.72,449.0],[502.38,449.0],[502.42,449.0],[502.45,449.0],[502.53,449.0],[506.79,449.0],[506.86,449.0],[506.93,449.0],[507.66,449.0],[512.63,449.0],[517.34,449.0],[521.84,449.0],[522.41,449.0],[522.46,449.0],[522.52,449.0],[522.98,449.0],[523.03,449.0],[523.09,449.0],[526.12,449.0],[530.23,449.0],[533.45,449.0],[533.5,449.0],[533.55,449.0],[534.17,449.0],[537.95,449.0],[539.11,449.0],[539.16,449.0],[539.21,449.0],[541.6,449.0],[545.12,449.0],[545.74,449.0],[545.78,449.0],[545.83,449.0],[548.52,449.0],[551.82,449.0],[555.02,449.0],[558.13,449.0],[559.96,449.0],[560.0,449.0],[560.0,448.92],[560.0,446.5],[560.0,439.51],[560.0,437.79],[560.0,437.69],[560.0,437.59],[560.0,431.62],[560.0,422.64],[560.0,417.14],[560.0,417.0],[560.05,417.0],[561.61,417.0],[562.07,417.0],[562.12,417.0],[562.16,417.0],[562.66,417.0],[562.71,417.0],[562.76,417.0],[565.27,417.0],[568.87,417.0],[572.41,417.0],[575.91,417.0],[576.09,417.0],[576.14,417.0],[576.18,417.0],[579.37,417.0],[582.78,417.0],[584.18,417.0],[584.22,417.0],[584.27,417.0],[584.46,417.0],[584.51,417.0],[584.55,417.0],[586.17,417.0],[586.64,417.0],[586.69,417.0],[586.73,417.0],[587.37,417.0],[587.42,417.0],[587.46,417.0],[589.53,417.0],[591.42,417.0],[591.47,417.0],[591.51,417.0],[591.73,417.0],[591.77,417.0],[591.81,417.0],[592.87,417.0],[596.19,417.0],[599.5,417.0],[602.8,417.0],[606.1,417.0],[606.48,417.0],[606.53,417.0],[606.53,417.0],[606.57,417.0],[606.58,417.0],[606.62,417.0],[607.14,417.0],[607.18,417.0],[607.22,417.0],[607.73,417.0],[607.78,417.0],[607.82,417.0],[608.01,417.0],[608.05,417.0],[608.1,417.0],[609.4,417.0],[609.96,417.0],[610.0,417.0],[610.0,418.1],[610.0,461.25],[610.0,485.85]]},{"id":"binary_sensor.upstairs_hallway_motion_occupancy","entity_id":"binary_sensor.upstairs_hallway_motion_occupancy","name":"Upstairs Hallway PIR (SONOFF SenseGuard SNZB-03PR2)","host_room":"Upstairs Hallway & Stairs","floor":"upstairs","x":663.0,"y":256.0,"heading_deg":135.0,"fov_deg":120.0,"range_px":315.0,"covered_rooms":[{"room_name":"Upstairs Bathroom","coverage_pct":9.4},{"room_name":"Upstairs Hallway & Stairs","coverage_pct":79.7}],"visibility_polygon":[[663.0,256.0],[665.0,263.46],[665.0,264.33],[665.0,265.41],[665.0,266.79],[665.0,268.63],[665.0,270.71],[665.0,270.75],[665.0,270.79],[665.0,271.19],[665.0,275.03],[665.0,281.41],[665.0,294.16],[665.0,314.4],[665.0,315.0],[671.0,494.46],[671.0,544.32],[671.0,547.99],[670.9,548.0],[670.65,548.0],[663.0,548.0],[655.35,548.0],[647.7,548.0],[640.02,548.0],[632.31,548.0],[624.56,548.0],[616.75,548.0],[610.11,548.0],[610.0,548.0],[610.0,547.42],[610.0,541.96],[610.0,505.35],[610.0,476.76],[610.0,453.8],[610.0,434.93],[610.0,419.12],[610.0,417.19],[610.0,417.0],[610.0,416.81],[610.0,405.67],[610.0,394.07],[610.0,383.95],[610.0,375.04],[610.0,367.12],[610.0,360.02],[610.0,355.39],[610.0,355.31],[610.0,355.23],[610.0,353.61],[610.0,347.8],[610.0,342.49],[610.0,338.91],[610.0,338.84],[610.0,338.78],[610.0,337.61],[610.0,333.12],[610.0,328.95],[610.0,325.45],[610.0,325.4],[610.0,325.35],[610.0,325.07],[610.0,324.5],[610.0,324.45],[610.0,324.4],[610.0,321.45],[610.0,318.06],[610.0,316.04],[610.0,316.0],[609.96,316.0],[608.98,316.0],[607.75,316.0],[607.71,316.0],[607.67,316.0],[606.06,316.0],[604.36,316.0],[604.32,316.0],[604.27,316.0],[603.0,316.0],[600.56,316.0],[600.51,316.0],[600.47,316.0],[599.77,316.0],[596.36,316.0],[593.72,316.0],[593.67,316.0],[593.62,316.0],[593.31,316.0],[593.26,316.0],[593.21,316.0],[592.75,316.0],[588.91,316.0],[584.81,316.0],[581.48,316.0],[581.42,316.0],[581.36,316.0],[580.42,316.0],[575.7,316.0],[570.61,316.0],[565.09,316.0],[559.08,316.0],[553.09,316.0],[553.0,316.0],[462.0,365.55],[462.0,365.13],[462.0,358.41],[462.0,355.09],[462.0,355.0],[462.0,354.91],[462.0,351.87],[462.0,345.49],[462.0,339.26],[462.0,333.89],[508.0,316.0],[507.84,316.0],[506.69,316.0],[493.57,316.0],[478.34,316.0],[475.35,316.0],[475.12,316.0],[474.89,316.0],[462.26,316.0],[462.0,316.0],[461.74,316.0],[460.44,316.0],[446.29,316.0],[446.0,316.0],[359.36,339.84],[358.73,337.53],[356.7,329.54],[354.88,321.49],[354.34,318.89],[354.32,318.78],[367.47,316.0],[353.76,315.97],[353.74,315.86],[353.72,315.75],[353.27,313.4],[353.04,312.11],[353.02,312.0],[353.0,311.89],[351.88,305.28],[350.69,297.12],[349.73,288.93],[348.97,280.71],[348.43,272.49],[348.11,264.25],[348.06,262.11],[558.0,258.0],[558.0,257.96],[558.0,257.39],[558.0,257.35],[558.0,257.32],[558.0,256.04],[558.0,256.0],[558.0,255.96],[558.0,255.36],[558.0,255.32],[558.0,255.29],[558.0,254.68],[558.0,254.65],[558.0,254.61],[558.0,254.04],[558.0,254.0],[559.89,254.0],[561.23,254.0],[563.0,254.0],[564.72,254.0],[586.62,254.0],[609.5,254.0],[610.0,254.0],[610.49,254.0],[611.54,254.0],[612.0,254.0],[610.0,253.9],[610.0,253.22],[610.0,251.83],[610.0,250.43],[610.0,249.02],[610.0,248.6],[610.0,248.58],[610.0,248.56],[610.0,247.61],[610.0,246.18],[610.0,244.73],[610.0,243.28],[610.0,241.8]]},{"id":"binary_sensor.office_motion_occupancy","entity_id":"binary_sensor.office_motion_occupancy","name":"Office PIR (SONOFF SenseGuard SNZB-03PR2)","host_room":"Office","floor":"upstairs","x":868.0,"y":542.0,"heading_deg":225.0,"fov_deg":120.0,"range_px":315.0,"covered_rooms":[{"room_name":"Office","coverage_pct":95.3}],"visibility_polygon":[[868.0,542.0],[845.61,548.0],[843.01,548.0],[839.77,548.0],[835.63,548.0],[830.12,548.0],[822.43,548.0],[810.91,548.0],[791.76,548.0],[753.51,548.0],[673.23,548.0],[671.0,548.0],[671.0,547.93],[671.0,547.16],[671.0,546.65],[671.0,546.58],[671.0,546.51],[671.0,544.83],[671.0,544.76],[671.0,544.69],[671.0,542.99],[671.0,542.92],[671.0,542.85],[671.0,542.0],[671.0,536.84],[671.0,531.68],[671.0,526.5],[671.0,521.82],[671.0,521.75],[671.0,521.68],[671.0,521.29],[671.0,516.06],[671.0,515.37],[671.0,515.3],[671.0,515.23],[671.0,510.8],[671.0,505.49],[671.0,500.13],[671.0,499.27],[671.0,499.19],[671.0,499.12],[671.0,496.95],[671.0,496.87],[671.0,496.8],[671.0,494.7],[671.0,489.21],[671.0,483.65],[671.0,482.59],[671.0,482.52],[671.0,482.44],[671.0,477.99],[671.0,472.24],[671.0,466.38],[671.0,462.13],[671.0,462.05],[671.0,461.97],[671.0,460.4],[671.0,454.29],[671.0,451.35],[671.0,451.26],[671.0,451.18],[671.0,448.04],[671.0,446.64],[671.0,446.55],[671.0,446.47],[671.0,441.62],[671.0,435.04],[671.0,432.43],[671.0,432.34],[671.0,432.25],[671.0,428.26],[671.0,421.28],[671.0,418.42],[671.0,418.33],[671.0,418.23],[671.0,414.07],[671.0,406.61],[671.0,400.76],[671.0,400.66],[671.0,400.56],[671.0,398.87],[671.0,390.84],[671.0,386.7],[671.0,386.59],[671.0,386.48],[671.0,384.51],[671.0,384.4],[671.0,384.29],[671.0,382.47],[671.0,373.75],[671.0,369.56],[671.0,369.43],[671.0,369.31],[671.0,364.62],[671.0,361.65],[671.0,361.52],[671.0,361.4],[671.0,359.11],[671.0,358.98],[671.0,358.85],[671.0,356.11],[671.0,355.98],[671.0,355.85],[671.0,355.05],[671.0,348.36],[671.0,348.23],[671.0,348.09],[671.0,345.0],[671.0,334.41],[671.0,323.21],[671.0,322.25],[671.0,322.09],[671.0,321.94],[671.0,321.86],[671.0,321.71],[671.0,321.55],[671.0,320.53],[671.0,320.37],[671.0,320.22],[671.0,315.16],[671.0,315.0],[665.0,307.92],[665.0,304.32],[669.76,297.2],[676.24,292.09],[682.85,287.16],[684.65,285.86],[684.73,285.8],[684.74,285.79],[684.82,285.74],[684.83,285.73],[684.91,285.67],[688.37,283.24],[688.46,283.17],[688.55,283.11],[689.58,282.4],[690.07,282.07],[690.16,282.01],[690.25,281.94],[696.44,277.82],[703.41,273.42],[710.5,269.2],[717.69,265.17],[718.09,264.96],[735.0,296.0],[735.11,296.0],[742.66,296.0],[749.89,296.0],[750.0,296.0],[735.0,264.48],[735.0,263.16],[735.83,256.07],[735.93,256.02],[736.03,255.98],[739.88,254.23],[748.71,254.0],[757.45,254.0],[766.01,254.0],[774.42,254.0],[782.69,254.0],[790.83,254.0],[798.86,254.0],[806.78,254.0],[814.62,254.0],[822.39,254.0],[830.08,254.0],[837.73,254.0],[845.33,254.0],[852.91,254.0],[856.19,254.0],[858.0,296.0],[858.09,296.0],[861.56,296.0],[868.0,296.0],[873.04,296.0],[873.13,296.0],[873.21,296.0],[873.91,296.0],[874.0,296.0],[874.0,299.48],[874.0,312.87],[874.0,427.51],[874.0,465.76],[874.0,484.91],[874.0,496.43],[874.0,504.12],[874.0,509.63],[874.0,513.77],[874.0,517.01],[874.0,519.61]]},{"id":"binary_sensor.laundry_room_ring_motion","entity_id":"binary_sensor.laundry_room_ring_motion","name":"Laundry Room PIR (Ring Alarm Gen 2)","host_room":"Laundry Room","floor":"main","x":700.0,"y":298.0,"heading_deg":145.0,"fov_deg":90.0,"range_px":475.0,"covered_rooms":[{"room_name":"Powder Bath","coverage_pct":34.4},{"room_name":"Front Entry","coverage_pct":26.6},{"room_name":"Laundry Room","coverage_pct":89.1}],"visibility_polygon":[[700.0,298.0],[678.31,421.0],[674.98,421.0],[671.6,421.0],[668.19,421.0],[664.73,421.0],[661.22,421.0],[657.65,421.0],[654.01,421.0],[650.3,421.0],[646.52,421.0],[642.64,421.0],[638.67,421.0],[634.6,421.0],[630.41,421.0],[626.09,421.0],[621.64,421.0],[620.61,421.0],[620.55,421.0],[620.49,421.0],[617.04,421.0],[612.26,421.0],[607.31,421.0],[602.84,421.0],[602.77,421.0],[602.7,421.0],[602.16,421.0],[596.79,421.0],[591.18,421.0],[585.3,421.0],[579.13,421.0],[572.63,421.0],[565.77,421.0],[558.5,421.0],[550.79,421.0],[542.57,421.0],[534.12,421.0],[534.0,421.0],[534.0,420.91],[534.0,420.83],[534.0,414.23],[534.0,407.87],[534.0,401.73],[534.0,395.78],[534.0,395.18],[534.0,395.1],[534.0,395.03],[534.0,392.41],[534.0,392.33],[534.0,392.25],[534.0,390.02],[534.0,384.41],[534.0,378.96],[534.0,373.65],[534.0,368.46],[534.0,366.76],[534.0,366.69],[534.0,366.62],[534.0,363.39],[534.0,358.42],[534.0,353.55],[534.0,353.54],[534.0,353.49],[534.0,353.42],[534.0,353.22],[534.0,353.16],[534.0,353.09],[534.0,348.75],[534.0,348.06],[534.0,348.0],[410.0,385.24],[410.0,382.11],[410.0,382.0],[409.62,382.0],[397.11,382.0],[363.09,382.0],[341.56,382.0],[341.0,382.0],[341.0,381.87],[341.0,377.59],[341.0,367.78],[341.0,358.08],[341.0,356.31],[410.0,345.0],[410.0,344.9],[410.0,338.76],[410.0,331.04],[410.0,323.37],[410.0,315.74],[410.0,308.13],[410.0,301.6],[534.0,300.0],[534.0,299.94],[534.0,299.45],[534.0,295.96],[534.0,295.9],[534.0,295.86],[534.0,295.84],[534.0,295.8],[534.0,295.74],[534.0,295.34],[534.0,295.28],[534.0,295.22],[534.0,295.1],[534.0,295.1],[534.0,295.04],[534.0,294.98],[534.0,294.36],[534.0,294.3],[534.0,294.24],[534.0,293.48],[534.0,293.42],[534.0,293.36],[534.0,290.75],[534.0,290.06],[534.0,290.0],[535.2,290.0],[585.59,290.0],[616.92,290.0],[624.92,290.0],[625.17,290.0],[625.41,290.0],[634.85,290.0],[646.47,290.0],[654.63,290.0]]},{"id":"binary_sensor.upstairs_stairs_bottom_motion","entity_id":"binary_sensor.upstairs_stairs_bottom_motion","name":"Upstairs Stairs Bottom Step PIR (Wyze 433)","host_room":"Upstairs Hallway & Stairs","floor":"upstairs","x":640.0,"y":540.0,"heading_deg":270.0,"fov_deg":120.0,"range_px":95.0,"covered_rooms":[{"room_name":"Upstairs Hallway & Stairs","coverage_pct":45.0}],"visibility_polygon":[[640.0,540.0],[610.0,522.68],[610.0,521.62],[610.0,520.52],[610.0,519.38],[610.0,518.2],[610.0,516.98],[610.0,515.71],[610.0,514.38],[610.0,512.99],[610.0,511.53],[610.0,510.0],[610.0,508.39],[610.0,506.68],[610.0,505.9],[610.0,505.88],[610.0,505.85],[610.0,504.87],[610.0,502.95],[610.0,500.9],[610.0,498.71],[610.0,496.35],[610.0,493.8],[610.0,491.04],[610.0,488.04],[610.0,484.75],[610.0,481.12],[610.0,477.1],[610.0,472.62],[610.0,467.57],[610.0,461.85],[610.0,455.28],[610.64,449.65],[613.02,448.91],[615.41,448.24],[617.46,447.71],[617.49,447.71],[617.52,447.7],[617.82,447.62],[620.25,447.08],[622.69,446.59],[625.14,446.17],[627.6,445.81],[630.07,445.52],[632.55,445.29],[635.03,445.13],[637.51,445.03],[640.0,445.0],[642.49,445.03],[644.97,445.13],[647.45,445.29],[649.93,445.52],[652.4,445.81],[654.86,446.17],[657.31,446.59],[659.75,447.08],[662.18,447.62],[664.59,448.24],[666.98,448.91],[669.36,449.65],[671.0,452.46],[671.0,459.24],[671.0,465.16],[671.0,470.37],[671.0,475.01],[671.0,479.16],[671.0,482.91],[671.0,486.31],[671.0,489.41],[671.0,492.26],[671.0,494.89],[671.0,497.33],[671.0,499.6],[671.0,501.72],[671.0,503.7],[671.0,505.57],[671.0,507.33],[671.0,509.0],[671.0,510.58],[671.0,512.09],[671.0,513.52],[671.0,514.9],[671.0,516.21],[671.0,517.48],[671.0,518.69],[671.0,519.87],[671.0,521.0],[671.0,522.1]]},{"id":"binary_sensor.basement_stairs_top_motion","entity_id":"binary_sensor.basement_stairs_top_motion","name":"Basement Stairs Top Step PIR (Wyze 938)","host_room":"Front Entry","floor":"main","x":535.0,"y":330.0,"heading_deg":90.0,"fov_deg":120.0,"range_px":95.0,"covered_rooms":[{"room_name":"Front Entry","coverage_pct":45.0},{"room_name":"Laundry Room","coverage_pct":20.3}],"visibility_polygon":[[535.0,330.0],[617.27,377.5],[616.0,379.64],[614.67,381.74],[613.29,383.81],[611.86,385.84],[610.37,387.83],[608.83,389.79],[607.24,391.7],[605.6,393.57],[603.91,395.39],[602.18,397.18],[600.39,398.91],[598.57,400.6],[596.7,402.24],[594.79,403.83],[592.83,405.37],[590.84,406.86],[588.81,408.29],[586.74,409.67],[584.64,411.0],[582.5,412.27],[580.33,413.49],[578.13,414.65],[575.9,415.75],[573.64,416.79],[571.35,417.77],[569.04,418.69],[566.71,419.55],[564.36,420.35],[561.96,421.0],[559.38,421.0],[556.85,421.0],[554.34,421.0],[551.87,421.0],[549.41,421.0],[546.98,421.0],[544.56,421.0],[542.16,421.0],[539.77,421.0],[537.38,421.0],[535.0,421.0],[534.03,421.0],[534.0,421.0],[534.0,418.2],[534.0,368.19],[534.0,349.08],[534.0,348.11],[534.0,348.0],[529.7,424.85],[527.55,424.71],[525.07,424.48],[522.6,424.19],[520.14,423.83],[517.69,423.41],[515.25,422.92],[512.82,422.38],[510.41,421.76],[508.02,421.09],[505.64,420.35],[503.29,419.55],[500.96,418.69],[498.65,417.77],[496.36,416.79],[494.1,415.75],[491.87,414.65],[489.67,413.49],[487.5,412.27],[485.36,411.0],[483.26,409.67],[481.19,408.29],[479.16,406.86],[477.17,405.37],[475.21,403.83],[473.3,402.24],[471.43,400.6],[469.61,398.91],[467.82,397.18],[466.09,395.39],[464.4,393.57],[462.76,391.7],[461.17,389.79],[459.63,387.83],[458.14,385.84],[456.71,383.81],[455.33,381.74],[454.0,379.64],[452.73,377.5]]},{"id":"binary_sensor.basement_stairs_bottom_motion","entity_id":"binary_sensor.basement_stairs_bottom_motion","name":"Basement Stairs Bottom Step PIR (Wyze dd9)","host_room":"Basement Play Area","floor":"basement","x":535.0,"y":395.0,"heading_deg":90.0,"fov_deg":120.0,"range_px":95.0,"covered_rooms":[{"room_name":"Basement Play Area","coverage_pct":45.0}],"visibility_polygon":[[535.0,395.0],[572.0,416.36],[572.0,417.67],[572.0,419.03],[572.0,420.43],[572.0,421.88],[572.0,423.39],[572.0,424.96],[572.0,426.6],[572.0,428.31],[572.0,430.11],[572.0,432.0],[572.0,433.99],[572.0,436.09],[572.0,438.32],[572.0,440.69],[572.0,443.22],[572.0,445.93],[572.0,448.84],[572.0,451.98],[572.0,455.38],[572.0,459.09],[572.0,463.15],[572.0,467.62],[572.0,472.57],[572.0,478.1],[571.35,482.77],[569.04,483.69],[566.71,484.55],[564.36,485.35],[561.98,486.09],[559.8,486.71],[559.77,486.71],[559.74,486.72],[559.59,486.76],[557.18,487.38],[554.75,487.92],[552.31,488.41],[549.86,488.83],[547.4,489.19],[544.93,489.48],[542.45,489.71],[539.97,489.87],[537.49,489.97],[535.0,490.0],[532.51,489.97],[530.03,489.87],[527.55,489.71],[525.07,489.48],[522.6,489.19],[520.14,488.83],[517.69,488.41],[515.25,487.92],[512.82,487.38],[510.41,486.76],[508.02,486.09],[505.64,485.35],[503.29,484.55],[500.96,483.69],[498.65,482.77],[496.36,481.79],[494.1,480.75],[491.87,479.65],[489.67,478.49],[487.5,477.27],[485.36,476.0],[483.26,474.67],[481.19,473.29],[479.16,471.86],[477.17,470.37],[475.21,468.83],[473.3,467.24],[471.47,465.64],[471.45,465.61],[471.43,465.6],[471.42,465.59],[469.61,463.91],[467.82,462.18],[466.09,460.39],[464.4,458.57],[462.76,456.7],[461.17,454.79],[460.49,453.94],[460.47,453.91],[460.45,453.89],[459.63,452.83],[458.14,450.84],[456.71,448.81],[455.33,446.74],[454.0,444.64],[452.73,442.5]]}],"sub_zone_analysis":[{"id":"living_room_couch","camera_id":"camera.living_room","floor":"main","entity_id":"binary_sensor.living_room_couch_person_occupancy","label":"Living Room Couch","room":"Living Room","x":105.0,"y":355.0,"width":125.0,"height":100.0},{"id":"living_room_floor","camera_id":"camera.living_room","floor":"main","entity_id":"binary_sensor.living_room_floor_person_occupancy","label":"Living Room Floor","room":"Living Room","x":235.0,"y":365.0,"width":95.0,"height":100.0},{"id":"living_room_bay_windows","camera_id":"camera.living_room","floor":"main","entity_id":"binary_sensor.living_room_bay_windows_person_occupancy","label":"Bay Windows","room":"Living Room","x":115.0,"y":468.0,"width":165.0,"height":38.0},{"id":"living_room_entry","camera_id":"camera.living_room","floor":"main","entity_id":"binary_sensor.living_room_entry_person_occupancy","label":"Front Entry Archway","room":"Front Entry","x":350.0,"y":415.0,"width":80.0,"height":80.0},{"id":"dining_room_table","camera_id":"camera.dining_room","floor":"main","entity_id":"binary_sensor.dining_room_table_person_occupancy","label":"Dining Table","room":"Dining Room","x":105.0,"y":145.0,"width":110.0,"height":110.0},{"id":"rileys_food","camera_id":"camera.dining_room","floor":"main","entity_id":"binary_sensor.rileys_food_person_occupancy","label":"Riley's Food Corner","room":"Dining Room","x":170.0,"y":96.0,"width":65.0,"height":42.0},{"id":"family_room_couch","camera_id":"camera.family_room","floor":"main","entity_id":"binary_sensor.family_room_couch_person_occupancy","label":"Family Room Couch","room":"Family Room","x":635.0,"y":195.0,"width":150.0,"height":88.0},{"id":"family_room_recliner","camera_id":"camera.family_room","floor":"main","entity_id":"binary_sensor.family_room_recliner_person_occupancy","label":"Family Room Recliner","room":"Family Room","x":545.0,"y":115.0,"width":80.0,"height":75.0},{"id":"family_room_floor","camera_id":"camera.family_room","floor":"main","entity_id":"binary_sensor.family_room_floor_person_occupancy","label":"Family Room Floor","room":"Family Room","x":545.0,"y":195.0,"width":85.0,"height":88.0},{"id":"kitchen_island","camera_id":"camera.family_room","floor":"main","entity_id":"binary_sensor.kitchen_island_person_occupancy","label":"Kitchen Island","room":"Kitchen","x":335.0,"y":155.0,"width":120.0,"height":95.0},{"id":"garage_parking","camera_id":"camera.garage","floor":"main","entity_id":"binary_sensor.garage_parking_person_occupancy","label":"Garage Parking Bay","room":"Garage","x":595.0,"y":438.0,"width":170.0,"height":108.0},{"id":"master_bed","camera_id":"camera.master_bedroom","floor":"upstairs","entity_id":"binary_sensor.master_bed_person_occupancy","label":"Master Bed","room":"Master Bedroom","x":134.0,"y":250.0,"width":135.0,"height":155.0},{"id":"master_open_area","camera_id":"camera.master_bedroom","floor":"upstairs","entity_id":"binary_sensor.master_open_area_person_occupancy","label":"Master Open Floor","room":"Master Bedroom","x":140.0,"y":55.0,"width":145.0,"height":165.0},{"id":"master_bedroom_walkway","camera_id":"camera.master_bedroom","floor":"upstairs","entity_id":"binary_sensor.master_bedroom_walkway_person_occupancy","label":"Master Walkway","room":"Master Bedroom","x":278.0,"y":225.0,"width":68.0,"height":220.0},{"id":"master_bedroom_entryway","camera_id":"camera.master_bedroom","floor":"upstairs","entity_id":"binary_sensor.master_bedroom_entryway_person_occupancy","label":"Master Hallway Entry","room":"Master Bedroom","x":305.0,"y":256.0,"width":48.0,"height":56.0},{"id":"master_bathroom","camera_id":"camera.master_bedroom","floor":"upstairs","entity_id":"binary_sensor.master_bathroom_person_occupancy","label":"Master Bath Doorway","room":"Master Bathroom","x":425.0,"y":486.0,"width":55.0,"height":56.0},{"id":"nursery_bed","camera_id":"camera.nursery","floor":"upstairs","entity_id":"binary_sensor.nursery_bed_person_occupancy","label":"Nursery Bed","room":"Margot's Room","x":370.0,"y":95.0,"width":125.0,"height":115.0},{"id":"steves_desk","camera_id":"camera.office","floor":"upstairs","entity_id":"binary_sensor.steves_desk_person_occupancy","label":"Steve's Desk","room":"Office","x":745.0,"y":360.0,"width":105.0,"height":95.0},{"id":"sim_rig","camera_id":"camera.office","floor":"upstairs","entity_id":"binary_sensor.sim_rig_person_occupancy","label":"Sim Rig","room":"Office","x":680.0,"y":425.0,"width":65.0,"height":95.0},{"id":"office_floor","camera_id":"camera.office","floor":"upstairs","entity_id":"binary_sensor.office_floor_person_occupancy","label":"Office Center Floor","room":"Office","x":685.0,"y":310.0,"width":95.0,"height":95.0},{"id":"office_entryway","camera_id":"camera.office","floor":"upstairs","entity_id":"binary_sensor.office_entryway_person_occupancy","label":"Office Doorway","room":"Office","x":665.0,"y":258.0,"width":45.0,"height":55.0},{"id":"basement_theater_couch","camera_id":"camera.basement_theater","floor":"basement","entity_id":"binary_sensor.basement_theater_couch_person_occupancy","label":"Theater Couch","room":"Basement Theater","x":150.0,"y":235.0,"width":165.0,"height":165.0},{"id":"basement_theater_playpen","camera_id":"camera.basement_theater","floor":"basement","entity_id":"binary_sensor.basement_theater_playpen_person_occupancy","label":"Ballpit / Playpen","room":"Basement Theater","x":160.0,"y":50.0,"width":165.0,"height":75.0},{"id":"basement_theater_floor","camera_id":"camera.basement_theater","floor":"basement","entity_id":"binary_sensor.basement_theater_floor_person_occupancy","label":"Theater Floor","room":"Basement Theater","x":160.0,"y":135.0,"width":165.0,"height":90.0},{"id":"basement_bar","camera_id":"camera.basement_theater","floor":"basement","entity_id":"binary_sensor.basement_bar_person_occupancy","label":"Basement Wet Bar","room":"Basement Play Area","x":365.0,"y":55.0,"width":150.0,"height":140.0},{"id":"basement_play_area_far","camera_id":"camera.basement_theater","floor":"basement","entity_id":"binary_sensor.basement_play_area_far_person_occupancy","label":"Play Area East","room":"Basement Play Area","x":370.0,"y":230.0,"width":190.0,"height":175.0},{"id":"basement_stairwell","camera_id":"camera.basement_theater","floor":"basement","entity_id":"binary_sensor.basement_stairwell_person_occupancy","label":"Basement Stairwell","room":"Basement Play Area","x":495.0,"y":415.0,"width":75.0,"height":105.0},{"id":"basement_play_floor","camera_id":"camera.basement_play_area","floor":"basement","entity_id":"binary_sensor.basement_play_floor_person_occupancy","label":"Play Area Main Floor","room":"Basement Play Area","x":365.0,"y":225.0,"width":195.0,"height":220.0},{"id":"basement_counter","camera_id":"camera.basement_play_area","floor":"basement","entity_id":"binary_sensor.basement_counter_person_occupancy","label":"Wet Bar Counter","room":"Basement Play Area","x":365.0,"y":60.0,"width":150.0,"height":140.0},{"id":"theater_rear_view","camera_id":"camera.basement_play_area","floor":"basement","entity_id":"binary_sensor.theater_rear_view_person_occupancy","label":"Theater Rear View","room":"Basement Theater","x":135.0,"y":230.0,"width":185.0,"height":175.0},{"id":"storage_room_workout","camera_id":"camera.storage_room","floor":"basement","entity_id":"binary_sensor.storage_room_workout_person_occupancy","label":"Storage Room Floor","room":"Storage Room","x":705.0,"y":80.0,"width":195.0,"height":265.0}],"ble_proxy_analysis":[{"id":"living_room_speaker","name":"Living Room Speaker BLE Proxy","area_name":"Living Room","host_room":"Living Room","floor":"main","x":210.0,"y":410.0,"radius_px":210.0,"reachable_rooms":["Dining Room","Living Room","Kitchen","Powder Bath","Front Entry"]},{"id":"family_room_speaker","name":"Family Room Speaker BLE Proxy","area_name":"Family Room","host_room":"Family Room","floor":"main","x":680.0,"y":200.0,"radius_px":210.0,"reachable_rooms":["Kitchen","Front Entry","Family Room","Laundry Room"]},{"id":"master_bedroom_speaker","name":"Master Bedroom Speaker BLE Proxy","area_name":"Master Bedroom","host_room":"Master Bedroom","floor":"upstairs","x":230.0,"y":180.0,"radius_px":210.0,"reachable_rooms":["Master Bedroom","Margot's Room","Upstairs Hallway & Stairs"]},{"id":"nursery_speaker","name":"Nursery Speaker BLE Proxy","area_name":"Margot's Room","host_room":"Margot's Room","floor":"upstairs","x":465.0,"y":140.0,"radius_px":190.0,"reachable_rooms":["Master Bedroom","Upstairs Bathroom","Margot's Room","Guest Room","Upstairs Hallway & Stairs"]},{"id":"office_speaker","name":"Office Speaker BLE Proxy","area_name":"Office","host_room":"Office","floor":"upstairs","x":765.0,"y":400.0,"radius_px":200.0,"reachable_rooms":["Upstairs Bathroom","Master Bathroom","Guest Room","Office","Upstairs Hallway & Stairs"]},{"id":"basement_speaker","name":"Basement Speaker BLE Proxy","area_name":"Basement Play Area","host_room":"Basement Play Area","floor":"basement","x":450.0,"y":295.0,"radius_px":260.0,"reachable_rooms":["Basement Theater","Basement Play Area","Basement Bathroom","Storage Room"]}],"room_coverage":{"Master Bedroom":{"primary_cameras":[{"camera_id":"camera.master_bedroom","coverage_pct":100.0}],"spillover_cameras":[],"pir_sensors":[{"id":"binary_sensor.master_bedroom_motion","entity_id":"binary_sensor.master_bedroom_motion","name":"Master Bedroom PIR (Ecobee)","coverage_pct":45.0},{"id":"binary_sensor.upper_level_keypad_motion","entity_id":"binary_sensor.upper_level_keypad_motion","name":"Master Bedside Keypad PIR","coverage_pct":45.0},{"id":"binary_sensor.master_bedroom_motion_occupancy","entity_id":"binary_sensor.master_bedroom_motion_occupancy","name":"Master Bedroom PIR (SONOFF SenseGuard SNZB-03PR2)","coverage_pct":57.8}],"sub_zones":[{"id":"master_bed","camera_id":"camera.master_bedroom","floor":"upstairs","entity_id":"binary_sensor.master_bed_person_occupancy","label":"Master Bed","room":"Master Bedroom","x":134.0,"y":250.0,"width":135.0,"height":155.0},{"id":"master_open_area","camera_id":"camera.master_bedroom","floor":"upstairs","entity_id":"binary_sensor.master_open_area_person_occupancy","label":"Master Open Floor","room":"Master Bedroom","x":140.0,"y":55.0,"width":145.0,"height":165.0},{"id":"master_bedroom_walkway","camera_id":"camera.master_bedroom","floor":"upstairs","entity_id":"binary_sensor.master_bedroom_walkway_person_occupancy","label":"Master Walkway","room":"Master Bedroom","x":278.0,"y":225.0,"width":68.0,"height":220.0},{"id":"master_bedroom_entryway","camera_id":"camera.master_bedroom","floor":"upstairs","entity_id":"binary_sensor.master_bedroom_entryway_person_occupancy","label":"Master Hallway Entry","room":"Master Bedroom","x":305.0,"y":256.0,"width":48.0,"height":56.0}],"ble_proxies":[{"id":"master_bedroom_speaker","name":"Master Bedroom Speaker BLE Proxy","host_room":"Master Bedroom"},{"id":"nursery_speaker","name":"Nursery Speaker BLE Proxy","host_room":"Margot's Room"}],"max_coverage_pct":100.0,"uncovered_pct":0.0},"Master W.I.C":{"primary_cameras":[],"spillover_cameras":[],"pir_sensors":[{"id":"binary_sensor.master_bathroom_motion_occupancy","entity_id":"binary_sensor.master_bathroom_motion_occupancy","name":"Master Bathroom PIR (SONOFF SenseGuard SNZB-03PR2)","coverage_pct":6.2}],"sub_zones":[],"ble_proxies":[],"max_coverage_pct":0.0,"uncovered_pct":100.0},"Upstairs Bathroom":{"primary_cameras":[],"spillover_cameras":[],"pir_sensors":[{"id":"binary_sensor.master_bathroom_motion_occupancy","entity_id":"binary_sensor.master_bathroom_motion_occupancy","name":"Master Bathroom PIR (SONOFF SenseGuard SNZB-03PR2)","coverage_pct":9.4},{"id":"binary_sensor.upstairs_hallway_motion_occupancy","entity_id":"binary_sensor.upstairs_hallway_motion_occupancy","name":"Upstairs Hallway PIR (SONOFF SenseGuard SNZB-03PR2)","coverage_pct":9.4}],"sub_zones":[],"ble_proxies":[{"id":"nursery_speaker","name":"Nursery Speaker BLE Proxy","host_room":"Margot's Room"},{"id":"office_speaker","name":"Office Speaker BLE Proxy","host_room":"Office"}],"max_coverage_pct":0.0,"uncovered_pct":100.0},"Master Bathroom":{"primary_cameras":[],"spillover_cameras":[{"camera_id":"camera.master_bedroom","host_room":"Master Bedroom","overlap_pct":46.0}],"pir_sensors":[{"id":"binary_sensor.master_bathroom_motion_occupancy","entity_id":"binary_sensor.master_bathroom_motion_occupancy","name":"Master Bathroom PIR (SONOFF SenseGuard SNZB-03PR2)","coverage_pct":81.2}],"sub_zones":[{"id":"master_bathroom","camera_id":"camera.master_bedroom","floor":"upstairs","entity_id":"binary_sensor.master_bathroom_person_occupancy","label":"Master Bath Doorway","room":"Master Bathroom","x":425.0,"y":486.0,"width":55.0,"height":56.0}],"ble_proxies":[{"id":"office_speaker","name":"Office Speaker BLE Proxy","host_room":"Office"}],"max_coverage_pct":46.0,"uncovered_pct":54.0},"Margot's Room":{"primary_cameras":[{"camera_id":"camera.nursery","coverage_pct":88.0}],"spillover_cameras":[],"pir_sensors":[{"id":"binary_sensor.nursery_motion","entity_id":"binary_sensor.nursery_motion","name":"Nursery PIR (Ecobee)","coverage_pct":59.4}],"sub_zones":[{"id":"nursery_bed","camera_id":"camera.nursery","floor":"upstairs","entity_id":"binary_sensor.nursery_bed_person_occupancy","label":"Nursery Bed","room":"Margot's Room","x":370.0,"y":95.0,"width":125.0,"height":115.0}],"ble_proxies":[{"id":"master_bedroom_speaker","name":"Master Bedroom Speaker BLE Proxy","host_room":"Master Bedroom"},{"id":"nursery_speaker","name":"Nursery Speaker BLE Proxy","host_room":"Margot's Room"}],"max_coverage_pct":88.0,"uncovered_pct":12.0},"Guest Room":{"primary_cameras":[],"spillover_cameras":[{"camera_id":"camera.nursery","host_room":"Margot's Room","overlap_pct":8.0}],"pir_sensors":[{"id":"binary_sensor.guest_room_motion_occupancy","entity_id":"binary_sensor.guest_room_motion_occupancy","name":"Guest Room PIR (IKEA VALLHORN)","coverage_pct":89.1},{"id":"binary_sensor.guest_room_motion","entity_id":"binary_sensor.guest_room_motion","name":"Guest Room PIR (Ecobee)","coverage_pct":48.4}],"sub_zones":[],"ble_proxies":[{"id":"nursery_speaker","name":"Nursery Speaker BLE Proxy","host_room":"Margot's Room"},{"id":"office_speaker","name":"Office Speaker BLE Proxy","host_room":"Office"}],"max_coverage_pct":8.0,"uncovered_pct":92.0},"Office":{"primary_cameras":[{"camera_id":"camera.office","coverage_pct":99.0}],"spillover_cameras":[],"pir_sensors":[{"id":"binary_sensor.office_motion","entity_id":"binary_sensor.office_motion","name":"Office PIR (Ecobee)","coverage_pct":50.0},{"id":"binary_sensor.office_motion_occupancy","entity_id":"binary_sensor.office_motion_occupancy","name":"Office PIR (SONOFF SenseGuard SNZB-03PR2)","coverage_pct":95.3}],"sub_zones":[{"id":"steves_desk","camera_id":"camera.office","floor":"upstairs","entity_id":"binary_sensor.steves_desk_person_occupancy","label":"Steve's Desk","room":"Office","x":745.0,"y":360.0,"width":105.0,"height":95.0},{"id":"sim_rig","camera_id":"camera.office","floor":"upstairs","entity_id":"binary_sensor.sim_rig_person_occupancy","label":"Sim Rig","room":"Office","x":680.0,"y":425.0,"width":65.0,"height":95.0},{"id":"office_floor","camera_id":"camera.office","floor":"upstairs","entity_id":"binary_sensor.office_floor_person_occupancy","label":"Office Center Floor","room":"Office","x":685.0,"y":310.0,"width":95.0,"height":95.0},{"id":"office_entryway","camera_id":"camera.office","floor":"upstairs","entity_id":"binary_sensor.office_entryway_person_occupancy","label":"Office Doorway","room":"Office","x":665.0,"y":258.0,"width":45.0,"height":55.0}],"ble_proxies":[{"id":"office_speaker","name":"Office Speaker BLE Proxy","host_room":"Office"}],"max_coverage_pct":99.0,"uncovered_pct":1.0},"Upstairs Hallway & Stairs":{"primary_cameras":[],"spillover_cameras":[{"camera_id":"camera.master_bedroom","host_room":"Master Bedroom","overlap_pct":18.0},{"camera_id":"camera.office","host_room":"Office","overlap_pct":18.0}],"pir_sensors":[{"id":"binary_sensor.guest_room_motion_occupancy","entity_id":"binary_sensor.guest_room_motion_occupancy","name":"Guest Room PIR (IKEA VALLHORN)","coverage_pct":12.5},{"id":"binary_sensor.upstairs_hallway_motion_occupancy","entity_id":"binary_sensor.upstairs_hallway_motion_occupancy","name":"Upstairs Hallway PIR (SONOFF SenseGuard SNZB-03PR2)","coverage_pct":79.7},{"id":"binary_sensor.upstairs_stairs_bottom_motion","entity_id":"binary_sensor.upstairs_stairs_bottom_motion","name":"Upstairs Stairs Bottom Step PIR (Wyze 433)","coverage_pct":45.0}],"sub_zones":[],"ble_proxies":[{"id":"master_bedroom_speaker","name":"Master Bedroom Speaker BLE Proxy","host_room":"Master Bedroom"},{"id":"nursery_speaker","name":"Nursery Speaker BLE Proxy","host_room":"Margot's Room"},{"id":"office_speaker","name":"Office Speaker BLE Proxy","host_room":"Office"}],"max_coverage_pct":18.0,"uncovered_pct":82.0},"Dining Room":{"primary_cameras":[{"camera_id":"camera.dining_room","coverage_pct":100.0}],"spillover_cameras":[{"camera_id":"camera.family_room","host_room":"Family Room","overlap_pct":6.0}],"pir_sensors":[{"id":"binary_sensor.thermostat_motion","entity_id":"binary_sensor.thermostat_motion","name":"Main Thermostat PIR (Ecobee4)","coverage_pct":79.7},{"id":"binary_sensor.living_room_motion_occupancy","entity_id":"binary_sensor.living_room_motion_occupancy","name":"Living Room PIR (SONOFF SenseGuard SNZB-03PR2)","coverage_pct":9.4},{"id":"binary_sensor.dining_room_motion_occupancy","entity_id":"binary_sensor.dining_room_motion_occupancy","name":"Dining Room PIR (SONOFF SenseGuard SNZB-03PR2)","coverage_pct":100.0}],"sub_zones":[{"id":"dining_room_table","camera_id":"camera.dining_room","floor":"main","entity_id":"binary_sensor.dining_room_table_person_occupancy","label":"Dining Table","room":"Dining Room","x":105.0,"y":145.0,"width":110.0,"height":110.0},{"id":"rileys_food","camera_id":"camera.dining_room","floor":"main","entity_id":"binary_sensor.rileys_food_person_occupancy","label":"Riley's Food Corner","room":"Dining Room","x":170.0,"y":96.0,"width":65.0,"height":42.0}],"ble_proxies":[{"id":"living_room_speaker","name":"Living Room Speaker BLE Proxy","host_room":"Living Room"}],"max_coverage_pct":100.0,"uncovered_pct":0.0},"Living Room":{"primary_cameras":[{"camera_id":"camera.living_room","coverage_pct":91.0}],"spillover_cameras":[{"camera_id":"camera.dining_room","host_room":"Dining Room","overlap_pct":23.0}],"pir_sensors":[{"id":"binary_sensor.thermostat_motion","entity_id":"binary_sensor.thermostat_motion","name":"Main Thermostat PIR (Ecobee4)","coverage_pct":10.9},{"id":"binary_sensor.living_room_motion_occupancy","entity_id":"binary_sensor.living_room_motion_occupancy","name":"Living Room PIR (SONOFF SenseGuard SNZB-03PR2)","coverage_pct":98.4},{"id":"binary_sensor.dining_room_motion_occupancy","entity_id":"binary_sensor.dining_room_motion_occupancy","name":"Dining Room PIR (SONOFF SenseGuard SNZB-03PR2)","coverage_pct":20.3}],"sub_zones":[{"id":"living_room_couch","camera_id":"camera.living_room","floor":"main","entity_id":"binary_sensor.living_room_couch_person_occupancy","label":"Living Room Couch","room":"Living Room","x":105.0,"y":355.0,"width":125.0,"height":100.0},{"id":"living_room_floor","camera_id":"camera.living_room","floor":"main","entity_id":"binary_sensor.living_room_floor_person_occupancy","label":"Living Room Floor","room":"Living Room","x":235.0,"y":365.0,"width":95.0,"height":100.0},{"id":"living_room_bay_windows","camera_id":"camera.living_room","floor":"main","entity_id":"binary_sensor.living_room_bay_windows_person_occupancy","label":"Bay Windows","room":"Living Room","x":115.0,"y":468.0,"width":165.0,"height":38.0}],"ble_proxies":[{"id":"living_room_speaker","name":"Living Room Speaker BLE Proxy","host_room":"Living Room"}],"max_coverage_pct":91.0,"uncovered_pct":9.0},"Kitchen":{"primary_cameras":[],"spillover_cameras":[{"camera_id":"camera.family_room","host_room":"Family Room","overlap_pct":100.0}],"pir_sensors":[{"id":"binary_sensor.family_room_ecobee_motion","entity_id":"binary_sensor.family_room_ecobee_motion","name":"Family Room PIR (Ecobee)","coverage_pct":45.3},{"id":"binary_sensor.family_room_ring_motion","entity_id":"binary_sensor.family_room_ring_motion","name":"Family Room Ring Cam Motion (Kitchen / Back Door)","coverage_pct":95.3},{"id":"binary_sensor.keypad_motion","entity_id":"binary_sensor.keypad_motion","name":"Main Floor Keypad PIR (Between Peninsula & Powder Bath)","coverage_pct":10.9},{"id":"binary_sensor.family_room_motion_occupancy","entity_id":"binary_sensor.family_room_motion_occupancy","name":"Family Room PIR (SONOFF SenseGuard SNZB-03PR2)","coverage_pct":6.2},{"id":"binary_sensor.kitchen_motion_occupancy","entity_id":"binary_sensor.kitchen_motion_occupancy","name":"Kitchen PIR (SONOFF SenseGuard SNZB-03PR2)","coverage_pct":100.0}],"sub_zones":[{"id":"kitchen_island","camera_id":"camera.family_room","floor":"main","entity_id":"binary_sensor.kitchen_island_person_occupancy","label":"Kitchen Island","room":"Kitchen","x":335.0,"y":155.0,"width":120.0,"height":95.0}],"ble_proxies":[{"id":"living_room_speaker","name":"Living Room Speaker BLE Proxy","host_room":"Living Room"},{"id":"family_room_speaker","name":"Family Room Speaker BLE Proxy","host_room":"Family Room"}],"max_coverage_pct":100.0,"uncovered_pct":0.0},"Powder Bath":{"primary_cameras":[],"spillover_cameras":[{"camera_id":"camera.family_room","host_room":"Family Room","overlap_pct":17.0}],"pir_sensors":[{"id":"binary_sensor.laundry_room_ring_motion","entity_id":"binary_sensor.laundry_room_ring_motion","name":"Laundry Room PIR (Ring Alarm Gen 2)","coverage_pct":34.4}],"sub_zones":[],"ble_proxies":[{"id":"living_room_speaker","name":"Living Room Speaker BLE Proxy","host_room":"Living Room"}],"max_coverage_pct":17.0,"uncovered_pct":83.0},"Front Entry":{"primary_cameras":[],"spillover_cameras":[{"camera_id":"camera.living_room","host_room":"Living Room","overlap_pct":27.0},{"camera_id":"camera.family_room","host_room":"Family Room","overlap_pct":18.0}],"pir_sensors":[{"id":"binary_sensor.keypad_motion","entity_id":"binary_sensor.keypad_motion","name":"Main Floor Keypad PIR (Between Peninsula & Powder Bath)","coverage_pct":45.0},{"id":"binary_sensor.kitchen_motion_occupancy","entity_id":"binary_sensor.kitchen_motion_occupancy","name":"Kitchen PIR (SONOFF SenseGuard SNZB-03PR2)","coverage_pct":31.2},{"id":"binary_sensor.laundry_room_ring_motion","entity_id":"binary_sensor.laundry_room_ring_motion","name":"Laundry Room PIR (Ring Alarm Gen 2)","coverage_pct":26.6},{"id":"binary_sensor.basement_stairs_top_motion","entity_id":"binary_sensor.basement_stairs_top_motion","name":"Basement Stairs Top Step PIR (Wyze 938)","coverage_pct":45.0}],"sub_zones":[{"id":"living_room_entry","camera_id":"camera.living_room","floor":"main","entity_id":"binary_sensor.living_room_entry_person_occupancy","label":"Front Entry Archway","room":"Front Entry","x":350.0,"y":415.0,"width":80.0,"height":80.0}],"ble_proxies":[{"id":"living_room_speaker","name":"Living Room Speaker BLE Proxy","host_room":"Living Room"},{"id":"family_room_speaker","name":"Family Room Speaker BLE Proxy","host_room":"Family Room"}],"max_coverage_pct":27.0,"uncovered_pct":73.0},"Family Room":{"primary_cameras":[{"camera_id":"camera.family_room","coverage_pct":100.0}],"spillover_cameras":[],"pir_sensors":[{"id":"binary_sensor.family_room_ecobee_motion","entity_id":"binary_sensor.family_room_ecobee_motion","name":"Family Room PIR (Ecobee)","coverage_pct":45.0},{"id":"binary_sensor.family_room_ring_motion","entity_id":"binary_sensor.family_room_ring_motion","name":"Family Room Ring Cam Motion (Kitchen / Back Door)","coverage_pct":45.0},{"id":"binary_sensor.family_room_motion_occupancy","entity_id":"binary_sensor.family_room_motion_occupancy","name":"Family Room PIR (SONOFF SenseGuard SNZB-03PR2)","coverage_pct":98.4}],"sub_zones":[{"id":"family_room_couch","camera_id":"camera.family_room","floor":"main","entity_id":"binary_sensor.family_room_couch_person_occupancy","label":"Family Room Couch","room":"Family Room","x":635.0,"y":195.0,"width":150.0,"height":88.0},{"id":"family_room_recliner","camera_id":"camera.family_room","floor":"main","entity_id":"binary_sensor.family_room_recliner_person_occupancy","label":"Family Room Recliner","room":"Family Room","x":545.0,"y":115.0,"width":80.0,"height":75.0},{"id":"family_room_floor","camera_id":"camera.family_room","floor":"main","entity_id":"binary_sensor.family_room_floor_person_occupancy","label":"Family Room Floor","room":"Family Room","x":545.0,"y":195.0,"width":85.0,"height":88.0}],"ble_proxies":[{"id":"family_room_speaker","name":"Family Room Speaker BLE Proxy","host_room":"Family Room"}],"max_coverage_pct":100.0,"uncovered_pct":0.0},"Laundry Room":{"primary_cameras":[],"spillover_cameras":[],"pir_sensors":[{"id":"binary_sensor.keypad_motion","entity_id":"binary_sensor.keypad_motion","name":"Main Floor Keypad PIR (Between Peninsula & Powder Bath)","coverage_pct":10.9},{"id":"binary_sensor.laundry_room_ring_motion","entity_id":"binary_sensor.laundry_room_ring_motion","name":"Laundry Room PIR (Ring Alarm Gen 2)","coverage_pct":89.1},{"id":"binary_sensor.basement_stairs_top_motion","entity_id":"binary_sensor.basement_stairs_top_motion","name":"Basement Stairs Top Step PIR (Wyze 938)","coverage_pct":20.3}],"sub_zones":[],"ble_proxies":[{"id":"family_room_speaker","name":"Family Room Speaker BLE Proxy","host_room":"Family Room"}],"max_coverage_pct":0.0,"uncovered_pct":100.0},"Garage":{"primary_cameras":[{"camera_id":"camera.garage","coverage_pct":90.0}],"spillover_cameras":[],"pir_sensors":[{"id":"binary_sensor.garage_ring_motion","entity_id":"binary_sensor.garage_ring_motion","name":"Garage PIR (Ring Alarm Gen 2)","coverage_pct":50.0}],"sub_zones":[{"id":"garage_parking","camera_id":"camera.garage","floor":"main","entity_id":"binary_sensor.garage_parking_person_occupancy","label":"Garage Parking Bay","room":"Garage","x":595.0,"y":438.0,"width":170.0,"height":108.0}],"ble_proxies":[],"max_coverage_pct":90.0,"uncovered_pct":10.0},"Basement Theater":{"primary_cameras":[{"camera_id":"camera.basement_theater","coverage_pct":97.0}],"spillover_cameras":[{"camera_id":"camera.basement_play_area","host_room":"Basement Play Area","overlap_pct":87.0}],"pir_sensors":[{"id":"binary_sensor.basement_ecobee_motion","entity_id":"binary_sensor.basement_ecobee_motion","name":"Basement Theater PIR (Ecobee)","coverage_pct":45.0}],"sub_zones":[{"id":"basement_theater_couch","camera_id":"camera.basement_theater","floor":"basement","entity_id":"binary_sensor.basement_theater_couch_person_occupancy","label":"Theater Couch","room":"Basement Theater","x":150.0,"y":235.0,"width":165.0,"height":165.0},{"id":"basement_theater_playpen","camera_id":"camera.basement_theater","floor":"basement","entity_id":"binary_sensor.basement_theater_playpen_person_occupancy","label":"Ballpit / Playpen","room":"Basement Theater","x":160.0,"y":50.0,"width":165.0,"height":75.0},{"id":"basement_theater_floor","camera_id":"camera.basement_theater","floor":"basement","entity_id":"binary_sensor.basement_theater_floor_person_occupancy","label":"Theater Floor","room":"Basement Theater","x":160.0,"y":135.0,"width":165.0,"height":90.0},{"id":"theater_rear_view","camera_id":"camera.basement_play_area","floor":"basement","entity_id":"binary_sensor.theater_rear_view_person_occupancy","label":"Theater Rear View","room":"Basement Theater","x":135.0,"y":230.0,"width":185.0,"height":175.0}],"ble_proxies":[{"id":"basement_speaker","name":"Basement Speaker BLE Proxy","host_room":"Basement Play Area"}],"max_coverage_pct":97.0,"uncovered_pct":3.0},"Basement Play Area":{"primary_cameras":[{"camera_id":"camera.basement_play_area","coverage_pct":65.0}],"spillover_cameras":[{"camera_id":"camera.basement_theater","host_room":"Basement Theater","overlap_pct":63.0},{"camera_id":"camera.storage_room","host_room":"Storage Room","overlap_pct":6.0}],"pir_sensors":[{"id":"binary_sensor.basement_stairs_bottom_motion","entity_id":"binary_sensor.basement_stairs_bottom_motion","name":"Basement Stairs Bottom Step PIR (Wyze dd9)","coverage_pct":45.0}],"sub_zones":[{"id":"basement_bar","camera_id":"camera.basement_theater","floor":"basement","entity_id":"binary_sensor.basement_bar_person_occupancy","label":"Basement Wet Bar","room":"Basement Play Area","x":365.0,"y":55.0,"width":150.0,"height":140.0},{"id":"basement_play_area_far","camera_id":"camera.basement_theater","floor":"basement","entity_id":"binary_sensor.basement_play_area_far_person_occupancy","label":"Play Area East","room":"Basement Play Area","x":370.0,"y":230.0,"width":190.0,"height":175.0},{"id":"basement_stairwell","camera_id":"camera.basement_theater","floor":"basement","entity_id":"binary_sensor.basement_stairwell_person_occupancy","label":"Basement Stairwell","room":"Basement Play Area","x":495.0,"y":415.0,"width":75.0,"height":105.0},{"id":"basement_play_floor","camera_id":"camera.basement_play_area","floor":"basement","entity_id":"binary_sensor.basement_play_floor_person_occupancy","label":"Play Area Main Floor","room":"Basement Play Area","x":365.0,"y":225.0,"width":195.0,"height":220.0},{"id":"basement_counter","camera_id":"camera.basement_play_area","floor":"basement","entity_id":"binary_sensor.basement_counter_person_occupancy","label":"Wet Bar Counter","room":"Basement Play Area","x":365.0,"y":60.0,"width":150.0,"height":140.0}],"ble_proxies":[{"id":"basement_speaker","name":"Basement Speaker BLE Proxy","host_room":"Basement Play Area"}],"max_coverage_pct":65.0,"uncovered_pct":35.0},"Basement Bathroom":{"primary_cameras":[],"spillover_cameras":[],"pir_sensors":[],"sub_zones":[],"ble_proxies":[{"id":"basement_speaker","name":"Basement Speaker BLE Proxy","host_room":"Basement Play Area"}],"max_coverage_pct":0.0,"uncovered_pct":100.0},"Storage Room":{"primary_cameras":[{"camera_id":"camera.storage_room","coverage_pct":100.0}],"spillover_cameras":[{"camera_id":"camera.basement_theater","host_room":"Basement Theater","overlap_pct":8.0}],"pir_sensors":[],"sub_zones":[{"id":"storage_room_workout","camera_id":"camera.storage_room","floor":"basement","entity_id":"binary_sensor.storage_room_workout_person_occupancy","label":"Storage Room Floor","room":"Storage Room","x":705.0,"y":80.0,"width":195.0,"height":265.0}],"ble_proxies":[{"id":"basement_speaker","name":"Basement Speaker BLE Proxy","host_room":"Basement Play Area"}],"max_coverage_pct":100.0,"uncovered_pct":0.0}},"ambiguities":[{"severity":"high","category":"camera_spillover","title":"Living Room Camera cone spills into Front Entry","rooms":["Living Room","Front Entry"],"camera_id":"camera.living_room","description":"`camera.living_room` (hosted in Living Room) also sees Front Entry. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Living Room occupied.","resolution":"Downgrade binary_sensor.living_room_person_occupancy to `supporting` and trigger Living Room only from interior Frigate sub-zones."},{"severity":"high","category":"camera_spillover","title":"Dining Room Camera cone spills into Living Room","rooms":["Dining Room","Living Room"],"camera_id":"camera.dining_room","description":"`camera.dining_room` (hosted in Dining Room) also sees Living Room. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Dining Room occupied.","resolution":"Downgrade whole-frame camera person to `supporting` and trigger Dining Room only from interior Frigate sub-zones."},{"severity":"high","category":"camera_spillover","title":"Family Room Camera cone spills into Dining Room, Kitchen, Powder Bath, Front Entry","rooms":["Family Room","Dining Room","Kitchen","Powder Bath","Front Entry"],"camera_id":"camera.family_room","description":"`camera.family_room` (hosted in Family Room) also sees Dining Room, Kitchen, Powder Bath, Front Entry. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Family Room occupied.","resolution":"Downgrade binary_sensor.family_room_person_occupancy to `supporting` and trigger Family Room only from interior Frigate sub-zones."},{"severity":"high","category":"camera_spillover","title":"Master Bedroom Camera cone spills into Master Bathroom, Upstairs Hallway & Stairs","rooms":["Master Bedroom","Master Bathroom","Upstairs Hallway & Stairs"],"camera_id":"camera.master_bedroom","description":"`camera.master_bedroom` (hosted in Master Bedroom) also sees Master Bathroom, Upstairs Hallway & Stairs. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Master Bedroom occupied.","resolution":"Downgrade binary_sensor.master_bedroom_person_occupancy, binary_sensor.master_bedroom_entryway_person_occupancy to `supporting` and trigger Master Bedroom only from interior Frigate sub-zones."},{"severity":"high","category":"camera_spillover","title":"Nursery Camera cone spills into Guest Room","rooms":["Margot's Room","Guest Room"],"camera_id":"camera.nursery","description":"`camera.nursery` (hosted in Margot's Room) also sees Guest Room. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Margot's Room occupied.","resolution":"Downgrade binary_sensor.nursery_person_occupancy to `supporting` and trigger Margot's Room only from interior Frigate sub-zones."},{"severity":"high","category":"camera_spillover","title":"Office Camera cone spills into Upstairs Hallway & Stairs","rooms":["Office","Upstairs Hallway & Stairs"],"camera_id":"camera.office","description":"`camera.office` (hosted in Office) also sees Upstairs Hallway & Stairs. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Office occupied.","resolution":"Downgrade binary_sensor.office_person_occupancy, binary_sensor.office_entryway_person_occupancy to `supporting` and trigger Office only from interior Frigate sub-zones."},{"severity":"high","category":"camera_spillover","title":"Basement Theater Camera cone spills into Basement Play Area, Storage Room","rooms":["Basement Theater","Basement Play Area","Storage Room"],"camera_id":"camera.basement_theater","description":"`camera.basement_theater` (hosted in Basement Theater) also sees Basement Play Area, Storage Room. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Basement Theater occupied.","resolution":"Downgrade binary_sensor.basement_theater_person_occupancy, binary_sensor.basement_stairwell_person_occupancy to `supporting` and trigger Basement Theater only from interior Frigate sub-zones."},{"severity":"high","category":"camera_spillover","title":"Basement Play Area Camera cone spills into Basement Theater","rooms":["Basement Play Area","Basement Theater"],"camera_id":"camera.basement_play_area","description":"`camera.basement_play_area` (hosted in Basement Play Area) also sees Basement Theater. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Basement Play Area occupied.","resolution":"Downgrade binary_sensor.basement_play_area_person_occupancy, binary_sensor.basement_stairwell_person_occupancy to `supporting` and trigger Basement Play Area only from interior Frigate sub-zones."},{"severity":"high","category":"camera_spillover","title":"Storage Room Camera cone spills into Basement Play Area","rooms":["Storage Room","Basement Play Area"],"camera_id":"camera.storage_room","description":"`camera.storage_room` (hosted in Storage Room) also sees Basement Play Area. If whole-frame person detection is weighted as `strong`, movement in the adjacent entryway/hallway/room will falsely mark Storage Room occupied.","resolution":"Downgrade whole-frame camera person to `supporting` and trigger Storage Room only from interior Frigate sub-zones."},{"severity":"medium","category":"blind_pocket","title":"Master Bathroom & Closet interior is out of camera view","rooms":["Master Bathroom","Master Bedroom"],"camera_id":"camera.master_bedroom","description":"`camera.master_bedroom` catches the Master Bathroom/Closet entry doorway (`binary_sensor.master_bathroom_person_occupancy`), but the interior shower, vanity, and closet are out of frame.","resolution":"Trigger on `master_bathroom_person_occupancy` doorway entry, sustain on shower fan, lights, or humidity derivative (`> 0.3`), and hand off timer when returning to Master Bedroom."},{"severity":"low","category":"blind_pocket","title":"Basement Bathroom is out of frame left of Play Area camera","rooms":["Basement Play Area","Storage Room"],"camera_id":"camera.basement_play_area","description":"Located to the left of `camera.basement_play_area` alongside Storage Room, with an unmonitored door and no interior sensors.","resolution":"Treat left edge exit from Basement Play Area as an unsealed transition; Storage Room uses its internal `camera.storage_room` to distinguish gym/storage entry."},{"severity":"medium","category":"vertical_ble_bleed","title":"Vertical BLE stack: Master Bedroom directly above Dining Room (68% overlap)","rooms":["Master Bedroom","Dining Room"],"camera_id":null,"description":"Master Bedroom (Upstairs) sits directly over Dining Room (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.","resolution":"Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor."},{"severity":"medium","category":"vertical_ble_bleed","title":"Vertical BLE stack: Master Bedroom directly above Living Room (79% overlap)","rooms":["Master Bedroom","Living Room"],"camera_id":null,"description":"Master Bedroom (Upstairs) sits directly over Living Room (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.","resolution":"Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor."},{"severity":"medium","category":"vertical_ble_bleed","title":"Vertical BLE stack: Master Bedroom directly above Kitchen (36% overlap)","rooms":["Master Bedroom","Kitchen"],"camera_id":null,"description":"Master Bedroom (Upstairs) sits directly over Kitchen (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.","resolution":"Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor."},{"severity":"medium","category":"vertical_ble_bleed","title":"Vertical BLE stack: Master W.I.C directly above Front Entry (100% overlap)","rooms":["Master W.I.C","Front Entry"],"camera_id":null,"description":"Master W.I.C (Upstairs) sits directly over Front Entry (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.","resolution":"Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor."},{"severity":"medium","category":"vertical_ble_bleed","title":"Vertical BLE stack: Upstairs Bathroom directly above Front Entry (49% overlap)","rooms":["Upstairs Bathroom","Front Entry"],"camera_id":null,"description":"Upstairs Bathroom (Upstairs) sits directly over Front Entry (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.","resolution":"Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor."},{"severity":"medium","category":"vertical_ble_bleed","title":"Vertical BLE stack: Upstairs Bathroom directly above Laundry Room (41% overlap)","rooms":["Upstairs Bathroom","Laundry Room"],"camera_id":null,"description":"Upstairs Bathroom (Upstairs) sits directly over Laundry Room (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.","resolution":"Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor."},{"severity":"medium","category":"vertical_ble_bleed","title":"Vertical BLE stack: Master Bathroom directly above Front Entry (38% overlap)","rooms":["Master Bathroom","Front Entry"],"camera_id":null,"description":"Master Bathroom (Upstairs) sits directly over Front Entry (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.","resolution":"Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor."},{"severity":"medium","category":"vertical_ble_bleed","title":"Vertical BLE stack: Master Bathroom directly above Garage (43% overlap)","rooms":["Master Bathroom","Garage"],"camera_id":null,"description":"Master Bathroom (Upstairs) sits directly over Garage (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.","resolution":"Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor."},{"severity":"medium","category":"vertical_ble_bleed","title":"Vertical BLE stack: Margot's Room directly above Kitchen (53% overlap)","rooms":["Margot's Room","Kitchen"],"camera_id":null,"description":"Margot's Room (Upstairs) sits directly over Kitchen (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.","resolution":"Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor."},{"severity":"medium","category":"vertical_ble_bleed","title":"Vertical BLE stack: Guest Room directly above Family Room (74% overlap)","rooms":["Guest Room","Family Room"],"camera_id":null,"description":"Guest Room (Upstairs) sits directly over Family Room (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.","resolution":"Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor."},{"severity":"medium","category":"vertical_ble_bleed","title":"Vertical BLE stack: Office directly above Garage (51% overlap)","rooms":["Office","Garage"],"camera_id":null,"description":"Office (Upstairs) sits directly over Garage (Main Floor). Phone/tablet BLE proxies can bleed vertically through the floor.","resolution":"Keep single BLE trackers at `moderate` (`60%` solo < `75%` threshold) and secondary tablets at `supporting` (`prob_given_false: 0.25`) so vertical BLE drift cannot trigger occupancy without a camera or PIR sensor."}],"compiled_room_rules":{"Master Bedroom":{"room_name":"Master Bedroom","connected_rooms":["Front Entry","Guest Room","Margot's Room","Master Bathroom","Master W.I.C","Office","Upstairs Bathroom"],"recommended_mode":"open","can_be_bounded":false,"unsealed_exits":["Upstairs Hallway & Stairs (unmonitored door)","Master W.I.C (unmonitored door)","Master Bathroom (unmonitored door)"],"recommended_inactivity_timeout":300,"spillover_entities_to_downgrade":["binary_sensor.master_bedroom_person_occupancy","binary_sensor.master_bedroom_entryway_person_occupancy"],"max_camera_coverage_pct":100.0},"Master W.I.C":{"room_name":"Master W.I.C","connected_rooms":["Master Bedroom"],"recommended_mode":"open","can_be_bounded":false,"unsealed_exits":["Master Bedroom (unmonitored door)"],"recommended_inactivity_timeout":300,"spillover_entities_to_downgrade":[],"max_camera_coverage_pct":0.0},"Upstairs Bathroom":{"room_name":"Upstairs Bathroom","connected_rooms":["Front Entry","Guest Room","Margot's Room","Master Bedroom","Office"],"recommended_mode":"open","can_be_bounded":false,"unsealed_exits":["Upstairs Hallway & Stairs (unmonitored door)"],"recommended_inactivity_timeout":600,"spillover_entities_to_downgrade":[],"max_camera_coverage_pct":0.0},"Master Bathroom":{"room_name":"Master Bathroom","connected_rooms":["Master Bedroom"],"recommended_mode":"open","can_be_bounded":false,"unsealed_exits":["Master Bedroom (unmonitored door)"],"recommended_inactivity_timeout":600,"spillover_entities_to_downgrade":[],"max_camera_coverage_pct":46.0},"Margot's Room":{"room_name":"Margot's Room","connected_rooms":["Front Entry","Guest Room","Master Bedroom","Office","Upstairs Bathroom"],"recommended_mode":"open","can_be_bounded":false,"unsealed_exits":["Upstairs Hallway & Stairs (unmonitored door)"],"recommended_inactivity_timeout":300,"spillover_entities_to_downgrade":["binary_sensor.nursery_person_occupancy"],"max_camera_coverage_pct":88.0},"Guest Room":{"room_name":"Guest Room","connected_rooms":["Front Entry","Margot's Room","Master Bedroom","Office","Upstairs Bathroom"],"recommended_mode":"open","can_be_bounded":false,"unsealed_exits":["Upstairs Hallway & Stairs (unmonitored door)"],"recommended_inactivity_timeout":300,"spillover_entities_to_downgrade":[],"max_camera_coverage_pct":8.0},"Office":{"room_name":"Office","connected_rooms":["Front Entry","Guest Room","Margot's Room","Master Bedroom","Upstairs Bathroom"],"recommended_mode":"open","can_be_bounded":false,"unsealed_exits":["Upstairs Hallway & Stairs (unmonitored door)"],"recommended_inactivity_timeout":240,"spillover_entities_to_downgrade":["binary_sensor.office_person_occupancy","binary_sensor.office_entryway_person_occupancy"],"max_camera_coverage_pct":99.0},"Dining Room":{"room_name":"Dining Room","connected_rooms":["Kitchen","Living Room"],"recommended_mode":"open","can_be_bounded":false,"unsealed_exits":["Living Room (open passage)","Kitchen (open passage)"],"recommended_inactivity_timeout":180,"spillover_entities_to_downgrade":[],"max_camera_coverage_pct":100.0},"Living Room":{"room_name":"Living Room","connected_rooms":["Dining Room","Front Entry"],"recommended_mode":"open","can_be_bounded":false,"unsealed_exits":["Front Entry (open passage)","Dining Room (open passage)"],"recommended_inactivity_timeout":180,"spillover_entities_to_downgrade":["binary_sensor.living_room_person_occupancy"],"max_camera_coverage_pct":91.0},"Kitchen":{"room_name":"Kitchen","connected_rooms":["Dining Room","Family Room","Front Entry"],"recommended_mode":"open","can_be_bounded":false,"unsealed_exits":["Front Entry (open passage)","Dining Room (open passage)","Family Room (open passage)"],"recommended_inactivity_timeout":180,"spillover_entities_to_downgrade":[],"max_camera_coverage_pct":100.0},"Powder Bath":{"room_name":"Powder Bath","connected_rooms":["Front Entry"],"recommended_mode":"open","can_be_bounded":false,"unsealed_exits":["Front Entry (unmonitored door)"],"recommended_inactivity_timeout":300,"spillover_entities_to_downgrade":[],"max_camera_coverage_pct":17.0},"Front Entry":{"room_name":"Front Entry","connected_rooms":["Family Room","Guest Room","Kitchen","Laundry Room","Living Room","Margot's Room","Master Bedroom","Office","Powder Bath","Upstairs Bathroom"],"recommended_mode":"open","can_be_bounded":false,"unsealed_exits":["Living Room (open passage)","Kitchen (open passage)","Family Room (open passage)","Powder Bath (unmonitored door)","Laundry Room (unmonitored door)","Upstairs Hallway & Stairs (stairs)"],"recommended_inactivity_timeout":60,"spillover_entities_to_downgrade":[],"max_camera_coverage_pct":27.0},"Family Room":{"room_name":"Family Room","connected_rooms":["Basement Play Area","Basement Theater","Front Entry","Garage","Kitchen"],"recommended_mode":"open","can_be_bounded":false,"unsealed_exits":["Front Entry (open passage)","Kitchen (open passage)","Garage (unmonitored door)","Basement Play Area (stairs)","Basement Theater (stairs)"],"recommended_inactivity_timeout":180,"spillover_entities_to_downgrade":["binary_sensor.family_room_person_occupancy"],"max_camera_coverage_pct":100.0},"Laundry Room":{"room_name":"Laundry Room","connected_rooms":["Front Entry","Garage"],"recommended_mode":"open","can_be_bounded":false,"unsealed_exits":["Front Entry (unmonitored door)","Garage (unmonitored door)"],"recommended_inactivity_timeout":180,"spillover_entities_to_downgrade":[],"max_camera_coverage_pct":0.0},"Garage":{"room_name":"Garage","connected_rooms":["Family Room","Laundry Room"],"recommended_mode":"open","can_be_bounded":false,"unsealed_exits":["Family Room (unmonitored door)","Laundry Room (unmonitored door)"],"recommended_inactivity_timeout":180,"spillover_entities_to_downgrade":[],"max_camera_coverage_pct":90.0},"Basement Theater":{"room_name":"Basement Theater","connected_rooms":["Basement Play Area","Family Room"],"recommended_mode":"open","can_be_bounded":false,"unsealed_exits":["Family Room (stairs)","Basement Play Area (open passage)"],"recommended_inactivity_timeout":240,"spillover_entities_to_downgrade":["binary_sensor.basement_theater_person_occupancy","binary_sensor.basement_stairwell_person_occupancy"],"max_camera_coverage_pct":97.0},"Basement Play Area":{"room_name":"Basement Play Area","connected_rooms":["Basement Theater","Family Room","Storage Room"],"recommended_mode":"open","can_be_bounded":false,"unsealed_exits":["Family Room (stairs)","Basement Theater (open passage)","Storage Room (unmonitored door)","Basement Bathroom (unmonitored door)"],"recommended_inactivity_timeout":180,"spillover_entities_to_downgrade":["binary_sensor.basement_play_area_person_occupancy","binary_sensor.basement_stairwell_person_occupancy"],"max_camera_coverage_pct":65.0},"Storage Room":{"room_name":"Storage Room","connected_rooms":["Basement Play Area"],"recommended_mode":"open","can_be_bounded":false,"unsealed_exits":["Basement Play Area (unmonitored door)"],"recommended_inactivity_timeout":180,"spillover_entities_to_downgrade":[],"max_camera_coverage_pct":100.0}},"device_model_presets":{"tapo_c110_corner":{"id":"tapo_c110_corner","name":"TP-Link Tapo C110 (Corner / Wall Mount)","label":"TP-Link Tapo C110 (Corner / Wall Mount)","category":"camera","device_type":"camera","fov_deg":110,"horizontal_fov_deg":110,"vertical_fov_deg":62,"mount_pitch_deg":15,"default_range_px":560,"description":"Standard 110\u00b0 wide-angle corner or upper-wall mount covering both adjacent walls."},"tapo_c110_overhead":{"id":"tapo_c110_overhead","name":"TP-Link Tapo C110 (High Steep Downward Pitch)","label":"TP-Link Tapo C110 (High Steep Downward Pitch)","category":"camera","device_type":"camera","fov_deg":164,"horizontal_fov_deg":110,"vertical_fov_deg":62,"mount_pitch_deg":62,"default_range_px":250,"description":"Same Tapo C110 110\u00b0 sensor pitched steeply down (~62\u00b0) on a flat wall (e.g., Garage), widening the near-wall 2D floor footprint to 164\u00b0."},"reolink_rlc_810a":{"id":"reolink_rlc_810a","name":"Reolink RLC-810A / PoE Bullet (87\u00b0 FOV)","label":"Reolink RLC-810A / PoE Bullet (87\u00b0 FOV)","category":"camera","device_type":"camera","fov_deg":87,"horizontal_fov_deg":87,"vertical_fov_deg":47,"mount_pitch_deg":15,"default_range_px":500,"description":"4K PoE bullet camera with 87\u00b0 horizontal field of view."},"unifi_g4_instant":{"id":"unifi_g4_instant","name":"UniFi Protect G4/G5 Instant (102\u00b0 FOV)","label":"UniFi Protect G4/G5 Instant (102\u00b0 FOV)","category":"camera","device_type":"camera","fov_deg":102,"horizontal_fov_deg":102,"vertical_fov_deg":55,"mount_pitch_deg":15,"default_range_px":450,"description":"Compact wide-angle Wi-Fi camera with 102\u00b0 horizontal field of view."},"ecobee_smart_sensor":{"id":"ecobee_smart_sensor","name":"Ecobee SmartSensor / Room Sensor (110\u00b0 Table-Height PIR, Slow Reset)","label":"Ecobee SmartSensor (110\u00b0 Table-Height PIR, Slow Reset)","category":"pir_motion","device_type":"pir_motion","manufacturer":"ecobee","model":"EBERS41 / EBRSE4 (Table/Shelf Mount)","fov_deg":110,"default_range_px":190,"range_ft":12.0,"range_m":3.7,"mount_height_ft":3.5,"cooldown_sec":300,"occupancy_cooldown_sec":1800,"recommended_weight":"supporting","description":"Table/shelf-height (3-4 ft) 110\u00b0 thermal PIR with slow ~5 min motion reset and 30 min occupancy tail; use as supporting hold evidence, not primary trigger."},"ecobee_thermostat_pir":{"id":"ecobee_thermostat_pir","name":"Ecobee4 Wall Thermostat PIR (120\u00b0 Wall Mount, Slow Reset)","label":"Ecobee4 Wall Thermostat PIR (120\u00b0 Wall, Slow Reset)","category":"pir_motion","device_type":"pir_motion","manufacturer":"ecobee","model":"ecobee4 Wall Thermostat","fov_deg":120,"default_range_px":220,"range_ft":14.0,"range_m":4.3,"mount_height_ft":5.0,"cooldown_sec":300,"occupancy_cooldown_sec":1800,"recommended_weight":"supporting","description":"5 ft wall-mounted thermostat 120\u00b0 thermal PIR with slow ~5 min motion reset and 30 min occupancy tail."},"ikea_vallhorn_pir":{"id":"ikea_vallhorn_pir","name":"IKEA VALLHORN Wireless Motion Sensor (120\u00b0/5m + 60\u00b0/10m Dual-Lobe PIR)","label":"IKEA VALLHORN Wireless Motion Sensor (120\u00b0/5m + 60\u00b0/10m)","category":"pir_motion","device_type":"pir_motion","manufacturer":"IKEA of Sweden","model":"VALLHORN E2134 (405.043.48)","fov_deg":120,"default_range_px":260,"inner_fov_deg":60,"inner_range_px":520,"range_ft":16.4,"range_m":5.0,"inner_range_ft":32.8,"inner_range_m":10.0,"cooldown_sec":60,"description":"Zigbee 3.0 dual-lobe Fresnel PIR: 120\u00b0 wide-angle peripheral zone to 5m (16.4 ft / 260px) plus 60\u00b0 center beam reaching 10m (32.8 ft / 520px)."},"sonoff_snzb_03pr2":{"id":"sonoff_snzb_03pr2","name":"SONOFF SenseGuard Motion Gen2 (SNZB-03PR2, 120\u00b0 / 6m Zigbee PIR)","label":"SONOFF SenseGuard Motion Gen2 (SNZB-03PR2)","category":"pir_motion","device_type":"pir_motion","manufacturer":"SONOFF","model":"SNZB-03PR2 (Zigbee 3.0 PIR + Lux)","fov_deg":120,"default_range_px":315,"range_ft":19.7,"range_m":6.0,"mount_height_ft":7.0,"mount_pitch_deg":15,"cooldown_sec":60,"description":"Zigbee 3.0 PIR motion + ambient illuminance sensor with 120\u00b0 FOV, 6m (19.7 ft / 315px) range, magnetic cup wall/corner mount tilted ~15\u00b0 downward."},"wyze_sense_pir":{"id":"wyze_sense_pir","name":"Wyze Sense Motion Sensor v1 (120\u00b0 Wide PIR, 26 ft / 7.8m)","label":"Wyze Sense Motion Sensor v1 (120\u00b0 PIR, 26 ft)","category":"pir_motion","device_type":"pir_motion","manufacturer":"Wyze","model":"WYZESENSE-PIR (WYZEMS1)","fov_deg":120,"default_range_px":405,"range_ft":25.5,"range_m":7.8,"mount_pitch_deg":12,"cooldown_sec":45,"description":"915MHz ultra-compact 120\u00b0 wide-angle PIR motion sensor with downward-slanted Fresnel lens and 25-26 ft (7.8m / 405px) range."},"ring_alarm_pir_gen2":{"id":"ring_alarm_pir_gen2","name":"Ring Alarm Motion Detector (90\u00b0 PIR, 30 ft / 9.1m)","label":"Ring Alarm Motion Detector (90\u00b0 PIR, 30 ft)","category":"pir_motion","device_type":"pir_motion","manufacturer":"Ring","model":"4SP1SZ (Z-Wave Plus PIR)","fov_deg":90,"default_range_px":475,"range_ft":30.0,"range_m":9.1,"mount_height_ft":7.5,"cooldown_sec":60,"description":"90\u00b0 horizontal FOV corner/wall Z-Wave PIR motion detector with 30 ft (9.1m / 475px) range at 7'6\" mounting height."},"ring_stick_up_cam_gen3":{"id":"ring_stick_up_cam_gen3","name":"Ring Stick Up Cam (3rd Gen, 110\u00b0 H-FOV / 130\u00b0 Diag Motion)","label":"Ring Stick Up Cam (3rd Gen, 110\u00b0 FOV)","category":"pir_motion","device_type":"pir_motion","manufacturer":"Ring","model":"Stick Up Cam (3rd Gen)","fov_deg":110,"default_range_px":380,"range_ft":24.0,"range_m":7.3,"cooldown_sec":30,"description":"Ring Stick Up Cam (3rd Gen) with 130\u00b0 diagonal / 110\u00b0 horizontal FOV and PIR/pixel motion detection."},"ring_keypad_pir":{"id":"ring_keypad_pir","name":"Ring Alarm Keypad Proximity PIR (100\u00b0)","label":"Ring Alarm Keypad Proximity PIR (100\u00b0)","category":"pir_motion","device_type":"pir_motion","manufacturer":"Ring","model":"4AK1SZ Keypad","fov_deg":100,"default_range_px":165,"range_ft":10.5,"range_m":3.2,"cooldown_sec":30,"description":"Short-range proximity PIR built into wall keypad."},"aqara_fp2_mmwave":{"id":"aqara_fp2_mmwave","name":"Aqara FP2 60GHz mmWave Radar (120\u00b0)","label":"Aqara FP2 60GHz mmWave Radar (120\u00b0)","category":"pir_motion","device_type":"pir_motion","manufacturer":"Aqara","model":"PS-S02D (FP2)","fov_deg":120,"default_range_px":340,"range_ft":21.5,"range_m":6.5,"cooldown_sec":5,"description":"Wide 120\u00b0 multi-zone 60GHz mmWave radar presence sensor."},"apollo_msr_2":{"id":"apollo_msr_2","name":"Apollo MSR-2 / LD2410 mmWave (110\u00b0)","label":"Apollo MSR-2 / LD2410 mmWave (110\u00b0)","category":"pir_motion","device_type":"pir_motion","manufacturer":"Apollo Automation","model":"MSR-2 (HLK-LD2410B)","fov_deg":110,"default_range_px":300,"range_ft":19.0,"range_m":5.8,"cooldown_sec":5,"description":"24GHz mmWave radar presence sensor."},"ratgdo_pir":{"id":"ratgdo_pir","name":"ratgdo v2.5i Garage Opener PIR (100\u00b0)","label":"ratgdo v2.5i Garage Opener PIR (100\u00b0)","category":"pir_motion","device_type":"pir_motion","manufacturer":"ratgdo","model":"v2.5i Security+ Wall Panel","fov_deg":100,"default_range_px":175,"range_ft":11.0,"range_m":3.4,"cooldown_sec":60,"description":"Garage door wall control panel motion sensor."},"wyze_sense_contact":{"id":"wyze_sense_contact","name":"Wyze Sense Contact Sensor v1 (915MHz Magnetic Reed)","label":"Wyze Sense Contact Sensor v1 (915MHz Reed)","category":"door_contact","device_type":"door_contact","manufacturer":"Wyze","model":"WYZESENSE-CONTACT (WYZEC1)","actuation_gap_mm":20,"response_ms":150,"description":"Ultra-compact 915MHz magnetic door/window reed contact sensor (<=20mm actuation gap) via WyzeSense2MQTT bridge."},"ring_contact_sensor":{"id":"ring_contact_sensor","name":"Ring Alarm Contact Sensor Gen 2 (Z-Wave Reed)","label":"Ring Alarm Contact Sensor Gen 2 (Z-Wave)","category":"door_contact","device_type":"door_contact","manufacturer":"Ring","model":"5AT2S2 (Gen 2 Z-Wave)","actuation_gap_mm":25,"response_ms":200,"description":"Z-Wave perimeter door and window magnetic reed contact sensor."},"google_home_speaker_ble":{"id":"google_home_speaker_ble","name":"Google Home / Nest Speaker BLE Proxy","label":"Google Home / Nest Speaker BLE Proxy","category":"ble_proxy","device_type":"ble_proxy","radius_px":210,"description":"Indoor smart speaker Bluetooth Low Energy RSSI anchor."}}};

const PDD_DEVICE_MODEL_PRESETS = {"tapo_c110_corner":{"id":"tapo_c110_corner","name":"TP-Link Tapo C110 (Corner / Wall Mount)","label":"TP-Link Tapo C110 (Corner / Wall Mount)","category":"camera","device_type":"camera","fov_deg":110,"horizontal_fov_deg":110,"vertical_fov_deg":62,"mount_pitch_deg":15,"default_range_px":560,"description":"Standard 110\u00b0 wide-angle corner or upper-wall mount covering both adjacent walls."},"tapo_c110_overhead":{"id":"tapo_c110_overhead","name":"TP-Link Tapo C110 (High Steep Downward Pitch)","label":"TP-Link Tapo C110 (High Steep Downward Pitch)","category":"camera","device_type":"camera","fov_deg":164,"horizontal_fov_deg":110,"vertical_fov_deg":62,"mount_pitch_deg":62,"default_range_px":250,"description":"Same Tapo C110 110\u00b0 sensor pitched steeply down (~62\u00b0) on a flat wall (e.g., Garage), widening the near-wall 2D floor footprint to 164\u00b0."},"reolink_rlc_810a":{"id":"reolink_rlc_810a","name":"Reolink RLC-810A / PoE Bullet (87\u00b0 FOV)","label":"Reolink RLC-810A / PoE Bullet (87\u00b0 FOV)","category":"camera","device_type":"camera","fov_deg":87,"horizontal_fov_deg":87,"vertical_fov_deg":47,"mount_pitch_deg":15,"default_range_px":500,"description":"4K PoE bullet camera with 87\u00b0 horizontal field of view."},"unifi_g4_instant":{"id":"unifi_g4_instant","name":"UniFi Protect G4/G5 Instant (102\u00b0 FOV)","label":"UniFi Protect G4/G5 Instant (102\u00b0 FOV)","category":"camera","device_type":"camera","fov_deg":102,"horizontal_fov_deg":102,"vertical_fov_deg":55,"mount_pitch_deg":15,"default_range_px":450,"description":"Compact wide-angle Wi-Fi camera with 102\u00b0 horizontal field of view."},"ecobee_smart_sensor":{"id":"ecobee_smart_sensor","name":"Ecobee SmartSensor / Room Sensor (110\u00b0 Table-Height PIR, Slow Reset)","label":"Ecobee SmartSensor (110\u00b0 Table-Height PIR, Slow Reset)","category":"pir_motion","device_type":"pir_motion","manufacturer":"ecobee","model":"EBERS41 / EBRSE4 (Table/Shelf Mount)","fov_deg":110,"default_range_px":190,"range_ft":12.0,"range_m":3.7,"mount_height_ft":3.5,"cooldown_sec":300,"occupancy_cooldown_sec":1800,"recommended_weight":"supporting","description":"Table/shelf-height (3-4 ft) 110\u00b0 thermal PIR with slow ~5 min motion reset and 30 min occupancy tail; use as supporting hold evidence, not primary trigger."},"ecobee_thermostat_pir":{"id":"ecobee_thermostat_pir","name":"Ecobee4 Wall Thermostat PIR (120\u00b0 Wall Mount, Slow Reset)","label":"Ecobee4 Wall Thermostat PIR (120\u00b0 Wall, Slow Reset)","category":"pir_motion","device_type":"pir_motion","manufacturer":"ecobee","model":"ecobee4 Wall Thermostat","fov_deg":120,"default_range_px":220,"range_ft":14.0,"range_m":4.3,"mount_height_ft":5.0,"cooldown_sec":300,"occupancy_cooldown_sec":1800,"recommended_weight":"supporting","description":"5 ft wall-mounted thermostat 120\u00b0 thermal PIR with slow ~5 min motion reset and 30 min occupancy tail."},"ikea_vallhorn_pir":{"id":"ikea_vallhorn_pir","name":"IKEA VALLHORN Wireless Motion Sensor (120\u00b0/5m + 60\u00b0/10m Dual-Lobe PIR)","label":"IKEA VALLHORN Wireless Motion Sensor (120\u00b0/5m + 60\u00b0/10m)","category":"pir_motion","device_type":"pir_motion","manufacturer":"IKEA of Sweden","model":"VALLHORN E2134 (405.043.48)","fov_deg":120,"default_range_px":260,"inner_fov_deg":60,"inner_range_px":520,"range_ft":16.4,"range_m":5.0,"inner_range_ft":32.8,"inner_range_m":10.0,"cooldown_sec":60,"description":"Zigbee 3.0 dual-lobe Fresnel PIR: 120\u00b0 wide-angle peripheral zone to 5m (16.4 ft / 260px) plus 60\u00b0 center beam reaching 10m (32.8 ft / 520px)."},"sonoff_snzb_03pr2":{"id":"sonoff_snzb_03pr2","name":"SONOFF SenseGuard Motion Gen2 (SNZB-03PR2, 120\u00b0 / 6m Zigbee PIR)","label":"SONOFF SenseGuard Motion Gen2 (SNZB-03PR2)","category":"pir_motion","device_type":"pir_motion","manufacturer":"SONOFF","model":"SNZB-03PR2 (Zigbee 3.0 PIR + Lux)","fov_deg":120,"default_range_px":315,"range_ft":19.7,"range_m":6.0,"mount_height_ft":7.0,"mount_pitch_deg":15,"cooldown_sec":60,"description":"Zigbee 3.0 PIR motion + ambient illuminance sensor with 120\u00b0 FOV, 6m (19.7 ft / 315px) range, magnetic cup wall/corner mount tilted ~15\u00b0 downward."},"wyze_sense_pir":{"id":"wyze_sense_pir","name":"Wyze Sense Motion Sensor v1 (120\u00b0 Wide PIR, 26 ft / 7.8m)","label":"Wyze Sense Motion Sensor v1 (120\u00b0 PIR, 26 ft)","category":"pir_motion","device_type":"pir_motion","manufacturer":"Wyze","model":"WYZESENSE-PIR (WYZEMS1)","fov_deg":120,"default_range_px":405,"range_ft":25.5,"range_m":7.8,"mount_pitch_deg":12,"cooldown_sec":45,"description":"915MHz ultra-compact 120\u00b0 wide-angle PIR motion sensor with downward-slanted Fresnel lens and 25-26 ft (7.8m / 405px) range."},"ring_alarm_pir_gen2":{"id":"ring_alarm_pir_gen2","name":"Ring Alarm Motion Detector (90\u00b0 PIR, 30 ft / 9.1m)","label":"Ring Alarm Motion Detector (90\u00b0 PIR, 30 ft)","category":"pir_motion","device_type":"pir_motion","manufacturer":"Ring","model":"4SP1SZ (Z-Wave Plus PIR)","fov_deg":90,"default_range_px":475,"range_ft":30.0,"range_m":9.1,"mount_height_ft":7.5,"cooldown_sec":60,"description":"90\u00b0 horizontal FOV corner/wall Z-Wave PIR motion detector with 30 ft (9.1m / 475px) range at 7'6\" mounting height."},"ring_stick_up_cam_gen3":{"id":"ring_stick_up_cam_gen3","name":"Ring Stick Up Cam (3rd Gen, 110\u00b0 H-FOV / 130\u00b0 Diag Motion)","label":"Ring Stick Up Cam (3rd Gen, 110\u00b0 FOV)","category":"pir_motion","device_type":"pir_motion","manufacturer":"Ring","model":"Stick Up Cam (3rd Gen)","fov_deg":110,"default_range_px":380,"range_ft":24.0,"range_m":7.3,"cooldown_sec":30,"description":"Ring Stick Up Cam (3rd Gen) with 130\u00b0 diagonal / 110\u00b0 horizontal FOV and PIR/pixel motion detection."},"ring_keypad_pir":{"id":"ring_keypad_pir","name":"Ring Alarm Keypad Proximity PIR (100\u00b0)","label":"Ring Alarm Keypad Proximity PIR (100\u00b0)","category":"pir_motion","device_type":"pir_motion","manufacturer":"Ring","model":"4AK1SZ Keypad","fov_deg":100,"default_range_px":165,"range_ft":10.5,"range_m":3.2,"cooldown_sec":30,"description":"Short-range proximity PIR built into wall keypad."},"aqara_fp2_mmwave":{"id":"aqara_fp2_mmwave","name":"Aqara FP2 60GHz mmWave Radar (120\u00b0)","label":"Aqara FP2 60GHz mmWave Radar (120\u00b0)","category":"pir_motion","device_type":"pir_motion","manufacturer":"Aqara","model":"PS-S02D (FP2)","fov_deg":120,"default_range_px":340,"range_ft":21.5,"range_m":6.5,"cooldown_sec":5,"description":"Wide 120\u00b0 multi-zone 60GHz mmWave radar presence sensor."},"apollo_msr_2":{"id":"apollo_msr_2","name":"Apollo MSR-2 / LD2410 mmWave (110\u00b0)","label":"Apollo MSR-2 / LD2410 mmWave (110\u00b0)","category":"pir_motion","device_type":"pir_motion","manufacturer":"Apollo Automation","model":"MSR-2 (HLK-LD2410B)","fov_deg":110,"default_range_px":300,"range_ft":19.0,"range_m":5.8,"cooldown_sec":5,"description":"24GHz mmWave radar presence sensor."},"ratgdo_pir":{"id":"ratgdo_pir","name":"ratgdo v2.5i Garage Opener PIR (100\u00b0)","label":"ratgdo v2.5i Garage Opener PIR (100\u00b0)","category":"pir_motion","device_type":"pir_motion","manufacturer":"ratgdo","model":"v2.5i Security+ Wall Panel","fov_deg":100,"default_range_px":175,"range_ft":11.0,"range_m":3.4,"cooldown_sec":60,"description":"Garage door wall control panel motion sensor."},"wyze_sense_contact":{"id":"wyze_sense_contact","name":"Wyze Sense Contact Sensor v1 (915MHz Magnetic Reed)","label":"Wyze Sense Contact Sensor v1 (915MHz Reed)","category":"door_contact","device_type":"door_contact","manufacturer":"Wyze","model":"WYZESENSE-CONTACT (WYZEC1)","actuation_gap_mm":20,"response_ms":150,"description":"Ultra-compact 915MHz magnetic door/window reed contact sensor (<=20mm actuation gap) via WyzeSense2MQTT bridge."},"ring_contact_sensor":{"id":"ring_contact_sensor","name":"Ring Alarm Contact Sensor Gen 2 (Z-Wave Reed)","label":"Ring Alarm Contact Sensor Gen 2 (Z-Wave)","category":"door_contact","device_type":"door_contact","manufacturer":"Ring","model":"5AT2S2 (Gen 2 Z-Wave)","actuation_gap_mm":25,"response_ms":200,"description":"Z-Wave perimeter door and window magnetic reed contact sensor."},"google_home_speaker_ble":{"id":"google_home_speaker_ble","name":"Google Home / Nest Speaker BLE Proxy","label":"Google Home / Nest Speaker BLE Proxy","category":"ble_proxy","device_type":"ble_proxy","radius_px":210,"description":"Indoor smart speaker Bluetooth Low Energy RSSI anchor."}};

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
    this._editorTab = "setup"; // "setup" | "rules" | "diagnostics"
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
        ? "var(--ha-danger, #b91c1c)"
        : this._toast.type === "success"
        ? "var(--ha-success, #15803d)"
        : "var(--ha-primary, #0369a1)";
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
      sensor_weights: room.sensor_weights || [],
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
        <div style="padding:10px;background:rgba(185, 28, 28, 0.12);border:1px solid var(--ha-danger-text);border-radius:6px;color:var(--ha-danger-text);font-size:12px;margin-top:6px;">
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
            <div style="font-weight:700;font-size:14px;color:var(--ha-primary-text);">${res.tilt_deg > 0 ? "+" : ""}${res.tilt_deg}°</div>
            <div style="font-size:10px;color:var(--ha-muted);">${res.tilt_deg < 0 ? "Angled Down" : "Level/Up"}</div>
          </div>
          <div style="background:var(--ha-subtle, #f1f5f9);padding:8px 6px;border-radius:6px;border:1px solid var(--ha-divider);">
            <div style="color:var(--ha-muted);font-size:11px;">Camera Roll</div>
            <div style="font-weight:700;font-size:14px;color:var(--ha-primary-text);">${res.roll_deg > 0 ? "+" : ""}${res.roll_deg}°</div>
            <div style="font-size:10px;color:var(--ha-muted);">Horizon Level</div>
          </div>
          <div style="background:var(--ha-subtle, #f1f5f9);padding:8px 6px;border-radius:6px;border:1px solid var(--ha-divider);">
            <div style="color:var(--ha-muted);font-size:11px;">Cone Alignment</div>
            <div style="font-weight:700;font-size:14px;color:${Math.abs(diffHeading) > 3 ? "var(--ha-warning-text)" : "var(--ha-success-text)"};">
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
                  <strong style="color:var(--ha-primary-text);">${this._escape(op.target_room || op.entryway_id || "Passage")}</strong>
                  <span style="font-size:10px;color:var(--ha-muted);margin-left:4px;">(Bearing: ${op.bearing_deg ?? "—"}°)</span>
                </div>
                <div style="text-align:right;">
                  <span>Azimuth: <strong>${op.azimuth_deg > 0 ? "+" : ""}${op.azimuth_deg}°</strong></span>
                  ${
                    op.discrepancy_deg !== undefined
                      ? `<span style="margin-left:6px;color:${Math.abs(op.discrepancy_deg) > 3 ? "var(--ha-warning-text)" : "var(--ha-success-text)"};font-weight:600;">(Δ ${op.discrepancy_deg > 0 ? "+" : ""}${op.discrepancy_deg}°)</span>`
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
      // Keep trigger_entities synced only with human-exclusive binary_sensors (SIGNAL-01)
      const obs = this._draftConfig.bayesian_observations || [];
      const autoTriggers = (this._draftConfig.trigger_entities || []).filter((eid) =>
        this._isHumanExclusiveCandidate(eid)
      );
      for (const o of obs) {
        const preset = o.preset || o.weight || "moderate";
        if (
          (preset === "decisive" || preset === "strong") &&
          o.entity_id &&
          o.entity_id.startsWith("binary_sensor.") &&
          this._isHumanExclusiveCandidate(o.entity_id) &&
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

  _sensorWeightMap(selRoom, prev) {
    const map = {};
    const lists = [prev?.sensor_weights, selRoom?.sensor_weights];
    for (const lst of lists) {
      if (!Array.isArray(lst)) continue;
      for (const item of lst) {
        if (item && item.entity_id && !map[item.entity_id]) {
          map[item.entity_id] = item;
        }
      }
    }
    return map;
  }

  _isHumanExclusiveCandidate(eid, weightMap = null) {
    if (!eid) return false;
    const w = weightMap ? weightMap[eid] : this._sensorWeightMap(this.selectedRoom, this._previewData)[eid];
    if (w && typeof w.human_exclusive === "boolean") {
      return w.human_exclusive;
    }
    const low = String(eid).toLowerCase();
    if (
      low.startsWith("light.") ||
      low.startsWith("switch.") ||
      low.startsWith("fan.") ||
      low.startsWith("media_player.") ||
      low.startsWith("climate.") ||
      low.startsWith("cover.")
    ) {
      return false;
    }
    if (low.startsWith("sensor.")) {
      return low.includes("ble_area") || low.includes("bermuda");
    }
    if (low.startsWith("binary_sensor.")) {
      const nonHuman = [
        "media_playing",
        "_door",
        "door_",
        "_window",
        "contact",
        "_battery",
        "_connectivity",
        "_update",
      ];
      return !nonHuman.some((tok) => low.includes(tok));
    }
    return low.startsWith("camera.") || low.startsWith("device_tracker.") || low.startsWith("person.");
  }

  _slugifyRoom(name) {
    return (
      String(name || "room")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "") || "room"
    );
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
      const d = presets.supporting || { prob_given_true: 0.55, prob_given_false: 0.2 };
      obs.prob_given_true = Math.max(0.55, Number(d.prob_given_true ?? 0.55));
      obs.prob_given_false = Number(d.prob_given_false ?? 0.2);
    } else {
      obs.preset = "moderate";
      obs.corroboration_only = false;
      const d = presets.moderate || { prob_given_true: 0.72, prob_given_false: 0.12 };
      obs.prob_given_true = d.prob_given_true;
      obs.prob_given_false = d.prob_given_false;
    }
    delete obs.cooldown_weighted;
    delete obs.signal_weighted;
  }

  _roomStatusSummary(r) {
    if (!r) return { dotClass: "clear", label: "Vacant", detail: "No activity detected" };
    const state = String(r.occupancy_state || "vacant");
    const countdown = Number(r.cooling_remaining_sec || 0);
    const reason = r.state_reason || r.last_transition_reason || "";
    if (r.is_present) {
      if (state === "override") {
        return {
          dotClass: "occupied",
          label: "Override Lock",
          detail: reason || "Manual presence override active",
        };
      }
      if (state === "occupied_cooling") {
        const durLabel = countdown > 0 ? ` (${this._formatDuration(countdown)})` : "";
        return {
          dotClass: "clearing",
          label: `Cooling${durLabel}`,
          detail: reason || `Cooling down toward vacancy${durLabel}`,
        };
      }
      if (state === "occupied_verifying") {
        return {
          dotClass: "clearing",
          label: "Verifying (Vision AI)",
          detail: reason || "Running bounded Vision/LLM occupancy check",
        };
      }
      if (state === "occupied_holding") {
        return {
          dotClass: "occupied",
          label: "Occupied (Holding)",
          detail: reason || "Held by secondary condition or blind-pocket rule",
        };
      }
      return {
        dotClass: "occupied",
        label: "Occupied",
        detail: reason || (r.last_trigger_entity ? `Triggered by ${r.last_trigger_entity}` : "Confirmed human presence"),
      };
    }
    return {
      dotClass: "clear",
      label: "Vacant",
      detail: reason || "Room is currently unoccupied",
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

    const isDarkTheme = Boolean(
      this._hass?.themes?.darkMode ||
        (typeof document !== "undefined" &&
          (document.documentElement.classList.contains("dark") ||
            document.documentElement.getAttribute("data-theme") === "dark" ||
            (() => {
              try {
                const bg = getComputedStyle(this).getPropertyValue("--primary-background-color").trim();
                return bg.startsWith("#1") || bg.startsWith("#0") || bg.startsWith("#2");
              } catch (_e) {
                return false;
              }
            })()))
    );

    this.shadowRoot.innerHTML = `
      <style>
        :host, presence-detection-designer-panel {
          --ha-bg: var(--primary-background-color, ${isDarkTheme ? "#111111" : "#f5f6f8"});
          --ha-card: var(--card-background-color, ${isDarkTheme ? "#1c1c1c" : "#ffffff"});
          --ha-subtle: var(--secondary-background-color, ${isDarkTheme ? "#262626" : "#f8fafc"});
          --ha-text: var(--primary-text-color, ${isDarkTheme ? "#e1e1e1" : "#0f172a"});
          --ha-muted: ${isDarkTheme ? "#a1a1aa" : "#475569"};
          --ha-divider: var(--divider-color, ${isDarkTheme ? "#2c2c2c" : "#e2e8f0"});
          --ha-primary: #0369a1;
          --ha-primary-text: ${isDarkTheme ? "#38bdf8" : "#0369a1"};
          --ha-success: #15803d;
          --ha-success-text: ${isDarkTheme ? "#4ade80" : "#15803d"};
          --ha-warning: #b45309;
          --ha-warning-text: ${isDarkTheme ? "#fbbf24" : "#b45309"};
          --ha-danger: #b91c1c;
          --ha-danger-text: ${isDarkTheme ? "#f87171" : "#b91c1c"};
          --ha-accent-purple-bg: ${isDarkTheme ? "rgba(124, 58, 237, 0.16)" : "#f5f3ff"};
          --ha-accent-purple-border: ${isDarkTheme ? "rgba(167, 139, 250, 0.4)" : "#ddd6fe"};
          --ha-accent-purple-text: ${isDarkTheme ? "#c4b5fd" : "#5b21b6"};
          --ha-accent-cyan-bg: ${isDarkTheme ? "rgba(6, 182, 212, 0.15)" : "#ecfeff"};
          --ha-accent-cyan-border: ${isDarkTheme ? "rgba(34, 211, 238, 0.38)" : "#a5f3fc"};
          --ha-accent-cyan-text: ${isDarkTheme ? "#67e8f9" : "#155e75"};
          --ha-accent-amber-bg: ${isDarkTheme ? "rgba(245, 158, 11, 0.15)" : "#fffbeb"};
          --ha-accent-amber-border: ${isDarkTheme ? "rgba(251, 191, 36, 0.38)" : "#fde68a"};
          --ha-accent-amber-text: ${isDarkTheme ? "#fcd34d" : "#92400e"};
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
        div { min-width: 0; }
        input[type="range"] {
          min-height: 24px;
          min-width: 24px;
          margin: 0;
          box-sizing: border-box;
        }
        input[type="checkbox"] {
          min-width: 24px;
          min-height: 24px;
          margin: 0;
          cursor: pointer;
        }

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
          overflow: auto;
          overscroll-behavior: contain;
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
          min-height: 24px;
          min-width: 24px;
          font-size: 14px;
          font-weight: 500;
          color: var(--ha-muted);
          white-space: nowrap;
          cursor: pointer;
          transition: color 0.15s, border-color 0.15s;
        }
        .nav-tab:hover {
          color: var(--ha-text);
        }
        .nav-tab.active {
          color: var(--ha-primary-text);
          border-bottom-color: var(--ha-primary-text);
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
          min-height: 28px;
          min-width: 28px;
          flex-shrink: 0;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
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
          min-height: 28px;
          min-width: 28px;
          border-radius: 6px;
          font-size: 13px;
          white-space: nowrap;
          cursor: pointer;
        }
        .btn-text:hover {
          background: var(--ha-subtle);
          color: var(--ha-text);
        }
        .btn-danger-text {
          background: transparent;
          border: none;
          color: var(--ha-danger-text);
          padding: 6px 10px;
          min-height: 28px;
          min-width: 28px;
          border-radius: 6px;
          font-size: 13px;
          white-space: nowrap;
          cursor: pointer;
        }
        .btn-danger-text:hover {
          color: var(--ha-danger-text);
          background: rgba(185, 28, 28, 0.1);
        }
        .btn-sm {
          padding: 5px 10px;
          min-height: 26px;
          min-width: 26px;
          font-size: 12px;
        }

        .input, .select {
          background: var(--ha-card);
          color: var(--ha-text);
          border: 1px solid var(--ha-divider);
          border-radius: 8px;
          padding: 6px 10px;
          min-height: 28px;
          min-width: 28px;
          font-size: 13px;
          width: 100%;
        }
        .input:focus, .select:focus {
          outline: none;
          border-color: var(--ha-primary-text);
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
          gap: 2px;
          margin-top: 8px;
        }
        .seg-btn {
          flex: 1;
          border: none;
          background: transparent;
          color: var(--ha-muted);
          padding: 5px 8px;
          min-height: 26px;
          min-width: 28px;
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
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
          overflow: auto;
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
          background: rgba(3, 105, 161, 0.12);
          border-left: 3px solid var(--ha-primary-text);
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
          background: var(--ha-success-text);
        }
        .status-dot.clearing {
          background: var(--ha-warning-text);
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
          color: var(--ha-success-text);
          font-weight: 500;
        }
        .room-row-status.clearing {
          color: var(--ha-warning-text);
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
          min-width: 24px;
          min-height: 24px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .ha-chip button:hover {
          color: var(--ha-danger-text);
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
          color: #ffffff;
        }

        .editor-tabs-bar {
          display: flex;
          gap: 8px;
          border-bottom: 2px solid var(--ha-divider);
          padding-bottom: 8px;
          margin: 14px 0 16px 0;
          flex-wrap: wrap;
        }
        .editor-tab-btn {
          background: var(--ha-card, #ffffff);
          border: 1px solid var(--ha-divider);
          color: var(--ha-muted);
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease-in-out;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .editor-tab-btn:hover {
          color: var(--ha-text);
          background: var(--ha-subtle);
        }
        .editor-tab-btn.active {
          background: var(--ha-primary);
          border-color: var(--ha-primary);
          color: #ffffff;
          font-weight: 600;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
            id="btn-quick-toggle-guest-mode"
            title="Guest Mode: Pause Negative-Space raycasting, blind-pocket holds, adjacent-room timer clearing, LLM snapshot checks, and per-room Slack transition alerts when guests or multiple untracked occupants are moving around"
            style="border-color:${
              this._overview?.global_settings?.guest_mode_enabled
                ? "var(--ha-warning-text)"
                : "var(--ha-divider)"
            };background:${
              this._overview?.global_settings?.guest_mode_enabled
                ? "rgba(217, 119, 6, 0.14)"
                : "var(--ha-card)"
            };color:${
              this._overview?.global_settings?.guest_mode_enabled
                ? "var(--ha-warning-text)"
                : "var(--ha-muted)"
            };font-weight:600;"
          >
            👥 Guest Mode: ${
              this._overview?.global_settings?.guest_mode_enabled ? "ON" : "OFF"
            }
          </button>
          <button
            class="btn btn-sm"
            id="btn-quick-toggle-neg-space"
            title="Global Master Switch: Toggle Negative-Space Spatial Exclusion in live Bayesian room inference"
            style="border-color:${
              this._overview?.global_settings?.negative_space_enabled !== false &&
              !this._overview?.global_settings?.guest_mode_enabled
                ? "var(--ha-primary-text)"
                : "var(--ha-divider)"
            };background:${
              this._overview?.global_settings?.negative_space_enabled !== false &&
              !this._overview?.global_settings?.guest_mode_enabled
                ? "rgba(3, 105, 161, 0.12)"
                : "var(--ha-card)"
            };color:${
              this._overview?.global_settings?.negative_space_enabled !== false &&
              !this._overview?.global_settings?.guest_mode_enabled
                ? "var(--ha-primary-text)"
                : "var(--ha-muted)"
            };font-weight:600;"
          >
            🎯 Negative-Space: ${
              this._overview?.global_settings?.guest_mode_enabled
                ? "PAUSED"
                : this._overview?.global_settings?.negative_space_enabled !== false
                ? "ON"
                : "OFF"
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
              <div style="display:flex;gap:6px;align-items:center;margin-bottom:8px;">
                <input
                  type="text"
                  class="input"
                  id="room-search-input"
                  placeholder="Search rooms..."
                  value="${this._escape(this._roomSearch)}"
                  style="flex:1;"
                />
                <button
                  class="btn btn-sm"
                  id="btn-add-new-room"
                  title="Create a new room in Home Assistant"
                  style="white-space:nowrap;padding:4px 8px;font-size:12px;font-weight:600;"
                >
                  + Add Room
                </button>
              </div>
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
                  <span class="setting-label" style="font-weight:600;">📱 Use BLE Position as Presence Decider</span>
                  <input type="checkbox" id="gl-ble-decider-enabled" ${
                    this._globalDraft?.ble_decider_enabled ? "checked" : ""
                  } />
                </div>
                <div style="font-size:12px;color:var(--ha-muted);line-height:1.4;">
                  When enabled, Bermuda/proxy phone BLE areas act as active room occupancy triggers, negative-space localizers, and occupant pinning. When disabled (recommended until Google Home speakers and multi-proxy coverage are calibrated), BLE area positions are continuously collected, logged, and graphed for tuning without causing vertical bounce or false floor transitions.
                </div>
              </div>

              <div style="border-top:1px solid var(--ha-divider, #e5e7eb);padding-top:12px;margin-top:4px;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
                  <span class="setting-label" style="font-weight:600;">🛡️ PIR Validation Gate (Corroborated Motion Entry)</span>
                  <input type="checkbox" id="gl-pir-validation-enabled" ${
                    this._globalDraft?.pir_validation_enabled !== false ? "checked" : ""
                  } />
                </div>
                <div style="font-size:12px;color:var(--ha-muted);line-height:1.4;margin-bottom:8px;">
                  Holds raw PIR trips in a short candidate window unless corroborated by an adjacent occupied room, perimeter/interior door, camera/BLE confirmation, or sustained motion (rejecting standalone HVAC/sunlight/pet false triggers).
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
                  <span style="font-size:12px;color:var(--ha-muted);">Default PIR Candidate Window (seconds)</span>
                  <input type="number" min="3" max="120" step="1" class="input" id="gl-pir-candidate-window" style="width:90px;" value="${Number(
                    this._globalDraft?.pir_candidate_window ?? 15
                  )}" />
                </div>
              </div>

              <div style="border-top:1px solid var(--ha-divider, #e5e7eb);padding-top:12px;margin-top:4px;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
                  <span class="setting-label" style="font-weight:600;">👥 Guest Mode (Multi-Occupant / Low-Compute Mode)</span>
                  <input type="checkbox" id="gl-guest-mode-enabled" ${
                    this._globalDraft?.guest_mode_enabled ? "checked" : ""
                  } />
                </div>
                <div style="font-size:12px;color:var(--ha-muted);line-height:1.4;">
                  Pauses Negative-Space raycasting, blind-pocket trajectory conservation, connected-room handoff clearing, LLM camera snapshot checks, and per-room Slack transition notifications so rooms don't constantly fire or clear each other when guests are visiting.
                </div>
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
                <div style="margin-top:10px;">
                  <div class="setting-label" style="margin-bottom:4px;">Alert Verbosity</div>
                  <select class="input" id="gl-slack-verbosity" style="width:100%;height:36px;background:var(--card-background-color,#fff);color:var(--primary-text-color,#111);border:1px solid var(--ha-divider,#ccc);border-radius:4px;padding:0 8px;">
                    <option value="minimal" ${this._globalDraft?.slack_verbosity === "minimal" ? "selected" : ""}>Minimal (1-line badge: 🟢 Room occupied 95% via motion)</option>
                    <option value="compact" ${(!this._globalDraft?.slack_verbosity || this._globalDraft?.slack_verbosity === "compact") ? "selected" : ""}>Compact (2-line summary: State + Driver / Localization)</option>
                    <option value="full" ${this._globalDraft?.slack_verbosity === "full" ? "selected" : ""}>Full Diagnostic (Detailed 8-point card)</option>
                  </select>
                </div>
                <div style="margin-top:12px;display:flex;flex-direction:column;gap:8px;">
                  <label style="display:flex;align-items:flex-start;gap:8px;font-size:13px;cursor:pointer;">
                    <input type="checkbox" id="gl-slack-daily-thread" ${this._globalDraft?.slack_daily_thread !== false ? "checked" : ""} style="margin-top:2px;" />
                    <div>
                      <strong>Daily Presence Thread</strong>
                      <div style="font-size:11px;color:var(--secondary-text-color,#777);margin-top:2px;">Maintain one live status dashboard per day in Slack, threading all room transitions underneath it.</div>
                    </div>
                  </label>
                  <label style="display:flex;align-items:flex-start;gap:8px;font-size:13px;cursor:pointer;">
                    <input type="checkbox" id="gl-include-camera-snapshot" ${this._globalDraft?.include_camera_snapshot ? "checked" : ""} style="margin-top:2px;" />
                    <div>
                      <strong>Detection Capture Review (Camera Snapshots)</strong>
                      <div style="font-size:11px;color:var(--secondary-text-color,#777);margin-top:2px;">Support attaching Frigate detection captures to cards for review of light vs person/pet (defaults to OFF).</div>
                    </div>
                  </label>
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

    this.shadowRoot
      .querySelectorAll(".room-row, .advanced-toggle-bar, .tl-transition-row")
      .forEach((el) => {
        if (!el.getAttribute("role")) {
          el.setAttribute("role", "button");
        }
      });
    this.shadowRoot
      .querySelectorAll("input, select, textarea, button")
      .forEach((el) => {
        if (!el.getAttribute("aria-label") && !el.getAttribute("title")) {
          const fallback =
            el.getAttribute("placeholder") ||
            el.getAttribute("data-key") ||
            el.id ||
            el.tagName.toLowerCase();
          el.setAttribute("aria-label", fallback);
        }
      });

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
    const spEst = selRoom.spatial_estimate || {};
    const occLabel = spEst.occupant_label || "";
    const occType = spEst.occupant_type || "";
    const isPinned = Boolean(spEst.definitive_tracker_pinned);
    const editorTab = this._editorTab || "setup";

    return `
      <!-- 1. Compact Status & Action Header Card -->
      <div class="ha-card" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
        <div style="display:flex;align-items:center;gap:14px;">
          <span class="status-dot ${st.dotClass}" style="width:12px;height:12px;"></span>
          <div>
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
              <h2 style="margin:0;font-size:20px;font-weight:500;">${this._escape(
                cfg.room_name || selRoom.room_name
              )}</h2>
              <span style="font-size:12.5px;font-weight:500;padding:2px 10px;border-radius:999px;background:var(--ha-subtle);border:1px solid var(--ha-divider);color:${
                st.dotClass === "occupied"
                  ? "var(--ha-success-text)"
                  : st.dotClass === "clearing"
                  ? "var(--ha-warning-text)"
                  : "var(--ha-muted)"
              };">
                ${this._escape(st.label)}
              </span>
              ${
                selRoom.verified_by && selRoom.verified_by !== "none"
                  ? `<span style="font-size:11.5px;font-weight:600;padding:2px 8px;border-radius:999px;background:var(--ha-subtle);border:1px solid var(--ha-divider);color:var(--ha-primary-text);" title="Current evidence source verifying occupancy">
                      verified: ${this._escape(selRoom.verified_by)}
                    </span>`
                  : ""
              }
              ${
                selRoom.pir_validation_state &&
                selRoom.pir_validation_state !== "idle" &&
                selRoom.pir_validation_state !== "disabled"
                  ? `<span style="font-size:11.5px;font-weight:600;padding:2px 8px;border-radius:999px;background:${
                      selRoom.pir_validation_state === "suppressed"
                        ? "rgba(245,158,11,0.16)"
                        : selRoom.pir_validation_state === "candidate"
                        ? "rgba(56,189,248,0.16)"
                        : "rgba(16,185,129,0.16)"
                    };border:1px solid var(--ha-divider);color:${
                      selRoom.pir_validation_state === "suppressed"
                        ? "var(--ha-warning-text)"
                        : selRoom.pir_validation_state === "candidate"
                        ? "var(--ha-primary-text)"
                        : "var(--ha-success-text)"
                    };" title="PIR Validation Gate state">
                      PIR Gate: ${this._escape(selRoom.pir_validation_state)}
                    </span>`
                  : ""
              }
              ${
                occLabel
                  ? `<span style="font-size:12px;font-weight:600;padding:2px 10px;border-radius:999px;background:${
                      occType === "pet"
                        ? "var(--ha-accent-amber-bg)"
                        : isPinned
                        ? "var(--ha-accent-cyan-bg)"
                        : "var(--ha-accent-purple-bg)"
                    };border:1px solid ${
                      occType === "pet"
                        ? "var(--ha-accent-amber-border)"
                        : isPinned
                        ? "var(--ha-accent-cyan-border)"
                        : "var(--ha-accent-purple-border)"
                    };color:${
                      occType === "pet"
                        ? "var(--ha-accent-amber-text)"
                        : isPinned
                        ? "var(--ha-accent-cyan-text)"
                        : "var(--ha-accent-purple-text)"
                    };" title="${
                      occType === "pet"
                        ? "Pet-only motion detected — PIR triggers suppressed"
                        : isPinned
                        ? "Definitive tracker pinned in room — protected from adjacent handoff clearing"
                        : "Inferred occupant attribution"
                    }">
                      ${occType === "pet" ? "🐕 " : isPinned ? "📌👤 " : occType === "untracked_human" ? "👧 " : "👤 "}${this._escape(occLabel)}
                    </span>`
                  : ""
              }
              ${
                this._dirty
                  ? `<span style="font-size:12px;color:var(--ha-warning-text);font-weight:500;">• Unsaved changes</span>`
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

      <!-- 2. Editor Navigation Tabs -->
      <div class="editor-tabs-bar">
        <button class="editor-tab-btn ${editorTab === "setup" ? "active" : ""}" data-editor-tab="setup">
          ⚙️ Quick Setup
        </button>
        <button class="editor-tab-btn ${editorTab === "rules" ? "active" : ""}" data-editor-tab="rules">
          ⚡ Sensors &amp; Rules
        </button>
        <button class="editor-tab-btn ${editorTab === "state_machine" ? "active" : ""}" data-editor-tab="state_machine">
          🔀 State Machine
        </button>
        <button class="editor-tab-btn ${editorTab === "diagnostics" ? "active" : ""}" data-editor-tab="diagnostics">
          🔬 Advanced &amp; Diagnostics
        </button>
      </div>

      <!-- 3. Tab Contents -->
      ${
        editorTab === "setup"
          ? `
        <!-- Card: Room Identity & Area Assignment -->
        <div class="ha-card">
          <div class="card-head">
            <div>
              <h3 class="card-title">Room Identity &amp; Area Assignment</h3>
              <div class="card-desc">
                Assign this room to a Home Assistant physical area and configure clear timeouts.
              </div>
            </div>
          </div>

          <div class="list-divider">
            <div class="setting-row">
              <div>
                <div class="setting-label">Home Assistant Area</div>
                <div class="setting-help">
                  Link this room to a physical area to align entity discovery, device placement, and automations.
                </div>
              </div>
              <div style="min-width:220px;">
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
            </div>

            <div class="setting-row">
              <div>
                <div class="setting-label">Clear after inactivity</div>
                <div class="setting-help">How long to wait after all sensors stop seeing activity before clearing occupancy (${timeoutMinText}).</div>
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

            <div class="setting-row">
              <div>
                <div class="setting-label">Bounded max hold timeout</div>
                <div class="setting-help">Maximum time <code>occupied_holding</code> can remain active on secondary signals (Bayesian/condition/blind-pocket) before cooling down (${this._formatDuration(Number(cfg.max_hold_timeout ?? selRoom.max_hold_timeout ?? 1800))}).</div>
              </div>
              <div style="display:flex;align-items:center;gap:8px;width:150px;">
                <input
                  type="number"
                  class="input"
                  id="cfg-max-hold-timeout"
                  min="60"
                  max="14400"
                  step="60"
                  value="${Number(cfg.max_hold_timeout ?? selRoom.max_hold_timeout ?? 1800)}"
                />
                <span style="font-size:13px;color:var(--ha-muted);">sec</span>
              </div>
            </div>

            <div class="setting-row">
              <div>
                <div class="setting-label">PIR validation gate (corroboration)</div>
                <div class="setting-help">Require transient PIR motion to be corroborated within the candidate window (camera, adjacent room, door, BLE, or second pulse) before confirming occupancy.</div>
              </div>
              <div style="display:flex;align-items:center;gap:12px;">
                <label style="display:flex;align-items:center;gap:6px;font-size:12.5px;cursor:pointer;">
                  <input
                    type="checkbox"
                    id="cfg-pir-validation-enabled"
                    ${cfg.pir_validation_enabled !== false ? "checked" : ""}
                  />
                  <span>Enabled</span>
                </label>
                <div style="display:flex;align-items:center;gap:6px;width:110px;">
                  <input
                    type="number"
                    class="input"
                    id="cfg-pir-candidate-window"
                    min="3"
                    max="120"
                    step="1"
                    value="${Number(cfg.pir_candidate_window ?? selRoom.pir_candidate_window ?? 15)}"
                    ${cfg.pir_validation_enabled === false ? "disabled" : ""}
                  />
                  <span style="font-size:12.5px;color:var(--ha-muted);">s</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Card: Room Connections & Boundaries -->
        <div class="ha-card">
          <div class="card-head">
            <div>
              <h3 class="card-title">Room Connections &amp; Boundaries</h3>
              <div class="card-desc">
                Configure adjacent room hand-offs and door boundary latches to eliminate false clearing.
              </div>
            </div>
          </div>

          <div class="list-divider">
            <!-- Adjacent Rooms Hand-Off -->
            <div class="setting-row" style="align-items:flex-start;flex-direction:column;">
              <div style="width:100%;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
                <div>
                  <div class="setting-label">Connected adjacent rooms</div>
                  <div class="setting-help">
                    If this room is counting down and motion is detected in a connected room, clear this room immediately.
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
                  <div class="setting-label">Bounded room perimeter (door contact sensors)</div>
                  <div class="setting-help">
                    Track door contact sensors for room boundary topology and corridor validation. Occupancy always uses bounded cooling timeouts rather than indefinite latching.
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
                        ? `<span style="font-size:12.5px;color:var(--ha-warning);">Add at least one door contact sensor below so the room can latch when closed.</span>`
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
      `
          : editorTab === "rules"
          ? `
        <!-- Card 1: Presence & Motion Sensors -->
        <div class="ha-card">
          <div class="card-head">
            <div>
              <h3 class="card-title">Presence &amp; Motion Sensors</h3>
              <div class="card-desc">
                Choose which sensors detect people in this room and assign whether they trigger alone or require corroboration.
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
                      const weightInfo = this._sensorWeightMap(selRoom, prev)[obs.entity_id] || {};
                      const isHuman = this._isHumanExclusiveCandidate(obs.entity_id, {
                        [obs.entity_id]: weightInfo,
                      });
                      const cooldownSec = Number(obs.cooldown_sec ?? weightInfo.cooldown_sec ?? 0);
                      const pirReq = Boolean(weightInfo.requires_pir_validation);
                      return `
                      <div class="sensor-row" data-obs-idx="${idx}">
                        <div class="sensor-info">
                          <span class="status-dot ${isAct ? "occupied" : "clear"}" title="${
                        isAct ? "Currently active" : "Clear"
                      }"></span>
                          <div style="min-width:0;">
                            <div class="sensor-title" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                              <span>${this._escape(friendlyName)}</span>
                              <span style="padding:1px 7px;border-radius:999px;font-size:10.5px;font-weight:600;background:${
                                isHuman ? "rgba(16,185,129,0.14)" : "rgba(148,163,184,0.16)"
                              };color:${
                        isHuman ? "var(--ha-success-text)" : "var(--ha-muted)"
                      };">${isHuman ? "Person-coupled" : "Supporting only"}</span>
                              ${
                                cooldownSec > 0
                                  ? `<span style="padding:1px 6px;border-radius:999px;font-size:10.5px;background:var(--ha-subtle);border:1px solid var(--ha-divider);color:var(--ha-muted);">${cooldownSec}s cooldown</span>`
                                  : ""
                              }
                              ${
                                pirReq
                                  ? `<span style="padding:1px 6px;border-radius:999px;font-size:10.5px;background:var(--ha-accent-amber-bg);color:var(--ha-accent-amber-text);">PIR Gate</span>`
                                  : ""
                              }
                            </div>
                            <div class="sensor-sub">${this._escape(obs.entity_id)}${
                        obs.state && obs.state !== "on" ? ` = ${this._escape(obs.state)}` : ""
                      }</div>
                          </div>
                        </div>

                        <div>
                          <select class="select obs-role-simple" data-idx="${idx}">
                            ${
                              isHuman
                                ? `<option value="primary" ${
                                    roleGroup === "primary" ? "selected" : ""
                                  }>Main human sensor (high confidence / trigger)</option>
                                   <option value="shared" ${
                                     roleGroup === "shared" ? "selected" : ""
                                   }>Corroborated sensor (moderate weight)</option>`
                                : ""
                            }
                            <option value="keepalive" ${
                              roleGroup === "keepalive" || !isHuman ? "selected" : ""
                            }>Supporting hold only (scores/holds once occupied)</option>
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
              <option value="primary">Main human sensor (high confidence / trigger)</option>
              <option value="shared" selected>Corroborated sensor (moderate weight)</option>
              <option value="keepalive">Supporting hold only (scores/holds once occupied)</option>
            </select>
            <button class="btn" id="btn-simple-add-obs">+ Add Sensor</button>
          </div>
        </div>

        <!-- Card 2: Keep Occupied While Active (TV, Media, Appliances) -->
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

        <!-- Card 3: Slack Presence Notifications -->
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

            <div class="setting-row" style="opacity:${cfg.notify_slack ? "1" : "0.5"};pointer-events:${cfg.notify_slack ? "auto" : "none"};">
              <div>
                <div class="setting-label">Attach Camera Snapshot for Detection Review</div>
                <div class="setting-help">Attach Frigate detection capture to alert card to audit light vs human/pet (defaults to OFF).</div>
              </div>
              <div>
                <input type="checkbox" id="cfg-include-camera-snapshot" ${cfg.include_camera_snapshot ? "checked" : ""} style="width:16px;height:16px;" />
              </div>
            </div>
          </div>
        </div>
      `
          : editorTab === "state_machine"
          ? this._renderStateMachinePane(selRoom)
          : this._renderAdvancedDrawer(selRoom, cfg, prev, areas, presets, activeMap)
      }
    `;
  }

  async _refreshStateGraph(entryId) {
    if (!entryId) return;
    try {
      const res = await this._apiCall("GET", `/api/presence_detection_designer/state_graph?entry_id=${encodeURIComponent(entryId)}`);
      const fresh = (res && res.rooms && res.rooms[0]) || null;
      if (fresh && this._overview && Array.isArray(this._overview.rooms)) {
        const idx = this._overview.rooms.findIndex((r) => r.entry_id === entryId);
        if (idx !== -1) {
          this._overview.rooms[idx] = { ...this._overview.rooms[idx], ...fresh };
        }
        this.render();
      }
    } catch (err) {
      this.showToast(`Failed to refresh state graph: ${err.message}`, "error");
    }
  }

  _renderStateMachinePane(selRoom) {
    const state = String(selRoom.occupancy_state || "vacant");
    const history = Array.isArray(selRoom.transition_history) ? selRoom.transition_history : [];
    const reversedHistory = [...history].reverse();
    const lastAccepted = reversedHistory.find((h) => h.accepted) || null;
    const lastAttempt = reversedHistory[0] || null;
    const coolingSec = Number(selRoom.cooling_remaining_sec || 0);
    const verifiedBy = selRoom.verified_by || "none";
    const reason = selRoom.state_reason || selRoom.last_transition_reason || "Initialized vacant";
    const mermaidSrc = selRoom.mermaid_diagram || "";
    const pirState = String(selRoom.pir_validation_state || "idle");
    const pirSource = selRoom.pir_corroboration_source || "none";
    const pirDetail = selRoom.pir_corroboration_detail || "Awaiting PIR / corroboration";
    const pirRemain = Number(selRoom.pir_candidate_remaining_sec || 0);
    const pirMermaid = selRoom.pir_mermaid_diagram || "";
    const pirHistory = Array.isArray(selRoom.pir_transition_history) ? [...selRoom.pir_transition_history].reverse() : [];
    const sensorWeights = Array.isArray(selRoom.sensor_weights) ? selRoom.sensor_weights : [];

    const nodeStyle = (id) => {
      const active = state === id;
      if (active) {
        if (id === "vacant") {
          return { fill: "rgba(148,163,184,0.22)", stroke: "#94a3b8", text: "#f1f5f9", width: 2.5 };
        }
        if (id === "override") {
          return { fill: "rgba(168,85,247,0.25)", stroke: "#c084fc", text: "#f3e8ff", width: 2.5 };
        }
        if (id === "occupied_cooling" || id === "occupied_verifying") {
          return { fill: "rgba(245,158,11,0.25)", stroke: "#fbbf24", text: "#fef3c7", width: 2.5 };
        }
        return { fill: "rgba(16,185,129,0.25)", stroke: "#34d399", text: "#d1fae5", width: 2.5 };
      }
      return { fill: "rgba(15,23,42,0.7)", stroke: "rgba(148,163,184,0.35)", text: "#94a3b8", width: 1.2 };
    };

    const edgeColor = (src, dst) => {
      if (lastAccepted && lastAccepted.source === src && lastAccepted.dest === dst) {
        return "#22d3ee";
      }
      return "rgba(148,163,184,0.4)";
    };
    const edgeWidth = (src, dst) =>
      lastAccepted && lastAccepted.source === src && lastAccepted.dest === dst ? "2.8" : "1.4";

    const nodes = [
      { id: "vacant", label: "vacant", sub: "is_present=false", x: 35, y: 125, w: 145, h: 64 },
      { id: "occupied_confirmed", label: "occupied_confirmed", sub: "Human active", x: 255, y: 55, w: 185, h: 60 },
      { id: "occupied_holding", label: "occupied_holding", sub: "Bounded hold", x: 495, y: 55, w: 175, h: 60 },
      { id: "occupied_cooling", label: "occupied_cooling", sub: coolingSec > 0 ? `Cooling (${coolingSec}s)` : "Countdown", x: 255, y: 195, w: 185, h: 60 },
      { id: "occupied_verifying", label: "occupied_verifying", sub: "Vision / LLM", x: 495, y: 195, w: 175, h: 60 },
      { id: "override", label: "override", sub: "Manual lock", x: 35, y: 270, w: 145, h: 56 },
    ];

    const edges = [
      { s: "vacant", d: "occupied_confirmed", x1: 180, y1: 142, x2: 255, y2: 92, lx: 196, ly: 105, lbl: "evidence_detected" },
      { s: "occupied_confirmed", d: "occupied_holding", x1: 440, y1: 75, x2: 495, y2: 75, lx: 468, ly: 66, lbl: "hold_only" },
      { s: "occupied_holding", d: "occupied_confirmed", x1: 495, y1: 98, x2: 440, y2: 98, lx: 468, ly: 112, lbl: "resumed" },
      { s: "occupied_confirmed", d: "occupied_cooling", x1: 347, y1: 115, x2: 347, y2: 195, lx: 354, ly: 158, lbl: "evidence_cleared" },
      { s: "occupied_holding", d: "occupied_cooling", x1: 540, y1: 115, x2: 425, y2: 195, lx: 495, ly: 158, lbl: "hold_cleared/timeout" },
      { s: "occupied_cooling", d: "occupied_verifying", x1: 440, y1: 215, x2: 495, y2: 215, lx: 468, ly: 206, lbl: "llm_enabled" },
      { s: "occupied_verifying", d: "occupied_cooling", x1: 495, y1: 240, x2: 440, y2: 240, lx: 468, ly: 254, lbl: "person_detected" },
      { s: "occupied_cooling", d: "vacant", x1: 255, y1: 215, x2: 180, y2: 170, lx: 194, ly: 208, lbl: "expired / handoff" },
      { s: "vacant", d: "override", x1: 108, y1: 189, x2: 108, y2: 270, lx: 114, ly: 234, lbl: "override" },
    ];

    return `
      <div class="ha-card">
        <div class="card-head">
          <div>
            <h3 class="card-title">Live Transitions State Diagram</h3>
            <div class="card-desc">Fixed <code>transitions.extensions.HierarchicalGraphMachine</code> runtime topology and last fired transition.</div>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-sm" id="btn-refresh-state-graph">Refresh Graph</button>
            <button class="btn btn-sm" id="btn-copy-mermaid">Copy Mermaid</button>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-bottom:14px;">
          <div style="padding:10px 12px;border-radius:10px;background:var(--ha-subtle);border:1px solid var(--ha-divider);">
            <div style="font-size:11px;color:var(--ha-muted);text-transform:uppercase;">Active State</div>
            <div style="font-size:14px;font-weight:600;margin-top:2px;"><code>${this._escape(state)}</code></div>
          </div>
          <div style="padding:10px 12px;border-radius:10px;background:var(--ha-subtle);border:1px solid var(--ha-divider);">
            <div style="font-size:11px;color:var(--ha-muted);text-transform:uppercase;">Verified By</div>
            <div style="font-size:14px;font-weight:600;margin-top:2px;"><code>${this._escape(verifiedBy)}</code></div>
          </div>
          <div style="padding:10px 12px;border-radius:10px;background:var(--ha-subtle);border:1px solid var(--ha-divider);">
            <div style="font-size:11px;color:var(--ha-muted);text-transform:uppercase;">Cooling Countdown</div>
            <div style="font-size:14px;font-weight:600;margin-top:2px;">${coolingSec > 0 ? `${coolingSec}s` : "Inactive"}</div>
          </div>
          <div style="padding:10px 12px;border-radius:10px;background:var(--ha-subtle);border:1px solid var(--ha-divider);">
            <div style="font-size:11px;color:var(--ha-muted);text-transform:uppercase;">Last Reason</div>
            <div style="font-size:12.5px;font-weight:500;margin-top:2px;">${this._escape(reason)}</div>
          </div>
        </div>

        ${
          lastAccepted
            ? `<div style="margin-bottom:12px;padding:8px 12px;border-radius:8px;background:rgba(34,211,238,0.1);border:1px solid rgba(34,211,238,0.35);font-size:12.5px;">
                <strong>Last Fired:</strong> <code>${this._escape(lastAccepted.trigger)}</code>
                (<code>${this._escape(lastAccepted.source)}</code> &rarr; <code>${this._escape(lastAccepted.dest)}</code>)
                — ${this._escape(lastAccepted.reason || "")}
              </div>`
            : ""
        }
        ${
          lastAttempt && !lastAttempt.accepted
            ? `<div style="margin-bottom:12px;padding:8px 12px;border-radius:8px;background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.35);font-size:12.5px;">
                <strong>Guard Blocked:</strong> <code>${this._escape(lastAttempt.trigger)}</code> in <code>${this._escape(lastAttempt.source)}</code>
                — ${this._escape(lastAttempt.reason || "")}
              </div>`
            : ""
        }

        <div style="width:100%;overflow-x:auto;background:rgba(15,23,42,0.92);border:1px solid var(--ha-divider);border-radius:12px;padding:10px;">
          <svg viewBox="0 0 710 345" style="width:100%;max-width:760px;height:auto;display:block;margin:0 auto;">
            <defs>
              <marker id="sm-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="rgba(148,163,184,0.75)"></path>
              </marker>
              <marker id="sm-arrow-active" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#22d3ee"></path>
              </marker>
            </defs>
            <rect x="235" y="20" width="455" height="270" rx="14" fill="rgba(16,185,129,0.04)" stroke="rgba(16,185,129,0.28)" stroke-dasharray="5,4" stroke-width="1.2"></rect>
            <text x="250" y="39" fill="#6ee7b7" font-size="11" font-weight="600">occupied (hierarchical super-state)</text>
            ${edges
              .map((e) => {
                const isHot = lastAccepted && lastAccepted.source === e.s && lastAccepted.dest === e.d;
                return `
                  <line x1="${e.x1}" y1="${e.y1}" x2="${e.x2}" y2="${e.y2}"
                        stroke="${edgeColor(e.s, e.d)}" stroke-width="${edgeWidth(e.s, e.d)}"
                        marker-end="url(#${isHot ? "sm-arrow-active" : "sm-arrow"})" />
                  <text x="${e.lx}" y="${e.ly}" fill="${isHot ? "#22d3ee" : "#94a3b8"}"
                        font-size="9.5" text-anchor="middle">${this._escape(e.lbl)}</text>
                `;
              })
              .join("")}
            ${nodes
              .map((n) => {
                const st = nodeStyle(n.id);
                const isActive = state === n.id;
                return `
                  <g>
                    <rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="10"
                          fill="${st.fill}" stroke="${st.stroke}" stroke-width="${st.width}"></rect>
                    <text x="${n.x + n.w / 2}" y="${n.y + 24}" fill="${st.text}"
                          font-size="12" font-weight="600" text-anchor="middle">${this._escape(n.label)}</text>
                    <text x="${n.x + n.w / 2}" y="${n.y + 43}" fill="${isActive ? st.text : "#94a3b8"}"
                          font-size="10.5" text-anchor="middle">${this._escape(isActive ? `ACTIVE • ${n.sub}` : n.sub)}</text>
                  </g>
                `;
              })
              .join("")}
          </svg>
        </div>
      </div>

      <div class="ha-card">
        <div class="card-head">
          <div>
            <h3 class="card-title">Transition &amp; Guard Audit Log (${reversedHistory.length})</h3>
            <div class="card-desc">Bounded chronological ring buffer of accepted transitions and guard-blocked trigger attempts.</div>
          </div>
        </div>
        ${
          reversedHistory.length === 0
            ? `<div style="font-size:13px;color:var(--ha-muted);">No transition events recorded yet.</div>`
            : `<div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;font-size:12.5px;">
                  <thead>
                    <tr style="border-bottom:1px solid var(--ha-divider);text-align:left;color:var(--ha-muted);">
                      <th style="padding:8px 6px;">Status</th>
                      <th style="padding:8px 6px;">Trigger</th>
                      <th style="padding:8px 6px;">Transition</th>
                      <th style="padding:8px 6px;">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${reversedHistory
                      .slice(0, 20)
                      .map((ev) => {
                        const badgeBg = ev.accepted ? "rgba(16,185,129,0.16)" : "rgba(245,158,11,0.18)";
                        const badgeFg = ev.accepted ? "#34d399" : "#fbbf24";
                        return `
                          <tr style="border-bottom:1px solid var(--ha-divider);">
                            <td style="padding:8px 6px;">
                              <span style="padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;background:${badgeBg};color:${badgeFg};">
                                ${ev.accepted ? "ACCEPTED" : "BLOCKED"}
                              </span>
                            </td>
                            <td style="padding:8px 6px;"><code>${this._escape(ev.trigger || "")}</code></td>
                            <td style="padding:8px 6px;"><code>${this._escape(ev.source || "")}</code> &rarr; <code>${this._escape(ev.dest || "")}</code></td>
                            <td style="padding:8px 6px;color:var(--ha-muted);">${this._escape(ev.reason || "")}</td>
                          </tr>
                        `;
                      })
                      .join("")}
                  </tbody>
                </table>
              </div>`
        }
        <details style="margin-top:14px;">
          <summary style="cursor:pointer;font-size:12.5px;color:var(--ha-muted);">Raw Live Mermaid Definition (from Python transitions)</summary>
          <textarea class="code-area" readonly style="margin-top:8px;min-height:140px;">${this._escape(mermaidSrc)}</textarea>
        </details>
      </div>

      <div class="ha-card">
        <div class="card-head">
          <div>
            <h3 class="card-title">PIR Validation Gate &amp; Cooldown Reliability</h3>
            <div class="card-desc">Separate <code>transitions.extensions.GraphMachine</code> gate (<code>${Number(selRoom.pir_candidate_window ?? selRoom.config?.pir_candidate_window ?? 15)}s</code> candidate window, any-one-of corroboration: Camera / Trajectory / BLE / Time-History).</div>
          </div>
          <span style="font-size:12px;font-weight:600;padding:3px 10px;border-radius:999px;background:var(--ha-subtle);border:1px solid var(--ha-divider);">PIR: <code>${this._escape(pirState)}</code></span>
        </div>
        <div style="width:100%;overflow-x:auto;background:rgba(15,23,42,0.92);border:1px solid var(--ha-divider);border-radius:12px;padding:10px;margin-bottom:12px;">
          <svg viewBox="0 0 680 120" style="width:100%;max-width:740px;height:auto;display:block;margin:0 auto;">
            ${[
              { id: "idle", label: "idle", sub: "No PIR pulse", x: 18, y: 32, w: 120, h: 52 },
              { id: "candidate", label: "candidate", sub: pirRemain > 0 ? `Window (${pirRemain}s)` : "Hold window", x: 205, y: 32, w: 140, h: 52 },
              { id: "corroborated", label: "corroborated", sub: "Promotes room", x: 420, y: 10, w: 145, h: 46 },
              { id: "suppressed", label: "suppressed", sub: "False pulse blocked", x: 420, y: 66, w: 145, h: 46 },
            ]
              .map((n) => {
                const active = pirState === n.id;
                const col =
                  active && n.id === "corroborated"
                    ? { fill: "rgba(16,185,129,0.24)", stroke: "#34d399", text: "#d1fae5" }
                    : active && n.id === "suppressed"
                    ? { fill: "rgba(245,158,11,0.24)", stroke: "#fbbf24", text: "#fef3c7" }
                    : active && n.id === "candidate"
                    ? { fill: "rgba(56,189,248,0.24)", stroke: "#38bdf8", text: "#e0f2fe" }
                    : active
                    ? { fill: "rgba(148,163,184,0.22)", stroke: "#94a3b8", text: "#f1f5f9" }
                    : { fill: "rgba(15,23,42,0.7)", stroke: "rgba(148,163,184,0.35)", text: "#94a3b8" };
                return `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="10" fill="${col.fill}" stroke="${col.stroke}" stroke-width="${active ? 2.4 : 1.2}"></rect>
                  <text x="${n.x + n.w / 2}" y="${n.y + 21}" fill="${col.text}" font-size="11.5" font-weight="700" text-anchor="middle">${this._escape(n.label)}</text>
                  <text x="${n.x + n.w / 2}" y="${n.y + 37}" fill="#94a3b8" font-size="9.5" text-anchor="middle">${this._escape(n.sub)}</text>`;
              })
              .join("")}
            <line x1="138" y1="58" x2="205" y2="58" stroke="rgba(148,163,184,0.55)" stroke-width="1.5" marker-end="url(#sm-arrow)" />
            <text x="171" y="50" fill="#94a3b8" font-size="9" text-anchor="middle">pir_tripped</text>
            <line x1="345" y1="48" x2="420" y2="34" stroke="rgba(52,211,153,0.65)" stroke-width="1.5" marker-end="url(#sm-arrow)" />
            <text x="382" y="33" fill="#6ee7b7" font-size="9" text-anchor="middle">corroborated</text>
            <line x1="345" y1="68" x2="420" y2="88" stroke="rgba(251,191,36,0.65)" stroke-width="1.5" marker-end="url(#sm-arrow)" />
            <text x="382" y="92" fill="#fcd34d" font-size="9" text-anchor="middle">window_expired</text>
          </svg>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-bottom:14px;">
          <div style="padding:10px 12px;border-radius:10px;background:var(--ha-subtle);border:1px solid var(--ha-divider);">
            <div style="font-size:11px;color:var(--ha-muted);text-transform:uppercase;">PIR Gate State</div>
            <div style="font-size:14px;font-weight:600;margin-top:2px;"><code>${this._escape(pirState)}</code></div>
          </div>
          <div style="padding:10px 12px;border-radius:10px;background:var(--ha-subtle);border:1px solid var(--ha-divider);">
            <div style="font-size:11px;color:var(--ha-muted);text-transform:uppercase;">Corroborator</div>
            <div style="font-size:14px;font-weight:600;margin-top:2px;"><code>${this._escape(pirSource)}</code></div>
          </div>
          <div style="padding:10px 12px;border-radius:10px;background:var(--ha-subtle);border:1px solid var(--ha-divider);">
            <div style="font-size:11px;color:var(--ha-muted);text-transform:uppercase;">Candidate Window</div>
            <div style="font-size:14px;font-weight:600;margin-top:2px;">${pirRemain > 0 ? `${pirRemain}s` : "Inactive"}</div>
          </div>
          <div style="padding:10px 12px;border-radius:10px;background:var(--ha-subtle);border:1px solid var(--ha-divider);">
            <div style="font-size:11px;color:var(--ha-muted);text-transform:uppercase;">Detail</div>
            <div style="font-size:12.5px;font-weight:500;margin-top:2px;">${this._escape(pirDetail)}</div>
          </div>
        </div>
        ${
          sensorWeights.length > 0
            ? `<div style="overflow-x:auto;margin-bottom:12px;">
                <table style="width:100%;border-collapse:collapse;font-size:12.5px;">
                  <thead>
                    <tr style="border-bottom:1px solid var(--ha-divider);text-align:left;color:var(--ha-muted);">
                      <th style="padding:6px;">Sensor</th>
                      <th style="padding:6px;">Category</th>
                      <th style="padding:6px;">Cooldown</th>
                      <th style="padding:6px;">Weight</th>
                      <th style="padding:6px;">Signal</th>
                      <th style="padding:6px;">PIR Gate</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${sensorWeights
                      .map(
                        (sw) => `
                          <tr style="border-bottom:1px solid var(--ha-divider);">
                            <td style="padding:6px;"><code>${this._escape(sw.entity_id || "")}</code></td>
                            <td style="padding:6px;">${this._escape(sw.category || "")}</td>
                            <td style="padding:6px;">${Number(sw.cooldown_sec || 0)}s</td>
                            <td style="padding:6px;">${Number(sw.reliability_weight ?? 1).toFixed(2)}</td>
                            <td style="padding:6px;"><span style="padding:2px 6px;border-radius:999px;font-size:11px;font-weight:600;background:${sw.human_exclusive !== false ? "rgba(16,185,129,0.16)" : "rgba(148,163,184,0.18)"};color:${sw.human_exclusive !== false ? "var(--ha-success-text)" : "var(--ha-muted)"};">${sw.human_exclusive !== false ? "Person" : "Supporting"}</span></td>
                            <td style="padding:6px;">${sw.requires_pir_validation ? "Required" : "Bypass"}</td>
                          </tr>
                        `
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>`
            : ""
        }
        ${
          pirHistory.length > 0
            ? `<div style="font-size:12px;color:var(--ha-muted);margin-bottom:8px;">Recent PIR Gate Events: ${pirHistory
                .slice(0, 5)
                .map((h) => `<code>${this._escape(h.trigger || "")}</code> (${this._escape(h.source || "")}&rarr;${this._escape(h.dest || "")})`)
                .join(" · ")}</div>`
            : ""
        }
        ${
          pirMermaid
            ? `<details>
                <summary style="cursor:pointer;font-size:12.5px;color:var(--ha-muted);">Raw PIR Validation Mermaid Definition</summary>
                <textarea class="code-area" readonly style="margin-top:8px;min-height:110px;">${this._escape(pirMermaid)}</textarea>
              </details>`
            : ""
        }
      </div>
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
            this._advTab === "automations" ? "active" : ""
          }" data-adv-tab="automations">Automations &amp; Blueprints</button>
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

          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:8px;flex-wrap:wrap;">
            <div>
              <div class="setting-label">Detailed Sensor Probabilities — Current Score: ${livePct}%</div>
              <div style="font-size:12px;color:var(--ha-muted);">Bayesians score confidence and hold existing occupancy (BAYES-01); camera &amp; PIR off remain neutral (BAYES-04).</div>
            </div>
            <div style="display:flex;gap:8px;">
              <button class="btn btn-sm" id="btn-add-ble">+ Add Household BLE</button>
              <button class="btn btn-sm" id="btn-sync-triggers">Sync Human Triggers</button>
            </div>
          </div>

          <div style="overflow:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:12.5px;">
              <thead>
                <tr style="border-bottom:1px solid var(--ha-divider);text-align:left;color:var(--ha-muted);">
                  <th style="padding:8px 6px;">Entity ID &amp; Label</th>
                  <th style="padding:8px 6px;">Signal / Tempering</th>
                  <th style="padding:8px 6px;">Preset</th>
                  <th style="padding:8px 6px;">P(E|Occ)</th>
                  <th style="padding:8px 6px;">P(E|Vac)</th>
                  <th style="padding:8px 6px;">Operator &amp; State</th>
                  <th style="padding:8px 6px;"></th>
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
                    const wMeta = this._sensorWeightMap(selRoom, prev)[obs.entity_id] || {};
                    const isHuman = this._isHumanExclusiveCandidate(obs.entity_id, {
                      [obs.entity_id]: wMeta,
                    });
                    const cdSec = Number(obs.cooldown_sec ?? wMeta.cooldown_sec ?? 0);
                    const tempered = Boolean(obs.cooldown_weighted || obs.signal_weighted);
                    const badLift = pTrue <= pFalse || (presetVal === "supporting" && pTrue < 0.5);
                    const inactItem = (prev.inactive_observations || []).find(
                      (i) => i.entity_id === obs.entity_id
                    );
                    const lrOff = inactItem ? Number(inactItem.likelihood_ratio ?? 1.0) : 1.0;
                    const offText =
                      lrOff < 0.99 ? `Off LR ${lrOff.toFixed(2)} (Confirmed BLE)` : "Off: Neutral";
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
                      <td style="padding:8px 6px;min-width:155px;font-size:11.5px;">
                        <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:3px;">
                          <span style="padding:1px 6px;border-radius:999px;font-weight:600;background:${
                            isHuman ? "rgba(16,185,129,0.14)" : "rgba(148,163,184,0.16)"
                          };color:${
                      isHuman ? "var(--ha-success-text)" : "var(--ha-muted)"
                    };">${isHuman ? "Person" : "Supporting"}</span>
                          ${
                            cdSec > 0
                              ? `<span style="padding:1px 6px;border-radius:999px;background:var(--ha-subtle);border:1px solid var(--ha-divider);">${cdSec}s</span>`
                              : ""
                          }
                          ${
                            tempered
                              ? `<span style="padding:1px 6px;border-radius:999px;background:var(--ha-accent-cyan-bg);color:var(--ha-accent-cyan-text);" title="Single-pass tempered">1x weighted</span>`
                              : ""
                          }
                        </div>
                        <div style="color:${
                          badLift
                            ? "var(--ha-danger-text)"
                            : lrOff < 0.99
                            ? "var(--ha-warning-text)"
                            : "var(--ha-muted)"
                        };">${
                      badLift ? "⚠ Fix weights (P(E|Occ) > P(E|Vac))" : offText
                    }</div>
                      </td>
                      <td style="padding:8px 6px;width:125px;">
                        <select class="select obs-preset" data-idx="${idx}">
                          ${["decisive", "strong", "moderate", "supporting", "weak_hint", "custom"]
                            .map(
                              (p) =>
                                `<option value="${p}" ${presetVal === p ? "selected" : ""}>${p}</option>`
                            )
                            .join("")}
                        </select>
                      </td>
                      <td style="padding:8px 6px;width:85px;">
                        <input type="number" step="0.01" min="0.01" max="0.99" class="input obs-prob" data-idx="${idx}" data-key="prob_given_true" value="${pTrue.toFixed(
                      2
                    )}" />
                      </td>
                      <td style="padding:8px 6px;width:85px;">
                        <input type="number" step="0.01" min="0.01" max="0.99" class="input obs-prob" data-idx="${idx}" data-key="prob_given_false" value="${pFalse.toFixed(
                      2
                    )}" />
                      </td>
                      <td style="padding:8px 6px;width:185px;">
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
                      <td style="padding:8px 6px;text-align:right;">
                        <button class="btn-danger-text obs-del" data-idx="${idx}" title="Remove observation">×</button>
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
              <div class="setting-label" style="margin-bottom:8px;">Solo sensors crossing score/hold threshold (&ge; ${threshPct}%)</div>
              <div style="font-size:11.5px;color:var(--ha-muted);margin-bottom:6px;">Scores confidence and holds existing occupancy; never starts occupancy from vacant (BAYES-01).</div>
              ${
                (comb.solo_triggers || []).length === 0
                  ? `<div style="font-size:13px;color:var(--ha-muted);">None — at least 2 sensors must agree to hold.</div>`
                  : (comb.solo_triggers || [])
                      .map(
                        (s) => `
                      <div style="display:flex;justify-content:space-between;padding:8px 10px;background:var(--ha-subtle);border:1px solid var(--ha-divider);border-radius:8px;margin-bottom:6px;font-size:13px;">
                        <span>${this._escape(s.label)}</span>
                        <strong style="color:var(--ha-success-text);">${s.posterior_pct}%</strong>
                      </div>`
                      )
                      .join("")
              }
            </div>
            <div>
              <div class="setting-label" style="margin-bottom:8px;">2-sensor combinations crossing hold threshold (&ge; ${threshPct}%)</div>
              ${
                (comb.pair_triggers || []).length === 0
                  ? `<div style="font-size:13px;color:var(--ha-muted);">No 2-sensor combinations cross threshold.</div>`
                  : (comb.pair_triggers || [])
                      .slice(0, 8)
                      .map(
                        (p) => `
                      <div style="display:flex;justify-content:space-between;padding:8px 10px;background:var(--ha-subtle);border:1px solid var(--ha-divider);border-radius:8px;margin-bottom:6px;font-size:13px;">
                        <span>${this._escape(p.labels)}</span>
                        <strong style="color:var(--ha-primary-text);">${p.posterior_pct}%</strong>
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
            : this._advTab === "automations"
            ? (() => {
                const slug = this._slugifyRoom(cfg.room_name || selRoom.room_name);
                const entityId = `binary_sensor.${slug}_presence`;
                const lightingYaml = `alias: "${cfg.room_name || selRoom.room_name} — PDD Lighting (State & Warning Dim)"
description: "Uses PDD occupancy_state, manual_off_suppressed, and human_present attributes"
use_blueprint:
  path: spelech/pdd_presence_lighting.yaml
  input:
    presence_sensor: ${entityId}
    respect_manual_off: true
    ignore_pets: true
    enable_warning_dim: true`;
                const stateYaml = `alias: "${cfg.room_name || selRoom.room_name} — Occupancy State Automation"
mode: restart
trigger:
  - platform: state
    entity_id: ${entityId}
    attribute: occupancy_state
action:
  - choose:
      - conditions:
          - condition: template
            value_template: >
              {{ state_attr('${entityId}', 'occupancy_state') == 'occupied_confirmed'
                 and state_attr('${entityId}', 'human_present') | default(true, true)
                 and not (state_attr('${entityId}', 'manual_off_suppressed') | default(false, true)) }}
        sequence:
          - service: light.turn_on
            target:
              area_id: ${cfg.area_id || slug}
      - conditions:
          - condition: template
            value_template: "{{ state_attr('${entityId}', 'is_cooling_down') == true }}"
        sequence:
          - service: light.turn_on
            target:
              area_id: ${cfg.area_id || slug}
            data:
              brightness_pct: 35
      - conditions:
          - condition: state
            entity_id: ${entityId}
            state: "off"
        sequence:
          - service: light.turn_off
            target:
              area_id: ${cfg.area_id || slug}`;
                return `
          <div style="margin-bottom:14px;">
            <div class="setting-label" style="margin-bottom:4px;">Entity &amp; Blueprint Contract (<code>${this._escape(entityId)}</code>)</div>
            <div style="font-size:12.5px;color:var(--ha-muted);">
              Automations should consume <code>occupancy_state</code> (<code>occupied_confirmed</code>, <code>occupied_holding</code>, <code>occupied_cooling</code>, <code>vacant</code>), <code>verified_by</code>, <code>is_cooling_down</code>, <code>human_present</code>, and <code>manual_off_suppressed</code>.
            </div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px;">
            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span class="setting-label" style="font-size:12.5px;">Blueprint Config (<code>pdd_presence_lighting.yaml</code>)</span>
                <button class="btn btn-sm btn-copy-auto" data-auto-target="auto-yaml-blueprint">Copy</button>
              </div>
              <textarea class="code-area" id="auto-yaml-blueprint" readonly style="min-height:190px;">${this._escape(lightingYaml)}</textarea>
            </div>
            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span class="setting-label" style="font-size:12.5px;">Direct State-Aware Automation YAML</span>
                <button class="btn btn-sm btn-copy-auto" data-auto-target="auto-yaml-direct">Copy</button>
              </div>
              <textarea class="code-area" id="auto-yaml-direct" readonly style="min-height:190px;">${this._escape(stateYaml)}</textarea>
            </div>
          </div>`;
              })()
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
            <path
              d="M ${(px - rad).toFixed(1)} ${py.toFixed(1)} a ${rad.toFixed(1)} ${rad.toFixed(1)} 0 1 0 ${(rad * 2).toFixed(1)} 0 a ${rad.toFixed(1)} ${rad.toFixed(1)} 0 1 0 -${(rad * 2).toFixed(1)} 0"
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

        <div style="background:#f8fafc;color:#0f172a;border:1px solid var(--ha-divider);border-radius:10px;padding:10px;overflow:hidden;touch-action:none;">
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
                <div style="margin-top:14px;padding:12px;background:var(--ha-card);border:1px solid var(--ha-divider);border-radius:8px;">
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
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:6px;">
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
                    <div style="display:flex;flex-direction:column;gap:6px;max-height:140px;overflow:auto;">
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
                          )}" style="padding:2px 6px;color:var(--ha-danger-text);" title="Delete doorway">✕</button>
                        </div>`
                        )
                        .join("")}
                    </div>`
                  }
                </div>

                <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
                  <button class="btn btn-sm" id="btn-fp-save">Save Layout</button>
                  <button class="btn btn-sm" id="btn-fp-reset">Reset Default Layout</button>
                </div>`
              }
            </div>

            <!-- 3rd Column: PIR Motion, Door Contact & BLE Proxy Placement -->
            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:6px;">
                <div class="setting-label" style="margin-bottom:0;">📡 PIR Motion &amp; Door Sensors (${fSensors.length})</div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;">
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
                <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;flex-wrap:wrap;gap:6px;">
                  <span style="font-size:11.5px;color:var(--ha-muted);">Tip: Switch to <strong>📡 PIR &amp; BLE Sensors</strong> mode to drag on canvas.</span>
                  <button class="btn btn-sm" id="btn-fp-delete-sensor" data-sensor-id="${this._escape(
                    selSensor.id
                  )}" style="padding:2px 8px;color:var(--ha-danger-text);font-size:11.5px;">Delete Sensor</button>
                </div>`
              }

              <!-- BLE Proxies on this floor -->
              <div style="margin-top:12px;padding-top:10px;border-top:1px dashed var(--ha-divider);">
                <div style="font-size:12.5px;font-weight:600;margin-bottom:6px;">📶 BLE Proxy Anchors on Floor (${fProxies.length})</div>
                <div style="display:flex;flex-direction:column;gap:4px;max-height:110px;overflow:auto;">
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
        <span style="font-size:12.5px;color:var(--ha-primary-text);font-weight:500;">
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
                <div style="font-size:12.5px;color:var(--ha-primary-text);margin-top:4px;">${this._escape(
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
              style="background:${this._timelineNegativeSpace ? "var(--ha-accent-purple-bg)" : "var(--ha-subtle)"};color:${this._timelineNegativeSpace ? "var(--ha-accent-purple-text)" : "var(--ha-text)"};border-color:${this._timelineNegativeSpace ? "var(--ha-accent-purple-border)" : "var(--ha-divider)"};font-weight:600;"
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
          <div style="background:var(--ha-accent-purple-bg);border:1px solid var(--ha-accent-purple-border);border-radius:8px;padding:8px 12px;">
            <div style="font-size:11px;color:var(--ha-accent-purple-text);">Negative-Space Subregion Localizations</div>
            <div style="font-size:16px;font-weight:700;color:var(--ha-accent-purple-text);">${totalSubregionFrames} localizations</div>
          </div>
          <div style="background:var(--ha-accent-cyan-bg);border:1px solid var(--ha-accent-cyan-border);border-radius:8px;padding:8px 12px;">
            <div style="font-size:11px;color:var(--ha-accent-cyan-text);">Blind-Pocket Holds (Bathrooms / Guest)</div>
            <div style="font-size:16px;font-weight:700;color:var(--ha-accent-cyan-text);">${totalBlindPocketFrames} frames (${totalDeltaFrames} A/B diffs)</div>
          </div>
          <div style="background:var(--ha-accent-amber-bg);border:1px solid var(--ha-accent-amber-border);border-radius:8px;padding:8px 12px;">
            <div style="font-size:11px;color:var(--ha-accent-amber-text);">Moving Shades / Sun Excluded</div>
            <div style="font-size:16px;font-weight:700;color:var(--ha-accent-amber-text);">☀️ ${totalShadeExclusionFrames} frames filtered</div>
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
          <div style="background:#f8fafc;color:#0f172a;border:1px solid var(--ha-divider);border-radius:10px;padding:10px;">
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
            <div style="display:flex;justify-content:space-between;align-items:center;padding-top:8px;font-size:11.5px;color:#475569;flex-wrap:wrap;gap:8px;">
              <span>🟢 Direct Positive Detection &nbsp;|&nbsp; 🟣 Negative-Space Localization &nbsp;|&nbsp; 🩵 Dashed Cyan = Clear Camera Exclusion Cone</span>
              <span>Active Rooms: <strong>${occupiedRoomsList.join(", ") || "None"}</strong></span>
            </div>
          </div>

          <div style="background:var(--ha-subtle);border:1px solid var(--ha-divider);border-radius:10px;padding:12px;max-height:430px;overflow:auto;">
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
                          style="padding:8px 10px;margin-bottom:6px;background:var(--ha-card);border:1px solid ${
                            isNeg ? "var(--ha-accent-purple-border)" : "var(--ha-divider)"
                          };border-radius:8px;cursor:pointer;font-size:12px;"
                        >
                          <div style="display:flex;justify-content:space-between;align-items:center;">
                            <strong>${this._escape(tr.from_room ? `${tr.from_room} → ${tr.to_room}` : `${tr.to_room || tr.room}`)}</strong>
                            <span style="font-family:var(--ha-mono);font-size:11px;color:var(--ha-muted);">${this._escape(tStr)}</span>
                          </div>
                          <div style="color:${isNeg ? "var(--ha-accent-purple-text)" : "var(--ha-success-text)"};font-weight:500;margin-top:2px;">
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
          <div style="padding:8px 10px;background:var(--ha-accent-purple-bg);border:1px solid var(--ha-accent-purple-border);border-radius:8px;">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12.5px;font-weight:600;color:var(--ha-accent-purple-text);">
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

    // Editor 3-tab navigation
    root.querySelectorAll(".editor-tab-btn[data-editor-tab], .sub-tab[data-editor-tab]").forEach((el) => {
      el.addEventListener("click", () => {
        this._editorTab = el.getAttribute("data-editor-tab") || "setup";
        this.render();
      });
    });

    // Sidebar: Add Room button
    root.querySelector("#btn-add-new-room")?.addEventListener("click", () => {
      const url = "/config/integrations/dashboard/add?domain=presence_detection_designer";
      if (window.top && window.top.location) {
        window.top.location.href = url;
      } else {
        window.location.href = url;
      }
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
      let chosenRole = roleSelect?.value || "shared";
      if (!this._isHumanExclusiveCandidate(eid) && chosenRole !== "keepalive") {
        chosenRole = "keepalive";
        this.showToast("Non-human signal assigned Supporting Hold role (SIGNAL-01)", "info");
      }
      this._applyFriendlyRoleGroup(newObs, chosenRole, presets);
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
    root.querySelector("#btn-quick-toggle-guest-mode")?.addEventListener("click", async () => {
      const curVal =
        this._globalDraft?.guest_mode_enabled !== undefined
          ? Boolean(this._globalDraft.guest_mode_enabled)
          : Boolean(this._overview?.global_settings?.guest_mode_enabled);
      const nextVal = !curVal;
      this._globalDraft = {
        ...this._globalDraft,
        guest_mode_enabled: nextVal,
      };
      await this.saveGlobalSettings();
      await this.loadOverview(true);
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
        slack_verbosity: root.querySelector("#gl-slack-verbosity")?.value || "compact",
        slack_daily_thread: Boolean(root.querySelector("#gl-slack-daily-thread")?.checked !== false),
        include_camera_snapshot: Boolean(root.querySelector("#gl-include-camera-snapshot")?.checked),
        negative_space_enabled: Boolean(root.querySelector("#gl-neg-space-enabled")?.checked),
        guest_mode_enabled: Boolean(root.querySelector("#gl-guest-mode-enabled")?.checked),
        ble_decider_enabled: Boolean(root.querySelector("#gl-ble-decider-enabled")?.checked),
        pir_validation_enabled: Boolean(root.querySelector("#gl-pir-validation-enabled")?.checked !== false),
        pir_candidate_window: Math.max(
          3,
          Number(root.querySelector("#gl-pir-candidate-window")?.value ?? 15)
        ),
      };
      this.saveGlobalSettings();
    });

    root.querySelector("#btn-test-slack-alert")?.addEventListener("click", async () => {
      const btn = root.querySelector("#btn-test-slack-alert");
      if (btn) btn.disabled = true;
      try {
        const service = root.querySelector("#gl-slack-service")?.value || "notify.scdbots";
        const channel = root.querySelector("#gl-slack-channel")?.value || "#presence-alerts";
        const verbosity = root.querySelector("#gl-slack-verbosity")?.value || "compact";
        const res = await this._apiCall("POST", "/api/presence_detection_designer/notifications/test", {
          slack_notify_service: service,
          slack_channel: channel,
          slack_verbosity: verbosity,
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
    root.querySelector("#btn-refresh-state-graph")?.addEventListener("click", () =>
      this._refreshStateGraph(this._selectedRoomId)
    );
    root.querySelector("#btn-copy-mermaid")?.addEventListener("click", () => {
      const sel = (this._overview?.rooms || []).find((r) => r.entry_id === this._selectedRoomId);
      const src = sel?.mermaid_diagram || "";
      if (src && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(src);
        this.showToast("Copied live Mermaid diagram to clipboard", "success");
      }
    });

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
    root.querySelector("#cfg-max-hold-timeout")?.addEventListener("change", (e) => {
      this._draftConfig.max_hold_timeout = Math.max(60, Number(e.target.value) || 1800);
      this._dirty = true;
      this.render();
    });
    root.querySelector("#cfg-pir-validation-enabled")?.addEventListener("change", (e) => {
      this._draftConfig.pir_validation_enabled = Boolean(e.target.checked);
      this._dirty = true;
      this.render();
    });
    root.querySelector("#cfg-pir-candidate-window")?.addEventListener("change", (e) => {
      this._draftConfig.pir_candidate_window = Math.max(3, Number(e.target.value) || 15);
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
    root.querySelector("#cfg-include-camera-snapshot")?.addEventListener("change", (e) => {
      this._draftConfig.include_camera_snapshot = e.target.checked;
      this._dirty = true;
    });

    root.querySelector("#btn-add-ble")?.addEventListener("click", () => {
      const rname = this._draftConfig.room_name || "Room";
      const trackers =
        (this._overview &&
          this._overview.global_settings &&
          this._overview.global_settings.ble_trackers) || [
          "sensor.steve_s_s25_ble_area",
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
          o.entity_id.startsWith("binary_sensor.") &&
          this._isHumanExclusiveCandidate(o.entity_id)
        ) {
          if (!triggers.includes(o.entity_id)) triggers.push(o.entity_id);
        }
      }
      this._draftConfig.trigger_entities = triggers;
      this._dirty = true;
      this.showToast(`Synced ${triggers.length} person-coupled triggers`, "info");
    });

    root.querySelectorAll(".btn-copy-auto").forEach((el) => {
      el.addEventListener("click", () => {
        const tid = el.getAttribute("data-auto-target");
        const ta = tid ? root.querySelector(`#${tid}`) : null;
        if (ta && navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(ta.value || "");
          this.showToast("Copied automation YAML to clipboard", "success");
        }
      });
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
          delete obs.cooldown_weighted;
          delete obs.signal_weighted;
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
