import json
import logging
import os
import re

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


class SqlArtifactSpec(BaseModel):
    name: str
    sql: str


class ParsedLlmResponse(BaseModel):
    response_text: str
    artifacts: list[SqlArtifactSpec]


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
            lines.append(f'- name: "{a.name}", sql: "{a.sql_expression}"')
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
2. Return the COMPLETE set of SQL artifacts in a JSON block tagged as ```json:sql_artifacts.
   Each artifact must have a name and SQL:
   {{"name": "descriptive_name", "sql": "SELECT ..."}}
3. Always return ALL artifacts needed for the plan, even if only one part changed.
   The system replaces all artifacts on each turn.
4. Decompose complex queries into named CTE artifacts:
   - Each CTE should have a descriptive name (e.g. "base_deals", "commissions", "quota_attainment")
   - Named artifacts can reference other named artifacts by name as if they were tables
   - The final artifact must always be named "payout" — it assembles the result from the named CTEs
   - Each CTE should be independently understandable"""


async def call_openai(messages: list[dict]) -> str:
    response = await _get_client().chat.completions.create(
        model=OPENAI_MODEL,
        messages=messages,
        temperature=0.2,
    )
    return response.choices[0].message.content or ""


def parse_llm_response(response_text: str) -> ParsedLlmResponse:
    pattern = r"```json:sql_artifacts\s*\n(.*?)```"
    match = re.search(pattern, response_text, re.DOTALL)

    if not match:
        return ParsedLlmResponse(response_text=response_text, artifacts=[])

    try:
        raw_list = json.loads(match.group(1).strip())
    except json.JSONDecodeError:
        log.warning("Failed to parse sql_artifacts JSON from LLM response")
        return ParsedLlmResponse(response_text=response_text, artifacts=[])

    artifacts = []
    for raw in raw_list:
        try:
            artifacts.append(SqlArtifactSpec(**raw))
        except Exception:
            log.warning("Skipping malformed artifact: %s", raw)
            continue

    return ParsedLlmResponse(response_text=response_text, artifacts=artifacts)
