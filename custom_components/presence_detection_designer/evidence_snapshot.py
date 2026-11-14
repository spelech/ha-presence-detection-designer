"""Normalized room evidence snapshot decoupling sensor/spatial evaluation from state transitions."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class RoomEvidenceSnapshot:
    """Immutable snapshot of all room evidence evaluated by RoomPresenceStateMachine."""

    active_triggers: frozenset[str] = frozenset()
    active_conditions: tuple[str, ...] = ()
    bayesian_occupied: bool = False
    bayesian_probability: float = 0.0
    bayesian_probability_pct: float = 0.0
    bayesian_summary: str = ""
    active_observations: tuple[dict[str, Any], ...] = ()
    inactive_observations: tuple[dict[str, Any], ...] = ()
    human_present: bool = False
    pet_present: bool = False
    spatial_blind_pocket_hold: bool = False
    camera_confirmed: bool = False
    last_trigger_entity: str | None = None

    @property
    def is_pet_only(self) -> bool:
        """Return True when only pet presence is observed without confirmed human presence."""
        return bool(self.pet_present and not self.human_present and not self.camera_confirmed)

    @property
    def human_evidence_active(self) -> bool:
        """Return True when direct non-pet human occupancy evidence is active."""
        if self.is_pet_only:
            return False
        return bool(
            self.active_triggers
            or self.camera_confirmed
            or self.bayesian_occupied
            or self.human_present
        )

    @property
    def has_hold_evidence(self) -> bool:
        """Return True when secondary non-motion evidence justifies bounded holding."""
        if self.is_pet_only:
            return False
        return bool(self.active_conditions or self.spatial_blind_pocket_hold)
