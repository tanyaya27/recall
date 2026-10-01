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

  // journeys — 09-30 (TESTING.md #2): the stories in JOURNEYS.md, each step followed by the consistency oracle.
  async function runSuite() {
    const O = require('./oracle.js')({ page, PORT, tap });
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
    // ---- how a person drives the camera
    const logItem = async (name, photo = 'real_slippers.jpg') => { await home(); AI = { name }; await cam(photo); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 }); };
    const plus = async () => { if (await page.locator('.lv-sq.plus').count()) await tap('.lv-sq.plus', { wait: 350 }); };
    const choose = async (name) => {
      if (!(await page.locator('.where-list').count())) await tap('.lc-choose', { wait: 450 });
      await page.fill('.wl-search input', name); await page.waitForTimeout(200);
      const row = page.locator(`.where-list .wl-row:not(.wl-sugg):has-text("${name}")`);
      if (await row.count()) await row.first().click(); else await page.click('.wl-new.typed');
      await page.waitForTimeout(450);
    };
    const shootPlace = async (file, where, nameIt = '') => {
      WHERE.push(where); await cam(file); await tap('.lc-shutter', { wait: 300 });
      for (let k = 0; k < 40 && await page.locator('.lv-look').count(); k++) await page.waitForTimeout(150);
      for (let k = 0; k < 14 && !(await page.locator('.where-list, .photo-for').count()); k++) await page.waitForTimeout(150); for (let k = 0; k < 40 && (await page.locator('.where-list .wl-sugg.quiet:has-text("Looking")').count()); k++) await page.waitForTimeout(150); /* 09-30f: Choose place opens at once; wait for ReCall's look */
      if (await page.locator('.where-list .wl-sugg:not(.quiet)').count()) return; // a suggestion: the test answers it
      if (await page.locator('.wl-pend .btn-primary').count()) { if (nameIt) await page.locator('.wl-pend input').fill(nameIt); await tap('.wl-pend .btn-primary', { wait: 450 }); }
    };
    const save = async () => { await tap('.lc-k.sv', { wait: 2600 }); };
    const saveNext = async () => { const b = await page.locator('.lc-k.sv').boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await page.waitForTimeout(800); await page.mouse.up(); await page.waitForTimeout(1800); };
    const move = async (name) => { await O.openItem(name); await tap('button:has-text("Move it"), button:has-text("Put it somewhere")', { wait: 900 }); };
    const tierSheet = async (i) => { const sq = page.locator('.lv-strip .lv-sq').nth(i); if (!/\bsel\b/.test(await sq.getAttribute('class'))) { await sq.click(); await page.waitForTimeout(300); } await sq.click(); await page.waitForTimeout(400); };
    const places = () => page.evaluate(() => window.__rig.dump().filter((d) => d.kind === 'place'));
    const story = async (id, fn) => { if (ONLY.length && !ONLY.includes(id)) return; J = id; console.log(`\n---- ${id}`);
      try { await seedHouse(); await page.evaluate(() => window.__rig.rules(true)); await fn(); } catch (e) { check(id, 'story ran to the end', false, e.message.slice(0, 300)); await snap(`${id}-ERROR`); } };

    await story('J1', async () => {
      await logItem('headphones'); await plus(); await choose('Kitchen counter'); await save(); await cardAgrees('logged', 'headphones');
      await agree('logged on the Kitchen counter', 'headphones');
      await move('headphones'); await choose('Pantry shelf'); await save(); await cardAgrees('moved', 'headphones');
      await agree('moved to the Pantry shelf', 'headphones');
    });
    await story('J2', async () => {
      // the 3D model is in the Desk drawer in the seed; Ravi's was in the White cardboard box — put it there first
      await move('3D model of plant sensor'); await choose('White cardboard box'); await save();
      await agree('in the White cardboard box', '3D model of plant sensor');
      await move('3D model of plant sensor'); await plus(); await shootPlace('closet.jpg', { name: 'bookshelf', moves: false }, 'Ikea shelving unit'); await save();
      await cardAgrees('+ Ikea shelving unit', '3D model of plant sensor');
      await agree('+ Ikea shelving unit', '3D model of plant sensor');
      await move('3D model of plant sensor'); await plus(); await choose('Office'); await save();
      await agree('+ Office on top', '3D model of plant sensor');
      await page.waitForTimeout(600); if (await page.locator('.tp-moved .u').count()) await tap('.tp-moved .u', { wait: 1500 });
      await agree('Undo the Office', '3D model of plant sensor');
    });
    await story('J3', async () => {
      await logItem('blue scissors'); await plus(); await shootPlace('box.jpg', { name: 'White shoebox', moves: true }); await plus(); await choose('Linen closet'); await save();
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
      await move('wooden box'); await choose('Pantry shelf'); await save();
      await agree('the wooden box moved to the Pantry shelf', 'baseball card', 'wooden box');
    });
    await story('J6', async () => {
      await logItem('tape measure'); await plus(); await choose('Linen closet'); await saveNext();
      AI = { name: 'glue gun' }; await cam('real_desk.jpg'); await tap('.lc-shutter', { wait: 1300 });
      const sq = await page.evaluate(() => [...document.querySelectorAll('.lv-strip .lv-sq:not(.plus)')].map((b) => b.getAttribute('aria-label')));
      await plus(); if (!(await page.locator('.lv-strip .lv-sq').count())) await plus();
      await choose('Linen closet'); await save();
      await agree('two in a row onto the Linen closet', 'tape measure', 'glue gun');
      console.log('   after Save + Next the next item started with', JSON.stringify(sq));
    });
    await story('J7', async () => {
      const before = (await places()).length;
      await logItem('stapler'); await plus(); await shootPlace('box14.jpg', { name: 'desk tray', moves: true }); await plus(); await choose('Craft nook'); await save();
      await page.waitForTimeout(600); await tap('.saved-card .u', { wait: 1500 });
      const left = await page.evaluate(() => window.__rig.dump().filter((d) => d.kind === 'item' && !d.deleted && /stapler|desk tray/i.test(d.name || '')).map((d) => d.name));
      check(J, 'Undo: the stapler and the desk tray made for it are gone', left.length === 0 && (await places()).length === before, JSON.stringify(left));
      await agree('after Undo');
    });
    await story('J8', async () => {
      await logItem('usb stick'); await plus(); await choose('Kitchen counter'); await plus(); await choose('Craft nook'); await save();
      await agree('Kitchen counter in Craft nook', 'usb stick', 'spare batteries');
      await move('spare batteries');
      await tierSheet(1); await tap('.tier-sheet .sheet-row:has-text("Choose place")', { wait: 400 }); await choose('Pantry shelf');
      const q3 = await page.evaluate(() => [...document.querySelectorAll('.lc-say .lc-move')].map((x) => x.innerText));
      check(J, 'before Save it says the counter moves: "Kitchen counter: Craft nook → Pantry shelf"', q3.some((t) => /Kitchen counter: Craft nook → Pantry shelf/.test(t)), JSON.stringify(q3));
      await save();
      await agree('the counter is in the Pantry shelf now', 'spare batteries', 'usb stick');
    });
    await story('J9', async () => {
      await move('3D model of plant sensor'); await plus(); await choose('Linen closet'); await save(); // Desk drawer in Linen closet
      await agree('Desk drawer in Linen closet', '3D model of plant sensor', 'passport');
      await move('3D model of plant sensor'); await tierSheet(0); await tap('.tier-sheet .sheet-row:has-text("Choose place")', { wait: 400 }); await choose('Kitchen counter');
      const sq = await page.evaluate(() => [...document.querySelectorAll('.lv-strip .lv-sq:not(.plus)')].map((b) => b.getAttribute('aria-label')));
      check(J, 'a new tier 1: the Linen closet (where the drawer is) is gone from the squares', !sq.some((s) => /linen closet/i.test(s)), JSON.stringify(sq));
      await save();
      await agree('moved to the Kitchen counter; the drawer keeps its own where', '3D model of plant sensor', 'passport');
    });
    await story('J10', async () => {
      const p0 = ((await places()).find((p) => p.name === 'Desk drawer') || {}).photos || [];
      await move('passport'); await shootPlace('drawer.jpg', { name: 'drawer', moves: false, known: 'Desk drawer', sure: true });
      const ask = await page.evaluate(() => (document.querySelector('.where-list .wl-sugg:not(.quiet)') || {}).innerText || '');
      check(J, 'photographing the Desk drawer it is already in: "Is this the Desk drawer?"', /Desk drawer[\s\S]*looks like this one/i.test(ask), ask.replace(/\n/g, ' '));
      if (ask) await tap('.where-list .wl-sugg:not(.quiet)', { wait: 500 });
      await save();
      const p1 = ((await places()).find((p) => p.name === 'Desk drawer') || {}).photos || [];
      check(J, 'Yes: nothing moved, and the drawer has the new photo', p1.length === Math.min(6, p0.length + 1), `${p0.length} -> ${p1.length}`);
      await agree('after Yes', 'passport');
    });
    await story('J11', async () => {
      await page.evaluate(() => { const t = Date.now(); window.__rig.seed([
        { id: 'old1', kind: 'item', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [], name: 'old lantern', location: 'Garage shelf', photo: null, thumb: null, written: true, order: t, createdAt: t, lastSeenAt: t, photoCount: 0, history: [{ location: 'Garage shelf', at: t }] },
        { id: 'eg1', kind: 'edge', rel: 'in', from: 'pl4', to: { t: 'place', name: 'Craft nook' }, since: t, until: null, how: 'chosen', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [] }]); });
      await page.waitForTimeout(300);
      await agree('an old item with only a place written', 'old lantern');
    });
    await story('J12', async () => {
      await logItem('hole punch'); await plus(); await choose('Linen closet'); await save();
      await move('hole punch'); await choose('Pantry shelf'); await save();
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
      await logItem('lens cap'); await plus(); await choose('Linen closet'); await saveNext();
      await page.waitForTimeout(1200); await snap('J14 undo line after save+next');
      const line = await page.evaluate(() => (document.querySelector('.lc-undo') || {}).innerText || '');
      check(J, 'after Save + Next the camera keeps "✓ Lens cap saved · Undo" in reach', /Lens cap saved/i.test(line) && /Undo/.test(line), line);
      await tap('.lc-undo button', { wait: 1500 });
      const gone = await page.evaluate(() => !window.__rig.dump().some((d) => d.kind === 'item' && !d.deleted && /lens cap/i.test(d.name || '')));
      check(J, 'Undo there takes the lens cap back out (the camera stays open for the next item)', gone && await page.locator('.lc').count() === 1, `gone=${gone}`);
      await tap('.lc-x', { wait: 400 }); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 400 });
      await agree('after Undo in the camera');
    });
    const placePage = async (nm) => { await home(); await tap('.menu-btn', { wait: 400 }); await tap('.drawer-row:has-text("Places")', { wait: 700 }); await tap(`.loc-row:has-text("${nm}")`, { wait: 700 }); };
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
