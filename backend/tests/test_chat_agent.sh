#!/usr/bin/env bash
# Tests: session-based chat, plan creation via tool, multi-turn, rename, data exploration, modify, parallel tools
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/helpers.sh"

echo -e "${BOLD}=== Chat Agent Tests ===${RESET}"

# ── Create plan from prompt (no plan_id) ──
step "Chat: create plan from prompt"
debug "Sending: Create a quarterly commission plan called Q1 Sales with 10% on closed-won deals over 50000"
CHAT1_RESP=$(curl -s -X POST "$BASE/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "Create a quarterly commission plan called Q1 Sales with 10% on all closed-won deals over 50000"}')
check_json "$CHAT1_RESP" "Chat turn 1"

CONV_ID=$(echo "$CHAT1_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['conversation_id'])")
pass "Got conversation $CONV_ID"

HAS_PLAN=$(echo "$CHAT1_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('plan') is not None)")
[ "$HAS_PLAN" = "True" ] && pass "Plan created via tool" || fail "No plan in response"

PLAN_ID=$(echo "$CHAT1_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['plan']['plan_id'])")
PLAN_NAME=$(echo "$CHAT1_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['plan']['name'])")
debug "Plan: $PLAN_ID ($PLAN_NAME)"

ART_COUNT=$(echo "$CHAT1_RESP" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['current_artifacts']))")
[ "$ART_COUNT" -ge 1 ] && pass "$ART_COUNT artifact(s) created" || fail "No artifacts"

TC_COUNT=$(echo "$CHAT1_RESP" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['tool_calls']))")
ITERATIONS=$(echo "$CHAT1_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['iterations'])")
pass "$TC_COUNT tool call(s), $ITERATIONS iteration(s)"

