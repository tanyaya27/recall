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

  // 09-30d mockups for Ravi & Tanya — the tier question (BOARD_2026-09-30_tiers-or-freeform.md). Real screens, real styles,
  // Ravi's own chain; B is build d as built; A, C, D are drawn on top of the real screens (only the block in question).
  async function runSuite() {
    const OUT = path.join(__dirname, 'shots_tier'); fs.mkdirSync(OUT, { recursive: true });
    const snap = async (f) => { await page.waitForTimeout(400); await page.screenshot({ path: path.join(OUT, f) }); console.log('  [shot]', f); };
    const inject = (fn, arg) => page.evaluate(fn, arg);
    const openThing = async (nm) => { await home(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', nm); await page.waitForTimeout(350); await page.click('.ask .tile >> nth=0'); await page.waitForSelector('.card.thing'); await page.waitForTimeout(500); };
    const move = async () => { await openThing('3D model of plant sensor'); await tap('button:has-text("Move it")', { wait: 900 }); };
    const now = Date.now();
    await page.evaluate(([a, b, c, d, t]) => { const H = 3600e3; const P = (id, nm, im, ago) => ({ id, kind: 'place', owner: 'margaret', by: 'margaret', private: false, name: nm, order: t - ago, createdAt: t - ago, parent: null, photos: [{ photo: im, thumb: im, at: t - ago }] });
      const E = (id, from, to, ago) => ({ id, kind: 'edge', rel: 'in', from, to, since: t - ago, until: null, how: 'chosen', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [] });
      window.__rig.seed([
        P('pl7', 'White cardboard box', a, 93 * H), P('pik', 'Ikea shelving unit', b, 92 * H), P('plr', 'Living room', c, 91 * H),
        { id: 'ps', kind: 'item', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [], name: '3D model of plant sensor', location: 'White cardboard box', photo: d, thumb: d, thumbV: 2,
          order: t, createdAt: t - 50 * H, lastSeenAt: t, seenAt: t - 50 * H, logId: 'l_ps', photoCount: 1, history: [{ location: 'White cardboard box', at: t - 50 * H }] },
        { id: 'sps', kind: 'snap', owner: 'margaret', by: 'margaret', itemId: 'ps', logId: 'l_ps', photo: d, thumb: d, location: 'White cardboard box', at: t - 50 * H, caption: '' },
        E('eps', 'ps', { t: 'place', name: 'White cardboard box' }, 50 * H), E('e7', 'pl7', { t: 'place', name: 'Ikea shelving unit' }, 92 * H), E('eik', 'pik', { t: 'place', name: 'Living room' }, 91 * H)]); },
    [img('box.jpg'), img('closet.jpg'), img('real_desk.jpg'), img('real_cetaphil.jpg'), now]);
    const pics = { glove: img('tooldrawer.jpg'), tesla: img('real_painting.jpg'), street: img('real_slippers.jpg') };

    // ---- B (build d, as built): the tier marked in the camera, and on top of Choose place ----
    await move(); await page.locator('.lv-strip .lv-sq').nth(1).click(); await page.waitForTimeout(400);
    await snap('B1-camera-tier-marked.png');
    await tap('.lc-choose', { wait: 600 }); await snap('B2-choose-says-which-tier.png');
    await tap('.where-list .btn-quiet', { wait: 400 }); await tap('.lc-x', { wait: 400 }); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 400 });

    // ---- A: one question per Move ----
    await move();
    await inject(() => {
      const sq = [...document.querySelectorAll('.lv-strip .lv-s')]; sq.slice(1).forEach((x) => x.remove());
      const pl = document.querySelector('.lc-plus-out'); if (pl) pl.remove();
      const say = document.querySelector('.lc-say .tx b'); if (say) say.innerHTML = '<span class="lab" style="color:#F5B942">In:</span> White cardboard box';
      const ch = document.querySelector('.lc-chainline'); ch.innerHTML = '<span style="width:100%;font-weight:600;color:#CFC7BA;font-size:.875rem">The White cardboard box is in</span>'
        + '<span class="cp"><span style="color:#8FB8E8">Ikea shelving unit</span></span><span class="cp"><span class="lc-in">in</span><span style="color:#E88F8F">Living room</span></span>'
        + '<span style="width:100%;margin-top:.25rem"><button style="min-height:36px;padding:0 .9rem;border-radius:999px;background:rgba(255,255,255,.12);color:#fff;font-weight:700;font-size:.875rem">Moved the box? Open it ›</button></span>';
      const pr = document.querySelector('.lc-prompt'); if (pr) pr.textContent = 'What is it in now? Photograph it, or choose one.'; });
    await snap('A1-move-asks-one-thing.png');
    await inject((p) => {
      const s0 = document.querySelector('.lv-strip .lv-sq img'); if (s0) s0.src = p.glove;
      const say = document.querySelector('.lc-say .tx b'); if (say) say.innerHTML = '<span class="lab" style="color:#F5B942">In:</span> Glove box <span style="font-weight:600;color:#CFC7BA">(new)</span>';
      const ch = document.querySelector('.lc-chainline'); ch.innerHTML = '<span style="width:100%;font-weight:800;font-size:1rem">What’s the Glove box in?</span>'
        + '<span style="display:flex;gap:.5rem;width:100%;margin-top:.35rem"><button style="flex:1;min-height:44px;border-radius:999px;background:#8CC4B2;color:#1F1D1A;font-weight:800">Photograph</button><button style="flex:1;min-height:44px;border-radius:999px;background:rgba(255,255,255,.14);color:#fff;font-weight:800">Choose</button><button style="flex:.7;min-height:44px;border-radius:999px;background:transparent;border:1.5px solid rgba(255,255,255,.35);color:#fff;font-weight:700">Skip</button></span>'
        + '<span style="width:100%;font-weight:600;color:#CFC7BA;font-size:.8125rem;margin-top:.3rem">Asked once, for a new place. Skip is fine.</span>';
      const pr = document.querySelector('.lc-prompt'); if (pr) pr.textContent = 'A new place: the Glove box.'; }, pics);
    await snap('A2-new-place-asks-once.png');
    await tap('.lc-x', { wait: 400 }); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 400 });
    // A3: the box's own page carries its own "where", with Move it
    await home(); await tap('.menu-btn', { wait: 400 }); await tap('.drawer-row:has-text("Places")', { wait: 700 }); await tap('.loc-row:has-text("White cardboard box")', { wait: 800 });
    await inject((p) => {
      const h = document.querySelector('.screen h1, .screen .title, .screen-title, .screen h2'); const host = document.querySelector('.screen');
      const b = document.createElement('section'); b.className = 'tp-blk'; b.style.cssText = 'margin:.5rem 0 .75rem';
      b.innerHTML = '<h2 style="margin:0 0 .5rem">Where it is</h2><div class="tp-wh multi"><div class="ch"><span class="st"><img src="' + p.b + '" alt=""></span><span class="st"><span class="in">in</span><img src="' + p.c + '" alt=""></span></div>'
        + '<div class="tx"><b class="tp-chain"><span class="cp"><span class="n1">Ikea shelving unit</span></span><span class="cp"><span class="in">in</span><span class="n2">Living room</span></span></b><small>moved Mon 4:09 PM</small></div></div>'
        + '<button class="btn-primary" style="margin-top:.625rem;width:100%"><span>Move it</span></button><p class="note-quiet left" style="margin:.4rem 0 0">Everything in it moves with it — 1 item.</p>';
      const first = host.querySelector('.card, .settings, section, .field-label'); (first && first.parentNode ? first.parentNode : host).insertBefore(b, first || null); }, { b: img('closet.jpg'), c: img('real_desk.jpg') });
    await page.evaluate(() => window.scrollTo(0, 0)); await snap('A3-the-box-moves-from-its-own-page.png');

    // ---- C: freeform ----
    await openThing('3D model of plant sensor');
    await inject((p) => { const w = document.querySelector('.tp-wh'); w.outerHTML = '<div class="tp-wh"><div class="tx"><b style="font-size:1.125rem;line-height:1.35">“Glove box of the Tesla, parked on the street”</b><small>written today 10:32 AM · seen Mon 4:09 PM</small>'
      + '<div style="display:flex;gap:.5rem;margin-top:.6rem">' + [p.glove, p.tesla, p.street].map((s) => '<img src="' + s + '" style="width:64px;height:64px;object-fit:cover;border-radius:12px">').join('') + '</div></div></div>';
      const n = document.querySelector('.tp-moved'); if (n) n.remove(); }, pics);
    await page.evaluate(() => document.querySelector('.tp-blk').scrollIntoView({ block: 'start' })); await page.evaluate(() => window.scrollBy(0, -90));
    await snap('C2-item-page-freeform.png');
    await tap('button:has-text("Move it")', { wait: 900 });
    await inject((p) => { const b = document.createElement('div'); b.className = 'sheet-back';
      b.innerHTML = '<div class="sheet where-list" style="padding-bottom:1rem"><div class="sheet-title">Where is it now?</div>'
        + '<textarea class="place-input" style="min-height:5.5rem;width:100%;box-sizing:border-box;font-size:1.0625rem;line-height:1.35;padding:.6rem .75rem">Glove box of the Tesla, parked on the street</textarea>'
        + '<div style="display:flex;gap:.5rem;margin:.6rem 0"><button class="btn-secondary" style="flex:1">🎤 Say it</button><button class="btn-secondary" style="flex:1">📷 Add a photo</button></div>'
        + '<div style="display:flex;gap:.5rem;margin-bottom:.75rem">' + [p.glove, p.tesla].map((s) => '<img src="' + s + '" style="width:72px;height:72px;object-fit:cover;border-radius:12px">').join('') + '</div>'
        + '<p class="note-quiet left" style="margin:0 0 .6rem">No places to pick — what you write is what Find searches. Moving the Tesla later means writing it again on each thing in it.</p>'
        + '<button class="btn-primary" style="width:100%">Save</button></div>'; document.querySelector('.lc').appendChild(b); }, pics);
    await snap('C1-move-is-a-sentence.png');
    await tap('.lc-x', { wait: 400, force: true }).catch(() => {}); await page.goto(`http://localhost:${PORT}/`); await page.waitForTimeout(400);

    // ---- D (tech board): A + an optional note ----
    await openThing('3D model of plant sensor');
    await inject(() => { const tx = document.querySelector('.tp-wh .tx'); const n = document.createElement('div');
      n.innerHTML = '<span style="display:inline-flex;gap:.4rem;align-items:baseline;margin-top:.35rem;padding:.3rem .6rem;border-radius:10px;background:rgba(245,185,66,.14);color:var(--ink);font-size:.9375rem"><b style="color:#B7791F">Note</b> under the spare cables, at the back</span>';
      tx.appendChild(n); const m = document.querySelector('.tp-moved'); if (m) m.remove(); });
    await page.evaluate(() => document.querySelector('.tp-blk').scrollIntoView({ block: 'start' })); await page.evaluate(() => window.scrollBy(0, -90));
    await snap('D1-a-plus-a-note.png');
    // ---- D (user board): say it, ReCall builds the chain, you confirm ----
    await tap('button:has-text("Move it")', { wait: 900 });
    await inject((p) => { const b = document.createElement('div'); b.className = 'sheet-back';
      const pill = (n, c, isNew) => '<span class="cp" style="display:inline-flex;align-items:center;gap:.375rem"><span style="border:2px solid ' + c + ';color:' + c + ';border-radius:999px;padding:.1rem .6rem;font-weight:800">' + n + '</span>' + (isNew ? '<small style="color:#CFC7BA">new</small>' : '') + '</span>';
      b.innerHTML = '<div class="sheet where-list" style="padding-bottom:1rem"><div class="sheet-title">Where is it now?</div>'
        + '<div class="wl-search" style="margin-bottom:.6rem"><span>🎤</span><input value="glove box of the Tesla, on the street" style="flex:1"></div>'
        + '<p style="margin:.25rem 0 .4rem;font-weight:700">ReCall read it as:</p>'
        + '<div class="wl-chg"><div class="wl-chg-ch">' + pill('Glove box', '#F5B942', true) + '<span class="lc-in">in</span>' + pill('Tesla', '#8FB8E8', true) + '<span class="lc-in">in</span>' + pill('Street', '#E88F8F', false) + '</div>'
        + '<p class="wl-chg-above">Street is one of your places. Glove box and Tesla are new.</p></div>'
        + '<button class="btn-primary" style="width:100%;margin-top:.4rem">✓ Looks right</button><button class="btn-secondary" style="width:100%;margin-top:.5rem">Change a part</button>'
        + '<p class="note-quiet left" style="margin:.6rem 0 0">After this it works like A: move the Tesla once, everything in it follows.</p></div>';
      document.querySelector('.lc').appendChild(b); }, pics);
    await snap('D2-say-it-recall-builds-it.png');
  }
  await seedHouse();
  try { await runSuite(); } catch (e) { console.error('FATAL', e); }
  await browser.close();
}
(async () => { await new Promise((r) => server.listen(PORT, r)); await runLook('b'); server.close(); })();
