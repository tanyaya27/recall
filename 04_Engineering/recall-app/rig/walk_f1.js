// F1 — the board's full click-path walk (2026-09-27 build): every screen, every camera branch
// (LogCamera.jsx: levels by intent, chips, sure-match ask, typed places, +Next, cancel, move),
// in BOTH camera looks where the look changes what's on screen. Nothing here changes the app.
// Produces: shots_walk/<flow>-<n>.png and WALK_INVENTORY.md (screen/state · controls · where they
// lead · defects), one row per step, written as we go so a crash still leaves a partial file.
// LOOK=a|b node walk_f1.js   (default: runs BOTH looks — b first, a second, for the camera flows)
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const PORT = 8199; const ROOT = path.join(__dirname, 'out');
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, req.url.split('?')[0] === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
const img = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(__dirname, 'mock/img', f)).toString('base64');
const OUTDIR = path.join(__dirname, 'shots_walk'); fs.mkdirSync(OUTDIR, { recursive: true });
const MDPATH = path.join(__dirname, 'WALK_INVENTORY.md');

let AI = { name: 'thing' }; let WHERE = []; let SAME = { index: -1, sure: false };
const mdRows = []; const errors = [];
const consoleErrors = [];

function mdInit() {
  fs.writeFileSync(MDPATH, `# WALK_INVENTORY — ReCall build 20260927b (rig/walk_f1.js)\n\n` +
    `One row per screen/state visited. Screenshot files are in \`rig/shots_walk/\`. "Controls" lists every tappable\n` +
    `element visible in that state and its label; "Leads to" says what tapping it does (from reading the source,\n` +
    `not guessed). "Notes" flags anything broken, overlapping, cut off, mislabeled, or a dead end.\n\n` +
    `| # | Flow · state | Screenshot | Controls (label — leads to) | Notes |\n|---|---|---|---|---|\n`);
}
function mdRow(n, state, file, controls, notes) {
  const c = controls.map((x) => `**${x[0]}** — ${x[1]}`).join('<br>');
  fs.appendFileSync(MDPATH, `| ${n} | ${state} | ${file} | ${c} | ${notes || ''} |\n`);
}

