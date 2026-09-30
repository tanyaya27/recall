    await kbInit();
    await seedHouse(); await page.evaluate(() => window.__rig.rules(true));
    const cardInfo = () => page.evaluate(() => { const us = [...document.querySelectorAll('button')].filter(b => /^Undo$/.test(b.innerText.trim())); return us.map(u => { let c = u.parentElement; return c.innerText.replace(/\s+/g, ' '); }); });
    const t0 = Date.now(); const T = () => ((Date.now() - t0) / 1000).toFixed(1) + 's';
    await home(); await page.click(LOG); await page.waitForTimeout(900);
    AI = { name: 'hole punch' }; await cam('keys.jpg'); await tap('.lc-shutter', { wait: 1800 });
    await tap('.lv-sq.plus', { wait: 400 }); await tap('.lc-choose', { wait: 500 }); await page.locator('.wl-search input').fill('Linen'); await page.waitForTimeout(300); await tap('.where-list .wl-row:has-text("Linen closet")', { wait: 500 });
    const tSave = Date.now(); await tap('.lc-k.sv', { wait: 300 }); console.log('after log save', T(), JSON.stringify(await cardInfo()));
    // go straight to the item and move it
    await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', 'hole punch'); await page.waitForTimeout(400); await page.locator('.ask .tile').first().click(); await page.waitForTimeout(500);
    console.log('on item page', ((Date.now() - tSave) / 1000).toFixed(1), 's after log save:', JSON.stringify(await cardInfo())); await shot('item page soon after log');
    await tap('button:has-text("Move it")', { wait: 900 }); await tap('.lc-choose', { wait: 500 }); await page.locator('.wl-search input').fill('Pantry'); await page.waitForTimeout(300); await tap('.where-list .wl-row:has-text("Pantry shelf")', { wait: 500 });
    await tap('.lc-k.sv', { wait: 700 }); const ci = await cardInfo(); console.log('after move save', ((Date.now() - tSave) / 1000).toFixed(1), 's after log save:', JSON.stringify(ci)); await shot('after move save');
    check('U', 'after Move it, no stale Log card (old place) is showing', !ci.some(x => /Linen closet/.test(x)), JSON.stringify(ci));
    // press the visible Undo (whichever) and see what happens
    const u = page.locator('button:text-is("Undo")'); console.log('undo buttons', await u.count());
    if (await u.count()) { await u.last().click(); await page.waitForTimeout(1200); }
    const hp = await itemDoc('hole punch'); console.log('after Undo: item', hp ? 'exists at ' + (await chainOf('hole punch')) : 'GONE'); await shot('after undo');
    check('U', 'Undo after the move puts it back at Linen closet (not deleting the item)', hp && (await chainOf('hole punch')) === 'hole punch > Linen closet', hp ? await chainOf('hole punch') : 'item gone');
    // How long does the Log saved card stay?
    await home(); await page.click(LOG); await page.waitForTimeout(900);
    AI = { name: 'ruler' }; await cam('real_pencil.jpg'); await tap('.lc-shutter', { wait: 1800 });
    await tap('.lc-k.sv', { wait: 100 }); const ts = Date.now(); let last = 0;
    for (let i = 0; i < 40; i++) { const c = await cardInfo(); if (c.length) last = Date.now() - ts; else break; await page.waitForTimeout(500); }
    console.log('Log saved card visible for ~', (last / 1000).toFixed(1), 's');
    // Undo on a Log saved card with a NEW place: is the place doc removed too?
    await home(); await page.click(LOG); await page.waitForTimeout(900);
    AI = { name: 'protractor' }; await cam('real_spoon.jpg'); await tap('.lc-shutter', { wait: 1800 });
    await tap('.lv-sq.plus', { wait: 400 }); await tap('.lc-choose', { wait: 500 }); await page.locator('.wl-search input').fill('Math drawer'); await page.keyboard.press('Enter'); await page.waitForTimeout(500);
    await tap('.lv-sq.plus', { wait: 400 }); await tap('.lc-choose', { wait: 500 }); await page.locator('.wl-search input').fill('Study'); await page.keyboard.press('Enter'); await page.waitForTimeout(500);
    await tap('.lc-k.sv', { wait: 1200 }); await page.locator('button:text-is("Undo")').last().click(); await page.waitForTimeout(1200); await shot('after log undo');
    const left = await page.evaluate(() => window.__rig.dump().filter(x => (x.name === 'Math drawer' || x.name === 'Study') && !x.deleted).map(x => x.kind + ':' + x.name));
    console.log('after Undo of log: protractor', (await itemDoc('protractor')) ? 'still there' : 'gone', '| new places left:', JSON.stringify(left));
    check('U', 'Undo of a Log removes the item', !(await itemDoc('protractor')), '');
    check('U', 'Undo of a Log removes the places it just created (no orphans)', left.length === 0, JSON.stringify(left));
