"""Tool for updating plan payout, payroll, and dispute configuration."""

import logging

from tools.base import BaseTool, ToolContext, ToolResult

log = logging.getLogger(__name__)


class UpdatePlanConfigTool(BaseTool):
    @property
    def name(self) -> str:
        return "update_plan_config"

    @property
    def description(self) -> str:
        return (
            "Update the plan's payout, payroll, or dispute configuration. "
            "Provide any combination of config sections to update."
        )

    @property
    def parameters_schema(self) -> dict:
        return {
            "type": "object",
            "properties": {
                "payout": {
                    "type": "object",
                    "description": "Payout timing configuration",
                    "properties": {
                        "is_automatic_payout_enabled": {
                            "type": "boolean",
                            "description": "Enable automatic payout triggering (vs manual)",
                        },
                        "final_payment_offset": {
                            "type": "integer",
                            "description": "Days after cycle end to send final payment",
                        },
                        "is_draws_enabled": {
                            "type": "boolean",
                            "description": "Enable intermediate draw payouts during the cycle",
                        },
                        "draw_frequency": {
                            "type": "string",
                            "enum": ["MONTHLY"],
                            "description": "Frequency of automatic draws",
                        },
                    },
                },
                "payroll": {
                    "type": "object",
                    "description": "Payroll integration configuration",
                    "properties": {
                        "payout_type": {
                            "type": "string",
                            "enum": ["BONUS", "COMMISSION"],
                            "description": "How payouts are treated in payroll",
                        },
                    },
                },
                "disputes": {
                    "type": "object",
                    "description": "Dispute configuration",
                    "properties": {
                        "is_disputes_enabled": {
                            "type": "boolean",
                            "description": "Whether disputes are enabled for this plan",
                        },
                    },
                },
            },
        }

    async def execute(self, arguments: dict, context: ToolContext) -> ToolResult:
        """Merge the provided config sections into the plan's current config."""
        if not arguments:
            return ToolResult(success=True, data={"message": "No config fields to update"})

        try:
            updated_config = await context.plan_service.update_plan_config(arguments)
        except ValueError as exc:
            return ToolResult(success=False, error=str(exc))

        log.info("Updated plan config sections: %s", list(arguments.keys()))
        return ToolResult(success=True, data={"config": updated_config})
