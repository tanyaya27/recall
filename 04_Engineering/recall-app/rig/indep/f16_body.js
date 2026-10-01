    await fresh('O5b stale suggestion -> tap it -> Use -> Save');
    WHERE.push(KCa, { name: 'zz' }); NEXT_WHERE_DELAY = 4000; await cam('real_desk.jpg'); await shutter(); await page.waitForTimeout(700);
    await btn(/A different place/, 500); await cancelChoose();
    await shoot('closet.jpg'); await btn(/A different place/, 800); await shot('f16-before-stale'); await page.waitForTimeout(4500); await shot('f16-stale-suggestion');
    await page.locator('.wl-sugg').first().click(); await page.waitForTimeout(800); console.log('BN:', await sheetText()); await shot('f16-stale-bn');
    await btn(/^Use the/, 900); await S('after Use'); await saveNow(); console.log('screen:', (await cardText()).slice(0, 220));
    const kc = await page.evaluate(() => { const p = window.__rig.dump().find(x => x.kind === 'place' && x.name === 'Kitchen counter'); return (p.photos || []).map(ph => ph.photo.length).join(','); });
    console.log('Kitchen counter photo sizes', kc); await store();
