    console.log('\n######## SN Save + Next');
    await logStart('egg timer', 'real_spoon.jpg'); await words('top shelf'); await openIn(); await pickIn('Tin box');
    await hold('.lc-k.sv', 1200); await page.waitForTimeout(1500); await ui('after hold'); await shot('sn-next-camera');
    console.log('CAM', await camText(), 'save', await saveState()); await dumpItem('egg timer');
    AI = { name: 'stapler' }; await cam('scissors.jpg'); await tap('.lc-shutter', { wait: 2000 }); console.log('CAM item2', await camText(), 'save', await saveState()); await shot('sn-item2');
    const u = page.locator('.lc button:has-text("Undo")').first(); console.log('undo in camera?', await u.count());
    if (await u.count()) { await u.click(); await page.waitForTimeout(1200); console.log('after camera undo:', await camText()); await shot('sn-undo'); await dumpItem('egg timer'); }
    await hold('.lc-k.sv', 1200); await page.waitForTimeout(1500); console.log('CAM after 2nd hold', await camText()); await shot('sn-next2');
    const u2 = page.locator('.lc button:has-text("Undo")').first(); console.log('undo in camera (2)?', await u2.count());
    if (await u2.count()) { await u2.click(); await page.waitForTimeout(1200); console.log('after camera undo 2:', await camText()); await shot('sn-undo2'); }
    await dumpItem('stapler'); await dumpItem('egg timer');
    await press('.lc-x'); await page.waitForTimeout(800); console.log('after cancel', (await bodyText()).replace(/\s+/g, ' ').slice(-200));
    const leave = page.locator('button:has-text("Leave")'); if (await leave.count()) { await leave.first().click(); await page.waitForTimeout(800); }
    await dumpItem('stapler'); await dumpItem('egg timer'); const d = await D(); console.log('snaps', d.filter(x => x.kind === 'snap').map(s => s.itemId + (s.deleted ? '(del)' : '')).join(','));
