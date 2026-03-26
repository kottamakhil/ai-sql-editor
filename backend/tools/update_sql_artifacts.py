import logging

from executor import execute_artifact
from models import SqlArtifact
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

        old_count = len(context.artifacts)
        for old in list(context.artifacts):
            await context.session.delete(old)
        await context.session.commit()
        log.info("Deleted %d old artifact(s) for plan=%s", old_count, context.plan.id)

        for spec in specs:
            context.session.add(
                SqlArtifact(plan_id=context.plan.id, name=spec["name"], sql_expression=spec["sql"])
            )
        await context.session.commit()
        await context.reload_artifacts()
        log.info("Created %d artifact(s) for plan=%s", len(specs), context.plan.id)

        execution_results = []
        for artifact in context.artifacts:
            result = await execute_artifact(artifact, context.artifacts, context.session)
            execution_results.append({
                "name": artifact.name,
                "sql": artifact.sql_expression,
                "row_count": result.row_count,
                "columns": result.columns,
                "error": result.error,
            })

        has_errors = any(r["error"] for r in execution_results)
        return ToolResult(
            success=not has_errors,
            data={"artifacts": execution_results},
            error="Some artifacts failed execution" if has_errors else None,
        )
