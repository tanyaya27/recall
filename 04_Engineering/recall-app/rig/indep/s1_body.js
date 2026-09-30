    await kbInit();
    await seedHouse(); await page.evaluate(() => window.__rig.rules(true));
    const st = () => page.evaluate(() => { const t = (q) => (document.querySelector(q) || {}).innerText || '';
      return { squares: [...document.querySelectorAll('.lv-strip .lv-sq:not(.plus)')].map((b) => b.getAttribute('aria-label')), place: t('.lc-say'), chain: t('.lc-chainline').replace(/\s+/g, ' '), prompt: t('.lc-prompt').replace(/\s+/g,' '), plus: !!document.querySelector('.lv-sq.plus') }; });
    const openItem = async (nm) => { await home(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', nm); await page.waitForTimeout(450); await page.locator('.ask .tile').first().click(); await page.waitForSelector('.card.thing'); await page.waitForTimeout(400); };
    const pageWhere = () => page.evaluate(() => { const t = document.body.innerText.replace(/\s+/g, ' '); const m = t.match(/WHERE IT IS(.*?)Move it/i); return m ? m[1].trim() : 'NO WHERE CARD'; });
    // ---------- visit 1 ----------
    await home(); await page.click(LOG); await page.waitForTimeout(900);
    AI = { name: 'blue scissors' }; await cam('scissors.jpg'); await tap('.lc-shutter', { wait: 1800 });
    await tap('.lv-sq.plus', { wait: 500 });
    WHERE.push({ name: 'white box', moves: true }); await cam('box.jpg'); await tap('.lc-shutter', { wait: 3800 });
    await page.locator('.wl-pend input').fill('White shoebox'); await tap('.wl-pend .btn-primary', { wait: 600 });
    await tap('.lv-sq.plus', { wait: 500 });
    WHERE.push({ name: 'bookshelf', moves: false }); await cam('closet.jpg'); await tap('.lc-shutter', { wait: 3800 });
    await page.locator('.wl-pend input').fill('Ikea shelf'); await tap('.wl-pend .btn-primary', { wait: 600 });
    await tap('.lv-sq.plus', { wait: 500 });
    await tap('.lc-choose', { wait: 600 }); await page.locator('.wl-search input').fill('Office'); await page.waitForTimeout(300); await page.keyboard.press('Enter'); await page.waitForTimeout(700);
    let s = await st(); console.log('V1 before save', JSON.stringify(s));
    await tap('.lc-k.sv', { wait: 2500 }); await shot('v1 saved card');
    const box = await itemDoc('White shoebox'); check('V1', 'box level photo kept on the box', box && !!box.photo, box ? `photo=${!!box.photo} photoCount=${box.photoCount}` : 'no box doc');
    check('V1', 'data chain', (await chainOf('blue scissors')) === 'blue scissors > White shoebox > Ikea shelf > Office', await chainOf('blue scissors'));
    await openItem('blue scissors'); let w = await pageWhere(); console.log('V1 item page:', w); await shot('v1 item page');
    check('V1', 'item page shows the whole chain with in', /White shoebox\s*in\s*Ikea shelf\s*in\s*Office/.test(w), w);
    // item page for the box
    await openItem('White shoebox'); w = await pageWhere(); console.log('V1 box page:', w); await shot('v1 box page');
    check('V1', 'box page: where it is = Ikea shelf in Office', /Ikea shelf\s*in\s*Office/.test(w), w);
    // ---------- visit 2: Move it, + on top ----------
    await openItem('blue scissors'); await tap('button:has-text("Move it")', { wait: 1000 });
    s = await st(); console.log('V2 move opens', JSON.stringify(s)); await shot('v2 move opens');
    check('V2', 'Move it shows all 3 known levels', s.squares.length === 3, JSON.stringify(s.squares));
    await tap('.lv-sq.plus', { wait: 500 }); await tap('.lc-choose', { wait: 600 });
    await page.locator('.wl-search input').click(); await kbUp(); await page.keyboard.type('Upstairs', { delay: 30 }); await page.waitForTimeout(300);
    const k1 = await aboveKb('.wl-search input'), k2 = await aboveKb('.wl-new.typed'); await shot('v2 typing upstairs kb');
    check('V2', 'typing a new place: field and new-place row above keyboard', k1.ok && k2.ok, JSON.stringify([k1, k2]));
    await page.keyboard.press('Enter'); await page.waitForTimeout(700); await kbDown();
    s = await st(); console.log('V2 before save', JSON.stringify(s)); await shot('v2 before save');
    await tap('.lc-k.sv', { wait: 2500 }); await shot('v2 saved');
    const toast2 = await bodyText(); 
    check('V2', 'data chain 4 levels', (await chainOf('blue scissors')) === 'blue scissors > White shoebox > Ikea shelf > Office > Upstairs', await chainOf('blue scissors'));
    await openItem('blue scissors'); w = await pageWhere(); console.log('V2 item page:', w); await shot('v2 item page');
    check('V2', 'item page 4 levels', /White shoebox\s*in\s*Ikea shelf\s*in\s*Office\s*in\s*Upstairs/.test(w), w);
    // ---------- visit 3: change the middle level ----------
    await tap('button:has-text("Move it")', { wait: 1000 }); s = await st(); console.log('V3 opens', JSON.stringify(s));
    await page.locator('.lv-sq[aria-label^="Level 2"]').click(); await page.waitForTimeout(400); // select
    await page.locator('.lv-sq[aria-label^="Level 2"]').click(); await page.waitForTimeout(500); // open its sheet
    await ui('V3 level-2 sheet'); await shot('v3 level2 sheet');
    const chooseInSheet = page.locator('.sheet button:has-text("Choose place"), .sheet-back button:has-text("Choose place")');
    if (await chooseInSheet.count()) await chooseInSheet.first().click(); else await tap('.lc-choose');
    await page.waitForTimeout(600);
    await page.locator('.wl-search input').fill('Pantry'); await page.waitForTimeout(300);
    await tap('.where-list .wl-row:has-text("Pantry shelf")', { wait: 600 });
    s = await st(); console.log('V3 after pick', JSON.stringify(s)); await shot('v3 after pick pantry');
    const t3 = await bodyText(); const said = /Ikea shelf\s*→\s*Pantry shelf/.test(t3);
    check('V3', 'Q3: camera says "White shoebox: Ikea shelf → Pantry shelf" before Save', said, (t3.match(/.*→.*/) || ['no arrow line'])[0]);
    check('V3', 'levels above the changed one dropped (2 squares)', s.squares.length === 2, JSON.stringify(s.squares));
    await tap('.lc-k.sv', { wait: 2000 }); await shot('v3 saved toast'); const toast3 = await bodyText(); console.log('V3 toast area:', toast3.slice(-300).replace(/\s+/g, ' '));
    check('V3', 'data: box now in Pantry shelf; Ikea shelf still in Office in Upstairs', (await chainOf('White shoebox')) === 'White shoebox > Pantry shelf' && (await chainOf('Ikea shelf')) === 'Ikea shelf > Office > Upstairs', `${await chainOf('White shoebox')} | ${await chainOf('Ikea shelf')}`);
    // Undo
    const undo = page.locator('button:has-text("Undo")');
    if (await undo.count()) { await undo.first().click(); await page.waitForTimeout(1200); await shot('v3 after undo'); }
    check('V3', 'Undo puts the box back in Ikea shelf', (await chainOf('White shoebox')) === 'White shoebox > Ikea shelf > Office > Upstairs', await chainOf('White shoebox'));
    await openItem('blue scissors'); w = await pageWhere(); console.log('V3 item page after undo:', w); await shot('v3 item page after undo');
    check('V3', 'item page after undo back to 4 levels', /White shoebox\s*in\s*Ikea shelf\s*in\s*Office\s*in\s*Upstairs/.test(w), w);
    // ---------- visit 4a: Remove this level on level 1 of Move it ----------
    await tap('button:has-text("Move it")', { wait: 1000 });
    await page.locator('.lv-sq[aria-label^="Level 1"]').click(); await page.waitForTimeout(500);
    await shot('v4 level1 sheet');
    const l1rows = await page.locator('.tier-sheet button').allInnerTexts(); console.log('V4a level1 sheet rows', JSON.stringify(l1rows));
    check('F6', 'Move it: level 1 sheet has no Remove this level', !l1rows.some(r => /Remove/i.test(r)), JSON.stringify(l1rows));
    if (await page.locator('.tier-sheet button:has-text("Remove this level")').count()) await page.locator('.tier-sheet button:has-text("Remove this level")').click(); else await tap('.tier-sheet .btn-quiet:has-text("Close")').catch(() => page.keyboard.press('Escape')); await page.waitForTimeout(600);
    s = await st(); console.log('V4a after remove level 1', JSON.stringify(s)); await shot('v4a after remove level1'); await ui('v4a after remove');
    check('V4a', 'after closing level 1 sheet, 3 squares remain', s.squares.length === 3, JSON.stringify(s.squares));
    if (await page.locator('.lc-k.sv:not([disabled])').count()) { await tap('.lc-k.sv', { wait: 2200 }); } else { console.log('Save disabled -> Cancel'); await tap('.lc-x', { wait: 800 }); await shot('v4a after cancel'); console.log('after cancel text:', (await bodyText()).slice(0,200).replace(/\s+/g,' ')); }
    console.log('V4a CHAIN', await chainOf('blue scissors'), '| box:', await chainOf('White shoebox'), '| loc field:', (await itemDoc('blue scissors')).location);
    const undo4 = page.locator('button:has-text("Undo")'); if (await undo4.count()) { await undo4.first().click(); await page.waitForTimeout(1200); }
    console.log('V4a after undo CHAIN', await chainOf('blue scissors'));
    // ---------- visit 4b: rename the box from its own page ----------
    await openItem('White shoebox'); await tap('.tp-row:has-text("Rename")', { wait: 500 }); await ui('rename sheet');
    await page.locator('.sheet input').first().fill('Shoebox'); await tap('.sheet .btn-primary', { wait: 800 }); await shot('v4b box renamed');
    await openItem('blue scissors'); let w4 = await pageWhere(); console.log('V4b scissors page:', w4); await shot('v4b scissors page');
    check('V4b', 'item page shows renamed box', /Shoebox\s*in\s*Ikea shelf/.test(w4) && !/White shoebox/.test(w4), w4);
    await home(); const ht = await bodyText(); await shot('v4b home');
    check('V4b', 'home tiles do not show the old box name', !/White shoebox/i.test(ht), (ht.match(/.*white shoebox.*/i)||[''])[0]);
    await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', 'scissors'); await page.waitForTimeout(500);
    const sr = await page.locator('.ask').innerText(); console.log('V4b search scissors:', sr.replace(/\s+/g,' ')); await shot('v4b search');
    check('V4b', 'search result where-line uses the new name', !/White shoebox/i.test(sr), sr.replace(/\s+/g,' '));
    await page.fill('#ask-input', 'white shoebox'); await page.waitForTimeout(500); const sr2 = await page.locator('.ask').innerText(); console.log('V4b search old name:', sr2.replace(/\s+/g,' '));
    // ---------- visit 4c: Places screen, rename Ikea shelf ----------
    await home(); await tap('.menu-btn', { wait: 500 }); await tap('.drawer-row:has-text("Places")', { wait: 800 }); await shot('v4c places'); await ui('places');
    console.log('scissors.location after box rename =', (await itemDoc('blue scissors')).location);
    const pt = await bodyText(); check('V4c', 'Places list: no row with the box\'s old name', !/White shoebox/.test(pt), '');
    check('V4c', 'Places list says item(s), not thing(s) (09-29 ruling)', !/\bthings?\b/.test(pt), (pt.match(/.*\bthings?\b.*/) || [''])[0]);
    await page.locator('.loc-row:has-text("White shoebox")').scrollIntoViewIfNeeded().catch(()=>{});
    if (await page.locator('.loc-row:has-text("White shoebox")').count()) { await page.locator('.loc-row:has-text("White shoebox")').click(); await page.waitForTimeout(700); await shot('v4c stale row opened'); await ui('stale White shoebox row'); console.log('STEP goBack'); await page.goBack().catch((e)=>console.log('goBack err', e.message)); await page.waitForTimeout(500); console.log('STEP after goBack'); }
    console.log('STEP home2'); await home(); console.log('STEP home2 ok'); await tap('.menu-btn', { wait: 500 }); await tap('.drawer-row:has-text("Places")', { wait: 800 });
    await page.locator('.loc-row:has-text("Ikea shelf")').click(); await page.waitForTimeout(700); await shot('v4c ikea place page'); await ui('ikea place page');
