    await seedHouse(); await page.evaluate(() => window.__rig.rules(true));
    await home(); await page.click(LOG); await page.waitForTimeout(900);
    AI = { name: 'blue scissors' }; await cam('scissors.jpg'); await tap('.lc-shutter', { wait: 1800 });
    await tap('.lv-sq.plus', { wait: 500 }); WHERE.push({ name: 'white box', moves: true }); await cam('box.jpg'); await tap('.lc-shutter', { wait: 3800 });
    await page.locator('.wl-pend input').fill('White shoebox'); await tap('.wl-pend .btn-primary', { wait: 600 }); await tap('.lc-k.sv', { wait: 2500 });
    await home(); await tap('.menu-btn', { wait: 500 }); await tap('.drawer-row:has-text("Places")', { wait: 800 });
    console.log('Places BEFORE rename:', (await page.locator('.loc-row').allInnerTexts()).map(x => x.replace(/\s+/g, ' ')).join(' | '));
    await shot('places before rename');
    await page.click('.footer .btn-primary.alt').catch(() => {}); 
    await home(); await page.click('.footer .btn-primary.alt'); await page.fill('#ask-input', 'White shoebox'); await page.waitForTimeout(400); await page.locator('.ask .tile').first().click(); await page.waitForTimeout(500);
    await tap('.tp-row:has-text("Rename")', { wait: 500 }); await page.locator('.sheet input').first().fill('Shoebox'); await tap('.sheet .btn-primary', { wait: 800 });
    await home(); await tap('.menu-btn', { wait: 500 }); await tap('.drawer-row:has-text("Places")', { wait: 800 });
    console.log('Places AFTER rename:', (await page.locator('.loc-row').allInnerTexts()).map(x => x.replace(/\s+/g, ' ')).join(' | '));
    await page.locator('.loc-row:has-text("White shoebox")').click(); await page.waitForTimeout(700); await shot('ghost place page');
    console.log('STEP ghost open'); 
    // Remove this place on the ghost
    const rm = page.locator('button:has-text("Remove this place")'); if (await rm.count()) { await rm.click(); await page.waitForTimeout(700); await ui('after remove ghost'); await shot('after remove ghost');
      const conf = page.locator('.sheet button.btn-primary, .sheet button:has-text("Remove")'); if (await conf.count()) { console.log('confirm:', await conf.last().innerText()); await conf.last().click(); await page.waitForTimeout(800); } }
    const sc = await itemDoc('blue scissors'); console.log('scissors after ghost removal: location=', sc && sc.location, 'chain', await chainOf('blue scissors'));
    await home(); console.log('STEP home ok');
    await page.click('.footer .btn-primary.alt'); await page.fill('#ask-input', 'scissors'); await page.waitForTimeout(500); console.log('search:', (await page.locator('.ask').innerText()).replace(/\s+/g, ' '));
    await page.locator('.ask .tile').first().click(); await page.waitForTimeout(500); const w = (await bodyText()).replace(/\s+/g, ' ').match(/WHERE IT IS(.*?)Move it/i); console.log('item page:', w && w[1]); await shot('scissors after ghost removal');
    check('R', 'removing the stale "White shoebox" place does not strip the scissors of where they are', /Shoebox/.test(w && w[1] || ''), w && w[1]);
