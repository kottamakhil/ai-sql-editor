"""Tool for creating a new commission plan."""

import logging

from tools.base import BaseTool, ToolContext, ToolResult

log = logging.getLogger(__name__)


class CreatePlanTool(BaseTool):
    @property
    def name(self) -> str:
        return "create_plan"

    @property
    def description(self) -> str:
        return (
            "Create a new commission plan. Use this when the user asks to build a new plan "
            "and no plan exists yet. After creating, use update_sql_artifacts to add the SQL."
        )

    @property
    def parameters_schema(self) -> dict:
        return {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "Plan name (e.g. 'Q1 Sales Commission')",
                },
                "plan_type": {
                    "type": "string",
                    "enum": ["RECURRING", "ONE_TIME"],
                    "description": "Plan type (defaults to RECURRING)",
                },
                "frequency": {
                    "type": "string",
                    "enum": ["MONTHLY", "QUARTERLY", "ANNUALLY"],
                    "description": "Plan frequency (defaults to QUARTERLY)",
                },
            },
            "required": ["name"],
        }

    async def execute(self, arguments: dict, context: ToolContext) -> ToolResult:
        name = arguments.get("name", "").strip()
        if not name:
            return ToolResult(success=False, error="Plan name is required")

        plan_type = arguments.get("plan_type", "RECURRING")
        frequency = arguments.get("frequency", "QUARTERLY")

        plan = await context.plan_service.create_plan(name, plan_type, frequency)
        log.info("Created plan: %s", plan)
        return ToolResult(success=True, data={"plan": plan})
