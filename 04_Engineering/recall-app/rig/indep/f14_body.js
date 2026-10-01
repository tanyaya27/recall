    await seedHouse(); await page.evaluate(() => window.__rig.rules(true)); await noAuto();
    await home(); await noAuto(); await page.click(LOG); await page.waitForTimeout(900); await noAuto();
    AI = { name: 'egg timer' }; await cam('real_spoon.jpg'); await press('.lc-shutter'); await page.waitForTimeout(2500);
    await S('log after item shot'); await shot('f14-log-1');
    await tap('.lv-sq.plus', { wait: 700 }); await S('log after +'); await shot('f14-log-plus');
    await shoot('real_desk.jpg', KCa, 2000); await S('log place shot'); await shot('f14-log-2'); console.log('sheet:', await sheetText());
    if (await page.locator('.photo-for').count()) { await btn(/Another photo/, 1000); await S('another'); }
    else { await page.waitForTimeout(2500); await S('choose after answer'); await shot('f14-log-3');
      const sg = page.locator('.wl-sugg').first(); if (await sg.count() && await sg.evaluate(e => e.tagName === 'BUTTON')) { await sg.click(); await page.waitForTimeout(800); console.log('BN:', await sheetText()); await shot('f14-log-bn'); await btn(/^Use the/, 1000); } }
    await S('after use'); await shot('f14-after-use'); await shoot('closet.jpg'); await S('2nd place shot (sticky?)'); await shot('f14-log-4'); console.log('sheet:', await sheetText());
    if (await page.locator('.photo-for').count()) { await btn(/Another photo/, 1000); await S('another'); }
    await tapSq(1); await closeSheetRow(); await shoot('box.jpg'); await S('3rd shot after tapping L1'); console.log('sheet:', await sheetText()); if (await page.locator('.photo-for').count()) await btn(/Retake/);
    await saveNow(); console.log('screen:', (await cardText()).slice(0, 300)); await shot('f14-log-saved');
    console.log(await store('egg timer'));
