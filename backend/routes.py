import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from executor import ExecutionResult, execute_artifact, execute_plan_preview, execute_raw_sql
from llm import build_system_prompt, call_openai, parse_sql_operations
from models import Conversation, ConversationMessage, Plan, Skill, SqlArtifact

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api")

BUSINESS_TABLES = {"employees", "deals", "quotas"}


# --- Request / Response schemas ---


class CreatePlanRequest(BaseModel):
    name: str
    plan_type: str = "RECURRING"
    frequency: str = "QUARTERLY"


class UpdatePlanRequest(BaseModel):
    name: str | None = None
    plan_type: str | None = None
    frequency: str | None = None


class ArtifactOut(BaseModel):
    artifact_id: str
    name: str | None
    sql_expression: str


class PlanOut(BaseModel):
    plan_id: str
    name: str
    plan_type: str
    frequency: str
    mode: str
    artifacts: list[ArtifactOut]


class CreateArtifactRequest(BaseModel):
    name: str | None = None
    sql_expression: str


class UpdateArtifactRequest(BaseModel):
    name: str | None = None
    sql_expression: str | None = None


class CreateSkillRequest(BaseModel):
    name: str
    content: str


class SkillOut(BaseModel):
    skill_id: str
    name: str
    content: str


class ExecuteRequest(BaseModel):
    artifact_id: str | None = None
    sql_expression: str | None = None


class OperationResultOut(BaseModel):
    action: str
    artifact_id: str | None = None
    name: str | None = None
    sql_expression: str | None = None
    result: ExecutionResult | None = None


class ChatRequest(BaseModel):
    plan_id: str
    message: str
    conversation_id: str | None = None
    conversation_history: list[dict] = []


class MessageOut(BaseModel):
    message_id: str
    role: str
    content: str


class ChatResponse(BaseModel):
    response: str
    conversation_id: str
    operations: list[OperationResultOut]
    current_artifacts: list[ArtifactOut]
    conversation_history: list[dict]


class ConversationOut(BaseModel):
    conversation_id: str
    plan_id: str
    title: str | None
    messages: list[MessageOut]


class ConversationSummaryOut(BaseModel):
    conversation_id: str
    plan_id: str
    title: str | None
    message_count: int


class PreviewResponse(BaseModel):
    composed_sql: str
    result: ExecutionResult


# --- Helpers ---


async def _load_plan_with_artifacts(plan_id: str, session: AsyncSession) -> Plan:
    result = await session.execute(
        select(Plan).options(selectinload(Plan.artifacts)).where(Plan.id == plan_id)
    )
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail=f"Plan {plan_id} not found")
    return plan


async def _get_schema_ddls(session: AsyncSession) -> list[str]:
    placeholders = ", ".join(f":t{i}" for i in range(len(BUSINESS_TABLES)))
    params = {f"t{i}": name for i, name in enumerate(BUSINESS_TABLES)}
    stmt = text(
        "SELECT table_name, column_name, data_type, is_nullable "
        "FROM information_schema.columns "
        f"WHERE table_schema = 'public' AND table_name IN ({placeholders}) "
        "ORDER BY table_name, ordinal_position"
    )
    result = await session.execute(stmt, params)
    rows = result.fetchall()

    tables: dict[str, list[str]] = {}
    for table_name, col_name, data_type, nullable in rows:
        tables.setdefault(table_name, [])
        null_str = "" if nullable == "YES" else " NOT NULL"
        tables[table_name].append(f"  {col_name} {data_type.upper()}{null_str}")

    return [
        f"CREATE TABLE {name} (\n" + ",\n".join(cols) + "\n)"
        for name, cols in tables.items()
    ]


def _artifact_to_out(a: SqlArtifact) -> ArtifactOut:
    return ArtifactOut(artifact_id=a.id, name=a.name, sql_expression=a.sql_expression)


# --- Plan CRUD ---


