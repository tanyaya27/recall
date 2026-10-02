    const moveIt = async (nm) => { await openItem(nm); await tap('button:has-text("Move it")', { wait: 1200 }); };
    console.log('\n######## B2 loop: memorabilia box Move it, words "in the wooden box"');
    await moveIt('memorabilia box'); await words('in the wooden box next to the baseball card'); await openIn(); console.log('SHEET:', await inText()); await shot('b2-sheet');
    const i = page.locator('.in-list .wl-search input'); await i.type('wooden', { delay: 20 }); await page.waitForTimeout(500); console.log('SEARCH wooden:', await inText()); await shot('b2-search-wooden');
    await i.fill(''); await i.type('memorabilia', { delay: 20 }); await page.waitForTimeout(500); console.log('SEARCH memorabilia:', await inText());
    await i.fill(''); await i.type('wooden box', { delay: 20 }); await page.waitForTimeout(500); console.log('SEARCH "wooden box":', await inText());
    const nb = page.locator('.in-list button').filter({ hasText: /New place/ }).first(); if (await nb.count()) { console.log('   NEW offered:', await nb.innerText()); await nb.click(); await page.waitForTimeout(600); console.log('CAM', await camText()); await doSave(); await allPlaces(); await placeEdges(); await dumpItem('memorabilia box'); }
    else await cancelChoose();
    console.log('\n######## Places menu');
    await home(); await page.click('.menu-btn'); await page.waitForTimeout(500); await page.click('.drawer-row:has-text("Places")'); await page.waitForTimeout(900); await ui('places'); await shot('places');
    await page.locator('button, a').filter({ hasText: /^Pantry shelf/ }).first().click(); await page.waitForTimeout(900); await ui('pantry page'); await shot('pantry');
