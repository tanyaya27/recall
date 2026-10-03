// 10-03 usability pass 1 smoke walk, 390x844, normal text.
const pw = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const RIG = '/home/claude/rig';
const PORT = Number(process.env.PORT || 8482); const ROOT = path.join(RIG, 'out');
const server = http.createServer((req, res) => { const f = path.join(ROOT, req.url.split('?')[0] === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); });
const img = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(RIG, 'mock/img', f)).toString('base64');
const OUT = path.join(__dirname, process.env.ENGINE === 'webkit' ? 'shots_wk' : 'shots'); fs.mkdirSync(OUT, { recursive: true });
let AI = { name: 'thing' }; let GUESS = { name: 'Hall table', merged: 'Hall table' }; let GUESS_DELAY = 1200;
const log = (...a) => console.log(...a);
(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await pw.chromium.launch({ args: ['--use-fake-ui-for-media-stream'] });
  const ctx = await browser.newContext({ permissions: ['camera'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
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

  const typeEd = async (s) => { await page.locator('.es textarea').first().fill(''); await page.locator('.es textarea').first().pressSequentially(s, { delay: 20 }); await W(300); };
  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen');
  await page.evaluate(() => { localStorage.clear(); window.__rig.reset(); localStorage.setItem('rig-uid', 'margaret'); localStorage.setItem('rig-anon', '0');
    localStorage.setItem('recall-ai-config', JSON.stringify({ provider: 'anthropic', apiKey: 'sk-ant-rig', model: '' })); });
  await page.evaluate((s) => window.__rig.seed(s, 'recall_users'), [{ id: 'margaret', name: 'Margaret' }]);
  await home();
  // setup: the brochure on the Lab desk, in the Craft room, in the Bedroom; a wallet with no place
  await step('setup', async () => {
    AI = { name: 'Walgreens Photo brochure' }; await tap(LOG, 1000); await shoot('folder.jpg'); await W(800);
    await tap('.ow-input', 500); await snap('a01_E1_place_sheet_empty.png');
    await typeEd('Lab desk with electronics and water'); await snap('a02_E2_typed.png');
    await tap('.es-done', 500); await snap('a03_E4_back_on_camera.png');
    await tap('.ow-go', 700); await tap('.ow-up', 700); await snap('a04_S4_what_is_it_in.png');
    await page.locator('.in-list .wl-search input').pressSequentially('Craft room', { delay: 20 }); await W(300); await tap('.in-list .wl-new', 600);
    await tap('.ow-up', 700); await page.locator('.in-list .wl-search input').pressSequentially('Bedroom', { delay: 20 }); await W(300); await tap('.in-list .wl-new', 600);
    await snap('a05_S1_sheet_levels.png'); await tap('.ow-done', 500); await save(); await W(800);
    AI = { name: 'Black wallet' }; await home(); await tap(LOG, 1000); await shoot('wallet.jpg'); await W(800); await save(); await W(800);
  });
  await step('home', async () => { await home(); await snap('b01_H2_home_badge.png'); });
  await step('page', async () => {
    await openThing('brochure'); await snap('c01_X1_where_folded.png');
    log('where:', (await txt('.tp-blk')).replace(/\n+/g, ' | '));
    await tap('.tp-exp', 400); await snap('c02_X2_where_open.png');
    await tap('.tp-l1 .pp-btn', 400); await snap('c03_T1_bar.png');
    await page.locator('.pp-opt', { hasText: 'under' }).first().click(); await W(700); await snap('c04_T2_toast.png');
    log('after pick:', (await txt('.tp-l1')).replace(/\n+/g, ' '));
    log('lower pills tappable:', await page.locator('.tp-conn .pp-btn').count());
  });
  await step('move', async () => {
    await tap('.tp-btn', 1200); await snap('d01_move_open.png');
    await tap('.ow-input', 500); await typeEd('lab'); await snap('d02_E2_typing_lab.png');
    await tap('.es-cancel', 400); log('after cancel field:', await txt('.ow-input'), '| head:', await txt('.ow-head'));
    await tap('.ow-note', 500); await typeEd('under the blue folder'); await snap('d03_E3_note.png'); await tap('.es-done', 400);
    await snap('d04_E4_note_set.png');
    await tap('.ow-go', 700); await snap('d05_S1_sheet.png');
    await page.locator('.ow-its .pp-btn').first().click(); await W(400); await snap('d06_sheet_word_bar.png'); await page.mouse.click(200, 120); await W(300);
    await page.locator('.ow-lvl-rm').nth(1).click(); await W(400); await snap('d07_S2_remove_confirm.png');
    await tap('.sheet .btn-secondary.amber', 500); await snap('d08_after_remove.png');
    await page.locator('.ow-lvl-rm').first().click(); await W(400); await snap('d09_S3_take_out_confirm.png');
    await tap('.sheet .btn-primary.alt', 400);
    await page.locator('.ow-rn').first().click(); await W(400); await typeEd('Lab desk with electronics'); await snap('d10_R2_rename.png');
    await tap('.es-cancel', 400);
    await tap('.ow-done', 500); await snap('d11_back_after_sheet.png'); await save(); await W(1200);
    log('page after save:', (await txt('.tp-blk')).replace(/\n+/g, ' | '));
    await snap('d12_page_after_save.png');
  });
  await step('guess', async () => {
    GUESS = { name: 'Lab desk with electronics and water bottle', merged: 'Lab desk with electronics and water bottle' };
    await tap('.tp-btn', 1200); await tap('.ow-input', 400); await typeEd('Lab bench'); await tap('.es-done', 400);
    await shoot('real_desk.jpg'); await W(3500); await snap('e01_G1_guess.png');
    await tap('.ow-ai-name', 500); await page.locator('.es textarea').first().fill('Lab desk with electronics'); await W(300); await snap('e02_G2_fix.png');
    await tap('.es-done', 500); await snap('e03_after_use.png');
    log('field:', await txt('.ow-input'));
  });
  await browser.close(); server.close();
})();
