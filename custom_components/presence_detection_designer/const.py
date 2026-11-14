"""Constants for Presence Detection Designer."""

from enum import StrEnum

DOMAIN = "presence_detection_designer"

# Configuration keys
CONF_ROOM_NAME = "room_name"
CONF_AREA_ID = "area_id"
CONF_MODE = "mode"
CONF_BOUNDARY_ENTITIES = "boundary_entities"
CONF_TRIGGER_ENTITIES = "trigger_entities"
CONF_SUSTAINING_CONDITIONS = "sustaining_conditions"
CONF_INACTIVITY_TIMEOUT = "inactivity_timeout"
CONF_GRACE_TIMEOUT = "grace_timeout"
CONF_EXTEND_TIMEOUT = "extend_timeout"
CONF_CONNECTED_ROOMS = "connected_rooms"

# Bayesian sensor fusion configuration
CONF_BAYESIAN_ENABLED = "bayesian_enabled"
CONF_BAYESIAN_PRIOR = "bayesian_prior"
CONF_BAYESIAN_THRESHOLD = "bayesian_threshold"
CONF_BAYESIAN_OBSERVATIONS = "bayesian_observations"

# LLM & Vision configuration
CONF_LLM_ENABLED = "llm_enabled"
CONF_LLM_PROVIDER_TYPE = "llm_provider_type"
CONF_LLM_AGENT_ID = "llm_agent_id"
CONF_LLM_API_URL = "llm_api_url"
CONF_LLM_API_KEY = "llm_api_key"
CONF_LLM_MODEL = "llm_model"
CONF_CAMERA_ENTITY = "camera_entity"
CONF_CAMERA_SNAPSHOT_URL = "camera_snapshot_url"
CONF_LLM_PROMPT = "llm_prompt"

# Slack & Notification configuration
CONF_NOTIFICATIONS_ENABLED = "notifications_enabled"
CONF_SLACK_NOTIFY_SERVICE = "slack_notify_service"
CONF_SLACK_CHANNEL = "slack_channel"
CONF_SLACK_VERBOSITY = "slack_verbosity"
CONF_NOTIFY_SLACK = "notify_slack"
CONF_NOTIFY_ON_OCCUPIED = "notify_on_occupied"
CONF_NOTIFY_ON_CLEARED = "notify_on_cleared"
CONF_NEGATIVE_SPACE_ENABLED = "negative_space_enabled"
CONF_GUEST_MODE_ENABLED = "guest_mode_enabled"
CONF_BLE_DECIDER_ENABLED = "ble_decider_enabled"

DEFAULT_SLACK_NOTIFY_SERVICE = "notify.scdbots"
DEFAULT_SLACK_CHANNEL = "#presence-alerts"
DEFAULT_SLACK_VERBOSITY = "compact"  # "minimal", "compact", "full"
DEFAULT_NOTIFY_SLACK = True
DEFAULT_NEGATIVE_SPACE_ENABLED = True
DEFAULT_GUEST_MODE_ENABLED = False
DEFAULT_BLE_DECIDER_ENABLED = False

# Defaults
DEFAULT_INACTIVITY_TIMEOUT = 300  # 5 minutes
DEFAULT_GRACE_TIMEOUT = 60  # 1 minute after door open/close
DEFAULT_EXTEND_TIMEOUT = 300  # 5 minutes if LLM detects occupant
DEFAULT_MAX_HOLD_TIMEOUT = 1800  # 30 minutes finite cap on holding states
DEFAULT_VERIFY_TIMEOUT = 30  # 30 seconds fail-safe cap on LLM verification
DEFAULT_BAYESIAN_PRIOR = 0.20  # 20% baseline prior probability
DEFAULT_BAYESIAN_THRESHOLD = 0.75  # 75% posterior threshold to declare occupied
DEFAULT_LLM_PROMPT = (
    "Is there a person or human occupant present in this room? "
    'Respond ONLY in JSON format: {"person_detected": true/false, "confidence": float, "reason": "brief explanation"}'
)


class OccupancyState(StrEnum):
    """Hierarchical transitions occupancy states."""

    VACANT = "vacant"
    OCCUPIED_CONFIRMED = "occupied_confirmed"
    OCCUPIED_HOLDING = "occupied_holding"
    OCCUPIED_COOLING = "occupied_cooling"
    OCCUPIED_VERIFYING = "occupied_verifying"
    OVERRIDE = "override"


class Mode(StrEnum):
    """Room boundary mode."""

    BOUNDED = "bounded"
    OPEN = "open"


class ConditionOperator(StrEnum):
    """Operators for sustaining conditions and Bayesian observations."""

    EQUALS = "equals"
    NOT_EQUALS = "not_equals"
    GREATER_THAN = "greater_than"
    LESS_THAN = "less_than"
    IN = "in"


class BayesianWeightPreset(StrEnum):
    """Human-friendly reliability presets for Bayesian observations."""

    DECISIVE = "decisive"
    STRONG = "strong"
    MODERATE = "moderate"
    SUPPORTING = "supporting"
    CUSTOM = "custom"


# Maps each preset to (prob_given_true, prob_given_false)
# With prior=0.20 and threshold=0.75:
# - decisive (LR=47.5): 92.2% solo -> crosses 75% immediately
# - strong (LR=17.0): 81.0% solo -> crosses 75% immediately
# - moderate (LR=6.0): 60.0% solo -> requires +1 supporting (80.5%) or +1 moderate (90.0%)
# - supporting (LR=2.75): 40.7% solo -> requires +1 moderate (80.5%) or 3x supporting (83.9%)
BAYESIAN_PRESET_WEIGHTS: dict[str, tuple[float, float]] = {
    BayesianWeightPreset.DECISIVE: (0.95, 0.02),
    BayesianWeightPreset.STRONG: (0.85, 0.05),
    BayesianWeightPreset.MODERATE: (0.72, 0.12),
    BayesianWeightPreset.SUPPORTING: (0.55, 0.20),
}

