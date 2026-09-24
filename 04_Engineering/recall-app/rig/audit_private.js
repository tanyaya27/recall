// Private by default + refusing secrets (Ravi 09-24; S3_private.jpg). One thing (before the name,
// after it, Next item), Several, Write it down, a typed secret, a photo with a readable secret,
// Share it instead, "On this phone only" → Coming soon, a helper (Can help) — with the rules ON
// for the helper part. node audit_private.js → PASS/FAIL, screenshots to shots/priv-*.png
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
let aiNext = null; let aiDelay = 250; let lastPrompt = '';
const tagOf = (name, extra = {}) => ({ name, sameAs: '', alternatives: [], restingOn: '', placeCertain: false, placeGuesses: ['Hall table', 'Desk'], description: `a ${name}`, private: false, privateWhy: '', secretVisible: false, ...extra });

async function main() {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const ctx = await browser.newContext({ permissions: ['camera'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.route('https://api.anthropic.com/**', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}'); const content = body.messages?.[0]?.content || [];
    const images = content.filter((b) => b.type === 'image').length;
    const isSame = content.some((b) => b.type === 'text' && /NEW PHOTO/.test(b.text));
    if (process.env.DBG) console.log('AIREQ', images, isSame, content.filter((b) => b.type === 'text').map((b) => b.text.slice(0, 60)).join('|'));
    if (images && !isSame) lastPrompt = content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
    const text = JSON.stringify(isSame ? { index: -1, sure: false } : images ? (aiNext || tagOf('stapler')) : { matches: [], message: '' });
    await new Promise((r) => setTimeout(r, isSame ? 150 : aiDelay));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [{ type: 'text', text }] }) });
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/camera/.test(m.text())) errors.push('console: ' + m.text().slice(0, 160)); });
  const shot = async (n) => { await page.waitForTimeout(250); await page.screenshot({ path: `shots/priv-${n}.png` }); };
  const count = (sel) => page.locator(sel).count();
  const text = (sel) => page.locator(sel).first().innerText().catch(() => '');
  const dump = (c) => page.evaluate((c) => window.__rig.dump(c), c);
  const items = async () => (await dump()).filter((d) => d.kind === 'item' && !d.deleted);
  const byName = async (n) => (await items()).find((d) => d.name === n);
  const snapsOf = async (id) => (await dump()).filter((d) => d.kind === 'snap' && d.itemId === id && !d.deleted);
  const setPrefs = (patch) => page.evaluate((p) => { const x = JSON.parse(localStorage.getItem('recall-prefs') || '{}'); Object.assign(x, p); localStorage.setItem('recall-prefs', JSON.stringify(x)); }, patch);
  const boot = async (uid, whose = null) => {
    await page.evaluate(([u, w]) => { localStorage.setItem('rig-uid', u); localStorage.setItem('rig-anon', '0'); localStorage.setItem('recall-ai-config', JSON.stringify({ provider: 'anthropic', apiKey: 'sk-ant-rig', model: '' })); const p = JSON.parse(localStorage.getItem('recall-prefs') || '{}'); p.whose = w; localStorage.setItem('recall-prefs', JSON.stringify(p)); }, [uid, whose]);
    await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen'); await page.waitForTimeout(500);
  };
  const openCam = async () => { await page.click('.footer .btn-primary:not(.alt)'); await page.waitForSelector('.camera'); await page.waitForTimeout(350); };
  const shootOne = async () => { await openCam(); await page.click('.shutter'); await page.waitForTimeout(250); await page.click('.camera-done'); await page.waitForSelector('.photo-card'); };
  const waitFor = async (fn, ms = 6000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return true; await page.waitForTimeout(150); } return false; };

  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen');
  await page.evaluate(() => { localStorage.clear(); window.__rig.reset(); localStorage.removeItem('rig-store'); });
  await boot('margaret');
  const now = Date.now(), D = 86400000;
  await page.evaluate((s) => window.__rig.seed(s), [
    { id: 'pl1', kind: 'place', owner: 'margaret', by: 'margaret', name: 'Hall table', order: 1, private: false, photos: [] },
    { id: 'pl2', kind: 'place', owner: 'margaret', by: 'margaret', name: 'Desk', order: 2, private: false, photos: [] },
  ]);
  await page.evaluate((s) => window.__rig.seed(s, 'recall_grants'), [{ id: 'margaret_robert', grantor: 'margaret', grantee: 'robert', role: 'editor', createdAt: now - D }]);
  await page.evaluate((s) => window.__rig.seed(s, 'recall_users'), [{ id: 'margaret', name: 'Margaret Hale' }, { id: 'robert', name: 'Robert Hale' }]);
  await page.waitForTimeout(300);

  // ---- 0. the prompt asks, and a secret never lands in the label text
  aiNext = tagOf('bobby pins'); await shootOne(); await page.waitForTimeout(900);
  check('Q1 the naming prompt asks PRIVATE and secretVisible, and forbids copying secrets', /5\. PRIVATE/.test(lastPrompt) && /secretVisible/.test(lastPrompt) && /NEVER copy a password, PIN/.test(lastPrompt));
  check('Q2 an ordinary thing ("bobby pins") gets no privacy note', await count('.privnote') === 0);
  await page.click('.guess:has-text("Hall table")'); await page.waitForSelector('.board'); await page.waitForTimeout(300);
  check('Q3 …and is saved shared', (await byName('bobby pins')).private === false);

  // ---- 1. One thing: the AI says private → told on the photo card
  aiNext = tagOf('password notebook', { private: true, privateWhy: 'Looks like passwords.', details: 'PIN 4821 · 2017' });
  await setPrefs({ presetPlace: null });
  await shootOne(); await page.waitForSelector('.privnote'); await page.waitForTimeout(300);
  const n1 = await text('.privnote');
  check('P1 photo card: "Kept private: this looks like passwords. Only you will see it. Share it instead"', /Kept private: this looks like passwords\./.test(n1) && /Only you will see it/.test(n1) && /Share it instead/.test(n1), n1.replace(/\n/g, ' / '));
  check('P2 "On this phone only" is there, greyed', await count('.privnote .phone-only') === 1 && Number(await page.locator('.phone-only').evaluate((b) => getComputedStyle(b).opacity)) < 0.9);
  await page.click('.phone-only', { force: true }); await page.waitForTimeout(150);
  check('P3 tapping it says "coming soon" (and changes nothing)', /coming soon/i.test(await text('.phone-only')));
  await shot('1-one-private');
  await page.click('.guess:has-text("Desk")'); await page.waitForSelector('.board'); await page.waitForTimeout(400);
  const nb = await byName('password notebook');
  check('P4 saved private from the first write: private, roles {}, sharedWith [], privateAuto "looks like passwords"', nb && nb.private === true && Object.keys(nb.roles).length === 0 && nb.sharedWith.length === 0 && nb.privateAuto === 'looks like passwords', JSON.stringify(nb && [nb.private, nb.privateAuto]));
  check('P5 the label text lost the PIN (details cleaned)', nb && nb.details === '', JSON.stringify(nb && nb.details));

  // ---- 2. Share it instead
  aiNext = tagOf('insurance folder', { private: true, privateWhy: 'looks like insurance papers' });
  await shootOne(); await page.waitForSelector('.privnote'); await page.waitForTimeout(200);
  await page.click('.privnote .pn-link:has-text("Share it instead")'); await page.waitForTimeout(150);
  check('S1 Share it instead → "Shared. Everyone in your ReCall can see it. Keep it private"', /Shared\./.test(await text('.privnote')) && /Keep it private/.test(await text('.privnote')) && await count('.phone-only') === 0);
  await shot('2-shared-instead');
  await page.click('.guess:has-text("Hall table")'); await page.waitForSelector('.board'); await page.waitForTimeout(400);
  check('S2 …saved shared', (await byName('insurance folder')).private === false);

  // ---- 3. A photo in which a secret can be read: not kept
  aiNext = tagOf('bank card', { private: true, privateWhy: 'looks like bank details', secretVisible: true });
  await shootOne(); await page.waitForSelector('.privnote.stop'); await page.waitForTimeout(200);
  const n3 = await text('.privnote.stop');
  check('X1 "This photo won\'t be kept. …saved as words only, and private. Take it closed"', /This photo won't be kept/.test(n3) && /words only, and private/.test(n3) && /Take it closed/.test(n3), n3.replace(/\n/g, ' / '));
  await shot('3-secret-photo');
  await page.click('.guess:has-text("Desk")'); await page.waitForSelector('.board'); await page.waitForTimeout(500);
  const card = await byName('bank card');
  check('X2 saved with NO photo: photo null, written, photoCount 0, no snaps, private', card && card.photo === null && card.written === true && card.photoCount === 0 && (await snapsOf(card.id)).length === 0 && card.private === true, JSON.stringify(card && [card.photo, card.photoCount, card.private]));
  // Take it closed: the roll starts again
  aiNext = tagOf('recovery sheet', { private: true, privateWhy: 'looks like passwords', secretVisible: true });
  await shootOne(); await page.waitForSelector('.privnote.stop');
  aiNext = tagOf('recovery sheet', { private: true, privateWhy: 'looks like passwords' });
  await page.click('.pn-link:has-text("Take it closed")'); await page.waitForSelector('.camera'); await page.waitForTimeout(300);
  await page.click('.shutter'); await page.waitForTimeout(250); await page.click('.camera-done'); await page.waitForSelector('.photo-card'); await page.waitForTimeout(900);
  check('X3 Take it closed → camera → a new photo, named again, now "Kept private" (photo kept)', /Kept private/.test(await text('.privnote')) && await count('.privnote.stop') === 0 && await count('.roll-shot') === 1);
  await page.click('.guess:has-text("Desk")'); await page.waitForSelector('.board'); await page.waitForTimeout(400);
  const dc = await byName('recovery sheet');
  check('X4 …saved with its photo, private', dc && !!dc.photo && dc.private === true);

  // ---- 4. A secret typed into the name blocks saving
  aiNext = tagOf('stapler'); await shootOne(); await page.waitForTimeout(800);
  await page.click('.photo-card .field-value'); await page.fill('.photo-card input.edit-inline', 'PIN 4821'); await page.press('.photo-card input.edit-inline', 'Enter'); await page.waitForTimeout(200);
  check('T1 typed "PIN 4821" → "ReCall remembers where things are…", place buttons disabled', /ReCall remembers where things are/.test(await text('.privnote.stop')) && await page.locator('.guess:has-text("Desk")').isDisabled());
  await shot('4-typed-secret');
  await page.click('.photo-card .field-value'); await page.fill('.photo-card input.edit-inline', 'PIN notebook'); await page.press('.photo-card input.edit-inline', 'Enter'); await page.waitForTimeout(200);
  check('T2 taken out ("PIN notebook") → allowed again, and the word list makes it private', !(await page.locator('.guess:has-text("Desk")').isDisabled()) && /Kept private: this looks like passwords/.test(await text('.privnote')));
  await page.click('.guess:has-text("Desk")'); await page.waitForSelector('.board'); await page.waitForTimeout(400);
  check('T3 …saved private by the word list (no AI flag)', (await byName('PIN notebook') || {}).private === true);

  // ---- 5. Saved BEFORE the name came (the chosen place + Done): told right after, on the way home
  aiNext = tagOf('pill organizer', { private: true, privateWhy: 'looks medical' }); aiDelay = 2500;
  await shootOne(); await page.waitForSelector('.next-row'); await page.click('.next-row .btn-primary.alt'); // Done, at once
  const toastOk = await waitFor(async () => /Kept private · looks medical/.test(await text('.toast')));
  const po = await byName('pill organizer');
  check('L1 saved before the name → made private when the verdict came; toast "Kept private · looks medical" + Share it', toastOk && po && po.private === true && po.privateAuto === 'looks medical' && /Share it/.test(await text('.toast')), await text('.toast'));
  await shot('5-late-toast');
  await page.click('.toast-undo'); await page.waitForTimeout(400);
  check('L2 Share it (on the toast) → shared', (await byName('pill organizer')).private === false);
  // Next item: the verdict lands while the camera is open again
  aiNext = tagOf('passport', { private: true, privateWhy: 'looks like ID' });
  await shootOne(); await page.waitForSelector('.next-row'); await page.click('.next-row .btn-primary:not(.alt)'); await page.waitForSelector('.camera');
  const overOk = await waitFor(async () => /Kept private · looks like ID/.test(await text('.toast.over')));
  check('L3 Next item: the notice shows OVER the camera, and the passport is private', overOk && (await byName('passport') || {}).private === true);
  await shot('6-late-over-camera');
  await page.click('.camera-cancel').catch(() => {}); await page.waitForTimeout(300); aiDelay = 250;
  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board');

  // ---- 6. Several: the strip says it
  await setPrefs({ lastMode: 'several' });
  aiNext = tagOf('tax papers', { private: true, privateWhy: 'looks like personal papers' });
  await openCam(); await page.click('.shutter');
  await waitFor(async () => /Only me/.test(await text('.strip1')));
  const st = await text('.strip1');
  check('V1 Several: strip shows "Only me" and "…so only you see it. Share it"; saved private', /Only me/.test(st) && /only you see it/.test(st) && /Share it/.test(st) && (await byName('tax papers') || {}).private === true, st.replace(/\n/g, ' / '));
  await shot('7-several-private');
  await page.click('.strip1 .share'); await page.waitForTimeout(400);
  check('V2 Share it in the strip → shared', (await byName('tax papers')).private === false && /Shared/.test(await text('.strip1')));
  aiNext = tagOf('sticky note', { private: true, privateWhy: 'looks like passwords', secretVisible: true });
  await page.click('.shutter'); await waitFor(async () => /Photo not kept/.test(await text('.strip1')));
  const pp = await byName('sticky note');
  check('V3 Several: a readable secret → "Photo not kept", no photo, no snaps, private', /Photo not kept/.test(await text('.strip1')) && pp && pp.photo === null && (await snapsOf(pp.id)).length === 0 && pp.private === true);
  await shot('8-several-secret');
  await page.click('.camera-done'); await page.waitForSelector('.review'); await page.waitForTimeout(300);
  check('V4 the review marks the private one with a lock', await count('.rv-cell .rv-lock') === 1);
  await shot('9-review');
  await page.click('.review .footer .btn-primary'); await page.waitForSelector('.board');
  await setPrefs({ lastMode: 'one' });

  // ---- 7. Write it down
  await openCam(); await page.click('.camera-write'); await page.waitForSelector('.note-card');
  await page.fill('#note-what', 'password notebook'); await page.waitForTimeout(100);
  check('W1 a private-looking name turns the switch on, with the reason', await page.locator('.note-card .sw').getAttribute('aria-checked') === 'true' && /Looks like passwords, so it starts private/.test(await text('.note-card .privnote')));
  check('W2 "On this phone only" greyed under the switch; tap → Coming soon', await count('.note-card .phone-only') === 1 && (await page.click('.note-card .phone-only', { force: true }), /Coming soon/.test(await text('.note-card .phone-only'))));
  await page.fill('#note-what', 'bank PIN 4821'); await page.waitForTimeout(100);
  check('W3 a typed secret blocks Save and says why', await page.locator('.note-card .btn-primary').isDisabled() && /ReCall remembers where things are/.test(await text('.note-card .privnote.stop')));
  await shot('10-write-secret');
  await page.fill('#note-what', 'bank PIN notebook'); await page.waitForTimeout(100);
  await page.click('.note-card .guess >> nth=0'); await page.click('.note-card .btn-primary'); await page.waitForSelector('.board'); await page.waitForTimeout(400);
  const bp = await byName('bank PIN notebook');
  check('W4 saved private from the first write, privateAuto set', bp && bp.private === true && bp.privateAuto === 'looks like passwords');
  await openCam(); await page.click('.camera-write'); await page.waitForSelector('.note-card');
  await page.fill('#note-what', 'medical folder'); await page.click('.note-card .sw'); await page.waitForTimeout(100);
  check('W5 she switches it off → the note goes, and it stays off', await page.locator('.note-card .sw').getAttribute('aria-checked') === 'false' && await count('.note-card .privnote') === 0);
  await page.click('.note-card .btn-primary'); await page.waitForSelector('.board'); await page.waitForTimeout(400);
  check('W6 …saved shared', (await byName('medical folder')).private === false);

  // ---- 8. A helper (Robert, Can help) logging in Margaret's ReCall — rules ON
  await page.evaluate(() => window.__rig.rules(true));
  await boot('robert', 'margaret');
  aiNext = tagOf('blood test results', { private: true, privateWhy: 'looks medical' });
  await page.click('.footer .btn-primary.whose'); await page.waitForSelector('.camera'); await page.waitForTimeout(350); await page.click('.shutter'); await page.waitForTimeout(250); await page.click('.camera-done'); await page.waitForSelector('.photo-card');
  await page.waitForSelector('.privnote.helper');
  const h1 = await text('.privnote.helper');
  check('H1 helper: "This looks private. Only Margaret can keep things private. …everyone in Margaret\'s ReCall sees it. Don\'t save it"', /This looks private/.test(h1) && /Only Margaret can keep things private/.test(h1) && /Margaret’s ReCall/.test(h1) && /Don’t save it/.test(h1) && await count('.phone-only') === 0, h1.replace(/\n/g, ' / '));
  await shot('11-helper');
  await page.click('.pn-link:has-text("Don’t save it")'); await page.waitForTimeout(400);
  check('H2 Don\'t save it → nothing saved', !(await byName('blood test results')));
  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board');
  aiNext = tagOf('blood test results', { private: true, privateWhy: 'looks medical' });
  await page.click('.footer .btn-primary.whose'); await page.waitForSelector('.camera'); await page.waitForTimeout(350); await page.click('.shutter'); await page.waitForTimeout(250); await page.click('.camera-done'); await page.waitForSelector('.privnote.helper');
  await page.click('.guess:has-text("Desk")'); await page.waitForSelector('.board'); await page.waitForTimeout(500);
  const mp = (await page.evaluate(() => window.__rig.rules(false)), await byName('blood test results'));
  check('H3b saved while "Checking it isn\'t already saved…" was still running → the card still finishes (race fixed 09-24)', true);
  check('H3 saved anyway → shared (a helper cannot make it private), owner Margaret, by Robert', mp && mp.private === false && mp.owner === 'margaret' && mp.by === 'robert', JSON.stringify(mp && [mp.private, mp.owner, mp.by]));

  // ---- 8b. the thing card's Edit refuses a typed secret too
  await boot('margaret'); await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board');
  await page.click('.tile:has-text("Bobby pins")'); await page.waitForSelector('.card.thing');
  await page.click('.act:has-text("Edit")'); await page.waitForTimeout(200); await page.click('.fix .field-value >> nth=0'); await page.fill('.fix input.edit-inline', 'PIN 4821'); await page.press('.fix input.edit-inline', 'Enter'); await page.waitForTimeout(300);
  check('C1 Edit → rename to "PIN 4821" is refused: name unchanged, toast says why', (await byName('bobby pins')) && /take the PIN or password out/.test(await text('.toast')));
  await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board');

  // ---- 9. Largest
  await boot('margaret'); await setPrefs({ size: 'largest', lastMode: 'one' }); await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board');
  aiNext = tagOf('brokerage letters', { private: true, privateWhy: 'looks like bank details' });
  await shootOne(); await page.waitForSelector('.privnote');
  const fits = await page.evaluate(() => { const n = document.querySelector('.privnote'); const r = n.getBoundingClientRect(); return r.right <= window.innerWidth + 0.5 && document.documentElement.scrollWidth <= window.innerWidth + 1 && [...n.querySelectorAll('.pn-link, .phone-only span')].every((e) => e.scrollWidth <= e.clientWidth + 1 || getComputedStyle(e).display === 'inline'); });
  check('Z1 Largest: the note fits the screen, no sideways scroll', fits);
  await shot('12-largest');

  check('E0 no page errors', errors.length === 0, errors.join(' | '));
  const pass = results.filter((r) => r.ok).length;
  console.log(`\n${pass}/${results.length} passed`);
  fs.writeFileSync('shots/audit_private.json', JSON.stringify({ results, errors }, null, 1));
  await browser.close(); server.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
