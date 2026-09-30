#!/bin/bash
# usage: mk.sh name  -> builds /home/claude/indep/name.js from head + common + name_body.js + tail
cd /home/claude/indep
{ cat /home/claude/rig/tiers_head.js; echo "  async function runSuite() {"; cat common.js; cat $1_body.js; echo "  }"; cat tail.js; } > /home/claude/indep/t_$1.js
