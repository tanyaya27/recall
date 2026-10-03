// 10-02 "One where, photo first" (Ravi; BOARD_2026-10-02_one-where.md rounds 1-4, OPTIONS_2026-10-02_one-where-A4.jpg).
// Ravi's Walgreens sequence first (R1-R4), then the A4 rules. Drives the real camera; reads the store after every save.
// node audit_ow.js   (after ./build.sh)    ENGINE=webkit node audit_ow.js
const pw = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const PORT = Number(process.env.PORT || 8441); const ROOT = path.join(__dirname, 'out');
const server = http.createServer((req, res) => { const f = path.join(ROOT, req.url.split('?')[0] === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); });
const img = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(__dirname, 'mock/img', f)).toString('base64');
const OUT = path.join(__dirname, 'shots_ow'); fs.mkdirSync(OUT, { recursive: true });
const results = []; const errors = [];
const check = (id, name, ok, note = '') => { results.push({ id, name, ok: !!ok, note }); console.log(`${ok ? 'PASS' : 'FAIL'}  [${id}] ${name}${note ? ' — ' + String(note).slice(0, 300) : ''}`); };
let AI = { name: 'thing' }; let GUESS = { name: 'Lab bench with a laptop', merged: 'Lab desk with a laptop' }; let guessCalls = []; let guessImgs = []; let GUESS_DELAY = 250;
(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const eng = process.env.ENGINE === 'webkit' ? pw.webkit : pw.chromium;
  const browser = await eng.launch(process.env.ENGINE === 'webkit' ? {} : { args: ['--use-fake-ui-for-media-stream'] });
  const ctx = await browser.newContext({ ...(process.env.ENGINE === 'webkit' ? {} : { permissions: ['camera'] }), viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: process.env.ENGINE !== 'webkit' ? true : undefined, hasTouch: true });
  await ctx.addInitScript(() => { const c = document.createElement('canvas'); c.width = 960; c.height = 1280; const g = c.getContext('2d'); const im = new Image(); let src = '';
    const paint = () => { if (window.__cam && window.__cam !== src) { src = window.__cam; im.src = src; } g.fillStyle = '#222'; g.fillRect(0, 0, c.width, c.height);
      if (im.complete && im.naturalWidth) { const s = Math.max(c.width / im.naturalWidth, c.height / im.naturalHeight); const w = im.naturalWidth * s, h = im.naturalHeight * s; g.drawImage(im, (c.width - w) / 2, (c.height - h) / 2, w, h); } };
    setInterval(paint, 60); const md = navigator.mediaDevices || {}; Object.defineProperty(navigator, 'mediaDevices', { value: md, configurable: true }); md.getUserMedia = async () => { paint(); return c.captureStream(15); }; });
  await ctx.route('https://api.anthropic.com/**', async (route) => { const body = JSON.parse(route.request().postData() || '{}'); const content = body.messages?.[0]?.content || [];
    const texts = content.filter((b) => b.type === 'text').map((b) => b.text).join('\n'); const images = content.filter((b) => b.type === 'image').length; let out; let delay = 250;
    if (/PLACE GUESS/.test(texts)) { const m = texts.match(/TYPED: "([^"]*)"/); guessCalls.push(m ? m[1] : null); guessImgs.push(images); out = GUESS; delay = GUESS_DELAY; }
    else if (/NEW PHOTO/.test(texts)) out = { index: -1, sure: false };
    else if (images) out = { name: AI.name, sameAs: '', alternatives: [], restingOn: '', placeCertain: false, placeGuesses: [], description: '', details: '', private: false, privateWhy: '', secretVisible: false };
    else out = { matches: [], message: '' };
    await new Promise((r) => setTimeout(r, delay)); await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [{ type: 'text', text: JSON.stringify(out) }] }) }); });
  const page = await ctx.newPage(); page.setDefaultTimeout(Number(process.env.TO || 4000)); page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/camera/.test(m.text())) errors.push('console: ' + m.text().slice(0, 200)); });
  const W = (ms) => page.waitForTimeout(ms);
  const tap = async (sel, w = 450) => { await page.locator(sel).first().click(); await W(w); };
  const cam = async (f) => { await page.evaluate((s) => { window.__cam = s; }, img(f)); await W(250); };
  const shoot = async (f) => { await cam(f); await tap('.lc-shutter', 900); };
  const dump = () => page.evaluate(() => window.__rig.dump());
  const items = async () => (await dump()).filter((d) => d.kind === 'item' && !d.deleted);
  const byName = async (n) => (await items()).find((d) => (d.name || '').toLowerCase() === n.toLowerCase());
  const placeBy = async (n) => (await dump()).find((d) => d.kind === 'place' && (d.name || '').toLowerCase() === n.toLowerCase());
  const edgeOf = async (id) => (await dump()).find((d) => d.kind === 'edge' && d.from === id && !d.until) || null;
  const txt = (sel) => page.locator(sel).first().innerText().catch(() => '');
  const has = async (sel) => (await page.locator(sel).count()) > 0;
  const snap = async (f) => { await W(250); await page.screenshot({ path: path.join(OUT, f) }); };
  const home = async () => { await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board, .screen'); await W(400); await page.evaluate(() => { window.__noAuto = true; }); };
  const LOG = '.footer .btn-primary:not(.alt)';
  const openThing = async (nm) => { await home(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', nm); await W(500); await page.click('.ask .tile >> nth=0'); await page.waitForSelector('.thing-page'); await W(400); };
  const openMove = async (nm) => { await openThing(nm); await tap('.thing-page button:has-text("Move it")', 900); };
  const save = async () => { await tap('.lc-k.sv', 1300); };
  const typeWhere = async (s) => { await page.locator('.ow-input').click(); await W(150); await page.locator('.ow-input').fill(s); await W(250); };
  const done = async () => { await page.locator('.ow-input').press('Enter'); await W(250); };

  // ---- seed: Ravi's house ----
  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen');
  await page.evaluate(() => { localStorage.clear(); window.__rig.reset(); localStorage.setItem('rig-uid', 'margaret'); localStorage.setItem('rig-anon', '0');
    localStorage.setItem('recall-ai-config', JSON.stringify({ provider: 'anthropic', apiKey: 'sk-ant-rig', model: '' })); });
  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen'); await W(300);
  const now = Date.now(), H = 3600e3;
  const own = { owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [] };
  const T = (id, name, loc, f, ago, extra = {}) => ({ id, kind: 'item', ...own, name, location: loc, photo: img(f), thumb: img(f), thumbV: 2, order: now - ago, createdAt: now - ago, lastSeenAt: now - ago, logId: 'l_' + id, photoCount: 1, history: [{ location: loc, at: now - ago }], ...extra });
  const PL = (id, nm, f, ago) => ({ id, kind: 'place', ...own, name: nm, order: now - ago, createdAt: now - ago, parent: null, photos: f ? [{ photo: img(f), thumb: img(f), at: now - ago }] : [] });
  const E = (id, from, to, ago) => ({ id, kind: 'edge', rel: 'in', from, to, since: now - ago, until: null, how: 'chosen', ...own });
  await page.evaluate((s) => window.__rig.seed(s), [
    T('br', 'Walgreens Photo brochure', 'Workbench or desk', 'folder.jpg', 2 * H, { history: [{ location: 'Workbench or desk', at: now - 2 * H }] }),
    T('gl', 'reading glasses', 'Desk drawer', 'glasses.jpg', 3 * H),
    T('ky', 'keys', '', 'keys.jpg', 4 * H, { history: [{ location: '', at: now - 4 * H, by: 'margaret', w: 1, said: 'in my coat pocket' }] }),
    T('tin', 'blue tin', 'Desk drawer', 'tin.jpg', 5 * H, { holds: true }),
    PL('p1', 'Workbench or desk', 'tooldrawer.jpg', 90 * H), PL('p2', 'Desk drawer', 'drawer.jpg', 80 * H), PL('p3', 'Office', 'closet.jpg', 70 * H),
    E('e1', 'br', { t: 'place', name: 'Workbench or desk' }, 2 * H), E('e2', 'gl', { t: 'place', name: 'Desk drawer' }, 3 * H), E('e3', 'tin', { t: 'place', name: 'Desk drawer' }, 5 * H),
  ]);
  await page.evaluate((s) => window.__rig.seed(s, 'recall_users'), [{ id: 'margaret', name: 'Margaret' }]);
  await W(400);
  const nPlaces0 = (await dump()).filter((d) => d.kind === 'place').length;
  const step = async (id, name, fn) => { try { await fn(); } catch (e) { check(id, name, false, 'threw: ' + e.message.split('\n')[0]); await page.keyboard.press('Escape').catch(() => {}); } };

  // ---- R1/R3 Ravi's sequence: Move it → type "on my lab desk" → Save ----
  await step('R1', 'typed new place replaces where it is', async () => {
    await openMove('brochure');
    const rest = await txt('.ow-head');
    check('H1', 'at rest: "Where is it now? (type to set new place)", solid border, nothing under the field', /Where is it now\?/.test(rest) && /\(type to set new place\)/.test(rest) && !(await has('.ow-field.dash')) && !(await has('.ow-hint')), rest);
    check('H1b', 'the field shows where it is now', (await page.locator('.ow-input').inputValue()) === 'Workbench or desk');
    check('S0', 'Move it: Save is off until something changes', await page.locator('.lc-k.sv').isDisabled());
    await snap('ow-01-rest.png');
    await page.locator('.ow-input').click(); await W(200);
    check('H2', 'tapping into the field: dashed border', await has('.ow-field.dash'));
    await page.locator('.ow-input').fill('on my lab desk'); await W(300);
    const h = await page.locator('.ow-head').first().evaluate((el) => el.textContent);
    check('H3', 'typing a new name: "Set NEW place. (previously was: Workbench or desk)"', /Set NEW place\./.test(h) && /\(previously was: Workbench or desk\)/.test(h), h);
    await snap('ow-02-typing.png');
    await done();
    check('H4', 'after Done the field reads the place, not the sentence: "Lab desk"', (await page.locator('.ow-input').inputValue()) === 'Lab desk', await page.locator('.ow-input').inputValue());
    check('S1', 'Save is on', !(await page.locator('.lc-k.sv').isDisabled()));
    await save();
    const it = await byName('Walgreens Photo brochure'); const e = await edgeOf('br');
    check('R1', 'saved: the brochure is in a NEW place "Lab desk" — the old place is replaced', it.location === 'Lab desk' && e && e.to.t === 'place' && e.to.name === 'Lab desk' && !!(await placeBy('Lab desk')), JSON.stringify({ loc: it.location, e: e && e.to }));
  });
  await step('R3', 'item page: one where', async () => {
    await page.waitForSelector('.thing-page'); await W(300);
    const where = await txt('.tp-blk[aria-labelledby="tp-where"]');
    check('R3', 'the item page says one where: Lab desk — no "Workbench or desk", no quoted words in Where it is', /Lab desk/.test(where) && !/Workbench or desk\b(?! ·)/.test(where.replace(/(Was|Before): Workbench or desk/, '')) && !/“/.test(where), where.replace(/\n/g, ' | '));
    check('R3b', 'one Move it, no "Put it in a place or a box"', (await page.locator('.thing-page button:has-text("Move it")').count()) === 1 && !(await has('.tp-put')));
    await snap('ow-03-page.png');
  });
  await step('F1', 'Find answers the new place', async () => {
    await home(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', 'brochure'); await W(600);
    const t = await txt('.ask .tile'); check('F1', 'Find answers "Lab desk"', /Lab desk/.test(t) && !/Workbench/.test(t), t.replace(/\n/g, ' | '));
  });
  // ---- R2: photos go to the place shown ----
  await step('P1', 'photographing the current place adds to its photos', async () => {
    const before = (await placeBy('Lab desk')).photos.length; const it0 = await byName('Walgreens Photo brochure');
    await openMove('brochure');
    const to = await txt('.ow-to'); check('P0', 'the strip says where photos go: "Lab desk"', /Lab desk/.test(to), to);
    await shoot('real_desk.jpg');
    check('P0b', 'no ReCall guess for a place she already has', !(await has('.ow-ai')));
    await save();
    const pl = await placeBy('Lab desk'); const it = await byName('Walgreens Photo brochure');
    check('P1', 'the photo joined the Lab desk’s photos; the brochure’s own photo is unchanged', pl.photos.length === before + 1 && it.photo === it0.photo && (it.photoCount || 1) === (it0.photoCount || 1), JSON.stringify({ before, after: pl.photos.length, cover: it.photo === it0.photo, docs: (await dump()).filter((d) => d.kind === 'place' && /lab desk/i.test(d.name)).map((d) => [d.id, d.owner, (d.photos || []).length]) }));
    check('P1b', 'and it did not move', (await edgeOf('br')).to.name === 'Lab desk');
  });
  await step('P2', 'type a new place, then photograph it; ReCall guesses', async () => {
    guessCalls = [];
    await openMove('brochure'); await typeWhere('the bench by the window'); await done();
    const to = await txt('.ow-to'); check('P2a', 'photos now go to the new place', /Bench by the window/i.test(to), to);
    GUESS = { name: 'Lab bench with a laptop', merged: 'Bench by the window with a laptop' };
    await shoot('real_desk.jpg');
    check('P2l', 'while ReCall looks: "ReCall is looking at the Bench by the window…" shows', await has('.ow-looking') && /ReCall is looking/.test(await txt('.ow-looking')), await txt('.ow-looking'));
    await W(2000);
    check('P2b', 'ReCall’s guess shows on the photo: Use this · Append to mine · Not this', await has('.ow-ai') && /Lab bench with a laptop/.test(await txt('.ow-ai')) && await has('.ow-ai-use') && await has('.ow-ai-add') && await has('.ow-ai-no'), await txt('.ow-ai'));
    check('P2c', 'ReCall was told what she typed (to merge without repeating)', guessCalls.length === 1 && /bench by the window/i.test(guessCalls[0] || ''), JSON.stringify(guessCalls));
    check('P2d', 'the box shows what Append will give', /Bench by the window with a laptop/.test(await txt('.ow-ai')), await txt('.ow-ai'));
    await snap('ow-04-guess.png');
    await tap('.ow-ai-add', 400);
    check('P2e', 'Append to mine: the merged name, nothing repeated', (await page.locator('.ow-input').inputValue()) === 'Bench by the window with a laptop', await page.locator('.ow-input').inputValue());
    check('P2f', 'the guess box is gone after a choice', !(await has('.ow-ai')));
    await save();
    const pl = await placeBy('Bench by the window with a laptop');
    check('P2', 'saved: the new place with its photo; the brochure is in it', !!pl && pl.photos.length === 1 && (await edgeOf('br')).to.name === 'Bench by the window with a laptop', JSON.stringify({ pl: !!pl, n: pl && pl.photos.length }));
  });
  await step('P3', 'Use this / Not this; one guess for a burst; never again for a decided name', async () => {
    await openMove('brochure'); await typeWhere('shelf'); await done();
    GUESS = { name: 'Garage shelf', merged: 'Garage shelf' }; guessCalls = []; guessImgs = [];
    await cam('closet.jpg'); await tap('.lc-shutter', 500); await tap('.lc-shutter', 500); await tap('.lc-shutter', 500); await W(2200);
    check('P3c', 'three quick photos: ONE guess, from all three', guessCalls.length === 1 && guessImgs[0] === 3, JSON.stringify(guessImgs));
    await tap('.ow-ai-no', 300);
    check('P3a', 'Not this keeps what she typed', (await page.locator('.ow-input').inputValue()) === 'Shelf');
    await shoot('closet.jpg'); await W(2200);
    check('P3d', 'after Not this, no more guesses for “Shelf”', guessCalls.length === 1 && !(await has('.ow-ai')) && !(await has('.ow-looking')));
    await typeWhere('cupboard'); await done(); await shoot('closet.jpg'); await W(2200);
    check('P3e', 'a different name: a fresh guess', guessCalls.length === 2 && await has('.ow-ai-use'), String(guessCalls.length));
    await tap('.ow-ai-use', 300);
    check('P3b', 'Use this takes ReCall’s name', (await page.locator('.ow-input').inputValue()) === 'Garage shelf');
    await tap('.lc-x', 300); if (await has('text=Leave')) await tap('text=Leave', 300);
  });
  await step('P5', 'acting on purpose cancels the look', async () => {
    await openMove('brochure'); await typeWhere('loft'); await done(); guessCalls = [];
    await shoot('box.jpg'); check('P5a', 'looking…', await has('.ow-looking'));
    await typeWhere('loft shelf'); await done(); await W(2200);
    check('P5', 'typing while it looks cancels it: no ask, no box', guessCalls.length === 0 && !(await has('.ow-ai')) && !(await has('.ow-looking')), String(guessCalls.length));
    GUESS_DELAY = 1500; await shoot('box.jpg'); await W(1700); check('P5b', 'asked and waiting', guessCalls.length === 1 && await has('.ow-looking'));
    await tap('.ow-look-x', 300); await W(1500); GUESS_DELAY = 250;
    check('P5c', '✕ on "looking" stops it; the late answer is dropped', !(await has('.ow-ai')) && !(await has('.ow-looking')));
    await tap('.lc-x', 300); if (await has('text=Leave')) await tap('text=Leave', 300);
  });
  await step('P6', 'a place she has: never a guess', async () => {
    await openMove('brochure'); guessCalls = []; await shoot('real_desk.jpg'); await shoot('real_desk.jpg'); await W(2000);
    check('P6', 'adding photos to a place she has: no "looking", no box, no ask', guessCalls.length === 0 && !(await has('.ow-looking')) && !(await has('.ow-ai')));
    await tap('.lc-x', 300); if (await has('text=Leave')) await tap('text=Leave', 300);
  });
  await step('P4', 'cleared field + photo: ReCall fills it', async () => {
    await openMove('brochure'); await page.locator('.ow-input').click(); await page.locator('.ow-input').fill(''); await done();
    const h = await txt('.ow-head'); check('P4a', 'a cleared field is a NEW place waiting for a name', /Set NEW place\./.test(h) && await has('.ow-field.dash') && /new place/i.test(await txt('.ow-to')), h + ' / ' + (await txt('.ow-to')));
    check('P4b', 'Save waits for a name', await page.locator('.lc-k.sv').isDisabled());
    GUESS = { name: 'Hall table', merged: 'Hall table' };
    await shoot('real_painting.jpg'); await W(2200);
    check('P4c', 'nothing typed: ReCall’s guess fills the field', (await page.locator('.ow-input').inputValue()) === 'Hall table', await page.locator('.ow-input').inputValue());
    await tap('.ow-ai-no', 300);
    check('P4d', 'Not this empties it again', (await page.locator('.ow-input').inputValue()) === '');
    await tap('.lc-x', 300); if (await has('text=Leave')) await tap('text=Leave', 300);
  });
  await step('X1', 'a name she has links; nothing new made', async () => {
    const n0 = (await dump()).filter((d) => d.kind === 'place').length;
    await openMove('brochure'); await typeWhere('desk drawer');
    const h = await txt('.ow-head'); check('X1a', '"Set place." — no NEW for a place she has', /Set place\./.test(h) && !/NEW/.test(h), h);
    await done(); await save();
    check('X1', 'linked to Desk drawer; no new place doc', (await edgeOf('br')).to.name === 'Desk drawer' && (await dump()).filter((d) => d.kind === 'place').length === n0);
  });
  await step('X2', 'a box she has links too', async () => {
    await openMove('brochure'); await typeWhere('in the blue tin'); await done(); await save();
    const e = await edgeOf('br'); check('X2', '"in the blue tin" → in the Blue tin (a box)', e && e.to.t === 'thing' && e.to.id === 'tin', JSON.stringify(e && e.to));
  });
  await step('X3', 'typing hint when some places match', async () => {
    await openMove('brochure'); await typeWhere('desk');
    const hint = await txt('.ow-hint'); check('X3', 'a near match: "N of your places have “desk” — → to see them"', /of your places have “desk”/.test(hint), hint);
    await tap('.lc-x', 300); if (await has('text=Leave')) await tap('text=Leave', 300);
  });
  // ---- R4: → sheet: name once, every level ----
  await step('R4', 'levels from →', async () => {
    await openMove('brochure'); await typeWhere('lab desk'); await done();
    await tap('.ow-go', 500);
    check('R4a', '→ opens one sheet: the name once', await has('.ow-sheet') && (await page.locator('.ow-sheet :text-is("Lab desk")').count()) <= 1, await txt('.ow-sheet'));
    await snap('ow-05-sheet.png');
    await tap('.ow-up', 500); await page.fill('.in-list .wl-search input', 'Office'); await W(300); await tap('.in-list .wl-row', 400);
    const lv = await page.locator('.ow-lvl').allInnerTexts();
    check('R4b', 'the next level shows under the last: Lab desk → which is in Office, + under Office', lv.length === 2 && /Office/.test(lv[1]) && /What is the Office in/.test(await txt('.ow-up')), JSON.stringify(lv));
    await tap('.ow-done', 400); await save();
    const lab = await placeBy('Lab desk'); const pe = await edgeOf(lab.id);
    check('R4c', 'saved: Lab desk is in the Office', pe && pe.to.t === 'place' && pe.to.name === 'Office', JSON.stringify(pe && pe.to));
    // second visit: change level 2
    await openMove('brochure'); await tap('.ow-go', 500);
    const lv2 = await page.locator('.ow-lvl').allInnerTexts();
    check('R4d', 'second visit: the saved levels show, each with Change', lv2.length === 2 && /Office/.test(lv2[1]) && (await page.locator('.ow-lvl .ow-lvl-change').count()) === 2, JSON.stringify(lv2));
    await page.locator('.ow-lvl .ow-lvl-change').nth(1).click(); await W(400);
    await page.fill('.in-list .wl-search input', 'Lab'); await W(300); await tap('.in-list .wl-new', 400);
    await tap('.ow-done', 400);
    check('R4e', 'changing a level counts as a change (Save on)', !(await page.locator('.lc-k.sv').isDisabled()));
    await save();
    const pe2 = await edgeOf((await placeBy('Lab desk')).id);
    check('R4', 'saved: Lab desk is now in the Lab (level 2 replaced); the brochure stays in the Lab desk', pe2 && pe2.to.name === 'Lab' && (await edgeOf('br')).to.name === 'Lab desk', JSON.stringify(pe2 && pe2.to));
  });
  await step('R4f', 'pick another place from the → sheet', async () => {
    await openMove('brochure'); await tap('.ow-go', 500);
    await page.locator('.ow-sheet .ow-pick', { hasText: 'Office' }).first().click(); await W(400);
    check('R4f', 'a pick from the list replaces the name', (await page.locator('.ow-input').inputValue()) === 'Office' && !(await has('.ow-sheet')), await page.locator('.ow-input').inputValue());
    await tap('.lc-x', 300); if (await has('text=Leave')) await tap('text=Leave', 300);
  });
  // ---- empty field in Move puts it back ----
  await step('E1', 'an empty field, then a tap elsewhere, changes nothing', async () => {
    await openMove('brochure'); await page.locator('.ow-input').click(); await page.locator('.ow-input').fill(''); await page.locator('.lc-view').click({ position: { x: 50, y: 50 } }); await W(300);
    // a cleared field waits for a name (P4); Cancel the camera — nothing saved
    await tap('.lc-x', 300); if (await has('text=Leave')) await tap('text=Leave', 300);
    check('E1', 'Cancel after clearing: still in the Lab desk', (await edgeOf('br')).to.name === 'Lab desk');
  });
  // ---- notes ----
  await step('N1', 'a note is a note', async () => {
    await openMove('brochure'); await tap('.ow-note', 300); await page.fill('.ow-note-in', 'under the blue folder'); await W(200); await save();
    await page.waitForSelector('.thing-page'); await W(300);
    const note = await txt('.tp-note'); const where = await txt('.tp-blk[aria-labelledby="tp-where"]');
    check('N1', 'the note shows under the photo; Where it is stays the Lab desk', /under the blue folder/.test(note) && !/under the blue folder/.test(where) && /Lab desk/.test(where), note + ' / ' + where.replace(/\n/g, ' | '));
    check('N1b', 'a note alone did not move it', (await edgeOf('br')).to.name === 'Lab desk');
  });
  // ---- Undo ----
  await step('U1', 'Undo a move to a new place', async () => {
    await openMove('brochure'); await typeWhere('attic'); await done(); GUESS = { name: 'Attic', merged: 'Attic' }; await shoot('box.jpg'); await W(2200); await tap('.ow-ai-no', 200); await save();
    check('U1a', 'moved to the Attic', (await edgeOf('br')).to.name === 'Attic');
    await page.waitForSelector('.tp-moved'); await tap('.tp-moved .u', 900);
    check('U1', 'Undo: back in the Lab desk, the Attic place is gone', (await edgeOf('br')).to.name === 'Lab desk' && !(await placeBy('Attic')), JSON.stringify((await edgeOf('br')).to));
  });
  await step('U2', 'Undo takes back photos added to a place she had', async () => {
    const n0 = (await placeBy('Lab desk')).photos.length;
    await openMove('brochure'); await shoot('real_desk.jpg'); await save();
    await page.waitForSelector('.tp-moved'); await tap('.tp-moved .u', 900);
    check('U2', 'the Lab desk’s photos are as they were', (await placeBy('Lab desk')).photos.length === n0, `${n0} → ${(await placeBy('Lab desk')).photos.length}`);
  });
  // ---- Log item ----
  await step('L1', 'Log item: the item first, then the place', async () => {
    await home(); AI = { name: 'stapler' }; await tap(LOG, 900); await shoot('real_pencil.jpg');
    check('L0', 'Log: the first photo is the item; the field is empty: "Where is it? (type to set a place)"', /Where is it\?/.test(await txt('.ow-head')) && /\(type to set a place\)/.test(await txt('.ow-head')) && (await page.locator('.ow-input').inputValue()) === '', await txt('.ow-head'));
    check('L0b', 'photos still go to the item', /stapler/i.test(await txt('.ow-to')), await txt('.ow-to'));
    await typeWhere('kitchen counter'); await done();
    check('L0c', 'once a place is set, photos go to it', /Kitchen counter/.test(await txt('.ow-to .on')), await txt('.ow-to'));
    GUESS = { name: 'Kitchen counter', merged: 'Kitchen counter' };
    await shoot('closet.jpg'); await W(2200); if (await has('.ow-ai-no')) await tap('.ow-ai-no', 200);
    await tap('.ow-to-item', 200); check('L0d', 'tapping the item in the strip points the shutter back at it', /stapler/i.test(await txt('.ow-to .on')));
    await shoot('real_pencil.jpg');
    await save();
    const it = await byName('stapler'); const pl = await placeBy('Kitchen counter');
    check('L1', 'saved: 2 photos of the stapler, 1 of the Kitchen counter; the stapler is in it', it && it.photoCount === 2 && pl && pl.photos.length === 1 && (await edgeOf(it.id)).to.name === 'Kitchen counter', JSON.stringify({ pc: it && it.photoCount, pl: pl && pl.photos.length }));
  });
  await step('L2', 'Log item with no place', async () => {
    await home(); AI = { name: 'umbrella' }; await tap(LOG, 900); await shoot('real_slippers.jpg'); await save();
    const it = await byName('umbrella'); check('L2', 'no place: Not put away', it && !it.location && !(await edgeOf(it.id)) && it.needsPlace === true);
  });
  // ---- legacy words-only item ----
  await step('K1', 'an old words-only item', async () => {
    await openThing('keys'); const where = await txt('.tp-blk[aria-labelledby="tp-where"]');
    check('K1', 'its words still say where it is (no link, no conflict); one Move it', /in my coat pocket/.test(where) && (await page.locator('.thing-page button:has-text("Move it")').count()) === 1 && !(await has('.tp-put')), where.replace(/\n/g, ' | '));
  });

  // ---- the independent tester's finds on this build (rig/indep/REPORT_ow1.md), each a permanent check ----
  await step('T6', 'filler alone is no place', async () => {
    for (const f of ['the', 'on the', 'in']) {
      await openMove('brochure'); await typeWhere(f); await done();
      const v = await page.locator('.ow-input').inputValue();
      check('T6' + f.replace(' ', ''), `"${f}" alone is no place (a NEW place waiting for a name; Save off)`, v === '' && await page.locator('.lc-k.sv').isDisabled(), v);
      await tap('.lc-x', 300); if (await has('text=Leave')) await tap('text=Leave', 300);
    }
  });
  await step('T4', 'a note on a words-only item stays a note', async () => {
    await openMove('keys'); await tap('.ow-note', 300); await page.fill('.ow-note-in', 'on the blue lanyard'); await W(200); await save();
    await page.waitForSelector('.thing-page'); await W(300);
    const where = await txt('.tp-blk[aria-labelledby="tp-where"]'); const note = await txt('.tp-note');
    check('T4', 'keys: still "in my coat pocket" as where; the note under the photo', /in my coat pocket/.test(where) && !/blue lanyard/.test(where) && /blue lanyard/.test(note), where.replace(/\n/g, ' | ') + ' / ' + note);
    await home(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', 'keys'); await W(600);
    check('T4f', 'Find answers the keys’ where, not the note', /coat pocket/.test(await txt('.ask .tile')) && !/lanyard/.test(await txt('.ask .tile')), await txt('.ask .tile'));
  });
  await step('T5', 'a new item with only a note is Not put away', async () => {
    await home(); AI = { name: 'sunglasses' }; await tap(LOG, 900); await shoot('real_slippers.jpg'); await tap('.ow-note', 300); await page.fill('.ow-note-in', 'with the beach bag'); await W(200); await save();
    const it = await byName('sunglasses'); check('T5', 'no place + a note: needsPlace, and the note is a note (n: 1)', it && it.needsPlace === true && (it.history || []).some((h) => h.w && h.n && h.said === 'with the beach bag'), JSON.stringify(it && { np: it.needsPlace, h: it.history }));
  });
  await step('T7', 'a place and a box with the same name', async () => {
    await page.evaluate(() => { const t = Date.now(); window.__rig.seed([{ id: 'sbp', kind: 'place', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [], name: 'Sewing basket', order: t, createdAt: t, parent: null, photos: [] },
      { id: 'sbx', kind: 'item', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [], name: 'sewing basket', holds: true, location: 'Office', photo: null, thumb: null, order: t, createdAt: t, lastSeenAt: t, history: [{ location: 'Office', at: t }] },
      { id: 'thm', kind: 'item', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [], name: 'thimble', location: 'Sewing basket', photo: null, thumb: null, written: true, order: t, createdAt: t, lastSeenAt: t, history: [{ location: 'Sewing basket', at: t }] },
      { id: 'ethm', kind: 'edge', rel: 'in', from: 'thm', to: { t: 'place', name: 'Sewing basket' }, since: t, until: null, how: 'chosen', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [] }]); }); await W(400);
    await openMove('thimble'); await typeWhere('Sewing basket'); await done();
    check('T7', 'retyping the place it is in keeps the place (not the box of the same name); Save stays off', await page.locator('.lc-k.sv').isDisabled() && /Where is it now/.test(await txt('.ow-head')), await txt('.ow-head'));
    await tap('.ow-go', 400); const picks = await page.locator('.ow-sheet .ow-pick').allInnerTexts();
    const lv1 = await txt('.ow-sheet .ow-lvl');
    check('T7b', 'the → sheet has both: the place (level 1, where it is) and the box (in the pick list)', /Sewing basket/.test(lv1) && /it’s on \/ in this/.test(lv1) && picks.filter((t) => /^Sewing basket\s+a box/.test(t)).length === 1, lv1 + ' / ' + JSON.stringify(picks.filter((t) => /Sewing/.test(t))));
    await tap('.ow-cancel', 300); await tap('.lc-x', 300); if (await has('text=Leave')) await tap('text=Leave', 300);
  });
  await step('T13', 'a where that can’t be used says why, at rest too', async () => {
    await openMove('brochure'); await typeWhere('reading glasses'); await done();
    check('T13', 'after Done: "Can’t put it there." and the reason stay; Save off; not "(new)"', /Can’t put it there/.test(await txt('.ow-head')) && /one of your items/.test(await txt('.ow-hint.bad')) && await page.locator('.lc-k.sv').isDisabled() && !/\(new\)/.test(await txt('.ow-to')), await txt('.ow-head') + ' / ' + await txt('.ow-hint') + ' / ' + await txt('.ow-to'));
    await tap('.lc-x', 300); if (await has('text=Leave')) await tap('text=Leave', 300);
  });
  await step('T14', 'a level-only change says so', async () => {
    await openMove('brochure'); await tap('.ow-go', 400); await tap('.ow-up', 400); await page.fill('.in-list .wl-search input', 'Garage'); await W(300); await tap('.in-list .wl-new', 400); await tap('.ow-done', 400);
    const h = await txt('.ow-head'); check('T14', 'only a level changed: "Set where the Lab desk is." — not "previously was"', /Set where the Lab desk is\./.test(h) && !/previously/.test(h), h);
    await tap('.lc-x', 300); if (await has('text=Leave')) await tap('text=Leave', 300);
  });
  await step('T9', 'Append never repeats', async () => {
    await openMove('brochure'); await typeWhere('bench by the window'); await done(); GUESS = { name: 'bench with a laptop', merged: 'Bench by the window bench with a laptop' };
    await shoot('real_desk.jpg'); await W(2200);
    check('T9', 'a merged name that repeats is cleaned: "Bench by the window with a laptop"', /Append gives “Bench by the window with a laptop”/.test(await txt('.ow-ai')), await txt('.ow-ai'));
    await tap('.lc-x', 300); if (await has('text=Leave')) await tap('text=Leave', 300);
  });
  await step('T1', 'Undo never drops another phone’s newer photo of a place', async () => {
    await openMove('brochure'); await typeWhere('garage'); await done(); await tap('.ow-to-where', 200).catch(() => {}); await shoot('tooldrawer.jpg'); await W(2200); if (await has('.ow-ai-no')) await tap('.ow-ai-no', 200); await save();
    await W(2300);
    await page.evaluate(() => { const d = window.__rig.dump().find((x) => x.kind === 'place' && x.name === 'Garage'); const F = window.__rigfs; const t = Date.now(); return F.updateDoc(F.doc(F.collection(null, 'recall_items'), d.id), { photos: [...(d.photos || []), { photo: d.photos[0].photo, thumb: d.photos[0].thumb, at: t }], updatedAt: t }); });
    await W(500); const n1 = (await placeBy('Garage')).photos.length;
    await tap('.tp-moved .u', 1200);
    check('T1', 'Undo refused ("it changed since"); the other phone’s photo stays', (await placeBy('Garage')).photos.length === n1 && (await edgeOf('br')).to.name === 'Garage', `${n1} → ${(await placeBy('Garage')).photos.length}`);
  });
  await step('T3', 'Undo takes back photos a save added to a box', async () => {
    const tin0 = (await byName('blue tin')).photoCount;
    await openMove('brochure'); await typeWhere('in the blue tin'); await done(); await shoot('tin.jpg'); await save();
    check('T3a', 'the photo joined the Blue tin', (await byName('blue tin')).photoCount === tin0 + 1);
    await page.waitForSelector('.tp-moved'); await tap('.tp-moved .u', 1200);
    check('T3', 'Undo: the Blue tin’s photos are as they were', (await byName('blue tin')).photoCount === tin0, `${tin0} → ${(await byName('blue tin')).photoCount}`);
  });
  await step('T11', 'removing the item’s only photo keeps the place and its photos', async () => {
    await home(); AI = { name: 'torch' }; await tap(LOG, 900); await shoot('real_pencil.jpg'); await typeWhere('shed'); await done(); await shoot('box.jpg'); await W(2200); if (await has('.ow-ai-no')) await tap('.ow-ai-no', 200);
    await tap('.lc-thing', 500); await tap('.d2-pill.rm', 400); await tap('.pv-ask button:has-text("Remove")', 500);
    check('T11', 'the field still says Shed, its photo is still there, Save waits for a photo of the item', (await page.locator('.ow-input').inputValue()) === 'Shed' && /Shed/.test(await txt('.ow-to')) && await page.locator('.lc-k.sv').isDisabled(), (await page.locator('.ow-input').inputValue()) + ' / ' + (await txt('.ow-to')));
    await tap('.lc-x', 300); if (await has('text=Throw away')) await tap('text=Throw away', 300);
  });

  // ---- the independent tester's round ow2 (rig/indep2/REPORT_ow2.md) ----
  await step('T21', 'names in any script', async () => {
    await page.evaluate(() => { const t = Date.now(); const o = { owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [] };
      window.__rig.seed([{ id: 'hp1', kind: 'place', ...o, name: 'रसोई', order: t, createdAt: t, parent: null, photos: [] }, { id: 'hp2', kind: 'place', ...o, name: 'अलमारी', order: t, createdAt: t, parent: null, photos: [] },
        { id: 'chb', kind: 'item', ...o, name: 'चाबी', location: 'रसोई', photo: null, thumb: null, written: true, order: t, createdAt: t, lastSeenAt: t, history: [{ location: 'रसोई', at: t }] },
        { id: 'echb', kind: 'edge', rel: 'in', from: 'chb', to: { t: 'place', name: 'रसोई' }, since: t, until: null, how: 'chosen', ...o }]); }); await W(400);
    await openMove('चाबी'); await typeWhere('अलमारी'); await done(); await save();
    check('T21', 'Hindi: "अलमारी" links अलमारी (not रसोई); Find finds चाबी', (await edgeOf('chb')).to.name === 'अलमारी', JSON.stringify((await edgeOf('chb')).to));
  });
  await step('T22', 'position words are part of a name', async () => {
    await page.evaluate(() => { const t = Date.now(); window.__rig.seed([{ id: 'uts', kind: 'place', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [], name: 'Under the sink', order: t, createdAt: t, parent: null, photos: [] }]); }); await W(300);
    const n0 = (await dump()).filter((d) => d.kind === 'place').length;
    await openMove('brochure'); await typeWhere('under the sink'); await done(); await save();
    check('T22', '"under the sink" links Under the sink — no NEW place "Sink"', (await edgeOf('br')).to.name === 'Under the sink' && (await dump()).filter((d) => d.kind === 'place').length === n0, JSON.stringify((await edgeOf('br')).to));
  });
  await step('T23', 'Undo never loses an old words-only where', async () => {
    await openMove('keys'); await page.locator('.ow-input').click(); await page.locator('.ow-input').fill('garage'); await done(); await save();
    await page.waitForSelector('.tp-moved'); await tap('.tp-moved .u', 1500);
    await openThing('keys'); const where = await txt('.tp-blk[aria-labelledby="tp-where"]');
    const it = await byName('keys');
    check('T23', 'keys: Move to the Garage, Undo → "in my coat pocket" is its where again, not "Not put away"', /in my coat pocket/.test(where) && !it.location && it.needsPlace === false, where.replace(/\n/g, ' | ') + ' / np=' + it.needsPlace);
  });
  check('ERR', 'no page errors', errors.length === 0, errors.slice(0, 5).join(' || '));
  const pass = results.filter((r) => r.ok).length; console.log(`\n${pass}/${results.length} passed`);
  fs.writeFileSync(path.join(OUT, 'ow.json'), JSON.stringify(results, null, 1));
  await browser.close(); server.close();
})().catch((e) => { console.error(e); process.exit(1); });
