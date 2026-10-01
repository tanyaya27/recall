// The Yes-then-Save regression suite (2026-09-28), committed after the phone scare of build
// 20260928a: the phone appeared to hit "answer Yes to a recognition ask, then Save does nothing".
// The rig proved the shipped code sound in all four variants (visual / by-name x place / box); the
// phone had been running the previous bundle. Kept as a permanent suite because the original
// verification only asserted "no duplicate doc" after Yes-save - which passes even when the save
// never happens. These checks assert the parts that were missing: Save CLOSES the camera, the item
// IS written, and the confirmed identity leaves the chips. Also checks the menu's build stamp.
// Run: node repro_f3.js   (after ./build.sh; same harness as verify_f2.js)
// VERIFY_F2 — independent, adversarial re-walk of REQUIREMENTS_2026-09-27 (R1-R7), both looks.
// Written from fresh eyes: this script does NOT reuse audit_where.js's assertions or call
// window.__rigdb directly for anything the real UI can do — it drives the camera exactly as a
// person would (taps, shutter, typed text) and only uses window.__rig.dump() to inspect the
// store afterward, the same way walk_f1.js does. Screens: rig/shots_verify/v-<req>-<n>.png.
// node verify_f2.js
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const PORT = Number(process.env.PORT || 8411); const ROOT = path.join(__dirname, 'out');
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, req.url.split('?')[0] === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
const img = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(__dirname, 'mock/img', f)).toString('base64');
const OUTDIR = path.join(__dirname, 'shots_tiers'); fs.mkdirSync(OUTDIR, { recursive: true });

const results = []; // { req, name, ok, note, shot }
const errors = []; const consoleErrors = [];
function check(req, name, ok, note = '', shotFile = '') {
  results.push({ req, name, ok: !!ok, note, shot: shotFile });
  console.log(`${ok ? 'PASS' : 'FAIL'}  [${req}] ${name}${note ? ' — ' + note : ''}`);
}

let AI = { name: 'thing' }; let WHERE = []; let SAME = { index: -1, sure: false }; let SAME_PLACE = { same: true, sure: true };
let NEXT_WHERE_DELAY = 0; let NEXT_WHERE_BADJSON = false; let lastPool = null; let lastPoolNames = [];

