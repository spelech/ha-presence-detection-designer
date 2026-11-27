"""Home Assistant Presence Notifications & Diagnostic Attribution Engine."""

from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from typing import Any

from homeassistant.core import HomeAssistant

from .const import DATA_STORE, DOMAIN

_LOGGER = logging.getLogger(__name__)

EVENT_PRESENCE_TRANSITION = "presence_detection_designer_transition"
DEBOUNCE_SECONDS = 5.0


def format_duration(seconds: float | None) -> str | None:
    """Format duration in seconds into a friendly human-readable string."""
    if seconds is None or not isinstance(seconds, (int, float)) or seconds < 0:
        return None
    hrs, rem = divmod(int(round(seconds)), 3600)
    mins, secs = divmod(rem, 60)
    parts = [f"{hrs}h"] if hrs else []
    if mins or hrs:
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
    driver_type: (
        str  # "sensor", "sustaining", "inactivity_timeout", "bounded_exit", "negative_space"
    )
    confidence_pct: float
    threshold_pct: float
    active_sensors: list[str]
    sustaining_conditions: list[str]
    arrival_context: str | None = None
    duration_occupied_str: str | None = None
    inferred_location: str | None = None
    negative_space_evidence: list[str] | None = None
    timestamp: datetime = datetime.now(UTC)

    def to_dict(self) -> dict[str, Any]:
        """Convert attribution to JSON-serializable dictionary."""
        d = asdict(self)
        d["timestamp"] = self.timestamp.isoformat()
        return d


