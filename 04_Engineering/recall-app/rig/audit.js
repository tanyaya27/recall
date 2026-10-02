// Retired 2026-10-01 (release 1 — the tier camera is gone):
//   B3 — the amber "No place yet" flip on a Home tile (.tile-label.noplace) is removed; tiles show photo + name only.
//   B4 — the Home tile's second line (.tile-sub, where it is) is removed; tiles show photo + name only.
// Rewritten to the new camera (same behaviour, new UI): D15m, D15p (Move it → In chip / In list), C4, C4a, C5
//   (What is it in? → .in-list; the chip, not the "Place:" line, shows what is saved; the In list makes "the shelf" the
//   place "Shelf" — it drops a leading "the"), plus the shared pickPlace helper from GUIDE_adapt.md.
// Full-path audit of ReCall in the rig. Every screen, every transition, with assertions.
// node audit.js  → prints PASS/FAIL per check, screenshots to shots/audit-*.png
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const PORT = 8097; const ROOT = path.join(__dirname, 'out');
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, req.url.split('?')[0] === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
const AI = { name: 'sparkling soda', sameAs: '', alternatives: ['soda can'], restingOn: 'on a wooden table', placeCertain: false, placeGuesses: ['Kitchen counter', 'Dining table'], description: 'a can of sparkling soda on a table' };
const results = []; const errors = [];
const check = (name, ok, note = '') => { results.push({ name, ok: !!ok, note }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${note ? ' — ' + note : ''}`); };

async function main() {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const ctx = await browser.newContext({ permissions: ['camera'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  let aiNext = null, same = null, like = null;
  await ctx.route('https://api.anthropic.com/**', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}'); const content = body.messages?.[0]?.content || [];
    const images = content.filter((b) => b.type === 'image').length;
    const isLike = content.some((b) => b.type === 'text' && /"same":/.test(b.text));
    const isSame = !isLike && content.some((b) => b.type === 'text' && /NEW PHOTO/.test(b.text));
    const text = JSON.stringify(isLike ? (like || { same: true, seen: '' }) : isSame ? (same || { index: 0, sure: false }) : images ? (aiNext || AI) : (/zzzz/.test(JSON.stringify(content)) ? { matches: [], message: 'none' } : { matches: [0], message: 'ok' }));
    await new Promise((r) => setTimeout(r, 300));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [{ type: 'text', text }] }) });
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 160)); });
  const shot = async (n) => { await page.waitForTimeout(200); await page.screenshot({ path: `shots/audit-${n}.png` }); };
  const count = (sel) => page.locator(sel).count();
  const text = (sel) => page.locator(sel).first().innerText().catch(() => '');
  const mk = (label, color, w, h) => page.evaluate(([label, color, w, h]) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.fillStyle = color; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff'; g.font = `bold ${Math.round(h / 8)}px sans-serif`; g.textAlign = 'center'; g.fillText(label, w / 2, h / 2);
    const s = Math.min(w, h); const t = document.createElement('canvas'); t.width = 600; t.height = 600; t.getContext('2d').drawImage(c, (w - s) / 2, (h - s) / 2, s, s, 0, 0, 600, 600);
    return { photo: c.toDataURL('image/jpeg', 0.7), thumb: t.toDataURL('image/jpeg', 0.8) };
  }, [label, color, w, h]);
  const shoot = async (n = 1) => { await page.waitForSelector('.camera'); await page.waitForTimeout(400); for (let i = 0; i < n; i++) { await page.click('.shutter'); await page.waitForTimeout(250); } await page.click('.camera-done'); };
  // GUIDE_adapt.md helper: pick where it is in the camera's In list (an existing place/box by exact name, else a new place).
  const pickPlace = async (name) => {
    await page.click(await page.locator('.w1-in.set').count() ? '.w1-in-open' : 'button.w1-in'); await page.waitForSelector('.in-list');
    await page.fill('.in-list .wl-search input', name); await page.waitForTimeout(200);
    const row = page.locator(`.in-list .wl-row:has(b:text-is("${name}"))`);
    if (await row.count()) await row.first().click(); else await page.locator('.in-list .wl-new').first().click();
    await page.waitForTimeout(250);
  };
  const back = async () => { await page.click('.header .back, .thing-head .chev'); await page.waitForTimeout(300); };

  // ---------- A. Boot without a key ----------
  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen'); await page.evaluate(() => { localStorage.removeItem('rig-store'); localStorage.removeItem('rig-uid'); localStorage.removeItem('rig-rules'); }); await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen');
  // MVP step 1 (2026-09-24): a fresh phone with NO key works — AI goes through ReCall's service.
  check('A1 no key → no setup card on Home', await count('.card.setup') === 0);
  check('A2 no key → Log item and Find item enabled', await page.locator('.footer .btn-primary:disabled, .footer .btn-primary.disabled').count() === 0);
  check('A3 no key → the first-run line', /Photograph something|Take a photo/.test(await text('.card .empty')));
  await page.click('.tiny'); await page.waitForSelector('.settings');
  check('A4 Settings: AI says nothing to set up; own-key form folded away', /Nothing to set up/.test(await page.locator('.settings').innerText()) && await count('.settings input[type=password]') === 0);
  const before = await page.evaluate(() => window.__rig.aiCalls || 0);
  await page.click('.settings .btn-secondary:has-text("Check it works")'); await page.waitForSelector('.key-ok, .key-bad', { timeout: 8000 });
  check('A5 Check it works → through ReCall\'s service (the ai function was called)', await count('.key-ok') === 1 && /ReCall/.test(await text('.key-ok')) && (await page.evaluate(() => window.__rig.aiCalls || 0)) === before + 1);
  await page.evaluate(() => { window.__rig.aiLimit = 1; });
  await page.click('.settings .btn-secondary:has-text("Check it works")'); await page.waitForSelector('.key-bad', { timeout: 8000 });
  check('A6 over the daily limit → says so in plain words', /today's share/.test(await text('.key-bad')));
  await page.evaluate(() => { window.__rig.aiLimit = 0; });
  await page.click('.link-btn:has-text("Use my own AI key")');
  check('A7 Use my own AI key → the form appears', await count('.settings input[type=password]') === 1);
  await page.fill('.settings input[type=password]', 'sk-rig-own'); await page.click('.settings .btn-primary:has-text("Save")');
  let direct = false; const onReq = (r) => { if (/api\.anthropic\.com/.test(r.url()) && r.headers()['x-api-key'] === 'sk-rig-own') direct = true; }; page.on('request', onReq);
  const svcBefore = await page.evaluate(() => window.__rig.aiCalls || 0);
  await page.click('.settings .btn-secondary:has-text("Check it works")'); await page.waitForTimeout(1500);
  check('A8 own key → calls go straight from the phone, not through the service', direct && (await page.evaluate(() => window.__rig.aiCalls || 0)) === svcBefore);
  page.off('request', onReq);
  await page.click('.btn-quiet:has-text("Stop using my key")');
  check('A9 Stop using my key → back to ReCall\'s service', /Nothing to set up/.test(await page.locator('.settings').innerText()));
  await page.evaluate(() => { window.__rig.aiLimit = 150; });
  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen');

  // ---------- Seed: one NEW-format item, one OLD-format item (as on Ravi's phone) ----------
  const now = Date.now(), H = 3600000, D = 86400000;
  const pG = await mk('glasses', '#5b7f9a', 1200, 900), pG2 = await mk('glasses wide', '#4a6d86', 1200, 900), pOld = await mk('old', '#7a8ea0', 900, 1200);
  const pK = await mk('keys', '#8a6d4a', 900, 1200), pS = await mk('soda', '#4a8a6d', 1200, 900);
  await page.evaluate((s) => window.__rig.seed(s), [
    { id: 'i1', kind: 'item', household: 'default', name: 'reading glasses', aliases: ['glasses'], location: 'Kitchen counter', description: 'black frames', restingOn: 'on a wooden table', ...pG, thumbV: 2, order: now - 5 * D, createdAt: now - 5 * D, lastSeenAt: now - 2 * H, logId: 'log_a', photoCount: 2,
      history: [{ location: 'Bedside table', at: now - 5 * D }, { location: 'Kitchen counter', at: now - 2 * H }] },
    { id: 's1', kind: 'snap', itemId: 'i1', logId: 'log_a', ...pG, location: 'Kitchen counter', at: now - 2 * H },
    { id: 's1b', kind: 'snap', itemId: 'i1', logId: 'log_a', ...pG2, location: 'Kitchen counter', at: now - 3 * D, extra: true }, // a photo added days earlier — the when line must change when swiped to it
    { id: 's1c', kind: 'snap', itemId: 'i1', logId: 'log_c', ...pOld, location: 'Bedside table', at: now - 5 * D },
    // OLD format: no logId, no photoCount, no aliases, no thumbV (logged on build 20260905l)
    { id: 'i2', kind: 'item', household: 'default', name: 'keys', location: 'Hall table', description: 'car keys', ...pK, order: now - 4 * D, createdAt: now - 4 * D, lastSeenAt: now - D, history: [{ location: 'Hall table', at: now - D }] },
    { id: 's2', kind: 'snap', itemId: 'i2', ...pK, location: 'Hall table', at: now - D },
    { id: 'i3', kind: 'item', household: 'default', name: 'sparkling soda', aliases: [], location: '', description: 'a can', ...pS, thumbV: 2, order: now - 3 * D, createdAt: now - 3 * D, lastSeenAt: now - 3 * H, logId: 'log_e', photoCount: 1, history: [{ location: '', at: now - 3 * H }] },
    { id: 's3', kind: 'snap', itemId: 'i3', logId: 'log_e', ...pS, location: '', at: now - 3 * H },
    { id: 'pl1', kind: 'place', household: 'default', name: 'Kitchen counter', order: 1 },
  ]);
  await page.waitForTimeout(500);
  check('B1 board shows 3 tiles', await count('.tile') === 3);
  check('B2 old item thumb rebuilt (thumbV set)', await page.evaluate(() => window.__rig.dump().find((d) => d.id === 'i2').thumbV === 2));
  // B3, B4 retired 2026-10-01 (see the top of the file).

  // ---------- D. Thing card: OLD item — Add photo ----------
  await page.click('.tile >> nth=1'); await page.waitForSelector('.card.thing');
  check('D1 old item opens; one photo, no dots', await count('.dots') === 0);
  await page.click('.tp-row:has-text("Add a photo")'); await shoot(1); await page.waitForTimeout(900); await shot('d-old-add');
  const i2 = await page.evaluate(() => window.__rig.dump().find((d) => d.id === 'i2'));
  check('D2 old item: Add photo actually saved a snap', await page.evaluate(() => window.__rig.dump().filter((d) => d.kind === 'snap' && d.itemId === 'i2').length) === 2, `photoCount=${i2.photoCount} logId=${i2.logId}`);
  check('D3 old item: thing card now shows the strip with 2 pages', await count('.dots .dot') === 2);
  check('D4 toast says Added', /Added/.test(await text('.toast')));
  await back(); await page.waitForSelector('.board');

  // ---------- D. Thing card: NEW item — strip, earlier, add, remove ----------
  await page.click('.tile >> nth=0'); await page.waitForSelector('.card.thing');
  check('D5 new item: 2 dots (cover + extra)', await count('.dots .dot') === 2);
  {
    const mids = await page.evaluate(() => { const mid = (el) => { const r = el.getBoundingClientRect(); return (r.top + r.bottom) / 2; }; const rows = Array.from(document.querySelectorAll('.sw-row')).map((r) => Math.abs(mid(r.querySelector('svg')) - mid(r.querySelector('.lab'))) + Math.abs(mid(r.querySelector('.sw')) - mid(r.querySelector('.lab')))); const rw = Array.from(document.querySelectorAll('.tp-row')).map((r) => Math.abs(mid(r.querySelector('svg')) - mid(r.querySelector('span')))); return { rows: Math.max(...rows, ...rw), title: Math.abs(mid(document.querySelector('.thing-head .chev')) - mid(document.querySelector('.thing-head .name'))) }; });
    check('D5a icons, text and numbers share a centre line (title, the list rows and switches)', mids.rows < 1.5 && mids.title < 1.5, JSON.stringify(mids));
  }
  check('D6 title: name, lock absent; Where it is says the place; Move it', /Reading glasses/.test(await text('.thing-head .name')) && /Kitchen counter/.test(await text('.tp-wh b')) && await count('.thing-head .lk') === 0 && await count('.tp-btn:has-text("Move it")') === 1);
  check('D6b build 2: no bottom bar, no Edit, no Move to the top, no Put items in on a thing that holds nothing', await count('.actbar') === 0 && await count('.act') === 0 && !/Move to the top|Put items in|Edit/.test(await text('.thing-page')));
  check('D6a Show earlier places row present, count = 1 earlier place', await count('.sw-row') === 3 && /Show earlier places\s*1/.test(await text('.sw-row >> nth=2')));
  await page.click('.sw-row >> nth=2 >> .sw'); await page.waitForTimeout(400);
  check('D7 earlier on → 3 photos; the Bedside one carries its place under it, title unchanged', await count('.dots .dot') === 3 && (await page.locator('.was:not(.empty)').allInnerTexts()).join('|').includes('Bedside table') && /Kitchen counter/.test(await text('.tp-wh b')));
  await page.click('.sw-row >> nth=2 >> .sw'); await page.waitForTimeout(300);
  check('D8 earlier off → back to the current stay (2)', await count('.dots .dot') === 2);
  await page.click('.tp-row:has-text("Add a photo")'); await shoot(1); await page.waitForTimeout(900);
  check('D9 new item: Add photo → 3 dots', await count('.dots .dot') === 3);
  const stamps = await page.locator('.stamp').allInnerTexts();
  check('D9a every photo carries its own time, newest first (the one just added is Today)', stamps.length === 3 && /^Today/.test(stamps[0]) && stamps[0] !== stamps[2], stamps.join(' | '));
  const stampPx = await page.evaluate(() => getComputedStyle(document.querySelector('.stamp')).fontSize);
  check('D9b the time label is a fixed 13 px', stampPx === '13px', stampPx);
  check('D9c build 2: Show times on photos is not on the page (it is in Settings, #27)', await count('.thing-page .sw[aria-label="Show times on photos"]') === 0);
  // remove the extra (page 3)
  await page.click('.dot >> nth=2'); await page.waitForTimeout(400); await page.click('.photo-trash'); await page.waitForSelector('.sheet');
  check('D10 remove-photo sheet (not the item sheet)', /Remove this photo/.test(await text('.sheet-title')));
  await page.click('.sheet .btn-secondary'); await page.waitForTimeout(500);
  check('D11 after remove → 2 dots, Undo offered', await count('.dots .dot') === 2 && await count('.toast-undo') === 1);
  await page.click('.toast-undo'); await page.waitForTimeout(600);
  check('D12 Undo restores → 3 dots', await count('.dots .dot') === 3);
  // Fix: rename → alias kept
  await page.click('.tp-row:has-text("Rename")'); await page.waitForSelector('.sheet .place-input'); await page.fill('.sheet .place-input', 'spectacles'); await page.click('.sheet .btn-primary'); await page.waitForTimeout(400);
  const i1 = await page.evaluate(() => window.__rig.dump().find((d) => d.id === 'i1'));
  check('D13 rename keeps old name as alias', i1.name === 'spectacles' && (i1.aliases || []).includes('reading glasses'), JSON.stringify(i1.aliases));
  check('D14 header shows new name', /Spectacles/.test(await text('.thing-head .name')));
  // Edit the place → history grows, seen now
  await page.click('.tp-btn:has-text("Move it")'); await page.waitForSelector('.lc'); await page.waitForTimeout(400);
  // 10-01: Move it → the same camera, the In chip already set to where it is now; Save waits for a change.
  check('D15m Move it → the camera, the item up in the band, In: Kitchen counter already set, Save off until a change', await count('.lc-band .lc-thing') === 1 && await count('.lc-card .w1-in.set') === 1 && /Kitchen counter/.test(await text('.w1-in.set')) && await page.locator('.lc-k.sv').isDisabled());
  await page.click('.w1-in-open'); await page.waitForSelector('.in-list');
  { const rows = await page.locator('.in-list .wl-row b').allInnerTexts();
    check('D15p In → every place and box, with search, Kitchen counter marked Current place; no thing that holds nothing', await count('.in-list .wl-search input') === 1 && rows.length >= 1 && await count('.in-list .wl-row:has(b:text-is("Kitchen counter")) .wl-cur') === 1 && !rows.some((r) => /^(Keys|Sparkling soda|Spectacles)$/i.test(r)), rows.join(' | ')); }
  await page.click('.in-list .btn-quiet:has-text("Cancel")'); await page.waitForTimeout(150);
  await pickPlace('Sofa'); await page.click('.lc-k.sv'); await page.waitForSelector('.lc', { state: 'detached' }); await page.waitForTimeout(500);
  if (await count('.saved-card')) { await page.waitForTimeout(600); await page.click('.saved-card .s'); await page.waitForTimeout(300); } // 09-30: the Move's card, tapped away
  const i1b = await page.evaluate(() => window.__rig.dump().find((d) => d.id === 'i1'));
  check('D15a edit place → history entry + lastSeenAt now', i1b.location === 'Sofa' && i1b.history.length === 3 && Date.now() - i1b.lastSeenAt < 5000);
  check('D15b Where it is says Sofa; the move wrote a sighting (1 photo at Sofa); earlier counts 2 PLACES', /Sofa/.test(await text('.tp-wh b')) && await count('.strip-page') === 1 && /Show earlier places\s*2/.test(await text('.sw-row >> nth=2')));
  // Tidy up: forget earlier → the 3 older photos go, one Undo brings them back
  await page.click('.tp-row:has-text("Remove old photos")'); await page.waitForSelector('.sheet');
  check('D15c Tidy sheet: counts are right (2 earlier places · 3 photos)', /deletes 3 photos from 2 earlier places/.test(await text('.sheet')));
  await page.click('.sheet-row.tidy.amber'); await page.waitForTimeout(600);
  check('D15d forget earlier → no earlier row, toast with Undo', await count('.sw-row') === 2 && await count('.toast-undo') === 1);
  await page.click('.toast-undo'); await page.waitForTimeout(800);
  check('D15e Undo → earlier places back (2)', /Show earlier places\s*2/.test(await text('.sw-row >> nth=2')));
  check('D15 build 2: no Edit panel, no Done, no second Done', await count('.fix') === 0 && !/\bDone\b/.test(await text('.thing-page')));
  // Press-and-hold on the photo → the item sheet with Remove this photo
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(200); // 09-30: the Move's note makes the page longer; the photo is at the top
  const pb = await page.locator('.card.thing img').first().boundingBox();
  await page.mouse.move(pb.x + 60, pb.y + 60); await page.mouse.down(); await page.waitForTimeout(650); await page.mouse.up(); await page.waitForTimeout(200);
  check('D16 hold on the photo → item sheet, with Remove this photo; trimmed (#28)', await count('.item-sheet') === 1 && /Remove this photo/.test(await text('.item-sheet')) && !/Change the place|Rename|Move to the top|Put items in/.test(await text('.item-sheet')));
  await page.click('.item-sheet .btn-primary.alt'); await page.waitForTimeout(200);
  // Add a photo that is a different thing → guard
  like = { same: false, seen: 'coffee cup' };
  await page.click('.tp-row:has-text("Add a photo")'); await shoot(1); await page.waitForTimeout(900);
  check('D18 mismatched photo → question, not saved', await count('.item-sheet') === 1 && /coffee cup/.test(await text('.sheet-title')) && await count('.strip-page') === 1);
  await page.click('text=Don\'t add it'); await page.waitForTimeout(200);
  check('D18b Don\'t add → nothing added', await count('.strip-page') === 1 && await count('.item-sheet') === 0);
  like = null;
  // Private: Edit → toggle → lock on the tile; a private thing of ANOTHER phone never shows
  await page.click('.sw[aria-label="Keep this private"]'); await page.waitForTimeout(300);
  check('D20 Keep this private switch → private; lock appears in the title; toast', await count('.thing-head .lk') === 1 && (await page.evaluate(() => window.__rig.dump().find((d) => d.id === 'i1').private)) === true && /Now private/.test(await text('.toast')));
  await back(); await page.waitForSelector('.board');
  check('D21 private tile shows a lock on this phone', await count('.tile-lock') === 1);
  await page.evaluate(() => window.__rig.seed([{ id: 'ix', kind: 'item', household: 'default', name: 'other phone secret', visibility: 'private', owner: 'dev_other', location: 'Drawer', thumb: '', photo: '', order: 1, createdAt: 1, lastSeenAt: 1, history: [] }]));
  await page.waitForTimeout(300);
  check('D22 another phone\'s private thing is not on this board', await count('.tile') === 3 && !/other phone secret/.test(await text('.board')));
  await page.click('.tile >> nth=0'); await page.waitForSelector('.card.thing'); await page.click('.sw[aria-label="Keep this private"]'); await page.waitForTimeout(300);
  check('D19 the list: Add a photo · Rename · Remove; switch back → shared, lock gone', await count('.tp-row:has-text("Add a photo")') === 1 && await count('.tp-row:has-text("Rename")') === 1 && await count('.tp-row.red:has-text("Remove")') === 1 && await count('.thing-head .lk') === 0);
  await back(); await page.waitForSelector('.board');

  // ---------- C. Log item paths (the camera, 09-27: what, then where — LogCamera) ----------
  const lc = async (n = 1) => { await page.waitForSelector('.lc'); await page.waitForTimeout(400); for (let i = 0; i < n; i++) { await page.click('.lc-shutter'); await page.waitForTimeout(350); } };
  await page.click('.footer .btn-primary >> nth=0'); await page.waitForSelector('.lc'); await page.click('.lc-x'); await page.waitForTimeout(200);
  check('C1 camera Cancel before a photo → Home, nothing saved, nothing asked', await count('.lc') === 0 && await count('.board') === 1);
  aiNext = { ...AI, name: 'blue mug', alternatives: [], sameAs: '' }; same = { index: 0, sure: false };
  await page.click('.footer .btn-primary >> nth=0'); await lc(1); await page.waitForTimeout(1500);
  check('C2 one photo → the band names it (capitalised); Cancel | shutter | Save (hold Save = Save + Next; no + Next button)', /Blue mug/.test(await text('.lc-name')) && await count('.lc-k.sv') === 1 && await count('.lc-k.sn') === 0 && /hold for Save \+ Next/.test(await page.locator('.lc-k.sv').getAttribute('aria-label')) && await count('.lc-bot .lc-x') === 1);
  await page.click('.lc-name'); await page.fill('.sheet .place-input', 'coffee mug'); await page.click('.sheet .btn-primary'); await page.waitForTimeout(200);
  check('C3 tap the name → rename', /Coffee mug/.test(await text('.lc-name')));
  await page.click('button.w1-in'); await page.waitForSelector('.in-list');
  check('C4 What is it in? → every place and box (InList), with search', await count('.in-list .wl-row') >= 1 && await count('.in-list .wl-search input') === 1);
  await page.click('.in-list .btn-quiet:has-text("Cancel")'); await page.waitForTimeout(150);
  await pickPlace('the shelf');
  check('C4a the typed place is the In chip (new place "Shelf"); Save stays one word', await count('.w1-in.set') === 1 && /In:\s*Shelf/.test(await text('.w1-in.set')) && (await text('.lc-k.sv')).trim() === 'Save', await text('.w1-in.set'));
  await page.click('.lc-k.sv'); await page.waitForSelector('.board', { timeout: 5000 }); await page.waitForTimeout(500);
  const mug = await page.evaluate(() => window.__rig.dump().find((d) => d.kind === 'item' && d.name === 'coffee mug'));
  check('C5 typed place saved, AI name kept as alias', mug && mug.location === 'Shelf' && (mug.aliases || []).includes('blue mug'), mug && JSON.stringify([mug.location, mug.aliases]));
  check('C6 board now 4 tiles; Home shows the saved card', await count('.tile') === 4 && await count('.saved-card') === 1);
  // Cancel after a photo asks first
  await page.click('.footer .btn-primary >> nth=0'); await lc(1); await page.click('.lc-x'); await page.waitForTimeout(200);
  check('C7 Cancel after a photo asks "Throw these photos away?"', /Throw these photos away/.test(await text('body')));
  await page.click('text=Throw away'); await page.waitForTimeout(300);
  check('C7b …Throw away → nothing saved', await count('.tile') === 4 && await count('.board') === 1);
  // Save before the name arrives, no match → named afterwards
  aiNext = { ...AI, name: 'green pen', alternatives: [], sameAs: '' };
  await page.click('.footer .btn-primary >> nth=0'); await lc(1); await page.click('.lc-k.sv'); await page.waitForTimeout(2500);
  const pen = await page.evaluate(() => window.__rig.dump().find((d) => d.kind === 'item' && d.name === 'green pen'));
  check('C8 save-before-name → named afterwards, back on Home', !!pen && pen.naming === false && await count('.board') === 1, pen && `naming=${pen.naming}`);
  // Bug #10: a shared word is NOT a match any more ("soda can" ≠ "sparkling soda" by name)…
  aiNext = { ...AI, name: 'soda can', alternatives: [], sameAs: '' }; same = { index: 0, sure: false };
  await page.click('.footer .btn-primary >> nth=0'); await lc(1); await page.waitForTimeout(2200);
  check('C9 a shared word is not a match (bug #10): no "Your sparkling soda?"', !/Your sparkling soda/i.test(await text('.lc')));
  await page.click('.lc-x'); await page.click('text=Throw away'); await page.waitForTimeout(300);
  // …the AI's own sameAs is, and it is ASKED
  aiNext = { ...AI, name: 'soda can', alternatives: [], sameAs: 'sparkling soda' };
  await page.click('.footer .btn-primary >> nth=0'); await lc(1); await page.waitForTimeout(1500);
  check('C10 the AI says it is the same → asked: Your sparkling soda?', /Your sparkling soda\?/.test(await text('.lc-ask')));
  await page.click('.lc-ask button:has-text("No, a new item")'); await page.waitForTimeout(200);
  check('C11 No, a new item → the question goes, the AI name stays', await count('.lc-ask') === 0 && /Soda can/.test(await text('.lc-name')));
  await page.click('.lc-x'); await page.click('text=Throw away'); await page.waitForTimeout(300);
  // Visual tier: an unsure match is ignored; a sure one is asked
  aiNext = { ...AI, name: 'fizzy drink', alternatives: [], sameAs: '' }; same = { index: 1, sure: false };
  await page.click('.footer .btn-primary >> nth=0'); await lc(1); await page.waitForTimeout(2200);
  check('C12 unsure visual match is ignored', await count('.lc-ask') === 0);
  await page.click('.lc-x'); await page.click('text=Throw away'); await page.waitForTimeout(300);
  same = { index: 1, sure: true };
  await page.click('.footer .btn-primary >> nth=0'); await lc(1); await page.waitForTimeout(2200);
  check('C13 sure visual match → asked (Your …?)', /Your .*\?/.test(await text('.lc-ask')));
  // Save without answering → asked before anything is merged → Yes merges (no new tile)
  const tilesBefore = await count('.tile');
  await page.click('.lc-k.sv'); await page.waitForTimeout(400);
  check('C14 Save without answering → Is this your …?', /Is this your/.test(await text('body')));
  await page.click('text=Yes, the same item'); await page.waitForSelector('.board', { timeout: 5000 }); await page.waitForTimeout(400);
  check('C15 Yes → merged, no extra tile', await count('.tile') === tilesBefore, `${await count('.tile')} vs ${tilesBefore}`);
  aiNext = null; same = null;
  await page.waitForTimeout(8500); // the saved card goes

  // ---------- E. Tile hold sheet ----------
  const t0 = await page.locator('.tile').first().boundingBox();
  await page.mouse.move(t0.x + 40, t0.y + 40); await page.mouse.down(); await page.waitForTimeout(650); await page.mouse.up(); await page.waitForTimeout(200);
  check('E1 hold → item sheet, no navigation', await count('.item-sheet') === 1 && await count('.board') === 1);
  await page.click('.item-sheet .btn-primary.alt'); await page.waitForTimeout(200);
  check('E2 Cancel closes the sheet', await count('.item-sheet') === 0);
  await page.mouse.move(t0.x + 40, t0.y + 40); await page.mouse.down(); await page.waitForTimeout(650); await page.mouse.up(); await page.waitForTimeout(200);
  check('E2a build 2: the hold sheet is trimmed (#28)', !/Change the place|Rename|Move to the top/.test(await text('.item-sheet')));
  await page.click('.item-sheet button:has-text("Move it"), .item-sheet button:has-text("Put it somewhere")'); await page.waitForSelector('.lc');
  check('E3 Move it → the camera with the item there, asking where (in the band)', /Where (is|are) the/.test(await text('.lc-band')));
  await page.click('.lc-x'); await page.waitForTimeout(300);
  await page.mouse.move(t0.x + 40, t0.y + 40); await page.mouse.down(); await page.waitForTimeout(650); await page.mouse.up(); await page.waitForTimeout(200);
  await page.click('text=Remove from my items'); await page.waitForSelector('.sheet');
  check('E4 Remove → confirm sheet', /Remove your/.test(await text('.sheet-title')));
  await page.click('.sheet .btn-secondary'); await page.waitForTimeout(400);
  check('E5 removed → one tile fewer, Undo toast', await count('.tile') === tilesBefore - 1 && await count('.toast-undo') === 1);
  await page.click('.toast-undo'); await page.waitForTimeout(500);
  check('E6 Undo → tile back', await count('.tile') === tilesBefore);
  // Hold → Make private / Share from the grid
  await page.mouse.move(t0.x + 40, t0.y + 40); await page.mouse.down(); await page.waitForTimeout(650); await page.mouse.up(); await page.waitForTimeout(200);
  await page.click('.item-sheet button:has-text("Make private")'); await page.waitForTimeout(300);
  check('E7 hold → Make private → lock watermark on the tile', await count('.tile-lock') === 1);
  await page.mouse.move(t0.x + 40, t0.y + 40); await page.mouse.down(); await page.waitForTimeout(650); await page.mouse.up(); await page.waitForTimeout(200);
  await page.click('.item-sheet button:has-text("Share with the household")'); await page.waitForTimeout(300);
  check('E8 hold → Share → watermark gone', await count('.tile-lock') === 0);

  // ---------- F. Find item ----------
  await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask');
  check('F1 field focused on arrival', await page.evaluate(() => document.activeElement && document.activeElement.id === 'ask-input'));
  await page.fill('#ask-input', 'spec'); await page.waitForTimeout(200);
  check('F2 typing → live tile for spectacles', await count('.ask .tile') >= 1 && /Spectacles/.test(await text('.ask .tile')));
  await page.click('.ask .tile >> nth=0'); await page.waitForSelector('.card.thing');
  check('F3 tile → thing card', /Spectacles/.test(await text('.thing-head .name')));
  await back(); await page.waitForSelector('.ask');
  await page.fill('#ask-input', 'zzzz'); await page.waitForTimeout(200);
  check('F4a no live match → Find it (AI) offered', await count('.ask button[type="submit"]') === 1);
  await page.click('.ask button[type="submit"]'); await page.waitForTimeout(900);
  check('F4 AI says none → No photo of that yet + Take a photo of it', /No photo of that yet/.test(await text('.ask')) && await count('.ask button:has-text("Take a photo of it")') === 1);
  const askPhoto = page.locator('.ask button:has-text("Take a photo of it")');
  if (await askPhoto.count()) { await askPhoto.click(); await page.waitForTimeout(400); check('F5 Take a photo of it → camera', await count('.lc, .camera') === 1); if (await count('.lc')) await page.click('.lc-x'); else if (await count('.camera')) await page.click('.camera-cancel'); }
  else check('F5 Take a photo of it → camera', false, 'still a file input → lands on a dead photo card');
  await page.goBack(); await page.waitForSelector('.board');

  // ---------- G. Menu ----------
  await page.click('.menu-btn'); await page.waitForSelector('.drawer');
  // Phase 2 (09-21): People is the second row (MU1·1) and uses the thing card's chevron header.
  for (const [i, name] of [['0', 'Text size & colours'], ['1', 'People'], ['2', 'Places'], ['3', 'Deleted items'], ['4', 'Research log']]) {
    await page.click(`.drawer-row >> nth=${i}`); await page.waitForSelector('.screen .header, .screen .thing-head');
    check(`G${i}a ${name} opens`, (await text('.header .title, .thing-head .name')) === name);
    await back(); await page.waitForSelector('.drawer');
  }
  check('G4 Back from a menu screen → drawer', await count('.drawer') === 1);
  await page.click('.drawer-row >> nth=2'); await page.waitForSelector('.screen .header');
  check('G5a Locations is a list of used places with pictures', await count('.loc-row') >= 2 && await count('.loc-row img.loc-pic') >= 1);
  await page.click('.settings .btn-secondary:has-text("Add a place")'); await shoot(2); await page.waitForSelector('.screen .header');
  check('G5b Add a location → camera → name screen shows the shots', (await text('.header .title')) === 'New place' && await count('.place-photo img') === 2);
  await page.fill('.settings .place-input', 'Garage'); await page.click('.btn-primary:has-text("Save this place")'); await page.waitForTimeout(400);
  check('G5c saved place listed with its own photo', await page.locator('.loc-row:has-text("Garage") img.loc-pic').count() === 1);
  await page.click('.loc-row:has-text("Garage")'); await page.waitForSelector('.place-photos');
  check('G5d one-location screen: 2 photos + add slot', await count('.place-photo img') === 2 && await count('.place-photo.add') === 1);
  await page.click('.place-photo.add'); await shoot(1); await page.waitForTimeout(500);
  // REQUIREMENTS_2026-09-27 R2: PLACE_PHOTOS is 6 now (was 3), so a third photo does not use up the cap — the add slot stays.
  check('G5e third photo added, add slot still there (cap is 6 now)', await count('.place-photo img') === 3 && await count('.place-photo.add') === 1);
  await page.click('.field-value'); await page.fill('.settings input.place-input', 'Garage shelf'); await page.click('.row button:has-text("Save")'); await page.waitForTimeout(400);
  check('G6 rename a location → back on the list, renamed', await page.locator('.loc-row:has-text("Garage shelf")').count() === 1);
  await page.click('.loc-row:has-text("Garage shelf")'); await page.waitForSelector('.place-photos');
  await page.click('.btn-secondary.amber'); await page.waitForSelector('.sheet'); await page.click('.sheet .btn-secondary'); await page.waitForTimeout(400);
  check('G7 remove a location (confirm) → gone from the list', await page.locator('.loc-row:has-text("Garage")').count() === 0 && await count('.loc-row') >= 2);
  await back(); await page.waitForSelector('.drawer');
  await page.click('.drawer-row >> nth=0'); await page.waitForSelector('.screen .header');
  await page.click('.seg button:has-text("Largest")'); await page.waitForTimeout(100);
  check('G8 text size applies at once', await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--scale').trim()) !== '1');
  await page.click('.seg button:has-text("Normal")'); await page.click('.seg button:has-text("Dusk")'); await page.waitForTimeout(100);
  check('G9 theme applies at once', await page.evaluate(() => document.documentElement.dataset.theme) === 'dusk');
  await page.click('.seg button:has-text("Linen")'); await page.click('.seg button:has-text("Compact")');
  check('G10 density applies', await page.evaluate(() => document.documentElement.dataset.density) === 'compact');
  await page.click('.seg button:has-text("Roomy")');
  await back(); await page.click('.drawer-row.quiet'); await page.waitForTimeout(200);
  check('G11 Close → Home', await count('.drawer') === 0 && await count('.board') === 1);

  // ---------- H. Deleted items flow end to end ----------
  await page.mouse.move(t0.x + 40, t0.y + 40); await page.mouse.down(); await page.waitForTimeout(650); await page.mouse.up(); await page.waitForTimeout(200);
  await page.click('text=Remove from my items'); await page.waitForSelector('.sheet'); await page.click('.sheet .btn-secondary'); await page.waitForTimeout(400);
  await page.click('.menu-btn'); await page.click('.drawer-row >> nth=3'); await page.waitForSelector('.screen .header');
  check('H1 removed item listed', await count('.settings .row') === 1);
  await page.click('button:has-text("Put back")'); await page.waitForTimeout(300);
  check('H2 Put back → list empty', await count('.settings .row') === 0);
  await back(); await page.click('.drawer-row.quiet'); await page.waitForTimeout(200);
  check('H3 tile is back', await count('.tile') === tilesBefore);

  await shot('final-home');
  await browser.close(); server.close();
  const fails = results.filter((r) => !r.ok);
  console.log(`\n${results.length - fails.length}/${results.length} passed`);
  if (errors.length) console.log('ERRORS:\n' + [...new Set(errors)].join('\n'));
  fs.writeFileSync('shots/audit.json', JSON.stringify({ results, errors }, null, 1));
}
main().catch((e) => { console.error(e); process.exit(1); });
