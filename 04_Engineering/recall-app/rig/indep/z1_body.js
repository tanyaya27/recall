    const placePage = async (nm) => { await home(); await page.click('.menu-btn'); await page.waitForTimeout(500); await page.click('.drawer-row:has-text("Places")'); await page.waitForTimeout(900); const r = page.locator('.loc-row').filter({ hasText: new RegExp('^' + nm + '(?![ a-z])', 'i') }).first(); if (!(await r.count())) { console.log('   NO PLACE ROW', nm); return false; } await r.click(); await page.waitForTimeout(900); return true; };
    const sheetFull = async () => page.evaluate(() => { const s = [...document.querySelectorAll('.sheet')].pop(); return s ? s.innerText.replace(/\n+/g, ' / ') : '(no sheet)'; });
    const sheetRows = async () => page.evaluate(() => { const s = [...document.querySelectorAll('.sheet')].pop(); return s ? [...s.querySelectorAll('.wl-row')].map(r => r.innerText.replace(/\s+/g, ' ')).join(' | ') : '(no sheet)'; });
    const pickR = async (nm) => { const l = page.locator('.sheet .wl-row').filter({ has: page.locator(`b:text-is("${nm}")`) }).first(); if (!(await l.count())) { console.log('   NOT OFFERED:', nm); return false; } await l.click(); await page.waitForTimeout(1500); console.log('   picked', nm); return true; };
    const PP = async () => console.log('   PAGE:', (await bodyText()).replace(/\s+/g, ' ').replace(/^.*?Where this place is/, 'Where:').slice(0, 300));
    await grant();
    console.log('\n######## V2 setup: tin box + reading glasses into Kitchen counter (makes both Recent)');
    await moveIt('tin box'); await openIn(); await pickIn('Kitchen counter'); await doSave(); await moveIt('reading glasses'); await openIn(); await pickIn('Kitchen counter'); await doSave();
    await moveIt('wallet'); await openIn(); await pickIn('Tin box'); await doSave(); await raw('wallet');
    const before = await cnt(); console.log('COUNTS', before);
    console.log('\n######## V2 Kitchen counter: Move all sheet');
    await placePage('Kitchen counter'); await PP(); await page.locator('.pl-all').click(); await page.waitForTimeout(800);
    const full = await sheetFull(); console.log('   SHEET:', full.slice(0, 900)); await shot('v2-moveall-sheet');
    const rows = await sheetRows(); console.log('   ROWS:', rows.slice(0, 900));
    const rowNames = await page.evaluate(() => { const s = [...document.querySelectorAll('.sheet')].pop(); return [...s.querySelectorAll('.wl-row b')].map(b => b.innerText.trim()); }); console.log('   ROW NAMES:', JSON.stringify(rowNames));
    console.log('   offers Kitchen counter?', rowNames.includes('Kitchen counter'), '| Tin box?', rowNames.includes('Tin box'));
    for (const q of ['kitchen', 'tin']) { await srch(q); const rn = await page.evaluate(() => { const s = [...document.querySelectorAll('.sheet')].pop(); return [...s.querySelectorAll('.wl-row b')].map(b => b.innerText.trim()); }); console.log(`   search ${q} rows`, JSON.stringify(rn)); }
    await shot('v2-search-tin');
    const k1 = await pickR('Kitchen counter'); const k2 = k1 ? false : await pickR('Tin box'); await shot('v2-after');
    await raw('reading glasses'); await raw('tin box'); await raw('wallet'); console.log('COUNTS after', await cnt());
    await cancelChoose().catch(() => {}); await page.keyboard.press('Escape');
    console.log('\n######## V2c row Move from Kitchen counter: tin box row -> itself / Kitchen counter?');
    await placePage('Kitchen counter'); const rm = page.locator('.pl-move'); console.log('   row moves', await rm.count(), await page.locator('.pl-move').evaluateAll(a => a.map(b => b.closest('*:not(button)') ? b.parentElement.innerText.replace(/\s+/g,' ').slice(0,60) : '')));
    if (await rm.count()) { await rm.first().click(); await page.waitForTimeout(800); const rn = await page.evaluate(() => { const s = [...document.querySelectorAll('.sheet')].pop(); return s ? [...s.querySelectorAll('.wl-row b')].map(b => b.innerText.trim()) : []; }); console.log('   ROW-MOVE sheet names', JSON.stringify(rn)); await shot('v2c-rowmove'); await cancelChoose().catch(() => {}); await page.keyboard.press('Escape'); }
    console.log('\n######## V1 stale Undo');
    await moveIt('reading glasses'); await openIn(); await pickIn('Garage shelf'); await doSave(); console.log('   undo visible', await undoCount()); const tb = await raw('reading glasses');
    await page.evaluate((id) => { const d = window.__rig.dump(); const it = d.find(x => x.id === id); const t = Date.now(); const edges = d.filter(x => x.kind === 'edge' && x.from === id && !x.until).map(e => ({ ...e, until: t }));
      const { id: _i, ...rest } = it; window.__rig.seed([{ id, ...rest, location: 'Linen closet', lastSeenAt: t, updatedAt: t, history: [...(it.history || []), { location: 'Linen closet', at: t, w: 1, said: 'in the linen closet, top', by: 'robert' }] }, ...edges, { id: 'eR' + t, kind: 'edge', rel: 'in', from: id, to: { t: 'place', name: 'Linen closet' }, since: t, until: null, how: 'chosen', owner: 'margaret', by: 'robert', private: false, roles: {}, sharedWith: [] }]); }, tb.id);
    await page.waitForTimeout(1200); console.log('   page after Robert change:', (await bodyText()).replace(/\s+/g, ' ').slice(0, 300), '| undo', await undoCount()); await shot('v1-before-undo'); const s0 = await raw('reading glasses');
    if (await undoCount()) { await undo('stale'); await shot('v1-after-undo'); const s1 = await raw('reading glasses'); console.log('   STORE UNCHANGED BY STALE UNDO?', JSON.stringify(s0) === JSON.stringify(s1)); await placeEdges(); }
    console.log('\n######## V1b stale Undo on the Home card (Log)');
    await logStart('egg timer', 'real_spoon.jpg'); await openIn(); await pickIn('Pantry shelf'); await doSave(); const et = await raw('egg timer'); console.log('   home undo', await undoCount());
    await page.evaluate((id) => { const d = window.__rig.dump(); const it = d.find(x => x.id === id); const t = Date.now(); const { id: _i, ...rest } = it; window.__rig.seed([{ id, ...rest, updatedAt: t, history: [...(it.history || []), { at: t, w: 1, said: 'behind the flour', by: 'robert' }] }]); }, et.id);
    await page.waitForTimeout(1200); const e0 = await raw('egg timer'); await shot('v1b-home-before');
    if (await undoCount()) { await undo('stale home'); await shot('v1b-after'); const e1 = await raw('egg timer'); console.log('   egg timer still there?', !!e1, '| unchanged?', JSON.stringify(e0) === JSON.stringify(e1)); }
    console.log('   ', errs());
