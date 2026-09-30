    await kbInit();
    await seedHouse(); await page.evaluate(() => window.__rig.rules(true));
    const cards = () => page.evaluate(() => [...document.querySelectorAll('button')].filter(b => /^Undo$/.test(b.innerText.trim())).map((u, i) => { const r = u.getBoundingClientRect(); const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { i, text: u.parentElement.innerText.replace(/\s+/g, ' ').slice(0, 60), hitIsMe: top === u || u.contains(top) }; }));
    const logAndMove = async (nm, waitBeforeMove) => {
      await home(); await page.click(LOG); await page.waitForTimeout(900);
      AI = { name: nm }; await cam('keys.jpg'); await tap('.lc-shutter', { wait: 1800 });
      await tap('.lv-sq.plus', { wait: 300 }); await tap('.lc-choose', { wait: 400 }); await page.locator('.wl-search input').fill('Linen'); await page.waitForTimeout(250); await tap('.where-list .wl-row:has-text("Linen closet")', { wait: 400 });
      await tap('.lc-k.sv', { wait: 300 }); await page.waitForTimeout(waitBeforeMove);
      // tap the saved card itself, if it opens the item
      const card = page.locator('button:text-is("Undo")').first(); let opened = false;
      if (await card.count()) { const c = card.locator('xpath=..'); await c.click({ position: { x: 30, y: 60 } }).catch(() => {}); await page.waitForTimeout(500); opened = (await page.locator('.card.thing').count()) > 0; }
      if (!opened) { await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', nm); await page.waitForTimeout(350); await page.locator('.ask .tile').first().click(); await page.waitForTimeout(400); }
      console.log(nm, 'saved card opens the item?', opened);
      await tap('button:has-text("Move it")', { wait: 800 }); await tap('.lc-choose', { wait: 400 }); await page.locator('.wl-search input').fill('Pantry'); await page.waitForTimeout(250); await tap('.where-list .wl-row:has-text("Pantry shelf")', { wait: 400 });
      await tap('.lc-k.sv', { wait: 400 }); };
    const state = async (nm) => (await itemDoc(nm)) ? await chainOf(nm) : 'ITEM GONE';
    // V1: fast; press the Undo that is actually on top (what a finger hits)
    await logAndMove('stamp pad', 0);
    let c = await cards(); console.log('V1 cards', JSON.stringify(c)); await shot('V1 two cards');
    const topU = c.find(x => x.hitIsMe); if (topU) { await page.locator('button:text-is("Undo")').nth(topU.i).click({ force: true }); await page.waitForTimeout(1200); }
    console.log('V1 pressed', topU && topU.text, '->', await state('stamp pad'));
    check('W', 'fast log→move, the Undo on top after the move puts it back at Linen closet', (await state('stamp pad')) === 'stamp pad > Linen closet', `${topU && topU.text} -> ${await state('stamp pad')}`);
    // V2: fast; wait for the Log card to go, then press the Move toast Undo
    await logAndMove('ink refill', 0);
    for (let i = 0; i < 30; i++) { c = await cards(); if (!c.some(x => /Linen closet/.test(x.text))) break; await page.waitForTimeout(300); }
    c = await cards(); console.log('V2 cards once log card gone', JSON.stringify(c));
    if (c.length) { await page.locator('button:text-is("Undo")').first().click(); await page.waitForTimeout(1200); }
    console.log('V2 ->', await state('ink refill'));
    check('W', 'fast log→move, Move toast Undo (after Log card gone) puts it back at Linen closet', (await state('ink refill')) === 'ink refill > Linen closet', await state('ink refill'));
    // V3: control — wait 9 s after log before moving
    await logAndMove('rubber bands', 9000);
    c = await cards(); console.log('V3 cards', JSON.stringify(c));
    if (c.length) { await page.locator('button:text-is("Undo")').first().click(); await page.waitForTimeout(1200); }
    console.log('V3 ->', await state('rubber bands'));
    check('W', 'control (9 s gap): Move toast Undo puts it back at Linen closet', (await state('rubber bands')) === 'rubber bands > Linen closet', await state('rubber bands'));
