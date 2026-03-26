# Backlog

## Implementation Steps

| # | Task | Status |
|---|------|--------|
| 0 | Initialize repo + push spec and architecture docs | DONE |
| 1 | Project scaffold + dependency management (pyproject.toml) | DONE |
| 2 | SQLAlchemy models + database setup (models.py, database.py) | DONE |
| 3 | Seed data (seed.py) | DONE |
| 4 | CTE dependency resolution + SQL execution engine (executor.py) | DONE |
| 5 | LLM prompt builder + response parser (llm.py) | DONE |
| 6 | API routes — Plan CRUD, Artifact CRUD, Skills, Schema (routes.py) | DONE |
| 7 | Chat endpoint — orchestration layer (routes.py) | DONE |
| 8 | Application entry point + README (main.py, README.md) | DONE |

## Bug Fixes

| # | Issue | Fix | Status |
|---|-------|-----|--------|
| BF-1 | `/api/chat` returns 500 — `_get_schema_ddls` IN clause tuple binding fails with SQLAlchemy `text()` on SQLite | Use `bindparam("names", expanding=True)` to properly expand the IN clause | DONE |
| BF-2 | Unhandled exceptions return plain text "Internal Server Error" which breaks JSON piping | Added global `@app.exception_handler(Exception)` returning JSON with error details | DONE |
