const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  for (const f of ['s11_p1', 's11_p3']) { await p.goto('file://' + path.resolve('mock', f + '.html')); await p.waitForTimeout(150);
    await p.evaluate(() => { document.documentElement.style.height = 'auto'; document.body.style.height = 'auto'; document.body.style.overflow = 'visible'; const g = document.querySelector('.pg'); g.style.position = 'relative'; g.style.overflow = 'visible'; });
    await p.screenshot({ path: 'shots/s11/' + f + '_full.png', fullPage: true }); }
  await b.close(); })();
