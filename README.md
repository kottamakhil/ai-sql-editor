# AI SQL Editor POC

AI-powered SQL commission plan editor that decomposes complex queries into named CTE artifacts, executes them against PostgreSQL (Supabase), and iterates via natural language chat.

## Prerequisites

- Python 3.11+
- Node.js 18+
- [`uv`](https://docs.astral.sh/uv/) package manager (`curl -LsSf https://astral.sh/uv/install.sh | sh`)
- An OpenAI API key
- A Supabase project (or any PostgreSQL database)

## Setup

### Backend

```bash
cd backend
uv sync

export DATABASE_URL="postgresql+asyncpg://postgres:YOUR-PASSWORD@db.YOUR-PROJECT.supabase.co:5432/postgres"
export OPENAI_API_KEY="sk-..."

# Optional: enable Datadog log shipping
export DD_API_KEY="your-datadog-api-key"

uv run uvicorn main:app --reload --port 8000
```

The server creates tables and seeds sample data on first run. Logs are emitted as structured JSON to stdout. If `DD_API_KEY` is set, logs are also shipped to Datadog.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens at http://localhost:5173. The frontend talks to the backend at http://localhost:8000.

## Quick test

```bash
# Run all backend test suites (~30 tests, requires running server)
cd backend && ./test_e2e.sh

# Or run Python tests
cd backend && uv run pytest tests/ -v
```

Or test individual endpoints:

```bash
# Start a conversation (no plan_id needed — LLM creates the plan)
curl -s -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Create a quarterly 10% commission plan on closed-won deals over $50k"}' | python -m json.tool

# Continue the conversation (multi-turn)
curl -s -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": "<conversation_id from above>",
    "message": "Add a 2x accelerator for deals over $100k"
  }' | python -m json.tool

# Preview the full composed query
curl -s http://localhost:8000/api/plans/<plan_id>/preview | python -m json.tool
```

## Documentation

- [Product spec](docs/ai-sql-editor-poc.md) — user flows, capabilities, data model
- [Architecture](docs/ARCHITECTURE.md) — system design, tool protocol, design decisions

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