@router.get("/plans", response_model=list[PlanOut])
async def list_plans(session: AsyncSession = Depends(get_db)):
    result = await session.execute(
        select(Plan).options(selectinload(Plan.artifacts)).order_by(Plan.created_at.desc())
    )
    return [
        PlanOut(
            plan_id=p.id,
            name=p.name,
            plan_type=p.plan_type,
            frequency=p.frequency,
            mode=p.mode,
            artifacts=[_artifact_to_out(a) for a in p.artifacts],
        )
        for p in result.scalars()
    ]


@router.post("/plans", response_model=PlanOut)
async def create_plan(req: CreatePlanRequest, session: AsyncSession = Depends(get_db)):
    plan = Plan(
        name=req.name,
        plan_type=req.plan_type.upper(),
        frequency=req.frequency.upper(),
        mode="AI_ASSISTED",
    )
    session.add(plan)
    await session.commit()
    await session.refresh(plan)
    return PlanOut(
        plan_id=plan.id,
        name=plan.name,
        plan_type=plan.plan_type,
        frequency=plan.frequency,
        mode=plan.mode,
        artifacts=[],
    )


@router.get("/plans/{plan_id}", response_model=PlanOut)
async def get_plan(plan_id: str, session: AsyncSession = Depends(get_db)):
    plan = await _load_plan_with_artifacts(plan_id, session)
    return PlanOut(
        plan_id=plan.id,
        name=plan.name,
        plan_type=plan.plan_type,
        frequency=plan.frequency,
        mode=plan.mode,
        artifacts=[_artifact_to_out(a) for a in plan.artifacts],
    )


@router.patch("/plans/{plan_id}", response_model=PlanOut)
async def update_plan(plan_id: str, req: UpdatePlanRequest, session: AsyncSession = Depends(get_db)):
    plan = await _load_plan_with_artifacts(plan_id, session)

    if req.name is not None:
        plan.name = req.name.strip()
    if req.plan_type is not None:
        plan.plan_type = req.plan_type.upper()
    if req.frequency is not None:
        plan.frequency = req.frequency.upper()

    await session.commit()
    await session.refresh(plan)
    return PlanOut(
        plan_id=plan.id,
        name=plan.name,
        plan_type=plan.plan_type,
        frequency=plan.frequency,
        mode=plan.mode,
        artifacts=[_artifact_to_out(a) for a in plan.artifacts],
    )


# --- Artifact CRUD ---


@router.post("/plans/{plan_id}/artifacts", response_model=ArtifactOut)
async def create_artifact(plan_id: str, req: CreateArtifactRequest, session: AsyncSession = Depends(get_db)):
    await _load_plan_with_artifacts(plan_id, session)
    artifact = SqlArtifact(plan_id=plan_id, name=req.name, sql_expression=req.sql_expression)
    session.add(artifact)
    await session.commit()
    await session.refresh(artifact)
    return _artifact_to_out(artifact)


@router.patch("/artifacts/{artifact_id}", response_model=ArtifactOut)
async def update_artifact(artifact_id: str, req: UpdateArtifactRequest, session: AsyncSession = Depends(get_db)):
    result = await session.execute(select(SqlArtifact).where(SqlArtifact.id == artifact_id))
    artifact = result.scalar_one_or_none()
    if not artifact:
        raise HTTPException(status_code=404, detail=f"Artifact {artifact_id} not found")

    if req.name is not None:
        artifact.name = req.name
    if req.sql_expression is not None:
        artifact.sql_expression = req.sql_expression

    await session.commit()
    await session.refresh(artifact)
    return _artifact_to_out(artifact)


@router.delete("/artifacts/{artifact_id}", status_code=204)
async def delete_artifact(artifact_id: str, session: AsyncSession = Depends(get_db)):
    result = await session.execute(select(SqlArtifact).where(SqlArtifact.id == artifact_id))
    artifact = result.scalar_one_or_none()
    if not artifact:
        raise HTTPException(status_code=404, detail=f"Artifact {artifact_id} not found")
    await session.delete(artifact)
    await session.commit()


# --- Skills ---


@router.post("/skills", response_model=SkillOut)
async def create_skill(req: CreateSkillRequest, session: AsyncSession = Depends(get_db)):
    skill = Skill(name=req.name, content=req.content)
    session.add(skill)
    await session.commit()
    await session.refresh(skill)
    return SkillOut(skill_id=skill.id, name=skill.name, content=skill.content)


