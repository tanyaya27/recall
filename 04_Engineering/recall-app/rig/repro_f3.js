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
const PORT = 8299; const ROOT = path.join(__dirname, 'out');
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, req.url.split('?')[0] === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
const img = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(__dirname, 'mock/img', f)).toString('base64');
const OUTDIR = path.join(__dirname, 'shots_verify'); fs.mkdirSync(OUTDIR, { recursive: true });

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
      E('em', 'm', { t: 'place', name: 'Crawl space' }, 90 * H), E('ew', 'w', box2('m', 'memorabilia box'), 80 * H),
      E('ey', 'y', box2('m', 'memorabilia box'), 79 * H), E('ec', 'c', box2('w', 'wooden box'), 70 * H),
    ];
    function box2(id, name) { return { t: 'thing', id, name }; }
    await page.evaluate((s) => window.__rig.seed(s), seed);
    await page.evaluate((s) => window.__rig.seed(s, 'recall_users'), [{ id: 'margaret', name: 'Margaret' }, { id: 'robert', name: 'Robert' }]);
    await page.waitForTimeout(400);
  }

  // =================================================================================================
  async function runSuite(look) {
    const L = look.toUpperCase(); await setPrefs({ cameraLook: look });
    const shot = makeShot(look);
    const camState = () => page.evaluate(() => ({ open: !!document.querySelector('.lc'), askText: (document.querySelector('.lc-ask') || {}).innerText || '', saveTxt: (document.querySelector('.lc-k.sv') || {}).innerText || '', saveDis: (document.querySelector('.lc-k.sv') || {}).disabled ?? null, say: (document.querySelector('.lc-say .tx') || {}).innerText || '', chips: [...document.querySelectorAll('.lc-chip span:last-child')].map((x) => x.innerText) }));
    const scenario = async (tag, thing, where, target) => {
      await seedHouse(); AI = { name: thing }; WHERE = [where]; SAME = { index: -1, sure: false };
      await home(); await cam('real_slippers.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
      await tap('.lv-sq.plus', { wait: 300 }); await cam('closet.jpg'); await tap('.lc-shutter', { wait: 2000 });
      let st = await camState(); await shot(tag, 'after the where shot: ask state');
      check(tag, 'the "Your ...?" ask appeared', new RegExp(target, 'i').test(st.askText), JSON.stringify(st).slice(0, 200), '');
      if (/Your/.test(st.askText)) { await tap('.lc-ask button:has-text("Yes")', { wait: 600 }); }
      st = await camState(); await shot(tag, 'after Yes');
      check(tag, 'after Yes the chips no longer offer the confirmed identity', !st.chips.some((c) => new RegExp(target.slice(0, 6), 'i').test(c)), 'chips=' + JSON.stringify(st.chips), '');
      check(tag, 'after Yes, Save is enabled', st.saveDis === false, JSON.stringify(st).slice(0, 200), '');
      await tap('.lc-k.sv', { wait: 2500 });
      st = await camState(); await shot(tag, 'after Save');
      check(tag, 'Save CLOSES the camera', st.open === false, 'still open: ' + JSON.stringify(st).slice(0, 260), '');
      const it = await byName(thing);
      check(tag, 'the thing was written with the right dest', !!it && new RegExp(target, 'i').test(it.location || ''), it ? 'loc=' + it.location : 'ITEM NOT WRITTEN', '');
      if (st.open) { await tap('.lc-k.sv', { wait: 1500 }); const st2 = await camState(); check(tag, 'second Save tap outcome', st2.open === false, JSON.stringify(st2).slice(0, 200), ''); await page.evaluate(() => { const x = document.querySelector('.lc-x'); if (x) x.click(); }); await page.waitForTimeout(300); await tap('text=Throw away', { wait: 300 }).catch(() => {}); }
    };
    // A: VISUAL sure-match to candidate 0 (a place with photos) — the phone's most likely path.
    await scenario(`${L}-A-visual-place`, 'lint roller', { name: 'Kitchen counter', moves: false, known: 'Kitchen counter', sure: true }, 'Kitchen counter');
    // B: VISUAL sure-match to a container.
    await scenario(`${L}-B-visual-box`, 'diary', { name: 'tin box', moves: true, known: 'tin box', sure: true }, 'tin box');
    // C: byName collision with a place (verify covered this; keep as control).
    await scenario(`${L}-C-byname-place`, 'gift card', { name: 'Kitchen counter', moves: false, sure: false }, 'Kitchen counter');
    // D: byName collision with a container.
    await scenario(`${L}-D-byname-box`, 'marble', { name: 'tin box', moves: true, sure: false }, 'tin box');

    // ---------- 09-28 phone list, bugs B1–B4 ----------
    // B1: shoot a where, THEN tap a place pill — the photo must stay and land on that place at save.
    {
      const T = `${L}-B1-pick-after-shot`;
      await seedHouse(); AI = { name: 'lint brush' }; WHERE = [{ name: 'white box', moves: false, sure: false }]; SAME = { index: -1, sure: false };
      await home(); await cam('real_slippers.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
      await tap('.lv-sq.plus', { wait: 300 }); await cam('closet.jpg'); await tap('.lc-shutter', { wait: 2000 });
      const kcBefore = await placeByName('Kitchen counter');
      await tap('.lc-chips .lc-chip:not(.more):has-text("Kitchen")', { wait: 500 });
      const st = await camState(); const b1 = await shot(T, 'pill tapped after the where photo');
      const badge = await page.locator('.lv-tile').nth(1).locator('.lv-n').innerText().catch(() => '1');
      check(T, 'the pill set the tier to Kitchen counter', /kitchen counter/i.test(st.say), st.say, b1);
      check(T, 'the where photo is still on the tier (square shows a photo, not a pin)', await page.locator('.lv-tile').nth(1).locator('img').count() > 0, 'badge=' + badge, '');
      await tap('.lc-k.sv', { wait: 2500 });
      const kcAfter = await placeByName('Kitchen counter');
      check(T, 'after Save the photo is ON the Kitchen counter place (+1)', (kcAfter.photos || []).length === (kcBefore.photos || []).length + 1, `before=${(kcBefore.photos || []).length} after=${(kcAfter.photos || []).length}`, '');
      check(T, 'no stray place called "white box" was made', !(await placeByName('white box')), '', '');
    }
    // B2: the caption follows the cover. Log a thing whose photo says "white wall", add a 2nd photo, remove the 1st.
    {
      const T = `${L}-B2-caption`;
      await seedHouse(); AI = { name: 'lint brush', restingOn: 'white wall' }; WHERE = []; SAME = { index: -1, sure: false };
      await home(); await cam('real_slippers.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1500 });
      await tap('.lc-k.sv', { wait: 2500 });
      const it = await byName('lint brush');
      await home();
      await tap(`.tile:has-text("Lint brush")`, { wait: 700 });
      const cap1 = await text('.seen-line');
      check(T, 'first photo shows its caption', /white wall/i.test(cap1), cap1, await shot(T, 'caption on the first photo'));
      // add a second photo through the page's own "Add a photo" camera
      SAME = { same: true, index: 0, sure: true };
      await tap('.tp-row:has-text("Add a photo")', { wait: 600 });
      await cam('closet.jpg');
      const busySeen = await page.waitForSelector('.camera', { timeout: 3000 }).then(async () => { await page.waitForTimeout(400); await page.click('.shutter'); await page.waitForTimeout(250); await page.click('.camera-done'); return page.waitForSelector('.toast.busy', { timeout: 1500 }).then(() => true).catch(() => false); }).catch(() => false);
      check(`${L}-B4-busy`, 'adding a photo shows a working toast with a spinner at once', busySeen, '', await shot(`${L}-B4`, 'working toast while the photo is added'));
      await page.waitForTimeout(2200);
      const doneTxt = await text('.toast');
      check(`${L}-B4-busy`, 'the working toast is replaced by the result', !/Adding|Checking/.test(doneTxt), 'toast="' + doneTxt + '"', '');
      // remove the FIRST (cover) photo
      const cover = (await byName('lint brush')).photo;
      const hit = await page.evaluate((c) => { const imgs = [...document.querySelectorAll('.strip img, .photo img, img')]; const im = imgs.find((x) => x.src === c); if (!im) return 'no-cover-img'; let el = im; while (el && !el.querySelector('.photo-trash')) el = el.parentElement; const b = el && el.querySelector('.photo-trash'); if (!b) return 'no-trash'; b.scrollIntoView(); b.click(); return 'ok'; }, cover);
      await page.waitForTimeout(500); await tap('.sheet button:has-text("Remove")', { wait: 1200 });
      const after = await byName('lint brush');
      check(T, 'the COVER photo was the one removed', hit === 'ok' && after.photo !== cover, 'hit=' + hit, '');
      const cap2 = await text('.seen-line');
      check(T, 'after the cover is removed, "In the photo: white wall" is gone', !/white wall/i.test(cap2), 'caption="' + cap2 + '"', await shot(T, 'caption after removing the first photo'));
    }
    // B3: the rename sheet's title does not touch the text box.
    {
      const T = `${L}-B3-sheet-gap`;
      await tap('.tp-row:has-text("Rename")', { wait: 500 });
      const gap = await page.evaluate(() => { const t = document.querySelector('.sheet .sheet-title'); const i = document.querySelector('.sheet input, .sheet .place-input'); if (!t || !i) return -1; return i.getBoundingClientRect().top - t.getBoundingClientRect().bottom; });
      check(T, 'at least 10 px between "What is it?" and the text box', gap >= 10, 'gap=' + Math.round(gap), await shot(T, 'rename sheet spacing'));
      await tap('.sheet .btn-quiet, .sheet button:has-text("Cancel")', { wait: 300 }).catch(() => {});
    }
    // ---------- 09-29 phone: Ravi's move got stuck (rules refused the place update) ----------
    // Move a thing → tap a place pill → take 2 photos on that tier → Save, with the REAL permission rules on.
    {
      const T = `${L}-G-move-photos-rules`;
      await seedHouse(); AI = { name: 'x' }; WHERE = []; SAME = { index: -1, sure: false };
      await home(); await page.evaluate(() => window.__rig.rules(true));
      await tap('.tile:has-text("Spare batteries")', { wait: 700 });
      await tap('button:has-text("Move it")', { wait: 900 });
      const pills = await page.locator('.lc-chip:not(.more)').allInnerTexts().catch(() => []);
      check(T, 'the current place (Kitchen counter) is NOT offered as a pill', !pills.some((x) => /kitchen/i.test(x)), 'pills=' + JSON.stringify(pills), await shot(T, 'move: pills without the current place'));
      await tap('.lc-chip.more', { wait: 600 });
      const cur = await page.locator('.wl-row:has(.wl-cur)').allInnerTexts().catch(() => []);
      check(T, 'the ••• list marks Kitchen counter "Current place"', cur.length === 1 && /kitchen counter/i.test(cur[0]), JSON.stringify(cur), await shot(T, '••• list with Current place'));
      await tap('.sheet .btn-quiet, .sheet button:has-text("Cancel")', { wait: 400 });
      const pick = (pills[0] || '').split('\n')[0].replace(/…$/, '');
      await tap('.lc-chip:not(.more):has-text("Craft nook")', { wait: 500 });
      const placeName = 'Craft nook';
      const before = (await placeByName(placeName)) || { photos: [] };
      await cam('real_desk.jpg'); await tap('.lc-shutter', { wait: 1200 });
      await cam('closet.jpg'); await tap('.lc-shutter', { wait: 1200 });
      await shot(T, 'two photos on the picked place');
      await tap('.lc-k.sv', { wait: 3000 });
      const st = await camState();
      const err = await text('.lc-err').catch(() => '');
      check(T, 'Save CLOSES the camera (the phone stuck here)', st.open === false, 'open=' + st.open + ' err="' + err + '"', await shot(T, 'after Save'));
      const it = await byName('spare batteries');
      check(T, 'the thing moved to the picked place', !!it && (it.location || '').toLowerCase() === placeName.toLowerCase(), 'loc=' + (it && it.location) + ' picked=' + placeName, '');
      const after = await placeByName(placeName);
      check(T, 'the 2 photos are on that place', !!after && (after.photos || []).length === Math.min(6, (before.photos || []).length + 2), `before=${(before.photos || []).length} after=${after && (after.photos || []).length}`, '');
      await page.evaluate(() => window.__rig.rules(false));
    }
    // ---------- 09-29 Ravi: Move it opens on the CURRENT place ----------
    {
      const T = `${L}-H-move-current`;
      await seedHouse(); AI = { name: 'x' }; WHERE = [{ name: 'window sill', moves: false, sure: false }]; SAME = { index: -1, sure: false };
      await home(); await page.evaluate(() => window.__rig.rules(true));
      const b0 = await byName('spare batteries');
      await tap('.tile:has-text("Spare batteries")', { wait: 700 }); await tap('button:has-text("Move it")', { wait: 900 });
      const say0 = await text('.lc-say .tx'); const sq1img = await page.locator('.lv-tile').nth(1).locator('img').count();
      const pills0 = await page.locator('.lc-chip:not(.more)').allInnerTexts().catch(() => []);
      const q = await page.locator('.lc-prompt b .q').count();
      const s1 = await shot(T, 'Move it: opens on the current place');
      // 09-29b (Ravi, "the location icon is not in line with the text"): measured on the PIXELS, not the boxes — the pin's
      // ink centre vs the white text's ink centre on line 1, at normal and large text. And the step prompt sits in the card,
      // directly above the squares, not at the top of the picture.
      for (const sc of ['1', '1.38']) {
        await page.evaluate((v) => document.documentElement.style.setProperty('--scale', v), sc); await page.waitForTimeout(250);
        const pinY = await inkMid('.lc-say .lc-pin svg', 'amber'); const txtY = await inkMid('.lc-say .l1 > b', 'white');
        check(T, `pin centred on the text line (scale ${sc})`, pinY != null && txtY != null && Math.abs(pinY - txtY) <= 1, `pin ${pinY} text ${txtY}`, '');
      }
      await page.evaluate(() => document.documentElement.style.setProperty('--scale', '1')); await page.waitForTimeout(200);
      const pr = await page.evaluate(() => { const r = (q) => { const e = document.querySelector(q); return e ? e.getBoundingClientRect() : null; };
        const p = r('.lc-card > .lc-prompt'), st = r('.lc-card .lv-strip'); return { top: !!document.querySelector('.lc-view > .lc-prompt'), inCard: !!p, gap: p && st ? Math.round(st.top - p.bottom) : null }; });
      check(T, 'the step prompt is in the card, just above the squares (not at the top)', !pr.top && pr.inCard && pr.gap >= 0 && pr.gap <= 12, JSON.stringify(pr), '');
      check(T, 'opens with "Current place: Kitchen counter" (not "No place yet")', /current place:\s*kitchen counter/i.test(say0), say0, s1);
      check(T, 'level 1 shows the current place\'s photo', sq1img > 0, '', '');
      check(T, 'the current place is not among the pills', !pills0.some((x) => /kitchen/i.test(x)), JSON.stringify(pills0), '');
      check(T, 'the prompt\'s question words are styled apart from the name', q === 1, 'q=' + q, '');
      await tap('.lc-k.sv', { wait: 1500 });
      const b1 = await byName('spare batteries'); const st1 = await camState();
      check(T, 'Save with nothing changed closes and writes nothing', st1.open === false && b1.location === b0.location && b1.lastSeenAt === b0.lastSeenAt, `open=${st1.open} loc=${b1.location}`, '');
      // pick a new place, then back to the current, then the new again and save
      await tap('button:has-text("Move it")', { wait: 900 });
      await tap('.lc-chip:not(.more):has-text("Craft nook")', { wait: 500 });
      const say2 = await text('.lc-say .tx'); const pills2 = await page.locator('.lc-chip:not(.more)').allInnerTexts().catch(() => []);
      const s2 = await shot(T, 'picked a new place: label + current place is the first pill');
      check(T, 'after picking: "New place: Craft nook"', /new place:\s*craft nook/i.test(say2), say2, s2);
      check(T, 'the current place is now the FIRST pill', /kitchen/i.test(pills2[0] || ''), JSON.stringify(pills2), '');
      await tap('.lc-chip:not(.more):has-text("Kitchen")', { wait: 500 });
      const say3 = await text('.lc-say .tx');
      check(T, 'tapping it goes back to "Current place: Kitchen counter"', /current place:\s*kitchen counter/i.test(say3), say3, await shot(T, 'back to the current place'));
      await tap('.lc-chip:not(.more):has-text("Craft nook")', { wait: 500 }); await tap('.lc-k.sv', { wait: 2500 });
      const b2 = await byName('spare batteries');
      check(T, 'saving the new place moves it', (b2.location || '').toLowerCase() === 'craft nook', 'loc=' + b2.location, '');
      // photographing on the current-place level makes a NEW place (doesn't attach to the current one)
      await tap('button:has-text("Move it")', { wait: 900 });
      await cam('real_painting.jpg'); await tap('.lc-shutter', { wait: 2200 });
      const say4 = await text('.lc-say .tx');
      check(T, 'a photo on the current place starts a new place ("New place: Window sill")', /new place:\s*window sill/i.test(say4), say4, await shot(T, 'photographed a new place'));
      const cnBefore = (await placeByName('Craft nook')).photos.length;
      await tap('.lc-k.sv', { wait: 2500 });
      const b3 = await byName('spare batteries'); const cnAfter = (await placeByName('Craft nook')).photos.length;
      check(T, 'moved to the new place; the old place gained no photo', /window sill/i.test(b3.location || '') && cnAfter === cnBefore, `loc=${b3.location} craft ${cnBefore}->${cnAfter}`, '');
      await page.evaluate(() => window.__rig.rules(false));
    }
    // E: the menu's build stamp (Ravi 09-28) - the deploy stamp must be readable by a person.
    await home(); await tap('.menu-btn', { wait: 400 });
    const bld = await text('.drawer-build');
    check(`${L}-E-build-stamp`, 'the menu drawer shows "Build <stamp>"', /Build .+/.test(bld), 'got: "' + bld + '"', await shot(`${L}-E`, 'menu with the build stamp'));
  }

  await seedHouse();
  try {
    await runSuite(look);
  } catch (e) {
    check('FATAL', `look ${look}: suite aborted by an exception`, false, e.message, await page.screenshot({ path: `${OUTDIR}/v-FATAL-${look}.png` }).then(() => `v-FATAL-${look}.png`).catch(() => ''));
    console.error(`\n!! look ${look} suite aborted:`, e);
  }
  await browser.close();
}

(async () => {
  await new Promise((r) => server.listen(PORT, r));
  await runLook('b');

  // ---- write the report ----
  const byReq = {};
  results.forEach((r) => { (byReq[r.req] = byReq[r.req] || []).push(r); });
  const lines = [`# VERIFY_F2 results`, `console errors: ${Array.from(new Set(consoleErrors)).length}`, `page errors: ${errors.length}`, ''];
  Object.keys(byReq).forEach((req) => {
    const rs = byReq[req]; const pass = rs.filter((r) => r.ok).length;
    lines.push(`## ${req}: ${pass}/${rs.length}`);
    rs.forEach((r) => lines.push(`- [${r.ok ? 'PASS' : 'FAIL'}] ${r.name}${r.note ? ' — ' + r.note : ''}${r.shot ? ' (' + r.shot + ')' : ''}`));
    lines.push('');
  });
  fs.writeFileSync(path.join(__dirname, 'REPRO_RESULTS.md'), lines.join('\n'));
  const totalPass = results.filter((r) => r.ok).length;
  console.log(`\n${totalPass}/${results.length} checks passed`);
  console.log('Page errors:', errors.length ? errors : 'none');
  console.log('Console errors (unique):', Array.from(new Set(consoleErrors)).length, consoleErrors.length ? Array.from(new Set(consoleErrors)).slice(0, 10) : '');
  server.close();
})();
