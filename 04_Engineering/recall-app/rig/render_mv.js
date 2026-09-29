// Screenshot mock/mv_*.html at 390x844 @2x → shots_mv/.
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const out = path.join(__dirname, 'shots_mv'); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  for (const f of fs.readdirSync(path.join(__dirname, 'mock')).filter((x) => /^m[vc]_.*\.html$/.test(x)).sort()) {
    await p.goto('file://' + path.join(__dirname, 'mock', f)); await p.waitForTimeout(150);
    await p.screenshot({ path: path.join(out, f.replace('.html', '.png')) }); console.log(f);
  }
  await b.close();
})();
