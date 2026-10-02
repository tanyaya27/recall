    await grant();
    console.log('\n######## A1 Robert words on yearbook; Margaret moves it (pick, no words); Undo -> words keep Robert + time');
    await asUser('robert'); await moveIt('yearbook 1978'); await setWords('bottom of the box, under the photos'); await doSave(); console.log('   ', errs());
    const r0 = await raw('yearbook 1978');
    await page.waitForTimeout(2500);
    await asUser('margaret'); await raw('yearbook 1978'); await moveIt('yearbook 1978'); await openIn(); await pickIn('Pantry shelf'); await doSave(); await raw('yearbook 1978');
    await undo('A1'); await shot('a1-after-undo'); const r1 = await raw('yearbook 1978'); await pageWords('yearbook 1978', 'a1-page');
    console.log('\n######## A2 Margaret moves it WITH new words + pick; Undo -> Robert words back?');
    await moveIt('yearbook 1978'); await setWords('on the pantry shelf now'); await openIn(); await pickIn('Pantry shelf'); await doSave(); await raw('yearbook 1978');
    await undo('A2'); await raw('yearbook 1978'); await pageWords('yearbook 1978', 'a2-page');
    console.log('\n######## A3 Home-card Undo of a re-log w/ words by Margaret over Robert words (Your yearbook? Yes)');
    await home(); await page.click(LOG); await page.waitForTimeout(900); AI = { name: 'yearbook 1978' }; SAME = { index: 1, sure: true }; await cam('book.jpg'); await tap('.lc-shutter', { wait: 2500 }); SAME = { index: -1, sure: false };
    console.log('   CAM', await camText()); if (await btn(/^Yes$/)) { await setWords('on the hall table'); await doSave(); await raw('yearbook 1978'); await undo('A3 home'); await raw('yearbook 1978'); } else await leaveCam();
    await pageWords('yearbook 1978', 'a3-page');

    console.log('\n######## E lastSeenAt: before / after Move / after Undo');
    const e0 = await raw('baseball card'); await moveIt('baseball card'); await openIn(); await pickIn('Garage shelf'); await doSave(); const e1 = await raw('baseball card'); await undo('E'); const e2 = await raw('baseball card');
    console.log(`   E lastSeenAt: before=${e0 && e0.lastSeenAt} after=${e1 && e1.lastSeenAt} undone=${e2 && e2.lastSeenAt} -> ${e0 && e2 && e0.lastSeenAt === e2.lastSeenAt ? 'RESTORED' : 'NOT RESTORED'}`);
    await pageWords('baseball card', 'e-page');

    console.log('\n######## F Move it -> x -> Save -> Undo');
    await moveIt('baseball card'); console.log('   CAM', await camText(), await saveState()); await page.locator('.w1-in .x').first().click(); await page.waitForTimeout(400); console.log('   save after x', await saveState()); await press('.lc-k.sv'); await page.waitForTimeout(900); await shot('f-x-saved'); console.log('   undo buttons:', await undoCount(), (await bodyText()).replace(/\s+/g, ' ').slice(0, 220)); await raw('baseball card');
    await undo('F'); await shot('f-undone'); await raw('baseball card'); await placeEdges();

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
