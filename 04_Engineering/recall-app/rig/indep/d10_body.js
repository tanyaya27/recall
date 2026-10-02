    await page.evaluate(() => window.__rig.rules(true));
    const openItem = async (nm) => { await home(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', nm); await page.waitForTimeout(450); await page.locator('.ask .tile').filter({ hasText: new RegExp(nm, 'i') }).first().click(); await page.waitForSelector('.card.thing'); await page.waitForTimeout(900); };
    const vtitle = () => page.evaluate(() => { const x = document.querySelector('.d2-x'); if (!x) return 'NO VIEWER'; return x.parentElement.innerText.replace(/\s+/g, ' ') + ' | bot: ' + ((document.querySelector('.d2-bot') || {}).innerText || '').replace(/\s+/g, ' '); });
    // 1. item page viewer: Remove on the item's only photo -> asked?
    await openItem('reading glasses'); await page.locator('.card.thing img').first().click(); await page.waitForTimeout(600); console.log('ITEM viewer', await vtitle());
    await tap('.d2-pill.rm', { wait: 600 }); await ui('item viewer after Remove tap'); await shot('item viewer remove tap');
    const c1 = page.locator('button:has-text("Cancel"), button:has-text("Keep")'); if (await c1.count()) await c1.last().click(); await page.waitForTimeout(400);
    console.log('glasses photoCount', (await itemDoc('reading glasses')).photoCount);
    // 2. place viewer from item page: Remove on a place photo -> asked?
    if (await page.locator('.d2-x').count()) { await page.locator('.d2-x').click(); await page.waitForTimeout(300); }
    await openItem('spare batteries'); await page.locator('.ph-open').first().click(); await page.waitForTimeout(600); console.log('PLACE viewer (item page)', await vtitle());
    await tap('.d2-pill.rm', { wait: 600 }); await ui('place viewer after Remove tap'); await shot('place viewer remove tap');
    const c2 = page.locator('button:has-text("Cancel"), button:has-text("Keep")'); if (await c2.count()) await c2.last().click(); await page.waitForTimeout(400);
    console.log('Kitchen counter photos', (await placeByName('Kitchen counter')).photos.length);
    // 3. camera: tier with one photo -> See its photos -> Remove
    await home(); await page.click(LOG); await page.waitForTimeout(900); AI = { name: 'egg timer' }; await cam('real_spoon.jpg'); await tap('.lc-shutter', { wait: 1800 });
    WHERE.push({ name: 'foyer bench', moves: false }); await tap('.lv-sq.plus', { wait: 400 }); await cam('real_painting.jpg'); await tap('.lc-shutter', { wait: 4200 });
    await tap('button:has-text("Use this name")', { wait: 600 });
    await page.locator('.lv-sq[aria-label^="Level 1"]').click(); await page.waitForTimeout(500);
    await tap('button.sheet-row:has-text("See its photos")', { wait: 700 }); console.log('CAM tier viewer 1 photo', await vtitle()); await shot('cam tier viewer one photo');
    await tap('.d2-pill.rm', { wait: 700 }); await ui('cam after remove last photo'); await shot('cam after remove last photo');
    console.log('squares', await page.locator('.lv-sq').evaluateAll(a => a.map(b => b.getAttribute('aria-label') + (b.querySelector('img') ? ' [img]' : ' [no img]'))), '| say', await text('.lc-say'));
    // 4. the item's own photo in the camera: tap the item thumbnail in the top bar
    if (await page.locator('.d2-x').count()) { await page.locator('.d2-x').click(); await page.waitForTimeout(300); }
    const top = page.locator('.lc-top img, .lc-head img, .lc-thumb').first(); if (await top.count()) { await top.click(); await page.waitForTimeout(600); console.log('CAM item photo tap ->', await vtitle()); await shot('cam item thumb tap'); if (await page.locator('.d2-x').count()) await page.locator('.d2-x').click(); }
    await tap('.lc-k.sv', { wait: 2000 }); console.log('saved: egg', await chainOf('egg timer'), '| foyer bench', JSON.stringify(((await placeByName('Foyer bench')) || {}).photos?.length));
