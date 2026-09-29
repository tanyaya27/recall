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
  check('C1 PLACE_PHOTOS caps at 6 (was 3), even offered 3 more on top of 5', pc1.photos.length === 6, `photos=${pc1.photos.length}`);

  // C2: already at 6 — the count cap holds even though the new ones are tiny and well within budget.
  await rigdb('addPlacePhotos', pc1, [{ photo: 'p9', thumb: 't9' }, { photo: 'p10', thumb: 't10' }]);
  pc1 = (await places()).find((p) => p.id === 'pc1');
  check('C2 already-full place stays at 6', pc1.photos.length === 6, `photos=${pc1.photos.length}`);

  // D1: the byte guard skips oversized candidates but keeps trying the rest — it does not just stop
  // at the first one that doesn't fit ("silently keep what fits", R2).
  await page.evaluate((s) => window.__rig.seed(s), [PL('pc2', 'Byte test', [])]);
  await page.waitForTimeout(150);
  let pc2 = (await places()).find((p) => p.id === 'pc2');
  await rigdb('addPlacePhotos', pc2, [
    { photo: kb(750), thumb: '' },  // alone already over ~700 KB — skipped
    { photo: kb(300), thumb: '' },  // fits (300 KB)
    { photo: kb(300), thumb: '' },  // fits (600 KB total)
    { photo: kb(300), thumb: '' },  // would push to 900 KB — skipped
  ]);
  pc2 = (await places()).find((p) => p.id === 'pc2');
  const totalBytes = pc2.photos.reduce((n, p) => n + (p.photo || '').length + (p.thumb || '').length, 0);
  check('D1 byte guard: oversized candidates skipped, smaller ones after them still kept', pc2.photos.length === 2 && totalBytes <= 700 * 1024, `kept=${pc2.photos.length} bytes=${totalBytes}`);

  // D2: existing photos are never dropped to make room — only new ones are ever skipped.
  await page.evaluate((s) => window.__rig.seed(s), [PL('pc3', 'Byte test 2', [{ photo: kb(650), thumb: '', at: now }])]);
  await page.waitForTimeout(150);
  let pc3 = (await places()).find((p) => p.id === 'pc3');
  await rigdb('addPlacePhotos', pc3, [{ photo: kb(10), thumb: '' }, { photo: kb(200), thumb: '' }]);
  pc3 = (await places()).find((p) => p.id === 'pc3');
  check('D2 the small one that still fits is kept, the original photo is untouched', pc3.photos.length === 2 && pc3.photos[0].photo.length === 650 * 1024, `kept=${pc3.photos.length}`);

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
  console.log('\n---- R1 (attach, never replace) ----');
  await seedWhereHouse('wh1'); await setPrefs({ cameraLook: 'b' });
  AI = { name: 'nail clippers' }; WHERE = [];
  await home(); await cam('real_slippers.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
  await tap('.lv-sq.plus', { wait: 300 });
  const chipLabel = await count('.lc-chips .lc-chip:not(.more)') ? await text('.lc-chips .lc-chip:not(.more) span:last-child') : '';
  await tap('.lc-chips .lc-chip:not(.more)', { wait: 500 }); // pick a KNOWN place with 0 photos
  const promptOnPick = await text('.lc-prompt b');
  check('G1 R2.4: a known level with 0 photos gets "{Name} — add a photo…" prompt, camera stays on it', new RegExp(`^${chipLabel} — add a photo`).test(promptOnPick), promptOnPick);
  await cam('real_desk.jpg'); await tap('.lc-shutter', { wait: 1400 }); // shot #1 on the identified level
  const sayAfter1 = await text('.lc-say b');
  await shot('g1-attach-shot1');
  check('G2 R1.1/1.2: after a photo, the sentence still names the PICKED identity, not "Naming…"', sayAfter1.trim().toLowerCase() === chipLabel.trim().toLowerCase(), sayAfter1);
  await cam('real_painting.jpg'); await tap('.lc-shutter', { wait: 1400 }); // shot #2
  const badge2 = await page.locator('.lv-sq').nth(1).locator('.lv-n').innerText().catch(() => '');
  check('G3 R1.2: the level square badge shows the count (2) after two attached photos', badge2 === '2', badge2);
  const placeBefore = await placeByName(chipLabel);
  await tap('.lc-k.sv', { wait: 1500 });
  const placeAfter = await placeByName(chipLabel);
  check('G4 R1.5/R2.2: Save sends the attached photos as placePhotos to the SAME known place doc (no new doc)',
    !!placeAfter && placeAfter.photos.length === (placeBefore ? placeBefore.photos.length : 0) + 2 && (await places()).filter((p) => p.name.toLowerCase() === chipLabel.toLowerCase()).length === 1,
    `before=${placeBefore && placeBefore.photos.length} after=${placeAfter && placeAfter.photos.length}`);

  // R1.3: removing the LAST attached photo of an identified level keeps the identity.
  AI = { name: 'spare key' }; WHERE = [];
  await home(); await cam('real_pencil.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
  await tap('.lv-sq.plus', { wait: 300 });
  const boxChip = await count('.lc-chips .lc-chip.box') ? await text('.lc-chips .lc-chip.box span:last-child') : '';
  await tap('.lc-chips .lc-chip.box', { wait: 500 });
  await cam('real_spoon.jpg'); await tap('.lc-shutter', { wait: 1400 });
  // `sel` is already on this level (pickKnown selected it, shot() doesn't move sel), so tapLevel(i===sel)
  // opens the preview on the first click here — no extra tap needed.
  await page.locator('.lv-sq').nth(1).click(); await page.waitForTimeout(500); // open its preview (only photo)
  await shot('g5-before-remove');
  check('G5a preview opens for the identified level with its one attached photo', await count('.pv-rm') === 1);
  await tap('.pv-rm', { wait: 500 });
  const sayAfterRemove = await text('.lc-say b');
  // a box link renders as "In the {name}" (inPhrase), not the bare name — same phrasing J5/J6 already expect.
  check('G5b R1.3: removing the last attached photo KEEPS the identity — sentence still names the box, not reset to "No place yet"',
    sayAfterRemove.trim().toLowerCase() === `in the ${boxChip.trim().toLowerCase()}`, sayAfterRemove);
  await tap('.lc-x', { wait: 400 }); if (await count('text=Throw away')) await tap('text=Throw away', { wait: 400 });

  // R1.4 (regression guard): a level with NO identity still runs the naming pass as before.
  AI = { name: 'measuring tape' }; WHERE = [{ name: 'garage shelf b', moves: false }];
  await home(); await cam('real_cetaphil.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
  await tap('.lv-sq.plus', { wait: 300 }); await cam('box14.jpg'); await tap('.lc-shutter', { wait: 200 });
  const namingShown = /naming/i.test(await text('.lc-say b').catch(() => ''));
  await page.waitForTimeout(1500);
  check('G6 R1.4: a level with no identity still shows "Naming…" then the AI result (unchanged path)', namingShown || /garage shelf b/i.test(await text('.lc-say b')));
  await tap('.lc-x', { wait: 400 }); if (await count('text=Throw away')) await tap('text=Throw away', { wait: 400 });

  // ---- H. R3 — rename a level right there; a user name beats a late AI result ----
  console.log('\n---- R3 (rename per level) ----');
  await seedWhereHouse('wh2');
  AI = { name: 'usb hub' }; WHERE = [{ name: 'linen shelf', moves: false }];
  await home(); await cam('real_desk.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
  await tap('.lv-sq.plus', { wait: 300 }); await cam('closet.jpg');
  await tap('.lc-shutter', { wait: 120 }); // shutter pressed, naming pass now in flight (AI answers after ~100ms)
  await tap('.lc-chg', { wait: 400 });
  check('H1a chain sheet reachable immediately, even mid-naming-pass (R3.2)', await count('.chain-sheet') === 1);
  const rowNameBefore = await text('.chain-sheet .cs-name');
  await tap('.chain-sheet .cs-name', { wait: 400 });
  check('H1b tapping the row name opens "What is it called?" pre-filled with the level\'s current name', /What is it called/.test(await text('.sheet-title')) && (await page.locator('.sheet input.place-input').first().inputValue()) === rowNameBefore);
  await type('.sheet input.place-input', 'Craft shelf');
  await tap('.sheet .btn-primary', { wait: 900 }); // apply BEFORE the AI's answer has necessarily settled
  const sayAfterRename = await text('.lc-say b');
  await page.waitForTimeout(1200); // let the AI's (late) answer arrive, if it hasn't already
  const sayAfterAI = await text('.lc-say b');
  check('H2 R3.2: a name given pre-save WINS — it shows immediately and a late AI result never overwrites it',
    sayAfterRename === 'Craft shelf' && sayAfterAI === 'Craft shelf', `${sayAfterRename} / ${sayAfterAI}`);
  await tap('.lc-k.sv', { wait: 1500 });
  const craftPlace = await placeByName('Craft shelf');
  check('H2b the doc is created with the USER name, never the AI\'s "linen shelf"', !!craftPlace && !(await placeByName('linen shelf')));

  // R3.3: a level saved with a placeholder name marks "Unnamed — tap to name"; tapping renames the doc.
  AI = { name: 'battery pack' }; WHERE = [{ name: '', moves: true }];
  await home(); await cam('real_desk.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
  await tap('.lv-sq.plus', { wait: 300 }); await cam('box.jpg'); await tap('.lc-shutter', { wait: 1600 });
  await tap('.lc-k.sv', { wait: 1600 });
  check('H3a R3.3: saved with a placeholder name → "Unnamed — tap to name" on the card (Save never blocked)', await count('.sc-unnamed') === 1);
  await tap('.sc-unnamed', { wait: 500 });
  check('H3b tapping it opens the rename sheet', /What is it called/.test(await text('.sheet-title')));
  await type('.sheet input.place-input', 'Battery shelf');
  await tap('.sheet .btn-primary', { wait: 700 });
  check('H3c the line is gone once named, and the created doc now carries the given name',
    await count('.sc-unnamed') === 0 && (await items()).some((it) => it.name === 'Battery shelf' && it.asWhere));

  // ---- I. R4 — collisions never merge silently; single ask; 4+4 pool ----
  console.log('\n---- R4 (name-collision ask) ----');
  await seedWhereHouse('wh3');
  // I1/I2: AI names a NEW where-photo the same as an ALREADY-SAVED place → ask fires → Yes merges.
  AI = { name: 'travel adapter' }; WHERE = [{ name: 'Kitchen counter', moves: false }];
  await home(); await cam('real_cetaphil.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
  await tap('.lv-sq.plus', { wait: 300 }); await cam('closet.jpg'); await tap('.lc-shutter', { wait: 1700 });
  check('I1 R4.2/4.5: a same-NAME (not visually sure) match still raises the "Your X?" ask', await count('.lc-ask') === 1, await text('.lc-ask b').catch(() => ''));
  check('I2 R4.2: Save is off while the collision ask is unresolved', await page.locator('.lc-k.sv').isDisabled());
  const kcBefore = await placeByName('Kitchen counter');
  await tap('.lc-ask button:not(.o)', { wait: 500 }); // Yes
  await tap('.lc-k.sv', { wait: 1500 });
  const kcAfter = await placeByName('Kitchen counter');
  const placesNamedKC = (await places()).filter((p) => p.name === 'Kitchen counter');
  check('I3 R4.5: Yes → photos land on the EXISTING place, no second doc',
    placesNamedKC.length === 1 && kcAfter.photos.length === kcBefore.photos.length + 1, `docs=${placesNamedKC.length} photos ${kcBefore.photos.length}->${kcAfter.photos.length}`);

  // I4/I5: same scenario, but No → distinct-name gate → rename → two docs after Save.
  AI = { name: 'phone stand' }; WHERE = [{ name: 'Hall table', moves: false }];
  await home(); await cam('real_painting.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
  await tap('.lv-sq.plus', { wait: 300 }); await cam('book.jpg'); await tap('.lc-shutter', { wait: 1700 });
  await tap('.lc-ask button.o', { wait: 600 }); // No, a new one
  check('I4a No opens the rename sheet with the distinct-name line', /already a .Hall table./.test(await text('.sheet-title')));
  check('I4b Save is still off — the gate names the colliding link', await page.locator('.lc-k.sv').isDisabled() && /needs its own name/.test(await text('.lc-say .soft').catch(() => '')));
  await type('.sheet input.place-input', 'Hall table west');
  await tap('.sheet .btn-primary', { wait: 500 });
  check('I4c the gate clears once the name differs', !(await page.locator('.lc-k.sv').isDisabled()));
  await tap('.lc-k.sv', { wait: 1500 });
  check('I5 R4.5: No + rename → TWO place docs after Save (Mei\'s five Shelves stay five)',
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

  // I7: single-ask priority — a pending THING-identity ask suppresses a level ask (R4.4/F7).
  await seedWhereHouse('wh5');
  await page.evaluate((s) => window.__rig.seed(s), [{ id: 'existing', kind: 'item', owner: 'wh5', by: 'wh5', private: false, roles: {}, sharedWith: [], name: 'garden shears', location: 'Garage',
    photo: img('real_desk.jpg'), thumb: img('real_desk.jpg'), thumbV: 2, order: 1, createdAt: Date.now() - H2, lastSeenAt: Date.now() - H2, photoCount: 1, history: [{ location: 'Garage', at: Date.now() }] }]);
  await page.waitForTimeout(300);
  AI = { name: 'garden shears', sameAs: 'garden shears' }; WHERE = [{ name: 'Kitchen counter', moves: false }];
  await home(); await cam('real_desk.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
  const identityAskUp = await count('.lc-ask') === 1;
  await tap('.lv-sq.plus', { wait: 300 }); await cam('closet.jpg'); await tap('.lc-shutter', { wait: 1700 });
  check('I7 R4.4: with a thing-identity ask already up, no SECOND ask renders at once (single ask, F7)', identityAskUp && await count('.lc-ask') === 1);
  await tap('.lc-x', { wait: 400 }); if (await count('text=Throw away')) await tap('text=Throw away', { wait: 400 });

  // ---- J. R5 — the chain sheet (kills F5) ----
  console.log('\n---- R5 (chain sheet) ----');
  await seedWhereHouse('wh6');
  AI = { name: 'usb cable' }; WHERE = [{ name: 'zip pouch', moves: true }, { name: 'shelf a', moves: false }, { name: 'closet b', moves: false }];
  await home(); await cam('real_desk.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
  await tap('.lv-sq.plus', { wait: 300 }); await cam('box.jpg'); await tap('.lc-shutter', { wait: 1600 });
  await tap('.lv-sq.plus', { wait: 300 }); await cam('closet.jpg'); await tap('.lc-shutter', { wait: 1600 });
  await tap('.lv-sq.plus', { wait: 300 }); await cam('drawer.jpg'); await tap('.lc-shutter', { wait: 1600 });
  const sayBeforeChain = [await text('.lc-say b'), await text('.lc-say .soft')].join(' | ');
  await tap('.lc-chg', { wait: 500 });
  await shot('j-chain-sheet-3deep');
  check('J1 R5.2: the old 3-option Choice ("Photograph it again") is gone for good', await count('.item-sheet:has-text("Photograph it again")') === 0);
  check('J2 the chain sheet shows one row per level (3 rows for a 3-deep chain)', await count('.chain-sheet .cs-row') === 3);
  check('J3 R5.3: Replace and Remove are WORDS, not bare icons', /Replace/.test(await text('.chain-sheet .cs-row')) && (await page.locator('.chain-sheet .cs-row .cs-act.rm').first().innerText()) === 'Remove');
  const target44 = await Promise.all(['.chain-sheet .cs-name', '.chain-sheet .cs-act:not(.rm)', '.chain-sheet .cs-act.rm'].map((s) => minH(s)));
  check('J4 R5.3: every row control is >= 44px tall (Frank + Sunil)', target44.every((h) => h >= 44), JSON.stringify(target44));
  await tap('.chain-sheet .cs-row:nth-child(2) .cs-act:not(.rm)', { wait: 500 }); // Replace level 2
  const sayAfterReplace = [await text('.lc-say b'), await text('.lc-say .soft')].join(' | ');
  check('J5 R5.4: Replace level 2 clears ONLY that level — levels 1 and 3 untouched',
    /zip pouch/.test(sayAfterReplace) && /closet b/i.test(sayAfterReplace) && !/shelf a/i.test(sayAfterReplace), `before="${sayBeforeChain}" after="${sayAfterReplace}"`);
  await tap('.lc-chg', { wait: 500 });
  await tap('.chain-sheet .cs-row:nth-child(2) .cs-act.rm', { wait: 500 }); // Remove the now-empty level 2
  const sayAfterRemove2 = [await text('.lc-say b'), await text('.lc-say .soft')].join(' | ');
  check('J6 R5.4: Remove level 2 → the chain is 1 -> 3 (zip pouch, closet b)', /zip pouch/.test(sayAfterRemove2) && /closet b/i.test(sayAfterRemove2));
  // No place yet, with 2+ levels filled → confirm first.
  await tap('.lc-chg', { wait: 500 });
  await tap('.chain-sheet .btn-secondary.amber:has-text("No place yet")', { wait: 500 });
  check('J7 R5.1: "No place yet" with 2+ filled levels asks to confirm first', await count('.sheet-title:has-text("Clear where it goes")') === 1);
  await tap('.sheet .btn-primary.alt', { wait: 500 }); // Keep it → back to the chain sheet
  check('J8 Keep it returns to the chain sheet, nothing cleared', await count('.chain-sheet') === 1);
  await tap('.chain-sheet .btn-secondary.amber:has-text("No place yet")', { wait: 500 });
  await tap('.sheet .btn-secondary.amber', { wait: 600 }); // Clear
  check('J9 Clear empties the whole chain — back to "No place yet"', /No place yet/.test(await text('.lc-say b')));
  await tap('.lc-x', { wait: 400 }); if (await count('text=Throw away')) await tap('text=Throw away', { wait: 400 });

  // ---- K. R6.4 — the soft nudge, not a chore ----
  console.log('\n---- R6.4 (soft nudge on the card) ----');
  await seedWhereHouse('wh7');
  AI = { name: 'flashlight' }; WHERE = [{ name: 'tackle box', moves: true }];
  await home(); await cam('real_desk.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
  await tap('.lv-sq.plus', { wait: 300 }); await cam('box.jpg'); await tap('.lc-shutter', { wait: 1700 });
  await tap('.lc-k.sv', { wait: 1500 });
  const cardL2 = await text('.saved-card .s small');
  check('K1 R6.4: outermost NEW box, no outer level → the card\'s l2 is the soft nudge, not a blank',
    /haven.t said where the tackle box is/i.test(cardL2), cardL2);

  // Regression guard: a box with something ALREADY beyond it never gets the nudge (l2 already says something).
  // The outer level is picked as a KNOWN chip (not AI-named) — naming "Hall table" via AI would collide
  // with the real seeded place of that name and correctly raise the R4 byName ask, which isn't this test.
  AI = { name: 'multitool' }; WHERE = [{ name: 'gear pouch', moves: true }];
  await home(); await cam('real_slippers.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
  await tap('.lv-sq.plus', { wait: 300 }); await cam('box14.jpg'); await tap('.lc-shutter', { wait: 1600 });
  await tap('.lv-sq.plus', { wait: 300 });
  await tap('.lc-chips .lc-chip.more', { wait: 400 });
  await tap('.wl-row:has-text("Hall table")', { wait: 500 });
  await tap('.lc-k.sv', { wait: 1500 });
  const cardL2b = await text('.saved-card .s small');
  check('K2 …but when l2 already names the outer place, no nudge is appended', !/haven.t said where/i.test(cardL2b), cardL2b);

  // ---- L. R7 — parity: the R1/R4/R5 core paths, run again in look A ----
  console.log('\n---- R7 (look A parity) ----');
  await seedWhereHouse('wh8'); await setPrefs({ cameraLook: 'a' });
  // R1 in look A
  AI = { name: 'coaster set' }; WHERE = [];
  await home(); await cam('real_slippers.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
  await tap('.lv-sq.plus', { wait: 300 }); await tap('.lc-chips .lc-chip:not(.more)', { wait: 500 });
  // .lv-t .lc-nm .first() is the THING tile (index 0) — the level tile (the pick) is .nth(1).
  const chipA = await page.locator('.lv-t .lc-nm').nth(1).innerText().catch(() => '');
  await cam('real_desk.jpg'); await tap('.lc-shutter', { wait: 1400 });
  const nmAfterA = await page.locator('.lv-t .lc-nm').nth(1).innerText().catch(() => '');
  check('L1 R1/R7 (look A): identity survives a photo — the level tile still names the pick', nmAfterA.trim().toLowerCase() === chipA.trim().toLowerCase(), `${chipA} / ${nmAfterA}`);
  await tap('.lc-x', { wait: 400 }); if (await count('text=Throw away')) await tap('text=Throw away', { wait: 400 });
  // R4 collision ask + gate in look A
  AI = { name: 'desk lamp' }; WHERE = [{ name: 'Kitchen counter', moves: false }];
  await home(); await cam('real_cetaphil.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
  await tap('.lv-sq.plus', { wait: 300 }); await cam('closet.jpg'); await tap('.lc-shutter', { wait: 1700 });
  check('L2 R4/R7 (look A): the collision ask renders (as the floating lc-float card)', await count('.lc-float .lc-ask') === 1 || await count('.lc-ask') === 1);
  check('L2b Save is off while colliding (look A)', await page.locator('.lc-k.sv').isDisabled());
  await tap('.lc-ask button:not(.o)', { wait: 500 }); // Yes
  await tap('.lc-k.sv', { wait: 1400 });
  check('L2c Yes merges in look A too — still one Kitchen counter doc', (await places()).filter((p) => p.name === 'Kitchen counter').length === 1);
  // R5 chain sheet in look A
  AI = { name: 'paint brush' }; WHERE = [{ name: 'craft bin', moves: true }, { name: 'shelf x', moves: false }];
  await home(); await cam('real_painting.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
  await tap('.lv-sq.plus', { wait: 300 }); await cam('box.jpg'); await tap('.lc-shutter', { wait: 1600 });
  await tap('.lv-sq.plus', { wait: 300 }); await cam('closet.jpg'); await tap('.lc-shutter', { wait: 1600 });
  await tap('.lc-chg', { wait: 500 });
  check('L3 R5/R7 (look A): the chain sheet opens with a row per level', await count('.chain-sheet .cs-row') === 2);
  await tap('.chain-sheet .cs-row:nth-child(1) .cs-act.rm', { wait: 500 });
  check('L3b Remove level 1 in look A leaves level 2 alone', /shelf x/i.test(await text('.lc-say b')));

  check('Z0 no page/console errors across the whole run (Stage 1 + Stage 2/3)', errors.length === 0, errors.join(' | '));

  const passed = results.filter((r) => r.ok).length;
  console.log(`\n${passed}/${results.length} passed`);
  await browser.close(); server.close();
  process.exit(passed === results.length ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
