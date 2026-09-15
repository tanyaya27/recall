const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  for (const f of fs.readdirSync('mock').filter((f) => (f.startsWith('r7_')||f.startsWith('r7b_')) && f.endsWith('.html')).sort()) {
    await p.goto('file://' + path.resolve('mock', f)); await p.waitForTimeout(150);
    await p.screenshot({ path: 'shots/' + f.replace('.html', '.png'), fullPage: !/3verb/.test(f) });
  }
  await b.close();
})();
