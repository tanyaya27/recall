    const moveIt = async (nm) => { await openItem(nm); await tap('button:has-text("Move it")', { wait: 1200 }); };
    const newRows = async () => page.locator('.in-list button').filter({ hasText: /New place/ }).allInnerTexts().then(a => a.map(s => s.replace(/\s+/g, ' ')));
    const sheetFor = async (w, label) => { await setWords(w); await openIn(); const t = await inText(); console.log(`WORDS ${JSON.stringify(w)} -> NEW=${JSON.stringify(await newRows())}\n      ${t.slice(0, 260)}`); if (label) await shot(label); await cancelChoose(); };
    const srch = async (q, label) => { const i = page.locator('.in-list .wl-search input'); await i.fill(''); await i.type(q, { delay: 10 }); await page.waitForTimeout(500); console.log(`SEARCH ${JSON.stringify(q)} -> NEW=${JSON.stringify(await newRows())}\n      ${(await inText()).slice(0, 260)}`); if (label) await shot(label); };
    console.log('\n######## FIX1 new-place offers');
    await logStart('egg timer', 'real_spoon.jpg');
    for (const w of ['Egg timer is next to the wallet by the reading glasses', 'It is there', 'Zzz qqq', '1978', 'in 1978', 'in the memorabilia box', 'in the tin box on the kitchen counter', 'next to the baseball card', 'in the yearbook'])
      await sheetFor(w, w === 'Egg timer is next to the wallet by the reading glasses' ? 'fix1-names' : null);
    await press('.lc-x'); await page.waitForTimeout(500); { const lv = page.locator('button:has-text("Leave")'); if (await lv.count()) await lv.first().click(); }
    console.log('-- loop: memorabilia box Move it, words in the wooden box');
    await moveIt('memorabilia box'); await setWords('in the wooden box next to the baseball card'); await openIn(); console.log('NEW', JSON.stringify(await newRows()), '|', (await inText()).slice(0, 300)); await shot('fix1-loop-sheet');
    await srch('wooden box', 'fix1-loop-search'); await srch('Wooden'); await srch('baseball card');
    await cancelChoose(); await press('.lc-x'); await page.waitForTimeout(500); { const lv = page.locator('button:has-text("Leave")'); if (await lv.count()) await lv.first().click(); }
    await allPlaces();
    console.log('\n######## FIX3 password');
    const guard = async (w) => { await setWords(w); const t = await camText(); console.log(`GUARD ${JSON.stringify(w)} -> save ${await saveState()}${/PIN|password|secret/i.test(t) ? ' [GUARD SHOWN: ' + (t.match(/[^/]*(PIN|password|secret)[^/]*/i) || [''])[0].trim().slice(0, 90) + ']' : ''}`); };
    await logStart('ruler', 'real_pencil.jpg');
    for (const w of ['password hunter2', 'pw hunter2', 'login: bob / hunter2', 'pwd hunter2', 'passwd hunter2', 'pass: hunter2', 'my pw is hunter2', 'Password=hunter2', 'user bob pass hunter2', 'PIN4821', 'pin#4821', 'code: 1234', 'the password notebook is in the desk drawer', 'pin cushion in the sewing box', 'in the safe, combo 12-34-56', 'password hunter2 in the shoebox', 'in the shoebox, password hunter2', 'locker 12'])
      await guard(w);
    await setWords('in the shoebox, password hunter2'); await openIn(); console.log('SECRET-WORDS SHEET NEW', JSON.stringify(await newRows()), (await inText()).slice(0, 200)); await shot('fix3-secret-sheet');
    await setWords(''); await openIn().catch(() => {});
    if (!(await page.locator('.in-list').count())) await openIn();
    for (const q of ['password hunter2', 'pw hunter2', 'login: bob / hunter2', 'pwd hunter2', 'pass: hunter2', 'PIN4821', 'shoebox password hunter2']) await srch(q);
    await shot('fix3-search');
    await cancelChoose(); await press('.lc-x'); await page.waitForTimeout(500); { const lv = page.locator('button:has-text("Leave")'); if (await lv.count()) await lv.first().click(); }
    await allPlaces();
    console.log('\n######## FIX4 counts');
    await logStart('stapler', 'scissors.jpg'); await openIn(); console.log('IN LIST:', await sheetText('.in-list')); await shot('fix4-in-list');
    const rows = await page.evaluate(() => [...document.querySelectorAll('.in-list .wl-row')].map(r => r.innerText.replace(/\s+/g, ' ')).join(' || ')); console.log('ROWS:', rows);
    const d = await D(); const counts = {}; for (const e of d.filter(x => x.kind === 'edge' && !x.until)) { const k = e.to.name; counts[k] = (counts[k] || 0) + 1; } console.log('STORE live edge counts by target:', JSON.stringify(counts));
    const loc = {}; for (const it of d.filter(x => x.kind === 'item' && !x.deleted)) if (it.location) loc[it.location] = (loc[it.location] || 0) + 1; console.log('STORE location-text counts:', JSON.stringify(loc));
