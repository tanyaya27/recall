// The Yes-then-Save regression suite (2026-09-28), committed after the phone scare of build
// 20260928a: the phone appeared to hit "answer Yes to a recognition ask, then Save does nothing".
// The rig proved the shipped code sound in all four variants (visual / by-name x place / box); the
// phone had been running the previous bundle. Kept as a permanent suite because the original
// verification only asserted "no duplicate doc" after Yes-save - which passes even when the save
// never happens. These checks assert the parts that were missing: Save CLOSES the camera, the item
// IS written, and the confirmed identity leaves the chips. Also checks the menu's build stamp.
// Run: PORT=8461 node -r ./ow_adapter.js audit_r1.js   (after ./build.sh)   WebKit: ENGINE=webkit WEBKIT_PATH=/home/claude/pwb PORT=8462 node -r ./engine.js -r ./ow_adapter.js audit_r1.js
// 10-02: ported to the "one where, photo first" camera (see runSuite's header).
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
    // 10-02 (one where): a photo of a NEW place gets ReCall's guess (engine.placeGuess) — answered here, never a MOVES ask
    if (/PLACE GUESS/.test(texts)) { const m = texts.match(/TYPED: "([^"]*)"/); out = { name: 'Shelf by the door', merged: ((m && m[1]) || 'Shelf') + ' by the door' }; }
    else if (/MOVES:/.test(texts)) {
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

  // 10-01 release 1 "Words, and one pick" (Tanya; DECISIONS 2026-10-01), PORTED 10-02 to "one where, photo first"
  // (BOARD_2026-10-02_one-where.md rounds 1-4): one where field (.ow-input) + → sheet (.ow-sheet) + a note (.ow-note).
  // Every check keeps its ID; a rule the 10-02 rulings removed is either replaced by the new rule's equivalent (marked
  // "10-02:" in its name) or left as a "// retired 10-02 (one where): <why>" line. Drives the real camera, the → sheet and
  // its In list, the item page, Home, Find and a place's page; reads the store after every save.
  // Run: PORT=8461 node -r ./ow_adapter.js audit_r1.js   (the adapter presses Done when an In list closes on the → sheet)
  async function runSuite() {
    const OUT = path.join(__dirname, 'shots_r1'); fs.mkdirSync(OUT, { recursive: true });
    const snap = async (f) => { await page.waitForTimeout(300); await page.screenshot({ path: path.join(OUT, f) }); };
    const noAuto = () => page.evaluate(() => { window.__noAuto = true; });
    const openThing = async (nm) => { await home(); await noAuto(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', nm); await page.waitForTimeout(400); await page.click('.ask .tile >> nth=0'); await page.waitForSelector('.card.thing'); await page.waitForTimeout(400); };
    const log = async (file, name) => { await home(); await noAuto(); AI = { name }; await tap(LOG, { wait: 800 }); await cam(file); await tap('.lc-shutter', { wait: 900 }); };
    const save = async () => { await tap('.lc-k.sv', { wait: 1200 }); };
    const leave = async () => { if (await count('.in-list')) await tap('.in-list .btn-quiet:has-text("Cancel")', { wait: 300 }); if (await count('.ow-sheet')) await tap('.ow-sheet .ow-cancel', { wait: 300 });
      if (await count('.lc')) { await tap('.lc-x', { wait: 300 }); for (const t of ['Throw away', 'Leave']) if (await page.locator(`text=${t}`).count()) await tap(`text=${t}`, { wait: 300 }); } };
    const edgeOf = async (id) => (await dump()).find((d) => d.kind === 'edge' && d.from === id && !d.until) || null;
    const lastW = (it) => { const h = (it && it.history) || []; for (let i = h.length - 1; i >= 0; i--) if (h[i].w) return h[i]; return null; };
    // ---- 10-02 the new camera (helpers as in audit_ow.js / audit_graph.js) ----
    const openMove = async (nm) => { await openThing(nm); await tap('.thing-page button:has-text("Move it"), .thing-page button:has-text("Put it somewhere")', { wait: 900 }); };
    const typeWhere = async (s) => { await page.locator('.ow-input').click(); await page.waitForTimeout(150); await page.locator('.ow-input').fill(s); await page.waitForTimeout(250); };
    const done = async () => { await page.locator('.ow-input').press('Enter'); await page.waitForTimeout(250); };
    const whereVal = () => page.locator('.ow-input').first().inputValue().catch(() => '');
    const saveOff = () => page.locator('.lc-k.sv').first().isDisabled();
    // the replacement for "open the In list": → then Change (or Choose) on level 1
    const openIn = async () => { await page.click('.ow-go'); await page.waitForSelector('.ow-sheet'); await page.click('.ow-sheet .ow-lvl-change >> nth=0'); await page.waitForSelector('.in-list'); };
    // the replacement for "+ What is the X in?" (.w1-up): → then the + under the last level
    const openUp = async () => { await page.click('.ow-go'); await page.waitForSelector('.ow-sheet'); await page.click('.ow-sheet .ow-up'); await page.waitForSelector('.in-list'); };
    const pickIn = async (q, row = '.in-list .wl-row >> nth=0') => { await page.fill('.in-list .wl-search input', q); await page.waitForTimeout(250); await tap(row, { wait: 450 }); };
    const cancelIn = async () => { await tap('.in-list .btn-quiet:has-text("Cancel")', { wait: 350 }); }; // the adapter presses Done on the sheet: nothing changed
    const sheet = async () => { await page.click('.ow-go'); await page.waitForSelector('.ow-sheet'); await page.waitForTimeout(200);
      const r = await page.evaluate(() => ({ lv: [...document.querySelectorAll('.ow-sheet .ow-lvl b')].map((b) => b.innerText.replace(/\s*NEW\s*$/, '').trim()), news: [...document.querySelectorAll('.ow-sheet .ow-lvl')].map((l) => !!l.querySelector('.ow-new')),
        change: document.querySelectorAll('.ow-sheet .ow-lvl .ow-lvl-change').length, up: [...document.querySelectorAll('.ow-sheet .ow-up')].map((u) => u.innerText) }));
      await tap('.ow-sheet .ow-cancel', { wait: 300 }); return r; };
    const addNote = async (s) => { if (!(await count('.ow-note-in'))) await tap('.ow-note', { wait: 250 }); await page.fill('.ow-note-in', s); await page.waitForTimeout(200); };
    const wone = () => text('.tp-wone');
    const step = async (id, name, fn) => { try { await fn(); } catch (e) { check(id, name, false, 'threw: ' + String(e.message).split('\n')[0]); await page.keyboard.press('Escape').catch(() => {}); await leave().catch(() => {}); } };
    page.setDefaultTimeout(8000);
    lastPool = null;
    let it, e;

    // ---- Home: photo + name only ----
    await home(); await noAuto();
    const sub = await count('.board .tile .tile-sub');
    check('H1', 'Home tiles show the photo and the name only — no where line, no "No place yet"', sub === 0, String(sub));
    await snap('r-H1.png');

    // ---- Log: a note only ----
    await step('C1', 'Log: note only', async () => {
      await log('glasses.jpg', 'reading glasses case');
      const ui = await page.evaluate(() => ({ where: !!document.querySelector('.ow-field .ow-input'), go: !!document.querySelector('.ow-go'), note: !!document.querySelector('button.ow-note'), oldWords: !!document.querySelector('.w1-words'), oldIn: !!document.querySelector('.w1-in'), strip: !!document.querySelector('.lv-strip'), choose: !!document.querySelector('.lc-choose'), plus: !!document.querySelector('.lc-plus-out') }));
      check('C1', '10-02: after the first photo: ONE where field with →, and "+ Add a note" — no words field, no In chip, no tier squares, no +, no Choose place', ui.where && ui.go && ui.note && !ui.oldWords && !ui.oldIn && !ui.strip && !ui.choose && !ui.plus, JSON.stringify(ui));
      await snap('r-C1.png');
      await cam('glasses.jpg'); await tap('.lc-shutter', { wait: 700 });
      const n2 = await page.evaluate(() => ({ n: (document.querySelector('.lc-thing .lv-n') || {}).innerText || '', sheet: !!document.querySelector('.sheet') }));
      check('C2', 'a second photo is another photo of the item — no question', n2.n === '2' && !n2.sheet, JSON.stringify(n2));
      await addNote('on the dryer shelf behind the detergent');
      await save();
      it = await byName('reading glasses case');
      const w = lastW(it);
      check('C3', 'a note only: saved as she said it, as a NOTE (n: 1), no link — and it is "Not put away" (a note is never a where; tester ow1 #5)', !!it && !it.location && !(await edgeOf(it.id)) && w && w.said === 'on the dryer shelf behind the detergent' && w.n === 1 && it.needsPlace === true && it.photoCount === 2, JSON.stringify({ loc: it && it.location, w, np: it && it.needsPlace, pc: it && it.photoCount }));
      const card1 = await text('.saved-card');
      check('C3b', 'the card after Save says her words', /dryer shelf/.test(card1), card1.slice(0, 120));
    });

    // ---- Log: the note never feeds the list; a pick sets the where ----
    await step('C4', 'Log: note + pick', async () => {
      await log('folder.jpg', 'blue folder');
      await addNote('in the blue folder in the desk drawer');
      await openIn();
      const inl = await page.evaluate(() => { const L = document.querySelector('.in-list'); return { said: [...L.querySelectorAll('.wl-row.said')].length, nw: [...L.querySelectorAll('.wl-new')].map((b) => b.innerText), g: [...L.querySelectorAll('.wl-g')].map((x) => x.innerText), quote: !!L.querySelector('.wl-said') }; });
      // retired 10-02 (one where): "her words lead the In list" (Desk drawer · you said it, New place: Blue folder) — InList gets said="" now; replaced by the rule below
      check('C4', '10-02: a note never feeds the list — no "From what you said", no "you said it" rows, no New place from the note', !inl.said && !inl.nw.length && !inl.quote && !inl.g.some((x) => /what you said/i.test(x)), JSON.stringify(inl));
      await snap('r-C4.png');
      await pickIn('desk drawer', '.in-list .wl-row:has(b:text-is("Desk drawer"))');
      const v = await whereVal(); const h = await text('.ow-head');
      check('C5', '10-02: a pick sets the where: the field reads "Desk drawer", "Set place." (not NEW)', v === 'Desk drawer' && /Set place\./.test(h) && !/NEW/.test(h), `${v} / ${h}`);
      await save();
      it = await byName('blue folder'); e = await edgeOf(it.id);
      check('C5b', 'saved: in the Desk drawer, and her note kept', it.location === 'Desk drawer' && e && e.to.t === 'place' && e.to.name === 'Desk drawer' && lastW(it) && /blue folder/.test(lastW(it).said), JSON.stringify({ loc: it.location, e: e && e.to, w: lastW(it) }));
    });

    // ---- Log: a new place, typed ----
    await step('C6', 'Log: typed new place', async () => {
      await log('soda.jpg', 'spare keys');
      await typeWhere('in the tackle tray');
      const h = await text('.ow-head');
      // retired 10-02 (one where): "names she said are offered as new places" (From what you said) — a new place is now what she types in the where field
      check('C6', '10-02: typing "in the tackle tray" into the where field: "Set NEW place." — a new place, named without the "in the"', /Set NEW place\./.test(h), h);
      await done();
      const v = await whereVal(); const to = await text('.ow-to');
      check('C6b', '10-02: the field says "Tackle tray" and it is new (strip: "Tackle tray (new)")', v === 'Tackle tray' && /Tackle tray \(new\)/.test(to), `${v} / ${to}`);
      await save();
      it = await byName('spare keys'); const pl = await placeByName('Tackle tray'); e = await edgeOf(it.id);
      check('C6c', 'saved: a place "Tackle tray" made, the keys in it', !!pl && e && e.to.name === 'Tackle tray' && it.location === 'Tackle tray', JSON.stringify({ pl: !!pl, e: e && e.to }));
    });
    // clearing the where on a Log: nothing
    await step('C7', 'Log: where cleared', async () => {
      await log('wallet.jpg', 'coin purse'); await openIn(); await tap('.in-list .wl-row >> nth=0', { wait: 450 });
      const set1 = await whereVal();
      await typeWhere(''); await done();
      const back = await page.evaluate(() => ({ v: document.querySelector('.ow-input').value, head: document.querySelector('.ow-head').innerText }));
      check('C7', '10-02: clearing the field takes the place off again (✕ is gone; what you see is what is saved)', !!set1 && back.v === '' && /Where is it\?/.test(back.head) && /type to set a place/.test(back.head), JSON.stringify({ set1, ...back }));
      await save(); it = await byName('coin purse');
      check('C7b', 'saved with no place and no words → it is "Not put away"', it && !it.location && !(await edgeOf(it.id)) && it.needsPlace === true, JSON.stringify({ loc: it && it.location, np: it && it.needsPlace }));
      check('C8', 'nothing asked the AI where a photo is (no place matching on the camera)', lastPool === null, String(lastPool));
    });

    // ---- Move it: a boxed item ----
    await step('M1', 'Move it: boxed item', async () => {
      await openThing('baseball card'); await cam('smallbox.jpg'); await tap('button:has-text("Move it")', { wait: 900 });
      const v = await whereVal(); const off = await saveOff(); const sh = await sheet();
      check('M1', '10-02: Move it on a boxed item: the field reads "Wooden box", → shows what that is in (Memorabilia box); Save off until a change', v === 'Wooden box' && sh.lv[0] === 'Wooden box' && sh.lv[1] === 'Memorabilia box' && off, JSON.stringify({ v, sh, off }));
      await snap('r-M1.png');
      await addNote('top tray, in the plastic sleeve');
      const on = !(await saveOff());
      check('M2', '10-02: a note alone turns Save on', on, String(on));
      await save();
      it = await byName('baseball card'); e = await edgeOf(it.id);
      check('M2b', 'a note only on a Move: still in the wooden box, her note saved', e && e.to.t === 'thing' && e.to.id === 'w' && /plastic sleeve/.test((lastW(it) || {}).said || ''), JSON.stringify({ e: e && e.to, w: lastW(it) }));
      const page1 = await page.evaluate(() => ({ name: (document.querySelector('.tp-wname') || {}).innerText || '', win: [...document.querySelectorAll('.tp-win')].map((x) => x.innerText), note: (document.querySelector('.tp-note') || {}).innerText || '' }));
      check('P2', '10-02: the item page: one where (Wooden box, in the Memorabilia box), and her words as a note under the photo', page1.name === 'Wooden box' && page1.win.some((x) => /Memorabilia box/.test(x)) && /plastic sleeve/.test(page1.note) && /^Note:/.test(page1.note), JSON.stringify(page1));
      await snap('r-P2.png');
    });
    // move it out to the Kitchen counter, then Undo
    await step('M3', 'Move to Kitchen counter + Undo', async () => {
      await tap('button:has-text("Move it")', { wait: 900 }); await openIn(); await pickIn('kitchen');
      await save();
      it = await byName('baseball card'); e = await edgeOf(it.id);
      const w3 = lastW(it);
      check('M3', 'Move to the Kitchen counter: out of the wooden box; the old note goes with the old place', e && e.to.t === 'place' && e.to.name === 'Kitchen counter' && w3 && w3.said === '', JSON.stringify({ e: e && e.to, w: w3 }));
      const note = await text('.tp-moved');
      check('M3b', 'the page says it moved, with Undo', /Moved just now/.test(note) && /Undo/.test(note), note.slice(0, 120));
      await tap('.tp-moved .u', { wait: 1200 });
      it = await byName('baseball card'); e = await edgeOf(it.id);
      check('M4', 'Undo: back in the wooden box, and her note is back', e && e.to.t === 'thing' && e.to.id === 'w' && /plastic sleeve/.test((lastW(it) || {}).said || ''), JSON.stringify({ e: e && e.to, w: lastW(it) }));
    });
    // "Not in anything" on a Move (was ✕ on the In)
    await step('M5', 'Move: Not in anything', async () => {
      await tap('button:has-text("Move it")', { wait: 900 }); await page.click('.ow-go'); await page.waitForSelector('.ow-sheet'); await tap('.ow-sheet .ow-clear', { wait: 300 }); await save();
      it = await byName('baseball card'); e = await edgeOf(it.id);
      check('M5', '10-02: → "Not in anything" on a Move takes it out of the box (no link, no place)', !e && !it.location, JSON.stringify({ e, loc: it.location }));
      await page.waitForTimeout(300);
      if (await count('.tp-moved .u')) await tap('.tp-moved .u', { wait: 1200 });
    });
    // a box moves from its own page; what's in it follows
    await step('M6', 'box moves; contents follow', async () => {
      await openMove('memorabilia box'); await openIn(); await pickIn('garage shelf'); await save();
      await openThing('baseball card');
      const ch2 = await wone();
      check('M6', 'moving the memorabilia box (its own Move it) — the card inside follows: Wooden box in Memorabilia box in Garage shelf', /Wooden box/.test(ch2) && /Memorabilia box/.test(ch2) && /Garage shelf/.test(ch2), ch2.replace(/\n/g, ' | '));
    });

    // ---- the item page: words only ----
    await step('P1', 'words-only item page', async () => {
      await openThing('reading glasses case');
      const p1 = await page.evaluate(() => ({ q: (document.querySelector('.tp-said q') || {}).innerText || '', by: (document.querySelector('.tp-said small') || {}).innerText || '', put: !!document.querySelector('.tp-put'), moves: [...document.querySelectorAll('.thing-page button')].filter((b) => /Move it/.test(b.innerText)).length }));
      // retired 10-02 (one where): the "Put it in a place or a box" button (.tp-put) — gone by design; one Move it
      const p1n = await page.evaluate(() => ({ note: (document.querySelector('.tp-note') || {}).innerText || '', where: (document.querySelector('.tp-blk[aria-labelledby="tp-where"]') || {}).innerText || '', btns: [...document.querySelectorAll('.thing-page .tp-btn')].map((b) => b.innerText.trim()) }));
      check('P1', '10-02: an item with only a note: the note under the photo, "No place yet", ONE button (no "Put it in a place or a box")', /dryer shelf/.test(p1n.note) && /No place yet/.test(p1n.where) && !/dryer shelf/.test(p1n.where) && !p1.put && p1n.btns.length === 1, JSON.stringify(p1n));
      await snap('r-P1.png');
    });
    // ---- Find (before P3: Find answers her words while they are still its where) ----
    await step('F1', 'Find', async () => {
      await home(); await noAuto(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', 'detergent'); await page.waitForTimeout(500);
      const f1 = await page.evaluate(() => [...document.querySelectorAll('.ask .tile')].map((t) => t.innerText));
      check('F1', 'Find: a word she said about where it is finds it', f1.some((x) => /Reading glasses case/i.test(x)), JSON.stringify(f1));
      await page.fill('#ask-input', 'tackle'); await page.waitForTimeout(400);
      const f2 = await page.evaluate(() => [...document.querySelectorAll('.ask .tile')].map((t) => t.innerText));
      check('F2', 'Find: the tile says where (the place)', f2.some((x) => /Spare keys/i.test(x) && /Tackle tray/i.test(x)), JSON.stringify(f2));
    });
    await step('P3', 'words-only item → a place', async () => {
      await openMove('reading glasses case'); await openIn(); await pickIn('linen'); await save();
      it = await byName('reading glasses case'); e = await edgeOf(it.id);
      const pg = await page.evaluate(() => ({ note: (document.querySelector('.tp-note') || {}).innerText || '', said: !!document.querySelector('.tp-said'), where: (document.querySelector('.tp-wone') || {}).innerText || '' }));
      const kept = (it.history || []).some((h) => h.w && /dryer shelf/.test(h.said || ''));
      // retired 10-02 (one where): "her words kept" on the page after Put it in — the board (Sam, old data): once a place is set, older words stay in the history, not on the page
      check('P3', '10-02: Move it on a words-only item → in the Linen closet; her old words stay in the history, not on the page', e && e.to.name === 'Linen closet' && kept && !/dryer shelf/.test(pg.note) && !pg.said && /Linen closet/.test(pg.where), JSON.stringify({ e: e && e.to, kept, pg }));
    });

    // ---- Not put away ----
    await step('N1', 'Not put away', async () => {
      await home(); await noAuto();
      const np = await text('.notput');
      const npN = Number((np.match(/(\d+)/) || [])[1] || 0);
      const npList = (await items()).filter((x) => !x.location && !x.asWhere && !(lastW(x) && lastW(x).said));
      check('N1', '"Not put away" counts only items with no place and no words', npN === npList.length, `${np} vs ${npList.map((x) => x.name)}`);
    });

    // ---- a place's own page: where this place is ----
    await step('PL1', 'place page', async () => {
      await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board'); await noAuto();
      await tap('.menu-btn', { wait: 400 }); await page.locator('text=/^Places/').first().click().catch(async () => { await page.locator('text=Places').first().click(); }); await page.waitForTimeout(500);
      await page.locator('.loc-row', { hasText: 'Linen closet' }).first().click(); await page.waitForTimeout(500);
      await tap('.pl-where', { wait: 500 });
      const pls = await page.evaluate(() => ({ boxes: [...document.querySelectorAll('.in-list .wl-row small')].some((s) => /a box/.test(s.innerText)), self: [...document.querySelectorAll('.in-list .wl-row b')].some((b) => b.innerText === 'Linen closet') }));
      check('PL1', 'a place\'s "Where this place is": places only, never itself', !pls.boxes && !pls.self, JSON.stringify(pls));
      await page.fill('.in-list .wl-search input', 'hallway'); await page.waitForTimeout(300); await tap('.in-list .wl-new', { wait: 900 });
      const lc = await placeByName('Linen closet'); const le = (await dump()).find((d) => d.kind === 'edge' && d.from === lc.id && !d.until);
      check('PL2', 'the place is now in a new place "Hallway"', le && le.to.name === 'Hallway' && !!(await placeByName('Hallway')), JSON.stringify(le && le.to));
      await openThing('reading glasses case');
      const ch3 = await wone();
      check('PL3', 'an item in the Linen closet now reads "Linen closet in Hallway"', /Linen closet/.test(ch3) && /Hallway/.test(ch3), ch3.replace(/\n/g, ' | '));
    });

    // ---- 10-01 (Tanya): levels above the where — on the → sheet now (10-02) ----
    await step('N1', 'levels: Green folder', async () => {
      await log('folder.jpg', 'tax papers'); await typeWhere('in the green folder'); await done();
      await page.click('.ow-go'); await page.waitForSelector('.ow-sheet'); await page.waitForTimeout(200);
      const up1 = await text('.ow-sheet .ow-up');
      check('N1', '10-02: a new where with nothing above it: the → sheet offers "+ What is the Green folder in?"', /What is the Green folder in\?/.test(up1), up1);
      await tap('.ow-sheet .ow-up', { wait: 400 });
      await page.fill('.in-list .wl-search input', 'green folder'); await page.waitForTimeout(250);
      const nw2 = await page.evaluate(() => ({ nw: [...document.querySelectorAll('.in-list .wl-new')].map((b) => b.innerText), rows: [...document.querySelectorAll('.in-list .wl-row b')].map((b) => b.innerText) }));
      // retired 10-02 (one where): N1b's "its list is helped by her words too (New place: Filing drawer)" — no words help any list now
      check('N1b', '10-02: the level above never offers the Green folder itself (searching it: no row, no "New place: Green folder")', !nw2.nw.some((x) => /Green folder/.test(x)) && !nw2.rows.includes('Green folder'), JSON.stringify(nw2));
      await pickIn('filing drawer', '.in-list .wl-new');
      await openUp(); await pickIn('study', '.in-list .wl-new');
      const sh = await sheet();
      // retired 10-02 (one where): N2's "no 4th question (3 tiers shown)" — the → sheet offers + under the last level up to TIERS_SHOWN + 2 levels; the release-1 cap of 3 on the camera is gone
      check('N2', '10-02: three levels on the → sheet: Green folder · Filing drawer · Study (all NEW); at 3 levels no + (TIERS_SHOWN)', JSON.stringify(sh.lv) === JSON.stringify(['Green folder', 'Filing drawer', 'Study']) && sh.news.every(Boolean) && sh.up.length === 0, JSON.stringify(sh)); // 3 levels: + is offered only while fewer than 3 (TIERS_SHOWN; tester ow1 #15)
      await snap('r-N2.png');
      await save();
      const tp = await byName('tax papers'); const gf = await placeByName('Green folder'); const fd = await placeByName('Filing drawer'); const st = await placeByName('Study');
      const [e1, e2, e3] = [await edgeOf(tp.id), gf && await edgeOf(gf.id), fd && await edgeOf(fd.id)];
      check('N3', 'saved: tax papers in Green folder; Green folder in Filing drawer; Filing drawer in Study', e1 && e1.to.name === 'Green folder' && e2 && e2.to.name === 'Filing drawer' && e3 && e3.to.name === 'Study' && !!st, JSON.stringify([e1 && e1.to, e2 && e2.to, e3 && e3.to]));
      const card3 = await text('.saved-card');
      check('N3b', 'the card says the chain', /Green folder/.test(card3) && /Filing drawer/.test(card3) && /Study/.test(card3), card3.slice(0, 120));
      await tap('.saved-card .u', { wait: 1500 });
      const after = { tp: await byName('tax papers'), gf: await placeByName('Green folder'), fd: await placeByName('Filing drawer'), st: await placeByName('Study') };
      check('N4', 'Undo: the item and the three new places go', !after.tp && !after.gf && !after.fd && !after.st, JSON.stringify(Object.fromEntries(Object.entries(after).map(([k, v]) => [k, !!v]))));
    });
    // a pick that already has a saved place above it: the saved chain shows on the → sheet, every level with Change
    await step('N5', 'saved chain on the sheet', async () => {
      await log('card.jpg', 'trading card'); await openIn(); await pickIn('wooden box', '.in-list .wl-row:has(b:text-is("Wooden box"))');
      const sh = await sheet();
      // retired 10-02 (one where): "no + What is it in?, the chain shown read-only" — saved levels are editable now (her explicit level change wins)
      check('N5', '10-02: where = Wooden box (saved in the Memorabilia box): the → sheet shows the saved chain (Wooden box · Memorabilia box · Garage shelf), every level with Change; 3 levels, no +', JSON.stringify(sh.lv) === JSON.stringify(['Wooden box', 'Memorabilia box', 'Garage shelf']) && sh.change === 3 && sh.up.length === 0 && !sh.news.some(Boolean), JSON.stringify(sh)); // 3 levels shown, no + (TIERS_SHOWN)
      await leave();
    });

    // ---- 10-02 independent tester, round 4: the levels above the where ----
    const now0 = Date.now();
    await page.evaluate((t) => { const F = window.__rigfs; const C = F.collection(null, 'recall_items');
      const B = (id, name, extra = {}) => F.setDoc(F.doc(C, id), { kind: 'item', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [], name, location: '', holds: true, photo: null, thumb: null, written: true, order: t, createdAt: t - 9e6, lastSeenAt: t - 9e6, photoCount: 0, history: [{ location: '', at: t - 9e6 }], needsPlace: true, ...extra });
      B('ct', 'cookie tin'); B('ct2', 'sewing box'); B('ct3', 'red crate'); B('bb', 'blue bin', { location: 'Red crate', needsPlace: false });
      F.setDoc(F.doc(C, 'ebb'), { kind: 'edge', rel: 'in', from: 'bb', to: { t: 'thing', id: 'ct3', name: 'red crate' }, since: t - 8e6, until: null, how: 'chosen', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [] }); }, now0);
    await page.waitForTimeout(500);
    // N1: never offered a box that is inside the item, nor inside a level below
    await step('L1', 'level never offers a box inside the item', async () => {
      await openMove('red crate'); await openIn(); await pickIn('cookie tin', '.in-list .wl-row:has(b:text-is("Cookie tin"))');
      await openUp(); await page.fill('.in-list .wl-search input', 'blue bin'); await page.waitForTimeout(250);
      const lp = await page.evaluate(() => [...document.querySelectorAll('.in-list .wl-row b')].map((b) => b.innerText));
      check('L1', 'a level never offers a box that is inside the item (Blue bin is in the Red crate)', !lp.includes('Blue bin'), JSON.stringify(lp));
      await cancelIn(); await leave();
    });
    // N2: after Save + Next, the carried where shows where it now is
    await step('L2', 'Save + Next carries the where', async () => {
      await log('soda.jpg', 'fork'); await openIn(); await pickIn('cookie tin', '.in-list .wl-row:has(b:text-is("Cookie tin"))');
      await openUp(); await pickIn('kitchen counter', '.in-list .wl-row:has(b:text-is("Kitchen counter"))');
      const sv = await page.locator('.lc-k.sv').boundingBox(); await page.mouse.move(sv.x + sv.width / 2, sv.y + sv.height / 2); await page.mouse.down(); await page.waitForTimeout(900); await page.mouse.up(); await page.waitForTimeout(1300);
      AI = { name: 'spoon' }; await cam('soda.jpg'); await tap('.lc-shutter', { wait: 900 });
      const v = await whereVal(); const sh = await sheet();
      check('L2', '10-02: Save + Next: the carried where "Cookie tin" — the → sheet shows where the tin now is (Kitchen counter, saved), and no "+ What is the Cookie tin in?"', v === 'Cookie tin' && JSON.stringify(sh.lv) === JSON.stringify(['Cookie tin', 'Kitchen counter']) && !sh.up.some((u) => /Cookie tin/.test(u)), JSON.stringify({ v, sh }));
      await leave();
    });
    // N5: one new place, once — the level above never offers "New place: <a new place already in the chain>"
    await step('L3', 'no duplicate new place', async () => {
      await log('book.jpg', 'loaf'); await typeWhere('in the bread bin'); await done();
      await openUp(); await page.fill('.in-list .wl-search input', 'bread bin'); await page.waitForTimeout(250);
      const dup = await count('.in-list .wl-new');
      check('L3', 'level 2 never offers "New place: Bread bin" again (it is the where)', dup === 0, String(dup));
      await cancelIn(); await leave();
    });
    // N3 + N4: Undo of a save that moved a box by a level — refused when the box changed since; otherwise the box is back exactly
    await step('L4', 'Undo restores a box moved by a level', async () => {
      await log('soda.jpg', 'needle'); await openIn(); await pickIn('sewing box', '.in-list .wl-row:has(b:text-is("Sewing box"))');
      await openUp(); await pickIn('pantry'); await save();
      await tap('.saved-card .u', { wait: 1500 });
      const sb1 = (await dump()).find((d) => d.id === 'ct2'); const sbe = (await dump()).find((d) => d.kind === 'edge' && d.from === 'ct2' && !d.until);
      check('L4', 'Undo: the sewing box is back with no place — no link, "No place yet", its own last-seen', !sbe && sb1.location === '' && sb1.needsPlace === true && sb1.lastSeenAt === now0 - 9e6, JSON.stringify({ e: sbe && sbe.to, loc: sb1.location, np: sb1.needsPlace, ls: [sb1.lastSeenAt, now0 - 9e6] }));
    });
    await step('L5', 'stale Undo refused', async () => {
      await log('soda.jpg', 'thimble'); await openIn(); await pickIn('sewing box', '.in-list .wl-row:has(b:text-is("Sewing box"))');
      await openUp(); await pickIn('pantry'); await save();
      await page.waitForTimeout(2600);
      await page.evaluate(() => { const d = window.__rig.dump().find((x) => x.id === 'ct2'); const F = window.__rigfs; const t = Date.now();
        F.updateDoc(F.doc(F.collection(null, 'recall_items'), 'ct2'), { location: 'Linen closet', lastSeenAt: t, history: [...(d.history || []), { location: 'Linen closet', at: t, by: 'robert' }] }); });
      await page.waitForTimeout(400); await tap('.saved-card .u', { wait: 100 }); await page.locator('.toast', { hasText: 'Not undone' }).first().waitFor({ timeout: 4000 }).catch(() => {}); const toastNU = await text('.toast'); await page.waitForTimeout(900); // the toast lasts ~2 s: read it as it shows
      const sb2 = (await dump()).find((d) => d.id === 'ct2');
      check('L5', 'a stale Undo is refused when a box moved by a level changed since (another phone)', sb2.location === 'Linen closet' && /Not undone/.test(toastNU), JSON.stringify({ loc: sb2.location, toast: toastNU }));
    });

    // ---- 10-02 independent tester, round 5: another phone changes things while the camera is open ----
    const robert = (fn, arg) => page.evaluate(([f, a]) => { const F = window.__rigfs; const C = F.collection(null, 'recall_items'); const t = Date.now();
      const E = (id, from, to) => F.setDoc(F.doc(C, id), { kind: 'edge', rel: 'in', from, to, since: t, until: null, how: 'chosen', owner: 'margaret', by: 'robert', private: false, roles: {}, sharedWith: [] });
      const P = (id, name) => F.setDoc(F.doc(C, id), { kind: 'place', owner: 'margaret', by: 'margaret', private: false, name, order: t, createdAt: t, parent: null, photos: [], sharedWith: [], roles: {} });
      const B = (id, name) => F.setDoc(F.doc(C, id), { kind: 'item', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [], name, location: '', holds: true, photo: null, thumb: null, written: true, order: t, createdAt: t - 9e6, lastSeenAt: t - 9e6, photoCount: 0, history: [{ location: '', at: t - 9e6 }], needsPlace: true });
      const I = (id, name, loc) => F.setDoc(F.doc(C, id), { kind: 'item', owner: 'margaret', by: 'robert', private: false, roles: {}, sharedWith: [], name, location: loc, photo: null, thumb: null, written: true, order: t, createdAt: t, lastSeenAt: t, photoCount: 0, history: [{ location: loc, at: t, by: 'robert' }], needsPlace: false });
      return new Function('E', 'P', 'B', 'I', 'F', 'C', 't', 'a', f)(E, P, B, I, F, C, t, a); }, [fn, arg]);
    await robert("P('puh', 'Upstairs hall'); P('pat', 'Attic'); P('pbs', 'Basement'); E('epat', 'pat', { t: 'place', name: 'Upstairs hall' }); B('jar', 'jar'); B('crate2', 'crate');");
    await page.waitForTimeout(400);
    // place loop made by another phone: refused, nothing written
    await step('Q1', 'place loop from another phone', async () => {
      await log('soda.jpg', 'lamp'); await openIn(); await pickIn('upstairs hall', '.in-list .wl-row:has(b:text-is("Upstairs hall"))');
      await openUp(); await pickIn('basement', '.in-list .wl-row:has(b:text-is("Basement"))');
      await robert("E('ebs', 'pbs', { t: 'place', name: 'Attic' });"); await page.waitForTimeout(400); await save();
      check('Q1', 'a place loop made on another phone while the camera was open: "Not saved", and nothing written', /Not saved/.test(await text('.lc-err')) && !(await byName('lamp')), await text('.lc-err'));
      await leave();
    });
    // a box given a place on another phone while her level says otherwise
    await step('Q2', 'her level vs another phone', async () => {
      await log('soda.jpg', 'chalk'); await openIn(); await pickIn('crate', '.in-list .wl-row:has(b:text-is("Crate"))');
      await openUp(); await pickIn('kitchen counter', '.in-list .wl-row:has(b:text-is("Kitchen counter"))');
      await robert("E('ecr', 'crate2', { t: 'place', name: 'Linen closet' }); F.updateDoc(F.doc(C, 'crate2'), { location: 'Linen closet', needsPlace: false, lastSeenAt: t });"); await page.waitForTimeout(400); await save();
      const ce = (await dump()).filter((d) => d.kind === 'edge' && d.from === 'crate2' && !d.until).map((x) => x.to.name);
      const ch = await byName('chalk'); const che = ch && await edgeOf(ch.id);
      // retired 10-02 (one where): Q2's "Not saved, the other phone's place kept" — her explicit level change wins now (saved levels are editable)
      check('Q2', '10-02: her level for a box another phone just placed wins: saved — the chalk in the Crate, the Crate in the Kitchen counter (one open link)', !!ch && che && che.to.id === 'crate2' && JSON.stringify(ce) === '["Kitchen counter"]' && !(await count('.lc')), JSON.stringify({ err: await text('.lc-err'), ce, che: che && che.to }));
      await leave();
    });
    // …and the other phone putting it in the SAME place she chose is no conflict: it saves (tester r6)
    await step('Q2b', 'same place from another phone', async () => {
      await robert("B('pail', 'pail');"); await page.waitForTimeout(300);
      await log('soda.jpg', 'scoop'); await openIn(); await pickIn('pail', '.in-list .wl-row:has(b:text-is("Pail"))');
      await openUp(); await pickIn('kitchen counter', '.in-list .wl-row:has(b:text-is("Kitchen counter"))');
      await robert("E('epail', 'pail', { t: 'place', name: 'Kitchen counter' }); F.updateDoc(F.doc(C, 'pail'), { location: 'Kitchen counter', needsPlace: false, lastSeenAt: t });"); await page.waitForTimeout(400); await save();
      const sc = await byName('scoop');
      check('Q2b', 'the other phone put the pail in the same place she chose: it saves (no "Not saved")', !!sc && !(await count('.lc')), JSON.stringify({ scoop: !!sc, err: await text('.lc-err') }));
    });
    // Undo keeps a new place someone else has used since
    await step('Q3', 'Undo keeps a used place', async () => {
      await log('soda.jpg', 'trowel'); await typeWhere('shed'); await done(); await save();
      await page.waitForTimeout(600); await robert("I('hoe', 'hoe', 'Shed'); E('ehoe', 'hoe', { t: 'place', name: 'Shed' });"); await page.waitForTimeout(400);
      await tap('.saved-card .u', { wait: 1500 });
      check('Q3', 'Undo of a save that made "Shed": the Shed stays, because the hoe is in it now', !!(await placeByName('Shed')) && !(await byName('trowel')), JSON.stringify({ shed: !!(await placeByName('Shed')), trowel: !!(await byName('trowel')) }));
    });
    // a loop through the item being moved (another phone put the where inside it): "Not saved"
    await step('Q4', 'loop through the item', async () => {
      await robert("I('gbag', 'green bag', 'Blue bin'); F.updateDoc(F.doc(C, 'gbag'), { holds: true }); E('egb', 'gbag', { t: 'thing', id: 'bb', name: 'blue bin' });"); await page.waitForTimeout(300);
      await openMove('blue bin'); await openIn(); await pickIn('jar', '.in-list .wl-row:has(b:text-is("Jar"))');
      await robert("E('ejar', 'jar', { t: 'thing', id: 'gbag', name: 'green bag' }); F.updateDoc(F.doc(C, 'jar'), { location: 'Green bag', needsPlace: false });"); await page.waitForTimeout(400); await save();
      const bbe = (await dump()).find((d) => d.kind === 'edge' && d.from === 'bb' && !d.until);
      check('Q4', 'Move it into a box another phone just put inside it: "Not saved", the bin stays in the Red crate', /Not saved/.test(await text('.lc-err')) && bbe && bbe.to.id === 'ct3', JSON.stringify({ err: await text('.lc-err'), e: bbe && bbe.to }));
      await leave();
    });

    // ---- 10-01 independent tester (REPORT_r1.md) ----
    // #1: never "New place: <one of her boxes or items>"; the box inside it is never offered under any name
    await step('T1', 'boxes/items never a new place', async () => {
      await openMove('memorabilia box');
      await typeWhere('in the wooden box'); const a = { hint: await text('.ow-hint.bad'), off: await saveOff() };
      await typeWhere('by the baseball card'); const b = { hint: await text('.ow-hint.bad'), off: await saveOff() };
      // retired 10-02 (one where): "her words never offer New place: <box/item>" — words make no places now; the where field is the equivalent
      check('T1', '10-02: typing a box she has that is inside it (Wooden box), or an item (Baseball card), as the where: never a new place — a red line says why, Save off', /inside/.test(a.hint) && a.off && /one of your items/.test(b.hint) && b.off, JSON.stringify({ a, b }));
      await typeWhere('garage shelf'); await done(); // back to where it is
      await openIn(); await page.fill('.in-list .wl-search input', 'wooden box'); await page.waitForTimeout(250);
      const t1b = await page.evaluate(() => [...document.querySelectorAll('.in-list .wl-new')].map((x) => x.innerText));
      check('T1b', 'searching a box she has that it cannot go in: no "New place: Wooden box" either', !t1b.length, JSON.stringify(t1b));
      await cancelIn(); await leave();
    });
    await step('T1c', 'notes never make places', async () => {
      await log('soda.jpg', 'egg timer');
      for (const w of ['egg timer is next to the wallet', 'it is there', 'zzz qqq', 'under the yearbook from 1978']) {
        await addNote(w); await openIn();
        const f = await page.evaluate(() => ({ nw: [...document.querySelectorAll('.in-list .wl-new')].map((b) => b.innerText), said: !!document.querySelector('.in-list .wl-said') || document.querySelectorAll('.in-list .wl-row.said').length }));
        // retired 10-02 (one where): "no junk new places from her words" — the list no longer reads her words; kept as: a note never makes a place
        check('T1c', `10-02: the note "${w}": no new places offered from it`, !f.nw.length && !f.said, JSON.stringify(f));
        await cancelIn();
      }
      // #3: a password never becomes a place
      await addNote('password hunter2'); await openIn();
      const t3 = await page.evaluate(() => [...document.querySelectorAll('.in-list .wl-new')].map((b) => b.innerText));
      await page.fill('.in-list .wl-search input', 'password hunter2'); await page.waitForTimeout(250);
      const t3b = await page.evaluate(() => [...document.querySelectorAll('.in-list .wl-new')].map((b) => b.innerText));
      await cancelIn();
      await addNote(''); await typeWhere('password hunter2'); const t3w = { hint: await text('.ow-hint.bad'), off: await saveOff() }; await typeWhere(''); await done();
      check('T3', '"password hunter2" is never offered as a new place (from a note, from search, or typed as the where — 10-02: a red line, Save off)', !t3.length && !t3b.length && /private/.test(t3w.hint) && t3w.off, JSON.stringify([t3, t3b, t3w]));
      await addNote('password hunter2');
      const t3c = await saveOff();
      check('T3b', '"password hunter2" in her note blocks Save', t3c, String(t3c));
      await leave();
    });
    // #4: the In list counts each item once
    await step('T4', 'In list count', async () => {
      await log('soda.jpg', 'pepper mill'); await openIn(); await page.fill('.in-list .wl-search input', 'kitchen counter'); await page.waitForTimeout(250);
      const kc = await page.evaluate(() => { const r = [...document.querySelectorAll('.in-list .wl-row')].find((x) => x.querySelector('b').innerText === 'Kitchen counter'); return r ? r.querySelector('small').innerText : ''; });
      const kcN = (await items()).filter((x) => (x.location || '').toLowerCase() === 'kitchen counter').length;
      check('T4', 'the In list\'s count is the real number of items there', new RegExp(`${kcN} item`).test(kc), `${kc} vs ${kcN}`);
      await cancelIn(); await leave();
    });
    // #2: Undo takes back the photos a Move added (and the old cover comes back)
    await step('T2', 'Undo takes back Move photos', async () => {
      // 10-02: a Move's photos go to the place shown — except a private item's, which stay its own: the passport is the item-photo case now
      await openThing('passport'); let k0 = await byName('passport'); const snaps0 = (await dump()).filter((d) => d.kind === 'snap' && d.itemId === k0.id && !d.deleted).length;
      await cam('wallet.jpg'); await tap('button:has-text("Move it")', { wait: 900 });
      const to = await text('.ow-to .on');
      await tap('.lc-shutter', { wait: 700 }); await save();
      const kmid = await byName('passport');
      await tap('.tp-moved .u', { wait: 1200 });
      const k1 = await byName('passport'); const snaps1 = (await dump()).filter((d) => d.kind === 'snap' && d.itemId === k1.id && !d.deleted).length;
      check('T2', 'Undo of a Move that added a photo to the item (a private item: its photos stay its own): the photo goes, the old cover is back', /passport/i.test(to) && kmid.photo !== k0.photo && snaps1 === snaps0 && k1.photo === k0.photo && k1.photoCount === k0.photoCount, JSON.stringify({ to, changed: kmid.photo !== k0.photo, snaps0, snaps1, same: k1.photo === k0.photo, pc: [k0.photoCount, k1.photoCount] }));
      // 10-02: the shared item's Move photo went to the place shown; Undo puts the place's photos back, the item's own untouched
      await openThing('spare keys'); k0 = await byName('spare keys'); const tt0 = ((await placeByName('Tackle tray')) || {}).photos || [];
      await cam('wallet.jpg'); await tap('button:has-text("Move it")', { wait: 900 }); await tap('.lc-shutter', { wait: 700 }); await save();
      const tt1 = ((await placeByName('Tackle tray')) || {}).photos || []; const kmid2 = await byName('spare keys');
      await tap('.tp-moved .u', { wait: 1200 });
      const tt2 = ((await placeByName('Tackle tray')) || {}).photos || []; const k2 = await byName('spare keys');
      check('T2b', '10-02: a Move photo of the place shown (Tackle tray) joins the place; Undo puts its photos back; the keys\' own cover and count never change', tt1.length === tt0.length + 1 && kmid2.photo === k0.photo && tt2.length === tt0.length && k2.photo === k0.photo && k2.photoCount === k0.photoCount, JSON.stringify({ tt: [tt0.length, tt1.length, tt2.length], cover: [kmid2.photo === k0.photo, k2.photo === k0.photo], pc: [k0.photoCount, k2.photoCount] }));
    });
    // #6: a words-only item given a place from its page (was "Put it in"; now its one Move it) keeps her words' own time on Undo
    await step('T6', 'words-only item: Move + Undo', async () => {
      await log('book.jpg', 'atlas'); await addNote('under the stairs'); await save();
      const a0 = lastW(await byName('atlas'));
      await page.waitForTimeout(1200); await openMove('atlas'); await openIn(); await pickIn('pantry'); await save();
      const mv = await text('.tp-moved'); const pg = await text('.thing-page');
      const ae0 = await edgeOf((await byName('atlas')).id);
      // retired 10-02 (one where): T6's "Put it in from the page" + toast — the button is gone; its one Move it shows the move note with Undo
      check('T6', '10-02: Move it on a words-only item → in the Pantry shelf; the page offers Undo; her old words leave the page', ae0 && /Pantry/.test(ae0.to.name) && /Undo/.test(mv) && !/under the stairs/.test(pg), JSON.stringify({ e: ae0 && ae0.to, mv: mv.slice(0, 80) }));
      await tap('.tp-moved .u', { wait: 1200 });
      const a1 = await byName('atlas'); const ae = await edgeOf(a1.id); const w = lastW(a1);
      check('T6b', 'Undo: not in the pantry any more, her words still there — with their own time', !ae && !a1.location && w && /under the stairs/.test(w.said || '') && (w.saidAt || w.at) === a0.at && /under the stairs/.test(await text('.tp-said, .tp-note')), JSON.stringify({ ae: ae && ae.to, w, a0 }));
    });

    // ---- 10-02 independent tester, round 2 (REPORT_r1b.md) ----
    // A + E: Undo keeps who said her words and when, and puts "last seen" back
    await step('U1', 'Undo restores words/time/author/last seen', async () => {
      await log('book.jpg', 'road atlas'); await addNote('glovebox, under the manual'); await save();
      const r0 = await byName('road atlas'); const w0 = lastW(r0);
      await page.waitForTimeout(1500); await openMove('road atlas'); await openIn(); await pickIn('pantry'); await save();
      await tap('.tp-moved .u', { wait: 1300 });
      const r1x = await byName('road atlas'); const w1 = lastW(r1x);
      check('U1', 'Undo of a Move: her words come back with their own time and author', w1 && w1.said === w0.said && (w1.saidAt || w1.at) === w0.at && w1.by === w0.by, JSON.stringify({ w0, w1 }));
      check('U2', 'Undo of a Move: "last seen" goes back too', r1x.lastSeenAt === r0.lastSeenAt, JSON.stringify([r0.lastSeenAt, r1x.lastSeenAt]));
    });
    // F: a Move that only took it out of its box can be undone
    await step('U3', 'Not in anything + Undo', async () => {
      await openMove('yearbook 1978'); await page.click('.ow-go'); await page.waitForSelector('.ow-sheet'); await tap('.ow-sheet .ow-clear', { wait: 300 }); await save();
      const fNote = await text('.tp-moved');
      check('U3', '10-02: "Not in anything"-only Move (was ✕): the page offers Undo', /Undo/.test(fNote), fNote.slice(0, 80));
      if (await count('.tp-moved .u')) await tap('.tp-moved .u', { wait: 1300 });
      const yb = await byName('yearbook 1978'); const ye = await edgeOf(yb.id);
      check('U3b', '… and Undo puts it back in the memorabilia box', ye && ye.to.t === 'thing' && ye.to.id === 'm', JSON.stringify(ye && ye.to));
    });
    // B: more secrets — in the note, and (10-02) typed as the where
    await step('S1', 'secrets', async () => { // 10-02: brochure.jpg (never in mock/img — the release-1 suite threw here and lost every check after it) → folder.jpg, as audit_ow.js's brochure
      await log('folder.jpg', 'note card');
      for (const w of ['passwd hunter2', 'pass: hunter2', 'user bob pass hunter2', 'PIN4821']) {
        await addNote(w);
        check('S1', `"${w}" in her note blocks Save`, await saveOff());
        await addNote(''); await typeWhere(w); const off = await saveOff(); const bad = await count('.ow-hint.bad');
        check('S1', `10-02: "${w}" typed as the where blocks Save (never a place)`, off && bad > 0, JSON.stringify({ off, bad }));
        await typeWhere(''); await done();
      }
      await addNote(''); await openIn();
      for (const w of ['pass: hunter2', 'PIN4821']) { await page.fill('.in-list .wl-search input', w); await page.waitForTimeout(200); check('S2', `searching "${w}" offers no new place`, await count('.in-list .wl-new') === 0); }
      await cancelIn(); await leave();
    });
    // C: Write it down — her typed words stay words; a place she has keeps its own name
    await step('W1', 'Write it down', async () => {
      // 10-02 (night, one where; tester ow2 #11): typed text is read like the camera's field — "in the shoebox under the bed" is the
      // NEW place "Shoebox under the bed" (never words); a place she has, in any case, is that place
      for (const [what, where, wantLoc, wantSaid] of [['drill', 'in the shoebox under the bed', 'Shoebox under the bed', null], ['ladle', 'pantry SHELF', 'Pantry shelf', null]]) {
        await home(); await noAuto(); await tap(LOG, { wait: 800 }); await tap('.lc-typeit button', { wait: 500 }); await page.waitForSelector('.note-card');
        await page.fill('#note-what', what); await tap('.guess.other', { wait: 300 }); await page.fill('.note-card .guesses input.place-input', where); await tap('.note-card .btn-primary', { wait: 1200 });
        const it2 = await byName(what); const pl2 = (await places()).map((p) => p.name);
        const ok = it2 && it2.location === wantLoc && (wantSaid === null ? true : (lastW(it2) || {}).said === wantSaid) && !(lastW(it2) || {}).said && !pl2.some((n) => /pantry SHELF/.test(n)) && (wantLoc !== 'Shoebox under the bed' || pl2.includes('Shoebox under the bed'));
        check('W1', `Write it down "${where}": in the ${wantLoc} — a place, never words (10-02 night)`, ok, JSON.stringify({ loc: it2 && it2.location, w: it2 && lastW(it2), pl2 }));
      }
    });
    // G: a longer name she typed is a NEW place though part of it is a place she has
    await step('G1', 'garage cupboard', async () => {
      await log('soda.jpg', 'spray paint'); await typeWhere('in the garage cupboard');
      const h = await text('.ow-head'); const hint = await text('.ow-hint'); await done(); const v = await whereVal();
      // retired 10-02 (one where): G1's "offered from her words" — the where field is the equivalent
      check('G1', '10-02: typing "in the garage cupboard": a NEW place "Garage cupboard" (not the Garage), with "N of your places have “garage”"', v === 'Garage cupboard' && /Set NEW place\./.test(h) && /of your places ha(ve|s) “garage”/.test(hint), JSON.stringify({ v, h, hint }));
      await leave();
    });

    // ---- 10-02 independent tester, round 3 ----
    // #1: an Undo still on screen never rolls back a newer change made elsewhere
    await step('V1', 'stale Undo', async () => {
      await openMove('wallet'); await openIn(); await pickIn('garage shelf'); await save();
      await page.waitForTimeout(2600);
      await page.evaluate(() => { const d = window.__rig.dump().find((x) => x.kind === 'item' && x.name === 'wallet'); const F = window.__rigfs; const t = Date.now();
        F.updateDoc(F.doc(F.collection(null, 'recall_items'), d.id), { location: 'Linen closet', lastSeenAt: t, history: [...(d.history || []), { location: 'Linen closet', at: t, w: 1, said: 'in the linen closet, top', by: 'robert' }] }); });
      await page.waitForTimeout(500); await tap('.tp-moved .u', { wait: 100 }); await page.locator('.toast', { hasText: 'Not undone' }).first().waitFor({ timeout: 4000 }).catch(() => {}); const toastNU = await text('.toast'); await page.waitForTimeout(900);
      const wl = await byName('wallet');
      check('V1', 'a stale Undo (someone moved it since) changes nothing, and says so', wl.location === 'Linen closet' && ((lastW(wl) || {}).said === 'in the linen closet, top') && /Not undone/.test(toastNU), JSON.stringify({ loc: wl.location, w: lastW(wl), toast: toastNU }));
    });
    // #2: "Move all to…" never offers the place itself, nor a box that is in it — not even under Recent
    await step('V2', 'Move all', async () => {
      await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board'); await noAuto();
      await tap('.menu-btn', { wait: 400 }); await page.locator('text=/^Places/').first().click().catch(async () => { await page.locator('text=Places').first().click(); }); await page.waitForTimeout(500);
      await page.locator('.loc-row:has(b:text-is("Garage"))').first().click(); await page.waitForTimeout(500);
      if (await count('.pl-all')) {
        await tap('.pl-all', { wait: 500 });
        const offered = await page.evaluate(() => [...document.querySelectorAll('.in-list .wl-row b')].map((b) => b.innerText));
        const inGarage = (await items()).filter((x) => (x.location || '') === 'Garage').map((x) => (x.name || '').toLowerCase());
        check('V2', 'Move all from the Garage: neither the Garage nor a box in it is offered (Recent included)', !offered.some((n) => n === 'Garage' || inGarage.includes(n.toLowerCase())), JSON.stringify({ offered, inGarage }));
        await tap('.in-list .btn-quiet:has-text("Cancel")', { wait: 300 });
      } else check('V2', 'Move all is offered on the Garage page', false, 'no .pl-all');
      // #2b (the tester's case): the tin box and the glasses moved onto the Kitchen counter, then its "Move all to…"
      for (const nm of ['tin box', 'reading glasses case']) { await openMove(nm); await openIn(); await pickIn('kitchen counter', '.in-list .wl-row:has(b:text-is("Kitchen counter"))'); await save(); }
      await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board'); await noAuto();
      await tap('.menu-btn', { wait: 400 }); await page.locator('text=/^Places/').first().click().catch(async () => { await page.locator('text=Places').first().click(); }); await page.waitForTimeout(500);
      await page.locator('.loc-row:has(b:text-is("Kitchen counter"))').first().click(); await page.waitForTimeout(500);
      await tap('.pl-all', { wait: 500 });
      const off2 = await page.evaluate(() => [...document.querySelectorAll('.in-list .wl-row b')].map((b) => b.innerText));
      check('V2b', 'Move all from the Kitchen counter: neither the Kitchen counter nor the tin box in it is offered (Recent included)', !off2.includes('Kitchen counter') && !off2.includes('Tin box'), JSON.stringify(off2));
      await tap('.in-list .btn-quiet:has-text("Cancel")', { wait: 300 });
    });
    // #6: two more password forms
    await step('S3', 'password forms', async () => {
      await log('folder.jpg', 'card'); for (const w of ['p/w hunter2', 'login bob hunter2']) { await addNote(w); check('S3', `"${w}" in her note blocks Save`, await saveOff()); } await leave();
    });

    // ---- secrets, and Largest + keyboard ----
    await step('X1', 'secret says why', async () => {
      await log('folder.jpg', 'sticky note'); await addNote('drawer, password is hunter2 1234');
      const sec = await page.evaluate(() => ({ off: document.querySelector('.lc-k.sv').disabled, note: !!document.querySelector('.ow .privnote') }));
      check('X1', 'a password in her note blocks Save and says why', sec.off && sec.note, JSON.stringify(sec)); await leave();
    });
    await step('L1', 'Largest + keyboard', async () => {
      await page.setViewportSize({ width: 375, height: 667 }); await setPrefs({ size: 'largest' });
      await page.addInitScript(() => { const et = new EventTarget(); let h = null; const Hh = () => (h === null ? window.innerHeight : h);
        Object.defineProperty(et, 'height', { get: Hh }); Object.defineProperty(et, 'offsetTop', { get: () => 0 }); Object.defineProperty(et, 'width', { get: () => window.innerWidth });
        Object.defineProperty(window, 'visualViewport', { configurable: true, get: () => et }); window.__kb = (px) => { h = window.innerHeight - px; et.dispatchEvent(new Event('resize')); }; });
      await log('glasses.jpg', 'sunglasses');
      const vis = await page.evaluate(() => { const ok = (s) => { const el = document.querySelector(s); if (!el) return false; const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= window.innerHeight + 1 && r.width > 0; }; return { where: ok('.ow-input'), go: ok('.ow-go'), note: ok('.ow-note'), save: ok('.lc-k.sv'), shutter: ok('.lc-shutter') }; });
      check('L1', '10-02: Largest text on a small phone: the where field and →, "+ Add a note", the shutter and Save all on screen', vis.where && vis.go && vis.note && vis.save && vis.shutter, JSON.stringify(vis));
      await snap('r-L1.png');
      await page.locator('.ow-input').click(); await page.evaluate(() => window.__kb(300)); await page.waitForTimeout(300);
      const kb = await page.evaluate(() => { const r = document.querySelector('.ow-input').getBoundingClientRect(); return { bottom: Math.round(r.bottom), limit: window.innerHeight - 300 }; });
      check('L2', '10-02: with the keyboard up, the where field stays above it', kb.bottom <= kb.limit, JSON.stringify(kb));
      await snap('r-L2.png');
      await page.evaluate(() => window.__kb(0)); await page.locator('.ow-input').press('Enter').catch(() => {}); await leave();
      await page.setViewportSize({ width: 390, height: 844 }); await setPrefs({ size: 'normal' });
    });
  }
  await seedHouse('dusk');
  try { await runSuite(); } catch (e) { console.error('FATAL', e); check('R1', 'suite ran', false, e.message); }
  await browser.close();
}
(async () => {
  await new Promise((r) => server.listen(PORT, r));
  await runLook('b');
  const pass = results.filter((r) => r.ok).length;
  console.log(`\n${pass}/${results.length} checks passed`);
  console.log('Page errors:', errors.length ? errors : 'none');
  console.log('Console errors:', consoleErrors.length ? consoleErrors.slice(0, 5) : 'none');
  server.close();
})();
