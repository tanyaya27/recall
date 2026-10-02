    await grant();
    const asU = async (uid) => { await page.evaluate((u) => { localStorage.setItem('rig-uid', u); const p = JSON.parse(localStorage.getItem('recall-prefs') || '{}'); p.whose = u === 'robert' ? 'margaret' : null; localStorage.setItem('recall-prefs', JSON.stringify(p)); }, uid); await page.waitForTimeout(500); await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen'); await page.waitForTimeout(1200); await page.evaluate(() => window.__rig.rules(true)); console.log('   now user', uid); };
    console.log('\n######## A1wk');
    await asU('robert'); await moveIt('yearbook 1978'); await setWords('bottom of the box, under the photos'); await doSave(); console.log('   ', errs());
    await raw('yearbook 1978'); await page.waitForTimeout(2000);
    await asU('margaret'); await moveIt('yearbook 1978'); await openIn(); await pickIn('Pantry shelf'); await doSave(); await raw('yearbook 1978');
    await undo('A1'); await shot('a1-after-undo'); await raw('yearbook 1978'); await pageWords('yearbook 1978', 'a1-page');
