from __future__ import annotations

import base64
import json
import logging
from dataclasses import dataclass

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from agent.loop import AgentResult, run_agent_loop
from agent.prompts import build_system_prompt
from models import (
    ChatFile,
    Conversation,
    ConversationMessage,
    ConversationSkillVersion,
    Plan,
    PlanTemplate,
    Skill,
    SkillVersion,
    SqlArtifact,
)
from services.data_access import get_schema_ddls
from services.sqlalchemy_plan_service import SqlAlchemyPlanService

log = logging.getLogger(__name__)


@dataclass
class ChatResult:
    response_text: str
    conversation_id: str
    composed_sql: str | None
    agent_result: AgentResult
    plan: dict | None
    artifacts: list[dict]


async def process_chat(
    message: str,
    conversation_id: str | None,
    session: AsyncSession,
    skill_ids: list[str] | None = None,
    file_ids: list[str] | None = None,
) -> ChatResult:
    is_new_conversation = conversation_id is None
    conversation = await _get_or_create_conversation(conversation_id, session)

    if is_new_conversation and skill_ids:
        await _pin_skills_to_conversation(conversation.id, skill_ids, session)

    plan = None
    if conversation.plan_id:
        plan = await _load_plan(conversation.plan_id, session)

    plan_service = SqlAlchemyPlanService(session, plan)
    schema_ddls = await get_schema_ddls(session)
    skills_dict = await _load_conversation_skills(conversation.id, session)

    plan_dict = await plan_service.get_plan()
    artifacts_dict = await plan_service.get_artifacts()
    plan_template = await _load_active_template(session)
    inferred_config = await plan_service.get_inferred_config()

    system_prompt = build_system_prompt(
        plan_dict, artifacts_dict, skills_dict, schema_ddls,
        plan_template=plan_template,
        inferred_config=inferred_config,
    )
    history = _load_history(conversation)

    user_content = await _build_user_content(message, file_ids, session)

    messages = [
        {"role": "system", "content": system_prompt},
        *history,
        {"role": "user", "content": user_content},
    ]

    agent_result = await run_agent_loop(
        messages=messages,
        plan_service=plan_service,
        skills=skills_dict,
        schema_ddls=schema_ddls,
    )
    log.info(
        "Agent finished: %d iteration(s), %d tool call(s)",
        agent_result.iterations,
        len(agent_result.tool_calls),
    )

    if plan_service.plan and not conversation.plan_id:
        conversation.plan_id = plan_service.plan.id
        log.info("Linked conversation %s to plan %s", conversation.id, plan_service.plan.id)

    await _save_conversation_messages(session, conversation, message, messages, history)

    if agent_result.pending_questions:
        conversation.pending_questions_json = json.dumps(agent_result.pending_questions)
    else:
        conversation.pending_questions_json = None

    await session.commit()

    final_plan = agent_result.plan
    final_artifacts = await plan_service.get_artifacts()
    composed_sql = _compose_sql(final_artifacts)

    return ChatResult(
        response_text=agent_result.response_text,
        conversation_id=conversation.id,
        composed_sql=composed_sql,
        agent_result=agent_result,
        plan=final_plan,
        artifacts=final_artifacts,
    )


def _load_history(conversation: Conversation) -> list[dict]:
    return [
        m.to_openai_message() for m in conversation.messages
        if m.role in ("user", "assistant") and not m.tool_calls_json
    ]


def _compose_sql(artifacts: list[dict]) -> str | None:
    if not artifacts:
        return None

    named = {a["name"]: a for a in artifacts if a.get("name")}
    payout = named.get("payout")
    if not payout:
        return artifacts[-1]["sql"]

    cte_parts = []
    for a in artifacts:
        if a["name"] != "payout":
            cte_parts.append(f"{a['name']} AS (\n  {a['sql']}\n)")

    if not cte_parts:
        return payout["sql"]

    cte_block = ",\n".join(cte_parts)
    return f"WITH {cte_block}\n{payout['sql']}"


