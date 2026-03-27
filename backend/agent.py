"""Agent loop orchestrator.

Calls the LLM with tools, dispatches tool calls, loops until done.
Portable across storage backends -- depends only on PlanServiceBase.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from typing import Any

from llm import call_openai_with_tools
from services.plan_service import PlanServiceBase
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
    plan: dict | None = None


def build_system_prompt(
    plan: dict | None,
    artifacts: list[dict],
    skills: list[dict],
    schema_ddls: list[str],
) -> str:
    """Build the system prompt from plain dicts (no ORM dependency)."""

    tables_block = "\n\n".join(schema_ddls)

    skills_block = ""
    if skills:
        skills_block = "\n".join(f"- {s['name']}: {s['content']}" for s in skills)

    if plan:
        plan_block = f"Name: {plan['name']}\nType: {plan['plan_type']}\nFrequency: {plan['frequency']}"
        cfg = plan.get("config", {})
        payout = cfg.get("payout", {})
        payroll = cfg.get("payroll", {})
        disputes = cfg.get("disputes", {})
        config_block = (
            f"Payout: automatic={payout.get('is_automatic_payout_enabled', False)}, "
            f"offset={payout.get('final_payment_offset')}, "
            f"draws={payout.get('is_draws_enabled', False)}, "
            f"draw_frequency={payout.get('draw_frequency')}\n"
            f"Payroll: payout_type={payroll.get('payout_type')}\n"
            f"Disputes: enabled={disputes.get('is_disputes_enabled', True)}"
        )
    else:
        plan_block = "No plan exists yet."
        config_block = "N/A"

    artifacts_block = ""
    if artifacts:
        lines = [f'- name: "{a["name"]}", sql: "{a["sql"]}"' for a in artifacts]
        artifacts_block = "\n".join(lines)

    return f"""You are an AI SQL assistant for building commission plans.

You have tools available to create plans, modify plan metadata and config, update SQL artifacts,
execute queries, and validate SQL. Use them as needed to fulfill the user's request.

<available_tables>
{tables_block}
</available_tables>

<skills>
{skills_block}
</skills>

<current_plan>
{plan_block}
</current_plan>

<current_plan_config>
{config_block}
</current_plan_config>

<current_sql_artifacts>
{artifacts_block}
</current_sql_artifacts>

Guidelines:
- If no plan exists and the user wants to build commission SQL, call create_plan first.
- When building or modifying commission SQL, use the update_sql_artifacts tool.
- Always provide the COMPLETE set of artifacts. The system replaces all on each call.
- Decompose complex queries into named CTE artifacts (e.g. "base_deals", "commissions").
- The final artifact must always be named "payout".
- Use execute_query to explore data or answer questions about the dataset.
- Use validate_sql to check SQL correctness before committing artifacts.
- Use update_plan to change plan name, type, or frequency.
- Use update_plan_config to configure payout timing, payroll integration, or dispute settings.
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
    plan_service: PlanServiceBase,
    skills: list[dict],
    schema_ddls: list[str],
) -> AgentResult:
    """Run the tool-calling loop until the LLM stops or max iterations."""

    context = ToolContext(
        plan_service=plan_service,
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
            log.info("Agent done after %d iteration(s)", iteration + 1)
            messages.append({"role": "assistant", "content": response_message.content or ""})
            return AgentResult(
                response_text=final_text,
                tool_calls=all_tool_calls,
                iterations=iteration + 1,
                plan=await plan_service.get_plan(),
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
            ],
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
                tool_name=tool_name, arguments=arguments, result=result,
            ))

            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": result.to_message(),
            })

        clarification = _extract_clarification(all_tool_calls)
        if clarification is not None:
            log.info("Agent paused for clarification (%d question(s))", len(clarification))
            return AgentResult(
                response_text=final_text or "I have a few questions before proceeding.",
                tool_calls=all_tool_calls,
                iterations=iteration + 1,
                pending_questions=clarification,
                plan=await plan_service.get_plan(),
            )

    log.warning("Agent hit max iterations (%d)", MAX_ITERATIONS)
    return AgentResult(
        response_text=final_text or "I reached the maximum number of steps.",
        tool_calls=all_tool_calls,
        iterations=MAX_ITERATIONS,
        plan=await plan_service.get_plan(),
    )


def _extract_clarification(tool_calls: list[ToolCallRecord]) -> list[dict] | None:
    """Return questions if the most recent batch included ask_clarification."""
    for tc in reversed(tool_calls):
        if tc.tool_name == CLARIFICATION_TOOL_NAME and tc.result.success:
            return tc.result.data.get("questions", [])
    return None
