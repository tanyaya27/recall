    const placePage = async (nm) => { await home(); await page.click('.menu-btn'); await page.waitForTimeout(500); await page.click('.drawer-row:has-text("Places")'); await page.waitForTimeout(900); const r = page.locator('.loc-row').filter({ hasText: new RegExp('^' + nm + '(?![ a-z])', 'i') }).first(); if (!(await r.count())) { console.log('   NO PLACE ROW', nm); return false; } await r.click(); await page.waitForTimeout(900); return true; };
    const sheetRows = async () => page.evaluate(() => { const s = [...document.querySelectorAll('.sheet')].pop(); return s ? [...s.querySelectorAll('.wl-row')].map(r => r.innerText.replace(/\s+/g, ' ')).join(' | ') : '(no sheet)'; });
    const pickR = async (nm) => { const l = page.locator('.sheet .wl-row').filter({ has: page.locator(`b:text-is("${nm}")`) }).first(); if (!(await l.count())) { console.log('   NOT OFFERED:', nm); return false; } await l.click(); await page.waitForTimeout(1500); console.log('   picked', nm); return true; };
    const PP = async () => console.log('   PAGE:', (await bodyText()).replace(/\s+/g, ' ').replace(/^.*?Where this place is/, 'Where:').slice(0, 300));
    await grant();
    console.log('\n######## MA setup: tin box + reading glasses into Kitchen counter');
    await moveIt('tin box'); await openIn(); await pickIn('Kitchen counter'); await doSave(); await moveIt('reading glasses'); await openIn(); await pickIn('Kitchen counter'); await doSave();
    console.log('\n######## MA1 Kitchen counter: Move all -> Kitchen counter (itself)');
    await placePage('Kitchen counter'); await PP(); await page.locator('.pl-all').click(); await page.waitForTimeout(800); console.log('   ROWS:', (await sheetRows()).slice(0, 300)); await shot('ma-sheet');
    await pickR('Kitchen counter'); await shot('ma1-after'); await PP(); await raw('reading glasses'); await raw('tin box'); await raw('spare batteries');
    console.log('\n######## MA2 Kitchen counter: Move all -> Tin box (a box that is in it)');
    await placePage('Kitchen counter'); await page.locator('.pl-all').click(); await page.waitForTimeout(800); await pickR('Tin box'); await shot('ma2-after'); await PP(); await raw('reading glasses'); await raw('tin box'); await raw('spare batteries'); await placeEdges(); console.log('   chain tin', await chainOf('tin box'), '| glasses', await chainOf('reading glasses'));
    console.log('\n######## S14 stale Undo');
    await moveIt('wallet'); await openIn(); await pickIn('Garage shelf'); await doSave(); console.log('   undo visible', await undoCount()); const tb = await raw('wallet');
    await page.evaluate((id) => { const d = window.__rig.dump(); const it = d.find(x => x.id === id); const t = Date.now(); const edges = d.filter(x => x.kind === 'edge' && x.from === id && !x.until).map(e => ({ ...e, until: t }));
      const { id: _i, ...rest } = it; window.__rig.seed([{ id, ...rest, location: 'Linen closet', lastSeenAt: t, updatedAt: t, history: [...(it.history || []), { location: 'Linen closet', at: t, w: 1, said: 'in the linen closet, top', by: 'robert' }] }, ...edges, { id: 'eR' + t, kind: 'edge', rel: 'in', from: id, to: { t: 'place', name: 'Linen closet' }, since: t, until: null, how: 'chosen', owner: 'margaret', by: 'robert', private: false, roles: {}, sharedWith: [] }]); }, tb.id);
    await page.waitForTimeout(1200); console.log('   page after Robert change:', (await bodyText()).replace(/\s+/g, ' ').slice(0, 300), '| undo', await undoCount()); await shot('s14-before-undo'); await raw('wallet');
    if (await undoCount()) { await undo('stale'); await shot('s14-after-undo'); await raw('wallet'); await pageWords('wallet', 's14-page'); }
    console.log('   ', errs());
