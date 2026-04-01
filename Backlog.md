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

## Features

| # | Feature | Status |
|---|---------|--------|
| F-1 | Persist chat history — `Conversation` + `ConversationMessage` models, CRUD routes, `/chat` auto-saves messages and supports `conversation_id` for multi-turn | DONE |
| F-2 | Supabase (PostgreSQL) — removed SQLite, now requires `DATABASE_URL` pointing to Postgres | DONE |
| F-3 | Monorepo layout — moved backend code into `backend/`, reserving `client/` for frontend | DONE |
| F-4 | Agentic tool calling — replaced regex-parsed LLM responses with OpenAI tool calling. Multi-turn loop with 4 tools: `update_sql_artifacts`, `update_plan`, `execute_query`, `validate_sql`. Self-healing on SQL errors. | DONE |
| F-5 | Explain artifact (HTML approach) — LLM generates self-contained styled HTML explaining how the payout is calculated with tiers, example deals, step-by-step formula, and final result callout. Frontend renders via `dangerouslySetInnerHTML`. Prompt changes = visual changes, no React rebuild needed. | DONE |
| F-6 | Backend code reorganization — split flat files into domain packages: `models/` (base, business, plan, skill, conversation), `schemas/` (plan, skill, chat, execution), `routes/` (plans, skills, chat, execution), `agent/` (loop, prompts, chat_service), `services/` (executor, data_access, plan_service). All imports preserved via `__init__.py` re-exports. | DONE |
| F-7 | Employee & Payout service — Added `country` field to Employee model. New `Payout` model tracking employee payouts with `group_id`, `amount`, and `date`. Status (`paid`/`scheduled`) inferred at runtime from date. Endpoints: `POST/GET /employees`, `GET /employees/:id`, `POST/GET /payouts`, `GET /employees/:id/payouts` (grouped by `group_id` with totals). | DONE |
| F-8 | Employee compensation UI — Sidebar shows employee list with click navigation. Employee detail page at `/compensation/employees/:id` with summary cards (upcoming, received, scheduled count), tab bar (All/Upcoming/History), and payout cards with status dots, installment labels, and currency formatting. Styled to match Rippling compensation design. | DONE |
| F-9 | PaymentScheduleConfig service — Reusable `PaymentScheduleService` for creating payment schedules (lump sum, installments, recurring) with automatic payout generation. Supports configurable tranches, triggers (`next_payroll_run`, `months_after_start`), optional `effective_date`. Schedule name used as payout `group_id`. Immutable once created. DB models: `payment_schedule_configs` + `tranches`. REST endpoints: `POST /payment-schedules`, `GET /employees/:id/payment-schedules`, `GET /payment-schedules/:id`. | DONE |
