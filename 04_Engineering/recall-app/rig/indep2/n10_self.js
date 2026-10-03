// indep2 / n10: on Log, the new item's own name as its where (ruling 2 "the item itself")
const { boot } = require('./x.js');
(async () => {
  const H = await boot();
  const { page, W, check, info, step, S } = H;
  await H.seed();
  await step('S1', 'Log "drill", type "drill" as where, Save', async () => {
    await H.logNew('drill', 'tooldrawer.jpg'); await H.typeWhere('my drill'); const hint = await H.txt('.ow-hint'); await H.done(); const head = await H.head(); const off = await H.saveOff();
    if (!off) await H.save(); else await H.leave(); await W(500);
    const d = await H.byName('drill'); info('S1', JSON.stringify({ hint, head, off, loc: d && d.location, place: !!(await H.placeBy('Drill')) }));
    check('S1', 'the item itself is never its own where (Can’t put it there.)', off || !(d && d.location === 'Drill'), JSON.stringify({ head, loc: d && d.location }));
  });
  await H.seed();
  await step('S2', 'Log "mitten": the blank-field guess "Mitten" fills it; Save', async () => {
    S.GUESS = { name: 'Mitten', merged: 'Mitten' };
    await H.logNew('mitten', 'soda.jpg'); const seg = page.locator('.ow-to .ow-to-where'); if (await seg.count()) { await seg.click(); await W(300); }
    await H.shoot('closet.jpg'); await W(2700); const v = await H.val(); const off = await H.saveOff();
    if (!off) await H.save(); else await H.leave(); await W(500);
    const m = await H.byName('mitten'); info('S2', JSON.stringify({ v, off, loc: m && m.location, place: !!(await H.placeBy('Mitten')) }));
    check('S2', 'the guess never makes the item its own where', !(m && m.location === 'Mitten'), JSON.stringify({ v, loc: m && m.location }));
  });
  await H.finish('n10');
})().catch((e) => { console.error(e); process.exit(1); });
