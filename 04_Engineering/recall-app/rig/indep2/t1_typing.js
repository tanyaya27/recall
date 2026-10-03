// ow1 / t1: odd typing in the one where field (rulings 1, 2, 9). node indep/t1_typing.js  (PORT env)
const { start } = require('./lib.js');
(async () => {
  const H = await start({ port: Number(process.env.PORT || 8472) });
  const { page, W, check, info, step } = H;
  await H.seed();
  const probe = async (id, nm, typed, { saveIt = false } = {}) => {
    await H.openMove(nm);
    await page.locator('.ow-input').click(); await W(150); await page.locator('.ow-input').fill(typed); await W(350);
    const headTyping = await H.head(); const hint = await H.txt('.ow-hint'); const sheets = await page.locator('.sheet, .in-list').count();
    const offTyping = await H.saveOff();
    await H.done();
    const r = { typed, headTyping, hint, sheetsWhileTyping: sheets, saveOffTyping: offTyping, fieldAfter: await H.val(), headAfter: await H.head(), hintAfter: await H.txt('.ow-hint'), saveOffAfter: await H.saveOff(), strip: (await H.txt('.ow-to')).replace(/\n/g, ' ') };
    info(id, JSON.stringify(r));
    if (saveIt && !r.saveOffAfter) { const n0 = (await H.places()).length; await H.save(); const it = await H.byName(nm); r.saved = { loc: it.location, edge: (await H.edgeOf(it.id) || {}).to, newPlaces: (await H.places()).length - n0 }; info(id + 's', JSON.stringify(r.saved)); r.page = await H.where(); info(id + 'p', r.page); }
    else await H.leave();
    return r;
  };
  await step('T1', '"the" alone', async () => {
    const r = await probe('T1', 'wallet', 'the', { saveIt: true });
    check('T1', 'typing just "the" never makes a place called "The" (ruling 2: the place is the name, not the sentence)', !(await H.placeBy('The')), JSON.stringify(r.saved || r.fieldAfter));
  });
  await H.seed();
  await step('T2', '"on the"', async () => {
    const r = await probe('T2', 'wallet', 'on the', { saveIt: true });
    check('T2', '"on the" never makes a place called "The"', !(await H.placeBy('The')), JSON.stringify(r.saved || r.fieldAfter));
  });
  await H.seed();
  await step('T2b', '"in" alone / "on my"', async () => {
    const r = await probe('T2b', 'wallet', 'on my', { saveIt: false });
    check('T2b', '"on my" is not a place named "My"', !/^My$/i.test(r.fieldAfter), JSON.stringify(r));
    const r2 = await probe('T2c', 'wallet', 'in', { saveIt: false });
    check('T2c', '"in" is not a place named "In"', !/^In$/i.test(r2.fieldAfter), JSON.stringify(r2));
  });
  await step('T3', 'case + trailing punctuation link exactly', async () => {
    const r = await probe('T3', 'wallet', 'DESK DRAWER!!', { saveIt: true });
    check('T3', '"DESK DRAWER!!" → Set place. links the Desk drawer, nothing new', /Set place\./.test(r.headTyping) && r.saved && r.saved.edge.name === 'Desk drawer' && r.saved.newPlaces === 0, JSON.stringify(r));
  });
  await step('T4', 'on my + existing', async () => {
    const r = await probe('T4', 'wallet', 'on my Garage.', { saveIt: true });
    check('T4', '"on my Garage." → the Garage', r.saved && r.saved.edge.name === 'Garage' && r.saved.newPlaces === 0, JSON.stringify(r.saved));
  });
  await step('T5', 'an item that is not a box', async () => {
    const r = await probe('T5', 'wallet', 'the keys');
    check('T5a', 'typing an item that is not a box: the reason shows while typing', /one of your items/i.test(r.hint), r.hint);
    check('T5b', 'Save is off', r.saveOffAfter);
    check('T5c', 'after Done, at rest, a reason is still visible somewhere (else Save is off with no why)', !!r.hintAfter, JSON.stringify({ hintAfter: r.hintAfter, head: r.headAfter, field: r.fieldAfter }));
  });
  await step('T6', 'its own name', async () => {
    const r = await probe('T6', 'wallet', 'my wallet');
    check('T6', 'its own name: "can’t go in itself", Save off', /itself/.test(r.hint) && r.saveOffAfter, JSON.stringify(r));
  });
  await step('T7', 'a box inside it', async () => {
    const r = await probe('T7', 'blue tin', 'in the small box');
    check('T7', 'Move the blue tin into the small box (inside it): reason, Save off', /inside/i.test(r.hint) && r.saveOffAfter, JSON.stringify(r));
  });
  await step('T8', 'an item inside a box inside it', async () => {
    const r = await probe('T8', 'blue tin', 'gold ring');
    check('T8', 'the gold ring (not a box): reason, Save off', !!r.hint && r.saveOffAfter, JSON.stringify(r));
  });
  await step('T9', 'password', async () => {
    for (const [i, s] of [['a', 'password is tulip88'], ['b', 'PIN 4821'], ['c', 'combination 12-34-56'], ['d', 'safe code 1234'], ['e', 'pw: Hunter2']]) {
      const r = await probe('T9' + i, 'wallet', s);
      check('T9' + i, `"${s}": never a place, Save off, a reason while typing`, r.saveOffAfter && r.saveOffTyping && /private/i.test(r.hint + ' ' + (await H.txt('.lc-card'))), JSON.stringify(r));
    }
  });
  await step('T10', 'a place and a box with the same name', async () => {
    const r = await probe('T10', 'wallet', 'sewing basket', { saveIt: true });
    info('T10x', 'places doc "Sewing basket" still exists: ' + !!(await H.placeBy('Sewing basket')));
  });
  await step('T11', 'hint', async () => {
    const r = await probe('T11', 'wallet', 'box by the door');
    info('T11', 'hint for "box by the door": ' + r.hint);
    check('T11', 'nothing opens while typing', r.sheetsWhileTyping === 0);
  });
  await step('T12', 'current place retyped', async () => {
    const r = await probe('T12', 'reading glasses', 'in the desk drawer.');
    info('T12', JSON.stringify(r));
  });
  await step('T13', 'spaces', async () => {
    const r = await probe('T13', 'wallet', '   lab    desk   ', { saveIt: true });
    check('T13', '"   lab    desk   " → "Lab desk"', r.saved && r.saved.edge.name === 'Lab desk', JSON.stringify(r.saved));
  });
  await step('T14', 'a name that is a place with an article', async () => {
    const r = await probe('T14', 'wallet', 'the office', { saveIt: true });
    check('T14', '"the office" → Office', r.saved && r.saved.edge.name === 'Office' && r.saved.newPlaces === 0, JSON.stringify(r.saved));
  });
  await step('T15', 'box name different case', async () => {
    const r = await probe('T15', 'wallet', 'SHOEBOX', { saveIt: true });
    check('T15', '"SHOEBOX" → the shoebox (box)', r.saved && r.saved.edge.t === 'thing' && r.saved.edge.id === 'shoe', JSON.stringify(r.saved));
    const f = await H.find('wallet'); info('T15f', JSON.stringify(f));
  });
  await H.finish('t1');
})().catch((e) => { console.error(e); process.exit(1); });
