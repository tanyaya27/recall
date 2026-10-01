#!/bin/bash
cd /home/claude/indep
{ cat /home/claude/rig/tiers_head.js; echo "  async function runSuite() {"; cat common.js; cat tlib.js; cat $1_body.js; echo "  }"; cat tail.js; } > /home/claude/indep/t_$1.js
