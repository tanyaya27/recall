    await seedHouse(); await page.evaluate(() => window.__rig.rules(true));
    let pool = '';
    page.on('request', (r) => { if (/anthropic/.test(r.url())) { const b = JSON.parse(r.postData() || '{}'); const t = (b.messages?.[0]?.content || []).filter(x => x.type === 'text').map(x => x.text).join('\n'); if (/MOVES:/.test(t)) { pool = t.split('\n').filter(l => /^SAVED/.test(l)).join(' ; '); console.log('POOL:', pool); } } });
    // 1. new place Studio wall via log
    await home(); await page.click(LOG); await page.waitForTimeout(900);
    AI = { name: 'paint brush' }; await cam('real_pencil.jpg'); await tap('.lc-shutter', { wait: 1800 });
    await tap('.lv-sq.plus', { wait: 400 }); WHERE.push({ name: 'studio wall', moves: false }); await cam('real_painting.jpg'); await tap('.lc-shutter', { wait: 3800 });
    await page.locator('.wl-pend input').fill('Studio wall'); await tap('.wl-pend .btn-primary', { wait: 600 }); await tap('.lc-k.sv', { wait: 2200 });
    // 2. next day: log another item, photograph the Studio wall again
    await home(); await page.click(LOG); await page.waitForTimeout(900);
    AI = { name: 'palette knife' }; await cam('real_spoon.jpg'); await tap('.lc-shutter', { wait: 1800 });
    await tap('.lv-sq.plus', { wait: 400 }); WHERE.push({ name: 'wall', known: 'Studio wall', moves: false }); await cam('real_painting.jpg'); await tap('.lc-shutter', { wait: 3800 });
    const t = await bodyText(); console.log('asked Is this the Studio wall?', /Is this the Studio wall/i.test(t)); await shot('studio wall second time');
    check('P', 'a place made today is in the recognition pool next time', /Studio wall/.test(pool), pool);
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    for (const c of ['.sheet .btn-quiet:has-text("Cancel")']) if (await page.locator(c).count()) await tap(c);
    await tap('.lc-x', { wait: 500 }); if (await page.locator('button:has-text("Throw away")').count()) await tap('button:has-text("Throw away")', { wait: 600 });
    // 3. Move it on the 3D model, photograph its own Desk drawer
    await home(); await page.click('.footer .btn-primary.alt'); await page.fill('#ask-input', 'plant sensor'); await page.waitForTimeout(400); await page.locator('.ask .tile').first().click(); await page.waitForTimeout(600);
    await tap('button:has-text("Move it")', { wait: 1000 });
    WHERE.push({ name: 'drawer', known: 'Desk drawer', moves: false }); await cam('drawer.jpg'); await tap('.lc-shutter', { wait: 3000 });
    const t2 = await bodyText(); console.log('Move it: asked Is this the Desk drawer?', /Is this the Desk drawer/i.test(t2)); await shot('move it photo own drawer'); await ui('move it photo own drawer');
    check('P', 'Move it: photographing the current Desk drawer asks "Is this the Desk drawer?"', /Is this the Desk drawer/i.test(t2), pool);
