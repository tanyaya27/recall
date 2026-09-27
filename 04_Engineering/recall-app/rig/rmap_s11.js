const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1200, height: 860 }, deviceScaleFactor: 2 })).newPage();
  for (const f of ['s11_map_now', 's11_map_new']) { await p.goto('file://' + path.resolve('mock', f + '.html')); await p.waitForTimeout(150); await p.screenshot({ path: 'shots/s11/' + f + '.png' }); }
  await b.close(); })();
