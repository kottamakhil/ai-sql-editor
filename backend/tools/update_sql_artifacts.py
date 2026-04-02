"""Tool for replacing all SQL artifacts on the current plan."""

import logging

from tools.base import BaseTool, ToolContext, ToolResult

log = logging.getLogger(__name__)


class UpdateSqlArtifactsTool(BaseTool):
    @property
    def name(self) -> str:
        return "update_sql_artifacts"

    @property
    def description(self) -> str:
        return (
            "Replace ALL SQL artifacts for the commission plan. "
            "Provide the complete set of named CTE artifacts. "
            "The final artifact must be named 'payout'."
        )

    @property
    def parameters_schema(self) -> dict:
        return {
            "type": "object",
            "properties": {
                "artifacts": {
                    "type": "array",
                    "description": "Complete set of SQL artifacts for the plan",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {
                                "type": "string",
                                "description": "CTE name (final must be 'payout')",
                            },
                            "sql": {
                                "type": "string",
                                "description": "SQL SELECT expression",
                            },
                        },
                        "required": ["name", "sql"],
                    },
                },
            },
            "required": ["artifacts"],
        }

    async def execute(self, arguments: dict, context: ToolContext) -> ToolResult:
        specs = arguments.get("artifacts", [])
        if not specs:
            return ToolResult(success=False, error="No artifacts provided")

        try:
            results = await context.plan_service.replace_artifacts(
                specs, on_progress=context.on_progress,
            )
        except ValueError as exc:
            return ToolResult(success=False, error=str(exc))

        has_errors = any(r.get("error") for r in results)
        return ToolResult(
            success=not has_errors,
            data={"artifacts": results},
            error="Some artifacts failed execution" if has_errors else None,
        )
