// indep2 / n4: the textarea where field — Enter, paste with newlines, spaces, long names, prepositions, non-English names (ruling 2)
const { boot } = require('./x.js');
(async () => {
  const H = await boot({ w: 375, h: 667 });
  const { page, W, check, info, step, S } = H;
  const seedAll = async () => {
    await H.seed({ prefs: { size: 'largest' } });
    await H.seedMore([
      H.place('pSink', 'Under the sink', ['closet.jpg']), H.item('sponge', 'sponge', 'Under the sink', 'real_spoon.jpg', 5e6), H.edge('eSp', 'sponge', { t: 'place', name: 'Under the sink' }),
      H.place('pRasoi', 'रसोई', ['soda.jpg']), H.place('pAlmari', 'अलमारी', ['book.jpg']),
      H.item('chabi', 'चाबी', 'रसोई', 'keys.jpg', 6e6), H.edge('eCh2', 'chabi', { t: 'place', name: 'रसोई' }),
    ]); await W(400);
  };
  const typeIns = async (s) => { await page.locator('.ow-input').click(); await W(150); await page.keyboard.press('Control+A'); await page.keyboard.press('Delete'); await page.keyboard.insertText(s); await W(350); };
  const field = () => page.locator('.ow-input').evaluate((el) => ({ v: el.value, sh: el.scrollHeight, ch: el.clientHeight, h: el.getBoundingClientRect().height }));
  await seedAll();

  await step('E1', 'Enter in the field', async () => {
    await H.openMove('wallet'); await page.locator('.ow-input').click(); await W(150); await page.keyboard.type('Gar'); await page.keyboard.press('Enter'); await W(300);
    const f = await field(); const focused = await page.evaluate(() => document.activeElement && document.activeElement.className);
    info('E1', JSON.stringify({ f, focused, head: await H.head() }));
    check('E1', 'Enter: no newline in the field, field left (Done)', !/\n/.test(f.v) && !/ow-input/.test(focused || ''), JSON.stringify(f));
    await H.leave();
  });
  await step('E2', 'paste with newlines', async () => {
    for (const [id, s, want] of [['E2a', 'Top\nshelf', 'Top shelf'], ['E2b', 'Garage\n', 'Garage'], ['E2c', '\n\nin the\nDesk\ndrawer\n', 'Desk drawer']]) {
      await seedAll();
      await H.openMove('wallet'); await typeIns(s); const typing = await field(); const head = await H.head(); await H.done();
      const rest = await field(); const off = await H.saveOff();
      if (!off) await H.save(); else await H.leave();
      const w = await H.byId('wal'); const e = await H.edgeOf('wal'); const pls = (await H.places()).map((p) => p.name);
      info(id, JSON.stringify({ s, typing: typing.v, head, rest: rest.v, off, loc: w.location, edge: e && e.to, newPlaces: pls.filter((n) => /\n/.test(n) || /^top/i.test(n)) }));
      check(id, `pasted ${JSON.stringify(s)} → ${want}, no newline stored anywhere`, w.location === want && e && e.to.name === want && !pls.some((n) => /\n/.test(n)), JSON.stringify({ loc: w.location }));
    }
  });
  await seedAll();
  await step('E3', 'only spaces / only punctuation', async () => {
    for (const [id, s] of [['E3a', '      '], ['E3b', ' \n \n '], ['E3c', '...'], ['E3d', ' - ']]) {
      await H.openMove('wallet'); await typeIns(s); const head = await H.head(); await H.done(); const off = await H.saveOff(); const r = { s, head, headRest: await H.head(), v: (await field()).v, off };
      info(id, JSON.stringify(r)); if (!off) { await H.save(); const pl = await H.places(); info(id + 's', JSON.stringify({ loc: (await H.byId('wal')).location, odd: pl.filter((p) => !/[a-z]/i.test(p.name)).map((p) => p.name) })); check(id, `${JSON.stringify(s)} never becomes a place`, false, JSON.stringify(r)); await seedAll(); }
      else { check(id, `${JSON.stringify(s)} never becomes a place; Save off`, true); await H.leave(); }
    }
  });
  await seedAll();
  await step('E4', 'a long name shows whole (Largest, 375 wide), typing and at rest', async () => {
    const long = 'The second shelf from the top in the hall cupboard behind the winter coats and hats';
    await H.openMove('wallet'); await typeIns(long); const typing = await field(); await H.done(); const rest = await field();
    await H.snap('e4-long.png');
    info('E4', JSON.stringify({ len: long.length, typing, rest }));
    check('E4a', 'typing: the whole name visible (no inner scroll)', typing.sh <= typing.ch + 2, JSON.stringify(typing));
    check('E4b', 'at rest: the whole name visible (no inner scroll)', rest.sh <= rest.ch + 2, JSON.stringify(rest));
    check('E4c', 'nothing she typed silently dropped (or she is told)', rest.v.length >= long.replace(/^the\s+/i, '').length - 1 || /80|too long/i.test(await H.txt('.lc-card')), JSON.stringify({ kept: rest.v.length, typed: long.length, v: rest.v }));
    await H.leave();
  });
  await seedAll();
  await step('E5', 'her place "Under the sink"', async () => {
    await H.openMove('sponge'); const rest0 = { v: await H.val(), head: await H.head() };
    await page.locator('.ow-input').click(); await W(150); await page.keyboard.press('End'); await page.keyboard.press('Backspace'); await page.keyboard.type('k'); await W(300);
    const r1 = { head: await H.head(), off: await H.saveOff() }; await H.done();
    info('E5a', JSON.stringify({ rest0, r1, after: { v: await H.val(), head: await H.head(), off: await H.saveOff() } }));
    check('E5a', 'retyping "Under the sink" (the place it is in) is not a NEW place', !/NEW/.test(r1.head) && (await H.saveOff()), JSON.stringify(r1));
    await H.leave();
    const n0 = (await H.places()).length;
    await H.openMove('wallet'); await H.typeWhere('under the sink'); const head = await H.head(); const hint = await H.txt('.ow-hint'); await H.done();
    const v = await H.val(); await H.save(); const w = await H.byId('wal'); const n1 = (await H.places()).length;
    info('E5b', JSON.stringify({ head, hint, v, loc: w.location, newPlaces: n1 - n0 }));
    check('E5b', 'typing her place "under the sink" links "Under the sink" (no new place)', w.location === 'Under the sink' && n1 === n0, JSON.stringify({ head, loc: w.location, newPlaces: n1 - n0 }));
  });
  await seedAll();
  await step('E6', 'a new place "behind the couch"', async () => {
    await H.openMove('wallet'); await H.typeWhere('behind the couch'); const head = await H.head(); await H.done(); const v = await H.val(); await H.save();
    const w = await H.byId('wal'); info('E6', JSON.stringify({ head, v, loc: w.location }));
    check('E6', 'ruling 2 strips only in/on/the/my: "behind the couch" is saved as "Behind the couch", not "Couch"', /behind/i.test(w.location), JSON.stringify({ v, loc: w.location }));
  });
  await seedAll();
  await step('E7', 'non-English names (Hindi)', async () => {
    await H.openMove('wallet'); await H.typeWhere('अलमारी'); const head = await H.head(); const hint = await H.txt('.ow-hint'); await H.done(); const v = await H.val(); const off = await H.saveOff();
    if (!off) await H.save(); else await H.leave();
    const w = await H.byId('wal'); info('E7a', JSON.stringify({ head, hint, v, off, loc: w.location }));
    check('E7a', 'typing her place "अलमारी" links अलमारी (not रसोई, not refused)', w.location === 'अलमारी', JSON.stringify({ head, hint, v, loc: w.location }));
    await H.openMove('चाबी'); await H.typeWhere('अलमारी'); const head2 = await H.head(); const hint2 = await H.txt('.ow-hint'); await H.done(); const off2 = await H.saveOff();
    info('E7b', JSON.stringify({ head2, hint2, v: await H.val(), off2 }));
    check('E7b', 'Move "चाबी" (keys) to अलमारी: not refused as "itself"', !/itself|one of your items/.test(hint2) && !off2, JSON.stringify({ head2, hint2 }));
    if (!off2) { await H.save(); info('E7c', JSON.stringify({ loc: (await H.byId('chabi')).location })); } else await H.leave();
    await H.openMove('wallet'); await H.typeWhere('बैठक'); const head3 = await H.head(); const hint3 = await H.txt('.ow-hint'); await H.done(); const off3 = await H.saveOff(); const v3 = await H.val();
    info('E7d', JSON.stringify({ head3, hint3, v3, off3 }));
    check('E7d', 'a NEW Hindi place "बैठक" is a new place (not linked to another, not refused)', /NEW/.test(head3) && !off3 && v3 === 'बैठक', JSON.stringify({ head3, hint3, v3 }));
    await H.leave();
  });
  await H.finish('n4');
})().catch((e) => { console.error(e); process.exit(1); });
