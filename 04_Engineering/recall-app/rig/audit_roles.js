// Phase 1 audit (2026-09-19): the permission table = the rules. Runs the app "as" four people
// over one store with rules ON and checks what each can see and do. Phase 2 adds the UI per
// role; here the UI is the owner's, so a forbidden tap must FAIL (permission-denied), not save.
const { chromium } = require('playwright'); const http = require('http'); const fs = require('fs'); const path = require('path');
const PORT = 8794; const root = path.join(__dirname, 'out');
const server = http.createServer((q, s) => { const f = path.join(root, q.url.split('?')[0] === '/' ? 'index.html' : q.url.split('?')[0]); fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, { 'content-type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : 'text/html' }); s.end(d); }); });
const results = []; const check = (n, ok, note = '') => { results.push([n, ok, note]); console.log((ok ? 'PASS  ' : 'FAIL  ') + n + (ok || !note ? '' : ' — ' + note)); };
(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const ctx = await browser.newContext({ permissions: ['camera'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.route('https://api.anthropic.com/**', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [{ type: 'text', text: JSON.stringify({ name: 'thing', description: '', location: '', same: true }) }] }) }));
  const page = await ctx.newPage(); const denied = []; page.on('console', (m) => { if (/permission-denied/.test(m.text())) denied.push(m.text()); }); page.on('pageerror', (e) => { if (/permission-denied/.test(e.message)) denied.push(e.message); });
  let first = true;
  const boot = async (uid, anon = false) => {
    if (first) { await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen'); first = false; }
    await page.evaluate(([u, a]) => { localStorage.setItem('rig-uid', u); localStorage.setItem('rig-anon', a ? '1' : '0'); localStorage.setItem('recall-ai-config', JSON.stringify({ provider: 'anthropic', apiKey: 'sk-rig', model: '' })); }, [uid, anon]);
    await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen'); await page.waitForTimeout(500);
  };
  const count = (sel) => page.locator(sel).count();
  const mk = (label, color) => page.evaluate(([label, color]) => { const c = document.createElement('canvas'); c.width = 600; c.height = 450; const g = c.getContext('2d'); g.fillStyle = color; g.fillRect(0, 0, 600, 450); g.fillStyle = '#fff'; g.font = 'bold 60px sans-serif'; g.textAlign = 'center'; g.fillText(label, 300, 240); return { photo: c.toDataURL('image/jpeg', 0.6), thumb: c.toDataURL('image/jpeg', 0.6) }; }, [label, color]);
  const dump = () => page.evaluate(() => window.__rig.dump());

  // ---------- seed as Margaret (uid 'margaret'), rules off; then rules on ----------
  await boot('margaret'); await page.evaluate(() => { window.__rig.reset(); localStorage.removeItem('rig-store'); }); await boot('margaret');
  const now = Date.now(), D = 86400000;
  const pG = await mk('glasses', '#5b7f9a'), pP = await mk('pills', '#7a8ea0'), pS = await mk('scissors', '#6b8f6b');
  const thing = (id, name, p, extra = {}) => ({ id, kind: 'item', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [], name, location: 'Kitchen counter', ...p, thumbV: 2, order: now, createdAt: now - D, lastSeenAt: now - D, logId: 'l_' + id, photoCount: 1, history: [{ location: 'Kitchen counter', at: now - D }], ...extra });
  await page.evaluate((s) => window.__rig.seed(s), [
    thing('g', 'reading glasses', pG),
    thing('p', 'my pills', pP, { private: true }),
    thing('s', 'good scissors', pS, { roles: { linda: 'viewer' }, sharedWith: ['linda'] }),
    { id: 'sg', kind: 'snap', owner: 'margaret', by: 'margaret', itemId: 'g', logId: 'l_g', ...pG, location: 'Kitchen counter', at: now - D },
  ]);
  await page.evaluate((s) => window.__rig.seed(s, 'recall_grants'), [
    { id: 'margaret_peter', grantor: 'margaret', grantee: 'peter', role: 'viewer', createdAt: now },
    { id: 'margaret_robert', grantor: 'margaret', grantee: 'robert', role: 'editor', createdAt: now },
  ]);
  await page.evaluate(() => window.__rig.rules(true));

  // ---------- Margaret: owner sees all three, including private ----------
  await boot('margaret'); await page.waitForTimeout(600);
  check('R1 owner sees her 3 things (private included)', await count('.tile') === 3, String(await count('.tile')));

  // ---------- Peter: Can see via grant ----------
  await boot('peter'); await page.waitForTimeout(600);
  check('R2 viewer-by-grant sees 2 (not the private one)', await count('.tile') === 2, String(await count('.tile')));
  await page.click('.tile >> nth=0'); await page.waitForSelector('.card.thing');
  denied.length = 0; await page.click('.act:has-text("Edit")'); await page.waitForTimeout(200); await page.click('.fix .field-value >> nth=0'); await page.fill('.fix input.edit-inline', 'hacked'); await page.press('.fix input.edit-inline', 'Enter'); await page.waitForTimeout(400);
  const gAfter = (await dump()).find((d) => d.id === 'g' || d.id === 's');
  check('R3 viewer cannot rename (rules refuse; name unchanged)', gAfter.name !== 'hacked' && denied.length > 0, `${gAfter.name} · denied=${denied.length}`);
  denied.length = 0; await page.click('.sw-row >> nth=0 >> .sw'); await page.waitForTimeout(300);
  check('R4 viewer cannot make it private', denied.length > 0 && !(await dump()).find((d) => d.id === gAfter.id).private);

  // ---------- Robert: Can help via grant ----------
  await boot('robert'); await page.waitForTimeout(600);
  check('R5 editor-by-grant sees 2', await count('.tile') === 2);
  await page.click('.tile:has-text("Reading glasses")'); await page.waitForSelector('.card.thing');
  denied.length = 0; await page.click('.act:has-text("Edit")'); await page.waitForTimeout(200); await page.click('.fix .field-value >> nth=0'); await page.fill('.fix input.edit-inline', 'spectacles'); await page.press('.fix input.edit-inline', 'Enter'); await page.waitForTimeout(400);
  check('R6 editor CAN rename', (await dump()).find((d) => d.id === 'g').name === 'spectacles' && denied.length === 0, `denied=${denied.length}`);
  await page.click('.fix-row button:has-text("Done")'); await page.waitForTimeout(200);
  denied.length = 0; await page.click('.act.primary'); await page.waitForSelector('.camera'); await page.waitForTimeout(400); await page.click('.shutter'); await page.waitForTimeout(250); await page.click('.camera-done'); await page.waitForTimeout(1200);
  const snapsG = (await dump()).filter((d) => d.kind === 'snap' && d.itemId === 'g');
  check('R7 editor CAN add a photo; the snap is by robert, owned by margaret', snapsG.length === 2 && snapsG.some((s) => s.by === 'robert' && s.owner === 'margaret') && denied.length === 0, `snaps=${snapsG.length} denied=${denied.length}`);
  denied.length = 0; await page.click('.act.amber'); await page.waitForSelector('.sheet'); await page.click('.sheet .btn-secondary'); await page.waitForTimeout(400);
  check('R8 editor cannot remove the thing', denied.length > 0 && !(await dump()).find((d) => d.id === 'g').deleted, `denied=${denied.length}`);
  denied.length = 0; await page.click('.sw-row >> nth=0 >> .sw'); await page.waitForTimeout(300);
  check('R9 editor cannot make it private', denied.length > 0);

  // ---------- Linda: Can see on ONE thing only (direct role) ----------
  await boot('linda'); await page.waitForTimeout(600);
  check('R10 direct viewer sees exactly the one shared thing', await count('.tile') === 1 && /Good scissors/.test(await page.locator('.tile').innerText()));

  // ---------- Stranger ----------
  await boot('stranger'); await page.waitForTimeout(600);
  check('R11 a stranger sees nothing', await count('.tile') === 0);
  await page.click('.footer .btn-primary >> nth=0'); await page.waitForSelector('.camera'); await page.waitForTimeout(400); await page.click('.shutter'); await page.waitForTimeout(250); await page.click('.camera-done'); await page.waitForSelector('.photo-card'); await page.waitForTimeout(1500);
  await page.click('text=Not sure'); await page.waitForTimeout(600);
  const mine = (await dump()).filter((d) => d.kind === 'item' && d.owner === 'stranger');
  check('R12 …but can log into their OWN ReCall (owner = stranger, private=false, roles={})', mine.length === 1 && mine[0].private === false && Object.keys(mine[0].roles || {}).length === 0 && mine[0].by === 'stranger');

  // ---------- Margaret: private with roles is refused; Only me clears roles ----------
  await boot('margaret'); await page.waitForTimeout(600);
  await page.click('.tile:has-text("Good scissors")'); await page.waitForSelector('.card.thing');
  denied.length = 0; await page.click('.sw-row >> nth=0 >> .sw'); await page.waitForTimeout(300);
  const sc = (await dump()).find((d) => d.id === 's');
  check('R13 owner → Only me clears the per-thing role (consistent), rules accept', sc.private === true && Object.keys(sc.roles).length === 0 && sc.sharedWith.length === 0 && denied.length === 0);
  await boot('linda'); await page.waitForTimeout(600);
  check('R14 Linda no longer sees it', await count('.tile') === 0);

  // ---------- Legacy adoption: docs with household and no owner become the anonymous user's ----------
  await page.evaluate(() => { window.__rig.rules(false); window.__rig.reset(); });
  await page.evaluate((s) => window.__rig.seed(s), [{ id: 'old1', kind: 'item', household: 'default', name: 'old keys', location: 'Hall', visibility: 'private', ...pG, order: 1, createdAt: 1, lastSeenAt: 1, history: [] }, { id: 'olds', kind: 'snap', household: 'default', itemId: 'old1', ...pG, location: 'Hall', at: 1 }]);
  await boot('ravi', true); await page.waitForTimeout(800);
  const old = (await dump()).find((d) => d.id === 'old1'), olds = (await dump()).find((d) => d.id === 'olds');
  check('R15 legacy docs adopted on boot: owner=me, private from visibility, roles/sharedWith set; snap too', old.owner === 'ravi' && old.private === true && Array.isArray(old.sharedWith) && olds.owner === 'ravi', JSON.stringify({ o: old.owner, p: old.private, so: olds.owner }));
  check('R16 …and the tile shows (owner listener) with its lock', await count('.tile') === 1 && await count('.tile-lock') === 1);

  const fails = results.filter((r) => !r[1]).length;
  console.log(`\n${results.length - fails}/${results.length} passed`);
  await browser.close(); server.close(); process.exit(fails ? 1 : 0);
})();
