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
            "and no plan exists yet. Infer start_date and end_date from the user's request. "
            "After creating, use update_sql_artifacts to add the SQL."
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
                "start_date": {
                    "type": "string",
                    "description": "Plan start date in ISO 8601 format (e.g. '2026-01-01'). Infer from context.",
                },
                "end_date": {
                    "type": "string",
                    "description": "Plan end date in ISO 8601 format (e.g. '2026-12-31'). Infer from context.",
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
        start_date = arguments.get("start_date")
        end_date = arguments.get("end_date")

        plan = await context.plan_service.create_plan(
            name, plan_type, frequency,
            start_date=start_date,
            end_date=end_date,
        )
        log.info("Created plan: %s", plan)
        return ToolResult(success=True, data={"plan": plan})
