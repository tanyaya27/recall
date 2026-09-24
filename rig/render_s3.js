const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctx.newPage(); fs.mkdirSync('shots/s3', { recursive: true });
  const only = process.argv[2];
  for (const f of fs.readdirSync('mock').filter((f) => f.startsWith('s3_') && f.endsWith('.html') && (!only || f.includes(only))).sort()) {
    await p.goto('file://' + path.resolve('mock', f)); await p.waitForLoadState('load'); await p.waitForTimeout(120);
    await p.screenshot({ path: 'shots/s3/' + f.replace('.html', '.png') });
  }
  await b.close();
})();
