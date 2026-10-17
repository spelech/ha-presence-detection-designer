"""Config flow for Presence Detection Designer integration."""

from __future__ import annotations

from typing import Any

try:
    import voluptuous as vol
except ImportError:  # pragma: no cover

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
    if hasattr(config_entries, "OptionsFlowWithConfigEntry"):
        BaseOptionsFlow = config_entries.OptionsFlowWithConfigEntry
    else:  # pragma: no cover
        BaseOptionsFlow = config_entries.OptionsFlow
except Exception:  # pragma: no cover  # noqa: BLE001

    class BaseConfigFlow:
        """Mock base config flow."""

        def __init_subclass__(cls, domain: str | None = None, **kwargs: Any) -> None:
            super().__init_subclass__(**kwargs)
            cls.domain = domain

        def async_show_form(
            self, step_id: str, data_schema: Any, errors: dict[str, str]
        ) -> dict[str, Any]:
            return {
                "type": "form",
                "step_id": step_id,
                "data_schema": data_schema,
                "errors": errors,
            }

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

        def AreaSelector(self, *args: Any, **kwargs: Any) -> Any:
            return str

        def ObjectSelector(self, *args: Any, **kwargs: Any) -> Any:
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
    CONF_AREA_ID,
    CONF_BAYESIAN_ENABLED,
    CONF_BAYESIAN_OBSERVATIONS,
    CONF_BAYESIAN_PRIOR,
    CONF_BAYESIAN_THRESHOLD,
    CONF_BOUNDARY_ENTITIES,
    CONF_CAMERA_ENTITY,
    CONF_CAMERA_SNAPSHOT_URL,
    CONF_EXTEND_TIMEOUT,
    CONF_GRACE_TIMEOUT,
    CONF_INACTIVITY_TIMEOUT,
    CONF_LLM_AGENT_ID,
    CONF_LLM_API_KEY,
    CONF_LLM_API_URL,
    CONF_LLM_ENABLED,
    CONF_LLM_MODEL,
    CONF_LLM_PROVIDER_TYPE,
    CONF_MODE,
    CONF_ROOM_NAME,
    CONF_SUSTAINING_CONDITIONS,
    CONF_TRIGGER_ENTITIES,
    DEFAULT_BAYESIAN_PRIOR,
    DEFAULT_BAYESIAN_THRESHOLD,
    DEFAULT_EXTEND_TIMEOUT,
    DEFAULT_GRACE_TIMEOUT,
    DEFAULT_INACTIVITY_TIMEOUT,
    DOMAIN,
    LLMProviderType,
)


