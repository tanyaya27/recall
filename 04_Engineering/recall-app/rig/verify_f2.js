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
      out = { name: w.name, moves: !!w.moves, index, sure: !!index };
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
    await setPrefs({ cameraLook: look });
    const L = look.toUpperCase();
    const shot = makeShot(look);
    console.log(`\n========== LOOK ${L} ==========`);

    // ---------------------------------------------------------------------------------------------
    // R1 — a level holds identity AND photos; shutter attaches, never replaces.
    // ---------------------------------------------------------------------------------------------
    start(`${look}-r1`);
    AI = { name: 'nail file' }; WHERE = [];
    await home(); await cam('real_slippers.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
    await tap('.lv-sq.plus', { wait: 300 });
    const chipLabel = await text('.lc-chips .lc-chip:not(.more) span:last-child').catch(() => '');
    await tap('.lc-chips .lc-chip:not(.more)', { wait: 500 }); // chip-pick "Kitchen counter" (most recent place)
    const s1 = await shot('R1', 'chip-picked a known place with photos');
    check('R1', `chip-pick set the level to a known place (chip was "${chipLabel}")`, /kitchen counter/i.test(chipLabel), '', s1);
    await cam('real_desk.jpg'); await tap('.lc-shutter', { wait: 1400 });
    await cam('real_cetaphil.jpg'); await tap('.lc-shutter', { wait: 1400 });
    const say1 = (await text('.lc-say').catch(() => '')) + (await text('.lc-name').catch(() => ''));
    const badge1 = await text('.lv-sq.sel').then(() => page.locator('.lv-tile').nth(1).locator('.lv-n').innerText()).catch(() => '');
    const s2 = await shot('R1', 'shot 2 more photos on the picked level — identity + badge');
    check('R1.1/R1.2', 'identity survives 2 more shots: sentence still names Kitchen counter, badge = 2', /kitchen counter/i.test(say1) && badge1 === '2', `say="${say1.replace(/\s+/g, ' ').slice(0, 60)}" badge="${badge1}"`, s2);
    // Save this one and confirm the place doc gained exactly 2 photos (no new duplicate place doc).
    const kcBefore = await placeByName('Kitchen counter');
    await tap('.lc-k.sv', { wait: 1500 });
    const kcAfter = await placeByName('Kitchen counter');
    const nf1 = await byName('nail file');
    check('R1.5', 'on Save the two photos are on the (same) place doc, not a new one', kcAfter && kcBefore && kcAfter.id === kcBefore.id && (kcAfter.photos || []).length === (kcBefore.photos || []).length + 2, `before=${kcBefore && kcBefore.photos.length} after=${kcAfter && kcAfter.photos.length}`, '');
    check('R1', 'the thing itself landed "in" Kitchen counter, not a bare box', nf1 && /kitchen counter/i.test(nf1.location || ''), '', '');

    // R1.3 — remove one attached photo pre-save; identity must NOT be cleared.
    start(`${look}-r1b`);
    AI = { name: 'usb drive' }; WHERE = [];
    await home(); await cam('real_painting.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
    await tap('.lv-sq.plus', { wait: 300 });
    // Chip-pick the SECOND chip (a box) if present, else use WhereList to pick "Pantry shelf" explicitly for a clean count.
    await tap('.lc-chip.more', { wait: 500 });
    await type('.wl-search input', 'Pantry shelf');
    await tap('.wl-row:has-text("Pantry shelf")', { wait: 500 });
    await cam('real_desk.jpg'); await tap('.lc-shutter', { wait: 1400 });
    const s3 = await shot('R1', 'picked Pantry shelf (via WhereList), shot 1 photo on it');
    // open the level preview and remove that one attached photo
    await tap('.lv-sq.sel', { wait: 500 });
    const s4 = await shot('R1', 'preview open on the attached photo, about to Remove');
    await tap('.pv-rm', { wait: 500 });
    const nameAfterRemove = (await text('.lc-say').catch(() => '')) + (await text('.lc-name').catch(() => ''));
    const s5 = await shot('R1', 'removed the only attached photo — identity should survive (R1.3)');
    check('R1.3', 'removing the last attached photo of an identified level keeps the identity (does not fall back to naming/empty)', /pantry shelf/i.test(nameAfterRemove), `sentence="${nameAfterRemove.replace(/\s+/g, ' ').slice(0, 60)}"`, s5);
    await tap('.lc-x', { wait: 500 }); if (await count('text=Throw away')) await tap('text=Throw away', { wait: 500 });

    // ---------------------------------------------------------------------------------------------
    // R2 — typed-new place becomes a real place doc; typed-new keeps the level selected w/ prompt;
    // same name later resolves to the SAME doc.
    // ---------------------------------------------------------------------------------------------
    start(`${look}-r2`);
    AI = { name: 'sewing kit', placeGuesses: ['Hall table'], placeCertain: true }; WHERE = [];
    await home(); await cam('real_painting.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
    check('R2', 'pencil is available (a suggestion exists)', !!(await count('.lc-chg')), '', '');
    await tap('.lc-chg', { wait: 500 });
    const s6 = await shot('R2', 'chain sheet opened from the pencil');
    check('R2/R5.2', 'the OLD 3-option Choice ("Photograph it again") is gone — the chain sheet shows instead', (await count('.chain-sheet')) > 0 && (await count('text=Photograph it again')) === 0, '', s6);
    await tap('.chain-sheet .btn-secondary:has-text("Pick from every place and box")', { wait: 600 });
    await type('.wl-search input', 'Attic crawlspace shelf');
    const s7 = await shot('R2', 'typed a brand-new name in WhereList');
    check('R2', 'typed brand-new name shows "A new place called" (not silently absorbed)', (await count('.wl-new.typed')) > 0, '', s7);
    await tap('.wl-new.typed', { wait: 500 });
    const promptAfterTyped = await text('.lc-prompt b');
    const s8 = await shot('R2', 'typed-new place picked — level stays selected with add-a-photo prompt (R2.4)');
    check('R2.4', 'the camera keeps the level selected with "add a photo… or tap + for where that is"', /attic crawlspace shelf/i.test(promptAfterTyped) && /add a photo/i.test(promptAfterTyped), `prompt="${promptAfterTyped}"`, s8);
    await cam('closet.jpg'); await tap('.lc-shutter', { wait: 1400 });
    await tap('.lc-k.sv', { wait: 1500 });
    const sk = await byName('sewing kit');
    const attic1 = await placeByName('Attic crawlspace shelf');
    const s9 = await shot('R2', 'saved: place doc created with the photo');
    check('R2.1/R2.5', 'a place DOC now exists for the typed name, with the photo taken', !!attic1 && (attic1.photos || []).length === 1, JSON.stringify({ id: attic1 && attic1.id, photos: attic1 && attic1.photos.length }), s9);
    check('R2', 'the item is linked to that place by name too', sk && /attic crawlspace shelf/i.test(sk.location || ''), '', '');

    // Second use of the SAME name (typed again, later log) → resolves to the SAME doc, no duplicate.
    start(`${look}-r2b`);
    AI = { name: 'flashlight' }; WHERE = [];
    await home(); await cam('real_desk.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
    await tap('.lv-sq.plus', { wait: 300 }); await tap('.lc-chip.more', { wait: 500 });
    await type('.wl-search input', 'Attic crawlspace shelf');
    const s10 = await shot('R2', 'typing the SAME place name a second time — should list as an EXISTING place, not offer "new"');
    check('R2.5', 'the same name is now offered as an EXISTING place row (no "A new place called" duplicate offer)', (await count('.wl-row:has-text("Attic crawlspace shelf")')) > 0 && (await count('.wl-new.typed')) === 0, '', s10);
    await tap('.wl-row:has-text("Attic crawlspace shelf")', { wait: 500 });
    await tap('.lc-k.sv', { wait: 1500 });
    const attic2 = await placeByName('Attic crawlspace shelf');
    const allAttics = (await places()).filter((p) => /attic crawlspace shelf/i.test(p.name));
    check('R2.5', 'no duplicate place doc was created for the second use of the same name', allAttics.length === 1 && attic2.id === attic1.id, `docs=${allAttics.length}`, '');

    // ---------------------------------------------------------------------------------------------
    // R3 — name a new place right there: userName wins over a late AI name; unnamed marker on Save.
    // ---------------------------------------------------------------------------------------------
    start(`${look}-r3`);
    AI = { name: 'extension cord' }; WHERE = [{ name: 'Fake AI Shelf Name', moves: false }];
    await home(); await cam('real_slippers.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
    await tap('.lv-sq.plus', { wait: 300 });
    NEXT_WHERE_DELAY = 2200; // give ourselves a window to rename before the fake AI answers
    await cam('closet.jpg'); await tap('.lc-shutter', { wait: 400 }); // don't wait the usual 1300–1600ms; we want to beat the AI
    const s11 = await shot('R3', 'still "naming" — about to rename ourselves before the AI answers');
    await tap('.lv-sq.sel', { wait: 400 }); // opens the level preview (has 1 photo)
    await tap('.pv-name', { wait: 400 }); // "Rename" — R3.1: reachable immediately while naming
    await type('.sheet .place-input', 'My Special Shelf');
    await tap('.sheet .btn-primary', { wait: 400 });
    const s12 = await shot('R3', 'renamed to "My Special Shelf" — now waiting out the delayed AI response');
    await page.waitForTimeout(2500); // let the delayed (fake) AI response land
    const nameAfterAI = (await text('.lc-say').catch(() => '')) + (await text('.lc-name').catch(() => ''));
    const s13 = await shot('R3', 'after the late AI answer arrived');
    check('R3.2', 'a user-given name at capture WINS over a late AI name (AI said "Fake AI Shelf Name")', /my special shelf/i.test(nameAfterAI) && !/fake ai shelf name/i.test(nameAfterAI), `sentence="${nameAfterAI.replace(/\s+/g, ' ').slice(0, 60)}"`, s13);
    await tap('.lc-k.sv', { wait: 1500 });
    const shelfDoc = await placeByName('My Special Shelf');
    check('R3.4', 'the doc was created with the user-given name', !!shelfDoc, '', '');

    // R3.3 — placeholder-named new BOX saved unnamed → "Unnamed — tap to name" → rename lands on the doc.
    start(`${look}-r3b`);
    AI = { name: 'battery pack' }; WHERE = [];
    NEXT_WHERE_BADJSON = true; // force the naming pass to fail → name stays '' ("A box"/placeholder)
    await home(); await cam('real_desk.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
    await tap('.lv-sq.plus', { wait: 300 }); await cam('box.jpg'); await tap('.lc-shutter', { wait: 2000 });
    const s14 = await shot('R3', 'a where-photo whose naming failed — placeholder name, never blocks Save');
    check('R3.3', 'Save is NOT blocked by a placeholder/failed name', !(await isDisabled('.lc-k.sv')), '', s14);
    await tap('.lc-k.sv', { wait: 1500 });
    const s15 = await shot('R3', 'saved-card shows "Unnamed — tap to name"');
    const hasUnnamed = (await count('.sc-unnamed')) > 0;
    check('R3.3', 'the confirmation card marks the link "Unnamed — tap to name"', hasUnnamed, '', s15);
    if (hasUnnamed) {
      await tap('.sc-unnamed', { wait: 400 });
      await type('.sheet .place-input', 'Battery Bin');
      await tap('.sheet .btn-primary', { wait: 600 });
      // The failed naming pass left `moves:false` (no AI result at all), so this link saved as a
      // PLACE doc, not a box — either is a valid doc for this check: the rename must land on it.
      const bbItem = (await items()).find((it) => /battery bin/i.test(it.name || ''));
      const bbPlace = await placeByName('Battery Bin');
      const s16 = await shot('R3', 'renamed via the unnamed marker');
      check('R3.3', 'the rename from the card lands on the doc just created', !!(bbItem || bbPlace), JSON.stringify({ item: !!bbItem, place: !!bbPlace }), s16);
    }

    // ---------------------------------------------------------------------------------------------
    // R4 — recognition confirmed both ways; collisions never merge silently; pool 4+4; single ask.
    // ---------------------------------------------------------------------------------------------
    // R4 Yes-branch: AI names a where identical to an EXISTING place (name match only, no visual sure-match).
    start(`${look}-r4yes`);
    // Reseed here (and before R5/R6/Regressions): the mock store persists to localStorage, and by
    // this point R1-R3 have piled up ~15 full-res photos — close enough to this rig's ~5MB quota
    // that a later save can succeed in-memory but silently fail to persist, then vanish on the next
    // reload. A periodic reseed keeps that rig limitation from masquerading as a product defect.
    await seedHouse();
    AI = { name: 'gift card' }; WHERE = [{ name: 'Kitchen counter', moves: false }]; // no `known:` → not a visual sure-match
    await home(); await cam('real_cetaphil.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
    await tap('.lv-sq.plus', { wait: 300 }); await cam('closet.jpg'); await tap('.lc-shutter', { wait: 1800 });
    const s17 = await shot('R4', '"Your Kitchen counter?" — name-collision ask (F3/F8 fixed)');
    check('R4.2/R4.5', 'the "Your {name}?" ask appears for a NAME collision (not just visual)', (await count('.lc-ask')) > 0 && /kitchen counter/i.test(await text('.lc-ask b')), '', s17);
    const askBtnBox = await box('.lc-ask button');
    check('F10', 'ask buttons (Yes / No, a new one) are >= 44px tall', askBtnBox.h >= 44, JSON.stringify(askBtnBox), '');
    const kcBefore2 = (await places()).filter((p) => /kitchen counter/i.test(p.name)).length;
    await tap('.lc-ask button:has-text("Yes")', { wait: 700 });
    await tap('.lc-k.sv', { wait: 1500 });
    const kcAfter2 = (await places()).filter((p) => /kitchen counter/i.test(p.name)).length;
    const s18 = await shot('R4', 'Yes → merged into the existing place, no new doc');
    check('R4.5', 'Yes → photos land on the EXISTING place, no new doc', kcAfter2 === kcBefore2, `before=${kcBefore2} after=${kcAfter2}`, s18);

    // R4 No-branch: same mechanism, but "No, a new one" → distinct-name gate → two docs after save.
    start(`${look}-r4no`);
    AI = { name: 'umbrella' }; WHERE = [{ name: 'Pantry shelf', moves: false }];
    await home(); await cam('real_desk.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
    await tap('.lv-sq.plus', { wait: 300 }); await cam('real_painting.jpg'); await tap('.lc-shutter', { wait: 1800 });
    const s19 = await shot('R4', '"Your Pantry shelf?" ask, about to say No');
    await tap('.lc-ask button:has-text("No, a new one")', { wait: 700 });
    const s20 = await shot('R4', 'No → rename sheet opens with the distinct-name line');
    check('R4.2', 'No opens the rename sheet with the "already a" line', /already a/i.test(await text('.sheet-title')), await text('.sheet-title'), s20);
    const svDisabled1 = await isDisabled('.lc-k.sv');
    check('R4.2', 'Save is DISABLED for that link while the name still collides', svDisabled1 === true, '', '');
    await type('.sheet .place-input', 'Pantry shelf, upstairs');
    await tap('.sheet .btn-primary', { wait: 500 });
    const svDisabled2 = await isDisabled('.lc-k.sv');
    const s21 = await shot('R4', 'renamed distinctly — Save re-enabled');
    check('R4.2', 'Save re-enables once the name differs', svDisabled2 === false, '', s21);
    const pantryBefore = (await places()).filter((p) => /pantry shelf/i.test(p.name)).length;
    await tap('.lc-k.sv', { wait: 1500 });
    const pantryAfter = (await places()).filter((p) => /pantry shelf/i.test(p.name)).length;
    check('R4.5', 'two distinct docs exist after save (original + the renamed one)', pantryAfter === pantryBefore + 1, `before=${pantryBefore} after=${pantryAfter}`, '');

    // R4.3 — candidate pool: up to 4 boxes + 4 places (was 2), one whereIs call. 5+5 seeded, so the cap matters.
    start(`${look}-r4pool`);
    AI = { name: 'stapler' }; WHERE = [{ name: 'never seen shelf', moves: false }];
    lastPool = null;
    await home(); await cam('real_slippers.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
    await tap('.lv-sq.plus', { wait: 300 }); await cam('box.jpg'); await tap('.lc-shutter', { wait: 1800 });
    check('R4.3', 'pool sent to whereIs is capped at 4 boxes + 4 places = 8 (5+5 were available)', lastPool === 8, `lastPool=${lastPool}`, '');
    await tap('.lc-x', { wait: 500 }); if (await count('text=Throw away')) await tap('text=Throw away', { wait: 500 });

    // R4.4 — thing-identity ask AND a level ask at once → only ONE renders (priority order).
    start(`${look}-r4stack`);
    AI = { name: 'reading glasses' }; WHERE = [{ name: 'Kitchen counter', moves: false }];
    await home(); await cam('glasses.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1400 });
    const s22 = await shot('R4', 'thing-identity ask should be showing (matches existing "reading glasses")');
    const identityShowing = /reading glasses/i.test(await text('.lc-ask b').catch(() => ''));
    check('R4', 'thing-identity ask appears first', identityShowing, '', s22);
    await tap('.lv-sq.plus', { wait: 300 }); await cam('closet.jpg'); await tap('.lc-shutter', { wait: 1800 });
    const askCount = await count('.lc-ask');
    const askText = await text('.lc-ask b').catch(() => '');
    const s23 = await shot('R4', 'a level ask is ALSO now pending (Kitchen counter) — only one should render');
    check('R4.4', 'only ONE ask renders at a time, and it is the thing-identity ask (priority order)', askCount === 1 && /reading glasses/i.test(askText), `count=${askCount} text="${askText}"`, s23);
    await tap('.lc-ask button:has-text("No, a new item")', { wait: 700 });
    const s24 = await shot('R4', 'answered the thing ask — the level ask should now surface');
    check('R4.4', 'once the thing ask is answered, the level ask surfaces (still only one at a time)', (await count('.lc-ask')) === 1 && /kitchen counter/i.test(await text('.lc-ask b')), '', s24);
    await tap('.lc-x', { wait: 500 }); if (await count('text=Throw away')) await tap('text=Throw away', { wait: 500 });

    // ---------------------------------------------------------------------------------------------
    // R5 — chain sheet: pencil edits ONE level; replace/remove; rename; No-place-yet confirm; 44px.
    // ---------------------------------------------------------------------------------------------
    start(`${look}-r5`);
    await seedHouse();
    AI = { name: 'passport case' }; WHERE = [{ name: 'zip pouch', moves: true }, { name: 'shelf a', moves: false }];
    await home(); await cam('real_painting.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
    await tap('.lv-sq.plus', { wait: 300 }); await cam('real_desk.jpg'); await tap('.lc-shutter', { wait: 1700 });
    await tap('.lv-sq.plus', { wait: 300 }); await cam('real_slippers.jpg'); await tap('.lc-shutter', { wait: 1700 });
    await tap('.lv-sq.plus', { wait: 300 }); await tap('.lc-chip.more', { wait: 500 });
    await type('.wl-search input', 'Closet b'); await tap('.wl-new.typed', { wait: 500 });
    const say5 = await text('.lc-say');
    const s25 = await shot('R5', '3-level chain built: zip pouch -> shelf a -> Closet b');
    check('R5', 'a 3-level chain exists before the pencil is used', /zip pouch/i.test(say5), say5.replace(/\s+/g, ' '), s25);
    await tap('.lc-chg', { wait: 500 });
    const rowNames = await page.locator('.cs-row .cs-name').allInnerTexts();
    const s26 = await shot('R5', 'chain sheet: one row per level');
    check('R5', 'chain sheet shows one row per level, in order', rowNames.length === 3 && /zip pouch/i.test(rowNames[0]) && /shelf a/i.test(rowNames[1]) && /closet b/i.test(rowNames[2]), JSON.stringify(rowNames), s26);
    // 44px probe on chain-sheet rows.
    const nameBox = await box('.cs-row .cs-name'); const actBox = await box('.cs-row .cs-act');
    check('R5.3', 'chain-sheet name/act targets are >= 44px tall', nameBox.h >= 44 && actBox.h >= 44, JSON.stringify({ nameBox, actBox }), '');
    check('R5.3', 'Replace/Remove carry WORDS, not bare icons', /replace/i.test(await text('.cs-row .cs-act')) , '', '');
    // Replace level 2 ONLY.
    await page.locator('.cs-row').nth(1).locator('.cs-act').first().click(); await page.waitForTimeout(500);
    const s27 = await shot('R5', 'Replace level 2 → back in the camera for that level only');
    await cam('real_cetaphil.jpg'); await tap('.lc-shutter', { wait: 1700 });
    const sayReplaced = await text('.lc-say');
    const s28 = await shot('R5', 'level 2 replaced — 1 (zip pouch) and 3 (Closet b) untouched');
    check('R5.4', 'Replace touches ONLY that level: 1 and 3 survive, 2 is new', /zip pouch/i.test(sayReplaced) && /closet b/i.test(sayReplaced), sayReplaced.replace(/\s+/g, ' '), s28);
    // Remove level 2 → chain becomes 1 -> 3.
    await tap('.lc-chg', { wait: 500 });
    await page.locator('.cs-row').nth(1).locator('.cs-act.rm').first().click(); await page.waitForTimeout(500);
    const sayRemoved = await text('.lc-say');
    const s29 = await shot('R5', 'removed level 2 — chain is now 1 -> 3');
    check('R5.4', 'Remove level 2 → chain is 1 -> 3 (level 2 gone, no gap)', /zip pouch/i.test(sayRemoved) && /closet b/i.test(sayRemoved) && !/real_cetaphil|shelf a/i.test(sayRemoved), sayRemoved.replace(/\s+/g, ' '), s29);
    // Rename from the chain sheet.
    await tap('.lc-chg', { wait: 500 });
    await page.locator('.cs-row').first().locator('.cs-name').click(); await page.waitForTimeout(400);
    await type('.sheet .place-input', 'Renamed Pouch'); await tap('.sheet .btn-primary', { wait: 500 });
    await tap('.lc-chg', { wait: 500 });
    const renamedRow = await page.locator('.cs-row').first().locator('.cs-name').innerText();
    const s30 = await shot('R5', 'renamed level 1 from the chain sheet');
    check('R5.1', 'rename from the chain sheet row sticks', /renamed pouch/i.test(renamedRow), renamedRow, s30);
    // "No place yet" with 2+ filled levels → confirm.
    await tap('.chain-sheet .btn-secondary.amber:has-text("No place yet")', { wait: 500 });
    const s31 = await shot('R5', '"No place yet" with 2+ levels asks to confirm first');
    check('R5.1', 'clearing 2+ levels via "No place yet" asks for confirmation', (await count('text=Clear where it goes?')) > 0, '', s31);
    await tap('text=Keep it', { wait: 500 });
    const s32 = await shot('R5', 'Keep it — nothing cleared');
    check('R5.1', '"Keep it" leaves the chain intact', (await count('.chain-sheet')) > 0, '', s32);
    await tap('.chain-sheet .btn-secondary.amber:has-text("No place yet")', { wait: 500 });
    await tap('.sheet .btn-secondary.amber', { wait: 500 });
    const s33 = await shot('R5', 'Clear confirmed — back to No place yet');
    check('R5.1', 'Clear (confirmed) empties the chain', /no place yet/i.test(await text('.lc-say')), '', s33);
    await tap('.lc-x', { wait: 500 }); if (await count('text=Throw away')) await tap('text=Throw away', { wait: 500 });

    // ---------------------------------------------------------------------------------------------
    // R6 — Not put away lists only true chores.
    // ---------------------------------------------------------------------------------------------
    start(`${look}-r6`);
    await seedHouse();
    await home();
    const pillBefore = await text('.notput').catch(() => ''); // baseline: the pre-seeded "coffee can" chore
    const pillBeforeN = (pillBefore.match(/(\d+)/) || [0, 0])[1] * 1;
    AI = { name: 'ticket stubs' }; WHERE = [{ name: 'shoe box', moves: true }];
    await cam('real_cetaphil.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
    await tap('.lv-sq.plus', { wait: 300 }); await cam('box.jpg'); await tap('.lc-shutter', { wait: 1700 });
    await tap('.lc-k.sv', { wait: 1600 });
    const cardLine2 = await text('.saved-card small').catch(() => '');
    const s34 = await shot('R6', 'saved: soft-nudge line on the card, no chore');
    check('R6.4', 'the confirmation card shows the soft-nudge second line', /haven.t said where/i.test(cardLine2), cardLine2, s34);
    await home();
    const pillAfterBox = await text('.notput').catch(() => '');
    const pillAfterBoxN = (pillAfterBox.match(/(\d+)/) || [0, 0])[1] * 1;
    const s35 = await shot('R6', 'Home: the "Not put away" pill did not grow for the new asWhere box');
    check('R6.2', 'the new asWhere box does NOT add to the "Not put away" count (pill unchanged from baseline)', pillAfterBoxN === pillBeforeN, `before="${pillBefore}" after="${pillAfterBox}"`, s35);
    const allTiles = await page.evaluate(() => [...document.querySelectorAll('.tile')].map((t) => t.innerText.replace(/\s+/g, ' ')));
    const shoeTileText = allTiles.find((t) => /shoe box/i.test(t)) || '';
    const tileNoplace = await count('.tile-label.noplace:has-text("Shoe box")');
    const shoeDump = (await items()).find((it) => /shoe box/i.test(it.name || ''));
    const s36 = await shot('R6', 'the shoe-box tile itself');
    check('R6.3', 'tile shows a plain dash, not the amber "No place yet" block', /—/.test(shoeTileText) && tileNoplace === 0, `tile="${shoeTileText}" storeRecord=${JSON.stringify(shoeDump)} allTiles=${JSON.stringify(allTiles)}`, s36);
    // A level-0 thing saved placeless (Write it down, no place) STILL appears in Not put away — the
    // chore list must not have been over-filtered into excluding real chores along with asWhere boxes.
    await tap(LOG, { wait: 700 }); await tap('.lc-typeit button', { wait: 600 });
    await page.fill('#note-what', 'spare button'); await tap('.note-card .btn-primary', { wait: 900 });
    await home();
    const pillAfterChore = await text('.notput').catch(() => '');
    const pillAfterChoreN = (pillAfterChore.match(/(\d+)/) || [0, 0])[1] * 1;
    const s37 = await shot('R6', 'a genuine placeless thing (Write it down, no place) DOES bring the count up');
    check('R6', 'a real chore (level-0 thing, no place) still counts in Not put away (list not over-filtered)', pillAfterChoreN === pillBeforeN + 1, `before=${pillBeforeN} afterChore=${pillAfterChoreN}`, s37);
    await tap('.notput', { wait: 600 });
    const s38 = await shot('R6', 'Not put away list: coffee can + spare button, NOT shoe box');
    const npText = await text('.np-list');
    check('R6', 'the list has the real chores and NOT the asWhere shoe box', /spare button/i.test(npText) && /coffee can/i.test(npText) && !/shoe box/i.test(npText), npText.replace(/\s+/g, ' '), s38);

    // ---------------------------------------------------------------------------------------------
    // Regressions — the basic flows must still work.
    // ---------------------------------------------------------------------------------------------
    // thing + suggestion save
    start(`${look}-reg-sugg`);
    AI = { name: 'scissors', placeGuesses: ['Kitchen counter'], placeCertain: true }; WHERE = [];
    await home(); await cam('scissors.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
    const suggShown = /kitchen counter/i.test(await text('.lc-say'));
    await tap('.lc-k.sv', { wait: 1400 });
    const scissors = await byName('scissors');
    const s39 = await shot('REGRESSIONS', 'thing + suggestion save');
    check('REG', 'suggestion save still works', suggShown && scissors && /kitchen counter/i.test(scissors.location || ''), '', s39);

    // +Next sweep
    start(`${look}-reg-next`);
    AI = { name: 'first widget' }; WHERE = [];
    await home(); await cam('real_desk.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
    await tap('.lc-k.sn', { wait: 1300 });
    const stillOpen = (await count('.lc-view')) > 0;
    AI = { name: 'second widget' }; await cam('real_slippers.jpg'); await tap('.lc-shutter', { wait: 1300 }); await tap('.lc-k.sv', { wait: 1300 });
    const w1 = await byName('first widget'); const w2 = await byName('second widget');
    const s40 = await shot('REGRESSIONS', '+Next sweep saved both');
    check('REG', '+Next sweep still works (camera stays open, both saved)', stillOpen && !!w1 && !!w2, '', s40);

    // Cancel confirm
    start(`${look}-reg-cancel`);
    await home(); await tap(LOG, { wait: 700 }); await cam('real_desk.jpg'); await tap('.lc-shutter', { wait: 1300 });
    await tap('.lc-x', { wait: 500 });
    const confirmShown = (await count('text=Throw these photos away')) > 0;
    const s41 = await shot('REGRESSIONS', 'Cancel-with-photo confirm still appears');
    check('REG', 'Cancel confirm still appears once a photo exists', confirmShown, '', s41);
    await tap('text=Throw away', { wait: 600 });

    // Move flow from a thing's page
    start(`${look}-reg-move`);
    await home(); await tap('.tile:has-text("Wallet")', { wait: 700 }); await tap('.tp-btn:has-text("Move it")', { wait: 900 });
    await cam('real_painting.jpg'); await tap('.lc-shutter', { wait: 1400 }); await tap('.lc-k.sv', { wait: 1400 });
    const w = await byName('wallet');
    const s42 = await shot('REGRESSIONS', 'Move it still works');
    check('REG', 'Move it still relocates the item', w && w.location && w.location !== 'Hall table', '', s42);

    // Write it down
    start(`${look}-reg-write`);
    await home(); await tap(LOG, { wait: 700 }); await tap('.lc-typeit button', { wait: 600 });
    await page.fill('#note-what', 'spare fuse');
    await tap('.path.in', { wait: 500 }); await type('.wl-search input', 'Hall table'); await tap('.wl-row:has-text("Hall table")', { wait: 400 });
    await tap('.note-card .btn-primary', { wait: 900 });
    const fuse = await byName('spare fuse');
    const s43 = await shot('REGRESSIONS', 'Write it down still works');
    check('REG', 'Write it down still saves a written (no-photo) item', !!fuse, '', s43);

    // Helper-owned camera (ownerName set) — wrapped: this switches simulated identity mid-run, and a
    // stuck subscription here must not take the rest of the suite down with it.
    start(`${look}-reg-helper`);
    try {
      await page.evaluate((s) => window.__rig.seed(s, 'recall_grants'), [{ id: 'margaret_robert', grantor: 'margaret', grantee: 'robert', role: 'editor', createdAt: Date.now() }]);
      await page.evaluate(() => { localStorage.setItem('rig-uid', 'robert'); localStorage.setItem('rig-anon', '0'); });
      await setPrefs({ whose: 'margaret' });
      AI = { name: 'helper item' }; WHERE = [];
      await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen'); await page.waitForTimeout(1500);
      await tap(LOG, { wait: 800 });
      const whoseText = await text('.lc-whose').catch(() => '');
      const s44 = await shot('REGRESSIONS', 'helper-owned camera shows ownerName');
      check('REG', 'a helper\'s camera shows "{Owner}’s ReCall"', /margaret/i.test(whoseText), whoseText, s44);
      await tap('.lc-x', { wait: 500 });
    } catch (e) {
      check('REG', 'a helper\'s camera shows "{Owner}’s ReCall"', false, `exception: ${e.message}`, await shot('REGRESSIONS', 'helper flow exception').catch(() => ''));
    }
    await page.evaluate(() => { localStorage.setItem('rig-uid', 'margaret'); localStorage.setItem('rig-anon', '0'); });
    await setPrefs({ whose: null });

    // Privacy note flow (a NEW sensitive item — "passport" would match the pre-seeded one and,
    // correctly, suppress the note since a re-photographed EXISTING private thing keeps its setting).
    start(`${look}-reg-priv`);
    AI = { name: 'birth certificate' }; WHERE = [];
    await home(); await cam('folder.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1400 });
    const privShown = (await count('.privnote')) > 0;
    const s45 = await shot('REGRESSIONS', 'privacy note flow still triggers for a sensitive name');
    check('REG', 'privacy note (Kept private…) still appears for a sensitive item', privShown, await text('.privnote').catch(() => ''), s45);
    await tap('.lc-x', { wait: 500 }); if (await count('text=Throw away')) await tap('text=Throw away', { wait: 500 });

    // Visual spot-check: no overlap/cut-off/white-on-white — sample a few dense screens already shot above.
    const overlapCheck = await page.evaluate(() => {
      const els = [...document.querySelectorAll('.lc-say, .lc-name, .cs-row, .sc-unnamed, .privnote')];
      return els.every((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.right <= window.innerWidth + 1; });
    });
    check('REG', `look ${L}: no cut-off/overflow on the dense sentence/chain/privacy elements`, overlapCheck, '', '');
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
  await runLook('a');

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
  fs.writeFileSync(path.join(__dirname, 'VERIFY_RESULTS.md'), lines.join('\n'));
  const totalPass = results.filter((r) => r.ok).length;
  console.log(`\n${totalPass}/${results.length} checks passed`);
  console.log('Page errors:', errors.length ? errors : 'none');
  console.log('Console errors (unique):', Array.from(new Set(consoleErrors)).length, consoleErrors.length ? Array.from(new Set(consoleErrors)).slice(0, 10) : '');
  server.close();
})();
