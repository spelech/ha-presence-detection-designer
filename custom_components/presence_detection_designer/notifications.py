"""Slack Presence Notifications & Diagnostic Attribution Engine."""

from __future__ import annotations

import logging
import time
from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from typing import Any

from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)

EVENT_PRESENCE_TRANSITION = "presence_detection_designer_transition"
DEBOUNCE_SECONDS = 5.0


def format_duration(seconds: float | None) -> str | None:
    """Format duration in seconds into a friendly human-readable string."""
    if seconds is None or seconds < 0:
        return None
    total_sec = int(round(seconds))
    hrs = total_sec // 3600
    mins = (total_sec % 3600) // 60
    secs = total_sec % 60

    parts: list[str] = []
    if hrs > 0:
        parts.append(f"{hrs}h")
    if mins > 0 or hrs > 0:
        parts.append(f"{mins}m")
    parts.append(f"{secs}s")
    return " ".join(parts)


@dataclass
class TransitionAttribution:
    """Diagnostic profile attributing a room's presence state change."""

    room_id: str
    room_name: str
    from_state: str
    to_state: str
    primary_driver: str
    driver_type: str  # "sensor", "sustaining", "inactivity_timeout", "bounded_exit"
    confidence_pct: float
    threshold_pct: float
    active_sensors: list[str]
    sustaining_conditions: list[str]
    arrival_context: str | None = None
    duration_occupied_str: str | None = None
    timestamp: datetime = datetime.now(UTC)

    def to_dict(self) -> dict[str, Any]:
        """Convert attribution to JSON-serializable dictionary."""
        d = asdict(self)
        d["timestamp"] = self.timestamp.isoformat()
        return d


