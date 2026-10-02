    const moveIt = async (nm) => { await openItem(nm); await tap('button:has-text("Move it")', { wait: 1200 }); };
    const undo = async () => { const u = page.locator('button.u').first(); if (!(await u.count())) { console.log('   NO UNDO'); return; } await u.click(); await page.waitForTimeout(1500); console.log('   UNDONE ->', (await bodyText()).replace(/\s+/g, ' ').slice(0, 300)); };
    const photoDocs = async () => { const d = await D(); const k = {}; d.forEach(x => k[x.kind] = (k[x.kind] || 0) + 1); console.log('KINDS', JSON.stringify(k)); const r = d.filter(x => x.kind !== 'item' && x.kind !== 'place' && x.kind !== 'edge' && JSON.stringify(x).includes('"c"')).map(x => ({ id: x.id, kind: x.kind, thing: x.thing || x.itemId || x.of, at: x.at, deleted: x.deleted, undone: x.undone })); console.log('PHOTO-ish docs for c:', JSON.stringify(r)); };
    await fresh2(); await photoDocs();
    await moveIt('baseball card'); AI = { name: 'baseball card' }; await cam('closet.jpg'); await tap('.lc-shutter', { wait: 1800 }); await doSave(); await photoDocs(); await shot('m5-saved');
    await undo(); await photoDocs(); await shot('m5-undone'); await page.reload(); await page.waitForTimeout(1500); await openItem('baseball card'); await shot('m5-undone-reload'); console.log((await bodyText()).replace(/\s+/g, ' ').slice(0, 120));
    console.log('\n######## M10');
    await moveIt('baseball card'); await words('abc'); console.log('save after abc', await saveState()); await setWords(''); console.log('save after erase', await saveState());
    await setWords('   '); console.log('save after spaces only', await saveState()); await doSave(); await dumpItem('baseball card');
