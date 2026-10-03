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
  const page = await ctx.newPage();
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

  // journeys — 09-30 (TESTING.md #2): the stories in JOURNEYS.md, each step followed by the consistency oracle.
  // Retired 2026-10-01 (release 1 — the tier camera is gone):
  //   J8  "before Save it says the counter moves: Kitchen counter: Craft nook → Pantry shelf" — the camera's "Place:" /
  //       Q3 line (.lc-say .lc-move) is gone; a place now changes where IT is from its own page (the counter-moves part
  //       of J8 is kept: the counter's own "Where this place is", then the oracle on both items).
  //   J10 "photographing the Desk drawer it is already in: Is this the Desk drawer?" and "Yes: nothing moved, and the
  //       drawer has the new photo" — there are no place photos and no AI place matching in the camera any more. J10 is
  //       rewritten to what is left of the story: a new photo of the item in Move it, nothing else changed → nothing
  //       moves, the photo is the ITEM's, the drawer's photos are untouched.
  //   (J9's "the Linen closet is gone from the squares" is kept as the same check on the In chip.)
  async function runSuite() {
    // 10-01 (release 1): oracle.js still reads Move it's tier squares and chain line (.lv-strip / .lc-chainline), which are
    // gone — it would report every item with a place as a mismatch. Until oracle.js itself is updated, this suite uses
    // oracle.js for the truth, the store rules, the card and the item page, and reads the camera's ONE "In" chip instead:
    // Move it must open with the chip set to where it is now — "In: <first>" and the line under it "in the … · in the …"
    // (the rest of the chain) — and with no chip when it is nowhere. Her words: the item page shows her latest words
    // (`.tp-said q`) while they are still about where it is (saidNow), and none otherwise.
    const O0 = require('./oracle.js')({ page, PORT, tap });
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim().replace(/^in (the )?/i, '').toLowerCase();
    const O = O0; // 10-01: the release-1 check now lives in oracle.js
    const OUT = path.join(__dirname, 'shots_j'); fs.mkdirSync(OUT, { recursive: true });
    let n = 0; const snap = async (label) => { n++; await page.waitForTimeout(200); await page.screenshot({ path: path.join(OUT, `j-${String(n).padStart(2, '0')}-${label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`) }); };
    const ONLY = (process.argv[2] || '').split(',').filter(Boolean);
    let J = '';
    // after a step: every screen agrees with the store, and the store keeps its rules
    const agree = async (step, ...names) => {
      const bad = [...await O.invariants()];
      for (const nm of names) bad.push(...await O.check(nm));
      check(J, `${step}: every screen agrees${names.length ? ' (' + names.join(', ') + ')' : ''}`, bad.length === 0, bad.join(' || '));
      if (bad.length) await snap(`${J}-${step}-MISMATCH`);
    };
    const cardAgrees = async (step, nm) => { const bad = await O.card(nm); check(J, `${step}: the card after Save says it the same way`, bad.length === 0, bad.join(' || ')); };
    // ---- how a person drives the camera (10-01: photos are of the item; where = her words + ONE "In")
    const logItem = async (name, photo = 'real_slippers.jpg') => { await home(); AI = { name }; await cam(photo); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 }); };
    // Pick where it is in the camera's In list: an existing place/box by exact name, else a new place by that name.
    const pickPlace = async (name) => {
      await page.click('.ow-go'); await page.waitForSelector('.ow-sheet'); await page.click('.ow-sheet .ow-lvl-change >> nth=0'); await page.waitForSelector('.in-list');
      await page.fill('.in-list .wl-search input', name); await page.waitForTimeout(200);
      const row = page.locator(`.in-list .wl-row:has(b:text-is("${name}"))`);
      if (await row.count()) await row.first().click(); else await page.locator('.in-list .wl-new').first().click();
      await page.waitForTimeout(250);
    };
    const words = async (s) => { if (!(await page.locator('.ow-note-in').count())) await page.click('.ow-note'); await page.fill('.ow-note-in', s); await page.waitForTimeout(150); }; // 10-02: words are a note
    const chipText = () => page.evaluate(() => { const i = document.querySelector('.lc .ow-input'); return i && i.value ? 'In: ' + i.value : ''; }); // 10-02: the where field
    // the place page's own lists (Move / Move all) are still the Choose place list (WhereList)
    const choose = async (name) => {
      await page.waitForSelector('.where-list');
      await page.fill('.where-list .wl-search input', name); await page.waitForTimeout(200);
      const row = page.locator(`.where-list .wl-row:not(.wl-sugg):has-text("${name}")`);
      if (await row.count()) await row.first().click(); else await page.click('.where-list .wl-new.typed');
      await page.waitForTimeout(450);
      if (await page.locator('.where-list.bn .btn-primary').count()) await tap('.where-list.bn .btn-primary', { wait: 450 });
    };
    const save = async () => { await tap('.lc-k.sv', { wait: 2600 }); };
    const saveNext = async () => { const b = await page.locator('.lc-k.sv').boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await page.waitForTimeout(800); await page.mouse.up(); await page.waitForTimeout(1800); };
    const move = async (name) => { await O.openItem(name); await tap('.tp-btn:has-text("Move it"), .tp-btn:has-text("Put it somewhere")', { wait: 900 }); };
    const places = () => page.evaluate(() => window.__rig.dump().filter((d) => d.kind === 'place'));
    const placePage = async (nm) => { await home(); await tap('.menu-btn', { wait: 400 }); await tap('.drawer-row:has-text("Places")', { wait: 700 }); await tap(`.loc-row:has(b:text-is("${nm}"))`, { wait: 700 }); };
    // a PLACE changes where it is from its own page: ☰ → Places → the place → "Where this place is" → the In list (places only)
    const placeWhere = async (pl, to) => {
      await placePage(pl); await tap('.pl-where', { wait: 450 }); await page.waitForSelector('.in-list');
      await page.fill('.in-list .wl-search input', to); await page.waitForTimeout(200);
      const row = page.locator(`.in-list .wl-row:has(b:text-is("${to}"))`);
      if (await row.count()) await row.first().click(); else await page.locator('.in-list .wl-new').first().click();
      await page.waitForTimeout(900);
    };
    const story = async (id, fn) => { if (ONLY.length && !ONLY.includes(id)) return; J = id; console.log(`\n---- ${id}`);
      try { await seedHouse(); await page.evaluate(() => window.__rig.rules(true)); await fn(); } catch (e) { check(id, 'story ran to the end', false, e.message.slice(0, 300)); await snap(`${id}-ERROR`); } };

    await story('J1', async () => {
      await logItem('headphones'); await pickPlace('Kitchen counter'); await save(); await cardAgrees('logged', 'headphones');
      await agree('logged on the Kitchen counter', 'headphones');
      await move('headphones'); await pickPlace('Pantry shelf'); await save(); await cardAgrees('moved', 'headphones');
      await agree('moved to the Pantry shelf', 'headphones');
    });
    await story('J2', async () => {
      // the 3D model is in the Desk drawer in the seed; Ravi's was in the White cardboard box — put it there first
      await move('3D model of plant sensor'); await pickPlace('White cardboard box'); await save();
      await agree('in the White cardboard box', '3D model of plant sensor');
      // 10-01: "+ the Ikea shelving unit" = the White cardboard box's own "Where this place is" (a new place, by name)
      await placeWhere('White cardboard box', 'Ikea shelving unit');
      await agree('the White cardboard box in the Ikea shelving unit', '3D model of plant sensor');
      // next day: the shelf is there (on the chip's line) → the Ikea shelving unit's own where: Office (typed, keyboard up)
      await move('3D model of plant sensor'); let ch = await chipText();
      // 10-02 (one where): the field says the first level; → lists what it is in
      await tap('.ow-go', { wait: 400 }); ch += ' ' + (await page.locator('.ow-sheet .ow-lvl .t b').allInnerTexts()).slice(1).map((n) => 'in the ' + n).join(' '); await tap('.ow-sheet .ow-cancel', { wait: 300 });
      check(J, 'second visit: Move it opens on the White cardboard box, "in the Ikea shelving unit" under it', /White cardboard box/.test(ch) && /in the Ikea shelving unit/.test(ch), ch);
      await tap('.lc-x', { wait: 400 });
      await placeWhere('Ikea shelving unit', 'Office');
      const ch3 = (await O.truth('3D model of plant sensor')).chain;
      check(J, 'the store: the 3D model is in the White cardboard box in the Ikea shelving unit in the Office', JSON.stringify(ch3) === JSON.stringify(['White cardboard box', 'Ikea shelving unit', 'Office']), JSON.stringify(ch3));
      await agree('+ Office on top', '3D model of plant sensor');
      // then a Move with her words only, and Undo it from the page: the words go, the chain stays
      await move('3D model of plant sensor'); await words('top shelf, at the back'); await save();
      const note = await page.evaluate(() => ((document.querySelector('.tp-moved') || {}).innerText || '').replace(/\n/g, ' | '));
      const s1 = await page.evaluate(() => { const it = window.__rig.dump().find((d) => d.kind === 'item' && d.name === '3D model of plant sensor'); const h = (it.history || []).filter((x) => x.w); return h.length ? h[h.length - 1].said : ''; });
      check(J, 'a words-only Move: the words are saved (a note, 10-02), and the page says "Saved just now · Your note saved" with Undo', s1 === 'top shelf, at the back' && /Saved just now/.test(note) && /Your note saved/.test(note) && /Undo/.test(note), JSON.stringify({ s1, note }));
      if (await page.locator('.tp-moved .u').count()) await tap('.tp-moved .u', { wait: 1500 });
      const s = await page.evaluate(() => { const it = window.__rig.dump().find((d) => d.kind === 'item' && d.name === '3D model of plant sensor'); const h = (it.history || []).filter((x) => x.w); return h.length ? h[h.length - 1].said : ''; });
      check(J, 'Undo of that Move: her words are gone again', !s, JSON.stringify({ said: s }));
      await agree('Undo the words', '3D model of plant sensor');
    });
    await story('J3', async () => {
      // 10-01: a box is an item — log the White shoebox on the Linen closet, say it holds items, then log the scissors into it
      await logItem('White shoebox', 'box.jpg'); await pickPlace('Linen closet'); await save();
      await O.openItem('White shoebox'); await tap('button.sw[aria-label="It holds items"]', { wait: 700 });
      await logItem('blue scissors'); await pickPlace('White shoebox'); await save();
      await agree('in the White shoebox on the Linen closet', 'blue scissors');
      await O.openItem('White shoebox'); await tap('.tp-row:has-text("Rename")', { wait: 500 }); await page.locator('.sheet input').first().fill('Shoebox'); await tap('.sheet .btn-primary', { wait: 900 });
      await agree('the box renamed Shoebox', 'blue scissors');
      await home(); await tap('.menu-btn', { wait: 400 }); await tap('.drawer-row:has-text("Places")', { wait: 700 });
      const rows = await page.evaluate(() => [...document.querySelectorAll('.loc-row')].map((r) => r.innerText.replace(/\n/g, ' | ')));
      check(J, 'no ghost "White shoebox" in Places', !rows.some((r) => /white shoebox/i.test(r)), JSON.stringify(rows.filter((r) => /shoebox/i.test(r))));
    });
    await story('J4', async () => {
      await home(); await tap('.menu-btn', { wait: 400 }); await tap('.drawer-row:has-text("Places")', { wait: 700 });
      await tap('.loc-row:has-text("Kitchen counter")', { wait: 700 });
      await tap('button.field-value', { wait: 400 }); await page.locator('input.place-input').first().fill('Counter'); await page.keyboard.press('Enter'); await page.waitForTimeout(900);
      check(J, 'the place is called Counter now', !!(await places()).find((p) => p.name === 'Counter'), '');
      await agree('Kitchen counter renamed Counter', 'spare batteries');
    });
    await story('J5', async () => {
      await agree('before', 'baseball card');
      await move('wooden box'); await pickPlace('Pantry shelf'); await save();
      await agree('the wooden box moved to the Pantry shelf', 'baseball card', 'wooden box');
    });
    await story('J6', async () => {
      await logItem('tape measure'); await pickPlace('Linen closet'); await saveNext();
      AI = { name: 'glue gun' }; await cam('real_desk.jpg'); await tap('.lc-shutter', { wait: 1300 });
      const ch = await chipText();
      check(J, 'after Save + Next the next item starts In the Linen closet (shown on the chip)', /Linen closet/.test(ch), ch);
      if (!/Linen closet/.test(ch)) await pickPlace('Linen closet');
      await save();
      await agree('two in a row onto the Linen closet', 'tape measure', 'glue gun');
    });
    await story('J7', async () => {
      const before = (await places()).length;
      await logItem('stapler'); await pickPlace('Desk tray'); await save();
      const made = !!(await places()).find((p) => p.name === 'Desk tray');
      await page.waitForTimeout(600); await tap('.saved-card .u', { wait: 1500 });
      const left = await page.evaluate(() => window.__rig.dump().filter((d) => d.kind === 'item' && !d.deleted && /stapler/i.test(d.name || '')).map((d) => d.name));
      const pl = (await places()).filter((p) => /desk tray/i.test(p.name));
      check(J, 'Undo: the stapler and the new place made for it (Desk tray) are gone', made && left.length === 0 && pl.length === 0 && (await places()).length === before, JSON.stringify({ made, left, pl: pl.map((p) => p.name) }));
      await agree('after Undo');
    });
    await story('J8', async () => {
      await logItem('usb stick'); await pickPlace('Kitchen counter'); await save();
      await placeWhere('Kitchen counter', 'Craft nook');
      await agree('Kitchen counter in Craft nook', 'usb stick', 'spare batteries');
      await placeWhere('Kitchen counter', 'Pantry shelf'); // the counter moves; everything on it goes too
      await agree('the counter is in the Pantry shelf now', 'spare batteries', 'usb stick');
    });
    await story('J9', async () => {
      await placeWhere('Desk drawer', 'Linen closet'); // Desk drawer in Linen closet
      await agree('Desk drawer in Linen closet', '3D model of plant sensor', 'passport');
      await move('3D model of plant sensor'); await pickPlace('Kitchen counter');
      const ch = await chipText();
      check(J, 'a new In: the Linen closet (where the drawer is) is gone from the chip', /Kitchen counter/.test(ch) && !/linen closet/i.test(ch), ch);
      await save();
      await agree('moved to the Kitchen counter; the drawer keeps its own where', '3D model of plant sensor', 'passport');
    });
    await story('J10', async () => {
      const p0 = ((await places()).find((p) => p.name === 'Desk drawer') || {}).photos || [];
      const t0 = await O.truth('passport');
      await move('passport'); const off0 = await page.locator('.lc-k.sv').isDisabled();
      await cam('folder.jpg'); await tap('.lc-shutter', { wait: 900 });
      const off1 = await page.locator('.lc-k.sv').isDisabled();
      check(J, 'Move it, nothing changed: Save off; a new photo of it: Save on (the In unchanged)', off0 === true && off1 === false, JSON.stringify({ off0, off1 }));
      await save();
      const p1 = ((await places()).find((p) => p.name === 'Desk drawer') || {}).photos || [];
      const t1 = await O.truth('passport');
      check(J, 'saved: nothing moved, and the photo is the passport\'s — the Desk drawer\'s photos are untouched', JSON.stringify(t0.chain) === JSON.stringify(t1.chain) && p1.length === p0.length, JSON.stringify({ was: t0.chain, now: t1.chain, drawer: `${p0.length} -> ${p1.length}` }));
      await agree('after a photo-only Move', 'passport');
    });
    await story('J11', async () => {
      await page.evaluate(() => { const t = Date.now(); window.__rig.seed([
        { id: 'old1', kind: 'item', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [], name: 'old lantern', location: 'Garage shelf', photo: null, thumb: null, written: true, order: t, createdAt: t, lastSeenAt: t, photoCount: 0, history: [{ location: 'Garage shelf', at: t }] },
        { id: 'eg1', kind: 'edge', rel: 'in', from: 'pl4', to: { t: 'place', name: 'Craft nook' }, since: t, until: null, how: 'chosen', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [] }]); });
      await page.waitForTimeout(300);
      await agree('an old item with only a place written', 'old lantern');
    });
    await story('J12', async () => {
      await logItem('hole punch'); await pickPlace('Linen closet'); await save();
      await move('hole punch'); await pickPlace('Pantry shelf'); await save();
      const cards = await page.evaluate(() => ({ card: document.querySelectorAll('.saved-card').length, note: (document.querySelector('.tp-moved') || {}).innerText || '' }));
      check(J, 'after the quick Move no card is left over (the Log\'s Undo is gone); the page says it moved, from the Linen closet', cards.card === 0 && /Moved just now/.test(cards.note) && /Before: Linen closet/.test(cards.note), JSON.stringify(cards));
      await page.waitForTimeout(600); if (await page.locator('.tp-moved .u').count()) await tap('.tp-moved .u', { wait: 1500 });
      const it = await page.evaluate(() => window.__rig.dump().find((d) => d.kind === 'item' && !d.deleted && /hole punch/i.test(d.name || '')));
      check(J, 'Undo puts it back on the Linen closet — it is never deleted', !!it && /linen closet/i.test(it.location || ''), it ? it.location : 'DELETED');
      await agree('after Undo', 'hole punch');
    });
    await story('J13', async () => {
      // 09-30: a name you already have is never taken silently — it offers to merge (J17/J18); "Give it its own name" keeps both
      SAME_PLACE = { same: false, sure: true };
      await home(); await tap('.menu-btn', { wait: 400 }); await tap('.drawer-row:has-text("Places")', { wait: 700 });
      await tap('.loc-row:has-text("Kitchen counter")', { wait: 700 });
      await tap('button.field-value', { wait: 400 }); await page.locator('input.place-input').first().fill('pantry SHELF'); await page.keyboard.press('Enter'); await page.waitForTimeout(1500);
      const sh = await page.evaluate(() => (document.querySelector('.merge-sheet') || {}).innerText || '');
      await tap('.merge-sheet button:has-text("own name")', { wait: 500 });
      const two = (await places()).filter((p) => /pantry shelf/i.test(p.name)).length;
      check(J, 'renaming the Kitchen counter to "pantry SHELF": asked (merge or its own name), never taken silently; its own name keeps both', /You already have the Pantry shelf/.test(sh) && two === 1 && !!(await places()).find((p) => p.name === 'Kitchen counter'), JSON.stringify({ sh: sh.slice(0, 60), two }));
      await agree('after "Give it its own name"', 'spare batteries');
    });
    await story('J14', async () => {
      await logItem('lens cap'); await pickPlace('Linen closet'); await saveNext();
      await page.waitForTimeout(1200); await snap('J14 undo line after save+next');
      const line = await page.evaluate(() => (document.querySelector('.lc-undo') || {}).innerText || '');
      check(J, 'after Save + Next the camera keeps "✓ Lens cap saved · Undo" in reach', /Lens cap saved/i.test(line) && /Undo/.test(line), line);
      await tap('.lc-undo button', { wait: 1500 });
      const gone = await page.evaluate(() => !window.__rig.dump().some((d) => d.kind === 'item' && !d.deleted && /lens cap/i.test(d.name || '')));
      check(J, 'Undo there takes the lens cap back out (the camera stays open for the next item)', gone && await page.locator('.lc').count() === 1, `gone=${gone}`);
      await tap('.lc-x', { wait: 400 }); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 400 });
      await agree('after Undo in the camera');
    });
    await story('J15', async () => {
      await placePage('Craft nook');
      const st0 = await page.evaluate(() => ({ rows: [...document.querySelectorAll('.pl-row b')].map((b) => b.innerText), rmOff: [...document.querySelectorAll('button')].find((b) => /Remove this place/.test(b.innerText)).disabled, note: (document.querySelector('.note-quiet.left') ? [...document.querySelectorAll('.note-quiet.left')].map((x) => x.innerText).join(' ') : '') }));
      await snap('J15 craft nook worklist');
      check(J, 'the Craft nook page lists what is in it, each with Move; Remove this place is off until it is empty', st0.rows.length === 2 && st0.rmOff === true && /Move the 2 items first/.test(st0.note), JSON.stringify(st0));
      await tap('.pl-row:has-text("Tote bin") .pl-move', { wait: 500 }); await choose('Linen closet');
      await agree('the tote bin moved to the Linen closet from the place page', 'tote bin');
      await placePage('Craft nook'); // (the oracle opened other pages)
      const left1 = await page.evaluate(() => [...document.querySelectorAll('.pl-row b')].map((b) => b.innerText));
      check(J, 'the list gets shorter as you go (1 left)', left1.length === 1, JSON.stringify(left1));
      await tap('.pl-row .pl-move', { wait: 500 }); await choose('Garage shelf');
      await page.waitForTimeout(400);
      const rmOn = await page.evaluate(() => ![...document.querySelectorAll('button')].find((b) => /Remove this place/.test(b.innerText)).disabled);
      check(J, 'empty now: Remove this place is on', rmOn, '');
      await agree('everything moved out of the Craft nook', 'filing cabinet', 'tote bin');
    });
    await story('J16', async () => {
      // Move all to…
      await placePage('Craft nook'); await tap('.pl-all', { wait: 500 }); await choose('Pantry shelf');
      const at = await page.evaluate(() => window.__rig.dump().filter((d) => d.kind === 'item' && !d.deleted && /tote bin|filing cabinet/i.test(d.name || '')).map((d) => d.location));
      check(J, '"Move all to…" moves every item in the Craft nook to the Pantry shelf', at.length === 2 && at.every((l) => /pantry shelf/i.test(l)), JSON.stringify(at));
      await agree('after Move all', 'tote bin', 'filing cabinet');
    });
    await story('J17', async () => {
      SAME_PLACE = { same: true, sure: true };
      await placePage('Kitchen counter'); await tap('button.field-value', { wait: 400 }); await page.locator('input.place-input').first().fill('Pantry shelf'); await page.keyboard.press('Enter'); await page.waitForTimeout(1500);
      const sh = await page.evaluate(() => (document.querySelector('.merge-sheet') || {}).innerText || '');
      await snap('J17 merge same');
      check(J, 'renaming the Kitchen counter to the Pantry shelf offers to merge, and says they look like the same place', /You already have the Pantry shelf/.test(sh) && /same place/.test(sh) && /Merge into the Pantry shelf/.test(sh), sh.replace(/\n/g, ' | '));
      await tap('.merge-sheet .btn-primary', { wait: 1500 });
      const pl = await places(); const pan = pl.find((p) => p.name === 'Pantry shelf');
      check(J, 'merged: no Kitchen counter left; one Pantry shelf with both photos', !pl.find((p) => p.name === 'Kitchen counter') && pl.filter((p) => p.name === 'Pantry shelf').length === 1 && (pan.photos || []).length === 2, JSON.stringify((pan || {}).photos ? pan.photos.length : null));
      await agree('after the merge', 'spare batteries');
    });
    await story('J18', async () => {
      SAME_PLACE = { same: false, sure: true };
      await placePage('Kitchen counter'); await tap('button.field-value', { wait: 400 }); await page.locator('input.place-input').first().fill('Linen closet'); await page.keyboard.press('Enter'); await page.waitForTimeout(1500);
      const sh = await page.evaluate(() => (document.querySelector('.merge-sheet') || {}).innerText || '');
      check(J, 'different photos: it says so, and offers keep-the-closet\'s / keep-all / own name', /look like different places/.test(sh) && /keep the Linen closet’s photos/.test(sh) && /keep all photos/.test(sh) && /own name/.test(sh), sh.replace(/\n/g, ' | '));
      await tap('.merge-sheet button:has-text("keep all photos")', { wait: 600 });
      const n0 = await page.locator('.mg-ph').count(); await snap('J18 review photos');
      await tap('.mg-ph >> nth=1 >> .mg-rm', { wait: 400 });
      const conf = await page.evaluate(() => [...document.querySelectorAll('.sheet-title')].map((t) => t.innerText).join(' | '));
      check(J, '"keep all photos" shows every photo; the bin on one asks "Remove this photo?" first', n0 === 2 && /Remove this photo\?/.test(conf), `${n0} photos · ${conf}`);
      await tap('.sheet button:has-text("Remove")', { wait: 400 });
      const n1 = await page.locator('.mg-ph').count();
      await tap('.merge-sheet .btn-primary', { wait: 1500 });
      const lc = (await places()).find((p) => p.name === 'Linen closet');
      check(J, 'merged with the one photo kept; no Kitchen counter left', n1 === 1 && !(await places()).find((p) => p.name === 'Kitchen counter') && (lc.photos || []).length === 1, `${n1} · ${(lc.photos || []).length}`);
      await agree('after the merge with photos reviewed', 'spare batteries');
    });
    await story('J19', async () => {
      // 10-01: her words only — no In. It is not a "Not put away" chore; the page shows her words and offers to put it away.
      const npa = async () => { await home(); return page.evaluate(() => { const b = document.querySelector('.notput'); return b ? Number((b.innerText.match(/(\d+)/) || [])[1] || 0) : 0; }); };
      const n0 = await npa();
      await logItem('sewing kit'); await words('in the blue basket under the stairs'); await save();
      const st = await page.evaluate(() => { const it = window.__rig.dump().find((d) => d.kind === 'item' && !d.deleted && d.name === 'sewing kit'); return it ? { loc: it.location || '', w: (it.history || []).filter((x) => x.w).map((x) => x.said) } : null; });
      check(J, 'saved with her words only: no place, and the words are in its history as said', !!st && !st.loc && st.w.length === 1 && st.w[0] === 'in the blue basket under the stairs', JSON.stringify(st));
      const n1 = await npa();
      check(J, '10-02 (night): an item with only a note IS "Not put away" (a note is never a where; tester ow1 #5)', n1 === n0 + 1, `${n0} -> ${n1}`);
      await O.openItem('sewing kit');
      const pg = await page.evaluate(() => ({ note: (document.querySelector('.tp-note') || {}).innerText || '', where: (document.querySelector('.tp-blk[aria-labelledby="tp-where"]') || {}).innerText || '', put: !!document.querySelector('.tp-put') }));
      check(J, 'the item page: her words as a note under the photo, "No place yet", no "Put it in a place or a box" (10-02)', /blue basket under the stairs/.test(pg.note) && /No place yet/.test(pg.where) && !pg.put, JSON.stringify(pg));
      await agree('words only', 'sewing kit');
      await move('sewing kit'); await pickPlace('Linen closet'); await page.waitForTimeout(400); if (await page.locator('.ow-sheet').count()) await page.screenshot({ path: 'shots/j19_dbg.png' }); await save();
      await agree('then put In the Linen closet', 'sewing kit');
    });
  }
  await seedHouse();
  try { await runSuite(); } catch (e) { console.error('FATAL', e); check('J', 'suite ran', false, e.message); }
  await browser.close();
}
(async () => {
  await new Promise((r) => server.listen(PORT, r));
  await runLook('b');
  const pass = results.filter((r) => r.ok).length;
  console.log(`\n${pass}/${results.length} checks passed`);
  console.log('Page errors:', errors.length ? errors : 'none');
  console.log('Console errors (unique):', Array.from(new Set(consoleErrors)).slice(0, 10));
  server.close();
})();
