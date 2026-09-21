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
  const back = async () => { await page.click('.header .back, .thing-head .chev'); await page.waitForTimeout(300); };

  // ---------- A. Boot without a key ----------
  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen'); await page.evaluate(() => { localStorage.removeItem('rig-store'); localStorage.removeItem('rig-uid'); localStorage.removeItem('rig-rules'); }); await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen');
  check('A1 no key → One-time setup card on Home', await count('.card.setup') === 1);
  check('A2 no key → footer buttons disabled', await page.locator('.footer .btn-primary:disabled, .footer .btn-primary.disabled').count() === 2);
  await page.click('.card.setup .btn-primary'); await page.waitForSelector('.settings');
  check('A3 Set up → Settings, Version card first', (await text('.settings .group-title')) === 'VERSION' || (await text('.settings .group-title')).toLowerCase() === 'version');
  await page.evaluate(() => localStorage.setItem('recall-ai-config', JSON.stringify({ provider: 'anthropic', apiKey: 'sk-rig', model: '' })));
  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen');
  check('A4 with key → empty board prompt', /Photograph something/.test(await text('.card .empty')));

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
  check('B3 no-place tile: flipped label block says "No place assigned"', await page.locator('.tile').nth(2).locator('.tile-label.noplace').count() === 1 && (await page.locator('.tile').nth(2).innerText()).includes('No place assigned'));

  // ---------- D. Thing card: OLD item — Add photo ----------
  await page.click('.tile >> nth=1'); await page.waitForSelector('.card.thing');
  check('D1 old item opens; one photo, no dots', await count('.dots') === 0);
  await page.click('.act.primary'); await shoot(1); await page.waitForTimeout(900); await shot('d-old-add');
  const i2 = await page.evaluate(() => window.__rig.dump().find((d) => d.id === 'i2'));
  check('D2 old item: Add photo actually saved a snap', await page.evaluate(() => window.__rig.dump().filter((d) => d.kind === 'snap' && d.itemId === 'i2').length) === 2, `photoCount=${i2.photoCount} logId=${i2.logId}`);
  check('D3 old item: thing card now shows the strip with 2 pages', await count('.dots .dot') === 2);
  check('D4 toast says Added', /Added/.test(await text('.toast')));
  await back(); await page.waitForSelector('.board');

  // ---------- D. Thing card: NEW item — strip, earlier, add, remove ----------
  await page.click('.tile >> nth=0'); await page.waitForSelector('.card.thing');
  check('D5 new item: 2 dots (cover + extra)', await count('.dots .dot') === 2);
  {
    const mids = await page.evaluate(() => { const mid = (el) => { const r = el.getBoundingClientRect(); return (r.top + r.bottom) / 2; }; const r2 = document.querySelector('.thing-head .row2'); const rows = Array.from(document.querySelectorAll('.sw-row')).map((r) => Math.abs(mid(r.querySelector('svg')) - mid(r.querySelector('.lab'))) + Math.abs(mid(r.querySelector('.sw')) - mid(r.querySelector('.lab')))); return { row2: Math.abs(mid(r2.querySelector('svg')) - mid(r2.querySelector('b'))), rows: Math.max(...rows), title: Math.abs(mid(document.querySelector('.thing-head .chev')) - mid(document.querySelector('.thing-head .name'))) }; });
    check('D5a icons, text and numbers share a centre line (title, place line, switch rows)', mids.row2 < 1.5 && mids.rows < 1.5 && mids.title < 1.5, JSON.stringify(mids));
  }
  check('D6 title: name, lock absent, current place on line 2', /Reading glasses/.test(await text('.thing-head .name')) && /Kitchen counter/.test(await text('.thing-head .row2')) && await count('.thing-head .lk') === 0);
  check('D6a Show earlier places row present, count = 1 earlier place', await count('.sw-row') === 3 && /Show earlier places\s*1/.test(await text('.sw-row >> nth=2')));
  await page.click('.sw-row >> nth=2 >> .sw'); await page.waitForTimeout(400);
  check('D7 earlier on → 3 photos; the Bedside one carries its place under it, title unchanged', await count('.dots .dot') === 3 && (await page.locator('.was:not(.empty)').allInnerTexts()).join('|').includes('Bedside table') && /Kitchen counter/.test(await text('.thing-head .row2')));
  await page.click('.sw-row >> nth=2 >> .sw'); await page.waitForTimeout(300);
  check('D8 earlier off → back to the current stay (2)', await count('.dots .dot') === 2);
  await page.click('.act.primary'); await shoot(1); await page.waitForTimeout(900);
  check('D9 new item: Add photo → 3 dots', await count('.dots .dot') === 3);
  const stamps = await page.locator('.stamp').allInnerTexts();
  check('D9a every photo carries its own time, newest first (the one just added is Today)', stamps.length === 3 && /^Today/.test(stamps[0]) && stamps[0] !== stamps[2], stamps.join(' | '));
  const stampPx = await page.evaluate(() => getComputedStyle(document.querySelector('.stamp')).fontSize);
  check('D9b the time label is a fixed 13 px', stampPx === '13px', stampPx);
  await page.click('.sw-row >> nth=1 >> .sw'); await page.waitForTimeout(200);
  check('D9c Show times off → no labels', await count('.stamp') === 0);
  await page.click('.sw-row >> nth=1 >> .sw'); await page.waitForTimeout(200);
  // remove the extra (page 3)
  await page.click('.dot >> nth=2'); await page.waitForTimeout(400); await page.click('.photo-trash'); await page.waitForSelector('.sheet');
  check('D10 remove-photo sheet (not the item sheet)', /Remove this photo/.test(await text('.sheet-title')));
  await page.click('.sheet .btn-secondary'); await page.waitForTimeout(500);
  check('D11 after remove → 2 dots, Undo offered', await count('.dots .dot') === 2 && await count('.toast-undo') === 1);
  await page.click('.toast-undo'); await page.waitForTimeout(600);
  check('D12 Undo restores → 3 dots', await count('.dots .dot') === 3);
  // Fix: rename → alias kept
  await page.click('.act:has-text("Edit")'); await page.waitForTimeout(300); await page.click('.fix .field-value >> nth=0'); await page.fill('.fix input.edit-inline', 'spectacles'); await page.press('.fix input.edit-inline', 'Enter'); await page.waitForTimeout(400);
  const i1 = await page.evaluate(() => window.__rig.dump().find((d) => d.id === 'i1'));
  check('D13 rename keeps old name as alias', i1.name === 'spectacles' && (i1.aliases || []).includes('reading glasses'), JSON.stringify(i1.aliases));
  check('D14 header shows new name', /Spectacles/.test(await text('.thing-head .name')));
  // Edit the place → history grows, seen now
  await page.click('.fix .field-value >> nth=1'); await page.waitForSelector('.place-sheet');
  check('D15p Where it is → the place list with pictures (household places, current one excluded)', await count('.place-sheet .guess.withpic') >= 2 && !/Kitchen counter/.test(await text('.place-sheet .guesses')));
  await page.click('.place-sheet .guess.other'); await page.fill('.place-sheet .place-input', 'sofa'); await page.press('.place-sheet .place-input', 'Enter'); await page.waitForTimeout(500);
  const i1b = await page.evaluate(() => window.__rig.dump().find((d) => d.id === 'i1'));
  check('D15a edit place → history entry + lastSeenAt now', i1b.location === 'Sofa' && i1b.history.length === 3 && Date.now() - i1b.lastSeenAt < 5000);
  check('D15b title says Sofa; the move wrote a sighting (1 photo at Sofa); earlier counts 2 PLACES', /Sofa/.test(await text('.thing-head .row2')) && await count('.strip-page') === 1 && /Show earlier places\s*2/.test(await text('.sw-row >> nth=2')));
  // Tidy up: forget earlier → the 3 older photos go, one Undo brings them back
  await page.click('.tidy-btn'); await page.waitForSelector('.sheet');
  check('D15c Tidy sheet: counts are right (2 earlier places · 3 photos)', /deletes 3 photos from 2 earlier places/.test(await text('.sheet')));
  await page.click('.sheet-row.tidy.amber'); await page.waitForTimeout(600);
  check('D15d forget earlier → no earlier row, toast with Undo', await count('.sw-row') === 2 && await count('.toast-undo') === 1);
  await page.click('.toast-undo'); await page.waitForTimeout(800);
  check('D15e Undo → earlier places back (2)', /Show earlier places\s*2/.test(await text('.sw-row >> nth=2')));
  await page.click('.fix-row button:has-text("Done")'); await page.waitForTimeout(200);
  check('D15 Edit panel closes; actbar reads Edit again', await page.locator('.fix').count() === 0 && /Edit/.test(await text('.actbar')));
  // Press-and-hold on the photo → the item sheet with Remove this photo
  const pb = await page.locator('.card.thing img').first().boundingBox();
  await page.mouse.move(pb.x + 60, pb.y + 60); await page.mouse.down(); await page.waitForTimeout(650); await page.mouse.up(); await page.waitForTimeout(200);
  check('D16 hold on the photo → item sheet, with Remove this photo', await count('.item-sheet') === 1 && /Remove this photo/.test(await text('.item-sheet')));
  await page.click('.item-sheet .btn-primary.alt'); await page.waitForTimeout(200);
  // Add a photo that is a different thing → guard
  like = { same: false, seen: 'coffee cup' };
  await page.click('.act.primary'); await shoot(1); await page.waitForTimeout(900);
  check('D18 mismatched photo → question, not saved', await count('.item-sheet') === 1 && /coffee cup/.test(await text('.sheet-title')) && await count('.strip-page') === 1);
  await page.click('text=Don\'t add it'); await page.waitForTimeout(200);
  check('D18b Don\'t add → nothing added', await count('.strip-page') === 1 && await count('.item-sheet') === 0);
  like = null;
  // Private: Edit → toggle → lock on the tile; a private thing of ANOTHER phone never shows
  await page.click('.sw-row >> nth=0 >> .sw'); await page.waitForTimeout(300);
  check('D20 Keep this private switch → private; lock appears in the title; toast', await count('.thing-head .lk') === 1 && (await page.evaluate(() => window.__rig.dump().find((d) => d.id === 'i1').private)) === true && /Now private/.test(await text('.toast')));
  await back(); await page.waitForSelector('.board');
  check('D21 private tile shows a lock on this phone', await count('.tile-lock') === 1);
  await page.evaluate(() => window.__rig.seed([{ id: 'ix', kind: 'item', household: 'default', name: 'other phone secret', visibility: 'private', owner: 'dev_other', location: 'Drawer', thumb: '', photo: '', order: 1, createdAt: 1, lastSeenAt: 1, history: [] }]));
  await page.waitForTimeout(300);
  check('D22 another phone\'s private thing is not on this board', await count('.tile') === 3 && !/other phone secret/.test(await text('.board')));
  await page.click('.tile >> nth=0'); await page.waitForSelector('.card.thing'); await page.click('.sw-row >> nth=0 >> .sw'); await page.waitForTimeout(300);
  check('D19 bar: Add photo · Edit · Remove (three operations); switch back → shared, lock gone', /Add photo/.test(await text('.actbar')) && /Remove/.test(await text('.actbar')) && !/Shared|Private/.test(await text('.actbar')) && await count('.thing-head .lk') === 0);
  await back(); await page.waitForSelector('.board');

  // ---------- C. Log item paths ----------
  await page.click('.footer .btn-primary >> nth=0'); await page.waitForSelector('.camera'); await page.click('.camera-cancel'); await page.waitForTimeout(200);
  check('C1 camera Cancel → Home, nothing saved', await count('.camera') === 0 && await count('.board') === 1);
  aiNext = { ...AI, name: 'blue mug', alternatives: [], sameAs: '' }; same = { index: 0, sure: false };
  await page.click('.footer .btn-primary >> nth=0'); await shoot(2); await page.waitForSelector('.photo-card');
  check('C2 two shots → roll with 2 thumbnails + Another', await count('.roll-shot') === 2 && await count('.roll-add') === 1);
  await page.waitForTimeout(1500);
  check('C3 named as a field (pencil) when nothing matches', await count('.photo-card .field-value.big') === 1 && /blue mug/.test(await text('.photo-card .field-text')));
  await page.click('.roll-x >> nth=1'); await page.waitForTimeout(200);
  check('C4 ✕ drops a shot → 1 thumbnail', await count('.roll-shot') === 1);
  await page.click('.photo-card .field-value.big'); await page.fill('.photo-card input.edit-inline', 'coffee mug'); await page.press('.photo-card input.edit-inline', 'Enter'); await page.waitForTimeout(200);
  check('C4a Where is it? starts as names; two view links under it', await count('.guess.withpic') === 0 && await count('.view-links .link-btn') === 2);
  await page.click('.view-links .link-btn:has-text("Smaller photos")'); await page.waitForTimeout(150);
  check('C4b Smaller photos → rows with a picture (last thing seen there) or a pin', await count('.guess.withpic') >= 2 && await count('.guess-pic') >= 2);
  await page.click('.view-links .link-btn:has-text("Bigger photos")'); await page.waitForTimeout(150);
  check('C4c Bigger photos → two-across grid', await count('.pgrid .pcell') >= 2);
  await page.click('.view-links .link-btn:has-text("Names only")'); await page.waitForTimeout(150);
  check('C4d Names only again; choice remembered on this phone', await count('.guess.withpic') === 0 && await page.evaluate(() => JSON.parse(localStorage.getItem('recall-prefs') || '{}').placeView) === 'names');
  await page.click('text=Somewhere else'); await page.fill('.place-input', 'the shelf'); await page.click('text=Use this'); await page.waitForSelector('.board', { timeout: 5000 });
  const mug = await page.evaluate(() => window.__rig.dump().find((d) => d.kind === 'item' && d.name === 'coffee mug'));
  check('C5 typed place saved, capitalised, AI name kept as alias', mug && mug.location === 'The shelf' && (mug.aliases || []).includes('blue mug'), mug && JSON.stringify([mug.location, mug.aliases]));
  check('C6 board now 4 tiles', await count('.tile') === 4);
  // Back before save cancels
  await page.click('.footer .btn-primary >> nth=0'); await shoot(1); await page.waitForSelector('.photo-card'); await back(); await page.waitForTimeout(200);
  check('C7 Back before save → nothing saved', await count('.tile') === 4 && await count('.board') === 1);
  // Save before the name arrives (D3), no match → finishes
  aiNext = { ...AI, name: 'green pen', alternatives: [], sameAs: '' };
  await page.click('.footer .btn-primary >> nth=0'); await shoot(1); await page.waitForSelector('.photo-card'); await page.click('.guess >> nth=0'); await page.waitForTimeout(2500);
  const pen = await page.evaluate(() => window.__rig.dump().find((d) => d.kind === 'item' && d.name === 'green pen'));
  check('C8 save-before-name → named afterwards, back on Home', !!pen && pen.naming === false && await count('.board') === 1, pen && `naming=${pen.naming}`);
  // Name match → New photo of + Not your → forceNew creates new
  aiNext = { ...AI, name: 'soda can', alternatives: [], sameAs: '' };
  await page.click('.footer .btn-primary >> nth=0'); await shoot(1); await page.waitForSelector('.photo-card'); await page.waitForTimeout(1200);
  check('C9 name tier matches "soda can" → sparkling soda', /New photo of/i.test(await text('.photo-card')) && /sparkling soda/i.test(await text('.photo-card .head')));
  check('C10 grammar: Not your sparkling soda?', /Not your sparkling soda\?/.test(await text('.photo-card .link-btn')));
  await page.click('.photo-card .link-btn'); await page.waitForTimeout(200);
  check('C11 Not your → becomes a new-name field', await count('.photo-card .field-value.big') === 1);
  await back(); await page.waitForTimeout(200);
  // Visual tier: unsure match must NOT take over; sure match must
  aiNext = { ...AI, name: 'fizzy drink', alternatives: [], sameAs: '' }; same = { index: 1, sure: false };
  await page.click('.footer .btn-primary >> nth=0'); await shoot(1); await page.waitForSelector('.photo-card'); await page.waitForTimeout(2200);
  check('C12 unsure visual match is ignored (field stays)', await count('.photo-card .field-value.big') === 1);
  await back(); await page.waitForTimeout(200);
  same = { index: 1, sure: true };
  await page.click('.footer .btn-primary >> nth=0'); await shoot(1); await page.waitForSelector('.photo-card'); await page.waitForTimeout(2200);
  check('C13 sure visual match → New photo of', /New photo of/i.test(await text('.photo-card')));
  await back(); await page.waitForTimeout(200);
  // Late match after save → Is this your … ? → Yes merges (no new tile)
  const tilesBefore = await count('.tile');
  await page.click('.footer .btn-primary >> nth=0'); await shoot(1); await page.waitForSelector('.photo-card'); await page.click('.guess >> nth=0'); await page.waitForTimeout(2500);
  check('C14 late match → asks Is this your …?', /Is this your/.test(await text('.photo-card')));
  await page.click('text=Yes, the same thing'); await page.waitForSelector('.board', { timeout: 5000 }); await page.waitForTimeout(300);
  check('C15 Yes → merged, no extra tile', await count('.tile') === tilesBefore, `${await count('.tile')} vs ${tilesBefore}`);
  aiNext = null; same = null;

  // ---------- E. Tile hold sheet ----------
  const t0 = await page.locator('.tile').first().boundingBox();
  await page.mouse.move(t0.x + 40, t0.y + 40); await page.mouse.down(); await page.waitForTimeout(650); await page.mouse.up(); await page.waitForTimeout(200);
  check('E1 hold → item sheet, no navigation', await count('.item-sheet') === 1 && await count('.board') === 1);
  await page.click('.item-sheet .btn-primary.alt'); await page.waitForTimeout(200);
  check('E2 Cancel closes the sheet', await count('.item-sheet') === 0);
  await page.mouse.move(t0.x + 40, t0.y + 40); await page.mouse.down(); await page.waitForTimeout(650); await page.mouse.up(); await page.waitForTimeout(200);
  await page.click('text=Change the place'); await page.waitForSelector('.card.thing');
  check('E3 Change the place → thing card with Fix open', await count('.fix') === 1);
  await back();
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
  if (await askPhoto.count()) { await askPhoto.click(); await page.waitForTimeout(400); check('F5 Take a photo of it → camera', await count('.camera') === 1); if (await count('.camera')) await page.click('.camera-cancel'); }
  else check('F5 Take a photo of it → camera', false, 'still a file input → lands on a dead photo card');
  await page.goBack(); await page.waitForSelector('.board');

  // ---------- G. Menu ----------
  await page.click('.menu-btn'); await page.waitForSelector('.drawer');
  for (const [i, name] of [['0', 'Text size & colours'], ['1', 'Places'], ['2', 'Deleted items'], ['3', 'Research log']]) {
    await page.click(`.drawer-row >> nth=${i}`); await page.waitForSelector('.screen .header');
    check(`G${i}a ${name} opens`, (await text('.header .title')) === name);
    await back(); await page.waitForSelector('.drawer');
  }
  check('G4 Back from a menu screen → drawer', await count('.drawer') === 1);
  await page.click('.drawer-row >> nth=1'); await page.waitForSelector('.screen .header');
  check('G5a Locations is a list of used places with pictures', await count('.loc-row') >= 2 && await count('.loc-row img.loc-pic') >= 1);
  await page.click('.settings .btn-secondary:has-text("Add a place")'); await shoot(2); await page.waitForSelector('.screen .header');
  check('G5b Add a location → camera → name screen shows the shots', (await text('.header .title')) === 'New place' && await count('.place-photo img') === 2);
  await page.fill('.settings .place-input', 'Garage'); await page.click('.btn-primary:has-text("Save this place")'); await page.waitForTimeout(400);
  check('G5c saved place listed with its own photo', await page.locator('.loc-row:has-text("Garage") img.loc-pic').count() === 1);
  await page.click('.loc-row:has-text("Garage")'); await page.waitForSelector('.place-photos');
  check('G5d one-location screen: 2 photos + add slot', await count('.place-photo img') === 2 && await count('.place-photo.add') === 1);
  await page.click('.place-photo.add'); await shoot(1); await page.waitForTimeout(500);
  check('G5e third photo added, add slot gone', await count('.place-photo img') === 3 && await count('.place-photo.add') === 0);
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
  await page.click('.menu-btn'); await page.click('.drawer-row >> nth=2'); await page.waitForSelector('.screen .header');
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
