  // 09-30d mockups for Ravi & Tanya — the tier question (BOARD_2026-09-30_tiers-or-freeform.md). Real screens, real styles,
  // Ravi's own chain; B is build d as built; A, C, D are drawn on top of the real screens (only the block in question).
  async function runSuite() {
    const OUT = path.join(__dirname, 'shots_chip'); fs.mkdirSync(OUT, { recursive: true });
    const snap = async (f) => { await page.waitForTimeout(400); await page.screenshot({ path: path.join(OUT, f) }); console.log('  [shot]', f); };
    const inject = (fn, arg) => page.evaluate(fn, arg);
    const openThing = async (nm) => { await home(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', nm); await page.waitForTimeout(350); await page.click('.ask .tile >> nth=0'); await page.waitForSelector('.card.thing'); await page.waitForTimeout(500); };
    const move = async () => { await openThing('3D model of plant sensor'); await tap('button:has-text("Move it")', { wait: 900 }); };
    const now = Date.now();
    await page.evaluate(([a, b, c, d, t]) => { const H = 3600e3; const P = (id, nm, im, ago) => ({ id, kind: 'place', owner: 'margaret', by: 'margaret', private: false, name: nm, order: t - ago, createdAt: t - ago, parent: null, photos: [{ photo: im, thumb: im, at: t - ago }] });
      const E = (id, from, to, ago) => ({ id, kind: 'edge', rel: 'in', from, to, since: t - ago, until: null, how: 'chosen', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [] });
      window.__rig.seed([
        P('pl7', 'White cardboard box', a, 93 * H), P('pik', 'Ikea shelving unit', b, 92 * H), P('plr', 'Living room', c, 91 * H),
        { id: 'ps', kind: 'item', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [], name: '3D model of plant sensor', location: 'White cardboard box', photo: d, thumb: d, thumbV: 2,
          order: t, createdAt: t - 50 * H, lastSeenAt: t, seenAt: t - 50 * H, logId: 'l_ps', photoCount: 1, history: [{ location: 'White cardboard box', at: t - 50 * H }] },
        { id: 'sps', kind: 'snap', owner: 'margaret', by: 'margaret', itemId: 'ps', logId: 'l_ps', photo: d, thumb: d, location: 'White cardboard box', at: t - 50 * H, caption: '' },
        E('eps', 'ps', { t: 'place', name: 'White cardboard box' }, 50 * H), E('e7', 'pl7', { t: 'place', name: 'Ikea shelving unit' }, 92 * H), E('eik', 'pik', { t: 'place', name: 'Living room' }, 91 * H)]); },
    [img('box.jpg'), img('closet.jpg'), img('real_desk.jpg'), img('real_cetaphil.jpg'), now]);
    const pics = { glove: img('tooldrawer.jpg'), tesla: img('real_painting.jpg'), street: img('real_slippers.jpg') };

    // ===== Ravi 09-30: shutter annotation — a chip on the ring for a remembered choice; a fly-in after each shot =====
    await page.addInitScript(() => { window.__noAuto = true; });
    const wcbT = img('box.jpg'), shotT = img('real_painting.jpg');
    const chip = (html) => page.evaluate((h) => { const sh = document.querySelector('.lc-shutter'); const r = sh.getBoundingClientRect(); document.querySelectorAll('.mock-chip').forEach((x) => x.remove());
      const c = document.createElement('div'); c.className = 'mock-chip'; c.innerHTML = h;
      c.style.cssText = `position:fixed;left:${r.left + r.width / 2}px;top:${r.top - 6}px;transform:translate(-50%,-50%);z-index:50;display:flex;align-items:center;gap:4px;padding:3px 8px 3px 6px;border-radius:999px;background:#1F1D1A;border:2px solid #F5B942;color:#fff;font:800 13px system-ui;box-shadow:0 2px 8px rgba(0,0,0,.5)`;
      document.body.appendChild(c); }, html);
    // default: the next shot will ask — no chip
    await move(); await snap('R0-default-no-chip.png');
    // sticky: "Another photo of the White cardboard box" chosen
    await cam('box.jpg'); await tap('.lc-shutter', { wait: 500 }); await tap('.photo-for .pf-same', { wait: 500 });
    await chip(`<span style="font-size:15px">+</span><img src="${wcbT}" style="width:22px;height:22px;border-radius:6px;object-fit:cover">`);
    await snap('R1-chip-more-photos.png');
    // fly-in: the photo on its way to the square, the square counting +1
    await page.evaluate((src) => { const sh = document.querySelector('.lc-shutter').getBoundingClientRect(); const sq = document.querySelector('.lv-strip .lv-sq').getBoundingClientRect();
      const mk = (x, y, w, o) => { const i = document.createElement('img'); i.src = src; i.className = 'mock-fly'; i.style.cssText = `position:fixed;left:${x - w / 2}px;top:${y - w / 2}px;width:${w}px;height:${w}px;object-fit:cover;border-radius:12px;border:3px solid #F5B942;z-index:60;opacity:${o};box-shadow:0 4px 14px rgba(0,0,0,.5)`; document.body.appendChild(i); };
      const x0 = sh.left + sh.width / 2, y0 = sh.top + sh.height / 2, x1 = sq.left + sq.width / 2, y1 = sq.top + sq.height / 2;
      mk(x0 + (x1 - x0) * 0.25, y0 + (y1 - y0) * 0.25, 70, 0.35); mk(x0 + (x1 - x0) * 0.6, y0 + (y1 - y0) * 0.6, 50, 0.7);
      const b = document.createElement('span'); b.textContent = '+1'; b.style.cssText = `position:fixed;left:${sq.right - 14}px;top:${sq.top - 12}px;z-index:61;background:#F5B942;color:#1F1D1A;font:900 14px system-ui;border-radius:999px;padding:2px 7px;box-shadow:0 0 0 4px rgba(245,185,66,.35)`; document.body.appendChild(b);
      const a = document.createElement('div'); a.style.cssText = `position:fixed;left:${x0}px;top:${y0}px;width:${Math.hypot(x1 - x0, y1 - y0)}px;border-top:2px dashed rgba(245,185,66,.6);transform-origin:0 0;transform:rotate(${Math.atan2(y1 - y0, x1 - x0)}rad);z-index:55`; document.body.appendChild(a); }, wcbT);
    await snap('R2-fly-in.png');
    await page.evaluate(() => document.querySelectorAll('.mock-fly, .mock-chip').forEach((x) => x.remove()));
    await page.evaluate(() => [...document.querySelectorAll('span')].filter((x) => x.textContent === '+1').forEach((x) => x.remove()));
    await tap('.lc-x', { wait: 400 }); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 400 });
    // armed for a new place: Choose place → "Photograph a new place"
    await move(); await tap('.lc-choose', { wait: 500 }); await tap('.where-list .wl-new', { wait: 400 });
    await chip('<span style="color:#8CC4B2;letter-spacing:.06em">NEW</span>');
    await snap('R3-chip-new-place.png');
  }
  await seedHouse();
  try { await runSuite(); } catch (e) { console.error('FATAL', e); }
  await browser.close();
}
(async () => { await new Promise((r) => server.listen(PORT, r)); await runLook('b'); server.close(); })();
