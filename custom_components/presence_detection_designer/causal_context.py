"""Causal interaction context classifier and room actuation tracker for Presence Detection Designer.

Distinguishes between:
- Home Assistant automations / scripts / blueprints (`parent_id is not None`, tracked PDD context IDs, or automation service accounts)
- Voice Assistant commands (Google Assistant user ID `e39df6247304480fb6d01b04adc2cd5b`)
- Dashboard / Companion App manual actions (`user_id is not None` and `parent_id is None`)
- Physical wall switch / local device actuations (`user_id is None` and `parent_id is None` on real state transition)
"""

from __future__ import annotations

import time
from collections import deque
from typing import Any

AUTOMATION_USER_IDS: frozenset[str] = frozenset({"079c79d21ac24735b93682f0f6072f00"})
GOOGLE_ASSISTANT_USER_IDS: frozenset[str] = frozenset({"e39df6247304480fb6d01b04adc2cd5b"})
ACTUATOR_DOMAINS: tuple[str, ...] = ("light.", "switch.", "fan.", "cover.", "media_player.")

_ON_STATES: frozenset[str] = frozenset({"on", "playing", "open", "opening"})
_OFF_STATES: frozenset[str] = frozenset({"off", "idle", "paused", "standby", "closed", "closing"})
_INVALID_STATES: frozenset[str | None] = frozenset({None, "unavailable", "unknown"})


def is_actuator_entity(entity_id: str) -> bool:
    """Return True if entity_id belongs to an actuator domain."""
    return bool(entity_id and entity_id.startswith(ACTUATOR_DOMAINS))


def classify_actuation_context(
    old_state: Any,
    new_state: Any,
    automated_context_ids: set[str] | None = None,
    custom_voice_user_ids: set[str] | None = None,
    custom_automation_user_ids: set[str] | None = None,
) -> dict[str, Any]:
    """Classify a Home Assistant state transition by causal origin."""
    if new_state is None or getattr(new_state, "state", None) in _INVALID_STATES:
        return {"is_manual": False, "actor": "ignore", "action": None}

    new_st = str(new_state.state)
    if old_state is not None:
        old_st = getattr(old_state, "state", None)
        if old_st in _INVALID_STATES or str(old_st) == new_st:
            return {"is_manual": False, "actor": "ignore", "action": None}

    lowered = new_st.lower()
    if lowered in _ON_STATES:
        action: str | None = "on"
    elif lowered in _OFF_STATES:
        action = "off"
    else:
        action = None

    if action is None:
        return {"is_manual": False, "actor": "ignore", "action": None}

    ctx = getattr(new_state, "context", None)
    ctx_id = getattr(ctx, "id", None) if ctx is not None else None
    parent_id = getattr(ctx, "parent_id", None) if ctx is not None else None
    user_id = getattr(ctx, "user_id", None) if ctx is not None else None

    auto_users = AUTOMATION_USER_IDS | (custom_automation_user_ids or set())
    voice_users = GOOGLE_ASSISTANT_USER_IDS | (custom_voice_user_ids or set())

    if (
        (
            automated_context_ids
            and (
                (ctx_id and ctx_id in automated_context_ids)
                or (parent_id and parent_id in automated_context_ids)
            )
        )
        or parent_id is not None
        or (user_id is not None and user_id in auto_users)
    ):
        return {
            "is_manual": False,
            "actor": "automation",
            "action": action,
            "context_id": ctx_id,
            "parent_id": parent_id,
            "user_id": user_id,
        }

    if user_id is not None and user_id in voice_users:
        return {
            "is_manual": True,
            "actor": "google_assistant",
            "action": action,
            "context_id": ctx_id,
            "parent_id": parent_id,
            "user_id": user_id,
        }

    if user_id is not None:
        return {
            "is_manual": True,
            "actor": "ui_user",
            "action": action,
            "context_id": ctx_id,
            "parent_id": parent_id,
            "user_id": user_id,
        }

    if old_state is None:
        return {
            "is_manual": False,
            "actor": "initial_state",
            "action": action,
            "context_id": ctx_id,
            "parent_id": None,
            "user_id": None,
        }

    return {
        "is_manual": True,
        "actor": "physical_switch",
        "action": action,
        "context_id": ctx_id,
        "parent_id": None,
        "user_id": None,
    }


