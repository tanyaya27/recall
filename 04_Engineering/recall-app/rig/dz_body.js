  // 09-30 design round — shutter state (a/b/c) + feedback (d), three directions, drawn over the real screens.
  async function runSuite() {
    const OUT = path.join(__dirname, 'shots_dz'); fs.mkdirSync(OUT, { recursive: true });
    const snap = async (f) => { await page.waitForTimeout(350); await page.screenshot({ path: path.join(OUT, f) }); console.log('  [shot]', f); };
    const zoom = async (f) => { const r = await page.locator('.lc-shutter').first().boundingBox(); const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
      await page.screenshot({ path: path.join(OUT, f), clip: { x: cx - 130, y: cy - 92, width: 260, height: 142 } }); console.log('  [zoom]', f); };
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
    await page.addInitScript(() => { window.__noAuto = true; });

    const DESIGN = fs.readFileSync(path.join(__dirname, 'dz_design.js'), 'utf8');
    const wcbT = img('box.jpg');
    const design = (dir, state, extra = {}) => page.evaluate(([src, dir, state, extra]) => { eval(src); window.__dz(dir, state, extra); }, [DESIGN, dir, state, { thumb: wcbT, ...extra }]);
    const DIRS = (process.env.DIRS || 'A,B,C').split(',');
    const each = async (state, tag, extra = {}) => { for (const d of DIRS) { await design(d, state, extra); await page.waitForTimeout(250); await snap(`${d}-${tag}.png`); if (extra.zoom !== false) await zoom(`${d}-${tag}-z.png`); } await design('none', 'a'); };

    // (a) default — next shot asks
    await move(); await cam('real_desk.jpg'); await page.waitForTimeout(300);
    await each('a', 'a', { zoom: false });
    // (b) remembered "more photos of the White cardboard box"
    await cam('box.jpg'); await tap('.lc-shutter', { wait: 500 }); await tap('.photo-for .pf-same', { wait: 500 });
    await cam('real_desk.jpg'); await page.waitForTimeout(300);
    await each('b', 'b');
    await cam('diary.jpg'); await page.waitForTimeout(400);
    await each('b', 'b-bright');
    // (d) feedback mid-frame (the shot = the current frame)
    await cam('real_desk.jpg'); await page.waitForTimeout(300);
    await each('d', 'd', { shot: img('real_desk.jpg') });
    await tap('.lc-x', { wait: 400 }); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 400 });
    // (c) armed "new place"
    await move(); await tap('.lc-choose', { wait: 500 }); await tap('.where-list .wl-new', { wait: 400 });
    await cam('real_desk.jpg'); await page.waitForTimeout(300);
    await each('c', 'c');
    await cam('diary.jpg'); await page.waitForTimeout(400);
    await each('c', 'c-bright');
  }
  await seedHouse();
  try { await runSuite(); } catch (e) { console.error('FATAL', e); }
  await browser.close();
}
(async () => { await new Promise((r) => server.listen(PORT, r)); await runLook('b'); server.close(); })();
