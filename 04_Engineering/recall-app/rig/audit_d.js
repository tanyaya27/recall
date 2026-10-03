// Retired 2026-10-01 (release 1 — the tier camera is gone):
//   D4 "ReCall offers the Desk drawer in its slot in Choose place; slot and name field ≥ 44 px" — the AI place match on a
//      where-photo (the WHERE / "MOVES:" ask) and Choose place are removed.
//   D4 "Yes → Place: Desk drawer; the photo taken for the level stays on it (fix B1)" — the "Place:" line, tier squares and
//      place photos are removed.
//   D4 "No → ☰ Choose place with the photo on top (A new place?) and the list below" — the where-photo naming flow is removed.
//   D5 "the new-place control is a solid rounded 'Photograph a new place' button" — place photos are removed; no caller passes
//      WhereList an onPhotograph any more (the button can never show).
// Rewritten: D4 "Save writes the thing at Desk drawer" and "picking another place sets it" now go through the In chip;
// D5 (the one list "YOUR PLACES · N") now opens from Write it down → Pick a place or box, the list's remaining home —
// the camera's In list (InList) is release 1's own design and is covered by audit_graph.
// D1-D5 audit (Ravi 09-28): the five RULED design changes picked from the rendered mockups (shots_d/, mock/d/).
//   D1 the "Add photo" pill on the thing page's caption line      D2 the photo viewer (a thing's photos, a place's photos)
//   D3 a caption per photo                                        D4 the camera's where-card (pills inside, one line, the ask)
//   D5 the ••• list (one list, "YOUR PLACES · N")
// Drives the real UI like repro_f3.js / verify_f2.js: fake AI routes, fake camera, seeded house; only reads the store through
// window.__rig.dump(). The rig store drops writes past ~5 MB of localStorage, so every scenario RESEEDS.
// node audit_d.js   (after ./build.sh)  → PASS/FAIL, screenshots to shots_dd/ (or $D_SHOTS)
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const PORT = 8399; const ROOT = path.join(__dirname, 'out');
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, req.url.split('?')[0] === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
const img = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(__dirname, 'mock/img', f)).toString('base64');
const SHOTS = process.env.D_SHOTS || path.join(__dirname, 'shots_dd'); fs.mkdirSync(SHOTS, { recursive: true });
const results = []; const errors = [];
function check(name, ok, note = '') { results.push({ name, ok: !!ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${note ? ' — ' + note : ''}`); }

let AI = { name: 'thing' }; let SAME = { index: -1, sure: false };
const LEVEL1 = 'rgb(245, 185, 66)'; // LEVEL_COLOURS[1], amber

async function main() {
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
    if (/NEW PHOTO/.test(texts)) out = SAME;
    else if (images) out = { name: AI.name, sameAs: '', alternatives: [], restingOn: AI.restingOn || '', placeCertain: false, placeGuesses: [], description: '', details: '', private: false, privateWhy: '', secretVisible: false };
    else out = { matches: [], message: '' };
    await new Promise((r) => setTimeout(r, 200));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [{ type: 'text', text: JSON.stringify(out) }] }) });
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/camera|permission-denied/i.test(m.text())) errors.push('console: ' + m.text().slice(0, 160)); });

  const tap = async (sel, opts = {}) => { await page.locator(sel).first().click(opts); await page.waitForTimeout(opts.wait || 450); };
  const cam = async (f) => { await page.evaluate((s) => { window.__cam = s; }, img(f)); await page.waitForTimeout(220); };
  const text = (sel) => page.locator(sel).first().innerText().catch(() => '');
  const count = (sel) => page.locator(sel).count();
  const dump = () => page.evaluate(() => window.__rig.dump());
  const doc = async (id) => (await dump()).find((d) => d.id === id);
  const snapsOf = async (itemId) => (await dump()).filter((d) => d.kind === 'snap' && d.itemId === itemId);
  const setPrefs = (patch) => page.evaluate((p) => { const x = JSON.parse(localStorage.getItem('recall-prefs') || '{}'); Object.assign(x, p); localStorage.setItem('recall-prefs', JSON.stringify(x)); }, patch);
  const home = async () => { await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board'); await page.waitForTimeout(350); };
  const shot = async (n) => { await page.waitForTimeout(280); await page.screenshot({ path: path.join(SHOTS, n + '.png') }); };
  const LOG = '.footer .btn-primary:not(.alt)';
  const openThing = async (label) => { await home(); await tap(`.tile:has-text("${label}")`, { wait: 700 }); await page.waitForSelector('.thing-page'); await page.waitForTimeout(250); };
  const scrollStrip = async (sel, i) => { await page.evaluate(([s, k]) => { const el = document.querySelector(s); const a = el.children[0], b = el.children[1]; const step = a && b ? b.offsetLeft - a.offsetLeft : el.clientWidth; el.scrollTo({ left: k * step, behavior: 'instant' }); }, [sel, i]); await page.waitForTimeout(500); };
  const box = (sel) => page.locator(sel).first().evaluate((el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, r: r.right, b: r.bottom }; });

  const now0 = Date.now(), H = 3600e3, M = 60e3;
  // ---- one seeded house per scenario (the store drops writes past ~5 MB) ----
  async function seed(extra = []) {
    await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen');
    await page.evaluate(() => { localStorage.clear(); window.__rig.reset(); localStorage.setItem('rig-uid', 'margaret'); localStorage.setItem('rig-anon', '0');
      localStorage.setItem('recall-ai-config', JSON.stringify({ provider: 'anthropic', apiKey: 'sk-ant-rig', model: '' })); });
    await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen'); await page.waitForTimeout(300);
    const now = Date.now();
    const P = (f) => ({ photo: img(f), thumb: img(f), thumbV: 2 });
    const own = { owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [] };
    const T = (id, name, location, f, ago, x = {}) => ({ id, kind: 'item', ...own, name, location, ...(f ? P(f) : { photo: null, thumb: null, written: true }),
      order: now - ago, createdAt: now - ago, lastSeenAt: now - ago, logId: 'l_' + id, photoCount: f ? 1 : 0, history: [{ location, at: now - ago }], ...x });
    const S = (id, itemId, f, at, x = {}) => ({ id, kind: 'snap', owner: 'margaret', by: 'margaret', itemId, logId: 'l_' + itemId, ...P(f), location: 'Closet', at: now - at, ...x });
    const PL = (id, nm, fs, ago) => ({ id, kind: 'place', ...own, name: nm, order: now - ago, createdAt: now - ago, parent: null, photos: fs.map((f, i) => ({ photo: img(f), thumb: img(f), at: now - ago + i })) });
    const seedDocs = [
      // Slippers: the cover (orange carpet) is the OLDEST photo; two later ones sit in front of it in the strip (newest first).
      T('sl', 'slippers', 'Closet', 'real_slippers.jpg', 2 * H, { photoCount: 3, restingOn: 'on the orange carpet' }),
      S('s1', 'sl', 'real_slippers.jpg', 2 * H, { caption: 'on the orange carpet' }),
      S('s3', 'sl', 'closet.jpg', 100 * M, { extra: true }),                                  // NO caption
      S('s2', 'sl', 'real_desk.jpg', 90 * M, { extra: true, caption: 'by the front door mat' }),
      // an old thing from before captions: the cover has only item.restingOn, the other photo nothing
      T('ol', 'old lamp', 'Desk drawer', 'scissors.jpg', 5 * H, { photoCount: 2, restingOn: 'on the desk' }),
      S('o1', 'ol', 'scissors.jpg', 5 * H, { location: 'Desk drawer' }), S('o2', 'ol', 'glasses.jpg', 4 * H, { location: 'Desk drawer', extra: true }),
      T('lr', 'lint roller', 'Kitchen counter', 'keys.jpg', 30 * M, { restingOn: 'on the counter' }), S('l1', 'lr', 'keys.jpg', 30 * M, { location: 'Kitchen counter', caption: 'on the counter' }),
      T('bx', 'white cardboard box', 'Garage', null, 20 * H, { holds: true }),
      T('bn', 'spare bin', '', null, 21 * H, { holds: true }),
      PL('pcl', 'Closet', ['closet.jpg', 'drawer.jpg', 'real_desk.jpg'], 60 * H),
      PL('pdr', 'Desk drawer', ['drawer.jpg'], 50 * H),
      PL('pkc', 'Kitchen counter', ['real_desk.jpg'], 40 * H),
      ...extra,
    ];
    await page.evaluate((s) => window.__rig.seed(s), seedDocs);
    await page.evaluate((s) => window.__rig.seed(s, 'recall_users'), [{ id: 'margaret', name: 'Margaret' }, { id: 'robert', name: 'Robert' }]);
    await page.waitForTimeout(400);
  }
  // Robert's boots, shared with Margaret as a viewer / an editor (rules are OFF in this suite: only the UI's gating is under test)
  const sharedThing = (id, role) => [{ id, kind: 'item', owner: 'robert', by: 'robert', private: false, roles: { margaret: role }, sharedWith: ['margaret'], name: 'robert boots', location: 'Closet',
    photo: img('real_slippers.jpg'), thumb: img('real_slippers.jpg'), thumbV: 2, order: now0, createdAt: now0, lastSeenAt: now0 - 3 * H, logId: 'l_' + id, photoCount: 2, history: [{ location: 'Closet', at: now0 }], restingOn: 'on the mat' },
    { id: id + 's1', kind: 'snap', owner: 'robert', by: 'robert', itemId: id, logId: 'l_' + id, photo: img('real_slippers.jpg'), thumb: img('real_slippers.jpg'), location: 'Closet', at: now0 - 3 * H, caption: 'on the mat' },
    { id: id + 's2', kind: 'snap', owner: 'robert', by: 'robert', itemId: id, logId: 'l_' + id, photo: img('closet.jpg'), thumb: img('closet.jpg'), location: 'Closet', at: now0 - 2 * H, extra: true }];

  // ============================== D1 · the Add photo pill ==============================
  {
    await seed(); await openThing('Slippers');
    const pill = page.locator('.d1-pill');
    check('D1 the thing page has an "Add photo" pill (camera icon + the words)', await pill.count() === 1 && /^Add photo$/.test((await pill.innerText()).trim()) && await pill.locator('svg').count() === 1);
    const pb = await box('.d1-pill'); const cardB = await box('.card.thing');
    check('D1 it is under the photo strip, on the caption line, right-aligned in the card', pb.y > (await box('.strip')).b - 1 && Math.abs(cardB.r - 12 - pb.r) <= 6, JSON.stringify({ pillRight: pb.r, cardRight: cardB.r }));
    check('D1 the pill is at least 44 px tall', pb.h >= 43.5, 'h=' + pb.h);
    // 09-29 (Ravi, reverses "centred on the first line"): the TOP of the caption's letters meets the TOP of the pill. The
    // 09-30: the caption is pulled up by the space above its capitals (margin-top = (1lh − 1cap)/−2; Safari ignores text-box on a
    // clamped box), so its BOX starts that much above the pill and its INK meets it — probe_cap.js checks the ink on the pixels.
    const cy = await page.evaluate(() => { const l = document.querySelector('.d1-cap .seen-line'); if (!l) return null; const p = document.querySelector('.d1-pill').getBoundingClientRect(); return { line: l.getBoundingClientRect().top, pill: p.top, pull: parseFloat(getComputedStyle(l).marginTop) }; });
    check('D1 the caption\'s box starts above the pill by the space over its capitals (the ink meets — probe_cap)', !!cy && cy.pull < 0 && Math.abs(cy.line - (cy.pill + cy.pull)) <= 1, JSON.stringify(cy));
    await shot('D1_add-photo-pill');
    // a long caption wraps on the left and the pill keeps its place
    await page.evaluate(() => { const l = document.querySelector('.d1-cap .seen-line'); l.textContent = 'In this photo: on the long orange carpet next to the white desk leg and the black wheel of the chair'; });
    const wrap = await page.evaluate(() => { const l = document.querySelector('.d1-cap .seen-line').getBoundingClientRect(); const p = document.querySelector('.d1-pill').getBoundingClientRect(); return { lineH: l.height, lineR: l.right, pillL: p.left, pillW: p.width }; });
    check('D1 a long caption wraps on the left (two lines at most) and never runs under the pill', wrap.lineH > 30 && wrap.lineH < 50 && wrap.lineR <= wrap.pillL + 1 && wrap.pillW > 90, JSON.stringify(wrap));
    await shot('D1_add-photo-pill-wrapped');
    check('D1 the "Add a photo" row is kept', await count('.tp-row:has-text("Add a photo")') === 1);
    await tap('.d1-pill', { wait: 700 });
    check('D1 the pill opens the add-photo camera, like the row', await count('.camera') === 1 && await count('.lc') === 0);
    SAME = { same: true, restingOn: 'on the woven mat' };
    await cam('drawer.jpg'); await tap('.shutter', { wait: 300 }); await tap('.camera-done', { wait: 2500 });
    check('D1 …and a photo taken there is added to the thing (4 snaps)', (await snapsOf('sl')).filter((s) => !s.deleted).length === 4);
    // D3: that add-photo went through looksLike, which returned restingOn → the new snap's caption
    const added = (await snapsOf('sl')).filter((s) => !s.deleted).sort((a, b) => b.at - a.at)[0];
    check('D3 the add-photo check\'s restingOn is stored as that snap\'s caption (no extra AI call)', added.caption === 'on the woven mat' && added.extra === true, JSON.stringify({ c: added.caption }));
    check('D3 …and the thing\'s own restingOn (the main photo) is untouched', (await doc('sl')).restingOn === 'on the orange carpet');
    // skipped check → caption ''
    SAME = { same: false, seen: 'a coffee cup', restingOn: 'on a saucer' };
    await tap('.d1-pill', { wait: 600 }); await cam('tin.jpg'); await tap('.shutter', { wait: 300 }); await tap('.camera-done', { wait: 2500 });
    const mism = await count('text=/anyway/i');
    check('D3 (setup) a photo the AI says is another thing raises the question', mism >= 1);
    if (mism) { await tap('text=/Add it to .* anyway/i', { wait: 2000 }); }
    const skipped = (await snapsOf('sl')).filter((s) => !s.deleted).sort((a, b) => b.at - a.at)[0];
    check('D3 when the check is skipped ("add it anyway") the caption is \'\'', !!skipped && skipped.photo !== added.photo && (skipped.caption === '' || skipped.caption === undefined), JSON.stringify({ c: skipped && skipped.caption, n: (await snapsOf('sl')).length }));
    SAME = { index: -1, sure: false };
    // viewers see no pill; editors do
    await seed(sharedThing('rb', 'viewer')); await openThing('Robert boots');
    check('D1 a viewer (can see) gets no Add photo pill and no row', await count('.d1-pill') === 0 && await count('.tp-row:has-text("Add a photo")') === 0);
    await seed(sharedThing('rb', 'editor')); await openThing('Robert boots');
    check('D1 an editor gets the pill (same rule as the row)', await count('.d1-pill') === 1 && await count('.tp-row:has-text("Add a photo")') === 1);
  }

  // ============================== D2 · the viewer (a thing's photos) + D3 captions ==============================
  {
    await seed(); await openThing('Slippers');
    const s1 = await doc('s1'), s2 = await doc('s2'), s3 = await doc('s3'); const before = await doc('sl');
    // D3: the caption line follows the photo centred in the strip: page 0 = s2, 1 = s3 (none), 2 = the cover s1
    check('D3 strip photo 1 (s2): "In this photo: by the front door mat"', /In this photo: by the front door mat/.test(await text('.seen-line')), await text('.seen-line'));
    await shot('D3_caption-photo1');
    await scrollStrip('.strip', 1);
    check('D3 swiped to photo 2 (no caption of its own, not the cover): nothing is shown', await count('.seen-line') === 0);
    await scrollStrip('.strip', 2);
    check('D3 swiped to photo 3 (the cover): its own caption "on the orange carpet"', /In this photo: on the orange carpet/.test(await text('.seen-line')), await text('.seen-line'));
    await shot('D3_caption-photo2');
    await scrollStrip('.strip', 0);

    // D2: tap the photo → the viewer
    await tap('.strip .photo-full', { wait: 500 });
    check('D2 tap a photo → the viewer opens (dialog over the page)', await count('.d2-pv') === 1 && await count('.thing-page') === 1);
    const vp = await page.evaluate(() => ({ h: window.innerHeight, w: window.innerWidth }));
    const pb = await box('.d2-photos'); const ib = await box('.d2-slide img'); const top = await box('.d2-top'); const bot = await box('.d2-bot');
    check('D2 the photo box is >= 80% of the screen\'s height', pb.h >= 0.8 * vp.h && ib.h >= 0.8 * vp.h, JSON.stringify({ box: Math.round(pb.h), img: Math.round(ib.h), need: Math.round(0.8 * vp.h) }));
    check('D2 only a small top bar and a small bottom bar around it (top+bottom <= 20%)', top.h + bot.h <= 0.2 * vp.h && Math.abs(top.h + pb.h + bot.h - vp.h) <= 2, JSON.stringify({ top: top.h, bot: bot.h }));
    const st = await page.evaluate(() => ({ fit: getComputedStyle(document.querySelector('.d2-slide img')).objectFit, snap: getComputedStyle(document.querySelector('.d2-photos')).scrollSnapType, bg: getComputedStyle(document.querySelector('.d2-pv')).backgroundColor }));
    check('D2 fitted (object-fit: contain), swipe by scroll-snap, dark translucent backdrop', st.fit === 'contain' && /x mandatory/.test(st.snap) && /rgba\(0, 0, 0, 0\.\d+\)/.test(st.bg), JSON.stringify(st));
    const meta = await text('.d2-meta');
    check('D2 the line reads "Photo 1 of 3 · <time>"', /^Photo 1 of 3 · /.test(meta), meta);
    check('D2 three dots, the first on', await count('.d2-dots i') === 3 && await count('.d2-dots i.on') === 1 && await page.locator('.d2-dots i').first().getAttribute('class') === 'on');
    const xb = await box('.d2-x');
    check('D2 ✕ is top-right, >= 44 px, labelled "Close"', xb.w >= 43.5 && xb.h >= 43.5 && xb.r > vp.w - 20 && xb.y < 20 && await page.locator('.d2-x').getAttribute('aria-label') === 'Close');
    const pills = await page.evaluate(() => [...document.querySelectorAll('.d2-bot .d2-pill')].map((b) => ({ t: b.innerText.trim(), h: b.getBoundingClientRect().height, l: b.getBoundingClientRect().left, svg: b.querySelectorAll('svg').length })));
    check('D2 bottom bar: "Make main" bottom-left and "Remove" bottom-right, each icon + word, >= 44 px', pills.length === 2 && pills[0].t === 'Make main' && pills[1].t === 'Remove' && pills.every((p) => p.h >= 43.5 && p.svg === 1) && pills[0].l < 40 && pills[1].l > vp.w / 2, JSON.stringify(pills));
    check('D3 the viewer shows "In this photo: …" under the line, with an Edit pill (pencil + Edit)', /In this photo: by the front door mat/.test(await text('.d2-cap')) && /^Edit$/.test((await text('.d2-edit')).trim()) && await page.locator('.d2-edit svg').count() === 1 && (await box('.d2-edit')).h >= 43.5);
    await shot('D2_viewer-thing');
    // swipe
    await scrollStrip('.d2-photos', 1);
    check('D2 swipe → "Photo 2 of 3", the second dot on, the caption line follows (none: "nothing said yet")', /^Photo 2 of 3 · /.test(await text('.d2-meta')) && await page.locator('.d2-dots i').nth(1).getAttribute('class') === 'on' && /nothing said yet/.test(await text('.d2-cap')));
    await scrollStrip('.d2-photos', 2);
    check('D2 …to photo 3 (the cover): the pill says "Main photo" (filled star, amber), pressed', (await text('.d2-pill.star')).trim() === 'Main photo' && await page.locator('.d2-pill.star').getAttribute('aria-pressed') === 'true' && await page.locator('.d2-pill.star svg').first().getAttribute('fill') === 'currentColor'
      && (await page.locator('.d2-pill.star').evaluate((b) => getComputedStyle(b).color)) === LEVEL1);
    await scrollStrip('.d2-photos', 0);
    // Make main
    await tap('.d2-pill.star', { wait: 900 });
    const after = await doc('sl');
    check('D2 Make main → the thing\'s photo/thumb are that photo\'s', after.photo === s2.photo && after.thumb === s2.thumb, '');
    check('D2 …DISPLAY only: location, lastSeenAt and logId did not change', after.location === before.location && after.lastSeenAt === before.lastSeenAt && after.logId === before.logId && (after.history || []).length === (before.history || []).length);
    check('D3 …and restingOn is that snap\'s caption ("by the front door mat")', after.restingOn === 'by the front door mat', after.restingOn);
    check('D2 the pill flips to "Main photo"', (await text('.d2-pill.star')).trim() === 'Main photo' && await page.locator('.d2-pill.star').getAttribute('aria-pressed') === 'true');
    await tap('.d2-x', { wait: 500 });
    check('D2 ✕ closes the viewer', await count('.d2-pv') === 0);
    await home();
    const tileSrc = await page.locator('.tile:has-text("Slippers") img').first().getAttribute('src');
    check('D2 the Home tile shows the new main photo', tileSrc === s2.thumb);
    await tap('.tile:has-text("Slippers")', { wait: 700 });
    check('D2 the page still has all three photos, none twice, the cover is the new main', await count('.strip .strip-page') === 3 && new Set(await page.locator('.strip img').evaluateAll((a) => a.map((x) => x.src))).size === 3);
    await scrollStrip('.strip', 2);
    check('D3 the old cover keeps its own caption when it is no longer main', /In this photo: on the orange carpet/.test(await text('.seen-line')), await text('.seen-line'));
    await scrollStrip('.strip', 0);
    // Remove the ORIGINAL cover snap (s1) while s2 is main: the main photo must not change (cover detection = photo === item.photo)
    await tap('.strip .photo-full', { wait: 500 }); await scrollStrip('.d2-photos', 2);
    check('D2 photo 3 is not the main one: "Make main"', (await text('.d2-pill.star')).trim() === 'Make main');
    await tap('.d2-pill.rm', { wait: 500 });
    check('D2 Remove → the existing Confirm ("Remove this photo?")', /Remove this photo\?/.test(await text('.sheet-title')));
    await tap('.sheet button:has-text("Remove")', { wait: 1200 });
    const afterRm = await doc('sl');
    check('D2 removed the old cover snap; the main photo did NOT change', (await doc('s1')).deleted === true && afterRm.photo === s2.photo && afterRm.restingOn === 'by the front door mat', JSON.stringify({ del: (await doc('s1')).deleted }));
    check('D2 the viewer closed and the toast offers Undo', await count('.d2-pv') === 0 && await count('.toast-undo') === 1);
    await tap('.toast-undo', { wait: 1000 });
    check('D2 Undo brings it back', (await doc('s1')).deleted === false && (await doc('sl')).photo === s2.photo);
    // remove the MAIN photo: the newest remaining becomes main, restingOn follows its caption (none)
    await home(); await tap('.tile:has-text("Slippers")', { wait: 700 });
    await tap('.strip .photo-full', { wait: 500 });
    await tap('.d2-pill.rm', { wait: 500 }); await tap('.sheet button:has-text("Remove")', { wait: 1200 });
    const afterMain = await doc('sl');
    check('D2 removing the MAIN photo hands main to the newest remaining; restingOn follows that photo\'s caption', (await doc('s2')).deleted === true && afterMain.photo === s3.photo && afterMain.restingOn === '', JSON.stringify({ photoIsS3: afterMain.photo === s3.photo, r: afterMain.restingOn }));
    await tap('.toast-undo', { wait: 1000 });
    check('D2 …and Undo restores both the photo and the caption', (await doc('s2')).deleted === false && (await doc('sl')).photo === s2.photo && (await doc('sl')).restingOn === 'by the front door mat');
    // backdrop closes; the photo itself does not
    await home(); await tap('.tile:has-text("Slippers")', { wait: 700 });
    await tap('.strip .photo-full', { wait: 500 });
    const c = await box('.d2-slide img'); const nat = await page.locator('.d2-slide img').first().evaluate((i) => ({ w: i.naturalWidth, h: i.naturalHeight }));
    const k = Math.min(c.w / nat.w, c.h / nat.h); const shownW = nat.w * k, shownH = nat.h * k;
    await page.mouse.click(c.x + c.w / 2, c.y + c.h / 2); await page.waitForTimeout(300);
    check('D2 a tap on the photo itself does not close it', await count('.d2-pv') === 1);
    const letterbox = shownW < c.w - 30 ? { x: c.x + 8, y: c.y + c.h / 2 } : { x: c.x + c.w / 2, y: c.y + 6 };
    await page.mouse.click(letterbox.x, letterbox.y); await page.waitForTimeout(300);
    check('D2 a tap on the dark backdrop closes it', await count('.d2-pv') === 0, JSON.stringify({ shownW, shownH, box: [c.w, c.h] }));
  }

  // ============================== D3 · Edit a caption ==============================
  {
    await seed(); await openThing('Slippers');
    await tap('.strip .photo-full', { wait: 500 });
    await tap('.d2-edit', { wait: 500 });
    check('D3 Edit opens the rename-style sheet "What’s in this photo?"', /What.s in this photo\?/.test(await text('.sheet-title')) && await count('.sheet input.place-input') === 1 && await page.locator('.sheet input').inputValue() === 'by the front door mat');
    const gap = await page.evaluate(() => document.querySelector('.sheet input').getBoundingClientRect().top - document.querySelector('.sheet .sheet-title').getBoundingClientRect().bottom);
    check('D3 the title keeps its 14 px gap above the text box (fix B3)', gap >= 13.5, 'gap=' + gap);
    await shot('D3_edit-sheet');
    await page.locator('.sheet input').fill('PIN 4821'); await page.waitForTimeout(200);
    check('D3 a secret typed as a caption is refused (Save off, the privacy note shows)', await page.locator('.sheet .btn-primary').isDisabled() && await count('.sheet .privnote') === 1);
    await page.locator('.sheet input').fill('on the blue rug'); await tap('.sheet .btn-primary', { wait: 900 });
    const s2 = await doc('s2');
    check('D3 Save writes the snap\'s caption', s2.caption === 'on the blue rug');
    check('D3 …not the thing\'s restingOn (that photo is not the main one)', (await doc('sl')).restingOn === 'on the orange carpet');
    check('D3 the viewer shows the new caption at once', /In this photo: on the blue rug/.test(await text('.d2-cap')));
    await page.evaluate(() => { document.querySelector('.d2-cap').textContent = 'In this photo: on the long orange carpet next to the white desk leg and the black wheel of the chair by the door'; });
    const longCap = await page.evaluate(() => ({ photos: document.querySelector('.d2-photos').getBoundingClientRect().height, top: document.querySelector('.d2-top').getBoundingClientRect().height, lines: Math.round(document.querySelector('.d2-cap').getBoundingClientRect().height / 17) }));
    check('D3 a long caption wraps to at most two lines in the top bar and the photo box stays >= 80%', longCap.photos >= 0.8 * 844 && longCap.lines <= 2 && longCap.lines >= 2, JSON.stringify(longCap));
    await shot('D3_viewer-long-caption');
    await scrollStrip('.d2-photos', 2); await tap('.d2-edit', { wait: 500 });
    await page.locator('.sheet input').fill('on the orange rug'); await tap('.sheet .btn-primary', { wait: 900 });
    check('D3 editing the MAIN photo\'s caption also updates the thing\'s restingOn', (await doc('s1')).caption === 'on the orange rug' && (await doc('sl')).restingOn === 'on the orange rug', JSON.stringify({ s1: (await doc('s1')).caption, r: (await doc('sl')).restingOn }));
    await tap('.d2-x', { wait: 400 });
    // old data: the cover with no snap caption shows restingOn; the other photo nothing (the cover is the older photo: page 1)
    await home(); await tap('.tile:has-text("Old lamp")', { wait: 700 });
    await scrollStrip('.strip', 0);
    const c0 = await text('.seen-line');
    await scrollStrip('.strip', 1);
    const c1 = await text('.seen-line');
    check('D3 (old data) the cover with no snap caption shows the thing\'s restingOn; the other photo shows nothing',
      (/In this photo: on the desk/.test(c1) && c0 === '') || (/In this photo: on the desk/.test(c0) && c1 === ''), JSON.stringify({ c0, c1 }));
    // an editor cannot Edit (the rules give helpers no write on an existing snap) but can Make main / Remove
    await seed(sharedThing('rb', 'editor')); await openThing('Robert boots');
    await tap('.strip .photo-full', { wait: 500 });
    check('D3 an editor sees no Edit pill; Make main / Remove are still there', await count('.d2-edit') === 0 && await count('.d2-pill.star') === 1 && await count('.d2-pill.rm') === 1);
    await seed(sharedThing('rb', 'viewer')); await openThing('Robert boots');
    await tap('.strip .photo-full', { wait: 500 });
    check('D2 a viewer can open the viewer but has no Edit / Make main / Remove', await count('.d2-pv') === 1 && await count('.d2-edit') === 0 && await count('.d2-pill') === 0);
  }

  // ============================== D2 · the place viewer ==============================
  {
    await seed(); await openThing('Slippers');
    await tap('.ph-open', { wait: 500 });
    check('D2 the place photo in "Where it is" opens the viewer', await count('.d2-pv') === 1);
    const t0 = await text('.d2-meta');
    check('D2 title "Closet · photo 1 of 3"; no caption line, no Edit', t0 === 'Closet · photo 1 of 3' && await count('.d2-cap') === 0 && await count('.d2-edit') === 0, t0);
    const pb = await box('.d2-photos');
    check('D2 the place photo box is >= 80% of the screen\'s height too', pb.h >= 0.8 * 844, 'h=' + pb.h);
    check('D2 photo 1 is the main one: "Main photo"', (await text('.d2-pill.star')).trim() === 'Main photo');
    await shot('D2_viewer-place');
    const placeBefore = (await doc('pcl')).photos.map((p) => p.at);
    await scrollStrip('.d2-photos', 2);
    check('D2 swipe → "Closet · photo 3 of 3", "Make main"', (await text('.d2-meta')) === 'Closet · photo 3 of 3' && (await text('.d2-pill.star')).trim() === 'Make main');
    await tap('.d2-pill.star', { wait: 900 });
    const placeAfter = (await doc('pcl')).photos.map((p) => p.at);
    check('D2 Make main reorders the place\'s photos: the chosen one first, the others in order', placeAfter[0] === placeBefore[2] && placeAfter[1] === placeBefore[0] && placeAfter[2] === placeBefore[1], JSON.stringify({ placeBefore, placeAfter }));
    check('D2 …the viewer opens on it: "photo 1 of 3", "Main photo"', (await text('.d2-meta')) === 'Closet · photo 1 of 3' && (await text('.d2-pill.star')).trim() === 'Main photo');
    await tap('.d2-pill.rm', { wait: 500 });
    check('D2 Remove → Confirm, then removePlacePhoto', /Remove this photo\?/.test(await text('.sheet-title')) && (await doc('pcl')).photos.length === 3);
    await tap('.sheet button:has-text("Remove")', { wait: 1000 });
    check('D2 the place has 2 photos and the viewer stays open on "photo 1 of 2"', (await doc('pcl')).photos.length === 2 && (await text('.d2-meta')) === 'Closet · photo 1 of 2');
    await tap('.d2-x', { wait: 400 });
    // a place with no photos: nothing to open
    await seed([{ id: 'x1', kind: 'item', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [], name: 'stray bolt', location: 'Loft', photo: img('keys.jpg'), thumb: img('keys.jpg'), thumbV: 2, order: now0, createdAt: now0, lastSeenAt: now0 - 10 * M, logId: 'l_x1', photoCount: 1, history: [{ location: 'Loft', at: now0 }] }]);
    await openThing('Stray bolt');
    check('D2 a place with no photos: nothing to tap (no button on the pin)', await count('.ph-open') === 0 && (await count('.tp-wone .no') + await count('.tp-wh .ch .no')) === 1); // 10-02: one where (.tp-wone)
    // press-and-hold on the photo keeps its old behaviour (the item sheet), and no viewer opens
    const pbx = await box('.strip .photo-full');
    await page.mouse.move(pbx.x + pbx.w / 2, pbx.y + pbx.h / 2); await page.mouse.down(); await page.waitForTimeout(750); await page.mouse.up(); await page.waitForTimeout(300);
    check('D2 press-and-hold on the photo still opens the item sheet (no viewer)', await count('.sheet-back') >= 1 && await count('.d2-pv') === 0);
  }

  // ============================== D4 · where it is, on the camera (10-01: the In chip) ==============================
  // 10-01 (release 1): the where-card's tiers, Choose place, the AI's place ask and "Place:" are gone (see Retired). D4's lasting
  // promises are kept: the place she gives is what Save writes, she can change it before saving, and the tag's caption lands on
  // the first photo (D3).
  const pickPlace = async (name) => {
    await page.click('.ow-go'); await page.waitForSelector('.ow-sheet'); await page.click('.ow-sheet .ow-lvl-change >> nth=0'); await page.waitForSelector('.in-list');
    await page.fill('.in-list .wl-search input', name); await page.waitForTimeout(200);
    const row = page.locator(`.in-list .wl-row:has(b:text-is("${name}"))`);
    if (await row.count()) await row.first().click(); else await page.locator('.in-list .wl-new').first().click();
    await page.waitForTimeout(250);
  };
  const chip = async () => { const v = await page.locator('.ow-input').first().inputValue().catch(() => ''); return v ? 'In: ' + v : ''; }; // 10-02: the where field
  const shootThing = async () => {
    await seed();
    AI = { name: 'lint brush', restingOn: 'on the orange carpet' }; SAME = { index: -1, sure: false };
    await home(); await cam('real_slippers.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
    if (await count('.lc-ask button:has-text("No, a new item")')) await tap('.lc-ask button:has-text("No, a new item")', { wait: 200 });
  };
  {
    await shootThing();
    await pickPlace('Desk drawer');
    check('D4 the In chip says "In: Desk drawer"', /^In: Desk drawer(?![a-z])/.test(await chip()), await chip());
    await shot('D4_in-chip');
    await tap('.lc-k.sv', { wait: 2500 });
    const lb = (await dump()).find((d) => d.kind === 'item' && d.name === 'lint brush');
    check('D4 Save closes the camera and writes the thing at Desk drawer', await count('.lc') === 0 && !!lb && lb.location === 'Desk drawer', JSON.stringify({ lc: await count('.lc'), loc: lb && lb.location }));
    const cs = lb ? (await snapsOf(lb.id)).find((s) => !s.extra) : null;
    check('D3 the first photo of a NEW thing gets the tag\'s restingOn as its snap caption', !!cs && cs.caption === 'on the orange carpet' && lb.restingOn === 'on the orange carpet', JSON.stringify({ c: cs && cs.caption }));
    // she changes her mind before saving: the chip follows, and Save writes the new one
    await shootThing(); await pickPlace('Desk drawer');
    await page.click('.ow-go'); await page.waitForSelector('.ow-sheet'); await page.click('.ow-sheet .ow-lvl-change >> nth=0'); await page.waitForSelector('.in-list');
    const second = (await page.locator('.in-list .wl-row b').allInnerTexts()).map((x) => x.trim()).find((x) => x !== 'Desk drawer' && !/box|bin/i.test(x));
    await page.locator(`.in-list .wl-row:has(b:text-is("${second}"))`).first().click(); await page.waitForTimeout(400);
    check('D4 picking another place sets it (the chip follows); the item\'s photo stays the item\'s', (await chip()).startsWith('In: ' + second) && await count('.lc-band .lc-thing.sel img') === 1, second + ' / ' + await chip());
    await tap('.lc-x', { wait: 300 }); if (await count('text=Throw away')) await tap('text=Throw away', { wait: 300 });
  }

  // ============================== D5 · the one list of where ==============================
  {
    // 10-01: Write it down uses the camera's "What is it in?" list (InList) — the one list of where in the app.
    await seed(); AI = { name: 'lint roller', restingOn: '' }; SAME = { index: -1, sure: false };
    await home(); await tap(LOG, { wait: 800 }); await tap('.lc-typeit button', { wait: 500 }); await page.waitForSelector('.note-card');
    await page.fill('#note-what', 'lint roller'); await tap('.note-card .path.in', { wait: 500 }); await page.waitForSelector('.in-list');
    check('D5 the search placeholder is "Search your places and boxes"', await page.locator('.in-list .wl-search input').getAttribute('placeholder') === 'Search your places and boxes');
    const sec = await page.evaluate(() => { const out = []; let cur = null; for (const el of document.querySelectorAll('.in-list .wl-scroll > *')) { if (el.classList.contains('wl-g')) { cur = { h: el.innerText.trim(), rows: [] }; out.push(cur); } else if (el.classList.contains('wl-row') && cur) cur.rows.push({ b: el.querySelector('b').innerText, s: el.querySelector('small').innerText, box: !!el.querySelector('.no svg') && !el.querySelector('img') }); } return out; });
    const allS = sec.find((x) => /^ALL YOUR PLACES AND BOXES · \d+$/i.test(x.h));
    check('D5 Recent, then "All your places and boxes · N" with N = the rows under it', !!allS && Number(allS.h.split('·')[1]) === allS.rows.length && allS.rows.length >= 3, JSON.stringify(sec.map((x) => [x.h, x.rows.length])));
    const rr = sec.flatMap((x) => x.rows);
    const bx = rr.find((r) => r.b === 'White cardboard box'), bn = rr.find((r) => r.b === 'Spare bin');
    check('D5 a box: box icon, second line "a box · in Garage" / "a box · no place yet"', !!bx && bx.s === 'a box · in Garage' && !!bn && bn.s === 'a box · no place yet' && bx.box && bn.box, JSON.stringify([bx, bn]));
    const ar = allS ? allS.rows : []; const firstBox = ar.findIndex((r) => /^a box · /.test(r.s)); const lastPlace = ar.map((r) => /^a box · /.test(r.s)).lastIndexOf(false);
    check('D5 in "All": places first, then the boxes', firstBox === -1 || firstBox > lastPlace, JSON.stringify(ar.map((r) => r.b)));
    check('D5 the old headings are gone', !/^(PLACES|BOXES AND CONTAINERS|YOUR PLACES · \d+)$/i.test(sec.map((x) => x.h).join('|')));
    check('D5 Cancel is kept', await count('.in-list .btn-quiet:has-text("Cancel")') === 1);
    await shot('D5_list');
    await page.locator('.in-list .wl-search input').fill('Attic'); await page.waitForTimeout(250);
    check('D5 typing a new name: "New place: Attic"', (await text('.in-list .wl-new')).trim() === 'New place: Attic', await text('.in-list .wl-new'));
    await page.locator('.in-list .wl-search input').fill('desk'); await page.waitForTimeout(250);
    check('D5 the count follows the search ("Your places · N" = rows shown)', /YOUR PLACES · (\d+)/i.test(await text('.in-list .wl-g')) && Number((await text('.in-list .wl-g')).split('·')[1]) === await count('.in-list .wl-row'), await text('.in-list .wl-g'));
    await tap('.in-list .btn-quiet:has-text("Cancel")', { wait: 300 });
  }

  check('no page errors / console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close(); server.close();
  const pass = results.filter((r) => r.ok).length;
  console.log(`\n${pass}/${results.length} passed`);
  if (pass !== results.length) process.exitCode = 1;
}
main().catch((e) => { console.error(e); server.close(); process.exit(1); });
