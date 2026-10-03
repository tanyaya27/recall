// Independent tester rig (ow1). Shared setup: serve out/, fake camera + AI, seed a realistic house, helpers.
const pw = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const RIG = path.join(__dirname, '..');
const ROOT = path.join(RIG, 'out');
const img = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(RIG, 'mock/img', f)).toString('base64');

async function start({ port, w = 390, h = 844, size = null, shots = 'shots' } = {}) {
  const server = http.createServer((req, res) => { const f = path.join(ROOT, req.url.split('?')[0] === '/' ? 'index.html' : req.url.split('?')[0]);
    if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); });
  await new Promise((r) => server.listen(port, r));
  const wk = process.env.ENGINE === 'webkit';
  const browser = await (wk ? pw.webkit : pw.chromium).launch(wk ? {} : { args: ['--use-fake-ui-for-media-stream'] });
  const ctx = await browser.newContext({ ...(wk ? {} : { permissions: ['camera'] }), viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: wk ? undefined : true, hasTouch: true });
  await ctx.addInitScript(() => { const c = document.createElement('canvas'); c.width = 960; c.height = 1280; const g = c.getContext('2d'); const im = new Image(); let src = '';
    const paint = () => { if (window.__cam && window.__cam !== src) { src = window.__cam; im.src = src; } g.fillStyle = '#222'; g.fillRect(0, 0, c.width, c.height);
      if (im.complete && im.naturalWidth) { const s = Math.max(c.width / im.naturalWidth, c.height / im.naturalHeight); const ww = im.naturalWidth * s, hh = im.naturalHeight * s; g.drawImage(im, (c.width - ww) / 2, (c.height - hh) / 2, ww, hh); } };
    setInterval(paint, 60); const md = navigator.mediaDevices || {}; Object.defineProperty(navigator, 'mediaDevices', { value: md, configurable: true }); md.getUserMedia = async () => { paint(); return c.captureStream(15); }; });
  const S = { AI: { name: 'thing' }, GUESS: { name: 'Lab bench with a laptop', merged: 'Lab desk with a laptop' }, guessCalls: [], guessImgs: [], GUESS_DELAY: 250, guessQueue: [] };
  await ctx.route('https://api.anthropic.com/**', async (route) => { const body = JSON.parse(route.request().postData() || '{}'); const content = body.messages?.[0]?.content || [];
    const texts = content.filter((b) => b.type === 'text').map((b) => b.text).join('\n'); const images = content.filter((b) => b.type === 'image').length; let out; let delay = 250;
    if (/PLACE GUESS/.test(texts)) { const m = texts.match(/TYPED: "([^"]*)"/); S.guessCalls.push(m ? m[1] : null); S.guessImgs.push(images); out = S.guessQueue.length ? S.guessQueue.shift() : S.GUESS; delay = S.GUESS_DELAY; }
    else if (/NEW PHOTO/.test(texts)) out = { index: -1, sure: false };
    else if (images) out = { name: S.AI.name, sameAs: '', alternatives: [], restingOn: '', placeCertain: false, placeGuesses: [], description: '', details: '', private: !!S.AI.private, privateWhy: S.AI.private ? 'looks like ID' : '', secretVisible: false };
    else out = { matches: [], message: '' };
    await new Promise((r) => setTimeout(r, delay)); await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [{ type: 'text', text: JSON.stringify(out) }] }) }); });
  const page = await ctx.newPage(); page.setDefaultTimeout(Number(process.env.TO || 4000));
  const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/camera/.test(m.text())) errors.push('console: ' + m.text().slice(0, 200)); });
  const OUT = path.join(__dirname, shots); fs.mkdirSync(OUT, { recursive: true });
  const W = (ms) => page.waitForTimeout(ms);
  const H = {};
  H.page = page; H.S = S; H.W = W; H.errors = errors; H.img = img;
  H.tap = async (sel, w = 450) => { await page.locator(sel).first().click(); await W(w); };
  H.cam = async (f) => { await page.evaluate((s) => { window.__cam = s; }, img(f)); await W(250); };
  H.shoot = async (f, w = 900) => { if (f) await H.cam(f); await H.tap('.lc-shutter', w); };
  H.dump = () => page.evaluate(() => window.__rig.dump());
  H.items = async () => (await H.dump()).filter((d) => d.kind === 'item' && !d.deleted);
  H.byName = async (n) => (await H.items()).find((d) => (d.name || '').toLowerCase() === n.toLowerCase());
  H.byId = async (id) => (await H.dump()).find((d) => d.id === id);
  H.placeBy = async (n) => (await H.dump()).find((d) => d.kind === 'place' && (d.name || '').toLowerCase() === n.toLowerCase());
  H.placesNamed = async (n) => (await H.dump()).filter((d) => d.kind === 'place' && (d.name || '').toLowerCase() === n.toLowerCase());
  H.places = async () => (await H.dump()).filter((d) => d.kind === 'place');
  H.edgeOf = async (id) => (await H.dump()).find((d) => d.kind === 'edge' && d.from === id && !d.until) || null;
  H.edgesOf = async (id) => (await H.dump()).filter((d) => d.kind === 'edge' && d.from === id && !d.until);
  H.snapsOf = async (id) => (await H.dump()).filter((d) => d.kind === 'snap' && d.itemId === id);
  H.txt = (sel) => page.locator(sel).first().innerText().catch(() => '');
  H.has = async (sel) => (await page.locator(sel).count()) > 0;
  H.val = () => page.locator('.ow-input').inputValue();
  H.snap = async (f) => { await W(250); await page.screenshot({ path: path.join(OUT, f) }); };
  H.home = async () => { await page.goto(`http://localhost:${port}/`); await page.waitForSelector('.board, .screen'); await W(400); await page.evaluate(() => { window.__noAuto = true; }); };
  H.LOG = '.footer .btn-primary:not(.alt)';
  H.find = async (nm) => { await H.home(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', nm); await W(700); return (await page.locator('.ask .tile').allInnerTexts()).map((t) => t.replace(/\n/g, ' | ')); };
  H.openThing = async (nm) => { await H.home(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', nm); await W(600); await page.click('.ask .tile >> nth=0'); await page.waitForSelector('.thing-page'); await W(500); };
  H.openMove = async (nm) => { await H.openThing(nm); await H.tap('.thing-page button:has-text("Move it")', 900); };
  H.save = async () => { await H.tap('.lc-k.sv', 1400); };
  H.saveOff = () => page.locator('.lc-k.sv').isDisabled();
  H.typeWhere = async (s) => { await page.locator('.ow-input').click(); await W(150); await page.locator('.ow-input').fill(s); await W(300); };
  H.done = async () => { await page.locator('.ow-input').press('Enter'); await W(300); };
  H.leave = async () => { await H.tap('.lc-x', 300); if (await H.has('text=Leave')) await H.tap('text=Leave', 400); if (await H.has('text=Throw away')) await H.tap('text=Throw away', 400); };
  H.where = async () => (await H.txt('.tp-blk[aria-labelledby="tp-where"]')).replace(/\n/g, ' | ');
  H.note = async () => H.txt('.tp-note');
  H.head = async () => (await page.locator('.ow-head').first().evaluate((el) => el.textContent).catch(() => '')).replace(/\s+/g, ' ');
  H.holdSave = async (ms = 750) => { const b = await page.locator('.lc-k.sv').boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await W(ms); await page.mouse.up(); await W(1300); };
  H.write = (id, patch) => page.evaluate(([i, p]) => { const f = window.__rigfs; return f.updateDoc(f.doc(f.collection(null, 'recall_items'), i), p); }, [id, patch]);
  H.close = async () => { await browser.close(); server.close(); };

  // ---- results
  const results = [];
  H.check = (id, name, ok, note = '') => { results.push({ id, name, ok: !!ok, note }); console.log(`${ok ? 'PASS' : 'FAIL'}  [${id}] ${name}${note ? ' — ' + String(note).slice(0, 600) : ''}`); };
  H.info = (id, note) => console.log(`INFO  [${id}] ${String(note).slice(0, 1500)}`);
  H.step = async (id, name, fn) => { try { await fn(); } catch (e) { H.check(id, name, false, 'threw: ' + e.message.split('\n')[0]); await page.keyboard.press('Escape').catch(() => {}); } };
  H.results = results;

  // ---- seed: a realistic house
  H.seed = async ({ prefs = null } = {}) => {
    await page.goto(`http://localhost:${port}/`); await page.waitForSelector('.screen');
    await page.evaluate((pr) => { localStorage.clear(); window.__rig.reset(); localStorage.setItem('rig-uid', 'margaret'); localStorage.setItem('rig-anon', '0');
      localStorage.setItem('recall-ai-config', JSON.stringify({ provider: 'anthropic', apiKey: 'sk-ant-rig', model: '' })); if (pr) localStorage.setItem('recall-prefs', JSON.stringify(pr)); }, prefs);
    await page.goto(`http://localhost:${port}/`); await page.waitForSelector('.screen'); await W(300);
    const now = Date.now(), HR = 3600e3;
    const own = { owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [] };
    const T = (id, name, loc, f, ago, extra = {}) => ({ id, kind: 'item', ...own, name, location: loc, photo: img(f), thumb: img(f), thumbV: 2, order: now - ago, createdAt: now - ago, lastSeenAt: now - ago, logId: 'l_' + id, photoCount: 1, history: [{ location: loc, at: now - ago }], ...extra });
    const PH = (f, ago) => ({ photo: img(f), thumb: img(f), at: now - ago });
    const PL = (id, nm, fs2, ago) => ({ id, kind: 'place', ...own, name: nm, order: now - ago, createdAt: now - ago, parent: null, photos: (fs2 || []).map((f, i) => PH(f, ago - i * 1000)) });
    const E = (id, from, to, ago, extra = {}) => ({ id, kind: 'edge', rel: 'in', from, to, since: now - ago, until: null, how: 'chosen', ...own, ...extra });
    const SN = (id, itemId, f, loc, ago) => ({ id, kind: 'snap', owner: 'margaret', by: 'margaret', itemId, logId: 'l_' + itemId, photo: img(f), thumb: img(f), location: loc, at: now - ago });
    await page.evaluate((s) => window.__rig.seed(s), [
      // places
      PL('pOffice', 'Office', ['closet.jpg'], 200 * HR),
      PL('pDrawer', 'Desk drawer', ['drawer.jpg'], 190 * HR),
      PL('pGarage', 'Garage', ['tooldrawer.jpg'], 180 * HR),
      PL('pHall', 'Hall closet', [], 170 * HR),
      PL('pKitchen', 'Kitchen', ['real_spoon.jpg', 'soda.jpg', 'card.jpg', 'book.jpg', 'diary.jpg'], 160 * HR), // 5 photos
      PL('pSew', 'Sewing basket', ['box14.jpg'], 150 * HR), // a PLACE with the same name as a box below
      // place in place: Desk drawer is in the Office
      E('ePD', 'pDrawer', { t: 'place', name: 'Office' }, 190 * HR),
      // boxes
      T('tin', 'blue tin', 'Desk drawer', 'tin.jpg', 50 * HR, { holds: true }),
      T('small', 'small box', 'Blue tin', 'smallbox.jpg', 49 * HR, { holds: true }),
      T('shoe', 'shoebox', 'Hall closet', 'box.jpg', 48 * HR, { holds: true }),
      T('sewbox', 'sewing basket', 'Garage', 'box14.jpg', 47 * HR, { holds: true }),
      E('eTin', 'tin', { t: 'place', name: 'Desk drawer' }, 50 * HR),
      E('eSmall', 'small', { t: 'thing', id: 'tin', name: 'blue tin' }, 49 * HR),
      E('eShoe', 'shoe', { t: 'place', name: 'Hall closet' }, 48 * HR),
      E('eSew', 'sewbox', { t: 'place', name: 'Garage' }, 47 * HR),
      // items
      T('br', 'Walgreens Photo brochure', 'Office', 'folder.jpg', 2 * HR),
      T('gl', 'reading glasses', 'Desk drawer', 'glasses.jpg', 3 * HR, { history: [{ location: 'Desk drawer', at: now - 3 * HR }, { location: 'Desk drawer', at: now - 3 * HR + 10, w: 1, said: 'behind the stapler', by: 'margaret' }] }),
      T('ring', 'gold ring', 'Small box', 'card.jpg', 6 * HR),
      T('pp', 'passport', 'Desk drawer', 'real_passport.jpg', 7 * HR, { private: true, privateAuto: 'looks like ID' }),
      T('ky', 'keys', '', 'keys.jpg', 4 * HR, { history: [{ location: '', at: now - 4 * HR, by: 'margaret', w: 1, said: 'in my coat pocket' }] }),
      T('ch', 'phone charger', 'Garage', 'charger.jpg', 8 * HR),
      T('sc', 'scissors', 'Kitchen', 'scissors.jpg', 9 * HR),
      T('wal', 'wallet', 'Office', 'wallet.jpg', 10 * HR),
      E('eBr', 'br', { t: 'place', name: 'Office' }, 2 * HR), E('eGl', 'gl', { t: 'place', name: 'Desk drawer' }, 3 * HR),
      E('eRing', 'ring', { t: 'thing', id: 'small', name: 'small box' }, 6 * HR), E('ePp', 'pp', { t: 'place', name: 'Desk drawer' }, 7 * HR, { private: true }),
      E('eCh', 'ch', { t: 'place', name: 'Garage' }, 8 * HR), E('eSc', 'sc', { t: 'place', name: 'Kitchen' }, 9 * HR), E('eWal', 'wal', { t: 'place', name: 'Office' }, 10 * HR),
      SN('sBr', 'br', 'folder.jpg', 'Office', 2 * HR), SN('sGl', 'gl', 'glasses.jpg', 'Desk drawer', 3 * HR), SN('sPp', 'pp', 'real_passport.jpg', 'Desk drawer', 7 * HR),
      SN('sKy', 'ky', 'keys.jpg', '', 4 * HR), SN('sTin', 'tin', 'tin.jpg', 'Desk drawer', 50 * HR), SN('sCh', 'ch', 'charger.jpg', 'Garage', 8 * HR),
    ]);
    await page.evaluate((s) => window.__rig.seed(s, 'recall_users'), [{ id: 'margaret', name: 'Margaret' }]);
    await W(500);
  };
  H.finish = async (name) => {
    H.check('ERR', 'no page errors', errors.length === 0, errors.slice(0, 5).join(' || '));
    const pass = results.filter((r) => r.ok).length; console.log(`\n${pass}/${results.length} passed`);
    fs.writeFileSync(path.join(OUT, name + '.json'), JSON.stringify(results, null, 1));
    await H.close();
  };
  return H;
}
module.exports = { start, img };
