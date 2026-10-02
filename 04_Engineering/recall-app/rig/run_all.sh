#!/bin/bash
# 10-01 (release 1): the tier-camera suites (where, f3, tiers, pick, card, chain, row) are retired to rig/retired/ — the camera they drove is gone.
# 09-30 (TESTING.md): every suite, in batches that fit the container's memory, then a one-line summary per suite.
# ./build.sh first. Results in /tmp/runs/<suite>.txt; the summary in /tmp/runs/SUMMARY.txt.
cd /home/claude/rig
mkdir -p /tmp/runs; rm -f /tmp/runs/*.txt
cat tiers_head.js probe_cap_body.js > probe_cap.js 2>/dev/null
cat tiers_head.js journeys_body.js > journeys.js
cat tiers_head.js monkey_body.js > monkey.js; cat tiers_head.js realhouse_body.js > realhouse_suite.js; cat tiers_head.js p30d_body.js > audit_p30d.js; cat tiers_head.js r1_body.js > audit_r1.js
run() { local name=$1; shift; ( "$@" > /tmp/runs/$name.txt 2>&1 ); }
# batch 1: the plain suites (own ports)
for s in audit audit_roles audit_graph audit_label audit_private audit_d; do run $s node $s.js & done; wait
# batches 2-5: browser-heavy, three at a time
PORT=8602 run cap node probe_cap.js & PORT=8740 run r1 node audit_r1.js & wait
PORT=8620 run journeys node journeys.js & PORT=8640 run realhouse node realhouse_suite.js & wait
SEED=${SEED1:-101} STEPS=40 PORT=8630 run monkey1 node monkey.js & SEED=${SEED2:-303} STEPS=40 PORT=8631 run monkey2 node monkey.js & PORT=8701 run p30d node audit_p30d.js & wait
# batch 6: Safari's engine on the camera suites
ENGINE=webkit PORT=8653 run wk_cap node -r ./engine.js probe_cap.js & wait
ENGINE=webkit PORT=8654 run wk_p30d node -r ./engine.js audit_p30d.js & ENGINE=webkit PORT=8656 run wk_r1 node -r ./engine.js audit_r1.js & wait
for f in /tmp/runs/*.txt; do n=$(basename $f .txt); [ "$n" = SUMMARY ] && continue; echo "$n: $(grep -E '[0-9]+/[0-9]+ (checks )?passed' $f | tail -1)"; done > /tmp/runs/SUMMARY.txt
cat /tmp/runs/SUMMARY.txt
