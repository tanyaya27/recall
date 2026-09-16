const { chromium } = require('playwright'); const http = require('http'); const fs = require('fs'); const path = require('path');
const PORT = 8793; const root = '/home/claude/rig/out';
const server = http.createServer((q, s) => { const f = path.join(root, q.url.split('?')[0] === '/' ? 'index.html' : q.url.split('?')[0]); fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, { 'content-type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : 'text/html' }); s.end(d); }); });
(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen');
  await page.evaluate(() => localStorage.setItem('recall-ai-config', JSON.stringify({ provider: 'anthropic', apiKey: 'sk-rig', model: '' })));
  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen');
  const mk = (l, c) => page.evaluate(([l, c]) => { const cv = document.createElement('canvas'); cv.width = 1200; cv.height = 900; const g = cv.getContext('2d'); g.fillStyle = c; g.fillRect(0, 0, 1200, 900); return { photo: cv.toDataURL('image/jpeg', 0.7), thumb: cv.toDataURL('image/jpeg', 0.7) }; }, [l, c]);
  const DEV = await page.evaluate(() => localStorage.getItem('recall-device-id'));
  const now = Date.now(), D = 86400000; const p1 = await mk('a', '#5b7f9a'), p2 = await mk('b', '#6b8f6b');
  await page.evaluate((s) => window.__rig.seed(s), [
    { id: 'i1', kind: 'item', household: 'default', name: 'glasses', location: 'Kitchen counter', restingOn: 'on a table', ...p1, thumbV: 2, order: now, createdAt: now, lastSeenAt: now, logId: 'l', photoCount: 1, visibility: 'private', owner: DEV },
    { id: 's1', kind: 'snap', itemId: 'i1', logId: 'l', ...p1, location: 'Kitchen counter', at: now },
    { id: 's2', kind: 'snap', itemId: 'i1', logId: 'o', ...p2, location: 'Sofa', at: now - 2 * D },
  ]);
  await page.waitForTimeout(300);
  for (const scale of ['1', '1.38']) {
    await page.evaluate((s) => document.documentElement.style.setProperty('--scale', s), scale);
    await page.click('.tile'); await page.waitForSelector('.thing'); await page.click('.sw-row >> nth=2 >> .sw'); await page.waitForTimeout(300);
    const rows = await page.evaluate(() => {
      const mid = (el) => { const r = el.getBoundingClientRect(); return Math.round((r.top + r.bottom) / 2 * 10) / 10; };
      const out = {};
      out.title = { chev: mid(document.querySelector('.thing-head .chev')), name: mid(document.querySelector('.thing-head .name')), lock: mid(document.querySelector('.thing-head .lk')) };
      const r2 = document.querySelector('.thing-head .row2'); out.row2 = { pin: mid(r2.querySelector('svg')), place: mid(r2.querySelector('b')) };
      out.switches = Array.from(document.querySelectorAll('.sw-row')).map((r) => ({ icon: mid(r.querySelector('svg')), text: mid(r.querySelector('.lab')), small: r.querySelector('small') ? mid(r.querySelector('small')) : null, sw: mid(r.querySelector('.sw')) }));
      const dr = document.querySelector('.dotsrow'); out.dots = { dots: mid(dr.querySelector('.dots')), cnt: mid(dr.querySelector('.cnt')) };
      const w = document.querySelector('.was:not(.empty)'); out.was = { pin: mid(w.querySelector('svg')), text: mid(w.querySelector('span')), pinLeft: Math.round(w.querySelector('svg').getBoundingClientRect().left), titlePinLeft: Math.round(r2.querySelector('svg').getBoundingClientRect().left) };
      return out;
    });
    console.log('scale', scale, JSON.stringify(rows));
    await page.click('.thing-head .chev'); await page.waitForTimeout(300);
  }
  await b.close(); server.close();
})();
