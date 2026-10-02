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

    await page.addInitScript(() => { window.__noAuto = true; });
    const OUT2 = path.join(__dirname, 'shots_sd');
    const S = async (f) => { await page.waitForTimeout(450); await page.screenshot({ path: path.join(OUT2, f) }); console.log('  [shot]', f); };
    const rects = async (tag) => console.log(tag, JSON.stringify(await page.evaluate(() => { const o = {}; for (const s of ['.lc-shutter', '.lc-bot', '.lc-prompt', '.lv-strip', '.lv-strip .lv-sq', '.lc-row', '.photo-for', '.pf-same', '.pf-other', '.where-list .wl-new', '.lc-view', '.lc-k.sn', '.lc-k.sv']) { const e = document.querySelector(s); if (e) { const r = e.getBoundingClientRect(); o[s] = [r.x, r.y, r.width, r.height].map(Math.round); } } return o; })));
    await move(); await S('p0-a.png'); await rects('A');
    console.log(await page.evaluate(() => document.querySelector('.lc-bot')?.outerHTML.slice(0, 3000)));
    await cam('box.jpg'); await tap('.lc-shutter', { wait: 600 }); await S('p1-modal.png'); await rects('M');
    console.log(await page.evaluate(() => document.querySelector('.photo-for')?.outerHTML.slice(0, 4000)));
    await tap('.photo-for .pf-same', { wait: 600 }); await S('p2-b.png'); await rects('B');
    await tap('.lc-shutter', { wait: 700 }); await S('p2-b-after.png');
    await cam('real_painting.jpg'); await S('p2-b-bright.png');
    await tap('.lc-x', { wait: 400 }); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 400 });
    await move(); await tap('.lc-choose', { wait: 600 }); await S('p3-choose.png'); await rects('C');
    console.log(await page.evaluate(() => document.querySelector('.where-list .wl-new')?.outerHTML.slice(0, 1500)));
    await tap('.where-list .wl-new', { wait: 500 }); await S('p4-c.png'); await rects('N');
  }
  await seedHouse();
  try { await runSuite(); } catch (e) { console.error('FATAL', e); }
  await browser.close();
}
(async () => { await new Promise((r) => server.listen(PORT, r)); await runLook('b'); server.close(); })();
