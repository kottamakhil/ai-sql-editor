# AI-Powered SQL Commission Plan Editor — Product Specification

## Overview

Users describe commission plans in natural language and an AI builds the SQL. The app has a split-panel UX: left panel shows editable SQL artifacts (named CTEs) with a lineage DAG, right panel is an AI chat with file upload support.

## User Flows

### Create a plan from chat

User opens a new chat and types: "Create a quarterly 10% commission plan on all closed-won deals over $50k". The AI creates the plan, generates SQL artifacts, and shows the results. No setup required — no plan_id needed to start.

### Modify an existing plan

User opens an existing plan's conversation and types: "Change to 15% and remove the deal threshold". The AI replaces all artifacts with the updated SQL.

### Edit SQL directly

User edits an artifact's SQL in the left panel. On the next chat turn, the AI sees the updated SQL and works from it.

### Explore data before building

User asks: "How many closed-won deals do we have?" The AI runs a query and shows the answer without creating a plan.

### Rename or reconfigure

User says: "Rename this plan to Q2 and make it monthly". The AI updates the plan metadata.

### Configure payout settings

User says: "Set this to auto-payout 5 days after cycle end with monthly draws, treat as commission in payroll". The AI updates the plan's payout, payroll, and dispute configuration.

### Ambiguous requests

User says: "Build a commission plan" without specifying details. The AI returns structured clarification questions (rate, deal filter, frequency) as a form. The user picks options and the AI proceeds. If the user refreshes the page, the form is restored from the DB.

### Upload documents

User drags a PDF commission plan document or a CSV rate card into the chat. The AI reads the file natively and extracts the relevant details to build the plan.

### Template-based inference

The team provides a YAML template defining what fields should be inferred from the conversation (plan details, eligibility, earning rules, payout engine, etc.). The AI fills in the template progressively, marking confirmed values, inferred guesses, and TODOs. The filled template is saved on the plan and updated on each chat turn.

## CTE-Based SQL Artifacts

The AI decomposes SQL into named artifacts:

- **Named CTEs** — `base_deals`, `commissions`, etc. Can reference each other by name.
- **Final query** — always named `payout`. Assembles the result.

Each artifact is independently editable. The system resolves dependencies and composes them into a single `WITH` query for execution.

### Lineage DAG

Artifact dependencies are exposed as a directed graph (nodes + edges) for visualization. The FE renders this as a DAG showing data flow: `base_deals → commissions → payout`.

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
| Plan | Commission plan with name, type, frequency, config, inferred config |
| Plan Config | Payout timing, payroll integration, dispute settings (1:1 with plan) |
| Plan Inferred Config | LLM-filled YAML from a template (1:1 with plan) |
| SQL Artifact | Named CTE or final query, linked to a plan |
| Conversation | Chat session, linked to at most one plan |
| Conversation Message | Chat history including tool call audit trail |
| Skill | Reusable instructions with immutable versions |
| Skill Version | Versioned content — plans pin to specific versions |
| Plan Template | YAML template defining what the LLM should infer |
| Chat File | Uploaded file (image, PDF, CSV) for multimodal chat |

### Key relationships

- A conversation may or may not have a plan (plan is created during chat)
- A plan has one conversation (returned as `conversation_id` on the plan)
- A plan has many artifacts (replaced as a set on each chat turn)
- A plan has one config (payout/payroll/disputes) and optionally one inferred config
- Skills are versioned; plans pin to specific versions at creation time
- Chat files are uploaded separately and referenced by file_id in messages

## Chat API

### Request

```json
{
  "message": "Create a quarterly 10% commission plan on closed-won deals over $50k",
  "conversation_id": "optional — omit to start new",
  "skill_ids": ["optional — override skills for this turn"],
  "file_ids": ["optional — reference uploaded files"]
}
```

### Response

| Field | Description |
|-------|-------------|
| `response` | AI's text explanation |
| `conversation_id` | Use for follow-up messages |
| `composed_sql` | Full WITH/CTE query |
| `lineage` | DAG of artifact dependencies (nodes + edges) |
| `current_artifacts` | All artifacts with name and SQL |
| `plan` | Plan object with config, inferred_config, conversation_id, skills |
| `tool_calls` | What the AI did (created plan, updated artifacts, etc.) |
| `pending_questions` | Clarification form if the request was ambiguous |

## AI Capabilities

| Capability | Behavior |
|------------|----------|
| Create plan | Infers name, type, frequency from the request |
| Build SQL | Decomposes into named CTEs with `payout` as final |
| Modify SQL | Replaces all artifacts with the complete updated set |
| Update plan | Changes name, type, or frequency |
| Configure plan | Sets payout timing, payroll type, dispute settings |
| Infer plan config | Fills in a YAML template from the conversation |
| Explore data | Runs read-only queries to answer questions |
| Validate SQL | Checks syntax before committing |
| Ask clarification | Returns structured questions with options |
| Self-heal | If SQL fails, fixes and retries automatically |
| Read files | Analyzes uploaded images, PDFs, and CSVs natively |

## Skills

Skills are reusable instructions injected into the AI's context. They are versioned — each update creates a new immutable version. Plans pin to specific skill versions at creation time.

Example:
```
Name: commission_rules (v2)
Content: Always use deal_value for calculations. Exclude deals with stage = Disqualified.
```

Skills can be overridden per chat turn by passing `skill_ids` in the request.

## Plan Templates

Templates define what the AI should infer from the conversation. Managed via the plan-templates API. The AI fills in the template progressively across chat turns, saving the result as `inferred_config` on the plan.

Values are marked as:
- Confirmed — directly stated by the user
- `# inferred -- please confirm` — guessed from context
- `TODO` — unknown, needs user input

## Plan Config

Plans have structured configuration matching the production system:

| Section | Fields |
|---------|--------|
| Payout | is_automatic_payout_enabled, final_payment_offset, is_draws_enabled, draw_frequency |
| Payroll | payout_type (BONUS / COMMISSION) |
| Disputes | is_disputes_enabled |

## File Upload

Users can upload files to the chat for the AI to analyze:

| Type | How the AI sees it |
|------|--------------------|
| Images (PNG, JPEG, GIF, WebP) | Natively via vision |
| PDFs | Natively via document reading |
| CSV | Text extracted and included inline |
| XLSX, DOCX | Text extracted and included inline |

Files are uploaded separately via `/api/chat/upload` and referenced by `file_id` in the chat request. Max 20 MB per file.

## Out of Scope (POC)

- Authentication / authorization
- Multi-user / company isolation
- Websockets (polling is fine)
- Rate limiting
- SQL injection protection beyond read-only mode
