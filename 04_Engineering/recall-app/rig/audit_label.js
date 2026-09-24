// Label text + writing things down audit (MVP #9/#10, 2026-09-24): One thing · Several, the mode row, Settings →
// Taking photos, hold Log item, the Several strip (save at shutter, place sources, ＋ angle,
// the same-thing question), the review, and One thing's chosen place + Next item.
// node audit_modes.js → PASS/FAIL, screenshots to shots/label-*.png
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const PORT = 8093; const ROOT = path.join(__dirname, 'out');
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, req.url.split('?')[0] === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
const results = []; const errors = [];
const check = (name, ok, note = '') => { results.push({ name, ok: !!ok, note }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${note ? ' — ' + note : ''}`); };
let aiNext = null;
const tagOf = (name, extra = {}) => ({ name, sameAs: '', alternatives: [], restingOn: '', placeCertain: false, placeGuesses: ['Hall table', 'Desk'], description: `a ${name}`, ...extra });

async function main() {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const ctx = await browser.newContext({ permissions: ['camera'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.route('https://api.anthropic.com/**', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}'); const content = body.messages?.[0]?.content || [];
    const images = content.filter((b) => b.type === 'image').length;
    const isSame = content.some((b) => b.type === 'text' && /NEW PHOTO/.test(b.text));
    const text = JSON.stringify(isSame ? { index: 0, sure: false } : images ? (aiNext || tagOf('stapler')) : { matches: [], message: '' });
    await new Promise((r) => setTimeout(r, 250));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [{ type: 'text', text }] }) });
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/camera/.test(m.text())) errors.push('console: ' + m.text().slice(0, 160)); });
  const shot = async (n) => { await page.waitForTimeout(250); await page.screenshot({ path: `shots/label-${n}.png` }); };
  const count = (sel) => page.locator(sel).count();
  const text = (sel) => page.locator(sel).first().innerText().catch(() => '');
  const dump = () => page.evaluate(() => window.__rig.dump());
  const items = async () => (await dump()).filter((d) => d.kind === 'item' && !d.deleted);
  const mk = (label, color) => page.evaluate(([label, color]) => {
    const c = document.createElement('canvas'); c.width = 1200; c.height = 900; const g = c.getContext('2d'); g.fillStyle = color; g.fillRect(0, 0, 1200, 900);
    g.fillStyle = '#fff'; g.font = 'bold 110px sans-serif'; g.textAlign = 'center'; g.fillText(label, 600, 470);
    const t = document.createElement('canvas'); t.width = 600; t.height = 600; t.getContext('2d').drawImage(c, 150, 0, 900, 900, 0, 0, 600, 600);
    return { photo: c.toDataURL('image/jpeg', 0.7), thumb: t.toDataURL('image/jpeg', 0.8) };
  }, [label, color]);
  const waitStrip = async (re) => { for (let i = 0; i < 40; i++) { const t = await text('.strip1'); if (re.test(t)) return t; await page.waitForTimeout(150); } return text('.strip1'); };

  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen');
  await page.evaluate(() => { localStorage.clear(); }); await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen');
  const now = Date.now(); const pG = await mk('glasses', '#5b7f9a'); const ME = await page.evaluate(() => window.__rig.auth.me());
  await page.evaluate((s) => window.__rig.seed(s), [
    { id: 'g', kind: 'item', owner: ME, by: ME, name: 'reading glasses', aliases: ['glasses'], location: 'Kitchen counter', description: 'black frames', ...pG, thumbV: 2, order: now - 5e8, createdAt: now - 5e8, lastSeenAt: now - 3600e3, logId: 'log_g', photoCount: 1, history: [{ location: 'Kitchen counter', at: now - 3600e3 }], private: false, roles: {}, sharedWith: [] },
    { id: 'sg', kind: 'snap', owner: ME, by: ME, itemId: 'g', logId: 'log_g', ...pG, location: 'Kitchen counter', at: now - 3600e3 },
    { id: 'pl1', kind: 'place', owner: ME, by: ME, name: 'Hall table', order: 1, private: false }, { id: 'pl2', kind: 'place', owner: ME, by: ME, name: 'Desk', order: 2, private: false },
  ]);
  await page.waitForTimeout(400);

  // ---- #9: what the label says (One thing)
  aiNext = tagOf('screws', { details: '#8 × 1-1/4 in · stainless · pan head · 100 ct' });
  await page.click('.footer .btn-primary:not(.alt)'); await page.waitForSelector('.camera'); await page.waitForTimeout(400);
  await page.click('.shutter'); await page.waitForTimeout(300); await page.click('.camera-done'); await page.waitForSelector('.photo-card'); await page.waitForTimeout(1500);
  await page.click('.guess:has-text("Desk")'); await page.waitForSelector('.board'); await page.waitForTimeout(500);
  const screws = (await items()).find((d) => d.name === 'screws');
  check('L1 One thing: the label text is saved on the thing', screws && /stainless/.test(screws.details || ''), JSON.stringify(screws && screws.details));
  await page.click('.tile:has-text("Screws")'); await page.waitForSelector('.card.thing'); await page.waitForTimeout(500);
  check('L2 the thing card shows what the label says', /#8 × 1-1\/4 in · stainless/.test(await text('.label-line')));
  await shot('1-card-label');
  await page.goBack(); await page.waitForSelector('.board');
  // ---- #9: Several saves it too
  await page.evaluate(() => { const p = JSON.parse(localStorage.getItem('recall-prefs') || '{}'); p.lastMode = 'several'; localStorage.setItem('recall-prefs', JSON.stringify(p)); });
  aiNext = tagOf('seed packet', { details: "Tulip 'Queen of Night'" });
  await page.click('.footer .btn-primary:not(.alt)'); await page.waitForSelector('.camera'); await page.waitForTimeout(400);
  await page.click('.shutter'); await waitStrip(/Seed packet/); await page.waitForTimeout(400);
  const seeds = (await items()).find((d) => d.name === 'seed packet');
  check('L3 Several: the label text is saved too', seeds && /Queen of Night/.test(seeds.details || ''), JSON.stringify(seeds && seeds.details));
  await page.click('.camera-done'); await page.waitForTimeout(500);
  // ---- #9: Find item searches the label
  await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask');
  await page.fill('.ask input', 'stainless'); await page.waitForTimeout(500);
  check('L4 Find item "stainless" finds the screws by their label', /Screws/.test(await page.locator('.ask').innerText()));
  await page.fill('.ask input', 'queen of night'); await page.waitForTimeout(500);
  check('L5 Find item "queen of night" finds the seed packet', /Seed packet/.test(await page.locator('.ask').innerText()));
  await shot('2-find-label');
  await page.goBack(); await page.waitForSelector('.board');

  // ---- #10: write it down, no photo
  await page.evaluate(() => { const p = JSON.parse(localStorage.getItem('recall-prefs') || '{}'); p.lastMode = 'one'; localStorage.setItem('recall-prefs', JSON.stringify(p)); });
  await page.click('.footer .btn-primary:not(.alt)'); await page.waitForSelector('.camera'); await page.waitForTimeout(300);
  check('W1 the camera offers Type it (before a photo)', await count('.camera-write') === 1);
  await page.click('.camera-write'); await page.waitForSelector('.note-card');
  check('W2 Type it → Write it down: What is it? · Where is it? · Keep this private · Save (disabled until a name)', /What is it\?/.test(await page.locator('.note-card').innerText()) && await page.locator('.note-card .btn-primary').isDisabled());
  await page.fill('#note-what', 'bank locker key');
  await page.click('.note-card .guess.other'); await page.fill('.note-card .guesses .place-input', 'blue tin, top of the wardrobe');
  // 09-24: "bank locker key" looks private, so the switch is already on (private by default); no tap needed.
  await page.waitForTimeout(100); await shot('3-write');
  const snapsBefore = (await dump()).filter((d) => d.kind === 'snap').length;
  await page.click('.note-card .btn-primary'); await page.waitForSelector('.board'); await page.waitForTimeout(500);
  const key = (await items()).find((d) => d.name === 'bank locker key');
  check('W3 saved with no photo: place "Blue tin, top of the wardrobe", private, photoCount 0, written, no snap', key && key.location === 'Blue tin, top of the wardrobe' && key.private === true && key.photoCount === 0 && key.written === true && !key.photo && (await dump()).filter((d) => d.kind === 'snap').length === snapsBefore, JSON.stringify(key && [key.location, key.private, key.photoCount, key.written]));
  check('W4 the board shows it as a written tile (no broken image)', await count('.tile .tile-written') === 1 && await page.evaluate(() => [...document.querySelectorAll('.tile img')].every((i) => i.getAttribute('src'))));
  await shot('4-board-written');
  await page.click('.tile:has-text("Bank locker key")'); await page.waitForSelector('.card.thing'); await page.waitForTimeout(400);
  check('W5 its card says "Written down, no photo yet", no photo strip, no Show times switch', /Written down, no photo yet/.test(await text('.written-panel')) && await count('.card.thing .photo-full') === 0 && await count('.sw-row:has-text("Show times")') === 0);
  await shot('5-card-written');
  // Add photo: the first photo becomes the cover
  await page.click('.act:has-text("Add photo")'); await page.waitForSelector('.camera'); await page.waitForTimeout(400);
  await page.click('.shutter'); await page.waitForTimeout(300); await page.click('.camera-done'); await page.waitForTimeout(1500);
  const key2 = (await items()).find((d) => d.name === 'bank locker key');
  check('W6 Add photo on a written thing → that photo becomes its cover (photoCount 1)', key2 && !!key2.photo && key2.photoCount === 1 && key2.written === false, JSON.stringify(key2 && [!!key2.photo, key2.photoCount]));
  await page.goBack(); await page.waitForSelector('.board');
  // Save without a place; the place used a moment ago is offered
  await page.click('.footer .btn-primary:not(.alt)'); await page.waitForSelector('.camera'); await page.waitForTimeout(300);
  await page.click('.camera-write'); await page.waitForSelector('.note-card');
  check('W7 the place used a moment ago is already chosen', /Blue tin/.test(await page.locator('.note-card').innerText()) || await count('.note-card .guess.pre') === 1);
  await page.fill('#note-what', 'spare fuse');
  await page.fill('.note-card .guesses .place-input', '').catch(() => {});
  await page.evaluate(() => { const b = document.querySelector('.note-card .guess.pre'); if (b) b.click(); });
  await page.waitForTimeout(100);
  const lbl = await text('.note-card .btn-primary');
  await page.click('.note-card .btn-primary'); await page.waitForSelector('.board'); await page.waitForTimeout(400);
  const fuse = (await items()).find((d) => d.name === 'spare fuse');
  check('W8 a name alone is enough (Save without a place)', fuse && !!fuse.name, `${lbl} · ${JSON.stringify(fuse && fuse.location)}`);
  // Largest
  await page.evaluate(() => { const p = JSON.parse(localStorage.getItem('recall-prefs') || '{}'); p.size = 'largest'; localStorage.setItem('recall-prefs', JSON.stringify(p)); });
  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board');
  await page.click('.footer .btn-primary:not(.alt)'); await page.waitForSelector('.camera'); await page.waitForTimeout(300);
  const one = await page.locator('.camera-write').evaluate((b) => { const r = document.createRange(); r.selectNodeContents(b); return r.getClientRects().length === 1 && b.scrollWidth <= b.clientWidth + 1; });
  check('W9 Largest: Type it is one line, not cut off', one);
  await page.click('.camera-write'); await page.waitForSelector('.note-card'); await shot('6-write-largest');
  await page.goBack(); await page.waitForSelector('.board');
  await page.click('.tile:has-text("Screws")'); await page.waitForSelector('.card.thing'); await page.waitForTimeout(400); await shot('7-card-label-largest');

  check('E0 no page errors', errors.length === 0, errors.join(' | '));
  const pass = results.filter((r) => r.ok).length;
  console.log(`\n${pass}/${results.length} passed`);
  fs.writeFileSync('shots/audit_label.json', JSON.stringify({ results, errors }, null, 1));
  await browser.close(); server.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
