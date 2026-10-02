    const guard = async (w) => { await setWords(w); const t = await camText(); console.log(`GUARD ${JSON.stringify(w)} -> save ${await saveState()}${/PIN or password/.test(t) ? ' [GUARD SHOWN]' : ''}`); };
    await logStart('ruler', 'real_pencil.jpg');
    for (const w of ['pin is 4821', 'PIN: 4821', 'the code is 1234', 'safe combination 12-34-56', 'passcode 0000', 'my password is Fluffy!', 'pw hunter2', 'login: bob / hunter2', '4821', 'wifi password is on the router', 'pin cushion in the sewing box', 'the password notebook is in the desk drawer', 'PIN pad drawer', 'card pin 1234 in wallet', 'combo is 4-8-21', 'garage door code 4821', 'locker 12, code 0412'])
      await guard(w);
    // bypass via the In search
    await setWords(''); await openIn(); const i = page.locator('.in-list .wl-search input'); await i.type('password hunter2', { delay: 10 }); await page.waitForTimeout(500); console.log('SEARCH:', await inText());
    const nb = page.locator('.in-list button').filter({ hasText: /New place/ }).first(); if (await nb.count()) { await nb.click(); await page.waitForTimeout(600); console.log('CAM', await camText(), await saveState()); await shot('pw-place-chip'); await doSave(); await allPlaces(); await dumpItem('ruler'); }
    // guard in Move it
    await openItem('baseball card'); await tap('button:has-text("Move it")', { wait: 1200 }); await guard('the PIN 4821 is on the back'); await shot('move-guard');
