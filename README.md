# AI SQL Editor POC

AI-powered SQL commission plan editor that decomposes complex queries into named CTE artifacts, executes them against PostgreSQL (Supabase), and iterates via natural language chat. Uses OpenAI tool calling with a multi-turn agent loop for self-healing SQL generation.

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

uv run uvicorn main:app --reload --port 8000
```

The server creates tables and seeds sample data on first run.

## Quick test

```bash
# Run the full end-to-end test suite (17 tests)
cd backend && ./test_e2e.sh
```

Or test individual endpoints:

```bash
# Create a plan
curl -s -X POST http://localhost:8000/api/plans \
  -H "Content-Type: application/json" \
  -d '{"name": "Q1 Sales Commission", "plan_type": "RECURRING", "frequency": "QUARTERLY"}' | python -m json.tool

# Chat with the AI to generate SQL
curl -s -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "plan_id": "<plan_id from above>",
    "message": "Build a 10% commission on all closed-won deals over $50k"
  }' | python -m json.tool
# Response includes conversation_id — use it for follow-up messages

# Continue the conversation (multi-turn)
curl -s -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "plan_id": "<plan_id>",
    "conversation_id": "<conversation_id from above>",
    "message": "Add a 2x accelerator for deals over $100k"
  }' | python -m json.tool

# List conversations for a plan
curl -s http://localhost:8000/api/plans/<plan_id>/conversations | python -m json.tool

# Get full conversation history
curl -s http://localhost:8000/api/conversations/<conversation_id> | python -m json.tool

# Execute an artifact individually
curl -s -X POST http://localhost:8000/api/execute \
  -H "Content-Type: application/json" \
  -d '{"artifact_id": "<artifact_id from chat response>"}' | python -m json.tool

# Preview the full composed query
curl -s http://localhost:8000/api/plans/<plan_id>/preview | python -m json.tool

# Add a skill
curl -s -X POST http://localhost:8000/api/skills \
  -H "Content-Type: application/json" \
  -d '{"name": "commission_rules", "content": "Always use deal_value for commission calculations. Exclude deals with stage = Disqualified."}' | python -m json.tool

# View available table schemas
curl -s http://localhost:8000/api/schema | python -m json.tool
```

## Architecture

### Agent tool loop

The chat endpoint uses an agentic tool-calling pattern. The LLM receives tools and decides which to call. The backend executes them and feeds results back. The loop continues until the LLM has no more tool calls (max 5 iterations).

### Available tools

| Tool | Description |
|------|-------------|
| `update_sql_artifacts` | Replace all SQL artifacts for the plan (delete-all, create-all, execute) |
| `update_plan` | Update plan metadata (name, type, frequency) |
| `execute_query` | Run a read-only SQL query for data exploration |
| `validate_sql` | Check SQL correctness via EXPLAIN without side effects |
| `ask_clarification` | Return structured questions when the request is ambiguous |

### Clarification flow

When the user's request is vague (e.g., "build a commission plan"), the LLM calls `ask_clarification` with structured questions and predefined options. The agent loop pauses, questions are persisted to the DB, and returned to the FE as a form. On page refresh, `GET /api/conversations/{id}` includes `pending_questions` so the FE can restore the form. When the user answers, questions are cleared.

## Project structure

```
ai-sql-editor/
├── backend/
│   ├── main.py              # FastAPI app entry point, lifespan hooks
│   ├── agent.py             # Agent loop orchestrator, system prompt builder
│   ├── chat_service.py      # Chat business logic (message building, persistence)
│   ├── llm.py               # OpenAI client (call_openai_with_tools)
│   ├── database.py          # Async SQLAlchemy engine, session factory
│   ├── models.py            # SQLAlchemy models (plans, artifacts, conversations, skills)
│   ├── routes.py            # HTTP endpoint handlers (thin layer)
│   ├── executor.py          # CTE dependency resolution + SQL execution engine
│   ├── seed.py              # Sample data seeding for employees, deals, quotas
│   ├── tools/
│   │   ├── base.py              # BaseTool protocol, ToolContext, ToolResult
│   │   ├── __init__.py          # ToolRegistry with auto-registration
│   │   ├── update_sql_artifacts.py
│   │   ├── update_plan.py
│   │   ├── execute_query.py
│   │   ├── validate_sql.py
│   │   └── ask_clarification.py
│   ├── pyproject.toml       # Dependencies (managed by uv)
│   └── test_e2e.sh          # End-to-end test script (17 tests)
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
| GET | `/api/plans` | List all plans |
| POST | `/api/plans` | Create a plan |
| GET | `/api/plans/{plan_id}` | Get plan with artifacts |
| PATCH | `/api/plans/{plan_id}` | Update plan fields |
| POST | `/api/plans/{plan_id}/artifacts` | Create an artifact |
| PATCH | `/api/artifacts/{artifact_id}` | Update an artifact |
| DELETE | `/api/artifacts/{artifact_id}` | Delete an artifact |
| POST | `/api/chat` | AI chat (agentic tool calling, multi-turn) |
| POST | `/api/execute` | Execute artifact or raw SQL |
| GET | `/api/plans/{plan_id}/preview` | Full composed CTE query + results |
| POST | `/api/skills` | Create a skill |
| GET | `/api/skills` | List all skills |
| GET | `/api/skills/{skill_id}` | Get a skill |
| PUT | `/api/skills/{skill_id}` | Update a skill (full replace) |
| GET | `/api/schema` | Table DDLs for business tables |
| GET | `/api/plans/{plan_id}/conversations` | List conversations for a plan |
| GET | `/api/conversations/{conversation_id}` | Get conversation (includes pending_questions) |
| DELETE | `/api/conversations/{conversation_id}` | Delete a conversation |

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key for gpt-4o |
| `DATABASE_URL` | Yes | PostgreSQL connection string, e.g. `postgresql+asyncpg://user:pass@host:5432/db` |
| `OPENAI_MODEL` | No | Model name (defaults to `gpt-4o`) |
