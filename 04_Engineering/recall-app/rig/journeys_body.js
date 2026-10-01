  // journeys — 09-30 (TESTING.md #2): the stories in JOURNEYS.md, each step followed by the consistency oracle.
  async function runSuite() {
    const O = require('./oracle.js')({ page, PORT, tap });
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
    // ---- how a person drives the camera
    const logItem = async (name, photo = 'real_slippers.jpg') => { await home(); AI = { name }; await cam(photo); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 }); };
    const plus = async () => { if (await page.locator('.lv-sq.plus').count()) await tap('.lv-sq.plus', { wait: 350 }); };
    const choose = async (name) => {
      if (!(await page.locator('.where-list').count())) await tap('.lc-choose', { wait: 450 });
      await page.fill('.wl-search input', name); await page.waitForTimeout(200);
      const row = page.locator(`.where-list .wl-row:not(.wl-sugg):has-text("${name}")`);
      if (await row.count()) await row.first().click(); else await page.click('.wl-new.typed');
      await page.waitForTimeout(450);
    };
    const shootPlace = async (file, where, nameIt = '') => {
      WHERE.push(where); await cam(file); await tap('.lc-shutter', { wait: 300 });
      for (let k = 0; k < 40 && await page.locator('.lv-look').count(); k++) await page.waitForTimeout(150);
      for (let k = 0; k < 14 && !(await page.locator('.where-list, .photo-for').count()); k++) await page.waitForTimeout(150); for (let k = 0; k < 40 && (await page.locator('.where-list .wl-sugg.quiet:has-text("Looking")').count()); k++) await page.waitForTimeout(150); /* 09-30f: Choose place opens at once; wait for ReCall's look */
      if (await page.locator('.where-list .wl-sugg:not(.quiet)').count()) return; // a suggestion: the test answers it
      if (await page.locator('.wl-pend .btn-primary').count()) { if (nameIt) await page.locator('.wl-pend input').fill(nameIt); await tap('.wl-pend .btn-primary', { wait: 450 }); }
    };
    const save = async () => { await tap('.lc-k.sv', { wait: 2600 }); };
    const saveNext = async () => { const b = await page.locator('.lc-k.sv').boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await page.waitForTimeout(800); await page.mouse.up(); await page.waitForTimeout(1800); };
    const move = async (name) => { await O.openItem(name); await tap('button:has-text("Move it"), button:has-text("Put it somewhere")', { wait: 900 }); };
    const tierSheet = async (i) => { const sq = page.locator('.lv-strip .lv-sq').nth(i); if (!/\bsel\b/.test(await sq.getAttribute('class'))) { await sq.click(); await page.waitForTimeout(300); } await sq.click(); await page.waitForTimeout(400); };
    const places = () => page.evaluate(() => window.__rig.dump().filter((d) => d.kind === 'place'));
    const story = async (id, fn) => { if (ONLY.length && !ONLY.includes(id)) return; J = id; console.log(`\n---- ${id}`);
      try { await seedHouse(); await page.evaluate(() => window.__rig.rules(true)); await fn(); } catch (e) { check(id, 'story ran to the end', false, e.message.slice(0, 300)); await snap(`${id}-ERROR`); } };

    await story('J1', async () => {
      await logItem('headphones'); await plus(); await choose('Kitchen counter'); await save(); await cardAgrees('logged', 'headphones');
      await agree('logged on the Kitchen counter', 'headphones');
      await move('headphones'); await choose('Pantry shelf'); await save(); await cardAgrees('moved', 'headphones');
      await agree('moved to the Pantry shelf', 'headphones');
    });
    await story('J2', async () => {
      // the 3D model is in the Desk drawer in the seed; Ravi's was in the White cardboard box — put it there first
      await move('3D model of plant sensor'); await choose('White cardboard box'); await save();
      await agree('in the White cardboard box', '3D model of plant sensor');
      await move('3D model of plant sensor'); await plus(); await shootPlace('closet.jpg', { name: 'bookshelf', moves: false }, 'Ikea shelving unit'); await save();
      await cardAgrees('+ Ikea shelving unit', '3D model of plant sensor');
      await agree('+ Ikea shelving unit', '3D model of plant sensor');
      await move('3D model of plant sensor'); await plus(); await choose('Office'); await save();
      await agree('+ Office on top', '3D model of plant sensor');
      await page.waitForTimeout(600); if (await page.locator('.tp-moved .u').count()) await tap('.tp-moved .u', { wait: 1500 });
      await agree('Undo the Office', '3D model of plant sensor');
    });
    await story('J3', async () => {
      await logItem('blue scissors'); await plus(); await shootPlace('box.jpg', { name: 'White shoebox', moves: true }); await plus(); await choose('Linen closet'); await save();
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
      await move('wooden box'); await choose('Pantry shelf'); await save();
      await agree('the wooden box moved to the Pantry shelf', 'baseball card', 'wooden box');
    });
    await story('J6', async () => {
      await logItem('tape measure'); await plus(); await choose('Linen closet'); await saveNext();
      AI = { name: 'glue gun' }; await cam('real_desk.jpg'); await tap('.lc-shutter', { wait: 1300 });
      const sq = await page.evaluate(() => [...document.querySelectorAll('.lv-strip .lv-sq:not(.plus)')].map((b) => b.getAttribute('aria-label')));
      await plus(); if (!(await page.locator('.lv-strip .lv-sq').count())) await plus();
      await choose('Linen closet'); await save();
      await agree('two in a row onto the Linen closet', 'tape measure', 'glue gun');
      console.log('   after Save + Next the next item started with', JSON.stringify(sq));
    });
    await story('J7', async () => {
      const before = (await places()).length;
      await logItem('stapler'); await plus(); await shootPlace('box14.jpg', { name: 'desk tray', moves: true }); await plus(); await choose('Craft nook'); await save();
      await page.waitForTimeout(600); await tap('.saved-card .u', { wait: 1500 });
      const left = await page.evaluate(() => window.__rig.dump().filter((d) => d.kind === 'item' && !d.deleted && /stapler|desk tray/i.test(d.name || '')).map((d) => d.name));
      check(J, 'Undo: the stapler and the desk tray made for it are gone', left.length === 0 && (await places()).length === before, JSON.stringify(left));
      await agree('after Undo');
    });
    await story('J8', async () => {
      await logItem('usb stick'); await plus(); await choose('Kitchen counter'); await plus(); await choose('Craft nook'); await save();
      await agree('Kitchen counter in Craft nook', 'usb stick', 'spare batteries');
      await move('spare batteries');
      await tierSheet(1); await tap('.tier-sheet .sheet-row:has-text("Choose place")', { wait: 400 }); await choose('Pantry shelf');
      const q3 = await page.evaluate(() => [...document.querySelectorAll('.lc-say .lc-move')].map((x) => x.innerText));
      check(J, 'before Save it says the counter moves: "Kitchen counter: Craft nook → Pantry shelf"', q3.some((t) => /Kitchen counter: Craft nook → Pantry shelf/.test(t)), JSON.stringify(q3));
      await save();
      await agree('the counter is in the Pantry shelf now', 'spare batteries', 'usb stick');
    });
    await story('J9', async () => {
      await move('3D model of plant sensor'); await plus(); await choose('Linen closet'); await save(); // Desk drawer in Linen closet
      await agree('Desk drawer in Linen closet', '3D model of plant sensor', 'passport');
      await move('3D model of plant sensor'); await tierSheet(0); await tap('.tier-sheet .sheet-row:has-text("Choose place")', { wait: 400 }); await choose('Kitchen counter');
      const sq = await page.evaluate(() => [...document.querySelectorAll('.lv-strip .lv-sq:not(.plus)')].map((b) => b.getAttribute('aria-label')));
      check(J, 'a new tier 1: the Linen closet (where the drawer is) is gone from the squares', !sq.some((s) => /linen closet/i.test(s)), JSON.stringify(sq));
      await save();
      await agree('moved to the Kitchen counter; the drawer keeps its own where', '3D model of plant sensor', 'passport');
    });
    await story('J10', async () => {
      const p0 = ((await places()).find((p) => p.name === 'Desk drawer') || {}).photos || [];
      await move('passport'); await shootPlace('drawer.jpg', { name: 'drawer', moves: false, known: 'Desk drawer', sure: true });
      const ask = await page.evaluate(() => (document.querySelector('.where-list .wl-sugg:not(.quiet)') || {}).innerText || '');
      check(J, 'photographing the Desk drawer it is already in: "Is this the Desk drawer?"', /Desk drawer[\s\S]*looks like this one/i.test(ask), ask.replace(/\n/g, ' '));
      if (ask) await tap('.where-list .wl-sugg:not(.quiet)', { wait: 500 });
      await save();
      const p1 = ((await places()).find((p) => p.name === 'Desk drawer') || {}).photos || [];
      check(J, 'Yes: nothing moved, and the drawer has the new photo', p1.length === Math.min(6, p0.length + 1), `${p0.length} -> ${p1.length}`);
      await agree('after Yes', 'passport');
    });
    await story('J11', async () => {
      await page.evaluate(() => { const t = Date.now(); window.__rig.seed([
        { id: 'old1', kind: 'item', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [], name: 'old lantern', location: 'Garage shelf', photo: null, thumb: null, written: true, order: t, createdAt: t, lastSeenAt: t, photoCount: 0, history: [{ location: 'Garage shelf', at: t }] },
        { id: 'eg1', kind: 'edge', rel: 'in', from: 'pl4', to: { t: 'place', name: 'Craft nook' }, since: t, until: null, how: 'chosen', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [] }]); });
      await page.waitForTimeout(300);
      await agree('an old item with only a place written', 'old lantern');
    });
    await story('J12', async () => {
      await logItem('hole punch'); await plus(); await choose('Linen closet'); await save();
      await move('hole punch'); await choose('Pantry shelf'); await save();
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
      await logItem('lens cap'); await plus(); await choose('Linen closet'); await saveNext();
      await page.waitForTimeout(1200); await snap('J14 undo line after save+next');
      const line = await page.evaluate(() => (document.querySelector('.lc-undo') || {}).innerText || '');
      check(J, 'after Save + Next the camera keeps "✓ Lens cap saved · Undo" in reach', /Lens cap saved/i.test(line) && /Undo/.test(line), line);
      await tap('.lc-undo button', { wait: 1500 });
      const gone = await page.evaluate(() => !window.__rig.dump().some((d) => d.kind === 'item' && !d.deleted && /lens cap/i.test(d.name || '')));
      check(J, 'Undo there takes the lens cap back out (the camera stays open for the next item)', gone && await page.locator('.lc').count() === 1, `gone=${gone}`);
      await tap('.lc-x', { wait: 400 }); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 400 });
      await agree('after Undo in the camera');
    });
    const placePage = async (nm) => { await home(); await tap('.menu-btn', { wait: 400 }); await tap('.drawer-row:has-text("Places")', { wait: 700 }); await tap(`.loc-row:has-text("${nm}")`, { wait: 700 }); };
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
