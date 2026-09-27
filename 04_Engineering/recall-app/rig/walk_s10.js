// S10 — build 1 walked (2026-09-27): the camera that answers "where", in both looks, with a REAL photo in
// the viewfinder at every shot. Same method as walk_s9.js (the walk of the old app): a screenshot per step,
// taps counted, element boxes recorded. Also asserts what must be true (PASS/FAIL) so it doubles as the audit.
// node walk_s10.js → shots/s10/<flow>-<n>.png + walk.json
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const PORT = 8100; const ROOT = path.join(__dirname, 'out');
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, req.url.split('?')[0] === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
const img = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(__dirname, 'mock/img', f)).toString('base64');
const OUT = 'shots/s10'; fs.mkdirSync(OUT, { recursive: true });
const results = []; const check = (name, ok, note = '') => { results.push({ name, ok: !!ok, note }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${note ? ' — ' + note : ''}`); };

// The fake AI, per scene: the thing's tag, the "where" answers in order, the visual check.
let AI = { name: 'thing' }; let WHERE = []; let SAME = { index: -1, sure: false };
const walk = []; const errors = [];

(async () => {
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
      // index: the fake says which SAVED name it recognises (by name), 1-based, as the real prompt asks.
      let index = 0; if (w.known) { const m = [...texts.matchAll(/SAVED (\d+) — "([^"]*)"/g)].find((x) => x[2].toLowerCase() === w.known.toLowerCase()); index = m ? Number(m[1]) : 0; }
      out = { name: w.name, moves: !!w.moves, index, sure: !!index };
    } else if (/NEW PHOTO/.test(texts)) out = SAME;
    else if (images) out = { name: AI.name, sameAs: AI.sameAs || '', alternatives: [], restingOn: AI.restingOn || '', placeCertain: !!AI.placeCertain, placeGuesses: AI.placeGuesses || [], description: '', details: AI.details || '', private: !!AI.private, privateWhy: AI.privateWhy || '', secretVisible: false };
    else out = { matches: [], message: '' };
    await new Promise((r) => setTimeout(r, 250));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [{ type: 'text', text: JSON.stringify(out) }] }) });
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/camera/.test(m.text())) errors.push('console: ' + m.text().slice(0, 160)); });

  let flow = '', n = 0, taps = 0;
  const start = (f) => { flow = f; n = 0; taps = 0; };
  const tap = async (sel, opts = {}) => { await page.locator(sel).first().click(opts); taps += 1; await page.waitForTimeout(opts.wait || 450); };
  const cam = async (f) => { await page.evaluate((s) => { window.__cam = s; }, img(f)); await page.waitForTimeout(250); };
  const step = async (caption) => {
    n += 1; await page.waitForTimeout(350);
    const file = `${flow}-${String(n).padStart(2, '0')}.png`;
    await page.screenshot({ path: `${OUT}/${file}` });
    walk.push({ flow, n, file, caption, taps });
    console.log(`${file}  taps=${taps}  ${caption}`);
  };
  const dump = () => page.evaluate(() => window.__rig.dump());
  const items = async () => (await dump()).filter((d) => d.kind === 'item' && !d.deleted);
  const byName = async (nm) => (await items()).find((d) => (d.name || '').toLowerCase() === nm.toLowerCase());
  const openTo = async (id) => (await dump()).filter((d) => d.kind === 'edge' && d.from === id && !d.until);
  const text = (sel) => page.locator(sel).first().innerText().catch(() => '');
  const count = (sel) => page.locator(sel).count();
  const setPrefs = (patch) => page.evaluate((p) => { const x = JSON.parse(localStorage.getItem('recall-prefs') || '{}'); Object.assign(x, p); localStorage.setItem('recall-prefs', JSON.stringify(x)); }, patch);

  // ---- Margaret's house, as in walk_s9
  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen');
  await page.evaluate(() => { localStorage.clear(); window.__rig.reset(); localStorage.setItem('rig-uid', 'mg'); localStorage.setItem('rig-anon', '0');
    localStorage.setItem('recall-ai-config', JSON.stringify({ provider: 'anthropic', apiKey: 'sk-ant-rig', model: '' })); });
  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen'); await page.waitForTimeout(400);
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
  await page.waitForTimeout(500);
  const home = async () => { await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board'); await page.waitForTimeout(400); };
  const LOG = '.footer .btn-primary:not(.alt)';

  // ===== W1 · a thing at a place used before: the photo shows the kitchen counter → 3 taps
  start('w1'); AI = { name: 'scissors', placeGuesses: ['Kitchen counter'], placeCertain: true };
  await home(); await cam('scissors.jpg'); await tap(LOG, { wait: 900 });
  await step('Log item: step 1');
  check('C1 no mode row, no title; Cancel is a button top-left; Type it instead above the shutter', await count('.modes') === 0 && await count('.lc-x') === 1 && await count('.lc-typeit button') === 1);
  check('C2 before the first photo there is nothing to save', await count('.lc-k') === 0);
  await tap('.lc-shutter', { wait: 1500 }); await step('Shutter: the scissors; the photo shows the counter');
  check('W1 the sentence already says Kitchen counter (the photo shows it) — Save is one tap', /Kitchen counter/.test(await text('.lc-say')), await text('.lc-say'));
  check('C3 + Next | shutter | Save in one row; one verb per button', (await text('.lc-k.sn')).replace(/\s/g, '') === '+Next' && (await text('.lc-k.sv')).trim() === 'Save');
  const gap = await page.evaluate(() => { const s = document.querySelector('.lc-shutter').getBoundingClientRect(); const a = document.querySelector('.lc-k.sn').getBoundingClientRect(); const b = document.querySelector('.lc-k.sv').getBoundingClientRect(); return [Math.round(s.left - a.right), Math.round(b.left - s.right), Math.round(a.width), Math.round(b.width)]; });
  check('C4 27 px clear of the shutter on each side; side buttons ~119 px', gap[0] >= 26 && gap[1] >= 26 && gap[2] <= 121 && gap[3] <= 121, JSON.stringify(gap));
  await tap('.lc-k.sv', { wait: 1500 }); await step('Save: Home shows what was saved');
  const sc = await byName('scissors'); const e1 = sc ? await openTo(sc.id) : [];
  check('W1 3 taps: scissors saved at the kitchen counter (place edge)', taps === 3 && sc && sc.location === 'Kitchen counter' && e1.length === 1 && e1[0].to.t === 'place', `taps ${taps} · ${sc && sc.location}`);
  check('W1 Home card shows the chain and Undo', await count('.saved-card .trail img') >= 1 && await count('.saved-card .u') === 1 && /Kitchen counter/.test(await text('.saved-card')));

  // ===== W2 · into a box already logged, by its photo (the wooden box), and bug #10 (a "1978 diary")
  start('w2'); AI = { name: '1978 diary' }; WHERE = [{ name: 'wooden box', moves: true, known: 'wooden box' }]; SAME = { index: -1, sure: false };
  await home(); await cam('diary.jpg'); await tap(LOG, { wait: 900 }); await tap('.lc-shutter', { wait: 1600 });
  await step('The diary: no "Your yearbook?" (bug #10)');
  check('B10 a shared number no longer makes a match: no "Your yearbook 1978?"', !/yearbook/i.test(await text('.lc')), (await text('.lc-card')).slice(0, 80));
  await cam('smallbox.jpg'); await tap('.lc-shutter', { wait: 1800 }); await step('Step back: the wooden box — asked, not assumed');
  check('W2 the box is recognised and ASKED ("Your wooden box?")', /Your wooden box\?/.test(await text('.lc')));
  check('W2 the sentence: in the wooden box, then where that is', /In the wooden box/.test(await text('.lc-say')) && /Memorabilia box/i.test(await text('.lc-say')), await text('.lc-say'));
  await tap('.lc-ask button:has-text("Yes")', { wait: 400 }); await step('Yes');
  await tap('.lc-k.sv', { wait: 1500 }); await step('Save');
  const di = await byName('1978 diary'); const yb = await byName('yearbook 1978'); const e2 = di ? await openTo(di.id) : [];
  const ey = await openTo('y');
  check('W2 the diary is a NEW thing in the wooden box; the yearbook did not move', di && e2.length === 1 && e2[0].to.id === 'w' && ey.length === 1 && ey[0].to.id === 'm' && yb.location === 'Memorabilia box', `taps ${taps}`);

  // ===== W3 · your example: key → a tin never logged → the linen closet shelf; 5 taps, nothing typed
  start('w3'); AI = { name: 'bank locker key', private: true, privateWhy: 'looks like bank details' }; WHERE = [{ name: 'blue tin', moves: true }, { name: 'linen closet shelf', moves: false }];
  await home(); await cam('keys.jpg'); await tap(LOG, { wait: 900 }); await tap('.lc-shutter', { wait: 1600 });
  await step('Step 1 done: the key (only me)');
  check('W3 private by default, told on the camera: Kept private … Share it instead · On this phone only (greyed)', /Kept private/.test(await text('.lc .privnote')) && /Share it instead/.test(await text('.lc .privnote')) && await count('.lc .privnote .phone-only') === 1);
  await cam('tin.jpg'); await tap('.lc-shutter', { wait: 1800 }); await step('Step back: the blue tin');
  check('W3 the tin is named and becomes the first link; Save says nothing, the sentence says it', /In the blue tin/.test(await text('.lc-say')), await text('.lc-say'));
  await cam('closet.jpg'); await tap('.lc-shutter', { wait: 1800 }); await step('Step back again: the shelf');
  check('W3 the sentence: In the blue tin / Linen closet shelf', /In the blue tin/.test(await text('.lc-say')) && /Linen closet shelf/i.test(await text('.lc-say')), await text('.lc-say'));
  await page.locator('.lc-strip .lc-ph').nth(1).click(); await page.waitForTimeout(400); await step('Tap a photo: half-screen preview');
  check('P1 tapping a chain photo opens it half-screen; tap anywhere closes', await count('.lc-pv') === 1);
  await page.locator('.lc-pv').click({ position: { x: 20, y: 20 } }); await page.waitForTimeout(300);
  check('P2 …closed', await count('.lc-pv') === 0);
  await tap('.lc-k.sv', { wait: 2200 }); await step('Save: the chain on Home');
  const key = await byName('bank locker key'); const tin = await byName('blue tin');
  const ek = key ? await openTo(key.id) : []; const et = tin ? await openTo(tin.id) : [];
  const pl = (await dump()).find((d) => d.kind === 'place' && d.name === 'Linen closet shelf');
  check('W3 5 taps, nothing typed', taps === 5, `taps ${taps}`);
  check('W3 the key is IN the new tin (an edge), private', key && ek.length === 1 && ek[0].to.id === (tin && tin.id) && key.private === true);
  check('W3 the tin has its photo and is ON the new shelf; the shelf is a place with its own photo', tin && tin.thumb && et.length === 1 && et[0].to.t === 'place' && et[0].to.name === 'Linen closet shelf' && pl && (pl.photos || []).length === 1);
  check('W3 the tin is not a chore: "Not put away" does not count it', !/Not put away · 2/.test(await text('.board-wrap, .screen')));
  await page.waitForTimeout(8500);
  await tap('.footer .btn-primary.alt', { wait: 600 }); await page.fill('.ask input', 'locker key'); await page.locator('.ask input').blur(); await page.waitForTimeout(500);
  await step('Find: "locker key"');
  const hit = page.locator('.ask .tile').first(); if (await hit.count()) { await hit.click(); await page.waitForTimeout(700); await step('The key: in the blue tin, on the shelf'); }
  check('W3 Find → the key says in the blue tin, and where the tin is', /blue tin/i.test(await text('.thing-head')) || /Linen closet shelf/.test(await text('.card.thing')), (await text('.thing-head')).slice(0, 80));

  // ===== W4 · log now, place later: 3 taps
  start('w4'); AI = { name: 'phone charger' }; WHERE = [];
  await home(); await cam('charger.jpg'); await tap(LOG, { wait: 900 }); await tap('.lc-shutter', { wait: 1500 });
  await step('The charger: "No place yet"');
  check('W4 with no where, the sentence says No place yet', /No place yet/.test(await text('.lc-say')));
  await tap('.lc-k.sv', { wait: 1500 }); await step('Save: no place yet');
  const ch = await byName('phone charger');
  check('W4 3 taps, saved with no place, the card says so', taps === 3 && ch && !ch.location && /No place yet/.test(await text('.saved-card')));
  await tap('.saved-card .u', { wait: 1200 }); await step('Undo');
  check('U1 Undo takes the new thing away completely', !(await byName('phone charger')));

  // ===== W5 · reading glasses again: "Your reading glasses?" is asked, never assumed; Save asks if unanswered
  start('w5'); AI = { name: 'reading glasses', sameAs: 'reading glasses' }; WHERE = [];
  await home(); await cam('glasses.jpg'); await tap(LOG, { wait: 900 }); await tap('.lc-shutter', { wait: 1500 });
  await step('Your reading glasses? (asked)');
  check('I1 a thing already logged is asked about on the camera', /Your reading glasses\?/.test(await text('.lc')));
  check('I2 …and its usual place is the suggestion', /Hall table/.test(await text('.lc-say')), await text('.lc-say'));
  await tap('.lc-k.sv', { wait: 700 }); await step('Save without answering: asked first');
  check('I3 Save never merges silently: it asks', await count('.choice, .sheet') >= 1 && /Is this your reading glasses/.test(await text('body')));
  await tap('text=Yes, the same thing', { wait: 1500 }); await step('Yes → saved as the same glasses');
  const gl = (await items()).filter((d) => d.name === 'reading glasses');
  check('I4 still one pair of reading glasses', gl.length === 1);

  // ===== W6 · Log here, from inside the wooden box; + Next keeps the camera open
  start('w6'); AI = { name: 'ticket stubs' }; WHERE = [];
  await home(); await tap('.tile:has-text("Memorabilia box")', { wait: 700 }); await tap('.tile:has-text("Wooden box")', { wait: 700 });
  await step('Inside the wooden box');
  await cam('card.jpg'); await tap('.footer .btn-primary:has-text("Log here")', { wait: 900 }); await tap('.lc-shutter', { wait: 1500 });
  await step('Log here: "In the wooden box · here"');
  check('H1 Log here: the box is already the place', /In the wooden box/.test(await text('.lc-say')), await text('.lc-say'));
  await tap('.lc-k.sn', { wait: 1500 }); await step('+ Next: saved, camera open for the next thing');
  check('N1 + Next saves and keeps the camera open at step 1', await count('.lc') === 1 && /Photograph the thing/.test(await text('.lc-prompt')) && !!(await byName('ticket stubs')));
  AI = { name: 'old letters' }; await cam('book.jpg'); await tap('.lc-shutter', { wait: 1500 });
  await step('The next thing: the box is kept ("just used"… here)');
  check('N2 the next thing goes in the same box unless she changes it', /In the wooden box/.test(await text('.lc-say')));
  await tap('.lc-k.sv', { wait: 1500 });
  const ol = await byName('old letters'); const eo = ol ? await openTo(ol.id) : [];
  check('N3 old letters in the wooden box', eo.length === 1 && eo[0].to.id === 'w');

  // ===== W7 · look A (Photo clear), your example again, and Cancel
  start('w7'); await setPrefs({ cameraLook: 'a' }); AI = { name: 'spare key' }; WHERE = [{ name: 'blue tin', moves: true, known: 'blue tin' }];
  await home(); await cam('keys.jpg'); await tap(LOG, { wait: 900 }); await step('A · step 1');
  await tap('.lc-shutter', { wait: 1500 }); await step('A · step 2');
  check('A1 look A: the chain is on the photo, names under each, aligned', await count('.lc-chain .lc-t') >= 2);
  await cam('tin.jpg'); await tap('.lc-shutter', { wait: 1800 }); await step('A · the blue tin, recognised and asked');
  const tops = await page.evaluate(() => [...document.querySelectorAll('.lc-chain .lc-ph')].map((e) => Math.round(e.getBoundingClientRect().top)));
  check('A2 the photos in the chain line up', new Set(tops).size === 1, JSON.stringify(tops));
  await tap('.lc-x', { wait: 500 }); await step('Cancel: asked before throwing photos away');
  check('X1 Cancel after a photo asks first', /Throw these photos away/.test(await text('body')));
  await tap('text=Throw away', { wait: 700 });
  check('X2 …nothing saved', !(await byName('spare key')));
  await setPrefs({ cameraLook: 'b' });

  // ===== W8 · Settings → Taking photos
  start('w8'); await home(); await page.click('.tiny:has-text("Settings")'); await page.waitForSelector('.lookpick'); await page.locator('.lookpick').scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
  await step('Settings → Taking photos → The camera');
  check('S1 both looks offered by picture; Answer card is on by default', await count('.lookopt') === 2 && /Answer card/.test(await text('.lookopt.on')));

  // ===== W9 · bug #29: the coffee can's card, Edit, Where it is — nothing off the edge
  start('w9'); await home(); await page.click('.tile:has-text("Coffee can")'); await page.waitForSelector('.card.thing'); await page.waitForTimeout(400);
  const wide = await page.evaluate(() => document.documentElement.scrollWidth);
  if (!(await page.locator('.fix .field-value[aria-label^="Where it is"]').isVisible())) await page.click('.act:has-text("Edit")');
  await page.click('.fix .field-value[aria-label^="Where it is"]'); await page.waitForSelector('.place-sheet'); await page.waitForTimeout(300);
  await step('Bug #29: the sheet stays on the screen');
  const sh = await page.evaluate(() => { const r = document.querySelector('.place-sheet').getBoundingClientRect(); return [Math.round(r.left), Math.round(r.right)]; });
  check('B29 the page is no wider than the phone and the sheet fits', wide <= 390 && sh[0] >= 0 && sh[1] <= 390, `${wide} ${JSON.stringify(sh)}`);

  // ===== W10 · the button rule elsewhere: Put away, Write it down
  start('w10'); await home(); await page.click('.notput'); await page.waitForTimeout(500); await page.click('.place-sheet .guess:has-text("Hall table")'); await page.waitForTimeout(500);
  await page.click('.putin-grid .tile >> nth=0'); await page.waitForTimeout(300);
  await step('Put away: one verb, the sentence above');
  check('R1 Put away: the button is one verb; the sentence says what and where', (await text('.putin-foot .btn-primary')).trim() === 'Put away' && /1 thing/.test(await text('.putin-foot .lc-say')));
  await home(); await tap(LOG, { wait: 700 }); await tap('.lc-typeit button', { wait: 600 }); await page.fill('#note-what', 'spare fuse'); await page.locator('#note-what').blur(); await page.waitForTimeout(300);
  await step('Write it down: Save, with the sentence above');
  check('R2 Write it down: "Save" (not "Save without a place"), the sentence says No place yet', (await text('.note-card .btn-primary')).trim() === 'Save' && /No place yet/.test(await text('.note-card .lc-say')));
  // ===== W11 · Largest text: the camera still fits
  start('w11'); await setPrefs({ size: 'largest' }); AI = { name: 'bank locker key' }; WHERE = [{ name: 'blue tin', moves: true, known: 'blue tin' }];
  await home(); await cam('keys.jpg'); await tap(LOG, { wait: 900 }); await step('Largest · step 1');
  await tap('.lc-shutter', { wait: 1500 }); await cam('tin.jpg'); await tap('.lc-shutter', { wait: 1800 });
  await step('Largest · the tin');
  const fit = await page.evaluate(() => { const ok = (el) => !el || (el.scrollWidth <= el.clientWidth + 1); const row = document.querySelector('.lc-row').getBoundingClientRect();
    return ok(document.querySelector('.lc-k.sn')) && ok(document.querySelector('.lc-k.sv')) && row.bottom <= innerHeight && document.documentElement.scrollWidth <= 390; });
  check('L1 Largest: + Next and Save fit their buttons; the row is on screen; nothing off the edge', fit);
  await page.click('.lc-x'); await page.waitForTimeout(300); if (await count('text=Throw away')) await page.click('text=Throw away');
  await setPrefs({ size: 'normal' });

  fs.writeFileSync(`${OUT}/walk.json`, JSON.stringify(walk, null, 1));
  const fails = results.filter((r) => !r.ok);
  console.log(`\n${results.length - fails.length}/${results.length} passed`); if (fails.length) console.log('FAILED:', fails.map((f) => f.name).join(' | '));
  console.log('errors:', errors.length ? errors : 'none');
  await browser.close(); server.close();
})();
