"""Slack Presence Notifications & Diagnostic Attribution Engine."""

from __future__ import annotations

import json
import logging
import time
import urllib.request
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
    """Handles driver attribution, Slack formatting, auto-channel creation, debounce, and async dispatch."""

    def __init__(self) -> None:
        """Initialize the dispatcher."""
        self._last_dispatched: dict[tuple[str, str], float] = {}
        self._verified_channels: set[str] = set()

    def _call_slack_web_api(
        self,
        url: str,
        token: str,
        payload: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Invoke a Slack Web API endpoint synchronously (run inside executor job)."""
        headers: dict[str, str] = {"Authorization": f"Bearer {token}"}
        data_bytes: bytes | None = None
        if payload is not None:
            headers["Content-Type"] = "application/json; charset=utf-8"
            data_bytes = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data_bytes, headers=headers)
        with urllib.request.urlopen(req, timeout=8) as resp:
            return json.loads(resp.read().decode("utf-8"))

    async def async_ensure_slack_channel(
        self,
        hass: Any,
        channel: str,
    ) -> str:
        """Ensure target Slack channel exists; create it via conversations.create if missing."""
        clean_name = channel.lstrip("#").strip().lower()
        if not clean_name or clean_name in self._verified_channels:
            return channel

        token: str | None = None
        if (
            hass
            and hasattr(hass, "config_entries")
            and hasattr(hass.config_entries, "async_entries")
        ):
            try:
                entries = hass.config_entries.async_entries("slack") or []
                for entry in entries:
                    data = getattr(entry, "data", None)
                    if isinstance(data, dict):
                        cand = data.get("api_key")
                        if isinstance(cand, str) and cand.startswith("xox"):
                            token = cand
                            break
            except Exception:  # noqa: BLE001
                token = None

        if not token or not hasattr(hass, "async_add_executor_job"):
            return channel

        try:
            list_res = await hass.async_add_executor_job(
                self._call_slack_web_api,
                "https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=200",
                token,
                None,
            )
            if isinstance(list_res, dict) and list_res.get("ok"):
                existing = {
                    str(ch.get("name", "")).lower(): ch
                    for ch in (list_res.get("channels") or [])
                    if isinstance(ch, dict)
                }
                if clean_name in existing:
                    self._verified_channels.add(clean_name)
                    return channel

                create_res = await hass.async_add_executor_job(
                    self._call_slack_web_api,
                    "https://slack.com/api/conversations.create",
                    token,
                    {"name": clean_name, "is_private": False},
                )
                if isinstance(create_res, dict) and create_res.get("ok"):
                    _LOGGER.info("Auto-created missing Slack channel #%s", clean_name)
                    self._verified_channels.add(clean_name)
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Slack channel auto-provisioning skipped for %s: %s", channel, err)

        return channel

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
            inferred_location=str(inferred_location) if inferred_location else None,
            negative_space_evidence=list(negative_space_evidence)
            if negative_space_evidence
            else None,
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
            if attribution.inferred_location:
                lines.append(f"• *Spatial Localization:* {attribution.inferred_location}")
            if attribution.negative_space_evidence:
                neg_str = "; ".join(attribution.negative_space_evidence[:3])
                lines.append(f"• *Negative-Space Exclusion:* {neg_str}")
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

        # 2. Per-room settings (default to True unless explicitly False)
        if room_config.get("notify_slack") is False:
            return False

        if attribution.to_state == "occupied" and room_config.get("notify_on_occupied") is False:
            return False

        if attribution.to_state == "clear" and room_config.get("notify_on_cleared") is False:
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

        # 4. Resolve notify service & target channel (auto-creating missing Slack channel if needed)
        notify_service_full = str(
            global_settings.get("slack_notify_service") or "notify.scdbots"
        ).strip()
        channel = str(global_settings.get("slack_channel") or "#presence-alerts").strip()
        await self.async_ensure_slack_channel(hass, channel)

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
