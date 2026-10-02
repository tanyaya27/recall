    let s0;
    await fresh4('LP7v place page "Where this place is" -> can a place go into a box via UI?');
    await home(); await page.click('.menu-btn'); await page.waitForTimeout(600); await page.locator('.drawer-row').filter({ hasText: /Places/ }).first().click(); await page.waitForTimeout(900);
    await page.getByText('Basement', { exact: true }).first().click(); await page.waitForTimeout(1000);
    const w = page.getByText(/Where this place is/).first(); console.log('   where row', await w.count());
    const cands = page.locator('button, [role=button]').filter({ hasText: /Not said|Where this place is/ }); console.log('   tappables:', JSON.stringify(await cands.allInnerTexts()));
    if (await cands.count()) await cands.first().click(); else await page.getByText('Not said').first().click().catch(() => {});
    await page.waitForTimeout(1000); await shot('lp7v-where'); const t = await sheetText('.in-list, .sheet'); console.log('   list:', t.slice(0, 500));
    const hasCT = (await page.locator('.wl-row').filter({ has: page.locator('b:text-is("Cookie tin")') }).count()); console.log('   offers Cookie tin (a box)?', hasCT);
    if (hasCT) { s0 = await snapAll(); await page.locator('.wl-row').filter({ has: page.locator('b:text-is("Cookie tin")') }).first().click(); await page.waitForTimeout(1200); console.log('   after pick:', (await bodyText()).replace(/\s+/g, ' ').slice(0, 300)); const sv = page.getByRole('button', { name: /^Save|Use|Done/ }).filter({ visible: true }); if (await sv.count()) { await sv.first().click(); await page.waitForTimeout(1200); } await diffSnap(s0, 'basement->ct'); await st4('B in CT', ['basement', 'cookie tin']);
      await logStart('lamp', 'real_desk.jpg'); await openIn(); await pickIn('Cookie tin'); if (await addTier()) { const has = await listHas('Basement'); console.log('   t2 offers Basement (which is inside the In)?', has); if (has) { await pickIn('Basement'); await card('LOOP'); await shot('lp7v-card'); s0 = await snapAll(); await doSave(); await shot('lp7v-after'); await msg(); await diffSnap(s0, 'LP7v save'); await st4('LP7v', ['lamp', 'cookie tin', 'basement']); } else await cancelList(); }
      if (await camOpen()) await leaveCam(); }
    console.log('   ', errs());
