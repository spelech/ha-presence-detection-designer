"""Tests for People & Animal Spatial Attribution and Causal Manual / Google Assistant Tracking."""

from unittest.mock import MagicMock

from custom_components.presence_detection_designer.binary_sensor import PresenceBinarySensor
from custom_components.presence_detection_designer.causal_context import (
    AUTOMATION_USER_IDS,
    GOOGLE_ASSISTANT_USER_IDS,
    classify_actuation_context,
)
from custom_components.presence_detection_designer.const import (
    CONF_ROOM_NAME,
    CONF_SUSTAINING_CONDITIONS,
    CONF_TRIGGER_ENTITIES,
    DOMAIN,
)
from custom_components.presence_detection_designer.coordinator import RoomPresenceCoordinator
from custom_components.presence_detection_designer.sensor import RoomOccupantSensor
from custom_components.presence_detection_designer.spatial_catalog import (
    HOUSEHOLD_ANIMAL_PROFILES,
    HOUSEHOLD_PEOPLE_PROFILES,
    PRIMARY_BLE_TRACKER_ENTITIES,
)
from custom_components.presence_detection_designer.spatial_inference import evaluate_spatial_frame


def _make_state(state_val: str, user_id: str | None = None, parent_id: str | None = None, ctx_id: str = "ctx_1"):
    st = MagicMock()
    st.state = state_val
    st.attributes = {}
    ctx = MagicMock()
    ctx.id = ctx_id
    ctx.user_id = user_id
    ctx.parent_id = parent_id
    st.context = ctx
    return st


def test_household_profiles_no_sara():
    """Verify Sara placeholder is removed and Steve, Margot, Guest, and Riley are modeled."""
    assert all("sara" not in eid.lower() for eid in PRIMARY_BLE_TRACKER_ENTITIES)
    assert "sara" not in HOUSEHOLD_PEOPLE_PROFILES
    assert set(HOUSEHOLD_PEOPLE_PROFILES.keys()) == {"steve", "margot", "guest"}
    assert "riley" in HOUSEHOLD_ANIMAL_PROFILES
    assert HOUSEHOLD_ANIMAL_PROFILES["riley"]["label"] == "Riley (Dog)"


def test_co_presence_steve_and_riley_and_untracked_margot():
    """Verify simultaneous human + pet co-presence and untracked Margot attribution."""
    states = {
        "sensor.steve_s_s25_ble_area": "Family Room",
        "binary_sensor.couch_person_occupancy": "on",
        "binary_sensor.family_room_dog_occupancy": "on",
        "binary_sensor.nursery_bed_person_occupancy": "on",
        "binary_sensor.dining_room_motion": "on",
        "binary_sensor.dining_room_dog_occupancy": "on",
    }
    frame = evaluate_spatial_frame(
        state_getter=lambda eid: states.get(eid, "off"),
        now_ts=1000.0,
        ble_decider_enabled=True,
    )
    fam = frame["room_estimates"]["Family Room"]
    assert fam["occupied"] is True
    assert fam["human_present"] is True
    assert fam["pet_present"] is True
    assert fam["occupant_type"] == "tracked_human"
    assert fam["detected_people"] == ["Steve"]
    assert fam["detected_animals"] == ["Riley (Dog)"]
    assert fam["presence_summary"] == "Steve + Riley (Dog)"

    margot_rm = frame["room_estimates"]["Margot's Room"]
    assert margot_rm["occupied"] is True
    assert margot_rm["human_present"] is True
    assert margot_rm["occupant_type"] == "untracked_human"
    assert margot_rm["occupant_label"] == "Margot"
    assert margot_rm["presence_summary"] == "Margot"

    dining = frame["room_estimates"]["Dining Room"]
    assert dining["occupied"] is False
    assert dining["human_present"] is False
    assert dining["pet_present"] is True
    assert dining["occupant_type"] == "pet"
    assert dining["occupant_label"] == "Riley (Dog)"
    assert dining["presence_summary"] == "Riley (Dog)"
    assert len(frame["pet_estimates"]) == 2


