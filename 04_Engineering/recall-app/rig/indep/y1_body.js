    const placePage = async (nm) => { await home(); await page.click('.menu-btn'); await page.waitForTimeout(500); await page.click('.drawer-row:has-text("Places")'); await page.waitForTimeout(900); const r = page.locator('.loc-row').filter({ hasText: new RegExp('^' + nm + '(?![ a-z])', 'i') }).first(); if (!(await r.count())) { console.log('   NO PLACE ROW', nm); return false; } await r.click(); await page.waitForTimeout(900); return true; };
    const sheetRows = async () => page.evaluate(() => { const s = [...document.querySelectorAll('.sheet')].pop(); return s ? [...s.querySelectorAll('.wl-row')].map(r => r.innerText.replace(/\s+/g, ' ')).join(' | ') : '(no sheet)'; });
    const pickR = async (nm) => { const l = page.locator('.sheet .wl-row').filter({ has: page.locator(`b:text-is("${nm}")`) }).last(); if (!(await l.count())) { console.log('   NOT OFFERED:', nm); return false; } await l.scrollIntoViewIfNeeded(); await l.click(); await page.waitForTimeout(1200); console.log('   picked', nm); return true; };
    const PP = async () => console.log('   PAGE:', (await bodyText()).replace(/\s+/g, ' ').replace(/^.*?Where this place is/, 'Where:').slice(0, 300));
    { const now = Date.now(); await page.evaluate((s) => window.__rig.seed(s), [{ id: 'pG', kind: 'place', owner: 'margaret', by: 'margaret', private: false, name: 'Garage', order: now, createdAt: now, parent: null, photos: [] }]); await page.reload(); await page.waitForTimeout(800); await page.evaluate(() => window.__rig.rules(true)); }
    console.log('\n######## Y1 Garage page (seed has NO Garage place doc)');
    await placePage('Garage'); await PP(); await shot('y1-garage');
    const ma = page.locator('.pl-all'); console.log('   move-all', await ma.count());
    if (await ma.count()) { await ma.click(); await page.waitForTimeout(800); console.log('   ROWS:', (await sheetRows()).slice(0, 700)); await shot('y1-moveall-sheet'); await pickR('Tool drawer'); await shot('y1-after'); await PP(); }
    await raw('tool drawer'); await raw('tin box'); await raw('shoe rack'); await placeEdges(); console.log('   chain tool drawer:', await chainOf('tool drawer'), '| tin box:', await chainOf('tin box'));
    await openItem('tool drawer'); console.log('   TOOL DRAWER PAGE:', (await bodyText()).replace(/\s+/g, ' ').slice(0, 400)); await shot('y1-tooldrawer-page');
    await home(); console.log('   HOME:', (await bodyText()).replace(/\s+/g, ' ').slice(0, 300));
    const ub = page.locator('button:has-text("Undo")').filter({ visible: true }); console.log('   undo visible', await ub.count());
    console.log('\n######## Y1b row Move: Garage -> tin box row Move -> Tool drawer?');
    await placePage('Garage'); await PP(); const rm = page.locator('.pl-move'); console.log('   row moves', await rm.count());
    console.log('   ', errs());
