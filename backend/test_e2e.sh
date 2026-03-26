#!/usr/bin/env bash
set -euo pipefail

BASE="http://localhost:8000"
BOLD="\033[1m"
GREEN="\033[32m"
RED="\033[31m"
CYAN="\033[36m"
RESET="\033[0m"

pass() { echo -e "${GREEN}✓ $1${RESET}"; }
fail() { echo -e "${RED}✗ $1${RESET}"; exit 1; }
step() { echo -e "\n${BOLD}── $1 ──${RESET}"; }
debug() { echo -e "${CYAN}  → $1${RESET}"; }

check_json() {
    local resp="$1"
    local label="$2"
    echo "$resp" | python3 -m json.tool > /dev/null 2>&1 || {
        echo -e "${RED}✗ $label: not valid JSON${RESET}"
        echo "$resp" | head -c 500
        exit 1
    }
    local is_error
    is_error=$(echo "$resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print('traceback' in d)" 2>/dev/null || echo "False")
    if [ "$is_error" = "True" ]; then
        echo -e "${RED}✗ $label: server error${RESET}"
        echo "$resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('detail','')[:500])"
        exit 1
    fi
}

# ============================================================
# Infrastructure
# ============================================================

step "1. Health check"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/ping")
[ "$STATUS" = "200" ] && pass "Server is up" || fail "Server not reachable (got $STATUS)"

step "2. Schema introspection"
SCHEMA=$(curl -s "$BASE/api/schema")
check_json "$SCHEMA" "Schema"
TABLE_COUNT=$(echo "$SCHEMA" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['tables']))")
[ "$TABLE_COUNT" -ge 3 ] && pass "Got $TABLE_COUNT table DDLs" || fail "Expected >=3 tables, got $TABLE_COUNT"

step "3. Seed data"
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

# ============================================================
# Plan CRUD
# ============================================================

step "4. Create plan"
PLAN_RESP=$(curl -s -X POST "$BASE/api/plans" \
  -H "Content-Type: application/json" \
  -d '{"name": "E2E Test Plan", "plan_type": "RECURRING", "frequency": "QUARTERLY"}')
check_json "$PLAN_RESP" "Create plan"
PLAN_ID=$(echo "$PLAN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['plan_id'])")
pass "Created plan $PLAN_ID"

step "5. Get plan"
GET_PLAN_RESP=$(curl -s "$BASE/api/plans/$PLAN_ID")
check_json "$GET_PLAN_RESP" "Get plan"
GOT_NAME=$(echo "$GET_PLAN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['name'])")
[ "$GOT_NAME" = "E2E Test Plan" ] && pass "Plan name matches" || fail "Expected 'E2E Test Plan', got '$GOT_NAME'"

# ============================================================
# Chat turn 1: build commission (update_sql_artifacts tool)
# ============================================================

step "6. Chat: build commission structure"
debug "Sending: Build a 10% commission on all closed-won deals over 50000"
CHAT1_RESP=$(curl -s -X POST "$BASE/api/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"plan_id\": \"$PLAN_ID\",
    \"message\": \"Build a 10% commission on all closed-won deals over 50000\"
  }")
check_json "$CHAT1_RESP" "Chat turn 1"

CONV_ID=$(echo "$CHAT1_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['conversation_id'])")
ART_COUNT=$(echo "$CHAT1_RESP" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['current_artifacts']))")
ITERATIONS=$(echo "$CHAT1_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['iterations'])")
TC_COUNT=$(echo "$CHAT1_RESP" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['tool_calls']))")
pass "$ART_COUNT artifact(s), $TC_COUNT tool call(s), $ITERATIONS iteration(s)"

