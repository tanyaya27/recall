    const words = async (s) => { const i = page.locator('.w1-words input').first(); await i.click(); await page.keyboard.type(s, { delay: 20 }); await page.waitForTimeout(400); };
    const openIn = async () => { await page.locator('.w1-in').first().click(); await page.waitForTimeout(800); };
    const dumpItem = async (nm) => { const d = await page.evaluate(() => window.__rig.dump()); const it = d.find(x => x.kind === 'item' && !x.deleted && (x.name||'').toLowerCase() === nm.toLowerCase()); if (!it) { console.log('NO ITEM', nm); return; }
      const e = d.filter(x => x.kind === 'edge' && x.from === it.id); console.log(`ITEM ${nm}: id=${it.id} loc="${it.location}" photos=${it.photoCount}/${(it.photos||[]).length} needsPlace=${it.needsPlace} by=${it.by}\n  history=${JSON.stringify(it.history)}\n  edges=${JSON.stringify(e.map(x => ({ to: x.to, since: x.since, until: x.until, by: x.by })))}`); return it; };
    await page.evaluate(() => window.__rig.rules(true));
    await logStart('egg timer', 'real_spoon.jpg');
    await words('in the tin box on the kitchen counter');
    await shot('words-typed');
    await openIn(); await shot('in-sheet'); await ui('in-sheet');
    console.log(await HTML('.sheet, [role=dialog]'));
