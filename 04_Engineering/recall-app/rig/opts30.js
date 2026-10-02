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

  // 09-30 mockups for Ravi: options drawn ON the real screens (real data, real styles); only the block in question is added.
  async function runSuite() {
    const O = require('./oracle.js')({ page, PORT, tap });
    const OUT = path.join(__dirname, 'shots_o30'); fs.mkdirSync(OUT, { recursive: true });
    const snap = async (f) => { await page.waitForTimeout(350); await page.screenshot({ path: path.join(OUT, f) }); };
    const inject = (fn, arg) => page.evaluate(fn, arg);
    const choose = async (name) => { if (!(await page.locator('.where-list').count())) await tap('.lc-choose', { wait: 450 }); await page.fill('.wl-search input', name); await page.waitForTimeout(200); await page.locator(`.where-list .wl-row:not(.wl-sugg):has-text("${name}")`).first().click(); await page.waitForTimeout(450); };
    await seedHouse(); await page.evaluate(() => window.__rig.rules(true));
    // ---- #2 after a Move
    await O.openItem('spare batteries'); await tap('button:has-text("Move it")', { wait: 900 }); await choose('Craft nook'); await tap('.lc-k.sv', { wait: 900 });
    await page.evaluate(() => window.scrollTo(0, 0)); await snap('A-today.png');
    await inject(() => { const c = document.querySelector('.saved-card'); if (c) { const x = document.createElement('button'); x.textContent = '✕'; x.style.cssText = 'position:absolute;right:10px;top:8px;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.16);color:#fff;font-size:18px;font-weight:800'; c.appendChild(x); const u = c.querySelector('.u'); if (u) u.style.right = '60px'; } });
    await snap('B-card-with-x.png');
    await inject(() => { const c = document.querySelector('.saved-card'); if (c) c.remove();
      const wh = document.querySelector('.tp-wh'); const n = document.createElement('div');
      n.innerHTML = '<div style="display:flex;align-items:center;gap:.5rem"><span style="flex:1;color:#2F8F6B;font-weight:800">✓ Moved just now</span><button aria-label="Close" style="width:36px;height:36px;border-radius:50%;background:transparent;color:var(--ink-soft);font-size:17px;font-weight:800">✕</button></div>'
        + '<div style="display:flex;align-items:center;gap:.5rem"><span style="flex:1;color:var(--ink-soft);font-size:.9375rem">It was on the Kitchen counter.</span><button style="min-height:40px;padding:0 1rem;border-radius:999px;background:var(--accent-soft);color:var(--accent);font-weight:800">Undo</button></div>';
      n.style.cssText = 'margin:.625rem 0 .25rem;padding:.35rem .35rem .45rem .75rem;border-radius:14px;background:rgba(47,143,107,.10);border:1.5px solid rgba(47,143,107,.35)';
      wh.parentNode.insertBefore(n, wh.nextSibling); });
    await snap('C-inline-note.png');
    // ---- #3 removing a place with items
    await seedHouse(); await home(); await tap('.menu-btn', { wait: 400 }); await tap('.drawer-row:has-text("Places")', { wait: 700 }); await tap('.loc-row:has-text("Craft nook")', { wait: 700 });
    const rows = await page.evaluate(() => [...document.querySelectorAll('.things-here .thing-mini img')].map((i) => ({ src: i.src, name: i.alt })));
    await snap('D0-place-page-today.png');
    await inject((rows) => { const b = document.createElement('div'); b.className = 'sheet-back';
      const li = rows.map((r) => `<div class="wl-row" style="min-height:3.25rem"><img src="${r.src}" alt=""><span class="tx"><b>${r.name.charAt(0).toUpperCase() + r.name.slice(1)}</b><small>in Craft nook</small></span></div>`).join('');
      b.innerHTML = `<div class="sheet"><div class="sheet-title">Craft nook still has ${rows.length} items</div><p class="sheet-body">Move them first — then the place can go.</p><div style="margin:.5rem 0">${li}</div>
        <button class="btn-primary" style="margin-top:.5rem">Move all ${rows.length} to one place…</button><button class="btn-secondary" style="margin-top:.5rem">Go through them one by one</button><button class="btn-quiet" style="margin-top:.25rem">Keep the place</button></div>`;
      document.body.appendChild(b); }, rows);
    await snap('D-your-idea-sheet.png');
    await inject((rows) => { document.querySelectorAll('.sheet-back').forEach((x) => x.remove());
      const th = document.querySelector('.things-here'); const lab = [...document.querySelectorAll('.field-label')].find((x) => /Items here/.test(x.innerText));
      lab.innerHTML = `Items here now · ${rows.length} <button style="float:right;min-height:36px;padding:0 .8rem;border-radius:999px;background:var(--accent-soft);color:var(--accent);font-weight:800;font-size:.85rem;letter-spacing:0;text-transform:none">Move all to…</button>`;
      th.outerHTML = '<div>' + rows.map((r) => `<div class="wl-row" style="min-height:3.25rem"><img src="${r.src}" alt=""><span class="tx"><b>${r.name.charAt(0).toUpperCase() + r.name.slice(1)}</b><small>in Craft nook</small></span><button style="flex:none;min-height:40px;padding:0 .9rem;border-radius:999px;border:1.5px solid var(--accent);color:var(--accent);background:transparent;font-weight:800">Move</button></div>`).join('') + '</div>';
      const rm = [...document.querySelectorAll('button')].find((x) => /Remove this place/.test(x.innerText)); rm.disabled = true; rm.style.opacity = '.45';
      const note = document.createElement('p'); note.className = 'note-quiet left'; note.textContent = `Move the ${rows.length} items first — then the place can go.`; rm.parentNode.insertBefore(note, rm.nextSibling); }, rows);
    await page.evaluate(() => { const f = [...document.querySelectorAll('.field-label')].find((x) => /Items here/.test(x.innerText)); f.scrollIntoView({ block: 'start' }); window.scrollBy(0, -120); });
    await snap('E-place-page-is-the-list.png');
    // ---- #4 rename to a name you have
    await seedHouse(); await home(); await tap('.menu-btn', { wait: 400 }); await tap('.drawer-row:has-text("Places")', { wait: 700 }); await tap('.loc-row:has-text("Kitchen counter")', { wait: 700 });
    const pics = await page.evaluate(() => { const d = window.__rig.dump(); const p = (n) => ((d.find((x) => x.kind === 'place' && x.name === n) || {}).photos || [])[0]; return { a: (p('Kitchen counter') || {}).thumb, b: (p('Pantry shelf') || {}).thumb }; });
    const merge = (same) => inject(({ pics, same }) => { document.querySelectorAll('.sheet-back').forEach((x) => x.remove()); const b = document.createElement('div'); b.className = 'sheet-back';
      const im = (src, n) => `<div style="flex:1;text-align:center"><img src="${src}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:14px"><div style="font-weight:700;margin-top:.3rem">${n}</div><small style="color:var(--ink-soft)">${n === 'Kitchen counter' ? '1 photo · 1 item' : '1 photo · 0 items'}</small></div>`;
      b.innerHTML = `<div class="sheet"><div class="sheet-title">You already have the Pantry shelf</div>
        <div style="display:flex;gap:.75rem;margin:.75rem 0">${im(pics.a, 'Kitchen counter')}${im(same ? pics.a : pics.b, 'Pantry shelf')}</div>
        ${same ? '<p class="sheet-body">ReCall thinks these are <b>the same place</b>. Merge them: one Pantry shelf, with the Kitchen counter’s item and both photos.</p><button class="btn-primary" style="margin-top:.5rem">Merge into the Pantry shelf</button>'
          : '<p class="sheet-body" style="color:var(--amber)"><b>These look like different places.</b> Mixed photos make it harder for ReCall to recognise the place from a photo.</p><button class="btn-primary" style="margin-top:.5rem">Merge · keep the shelf’s photos</button><button class="btn-secondary" style="margin-top:.5rem">Merge · keep all photos</button>'}
        <button class="btn-secondary" style="margin-top:.5rem">Give it its own name</button></div>`; document.body.appendChild(b); }, { pics, same });
    await merge(true); await snap('G-merge-same.png');
    await merge(false); await snap('H-merge-different.png');
  }
  await seedHouse();
  try { await runSuite(); } catch (e) { console.error('FATAL', e); }
  await browser.close();
}
(async () => { await new Promise((r) => server.listen(PORT, r)); await runLook('b'); server.close(); })();
