# AI-Powered Online SQL Editor — POC Specification

## Overview

Build a Python FastAPI application that serves as an AI-powered SQL commission plan editor. The app has a split-panel UX: left side shows SQL artifacts (decomposed as named CTEs), right side is an AI chat. The AI generates SQL from natural language, decomposes complex queries into named CTE artifacts, persists them, executes them, and returns results.

---

## Core Concept: CTE-Based SQL Artifacts

The LLM decomposes SQL into named artifacts that act as CTEs. Each artifact is either:

- **A named CTE** — has a `name` field (e.g. `base_deals`, `commissions`). Can be referenced by other artifacts by name.
- **A standalone/final query** — has `name=null`. References named artifacts as if they were tables.

When executing an individual artifact, the backend resolves its dependencies (other artifacts it references by name) and wraps them as a `WITH` clause. When executing the full plan, the backend builds the complete CTE chain from the dependency graph.

### Example

```
Artifact 1: name="base_deals"
  sql: SELECT * FROM deals WHERE stage = 'Closed Won' AND deal_value >= 50000

Artifact 2: name="commissions"
  sql: SELECT employee_id, SUM(deal_value * 0.10) AS commission
       FROM base_deals GROUP BY employee_id

Artifact 3: name=null (final query)
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

**Executing the full plan (Artifact 3)** produces:

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

## Data Layer (SQLite)

On startup, create these sample tables with seed data:

### Business tables (~20 rows each)

```sql
employees (id, name, department, role, start_date)
deals (id, employee_id, deal_value, stage, closed_date, region)
quotas (id, employee_id, quarter, target_amount, attainment_pct)
```

### Application tables

```sql
plans (id, name, plan_type, frequency, mode, created_at)
-- plan_type: RECURRING | ONE_TIME
-- frequency: MONTHLY | QUARTERLY
-- mode: CLASSIC | AI_ASSISTED

sql_artifacts (id, plan_id FK, name, sql_expression, created_at)
-- name: optional CTE alias (null for standalone/final queries)

