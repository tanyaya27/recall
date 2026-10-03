// indep2 / n6: "Put items in" from a box page (notes, Undo), place cap, loops on re-parenting, a box with contents (rulings 3, 4, 5, 7)
const { boot } = require('./x.js');
(async () => {
  const H = await boot();
  const { page, W, check, info, step, S } = H;
  const putIn = async (box, label) => { await H.openThing(box); await H.tap('.thing-page button:has-text("Put items in")', 600); await H.tap(`.putin-sheet .tile:has-text("${label}")`, 200); await H.tap('.putin-sheet .btn-primary', 900); return H.toastTxt(); };
  await H.seed();

  await step('Q1', 'put the reading glasses in the shoebox from its page; then a camera Move + Undo', async () => {
    const t = await putIn('shoebox', 'Reading glasses'); await W(300);
    const g1 = await H.byId('gl'); await H.openThing('reading glasses'); const n1 = await H.note(); const w1 = await H.where();
    info('Q1a', JSON.stringify({ toast: t, loc: g1.location, ws: H.wsOf(g1), n1, w1 }));
    check('Q1a', 'new where (Shoebox): the old note "behind the stapler" is no longer shown', !/stapler/.test(n1), JSON.stringify({ n1 }));
    await W(1000);
    await H.tap('.thing-page button:has-text("Move it")', 900); await H.typeWhere('garage'); await H.done(); await H.save();
    const tu = await H.undoPage(); await W(500);
    const g2 = await H.byId('gl'); const n2 = await H.note(); const w2 = await H.where();
    info('Q1b', JSON.stringify({ toast: tu, loc: g2.location, ws: H.wsOf(g2), n2, w2 }));
    check('Q1b', 'Undo puts back exactly what was there before the Move: Shoebox, and NO note (there was none on screen)', /Shoebox/.test(w2) && !/stapler/.test(n2), JSON.stringify({ w2, n2 }));
  });

  await H.seed();
  await step('Q2', 'put-in toast Undo after another phone moved the wallet', async () => {
    const t = await putIn('shoebox', 'Wallet'); await W(2500);
    const w = await H.byId('wal'); const e = await H.edgeOf('wal'); const now = Date.now();
    await H.write(e.id, { until: now }); await H.seedMore([H.edge('eWalRob', 'wal', { t: 'place', name: 'Garage' }, 0, { since: now, by: 'robert' })]);
    await H.write('wal', { location: 'Garage', history: [...w.history, { location: 'Garage', at: now, by: 'robert' }], lastSeenAt: now }); await W(300);
    const hasU = await H.has('.toast-undo'); if (hasU) await H.tap('.toast-undo', 1500);
    const w2 = await H.byId('wal'); const e2 = await H.edgeOf('wal');
    info('Q2', JSON.stringify({ toast: t, hasU, loc: w2.location, edge: e2 && e2.to, after: await H.toastTxt() }));
    check('Q2', 'Undo never rolls back Robert’s newer move (wallet stays in the Garage)', !hasU || (w2.location === 'Garage' && e2.to.name === 'Garage'), JSON.stringify({ loc: w2.location, edge: e2 && e2.to }));
  });

  await H.seed();
  await step('Q3', 'put-in toast Undo restores the note and last seen', async () => {
    const g0 = await H.byId('gl');
    await H.openThing('shoebox'); await H.tap('.thing-page button:has-text("Put items in")', 600); await H.tap('.putin-sheet .tile:has-text("Reading glasses")', 200); await H.tap('.putin-sheet .btn-primary', 300);
    await W(5600); // the note's words are older than the 5 s window
    const hasU = await H.has('.toast-undo'); if (hasU) await H.tap('.toast-undo', 1500);
    const g2 = await H.byId('gl'); await H.openThing('reading glasses'); const n2 = await H.note(); const w2 = await H.where();
    info('Q3', JSON.stringify({ hasU, loc: g2.location, last: [g0.lastSeenAt, g2.lastSeenAt], n2, w2 }));
    if (hasU) { check('Q3', 'after the put-in Undo: Desk drawer, note "behind the stapler" back, last seen back', g2.location === 'Desk drawer' && /stapler/.test(n2) && g2.lastSeenAt === g0.lastSeenAt, JSON.stringify({ n2, last: [g0.lastSeenAt, g2.lastSeenAt] })); }
  });

  await H.seed();
  await step('Q4', 'place cap: Kitchen (5) + 6 new → ≤6, main first', async () => {
    const k0 = await H.placeBy('Kitchen'); const main0 = k0.photos[0].photo;
    await H.openMove('wallet'); await H.typeWhere('kitchen'); await H.done();
    for (const f of ['soda.jpg', 'card.jpg', 'book.jpg', 'diary.jpg', 'keys.jpg', 'glasses.jpg']) await H.shoot(f);
    const s = await H.strip(); await H.save(); const k1 = await H.placeBy('Kitchen');
    info('Q4', JSON.stringify({ s, n: k1.photos.length, main: k1.photos[0].photo === main0, ats: k1.photos.map((p) => p.at - k0.photos[0].at) }));
    check('Q4', 'Kitchen ≤ 6 photos, main first', k1.photos.length <= 6 && k1.photos[0].photo === main0, '');
  });

  await H.seed();
  await step('Q5', 'ring’s Move: changing what the Blue tin is in never offers the tin or anything in it', async () => {
    await H.openMove('gold ring'); await H.tap('.ow-go', 700);
    const lv = (await page.locator('.ow-lvl').allInnerTexts()).map((t) => t.split('\n')[0]);
    await page.locator('.ow-lvl .ow-lvl-change').nth(2).click(); await W(500);
    const title = await H.txt('.in-list .sheet-title'); const rows = (await page.locator('.in-list .wl-row').allInnerTexts()).map((t) => t.split('\n')[0]);
    info('Q5', JSON.stringify({ lv, title, rows }));
    check('Q5', 'what the Blue tin is in: never the Blue tin, the Small box, the Gold ring', !rows.some((x) => /blue tin|small box|gold ring/i.test(x)), JSON.stringify(rows));
    await page.fill('.in-list .wl-search input', 'small box'); await W(300); const sb = (await page.locator('.in-list .wl-row').allInnerTexts()).map((t) => t.split('\n')[0]); const nw = await H.has('.in-list .wl-new');
    info('Q5b', JSON.stringify({ sb, nw, blocked: await H.txt('.in-list .in-blocked') }));
    check('Q5b', 'searching "small box" there: not offered, not offered as a NEW place either', !sb.some((x) => /small box/i.test(x)) && !nw, JSON.stringify({ sb, nw }));
    await page.keyboard.press('Escape'); await W(200);
  });

  await H.seed();
  await step('Q6', 'Move the blue tin (with the small box and ring inside) to the Garage; Undo', async () => {
    await H.openMove('blue tin'); await H.typeWhere('garage'); await H.done(); await H.save();
    await H.openThing('gold ring'); const w1 = await H.where(); const f1 = await H.find('gold ring');
    info('Q6a', JSON.stringify({ w1, f1 }));
    check('Q6a', 'ring page: small box › blue tin › Garage', /Small box/.test(w1) && /Blue tin/i.test(w1) && /Garage/.test(w1), w1);
    await H.openThing('blue tin'); const t = await H.undoPage(); await W(400);
    await H.openThing('gold ring'); const w2 = await H.where();
    info('Q6', JSON.stringify({ toast: t, w2, tin: (await H.edgeOf('tin')).to }));
    check('Q6', 'Undo: tin back in the Desk drawer; ring chain back', (await H.edgeOf('tin')).to.name === 'Desk drawer' && /Desk drawer/.test(w2), w2);
  });
  await H.finish('n6');
})().catch((e) => { console.error(e); process.exit(1); });
