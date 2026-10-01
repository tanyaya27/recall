    await page.evaluate(() => window.__rig.rules(true));
    const openItem = async (nm) => { await home(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', nm); await page.waitForTimeout(450); await page.locator('.ask .tile').filter({ hasText: new RegExp(nm, 'i') }).first().click(); await page.waitForSelector('.card.thing'); await page.waitForTimeout(900); };
    await openItem('baseball card');
    await tap('button:has-text("Move it")', { wait: 1000 });
    await ui('move it open'); await shot('move it open');
    // level 1 = wooden box selected? shoot it with a late sure-known answer
    WHERE.push({ name: 'wooden box', known: 'Kitchen counter', sure: true }); NEXT_WHERE_DELAY = 4500;
    await cam('real_desk.jpg');
    const t0 = Date.now(); await page.locator('.lc-shutter').click();
    await page.waitForTimeout(800); await ui('0.8s'); await shot('look 0.8s');
    await page.waitForTimeout(2400); console.log('t=', Date.now() - t0); await ui('3.2s'); await shot('look 3.2s');
    await page.waitForTimeout(2000); console.log('t=', Date.now() - t0); await ui('5.2s'); await shot('look 5.2s');
    console.log('pool', lastPoolNames);
