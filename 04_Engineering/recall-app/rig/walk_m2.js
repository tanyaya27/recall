// 10-02 fresh-eyes walk of 20261001a: Margaret's first day in an EMPTY house, then Ravi's Walgreens sequence.
const { chromium, webkit } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const PORT = 8432; const ROOT = path.join(__dirname, 'out');
const server = http.createServer((req, res) => { const f = path.join(ROOT, req.url.split('?')[0] === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); });
const img = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(__dirname, 'mock/img', f)).toString('base64');
const OUT = path.join(__dirname, 'shots_walk2'); fs.mkdirSync(OUT, { recursive: true });
let AI = { name: 'thing' };
(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const W = Number(process.env.W || 390), H = Number(process.env.H || 844);
  const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream'] });
  const ctx = await browser.newContext({ permissions: ['camera'], viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => { const c = document.createElement('canvas'); c.width = 960; c.height = 1280; const g = c.getContext('2d'); const im = new Image(); let src = '';
    const paint = () => { if (window.__cam && window.__cam !== src) { src = window.__cam; im.src = src; } g.fillStyle = '#222'; g.fillRect(0, 0, c.width, c.height);
      if (im.complete && im.naturalWidth) { const s = Math.max(c.width / im.naturalWidth, c.height / im.naturalHeight); const w = im.naturalWidth * s, h = im.naturalHeight * s; g.drawImage(im, (c.width - w) / 2, (c.height - h) / 2, w, h); } };
    setInterval(paint, 60); const md = navigator.mediaDevices || {}; Object.defineProperty(navigator, 'mediaDevices', { value: md, configurable: true }); md.getUserMedia = async () => { paint(); return c.captureStream(15); }; });
  await ctx.route('https://api.anthropic.com/**', async (route) => { const body = JSON.parse(route.request().postData() || '{}'); const content = body.messages?.[0]?.content || [];
    const texts = content.filter((b) => b.type === 'text').map((b) => b.text).join('\n'); const images = content.filter((b) => b.type === 'image').length; let out;
    if (/NEW PHOTO/.test(texts)) out = { index: -1, sure: false };
    else if (images) out = { name: AI.name, sameAs: '', alternatives: [], restingOn: AI.restingOn || 'white surface', placeCertain: false, placeGuesses: [], description: '', details: AI.details || '', private: false, privateWhy: '', secretVisible: false };
    else out = { matches: [], message: '' };
    await new Promise((r) => setTimeout(r, 300)); await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [{ type: 'text', text: JSON.stringify(out) }] }) }); });
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  let n = 0; const shot = async (label, full) => { await page.waitForTimeout(350); const f = `${String(++n).padStart(2, '0')}_${label}.png`; await page.screenshot({ path: path.join(OUT, f), fullPage: !!full }); console.log('shot', f); };
  const tap = async (sel, w = 500) => { await page.locator(sel).first().click(); await page.waitForTimeout(w); };
  const cam = async (f) => { await page.evaluate((s) => { window.__cam = s; }, img(f)); await page.waitForTimeout(250); };
  const dump = () => page.evaluate(() => window.__rig.dump());
  const LOG = '.footer .btn-primary:not(.alt)', FIND = '.footer .btn-primary.alt';
  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen');
  await page.evaluate(() => { localStorage.clear(); window.__rig.reset(); localStorage.setItem('rig-uid', 'margaret'); localStorage.setItem('rig-anon', '0');
    localStorage.setItem('recall-ai-config', JSON.stringify({ provider: 'anthropic', apiKey: 'sk-ant-rig', model: '' })); });
  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen'); await page.waitForTimeout(600);
  await page.evaluate(() => window.__rig.seed([{ id: 'margaret', name: 'Margaret' }], 'recall_users'));
  const home = async () => { await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen'); await page.waitForTimeout(600); };
  await shot('home_empty');
  AI = { name: 'keys' }; await tap(LOG, 900); await cam('keys.jpg'); await tap('.lc-shutter', 1100); await page.fill('.w1-words input', 'in my coat pocket'); await tap('.lc-k.sv', 1300);
  await home(); AI = { name: 'reading glasses' }; await tap(LOG, 900); await cam('glasses.jpg'); await tap('.lc-shutter', 1100); await tap('.w1-in', 600); await page.fill('.in-list .wl-search input', 'Kitchen counter'); await page.waitForTimeout(400); await tap('.in-list .wl-new', 500); await tap('.lc-k.sv', 1300);
  await home(); await tap(FIND, 700); await page.fill('#ask-input', 'keys'); await page.waitForTimeout(900); await shot('find_keys');
  await page.fill('#ask-input', 'coat'); await page.waitForTimeout(900); await shot('find_coat');
  await page.fill('#ask-input', 'kitchen'); await page.waitForTimeout(900); await shot('find_kitchen');
  await page.fill('#ask-input', 'keys'); await page.waitForTimeout(900); await tap('.ask .tile', 900); await shot('keys_page', true);
  await tap('button:has-text("Move it")', 1000); await shot('keys_move');
  // small phone + Largest text
  console.log('errors', errs); await browser.close(); server.close();
})().catch((e) => { console.error(e); process.exit(1); });
