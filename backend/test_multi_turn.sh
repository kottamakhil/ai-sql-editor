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

# Helper: check HTTP response is valid JSON and not a 500
check_json() {
    local resp="$1"
    local label="$2"
    echo "$resp" | python3 -m json.tool > /dev/null 2>&1 || {
        echo -e "${RED}✗ $label: response is not valid JSON${RESET}"
        echo "$resp" | head -c 500
        exit 1
    }
    local has_detail
    has_detail=$(echo "$resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print('traceback' in d)" 2>/dev/null || echo "False")
    if [ "$has_detail" = "True" ]; then
        echo -e "${RED}✗ $label: server returned error${RESET}"
        echo "$resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('detail','')[:500])"
        exit 1
    fi
}

# ── 1. Create a plan ──
step "1. Create plan"
PLAN_RESP=$(curl -s -X POST "$BASE/api/plans" \
  -H "Content-Type: application/json" \
  -d '{"name": "Multi-Turn Test", "plan_type": "RECURRING", "frequency": "QUARTERLY"}')
check_json "$PLAN_RESP" "Create plan"
PLAN_ID=$(echo "$PLAN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['plan_id'])")
pass "Created plan $PLAN_ID"

# ── 2. First chat turn ──
step "2. First chat turn"
debug "Sending: Build a 10% commission on closed-won deals over 50000"
CHAT1_RESP=$(curl -s -X POST "$BASE/api/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"plan_id\": \"$PLAN_ID\",
    \"message\": \"Build a 10% commission on all closed-won deals over 50000\"
  }")
check_json "$CHAT1_RESP" "First chat"
CONV_ID=$(echo "$CHAT1_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['conversation_id'])")
ART_COUNT1=$(echo "$CHAT1_RESP" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['current_artifacts']))")
pass "Created $ART_COUNT1 artifact(s), conversation=$CONV_ID"

debug "Artifacts after turn 1:"
echo "$CHAT1_RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
for a in d['current_artifacts']:
    print(f\"  {a['artifact_id']}  name={a['name']}  sql={a['sql_expression'][:80]}...\")
"

debug "Operation results:"
echo "$CHAT1_RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
for op in d['operations']:
    err = (op.get('result') or {}).get('error') or 'none'
    rows = (op.get('result') or {}).get('row_count', '?')
    print(f\"  action={op['action']}  name={op.get('name')}  rows={rows}  error={err}\")
"

# ── 3. Verify artifacts in DB ──
step "3. Verify artifacts persisted"
PLAN_CHECK=$(curl -s "$BASE/api/plans/$PLAN_ID")
check_json "$PLAN_CHECK" "Get plan"
DB_ART_COUNT=$(echo "$PLAN_CHECK" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['artifacts']))")
[ "$DB_ART_COUNT" -ge 1 ] && pass "Plan has $DB_ART_COUNT artifact(s) in DB" || fail "No artifacts in DB"

# ── 4. Second chat turn (multi-turn, same conversation) ──
step "4. Second chat turn (multi-turn)"
debug "Sending: Change to 15% commission and remove the 50k threshold"
CHAT2_RESP=$(curl -s -X POST "$BASE/api/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"plan_id\": \"$PLAN_ID\",
    \"conversation_id\": \"$CONV_ID\",
    \"message\": \"Change to a 15% commission and remove the 50k threshold\"
  }")
check_json "$CHAT2_RESP" "Second chat"
CONV2_ID=$(echo "$CHAT2_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['conversation_id'])")
ART_COUNT2=$(echo "$CHAT2_RESP" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['current_artifacts']))")
pass "Turn 2: $ART_COUNT2 artifact(s), conversation=$CONV2_ID"
[ "$CONV2_ID" = "$CONV_ID" ] && pass "Same conversation ID" || fail "Conversation ID changed"

debug "Artifacts after turn 2:"
echo "$CHAT2_RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
for a in d['current_artifacts']:
    print(f\"  {a['artifact_id']}  name={a['name']}  sql={a['sql_expression'][:80]}...\")
"

debug "Operation results:"
echo "$CHAT2_RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
for op in d['operations']:
    err = (op.get('result') or {}).get('error') or 'none'
    rows = (op.get('result') or {}).get('row_count', '?')
    print(f\"  action={op['action']}  name={op.get('name')}  rows={rows}  error={err}\")
"

# ── 5. Third chat turn ──
step "5. Third chat turn"
debug "Sending: Add a 2x accelerator for deals over 100k"
CHAT3_RESP=$(curl -s -X POST "$BASE/api/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"plan_id\": \"$PLAN_ID\",
    \"conversation_id\": \"$CONV_ID\",
    \"message\": \"Add a 2x accelerator for deals over 100k\"
  }")
check_json "$CHAT3_RESP" "Third chat"
ART_COUNT3=$(echo "$CHAT3_RESP" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['current_artifacts']))")
pass "Turn 3: $ART_COUNT3 artifact(s)"

debug "Operation results:"
echo "$CHAT3_RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
for op in d['operations']:
    err = (op.get('result') or {}).get('error') or 'none'
    rows = (op.get('result') or {}).get('row_count', '?')
    print(f\"  action={op['action']}  name={op.get('name')}  rows={rows}  error={err}\")
"

# ── 6. Preview the final plan ──
step "6. Plan preview"
PREVIEW_RESP=$(curl -s "$BASE/api/plans/$PLAN_ID/preview")
check_json "$PREVIEW_RESP" "Preview"
ROW_COUNT=$(echo "$PREVIEW_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['result']['row_count'])")
PREVIEW_ERR=$(echo "$PREVIEW_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['result'].get('error') or '')")
if [ -n "$PREVIEW_ERR" ]; then
    fail "Preview SQL error: $PREVIEW_ERR"
fi
pass "Preview returned $ROW_COUNT rows"

# ── 7. Conversation history ──
step "7. Conversation history"
CONV_RESP=$(curl -s "$BASE/api/conversations/$CONV_ID")
check_json "$CONV_RESP" "Conversation"
MSG_COUNT=$(echo "$CONV_RESP" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['messages']))")
[ "$MSG_COUNT" -ge 6 ] && pass "Conversation has $MSG_COUNT messages (3 turns × 2)" || fail "Expected >=6 messages, got $MSG_COUNT"

echo -e "\n${GREEN}${BOLD}All multi-turn tests passed.${RESET}"
