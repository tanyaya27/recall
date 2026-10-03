  // journeys — 09-30 (TESTING.md #2): the stories in JOURNEYS.md, each step followed by the consistency oracle.
  // Retired 2026-10-01 (release 1 — the tier camera is gone):
  //   J8  "before Save it says the counter moves: Kitchen counter: Craft nook → Pantry shelf" — the camera's "Place:" /
  //       Q3 line (.lc-say .lc-move) is gone; a place now changes where IT is from its own page (the counter-moves part
  //       of J8 is kept: the counter's own "Where this place is", then the oracle on both items).
  //   J10 "photographing the Desk drawer it is already in: Is this the Desk drawer?" and "Yes: nothing moved, and the
  //       drawer has the new photo" — there are no place photos and no AI place matching in the camera any more. J10 is
  //       rewritten to what is left of the story: a new photo of the item in Move it, nothing else changed → nothing
  //       moves, the photo is the ITEM's, the drawer's photos are untouched.
  //   (J9's "the Linen closet is gone from the squares" is kept as the same check on the In chip.)
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
    const OUT = path.join(__dirname, 'shots_j'); fs.mkdirSync(OUT, { recursive: true });
    let n = 0; const snap = async (label) => { n++; await page.waitForTimeout(200); await page.screenshot({ path: path.join(OUT, `j-${String(n).padStart(2, '0')}-${label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`) }); };
    const ONLY = (process.argv[2] || '').split(',').filter(Boolean);
    let J = '';
    // after a step: every screen agrees with the store, and the store keeps its rules
    const agree = async (step, ...names) => {
      const bad = [...await O.invariants()];
      for (const nm of names) bad.push(...await O.check(nm));
      check(J, `${step}: every screen agrees${names.length ? ' (' + names.join(', ') + ')' : ''}`, bad.length === 0, bad.join(' || '));
      if (bad.length) await snap(`${J}-${step}-MISMATCH`);
    };
    const cardAgrees = async (step, nm) => { const bad = await O.card(nm); check(J, `${step}: the card after Save says it the same way`, bad.length === 0, bad.join(' || ')); };
    // ---- how a person drives the camera (10-01: photos are of the item; where = her words + ONE "In")
    const logItem = async (name, photo = 'real_slippers.jpg') => { await home(); AI = { name }; await cam(photo); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 }); };
    // Pick where it is in the camera's In list: an existing place/box by exact name, else a new place by that name.
    const pickPlace = async (name) => {
      await page.click('.ow-go'); await page.waitForSelector('.ow-sheet'); await page.click('.ow-sheet .ow-lvl-change >> nth=0'); await page.waitForSelector('.in-list');
      await page.fill('.in-list .wl-search input', name); await page.waitForTimeout(200);
      const row = page.locator(`.in-list .wl-row:has(b:text-is("${name}"))`);
      if (await row.count()) await row.first().click(); else await page.locator('.in-list .wl-new').first().click();
      await page.waitForTimeout(250);
    };
    const words = async (s) => { if (!(await page.locator('.ow-note-in').count())) await page.click('.ow-note'); await page.fill('.ow-note-in', s); await page.waitForTimeout(150); }; // 10-02: words are a note
    const chipText = () => page.evaluate(() => { const i = document.querySelector('.lc .ow-input'); return i && i.value ? 'In: ' + i.value : ''; }); // 10-02: the where field
    // the place page's own lists (Move / Move all) are still the Choose place list (WhereList)
    const choose = async (name) => {
      await page.waitForSelector('.where-list');
      await page.fill('.where-list .wl-search input', name); await page.waitForTimeout(200);
      const row = page.locator(`.where-list .wl-row:not(.wl-sugg):has-text("${name}")`);
      if (await row.count()) await row.first().click(); else await page.click('.where-list .wl-new.typed');
      await page.waitForTimeout(450);
      if (await page.locator('.where-list.bn .btn-primary').count()) await tap('.where-list.bn .btn-primary', { wait: 450 });
    };
    const save = async () => { await tap('.lc-k.sv', { wait: 2600 }); };
    const saveNext = async () => { const b = await page.locator('.lc-k.sv').boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await page.waitForTimeout(800); await page.mouse.up(); await page.waitForTimeout(1800); };
    const move = async (name) => { await O.openItem(name); await tap('.tp-btn:has-text("Move it"), .tp-btn:has-text("Put it somewhere")', { wait: 900 }); };
    const places = () => page.evaluate(() => window.__rig.dump().filter((d) => d.kind === 'place'));
    const placePage = async (nm) => { await home(); await tap('.menu-btn', { wait: 400 }); await tap('.drawer-row:has-text("Places")', { wait: 700 }); await tap(`.loc-row:has(b:text-is("${nm}"))`, { wait: 700 }); };
    // a PLACE changes where it is from its own page: ☰ → Places → the place → "Where this place is" → the In list (places only)
    const placeWhere = async (pl, to) => {
      await placePage(pl); await tap('.pl-where', { wait: 450 }); await page.waitForSelector('.in-list');
      await page.fill('.in-list .wl-search input', to); await page.waitForTimeout(200);
      const row = page.locator(`.in-list .wl-row:has(b:text-is("${to}"))`);
      if (await row.count()) await row.first().click(); else await page.locator('.in-list .wl-new').first().click();
      await page.waitForTimeout(900);
    };
    const story = async (id, fn) => { if (ONLY.length && !ONLY.includes(id)) return; J = id; console.log(`\n---- ${id}`);
      try { await seedHouse(); await page.evaluate(() => window.__rig.rules(true)); await fn(); } catch (e) { check(id, 'story ran to the end', false, e.message.slice(0, 300)); await snap(`${id}-ERROR`); } };

    await story('J1', async () => {
      await logItem('headphones'); await pickPlace('Kitchen counter'); await save(); await cardAgrees('logged', 'headphones');
      await agree('logged on the Kitchen counter', 'headphones');
      await move('headphones'); await pickPlace('Pantry shelf'); await save(); await cardAgrees('moved', 'headphones');
      await agree('moved to the Pantry shelf', 'headphones');
    });
    await story('J2', async () => {
      // the 3D model is in the Desk drawer in the seed; Ravi's was in the White cardboard box — put it there first
      await move('3D model of plant sensor'); await pickPlace('White cardboard box'); await save();
      await agree('in the White cardboard box', '3D model of plant sensor');
      // 10-01: "+ the Ikea shelving unit" = the White cardboard box's own "Where this place is" (a new place, by name)
      await placeWhere('White cardboard box', 'Ikea shelving unit');
      await agree('the White cardboard box in the Ikea shelving unit', '3D model of plant sensor');
      // next day: the shelf is there (on the chip's line) → the Ikea shelving unit's own where: Office (typed, keyboard up)
      await move('3D model of plant sensor'); const ch = await chipText();
      check(J, 'second visit: Move it opens on the White cardboard box, "in the Ikea shelving unit" under it', /White cardboard box/.test(ch) && /in the Ikea shelving unit/.test(ch), ch);
      await tap('.lc-x', { wait: 400 });
      await placeWhere('Ikea shelving unit', 'Office');
      const ch3 = (await O.truth('3D model of plant sensor')).chain;
      check(J, 'the store: the 3D model is in the White cardboard box in the Ikea shelving unit in the Office', JSON.stringify(ch3) === JSON.stringify(['White cardboard box', 'Ikea shelving unit', 'Office']), JSON.stringify(ch3));
      await agree('+ Office on top', '3D model of plant sensor');
      // then a Move with her words only, and Undo it from the page: the words go, the chain stays
      await move('3D model of plant sensor'); await words('top shelf, at the back'); await save();
      const note = await page.evaluate(() => ((document.querySelector('.tp-moved') || {}).innerText || '').replace(/\n/g, ' | '));
      const s1 = await page.evaluate(() => { const it = window.__rig.dump().find((d) => d.kind === 'item' && d.name === '3D model of plant sensor'); const h = (it.history || []).filter((x) => x.w); return h.length ? h[h.length - 1].said : ''; });
      check(J, 'a words-only Move: the words are saved, and the page says "Saved just now · Your words saved" with Undo', s1 === 'top shelf, at the back' && /Saved just now/.test(note) && /Your words saved/.test(note) && /Undo/.test(note), JSON.stringify({ s1, note }));
      if (await page.locator('.tp-moved .u').count()) await tap('.tp-moved .u', { wait: 1500 });
      const s = await page.evaluate(() => { const it = window.__rig.dump().find((d) => d.kind === 'item' && d.name === '3D model of plant sensor'); const h = (it.history || []).filter((x) => x.w); return h.length ? h[h.length - 1].said : ''; });
      check(J, 'Undo of that Move: her words are gone again', !s, JSON.stringify({ said: s }));
      await agree('Undo the words', '3D model of plant sensor');
    });
    await story('J3', async () => {
      // 10-01: a box is an item — log the White shoebox on the Linen closet, say it holds items, then log the scissors into it
      await logItem('White shoebox', 'box.jpg'); await pickPlace('Linen closet'); await save();
      await O.openItem('White shoebox'); await tap('button.sw[aria-label="It holds items"]', { wait: 700 });
      await logItem('blue scissors'); await pickPlace('White shoebox'); await save();
      await agree('in the White shoebox on the Linen closet', 'blue scissors');
      await O.openItem('White shoebox'); await tap('.tp-row:has-text("Rename")', { wait: 500 }); await page.locator('.sheet input').first().fill('Shoebox'); await tap('.sheet .btn-primary', { wait: 900 });
      await agree('the box renamed Shoebox', 'blue scissors');
      await home(); await tap('.menu-btn', { wait: 400 }); await tap('.drawer-row:has-text("Places")', { wait: 700 });
      const rows = await page.evaluate(() => [...document.querySelectorAll('.loc-row')].map((r) => r.innerText.replace(/\n/g, ' | ')));
      check(J, 'no ghost "White shoebox" in Places', !rows.some((r) => /white shoebox/i.test(r)), JSON.stringify(rows.filter((r) => /shoebox/i.test(r))));
    });
    await story('J4', async () => {
      await home(); await tap('.menu-btn', { wait: 400 }); await tap('.drawer-row:has-text("Places")', { wait: 700 });
      await tap('.loc-row:has-text("Kitchen counter")', { wait: 700 });
      await tap('button.field-value', { wait: 400 }); await page.locator('input.place-input').first().fill('Counter'); await page.keyboard.press('Enter'); await page.waitForTimeout(900);
      check(J, 'the place is called Counter now', !!(await places()).find((p) => p.name === 'Counter'), '');
      await agree('Kitchen counter renamed Counter', 'spare batteries');
    });
    await story('J5', async () => {
      await agree('before', 'baseball card');
      await move('wooden box'); await pickPlace('Pantry shelf'); await save();
      await agree('the wooden box moved to the Pantry shelf', 'baseball card', 'wooden box');
    });
    await story('J6', async () => {
      await logItem('tape measure'); await pickPlace('Linen closet'); await saveNext();
      AI = { name: 'glue gun' }; await cam('real_desk.jpg'); await tap('.lc-shutter', { wait: 1300 });
      const ch = await chipText();
      check(J, 'after Save + Next the next item starts In the Linen closet (shown on the chip)', /Linen closet/.test(ch), ch);
      if (!/Linen closet/.test(ch)) await pickPlace('Linen closet');
      await save();
      await agree('two in a row onto the Linen closet', 'tape measure', 'glue gun');
    });
    await story('J7', async () => {
      const before = (await places()).length;
      await logItem('stapler'); await pickPlace('Desk tray'); await save();
      const made = !!(await places()).find((p) => p.name === 'Desk tray');
      await page.waitForTimeout(600); await tap('.saved-card .u', { wait: 1500 });
      const left = await page.evaluate(() => window.__rig.dump().filter((d) => d.kind === 'item' && !d.deleted && /stapler/i.test(d.name || '')).map((d) => d.name));
      const pl = (await places()).filter((p) => /desk tray/i.test(p.name));
      check(J, 'Undo: the stapler and the new place made for it (Desk tray) are gone', made && left.length === 0 && pl.length === 0 && (await places()).length === before, JSON.stringify({ made, left, pl: pl.map((p) => p.name) }));
      await agree('after Undo');
    });
    await story('J8', async () => {
      await logItem('usb stick'); await pickPlace('Kitchen counter'); await save();
      await placeWhere('Kitchen counter', 'Craft nook');
      await agree('Kitchen counter in Craft nook', 'usb stick', 'spare batteries');
      await placeWhere('Kitchen counter', 'Pantry shelf'); // the counter moves; everything on it goes too
      await agree('the counter is in the Pantry shelf now', 'spare batteries', 'usb stick');
    });
    await story('J9', async () => {
      await placeWhere('Desk drawer', 'Linen closet'); // Desk drawer in Linen closet
      await agree('Desk drawer in Linen closet', '3D model of plant sensor', 'passport');
      await move('3D model of plant sensor'); await pickPlace('Kitchen counter');
      const ch = await chipText();
      check(J, 'a new In: the Linen closet (where the drawer is) is gone from the chip', /Kitchen counter/.test(ch) && !/linen closet/i.test(ch), ch);
      await save();
      await agree('moved to the Kitchen counter; the drawer keeps its own where', '3D model of plant sensor', 'passport');
    });
    await story('J10', async () => {
      const p0 = ((await places()).find((p) => p.name === 'Desk drawer') || {}).photos || [];
      const t0 = await O.truth('passport');
      await move('passport'); const off0 = await page.locator('.lc-k.sv').isDisabled();
      await cam('folder.jpg'); await tap('.lc-shutter', { wait: 900 });
      const off1 = await page.locator('.lc-k.sv').isDisabled();
      check(J, 'Move it, nothing changed: Save off; a new photo of it: Save on (the In unchanged)', off0 === true && off1 === false, JSON.stringify({ off0, off1 }));
      await save();
      const p1 = ((await places()).find((p) => p.name === 'Desk drawer') || {}).photos || [];
      const t1 = await O.truth('passport');
      check(J, 'saved: nothing moved, and the photo is the passport\'s — the Desk drawer\'s photos are untouched', JSON.stringify(t0.chain) === JSON.stringify(t1.chain) && p1.length === p0.length, JSON.stringify({ was: t0.chain, now: t1.chain, drawer: `${p0.length} -> ${p1.length}` }));
      await agree('after a photo-only Move', 'passport');
    });
    await story('J11', async () => {
      await page.evaluate(() => { const t = Date.now(); window.__rig.seed([
        { id: 'old1', kind: 'item', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [], name: 'old lantern', location: 'Garage shelf', photo: null, thumb: null, written: true, order: t, createdAt: t, lastSeenAt: t, photoCount: 0, history: [{ location: 'Garage shelf', at: t }] },
        { id: 'eg1', kind: 'edge', rel: 'in', from: 'pl4', to: { t: 'place', name: 'Craft nook' }, since: t, until: null, how: 'chosen', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [] }]); });
      await page.waitForTimeout(300);
      await agree('an old item with only a place written', 'old lantern');
    });
    await story('J12', async () => {
      await logItem('hole punch'); await pickPlace('Linen closet'); await save();
      await move('hole punch'); await pickPlace('Pantry shelf'); await save();
      const cards = await page.evaluate(() => ({ card: document.querySelectorAll('.saved-card').length, note: (document.querySelector('.tp-moved') || {}).innerText || '' }));
      check(J, 'after the quick Move no card is left over (the Log\'s Undo is gone); the page says it moved, from the Linen closet', cards.card === 0 && /Moved just now/.test(cards.note) && /Before: Linen closet/.test(cards.note), JSON.stringify(cards));
      await page.waitForTimeout(600); if (await page.locator('.tp-moved .u').count()) await tap('.tp-moved .u', { wait: 1500 });
      const it = await page.evaluate(() => window.__rig.dump().find((d) => d.kind === 'item' && !d.deleted && /hole punch/i.test(d.name || '')));
      check(J, 'Undo puts it back on the Linen closet — it is never deleted', !!it && /linen closet/i.test(it.location || ''), it ? it.location : 'DELETED');
      await agree('after Undo', 'hole punch');
    });
    await story('J13', async () => {
      // 09-30: a name you already have is never taken silently — it offers to merge (J17/J18); "Give it its own name" keeps both
      SAME_PLACE = { same: false, sure: true };
      await home(); await tap('.menu-btn', { wait: 400 }); await tap('.drawer-row:has-text("Places")', { wait: 700 });
      await tap('.loc-row:has-text("Kitchen counter")', { wait: 700 });
      await tap('button.field-value', { wait: 400 }); await page.locator('input.place-input').first().fill('pantry SHELF'); await page.keyboard.press('Enter'); await page.waitForTimeout(1500);
      const sh = await page.evaluate(() => (document.querySelector('.merge-sheet') || {}).innerText || '');
      await tap('.merge-sheet button:has-text("own name")', { wait: 500 });
      const two = (await places()).filter((p) => /pantry shelf/i.test(p.name)).length;
      check(J, 'renaming the Kitchen counter to "pantry SHELF": asked (merge or its own name), never taken silently; its own name keeps both', /You already have the Pantry shelf/.test(sh) && two === 1 && !!(await places()).find((p) => p.name === 'Kitchen counter'), JSON.stringify({ sh: sh.slice(0, 60), two }));
      await agree('after "Give it its own name"', 'spare batteries');
    });
    await story('J14', async () => {
      await logItem('lens cap'); await pickPlace('Linen closet'); await saveNext();
      await page.waitForTimeout(1200); await snap('J14 undo line after save+next');
      const line = await page.evaluate(() => (document.querySelector('.lc-undo') || {}).innerText || '');
      check(J, 'after Save + Next the camera keeps "✓ Lens cap saved · Undo" in reach', /Lens cap saved/i.test(line) && /Undo/.test(line), line);
      await tap('.lc-undo button', { wait: 1500 });
      const gone = await page.evaluate(() => !window.__rig.dump().some((d) => d.kind === 'item' && !d.deleted && /lens cap/i.test(d.name || '')));
      check(J, 'Undo there takes the lens cap back out (the camera stays open for the next item)', gone && await page.locator('.lc').count() === 1, `gone=${gone}`);
      await tap('.lc-x', { wait: 400 }); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 400 });
      await agree('after Undo in the camera');
    });
    await story('J15', async () => {
      await placePage('Craft nook');
      const st0 = await page.evaluate(() => ({ rows: [...document.querySelectorAll('.pl-row b')].map((b) => b.innerText), rmOff: [...document.querySelectorAll('button')].find((b) => /Remove this place/.test(b.innerText)).disabled, note: (document.querySelector('.note-quiet.left') ? [...document.querySelectorAll('.note-quiet.left')].map((x) => x.innerText).join(' ') : '') }));
      await snap('J15 craft nook worklist');
      check(J, 'the Craft nook page lists what is in it, each with Move; Remove this place is off until it is empty', st0.rows.length === 2 && st0.rmOff === true && /Move the 2 items first/.test(st0.note), JSON.stringify(st0));
      await tap('.pl-row:has-text("Tote bin") .pl-move', { wait: 500 }); await choose('Linen closet');
      await agree('the tote bin moved to the Linen closet from the place page', 'tote bin');
      await placePage('Craft nook'); // (the oracle opened other pages)
      const left1 = await page.evaluate(() => [...document.querySelectorAll('.pl-row b')].map((b) => b.innerText));
      check(J, 'the list gets shorter as you go (1 left)', left1.length === 1, JSON.stringify(left1));
      await tap('.pl-row .pl-move', { wait: 500 }); await choose('Garage shelf');
      await page.waitForTimeout(400);
      const rmOn = await page.evaluate(() => ![...document.querySelectorAll('button')].find((b) => /Remove this place/.test(b.innerText)).disabled);
      check(J, 'empty now: Remove this place is on', rmOn, '');
      await agree('everything moved out of the Craft nook', 'filing cabinet', 'tote bin');
    });
    await story('J16', async () => {
      // Move all to…
      await placePage('Craft nook'); await tap('.pl-all', { wait: 500 }); await choose('Pantry shelf');
      const at = await page.evaluate(() => window.__rig.dump().filter((d) => d.kind === 'item' && !d.deleted && /tote bin|filing cabinet/i.test(d.name || '')).map((d) => d.location));
      check(J, '"Move all to…" moves every item in the Craft nook to the Pantry shelf', at.length === 2 && at.every((l) => /pantry shelf/i.test(l)), JSON.stringify(at));
      await agree('after Move all', 'tote bin', 'filing cabinet');
    });
    await story('J17', async () => {
      SAME_PLACE = { same: true, sure: true };
      await placePage('Kitchen counter'); await tap('button.field-value', { wait: 400 }); await page.locator('input.place-input').first().fill('Pantry shelf'); await page.keyboard.press('Enter'); await page.waitForTimeout(1500);
      const sh = await page.evaluate(() => (document.querySelector('.merge-sheet') || {}).innerText || '');
      await snap('J17 merge same');
      check(J, 'renaming the Kitchen counter to the Pantry shelf offers to merge, and says they look like the same place', /You already have the Pantry shelf/.test(sh) && /same place/.test(sh) && /Merge into the Pantry shelf/.test(sh), sh.replace(/\n/g, ' | '));
      await tap('.merge-sheet .btn-primary', { wait: 1500 });
      const pl = await places(); const pan = pl.find((p) => p.name === 'Pantry shelf');
      check(J, 'merged: no Kitchen counter left; one Pantry shelf with both photos', !pl.find((p) => p.name === 'Kitchen counter') && pl.filter((p) => p.name === 'Pantry shelf').length === 1 && (pan.photos || []).length === 2, JSON.stringify((pan || {}).photos ? pan.photos.length : null));
      await agree('after the merge', 'spare batteries');
    });
    await story('J18', async () => {
      SAME_PLACE = { same: false, sure: true };
      await placePage('Kitchen counter'); await tap('button.field-value', { wait: 400 }); await page.locator('input.place-input').first().fill('Linen closet'); await page.keyboard.press('Enter'); await page.waitForTimeout(1500);
      const sh = await page.evaluate(() => (document.querySelector('.merge-sheet') || {}).innerText || '');
      check(J, 'different photos: it says so, and offers keep-the-closet\'s / keep-all / own name', /look like different places/.test(sh) && /keep the Linen closet’s photos/.test(sh) && /keep all photos/.test(sh) && /own name/.test(sh), sh.replace(/\n/g, ' | '));
      await tap('.merge-sheet button:has-text("keep all photos")', { wait: 600 });
      const n0 = await page.locator('.mg-ph').count(); await snap('J18 review photos');
      await tap('.mg-ph >> nth=1 >> .mg-rm', { wait: 400 });
      const conf = await page.evaluate(() => [...document.querySelectorAll('.sheet-title')].map((t) => t.innerText).join(' | '));
      check(J, '"keep all photos" shows every photo; the bin on one asks "Remove this photo?" first', n0 === 2 && /Remove this photo\?/.test(conf), `${n0} photos · ${conf}`);
      await tap('.sheet button:has-text("Remove")', { wait: 400 });
      const n1 = await page.locator('.mg-ph').count();
      await tap('.merge-sheet .btn-primary', { wait: 1500 });
      const lc = (await places()).find((p) => p.name === 'Linen closet');
      check(J, 'merged with the one photo kept; no Kitchen counter left', n1 === 1 && !(await places()).find((p) => p.name === 'Kitchen counter') && (lc.photos || []).length === 1, `${n1} · ${(lc.photos || []).length}`);
      await agree('after the merge with photos reviewed', 'spare batteries');
    });
    await story('J19', async () => {
      // 10-01: her words only — no In. It is not a "Not put away" chore; the page shows her words and offers to put it away.
      const npa = async () => { await home(); return page.evaluate(() => { const b = document.querySelector('.notput'); return b ? Number((b.innerText.match(/(\d+)/) || [])[1] || 0) : 0; }); };
      const n0 = await npa();
      await logItem('sewing kit'); await words('in the blue basket under the stairs'); await save();
      const st = await page.evaluate(() => { const it = window.__rig.dump().find((d) => d.kind === 'item' && !d.deleted && d.name === 'sewing kit'); return it ? { loc: it.location || '', w: (it.history || []).filter((x) => x.w).map((x) => x.said) } : null; });
      check(J, 'saved with her words only: no place, and the words are in its history as said', !!st && !st.loc && st.w.length === 1 && st.w[0] === 'in the blue basket under the stairs', JSON.stringify(st));
      const n1 = await npa();
      check(J, '"Not put away" does not count an item that has her words', n1 === n0, `${n0} -> ${n1}`);
      await O.openItem('sewing kit');
      const pg = await page.evaluate(() => ({ said: (document.querySelector('.tp-said q') || {}).innerText || '', by: (document.querySelector('.tp-said small') || {}).innerText || '', put: !!document.querySelector('.tp-put') }));
      check(J, 'the item page: "You said" with her words, and "Put it in a place or a box"', /blue basket under the stairs/.test(pg.said) && /You said/.test(pg.by) && pg.put, JSON.stringify(pg));
      await agree('words only', 'sewing kit');
      await move('sewing kit'); await pickPlace('Linen closet'); await save();
      await agree('then put In the Linen closet', 'sewing kit');
    });
  }
  await seedHouse();
  try { await runSuite(); } catch (e) { console.error('FATAL', e); check('J', 'suite ran', false, e.message); }
  await browser.close();
}
(async () => {
  await new Promise((r) => server.listen(PORT, r));
  await runLook('b');
  const pass = results.filter((r) => r.ok).length;
  console.log(`\n${pass}/${results.length} checks passed`);
  console.log('Page errors:', errors.length ? errors : 'none');
  console.log('Console errors (unique):', Array.from(new Set(consoleErrors)).slice(0, 10));
  server.close();
})();
