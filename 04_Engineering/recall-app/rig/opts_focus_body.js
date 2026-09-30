  // 09-30d mockups for Ravi & Tanya — the tier question (BOARD_2026-09-30_tiers-or-freeform.md). Real screens, real styles,
  // Ravi's own chain; B is build d as built; A, C, D are drawn on top of the real screens (only the block in question).
  async function runSuite() {
    const OUT = path.join(__dirname, 'shots_focus'); fs.mkdirSync(OUT, { recursive: true });
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

    // ---- Ravi 09-30 (phone): colour the Choose place button like the tier it changes; colour only the tier in focus ----
    const PROPOSAL = `.lc-choose.fx { border-color: var(--fx) !important; color: var(--fx) !important; } .lc-choose.fx svg { color: var(--fx); }
      .lc-chainline .cp > span:not(.lc-in):not(.sel) { color: #F4EFE6 !important; } .lc-chainline .cp > span.soft:not(.sel) { color: #BDB6AB !important; }
      .wl-chg-ch .cp > span:not(.lc-in):not(.sel) { color: #F4EFE6 !important; } .wl-chg-ch .cp > span.soft:not(.sel) { color: #BDB6AB !important; }`;
    const fx = () => page.evaluate((css) => { const c = document.querySelector('.lc-chainline .sel'); const col = c ? getComputedStyle(c).color : '#fff';
      const b = document.querySelector('.lc-choose'); if (b) { b.classList.add('fx'); b.style.setProperty('--fx', col); }
      if (!document.getElementById('fxcss')) { const st = document.createElement('style'); st.id = 'fxcss'; st.textContent = css; document.head.appendChild(st); } }, PROPOSAL);
    for (const [n, lab] of [[0, 'L1'], [1, 'L2']]) {
      await move(); if (n > 0) { await page.locator('.lv-strip .lv-sq').nth(n).click(); await page.waitForTimeout(400); }
      await snap(`F-${lab}-now.png`); await fx(); await snap(`F-${lab}-proposal.png`);
      if (n === 1) { await tap('.lc-choose', { wait: 600 }); await snap('F-sheet-proposal.png'); await page.evaluate(() => { const s = document.getElementById('fxcss'); if (s) s.remove(); }); await snap('F-sheet-now.png'); await tap('.where-list .btn-quiet', { wait: 300 }); }
      await tap('.lc-x', { wait: 400 }); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 400 });
    }
  }
  await seedHouse();
  try { await runSuite(); } catch (e) { console.error('FATAL', e); }
  await browser.close();
}
(async () => { await new Promise((r) => server.listen(PORT, r)); await runLook('b'); server.close(); })();
