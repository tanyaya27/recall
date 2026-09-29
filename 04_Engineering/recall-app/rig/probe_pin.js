// probe_pin.js — open "Move it" and dump the geometry of the sentence line (pin vs text) + prompt position, both looks.
const { chromium } = require('playwright'); const http = require('http'); const fs = require('fs'); const path = require('path');
const PORT = 8794; const root = path.join(__dirname, 'out');
const server = http.createServer((q, s) => { const f = path.join(root, q.url.split('?')[0] === '/' ? 'index.html' : q.url.split('?')[0]); fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, { 'content-type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : 'text/html' }); s.end(d); }); });
const img = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(__dirname, 'mock/img', f)).toString('base64');
(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const b = await chromium.launch({ args: ['--use-fake-ui-for-media-stream'] });
  const ctx = await b.newContext({ permissions: ['camera'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => { const c = document.createElement('canvas'); c.width = 960; c.height = 1280; const g = c.getContext('2d'); setInterval(() => { g.fillStyle = '#3a3f44'; g.fillRect(0, 0, 960, 1280); }, 60);
    const md = navigator.mediaDevices || {}; Object.defineProperty(navigator, 'mediaDevices', { value: md, configurable: true }); md.getUserMedia = async () => c.captureStream(15); });
  await ctx.route('https://api.anthropic.com/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [{ type: 'text', text: '{}' }] }) }));
  const page = await ctx.newPage();
  for (const look of (process.argv[2] || 'b,a').split(',')) {
    await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen');
    await page.evaluate((look) => { localStorage.clear(); window.__rig.reset(); localStorage.setItem('rig-uid', 'margaret'); localStorage.setItem('rig-anon', '0');
      localStorage.setItem('recall-ai-config', JSON.stringify({ provider: 'anthropic', apiKey: 'sk-ant-rig', model: '' })); localStorage.setItem('recall-prefs', JSON.stringify({ cameraLook: look })); }, look);
    await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen');
    const now = Date.now();
    await page.evaluate((s) => window.__rig.seed(s), [
      { id: 'kc1', kind: 'item', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [], name: 'spare batteries', location: 'Kitchen counter', photo: img('real_desk.jpg'), thumb: img('real_desk.jpg'), thumbV: 2, order: now, createdAt: now, lastSeenAt: now, logId: 'l', photoCount: 1, history: [] },
      { id: 'pl1', kind: 'place', owner: 'margaret', by: 'margaret', private: false, name: 'Kitchen counter', order: now, createdAt: now, parent: null, photos: [{ photo: img('closet.jpg'), thumb: img('closet.jpg'), at: now }] },
      { id: 'pl5', kind: 'place', owner: 'margaret', by: 'margaret', private: false, name: 'Craft nook', order: now - 1, createdAt: now - 1, parent: null, photos: [{ photo: img('real_slippers.jpg'), thumb: img('real_slippers.jpg'), at: now }] },
    ]);
    await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board'); await page.waitForTimeout(400);
    await page.click('.tile:has-text("Spare batteries")'); await page.waitForTimeout(600); await page.click('button:has-text("Move it")'); await page.waitForTimeout(1000);
    for (const sc of ['1', '1.38']) {
      await page.evaluate((v) => document.documentElement.style.setProperty('--scale', v), sc); await page.waitForTimeout(250);
      const g = await page.evaluate(() => { const R = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.top * 10) / 10, Math.round(r.bottom * 10) / 10, Math.round(r.height * 10) / 10]; };
        const bb = document.querySelector('.lc-say .l1 > b'); const cs = getComputedStyle(bb);
        return { l1: R(document.querySelector('.lc-say .l1')), pinSpan: R(document.querySelector('.lc-say .lc-pin')), svg: R(document.querySelector('.lc-say .lc-pin svg')), b: R(bb), font: cs.fontSize + '/' + cs.lineHeight + ' ' + cs.fontFamily.slice(0, 40), prompt: R(document.querySelector('.lc-prompt')), promptParent: document.querySelector('.lc-prompt').parentElement.className }; });
      console.log(look, sc, JSON.stringify(g));
      await page.screenshot({ path: `/tmp/claude-0/probe-${look}-${sc}.png` });
    }
    await page.evaluate(() => document.documentElement.style.setProperty('--scale', '1'));
  }
  await b.close(); server.close();
})();
