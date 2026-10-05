"""Config flow for Presence Detection Designer integration."""

from __future__ import annotations

from typing import Any

try:
    import voluptuous as vol
except ImportError:
    class MockVol:
        """Fallback for environments without voluptuous installed."""

        def Schema(self, schema: Any) -> Any:
            return schema

        def Required(self, key: Any, **kwargs: Any) -> Any:
            return key

        def Optional(self, key: Any, **kwargs: Any) -> Any:
            return key

        def In(self, choices: Any) -> Any:
            return choices

    vol = MockVol()

try:
    from homeassistant import config_entries
    from homeassistant.core import callback
    from homeassistant.helpers import selector
    if type(config_entries.ConfigFlow).__name__ == "MagicMock":
        raise ImportError
    BaseConfigFlow = config_entries.ConfigFlow
    BaseOptionsFlow = config_entries.OptionsFlow
except Exception:  # noqa: BLE001
    class BaseConfigFlow:
        """Mock base config flow."""

        def __init_subclass__(cls, domain: str | None = None, **kwargs: Any) -> None:
            super().__init_subclass__(**kwargs)
            cls.domain = domain

        def async_show_form(self, step_id: str, data_schema: Any, errors: dict[str, str]) -> dict[str, Any]:
            return {"type": "form", "step_id": step_id, "data_schema": data_schema, "errors": errors}

        def async_create_entry(self, title: str, data: dict[str, Any]) -> dict[str, Any]:
            return {"type": "create_entry", "title": title, "data": data}

    class BaseOptionsFlow:
        """Mock base options flow."""

        def __init__(self, config_entry: Any) -> None:
            self.config_entry = config_entry

    def callback(fn: Any) -> Any:
        return fn

    class MockSelector:
        """Mock selector helpers."""

        def TextSelector(self, *args: Any, **kwargs: Any) -> Any:
            return str

        def BooleanSelector(self, *args: Any, **kwargs: Any) -> Any:
            return bool

        def NumberSelector(self, *args: Any, **kwargs: Any) -> Any:
            return int

        def SelectSelector(self, *args: Any, **kwargs: Any) -> Any:
            return str

        def EntitySelector(self, *args: Any, **kwargs: Any) -> Any:
            return list

        def SelectSelectorConfig(self, *args: Any, **kwargs: Any) -> Any:
            return None

        def EntitySelectorConfig(self, *args: Any, **kwargs: Any) -> Any:
            return None

        def NumberSelectorConfig(self, *args: Any, **kwargs: Any) -> Any:
            return None

        class NumberSelectorMode:
            BOX = "box"

        class SelectSelectorMode:
            DROPDOWN = "dropdown"

    selector = MockSelector()

from .const import (
    CONF_BOUNDARY_ENTITIES,
    CONF_CAMERA_ENTITY,
    CONF_CAMERA_SNAPSHOT_URL,
    CONF_EXTEND_TIMEOUT,
    CONF_GRACE_TIMEOUT,
    CONF_INACTIVITY_TIMEOUT,
    CONF_LLM_API_KEY,
    CONF_LLM_API_URL,
    CONF_LLM_ENABLED,
    CONF_LLM_MODEL,
    CONF_MODE,
    CONF_ROOM_NAME,
    CONF_TRIGGER_ENTITIES,
    DEFAULT_EXTEND_TIMEOUT,
    DEFAULT_GRACE_TIMEOUT,
    DEFAULT_INACTIVITY_TIMEOUT,
    DOMAIN,
    Mode,
)


