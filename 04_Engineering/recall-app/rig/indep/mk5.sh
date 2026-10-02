#!/bin/bash
cd /home/claude/indep
{ sed "s#await require('./legacy_flow.js')(ctx);##" /home/claude/rig/tiers_head.js; echo "  async function runSuite() {"; cat common.js; cat tlib.js; cat flib.js; cat rlib.js; cat v3lib.js; cat $1_body.js; echo "  }"; cat tail.js; } > /home/claude/indep/t_$1.js
