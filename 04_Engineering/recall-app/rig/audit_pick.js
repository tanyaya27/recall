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

  // audit_pick (= tiers_head.js + pick_body.js) — Ravi 09-30 1:36 PM + the tester's timeout report (rig/indep/REPORT_timeout.md):
  // K1–K3 a photo on a tier that has a place asks ("This photo is…"), never assumes a new place; later shots follow the answer;
  // K4–K6 Choose place: the new place first, then search; the header keeps the old place; Cancel puts everything back;
  // K7–K9 a pick shows Before → Now; Use / Back; the photo goes to the place picked;
  // T1–T6 the tester's timeout bugs: no timer; a late answer only suggests (never sets a tier, never fills a taken name, never
  // moves the list); Save never counts a suggestion; a place is never named "A place" by Cancel; the note doesn't say "Moved".
  async function runSuite() {
    const OUT = path.join(__dirname, 'shots_pick_audit'); fs.mkdirSync(OUT, { recursive: true });
    let n = 0; const snap = async (label) => { n++; const f = `k-${String(n).padStart(2, '0')}-${label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`; await page.waitForTimeout(250); await page.screenshot({ path: path.join(OUT, f) }); console.log('  [shot]', f); return f; };
    const openThing = async (nm) => { await home(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', nm); await page.waitForTimeout(350); await page.click('.ask .tile >> nth=0'); await page.waitForSelector('.card.thing'); await page.waitForTimeout(500); };
    const move = async (nm = '3D model of plant sensor') => { await openThing(nm); await tap('button:has-text("Move it")', { wait: 900 }); };
    const st = () => page.evaluate(() => { const t = (q) => (document.querySelector(q) || {}).innerText || '';
      return { squares: [...document.querySelectorAll('.lv-strip .lv-sq:not(.plus)')].map((b) => (b.getAttribute('aria-label') || '').replace(/^Level \d+: /, '')), place: t('.lc-say'),
        chain: t('.lc-chainline').replace(/\n/g, ' '), photoFor: !!document.querySelector('.photo-for'), choose: !!document.querySelector('.where-list'), bn: !!document.querySelector('.where-list.bn'),
        save: (document.querySelector('.lc-k.sv') || {}).disabled }; });
    const close = async () => { for (let i = 0; i < 3; i++) { if (await page.locator('.where-list .btn-quiet, .photo-for .btn-quiet').count()) await page.locator('.where-list .btn-quiet, .photo-for .btn-quiet').first().click().catch(() => {}); await page.waitForTimeout(200); }
      if (await page.locator('.lc').count()) { await tap('.lc-x', { wait: 400 }); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 400 }); } };
    const photosOf = (nm) => page.evaluate((x) => { const d = window.__rig.dump().find((p) => p.kind === 'place' && p.name.toLowerCase() === x.toLowerCase()); return d ? (d.photos || []).length : -1; }, nm);
    const where = (id) => page.evaluate((i) => { const d = window.__rig.dump(); const it = d.find((x) => x.id === i); const e = d.find((x) => x.kind === 'edge' && x.from === i && !x.until); return { loc: it.location, to: e ? (e.to.name || e.to.id) : null }; }, id);
    await page.addInitScript(() => { window.__noAuto = true; }); await page.evaluate(() => { window.__noAuto = true; });
    const now = Date.now();
    await page.evaluate(([a, b, c, d, t]) => { const H = 3600e3; const P = (id, nm, im, ago) => ({ id, kind: 'place', owner: 'margaret', by: 'margaret', private: false, name: nm, order: t - ago, createdAt: t - ago, parent: null, photos: [{ photo: im, thumb: im, at: t - ago }] });
      const E = (id, from, to, ago) => ({ id, kind: 'edge', rel: 'in', from, to, since: t - ago, until: null, how: 'chosen', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [] });
      window.__rig.seed([P('pl7', 'White cardboard box', a, 93 * H), P('pik', 'Ikea shelving unit', b, 92 * H), P('plr', 'Living room', c, 91 * H),
        { id: 'ps', kind: 'item', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [], name: '3D model of plant sensor', location: 'White cardboard box', photo: d, thumb: d, thumbV: 2,
          order: t, createdAt: t - 50 * H, lastSeenAt: t - 50 * H, logId: 'l_ps', photoCount: 1, history: [{ location: 'White cardboard box', at: t - 50 * H }] },
        { id: 'sps', kind: 'snap', owner: 'margaret', by: 'margaret', itemId: 'ps', logId: 'l_ps', photo: d, thumb: d, location: 'White cardboard box', at: t - 50 * H, caption: '' },
        E('eps', 'ps', { t: 'place', name: 'White cardboard box' }, 50 * H), E('e7', 'pl7', { t: 'place', name: 'Ikea shelving unit' }, 92 * H), E('eik', 'pik', { t: 'place', name: 'Living room' }, 91 * H)]); },
    [img('box.jpg'), img('closet.jpg'), img('real_desk.jpg'), img('real_cetaphil.jpg'), now]);
    await page.evaluate(() => window.__rig.rules(true));

    // ---- K1: the shutter on the highlighted current place asks, at once; nothing behind it changes ----
    await move(); const s0 = await st();
    WHERE.length = 0; WHERE.push({ name: 'white box', moves: false }); await cam('box.jpg'); await tap('.lc-shutter', { wait: 500 });
    let s = await st(); await snap('shutter on the current place asks');
    check('K1', 'Ravi: a photo on a tier that has a place asks "This photo is…" at once — no wait, no "A new place?"', s.photoFor && !s.choose, JSON.stringify(s));
    const mm = await page.evaluate(() => ({ same: !!document.querySelector('.photo-for .pf-same .mini-mark .d.photo') && !!document.querySelector('.photo-for .pf-same .mini-mark .t svg'),
      other: !!document.querySelector('.photo-for .pf-other .mini-mark .d.pin') && /New/.test((document.querySelector('.photo-for .pf-other .mini-mark .t') || {}).innerText || '') }));
    check('C0', 'Ravi: each choice in "This photo is…" carries the mark the shutter will wear (photo + "+"; pin + "New")', mm.same && mm.other, JSON.stringify(mm));
    const dash0 = await page.evaluate(() => getComputedStyle(document.querySelector('.lv-strip .lv-sq')).borderTopStyle);
    check('D1', 'the next shot will ask (nothing changing yet): the square is SOLID', dash0 === 'solid', dash0);
    check('K1', '… and nothing behind it changed (still White cardboard box in Ikea shelving unit in Living room)', JSON.stringify(s.squares) === JSON.stringify(s0.squares), JSON.stringify([s0.squares, s.squares]));
    // ---- K2: "Another photo of the White cardboard box" — kept; later shots follow the answer ----
    await tap('.photo-for .pf-same', { wait: 400 }); s = await st();
    check('K2', '"Another photo of the White cardboard box": the tier stays, all 3 tiers stay, Save turns on', !s.photoFor && s.squares.length === 3 && /White cardboard box/.test(s.squares[0]) && s.save === false, JSON.stringify(s));
    const chip1 = await page.evaluate(() => { const b = document.querySelector('.lc-shutter'); const sp = b.querySelector('span'); const t = b.querySelector('.sh-tab');
      return { more: b.classList.contains('m-more'), photo: /url\(/.test(sp.style.backgroundImage || ''), tabPlus: !!(t && t.querySelector('svg')), label: b.getAttribute('aria-label') }; });
    check('C1', 'Ravi option 1: the place\'s photo in the shutter disc with a "+" tab while shots go to it (and VoiceOver says so)', chip1.more && chip1.photo && chip1.tabPlus && /adds to the White cardboard box/i.test(chip1.label), JSON.stringify(chip1));
    await cam('box.jpg'); await tap('.lc-shutter', { wait: 150 });
    const plus1 = await page.evaluate(async () => { for (let k = 0; k < 20; k++) { if (document.querySelector('.lc-fly') || document.querySelector('.lv-strip .lv-sq.landed')) return true; await new Promise((r) => setTimeout(r, 40)); } return false; });
    await page.waitForTimeout(400); s = await st();
    const stk = await page.evaluate(() => ({ n: (document.querySelector('.lv-strip .lv-sq .lv-n') || {}).innerText || '', prompt: (document.querySelector('.lc-prompt') || {}).innerText || '' }));
    check('C2', 'after the shot the photo flies into its square; the square counts 2; "Added — 2 photos of the White cardboard box"', plus1 && stk.n === '2' && /Added — 2 photos of the White cardboard box/.test(stk.prompt), JSON.stringify({ plus1, stk }));
    check('K2', 'Ravi: the next shot on that tier is another photo of it — no asking again', !s.photoFor && !s.choose, JSON.stringify(s));
    const pr = await page.evaluate(() => (document.querySelector('.lc-prompt') || {}).innerText || '');
    check('K2', 'the prompt says where the photos went ("Added — 2 photos of the White cardboard box. Tap its square to change that.")', /Added — 2 photos of the White cardboard box\. Tap its square/.test(pr), pr);
    const wcb0 = await photosOf('White cardboard box');
    await tap('.lc-k.sv', { wait: 2600 });
    const note = await page.evaluate(() => ((document.querySelector('.tp-moved') || {}).innerText || '').replace(/\n/g, ' | '));
    check('K2', 'saved: the White cardboard box has 2 more photos; the item did not move', (await photosOf('White cardboard box')) === wcb0 + 2 && (await where('ps')).loc === 'White cardboard box', `${wcb0} -> ${await photosOf('White cardboard box')}`);
    check('T6', 'tester #8: nothing moved → the page doesn\'t say "Moved just now"', !/Moved just now/.test(note) && /Saved just now/.test(note) && /2 photos added to the White cardboard box/.test(note), note);

    // ---- K3/K4: "A different place" → Choose place at once: the old chain in the header, the new place first, then search ----
    await move(); WHERE.length = 0; WHERE.push({ name: 'dark table surface', moves: false }); NEXT_WHERE_DELAY = 5000; await cam('real_painting.jpg'); await tap('.lc-shutter', { wait: 500 });
    await tap('.photo-for .pf-other', { wait: 500 });
    const k3 = await page.evaluate(() => { const wl = document.querySelector('.where-list'); if (!wl) return null; const kids = [...wl.children].map((c) => c.className);
      return { head: ((wl.querySelector('.wl-chg') || {}).innerText || '').replace(/\n/g, ' '), ring: (wl.querySelector('.wl-chg .sel') || {}).innerText || '', order: kids,
        firstRow: ((wl.querySelector('.wl-scroll .wl-row') || {}).innerText || '').replace(/\n/g, ' | '), rowY: (() => { const r = wl.querySelectorAll('.wl-scroll .wl-row')[1]; return r ? Math.round(r.getBoundingClientRect().top) : null; })() }; });
    await snap('a different place: choose place');
    const dash1 = await page.evaluate(() => { const q = document.querySelector('.lv-strip .lv-sq'); return q ? getComputedStyle(q).borderTopStyle : ''; });
    check('D1', 'Ravi: while the new photo waits in Choose place, its tier\'s square is DASHED (going to change)', dash1 === 'dashed', dash1);
    check('K3', '"A different place": Choose place opens at once; the header still shows where it IS (White cardboard box ringed, in Ikea shelving unit in Living room)', k3 && k3.ring === 'White cardboard box' && /Ikea shelving unit/.test(k3.head) && /different place/.test(k3.head), JSON.stringify(k3));
    const iPend = k3 ? k3.order.findIndex((c) => /wl-pend/.test(c)) : -1, iSearch = k3 ? k3.order.findIndex((c) => /wl-search/.test(c)) : -1;
    check('K4', 'Ravi: the new place comes first, then the search, then the list', iPend >= 0 && iSearch > iPend, JSON.stringify(k3 && k3.order));
    check('T3', 'tester #3c: ReCall\'s slot is the first row from the start ("Looking at your photo…")', k3 && /Looking at your photo/.test(k3.firstRow), k3 && k3.firstRow);
    // the late sure answer (Kitchen counter, at 5 s): the slot fills; nothing jumps; the name field isn't given a taken name
    await page.waitForTimeout(100);
    // (the stub's answer is 'dark table surface' — replaced below by a sure Kitchen counter answer on the next shot)
    await tap('.where-list .btn-quiet', { wait: 400 }); s = await st();
    check('K4', 'Cancel puts it all back: White cardboard box, 3 tiers, Save off (nothing changed)', !s.choose && s.squares.length === 3 && /White cardboard box/.test(s.squares[0]) && s.save === true, JSON.stringify(s));
    await page.waitForTimeout(5000);
    s = await st(); check('T1', 'tester #1: the late answer for a sheet she left changes nothing', s.squares.length === 3 && /White cardboard box/.test(s.squares[0]), JSON.stringify(s.squares));

    // ---- T2/T3: a late SURE answer while Choose place is open only suggests ----
    WHERE.length = 0; WHERE.push({ name: 'kitchen counter', moves: false, known: 'Kitchen counter', sure: true }); NEXT_WHERE_DELAY = 3500; await cam('closet.jpg'); await tap('.lc-shutter', { wait: 500 });
    await tap('.photo-for .pf-other', { wait: 700 });
    const y0 = await page.evaluate(() => { const r = document.querySelectorAll('.where-list .wl-scroll .wl-row')[1]; return r ? Math.round(r.getBoundingClientRect().top) : null; });
    await page.waitForTimeout(4200);
    const t3 = await page.evaluate(() => { const wl = document.querySelector('.where-list'); const r = wl.querySelectorAll('.wl-scroll .wl-row');
      return { first: (r[0] || {}).innerText || '', y: r[1] ? Math.round(r[1].getBoundingClientRect().top) : null, field: (wl.querySelector('.wl-pend input') || {}).value || '', taken: (wl.querySelector('.wl-taken') || {}).innerText || '', head: (wl.querySelector('.wl-chg .sel') || {}).innerText || '' }; });
    s = await st(); await snap('late sure answer while choosing');
    check('T3', 'tester #3: a late sure answer fills ReCall\'s slot ("Kitchen counter") — the rows don\'t move', /Kitchen counter/.test(t3.first) && t3.y === y0, JSON.stringify({ y0, t3 }));
    check('T3', '… the name field isn\'t given a name she already has, and nothing is refused', t3.field === '' && !t3.taken, JSON.stringify(t3));
    check('T2', '… and the tier behind the sheet is not set to it (still White cardboard box in the header ring)', t3.head === 'White cardboard box', JSON.stringify(t3));
    // ---- K7–K9: a pick shows Before → Now; Back; Use; the photo goes to the place picked ----
    await tap('.where-list .wl-scroll .wl-row.wl-sugg', { wait: 400 });
    const bn = await page.evaluate(() => { const b = document.querySelector('.where-list.bn'); return b ? { text: b.innerText.replace(/\n/g, ' | '), imgs: b.querySelectorAll('.bn-ph img').length } : null; });
    await snap('before now kitchen counter');
    check('K7', 'Ravi: a pick doesn\'t close the sheet — it shows BEFORE White cardboard box → NOW Kitchen counter, with photos', bn && /BEFORE/.test(bn.text) && /White cardboard box/.test(bn.text) && /NOW/.test(bn.text) && /Kitchen counter/.test(bn.text) && bn.imgs === 2 && /will be in the Kitchen counter/.test(bn.text), JSON.stringify(bn));
    await page.locator('.where-list.bn .bn-ph').nth(1).click(); await page.waitForTimeout(400);
    const zoom = await page.evaluate(() => (document.querySelector('.d2-pv .d2-meta') || {}).innerText || '');
    check('K7', 'a Now photo opens big (the app\'s viewer), swipeable', /Kitchen counter · photo 1 of 2/.test(zoom), zoom);
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    await tap('.where-list.bn .btn-secondary', { wait: 300 }); s = await st();
    check('K8', '"Back to the list" goes back — nothing chosen', s.choose && !s.bn, JSON.stringify(s));
    const kc0 = await photosOf('Kitchen counter');
    await tap('.where-list .wl-scroll .wl-row.wl-sugg', { wait: 300 }); await tap('.where-list.bn .btn-primary', { wait: 500 }); s = await st();
    const dash2 = await page.evaluate(() => getComputedStyle(document.querySelector('.lv-strip .lv-sq')).borderTopStyle);
    check('D1', '… and SOLID once the place is chosen (Use)', dash2 === 'solid', dash2);
    check('K9', '"Use the Kitchen counter": the tier is the Kitchen counter (its old tiers above go)', !s.choose && /Kitchen counter/.test(s.squares[0]), JSON.stringify(s));
    await cam('closet.jpg'); await tap('.lc-shutter', { wait: 500 }); s = await st();
    check('K2', 'Ravi: after picking with a photo, the next shot is another photo of the Kitchen counter — no asking', !s.photoFor && !s.choose, JSON.stringify(s));
    // Ravi: any tap on a tier resets it — tap the Kitchen counter square (its sheet opens), close it, shoot → asks again
    await page.locator('.lv-strip .lv-sq').nth(0).click(); await page.waitForTimeout(300); if (await page.locator('.tier-sheet').count()) await tap('.tier-sheet .btn-quiet', { wait: 300 });
    const chip3 = await page.evaluate(() => { const b = document.querySelector('.lc-shutter'); return b.classList.contains('m-more') || b.classList.contains('m-new') || !!b.querySelector('.sh-tab'); });
    check('C1', 'after a tap on the tier the shutter is plain again (the next shot will ask)', !chip3, String(chip3));
    WHERE.length = 0; await cam('closet.jpg'); await tap('.lc-shutter', { wait: 500 }); s = await st();
    check('K2', 'Ravi: after a tap on the tier, the next shot asks "This photo is…" again', s.photoFor, JSON.stringify(s));
    await tap('.photo-for .btn-quiet', { wait: 300 });
    await tap('.lc-k.sv', { wait: 2600 });
    check('K9', 'saved: the item is on the Kitchen counter, and the Kitchen counter got both photos', (await where('ps')).loc === 'Kitchen counter' && (await photosOf('Kitchen counter')) === kc0 + 2, `${kc0} -> ${await photosOf('Kitchen counter')}`);

    // ---- K5/K6: a new place by name → Before/Now with NEW; saved with the photo ----
    await move(); WHERE.length = 0; WHERE.push({ name: 'hall bench', moves: false }); NEXT_WHERE_DELAY = 300; await cam('real_slippers.jpg'); await tap('.lc-shutter', { wait: 500 });
    await tap('.photo-for .pf-other', { wait: 900 });
    const fld = await page.locator('.wl-pend input').inputValue();
    await tap('.wl-pend .btn-primary', { wait: 400 });
    const bn2 = await page.evaluate(() => ((document.querySelector('.where-list.bn') || {}).innerText || '').replace(/\n/g, ' | '));
    check('K5', 'Use this name → Before Kitchen counter → Now "Hall bench" NEW, with your photo', /Hall bench/i.test(bn2) && /NEW/.test(bn2) && /Kitchen counter/.test(bn2), JSON.stringify({ fld, bn2 }));
    await tap('.where-list.bn .btn-primary', { wait: 500 }); await tap('.lc-k.sv', { wait: 2600 });
    check('K6', 'saved: a new place "Hall bench" with the photo; the item is on it', (await where('ps')).loc.toLowerCase() === 'hall bench' && (await photosOf('Hall bench')) === 1, JSON.stringify(await where('ps')));

    // ---- T4/T5: an empty tier (+): the photo opens Choose place at once; Cancel leaves no "A place" ----
    await move(); await tap('.lv-sq.plus', { wait: 350 }); WHERE.length = 0; WHERE.push({ name: '', moves: false }); NEXT_WHERE_DELAY = 200; await cam('real_desk.jpg'); await tap('.lc-shutter', { wait: 700 });
    s = await st(); check('K1', 'a photo on an EMPTY tier opens Choose place at once (nothing to ask about)', s.choose && !s.photoFor, JSON.stringify(s));
    await tap('.where-list .btn-quiet', { wait: 400 }); s = await st();
    check('T5', 'tester #6: Cancel there leaves no unnamed "A place" — the tier is empty again and Save stays off', s.save === true && !s.squares.some((q) => /A place/.test(q)), JSON.stringify(s));
    await close();
    const aPlace = await page.evaluate(() => window.__rig.dump().some((x) => x.kind === 'place' && /^a place$/i.test(x.name)));
    check('T5', 'no place called "A place" was ever stored', !aPlace, String(aPlace));

    // ---- K10: Choose place from the button — "Photograph a new place" first; the next shot IS the new place ----
    await move(); await tap('.lc-choose', { wait: 500 });
    const ord = await page.evaluate(() => [...document.querySelector('.where-list').children].map((c) => c.className));
    check('K10', 'Choose place from the button: "Photograph a new place" is above the search', ord.findIndex((c) => /wl-new/.test(c)) >= 0 && ord.findIndex((c) => /wl-new/.test(c)) < ord.findIndex((c) => /wl-search/.test(c)), JSON.stringify(ord));
    const wlm = await page.evaluate(() => !!document.querySelector('.where-list .wl-new.marked .mini-mark .d.pin'));
    check('C0', '"Photograph a new place" carries the same pin + "New" mark', wlm, String(wlm));
    await tap('.where-list .wl-new', { wait: 400 });
    const chip2 = await page.evaluate(() => { const b = document.querySelector('.lc-shutter'); return { m: b.classList.contains('m-new'), pin: !!b.querySelector('span svg'), tab: (b.querySelector('.sh-tab') || {}).innerText || '', prompt: (document.querySelector('.lc-prompt') || {}).innerText || '' }; });
    const dash3 = await page.evaluate(() => getComputedStyle(document.querySelector('.lv-strip .lv-sq.sel')).borderTopStyle);
    check('D1', '"Photograph a new place" armed: the selected square is DASHED', dash3 === 'dashed', dash3);
    check('C1', '"Photograph a new place": a pin in the shutter disc with a "New" tab, and "Shutter: the new place"', chip2.m && chip2.pin && /New/.test(chip2.tab) && /Shutter: the new place/.test(chip2.prompt), JSON.stringify(chip2));
    WHERE.length = 0; WHERE.push({ name: 'garage wall', moves: false }); await cam('real_desk.jpg'); await tap('.lc-shutter', { wait: 700 });
    s = await st(); check('K10', '… and the next shot goes straight to naming the new place (it doesn\'t ask again)', s.choose && !s.photoFor, JSON.stringify(s));
    await close();
  }
  await seedHouse();
  try { await runSuite(); } catch (e) { console.error('FATAL', e); check('K', 'suite ran', false, e.message); }
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
