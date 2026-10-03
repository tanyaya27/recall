// indep2 / n3: photos — targets, removal in every order, place cap, covers (ruling 5)
const { boot } = require('./x.js');
(async () => {
  const H = await boot();
  const { page, W, check, info, step, S } = H;
  const rmFirst = async () => { await H.tap('.lc-thing', 600); await H.tap('.d2-pill.rm', 500); await H.tap('.pv-ask button:has-text("Remove")', 700); };
  await H.seed();

  await step('P1', 'Log: item photo, Garage, 2 place photos, remove the item photo, new item photo, Save', async () => {
    const g0 = (await H.placeBy('Garage')).photos.length;
    await H.logNew('torch', 'charger.jpg'); await H.typeWhere('garage'); await H.done();
    const s0 = await H.strip(); await H.shoot('tooldrawer.jpg'); await H.shoot('closet.jpg'); const s1 = await H.strip();
    await rmFirst();
    const s2 = await H.strip(); const off2 = await H.saveOff(); const v2 = await H.val(); const title2 = (await H.txt('.lc-title')).replace(/\n/g, ' ');
    S.AI = { name: 'torch' }; await H.shoot('charger.jpg'); await W(700); const s3 = await H.strip(); const off3 = await H.saveOff();
    info('P1a', JSON.stringify({ s0, s1, s2, off2, v2, title2, s3, off3 }));
    check('P1a', 'after removing the only item photo: the where (Garage) and its 2 photos stay, Save waits', /Garage/.test(v2) && /2/.test(s2) && off2, JSON.stringify({ s2, v2, off2 }));
    await H.save(); await W(600);
    const t = await H.byName('torch'); const g1 = (await H.placeBy('Garage')).photos;
    info('P1', JSON.stringify({ torch: t && { loc: t.location, pc: t.photoCount, cover: t.photo === H.img('charger.jpg') ? 'charger' : 'other' }, garage: [g0, g1.length] }));
    check('P1', 'torch in the Garage with its new photo; the Garage got exactly the 2 place photos', t && t.location === 'Garage' && g1.length === g0 + 2, JSON.stringify({ g0, g1: g1.length }));
  });

  await H.seed();
  await step('P2', 'Log: 2 item photos, then a place + 1 place photo; remove the FIRST item photo', async () => {
    await H.logNew('mug', 'soda.jpg'); await H.shoot('real_spoon.jpg'); const sA = await H.strip();
    await H.typeWhere('garage'); await H.done(); const sB = await H.strip(); await H.shoot('tooldrawer.jpg'); const sC = await H.strip();
    await rmFirst(); const sD = await H.strip(); const off = await H.saveOff();
    info('P2a', JSON.stringify({ sA, sB, sC, sD, off }));
    await H.save(); await W(600);
    const m = await H.byName('mug'); const sn = m ? await H.snapsOf(m.id) : [];
    info('P2', JSON.stringify({ loc: m && m.location, pc: m && m.photoCount, cover: m && (m.photo === H.img('real_spoon.jpg') ? 'spoon' : m.photo === H.img('soda.jpg') ? 'soda' : 'other'), snaps: sn.length }));
    check('P2', 'mug: one photo (the spoon one), cover = it, in the Garage', m && m.photoCount === 1 && m.photo === H.img('real_spoon.jpg') && m.location === 'Garage', '');
  });

  await H.seed();
  await step('P4', 'Move: photos held for Garage; then she takes it out of the Garage (no place)', async () => {
    const w0 = await H.byId('wal'); const g0 = (await H.placeBy('Garage')).photos.length;
    await H.openMove('wallet'); await H.typeWhere('garage'); await H.done(); await H.shoot('tooldrawer.jpg');
    await H.tap('.ow-go', 600); const clear = await H.has('.ow-clear'); info('P4a', 'Take it out offered: ' + clear + ' ' + (await H.txt('.ow-clear')));
    // "Take it out" is offered for the pick, here Garage (not the Office it was in)
    if (clear) await H.tap('.ow-clear', 500); else await H.tap('.ow-cancel', 300);
    const head = await H.head(); const s = await H.strip(); const off = await H.saveOff();
    info('P4b', JSON.stringify({ head, s, off }));
    if (!off) { await H.save(); const w1 = await H.byId('wal'); const g1 = (await H.placeBy('Garage')).photos.length;
      info('P4', JSON.stringify({ loc: w1.location, np: w1.needsPlace, coverChanged: w1.photo !== w0.photo, garage: [g0, g1], page: await H.where() })); }
    else await H.leave();
  });

  await H.seed();
  await step('P5', 'Move into a BOX with a photo: the box gets it; covers unchanged', async () => {
    const t0 = await H.byId('tin'); const w0 = await H.byId('wal');
    await H.openMove('wallet'); await H.typeWhere('blue tin'); await H.done(); const s = await H.strip(); await H.shoot('tin.jpg'); await H.save();
    const t1 = await H.byId('tin'); const w1 = await H.byId('wal');
    info('P5', JSON.stringify({ s, tinPc: [t0.photoCount, t1.photoCount], tinCover: t1.photo === t0.photo, walCover: w1.photo === w0.photo, tinSnaps: (await H.snapsOf('tin')).length }));
    check('P5', 'the tin got 1 more photo; tin and wallet covers unchanged', t1.photoCount === (t0.photoCount || 1) + 1 && t1.photo === t0.photo && w1.photo === w0.photo, '');
  });

  await H.seed();
  await step('P7', 'place cap: Kitchen (5) + 6 new → 6 kept, main first', async () => {
    const k0 = await H.placeBy('Kitchen'); const main0 = k0.photos[0].photo;
    await H.openMove('wallet'); await H.typeWhere('kitchen'); await H.done();
    for (let i = 0; i < 7; i++) await H.shoot(['soda.jpg', 'card.jpg', 'book.jpg', 'diary.jpg', 'keys.jpg', 'glasses.jpg', 'tin.jpg'][i]);
    const s = await H.strip(); const shutterOff = await page.locator('.lc-shutter').isDisabled();
    await H.save(); const k1 = await H.placeBy('Kitchen');
    info('P7', JSON.stringify({ s, shutterOff, n: k1.photos.length, main: k1.photos[0].photo === main0 }));
    check('P7', 'Kitchen ≤ 6 photos and the main photo kept first', k1.photos.length <= 6 && k1.photos[0].photo === main0, JSON.stringify({ n: k1.photos.length }));
  });

  await H.seed();
  await step('P9', 'Log: "a new place" segment, a place photo, guess fills; remove the item photo; new item photo', async () => {
    S.GUESS = { name: 'Pantry shelf', merged: 'Pantry shelf' }; S.guessCalls = [];
    await H.logNew('jar', 'soda.jpg'); const s0 = await H.strip();
    const seg = page.locator('.ow-to .ow-to-where'); if (await seg.count()) { await seg.click(); await W(300); }
    await H.shoot('closet.jpg'); await W(2600); const v1 = await H.val(); const ai = (await H.txt('.ow-ai')).replace(/\n/g, ' / ');
    await rmFirst(); const v2 = await H.val(); const s2 = await H.strip();
    S.AI = { name: 'jar' }; await H.shoot('soda.jpg'); await W(700);
    const v3 = await H.val(); const s3 = await H.strip(); const off = await H.saveOff();
    info('P9a', JSON.stringify({ s0, v1, ai, v2, s2, v3, s3, off, calls: S.guessCalls }));
    if (!off) { await H.save(); await W(600); const j = await H.byName('jar'); const ps = await H.placeBy('Pantry shelf');
      info('P9', JSON.stringify({ jar: j && j.location, pantry: ps && ps.photos.length }));
      check('P9', 'jar in Pantry shelf; the place kept its photo', j && j.location === 'Pantry shelf' && ps && ps.photos.length === 1, ''); }
    else { check('P9', 'Save possible after a new item photo', false, JSON.stringify({ v3, s3 })); await H.leave(); }
  });
  await H.finish('n3');
})().catch((e) => { console.error(e); process.exit(1); });
