    await seedHouse(); await page.evaluate(() => window.__rig.rules(true));
    const st = () => page.evaluate(() => ({ squares: [...document.querySelectorAll('.lv-strip .lv-sq:not(.plus)')].map((b) => b.getAttribute('aria-label') + (b.innerText ? '[' + b.innerText.replace(/\s+/g,' ') + ']' : '')), open: !!document.querySelector('.lc') }));
    const dbl = async (sel) => { const b = await page.locator(sel).first().boundingBox(); const x = b.x + b.width / 2, y = b.y + b.height / 2; await page.mouse.click(x, y); await page.waitForTimeout(60); await page.mouse.click(x, y); };
    const count = (nm) => page.evaluate((n) => window.__rig.dump().filter(x => x.kind === 'item' && !x.deleted && (x.name || '').toLowerCase() === n).length, nm);
    const pcount = (nm) => page.evaluate((n) => window.__rig.dump().filter(x => x.kind === 'place' && (x.name || '').toLowerCase() === n).length, nm);
    let whereCalls = 0; page.on('request', (r) => { if (/anthropic/.test(r.url()) && /MOVES:/.test(r.postData() || '')) whereCalls++; });
    // 1. double-tap the item shutter, + , place shutter, Use this name, Save
    await home(); await page.click(LOG); await page.waitForTimeout(900);
    AI = { name: 'doorstop' }; await cam('smallbox.jpg'); await dbl('.lc-shutter'); await page.waitForTimeout(1800);
    let s = await st(); console.log('after dbl item shutter', JSON.stringify(s), 'item photos badge'); await shot('dbl item shutter');
    await dbl('.lv-sq.plus'); await page.waitForTimeout(400); s = await st(); console.log('after dbl +', JSON.stringify(s)); if (await page.locator('.tier-sheet').count()) { console.log('dbl + opened the level sheet'); await tap('.tier-sheet .btn-quiet:has-text("Close")'); }
    check('D2', 'double-tap + adds one level', s.squares.length === 1, JSON.stringify(s.squares));
    WHERE.push({ name: 'porch', moves: false }); WHERE.push({ name: 'porch2', moves: false }); await cam('real_slippers.jpg'); const w0 = whereCalls; await dbl('.lc-shutter'); await page.waitForTimeout(3800);
    s = await st(); console.log('after dbl place shutter', JSON.stringify(s), 'where calls', whereCalls - w0); await shot('dbl place shutter');
    check('D2', 'double-tap shutter on a place level: one level, not two', s.squares.length === 1, JSON.stringify(s.squares));
    if (await page.locator('.wl-pend input').count()) { await page.locator('.wl-pend input').fill('Front porch'); await dbl('.wl-pend .btn-primary'); await page.waitForTimeout(700); }
    console.log('Front porch place docs so far', await pcount('front porch'));
    await dbl('.lc-k.sv'); await page.waitForTimeout(2500); await shot('dbl save');
    check('D2', 'double-tap Save: one item', (await count('doorstop')) === 1, `${await count('doorstop')} items`);
    check('D2', 'double-tap Save: one Front porch place', (await pcount('front porch')) === 1, `${await pcount('front porch')} places`);
    const fp = await page.evaluate(() => window.__rig.dump().find(x => x.kind === 'place' && x.name === 'Front porch')); console.log('Front porch photos', fp && (fp.photos || []).length);
    // 2. Move it: double-tap Save
    await page.click('.footer .btn-primary.alt'); await page.fill('#ask-input', 'doorstop'); await page.waitForTimeout(400); await page.locator('.ask .tile').first().click(); await page.waitForTimeout(500);
    const h0 = (await itemDoc('doorstop')).history.length;
    await tap('button:has-text("Move it")', { wait: 800 }); await tap('.lc-choose', { wait: 400 }); await page.locator('.wl-search input').fill('Pantry'); await page.waitForTimeout(250); await tap('.where-list .wl-row:has-text("Pantry shelf")', { wait: 400 });
    await dbl('.lc-k.sv'); await page.waitForTimeout(1500); await shot('after move dbl save'); await ui('after move dbl save'); if (await page.locator('button:has-text("Keep it")').count()) await tap('button:has-text("Keep it")');
    const h1 = (await itemDoc('doorstop')).history.length; console.log('history', h0, '->', h1, (await itemDoc('doorstop')).history.map(h => h.location));
    check('D2', 'Move it double-tap Save: one history line', h1 === h0 + 1, `${h0} -> ${h1}`);
    await page.waitForTimeout(8000);
    await tap('button:has-text("Move it")', { wait: 800 }); await tap('.lc-choose', { wait: 400 }); await page.locator('.wl-search input').fill('Linen'); await page.waitForTimeout(250); await tap('.where-list .wl-row:has-text("Linen closet")', { wait: 400 });
    await page.goBack().catch(() => {}); await page.waitForTimeout(800); await shot('browser back in camera'); s = await st(); console.log('after browser back', JSON.stringify(s), 'url', page.url());
    console.log('doorstop now', await chainOf('doorstop'));
    check('D2', 'browser/edge-swipe Back in the camera does not save the half-done move', (await chainOf('doorstop')) === 'doorstop > Pantry shelf', await chainOf('doorstop'));

    await home(); await tap('.tiny:has-text("Settings")', { wait: 700 }); const stxt = await bodyText(); console.log('Settings has "Recently removed"?', /Recently removed/i.test(stxt), '| menu has "Deleted items"'); await shot('settings');