class RoomActuationTracker:
    """Tracks manual vs automated actuation state and manual-off suppression for a room."""

    def __init__(
        self,
        custom_voice_user_ids: set[str] | None = None,
        custom_automation_user_ids: set[str] | None = None,
    ) -> None:
        self.manual_intent: str = "auto"
        self.last_manual_actor: str | None = None
        self.last_manual_entity: str | None = None
        self.last_manual_action: str | None = None
        self.last_manual_ts: float | None = None
        self.automated_entities_on: set[str] = set()
        self.automated_context_ids: set[str] = set()
        self._context_order: deque[str] = deque(maxlen=50)
        self.custom_voice_user_ids: set[str] = set(custom_voice_user_ids or set())
        self.custom_automation_user_ids: set[str] = set(custom_automation_user_ids or set())

    def record_pdd_transition_context(self, context_id: str | None) -> None:
        """Record a Home Assistant Context ID emitted by PDD so downstream actuator reactions are recognized as automated."""
        if not context_id:
            return
        if len(self._context_order) == self._context_order.maxlen:
            oldest = self._context_order[0]
            self.automated_context_ids.discard(oldest)
        self._context_order.append(context_id)
        self.automated_context_ids.add(context_id)

    def handle_actuator_event(
        self,
        entity_id: str,
        old_state: Any,
        new_state: Any,
        room_is_occupied: bool = False,
        now_ts: float | None = None,
    ) -> dict[str, Any]:
        """Process an actuator state change and update room manual intent."""
        classification = classify_actuation_context(
            old_state=old_state,
            new_state=new_state,
            automated_context_ids=self.automated_context_ids,
            custom_voice_user_ids=self.custom_voice_user_ids,
            custom_automation_user_ids=self.custom_automation_user_ids,
        )
        actor = classification.get("actor")
        action = classification.get("action")
        is_manual = bool(classification.get("is_manual"))

        if actor == "automation":
            if action == "on":
                self.automated_entities_on.add(entity_id)
            elif action == "off":
                self.automated_entities_on.discard(entity_id)
        elif is_manual:
            self.automated_entities_on.discard(entity_id)
            self.last_manual_actor = actor
            self.last_manual_entity = entity_id
            self.last_manual_action = action
            self.last_manual_ts = now_ts if now_ts is not None else time.time()
            if action == "on":
                self.manual_intent = "manual_on"
            elif action == "off":
                self.manual_intent = "manual_off_suppressed"

        return {
            **classification,
            "manual_intent": self.manual_intent,
            "manual_off_suppressed": self.manual_intent == "manual_off_suppressed",
            "room_is_occupied": room_is_occupied,
        }

    def on_room_vacated(self) -> None:
        """Reset manual intent to auto when the room becomes vacant so next entry triggers lights normally."""
        self.manual_intent = "auto"

    def clear_manual_intent(self) -> None:
        """Explicitly clear manual intent back to auto."""
        self.manual_intent = "auto"

    def is_entity_auto_latched(self, entity_id: str) -> bool:
        """Return True if entity_id was most recently turned on by an automation."""
        return entity_id in self.automated_entities_on

    def as_attributes(self) -> dict[str, Any]:
        """Return state attribute dictionary for Home Assistant entities and Blueprints."""
        return {
            "manual_intent": self.manual_intent,
            "manual_off_suppressed": self.manual_intent == "manual_off_suppressed",
            "last_manual_actor": self.last_manual_actor,
            "last_manual_entity": self.last_manual_entity,
            "last_manual_action": self.last_manual_action,
            "last_manual_ts": self.last_manual_ts,
        }


def resolve_room_actuator_entities(room_name: str, config: dict[str, Any]) -> list[str]:
    """Return deduplicated list of controllable room actuators (lights, switches, fans, media) to monitor for manual/voice interactions."""
    from .spatial_catalog import ROOM_ACTUATOR_ENTITIES

    seen: list[str] = []

    def _add(eid_val: Any) -> None:
        if not eid_val:
            return
        eid = str(eid_val.get("entity_id") if isinstance(eid_val, dict) else eid_val).strip()
        if eid and is_actuator_entity(eid) and eid not in seen:
            seen.append(eid)

    for default_eid in ROOM_ACTUATOR_ENTITIES.get(room_name, ()):
        _add(default_eid)
    for custom_eid in config.get("actuator_entities", []) or []:
        _add(custom_eid)
    for trig in config.get("trigger_entities", []) or []:
        _add(trig)
    for cond in config.get("sustaining_conditions", []) or []:
        _add(cond)
    for obs in config.get("bayesian_observations", []) or []:
        _add(obs)
    return seen


def process_coordinator_actuator_event(coord: Any, event: Any) -> None:
    """Process a state_changed event on a monitored room actuator for manual/voice/switch detection."""
    if not event or not hasattr(event, "data"):
        return
    entity_id = event.data.get("entity_id")
    new_state = event.data.get("new_state")
    old_state = event.data.get("old_state")
    if not entity_id or not new_state:
        return

    res = coord.actuation_tracker.handle_actuator_event(
        entity_id=str(entity_id),
        old_state=old_state,
        new_state=new_state,
        room_is_occupied=coord.state_machine.is_present,
    )
    if res.get("is_manual"):
        if res.get("action") == "on":
            coord._active_triggers.add(str(entity_id))
            coord._last_trigger_entity = str(entity_id)
            coord._eval_bayesian_and_update()
            coord._sync_state_machine_evidence()
            coord._notify_connected_rooms_if_active()
        coord.async_update_listeners()
    elif res.get("actor") == "automation":
        coord._eval_conditions_and_update()
        coord.async_update_listeners()
