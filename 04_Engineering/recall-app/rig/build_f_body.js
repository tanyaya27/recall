  // 09-30d mockups for Ravi & Tanya — the tier question (BOARD_2026-09-30_tiers-or-freeform.md). Real screens, real styles,
  // Ravi's own chain; B is build d as built; A, C, D are drawn on top of the real screens (only the block in question).
  async function runSuite() {
    const OUT = path.join(__dirname, 'shots_f'); fs.mkdirSync(OUT, { recursive: true });
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

    // ===== build 20260930f, as built (no mock layer) =====
    await page.addInitScript(() => { window.__noAuto = true; });
    await move(); await snap('F0-move-it-opens.png');
    WHERE.length = 0; WHERE.push({ name: 'white box', moves: false }); await cam('box.jpg'); await tap('.lc-shutter', { wait: 600 }); await snap('F1-this-photo-is.png');
    await tap('.photo-for .pf-same', { wait: 500 }); await snap('F2-more-photos-shutter.png');
    await cam('box.jpg'); await tap('.lc-shutter', { wait: 250 }); await snap('F3-fly-in.png'); await page.waitForTimeout(600); await snap('F3b-after-fly.png');
    await page.locator('.lv-strip .lv-sq').nth(0).click(); await page.waitForTimeout(300); if (await page.locator('.tier-sheet').count()) await tap('.tier-sheet .btn-quiet', { wait: 300 });
    WHERE.length = 0; WHERE.push({ name: 'kitchen counter', moves: false, known: 'Kitchen counter', sure: true }); NEXT_WHERE_DELAY = 900;
    await cam('closet.jpg'); await tap('.lc-shutter', { wait: 500 }); await tap('.photo-for .pf-other', { wait: 300 }); await snap('F4-choose-looking.png');
    await page.waitForTimeout(1400); await snap('F5-choose-suggestion.png');
    await tap('.where-list .wl-sugg:not(.quiet)', { wait: 600 }); await snap('F6-before-now.png');
    await tap('.where-list.bn .btn-primary', { wait: 600 }); await snap('F7-after-use.png');
    await tap('.lc-x', { wait: 400 }); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 400 });
    await move(); await tap('.lc-choose', { wait: 500 }); await snap('F8-choose-from-button.png');
    await tap('.where-list .wl-new', { wait: 500 }); await snap('F9-new-place-shutter.png');
  }
  await seedHouse();
  try { await runSuite(); } catch (e) { console.error('FATAL', e); }
  await browser.close();
}
(async () => { await new Promise((r) => server.listen(PORT, r)); await runLook('b'); server.close(); })();
