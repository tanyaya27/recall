// Capture modes audit (MVP step 2, 2026-09-24): One thing · Several, the mode row, Settings →
// Taking photos, hold Log item, the Several strip (save at shutter, place sources, ＋ angle,
// the same-thing question), the review, and One thing's chosen place + Next item.
// node audit_modes.js → PASS/FAIL, screenshots to shots/modes-*.png
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const PORT = 8094; const ROOT = path.join(__dirname, 'out');
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
  const shot = async (n) => { await page.waitForTimeout(250); await page.screenshot({ path: `shots/modes-${n}.png` }); };
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

  // ---- the mode row
  await page.click('.footer .btn-primary:not(.alt)'); await page.waitForSelector('.camera'); await page.waitForTimeout(500);
  check('M1 camera shows the mode row: One thing · Several, One thing chosen (default)', await count('.modes button') === 2 && /One thing/.test(await text('.modes button.on')));
  await shot('1-row');
  await page.click('.modes button:has-text("Several")'); await page.waitForTimeout(400);
  check('M2 tap Several → Several chosen; no roll; Done disabled before a photo', /Several/.test(await text('.modes button.on')) && await count('.camera-roll') === 0 && await page.locator('.camera-done').isDisabled());

  // ---- Several: save at the shutter, name streams in, place asked (unsure)
  aiNext = tagOf('stapler');
  const before = (await items()).length;
  await page.click('.shutter');
  await page.waitForSelector('.strip1');
  let t = await waitStrip(/Stapler/);
  const afterOne = await items();
  check('M3 shutter → a thing is SAVED at once; the strip says Saved, then the name', afterOne.length === before + 1 && /Saved/.test(t) && /Stapler/.test(t), t.replace(/\n/g, ' | '));
  check('M4 the mode row is gone once a photo is taken; top right says 1 saved; Cancel became Close', await count('.modes') === 0 && /1 saved/.test(await text('.camera-count')) && /Close/.test(await text('.camera-cancel')));
  t = await waitStrip(/Where is it\?/);
  check('M5 place unsure → Where is it? with three choices, none picked', /Where is it\?/.test(t) && await count('.strip1 .chips button') === 4, t.replace(/\n/g, ' | '));
  await shot('2-several-ask');
  await page.click('.strip1 .chips button:has-text("Hall table")'); await page.waitForTimeout(500);
  const stapler = (await items()).find((d) => d.name === 'stapler');
  check('M6 tap Hall table → it goes there (placeSource chosen); the session place appears on top', stapler && stapler.location === 'Hall table' && stapler.placeSource === 'chosen' && /Hall table · every photo/.test(await text('.cam-place')), JSON.stringify(stapler && [stapler.location, stapler.placeSource]));
  await shot('3-several-chosen');

  // next shot inherits the session place
  aiNext = tagOf('tape measure');
  await page.click('.shutter'); t = await waitStrip(/Tape measure/);
  const tape = (await items()).find((d) => d.name === 'tape measure');
  check('M7 next shutter → saved straight into Hall table (placeSource session), no question', tape && tape.location === 'Hall table' && tape.placeSource === 'session' && !/Where is it/.test(t), JSON.stringify(tape && [tape.location, tape.placeSource]));
  await shot('4-several-session');

  // ＋ angle: the next photo is another angle of the tape measure
  await page.click('.strip1 .ang'); await page.waitForTimeout(150);
  check('M8 ＋ → "Next photo: another angle of this"', /another angle/.test(await text('.strip1')));
  const nBefore = (await items()).length;
  await page.click('.shutter'); await page.waitForTimeout(1200);
  const tape2 = (await items()).find((d) => d.name === 'tape measure');
  check('M9 …the shutter adds a photo to it (photoCount 2), no new thing', (await items()).length === nBefore && tape2.photoCount === 2 && /2 photos/.test(await text('.strip1')), `${(await items()).length} vs ${nBefore}, photoCount ${tape2 && tape2.photoCount}`);

  // same thing as one already saved → asked in the strip
  aiNext = tagOf('glasses', { sameAs: 'reading glasses' });
  await page.click('.shutter'); t = await waitStrip(/Your reading glasses\?/);
  check('M10 a photo of a saved thing → the strip ASKS "Your reading glasses?" (never merged silently)', /Your reading glasses\?/.test(t) && await count('.strip1 .chips button') === 2);
  await shot('5-several-ask-same');
  await page.click('.strip1 .chips button:has-text("Yes")'); await page.waitForTimeout(800);
  const all = await items(); const g = all.find((d) => d.id === 'g');
  const glassSnaps = (await dump()).filter((d) => d.kind === 'snap' && d.itemId === 'g' && !d.deleted);
  check('M11 Yes → a new photo of the glasses at the session place; the provisional thing is gone', !all.some((d) => d.name === 'glasses' && d.id !== 'g') && g.location === 'Hall table' && glassSnaps.length === 2, `${g.location} · snaps ${glassSnaps.length}`);

  // Done → the review
  await page.click('.camera-done'); await page.waitForSelector('.review');
  check('M12 Done → the review: 3 things saved, Hall table', /3 things saved/.test(await text('.header .title')) && await count('.rv-cell') === 3 && /Hall table/.test(await text('.rv-sub')));
  await shot('6-review');
  await page.click('.review .footer .btn-primary'); await page.waitForSelector('.board');
  check('M13 Finished → Home, with the new things on the board', await count('.tile') >= 3);

  // ---- last used: the camera opens in Several now
  await page.click('.footer .btn-primary:not(.alt)'); await page.waitForSelector('.camera'); await page.waitForTimeout(400);
  check('M14 opens in the LAST USED mode (Several)', /Several/.test(await text('.modes button.on')));
  await page.click('.camera-cancel'); await page.waitForTimeout(300);

  // ---- hold Log item → Log item as…
  const btn = page.locator('.footer .btn-primary:not(.alt)'); const bb = await btn.boundingBox();
  await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await page.mouse.down(); await page.waitForTimeout(700); await page.mouse.up();
  await page.waitForTimeout(300);
  check('M15 hold Log item → "Log item as…" with One thing · Several · Cancel', /Log item as/.test(await text('.sheet-title')) && await count('.sheet .sheet-row') === 2);
  await shot('7-hold');
  await page.click('.sheet .sheet-row:has-text("One thing")'); await page.waitForSelector('.camera'); await page.waitForTimeout(400);
  check('M16 …pick One thing → the camera opens in One thing', /One thing/.test(await text('.modes button.on')));

  // ---- One thing: the place used a moment ago is already chosen; Next item
  aiNext = tagOf('scissors');
  await page.click('.shutter'); await page.waitForTimeout(300); await page.click('.camera-done'); await page.waitForSelector('.photo-card');
  await page.waitForTimeout(1500);
  check('M17 One thing card: "Hall table · just used" already chosen; Next item · Done', /Hall table/.test(await text('.guess.pre')) && /just used/.test(await text('.guess.pre')) && await count('.next-row button') === 2);
  await shot('8-one-preset');
  await page.click('.next-row button:has-text("Next item")'); await page.waitForSelector('.camera'); await page.waitForTimeout(600);
  const sc = (await items()).find((d) => d.name === 'scissors');
  check('M18 Next item → saved at Hall table (placeSource session) and the camera is open again', sc && sc.location === 'Hall table' && sc.placeSource === 'session' && await count('.camera') === 1, JSON.stringify(sc && [sc.location, sc.placeSource]));
  await page.click('.camera-cancel'); await page.waitForTimeout(300);

  // ---- Settings → Taking photos
  await page.click('.tiny'); await page.waitForSelector('.settings');
  check('M19 Settings has Taking photos: opens in Last used; One thing and Several both on', /Taking photos/i.test(await page.locator('.settings').innerText()) && /Last used/.test(await text('.seg button.on')) && await count('.optrow .sw.on') === 2);
  await page.click('.seg button:has-text("One thing")'); await page.waitForTimeout(100);
  await page.click('.optrow:has-text("Several") .sw'); await page.waitForTimeout(100);
  check('M20 switching Several off leaves One thing on and its switch locked (at least one mode)', await count('.optrow .sw.on') === 1 && await page.locator('.optrow:has-text("One thing") .sw').isDisabled());
  await shot('9-settings');
  await page.click('.header .back'); await page.waitForSelector('.board');
  await page.click('.footer .btn-primary:not(.alt)'); await page.waitForSelector('.camera'); await page.waitForTimeout(400);
  check('M21 with one mode on, the camera shows NO mode row (as today)', await count('.modes') === 0);
  await page.click('.camera-cancel'); await page.waitForTimeout(300);
  const bb2 = await page.locator('.footer .btn-primary:not(.alt)').boundingBox();
  await page.mouse.move(bb2.x + 20, bb2.y + 20); await page.mouse.down(); await page.waitForTimeout(700); await page.mouse.up(); await page.waitForTimeout(300);
  check('M22 …and holding Log item offers no choice', await count('.sheet-title:has-text("Log item as")') === 0);

  // Largest: the mode row and the strip still one line each
  await page.evaluate(() => { const p = JSON.parse(localStorage.getItem('recall-prefs') || '{}'); p.size = 'largest'; p.captureModes = ['one', 'several']; p.captureOpen = 'several'; localStorage.setItem('recall-prefs', JSON.stringify(p)); });
  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board');
  await page.click('.camera-cancel').catch(() => {});
  await page.click('.footer .btn-primary:not(.alt), .footer .btn-primary:first-child'); await page.waitForSelector('.camera'); await page.waitForTimeout(400);
  const tops = await page.locator('.modes button').evaluateAll((bs) => bs.map((b) => Math.round(b.getBoundingClientRect().top)));
  check('M23 Largest: the mode row is one line (both modes on one baseline)', tops.length === 2 && tops[0] === tops[1], JSON.stringify(tops));
  aiNext = tagOf('glue gun');
  await page.click('.shutter'); await waitStrip(/Glue gun/); await page.waitForTimeout(300);
  const nm = await page.locator('.strip1 .nm').boundingBox();
  check('M24 Largest: the name in the strip is one line', nm && nm.height < 40, nm && String(nm.height));
  await shot('10-largest');

  check('E0 no page errors', errors.length === 0, errors.join(' | '));
  const pass = results.filter((r) => r.ok).length;
  console.log(`\n${pass}/${results.length} passed`);
  fs.writeFileSync('shots/audit_modes.json', JSON.stringify({ results, errors }, null, 1));
  await browser.close(); server.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
