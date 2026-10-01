    // T: timings
    for (const [lab, delay, bad] of [['never', 120000, false], ['9s', 9000, false], ['garbled', 300, true]]) {
      await fresh(`T-${lab}`); if (bad) NEXT_WHERE_BADJSON = true;
      await shoot('real_desk.jpg', KCa, delay); await btn(/A different place/, 200); await S('t+~1s');
      await page.waitForTimeout(lab === '9s' ? 9500 : 4000); await S('later'); await shot(`f11-T-${lab}`);
      if (lab === 'never') { await pickPlace('Pantry shelf'); await btn(/^Use the/, 900); await S('after Use (still looking)'); await saveNow(); console.log('screen:', (await cardText()).slice(0, 220)); await store(); }
    }
    // BN cancel: backdrop from Before/Now; Back to the list then Cancel
    await fresh('BN backdrop'); await shoot('real_desk.jpg', KCa, 300); await btn(/A different place/, 1200); await pickPlace('Pantry shelf'); await S('BN');
    await page.mouse.click(195, 150); await page.waitForTimeout(800); await S('after backdrop on BN'); await shot('f11-BN-backdrop');
    await fresh('BN Back to the list, then Cancel'); await shoot('real_desk.jpg', KCa, 300); await btn(/A different place/, 1200); await pickPlace('Pantry shelf');
    await btn(/Back to the list/, 800); await S('back at list'); await shot('f11-BN-back-list'); await cancelChoose(); await S('after Cancel'); await saveNow(); await store();
    // Late answer after leaving the camera (Cancel camera) and after Save
    await fresh('L late answer after leaving camera via Cancel'); await shoot('real_desk.jpg', KCa, 4000); await btn(/A different place/, 300);
    await pickPlace('Pantry shelf'); await btn(/^Use the/, 600); await press('.lc-x'); await page.waitForTimeout(900); console.log('after camera Cancel:', await sheetText()); await shot('f11-L-cancel-camera');
    const leave = page.getByRole('button', { name: /Discard|Leave|Don.t save|Yes/i }).filter({ visible: true }).first(); if (await leave.count()) { console.log('   leaving via', await leave.innerText()); await leave.click(); await page.waitForTimeout(800); }
    await page.waitForTimeout(4000); console.log('screen:', (await cardText()).slice(0, 200)); await store();
    await fresh('L2 late answer after Save'); await shoot('real_desk.jpg', KCa, 5000); await btn(/A different place/, 300);
    await pickPlace('Pantry shelf'); await btn(/^Use the/, 600); await saveNow(); await page.waitForTimeout(4000); console.log('screen:', (await cardText()).slice(0, 200)); await store();
