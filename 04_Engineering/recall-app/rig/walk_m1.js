// 10-02 fresh-eyes walk of 20261001a: Margaret's first day in an EMPTY house, then Ravi's Walgreens sequence.
const { chromium, webkit } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const PORT = 8431; const ROOT = path.join(__dirname, 'out');
const server = http.createServer((req, res) => { const f = path.join(ROOT, req.url.split('?')[0] === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); });
const img = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(__dirname, 'mock/img', f)).toString('base64');
const OUT = path.join(__dirname, 'shots_walk'); fs.mkdirSync(OUT, { recursive: true });
let AI = { name: 'thing' };
(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const W = Number(process.env.W || 390), H = Number(process.env.H || 844);
  const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream'] });
  const ctx = await browser.newContext({ permissions: ['camera'], viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => { const c = document.createElement('canvas'); c.width = 960; c.height = 1280; const g = c.getContext('2d'); const im = new Image(); let src = '';
    const paint = () => { if (window.__cam && window.__cam !== src) { src = window.__cam; im.src = src; } g.fillStyle = '#222'; g.fillRect(0, 0, c.width, c.height);
      if (im.complete && im.naturalWidth) { const s = Math.max(c.width / im.naturalWidth, c.height / im.naturalHeight); const w = im.naturalWidth * s, h = im.naturalHeight * s; g.drawImage(im, (c.width - w) / 2, (c.height - h) / 2, w, h); } };
    setInterval(paint, 60); const md = navigator.mediaDevices || {}; Object.defineProperty(navigator, 'mediaDevices', { value: md, configurable: true }); md.getUserMedia = async () => { paint(); return c.captureStream(15); }; });
  await ctx.route('https://api.anthropic.com/**', async (route) => { const body = JSON.parse(route.request().postData() || '{}'); const content = body.messages?.[0]?.content || [];
    const texts = content.filter((b) => b.type === 'text').map((b) => b.text).join('\n'); const images = content.filter((b) => b.type === 'image').length; let out;
    if (/NEW PHOTO/.test(texts)) out = { index: -1, sure: false };
    else if (images) out = { name: AI.name, sameAs: '', alternatives: [], restingOn: AI.restingOn || 'white surface', placeCertain: false, placeGuesses: [], description: '', details: AI.details || '', private: false, privateWhy: '', secretVisible: false };
    else out = { matches: [], message: '' };
    await new Promise((r) => setTimeout(r, 300)); await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [{ type: 'text', text: JSON.stringify(out) }] }) }); });
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  let n = 0; const shot = async (label, full) => { await page.waitForTimeout(350); const f = `${String(++n).padStart(2, '0')}_${label}.png`; await page.screenshot({ path: path.join(OUT, f), fullPage: !!full }); console.log('shot', f); };
  const tap = async (sel, w = 500) => { await page.locator(sel).first().click(); await page.waitForTimeout(w); };
  const cam = async (f) => { await page.evaluate((s) => { window.__cam = s; }, img(f)); await page.waitForTimeout(250); };
  const dump = () => page.evaluate(() => window.__rig.dump());
  const LOG = '.footer .btn-primary:not(.alt)', FIND = '.footer .btn-primary.alt';
  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen');
  await page.evaluate(() => { localStorage.clear(); window.__rig.reset(); localStorage.setItem('rig-uid', 'margaret'); localStorage.setItem('rig-anon', '0');
    localStorage.setItem('recall-ai-config', JSON.stringify({ provider: 'anthropic', apiKey: 'sk-ant-rig', model: '' })); });
  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen'); await page.waitForTimeout(600);
  await page.evaluate(() => window.__rig.seed([{ id: 'margaret', name: 'Margaret' }], 'recall_users'));
  const home = async () => { await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen'); await page.waitForTimeout(600); };
  await shot('home_empty');
  // 1. Log reading glasses, say where, pick a new place from her words
  AI = { name: 'reading glasses' }; await tap(LOG, 900); await shot('camera_open'); await cam('glasses.jpg'); await tap('.lc-shutter', 1100); await shot('after_photo');
  await page.fill('.w1-words input', 'on the kitchen counter by the toaster'); await page.waitForTimeout(300); await shot('typed_words');
  await tap('.w1-in', 600); await shot('in_list_first'); 
  const nw = page.locator('.in-list .wl-new'); console.log('new offers', await nw.allInnerTexts());
  if (await nw.count()) await nw.first().click(); await page.waitForTimeout(500); await shot('chip_set');
  await tap('.lc-k.sv', 1300); await shot('after_save');
  await home(); await shot('home_1');
  // 2. Log the keys with words only
  AI = { name: 'keys' }; await tap(LOG, 900); await cam('keys.jpg'); await tap('.lc-shutter', 1100); await page.fill('.w1-words input', 'in my coat pocket'); await tap('.lc-k.sv', 1300); await shot('after_save_wordsonly');
  // 3. Log wallet, nothing said
  await home(); AI = { name: 'wallet' }; await tap(LOG, 900); await cam('wallet.jpg'); await tap('.lc-shutter', 1100); await tap('.lc-k.sv', 1300); await shot('after_save_nothing');
  await home(); await shot('home_3');
  // 4. Find the glasses
  await tap(FIND, 700); await shot('find_open'); await page.fill('#ask-input', 'glasses'); await page.waitForTimeout(900); await shot('find_glasses');
  await tap('.ask .tile', 900); await shot('item_page', true);
  // 5. Move it: say a new place in words only (Ravi's case)
  await tap('button:has-text("Move it")', 1000); await shot('move_open');
  await page.fill('.w1-words input', 'on the dining table'); await page.waitForTimeout(300); await shot('move_typed');
  await tap('.lc-k.sv', 1400); await shot('move_after_save', true);
  const d1 = await dump(); const g1 = d1.find((x) => x.kind === 'item' && x.name === 'reading glasses'); console.log('glasses after words-move:', JSON.stringify({ loc: g1.location, hist: (g1.history || []).slice(-3) }));
  // 6. Find again: what does Find say?
  await home(); await tap(FIND, 700); await page.fill('#ask-input', 'glasses'); await page.waitForTimeout(900); await shot('find_after_move');
  await tap('.ask .tile', 900);
  // 7. Move it, open the chip
  await tap('button:has-text("Move it")', 1000); await tap('.w1-in-open', 700); await shot('move_chip_list');
  await page.fill('.in-list .wl-search input', 'Dining table'); await page.waitForTimeout(500); await shot('move_chip_typed');
  const nw2 = page.locator('.in-list .wl-new'); if (await nw2.count()) await nw2.first().click(); else await tap('.in-list .wl-row'); await page.waitForTimeout(500); await shot('move_chip_set');
  if (await page.locator('.w1-up').count()) { await tap('button.w1-up', 700); await shot('up_list'); await page.fill('.in-list .wl-search input', 'Dining room'); await page.waitForTimeout(500); const n3 = page.locator('.in-list .wl-new'); if (await n3.count()) await n3.first().click(); await page.waitForTimeout(500); await shot('up_set'); }
  await tap('.lc-k.sv', 1400); await shot('move2_after_save', true);
  // 8. Long-press / Home tiles at the end
  await home(); await shot('home_end');
  // 9. Menu
  console.log('errors', errs);
  await browser.close(); server.close();
})().catch((e) => { console.error(e); process.exit(1); });