@router.get("/skills", response_model=list[SkillOut])
async def list_skills(session: AsyncSession = Depends(get_db)):
    result = await session.execute(select(Skill))
    return [SkillOut(skill_id=s.id, name=s.name, content=s.content) for s in result.scalars()]


# --- Conversations ---


@router.get("/plans/{plan_id}/conversations", response_model=list[ConversationSummaryOut])
async def list_conversations(plan_id: str, session: AsyncSession = Depends(get_db)):
    await _load_plan_with_artifacts(plan_id, session)
    result = await session.execute(
        select(Conversation)
        .options(selectinload(Conversation.messages))
        .where(Conversation.plan_id == plan_id)
        .order_by(Conversation.created_at.desc())
    )
    return [
        ConversationSummaryOut(
            conversation_id=c.id,
            plan_id=c.plan_id,
            title=c.title,
            message_count=len(c.messages),
        )
        for c in result.scalars()
    ]


@router.get("/conversations/{conversation_id}", response_model=ConversationOut)
async def get_conversation(conversation_id: str, session: AsyncSession = Depends(get_db)):
    result = await session.execute(
        select(Conversation)
        .options(selectinload(Conversation.messages))
        .where(Conversation.id == conversation_id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail=f"Conversation {conversation_id} not found")
    return ConversationOut(
        conversation_id=conv.id,
        plan_id=conv.plan_id,
        title=conv.title,
        messages=[
            MessageOut(message_id=m.id, role=m.role, content=m.content)
            for m in conv.messages
        ],
    )


@router.delete("/conversations/{conversation_id}", status_code=204)
async def delete_conversation(conversation_id: str, session: AsyncSession = Depends(get_db)):
    result = await session.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail=f"Conversation {conversation_id} not found")
    await session.delete(conv)
    await session.commit()


# --- Schema introspection ---


@router.get("/schema")
async def get_schema(session: AsyncSession = Depends(get_db)):
    ddls = await _get_schema_ddls(session)
    return {"tables": ddls}


# --- Execute ---


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
        return await execute_artifact(artifact, all_artifacts, session)

    if req.sql_expression:
        return await execute_raw_sql(req.sql_expression, session)

    raise HTTPException(status_code=400, detail="Provide artifact_id or sql_expression")


# --- Plan preview ---


@router.get("/plans/{plan_id}/preview", response_model=PreviewResponse)
async def preview_plan(plan_id: str, session: AsyncSession = Depends(get_db)):
    plan = await _load_plan_with_artifacts(plan_id, session)
    artifacts = list(plan.artifacts)

    if not artifacts:
        raise HTTPException(status_code=400, detail="Plan has no artifacts")

    from executor import _build_cte_query, _find_final_artifact, _resolve_dependencies

    named = {a.name: a for a in artifacts if a.name}
    final = _find_final_artifact(artifacts)
    deps = _resolve_dependencies(final, named)
    composed_sql = _build_cte_query(deps, final.sql_expression)

    exec_result = await execute_plan_preview(artifacts, session)
    return PreviewResponse(composed_sql=composed_sql, result=exec_result)


