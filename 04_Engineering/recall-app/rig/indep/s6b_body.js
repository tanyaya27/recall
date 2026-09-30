    await seedHouse(); await page.evaluate(() => window.__rig.rules(true));
    const cards = () => page.evaluate(() => [...document.querySelectorAll('button')].filter(b => /^Undo$/.test(b.innerText.trim())).map((u) => u.parentElement.innerText.replace(/\s+/g, ' ').slice(0, 50)));
    for (const [pauseCam, label] of [[6000, 'camera open 6 s'], [12000, 'camera open 12 s']]) {
      await home(); await page.click(LOG); await page.waitForTimeout(900);
      AI = { name: 'eraser ' + pauseCam }; await cam('keys.jpg'); await tap('.lc-shutter', { wait: 1800 });
      await tap('.lv-sq.plus', { wait: 300 }); await tap('.lc-choose', { wait: 400 }); await page.locator('.wl-search input').fill('Linen'); await page.waitForTimeout(250); await tap('.where-list .wl-row:has-text("Linen closet")', { wait: 400 });
      await tap('.lc-k.sv', { wait: 300 }); const t0 = Date.now();
      await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', 'eraser ' + pauseCam); await page.waitForTimeout(350); await page.locator('.ask .tile').first().click(); await page.waitForTimeout(400);
      await tap('button:has-text("Move it")', { wait: 800 }); await page.waitForTimeout(pauseCam);
      await tap('.lc-choose', { wait: 400 }); await page.locator('.wl-search input').fill('Pantry'); await page.waitForTimeout(250); await tap('.where-list .wl-row:has-text("Pantry shelf")', { wait: 400 });
      await tap('.lc-k.sv', { wait: 400 }); console.log(label, ((Date.now() - t0) / 1000).toFixed(1), 's after log save, cards:', JSON.stringify(await cards()));
      await shot(label);
    }
