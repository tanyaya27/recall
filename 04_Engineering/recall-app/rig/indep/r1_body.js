    await page.evaluate(() => window.__rig.rules(true));
    await home(); await shot('home'); await ui('home');
    // menu
    const menu = page.locator('button[aria-label*="enu"], .hamb, header button').first(); await menu.click().catch(()=>{}); await page.waitForTimeout(600); await ui('menu'); await shot('menu');
    await page.keyboard.press('Escape'); await home();
    await page.click(LOG); await page.waitForTimeout(1000); await ui('camera-before'); await shot('cam-before');
    AI = { name: 'blue folder' }; await cam('folder.jpg'); await tap('.lc-shutter', { wait: 2000 }); await ui('cam-after-shot'); await shot('cam-after-shot');
    console.log(await HTML('.lc, .lc-b'));
