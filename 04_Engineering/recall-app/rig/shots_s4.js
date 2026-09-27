// Places inside places, the natural way — both options rendered from the REAL app (rig), 2026-09-24.
// node shots_s4.js → shots/s4/<opt>-<n>.png
const { chromium } = require('playwright'); const http = require('http'); const fs = require('fs'); const path = require('path');
const PORT = 8095; const ROOT = path.join(__dirname, 'out');
const server = http.createServer((req, res) => { const f = path.join(ROOT, req.url.split('?')[0] === '/' ? 'index.html' : req.url.split('?')[0]); if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); });
const img = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(__dirname, 'mock/img', f)).toString('base64');
(async () => {
  await new Promise((r) => server.listen(PORT, r)); fs.mkdirSync('shots/s4', { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  const now = Date.now(), H = 3600e3;
  const P = (f) => ({ photo: img(f), thumb: img(f), thumbV: 2 });
  const thing = (id, name, location, f, ago, extra = {}) => ({ id, kind: 'item', owner: 'me', by: 'me', private: false, roles: {}, sharedWith: [], name, location, ...(f ? P(f) : { photo: null, thumb: null, written: true }),
    order: now - ago, createdAt: now - ago, lastSeenAt: now - ago, logId: 'l_' + id, photoCount: f ? 1 : 0, history: [{ location, at: now - ago }], ...extra });
  const seed = [
    thing('g', 'reading glasses', 'Kitchen counter', 'glasses.jpg', 2 * H),
    thing('t', 'blue tin', 'Top shelf, bedroom wardrobe', 'tin.jpg', 30 * H),
    thing('k', 'bank locker key', 'Blue tin, top shelf of the bedroom wardrobe', 'keys.jpg', 29 * H),
    thing('s', 'spare house key', 'in the blue tin', null, 28 * H),
    thing('b', 'Box 14', 'Storage unit 214, back left', 'box14.jpg', 80 * H),
    thing('p', 'passport folder', 'Box 14', 'folder.jpg', 79 * H),
    thing('c', 'camera charger', 'Box 14', 'charger.jpg', 78 * H),
  ];
  const boot = async (prefs) => {
    await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen');
    await page.evaluate(([s, p]) => { localStorage.clear(); localStorage.setItem('rig-uid', 'me'); localStorage.setItem('recall-prefs', JSON.stringify(p)); window.__rig.reset(); }, [seed, prefs]);
    await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen');
    await page.evaluate((s) => window.__rig.seed(s), seed); await page.waitForSelector('.board'); await page.waitForTimeout(400);
  };
  const open = async (label) => { await page.click(`.tile:has-text("${label}")`); await page.waitForSelector('.card.thing'); await page.waitForTimeout(300); };
  const shot = async (n) => { await page.waitForTimeout(200); await page.screenshot({ path: `shots/s4/${n}.png` }); };
  for (const opt of ['a', 'b']) {
    await boot({ nestView: opt, showTimes: false });
    await open('Bank locker key'); await shot(`${opt}-1-key`);
    await page.click(opt === 'a' ? '.nest-link' : '.nest-row'); await page.waitForSelector('.inside'); await page.waitForTimeout(300); await shot(`${opt}-2-tin`);
    await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board');
    await open('Passport folder'); await shot(`${opt}-3-folder`);
    // the tin moves: log it somewhere new (here: its place changed) — the key's answer follows
    await page.evaluate(() => { const fs = window.__rigfs; return fs.updateDoc(fs.doc(fs.collection(null, 'recall_items'), 't'), { location: 'Garage shelf', lastSeenAt: Date.now() }); });
    await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board');
    await open('Bank locker key'); await shot(`${opt}-4-moved`);
    await boot({ nestView: opt, showTimes: false, size: 'largest' });
    await open('Bank locker key'); await shot(`${opt}-5-largest`);
  }
  await boot({ nestView: 'a' });
  await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('.ask input', 'key'); await page.waitForTimeout(500); await shot('both-6-find');
  console.log('errors:', errors.length ? errors : 'none');
  await browser.close(); server.close();
})();
