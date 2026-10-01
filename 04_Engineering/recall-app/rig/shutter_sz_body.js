  // 09-30 shutter-mark design round (R1, R2, A, B) — drawn over the real screens; OPT=R1|R2|A|B
  async function runSuite() {
    const OPT = process.env.OPT || 'A';
    const OUT = path.join(__dirname, 'shots_sz', OPT); fs.mkdirSync(OUT, { recursive: true });
    const DZ = fs.readFileSync(path.join(__dirname, 'shutter_dz.js'), 'utf8');
    const Z = async (fn, ...a) => { await page.evaluate(DZ); return page.evaluate(([f, a]) => window.__SZ[f](...a), [fn, a]); };
    const snap = async (f) => { await page.waitForTimeout(450); await page.screenshot({ path: path.join(OUT, f) }); console.log('  [shot]', OPT, f); };
    const close = async (f, extraTop = 0) => { await page.waitForTimeout(300); const r = await page.locator('.lc-shutter').boundingBox();
      await page.screenshot({ path: path.join(OUT, f), clip: { x: r.x + r.width / 2 - 100, y: r.y - 64 - extraTop, width: 200, height: r.height + 80 + extraTop } }); console.log('  [shot]', OPT, f); };
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

    // (a) default — the next shot will ask
    await move(); await cam('box.jpg'); await Z('ensureCss'); await snap('a.png'); await close('a_close.png');
    console.log('rects a', JSON.stringify(await Z('rects')));
    // the modal — marks on the choices
    await cam('box.jpg'); await tap('.lc-shutter', { wait: 700 }); await page.waitForSelector('.photo-for');
    await Z('modal', OPT); await snap('modal.png');
    console.log('rects modal', JSON.stringify(await Z('rects')));
    // (b) remembered: more photos of the White cardboard box
    await tap('.photo-for .pf-same', { wait: 700 }); await cam('box.jpg');
    await Z('shutter', OPT, 'b'); await snap('b.png'); await close('b_close.png');
    console.log('rects b', JSON.stringify(await Z('rects')));
    // (d) one frame of the fly-in
    const shotSrc = img('box.jpg'); console.log('fly', await Z('fly', OPT, shotSrc, 3)); await snap('d.png'); await Z('unfly');
    // (b) over a bright camera photo
    await cam('closet.jpg'); await page.waitForTimeout(500); await Z('shutter', OPT, 'b'); await snap('b_bright.png'); await close('b_bright_close.png');
    await tap('.lc-x', { wait: 500 }); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 500 });
    // (c) armed: Choose place → Photograph a new place
    await move(); await cam('box.jpg'); await tap('.lc-choose', { wait: 700 }); await Z('chooseRow', OPT); await snap('choose.png');
    await page.evaluate(() => document.querySelectorAll('.where-list .wl-new .sz-mini, .where-list .wl-new .sz-cap').forEach((x) => x.remove()));
    await tap('.where-list .wl-new', { wait: 700 });
    console.log('promptC', await Z('promptC')); await Z('shutter', OPT, 'c'); await snap('c.png'); await close('c_close.png');
    await cam('closet.jpg'); await page.waitForTimeout(500); await Z('shutter', OPT, 'c'); await snap('c_bright.png');
  }
  await seedHouse();
  try { await runSuite(); } catch (e) { console.error('FATAL', e); }
  await browser.close();
}
(async () => { await new Promise((r) => server.listen(PORT, r)); await runLook('b'); server.close(); })();