(async () => {
  mdInit();
  await new Promise((r) => server.listen(PORT, r));
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
    let out;
    if (/MOVES:/.test(texts)) {
      const w = WHERE.shift() || { name: 'shelf', moves: false };
      let index = 0; if (w.known) { const m = [...texts.matchAll(/SAVED (\d+) — "([^"]*)"/g)].find((x) => x[2].toLowerCase() === w.known.toLowerCase()); index = m ? Number(m[1]) : 0; }
      out = { name: w.name, moves: !!w.moves, index, sure: !!index };
    } else if (/NEW PHOTO/.test(texts)) out = SAME;
    else if (images) out = { name: AI.name, sameAs: AI.sameAs || '', alternatives: [], restingOn: AI.restingOn || '', placeCertain: !!AI.placeCertain, placeGuesses: AI.placeGuesses || [], description: '', details: AI.details || '', private: !!AI.private, privateWhy: AI.privateWhy || '', secretVisible: false };
    else out = { matches: [], message: '' };
    await new Promise((r) => setTimeout(r, 220));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [{ type: 'text', text: JSON.stringify(out) }] }) });
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });

  let flow = '', n = 0, taps = 0, rowN = 0;
  const start = (f) => { flow = f; n = 0; taps = 0; };
  const tap = async (sel, opts = {}) => { await page.locator(sel).first().click(opts); taps += 1; await page.waitForTimeout(opts.wait || 450); };
  const type = async (sel, s) => { await page.locator(sel).first().fill(s); await page.waitForTimeout(300); };
  const cam = async (f) => { await page.evaluate((s) => { window.__cam = s; }, img(f)); await page.waitForTimeout(220); };
  const text = (sel) => page.locator(sel).first().innerText().catch(() => '');
  const count = (sel) => page.locator(sel).count();
  const dump = () => page.evaluate(() => window.__rig.dump());
  const items = async () => (await dump()).filter((d) => d.kind === 'item' && !d.deleted);
  const byName = async (nm) => (await items()).find((d) => (d.name || '').toLowerCase() === nm.toLowerCase());
  const openTo = async (id) => (await dump()).filter((d) => d.kind === 'edge' && d.from === id && !d.until);
  const setPrefs = (patch) => page.evaluate((p) => { const x = JSON.parse(localStorage.getItem('recall-prefs') || '{}'); Object.assign(x, p); localStorage.setItem('recall-prefs', JSON.stringify(x)); }, patch);

  // One step: screenshot, and a manually-supplied list of [label, leadsTo] controls + notes.
  const step = async (state, controls = [], notes = '') => {
    n += 1; rowN += 1; await page.waitForTimeout(300);
    const file = `${flow}-${String(n).padStart(2, '0')}.png`;
    await page.screenshot({ path: `${OUTDIR}/${file}` });
    mdRow(rowN, `${flow} · ${state}`, file, controls, notes);
    console.log(`[${rowN}] ${file}  ${state}${notes ? '  !! ' + notes : ''}`);
  };

  // ---- Margaret's house (same seed as walk_s12, so the "known box" / "existing place" scenarios exist)
  async function seedHouse(theme) {
    await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen');
    await page.evaluate(() => { localStorage.clear(); window.__rig.reset(); localStorage.setItem('rig-uid', 'mg'); localStorage.setItem('rig-anon', '0');
      localStorage.setItem('recall-ai-config', JSON.stringify({ provider: 'anthropic', apiKey: 'sk-ant-rig', model: '' })); });
    if (theme) await setPrefs({ theme });
    await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen'); await page.waitForTimeout(300);
    const now = Date.now(), H = 3600e3;
    const P = (f) => ({ photo: img(f), thumb: img(f), thumbV: 2 });
    const T = (id, name, location, f, ago, extra = {}) => ({ id, kind: 'item', owner: 'mg', by: 'mg', private: false, roles: {}, sharedWith: [], name, location,
      ...(f ? P(f) : { photo: null, thumb: null, written: true }), order: now - ago, createdAt: now - ago, lastSeenAt: now - ago, logId: 'l_' + id, photoCount: f ? 1 : 0, history: [{ location, at: now - ago }], ...extra });
    const E = (id, from, to, ago) => ({ id, kind: 'edge', rel: 'in', from, to, since: now - ago, until: null, how: 'chosen', owner: 'mg', by: 'mg', private: false, roles: {}, sharedWith: [] });
    const box = (id, name) => ({ t: 'thing', id, name });
    const seed = [
      T('g', 'reading glasses', 'Hall table', 'glasses.jpg', 1 * H), T('w2', 'wallet', 'Hall table', 'wallet.jpg', 2 * H),
      T('m', 'memorabilia box', 'Crawl space', 'box14.jpg', 90 * H), T('w', 'wooden box', 'Memorabilia box', 'smallbox.jpg', 80 * H),
      T('y', 'yearbook 1978', 'Memorabilia box', 'book.jpg', 79 * H), T('c', 'baseball card', 'Wooden box', 'card.jpg', 70 * H),
      T('d', 'tool drawer', 'Garage', 'tooldrawer.jpg', 30 * H), T('u', 'coffee can', '', 'soda.jpg', 3 * H, { needsPlace: true }),
      T('p', 'passport', 'Desk drawer', 'folder.jpg', 5 * H, { private: true }),
      { id: 'pl1', kind: 'place', owner: 'mg', by: 'mg', private: false, name: 'Kitchen counter', order: 1, createdAt: now - 99 * H, parent: null, photos: [] },
      E('em', 'm', { t: 'place', name: 'Crawl space' }, 90 * H), E('ew', 'w', box('m', 'memorabilia box'), 80 * H),
      E('ey', 'y', box('m', 'memorabilia box'), 79 * H), E('ec', 'c', box('w', 'wooden box'), 70 * H),
    ];
    await page.evaluate((s) => window.__rig.seed(s), seed);
    await page.evaluate((s) => window.__rig.seed(s, 'recall_users'), [{ id: 'mg', name: 'Margaret' }]);
    await page.waitForTimeout(400);
  }
  const home = async () => { await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board'); await page.waitForTimeout(350); };
  const LOG = '.footer .btn-primary:not(.alt)';
  const sel = () => page.locator('.lv-sq.sel').getAttribute('aria-label');
  const ring = () => page.evaluate(() => getComputedStyle(document.querySelector('.lc-shutter')).borderTopColor);

  await seedHouse();

  // =====================================================================================
  // PART 1 — the non-camera screens
  // =====================================================================================
  start('home');
  await page.goto(`http://localhost:${PORT}/`);
  await page.evaluate(() => { localStorage.clear(); window.__rig.reset(); });
  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen'); await page.waitForTimeout(400);
  await step('empty (no household set up yet)', [['Set up', 'opens Settings (route settings) to configure the AI key']], '');
  await seedHouse();
  await home();
  await step('seeded: tiles, Not put away banner, footer', [
    ['☰ (menu-btn)', 'opens the left drawer (MenuDrawer)'],
    ['"Margaret’s ReCall" / day line', 'switch-account affordance (onSwitch) — no-op for a single-person house'],
    ['Settings (tiny, gear)', 'route settings — Settings.jsx (AI key, camera look, Show times)'],
    ['Not put away · 1 (coffee can)', 'route notput — NotPutAway.jsx'],
    ['a tile (e.g. Wallet)', "route thing — that item's ThingCard"],
    ['Log item (footer primary)', 'openLog() — opens LogCamera with no preset'],
    ['Find item (footer alt)', 'route ask — Ask.jsx'],
  ], '');

  start('menu');
  await tap('.menu-btn', { wait: 400 }); await step('drawer open', [
    ['Text size & colours', 'route look — LookScreen (size/theme/density)'],
    ['People', 'route people — PeopleScreen'],
    ['Places', 'route locations — LocationsScreen'],
    ['Deleted items', 'route deleted — DeletedScreen'],
    ['Research log', 'route research — ResearchScreen'],
    ['Close', 'closes the drawer, back to Home'],
  ], '');
  await tap('.drawer-row:has-text("Places")', { wait: 500 });

  start('places');
  await step('Places list (LocationsScreen)', [
    ['a place row (loc-row, e.g. Kitchen counter)', 'route place — PlaceScreen for that name'],
    ['Add a place (btn-secondary, if canEdit)', 'opens the camera to photograph a brand-new place (place_new)'],
    ['Back (Header chevron)', 'back() to the menu-opening screen (Home)'],
  ], '');
  await tap('.loc-row:has-text("Kitchen counter")', { wait: 600 });

  start('place');
  await step('Kitchen counter’s page: no photo yet', [
    ['Take a photo (place-photo add)', 'opens the legacy Camera for this place (place_add)'],
    ['field-value (name)', 'inline rename (editing state) → Save/Cancel'],
    ['Remove this place (btn-secondary amber)', 'Confirm sheet → removePlace (things here keep the name as a bare string)'],
    ['Back', 'back() to Places list'],
  ], '');
  if (await count('.place-photo.add')) {
    await cam('closet.jpg'); await tap('.place-photo.add', { wait: 900 });
    await tap('.shutter', { wait: 700 }); await tap('.camera-done', { wait: 900 });
    await step('a photo added: trash icon now on the photo', [
      ['photo-trash (small, on the photo)', 'Confirm "Remove this photo?" → removePlacePhoto'],
      ['Add photo (place-photo add, 2 of 3 slots left)', 'opens the camera again, up to PLACE_PHOTOS=3'],
    ], '');
    await tap('.photo-trash.small', { wait: 400 }); await tap('.sheet-back .btn-secondary.amber', { wait: 700, force: true });
    await step('photo removed: back to "Take a photo"', [], '');
  }
  await tap('.header .back', { wait: 500 }).catch(() => {});

  start('settings');
  await home(); await tap('.tiny:has-text("Settings")', { wait: 700 });
  await page.locator('.lookpick').scrollIntoViewIfNeeded().catch(() => {}); await page.waitForTimeout(300);
  await step('gear-icon Settings: Taking photos', [
    ['Photo clear (lookopt)', 'sets prefs.cameraLook = "a" — the level chain is drawn ON the photo'],
    ['Answer card (lookopt, on by default)', 'sets prefs.cameraLook = "b" — a dark glass card over the photo'],
    ['Show times on photos (switch)', 'toggles prefs.showTimes'],
    ['(above, not shown) AI provider/key fields', 'configures engine.cfg'],
  ], '');

  start('find'); await home();
  await tap('.footer .btn-primary.alt', { wait: 600 }); await type('.ask input', 'wallet'); await page.locator('.ask input').blur(); await page.waitForTimeout(500);
  await step('Find/Ask: "wallet"', [
    ['ask input', 'free-text search (Ask.jsx matchThings)'],
    ['a result tile', 'onResult → route thing for that item'],
    ['Photograph it (if no result — not shown here)', 'onPhoto → openLog()'],
  ], '');

  start('write'); await home();
  await tap(LOG, { wait: 700 }); await tap('.lc-typeit button', { wait: 600 });
  await step('Write it down (NoteCard): before typing', [
    ['What is it? (#note-what)', 'name field'],
    ['Pick a place or box (path.in)', 'opens WhereList (onPick sets place text + dest)'],
    ['No place yet (path.later)', 'clears place/dest'],
    ['a place chip / box chip (guesses)', 'sets place to that chip'],
    ['Somewhere else (guess.other)', 'reveals a free-text place-input'],
    ['Keep this private (switch)', 'toggles priv; auto-on for a name/place that "looks private"'],
    ['Save (btn-primary, disabled until a name)', 'addItem with no photo (written:true)'],
  ], '');
  await page.fill('#note-what', 'spare fuse'); await tap('.guess:has-text("Hall table")', { wait: 400 });
  await step('typed name + a place chip picked', [], '');
  await tap('.note-card .btn-primary', { wait: 900 });
  await step('Saved: back on Home, a written tile (no photo)', [], '');

  start('thing-place'); await home();
  await tap('.tile:has-text("Wallet")', { wait: 700 });
  await step('a thing WITH a place (Wallet, on Hall table)', [
    ['Where it is (tp-wh)', 'shows the chain of photos/words to its place'],
    ['Move it (tp-btn)', 'onMove → openMove(item) → LogCamera with moveItem set, level 0 fixed'],
    ['Add photo (tp-row, under More)', 'setCamera({for:"add"}) → legacy Camera, appended to the same log'],
    ['Rename (tp-row)', 'inline rename sheet'],
    ['Keep this private / Share (switch or link)', 'privacy toggle'],
    ['Remove old photos… (if photoCount>1)', 'TidySheet'],
    ['Remove (tp-row red, owner only)', 'Confirm → softDeleteItem'],
    ['Back (chev)', 'back() to Home'],
  ], '');

  start('thing-noplace'); await home();
  await tap('.tile:has-text("Coffee can")', { wait: 700 });
  await step('a thing with NO place (Coffee can, needsPlace)', [
    ['No place yet (tp-wh, amber)', 'static label, not tappable'],
    ['Put it somewhere (tp-btn amber)', 'openMove(item) → LogCamera, level 0 fixed, level 1 already selected'],
  ], '');

  start('box'); await home();
  await tap('.tile:has-text("Memorabilia box")', { wait: 700 });
  await step('a container’s page: In it', [
    ['In it grid (tp-grid buttons: Wooden box, ...)', "each opens that thing's own page"],
    ['Put items in (tp-btn)', 'opens PutInSheet for this box (dest = this box)'],
    ['Log something in (tp-btn)', 'openLog({t:"thing", item:box}) → LogCamera, level 1 preset to this box'],
    ['Move it (tp-btn, since it also has a place)', 'openMove(item)'],
  ], '');
  await tap('.tp-btn:has-text("Put items in")', { wait: 700 });

  start('putin');
  await step('Put-in sheet for the memorabilia box', [
    ['search? (none — plain grid)', ''],
    ['a tile (thing not yet inside)', 'toggles pick (tick mark)'],
    ['Put in (putin-foot btn-primary, disabled until ≥1 picked)', 'onDone → one save for all picked things'],
    ['Cancel (btn-quiet)', 'closes with nothing changed'],
  ], '');
  await tap('.putin-grid .tile', { wait: 300 }); await step('one thing picked (tick shown)', [], '');
  await tap('.putin-sheet .btn-quiet', { wait: 500 });

  start('notput'); await home();
  await tap('.notput', { wait: 600 });
  await step('Not put away: things with no location and no holder', [
    ['a row (Coffee can)', "opens that thing's page (route thing)"],
    ['Back (chev)', 'back() to Home'],
  ], '');

  // =====================================================================================
  // PART 2 — the camera (LogCamera.jsx), look B (Answer card, default) then look A (Photo clear)
  // =====================================================================================
  async function cameraFlows(look) {
    await setPrefs({ cameraLook: look });
    const L = look.toUpperCase();

    // a) thing photo → Save (suggestion path: the photo shows a place used before)
    start(`${look}-a`); AI = { name: 'scissors', placeGuesses: ['Kitchen counter'], placeCertain: true }; WHERE = [];
    await home(); await cam('scissors.jpg'); await tap(LOG, { wait: 800 });
    await step(`${L} step 1: before the first photo`, [
      ['Cancel (lc-x)', 'no photo taken yet → onCancel() at once, no confirm'],
      ['Type it instead (on the photo)', 'onWrite → closes camera, opens NoteCard'],
      ['shutter (white ring: the thing)', 'photographs the thing, level 0'],
    ], '');
    await tap('.lc-shutter', { wait: 1300 });
    const sugg = /Kitchen counter/.test(await text('.lc-say'));
    await step('after the shot: the sentence already suggests a place (guess, in the photo)', [
      ['the thing square (lv-sq, stays selected, white)', 'reselect level 0 — tap again previews its photos'],
      ['＋ (amber, next level)', 'addLevel() — photograph level 1 explicitly'],
      ['a place/box chip', 'pickKnown — fills level 1 with that known place/box (skips the suggestion)'],
      ['pencil (lc-chg, next to the sentence)', 'Choice: Photograph it again / Pick from every place and box / No place yet'],
      ['+ Next', 'save(true) then reopen the camera at step 1 for another thing'],
      ['Save', 'save(false) — uses the suggestion since no level was filled'],
    ], sugg ? '' : 'suggestion did not appear — placeCertain guess may not have matched a known place name');
    await tap('.lc-k.sv', { wait: 1300 });
    const scA = await byName('scissors');
    await step('Saved via the suggestion, no level ever created', [], (scA && scA.location === 'Kitchen counter') ? '' : 'DEFECT: scissors did not land at the suggested place');

    // b) thing → ＋ level1 → photo of a NEW place (moves:false) → Save
    start(`${look}-b`); AI = { name: 'phone charger' }; WHERE = [{ name: 'linen closet shelf', moves: false }];
    await home(); await cam('charger.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
    await step('the thing photographed; level 1 not chosen yet', [['＋', 'addLevel → level 1, amber']], '');
    await tap('.lv-sq.plus', { wait: 300 });
    await step('level 1 chosen: "Where it goes"', [['shutter (amber ring)', 'photographs level 1']], '');
    await cam('closet.jpg'); await tap('.lc-shutter', { wait: 1600 });
    await step('level 1 named from the photo: a NEW fixed place (moves:false, no sure-match)', [
      ['＋ (blue, level 2)', 'would add a further level for where the shelf itself is'],
      ['Save', 'saveChain writes a NEW place doc for "Linen closet shelf" (addPlace, since it is not `known`)'],
    ], '');
    await tap('.lc-k.sv', { wait: 1600 });
    const chg = await byName('phone charger'); const pl1 = (await dump()).find((d) => d.kind === 'place' && d.name === 'Linen closet shelf');
    await step('Saved: a new place doc now exists, with the shelf photo as its picture', [], pl1 && (pl1.photos || []).length ? '' : 'the new place has no photo attached, or was not created as a place doc');

    // c) thing → ＋ level1 → photo that SURE-MATCHES a KNOWN box → "Your X?" → Yes → Save
    start(`${look}-c`); AI = { name: 'bank locker key' }; WHERE = [{ name: 'wooden box', moves: true, known: 'wooden box' }];
    await home(); await cam('keys.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
    await tap('.lv-sq.plus', { wait: 300 }); await cam('smallbox.jpg'); await tap('.lc-shutter', { wait: 1600 });
    await step('level 1: the fake AI is SURE this is the already-logged wooden box', [
      ['Yes (lc-ask)', 'setLevels …yes:true — the level becomes the known wooden box, its own photo dropped'],
      ['No, a new one (lc-ask)', 'keeps the just-taken photo as a brand new box instead'],
    ], (await count('.lc-ask')) ? '' : 'DEFECT: no "Your wooden box?" ask appeared for a sure match');
    await tap('.lc-ask button:has-text("Yes")', { wait: 700 });
    await step('confirmed: level 1 is the wooden box (known), the photo just taken is NOT kept on it', [
      ['Save', 'saveChain: {known:{t:"thing", item: wooden box}} — no addItem, no new photo added to the box'],
    ], '');
    await tap('.lc-k.sv', { wait: 1400 });
    const bk = await byName('bank locker key'); const ebk = bk ? await openTo(bk.id) : [];
    await step('Saved: the key is IN the wooden box (existing item, no duplicate box made)', [], (ebk[0] && ebk[0].to.id === 'w') ? '' : 'DEFECT: key did not land in the existing wooden box');

    // d) thing → level1 via CHIP (known place) → then ANOTHER photo on the same level → replace or attach?
    start(`${look}-d`); AI = { name: 'nail clippers' }; WHERE = [];
    await home(); await cam('real_slippers.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
    await tap('.lv-sq.plus', { wait: 300 });
    const chipLabelBefore = (await count('.lc-chips .lc-chip:not(.more)')) ? await text('.lc-chips .lc-chip:not(.more) span:last-child') : '';
    await tap('.lc-chips .lc-chip:not(.more)', { wait: 500 });
    await step(`level 1 filled by a CHIP (known: "${chipLabelBefore}") — 0 photos on this level`, [
      ['the level-1 square (now shows the chip’s thumb, no photo count)', 'tap once more: half-screen preview (but a known level has no photo to show)'],
    ], '');
    await cam('real_desk.jpg'); await tap('.lc-shutter', { wait: 1400 });
    const sayAfter = await text('.lc-say');
    await step('Q1: took ANOTHER photo while level 1 was still selected (still "known")', [], '');
    const n1 = await page.locator('.lv-sq').nth(1).locator('.lv-n').count();
    // REQUIREMENTS_2026-09-27 R1: this used to be F1 — a known pick's identity was silently discarded
    // by the next shutter press. R1 makes the shutter ATTACH instead: the pick is kept (as this line's
    // own "kept" verdict now shows) and the photo just joins it — the badge only renders once count > 1
    // (see LogCamera.jsx `s.n > 1`), so a single attached photo still shows no badge; that is expected,
    // not a sign anything was discarded.
    await step(`Q1 answer: the known pick was ${/desk/i.test(sayAfter) || !new RegExp(chipLabelBefore, 'i').test(sayAfter) ? 'REPLACED' : 'kept'} by the new photo (sentence now: "${sayAfter.replace(/\s+/g, ' ').slice(0, 60)}")`, [], n1 ? 'level shows a photo count > 1' : 'level shows no badge (count=1, badge only shows above 1) — the pick was attached to, not discarded (R1)');
    await tap('.lc-x', { wait: 500 }); if (await count('text=Throw away')) await tap('text=Throw away', { wait: 500 });

    // e) thing → ＋ level1 NEW BOX (moves:true) at the END of the chain (no level 2) → Save → Not put away?
    start(`${look}-e`); AI = { name: 'ticket stubs' }; WHERE = [{ name: 'shoe box', moves: true }];
    await home(); await cam('real_cetaphil.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
    await tap('.lv-sq.plus', { wait: 300 }); await cam('box.jpg'); await tap('.lc-shutter', { wait: 1600 });
    await step('level 1: a brand-new box (moves:true), nothing follows it (no level 2)', [
      ['＋ (would add level 2 — where the shoe box itself is)', 'left untouched here on purpose'],
      ['Save', 'saveChain: addItem for the shoe box with location:"" (it is the outermost/last link, so no outer place)'],
    ], '');
    await tap('.lc-k.sv', { wait: 1600 });
    const shoebox = await byName('shoe box');
    await step('Saved: the new box now exists with no place of its own', [], shoebox && !shoebox.location ? '' : 'the new box unexpectedly got a location');
    await home();
    await step('Home: does the new placeless box show under Not put away?', [['Not put away', 'opens the list']], '');
    await tap('.notput', { wait: 600 });
    const listedShoebox = /Shoe box/i.test(await text('.np-list').catch(() => ''));
    // REQUIREMENTS_2026-09-27 R6.3 (done in Stage 1): a box made only as WHERE something else goes
    // (asWhere) is deliberately excluded from Not put away — it isn't a chore, it's plumbing. Not
    // appearing here is now the intended behavior, not the "DEFECT/finding" this line used to call it.
    await step('Q4 (part): Not put away, after (e)', [], listedShoebox ? 'DEFECT: an asWhere box (R6.3) should NOT be listed as a chore' : 'correct (R6.3): the new asWhere box does not appear on Not put away');

    // f) typed path: pencil → "Pick from every place and box" → type brand-new name → "A new place called …" → Save
    start(`${look}-f`); AI = { name: 'sewing kit', placeGuesses: ['Hall table'], placeCertain: true }; WHERE = [];
    await home(); await cam('real_painting.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
    await step('a suggestion is showing (links.length>0 from the guess), so the pencil is available', [['pencil (lc-chg)', 'Choice: Photograph it again / Pick from every place and box / No place yet / Cancel']], (await count('.lc-chg')) ? '' : 'DEFECT: no pencil next to the sentence to change where it goes');
    await tap('.lc-chg', { wait: 500 });
    await step('Choice sheet', [], '');
    await tap('text=Pick from every place and box', { wait: 600 });
    await step('WhereList (every place and box, search, "New place or box: photograph it")', [
      ['search input', 'filters places/boxes below by name'],
      ['New place or box: photograph it (if onPhotograph given)', 'addLevel() and closes the sheet, back to the camera'],
      ['typing a name that matches nothing existing', 'reveals "A new place called “…”"'],
    ], '');
    await type('.wl-search input', 'Attic crawlspace shelf');
    await step('typed a brand-new name', [['A new place called “Attic crawlspace shelf” (wl-new.typed)', 'pickKnown({t:"place", name}) — becomes a KNOWN level with 0 photos, never addPlace’d until Save']], '');
    await tap('.wl-new.typed', { wait: 500 });
    await step('level 1 is now the typed place (no photo slot for it at all)', [['Save', 'saveChain writes location text only — see Q2/Q3']], '');
    await tap('.lc-k.sv', { wait: 1300 });
    const sk = await byName('sewing kit'); const placeDoc = (await dump()).find((d) => d.kind === 'place' && d.name === 'Attic crawlspace shelf');
    await step('Saved: the typed place is on the item as text', [], (sk && /attic crawlspace shelf/i.test(sk.location || '')) ? (placeDoc ? 'a place DOC was also created (has photos: ' + JSON.stringify((placeDoc.photos || []).length) + ')' : 'no place doc exists at all for it — it is a bare string, so it can never hold a photo') : 'DEFECT: typed place text did not stick to the item');

    // g) "+ Next" sweep: two things in a row
    start(`${look}-g`); AI = { name: 'first thing' }; WHERE = [];
    await home(); await cam('real_desk.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
    await step('first thing photographed', [['+ Next (lc-k.sn)', 'save(true): saves this thing, then RESETS the camera to step 1 for another']], '');
    await tap('.lc-k.sn', { wait: 1300 });
    await step('camera reset to "Photograph the item" — the toast for #1 shows on Home underneath (not visible: camera is modal)', [], (await count('.lc-view')) ? '' : 'DEFECT: +Next did not keep the camera open');
    AI = { name: 'second thing' }; await cam('real_slippers.jpg'); await tap('.lc-shutter', { wait: 1300 });
    await step('second thing photographed in the same sweep', [['Save', 'save(false): saves #2 and closes the camera']], '');
    await tap('.lc-k.sv', { wait: 1300 });
    const t1 = await byName('first thing'); const t2 = await byName('second thing');
    await step('Saved: both things now exist', [], (t1 && t2) ? '' : 'DEFECT: +Next sweep lost one of the two things');

    // h) Cancel paths and the throw-away confirm
    start(`${look}-h`); AI = { name: 'unused thing' }; WHERE = [];
    await home(); await tap(LOG, { wait: 800 });
    await step('before any photo', [['Cancel', 'tryCancel(): nothing taken yet → onCancel() at once, no confirm sheet']], '');
    await tap('.lc-x', { wait: 500 });
    await step('Cancel with no photo: straight back to Home, no confirm asked', [], (await count('.board')) ? '' : 'DEFECT: Cancel with no photo did not return to Home directly');
    await tap(LOG, { wait: 700 }); await cam('real_desk.jpg'); await tap('.lc-shutter', { wait: 1300 });
    await step('a photo now exists', [['Cancel', 'tryCancel(): a photo exists → Confirm "Throw these photos away?"']], '');
    await tap('.lc-x', { wait: 500 });
    await step('Confirm sheet', [['Keep going', 'closes the sheet, camera stays open with the photo intact'], ['Throw away', 'onCancel(): discards everything, back to Home']], (await count('text=Throw these photos away')) ? '' : 'DEFECT: no confirm shown even though a photo was taken');
    await tap('text=Keep going', { wait: 500 });
    await step('kept going: the photo is still there', [], (await count('.lc')) ? '' : 'DEFECT: Keep going did not keep the camera open');
    await tap('.lc-x', { wait: 500 }); await tap('text=Throw away', { wait: 600 });
    const gone = !(await byName('unused thing'));
    await step('Threw away: back on Home, nothing saved', [], gone ? '' : 'DEFECT: Throw away saved the item anyway');

    // i) move flow: a thing's page → Move it (camera with level 0 fixed)
    start(`${look}-i`); await home(); await tap('.tile:has-text("Wallet")', { wait: 700 });
    await tap('.tp-btn:has-text("Move it")', { wait: 900 });
    await step('Move it: the wallet is level 0 (already photographed, fixed), level 1 chosen for a new place', [
      ['level-0 square (the wallet’s own thumb)', 'tap opens its photo preview only (no re-shoot: moveItem level 0 is fixed)'],
      ['shutter (amber ring: level 1)', 'photographs the NEW place directly, no "where it goes" typing needed first'],
      ['a chip', 'picks a known place/box for level 1 instead'],
      ['Save (disabled until level 1 is filled)', 'changeLocation(wallet, …) — moves it, does not duplicate it'],
    ], '');
    await cam('real_painting.jpg'); await tap('.lc-shutter', { wait: 1400 });
    await step('level 1 photographed: the wallet’s new place', [], '');
    await tap('.lc-k.sv', { wait: 1400 });
    const w2 = await byName('wallet');
    await step('Saved: the wallet moved (same item, new location, Undo on the toast)', [], (w2 && w2.location && w2.location !== 'Hall table') ? '' : 'DEFECT: Move it did not change the wallet’s location');
  }

  await cameraFlows('b'); // Answer card (default)
  await seedHouse(); // fresh house so look A repeats the same starting conditions
  await cameraFlows('a'); // Photo clear

  fs.appendFileSync(MDPATH, `\n---\n**Page errors during the whole walk:** ${errors.length ? errors.join(' \\| ') : 'none'}\n\n` +
    `**Console errors:** ${consoleErrors.length ? Array.from(new Set(consoleErrors)).slice(0, 20).join(' \\| ') : 'none'}\n`);
  console.log('\nPage errors:', errors.length ? errors : 'none');
  console.log('Console errors (unique):', Array.from(new Set(consoleErrors)).length);
  await browser.close(); server.close();
})();
