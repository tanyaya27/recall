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

let whereNext = null; // the camera's "where" photo answer (09-27)
async function main() {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const ctx = await browser.newContext({ permissions: ['camera'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.route('https://api.anthropic.com/**', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}'); const content = body.messages?.[0]?.content || [];
    const images = content.filter((b) => b.type === 'image').length; const isSame = content.some((b) => b.type === 'text' && /NEW PHOTO/.test(b.text));
    const isWhere = content.some((b) => b.type === 'text' && /MOVES:/.test(b.text));
    const text = JSON.stringify(isWhere ? (whereNext || { name: 'shelf', moves: false, index: 0, sure: false }) : isSame ? { index: -1, sure: false } : images ? { name: 'bottle cap', sameAs: '', alternatives: [], restingOn: '', placeCertain: false, placeGuesses: [], description: '', details: '', private: false, secretVisible: false } : { matches: [], message: '' });
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [{ type: 'text', text }] }) });
  });
  await require('./legacy_flow.js')(ctx); const page = await ctx.newPage();
  // 09-29 camera card: after a where photo, wait while ReCall looks; if "Choose place" opened to name it, take ReCall's
  // name (or a made-up one when there is none / it's taken) — the old camera named it silently.
  const settleWhere = async (fallback = '') => {
    for (let k = 0; k < 40; k++) { if (!(await page.locator('.lv-look').count())) break; await page.waitForTimeout(150); }
    for (let k = 0; k < 14 && !(await page.locator('.where-list, .photo-for').count()); k++) await page.waitForTimeout(150); for (let k = 0; k < 40 && (await page.locator('.where-list .wl-sugg.quiet:has-text("Looking")').count()); k++) await page.waitForTimeout(150); /* 09-30f: Choose place opens at once; wait for ReCall's look */ // the sheet can open a beat after the look ends
    if (await page.locator('.wl-pend .btn-primary').count()) {
      if (await page.locator('.wl-pend .btn-primary').isDisabled()) await page.locator('.wl-pend input').fill(fallback || ('Spot ' + (Date.now() % 100000)));
      await page.click('.wl-pend .btn-primary'); await page.waitForTimeout(300);
    }
  };
  const pickPlace = async (name) => { await page.click('.lc-choose'); await page.waitForSelector('.where-list'); await page.fill('.wl-search input', name); await page.waitForTimeout(150); await page.click(`.where-list .wl-row:has-text("${name}")`); await page.waitForTimeout(350); };
  const saveNext = async () => { const b = await page.locator('.lc-k.sv').boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await page.waitForTimeout(800); await page.mouse.up(); await page.waitForTimeout(400); };
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

  // Build 2 (09-27): ONE PAGE PER THING — every tile opens its page, a box's page shows what is in it; the inside
  // view and its A/B experiment are gone. Only containers hold things. One way to say where: the camera (Move it,
  // Put it somewhere), with ••• = every place and box. No loops, refused at write time.
  const page2 = async (n) => { await page.click(`.tile:has-text("${n}")`); await page.waitForSelector('.thing-page'); await page.waitForTimeout(200); };
  const grid = async () => page.locator('.tp-grid button span').allInnerTexts();
  const home = async () => { await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board'); await page.waitForTimeout(250); };
  const moveVia = async (search, pick) => { // on a thing's page: Move it / Put it somewhere → ••• → search → pick a row (or the typed new place) → Save
    await page.click('.tp-btn:has-text("Move it"), .tp-btn:has-text("Put it somewhere")'); await page.waitForSelector('.lc'); await page.waitForTimeout(350);
    await page.click('.lc-choose'); await page.waitForSelector('.where-list'); await page.fill('.wl-search input', search); await page.waitForTimeout(150);
    if (pick) await page.click(`.where-list .wl-row:has(b:text-is("${pick}"))`); else await page.click('.wl-new.typed');
    await page.waitForTimeout(250); await page.click('.lc-k.sv'); await page.waitForSelector('.lc', { state: 'detached' }); await page.waitForTimeout(600);
  };

  // ---- Home: contents stay off the top level; a box is one tile with a count
  let t = await tiles();
  check('G1 Home shows the memorabilia box, not what is in it', t.some((x) => /Memorabilia box/.test(x)) && !t.some((x) => /Wooden box|Baseball card|Yearbook/.test(x)), t.join(' | '));
  check('G2 the box tile says "3 inside"; line 2 says where it is (Crawl space)', /3 inside/.test(await text('.tile:has-text("Memorabilia box") .inbadge')) && /Crawl space/.test(await text('.tile:has-text("Memorabilia box") .tile-sub.place')));
  check('G2b "N inside" only on something that holds things (the car keys have none)', await count('.tile:has-text("Car keys") .inbadge') === 0);
  // ---- Only containers hold things (Ravi 09-27): an empty shoe box is a thing until she says it holds things
  await page2('Shoe box');
  check('J1 a thing that holds nothing: no "In it", no "Put items in" (#12)', await count('#tp-in') === 0 && !/Put items in/.test(await text('.thing-page')));
  await page.click('.sw[aria-label="It holds items"]'); await page.waitForTimeout(400);
  check('J1b "It holds items" on → the page shows "In the shoe box · 0" with Put items in and Log something in; the mark is saved', /In the shoe box · 0/i.test(await text('#tp-in')) && await count('.tp-btn:has-text("Put items in")') === 1 && await count('.tp-btn:has-text("Log something in")') === 1 && (await byName('shoe box')).holds === true);
  await shot('0a-emptybox');
  await page.click('.tp-btn:has-text("Put items in")'); await page.waitForSelector('.putin-sheet');
  await page.click('.putin-grid .tile:has-text("Reading glasses")'); await page.click('.putin-foot .btn-primary'); await page.waitForTimeout(600);
  const sg = await openTo('g');
  check('J2 …put the reading glasses in: an edge to the shoe box; it shows in the grid', sg.length === 1 && sg[0].to.id === 's' && (await grid()).some((x) => /Reading glasses/.test(x)), JSON.stringify(sg.map((e) => e.to)));
  await page.click('.sw[aria-label="It holds items"]'); await page.waitForTimeout(300);
  check('J2a "It holds items" can\'t be switched off while something is inside', /has 1 item in it/.test(await text('.sheet-title')) && (await byName('shoe box')).holds === true);
  await page.click('.sheet .btn-secondary, .sheet .btn-primary.alt').catch(() => {}); await page.waitForTimeout(200);
  await page.click('.toast-undo').catch(() => {}); await page.waitForTimeout(600);
  await home();
  // ---- ••• on the camera: every place and every box — never a thing that holds nothing, never a loop
  await page2('Car keys');
  await page.click('.tp-btn:has-text("Move it")'); await page.waitForSelector('.lc'); await page.waitForTimeout(350);
  await page.click('.lc-choose'); await page.waitForSelector('.where-list');
  const wl = await text('.where-list');
  // D5 ruling (Ravi 09-28): ONE list headed "YOUR PLACES · N"; a box is a row whose second line starts "a box · " (no Boxes heading any more).
  const rows = await page.evaluate(() => [...document.querySelectorAll('.where-list .wl-row')].map((r) => ({ b: r.querySelector('b').innerText, s: r.querySelector('small').innerText })));
  const boxRows = rows.filter((r) => /^a box · /.test(r.s));
  check('J2b every box once, as a box — never again as a place called "Wooden box"; never a thing that holds nothing (#5, #10, #14)',
    boxRows.filter((r) => r.b === 'Wooden box').length === 1 && rows.filter((r) => r.b === 'Wooden box').length === 1 && !rows.some((r) => /^(Reading glasses|Coffee can|Passport|Car keys)$/.test(r.b)) && /YOUR PLACES · \d+/.test(wl), wl.replace(/\n/g, ' / ').slice(0, 220));
  const ov = await page.evaluate(() => { const sh = document.querySelector('.where-list').getBoundingClientRect(); return [...document.querySelectorAll('.where-list .wl-row')].map((b) => Math.round(sh.right - b.getBoundingClientRect().right)); });
  check('J2c the list stays inside the sheet (no row runs off the right edge)', ov.every((g) => g >= 8), JSON.stringify(ov));
  check('J2d "Photograph a new place" is at the top (D5: was "New place or box: photograph it")', await count('.where-list .wl-new:has-text("Photograph a new place")') === 1);
  await shot('0-wherelist');
  await page.click('.where-list .btn-quiet'); await page.click('.lc-x'); await page.waitForTimeout(250);
  check('J3 a thing that is not a container keeps a short page (no In it block)', await count('#tp-in') === 0);
  await home();
  // ---- Not put away: a list of those things; each opens its page (#13, #14)
  check('J4 Home: "Not put away · 2" (the coffee can and the blue binders)', /Not put away · 2/.test(await text('.notput')));
  await page.click('.notput'); await page.waitForSelector('.notput-page');
  const np = await page.locator('.np-row b').allInnerTexts();
  check('J5 Not put away is a list of the things (not a list of places)', np.length === 2 && np.every((x) => /Coffee can|Blue binders/.test(x)), np.join(' | '));
  await shot('0b-notput');
  await page.click('.np-row:has-text("Coffee can")'); await page.waitForSelector('.thing-page');
  check('J6 a row opens that thing\'s page: amber "No place yet" and Put it somewhere', /No place yet/.test(await text('.tp-wh b')) && await count('.tp-btn.amber:has-text("Put it somewhere")') === 1);
  await page.click('.tp-btn:has-text("Put it somewhere")'); await page.waitForSelector('.lc'); await page.waitForTimeout(350);
  check('J7 Put it somewhere → the camera: "Where is the coffee can?" (in the band), the can already there, level 1 chosen', /Where is the\s*coffee can\?/i.test(await text('.lc-band')) && /^Level 1/.test(await page.locator('.lv-sq.sel').getAttribute('aria-label')));
  await shot('0c-putsomewhere');
  await pickPlace('Hall table');
  check('J7b one verb on the button ("Save"); the sentence above says "Hall table"', (await text('.lc-k.sv')).trim() === 'Save' && /Hall table/.test(await text('.lc-say')));
  await page.click('.lc-k.sv'); await page.waitForSelector('.lc', { state: 'detached' }); await page.waitForTimeout(600);
  check('J8 saved: at the Hall table (a place edge); the page says so, with Undo', (await byName('coffee can')).location === 'Hall table' && (await openTo('u'))[0].to.name === 'Hall table' && /Hall table/.test(await text('.tp-wh b')) && /Put away just now/.test(await text('.tp-moved')) && await count('.tp-moved .u') === 1); // 09-30 (Ravi 2C): said on the page, with Undo
  await page.waitForTimeout(600); await page.click('.tp-moved .u'); await page.waitForTimeout(900);
  check('J9 Undo: no place again', !(await byName('coffee can')).location && /No place yet/.test(await text('.tp-wh b')));
  await home();
  await shot('1-home');
  // ---- a box's page: what is in it, one level at a time; Back returns
  await page2('Memorabilia box');
  let gi = await grid();
  check('G3 tap the box: ITS page — "In the memorabilia box · 3" (the wooden box, the yearbook, the letters); Where it is: Crawl space', gi.length === 3 && gi.some((x) => /Wooden box/.test(x)) && /· 3/.test(await text('#tp-in')) && /Crawl space/.test(await text('.tp-wh b')), gi.join(' | '));
  await shot('2-memo-page');
  await page.click('.tp-grid button:has-text("Wooden box")'); await page.waitForSelector('.thing-head .name:has-text("Wooden box")');
  check('G4 …the wooden box inside opens its own page ("In the wooden box · 2")', /In the wooden box · 2/i.test(await text('#tp-in')));
  check('G5 its Where it is: "Memorabilia box (in) Crawl space" (09-29h: the "in" pill), with the box\'s photo', /^Memorabilia box\s*in\s*Crawl space$/.test((await text('.tp-wh .tp-chain')).replace(/\n/g, ' ').trim()) && await count('.tp-wh .tp-chain .in') === 1 && await count('.tp-wh .ch img') >= 1, await text('.tp-wh .tx'));
  check('G6 a container page offers Put items in and Log something in (and nothing starts a job from a child page\'s footer)', await count('.tp-btn:has-text("Put items in")') === 1 && await count('.tp-btn:has-text("Log something in")') === 1 && await count('.footer') === 0);
  await shot('3-wood-page');
  await page.click('.thing-head .chev'); await page.waitForSelector('.thing-head .name:has-text("Memorabilia box")');
  await page.click('.thing-head .chev'); await page.waitForSelector('.dayrow');
  check('G7 Back steps out one page at a time, then Home', await count('.dayrow') === 1);
  // ---- the thing's page: which box, with the box's photo
  await page.evaluate(() => { const fs = window.__rigfs; return fs.updateDoc(fs.doc(fs.collection(null, 'recall_items'), 'c'), { promoted: true }); });
  await page.waitForTimeout(300);
  await page2('Baseball card');
  check('G9 the page: "Wooden box (in) Memorabilia box (in) Crawl space", with both boxes\' photos', /^Wooden box\s*in\s*Memorabilia box\s*in\s*Crawl space$/.test((await text('.tp-wh .tp-chain')).replace(/\n/g, ' ').trim()) && await count('.tp-wh .ch img') >= 2, await text('.tp-wh .tx'));
  check('G9b a thing inside a box, not itself a container, offers no "Put items in" (the pencil case)', await count('#tp-in') === 0);
  await shot('4-card');
  await home();
  check('G10 promoted: the card is on Home too; line 2 says "In the wooden box"', /In the wooden box/.test(await text('.tile:has-text("Baseball card") .tile-sub.place')));
  await shot('5-promoted');
  await page.locator('.tile:has-text("Baseball card")').dispatchEvent('pointerdown'); await page.waitForTimeout(750); await page.locator('.tile:has-text("Baseball card")').dispatchEvent('pointerup');
  await page.waitForSelector('.item-sheet', { timeout: 3000 }).catch(() => {});
  const sheetTxt = await text('.item-sheet');
  check('G11 hold a promoted thing → "Take it off Home"; the sheet is trimmed (no Put items in on a card)', /Take it off Home/.test(sheetTxt) && !/Put items in|Change the place|Move to the top/.test(sheetTxt), sheetTxt.replace(/\n/g, ' / '));
  if (/Take it off Home/.test(sheetTxt)) { await page.click('.sheet-row:has-text("Take it off Home")'); await page.waitForTimeout(300); }
  check('G12 …and taking it off Home works', (await byName('baseball card')).promoted === false);
  // ---- Put items in (+ Undo), from the box's page
  await page2('Memorabilia box'); await page.click('.tp-grid button:has-text("Wooden box")'); await page.waitForSelector('.thing-head .name:has-text("Wooden box")');
  await page.click('.tp-btn:has-text("Put items in")'); await page.waitForSelector('.putin-sheet');
  const cand = await page.locator('.putin-grid .tile-label').allInnerTexts();
  check('G13 Put items in: things not put away come first; the boxes this one is in are never offered (no circles)', /Coffee can|Blue binders/.test(cand[0] || '') && !cand.some((x) => /Memorabilia box/.test(x)) && !cand.some((x) => /Baseball card|Ticket stubs/.test(x)), cand.slice(0, 5).join(' | '));
  check('G13b every thing offered shows its name (rows never squash)', await page.evaluate(() => [...document.querySelectorAll('.putin-grid .tile')].every((t) => { const l = t.querySelector('.tile-label').getBoundingClientRect(); const r = t.getBoundingClientRect(); return l.height > 10 && l.bottom <= r.bottom + 1; })));
  await page.click('.putin-grid .tile:has-text("Coffee can")'); await page.click('.putin-grid .tile:has-text("Blue binders")');
  check('G14 one verb on the button ("Put in"); the sentence says "2 items · into the wooden box"', (await text('.putin-foot .btn-primary')).trim() === 'Put in' && /2 items/.test(await text('.putin-foot .lc-say')) && /into the wooden box/.test(await text('.putin-foot .lc-say')));
  await shot('6-putin');
  await page.click('.putin-foot .btn-primary'); await page.waitForTimeout(600);
  const cc = await openTo('u'), bb = await openTo('b');
  const g15 = await grid();
  check('G15 saved: each has one open edge to the wooden box; the page grid shows them', cc.length === 1 && cc[0].to.id === 'w' && bb.length === 1 && (await byName('coffee can')).location === 'Wooden box' && g15.some((x) => /Coffee can/.test(x)) && g15.some((x) => /Blue binders/.test(x)), g15.join(' | '));
  check('G16 toast "Put 2 in the wooden box" with Undo', /Put 2 in the wooden box/.test(await text('.toast')) && /Undo/.test(await text('.toast')));
  await shot('7-put');
  await page.click('.toast-undo'); await page.waitForTimeout(700);
  const cc2 = await openTo('u');
  check('G17 Undo: back where they were (no open edge to the box; not put away again)', !cc2.some((e) => e.to && e.to.id === 'w') && !(await byName('coffee can')).location, JSON.stringify(cc2));
  // ---- Log something in: the camera with the box as level 1
  await page.click('.tp-btn:has-text("Log something in")'); await page.waitForSelector('.lc'); await page.waitForTimeout(400);
  await page.click('.lc-shutter'); await page.waitForTimeout(1200);
  check('G18 Log something in: the camera already says "Place: Wooden box" (09-30: the name, as in the chain)', /Place:\s*Wooden box/i.test(await text('.lc-say')), await text('.lc-say'));
  await page.click('.lc-k.sv'); await page.waitForTimeout(1500);
  const stub = await byName('bottle cap'); const se = stub ? await openTo(stub.id) : [];
  check('G19 …Save: the new thing is in the wooden box (an edge to it), and we are back on the box\'s page', se.length === 1 && se[0].to.t === 'thing' && se[0].to.id === 'w' && /Wooden box/.test(await text('.thing-head .name')), JSON.stringify(se.map((e) => e.to)));
  // ---- moving the big box moves everything in it (no writes to what's inside)
  await home();
  const before = JSON.stringify((await items()).find((d) => d.id === 'c'));
  await page2('Memorabilia box');
  await page.click('.tp-btn:has-text("Move it")'); await page.waitForSelector('.lc'); await page.waitForTimeout(350);
  await page.click('.lc-choose'); await page.waitForSelector('.where-list');
  const lw = await text('.where-list');
  check('L1 moving the memorabilia box: the wooden box inside it is never offered, nor the box itself (no loops, #8)', (await count('.where-list .wl-row:has(b:text-is("Wooden box"))')) === 0 && (await count('.where-list .wl-row:has(b:text-is("Memorabilia box"))')) === 0, lw.replace(/\n/g, ' / ').slice(0, 200));
  await page.click('.where-list .btn-quiet'); await page.click('.lc-x'); await page.waitForTimeout(250);
  await moveVia('Garage shelf', null);
  const me2 = await openTo('m');
  check('G20 the memorabilia box moved: its open edge is now "Garage shelf" (old one closed)', me2.length === 1 && me2[0].to.t === 'place' && me2[0].to.name === 'Garage shelf' && (await edges()).some((e) => e.id === 'em' && e.until), JSON.stringify(me2.map((e) => e.to)));
  check('G21 …the card inside was not written to', JSON.stringify((await items()).find((d) => d.id === 'c')) === before);
  // ---- the loop guard at WRITE time (Priyanka): even a direct write cannot put a box into what is inside it
  const lg = await page.evaluate(async () => { const g = (id) => window.__rig.dump().find((d) => d.id === id); const ok = await window.__rigdb.changeLocation(g('m'), 'Wooden box', 'chosen', { t: 'thing', id: 'w', name: 'wooden box' }); const ok2 = await window.__rigdb.putInto([g('m')], g('c')); return { ok, ok2 }; });
  await page.waitForTimeout(400);
  const me3 = await openTo('m');
  check('L2 write-time guard: changeLocation(memorabilia box → wooden box) is refused; putInto(box → the card in it) puts nothing', lg.ok === false && lg.ok2 === 0 && me3.length === 1 && me3[0].to.name === 'Garage shelf', JSON.stringify({ lg, to: me3.map((e) => e.to) }));
  await home();
  await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('.ask input', 'baseball'); await page.waitForTimeout(400);
  check('G22 Find "baseball": the result says "In the wooden box"', /In the wooden box/.test(await page.locator('.ask').innerText()));
  await home();
  // ---- typing a box's name finds the box — never a new place with the same words (G23)
  await page2('Reading glasses');
  await page.click('.tp-btn:has-text("Move it")'); await page.waitForSelector('.lc'); await page.waitForTimeout(350);
  await page.click('.lc-choose'); await page.waitForSelector('.where-list'); await page.fill('.wl-search input', 'in the wooden box'); await page.waitForTimeout(200);
  check('G23a typed "in the wooden box": the wooden box is the answer; no "A new place called …"', await count('.where-list .wl-row:has(b:text-is("Wooden box"))') === 1 && await count('.wl-new.typed') === 0);
  await page.click('.where-list .wl-row:has(b:text-is("Wooden box"))'); await page.waitForTimeout(250); await page.click('.lc-k.sv'); await page.waitForSelector('.lc', { state: 'detached' }); await page.waitForTimeout(600);
  const ge = await openTo('g');
  check('G23 …an edge to the wooden box (not a place called that); the text copy says "Wooden box"', ge.length === 1 && ge[0].to.t === 'thing' && ge[0].to.id === 'w' && (await byName('reading glasses')).location === 'Wooden box', JSON.stringify(ge.map((e) => e.to)));
  await home();
  // ---- the camera from Log item
  // The fake AI calls every photo "bottle cap", so from the second one on it is ASKED "Your bottle cap?" — as it must be. Answer no.
  const shootOne = async () => { await page.click('.footer .btn-primary:not(.alt)'); await page.waitForSelector('.lc'); await page.waitForTimeout(350); await page.click('.lc-shutter'); await page.waitForTimeout(1200);
    if (await count('.lc-ask button:has-text("No, a new item")')) { await page.click('.lc-ask button:has-text("No, a new item")'); await page.waitForTimeout(200); } };
  await shootOne();
  // 09-29 (Ravi): no pills on the camera any more — ☰ Choose place lists places and boxes (a box with its photo).
  await page.click('.lc-choose'); await page.waitForSelector('.where-list');
  const wrows = await page.evaluate(() => [...document.querySelectorAll('.where-list .wl-row')].map((r) => ({ b: r.querySelector('b').innerText, s: r.querySelector('small').innerText, img: !!r.querySelector('img') })));
  const boxRow = wrows.find((r) => /^a box · /.test(r.s)); const boxChip = boxRow ? boxRow.b : '';
  check('I1 the camera: ☰ Choose place lists places and boxes (a box with its photo), none twice', !!boxRow && boxRow.img && wrows.some((r) => !/^a box · /.test(r.s)) && new Set(wrows.map((r) => r.b)).size === wrows.length, wrows.map((r) => r.b).join(' | '));
  await page.click('.where-list .btn-quiet'); await page.waitForTimeout(250);
  check('I2 the camera: "Place: not defined" until a place is given; Save is always one word, beside the shutter', /Place:\s*not defined/.test(await text('.lc-say')) && (await text('.lc-k.sv')).trim() === 'Save');
  await shot('14-camera-chips');
  await pickPlace(boxChip);
  check('I3 choose the box: "Place: <box>" above Save', new RegExp('Place:\\s*' + boxChip, 'i').test(await text('.lc-say')), boxChip + ' / ' + await text('.lc-say'));
  await page.click('.lc-k.sv'); await page.waitForTimeout(1500);
  const boxDoc = await byName(boxChip.toLowerCase());
  let bc = (await items()).find((d) => d.name === 'bottle cap' && d.location === boxChip);
  let bce = bc ? await openTo(bc.id) : [];
  check('I4 …saved IN that box (an edge to the thing)', !!boxDoc && bce.length === 1 && bce[0].to.t === 'thing' && bce[0].to.id === boxDoc.id, JSON.stringify(bce.map((e) => e.to)));
  await home();
  await shootOne();
  await page.click('.lc-k.sv'); await page.waitForTimeout(1500);
  const npl = (await items()).filter((d) => d.name === 'bottle cap' && !d.location);
  check('I5 Save with nothing given saves with no place and no link', npl.length === 1 && (await openTo(npl[0].id)).length === 0);
  await home();
  check('I6 …and it shows on Home as "No place yet"', (await page.locator('.tile-label.noplace').allInnerTexts()).some((x) => /Bottle cap/.test(x) && /No place yet/.test(x)));
  // Write it down: the one where list
  await page.click('.footer .btn-primary:not(.alt)'); await page.waitForSelector('.lc'); await page.click('.lc-typeit button'); await page.waitForSelector('.note-card');
  await page.fill('#note-what', 'spare fuse');
  check('I7 Write it down: "Pick a place or box" and "No place yet" at the top, and boxes by photo', await count('.note-card .guess.inbox') >= 1 && /Pick a place or box/.test(await text('.note-card .path.in')) && await count('.note-card .path.later') === 1);
  await page.click('.note-card .path.in'); await page.waitForSelector('.where-list');
  check('I7b …it opens the same list as the camera\'s ••• (every place and box)', /YOUR PLACES · \d+/.test(await text('.where-list')) && /Where is the spare fuse\?/.test(await text('.where-list .sheet-title')));
  await page.click('.where-list .wl-row:has(b:text-is("Shoe box"))'); await page.waitForTimeout(150);
  await shot('15-write-inbox');
  await page.click('.note-card .btn-primary'); await page.waitForSelector('.board'); await page.waitForTimeout(500);
  const sf = await byName('spare fuse'); const sfe = sf ? await openTo(sf.id) : [];
  check('I8 Write it down → in the shoe box (an edge to the thing)', sfe.length === 1 && sfe[0].to.t === 'thing' && sfe[0].to.id === 's', JSON.stringify(sfe.map((e) => e.to)));
  // Move it → search → a box
  await page2('Car keys'); await moveVia('wooden', 'Wooden box');
  const ke2 = await openTo('k');
  check('I10 Move it → ••• → "wooden" → the wooden box: the car keys are in it', ke2.length === 1 && ke2[0].to.id === 'w', JSON.stringify(ke2.map((e) => e.to)));
  await home();
  // ---- a box not logged yet: she photographs it — ＋ first, so the photo goes where she means (Ravi 09-27)
  await shootOne();
  check('K0 after the first photo the ITEM stays chosen (its photo in the band, white ring): a second photo is another photo of it', await count('.lc-band .lc-thing.sel') === 1);
  await page.click('.lv-sq.plus'); await page.waitForTimeout(200);
  whereNext = { name: "Dona Homer's tin box", moves: true, index: 0, sure: false };
  await page.click('.lc-shutter'); await settleWhere();
  check('K1 ＋ then a photo: named from the photo, "In the …tin box" above Save', /tin box/i.test(await text('.lc-say')), await text('.lc-say'));
  await shot('17-new-box');
  await page.click('.lc-k.sv'); await page.waitForTimeout(1800); whereNext = null;
  const tinBox = await byName("Dona Homer's tin box");
  const bcs = (await items()).filter((d) => d.name === 'bottle cap');
  const linked = [];
  for (const b of bcs) { const e = await openTo(b.id); if (e.length && e[0].to.t === 'thing' && tinBox && e[0].to.id === tinBox.id) linked.push(b.id); }
  check('K2 …made the tin box as a thing WITH its photo, marked as holding things, and the new thing is IN it', !!tinBox && !!tinBox.thumb && tinBox.holds === true && linked.length === 1, JSON.stringify({ tin: !!tinBox, photo: !!(tinBox && tinBox.thumb), holds: tinBox && tinBox.holds, linked }));
  await home();
  check('K3 on Home: the tin box is one tile ("1 inside"); with no place given it waits under "Not put away"', /1 inside/.test(await text(`.tile:has-text("Dona Homer") .inbadge`)) && /Not put away/.test(await text('.notput')));
  await shot('18-new-box-home');
  // ---- the inside view and its experiment are gone
  await page.click('.tiny'); await page.waitForSelector('.settings');
  check('G26 Settings: no Experimentation section (the inside-a-box A/B is retired with the view)', await count('.group-title:has-text("Experimentation")') === 0);
  check('G27 Settings: Show times on photos lives here now (#27)', await count('.settings .sw[aria-label="Show times on photos"]') === 1);
  // ---- a helper with the rules ON: sees boxes, puts a shared thing in; never sees the private one
  await page.evaluate(() => window.__rig.rules(true));
  await boot('ravi', 'dad');
  t = await tiles();
  check('G28 helper (Can help): Home shows the box, not what is inside; not the private passport', t.some((x) => /Memorabilia box/.test(x)) && !t.some((x) => /Passport|Baseball card/.test(x)), t.join(' | '));
  await page2('Memorabilia box'); await page.click('.tp-grid button:has-text("Wooden box")'); await page.waitForSelector('.thing-head .name:has-text("Wooden box")');
  await page.click('.tp-btn:has-text("Put items in")'); await page.waitForSelector('.putin-sheet');
  const hc = await page.locator('.putin-grid .tile-label').allInnerTexts();
  check('G29 helper Put items in: the private passport is never offered', !hc.some((x) => /Passport/.test(x)));
  await page.click('.putin-grid .tile:has-text("Blue binders")'); await page.click('.putin-foot .btn-primary'); await page.waitForTimeout(700);
  await page.click('.thing-head .chev'); await page.waitForTimeout(300); await page.click('.thing-head .chev'); await page.waitForTimeout(300);
  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board');
  await page2('Coffee can'); const hb = (await byName('coffee can')).holds;
  await page.click('.sw[aria-label="It holds items"]'); await page.waitForTimeout(600);
  const hg = (await byName('coffee can')).holds;
  await page.click('.sw[aria-label="It holds items"]'); await page.waitForTimeout(600);
  const hg2 = (await byName('coffee can')).holds;
  const ke = (await page.evaluate(() => window.__rig.rules(false)), await openTo('b'));
  check('G30 helper put the blue binders in: an edge owned by Dad, made by Ravi', ke.length === 1 && ke[0].to.id === 'w' && ke[0].owner === 'dad' && ke[0].by === 'ravi', JSON.stringify(ke));
  check('G30b with the rules on, a helper can switch "It holds items" on and off (the rules allow holds)', !hb && hg === true && hg2 === false, JSON.stringify({ hb, hg, hg2 }));
  // ---- Largest
  await boot('dad'); await setPrefs({ size: 'largest' }); await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board');
  await page2('Memorabilia box'); await page.click('.tp-grid button:has-text("Wooden box")'); await page.waitForSelector('.thing-head .name:has-text("Wooden box")');
  const noSide = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  const btnFit = await page.evaluate(() => [...document.querySelectorAll('.tp-btn span')].every((s) => s.scrollWidth <= s.clientWidth + 1));
  check('G31 Largest: a box\'s page has no sideways scroll; every button\'s words fit', noSide && btnFit, JSON.stringify({ noSide, btnFit }));
  await shot('11-largest-page');
  await home();
  check('G32 Largest: Home has no sideways scroll', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  await shot('12-largest-home');

  check('E0 no page errors', errors.length === 0, errors.join(' | '));
  const pass = results.filter((r) => r.ok).length;
  console.log(`\n${pass}/${results.length} passed`);
  fs.writeFileSync('shots/audit_graph.json', JSON.stringify({ results, errors }, null, 1));
  await browser.close(); server.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