// Each look gets its OWN browser (closed and relaunched in between) — two full runs (90+ steps each,
// a live fake-camera canvas painting the whole time) in a single browser accumulated enough memory to
// crash Chromium partway through look A in an earlier version of this script; a clean process per look
// is cheap insurance against that, not a behavior difference between looks.
async function runLook(look) {
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
    let out; let delay = 220; let badjson = false;
    if (/MOVES:/.test(texts)) {
      lastPool = [...texts.matchAll(/SAVED (\d+) —/g)].length; lastPoolNames = [...texts.matchAll(/SAVED (\d+) — "([^"]*)"/g)].map((x) => x[2]);
      const w = WHERE.shift() || { name: 'shelf', moves: false };
      let index = 0; if (w.known) { const m = [...texts.matchAll(/SAVED (\d+) — "([^"]*)"/g)].find((x) => x[2].toLowerCase() === w.known.toLowerCase()); index = m ? Number(m[1]) : 0; }
      out = { name: w.name, moves: !!w.moves, index: (w.known && index === 0 && !w.nohit) ? 0 : index, sure: w.sure !== undefined ? !!w.sure : !!index };
      if (NEXT_WHERE_DELAY) { delay = NEXT_WHERE_DELAY; NEXT_WHERE_DELAY = 0; }
      if (NEXT_WHERE_BADJSON) { badjson = true; NEXT_WHERE_BADJSON = false; }
    } else if (/PHOTO A:/.test(texts)) out = SAME_PLACE; // 09-30: two place photos — the same spot?
    else if (/NEW PHOTO/.test(texts)) out = SAME;
    else if (images) out = { name: AI.name, sameAs: AI.sameAs || '', alternatives: [], restingOn: AI.restingOn || '', placeCertain: !!AI.placeCertain, placeGuesses: AI.placeGuesses || [], description: '', details: AI.details || '', private: !!AI.private, privateWhy: AI.privateWhy || '', secretVisible: false };
    else out = { matches: [], message: '' };
    await new Promise((r) => setTimeout(r, delay));
    if (badjson) { await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [{ type: 'text', text: 'not json{{{' }] }) }); return; }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [{ type: 'text', text: JSON.stringify(out) }] }) });
  });
  await require('./legacy_flow.js')(ctx); const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });

  let flow = '', n = 0;
  const start = (f) => { flow = f; n = 0; };
  const tap = async (sel, opts = {}) => { await page.locator(sel).first().click(opts); await page.waitForTimeout(opts.wait || 450); };
  const type = async (sel, s) => { await page.locator(sel).first().fill(s); await page.waitForTimeout(250); };
  const cam = async (f) => { await page.evaluate((s) => { window.__cam = s; }, img(f)); await page.waitForTimeout(220); };
  const text = (sel) => page.locator(sel).first().innerText().catch(() => '');
  const count = (sel) => page.locator(sel).count();
  const isDisabled = (sel) => page.locator(sel).first().isDisabled().catch(() => null);
  const dump = () => page.evaluate(() => window.__rig.dump());
  const items = async () => (await dump()).filter((d) => d.kind === 'item' && !d.deleted);
  const places = async () => (await dump()).filter((d) => d.kind === 'place');
  const byName = async (nm) => (await items()).find((d) => (d.name || '').toLowerCase() === nm.toLowerCase());
  const placeByName = async (nm) => (await places()).find((d) => (d.name || '').toLowerCase() === nm.toLowerCase());
  const setPrefs = (patch) => page.evaluate((p) => { const x = JSON.parse(localStorage.getItem('recall-prefs') || '{}'); Object.assign(x, p); localStorage.setItem('recall-prefs', JSON.stringify(x)); }, patch);
  const box = (min) => page.locator(min).first().evaluate((el) => { const r = el.getBoundingClientRect(); return { w: r.width, h: r.height }; });
  const home = async () => { await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board'); await page.waitForTimeout(350); };
  const LOG = '.footer .btn-primary:not(.alt)';
  // ink centre (CSS px, page coords) of the pixels of one colour inside an element: 'amber' (level 1) or 'white'
  const inkMid = async (sel, kind) => { const r = await page.locator(sel).first().boundingBox(); if (!r) return null;
    const buf = await page.screenshot({ clip: { x: r.x, y: r.y - 4, width: r.width, height: r.height + 8 } });
    return page.evaluate(async ([b64, kind, top]) => { const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
      const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data; let lo = 1e9, hi = -1;
      for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) { const i = (y * c.width + x) * 4, R = d[i], G = d[i + 1], B = d[i + 2];
        const ok = kind === 'amber' ? (R > 200 && G > 140 && G < 215 && B < 130) : (R > 225 && G > 225 && B > 225); if (ok) { if (y < lo) lo = y; if (y > hi) hi = y; } }
      return lo > hi ? null : Math.round((top - 4 + (lo + hi + 1) / 4) * 10) / 10; }, [buf.toString('base64'), kind, r.y]); };

  const shotN = {};
  const makeShot = (look) => async (req, label) => {
    const key = `${look}-${req}`; shotN[key] = (shotN[key] || 0) + 1;
    await page.waitForTimeout(280);
    const file = `v-${req}-${look}-${String(shotN[key]).padStart(2, '0')}.png`;
    await page.screenshot({ path: `${OUTDIR}/${file}` });
    console.log(`  [shot] ${file}  ${label || ''}`);
    return file;
  };

  // ---- seed a fresh house, rich enough for R1-R6 + regressions + the 4+4 pool test ----
  async function seedHouse(theme) {
    await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen');
    await page.evaluate(() => { localStorage.clear(); window.__rig.reset(); localStorage.setItem('rig-uid', 'margaret'); localStorage.setItem('rig-anon', '0');
      localStorage.setItem('recall-ai-config', JSON.stringify({ provider: 'anthropic', apiKey: 'sk-ant-rig', model: '' })); });
    if (theme) await setPrefs({ theme });
    await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen'); await page.waitForTimeout(300);
    const now = Date.now(), H = 3600e3;
    const P = (f) => ({ photo: img(f), thumb: img(f), thumbV: 2 });
    const T = (id, name, location, f, ago, extra = {}) => ({ id, kind: 'item', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [], name, location,
      ...(f ? P(f) : { photo: null, thumb: null, written: true }), order: now - ago, createdAt: now - ago, lastSeenAt: now - ago, logId: 'l_' + id, photoCount: f ? 1 : 0, history: [{ location, at: now - ago }], ...extra });
    const E = (id, from, to, ago) => ({ id, kind: 'edge', rel: 'in', from, to, since: now - ago, until: null, how: 'chosen', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [] });
    const PL = (id, nm, f, ago) => ({ id, kind: 'place', owner: 'margaret', by: 'margaret', private: false, name: nm, order: now - ago, createdAt: now - ago, parent: null,
      photos: f ? [{ photo: img(f), thumb: img(f), at: now - ago }] : [] });
    const seed = [
      T('g', 'reading glasses', 'Hall table', 'glasses.jpg', 1 * H),
      T('w2', 'wallet', 'Hall table', 'wallet.jpg', 2 * H),
      T('m', 'memorabilia box', 'Crawl space', 'box14.jpg', 90 * H, { holds: true }),
      T('w', 'wooden box', 'Memorabilia box', 'smallbox.jpg', 80 * H, { holds: true }),
      T('y', 'yearbook 1978', 'Memorabilia box', 'book.jpg', 79 * H),
      T('c', 'baseball card', 'Wooden box', 'card.jpg', 70 * H),
      T('d', 'tool drawer', 'Garage', 'tooldrawer.jpg', 30 * H, { holds: true }),
      T('u', 'coffee can', '', 'soda.jpg', 3 * H, { needsPlace: true }),
      T('p', 'passport', 'Desk drawer', 'folder.jpg', 5 * H, { private: true }),
      // extra boxes/places for the R4.3 pool test — 5 of each, so the 4+4 cap is provable. Each of
      // these boxes has its OWN real place, so they are not accidental "Not put away" chores.
      T('bx1', 'tin box', 'Garage', 'box.jpg', 40 * H, { holds: true }),
      T('bx2', 'shoe rack', 'Garage', 'real_slippers.jpg', 41 * H, { holds: true }),
      T('bx3', 'tote bin', 'Craft nook', 'real_desk.jpg', 42 * H, { holds: true }),
      T('bx4', 'filing cabinet', 'Craft nook', 'closet.jpg', 43 * H, { holds: true }),
      PL('pl1', 'Kitchen counter', 'closet.jpg', 99 * H),
      PL('pl2', 'Pantry shelf', 'real_painting.jpg', 98 * H),
      PL('pl3', 'Linen closet', 'real_cetaphil.jpg', 97 * H),
      PL('pl4', 'Garage shelf', 'real_desk.jpg', 96 * H),
      PL('pl5', 'Craft nook', 'real_slippers.jpg', 95 * H),
      // A recent item AT Kitchen counter, so it — not Craft nook — is the #1 "just used" chip
      // (knownLocations ranks by how recently a THING referenced the place, not the place doc's age).
      T('kc1', 'spare batteries', 'Kitchen counter', 'real_desk.jpg', 0.5 * H),
      T('ps', '3D model of plant sensor', 'Desk drawer', 'real_cetaphil.jpg', 0.2 * H),
      PL('pl6', 'Desk drawer', 'drawer.jpg', 94 * H),
      PL('pl7', 'White cardboard box', 'box.jpg', 93 * H),
      E('eps', 'ps', { t: 'place', name: 'Desk drawer' }, 0.2 * H),
      E('ekc', 'kc1', { t: 'place', name: 'Kitchen counter' }, 0.5 * H),
      E('em', 'm', { t: 'place', name: 'Crawl space' }, 90 * H), E('ew', 'w', box2('m', 'memorabilia box'), 80 * H),
      E('ey', 'y', box2('m', 'memorabilia box'), 79 * H), E('ec', 'c', box2('w', 'wooden box'), 70 * H),
    ];
    function box2(id, name) { return { t: 'thing', id, name }; }
    await page.evaluate((s) => window.__rig.seed(s), seed);
    await page.evaluate((s) => window.__rig.seed(s, 'recall_users'), [{ id: 'margaret', name: 'Margaret' }, { id: 'robert', name: 'Robert' }]);
    await page.waitForTimeout(400);
  }

  // monkey — 09-30 (TESTING.md #3): random real actions, in random orders nobody scripted, with the store's rules checked
  // after every step and the consistency oracle on the item just touched. Repeatable: `SEED=123 STEPS=60 node monkey.js`.
  // A failure prints the seed and the steps so far; the same seed replays the same run.
  async function runSuite() {
    const O = require('./oracle.js')({ page, PORT, tap });
    const OUT = path.join(__dirname, 'shots_m'); fs.mkdirSync(OUT, { recursive: true });
    let seed = Number(process.env.SEED || Date.now() % 100000); const SEED0 = seed; const STEPS = Number(process.env.STEPS || 40);
    const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    const pick = (a) => a[Math.floor(rnd() * a.length)];
    const log = [];
    const PHOTOS = ['real_slippers.jpg', 'real_desk.jpg', 'real_pencil.jpg', 'real_spoon.jpg', 'real_cetaphil.jpg', 'real_painting.jpg', 'book.jpg', 'card.jpg'];
    const WHERE_PHOTOS = ['closet.jpg', 'drawer.jpg', 'box.jpg', 'box14.jpg', 'smallbox.jpg'];
    const NEW_PLACES = ['Hall cupboard', 'Top shelf', 'Blue bin', 'Attic', 'Office', 'Porch bench', 'Laundry', 'Car trunk'];
    const THINGS = ['tape', 'charger', 'torch', 'pliers', 'stamps', 'glue', 'twine', 'fuse', 'ruler', 'keys', 'lens cloth', 'dice'];
    let tn = 0;
    const items = () => page.evaluate(() => window.__rig.dump().filter((d) => d.kind === 'item' && !d.deleted && d.name && d.owner === 'margaret' && !d.private).map((d) => d.name));
    const placeNames = () => page.evaluate(() => window.__rig.dump().filter((d) => d.kind === 'place').map((d) => d.name));
    const plus = async () => { if (await page.locator('.lv-sq.plus').count()) await tap('.lv-sq.plus', { wait: 300 }); };
    const choose = async (name) => {
      if (!(await page.locator('.where-list').count())) await tap('.lc-choose', { wait: 400 });
      await page.fill('.wl-search input', name); await page.waitForTimeout(180);
      const row = page.locator(`.where-list .wl-row:not(.wl-sugg):has-text("${name}")`);
      if (await row.count()) await row.first().click(); else if (await page.locator('.wl-new.typed').count()) await page.click('.wl-new.typed'); else await page.click('.where-list .btn-quiet');
      await page.waitForTimeout(400);
    };
    const shootPlace = async () => {
      const nm = pick(NEW_PLACES) + ' ' + Math.floor(rnd() * 90 + 10);
      WHERE.push({ name: nm.toLowerCase(), moves: rnd() < 0.3 }); if (rnd() < 0.15) NEXT_WHERE_DELAY = 3800;
      await cam(pick(WHERE_PHOTOS)); await tap('.lc-shutter', { wait: 300 });
      for (let k = 0; k < 40 && await page.locator('.lv-look').count(); k++) await page.waitForTimeout(150);
      for (let k = 0; k < 14 && !(await page.locator('.where-list, .photo-for').count()); k++) await page.waitForTimeout(150); for (let k = 0; k < 40 && (await page.locator('.where-list .wl-sugg.quiet:has-text("Looking")').count()); k++) await page.waitForTimeout(150); /* 09-30f: Choose place opens at once; wait for ReCall's look */
      if (await page.locator('.where-list .wl-sugg:not(.quiet)').count()) { await tap(rnd() < 0.5 ? '.where-list .wl-sugg:not(.quiet)' : '.where-list .wl-pend input', { wait: 450 }); }
      if (await page.locator('.where-list .wl-sugg:not(.quiet)').count()) return; // a suggestion: the test answers it
      if (await page.locator('.wl-pend .btn-primary').count()) {
        if (await page.locator('.wl-pend .btn-primary').isDisabled() || rnd() < 0.3) await page.locator('.wl-pend input').fill(nm);
        if (await page.locator('.wl-pend .btn-primary').isDisabled()) await page.locator('.wl-pend input').fill(nm + ' b');
        await tap('.wl-pend .btn-primary', { wait: 400 });
      }
      return nm;
    };
    const addTier = async () => { await plus(); if (rnd() < 0.55) await choose(pick([...(await placeNames()), pick(NEW_PLACES)])); else await shootPlace(); };
    const save = async () => { if (await page.locator('.lc-k.sv').isDisabled()) { await tap('.lc-x', { wait: 400 }); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 400 }); return false; } await tap('.lc-k.sv', { wait: 2400 }); return true; };
    const closeAll = async () => { for (const q of ['.where-list .btn-quiet', '.tier-sheet .sheet-row:has-text("Close")', '.sheet .btn-quiet']) if (await page.locator(q).count()) await tap(q, { wait: 300 }); if (await page.locator('.lc').count()) { await tap('.lc-x', { wait: 400 }); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 400 }); } };
    const ACTIONS = {
      async log() { const nm = pick(THINGS) + ' ' + (++tn); await home(); AI = { name: nm }; await cam(pick(PHOTOS)); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
        const k = 1 + Math.floor(rnd() * 3); for (let i = 0; i < k; i++) await addTier(); return (await save()) ? nm : null; },
      async move() { const nm = pick(await items()); await O.openItem(nm); const b = page.locator('button:has-text("Move it"), button:has-text("Put it somewhere")'); if (!(await b.count())) return null; await b.first().click(); await page.waitForTimeout(800);
        const r = rnd(); const n = await page.locator('.lv-strip .lv-sq:not(.plus)').count();
        if (r < 0.35) await choose(pick([...(await placeNames()), pick(NEW_PLACES)])); // a new tier 1
        else if ((r < 0.6 || n < 2) && n < 6) await addTier(); // add on top (a real chain stays under ~6 deep)
        else if (n < 2) await choose(pick(await placeNames()));
        else { const i = 1 + Math.floor(rnd() * (n - 1)); const sq = page.locator('.lv-strip .lv-sq').nth(i); await sq.click(); await page.waitForTimeout(250); await sq.click(); await page.waitForTimeout(350); if (await page.locator('.tier-sheet .sheet-row:has-text("Choose place")').count()) { await tap('.tier-sheet .sheet-row:has-text("Choose place")', { wait: 350 }); await choose(pick(await placeNames())); } }
        return (await save()) ? nm : null; },
      async undo() { if (await page.locator('.saved-card .u').count()) { await page.waitForTimeout(600); await tap('.saved-card .u', { wait: 1400 }); } return null; },
      async renamePlace() { const pl = pick(await placeNames()); await home(); await tap('.menu-btn', { wait: 400 }); await tap('.drawer-row:has-text("Places")', { wait: 700 });
        const row = page.locator(`.loc-row:has-text("${pl}")`); if (!(await row.count())) return null; await row.first().click(); await page.waitForTimeout(600);
        if (!(await page.locator('button.field-value').count())) return null; await tap('button.field-value', { wait: 300 }); await page.locator('input.place-input').first().fill(pl + ' ' + Math.floor(rnd() * 9)); await page.keyboard.press('Enter'); await page.waitForTimeout(900); return null; },
      async cancelHalfway() { await home(); AI = { name: 'half ' + (++tn) }; await cam(pick(PHOTOS)); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 }); if (rnd() < 0.5) await addTier(); await closeAll(); return null; },
    };
    const WEIGHTS = [['log', 4], ['move', 5], ['undo', 1], ['renamePlace', 1], ['cancelHalfway', 1]];
    const choice = () => { const t = WEIGHTS.reduce((a, [, w]) => a + w, 0); let r = rnd() * t; for (const [k, w] of WEIGHTS) { if ((r -= w) < 0) return k; } return 'move'; };

    await seedHouse(); await page.evaluate(() => window.__rig.rules(true));
    console.log(`monkey SEED=${SEED0} STEPS=${STEPS}`);
    let fails = 0;
    for (let s = 1; s <= STEPS && fails < 3; s++) {
      const a = choice(); let touched = null; let err = '';
      const e0 = errors.length;
      try { touched = await ACTIONS[a](); } catch (e) { err = e.message.split('\n')[0].slice(0, 160); await closeAll().catch(() => {}); }
      log.push(`${s}:${a}${touched ? '(' + touched + ')' : ''}${err ? ' [harness: ' + err + ']' : ''}`);
      const bad = [...await O.invariants()];
      if (errors.length > e0) bad.push('page error: ' + errors.slice(e0).join(' | '));
      if (touched && (s % 3 === 0 || a === 'move')) bad.push(...await O.check(touched));
      if (bad.length) { fails++; await page.screenshot({ path: path.join(OUT, `m-${SEED0}-step${s}.png`) }); check('M', `step ${s} (${a}${touched ? ' ' + touched : ''}): the store's rules hold and every screen agrees`, false, bad.join(' || ') + `  — replay: SEED=${SEED0}; steps: ${log.join(' ')}`); }
    }
    // at the end, every item agrees
    const all = await items(); let endBad = [];
    for (const nm of all.slice(0, 25)) endBad.push(...await O.check(nm));
    check('M', `after ${STEPS} random steps (seed ${SEED0}): every item's screens agree with the store`, endBad.length === 0, endBad.slice(0, 6).join(' || '));
    check('M', `no page errors (seed ${SEED0})`, errors.length === 0, errors.slice(0, 3).join(' | '));
    console.log('steps:', log.join(' '));
  }
  await seedHouse();
  try { await runSuite(); } catch (e) { console.error('FATAL', e); check('M', 'suite ran', false, e.message); }
  await browser.close();
}
(async () => {
  await new Promise((r) => server.listen(PORT, r));
  await runLook('b');
  const pass = results.filter((r) => r.ok).length;
  console.log(`\n${pass}/${results.length} checks passed`);
  server.close();
})();
