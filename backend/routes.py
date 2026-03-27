import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from chat_service import ChatResult, process_chat
from chat_service import _get_schema_ddls as get_schema_ddls
from chat_service import _load_plan as load_plan
from database import get_db
from executor import ExecutionResult, execute_artifact, execute_plan_preview, execute_raw_sql
from models import Conversation, Plan, PlanSkillVersion, Skill, SkillVersion, SqlArtifact

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api")

# --- Request / Response schemas ---


class CreatePlanRequest(BaseModel):
    name: str
    plan_type: str = "RECURRING"
    frequency: str = "QUARTERLY"
    skill_ids: list[str] | None = None


class UpdatePlanRequest(BaseModel):
    name: str | None = None
    plan_type: str | None = None
    frequency: str | None = None


class ArtifactOut(BaseModel):
    artifact_id: str
    name: str | None
    sql_expression: str


class PlanSkillOut(BaseModel):
    skill_id: str
    skill_name: str
    version_id: str
    version: int
    content: str


class PlanOut(BaseModel):
    plan_id: str
    name: str
    plan_type: str
    frequency: str
    mode: str
    artifacts: list[ArtifactOut]
    conversation_id: str | None = None
    skills: list[PlanSkillOut] | None = None


class CreateArtifactRequest(BaseModel):
    name: str | None = None
    sql_expression: str


class UpdateArtifactRequest(BaseModel):
    name: str | None = None
    sql_expression: str | None = None


class CreateSkillRequest(BaseModel):
    name: str
    content: str


class SkillVersionOut(BaseModel):
    version_id: str
    version: int
    content: str


class SkillOut(BaseModel):
    skill_id: str
    name: str
    content: str
    current_version: int = 1
    versions: list[SkillVersionOut] | None = None


class ExecuteRequest(BaseModel):
    artifact_id: str | None = None
    sql_expression: str | None = None


class ToolCallOut(BaseModel):
    tool_name: str
    arguments: dict
    success: bool
    result_data: dict | None = None
    error: str | None = None


class ClarificationOption(BaseModel):
    value: str
    label: str


class ClarificationQuestion(BaseModel):
    id: str
    question: str
    options: list[ClarificationOption]
    allow_multiple: bool = False
    allow_freetext: bool = False


class ChatRequest(BaseModel):
    message: str
    conversation_id: str | None = None
    skill_ids: list[str] | None = None


class MessageOut(BaseModel):
    message_id: str
    role: str
    content: str


class ChatResponse(BaseModel):
    response: str
    conversation_id: str
    composed_sql: str | None = None
    tool_calls: list[ToolCallOut]
    current_artifacts: list[ArtifactOut]
    plan: PlanOut | None = None
    iterations: int = 0
    pending_questions: list[ClarificationQuestion] | None = None


class ConversationOut(BaseModel):
    conversation_id: str
    plan_id: str | None = None
    title: str | None = None
    pending_questions: list[ClarificationQuestion] | None = None
    messages: list[MessageOut]


class ConversationSummaryOut(BaseModel):
    conversation_id: str
    plan_id: str | None = None
    title: str | None = None
    message_count: int


class PreviewResponse(BaseModel):
    composed_sql: str
    result: ExecutionResult


# --- Helpers ---


def _artifact_to_out(a: SqlArtifact) -> ArtifactOut:
    return ArtifactOut(artifact_id=a.id, name=a.name, sql_expression=a.sql_expression)


async def _plan_to_out(plan: Plan, session: AsyncSession) -> PlanOut:
    """Build a PlanOut with conversation_id and pinned skills."""
    conv_result = await session.execute(
        select(Conversation.id)
        .where(Conversation.plan_id == plan.id)
        .order_by(Conversation.created_at.desc())
        .limit(1)
    )
    conv_id = conv_result.scalar_one_or_none()

    skills_result = await session.execute(
        select(PlanSkillVersion, SkillVersion, Skill)
        .join(SkillVersion, PlanSkillVersion.skill_version_id == SkillVersion.id)
        .join(Skill, SkillVersion.skill_id == Skill.id)
        .where(PlanSkillVersion.plan_id == plan.id)
    )
    skills = [
        PlanSkillOut(
            skill_id=skill.id, skill_name=skill.name,
            version_id=sv.id, version=sv.version, content=sv.content,
        )
        for _, sv, skill in skills_result.all()
    ] or None

    return PlanOut(
        plan_id=plan.id,
        name=plan.name,
        plan_type=plan.plan_type,
        frequency=plan.frequency,
        mode=plan.mode,
        artifacts=[_artifact_to_out(a) for a in plan.artifacts],
        conversation_id=conv_id,
        skills=skills,
    )


