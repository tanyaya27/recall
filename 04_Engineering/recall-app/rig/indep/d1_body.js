    await page.evaluate(() => window.__rig.rules(true));
    const openItem = async (nm) => { await home(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', nm); await page.waitForTimeout(450); await page.locator('.ask .tile').filter({ hasText: new RegExp(nm, 'i') }).first().click(); await page.waitForSelector('.card.thing'); await page.waitForTimeout(600); };
    const pageWhere = () => page.evaluate(() => { const t = document.body.innerText.replace(/\s+/g, ' '); const m = t.match(/WHERE IT IS(.*?)Move it/i); return m ? m[1].trim() : 'NO WHERE CARD'; });
    await home(); await page.click('.menu-btn'); await page.waitForTimeout(400); console.log('MENU', (await bodyText()).match(/2026\d+\w*/g)); await shot('menu');
    await openItem('3D model of plant sensor'); console.log('WHERE:', await pageWhere()); await ui('item page'); await shot('item page');
    // tap main photo
    const imgs = await page.evaluate(() => [...document.querySelectorAll('.card.thing img')].map(i => { const r = i.getBoundingClientRect(); return i.className + ' ' + Math.round(r.left) + ',' + Math.round(r.top) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + ' parent=' + i.parentElement.className; }));
    console.log('IMGS', imgs);
    await page.locator('.card.thing img').first().click(); await page.waitForTimeout(700); await ui('viewer from item'); await shot('viewer from item');
