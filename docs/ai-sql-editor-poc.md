# AI-Powered Online SQL Editor — POC Specification

## Overview

A Python FastAPI application that serves as an AI-powered SQL commission plan editor. The app has a split-panel UX: left side shows SQL artifacts (decomposed as named CTEs), right side is an AI chat. The AI generates SQL from natural language using OpenAI tool calling, decomposes complex queries into named CTE artifacts, persists them, executes them, and returns results.

The chat is **session-based** — no plan is required to start chatting. The LLM creates plans via the `create_plan` tool when needed. Each conversation is linked to at most one plan.

---

## Core Concept: CTE-Based SQL Artifacts

The LLM decomposes SQL into named artifacts that act as CTEs:

- **Named CTEs** — have a `name` field (e.g. `base_deals`, `commissions`). Can be referenced by other artifacts by name.
- **Final query** — always named `payout`. Assembles the result from the named CTEs.

When executing an individual artifact, the backend resolves its dependencies and wraps them as a `WITH` clause. When executing the full plan, the backend builds the complete CTE chain from the dependency graph.

### Example

```
Artifact 1: name="base_deals"
  sql: SELECT * FROM deals WHERE stage = 'Closed Won' AND deal_value >= 50000

Artifact 2: name="commissions"
  sql: SELECT employee_id, SUM(deal_value * 0.10) AS commission
       FROM base_deals GROUP BY employee_id

Artifact 3: name="payout"
  sql: SELECT e.name, c.commission
       FROM commissions c JOIN employees e ON e.id = c.employee_id
       ORDER BY c.commission DESC
```

**Executing Artifact 2 individually** produces:

```sql
WITH base_deals AS (
  SELECT * FROM deals WHERE stage = 'Closed Won' AND deal_value >= 50000
)
SELECT employee_id, SUM(deal_value * 0.10) AS commission
FROM base_deals GROUP BY employee_id
```

**Executing the full plan (payout)** produces:

```sql
WITH base_deals AS (
  SELECT * FROM deals WHERE stage = 'Closed Won' AND deal_value >= 50000
),
commissions AS (
  SELECT employee_id, SUM(deal_value * 0.10) AS commission
  FROM base_deals GROUP BY employee_id
)
SELECT e.name, c.commission
FROM commissions c JOIN employees e ON e.id = c.employee_id
ORDER BY c.commission DESC
```

---

## Data Layer (PostgreSQL / Supabase)

### Business tables (~20 rows each, seeded on startup)

```sql
employees (id, name, department, role, start_date)
deals (id, employee_id, deal_value, stage, closed_date, region)
quotas (id, employee_id, quarter, target_amount, attainment_pct)
```

### Application tables

```sql
plans (id, name, plan_type, frequency, mode, created_at)
-- plan_type: RECURRING | ONE_TIME
-- frequency: MONTHLY | QUARTERLY | ANNUALLY
-- mode: AI_ASSISTED

sql_artifacts (id, plan_id FK, name, sql_expression, created_at)
-- name: CTE alias (final artifact is always named "payout")

skills (id, name, content, created_at)

conversations (id, plan_id FK nullable, title, pending_questions_json, created_at)
-- plan_id is nullable: conversations can exist before a plan is created

conversation_messages (id, conversation_id FK, role, content, tool_call_id, tool_calls_json, created_at)
-- role: user | assistant | tool
-- tool_call_id: links tool response to the tool_call that triggered it
-- tool_calls_json: serialized tool calls for assistant messages that invoke tools
```

---

## Architecture

### Session-Based Chat

The `/api/chat` endpoint only requires `message` and an optional `conversation_id`. No `plan_id` is needed. The conversation is the workspace — plans are outputs created by the LLM via tools.

When a conversation is resumed, the backend loads the linked plan (if any) and its artifacts into the system prompt so the LLM always sees the latest state, including manual edits made via the left panel.

### Agentic Tool Calling

The chat endpoint runs a multi-turn agent loop using OpenAI's tool calling API:

1. Build system prompt with current plan state, artifacts, skills, and table schemas
2. Call OpenAI with tools defined
3. If the LLM returns tool calls, execute each one via the tool registry
4. Feed tool results back to the LLM
5. Repeat until the LLM returns a text-only response (no more tool calls)
6. Max 10 iterations as a safety bound

### Available Tools

| Tool | Description |
|------|-------------|
| `create_plan` | Create a new commission plan (name, type, frequency) |
| `update_sql_artifacts` | Replace ALL SQL artifacts for the plan (delete-all, create-all, execute) |
| `update_plan` | Update plan metadata (name, type, frequency) |
| `execute_query` | Run a read-only SQL query for data exploration |
| `validate_sql` | Check SQL correctness via EXPLAIN without side effects |
| `ask_clarification` | Return structured questions when the request is ambiguous |

### PlanService Interface (Portable Tools)

Tools don't touch the database directly. They call methods on a `PlanServiceBase` abstract interface:

```python
class PlanServiceBase(ABC):
    async def create_plan(self, name, plan_type, frequency) -> dict
    async def update_plan(self, **fields) -> dict
    async def get_plan(self) -> dict | None
    async def replace_artifacts(self, specs: list[dict]) -> list[dict]
    async def execute_sql(self, sql: str) -> dict
    async def validate_sql(self, sql: str) -> dict
```

The POC implements this with `SqlAlchemyPlanService`. In production, swap with a Django+MongoDB implementation. The tools, agent loop, and LLM client are identical in both environments.

### Clarification Flow

When the user's request is vague, the LLM calls `ask_clarification` with structured questions and predefined options. The agent loop pauses, questions are persisted to `conversation.pending_questions_json`, and returned to the FE. On page refresh, `GET /api/conversations/{id}` includes `pending_questions` so the FE can restore the form. When the user answers, questions are cleared.

### Artifact Replacement Strategy

On each chat turn where the LLM produces SQL artifacts, the backend:

1. Deletes all existing artifacts for the plan
2. Creates all new artifacts from the LLM's response
3. Executes each artifact and returns results

This avoids relying on the LLM to manage artifact IDs or emit update/delete operations.

### Conversation History

Full tool call history (assistant + tool messages) is saved to the DB for audit/debugging. When loading history for the next LLM call, only user and final assistant messages are included (no tool call/response messages) to keep token usage low. The system prompt carries the current plan state.

---

## API Endpoints

### Chat (Primary Interaction)

`POST /api/chat`

**Request:**

```json
{
  "message": "Create a quarterly 10% commission plan on closed-won deals over $50k",
  "conversation_id": "optional — omit to start a new conversation"
}
```

**Response:**

```json
{
  "response": "I've created a quarterly commission plan...\n\n```sql\nWITH base_deals AS (...) ...\n```",
  "conversation_id": "conv_1",
  "composed_sql": "WITH base_deals AS (...), commissions AS (...) SELECT ...",
  "tool_calls": [
    {"tool_name": "create_plan", "arguments": {"name": "Q1 Sales", ...}, "success": true, "result_data": {...}},
    {"tool_name": "update_sql_artifacts", "arguments": {"artifacts": [...]}, "success": true, "result_data": {...}}
  ],
  "current_artifacts": [
    {"artifact_id": "art_1", "name": "base_deals", "sql_expression": "SELECT ..."},
    {"artifact_id": "art_2", "name": "commissions", "sql_expression": "SELECT ..."},
    {"artifact_id": "art_3", "name": "payout", "sql_expression": "SELECT ..."}
  ],
  "plan": {
    "plan_id": "plan_1",
    "name": "Q1 Sales",
    "plan_type": "RECURRING",
    "frequency": "QUARTERLY",
    "mode": "AI_ASSISTED",
    "conversation_id": "conv_1"
  },
  "iterations": 2,
  "pending_questions": null
}
```

### Plan CRUD