# --- Plan CRUD ---


@router.get("/plans", response_model=list[PlanOut])
async def list_plans(session: AsyncSession = Depends(get_db)):
    result = await session.execute(
        select(Plan).options(selectinload(Plan.artifacts)).order_by(Plan.created_at.desc())
    )
    return [await _plan_to_out(p, session) for p in result.scalars()]


@router.post("/plans", response_model=PlanOut)
async def create_plan(req: CreatePlanRequest, session: AsyncSession = Depends(get_db)):
    """Create a plan and pin skill_ids to their latest versions."""
    plan = Plan(
        name=req.name,
        plan_type=req.plan_type.upper(),
        frequency=req.frequency.upper(),
        mode="AI_ASSISTED",
    )
    session.add(plan)
    await session.flush()

    if req.skill_ids:
        versions = await _resolve_latest_skill_versions(req.skill_ids, session)
        for sv in versions:
            session.add(PlanSkillVersion(plan_id=plan.id, skill_version_id=sv.id))

    await session.commit()
    await session.refresh(plan)
    plan.artifacts = []
    return await _plan_to_out(plan, session)


@router.get("/plans/{plan_id}", response_model=PlanOut)
async def get_plan(plan_id: str, session: AsyncSession = Depends(get_db)):
    plan = await load_plan(plan_id, session)
    return await _plan_to_out(plan, session)


@router.patch("/plans/{plan_id}", response_model=PlanOut)
async def update_plan(plan_id: str, req: UpdatePlanRequest, session: AsyncSession = Depends(get_db)):
    plan = await load_plan(plan_id, session)

    if req.name is not None:
        plan.name = req.name.strip()
    if req.plan_type is not None:
        plan.plan_type = req.plan_type.upper()
    if req.frequency is not None:
        plan.frequency = req.frequency.upper()

    await session.commit()
    plan = await load_plan(plan.id, session)
    return await _plan_to_out(plan, session)


# --- Artifact CRUD ---


@router.post("/plans/{plan_id}/artifacts", response_model=ArtifactOut)
async def create_artifact(plan_id: str, req: CreateArtifactRequest, session: AsyncSession = Depends(get_db)):
    await load_plan(plan_id, session)
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


async def _resolve_latest_skill_versions(
    skill_ids: list[str], session: AsyncSession,
) -> list[SkillVersion]:
    """Resolve each skill_id to its latest SkillVersion."""
    versions = []
    for sid in skill_ids:
        result = await session.execute(
            select(SkillVersion)
            .where(SkillVersion.skill_id == sid)
            .order_by(SkillVersion.version.desc())
            .limit(1)
        )
        sv = result.scalar_one_or_none()
        if sv:
            versions.append(sv)
    return versions


def _skill_to_out(skill: Skill, include_versions: bool = False) -> SkillOut:
    """Convert a Skill ORM object to an API response with latest content and optional version history."""
    latest = skill.versions[-1] if skill.versions else None
    out = SkillOut(
        skill_id=skill.id,
        name=skill.name,
        content=latest.content if latest else skill.content,
        current_version=latest.version if latest else 1,
    )
    if include_versions and skill.versions:
        out.versions = [
            SkillVersionOut(version_id=v.id, version=v.version, content=v.content)
            for v in skill.versions
        ]
    return out


@router.post("/skills", response_model=SkillOut)
async def create_skill(req: CreateSkillRequest, session: AsyncSession = Depends(get_db)):
    """Create a new skill with its initial version (v1)."""
    skill = Skill(name=req.name, content=req.content)
    session.add(skill)
    await session.flush()

    v1 = SkillVersion(skill_id=skill.id, version=1, content=req.content)
    session.add(v1)
    await session.commit()

    result = await session.execute(
        select(Skill).options(selectinload(Skill.versions)).where(Skill.id == skill.id)
    )
    skill = result.scalar_one()
    return _skill_to_out(skill)


@router.get("/skills", response_model=list[SkillOut])
async def list_skills(session: AsyncSession = Depends(get_db)):
    """List all skills with their latest content and version number."""
    result = await session.execute(select(Skill).options(selectinload(Skill.versions)))
    return [_skill_to_out(s) for s in result.scalars()]


