// ow1 / t8: Log item that turns out to be one she has ("Your wallet?" Yes), Home-card Undo after Log saves
const { start } = require('./lib.js');
(async () => {
  const H = await start({ port: Number(process.env.PORT || 8479) });
  const { page, W, check, info, step, S } = H;
  await H.seed();
  S.GUESS = { name: 'X', merged: 'X' };
  const cardUndo = async () => { await page.waitForSelector('button.u:has-text("Undo")', { timeout: 5000 }); await H.tap('button.u:has-text("Undo")', 1500); };
  await step('M1', 're-log the wallet into the Garage with a Garage photo; Undo', async () => {
    const w0 = await H.byId('wal'); const g0 = (await H.placeBy('Garage')).photos.map((p) => p.at).join(); const sn0 = (await H.snapsOf('wal')).length;
    await H.home(); S.AI = { name: 'wallet' }; await H.tap(H.LOG, 900); await H.shoot('wallet.jpg'); await W(800);
    const ask = (await H.txt('.lc-ask')).replace(/\n/g, ' '); info('M1a', 'ask: ' + ask);
    if (await H.has('.lc-ask button:has-text("Yes")')) await H.tap('.lc-ask button:has-text("Yes")', 400);
    const v = await H.val(); const head = await H.head(); info('M1b', JSON.stringify({ v, head, strip: (await H.txt('.ow-to')).replace(/\n/g, ' ') }));
    check('M1b', '"Yes, it’s my wallet": the field starts where the wallet is (Office)', v === 'Office', v);
    await H.typeWhere('garage'); await H.done(); await H.shoot('tooldrawer.jpg'); await H.save(); await W(500);
    const w1 = await H.byId('wal'); const g1 = (await H.placeBy('Garage')).photos.length;
    info('M1c', JSON.stringify({ edge: (await H.edgeOf('wal')).to, coverChanged: w1.photo !== w0.photo, garagePhotos: g1, items: (await H.items()).filter((x) => /wallet/i.test(x.name)).length }));
    await cardUndo();
    const w2 = await H.byId('wal'); const g2 = (await H.placeBy('Garage')).photos.map((p) => p.at).join(); const sn2 = (await H.snapsOf('wal')).length;
    check('M1', 'Undo: wallet back in the Office with its old cover, Garage photos as before, no extra snaps', (await H.edgeOf('wal')).to.name === 'Office' && w2.photo === w0.photo && g2 === g0 && sn2 === sn0 && w2.lastSeenAt === w0.lastSeenAt, JSON.stringify({ e: (await H.edgeOf('wal')).to, cover: w2.photo === w0.photo, garage: g2 === g0, snaps: [sn0, sn2], last: [w0.lastSeenAt, w2.lastSeenAt] }));
  });
  await step('M2', 'Log a new item into a new place with a new level; Undo', async () => {
    const n0 = (await H.places()).length;
    await H.home(); S.AI = { name: 'umbrella' }; await H.tap(H.LOG, 900); await H.shoot('real_slippers.jpg');
    await H.typeWhere('porch'); await H.done(); await H.tap('.ow-go', 500); await H.tap('.ow-up', 500); await page.fill('.in-list .wl-search input', 'front of house'); await W(300); await H.tap('.in-list .wl-new', 400); await H.tap('.ow-done', 400);
    await H.shoot('closet.jpg'); await W(2200); if (await H.has('.ow-ai-no')) await H.tap('.ow-ai-no', 200);
    await H.save(); await W(500);
    const u = await H.byName('umbrella'); const po = await H.placeBy('Porch'); info('M2a', JSON.stringify({ u: !!u, porch: po && (await H.edgeOf(po.id)), photos: po && po.photos.length }));
    await cardUndo();
    check('M2', 'Undo: umbrella, Porch and Front of house all gone', !(await H.byName('umbrella')) && !(await H.placeBy('Porch')) && !(await H.placeBy('Front of house')) && (await H.places()).length === n0, JSON.stringify({ u: !!(await H.byName('umbrella')), porch: !!(await H.placeBy('Porch')), front: !!(await H.placeBy('Front of house')) }));
    const orphan = (await H.dump()).filter((d) => d.kind === 'edge' && !d.until && po && d.from === po.id); check('M2b', 'no open edge left from the deleted Porch', orphan.length === 0, JSON.stringify(orphan));
  });
  await step('M3', 'Log a new item into a box with a box photo; Undo', async () => {
    const s0 = (await H.snapsOf('shoe')).length; const sh0 = await H.byId('shoe');
    await H.home(); S.AI = { name: 'gloves' }; await H.tap(H.LOG, 900); await H.shoot('real_slippers.jpg');
    await H.typeWhere('shoebox'); await H.done(); await H.shoot('box.jpg'); await H.save(); await W(500);
    const s1 = (await H.snapsOf('shoe')).length;
    await cardUndo();
    const s2 = (await H.snapsOf('shoe')).length; const sh2 = await H.byId('shoe');
    check('M3', 'Undo: gloves gone and the shoebox’s photos as before', !(await H.byName('gloves')) && s2 === s0 && (sh2.photoCount || 1) === (sh0.photoCount || 1), JSON.stringify({ snaps: [s0, s1, s2], pc: [sh0.photoCount, sh2.photoCount] }));
  });
  await H.finish('t8');
})().catch((e) => { console.error(e); process.exit(1); });
