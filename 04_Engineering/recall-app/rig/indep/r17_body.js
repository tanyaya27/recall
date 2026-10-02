    const moveIt = async (nm) => { await openItem(nm); await tap('button:has-text("Move it")', { wait: 1200 }); };
    const undo = async () => { const u = page.locator('button.u').first(); if (!(await u.count())) { console.log('   NO UNDO'); return; } await u.click(); await page.waitForTimeout(1500); console.log('   UNDONE ->', (await bodyText()).replace(/\s+/g, ' ').slice(0, 250)); };
    console.log('\n######## Put it in a place or a box');
    await logStart('egg timer', 'real_spoon.jpg'); await words('under the stairs'); await doSave();
    await openItem('egg timer'); await tap('button:has-text("Put it in a place or a box")', { wait: 1200 }); console.log('CAM/SHEET', (await bodyText()).replace(/\s+/g, ' ').slice(-500)); await shot('putit');
    if (await page.locator('.in-list').count()) { await pickIn('Pantry shelf'); console.log('CAM', await camText(), await saveState()); await doSave(); await dumpItem('egg timer'); await itemPage('egg timer', 'putit-after'); }
    console.log('\n######## box move + Undo; contents');
    await moveIt('memorabilia box'); await openIn(); await pickIn('Garage shelf'); await doSave(); console.log('chains', await chainOf('baseball card'), '|', await chainOf('yearbook 1978'));
    await undo(); console.log('chains after undo', await chainOf('baseball card'), '|', await chainOf('yearbook 1978'), '|', await chainOf('memorabilia box')); await placeEdges();
    console.log('\n######## move into its own contents via search of the content name');
    await moveIt('wooden box'); await openIn(); const i = page.locator('.in-list .wl-search input'); await i.type('baseball', { delay: 10 }); await page.waitForTimeout(500); console.log('SEARCH baseball:', await inText());
    await cancelChoose(); await press('.lc-x'); await page.waitForTimeout(400);
    console.log('\n######## item turned into a box, then put something inside a thing inside it');
    await openItem('wallet'); await page.click('.sw:near(:text("It holds items"))').catch(() => {}); await page.waitForTimeout(800); console.log((await bodyText()).replace(/\s+/g, ' ').slice(0, 300));
    await moveIt('wallet'); await openIn(); console.log('wallet sheet', (await inText()).slice(0, 300)); await pickIn('Tin box'); await doSave();
    await moveIt('tin box'); await setWords('in the wallet'); await openIn(); console.log('TIN BOX SHEET (wallet is inside tin box):', (await inText()).slice(0, 300)); await shot('loop-wallet');
