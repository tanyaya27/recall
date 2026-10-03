// indep2 / n5: → sheet with deep saved chains and the guess box, 375×667 at Largest (rulings 3, 6, 8)
const { boot } = require('./x.js');
(async () => {
  const H = await boot({ w: 375, h: 667 });
  const { page, W, check, info, step, S } = H;
  const vis = (sel) => page.locator(sel).first().evaluate((el) => { const r = el.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const top = document.elementFromPoint(cx, cy); return { t: Math.round(r.top), b: Math.round(r.bottom), l: Math.round(r.left), r: Math.round(r.right), inView: r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth, hit: !!top && (top === el || el.contains(top)) }; }).catch((e) => ({ err: e.message.slice(0, 80) }));
  const seedDeep = async () => {
    await H.seed({ prefs: { size: 'largest' } });
    await H.seedMore([
      H.place('pHouse', 'House', ['closet.jpg']), H.place('pUp', 'Upstairs', ['drawer.jpg']), H.place('pBed', 'Bedroom', ['book.jpg']), H.place('pWard', 'Wardrobe', ['box.jpg']),
      H.edge('eUp', 'pUp', { t: 'place', name: 'House' }), H.edge('eBed', 'pBed', { t: 'place', name: 'Upstairs' }), H.edge('eWard', 'pWard', { t: 'place', name: 'Bedroom' }),
      H.item('hat', 'hatbox', 'Wardrobe', 'box14.jpg', 9e6, { holds: true }), H.edge('eHat', 'hat', { t: 'place', name: 'Wardrobe' }),
      H.item('jc', 'jewel case', 'Hatbox', 'tin.jpg', 8e6, { holds: true }), H.edge('eJc', 'jc', { t: 'thing', id: 'hat', name: 'hatbox' }),
      H.item('bro', 'brooch', 'Jewel case', 'card.jpg', 7e6), H.edge('eBro', 'bro', { t: 'thing', id: 'jc', name: 'jewel case' }),
    ]); await W(500);
  };
  await seedDeep();

  await step('L1', 'item page and Find for a 6-level chain', async () => {
    await H.openThing('brooch'); const w = await H.where(); await H.snap('l1-page.png');
    const ov = await page.evaluate(() => { const b = document.querySelector('.tp-blk[aria-labelledby="tp-where"]'); if (!b) return null; const img = b.querySelector('img'); if (!img) return { img: false };
      const ir = img.getBoundingClientRect(); const bad = [...b.querySelectorAll('b, span, small, p, div')].filter((el) => el.children.length === 0 && el.textContent.trim()).filter((el) => { const r = el.getBoundingClientRect(); return r.width && !(r.right <= ir.left || r.left >= ir.right || r.bottom <= ir.top || r.top >= ir.bottom); }).map((el) => el.textContent.trim());
      return { img: true, overlaps: bad }; });
    info('L1', JSON.stringify({ w, ov })); const f = await H.find('brooch'); info('L1f', JSON.stringify(f));
    check('L1', 'page shows every level (jewel case, hatbox, Wardrobe, Bedroom, Upstairs, House)', ['Jewel case', 'Hatbox', 'Wardrobe', 'Bedroom', 'Upstairs', 'House'].every((x) => new RegExp(x, 'i').test(w)), w);
    check('L1o', 'the first level’s photo never overlaps the text', ov && (!ov.img || ov.overlaps.length === 0), JSON.stringify(ov));
  });
  await step('L2', '→ sheet with 6 levels at 375×667 Largest', async () => {
    await H.openMove('brooch'); await H.tap('.ow-go', 700); await H.snap('l2-sheet.png');
    const lv = (await page.locator('.ow-lvl').allInnerTexts()).map((t) => t.replace(/\n/g, ' '));
    const sc = await page.locator('.ow-scroll').evaluate((el) => ({ sh: el.scrollHeight, ch: el.clientHeight, ov: getComputedStyle(el).overflowY }));
    const r = { cancel: await vis('.ow-cancel'), done: await vis('.ow-done'), up: await H.has('.ow-up'), lv, sc, picks: await page.locator('.ow-pick').count() };
    info('L2', JSON.stringify(r));
    check('L2a', 'Cancel and Done on screen and tappable', r.cancel.inView && r.cancel.hit && r.done.inView && r.done.hit, JSON.stringify([r.cancel, r.done]));
    check('L2b', '6 saved levels shown; no "+ What is … in?" (≥3 levels)', lv.length === 6 && !r.up, JSON.stringify(lv));
    check('L2c', 'the list scrolls', sc.sh > sc.ch && /auto|scroll/.test(sc.ov), JSON.stringify(sc));
    // scroll to the bottom: the last pick and "Take it out" reachable and tappable
    await page.locator('.ow-scroll').evaluate((el) => { el.scrollTop = el.scrollHeight; }); await W(300); await H.snap('l2-sheet-bottom.png');
    const last = await vis('.ow-pick >> nth=-1'); const clr = await vis('.ow-clear'); const ch6 = await page.locator('.ow-lvl .ow-lvl-change').nth(5).evaluate((el) => el.getBoundingClientRect().top).catch(() => null);
    info('L2d', JSON.stringify({ last, clr }));
    check('L2d', 'scrolled: the last pick and "Take it out of the Jewel case" on screen and tappable', last.inView && last.hit && clr.inView && clr.hit, JSON.stringify({ last, clr }));
    const picks = (await page.locator('.ow-pick').allInnerTexts()).map((t) => t.split('\n')[0]);
    info('L2e', JSON.stringify(picks));
    check('L2e', 'the pick list never offers the brooch itself', !picks.some((p) => /brooch/i.test(p)), JSON.stringify(picks));
    await H.tap('.ow-cancel', 300); await H.leave();
  });
  await step('L3', 're-parent level 3 (Wardrobe → Hall closet) from the brooch’s Move', async () => {
    await H.openMove('brooch'); await H.tap('.ow-go', 700);
    await page.locator('.ow-lvl .ow-lvl-change').nth(2).click(); await W(500);
    const title = await H.txt('.in-list .sheet-title, .in-list h2, .in-list [id]');
    const rows = (await page.locator('.in-list .wl-row').allInnerTexts()).map((t) => t.split('\n')[0]);
    info('L3a', JSON.stringify({ title, rows }));
    check('L3a', 'changing the Wardrobe’s level: no box offered (a place is never inside a box), never Wardrobe/its insides', !rows.some((x) => /hatbox|jewel|brooch|blue tin|shoebox|small box/i.test(x)), JSON.stringify(rows));
    await page.fill('.in-list .wl-search input', 'hall closet'); await W(400); await page.locator('.in-list .wl-row').first().click(); await W(400);
    const lv = (await page.locator('.ow-lvl').allInnerTexts()).map((t) => t.replace(/\n/g, ' '));
    await H.tap('.ow-done', 500); const head = await H.head(); const off = await H.saveOff();
    info('L3b', JSON.stringify({ lv, head, off }));
    if (!off) await H.save(); else await H.leave();
    const dump = await H.dump(); const eW = dump.find((d) => d.kind === 'edge' && d.from === 'pWard' && !d.until);
    info('L3', JSON.stringify({ wardIn: eW && eW.to, hat: (await H.edgeOf('hat')).to, jc: (await H.edgeOf('jc')).to, bro: (await H.edgeOf('bro')).to, page: await H.where() }));
    check('L3', 'Wardrobe now in the Hall closet; hatbox, jewel case, brooch unchanged', eW && eW.to.name === 'Hall closet' && (await H.edgeOf('hat')).to.name === 'Wardrobe' && (await H.edgeOf('jc')).to.id === 'hat' && (await H.edgeOf('bro')).to.id === 'jc', '');
    check('L3h', 'header for a level-only change: "Set where the X is."', /Set where/.test(head), head);
  });
  await seedDeep();
  await step('L4', 'Move the hatbox: its pick list never offers what is inside it', async () => {
    await H.openMove('hatbox'); await H.tap('.ow-go', 700);
    const picks = (await page.locator('.ow-pick').allInnerTexts()).map((t) => t.split('\n')[0]);
    info('L4', JSON.stringify(picks));
    check('L4', 'no jewel case / hatbox in the hatbox’s pick list', !picks.some((p) => /jewel|hatbox/i.test(p)), JSON.stringify(picks));
    // Change level 1 (Wardrobe) → can she pick Bedroom's child?  try putting Wardrobe inside "Upstairs" → fine; inside "Wardrobe"? never
    await page.locator('.ow-lvl .ow-lvl-change').nth(1).click(); await W(500);
    const rows = (await page.locator('.in-list .wl-row').allInnerTexts()).map((t) => t.split('\n')[0]);
    info('L4b', JSON.stringify(rows));
    check('L4b', 'what the Wardrobe is in: never Wardrobe itself, never a box', !rows.some((x) => /^wardrobe$|hatbox|jewel|tin|shoebox|small box|sewing basket$/i.test(x.trim())), JSON.stringify(rows));
    await H.leave();
  });
  await step('L5', 'a 2-level chain: + offered; add a 3rd: + gone', async () => {
    await H.openMove('wallet'); await H.typeWhere('top shelf'); await H.done(); await H.tap('.ow-go', 600);
    const up1 = await H.has('.ow-up'); await H.tap('.ow-up', 500); await page.fill('.in-list .wl-search input', 'bookcase'); await W(300); await H.tap('.in-list .wl-new', 400);
    const up2 = await H.has('.ow-up'); const upTxt = await H.txt('.ow-up');
    if (up2) { await H.tap('.ow-up', 500); await page.fill('.in-list .wl-search input', 'study'); await W(300); await H.tap('.in-list .wl-new', 400); }
    const up3 = await H.has('.ow-up'); const lv = (await page.locator('.ow-lvl').allInnerTexts()).map((t) => t.replace(/\n/g, ' '));
    const r = { up1, up2, upTxt, up3, lv, cancel: await vis('.ow-cancel'), done: await vis('.ow-done') };
    info('L5', JSON.stringify(r));
    check('L5', '+ under the last level only while fewer than 3 levels', up1 && up2 && !up3 && lv.length === 3, JSON.stringify(r));
    await H.tap('.ow-done', 400); await H.save();
    const ts = await H.placeBy('Top shelf'); const bc = await H.placeBy('Bookcase'); const d = await H.dump();
    const ein = (id) => (d.find((x) => x.kind === 'edge' && x.from === id && !x.until) || {}).to;
    info('L5s', JSON.stringify({ ts: ts && ein(ts.id), bc: bc && ein(bc.id), page: await H.where() }));
    check('L5s', 'stored: Top shelf in Bookcase in Study', ts && bc && ein(ts.id).name === 'Bookcase' && ein(bc.id).name === 'Study', '');
  });
  await seedDeep();
  await step('G1', 'guess box on Move at 375×667 Largest', async () => {
    S.GUESS = { name: 'Linen cupboard with towels', merged: 'Pantry shelf with towels' };
    await H.openMove('wallet'); await H.typeWhere('pantry shelf'); await H.done(); await H.shoot('closet.jpg'); await W(2600); await H.snap('g1-guess.png');
    const r = { box: await vis('.ow-ai'), use: await vis('.ow-ai-use'), add: await vis('.ow-ai-add'), no: await vis('.ow-ai-no'), field: await vis('.ow-field'), save: await vis('.lc-k.sv'), merged: await H.txt('.ow-ai-merged') };
    info('G1', JSON.stringify(r));
    check('G1', 'Use this / Append / Not this, the field and Save all on screen and tappable', ['use', 'add', 'no', 'field', 'save'].every((k) => r[k].inView && r[k].hit), JSON.stringify(r));
    if (r.add.inView) { await H.tap('.ow-ai-add', 400); const v = await H.val(); info('G1b', 'after Append: ' + v + ' head=' + (await H.head())); check('G1b', 'Append gives what the box said', v.toLowerCase() === r.merged.replace(/^Append gives “|”$/g, '').toLowerCase(), JSON.stringify({ v, merged: r.merged })); }
    await H.leave();
  });
  await step('G2', 'guess box on Log (with "Your …?" question absent) at 375×667 Largest', async () => {
    S.GUESS = { name: 'Garden shed shelf', merged: 'Potting bench shelf' };
    await H.logNew('trowel', 'scissors.jpg'); await H.typeWhere('potting bench'); await H.done(); await H.shoot('tooldrawer.jpg'); await W(2600); await H.snap('g2-guess.png');
    const r = { use: await vis('.ow-ai-use'), add: await vis('.ow-ai-add'), no: await vis('.ow-ai-no'), field: await vis('.ow-field'), strip: await vis('.ow-to'), save: await vis('.lc-k.sv'), note: await vis('.ow-note') };
    info('G2', JSON.stringify(r));
    check('G2', 'Log: Use this / Append / Not this, field, strip, Save on screen and tappable', ['use', 'add', 'no', 'field', 'save'].every((k) => r[k].inView && r[k].hit), JSON.stringify(r));
    await H.leave();
  });
  await H.finish('n5');
})().catch((e) => { console.error(e); process.exit(1); });
