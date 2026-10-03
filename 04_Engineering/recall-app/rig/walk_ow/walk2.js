// Task 2: Margaret's first day, 375x667, Largest text, empty house.
const pw = require('/home/claude/rig/node_modules/playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const RIG = '/home/claude/rig';
const PORT = Number(process.env.PORT || 8482); const ROOT = path.join(RIG, 'out');
const server = http.createServer((req, res) => { const f = path.join(ROOT, req.url.split('?')[0] === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); });
const img = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(RIG, 'mock/img', f)).toString('base64');
const OUT = path.join(__dirname, 'small'); fs.mkdirSync(OUT, { recursive: true });
let AI = { name: 'thing' }; let GUESS = { name: 'Hall table', merged: 'Hall table' }; let GUESS_DELAY = 1200;
const log = (...a) => console.log(...a);
(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await pw.chromium.launch({ args: ['--use-fake-ui-for-media-stream'] });
  const ctx = await browser.newContext({ permissions: ['camera'], viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => { const c = document.createElement('canvas'); c.width = 960; c.height = 1280; const g = c.getContext('2d'); const im = new Image(); let src = '';
    const paint = () => { if (window.__cam && window.__cam !== src) { src = window.__cam; im.src = src; } g.fillStyle = '#222'; g.fillRect(0, 0, c.width, c.height);
      if (im.complete && im.naturalWidth) { const s = Math.max(c.width / im.naturalWidth, c.height / im.naturalHeight); const w = im.naturalWidth * s, h = im.naturalHeight * s; g.drawImage(im, (c.width - w) / 2, (c.height - h) / 2, w, h); } };
    setInterval(paint, 60); const md = navigator.mediaDevices || {}; Object.defineProperty(navigator, 'mediaDevices', { value: md, configurable: true }); md.getUserMedia = async () => { paint(); return c.captureStream(15); }; });
  await ctx.route('https://api.anthropic.com/**', async (route) => { const body = JSON.parse(route.request().postData() || '{}'); const content = body.messages?.[0]?.content || [];
    const texts = content.filter((b) => b.type === 'text').map((b) => b.text).join('\n'); const images = content.filter((b) => b.type === 'image').length; let out; let delay = 250;
    if (/PLACE GUESS/.test(texts)) { out = GUESS; delay = GUESS_DELAY; log('  [AI guess asked]'); }
    else if (/NEW PHOTO/.test(texts)) out = { index: -1, sure: false };
    else if (images) out = { name: AI.name, sameAs: '', alternatives: [], restingOn: '', placeCertain: false, placeGuesses: [], description: '', details: '', private: false, privateWhy: '', secretVisible: false };
    else out = { matches: [], message: '' };
    await new Promise((r) => setTimeout(r, delay)); await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [{ type: 'text', text: JSON.stringify(out) }] }) }); });
  const page = await ctx.newPage(); page.setDefaultTimeout(5000); page.on('pageerror', (e) => log('PAGEERR', e.message));
  const W = (ms) => page.waitForTimeout(ms);
  const tap = async (sel, w = 500) => { await page.locator(sel).first().click(); await W(w); };
  const cam = async (f) => { await page.evaluate((s) => { window.__cam = s; }, img(f)); await W(250); };
  const shoot = async (f) => { await cam(f); await tap('.lc-shutter', 900); };
  const txt = (sel) => page.locator(sel).first().innerText().catch(() => '');
  const has = async (sel) => (await page.locator(sel).count()) > 0;
  const snap = async (f, w = 600) => { await W(w); await page.screenshot({ path: path.join(OUT, f) });
    const info = await page.evaluate(() => { const vw = innerWidth, vh = innerHeight; const off = []; document.querySelectorAll('button, input, h1, h2, h3, p, span, label, small, a').forEach((e) => { const r = e.getBoundingClientRect(); if (r.width && r.height && getComputedStyle(e).visibility !== 'hidden' && (r.right > vw + 1 || r.left < -1)) off.push((e.className || e.tagName) + ':' + (e.innerText || '').slice(0, 25)); });
      const clip = []; document.querySelectorAll('button, .tile, .wl-row, .ow-head, .ow-to span, .ow-input').forEach((e) => { if (e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflow !== 'visible') clip.push((e.className || e.tagName) + ':' + (e.innerText || e.value || '').slice(0, 30)); });
      return { hscroll: document.documentElement.scrollWidth > vw, scrollH: document.scrollingElement.scrollHeight, off: off.slice(0, 6), clip: clip.slice(0, 6) }; });
    log('snap', f, JSON.stringify(info)); };
  const home = async () => { await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board, .screen'); await W(500); await page.evaluate(() => { window.__noAuto = true; }); };
  const LOG = '.footer .btn-primary:not(.alt)';
  const typeWhere = async (s) => { await page.locator('.ow-input').click(); await W(150); await page.locator('.ow-input').fill(''); await page.locator('.ow-input').pressSequentially(s, { delay: 25 }); await W(300); };
  const done = async () => { await page.locator('.ow-input').press('Enter'); await W(300); };
  const save = async () => { await tap('.lc-k.sv', 1500); };
  const step = async (name, fn) => { try { await fn(); } catch (e) { log('STEP FAIL', name, e.message.split('\n')[0]); await page.screenshot({ path: path.join(OUT, 'FAIL_' + name + '.png') }); } };
  const findOpen = async (q) => { await home(); await tap('.footer .btn-primary.alt', 500); await page.waitForSelector('.ask'); await page.fill('#ask-input', q); await W(700); };
  const openThing = async (q) => { await findOpen(q); await page.click('.ask .tile >> nth=0'); await page.waitForSelector('.thing-page'); await W(500); };

  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen');
  await page.evaluate(() => { localStorage.clear(); window.__rig.reset(); localStorage.setItem('rig-uid', 'margaret'); localStorage.setItem('rig-anon', '0');
    localStorage.setItem('recall-prefs', JSON.stringify({ size: 'largest' }));
    localStorage.setItem('recall-ai-config', JSON.stringify({ provider: 'anthropic', apiKey: 'sk-ant-rig', model: '' })); });
  await page.evaluate((s) => window.__rig.seed(s, 'recall_users'), [{ id: 'margaret', name: 'Margaret' }]);
  await home(); await snap('s01_home_empty.png');
  log('home text:', (await page.locator('body').innerText()).replace(/\n+/g, ' | ').slice(0, 400));

  await step('setup', async () => {
    AI = { name: 'keys' }; await tap(LOG, 1000); await shoot('keys.jpg'); await W(800); await typeWhere('kitchen counter'); await done(); await save();
    await home(); AI = { name: 'reading glasses' }; await tap(LOG, 1000); await shoot('glasses.jpg'); await W(800); await save();
  });
  await step('guessprobe', async () => {
    await home(); AI = { name: 'wallet' }; await tap(LOG, 1000); await shoot('wallet.jpg'); await W(800);
    await typeWhere('hall table'); await done(); GUESS = { name: 'Wooden table with a lamp', merged: 'Hall table with a lamp' };
    await shoot('real_painting.jpg'); await page.waitForSelector('.ow-ai-use', { timeout: 8000 }); await W(500);
    const r = await page.evaluate(() => { const b = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.bottom)]; };
      const sc = []; let e = document.querySelector('.ow-ai'); while (e) { const cs = getComputedStyle(e); if (/(auto|scroll)/.test(cs.overflowY) && e.scrollHeight > e.clientHeight) sc.push(e.className + ' st=' + e.scrollTop + ' sh=' + e.scrollHeight + ' ch=' + e.clientHeight); e = e.parentElement; }
      return { use: b('.ow-ai-use'), ai: b('.ow-ai'), top: b('.lc-top') || b('.lc-head'), scrollers: sc }; });
    log(' guess geometry', JSON.stringify(r));
    // can she scroll it into view?
    await page.locator('.ow-ai-use').scrollIntoViewIfNeeded().catch(() => {}); await snap('s09b_guess_scrolled.png', 400);
    await tap('.lc-x', 400); if (await has('text=Throw away')) await tap('text=Throw away', 300); if (await has('text=Leave')) await tap('text=Leave', 300);
  });
  await step('pick', async () => {
    await openThing('glasses'); await snap('s29_pick_glasses_page.png');
    await tap('.thing-page button:has-text("Put it somewhere")', 1000); await snap('s30_pick_camera.png');
    log(' head', await txt('.ow-head'), '| val', await page.locator('.ow-input').inputValue());
    await tap('.ow-go', 700); await snap('s31_pick_sheet.png');
    log(' sheet', (await txt('.ow-sheet')).replace(/\n+/g, ' | '));
    await page.locator('.ow-sheet .ow-pick', { hasText: 'Kitchen counter' }).first().scrollIntoViewIfNeeded(); await snap('s32_pick_sheet_scrolled.png', 400);
    await page.locator('.ow-sheet .ow-pick', { hasText: 'Kitchen counter' }).first().click(); await W(500); await snap('s33_pick_done.png');
    log(' head', await txt('.ow-head'));
    await save(); await snap('s33b_pick_saved.png', 900);
    await page.evaluate(() => scrollTo(0, 0)); await snap('s33c_pick_saved_top.png', 300);
  });
  await step('note', async () => {
    await openThing('keys'); await tap('.thing-page button:has-text("Move it")', 1000);
    await tap('.ow-note', 500); await page.fill('.ow-note-in', 'under the blue scarf'); await W(300); await save();
    await page.evaluate(() => scrollTo(0, 0)); await snap('s36b_note_page_top.png', 500);
    log(' note', await txt('.tp-note'));
  });
  await browser.close(); server.close();
})().catch((e) => { console.error(e); process.exit(1); });
