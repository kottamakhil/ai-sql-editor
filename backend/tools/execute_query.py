"""Tool for running read-only SQL queries for data exploration."""

import logging

from tools.base import BaseTool, ToolContext, ToolResult

log = logging.getLogger(__name__)

MAX_ROWS_IN_RESULT = 50


class ExecuteQueryTool(BaseTool):
    @property
    def name(self) -> str:
        return "execute_query"

    @property
    def description(self) -> str:
        return (
            "Execute a read-only SQL query against the database and return the results. "
            "Use this to explore data, answer questions about deals/employees/quotas, "
            "or verify assumptions before building commission SQL."
        )

    @property
    def parameters_schema(self) -> dict:
        return {
            "type": "object",
            "properties": {
                "sql": {
                    "type": "string",
                    "description": "SQL SELECT query to execute",
                },
            },
            "required": ["sql"],
        }

    async def execute(self, arguments: dict, context: ToolContext) -> ToolResult:
        sql = arguments.get("sql", "").strip()
        if not sql:
            return ToolResult(success=False, error="No SQL provided")

        log.info("Executing query: %s", sql[:200])
        result = await context.plan_service.execute_sql(sql)

        if result.get("error"):
            return ToolResult(success=False, error=result["error"])

        truncated = len(result["rows"]) > MAX_ROWS_IN_RESULT
        rows = result["rows"][:MAX_ROWS_IN_RESULT]

        return ToolResult(
            success=True,
            data={
                "columns": result["columns"],
                "rows": rows,
                "row_count": result["row_count"],
                "truncated": truncated,
            },
        )
