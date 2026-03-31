from pydantic import BaseModel

from services.executor import ExecutionResult


class ExecuteRequest(BaseModel):
    artifact_id: str | None = None
    sql_expression: str | None = None
    cycle_id: str | None = None


class PreviewResponse(BaseModel):
    composed_sql: str
    result: ExecutionResult
