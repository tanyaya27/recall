    // V: viewer remove after adds
    await fresh('V add x2 then remove one in the viewer');
    await shoot('real_desk.jpg'); await btn(/Another photo of the Wooden box/, 1200); await shoot('closet.jpg'); await S('2 adds');
    await tapSq(1); console.log('sq sheet:', await sheetText()); await btn(/See its photos/, 900); await S('viewer'); await shot('f10-V-viewer');
    console.log('viewer:', await sheetText('.d2-pv'));
    console.log('viewer btns:', await page.evaluate(() => [...document.querySelectorAll('.d2-pv button')].map(b => b.className + ':' + (b.getAttribute('aria-label') || b.innerText)).join(' | ')));
    const rm = page.locator('.d2-pv button').filter({ hasText: /Remove/i }).first();
    if (await rm.count() && (await rm.click().then(() => true).catch(() => false))) { await page.waitForTimeout(700); await S('after Remove tap'); console.log('confirm?', await sheetText()); await shot('f10-V-remove-ask'); const yes = page.getByRole('button', { name: /^Remove/ }).filter({ visible: true }).last(); if (await yes.count()) { await yes.click(); await page.waitForTimeout(800); } }
    await S('after remove'); await page.keyboard.press('Escape'); const x = page.locator('.d2-pv button[aria-label*="Close" i], .d2-pv .x, .d2-pv button:has-text("✕")').first(); if (await x.count()) { await x.click(); await page.waitForTimeout(600); }
    await closeSheetRow(); await S('back in camera'); await shot('f10-V-after');
    await shoot('box.jpg'); await S('shoot after viewer'); await shot('f10-V-shoot-after');
    if (await page.locator('.photo-for').count()) await btn(/Retake/);
    await saveNow(); console.log('screen:', (await cardText()).slice(0, 300)); await store();
    // U: Undo of add-only
    const u = page.locator('button:has-text("Undo")').first(); if (await u.count()) { await u.click(); await page.waitForTimeout(1500); console.log('after Undo screen:', (await cardText()).slice(0, 300)); await store(); }
    // K: sticky survives Choose-place cancel?
    await fresh('K sticky add on L1, open Choose place via button, Cancel, shoot');
    await shoot('real_desk.jpg'); await btn(/Another photo of the Wooden box/, 1200); await S('added');
    await tap('.lc-choose', { wait: 900 }); await cancelChoose(); await S('after Choose cancel'); await shoot('closet.jpg'); await S('shot after cancel');
    if (await page.locator('.photo-for').count()) await btn(/Retake/);
    // + : sticky after tapping + then back
    await tap('.lv-sq.plus', { wait: 700 }); await S('after +'); await shot('f10-plus'); await shoot('real_painting.jpg', { name: 'attic' }, 300); await S('shot on new + tier'); await shot('f10-plus-shot'); console.log('sheet:', await sheetText());
    await cancelChoose(); await S('after cancel on + tier');
    await tapSq(1); await closeSheetRow(); await S('L1 again'); await shoot('closet.jpg'); await S('L1 shot after + -> ask?');
