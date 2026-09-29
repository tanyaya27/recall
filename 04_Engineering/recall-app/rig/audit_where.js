// REQUIREMENTS_2026-09-27 R2 + R6: typed/picked places become real place docs, extra photos attach to a
// known thing on the chain, PLACE_PHOTOS 3 → 6 with a ~700 KB byte guard, and a where-created container
// (asWhere) is not a chore — it's excluded from Not put away and its tile shows a plain dash, not amber.
// Stage 2 (the camera itself) will drive saveChain through the UI and attach photos for real; here it is
// called directly through window.__rigdb, the same rig-only hook changeLocation/putInto/setHolds already
// use, so this suite proves the write-time behavior without needing the not-yet-built camera UI.
// node audit_where.js → PASS/FAIL, screenshots to shots/where-*.png
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const PORT = 8098; const ROOT = path.join(__dirname, 'out');
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, req.url.split('?')[0] === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
const results = []; const errors = [];
const check = (name, ok, note = '') => { results.push({ name, ok: !!ok, note }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${note ? ' — ' + note : ''}`); };
// A real (tiny) data URI — anything seeded as a top-level item's photo/thumb renders live on the board
// the whole time these DB-level calls run, so a plain placeholder string would 404 as an <img src>.
const DATAIMG = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
// Real photo files (rig/mock/img) — sections G onward drive the actual camera through shrink()/AI
// calls, which need decodable images (a placeholder data URI throws in loadImage() and the naming
// pass silently fails, exactly like a bad photo would in production).
const img = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(__dirname, 'mock/img', f)).toString('base64');
// The fake-AI route (walk_f1.js's pattern): AI names the thing; WHERE queue answers whereIs calls in
// order. `lastPool` records the last whereIs call's candidate count (R4.3's 4+4 pool check).
let AI = { name: 'thing' }; let WHERE = []; let lastPool = null;

async function main() {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const ctx = await browser.newContext({ permissions: ['camera'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  // A fake camera feed (walk_f1.js): paints whatever image `window.__cam` points at into a canvas
  // stream, so `getUserMedia` returns real, decodable frames instead of Playwright's blank fake device.
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
      lastPool = [...texts.matchAll(/SAVED \d+ —/g)].length;
      const w = WHERE.shift() || { name: 'shelf', moves: false };
      let index = 0; if (w.known) { const m = [...texts.matchAll(/SAVED (\d+) — "([^"]*)"/g)].find((x) => x[2].toLowerCase() === w.known.toLowerCase()); index = m ? Number(m[1]) : 0; }
      out = { name: w.name, moves: !!w.moves, index, sure: !!index };
    } else if (/NEW PHOTO/.test(texts)) out = { index: -1, sure: false };
    else if (images) out = { name: AI.name, sameAs: AI.sameAs || '', alternatives: [], restingOn: '', placeCertain: !!AI.placeCertain, placeGuesses: AI.placeGuesses || [], description: '', details: '', private: false, privateWhy: '', secretVisible: false };
    else out = { matches: [], message: '' };
    await new Promise((r) => setTimeout(r, 100));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [{ type: 'text', text: JSON.stringify(out) }] }) });
  });
  const page = await ctx.newPage();
  // 09-29 camera card: after a where photo, wait while ReCall looks; if "Choose place" opened to name it, take ReCall's
  // name (or a made-up one when there is none / it's taken) — the old camera named it silently.
  const settleWhere = async (fallback = '') => {
    for (let k = 0; k < 40; k++) { if (!(await page.locator('.lv-look').count())) break; await page.waitForTimeout(150); }
    await page.waitForTimeout(300);
    if (await page.locator('.wl-pend .btn-primary').count()) {
      if (await page.locator('.wl-pend .btn-primary').isDisabled()) await page.locator('.wl-pend input').fill(fallback || ('Spot ' + (Date.now() % 100000)));
      await page.click('.wl-pend .btn-primary'); await page.waitForTimeout(300);
    }
  };
  const pickPlace = async (name) => { await page.click('.lc-choose'); await page.waitForSelector('.where-list'); await page.fill('.wl-search input', name); await page.waitForTimeout(150); await page.click(`.where-list .wl-row:has-text("${name}")`); await page.waitForTimeout(350); };
  const saveNext = async () => { const b = await page.locator('.lc-k.sv').boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await page.waitForTimeout(800); await page.mouse.up(); await page.waitForTimeout(400); };
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/camera/.test(m.text())) errors.push('console: ' + m.text().slice(0, 160)); });
  const shot = async (n) => { await page.waitForTimeout(250); await page.screenshot({ path: `shots/where-${n}.png` }); };
  const count = (sel) => page.locator(sel).count();
  const text = (sel) => page.locator(sel).first().innerText().catch(() => '');
  const dump = (c) => page.evaluate((c) => window.__rig.dump(c), c);
  const items = async () => (await dump()).filter((d) => d.kind === 'item' && !d.deleted);
  const places = async () => (await dump()).filter((d) => d.kind === 'place');
  const snaps = async () => (await dump()).filter((d) => d.kind === 'snap');
  const byName = async (n) => (await items()).find((d) => d.name === n);
  const placeByName = async (n) => (await places()).find((d) => d.name.toLowerCase() === n.toLowerCase());
  // Calls a window.__rigdb function (the rig-only hook: db.js, gated by __RIG__) directly, the same way
  // audit_graph.js proves changeLocation/putInto/setHolds at write time.
  const rigdb = (fn, ...args) => page.evaluate(({ fn, args }) => window.__rigdb[fn](...args), { fn, args });
  const boot = async (uid) => {
    await page.evaluate((u) => { localStorage.setItem('rig-uid', u); localStorage.setItem('rig-anon', '0'); localStorage.setItem('recall-ai-config', JSON.stringify({ provider: 'anthropic', apiKey: 'sk-ant-rig', model: '' })); }, uid);
    await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen'); await page.waitForTimeout(400);
  };
  // ---- camera-driving helpers (sections G onward), same shapes as rig/walk_f1.js
  const tap = async (sel, opts = {}) => { await page.locator(sel).first().click(opts); await page.waitForTimeout(opts.wait || 450); };
  const type = async (sel, s) => { await page.locator(sel).first().fill(s); await page.waitForTimeout(250); };
  const cam = async (f) => { await page.evaluate((s) => { window.__cam = s; }, img(f)); await page.waitForTimeout(220); };
  const setPrefs = (patch) => page.evaluate((p) => { const x = JSON.parse(localStorage.getItem('recall-prefs') || '{}'); Object.assign(x, p); localStorage.setItem('recall-prefs', JSON.stringify(x)); }, patch);
  const home = async () => { await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen'); await page.waitForTimeout(350); };
  const LOG = '.footer .btn-primary:not(.alt)';
  const minH = (sel) => page.locator(sel).first().evaluate((el) => el.getBoundingClientRect().height);

  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen');
  await page.evaluate(() => { localStorage.clear(); window.__rig.reset(); });
  await boot('dad');
  const now = Date.now(), H = 3600e3;
  const T = (id, name, location, extra = {}) => ({ id, kind: 'item', owner: 'dad', by: 'dad', private: false, roles: {}, sharedWith: [], name, location,
    photo: null, thumb: null, thumbV: 2, order: now, createdAt: now, lastSeenAt: now, photoCount: 0, history: [{ location, at: now }], ...extra });
  const E = (id, from, to, ago = 0) => ({ id, kind: 'edge', rel: 'in', from, to, since: now - ago, until: null, how: 'chosen', owner: 'dad', by: 'dad', private: false, roles: {}, sharedWith: [] });

  // ============================================================================================
  // A. R2 — a typed/picked PLACE link becomes a real place doc.
  // ============================================================================================
  let r = await rigdb('saveChain', [{ known: { t: 'place', name: 'Attic' } }], { owner: 'dad', places: [] });
  let attic = await placeByName('Attic');
  check('A1 known place link → a real place doc is created', !!attic, JSON.stringify(attic && attic.id));
  check('A2 saveChain returns the place as first.dest/placeId', r.first.dest.t === 'place' && r.first.dest.name === 'Attic' && r.first.placeId === attic.id);
  check('A3 made.places tracks the NEW place (it did not exist before)', r.made.places.length === 1 && r.made.places[0] === attic.id, JSON.stringify(r.made));

  // Same known place again, this time telling saveChain about the place that already exists (the
  // live `places` prop the real app would pass) — no duplicate doc, made.places stays empty.
  const before = (await places()).length;
  r = await rigdb('saveChain', [{ known: { t: 'place', name: 'Attic' } }], { owner: 'dad', places: await places() });
  check('A4 picking the SAME known place again makes no second doc', (await places()).length === before && r.made.places.length === 0, `places=${(await places()).length}`);

  // A two-level known-place chain (chain[0] innermost, chain[last] outermost, DECISIONS 2026-09-25):
  // 09-29 (tier audit): the inner place is IN the outer one by an edge from the place doc (DECISIONS 09-25: "is in" is an
  // edge, never a field). This check used to assert the `parent` field, which nothing read — the audit encoded the bug.
  r = await rigdb('saveChain', [{ known: { t: 'place', name: 'Top drawer' } }, { known: { t: 'place', name: 'Office' } }], { owner: 'dad', places: [] });
  const office = await placeByName('Office'); const drawer = await placeByName('Top drawer');
  const dEdge = drawer ? (await page.evaluate(() => window.__rig.dump())).find((e) => e.kind === 'edge' && e.from === drawer.id && !e.until) : null;
  check('A5 nested known places: the inner one is IN the outer one (an edge from the place)', !!office && !!drawer && !!dEdge && dEdge.to.t === 'place' && dEdge.to.name === 'Office', JSON.stringify({ office: office && office.id, edge: dEdge && dEdge.to }));

  // A known place link with a photo the camera attached at that level (l.placePhotos, Stage 2) — the
  // photo lands on the place doc through the same addPlace call, not lost.
  r = await rigdb('saveChain', [{ known: { t: 'place', name: 'Pantry shelf' }, placePhotos: [{ photo: 'PANTRY_PHOTO', thumb: 'pantry_thumb' }] }], { owner: 'dad', places: [] });
  const pantry = await placeByName('Pantry shelf');
  check('A6 a photo attached to a known-place link lands on its place doc', !!pantry && pantry.photos.length === 1 && pantry.photos[0].photo === 'PANTRY_PHOTO', JSON.stringify(pantry && pantry.photos));

  // ============================================================================================
  // B. R2 — extra photos attached to a known THING on the chain (l.extraPhotos, Stage 2).
  // ============================================================================================
  await page.evaluate((s) => window.__rig.seed(s), [T('bx', 'tin box', 'Garage', { photo: DATAIMG, thumb: DATAIMG, photoCount: 1, logId: 'log_bx' })]);
  await page.waitForTimeout(250);
  let bx = await byName('tin box');
  r = await rigdb('saveChain', [{ known: { t: 'thing', item: bx }, extraPhotos: [{ photo: 'EX1', thumb: 'ex1' }, { photo: 'EX2', thumb: 'ex2' }] }], { owner: 'dad', places: [] });
  const bxSnapsExtra = (await snaps()).filter((s) => s.itemId === 'bx' && s.extra);
  bx = await byName('tin box');
  check('B1 extra photos on a known thing → new extra snaps (same mechanism as any other extra shot)', bxSnapsExtra.length === 2, JSON.stringify(bxSnapsExtra.map((s) => s.photo)));
  check('B2 …and the item\'s photoCount is bumped to match', bx.photoCount === 3, `photoCount=${bx.photoCount}`);

  // No extraPhotos on the link → no-op, nothing added (a known thing with nothing attached this time).
  const before2 = (await snaps()).length;
  const n = await rigdb('addItemPhotos', bx, []);
  check('B3 addItemPhotos with nothing to add is a no-op', n === 0 && (await snaps()).length === before2);

  // ============================================================================================
  // C/D. PLACE_PHOTOS 3 → 6, and the ~700 KB byte guard on addPlacePhotos.
  // ============================================================================================
  const kb = (n) => 'x'.repeat(n * 1024); // a fake base64 payload of about n KB — addPlacePhotos only sums string lengths
  await page.evaluate((s) => window.__rig.seed(s, undefined), []); // no-op, keeps the seed helper pattern consistent
  const PL = (id, name, photos) => ({ id, kind: 'place', owner: 'dad', by: 'dad', private: false, name, order: now, createdAt: now, parent: null, photos });

  // C1: 5 small photos already saved; adding 3 more small ones caps at 6, not 8.
  await page.evaluate((s) => window.__rig.seed(s), [PL('pc1', 'Cap test 1', [1, 2, 3, 4, 5].map((i) => ({ photo: 'p' + i, thumb: 't' + i, at: now })))]);
  await page.waitForTimeout(150);
  let pc1 = (await places()).find((p) => p.id === 'pc1');
  await rigdb('addPlacePhotos', pc1, [{ photo: 'p6', thumb: 't6' }, { photo: 'p7', thumb: 't7' }, { photo: 'p8', thumb: 't8' }]);
  pc1 = (await places()).find((p) => p.id === 'pc1');
  check('C1 PLACE_PHOTOS caps at 6 (was 3), even offered 3 more on top of 5 — main kept, oldest others out', pc1.photos.map((p) => p.photo).join(',') === 'p1,p4,p5,p6,p7,p8', pc1.photos.map((p) => p.photo).join(','));

  // C2: already at 6 — 09-29 ruling (Ravi): the new photos REPLACE the oldest, the list stays at 6, the main photo stays.
  await rigdb('addPlacePhotos', pc1, [{ photo: 'p9', thumb: 't9' }, { photo: 'p10', thumb: 't10' }]);
  pc1 = (await places()).find((p) => p.id === 'pc1');
  const c2 = pc1.photos.map((p) => p.photo).join(',');
  check('C2 already-full place stays at 6: main kept, the 2 new ones in, the 2 oldest others out', c2 === 'p1,p6,p7,p8,p9,p10', c2);

  // D1: the byte guard (~700 KB) — a photo that alone can never fit is skipped; of the rest, the newest win.
  await page.evaluate((s) => window.__rig.seed(s), [PL('pc2', 'Byte test', [])]);
  await page.waitForTimeout(150);
  let pc2 = (await places()).find((p) => p.id === 'pc2');
  await rigdb('addPlacePhotos', pc2, [
    { photo: kb(750), thumb: '' },  // alone already over ~700 KB — skipped
    { photo: kb(300), thumb: '' },
    { photo: kb(300), thumb: '' },
    { photo: kb(300), thumb: '' },  // three of 300 = 900 KB — one has to go
  ]);
  pc2 = (await places()).find((p) => p.id === 'pc2');
  const totalBytes = pc2.photos.reduce((n, p) => n + (p.photo || '').length + (p.thumb || '').length, 0);
  check('D1 byte guard: the oversized one skipped, the rest kept up to ~700 KB', pc2.photos.length === 2 && totalBytes <= 700 * 1024, `kept=${pc2.photos.length} bytes=${totalBytes}`);

  // D2: the main photo is never dropped; a new photo too big to sit beside it is skipped, a small one gets in.
  await page.evaluate((s) => window.__rig.seed(s), [PL('pc3', 'Byte test 2', [{ photo: kb(650), thumb: '', at: now }])]);
  await page.waitForTimeout(150);
  let pc3 = (await places()).find((p) => p.id === 'pc3');
  await rigdb('addPlacePhotos', pc3, [{ photo: kb(10), thumb: '' }, { photo: kb(200), thumb: '' }]);
  pc3 = (await places()).find((p) => p.id === 'pc3');
  check('D2 the main photo is untouched; the small new one that fits is kept', pc3.photos.length === 2 && pc3.photos[0].photo.length === 650 * 1024 && pc3.photos[1].photo.length === 10 * 1024, `kept=${pc3.photos.length}`);

  // D3: over the byte budget with room by count — the OLDEST non-main photo makes way for the new one.
  await page.evaluate((s) => window.__rig.seed(s), [PL('pc4', 'Byte test 3', [{ photo: kb(100), thumb: 'm', at: now - 3 }, { photo: kb(200), thumb: 'old', at: now - 2 }, { photo: kb(200), thumb: 'mid', at: now - 1 }])]);
  await page.waitForTimeout(150);
  let pc4 = (await places()).find((p) => p.id === 'pc4');
  await rigdb('addPlacePhotos', pc4, [{ photo: kb(300), thumb: 'new' }]);
  pc4 = (await places()).find((p) => p.id === 'pc4');
  check('D3 byte guard rotates: main + newest kept, the oldest other photo goes', pc4.photos.map((p) => p.thumb).join(',') === 'm,mid,new', pc4.photos.map((p) => p.thumb).join(','));

  // ============================================================================================
  // E. R6.1 — a where-created container (the camera's moves branch) is marked asWhere.
  // ============================================================================================
  r = await rigdb('saveChain', [{ photo: DATAIMG, thumb: DATAIMG, moves: true, name: 'random tin' }], { owner: 'dad', places: [] });
  const tin = (await items()).find((it) => it.id === r.made.items[0]);
  check('E1 a new box made because it is WHERE something else goes is marked asWhere', !!tin && tin.asWhere === true, JSON.stringify(tin && tin.asWhere));

  // A plain addItem (not through the chain's moves branch) never gets asWhere — it's opt-in, not a default.
  const plainId = await rigdb('addItem', { name: 'plain thing', owner: 'dad' });
  const plain = (await items()).find((it) => it.id === plainId);
  check('E2 an ordinary addItem call has no asWhere flag', plain && plain.asWhere !== true);

  // ============================================================================================
  // F. R6.2 — Not put away (list + count) and the board tile both leave asWhere containers alone.
  // ============================================================================================
  await page.evaluate(() => { localStorage.clear(); window.__rig.reset(); });
  await boot('dad');
  await page.evaluate((s) => window.__rig.seed(s), [
    T('sock', 'loose sock', ''),                                           // ordinary: no place yet, IS a chore
    T('tin', 'random tin', '', { asWhere: true, holds: true }),            // asWhere, no place: NOT a chore
    T('tin2', 'second tin', 'Garage', { asWhere: true, holds: true }),     // asWhere, but already has a place
    T('tin3', 'third tin', '', { asWhere: true, holds: true }),           // asWhere, no place, holds something
    T('inside3', 'thing in tin3', '', {}),
    E('e3', 'inside3', { t: 'thing', id: 'tin3', name: 'third tin' }),
  ]);
  await page.waitForTimeout(400);

  check('F1 Home: "Not put away" counts only the ordinary sock, not the asWhere tins', /Not put away · 1/.test(await text('.notput')), await text('.notput'));
  await page.click('.notput'); await page.waitForSelector('.notput-page'); await page.waitForTimeout(200);
  check('F2 Not put away list: the sock is there, no asWhere tin is', /loose sock/i.test(await text('.notput-page')) && !/random tin|third tin/i.test(await text('.notput-page')));
  await page.click('.chev'); await page.waitForSelector('.board'); await page.waitForTimeout(200);
  await shot('1-board');

  check('F3 tile: ordinary item with no place — still the amber "No place yet" block (unchanged)',
    await count('.tile:has-text("Loose sock") .tile-label.noplace') === 1 && /No place yet/.test(await text('.tile:has-text("Loose sock") .tile-sub')));
  check('F4 tile: asWhere container with no place — no amber flip, a plain dash instead',
    await count('.tile:has-text("Random tin") .tile-label.noplace') === 0 && (await text('.tile:has-text("Random tin") .tile-sub.dash')).trim() === '—');
  check('F5 tile: asWhere container that already has a place — reads exactly like any other tile',
    await count('.tile:has-text("Second tin") .tile-label.noplace') === 0 && /Garage/.test(await text('.tile:has-text("Second tin") .tile-sub.place')) && await count('.tile:has-text("Second tin") .tile-sub.dash') === 0);
  check('F6 tile: asWhere + holds something — the dash AND the "N inside" badge both show',
    (await text('.tile:has-text("Third tin") .tile-sub.dash')).trim() === '—' && /1 inside/.test(await text('.tile:has-text("Third tin") .inbadge')));

  check('E0 no page errors', errors.length === 0, errors.join(' | '));

  // ============================================================================================
  // Stage 2/3 — the camera itself, driven through the real UI (the fake-AI route pattern from
  // rig/walk_f1.js): R1 (attach), R3 (rename per level), R4 (collisions, pool, single-ask), R5
  // (chain sheet), R6.4 (soft nudge), R7 (both looks). Sections A–F above proved the write-time
  // mechanics through window.__rigdb; these prove the screen actually drives them.
  // ============================================================================================
  async function seedWhereHouse(uid = 'wh') {
    await page.evaluate(() => { localStorage.clear(); window.__rig.reset(); });
    await boot(uid);
    const now = Date.now(), H = 3600e3;
    const P = (f) => ({ photo: img(f), thumb: img(f), thumbV: 2 });
    const T = (id, name, location, f, ago, extra = {}) => ({ id, kind: 'item', owner: uid, by: uid, private: false, roles: {}, sharedWith: [], name, location,
      ...(f ? P(f) : { photo: null, thumb: null }), order: now - ago, createdAt: now - ago, lastSeenAt: now - ago, logId: 'l_' + id, photoCount: f ? 1 : 0, history: [{ location, at: now - ago }], ...extra });
    const seed = [
      T('bx1', 'wooden box', 'Garage', 'smallbox.jpg', 80 * H, { holds: true }),
      T('bx2', 'tool drawer', 'Garage', 'drawer.jpg', 70 * H, { holds: true }),
      { id: 'pl1', kind: 'place', owner: uid, by: uid, private: false, name: 'Kitchen counter', order: 1, createdAt: now - 99 * H, parent: null, photos: [{ photo: img('closet.jpg'), thumb: img('closet.jpg'), at: now - 99 * H }] },
      { id: 'pl2', kind: 'place', owner: uid, by: uid, private: false, name: 'Hall table', order: 2, createdAt: now - 98 * H, parent: null, photos: [{ photo: img('book.jpg'), thumb: img('book.jpg'), at: now - 98 * H }] },
    ];
    await page.evaluate((s) => window.__rig.seed(s), seed);
    await page.waitForTimeout(400);
  }

  // ---- G. R1 — a level with an identity APPENDS photos and keeps that identity (kills F1) ----
  // 09-29g camera card: places are picked with "☰ Choose place"; the strip holds place squares only (level 1 = .lv-sq nth 0).
  console.log('\n---- R1 (attach, never replace) ----');
  await seedWhereHouse('wh1');
  const openTier = async (i) => { const sq = page.locator('.lv-strip .lv-sq').nth(i); if (!/\bsel\b/.test(await sq.getAttribute('class'))) { await sq.click(); await page.waitForTimeout(300); } await sq.click(); await page.waitForTimeout(400); };
  const sayT = async () => (await text('.lc-say b')).replace(/^Place:\s*/, '').trim();
  AI = { name: 'nail clippers' }; WHERE = [];
  await home(); await cam('real_slippers.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
  await pickPlace('Garage'); // a KNOWN place with 0 photos (a location name only)
  check('G1 a picked place with 0 photos: "Place: Garage", the camera stays on it (its square selected)', /^garage$/i.test(await sayT()) && await count('.lv-sq.sel') === 1, await sayT());
  await cam('real_desk.jpg'); await tap('.lc-shutter', { wait: 1400 }); // shot #1 on the identified level
  await shot('g1-attach-shot1');
  check('G2 R1.1/1.2: after a photo, the line still names the PICKED place, not "Looking…"', /^garage$/i.test(await sayT()) && await count('.wl-pend') === 0, await sayT());
  await cam('real_painting.jpg'); await tap('.lc-shutter', { wait: 1400 }); // shot #2
  const badge2 = await page.locator('.lv-strip .lv-sq').nth(0).locator('.lv-n').innerText().catch(() => '');
  check('G3 R1.2: the level square badge shows the count (2) after two attached photos', badge2 === '2', badge2);
  const placeBefore = await placeByName('Garage');
  await tap('.lc-k.sv', { wait: 1500 });
  const placeAfter = await placeByName('Garage');
  check('G4 R1.5/R2.2: Save sends the attached photos to the SAME place (no second doc)',
    !!placeAfter && placeAfter.photos.length === (placeBefore ? placeBefore.photos.length : 0) + 2 && (await places()).filter((p) => p.name.toLowerCase() === 'garage').length === 1,
    `before=${placeBefore && placeBefore.photos.length} after=${placeAfter && placeAfter.photos.length}`);

  // R1.3: removing the LAST attached photo of an identified level keeps the identity.
  AI = { name: 'spare key' }; WHERE = [];
  await home(); await cam('real_pencil.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
  await pickPlace('wooden box');
  await cam('real_spoon.jpg'); await tap('.lc-shutter', { wait: 1400 });
  await page.locator('.lv-strip .lv-sq').nth(0).click(); await page.waitForTimeout(400); // selected square → its sheet
  await tap('.tier-sheet .sheet-row:has-text("See its photos")', { wait: 500 });
  await shot('g5-before-remove');
  check('G5a its photos open from the level\'s sheet, with the one attached photo removable', await count('.pv-rm') === 1);
  await tap('.pv-rm', { wait: 500 });
  check('G5b R1.3: removing the last attached photo KEEPS the identity — still "Place: In the wooden box"', /^in the wooden box$/i.test(await sayT()), await sayT());
  await tap('.lc-x', { wait: 400 }); if (await count('text=Throw away')) await tap('text=Throw away', { wait: 400 });

  // R1.4 (regression guard): a level with NO identity still runs the naming pass.
  AI = { name: 'measuring tape' }; WHERE = [{ name: 'garage shelf b', moves: false }];
  await home(); await cam('real_cetaphil.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
  await tap('.lv-sq.plus', { wait: 300 }); await cam('box14.jpg'); await tap('.lc-shutter', { wait: 100 });
  const lookShown = await count('.lv-look') > 0;
  await page.waitForTimeout(1500);
  const draftG6 = await page.locator('.wl-pend input').inputValue().catch(() => '');
  check('G6 R1.4: a level with no identity is looked at, then offered with ReCall\'s name to confirm', (lookShown || /garage shelf b/i.test(draftG6)) && /garage shelf b/i.test(draftG6), `look=${lookShown} draft=${draftG6}`);
  await settleWhere();
  await tap('.lc-x', { wait: 400 }); if (await count('text=Throw away')) await tap('text=Throw away', { wait: 400 });

  // ---- H. R3 — rename a level right there (its sheet → Rename) ----
  console.log('\n---- R3 (rename per level) ----');
  await seedWhereHouse('wh2');
  AI = { name: 'usb hub' }; WHERE = [{ name: 'linen shelf', moves: false }];
  await home(); await cam('real_desk.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
  await tap('.lv-sq.plus', { wait: 300 }); await cam('closet.jpg'); await tap('.lc-shutter', { wait: 200 });
  await settleWhere(); // takes ReCall's "linen shelf"
  await page.locator('.lv-strip .lv-sq').nth(0).click(); await page.waitForTimeout(400);
  check('H1a the selected square opens its sheet: See its photos / Choose place / Rename / Remove this level',
    await count('.tier-sheet') === 1 && /See its photos[\s\S]*Choose place[\s\S]*Rename[\s\S]*Remove this level/.test(await text('.tier-sheet')), await text('.tier-sheet'));
  await tap('.tier-sheet .sheet-row:has-text("Rename")', { wait: 400 });
  check('H1b Rename opens "What is it called?" pre-filled with the level\'s current name', /What is it called/.test(await text('.sheet-title')) && /linen shelf/i.test(await page.locator('.sheet input.place-input').first().inputValue()));
  await type('.sheet input.place-input', 'Craft shelf');
  await tap('.sheet .btn-primary', { wait: 700 });
  check('H2 R3.2: the given name shows at once', /^craft shelf$/i.test(await sayT()), await sayT());
  await tap('.lc-k.sv', { wait: 1500 });
  check('H2b the doc is created with the USER name, never the AI\'s "linen shelf"', !!(await placeByName('Craft shelf')) && !(await placeByName('linen shelf')));

  // ---- I. R4 — collisions never merge silently; single ask; 4+4 pool ----
  console.log('\n---- R4 (name-collision ask) ----');
  await seedWhereHouse('wh3');
  // I1/I2: AI names a NEW where-photo the same as an ALREADY-SAVED place → "Is this the X?" → Yes merges.
  AI = { name: 'travel adapter' }; WHERE = [{ name: 'Kitchen counter', moves: false }];
  await home(); await cam('real_cetaphil.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
  await tap('.lv-sq.plus', { wait: 300 }); await cam('closet.jpg'); await tap('.lc-shutter', { wait: 1700 });
  check('I1 R4.2/4.5: a same-NAME (not visually sure) match still asks "Is this the Kitchen counter?"', /Is this the Kitchen counter\?/.test(await text('.lc-ask2')), await text('.lc-ask2'));
  check('I2 R4.2: Save is off while the ask is unresolved', await page.locator('.lc-k.sv').isDisabled());
  const kcBefore = await placeByName('Kitchen counter');
  await tap('.lc-ask2 button:has-text("Yes")', { wait: 500 });
  await tap('.lc-k.sv', { wait: 1500 });
  const kcAfter = await placeByName('Kitchen counter');
  const placesNamedKC = (await places()).filter((p) => p.name === 'Kitchen counter');
  check('I3 R4.5: Yes → the photo lands on the EXISTING place, no second doc',
    placesNamedKC.length === 1 && kcAfter.photos.length === kcBefore.photos.length + 1, `docs=${placesNamedKC.length} photos ${kcBefore.photos.length}->${kcAfter.photos.length}`);

  // I4/I5: same, but "No, ☰ Choose place" → the name field says it's taken → a new name → two docs after Save.
  AI = { name: 'phone stand' }; WHERE = [{ name: 'Hall table', moves: false }];
  await home(); await cam('real_painting.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
  await tap('.lv-sq.plus', { wait: 300 }); await cam('book.jpg'); await tap('.lc-shutter', { wait: 1700 });
  await tap('.lc-ask2 button.o', { wait: 600 });
  check('I4a No opens Choose place with the name field, and says "Hall table" is taken', await count('.wl-pend input') === 1 && /already have a place called .Hall table./.test(await text('.wl-taken')), await text('.wl-taken'));
  check('I4b "Use this name" is off while the name is taken', await page.locator('.wl-pend .btn-primary').isDisabled());
  await page.locator('.wl-pend input').fill('Hall table west'); await page.waitForTimeout(250);
  check('I4c the gate clears once the name differs', !(await page.locator('.wl-pend .btn-primary').isDisabled()));
  await tap('.wl-pend .btn-primary', { wait: 400 });
  await tap('.lc-k.sv', { wait: 1500 });
  check('I5 R4.5: No + a new name → TWO place docs after Save (Mei\'s five Shelves stay five)',
    !!(await placeByName('Hall table')) && !!(await placeByName('Hall table west')));

  // I6: candidate pool is 4 boxes + 4 places (was 2) — assert the actual whereIs request body.
  await seedWhereHouse('wh4');
  const now2 = Date.now(), H2 = 3600e3;
  const extraPlaces = ['Place A', 'Place B', 'Place C', 'Place D', 'Place E'].map((n, i) => ({ id: 'ep' + i, kind: 'place', owner: 'wh4', by: 'wh4', private: false, name: n, order: i + 10, createdAt: now2 - (10 + i) * H2, parent: null, photos: [{ photo: img('closet.jpg'), thumb: img('closet.jpg'), at: now2 }] }));
  const extraBoxes = ['Bin A', 'Bin B', 'Bin C', 'Bin D', 'Bin E'].map((n, i) => ({ id: 'eb' + i, kind: 'item', owner: 'wh4', by: 'wh4', private: false, roles: {}, sharedWith: [], name: n, location: 'Garage', photo: img('box.jpg'), thumb: img('box.jpg'), thumbV: 2, holds: true, order: i + 20, createdAt: now2 - (20 + i) * H2, lastSeenAt: now2 - (20 + i) * H2, photoCount: 1, history: [{ location: 'Garage', at: now2 }] }));
  await page.evaluate((s) => window.__rig.seed(s), [...extraPlaces, ...extraBoxes]);
  await page.waitForTimeout(400);
  AI = { name: 'wrench' }; WHERE = [{ name: 'new spot', moves: false }]; lastPool = null;
  await home(); await cam('real_desk.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
  await tap('.lv-sq.plus', { wait: 300 }); await cam('drawer.jpg'); await tap('.lc-shutter', { wait: 1700 });
  check('I6 R4.3: the whereIs candidate pool is 4 boxes + 4 places = 8 (was 2 places)', lastPool === 8, `lastPool=${lastPool}`);
  await settleWhere();

  // I7: single-ask priority — a pending THING-identity ask suppresses a level ask (R4.4/F7).
  await seedWhereHouse('wh5');
  await page.evaluate((s) => window.__rig.seed(s), [{ id: 'existing', kind: 'item', owner: 'wh5', by: 'wh5', private: false, roles: {}, sharedWith: [], name: 'garden shears', location: 'Garage',
    photo: img('real_desk.jpg'), thumb: img('real_desk.jpg'), thumbV: 2, order: 1, createdAt: Date.now() - H2, lastSeenAt: Date.now() - H2, photoCount: 1, history: [{ location: 'Garage', at: Date.now() }] }]);
  await page.waitForTimeout(300);
  AI = { name: 'garden shears', sameAs: 'garden shears' }; WHERE = [{ name: 'Kitchen counter', moves: false }];
  await home(); await cam('real_desk.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
  const identityAskUp = await count('.lc-ask') === 1;
  if (await count('.lv-sq.plus')) { await tap('.lv-sq.plus', { wait: 300 }); await cam('closet.jpg'); await tap('.lc-shutter', { wait: 1700 }); }
  const i7n = await count('.lc-ask'); await shot('i7-single-ask');
  check('I7 R4.4: with a thing-identity ask already up, no SECOND ask renders at once (single ask, F7)', identityAskUp && i7n === 1, `identity=${identityAskUp} asks=${i7n}`);
  await tap('.lc-ask:not(.lc-ask2) button:not(.o)', { wait: 600 }); // answer the item's ask
  check('I7b …and once it is answered, the place question comes next ("Is this the Kitchen counter?")', /Is this the Kitchen counter\?/.test(await text('.lc-ask2')), await text('.lc-card'));
  await tap('.lc-x', { wait: 400 }); if (await count('text=Throw away')) await tap('text=Throw away', { wait: 400 });

  // ---- J. R5 — each level's own sheet (replaces the 09-27 chain sheet) ----
  console.log('\n---- R5 (level sheet) ----');
  await seedWhereHouse('wh6');
  AI = { name: 'usb cable' }; WHERE = [{ name: 'zip pouch', moves: true }, { name: 'shelf a', moves: false }, { name: 'closet b', moves: false }];
  await home(); await cam('real_desk.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
  for (const f of ['box.jpg', 'closet.jpg', 'drawer.jpg']) { await tap('.lv-sq.plus', { wait: 300 }); await cam(f); await tap('.lc-shutter', { wait: 300 }); await settleWhere(); }
  const chainJ = await text('.lc-chainline');
  check('J1 the old 3-option Choice ("Photograph it again") is gone for good', await count('text=Photograph it again') === 0);
  check('J2 three levels → three place squares, and the chain line reads zip pouch in shelf a in closet b',
    await count('.lv-strip .lv-sq:not(.plus)') === 3 && /zip pouch\s*in\s*shelf a\s*in\s*closet b/i.test(chainJ), chainJ);
  await openTier(1); // select level 2, tap again → its sheet
  await shot('j-level-sheet');
  check('J3 R5.3: the level sheet\'s actions are WORDS (Choose place, Remove this level), not bare icons', /Choose place/.test(await text('.tier-sheet')) && /Remove this level/.test(await text('.tier-sheet')));
  const rowsH = await page.locator('.tier-sheet .sheet-row').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().height)));
  check('J4 R5.3: every row is >= 44px tall (Frank + Sunil)', rowsH.length >= 3 && rowsH.every((h) => h >= 44), JSON.stringify(rowsH));
  await tap('.tier-sheet .sheet-row.danger', { wait: 500 });
  const chainJ5 = await text('.lc-chainline');
  check('J5 R5.4: Remove level 2 → the chain is zip pouch in closet b (levels 1 and 3 untouched)', /zip pouch\s*in\s*closet b/i.test(chainJ5) && !/shelf a/i.test(chainJ5), chainJ5);
  await openTier(0);
  await tap('.tier-sheet .sheet-row:has-text("Choose place")', { wait: 400 });
  await page.fill('.wl-search input', 'Hall table'); await page.waitForTimeout(150);
  await tap('.where-list .wl-row:not(.wl-sugg):has-text("Hall table")', { wait: 500 });
  const chainJ6 = await text('.lc-chainline');
  check('J6 R5.4: Choose place from level 1\'s sheet replaces ONLY level 1 → Hall table in closet b', /^Hall table\s*in\s*closet b/i.test(chainJ6), chainJ6);
  await tap('.lc-x', { wait: 400 }); if (await count('text=Throw away')) await tap('text=Throw away', { wait: 400 });

  // ---- K. R6.4 — the soft nudge, not a chore ----
  console.log('\n---- R6.4 (soft nudge on the card) ----');
  await seedWhereHouse('wh7');
  AI = { name: 'flashlight' }; WHERE = [{ name: 'tackle box', moves: true }];
  await home(); await cam('real_desk.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
  await tap('.lv-sq.plus', { wait: 300 }); await cam('box.jpg'); await tap('.lc-shutter', { wait: 300 }); await settleWhere();
  await tap('.lc-k.sv', { wait: 1500 });
  const cardL2 = await text('.saved-card .s small');
  check('K1 R6.4: outermost NEW box, no outer level → the card\'s l2 is the soft nudge, not a blank',
    /haven.t said where the tackle box is/i.test(cardL2), cardL2);

  // Regression guard: a box with something ALREADY beyond it never gets the nudge.
  AI = { name: 'multitool' }; WHERE = [{ name: 'gear pouch', moves: true }];
  await home(); await cam('real_slippers.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
  await tap('.lv-sq.plus', { wait: 300 }); await cam('box14.jpg'); await tap('.lc-shutter', { wait: 300 }); await settleWhere();
  await tap('.lv-sq.plus', { wait: 300 });
  await pickPlace('Hall table');
  await tap('.lc-k.sv', { wait: 1500 });
  const cardL2b = await text('.saved-card .s small');
  check('K2 …but when l2 already names the outer place, no nudge is appended', !/haven.t said where/i.test(cardL2b), cardL2b);

  // L (look A parity) retired 09-29g: the camera has one look now.

  check('Z0 no page/console errors across the whole run (Stage 1 + Stage 2/3)', errors.length === 0, errors.join(' | '));

  const passed = results.filter((r) => r.ok).length;
  console.log(`\n${passed}/${results.length} passed`);
  await browser.close(); server.close();
  process.exit(passed === results.length ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
