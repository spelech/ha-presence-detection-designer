"""12 canonical golden scenarios with Layer 0 trajectories, fuzz profiles, and ground-truth thresholds."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from .signal_layers import ActorTrack, ActorWaypoint, FuzzProfile


@dataclass(frozen=True)
class GoldenScenario:
    """Declarative golden scenario ready for clean + fuzzed VirtualHAHarness evaluation."""

    name: str
    description: str
    duration_sec: int
    tracks: tuple[ActorTrack, ...]
    fuzz_clean: FuzzProfile = field(default_factory=FuzzProfile)
    fuzz_noisy: FuzzProfile = field(default_factory=FuzzProfile)
    global_settings: dict[str, Any] = field(
        default_factory=lambda: {
            "ble_decider_enabled": True,
            "ble_trackers": ["sensor.resident_a_phone_ble_area"],
            "guest_mode_enabled": False,
            "negative_space_enabled": True,
            "pir_validation_enabled": True,
        }
    )
    thresholds: dict[str, Any] = field(default_factory=dict)


def build_all_golden_scenarios() -> list[GoldenScenario]:
    """Return all 12 canonical house scenarios covering lighting latency, spillover, pets, BLE, and handoffs."""
    return [
        # 1. Open-plan pass-through + couch stillness with TV
        GoldenScenario(
            name="open_plan_passthrough_front_to_family",
            description=(
                "Resident A enters Front Entry, walks through Kitchen (testing 31.2% Kitchen->Front Entry PIR spillover), "
                "and settles onto the Family Room couch watching TV."
            ),
            duration_sec=360,
            tracks=(
                ActorTrack(
                    actor_id="resident_a",
                    actor_type="resident_a",
                    has_ble_tracker=True,
                    waypoints=(
                        ActorWaypoint(0, "main", 440, 480, "Front Entry", "walking"),
                        ActorWaypoint(12, "main", 400, 350, "Front Entry", "walking"),
                        ActorWaypoint(22, "main", 400, 210, "Kitchen", "walking"),
                        ActorWaypoint(45, "main", 620, 190, "Family Room", "walking"),
                        ActorWaypoint(60, "main", 660, 220, "Family Room", "sitting_still"),
                        ActorWaypoint(360, "main", 660, 220, "Family Room", "sitting_still"),
                    ),
                ),
            ),
            fuzz_clean=FuzzProfile(
                tv_playing_windows=((55, 360, "media_player.family_room_tv"),),
            ),
            fuzz_noisy=FuzzProfile(
                tv_playing_windows=((55, 360, "media_player.family_room_tv"),),
                ble_adjacent_bounce_prob=0.10,
                camera_frame_drop_prob=0.15,
                event_jitter_max_sec=2,
            ),
            thresholds={
                "max_entry_latency_sec": {"Front Entry": 3, "Family Room": 3},
                "max_room_fp_sec": {"Living Room": 0, "Dining Room": 0},
                "max_total_flaps": 0,
            },
        ),
        # 2. Living Room vs Dining Room open archway spillover (20.3%)
        GoldenScenario(
            name="living_dining_archway_spillover",
            description=(
                "Resident A walks into north Living Room near the Dining Room archway and sits on the couch. "
                "Dining Room PIR spillover (20.3%) must not falsely turn Dining Room occupied."
            ),
            duration_sec=240,
            tracks=(
                ActorTrack(
                    actor_id="resident_a",
                    actor_type="resident_a",
                    has_ble_tracker=True,
                    waypoints=(
                        ActorWaypoint(0, "main", 360, 420, "Front Entry", "walking"),
                        ActorWaypoint(10, "main", 210, 340, "Living Room", "walking"),
                        ActorWaypoint(20, "main", 160, 395, "Living Room", "sitting_still"),
                        ActorWaypoint(240, "main", 160, 395, "Living Room", "sitting_still"),
                    ),
                ),
            ),
            fuzz_clean=FuzzProfile(
                tv_playing_windows=((25, 240, "media_player.living_room_display_webos"),),
            ),
            fuzz_noisy=FuzzProfile(
                tv_playing_windows=((25, 240, "media_player.living_room_display_webos"),),
                ble_adjacent_bounce_prob=0.10,
                pir_false_spike_prob=0.0005,
                event_jitter_max_sec=2,
            ),
            thresholds={
                "max_room_fp_sec": {"Dining Room": 0, "Kitchen": 0},
                "max_entry_latency_sec": {"Living Room": 3},
                "max_total_flaps": 0,
            },
        ),
        # 3. Household Pet (dog) main floor patrol while house is empty / humans away
        GoldenScenario(
            name="household_pet_patrol_main_floor",
            description=(
                "Household Pet patrols Dining Room, Living Room, Kitchen, and Family Room while no humans are home. "
                "Pet-only PIR/dog detections must produce 0s occupied across all rooms (GUARD-02)."
            ),
            duration_sec=240,
            tracks=(
                ActorTrack(
                    actor_id="pet",
                    actor_type="household_pet",
                    has_ble_tracker=False,
                    waypoints=(
                        ActorWaypoint(0, "main", 180, 120, "Dining Room", "walking"),
                        ActorWaypoint(50, "main", 200, 380, "Living Room", "walking"),
                        ActorWaypoint(110, "main", 390, 180, "Kitchen", "walking"),
                        ActorWaypoint(170, "main", 680, 180, "Family Room", "walking"),
                        ActorWaypoint(240, "main", 180, 120, "Dining Room", "walking"),
                    ),
                ),
            ),
            fuzz_noisy=FuzzProfile(pir_false_spike_prob=0.0005, event_jitter_max_sec=2),
            thresholds={
                "max_total_fp_sec": 0,
                "max_total_flaps": 0,
            },
        ),
        # 4. Office desk stillness + remote UPS workload after Resident A leaves (SIGNAL-03)
        GoldenScenario(
            name="office_desk_stillness_and_remote_ups_leave",
            description=(
                "Resident A works still at Office desk (UPS > 90W + BLE=Office holds occupancy), then walks to "
                "Master Bedroom while a remote workload keeps UPS at 220W. BLE must contradict the stale UPS hold."
            ),
            duration_sec=480,
            tracks=(
                ActorTrack(
                    actor_id="resident_a",
                    actor_type="resident_a",
                    has_ble_tracker=True,
                    waypoints=(
                        ActorWaypoint(0, "upstairs", 740, 310, "Office", "walking"),
                        ActorWaypoint(15, "upstairs", 800, 390, "Office", "desk_work"),
                        ActorWaypoint(150, "upstairs", 800, 390, "Office", "desk_work"),
                        ActorWaypoint(
                            165, "upstairs", 620, 290, "Upstairs Hallway & Stairs", "walking"
                        ),
                        ActorWaypoint(185, "upstairs", 240, 260, "Master Bedroom", "walking"),
                        ActorWaypoint(200, "upstairs", 220, 220, "Master Bedroom", "sitting_still"),
                        ActorWaypoint(480, "upstairs", 220, 220, "Master Bedroom", "sitting_still"),
                    ),
                ),
            ),
            fuzz_clean=FuzzProfile(
                remote_ups_watts_windows=((0, 480, 220.0),),
                tv_playing_windows=((205, 480, "media_player.master_bedroom_tv_androidtv"),),
            ),
            fuzz_noisy=FuzzProfile(
                remote_ups_watts_windows=((0, 480, 220.0),),
                tv_playing_windows=((205, 480, "media_player.master_bedroom_tv_androidtv"),),
                ble_vertical_bleed_prob=0.05,
                camera_frame_drop_prob=0.10,
                event_jitter_max_sec=2,
            ),
            thresholds={
                "max_room_fp_sec": {"Living Room": 0, "Garage": 0},
                "max_total_flaps": 0,
            },
        ),
        # 5. Vertical BLE floor bleed must NEVER trigger vacant rooms below/above
        GoldenScenario(
            name="ble_vertical_floor_bleed_no_false_trigger",
            description=(
                "Resident A rests in Master Bedroom while Bermuda bleeds vertically to Living Room / Dining Room / Kitchen "
                "below (30% bleed prob). Vacant main-floor rooms must stay 100% vacant (BLE supporting-only)."
            ),
            duration_sec=300,
            tracks=(
                ActorTrack(
                    actor_id="resident_a",
                    actor_type="resident_a",
                    has_ble_tracker=True,
                    waypoints=(
                        ActorWaypoint(0, "upstairs", 240, 260, "Master Bedroom", "walking"),
                        ActorWaypoint(20, "upstairs", 220, 220, "Master Bedroom", "sleeping"),
                        ActorWaypoint(300, "upstairs", 220, 220, "Master Bedroom", "sleeping"),
                    ),
                ),
            ),
            fuzz_clean=FuzzProfile(ble_vertical_bleed_prob=0.25),
            fuzz_noisy=FuzzProfile(
                ble_vertical_bleed_prob=0.40,
                ble_unknown_dropout_prob=0.10,
                event_jitter_max_sec=2,
            ),
            thresholds={
                "max_room_fp_sec": {
                    "Living Room": 0,
                    "Dining Room": 0,
                    "Kitchen": 0,
                    "Family Room": 0,
                    "Basement Play Area": 0,
                },
                "max_total_flaps": 0,
            },
        ),
        # 6. Master Bedroom -> Master Bathroom shower (blind pocket + dhumidity hold)
        GoldenScenario(
            name="master_bedroom_to_master_bath_shower",
            description=(
                "Resident A walks from Master Bedroom into Master Bathroom, showers with dhumidity > 0.3 "
                "(no motion during shower), then exits back to Master Bedroom."
            ),
            duration_sec=420,
            tracks=(
                ActorTrack(
                    actor_id="resident_a",
                    actor_type="resident_a",
                    has_ble_tracker=True,
                    waypoints=(
                        ActorWaypoint(0, "upstairs", 260, 420, "Master Bedroom", "walking"),
                        ActorWaypoint(20, "upstairs", 480, 490, "Master Bathroom", "walking"),
                        ActorWaypoint(35, "upstairs", 560, 500, "Master Bathroom", "showering"),
                        ActorWaypoint(270, "upstairs", 560, 500, "Master Bathroom", "showering"),
                        ActorWaypoint(290, "upstairs", 260, 380, "Master Bedroom", "walking"),
                        ActorWaypoint(310, "upstairs", 220, 220, "Master Bedroom", "sitting_still"),
                        ActorWaypoint(420, "upstairs", 220, 220, "Master Bedroom", "sitting_still"),
                    ),
                ),
            ),
            fuzz_clean=FuzzProfile(
                shower_humidity_windows=((40, 265, 0.85),),
                tv_playing_windows=((310, 420, "media_player.master_bedroom_tv_androidtv"),),
            ),
            fuzz_noisy=FuzzProfile(
                shower_humidity_windows=((40, 265, 0.85),),
                tv_playing_windows=((310, 420, "media_player.master_bedroom_tv_androidtv"),),
                ble_adjacent_bounce_prob=0.15,
                event_jitter_max_sec=2,
            ),
            thresholds={
                "max_zone_dark_gap_sec": {"Master Suite": 5},
                "max_total_flaps": 0,
            },
        ),
        # 7. Basement Theater <-> Basement Play Area handoff + whole-basement continuity
        GoldenScenario(
            name="basement_theater_play_area_handoff_and_zone",
            description=(
                "Resident A walks down basement stairs into Basement Play Area, visits the bar, walks into "
                "Basement Theater (nfc_basement BLE + TV), then returns to Play Area. Whole Basement zone "
                "must stay continuously occupied with 0s dark gap."
            ),
            duration_sec=420,
            tracks=(
                ActorTrack(
                    actor_id="resident_a",
                    actor_type="resident_a",
                    has_ble_tracker=True,
                    waypoints=(
                        ActorWaypoint(0, "basement", 600, 490, "Basement Play Area", "walking"),
                        ActorWaypoint(15, "basement", 460, 220, "Basement Play Area", "walking"),
                        ActorWaypoint(60, "basement", 440, 120, "Basement Play Area", "walking"),
                        ActorWaypoint(85, "basement", 220, 260, "Basement Theater", "walking"),
                        ActorWaypoint(
                            100, "basement", 200, 260, "Basement Theater", "sitting_still"
                        ),
                        ActorWaypoint(
                            300, "basement", 200, 260, "Basement Theater", "sitting_still"
                        ),
                        ActorWaypoint(320, "basement", 450, 260, "Basement Play Area", "walking"),
                        ActorWaypoint(420, "basement", 450, 260, "Basement Play Area", "walking"),
                    ),
                ),
            ),
            fuzz_clean=FuzzProfile(
                tv_playing_windows=((95, 305, "media_player.basement_display_webos"),),
            ),
            fuzz_noisy=FuzzProfile(
                tv_playing_windows=((95, 305, "media_player.basement_display_webos"),),
                ble_adjacent_bounce_prob=0.15,
                camera_frame_drop_prob=0.10,
                event_jitter_max_sec=2,
            ),
            thresholds={
                "max_zone_dark_gap_sec": {"Basement": 3},
                "max_room_fp_sec": {"Storage Room": 0},
                "max_total_flaps": 0,
            },
        ),
        # 8. Upstairs Hallway pass-by Guest Room (12.5% VALLHORN spillover) into Kids Room
        GoldenScenario(
            name="upstairs_hallway_to_guest_room_and_resident_b",
            description=(
                "Resident A walks up stairs through Upstairs Hallway past Guest Room into Kids Room, "
                "then exits to Master Bedroom. Guest Room must stay vacant on pass-by."
            ),
            duration_sec=240,
            tracks=(
                ActorTrack(
                    actor_id="resident_a",
                    actor_type="resident_a",
                    has_ble_tracker=True,
                    waypoints=(
                        ActorWaypoint(
                            0, "upstairs", 640, 500, "Upstairs Hallway & Stairs", "walking"
                        ),
                        ActorWaypoint(
                            15, "upstairs", 620, 290, "Upstairs Hallway & Stairs", "walking"
                        ),
                        ActorWaypoint(30, "upstairs", 480, 160, "Kids Room", "walking"),
                        ActorWaypoint(45, "upstairs", 460, 120, "Kids Room", "sitting_still"),
                        ActorWaypoint(150, "upstairs", 460, 120, "Kids Room", "sitting_still"),
                        ActorWaypoint(
                            170, "upstairs", 450, 290, "Upstairs Hallway & Stairs", "walking"
                        ),
                        ActorWaypoint(190, "upstairs", 240, 260, "Master Bedroom", "walking"),
                        ActorWaypoint(240, "upstairs", 240, 260, "Master Bedroom", "sitting_still"),
                    ),
                ),
            ),
            fuzz_noisy=FuzzProfile(ble_adjacent_bounce_prob=0.10, event_jitter_max_sec=2),
            thresholds={
                "max_room_fp_sec": {"Guest Room": 0, "Office": 0},
                "max_total_flaps": 0,
            },
        ),
        # 9. Multi-occupant split: Resident A in Office (BLE) + Resident B in Family Room (untracked, TV)
        GoldenScenario(
            name="multi_occupant_resident_a_and_resident_b_split_rooms",
            description=(
                "Resident A works in Office (with S25+ BLE) while Resident B (no BLE) watches TV in Family Room. "
                "Resident A's BLE in Office must NOT clear Resident B's Family Room occupancy."
            ),
            duration_sec=360,
            tracks=(
                ActorTrack(
                    actor_id="resident_a",
                    actor_type="resident_a",
                    has_ble_tracker=True,
                    waypoints=(
                        ActorWaypoint(0, "upstairs", 760, 340, "Office", "walking"),
                        ActorWaypoint(15, "upstairs", 800, 390, "Office", "desk_work"),
                        ActorWaypoint(360, "upstairs", 800, 390, "Office", "desk_work"),
                    ),
                ),
                ActorTrack(
                    actor_id="resident_b",
                    actor_type="resident_b",
                    has_ble_tracker=False,
                    waypoints=(
                        ActorWaypoint(0, "main", 660, 180, "Family Room", "walking"),
                        ActorWaypoint(20, "main", 660, 220, "Family Room", "sitting_still"),
                        ActorWaypoint(360, "main", 660, 220, "Family Room", "sitting_still"),
                    ),
                ),
            ),
            fuzz_clean=FuzzProfile(
                remote_ups_watts_windows=((0, 360, 180.0),),
                tv_playing_windows=((15, 360, "media_player.family_room_tv"),),
            ),
            fuzz_noisy=FuzzProfile(
                remote_ups_watts_windows=((0, 360, 180.0),),
                tv_playing_windows=((15, 360, "media_player.family_room_tv"),),
                camera_frame_drop_prob=0.15,
                event_jitter_max_sec=2,
            ),
            thresholds={
                "max_total_fn_sec": 10,
                "max_total_flaps": 0,
            },
        ),
        # 10. Garage arrival -> Laundry Room -> Family Room handoff
        GoldenScenario(
            name="garage_entry_laundry_handoff",
            description=(
                "Resident A arrives in Garage, walks through Laundry Room (door contact + Ring PIR) into Family Room. "
                "Garage and Laundry Room should hand off cleanly and vacate."
            ),
            duration_sec=240,
            tracks=(
                ActorTrack(
                    actor_id="resident_a",
                    actor_type="resident_a",
                    has_ble_tracker=True,
                    waypoints=(
                        ActorWaypoint(0, "main", 680, 500, "Garage", "walking"),
                        ActorWaypoint(25, "main", 580, 430, "Garage", "walking"),
                        ActorWaypoint(35, "main", 580, 360, "Laundry Room", "walking"),
                        ActorWaypoint(55, "main", 620, 210, "Family Room", "walking"),
                        ActorWaypoint(75, "main", 660, 220, "Family Room", "sitting_still"),
                        ActorWaypoint(240, "main", 660, 220, "Family Room", "sitting_still"),
                    ),
                ),
            ),
            fuzz_clean=FuzzProfile(
                tv_playing_windows=((70, 240, "media_player.family_room_tv"),),
            ),
            fuzz_noisy=FuzzProfile(
                tv_playing_windows=((70, 240, "media_player.family_room_tv"),),
                ble_adjacent_bounce_prob=0.10,
                event_jitter_max_sec=2,
            ),
            thresholds={
                "max_entry_latency_sec": {"Garage": 3, "Laundry Room": 3, "Family Room": 3},
                "max_total_flaps": 0,
            },
        ),
        # 11. Sunlit shade movement false camera flicker in empty Living Room
        GoldenScenario(
            name="sunlit_shade_movement_false_camera_flicker",
            description=(
                "Motorized shades move in empty Living Room causing a brief uncorroborated Frigate camera flicker "
                "while Resident A is upstairs in Office. Living Room must remain vacant."
            ),
            duration_sec=180,
            tracks=(
                ActorTrack(
                    actor_id="resident_a",
                    actor_type="resident_a",
                    has_ble_tracker=True,
                    waypoints=(
                        ActorWaypoint(0, "upstairs", 800, 390, "Office", "walking"),
                        ActorWaypoint(15, "upstairs", 800, 390, "Office", "desk_work"),
                        ActorWaypoint(180, "upstairs", 800, 390, "Office", "desk_work"),
                    ),
                ),
            ),
            fuzz_clean=FuzzProfile(
                remote_ups_watts_windows=((0, 180, 180.0),),
                shade_flicker_events=(
                    (60, "Living Room", "binary_sensor.living_room_bay_windows_person_occupancy"),
                ),
            ),
            fuzz_noisy=FuzzProfile(
                remote_ups_watts_windows=((0, 180, 180.0),),
                shade_flicker_events=(
                    (60, "Living Room", "binary_sensor.living_room_bay_windows_person_occupancy"),
                    (110, "Living Room", "binary_sensor.living_room_couch_person_occupancy"),
                ),
                ble_vertical_bleed_prob=0.15,
            ),
            thresholds={
                "max_room_fp_sec": {"Living Room": 0},
                "max_total_flaps": 0,
            },
        ),
        # 12. Storage Room doorway bleed from Basement Play Area
        GoldenScenario(
            name="storage_room_doorway_bleed_from_play_area",
            description=(
                "Resident A walks near the open Storage Room doorway inside Basement Play Area without entering "
                "Storage Room. Tests whole-frame storage_room_person_occupancy bleed vs workout subzone."
            ),
            duration_sec=180,
            tracks=(
                ActorTrack(
                    actor_id="resident_a",
                    actor_type="resident_a",
                    has_ble_tracker=True,
                    waypoints=(
                        ActorWaypoint(0, "basement", 520, 200, "Basement Play Area", "walking"),
                        ActorWaypoint(30, "basement", 675, 180, "Basement Play Area", "walking"),
                        ActorWaypoint(60, "basement", 500, 240, "Basement Play Area", "walking"),
                        ActorWaypoint(180, "basement", 500, 240, "Basement Play Area", "walking"),
                    ),
                ),
            ),
            fuzz_noisy=FuzzProfile(ble_adjacent_bounce_prob=0.15, event_jitter_max_sec=2),
            thresholds={
                "max_room_fp_sec": {"Storage Room": 0},
                "max_total_flaps": 0,
            },
        ),
        # 13. Full morning routine: wake -> bath -> let Household Pet out -> shower -> dress -> office -> coffee -> Household Pet lunch -> garage departure
        GoldenScenario(
            name="morning_routine_wake_to_work_departure",
            description=(
                "Everyday morning routine: Resident A wakes in Master Bedroom, visits Master Bathroom, goes downstairs "
                "to let Household Pet out the back door, returns upstairs to shower (dhumidity hold) and dress in Master "
                "Bedroom/Closet, grabs work gear from Office, preps coffee in Kitchen, lets Household Pet back in, packs "
                "Household Pet's lunch in Dining Room, and departs with Household Pet via Laundry Room -> Garage."
            ),
            duration_sec=1080,
            tracks=(
                ActorTrack(
                    actor_id="resident_a",
                    actor_type="resident_a",
                    has_ble_tracker=True,
                    waypoints=(
                        ActorWaypoint(0, "upstairs", 220, 220, "Master Bedroom", "sleeping"),
                        ActorWaypoint(30, "upstairs", 260, 400, "Master Bedroom", "walking"),
                        ActorWaypoint(45, "upstairs", 500, 490, "Master Bathroom", "walking"),
                        ActorWaypoint(90, "upstairs", 500, 490, "Master Bathroom", "walking"),
                        ActorWaypoint(110, "upstairs", 260, 350, "Master Bedroom", "walking"),
                        ActorWaypoint(
                            125, "upstairs", 520, 290, "Upstairs Hallway & Stairs", "walking"
                        ),
                        ActorWaypoint(140, "main", 440, 360, "Front Entry", "walking"),
                        ActorWaypoint(
                            155, "main", 470, 100, "Kitchen", "walking"
                        ),  # Back door for Household Pet
                        ActorWaypoint(175, "main", 440, 360, "Front Entry", "walking"),
                        ActorWaypoint(
                            190, "upstairs", 520, 290, "Upstairs Hallway & Stairs", "walking"
                        ),
                        ActorWaypoint(205, "upstairs", 260, 400, "Master Bedroom", "walking"),
                        ActorWaypoint(220, "upstairs", 560, 500, "Master Bathroom", "showering"),
                        ActorWaypoint(420, "upstairs", 560, 500, "Master Bathroom", "showering"),
                        ActorWaypoint(
                            440, "upstairs", 260, 400, "Master Bedroom", "walking"
                        ),  # Dress + closet
                        ActorWaypoint(510, "upstairs", 240, 280, "Master Bedroom", "walking"),
                        ActorWaypoint(
                            530, "upstairs", 580, 290, "Upstairs Hallway & Stairs", "walking"
                        ),
                        ActorWaypoint(
                            545, "upstairs", 780, 380, "Office", "walking"
                        ),  # Gather work stuff
                        ActorWaypoint(600, "upstairs", 760, 340, "Office", "walking"),
                        ActorWaypoint(
                            615, "upstairs", 580, 290, "Upstairs Hallway & Stairs", "walking"
                        ),
                        ActorWaypoint(630, "main", 440, 360, "Front Entry", "walking"),
                        ActorWaypoint(645, "main", 400, 180, "Kitchen", "walking"),  # Coffee prep
                        ActorWaypoint(
                            720, "main", 470, 100, "Kitchen", "walking"
                        ),  # Let Household Pet back in
                        ActorWaypoint(
                            745, "main", 180, 150, "Dining Room", "walking"
                        ),  # Pack Household Pet's lunch
                        ActorWaypoint(810, "main", 180, 150, "Dining Room", "walking"),
                        ActorWaypoint(830, "main", 400, 190, "Kitchen", "walking"),
                        ActorWaypoint(850, "main", 580, 360, "Laundry Room", "walking"),
                        ActorWaypoint(870, "main", 680, 490, "Garage", "walking"),
                        ActorWaypoint(910, "main", 680, 540, "Garage", "walking"),
                        ActorWaypoint(920, "main", 0, 0, None, "away"),
                        ActorWaypoint(1080, "main", 0, 0, None, "away"),
                    ),
                ),
                ActorTrack(
                    actor_id="pet",
                    actor_type="household_pet",
                    has_ble_tracker=False,
                    waypoints=(
                        ActorWaypoint(0, "upstairs", 250, 260, "Master Bedroom", "sleeping"),
                        ActorWaypoint(
                            125, "upstairs", 500, 290, "Upstairs Hallway & Stairs", "walking"
                        ),
                        ActorWaypoint(140, "main", 440, 360, "Front Entry", "walking"),
                        ActorWaypoint(155, "main", 470, 100, "Kitchen", "walking"),
                        ActorWaypoint(165, "main", 0, 0, None, "away"),  # Outside in backyard
                        ActorWaypoint(720, "main", 0, 0, None, "away"),
                        ActorWaypoint(725, "main", 460, 110, "Kitchen", "walking"),  # Back inside
                        ActorWaypoint(
                            750, "main", 190, 120, "Dining Room", "walking"
                        ),  # Food corner
                        ActorWaypoint(850, "main", 580, 360, "Laundry Room", "walking"),
                        ActorWaypoint(875, "main", 680, 490, "Garage", "walking"),
                        ActorWaypoint(920, "main", 0, 0, None, "away"),  # Off to daycare
                        ActorWaypoint(1080, "main", 0, 0, None, "away"),
                    ),
                ),
            ),
            fuzz_clean=FuzzProfile(
                shower_humidity_windows=((225, 425, 0.85),),
            ),
            fuzz_noisy=FuzzProfile(
                shower_humidity_windows=((225, 425, 0.85),),
                ble_adjacent_bounce_prob=0.10,
                ble_vertical_bleed_prob=0.05,
                camera_frame_drop_prob=0.10,
                event_jitter_max_sec=2,
            ),
            thresholds={
                "max_room_fp_sec": {
                    "Basement Theater": 0,
                    "Basement Play Area": 0,
                    "Guest Room": 0,
                },
                "max_total_flaps": 0,
            },
        ),
        # 14. Evening return home: Resident A + Resident B + Household Pet via Garage -> Laundry -> split (Resident B Family Room, Resident A Kitchen -> Master Bedroom -> Family Room)
        GoldenScenario(
            name="evening_return_home_with_resident_b_and_pet",
            description=(
                "Resident A, Resident B, and Household Pet return via Garage -> Laundry Room. Resident B settles in Family Room "
                "watching TV while Resident A lets Household Pet out the Kitchen back door, goes upstairs to Master Bedroom "
                "to change, then rejoins Resident B in Family Room."
            ),
            duration_sec=600,
            tracks=(
                ActorTrack(
                    actor_id="resident_a",
                    actor_type="resident_a",
                    has_ble_tracker=True,
                    waypoints=(
                        ActorWaypoint(0, "main", 680, 500, "Garage", "walking"),
                        ActorWaypoint(25, "main", 580, 360, "Laundry Room", "walking"),
                        ActorWaypoint(45, "main", 420, 180, "Kitchen", "walking"),
                        ActorWaypoint(
                            65, "main", 470, 100, "Kitchen", "walking"
                        ),  # Back door for Household Pet
                        ActorWaypoint(85, "main", 450, 325, "Front Entry", "walking"),
                        ActorWaypoint(
                            105, "upstairs", 520, 290, "Upstairs Hallway & Stairs", "walking"
                        ),
                        ActorWaypoint(
                            125, "upstairs", 240, 280, "Master Bedroom", "walking"
                        ),  # Change clothes
                        ActorWaypoint(240, "upstairs", 240, 280, "Master Bedroom", "walking"),
                        ActorWaypoint(
                            260, "upstairs", 520, 290, "Upstairs Hallway & Stairs", "walking"
                        ),
                        ActorWaypoint(280, "main", 450, 325, "Front Entry", "walking"),
                        ActorWaypoint(300, "main", 660, 210, "Family Room", "walking"),
                        ActorWaypoint(315, "main", 660, 220, "Family Room", "sitting_still"),
                        ActorWaypoint(600, "main", 660, 220, "Family Room", "sitting_still"),
                    ),
                ),
                ActorTrack(
                    actor_id="resident_b",
                    actor_type="resident_b",
                    has_ble_tracker=False,
                    waypoints=(
                        ActorWaypoint(0, "main", 660, 490, "Garage", "walking"),
                        ActorWaypoint(20, "main", 580, 350, "Laundry Room", "walking"),
                        ActorWaypoint(40, "main", 660, 210, "Family Room", "walking"),
                        ActorWaypoint(55, "main", 680, 220, "Family Room", "sitting_still"),
                        ActorWaypoint(600, "main", 680, 220, "Family Room", "sitting_still"),
                    ),
                ),
                ActorTrack(
                    actor_id="pet",
                    actor_type="household_pet",
                    has_ble_tracker=False,
                    waypoints=(
                        ActorWaypoint(0, "main", 650, 480, "Garage", "walking"),
                        ActorWaypoint(22, "main", 580, 350, "Laundry Room", "walking"),
                        ActorWaypoint(45, "main", 450, 140, "Kitchen", "walking"),
                        ActorWaypoint(68, "main", 0, 0, None, "away"),  # Outside
                        ActorWaypoint(600, "main", 0, 0, None, "away"),
                    ),
                ),
            ),
            fuzz_clean=FuzzProfile(
                tv_playing_windows=((50, 600, "media_player.family_room_tv"),),
            ),
            fuzz_noisy=FuzzProfile(
                tv_playing_windows=((50, 600, "media_player.family_room_tv"),),
                ble_adjacent_bounce_prob=0.10,
                ble_vertical_bleed_prob=0.05,
                camera_frame_drop_prob=0.15,
                event_jitter_max_sec=2,
            ),
            thresholds={
                "max_entry_latency_sec": {"Garage": 3, "Family Room": 3, "Master Bedroom": 3},
                "max_room_fp_sec": {"Living Room": 0, "Dining Room": 0, "Office": 0},
                "max_total_flaps": 0,
            },
        ),
        # 15. Bedtime back-and-forth from Kids Room to Kitchen for snacks and drinks
        GoldenScenario(
            name="bedtime_resident_b_room_kitchen_snack_runs",
            description=(
                "At bedtime, Resident B stays in Kids Room while Resident A makes two back-and-forth trips "
                "between Kids Room and Kitchen (snacks, then drinks) via Upstairs Hallway & Front Entry."
            ),
            duration_sec=480,
            tracks=(
                ActorTrack(
                    actor_id="resident_b",
                    actor_type="resident_b",
                    has_ble_tracker=False,
                    waypoints=(
                        ActorWaypoint(0, "upstairs", 460, 120, "Kids Room", "walking"),
                        ActorWaypoint(20, "upstairs", 460, 120, "Kids Room", "sitting_still"),
                        ActorWaypoint(480, "upstairs", 460, 120, "Kids Room", "sitting_still"),
                    ),
                ),
                ActorTrack(
                    actor_id="resident_a",
                    actor_type="resident_a",
                    has_ble_tracker=True,
                    waypoints=(
                        # Start in Kids Room
                        ActorWaypoint(0, "upstairs", 480, 160, "Kids Room", "walking"),
                        # Trip 1: snacks from Kitchen
                        ActorWaypoint(
                            25, "upstairs", 520, 290, "Upstairs Hallway & Stairs", "walking"
                        ),
                        ActorWaypoint(40, "main", 440, 360, "Front Entry", "walking"),
                        ActorWaypoint(55, "main", 390, 180, "Kitchen", "walking"),
                        ActorWaypoint(105, "main", 390, 180, "Kitchen", "walking"),
                        ActorWaypoint(120, "main", 440, 360, "Front Entry", "walking"),
                        ActorWaypoint(
                            135, "upstairs", 520, 290, "Upstairs Hallway & Stairs", "walking"
                        ),
                        ActorWaypoint(155, "upstairs", 480, 160, "Kids Room", "walking"),
                        ActorWaypoint(210, "upstairs", 480, 160, "Kids Room", "sitting_still"),
                        # Trip 2: drinks from Kitchen
                        ActorWaypoint(
                            230, "upstairs", 520, 290, "Upstairs Hallway & Stairs", "walking"
                        ),
                        ActorWaypoint(245, "main", 440, 360, "Front Entry", "walking"),
                        ActorWaypoint(260, "main", 390, 180, "Kitchen", "walking"),
                        ActorWaypoint(310, "main", 390, 180, "Kitchen", "walking"),
                        ActorWaypoint(325, "main", 440, 360, "Front Entry", "walking"),
                        ActorWaypoint(
                            340, "upstairs", 520, 290, "Upstairs Hallway & Stairs", "walking"
                        ),
                        ActorWaypoint(360, "upstairs", 480, 160, "Kids Room", "walking"),
                        ActorWaypoint(480, "upstairs", 480, 160, "Kids Room", "sitting_still"),
                    ),
                ),
            ),
            fuzz_clean=FuzzProfile(
                tv_playing_windows=((0, 480, "media_player.resident_b_s_tv"),),
            ),
            fuzz_noisy=FuzzProfile(
                tv_playing_windows=((0, 480, "media_player.resident_b_s_tv"),),
                ble_adjacent_bounce_prob=0.10,
                ble_vertical_bleed_prob=0.05,
                event_jitter_max_sec=2,
            ),
            thresholds={
                "max_entry_latency_sec": {
                    "Upstairs Hallway & Stairs": 3,
                    "Front Entry": 3,
                    "Kitchen": 3,
                },
                "max_room_fp_sec": {
                    "Guest Room": 0,
                    "Office": 0,
                    "Living Room": 0,
                    "Dining Room": 0,
                },
                "max_total_flaps": 0,
            },
        ),
        # 16. Direct 3-floor transit: Office -> Upstairs Hallway -> Front Entry -> Basement Play Area -> Storage Room -> back
        GoldenScenario(
            name="office_to_storage_room_direct_route",
            description=(
                "Resident A walks directly from Office (upstairs) down both staircases through Front Entry and "
                "Basement Play Area into Storage Room, spends ~90s there, and returns directly to Office."
            ),
            duration_sec=360,
            tracks=(
                ActorTrack(
                    actor_id="resident_a",
                    actor_type="resident_a",
                    has_ble_tracker=True,
                    waypoints=(
                        ActorWaypoint(0, "upstairs", 800, 390, "Office", "walking"),
                        ActorWaypoint(
                            15, "upstairs", 620, 290, "Upstairs Hallway & Stairs", "walking"
                        ),
                        ActorWaypoint(
                            30, "main", 450, 325, "Front Entry", "walking"
                        ),  # Keypad + top of basement stairs
                        ActorWaypoint(45, "basement", 600, 490, "Basement Play Area", "walking"),
                        ActorWaypoint(60, "basement", 580, 210, "Basement Play Area", "walking"),
                        ActorWaypoint(75, "basement", 780, 180, "Storage Room", "walking"),
                        ActorWaypoint(165, "basement", 780, 180, "Storage Room", "walking"),
                        ActorWaypoint(185, "basement", 580, 210, "Basement Play Area", "walking"),
                        ActorWaypoint(200, "basement", 600, 490, "Basement Play Area", "walking"),
                        ActorWaypoint(215, "main", 450, 325, "Front Entry", "walking"),
                        ActorWaypoint(
                            230, "upstairs", 620, 290, "Upstairs Hallway & Stairs", "walking"
                        ),
                        ActorWaypoint(250, "upstairs", 800, 390, "Office", "walking"),
                        ActorWaypoint(270, "upstairs", 800, 390, "Office", "desk_work"),
                        ActorWaypoint(360, "upstairs", 800, 390, "Office", "desk_work"),
                    ),
                ),
            ),
            fuzz_clean=FuzzProfile(
                remote_ups_watts_windows=((0, 360, 160.0),),
            ),
            fuzz_noisy=FuzzProfile(
                remote_ups_watts_windows=((0, 360, 160.0),),
                ble_adjacent_bounce_prob=0.10,
                ble_vertical_bleed_prob=0.05,
                event_jitter_max_sec=2,
            ),
            thresholds={
                "max_entry_latency_sec": {"Storage Room": 3, "Basement Play Area": 3},
                "max_room_fp_sec": {"Basement Theater": 0, "Living Room": 0, "Dining Room": 0},
                "max_total_flaps": 0,
            },
        ),
    ]


GOLDEN_SCENARIOS: list[GoldenScenario] = build_all_golden_scenarios()
