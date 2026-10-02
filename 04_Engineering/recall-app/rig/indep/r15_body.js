    const sheetFor = async (w, label) => { await setWords(w); await openIn(); const t = await inText(); const said = t.split(' / RECENT')[0]; console.log(`WORDS ${JSON.stringify(w.slice(0, 60))}${w.length > 60 ? '…(' + w.length + ')' : ''} -> ${said.slice(0, 400)}`); if (label) await shot(label); await cancelChoose(); };
    const now = Date.now();
    await page.evaluate((s) => window.__rig.seed(s), [{ id: 'lcbox', kind: 'item', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [], name: 'linen closet', location: '', holds: true, order: now, createdAt: now, lastSeenAt: now, logId: 'l_lcbox', photoCount: 0, written: true, photo: null, thumb: null, history: [] }]);
    await page.reload(); await page.waitForTimeout(800); await page.evaluate(() => window.__rig.rules(true));
    await logStart('egg timer', 'real_spoon.jpg');
    await sheetFor('in the linen closet', 'w-linen-dup');
    await sheetFor('Kitchen Counter.'); await sheetFor('KITCHEN    counter'); await sheetFor('kitchencounter'); await sheetFor('kitchen counters');
    await sheetFor('in the garage'); await sheetFor('in the garage cupboard'); await sheetFor('on the hall table by the desk drawer', 'w-two');
    await sheetFor('zzz qqq'); await sheetFor('it is there'); await sheetFor('in it'); await sheetFor('box'); await sheetFor('the');
    await sheetFor('🔑🧺 in the 🧺 basket'); await sheetFor('PIN 4821, password hunter2, safe code 1234');
    await sheetFor('in the drawer'); await sheetFor('in the desk'); await sheetFor('craft');
    // the item's own name
    await sheetFor('egg timer in the egg timer box');
    // save variants
    const long = ('top shelf behind the paint cans ').repeat(100);
    await setWords(long); await doSave(); await dumpItem('egg timer'); await itemPage('egg timer', 'w-long-itempage'); await page.evaluate(() => window.scrollTo(0, 400)); await shot('w-long-itempage-scrolled');
    await find('paint cans', 'w-long-find');
    async function find(q, label) { await home(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', q); await page.waitForTimeout(900); const t = await page.evaluate(() => [...document.querySelectorAll('.ask .tile')].map(e => e.innerText.replace(/\s+/g, ' ').slice(0, 150)).join(' || ')); console.log(`FIND "${q}": ${t}`); if (label) await shot(label); }
    await logStart('stapler', 'scissors.jpg'); await setWords('   '); console.log('save w/ spaces', await saveState()); await doSave(); await dumpItem('stapler'); await notPut();
    await logStart('ruler', 'real_pencil.jpg'); await setWords('PIN 4821, password hunter2'); await doSave(); await dumpItem('ruler'); await itemPage('ruler', 'w-pin-itempage'); await find('hunter2', 'w-pin-find');
    await logStart('emoji thing', 'tin.jpg'); await setWords('🔑 under the 🧺'); await doSave(); await dumpItem('emoji thing'); await itemPage('emoji thing', 'w-emoji');
    await logStart('mic thing', 'keys.jpg'); await page.locator('.w1-mic').click(); await page.waitForTimeout(1500); console.log('after mic:', await camText()); await shot('w-mic'); await press('.lc-x'); await page.waitForTimeout(500); const lv = page.locator('button:has-text("Leave")'); if (await lv.count()) await lv.first().click();
    // same words twice via Move it
    await openItem('ruler'); await tap('button:has-text("Move it")', { wait: 1200 }); await setWords('PIN 4821, password hunter2'); console.log('save same words', await saveState()); await doSave(); await dumpItem('ruler');
    await openItem('ruler'); await tap('button:has-text("Move it")', { wait: 1200 }); await setWords('  pin 4821,   PASSWORD hunter2 '); console.log('save same words diff case', await saveState()); await doSave(); await dumpItem('ruler');
