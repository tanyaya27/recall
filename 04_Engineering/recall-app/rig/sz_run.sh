#!/bin/bash
# usage: sz_run.sh OPT1 OPT2  (two browsers at once)
cd /home/claude/rig && cat tiers_head.js shutter_sz_body.js | sed 's/deviceScaleFactor: 2/deviceScaleFactor: 3/' > shutter_sz.js
OPT=$1 PORT=8741 timeout 200 node shutter_sz.js > logs/sz_$1.log 2>&1 &
[ -n "$2" ] && OPT=$2 PORT=8742 timeout 200 node shutter_sz.js > logs/sz_$2.log 2>&1 &
wait; grep -h -E "FATAL|Error|promptC|fly" logs/sz_$1.log logs/sz_$2.log 2>/dev/null | head
