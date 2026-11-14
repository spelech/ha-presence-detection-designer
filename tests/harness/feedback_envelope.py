"""Toolbelt Six-Part Agent Feedback Envelope & Diagnostic Log Tap."""

from __future__ import annotations

import json
import logging
from collections import deque
from dataclasses import asdict, dataclass, field
from typing import Any


@dataclass(frozen=True)
class DiagnosticEnvelope:
    """Standardized 6-part JSON diagnostic payload for deterministic failure reproduction."""

    status: str
    test_name: str
    inputs: dict[str, Any]
    assumptions: list[str]
    active_settings: dict[str, Any]
    action_history: list[dict[str, Any]]
    output_delta: dict[str, Any]
    captured_logs: list[str]
    reproduction_command: str

    def to_dict(self) -> dict[str, Any]:
        """Serialize envelope to a JSON-compatible dictionary."""
        return asdict(self)

    def to_json(self, indent: int = 2) -> str:
        """Render formatted JSON string."""
        return json.dumps(self.to_dict(), indent=indent, default=str)


class ScenarioAssertionError(AssertionError):
    """AssertionError carrying the Toolbelt 6-part diagnostic envelope."""

    def __init__(self, envelope: DiagnosticEnvelope) -> None:
        self.envelope = envelope
        super().__init__(
            f"Scenario '{envelope.test_name}' failed.\n"
            f"6-Part Feedback Envelope:\n{envelope.to_json()}"
        )


class HarnessLogTap(logging.Handler):
    """Bounded ring-buffer log tap capturing warnings/errors during harness runs."""

    def __init__(self, maxlen: int = 200) -> None:
        super().__init__(level=logging.WARNING)
        self._records: deque[str] = deque(maxlen=maxlen)

    def emit(self, record: logging.LogRecord) -> None:
        """Store formatted log line in bounded ring buffer."""
        try:
            self._records.append(f"{record.levelname} [{record.name}] {record.getMessage()}")
        except Exception:  # noqa: BLE001
            pass

    @property
    def lines(self) -> list[str]:
        """Return captured log lines in chronological order."""
        return list(self._records)


@dataclass
class ActionHistoryTap:
    """In-memory ring buffer capturing harness steps and state machine transitions."""

    maxlen: int = 500
    events: deque[dict[str, Any]] = field(init=False)

    def __post_init__(self) -> None:
        self.events = deque(maxlen=self.maxlen)

    def record(self, step: int, ts: float, kind: str, **detail: Any) -> None:
        """Append a structured diagnostic action entry."""
        self.events.append({"step": step, "ts": round(ts, 3), "kind": kind, **detail})


def build_feedback_envelope(
    *,
    test_name: str,
    inputs: dict[str, Any],
    assumptions: list[str],
    active_settings: dict[str, Any],
    action_history: list[dict[str, Any]],
    output_delta: dict[str, Any],
    captured_logs: list[str],
    reproduction_command: str,
) -> DiagnosticEnvelope:
    """Construct a Toolbelt-compliant 6-part agent feedback envelope."""
    return DiagnosticEnvelope(
        status="FAILED",
        test_name=test_name,
        inputs=inputs,
        assumptions=assumptions,
        active_settings=active_settings,
        action_history=action_history,
        output_delta=output_delta,
        captured_logs=captured_logs,
        reproduction_command=reproduction_command,
    )