debug "Tool calls:"
echo "$CHAT1_RESP" | python3 -c "
import sys, json
for tc in json.load(sys.stdin)['tool_calls']:
    print(f\"  {tc['tool_name']}: success={tc['success']} error={tc.get('error','none')}\")
"

HAS_CREATE=$(echo "$CHAT1_RESP" | python3 -c "
import sys, json
print(any(tc['tool_name'] == 'create_plan' for tc in json.load(sys.stdin)['tool_calls']))
")
[ "$HAS_CREATE" = "True" ] && pass "LLM called create_plan" || debug "LLM may have called create_plan implicitly"

COMPOSED=$(echo "$CHAT1_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('composed_sql') or 'NONE')")
[ "$COMPOSED" != "NONE" ] && pass "Composed SQL present" || debug "No composed SQL yet"

# ── Verify plan via REST ──
step "Verify plan via GET"
GET_PLAN=$(curl -s "$BASE/api/plans/$PLAN_ID")
check_json "$GET_PLAN" "Get plan"
DB_ART=$(echo "$GET_PLAN" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['artifacts']))")
[ "$DB_ART" -ge 1 ] && pass "Plan has $DB_ART artifact(s) in DB" || fail "No artifacts in DB"

# ── Rename plan (multi-turn, same conversation) ──
step "Chat: rename plan"
debug "Sending: Rename this plan to Q2 Sales Commissions"
CHAT2_RESP=$(curl -s -X POST "$BASE/api/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"conversation_id\": \"$CONV_ID\",
    \"message\": \"Rename this plan to Q2 Sales Commissions\"
  }")
check_json "$CHAT2_RESP" "Chat turn 2"

NEW_NAME=$(echo "$CHAT2_RESP" | python3 -c "import sys,json; p=json.load(sys.stdin).get('plan'); print(p['name'] if p else 'NONE')")
debug "Plan name: $NEW_NAME"

HAS_UPDATE_PLAN=$(echo "$CHAT2_RESP" | python3 -c "
import sys, json
print(any(tc['tool_name'] == 'update_plan' for tc in json.load(sys.stdin)['tool_calls']))
")
[ "$HAS_UPDATE_PLAN" = "True" ] && pass "LLM called update_plan" || fail "LLM did not call update_plan"

# Verify persisted
DB_NAME=$(curl -s "$BASE/api/plans/$PLAN_ID" | python3 -c "import sys,json; print(json.load(sys.stdin)['name'])")
debug "DB name: $DB_NAME"
echo "$DB_NAME" | grep -qi "Q2" && pass "Plan name persisted" || fail "Name not updated: $DB_NAME"

# ── Data exploration ──
step "Chat: data exploration"
debug "Sending: How many closed-won deals are there? Run a query."
CHAT3_RESP=$(curl -s -X POST "$BASE/api/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"conversation_id\": \"$CONV_ID\",
    \"message\": \"How many closed-won deals are there? Run a query to find out.\"
  }")
check_json "$CHAT3_RESP" "Chat turn 3"

HAS_EXEC=$(echo "$CHAT3_RESP" | python3 -c "
import sys, json
print(any(tc['tool_name'] == 'execute_query' for tc in json.load(sys.stdin)['tool_calls']))
")
[ "$HAS_EXEC" = "True" ] && pass "LLM called execute_query" || debug "LLM answered without query (acceptable)"

# ── Modify commission ──
step "Chat: modify commission"
debug "Sending: Change to 15% and remove the 50k threshold"
CHAT4_RESP=$(curl -s -X POST "$BASE/api/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"conversation_id\": \"$CONV_ID\",
    \"message\": \"Change the commission rate to 15% and remove the 50k deal threshold\"
  }")
check_json "$CHAT4_RESP" "Chat turn 4"

ART4=$(echo "$CHAT4_RESP" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['current_artifacts']))")
pass "After modification: $ART4 artifact(s)"

debug "Artifacts:"
echo "$CHAT4_RESP" | python3 -c "
import sys, json
for a in json.load(sys.stdin)['current_artifacts']:
    print(f\"  {a.get('name')}: {a.get('sql_expression','')[:80]}...\")
"

# ── Rename + modify in one message (parallel tools) ──
step "Chat: rename + modify in one message"
debug "Sending: Rename to Q3 Plan and add a 2x accelerator for deals over 100k"
CHAT5_RESP=$(curl -s -X POST "$BASE/api/chat" \
  -H "Content-Type: application/json" \
  -d "{
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
pass "Multi-action chat completed"

FINAL_NAME=$(echo "$CHAT5_RESP" | python3 -c "import sys,json; p=json.load(sys.stdin).get('plan'); print(p['name'] if p else 'NONE')")
debug "Final plan name: $FINAL_NAME"

# ── Conversation history ──
step "Conversation history"
CONV_RESP=$(curl -s "$BASE/api/conversations/$CONV_ID")
check_json "$CONV_RESP" "Conversation"
MSG_COUNT=$(echo "$CONV_RESP" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['messages']))")
[ "$MSG_COUNT" -ge 10 ] && pass "Conversation has $MSG_COUNT messages (5 turns)" || fail "Expected >=10 messages, got $MSG_COUNT"

# ── Plan preview ──
step "Plan preview"
PREVIEW_RESP=$(curl -s "$BASE/api/plans/$PLAN_ID/preview")
check_json "$PREVIEW_RESP" "Preview"
PREVIEW_ERR=$(echo "$PREVIEW_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['result'].get('error') or '')")
if [ -n "$PREVIEW_ERR" ]; then
    debug "Preview SQL error (non-fatal): $PREVIEW_ERR"
else
    ROW_COUNT=$(echo "$PREVIEW_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['result']['row_count'])")
    pass "Preview returned $ROW_COUNT rows"
fi

# ── List conversations ──
step "List conversations"
LIST_RESP=$(curl -s "$BASE/api/plans/$PLAN_ID/conversations")
check_json "$LIST_RESP" "List conversations"
CONV_COUNT=$(echo "$LIST_RESP" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")
[ "$CONV_COUNT" -ge 1 ] && pass "Plan has $CONV_COUNT conversation(s)" || fail "No conversations"

# ── Plan response shape ──
step "Plan response shape"
PLAN_FINAL=$(curl -s "$BASE/api/plans/$PLAN_ID")
check_json "$PLAN_FINAL" "Final plan"

HAS_CONV_ID=$(echo "$PLAN_FINAL" | python3 -c "import sys,json; print(json.load(sys.stdin).get('conversation_id') is not None)")
[ "$HAS_CONV_ID" = "True" ] && pass "Plan has conversation_id" || debug "No conversation_id (may not be linked)"

HAS_CONFIG=$(echo "$PLAN_FINAL" | python3 -c "import sys,json; print('config' in json.load(sys.stdin))")
[ "$HAS_CONFIG" = "True" ] && pass "Plan has config" || fail "No config in plan"

HAS_CYCLES=$(echo "$PLAN_FINAL" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('cycles') is not None and len(d['cycles']) > 0)")
[ "$HAS_CYCLES" = "True" ] && pass "Plan has cycles" || debug "No cycles (start/end dates may not have been set)"

# ── Explain artifact ──
step "Explain artifact"
PAYOUT_ART_ID=$(echo "$PLAN_FINAL" | python3 -c "
import sys, json
arts = json.load(sys.stdin)['artifacts']
payout = next((a for a in arts if a.get('name') == 'payout'), None)
print(payout['artifact_id'] if payout else arts[-1]['artifact_id'] if arts else '')
")

if [ -n "$PAYOUT_ART_ID" ]; then
    EXPLAIN_RESP=$(curl -s -X POST "$BASE/api/artifacts/$PAYOUT_ART_ID/explain" \
      -H "Content-Type: application/json" \
      -d '{}')
    check_json "$EXPLAIN_RESP" "Explain"
    HAS_SUMMARY=$(echo "$EXPLAIN_RESP" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('summary','')) > 10)")
    [ "$HAS_SUMMARY" = "True" ] && pass "Got structured explanation with summary" || fail "Summary too short"
    HAS_TIERS=$(echo "$EXPLAIN_RESP" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('tiers',[])) > 0)")
    [ "$HAS_TIERS" = "True" ] && pass "Explanation has tiers" || debug "No tiers returned"
    HAS_EXAMPLE=$(echo "$EXPLAIN_RESP" | python3 -c "import sys,json; print('employee' in json.load(sys.stdin).get('example',{}))")
    [ "$HAS_EXAMPLE" = "True" ] && pass "Explanation has example walkthrough" || fail "No example in explanation"
    debug "Summary: $(echo "$EXPLAIN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['summary'])")"
else
    debug "Skipped explain (no artifacts)"
fi

summary
