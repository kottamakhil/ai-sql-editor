# Architecture and Implementation Plan

## Overview

A standalone FastAPI + SQLite application that serves as an AI-powered SQL commission plan editor. The LLM decomposes complex SQL into named CTE artifacts, persists them, resolves dependencies, executes them, and returns results. See [ai-sql-editor-poc.md](ai-sql-editor-poc.md) for the full specification.

---

## System Architecture

```
                    ┌──────────────────────────────────────────────┐
                    │              FastAPI (routes.py)              │
                    │                                              │
                    │  Plan CRUD  │ Artifact CRUD │ Skills │ Schema│
                    │             │               │        │       │
                    │         POST /api/chat (orchestrator)         │
                    │         POST /api/execute                     │
                    │         GET  /api/plans/{id}/preview          │
                    └────────┬──────────────┬──────────────────────┘
                             │              │
                    ┌────────▼────────┐  ┌──▼───────────────────┐
                    │   llm.py        │  │   executor.py        │
                    │                 │  │                      │
                    │ Prompt builder  │  │ Dependency resolver  │
                    │ Response parser │  │ CTE composer         │
                    │ OpenAI caller   │  │ SQL runner           │
                    └────────┬────────┘  └──────────┬───────────┘
                             │                      │
                    ┌────────▼──────────────────────▼───────────┐
                    │          SQLite (via aiosqlite)            │
                    │                                           │
                    │  Business: employees, deals, quotas       │
                    │  App:      plans, sql_artifacts, skills   │
                    └───────────────────────────────────────────┘
```

---

## Implementation Steps

Each step is a self-contained commit.

### Step 1: Project scaffold + dependency management

Create the project skeleton.

**Files:**
- `pyproject.toml` — deps: fastapi, uvicorn, sqlalchemy[asyncio], aiosqlite, openai, pydantic, pydantic-settings
- `.gitignore` — `*.db`, `__pycache__/`, `.venv/`, `.env`
- `.python-version` — `3.11`

### Step 2: SQLAlchemy models + database setup

**`database.py`** — async engine, session factory, `init_db()`, `get_db()` FastAPI dependency.

**`models.py`** — all 6 tables:

| Table | Key columns |
|-------|-------------|
| `employees` | id, name, department, role, start_date |
| `deals` | id, employee_id, deal_value, stage, closed_date, region |
| `quotas` | id, employee_id, quarter, target_amount, attainment_pct |
| `plans` | id, name, plan_type, frequency, mode, created_at |
| `sql_artifacts` | id, plan_id (FK), name (nullable), sql_expression, created_at |
| `skills` | id, name, content, created_at |

### Step 3: Seed data

**`seed.py`** — ~20 rows each for employees, deals, quotas. Idempotent (skip if rows exist). Called from startup event.

### Step 4: CTE dependency resolution + SQL execution engine

**`executor.py`** — the core algorithmic piece.

Public functions:
1. `execute_artifact(artifact_id, session)` — resolve dependencies, build WITH clause, execute
2. `execute_raw_sql(sql, session)` — execute arbitrary SQL directly
3. `execute_plan_preview(plan_id, session)` — topological sort all artifacts, compose full CTE chain, execute

Internal helpers:
- `find_artifact_dependencies(sql, known_names)` — set intersection of SQL tokens with known artifact names
- `topological_sort(artifacts)` — DFS topo-sort with cycle detection
- `build_cte_query(ordered_artifacts, final_sql)` — assemble `WITH a AS (...), b AS (...) <final>`

### Step 5: LLM prompt builder + response parser

**`llm.py`**

1. `build_chat_prompt(plan, artifacts, skills, schema_ddls)` — constructs system prompt with `<available_tables>`, `<skills>`, `<current_plan>`, `<current_sql_artifacts>`
2. `parse_sql_operations(response_text)` — regex extraction of `` ```json:sql_operations `` block, returns `list[SqlOperation]`, empty list on failure
3. `call_openai(messages)` — thin wrapper, model from `OPENAI_MODEL` env var

### Step 6: API routes — Plan CRUD, Artifact CRUD, Skills, Schema

**`routes.py`**

| Endpoint | Description |
|----------|-------------|
| `POST /api/plans` | Create plan (mode=AI_ASSISTED) |
| `GET /api/plans/{id}` | Get plan + artifacts |
| `PATCH /api/plans/{id}` | Update plan fields |
| `PATCH /api/artifacts/{id}` | Update artifact SQL/name |
| `DELETE /api/artifacts/{id}` | Delete artifact |
| `POST /api/plans/{id}/artifacts` | Create artifact manually |
| `POST /api/skills` | Create skill |
| `GET /api/skills` | List skills |
| `GET /api/schema` | Table DDLs |
| `POST /api/execute` | Execute artifact or raw SQL |
| `GET /api/plans/{id}/preview` | Full plan preview |

### Step 7: Chat endpoint — the orchestration layer

`POST /api/chat` in `routes.py`:

1. Load plan + artifacts from DB
2. Load all skills
3. Get schema DDLs
4. Build LLM prompt
5. Call OpenAI with conversation history
6. Parse `json:sql_operations`
7. Execute each operation (create/update/delete) + run SQL
8. Re-query artifacts for final state
9. Return ChatResponse

Error handling: malformed LLM output returns raw text with `operations=[]`.

### Step 8: Application entry point + README

**`main.py`** — FastAPI app, CORS middleware, startup event (init_db + seed), include router.

**`README.md`** — setup instructions, curl examples, project structure, env vars.

---

## Project Structure

```
ai-sql-editor-poc/
├── main.py              # FastAPI app entry point
├── database.py          # Async engine, session factory, init_db()
├── models.py            # SQLAlchemy models (all 6 tables)
├── routes.py            # All API endpoints including /chat
├── llm.py               # Prompt builder, response parser, OpenAI call
├── executor.py          # CTE dependency resolution + SQL runner
├── seed.py              # Business table seed data
├── pyproject.toml       # uv dependencies
├── .gitignore
├── .python-version
├── Backlog.md           # Implementation tracking
├── docs/
│   ├── ai-sql-editor-poc.md   # Full POC specification
│   └── ARCHITECTURE.md        # This file
└── README.md
```

---

## Key Design Decisions

1. **`database.py` separate from `models.py`** — avoids circular imports between engine/session factory and table definitions.

2. **Simple string-matching for dependency resolution** — tokenize SQL, intersect with known artifact names. No SQL parser needed for POC.

3. **Topological sort for CTE ordering** — gives correct ordering and free cycle detection.

4. **`json:sql_operations` parsing via regex** — extract fenced code block with the specific tag, `json.loads`. Graceful fallback on failure.

5. **Single execution engine** — chat endpoint, execute endpoint, and preview endpoint all route through `executor.py`.

---

## Tech Stack

- Python 3.11+, FastAPI, SQLite (via aiosqlite)
- OpenAI SDK (gpt-4o)
- Pydantic for request/response schemas
- SQLAlchemy async ORM
- `uv` for dependency management
