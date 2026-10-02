    await page.evaluate(() => window.__rig.rules(true));
    const placePage = async (nm) => { await home(); await page.click('.menu-btn'); await page.waitForTimeout(500); await page.click('.drawer-row:has-text("Places")'); await page.waitForTimeout(900); const r = page.locator('.loc-row').filter({ hasText: new RegExp('^' + nm) }).first(); if (!(await r.count())) { console.log('   NO PLACE ROW', nm); return false; } await r.click(); await page.waitForTimeout(900); return true; };
    const pickR = async (nm) => { const l = page.locator('.sheet .wl-row').filter({ has: page.locator(`b:text-is("${nm}")`) }).last(); if (!(await l.count())) { console.log('   NOT OFFERED:', nm); return false; } await l.scrollIntoViewIfNeeded(); await l.click(); await page.waitForTimeout(1000); console.log('   picked', nm); return true; };
    console.log('\n######## R1 remove Kitchen counter after moving its item; then pick the removed place again');
    await placePage('Kitchen counter'); await page.locator('.pl-move').first().click(); await page.waitForTimeout(800); await pickR('Pantry shelf');
    await placePage('Kitchen counter'); const rm = page.locator('button:has-text("Remove this place")'); await rm.click(); await page.waitForTimeout(700); await page.locator('button').filter({ hasText: /^Remove$/ }).last().click(); await page.waitForTimeout(1200);
    await allPlaces(); await placeEdges();
    await logStart('stamp', 'tin.jpg'); await setWords('on the kitchen counter'); await openIn(); console.log('IN after removal:', (await inText()).slice(0, 600)); await shot('r1-in-after-remove');
    const ok = await pickIn('Kitchen counter'); if (ok) { await doSave(); await dumpItem('stamp'); }
    await home(); await page.click('.menu-btn'); await page.waitForTimeout(500); await page.click('.drawer-row:has-text("Places")'); await page.waitForTimeout(900); console.log('PLACES PAGE', (await bodyText()).replace(/\s+/g, ' ')); await shot('r1-places');
    await allPlaces();
    console.log('\n######## R2 Move all on a place whose items include one of Robert\'s private... (skip) -> Move all includes target = itself?');
    await placePage('Craft nook'); await page.click('.pl-all'); await page.waitForTimeout(800); const self = await page.locator('.sheet .wl-row').filter({ has: page.locator('b:text-is("Craft nook")') }).count(); console.log('   self offered in Move all?', self); 
    const tb = await page.locator('.sheet .wl-row').filter({ has: page.locator('b:text-is("Tote bin")') }).count(); console.log('   Tote bin (one of its own contents) offered as Move-all target?', tb); await shot('r2-moveall-craft');
    if (tb) { await pickR('Tote bin'); await page.waitForTimeout(800); console.log('   PAGE', (await bodyText()).replace(/\s+/g, ' ').slice(0, 300)); await dumpItem('tote bin'); await dumpItem('filing cabinet'); await placeEdges(); console.log('chain tote', await chainOf('tote bin')); }
