#!/usr/bin/env bash
# Tests: clarification questions, persistence on refresh, answering clears questions
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/helpers.sh"

echo -e "${BOLD}=== Clarification Tests ===${RESET}"

# ── Vague request triggers clarification ──
step "Vague request triggers clarification"
debug "Sending: Build a commission plan"
CLARIFY_RESP=$(curl -s -X POST "$BASE/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "Build a commission plan"}')
check_json "$CLARIFY_RESP" "Clarification chat"

CONV_ID=$(echo "$CLARIFY_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['conversation_id'])")
pass "Got conversation $CONV_ID"

HAS_QUESTIONS=$(echo "$CLARIFY_RESP" | python3 -c "
import sys, json
qs = json.load(sys.stdin).get('pending_questions') or []
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
    debug "LLM proceeded without clarification (acceptable — used defaults)"
fi

# ── Questions persisted in conversation (refresh resilience) ──
step "Questions persisted in conversation"
CONV_CHECK=$(curl -s "$BASE/api/conversations/$CONV_ID")
check_json "$CONV_CHECK" "Get conversation"

HAS_PERSISTED=$(echo "$CONV_CHECK" | python3 -c "
import sys, json
qs = json.load(sys.stdin).get('pending_questions') or []
print(len(qs) > 0)
")

if [ "$HAS_QUESTIONS" = "True" ]; then
    [ "$HAS_PERSISTED" = "True" ] && pass "Questions persisted (survives refresh)" || fail "Questions not persisted"
else
    pass "No questions to persist"
fi

# ── Answer clarification ──
step "Answer clarification"
if [ "$HAS_QUESTIONS" = "True" ]; then
    debug "Sending: 10% on all closed-won deals, no threshold, no accelerator"
    ANSWER_RESP=$(curl -s -X POST "$BASE/api/chat" \
      -H "Content-Type: application/json" \
      -d "{
        \"conversation_id\": \"$CONV_ID\",
        \"message\": \"10% commission on all closed-won deals, no threshold, no accelerator\"
      }")
    check_json "$ANSWER_RESP" "Answer chat"

    ART_COUNT=$(echo "$ANSWER_RESP" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['current_artifacts']))")
    [ "$ART_COUNT" -ge 1 ] && pass "After answering: $ART_COUNT artifact(s)" || fail "No artifacts after answer"

    CLEARED=$(echo "$ANSWER_RESP" | python3 -c "
import sys, json
print(json.load(sys.stdin).get('pending_questions') is None)
")
    [ "$CLEARED" = "True" ] && pass "Pending questions cleared" || debug "Questions still present"

    HAS_PLAN=$(echo "$ANSWER_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('plan') is not None)")
    [ "$HAS_PLAN" = "True" ] && pass "Plan created after answering" || debug "No plan yet (may need another turn)"
else
    pass "Skipped (no clarification was needed)"
fi

summary
