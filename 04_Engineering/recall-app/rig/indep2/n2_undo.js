// indep2 / n2: Undo stale checks with another phone's edits (ruling 7)
const { boot } = require('./x.js');
(async () => {
  const H = await boot();
  const { page, W, check, info, step, S } = H;
  await H.seed();
  await page.evaluate(() => window.__rig.seed([{ id: 'robert', name: 'Robert' }], 'recall_users'));

  await step('B1', 'another phone adds a photo to the ITEM after a Move that added item photos', async () => {
    const p0 = await H.byId('pp');
    await H.openMove('passport'); const strip = await H.strip(); await H.typeWhere('office'); await H.done(); await H.shoot('real_passport.jpg'); await H.save();
    const p1 = await H.byId('pp'); await W(2500);
    // Robert's phone: Add photo on the passport page (addSnapToLog: a snap + photoCount + updatedAt; no lastSeenAt)
    const now = Date.now();
    await H.seedMore([H.snapDoc('sRob', 'pp', 'card.jpg', p1.location, 0, { at: now, extra: true, by: 'robert', logId: p1.logId })]);
    await H.write('pp', { photoCount: (p1.photoCount || 1) + 1, updatedAt: now }); await W(400);
    const t = await H.undoPage(); await W(400);
    const sn = await H.snapsOf('pp'); const p2 = await H.byId('pp');
    info('B1', JSON.stringify({ strip, toast: t, robSnap: !!sn.find((s) => s.id === 'sRob'), snaps: sn.length, pc: [p0.photoCount, p1.photoCount, p2.photoCount], edge: (await H.edgeOf('pp')).to }));
    check('B1', 'Undo never deletes Robert’s newer photo of the item ("Not undone · it changed since", or his photo kept)', !!sn.find((s) => s.id === 'sRob') || /changed since/.test(t), JSON.stringify({ toast: t, snaps: sn.map((s) => s.id) }));
  });

  await H.seed();
  await step('B2', 'a place the save made: another phone puts it inside another place', async () => {
    await H.openMove('wallet'); await H.typeWhere('loft'); await H.done(); await H.save();
    const lf = await H.placeBy('Loft'); await W(2500);
    await H.seedMore([H.edge('eLoftRob', lf.id, { t: 'place', name: 'Garage' }, 0, { by: 'robert', since: Date.now() })]); await W(400);
    const t = await H.undoPage(); await W(400);
    const lf2 = await H.placeBy('Loft'); const e = (await H.dump()).find((d) => d.id === 'eLoftRob');
    info('B2', JSON.stringify({ toast: t, loft: !!lf2, robEdge: e ? { until: e.until } : null, wallet: (await H.edgeOf('wal')).to }));
    check('B2', 'Undo never deletes the Loft + Robert’s "Loft is in the Garage" (stale, or kept)', (!!lf2 && !!e) || /changed since/.test(t), JSON.stringify({ toast: t, loft: !!lf2, robEdge: !!e }));
  });

  await H.seed();
  await step('B3', 'another phone adds a photo to the place 1 s after the save', async () => {
    await H.openMove('wallet'); await H.typeWhere('garage'); await H.done(); await H.shoot('tooldrawer.jpg'); await H.save();
    const g1 = await H.placeBy('Garage'); await W(300);
    await H.write('pGarage', { photos: [...g1.photos, { photo: H.img('box14.jpg'), thumb: H.img('box14.jpg'), at: Date.now() }], updatedAt: Date.now() }); await W(300);
    const t = await H.undoPage(); await W(400); const g2 = await H.placeBy('Garage');
    info('B3', JSON.stringify({ toast: t, n: [g1.photos.length, g2.photos.length], robKept: g2.photos.some((p) => p.photo === H.img('box14.jpg')) }));
    check('B3', 'Undo never deletes Robert’s Garage photo taken just after the save', g2.photos.some((p) => p.photo === H.img('box14.jpg')) || /changed since/.test(t), JSON.stringify({ toast: t }));
  });

  await H.seed();
  await step('B4', 'a box this save moved (level change); another phone moves that box', async () => {
    await H.openMove('wallet'); await H.typeWhere('small box'); await H.done(); await H.tap('.ow-go', 600);
    await page.locator('.ow-lvl .ow-lvl-change').nth(1).click(); await W(500);
    await page.fill('.in-list .wl-search input', 'garage'); await W(400); await page.locator('.in-list .wl-row').first().click(); await W(400); await H.tap('.ow-done', 500);
    const head = await H.head(); await H.save();
    const sm1 = await H.edgeOf('small'); info('B4a', JSON.stringify({ head, small: sm1 && sm1.to, wallet: (await H.edgeOf('wal')).to }));
    await W(2500);
    const sm = await H.byId('small'); const now = Date.now();
    await H.write(sm1.id, { until: now }); await H.seedMore([H.edge('eSmRob', 'small', { t: 'place', name: 'Hall closet' }, 0, { since: now, by: 'robert' })]);
    await H.write('small', { location: 'Hall closet', history: [...sm.history, { location: 'Hall closet', at: now, by: 'robert' }], lastSeenAt: now }); await W(400);
    const t = await H.undoPage(); await W(400);
    info('B4', JSON.stringify({ toast: t, small: (await H.edgeOf('small')).to, wallet: (await H.edgeOf('wal')).to }));
    check('B4', 'Not undone · the small box changed since; it stays in the Hall closet', /changed since/.test(t) && (await H.edgeOf('small')).to.name === 'Hall closet', JSON.stringify({ toast: t }));
  });

  await H.seed();
  await step('B5', 'Robert’s note: Move clears it; Undo restores author and time', async () => {
    const g0 = await H.byId('gl'); const at0 = g0.history[1].at;
    await H.write('gl', { history: [g0.history[0], { ...g0.history[1], by: 'robert', saidAt: at0 }] }); await W(300);
    await H.openThing('reading glasses'); const n0 = await H.note();
    await H.tap('.thing-page button:has-text("Move it")', 900); await H.typeWhere('garage'); await H.done(); await H.save();
    const t = await H.undoPage(); await W(500);
    const g2 = await H.byId('gl'); const n2 = await H.note(); const last = H.wsOf(g2).slice(-1)[0];
    info('B5', JSON.stringify({ n0, n2, last, at0 }));
    check('B5', 'Undo: "behind the stapler" back as Robert’s, with its own time', /stapler/.test(n2) && /Robert/.test(n2) && last.by === 'robert' && (last.saidAt || last.at) === at0, JSON.stringify({ n0, n2, last }));
  });

  await H.seed();
  await step('B6', 'Undo from the item page after she herself put another item in the new place', async () => {
    await H.openMove('wallet'); await H.typeWhere('attic'); await H.done(); await H.save(); await W(500);
    // second save on THIS phone: scissors into the Attic, then go back to the wallet page and Undo
    await H.openMove('scissors'); await H.typeWhere('attic'); await H.done(); await H.save(); await W(500);
    await H.openThing('wallet'); const hasU = await H.has('.tp-moved .u'); info('B6a', 'wallet page still offers Undo: ' + hasU);
    if (hasU) { const t = await H.undoPage(); await W(400); info('B6', JSON.stringify({ toast: t, attic: !!(await H.placeBy('Attic')), sc: (await H.edgeOf('sc')).to, wal: (await H.edgeOf('wal')).to }));
      check('B6', 'the Attic stays (the scissors are in it)', !!(await H.placeBy('Attic')) && (await H.edgeOf('sc')).to.name === 'Attic'); }
  });

  await H.seed();
  await step('B7', 'Undo after another phone re-named the box the save added photos to', async () => {
    await H.openMove('wallet'); await H.typeWhere('blue tin'); await H.done(); await H.shoot('tin.jpg'); await H.save(); await W(2500);
    await H.write('tin', { name: 'biscuit tin', updatedAt: Date.now() }); await W(300);
    const t = await H.undoPage(); await W(400);
    info('B7', JSON.stringify({ toast: t, tin: (await H.byId('tin')).name, tinSnaps: (await H.snapsOf('tin')).length, wal: (await H.edgeOf('wal')).to }));
  });
  await H.finish('n2');
})().catch((e) => { console.error(e); process.exit(1); });
