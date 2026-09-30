    await seedHouse(); await page.evaluate(() => window.__rig.rules(true));
    await home(); await tap('.menu-btn', { wait: 500 }); await ui('menu'); await tap('.drawer-row:has-text("Places")', { wait: 800 }); await shot('places'); await ui('places');
    await page.locator('.loc-row:has-text("Kitchen counter")').first().click(); await page.waitForTimeout(700); await shot('kitchen counter page'); await ui('kitchen counter page');
    const html = await page.evaluate(() => document.querySelector('.screen') ? document.querySelector('.screen').innerHTML.replace(/src="data:[^"]+"/g, 'src=""').slice(0, 3000) : '');
    console.log('HTML', html);
