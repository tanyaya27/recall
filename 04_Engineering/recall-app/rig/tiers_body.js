  // =================================================================================================
  // audit_tiers — multi-tier "where" (levels 1..3), every kind at every tier, logic AND screens.
  // Each scenario: fresh house, the REAL rules on, drive the camera like a person, then record what
  // was stored (places' parent, edges, the thing's location) and what every screen says afterwards.
  const RECORD = [];
  async function runSuite(look) {
    const shot = makeShot(look);
    const camState = () => page.evaluate(() => ({ open: !!document.querySelector('.lc'), say: (document.querySelector('.lc-say .tx') || {}).innerText || '', prompt: (document.querySelector('.lc-prompt') || {}).innerText || '', saveTxt: (document.querySelector('.lc-k.sv') || {}).innerText || '', saveDis: (document.querySelector('.lc-k.sv') || {}).disabled ?? null, chips: [], ask: (document.querySelector('.lc-ask2') || {}).innerText || '', chain: (document.querySelector('.lc-chainline') || {}).innerText || '', err: (document.querySelector('.lc-err') || {}).innerText || '' }));
    const fresh = async () => { WHERE.length = 0; NEXT_WHERE_DELAY = 0; NEXT_WHERE_BADJSON = false; await seedHouse(); SAME = { index: -1, sure: false }; await home(); await page.evaluate(() => window.__rig.rules(true)); await page.waitForTimeout(200); };
    let lastFind = null;
    const openThing = async (nm) => {
      await home(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask');
      await page.fill('#ask-input', nm); await page.waitForTimeout(350);
      lastFind = await page.evaluate(() => { const t = document.querySelector('.ask .tile'); return t ? t.innerText.replace(/\n/g, ' | ') : null; });
      if (!lastFind) return false;
      await page.click('.ask .tile >> nth=0'); await page.waitForSelector('.card.thing'); await page.waitForTimeout(400); return true;
    };
    const thingWhere = async () => page.evaluate(() => { const w = document.querySelector('.tp-wh'); return w ? { text: w.innerText.replace(/\n/g, ' | '), squares: w.querySelectorAll('.st').length } : null; });
    const placesScreen = async () => { await home(); await tap('.menu-btn', { wait: 400 }); await tap('.drawer-row:has-text("Places")', { wait: 700 });
      return page.evaluate(() => [...document.querySelectorAll('.loc-row')].map((r) => r.innerText.replace(/\n/g, ' | '))); };
    // 09-29g camera card: every pick goes through "☰ Choose place" (no pills).
    const pickWhere = async (name) => {
      if (!(await page.locator('.where-list').count())) await tap('.lc-choose', { wait: 600 });
      await type('.wl-search input', name);
      const row = page.locator(`.where-list .wl-row:not(.wl-sugg):has-text("${name}")`);
      if (await row.count()) { await row.first().click(); await page.waitForTimeout(500); return 'list'; }
      await tap('.wl-new.typed', { wait: 500 }); return 'typed';
    };
    // after a where photo: wait while ReCall looks; if Choose place opened to name it, take ReCall's name (or `fallback`).
    const openTier = async (i) => { const sq = page.locator('.lv-strip .lv-sq').nth(i); if (!/\bsel\b/.test(await sq.getAttribute('class'))) { await sq.click(); await page.waitForTimeout(300); } await sq.click(); await page.waitForTimeout(400); };
    const settleWhere = async (fallback = '') => {
      for (let k = 0; k < 40; k++) { if (!(await page.locator('.lv-look').count())) break; await page.waitForTimeout(150); }
      for (let k = 0; k < 8 && !(await page.locator('.wl-pend .btn-primary').count()) && !(await page.locator('.lc-ask2').count()); k++) await page.waitForTimeout(150); // the sheet can open a beat after the look ends
      if (await page.locator('.wl-pend .btn-primary').count()) {
        if (await page.locator('.wl-pend .btn-primary').isDisabled()) await page.locator('.wl-pend input').fill(fallback || ('Spot ' + (Date.now() % 100000)));
        await page.click('.wl-pend .btn-primary'); await page.waitForTimeout(300);
      }
    };
    const newThing = async (nm) => { AI = { name: nm }; await cam('real_slippers.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 }); };
    const move = async (nm) => { await openThing(nm); await tap('button:has-text("Move it"), button:has-text("Put it somewhere")', { wait: 900 }); };
    const plus = async () => { await tap('.lv-sq.plus', { wait: 350 }); };
    const shoot = async (f, where, raw = false) => { if (where) WHERE.push(where); await cam(f); await tap('.lc-shutter', { wait: 1900 }); if (!raw) await settleWhere(); };
    const save = async () => { await tap('.lc-k.sv', { wait: 2600 }); };
    const store = async () => { const d = await dump(); const byId = Object.fromEntries(d.map((x) => [x.id, x]));
      return { places: d.filter((x) => x.kind === 'place').map((p) => ({ id: p.id, name: p.name, parent: p.parent ? (byId[p.parent] || {}).name || p.parent : null, photos: (p.photos || []).length })),
        edges: d.filter((x) => x.kind === 'edge' && !x.until).map((e) => `${(byId[e.from] || {}).name || e.from} → ${e.to.t}:${e.to.name}`),
        items: d.filter((x) => x.kind === 'item' && !x.deleted).map((i) => ({ name: i.name, location: i.location })) }; };
    const ONLY = (process.argv[3] || '').split(',').filter(Boolean);
    const scen = async (id, title, fn) => {
      if (ONLY.length && !ONLY.includes(id)) return;
      const rec = { id, title, steps: [], cam: [], err: '' }; RECORD.push(rec);
      try {
        await fresh(); const before = await store(); rec.before = before;
        await fn(rec);
      } catch (e) { rec.err = e.message.slice(0, 300); console.log('SCENARIO ERROR', id, e.message.slice(0, 300)); await page.screenshot({ path: `${OUTDIR}/${id}-ERROR.png` }).catch(() => {}); }
    };
    const openEdgesFrom = async (placeName) => page.evaluate((n) => { const d = window.__rig.dump(); const p = d.find((x) => x.kind === 'place' && x.name.toLowerCase() === n.toLowerCase()); if (!p) return null; return d.filter((e) => e.kind === 'edge' && e.from === p.id && !e.until).map((e) => e.to.t + ':' + (e.to.name || '').toLowerCase()); }, placeName);
    const inOf = async (placeName) => { const e = await openEdgesFrom(placeName); return e && e.length === 1 ? e[0] : (e && e.length ? 'MANY ' + e.join(',') : 'none'); };
    const snapCam = async (rec, label) => { const s = await camState(); rec.cam.push({ label, ...s }); await shot(rec.id, label); return s; };
    const after = async (rec, thingName, l1Place) => {
      const card = await page.evaluate(() => { const c = document.querySelector('.saved-card'); return c ? { text: c.innerText.replace(/\n/g, ' | '), trail: c.querySelectorAll('.trail img, .trail .ph').length } : null; });
      rec.saved = card; if (card) await shot(rec.id, 'saved card');
      const st = await camState(); rec.camOpenAfterSave = st.open; rec.camErr = st.err;
      rec.after = await store();
      const diff = (a, b) => b.filter((x) => !a.some((y) => JSON.stringify(y) === JSON.stringify(x)));
      rec.changed = { places: diff(rec.before.places, rec.after.places), edges: diff(rec.before.edges, rec.after.edges), items: diff(rec.before.items, rec.after.items) };
      if (st.open) return;
      if (await openThing(thingName)) { rec.findTile = lastFind; rec.thingPage = await thingWhere(); await shot(rec.id, 'thing page: Where it is'); }
      rec.placesList = await placesScreen(); await shot(rec.id, 'Places list');
    };

    // S1 — Ravi's exact case: Move it on a thing at a known place (level 1 = current place), ＋, photograph
    // the next tier twice (a NEW place), Save.
    await scen('S1', 'Move: current place (Desk drawer) + new place at tier 2', async (rec) => {
      await move('3D model of plant sensor'); await snapCam(rec, 'move opens');
      await plus(); await snapCam(rec, 'tier 2 selected');
      await shoot('real_desk.jpg', { name: 'In air', moves: false, sure: false }); await shoot('closet.jpg');
      await snapCam(rec, 'tier 2 has 2 photos');
      const b0 = await byName('3D model of plant sensor');
      await save(); await after(rec, '3D model of plant sensor');
      check('S1', 'Save closed the camera', rec.camOpenAfterSave === false, rec.camErr || '');
      check('S1', 'Desk drawer is IN "In air" (the tier-2 edge exists)', (await inOf('Desk drawer')) === 'place:in air', await inOf('Desk drawer'));
      check('S1', '"In air" has the 2 photos', ((await placeByName('In air')) || {}).photos?.length === 2, '');
      const b1 = await byName('3D model of plant sensor');
      check('S1', 'the thing itself did not move (no new history line)', (b1.history || []).length === (b0.history || []).length && b1.location === b0.location, `hist ${(b0.history || []).length}->${(b1.history || []).length}`);
      await move('3D model of plant sensor'); const s2 = await camState();
      check('S1', 'Move it again: "Place: Desk drawer", and the chain line says where it is ("Desk drawer in In air")', /place:\s*desk drawer/i.test(s2.say) && /desk drawer\s*in\s*in air/i.test(s2.chain), s2.say + ' | ' + s2.chain);
      await shot('S1', 'Move it again: tier 1 shows its own where');
    });
    // S2 — a brand-new thing, three NEW places.
    await scen('S2', 'Log: new place > new place > new place', async (rec) => {
      await newThing('stapler');
      await plus(); await shoot('drawer.jpg', { name: 'Drawer 3', moves: false });
      await plus(); await shoot('closet.jpg', { name: 'Oak cabinet', moves: false });
      await plus(); await shoot('real_desk.jpg', { name: 'Office', moves: false });
      await snapCam(rec, 'three new tiers');
      const stripNow = await page.evaluate(() => { const p = document.querySelector('.lv-sq.plus'); const c = document.querySelector('.lc-card'); return p && c ? Math.round(p.getBoundingClientRect().right - c.getBoundingClientRect().right) : null; });
      check('S2', 'at three tiers the ＋ square is inside the card (not cut off / out of sight)', stripNow !== null && stripNow <= 0, 'overhang px=' + stripNow);
      rec.strip = await page.evaluate(() => { const s = document.querySelector('.lv-strip'); const p = document.querySelector('.lv-sq.plus'); const c = document.querySelector('.lc-card'); const r = (e) => e && e.getBoundingClientRect(); return s && { scrollW: s.scrollWidth, clientW: s.clientWidth, overflowX: getComputedStyle(s).overflowX, plusRight: p ? Math.round(r(p).right) : null, cardRight: Math.round(r(c).right) }; }); await save(); await after(rec, 'stapler');
      check('S2', 'Drawer 3 is in the Oak cabinet', (await inOf('Drawer 3')) === 'place:oak cabinet', await inOf('Drawer 3'));
      check('S2', 'the Oak cabinet is in the Office', (await inOf('Oak cabinet')) === 'place:office', await inOf('Oak cabinet'));
      check('S2', 'the Office is in nothing', (await inOf('Office')) === 'none', await inOf('Office'));
      // Q1 · Ravi 09-29: every tier on the thing's page — squares scroll sideways, the words show every tier with a separator.
      const tp = rec.thingPage || { text: '', squares: 0 };
      check('S2', 'Q1: the thing\'s page shows all 3 tiers as squares', tp.squares === 3, JSON.stringify(tp));
      check('S2', 'Q1 (09-29h): the words show every tier with the "in" pill: "Drawer 3 in Oak cabinet in Office"', /Drawer 3 \| in \| Oak cabinet \| in \| Office/.test(tp.text), tp.text);
      check('S2', 'Q2: Places says "in Oak cabinet" under Drawer 3', (rec.placesList || []).some((r) => /^Drawer 3 \| in Oak cabinet · /.test(r)), JSON.stringify((rec.placesList || []).slice(0, 3)));
    });
    // S3 — a new thing: known place > known place.
    await scen('S3', 'Log: known place (Kitchen counter) > known place (Craft nook)', async (rec) => {
      await newThing('stapler');
      await plus(); rec.steps.push(await pickWhere('Kitchen counter'));
      await plus(); rec.steps.push(await pickWhere('Craft nook'));
      await snapCam(rec, 'known > known'); await save();
      check('S3', 'Kitchen counter (known) is in Craft nook (known)', (await inOf('Kitchen counter')) === 'place:craft nook', await inOf('Kitchen counter'));
      const hasUndo = await page.locator('.saved-card .u').count();
      if (hasUndo) { await tap('.saved-card .u', { wait: 1200 }); check('S3', 'Undo takes the tier-2 link away again', (await inOf('Kitchen counter')) === 'none', await inOf('Kitchen counter')); }
      else check('S3', 'Undo on the saved card', false, 'no Undo button');
      await after(rec, 'stapler');
    });
    // S4 — known place > known place, when the first ALREADY has a different parent (set up by S3's path first).
    await scen('S4', 'Re-parent: Kitchen counter was in Craft nook; now say Kitchen counter > Pantry shelf', async (rec) => {
      await newThing('stapler'); await plus(); await pickWhere('Kitchen counter'); await plus(); await pickWhere('Craft nook'); await save();
      rec.mid = await store();
      await home(); await newThing('tape');
      await plus(); rec.steps.push(await pickWhere('Kitchen counter'));
      // 09-29h: picking Kitchen counter brings what it's already in (Craft nook) as tier 2 — change THAT square to re-parent.
      const sq4 = await page.evaluate(() => [...document.querySelectorAll('.lv-strip .lv-sq:not(.plus)')].map((b) => b.getAttribute('aria-label')));
      check('S4', '09-29h: picking Kitchen counter shows where it already is as tier 2 (Craft nook)', sq4.length === 2 && /Craft nook/.test(sq4[1] || ''), JSON.stringify(sq4));
      await openTier(1); await tap('.tier-sheet .sheet-row:has-text("Choose place")', { wait: 500 }); rec.steps.push(await pickWhere('Pantry shelf'));
      await snapCam(rec, 'known > different known'); await save(); await after(rec, 'tape');
      check('S4', 'Kitchen counter has exactly one "where" (the last one said)', (await inOf('Kitchen counter')) === 'place:pantry shelf', await inOf('Kitchen counter'));
      const c4 = rec.cam[rec.cam.length - 1] || {};
      check('S4', 'Q3: before Save the camera says "Kitchen counter: Craft nook → Pantry shelf"', /Kitchen counter: Craft nook → Pantry shelf/.test(c4.say || ''), c4.say);
      check('S4', 'Q3: the saved card says it too', /Kitchen counter: Craft nook → Pantry shelf/.test((rec.saved || {}).text || ''), (rec.saved || {}).text);
    });
    // S5 — a place inside a box: known place > known box.
    await scen('S5', 'Q4: outside a place there are only places (Linen closet, then tier 2)', async (rec) => {
      await newThing('stapler');
      await plus(); rec.steps.push(await pickWhere('Linen closet'));
      await plus(); const st = await camState();
      const boxChips = 0;
      await tap('.lc-choose', { wait: 600 }); const boxRows = await page.evaluate(() => [...document.querySelectorAll('.wl-row .tx b')].filter((r) => /tin box|tool drawer|filing cabinet|memorabilia/i.test(r.innerText)).length);
      await snapCam(rec, 'tier 2 after a place: the Choose place list');
      check('S5', 'Q4: no box is offered for where a place is (Choose place list)', boxRows === 0, `boxRows=${boxRows}`);
      await tap('.where-list .btn-quiet, .where-list button:has-text("Cancel")', { wait: 400 });
      if (await page.locator('.lv-sq.plus').count()) await plus();
      await shoot('smallbox.jpg', { name: 'backpack', moves: true });
      await snapCam(rec, 'photographed at tier 2: the AI says it moves'); await save(); await after(rec, 'stapler');
      check('S5', 'Q4: photographed outside a place, it is saved as a place (Linen closet in Backpack; no box made)', (await inOf('Linen closet')) === 'place:backpack' && !(await byName('backpack')), await inOf('Linen closet'));
    });
    await scen('S6', 'Log: known box (tin box, at Garage) > known place (Craft nook)', async (rec) => {
      await newThing('stapler');
      await plus(); rec.steps.push(await pickWhere('Tin box'));
      await snapCam(rec, 'box selected (its own place shows as tier 2)');
      await openTier(1); await tap('.tier-sheet .sheet-row:has-text("Choose place")', { wait: 500 }); rec.steps.push(await pickWhere('Craft nook'));
      const c6 = await snapCam(rec, 'box > place'); await save(); await after(rec, 'stapler');
      check('S6', 'Q3: a box with a place, given another: "Tin box: Garage → Craft nook" before Save and on the card', /Tin box: Garage → Craft nook/.test(c6.say) && /Tin box: Garage → Craft nook/.test((rec.saved || {}).text || ''), c6.say + ' || ' + ((rec.saved || {}).text || ''));
    });
    // S7 — new box > new place > known place.
    await scen('S7', 'Log: new box > new place > known place (Linen closet)', async (rec) => {
      await newThing('stapler');
      await plus(); await shoot('box14.jpg', { name: 'shoe box', moves: true });
      await plus(); await shoot('closet.jpg', { name: 'Top shelf', moves: false });
      await plus(); rec.steps.push(await pickWhere('Linen closet'));
      await snapCam(rec, 'new box > new place > known'); await save(); await after(rec, 'stapler');
      check('S7', 'the new Top shelf is in the Linen closet (an edge, not a field nothing reads)', (await inOf('Top shelf')) === 'place:linen closet', await inOf('Top shelf'));
      check('S7', 'the shoe box is at Top shelf', /top shelf/i.test(((await byName('shoe box')) || {}).location || ''), '');
      const tp = rec.thingPage || { text: '' };
      check('S7', 'Q1 (09-29h): a box then two places: "Shoe box in Top shelf in Linen closet"', /Shoe box \| in \| Top shelf \| in \| Linen closet/.test(tp.text), tp.text);
    });
    // S8 — the AI can't name two different new places, in two separate saves → both "A place"?
    await scen('S8', 'Two unnamed new places in two saves', async (rec) => {
      // 09-29g: ReCall can't name it → Choose place opens with an empty name; closing it leaves the tier unnamed.
      const closeChoose = async () => { if (await page.locator('.where-list').count()) await tap('.where-list .btn-quiet', { wait: 400 }); };
      await newThing('stapler'); await plus(); NEXT_WHERE_BADJSON = true; await shoot('closet.jpg', { name: '', moves: false }, true);
      const pend1 = await page.locator('.wl-pend input').inputValue().catch(() => null);
      check('S8', 'ReCall could not name it: Choose place opens with an empty name to fill in', pend1 === '', 'draft=' + pend1);
      await closeChoose();
      await snapCam(rec, 'unnamed tier'); await save(); rec.mid = await store();
      await home(); await newThing('tape'); await plus(); NEXT_WHERE_BADJSON = true; await shoot('real_desk.jpg', { name: '', moves: false }, true); await closeChoose();
      const st2 = await snapCam(rec, 'second unnamed tier');
      check('S8', 'the unnamed tier is spoken of as "this place" (never "the a place")', /what this place is in/.test(st2.prompt) && !/the a place/i.test(st2.prompt), st2.prompt);
      check('S8', 'a second unnamed place can\'t be saved into the first: Save waits for a name', st2.saveDis === true && /needs its own name/i.test(st2.say), st2.say + ' saveDis=' + st2.saveDis);
      const sq = page.locator('.lv-strip .lv-sq').nth(0); if (!/\bsel\b/.test(await sq.getAttribute('class'))) { await sq.click(); await page.waitForTimeout(300); }
      await sq.click(); await page.waitForTimeout(400); await tap('.tier-sheet .sheet-row:has-text("Rename")', { wait: 500 });
      await type('.sheet .place-input', 'Hall shelf'); await tap('.sheet .btn-primary', { wait: 600 });
      await save(); await after(rec, 'tape');
      const ap = (await places()).filter((p) => p.name === 'A place');
      check('S8', 'two different spots stay two places (A place: 1 photo; Hall shelf: 1 photo)', ap.length === 1 && ap[0].photos.length === 1 && ((await placeByName('Hall shelf')) || {}).photos?.length === 1, JSON.stringify(ap.map((p) => p.photos.length)));
      check('S8', 'the tape is at Hall shelf, the stapler still at A place', /hall shelf/i.test((await byName('tape')).location) && /a place/i.test((await byName('stapler')).location), '');
    });
    // S9 — Move: keep the current place, add a KNOWN place at tier 2.
    await scen('S9', 'Move: current place (Desk drawer) + known place (Craft nook) at tier 2', async (rec) => {
      await move('3D model of plant sensor'); await plus(); rec.steps.push(await pickWhere('Craft nook'));
      await snapCam(rec, 'current > known'); await save(); await after(rec, '3D model of plant sensor');
      check('S9', 'Move: Desk drawer is in Craft nook', (await inOf('Desk drawer')) === 'place:craft nook', await inOf('Desk drawer'));
    });
    // S10 — Move a thing whose current place is a BOX; tier 2 new place.
    await scen('S10', 'Move: current = wooden box (in memorabilia box) + new place at tier 2', async (rec) => {
      await move('baseball card'); await snapCam(rec, 'move opens on a box');
      // 09-29h: the box's own chain (memorabilia box, Crawl space) shows as tiers 2–3; select tier 2 and photograph where the box is now.
      const sq10 = await page.evaluate(() => [...document.querySelectorAll('.lv-strip .lv-sq:not(.plus)')].map((b) => b.getAttribute('aria-label')));
      check('S10', '09-29h: Move it opens with the whole known chain: Wooden box, Memorabilia box, Crawl space', sq10.length === 3 && /Memorabilia box/i.test(sq10[1]) && /Crawl space/i.test(sq10[2]), JSON.stringify(sq10));
      await page.locator('.lv-strip .lv-sq').nth(1).click(); await page.waitForTimeout(300); await snapCam(rec, 'tier 2 selected (the box\'s own where)');
      await shoot('closet.jpg', { name: 'Hall closet', moves: false });
      await snapCam(rec, 'box + new place'); await save(); await after(rec, 'baseball card');
      check('S10', 'the wooden box moved to Hall closet (a box keeps its own edge)', /hall closet/i.test(((await byName('wooden box')) || {}).location || ''), '');
      check('S10', 'the baseball card is still in the wooden box', /wooden box/i.test(((await byName('baseball card')) || {}).location || ''), '');
    });
    // S11 — Move: new place at tier 1 (photographed over the current), then a new place at tier 2.
    await scen('S11', 'Move: new place (tier 1) + new place (tier 2)', async (rec) => {
      await move('3D model of plant sensor'); await shoot('drawer.jpg', { name: 'Top drawer', moves: false });
      await plus(); await shoot('real_desk.jpg', { name: 'Desk', moves: false });
      await snapCam(rec, 'new > new'); await save(); await after(rec, '3D model of plant sensor');
      check('S11', 'Move: new Top drawer is in the new Desk', (await inOf('Top drawer')) === 'place:desk', await inOf('Top drawer'));
      check('S11', 'the thing is at Top drawer', /top drawer/i.test((await byName('3D model of plant sensor')).location), '');
    });
    // S12 — the same place at two tiers (Craft nook > Craft nook).
    await scen('S12', 'Log: same place at tier 1 and tier 2', async (rec) => {
      await newThing('stapler'); await plus(); rec.steps.push(await pickWhere('Craft nook'));
      await plus(); const chips = [];
      await tap('.lc-choose', { wait: 600 }); await type('.wl-search input', 'Craft nook');
      const rows = await page.locator('.wl-row:has-text("Craft nook")').count(); const typedNew = await page.locator('.wl-new.typed').count();
      await snapCam(rec, 'tier 2: Craft nook offered?');
      check('S12', 'the place on tier 1 is not offered again for tier 2 (Choose place list, or as "a new place")', rows === 0 && typedNew === 0, `rows=${rows} typed=${typedNew}`);
    });
    // S13 — a loop through places: A > B saved, then B > A.
    await scen('S13', 'Place loop: Kitchen counter > Pantry shelf, then Pantry shelf > Kitchen counter', async (rec) => {
      await newThing('stapler'); await plus(); await pickWhere('Kitchen counter'); await plus(); await pickWhere('Pantry shelf'); await save();
      check('S13', 'first save: Kitchen counter is in Pantry shelf', (await inOf('Kitchen counter')) === 'place:pantry shelf', await inOf('Kitchen counter'));
      await home(); await newThing('tape'); await plus(); await pickWhere('Pantry shelf'); await plus();
      await tap('.lc-choose', { wait: 600 }); await type('.wl-search input', 'Kitchen counter');
      const rows = await page.locator('.wl-row:has-text("Kitchen counter")').count();
      await snapCam(rec, 'loop: is Kitchen counter offered for where Pantry shelf is?');
      check('S13', 'a circle is not offered: Kitchen counter (inside Pantry shelf) is not a choice for where Pantry shelf is', rows === 0, `rows=${rows}`);
    });
    // S14b — Q4: photographing a known BOX's name as where a place is: no "Yes, that one" (a place is never in a box); it
    // needs its own name.
    await scen('S14b', 'Q4: a box name on a tier outside a place', async (rec) => {
      await newThing('glue'); await plus(); await shoot('drawer.jpg', { name: 'Drawer 5', moves: false });
      await plus(); await shoot('closet.jpg', { name: 'Filing cabinet', moves: true }, true);
      const st = await snapCam(rec, 'filing cabinet (a box) outside a place');
      const askN = await page.locator('.lc-ask').count();
      check('S14b', 'Q4: no "Is this the filing cabinet?" ask; Save waits for its own name', askN === 0 && st.saveDis === true && /needs its own name/.test(st.say), `ask=${askN} saveDis=${st.saveDis} say=${st.say}`);
    });
    // S16 — Ravi 09-28: the build name is the last line of Settings → Version, the same as the ☰ menu's.
    await scen('S16', 'Settings → Version ends with the build name', async (rec) => {
      await home(); await tap('.menu-btn', { wait: 400 }); const menu = await text('.drawer-build'); await page.keyboard.press('Escape').catch(() => {});
      await home(); await tap('button:has-text("Settings")', { wait: 700 });
      const last = await page.evaluate(() => { const g = [...document.querySelectorAll('.group-title')].find((x) => /version/i.test(x.innerText)); const box = g && g.nextElementSibling && g.nextElementSibling.querySelector('.grow'); const k = box && box.lastElementChild; return k ? k.innerText : ''; });
      check('S16', 'the Version box\'s last line is "Build <v>", the same as the menu', /^Build .+/.test(last) && last === menu, `last="${last}" menu="${menu}"`);
      await page.evaluate(() => { const g = [...document.querySelectorAll('.group-title')].find((x) => /version/i.test(x.innerText)); g.scrollIntoView(); });
      await shot('S16', 'Settings → Version');
    });
    // S15 — places made before today with a `parent` field become edges on the owner's phone (once).
    await scen('S15', 'Old data: a place with `parent` (pre-09-29) gets its edge at boot', async (rec) => {
      const now = Date.now();
      await page.evaluate((n) => window.__rig.seed([{ id: 'op1', kind: 'place', owner: 'margaret', by: 'margaret', private: false, sharedWith: [], roles: {}, name: 'Back shelf', order: n, createdAt: n, parent: 'pl3', photos: [] }]), now);
      await home(); await page.waitForTimeout(1200);
      check('S15', 'Back shelf (parent = Linen closet) is now IN the Linen closet', (await inOf('Back shelf')) === 'place:linen closet', await inOf('Back shelf'));
      await home(); await page.waitForTimeout(900);
      check('S15', 'a second boot adds nothing', ((await openEdgesFrom('Back shelf')) || []).length === 1, JSON.stringify(await openEdgesFrom('Back shelf')));
    });
    // S14 (09-29g): while ReCall looks at a tier's photo everything waits (no ＋, no Choose place, no Save), so a question
    // can no longer arrive for a tier you've left; it shows both photos and names the place.
    await scen('S14', 'The tier-2 question: asked with both photos, before anything else can happen', async (rec) => {
      await newThing('stapler');
      await plus(); await shoot('drawer.jpg', { name: 'Drawer 3', moves: false });
      await plus(); WHERE.push({ name: 'Craft nook', moves: false, sure: false }); NEXT_WHERE_DELAY = 1200; await cam('closet.jpg'); await tap('.lc-shutter', { wait: 300 });
      const lockd = await page.evaluate(() => ({ look: !!document.querySelector('.lv-look'), plus: !!document.querySelector('.lv-sq.plus'), choose: document.querySelector('.lc-choose') ? document.querySelector('.lc-choose').disabled : null, save: (document.querySelector('.lc-k.sv') || {}).disabled }));
      check('S14', 'while it looks: no ＋, Choose place and Save are off', lockd.look && !lockd.plus && lockd.choose === true && lockd.save === true, JSON.stringify(lockd));
      await page.waitForTimeout(1600);
      await snapCam(rec, 'the tier-2 question');
      const ask = await page.evaluate(() => { const a = document.querySelector('.lc-ask2'); return a ? { t: a.innerText, imgs: a.querySelectorAll('.pair img').length } : null; });
      check('S14', 'Q5: the question shows tier 2\'s photo beside the Craft nook ("Is this the Craft nook?")', !!ask && ask.imgs === 2 && /Is this the Craft nook\?/i.test(ask.t), JSON.stringify(ask));
      await tap('.lc-ask2 button:has-text("Yes")', { wait: 500 });
      await plus(); await shoot('real_desk.jpg', { name: 'Office', moves: false });
      const cl = await text('.lc-chainline');
      check('S14', 'Yes, then a third tier: "Drawer 3 in Craft nook in Office"', /Drawer 3\s*in\s*Craft nook\s*in\s*Office/i.test(cl), cl);
      await shot('S14', 'three tiers after the question');
    });
  }

  await seedHouse();
  try { await runSuite(look); } catch (e) { console.error('FATAL', e); }
  await browser.close();
  fs.writeFileSync(path.join(__dirname, `tiers_${look}${process.argv[3] ? '_' + process.argv[3].replace(/,/g, '') : ''}.json`), JSON.stringify(RECORD, null, 1));
}

(async () => {
  await new Promise((r) => server.listen(PORT, r));
  await runLook(process.argv[2] || 'b');
  const pass = results.filter((r) => r.ok).length;
  console.log(`\n${pass}/${results.length} checks passed`);
  console.log('Page errors:', errors.length ? errors : 'none');
  console.log('Console errors (unique):', Array.from(new Set(consoleErrors)).slice(0, 10));
  server.close();
})();