BAYESIAN_PRESET_DESCRIPTIONS: dict[str, str] = {
    BayesianWeightPreset.DECISIVE: (
        "Decisive (P(E|T)=0.95, P(E|F)=0.02, LR=47.5x -> ~92% solo): "
        "Near-certain proof of human presence, such as a specific Frigate seating/desk/bed zone."
    ),
    BayesianWeightPreset.STRONG: (
        "Strong (P(E|T)=0.85, P(E|F)=0.05, LR=17.0x -> ~81% solo): "
        "High-confidence presence signal, such as full-room camera person detection, primary PIR motion, or active workstation/media."
    ),
    BayesianWeightPreset.MODERATE: (
        "Moderate (P(E|T)=0.72, P(E|F)=0.12, LR=6.0x -> ~60% solo): "
        "Medium-confidence signal, such as Bermuda BLE phone area localization or doorway motion. Needs at least 1 supporting sensor to cross 75%."
    ),
    BayesianWeightPreset.SUPPORTING: (
        "Supporting (P(E|T)=0.55, P(E|F)=0.20, LR=2.75x -> ~41% solo): "
        "Corroborating signal, such as a slow 30-min Ecobee occupancy sensor or room light. Cannot trigger occupancy alone; boosts other sensors."
    ),
    BayesianWeightPreset.CUSTOM: (
        "Custom explicit prob_given_true and prob_given_false probabilities."
    ),
}


class LLMProviderType(StrEnum):
    """LLM Provider types."""

    CONVERSATION = "conversation"
    AI_TASK = "ai_task"
    VISION_API = "vision_api"


EVENT_PRESENCE_TRANSITION = "presence_detection_designer_transition"
EVENT_PRESENCE_EXPLANATION = "presence_detection_designer_explanation"

# Native .storage & custom panel constants
STORAGE_VERSION = 1
STORAGE_KEY = DOMAIN
DATA_STORE = "_store"
PANEL_REGISTERED = "_panel_registered"
VIEWS_REGISTERED = "_views_registered"
MAX_ROOM_REVISIONS = 15
MAX_TIMELINE_EVENTS = 400
DEFAULT_BLE_TRACKERS = [
    "sensor.steve_s_s25_ble_area",
]
DEFAULT_TRANSIT_WINDOW_SEC = 90.0
DEFAULT_SETTLING_WINDOW_SEC = 2.0

# House Perimeter & Head-Counter Constants
CONF_HOUSE_OCCUPANT_COUNT = "house_occupant_count"
CONF_PERIMETER_DOORS = "perimeter_doors"
CONF_ENABLE_CONSERVATION_LAW = "enable_conservation_law"
CONF_SLACK_NOTIFY_TRANSITIONS = "slack_notify_transitions"
DEFAULT_SLACK_NOTIFY_TRANSITIONS = False

# Head-count safety constraints.
# Automatic ingress is capped at this value so a stuck/mis-vectored perimeter
# door can never inflate the house count without bound. Manual overrides via
# set_house_occupant_count may exceed it (e.g. a party).
CONF_MAX_OCCUPANTS = "max_occupants"
DEFAULT_MAX_OCCUPANTS = 12

# Doors that are physically interior to the house (e.g. garage -> laundry).
# Crossing one cannot change the whole-house head count.
CONF_INTERIOR_DOORS = "interior_doors"
DEFAULT_INTERIOR_DOORS = ["binary_sensor.laundry_room_door"]

# If the head count is > 0 but every room has been clear for this long, the
# count is reconciled to zero. Catches missed egress events and stale counts.
CONF_STALE_COUNT_TIMEOUT = "stale_count_timeout"
DEFAULT_STALE_COUNT_TIMEOUT = 900  # 15 minutes

# Suppress repeated same-direction transits of the same door within this window
# (one person fumbling with a door should not count as several people).
CONF_DOOR_DUPLICATE_WINDOW = "door_duplicate_window"
DEFAULT_DOOR_DUPLICATE_WINDOW = 45.0

# Default perimeter door entities mapping: entity_id -> room_name
# The laundry-room door is interior (garage -> laundry) and is therefore in
# DEFAULT_INTERIOR_DOORS rather than the perimeter map.
DEFAULT_PERIMETER_DOORS: dict[str, str] = {
    "binary_sensor.front_door": "Front Entry",
    "binary_sensor.back_door": "Kitchen",
    "binary_sensor.garage_side_door": "Garage",
    "cover.garage_door": "Garage",
}

# Exterior corroborating motion sensors required for perimeter exits.
# Egress through a configured door must be corroborated by motion on one of
# its exterior sensors (during door-open window or within corroboration window).
CONF_EXIT_CORROBORATORS = "exit_corroborators"
DEFAULT_EXIT_CORROBORATORS: dict[str, list[str]] = {
    "binary_sensor.garage_side_door": [
        "binary_sensor.driveway_spotlight_camera_motion",
        "binary_sensor.driveway_camera_motion",
        "binary_sensor.backyard_motion",
    ],
}

# Window in seconds to wait for exterior corroboration after door closure
CONF_EXIT_CORROBORATION_WINDOW = "exit_corroboration_window"
DEFAULT_EXIT_CORROBORATION_WINDOW = 30.0
