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

  // Log 1: keys, a place typed
  await step('log1', async () => {
    AI = { name: 'keys' }; await tap(LOG, 1000); await snap('s02_log_camera_open.png');
    await shoot('keys.jpg'); await snap('s03_log1_after_photo.png', 1200);
    log(' head', await txt('.ow-head'), '| to', await txt('.ow-to'), '| top', await txt('.lc-top, .lc-head'));
    await typeWhere('on the kitchen counter'); await snap('s04_log1_typing.png');
    await done(); await snap('s05_log1_done.png');
    await save(); await snap('s06_log1_saved.png', 900);
    log(' after save:', (await page.locator('body').innerText()).replace(/\n+/g, ' | ').slice(0, 300));
  });
  // Log 2: wallet, place typed then photographed
  await step('log2', async () => {
    await home(); AI = { name: 'wallet' }; await tap(LOG, 1000); await shoot('wallet.jpg'); await W(800);
    await typeWhere('hall table'); await done(); await snap('s07_log2_typed.png');
    GUESS = { name: 'Wooden table with a lamp', merged: 'Hall table with a lamp' };
    await shoot('real_painting.jpg'); await snap('s08_log2_looking.png', 100);
    await page.waitForSelector('.ow-ai-use', { timeout: 8000 }); await snap('s09_log2_guess.png');
    log(' ai:', (await txt('.ow-ai')).replace(/\n+/g, ' | '));
    await tap('.ow-ai-no', 400); await snap('s10_log2_notthis.png');
    await save(); await snap('s11_log2_saved.png', 900);
  });
  // Log 3: glasses, nothing
  await step('log3', async () => {
    await home(); AI = { name: 'reading glasses' }; await tap(LOG, 1000); await shoot('glasses.jpg'); await W(800);
    await snap('s12_log3_nothing.png'); await save(); await snap('s13_log3_saved.png', 900);
    await home(); await snap('s14_home_three.png');
    log(' home:', (await page.locator('body').innerText()).replace(/\n+/g, ' | ').slice(0, 400));
  });
  // Find one
  await step('find', async () => {
    await home(); await tap('.footer .btn-primary.alt', 600); await snap('s15_find_open.png');
    await page.fill('#ask-input', 'wallet'); await snap('s16_find_wallet.png', 900);
    await page.click('.ask .tile >> nth=0'); await page.waitForSelector('.thing-page'); await snap('s17_wallet_page.png', 700);
    await page.evaluate(() => scrollTo(0, 99999)); await snap('s17b_wallet_page_bottom.png', 400);
  });
  // Move 1: keys to a place she has (Hall table)
  await step('move1', async () => {
    await openThing('keys'); await tap('.thing-page button:has-text("Move it")', 1000); await snap('s18_move1_rest.png');
    await typeWhere('hall table'); await snap('s19_move1_typing_known.png');
    log(' head', await txt('.ow-head'), '| hint', await txt('.ow-hint'));
    await done(); await snap('s20_move1_done.png'); await save(); await snap('s21_move1_saved.png', 900);
  });
  // Move 2: keys to a new place with a level
  await step('move2', async () => {
    await openThing('keys'); await tap('.thing-page button:has-text("Move it")', 1000);
    await typeWhere('bedside table'); await done(); await snap('s22_move2_new.png');
    await tap('.ow-go', 700); await snap('s23_move2_sheet.png');
    await tap('.ow-up', 600); await snap('s24_move2_level_picker.png');
    await page.fill('.in-list .wl-search input', 'Bedroom'); await W(400); await snap('s25_move2_level_typed.png');
    await tap('.in-list .wl-new', 600); await snap('s26_move2_level_set.png');
    log(' lvls', JSON.stringify(await page.locator('.ow-lvl').allInnerTexts()));
    await tap('.ow-done', 500); await snap('s27_move2_back.png');
    log(' head', await txt('.ow-head'));
    await save(); await snap('s28_move2_saved.png', 900);
  });
  // Open → and pick: glasses to Kitchen counter
  await step('pick', async () => {
    await openThing('glasses'); await tap('.thing-page button:has-text("Move it")', 1000); await snap('s29_pick_rest.png');
    await tap('.ow-go', 700); await snap('s30_pick_sheet.png');
    await page.evaluate(() => { const s = document.querySelector('.ow-sheet .ow-scroll') || document.querySelector('.ow-sheet'); s.scrollTop = 9999; }); await snap('s31_pick_sheet_scrolled.png', 400);
    await page.locator('.ow-sheet .ow-pick', { hasText: 'Kitchen counter' }).first().click(); await W(500); await snap('s32_pick_done.png');
    log(' head', await txt('.ow-head'));
    await save(); await snap('s33_pick_saved.png', 900);
  });
  // Add a note to the keys
  await step('note', async () => {
    await openThing('keys'); await tap('.thing-page button:has-text("Move it")', 1000);
    await tap('.ow-note', 500); await snap('s34_note_open.png');
    await page.fill('.ow-note-in', 'under the blue scarf'); await W(300); await snap('s35_note_typed.png');
    await save(); await snap('s36_note_saved.png', 900);
    await home(); await snap('s37_home_end.png');
    await findOpen('keys'); await snap('s38_find_keys.png', 400);
  });
  await browser.close(); server.close();
})().catch((e) => { console.error(e); process.exit(1); });
