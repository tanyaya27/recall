// S12 — build 2 walked (2026-09-27): the camera photographs the LEVEL you choose (one colour per level, the shutter
// ring in the same colour, ＋ for the next level, a half-screen preview that swipes through that level's photos only,
// Type it instead on the photo), one page per thing, containers only, one way to say where, no loops.
// A REAL photo in the viewfinder at every shot; a screenshot per step, taps counted; PASS/FAIL so it is the audit too.
// THEME=dusk|linen node walk_s12.js → shots/s12-<theme>/<flow>-<n>.png + walk.json
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const THEME = process.env.THEME || 'dusk'; const PORT = THEME === 'dusk' ? 8120 : 8121; const ROOT = path.join(__dirname, 'out');
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, req.url.split('?')[0] === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
const img = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(__dirname, 'mock/img', f)).toString('base64');
const OUT = `shots/s12-${THEME}`; fs.mkdirSync(OUT, { recursive: true });
const results = []; const check = (name, ok, note = '') => { results.push({ name, ok: !!ok, note }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${note ? ' — ' + note : ''}`); };

// The fake AI, per scene: the thing's tag, the "where" answers in order, the visual check.
let AI = { name: 'thing' }; let WHERE = []; let SAME = { index: -1, sure: false };
const walk = []; const errors = [];

(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream'] });
  const ctx = await browser.newContext({ permissions: ['camera'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => {
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
    const texts = content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
    const images = content.filter((b) => b.type === 'image').length;
    let out;
    if (/MOVES:/.test(texts)) {
      const w = WHERE.shift() || { name: 'shelf', moves: false };
      // index: the fake says which SAVED name it recognises (by name), 1-based, as the real prompt asks.
      let index = 0; if (w.known) { const m = [...texts.matchAll(/SAVED (\d+) — "([^"]*)"/g)].find((x) => x[2].toLowerCase() === w.known.toLowerCase()); index = m ? Number(m[1]) : 0; }
      out = { name: w.name, moves: !!w.moves, index, sure: !!index };
    } else if (/NEW PHOTO/.test(texts)) out = SAME;
    else if (images) out = { name: AI.name, sameAs: AI.sameAs || '', alternatives: [], restingOn: AI.restingOn || '', placeCertain: !!AI.placeCertain, placeGuesses: AI.placeGuesses || [], description: '', details: AI.details || '', private: !!AI.private, privateWhy: AI.privateWhy || '', secretVisible: false };
    else out = { matches: [], message: '' };
    await new Promise((r) => setTimeout(r, 250));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [{ type: 'text', text: JSON.stringify(out) }] }) });
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/camera/.test(m.text())) errors.push('console: ' + m.text().slice(0, 160)); });

  let flow = '', n = 0, taps = 0;
  const start = (f) => { flow = f; n = 0; taps = 0; };
  const tap = async (sel, opts = {}) => { await page.locator(sel).first().click(opts); taps += 1; await page.waitForTimeout(opts.wait || 450); };
  const cam = async (f) => { await page.evaluate((s) => { window.__cam = s; }, img(f)); await page.waitForTimeout(250); };
  const step = async (caption) => {
    n += 1; await page.waitForTimeout(350);
    const file = `${flow}-${String(n).padStart(2, '0')}.png`;
    await page.screenshot({ path: `${OUT}/${file}` });
    walk.push({ flow, n, file, caption, taps });
    console.log(`${file}  taps=${taps}  ${caption}`);
  };
  const dump = () => page.evaluate(() => window.__rig.dump());
  const items = async () => (await dump()).filter((d) => d.kind === 'item' && !d.deleted);
  const byName = async (nm) => (await items()).find((d) => (d.name || '').toLowerCase() === nm.toLowerCase());
  const openTo = async (id) => (await dump()).filter((d) => d.kind === 'edge' && d.from === id && !d.until);
  const text = (sel) => page.locator(sel).first().innerText().catch(() => '');
  const count = (sel) => page.locator(sel).count();
  const setPrefs = (patch) => page.evaluate((p) => { const x = JSON.parse(localStorage.getItem('recall-prefs') || '{}'); Object.assign(x, p); localStorage.setItem('recall-prefs', JSON.stringify(x)); }, patch);

  // ---- Margaret's house, as in walk_s9
  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen');
  await page.evaluate(() => { localStorage.clear(); window.__rig.reset(); localStorage.setItem('rig-uid', 'mg'); localStorage.setItem('rig-anon', '0');
    localStorage.setItem('recall-ai-config', JSON.stringify({ provider: 'anthropic', apiKey: 'sk-ant-rig', model: '' })); }); await setPrefs({ theme: THEME });
  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen'); await page.waitForTimeout(400);
  const now = Date.now(), H = 3600e3;
  const P = (f) => ({ photo: img(f), thumb: img(f), thumbV: 2 });
  const T = (id, name, location, f, ago, extra = {}) => ({ id, kind: 'item', owner: 'mg', by: 'mg', private: false, roles: {}, sharedWith: [], name, location,
    ...(f ? P(f) : { photo: null, thumb: null, written: true }), order: now - ago, createdAt: now - ago, lastSeenAt: now - ago, logId: 'l_' + id, photoCount: f ? 1 : 0, history: [{ location, at: now - ago }], ...extra });
  const E = (id, from, to, ago) => ({ id, kind: 'edge', rel: 'in', from, to, since: now - ago, until: null, how: 'chosen', owner: 'mg', by: 'mg', private: false, roles: {}, sharedWith: [] });
  const box = (id, name) => ({ t: 'thing', id, name });
  const seed = [
    T('g', 'reading glasses', 'Hall table', 'glasses.jpg', 1 * H), T('w2', 'wallet', 'Hall table', 'wallet.jpg', 2 * H),
    T('m', 'memorabilia box', 'Crawl space', 'box14.jpg', 90 * H), T('w', 'wooden box', 'Memorabilia box', 'smallbox.jpg', 80 * H),
    T('y', 'yearbook 1978', 'Memorabilia box', 'book.jpg', 79 * H), T('c', 'baseball card', 'Wooden box', 'card.jpg', 70 * H),
    T('d', 'tool drawer', 'Garage', 'tooldrawer.jpg', 30 * H), T('u', 'coffee can', '', 'soda.jpg', 3 * H, { needsPlace: true }),
    T('p', 'passport', 'Desk drawer', 'folder.jpg', 5 * H, { private: true }),
    // Ravi's phone, 09-27: the pencil that ended up holding the filing cabinet (bug #8) — left as it is; Move it fixes it.
    T('pen', 'pencil', '', 'real_pencil.jpg', 9 * H, { needsPlace: true, restingOn: 'Cream-colored knitted blanket or sweater' }), T('cab', 'filling cabinet', 'Pencil', null, 8 * H),
    { id: 'pl1', kind: 'place', owner: 'mg', by: 'mg', private: false, name: 'Kitchen counter', order: 1, createdAt: now - 99 * H, parent: null, photos: [] },
    E('em', 'm', { t: 'place', name: 'Crawl space' }, 90 * H), E('ew', 'w', box('m', 'memorabilia box'), 80 * H),
    E('ey', 'y', box('m', 'memorabilia box'), 79 * H), E('ec', 'c', box('w', 'wooden box'), 70 * H), E('ecab', 'cab', box('pen', 'pencil'), 7.5 * H),
  ];
  await page.evaluate((s) => window.__rig.seed(s), seed);
  await page.evaluate((s) => window.__rig.seed(s, 'recall_users'), [{ id: 'mg', name: 'Margaret' }]);
  await page.waitForTimeout(500);
  const home = async () => { await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board'); await page.waitForTimeout(400); };
  const LOG = '.footer .btn-primary:not(.alt)';

  const sel = () => page.locator('.lv-sq.sel').getAttribute('aria-label');
  const ring = () => page.evaluate(() => getComputedStyle(document.querySelector('.lc-shutter')).borderTopColor);
  const AMBER = 'rgb(245, 185, 66)', BLUE = 'rgb(77, 182, 245)', WHITE = 'rgb(255, 255, 255)';

  // ===== W1 · a thing at a place used before: the photo shows the kitchen counter → 3 taps
  start('w1'); AI = { name: 'scissors', placeGuesses: ['Kitchen counter'], placeCertain: true };
  await home(); await cam('scissors.jpg'); await tap(LOG, { wait: 900 });
  await step('Log item: step 1 — Type it instead is ON the photo');
  check('C1 Cancel alone top-left; Type it instead INSIDE the picture, above the button row (Ravi 09-27)', await count('.lc-x') === 1 && await count('.lc-view .lc-typeit button') === 1 && await count('.lc-bot .lc-typeit') === 0
    && await page.evaluate(() => { const t = document.querySelector('.lc-typeit button').getBoundingClientRect(); const v = document.querySelector('.lc-view').getBoundingClientRect(); return t.bottom <= v.bottom && t.top >= v.top; }));
  check('C2 before the first photo there is nothing to save; the ring is white (the thing)', await count('.lc-k') === 0 && await ring() === WHITE);
  await tap('.lc-shutter', { wait: 1500 }); await step('Shutter: the scissors; the photo shows the counter');
  check('W1 the sentence already says Kitchen counter (the photo shows it) — Save is one tap', /Kitchen counter/.test(await text('.lc-say')), await text('.lc-say'));
  check('C3 + Next | shutter | Save in one row; one verb per button', (await text('.lc-k.sn')).replace(/\s/g, '') === '+Next' && (await text('.lc-k.sv')).trim() === 'Save');
  const gap = await page.evaluate(() => { const s = document.querySelector('.lc-shutter').getBoundingClientRect(); const a = document.querySelector('.lc-k.sn').getBoundingClientRect(); const b = document.querySelector('.lc-k.sv').getBoundingClientRect(); return [Math.round(s.left - a.right), Math.round(b.left - s.right), Math.round(a.width), Math.round(b.width)]; });
  check('C4 clear of the shutter on each side (≥ 24 px); side buttons ~119 px', gap[0] >= 24 && gap[1] >= 24 && gap[2] <= 121 && gap[3] <= 121, JSON.stringify(gap));
  // The dark glass card: never white on white (#2), whatever the theme
  const glass = await page.evaluate(() => { const bg = getComputedStyle(document.querySelector('.lc-card')).backgroundColor; const m = bg.match(/[\d.]+/g).map(Number); const nm = getComputedStyle(document.querySelector('.lc-name')).color; const sb = getComputedStyle(document.querySelector('.lc-say b')).color; return { bg, a: m[3] === undefined ? 1 : m[3], lum: (m[0] + m[1] + m[2]) / 3, nm, sb }; });
  check('K1 the card is dark glass (see-through, dark) with white words — never white on white', glass.a <= 0.6 && glass.lum < 60 && glass.nm === WHITE && glass.sb === WHITE, JSON.stringify(glass));
  const pin = await page.evaluate(() => { const s = document.querySelector('.lc-say > svg').getBoundingClientRect(); const b = document.querySelector('.lc-say .tx b').getBoundingClientRect(); return Math.abs((s.top + s.bottom) / 2 - (b.top + b.bottom) / 2); });
  check('K2 the pin lines up with the first line of the sentence (#3)', pin < 2, String(pin));
  await tap('.lc-k.sv', { wait: 1500 }); await step('Save: Home shows what was saved');
  const sc = await byName('scissors'); const e1 = sc ? await openTo(sc.id) : [];
  check('W1 3 taps: scissors saved at the kitchen counter (place edge)', taps === 3 && sc && sc.location === 'Kitchen counter' && e1.length === 1 && e1[0].to.t === 'place', `taps ${taps} · ${sc && sc.location}`);
  check('W1 Home card shows the chain and Undo', await count('.saved-card .trail img') >= 1 && await count('.saved-card .u') === 1 && /Kitchen counter/.test(await text('.saved-card')));

  // ===== W2 · LEVELS BY INTENT (Ravi 09-27): two photos of the spoon, then ＋ for the tin, then ＋ for the shelf
  start('w2'); AI = { name: 'spoon' }; WHERE = [{ name: 'blue tin', moves: true }, { name: 'linen closet shelf', moves: false }];
  await home(); await cam('real_spoon.jpg'); await tap(LOG, { wait: 900 }); await tap('.lc-shutter', { wait: 1500 });
  await step('The spoon: the thing stays chosen (white), ＋ in amber');
  check('V1 after the first photo the THING stays chosen; the ring is white; ＋ is amber', /^The thing/.test(await sel()) && await ring() === WHITE && await count('.lv-sq.plus') === 1
    && (await page.evaluate(() => getComputedStyle(document.querySelector('.lv-sq.plus')).borderTopColor)) === AMBER);
  await cam('real_desk.jpg'); await tap('.lc-shutter', { wait: 1200 }); await step('A second photo: another photo OF THE SPOON ("2"), not a place (#1, #4)');
  check('V2 a second photo goes to the spoon: "2" on its square, no where level made, the prompt says "Spoon · 2 photos"', (await text('.lv-sq.sel .lv-n')) === '2' && await count('.lv-sq') === 2 && /Spoon · 2 photos/.test(await text('.lc-prompt b')), await text('.lc-prompt b'));
  await tap('.lv-sq.plus', { wait: 300 }); await step('＋: level 1 chosen — amber square, amber ring, "Where it goes"');
  check('V3 ＋ picks level 1: its square outlined amber, the shutter ring amber, the prompt dot amber, "Where it goes"', /^Level 1/.test(await sel()) && await ring() === AMBER
    && (await page.evaluate(() => getComputedStyle(document.querySelector('.lc-prompt .dot')).borderTopColor)) === AMBER && /Where it goes/.test(await text('.lc-prompt b')));
  check('V3b the chips carry the level colour (a dot) and fill the chosen level', await count('.lc-cdot') === 1);
  await cam('tin.jpg'); await tap('.lc-shutter', { wait: 1800 }); await step('The tin: level 1, named from the photo');
  check('V4 the photo went to level 1 and is named: "In the blue tin"', /In the blue tin/.test(await text('.lc-say')) && /^Level 1/.test(await sel()), await text('.lc-say'));
  await tap('.lv-sq.plus', { wait: 300 });
  check('V5 ＋ again: level 2, blue square and blue ring', /^Level 2/.test(await sel()) && await ring() === BLUE);
  await cam('closet.jpg'); await tap('.lc-shutter', { wait: 1800 }); await step('The shelf: level 2');
  check('V6 the sentence: In the blue tin / Linen closet shelf', /In the blue tin/.test(await text('.lc-say')) && /Linen closet shelf/i.test(await text('.lc-say')), await text('.lc-say'));
  // the preview: THAT level's photos only, swipe, Remove this photo
  await page.locator('.lv-sq').nth(0).click(); await page.waitForTimeout(250); // select the spoon
  check('V7 tapping another level\'s square selects it (the ring follows)', /^The thing/.test(await sel()) && await ring() === WHITE);
  await page.locator('.lv-sq').nth(0).click(); await page.waitForTimeout(500); await step('Tap the chosen spoon: half-screen, the spoon\'s 2 photos only');
  check('V8 the preview shows the SPOON\'s photos only (2 dots), outlined white, "photo 2 of 2"', await count('.lc-pv') === 1 && await count('.pv-dots i') === 2 && await count('.pv-strip img') === 2 && /photo 2 of 2/.test(await text('.lc-pv b')));
  await page.evaluate(() => { const s = document.querySelector('.pv-strip'); s.scrollTo({ left: 0 }); s.dispatchEvent(new Event('scroll')); }); await page.waitForTimeout(500);
  await step('Swipe: the other photo of the spoon');
  check('V9 swipe → "photo 1 of 2" (still the spoon\'s)', /photo 1 of 2/.test(await text('.lc-pv b')), await text('.lc-pv b'));
  await page.click('.pv-rm'); await page.waitForTimeout(400); await step('Remove this photo');
  check('V10 Remove this photo → the spoon has 1 photo', await count('.lc-pv') === 0 || await count('.pv-strip img') === 1);
  if (await count('.lc-pv')) { await page.locator('.lc-pv').click({ position: { x: 10, y: 10 } }); await page.waitForTimeout(300); }
  check('V10b …and the square no longer says 2', await count('.lv-sq >> nth=0 >> .lv-n') === 0);
  await page.locator('.lv-sq').nth(1).click(); await page.waitForTimeout(250); await page.locator('.lv-sq').nth(1).click(); await page.waitForTimeout(500);
  await step('Tap the tin twice: the tin\'s photo only, outlined amber');
  check('V11 the tin\'s preview shows only the tin (1 photo), outlined amber', await count('.pv-strip img') === 1 && (await page.evaluate(() => getComputedStyle(document.querySelector('.lc-pv .box')).borderTopColor)) === AMBER);
  await page.locator('.lc-pv').click({ position: { x: 10, y: 10 } }); await page.waitForTimeout(300);
  check('V12 tap outside closes the preview', await count('.lc-pv') === 0);
  await tap('.lc-k.sv', { wait: 2200 }); await step('Save: the chain on Home');
  const sp = await byName('spoon'); const tin = await byName('blue tin');
  const es = sp ? await openTo(sp.id) : []; const et = tin ? await openTo(tin.id) : [];
  const pl = (await dump()).find((d) => d.kind === 'place' && d.name === 'Linen closet shelf');
  check('V13 the spoon is IN the new tin; the tin (a box, marked as holding things) is ON the new shelf, which has its own photo', sp && es.length === 1 && es[0].to.id === (tin && tin.id) && tin && tin.holds === true && et.length === 1 && et[0].to.name === 'Linen closet shelf' && pl && (pl.photos || []).length === 1);
  check('V14 7 taps for "spoon → new tin → new shelf" with a second spoon photo, a look and a removal (board: 7 without the extras)', taps >= 7, `taps ${taps}`);
  await page.waitForTimeout(8500);

  // ===== W3 · one page per thing: tile → page → Put it somewhere → chip → Save = 4 taps
  start('w3'); AI = { name: 'x' }; WHERE = [];
  await home(); await tap('.tile:has-text("Coffee can")', { wait: 700 }); await step('The coffee can\'s page: amber No place yet');
  check('P1 every tile opens its thing\'s page; no bottom bar, no Edit (#15, #25)', await count('.thing-page') === 1 && await count('.actbar') === 0 && /No place yet/.test(await text('.tp-wh b')));
  await tap('.tp-btn:has-text("Put it somewhere")', { wait: 800 }); await step('Put it somewhere: the camera, the can already there, level 1 chosen');
  check('P2 the camera: "Where is the coffee can?", the can as level 0, level 1 chosen (amber), no + Next', /Where is the coffee can\?/.test(await text('.lc-prompt b')) && /^Level 1/.test(await sel()) && await ring() === AMBER && await count('.lc-k.sn') === 0);
  await tap('.lc-chip:not(.box):not(.more)', { wait: 400 }); await step('Tap a place chip');
  const chipPlace = (await text('.lc-say b')).trim();
  await tap('.lc-k.sv', { wait: 1200 }); await step('Save: the page says where it is now');
  const cc = await byName('coffee can');
  check('P3 4 taps from Home: the can is at that place; the page says so; Undo on the toast', taps === 4 && cc.location === chipPlace && new RegExp(chipPlace).test(await text('.tp-wh b')) && await count('.toast-undo') === 1, `taps ${taps} · ${chipPlace}`);

  // ===== W4 · a box's page: In it, Put things in, Log something in; Back returns
  start('w4'); AI = { name: 'ticket stubs' }; WHERE = [];
  await home(); await tap('.tile:has-text("Memorabilia box")', { wait: 700 }); await step('The memorabilia box\'s page: In it');
  check('B1 a box\'s page lists what is in it; each opens its own page', await count('.tp-grid button') === 2);
  await tap('.tp-grid button:has-text("Wooden box")', { wait: 700 }); await step('The wooden box\'s page');
  await cam('card.jpg'); await tap('.tp-btn:has-text("Log something in")', { wait: 900 }); await tap('.lc-shutter', { wait: 1500 });
  await step('Log something in: "In the wooden box" already');
  check('B2 Log something in: the box is already level 1', /In the wooden box/.test(await text('.lc-say')), await text('.lc-say'));
  await tap('.lc-k.sn', { wait: 1500 }); await step('+ Next: saved, camera open for the next thing');
  check('N1 + Next saves and keeps the camera open at step 1', await count('.lc') === 1 && /Photograph the thing/.test(await text('.lc-prompt')) && !!(await byName('ticket stubs')));
  AI = { name: 'old letters' }; await cam('book.jpg'); await tap('.lc-shutter', { wait: 1500 });
  check('N2 the next thing goes in the same box unless she changes it', /In the wooden box/.test(await text('.lc-say')));
  await tap('.lc-k.sv', { wait: 1500 }); await step('Save: back on the wooden box\'s page');
  const ol = await byName('old letters'); const eo = ol ? await openTo(ol.id) : [];
  check('N3 old letters in the wooden box; we are back on its page', eo.length === 1 && eo[0].to.id === 'w' && /Wooden box/.test(await text('.thing-head .name')));
  await tap('.thing-head .chev', { wait: 500 }); await tap('.thing-head .chev', { wait: 500 });
  check('B3 Back, Back → Home (no circles)', await count('.board') === 1);

  // ===== W5 · Ravi's pencil (09-27: "Fix the pencil item so that it doesn't hold a cabinet!"): repaired once, at start
  start('w5'); await home(); await page.waitForTimeout(600);
  const ce0 = await openTo('cab'); const cab0 = await byName('filling cabinet');
  check('R0 the repair ran: the cabinet is no longer in the pencil (its edge closed, no new one), and waits with No place yet', ce0.length === 0 && cab0 && !cab0.location && (await dump()).some((d) => d.id === 'ecab' && d.until));
  check('R0b …nothing else moved: the baseball card is still in the wooden box, the wooden box in the memorabilia box', (await openTo('c'))[0].to.id === 'w' && (await openTo('w'))[0].to.id === 'm');
  await tap('.tile:has-text("Pencil")', { wait: 700 }); await step('The pencil\'s page: it holds nothing');
  check('R1 "In the photo:" is under the photo, never where the place goes (#22)', /In the photo: Cream-colored/.test(await text('.seen-line')) && /No place yet/.test(await text('.tp-wh b')));
  check('R2 the pencil holds nothing, so it is not a container: no In it, no Put things in (#12)', await count('#tp-in') === 0 && !/Put things in/.test(await text('.thing-page')));
  await home();
  check('R3 Home: the pencil tile has no "inside" badge (#16); the cabinet waits under Not put away', await count('.tile:has-text("Pencil") .inbadge') === 0 && /No place yet/.test(await text('.tile:has-text("Pencil")')) && /Not put away · 2/.test(await text(".notput")));
  await tap('.notput', { wait: 600 }); await tap('.np-row:has-text("Filling cabinet")', { wait: 700 }); await step('The cabinet\'s page, from Not put away');
  check('R3b the cabinet (no photo): "No photo of it yet", no "Written down" (#23)', /No photo of it yet/.test(await text('.written-panel')) && !/Written down/.test(await text('.thing-page')));
  await tap('.tp-btn:has-text("Put it somewhere")', { wait: 900 }); await tap('.lc-chip.more', { wait: 500 }); await step('Put it somewhere → •••: every place and box');
  const lst = await text('.where-list');
  check('R4 ••• for the cabinet: never itself, and never the pencil (it holds nothing now)', !/\nFilling cabinet\n/.test(lst) && !/\nPencil\n/.test(lst), lst.replace(/\n/g, ' / ').slice(0, 200));
  await page.fill('.wl-search input', 'Study'); await tap('.wl-new.typed', { wait: 300 }); await tap('.lc-k.sv', { wait: 1200 }); await step('Saved: the cabinet is in the Study');
  const ce = await openTo('cab');
  check('R5 the cabinet is at the Study now', ce.length === 1 && ce[0].to.t === 'place' && ce[0].to.name === 'Study');
  await page.reload(); await page.waitForSelector('.screen'); await page.waitForTimeout(800);
  check('R6 the repair never runs twice: the cabinet stays in the Study after a reload', (await openTo('cab'))[0].to.name === 'Study');
  await home();

  // ===== W6 · Not put away is a list of things (#13, #14)
  start('w6'); await home(); await tap('.notput', { wait: 600 }); await step('Not put away: the things, each opens its page');
  check('Q1 Not put away lists things (the pencil among them), never places', await count('.np-row') >= 1 && /Pencil/.test(await text('.np-list')));
  await tap('.np-row:has-text("Pencil")', { wait: 600 });
  check('Q2 a row opens that thing\'s page with Put it somewhere', await count('.tp-btn.amber:has-text("Put it somewhere")') === 1);

  // ===== W7 · look A (Photo clear) with levels, and Cancel
  start('w7'); await setPrefs({ cameraLook: 'a' }); AI = { name: 'spare key' }; WHERE = [{ name: 'blue tin', moves: true, known: 'blue tin' }];
  await home(); await cam('keys.jpg'); await tap(LOG, { wait: 900 }); await step('A · step 1');
  check('A0 look A: Type it instead is on the photo too', await count('.lc-view .lc-typeit button') === 1);
  await tap('.lc-shutter', { wait: 1500 }); await tap('.lv-sq.plus', { wait: 300 }); await cam('tin.jpg'); await tap('.lc-shutter', { wait: 1800 }); await step('A · the key, then ＋ and the blue tin');
  check('A1 look A: the levels are on the photo, names under each', await count('.lv-chain .lv-t') >= 2);
  const tops = await page.evaluate(() => [...document.querySelectorAll('.lv-chain .lv-sq')].map((e) => Math.round(e.getBoundingClientRect().top)));
  check('A2 the squares in the chain line up', new Set(tops).size === 1, JSON.stringify(tops));
  await tap('.lc-x', { wait: 500 }); await step('Cancel: asked before throwing photos away');
  check('X1 Cancel after a photo asks first', /Throw these photos away/.test(await text('body')));
  await tap('text=Throw away', { wait: 700 });
  check('X2 …nothing saved', !(await byName('spare key')));
  await setPrefs({ cameraLook: 'b' });

  // ===== W8 · Settings
  start('w8'); await home(); await page.click('.tiny:has-text("Settings")'); await page.waitForSelector('.lookpick'); await page.locator('.lookpick').scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
  await step('Settings → Taking photos');
  check('S1 both looks offered by picture; Answer card on by default; Show times on photos is here (#27)', await count('.lookopt') === 2 && /Answer card/.test(await text('.lookopt.on')) && await count('.settings .sw[aria-label="Show times on photos"]') === 1);

  // ===== W9 · the ••• list on the phone's width, and Write it down uses it
  start('w9'); await home(); await tap('.tile:has-text("Wallet")', { wait: 700 }); await tap('.tp-btn:has-text("Move it")', { wait: 900 }); await tap('.lc-chip.more', { wait: 500 });
  await step('••• from Move it: fits the screen');
  const sh = await page.evaluate(() => { const r = document.querySelector('.where-list').getBoundingClientRect(); return [Math.round(r.left), Math.round(r.right), document.documentElement.scrollWidth]; });
  check('B29 the list is no wider than the phone', sh[0] >= 0 && sh[1] <= 390 && sh[2] <= 390, JSON.stringify(sh));
  await page.click('.where-list .btn-quiet'); await page.click('.lc-x'); await page.waitForTimeout(300);
  await home(); await tap(LOG, { wait: 700 }); await tap('.lc-typeit button', { wait: 600 }); await page.fill('#note-what', 'spare fuse'); await page.locator('#note-what').blur(); await page.waitForTimeout(300);
  await step('Write it down: Save, with the sentence above');
  check('R8 Write it down: "Save", the sentence says No place yet; "Pick a place or box" opens the same list', (await text('.note-card .btn-primary')).trim() === 'Save' && /No place yet/.test(await text('.note-card .lc-say')) && /Pick a place or box/.test(await text('.note-card .path.in')));

  // ===== W10 · Largest text: the camera and a page still fit
  start('w10'); await setPrefs({ size: 'largest' }); AI = { name: 'bank locker key' }; WHERE = [{ name: 'blue tin', moves: true }];
  await home(); await cam('keys.jpg'); await tap(LOG, { wait: 900 }); await step('Largest · step 1');
  await tap('.lc-shutter', { wait: 1500 }); await tap('.lv-sq.plus', { wait: 300 }); await cam('tin.jpg'); await tap('.lc-shutter', { wait: 1800 });
  await step('Largest · the tin');
  const fit = await page.evaluate(() => { const ok = (el) => !el || (el.scrollWidth <= el.clientWidth + 1); const row = document.querySelector('.lc-row').getBoundingClientRect();
    return ok(document.querySelector('.lc-k.sn')) && ok(document.querySelector('.lc-k.sv')) && row.bottom <= innerHeight && document.documentElement.scrollWidth <= 390; });
  check('L1 Largest: + Next and Save fit their buttons; the row is on screen; nothing off the edge', fit);
  await page.click('.lc-x'); await page.waitForTimeout(300); if (await count('text=Throw away')) await page.click('text=Throw away');
  await home(); await tap('.tile:has-text("Memorabilia box")', { wait: 700 }); await step('Largest · a box\'s page');
  check('L2 Largest: a box\'s page — nothing off the edge; every button\'s words fit', await page.evaluate(() => document.documentElement.scrollWidth <= 390 && [...document.querySelectorAll('.tp-btn span, .tp-row span')].every((s) => s.scrollWidth <= s.clientWidth + 1)));
  await setPrefs({ size: 'normal' });

  check('E0 no page errors', errors.length === 0, errors.join(' | '));
  fs.writeFileSync(`${OUT}/walk.json`, JSON.stringify(walk, null, 1));
  const fails = results.filter((r) => !r.ok);
  console.log(`\n${results.length - fails.length}/${results.length} passed`); if (fails.length) console.log('FAILED:', fails.map((f) => f.name).join(' | '));
  await browser.close(); server.close();
})();
