"""Tool for saving LLM-inferred plan configuration from a template."""

import logging

from tools.base import BaseTool, ToolContext, ToolResult

log = logging.getLogger(__name__)


class InferPlanConfigTool(BaseTool):
    @property
    def name(self) -> str:
        return "infer_plan_config"

    @property
    def description(self) -> str:
        return (
            "Save the inferred plan configuration YAML. Fill in the plan template "
            "based on what you've learned from the conversation. Mark confirmed values "
            "normally, add '# inferred -- please confirm' comments for values you've "
            "guessed, and use 'TODO' for values you don't know yet."
        )

    @property
    def parameters_schema(self) -> dict:
        return {
            "type": "object",
            "properties": {
                "config_yaml": {
                    "type": "string",
                    "description": "The filled-in plan configuration as a YAML string",
                },
            },
            "required": ["config_yaml"],
        }

    async def execute(self, arguments: dict, context: ToolContext) -> ToolResult:
        """Save the inferred YAML config to the plan."""
        yaml_content = arguments.get("config_yaml", "").strip()
        if not yaml_content:
            return ToolResult(success=False, error="No config YAML provided")

        try:
            saved = await context.plan_service.save_inferred_config(yaml_content)
        except ValueError as exc:
            return ToolResult(success=False, error=str(exc))

        log.info("Saved inferred config (%d chars)", len(saved))
        return ToolResult(success=True, data={"saved_length": len(saved)})