skills (id, name, content, created_at)
```

---

## API Endpoints

### Plan CRUD

- `POST /api/plans` — create a plan (name, plan_type, frequency) with mode=AI_ASSISTED
- `GET /api/plans/{plan_id}` — returns plan + all its sql_artifacts ordered by created_at
- `PATCH /api/plans/{plan_id}` — update plan fields (name, plan_type, frequency)

### Artifact CRUD (for left-panel editing)

- `PATCH /api/artifacts/{artifact_id}` — update an artifact's `sql_expression` and/or `name` (user edits SQL directly on the left panel)
- `DELETE /api/artifacts/{artifact_id}` — delete an artifact
- `POST /api/plans/{plan_id}/artifacts` — create a new artifact `{ name, sql_expression }` (user adds a new CTE block manually)

### Chat/Conversation

`POST /api/chat`

**Request:**

```json
{
  "plan_id": "plan_1",
  "message": "Add a $50k minimum deal size to the commission query and remove the quota query",
  "conversation_history": [
    {"role": "user", "content": "Build me a 10% commission on closed deals"},
    {"role": "assistant", "content": "Here's the commission query..."}
  ]
}
```

**Backend behavior:**

1. Load the plan and its current sql_artifacts from the DB
2. Load all skills
3. Build the LLM prompt (see Prompt Structure below) — includes current artifacts with their names and IDs
4. Call OpenAI (gpt-4o)
5. Parse the response for `json:sql_operations` block
6. Execute each operation (create/update/delete) against the DB
7. For create and update operations, resolve dependencies and execute the SQL against SQLite
8. Return the response with operations, results, and final artifact state

**Response:**

```json
{
  "response": "I've broken down the commission calculation into steps and added a $50k filter...",
  "operations": [
    {
      "action": "update",
      "artifact_id": "art_1",
      "name": "base_deals",
      "sql_expression": "SELECT * FROM deals WHERE stage = 'Closed Won' AND deal_value >= 50000",
      "result": {
        "columns": ["id", "employee_id", "deal_value", "stage", "closed_date", "region"],
        "rows": [["d1", "emp_1", 75000, "Closed Won", "2025-03-01", "NA"]],
        "row_count": 8,
        "error": null
      }
    },
    {
      "action": "delete",
      "artifact_id": "art_2",
      "result": null
    },
    {
      "action": "create",
      "artifact_id": "art_3",
      "name": "commissions",
      "sql_expression": "SELECT employee_id, SUM(deal_value * 0.10) AS commission FROM base_deals GROUP BY employee_id",
      "result": {
        "columns": ["employee_id", "commission"],
        "rows": [["emp_1", 7500], ["emp_2", 5200]],
        "row_count": 2,
        "error": null
      }
    },
    {
      "action": "create",
      "artifact_id": "art_4",
      "name": null,
      "sql_expression": "SELECT e.name, c.commission FROM commissions c JOIN employees e ON e.id = c.employee_id ORDER BY c.commission DESC",
      "result": {
        "columns": ["name", "commission"],
        "rows": [["Alice", 7500], ["Bob", 5200]],
        "row_count": 2,
        "error": null
      }
    }
  ],
  "current_artifacts": [
    {"artifact_id": "art_1", "name": "base_deals", "sql_expression": "SELECT * FROM deals WHERE ..."},
    {"artifact_id": "art_3", "name": "commissions", "sql_expression": "SELECT employee_id, SUM(...) ..."},
    {"artifact_id": "art_4", "name": null, "sql_expression": "SELECT e.name, c.commission ..."}
  ],
  "conversation_history": [...]
}
```

`current_artifacts` is the final state after all operations — the frontend replaces its artifact list with this on every chat response.

### SQL Execution (standalone)

`POST /api/execute`

For re-running or editing an existing artifact from the left panel.

**Request:** `{ "artifact_id": "art_1" }` or `{ "sql_expression": "SELECT ..." }`

**Backend behavior:**
- If `artifact_id` is provided, load the artifact, resolve its dependencies (other named artifacts it references), build the `WITH` clause, and execute
- If raw `sql_expression` is provided, execute as-is

**Response:**

```json
{
  "columns": ["employee_id", "commission"],
  "rows": [["emp_1", 5000], ["emp_2", 3200]],
  "row_count": 2,
  "error": null
}
```

### Skills

- `POST /api/skills` — create a skill `{ name, content }`
- `GET /api/skills` — list all skills

### Schema Introspection

- `GET /api/schema` — returns all table DDLs so the frontend can show available tables/columns

### Plan Preview (full composed query)

- `GET /api/plans/{plan_id}/preview` — resolves the full dependency graph of all artifacts, builds the composed CTE query, executes it, and returns results

---

## Dependency Resolution and Execution Engine

The backend needs a small execution engine that:

1. **Parses artifact references** — given an artifact's SQL, find which artifact names appear as table references (simple approach: match against the set of known artifact names for the plan)
2. **Builds dependency graph** — topological sort of artifacts by their references
3. **Wraps as CTEs for execution:**
   - For individual artifact execution: `WITH dep1 AS (...), dep2 AS (...) <artifact sql>`
   - For full plan execution: `WITH art1 AS (...), art2 AS (...), ... <final artifact sql>`
4. **Detects cycles** — if artifact A references B and B references A, return an error

### Example resolution

```
Artifacts:
  base_deals (references: deals — a real table, no artifact dep)
  commissions (references: base_deals — an artifact)
  final (references: commissions, employees — commissions is artifact, employees is real table)

Dependency graph:
  final → commissions → base_deals

Composed SQL for final:
  WITH base_deals AS (...), commissions AS (...) SELECT ...
```

---

## LLM Prompt Structure

```
You are an AI SQL assistant for building commission plans.

<available_tables>
{DDL for employees, deals, quotas}
</available_tables>

<skills>
{content from all loaded skills}
</skills>

<current_plan>
Name: {plan.name}
Type: {plan.plan_type}
Frequency: {plan.frequency}
</current_plan>

<current_sql_artifacts>
- artifact_id: "art_1", name: "base_deals", sql: "SELECT * FROM deals WHERE stage = 'Closed Won'"
- artifact_id: "art_3", name: "commissions", sql: "SELECT employee_id, SUM(deal_value * 0.10) AS commission FROM base_deals GROUP BY employee_id"
- artifact_id: "art_4", name: null, sql: "SELECT e.name, c.commission FROM commissions c JOIN employees e ON e.id = c.employee_id"
</current_sql_artifacts>

When the user asks you to build or modify commission SQL:

1. Return your explanation as plain text.
2. Return SQL operations in a JSON block tagged as ```json:sql_operations.
3. Each operation must be one of:
   - {"action": "create", "name": "cte_name", "sql": "SELECT ..."} — new named CTE artifact
   - {"action": "create", "sql": "SELECT ..."} — new standalone/final query (no name)
   - {"action": "update", "artifact_id": "art_1", "sql": "SELECT ..."} — replace SQL on existing artifact
   - {"action": "delete", "artifact_id": "art_2"} — remove an artifact

4. Prefer decomposing complex queries into named CTE artifacts:
   - Each CTE should have a descriptive name (e.g. "base_deals", "commissions", "quota_attainment")
   - Named artifacts can reference other named artifacts by name as if they were tables
   - The final artifact (name=null) assembles the result from the named CTEs
   - Each CTE should be independently understandable

5. Always reference artifact_id from <current_sql_artifacts> when updating or deleting.
6. If the user edits SQL on the left panel and asks you to refine it, update that specific artifact by artifact_id.
7. You may return multiple operations in one response.
```