- `GET /api/plans` — list all plans (includes `conversation_id`)
- `POST /api/plans` — create a plan via REST (name, plan_type, frequency)
- `GET /api/plans/{plan_id}` — plan with artifacts and `conversation_id`
- `PATCH /api/plans/{plan_id}` — update plan fields

### Artifact CRUD (Left Panel Editing)

- `POST /api/plans/{plan_id}/artifacts` — create a new artifact
- `PATCH /api/artifacts/{artifact_id}` — update SQL or name (user edits directly)
- `DELETE /api/artifacts/{artifact_id}` — delete an artifact

### SQL Execution

`POST /api/execute`

- `{ "artifact_id": "art_1" }` — resolve dependencies, build WITH clause, execute
- `{ "sql_expression": "SELECT ..." }` — execute raw SQL

### Plan Preview

`GET /api/plans/{plan_id}/preview` — full composed CTE query + execution results

### Skills

- `POST /api/skills` — create a skill
- `GET /api/skills` — list all skills
- `GET /api/skills/{skill_id}` — get a skill
- `PUT /api/skills/{skill_id}` — update a skill (full replace)

### Schema

- `GET /api/schema` — table DDLs for business tables

### Conversations

- `GET /api/plans/{plan_id}/conversations` — list conversations for a plan
- `GET /api/conversations/{conversation_id}` — messages + pending_questions
- `DELETE /api/conversations/{conversation_id}` — delete a conversation

---

## Dependency Resolution and Execution Engine

The backend execution engine:

1. **Parses artifact references** — matches artifact names that appear as table references in SQL
2. **Builds dependency graph** — topological sort by references
3. **Wraps as CTEs for execution:**
   - Individual: `WITH dep1 AS (...), dep2 AS (...) <artifact sql>`
   - Full plan: `WITH art1 AS (...), art2 AS (...), ... <payout sql>`
4. **Detects cycles** — returns an error if circular references exist
5. **Finds final artifact** — looks for `name == "payout"`, falls back to last artifact

---

## LLM Integration

### System Prompt

The system prompt includes:
- Available table DDLs
- Skills content
- Current plan state (or "No plan exists yet")
- Current SQL artifacts
- Guidelines for tool usage

### Tool Calling (not regex parsing)

The LLM communicates via OpenAI's structured tool calling API. No regex parsing of embedded JSON blocks. The LLM decides which tools to call and the backend executes them in a loop.

### Self-Healing

If a tool returns an error (e.g., invalid SQL), the result is fed back to the LLM. The LLM can fix the issue and retry in the next iteration of the loop.

---

## Tech Stack

- Python 3.11+, FastAPI, PostgreSQL (Supabase) via asyncpg
- OpenAI SDK (gpt-5.4) with tool calling
- Pydantic models for all request/response schemas
- SQLAlchemy async ORM
- `uv` for dependency management
- pytest + httpx for testing

## Project Structure

```
ai-sql-editor/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── agent.py             # Agent loop orchestrator, system prompt
│   ├── chat_service.py      # Chat orchestration, persistence
│   ├── llm.py               # OpenAI client
│   ├── database.py          # Async SQLAlchemy engine
│   ├── models.py            # ORM models
│   ├── routes.py            # HTTP handlers (thin layer)
│   ├── executor.py          # CTE resolution + SQL execution
│   ├── seed.py              # Sample data
│   ├── services/
│   │   ├── plan_service.py          # PlanServiceBase ABC
│   │   └── sqlalchemy_plan_service.py
│   ├── tools/
│   │   ├── base.py              # BaseTool, ToolContext, ToolResult
│   │   ├── create_plan.py
│   │   ├── update_sql_artifacts.py
│   │   ├── update_plan.py
│   │   ├── execute_query.py
│   │   ├── validate_sql.py
│   │   └── ask_clarification.py
│   └── tests/
├── frontend/                # React + TypeScript (Vite)
├── docs/
└── README.md
```

## What to Skip for POC

- Authentication/authorization
- SQL injection protection beyond read-only execution mode
- Websockets (polling is fine)
- Rate limiting
- Multi-user/company isolation
- Input validation beyond basic type checking