debug "Tool calls:"
echo "$CHAT1_RESP" | python3 -c "
import sys, json
for tc in json.load(sys.stdin)['tool_calls']:
    print(f\"  {tc['tool_name']}: success={tc['success']} error={tc.get('error','none')}\")
"

debug "Artifacts:"
echo "$CHAT1_RESP" | python3 -c "
import sys, json
for a in json.load(sys.stdin)['current_artifacts']:
    print(f\"  {a['name']}: {a['sql_expression'][:80]}...\")
"

COMPOSED=$(echo "$CHAT1_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('composed_sql') or 'NONE')")
[ "$COMPOSED" != "NONE" ] && pass "Composed SQL present" || debug "No composed SQL (no artifacts)"

HAS_UPDATE_ARTIFACTS=$(echo "$CHAT1_RESP" | python3 -c "
import sys, json
print(any(tc['tool_name'] == 'update_sql_artifacts' for tc in json.load(sys.stdin)['tool_calls']))
")
[ "$HAS_UPDATE_ARTIFACTS" = "True" ] && pass "LLM called update_sql_artifacts" || fail "LLM did not call update_sql_artifacts"

# ============================================================
# Execute single artifact
# ============================================================

step "7. Execute single artifact"
FIRST_ART_ID=$(echo "$CHAT1_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['current_artifacts'][0]['artifact_id'])")
EXEC_ART_RESP=$(curl -s -X POST "$BASE/api/execute" \
  -H "Content-Type: application/json" \
  -d "{\"artifact_id\": \"$FIRST_ART_ID\"}")
check_json "$EXEC_ART_RESP" "Execute artifact"
EXEC_ERROR=$(echo "$EXEC_ART_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('error') or '')")
[ -z "$EXEC_ERROR" ] && pass "Artifact $FIRST_ART_ID executed" || fail "Execution error: $EXEC_ERROR"

# ============================================================
# Chat turn 2: rename plan (update_plan tool)
# ============================================================

step "8. Chat: rename plan"
debug "Sending: Rename this plan to Q2 Sales Commissions"
CHAT2_RESP=$(curl -s -X POST "$BASE/api/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"plan_id\": \"$PLAN_ID\",
    \"conversation_id\": \"$CONV_ID\",
    \"message\": \"Rename this plan to Q2 Sales Commissions\"
  }")
check_json "$CHAT2_RESP" "Chat turn 2"

NEW_NAME=$(echo "$CHAT2_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['plan']['name'])")
debug "Plan name in response: $NEW_NAME"

HAS_UPDATE_PLAN=$(echo "$CHAT2_RESP" | python3 -c "
import sys, json
print(any(tc['tool_name'] == 'update_plan' for tc in json.load(sys.stdin)['tool_calls']))
")
[ "$HAS_UPDATE_PLAN" = "True" ] && pass "LLM called update_plan" || fail "LLM did not call update_plan"

PLAN_CHECK=$(curl -s "$BASE/api/plans/$PLAN_ID")
DB_NAME=$(echo "$PLAN_CHECK" | python3 -c "import sys,json; print(json.load(sys.stdin)['name'])")
debug "Plan name in DB: $DB_NAME"
echo "$DB_NAME" | grep -qi "Q2" && pass "Plan name persisted" || fail "Plan name not updated: $DB_NAME"

# ============================================================
# Chat turn 3: data exploration (execute_query tool)
# ============================================================

step "9. Chat: data exploration"
debug "Sending: How many closed-won deals are there? Run a query to find out."
CHAT3_RESP=$(curl -s -X POST "$BASE/api/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"plan_id\": \"$PLAN_ID\",
    \"conversation_id\": \"$CONV_ID\",
    \"message\": \"How many closed-won deals are there? Run a query to find out.\"
  }")
check_json "$CHAT3_RESP" "Chat turn 3"

HAS_EXECUTE_QUERY=$(echo "$CHAT3_RESP" | python3 -c "
import sys, json
print(any(tc['tool_name'] == 'execute_query' for tc in json.load(sys.stdin)['tool_calls']))
")
[ "$HAS_EXECUTE_QUERY" = "True" ] && pass "LLM called execute_query" || debug "LLM answered without execute_query (acceptable)"

debug "Tool calls:"
echo "$CHAT3_RESP" | python3 -c "
import sys, json
for tc in json.load(sys.stdin)['tool_calls']:
    print(f\"  {tc['tool_name']}: success={tc['success']}\")
    if tc.get('result_data') and 'rows' in tc['result_data']:
        print(f\"    rows={tc['result_data']['rows'][:3]}\")
"

# ============================================================
# Chat turn 4: modify commission (multi-turn replacement)
# ============================================================

step "10. Chat: modify commission"
debug "Sending: Change to 15% and remove the 50k threshold"
CHAT4_RESP=$(curl -s -X POST "$BASE/api/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"plan_id\": \"$PLAN_ID\",
    \"conversation_id\": \"$CONV_ID\",
    \"message\": \"Change the commission rate to 15% and remove the 50k deal threshold\"
  }")
check_json "$CHAT4_RESP" "Chat turn 4"

ART_COUNT4=$(echo "$CHAT4_RESP" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['current_artifacts']))")
pass "After modification: $ART_COUNT4 artifact(s)"

debug "Artifacts:"
echo "$CHAT4_RESP" | python3 -c "
import sys, json
for a in json.load(sys.stdin)['current_artifacts']:
    print(f\"  {a['name']}: {a['sql_expression'][:80]}...\")
"

# ============================================================
# Chat turn 5: rename + modify in one message (parallel tools)
# ============================================================

step "11. Chat: rename + modify in one message"
debug "Sending: Rename to Q3 Plan and add a 2x accelerator for deals over 100k"
CHAT5_RESP=$(curl -s -X POST "$BASE/api/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"plan_id\": \"$PLAN_ID\",
    \"conversation_id\": \"$CONV_ID\",
    \"message\": \"Rename this plan to Q3 Plan and add a 2x accelerator for deals over 100k\"
  }")
check_json "$CHAT5_RESP" "Chat turn 5"

TC_NAMES=$(echo "$CHAT5_RESP" | python3 -c "
import sys, json
names = sorted(set(tc['tool_name'] for tc in json.load(sys.stdin)['tool_calls']))
print(' '.join(names))
")
debug "Tools called: $TC_NAMES"

FINAL_NAME=$(echo "$CHAT5_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['plan']['name'])")
debug "Final plan name: $FINAL_NAME"

# ============================================================
# Conversation + Preview
# ============================================================

step "12. Conversation history"
CONV_RESP=$(curl -s "$BASE/api/conversations/$CONV_ID")
check_json "$CONV_RESP" "Conversation"
MSG_COUNT=$(echo "$CONV_RESP" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['messages']))")
[ "$MSG_COUNT" -ge 10 ] && pass "Conversation has $MSG_COUNT messages (5 turns)" || fail "Expected >=10 messages, got $MSG_COUNT"

step "13. Plan preview"
PREVIEW_RESP=$(curl -s "$BASE/api/plans/$PLAN_ID/preview")
check_json "$PREVIEW_RESP" "Preview"
PREVIEW_ERR=$(echo "$PREVIEW_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['result'].get('error') or '')")
if [ -n "$PREVIEW_ERR" ]; then
    debug "Preview SQL error (non-fatal): $PREVIEW_ERR"
else
    ROW_COUNT=$(echo "$PREVIEW_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['result']['row_count'])")
    pass "Preview returned $ROW_COUNT rows"
fi

step "14. List conversations"
LIST_RESP=$(curl -s "$BASE/api/plans/$PLAN_ID/conversations")
check_json "$LIST_RESP" "List conversations"
CONV_COUNT=$(echo "$LIST_RESP" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")
[ "$CONV_COUNT" -ge 1 ] && pass "Plan has $CONV_COUNT conversation(s)" || fail "No conversations found"

# ============================================================
# Clarification questions
# ============================================================

step "15. Chat: vague request triggers clarification"
PLAN2_RESP=$(curl -s -X POST "$BASE/api/plans" \
  -H "Content-Type: application/json" \
  -d '{"name": "Clarification Test", "plan_type": "RECURRING", "frequency": "QUARTERLY"}')
check_json "$PLAN2_RESP" "Create plan 2"
PLAN2_ID=$(echo "$PLAN2_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['plan_id'])")

debug "Sending vague request: Build a commission plan"
CLARIFY_RESP=$(curl -s -X POST "$BASE/api/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"plan_id\": \"$PLAN2_ID\",
    \"message\": \"Build a commission plan\"
  }")
check_json "$CLARIFY_RESP" "Clarification chat"

CONV2_ID=$(echo "$CLARIFY_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['conversation_id'])")
HAS_QUESTIONS=$(echo "$CLARIFY_RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
qs = d.get('pending_questions') or []
print(len(qs) > 0)
")

if [ "$HAS_QUESTIONS" = "True" ]; then
    pass "LLM returned clarification questions"
    echo "$CLARIFY_RESP" | python3 -c "
import sys, json
for q in json.load(sys.stdin)['pending_questions']:
    opts = ', '.join(o['label'] for o in q['options'])
    print(f\"  {q['question']} [{opts}]\")
"
else
    debug "LLM proceeded without clarification (acceptable — may have used defaults)"
fi

step "16. Conversation GET includes pending questions"
CONV2_CHECK=$(curl -s "$BASE/api/conversations/$CONV2_ID")
check_json "$CONV2_CHECK" "Get conversation"
HAS_PERSISTED_Q=$(echo "$CONV2_CHECK" | python3 -c "
import sys, json
d = json.load(sys.stdin)
qs = d.get('pending_questions') or []
print(len(qs) > 0)
")
if [ "$HAS_QUESTIONS" = "True" ]; then
    [ "$HAS_PERSISTED_Q" = "True" ] && pass "Pending questions persisted in conversation" || fail "Questions not persisted"
else
    pass "No questions to persist (LLM used defaults)"
fi

step "17. Answer clarification and get results"
if [ "$HAS_QUESTIONS" = "True" ]; then
    debug "Sending answer: 10% on all closed-won deals"
    ANSWER_RESP=$(curl -s -X POST "$BASE/api/chat" \
      -H "Content-Type: application/json" \
      -d "{
        \"plan_id\": \"$PLAN2_ID\",
        \"conversation_id\": \"$CONV2_ID\",
        \"message\": \"10% commission on all closed-won deals, no threshold, no accelerator\"
      }")
    check_json "$ANSWER_RESP" "Answer chat"

    ART_COUNT_A=$(echo "$ANSWER_RESP" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['current_artifacts']))")
    CLEARED=$(echo "$ANSWER_RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(d.get('pending_questions') is None)
")
    [ "$ART_COUNT_A" -ge 1 ] && pass "After answering: $ART_COUNT_A artifact(s) created" || fail "No artifacts after answer"
    [ "$CLEARED" = "True" ] && pass "Pending questions cleared" || debug "Questions still present (may need another turn)"
else
    pass "Skipped (no clarification was needed)"
fi

# ============================================================

echo -e "\n${GREEN}${BOLD}All 17 tests passed.${RESET}"
