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

  // audit_chain (= tiers_head.js + chain_body.js) — Ravi 09-29 (phone, g): Move it on "3D model of plant sensor" (at White cardboard box). (1) adding tier 2
  // AND tier 3 in one go: the 3rd tier vanished, and a popup covered the name box while typing; (2) Move it again only
  // showed White cardboard box — the Ikea shelving unit above it was not there to build on; (3) the item page's
  // hierarchy has no "in" pill between the words.
  async function runSuite() {
    const OUT = path.join(__dirname, 'shots_h'); fs.mkdirSync(OUT, { recursive: true });
    let n = 0; const snap = async (label) => { n++; const f = `h-${String(n).padStart(2, '0')}-${label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`; await page.waitForTimeout(250); await page.screenshot({ path: path.join(OUT, f) }); console.log('  [shot]', f); return f; };
    const st = () => page.evaluate(() => { const t = (q) => (document.querySelector(q) || {}).innerText || '';
      return { squares: [...document.querySelectorAll('.lv-strip .lv-sq:not(.plus)')].map((b) => b.getAttribute('aria-label')), place: t('.lc-say'), chain: t('.lc-chainline').replace(/\n/g, ' '), prompt: t('.lc-prompt'), sheet: !!document.querySelector('.sheet-back'), plus: !!document.querySelector('.lv-sq.plus') }; });
    const openThing = async (nm) => { await home(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', nm); await page.waitForTimeout(350); await page.click('.ask .tile >> nth=0'); await page.waitForSelector('.card.thing'); await page.waitForTimeout(400); };
    const move = async () => { await openThing('3D model of plant sensor'); await tap('button:has-text("Move it")', { wait: 900 }); };
    const inOf = (nm) => page.evaluate((n) => { const d = window.__rig.dump(); const p = d.find((x) => x.kind === 'place' && x.name.toLowerCase() === n.toLowerCase()); if (!p) return 'no place'; const e = d.filter((x) => x.kind === 'edge' && x.from === p.id && !x.until); return e.map((x) => x.to.name).join(',') || 'none'; }, nm);
    // the iOS keyboard (~336 pt + the 44 pt bar above it) covers the bottom of the screen; a focused field must sit above it
    const kbCheck = async (label) => page.evaluate((lab) => { const a = document.activeElement; if (!a || a.tagName !== 'INPUT') return { lab, focused: false };
      const r = a.getBoundingClientRect(); return { lab, focused: true, bottom: Math.round(r.bottom), limit: 844 - 380, ok: r.bottom <= 844 - 380 }; }, label);

    // the iPhone keyboard, as the page sees it: the visual viewport shrinks by the keyboard's height (Chromium has no
    // on-screen keyboard, so a stand-in visualViewport is installed before the app loads; __kb(px) raises/lowers it).
    await page.addInitScript(() => { const et = new EventTarget(); let h = null; const H = () => (h === null ? window.innerHeight : h);
      Object.defineProperty(et, 'height', { get: H }); Object.defineProperty(et, 'offsetTop', { get: () => 0 }); Object.defineProperty(et, 'width', { get: () => window.innerWidth });
      Object.defineProperty(window, 'visualViewport', { configurable: true, get: () => et });
      window.__kb = (px) => { h = window.innerHeight - px; et.dispatchEvent(new Event('resize'));
        let k = document.getElementById('__kbv'); if (!px) { if (k) k.remove(); return; }
        if (!k) { k = document.createElement('div'); k.id = '__kbv'; document.body.appendChild(k); }
        k.style.cssText = `position:fixed;left:0;right:0;bottom:0;height:${px}px;background:#c9ccd3;z-index:99999;pointer-events:none;display:flex;align-items:center;justify-content:center;font:600 20px system-ui;color:#555`; k.textContent = 'keyboard'; }; });
    const kbUp = () => page.evaluate(() => window.__kb(380)); const kbDown = () => page.evaluate(() => window.__kb(0));
    const inView = (sel) => page.evaluate((q) => { const e = document.querySelector(q); if (!e) return { q, there: false }; const r = e.getBoundingClientRect(); return { q, there: true, top: Math.round(r.top), bottom: Math.round(r.bottom), ok: r.top >= 0 && r.bottom <= 844 - 380 }; }, sel);

    // ---- 1: tier 2 and tier 3 in one Move ----
    await seedHouse(); await page.evaluate(() => window.__rig.rules(true));
    await move(); let s = await st(); await snap('move opens'); console.log(JSON.stringify(s));
    await tap('.lv-sq.plus', { wait: 350 });
    WHERE.push({ name: 'bookshelf', moves: false }); await cam('closet.jpg'); await tap('.lc-shutter', { wait: 2200 });
    await snap('tier 2 photographed'); s = await st(); console.log(JSON.stringify(s));
    if (await page.locator('.wl-pend input').count()) { await page.locator('.wl-pend input').click(); await page.locator('.wl-pend input').fill('Ikea shelving unit'); console.log(JSON.stringify(await kbCheck('tier2 name'))); await snap('typing tier 2 name'); await tap('.wl-pend .btn-primary', { wait: 500 }); }
    s = await st(); await snap('tier 2 named'); console.log(JSON.stringify(s));
    await tap('.lv-sq.plus', { wait: 350 });
    WHERE.push({ name: 'living room', moves: false }); NEXT_WHERE_DELAY = 4500; await cam('real_desk.jpg'); await tap('.lc-shutter', { wait: 3600 });
    await snap('tier 3: 3 s up'); s = await st(); console.log(JSON.stringify(s));
    if (await page.locator('.wl-pend input').count()) { await page.locator('.wl-pend input').click(); await page.keyboard.type('Off', { delay: 80 }); console.log(JSON.stringify(await kbCheck('tier3 name')));
      await page.waitForTimeout(1500); await snap('typing tier 3 while the late answer lands'); await page.keyboard.type('ice', { delay: 80 });
      console.log('draft', await page.locator('.wl-pend input').inputValue().catch(() => '?')); await tap('.wl-pend .btn-primary', { wait: 600 }); }
    s = await st(); await snap('tier 3 named'); console.log(JSON.stringify(s));
    check('H1', 'three tiers stay on the card after naming the 3rd', s.squares.length === 3 && /office/i.test(s.chain), JSON.stringify(s));
    await tap('.lc-k.sv', { wait: 2600 }); await snap('after save');
    check('H1', 'saved: Desk drawer in Ikea shelving unit in Office', (await inOf('Desk drawer')) === 'Ikea shelving unit' && (await inOf('Ikea shelving unit')) === 'Office', `${await inOf('Desk drawer')} / ${await inOf('Ikea shelving unit')}`);

    // ---- 2: Move it again shows every tier already known, so + builds on the top one ----
    await move(); s = await st(); await snap('move it again'); console.log(JSON.stringify(s));
    check('H2', 'Move it again opens with every known tier as a square (Desk drawer, Ikea shelving unit, Office)', s.squares.length === 3, JSON.stringify(s.squares));
    check('H2', '+ is there to add what the Office is in', s.plus, '');

    // ---- 3: + a 4th tier by typing its name, with the keyboard up ----
    await tap('.lv-sq.plus', { wait: 350 }); s = await st(); console.log('after +', JSON.stringify(s)); await snap('plus tapped for tier 4'); await tap('.lc-choose', { wait: 500 });
    await page.locator('.wl-search input').click(); await kbUp(); await page.waitForTimeout(200);
    await page.keyboard.type('Upstairs', { delay: 40 }); await page.waitForTimeout(250);
    const f1 = await inView('.wl-search input'), f2 = await inView('.wl-new.typed');
    await snap('keyboard up: typing a new place');
    check('H3', 'with the keyboard up, the search field and "A new place called Upstairs" are above it', f1.ok && f2.ok, JSON.stringify([f1, f2]));
    await page.keyboard.press('Enter'); await page.waitForTimeout(500); await kbDown();
    s = await st(); await snap('upstairs added');
    check('H3', 'Go on the keyboard picks it: 4 tiers, "…Office in Upstairs"', s.squares.length === 4 && /office\s*in\s*upstairs/i.test(s.chain), JSON.stringify(s));
    await tap('.lc-k.sv', { wait: 2600 });
    check('H3', 'saved: Office is in Upstairs; the drawer and the shelf stay put', (await inOf('Office')) === 'Upstairs' && (await inOf('Desk drawer')) === 'Ikea shelving unit' && (await inOf('Ikea shelving unit')) === 'Office', `${await inOf('Office')}`);
    await openThing('3D model of plant sensor'); await page.evaluate(() => document.querySelector('.tp-blk').scrollIntoView({ block: 'center' }));
    const wh = await page.evaluate(() => ({ words: (document.querySelector('.tp-chain') || {}).innerText || '', pillsW: document.querySelectorAll('.tp-chain .in').length, pillsSq: document.querySelectorAll('.tp-wh .ch .in').length,
      pillBg: (() => { const e = document.querySelector('.tp-chain .in'); return e ? getComputedStyle(e).backgroundColor : ''; })() }));
    await snap('item page: where it is');
    check('H7', 'item page: the words carry every tier with the "in" pill (Desk drawer in Ikea shelving unit in Office in Upstairs)', wh.pillsW === 3 && /Desk drawer\s*in\s*Ikea shelving unit\s*in\s*Office\s*in\s*Upstairs/.test(wh.words) && wh.pillBg && wh.pillBg !== 'rgba(0, 0, 0, 0)', JSON.stringify(wh));
    check('H7', 'item page: the squares use the same "in" pill between them', wh.pillsSq === 3, JSON.stringify(wh));
    const hist0 = await page.evaluate(() => window.__rig.dump().find((x) => x.id === 'ps').history.length);

    // ---- 4: Save with nothing changed writes nothing ----
    await move(); await tap('.lc-k.sv', { wait: 1500 });
    const hist1 = await page.evaluate(() => window.__rig.dump().find((x) => x.id === 'ps').history.length);
    check('H4', 'Move it, Save with nothing changed: closes, no new history line', !(await page.locator('.lc').count()) && hist1 === hist0, `${hist0} -> ${hist1}`);

    // ---- 5: a different place at tier 1 — the old outer tiers go (they were about the drawer) ----
    await move(); await tap('.lc-choose', { wait: 500 }); await page.fill('.wl-search input', 'Kitchen counter'); await page.waitForTimeout(150);
    await tap('.where-list .wl-row:has-text("Kitchen counter")', { wait: 500 });
    s = await st(); await snap('moved to kitchen counter');
    check('H5', 'picking Kitchen counter for tier 1 drops Ikea shelving unit / Office / Upstairs (they were where the drawer is)', s.squares.length === 1 && /kitchen counter/i.test(s.squares[0]), JSON.stringify(s.squares));
    await tap('.lc-k.sv', { wait: 2600 });
    const ps = await page.evaluate(() => window.__rig.dump().find((x) => x.id === 'ps'));
    check('H5', 'saved: the item is at Kitchen counter; the drawer is still in the Ikea shelving unit', /kitchen counter/i.test(ps.location) && (await inOf('Desk drawer')) === 'Ikea shelving unit', ps.location);

    // ---- 5b (09-30 independent test #2): photographing the place it's in now — ReCall must be able to recognise it ----
    await openThing('passport'); await tap('button:has-text("Move it")', { wait: 900 }); // the passport is in the Desk drawer (not one of the 4 oldest places)
    WHERE.push({ name: 'drawer', moves: false }); await cam('drawer.jpg'); await tap('.lc-shutter', { wait: 1800 });
    check('H8', 'Move it → photograph where it is now: that place (Desk drawer) is among the places ReCall compares with', lastPoolNames.some((n) => /desk drawer/i.test(n)), JSON.stringify(lastPoolNames));
    if (await page.locator('.where-list').count()) await tap('.where-list .btn-quiet', { wait: 400 });
    await tap('.lc-x', { wait: 400 }); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 400 });
    // a place made today is recognisable too (not only the 4 oldest)
    // Studio wall: made a moment ago, with a real photo. Broken shelf: a place whose photo won't open (09-30: one bad photo
    // used to make every place unrecognisable).
    await page.evaluate((im) => { const t = Date.now(); window.__rig.seed([
      { id: 'newp', kind: 'place', owner: 'margaret', by: 'margaret', private: false, name: 'Studio wall', order: t, createdAt: t, updatedAt: t, parent: null, photos: [{ photo: im, thumb: im, at: t }] },
      { id: 'badp', kind: 'place', owner: 'margaret', by: 'margaret', private: false, name: 'Broken shelf', order: t - 1, createdAt: t - 1, updatedAt: t - 1, parent: null, photos: [{ photo: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=', thumb: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=', at: t }] }]); }, img('closet.jpg'));
    await home(); AI = { name: 'glue stick' }; await cam('real_slippers.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
    lastPoolNames = []; await snap('log glue stick'); await tap('.lv-sq.plus', { wait: 300 }); WHERE.push({ name: 'wall', moves: false }); await cam('closet.jpg'); await tap('.lc-shutter', { wait: 1800 }); await snap('glue stick where shot');
    check('H8', 'a place made today (Studio wall) is among the places ReCall compares with', lastPoolNames.some((n) => /studio wall/i.test(n)), JSON.stringify(lastPoolNames));
    check('H8', 'a place whose photo won\'t open doesn\'t stop ReCall looking (it used to give up on every place)', lastPoolNames.length >= 4, JSON.stringify(lastPoolNames));
    if (await page.locator('.where-list').count()) await tap('.where-list .btn-quiet', { wait: 400 });
    await tap('.lc-x', { wait: 400 }); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 400 });

    // ---- 5c (09-30 independent test #4): renaming a box leaves no ghost place with its old name ----
    await home(); AI = { name: 'blue scissors' }; await cam('real_slippers.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
    await tap('.lv-sq.plus', { wait: 300 }); WHERE.push({ name: 'White shoebox', moves: true }); await cam('box.jpg'); await tap('.lc-shutter', { wait: 1800 });
    if (await page.locator('.wl-pend .btn-primary').count()) await tap('.wl-pend .btn-primary', { wait: 500 });
    await snap('scissors before save'); await tap('.lc-k.sv', { wait: 2500 }); await snap('scissors after save');
    await openThing('White shoebox'); await tap('.tp-row:has-text("Rename")', { wait: 500 }); await page.locator('.sheet input').first().fill('Shoebox'); await tap('.sheet .btn-primary', { wait: 900 });
    await home(); await tap('.menu-btn', { wait: 400 }); await tap('.drawer-row:has-text("Places")', { wait: 700 });
    const plRows = await page.evaluate(() => [...document.querySelectorAll('.loc-row')].map((r) => r.innerText.replace(/\n/g, ' | ')));
    const sc = await page.evaluate(() => window.__rig.dump().find((d) => d.kind === 'item' && /blue scissors/i.test(d.name || '')));
    await snap('places after renaming the box');
    check('H9', 'renaming the White shoebox to Shoebox: no "White shoebox" left in Places; the scissors say Shoebox', !plRows.some((r) => /white shoebox/i.test(r)) && /^shoebox$/i.test((sc || {}).location || ''), JSON.stringify({ rows: plRows.filter((r) => /shoebox/i.test(r)), loc: (sc || {}).location }));

    // ---- 5d (09-30 independent tests #1 #5 #6 #7): the card after a Move, level 1's sheet, a double tap on Save ----
    await openThing('3D model of plant sensor'); await tap('button:has-text("Move it")', { wait: 900 });
    await page.locator('.lv-strip .lv-sq').nth(0).click(); await page.waitForTimeout(400); // level 1 is selected → its sheet
    const sheet1 = await page.evaluate(() => (document.querySelector('.tier-sheet') || {}).innerText || '');
    check('H10', 'Move it: level 1\'s sheet has no "Remove this level" (it emptied the chain and turned Save off)', /Choose place/.test(sheet1) && !/Remove this level/.test(sheet1), sheet1.replace(/\n/g, ' | '));
    await tap('.tier-sheet .sheet-row:has-text("Choose place")', { wait: 400 }); await page.fill('.wl-search input', 'Pantry shelf'); await page.waitForTimeout(150);
    await tap('.where-list .wl-row:has-text("Pantry shelf")', { wait: 500 });
    await page.locator('.lc-k.sv').dblclick(); await page.waitForTimeout(1500);
    const afterDbl = await page.evaluate(() => ({ remove: [...document.querySelectorAll('.sheet-title')].some((t) => /remove/i.test(t.innerText)), card: document.querySelectorAll('.saved-card').length, note: (document.querySelector('.tp-moved') || {}).innerText || '' }));
    await snap('after a move: the note on the page');
    check('H10', 'a double tap on Save does not open "Remove this item?" underneath', !afterDbl.remove, JSON.stringify(afterDbl));
    check('H10', '09-30 (Ravi 2C): a Move from the item page is said ON the page — "✓ Moved just now · Before: …" with Undo and ✕; no card over the page', afterDbl.card === 0 && /Moved just now/.test(afterDbl.note) && /Before: Kitchen counter/.test(afterDbl.note) && /Undo/.test(afterDbl.note), JSON.stringify(afterDbl));

    // ---- 6: the rename sheet (a sheet with a text field) rides above the keyboard too ----
    await openThing('3D model of plant sensor'); await tap('.tp-row:has-text("Rename")', { wait: 500 });
    await page.locator('.sheet input').first().click(); await kbUp(); await page.waitForTimeout(200);
    const r1 = await inView('.sheet input'), r2 = await inView('.sheet .btn-primary');
    await snap('rename with keyboard up'); await kbDown();
    check('H6', 'rename: the field and its button sit above the keyboard', r1.ok && r2.ok, JSON.stringify([r1, r2]));
    await page.keyboard.press('Escape').catch(() => {});
  }
  await seedHouse();
  try { await runSuite(); } catch (e) { console.error('FATAL', e); check('H', 'suite ran', false, e.message); }
  await browser.close();
}
(async () => {
  await new Promise((r) => server.listen(PORT, r));
  await runLook('b');
  const pass = results.filter((r) => r.ok).length;
  console.log(`\n${pass}/${results.length} checks passed`);
  console.log('Page errors:', errors.length ? errors : 'none');
  server.close();
})();
