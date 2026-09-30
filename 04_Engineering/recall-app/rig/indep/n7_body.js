    await seedHouse(); await page.evaluate(() => window.__rig.rules(true));
    const openItem = async (nm) => { await home(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', nm); await page.waitForTimeout(450); await page.locator('.ask .tile').filter({ hasText: new RegExp(nm, 'i') }).first().click(); await page.waitForSelector('.card.thing'); await page.waitForTimeout(400); };
    const priv = (nm) => page.evaluate((n) => { const x = window.__rig.dump().find(d => d.kind === 'item' && !d.deleted && (d.name||'').toLowerCase() === n); return x ? x.private : 'GONE'; }, nm);
    await home(); await tap('.tiny:has-text("Settings")', { wait: 700 }); await ui('settings'); await shot('settings');
    // toggle private on wallet
    await openItem('wallet'); await tap('button.sw:has-text("Keep this private"), button[aria-label="Keep this private"]', { wait: 600 }); await ui('wallet after private'); await shot('wallet private');
    console.log('wallet private =', await priv('wallet'));
    await home(); await shot('home wallet private'); const lock = await page.evaluate(() => { const t = [...document.querySelectorAll('.tile')].find(x => /Wallet/.test(x.innerText)); return t ? t.innerHTML.replace(/src="data:[^"]+"/g,'').slice(0, 600) : 'no tile'; }); console.log('wallet tile html', lock);
    // Log an item the AI says is private
    await page.click(LOG); await page.waitForTimeout(900); AI = { name: 'bank statement', private: true, privateWhy: 'bank details' }; await cam('folder.jpg'); await tap('.lc-shutter', { wait: 1800 }); await ui('private item shot'); await shot('private item shot');
    await tap('.lv-sq.plus', { wait: 400 }); await tap('.lc-choose', { wait: 400 }); await page.locator('.wl-search input').fill('Desk'); await page.waitForTimeout(250); await tap('.where-list .wl-row:has-text("Desk drawer")', { wait: 400 });
    await tap('.lc-k.sv', { wait: 1200 }); await ui('private saved card'); await shot('private saved card'); console.log('bank statement private =', await priv('bank statement'));
    // secret typed into a name
    await openItem('reading glasses'); await tap('.tp-row:has-text("Rename")', { wait: 500 }); await page.locator('.sheet input').first().fill('PIN 4821 glasses'); await shot('secret rename'); console.log('secret rename sheet text:', (await page.locator('.sheet').innerText()).replace(/\s+/g,' ')); await page.keyboard.press('Escape'); await page.waitForTimeout(300); await ui('after secret rename'); await shot('after secret rename');
    console.log('glasses doc name:', (await page.evaluate(() => window.__rig.dump().filter(d => d.kind === 'item' && /glasses/i.test(d.name || '')).map(d => d.name))));
    // Find screen probes
    await home(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask');
    for (const q of ['desk drawer', 'garage', 'memorabilia', 'glases', 'zzqx', 'the wallet', 'bank']) { await page.fill('#ask-input', q); await page.waitForTimeout(600); console.log(`FIND "${q}":`, (await page.locator('.ask').innerText()).replace(/\s+/g, ' ').slice(0, 300)); }
    await shot('find bank'); await page.fill('#ask-input', 'zzqx'); await page.waitForTimeout(500); await ui('find no match'); await shot('find no match');
    const fi = page.locator('button:has-text("Find it")'); if (await fi.count()) { await fi.first().click(); await page.waitForTimeout(1500); await ui('after Find it'); await shot('after find it'); }
