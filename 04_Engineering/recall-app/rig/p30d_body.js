  // audit_p30d (= tiers_head.js + p30d_body.js) — Ravi's phone test of 20260930c (09-30, 10:27–10:32):
  // P1 the photo viewer puts "photo 1 of 3" in a different spot in the camera than on the item page;
  // P2 the item page says "seen" at the time of a Move nobody photographed; the cover photo's time is the Move's too;
  // P3 Choose place gives no clue which tier it changes (and "Current place" only for level 1); the camera doesn't either;
  // P4 after Choose place on a tier that had a photo, the square keeps the OLD photo (and the old photo went onto the new place);
  // P5 "nothing here yet" under a place that holds another place; P6 "the in air".
  //
  // Retired 2026-10-01 (release 1 — the tier camera is gone):
  //   P3 "the chain line marks the tier Choose place will change (level 1)" — no chain line, no tiers in the camera.
  //   P3 "Choose place (level 1) shows the whole chain and marks what it changes" — no Choose place header (.wl-chg) in the camera.
  //   P3 "tier 2 selected: the chain line marks the Ikea shelving unit" — no tier squares to select.
  //   P3 "Choose place (tier 2) marks the Ikea shelving unit …" — no tier 2 in the camera.
  //   P3 "… the Ikea shelving unit row says Current place (not only for level 1)" — no tier 2; "Current place" for the one
  //      In is kept (P3 "… the White cardboard box row says Current place", now in the In list).
  //   P4 "the square of the tier just changed shows the place picked (In air's photo)" — no squares, no place photos.
  //      (P4 "the Foyer's photo did not go onto In air" is kept: a camera photo never goes onto a place.)
  //   T3 "removing a named tier's only photo keeps its name (Place: Foyer bench)" — no tier photos, no "Place:" line.
  //      (T3 "Remove in the camera's viewer asks first" is kept, on the item's own photos.)
  //   T4 "a new tier on top, just photographed: the header says Choose what … is in" — no tiers, no Choose place header.
  //   T8 "a middle tier selected: the prompt is one sentence" — no tiers to select.
  //   F1 "Choose place wears the colour of the tier it changes" — no tiers, no Choose place.
  //   F2 "only the tier in focus is coloured" (camera chain line) and F2 "Choose place header: only the tier being changed is
  //      coloured" — no chain line, no Choose place header.
  async function runSuite() {
    const OUT = path.join(__dirname, 'shots_p30d'); fs.mkdirSync(OUT, { recursive: true });
    let n = 0; const snap = async (label) => { n++; const f = `p-${String(n).padStart(2, '0')}-${label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`; await page.waitForTimeout(250); await page.screenshot({ path: path.join(OUT, f) }); console.log('  [shot]', f); return f; };
    const openThing = async (nm) => { await home(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', nm); await page.waitForTimeout(350); await page.click('.ask .tile >> nth=0'); await page.waitForSelector('.card.thing'); await page.waitForTimeout(500); };
    const MOVE = '.tp-btn:has-text("Move it")';
    const move = async (nm = '3D model of plant sensor') => { await openThing(nm); await tap(MOVE, { wait: 900 }); };
    // 10-01: where = her words + ONE "In" (the In list). Pick by exact name, else a new place by that name.
    const pickPlace = async (name) => {
      await page.click(await page.locator('.w1-in.set').count() ? '.w1-in-open' : 'button.w1-in'); await page.waitForSelector('.in-list');
      await page.fill('.in-list .wl-search input', name); await page.waitForTimeout(200);
      const row = page.locator(`.in-list .wl-row:has(b:text-is("${name}"))`);
      if (await row.count()) await row.first().click(); else await page.locator('.in-list .wl-new').first().click();
      await page.waitForTimeout(250);
    };
    const openIn = async () => { await page.click(await page.locator('.w1-in.set').count() ? '.w1-in-open' : 'button.w1-in'); await page.waitForSelector('.in-list'); await page.waitForTimeout(250); };
    const leave = async () => { await tap('.lc-x', { wait: 400 }); if (await page.locator('button:has-text("Throw away"), button:has-text("Leave")').count()) await tap('button:has-text("Throw away"), button:has-text("Leave")', { wait: 400 }); };
    const placePage = async (nm) => { await home(); await tap('.menu-btn', { wait: 400 }); await tap('.drawer-row:has-text("Places")', { wait: 700 }); await tap(`.loc-row:has(b:text-is("${nm}"))`, { wait: 700 }); };
    const placeWhere = async (pl, to) => { await placePage(pl); await tap('.pl-where', { wait: 450 }); await page.waitForSelector('.in-list'); await page.fill('.in-list .wl-search input', to); await page.waitForTimeout(200);
      const row = page.locator(`.in-list .wl-row:has(b:text-is("${to}"))`); if (await row.count()) await row.first().click(); else await page.locator('.in-list .wl-new').first().click(); await page.waitForTimeout(900); };
    const chip = () => page.evaluate(() => ((document.querySelector('.lc .w1-in.set') || {}).innerText || '').replace(/\n/g, ' '));
    const H = 3600e3; const now = Date.now();
    const tail = (s) => (s || '').slice(-40);
    // Ravi's house, as on his phone: the 3D model is in the White cardboard box, in the Ikea shelving unit, in the Living room.
    // Logged (photographed) 50 h ago; nothing has moved since.
    await page.evaluate(([a, b, c, d, t]) => { const H = 3600e3; const P = (id, nm, im, ago) => ({ id, kind: 'place', owner: 'margaret', by: 'margaret', private: false, name: nm, order: t - ago, createdAt: t - ago, parent: null, photos: [{ photo: im, thumb: im, at: t - ago }] });
      const E = (id, from, to, ago) => ({ id, kind: 'edge', rel: 'in', from, to, since: t - ago, until: null, how: 'chosen', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [] });
      window.__rig.seed([
        P('pl7', 'White cardboard box', a, 93 * H), P('pik', 'Ikea shelving unit', b, 92 * H), P('plr', 'Living room', c, 91 * H), P('pair', 'In air', d, 60 * H),
        { id: 'ps', kind: 'item', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [], name: '3D model of plant sensor', location: 'White cardboard box', photo: d, thumb: d, thumbV: 2,
          order: t - 50 * H, createdAt: t - 50 * H, lastSeenAt: t - 50 * H, logId: 'l_ps', photoCount: 1, history: [{ location: 'White cardboard box', at: t - 50 * H }] },
        { id: 'sps', kind: 'snap', owner: 'margaret', by: 'margaret', itemId: 'ps', logId: 'l_ps', photo: d, thumb: d, location: 'White cardboard box', at: t - 50 * H, caption: '' },
        E('eps', 'ps', { t: 'place', name: 'White cardboard box' }, 50 * H), E('e7', 'pl7', { t: 'place', name: 'Ikea shelving unit' }, 92 * H), E('eik', 'pik', { t: 'place', name: 'Living room' }, 91 * H)]); },
    [img('box.jpg'), img('closet.jpg'), img('real_desk.jpg'), img('real_cetaphil.jpg'), now]);
    await page.evaluate(() => window.__rig.rules(true));


    // ---- P1: one photo viewer, one place for "photo 1 of N" — the item page (a place's photos) and the camera (the item's) ----
    await openThing('3D model of plant sensor');
    await page.locator('.tp-wh .ph-open').first().click(); await page.waitForTimeout(500);
    const v1 = await page.evaluate(() => { const m = document.querySelector('.d2-pv .d2-meta'); const im = document.querySelector('.d2-pv .d2-slide img'); return { there: !!m, text: m ? m.innerText : '', above: m && im ? m.getBoundingClientRect().bottom <= im.getBoundingClientRect().top + 2 : null }; });
    await snap('item page: a place photo in the viewer');
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    if (await page.locator('.d2-pv').count()) { await tap('.d2-pv .d2-x', { wait: 300 }); }
    await tap(MOVE, { wait: 900 });
    await tap('.lc-thing', { wait: 500 }); // the camera's own viewer: the item's photos
    const v2 = await page.evaluate(() => { const m = document.querySelector('.d2-pv .d2-meta'); const im = document.querySelector('.d2-pv .d2-slide img');
      return { viewer: document.querySelector('.d2-pv') ? 'd2' : document.querySelector('.lc-pv') ? 'camera-own' : 'none', text: m ? m.innerText : '', above: m && im ? m.getBoundingClientRect().bottom <= im.getBoundingClientRect().top + 2 : null }; });
    await snap('camera: the item photo in the viewer');
    check('P1', 'the camera shows photos in the SAME viewer as the item page — name · photo N of M in the top bar, above the photo', v1.there && v1.above && /White cardboard box · photo 1 of 1/.test(v1.text) && v2.viewer === 'd2' && v2.above && /3D model of plant sensor · photo 1 of 1/i.test(v2.text), JSON.stringify({ v1, v2 }));
    if (await page.locator('.d2-pv').count()) await tap('.d2-pv .d2-x', { wait: 300 });
    await leave();

    // ---- P3 (what is left of it): the In list marks where it is now "Current place" ----
    await move(); await snap('move it opens'); await openIn();
    const c1 = await page.evaluate(() => ({ cur: [...document.querySelectorAll('.in-list .wl-row')].filter((r) => r.querySelector('.wl-cur')).map((r) => r.querySelector('b').innerText) }));
    await snap('the In list from Move it');
    check('P3', '… and the White cardboard box row says Current place', c1.cur.length === 1 && /White cardboard box/.test(c1.cur[0]), JSON.stringify(c1.cur));
    // ---- P5: a place that holds another place is not "nothing here yet" ----
    await page.fill('.in-list .wl-search input', 'Ikea'); await page.waitForTimeout(200);
    const sub = await page.evaluate(() => { const r = [...document.querySelectorAll('.in-list .wl-row')].find((x) => /Ikea shelving unit/.test(x.querySelector('b').innerText)); return r ? r.querySelector('small').innerText : 'no row'; });
    check('P5', 'the In list: the Ikea shelving unit (it holds the White cardboard box) is not "nothing here yet" — "a place · 1 item"', !/nothing here yet/.test(sub) && /a place · 1 item\b/.test(sub), sub);
    await tap('.in-list > .btn-quiet:has-text("Cancel")', { wait: 300 }); await leave();

    // ---- P4 + P6: a photo in Move it + a NEW place (Foyer); the Foyer is then put In air from its own page ----
    const airPhotos0 = await page.evaluate(() => window.__rig.dump().find((x) => x.kind === 'place' && x.name === 'In air').photos.length);
    await move(); await cam('real_painting.jpg'); await tap('.lc-shutter', { wait: 900 }); await pickPlace('Foyer'); await tap('.lc-k.sv', { wait: 2600 });
    await placeWhere('Foyer', 'In air');
    const ph = await page.evaluate(() => { const d = window.__rig.dump(); const f = d.find((x) => x.kind === 'place' && x.name === 'Foyer'); return { air: d.find((x) => x.kind === 'place' && x.name === 'In air').photos.length, foyer: f ? (f.photos || []).length : null }; });
    check('P4', 'saved: the photo taken in Move it went onto neither the Foyer nor "In air" (camera photos are the item\'s)', ph.air === airPhotos0 && ph.foyer === 0, JSON.stringify({ airPhotos0, ...ph }));
    await move(); const c6 = await chip(); await snap('P6 chip in Foyer in In air'); await leave();
    await placePage('Foyer'); const w6 = await page.evaluate(() => (document.querySelector('.pl-where') || {}).innerText || '');
    check('P6', 'a place called "In air" is never "the in air" — not on the In chip (Foyer, in …), not on the Foyer\'s "Where this place is"', /Foyer/.test(c6) && /In air/.test(c6) && !/the in air/i.test(c6) && /In air/.test(w6) && !/the in air/i.test(w6), JSON.stringify({ chip: c6, where: w6 }));

    // ---- P2: "seen" only when it was photographed; a Move says "moved" ----
    // put the 3D model back as it was (in the White cardboard box, last photographed 50 h ago), with no photo of it since
    await page.evaluate(([im]) => { const t = Date.now(); const H = 3600e3; const d = window.__rig.dump();
      const open = d.filter((x) => x.kind === 'edge' && x.from === 'ps' && !x.until).map((x) => ({ ...x, until: t - 49 * H }));
      window.__rig.seed([...open, { id: 'eps2', kind: 'edge', rel: 'in', from: 'ps', to: { t: 'place', name: 'White cardboard box' }, since: t - 49 * H, until: null, how: 'undo', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [] },
        { ...d.find((x) => x.id === 'ps'), location: 'White cardboard box', photo: im, thumb: im, seenAt: t - 50 * H, lastSeenAt: t - 50 * H, history: [{ location: 'White cardboard box', at: t - 50 * H }] }]);
      d.filter((x) => x.kind === 'snap' && x.itemId === 'ps' && x.id !== 'sps').forEach((x) => window.__rig.seed([{ ...x, deleted: true, itemId: 'gone' }])); }, [img('real_cetaphil.jpg')]);
    await move(); await pickPlace('Pantry shelf'); await tap('.lc-k.sv', { wait: 2600 });
    await openThing('3D model of plant sensor');
    const when = await page.evaluate(() => [...document.querySelectorAll('.tp-blk small')].map((x) => x.innerText).join(' | '));
    await snap('item page after a move');
    check('P2', 'after a Move nobody photographed, the page says "moved …" and when it was last SEEN (50 h ago) — not "seen today"', /moved today/i.test(when) && /last seen/i.test(when) && !/(^|\|\s*)seen today/i.test(when), when);
    const stamp = await page.evaluate(() => { const s = document.querySelector('.photo-strip .stamp, .stamp'); return s ? s.innerText : ''; });
    await page.locator('img.photo-full').first().click(); await page.waitForTimeout(500);
    const vt = await page.evaluate(() => (document.querySelector('.d2-pv .d2-meta') || {}).innerText || '');
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    check('P2', 'the photo\'s own time is when it was TAKEN (2 days ago), not the time of the Move', !/Today/.test(vt) && (!stamp || !/Today/.test(stamp)), JSON.stringify({ vt, stamp }));
    // a photo taken later → "seen" again. (Seeded: a real photo taken now, after the move.)
    await page.evaluate(([im]) => { const t = Date.now(); window.__rig.seed([{ id: 'sps2', kind: 'snap', owner: 'margaret', by: 'margaret', itemId: 'ps', logId: 'l_ps2', photo: im, thumb: im, location: 'Pantry shelf', at: t, caption: '', extra: true }]); }, [img('real_pencil.jpg')]);
    await openThing('3D model of plant sensor');
    const when2 = await page.evaluate(() => [...document.querySelectorAll('.tp-blk small')].map((x) => x.innerText).join(' | '));
    check('P2', 'a photo of it taken after the move → "seen today …" (no "moved")', /seen today/i.test(when2) && !/moved/i.test(when2), when2);
    // moving what it's in moves it too: the Kitchen counter (in the Craft nook) goes to the Pantry shelf — from its own page — → the batteries "moved with the Kitchen counter"
    await page.evaluate(() => window.__rig.seed([{ id: 'ekcp', kind: 'edge', rel: 'in', from: 'pl1', to: { t: 'place', name: 'Craft nook' }, since: Date.now() - 99 * 3600e3, until: null, how: 'chosen', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [] }]));
    await placeWhere('Kitchen counter', 'Pantry shelf');
    await openThing('spare batteries');
    const when3 = await page.evaluate(() => [...document.querySelectorAll('.tp-blk small')].map((x) => x.innerText).join(' | '));
    await snap('batteries after their counter moved');
    check('P2', 'its counter moved to the Pantry shelf → "moved with the Kitchen counter …", not "seen"', /moved with the Kitchen counter today/i.test(when3) && /last seen/.test(when3), when3);

    // ======== 09-30d independent tester (REPORT_d.md) ========
    // the iPhone keyboard stand-in (as audit_chain): installed before the app loads, so the app's keyboard watcher sees it
    await page.addInitScript(() => { const et = new EventTarget(); let h = null; const Hh = () => (h === null ? window.innerHeight : h);
      Object.defineProperty(et, 'height', { get: Hh }); Object.defineProperty(et, 'offsetTop', { get: () => 0 }); Object.defineProperty(et, 'width', { get: () => window.innerWidth });
      Object.defineProperty(window, 'visualViewport', { configurable: true, get: () => et }); window.__kb = (px) => { h = window.innerHeight - px; et.dispatchEvent(new Event('resize')); }; });
    // T1: with the keyboard up, what you type stays in sight — the In list's search and its row, and her words field
    await move('baseball card'); await openIn();
    await page.locator('.in-list .wl-search input').click(); await page.evaluate(() => window.__kb(380)); await page.waitForTimeout(250);
    await page.keyboard.type('Pan', { delay: 40 }); await page.waitForTimeout(350);
    const t1 = await page.evaluate(() => { const r = [...document.querySelectorAll('.in-list .wl-row')].find((x) => /Pantry shelf/.test(x.innerText)); const b = r ? r.getBoundingClientRect() : null; const i = document.querySelector('.in-list .wl-search input').getBoundingClientRect(); return { row: b ? Math.round(b.bottom) : null, input: Math.round(i.bottom), limit: window.innerHeight - 380 }; });
    await snap('T1 keyboard up typing Pan');
    check('T1', 'the In list, keyboard up, "Pan" typed: the search and the Pantry shelf row sit above the keyboard', t1.row !== null && t1.row <= t1.limit && t1.input <= t1.limit, JSON.stringify(t1));
    await page.evaluate(() => window.__kb(0)); await tap('.in-list > .btn-quiet:has-text("Cancel")', { wait: 300 });
    await page.locator('.w1-words input').click(); await page.evaluate(() => window.__kb(380)); await page.waitForTimeout(250);
    await page.keyboard.type('top shelf', { delay: 30 }); await page.waitForTimeout(300);
    const t1w = await page.evaluate(() => { const i = document.querySelector('.w1-words input').getBoundingClientRect(); return { input: Math.round(i.bottom), top: Math.round(i.top), limit: window.innerHeight - 380 }; });
    await snap('T1 keyboard up typing words');
    check('T1', 'her words field, keyboard up, typing: the field sits above the keyboard (and on the screen)', t1w.input <= t1w.limit && t1w.top >= 0, JSON.stringify(t1w));
    await page.evaluate(() => window.__kb(0)); await leave();
    // T1b: Largest text on a small iPhone, no keyboard: the first row of the In list is on the screen
    await page.setViewportSize({ width: 375, height: 667 }); await setPrefs({ size: 'largest' });
    await move('baseball card'); await openIn();
    const t1b = await page.evaluate(() => { const r = document.querySelector('.in-list .wl-row'); return r ? Math.round(r.getBoundingClientRect().top) : null; });
    await snap('T1b largest 375 in list');
    check('T1', 'Largest on 375x667: the first row of the In list starts on the screen (it started at 693 px)', t1b !== null && t1b < 667 - 40, String(t1b));
    if (await page.locator('.in-list').count()) await page.locator('.in-list > .btn-quiet:has-text("Cancel")').click({ force: true, timeout: 3000 }).catch(() => {}); await page.waitForTimeout(300); await leave();
    await page.setViewportSize({ width: 390, height: 844 }); await setPrefs({ size: 'normal' });
    // T6: the current place is the first row
    await move('baseball card'); await openIn();
    const t6 = await page.evaluate(() => { const r = document.querySelector('.in-list .wl-scroll .wl-row'); return r ? r.innerText.replace(/\n/g, ' | ') : ''; });
    check('T6', 'the In list: where it is now ("Current place") is the first row, not somewhere below', /Current place/.test(t6) && /Wooden box/.test(t6), t6);
    await tap('.in-list > .btn-quiet:has-text("Cancel")', { wait: 300 }); await leave();
    // T2: Undo of a Move → not "moved"
    await openThing('3D model of plant sensor');
    const before = await page.evaluate(() => [...document.querySelectorAll('.tp-blk small')].map((x) => x.innerText).join(' | '));
    await tap(MOVE, { wait: 900 }); await pickPlace('Linen closet'); await tap('.lc-k.sv', { wait: 2600 });
    await tap('.tp-moved button:has-text("Undo")', { wait: 1500 });
    await openThing('3D model of plant sensor');
    const after = await page.evaluate(() => [...document.querySelectorAll('.tp-blk small')].map((x) => x.innerText).join(' | '));
    check('T2', 'Move then Undo: the page says what it said before the Move (an undone move is not a move)', after === before, JSON.stringify({ before, after }));
    // T5 + T3: the camera's viewer (the item's photos while logging): title with the count even for one photo; Remove asks first
    await home(); AI = { name: 'bench cushion' }; await cam('real_slippers.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1500 });
    await tap('.lc-thing', { wait: 500 });
    const t5 = await page.evaluate(() => (document.querySelector('.d2-pv .d2-meta') || {}).innerText || '');
    check('T5', 'the camera viewer\'s title has the count even for one photo, like the item page ("Bench cushion · photo 1 of 1")', /Bench cushion · photo 1 of 1/i.test(t5), t5);
    await tap('.d2-pv .d2-pill.rm', { wait: 400 });
    const t3a = await page.evaluate(() => ({ confirm: [...document.querySelectorAll('.sheet-title, .confirm h2, [role=alertdialog]')].map((x) => x.innerText).join(' | '), viewer: !!document.querySelector('.d2-pv') }));
    check('T3', 'Remove in the camera\'s viewer asks first ("Remove this photo?"), like the item page', /Remove this photo\?/.test(t3a.confirm), JSON.stringify(t3a));
    if (await page.locator('.pv-ask button:has-text("Keep")').count()) await tap('.pv-ask button:has-text("Keep")', { wait: 300 });
    if (await page.locator('.d2-pv').count()) await tap('.d2-pv .d2-x', { wait: 300 });
    await leave();
    // T7: "moved with the Wooden box" — a box keeps its capital
    await page.evaluate(() => window.__rig.seed([{ id: 'ew', kind: 'edge', rel: 'in', from: 'w', to: { t: 'thing', id: 'm', name: 'memorabilia box' }, since: Date.now() - 80 * 3600e3, until: null, how: 'chosen', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [] }]));
    await move('wooden box'); await pickPlace('Pantry shelf'); await tap('.lc-k.sv', { wait: 2600 });
    await openThing('baseball card');
    const t7 = await page.evaluate(() => [...document.querySelectorAll('.tp-blk small')].map((x) => x.innerText).join(' | '));
    check('T7', 'the card in the wooden box: "moved with the Wooden box" (the name as written everywhere)', /moved with the Wooden box/.test(t7), t7);
    // ---- S1 (Ravi 09-30): Move it opens with nothing changed → Save is off; any change turns it on ----
    await move('baseball card');
    const s0 = await isDisabled('.lc-k.sv');
    await snap('S1 move it just opened');
    check('S1', 'Move it, just opened (nothing changed): Save is off', s0 === true, String(s0));
    await pickPlace('Linen closet');
    const s1 = await isDisabled('.lc-k.sv');
    check('S1', '… a different place picked: Save is on', s1 === false, String(s1));
    await leave();
  }
  await seedHouse();
  try { await runSuite(); } catch (e) { console.error('FATAL', e); check('P', 'suite ran', false, e.message); }
  await browser.close();
}
(async () => {
  await new Promise((r) => server.listen(PORT, r));
  await runLook('b');
  const pass = results.filter((r) => r.ok).length;
  console.log(`\n${pass}/${results.length} checks passed`);
  console.log('Page errors:', errors.length ? errors : 'none');
  console.log('Console errors:', consoleErrors.length ? consoleErrors.slice(0, 5) : 'none');
  server.close();
})();
