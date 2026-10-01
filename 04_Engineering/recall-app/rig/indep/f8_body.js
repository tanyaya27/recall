    const tapSq = async (n) => { const l = page.locator(`.lv-sq[aria-label^="Level ${n}"]`).first(); await l.scrollIntoViewIfNeeded(); await page.waitForTimeout(200); await l.click(); await page.waitForTimeout(600); console.log('   tapped L' + n); };
    const closeSheetRow = async () => { if (await page.locator('.sheet-row').filter({ visible: true }).count()) { console.log('   sq sheet:', (await page.evaluate(() => [...document.querySelectorAll('.sheet')].pop().innerText)).replace(/\n/g, ' / ')); await btn(/^Close$/); } };
    // L3 via scrolled strip
    await fresh('L3 Crawl space (no photo) shot');
    await tapSq(3); await S('L3 tapped'); await shot('f8-L3-tapped'); await closeSheetRow(); await S('L3 sel');
    await shoot('real_painting.jpg'); await S('L3 shot'); console.log('modal:', (await page.evaluate(() => (document.querySelector('.photo-for') || {}).innerText || '')).replace(/\n/g, ' / ')); await shot('f8-L3-shot');
    if (await btn(/Another photo of the Crawl space/i, 1200)) { await S('L3 added'); await saveNow(); console.log('screen:', (await cardText()).slice(0, 300)); await store(); }
    // Cycles: L2 -> pick Wooden box
    await fresh('cycle: L2 Memorabilia box -> different -> pick Wooden box');
    await tapSq(2); await closeSheetRow(); await shoot('drawer.jpg', { name: 'zz' }, 300); await btn(/A different place/, 1200);
    await pickPlace('Wooden box'); await S('picked Wooden box for L2'); console.log('BN:', (await page.evaluate(() => (document.querySelector('.bn') || document.querySelector('.where-list') || {}).innerText || '')).replace(/\n/g, ' / ').slice(0, 400)); await shot('f8-cycle-L2-woodenbox');
    if (await btn(/^Use the/, 1000)) { await S('after Use'); await shot('f8-cycle-after-use'); await saveNow(); console.log('screen:', (await cardText()).slice(0, 300)); }
    await store();
    // Cycle: L3 -> pick Memorabilia box (via Choose place for L3)
    await fresh('cycle: L3 Crawl space -> Choose place -> pick Memorabilia box');
    await tapSq(3); await closeSheetRow(); await tap('.lc-choose', { wait: 900 }); await S('choose for L3'); await shot('f8-choose-L3');
    await pickPlace('Memorabilia box'); console.log('BN:', (await page.evaluate(() => (document.querySelector('.bn') || document.querySelector('.where-list') || {}).innerText || '')).replace(/\n/g, ' / ').slice(0, 400)); await shot('f8-cycle-L3-memorabilia');
    if (await btn(/^Use the/, 1000)) { await S('after Use'); await saveNow(); console.log('screen:', (await cardText()).slice(0, 300)); }
    await store();
    // Current place pick on L1 via the photo
    await fresh('pick CURRENT place (Wooden box) after a photo on L1');
    await shoot('real_desk.jpg', { name: 'zz' }, 300); await btn(/A different place/, 1200); await pickPlace('Wooden box'); console.log('BN:', (await page.evaluate(() => (document.querySelector('.bn') || document.querySelector('.where-list') || {}).innerText || '')).replace(/\n/g, ' / ').slice(0, 400)); await shot('f8-current-pick');
    if (await btn(/^Use the/, 1000)) { await S('after Use'); await saveNow(); console.log('screen:', (await cardText()).slice(0, 300)); }
    await store();
    // L2 different -> pick Pantry: Before/Now sentence "moves with everything in it"
    await fresh('L2 different -> Pantry shelf (Before/Now text)');
    await tapSq(2); await closeSheetRow(); await shoot('drawer.jpg', { name: 'zz' }, 300); await btn(/A different place/, 1200); await pickPlace('Pantry shelf');
    console.log('BN:', (await page.evaluate(() => (document.querySelector('.bn') || {}).innerText || '')).replace(/\n/g, ' / ')); await shot('f8-L2-bn');
    await btn(/^Use the/, 1000); await S('after Use'); await saveNow(); console.log('screen:', (await cardText()).slice(0, 300)); await store();
    const u = page.locator('button:has-text("Undo")').first(); if (await u.count()) { await u.click(); await page.waitForTimeout(1500); console.log('after Undo screen:', (await cardText()).slice(0, 300)); await shot('f8-L2-undo'); await store(); }
