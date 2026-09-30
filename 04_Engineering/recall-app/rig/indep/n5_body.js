    await seedHouse(); await page.evaluate(() => window.__rig.rules(true));
    const st = () => page.evaluate(() => { const t = (q) => (document.querySelector(q) || {}).innerText || ''; return { squares: [...document.querySelectorAll('.lv-strip .lv-sq:not(.plus)')].map((b) => b.getAttribute('aria-label')), place: t('.lc-say').replace(/\s+/g,' '), chain: t('.lc-chainline').replace(/\s+/g, ' '), prompt: t('.lc-prompt').replace(/\s+/g,' ') }; });
    const openItem = async (nm) => { await home(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', nm); await page.waitForTimeout(450); await page.locator('.ask .tile').filter({ hasText: new RegExp(nm, 'i') }).first().click(); await page.waitForSelector('.card.thing'); await page.waitForTimeout(400); };
    const pageWhere = () => page.evaluate(() => { const t = document.body.innerText.replace(/\s+/g, ' '); const m = t.match(/WHERE IT IS(.*?)Move it/i); return m ? m[1].trim() : 'NO WHERE CARD'; });
    const all = async () => `card: ${await chainOf('baseball card')} | yearbook: ${await chainOf('yearbook 1978')}`;
    console.log('START', await all());
    // 1. move the middle box (wooden box) to Pantry shelf
    await openItem('wooden box'); console.log('wooden box page:', await pageWhere()); await shot('wooden box page');
    await tap('button:has-text("Move it")', { wait: 900 }); let s = await st(); console.log('move wooden box', JSON.stringify(s)); await shot('move wooden box camera');
    await tap('.lc-choose', { wait: 500 }); const rows = await page.locator('.where-list .wl-row').allInnerTexts(); console.log('choose rows for wooden box', JSON.stringify(rows.map(r => r.replace(/\s+/g, ' '))));
    check('BX', 'Choose place for the wooden box does not offer itself', !rows.some(r => /^Wooden box/i.test(r.trim())), '');
    await page.locator('.wl-search input').fill('Pantry'); await page.waitForTimeout(250); await tap('.where-list .wl-row:has-text("Pantry shelf")', { wait: 500 });
    s = await st(); console.log('after pick', JSON.stringify(s)); await tap('.lc-k.sv', { wait: 1500 }); await shot('after move middle box'); await ui('after move middle box');
    console.log('AFTER middle move', await all());
    check('BX', 'moving the middle box takes the baseball card along', (await chainOf('baseball card')) === 'baseball card > wooden box > Pantry shelf', await chainOf('baseball card'));
    check('BX', 'yearbook stays in the memorabilia box', (await chainOf('yearbook 1978')) === 'yearbook 1978 > memorabilia box > Crawl space', await chainOf('yearbook 1978'));
    await page.waitForTimeout(5000);
    await openItem('baseball card'); const w = await pageWhere(); console.log('baseball page', w); await shot('baseball page after');
    check('BX', 'baseball card page: Wooden box in Pantry shelf', /Wooden box\s*in\s*Pantry shelf/i.test(w) && !/Memorabilia/i.test(w), w);
    await openItem('memorabilia box'); console.log('memorabilia page', await pageWhere(), '| inside text:', ((await bodyText()).match(/inside.*|holds.*/gi) || []).join(' / ')); await shot('memorabilia page');
    // 2. cycle: put the memorabilia box into the wooden box (which is no longer inside it) then wooden box into memorabilia again -> fine; try the real cycle: memorabilia box into ... first put wooden back in memorabilia via undo? Use yearbook-free: move memorabilia box into wooden box, then wooden box into memorabilia box
    await tap('button:has-text("Move it")', { wait: 900 }); await tap('.lc-choose', { wait: 500 }); await page.locator('.wl-search input').fill('wooden'); await page.waitForTimeout(300);
    const r2 = await page.locator('.where-list .wl-row').allInnerTexts(); console.log('rows "wooden" for memorabilia box', JSON.stringify(r2.map(r => r.replace(/\s+/g, ' '))));
    if (r2.some(r => /Wooden box/.test(r))) { await tap('.where-list .wl-row:has-text("Wooden box")', { wait: 500 }); s = await st(); console.log('memorabilia -> wooden', JSON.stringify(s)); await tap('.lc-k.sv', { wait: 1500 }); await shot('memorabilia into wooden'); }
    else { await page.keyboard.press('Escape'); }
    console.log('AFTER memorabilia into wooden:', await chainOf('memorabilia box'), '|', await all());
    await page.waitForTimeout(5000);
    // now try wooden box into memorabilia box = cycle
    await openItem('wooden box'); await tap('button:has-text("Move it")', { wait: 900 }); s = await st(); console.log('wooden move squares', JSON.stringify(s));
    await tap('.lc-choose', { wait: 500 }); await page.locator('.wl-search input').fill('memorab'); await page.waitForTimeout(300);
    const r3 = await page.locator('.where-list .wl-row').allInnerTexts(); console.log('rows "memorab" for wooden box', JSON.stringify(r3.map(r => r.replace(/\s+/g, ' '))));
    if (r3.some(r => /Memorabilia box/.test(r))) { await tap('.where-list .wl-row:has-text("Memorabilia box")', { wait: 500 }); s = await st(); console.log('CYCLE squares', JSON.stringify(s)); await shot('cycle camera'); await tap('.lc-k.sv', { wait: 1500 }); await shot('after cycle save'); await ui('after cycle save'); }
    console.log('AFTER cycle attempt: wooden', await chainOf('wooden box'), '| memorabilia', await chainOf('memorabilia box'), '|', await all());
    check('BX', 'no cycle: a box never ends up inside itself', !/!MULTI|wooden box > memorabilia box > wooden box|memorabilia box > wooden box > memorabilia box/i.test((await chainOf('wooden box')) + (await chainOf('memorabilia box'))), (await chainOf('wooden box')) + ' || ' + (await chainOf('memorabilia box')));
    await home(); await shot('home after cycle'); console.log('home:', (await bodyText()).replace(/\n/g, ' | ').slice(0, 500));
    await page.click('.footer .btn-primary.alt'); await page.fill('#ask-input', 'baseball'); await page.waitForTimeout(500); console.log('find baseball:', (await page.locator('.ask').innerText()).replace(/\s+/g,' '));
    await page.locator('.ask .tile').first().click().catch(()=>{}); await page.waitForTimeout(800); console.log('baseball page after cycle:', await pageWhere()); await shot('baseball page after cycle');
