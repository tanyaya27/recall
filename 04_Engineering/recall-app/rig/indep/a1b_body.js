    console.log('\n######## B guard: camera words');
    const guard = async (w) => { await setWords(w); const t = await camText(); console.log(`GUARD ${JSON.stringify(w)} -> save ${await saveState()}${/PIN|password|secret|code/i.test(t) ? ' [GUARD: ' + (t.match(/[^/]*(PIN|password|secret|code)[^/]*/i) || [''])[0].trim().slice(0, 90) + ']' : ''}`); };
    await logStart('ruler', 'real_pencil.jpg');
    for (const w of ['passwd hunter2', 'pass: hunter2', 'user bob pass hunter2', 'PIN4821', 'Pass: hunter2', 'PASSWD: hunter2', 'pw: hunter2', 'pwd=hunter2', 'passcode 4821', 'pin 4821', 'PIN: 4821', 'my pass is hunter2', 'password:hunter2', 'p/w hunter2', 'login bob hunter2', 'username bob password hunter2', 'combo 12-34-56', 'wifi password is hunter2', 'the passport is in the desk drawer', 'pass the salt shaker', 'bypass valve box', 'pinboard in the craft nook'])
      await guard(w);
    await setWords('in the shoebox, pass: hunter2'); await openIn(); console.log('   NEW rows from secret words', JSON.stringify(await newRows())); await shot('b-secret-sheet');
    for (const q of ['Pass: hunter2', 'passwd hunter2', 'PIN4821', 'user bob pass hunter2', 'pw: hunter2', 'pin 4821']) await srch(q);
    await shot('b-search'); await cancelChoose(); await setWords(''); await leaveCam(); await allPlaces();
    console.log('-- B in Move it words'); await moveIt('wallet'); for (const w of ['pass: hunter2', 'PIN4821']) await guard(w); await press('.lc-k.sv'); await page.waitForTimeout(1500); await raw('wallet'); await leaveCam().catch(() => {});
    console.log('-- B in Write it down');
    await wid('laptop'); await widElse('passwd hunter2'); await page.evaluate(() => window.scrollTo(0, 9999)); await shot('b-wid-else'); await wsave(); await raw('laptop');
    await wid('router'); await widElse('PIN4821'); await wsave(); await raw('router');
    await wid('modem'); await widPick(); await srchW('Pass: hunter2'); await shot('b-wid-search'); console.log('   new rows', JSON.stringify(await page.locator('.sheet button, .in-list button').filter({ hasText: /New place/ }).allInnerTexts())); await page.keyboard.press('Escape');
    console.log('-- B in Put it in sheet search'); await openItem('coffee can'); await tap('button:has-text("Put it in a place or a box")', { wait: 1000 }).catch(() => console.log('   no put-in')); await srchW('pass: hunter2'); console.log('   new rows', JSON.stringify(await page.locator('.sheet button, .in-list button').filter({ hasText: /New place/ }).allInnerTexts())); await page.keyboard.press('Escape');
    await allPlaces();

    console.log('\n######## C Write it down');
    await wid('drill'); await widElse('In the shoebox under the bed'); await wsave(); await raw('drill'); await allPlaces();
    await wid('saw'); await widElse('pantry SHELF'); await wsave(); await raw('saw');
    await wid('nails'); await widElse('  craft NOOK  '); await wsave(); await raw('nails');
    await wid('screws'); await widElse('Tin box'); await wsave(); await raw('screws');
    await wid('fan'); await widPick(); await srchW('Attic'); await page.locator('button').filter({ hasText: /New place: Attic/ }).first().click(); await page.waitForTimeout(700); await shot('c-attic'); await wsave(); await raw('fan'); await allPlaces();
    console.log('   ', errs());
