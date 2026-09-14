// Review rig: run the real app in Chromium at phone size with in-memory data and a fake AI.
// node run.js [scenario...]   → shots/<name>.png
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8099;
const ROOT = path.join(__dirname, 'out');
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, req.url.split('?')[0] === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  const ext = path.extname(f);
  res.writeHead(200, { 'content-type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[ext] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

const AI = { name: 'sparkling soda', sameAs: '', alternatives: ['soda can'], restingOn: 'on a wooden table', placeCertain: false, placeGuesses: ['Kitchen counter', 'Dining table'], description: 'a can of sparkling soda on a table' };

async function main() {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const ctx = await browser.newContext({
    permissions: ['camera'],
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  await ctx.addInitScript(() => {
    localStorage.setItem('recall-ai-config', JSON.stringify({ provider: 'anthropic', apiKey: 'sk-rig', model: '' }));
  });
  // Fake AI: every Anthropic call returns the canned tag after a short delay.
  await ctx.route('https://api.anthropic.com/**', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    const content = body.messages?.[0]?.content || [];
    const images = content.filter((b) => b.type === 'image').length;
    const isSame = content.some((b) => b.type === 'text' && /NEW PHOTO/.test(b.text));
    const text = JSON.stringify(isSame ? (global.SAME || { index: 0, sure: false }) : images ? (global.AI_NEXT || AI) : { matches: [], message: '' });
    if (isSame) console.log('  same-thing call with', images - 1, 'candidates,', (content.find((b) => b.type === 'text' && /NEW PHOTO/.test(b.text))?.text.match(/NEW PHOTO \d of \d/g) || []).length, 'new photos');
    else if (images) console.log('  naming call with', images, 'photo(s)');
    await new Promise((r) => setTimeout(r, 600));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [{ type: 'text', text }] }) });
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('PAGE ERROR', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE', m.text().slice(0, 200)); });
  await page.goto(`http://localhost:${PORT}/`);
  await page.waitForSelector('.screen', { timeout: 10000 });

  // Fixture photos: labelled colour blocks, 4:3 landscape and 3:4 portrait, real JPEG data URLs.
  const mk = (label, color, w, h) => page.evaluate(([label, color, w, h]) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); g.fillStyle = color; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(w * 0.2, h * 0.3, w * 0.6, h * 0.4);
    g.fillStyle = '#fff'; g.font = `bold ${Math.round(h / 8)}px sans-serif`; g.textAlign = 'center'; g.fillText(label, w / 2, h / 2 + h / 24);
    return { photo: c.toDataURL('image/jpeg', 0.7), thumb: (() => { const s = Math.min(w, h); const t = document.createElement('canvas'); t.width = 600; t.height = 600; t.getContext('2d').drawImage(c, (w - s) / 2, (h - s) / 2, s, s, 0, 0, 600, 600); return t.toDataURL('image/jpeg', 0.8); })() };
  }, [label, color, w, h]);
  const now = Date.now(), H = 3600000, D = 86400000;
  const p1 = await mk('glasses', '#5b7f9a', 1200, 900), p1b = await mk('glasses wide', '#4a6d86', 1200, 900), p1old = await mk('glasses old', '#7a8ea0', 900, 1200);
  const p2 = await mk('keys', '#8a6d4a', 900, 1200), p3 = await mk('soda', '#4a8a6d', 1200, 900), p4 = await mk('folder', '#8a4a6d', 1200, 900), p5 = await mk('wallet', '#6d4a8a', 900, 1200);
  const seed = [
    { id: 'i1', kind: 'item', household: 'default', name: 'reading glasses', aliases: ['glasses'], location: 'Kitchen counter', description: 'black frames', restingOn: 'on a wooden table', ...p1, thumbV: 2, order: now - 5 * D, createdAt: now - 5 * D, updatedAt: now - 2 * H, lastSeenAt: now - 2 * H, logId: 'log_a', photoCount: 2,
      history: [{ location: 'Bedside table', at: now - 5 * D }, { location: 'Sofa', at: now - 2 * D }, { location: 'Kitchen counter', at: now - 2 * H }] },
    { id: 's1', kind: 'snap', itemId: 'i1', logId: 'log_a', ...p1, location: 'Kitchen counter', at: now - 2 * H },
    { id: 's1b', kind: 'snap', itemId: 'i1', logId: 'log_a', ...p1b, location: 'Kitchen counter', at: now - 2 * H + 1, extra: true },
    { id: 's1c', kind: 'snap', itemId: 'i1', logId: 'log_b', ...p1old, location: 'Sofa', at: now - 2 * D },
    { id: 's1d', kind: 'snap', itemId: 'i1', logId: 'log_c', ...p1old, location: 'Bedside table', at: now - 5 * D },
    { id: 'i2', kind: 'item', household: 'default', name: 'keys', aliases: [], location: 'Hall table', description: 'car keys on a ring', ...p2, thumbV: 2, order: now - 4 * D, createdAt: now - 4 * D, lastSeenAt: now - D, logId: 'log_d', photoCount: 1, history: [{ location: 'Hall table', at: now - D }] },
    { id: 'i3', kind: 'item', household: 'default', name: 'sparkling soda', aliases: [], location: '', description: 'a can of soda', ...p3, thumbV: 2, order: now - 3 * D, createdAt: now - 3 * D, lastSeenAt: now - 3 * H, logId: 'log_e', photoCount: 1, history: [{ location: '', at: now - 3 * H }] },
    { id: 'i4', kind: 'item', household: 'default', name: 'black folder', aliases: [], location: 'Desk', description: 'a folder with papers', ...p4, thumbV: 2, order: now - 2 * D, createdAt: now - 2 * D, lastSeenAt: now - 2 * D, logId: 'log_f', photoCount: 1, history: [{ location: 'Desk', at: now - 2 * D }] },
    { id: 'i5', kind: 'item', household: 'default', name: 'wallet', aliases: [], location: 'Coat pocket', description: 'brown leather wallet', ...p5, thumbV: 2, order: now - D, createdAt: now - D, lastSeenAt: now - 5 * H, logId: 'log_g', photoCount: 1, history: [{ location: 'Coat pocket', at: now - 5 * H }] },
    { id: 'pl1', kind: 'place', household: 'default', name: 'Kitchen counter', order: 1 }, { id: 'pl2', kind: 'place', household: 'default', name: 'Hall table', order: 2 },
  ];
  await page.evaluate((s) => window.__rig.seed(s), seed);
  await page.waitForTimeout(400);
  fs.mkdirSync('shots', { recursive: true });
  const shot = async (name) => { await page.waitForTimeout(250); await page.screenshot({ path: `shots/${name}.png` }); console.log('shot', name); };
  const jpegFile = async (label, color) => { const { photo } = await mk(label, color, 1200, 900); return { name: 'p.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(photo.split(',')[1], 'base64') }; };

  const want = process.argv.slice(2);
  const on = (n) => !want.length || want.includes(n);

  if (on('home')) await shot('home');
  if (on('thing')) {
    await page.click('.tile >> nth=0'); await page.waitForSelector('.card.thing'); await shot('thing-glasses');
    const row = page.locator('.place-row').first(); if (await row.count()) { await row.click(); await shot('thing-earlier'); }
    await page.goBack(); await page.waitForSelector('.board');
  }
  if (on('camera')) {
    await page.click('.footer .btn-primary >> nth=0'); await page.waitForSelector('.camera'); await page.waitForTimeout(800); await shot('camera-live');
    await page.click('.shutter'); await page.waitForTimeout(400); await page.click('.shutter'); await page.waitForTimeout(400); await shot('camera-two-shots');
    await page.click('.camera-roll .roll-x >> nth=0'); await page.waitForTimeout(300);
    await page.click('.camera-done'); await page.waitForSelector('.photo-card'); await page.waitForTimeout(1200); await shot('camera-to-card');
    // Another → camera again → one more → back on the card with two thumbnails
    await page.click('.roll-add'); await page.waitForSelector('.camera'); await page.waitForTimeout(500); await page.click('.shutter'); await page.waitForTimeout(400); await page.click('.camera-done');
    await page.waitForSelector('.photo-card'); await page.waitForTimeout(600); await shot('camera-card-two');
    await page.goBack(); await page.waitForSelector('.board');
    // Cancel path
    await page.click('.footer .btn-primary >> nth=0'); await page.waitForSelector('.camera'); await page.click('.camera-cancel'); await page.waitForTimeout(200);
    console.log('  cancel closed camera:', (await page.locator('.camera').count()) === 0, '· on board:', (await page.locator('.board').count()) === 1);
    // Add photo from the thing card
    await page.click('.tile >> nth=1'); await page.waitForSelector('.card.thing'); await page.click('text=Add photo'); await page.waitForSelector('.camera'); await page.waitForTimeout(500);
    await page.click('.shutter'); await page.waitForTimeout(300); await page.click('.camera-done'); await page.waitForTimeout(600); await shot('camera-add-to-thing');
    await page.goBack(); await page.waitForSelector('.board');
  }
  if (on('photo')) {
    // Log item → photo card with the fake AI naming it
    await page.click('.footer .btn-primary >> nth=0'); await page.waitForSelector('.camera'); await page.waitForTimeout(500); await page.click('.shutter'); await page.waitForTimeout(300); await page.click('.camera-done');
    await page.waitForSelector('.photo-card'); await shot('photo-card-naming');
    await page.waitForTimeout(1200); await shot('photo-card-named');
    await page.goBack(); await page.waitForSelector('.board');
  }
  if (on('visual')) {
    // The AI names it something new ("fizzy drink") — no name match — then LOOKS and says it is saved thing 1 (the soda).
    global.AI_NEXT = { ...AI, name: 'fizzy drink', alternatives: [], sameAs: '' }; global.SAME = { index: 1, sure: true };
    await page.click('.footer .btn-primary >> nth=0'); await page.waitForSelector('.camera'); await page.waitForTimeout(500); await page.click('.shutter'); await page.waitForTimeout(300); await page.click('.camera-done');
    await page.waitForSelector('.photo-card'); await page.waitForTimeout(900); await shot('visual-checking');
    await page.waitForTimeout(1500); await shot('visual-matched');
    global.AI_NEXT = null; global.SAME = null;
    await page.goBack(); await page.waitForSelector('.board');
  }
  if (on('ask')) { await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', 'folio'); await shot('ask-folio'); await page.goBack(); await page.waitForSelector('.board'); }
  if (on('settings')) { await page.click('.tiny'); await page.waitForSelector('.settings'); await shot('settings-top'); await page.evaluate(() => window.scrollTo(0, 99999)); await shot('settings-bottom'); await page.goBack(); }
  if (on('update')) {
    await page.click('.tiny'); await page.waitForSelector('.settings'); await page.waitForTimeout(600);
    await page.evaluate(() => window.scrollTo(0, 99999)); await shot('update-latest');
    // Server now has a newer stamp than the page loaded with.
    const idx = fs.readFileSync('out/index.html', 'utf8'); fs.writeFileSync('out/index.html', idx.replace('?v=rig1', '?v=rig2'));
    await page.goBack(); await page.waitForSelector('.board'); await page.click('.tiny'); await page.waitForSelector('.settings'); await page.waitForTimeout(600);
    await page.evaluate(() => window.scrollTo(0, 99999)); await shot('update-newer');
    // Come back from a reload that DID change the build.
    await page.evaluate(() => { sessionStorage.setItem('recall-return-to', 'settings'); sessionStorage.setItem('recall-prev-build', 'older'); });
    await page.reload(); await page.waitForSelector('.settings'); await page.waitForTimeout(600); await page.evaluate(() => window.scrollTo(0, 99999)); await shot('update-installed');
    // And one that did not.
    await page.evaluate(() => { sessionStorage.setItem('recall-return-to', 'settings'); sessionStorage.setItem('recall-prev-build', '2026-09-14T12:00:00Z'); });
    await page.reload(); await page.waitForSelector('.settings'); await page.waitForTimeout(600); await page.evaluate(() => window.scrollTo(0, 99999)); await shot('update-same');
    fs.writeFileSync('out/index.html', idx);
    await page.goBack(); await page.waitForSelector('.board').catch(() => {});
  }
  if (on('menuback')) {
    await page.click('.menu-btn'); await page.waitForSelector('.drawer'); await page.click('.drawer-row >> nth=1'); await page.waitForSelector('.screen .header'); await shot('menu-locations');
    await page.click('.header .back'); await page.waitForSelector('.drawer'); await shot('menu-back-to-drawer');
    await page.click('.drawer-row.quiet'); await page.waitForTimeout(300); const d = await page.locator('.drawer').count(); console.log('  drawer closed:', d === 0);
  }
  if (on('wide')) {
    await page.setViewportSize({ width: 430, height: 932 }); await page.waitForTimeout(300); await shot('home-430'); await page.setViewportSize({ width: 390, height: 844 });
  }
  if (on('menu')) {
    await page.click('.menu-btn'); await page.waitForSelector('.drawer'); await shot('menu-drawer');
    await page.click('.drawer-row >> nth=2'); await page.waitForSelector('.screen'); await page.waitForTimeout(300);
    // seed two deleted items
    await page.evaluate(() => window.__rig.seed([
      { id: 'd1', kind: 'item', household: 'default', name: 'old mug', location: 'Sink', deleted: true, deletedAt: Date.now() - 3600000, thumb: '', photo: '' },
      { id: 'd2', kind: 'item', household: 'default', name: 'umbrella', location: 'Hall', deleted: true, deletedAt: Date.now() - 86400000, thumb: '', photo: '' },
    ]));
    await page.waitForTimeout(300); await shot('deleted-roomy');
    await page.evaluate(() => { localStorage.setItem('recall-prefs', JSON.stringify({ size: 'normal', theme: 'linen', density: 'compact' })); });
    await page.goBack(); await page.waitForSelector('.board'); await page.click('.menu-btn'); await page.click('.drawer-row >> nth=2'); await page.waitForTimeout(300);
    await shot('deleted-compact');
    const body = page.locator('.swipe-body').first(); const b = await body.boundingBox();
    await page.mouse.move(b.x + b.width - 40, b.y + b.height / 2); await page.mouse.down(); await page.mouse.move(b.x + b.width - 160, b.y + b.height / 2, { steps: 8 }); await page.mouse.up();
    await page.waitForTimeout(300); await shot('deleted-swiped');
    await page.goBack(); await page.waitForSelector('.board'); await page.click('.menu-btn'); await page.click('.drawer-row >> nth=0'); await page.waitForTimeout(300); await shot('look');
    await page.goBack(); await page.waitForSelector('.board'); await page.click('.tiny'); await page.waitForSelector('.settings'); await shot('settings-dev');
    await page.evaluate(() => { localStorage.setItem('recall-prefs', JSON.stringify({ size: 'normal', theme: 'linen', density: 'normal' })); });
    await page.goBack(); await page.waitForSelector('.board');
  }
  if (on('hold')) {
    const t = page.locator('.tile').first(); const b = await t.boundingBox();
    if (b) { await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await page.waitForTimeout(700); await shot('tile-hold'); await page.mouse.up(); }
  }
  if (on('large')) {
    await page.evaluate(() => { localStorage.setItem('recall-prefs', JSON.stringify({ size: 'largest', theme: 'linen' })); });
    await page.reload(); await page.waitForSelector('.screen'); await page.evaluate((s) => window.__rig.seed(s), seed); await page.waitForTimeout(400);
    await shot('home-largest'); const t = page.locator('.tile').first(); await t.click(); await page.waitForSelector('.card.thing'); await shot('thing-largest');
  }
  await browser.close(); server.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
