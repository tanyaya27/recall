// Multi-user audit — Phase 1 (2026-09-19) + Phase 2 (2026-09-21). Runs the app "as" six people
// over ONE store with rules ON (the stub's permission table = firestore.rules) and checks what
// each can see and do, in the UI they actually get: owner · direct viewer · direct editor ·
// grant viewer · grant editor · stranger. Then the flows: invite (People → link), join (?j=),
// remove → the removed card, leave, and an expired link. The rig's localStorage stands for
// every phone at once, so boot() clears the per-phone "whose" choice unless a test sets it.
const { chromium } = require('playwright'); const http = require('http'); const fs = require('fs'); const path = require('path');
const PORT = 8794; const root = path.join(__dirname, 'out');
const server = http.createServer((q, s) => { const f = path.join(root, q.url.split('?')[0] === '/' ? 'index.html' : q.url.split('?')[0]); fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, { 'content-type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : 'text/html' }); s.end(d); }); });
const results = []; const check = (n, ok, note = '') => { results.push([n, ok, note]); console.log((ok ? 'PASS  ' : 'FAIL  ') + n + (ok || !note ? '' : ' — ' + note)); };
(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const ctx = await browser.newContext({ permissions: ['camera', 'clipboard-read', 'clipboard-write'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.route('https://api.anthropic.com/**', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [{ type: 'text', text: JSON.stringify({ name: 'thing', description: '', location: '', same: true }) }] }) }));
  const page = await ctx.newPage(); const denied = []; page.on('console', (m) => { if (/permission-denied/.test(m.text())) denied.push(m.text()); }); page.on('pageerror', (e) => { if (/permission-denied/.test(e.message)) denied.push(e.message); });
  let first = true;
  const boot = async (uid, { anon = false, whose = null, url = '' } = {}) => {
    if (first) { await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen'); first = false; }
    await page.evaluate(([u, a, w]) => { localStorage.setItem('rig-uid', u); localStorage.setItem('rig-anon', a ? '1' : '0'); localStorage.setItem('recall-ai-config', JSON.stringify({ provider: 'anthropic', apiKey: '', model: '' })); const p = JSON.parse(localStorage.getItem('recall-prefs') || '{}'); p.whose = w; localStorage.setItem('recall-prefs', JSON.stringify(p)); }, [uid, anon, whose]);
    await page.goto(`http://localhost:${PORT}/${url}`); await page.waitForSelector('.screen'); await page.waitForTimeout(600);
  };
  const count = (sel) => page.locator(sel).count();
  const text = (sel) => page.locator(sel).first().innerText().catch(() => '');
  const mk = (label, color) => page.evaluate(([label, color]) => { const c = document.createElement('canvas'); c.width = 600; c.height = 450; const g = c.getContext('2d'); g.fillStyle = color; g.fillRect(0, 0, 600, 450); g.fillStyle = '#fff'; g.font = 'bold 60px sans-serif'; g.textAlign = 'center'; g.fillText(label, 300, 240); return { photo: c.toDataURL('image/jpeg', 0.6), thumb: c.toDataURL('image/jpeg', 0.6) }; }, [label, color]);
  const dump = (c) => page.evaluate((c) => window.__rig.dump(c), c);
  const shoot = async () => { await page.waitForSelector('.camera'); await page.waitForTimeout(400); await page.click('.shutter'); await page.waitForTimeout(250); await page.click('.camera-done'); };
  const rename = async (to) => { denied.length = 0; await page.click('.act:has-text("Edit")'); await page.waitForTimeout(200); await page.click('.fix .field-value >> nth=0'); await page.fill('.fix input.edit-inline', to); await page.press('.fix input.edit-inline', 'Enter'); await page.waitForTimeout(400); await page.click('.fix-row button:has-text("Done")').catch(() => {}); await page.waitForTimeout(150); };

  // ---------- seed as Margaret, rules off; then rules on ----------
  await boot('margaret'); await page.evaluate(() => { window.__rig.reset(); localStorage.removeItem('rig-store'); }); await boot('margaret');
  const now = Date.now(), D = 86400000;
  const pG = await mk('glasses', '#5b7f9a'), pP = await mk('pills', '#7a8ea0'), pS = await mk('scissors', '#6b8f6b'), pK = await mk('keys', '#8a6d4a');
  const thing = (id, name, p, extra = {}) => ({ id, kind: 'item', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [], name, location: 'Kitchen counter', ...p, thumbV: 2, order: now, createdAt: now - D, lastSeenAt: now - D, logId: 'l_' + id, photoCount: 1, history: [{ location: 'Kitchen counter', at: now - D }], ...extra });
  await page.evaluate((s) => window.__rig.seed(s), [
    thing('g', 'reading glasses', pG),
    thing('p', 'my pills', pP, { private: true }),
    thing('s', 'good scissors', pS, { roles: { linda: 'viewer', ken: 'editor' }, sharedWith: ['linda', 'ken'] }),
    { id: 'sg', kind: 'snap', owner: 'margaret', by: 'margaret', itemId: 'g', logId: 'l_g', ...pG, location: 'Kitchen counter', at: now - D },
    { id: 'sg2', kind: 'snap', owner: 'margaret', by: 'robert', itemId: 'g', logId: 'l_g', ...pK, location: 'Kitchen counter', at: now - D + 5000, extra: true },
    { id: 'pl1', kind: 'place', owner: 'margaret', by: 'margaret', private: false, name: 'Kitchen counter', order: 1, createdAt: now - D, photos: [] },
    { id: 'pl2', kind: 'place', owner: 'margaret', by: 'margaret', name: 'Hall table', order: 2, createdAt: now - D, photos: [] }, // adopted before the private:false fix
    // Ken's own thing, so his grid has something of his own
    { ...thing('k1', "ken's wallet", pK), owner: 'ken', by: 'ken' },
  ]);
  await page.evaluate((s) => window.__rig.seed(s, 'recall_grants'), [
    { id: 'margaret_peter', grantor: 'margaret', grantee: 'peter', role: 'viewer', createdAt: now - 2 * D, via: 'x' },
    { id: 'margaret_robert', grantor: 'margaret', grantee: 'robert', role: 'editor', createdAt: now - 9 * D },
  ]);
  await page.evaluate((s) => window.__rig.seed(s, 'recall_users'), [
    { id: 'margaret', name: 'Margaret Hale', anonymous: false }, { id: 'peter', name: 'Peter Hale', anonymous: false }, { id: 'robert', name: 'Robert Lin', anonymous: false }, { id: 'linda', name: 'Linda Park', anonymous: false }, { id: 'ken', name: 'Ken Ito', anonymous: false },
  ]);
  await page.evaluate(() => window.__rig.rules(true));

  // ---------- Margaret: owner ----------
  await boot('margaret');
  check('O1 owner sees her 3 things (private included); day line, no owner tag', await count('.tile') === 3 && await count('.tile-owner') === 0 && await count('.dayline .day') === 1, String(await count('.tile')));
  check('O2 owner phone repaired the place adopted without private:false', (await dump()).find((d) => d.id === 'pl2').private === false);
  await page.click('.tile:has-text("Reading glasses")'); await page.waitForSelector('.card.thing');
  check('O3 owner card: Keep this private · three-button bar · trash on photo', await count('.sw-row:has-text("Keep this private")') === 1 && await count('.actbar .act') === 3 && await count('.photo-trash') >= 1);
  await page.waitForTimeout(500);
  check('O4 stamp names the adder when it was not the owner (Robert), not on her own', /Robert/.test(await page.locator('.stamp').allInnerTexts().then((a) => a.join('|'))) && !/Margaret/.test(await page.locator('.stamp').allInnerTexts().then((a) => a.join('|'))));
  await page.goBack(); await page.waitForSelector('.board');
  // People
  await page.click('.menu-btn'); await page.waitForSelector('.drawer'); await page.click('.drawer-row:has-text("People")'); await page.waitForSelector('.people');
  check('O5 People lists Robert (Can help · since) and Peter (Can see · joined by link)', /Robert.*Can help · since/s.test(await text('.prow >> nth=0')) && /Peter.*Can see · joined by link/s.test(await text('.prow >> nth=1')), (await page.locator('.prow').allInnerTexts()).join(' | '));
  check('O5b the added-by switch shows, on', await count('.sw-row:has-text("Show who added each photo") .sw.on') === 1);
  // invite
  await page.click('button:has-text("Invite someone")'); await page.waitForSelector('.rolepick');
  check('O6 invite sheet: no role preselected, Send disabled', await count('.rolepick .on') === 0 && await page.locator('.sheet .btn-primary:has-text("Send a link")').isDisabled());
  await page.click('.rolepick button:has-text("Can help")'); await page.click('.sheet .btn-primary:has-text("Send a link")'); await page.waitForTimeout(600);
  const invs = await dump('recall_invites');
  check('O7 Send a link → createInvite wrote one invitation (editor, 7 days, unused) · toast Link copied', invs.length === 1 && invs[0].role === 'editor' && !invs[0].usedBy && invs[0].expiresAt - invs[0].createdAt === 7 * D && /Link copied/.test(await text('.toast')));
  await page.waitForTimeout(300);
  check('O8 the pending row appears: Invitation sent · not opened yet', await count('.prow.pending') === 1 && /not opened yet/.test(await text('.prow.pending')));
  const code = invs[0].id;
  // change Peter's role, remove him later
  await page.click('.prow:has-text("Peter")'); await page.waitForSelector('.sheet .rolepick'); await page.click('.sheet .rolepick button:has-text("Can help")'); await page.waitForTimeout(400);
  check('O9 owner changed Peter to Can help (grant role updated)', (await dump('recall_grants')).find((g) => g.id === 'margaret_peter').role === 'editor');
  await page.click('.prow:has-text("Peter")'); await page.waitForSelector('.sheet .rolepick'); await page.click('.sheet .rolepick button:has-text("Can see")'); await page.waitForTimeout(400);

  // ---------- Peter: Can see by grant (his phone remembers nothing; one grant, nothing of his own → her grid) ----------
  await boot('peter');
  check('P1 grant viewer lands in Margaret\'s ReCall: title, role line, 2 tiles (no private)', /Margaret’s ReCall/.test(await text('.title-owner')) && /Can see/.test(await text('.status8')) && await count('.tile') === 2, `${await text('.title-owner')} · ${await count('.tile')}`);
  check('P2 viewer footer: Find item alone', await count('.footer .btn-primary') === 1 && /Find item/.test(await text('.footer .btn-primary')));
  await page.click('.tile:has-text("Reading glasses")'); await page.waitForSelector('.card.thing'); await page.waitForTimeout(400);
  check('P3 viewer card: Shared by Margaret · no trash · no bar · no Keep this private', await count('.sw-row:has-text("Shared by Margaret")') === 1 && await count('.photo-trash') === 0 && await count('.actbar') === 0 && await count('.sw-row:has-text("Keep this private")') === 0);
  check('P4 viewer sees the roll (both photos)', await count('.strip-page') === 2, String(await count('.strip-page')));
  await page.goBack(); await page.waitForSelector('.board');
  await page.click('.menu-btn'); await page.click('.drawer-row:has-text("Places")'); await page.waitForSelector('.screen .header');
  check('P5 viewer sees her places (incl. the repaired one), no Add a place', await count('.loc-row') === 2 && await count('button:has-text("Add a place")') === 0, String(await count('.loc-row')));

  // ---------- Robert: Can help by grant ----------
  await boot('robert', { whose: 'margaret' });
  check('R1 grant editor: Log item says in Margaret\'s ReCall · Find item', /in Margaret’s ReCall/.test(await text('.footer .btn-primary.whose')) && await count('.footer .btn-primary') === 2);
  await page.click('.tile:has-text("Reading glasses")'); await page.waitForSelector('.card.thing');
  check('R2 editor card: two-button bar (Add photo · Edit), no Remove, no Keep this private, Shared by Margaret', await count('.actbar .act') === 2 && await count('.act:has-text("Remove")') === 0 && await count('.sw-row:has-text("Keep this private")') === 0 && await count('.sw-row:has-text("Shared by Margaret")') === 1);
  await rename('spectacles');
  check('R3 editor CAN rename', (await dump()).find((d) => d.id === 'g').name === 'spectacles' && denied.length === 0, `denied=${denied.length}`);
  denied.length = 0; await page.click('.act.primary'); await shoot(); await page.waitForTimeout(1200);
  const snapsG = (await dump()).filter((d) => d.kind === 'snap' && d.itemId === 'g');
  check('R4 editor CAN add a photo; the snap is by robert, owned by margaret', snapsG.length === 3 && snapsG.filter((s) => s.by === 'robert' && s.owner === 'margaret').length === 2 && denied.length === 0, `snaps=${snapsG.length} denied=${denied.length}`);
  await page.click('.act:has-text("Edit")'); await page.waitForTimeout(200); await page.click('.fix .field-value:has-text("Kitchen counter")'); await page.waitForSelector('.sheet'); await page.click('.sheet button:has-text("Hall table")'); await page.waitForTimeout(600);
  check('R5 editor CAN move it (place + a sighting written)', (await dump()).find((d) => d.id === 'g').location === 'Hall table' && (await dump()).some((d) => d.kind === 'snap' && d.itemId === 'g' && d.moved && d.by === 'robert'));
  await page.goBack(); await page.waitForSelector('.board');
  await page.click('.footer .btn-primary.whose'); await shoot(); await page.waitForSelector('.photo-card'); await page.waitForTimeout(1500);
  check('R6 photo card header says in Margaret\'s ReCall', /in Margaret’s ReCall/.test(await text('.header .title')));
  check('R6b the naming call went through ReCall\'s service FOR Margaret, called by Robert (no key on his phone)', await page.evaluate(() => window.__rig.lastAiOwner === 'margaret' && window.__rig.lastAiCaller === 'robert'));
  await page.click('text=Not sure'); await page.waitForTimeout(700);
  const logged = (await dump()).filter((d) => d.kind === 'item' && d.by === 'robert');
  check('R7 editor logs INTO her ReCall: owner = margaret, by = robert', logged.length === 1 && logged[0].owner === 'margaret' && logged[0].private === false, JSON.stringify(logged.map((l) => [l.owner, l.by])));

  // ---------- Linda: Can see on ONE thing (direct role) → her own grid with an owner tag ----------
  await boot('linda');
  check('L1 direct viewer: own grid, the one shared thing, tagged Margaret\'s', await count('.tile') === 1 && /Margaret’s/.test(await text('.tile-owner')) && await count('.dayline .day') === 1);
  await page.click('.tile'); await page.waitForSelector('.card.thing');
  check('L2 …as a viewer card', await count('.actbar') === 0 && await count('.sw-row:has-text("Shared by Margaret")') === 1);

  // ---------- Ken: Can help on ONE thing (direct role) + his own ----------
  await boot('ken');
  check('K1 direct editor: his own thing untagged + hers tagged', await count('.tile') === 2 && await count('.tile-owner') === 1);
  await page.click('.tile:has-text("Good scissors")'); await page.waitForSelector('.card.thing');
  await rename('kitchen scissors');
  check('K2 direct editor CAN rename her thing', (await dump()).find((d) => d.id === 's').name === 'kitchen scissors' && denied.length === 0);
  check('K3 …but the card has no Remove and no Keep this private', await count('.act:has-text("Remove")') === 0 && await count('.sw-row:has-text("Keep this private")') === 0);

  // ---------- Stranger ----------
  await boot('stranger');
  check('S1 a stranger sees nothing, day line, Log item · Find item', await count('.tile') === 0 && await count('.footer .btn-primary') === 2);

  // ---------- Join: anonymous phone opens the link ----------
  await boot('newguy', { anon: true, url: `?j=${code}` });
  check('J1 the link opens the join page: Margaret\'s ReCall · sign in · Google (Apple hidden)', /Margaret’s ReCall/.test(await text('.card.join h1')) && await count('.card.join button:has-text("Continue with Google")') === 1 && await count('button:has-text("Continue with Apple")') === 0);
  check('J1b the code left the URL', !/j=/.test(page.url()));
  // "sign in" (the stub links in place, no redirect); the app re-boots with the code still parked
  await page.click('.card.join button:has-text("Continue with Google")'); await page.waitForTimeout(400);
  await boot('newguy', { anon: false });
  await page.waitForTimeout(800);
  const gNew = (await dump('recall_grants')).find((g) => g.id === 'margaret_newguy');
  check('J2 after sign-in the join completes by itself: grant editor written, invite used', !!gNew && gNew.role === 'editor' && (await dump('recall_invites'))[0].usedBy === 'newguy', JSON.stringify(gNew));
  check('J3 …and he lands in Margaret\'s ReCall as Can help', /Margaret’s ReCall/.test(await text('.title-owner')) && /Can help/.test(await text('.status8')));
  await boot('another', { anon: false, url: `?j=${code}` }); await page.waitForTimeout(600);
  check('J4 the same link a second time: This invitation has expired', /expired/.test(await text('.card.join h1')));
  await page.click('.card.join button:has-text("OK")'); await page.waitForTimeout(300);

  // ---------- Remove and leave ----------
  await boot('margaret');
  await page.click('.menu-btn'); await page.click('.drawer-row:has-text("People")'); await page.waitForSelector('.people');
  check('M1 People now lists 3 people and no pending invitation', await count('.prow') === 3 && await count('.prow.pending') === 0, String(await count('.prow')));
  await page.click('.prow:has-text("Peter")'); await page.waitForSelector('.sheet'); await page.click('.sheet .sheet-row.amber:has-text("Remove Peter")'); await page.waitForSelector('.sheet .btn-secondary'); await page.click('.sheet .btn-secondary:has-text("Remove")'); await page.waitForTimeout(500);
  check('M2 owner removed Peter (grant gone)', !(await dump('recall_grants')).find((g) => g.id === 'margaret_peter'));
  await boot('peter', { whose: 'margaret' });
  check('M3 Peter\'s phone: the removed card, Start my own ReCall, no tiles', /no longer shared with you/.test(await text('.card .sub')) && await count('button:has-text("Start my own ReCall")') === 1 && await count('.tile') === 0);
  await page.click('button:has-text("Start my own ReCall")'); await page.waitForTimeout(400);
  check('M4 Start my own → his own empty grid', await count('.dayline .day') === 1 && await count('.footer .btn-primary') === 2);
  await boot('robert', { whose: 'margaret' });
  await page.click('.menu-btn'); await page.click('.drawer-row:has-text("People")'); await page.waitForSelector('.people');
  check('M5 Robert\'s People: Shared with me · Margaret\'s ReCall · Can help · open now', /Margaret’s ReCall.*Can help · open now/s.test(await text('.people .prow')));
  await page.click('.people .prow:has-text("Margaret")'); await page.waitForSelector('.sheet'); await page.click('.sheet .sheet-row.amber:has-text("Leave")'); await page.waitForSelector('.sheet .btn-secondary'); await page.click('.sheet .btn-secondary:has-text("Leave")'); await page.waitForTimeout(500);
  check('M6 Robert left (grantee deleted the grant) and is back on his own ReCall', !(await dump('recall_grants')).find((g) => g.id === 'margaret_robert') && denied.length === 0);
  await page.goBack().catch(() => {}); await page.waitForTimeout(300); if (!(await count('.board'))) await boot('robert'); await page.waitForTimeout(300);
  check('M7 …his grid is his own, empty', await count('.dayline .day') === 1 && await count('.tile') === 0);

  // ---------- the rules still hold for the forbidden taps (no UI, so drive the store) ----------
  await boot('newguy', { whose: 'margaret' });
  denied.length = 0;
  await page.evaluate(async () => { const { updateDoc, doc, collection } = await import('./app.js').catch(() => ({})); });
  const forbidden = await page.evaluate(async () => {
    const out = {};
    const tryIt = async (k, fn) => { try { await fn(); out[k] = 'ALLOWED'; } catch (e) { out[k] = (e.code || String(e)).includes('permission-denied') ? 'denied' : String(e); } };
    const fs = window.__rigfs; if (!fs) return null;
    await tryIt('private', () => fs.updateDoc(fs.doc(fs.collection(null, 'recall_items'), 'g'), { private: true, roles: {}, sharedWith: [] }));
    await tryIt('delete', () => fs.updateDoc(fs.doc(fs.collection(null, 'recall_items'), 'g'), { deleted: true, deletedAt: 1 }));
    await tryIt('grantRole', () => fs.updateDoc(fs.doc(fs.collection(null, 'recall_grants'), 'margaret_newguy'), { role: 'owner' }));
    await tryIt('grantCreate', () => fs.setDoc(fs.doc(fs.collection(null, 'recall_grants'), 'margaret_x'), { grantor: 'margaret', grantee: 'x', role: 'editor' }));
    return out;
  });
  check('X1 store-level: editor cannot make private / remove / change his role / create a grant', forbidden === null ? false : Object.values(forbidden).every((v) => v === 'denied'), JSON.stringify(forbidden));

  const fails = results.filter((r) => !r[1]).length;
  console.log(`\n${results.length - fails}/${results.length} passed`);
  await browser.close(); server.close(); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
