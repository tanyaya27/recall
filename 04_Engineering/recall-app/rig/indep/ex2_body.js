    await kbInit();
    await seedHouse(); await page.evaluate(() => window.__rig.rules(true));
    await home(); await page.click(LOG); await page.waitForTimeout(900);
    AI = { name: 'blue scissors' }; await cam('scissors.jpg'); await tap('.lc-shutter', { wait: 1800 });
    await tap('.lv-sq.plus', { wait: 500 }); await ui('after + (level1 empty)'); await shot('lvl1 empty');
    WHERE.push({ name: 'white box', moves: true }); await cam('box.jpg'); await tap('.lc-shutter', { wait: 3800 });
    await shot('lvl1 photographed'); await ui('lvl1 photographed');
    // name it
    const pend = page.locator('.wl-pend input');
    if (await pend.count()) { console.log('pending value:', await pend.inputValue()); await pend.fill('White shoebox'); await tap('.wl-pend .btn-primary', { wait: 600 }); }
    await shot('lvl1 named'); await ui('lvl1 named');
    await tap('.lv-sq.plus', { wait: 500 });
    WHERE.push({ name: 'bookshelf', moves: false }); await cam('closet.jpg'); await tap('.lc-shutter', { wait: 3800 });
    await shot('lvl2 photographed'); await ui('lvl2 photographed');
    if (await pend.count()) { console.log('pending value:', await pend.inputValue()); await pend.fill('Ikea shelf'); await tap('.wl-pend .btn-primary', { wait: 600 }); }
    await tap('.lv-sq.plus', { wait: 500 });
    await tap('.lc-choose', { wait: 600 }); await page.locator('.wl-search input').fill('Office'); await page.waitForTimeout(400); await ui('choose typed Office'); await shot('choose typed office');
    await page.keyboard.press('Enter'); await page.waitForTimeout(700);
    await shot('3 levels'); await ui('3 levels');
    await tap('.lc-k.sv', { wait: 2500 }); await shot('saved card'); await ui('saved card');
    console.log('CHAIN item:', await chainOf('blue scissors'));
    const d = await itemDoc('blue scissors'); console.log('ITEM location field:', d && d.location, 'photos', d && d.photoCount);
    for (const n of ['White shoebox', 'Ikea shelf', 'Office']) { const p = await page.evaluate((nm) => window.__rig.dump().filter((x) => (x.name||'').toLowerCase() === nm.toLowerCase()).map(x => ({kind: x.kind, id: x.id, photos: (x.photos||[]).length, holds: x.holds})), n); console.log('DOC', n, JSON.stringify(p)); }
    // menu
    await home(); await tap('.menu-btn', { wait: 600 }); await ui('menu'); await shot('menu');
