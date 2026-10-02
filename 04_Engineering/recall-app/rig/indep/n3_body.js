    await page.evaluate(() => window.__rig.rules(true));
    const placePage = async (nm) => { await home(); await page.click('.menu-btn'); await page.waitForTimeout(500); await page.click('.drawer-row:has-text("Places")'); await page.waitForTimeout(900); const r = page.locator('.loc-row').filter({ hasText: new RegExp('^' + nm) }).first(); if (!(await r.count())) { console.log('   NO PLACE ROW', nm); return false; } await r.click(); await page.waitForTimeout(900); return true; };
    const PP = async () => console.log('   PAGE:', (await bodyText()).replace(/\s+/g, ' ').replace(/^.*?Where this place is/, 'Where:').slice(0, 300));
    const placeParents = async () => { const d = await D(); console.log('PLACE DOCS:', d.filter(x => x.kind === 'place').map(p => `${p.name}${p.deleted ? '(DEL)' : ''}^${JSON.stringify(p.parent)}`).join(' ; ')); };
    const sheetRows = async () => page.evaluate(() => { const s = [...document.querySelectorAll('.sheet')].pop(); return s ? [...s.querySelectorAll('.wl-row')].map(r => r.innerText.replace(/\s+/g, ' ')).join(' | ') : '(no sheet)'; });
    const pickR = async (nm) => { const l = page.locator('.sheet .wl-row').filter({ has: page.locator(`b:text-is("${nm}")`) }).last(); if (!(await l.count())) { console.log('   NOT OFFERED:', nm); return false; } await l.scrollIntoViewIfNeeded(); await l.click(); await page.waitForTimeout(1000); console.log('   picked', nm); return true; };
    const sheetSearch = async (q) => { const i = page.locator('.sheet input').last(); await i.fill(''); await i.type(q, { delay: 10 }); await page.waitForTimeout(500); console.log(`   SEARCH ${q}: ${(await sheetText()).slice(0, 220)}`); };
    const closeSheet = async () => { await cancelChoose(); await page.keyboard.press('Escape'); await page.waitForTimeout(400); };
    console.log('\n######## P1 Where this place is: Pantry shelf -> Garage shelf, then Not in anything');
    await placePage('Pantry shelf'); await page.click('.pl-where'); await page.waitForTimeout(800); await shot('p1-sheet'); console.log('   SHEET:', (await sheetText()).slice(0, 300));
    await pickR('Garage shelf'); await PP(); await placeParents(); await shot('p1-after');
    await page.click('.pl-where'); await page.waitForTimeout(800); console.log('   SHEET2:', (await sheetText()).slice(0, 300)); await shot('p1-sheet2');
    const nia = page.locator('.sheet button').filter({ hasText: /Not in anything/ }).first(); console.log('   not-in-anything btn', await nia.count()); if (await nia.count()) { await nia.click(); await page.waitForTimeout(900); } await PP(); await placeParents();
    await page.click('.pl-where'); await page.waitForTimeout(800); await pickR('Garage shelf'); await placeParents();
    console.log('\n######## P2 circle: Garage shelf -> Where -> Pantry shelf offered?');
    await placePage('Garage shelf'); await PP(); await page.click('.pl-where'); await page.waitForTimeout(800); console.log('   ROWS:', await sheetRows()); await sheetSearch('pantry'); await shot('p2-circle'); const c1 = await pickR('Pantry shelf'); if (c1) { console.log('!! CIRCLE'); } else await closeSheet(); await placeParents();
    console.log('\n######## P3 Move all to... from Garage shelf (holds Pantry shelf) -> is Pantry shelf offered as target?');
    await placePage('Garage shelf'); await PP(); const ma = page.locator('.pl-all'); console.log('   move-all btn', await ma.count()); if (await ma.count()) { await ma.click(); await page.waitForTimeout(800); console.log('   ROWS:', await sheetRows()); await shot('p3-moveall-sheet'); await sheetSearch('pantry'); const c2 = await pickR('Pantry shelf'); if (c2) console.log('!! CIRCLE via Move all'); else await closeSheet(); }
    await placeParents();
    console.log('\n######## P4 Move all to... from Crawl space (holds memorabilia box) -> Memorabilia box / Wooden box offered?');
    await placePage('Crawl space'); await PP(); const ma2 = page.locator('.pl-all'); console.log('   move-all btn', await ma2.count());
    await page.locator('.pl-move').first().click(); await page.waitForTimeout(800); console.log('   ROW MOVE ROWS:', await sheetRows()); await sheetSearch('wooden'); await shot('p4-rowmove-wooden'); await sheetSearch('memorabilia'); await closeSheet();
    console.log('\n######## P5 Move all from Desk drawer (3D model edge + passport text-only, private) -> Kitchen counter');
    await placePage('Desk drawer'); await PP(); await page.click('.pl-all'); await page.waitForTimeout(800); console.log('   ROWS:', await sheetRows()); await pickR('Kitchen counter'); await page.waitForTimeout(800); await shot('p5-after'); await PP();
    const ub = page.locator('button:has-text("Undo")').filter({ visible: true }); console.log('   undo visible?', await ub.count());
    await dumpItem('3D model of plant sensor'); await dumpItem('passport'); await placeEdges();
    if (await ub.count()) { await ub.first().click(); await page.waitForTimeout(1200); await PP(); await dumpItem('3D model of plant sensor'); await dumpItem('passport'); await placeEdges(); await page.click('.pl-all').catch(() => {}); await page.waitForTimeout(800); if (await page.locator('.sheet').count()) await pickR('Kitchen counter'); }
    console.log('\n######## P6 Remove the now-empty Desk drawer');
    await placePage('Desk drawer'); await PP(); await shot('p6-empty'); const rm = page.locator('button:has-text("Remove this place")'); console.log('   remove disabled?', await rm.isDisabled().catch(() => 'n/a'));
    if (!(await rm.isDisabled().catch(() => true))) { await rm.click(); await page.waitForTimeout(800); await shot('p6-confirm'); console.log('   ', (await bodyText()).replace(/\s+/g, ' ').slice(-250)); const ok = page.locator('.sheet button, [role=dialog] button').filter({ hasText: /^Remove/ }).last(); if (await ok.count()) { await ok.click(); await page.waitForTimeout(1200); } console.log('   after remove:', (await bodyText()).replace(/\s+/g, ' ').slice(0, 200)); }
    await placeParents(); await placeEdges(); await dumpItem('passport'); await dumpItem('3D model of plant sensor');
    console.log('   new log: words "in the desk drawer" after removal ->'); await logStart('stamp', 'tin.jpg'); await setWords('in the desk drawer'); await openIn(); console.log('   ', (await inText()).slice(0, 250)); await cancelChoose(); await press('.lc-x'); await page.waitForTimeout(400); { const lv = page.locator('button:has-text("Leave")'); if (await lv.count()) await lv.first().click(); }
    console.log('\n######## P7 Remove a place that holds a place (Garage shelf holds Pantry shelf)');
    await placePage('Garage shelf'); await PP(); const rm2 = page.locator('button:has-text("Remove this place")'); console.log('   remove disabled?', await rm2.isDisabled().catch(() => 'n/a'));
    console.log('\n######## P8 old-data place Hall table: Where this place is -> Kitchen counter (no place doc)');
    await placePage('Hall table'); await PP(); await page.click('.pl-where'); await page.waitForTimeout(800); await pickR('Kitchen counter'); await PP(); await placeParents(); await shot('p8-hall');
    console.log('\n######## P9 Move one item out: Hall table row "Reading glasses" Move -> Tin box');
    await placePage('Hall table'); await page.locator('.pl-move').first().click(); await page.waitForTimeout(800); console.log('   ROWS:', (await sheetRows()).slice(0, 300)); await pickR('Tin box'); await PP(); await shot('p9');
    const ub2 = page.locator('button:has-text("Undo")').filter({ visible: true }); console.log('   undo visible?', await ub2.count()); await dumpItem('reading glasses'); await dumpItem('wallet');
