// Task 1: the owner's 12-frame sequence on build 20261002a, 390x844 @2x. Harness copied from ../audit_ow.js.
const pw = require('/home/claude/rig/node_modules/playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const RIG = '/home/claude/rig';
const PORT = Number(process.env.PORT || 8481); const ROOT = path.join(RIG, 'out');
const server = http.createServer((req, res) => { const f = path.join(ROOT, req.url.split('?')[0] === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); });
const img = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(RIG, 'mock/img', f)).toString('base64');
const OUT = path.join(__dirname, 'build'); fs.mkdirSync(OUT, { recursive: true });
let AI = { name: 'thing' }; let GUESS = { name: 'Lab bench with a laptop', merged: 'Lab desk with a laptop' }; let GUESS_DELAY = 250;
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
    if (/PLACE GUESS/.test(texts)) { out = GUESS; delay = GUESS_DELAY; }
    else if (/NEW PHOTO/.test(texts)) out = { index: -1, sure: false };
    else if (images) out = { name: AI.name, sameAs: '', alternatives: [], restingOn: '', placeCertain: false, placeGuesses: [], description: '', details: '', private: false, privateWhy: '', secretVisible: false };
    else out = { matches: [], message: '' };
    await new Promise((r) => setTimeout(r, delay)); await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [{ type: 'text', text: JSON.stringify(out) }] }) }); });
  const page = await ctx.newPage(); page.setDefaultTimeout(5000); page.on('pageerror', (e) => log('PAGEERR', e.message));
  const W = (ms) => page.waitForTimeout(ms);
  const tap = async (sel, w = 450) => { await page.locator(sel).first().click(); await W(w); };
  const cam = async (f) => { await page.evaluate((s) => { window.__cam = s; }, img(f)); await W(250); };
  const txt = (sel) => page.locator(sel).first().innerText().catch(() => '');
  const snap = async (f, w = 700) => { await W(w); await page.screenshot({ path: path.join(OUT, f) }); log('snap', f); };
  const home = async () => { await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board, .screen'); await W(400); await page.evaluate(() => { window.__noAuto = true; }); };
  const LOG = '.footer .btn-primary:not(.alt)';
  const openThing = async (nm) => { await home(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', nm); await W(500); await page.click('.ask .tile >> nth=0'); await page.waitForSelector('.thing-page'); await W(400); };

  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen');
  await page.evaluate(() => { localStorage.clear(); window.__rig.reset(); localStorage.setItem('rig-uid', 'margaret'); localStorage.setItem('rig-anon', '0');
    localStorage.setItem('recall-ai-config', JSON.stringify({ provider: 'anthropic', apiKey: 'sk-ant-rig', model: '' })); });
  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen'); await W(300);
  const now = Date.now(), H = 3600e3;
  const own = { owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [] };
  const T = (id, name, loc, f, ago, extra = {}) => ({ id, kind: 'item', ...own, name, location: loc, photo: img(f), thumb: img(f), thumbV: 2, order: now - ago, createdAt: now - ago, lastSeenAt: now - ago, logId: 'l_' + id, photoCount: 1, history: [{ location: loc, at: now - ago }], ...extra });
  const PL = (id, nm, f, ago) => ({ id, kind: 'place', ...own, name: nm, order: now - ago, createdAt: now - ago, parent: null, photos: f ? [{ photo: img(f), thumb: img(f), at: now - ago }] : [] });
  const E = (id, from, to, ago) => ({ id, kind: 'edge', rel: 'in', from, to, since: now - ago, until: null, how: 'chosen', ...own });
  await page.evaluate((s) => window.__rig.seed(s), [
    T('br', 'Walgreens Photo brochure', 'Workbench or desk', 'folder.jpg', 2 * H),
    T('gl', 'reading glasses', 'Desk drawer', 'glasses.jpg', 3 * H),
    T('ky', 'keys', '', 'keys.jpg', 4 * H, { history: [{ location: '', at: now - 4 * H, by: 'margaret', w: 1, said: 'in my coat pocket' }] }),
    T('tin', 'blue tin', 'Desk drawer', 'tin.jpg', 5 * H, { holds: true }),
    PL('p1', 'Workbench or desk', 'tooldrawer.jpg', 90 * H), PL('p2', 'Desk drawer', 'drawer.jpg', 80 * H), PL('p3', 'Office', 'closet.jpg', 70 * H),
    E('e1', 'br', { t: 'place', name: 'Workbench or desk' }, 2 * H), E('e2', 'gl', { t: 'place', name: 'Desk drawer' }, 3 * H), E('e3', 'tin', { t: 'place', name: 'Desk drawer' }, 5 * H),
  ]);
  await page.evaluate((s) => window.__rig.seed(s, 'recall_users'), [{ id: 'margaret', name: 'Margaret' }]);
  await W(400);

  // 1 Move it at rest
  await openThing('brochure'); await cam('real_desk.jpg'); await tap('.thing-page button:has-text("Move it")', 900);
  await snap('01.png');
  // 2 typing
  await page.locator('.ow-input').click(); await W(200);
  await page.locator('.ow-input').pressSequentially('on my lab desk', { delay: 30 }); await snap('02.png');
  // 3 Done
  await page.locator('.ow-input').press('Enter'); await page.locator('.ow-input').blur().catch(() => {}); await snap('03.png');
  log('3 head:', await txt('.ow-head'), '| val', await page.locator('.ow-input').inputValue(), '| to', await txt('.ow-to'));
  // 4 photo of the lab desk -> looking
  GUESS_DELAY = 6000; await cam('real_desk.jpg'); await tap('.lc-shutter', 200);
  await page.waitForSelector('.ow-looking'); await snap('04.png', 500);
  // 5 the guess
  await page.waitForSelector('.ow-ai-add', { timeout: 12000 }); await snap('05.png', 600);
  log('5 ai:', await txt('.ow-ai'));
  // 6 Append
  await tap('.ow-ai-add', 300); await snap('06.png');
  log('6 val', await page.locator('.ow-input').inputValue());
  // 7 the → sheet
  await tap('.ow-go', 300); await page.waitForSelector('.ow-sheet'); await snap('07.png', 800);
  // 8 add Office as level 2
  await tap('.ow-up', 500); await page.fill('.in-list .wl-search input', 'Office'); await W(300); await tap('.in-list .wl-row', 400); await snap('08.png', 800);
  log('8 lvls', JSON.stringify(await page.locator('.ow-lvl').allInnerTexts()));
  // 9 item page after Save
  await tap('.ow-done', 500); await tap('.lc-k.sv', 1300); await page.waitForSelector('.thing-page'); await snap('09a.png', 300); await snap('09.png', 2500);
  log('9 boxes', JSON.stringify(await page.evaluate(() => { const b = document.querySelector('.tp-blk[aria-labelledby="tp-where"]'); return [...b.querySelectorAll('img, h3, p, div')].slice(0, 14).map((e) => [e.tagName, e.className, ...['x','y','width','height'].map((k) => Math.round(e.getBoundingClientRect()[k])), getComputedStyle(e).position, (e.innerText||'').slice(0,30)]); })));
  // 10 Find brochure
  await home(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', 'brochure'); await snap('10.png', 900);
  // 11 Log item after first photo
  await home(); AI = { name: 'pencil' }; await tap(LOG, 900); await cam('real_pencil.jpg'); await tap('.lc-shutter', 300);
  await page.waitForFunction(() => /pencil/i.test(document.querySelector('.ow-to')?.innerText || '')).catch(() => {}); await snap('11.png', 900);
  log('11 head', await txt('.ow-head'), '| to', await txt('.ow-to'));
  // 12 typing "desk drawer"
  await page.locator('.ow-input').click(); await W(200); await page.locator('.ow-input').pressSequentially('desk drawer', { delay: 30 }); await snap('12.png');
  log('12 head', await txt('.ow-head'));
  await browser.close(); server.close();
})().catch((e) => { console.error(e); process.exit(1); });
