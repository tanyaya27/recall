    // A: non-match guess + backdrop
    await fresh('A non-match guess "zz" then backdrop close');
    await shoot('real_desk.jpg', { name: 'zz' }, 300); await btn(/A different place/, 1200); await S('choose');
    await page.mouse.click(195, 80); await page.waitForTimeout(800); await S('after backdrop'); await shot('f9-A-after-backdrop');
    await saveNow(); await store();
    // B: guess lands while she types (non-match), and lands BEFORE she types
    await fresh('B1 guess "hall closet" lands at 1.2s while typing "Attic trunk"');
    await shoot('real_desk.jpg', { name: 'hall closet' }, 1200); await btn(/A different place/, 150);
    await page.locator('input.place-input').first().click(); await page.keyboard.type('Attic trunk', { delay: 200 }); await page.waitForTimeout(800); await S('typed'); await shot('f9-B1-typed');
    await fresh('B2 guess lands at 0.3s, then she taps the field and types');
    await shoot('real_desk.jpg', { name: 'hall closet' }, 300); await btn(/A different place/, 1500); await S('guess in');
    await page.locator('input.place-input').first().click(); await page.keyboard.type('Attic', { delay: 100 }); await S('typed'); await shot('f9-B2-typed');
    // C: Photograph a new place, from Choose place on L1
    await fresh('C Photograph a new place (L1)');
    await tap('.lc-choose', { wait: 900 }); await btn(/Photograph a new place/, 900); await S('after Photograph a new place'); await shot('f9-C-pin-shutter');
    await shoot('real_painting.jpg', { name: 'zz2' }, 300); await S('after shot'); await shot('f9-C-after-shot');
    console.log('sheet:', await sheetText());
