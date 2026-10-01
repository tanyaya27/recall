  // 09-30d mockups for Ravi & Tanya — the tier question (BOARD_2026-09-30_tiers-or-freeform.md). Real screens, real styles,
  // Ravi's own chain; B is build d as built; A, C, D are drawn on top of the real screens (only the block in question).
  async function runSuite() {
    const OUT = path.join(__dirname, 'shots_pick'); fs.mkdirSync(OUT, { recursive: true });
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

    // ===== Ravi 09-30 1:36 PM: a photo on a tier that has a place; Choose place order; confirm before it's done =====
    const kc = img('closet.jpg'); const wcb = img('box.jpg'); const shot = img('real_painting.jpg');
    // NOW: his screen — shoot the highlighted current place; at 3 s the sheet opens with a "new place" assumed
    await move(); WHERE.push({ name: 'dark table surface', moves: false }); NEXT_WHERE_DELAY = 1200; await cam('real_painting.jpg'); await tap('.lc-shutter', { wait: 3800 });
    await snap('Q0-now-photo-assumes-new-place.png');
    // PROPOSED 2: the same sheet, new place first, then search, then the list (ReCall's suggestion and the current place first)
    await inject((p) => { const wl = document.querySelector('.where-list'); const pend = wl.querySelector('.wl-pend'); const srch = wl.querySelector('.wl-search');
      pend.parentNode.insertBefore(srch, pend.nextSibling); srch.style.marginTop = '.75rem';
      const chg = wl.querySelector('.wl-chg'); if (chg) chg.innerHTML = '<div class="wl-chg-ch"><span class="cp"><span>3D model of plant sensor</span></span><span class="cp"><span class="lc-in">in</span><span class="sel" style="border-color:#F5B942;color:#F5B942">White cardboard box</span></span><span class="cp"><span class="lc-in">in</span><span>Ikea shelving unit</span></span><span class="cp"><span class="lc-in">in</span><span>Living room</span></span></div><p class="wl-chg-say">Now: White cardboard box. Your photo is of a different place — which one?</p>';
      const ph = wl.querySelector('.wl-pend-h b'); if (ph) ph.textContent = 'A new place';
      const hint = wl.querySelector('.wl-hint'); if (hint) hint.textContent = 'ReCall’s guess for a NEW place — type to change it.';
      const g = wl.querySelector('.wl-g'); if (g) g.textContent = 'OR ONE OF YOUR PLACES';
      const row = document.createElement('div'); row.className = 'wl-row wl-sugg'; row.innerHTML = '<img src="' + p.kc + '" alt=""><span class="tx"><b>Kitchen counter</b><small>ReCall: this photo looks like it</small></span>';
      g.parentNode.insertBefore(row, g.nextSibling); }, { kc });
    await snap('Q2-choose-with-photo-new-first.png');
    await tap('.where-list .btn-quiet', { wait: 400 }).catch(() => {}); await tap('.lc-x', { wait: 400 }).catch(() => {}); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 400 });
    // PROPOSED 1: the shutter on a tier that has a place asks at once — no wait, nothing assumed
    await move();
    await inject((p) => { const card = document.querySelector('.lc-card');
      const b = document.createElement('div'); b.className = 'sheet-back'; b.style.background = 'rgba(0,0,0,.35)';
      b.innerHTML = '<div class="sheet" style="padding-bottom:1rem"><div style="display:flex;gap:.75rem;align-items:center"><img src="' + p.shot + '" style="width:76px;height:76px;object-fit:cover;border-radius:14px;border:3px solid #F5B942"><div><div class="sheet-title" style="margin:0">This photo is…</div><small style="color:#CFC7BA">of the tier you selected (level 1)</small></div></div>'
        + '<button class="wl-row" style="margin-top:.75rem;border:2px solid #F5B942;border-radius:16px;padding:.5rem"><img src="' + p.wcb + '" alt=""><span class="tx"><b>Another photo of the White cardboard box</b><small>It’s still there — the photo is added to it</small></span></button>'
        + '<button class="wl-row" style="margin-top:.5rem;border:1.5px solid rgba(255,255,255,.3);border-radius:16px;padding:.5rem"><span class="no" style="font-size:1.4rem">→</span><span class="tx"><b>A different place</b><small>Name it, or pick one of yours</small></span></button>'
        + '<p class="note-quiet left" style="margin:.6rem .25rem 0">ReCall looks at the photo meanwhile and may add “Looks like the …” — it never decides for you, and nothing waits on a timer.</p>'
        + '<button class="btn-quiet" style="margin-top:.25rem">Retake</button></div>';
      document.querySelector('.lc').appendChild(b); }, { shot, wcb });
    await snap('Q1-shutter-on-a-tier-asks.png');
    await page.evaluate(() => document.querySelectorAll('.lc > .sheet-back').forEach((x) => x.remove()));
    // PROPOSED 2b: Choose place from the button — Photograph a new place first, then search
    await tap('.lc-choose', { wait: 600 });
    await inject(() => { const wl = document.querySelector('.where-list'); const nw = wl.querySelector('.wl-new'); const srch = wl.querySelector('.wl-search'); if (nw && srch) srch.parentNode.insertBefore(nw, srch); });
    await snap('Q3-choose-new-place-first.png');
    // PROPOSED 3: a pick doesn't close — Before / Now, then Use or Back
    await inject((p) => { const sh = document.querySelector('.where-list');
      const tile = (lab, src, name, sub, col) => '<div style="flex:1;min-width:0"><div style="font-size:.75rem;font-weight:800;letter-spacing:.08em;color:#CFC7BA;margin-bottom:.35rem">' + lab + '</div><div style="position:relative"><img src="' + src + '" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:14px;border:3px solid ' + col + '"><span style="position:absolute;right:6px;bottom:6px;background:rgba(0,0,0,.6);color:#fff;border-radius:999px;padding:.1rem .45rem;font-size:.75rem;font-weight:700">1/3</span></div><b style="display:block;margin-top:.4rem;font-size:1rem">' + name + '</b><small style="color:#CFC7BA;font-size:.8125rem">' + sub + '</small></div>';
      sh.innerHTML = '<div class="sheet-title"><span class="wl-chooser">Choose place</span></div>'
        + '<div style="display:flex;gap:.75rem;align-items:flex-start;margin:.5rem 0 .75rem">' + tile('BEFORE', p.wcb, 'White cardboard box', 'in Ikea shelving unit in Living room', '#6B6660') + '<div style="align-self:center;font-size:1.5rem;color:#F5B942;margin-top:1.5rem">→</div>' + tile('NOW', p.kc, 'Kitchen counter', 'in Craft nook', '#F5B942').replace('1/3', '1/1') + '</div>'
        + '<p style="font-weight:700;margin:.25rem 0 .75rem">The 3D model of plant sensor goes onto the Kitchen counter.</p>'
        + '<p class="note-quiet left" style="margin:0 0 .75rem">Tap a photo to see it big and swipe through that place’s photos.</p>'
        + '<button class="btn-primary" style="width:100%">Use the Kitchen counter</button><button class="btn-secondary" style="width:100%;margin-top:.5rem">Back to the list</button>'; }, { wcb, kc });
    await snap('Q4-before-now-confirm.png');
    await inject((p) => { const sh = document.querySelector('.where-list');
      sh.querySelectorAll('b')[0].textContent = 'White cardboard box'; const imgs = sh.querySelectorAll('img'); imgs[1].src = p.shot; imgs[1].nextSibling.textContent = '1/1';
      const bs = sh.querySelectorAll('b'); bs[1].innerHTML = 'Dark table surface <span style="font-size:.75rem;font-weight:700;color:#8CC4B2">NEW</span>'; sh.querySelectorAll('small')[1].textContent = 'a new place — what it’s in: add it next with +';
      sh.querySelector('p').textContent = 'The 3D model of plant sensor goes onto the Dark table surface (a new place, with your photo).';
      sh.querySelector('.btn-primary').textContent = 'Use the Dark table surface'; }, { shot });
    await snap('Q5-before-now-new-place.png');
  }
  await seedHouse();
  try { await runSuite(); } catch (e) { console.error('FATAL', e); }
  await browser.close();
}
(async () => { await new Promise((r) => server.listen(PORT, r)); await runLook('b'); server.close(); })();