### Example LLM Response

```
I've decomposed the commission calculation into three steps:
1. **base_deals** filters for closed-won deals over $50k
2. **commissions** calculates 10% commission per employee
3. The final query joins with employee names for the report

```json:sql_operations
[
  {
    "action": "create",
    "name": "base_deals",
    "sql": "SELECT * FROM deals WHERE stage = 'Closed Won' AND deal_value >= 50000"
  },
  {
    "action": "create",
    "name": "commissions",
    "sql": "SELECT employee_id, SUM(deal_value * 0.10) AS commission FROM base_deals GROUP BY employee_id"
  },
  {
    "action": "create",
    "sql": "SELECT e.name, c.commission FROM commissions c JOIN employees e ON e.id = c.employee_id ORDER BY c.commission DESC"
  }
]
```
```

---

## Backend Operation Processing

| Action | Backend behavior |
|--------|-----------------|
| `create` | Insert new `sql_artifact` row (with optional `name`), resolve dependencies, execute, return results + new `artifact_id` |
| `update` | Load artifact by `artifact_id`, overwrite `sql_expression` (and optionally `name`), resolve dependencies, execute, return results |
| `delete` | Hard-delete the artifact (POC), return null result |

### Error Handling

If the LLM returns a response where `json:sql_operations` is malformed (invalid JSON, missing required fields, references to nonexistent artifact_ids), return the raw LLM text as the `response` field with `operations: []` and `current_artifacts` unchanged. Let the user retry or refine their prompt. Do not crash the endpoint.

---

## Tech Stack

- Python 3.11+, FastAPI, SQLite (via aiosqlite)
- OpenAI SDK (gpt-4o)
- Pydantic models for all request/response schemas
- SQLAlchemy async ORM
- `uv` for dependency management
- Single `main.py` or split into `models.py`, `routes.py`, `llm.py`, `executor.py`
- Include a `README.md` with setup instructions

## What to Skip for POC

- Authentication/authorization
- SQL injection protection beyond read-only execution mode
- Frontend (API-only, test with curl/httpie)
- Websockets (polling is fine)
- Rate limiting
- Multi-user/company isolation
- Input validation beyond basic type checking
- Cycle detection in dependency graph (trust the LLM for POC)

---

## README.md (generate this file in the repo root)

Generate a `README.md` that covers:

### Project title and one-line description

### Prerequisites

- Python 3.11+
- `uv` package manager (`curl -LsSf https://astral.sh/uv/install.sh | sh`)
- An OpenAI API key

### Setup

```bash
# Clone the repo
git clone https://github.com/<org>/ai-sql-editor-poc.git
cd ai-sql-editor-poc

# Install dependencies
uv sync

# Set your OpenAI API key
export OPENAI_API_KEY="sk-..."

# Start the server (creates SQLite DB and seeds sample data on first run)
uv run uvicorn main:app --reload --port 8000
```

### Quick test

```bash
# Create a plan
curl -X POST http://localhost:8000/api/plans \
  -H "Content-Type: application/json" \
  -d '{"name": "Q1 Sales Commission", "plan_type": "RECURRING", "frequency": "QUARTERLY"}'

# Chat with the AI to generate SQL
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "plan_id": "<plan_id from above>",
    "message": "Build a 10% commission on all closed-won deals over $50k",
    "conversation_history": []
  }'

# Execute an artifact individually
curl -X POST http://localhost:8000/api/execute \
  -H "Content-Type: application/json" \
  -d '{"artifact_id": "<artifact_id from chat response>"}'

# Preview the full composed query
curl http://localhost:8000/api/plans/<plan_id>/preview

# Add a skill
curl -X POST http://localhost:8000/api/skills \
  -H "Content-Type: application/json" \
  -d '{"name": "commission_rules", "content": "Always use deal_value for commission calculations. Exclude deals with stage = Disqualified."}'

# View available table schemas
curl http://localhost:8000/api/schema
```

### Project structure

```
ai-sql-editor-poc/
├── main.py              # FastAPI app entry point
├── models.py            # SQLAlchemy models (plans, sql_artifacts, skills)
├── routes.py            # API endpoint handlers
├── llm.py               # LLM prompt building and response parsing
├── executor.py          # SQL execution engine with CTE dependency resolution
├── seed.py              # Sample data seeding for employees, deals, quotas
├── pyproject.toml       # Dependencies
└── README.md
```

### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key for gpt-4o |
| `DATABASE_URL` | No | SQLite path (defaults to `sqlite+aiosqlite:///./poc.db`) |
| `OPENAI_MODEL` | No | Model name (defaults to `gpt-4o`) |
