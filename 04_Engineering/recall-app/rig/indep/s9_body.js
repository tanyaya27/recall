    await seedHouse(); await page.evaluate(() => window.__rig.rules(true));
    const V = process.env.V || 'd';
    const g = async (l) => { try { await home(); console.log('ok', l); } catch (e) { console.log('CRASH at', l, e.message.slice(0, 60)); throw e; } };
    // make a box by Log (photo level), no rename
    await home(); await page.click(LOG); await page.waitForTimeout(900);
    AI = { name: 'blue scissors' }; await cam('scissors.jpg'); await tap('.lc-shutter', { wait: 1800 });
    await tap('.lv-sq.plus', { wait: 500 }); WHERE.push({ name: 'white box', moves: true }); await cam('box.jpg'); await tap('.lc-shutter', { wait: 3800 });
    await page.locator('.wl-pend input').fill('White shoebox'); await tap('.wl-pend .btn-primary', { wait: 600 }); await tap('.lc-k.sv', { wait: 2500 });
    await g('after log');
    if (V === 'd' || V === 'e') { await page.click('.footer .btn-primary.alt'); await page.fill('#ask-input', 'White shoebox'); await page.waitForTimeout(400); await page.locator('.ask .tile').first().click(); await page.waitForTimeout(500);
      await tap('.tp-row:has-text("Rename")', { wait: 500 }); await page.locator('.sheet input').first().fill('Shoebox'); await tap('.sheet .btn-primary', { wait: 800 }); await g('after rename'); }
    if (V === 'd') { await tap('.menu-btn', { wait: 500 }); await tap('.drawer-row:has-text("Places")', { wait: 800 }); await g('after places list');
      await tap('.menu-btn', { wait: 500 }); await tap('.drawer-row:has-text("Places")', { wait: 800 }); await page.locator('.loc-row:has-text("White shoebox")').click(); await page.waitForTimeout(700); console.log('ghost page open'); await g('after ghost page'); }
    if (V === 'e') { await g('again1'); await g('again2'); await g('again3'); }
