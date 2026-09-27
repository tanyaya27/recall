// S11 — every screen, every button (Ravi 09-27: "go deep into every possible click path and look at every button
// and pixel"). Build 20260927c in the rig, Ravi's dark theme (Dusk), trail look (B), camera B, and data shaped like
// his phone's (the pencil that ended up holding the filing cabinet that holds the passport; photos cut from his
// screenshots). For each STATE: a screenshot, every visible tappable element (numbered), and for each one: tap it
// from a fresh copy of that state and screenshot where it lands. Nothing in the app changes.
// node crawl_s11.js [stateId…] → shots/s11/<state>.png, <state>__<n>.png, crawl.json
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const PORT = 8111; const ROOT = path.join(__dirname, 'out');
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, req.url.split('?')[0] === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
const img = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(__dirname, 'mock/img', f)).toString('base64');
const OUT = 'shots/s11'; fs.mkdirSync(OUT, { recursive: true });
const SEL = 'button, [role="button"], a[href], label.btn-primary, input:not([type=hidden]), .tile';
let WHERE = [];

(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream'] });
  const ctx = await browser.newContext({ permissions: ['camera'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'dark' });
  await ctx.addInitScript(() => {
    const c = document.createElement('canvas'); c.width = 960; c.height = 1280; const g = c.getContext('2d');
    const im = new Image(); let src = '';
    const paint = () => { if (window.__cam && window.__cam !== src) { src = window.__cam; im.src = src; }
      g.fillStyle = '#222'; g.fillRect(0, 0, c.width, c.height);
      if (im.complete && im.naturalWidth) { const s = Math.max(c.width / im.naturalWidth, c.height / im.naturalHeight); const w = im.naturalWidth * s, h = im.naturalHeight * s; g.drawImage(im, (c.width - w) / 2, (c.height - h) / 2, w, h); } };
    setInterval(paint, 60);
    const md = navigator.mediaDevices || {}; Object.defineProperty(navigator, 'mediaDevices', { value: md, configurable: true });
    md.getUserMedia = async () => { paint(); return c.captureStream(15); };
  });
  let shotN = 0;
  await ctx.route('https://api.anthropic.com/**', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}'); const t = JSON.stringify(body.messages || []);
    const out = /MOVES:/.test(t) ? (WHERE.shift() || { name: 'desk surface', moves: false, index: 0, sure: false })
      : /NEW PHOTO/.test(t) ? { index: 0, sure: false }
      : /"image"/.test(t) ? { name: 'spoon', sameAs: '', alternatives: [], restingOn: 'white desk surface', placeCertain: false, placeGuesses: [], description: '', details: '', private: false, secretVisible: false }
      : { matches: [], message: '' };
    await new Promise((r) => setTimeout(r, 200));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [{ type: 'text', text: JSON.stringify(out) }] }) });
  });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));

  // ---- Ravi's household, as on his phone at 12:30–1:10 (09-27)
  const now = Date.now(), H = 3600e3;
  const P = (f) => ({ photo: img(f), thumb: img(f), thumbV: 2 });
  const T = (id, name, location, f, ago, extra = {}) => ({ id, kind: 'item', owner: 'rv', by: 'rv', private: false, roles: {}, sharedWith: [], name, location,
    ...(f ? P(f) : { photo: null, thumb: null, written: true }), order: now - ago, createdAt: now - ago, lastSeenAt: now - ago, logId: 'l_' + id, photoCount: f ? 1 : 0, history: [{ location, at: now - ago }], ...extra });
  const E = (id, from, to, ago) => ({ id, kind: 'edge', rel: 'in', from, to, since: now - ago, until: null, how: 'chosen', owner: 'rv', by: 'rv', private: false, roles: {}, sharedWith: [] });
  const PL = (id, name, f) => ({ id, kind: 'place', owner: 'rv', by: 'rv', private: false, name, order: 1, createdAt: now - 99 * H, parent: null, photos: f ? [{ photo: img(f), thumb: img(f), at: now }] : [] });
  const SEED = [
    T('pen', 'Pencil', '', 'real_pencil.jpg', 9 * H, { needsPlace: true, restingOn: 'Cream-colored knitted blanket or sweater' }),
    T('cab', 'Filling cabinet', 'Pencil', null, 8 * H), T('pass', 'US Passport', 'Filling cabinet', 'real_passport.jpg', 8 * H),
    T('paint', 'Painting in progress', 'Desk', 'real_painting.jpg', 7 * H), T('ceta', 'Cetaphil cream', 'Bathroom shelf', 'real_cetaphil.jpg', 6 * H),
    T('slip', 'Slippers', 'Under the desk', 'real_slippers.jpg', 5 * H),
    T('tin', 'Blue tin', 'Linen closet shelf', 'tin.jpg', 4 * H), T('key', 'Bank locker key', 'Blue tin', 'keys.jpg', 4 * H, { private: true }),
    E('e1', 'pass', { t: 'thing', id: 'cab', name: 'Filling cabinet' }, 8 * H), E('e2', 'cab', { t: 'thing', id: 'pen', name: 'Pencil' }, 7.5 * H),
    E('e3', 'paint', { t: 'place', name: 'Desk' }, 7 * H), E('e4', 'ceta', { t: 'place', name: 'Bathroom shelf' }, 6 * H), E('e5', 'slip', { t: 'place', name: 'Under the desk' }, 5 * H),
    E('e6', 'tin', { t: 'place', name: 'Linen closet shelf' }, 4 * H), E('e7', 'key', { t: 'thing', id: 'tin', name: 'Blue tin' }, 4 * H),
    PL('pl1', 'Linen closet shelf', 'closet.jpg'), PL('pl2', 'Desk', null), PL('pl3', 'Bathroom shelf', null),
  ];
  const fresh = async () => {
    await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen');
    await page.evaluate(() => { localStorage.clear(); window.__rig.reset(); localStorage.setItem('rig-uid', 'rv'); localStorage.setItem('rig-anon', '0');
      localStorage.setItem('recall-ai-config', JSON.stringify({ provider: 'anthropic', apiKey: 'sk-ant-rig', model: '' }));
      localStorage.setItem('recall-prefs', JSON.stringify({ theme: 'dusk', exp: { homeInside: 'b' }, cameraLook: 'b', showTimes: false })); });
    await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen');
    await page.evaluate((s) => window.__rig.seed(s), SEED);
    await page.evaluate(() => window.__rig.seed([{ id: 'rv', name: 'Ravi' }], 'recall_users'));
    await page.waitForSelector('.board'); await page.waitForTimeout(500);
  };
  const click = async (sel, wait = 600) => { await page.locator(sel).first().click({ timeout: 5000 }); await page.waitForTimeout(wait); };
  const hold = async (sel) => { const b = await page.locator(sel).first().boundingBox(); await page.mouse.move(b.x + 40, b.y + 40); await page.mouse.down(); await page.waitForTimeout(700); await page.mouse.up(); await page.waitForTimeout(400); };
  const cam = async (f) => { await page.evaluate((s) => { window.__cam = s; }, img(f)); await page.waitForTimeout(200); };
  const cardOpen = async () => { if (!(await page.locator('.fix .field-value[aria-label^="Where it is"]').isVisible().catch(() => false))) await click('.act:has-text("Edit")', 400); };

  // ---- the states (each reached from a fresh Home by the taps a person would make)
  const STATES = {
    home: async () => {},
    home_hold_thing: async () => { await hold('.tile:has-text("Cetaphil")'); },
    home_hold_pencil: async () => { await hold('.tile:has-text("Pencil")'); },
    inside_pencil: async () => { await click('.tile:has-text("Pencil")'); },
    inside_cabinet: async () => { await click('.tile:has-text("Pencil")'); await click('.tile:has-text("Filling cabinet")'); },
    cabinet_card: async () => { await click('.tile:has-text("Pencil")'); await click('.tile:has-text("Filling cabinet")'); await click('.link-btn:has-text("About this box"), .ctx-banner'); },
    pencil_card: async () => { await click('.tile:has-text("Pencil")'); await click('.link-btn:has-text("About this box"), .ctx-banner'); },
    pencil_edit: async () => { await click('.tile:has-text("Pencil")'); await click('.link-btn:has-text("About this box"), .ctx-banner'); await cardOpen(); await page.locator('.fix').scrollIntoViewIfNeeded(); await page.waitForTimeout(300); },
    pencil_where: async () => { await click('.tile:has-text("Pencil")'); await click('.link-btn:has-text("About this box"), .ctx-banner'); await cardOpen(); await click('.fix .field-value[aria-label^="Where it is"]'); },
    pencil_where_in: async () => { await click('.tile:has-text("Pencil")'); await click('.link-btn:has-text("About this box"), .ctx-banner'); await cardOpen(); await click('.fix .field-value[aria-label^="Where it is"]'); await click('.place-sheet .path.in'); await page.locator('.it-search input').blur(); await page.waitForTimeout(300); },
    // Before the damage the pencil held nothing, so its Edit row offered "Put things in" — Ravi's path. Same row on any plain thing:
    ceta_putin: async () => { await click('.tile:has-text("Cetaphil")'); await cardOpen(); await click('.fix-row .btn-quiet:has-text("Put things in")'); },
    inside_putin: async () => { await click('.tile:has-text("Pencil")'); await click('.footer .btn-primary.alt:has-text("Put in")'); },
    tin_inside: async () => { await click('.tile:has-text("Blue tin")'); },
    key_card: async () => { await click('.tile:has-text("Blue tin")'); await click('.tile:has-text("Bank locker key")'); },
    ceta_card: async () => { await click('.tile:has-text("Cetaphil")'); },
    ceta_edit: async () => { await click('.tile:has-text("Cetaphil")'); await cardOpen(); await page.locator('.fix').scrollIntoViewIfNeeded(); await page.waitForTimeout(300); },
    notput_where: async () => { await click('.notput'); },
    notput_pick: async () => { await click('.notput'); await click('.place-sheet .guess >> nth=0'); },
    find: async () => { await click('.footer .btn-primary.alt'); },
    find_typed: async () => { await click('.footer .btn-primary.alt'); await page.fill('.ask input', 'passport'); await page.locator('.ask input').blur(); await page.waitForTimeout(500); },
    settings: async () => { await click('.tiny:has-text("Settings")'); },
    menu: async () => { await click('.menu-btn'); },
    cam1: async () => { await cam('real_spoon.jpg'); await click('.footer .btn-primary:not(.alt)', 900); },
    cam2: async () => { await cam('real_spoon.jpg'); await click('.footer .btn-primary:not(.alt)', 900); await click('.lc-shutter', 1500); },
    cam3: async () => { WHERE = [{ name: 'desk surface', moves: false }]; await cam('real_spoon.jpg'); await click('.footer .btn-primary:not(.alt)', 900); await click('.lc-shutter', 1500); await cam('real_desk.jpg'); await click('.lc-shutter', 1800); },
    cam_more: async () => { await cam('real_spoon.jpg'); await click('.footer .btn-primary:not(.alt)', 900); await click('.lc-shutter', 1500); await click('.lc-chip.more'); },
    note: async () => { await click('.footer .btn-primary:not(.alt)', 900); await click('.lc-typeit button'); },
    saved: async () => { await cam('real_spoon.jpg'); await click('.footer .btn-primary:not(.alt)', 900); await click('.lc-shutter', 1500); await click('.lc-k.sv', 1500); },
  };
  const only = process.argv.slice(2);
  const ids = Object.keys(STATES).filter((k) => !only.length || only.includes(k));
  const out = fs.existsSync(`${OUT}/crawl.json`) ? JSON.parse(fs.readFileSync(`${OUT}/crawl.json`)) : {};
  const where = async () => page.evaluate(() => {
    const q = (s) => { const e = [...document.querySelectorAll(s)].filter((x) => x.getBoundingClientRect().height > 0).pop(); return e ? e.innerText.trim().replace(/\s+/g, ' ').slice(0, 50) : ''; };
    if (document.querySelector('.lc')) return 'Camera · ' + q('.lc-prompt b') + (q('.lc .sheet-title') ? ' · sheet: ' + q('.lc .sheet-title') : '');
    const sh = q('.sheet-title'); const base = q('.thing-head .name') ? 'Card: ' + q('.thing-head .name') : q('.trail .c.here') ? 'Inside: ' + q('.trail .c.here') : q('.ctx-head .t') ? 'Inside: ' + q('.ctx-head .t') : q('.header .title') ? 'Screen: ' + q('.header .title') : document.querySelector('.settings') ? 'Settings' : document.querySelector('.board') ? 'Home' : q('h1, h2') || '?';
    return base + (sh ? ' · sheet: ' + sh : '') + (document.querySelector('.menu-drawer.open, .drawer.open') ? ' · menu' : '');
  });
  const buttons = async () => page.evaluate((SEL) => [...document.querySelectorAll(SEL)].map((el, i) => {
    const r = el.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const vis = r.width > 2 && r.height > 2 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth && getComputedStyle(el).visibility !== 'hidden';
    const topEl = vis ? document.elementFromPoint(Math.min(Math.max(cx, 1), innerWidth - 1), Math.min(Math.max(cy, 1), innerHeight - 1)) : null;
    return { i, vis: vis && !!topEl && (el === topEl || el.contains(topEl)), text: ((el.innerText || '').trim() || el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.tagName).replace(/\s+/g, ' ').slice(0, 44),
      dis: !!el.disabled || el.getAttribute('aria-disabled') === 'true', x: r.left, y: r.top, w: r.width, h: r.height, tag: el.tagName.toLowerCase() };
  }).filter((b) => b.vis), SEL);

  for (const id of ids) {
    if (out[id] && !only.length) { console.log('skip', id); continue; }
    await fresh(); try { await STATES[id](); } catch (e) { console.log('STATE FAILED', id, String(e.message).split('\n')[0]); continue; }
    await page.screenshot({ path: `${OUT}/${id}.png` });
    const here = await where(); const bs = await buttons();
    const rec = { id, here, buttons: [] };
    console.log(`\n== ${id}: ${here} · ${bs.length} tappable`);
    for (let k = 0; k < bs.length; k++) {
      const b = bs[k]; let dest = '', err = '';
      try {
        await fresh(); await STATES[id]();
        if (b.tag === 'input') { await page.locator(SEL).nth(b.i).click({ timeout: 3000 }); }
        else await page.locator(SEL).nth(b.i).click({ timeout: 3000 });
        await page.waitForTimeout(900);
        dest = await where();
        await page.screenshot({ path: `${OUT}/${id}__${k + 1}.png` });
      } catch (e) { err = String(e.message || e).split('\n')[0].slice(0, 80); }
      rec.buttons.push({ n: k + 1, ...b, dest, err });
      console.log(`  ${k + 1}. [${b.text}]${b.dis ? ' (disabled)' : ''} → ${dest || 'ERR ' + err}`);
    }
    out[id] = rec; fs.writeFileSync(`${OUT}/crawl.json`, JSON.stringify(out, null, 1));
  }
  console.log('\npage errors:', errors.length ? [...new Set(errors)].slice(0, 5) : 'none');
  await browser.close(); server.close();
})();