# --- Chat ---


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, session: AsyncSession = Depends(get_db)):
    plan = await _load_plan_with_artifacts(req.plan_id, session)
    artifacts = list(plan.artifacts)

    conversation = await _get_or_create_conversation(
        req.conversation_id, req.plan_id, session
    )

    skills_result = await session.execute(select(Skill))
    skills = list(skills_result.scalars())

    schema_ddls = await _get_schema_ddls(session)
    system_prompt = build_system_prompt(plan, artifacts, skills, schema_ddls)

    persisted_history = [
        {"role": m.role, "content": m.content} for m in conversation.messages
    ]

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(persisted_history)
    messages.append({"role": "user", "content": req.message})

    llm_response = await call_openai(messages)
    parsed = parse_sql_operations(llm_response)

    session.add(ConversationMessage(
        conversation_id=conversation.id, role="user", content=req.message,
    ))
    session.add(ConversationMessage(
        conversation_id=conversation.id, role="assistant", content=parsed.response_text,
    ))

    if conversation.title is None:
        conversation.title = req.message[:120]

    await session.commit()

    operation_results: list[OperationResultOut] = []
    for op in parsed.operations:
        try:
            op_result = await _process_operation(op, plan, session)
            operation_results.append(op_result)
        except Exception as exc:
            log.warning("Operation failed", extra={"action": op.action, "error": str(exc)})
            operation_results.append(OperationResultOut(
                action=op.action,
                artifact_id=op.artifact_id,
                result=ExecutionResult(columns=[], rows=[], row_count=0, error=str(exc)),
            ))

    refreshed = await session.execute(
        select(SqlArtifact)
        .where(SqlArtifact.plan_id == plan.id)
        .order_by(SqlArtifact.created_at)
    )
    current_artifacts = [_artifact_to_out(a) for a in refreshed.scalars()]

    updated_history = persisted_history + [
        {"role": "user", "content": req.message},
        {"role": "assistant", "content": parsed.response_text},
    ]

    return ChatResponse(
        response=parsed.response_text,
        conversation_id=conversation.id,
        operations=operation_results,
        current_artifacts=current_artifacts,
        conversation_history=updated_history,
    )


async def _get_or_create_conversation(
    conversation_id: str | None,
    plan_id: str,
    session: AsyncSession,
) -> Conversation:
    if conversation_id:
        result = await session.execute(
            select(Conversation)
            .options(selectinload(Conversation.messages))
            .where(Conversation.id == conversation_id)
        )
        conv = result.scalar_one_or_none()
        if not conv:
            raise HTTPException(
                status_code=404, detail=f"Conversation {conversation_id} not found"
            )
        return conv

    conv = Conversation(plan_id=plan_id)
    session.add(conv)
    await session.flush()

    result = await session.execute(
        select(Conversation)
        .options(selectinload(Conversation.messages))
        .where(Conversation.id == conv.id)
    )
    return result.scalar_one()


async def _process_operation(
    op,
    plan: Plan,
    session: AsyncSession,
) -> OperationResultOut:
    if op.action == "delete":
        if not op.artifact_id:
            raise ValueError("delete requires artifact_id")
        result = await session.execute(select(SqlArtifact).where(SqlArtifact.id == op.artifact_id))
        artifact = result.scalar_one_or_none()
        if artifact:
            await session.delete(artifact)
            await session.commit()
        return OperationResultOut(action="delete", artifact_id=op.artifact_id)

    if op.action == "create":
        artifact = SqlArtifact(plan_id=plan.id, name=op.name, sql_expression=op.sql or "")
        session.add(artifact)
        await session.commit()
        await session.refresh(artifact)

        plan_result = await session.execute(
            select(SqlArtifact).where(SqlArtifact.plan_id == plan.id)
        )
        all_artifacts = list(plan_result.scalars())
        exec_result = await execute_artifact(artifact, all_artifacts, session)
        return OperationResultOut(
            action="create",
            artifact_id=artifact.id,
            name=artifact.name,
            sql_expression=artifact.sql_expression,
            result=exec_result,
        )

    if op.action == "update":
        if not op.artifact_id:
            raise ValueError("update requires artifact_id")
        result = await session.execute(select(SqlArtifact).where(SqlArtifact.id == op.artifact_id))
        artifact = result.scalar_one_or_none()
        if not artifact:
            raise ValueError(f"Artifact {op.artifact_id} not found")

        if op.sql:
            artifact.sql_expression = op.sql
        if op.name is not None:
            artifact.name = op.name
        await session.commit()
        await session.refresh(artifact)

        plan_result = await session.execute(
            select(SqlArtifact).where(SqlArtifact.plan_id == plan.id)
        )
        all_artifacts = list(plan_result.scalars())
        exec_result = await execute_artifact(artifact, all_artifacts, session)
        return OperationResultOut(
            action="update",
            artifact_id=artifact.id,
            name=artifact.name,
            sql_expression=artifact.sql_expression,
            result=exec_result,
        )

    raise ValueError(f"Unknown action: {op.action}")
