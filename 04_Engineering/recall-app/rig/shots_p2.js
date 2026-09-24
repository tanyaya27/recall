// Phase 2 review screenshots (2026-09-21): the built app, seeded like the audit, one PNG per
// screen in shots/p2_*.png, then montages for Ravi. Real stylesheet, real components.
const { chromium } = require('playwright'); const http = require('http'); const fs = require('fs'); const path = require('path');
const PORT = 8795; const root = path.join(__dirname, 'out');
const server = http.createServer((q, s) => { const f = path.join(root, q.url.split('?')[0] === '/' ? 'index.html' : q.url.split('?')[0]); fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, { 'content-type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : 'text/html' }); s.end(d); }); });
(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream'] });
  const ctx = await browser.newContext({ permissions: ['camera', 'clipboard-write'], viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  let first = true;
  const boot = async (uid, { anon = false, whose = null, url = '' } = {}) => {
    if (first) { await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen'); first = false; }
    await page.evaluate(([u, a, w]) => { localStorage.setItem('rig-uid', u); localStorage.setItem('rig-anon', a ? '1' : '0'); localStorage.setItem('recall-ai-config', JSON.stringify({ provider: 'anthropic', apiKey: '', model: '' })); const p = JSON.parse(localStorage.getItem('recall-prefs') || '{}'); p.whose = w; localStorage.setItem('recall-prefs', JSON.stringify(p)); }, [uid, anon, whose]);
    await page.goto(`http://localhost:${PORT}/${url}`); await page.waitForSelector('.screen'); await page.waitForTimeout(700);
  };
  const shot = (name) => page.screenshot({ path: path.join(__dirname, 'shots', `p2_${name}.png`) });
  const img = (label, color, w = 600, h = 450) => page.evaluate(([label, color, w, h]) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, color); gr.addColorStop(1, '#222'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,0.85)'; g.font = 'bold 54px sans-serif'; g.textAlign = 'center'; g.fillText(label, w / 2, h / 2 + 18); return { photo: c.toDataURL('image/jpeg', 0.7), thumb: c.toDataURL('image/jpeg', 0.7) }; }, [label, color, w, h]);

  await boot('margaret'); await page.evaluate(() => { window.__rig.reset(); localStorage.removeItem('rig-store'); }); await boot('margaret');
  const now = Date.now(), D = 86400000, H = 3600000;
  const pG = await img('glasses', '#5b7f9a'), pP = await img('pills', '#7a8ea0'), pS = await img('scissors', '#6b8f6b'), pK = await img('keys', '#8a6d4a'), pSo = await img('soda', '#4a8a6d');
  const thing = (id, name, p, extra = {}) => ({ id, kind: 'item', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [], name, location: 'Kitchen counter', restingOn: 'on a wooden table', ...p, thumbV: 2, order: now - D + Number(id.charCodeAt(0)), createdAt: now - D, lastSeenAt: now - 2 * H, logId: 'l_' + id, photoCount: 2, history: [{ location: 'Kitchen counter', at: now - D }], ...extra });
  await page.evaluate((s) => window.__rig.seed(s), [
    thing('g', 'reading glasses', pG),
    thing('k', 'keys', pK, { location: 'Hall table', restingOn: '' }),
    thing('p', 'pills', pP, { private: true, photoCount: 1 }),
    thing('s', 'soda', pSo, { photoCount: 1, restingOn: '' }),
    thing('z', 'scissors', pS, { owner: 'robert', by: 'robert', roles: { margaret: 'editor' }, sharedWith: ['margaret'], photoCount: 1, restingOn: '' }),
    { id: 'sg', kind: 'snap', owner: 'margaret', by: 'margaret', itemId: 'g', logId: 'l_g', ...pG, location: 'Kitchen counter', at: now - 2 * H },
    { id: 'sg2', kind: 'snap', owner: 'margaret', by: 'robert', itemId: 'g', logId: 'l_g', ...(await img('glasses · wide', '#456')), location: 'Kitchen counter', at: now - H, extra: true },
    { id: 'sg0', kind: 'snap', owner: 'margaret', by: 'margaret', itemId: 'g', logId: 'l_g0', ...(await img('glasses', '#775')), location: 'Bedside', at: now - 3 * D },
    { id: 'pl1', kind: 'place', owner: 'margaret', by: 'margaret', private: false, name: 'Kitchen counter', order: 1, createdAt: now - D, photos: [] },
  ]);
  await page.evaluate((s) => window.__rig.seed(s, 'recall_grants'), [
    { id: 'margaret_robert', grantor: 'margaret', grantee: 'robert', role: 'editor', createdAt: now - 9 * D },
    { id: 'margaret_peter', grantor: 'margaret', grantee: 'peter', role: 'viewer', createdAt: now - 7 * D, via: 'x' },
  ]);
  await page.evaluate((s) => window.__rig.seed(s, 'recall_invites'), [
    { id: 'inv7fK2q', from: 'margaret', role: 'editor', itemId: null, createdAt: now - 3 * D, expiresAt: now + 4 * D, usedBy: null },
  ]);
  await page.evaluate((s) => window.__rig.seed(s, 'recall_users'), [
    { id: 'margaret', name: 'Margaret Hale' }, { id: 'peter', name: 'Peter Hale' }, { id: 'robert', name: 'Robert Lin' },
  ]);
  await page.evaluate(() => window.__rig.rules(true));

  // 1 Margaret's grid (Robert's scissors shared in → owner tag)
  await boot('margaret'); await shot('01_margaret_grid');
  // 2 drawer
  await page.click('.menu-btn'); await page.waitForSelector('.drawer'); await page.waitForTimeout(200); await shot('02_drawer');
  // 3 People with two + pending
  await page.click('.drawer-row:has-text("People")'); await page.waitForSelector('.people'); await page.waitForTimeout(400); await shot('03_people');
  // 4 invite sheet (role picked)
  await page.click('button:has-text("Invite someone")'); await page.waitForSelector('.rolepick'); await page.click('.rolepick button:has-text("Can help")'); await page.waitForTimeout(200); await shot('04_invite');
  await page.click('.sheet .btn-primary.alt'); await page.waitForTimeout(200);
  // 5 person sheet
  await page.click('.prow:has-text("Peter")'); await page.waitForSelector('.sheet'); await page.waitForTimeout(200); await shot('05_person_sheet');
  await page.click('.sheet .btn-primary.alt'); await page.waitForTimeout(200);
  // 6 Margaret's card (owner): stamp with · Robert
  await page.goBack(); await page.goBack(); await page.waitForSelector('.board'); await page.click('.tile:has-text("Reading glasses")'); await page.waitForSelector('.card.thing'); await page.waitForTimeout(600); await shot('06_owner_card');
  // 7 People, empty (a fresh owner) + 8 sign-in sheet
  await boot('fresh', { anon: true }); await page.click('.menu-btn'); await page.click('.drawer-row:has-text("People")'); await page.waitForSelector('.people'); await page.waitForTimeout(300); await shot('07_people_empty');
  await page.click('button:has-text("Invite someone")'); await page.waitForSelector('.rolepick'); await page.click('.rolepick button:has-text("Can see")'); await page.click('.sheet .btn-primary:has-text("Send a link")'); await page.waitForSelector('.join-sheet'); await page.waitForTimeout(200); await shot('08_signin_sheet');
  // 9 Settings account, anonymous
  await boot('fresh', { anon: true }); await page.click('.tiny:has-text("Settings")'); await page.waitForSelector('.settings'); await page.waitForTimeout(400);
  await page.evaluate(() => { const el = document.querySelector('.group-title:nth-of-type(2)'); }); await page.locator('.group-title:has-text("Account")').scrollIntoViewIfNeeded(); await page.evaluate(() => window.scrollBy(0, -12)); await page.waitForTimeout(200); await shot('09_settings_account');
  // 10 Peter's grid (Can see)
  await boot('peter', { whose: 'margaret' }); await shot('10_peter_grid');
  // 11 Peter's card (viewer)
  await page.click('.tile:has-text("Reading glasses")'); await page.waitForSelector('.card.thing'); await page.waitForTimeout(600); await shot('11_viewer_card');
  // 12 Robert's grid (Can help)
  await boot('robert', { whose: 'margaret' }); await shot('12_robert_grid');
  // 13 Robert's card (editor)
  await page.click('.tile:has-text("Reading glasses")'); await page.waitForSelector('.card.thing'); await page.waitForTimeout(600); await shot('13_editor_card');
  // 14 Robert's People (Shared with me)
  await page.goBack(); await page.waitForSelector('.board'); await page.click('.menu-btn'); await page.click('.drawer-row:has-text("People")'); await page.waitForSelector('.people'); await page.waitForTimeout(300); await shot('14_robert_people');
  // 15 switcher
  await page.goBack(); await page.goBack(); await page.waitForSelector('.board'); await page.click('.dayline'); await page.waitForSelector('.sheet'); await page.waitForTimeout(200); await shot('15_switcher');
  // 16 join page (anonymous phone opens the link)
  await boot('newguy', { anon: true, url: '?j=inv7fK2q' }); await page.waitForTimeout(500); await shot('16_join');
  // 17 expired
  await page.evaluate(() => window.__rig.seed([{ id: 'invOld', from: 'margaret', role: 'viewer', itemId: null, createdAt: 1, expiresAt: 2, usedBy: null }], 'recall_invites'));
  await boot('newguy', { anon: true, url: '?j=invOld' }); await page.waitForTimeout(500); await shot('17_expired');
  // 18 removed
  await page.evaluate(() => localStorage.removeItem('recall-join'));
  await boot('peter', { whose: 'margaret' });
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('rig-store')); delete s.cols.recall_grants['margaret_peter']; localStorage.setItem('rig-store', JSON.stringify(s)); });
  await boot('peter', { whose: 'margaret' }); await page.waitForTimeout(300); await shot('18_removed');

  await browser.close(); server.close();
  console.log('done');
})().catch((e) => { console.error(e); process.exit(2); });
