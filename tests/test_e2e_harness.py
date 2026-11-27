"""End-to-end bounded liveness parameter sweep tests."""

from __future__ import annotations

import pytest

from custom_components.presence_detection_designer.const import OccupancyState
from tests.harness.scenario_runner import run_scenario


@pytest.mark.requirement("GUARD-01", category="GUARD", req_type="FailClosedGuardrail")
@pytest.mark.parametrize(
    ("inactivity_timeout", "max_hold_timeout", "threshold"),
    [
        (30, 120, 0.70),
        (60, 180, 0.75),
        (120, 300, 0.80),
        (45, 90, 0.65),
    ],
)
@pytest.mark.asyncio
async def test_e2e_parameter_sweep_bounded_liveness(
    inactivity_timeout: int, max_hold_timeout: int, threshold: float
) -> None:
    """@requirement GUARD-01: Bounded liveness holds across timeout and threshold parameter sweeps."""
    spec = {
        "name": f"sweep_{inactivity_timeout}_{max_hold_timeout}_{threshold}",
        "rooms": [
            {
                "room_name": "Study",
                "mode": "open",
                "inactivity_timeout": inactivity_timeout,
                "max_hold_timeout": max_hold_timeout,
                "bayesian_threshold": threshold,
                "trigger_entities": ["binary_sensor.study_pir"],
                "pir_validation_enabled": False,
                "sustaining_conditions": [{"entity_id": "switch.study_desk", "state": "on"}],
            }
        ],
        "initial_states": {"binary_sensor.study_pir": "off", "switch.study_desk": "off"},
        "steps": [
            {"at": 10, "set": {"binary_sensor.study_pir": "on", "switch.study_desk": "on"}},
            {"at": 20, "set": {"binary_sensor.study_pir": "off"}},
            {"at": 21, "expect": {"Study": {"occupancy_state": "occupied_holding"}}},
            # Even with switch stuck ON forever, room MUST vacate after max_hold_timeout + inactivity_timeout
            {"advance": float(max_hold_timeout + inactivity_timeout + 5)},
            {"expect": {"Study": {"occupancy_state": "vacant", "is_on": False}}},
        ],
    }
    result = await run_scenario(spec)
    assert result.snapshots["Study"]["occupancy_state"] == OccupancyState.VACANT
