# AI-Powered SQL Commission Plan Editor — Product Specification

## Overview

Users describe commission plans in natural language and an AI builds the SQL. The app has a split-panel UX: left panel shows editable SQL artifacts (named CTEs), right panel is an AI chat.

## User Flows

### Create a plan from chat

User opens a new chat and types: "Create a quarterly 10% commission plan on all closed-won deals over $50k". The AI creates the plan, generates SQL artifacts, and shows the results. No setup required.

### Modify an existing plan

User opens an existing plan's conversation and types: "Change to 15% and remove the deal threshold". The AI replaces all artifacts with the updated SQL.

### Edit SQL directly

User edits an artifact's SQL in the left panel. On the next chat turn, the AI sees the updated SQL and works from it.

### Explore data before building

User asks: "How many closed-won deals do we have?" The AI runs a query and shows the answer without creating a plan.

### Rename or reconfigure

User says: "Rename this plan to Q2 and make it monthly". The AI updates the plan metadata.

### Ambiguous requests

User says: "Build a commission plan" without specifying details. The AI returns structured clarification questions (rate, deal filter, frequency) as a form. The user picks options and the AI proceeds. If the user refreshes the page, the form is restored from the DB.

## CTE-Based SQL Artifacts

The AI decomposes SQL into named artifacts:

- **Named CTEs** — `base_deals`, `commissions`, etc. Can reference each other by name.
- **Final query** — always named `payout`. Assembles the result.

Each artifact is independently editable. The system resolves dependencies and composes them into a single `WITH` query for execution.

### Example

User says: "10% commission on closed-won deals over $50k"

AI produces:
- `base_deals` — filters deals
- `commissions` — calculates 10% per employee
- `payout` — joins with employee names

## Data Model

### Business tables (sample data, seeded)

| Table | Purpose |
|-------|---------|
| `employees` | Sales reps (name, department, role) |
| `deals` | Sales deals (value, stage, region, close date) |
| `quotas` | Quarterly targets and attainment |

### Application entities

| Entity | Purpose |
|--------|---------|
| Plan | Commission plan with name, type (recurring/one-time), frequency |
| SQL Artifact | Named CTE or final query, linked to a plan |
| Conversation | Chat session, linked to at most one plan |
| Conversation Message | Chat history including tool call audit trail |
| Skill | Reusable instructions injected into the AI's context |

### Key relationships

- A conversation may or may not have a plan (plan is created during chat)
- A plan has one conversation (returned as `conversation_id` on the plan)
- A plan has many artifacts (replaced as a set on each chat turn)

## Chat API

### Request

```json
{
  "message": "Create a quarterly 10% commission plan on closed-won deals over $50k",
  "conversation_id": "optional — omit to start new"
}
```

### Response

| Field | Description |
|-------|-------------|
| `response` | AI's text explanation |
| `conversation_id` | Use for follow-up messages |
| `composed_sql` | Full WITH/CTE query |
| `current_artifacts` | All artifacts with name and SQL |
| `plan` | Plan object with `plan_id` and `conversation_id` |
| `tool_calls` | What the AI did (created plan, updated artifacts, etc.) |
| `pending_questions` | Clarification form if the request was ambiguous |

## AI Capabilities

| Capability | Behavior |
|------------|----------|
| Create plan | Infers name, type, frequency from the request |
| Build SQL | Decomposes into named CTEs with `payout` as final |
| Modify SQL | Replaces all artifacts with the complete updated set |
| Update plan | Changes name, type, or frequency |
| Explore data | Runs read-only queries to answer questions |
| Validate SQL | Checks syntax before committing |
| Ask clarification | Returns structured questions with options |
| Self-heal | If SQL fails, fixes and retries automatically |

## Skills

Skills are reusable instructions stored in the DB and injected into every AI prompt. Example:

```
Name: commission_rules
Content: Always use deal_value for calculations. Exclude deals with stage = Disqualified.
```

## Out of Scope (POC)

- Authentication / authorization
- Multi-user / company isolation
- Websockets (polling is fine)
- Rate limiting
- SQL injection protection beyond read-only mode
