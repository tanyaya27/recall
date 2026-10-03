// ow1 / t5: notes (ruling 4), the words-only item, Log + note, Save+Next undo, photo removal, privacy in notes (ruling 9)
const { start } = require('./lib.js');
(async () => {
  const H = await start({ port: Number(process.env.PORT || 8476) });
  const { page, W, check, info, step, S } = H;
  const toastTxt = async () => (await page.locator('.toast').allInnerTexts().catch(() => [])).join(' | ');
  await H.seed();
  S.GUESS = { name: 'X', merged: 'X' };

  await step('K1', 'words-only keys: Move at rest', async () => {
    await H.openThing('keys'); info('K1p', await H.where());
    await H.tap('.thing-page button:has-text("Move it")', 900);
    const r = { ph: await page.locator('.ow-input').getAttribute('placeholder'), head: await H.head(), v: await H.val(), off: await H.saveOff(), strip: (await H.txt('.ow-to')).replace(/\n/g, ' '), card: (await H.txt('.lc-card')).replace(/\n/g, ' / ') };
    info('K1', JSON.stringify(r));
    check('K1', 'Move of a words-only item: the field (or the header) shows where it is now — "in my coat pocket"', /coat pocket/i.test(r.v + r.head + r.card + r.ph), JSON.stringify(r));
    await H.snap('k1-keys-move.png');
    await H.leave();
  });
  await step('K2', 'words-only keys: add only a note', async () => {
    await H.openMove('keys'); await H.tap('.ow-note', 300); await page.fill('.ow-note-in', 'on the blue lanyard'); await W(200); await H.save();
    const w = await H.where(); const n = await H.note(); const k = await H.byId('ky');
    info('K2', JSON.stringify({ w, n, last: k.history.slice(-1), needsPlace: k.needsPlace }));
    check('K2', 'a note added to the words-only keys is a note, not the new where; "in my coat pocket" still says where they are', /coat pocket/.test(w) && !/lanyard/.test(w), JSON.stringify({ w, n }));
    const f = await H.find('keys'); info('K2f', JSON.stringify(f));
    check('K2f', 'Find does not answer the note as where the keys are', !/lanyard/.test(f[0] || ''), JSON.stringify(f));
  });
  await H.seed();
  await step('K3', 'words-only keys: give them a place; Undo', async () => {
    await H.openMove('keys'); await H.typeWhere('hall closet'); await H.done(); const head = await H.head(); await H.save();
    const w = await H.where(); const n = await H.note(); const k = await H.byId('ky');
    check('K3', 'keys now in the Hall closet; the old words are not a second where nor a note', /Hall closet/.test(w) && !/coat pocket/.test(w + n), JSON.stringify({ head, w, n }));
    info('K3h', 'header while setting: ' + head);
    await page.waitForSelector('.tp-moved .u'); await H.tap('.tp-moved .u', 1400);
    const w2 = await H.where(); const k2 = await H.byId('ky');
    check('K3u', 'Undo: words-only again: "in my coat pocket", no link', /coat pocket/.test(w2) && !(await H.edgeOf('ky')) && !k2.location, JSON.stringify({ w2, loc: k2.location, e: await H.edgeOf('ky') }));
    info('K3u2', 'keys snaps after undo: ' + JSON.stringify((await H.snapsOf('ky')).map((s) => [s.location, !!s.moved])) + ' needsPlace=' + k2.needsPlace);
  });
  await step('N1', 'Log item with a note and no place', async () => {
    await H.home(); S.AI = { name: 'sunglasses' }; await H.tap(H.LOG, 900); await H.shoot('glasses.jpg');
    await H.tap('.ow-note', 300); await page.fill('.ow-note-in', 'with the beach bag'); await W(200); await H.save(); await W(500);
    const it = await H.byName('sunglasses'); info('N1s', JSON.stringify({ loc: it.location, needsPlace: it.needsPlace, hist: it.history }));
    await H.openThing('sunglasses'); const w = await H.where(); const n = await H.note();
    info('N1', JSON.stringify({ w, n }));
    check('N1', 'a note on a new item with no place shows as a NOTE (small, under the photo), not as where it is (ruling 4)', /beach bag/.test(n) && !/beach bag/.test(w), JSON.stringify({ w, n }));
    const f = await H.find('sunglasses'); info('N1f', JSON.stringify(f));
  });
  await step('N2', 'a password in the note blocks Save', async () => {
    await H.openMove('wallet'); await H.tap('.ow-note', 300); await page.fill('.ow-note-in', 'pin 4821'); await W(300);
    const off = await H.saveOff(); const msg = (await H.txt('.lc-card')).replace(/\n/g, ' / ');
    check('N2', 'note "pin 4821": Save off, says why', off && /private|password|secret/i.test(msg), JSON.stringify({ off, msg }));
    await page.fill('.ow-note-in', 'login bob hunter2'); await W(300); check('N2b', 'note "login bob hunter2": Save off', await H.saveOff());
    await H.leave();
  });
  await step('N3', 'a new note + a new where; then the page', async () => {
    await H.openMove('reading glasses'); await H.typeWhere('nightstand'); await H.done(); await H.tap('.ow-note', 300); await page.fill('.ow-note-in', 'top drawer, left'); await W(200); await H.save();
    const n = await H.note(); const w = await H.where();
    check('N3', 'the new note shows under the photo, the old note gone; where = Nightstand', /top drawer, left/.test(n) && !/stapler/.test(n + w) && /Nightstand/.test(w), JSON.stringify({ n, w }));
  });
  await step('N4', 'Log: remove the item photo after place photos', async () => {
    await H.home(); S.AI = { name: 'torch' }; await H.tap(H.LOG, 900); await H.shoot('charger.jpg');
    await H.typeWhere('garage'); await H.done(); await H.shoot('tooldrawer.jpg'); await H.shoot('tooldrawer.jpg');
    const strip0 = (await H.txt('.ow-to')).replace(/\n/g, ' ');
    await H.tap('.lc-thing', 600); const hasTrash = await H.has('.pv-trash, [aria-label*="Remove"]');
    info('N4a', 'preview open, remove control: ' + hasTrash);
    const rm = page.locator('[aria-label*="emove"]').first(); if (await rm.count()) { await rm.click(); await W(400); }
    const body = await H.txt('.pv-ask'); info('N4b', 'confirm says: ' + body.replace(/\n/g, ' / '));
    if (await H.has('.pv-ask button:has-text("Remove")')) await H.tap('.pv-ask button:has-text("Remove")', 600);
    const strip1 = (await H.txt('.ow-to')).replace(/\n/g, ' '); const card = await H.has('.lc-card');
    info('N4', JSON.stringify({ strip0, strip1, cardStill: card, title: await H.txt('.lc-title') }));
    check('N4', '"Only this photo goes": removing the item’s photo keeps the 2 Garage photos', /Garage.*2/.test(strip1), JSON.stringify({ strip0, strip1, card }));
    await H.leave();
  });
  await step('N5', 'Log: Save+Next, Undo the first from the camera', async () => {
    await H.home(); S.AI = { name: 'hammer' }; await H.tap(H.LOG, 900); await H.shoot('tooldrawer.jpg');
    await H.typeWhere('tool wall'); await H.done(); await H.shoot('closet.jpg'); await W(2200); if (await H.has('.ow-ai-no')) await H.tap('.ow-ai-no', 200);
    await H.holdSave(750);
    const undoBar = await H.txt('.lc-undo'); info('N5a', 'after Save+Next: ' + undoBar + ' field=' + (await H.val().catch(() => '-')));
    if (await H.has('.lc-undo button')) await H.tap('.lc-undo button', 1500);
    const hm = await H.byName('hammer'); const tw = await H.placeBy('Tool wall');
    info('N5', JSON.stringify({ hammer: !!hm, toolWall: !!tw, undoBar: await H.txt('.lc-undo') }));
    check('N5', 'Undo of the first item: hammer gone, Tool wall (made by that save, nothing else in it) gone', !hm && !tw, JSON.stringify({ hammer: !!hm, toolWall: !!tw }));
    // the camera still shows the where "Tool wall" for the next item?
    const v = await H.val().catch(() => '-'); S.AI = { name: 'wrench' }; await H.shoot('scissors.jpg');
    const v2 = await H.val(); const head = await H.head(); const strip = (await H.txt('.ow-to')).replace(/\n/g, ' ');
    info('N5b', JSON.stringify({ before: v, v2, head, strip }));
    await H.save(); const wr = await H.byName('wrench'); const tw2 = await H.placesNamed('Tool wall');
    info('N5c', JSON.stringify({ wrench: wr && wr.location, edge: wr && (await H.edgeOf(wr.id)), toolWallDocs: tw2.length }));
    check('N5c', 'after the Undo, the next item saved to "Tool wall" has a real place doc again (what the screen said)', wr && (await H.edgeOf(wr.id)) && (wr.location ? tw2.length === 1 : true), JSON.stringify({ loc: wr && wr.location, docs: tw2.length }));
  });
  await step('N6', 'a new item, typed where = its own AI name', async () => {
    await H.home(); S.AI = { name: 'drill' }; await H.tap(H.LOG, 900); await H.shoot('tooldrawer.jpg'); await W(600);
    await H.typeWhere('drill'); const hint = await H.txt('.ow-hint'); await H.done();
    info('N6', JSON.stringify({ hint, v: await H.val(), off: await H.saveOff(), head: await H.head() }));
    await H.leave();
  });
  await H.finish('t5');
})().catch((e) => { console.error(e); process.exit(1); });
