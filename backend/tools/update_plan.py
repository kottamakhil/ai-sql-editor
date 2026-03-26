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
        plan = context.plan
        updated_fields = []

        if "name" in arguments:
            plan.name = arguments["name"].strip()
            updated_fields.append("name")
        if "plan_type" in arguments:
            plan.plan_type = arguments["plan_type"].upper()
            updated_fields.append("plan_type")
        if "frequency" in arguments:
            plan.frequency = arguments["frequency"].upper()
            updated_fields.append("frequency")

        if not updated_fields:
            return ToolResult(success=True, data={"message": "No fields to update"})

        await context.session.commit()
        await context.reload_plan()
        log.info("Updated plan %s fields: %s", plan.id, updated_fields)

        return ToolResult(
            success=True,
            data={
                "updated_fields": updated_fields,
                "plan": {
                    "name": plan.name,
                    "plan_type": plan.plan_type,
                    "frequency": plan.frequency,
                },
            },
        )
