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

let AI = { name: 'thing' }; let WHERE = []; let SAME = { index: -1, sure: false };
let NEXT_WHERE_DELAY = 0; let NEXT_WHERE_BADJSON = false; let lastPool = null;

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
      lastPool = [...texts.matchAll(/SAVED (\d+) —/g)].length;
      const w = WHERE.shift() || { name: 'shelf', moves: false };
      let index = 0; if (w.known) { const m = [...texts.matchAll(/SAVED (\d+) — "([^"]*)"/g)].find((x) => x[2].toLowerCase() === w.known.toLowerCase()); index = m ? Number(m[1]) : 0; }
      out = { name: w.name, moves: !!w.moves, index: (w.known && index === 0 && !w.nohit) ? 0 : index, sure: w.sure !== undefined ? !!w.sure : !!index };
      if (NEXT_WHERE_DELAY) { delay = NEXT_WHERE_DELAY; NEXT_WHERE_DELAY = 0; }
      if (NEXT_WHERE_BADJSON) { badjson = true; NEXT_WHERE_BADJSON = false; }
    } else if (/NEW PHOTO/.test(texts)) out = SAME;
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

  // =================================================================================================
  // render_tiers_opts — the design choices from the tier audit, rendered on the REAL app screens (rig build of the
  // fixed code); each option changes only the block in question, in the page's own DOM and stylesheet.
  const OUT = path.join(__dirname, 'shots_opts'); fs.mkdirSync(OUT, { recursive: true });
  const snap = async (name) => { await page.waitForTimeout(300); await page.screenshot({ path: `${OUT}/${name}.png` }); console.log('  [opt]', name); };
  async function runSuite(look) {
    await setPrefs({ cameraLook: look });
    const fresh = async () => { await seedHouse(); SAME = { index: -1, sure: false }; await home(); await page.evaluate(() => window.__rig.rules(true)); await page.waitForTimeout(200); };
    const newThing = async (nm) => { AI = { name: nm }; await cam('real_slippers.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 }); };
    const plus = async () => { await tap('.lv-sq.plus', { wait: 350 }); };
    const shoot = async (f, where) => { if (where) WHERE.push(where); await cam(f); await tap('.lc-shutter', { wait: 1900 }); };
    const pickWhere = async (name) => {
      const chip = page.locator(`.lc-chip:not(.more):has-text("${name.slice(0, 10)}")`);
      if (await chip.count()) { await chip.first().click(); await page.waitForTimeout(500); return; }
      await tap('.lc-chip.more', { wait: 600 }); await type('.wl-search input', name);
      await page.locator(`.wl-row:has-text("${name}")`).first().click(); await page.waitForTimeout(500);
    };
    const save = async () => { await tap('.lc-k.sv', { wait: 2600 }); };
    const openThing = async (nm) => { await home(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', nm); await page.waitForTimeout(350); await page.click('.ask .tile >> nth=0'); await page.waitForSelector('.card.thing'); await page.waitForTimeout(400); };
    const thumbOf = async (nm) => page.evaluate((n) => { const p = window.__rig.dump().find((d) => d.kind === 'place' && d.name.toLowerCase() === n.toLowerCase()); return p && p.photos && p.photos[0] ? p.photos[0].thumb : ''; }, nm);

    // ---- the house: stapler in Drawer 3, in the Oak cabinet, in the Office (three new places); tape at Kitchen counter,
    // which is in Craft nook.
    await fresh();
    await newThing('stapler'); await plus(); await shoot('drawer.jpg', { name: 'Drawer 3', moves: false });
    await plus(); await shoot('closet.jpg', { name: 'Oak cabinet', moves: false }); await plus(); await shoot('real_desk.jpg', { name: 'Office', moves: false }); await save();
    await home(); await newThing('tape'); await plus(); await pickWhere('Kitchen counter'); await plus(); await pickWhere('Craft nook'); await save();
    const T = { d3: await thumbOf('Drawer 3'), oak: await thumbOf('Oak cabinet'), off: await thumbOf('Office') };

    // ---------- Q1: the thing's page, Where it is ----------
    await openThing('stapler'); await page.evaluate(() => document.querySelector('.tp-blk').scrollIntoView({ block: 'center' }));
    await snap('Q1-0-now');
    const setWhere = (html) => page.evaluate((h) => { document.querySelector('.tp-wh').outerHTML = h; }, html);
    const sq = (src) => `<span class="st">${src ? `<img src="${src}" alt="">` : '<span class="no">?</span>'}</span>`;
    const inS = (src) => `<span class="st"><span class="in">in</span><img src="${src}" alt=""></span>`;
    await setWhere(`<div class="tp-wh"><div class="ch">${sq(T.d3)}${inS(T.oak)}${inS(T.off)}</div><div class="tx"><b>Drawer 3</b><small>in the Oak cabinet · Office</small></div></div>`);
    await snap('Q1-A-row');
    await openThing('stapler'); await page.evaluate(() => document.querySelector('.tp-blk').scrollIntoView({ block: 'center' }));
    await setWhere(`<div class="tp-wh"><div class="ch">${sq(T.d3)}</div><div class="tx"><b>Drawer 3</b><small>in the Oak cabinet, in the Office</small></div></div>`);
    await snap('Q1-B-words');
    await openThing('stapler'); await page.evaluate(() => document.querySelector('.tp-blk').scrollIntoView({ block: 'center' }));
    const rung = (src, nm, first) => `<div style="display:flex;align-items:center;gap:.625rem;padding:.25rem 0">${first ? '' : ''}<img src="${src}" style="width:46px;height:46px;border-radius:10px;object-fit:cover"><b style="font-size:1.0625rem">${nm}</b><span style="margin-left:auto;color:var(--ink-soft)">›</span></div>`;
    await setWhere(`<div class="tp-wh" style="display:block">${rung(T.d3, 'Drawer 3', true)}<div style="margin-left:22px;border-left:2px solid var(--line, #ccc);padding-left:14px">${rung(T.oak, 'in the Oak cabinet')}<div style="margin-left:0;border-left:0;padding-left:14px">${rung(T.off, 'in the Office')}</div></div></div>`);
    await snap('Q1-C-ladder');

    // ---------- Q2: the Places list ----------
    await home(); await tap('.menu-btn', { wait: 400 }); await tap('.drawer-row:has-text("Places")', { wait: 700 });
    await snap('Q2-0-now');
    await page.evaluate(() => { const par = { 'drawer 3': 'Oak cabinet', 'oak cabinet': 'Office', 'kitchen counter': 'Craft nook' };
      document.querySelectorAll('.loc-row').forEach((r) => { const n = r.querySelector('.nm b').innerText.toLowerCase(); const s = r.querySelector('.nm small'); if (par[n]) s.innerText = 'in the ' + par[n] + ' · ' + s.innerText; }); });
    await snap('Q2-A-in-line');
    await home(); await tap('.menu-btn', { wait: 400 }); await tap('.drawer-row:has-text("Places")', { wait: 700 });
    await page.evaluate(() => { const kids = { office: ['oak cabinet'], 'oak cabinet': ['drawer 3'], 'craft nook': ['kitchen counter'] };
      const rows = [...document.querySelectorAll('.loc-row')]; const by = Object.fromEntries(rows.map((r) => [r.querySelector('.nm b').innerText.toLowerCase(), r]));
      const place = (n, depth, after) => { const r = by[n]; if (!r) return after; r.style.marginLeft = (depth * 1.5) + 'rem'; if (depth) r.style.borderLeft = '3px solid var(--accent, #2F6B5E)'; after.after(r); let last = r; (kids[n] || []).forEach((k) => { last = place(k, depth + 1, last); }); return last; };
      const top = rows[0].parentElement; const anchor = document.createElement('div'); top.insertBefore(anchor, rows[0]);
      let last = anchor; ['office', 'craft nook'].forEach((n) => { last = place(n, 0, last); }); });
    await snap('Q2-B-nested');

    // ---------- Q3: saying a place that already has a "where" is somewhere else (Kitchen counter is in Craft nook) ----------
    await home(); await newThing('glue'); await plus(); await pickWhere('Kitchen counter');
    await snap('Q3-0-now-tier1'); // the fix: its where shows in the sentence
    await plus(); await pickWhere('Pantry shelf');
    await snap('Q3-0-now-silent');
    // A: picking Kitchen counter brings its where in as tier 2 (Craft nook), marked; changing tier 2 says so.
    await home(); await newThing('glue'); await plus(); await pickWhere('Kitchen counter'); await plus(); await pickWhere('Craft nook');
    await page.evaluate(() => { const t = document.querySelectorAll('.lv-sq')[2]; if (t) { const b = document.createElement('span'); b.className = 'lv-n'; b.textContent = '✓'; b.style.background = '#2F6B5E'; t.appendChild(b); }
      const p = document.querySelector('.lc-prompt small'); if (p) p.innerText = 'Kitchen counter is in Craft nook. Tap another place to change that.'; });
    await snap('Q3-A-shown-as-tier2');
    // C: ask at Save.
    await page.locator('.lc-x').first().click().catch(() => {}); await page.waitForTimeout(300); await tap('text=Throw away', { wait: 300 }).catch(() => {});
    await home(); await newThing('glue'); await plus(); await pickWhere('Kitchen counter'); await plus(); await pickWhere('Pantry shelf');
    await page.evaluate(() => { const say = document.querySelector('.lc-say'); const a = document.createElement('div'); a.className = 'lc-ask';
      a.innerHTML = '<b style="color:#6BB6FF"><span>Kitchen counter is in Craft nook. Move it to Pantry shelf?</span></b><div><button type="button">Move it</button><button type="button" class="o">No, keep Craft nook</button></div><small style="display:block;margin-top:.4rem;opacity:.8">Tape and 1 more move with it.</small>';
      say.replaceWith(a); });
    await snap('Q3-C-ask');
    // B: silent, announced on the card.
    await page.evaluate(() => { const a = document.querySelector('.lc-ask'); if (a) a.remove(); });
    await page.locator('.lc-x').first().click().catch(() => {}); await page.waitForTimeout(300); await tap('text=Throw away', { wait: 300 }).catch(() => {});
    await home(); await newThing('glue'); await plus(); await pickWhere('Kitchen counter'); await plus(); await pickWhere('Pantry shelf'); await save();
    await page.evaluate(() => { const s = document.querySelector('.saved-card .s'); if (s) { const m = document.createElement('small'); m.textContent = 'Kitchen counter moved: Craft nook → Pantry shelf · 2 things with it'; m.style.display = 'block'; s.appendChild(m); } });
    await snap('Q3-B-announced');

    // ---------- Q4: a place inside a box (Linen closet in the tin box) ----------
    await home(); await newThing('glue'); await plus(); await pickWhere('Linen closet'); await plus();
    await snap('Q4-A-allowed-pills'); await pickWhere('Tin box'); await snap('Q4-A-allowed');
    await page.locator('.lc-x').first().click().catch(() => {}); await page.waitForTimeout(300); await tap('text=Throw away', { wait: 300 }).catch(() => {});
    await home(); await newThing('glue'); await plus(); await pickWhere('Linen closet'); await plus();
    await page.evaluate(() => { const pp = window.__rig.dump().find((d) => d.kind === 'place' && d.name === 'Pantry shelf'); document.querySelectorAll('.lc-chip.box').forEach((c) => { c.querySelector('span:last-child').textContent = 'Pantry shelf'; const im = c.querySelector('img'); if (im && pp && pp.photos[0]) im.src = pp.photos[0].thumb; c.classList.remove('box'); }); });
    await snap('Q4-B-places-only');

    // ---------- Q5: an ask for tier 2 while tier 3 is selected ----------
    await page.locator('.lc-x').first().click().catch(() => {}); await page.waitForTimeout(300); await tap('text=Throw away', { wait: 300 }).catch(() => {});
    await home(); await newThing('glue'); await plus(); await shoot('drawer.jpg', { name: 'Drawer 5', moves: false });
    await plus(); WHERE.push({ name: 'Filing cabinet', moves: true, sure: false }); await cam('closet.jpg'); await tap('.lc-shutter', { wait: 150 });
    await plus(); await shoot('real_desk.jpg', { name: 'Study', moves: false });
    await snap('Q5-0-now');
    const t2 = await page.evaluate(() => { const i = document.querySelectorAll('.lv-sq img')[2]; return i ? i.src : ''; });
    await page.evaluate(() => { const b = document.querySelector('.lc-ask b'); window.__askHTML = b ? b.innerHTML : ''; });
    await page.evaluate((src) => { const b = document.querySelector('.lc-ask b'); if (b) b.innerHTML = `<img src="${src}" style="width:34px;height:34px;border-radius:8px;border:2.5px solid #6BB6FF;object-fit:cover"><span>Is this your filing cabinet?</span>`; }, t2);
    await snap('Q5-A-ask-shows-its-square');
    await page.evaluate(() => { const b = document.querySelector('.lc-ask b'); if (b) b.innerHTML = window.__askHTML; });
    await page.locator('.lv-sq').nth(2).click(); await page.waitForTimeout(500);
    const pv = await page.locator('.sheet-back, .lc-pv').count(); if (pv) { await page.mouse.click(195, 60); await page.waitForTimeout(400); }
    await snap('Q5-B-jump-to-tier2');
  }

  await seedHouse();
  try { await runSuite(look); } catch (e) { console.error('FATAL', e); await page.screenshot({ path: `${OUT}/FATAL.png` }); }
  await browser.close();
}

(async () => {
  await new Promise((r) => server.listen(PORT, r));
  await runLook('b');
  console.log('Page errors:', errors.length ? errors : 'none');
  server.close();
})();
