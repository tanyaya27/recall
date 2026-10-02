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

  // 10-01 release 1 "Words, and one pick" (Tanya; DECISIONS 2026-10-01; MOCK_2026-10-01_release1-words-and-one-pick.jpg).
  // Drives the real camera, the In list, the item page, Home, Find and a place's page; reads the store after every save.
  async function runSuite() {
    const OUT = path.join(__dirname, 'shots_r1'); fs.mkdirSync(OUT, { recursive: true });
    const snap = async (f) => { await page.waitForTimeout(300); await page.screenshot({ path: path.join(OUT, f) }); };
    const noAuto = () => page.evaluate(() => { window.__noAuto = true; });
    const openThing = async (nm) => { await home(); await noAuto(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', nm); await page.waitForTimeout(400); await page.click('.ask .tile >> nth=0'); await page.waitForSelector('.card.thing'); await page.waitForTimeout(400); };
    const log = async (file, name) => { await home(); await noAuto(); AI = { name }; await tap(LOG, { wait: 800 }); await cam(file); await tap('.lc-shutter', { wait: 900 }); };
    const save = async () => { await tap('.lc-k.sv', { wait: 1200 }); };
    const leave = async () => { if (await count('.lc')) { await tap('.lc-x', { wait: 300 }); for (const t of ['Throw away', 'Leave']) if (await page.locator(`text=${t}`).count()) await tap(`text=${t}`, { wait: 300 }); } };
    const edgeOf = async (id) => (await dump()).find((d) => d.kind === 'edge' && d.from === id && !d.until) || null;
    const lastW = (it) => { const h = (it && it.history) || []; for (let i = h.length - 1; i >= 0; i--) if (h[i].w) return h[i]; return null; };
    lastPool = null;

    // ---- Home: photo + name only ----
    await home(); await noAuto();
    const sub = await count('.board .tile .tile-sub');
    check('H1', 'Home tiles show the photo and the name only — no where line, no "No place yet"', sub === 0, String(sub));
    await snap('r-H1.png');

    // ---- Log: words only ----
    await log('glasses.jpg', 'reading glasses case');
    const ui = await page.evaluate(() => ({ words: !!document.querySelector('.w1-words input'), inChip: !!document.querySelector('.w1-in'), strip: !!document.querySelector('.lv-strip'), choose: !!document.querySelector('.lc-choose'), plus: !!document.querySelector('.lc-plus-out') }));
    check('C1', 'after the first photo: a words field and "What is it in?" — no tier squares, no +, no Choose place', ui.words && ui.inChip && !ui.strip && !ui.choose && !ui.plus, JSON.stringify(ui));
    await snap('r-C1.png');
    await cam('glasses.jpg'); await tap('.lc-shutter', { wait: 700 });
    const n2 = await page.evaluate(() => ({ n: (document.querySelector('.lc-thing .lv-n') || {}).innerText || '', sheet: !!document.querySelector('.sheet') }));
    check('C2', 'a second photo is another photo of the item — no question', n2.n === '2' && !n2.sheet, JSON.stringify(n2));
    await page.fill('.w1-words input', 'on the dryer shelf behind the detergent');
    await save();
    let it = await byName('reading glasses case');
    const w = lastW(it);
    check('C3', 'words only: saved as she said them, no link, not "Not put away"', !!it && !it.location && !(await edgeOf(it.id)) && w && w.said === 'on the dryer shelf behind the detergent' && it.needsPlace === false && it.photoCount === 2, JSON.stringify({ loc: it && it.location, w, np: it && it.needsPlace, pc: it && it.photoCount }));
    const card1 = await text('.saved-card');
    check('C3b', 'the card after Save says her words', /dryer shelf/.test(card1), card1.slice(0, 120));

    // ---- Log: words → the In list helps ----
    await log('folder.jpg', 'blue folder');
    await page.fill('.w1-words input', 'in the blue folder in the desk drawer');
    await tap('.w1-in', { wait: 500 });
    const inl = await page.evaluate(() => { const L = document.querySelector('.in-list'); const rows = [...L.querySelectorAll('.wl-row.said')].map((r) => r.querySelector('b').innerText); const nw = [...L.querySelectorAll('.wl-new')].map((b) => b.innerText); const g = [...L.querySelectorAll('.wl-g')].map((x) => x.innerText); return { rows, nw, g, said: (L.querySelector('.wl-said') || {}).innerText || '' }; });
    check('C4', 'What is it in? — her words lead: "Desk drawer" (you said it), "New place: Blue folder"', inl.rows[0] === 'Desk drawer' && inl.nw.some((x) => /Blue folder/.test(x)) && /desk drawer/.test(inl.said), JSON.stringify(inl));
    await snap('r-C4.png');
    await tap('.in-list .wl-row.said', { wait: 400 });
    const chip = await text('.w1-in.set');
    check('C5', 'a pick sets the chip: "In: Desk drawer"', /In:\s*Desk drawer/.test(chip), chip);
    await save();
    it = await byName('blue folder'); let e = await edgeOf(it.id);
    check('C5b', 'saved: in the Desk drawer, and her words kept', it.location === 'Desk drawer' && e && e.to.t === 'place' && e.to.name === 'Desk drawer' && lastW(it) && /blue folder/.test(lastW(it).said), JSON.stringify({ loc: it.location, e: e && e.to, w: lastW(it) }));

    // ---- Log: a new place from her words ----
    await log('soda.jpg', 'spare keys');
    await page.fill('.w1-words input', 'in the tackle tray by the back door');
    await tap('.w1-in', { wait: 500 });
    const fresh = await page.evaluate(() => [...document.querySelectorAll('.in-list .wl-new')].map((b) => b.innerText));
    check('C6', 'names she said that are not places yet are offered as new places', fresh.some((x) => /Tackle tray/.test(x)) && fresh.some((x) => /Back door/.test(x)), JSON.stringify(fresh));
    await page.locator('.in-list .wl-new', { hasText: 'Tackle tray' }).first().click(); await page.waitForTimeout(400);
    const chipNew = await text('.w1-in.set');
    check('C6b', 'the chip says it is new', /Tackle tray/.test(chipNew) && /new/i.test(chipNew), chipNew);
    await save();
    it = await byName('spare keys'); const pl = await placeByName('Tackle tray'); e = await edgeOf(it.id);
    check('C6c', 'saved: a place "Tackle tray" made, the keys in it', !!pl && e && e.to.name === 'Tackle tray' && it.location === 'Tackle tray', JSON.stringify({ pl: !!pl, e: e && e.to }));
    // ✕ on the chip: nothing
    await log('wallet.jpg', 'coin purse'); await tap('.w1-in', { wait: 400 }); await tap('.in-list .wl-row >> nth=0', { wait: 300 }); await tap('.w1-in .x', { wait: 300 });
    const back = await page.evaluate(() => !!document.querySelector('button.w1-in') && !document.querySelector('.w1-in.set'));
    check('C7', '✕ takes the In off again (what you see is what is saved)', back, String(back));
    await save(); it = await byName('coin purse');
    check('C7b', 'saved with no place and no words → it is "Not put away"', it && !it.location && !(await edgeOf(it.id)) && it.needsPlace === true, JSON.stringify({ loc: it && it.location, np: it && it.needsPlace }));
    check('C8', 'nothing asked the AI where a photo is (no place matching on the camera)', lastPool === null, String(lastPool));

    // ---- Move it: a boxed item ----
    await openThing('baseball card'); await cam('smallbox.jpg'); await tap('button:has-text("Move it")', { wait: 900 });
    const mv = await page.evaluate(() => ({ chip: (document.querySelector('.w1-in.set') || {}).innerText || '', save: document.querySelector('.lc-k.sv').disabled }));
    check('M1', 'Move it on a boxed item: "In: Wooden box" already set, with what that is in; Save off until a change', /In:\s*Wooden box/.test(mv.chip) && /Memorabilia box/.test(mv.chip) && mv.save, JSON.stringify(mv));
    await snap('r-M1.png');
    await page.fill('.w1-words input', 'top tray, in the plastic sleeve');
    const on = await page.evaluate(() => !document.querySelector('.lc-k.sv').disabled);
    check('M2', 'words alone turn Save on', on, String(on));
    await save();
    it = await byName('baseball card'); e = await edgeOf(it.id);
    check('M2b', 'words only on a Move: still in the wooden box, her words saved', e && e.to.t === 'thing' && e.to.id === 'w' && /plastic sleeve/.test((lastW(it) || {}).said || ''), JSON.stringify({ e: e && e.to, w: lastW(it) }));
    const page1 = await page.evaluate(() => ({ said: (document.querySelector('.tp-said q') || {}).innerText || '', chain: (document.querySelector('.tp-chain') || {}).innerText || '' }));
    check('P2', 'the item page: the chain, then her words', /Wooden box/.test(page1.chain) && /plastic sleeve/.test(page1.said), JSON.stringify(page1));
    await snap('r-P2.png');
    // move it out to the Kitchen counter, then Undo
    await tap('button:has-text("Move it")', { wait: 900 }); await tap('.w1-in-open', { wait: 500 });
    await page.fill('.in-list .wl-search input', 'kitchen'); await page.waitForTimeout(300); await tap('.in-list .wl-row >> nth=0', { wait: 400 });
    await save();
    it = await byName('baseball card'); e = await edgeOf(it.id);
    const w3 = lastW(it);
    check('M3', 'Move to the Kitchen counter: out of the wooden box; the old words go with the old place', e && e.to.t === 'place' && e.to.name === 'Kitchen counter' && w3 && w3.said === '', JSON.stringify({ e: e && e.to, w: w3 }));
    const note = await text('.tp-moved');
    check('M3b', 'the page says it moved, with Undo', /Moved just now/.test(note) && /Undo/.test(note), note.slice(0, 120));
    await tap('.tp-moved .u', { wait: 1200 });
    it = await byName('baseball card'); e = await edgeOf(it.id);
    check('M4', 'Undo: back in the wooden box, and her words are back', e && e.to.t === 'thing' && e.to.id === 'w' && /plastic sleeve/.test((lastW(it) || {}).said || ''), JSON.stringify({ e: e && e.to, w: lastW(it) }));
    // ✕ the In on a Move
    await tap('button:has-text("Move it")', { wait: 900 }); await tap('.w1-in .x', { wait: 300 }); await save();
    it = await byName('baseball card'); e = await edgeOf(it.id);
    check('M5', '✕ on a Move takes it out of the box (no link, no place)', !e && !it.location, JSON.stringify({ e, loc: it.location }));
    await page.waitForTimeout(300);
    if (await count('.tp-moved .u')) await tap('.tp-moved .u', { wait: 1200 });
    // a box moves from its own page; what's in it follows
    await openThing('memorabilia box'); await tap('button:has-text("Move it")', { wait: 900 }); await tap('.w1-in-open', { wait: 500 });
    await page.fill('.in-list .wl-search input', 'garage shelf'); await page.waitForTimeout(300); await tap('.in-list .wl-row >> nth=0', { wait: 400 }); await save();
    await openThing('baseball card');
    const ch2 = await text('.tp-chain');
    check('M6', 'moving the memorabilia box (its own Move it) — the card inside follows: Wooden box in Memorabilia box in Garage shelf', /Wooden box/.test(ch2) && /Memorabilia box/.test(ch2) && /Garage shelf/.test(ch2), ch2);

    // ---- the item page: words only, then Put it in ----
    await openThing('reading glasses case');
    const p1 = await page.evaluate(() => ({ q: (document.querySelector('.tp-said q') || {}).innerText || '', by: (document.querySelector('.tp-said small') || {}).innerText || '', put: !!document.querySelector('.tp-put') }));
    check('P1', 'words-only item page: her words, "You said · when", and "Put it in a place or a box"', /dryer shelf/.test(p1.q) && /You said/.test(p1.by) && p1.put, JSON.stringify(p1));
    await snap('r-P1.png');
    await tap('.tp-put', { wait: 500 });
    await page.fill('.in-list .wl-search input', 'linen'); await page.waitForTimeout(300); await tap('.in-list .wl-row >> nth=0', { wait: 1200 });
    it = await byName('reading glasses case'); e = await edgeOf(it.id);
    check('P3', 'Put it in → in the Linen closet, and her words kept', e && e.to.name === 'Linen closet' && /dryer shelf/.test((lastW(it) || {}).said || ''), JSON.stringify({ e: e && e.to, w: lastW(it) }));

    // ---- Find ----
    await home(); await noAuto(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', 'detergent'); await page.waitForTimeout(500);
    const f1 = await page.evaluate(() => [...document.querySelectorAll('.ask .tile')].map((t) => t.innerText));
    check('F1', 'Find: a word she said about where it is finds it', f1.some((x) => /Reading glasses case/i.test(x)), JSON.stringify(f1));
    await page.fill('#ask-input', 'tackle'); await page.waitForTimeout(400);
    const f2 = await page.evaluate(() => [...document.querySelectorAll('.ask .tile')].map((t) => t.innerText));
    check('F2', 'Find: the tile says where (the place)', f2.some((x) => /Spare keys/i.test(x) && /Tackle tray/i.test(x)), JSON.stringify(f2));

    // ---- Not put away ----
    await home(); await noAuto();
    const np = await text('.notput');
    const npN = Number((np.match(/(\d+)/) || [])[1] || 0);
    const npList = (await items()).filter((x) => !x.location && !x.asWhere && !(lastW(x) && lastW(x).said));
    check('N1', '"Not put away" counts only items with no place and no words', npN === npList.length, `${np} vs ${npList.map((x) => x.name)}`);

    // ---- a place's own page: where this place is ----
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
    const ch3 = await text('.tp-chain');
    check('PL3', 'an item in the Linen closet now reads "Linen closet in Hallway"', /Linen closet/.test(ch3) && /Hallway/.test(ch3), ch3);

    // ---- 10-01 (Tanya): tiers 2 and 3 on the camera — one question at a time, outward, only where nothing is saved ----
    await log('folder.jpg', 'tax papers'); await page.fill('.w1-words input', 'in the green folder in the filing drawer in the study');
    await tap('button.w1-in', { wait: 400 }); await page.locator('.in-list .wl-new', { hasText: 'Green folder' }).first().click(); await page.waitForTimeout(300);
    const up1 = await text('.w1-up:not(.set)');
    check('N1', 'a new In with nothing above it offers "+ What is the Green folder in?"', /What is the Green folder in\?/.test(up1), up1);
    await tap('.w1-up:not(.set)', { wait: 400 });
    const nw2 = await page.evaluate(() => [...document.querySelectorAll('.in-list .wl-new')].map((b) => b.innerText));
    check('N1b', '… its list is helped by her words too (New place: Filing drawer), and never offers the Green folder itself', nw2.some((x) => /Filing drawer/.test(x)) && !nw2.some((x) => /Green folder/.test(x)), JSON.stringify(nw2));
    await page.locator('.in-list .wl-new', { hasText: 'Filing drawer' }).first().click(); await page.waitForTimeout(300);
    await tap('.w1-up:not(.set)', { wait: 400 }); await page.locator('.in-list .wl-new', { hasText: 'Study' }).first().click(); await page.waitForTimeout(300);
    const tiers = await page.evaluate(() => ({ set: [...document.querySelectorAll('.w1-up.set .t')].map((t) => t.innerText.split('\n')[0]), more: !!document.querySelector('.w1-up:not(.set)') }));
    check('N2', 'three tiers: In Green folder · in Filing drawer · in Study — and no 4th question (3 tiers shown)', JSON.stringify(tiers.set.map((x) => x.replace(/NEW$/i, '').trim())) === JSON.stringify(['Filing drawer', 'Study']) && !tiers.more, JSON.stringify(tiers));
    await snap('r-N2.png');
    await save();
    const tp = await byName('tax papers'); const gf = await placeByName('Green folder'); const fd = await placeByName('Filing drawer'); const st = await placeByName('Study');
    const eo = async (id) => (await dump()).find((d) => d.kind === 'edge' && d.from === id && !d.until);
    const [e1, e2, e3] = [await eo(tp.id), gf && await eo(gf.id), fd && await eo(fd.id)];
    check('N3', 'saved: tax papers in Green folder; Green folder in Filing drawer; Filing drawer in Study', e1 && e1.to.name === 'Green folder' && e2 && e2.to.name === 'Filing drawer' && e3 && e3.to.name === 'Study' && !!st, JSON.stringify([e1 && e1.to, e2 && e2.to, e3 && e3.to]));
    const card3 = await text('.saved-card');
    check('N3b', 'the card says the chain', /Green folder/.test(card3) && /Filing drawer/.test(card3) && /Study/.test(card3), card3.slice(0, 120));
    await tap('.saved-card .u', { wait: 1500 });
    const after = { tp: await byName('tax papers'), gf: await placeByName('Green folder'), fd: await placeByName('Filing drawer'), st: await placeByName('Study') };
    check('N4', 'Undo: the item and the three new places go', !after.tp && !after.gf && !after.fd && !after.st, JSON.stringify(Object.fromEntries(Object.entries(after).map(([k, v]) => [k, !!v]))));
    // a pick that already has a saved place above it: no question, the saved chain read-only
    await log('card.jpg', 'trading card'); await tap('button.w1-in', { wait: 400 }); await page.fill('.in-list .wl-search input', 'wooden box'); await page.waitForTimeout(250); await tap('.in-list .wl-row:has(b:text-is("Wooden box"))', { wait: 300 });
    const nq = await page.evaluate(() => ({ q: !!document.querySelector('.w1-up'), chain: (document.querySelector('.w1-in.set small') || {}).innerText || '' }));
    check('N5', 'In: Wooden box (saved in the Memorabilia box): no "+ What is it in?", the chain shown read-only', !nq.q && /Memorabilia box/.test(nq.chain), JSON.stringify(nq));
    await leave();

    // ---- 10-02 independent tester, round 4: the tiers above the In ----
    const now0 = Date.now();
    await page.evaluate((t) => { const F = window.__rigfs; const C = F.collection(null, 'recall_items');
      const B = (id, name, extra = {}) => F.setDoc(F.doc(C, id), { kind: 'item', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [], name, location: '', holds: true, photo: null, thumb: null, written: true, order: t, createdAt: t - 9e6, lastSeenAt: t - 9e6, photoCount: 0, history: [{ location: '', at: t - 9e6 }], needsPlace: true, ...extra });
      B('ct', 'cookie tin'); B('ct2', 'sewing box'); B('ct3', 'red crate'); B('bb', 'blue bin', { location: 'Red crate', needsPlace: false });
      F.setDoc(F.doc(C, 'ebb'), { kind: 'edge', rel: 'in', from: 'bb', to: { t: 'thing', id: 'ct3', name: 'red crate' }, since: t - 8e6, until: null, how: 'chosen', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [] }); }, now0);
    await page.waitForTimeout(500);
    // N1: never offered a box that is inside the item, nor inside a tier below
    await openThing('red crate'); await tap('button:has-text("Move it"), button:has-text("Put it somewhere")', { wait: 900 });
    await tap('button.w1-in, .w1-in-open', { wait: 400 }); await page.fill('.in-list .wl-search input', 'cookie tin'); await page.waitForTimeout(250); await tap('.in-list .wl-row:has(b:text-is("Cookie tin"))', { wait: 300 });
    await tap('.w1-up:not(.set)', { wait: 400 }); await page.fill('.in-list .wl-search input', 'blue bin'); await page.waitForTimeout(250);
    const lp = await page.evaluate(() => [...document.querySelectorAll('.in-list .wl-row b')].map((b) => b.innerText));
    check('L1', 'a tier never offers a box that is inside the item (Blue bin is in the Red crate)', !lp.includes('Blue bin'), JSON.stringify(lp));
    await tap('.in-list .btn-quiet:has-text("Cancel")', { wait: 250 }); await leave();
    // N2: after Save + Next, the carried In (which now has a place) offers no "+"
    await log('soda.jpg', 'fork'); await tap('button.w1-in', { wait: 400 }); await page.fill('.in-list .wl-search input', 'cookie tin'); await page.waitForTimeout(250); await tap('.in-list .wl-row:has(b:text-is("Cookie tin"))', { wait: 300 });
    await tap('.w1-up:not(.set)', { wait: 400 }); await page.fill('.in-list .wl-search input', 'kitchen counter'); await page.waitForTimeout(250); await tap('.in-list .wl-row:has(b:text-is("Kitchen counter"))', { wait: 300 });
    const sv = await page.locator('.lc-k.sv').boundingBox(); await page.mouse.move(sv.x + sv.width / 2, sv.y + sv.height / 2); await page.mouse.down(); await page.waitForTimeout(900); await page.mouse.up(); await page.waitForTimeout(1300);
    AI = { name: 'spoon' }; await cam('soda.jpg'); await tap('.lc-shutter', { wait: 900 });
    const car = await page.evaluate(() => ({ chip: (document.querySelector('.w1-in.set') || {}).innerText || '', plus: !!document.querySelector('.w1-up:not(.set)') }));
    check('L2', 'Save + Next: the carried "In: Cookie tin" shows where the tin now is, and offers no "+"', /Cookie tin/.test(car.chip) && /Kitchen counter/.test(car.chip) && !car.plus, JSON.stringify(car));
    await leave();
    // N5: one new place, once — the tier above never offers "New place: <a new place already in the chain>"
    await log('book.jpg', 'loaf'); await page.fill('.w1-words input', 'in the bread bin in the larder'); await tap('button.w1-in', { wait: 400 }); await page.locator('.in-list .wl-new', { hasText: 'Bread bin' }).first().click(); await page.waitForTimeout(250);
    await tap('.w1-up:not(.set)', { wait: 400 }); await page.fill('.in-list .wl-search input', 'bread bin'); await page.waitForTimeout(250);
    const dup = await count('.in-list .wl-new');
    check('L3', 'tier 2 never offers "New place: Bread bin" again (it is the In)', dup === 0, String(dup));
    await tap('.in-list .btn-quiet:has-text("Cancel")', { wait: 250 }); await leave();
    // N3 + N4: Undo of a save that moved a box by a tier — refused when the box changed since; otherwise the box is back exactly
    await log('soda.jpg', 'needle'); await tap('button.w1-in', { wait: 400 }); await page.fill('.in-list .wl-search input', 'sewing box'); await page.waitForTimeout(250); await tap('.in-list .wl-row:has(b:text-is("Sewing box"))', { wait: 300 });
    await tap('.w1-up:not(.set)', { wait: 400 }); await page.fill('.in-list .wl-search input', 'pantry'); await page.waitForTimeout(250); await tap('.in-list .wl-row >> nth=0', { wait: 300 }); await save();
    const sb0 = (await dump()).find((d) => d.id === 'ct2');
    await tap('.saved-card .u', { wait: 1500 });
    const sb1 = (await dump()).find((d) => d.id === 'ct2'); const sbe = (await dump()).find((d) => d.kind === 'edge' && d.from === 'ct2' && !d.until);
    check('L4', 'Undo: the sewing box is back with no place — no link, "No place yet", its own last-seen', !sbe && sb1.location === '' && sb1.needsPlace === true && sb1.lastSeenAt === now0 - 9e6, JSON.stringify({ e: sbe && sbe.to, loc: sb1.location, np: sb1.needsPlace, ls: [sb1.lastSeenAt, now0 - 9e6] }));
    await log('soda.jpg', 'thimble'); await tap('button.w1-in', { wait: 400 }); await page.fill('.in-list .wl-search input', 'sewing box'); await page.waitForTimeout(250); await tap('.in-list .wl-row:has(b:text-is("Sewing box"))', { wait: 300 });
    await tap('.w1-up:not(.set)', { wait: 400 }); await page.fill('.in-list .wl-search input', 'pantry'); await page.waitForTimeout(250); await tap('.in-list .wl-row >> nth=0', { wait: 300 }); await save();
    await page.waitForTimeout(2600);
    await page.evaluate(() => { const d = window.__rig.dump().find((x) => x.id === 'ct2'); const F = window.__rigfs; const t = Date.now();
      F.updateDoc(F.doc(F.collection(null, 'recall_items'), 'ct2'), { location: 'Linen closet', lastSeenAt: t, history: [...(d.history || []), { location: 'Linen closet', at: t, by: 'robert' }] }); });
    await page.waitForTimeout(400); await tap('.saved-card .u', { wait: 1500 });
    const sb2 = (await dump()).find((d) => d.id === 'ct2');
    check('L5', 'a stale Undo is refused when a box moved by a tier changed since (another phone)', sb2.location === 'Linen closet' && /Not undone/.test(await text('.toast')), JSON.stringify({ loc: sb2.location, toast: await text('.toast') }));

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
    await log('soda.jpg', 'lamp'); await tap('button.w1-in', { wait: 400 }); await page.fill('.in-list .wl-search input', 'upstairs hall'); await page.waitForTimeout(250); await tap('.in-list .wl-row:has(b:text-is("Upstairs hall"))', { wait: 300 });
    await tap('.w1-up:not(.set)', { wait: 400 }); await page.fill('.in-list .wl-search input', 'basement'); await page.waitForTimeout(250); await tap('.in-list .wl-row:has(b:text-is("Basement"))', { wait: 300 });
    await robert("E('ebs', 'pbs', { t: 'place', name: 'Attic' });"); await page.waitForTimeout(400); await save();
    check('Q1', 'a place loop made on another phone while the camera was open: "Not saved", and nothing written', /Not saved/.test(await text('.lc-err')) && !(await byName('lamp')), await text('.lc-err'));
    await leave();
    // a box given a place on another phone while her "in" row says otherwise: refused, nothing written
    await log('soda.jpg', 'chalk'); await tap('button.w1-in', { wait: 400 }); await page.fill('.in-list .wl-search input', 'crate'); await page.waitForTimeout(250); await tap('.in-list .wl-row:has(b:text-is("Crate"))', { wait: 300 });
    await tap('.w1-up:not(.set)', { wait: 400 }); await page.fill('.in-list .wl-search input', 'kitchen counter'); await page.waitForTimeout(250); await tap('.in-list .wl-row:has(b:text-is("Kitchen counter"))', { wait: 300 });
    await robert("E('ecr', 'crate2', { t: 'place', name: 'Linen closet' }); F.updateDoc(F.doc(C, 'crate2'), { location: 'Linen closet', needsPlace: false, lastSeenAt: t });"); await page.waitForTimeout(400); await save();
    const ce = (await dump()).filter((d) => d.kind === 'edge' && d.from === 'crate2' && !d.until).map((e) => e.to.name);
    check('Q2', 'her "in" row for a box that another phone just placed: "Not saved", the other phone\'s place kept', /Not saved/.test(await text('.lc-err')) && JSON.stringify(ce) === '["Linen closet"]' && !(await byName('chalk')), JSON.stringify({ err: await text('.lc-err'), ce }));
    await leave();
    // …but the other phone putting it in the SAME place she chose is no conflict: it saves (tester r6)
    await robert("B('pail', 'pail');"); await page.waitForTimeout(300);
    await log('soda.jpg', 'scoop'); await tap('button.w1-in', { wait: 400 }); await page.fill('.in-list .wl-search input', 'pail'); await page.waitForTimeout(250); await tap('.in-list .wl-row:has(b:text-is("Pail"))', { wait: 300 });
    await tap('.w1-up:not(.set)', { wait: 400 }); await page.fill('.in-list .wl-search input', 'kitchen counter'); await page.waitForTimeout(250); await tap('.in-list .wl-row:has(b:text-is("Kitchen counter"))', { wait: 300 });
    await robert("E('epail', 'pail', { t: 'place', name: 'Kitchen counter' }); F.updateDoc(F.doc(C, 'pail'), { location: 'Kitchen counter', needsPlace: false, lastSeenAt: t });"); await page.waitForTimeout(400); await save();
    const sc = await byName('scoop');
    check('Q2b', 'the other phone put the pail in the same place she chose: it saves (no "Not saved")', !!sc && !(await count('.lc')), JSON.stringify({ scoop: !!sc, err: await text('.lc-err') }));
    // Undo keeps a new place someone else has used since
    await log('soda.jpg', 'trowel'); await tap('button.w1-in', { wait: 400 }); await page.fill('.in-list .wl-search input', 'shed'); await page.waitForTimeout(250); await tap('.in-list .wl-new', { wait: 300 }); await save();
    await page.waitForTimeout(600); await robert("I('hoe', 'hoe', 'Shed'); E('ehoe', 'hoe', { t: 'place', name: 'Shed' });"); await page.waitForTimeout(400);
    await tap('.saved-card .u', { wait: 1500 });
    check('Q3', 'Undo of a save that made "Shed": the Shed stays, because the hoe is in it now', !!(await placeByName('Shed')) && !(await byName('trowel')), JSON.stringify({ shed: !!(await placeByName('Shed')), trowel: !!(await byName('trowel')) }));
    // a loop through the item being moved (another phone put the In inside it): "Not saved"
    await robert("I('gbag', 'green bag', 'Blue bin'); F.updateDoc(F.doc(C, 'gbag'), { holds: true }); E('egb', 'gbag', { t: 'thing', id: 'bb', name: 'blue bin' });"); await page.waitForTimeout(300);
    await openThing('blue bin'); await tap('button:has-text("Move it")', { wait: 900 }); await tap('.w1-in-open', { wait: 400 }); await page.fill('.in-list .wl-search input', 'jar'); await page.waitForTimeout(250); await tap('.in-list .wl-row:has(b:text-is("Jar"))', { wait: 300 });
    await robert("E('ejar', 'jar', { t: 'thing', id: 'gbag', name: 'green bag' }); F.updateDoc(F.doc(C, 'jar'), { location: 'Green bag', needsPlace: false });"); await page.waitForTimeout(400); await save();
    const bbe = (await dump()).find((d) => d.kind === 'edge' && d.from === 'bb' && !d.until);
    check('Q4', 'Move it into a box another phone just put inside it: "Not saved", the bin stays in the Red crate', /Not saved/.test(await text('.lc-err')) && bbe && bbe.to.id === 'ct3', JSON.stringify({ err: await text('.lc-err'), e: bbe && bbe.to }));
    await leave();

    // ---- 10-01 independent tester (REPORT_r1.md) ----
    // #1: never "New place: <one of her boxes or items>", nor filler words; the box inside it is never offered under any name
    await openThing('memorabilia box'); await tap('button:has-text("Move it")', { wait: 900 });
    await page.fill('.w1-words input', 'in the wooden box next to the baseball card'); await tap('.w1-in-open', { wait: 500 });
    const t1 = await page.evaluate(() => [...document.querySelectorAll('.in-list .wl-new')].map((b) => b.innerText));
    check('T1', 'her words never offer "New place: <a box or item she has>" (Wooden box is inside it; Baseball card is an item)', !t1.some((x) => /Wooden box|Baseball card/i.test(x)), JSON.stringify(t1));
    await page.fill('.in-list .wl-search input', 'wooden box'); await page.waitForTimeout(250);
    const t1b = await page.evaluate(() => [...document.querySelectorAll('.in-list .wl-new')].map((b) => b.innerText));
    check('T1b', 'searching a box she has that it cannot go in: no "New place: Wooden box" either', !t1b.length, JSON.stringify(t1b));
    await tap('.in-list .btn-quiet:has-text("Cancel")', { wait: 300 }); await leave();
    await log('soda.jpg', 'egg timer');
    for (const [w, bad] of [['egg timer is next to the wallet', /Egg timer|Wallet/i], ['it is there', /./], ['zzz qqq', /./], ['under the yearbook from 1978', /Yearbook|1978/i]]) {
      await page.fill('.w1-words input', w); await tap('button.w1-in, .w1-in-open', { wait: 400 });
      const f = await page.evaluate(() => [...document.querySelectorAll('.in-list .wl-new')].map((b) => b.innerText));
      check('T1c', `"${w}": no junk new places`, !f.some((x) => bad.test(x.replace(/^New place:\s*/, ''))), JSON.stringify(f));
      await tap('.in-list .btn-quiet:has-text("Cancel")', { wait: 250 });
    }
    // #3: a password never becomes a place
    await page.fill('.w1-words input', 'password hunter2'); await tap('button.w1-in, .w1-in-open', { wait: 400 });
    const t3 = await page.evaluate(() => [...document.querySelectorAll('.in-list .wl-new')].map((b) => b.innerText));
    await page.fill('.in-list .wl-search input', 'password hunter2'); await page.waitForTimeout(250);
    const t3b = await page.evaluate(() => [...document.querySelectorAll('.in-list .wl-new')].map((b) => b.innerText));
    check('T3', '"password hunter2" is never offered as a new place (from words or search)', !t3.length && !t3b.length, JSON.stringify([t3, t3b]));
    await tap('.in-list .btn-quiet:has-text("Cancel")', { wait: 250 });
    const t3c = await page.evaluate(() => document.querySelector('.lc-k.sv').disabled);
    check('T3b', '"password hunter2" in her words blocks Save', t3c, String(t3c));
    await leave();
    // #4: the In list counts each item once
    await log('soda.jpg', 'pepper mill'); await tap('button.w1-in', { wait: 400 }); await page.fill('.in-list .wl-search input', 'kitchen counter'); await page.waitForTimeout(250);
    const kc = await page.evaluate(() => { const r = [...document.querySelectorAll('.in-list .wl-row')].find((x) => x.querySelector('b').innerText === 'Kitchen counter'); return r ? r.querySelector('small').innerText : ''; });
    const kcN = (await items()).filter((x) => (x.location || '').toLowerCase() === 'kitchen counter').length;
    check('T4', 'the In list\'s count is the real number of items there', new RegExp(`${kcN} item`).test(kc), `${kc} vs ${kcN}`);
    await tap('.in-list .btn-quiet:has-text("Cancel")', { wait: 250 }); await leave();
    // #2: Undo takes back the photos a Move added (and the old cover comes back)
    await openThing('spare keys'); let k0 = await byName('spare keys'); const snaps0 = (await dump()).filter((d) => d.kind === 'snap' && d.itemId === k0.id && !d.deleted).length;
    await cam('wallet.jpg'); await tap('button:has-text("Move it")', { wait: 900 }); await tap('.lc-shutter', { wait: 700 }); await save();
    await tap('.tp-moved .u', { wait: 1200 });
    const k1 = await byName('spare keys'); const snaps1 = (await dump()).filter((d) => d.kind === 'snap' && d.itemId === k1.id && !d.deleted).length;
    check('T2', 'Undo of a Move that added a photo: the photo goes, the old cover is back', snaps1 === snaps0 && k1.photo === k0.photo && k1.photoCount === k0.photoCount, JSON.stringify({ snaps0, snaps1, same: k1.photo === k0.photo, pc: [k0.photoCount, k1.photoCount] }));
    // #6: Put it in from the page keeps her words' own time, and can be undone
    await log('book.jpg', 'atlas'); await page.fill('.w1-words input', 'under the stairs'); await save();
    const a0 = lastW(await byName('atlas'));
    await page.waitForTimeout(1200); await openThing('atlas'); await tap('.tp-put', { wait: 500 }); await page.fill('.in-list .wl-search input', 'pantry'); await page.waitForTimeout(250); await tap('.in-list .wl-row >> nth=0', { wait: 900 });
    const toast6 = await text('.toast');
    const pageAt = await text('.tp-said small');
    check('T6', 'Put it in from the page: her words keep their own time; a toast with Undo', /Undo/.test(toast6) && !/Today \d/.test('') && a0 && pageAt.includes((await page.evaluate((t) => { const d = new Date(t); return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }, a0.at)).replace(/\s/g, ' ')), JSON.stringify({ toast6, pageAt }));
    await page.locator('.toast button').first().click().catch(() => {}); await page.waitForTimeout(1200);
    const a1 = await byName('atlas'); const ae = await edgeOf(a1.id);
    check('T6b', 'Undo: not in the pantry any more, her words still there', !ae && /under the stairs/.test((lastW(a1) || {}).said || ''), JSON.stringify({ ae: ae && ae.to, w: lastW(a1) }));

    // ---- 10-02 independent tester, round 2 (REPORT_r1b.md) ----
    // A + E: Undo keeps who said her words and when, and puts "last seen" back
    await log('book.jpg', 'road atlas'); await page.fill('.w1-words input', 'glovebox, under the manual'); await save();
    const r0 = await byName('road atlas'); const w0 = lastW(r0);
    await page.waitForTimeout(1500); await openThing('road atlas'); await tap('button:has-text("Move it")', { wait: 900 }); await tap('.w1-in, .w1-in-open', { wait: 400 });
    await page.fill('.in-list .wl-search input', 'pantry'); await page.waitForTimeout(250); await tap('.in-list .wl-row >> nth=0', { wait: 300 }); await save();
    await tap('.tp-moved .u', { wait: 1300 });
    const r1x = await byName('road atlas'); const w1 = lastW(r1x);
    check('U1', 'Undo of a Move: her words come back with their own time and author', w1 && w1.said === w0.said && (w1.saidAt || w1.at) === w0.at && w1.by === w0.by, JSON.stringify({ w0, w1 }));
    check('U2', 'Undo of a Move: "last seen" goes back too', r1x.lastSeenAt === r0.lastSeenAt, JSON.stringify([r0.lastSeenAt, r1x.lastSeenAt]));
    // F: a Move that only took it out of its box can be undone
    await openThing('yearbook 1978'); await tap('button:has-text("Move it")', { wait: 900 }); await tap('.w1-in .x', { wait: 300 }); await save();
    const fNote = await text('.tp-moved');
    check('U3', '✕-only Move: the page offers Undo', /Undo/.test(fNote), fNote.slice(0, 80));
    if (await count('.tp-moved .u')) await tap('.tp-moved .u', { wait: 1300 });
    const yb = await byName('yearbook 1978'); const ye = await edgeOf(yb.id);
    check('U3b', '… and Undo puts it back in the memorabilia box', ye && ye.to.t === 'thing' && ye.to.id === 'm', JSON.stringify(ye && ye.to));
    // B: more secrets
    await log('brochure.jpg', 'note card');
    for (const w of ['passwd hunter2', 'pass: hunter2', 'user bob pass hunter2', 'PIN4821']) {
      await page.fill('.w1-words input', w); await page.waitForTimeout(150);
      check('S1', `"${w}" in her words blocks Save`, await page.evaluate(() => document.querySelector('.lc-k.sv').disabled));
    }
    await page.fill('.w1-words input', ''); await tap('button.w1-in', { wait: 400 });
    for (const w of ['pass: hunter2', 'PIN4821']) { await page.fill('.in-list .wl-search input', w); await page.waitForTimeout(200); check('S2', `searching "${w}" offers no new place`, await count('.in-list .wl-new') === 0); }
    await tap('.in-list .btn-quiet:has-text("Cancel")', { wait: 250 }); await leave();
    // C: Write it down — her typed words stay words; a place she has keeps its own name
    for (const [what, where, wantLoc, wantSaid] of [['drill', 'in the shoebox under the bed', '', 'in the shoebox under the bed'], ['ladle', 'pantry SHELF', 'Pantry shelf', null]]) {
      await home(); await noAuto(); await tap(LOG, { wait: 800 }); await tap('.lc-typeit button', { wait: 500 }); await page.waitForSelector('.note-card');
      await page.fill('#note-what', what); await tap('.guess.other', { wait: 300 }); await page.fill('.note-card .guesses input.place-input', where); await tap('.note-card .btn-primary', { wait: 1200 });
      const it2 = await byName(what); const pl2 = (await places()).map((p) => p.name);
      const ok = it2 && it2.location === wantLoc && (wantSaid === null ? true : (lastW(it2) || {}).said === wantSaid) && !pl2.some((n) => /shoebox under|pantry SHELF/.test(n));
      check('W1', `Write it down "${where}": ${wantLoc ? `in the ${wantLoc}` : 'kept as her words, no new place'}`, ok, JSON.stringify({ loc: it2 && it2.location, w: it2 && lastW(it2), pl2 }));
    }
    // G: a longer name she said is offered though part of it is a place she has
    await log('soda.jpg', 'spray paint'); await page.fill('.w1-words input', 'in the garage cupboard'); await tap('button.w1-in', { wait: 400 });
    const g1 = await page.evaluate(() => [...document.querySelectorAll('.in-list .wl-new')].map((b) => b.innerText));
    check('G1', '"in the garage cupboard": "New place: Garage cupboard" is offered (Garage alone is not what she said)', g1.some((x) => /Garage cupboard/.test(x)), JSON.stringify(g1));
    await tap('.in-list .btn-quiet:has-text("Cancel")', { wait: 250 }); await leave();

    // ---- 10-02 independent tester, round 3 ----
    // #1: an Undo still on screen never rolls back a newer change made elsewhere
    await openThing('wallet'); await tap('button:has-text("Move it")', { wait: 900 }); await tap('.w1-in, .w1-in-open', { wait: 400 });
    await page.fill('.in-list .wl-search input', 'garage shelf'); await page.waitForTimeout(250); await tap('.in-list .wl-row >> nth=0', { wait: 300 }); await save();
    await page.waitForTimeout(2600);
    await page.evaluate(() => { const d = window.__rig.dump().find((x) => x.kind === 'item' && x.name === 'wallet'); const F = window.__rigfs; const t = Date.now();
      F.updateDoc(F.doc(F.collection(null, 'recall_items'), d.id), { location: 'Linen closet', lastSeenAt: t, history: [...(d.history || []), { location: 'Linen closet', at: t, w: 1, said: 'in the linen closet, top', by: 'robert' }] }); });
    await page.waitForTimeout(500); await tap('.tp-moved .u', { wait: 1300 });
    const wl = await byName('wallet');
    check('V1', 'a stale Undo (someone moved it since) changes nothing, and says so', wl.location === 'Linen closet' && ((lastW(wl) || {}).said === 'in the linen closet, top') && /Not undone/.test(await text('.toast')), JSON.stringify({ loc: wl.location, w: lastW(wl), toast: await text('.toast') }));
    // #2: "Move all to…" never offers the place itself, nor a box that is in it — not even under Recent
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
    for (const nm of ['tin box', 'reading glasses case']) { await openThing(nm); await tap('button:has-text("Move it"), button:has-text("Put it somewhere")', { wait: 900 }); await tap('.w1-in, .w1-in-open', { wait: 400 }); await page.fill('.in-list .wl-search input', 'kitchen counter'); await page.waitForTimeout(250); await tap('.in-list .wl-row:has(b:text-is("Kitchen counter"))', { wait: 300 }); await save(); }
    await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board'); await noAuto();
    await tap('.menu-btn', { wait: 400 }); await page.locator('text=/^Places/').first().click().catch(async () => { await page.locator('text=Places').first().click(); }); await page.waitForTimeout(500);
    await page.locator('.loc-row:has(b:text-is("Kitchen counter"))').first().click(); await page.waitForTimeout(500);
    await tap('.pl-all', { wait: 500 });
    const off2 = await page.evaluate(() => [...document.querySelectorAll('.in-list .wl-row b')].map((b) => b.innerText));
    check('V2b', 'Move all from the Kitchen counter: neither the Kitchen counter nor the tin box in it is offered (Recent included)', !off2.includes('Kitchen counter') && !off2.includes('Tin box'), JSON.stringify(off2));
    await tap('.in-list .btn-quiet:has-text("Cancel")', { wait: 300 });
    // #6: two more password forms
    await log('brochure.jpg', 'card'); for (const w of ['p/w hunter2', 'login bob hunter2']) { await page.fill('.w1-words input', w); await page.waitForTimeout(150); check('S3', `"${w}" blocks Save`, await page.evaluate(() => document.querySelector('.lc-k.sv').disabled)); } await leave();

    // ---- secrets, and Largest + keyboard ----
    await log('brochure.jpg', 'sticky note'); await page.fill('.w1-words input', 'drawer, password is hunter2 1234');
    const sec = await page.evaluate(() => ({ off: document.querySelector('.lc-k.sv').disabled, note: !!document.querySelector('.w1 .privnote') }));
    check('X1', 'a password in her words blocks Save and says why', sec.off && sec.note, JSON.stringify(sec)); await leave();
    await page.setViewportSize({ width: 375, height: 667 }); await setPrefs({ size: 'largest' });
    await page.addInitScript(() => { const et = new EventTarget(); let h = null; const Hh = () => (h === null ? window.innerHeight : h);
      Object.defineProperty(et, 'height', { get: Hh }); Object.defineProperty(et, 'offsetTop', { get: () => 0 }); Object.defineProperty(et, 'width', { get: () => window.innerWidth });
      Object.defineProperty(window, 'visualViewport', { configurable: true, get: () => et }); window.__kb = (px) => { h = window.innerHeight - px; et.dispatchEvent(new Event('resize')); }; });
    await log('glasses.jpg', 'sunglasses');
    const vis = await page.evaluate(() => { const ok = (s) => { const el = document.querySelector(s); if (!el) return false; const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= window.innerHeight + 1 && r.width > 0; }; return { words: ok('.w1-words input'), inChip: ok('.w1-in'), save: ok('.lc-k.sv'), shutter: ok('.lc-shutter') }; });
    check('L1', 'Largest text on a small phone: words, "What is it in?", the shutter and Save all on screen', vis.words && vis.inChip && vis.save && vis.shutter, JSON.stringify(vis));
    await snap('r-L1.png');
    await page.locator('.w1-words input').click(); await page.evaluate(() => window.__kb(300)); await page.waitForTimeout(300);
    const kb = await page.evaluate(() => { const r = document.querySelector('.w1-words input').getBoundingClientRect(); return { bottom: Math.round(r.bottom), limit: window.innerHeight - 300 }; });
    check('L2', 'with the keyboard up, the words field stays above it', kb.bottom <= kb.limit, JSON.stringify(kb));
    await snap('r-L2.png');
    await page.evaluate(() => window.__kb(0)); await leave();
    await page.setViewportSize({ width: 390, height: 844 }); await setPrefs({ size: 'normal' });
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