async def _save_conversation_messages(
    session: AsyncSession,
    conversation: Conversation,
    user_message: str,
    all_messages: list[dict],
    history: list[dict],
) -> None:
    new_msg_start = len(history) + 2

    session.add(ConversationMessage(
        conversation_id=conversation.id, role="user", content=user_message,
    ))

    for msg in all_messages[new_msg_start:]:
        tc_json = json.dumps(msg["tool_calls"]) if msg.get("tool_calls") else None
        session.add(ConversationMessage(
            conversation_id=conversation.id,
            role=msg["role"],
            content=msg.get("content") or "",
            tool_call_id=msg.get("tool_call_id"),
            tool_calls_json=tc_json,
        ))

    if conversation.title is None:
        conversation.title = user_message[:120]


async def _build_user_content(
    message: str,
    file_ids: list[str] | None,
    session: AsyncSession,
) -> str | list[dict]:
    if not file_ids:
        return message

    parts: list[dict] = [{"type": "text", "text": message}]

    for fid in file_ids:
        result = await session.execute(select(ChatFile).where(ChatFile.id == fid))
        chat_file = result.scalar_one_or_none()
        if not chat_file:
            continue

        b64 = base64.b64encode(chat_file.content).decode("utf-8")
        data_uri = f"data:{chat_file.mime_type};base64,{b64}"

        if chat_file.mime_type.startswith("image/"):
            parts.append({"type": "image_url", "image_url": {"url": data_uri}})
        elif chat_file.mime_type == "application/pdf":
            parts.append({"type": "file", "file": {"filename": chat_file.filename, "file_data": data_uri}})
        elif chat_file.mime_type == "text/csv":
            text_content = chat_file.content.decode("utf-8", errors="replace")
            parts.append({"type": "text", "text": f"File: {chat_file.filename}\n```csv\n{text_content}\n```"})
        else:
            text_content = chat_file.content.decode("utf-8", errors="replace")
            parts.append({"type": "text", "text": f"File: {chat_file.filename}\n{text_content}"})

    return parts


async def _load_active_template(session: AsyncSession) -> str | None:
    result = await session.execute(
        select(PlanTemplate).order_by(PlanTemplate.created_at.desc()).limit(1)
    )
    tpl = result.scalar_one_or_none()
    return tpl.content if tpl else None


async def _load_plan(plan_id: str, session: AsyncSession) -> Plan:
    result = await session.execute(
        select(Plan).options(
            selectinload(Plan.artifacts), selectinload(Plan.config),
            selectinload(Plan.inferred_config), selectinload(Plan.cycles)
        ).where(Plan.id == plan_id)
    )
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail=f"Plan {plan_id} not found")
    return plan


async def _pin_skills_to_conversation(
    conversation_id: str, skill_ids: list[str], session: AsyncSession,
) -> None:
    for sid in skill_ids:
        result = await session.execute(
            select(SkillVersion)
            .where(SkillVersion.skill_id == sid)
            .order_by(SkillVersion.version.desc())
            .limit(1)
        )
        sv = result.scalar_one_or_none()
        if sv:
            session.add(ConversationSkillVersion(
                conversation_id=conversation_id, skill_version_id=sv.id,
            ))
    await session.flush()


async def _load_conversation_skills(conversation_id: str, session: AsyncSession) -> list[dict]:
    result = await session.execute(
        select(Skill.name, SkillVersion.content)
        .select_from(ConversationSkillVersion)
        .join(SkillVersion, ConversationSkillVersion.skill_version_id == SkillVersion.id)
        .join(Skill, SkillVersion.skill_id == Skill.id)
        .where(ConversationSkillVersion.conversation_id == conversation_id)
    )
    return [{"name": name, "content": content} for name, content in result.all()]


async def _get_or_create_conversation(
    conversation_id: str | None,
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
            raise HTTPException(status_code=404, detail=f"Conversation {conversation_id} not found")
        return conv

    conv = Conversation()
    session.add(conv)
    await session.flush()

    result = await session.execute(
        select(Conversation)
        .options(selectinload(Conversation.messages))
        .where(Conversation.id == conv.id)
    )
    return result.scalar_one()
