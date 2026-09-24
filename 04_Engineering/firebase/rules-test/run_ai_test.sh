#!/bin/bash
# MVP step 1 (2026-09-24): the ai callable on the real emulators (auth + functions + firestore).
# Writes throwaway emulator-only settings (a FAKE key and tiny limits), runs test_ai.mjs, removes them.
# Run from 04_Engineering/firebase:  ./rules-test/run_ai_test.sh   (after `cd rules-test && npm install` once)
set -e
cd "$(dirname "$0")/.."
echo 'ANTHROPIC_KEY=sk-ant-test-not-real' > functions/.secret.local
printf 'AI_DAILY_PER_PERSON=2\nAI_DAILY_TOTAL=5\n' > functions/.env.local
trap 'rm -f functions/.secret.local functions/.env.local' EXIT
./rules-test/node_modules/.bin/firebase emulators:exec --config firebase.test.json --only functions,firestore,auth --project recall-test "cd rules-test && node test_ai.mjs" 2>&1 | grep -E "^(PASS|FAIL)|passed|FAILED|Error"
