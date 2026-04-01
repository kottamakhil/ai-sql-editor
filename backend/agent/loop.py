from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass, field
from typing import Any

from llm import call_openai_with_tools
from services.plan_service import PlanServiceBase
from tools import registry
from tools.ask_clarification import CLARIFICATION_TOOL_NAME
from tools.base import ProgressCallback, ToolContext, ToolResult

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



async def _emit(cb: ProgressCallback | None, event: dict) -> None:
    if cb:
        try:
            await cb(event)
        except Exception:
            log.debug("Progress callback error (ignored)", exc_info=True)


def _summarise_args(tool_name: str, arguments: dict) -> str:
    """Return a brief human-readable summary of tool arguments."""
    if tool_name == "update_sql_artifacts":
        names = [a.get("name", "?") for a in arguments.get("artifacts", [])]
        return f"artifacts: {', '.join(names)}"
    if tool_name == "create_plan":
        return arguments.get("name", "")
    if tool_name == "execute_query":
        sql = arguments.get("sql", "")
        return sql[:80] + ("..." if len(sql) > 80 else "")
    return json.dumps(arguments)[:120]


async def run_agent_loop(
    messages: list[dict],
    plan_service: PlanServiceBase,
    skills: list[dict],
    schema_ddls: list[str],
    on_progress: ProgressCallback | None = None,
) -> AgentResult:
    context = ToolContext(
        plan_service=plan_service,
        skills=skills,
        schema_ddls=schema_ddls,
        on_progress=on_progress,
    )
    tool_definitions = registry.openai_tool_definitions()
    all_tool_calls: list[ToolCallRecord] = []
    final_text = ""

    for iteration in range(MAX_ITERATIONS):
        log.info("Agent iteration %d, sending %d messages", iteration + 1, len(messages))
        await _emit(on_progress, {"type": "iteration", "index": iteration})

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
            await _emit(on_progress, {
                "type": "tool_start",
                "tool": tool_name,
                "arguments_summary": _summarise_args(tool_name, arguments),
            })

            t0 = time.monotonic()
            try:
                tool = registry.get(tool_name)
                result = await tool.execute(arguments, context)
            except KeyError:
                result = ToolResult(success=False, error=f"Unknown tool: {tool_name}")
            except Exception as exc:
                log.error("Tool %s failed: %s", tool_name, exc, exc_info=True)
                result = ToolResult(success=False, error=str(exc))

            duration_ms = int((time.monotonic() - t0) * 1000)
            log.info("Tool %s result: success=%s (%dms)", tool_name, result.success, duration_ms)
            complete_event: dict[str, Any] = {
                "type": "tool_complete",
                "tool": tool_name,
                "success": result.success,
                "duration_ms": duration_ms,
                "result_summary": result.error or f"{len(result.data)} key(s) in result",
            }
            if tool_name == "create_plan" and result.success:
                plan_data = result.data.get("plan", {})
                if isinstance(plan_data, dict) and plan_data.get("plan_id"):
                    complete_event["plan_id"] = plan_data["plan_id"]
            await _emit(on_progress, complete_event)

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
    for tc in reversed(tool_calls):
        if tc.tool_name == CLARIFICATION_TOOL_NAME and tc.result.success:
            return tc.result.data.get("questions", [])
    return None
