#!/usr/bin/env bash
set -euo pipefail

BASE="http://localhost:8000"
BOLD="\033[1m"
GREEN="\033[32m"
RED="\033[31m"
RESET="\033[0m"

pass() { echo -e "${GREEN}✓ $1${RESET}"; }
fail() { echo -e "${RED}✗ $1${RESET}"; exit 1; }
step() { echo -e "\n${BOLD}── $1 ──${RESET}"; }

# ── 1. Health check ──
step "Health check"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/ping")
[ "$STATUS" = "200" ] && pass "Server is up" || fail "Server not reachable (got $STATUS)"

# ── 2. Schema introspection ──
step "Schema introspection"
SCHEMA=$(curl -s "$BASE/api/schema")
echo "$SCHEMA" | python3 -m json.tool > /dev/null 2>&1 || fail "Schema response is not valid JSON"
TABLE_COUNT=$(echo "$SCHEMA" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['tables']))")
[ "$TABLE_COUNT" -ge 3 ] && pass "Got $TABLE_COUNT table DDLs" || fail "Expected >=3 tables, got $TABLE_COUNT"

# ── 3. Seed data verification ──
step "Seed data verification"
EXEC_RESP=$(curl -s -X POST "$BASE/api/execute" \
  -H "Content-Type: application/json" \
  -d '{"sql_expression": "SELECT COUNT(*) AS cnt FROM employees"}')
EMP_COUNT=$(echo "$EXEC_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['rows'][0][0])")
[ "$EMP_COUNT" -ge 1 ] && pass "employees table has $EMP_COUNT rows" || fail "employees table is empty"

DEAL_RESP=$(curl -s -X POST "$BASE/api/execute" \
  -H "Content-Type: application/json" \
  -d '{"sql_expression": "SELECT COUNT(*) AS cnt FROM deals"}')
DEAL_COUNT=$(echo "$DEAL_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['rows'][0][0])")
[ "$DEAL_COUNT" -ge 1 ] && pass "deals table has $DEAL_COUNT rows" || fail "deals table is empty"

# ── 4. Create a plan ──
step "Create plan"
PLAN_RESP=$(curl -s -X POST "$BASE/api/plans" \
  -H "Content-Type: application/json" \
  -d '{"name": "E2E Test Plan", "plan_type": "RECURRING", "frequency": "QUARTERLY"}')
PLAN_ID=$(echo "$PLAN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['plan_id'])")
[ -n "$PLAN_ID" ] && pass "Created plan $PLAN_ID" || fail "Plan creation failed"

# ── 5. Get plan ──
step "Get plan"
GET_PLAN_RESP=$(curl -s "$BASE/api/plans/$PLAN_ID")
echo "$GET_PLAN_RESP" | python3 -m json.tool > /dev/null 2>&1 || fail "Get plan response is not valid JSON"
GOT_NAME=$(echo "$GET_PLAN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['name'])")
[ "$GOT_NAME" = "E2E Test Plan" ] && pass "Plan name matches" || fail "Expected 'E2E Test Plan', got '$GOT_NAME'"

# ── 6. Chat — create artifacts via AI ──
step "Chat (create artifacts)"
CHAT_RESP=$(curl -s -X POST "$BASE/api/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"plan_id\": \"$PLAN_ID\",
    \"message\": \"Build a 10% commission on all closed-won deals over 50000\"
  }")
echo "$CHAT_RESP" | python3 -m json.tool > /dev/null 2>&1 || fail "Chat response is not valid JSON"
CONV_ID=$(echo "$CHAT_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['conversation_id'])")
ARTIFACT_COUNT=$(echo "$CHAT_RESP" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['current_artifacts']))")
[ "$ARTIFACT_COUNT" -ge 1 ] && pass "Chat created $ARTIFACT_COUNT artifact(s), conversation=$CONV_ID" || fail "No artifacts created"

# ── 7. Execute single artifact ──
step "Execute single artifact"
FIRST_ART_ID=$(echo "$CHAT_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['current_artifacts'][0]['artifact_id'])")
EXEC_ART_RESP=$(curl -s -X POST "$BASE/api/execute" \
  -H "Content-Type: application/json" \
  -d "{\"artifact_id\": \"$FIRST_ART_ID\"}")
echo "$EXEC_ART_RESP" | python3 -m json.tool > /dev/null 2>&1 || fail "Execute artifact response is not valid JSON"
EXEC_ERROR=$(echo "$EXEC_ART_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('error') or '')")
[ -z "$EXEC_ERROR" ] && pass "Artifact $FIRST_ART_ID executed successfully" || fail "Artifact execution error: $EXEC_ERROR"

# ── 8. Conversation persistence ──
step "Conversation persistence"
CONV_RESP=$(curl -s "$BASE/api/conversations/$CONV_ID")
echo "$CONV_RESP" | python3 -m json.tool > /dev/null 2>&1 || fail "Conversation response is not valid JSON"
MSG_COUNT=$(echo "$CONV_RESP" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['messages']))")
[ "$MSG_COUNT" -ge 2 ] && pass "Conversation has $MSG_COUNT messages (user + assistant)" || fail "Expected >=2 messages, got $MSG_COUNT"

# ── 9. Multi-turn chat ──
step "Multi-turn chat (same conversation)"
CHAT2_RESP=$(curl -s -X POST "$BASE/api/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"plan_id\": \"$PLAN_ID\",
    \"conversation_id\": \"$CONV_ID\",
    \"message\": \"Add a column showing each rep's department\"
  }")
echo "$CHAT2_RESP" | python3 -m json.tool > /dev/null 2>&1 || fail "Multi-turn chat response is not valid JSON"
CONV2_ID=$(echo "$CHAT2_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['conversation_id'])")
[ "$CONV2_ID" = "$CONV_ID" ] && pass "Same conversation ID preserved" || fail "Conversation ID changed: $CONV2_ID != $CONV_ID"

CONV2_RESP=$(curl -s "$BASE/api/conversations/$CONV_ID")
MSG2_COUNT=$(echo "$CONV2_RESP" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['messages']))")
[ "$MSG2_COUNT" -ge 4 ] && pass "Conversation now has $MSG2_COUNT messages" || fail "Expected >=4 messages, got $MSG2_COUNT"

# ── 10. List conversations for plan ──
step "List conversations"
LIST_RESP=$(curl -s "$BASE/api/plans/$PLAN_ID/conversations")
CONV_COUNT=$(echo "$LIST_RESP" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")
[ "$CONV_COUNT" -ge 1 ] && pass "Plan has $CONV_COUNT conversation(s)" || fail "No conversations found"

# ── 11. Plan preview ──
step "Plan preview"
PREVIEW_RESP=$(curl -s "$BASE/api/plans/$PLAN_ID/preview")
echo "$PREVIEW_RESP" | python3 -m json.tool > /dev/null 2>&1 || fail "Preview response is not valid JSON"
COMPOSED=$(echo "$PREVIEW_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print('WITH' in d['composed_sql'])")
[ "$COMPOSED" = "True" ] && pass "Composed SQL uses WITH/CTE" || pass "Composed SQL is a single query (no CTEs needed)"
ROW_COUNT=$(echo "$PREVIEW_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['result']['row_count'])")
echo "  Preview returned $ROW_COUNT rows"

# ── Done ──
echo -e "\n${GREEN}${BOLD}All tests passed.${RESET}"
