# AI SQL Editor POC

AI-powered SQL commission plan editor that decomposes complex queries into named CTE artifacts, executes them against SQLite, and iterates via natural language chat.

## Prerequisites

- Python 3.11+
- [`uv`](https://docs.astral.sh/uv/) package manager (`curl -LsSf https://astral.sh/uv/install.sh | sh`)
- An OpenAI API key

## Setup

```bash
git clone https://github.com/kottamakhil/ai-sql-editor.git
cd ai-sql-editor

uv sync

export OPENAI_API_KEY="sk-..."

uv run uvicorn main:app --reload --port 8000
```

The server creates a SQLite database (`poc.db`) and seeds sample data on first run.

## Quick test

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
    "message": "Build a 10% commission on all closed-won deals over $50k",
    "conversation_history": []
  }' | python -m json.tool

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

## Project structure

```
ai-sql-editor/
├── main.py              # FastAPI app entry point, lifespan hooks
├── database.py          # Async SQLAlchemy engine, session factory
├── models.py            # SQLAlchemy models (plans, sql_artifacts, skills, business tables)
├── routes.py            # All API endpoint handlers including /chat
├── llm.py               # LLM prompt builder, response parser, OpenAI client
├── executor.py          # CTE dependency resolution + SQL execution engine
├── seed.py              # Sample data seeding for employees, deals, quotas
├── pyproject.toml       # Dependencies (managed by uv)
├── docs/
│   ├── ai-sql-editor-poc.md   # Full POC specification
│   └── ARCHITECTURE.md        # Implementation plan
├── Backlog.md
└── README.md
```

## API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ping` | Health check |
| POST | `/api/plans` | Create a plan |
| GET | `/api/plans/{plan_id}` | Get plan with artifacts |
| PATCH | `/api/plans/{plan_id}` | Update plan fields |
| POST | `/api/plans/{plan_id}/artifacts` | Create an artifact |
| PATCH | `/api/artifacts/{artifact_id}` | Update an artifact |
| DELETE | `/api/artifacts/{artifact_id}` | Delete an artifact |
| POST | `/api/chat` | AI chat (generates/modifies SQL artifacts) |
| POST | `/api/execute` | Execute artifact or raw SQL |
| GET | `/api/plans/{plan_id}/preview` | Full composed CTE query + results |
| POST | `/api/skills` | Create a skill |
| GET | `/api/skills` | List all skills |
| GET | `/api/schema` | Table DDLs for business tables |

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key for gpt-4o |
| `DATABASE_URL` | No | SQLite path (defaults to `sqlite+aiosqlite:///./poc.db`) |
| `OPENAI_MODEL` | No | Model name (defaults to `gpt-4o`) |
