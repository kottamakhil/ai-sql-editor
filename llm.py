import json
import logging
import os
import re
from typing import Literal

from openai import AsyncOpenAI
from pydantic import BaseModel

from models import Plan, Skill, SqlArtifact

log = logging.getLogger(__name__)

OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o")

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI()
    return _client


class SqlOperation(BaseModel):
    action: Literal["create", "update", "delete"]
    artifact_id: str | None = None
    name: str | None = None
    sql: str | None = None


class ParsedLlmResponse(BaseModel):
    response_text: str
    operations: list[SqlOperation]


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
        lines = []
        for a in artifacts:
            name_display = f'"{a.name}"' if a.name else "null"
            lines.append(f'- artifact_id: "{a.id}", name: {name_display}, sql: "{a.sql_expression}"')
        artifacts_block = "\n".join(lines)

    return f"""You are an AI SQL assistant for building commission plans.

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

When the user asks you to build or modify commission SQL:

1. Return your explanation as plain text.
2. Return SQL operations in a JSON block tagged as ```json:sql_operations.
3. Each operation must be one of:
   - {{"action": "create", "name": "cte_name", "sql": "SELECT ..."}} — new named CTE artifact
   - {{"action": "create", "sql": "SELECT ..."}} — new standalone/final query (no name)
   - {{"action": "update", "artifact_id": "art_1", "sql": "SELECT ..."}} — replace SQL on existing artifact
   - {{"action": "delete", "artifact_id": "art_2"}} — remove an artifact

4. Prefer decomposing complex queries into named CTE artifacts:
   - Each CTE should have a descriptive name (e.g. "base_deals", "commissions", "quota_attainment")
   - Named artifacts can reference other named artifacts by name as if they were tables
   - The final artifact (name=null) assembles the result from the named CTEs
   - Each CTE should be independently understandable

5. Always reference artifact_id from <current_sql_artifacts> when updating or deleting.
6. If the user edits SQL on the left panel and asks you to refine it, update that specific artifact by artifact_id.
7. You may return multiple operations in one response."""


async def call_openai(messages: list[dict]) -> str:
    response = await _get_client().chat.completions.create(
        model=OPENAI_MODEL,
        messages=messages,
        temperature=0.2,
    )
    return response.choices[0].message.content or ""


def parse_sql_operations(response_text: str) -> ParsedLlmResponse:
    pattern = r"```json:sql_operations\s*\n(.*?)```"
    match = re.search(pattern, response_text, re.DOTALL)

    if not match:
        return ParsedLlmResponse(response_text=response_text, operations=[])

    try:
        raw_ops = json.loads(match.group(1).strip())
    except json.JSONDecodeError:
        log.warning("Failed to parse sql_operations JSON from LLM response")
        return ParsedLlmResponse(response_text=response_text, operations=[])

    operations = []
    for raw in raw_ops:
        try:
            operations.append(SqlOperation(**raw))
        except Exception:
            log.warning("Skipping malformed operation", extra={"raw": raw})
            continue

    clean_text = re.sub(pattern, "", response_text, flags=re.DOTALL).strip()
    return ParsedLlmResponse(response_text=clean_text, operations=operations)
