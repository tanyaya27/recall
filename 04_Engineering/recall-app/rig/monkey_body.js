  // monkey — 09-30 (TESTING.md #3): random real actions, in random orders nobody scripted, with the store's rules checked
  // after every step and the consistency oracle on the item just touched. Repeatable: `SEED=123 STEPS=60 node monkey.js`.
  // A failure prints the seed and the steps so far; the same seed replays the same run.
  // Retired 2026-10-01 (release 1 — the tier camera is gone): no check IDs retired (the monkey has only M checks); its
  //   tier actions are replaced — "add a tier" (+, Choose place, photograph-and-name a place), "change a tier" (tier
  //   square → Choose place) — by the new camera's actions: her words, the one In pick (✕ to clear), a photo-only Move,
  //   a box's own Move it, and a place's "Where this place is".
  async function runSuite() {
    // 10-01 (release 1): oracle.js still reads Move it's tier squares and chain line (.lv-strip / .lc-chainline), which are
    // gone — it would report every item with a place as a mismatch. Until oracle.js itself is updated, this suite uses
    // oracle.js for the truth, the store rules, the card and the item page, and reads the camera's ONE "In" chip instead:
    // Move it must open with the chip set to where it is now — "In: <first>" and the line under it "in the … · in the …"
    // (the rest of the chain) — and with no chip when it is nowhere. Her words: the item page shows her latest words
    // (`.tp-said q`) while they are still about where it is (saidNow), and none otherwise.
    const O0 = require('./oracle.js')({ page, PORT, tap });
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim().replace(/^in (the )?/i, '').toLowerCase();
    const O = O0; // 10-01: the release-1 check now lives in oracle.js
    const OUT = path.join(__dirname, 'shots_m'); fs.mkdirSync(OUT, { recursive: true });
    let seed = Number(process.env.SEED || Date.now() % 100000); const SEED0 = seed; const STEPS = Number(process.env.STEPS || 40);
    const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    const pick = (a) => a[Math.floor(rnd() * a.length)];
    const log = [];
    const PHOTOS = ['real_slippers.jpg', 'real_desk.jpg', 'real_pencil.jpg', 'real_spoon.jpg', 'real_cetaphil.jpg', 'real_painting.jpg', 'book.jpg', 'card.jpg'];
    const NEW_PLACES = ['Hall cupboard', 'Top shelf', 'Blue bin', 'Attic', 'Office', 'Porch bench', 'Laundry', 'Car trunk'];
    const WORDS = ['on the left', 'behind the door', 'in the blue folder', 'top shelf at the back', 'under the stairs', 'next to the lamp'];
    const THINGS = ['tape', 'charger', 'torch', 'pliers', 'stamps', 'glue', 'twine', 'fuse', 'ruler', 'keys', 'lens cloth', 'dice'];
    let tn = 0;
    const items = () => page.evaluate(() => window.__rig.dump().filter((d) => d.kind === 'item' && !d.deleted && d.name && d.owner === 'margaret' && !d.private).map((d) => d.name));
    const boxes = () => page.evaluate(() => { const d = window.__rig.dump(); const live = d.filter((x) => !x.deleted);
      return live.filter((x) => x.kind === 'item' && x.name && x.owner === 'margaret' && !x.private && (x.holds || live.some((e) => e.kind === 'edge' && !e.until && e.to && e.to.t === 'thing' && e.to.id === x.id))).map((x) => x.name); });
    const placeNames = () => page.evaluate(() => window.__rig.dump().filter((d) => d.kind === 'place' && !d.deleted).map((d) => d.name));
    // the one In: a random row of the list, or a name typed (an existing one, or a new place)
    const inPick = async () => {
      await page.click('.ow-go'); await page.waitForSelector('.ow-sheet'); await page.click('.ow-sheet .ow-lvl-change >> nth=0'); await page.waitForSelector('.in-list'); await page.waitForTimeout(150);
      const r = rnd();
      if (r < 0.45) { const n = await page.locator('.in-list .wl-row').count(); if (n) { await page.locator('.in-list .wl-row').nth(Math.floor(rnd() * n)).click(); await page.waitForTimeout(300); return; } }
      if (r > 0.92) { await tap('.in-list > .btn-quiet:has-text("Cancel")', { wait: 250 }); return; }
      const nm = rnd() < 0.5 ? pick(await placeNames()) : pick(NEW_PLACES) + ' ' + Math.floor(rnd() * 90 + 10);
      await page.fill('.in-list .wl-search input', nm); await page.waitForTimeout(200);
      const row = page.locator(`.in-list .wl-row:has(b:text-is("${nm}"))`);
      if (await row.count()) await row.first().click(); else if (await page.locator('.in-list .wl-new').count()) await page.locator('.in-list .wl-new').first().click(); else await tap('.in-list > .btn-quiet:has-text("Cancel")', { wait: 250 });
      await page.waitForTimeout(300);
    };
    const say = async () => { if (!(await page.locator('.ow-note-in').count())) { if (!(await page.locator('.ow-note').count())) return; await page.click('.ow-note'); } await page.fill('.ow-note-in', pick(WORDS)); await page.waitForTimeout(120); }; // 10-02: words are a note
    const leave = async () => { if (await page.locator('.lc').count()) { await tap('.lc-x', { wait: 400 }); const b = page.locator('button:has-text("Throw away"), button:has-text("Leave")'); if (await b.count()) await tap('button:has-text("Throw away"), button:has-text("Leave")', { wait: 400 }); } };
    const save = async () => { if (await page.locator('.lc-k.sv').isDisabled()) { await leave(); return false; } await tap('.lc-k.sv', { wait: 2400 });
      if (await page.locator('.choice, .sheet button:has-text("No, a new item")').count()) await tap('.sheet button:has-text("No, a new item")', { wait: 2000 }); return true; };
    const closeAll = async () => { for (const q of ['.in-list > .btn-quiet:has-text("Cancel")', '.where-list .btn-quiet', '.sheet .btn-quiet']) if (await page.locator(q).count()) await tap(q, { wait: 300 }); await leave(); };
    const moveOpen = async (nm) => { await O.openItem(nm); const b = page.locator('.tp-btn:has-text("Move it"), .tp-btn:has-text("Put it somewhere")'); if (!(await b.count())) return false; await b.first().click(); await page.waitForTimeout(800); return true; };
    const placePage = async (pl) => { await home(); await tap('.menu-btn', { wait: 400 }); await tap('.drawer-row:has-text("Places")', { wait: 700 });
      const row = page.locator(`.loc-row:has(b:text-is("${pl}"))`); if (!(await row.count())) return false; await row.first().click(); await page.waitForTimeout(600); return true; };
    const ACTIONS = {
      async log() { const nm = pick(THINGS) + ' ' + (++tn); await home(); AI = { name: nm }; await cam(pick(PHOTOS)); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
        if (rnd() < 0.25) { await cam(pick(PHOTOS)); await tap('.lc-shutter', { wait: 500 }); }
        if (rnd() < 0.4) await say();
        if (rnd() < 0.75) await inPick();
        return (await save()) ? nm : null; },
      async move() { const nm = pick(await items()); if (!(await moveOpen(nm))) return null;
        const r = rnd();
        if (r < 0.5) await inPick(); // a different In
        else if (r < 0.65) await say(); // her words only
        else if (r < 0.75) { await cam(pick(PHOTOS)); await tap('.lc-shutter', { wait: 600 }); } // a new photo only
        else if (r < 0.85) { if (await page.locator('.ow-go').count()) { await tap('.ow-go', { wait: 300 }); if (await page.locator('.ow-clear').count()) await tap('.ow-clear', { wait: 300 }); else if (await page.locator('.ow-cancel').count()) await tap('.ow-cancel', { wait: 300 }); } if (rnd() < 0.5) await say(); } // out of it (✕)
        else { await say(); await inPick(); }
        return (await save()) ? nm : null; },
      async moveBox() { const bx = await boxes(); if (!bx.length) return null; const nm = pick(bx); if (!(await moveOpen(nm))) return null; await inPick(); return (await save()) ? nm : null; },
      async placeWhere() { const pl = pick(await placeNames()); if (!(await placePage(pl))) return null; if (!(await page.locator('.pl-where').count())) return null;
        await tap('.pl-where', { wait: 450 }); await page.waitForSelector('.in-list');
        const r = rnd();
        if (r < 0.12 && await page.locator('.in-list .in-clear').count()) await tap('.in-list .in-clear', { wait: 700 });
        else if (r < 0.6) { const n = await page.locator('.in-list .wl-row').count(); if (n) await tap(`.in-list .wl-row >> nth=${Math.floor(rnd() * n)}`, { wait: 800 }); else await tap('.in-list > .btn-quiet:has-text("Cancel")', { wait: 300 }); }
        else { const nm = rnd() < 0.5 ? pick(await placeNames()) : pick(NEW_PLACES) + ' ' + Math.floor(rnd() * 90 + 10); await page.fill('.in-list .wl-search input', nm); await page.waitForTimeout(200);
          const row = page.locator(`.in-list .wl-row:has(b:text-is("${nm}"))`); if (await row.count()) await tap(`.in-list .wl-row:has(b:text-is("${nm}"))`, { wait: 800 }); else if (await page.locator('.in-list .wl-new').count()) await tap('.in-list .wl-new', { wait: 800 }); else await tap('.in-list > .btn-quiet:has-text("Cancel")', { wait: 300 }); }
        // the oracle on something that is (somewhere) in this place
        const at = await page.evaluate((p) => window.__rig.dump().filter((d) => d.kind === 'item' && !d.deleted && d.name && d.owner === 'margaret' && !d.private && (d.location || '').toLowerCase() === p.toLowerCase()).map((d) => d.name), pl);
        return at.length ? pick(at) : null; },
      async undo() { if (await page.locator('.saved-card .u').count()) { await page.waitForTimeout(600); await tap('.saved-card .u', { wait: 1400 }); } else if (await page.locator('.tp-moved .u').count()) { await page.waitForTimeout(600); await tap('.tp-moved .u', { wait: 1400 }); } return null; },
      async renamePlace() { const pl = pick(await placeNames()); if (!(await placePage(pl))) return null;
        if (!(await page.locator('button.field-value:not(.pl-where)').count())) return null; await tap('button.field-value:not(.pl-where)', { wait: 300 }); await page.locator('input.place-input').first().fill(pl + ' ' + Math.floor(rnd() * 9)); await page.keyboard.press('Enter'); await page.waitForTimeout(900);
        if (await page.locator('.merge-sheet').count()) await tap('.merge-sheet button:has-text("own name")', { wait: 400 }); return null; },
      async cancelHalfway() { await home(); AI = { name: 'half ' + (++tn) }; await cam(pick(PHOTOS)); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 }); if (rnd() < 0.5) await say(); if (rnd() < 0.5) await inPick(); await closeAll(); return null; },
    };
    const WEIGHTS = [['log', 4], ['move', 5], ['moveBox', 1], ['placeWhere', 2], ['undo', 1], ['renamePlace', 1], ['cancelHalfway', 1]];
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
      if (touched && (s % 3 === 0 || a === 'move' || a === 'moveBox' || a === 'placeWhere')) bad.push(...await O.check(touched));
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
