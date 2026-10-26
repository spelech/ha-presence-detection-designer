# Slack Presence Notifications & Diagnostic Attribution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement real-time Slack notifications via Home Assistant's `notify.scdbots` integration to `#presence-alerts` on room presence changes with rich diagnostic attribution, per-room controls, and a studio test button.

**Architecture:** A modular `notifications.py` module providing driver attribution analysis, Slack message formatting, and non-blocking asynchronous dispatching integrated into `coordinator.py` on state machine transitions. Global and per-room configuration stored in `.storage` and exposed via REST API and the Visual Studio Web Component UI.

**Tech Stack:** Python 3.12, Home Assistant Core, pytest, vanilla Web Components (Shadow DOM + CSS/JS).

## Global Constraints
- Standalone repo: `~/Repos/ha-presence-detection-designer` on branch `feature/slack-presence-notifications`.
- Do not commit or open PRs for this component inside `823SCD-HomeAssistant` repo; only sync deployed files to `/ha/823SCD-Docker/custom_components/presence_detection_designer/`.
- All CI workflows (Hassfest, HACS, Pytest, Ruff check & format) must pass.
- Any UI pull requests must include visual screenshots in the PR description.

---

### Task 1: Notifications Module & Driver Attribution Engine (`notifications.py`)

**Files:**
- Create: `custom_components/presence_detection_designer/notifications.py`
- Test: `tests/test_notifications.py`

**Interfaces:**
- Produces:
  ```python
  @dataclass
  class TransitionAttribution:
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
      arrival_context: str | None
      duration_occupied_str: str | None
      timestamp: datetime


  class NotificationDispatcher:
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
      ) -> TransitionAttribution: ...
      def format_slack_message(self, attribution: TransitionAttribution) -> dict[str, Any]: ...
      async def async_dispatch_notification(
          self,
          hass: HomeAssistant,
          attribution: TransitionAttribution,
          global_settings: dict[str, Any],
          room_config: dict[str, Any],
      ) -> bool: ...
  ```

- [ ] **Step 1: Write failing unit tests for `notifications.py`**
  Create `tests/test_notifications.py` testing:
  - Driver attribution on `clear` $\rightarrow$ `occupied` when an observation triggers.
  - Driver attribution on `clear` $\rightarrow$ `occupied` when a sustaining condition is active.
  - Driver attribution on `occupied` $\rightarrow$ `clear` with inactivity timer expiry and duration formatting.
  - Slack message formatting output strings and blocks.
  - Debounce suppression when identical transitions occur within 5 seconds.
  - Async dispatch calling `hass.services.async_call("notify", "scdbots", ...)` and firing `presence_detection_designer_transition`.

- [ ] **Step 2: Run pytest to confirm failures**
  Run `uv run pytest tests/test_notifications.py` and verify module missing errors.

- [ ] **Step 3: Implement `notifications.py`**
  Create `custom_components/presence_detection_designer/notifications.py` with:
  - `TransitionAttribution` dataclass.
  - `resolve_transition_driver` inspecting observation probabilities, sustaining conditions, and timeouts.
  - `format_slack_message` generating markdown message and attachment blocks.
  - `NotificationDispatcher` tracking recent dispatches for debounce, calling `hass.services.async_call`, and firing HA bus event.

- [ ] **Step 4: Run pytest and ruff**
  Run `uv run pytest tests/test_notifications.py` and `uv run ruff check .` to verify clean tests.

- [ ] **Step 5: Commit Task 1**
  `git add custom_components/presence_detection_designer/notifications.py tests/test_notifications.py && git commit -m "feat(notifications): implement driver attribution engine and slack dispatcher"`

---

### Task 2: Coordinator Integration & State Machine Hooks

**Files:**
- Modify: `custom_components/presence_detection_designer/coordinator.py`
- Modify: `custom_components/presence_detection_designer/const.py`
- Test: `tests/test_presence_designer_coordinator_notifications.py`

**Interfaces:**
- Consumes: `NotificationDispatcher` from `notifications.py`
- Produces: Integrated state change detection in `PresenceCoordinator._evaluate_room` and automatic notification dispatching.

- [ ] **Step 1: Write unit tests for coordinator state transition dispatching**
  Create `tests/test_presence_designer_coordinator_notifications.py` testing:
  - Coordinator triggers notification when room transitions `clear` $\rightarrow$ `occupied` with `notify_slack: True`.
  - Coordinator skips notification when room has `notify_slack: False` or `notifications_enabled: False`.
  - Coordinator passes adjacent room handoff context into attribution.

- [ ] **Step 2: Run pytest to confirm failures**
  Run `uv run pytest tests/test_presence_designer_coordinator_notifications.py`.

