    await fresh('W1 BN viewer + late answer behind sheet'); await shoot('real_desk.jpg', KCa, 300); await btn(/A different place/, 1500); await S('choose'); await pickPlace('Pantry shelf');
    await page.locator('.bn .bn-ph').nth(1).click(); await page.waitForTimeout(800); await shot('fw-bn-viewer'); const vg = await page.evaluate(() => { const v = document.querySelector('.d2-pv'); const r = v.getBoundingClientRect(); return [r.top, r.bottom, innerHeight]; }); console.log('viewer rect', JSON.stringify(vg));
    await page.locator('.d2-pv .d2-x').click(); await page.waitForTimeout(500); await btn(/^Use the/, 900); await S('after Use'); await saveNow(); console.log('screen:', (await cardText()).slice(0, 200)); await store();
    await fresh('W2 guess prefill then type'); await shoot('real_desk.jpg', { name: 'hall closet' }, 300); await btn(/A different place/, 1500);
    await page.locator('input.place-input').first().click(); await page.keyboard.type('Attic', { delay: 100 }); await S('typed'); await shot('fw-prefill-append');
    await fresh('W3 sticky'); await shoot('real_desk.jpg'); await btn(/Another photo of the Wooden box/, 1200); await shoot('closet.jpg'); await S('2 adds'); await shot('fw-sticky');
    await saveNow(); console.log('screen:', (await cardText()).slice(0, 200)); await store();
    await page.setViewportSize({ width: 375, height: 667 }); await home(); await tap('.menu-btn', { wait: 500 }); await tap('.drawer-row:has-text("Text size")', { wait: 600 }); await tap('button:text-is("Largest")', { wait: 400 });
    await openItem('baseball card'); await noAuto(); await tap('button:has-text("Move it")', { wait: 1000 }); await shoot('real_desk.jpg'); await shot('fw-XL-modal');
