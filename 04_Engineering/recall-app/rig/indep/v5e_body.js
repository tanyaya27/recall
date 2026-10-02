    let s0;
    await fresh4('LP7u pure UI, one phone: put the BASEMENT place into the Cookie tin via its own page, then Log lamp In=Cookie tin + t2 Basement');
    // find a way to the Basement place page
    await home(); await page.click('.menu-btn').catch(() => {}); await page.waitForTimeout(600); console.log('   menu:', (await bodyText()).replace(/\s+/g, ' ').slice(0, 300));
    const pl = page.locator('.drawer-row').filter({ hasText: /Places/ }).first(); if (await pl.count()) { await pl.click(); await page.waitForTimeout(900); } else await home();
    console.log('   places screen:', (await bodyText()).replace(/\s+/g, ' ').slice(0, 400)); await shot('lp7u-places');
    const row = page.getByText('Basement', { exact: true }).first(); if (await row.count()) { await row.click(); await page.waitForTimeout(1000); }
    console.log('   basement page:', (await bodyText()).replace(/\s+/g, ' ').slice(0, 500)); await shot('lp7u-basement');
    const mv = page.getByRole('button', { name: /Move it|Put it|Move|Put .* in/ }).filter({ visible: true }); console.log('   move-ish buttons:', JSON.stringify(await mv.allInnerTexts()));
    if (await mv.count()) { await mv.first().click(); await page.waitForTimeout(1200); console.log('   after move tap:', (await bodyText()).replace(/\s+/g, ' ').slice(0, 300)); await shot('lp7u-move');
      if (await page.locator('.lc-shutter').count()) { await openIn(); const h = await listHas('Cookie tin'); console.log('   Basement In list offers Cookie tin?', h); if (h) { await pickIn('Cookie tin'); await card('basement in cookie'); s0 = await snapAll(); await doSave(); await msg(); await diffSnap(s0, 'basement->cookie'); await st4('B in CT', ['basement', 'cookie tin']); } else { await cancelList(); await leaveCam(); } }
      else { const inp = page.locator('.in-list input, .sheet input').last(); if (await inp.count()) { await srchT('Cookie'); if (await listHas('Cookie tin')) { await pickIn('Cookie tin'); await page.waitForTimeout(800); console.log('   after pick:', (await bodyText()).replace(/\s+/g, ' ').slice(0, 300)); await st4('B in CT', ['basement', 'cookie tin']); } } } }
    console.log('-- then Log lamp In=Cookie tin + t2 Basement');
    await logStart('lamp', 'real_desk.jpg'); await openIn(); await pickIn('Cookie tin'); await card('In'); if (await addTier()) { const has = await listHas('Basement'); console.log('   t2 offers Basement?', has); if (has) { await pickIn('Basement'); await card('LOOP7u'); await shot('lp7u-card'); s0 = await snapAll(); await doSave(); await shot('lp7u-after'); await msg(); await diffSnap(s0, 'LP7u save'); await st4('LP7u', ['lamp', 'cookie tin', 'basement']); } else await cancelList(); }
    if (await camOpen()) await leaveCam();
    await openItem('lamp'); await shot('lp7u-lamp-page'); console.log('   lamp page:', (await bodyText()).replace(/\s+/g, ' ').slice(0, 300));
    console.log('   ', errs());
