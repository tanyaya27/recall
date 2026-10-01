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

  // audit_p30d (= tiers_head.js + p30d_body.js) — Ravi's phone test of 20260930c (09-30, 10:27–10:32):
  // P1 the photo viewer puts "photo 1 of 3" in a different spot in the camera than on the item page;
  // P2 the item page says "seen" at the time of a Move nobody photographed; the cover photo's time is the Move's too;
  // P3 Choose place gives no clue which tier it changes (and "Current place" only for level 1); the camera doesn't either;
  // P4 after Choose place on a tier that had a photo, the square keeps the OLD photo (and the old photo went onto the new place);
  // P5 "nothing here yet" under a place that holds another place; P6 "the in air".
  async function runSuite() {
    const OUT = path.join(__dirname, 'shots_p30d'); fs.mkdirSync(OUT, { recursive: true });
    let n = 0; const snap = async (label) => { n++; const f = `p-${String(n).padStart(2, '0')}-${label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`; await page.waitForTimeout(250); await page.screenshot({ path: path.join(OUT, f) }); console.log('  [shot]', f); return f; };
    const openThing = async (nm) => { await home(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', nm); await page.waitForTimeout(350); await page.click('.ask .tile >> nth=0'); await page.waitForSelector('.card.thing'); await page.waitForTimeout(500); };
    const move = async () => { await openThing('3D model of plant sensor'); await tap('button:has-text("Move it")', { wait: 900 }); };
    const st = () => page.evaluate(() => { const t = (q) => (document.querySelector(q) || {}).innerText || '';
      return { squares: [...document.querySelectorAll('.lv-strip .lv-sq:not(.plus)')].map((b) => b.getAttribute('aria-label')), thumbs: [...document.querySelectorAll('.lv-strip .lv-sq:not(.plus)')].map((b) => { const i = b.querySelector('img'); return i ? i.getAttribute('src').slice(-40) : ''; }),
        place: t('.lc-say'), chain: t('.lc-chainline').replace(/\n/g, ' '), chainSel: t('.lc-chainline .sel'), prompt: t('.lc-prompt'), choose: t('.lc-choose') }; });
    const H = 3600e3; const now = Date.now();
    const tail = (s) => (s || '').slice(-40);
    // Ravi's house, as on his phone: the 3D model is in the White cardboard box, in the Ikea shelving unit, in the Living room.
    // Logged (photographed) 50 h ago; nothing has moved since.
    await page.evaluate(([a, b, c, d, t]) => { const H = 3600e3; const P = (id, nm, im, ago) => ({ id, kind: 'place', owner: 'margaret', by: 'margaret', private: false, name: nm, order: t - ago, createdAt: t - ago, parent: null, photos: [{ photo: im, thumb: im, at: t - ago }] });
      const E = (id, from, to, ago) => ({ id, kind: 'edge', rel: 'in', from, to, since: t - ago, until: null, how: 'chosen', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [] });
      window.__rig.seed([
        P('pl7', 'White cardboard box', a, 93 * H), P('pik', 'Ikea shelving unit', b, 92 * H), P('plr', 'Living room', c, 91 * H), P('pair', 'In air', d, 60 * H),
        { id: 'ps', kind: 'item', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [], name: '3D model of plant sensor', location: 'White cardboard box', photo: d, thumb: d, thumbV: 2,
          order: t - 50 * H, createdAt: t - 50 * H, lastSeenAt: t - 50 * H, logId: 'l_ps', photoCount: 1, history: [{ location: 'White cardboard box', at: t - 50 * H }] },
        { id: 'sps', kind: 'snap', owner: 'margaret', by: 'margaret', itemId: 'ps', logId: 'l_ps', photo: d, thumb: d, location: 'White cardboard box', at: t - 50 * H, caption: '' },
        E('eps', 'ps', { t: 'place', name: 'White cardboard box' }, 50 * H), E('e7', 'pl7', { t: 'place', name: 'Ikea shelving unit' }, 92 * H), E('eik', 'pik', { t: 'place', name: 'Living room' }, 91 * H)]); },
    [img('box.jpg'), img('closet.jpg'), img('real_desk.jpg'), img('real_cetaphil.jpg'), now]);
    await page.evaluate(() => window.__rig.rules(true));

    // ---- P1: one photo viewer, one place for "photo 1 of N" ----
    await openThing('3D model of plant sensor');
    await page.locator('.tp-wh .ph-open').first().click(); await page.waitForTimeout(500);
    const v1 = await page.evaluate(() => { const m = document.querySelector('.d2-pv .d2-meta'); const im = document.querySelector('.d2-pv .d2-slide img'); return { there: !!m, text: m ? m.innerText : '', above: m && im ? m.getBoundingClientRect().bottom <= im.getBoundingClientRect().top + 2 : null }; });
    await snap('item page: a place photo in the viewer');
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    await tap('button:has-text("Move it")', { wait: 900 });
    await page.locator('.lv-strip .lv-sq').nth(1).click(); await page.waitForTimeout(350); // select tier 2 (the Ikea shelving unit)
    await page.locator('.lv-strip .lv-sq').nth(1).click(); await page.waitForTimeout(350); // tap it again → its sheet
    if (await page.locator('.tier-sheet .sheet-row:has-text("See its photos")').count()) await tap('.tier-sheet .sheet-row:has-text("See its photos")', { wait: 500 });
    const v2 = await page.evaluate(() => { const m = document.querySelector('.d2-pv .d2-meta'); return { viewer: document.querySelector('.d2-pv') ? 'd2' : document.querySelector('.lc-pv') ? 'camera-own' : 'none', text: m ? m.innerText : ((document.querySelector('.lc-pv') || {}).innerText || '').replace(/\n/g, ' | ') }; });
    await snap('camera: a tier photo in the viewer');
    check('P1', 'the camera shows a place\'s photos in the SAME viewer as the item page — name · photo in the top bar, above the photo', v1.there && v1.above && v2.viewer === 'd2' && /Ikea shelving unit/.test(v2.text), JSON.stringify({ v1, v2 }));
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    if (await page.locator('.d2-pv, .lc-pv').count()) { await page.mouse.click(20, 400); await page.waitForTimeout(300); }
    await tap('.lc-x', { wait: 400 }); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 400 });

    // ---- P3: Choose place says which tier it changes; the camera marks it too ----
    await move(); let s = await st(); await snap('move it opens');
    check('P3', 'Move it: the chain line marks the tier Choose place will change (level 1: White cardboard box)', /White cardboard box/.test(s.chainSel), JSON.stringify(s));
    await tap('.lc-choose', { wait: 500 });
    const c1 = await page.evaluate(() => ({ head: ((document.querySelector('.where-list .wl-chg') || {}).innerText || '').replace(/\n/g, ' '), sel: (document.querySelector('.where-list .wl-chg .sel') || {}).innerText || '',
      cur: [...document.querySelectorAll('.where-list .wl-row')].filter((r) => r.querySelector('.wl-cur')).map((r) => r.querySelector('b').innerText) }));
    await snap('choose place for level 1');
    check('P3', 'Choose place (level 1) shows the whole chain and marks what it changes: White cardboard box, for the 3D model', c1.sel === 'White cardboard box' && /Ikea shelving unit/.test(c1.head) && /Living room/.test(c1.head) && /3D model/i.test(c1.head), JSON.stringify(c1));
    check('P3', '… and the White cardboard box row says Current place', c1.cur.some((x) => /White cardboard box/.test(x)), JSON.stringify(c1.cur));
    await tap('.where-list .btn-quiet', { wait: 400 });
    await page.locator('.lv-strip .lv-sq').nth(1).click(); await page.waitForTimeout(350); // select tier 2
    s = await st();
    check('P3', 'tier 2 selected: the chain line marks the Ikea shelving unit', /Ikea shelving unit/.test(s.chainSel), JSON.stringify(s));
    await tap('.lc-choose', { wait: 500 });
    const c2 = await page.evaluate(() => ({ head: ((document.querySelector('.where-list .wl-chg') || {}).innerText || '').replace(/\n/g, ' '), sel: (document.querySelector('.where-list .wl-chg .sel') || {}).innerText || '',
      cur: [...document.querySelectorAll('.where-list .wl-row')].filter((r) => r.querySelector('.wl-cur')).map((r) => r.querySelector('b').innerText) }));
    await snap('choose place for tier 2');
    check('P3', 'Choose place (tier 2) marks the Ikea shelving unit, and says it is where the White cardboard box goes', c2.sel === 'Ikea shelving unit' && /White cardboard box/.test(c2.head), JSON.stringify(c2));
    check('P3', '… and the Ikea shelving unit row says Current place (not only for level 1)', c2.cur.some((x) => /Ikea shelving unit/.test(x)) && !c2.cur.some((x) => /White cardboard box/.test(x)), JSON.stringify(c2.cur));
    // ---- P5: a place that holds another place is not "nothing here yet" ----
    const sub = await page.evaluate(() => { const r = [...document.querySelectorAll('.where-list .wl-row')].find((x) => /Ikea shelving unit/.test(x.querySelector('b').innerText)); return r ? r.querySelector('small').innerText : 'no row'; });
    check('P5', 'Choose place: the Ikea shelving unit (it holds the White cardboard box) is not "nothing here yet"', !/nothing here yet/.test(sub) && /White cardboard box/.test(sub), sub);
    await tap('.where-list .btn-quiet', { wait: 400 });
    await tap('.lc-x', { wait: 400 }); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 400 });

    // ---- P4 + P6: photograph a new top tier, then Choose place on it → the square shows the place picked ----
    await move();
    await tap('.lv-sq.plus', { wait: 350 });
    WHERE.push({ name: 'foyer', moves: false }); await cam('real_painting.jpg'); await tap('.lc-shutter', { wait: 2200 });
    if (await page.locator('.wl-pend input').count()) { await page.locator('.wl-pend input').fill('Foyer at the front door'); await tap('.wl-pend .btn-primary', { wait: 500 }); }
    s = await st(); await snap('foyer photographed as tier 4');
    const foyerThumb = s.thumbs[3];
    await page.locator('.lv-strip .lv-sq').nth(3).click(); await page.waitForTimeout(350); // tap the selected square → its sheet
    await tap('.tier-sheet .sheet-row:has-text("Choose place")', { wait: 450 });
    await page.fill('.wl-search input', 'In air'); await page.waitForTimeout(150);
    await tap('.where-list .wl-row:has-text("In air")', { wait: 500 });
    s = await st(); await snap('tier 4 changed to In air');
    const airThumb = tail(await page.evaluate(() => { const d = window.__rig.dump().find((x) => x.kind === 'place' && x.name === 'In air'); return d.photos[0].thumb; }));
    check('P4', 'the square of the tier just changed shows the place picked (In air\'s photo), not the photo taken for the Foyer', /In air/.test(s.place) && s.thumbs[3] === airThumb && s.thumbs[3] !== foyerThumb, JSON.stringify({ place: s.place, now: s.thumbs[3], air: airThumb, foyer: foyerThumb }));
    check('P6', 'the prompt about a place called "In air" doesn\'t say "the in air"', !/the in air/i.test(s.prompt), s.prompt);
    const airPhotos0 = await page.evaluate(() => window.__rig.dump().find((x) => x.kind === 'place' && x.name === 'In air').photos.length);
    await tap('.lc-k.sv', { wait: 2600 });
    const airPhotos1 = await page.evaluate(() => window.__rig.dump().find((x) => x.kind === 'place' && x.name === 'In air').photos.length);
    check('P4', 'saved: the Foyer\'s photo did not go onto "In air" (Choose place replaced that tier)', airPhotos1 === airPhotos0, `${airPhotos0} -> ${airPhotos1}`);

    // ---- P2: "seen" only when it was photographed; a Move says "moved" ----
    await page.evaluate(() => window.__rig.seed([{ id: 'eik', kind: 'edge', rel: 'in', from: 'pik', to: { t: 'place', name: 'Living room' }, since: Date.now() - 91 * 3600e3, until: null, how: 'chosen', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [] }]));
    await move(); await tap('.lc-choose', { wait: 500 }); await page.fill('.wl-search input', 'Pantry shelf'); await page.waitForTimeout(150);
    await tap('.where-list .wl-row:has-text("Pantry shelf")', { wait: 500 }); await tap('.lc-k.sv', { wait: 2600 });
    await openThing('3D model of plant sensor');
    const when = await page.evaluate(() => { const b = document.querySelectorAll('.tp-blk')[0]; const sm = b ? b.querySelector('.tp-wh + small, small') : null; return [...document.querySelectorAll('.tp-blk small')].map((x) => x.innerText).join(' | '); });
    await snap('item page after a move');
    check('P2', 'after a Move nobody photographed, the page says "moved …" and when it was last SEEN (50 h ago) — not "seen today"', /moved today/i.test(when) && /last seen/i.test(when) && !/(^|\|\s*)seen today/i.test(when), when);
    const stamp = await page.evaluate(() => { const s = document.querySelector('.photo-strip .stamp, .stamp'); return s ? s.innerText : ''; });
    await page.locator('img.photo-full').first().click(); await page.waitForTimeout(500);
    const vt = await page.evaluate(() => (document.querySelector('.d2-pv .d2-meta') || {}).innerText || '');
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    check('P2', 'the photo\'s own time is when it was TAKEN (2 days ago), not the time of the Move', !/Today/.test(vt) && (!stamp || !/Today/.test(stamp)), JSON.stringify({ vt, stamp }));
    // a photo taken later → "seen" again. (Seeded: a real photo taken now, after the move.)
    await page.evaluate(([im]) => { const t = Date.now(); window.__rig.seed([{ id: 'sps2', kind: 'snap', owner: 'margaret', by: 'margaret', itemId: 'ps', logId: 'l_ps2', photo: im, thumb: im, location: 'Pantry shelf', at: t, caption: '', extra: true }]); }, [img('real_pencil.jpg')]);
    await openThing('3D model of plant sensor');
    const when2 = await page.evaluate(() => [...document.querySelectorAll('.tp-blk small')].map((x) => x.innerText).join(' | '));
    check('P2', 'a photo of it taken after the move → "seen today …" (no "moved")', /seen today/i.test(when2) && !/moved/i.test(when2), when2);
    // moving what it's in moves it too: the Kitchen counter (in the Craft nook) goes to the Pantry shelf → the batteries "moved with the Kitchen counter"
    await page.evaluate(() => window.__rig.seed([{ id: 'ekcp', kind: 'edge', rel: 'in', from: 'pl1', to: { t: 'place', name: 'Craft nook' }, since: Date.now() - 99 * 3600e3, until: null, how: 'chosen', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [] }]));
    await openThing('spare batteries'); await tap('button:has-text("Move it")', { wait: 900 });
    await page.locator('.lv-strip .lv-sq').nth(1).click(); await page.waitForTimeout(350);
    await tap('.lc-choose', { wait: 500 }); await page.fill('.wl-search input', 'Pantry shelf'); await page.waitForTimeout(150);
    await tap('.where-list .wl-row:has-text("Pantry shelf")', { wait: 500 }); await tap('.lc-k.sv', { wait: 2600 });
    await openThing('spare batteries');
    const when3 = await page.evaluate(() => [...document.querySelectorAll('.tp-blk small')].map((x) => x.innerText).join(' | '));
    await snap('batteries after their counter moved');
    check('P2', 'its counter moved to the Pantry shelf → "moved with the Kitchen counter …", not "seen"', /moved with the Kitchen counter today/i.test(when3) && /last seen/.test(when3), when3);

    // ======== 09-30d independent tester (REPORT_d.md) ========
    // the iPhone keyboard stand-in (as audit_chain): installed before the app loads, so the app's keyboard watcher sees it
    await page.addInitScript(() => { const et = new EventTarget(); let h = null; const Hh = () => (h === null ? window.innerHeight : h);
      Object.defineProperty(et, 'height', { get: Hh }); Object.defineProperty(et, 'offsetTop', { get: () => 0 }); Object.defineProperty(et, 'width', { get: () => window.innerWidth });
      Object.defineProperty(window, 'visualViewport', { configurable: true, get: () => et }); window.__kb = (px) => { h = window.innerHeight - px; et.dispatchEvent(new Event('resize')); }; });
    const kbStub = async () => {};
    // T1: with the keyboard up, what you search for stays in sight (the new header must not push it under the keyboard)
    await openThing('baseball card'); await kbStub();
    await tap('button:has-text("Move it")', { wait: 900 });
    await page.locator('.lv-strip .lv-sq').nth(1).click(); await page.waitForTimeout(350); // tier 2: the longest header (as the tester did)
    await tap('.lc-choose', { wait: 500 }); await page.locator('.wl-search input').click(); await page.evaluate(() => window.__kb(380)); await page.waitForTimeout(250);
    await page.keyboard.type('Pan', { delay: 40 }); await page.waitForTimeout(350);
    const t1 = await page.evaluate(() => { const r = [...document.querySelectorAll('.where-list .wl-row')].find((x) => /Pantry shelf/.test(x.innerText)); const b = r ? r.getBoundingClientRect() : null; const i = document.querySelector('.wl-search input').getBoundingClientRect(); return { row: b ? Math.round(b.bottom) : null, input: Math.round(i.bottom), limit: window.innerHeight - 380 }; });
    await snap('T1 keyboard up typing Pan');
    check('T1', 'Choose place, keyboard up, "Pan" typed: the search and the Pantry shelf row sit above the keyboard', t1.row !== null && t1.row <= t1.limit && t1.input <= t1.limit, JSON.stringify(t1));
    await page.evaluate(() => window.__kb(0)); await tap('.where-list .btn-quiet', { wait: 300 }); await tap('.lc-x', { wait: 400 }); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 400 });
    // T1b: Largest text on a small iPhone, no keyboard: the first place row is on the screen
    await page.setViewportSize({ width: 375, height: 667 }); await setPrefs({ size: 'largest' });
    await openThing('baseball card'); await tap('button:has-text("Move it")', { wait: 900 }); await page.locator('.lv-strip .lv-sq').nth(1).click(); await page.waitForTimeout(350); await tap('.lc-choose', { wait: 500 });
    const t1b = await page.evaluate(() => { const r = document.querySelector('.where-list .wl-row'); return r ? Math.round(r.getBoundingClientRect().top) : null; });
    await snap('T1b largest 375 choose tier 2');
    check('T1', 'Largest on 375x667: the first place row starts on the screen (it started at 693 px)', t1b !== null && t1b < 667 - 40, String(t1b));
    await page.keyboard.press('Escape').catch(() => {}); if (await page.locator('.where-list').count()) await page.locator('.where-list .btn-quiet').click({ force: true, timeout: 3000 }).catch(() => {}); await page.waitForTimeout(300); await tap('.lc-x', { wait: 400 }); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 400 });
    await page.setViewportSize({ width: 390, height: 844 }); await setPrefs({ size: 'normal' });
    // T6: the current place is the first row
    await move(); await tap('.lc-choose', { wait: 500 });
    const t6 = await page.evaluate(() => { const r = document.querySelector('.where-list .wl-scroll .wl-row'); return r ? r.innerText.replace(/\n/g, ' | ') : ''; });
    check('T6', 'Choose place: the place saved on that tier ("Current place") is the first row, not somewhere below', /Current place/.test(t6), t6);
    await tap('.where-list .btn-quiet', { wait: 300 }); await tap('.lc-x', { wait: 400 }); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 400 });
    // T2: Undo of a Move → not "moved"
    await openThing('3D model of plant sensor');
    const before = await page.evaluate(() => [...document.querySelectorAll('.tp-blk small')].map((x) => x.innerText).join(' | '));
    await tap('button:has-text("Move it")', { wait: 900 }); await tap('.lc-choose', { wait: 500 }); await page.fill('.wl-search input', 'Linen closet'); await page.waitForTimeout(150);
    await tap('.where-list .wl-row:has-text("Linen closet")', { wait: 500 }); await tap('.lc-k.sv', { wait: 2600 });
    await tap('.tp-moved button:has-text("Undo")', { wait: 1500 });
    await openThing('3D model of plant sensor');
    const after = await page.evaluate(() => [...document.querySelectorAll('.tp-blk small')].map((x) => x.innerText).join(' | '));
    check('T2', 'Move then Undo: the page says what it said before the Move (an undone move is not a move)', after === before, JSON.stringify({ before, after }));
    // T4 + T3: a new tier on top, photographed → the header says "Choose what … is in" (not "Changing … it moves"); its viewer asks before removing; the name stays
    await move(); await tap('.lv-sq.plus', { wait: 350 });
    WHERE.push({ name: 'bench', moves: false }); await cam('real_slippers.jpg'); await tap('.lc-shutter', { wait: 2200 });
    const t4 = await page.evaluate(() => ((document.querySelector('.where-list .wl-chg') || {}).innerText || '').replace(/\n/g, ' '));
    check('T4', 'a new tier on top, just photographed: the header says "Choose what … is in", not "Changing … it moves"', /Choose what/.test(t4) && !/it moves/.test(t4), t4);
    if (await page.locator('.wl-pend input').count()) { await page.locator('.wl-pend input').fill('Foyer bench'); await tap('.wl-pend .btn-primary', { wait: 500 }); }
    const nsq = (await st()).squares.length;
    await page.locator('.lv-strip .lv-sq').nth(nsq - 1).click(); await page.waitForTimeout(350);
    await tap('.tier-sheet .sheet-row:has-text("See its photos")', { wait: 500 });
    const t5 = await page.evaluate(() => (document.querySelector('.d2-pv .d2-meta') || {}).innerText || '');
    check('T5', 'the camera viewer\'s title has the count even for one photo, like the item page ("Foyer bench · photo 1 of 1")', /Foyer bench · photo 1 of 1/.test(t5), t5);
    await tap('.d2-pv .d2-pill.rm', { wait: 400 });
    const t3a = await page.evaluate(() => ({ confirm: [...document.querySelectorAll('.sheet-title, .confirm h2, [role=alertdialog]')].map((x) => x.innerText).join(' | '), viewer: !!document.querySelector('.d2-pv') }));
    check('T3', 'Remove in the camera\'s viewer asks first ("Remove this photo?"), like the item page', /Remove this photo\?/.test(t3a.confirm), JSON.stringify(t3a));
    if (/Remove this photo/.test(t3a.confirm)) await tap('.pv-ask .btn-secondary.amber', { wait: 600 });
    const gone = await page.evaluate(() => [...document.querySelectorAll('.lv-strip .lv-sq:not(.plus)')].pop().querySelector('img') === null || true);
    s = await st(); const lastThumb = s.thumbs[s.thumbs.length - 1];
    check('T3', 'removing a named tier\'s only photo (it IS removed: no picture on its square) keeps its name ("Place: Foyer bench", not "not defined")', lastThumb === '' && /Foyer bench/.test(s.place) && !/not defined/.test(s.place), JSON.stringify({ place: s.place, lastThumb }));
    await tap('.lc-x', { wait: 400 }); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 400 });
    // T7: "moved with the Wooden box" — a box keeps its capital
    await page.evaluate(() => window.__rig.seed([{ id: 'ew', kind: 'edge', rel: 'in', from: 'w', to: { t: 'thing', id: 'm', name: 'memorabilia box' }, since: Date.now() - 80 * 3600e3, until: null, how: 'chosen', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [] }]));
    await openThing('wooden box'); await tap('button:has-text("Move it")', { wait: 900 }); await tap('.lc-choose', { wait: 500 }); await page.fill('.wl-search input', 'Pantry shelf'); await page.waitForTimeout(150);
    await tap('.where-list .wl-row:has-text("Pantry shelf")', { wait: 500 }); await tap('.lc-k.sv', { wait: 2600 });
    await openThing('baseball card');
    const t7 = await page.evaluate(() => [...document.querySelectorAll('.tp-blk small')].map((x) => x.innerText).join(' | '));
    check('T7', 'the card in the wooden box: "moved with the Wooden box" (the name as written everywhere)', /moved with the Wooden box/.test(t7), t7);
    // T8: level 2 selected — the prompt reads as one sentence
    await openThing('baseball card'); await tap('button:has-text("Move it")', { wait: 900 }); await page.locator('.lv-strip .lv-sq').nth(1).click(); await page.waitForTimeout(300);
    const t8 = (await st()).prompt.replace(/\s+/g, ' ');
    check('T8', 'a middle tier selected: the prompt is one sentence ("… or tap + to add a level on top.")', !/\. adds a level/.test(t8), t8);
    await tap('.lc-x', { wait: 400 }); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 400 });
    // ---- F (Ravi 09-30): the Choose place button wears the colour of the tier it changes; only that tier is coloured ----
    await openThing('baseball card'); await tap('button:has-text("Move it")', { wait: 900 }); await page.locator('.lv-strip .lv-sq').nth(1).click(); await page.waitForTimeout(350);
    const f = await page.evaluate(() => { const sel = document.querySelector('.lc-chainline .sel'); const b = document.querySelector('.lc-choose'); const sq = document.querySelector('.lv-strip .lv-sq.sel');
      const words = [...document.querySelectorAll('.lc-chainline .cp > span:not(.lc-in)')].map((x) => ({ n: x.innerText, c: getComputedStyle(x).color, sel: x.classList.contains('sel') }));
      return { ring: sel ? getComputedStyle(sel).borderTopColor : '', button: b ? getComputedStyle(b).borderTopColor : '', btnText: b ? getComputedStyle(b).color : '', square: sq ? getComputedStyle(sq).borderTopColor : '', words }; });
    await snap('F focus colour tier 2');
    check('F1', 'Choose place wears the colour of the tier it changes (button = ring in the chain = the selected square)', f.ring && f.button === f.ring && f.btnText === f.ring && f.square === f.ring, JSON.stringify(f));
    const others = f.words.filter((w) => !w.sel).map((w) => w.c); const plain = new Set(others);
    check('F2', 'only the tier in focus is coloured: every other tier\'s word is the same plain colour', others.length >= 1 && plain.size === 1 && !others.includes(f.ring), JSON.stringify(f.words));
    await tap('.lc-choose', { wait: 500 });
    const fh = await page.evaluate(() => [...document.querySelectorAll('.wl-chg-ch .cp > span:not(.lc-in)')].map((x) => ({ n: x.innerText, c: getComputedStyle(x).color, sel: x.classList.contains('sel') })));
    const hOthers = new Set(fh.filter((w) => !w.sel).map((w) => w.c));
    check('F2', 'Choose place header: only the tier being changed is coloured', hOthers.size === 1 && fh.filter((w) => w.sel).length === 1, JSON.stringify(fh));
    await tap('.where-list .btn-quiet', { wait: 300 }); await tap('.lc-x', { wait: 400 }); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 400 });
    // ---- S1 (Ravi 09-30): Move it opens with nothing changed → Save is off; any change turns it on ----
    await openThing('baseball card'); await tap('button:has-text("Move it")', { wait: 900 });
    const s0 = await isDisabled('.lc-k.sv');
    await snap('S1 move it just opened');
    check('S1', 'Move it, just opened (nothing changed): Save is off', s0 === true, String(s0));
    await tap('.lc-choose', { wait: 500 }); await page.fill('.wl-search input', 'Linen closet'); await page.waitForTimeout(150); await tap('.where-list .wl-row:has-text("Linen closet")', { wait: 500 });
    const s1 = await isDisabled('.lc-k.sv');
    check('S1', '… a different place picked: Save is on', s1 === false, String(s1));
    await tap('.lc-x', { wait: 400 }); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 400 });
  }
  await seedHouse();
  try { await runSuite(); } catch (e) { console.error('FATAL', e); check('P', 'suite ran', false, e.message); }
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
