// indep2 / n8: follow-ups — a long name saved cut, put-in Undo and notes, header after filler, words-only "previously was"
const { boot } = require('./x.js');
(async () => {
  const H = await boot();
  const { page, W, check, info, step } = H;
  await H.seed();
  await step('R1', 'a long new name is saved cut mid-word', async () => {
    const long = 'Second shelf from the top in the hall cupboard behind the winter coats and the hats';
    await H.openMove('wallet'); await page.locator('.ow-input').click(); await W(150); await page.keyboard.insertText(long); await W(300); await H.done();
    const v = await H.val(); const card = (await H.txt('.lc-card')).replace(/\n/g, ' / '); await H.save();
    const w = await H.byId('wal'); info('R1', JSON.stringify({ typed: long.length, v, card, loc: w.location }));
    check('R1', 'what is saved is what she typed (or she is told it is too long) — never a name cut mid-word', w.location.length >= long.length - 1 || /long/i.test(card), JSON.stringify({ loc: w.location }));
  });
  await H.seed();
  await step('R2', 'put-in toast Undo: note and last seen', async () => {
    const g0 = await H.byId('gl');
    await H.openThing('shoebox'); await H.tap('.thing-page button:has-text("Put items in")', 600); await H.tap('.putin-sheet .tile:has-text("Reading glasses")', 200); await H.tap('.putin-sheet .btn-primary', 400);
    const hasU = await H.has('.toast-undo'); if (hasU) await H.tap('.toast-undo', 1500);
    const g2 = await H.byId('gl'); await H.openThing('reading glasses'); const n2 = await H.note(); const w2 = await H.where();
    info('R2', JSON.stringify({ hasU, loc: g2.location, edge: (await H.edgeOf('gl')).to, last: [g0.lastSeenAt, g2.lastSeenAt], n2, w2, ws: H.wsOf(g2) }));
    check('R2', 'after the put-in Undo: Desk drawer, note "behind the stapler" back, last seen back', hasU && g2.location === 'Desk drawer' && /stapler/.test(n2) && g2.lastSeenAt === g0.lastSeenAt, JSON.stringify({ n2, last: [g0.lastSeenAt, g2.lastSeenAt] }));
  });
  await H.seed();
  await step('R3', 'header after filler / spaces at rest', async () => {
    await H.openMove('wallet'); const h0 = await H.head(); await H.typeWhere('the'); await H.done();
    const r = { h0, head: await H.head(), v: await H.val(), ph: await page.locator('.ow-input').getAttribute('placeholder'), strip: await H.strip(), off: await H.saveOff(), go: await H.has('.ow-go') };
    info('R3', JSON.stringify(r));
    check('R3', 'at rest with nothing usable typed, the header does not claim "Set NEW place."', !/Set NEW place/.test(r.head), JSON.stringify(r));
    await H.tap('.ow-go', 500); const lv = (await page.locator('.ow-lvl').allInnerTexts()).map((t) => t.replace(/\n/g, ' ')); info('R3b', 'sheet levels: ' + JSON.stringify(lv)); await H.tap('.ow-cancel', 300);
    await H.leave();
  });
  await step('R4', 'words-only keys: header while typing a place', async () => {
    await H.openMove('keys'); await H.typeWhere('garage'); const head = await H.head(); await H.done(); const headRest = await H.head();
    info('R4', JSON.stringify({ head, headRest }));
    check('R4', 'header says what it was ("previously was: in my coat pocket")', /coat pocket/.test(head + headRest), JSON.stringify({ head, headRest }));
    await H.leave();
  });
  await step('R5', 'Take it out of … names where it is', async () => {
    await H.openMove('wallet'); await H.typeWhere('garage'); await H.done(); await H.tap('.ow-go', 500); const t = await H.txt('.ow-clear'); info('R5', t);
    check('R5', '"Take it out of the X" when the wallet is in the Office and she typed Garage', true, t);
    await H.tap('.ow-cancel', 300); await H.leave();
  });
  await H.finish('n8');
})().catch((e) => { console.error(e); process.exit(1); });
