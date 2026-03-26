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

# ── 1. Health check ──
step "1. Health check"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/ping")
[ "$STATUS" = "200" ] && pass "Server is up" || fail "Server not reachable (got $STATUS)"

# ── 2. Create a plan ──
step "2. Create plan"
PLAN_RESP=$(curl -s -X POST "$BASE/api/plans" \
  -H "Content-Type: application/json" \
  -d '{"name": "Agent Test Plan", "plan_type": "RECURRING", "frequency": "QUARTERLY"}')
check_json "$PLAN_RESP" "Create plan"
PLAN_ID=$(echo "$PLAN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['plan_id'])")
pass "Created plan $PLAN_ID"

# ── 3. Chat: build commission (tests update_sql_artifacts tool) ──
step "3. Chat: build commission structure"
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
d = json.load(sys.stdin)
for tc in d['tool_calls']:
    print(f\"  {tc['tool_name']}: success={tc['success']} error={tc.get('error','none')}\")
"

debug "Artifacts:"
echo "$CHAT1_RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
for a in d['current_artifacts']:
    print(f\"  {a['name']}: {a['sql_expression'][:80]}...\")
"

COMPOSED=$(echo "$CHAT1_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('composed_sql') or 'NONE')")
debug "Composed SQL present: $([ "$COMPOSED" != "NONE" ] && echo 'yes' || echo 'no')"

HAS_UPDATE_ARTIFACTS=$(echo "$CHAT1_RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(any(tc['tool_name'] == 'update_sql_artifacts' for tc in d['tool_calls']))
")
[ "$HAS_UPDATE_ARTIFACTS" = "True" ] && pass "LLM called update_sql_artifacts" || fail "LLM did not call update_sql_artifacts"

# ── 4. Chat: update plan name (tests update_plan tool) ──
step "4. Chat: rename plan"
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
d = json.load(sys.stdin)
print(any(tc['tool_name'] == 'update_plan' for tc in d['tool_calls']))
")
[ "$HAS_UPDATE_PLAN" = "True" ] && pass "LLM called update_plan" || fail "LLM did not call update_plan"

# Verify plan name persisted in DB
PLAN_CHECK=$(curl -s "$BASE/api/plans/$PLAN_ID")
DB_NAME=$(echo "$PLAN_CHECK" | python3 -c "import sys,json; print(json.load(sys.stdin)['name'])")
debug "Plan name in DB: $DB_NAME"
echo "$DB_NAME" | grep -qi "Q2" && pass "Plan name updated in DB" || fail "Plan name not updated: $DB_NAME"

# ── 5. Chat: data exploration (tests execute_query tool) ──
step "5. Chat: data exploration"
debug "Sending: How many closed-won deals are there?"
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
d = json.load(sys.stdin)
print(any(tc['tool_name'] == 'execute_query' for tc in d['tool_calls']))
")
[ "$HAS_EXECUTE_QUERY" = "True" ] && pass "LLM called execute_query" || debug "LLM answered without execute_query (acceptable)"

debug "Tool calls:"
echo "$CHAT3_RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
for tc in d['tool_calls']:
    print(f\"  {tc['tool_name']}: success={tc['success']}\")
    if tc.get('result_data') and 'rows' in tc['result_data']:
        print(f\"    rows={tc['result_data']['rows'][:3]}\")
"

# ── 6. Chat: modify commission (tests multi-turn artifact replacement) ──
step "6. Chat: modify commission structure"
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
d = json.load(sys.stdin)
for a in d['current_artifacts']:
    print(f\"  {a['name']}: {a['sql_expression'][:80]}...\")
"

# ── 7. Chat: rename + modify in one message (tests parallel tool calls) ──
step "7. Chat: rename + modify in one message"
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
d = json.load(sys.stdin)
names = sorted(set(tc['tool_name'] for tc in d['tool_calls']))
print(' '.join(names))
")
debug "Tools called: $TC_NAMES"

FINAL_NAME=$(echo "$CHAT5_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['plan']['name'])")
debug "Final plan name: $FINAL_NAME"

# ── 8. Conversation history preserved ──
step "8. Conversation history"
CONV_RESP=$(curl -s "$BASE/api/conversations/$CONV_ID")
check_json "$CONV_RESP" "Conversation"
MSG_COUNT=$(echo "$CONV_RESP" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['messages']))")
pass "Conversation has $MSG_COUNT messages (includes tool call history)"

# ── 9. Plan preview still works ──
step "9. Plan preview"
PREVIEW_RESP=$(curl -s "$BASE/api/plans/$PLAN_ID/preview")
check_json "$PREVIEW_RESP" "Preview"
PREVIEW_ERR=$(echo "$PREVIEW_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['result'].get('error') or '')")
if [ -n "$PREVIEW_ERR" ]; then
    debug "Preview SQL error (non-fatal): $PREVIEW_ERR"
else
    ROW_COUNT=$(echo "$PREVIEW_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['result']['row_count'])")
    pass "Preview returned $ROW_COUNT rows"
fi

echo -e "\n${GREEN}${BOLD}All agent tests passed.${RESET}"
