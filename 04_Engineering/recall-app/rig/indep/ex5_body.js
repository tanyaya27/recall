    await seedHouse();
    await home(); await tap('.menu-btn', { wait: 500 }); await tap('.drawer-row:has-text("Text size")', { wait: 800 }); await shot('text size'); await ui('text size');
    console.log('prefs', await page.evaluate(() => localStorage.getItem('recall-prefs')));
