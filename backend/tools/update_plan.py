"""Tool for updating plan metadata."""

import logging

from tools.base import BaseTool, ToolContext, ToolResult

log = logging.getLogger(__name__)


class UpdatePlanTool(BaseTool):
    @property
    def name(self) -> str:
        return "update_plan"

    @property
    def description(self) -> str:
        return "Update plan metadata such as name, type, or frequency."

    @property
    def parameters_schema(self) -> dict:
        return {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "New plan name",
                },
                "plan_type": {
                    "type": "string",
                    "enum": ["RECURRING", "ONE_TIME"],
                    "description": "Plan type",
                },
                "frequency": {
                    "type": "string",
                    "enum": ["MONTHLY", "QUARTERLY", "ANNUALLY"],
                    "description": "Plan frequency",
                },
            },
        }

    async def execute(self, arguments: dict, context: ToolContext) -> ToolResult:
        fields = {k: v for k, v in arguments.items() if v is not None}
        if not fields:
            return ToolResult(success=True, data={"message": "No fields to update"})

        try:
            plan = await context.plan_service.update_plan(**fields)
        except ValueError as exc:
            return ToolResult(success=False, error=str(exc))

        return ToolResult(
            success=True,
            data={"updated_fields": list(fields.keys()), "plan": plan},
        )
