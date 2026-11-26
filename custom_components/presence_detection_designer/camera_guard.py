"""Vision AI rejection cooldown guard for camera triggers."""

from __future__ import annotations

import time
from typing import Any

DEFAULT_CAM_REJECT_COOLDOWN_SEC = 180.0


def is_camera_verification_rejected(coord: Any, now_ts: float | None = None) -> bool:
    """Return True if camera triggers are currently suppressed after Vision AI rejection or manual clear."""
    rejected_until = float(getattr(coord, "_cam_verify_rejected_until", 0.0) or 0.0)
    if rejected_until <= 0.0:
        return False
    now = float(now_ts) if now_ts is not None else time.time()
    return now < rejected_until