class NotificationDispatcher:
    """Handles driver attribution, Slack formatting, debounce, and async dispatch."""

    def __init__(self) -> None:
        """Initialize the dispatcher."""
        self._last_dispatched: dict[tuple[str, str], float] = {}

    def resolve_transition_driver(
        self,
        room_id: str,
        room_name: str,
        from_state: str,
        to_state: str,
        room_config: dict[str, Any],
        prev_eval: dict[str, Any] | None,
        curr_eval: dict[str, Any],
        adjacent_context: str | None = None,
        duration_seconds: float | None = None,
    ) -> TransitionAttribution:
        """Attribute primary driver and compile diagnostic context for a transition."""
        prob = float(curr_eval.get("probability", 0.0))
        confidence_pct = round(prob * 100.0, 1)
        threshold = float(room_config.get("prob_threshold", 0.70))
        threshold_pct = round(threshold * 100.0, 1)
        active_sensors = list(curr_eval.get("active_entities", []))
        sustaining = list(curr_eval.get("active_sustaining_conditions", []))

        if to_state == "occupied":
            driver_entity = curr_eval.get("driver_entity")
            if driver_entity:
                label = str(driver_entity)
                if "camera" in label.lower() or "person" in label.lower():
                    label = f"{label} (Frigate Camera)"
                primary_driver = label
                driver_type = "sensor"
            elif sustaining:
                primary_driver = f"Sustaining condition: {sustaining[0]}"
                driver_type = "sustaining"
            elif active_sensors:
                label = active_sensors[0]
                if "camera" in label.lower() or "person" in label.lower():
                    label = f"{label} (Frigate Camera)"
                primary_driver = f"Sensor tripped: {label}"
                driver_type = "sensor"
            else:
                primary_driver = (
                    f"Bayesian probability crossed activation threshold ({confidence_pct}%)"
                )
                driver_type = "sensor"
            duration_str = None

        else:
            inactivity_timeout = int(room_config.get("inactivity_timeout", 180))
            if sustaining:
                primary_driver = "Sustaining condition cleared"
                driver_type = "sustaining"
            else:
                primary_driver = (
                    f"Inactivity timeout ({inactivity_timeout}s) expired with zero active sensors"
                )
                driver_type = "inactivity_timeout"
            duration_str = format_duration(duration_seconds)

        return TransitionAttribution(
            room_id=room_id,
            room_name=room_name,
            from_state=from_state,
            to_state=to_state,
            primary_driver=primary_driver,
            driver_type=driver_type,
            confidence_pct=confidence_pct,
            threshold_pct=threshold_pct,
            active_sensors=active_sensors,
            sustaining_conditions=sustaining,
            arrival_context=adjacent_context,
            duration_occupied_str=duration_str,
            timestamp=datetime.now(UTC),
        )

    def format_slack_message(self, attribution: TransitionAttribution) -> dict[str, Any]:
        """Format a rich diagnostic card suitable for Slack delivery."""
        lines: list[str] = []

        if attribution.to_state == "occupied":
            lines.append(f"🟢 *{attribution.room_name} → Occupied*")
            lines.append(f"• *Primary Driver:* `{attribution.primary_driver}`")
            lines.append(
                f"• *Bayesian Probability:* {attribution.confidence_pct:.0f}% *(Threshold: {attribution.threshold_pct:.0f}%)*"
            )
            if attribution.active_sensors:
                active_str = ", ".join(f"`{s}`" for s in attribution.active_sensors[:4])
                lines.append(f"• *Active Sensors:* {active_str}")
            if attribution.sustaining_conditions:
                sust_str = ", ".join(f"`{s}`" for s in attribution.sustaining_conditions[:2])
                lines.append(f"• *Sustaining Conditions:* {sust_str}")
            if attribution.arrival_context:
                lines.append(f"• *Arrival Context:* {attribution.arrival_context}")

        else:
            lines.append(f"⚪ *{attribution.room_name} → Cleared*")
            lines.append(f"• *Clearance Driver:* {attribution.primary_driver}")
            if attribution.duration_occupied_str:
                lines.append(f"• *Duration of Occupancy:* {attribution.duration_occupied_str}")
            lines.append(f"• *Final Probability:* {attribution.confidence_pct:.0f}%")

        full_text = "\n".join(lines)
        return {
            "text": full_text,
            "channel_message": full_text,
        }

    async def async_dispatch_notification(
        self,
        hass: HomeAssistant,
        attribution: TransitionAttribution,
        global_settings: dict[str, Any],
        room_config: dict[str, Any],
    ) -> bool:
        """Dispatch Slack notification if enabled and within rate limits."""
        # 1. Global master toggle
        if not global_settings.get("notifications_enabled", True):
            _LOGGER.debug("Notifications globally disabled; skipping")
            return False

        # 2. Per-room settings
        if not room_config.get("notify_slack", False):
            return False

        if attribution.to_state == "occupied" and not room_config.get("notify_on_occupied", True):
            return False

        if attribution.to_state == "clear" and not room_config.get("notify_on_cleared", True):
            return False

        # 3. Debounce check
        key = (attribution.room_id, attribution.to_state)
        now = time.time()
        last_time = self._last_dispatched.get(key, 0.0)
        if (now - last_time) < DEBOUNCE_SECONDS:
            _LOGGER.debug(
                "Debouncing rapid transition for %s -> %s (last %.1fs ago)",
                attribution.room_id,
                attribution.to_state,
                now - last_time,
            )
            return False

        self._last_dispatched[key] = now

        # 4. Resolve notify service & target channel
        notify_service_full = str(
            global_settings.get("slack_notify_service", "notify.scdbots")
        ).strip()
        channel = str(global_settings.get("slack_channel", "#presence-alerts")).strip()

        # Handle 'notify.scdbots' -> domain 'notify', service 'scdbots'
        if "." in notify_service_full:
            domain, service = notify_service_full.split(".", 1)
        else:
            domain = "notify"
            service = notify_service_full

        formatted = self.format_slack_message(attribution)
        message_text = formatted["text"]

        service_data: dict[str, Any] = {
            "message": message_text,
            "target": [channel],
            "data": {
                "channel": channel,
            },
        }

        # 5. Emit Home Assistant event
        try:
            hass.bus.async_fire(EVENT_PRESENCE_TRANSITION, attribution.to_dict())
        except Exception as err:
            _LOGGER.warning("Failed to fire %s event: %s", EVENT_PRESENCE_TRANSITION, err)

        # 6. Call notify service
        try:
            await hass.services.async_call(domain, service, service_data, blocking=False)
            _LOGGER.info(
                "Dispatched presence transition notification for %s (%s) to %s via %s",
                attribution.room_name,
                attribution.to_state,
                channel,
                notify_service_full,
            )
            return True
        except Exception as err:
            _LOGGER.warning(
                "Failed to dispatch Slack notification via %s: %s",
                notify_service_full,
                err,
            )
            return False
