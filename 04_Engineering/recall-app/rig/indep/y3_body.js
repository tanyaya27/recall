    const tapNewRow = async () => { const b = page.locator('.in-list button').filter({ hasText: /New place/ }).first(); if (!(await b.count())) { console.log('   no New row'); return false; } await b.click(); await page.waitForTimeout(700); return true; };
    const placeDocs = async () => { const d = await D(); console.log('PLACE DOCS:', d.filter(x => x.kind === 'place').map(p => `${p.id}:${p.name}${p.deleted ? '(DEL)' : ''}`).join(' ; ')); };
    const dangling = async () => { const d = await D(); const live = d.filter(x => x.kind === 'place' && !x.deleted).map(p => p.name.toLowerCase()); const oldLoc = new Set(d.filter(x => x.kind === 'item' && !x.deleted).map(i => (i.location || '').toLowerCase())); const bad = d.filter(x => x.kind === 'edge' && !x.until && x.to.t === 'place' && !live.includes((x.to.name || '').toLowerCase())).map(x => { const f = d.find(z => z.id === x.from); return `${f ? f.name : x.from}->${x.to.name}`; }); console.log('EDGES TO A PLACE WITH NO PLACE DOC:', bad.join(' | ') || 'none'); };
    await dangling();
    console.log('\n######## S7 Save + Next with a NEW place, then camera Undo of item 1, then Save item 2 with the chip');
    await logStart('hammer', 'tooldrawer.jpg'); await setWords('in the workbench cabinet'); await openIn(); await tapNewRow(); await hold('.lc-k.sv', 1200); await page.waitForTimeout(1500); console.log('   CAM', await camText()); await placeDocs();
    const u = page.locator('.lc button:has-text("Undo")').first(); console.log('   camera undo?', await u.count()); if (await u.count()) { await u.click(); await page.waitForTimeout(1500); console.log('   after camera undo:', await camText()); } await placeDocs(); await raw('hammer');
    AI = { name: 'chisel' }; await cam('scissors.jpg'); await tap('.lc-shutter', { wait: 2000 }); console.log('   CAM item2', await camText()); await shot('s7-item2'); await doSave(); await placeDocs(); await raw('chisel'); await dangling(); await allPlaces();
    await openItem('chisel'); console.log('   CHISEL PAGE:', (await bodyText()).replace(/\s+/g, ' ').slice(0, 300)); await shot('s7-chisel');
    console.log('\n######## S7b Save + Next, then camera Undo, then item 2 with the chip -> Save + Next again, Undo again');
    await logStart('pliers', 'tooldrawer.jpg'); await setWords('in the red toolbox'); await openIn(); await tapNewRow(); await hold('.lc-k.sv', 1200); await page.waitForTimeout(1500);
    AI = { name: 'wrench' }; await cam('scissors.jpg'); await tap('.lc-shutter', { wait: 2000 }); console.log('   CAM item2 (no undo yet)', await camText());
    { const u2 = page.locator('.lc button:has-text("Undo")').first(); console.log('   undo still on item2 camera?', await u2.count()); if (await u2.count()) { await u2.click(); await page.waitForTimeout(1500); console.log('   after undo:', await camText()); } }
    await placeDocs(); await doSave(); await raw('pliers'); await raw('wrench'); await dangling(); await placeDocs();

    console.log('\n######## S8 box moved twice from its own page, Undo, Undo again');
    await raw('wooden box'); console.log('   chains: card', await chainOf('baseball card'), '| wooden', await chainOf('wooden box'));
    await moveIt('wooden box'); await openIn(); await pickIn('Pantry shelf'); await doSave(); console.log('   chain card', await chainOf('baseball card'));
    await moveIt('wooden box'); await openIn(); await pickIn('Garage shelf'); await doSave(); console.log('   chain card', await chainOf('baseball card')); await shot('s8-moved2');
    console.log('   undo buttons', await undoCount()); await undo('S8 #1'); console.log('   chain card', await chainOf('baseball card'), '| wooden', await chainOf('wooden box')); await raw('wooden box'); await shot('s8-undo1');
    console.log('   undo buttons now', await undoCount()); if (await undoCount()) { await undo('S8 #2'); console.log('   chain card', await chainOf('baseball card'), '| wooden', await chainOf('wooden box')); await raw('wooden box'); }
    await openItem('wooden box'); console.log('   undo on reopened page', await undoCount(), (await bodyText()).replace(/\s+/g, ' ').slice(0, 260)); await placeEdges(); await raw('baseball card');

    console.log('\n######## S9 words on the card inside the wooden box; then the box is moved from its page; Undo');
    await moveIt('baseball card'); await setWords('top tray, in the plastic sleeve'); await doSave(); const c0 = await raw('baseball card');
    await page.waitForTimeout(1500);
    await moveIt('wooden box'); await setWords('on the pantry shelf, left'); await openIn(); await pickIn('Pantry shelf'); await doSave(); const c1 = await raw('baseball card'); console.log('   chain card', await chainOf('baseball card')); await pageWords('baseball card', 's9-card-after-box-move');
    await moveIt('wooden box'); await undo('S9 box (should be none, Move it reopened)'); await leaveCam();
    await openItem('wooden box'); await undo('S9 box page'); const c2 = await raw('baseball card'); console.log('   chain card', await chainOf('baseball card')); await pageWords('baseball card', 's9-card-after-undo');
    console.log('   card history lens', (c0.history||[]).length, (c1.history||[]).length, (c2.history||[]).length, '| card lastSeen', c0.lastSeenAt, c1.lastSeenAt, c2.lastSeenAt);
    console.log('   ', errs());