class NotificationDispatcher:
    """Handles transition driver attribution, message formatting, and HA notify dispatch."""

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
        threshold = float(
            room_config.get("prob_threshold") or room_config.get("bayesian_threshold") or 0.70
        )
        threshold_pct = round(threshold * 100.0, 1)
        active_sensors = list(curr_eval.get("active_entities", []))
        sustaining = list(curr_eval.get("active_sustaining_conditions", []))
        inferred_location = curr_eval.get("inferred_location")
        negative_space_evidence = curr_eval.get("negative_space_evidence")

        if to_state == "occupied":
            driver_entity = curr_eval.get("driver_entity")
            if driver_entity:
                label = str(driver_entity)
                if "camera" in label.lower() or "person" in label.lower():
                    label = f"{label} (Frigate Camera)"
                primary_driver = label
                driver_type = "sensor"
            elif negative_space_evidence:
                primary_driver = f"Negative-Space Inference ({inferred_location or room_name})"
                driver_type = "negative_space"
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
                primary_driver = f"Occupancy probability crossed threshold ({confidence_pct}%)"
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
            inferred_location=str(inferred_location) if inferred_location else None,
            negative_space_evidence=list(negative_space_evidence)
            if negative_space_evidence
            else None,
            timestamp=datetime.now(UTC),
        )

    def format_notification_message(
        self,
        attribution: TransitionAttribution,
        verbosity: str = "compact",
    ) -> dict[str, Any]:
        """Format a transition notification message according to verbosity setting."""
        v = str(verbosity).lower().strip()
        lines: list[str] = []

        if v == "minimal":
            if attribution.to_state == "occupied":
                context_str = (
                    f", from {attribution.arrival_context}" if attribution.arrival_context else ""
                )
                lines.append(
                    f"🟢 {attribution.room_name} occupied ({attribution.confidence_pct:.0f}% via {attribution.primary_driver}{context_str})"
                )
            else:
                dur_str = (
                    f" (occupied {attribution.duration_occupied_str})"
                    if attribution.duration_occupied_str
                    else ""
                )
                lines.append(f"⚪ {attribution.room_name} cleared{dur_str}")

        elif v == "compact":
            if attribution.to_state == "occupied":
                lines.append(
                    f"🟢 {attribution.room_name} → Occupied ({attribution.confidence_pct:.0f}%)"
                )
                details: list[str] = [f"Driver: {attribution.primary_driver}"]
                if attribution.inferred_location:
                    details.append(f"Location: {attribution.inferred_location}")
                if attribution.arrival_context:
                    details.append(f"From: {attribution.arrival_context}")
                if attribution.negative_space_evidence:
                    details.append(f"Exclusion: {attribution.negative_space_evidence[0]}")
                lines.append(" • ".join(details))
            else:
                lines.append(f"⚪ {attribution.room_name} → Cleared")
                details = [f"Driver: {attribution.primary_driver}"]
                if attribution.duration_occupied_str:
                    details.append(f"Duration: {attribution.duration_occupied_str}")
                lines.append(" • ".join(details))

        else:  # "full" / diagnostic
            if attribution.to_state == "occupied":
                lines.append(f"🟢 {attribution.room_name} → Occupied")
                lines.append(f"• Primary Driver: {attribution.primary_driver}")
                lines.append(
                    f"• Confidence: {attribution.confidence_pct:.0f}% (Threshold: {attribution.threshold_pct:.0f}%)"
                )
                if attribution.inferred_location:
                    lines.append(f"• Spatial Localization: {attribution.inferred_location}")
                if attribution.negative_space_evidence:
                    neg_str = "; ".join(attribution.negative_space_evidence[:3])
                    lines.append(f"• Negative-Space Exclusion: {neg_str}")
                if attribution.active_sensors:
                    active_str = ", ".join(attribution.active_sensors[:4])
                    lines.append(f"• Active Sensors: {active_str}")
                if attribution.sustaining_conditions:
                    sust_str = ", ".join(attribution.sustaining_conditions[:2])
                    lines.append(f"• Sustaining Conditions: {sust_str}")
                if attribution.arrival_context:
                    lines.append(f"• Arrival Context: {attribution.arrival_context}")
            else:
                lines.append(f"⚪ {attribution.room_name} → Cleared")
                lines.append(f"• Clearance Driver: {attribution.primary_driver}")
                if attribution.duration_occupied_str:
                    lines.append(f"• Duration of Occupancy: {attribution.duration_occupied_str}")
                lines.append(f"• Final Confidence: {attribution.confidence_pct:.0f}%")

        full_text = "\n".join(lines)
        return {
            "title": f"{attribution.room_name}: {attribution.to_state.title()}",
            "text": full_text,
        }

    async def async_dispatch_notification(
        self,
        hass: HomeAssistant,
        attribution: TransitionAttribution,
        global_settings: dict[str, Any],
        room_config: dict[str, Any],
        *,
        force_test: bool = False,
    ) -> bool:
        """Fire HA transition event and dispatch to configured HA notify.* service."""
        if not force_test:
            if not global_settings.get("notifications_enabled", False):
                _LOGGER.debug("Notifications globally disabled; skipping")
                return False

            if room_config.get("notify_enabled") is False:
                return False

            if (
                attribution.to_state == "occupied"
                and room_config.get("notify_on_occupied") is False
            ):
                return False

            if attribution.to_state == "clear" and room_config.get("notify_on_cleared") is False:
                return False

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

        if not force_test:
            try:
                hass.bus.async_fire(EVENT_PRESENCE_TRANSITION, attribution.to_dict())
            except Exception as err:  # noqa: BLE001
                _LOGGER.warning("Failed to fire %s event: %s", EVENT_PRESENCE_TRANSITION, err)

        notify_service_full = str(global_settings.get("notify_service") or "").strip()
        if not notify_service_full:
            return not force_test

        if "." in notify_service_full:
            domain, service = notify_service_full.split(".", 1)
        else:
            domain = "notify"
            service = notify_service_full

        verbosity = (
            str(
                room_config.get("notify_verbosity")
                or global_settings.get("notify_verbosity")
                or "compact"
            )
            .strip()
            .lower()
        )
        formatted = self.format_notification_message(attribution, verbosity=verbosity)
        service_data: dict[str, Any] = {
            "title": formatted["title"],
            "message": formatted["text"],
        }
        target = str(global_settings.get("notify_target") or "").strip()
        if target:
            service_data["target"] = [target]

        if not hass.services.has_service(domain, service):
            _LOGGER.warning(
                "Notification service %s.%s is not registered; skipping dispatch",
                domain,
                service,
            )
            return False

        try:
            await asyncio.wait_for(
                hass.services.async_call(domain, service, service_data, blocking=True),
                timeout=10.0,
            )
            _LOGGER.info(
                "Dispatched presence transition notification for %s (%s) via %s",
                attribution.room_name,
                attribution.to_state,
                notify_service_full,
            )
            return True
        except Exception as err:  # noqa: BLE001
            _LOGGER.warning(
                "Failed to dispatch notification via %s: %s",
                notify_service_full,
                err,
            )
            return False


async def async_send_coordinator_test_notification(
    coord: Any,
    service: str | None = None,
    target: str | None = None,
    verbosity: str | None = None,
) -> bool:
    """Send a test diagnostic notification via Home Assistant notify.* service."""
    global_settings: dict[str, Any] = {}
    if coord.hass and hasattr(coord.hass, "data") and isinstance(coord.hass.data, dict):
        store = coord.hass.data.get(DOMAIN, {}).get(DATA_STORE)
        if store is not None and hasattr(store, "global_settings"):
            global_settings = dict(store.global_settings or {})

    if service:
        global_settings["notify_service"] = service
    if target:
        global_settings["notify_target"] = target
    if verbosity:
        global_settings["notify_verbosity"] = verbosity

    attribution = TransitionAttribution(
        room_id="studio_test",
        room_name=f"Design Studio Test ({coord.room_name})",
        from_state="clear",
        to_state="occupied",
        primary_driver="Test Trigger (Manual Studio Verification)",
        driver_type="sensor",
        confidence_pct=95.0,
        threshold_pct=75.0,
        active_sensors=["test_sensor.manual_ping"],
        sustaining_conditions=[],
        arrival_context="Manual Studio Test",
        duration_occupied_str=None,
    )
    return await coord._notification_dispatcher.async_dispatch_notification(
        coord.hass,
        attribution,
        global_settings,
        {"notify_enabled": True, "notify_on_occupied": True},
        force_test=True,
    )
