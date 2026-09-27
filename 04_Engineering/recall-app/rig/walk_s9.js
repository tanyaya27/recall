// S9 — the UX board's visual walkthrough of TODAY's app (build 20260927b), every screen of every
// capture / place / box flow, with a REAL photo in the viewfinder (Ravi 09-27: "walk through every
// step by step … look at it visually too"). Nothing here changes the app.
//
// The viewfinder: getUserMedia is replaced by a canvas stream that paints the photo the scene is
// "pointing at" (window.__cam). The AI is faked per scene (NAME). Every step: a screenshot, the tap
// count so far, whether a keyboard would be up, and the boxes of the elements the board marks.
// node walk_s9.js → shots/s9/<flow>-<n>.png + shots/s9/walk.json
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const PORT = 8099; const ROOT = path.join(__dirname, 'out');
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, req.url.split('?')[0] === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
const img = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(__dirname, 'mock/img', f)).toString('base64');
const OUT = 'shots/s9'; fs.mkdirSync(OUT, { recursive: true });

let AI = { name: 'thing', placeGuesses: [] };
const walk = []; const errors = [];

(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream'] });
  const ctx = await browser.newContext({ permissions: ['camera'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => {
    // The viewfinder shows whatever photo the scene points at.
    const c = document.createElement('canvas'); c.width = 960; c.height = 1280; const g = c.getContext('2d');
    const im = new Image(); let src = '';
    const paint = () => { if (window.__cam && window.__cam !== src) { src = window.__cam; im.src = src; }
      g.fillStyle = '#222'; g.fillRect(0, 0, c.width, c.height);
      if (im.complete && im.naturalWidth) { const s = Math.max(c.width / im.naturalWidth, c.height / im.naturalHeight); const w = im.naturalWidth * s, h = im.naturalHeight * s; g.drawImage(im, (c.width - w) / 2, (c.height - h) / 2, w, h); } };
    setInterval(paint, 60);
    const md = navigator.mediaDevices || {}; Object.defineProperty(navigator, 'mediaDevices', { value: md, configurable: true });
    md.getUserMedia = async () => { paint(); return c.captureStream(15); };
  });
  await ctx.route('https://api.anthropic.com/**', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}'); const content = body.messages?.[0]?.content || [];
    const images = content.filter((b) => b.type === 'image').length; const isSame = content.some((b) => b.type === 'text' && /NEW PHOTO/.test(b.text));
    const text = JSON.stringify(isSame ? { index: -1, sure: false } : images
      ? { name: AI.name, sameAs: '', alternatives: [], restingOn: AI.restingOn || '', placeCertain: false, placeGuesses: AI.placeGuesses || [], description: '', details: '', private: false, secretVisible: false, same: true }
      : { matches: [], message: '' });
    await new Promise((r) => setTimeout(r, 300));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [{ type: 'text', text }] }) });
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

  let flow = '', n = 0, taps = 0, typed = '';
  const start = (f) => { flow = f; n = 0; taps = 0; typed = ''; };
  const tap = async (sel, opts = {}) => { await page.locator(sel).first().click(opts); taps += 1; await page.waitForTimeout(opts.wait || 450); };
  const type = async (sel, s) => { await page.locator(sel).first().fill(s); typed += (typed ? ' + ' : '') + `"${s}"`; await page.waitForTimeout(400); };
  const cam = async (f) => { await page.evaluate((s) => { window.__cam = s; }, img(f)); await page.waitForTimeout(250); };
  // One step: screenshot + what she did to get here + rects of named elements.
  const step = async (caption, marks = {}, { full = false, scrollTo = null } = {}) => {
    n += 1; await page.waitForTimeout(350);
    if (scrollTo) { await page.locator(scrollTo).first().scrollIntoViewIfNeeded().catch(() => {}); await page.waitForTimeout(250); }
    const file = `${flow}-${String(n).padStart(2, '0')}.png`;
    await page.screenshot({ path: `${OUT}/${file}`, fullPage: full });
    const rects = {};
    for (const [k, sel] of Object.entries(marks)) {
      const loc = page.locator(sel).first();
      const b = (await loc.count()) ? await loc.boundingBox().catch(() => null) : null;
      const sy = full ? await page.evaluate(() => window.scrollY) : 0;
      rects[k] = b ? { x: b.x, y: b.y + sy, w: b.width, h: b.height, off: !full && (b.y > 844 || b.y + b.height < 0) } : null;
    }
    const kb = await page.evaluate(() => { const a = document.activeElement; return !!a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA'); });
    const h = await page.evaluate(() => Math.max(document.documentElement.scrollHeight, document.body.scrollHeight));
    // Buttons whose words wrap or are cut off (Ravi 09-27: sentences in buttons wrap badly all over the product).
    const bad = await page.evaluate(() => [...document.querySelectorAll('button, .btn-primary, label.btn-primary')].filter((b) => {
      const r = b.getBoundingClientRect(); if (!r.width || r.bottom < 0 || r.top > innerHeight) return false;
      const t = (b.innerText || '').trim(); if (!t || t.length < 4) return false;
      const cs = getComputedStyle(b); const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.25;
      const spans = [...b.querySelectorAll('span')].filter((x) => x.scrollWidth > x.clientWidth + 1);
      const lines = Math.round((r.height - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)) / lh);
      return b.scrollWidth > b.clientWidth + 1 || spans.length || (lines >= 2 && t.split('\n').length === 1 && t.length > 12);
    }).map((b) => (b.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 60)));
    walk.push({ flow, n, file, caption, taps, typed, keyboard: kb, pageHeight: h, full, rects, badButtons: bad });
    console.log(`${file}  taps=${taps}${typed ? ' typed ' + typed : ''}${kb ? ' [keyboard]' : ''}  ${caption}`);
  };

  // ---- Margaret's house (the same household as the audits, plus a couple of places)
  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen');
  await page.evaluate(() => { localStorage.clear(); window.__rig.reset(); localStorage.setItem('rig-uid', 'mg'); localStorage.setItem('rig-anon', '0');
    localStorage.setItem('recall-ai-config', JSON.stringify({ provider: 'anthropic', apiKey: 'sk-ant-rig', model: '' })); });
  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen'); await page.waitForTimeout(400);
  const now = Date.now(), H = 3600e3;
  const P = (f) => ({ photo: img(f), thumb: img(f), thumbV: 2 });
  const T = (id, name, location, f, ago, extra = {}) => ({ id, kind: 'item', owner: 'mg', by: 'mg', private: false, roles: {}, sharedWith: [], name, location,
    ...(f ? P(f) : { photo: null, thumb: null, written: true }), order: now - ago, createdAt: now - ago, lastSeenAt: now - ago, logId: 'l_' + id, photoCount: f ? 1 : 0, history: [{ location, at: now - ago }], ...extra });
  const E = (id, from, to, ago) => ({ id, kind: 'edge', rel: 'in', from, to, since: now - ago, until: null, how: 'chosen', owner: 'mg', by: 'mg', private: false, roles: {}, sharedWith: [] });
  const box = (id, name) => ({ t: 'thing', id, name });
  await page.evaluate((s) => window.__rig.seed(s), [
    T('g', 'reading glasses', 'Hall table', 'glasses.jpg', 1 * H), T('w2', 'wallet', 'Hall table', 'wallet.jpg', 2 * H),
    T('m', 'memorabilia box', 'Crawl space', 'box14.jpg', 90 * H), T('w', 'wooden box', 'Memorabilia box', 'smallbox.jpg', 80 * H),
    T('y', 'yearbook 1978', 'Memorabilia box', 'book.jpg', 79 * H), T('c', 'baseball card', 'Wooden box', 'card.jpg', 70 * H),
    T('d', 'tool drawer', 'Garage', 'tooldrawer.jpg', 30 * H), T('u', 'coffee can', '', 'soda.jpg', 3 * H, { needsPlace: true }),
    T('p', 'passport', 'Desk drawer', 'folder.jpg', 5 * H, { private: true }),
    E('em', 'm', { t: 'place', name: 'Crawl space' }, 90 * H), E('ew', 'w', box('m', 'memorabilia box'), 80 * H),
    E('ey', 'y', box('m', 'memorabilia box'), 79 * H), E('ec', 'c', box('w', 'wooden box'), 70 * H),
  ]);
  await page.evaluate((s) => window.__rig.seed(s, 'recall_users'), [{ id: 'mg', name: 'Margaret' }]);
  await page.waitForTimeout(500);
  const home = async () => { await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board'); await page.waitForTimeout(400); };

  // ===== W1 · S1: a thing at a place she has used before (scissors → kitchen counter)
  start('w1'); AI = { name: 'scissors', placeGuesses: ['Kitchen counter'] };
  await home(); await step('Home', { log: '.footer .btn-primary:not(.alt)' });
  await cam('scissors.jpg'); await tap('.footer .btn-primary:not(.alt)', { wait: 900 });
  await step('Camera opens', { modes: '.modes', write: '.camera-write', done: '.camera-done' });
  await tap('.shutter', { wait: 600 }); await step('Shutter: the photo sits in a roll; nothing happens until Done', { roll: '.camera-roll', done: '.camera-done' });
  await tap('.camera-done', { wait: 900 }); await step('Photo card (first look)', { skel: '.skeleton', roll: '.roll', q: '.ask-q' });
  await page.waitForTimeout(1200); await step('Photo card, named', { photo: '.photo-full', roll: '.roll', paths: '.path-row', q: '.ask-q' });
  await step('Photo card, whole page (what is below the fold)', { paths: '.path-row', other: '.guess.other', views: '.view-links' }, { full: true });
  await tap('.guess:has-text("Kitchen counter")', { wait: 900 }); await step('Saved: back on Home', { toast: '.toast' });

  // ===== W2 · into a box she already logged (a 1978 diary → the wooden box)
  start('w2'); AI = { name: '1978 diary' };
  await home(); await cam('diary.jpg'); await tap('.footer .btn-primary:not(.alt)', { wait: 900 }); await tap('.shutter', { wait: 600 }); await tap('.camera-done', { wait: 2200 });
  await step('Photo card', { inrow: '.path.in', q: '.ask-q' });
  await tap('.path.in', { wait: 700 }); await step('"What is it in?" — keyboard up at once', { search: '.it-search', newrow: '.it-new', grid: '.putin-grid' });
  await page.locator('.it-search input').blur(); await page.waitForTimeout(300);
  await step('…the same sheet, keyboard down', { grid: '.putin-grid', wooden: '.putin-grid .tile:has-text("Wooden box")' });
  await tap('.putin-grid .tile:has-text("Wooden box")', { wait: 1500 }); await step('Saved: Home', { toast: '.toast', board: '.board' });

  // ===== W3 · into a box she has NOT logged (bank locker key → the blue tin → top shelf of the wardrobe)
  start('w3'); AI = { name: 'bank locker key' };
  await home(); await cam('keys.jpg'); await tap('.footer .btn-primary:not(.alt)', { wait: 900 }); await tap('.shutter', { wait: 600 }); await tap('.camera-done', { wait: 2200 });
  await step('Photo card: the key', { inrow: '.path.in' });
  await tap('.path.in', { wait: 700 }); await step('"What is it in?" — the tin is right in front of her, but there is no camera here', { search: '.it-search', newrow: '.it-new' });
  await type('.it-search input', 'blue tin'); await step('She types the tin\'s name', { newrow: '.it-new', search: '.it-search' });
  await tap('.it-new', { wait: 1500 }); await step('Saved: Home', { toast: '.toast', tin: '.tile:has-text("Blue tin")' });
  await tap('.tile:has-text("Blue tin")', { wait: 800 }); await step('She taps the new tin: inside it (option A)', { head: '.ctx-head', banner: '.ctx-banner', line: '.ctx-line' });
  const bannerSel = (await page.locator('.ctx-banner').count()) ? '.ctx-banner' : '.ctx-line .link-btn';
  await tap(bannerSel, { wait: 800 }); await step('The tin\'s card: no photo, no place', { written: '.written-panel', where: '.thing-head .row2', add: '.act.primary' });
  await cam('tin.jpg'); await tap('.act.primary', { wait: 900 }); await tap('.shutter', { wait: 600 }); await tap('.camera-done', { wait: 1800 });
  await step('Photo added to the tin', { toast: '.toast', where: '.thing-head .row2' });
  await tap('.act:has-text("Edit")', { wait: 500 }); await step('Edit: "Add the place"', { field: '.fix .field-value[aria-label^="Where it is"]' }, { scrollTo: '.fix .field-value[aria-label^="Where it is"]' });
  await tap('.fix .field-value[aria-label^="Where it is"]', { wait: 600 }); await step('"Where is it now?"', { inrow: '.place-sheet .path-row', list: '.place-sheet .guesses', other: '.place-sheet .guess.other' });
  await tap('.place-sheet .guess.other', { wait: 500 }); await type('.place-sheet .place-input', 'Top shelf, bedroom wardrobe');
  await step('Typed the tin\'s place (no photo of the shelf possible)', { input: '.place-sheet .place-input', use: '.place-sheet .typing .btn-primary' });
  await tap('.place-sheet .typing .btn-primary', { wait: 900 }); await step('Tin card after', { where: '.thing-head .row2', done: '.fix-row .btn-quiet:has-text("Done")' });
  await home(); await step('Home after all that', { board: '.board' });
  // Find it
  await tap('.footer .btn-primary.alt', { wait: 600 }); await type('.ask input', 'locker key'); await page.locator('.ask input').blur(); await page.waitForTimeout(500);
  await step('Find: "locker key"', { ask: '.ask' });
  const hit = page.locator('.ask .tile').first(); if (await hit.count()) { await hit.click(); taps += 1; await page.waitForTimeout(700); await step('The key\'s card: the answer', { where: '.thing-head .row2', nest: '.nest-row' }); }

  // ===== W4 · catalogue now, place later (a phone charger, no place yet → later the desk drawer)
  start('w4'); AI = { name: 'phone charger' };
  await home(); await cam('charger.jpg'); await tap('.footer .btn-primary:not(.alt)', { wait: 900 }); await tap('.shutter', { wait: 600 }); await tap('.camera-done', { wait: 2200 });
  await step('Photo card', { later: '.path.later' });
  await tap('.path.later', { wait: 1500 }); await step('Saved with no place: Home', { notput: '.notput', toast: '.toast' });
  await tap('.notput', { wait: 600 }); await step('"Put away 2 things — where are they going?"', { sheet: '.place-sheet', other: '.place-sheet .guess.other' });
  await tap('.place-sheet .guess:has-text("Desk drawer")', { wait: 600 }); await step('Tap each thing that goes there', { grid: '.putin-grid', foot: '.putin-foot' });
  await tap('.putin-grid .tile:has-text("Phone charger")', { wait: 300 }); await step('One picked', { foot: '.putin-foot .btn-primary' });
  await tap('.putin-foot .btn-primary', { wait: 1200 }); await step('Put away: Home', { toast: '.toast' });

  // ===== W5 · a box she already has, into a place / another box (S3): the coffee can → the tool drawer? no — into the garage
  start('w5');
  await home(); await tap('.tile:has-text("Coffee can")', { wait: 700 }); await step('Coffee can card (no place)', { where: '.thing-head .row2' });
  if (!(await page.locator('.fix .field-value[aria-label^="Where it is"]').isVisible())) await tap('.act:has-text("Edit")', { wait: 500 });
  await tap('.fix .field-value[aria-label^="Where it is"]', { wait: 600 });
  await step('"Where is it now?" — the sheet from the card', { inrow: '.place-sheet .path-row', list: '.place-sheet .guesses' });
  await tap('.place-sheet .path.in', { wait: 700 }); await page.locator('.it-search input').blur(); await page.waitForTimeout(300);
  await step('"In something" from here: a sheet on a sheet', { grid: '.putin-grid' });


  // ===== W6 · the mode row and Several
  start('w6'); AI = { name: 'glasses case' };
  await home(); await cam('glasses.jpg'); await tap('.footer .btn-primary:not(.alt)', { wait: 900 });
  if (await page.locator('.modes button:has-text("Several")').count()) {
    await tap('.modes button:has-text("Several")', { wait: 900 }); await step('Several', { strip: '.strip1', place: '.cam-place' });
    await tap('.shutter', { wait: 2200 }); await step('Several: after one photo', { strip: '.strip1', place: '.cam-place' });
  }

  fs.writeFileSync(`${OUT}/walk.json`, JSON.stringify(walk, null, 1));
  console.log('errors:', errors.length ? errors : 'none');
  await browser.close(); server.close();
})();