@router.get("/skills/{skill_id}", response_model=SkillOut)
async def get_skill(skill_id: str, session: AsyncSession = Depends(get_db)):
    """Get a skill with its full version history."""
    result = await session.execute(
        select(Skill).options(selectinload(Skill.versions)).where(Skill.id == skill_id)
    )
    skill = result.scalar_one_or_none()
    if not skill:
        raise HTTPException(status_code=404, detail=f"Skill {skill_id} not found")
    return _skill_to_out(skill, include_versions=True)


@router.put("/skills/{skill_id}", response_model=SkillOut)
async def update_skill(skill_id: str, req: CreateSkillRequest, session: AsyncSession = Depends(get_db)):
    """Create a new immutable version of the skill with updated content."""
    result = await session.execute(
        select(Skill).options(selectinload(Skill.versions)).where(Skill.id == skill_id)
    )
    skill = result.scalar_one_or_none()
    if not skill:
        raise HTTPException(status_code=404, detail=f"Skill {skill_id} not found")

    skill.name = req.name
    skill.content = req.content
    next_version = (skill.versions[-1].version + 1) if skill.versions else 1
    session.add(SkillVersion(skill_id=skill.id, version=next_version, content=req.content))
    await session.commit()

    result = await session.execute(
        select(Skill).options(selectinload(Skill.versions)).where(Skill.id == skill.id)
    )
    skill = result.scalar_one()
    return _skill_to_out(skill, include_versions=True)


# --- Conversations ---


@router.get("/plans/{plan_id}/conversations", response_model=list[ConversationSummaryOut])
async def list_conversations(plan_id: str, session: AsyncSession = Depends(get_db)):
    await load_plan(plan_id, session)
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
    visible_messages = [
        m for m in conv.messages
        if m.role in ("user", "assistant") and not m.tool_calls_json and m.content
    ]
    pending = None
    if conv.pending_questions_json:
        import json as _json
        pending = _parse_questions(_json.loads(conv.pending_questions_json))

    return ConversationOut(
        conversation_id=conv.id,
        plan_id=conv.plan_id,
        title=conv.title,
        pending_questions=pending,
        messages=[
            MessageOut(message_id=m.id, role=m.role, content=m.content)
            for m in visible_messages
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
    ddls = await get_schema_ddls(session)
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
    plan = await load_plan(plan_id, session)
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
    result = await process_chat(req.message, req.conversation_id, session, skill_ids=req.skill_ids)
    return _chat_result_to_response(result)


def _chat_result_to_response(result: ChatResult) -> ChatResponse:
    current_artifacts = [
        ArtifactOut(artifact_id=a.get("artifact_id", ""), name=a.get("name"), sql_expression=a.get("sql", ""))
        for a in result.artifacts
    ]

    plan_out = None
    if result.plan:
        plan_out = PlanOut(
            plan_id=result.plan["plan_id"],
            name=result.plan["name"],
            plan_type=result.plan["plan_type"],
            frequency=result.plan["frequency"],
            mode=result.plan.get("mode", "AI_ASSISTED"),
            artifacts=current_artifacts,
            conversation_id=result.conversation_id,
        )

    return ChatResponse(
        response=result.response_text,
        conversation_id=result.conversation_id,
        composed_sql=result.composed_sql,
        tool_calls=[
            ToolCallOut(
                tool_name=tc.tool_name,
                arguments=tc.arguments,
                success=tc.result.success,
                result_data=tc.result.data if tc.result.success else None,
                error=tc.result.error,
            )
            for tc in result.agent_result.tool_calls
        ],
        current_artifacts=current_artifacts,
        plan=plan_out,
        iterations=result.agent_result.iterations,
        pending_questions=_parse_questions(result.agent_result.pending_questions),
    )


def _parse_questions(raw: list[dict] | None) -> list[ClarificationQuestion] | None:
    """Convert raw question dicts from the agent into Pydantic models."""
    if not raw:
        return None
    return [
        ClarificationQuestion(
            id=q["id"],
            question=q["question"],
            options=[ClarificationOption(**o) for o in q.get("options", [])],
            allow_multiple=q.get("allow_multiple", False),
            allow_freetext=q.get("allow_freetext", False),
        )
        for q in raw
    ]


