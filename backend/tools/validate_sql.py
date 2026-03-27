"""Tool for validating SQL syntax without executing it."""

import logging

from tools.base import BaseTool, ToolContext, ToolResult

log = logging.getLogger(__name__)


class ValidateSqlTool(BaseTool):
    @property
    def name(self) -> str:
        return "validate_sql"

    @property
    def description(self) -> str:
        return (
            "Validate a SQL query without returning data. "
            "Use this to check if SQL is syntactically correct and all referenced "
            "tables/columns exist before committing artifacts."
        )

    @property
    def parameters_schema(self) -> dict:
        return {
            "type": "object",
            "properties": {
                "sql": {
                    "type": "string",
                    "description": "SQL query to validate",
                },
            },
            "required": ["sql"],
        }

    async def execute(self, arguments: dict, context: ToolContext) -> ToolResult:
        sql = arguments.get("sql", "").strip()
        if not sql:
            return ToolResult(success=False, error="No SQL provided")

        log.info("Validating SQL: %s", sql[:200])
        result = await context.plan_service.validate_sql(sql)

        if result["valid"]:
            return ToolResult(success=True, data={"valid": True})
        return ToolResult(success=False, data={"valid": False}, error=result["error"])
