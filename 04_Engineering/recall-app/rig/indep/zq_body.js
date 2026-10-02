    await home(); await page.click('.menu-btn'); await page.waitForTimeout(500); await page.click('.drawer-row:has-text("Places")'); await page.waitForTimeout(900); await ui('places'); await shot('q-places');
    console.log(JSON.stringify(await page.locator('.loc-row').allInnerTexts()));
