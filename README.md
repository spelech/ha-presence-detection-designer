<div align="center">

<img src="brand/logo.png" alt="Presence Detection Designer Logo" width="600" />

# Presence Detection Designer (`ha-presence-detection-designer`)

**Intelligent Home Assistant Presence State Machine with Hybrid Wasp-in-a-Box (WIB), Explainable Bayesian Sensor Fusion, Dynamic Sustaining Conditions & Bidirectional AI/LLM Integration.**

[![CI Quality Gate](https://github.com/spelech/ha-presence-detection-designer/actions/workflows/ci.yml/badge.svg)](https://github.com/spelech/ha-presence-detection-designer/actions/workflows/ci.yml)
[![HACS Custom](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://hacs.xyz/)
[![Python Version](https://img.shields.io/badge/python-3.12%20%7C%203.13%20%7C%203.14-blue.svg)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Code Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen.svg)](https://github.com/spelech/ha-presence-detection-designer)

</div>

---

## 🌟 Why Presence Detection Designer?

Passive infrared (PIR) motion sensors, slow thermostat occupancy sensors, and raw Bayesian YAML sensors each struggle in isolation:
- **Stationary Occupancy Failure**: Watching a movie on the couch, reading in bed, or working at a desk? Motion clears and room lights shut off.
- **Opaque Bayesian Math**: Standard `platform: bayesian` sensors require hand-tuning raw `prob_given_true` / `prob_given_false` floats and penalize multi-zone rooms when an occupant is only sitting in one sub-zone.
- **Open vs Bounded Rooms**: Traditional Wasp-in-a-Box setups assume every room has closed perimeter doors.

**Presence Detection Designer** solves this by uniting **four coordinated layers**:
1. **Explainable Bayesian Sensor Fusion**: Uses intuitive natural-language weight presets (`decisive`, `strong`, `moderate`, `supporting`) that compute real-time posterior occupancy probability (`0–100%`) and explain in plain English why a room is considered occupied or vacant.
2. **Hybrid Wasp-in-a-Box (WIB)**: Distinguishes between enclosed rooms (with door sensors that seal presence inside) and open-concept zones.
3. **Dynamic Sustaining Conditions**: Preserves occupancy while secondary devices indicate presence (e.g., TV playing, workstation UPS power draw > 140W, shower exhaust fan running).
4. **AI Vision Pre-Vacate Guard & Bidirectional LLM Config Translator**: Before marking a room vacant, captures a camera snapshot to visually confirm if a stationary human is still present—and provides services to translate back and forth between natural-language descriptions and Home Assistant YAML.

---

## 🧮 Explainable Bayesian Weight Presets

With the default **20% baseline prior** and **75% occupancy threshold**, sensors can be assigned human-friendly presets instead of raw probabilities:

| Preset | `prob_given_true` | `prob_given_false` | Likelihood Ratio | Solo Posterior | Behavior & Typical Use Case |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **`decisive`** | `0.95` | `0.02` | `47.5x` | **92.2%** | Crosses 75% immediately solo. Use for specific Frigate 2K seating/bed/desk sub-zones. |
| **`strong`** | `0.85` | `0.05` | `17.0x` | **81.0%** | Crosses 75% solo. Use for full-room camera person detection, primary PIR motion, or active media/workstation power draw. |
| **`moderate`** | `0.72` | `0.12` | `6.0x` | **60.0%** | Needs corroboration (`moderate` + `supporting` = **80.5%**). Use for Bermuda BLE phone area localization or secondary/doorway motion. |
| **`supporting`** | `0.55` | `0.20` | `2.75x` | **40.7%** | Corroborating context; cannot trigger occupancy solo or in pairs (`65.4%`). Use for slow 30-min Ecobee occupancy tails or pet/light context. |

---

## 📦 Entities Created per Room

| Entity | Domain | Purpose |
| :--- | :--- | :--- |
| `binary_sensor.<room>_presence` | `binary_sensor` (`occupancy`) | Primary room presence output with `natural_language_explanation`, `bayesian_probability_pct`, `box_state`, and `active_evidence` attributes. |
| `sensor.<room>_occupancy_probability` | `sensor` (`%`) | Live `0.0–100.0%` Bayesian occupancy probability with `rule_guide`, `active_observations`, `ha_bayesian_yaml`, and `designer_yaml` attributes. |
| `button.<room>_verify_presence` | `button` | Triggers an immediate camera snapshot capture and AI vision verification check. |
| `switch.<room>_presence_override` | `switch` | Locks presence ON indefinitely (parties, guests, cleaning). |

---

## 🛎️ Services / Actions

### `presence_detection_designer.explain_presence`
Returns a structured response (`SupportsResponse.OPTIONAL`) containing the room's live Bayesian probability, per-sensor percentage lift, plain-English rule guide, conversational LLM explanation, and equivalent YAML:
```yaml
action: presence_detection_designer.explain_presence
data:
  room_name: "Office"
  use_llm: true
```

### `presence_detection_designer.translate_config`
Bidirectionally translates between **Natural Language <-> YAML / Designer Configuration**:
```yaml
# Natural Language -> Designer YAML & HA platform: bayesian YAML
action: presence_detection_designer.translate_config
data:
  direction: "to_yaml"
  room_name: "Office"
  description: >
    Use Steve's Desk and Sim Rig Frigate person sensors as decisive triggers,
    Office UPS watts > 140W as a strong sustaining condition, and Steve's S25+
    BLE area == Office as a moderate Bayesian signal with Ecobee occupancy as supporting.
  use_llm: true
```

### `presence_detection_designer.configure_room`
Applies a YAML or JSON room configuration directly to a room config entry and reloads it live:
```yaml
action: presence_detection_designer.configure_room
data:
  room_name: "Office"
  config:
    mode: "open"
    bayesian_prior: 0.20
    bayesian_threshold: 0.75
```

### `presence_detection_designer.verify_presence` & `presence_detection_designer.force_refresh`
Manually trigger a Vision LLM snapshot check or immediately re-evaluate all boundaries, triggers, sustaining conditions, and Bayesian observations.

---

## 🧪 Development & Quality Gates

```bash
# Verify version sync across pyproject.toml and manifest.json
python3 scripts/verify_release.py --ci

# Run Ruff lint and format check
uv run ruff check .
uv run ruff format --check .

# Run pytest with >= 80% coverage enforcement
uv run pytest --cov=custom_components/presence_detection_designer --cov-fail-under=80 -v
```

---

## 📄 License

Distributed under the [MIT License](LICENSE). Copyright &copy; 2026 Steven T. Pelech.
