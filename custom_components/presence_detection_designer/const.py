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

# Defaults
DEFAULT_INACTIVITY_TIMEOUT = 300  # 5 minutes
DEFAULT_GRACE_TIMEOUT = 60  # 1 minute after door open/close
DEFAULT_EXTEND_TIMEOUT = 300  # 5 minutes if LLM detects occupant
DEFAULT_BAYESIAN_PRIOR = 0.20  # 20% baseline prior probability
DEFAULT_BAYESIAN_THRESHOLD = 0.75  # 75% posterior threshold to declare occupied
DEFAULT_LLM_PROMPT = (
    "Is there a person or human occupant present in this room? "
    'Respond ONLY in JSON format: {"person_detected": true/false, "confidence": float, "reason": "brief explanation"}'
)


class BoxState(StrEnum):
    """Wasp-in-a-Box states."""

    IDLE_CLEAR = "idle_clear"
    OCCUPIED_SEALED = "occupied_sealed"
    OCCUPIED_UNSEALED = "occupied_unsealed"
    TIMER_ACTIVE = "timer_active"
    LLM_VERIFYING = "llm_verifying"
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
    "sensor.tab_s10_lite_ble_area",
]
