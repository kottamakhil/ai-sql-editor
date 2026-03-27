#!/usr/bin/env bash
# Tests: health check, schema introspection, seed data, plan CRUD, execute artifact
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/helpers.sh"

echo -e "${BOLD}=== Infrastructure & CRUD Tests ===${RESET}"

# ── Health check ──
step "Health check"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/ping")
[ "$STATUS" = "200" ] && pass "Server is up" || fail "Server not reachable (got $STATUS)"

# ── Schema introspection ──
step "Schema introspection"
SCHEMA=$(curl -s "$BASE/api/schema")
check_json "$SCHEMA" "Schema"
TABLE_COUNT=$(echo "$SCHEMA" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['tables']))")
[ "$TABLE_COUNT" -ge 3 ] && pass "Got $TABLE_COUNT table DDLs" || fail "Expected >=3 tables, got $TABLE_COUNT"

# ── Seed data ──
step "Seed data"
EXEC_RESP=$(curl -s -X POST "$BASE/api/execute" \
  -H "Content-Type: application/json" \
  -d '{"sql_expression": "SELECT COUNT(*) AS cnt FROM employees"}')
EMP_COUNT=$(echo "$EXEC_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['rows'][0][0])")
[ "$EMP_COUNT" -ge 1 ] && pass "employees: $EMP_COUNT rows" || fail "employees table is empty"

DEAL_RESP=$(curl -s -X POST "$BASE/api/execute" \
  -H "Content-Type: application/json" \
  -d '{"sql_expression": "SELECT COUNT(*) AS cnt FROM deals"}')
DEAL_COUNT=$(echo "$DEAL_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['rows'][0][0])")
[ "$DEAL_COUNT" -ge 1 ] && pass "deals: $DEAL_COUNT rows" || fail "deals table is empty"

# ── Create plan (REST) ──
step "Create plan via REST"
PLAN_RESP=$(curl -s -X POST "$BASE/api/plans" \
  -H "Content-Type: application/json" \
  -d '{"name": "CRUD Test Plan", "plan_type": "RECURRING", "frequency": "QUARTERLY"}')
check_json "$PLAN_RESP" "Create plan"
PLAN_ID=$(echo "$PLAN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['plan_id'])")
pass "Created plan $PLAN_ID"

# ── Get plan ──
step "Get plan"
GET_RESP=$(curl -s "$BASE/api/plans/$PLAN_ID")
check_json "$GET_RESP" "Get plan"
GOT_NAME=$(echo "$GET_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['name'])")
[ "$GOT_NAME" = "CRUD Test Plan" ] && pass "Plan name matches" || fail "Expected 'CRUD Test Plan', got '$GOT_NAME'"

# ── List plans ──
step "List plans"
LIST_RESP=$(curl -s "$BASE/api/plans")
check_json "$LIST_RESP" "List plans"
LIST_COUNT=$(echo "$LIST_RESP" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")
[ "$LIST_COUNT" -ge 1 ] && pass "Got $LIST_COUNT plan(s)" || fail "No plans"

# ── Create artifact manually ──
step "Create artifact via REST"
ART_RESP=$(curl -s -X POST "$BASE/api/plans/$PLAN_ID/artifacts" \
  -H "Content-Type: application/json" \
  -d '{"name": "test_cte", "sql_expression": "SELECT 1 AS val"}')
check_json "$ART_RESP" "Create artifact"
ART_ID=$(echo "$ART_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['artifact_id'])")
pass "Created artifact $ART_ID"

# ── Execute single artifact ──
step "Execute artifact"
EXEC_ART=$(curl -s -X POST "$BASE/api/execute" \
  -H "Content-Type: application/json" \
  -d "{\"artifact_id\": \"$ART_ID\"}")
check_json "$EXEC_ART" "Execute artifact"
EXEC_ERR=$(echo "$EXEC_ART" | python3 -c "import sys,json; print(json.load(sys.stdin).get('error') or '')")
[ -z "$EXEC_ERR" ] && pass "Artifact executed" || fail "Execution error: $EXEC_ERR"

# ── Skills CRUD ──
step "Skills CRUD"
SKILL_RESP=$(curl -s -X POST "$BASE/api/skills" \
  -H "Content-Type: application/json" \
  -d '{"name": "test_skill", "content": "Test content"}')
check_json "$SKILL_RESP" "Create skill"
SKILL_ID=$(echo "$SKILL_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['skill_id'])")
pass "Created skill $SKILL_ID"

GET_SKILL=$(curl -s "$BASE/api/skills/$SKILL_ID")
check_json "$GET_SKILL" "Get skill"
pass "Got skill"

LIST_SKILLS=$(curl -s "$BASE/api/skills")
check_json "$LIST_SKILLS" "List skills"
pass "Listed skills"

summary
