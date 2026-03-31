# Architecture & Technical Design

> For product behavior and requirements, see [ai-sql-editor-poc.md](ai-sql-editor-poc.md).
> For setup and API reference, see [README.md](../README.md).

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│               FastAPI (routes/ package)                   │
│   routes/plans  │ routes/skills │ routes/chat             │
│   routes/execution                                        │
└──────────┬────────────────────────────────────────────────┘
           │
     ┌─────▼──────────┐     ┌──────────────────┐
     │ agent/          │────▶│  agent/loop.py    │ ◄── tool loop
     │ chat_service.py │     │  (max 10 iter)    │
     └─────┬──────────┘     └──────┬───────────┘
           │                       │
     ┌─────▼──────────┐     ┌─────▼────────────────────────┐
     │ services/       │     │  tools/ (via PlanServiceBase) │
     │ executor.py     │     │  create_plan, update_plan      │
     │ data_access.py  │◄────│  update_sql_artifacts           │
     │ plan_service.py │     │  update_plan_config             │
     │ (PostgreSQL)    │     │  infer_plan_config              │
     └────────────────┘     │  execute_query, validate_sql    │
                            │  ask_clarification              │
                            └──────────────────────────────┘
```

## Backend Package Layout

```
backend/
├── main.py                  # App bootstrap, middleware, lifespan
├── database.py              # Async engine + session factory
├── llm.py                   # OpenAI client wrapper
├── seed.py                  # Demo data seeder
├── middleware.py             # RequestID middleware
├── logging_config.py        # JSON logging + Datadog
│
├── models/                  # SQLAlchemy ORM models
│   ├── base.py              # DeclarativeBase, _new_id()
│   ├── business.py          # Employee, Deal, Quota
│   ├── plan.py              # Plan, PlanConfig, PlanCycle, SqlArtifact, PlanTemplate
│   ├── skill.py             # Skill, SkillVersion
│   └── conversation.py      # Conversation, ConversationMessage, ChatFile
│
├── schemas/                 # Pydantic request/response DTOs
│   ├── plan.py              # Plan, artifact, config, lineage DTOs
│   ├── skill.py             # Skill DTOs
│   ├── chat.py              # Chat, conversation, clarification DTOs
│   └── execution.py         # Execute + preview DTOs
│
├── routes/                  # Thin API handlers
│   ├── plans.py             # Plan CRUD + config + artifacts + preview + lineage + templates
│   ├── skills.py            # Skill CRUD
│   ├── chat.py              # POST /chat + conversations + file upload
│   └── execution.py         # POST /execute + GET /schema
│
├── services/                # Business logic layer
│   ├── plan_service.py      # PlanServiceBase ABC
│   ├── sqlalchemy_plan_service.py  # PostgreSQL implementation
│   ├── executor.py          # CTE composition + SQL execution
│   └── data_access.py       # load_plan(), get_schema_ddls()
│
├── agent/                   # AI agent layer
│   ├── loop.py              # run_agent_loop(), AgentResult
│   ├── prompts.py           # System prompts (agent + explain)
│   └── chat_service.py      # process_chat() orchestrator
│
└── tools/                   # Agent tools (one per file)
    ├── base.py, create_plan.py, update_plan.py, ...
    └── ask_clarification.py
```

## Key Design Decisions

### 1. Session-based chat (conversation-first)

`Conversation.plan_id` is nullable. Users start chatting without a plan. The LLM creates one via the `create_plan` tool. This avoids the chicken-and-egg problem of requiring a plan before the AI can help.

### 2. PlanService interface (portable tools)

Tools call `context.plan_service.method()` — never the database directly.

```python
class PlanServiceBase(ABC):
    async def create_plan(name, plan_type, frequency, start_date, end_date) -> dict
    async def update_plan(**fields) -> dict
    async def get_plan() -> dict | None
    async def replace_artifacts(specs) -> list[dict]
    async def execute_sql(sql) -> dict
    async def validate_sql(sql) -> dict
    async def update_plan_config(config_patch) -> dict
    async def save_inferred_config(yaml_content) -> str
    async def get_inferred_config() -> str | None
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

## Plan Cycles and Period Filtering

Plans have `start_date` and `end_date`. On creation, cycles are auto-generated from the frequency (MONTHLY → one per month, QUARTERLY → one per quarter, etc.). The `plan_cycles` table is included in the schema DDLs so the LLM sees it and JOINs against it for time-based grouping.

At preview/execute time, an optional `cycle_id` parameter wraps the composed query with `WHERE cycle_id = X` if the result includes a `cycle_id` column. If not, the query runs unfiltered.

## File Upload

1. FE uploads file via `POST /api/chat/upload` (multipart/form-data)
2. Stored in `chat_files` table (binary + metadata)
3. FE references `file_id` in the chat request
4. Backend loads binary, base64-encodes, builds multimodal message:
   - Images → `image_url` content part
   - PDFs → `file` content part
   - CSV/text → extracted inline
5. Max 20 MB. Allowed: PNG, JPEG, GIF, WebP, PDF, CSV, XLSX, DOCX

## Lineage DAG

Artifact dependencies exposed via `GET /api/plans/{plan_id}/lineage` as `{nodes, edges}`. Built by `build_lineage_dag()` in `executor.py` using SQL token matching.

## Plan Template Inference

1. Team uploads YAML template via `/api/plan-templates`
2. System prompt includes the template
3. LLM fills it in, calls `infer_plan_config` tool
4. Saved to `plan_inferred_configs` table (1:1 with plan)
5. Values marked as confirmed, `# inferred`, or `TODO`

## Data Model

```sql
plans (id, name, plan_type, frequency, mode, start_date, end_date, created_at)
plan_configs (id, plan_id FK unique, is_automatic_payout_enabled, final_payment_offset,
              is_draws_enabled, draw_frequency, payout_type, is_disputes_enabled)
plan_inferred_configs (id, plan_id FK unique, content TEXT, created_at)
plan_cycles (id, plan_id FK, period_name, start_date, end_date)
plan_templates (id, name, content TEXT, created_at)

sql_artifacts (id, plan_id FK, name, sql_expression, created_at)

skills (id, name, content, created_at)
skill_versions (id, skill_id FK, version INT, content TEXT, created_at)

conversations (id, plan_id FK nullable, title, pending_questions_json, created_at)
conversation_messages (id, conversation_id FK, role, content,
                       tool_call_id, tool_calls_json, created_at)

chat_files (id, conversation_id FK, filename, mime_type, size_bytes, content BYTEA, created_at)
```

## Tech Stack

- Python 3.11+, FastAPI, PostgreSQL (Supabase) via asyncpg
- OpenAI SDK (gpt-5.4) with tool calling and multimodal input
- SQLAlchemy async ORM, Pydantic
- Structured JSON logging + optional Datadog via datadog-api-client
- `uv` for dependency management
- pytest + httpx for testing
