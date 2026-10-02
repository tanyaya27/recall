#!/bin/bash
# usage: run6.sh <body> <port> [webkit]
cd /home/claude/indep
b=$1; port=$2; eng=${3:-chromium}
if [ "$eng" = webkit ]; then TAG=v6/${b}_wk ENGINE=webkit PORT=$port timeout 1200 node -r /home/claude/rig/engine.js t_$b.js > runs6/${b}_webkit.txt 2>&1;
else TAG=v6/$b ENGINE=$eng PORT=$port timeout 1200 node t_$b.js > runs6/${b}_${eng}.txt 2>&1; fi
tail -15 runs6/${b}_${eng}.txt | grep -E "checks passed|FAILED|Page errors|Console errors"
