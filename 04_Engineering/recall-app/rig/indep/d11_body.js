    const SIZE = process.env.SIZE || 'Largest'; const VW = Number(process.env.VW || 375), VH = Number(process.env.VH || 667); const KB = VH < 700 ? 300 : 380;
    await page.setViewportSize({ width: VW, height: VH }); await kbInit();
    await seedHouse(); await page.evaluate(() => window.__rig.rules(true));
    await home(); await tap('.menu-btn', { wait: 500 }); await tap('.drawer-row:has-text("Text size")', { wait: 600 }); await tap(`button:text-is("${SIZE}")`, { wait: 400 });
    const openItem = async (nm) => { await home(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', nm); await page.waitForTimeout(450); await page.locator('.ask .tile').filter({ hasText: new RegExp(nm, 'i') }).first().click(); await page.waitForSelector('.card.thing'); await page.waitForTimeout(900); };
    const geo = (q) => page.evaluate((q) => [...document.querySelectorAll(q)].map(e => { const r = e.getBoundingClientRect(); return `${Math.round(r.top)}-${Math.round(r.bottom)}`; }).join(','), q);
    await openItem('baseball card'); await shot(`${SIZE} item page`); await tap('button:has-text("Move it")', { wait: 1000 }); await shot(`${SIZE} move it`);
    await page.locator('.lv-sq[aria-label^="Level 2"]').click(); await page.waitForTimeout(500); if (await page.locator('.sheet-row').count()) { await shot(`${SIZE} L2 sheet`); await tap('.btn-quiet:has-text("Close")', { wait: 300 }); }
    await shot(`${SIZE} L2 selected`);
    await tap('.lc-choose', { wait: 700 }); await shot(`${SIZE} choose L2`);
    console.log('search', await geo('.wl-search'), 'rows', await geo('.where-list .wl-row'), 'vh', VH);
    await page.locator('.wl-search input').click(); await kbUp(KB); await page.waitForTimeout(500); await page.keyboard.type('Pan', { delay: 30 }); await page.waitForTimeout(400);
    console.log('KB search above?', JSON.stringify(await aboveKb('.wl-search', KB)), 'first row', JSON.stringify(await aboveKb('.where-list .wl-row', KB)), 'cancel', JSON.stringify(await aboveKb('.btn-quiet', KB)));
    await shot(`${SIZE} choose L2 keyboard`); await kbDown();
    const c = page.locator('.btn-quiet:has-text("Cancel")').last(); if (await c.count()) await c.click(); await page.waitForTimeout(400);
    // new tier + photo -> naming sheet with keyboard
    WHERE.push({ name: 'attic shelf with a very long name indeed', moves: false }); await tap('.lv-sq.plus', { wait: 400 }); await cam('real_painting.jpg'); await tap('.lc-shutter', { wait: 4200 });
    await shot(`${SIZE} new tier naming`);
    const inp = page.locator('.sheet input').first(); if (await inp.count()) { await inp.click(); await kbUp(KB); await page.waitForTimeout(500); console.log('KB naming: use-name', JSON.stringify(await aboveKb('button.btn-primary', KB)), 'input', JSON.stringify(await aboveKb('.sheet input', KB))); await shot(`${SIZE} naming keyboard`); await kbDown(); }
