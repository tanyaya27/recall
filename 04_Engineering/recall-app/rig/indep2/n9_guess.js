// indep2 / n9: an unusable guess with an empty field (ruling 6 "then nothing"), a password-like guess (ruling 9)
const { boot } = require('./x.js');
(async () => {
  const H = await boot();
  const { page, W, check, info, step, S } = H;
  await H.seed();
  const blankGuess = async (id, guessName) => {
    S.GUESS = { name: guessName, merged: guessName }; S.guessCalls = [];
    await H.logNew('mitten', 'soda.jpg');
    const seg = page.locator('.ow-to .ow-to-where'); if (await seg.count()) { await seg.click(); await W(300); }
    await H.shoot('closet.jpg'); await W(2700);
    const r = { calls: S.guessCalls.length, v: await H.val(), box: (await H.txt('.ow-ai')).replace(/\n/g, ' / '), head: await H.head(), off: await H.saveOff() };
    if (await H.has('.ow-ai-use')) { await H.tap('.ow-ai-use', 400); r.afterUse = { v: await H.val(), head: await H.head(), hint: await H.txt('.ow-hint'), off: await H.saveOff() }; }
    info(id, JSON.stringify(r)); await H.leave(); return r;
  };
  await step('V1', 'empty field, guess = one of her items (Keys)', async () => {
    const r = await blankGuess('V1', 'Keys');
    check('V1', 'ruling 6: an unusable guess with an empty field → nothing (no box offering "Use this")', !/Keys/.test(r.box), JSON.stringify(r));
  });
  await step('V2', 'empty field, guess looks like a password', async () => {
    const r = await blankGuess('V2', 'Safe code 4821');
    check('V2', 'a password-like guess is never shown or offered', !/4821/.test(r.box + r.v), JSON.stringify(r));
  });
  await step('V3', 'empty field, guess = the item itself (Mitten)', async () => {
    const r = await blankGuess('V3', 'Mitten');
    info('V3x', JSON.stringify(r));
  });
  await H.finish('n9');
})().catch((e) => { console.error(e); process.exit(1); });
