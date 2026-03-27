#!/usr/bin/env bash
# Shared test helpers. Source this from each test file.

BASE="http://localhost:8000"
BOLD="\033[1m"
GREEN="\033[32m"
RED="\033[31m"
CYAN="\033[36m"
RESET="\033[0m"

PASS_COUNT=0
FAIL_COUNT=0

pass() {
    PASS_COUNT=$((PASS_COUNT + 1))
    echo -e "${GREEN}✓ $1${RESET}"
}

fail() {
    FAIL_COUNT=$((FAIL_COUNT + 1))
    echo -e "${RED}✗ $1${RESET}"
    exit 1
}

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

summary() {
    echo -e "\n${GREEN}${BOLD}$PASS_COUNT tests passed.${RESET}"
}
