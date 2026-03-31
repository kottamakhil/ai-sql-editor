from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import SqlArtifact
from schemas.execution import ExecuteRequest
from services.data_access import get_schema_ddls
from services.executor import (
    ExecutionResult,
    _build_cte_query,
    _resolve_dependencies,
    execute_artifact,
    execute_raw_sql,
)

router = APIRouter()


@router.get("/schema")
async def get_schema(session: AsyncSession = Depends(get_db)):
    ddls = await get_schema_ddls(session)
    return {"tables": ddls}


@router.post("/execute", response_model=ExecutionResult)
async def execute_sql(req: ExecuteRequest, session: AsyncSession = Depends(get_db)):
    if req.artifact_id:
        result = await session.execute(select(SqlArtifact).where(SqlArtifact.id == req.artifact_id))
        artifact = result.scalar_one_or_none()
        if not artifact:
            raise HTTPException(status_code=404, detail=f"Artifact {req.artifact_id} not found")

        plan_result = await session.execute(
            select(SqlArtifact).where(SqlArtifact.plan_id == artifact.plan_id)
        )
        all_artifacts = list(plan_result.scalars())
        exec_result = await execute_artifact(artifact, all_artifacts, session)

        if req.cycle_id and not exec_result.error and "cycle_id" in exec_result.columns:
            return await _execute_with_cycle_filter(artifact, all_artifacts, req.cycle_id, session)
        return exec_result

    if req.sql_expression:
        return await execute_raw_sql(req.sql_expression, session)

    raise HTTPException(status_code=400, detail="Provide artifact_id or sql_expression")


async def _execute_with_cycle_filter(
    artifact: SqlArtifact,
    all_artifacts: list[SqlArtifact],
    cycle_id: str,
    session: AsyncSession,
) -> ExecutionResult:
    named = {a.name: a for a in all_artifacts if a.name}
    deps = _resolve_dependencies(artifact, named)
    composed_sql = _build_cte_query(deps, artifact.sql_expression)

    filtered_sql = f"SELECT * FROM ({composed_sql}) AS _result WHERE cycle_id = '{cycle_id}'"
    return await execute_raw_sql(filtered_sql, session)
