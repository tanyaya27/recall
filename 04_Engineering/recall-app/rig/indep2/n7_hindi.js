// indep2 / n7: names outside a–z (Hindi, accents, symbols) in the where field and Find (rulings 1, 2)
const { boot } = require('./x.js');
(async () => {
  const H = await boot();
  const { page, W, check, info, step } = H;
  const seedH = async (withItem) => {
    await H.seed();
    await H.seedMore([H.place('pRasoi', 'रसोई', ['soda.jpg']), H.place('pAlmari', 'अलमारी', ['book.jpg']), H.place('pCafe', 'Café', ['card.jpg']),
      H.item('spice', 'spice tin', 'रसोई', 'tin.jpg', 6e6), H.edge('eSpice', 'spice', { t: 'place', name: 'रसोई' }),
      ...(withItem ? [H.item('chabi', 'चाबी', 'Office', 'keys.jpg', 6e6), H.edge('eChabi', 'chabi', { t: 'place', name: 'Office' })] : [])]); await W(400);
  };
  const probe = async (id, nm, typed) => {
    await H.openMove(nm); await H.typeWhere(typed); const head = await H.head(); const hint = await H.txt('.ow-hint'); await H.done();
    const r = { typed, head, hint, v: await H.val(), off: await H.saveOff() };
    if (!r.off) { const n0 = (await H.places()).length; await H.save(); const it = (await H.items()).find((x) => x.name === nm || x.name === nm.toLowerCase()); r.loc = it.location; r.edge = (await H.edgeOf(it.id) || {}).to; r.newPlaces = (await H.places()).length - n0; }
    else await H.leave();
    info(id, JSON.stringify(r)); return r;
  };
  await seedH(false);
  await step('H1', 'no Hindi-named item: typing अलमारी', async () => {
    const r = await probe('H1', 'wallet', 'अलमारी');
    check('H1', 'अलमारी links the place अलमारी (not रसोई), no new place', r.loc === 'अलमारी' && r.newPlaces === 0, JSON.stringify(r));
  });
  await seedH(false);
  await step('H2', 'a new Hindi place बैठक', async () => {
    const r = await probe('H2', 'wallet', 'बैठक');
    check('H2', 'बैठक is a NEW place called बैठक', r.loc === 'बैठक' && r.newPlaces === 1, JSON.stringify(r));
  });
  await seedH(false);
  await step('H3', 'cafe vs Café', async () => {
    const r = await probe('H3', 'wallet', 'cafe');
    info('H3x', 'typed "cafe" with a place "Café": ' + JSON.stringify(r));
    const r2 = await probe('H3b', 'scissors', 'café');
    check('H3b', '"café" links Café', r2.loc === 'Café' && r2.newPlaces === 0, JSON.stringify(r2));
  });
  await seedH(true);
  await step('H4', 'with an item named चाबी: typing a Hindi place, and a symbol', async () => {
    const r = await probe('H4', 'wallet', 'अलमारी');
    check('H4', 'an item named चाबी never blocks the place अलमारी', r.loc === 'अलमारी', JSON.stringify(r));
    const r2 = await probe('H4b', 'wallet', '#2');
    info('H4b', JSON.stringify(r2));
    const f = await H.find('चाबी'); info('H4f', JSON.stringify(f));
    check('H4f', 'Find "चाबी" finds the चाबी', f.some((t) => /चाबी/.test(t)), JSON.stringify(f));
    const f2 = await H.find('अलमारी'); info('H4g', JSON.stringify(f2));
  });
  await H.finish('n7');
})().catch((e) => { console.error(e); process.exit(1); });
