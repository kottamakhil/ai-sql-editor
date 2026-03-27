# Architecture & Technical Design

> For product behavior and requirements, see [ai-sql-editor-poc.md](ai-sql-editor-poc.md).
> For setup and API reference, see [README.md](../README.md).

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    FastAPI (routes.py)                    │
│   Plan CRUD │ Artifact CRUD │ Skills │ Schema │ Execute  │
│                    POST /api/chat                         │
└──────────┬────────────────────────────────────────────────┘
           │
     ┌─────▼──────┐     ┌──────────────┐
     │ chat_service│────▶│   agent.py    │ ◄── tool loop
     └─────┬──────┘     │  (max 10 iter)│
           │            └──────┬───────┘
           │                   │
     ┌─────▼──────┐     ┌─────▼────────────────────────┐
     │ PostgreSQL  │     │  tools/ (via PlanServiceBase) │
     │ (Supabase)  │     │  create_plan                  │
     │             │◄────│  update_sql_artifacts          │
     │ plans       │     │  update_plan                   │
     │ artifacts   │     │  execute_query                 │
     │ conversations│    │  validate_sql                  │
     │ messages    │     │  ask_clarification             │
     └────────────┘     └──────────────────────────────┘
```

## Key Design Decisions

### 1. Session-based chat (conversation-first)

`Conversation.plan_id` is nullable. Users start chatting without a plan. The LLM creates one via the `create_plan` tool. This avoids the chicken-and-egg problem of requiring a plan before the AI can help.

### 2. PlanService interface (portable tools)

Tools call `context.plan_service.method()` — never the database directly.

```python
class PlanServiceBase(ABC):
    async def create_plan(name, plan_type, frequency) -> dict
    async def update_plan(**fields) -> dict
    async def get_plan() -> dict | None
    async def replace_artifacts(specs) -> list[dict]
    async def execute_sql(sql) -> dict
    async def validate_sql(sql) -> dict
```

The POC implements this with `SqlAlchemyPlanService`. In production, swap with Django+MongoDB. Tools, agent loop, and LLM client are identical in both.

### 3. Tool calling over regex parsing

Uses OpenAI's structured tool calling API instead of embedding JSON in the LLM's text response. The LLM decides which tools to call; the backend dispatches via a registry.

### 4. Delete-all + create-all artifact strategy

On each chat turn with SQL changes, all existing artifacts are deleted and recreated from scratch. The LLM always provides the complete set. This avoids relying on the LLM to manage artifact IDs or emit incremental updates.

### 5. Simple CTE dependency resolution

Tokenize SQL, intersect with known artifact names. Topological sort for ordering. No SQL parser needed.

## Agent Loop

```
User message
  → Build system prompt with current state
  → Call OpenAI with tools
  → If tool_calls: execute each, feed results back, loop
  → If ask_clarification: pause, persist questions, return
  → If no tool_calls: return final response
  → Max 10 iterations
```

Self-healing: if a tool returns an error (e.g., bad SQL), the result is fed back. The LLM fixes and retries.

## Tool Registry

Tools implement `BaseTool` (ABC with `name`, `description`, `parameters_schema`, `execute`). Registered at import time in `tools/__init__.py`. The agent loop discovers them via `registry.openai_tool_definitions()`.

Adding a new tool: create a file in `tools/`, implement `BaseTool`, register in `__init__.py`. No changes to the agent loop or routes.

## CTE Execution Engine (`executor.py`)

1. **`execute_artifact`** — resolve deps, build WITH clause, run
2. **`execute_raw_sql`** — run arbitrary SQL
3. **`execute_plan_preview`** — topological sort all artifacts, compose full CTE chain, run
4. **`_find_final_artifact`** — looks for `name == "payout"`, fallback to last
5. **`_resolve_dependencies`** — DFS with cycle detection
6. **`_run_sql`** — wrapped in `begin_nested()` (SAVEPOINT) so failures don't poison the transaction

## Observability

- **Structured JSON logging** — every log line: `{timestamp, level, logger, message, request_id}`
- **Request ID middleware** — UUID per request in `contextvars.ContextVar`, `X-Request-ID` header
- **Datadog integration** — optional log shipping via `datadog-api-client` when `DD_API_KEY` is set

## Data Model

```sql
plans (id, name, plan_type, frequency, mode, created_at)

sql_artifacts (id, plan_id FK, name, sql_expression, created_at)

skills (id, name, content, created_at)

conversations (id, plan_id FK nullable, title, pending_questions_json, created_at)

conversation_messages (id, conversation_id FK, role, content,
                       tool_call_id, tool_calls_json, created_at)
```

## Tech Stack

- Python 3.11+, FastAPI, PostgreSQL (Supabase) via asyncpg
- OpenAI SDK (gpt-5.4) with tool calling
- SQLAlchemy async ORM, Pydantic
- Structured JSON logging + optional Datadog via datadog-api-client
- `uv` for dependency management
- pytest + httpx for testing
