import logging
import re

from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from models import SqlArtifact

log = logging.getLogger(__name__)


class ExecutionResult(BaseModel):
    columns: list[str]
    rows: list[list]
    row_count: int
    error: str | None = None


async def execute_artifact(artifact: SqlArtifact, all_plan_artifacts: list[SqlArtifact], session: AsyncSession) -> ExecutionResult:
    named_artifacts = {a.name: a for a in all_plan_artifacts if a.name}
    deps = _resolve_dependencies(artifact, named_artifacts)
    composed_sql = _build_cte_query(deps, artifact.sql_expression)
    log.info("Executing artifact name=%s, deps=%s", artifact.name, [d.name for d in deps])
    log.info("Composed SQL: %s", composed_sql[:200])
    return await _run_sql(composed_sql, session)


async def execute_raw_sql(sql_expression: str, session: AsyncSession) -> ExecutionResult:
    return await _run_sql(sql_expression, session)


async def execute_plan_preview(artifacts: list[SqlArtifact], session: AsyncSession) -> ExecutionResult:
    if not artifacts:
        return ExecutionResult(columns=[], rows=[], row_count=0, error="No artifacts in plan")

    named_artifacts = {a.name: a for a in artifacts if a.name}
    final_artifact = _find_final_artifact(artifacts)
    deps = _resolve_dependencies(final_artifact, named_artifacts)
    composed_sql = _build_cte_query(deps, final_artifact.sql_expression)
    return await _run_sql(composed_sql, session)


def _find_final_artifact(artifacts: list[SqlArtifact]) -> SqlArtifact:
    payout = [a for a in artifacts if a.name == "payout"]
    if payout:
        return payout[-1]
    return artifacts[-1]


def _resolve_dependencies(
    artifact: SqlArtifact,
    named_artifacts: dict[str, SqlArtifact],
) -> list[SqlArtifact]:
    ordered: list[SqlArtifact] = []
    visited: set[str] = set()
    in_stack: set[str] = set()

    def visit(name: str) -> None:
        if name in visited:
            return
        if name in in_stack:
            raise ValueError(f"Cycle detected involving artifact '{name}'")

        in_stack.add(name)
        dep_artifact = named_artifacts[name]
        for ref_name in _find_references(dep_artifact.sql_expression, named_artifacts):
            visit(ref_name)
        in_stack.discard(name)
        visited.add(name)
        ordered.append(dep_artifact)

    for ref_name in _find_references(artifact.sql_expression, named_artifacts):
        visit(ref_name)

    return ordered


def _find_references(sql: str, named_artifacts: dict[str, SqlArtifact]) -> list[str]:
    tokens = set(re.findall(r"\b(\w+)\b", sql.lower()))
    return [name for name in named_artifacts if name.lower() in tokens]


def _build_cte_query(cte_artifacts: list[SqlArtifact], final_sql: str) -> str:
    if not cte_artifacts:
        return final_sql

    cte_parts = [f"{a.name} AS (\n  {a.sql_expression}\n)" for a in cte_artifacts]
    joined = ",\n".join(cte_parts)
    return f"WITH {joined}\n{final_sql}"


async def _run_sql(sql: str, session: AsyncSession) -> ExecutionResult:
    try:
        log.info("_run_sql executing: %s", sql[:300])
        async with session.begin_nested():
            result = await session.execute(text(sql))
            columns = list(result.keys())
            rows = [list(row) for row in result.fetchall()]
        log.info("_run_sql success: %d rows, columns=%s", len(rows), columns)
        return ExecutionResult(columns=columns, rows=rows, row_count=len(rows))
    except Exception as exc:
        log.error("_run_sql FAILED: %s", str(exc))
        return ExecutionResult(columns=[], rows=[], row_count=0, error=str(exc))
