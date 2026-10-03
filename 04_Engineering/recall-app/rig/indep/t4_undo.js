// ow1 / t4: Undo (ruling 7), place photos rotation (ruling 5), another phone (ruling 7)
const { start } = require('./lib.js');
(async () => {
  const H = await start({ port: Number(process.env.PORT || 8475) });
  const { page, W, check, info, step, S } = H;
  const undo = async () => { await page.waitForSelector('.tp-moved .u'); await H.tap('.tp-moved .u', 1400); return (await H.txt('.toast, [role="status"]')); };
  const toastTxt = async () => (await page.locator('.toast').allInnerTexts().catch(() => [])).join(' | ');
  await H.seed();
  S.GUESS = { name: 'X', merged: 'X' };

  await step('U1', 'photos to a place with 5 → 6 kept, main stays; Undo restores 5', async () => {
    const k0 = await H.placeBy('Kitchen'); const main0 = k0.photos[0].photo; const ats0 = k0.photos.map((p) => p.at);
    await H.openMove('wallet'); await H.typeWhere('kitchen'); await H.done();
    await H.shoot('real_spoon.jpg'); await H.shoot('soda.jpg'); await H.shoot('charger.jpg');
    const cover0 = (await H.byId('wal')).photo;
    await H.save();
    const k1 = await H.placeBy('Kitchen');
    check('U1a', 'Kitchen keeps 6: the main photo first, the 3 new ones in, the 2 oldest others out', k1.photos.length === 6 && k1.photos[0].photo === main0 && k1.photos.slice(1, 3).every((p, i) => p.at === ats0[3 + i]), JSON.stringify(k1.photos.map((p) => p.at - ats0[0])));
    check('U1b', 'the wallet’s own cover is unchanged', (await H.byId('wal')).photo === cover0);
    await undo();
    const k2 = await H.placeBy('Kitchen');
    check('U1', 'Undo: Kitchen photos exactly as before; wallet back in the Office', k2.photos.length === 5 && k2.photos.map((p) => p.at).join() === ats0.join() && (await H.edgeOf('wal')).to.name === 'Office', JSON.stringify({ n: k2.photos.length, e: (await H.edgeOf('wal')).to }));
    const sn = await H.snapsOf('wal'); info('U1s', 'wallet snaps after Move+Undo: ' + JSON.stringify(sn.map((s) => ({ loc: s.location, moved: !!s.moved }))));
    check('U1c', 'Undo leaves no "moved to Kitchen" sighting behind on the wallet', !sn.some((s) => /kitchen/i.test(s.location || '')), JSON.stringify(sn.map((s) => s.location)));
  });
  await step('U2', 'Undo after another phone added a photo to the same place', async () => {
    await H.openMove('wallet'); await H.typeWhere('garage'); await H.done(); await H.shoot('tooldrawer.jpg'); await H.save();
    const g1 = await H.placeBy('Garage'); const n1 = g1.photos.length;
    // robert's phone adds a photo to the Garage, after the save
    await W(2500);
    await H.write('pGarage', { photos: [...g1.photos, { photo: H.img('box14.jpg'), thumb: H.img('box14.jpg'), at: Date.now() }], updatedAt: Date.now() });
    await W(300);
    await undo(); const t = await toastTxt();
    const g2 = await H.placeBy('Garage');
    info('U2', JSON.stringify({ n1, after: g2.photos.length, toast: t, edge: (await H.edgeOf('wal')).to }));
    check('U2', 'Undo never removes the other phone’s newer Garage photo', g2.photos.some((p) => p.photo === H.img('box14.jpg') && p.at > Date.now() - 60000), JSON.stringify({ n1, after: g2.photos.length, toast: t }));
  });
  await H.seed();
  await step('U3', 'photos added to a BOX she has; Undo', async () => {
    const tinSn0 = (await H.snapsOf('tin')).length; const tin0 = await H.byId('tin');
    await H.openMove('wallet'); await H.typeWhere('in the blue tin'); await H.done();
    const strip = (await H.txt('.ow-to')).replace(/\n/g, ' '); await H.shoot('tin.jpg'); await H.save();
    const tinSn1 = (await H.snapsOf('tin')).length; const tin1 = await H.byId('tin');
    info('U3a', JSON.stringify({ strip, tinSn0, tinSn1, pc0: tin0.photoCount, pc1: tin1.photoCount, cover: tin1.photo === tin0.photo }));
    await undo();
    const tinSn2 = (await H.snapsOf('tin')).length; const tin2 = await H.byId('tin');
    check('U3', 'Undo takes back the photo the save added to the blue tin', tinSn2 === tinSn0 && (tin2.photoCount || 1) === (tin0.photoCount || 1), JSON.stringify({ snaps: [tinSn0, tinSn1, tinSn2], photoCount: [tin0.photoCount, tin1.photoCount, tin2.photoCount] }));
    check('U3b', 'wallet back in the Office', (await H.edgeOf('wal')).to.name === 'Office');
  });
  await step('U4', 'a new where clears the note; Undo brings it back with its time and author', async () => {
    // the note was written by Robert
    const g0 = await H.byId('gl'); const hist = g0.history.map((h) => (h.w ? { ...h, by: 'robert' } : h)); await H.write('gl', { history: hist });
    await page.evaluate(() => window.__rig.seed([{ id: 'robert', name: 'Robert' }], 'recall_users')); await W(300);
    await H.openThing('reading glasses'); const note0 = await H.note(); info('U4a', 'note before: ' + note0);
    await H.tap('.thing-page button:has-text("Move it")', 900); await H.typeWhere('garage'); await H.done(); await H.save();
    const note1 = await H.note(); const g1 = await H.byId('gl');
    check('U4a', 'moved to the Garage: the old note is gone (page and store)', !note1 && !/stapler/.test(JSON.stringify(g1.history.slice(-1))), JSON.stringify({ note1, last: g1.history.slice(-1) }));
    await undo(); await W(300);
    const g2 = await H.byId('gl'); const note2 = await H.note();
    const last = g2.history.filter((h) => h.w).slice(-1)[0];
    info('U4b', JSON.stringify({ note2, last }));
    check('U4', 'Undo: the note is back, Robert’s, with its own time', /behind the stapler/.test(note2) && /Robert/.test(note2) && last && last.by === 'robert' && Math.abs((last.saidAt || last.at) - (g0.history[1].at)) < 5, JSON.stringify({ note2, last, orig: g0.history[1] }));
    check('U4c', 'Undo: last seen back', g2.lastSeenAt === g0.lastSeenAt, `${g0.lastSeenAt} vs ${g2.lastSeenAt}`);
  });
  await step('U5', 'Undo a note-only save', async () => {
    const g0 = await H.byId('gl');
    await H.openMove('reading glasses'); await H.tap('.ow-note', 300); await page.fill('.ow-note-in', 'left side'); await W(200); await H.save();
    const n1 = await H.note(); await undo(); const n2 = await H.note(); const g2 = await H.byId('gl');
    check('U5', 'note-only save then Undo: the old note back', /left side/.test(n1) && /behind the stapler/.test(n2), JSON.stringify({ n1, n2 }));
    check('U5b', 'note-only Undo: last seen back', g2.lastSeenAt === g0.lastSeenAt, `${g0.lastSeenAt} vs ${g2.lastSeenAt}`);
  });
  await step('U6', 'Undo a new place with new levels while another phone put something in the outer one', async () => {
    await H.openMove('brochure'); await H.typeWhere('top shelf'); await H.done(); await H.tap('.ow-go', 500);
    await H.tap('.ow-up', 500); await page.fill('.in-list .wl-search input', 'bookcase'); await W(300); await H.tap('.in-list .wl-new', 400); await H.tap('.ow-done', 400);
    await H.save();
    const bc = await H.placeBy('Bookcase'); const ts = await H.placeBy('Top shelf');
    check('U6a', 'made Top shelf in Bookcase', bc && ts && (await H.edgeOf(ts.id)).to.name === 'Bookcase');
    await W(2500);
    // another phone: the charger goes into the Bookcase
    const ch = await H.byId('ch'); const e = await H.edgeOf('ch'); const now = Date.now();
    await H.write(e.id, { until: now });
    await page.evaluate(([n]) => window.__rig.seed([{ id: 'eChBc', kind: 'edge', rel: 'in', from: 'ch', to: { t: 'place', name: 'Bookcase' }, since: n, until: null, how: 'chosen', owner: 'margaret', by: 'robert', private: false, roles: {}, sharedWith: [] }]), [now]);
    await H.write('ch', { location: 'Bookcase', history: [...ch.history, { location: 'Bookcase', at: now, by: 'robert' }], lastSeenAt: now });
    await W(300);
    await undo(); const t = await toastTxt();
    const bc2 = await H.placeBy('Bookcase'); const ts2 = await H.placeBy('Top shelf');
    check('U6', 'Undo: brochure back in the Office, Top shelf gone, Bookcase kept (the charger is in it)', (await H.edgeOf('br')).to.name === 'Office' && !ts2 && !!bc2 && (await H.edgeOf('ch')).to.name === 'Bookcase', JSON.stringify({ br: (await H.edgeOf('br')).to, ts2: !!ts2, bc2: !!bc2, toast: t }));
  });
  await step('U7', 'Undo after another phone added a photo to the NEW place this save made', async () => {
    await H.openMove('brochure'); await H.typeWhere('loft'); await H.done(); await H.shoot('box.jpg'); await W(2200); if (await H.has('.ow-ai-no')) await H.tap('.ow-ai-no', 200); await H.save();
    const lf = await H.placeBy('Loft'); await W(2500);
    await H.write(lf.id, { photos: [...lf.photos, { photo: H.img('closet.jpg'), thumb: H.img('closet.jpg'), at: Date.now() }], updatedAt: Date.now() });
    await W(300); await undo(); const t = await toastTxt();
    const lf2 = await H.placeBy('Loft');
    info('U7', JSON.stringify({ loft: !!lf2, n: lf2 && lf2.photos.length, toast: t, br: (await H.edgeOf('br')).to }));
    check('U7', 'Undo never deletes a newer photo another phone added (the Loft keeps it, or "Not undone · it changed since")', !!lf2 || /changed since/.test(t), JSON.stringify({ loft: !!lf2, toast: t }));
  });
  await step('U8', 'Undo after another phone re-named the new place', async () => {
    await H.openMove('brochure'); await H.typeWhere('cellar'); await H.done(); await H.save();
    const c = await H.placeBy('Cellar'); await W(2500);
    await H.write(c.id, { name: 'Wine cellar', updatedAt: Date.now() });
    // other phone renames the place and the open edges follow
    const e = await H.edgeOf('br'); await H.write(e.id, { to: { t: 'place', name: 'Wine cellar' } }); await H.write('br', { location: 'Wine cellar' });
    await W(300); await undo(); const t = await toastTxt();
    info('U8', JSON.stringify({ toast: t, br: (await H.edgeOf('br')).to, wine: !!(await H.placeBy('Wine cellar')) }));
  });
  await step('U9', 'private item: Move photos stay its own; Undo restores the cover', async () => {
    const p0 = await H.byId('pp'); const kn0 = (await H.placeBy('Office')).photos.length;
    await H.openMove('passport'); const strip0 = (await H.txt('.ow-to')).replace(/\n/g, ' ');
    await H.typeWhere('office'); await H.done(); const strip1 = (await H.txt('.ow-to')).replace(/\n/g, ' ');
    const on1 = await H.txt('.ow-to .on');
    await H.shoot('real_passport.jpg'); await H.save();
    const p1 = await H.byId('pp'); const kn1 = (await H.placeBy('Office')).photos.length;
    info('U9a', JSON.stringify({ strip0, strip1, on1, coverChanged: p1.photo !== p0.photo, officePhotos: [kn0, kn1] }));
    check('U9a', 'private item: after typing a place, the Move photo is still its own (Office photos unchanged)', kn1 === kn0, JSON.stringify({ strip1, on1, kn0, kn1 }));
    const e = await H.edgeOf('pp'); check('U9b', 'its link stays private', e && e.private === true, JSON.stringify(e));
    await undo(); const p2 = await H.byId('pp');
    check('U9', 'Undo: cover, photoCount and logId as before; back in the Desk drawer; the new snap gone', p2.photo === p0.photo && p2.photoCount === p0.photoCount && p2.logId === p0.logId && (await H.edgeOf('pp')).to.name === 'Desk drawer' && (await H.snapsOf('pp')).length === 1, JSON.stringify({ cover: p2.photo === p0.photo, pc: p2.photoCount, snaps: (await H.snapsOf('pp')).length, e: (await H.edgeOf('pp')).to }));
  });
  await step('U10', 'Undo after another phone changed only the note', async () => {
    await H.openMove('wallet'); await H.typeWhere('hall closet'); await H.done(); await H.save(); await W(2500);
    const w = await H.byId('wal'); await H.write('wal', { history: [...w.history, { location: 'Hall closet', at: Date.now(), w: 1, said: 'top shelf', by: 'robert' }] });
    await W(300); await undo(); const t = await toastTxt();
    check('U10', 'Not undone · it changed since', /changed since/.test(t) && (await H.edgeOf('wal')).to.name === 'Hall closet', JSON.stringify({ t, e: (await H.edgeOf('wal')).to }));
  });
  await H.finish('t4');
})().catch((e) => { console.error(e); process.exit(1); });
