// indep2 / n1: notes vs where-words on every path (ruling 4, 7, 8)
const { boot } = require('./x.js');
(async () => {
  const H = await boot();
  const { page, W, check, info, step, S } = H;
  await H.seed();

  await step('A1', 'words-only keys: note, then a place, then Undo', async () => {
    await H.openMove('keys'); await H.addNote('zipped pocket'); await H.save();
    const k1 = await H.byId('ky'); info('A1a', JSON.stringify(H.short(k1)) + ' page=' + (await H.where()) + ' note=' + (await H.note()));
    await W(5500); // a later, separate save
    await H.openMove('keys'); await H.typeWhere('garage'); await H.done(); await H.save();
    const k2 = await H.byId('ky'); info('A1b', JSON.stringify(H.short(k2)) + ' page=' + (await H.where()) + ' note=' + (await H.note()));
    const t = await H.undoPage(); await W(500);
    const k3 = await H.byId('ky'); const w3 = await H.where(); const n3 = await H.note();
    info('A1c', JSON.stringify({ toast: t, ...H.short(k3), edge: await H.edgeOf('ky'), w3, n3 }));
    check('A1', 'Undo of the place: keys back to "in my coat pocket" as the where (store + page), note "zipped pocket" back as a note, not "Not put away"', /coat pocket/.test(w3) && /zipped/.test(n3) && !k3.location && k3.needsPlace === false, JSON.stringify({ w3, n3, needsPlace: k3.needsPlace }));
    const f = await H.find('keys'); info('A1f', JSON.stringify(f));
    check('A1f', 'Find answers the keys with the coat pocket after Undo', /coat pocket/i.test(f[0] || ''), JSON.stringify(f));
  });

  await H.seed();
  await step('A2', 'Log: note only → Not put away; Put it somewhere; Undo', async () => {
    await H.logNew('umbrella', 'diary.jpg'); await H.addNote('by the front door'); await H.save(); await W(600);
    const u = await H.byName('umbrella'); info('A2s', JSON.stringify(H.short(u)));
    check('A2a', 'note-only new item: needsPlace true, note n:1, no location', u && u.needsPlace === true && !u.location && H.wsOf(u).every((x) => x.n === 1), JSON.stringify(H.short(u)));
    await H.home(); const home = (await H.txt('.screen')).replace(/\n/g, ' | '); info('A2h', home.slice(0, 600));
    await H.openThing('umbrella'); const pg = await H.pageAll(); info('A2p', pg); const n = await H.note(); const w = await H.where();
    check('A2b', 'item page: note under the photo, not shown as where; Put it somewhere offered', /front door/.test(n) && !/front door/.test(w) && /Put it somewhere/i.test(pg), JSON.stringify({ n, w }));
    const f = await H.find('umbrella'); info('A2f', JSON.stringify(f));
    check('A2f', 'Find: not answered with the note as the where', !/front door/i.test((f[0] || '').split('|').slice(0, 3).join('|')) || /not put away/i.test(f[0] || ''), JSON.stringify(f));
  });

  await H.seed();
  await step('A3', 'Save + Next: note on the first item never rides to the next', async () => {
    await H.logNew('cup', 'soda.jpg'); await H.typeWhere('kitchen'); await H.done(); await H.addNote('on the counter'); await H.holdSave(750);
    const card = (await H.txt('.lc-card')).replace(/\n/g, ' / '); info('A3a', 'next item card: ' + card + ' noteField=' + (await H.has('.ow-note-in')));
    S.AI = { name: 'plate' }; await H.shoot('real_spoon.jpg'); await W(600); await H.save(); await W(600);
    const cup = await H.byName('cup'); const pl = await H.byName('plate');
    info('A3', JSON.stringify({ cup: H.short(cup), plate: H.short(pl), plateEdge: pl && (await H.edgeOf(pl.id)) }));
    check('A3', 'cup: Kitchen + note n:1; plate: Kitchen, no words at all', cup && cup.location === 'Kitchen' && H.wsOf(cup).some((x) => x.n === 1 && /counter/.test(x.said)) && pl && pl.location === 'Kitchen' && H.wsOf(pl).length === 0, '');
  });

  await H.seed();
  await step('A4', '"Your wallet?" Yes + a note; Home card Undo', async () => {
    const w0 = await H.byId('wal'); const sn0 = (await H.snapsOf('wal')).length;
    await H.logNew('wallet', 'wallet.jpg'); await W(800);
    const ask = await H.has('.lc-ask'); info('A4a', 'ask shown: ' + ask + ' card=' + (await H.txt('.lc-card')).replace(/\n/g, ' / '));
    if (ask) await H.tap('.lc-ask button:has-text("Yes")', 500);
    const head = await H.head(); const v = await H.val().catch(() => '');
    await H.addNote('inside the coat'); await H.save(); await W(600);
    const w1 = await H.byId('wal'); info('A4b', JSON.stringify({ head, v, ...H.short(w1), edge: (await H.edgeOf('wal')).to }));
    check('A4b', 'Yes merge: wallet stays in the Office, the note is a note (n:1)', w1.location === 'Office' && H.wsOf(w1).slice(-1)[0] && H.wsOf(w1).slice(-1)[0].n === 1, JSON.stringify(H.short(w1)));
    const homeCard = (await H.txt('.saved-card, .card-saved, .sc')).replace(/\n/g, ' / '); info('A4c', 'home after save: ' + (await H.txt('.screen')).replace(/\n/g, ' / ').slice(0, 500));
    const ub = page.locator('button:has-text("Undo")').first();
    if (await ub.count()) { await ub.click(); await W(1500); }
    const w2 = await H.byId('wal'); const sn2 = (await H.snapsOf('wal')).length;
    info('A4d', JSON.stringify({ toast: await H.toastTxt(), ...H.short(w2), cover: w2.photo === w0.photo, snaps: [sn0, sn2] }));
    check('A4', 'Undo: no note on the wallet (latest words empty), cover/photoCount back, Office', w2.location === 'Office' && w2.photo === w0.photo && w2.photoCount === w0.photoCount && !((H.wsOf(w2).slice(-1)[0] || {}).said), JSON.stringify(H.short(w2)));
    await H.openThing('wallet'); info('A4p', await H.pageAll());
  });

  await H.seed();
  await step('A5', '"Your keys?" Yes on the words-only keys + note', async () => {
    await H.logNew('keys', 'keys.jpg'); await W(800);
    if (await H.has('.lc-ask')) await H.tap('.lc-ask button:has-text("Yes")', 500);
    const r = { head: await H.head(), ph: await page.locator('.ow-input').getAttribute('placeholder'), v: await H.val() };
    await H.addNote('blue lanyard'); await H.save(); await W(600);
    const k = await H.byId('ky'); await H.openThing('keys'); const w = await H.where(); const n = await H.note();
    info('A5', JSON.stringify({ r, ...H.short(k), w, n }));
    check('A5', 'Yes on words-only keys + note: where still "in my coat pocket", note "blue lanyard"', /coat pocket/.test(w) && /lanyard/.test(n) && k.needsPlace === false, JSON.stringify({ w, n, np: k.needsPlace }));
    check('A5h', 'Yes on the words-only keys: the field/header shows where they are now (ruling 2/4 — like Move)', /coat pocket/i.test(r.head + r.ph + r.v), JSON.stringify(r));
  });

  await H.seed();
  await step('A6', 'Move with only a photo (same where): the old note stays', async () => {
    await H.openThing('reading glasses'); const n0 = await H.note();
    await H.tap('.thing-page button:has-text("Move it")', 900); const strip = await H.strip(); await H.shoot('glasses.jpg'); await H.save();
    const n1 = await H.note(); const g = await H.byId('gl');
    info('A6', JSON.stringify({ n0, strip, n1, ...H.short(g) }));
    check('A6', 'same where + a photo: note "behind the stapler" still shown', /stapler/.test(n1), JSON.stringify({ n0, n1 }));
  });
  await step('A7', 'Move: change only the level of the box it is in; note stays?', async () => {
    // ring is in the small box (in the blue tin). Move ring: → Change level of small box → Garage
    await H.seedMore([{ ...(await H.byId('ring')), history: [...(await H.byId('ring')).history, { location: 'Small box', at: Date.now() - 3600e3, w: 1, n: 1, said: 'wrapped in tissue', by: 'margaret' }] }]);
    await H.openThing('gold ring'); const n0 = await H.note();
    await H.tap('.thing-page button:has-text("Move it")', 900); await H.tap('.ow-go', 600);
    const lv = (await page.locator('.ow-lvl').allInnerTexts()).map((t) => t.replace(/\n/g, ' '));
    info('A7a', JSON.stringify({ n0, lv }));
    await page.locator('.ow-lvl .ow-lvl-change').nth(1).click(); await W(500);
    await page.fill('.in-list .wl-search input', 'hall closet'); await W(400);
    const rows = await page.locator('.in-list .wl-row').allInnerTexts(); info('A7r', JSON.stringify(rows));
    await page.locator('.in-list .wl-row').first().click(); await W(400); await H.tap('.ow-done', 500);
    const head = await H.head(); await H.save();
    const n1 = await H.note(); const sm = await H.byId('small');
    info('A7', JSON.stringify({ head, n1, small: (await H.edgeOf('small')).to }));
    check('A7', 'level-only change: the ring’s note stays (its own where did not change)', /tissue/.test(n1), JSON.stringify({ n0, n1 }));
  });

  await H.seed();
  await step('A8', 'Write it down: typed "Somewhere else" words', async () => {
    await H.home(); await H.tap(H.LOG, 900); await H.tap('.lc-typeit button', 800);
    await page.fill('#note-what', 'umbrella'); await H.tap('.guess.other', 300); await page.locator('.note-card .place-input').nth(1).fill('under the stairs'); await W(200);
    await H.tap('.note-card .btn-primary', 1200);
    const u = await H.byName('umbrella'); await H.openThing('umbrella'); const w = await H.where(); const n = await H.note();
    info('A8', JSON.stringify({ ...H.short(u), w, n }));
    check('A8', 'ruling 4 ("words are a NOTE … never a where"; only an OLD item keeps words as its where): a NEW written item’s words are not its where', !(u.needsPlace === false && !u.location), JSON.stringify({ ...H.short(u), w, n }));
    await H.home(); await H.tap(H.LOG, 900); await H.tap('.lc-typeit button', 800);
    await page.fill('#note-what', 'hammer'); await H.tap('.guess.other', 300); await page.locator('.note-card .place-input').nth(1).fill('the garage'); await W(200);
    await H.tap('.note-card .btn-primary', 1200);
    const h = await H.byName('hammer'); info('A8b', JSON.stringify({ ...H.short(h), edge: h && (await H.edgeOf(h.id)) }));
    check('A8b', 'Write it down "the garage" links the Garage (ruling 2: "the" stripped)', h && h.location === 'Garage', JSON.stringify(H.short(h)));
  });
  await H.finish('n1');
})().catch((e) => { console.error(e); process.exit(1); });
