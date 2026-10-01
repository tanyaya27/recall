  // monkey — 09-30 (TESTING.md #3): random real actions, in random orders nobody scripted, with the store's rules checked
  // after every step and the consistency oracle on the item just touched. Repeatable: `SEED=123 STEPS=60 node monkey.js`.
  // A failure prints the seed and the steps so far; the same seed replays the same run.
  async function runSuite() {
    const O = require('./oracle.js')({ page, PORT, tap });
    const OUT = path.join(__dirname, 'shots_m'); fs.mkdirSync(OUT, { recursive: true });
    let seed = Number(process.env.SEED || Date.now() % 100000); const SEED0 = seed; const STEPS = Number(process.env.STEPS || 40);
    const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    const pick = (a) => a[Math.floor(rnd() * a.length)];
    const log = [];
    const PHOTOS = ['real_slippers.jpg', 'real_desk.jpg', 'real_pencil.jpg', 'real_spoon.jpg', 'real_cetaphil.jpg', 'real_painting.jpg', 'book.jpg', 'card.jpg'];
    const WHERE_PHOTOS = ['closet.jpg', 'drawer.jpg', 'box.jpg', 'box14.jpg', 'smallbox.jpg'];
    const NEW_PLACES = ['Hall cupboard', 'Top shelf', 'Blue bin', 'Attic', 'Office', 'Porch bench', 'Laundry', 'Car trunk'];
    const THINGS = ['tape', 'charger', 'torch', 'pliers', 'stamps', 'glue', 'twine', 'fuse', 'ruler', 'keys', 'lens cloth', 'dice'];
    let tn = 0;
    const items = () => page.evaluate(() => window.__rig.dump().filter((d) => d.kind === 'item' && !d.deleted && d.name && d.owner === 'margaret' && !d.private).map((d) => d.name));
    const placeNames = () => page.evaluate(() => window.__rig.dump().filter((d) => d.kind === 'place').map((d) => d.name));
    const plus = async () => { if (await page.locator('.lv-sq.plus').count()) await tap('.lv-sq.plus', { wait: 300 }); };
    const choose = async (name) => {
      if (!(await page.locator('.where-list').count())) await tap('.lc-choose', { wait: 400 });
      await page.fill('.wl-search input', name); await page.waitForTimeout(180);
      const row = page.locator(`.where-list .wl-row:not(.wl-sugg):has-text("${name}")`);
      if (await row.count()) await row.first().click(); else if (await page.locator('.wl-new.typed').count()) await page.click('.wl-new.typed'); else await page.click('.where-list .btn-quiet');
      await page.waitForTimeout(400);
    };
    const shootPlace = async () => {
      const nm = pick(NEW_PLACES) + ' ' + Math.floor(rnd() * 90 + 10);
      WHERE.push({ name: nm.toLowerCase(), moves: rnd() < 0.3 }); if (rnd() < 0.15) NEXT_WHERE_DELAY = 3800;
      await cam(pick(WHERE_PHOTOS)); await tap('.lc-shutter', { wait: 300 });
      for (let k = 0; k < 40 && await page.locator('.lv-look').count(); k++) await page.waitForTimeout(150);
      for (let k = 0; k < 14 && !(await page.locator('.where-list, .photo-for').count()); k++) await page.waitForTimeout(150); for (let k = 0; k < 40 && (await page.locator('.where-list .wl-sugg.quiet:has-text("Looking")').count()); k++) await page.waitForTimeout(150); /* 09-30f: Choose place opens at once; wait for ReCall's look */
      if (await page.locator('.where-list .wl-sugg:not(.quiet)').count()) { await tap(rnd() < 0.5 ? '.where-list .wl-sugg:not(.quiet)' : '.where-list .wl-pend input', { wait: 450 }); }
      if (await page.locator('.where-list .wl-sugg:not(.quiet)').count()) return; // a suggestion: the test answers it
      if (await page.locator('.wl-pend .btn-primary').count()) {
        if (await page.locator('.wl-pend .btn-primary').isDisabled() || rnd() < 0.3) await page.locator('.wl-pend input').fill(nm);
        if (await page.locator('.wl-pend .btn-primary').isDisabled()) await page.locator('.wl-pend input').fill(nm + ' b');
        await tap('.wl-pend .btn-primary', { wait: 400 });
      }
      return nm;
    };
    const addTier = async () => { await plus(); if (rnd() < 0.55) await choose(pick([...(await placeNames()), pick(NEW_PLACES)])); else await shootPlace(); };
    const save = async () => { if (await page.locator('.lc-k.sv').isDisabled()) { await tap('.lc-x', { wait: 400 }); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 400 }); return false; } await tap('.lc-k.sv', { wait: 2400 }); return true; };
    const closeAll = async () => { for (const q of ['.where-list .btn-quiet', '.tier-sheet .sheet-row:has-text("Close")', '.sheet .btn-quiet']) if (await page.locator(q).count()) await tap(q, { wait: 300 }); if (await page.locator('.lc').count()) { await tap('.lc-x', { wait: 400 }); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 400 }); } };
    const ACTIONS = {
      async log() { const nm = pick(THINGS) + ' ' + (++tn); await home(); AI = { name: nm }; await cam(pick(PHOTOS)); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
        const k = 1 + Math.floor(rnd() * 3); for (let i = 0; i < k; i++) await addTier(); return (await save()) ? nm : null; },
      async move() { const nm = pick(await items()); await O.openItem(nm); const b = page.locator('button:has-text("Move it"), button:has-text("Put it somewhere")'); if (!(await b.count())) return null; await b.first().click(); await page.waitForTimeout(800);
        const r = rnd(); const n = await page.locator('.lv-strip .lv-sq:not(.plus)').count();
        if (r < 0.35) await choose(pick([...(await placeNames()), pick(NEW_PLACES)])); // a new tier 1
        else if ((r < 0.6 || n < 2) && n < 6) await addTier(); // add on top (a real chain stays under ~6 deep)
        else if (n < 2) await choose(pick(await placeNames()));
        else { const i = 1 + Math.floor(rnd() * (n - 1)); const sq = page.locator('.lv-strip .lv-sq').nth(i); await sq.click(); await page.waitForTimeout(250); await sq.click(); await page.waitForTimeout(350); if (await page.locator('.tier-sheet .sheet-row:has-text("Choose place")').count()) { await tap('.tier-sheet .sheet-row:has-text("Choose place")', { wait: 350 }); await choose(pick(await placeNames())); } }
        return (await save()) ? nm : null; },
      async undo() { if (await page.locator('.saved-card .u').count()) { await page.waitForTimeout(600); await tap('.saved-card .u', { wait: 1400 }); } return null; },
      async renamePlace() { const pl = pick(await placeNames()); await home(); await tap('.menu-btn', { wait: 400 }); await tap('.drawer-row:has-text("Places")', { wait: 700 });
        const row = page.locator(`.loc-row:has-text("${pl}")`); if (!(await row.count())) return null; await row.first().click(); await page.waitForTimeout(600);
        if (!(await page.locator('button.field-value').count())) return null; await tap('button.field-value', { wait: 300 }); await page.locator('input.place-input').first().fill(pl + ' ' + Math.floor(rnd() * 9)); await page.keyboard.press('Enter'); await page.waitForTimeout(900); return null; },
      async cancelHalfway() { await home(); AI = { name: 'half ' + (++tn) }; await cam(pick(PHOTOS)); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 }); if (rnd() < 0.5) await addTier(); await closeAll(); return null; },
    };
    const WEIGHTS = [['log', 4], ['move', 5], ['undo', 1], ['renamePlace', 1], ['cancelHalfway', 1]];
    const choice = () => { const t = WEIGHTS.reduce((a, [, w]) => a + w, 0); let r = rnd() * t; for (const [k, w] of WEIGHTS) { if ((r -= w) < 0) return k; } return 'move'; };

    await seedHouse(); await page.evaluate(() => window.__rig.rules(true));
    console.log(`monkey SEED=${SEED0} STEPS=${STEPS}`);
    let fails = 0;
    for (let s = 1; s <= STEPS && fails < 3; s++) {
      const a = choice(); let touched = null; let err = '';
      const e0 = errors.length;
      try { touched = await ACTIONS[a](); } catch (e) { err = e.message.split('\n')[0].slice(0, 160); await closeAll().catch(() => {}); }
      log.push(`${s}:${a}${touched ? '(' + touched + ')' : ''}${err ? ' [harness: ' + err + ']' : ''}`);
      const bad = [...await O.invariants()];
      if (errors.length > e0) bad.push('page error: ' + errors.slice(e0).join(' | '));
      if (touched && (s % 3 === 0 || a === 'move')) bad.push(...await O.check(touched));
      if (bad.length) { fails++; await page.screenshot({ path: path.join(OUT, `m-${SEED0}-step${s}.png`) }); check('M', `step ${s} (${a}${touched ? ' ' + touched : ''}): the store's rules hold and every screen agrees`, false, bad.join(' || ') + `  — replay: SEED=${SEED0}; steps: ${log.join(' ')}`); }
    }
    // at the end, every item agrees
    const all = await items(); let endBad = [];
    for (const nm of all.slice(0, 25)) endBad.push(...await O.check(nm));
    check('M', `after ${STEPS} random steps (seed ${SEED0}): every item's screens agree with the store`, endBad.length === 0, endBad.slice(0, 6).join(' || '));
    check('M', `no page errors (seed ${SEED0})`, errors.length === 0, errors.slice(0, 3).join(' | '));
    console.log('steps:', log.join(' '));
  }
  await seedHouse();
  try { await runSuite(); } catch (e) { console.error('FATAL', e); check('M', 'suite ran', false, e.message); }
  await browser.close();
}
(async () => {
  await new Promise((r) => server.listen(PORT, r));
  await runLook('b');
  const pass = results.filter((r) => r.ok).length;
  console.log(`\n${pass}/${results.length} checks passed`);
  server.close();
})();