def test_classify_google_assistant_physical_switch_and_automation():
    """Verify Google Assistant, UI, and Physical Switch are manual while Automations are not."""
    ga_user = next(iter(GOOGLE_ASSISTANT_USER_IDS))
    auto_user = next(iter(AUTOMATION_USER_IDS))

    # 1. Google Assistant voice command turning light off
    res_ga = classify_actuation_context(
        _make_state("on"),
        _make_state("off", user_id=ga_user),
    )
    assert res_ga["is_manual"] is True
    assert res_ga["actor"] == "google_assistant"
    assert res_ga["action"] == "off"

    # 2. Physical wall switch turning light on (no user_id, no parent_id, valid old_state)
    res_sw = classify_actuation_context(
        _make_state("off"),
        _make_state("on", user_id=None, parent_id=None),
    )
    assert res_sw["is_manual"] is True
    assert res_sw["actor"] == "physical_switch"
    assert res_sw["action"] == "on"

    # 3. Automation turning light on (parent_id set or automation user)
    res_auto = classify_actuation_context(
        _make_state("off"),
        _make_state("on", user_id=auto_user, parent_id="parent_trigger_123"),
    )
    assert res_auto["is_manual"] is False
    assert res_auto["actor"] == "automation"
    assert res_auto["action"] == "on"


def test_coordinator_google_assistant_manual_off_and_auto_latch_prevention():
    """Verify Google Assistant light turn-off sets manual_off_suppressed and automated light does not self-latch."""
    ga_user = next(iter(GOOGLE_ASSISTANT_USER_IDS))
    hass = MagicMock()
    hass.bus = MagicMock()
    hass.states = MagicMock()
    hass.data = {DOMAIN: {}}

    state_map = {
        "binary_sensor.office_motion": _make_state("on"),
        "light.office_lights": _make_state("off"),
    }
    hass.states.get = lambda eid: state_map.get(eid)

    config = {
        CONF_ROOM_NAME: "Office",
        CONF_TRIGGER_ENTITIES: ["binary_sensor.office_motion"],
        CONF_SUSTAINING_CONDITIONS: [
            {"entity_id": "light.office_lights", "operator": "equals", "state": "on"}
        ],
    }
    coord = RoomPresenceCoordinator(hass, "office_entry", config)
    bin_sensor = PresenceBinarySensor(coord, "office_entry")
    occ_sensor = RoomOccupantSensor(coord, "office_entry")

    # 1. Automation turns on light.office_lights -> should NOT count as manual or self-latch condition
    state_map["light.office_lights"] = _make_state("on", parent_id="auto_parent_1")
    auto_evt = MagicMock()
    auto_evt.data = {
        "entity_id": "light.office_lights",
        "old_state": _make_state("off"),
        "new_state": state_map["light.office_lights"],
    }
    coord._handle_actuator_change(auto_evt)
    assert coord.actuation_tracker.is_entity_auto_latched("light.office_lights") is True
    assert coord.state_machine.active_conditions == []

    # 2. Occupant says "Hey Google, turn off the Office lights" while occupied
    coord.state_machine.handle_trigger("binary_sensor.office_motion", True)
    assert bin_sensor.is_on is True

    state_map["light.office_lights"] = _make_state("off", user_id=ga_user)
    ga_off_evt = MagicMock()
    ga_off_evt.data = {
        "entity_id": "light.office_lights",
        "old_state": _make_state("on"),
        "new_state": state_map["light.office_lights"],
    }
    coord._handle_actuator_change(ga_off_evt)

    attrs = bin_sensor.extra_state_attributes
    assert attrs["manual_intent"] == "manual_off_suppressed"
    assert attrs["manual_off_suppressed"] is True
    assert attrs["last_manual_actor"] == "google_assistant"
    assert attrs["last_manual_entity"] == "light.office_lights"
    assert occ_sensor.extra_state_attributes["manual_off_suppressed"] is True

    # 3. When room vacates, manual_intent automatically resets to 'auto'
    coord._previous_presence = True
    coord.state_machine.is_present = False
    coord.async_update_listeners()
    assert bin_sensor.extra_state_attributes["manual_intent"] == "auto"
    assert bin_sensor.extra_state_attributes["manual_off_suppressed"] is False
