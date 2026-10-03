const { chromium } = require('/home/claude/rig/node_modules/playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  for (const f of ['E1','E2','E3','E4','E5','E6','E7']) { await p.goto('file://' + __dirname + '/' + f + '.html'); await p.waitForTimeout(150); await p.screenshot({ path: __dirname + '/' + f + '.png' }); }
  await b.close(); })();
