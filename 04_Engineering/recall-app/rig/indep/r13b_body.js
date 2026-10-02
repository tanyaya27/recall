    await page.evaluate(() => localStorage.setItem('rig-uid', 'robert')); await page.reload(); await page.waitForTimeout(2500); await shot('robert-landing'); await ui('robert landing');
    console.log('LS keys', await page.evaluate(() => Object.keys(localStorage).join(',')));
