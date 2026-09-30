  // 09-30d mockups for Ravi & Tanya — the tier question (BOARD_2026-09-30_tiers-or-freeform.md). Real screens, real styles,
  // Ravi's own chain; B is build d as built; A, C, D are drawn on top of the real screens (only the block in question).
  async function runSuite() {
    const OUT = path.join(__dirname, 'shots_tier'); fs.mkdirSync(OUT, { recursive: true });
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

    // ---- B (build d, as built): the tier marked in the camera, and on top of Choose place ----
    await move(); await page.locator('.lv-strip .lv-sq').nth(1).click(); await page.waitForTimeout(400);
    await snap('B1-camera-tier-marked.png');
    await tap('.lc-choose', { wait: 600 }); await snap('B2-choose-says-which-tier.png');
    await tap('.where-list .btn-quiet', { wait: 400 }); await tap('.lc-x', { wait: 400 }); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 400 });

    // ---- A: one question per Move ----
    await move();
    await inject(() => {
      const sq = [...document.querySelectorAll('.lv-strip .lv-s')]; sq.slice(1).forEach((x) => x.remove());
      const pl = document.querySelector('.lc-plus-out'); if (pl) pl.remove();
      const say = document.querySelector('.lc-say .tx b'); if (say) say.innerHTML = '<span class="lab" style="color:#F5B942">In:</span> White cardboard box';
      const ch = document.querySelector('.lc-chainline'); ch.innerHTML = '<span style="width:100%;font-weight:600;color:#CFC7BA;font-size:.875rem">The White cardboard box is in</span>'
        + '<span class="cp"><span style="color:#8FB8E8">Ikea shelving unit</span></span><span class="cp"><span class="lc-in">in</span><span style="color:#E88F8F">Living room</span></span>'
        + '<span style="width:100%;margin-top:.25rem"><button style="min-height:36px;padding:0 .9rem;border-radius:999px;background:rgba(255,255,255,.12);color:#fff;font-weight:700;font-size:.875rem">Moved the box? Open it ›</button></span>';
      const pr = document.querySelector('.lc-prompt'); if (pr) pr.textContent = 'What is it in now? Photograph it, or choose one.'; });
    await snap('A1-move-asks-one-thing.png');
    await inject((p) => {
      const s0 = document.querySelector('.lv-strip .lv-sq img'); if (s0) s0.src = p.glove;
      const say = document.querySelector('.lc-say .tx b'); if (say) say.innerHTML = '<span class="lab" style="color:#F5B942">In:</span> Glove box <span style="font-weight:600;color:#CFC7BA">(new)</span>';
      const ch = document.querySelector('.lc-chainline'); ch.innerHTML = '<span style="width:100%;font-weight:800;font-size:1rem">What’s the Glove box in?</span>'
        + '<span style="display:flex;gap:.5rem;width:100%;margin-top:.35rem"><button style="flex:1;min-height:44px;border-radius:999px;background:#8CC4B2;color:#1F1D1A;font-weight:800">Photograph</button><button style="flex:1;min-height:44px;border-radius:999px;background:rgba(255,255,255,.14);color:#fff;font-weight:800">Choose</button><button style="flex:.7;min-height:44px;border-radius:999px;background:transparent;border:1.5px solid rgba(255,255,255,.35);color:#fff;font-weight:700">Skip</button></span>'
        + '<span style="width:100%;font-weight:600;color:#CFC7BA;font-size:.8125rem;margin-top:.3rem">Asked once, for a new place. Skip is fine.</span>';
      const pr = document.querySelector('.lc-prompt'); if (pr) pr.textContent = 'A new place: the Glove box.'; }, pics);
    await snap('A2-new-place-asks-once.png');
    await tap('.lc-x', { wait: 400 }); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 400 });
    // A3: the box's own page carries its own "where", with Move it
    await home(); await tap('.menu-btn', { wait: 400 }); await tap('.drawer-row:has-text("Places")', { wait: 700 }); await tap('.loc-row:has-text("White cardboard box")', { wait: 800 });
    await inject((p) => {
      const h = document.querySelector('.screen h1, .screen .title, .screen-title, .screen h2'); const host = document.querySelector('.screen');
      const b = document.createElement('section'); b.className = 'tp-blk'; b.style.cssText = 'margin:.5rem 0 .75rem';
      b.innerHTML = '<h2 style="margin:0 0 .5rem">Where it is</h2><div class="tp-wh multi"><div class="ch"><span class="st"><img src="' + p.b + '" alt=""></span><span class="st"><span class="in">in</span><img src="' + p.c + '" alt=""></span></div>'
        + '<div class="tx"><b class="tp-chain"><span class="cp"><span class="n1">Ikea shelving unit</span></span><span class="cp"><span class="in">in</span><span class="n2">Living room</span></span></b><small>moved Mon 4:09 PM</small></div></div>'
        + '<button class="btn-primary" style="margin-top:.625rem;width:100%"><span>Move it</span></button><p class="note-quiet left" style="margin:.4rem 0 0">Everything in it moves with it — 1 item.</p>';
      const first = host.querySelector('.card, .settings, section, .field-label'); (first && first.parentNode ? first.parentNode : host).insertBefore(b, first || null); }, { b: img('closet.jpg'), c: img('real_desk.jpg') });
    await page.evaluate(() => window.scrollTo(0, 0)); await snap('A3-the-box-moves-from-its-own-page.png');

    // ---- C: freeform ----
    await openThing('3D model of plant sensor');
    await inject((p) => { const w = document.querySelector('.tp-wh'); w.outerHTML = '<div class="tp-wh"><div class="tx"><b style="font-size:1.125rem;line-height:1.35">“Glove box of the Tesla, parked on the street”</b><small>written today 10:32 AM · seen Mon 4:09 PM</small>'
      + '<div style="display:flex;gap:.5rem;margin-top:.6rem">' + [p.glove, p.tesla, p.street].map((s) => '<img src="' + s + '" style="width:64px;height:64px;object-fit:cover;border-radius:12px">').join('') + '</div></div></div>';
      const n = document.querySelector('.tp-moved'); if (n) n.remove(); }, pics);
    await page.evaluate(() => document.querySelector('.tp-blk').scrollIntoView({ block: 'start' })); await page.evaluate(() => window.scrollBy(0, -90));
    await snap('C2-item-page-freeform.png');
    await tap('button:has-text("Move it")', { wait: 900 });
    await inject((p) => { const b = document.createElement('div'); b.className = 'sheet-back';
      b.innerHTML = '<div class="sheet where-list" style="padding-bottom:1rem"><div class="sheet-title">Where is it now?</div>'
        + '<textarea class="place-input" style="min-height:5.5rem;width:100%;box-sizing:border-box;font-size:1.0625rem;line-height:1.35;padding:.6rem .75rem">Glove box of the Tesla, parked on the street</textarea>'
        + '<div style="display:flex;gap:.5rem;margin:.6rem 0"><button class="btn-secondary" style="flex:1">🎤 Say it</button><button class="btn-secondary" style="flex:1">📷 Add a photo</button></div>'
        + '<div style="display:flex;gap:.5rem;margin-bottom:.75rem">' + [p.glove, p.tesla].map((s) => '<img src="' + s + '" style="width:72px;height:72px;object-fit:cover;border-radius:12px">').join('') + '</div>'
        + '<p class="note-quiet left" style="margin:0 0 .6rem">No places to pick — what you write is what Find searches. Moving the Tesla later means writing it again on each thing in it.</p>'
        + '<button class="btn-primary" style="width:100%">Save</button></div>'; document.querySelector('.lc').appendChild(b); }, pics);
    await snap('C1-move-is-a-sentence.png');
    await tap('.lc-x', { wait: 400, force: true }).catch(() => {}); await page.goto(`http://localhost:${PORT}/`); await page.waitForTimeout(400);

    // ---- D (tech board): A + an optional note ----
    await openThing('3D model of plant sensor');
    await inject(() => { const tx = document.querySelector('.tp-wh .tx'); const n = document.createElement('div');
      n.innerHTML = '<span style="display:inline-flex;gap:.4rem;align-items:baseline;margin-top:.35rem;padding:.3rem .6rem;border-radius:10px;background:rgba(245,185,66,.14);color:var(--ink);font-size:.9375rem"><b style="color:#B7791F">Note</b> under the spare cables, at the back</span>';
      tx.appendChild(n); const m = document.querySelector('.tp-moved'); if (m) m.remove(); });
    await page.evaluate(() => document.querySelector('.tp-blk').scrollIntoView({ block: 'start' })); await page.evaluate(() => window.scrollBy(0, -90));
    await snap('D1-a-plus-a-note.png');
    // ---- D (user board): say it, ReCall builds the chain, you confirm ----
    await tap('button:has-text("Move it")', { wait: 900 });
    await inject((p) => { const b = document.createElement('div'); b.className = 'sheet-back';
      const pill = (n, c, isNew) => '<span class="cp" style="display:inline-flex;align-items:center;gap:.375rem"><span style="border:2px solid ' + c + ';color:' + c + ';border-radius:999px;padding:.1rem .6rem;font-weight:800">' + n + '</span>' + (isNew ? '<small style="color:#CFC7BA">new</small>' : '') + '</span>';
      b.innerHTML = '<div class="sheet where-list" style="padding-bottom:1rem"><div class="sheet-title">Where is it now?</div>'
        + '<div class="wl-search" style="margin-bottom:.6rem"><span>🎤</span><input value="glove box of the Tesla, on the street" style="flex:1"></div>'
        + '<p style="margin:.25rem 0 .4rem;font-weight:700">ReCall read it as:</p>'
        + '<div class="wl-chg"><div class="wl-chg-ch">' + pill('Glove box', '#F5B942', true) + '<span class="lc-in">in</span>' + pill('Tesla', '#8FB8E8', true) + '<span class="lc-in">in</span>' + pill('Street', '#E88F8F', false) + '</div>'
        + '<p class="wl-chg-above">Street is one of your places. Glove box and Tesla are new.</p></div>'
        + '<button class="btn-primary" style="width:100%;margin-top:.4rem">✓ Looks right</button><button class="btn-secondary" style="width:100%;margin-top:.5rem">Change a part</button>'
        + '<p class="note-quiet left" style="margin:.6rem 0 0">After this it works like A: move the Tesla once, everything in it follows.</p></div>';
      document.querySelector('.lc').appendChild(b); }, pics);
    await snap('D2-say-it-recall-builds-it.png');
  }
  await seedHouse();
  try { await runSuite(); } catch (e) { console.error('FATAL', e); }
  await browser.close();
}
(async () => { await new Promise((r) => server.listen(PORT, r)); await runLook('b'); server.close(); })();
