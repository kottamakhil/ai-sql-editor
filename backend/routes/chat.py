import asyncio
import json as _json
import logging

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sse_starlette.sse import EventSourceResponse

from agent.chat_service import ChatResult, process_chat, process_chat_streaming
from database import get_db
from models import (
    ChatFile,
    Conversation,
    ConversationSkillVersion,
    Skill,
    SkillVersion,
)
from schemas.chat import (
    ChatFileOut,
    ChatRequest,
    ChatResponse,
    ClarificationOption,
    ClarificationQuestion,
    ConversationOut,
    ConversationSummaryOut,
    MessageOut,
    ToolCallOut,
)
from schemas.plan import (
    ArtifactOut,
    ConversationSkillOut,
    DisputeConfigOut,
    PayoutConfigOut,
    PayrollConfigOut,
    PlanConfigOut,
    PlanOut,
)
from services.data_access import load_plan

log = logging.getLogger(__name__)

router = APIRouter()


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
        pending = _parse_questions(_json.loads(conv.pending_questions_json))

    skills_result = await session.execute(
        select(ConversationSkillVersion, SkillVersion, Skill)
        .join(SkillVersion, ConversationSkillVersion.skill_version_id == SkillVersion.id)
        .join(Skill, SkillVersion.skill_id == Skill.id)
        .where(ConversationSkillVersion.conversation_id == conversation_id)
    )
    skills = [
        ConversationSkillOut(
            skill_id=skill.id, skill_name=skill.name,
            version_id=sv.id, version=sv.version, content=sv.content,
        )
        for _, sv, skill in skills_result.all()
    ] or None

    return ConversationOut(
        conversation_id=conv.id,
        plan_id=conv.plan_id,
        title=conv.title,
        pending_questions=pending,
        skills=skills,
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


# --- File Upload ---


ALLOWED_MIME_TYPES = {
    "image/png", "image/jpeg", "image/gif", "image/webp",
    "application/pdf",
    "text/csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
MAX_FILE_SIZE = 20 * 1024 * 1024


@router.post("/chat/upload", response_model=ChatFileOut)
async def upload_file(
    file: UploadFile,
    conversation_id: str | None = None,
    session: AsyncSession = Depends(get_db),
):
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f"File too large (max {MAX_FILE_SIZE // 1024 // 1024}MB)")

    chat_file = ChatFile(
        conversation_id=conversation_id,
        filename=file.filename or "unknown",
        mime_type=file.content_type or "application/octet-stream",
        size_bytes=len(content),
        content=content,
    )
    session.add(chat_file)
    await session.commit()
    await session.refresh(chat_file)

    return ChatFileOut(
        file_id=chat_file.id,
        filename=chat_file.filename,
        mime_type=chat_file.mime_type,
        size_bytes=chat_file.size_bytes,
    )


# --- Chat ---


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, session: AsyncSession = Depends(get_db)):
    result = await process_chat(req.message, req.conversation_id, session, skill_ids=req.skill_ids, file_ids=req.file_ids)
    return _chat_result_to_response(result)


@router.post("/chat/stream")
async def chat_stream(req: ChatRequest, request: Request, session: AsyncSession = Depends(get_db)):
    """SSE streaming version of /chat. Emits step/artifact/complete events."""

    event_queue: asyncio.Queue[dict | None] = asyncio.Queue()

    async def on_progress(event: dict) -> None:
        await event_queue.put(event)

    async def generate():
        task = asyncio.create_task(_run_streaming_chat(req, session, on_progress, event_queue))
        try:
            while True:
                if await request.is_disconnected():
                    task.cancel()
                    break
                try:
                    event = await asyncio.wait_for(event_queue.get(), timeout=1.0)
                except asyncio.TimeoutError:
                    continue
                if event is None:
                    break
                event_type = event.get("type", "step")
                sse_event = "artifact" if event_type == "artifact" else (
                    "complete" if event_type == "complete" else "step"
                )
                yield {"event": sse_event, "data": _json.dumps(event, default=str)}
        except asyncio.CancelledError:
            task.cancel()
        except Exception:
            log.exception("SSE stream error")
            yield {"event": "error", "data": _json.dumps({"error": "Internal server error"})}

    return EventSourceResponse(generate())


async def _run_streaming_chat(
    req: ChatRequest,
    session: AsyncSession,
    on_progress,
    event_queue: asyncio.Queue,
) -> None:
    try:
        result = await process_chat_streaming(
            req.message, req.conversation_id, session,
            on_progress=on_progress,
            skill_ids=req.skill_ids, file_ids=req.file_ids,
        )
        response = _chat_result_to_response(result)
        await event_queue.put({
            "type": "complete",
            "data": response.model_dump(mode="json"),
        })
    except Exception as exc:
        log.exception("Streaming chat error")
        await event_queue.put({
            "type": "error",
            "error": str(exc),
        })
    finally:
        await event_queue.put(None)


def _chat_result_to_response(result: ChatResult) -> ChatResponse:
    current_artifacts = [
        ArtifactOut(artifact_id=a.get("artifact_id", ""), name=a.get("name"), sql_expression=a.get("sql", ""))
        for a in result.artifacts
    ]

    plan_out = None
    if result.plan:
        cfg = result.plan.get("config", {})
        plan_out = PlanOut(
            plan_id=result.plan["plan_id"],
            name=result.plan["name"],
            plan_type=result.plan["plan_type"],
            frequency=result.plan["frequency"],
            mode=result.plan.get("mode", "AI_ASSISTED"),
            artifacts=current_artifacts,
            config=PlanConfigOut(
                payout=PayoutConfigOut(**cfg.get("payout", {})),
                payroll=PayrollConfigOut(**cfg.get("payroll", {})),
                disputes=DisputeConfigOut(**cfg.get("disputes", {})),
            ),
            inferred_config=result.plan.get("inferred_config"),
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
