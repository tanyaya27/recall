    await page.evaluate(() => window.__rig.rules(true));
    const openItem = async (nm) => { await home(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', nm); await page.waitForTimeout(450); await page.locator('.ask .tile').filter({ hasText: new RegExp(nm, 'i') }).first().click(); await page.waitForSelector('.card.thing'); await page.waitForTimeout(600); };
    const pageWhere = () => page.evaluate(() => { const t = document.body.innerText.replace(/\s+/g, ' '); const m = t.match(/WHERE IT IS(.*?)Move it/i); return m ? m[1].trim() : 'NO WHERE CARD'; });
    await openItem('3D model of plant sensor');
    await page.locator('.ph-open').first().click(); await page.waitForTimeout(700); await ui('place viewer from item'); await shot('place viewer from item');
    await page.locator('.d2-x').click(); await page.waitForTimeout(400);
    await tap('button:has-text("Move it")', { wait: 1000 }); await ui('move it'); await shot('move it');
    await page.locator('.lv-sq[aria-label^="Level 1"]').click(); await page.waitForTimeout(600); await ui('level1 tapped'); await shot('level1 tapped');
    if (!(await page.locator('.tier-sheet').count())) { await page.locator('.lv-sq[aria-label^="Level 1"]').click(); await page.waitForTimeout(600); await ui('level1 tapped 2'); await shot('level1 tapped 2'); }
    const see = page.locator('button:has-text("See its photos"), button:has-text("photos")');
    console.log('see count', await see.count());
    if (await see.count()) { await see.first().click(); await page.waitForTimeout(700); await ui('camera viewer'); await shot('camera viewer'); }
