"""Service layer for the /chat endpoint.

Orchestrates the agent loop, persists conversation messages,
and returns a structured ChatResult for the route handler.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass

from fastapi import HTTPException
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from agent import AgentResult, build_system_prompt, run_agent_loop
from models import Conversation, ConversationMessage, Plan, PlanSkillVersion, Skill, SkillVersion, SqlArtifact
from services.sqlalchemy_plan_service import SqlAlchemyPlanService

log = logging.getLogger(__name__)

BUSINESS_TABLES = {"employees", "deals", "quotas"}


@dataclass
class ChatResult:
    """Structured output from a single chat turn."""

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
) -> ChatResult:
    """Run a full chat turn: load context, invoke agent, persist, return result."""

    conversation = await _get_or_create_conversation(conversation_id, session)

    plan = None
    if conversation.plan_id:
        plan = await _load_plan(conversation.plan_id, session)

    plan_service = SqlAlchemyPlanService(session, plan)
    schema_ddls = await _get_schema_ddls(session)

    if skill_ids:
        skills_dict = await _load_skills_by_ids(skill_ids, session)
    elif plan:
        skills_dict = await _load_pinned_skills(plan.id, session)
    else:
        skills_dict = []

    plan_dict = await plan_service.get_plan()
    artifacts_dict = await plan_service.get_artifacts()

    system_prompt = build_system_prompt(plan_dict, artifacts_dict, skills_dict, schema_ddls)
    history = _load_history(conversation)

    messages = [
        {"role": "system", "content": system_prompt},
        *history,
        {"role": "user", "content": message},
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
    """Filter conversation messages to only user + final assistant (no tool calls)."""

    return [
        m.to_openai_message() for m in conversation.messages
        if m.role in ("user", "assistant") and not m.tool_calls_json
    ]


def _compose_sql(artifacts: list[dict]) -> str | None:
    """Build a WITH/CTE query from artifact dicts."""

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
    """Persist the user message and all agent-generated messages."""

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


# --- Data access helpers ---


async def _load_plan(plan_id: str, session: AsyncSession) -> Plan:
    """Load a plan with its artifacts eagerly loaded."""

    result = await session.execute(
        select(Plan).options(selectinload(Plan.artifacts)).where(Plan.id == plan_id)
    )
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail=f"Plan {plan_id} not found")
    return plan


async def _load_pinned_skills(plan_id: str, session: AsyncSession) -> list[dict]:
    """Load skill versions pinned to a plan."""

    result = await session.execute(
        select(Skill.name, SkillVersion.content)
        .join(SkillVersion, PlanSkillVersion.skill_version_id == SkillVersion.id)
        .join(Skill, SkillVersion.skill_id == Skill.id)
        .where(PlanSkillVersion.plan_id == plan_id)
    )
    return [{"name": name, "content": content} for name, content in result.all()]


async def _load_skills_by_ids(skill_ids: list[str], session: AsyncSession) -> list[dict]:
    """Resolve skill_ids to their latest versions (for chat-time override)."""

    skills_dict = []
    for sid in skill_ids:
        result = await session.execute(
            select(Skill.name, SkillVersion.content)
            .join(SkillVersion, SkillVersion.skill_id == Skill.id)
            .where(Skill.id == sid)
            .order_by(SkillVersion.version.desc())
            .limit(1)
        )
        row = result.one_or_none()
        if row:
            skills_dict.append({"name": row[0], "content": row[1]})
    return skills_dict


async def _get_schema_ddls(session: AsyncSession) -> list[str]:
    """Fetch CREATE TABLE DDLs for business tables from information_schema."""

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


async def _get_or_create_conversation(
    conversation_id: str | None,
    session: AsyncSession,
) -> Conversation:
    """Load an existing conversation or create a new one (no plan_id required)."""

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
