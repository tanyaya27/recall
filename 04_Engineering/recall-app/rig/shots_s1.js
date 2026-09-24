// MVP step 1 review shots (2026-09-24): the first-run line options, the Settings AI card.
const { chromium } = require('playwright'); const http = require('http'); const fs = require('fs'); const path = require('path');
const PORT = 8096; const ROOT = path.join(__dirname, 'out');
const server = http.createServer((req, res) => { const f = path.join(ROOT, req.url.split('?')[0] === '/' ? 'index.html' : req.url.split('?')[0]); if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); });
const OPTS = {
  A: { html: 'Photograph something you often look for — glasses, keys, wallet, anything.' },
  B: { html: 'Put something down? Take a photo of it there.<br>Ask for it later.' },
  C: { html: '<b style="color:var(--ink);display:block;font-size:1.3125rem;margin-bottom:0.375rem">Take a photo of where you put something.</b>Later, tap <b>Find item</b> and ask for it.' },
};
(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const b = await chromium.launch(); fs.mkdirSync('shots/s1', { recursive: true });
  for (const size of ['normal', 'largest']) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await ctx.route('https://api.anthropic.com/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [{ type: 'text', text: '{"ok":true}' }] }) }));
    const p = await ctx.newPage();
    await p.goto(`http://localhost:${PORT}/`); await p.evaluate((sz) => { localStorage.clear(); localStorage.setItem('recall-prefs', JSON.stringify({ size: sz })); }, size);
    await p.goto(`http://localhost:${PORT}/`); await p.waitForSelector('.card .empty'); await p.waitForTimeout(300);
    for (const [k, o] of Object.entries(OPTS)) { await p.evaluate((h) => { document.querySelector('.card .empty').innerHTML = h; }, o.html); await p.waitForTimeout(100); await p.screenshot({ path: `shots/s1/first_${k}_${size}.png` }); }
    await p.goto(`http://localhost:${PORT}/`); await p.waitForSelector('.screen'); await p.click('.tiny'); await p.waitForSelector('.settings');
    await p.locator('.group-title:has-text("AI")').scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, -20));
    await p.click('.settings .btn-secondary:has-text("Check it works")'); await p.waitForSelector('.key-ok'); await p.evaluate(() => { const t = [...document.querySelectorAll('.group-title')].find((e) => e.textContent.trim() === 'AI'); t.scrollIntoView({ block: 'start' }); window.scrollBy(0, -70); }); await p.waitForTimeout(200);
    await p.screenshot({ path: `shots/s1/settings_ai_${size}.png` });
    await p.click('.link-btn:has-text("Use my own AI key")'); await p.waitForTimeout(200);
    await p.screenshot({ path: `shots/s1/settings_ownkey_${size}.png` });
    await ctx.close();
  }
  await b.close(); server.close();
})();
