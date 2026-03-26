import logging

from sqlalchemy import text
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
        try:
            async with context.session.begin_nested():
                await context.session.execute(text(f"EXPLAIN {sql}"))
            return ToolResult(success=True, data={"valid": True})
        except Exception as exc:
            error_msg = str(exc).split("\n")[0]
            log.info("Validation failed: %s", error_msg)
            return ToolResult(success=False, data={"valid": False}, error=error_msg)
