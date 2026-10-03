// ow1 / t3: the → sheet, levels, loops, place-in-box (ruling 3), item page + Find (rulings 1, 8)
const { start } = require('./lib.js');
(async () => {
  const H = await start({ port: Number(process.env.PORT || 8474) });
  const { page, W, check, info, step } = H;
  await H.seed();
  const lvls = async () => (await page.locator('.ow-lvl').allInnerTexts()).map((t) => t.replace(/\n/g, ' / '));
  const picks = async () => (await page.locator('.ow-sheet .ow-pick').allInnerTexts()).map((t) => t.replace(/\n/g, ' / '));
  const inRows = async () => (await page.locator('.in-list .wl-row, .in-list .wl-new').allInnerTexts()).map((t) => t.replace(/\n/g, ' / '));

  await step('A1', '→ sheet for the blue tin (a box with a box inside)', async () => {
    await H.openMove('blue tin'); await H.tap('.ow-go', 500);
    const L = await lvls(); const P = await picks();
    info('A1', JSON.stringify({ L, P, plus: await H.txt('.ow-up'), title: await H.txt('.ow-sheet .sheet-title') }));
    check('A1a', 'pick list never offers the tin itself or the small box inside it', !P.some((p) => /^Blue tin/i.test(p)) && !P.some((p) => /^Small box/i.test(p)), JSON.stringify(P));
    check('A1b', 'the name once, then every level: Desk drawer → Office', L.length === 2 && /^Desk drawer/.test(L[0]) && /^Office/.test(L[1]), JSON.stringify(L));
    check('A1c', 'the place "Sewing basket" (same name as a box) is offered somewhere', P.filter((p) => /Sewing basket/i.test(p)).length >= 1, JSON.stringify(P.filter((p) => /sewing/i.test(p))));
    info('A1d', 'Sewing basket rows: ' + JSON.stringify(P.filter((p) => /sewing/i.test(p))));
    // change level 2 (Office) — what does the list offer? (Desk drawer is in Office; tin is in Desk drawer)
    await page.locator('.ow-lvl .ow-lvl-change').nth(1).click(); await W(400);
    const R = await inRows(); info('A1e', 'Change level 2 (where the Desk drawer is) offers: ' + JSON.stringify(R));
    check('A1e', 'level 2 (a place) is offered only places — no boxes, not the Desk drawer itself', !R.some((r) => /a box/.test(r)) && !R.some((r) => /^Desk drawer/.test(r)), JSON.stringify(R));
    await page.keyboard.press('Escape'); await H.tap('.in-list .btn-quiet:has-text("Cancel")', 300).catch(() => {});
    await H.tap('.ow-cancel', 300).catch(() => {});
    await H.leave();
  });
  await step('A2', 'the gold ring: 4 levels', async () => {
    await H.openMove('gold ring'); await H.tap('.ow-go', 500);
    const L = await lvls(); const ups = await page.locator('.ow-up').count(); const ins = await page.locator('.ow-in').count();
    info('A2', JSON.stringify({ L, ups, plus: await H.txt('.ow-up'), ins }));
    check('A2', 'name once + every level: Small box → Blue tin → Desk drawer → Office', L.length === 4 && /^Small box/.test(L[0]) && /^Blue tin/.test(L[1]) && /^Desk drawer/.test(L[2]) && /^Office/.test(L[3]), JSON.stringify(L));
    await H.snap('a2-ring-sheet.png');
    // change level 2 (Blue tin) → Shoebox
    await page.locator('.ow-lvl .ow-lvl-change').nth(1).click(); await W(400);
    const R = await inRows(); info('A2b', 'Change level 2 offers: ' + JSON.stringify(R));
    check('A2b', 'level 2 list never offers the small box itself, nor the ring', !R.some((r) => /^Small box/.test(r)) && !R.some((r) => /^Gold ring/i.test(r)), JSON.stringify(R));
    await page.fill('.in-list .wl-search input', 'shoebox'); await W(300); await H.tap('.in-list .wl-row', 400);
    const L2 = await lvls(); info('A2c', 'after change: ' + JSON.stringify(L2));
    check('A2c', 'after changing level 2: Small box → Shoebox → Hall closet', L2.length === 3 && /^Shoebox/.test(L2[1]) && /^Hall closet/.test(L2[2]), JSON.stringify(L2));
    await H.tap('.ow-done', 400);
    const head = await H.head(); info('A2d', 'header after a level change: ' + head + ' / field: ' + (await H.val()));
    await H.save();
    const e = await H.edgeOf('small'); const er = await H.edgeOf('ring');
    check('A2s', 'store: small box → shoebox; ring still in small box', e && e.to.id === 'shoe' && er && er.to.id === 'small', JSON.stringify({ small: e && e.to, ring: er && er.to }));
    const w = await H.where(); info('A2p', w);
    check('A2p', 'item page: Small box, in the Shoebox, in the Hall closet', /Small box/.test(w) && /in the Shoebox/i.test(w) && /in the Hall closet/i.test(w), w);
    const tin = await H.byId('tin'); info('A2t', 'tin contents after: ' + JSON.stringify((await H.dump()).filter((d) => d.kind === 'edge' && !d.until && d.to && d.to.id === 'tin').map((d) => d.from)));
    // undo
    await H.tap('.tp-moved .u', 1200);
    const e2 = await H.edgeOf('small'); const ring = await H.byId('ring');
    check('A2u', 'Undo: small box back in the blue tin', e2 && e2.to.id === 'tin', JSON.stringify(e2 && e2.to));
    info('A2u2', 'ring lastSeenAt restored? ' + JSON.stringify({ last: ring.lastSeenAt, hist: ring.history.slice(-3) }));
    const sm = await H.byId('small'); info('A2u3', 'small box after undo: ' + JSON.stringify({ loc: sm.location, last: sm.lastSeenAt, hist: sm.history.slice(-3).map((h) => [h.location, h.undo]) }));
  });
  await step('A3', 'place loop: Office in Desk drawer', async () => {
    await H.openMove('brochure'); await H.tap('.ow-go', 500);
    await H.tap('.ow-up', 500); const R = await inRows();
    info('A3', 'What is the Office in? offers: ' + JSON.stringify(R));
    check('A3', 'the Desk drawer (inside the Office) is never offered as what the Office is in', !R.some((r) => /^Desk drawer/.test(r)), JSON.stringify(R));
    await page.fill('.in-list .wl-search input', 'desk drawer'); await W(300);
    const R2 = await inRows(); const msg = await H.txt('.in-list .in-blocked');
    check('A3b', 'searching "desk drawer" there: not offered (and nothing new named Desk drawer)', !R2.some((r) => /Desk drawer/i.test(r)), JSON.stringify({ R2, msg }));
    await page.keyboard.press('Escape'); await H.tap('.in-list .btn-quiet:has-text("Cancel")', 300).catch(() => {});
    await H.tap('.ow-cancel', 300).catch(() => {}); await H.leave();
  });
  await step('A4', 'place inside a box: never', async () => {
    await H.openMove('brochure'); await H.typeWhere('top shelf'); await H.done(); await H.tap('.ow-go', 500);
    await H.tap('.ow-up', 500); await page.fill('.in-list .wl-search input', 'shoebox'); await W(300);
    const R = await inRows(); info('A4', JSON.stringify({ R, msg: await H.txt('.in-list .in-blocked') }));
    check('A4', 'a NEW place is never put in a box (shoebox not offered, nor "New place: Shoebox")', !R.some((r) => /shoebox/i.test(r)), JSON.stringify(R));
    await page.keyboard.press('Escape'); await H.tap('.in-list .btn-quiet:has-text("Cancel")', 300).catch(() => {});
    await H.tap('.ow-cancel', 300).catch(() => {}); await H.leave();
  });
  await step('A5', 'levels on a new place; self-name; depth', async () => {
    await H.openMove('brochure'); await H.typeWhere('top shelf'); await H.done(); await H.tap('.ow-go', 500);
    const addNew = async (nm) => { await H.tap('.ow-up', 500); await page.fill('.in-list .wl-search input', nm); await W(300); const R = await inRows(); if (await H.has('.in-list .wl-new')) await H.tap('.in-list .wl-new', 400); else { info('A5x', `no "new" offered for ${nm}: ` + JSON.stringify(R)); await H.tap('.in-list .btn-quiet:has-text("Cancel")', 300); } };
    // same name as level 1
    await H.tap('.ow-up', 500); await page.fill('.in-list .wl-search input', 'Top Shelf.'); await W(300);
    const Rs = await inRows(); check('A5a', 'what Top shelf is in: "Top Shelf." is not offered (itself)', !Rs.some((r) => /top shelf/i.test(r)), JSON.stringify(Rs));
    await H.tap('.in-list .btn-quiet:has-text("Cancel")', 300);
    await addNew('bookcase'); await addNew('den');
    let L = await lvls(); const plus3 = await page.locator('.ow-up').count();
    await addNew('upstairs');
    L = await lvls(); const plus4 = await page.locator('.ow-up').count();
    if (plus4) await addNew('house');
    const L5 = await lvls(); const plus5 = await page.locator('.ow-up').count();
    info('A5b', JSON.stringify({ L5, plus3, plus4, plus5 }));
    // try a loop through new names: what is House in? → "bookcase"
    if (plus5) { await H.tap('.ow-up', 500); await page.fill('.in-list .wl-search input', 'bookcase'); await W(300); const R = await inRows(); check('A5c', 'a new level named like a lower new level (Bookcase) is not offered', !R.some((r) => /bookcase/i.test(r)), JSON.stringify(R)); await H.tap('.in-list .btn-quiet:has-text("Cancel")', 300); }
    await H.snap('a5-levels.png');
    await H.tap('.ow-done', 400); await H.save();
    const chain = []; let id = 'br'; for (let i = 0; i < 7; i++) { const e = await H.edgeOf(id); if (!e) break; chain.push(e.to.name); if (e.to.t !== 'place') break; const p = await H.placeBy(e.to.name); if (!p) break; id = p.id; }
    info('A5s', 'stored chain: ' + JSON.stringify(chain));
    check('A5s', 'stored: every level she added', chain.length === L5.length && chain.join('>').toLowerCase() === L5.map((l) => l.split(' / ')[0].replace(/NEW$/, '')).join('>').toLowerCase(), JSON.stringify({ chain, L5 }));
    const w = await H.where(); info('A5p', w);
    check('A5p', 'item page shows every level ("in the X" for each outer)', chain.slice(1).every((n) => new RegExp('in the ' + n, 'i').test(w)), w);
    const f = await H.find('brochure'); info('A5f', JSON.stringify(f));
    check('A5f', 'Find answers Top shelf', /Top shelf/.test(f[0] || ''), JSON.stringify(f));
  });
  await step('A6', 'reparent a shared place via a level', async () => {
    await H.openMove('reading glasses'); await H.tap('.ow-go', 500);
    await page.locator('.ow-lvl .ow-lvl-change').nth(1).click(); await W(400);
    await page.fill('.in-list .wl-search input', 'garage'); await W(300); await H.tap('.in-list .wl-row', 400);
    await H.tap('.ow-done', 400); await H.save();
    const pe = await H.edgeOf('pDrawer'); const g = await H.byId('gl');
    check('A6', 'Desk drawer now in the Garage; glasses still in the Desk drawer', pe && pe.to.name === 'Garage' && (await H.edgeOf('gl')).to.name === 'Desk drawer', JSON.stringify(pe && pe.to));
    info('A6n', 'glasses note after a level-only change: ' + JSON.stringify(g.history.slice(-2)) + ' page note: ' + (await H.note()));
    check('A6n', 'a level-only change keeps her note (it is not a new where)', /behind the stapler/.test(await H.note()), await H.note());
    const tw = (await (async () => { await H.openThing('blue tin'); return H.where(); })()); info('A6t', 'tin page: ' + tw);
    check('A6t', 'the tin (in the Desk drawer) now reads in the Garage', /in the Garage/i.test(tw), tw);
  });
  await step('A7', '→ "Not in anything"', async () => {
    await H.openMove('wallet'); await H.tap('.ow-go', 500);
    const has = await H.has('.ow-clear'); info('A7', 'Not in anything button: ' + has);
    if (has) { await H.tap('.ow-clear', 400); info('A7b', JSON.stringify({ head: await H.head(), v: await H.val(), off: await H.saveOff(), strip: await H.txt('.ow-to') })); }
    await H.leave();
  });
  await step('A8', 'pick list for an item in a box: offers the place of its own box?', async () => {
    await H.openMove('gold ring'); await H.tap('.ow-go', 500);
    const P = await picks(); info('A8', JSON.stringify(P));
    check('A8', 'pick list never offers the ring itself', !P.some((p) => /^Gold ring/i.test(p)));
    await H.tap('.ow-cancel', 300); await H.leave();
  });
  await H.finish('t3');
})().catch((e) => { console.error(e); process.exit(1); });
