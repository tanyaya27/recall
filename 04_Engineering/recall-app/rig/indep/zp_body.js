    const placePage = async (nm) => { await home(); await page.click('.menu-btn'); await page.waitForTimeout(500); await page.click('.drawer-row:has-text("Places")'); await page.waitForTimeout(900); const r = page.locator('.loc-row').filter({ hasText: new RegExp('^' + nm + '(?![ a-z])', 'i') }).first(); if (!(await r.count())) { console.log('   NO PLACE ROW', nm); return false; } await r.click(); await page.waitForTimeout(900); return true; };
    await placePage('Craft nook'); await ui('craft nook page'); await shot('p-craft');
    const w = page.locator('text=Where this place is').first(); console.log('where label', await w.count());
    await page.locator('button.field-value').nth(1).click().catch(e => console.log('no fv1', e.message.slice(0, 60))); await page.waitForTimeout(800); await ui('after where click'); await shot('p-where');
    await page.keyboard.press('Escape'); await openItem('coffee can'); await ui('coffee can page'); await shot('p-coffee');
    await tap('button:has-text("Put it in a place or a box")', { wait: 1000 }).catch(() => console.log('no put-in')); await ui('put in sheet'); await shot('p-putin');
