    const now = Date.now(), H = 3600e3;
    await page.evaluate(([a, b, c, now, H]) => window.__rig.seed([{ id: 'plH', kind: 'place', owner: 'margaret', by: 'margaret', private: false, name: 'Hall table', order: now - 50 * H, createdAt: now - 50 * H, parent: null,
      photos: [{ photo: a, thumb: a, at: now - 50 * H }, { photo: b, thumb: b, at: now - 20 * H }, { photo: c, thumb: c, at: now - 2 * H }] }]), [img('real_desk.jpg'), img('closet.jpg'), img('drawer.jpg'), now, H]);
    await page.evaluate(() => window.__rig.rules(true));
    const openItem = async (nm) => { await home(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', nm); await page.waitForTimeout(450); await page.locator('.ask .tile').filter({ hasText: new RegExp(nm, 'i') }).first().click(); await page.waitForSelector('.card.thing'); await page.waitForTimeout(600); };
    const vtitle = () => page.evaluate(() => { const x = document.querySelector('.d2-x'); if (!x) return 'NO VIEWER'; return x.parentElement.innerText.replace(/\s+/g, ' ') + ' | bot: ' + ((document.querySelector('.d2-bot') || {}).innerText || '').replace(/\s+/g, ' ') + ' | scrollLeft ' + Math.round((document.querySelector('.d2-photos') || {}).scrollLeft || 0); });
    const swipe = async () => { if (ENG === 'cr') { const s = await page.context().newCDPSession(page); const pt = (x) => [{ x, y: 420 }];
        await s.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(320) }); for (let x = 300; x >= 60; x -= 30) { await s.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(x) }); await page.waitForTimeout(16); }
        await s.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
      else { await page.evaluate(() => { const e = document.querySelector('.d2-photos'); e.scrollBy({ left: e.clientWidth, behavior: 'instant' }); }); }
      await page.waitForTimeout(900); };
    await openItem('wallet'); await page.locator('.ph-open').first().click(); await page.waitForTimeout(600);
    console.log('ITEM-PAGE place viewer:', await vtitle()); await swipe(); console.log('  swipe1:', await vtitle()); await swipe(); console.log('  swipe2:', await vtitle()); await shot('item page place viewer swiped');
    await page.locator('.d2-x').click(); await page.waitForTimeout(400);
    await tap('button:has-text("Move it")', { wait: 1000 }); await page.locator('.lv-sq[aria-label^="Level 1"]').click(); await page.waitForTimeout(600);
    await tap('button.sheet-row:has-text("See its photos")', { wait: 700 });
    console.log('CAMERA place viewer:', await vtitle()); await swipe(); console.log('  swipe1:', await vtitle()); await swipe(); console.log('  swipe2:', await vtitle()); await shot('camera place viewer swiped');
    await page.locator('.d2-x').click(); await page.waitForTimeout(400); await tap('.lc-x', { wait: 500 }); if (await page.locator('button:has-text("Throw away")').count()) await tap('button:has-text("Throw away")');
    // Log with a tier photographed twice
    await home(); await page.click(LOG); await page.waitForTimeout(900);
    AI = { name: 'egg timer' }; await cam('real_spoon.jpg'); await tap('.lc-shutter', { wait: 1800 });
    WHERE.push({ name: 'foyer bench', moves: false }); await tap('.lv-sq.plus', { wait: 400 }); await cam('real_painting.jpg'); await tap('.lc-shutter', { wait: 4200 });
    if (await page.locator('button:has-text("Use this name")').count()) await tap('button:has-text("Use this name")', { wait: 600 });
    WHERE.push({ name: 'foyer bench', moves: false }); await cam('closet.jpg'); await tap('.lc-shutter', { wait: 3000 }); await ui('after 2nd tier photo'); await shot('after 2nd tier photo');
    if (await page.locator('button:has-text("Use this name")').count()) await tap('button:has-text("Use this name")', { wait: 600 });
    await page.locator('.lv-sq[aria-label^="Level 1"]').click(); await page.waitForTimeout(500); console.log('sheet rows', await page.locator('.sheet-row').allInnerTexts());
    await tap('button.sheet-row:has-text("See its photos")', { wait: 700 }); console.log('LOG tier viewer:', await vtitle()); await swipe(); console.log('  swipe1:', await vtitle()); await shot('log tier viewer p2');
    await tap('.d2-pill.rm', { wait: 600 }); await ui('after remove tap'); await shot('after remove tap');
    const conf = page.locator('button:has-text("Remove")').last(); if (await page.locator('.sheet button:has-text("Remove"), .confirm button:has-text("Remove")').count()) { await page.locator('.sheet button:has-text("Remove"), .confirm button:has-text("Remove")').last().click(); await page.waitForTimeout(600); }
    console.log('after remove:', await vtitle()); await shot('after remove');
    await tap('.d2-edit', { wait: 600 }); await ui('rename'); await shot('rename sheet');
    if (await page.locator('.sheet input, input.place-input').count()) { await page.locator('.sheet input, input.place-input').first().fill('Hall bench'); await page.waitForTimeout(200);
      const b = page.locator('.sheet .btn-primary, button:has-text("Use this name")').first(); await b.click(); await page.waitForTimeout(700); }
    console.log('after rename:', await vtitle()); await shot('after rename'); await ui('after rename');
    if (await page.locator('.d2-x').count()) { await page.locator('.d2-x').click(); await page.waitForTimeout(400); }
    console.log('camera say:', await text('.lc-say'), '| squares', await page.locator('.lv-sq').evaluateAll(a => a.map(b => b.getAttribute('aria-label'))));
    await tap('.lc-k.sv', { wait: 2000 }); const pl = await placeByName('Hall bench') || await placeByName('Foyer bench'); console.log('saved place', pl && pl.name, pl && pl.photos && pl.photos.length, '| egg', await chainOf('egg timer'));