- [ ] **Step 3: Update `const.py` and `coordinator.py`**
  - Add default global settings keys in `const.py`:
    - `CONF_NOTIFICATIONS_ENABLED = "notifications_enabled"` (default: `True`)
    - `CONF_SLACK_NOTIFY_SERVICE = "slack_notify_service"` (default: `"notify.scdbots"`)
    - `CONF_SLACK_CHANNEL = "slack_channel"` (default: `"#presence-alerts"`)
    - `EVENT_PRESENCE_TRANSITION = "presence_detection_designer_transition"`
  - In `coordinator.py`:
    - Instantiate `self._notification_dispatcher = NotificationDispatcher()`
    - Maintain `self._room_occupied_start_times: dict[str, datetime]`
    - Maintain `self._previous_room_evaluations: dict[str, dict[str, Any]]`
    - When `room_state.is_occupied` differs from previous state, call `async_dispatch_notification`.

- [ ] **Step 4: Verify all coordinator and notification tests pass**
  Run `uv run pytest tests/test_presence_designer_coordinator_notifications.py tests/test_notifications.py`.

- [ ] **Step 5: Commit Task 2**
  `git commit -am "feat(coordinator): hook room state machine transitions to slack notification dispatcher"`

---

### Task 3: Backend Test Notification API Endpoint (`views.py`)

**Files:**
- Modify: `custom_components/presence_detection_designer/views.py`
- Test: `tests/test_views.py`

**Interfaces:**
- Produces: `POST /api/presence_detection_designer/notifications/test` endpoint accepting optional service/channel override and triggering a test Slack card.

- [ ] **Step 1: Write failing test in `tests/test_views.py`**
  Add test for `POST /api/presence_detection_designer/notifications/test`.

- [ ] **Step 2: Run pytest to confirm failure**
  Run `uv run pytest tests/test_views.py -k test_notifications`.

- [ ] **Step 3: Implement `PresenceDesignerTestNotificationView` in `views.py`**
  - Register route `POST /api/presence_detection_designer/notifications/test`.
  - Invoke `coordinator.async_send_test_notification()`.
  - Return JSON `{ "success": True, "message": "Test notification dispatched to #presence-alerts" }`.

- [ ] **Step 4: Verify test passes**
  Run `uv run pytest tests/test_views.py`.

- [ ] **Step 5: Commit Task 3**
  `git commit -am "feat(api): add test notification endpoint for slack diagnostics"`

---

### Task 4: Visual Studio UI — Global Settings & Room Inspector (`panel.js`)

**Files:**
- Modify: `custom_components/presence_detection_designer/static/panel.js`

**Interfaces:**
- Consumes: `/api/presence_detection_designer/notifications/test` and `/api/presence_detection_designer/global_settings`
- Produces:
  - Global Settings Modal: Slack notifications master toggle, service input, channel input, and "Send Test Alert" button.
  - Room Inspector: "Slack Notifications" card with `notify_slack`, `notify_on_occupied`, `notify_on_cleared` checkboxes.

- [ ] **Step 1: Add Slack configuration fields to Global Settings modal in `panel.js`**
  - Render master toggle, service input (`notify.scdbots`), channel input (`#presence-alerts`).
  - Add "Send Test Alert" button with visual loading and success toast.
  - Wire save handler to include notification settings in `saveGlobalSettings()`.

- [ ] **Step 2: Add Slack Alerts card to Room Inspector in `panel.js`**
  - In room configuration drawer/tab, render Slack Alerts card:
    - `notify_slack` toggle
    - `notify_on_occupied` checkbox
    - `notify_on_cleared` checkbox
  - Include fields in `_saveRoomConfig()` and draft states.

- [ ] **Step 3: Test in Chrome DevTools / `agent-preview`**
  - Publish preview and inspect elements in `chrome-devtools`.
  - Verify UI toggles render smoothly and react to state changes.

- [ ] **Step 4: Capture UI Screenshot**
  - Save to `docs/screenshots/slack_notifications_ui_settings.png`.

- [ ] **Step 5: Commit Task 4**
  `git commit -am "feat(ui): add slack notifications controls to global settings and room inspector"`

---

### Task 5: Full Test Suite Verification, HA Deployment & PR

**Files:**
- Full suite test run
- Deployment sync

- [ ] **Step 1: Run complete test suite and code quality checks**
  Run `uv run pytest`, `uv run ruff check .`, `uv run ruff format --check .`.

- [ ] **Step 2: Sync to Home Assistant directory**
  `rsync -av --delete /home/steve/Repos/ha-presence-detection-designer/custom_components/presence_detection_designer/ /ha/823SCD-Docker/custom_components/presence_detection_designer/`.

- [ ] **Step 3: Push branch and create PR**
  Push `feature/slack-presence-notifications`, create PR via `gh pr create` with embedded screenshots and summary.

- [ ] **Step 4: Watch CI checks and squash-merge**
  Ensure all 10 GitHub Actions checks pass, squash-merge to `main`, and clean up branch.
