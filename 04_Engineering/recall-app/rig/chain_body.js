  // audit_chain (= tiers_head.js + chain_body.js) — Ravi 09-29 (phone, g): Move it on "3D model of plant sensor" (at White cardboard box). (1) adding tier 2
  // AND tier 3 in one go: the 3rd tier vanished, and a popup covered the name box while typing; (2) Move it again only
  // showed White cardboard box — the Ikea shelving unit above it was not there to build on; (3) the item page's
  // hierarchy has no "in" pill between the words.
  async function runSuite() {
    const OUT = path.join(__dirname, 'shots_h'); fs.mkdirSync(OUT, { recursive: true });
    let n = 0; const snap = async (label) => { n++; const f = `h-${String(n).padStart(2, '0')}-${label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`; await page.waitForTimeout(250); await page.screenshot({ path: path.join(OUT, f) }); console.log('  [shot]', f); return f; };
    const st = () => page.evaluate(() => { const t = (q) => (document.querySelector(q) || {}).innerText || '';
      return { squares: [...document.querySelectorAll('.lv-strip .lv-sq:not(.plus)')].map((b) => b.getAttribute('aria-label')), place: t('.lc-say'), chain: t('.lc-chainline').replace(/\n/g, ' '), prompt: t('.lc-prompt'), sheet: !!document.querySelector('.sheet-back'), plus: !!document.querySelector('.lv-sq.plus') }; });
    const openThing = async (nm) => { await home(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', nm); await page.waitForTimeout(350); await page.click('.ask .tile >> nth=0'); await page.waitForSelector('.card.thing'); await page.waitForTimeout(400); };
    const move = async () => { await openThing('3D model of plant sensor'); await tap('button:has-text("Move it")', { wait: 900 }); };
    const inOf = (nm) => page.evaluate((n) => { const d = window.__rig.dump(); const p = d.find((x) => x.kind === 'place' && x.name.toLowerCase() === n.toLowerCase()); if (!p) return 'no place'; const e = d.filter((x) => x.kind === 'edge' && x.from === p.id && !x.until); return e.map((x) => x.to.name).join(',') || 'none'; }, nm);
    // the iOS keyboard (~336 pt + the 44 pt bar above it) covers the bottom of the screen; a focused field must sit above it
    const kbCheck = async (label) => page.evaluate((lab) => { const a = document.activeElement; if (!a || a.tagName !== 'INPUT') return { lab, focused: false };
      const r = a.getBoundingClientRect(); return { lab, focused: true, bottom: Math.round(r.bottom), limit: 844 - 380, ok: r.bottom <= 844 - 380 }; }, label);

    // the iPhone keyboard, as the page sees it: the visual viewport shrinks by the keyboard's height (Chromium has no
    // on-screen keyboard, so a stand-in visualViewport is installed before the app loads; __kb(px) raises/lowers it).
    await page.addInitScript(() => { const et = new EventTarget(); let h = null; const H = () => (h === null ? window.innerHeight : h);
      Object.defineProperty(et, 'height', { get: H }); Object.defineProperty(et, 'offsetTop', { get: () => 0 }); Object.defineProperty(et, 'width', { get: () => window.innerWidth });
      Object.defineProperty(window, 'visualViewport', { configurable: true, get: () => et });
      window.__kb = (px) => { h = window.innerHeight - px; et.dispatchEvent(new Event('resize'));
        let k = document.getElementById('__kbv'); if (!px) { if (k) k.remove(); return; }
        if (!k) { k = document.createElement('div'); k.id = '__kbv'; document.body.appendChild(k); }
        k.style.cssText = `position:fixed;left:0;right:0;bottom:0;height:${px}px;background:#c9ccd3;z-index:99999;pointer-events:none;display:flex;align-items:center;justify-content:center;font:600 20px system-ui;color:#555`; k.textContent = 'keyboard'; }; });
    const kbUp = () => page.evaluate(() => window.__kb(380)); const kbDown = () => page.evaluate(() => window.__kb(0));
    const inView = (sel) => page.evaluate((q) => { const e = document.querySelector(q); if (!e) return { q, there: false }; const r = e.getBoundingClientRect(); return { q, there: true, top: Math.round(r.top), bottom: Math.round(r.bottom), ok: r.top >= 0 && r.bottom <= 844 - 380 }; }, sel);

    // ---- 1: tier 2 and tier 3 in one Move ----
    await seedHouse(); await page.evaluate(() => window.__rig.rules(true));
    await move(); let s = await st(); await snap('move opens'); console.log(JSON.stringify(s));
    await tap('.lv-sq.plus', { wait: 350 });
    WHERE.push({ name: 'bookshelf', moves: false }); await cam('closet.jpg'); await tap('.lc-shutter', { wait: 2200 });
    await snap('tier 2 photographed'); s = await st(); console.log(JSON.stringify(s));
    if (await page.locator('.wl-pend input').count()) { await page.locator('.wl-pend input').click(); await page.locator('.wl-pend input').fill('Ikea shelving unit'); console.log(JSON.stringify(await kbCheck('tier2 name'))); await snap('typing tier 2 name'); await tap('.wl-pend .btn-primary', { wait: 500 }); }
    s = await st(); await snap('tier 2 named'); console.log(JSON.stringify(s));
    await tap('.lv-sq.plus', { wait: 350 });
    WHERE.push({ name: 'living room', moves: false }); NEXT_WHERE_DELAY = 4500; await cam('real_desk.jpg'); await tap('.lc-shutter', { wait: 3600 });
    await snap('tier 3: 3 s up'); s = await st(); console.log(JSON.stringify(s));
    if (await page.locator('.wl-pend input').count()) { await page.locator('.wl-pend input').click(); await page.keyboard.type('Off', { delay: 80 }); console.log(JSON.stringify(await kbCheck('tier3 name')));
      await page.waitForTimeout(1500); await snap('typing tier 3 while the late answer lands'); await page.keyboard.type('ice', { delay: 80 });
      console.log('draft', await page.locator('.wl-pend input').inputValue().catch(() => '?')); await tap('.wl-pend .btn-primary', { wait: 600 }); }
    s = await st(); await snap('tier 3 named'); console.log(JSON.stringify(s));
    check('H1', 'three tiers stay on the card after naming the 3rd', s.squares.length === 3 && /office/i.test(s.chain), JSON.stringify(s));
    await tap('.lc-k.sv', { wait: 2600 }); await snap('after save');
    check('H1', 'saved: Desk drawer in Ikea shelving unit in Office', (await inOf('Desk drawer')) === 'Ikea shelving unit' && (await inOf('Ikea shelving unit')) === 'Office', `${await inOf('Desk drawer')} / ${await inOf('Ikea shelving unit')}`);

    // ---- 2: Move it again shows every tier already known, so + builds on the top one ----
    await move(); s = await st(); await snap('move it again'); console.log(JSON.stringify(s));
    check('H2', 'Move it again opens with every known tier as a square (Desk drawer, Ikea shelving unit, Office)', s.squares.length === 3, JSON.stringify(s.squares));
    check('H2', '+ is there to add what the Office is in', s.plus, '');

    // ---- 3: + a 4th tier by typing its name, with the keyboard up ----
    await tap('.lv-sq.plus', { wait: 350 }); await tap('.lc-choose', { wait: 500 });
    await page.locator('.wl-search input').click(); await kbUp(); await page.waitForTimeout(200);
    await page.keyboard.type('Upstairs', { delay: 40 }); await page.waitForTimeout(250);
    const f1 = await inView('.wl-search input'), f2 = await inView('.wl-new.typed');
    await snap('keyboard up: typing a new place');
    check('H3', 'with the keyboard up, the search field and "A new place called Upstairs" are above it', f1.ok && f2.ok, JSON.stringify([f1, f2]));
    await page.keyboard.press('Enter'); await page.waitForTimeout(500); await kbDown();
    s = await st(); await snap('upstairs added');
    check('H3', 'Go on the keyboard picks it: 4 tiers, "…Office in Upstairs"', s.squares.length === 4 && /office\s*in\s*upstairs/i.test(s.chain), JSON.stringify(s));
    await tap('.lc-k.sv', { wait: 2600 });
    check('H3', 'saved: Office is in Upstairs; the drawer and the shelf stay put', (await inOf('Office')) === 'Upstairs' && (await inOf('Desk drawer')) === 'Ikea shelving unit' && (await inOf('Ikea shelving unit')) === 'Office', `${await inOf('Office')}`);
    await openThing('3D model of plant sensor'); await page.evaluate(() => document.querySelector('.tp-blk').scrollIntoView({ block: 'center' }));
    const wh = await page.evaluate(() => ({ words: (document.querySelector('.tp-chain') || {}).innerText || '', pillsW: document.querySelectorAll('.tp-chain .in').length, pillsSq: document.querySelectorAll('.tp-wh .ch .in').length,
      pillBg: (() => { const e = document.querySelector('.tp-chain .in'); return e ? getComputedStyle(e).backgroundColor : ''; })() }));
    await snap('item page: where it is');
    check('H7', 'item page: the words carry every tier with the "in" pill (Desk drawer in Ikea shelving unit in Office in Upstairs)', wh.pillsW === 3 && /Desk drawer\s*in\s*Ikea shelving unit\s*in\s*Office\s*in\s*Upstairs/.test(wh.words) && wh.pillBg && wh.pillBg !== 'rgba(0, 0, 0, 0)', JSON.stringify(wh));
    check('H7', 'item page: the squares use the same "in" pill between them', wh.pillsSq === 3, JSON.stringify(wh));
    const hist0 = await page.evaluate(() => window.__rig.dump().find((x) => x.id === 'ps').history.length);

    // ---- 4: Save with nothing changed writes nothing ----
    await move(); await tap('.lc-k.sv', { wait: 1500 });
    const hist1 = await page.evaluate(() => window.__rig.dump().find((x) => x.id === 'ps').history.length);
    check('H4', 'Move it, Save with nothing changed: closes, no new history line', !(await page.locator('.lc').count()) && hist1 === hist0, `${hist0} -> ${hist1}`);

    // ---- 5: a different place at tier 1 — the old outer tiers go (they were about the drawer) ----
    await move(); await tap('.lc-choose', { wait: 500 }); await page.fill('.wl-search input', 'Kitchen counter'); await page.waitForTimeout(150);
    await tap('.where-list .wl-row:has-text("Kitchen counter")', { wait: 500 });
    s = await st(); await snap('moved to kitchen counter');
    check('H5', 'picking Kitchen counter for tier 1 drops Ikea shelving unit / Office / Upstairs (they were where the drawer is)', s.squares.length === 1 && /kitchen counter/i.test(s.squares[0]), JSON.stringify(s.squares));
    await tap('.lc-k.sv', { wait: 2600 });
    const ps = await page.evaluate(() => window.__rig.dump().find((x) => x.id === 'ps'));
    check('H5', 'saved: the item is at Kitchen counter; the drawer is still in the Ikea shelving unit', /kitchen counter/i.test(ps.location) && (await inOf('Desk drawer')) === 'Ikea shelving unit', ps.location);

    // ---- 6: the rename sheet (a sheet with a text field) rides above the keyboard too ----
    await openThing('3D model of plant sensor'); await tap('.tp-row:has-text("Rename")', { wait: 500 });
    await page.locator('.sheet input').first().click(); await kbUp(); await page.waitForTimeout(200);
    const r1 = await inView('.sheet input'), r2 = await inView('.sheet .btn-primary');
    await snap('rename with keyboard up'); await kbDown();
    check('H6', 'rename: the field and its button sit above the keyboard', r1.ok && r2.ok, JSON.stringify([r1, r2]));
    await page.keyboard.press('Escape').catch(() => {});
  }
  await seedHouse();
  try { await runSuite(); } catch (e) { console.error('FATAL', e); check('H', 'suite ran', false, e.message); }
  await browser.close();
}
(async () => {
  await new Promise((r) => server.listen(PORT, r));
  await runLook('b');
  const pass = results.filter((r) => r.ok).length;
  console.log(`\n${pass}/${results.length} checks passed`);
  console.log('Page errors:', errors.length ? errors : 'none');
  server.close();
})();