def _build_common_fields(curr: dict[str, Any], include_room_name: bool = False) -> dict[Any, Any]:
    """Build shared schema fields for ConfigFlow and OptionsFlow."""
    fields: dict[Any, Any] = {}
    if include_room_name:
        fields[vol.Required(CONF_ROOM_NAME)] = selector.TextSelector()

    area_val = curr.get(CONF_AREA_ID)
    if area_val:
        fields[vol.Optional(CONF_AREA_ID, default=area_val)] = selector.AreaSelector()
    else:
        fields[vol.Optional(CONF_AREA_ID)] = selector.AreaSelector()

    fields[vol.Optional(CONF_MODE, default=curr.get(CONF_MODE, "open"))] = selector.SelectSelector(
        selector.SelectSelectorConfig(
            options=["bounded", "open"],
            mode=selector.SelectSelectorMode.DROPDOWN,
        )
    )
    fields[
        vol.Optional(
            CONF_BOUNDARY_ENTITIES,
            default=curr.get(CONF_BOUNDARY_ENTITIES, []),
        )
    ] = selector.EntitySelector(
        selector.EntitySelectorConfig(domain="binary_sensor", multiple=True)
    )
    fields[
        vol.Optional(
            CONF_TRIGGER_ENTITIES,
            default=curr.get(CONF_TRIGGER_ENTITIES, []),
        )
    ] = selector.EntitySelector(
        selector.EntitySelectorConfig(domain="binary_sensor", multiple=True)
    )
    fields[
        vol.Optional(
            CONF_SUSTAINING_CONDITIONS,
            default=curr.get(CONF_SUSTAINING_CONDITIONS, []),
        )
    ] = selector.ObjectSelector()
    fields[
        vol.Optional(
            CONF_BAYESIAN_ENABLED,
            default=curr.get(CONF_BAYESIAN_ENABLED, True),
        )
    ] = selector.BooleanSelector()
    fields[
        vol.Optional(
            CONF_BAYESIAN_PRIOR,
            default=curr.get(CONF_BAYESIAN_PRIOR, DEFAULT_BAYESIAN_PRIOR),
        )
    ] = selector.NumberSelector(
        selector.NumberSelectorConfig(
            min=0.01, max=0.95, step=0.01, mode=selector.NumberSelectorMode.BOX
        )
    )
    fields[
        vol.Optional(
            CONF_BAYESIAN_THRESHOLD,
            default=curr.get(CONF_BAYESIAN_THRESHOLD, DEFAULT_BAYESIAN_THRESHOLD),
        )
    ] = selector.NumberSelector(
        selector.NumberSelectorConfig(
            min=0.10, max=0.99, step=0.01, mode=selector.NumberSelectorMode.BOX
        )
    )
    fields[
        vol.Optional(
            CONF_BAYESIAN_OBSERVATIONS,
            default=curr.get(CONF_BAYESIAN_OBSERVATIONS, []),
        )
    ] = selector.ObjectSelector()
    fields[
        vol.Optional(
            CONF_INACTIVITY_TIMEOUT,
            default=curr.get(CONF_INACTIVITY_TIMEOUT, DEFAULT_INACTIVITY_TIMEOUT),
        )
    ] = selector.NumberSelector(
        selector.NumberSelectorConfig(min=5, max=86400, mode=selector.NumberSelectorMode.BOX)
    )
    fields[
        vol.Optional(
            CONF_GRACE_TIMEOUT,
            default=curr.get(CONF_GRACE_TIMEOUT, DEFAULT_GRACE_TIMEOUT),
        )
    ] = selector.NumberSelector(
        selector.NumberSelectorConfig(min=5, max=3600, mode=selector.NumberSelectorMode.BOX)
    )
    fields[
        vol.Optional(
            CONF_EXTEND_TIMEOUT,
            default=curr.get(CONF_EXTEND_TIMEOUT, DEFAULT_EXTEND_TIMEOUT),
        )
    ] = selector.NumberSelector(
        selector.NumberSelectorConfig(min=5, max=86400, mode=selector.NumberSelectorMode.BOX)
    )
    fields[
        vol.Optional(
            CONF_LLM_ENABLED,
            default=curr.get(CONF_LLM_ENABLED, False),
        )
    ] = selector.BooleanSelector()
    fields[
        vol.Optional(
            CONF_LLM_PROVIDER_TYPE,
            default=curr.get(CONF_LLM_PROVIDER_TYPE, str(LLMProviderType.VISION_API)),
        )
    ] = selector.SelectSelector(
        selector.SelectSelectorConfig(
            options=[
                str(LLMProviderType.VISION_API),
                str(LLMProviderType.CONVERSATION),
                str(LLMProviderType.AI_TASK),
            ],
            mode=selector.SelectSelectorMode.DROPDOWN,
        )
    )

    camera_ent = curr.get(CONF_CAMERA_ENTITY)
    if camera_ent:
        fields[vol.Optional(CONF_CAMERA_ENTITY, default=camera_ent)] = selector.EntitySelector(
            selector.EntitySelectorConfig(domain="camera")
        )
    else:
        fields[vol.Optional(CONF_CAMERA_ENTITY)] = selector.EntitySelector(
            selector.EntitySelectorConfig(domain="camera")
        )

    fields[
        vol.Optional(
            CONF_CAMERA_SNAPSHOT_URL,
            default=curr.get(CONF_CAMERA_SNAPSHOT_URL, ""),
        )
    ] = selector.TextSelector()
    fields[
        vol.Optional(
            CONF_LLM_AGENT_ID,
            default=curr.get(CONF_LLM_AGENT_ID, ""),
        )
    ] = selector.TextSelector()
    fields[
        vol.Optional(
            CONF_LLM_API_URL,
            default=curr.get(CONF_LLM_API_URL, ""),
        )
    ] = selector.TextSelector()
    fields[
        vol.Optional(
            CONF_LLM_API_KEY,
            default=curr.get(CONF_LLM_API_KEY, ""),
        )
    ] = selector.TextSelector()
    fields[
        vol.Optional(
            CONF_LLM_MODEL,
            default=curr.get(CONF_LLM_MODEL, "gpt-4o-mini"),
        )
    ] = selector.TextSelector()

    return fields


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

        schema = vol.Schema(_build_common_fields({}, include_room_name=True))

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

    def __init__(self, config_entry: Any = None) -> None:
        try:
            super().__init__(config_entry)
        except TypeError:
            super().__init__()
        if getattr(self, "config_entry", None) is None:
            try:
                self.config_entry = config_entry
            except AttributeError:
                self._config_entry = config_entry

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> dict[str, Any]:
        """Manage the room presence options."""
        if user_input is not None:
            create_fn = getattr(self, "async_create_entry", None)
            if callable(create_fn):
                return create_fn(title="", data=user_input)
            return {
                "type": "create_entry",
                "title": "",
                "data": user_input,
            }

        entry = getattr(self, "config_entry", None) or getattr(self, "_config_entry", None)
        curr = {**(getattr(entry, "data", {}) or {}), **(getattr(entry, "options", {}) or {})}
        schema = vol.Schema(_build_common_fields(curr, include_room_name=False))

        show_fn = getattr(self, "async_show_form", None)
        if callable(show_fn):
            return show_fn(
                step_id="init",
                data_schema=schema,
                errors={},
            )
        return {
            "type": "form",
            "step_id": "init",
            "data_schema": schema,
            "errors": {},
        }
