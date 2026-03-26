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

from agent import AgentResult, build_system_prompt, compose_sql_from_artifacts, run_agent_loop
from models import Conversation, ConversationMessage, Plan, Skill, SqlArtifact

log = logging.getLogger(__name__)

BUSINESS_TABLES = {"employees", "deals", "quotas"}


@dataclass
class ChatResult:
    """Structured output from a single chat turn."""

    response_text: str
    conversation_id: str
    composed_sql: str | None
    agent_result: AgentResult
    plan: Plan
    artifacts: list[SqlArtifact]


async def process_chat(
    plan_id: str,
    message: str,
    conversation_id: str | None,
    session: AsyncSession,
) -> ChatResult:
    """Run a full chat turn: load context, invoke agent, persist, return result."""

    plan = await _load_plan(plan_id, session)
    conversation = await _get_or_create_conversation(conversation_id, plan_id, session)
    skills = await _load_skills(session)
    schema_ddls = await _get_schema_ddls(session)

    messages = _build_messages(plan, list(plan.artifacts), skills, schema_ddls, conversation, message)

    agent_result = await run_agent_loop(
        messages=messages,
        plan=plan,
        session=session,
        artifacts=list(plan.artifacts),
        skills=skills,
        schema_ddls=schema_ddls,
    )
    log.info(
        "Agent finished: %d iteration(s), %d tool call(s)",
        agent_result.iterations,
        len(agent_result.tool_calls),
    )

    await _save_conversation_messages(session, conversation, message, messages)

    if agent_result.pending_questions:
        conversation.pending_questions_json = json.dumps(agent_result.pending_questions)
    else:
        conversation.pending_questions_json = None

    await session.commit()

    await session.refresh(plan)
    artifacts = await _load_artifacts(plan_id, session)
    composed_sql = compose_sql_from_artifacts(artifacts)

    return ChatResult(
        response_text=agent_result.response_text,
        conversation_id=conversation.id,
        composed_sql=composed_sql,
        agent_result=agent_result,
        plan=plan,
        artifacts=artifacts,
    )


def _build_messages(
    plan: Plan,
    artifacts: list[SqlArtifact],
    skills: list[Skill],
    schema_ddls: list[str],
    conversation: Conversation,
    user_message: str,
) -> list[dict]:
    """Assemble the OpenAI messages array with system prompt, filtered history, and new user message."""

    system_prompt = build_system_prompt(plan, artifacts, skills, schema_ddls)

    history = [
        m.to_openai_message() for m in conversation.messages
        if m.role in ("user", "assistant") and not m.tool_calls_json
    ]

    return [
        {"role": "system", "content": system_prompt},
        *history,
        {"role": "user", "content": user_message},
    ]


async def _save_conversation_messages(
    session: AsyncSession,
    conversation: Conversation,
    user_message: str,
    all_messages: list[dict],
) -> None:
    """Persist the user message and all agent-generated messages to the conversation."""

    history_count = sum(
        1 for m in conversation.messages
        if m.role in ("user", "assistant") and not m.tool_calls_json
    )
    new_msg_start = history_count + 2

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


async def _load_skills(session: AsyncSession) -> list[Skill]:
    """Load all skills for inclusion in the system prompt."""

    result = await session.execute(select(Skill))
    return list(result.scalars())


async def _load_artifacts(plan_id: str, session: AsyncSession) -> list[SqlArtifact]:
    """Load artifacts for a plan, ordered by creation time."""

    result = await session.execute(
        select(SqlArtifact).where(SqlArtifact.plan_id == plan_id).order_by(SqlArtifact.created_at)
    )
    return list(result.scalars())


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
    plan_id: str,
    session: AsyncSession,
) -> Conversation:
    """Load an existing conversation or create a new one for the plan."""

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

    conv = Conversation(plan_id=plan_id)
    session.add(conv)
    await session.flush()

    result = await session.execute(
        select(Conversation)
        .options(selectinload(Conversation.messages))
        .where(Conversation.id == conv.id)
    )
    return result.scalar_one()
