    const now = Date.now(), H = 3600e3, D = 24 * H;
    const E = (id, from, to, ago) => ({ id, kind: 'edge', rel: 'in', from, to, since: now - ago, until: null, how: 'chosen', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [] });
    const openItem = async (nm) => { await home(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', nm); await page.waitForTimeout(450); await page.locator('.ask .tile').filter({ hasText: new RegExp(nm, 'i') }).first().click(); await page.waitForSelector('.card.thing'); await page.waitForTimeout(900); };
    const pageWhere = () => page.evaluate(() => { const t = document.body.innerText.replace(/\s+/g, ' '); const m = t.match(/WHERE IT IS(.*?)Move it/i); return m ? m[1].trim() : 'NO WHERE CARD'; });
    const photoTime = () => page.evaluate(() => { const t = document.body.innerText.split('\n').map(s => s.trim()).filter(Boolean); return t.slice(0, 3).join(' / '); });
    const moveTo = async (place) => { await tap('button:has-text("Move it")', { wait: 900 }); await tap('.lc-choose', { wait: 500 }); await page.locator('.wl-search input').fill(place.slice(0, 5)); await page.waitForTimeout(300); await tap(`.where-list .wl-row:has-text("${place}")`, { wait: 400 }); await tap('.lc-k.sv', { wait: 1500 }); };
    await page.evaluate(() => window.__rig.rules(true));
    const hist = async (nm) => { const x = await itemDoc(nm); return x ? JSON.stringify({ loc: x.location, lastSeenAt: x.lastSeenAt && new Date(x.lastSeenAt).toISOString().slice(11,16), hist: (x.history||[]).map(h => h.location + '@' + new Date(h.at).toISOString().slice(11,16) + (h.how ? '/' + h.how : '')), pc: x.photoCount }) : 'none'; };
    // U. Undo a move and look at the stored history
    await openItem('wallet'); console.log('U0 wallet:', await pageWhere(), '|', await hist('wallet'));
    await moveTo('Pantry shelf'); console.log('U1 moved:', await pageWhere(), '|', await hist('wallet'));
    await tap('button:has-text("Undo")', { wait: 1200 }); console.log('U2 after undo:', await pageWhere(), '|', await hist('wallet'));
    await openItem('wallet'); console.log('U3 reopen:', await pageWhere());
    // F. Log then Move (new item)
    await home(); await page.click(LOG); await page.waitForTimeout(900); AI = { name: 'egg timer' }; await cam('real_spoon.jpg'); await tap('.lc-shutter', { wait: 1800 });
    await tap('.lc-choose', { wait: 500 }); await page.locator('.wl-search input').fill('Kitch'); await page.waitForTimeout(300); await tap('.where-list .wl-row:has-text("Kitchen counter")', { wait: 400 }); await tap('.lc-k.sv', { wait: 1500 });
    await page.waitForTimeout(1500); await openItem('egg timer'); console.log('F1 logged:', await pageWhere(), '||', await photoTime(), '|', await hist('egg timer'));
    await moveTo('Craft nook'); console.log('F2 moved:', await pageWhere(), '||', await photoTime(), '|', await hist('egg timer')); await shot('egg after log then move');
    // F3: Move from Home (card with Undo) - via Find? Use the Move-it path from the home tile? just undo from item page note again
    // G. Add a tier on top = not a move
    await openItem('spare batteries'); console.log('G0 batteries:', await pageWhere(), '|', await hist('spare batteries'));
    await tap('button:has-text("Move it")', { wait: 900 }); await tap('.lv-sq.plus', { wait: 400 }); await tap('.lc-choose', { wait: 500 }); await page.locator('.wl-search input').fill('Pantry'); await page.waitForTimeout(300); await tap('.where-list .wl-row:has-text("Pantry shelf")', { wait: 400 });
    console.log('G squares', await page.locator('.lv-sq').evaluateAll(a => a.map(b => b.getAttribute('aria-label')))); await tap('.lc-k.sv', { wait: 1500 });
    await openItem('spare batteries'); console.log('G1 batteries after adding tier on top:', await pageWhere(), '|', await hist('spare batteries')); await shot('batteries tier on top');
    console.log('chains', await chainOf('spare batteries'));
    // H. Move the place (Kitchen counter) that batteries are on: via Kitchen counter place page? change tier 2 of batteries: Pantry shelf -> Linen closet
    await tap('button:has-text("Move it")', { wait: 900 }); await page.locator('.lv-sq[aria-label^="Level 2"]').click(); await page.waitForTimeout(400); if (await page.locator('.sheet-row').count()) await tap('.btn-quiet:has-text("Close")', { wait: 300 });
    await tap('.lc-choose', { wait: 500 }); await page.locator('.wl-search input').fill('Linen'); await page.waitForTimeout(300); await tap('.where-list .wl-row:has-text("Linen closet")', { wait: 400 }); await tap('.lc-k.sv', { wait: 1500 });
    await openItem('spare batteries'); console.log('H1 batteries after its counter moved:', await pageWhere(), '|', await hist('spare batteries')); await shot('batteries counter moved');
    console.log('chains', await chainOf('spare batteries'));
