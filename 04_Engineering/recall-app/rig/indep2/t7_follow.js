// ow1 / t7: follow-ups — leftovers after Undo on the item page, photo removal, same-name place/box retype, photos held to Save
const { start } = require('./lib.js');
(async () => {
  const H = await start({ port: Number(process.env.PORT || 8478) });
  const { page, W, check, info, step, S } = H;
  await H.seed();
  S.GUESS = { name: 'X', merged: 'X' };
  // an item at the PLACE "Sewing basket" (there is also a BOX "sewing basket")
  const now = Date.now();
  await page.evaluate(([n, ph]) => window.__rig.seed([
    { id: 'thim', kind: 'item', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [], name: 'thimble', location: 'Sewing basket', photo: ph, thumb: ph, thumbV: 2, order: n - 5e6, createdAt: n - 5e6, lastSeenAt: n - 5e6, logId: 'l_thim', photoCount: 1, history: [{ location: 'Sewing basket', at: n - 5e6 }] },
    { id: 'eThim', kind: 'edge', rel: 'in', from: 'thim', to: { t: 'place', name: 'Sewing basket' }, since: n - 5e6, until: null, how: 'chosen', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [] },
  ]), [now, H.img('scissors.jpg')]); await W(400);

  await step('F1', 'item page after Move + Undo', async () => {
    await H.openThing('wallet'); const pages0 = await page.locator('.strip-page').count(); const card0 = (await H.txt('.card.thing')).replace(/\n/g, ' | ');
    await H.tap('.thing-page button:has-text("Move it")', 900); await H.typeWhere('kitchen'); await H.done(); await H.save();
    await H.tap('.tp-moved .u', 1400); await W(400);
    await H.openThing('wallet'); const pages1 = await page.locator('.strip-page').count(); const card1 = (await H.txt('.card.thing')).replace(/\n/g, ' | ');
    const w = await H.where();
    info('F1', JSON.stringify({ pages0, pages1, card0, card1, w, snaps: (await H.snapsOf('wal')).map((s) => [s.location, !!s.moved]) }));
    check('F1', 'after Move + Undo the item page is as before (no photo page saying it was in the Kitchen)', pages1 === pages0 && !/Kitchen/.test(card1 + w), JSON.stringify({ pages0, pages1, card1, w }));
  });
  await step('F2', 'Log: remove the only item photo after place photos', async () => {
    await H.home(); S.AI = { name: 'torch' }; await H.tap(H.LOG, 900); await H.shoot('charger.jpg');
    await H.typeWhere('garage'); await H.done(); await H.shoot('tooldrawer.jpg'); await H.shoot('tooldrawer.jpg');
    const strip0 = (await H.txt('.ow-to')).replace(/\n/g, ' ');
    await H.tap('.lc-thing', 600); await H.tap('.d2-pill.rm', 500);
    const body = (await H.txt('.pv-ask')).replace(/\n/g, ' / ');
    await H.tap('.pv-ask button:has-text("Remove")', 700);
    const strip1 = (await H.txt('.ow-to')).replace(/\n/g, ' '); const title = (await H.txt('.lc-title')).replace(/\n/g, ' ');
    info('F2', JSON.stringify({ strip0, body, strip1, title, card: await H.has('.lc-card') }));
    check('F2', '"Only this photo goes": the 2 Garage photos survive removing the item photo', /Garage/.test(strip1) && /2/.test(strip1), JSON.stringify({ body, strip1, title }));
    await H.leave();
  });
  await step('F3', 'same-name place/box: retyping the current place name', async () => {
    await H.openThing('thimble'); info('F3p', await H.where());
    await H.tap('.thing-page button:has-text("Move it")', 900);
    const rest = { v: await H.val(), head: await H.head(), off: await H.saveOff() };
    await page.locator('.ow-input').click(); await W(150); await page.keyboard.press('End'); await page.keyboard.press('Backspace'); await page.keyboard.type('t'); await W(300);
    const typing = { v: await page.locator('.ow-input').inputValue(), head: await H.head(), off: await H.saveOff() };
    await H.done();
    info('F3', JSON.stringify({ rest, typing, after: { v: await H.val(), head: await H.head(), off: await H.saveOff() } }));
    if (!(await H.saveOff())) { await H.save(); const e = await H.edgeOf('thim'); info('F3s', JSON.stringify(e.to)); check('F3', 'retyping the same name she sees ("Sewing basket") does not move the thimble from the place into the box', e.to.t === 'place', JSON.stringify(e.to)); }
    else { check('F3', 'retyping the same name: no change', true); await H.leave(); }
  });
  await step('F4', 'Move: photos taken for one place go to the place shown at Save', async () => {
    S.guessCalls = [];
    const o0 = (await H.placeBy('Office')).photos.length;
    await H.openMove('brochure'); await H.shoot('closet.jpg'); await H.shoot('closet.jpg');
    await H.typeWhere('study'); await H.done(); await W(2200);
    const look = await H.has('.ow-looking'); const box = await H.has('.ow-ai'); const strip = (await H.txt('.ow-to')).replace(/\n/g, ' ');
    await H.save();
    const st = await H.placeBy('Study'); const o1 = (await H.placeBy('Office')).photos.length;
    check('F4', 'the 2 photos go to Study (shown at Save); Office unchanged; no guess without a new photo', st && st.photos.length === 2 && o1 === o0 && S.guessCalls.length === 0 && !look && !box, JSON.stringify({ st: st && st.photos.length, o0, o1, calls: S.guessCalls.length, strip }));
  });
  await step('F5', 'Save off until something changes; changing back turns it off', async () => {
    await H.openMove('wallet'); const a = await H.saveOff(); await H.typeWhere('garage'); const b = await H.saveOff(); await H.typeWhere('office'); await H.done(); const c = await H.saveOff();
    await H.tap('.ow-note', 300); await page.fill('.ow-note-in', 'x'); await W(150); const d = await H.saveOff(); await page.fill('.ow-note-in', ''); await W(150); const e = await H.saveOff();
    check('F5', 'Save: off → on (Garage) → off (back to Office) → on (note) → off (note cleared)', a && !b && c && !d && e, JSON.stringify({ a, b, c, d, e }));
    info('F5h', 'header after typing back the same place: ' + (await H.head()));
    await H.leave();
  });
  await step('F6', 'Log: Save+Next with a kept place — where do the next item’s 2nd+ photos go?', async () => {
    await H.home(); S.AI = { name: 'cup' }; await H.tap(H.LOG, 900); await H.shoot('soda.jpg');
    await H.typeWhere('kitchen'); await H.done(); await H.holdSave(750);
    S.AI = { name: 'plate' }; await H.shoot('real_spoon.jpg');
    const strip1 = (await H.txt('.ow-to')).replace(/\n/g, ' '); const on1 = await H.txt('.ow-to .on');
    const k0 = (await H.placeBy('Kitchen')).photos.map((p) => p.at).join();
    await H.shoot('real_spoon.jpg'); const strip2 = (await H.txt('.ow-to')).replace(/\n/g, ' ');
    await H.save();
    const pl = await H.byName('plate'); const k1 = (await H.placeBy('Kitchen')).photos.map((p) => p.at).join();
    info('F6', JSON.stringify({ strip1, on1, strip2, platePhotos: pl && pl.photoCount, kitchenChanged: k0 !== k1 }));
    check('F6', 'a place is set (kept from Save+Next): after the item’s first photo, photos go to the Kitchen (ruling 5)', /kitchen/i.test(on1) || k0 !== k1, JSON.stringify({ strip1, on1, strip2, platePhotos: pl && pl.photoCount }));
  });
  await step('F7', 'Find for a box in a place, a ring 4 deep, words-only', async () => {
    for (const q of ['gold ring', 'blue tin', 'keys', 'passport']) info('F7 ' + q, JSON.stringify(await H.find(q)));
  });
  await H.finish('t7');
})().catch((e) => { console.error(e); process.exit(1); });
