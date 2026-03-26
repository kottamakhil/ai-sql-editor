from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from executor import _build_cte_query, _find_final_artifact, _resolve_dependencies
from llm import call_openai_with_tools
from models import Plan, Skill, SqlArtifact
from tools import registry
from tools.ask_clarification import CLARIFICATION_TOOL_NAME
from tools.base import ToolContext, ToolResult

log = logging.getLogger(__name__)

MAX_ITERATIONS = 10


@dataclass
class ToolCallRecord:
    tool_name: str
    arguments: dict[str, Any]
    result: ToolResult


@dataclass
class AgentResult:
    response_text: str
    tool_calls: list[ToolCallRecord] = field(default_factory=list)
    iterations: int = 0
    pending_questions: list[dict] | None = None


def build_system_prompt(
    plan: Plan,
    artifacts: list[SqlArtifact],
    skills: list[Skill],
    schema_ddls: list[str],
) -> str:
    tables_block = "\n\n".join(schema_ddls)

    skills_block = ""
    if skills:
        skills_block = "\n".join(f"- {s.name}: {s.content}" for s in skills)

    artifacts_block = ""
    if artifacts:
        lines = [f'- name: "{a.name}", sql: "{a.sql_expression}"' for a in artifacts]
        artifacts_block = "\n".join(lines)

    return f"""You are an AI SQL assistant for building commission plans.

You have tools available to modify the plan, update SQL artifacts, execute queries,
and validate SQL. Use them as needed to fulfill the user's request.

<available_tables>
{tables_block}
</available_tables>

<skills>
{skills_block}
</skills>

<current_plan>
Name: {plan.name}
Type: {plan.plan_type}
Frequency: {plan.frequency}
</current_plan>

<current_sql_artifacts>
{artifacts_block}
</current_sql_artifacts>

Guidelines:
- When building or modifying commission SQL, use the update_sql_artifacts tool.
- Always provide the COMPLETE set of artifacts. The system replaces all on each call.
- Decompose complex queries into named CTE artifacts (e.g. "base_deals", "commissions").
- The final artifact must always be named "payout".
- Use execute_query to explore data or answer questions about the dataset.
- Use validate_sql to check SQL correctness before committing artifacts.
- Use update_plan to change plan name, type, or frequency.
- If a tool returns an error, fix the issue and retry.
- In your final response, always include the full composed SQL that combines all
  artifacts into a single WITH/CTE statement inside a ```sql code block.
- If the user's request is missing critical details (commission rate, deal filter,
  threshold, frequency), use ask_clarification to get structured answers with options.
- Only ask about genuinely ambiguous things. If you can make a reasonable default, proceed.
- Group related questions together in a single ask_clarification call.
- Do NOT ask clarification if the user is modifying an existing plan and the intent is clear."""


async def run_agent_loop(
    messages: list[dict],
    plan: Plan,
    session: AsyncSession,
    artifacts: list[SqlArtifact],
    skills: list[Skill],
    schema_ddls: list[str],
) -> AgentResult:
    context = ToolContext(
        session=session,
        plan=plan,
        artifacts=artifacts,
        skills=skills,
        schema_ddls=schema_ddls,
    )
    tool_definitions = registry.openai_tool_definitions()
    all_tool_calls: list[ToolCallRecord] = []
    final_text = ""

    for iteration in range(MAX_ITERATIONS):
        log.info("Agent iteration %d, sending %d messages", iteration + 1, len(messages))

        response_message = await call_openai_with_tools(messages, tool_definitions)

        if response_message.content:
            final_text = response_message.content

        if not response_message.tool_calls:
            log.info("Agent done after %d iteration(s) — no more tool calls", iteration + 1)
            messages.append({"role": "assistant", "content": response_message.content or ""})
            return AgentResult(
                response_text=final_text,
                tool_calls=all_tool_calls,
                iterations=iteration + 1,
            )

        assistant_msg: dict = {
            "role": "assistant",
            "content": response_message.content or "",
            "tool_calls": [
                {
                    "id": tc.id,
                    "type": "function",
                    "function": {"name": tc.function.name, "arguments": tc.function.arguments},
                }
                for tc in response_message.tool_calls
            ]
        }
        messages.append(assistant_msg)

        for tool_call in response_message.tool_calls:
            tool_name = tool_call.function.name
            try:
                arguments = json.loads(tool_call.function.arguments)
            except json.JSONDecodeError:
                log.error("Failed to parse arguments for tool %s", tool_name)
                arguments = {}

            log.info("Calling tool: %s(%s)", tool_name, json.dumps(arguments)[:200])

            try:
                tool = registry.get(tool_name)
                result = await tool.execute(arguments, context)
            except KeyError:
                result = ToolResult(success=False, error=f"Unknown tool: {tool_name}")
            except Exception as exc:
                log.error("Tool %s failed: %s", tool_name, exc, exc_info=True)
                result = ToolResult(success=False, error=str(exc))

            log.info("Tool %s result: success=%s", tool_name, result.success)

            all_tool_calls.append(ToolCallRecord(
                tool_name=tool_name,
                arguments=arguments,
                result=result,
            ))

            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": result.to_message(),
            })

        clarifying_questions = _extract_clarifying_questions(all_tool_calls)
        if clarifying_questions is not None:
            log.info("Agent paused for clarification (%d question(s))", len(clarifying_questions))
            return AgentResult(
                response_text=final_text or "I have a few questions before proceeding.",
                tool_calls=all_tool_calls,
                iterations=iteration + 1,
                pending_questions=clarifying_questions,
            )

    log.warning("Agent hit max iterations (%d)", MAX_ITERATIONS)
    return AgentResult(
        response_text=final_text or "I reached the maximum number of steps. Please continue the conversation.",
        tool_calls=all_tool_calls,
        iterations=MAX_ITERATIONS,
    )


def _extract_clarifying_questions(tool_calls: list[ToolCallRecord]) -> list[dict] | None:
    """Return the questions list if the most recent tool call batch included ask_clarification."""
    for tc in reversed(tool_calls):
        if tc.tool_name == CLARIFICATION_TOOL_NAME and tc.result.success:
            return tc.result.data.get("questions", [])
    return None


def compose_sql_from_artifacts(artifacts: list[SqlArtifact]) -> str | None:
    if not artifacts:
        return None
    named = {a.name: a for a in artifacts if a.name}
    final = _find_final_artifact(artifacts)
    deps = _resolve_dependencies(final, named)
    return _build_cte_query(deps, final.sql_expression)
