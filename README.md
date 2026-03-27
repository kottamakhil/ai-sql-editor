# AI SQL Editor POC

AI-powered SQL commission plan editor that decomposes complex queries into named CTE artifacts, executes them against PostgreSQL (Supabase), and iterates via natural language chat.

Uses OpenAI tool calling with a multi-turn agent loop for self-healing SQL generation. The tool system is built on a portable service interface so the same tools and agent logic can be reused across storage backends (SQLAlchemy for the POC, Django+MongoDB for prod).

## Prerequisites

- Python 3.11+
- [`uv`](https://docs.astral.sh/uv/) package manager (`curl -LsSf https://astral.sh/uv/install.sh | sh`)
- An OpenAI API key
- A Supabase project (or any PostgreSQL database)

## Setup

```bash
git clone https://github.com/kottamakhil/ai-sql-editor.git
cd ai-sql-editor/backend

uv sync

export DATABASE_URL="postgresql+asyncpg://postgres:YOUR-PASSWORD@db.YOUR-PROJECT.supabase.co:5432/postgres"
export OPENAI_API_KEY="sk-..."

# Optional: enable Datadog log shipping
export DD_API_KEY="your-datadog-api-key"

uv run uvicorn main:app --reload --port 8000
```

The server creates tables and seeds sample data on first run. Logs are emitted as structured JSON to stdout. If `DD_API_KEY` is set, logs are also shipped to Datadog.

## Quick test

```bash
# Run all 3 test suites (~30 tests)
cd backend && ./test_e2e.sh

# Or run a single suite
bash tests/test_infrastructure.sh   # Health, schema, seed, CRUD, skills
bash tests/test_chat_agent.sh       # Session-based chat, all tools, multi-turn
bash tests/test_clarification.sh    # Clarification questions, persistence
```

Or test individual endpoints:

```bash
# Start a conversation (no plan_id needed — LLM creates the plan)
curl -s -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Create a quarterly 10% commission plan on closed-won deals over $50k"}' | python -m json.tool
# Response includes conversation_id and plan

# Continue the conversation (multi-turn)
curl -s -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": "<conversation_id from above>",
    "message": "Add a 2x accelerator for deals over $100k"
  }' | python -m json.tool

# Preview the full composed query
curl -s http://localhost:8000/api/plans/<plan_id>/preview | python -m json.tool

# View available table schemas
curl -s http://localhost:8000/api/schema | python -m json.tool
```

## Architecture

### Session-based chat

The `/api/chat` endpoint only requires `message` and an optional `conversation_id`. No `plan_id` is needed. The conversation is the workspace — plans are outputs created by the LLM via the `create_plan` tool, not inputs required to start chatting.

### Agent tool loop

The chat endpoint runs an agentic tool-calling loop. The LLM receives tools and decides which to call. The backend executes them and feeds results back. The loop continues until the LLM has no more tool calls (max 10 iterations).

### Available tools

| Tool | Description |
|------|-------------|
| `create_plan` | Create a new commission plan |
| `update_sql_artifacts` | Replace all SQL artifacts for the plan (delete-all, create-all, execute) |
| `update_plan` | Update plan metadata (name, type, frequency) |
| `execute_query` | Run a read-only SQL query for data exploration |
| `validate_sql` | Check SQL correctness via EXPLAIN without side effects |
| `ask_clarification` | Return structured questions when the request is ambiguous |

### Clarification flow

When the user's request is vague (e.g., "build a commission plan"), the LLM calls `ask_clarification` with structured questions and predefined options. The agent loop pauses, questions are persisted to the DB, and returned to the FE as a form. On page refresh, `GET /api/conversations/{id}` includes `pending_questions` so the FE can restore the form.

## Project structure

```
ai-sql-editor/
├── backend/
│   ├── main.py              # FastAPI app entry point, lifespan hooks
│   ├── agent.py             # Agent loop orchestrator, system prompt builder
│   ├── chat_service.py      # Chat orchestration (message building, persistence)
│   ├── llm.py               # OpenAI client (call_openai_with_tools)
│   ├── logging_config.py    # JSON formatter + Datadog log handler
│   ├── middleware.py        # Request ID middleware (X-Request-ID)
│   ├── database.py          # Async SQLAlchemy engine, session factory
│   ├── models.py            # SQLAlchemy ORM models
│   ├── routes.py            # HTTP endpoint handlers (thin layer)
│   ├── executor.py          # CTE dependency resolution + SQL execution
│   ├── seed.py              # Sample data seeding
│   ├── services/
│   │   ├── plan_service.py          # PlanServiceBase ABC (portable interface)
│   │   └── sqlalchemy_plan_service.py  # SQLAlchemy implementation
│   ├── tools/
│   │   ├── base.py              # BaseTool, ToolContext, ToolResult (portable)
│   │   ├── __init__.py          # ToolRegistry with auto-registration
│   │   ├── create_plan.py
│   │   ├── update_sql_artifacts.py
│   │   ├── update_plan.py
│   │   ├── execute_query.py
│   │   ├── validate_sql.py
│   │   └── ask_clarification.py
│   ├── tests/
│   │   ├── helpers.sh               # Shared test utilities
│   │   ├── test_infrastructure.sh   # Health, schema, seed, CRUD, skills
│   │   ├── test_chat_agent.sh       # Session-based chat, tools, multi-turn
│   │   └── test_clarification.sh    # Clarification questions, persistence
│   ├── test_e2e.sh          # Test runner (runs all suites)
│   └── pyproject.toml       # Dependencies (managed by uv)
├── frontend/                # React + TypeScript (Vite)
├── docs/
│   ├── ai-sql-editor-poc.md # Full POC specification
│   └── ARCHITECTURE.md      # Implementation plan
├── Backlog.md
└── README.md
```

## API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ping` | Health check |
| POST | `/api/chat` | AI chat (session-based, agentic tool calling) |
| GET | `/api/plans` | List all plans |
| POST | `/api/plans` | Create a plan |
| GET | `/api/plans/{plan_id}` | Get plan with artifacts |
| PATCH | `/api/plans/{plan_id}` | Update plan fields |
| GET | `/api/plans/{plan_id}/preview` | Full composed CTE query + results |
| GET | `/api/plans/{plan_id}/conversations` | List conversations for a plan |
| POST | `/api/plans/{plan_id}/artifacts` | Create an artifact |
| PATCH | `/api/artifacts/{artifact_id}` | Update an artifact |
| DELETE | `/api/artifacts/{artifact_id}` | Delete an artifact |
| POST | `/api/execute` | Execute artifact or raw SQL |
| POST | `/api/skills` | Create a skill |
| GET | `/api/skills` | List all skills |
| GET | `/api/skills/{skill_id}` | Get a skill |
| PUT | `/api/skills/{skill_id}` | Update a skill (full replace) |
| GET | `/api/schema` | Table DDLs for business tables |
| GET | `/api/conversations/{conversation_id}` | Get conversation (includes pending_questions) |
| DELETE | `/api/conversations/{conversation_id}` | Delete a conversation |

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `DATABASE_URL` | Yes | PostgreSQL connection string, e.g. `postgresql+asyncpg://user:pass@host:5432/db` |
| `OPENAI_MODEL` | No | Model name (defaults to `gpt-5.4`) |
| `DD_API_KEY` | No | Datadog API key. If set, logs are shipped to Datadog via HTTP API |
| `DD_SITE` | No | Datadog site (defaults to `datadoghq.com`) |
| `DD_SERVICE` | No | Service name in Datadog (defaults to `ai-sql-editor`) |
| `DD_ENV` | No | Environment tag (defaults to `dev`) |
