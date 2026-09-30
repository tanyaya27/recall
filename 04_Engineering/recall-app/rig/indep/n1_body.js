    await seedHouse(); await page.evaluate(() => window.__rig.rules(true));
    const st = () => page.evaluate(() => { const t = (q) => (document.querySelector(q) || {}).innerText || '';
      const plus = document.querySelector('.lv-sq.plus'); const pr = plus && plus.getBoundingClientRect();
      return { squares: [...document.querySelectorAll('.lv-strip .lv-sq:not(.plus)')].map((b) => b.getAttribute('aria-label')), place: t('.lc-say').replace(/\s+/g,' '), chain: t('.lc-chainline').replace(/\s+/g, ' '), prompt: t('.lc-prompt').replace(/\s+/g,' '), plus: pr ? [Math.round(pr.left), Math.round(pr.right), innerWidth] : null }; });
    const openItem = async (nm) => { await home(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', nm); await page.waitForTimeout(450); await page.locator('.ask .tile').first().click(); await page.waitForSelector('.card.thing'); await page.waitForTimeout(400); };
    const cardProbe = () => page.evaluate(() => { const u = [...document.querySelectorAll('button')].find(b => /^Undo$/.test(b.innerText.trim())); if (!u) return null; const r = u.getBoundingClientRect(); const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      let c = u.parentElement; while (c && c.parentElement && c.getBoundingClientRect().height < 60) c = c.parentElement; const cr = c.getBoundingClientRect(); const cs = getComputedStyle(c);
      return { undo: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], hit: top ? (top.tagName + '.' + top.className + ' "' + (top.innerText||'').slice(0,30).replace(/\s+/g,' ') + '"') : null, card: [Math.round(cr.top), Math.round(cr.bottom)], op: cs.opacity, tr: cs.transform, pe: getComputedStyle(u).pointerEvents }; });
    // --- Find tile: only the tier it is in
    await home(); await page.click('.footer .btn-primary.alt'); await page.fill('#ask-input', 'baseball'); await page.waitForTimeout(500);
    const ft = await page.locator('.ask').innerText(); console.log('FIND baseball:', ft.replace(/\s+/g, ' ')); await shot('find baseball');
    check('S1', 'Find tile shows the tier it is in (Wooden box)', /wooden box/i.test(ft) && !/memorabilia/i.test(ft), ft.replace(/\s+/g,' '));
    // --- Move it on baseball card: Place: Wooden box; level-1 sheet; middle prompt
    await page.locator('.ask .tile').first().click(); await page.waitForTimeout(600);
    await tap('button:has-text("Move it")', { wait: 1000 }); let s = await st(); console.log('MOVE baseball', JSON.stringify(s)); await shot('move baseball');
    check('S2', '"Place: Wooden box" (no "In the")', /^Place: Wooden box/.test(s.place), s.place);
    check('S5', '+ visible (not scrolled away) with 3 squares', s.plus && s.plus[1] <= s.plus[2], JSON.stringify(s.plus));
    await page.locator('.lv-sq[aria-label^="Level 1"]').click(); await page.waitForTimeout(500); if (!(await page.locator('.tier-sheet').count())) { await page.locator('.lv-sq[aria-label^="Level 1"]').click(); await page.waitForTimeout(500); }
    const rows = await page.locator('.tier-sheet button').allInnerTexts(); console.log('L1 sheet rows', JSON.stringify(rows)); await shot('level1 sheet');
    check('F6', 'Move it level 1 sheet has no Remove', rows.length > 0 && !rows.some(r => /Remove/i.test(r)), JSON.stringify(rows));
    await tap('.tier-sheet .btn-quiet:has-text("Close")');
    await page.locator('.lv-sq[aria-label^="Level 2"]').click(); await page.waitForTimeout(500);
    if (await page.locator('.tier-sheet').count()) { const r2 = await page.locator('.tier-sheet button').allInnerTexts(); console.log('L2 sheet rows', JSON.stringify(r2)); await tap('.tier-sheet .btn-quiet:has-text("Close")'); }
    s = await st(); console.log('L2 selected', JSON.stringify(s)); await shot('middle level selected');
    check('S3', 'middle level prompt does not say "Tap + to add what X is in"', !/Tap \+ to add what/i.test(s.prompt), s.prompt);
    // --- No, Choose place: does not suggest the same place again (Log a new item, photograph Kitchen counter, say No)
    await tap('.lc-x', { wait: 500 }); if (await page.locator('button:has-text("Throw away")').count()) await tap('button:has-text("Throw away")');
    await home(); await page.click(LOG); await page.waitForTimeout(900);
    AI = { name: 'egg timer' }; await cam('real_spoon.jpg'); await tap('.lc-shutter', { wait: 1800 });
    await tap('.lv-sq.plus', { wait: 400 }); WHERE.push({ name: 'counter', known: 'Kitchen counter', moves: false }); await cam('closet.jpg'); await tap('.lc-shutter', { wait: 3500 });
    console.log('asked?', /Is this the Kitchen counter/i.test(await bodyText()));
    await tap('.lc button:has-text("No")', { wait: 700 }); await shot('after No'); const noTxt = await bodyText(); await ui('after No');
    const rowsNo = await page.locator('.where-list .wl-row').allInnerTexts().catch(() => []); console.log('rows after No', JSON.stringify(rowsNo.slice(0, 5)));
    check('S4', 'after No, Kitchen counter is not suggested again at the top', !(rowsNo[0] || '').match(/Kitchen counter/) && !/Your kitchen counter\?|Is this the Kitchen counter/i.test(noTxt), (rowsNo[0] || '') );
    if (await page.locator('.wl-search input').count()) { await page.locator('.wl-search input').fill('Pantry'); await page.waitForTimeout(250); await tap('.where-list .wl-row:has-text("Pantry shelf")', { wait: 500 }); }
    await tap('.lc-k.sv', { wait: 400 });
    // --- saved card: tap body
    let p = await cardProbe(); console.log('LOG card probe t0', JSON.stringify(p)); await shot('log card');
    await page.waitForTimeout(8000);
    // --- Move card on item page: hit test over time, tap card body, what's under it
    await openItem('egg timer'); await tap('button:has-text("Move it")', { wait: 800 }); await tap('.lc-choose', { wait: 400 }); await page.locator('.wl-search input').fill('Linen'); await page.waitForTimeout(250); await tap('.where-list .wl-row:has-text("Linen closet")', { wait: 300 });
    await page.locator('.lc-k.sv').click(); const t0 = Date.now();
    for (const ms of [150, 400, 800, 1500, 3000]) { while (Date.now() - t0 < ms) await page.waitForTimeout(40); console.log('MOVE card probe', ms, JSON.stringify(await cardProbe())); }
    await shot('move card on item page');
    const under = await page.evaluate(() => { const u = [...document.querySelectorAll('button')].find(b => /^Undo$/.test(b.innerText.trim())); if (!u) return null; let c = u.parentElement; while (c.getBoundingClientRect().height < 60) c = c.parentElement; const cr = c.getBoundingClientRect();
      return [...document.querySelectorAll('.card.thing button, .card.thing .tp-row, button.sw')].filter(b => { const r = b.getBoundingClientRect(); return r.height && r.bottom > cr.top && r.top < cr.bottom; }).map(b => (b.innerText || b.getAttribute('aria-label') || '').replace(/\s+/g,' ').slice(0, 30)); });
    console.log('controls under the Move card:', JSON.stringify(under));
    // tap the card body (the name)
    const nm = page.locator('text=Egg timer').last(); const before = page.url(); await nm.click({ timeout: 2000 }).catch(e => console.log('tap card name failed', e.message.slice(0, 80))); await page.waitForTimeout(700);
    console.log('after tapping card name: url', before, '->', page.url(), '| card still?', !!(await cardProbe())); await shot('after tap card');
    let gone = 0; for (let i = 0; i < 40; i++) { if (!(await cardProbe())) { gone = (Date.now() - t0); break; } await page.waitForTimeout(250); }
    console.log('Move card gone after ms', gone);
    console.log('egg timer', await chainOf('egg timer'));
