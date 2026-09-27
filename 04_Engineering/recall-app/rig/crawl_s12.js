// S12 — the same crawl as S11, on BUILD 2 (09-27): every screen, every button, tapped from a fresh copy of that
// screen, in Ravi's Dusk AND in Linen, with data shaped like his phone (the pencil that held the filing cabinet that
// holds the passport — the app takes the cabinet out of the pencil once, when it opens: Ravi 09-27).
// THEME=dusk|linen node crawl_s12.js [stateId…] → shots/s12crawl-<theme>/<state>.png, <state>__<n>.png, crawl.json
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const THEME = process.env.THEME || 'dusk'; const PORT = THEME === 'dusk' ? 8131 : 8132; const ROOT = path.join(__dirname, 'out');
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, req.url.split('?')[0] === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
const img = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(__dirname, 'mock/img', f)).toString('base64');
const OUT = `shots/s12crawl-${THEME}`; fs.mkdirSync(OUT, { recursive: true });
const SEL = 'button, [role="button"], a[href], label.btn-primary, input:not([type=hidden]), .tile';
let WHERE = [];

(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream'] });
  const ctx = await browser.newContext({ permissions: ['camera'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: THEME === 'dusk' ? 'dark' : 'light' });
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
    await page.evaluate((THEME) => { localStorage.clear(); window.__rig.reset(); localStorage.setItem('rig-uid', 'rv'); localStorage.setItem('rig-anon', '0');
      localStorage.setItem('recall-ai-config', JSON.stringify({ provider: 'anthropic', apiKey: 'sk-ant-rig', model: '' }));
      localStorage.setItem('recall-prefs', JSON.stringify({ theme: THEME, cameraLook: 'b', showTimes: false })); }, THEME);
    await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen');
    await page.evaluate((s) => window.__rig.seed(s), SEED);
    await page.evaluate(() => window.__rig.seed([{ id: 'rv', name: 'Ravi' }], 'recall_users'));
    await page.waitForSelector('.board'); await page.waitForTimeout(500);
  };
  const click = async (sel, wait = 600) => { await page.locator(sel).first().click({ timeout: 5000 }); await page.waitForTimeout(wait); };
  const hold = async (sel) => { const b = await page.locator(sel).first().boundingBox(); await page.mouse.move(b.x + 40, b.y + 40); await page.mouse.down(); await page.waitForTimeout(700); await page.mouse.up(); await page.waitForTimeout(400); };
  const cam = async (f) => { await page.evaluate((s) => { window.__cam = s; }, img(f)); await page.waitForTimeout(200); };
  const page2 = async (n) => { await click(`.tile:has-text("${n}")`, 700); };
  const inGrid = async (n) => { await click(`.tp-grid button:has-text("${n}")`, 700); };

  // ---- the states (each reached from a fresh Home by the taps a person would make)
  const STATES = {
    home: async () => {},
    home_hold_thing: async () => { await hold('.tile:has-text("Cetaphil")'); },
    home_hold_tin: async () => { await hold('.tile:has-text("Blue tin")'); },
    pencil_page: async () => { await page2('Pencil'); },
    pencil_page_more: async () => { await page2('Pencil'); await page.mouse.wheel(0, 900); await page.waitForTimeout(400); },
    cabinet_page: async () => { await click('.notput'); await click('.np-row:has-text("Filling cabinet")', 700); },
    cabinet_move: async () => { await click('.notput'); await click('.np-row:has-text("Filling cabinet")', 700); await click('.tp-btn:has-text("Put it somewhere")', 900); },
    cabinet_move_more: async () => { await click('.notput'); await click('.np-row:has-text("Filling cabinet")', 700); await click('.tp-btn:has-text("Put it somewhere")', 900); await click('.lc-chip.more'); },
    ceta_page: async () => { await page2('Cetaphil'); },
    ceta_rename: async () => { await page2('Cetaphil'); await click('.tp-row:has-text("Rename")'); },
    ceta_hold_photo: async () => { await page2('Cetaphil'); await hold('.card.thing img'); },
    tin_page: async () => { await page2('Blue tin'); },
    tin_page_more: async () => { await page2('Blue tin'); await page.mouse.wheel(0, 900); await page.waitForTimeout(400); },
    tin_putin: async () => { await page2('Blue tin'); await click('.tp-btn:has-text("Put things in")'); },
    tin_log_into: async () => { await page2('Blue tin'); await cam('real_spoon.jpg'); await click('.tp-btn:has-text("Log something in")', 900); },
    key_page: async () => { await page2('Blue tin'); await inGrid('Bank locker key'); },
    notput: async () => { await click('.notput'); },
    find: async () => { await click('.footer .btn-primary.alt'); },
    find_typed: async () => { await click('.footer .btn-primary.alt'); await page.fill('.ask input', 'passport'); await page.locator('.ask input').blur(); await page.waitForTimeout(500); },
    settings: async () => { await click('.tiny:has-text("Settings")'); },
    menu: async () => { await click('.menu-btn'); },
    cam1: async () => { await cam('real_spoon.jpg'); await click('.footer .btn-primary:not(.alt)', 900); },
    cam2: async () => { await cam('real_spoon.jpg'); await click('.footer .btn-primary:not(.alt)', 900); await click('.lc-shutter', 1500); },
    cam3_second: async () => { await cam('real_spoon.jpg'); await click('.footer .btn-primary:not(.alt)', 900); await click('.lc-shutter', 1500); await cam('real_desk.jpg'); await click('.lc-shutter', 1200); },
    cam4_plus: async () => { await cam('real_spoon.jpg'); await click('.footer .btn-primary:not(.alt)', 900); await click('.lc-shutter', 1500); await click('.lv-sq.plus', 400); },
    cam5_tin: async () => { WHERE = [{ name: 'blue tin', moves: true }]; await cam('real_spoon.jpg'); await click('.footer .btn-primary:not(.alt)', 900); await click('.lc-shutter', 1500); await click('.lv-sq.plus', 400); await cam('tin.jpg'); await click('.lc-shutter', 1800); },
    cam_preview: async () => { await cam('real_spoon.jpg'); await click('.footer .btn-primary:not(.alt)', 900); await click('.lc-shutter', 1500); await cam('real_desk.jpg'); await click('.lc-shutter', 1200); await click('.lv-sq >> nth=0', 600); },
    cam_more: async () => { await cam('real_spoon.jpg'); await click('.footer .btn-primary:not(.alt)', 900); await click('.lc-shutter', 1500); await click('.lc-chip.more'); },
    note: async () => { await click('.footer .btn-primary:not(.alt)', 900); await click('.lc-typeit button'); },
    note_where: async () => { await click('.footer .btn-primary:not(.alt)', 900); await click('.lc-typeit button'); await click('.note-card .path.in'); },
    saved: async () => { await cam('real_spoon.jpg'); await click('.footer .btn-primary:not(.alt)', 900); await click('.lc-shutter', 1500); await click('.lc-k.sv', 1500); },
  };
  const only = process.argv.slice(2);
  const ids = Object.keys(STATES).filter((k) => !only.length || only.includes(k));
  const out = fs.existsSync(`${OUT}/crawl.json`) ? JSON.parse(fs.readFileSync(`${OUT}/crawl.json`)) : {};
  const where = async () => page.evaluate(() => {
    const q = (s) => { const e = [...document.querySelectorAll(s)].filter((x) => x.getBoundingClientRect().height > 0).pop(); return e ? e.innerText.trim().replace(/\s+/g, ' ').slice(0, 50) : ''; };
    if (document.querySelector('.lc')) return 'Camera · ' + q('.lc-prompt b') + (q('.lc .sheet-title') ? ' · sheet: ' + q('.lc .sheet-title') : '') + (document.querySelector('.lc-pv') ? ' · preview: ' + q('.lc-pv b') : '');
    const sh = q('.sheet-title'); const base = q('.thing-head .name') ? 'Page: ' + q('.thing-head .name') : q('.header .title') ? 'Screen: ' + q('.header .title') : document.querySelector('.settings') ? 'Settings' : document.querySelector('.board') ? 'Home' : q('h1') || '?';
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
