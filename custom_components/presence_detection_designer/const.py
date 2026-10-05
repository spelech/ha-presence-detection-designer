"""Constants for Presence Detection Designer."""

from enum import StrEnum

DOMAIN = "presence_detection_designer"

# Configuration keys
CONF_ROOM_NAME = "room_name"
CONF_MODE = "mode"
CONF_BOUNDARY_ENTITIES = "boundary_entities"
CONF_TRIGGER_ENTITIES = "trigger_entities"
CONF_SUSTAINING_CONDITIONS = "sustaining_conditions"
CONF_INACTIVITY_TIMEOUT = "inactivity_timeout"
CONF_GRACE_TIMEOUT = "grace_timeout"
CONF_EXTEND_TIMEOUT = "extend_timeout"

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
    """Operators for sustaining conditions."""

    EQUALS = "equals"
    NOT_EQUALS = "not_equals"
    GREATER_THAN = "greater_than"
    LESS_THAN = "less_than"


class LLMProviderType(StrEnum):
    """LLM Provider types."""

    CONVERSATION = "conversation"
    VISION_API = "vision_api"


EVENT_PRESENCE_TRANSITION = "presence_detection_designer_transition"
