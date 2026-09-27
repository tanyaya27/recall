// Containers as a graph (Ravi 09-25/26): edges as records, Home inside a box (A and B via Settings →
// Experimentation), promote, Put in (+Undo), Log here, moving a box moves its contents, no circles, a
// helper with the rules on. Ravi's chain: baseball card → wooden box → memorabilia box → crawl space.
// node audit_graph.js → PASS/FAIL, screenshots to shots/graph-*.png
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const PORT = 8096; const ROOT = path.join(__dirname, 'out');
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, req.url.split('?')[0] === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
const results = []; const errors = [];
const check = (name, ok, note = '') => { results.push({ name, ok: !!ok, note }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${note ? ' — ' + note : ''}`); };
const img = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(__dirname, 'mock/img', f)).toString('base64');

async function main() {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const ctx = await browser.newContext({ permissions: ['camera'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.route('https://api.anthropic.com/**', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}'); const content = body.messages?.[0]?.content || [];
    const images = content.filter((b) => b.type === 'image').length; const isSame = content.some((b) => b.type === 'text' && /NEW PHOTO/.test(b.text));
    const text = JSON.stringify(isSame ? { index: -1, sure: false } : images ? { name: 'bottle cap', sameAs: '', alternatives: [], restingOn: '', placeCertain: false, placeGuesses: [], description: '', details: '', private: false, secretVisible: false } : { matches: [], message: '' });
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [{ type: 'text', text }] }) });
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/camera/.test(m.text())) errors.push('console: ' + m.text().slice(0, 160)); });
  const shot = async (n) => { await page.waitForTimeout(250); await page.screenshot({ path: `shots/graph-${n}.png` }); };
  const count = (sel) => page.locator(sel).count();
  const text = (sel) => page.locator(sel).first().innerText().catch(() => '');
  const dump = (c) => page.evaluate((c) => window.__rig.dump(c), c);
  const items = async () => (await dump()).filter((d) => d.kind === 'item' && !d.deleted);
  const edges = async () => (await dump()).filter((d) => d.kind === 'edge');
  const openTo = async (id) => (await edges()).filter((e) => e.from === id && !e.until);
  const byName = async (n) => (await items()).find((d) => d.name === n);
  const tiles = async () => page.locator('.board .tile-label').allInnerTexts();
  const setPrefs = (patch) => page.evaluate((p) => { const x = JSON.parse(localStorage.getItem('recall-prefs') || '{}'); Object.assign(x, p); localStorage.setItem('recall-prefs', JSON.stringify(x)); }, patch);
  const boot = async (uid, whose = null) => {
    await page.evaluate(([u, w]) => { localStorage.setItem('rig-uid', u); localStorage.setItem('rig-anon', '0'); localStorage.setItem('recall-ai-config', JSON.stringify({ provider: 'anthropic', apiKey: 'sk-ant-rig', model: '' })); const p = JSON.parse(localStorage.getItem('recall-prefs') || '{}'); p.whose = w; localStorage.setItem('recall-prefs', JSON.stringify(p)); }, [uid, whose]);
    await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen'); await page.waitForTimeout(500);
  };

  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen');
  await page.evaluate(() => { localStorage.clear(); window.__rig.reset(); });
  await boot('dad');
  const now = Date.now(), H = 3600e3;
  const P = (f) => ({ photo: img(f), thumb: img(f), thumbV: 2 });
  const T = (id, name, location, f, ago, extra = {}) => ({ id, kind: 'item', owner: 'dad', by: 'dad', private: false, roles: {}, sharedWith: [], name, location,
    ...(f ? P(f) : { photo: null, thumb: null, written: true }), order: now - ago, createdAt: now - ago, lastSeenAt: now - ago, logId: 'l_' + id, photoCount: f ? 1 : 0, history: [{ location, at: now - ago }], ...extra });
  const E = (id, from, to, ago) => ({ id, kind: 'edge', rel: 'in', from, to, since: now - ago, until: null, how: 'chosen', owner: 'dad', by: 'dad', private: false, roles: {}, sharedWith: [] });
  await page.evaluate((s) => window.__rig.seed(s), [
    T('g', 'reading glasses', 'Hall table', 'glasses.jpg', 1 * H), T('k', 'car keys', 'Hall table', 'keys.jpg', 2 * H),
    T('m', 'memorabilia box', 'Crawl space', 'box14.jpg', 90 * H), T('w', 'wooden box', 'Memorabilia box', 'smallbox.jpg', 80 * H),
    T('y', 'yearbook 1978', 'Memorabilia box', 'book.jpg', 79 * H), T('l', 'old letters', 'Memorabilia box', 'diary.jpg', 78 * H),
    T('c', 'baseball card', 'Wooden box', 'card.jpg', 70 * H), T('t', 'ticket stubs', 'Wooden box', null, 69 * H),
    T('u', 'coffee can', '', 'soda.jpg', 3 * H, { needsPlace: true }), T('b', 'blue binders', '', 'folder.jpg', 4 * H, { needsPlace: true }),
    T('p', 'passport', 'Desk', 'folder.jpg', 5 * H, { private: true }), T('s', 'shoe box', 'Closet', null, 6 * H),
    E('em', 'm', { t: 'place', name: 'Crawl space' }, 90 * H), E('ew', 'w', { t: 'thing', id: 'm', name: 'memorabilia box' }, 80 * H),
    E('ey', 'y', { t: 'thing', id: 'm', name: 'memorabilia box' }, 79 * H), E('el', 'l', { t: 'thing', id: 'm', name: 'memorabilia box' }, 78 * H),
    E('ec', 'c', { t: 'thing', id: 'w', name: 'wooden box' }, 70 * H), E('et', 't', { t: 'thing', id: 'w', name: 'wooden box' }, 69 * H), E('es', 's', { t: 'place', name: 'Closet' }, 6 * H),
  ]);
  await page.evaluate((s) => window.__rig.seed(s, 'recall_grants'), [{ id: 'dad_ravi', grantor: 'dad', grantee: 'ravi', role: 'editor', createdAt: now - 9e7 }]);
  await page.evaluate((s) => window.__rig.seed(s, 'recall_users'), [{ id: 'dad', name: 'Dad' }, { id: 'ravi', name: 'Ravi' }]);
  await page.waitForTimeout(400);

  // ---- Home: contents stay off the top level; a box is one tile with a count
  let t = await tiles();
  check('G1 Home shows the memorabilia box, not what is in it', t.some((x) => /Memorabilia box/.test(x)) && !t.some((x) => /Wooden box|Baseball card|Yearbook/.test(x)), t.join(' | '));
  check('G2 the box tile says "3 inside"', /3 inside/.test(await text('.tile:has-text("Memorabilia box") .inbadge')));
  // ---- 09-27 (Ravi: "the item in place in place is not working"): an EMPTY box is where you start
  await page.click('.tile:has-text("Shoe box")'); await page.waitForSelector('.card.thing');
  check('J1 an empty box opens its card, which offers "Put things in it"', await count('.putin-btn') === 1); await shot('0a-emptybox');
  await page.click('.putin-btn'); await page.waitForSelector('.putin-sheet');
  await page.click('.putin-grid .tile:has-text("Reading glasses")'); await page.click('.putin-foot .btn-primary'); await page.waitForTimeout(600);
  const sg = await openTo('g');
  check('J2 …put the reading glasses in: an edge to the shoe box', sg.length === 1 && sg[0].to.id === 's', JSON.stringify(sg.map((e) => e.to)));
  await page.click('.toast-undo'); await page.waitForTimeout(600);
  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board');
  await page.click('.tile:has-text("Car keys")'); await page.waitForSelector('.card.thing');
  await page.click('.act:has-text("Edit")'); await page.waitForTimeout(200); await page.click('.fix .field-value:has-text("Hall table")'); await page.waitForSelector('.place-sheet');
  const opts = await page.locator('.place-sheet .guess span').allInnerTexts();
  check('J2b a box is offered once, as the box ("In the wooden box"), never also as a place called "Wooden box"', opts.some((x) => /In the wooden box/.test(x)) && !opts.some((x) => /^Wooden box$/.test(x.trim())) && !opts.some((x) => /^Memorabilia box$/.test(x.trim())), opts.join(' | '));
  const ov = await page.evaluate(() => { const sh = document.querySelector('.place-sheet').getBoundingClientRect(); return [...document.querySelectorAll('.place-sheet .guess')].map((b) => Math.round(sh.right - b.getBoundingClientRect().right)); });
  check('J2c the place list stays inside the sheet (no row runs off the right edge)', ov.every((g) => g >= 8), JSON.stringify(ov));
  await page.evaluate(() => document.querySelector('.place-sheet .btn-primary.alt').click()); await page.waitForTimeout(200);
  check('J3 a thing that is not a container keeps a short card (no "Put things in it"; it is in Edit and the hold sheet)', await count('.putin-btn') === 0);
  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board');
  // ---- Log first, put away later: the Home chip
  check('J4 Home: "Not put away · 2" (the coffee can and the blue binders)', /Not put away · 2/.test(await text('.notput')));
  await shot('0-notput');
  await page.click('.notput'); await page.waitForSelector('.place-sheet');
  const ws = await text('.place-sheet');
  check('J5 Put away 2 things · Where are they going? — boxes by photo, then places', /Put away 2 things/.test(ws) && /In the memorabilia box/.test(ws) && /Hall table/.test(ws), ws.replace(/\n/g, ' / ').slice(0, 160));
  await shot('0b-where');
  await page.click('.place-sheet .guess:has-text("Hall table")'); await page.waitForSelector('.putin-sheet');
  const pa = await page.locator('.putin-grid .tile-label').allInnerTexts();
  check('J6 then only the things not put away are offered', pa.length === 2 && pa.every((x) => /Coffee can|Blue binders/.test(x)), pa.join(' | '));
  await page.click('.putin-grid .tile:has-text("Coffee can")'); await page.click('.putin-grid .tile:has-text("Blue binders")');
  check('J7 the button says it: "Put 2 at Hall table"', /Put 2 at Hall table/.test(await text('.putin-foot .btn-primary')));
  await shot('0c-pick');
  await page.click('.putin-foot .btn-primary'); await page.waitForTimeout(700);
  check('J8 saved: both at the Hall table (place links), and the chip is gone', (await byName('coffee can')).location === 'Hall table' && (await openTo('b'))[0].to.name === 'Hall table' && await count('.notput') === 0);
  await page.click('.toast-undo'); await page.waitForTimeout(700);
  check('J9 Undo: not put away again', !(await byName('coffee can')).location && /Not put away · 2/.test(await text('.notput')));
  await shot('1-home');
  // ---- A: step in, one level at a time
  await page.click('.tile:has-text("Memorabilia box")'); await page.waitForSelector('.ctx-head');
  t = await tiles();
  check('G3 A · tap it: Home shows its 3 things, the box as a banner (Crawl space)', t.length === 3 && t.some((x) => /Wooden box/.test(x)) && /Crawl space/.test(await text('.ctx-banner')), t.join(' | '));
  check('G4 A · the wooden box inside is itself a box ("2 inside")', /2 inside/.test(await text('.tile:has-text("Wooden box") .inbadge')));
  await shot('2-a-memo');
  await page.click('.tile:has-text("Wooden box")'); await page.waitForSelector('.ctx-head .t:has-text("Wooden box")');
  check('G5 A · one level deeper: 2 things; banner "In the memorabilia box · Crawl space"', (await tiles()).length === 2 && /In the memorabilia box/.test(await text('.ctx-banner')) && /Crawl space/.test(await text('.ctx-banner')));
  check('G6 A · the footer offers Log here and Put in', /Log here/.test(await text('.footer')) && /Put in/.test(await text('.footer')));
  await shot('3-a-wood');
  await page.click('.ctx-head .chev'); await page.waitForSelector('.ctx-head .t:has-text("Memorabilia box")');
  await page.click('.ctx-head .chev'); await page.waitForSelector('.dayrow');
  check('G7 Back steps out one level at a time, then Home', await count('.dayrow') === 1);
  // ---- About this box → its card lists what's in it
  await page.click('.tile:has-text("Memorabilia box")'); await page.waitForSelector('.ctx-banner');
  await page.click('.ctx-banner'); await page.waitForSelector('.card.thing');
  check('G8 About this box → its card says "In it · 3 things"', /In it/.test(await text('.inside-h')) && /3 things/.test(await text('.inside-h')));
  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board');
  // ---- the thing's card: which box, with the box's photo
  await page.evaluate(() => { const fs = window.__rigfs; return fs.updateDoc(fs.doc(fs.collection(null, 'recall_items'), 'c'), { promoted: true }); });
  await page.waitForTimeout(300);
  await page.click('.tile:has-text("Baseball card")'); await page.waitForSelector('.card.thing');
  check('G9 the card: "In the wooden box, in the memorabilia box" + the box\'s photo row "Wooden box · In the memorabilia box · Crawl space"', /In the wooden box, in the memorabilia box/.test(await text('.thing-head .row2')) && /Wooden box/.test(await text('.nest-row')) && /Crawl space/.test(await text('.nest-row')));
  await shot('4-card');
  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board');
  check('G10 promoted: the card is on Home too, saying "in the wooden box"', /in the wooden box/.test(await text('.tile:has-text("Baseball card") .tile-promo')));
  await shot('5-promoted');
  // promote/unpromote from the hold sheet (inside the box)
  await page.click('.tile:has-text("Memorabilia box")'); await page.waitForSelector('.ctx-banner'); await page.click('.tile:has-text("Wooden box")'); await page.waitForSelector('.ctx-head .t:has-text("Wooden box")');
  await page.locator('.tile:has-text("Baseball card")').dispatchEvent('pointerdown'); await page.waitForTimeout(750); await page.locator('.tile:has-text("Baseball card")').dispatchEvent('pointerup');
  await page.waitForSelector('.item-sheet', { timeout: 3000 }).catch(() => {});
  const sheetTxt = await text('.item-sheet');
  check('G11 hold a thing inside a box → the sheet offers "Take it off Home" (it is promoted)', /Take it off Home/.test(sheetTxt), sheetTxt.replace(/\n/g, ' / '));
  if (/Take it off Home/.test(sheetTxt)) { await page.click('.sheet-row:has-text("Take it off Home")'); await page.waitForTimeout(300); }
  check('G12 …and taking it off Home works', (await byName('baseball card')).promoted === false);
  // ---- Put in (+ Undo)
  await page.click('.footer .btn-primary.alt:has-text("Put in")'); await page.waitForSelector('.putin-sheet');
  const cand = await page.locator('.putin-grid .tile-label').allInnerTexts();
  check('G13 Put in: things not put away come first; the boxes this one is in are never offered (no circles)', /Coffee can|Blue binders/.test(cand[0] || '') && !cand.some((x) => /Memorabilia box/.test(x)) && !cand.some((x) => /Baseball card|Ticket stubs/.test(x)), cand.slice(0, 5).join(' | '));
  check('G13b every thing offered shows its name (rows never squash)', await page.evaluate(() => [...document.querySelectorAll('.putin-grid .tile')].every((t) => { const l = t.querySelector('.tile-label').getBoundingClientRect(); const r = t.getBoundingClientRect(); return l.height > 10 && l.bottom <= r.bottom + 1; })));
  await page.click('.putin-grid .tile:has-text("Coffee can")'); await page.click('.putin-grid .tile:has-text("Blue binders")');
  check('G14 the button says what will happen: "Put 2 in the wooden box"', /Put 2 in the wooden box/.test(await text('.putin-foot .btn-primary')));
  await shot('6-putin');
  await page.click('.putin-foot .btn-primary'); await page.waitForTimeout(600);
  const cc = await openTo('u'), bb = await openTo('b');
  check('G15 saved: each has one open edge to the wooden box; the place text copy says "Wooden box"', cc.length === 1 && cc[0].to.id === 'w' && bb.length === 1 && (await byName('coffee can')).location === 'Wooden box' && (await tiles()).length === 4, JSON.stringify(cc.map((e) => e.to)));
  check('G16 toast "Put 2 in the wooden box" with Undo', /Put 2 in the wooden box/.test(await text('.toast')) && /Undo/.test(await text('.toast')));
  await shot('7-put');
  await page.click('.toast-undo'); await page.waitForTimeout(700);
  const cc2 = await openTo('u');
  check('G17 Undo: back where they were (no open edge to the box; not put away again)', !cc2.some((e) => e.to && e.to.id === 'w') && !(await byName('coffee can')).location, JSON.stringify(cc2));
  // ---- Log here: a new thing lands in the box
  await page.click('.footer .btn-primary:has-text("Log here")'); await page.waitForSelector('.camera'); await page.waitForTimeout(400);
  await page.click('.shutter'); await page.waitForTimeout(250); await page.click('.camera-done'); await page.waitForSelector('.photo-card'); await page.waitForTimeout(900);
  check('G18 Log here: the photo card already has the wooden box chosen', /Wooden box/.test(await text('.guess.pre')));
  await page.click('.next-row .btn-primary.alt'); await page.waitForTimeout(1200);
  const stub = await byName('bottle cap'); const se = stub ? await openTo(stub.id) : [];
  check('G19 …Done: the new thing is in the wooden box (an edge to it), and we are back inside the box', se.length === 1 && se[0].to.t === 'thing' && se[0].to.id === 'w' && /Wooden box/.test(await text('.ctx-head .t')), JSON.stringify(se.map((e) => e.to)));
  // ---- moving the big box moves everything in it (no writes to what's inside)
  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board');
  const before = JSON.stringify((await items()).find((d) => d.id === 'c'));
  await page.click('.tile:has-text("Memorabilia box")'); await page.waitForSelector('.ctx-banner'); await page.click('.ctx-banner'); await page.waitForSelector('.card.thing');
  await page.click('.act:has-text("Edit")'); await page.waitForTimeout(200); await page.click('.fix .field-value:has-text("Crawl space")'); await page.waitForTimeout(300);
  const typed = await page.locator('.sheet input, .place-input').count();
  if (typed) { await page.fill('.sheet input, .place-input', 'Garage shelf'); await page.keyboard.press('Enter'); } else { await page.click('.sheet button:has-text("Somewhere else")').catch(() => {}); await page.fill('.sheet input', 'Garage shelf'); await page.keyboard.press('Enter'); }
  await page.waitForTimeout(700);
  const me2 = await openTo('m');
  check('G20 the memorabilia box moved: its open edge is now "Garage shelf" (old one closed)', me2.length === 1 && me2[0].to.t === 'place' && me2[0].to.name === 'Garage shelf' && (await edges()).some((e) => e.id === 'em' && e.until), JSON.stringify(me2.map((e) => e.to)));
  check('G21 …the card inside was not written to', JSON.stringify((await items()).find((d) => d.id === 'c')) === before);
  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board');
  await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('.ask input', 'baseball'); await page.waitForTimeout(400);
  check('G22 Find "baseball": the result says "In the wooden box"', /In the wooden box/.test(await page.locator('.ask').innerText()));
  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board');
  // ---- typing a place that names a thing makes it a container (her save, her words)
  await page.click('.tile:has-text("Reading glasses")'); await page.waitForSelector('.card.thing');
  await page.click('.act:has-text("Edit")'); await page.waitForTimeout(200); await page.click('.fix .field-value:has-text("Hall table")'); await page.waitForTimeout(300);
  if (await page.locator('.sheet input, .place-input').count()) { await page.fill('.sheet input, .place-input', 'in the wooden box'); await page.keyboard.press('Enter'); } else { await page.click('.sheet button:has-text("Somewhere else")').catch(() => {}); await page.fill('.sheet input', 'in the wooden box'); await page.keyboard.press('Enter'); }
  await page.waitForTimeout(700);
  const ge = await openTo('g');
  check('G23 typed "in the wooden box" → an edge to the wooden box (not a place called that); the text copy says "Wooden box"', ge.length === 1 && ge[0].to.t === 'thing' && ge[0].to.id === 'w' && (await byName('reading glasses')).location === 'Wooden box', JSON.stringify(ge.map((e) => e.to)));
  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board');
  // ---- 09-27 (Ravi: "item in place in place is not working"; "no facility to catalog without a place")
  const shootOne = async () => { await page.click('.footer .btn-primary:not(.alt)'); await page.waitForSelector('.camera'); await page.waitForTimeout(350); await page.click('.shutter'); await page.waitForTimeout(250); await page.click('.camera-done'); await page.waitForSelector('.photo-card'); await page.waitForTimeout(900); };
  await setPrefs({ lastMode: 'one' }); await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board');
  await shootOne();
  check('I1 photo card: a box already in use is offered by its photo ("In the memorabilia box"), never twice', await count('.photo-card .guess.inbox:has-text("In the memorabilia box")') === 1 && await count('.photo-card .guess:has-text("wooden box")') <= 1);
  check('I2 photo card: "In something…" and "No place yet" are two parallel paths at the TOP (on screen without scrolling, under Where is it?)', await count('.photo-card .path-row .path.in') === 1 && await count('.photo-card .path-row .path.later') === 1 &&
    await page.evaluate(() => { const r = document.querySelector('.photo-card .path-row').getBoundingClientRect(); const q = document.querySelector('.photo-card .ask-q').getBoundingClientRect(); return r.bottom <= window.innerHeight && r.top - q.bottom < 260; }));
  await shot('13-photo-inbox');
  await page.click('.photo-card .path.in'); await page.waitForSelector('.putin-sheet');
  check('I3 "In something…": the search and "Something not logged yet" at the top, then boxes by photo', /Wooden box|Memorabilia box/.test(await text('.putin-grid .tile-label')) && await count('.it-search input') === 1 && await count('.it-new') === 1);
  await page.fill('.it-search input', 'memorab'); await page.waitForTimeout(200);
  await shot('14-in-something');
  await page.click('.putin-grid .tile:has-text("Memorabilia box")'); await page.waitForTimeout(1500);
  let bc = (await items()).find((d) => d.name === 'bottle cap' && d.location === 'Memorabilia box');
  let bce = bc ? await openTo(bc.id) : [];
  check('I4 …picked the memorabilia box by photo → saved IN it (an edge to the thing)', bce.length === 1 && bce[0].to.t === 'thing' && bce[0].to.id === 'm', JSON.stringify(bce.map((e) => e.to)));
  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board');
  await shootOne();
  const hadPreset = await count('.photo-card .guess.pre');
  await page.click('.photo-card .path.later'); await page.waitForTimeout(1500);
  const np = (await items()).filter((d) => d.name === 'bottle cap' && !d.location);
  check('I5 "No place yet" saves with no place and no link, even when a place was pre-chosen', np.length === 1 && (await openTo(np[0].id)).length === 0, `preset shown: ${hadPreset}`);
  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board');
  check('I6 …and it shows on Home as "No place assigned"', /No place assigned/.test(await text('.tile:has-text("Bottle cap") .tile-label')) || (await page.locator('.tile-label.noplace').allInnerTexts()).some((x) => /Bottle cap/.test(x)));
  // Write it down: In something… and No place yet
  await page.click('.footer .btn-primary:not(.alt)'); await page.waitForSelector('.camera'); await page.click('.camera-write'); await page.waitForSelector('.note-card');
  await page.fill('#note-what', 'spare fuse');
  check('I7 Write it down: "In something…" and "No place yet" at the top, and a box by photo', await count('.note-card .guess.inbox') >= 1 && await count('.note-card .path.in') === 1 && await count('.note-card .path.later') === 1);
  await page.click('.note-card .guess.inbox >> nth=0'); await page.waitForTimeout(100);
  const boxName = (await text('.note-card .guess.inbox.pre')).replace(/^In the /, '');
  await shot('15-write-inbox');
  await page.click('.note-card .btn-primary'); await page.waitForSelector('.board'); await page.waitForTimeout(500);
  const sf = await byName('spare fuse'); const sfe = sf ? await openTo(sf.id) : [];
  check('I8 Write it down → in the box (an edge to the thing)', sfe.length === 1 && sfe[0].to.t === 'thing', `${boxName} ${JSON.stringify(sfe.map((e) => e.to))}`);
  // Edit → Where it is → In something…
  await page.click('.tile:has-text("Car keys")'); await page.waitForSelector('.card.thing');
  await page.click('.act:has-text("Edit")'); await page.waitForTimeout(200); await page.click('.fix .field-value >> nth=1').catch(() => {}); await page.waitForTimeout(300);
  if (!(await count('.place-sheet'))) { await page.click('.fix .field-value:has-text("Hall table")'); await page.waitForTimeout(300); }
  check('I9 Edit → Where it is: "In something…" first, then boxes by photo', await count('.place-sheet .guess.inbox') >= 1 && await count('.place-sheet .path.in') === 1);
  await shot('16-edit-inbox');
  await page.click('.place-sheet .path.in'); await page.waitForSelector('.it-search');
  await page.fill('.it-search input', 'wooden'); await page.waitForTimeout(200); await page.click('.putin-grid .tile:has-text("Wooden box")'); await page.waitForTimeout(800);
  const ke2 = await openTo('k');
  check('I10 …picked the wooden box → the car keys are in it', ke2.length === 1 && ke2[0].to.id === 'w', JSON.stringify(ke2.map((e) => e.to)));
  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board');
  // ---- a box not logged yet, made right at the top of "What is it in?" (Ravi 09-27)
  await shootOne();
  await page.click('.photo-card .path.in'); await page.waitForSelector('.it-search');
  await page.fill('.it-search input', "Dona Homer's tin box"); await page.waitForTimeout(200);
  check('K1 typed a box that is not logged: "New: Dona Homer\'s tin box" is offered at the top', /New:\s*Dona Homer's tin box/.test(await text('.it-new')) && !(await page.locator('.it-new').isDisabled()));
  await shot('17-new-box');
  await page.click('.it-new'); await page.waitForTimeout(1500);
  const tinBox = await byName("Dona Homer's tin box");
  const bcs = (await items()).filter((d) => d.name === 'bottle cap');
  const linked = [];
  for (const b of bcs) { const e = await openTo(b.id); if (e.length && e[0].to.t === 'thing' && tinBox && e[0].to.id === tinBox.id) linked.push(b.id); }
  check('K2 …made the tin box (a thing, no place yet) and the new thing is IN it (an edge by id)', !!tinBox && !tinBox.location && linked.length === 1, JSON.stringify({ tin: !!tinBox, linked }));
  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board');
  check('K3 on Home: the tin box is one tile ("1 inside") and waits under "Not put away"', /1 inside/.test(await text(`.tile:has-text("Dona Homer") .inbadge`)) && /Not put away/.test(await text('.notput')));
  await shot('18-new-box-home');

  // ---- B: the trail
  await setPrefs({ exp: { homeInside: 'b' } }); await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board');
  await page.click('.tile:has-text("Memorabilia box")'); await page.waitForSelector('.trail'); await page.click('.tile:has-text("Wooden box")'); await page.waitForSelector('.trail .c.here:has-text("Wooden box")');
  const tr = await text('.trail');
  check('G24 B · the trail: Home › Garage shelf › Memorabilia box › Wooden box', /Home[\s\S]*Garage shelf[\s\S]*Memorabilia box[\s\S]*Wooden box/.test(tr), tr.replace(/\n/g, ' '));
  await shot('8-b-wood');
  await page.click('.trail .c:has-text("Garage shelf")'); await page.waitForSelector('.trail .c.here:has-text("Garage shelf")');
  check('G25 B · tap a step: the fixed place opens too (the memorabilia box is at the garage shelf)', (await tiles()).some((x) => /Memorabilia box/.test(x)) && /a place/.test(await text('.ctx-line')));
  await shot('9-b-place');
  // Settings shows the switch
  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board'); await page.click('.tiny'); await page.waitForSelector('.group-title:has-text("Experimentation")');
  check('G26 Settings → Experimentation: "Inside a box on Home" · Back + banner / Trail (Trail on)', /Inside a box on Home/.test(await page.locator('.settings, .screen').first().innerText()) && await count('.seg button.on:has-text("Trail")') === 1);
  await page.click('.seg button:has-text("Back + banner")'); await page.waitForTimeout(200);
  check('G27 …switching it back takes effect', (await page.evaluate(() => JSON.parse(localStorage.getItem('recall-prefs')).exp.homeInside)) === 'a');
  await shot('10-settings');
  // ---- a helper with the rules ON: sees boxes, puts a shared thing in; never sees the private one
  await page.evaluate(() => window.__rig.rules(true));
  await boot('ravi', 'dad');
  t = await tiles();
  check('G28 helper (Can help): Home shows the box, not what is inside; not the private passport', t.some((x) => /Memorabilia box/.test(x)) && !t.some((x) => /Passport|Baseball card/.test(x)), t.join(' | '));
  await page.click('.tile:has-text("Memorabilia box")'); await page.waitForSelector('.ctx-banner'); await page.click('.tile:has-text("Wooden box")'); await page.waitForSelector('.ctx-head .t:has-text("Wooden box")');
  await page.click('.footer .btn-primary.alt:has-text("Put in")'); await page.waitForSelector('.putin-sheet');
  const hc = await page.locator('.putin-grid .tile-label').allInnerTexts();
  check('G29 helper Put in: the private passport is never offered', !hc.some((x) => /Passport/.test(x)));
  await page.click('.putin-grid .tile:has-text("Blue binders")'); await page.click('.putin-foot .btn-primary'); await page.waitForTimeout(700);
  const ke = (await page.evaluate(() => window.__rig.rules(false)), await openTo('b'));
  check('G30 helper put the blue binders in: an edge owned by Dad, made by Ravi', ke.length === 1 && ke[0].to.id === 'w' && ke[0].owner === 'dad' && ke[0].by === 'ravi', JSON.stringify(ke));
  // ---- Largest
  await boot('dad'); await setPrefs({ size: 'largest', exp: { homeInside: 'b' } }); await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board');
  await page.click('.tile:has-text("Memorabilia box")'); await page.waitForSelector('.trail'); await page.click('.tile:has-text("Wooden box")'); await page.waitForSelector('.trail .c.here');
  const noSide = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  check('G31 Largest · B: the trail wraps, no sideways scroll', noSide);
  await shot('11-largest-b');
  await setPrefs({ exp: { homeInside: 'a' } }); await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board');
  await page.click('.tile:has-text("Memorabilia box")'); await page.waitForSelector('.ctx-banner');
  check('G32 Largest · A: the banner fits, no sideways scroll', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  await shot('12-largest-a');

  check('E0 no page errors', errors.length === 0, errors.join(' | '));
  const pass = results.filter((r) => r.ok).length;
  console.log(`\n${pass}/${results.length} passed`);
  fs.writeFileSync('shots/audit_graph.json', JSON.stringify({ results, errors }, null, 1));
  await browser.close(); server.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