class PresenceDetectionDesignerConfigFlow(BaseConfigFlow, domain=DOMAIN):
    """Handle a config flow for Presence Detection Designer."""

    VERSION = 1

    def __init__(self) -> None:
        super().__init__()
        self.hass: Any = None
        self._data: dict[str, Any] = {}

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> dict[str, Any]:
        """Handle the initial room configuration step."""
        errors: dict[str, str] = {}

        if user_input is not None:
            room_name = user_input.get(CONF_ROOM_NAME, "").strip()
            if not room_name:
                errors["base"] = "invalid_name"
            else:
                self._data.update(user_input)
                return self.async_create_entry(
                    title=room_name,
                    data=self._data,
                )

        schema = vol.Schema(
            {
                vol.Required(CONF_ROOM_NAME): selector.TextSelector(),
                vol.Optional(CONF_MODE, default="open"): selector.SelectSelector(
                    selector.SelectSelectorConfig(
                        options=["bounded", "open"],
                        mode=selector.SelectSelectorMode.DROPDOWN,
                    )
                ),
                vol.Optional(CONF_BOUNDARY_ENTITIES): selector.EntitySelector(
                    selector.EntitySelectorConfig(domain="binary_sensor", multiple=True)
                ),
                vol.Optional(CONF_TRIGGER_ENTITIES): selector.EntitySelector(
                    selector.EntitySelectorConfig(domain="binary_sensor", multiple=True)
                ),
                vol.Optional(
                    CONF_INACTIVITY_TIMEOUT, default=DEFAULT_INACTIVITY_TIMEOUT
                ): selector.NumberSelector(
                    selector.NumberSelectorConfig(min=5, max=86400, mode=selector.NumberSelectorMode.BOX)
                ),
                vol.Optional(CONF_GRACE_TIMEOUT, default=DEFAULT_GRACE_TIMEOUT): selector.NumberSelector(
                    selector.NumberSelectorConfig(min=5, max=3600, mode=selector.NumberSelectorMode.BOX)
                ),
                vol.Optional(CONF_EXTEND_TIMEOUT, default=DEFAULT_EXTEND_TIMEOUT): selector.NumberSelector(
                    selector.NumberSelectorConfig(min=5, max=86400, mode=selector.NumberSelectorMode.BOX)
                ),
                vol.Optional(CONF_LLM_ENABLED, default=False): selector.BooleanSelector(),
                vol.Optional(CONF_CAMERA_ENTITY): selector.EntitySelector(
                    selector.EntitySelectorConfig(domain="camera")
                ),
                vol.Optional(CONF_CAMERA_SNAPSHOT_URL): selector.TextSelector(),
                vol.Optional(CONF_LLM_API_URL): selector.TextSelector(),
                vol.Optional(CONF_LLM_API_KEY): selector.TextSelector(),
                vol.Optional(CONF_LLM_MODEL, default="gpt-4o-mini"): selector.TextSelector(),
            }
        )

        return self.async_show_form(
            step_id="user",
            data_schema=schema,
            errors=errors,
        )

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: Any) -> PresenceDetectionDesignerOptionsFlow:
        """Get options flow."""
        return PresenceDetectionDesignerOptionsFlow(config_entry)


class PresenceDetectionDesignerOptionsFlow(BaseOptionsFlow):
    """Handle options flow for tuning presence rules."""

    def __init__(self, config_entry: Any) -> None:
        super().__init__(config_entry)
        self.config_entry = config_entry
        self.hass: Any = None

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> dict[str, Any]:
        """Manage the room presence options."""
        if user_input is not None:
            return {
                "type": "create_entry",
                "title": "",
                "data": user_input,
            }

        curr = {**self.config_entry.data, **self.config_entry.options}

        schema = vol.Schema(
            {
                vol.Optional(
                    CONF_INACTIVITY_TIMEOUT,
                    default=curr.get(CONF_INACTIVITY_TIMEOUT, DEFAULT_INACTIVITY_TIMEOUT),
                ): selector.NumberSelector(
                    selector.NumberSelectorConfig(min=5, max=86400, mode=selector.NumberSelectorMode.BOX)
                ),
                vol.Optional(
                    CONF_GRACE_TIMEOUT,
                    default=curr.get(CONF_GRACE_TIMEOUT, DEFAULT_GRACE_TIMEOUT),
                ): selector.NumberSelector(
                    selector.NumberSelectorConfig(min=5, max=3600, mode=selector.NumberSelectorMode.BOX)
                ),
                vol.Optional(
                    CONF_EXTEND_TIMEOUT,
                    default=curr.get(CONF_EXTEND_TIMEOUT, DEFAULT_EXTEND_TIMEOUT),
                ): selector.NumberSelector(
                    selector.NumberSelectorConfig(min=5, max=86400, mode=selector.NumberSelectorMode.BOX)
                ),
                vol.Optional(
                    CONF_LLM_ENABLED,
                    default=curr.get(CONF_LLM_ENABLED, False),
                ): selector.BooleanSelector(),
                vol.Optional(
                    CONF_CAMERA_ENTITY,
                    default=curr.get(CONF_CAMERA_ENTITY, ""),
                ): selector.EntitySelector(
                    selector.EntitySelectorConfig(domain="camera")
                ),
                vol.Optional(
                    CONF_CAMERA_SNAPSHOT_URL,
                    default=curr.get(CONF_CAMERA_SNAPSHOT_URL, ""),
                ): selector.TextSelector(),
                vol.Optional(
                    CONF_LLM_API_URL,
                    default=curr.get(CONF_LLM_API_URL, ""),
                ): selector.TextSelector(),
                vol.Optional(
                    CONF_LLM_API_KEY,
                    default=curr.get(CONF_LLM_API_KEY, ""),
                ): selector.TextSelector(),
                vol.Optional(
                    CONF_LLM_MODEL,
                    default=curr.get(CONF_LLM_MODEL, "gpt-4o-mini"),
                ): selector.TextSelector(),
            }
        )

        return {
            "type": "form",
            "step_id": "init",
            "data_schema": schema,
            "errors": {},
        }
