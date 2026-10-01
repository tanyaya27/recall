    await page.setViewportSize({ width: 375, height: 667 });
    await seedHouse(); await page.evaluate(() => window.__rig.rules(true)); await noAuto();
    await home(); await tap('.menu-btn', { wait: 500 }); await tap('.drawer-row:has-text("Text size")', { wait: 600 }); await tap('button:text-is("Largest")', { wait: 400 });
    await openItem('baseball card'); await noAuto(); await tap('button:has-text("Move it")', { wait: 1000 });
    await shoot('real_desk.jpg', KCa, 300); await shot('f13-XL-L1-modal'); await btn(/A different place/, 1200); await pickPlace('White cardboard box');
    const g = await page.evaluate(() => { const s = document.querySelector('.bn'); const r = s.getBoundingClientRect(); const cs = getComputedStyle(s); const b = s.querySelector('.btn-primary').getBoundingClientRect(); return { top: r.top, bottom: r.bottom, sh: s.scrollHeight, ch: s.clientHeight, ov: cs.overflowY, use: [b.top, b.bottom], vh: innerHeight }; });
    console.log('BN geometry', JSON.stringify(g)); await shot('f13-XL-bn-long');
    await page.mouse.move(187, 500); await page.mouse.wheel(0, 400); await page.waitForTimeout(500); await shot('f13-XL-bn-scrolled');
    console.log('after wheel use btn', JSON.stringify(await aboveKb('.bn .btn-primary', 0)), JSON.stringify(await aboveKb('.bn .btn-secondary', 0)));
