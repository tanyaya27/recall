const { chromium } = require('playwright'); const http = require('http'); const fs = require('fs'); const path = require('path');
const PORT = 8792; const root = '/home/claude/rig/out';
const server = http.createServer((q, s) => { const f = path.join(root, q.url.split('?')[0] === '/' ? 'index.html' : q.url.split('?')[0]); fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, { 'content-type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : 'text/html' }); s.end(d); }); });
(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const ctx = await browser.newContext({ permissions: ['camera'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.route('https://api.anthropic.com/**', async (route) => { const body = JSON.parse(route.request().postData() || '{}'); const content = body.messages?.[0]?.content || []; const isLike = content.some((b) => b.type === 'text' && /"same":/.test(b.text)); const isSame = !isLike && content.some((b) => b.type === 'text' && /NEW PHOTO/.test(b.text)); const text = JSON.stringify(isLike ? { same: true, seen: '' } : isSame ? { index: -1, sure: false } : { name: 'blue mug', description: 'ceramic', location: '', placeGuesses: ['Kitchen counter', 'Bedside table'] }); await new Promise((r) => setTimeout(r, 200)); await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [{ type: 'text', text }] }) }); });
  const page = await ctx.newPage(); page.on('pageerror', (e) => console.log('ERR', e.message));
  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen');
  await page.evaluate(() => { localStorage.setItem('recall-ai-config', JSON.stringify({ provider: 'anthropic', apiKey: '', model: '' })); localStorage.removeItem('recall-prefs'); });
  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen');
  const mk = (label, color, w, h) => page.evaluate(([label, color, w, h]) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.fillStyle = color; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = `bold ${Math.round(h / 8)}px sans-serif`; g.textAlign = 'center'; g.fillText(label, w / 2, h / 2); return { photo: c.toDataURL('image/jpeg', 0.7), thumb: c.toDataURL('image/jpeg', 0.7) }; }, [label, color, w, h]);
  const DEV = await page.evaluate(() => localStorage.getItem('recall-device-id'));
  const now = Date.now(), H = 3600000, D = 86400000;
  const pG = await mk('glasses', '#5b7f9a', 1200, 900), pG2 = await mk('glasses wide', '#4a6d86', 1200, 900), pK = await mk('keys', '#8a6d4a', 900, 1200), pS = await mk('soda', '#4a8a6d', 1200, 900), pP = await mk('pills', '#7a8ea0', 900, 900);
  const plc = await mk('counter', '#6b8faa', 900, 900), plc2 = await mk('drawer', '#9a7a5a', 900, 900);
  await page.evaluate((s) => window.__rig.seed(s), [
    { id: 'i1', kind: 'item', household: 'default', name: 'Grandmother\'s reading glasses with the tortoiseshell frames', location: 'Kitchen counter', restingOn: 'on a wooden table', ...pG, thumbV: 2, order: now - 5 * D, createdAt: now - 5 * D, lastSeenAt: now - 2 * H, logId: 'log_a', photoCount: 2, visibility: 'private', owner: DEV,
      history: [{ location: 'Kitchen counter', at: now - 2 * H }, { location: 'Sofa', at: now - 2 * D }] },
    { id: 's1b', kind: 'snap', itemId: 'i1', logId: 'log_a', ...pG2, location: 'Kitchen counter', at: now - 2 * H + 1, extra: true },
    { id: 'i2', kind: 'item', household: 'default', name: 'keys', location: 'Hall table', ...pK, thumbV: 2, order: now - D, createdAt: now - D, lastSeenAt: now - D, logId: 'log_b', photoCount: 1 },
    { id: 'i3', kind: 'item', household: 'default', name: 'sparkling soda', location: '', ...pS, thumbV: 2, order: now - H, createdAt: now - H, lastSeenAt: now - H, logId: 'log_c', photoCount: 1 },
    { id: 'i4', kind: 'item', household: 'default', name: 'my pills', location: '', ...pP, thumbV: 2, order: now - 3 * H, createdAt: now - 3 * H, lastSeenAt: now - 3 * H, logId: 'log_d', photoCount: 1, visibility: 'private', owner: DEV },
    { id: 's1c', kind: 'snap', itemId: 'i1', logId: 'log_old', ...pG2, location: 'Living room sofa, left cushion', at: now - 2 * D },
    { id: 's1d', kind: 'snap', itemId: 'i1', logId: 'log_older', ...pP, location: 'Bedside table', at: new Date(2024, 8, 5, 9, 41).getTime() },
    { id: 'p1', kind: 'place', household: 'default', name: 'Kitchen counter', order: 1, createdAt: now - 9 * D, photos: [{ ...plc, at: now - 9 * D }, { ...plc2, at: now - 8 * D }] },
    { id: 'p2', kind: 'place', household: 'default', name: 'Bedside table', order: 2, createdAt: now - 9 * D, photos: [] },
  ]);
  await page.waitForTimeout(400);
  const S = async (n) => { await page.waitForTimeout(250); await page.screenshot({ path: `shots/r7f-${n}.png` }); };
  await S('grid');
  await page.click('.tile >> nth=0'); await page.waitForSelector('.thing'); await S('thing-private');
  const css = (t) => page.evaluate((t) => { let el = document.getElementById('variant'); if (!el) { el = document.createElement('style'); el.id = 'variant'; document.head.appendChild(el); } el.textContent = t; }, t);
  await css('.thing-head { background: var(--card); border-radius: var(--radius); box-shadow: var(--shadow); padding: 0.5rem 0.625rem 0.625rem; margin-bottom: 0.625rem; } .thing-head .row2 { padding-left: 0.25rem; }'); await S('title-B');
  await css('.thing-head .row2 { background: var(--accent-soft); border-radius: 0.625rem; padding: 0.375rem 0.625rem; margin-top: 0.375rem; }'); await S('title-C');
  await css('.thing-head { background: var(--card); border-radius: var(--radius); box-shadow: var(--shadow); padding: 0.5rem 0.625rem 0; margin-bottom: 0.625rem; overflow: hidden; } .thing-head .row2 { background: var(--accent-soft); margin: 0.375rem -0.625rem 0; padding: 0.375rem 0.875rem; }'); await S('title-D');
  await css('');
  await page.click('.act:has-text("Edit")'); await page.waitForTimeout(200); await page.evaluate(() => window.scrollTo(0, 400)); await S('edit-tidy-row');
  await page.click('.fix .field-value >> nth=1'); await page.waitForSelector('.place-sheet'); await S('place-picker'); await page.click('.place-sheet .btn-primary.alt'); await page.waitForTimeout(200);
  await page.click('.tidy-btn'); await page.waitForSelector('.sheet'); await S('tidy-sheet'); await page.click('.sheet .btn-primary.alt'); await page.waitForTimeout(200);
  await page.click('.act:has-text("Done")'); await page.evaluate(() => window.scrollTo(0, 0));
  await page.click('.sw-row >> nth=2 >> .sw'); await page.waitForTimeout(300); await page.click('.dot >> nth=2'); await page.waitForTimeout(700); await S('thing-earlier'); await page.click('.dot >> nth=3'); await page.waitForTimeout(700); await S('thing-oldest');
  await page.evaluate(() => { document.documentElement.style.setProperty('--scale', '1.38'); }); await page.waitForTimeout(300); await S('thing-largest');
  await page.evaluate(() => { document.documentElement.style.setProperty('--scale', '1'); });
  await page.click('.thing-head .chev'); await page.waitForTimeout(300);
  await page.click('.tile >> nth=1'); await page.waitForSelector('.thing'); await S('thing-shared');
  await page.click('.act:has-text("Edit")'); await S('thing-edit'); await page.click('.act:has-text("Done")');
  await page.click('.sw-row >> nth=0 >> .sw'); await S('thing-toast-private');
  await page.click('.thing-head .chev'); await page.waitForTimeout(300);
  // dark theme card
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dusk'; });
  await S('grid-dusk'); await page.click('.tile >> nth=0'); await page.waitForSelector('.thing'); await S('thing-private-dusk'); await page.click('.thing-head .chev'); await page.waitForTimeout(300);
  await page.evaluate(() => { document.documentElement.dataset.theme = 'linen'; });
  // where is it? modes
  await page.click('.footer .btn-primary >> nth=0'); await page.waitForSelector('.camera'); await page.waitForTimeout(400); await page.click('.shutter'); await page.waitForTimeout(250); await page.click('.camera-done');
  await page.waitForSelector('.photo-card'); await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo(0, 260)); await S('where-small');
  await page.click('.view-links .link-btn:has-text("Bigger photos")'); await page.evaluate(() => window.scrollTo(0, 260)); await S('where-big');
  await page.click('.view-links .link-btn:has-text("Names only")'); await page.evaluate(() => window.scrollTo(0, 260)); await S('where-names');
  await page.click('.header .back'); await page.waitForTimeout(300);
  // locations
  await page.click('.menu-btn'); await page.waitForSelector('.drawer'); await S('drawer');
  await page.click('.drawer-row >> nth=1'); await page.waitForSelector('.loc-row'); await S('locations');
  await page.click('.loc-row >> nth=0'); await page.waitForSelector('.place-photos'); await S('place');
  await page.click('.btn-secondary.amber'); await page.waitForSelector('.sheet'); await S('place-remove');
  await browser.close(); server.close();
})();
