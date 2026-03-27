#!/usr/bin/env bash
# Run all end-to-end test suites.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BOLD="\033[1m"
GREEN="\033[32m"
RED="\033[31m"
RESET="\033[0m"

echo -e "${BOLD}Running all E2E test suites...${RESET}"

SUITES=(
    "tests/test_infrastructure.sh"
    "tests/test_chat_agent.sh"
    "tests/test_clarification.sh"
)

PASSED=0
FAILED=0

for suite in "${SUITES[@]}"; do
    echo -e "\n${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
    if bash "$SCRIPT_DIR/$suite"; then
        PASSED=$((PASSED + 1))
    else
        FAILED=$((FAILED + 1))
        echo -e "${RED}Suite $suite FAILED${RESET}"
    fi
done

echo -e "\n${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
if [ "$FAILED" -eq 0 ]; then
    echo -e "${GREEN}${BOLD}All $PASSED test suites passed.${RESET}"
else
    echo -e "${RED}${BOLD}$FAILED suite(s) failed out of $((PASSED + FAILED)).${RESET}"
    exit 1
fi
