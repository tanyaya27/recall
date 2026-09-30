    await kbInit();
    await seedHouse(); await page.evaluate(() => window.__rig.rules(true));
    const st = () => page.evaluate(() => { const t = (q) => (document.querySelector(q) || {}).innerText || '';
      return { squares: [...document.querySelectorAll('.lv-strip .lv-sq:not(.plus)')].map((b) => b.getAttribute('aria-label')), place: t('.lc-say'), chain: t('.lc-chainline').replace(/\s+/g, ' '), prompt: t('.lc-prompt').replace(/\s+/g,' '), plus: !!document.querySelector('.lv-sq.plus'), open: !!document.querySelector('.lc'), head: t('.lc-name') }; });
    const places = () => page.evaluate(() => window.__rig.dump().filter(x => x.kind === 'place').map(x => x.name));
    const holdSave = async (ms) => { const b = await page.locator('.lc-k.sv').boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await page.waitForTimeout(ms); const txt = await page.locator('.lc-k.sv').innerText().catch(() => '?'); await shot('holding save ' + ms); await page.mouse.up(); return txt; };
    // --- A: Cancel halfway after typing two NEW places: nothing should be created ---
    const p0 = await places();
    await home(); await page.click(LOG); await page.waitForTimeout(900);
    AI = { name: 'tape measure' }; await cam('tin.jpg'); await tap('.lc-shutter', { wait: 1800 });
    await tap('.lv-sq.plus', { wait: 400 }); await tap('.lc-choose', { wait: 500 }); await page.locator('.wl-search input').fill('Garden shed'); await page.keyboard.press('Enter'); await page.waitForTimeout(600);
    await tap('.lv-sq.plus', { wait: 400 }); WHERE.push({ name: 'backyard', moves: false }); await cam('real_desk.jpg'); await tap('.lc-shutter', { wait: 3800 });
    if (await page.locator('.wl-pend input').count()) { await page.locator('.wl-pend input').fill('Backyard'); await tap('.wl-pend .btn-primary', { wait: 600 }); }
    console.log('A before cancel', JSON.stringify(await st()));
    await tap('.lc-x', { wait: 800 }); await shot('A after cancel'); console.log('A after cancel', JSON.stringify(await st())); await ui('A after cancel');
    if (await page.locator('.lc').count()) { const conf = page.locator('button:has-text("Discard"), button:has-text("Yes"), button:has-text("Cancel")'); console.log('confirm dialog?'); }
    const p1 = await places(); const newPl = p1.filter(x => !p0.includes(x));
    check('A', 'Cancel halfway: no new places left behind', newPl.length === 0, JSON.stringify(newPl));
    check('A', 'Cancel halfway: no item saved', !(await itemDoc('tape measure')), '');
    // --- B: Save + Next (hold) ---
    await home(); await page.click(LOG); await page.waitForTimeout(900);
    AI = { name: 'glue gun' }; await cam('charger.jpg'); await tap('.lc-shutter', { wait: 1800 });
    await tap('.lv-sq.plus', { wait: 400 }); await tap('.lc-choose', { wait: 500 }); await page.locator('.wl-search input').fill('Craft'); await page.waitForTimeout(300);
    await tap('.where-list .wl-row:has-text("Craft nook")', { wait: 600 });
    console.log('B before hold', JSON.stringify(await st()));
    const holdTxt = await holdSave(1200); console.log('B save label while held:', holdTxt);
    check('B', 'holding Save turns the button into "Save + Next"', /Save \+ Next/i.test(holdTxt), holdTxt);
    await page.waitForTimeout(400); await shot('B flash'); const flash = await bodyText(); console.log('B flash text:', flash.slice(-200).replace(/\s+/g, ' '));
    check('B', 'flash says "Glue gun ✓ saved"', /Glue gun\s*✓\s*saved/i.test(flash), '');
    await page.waitForTimeout(1500); let s = await st(); console.log('B next camera', JSON.stringify(s)); await shot('B next camera');
    check('B', 'next camera is open and clean (no leftover levels, New item)', s.open && s.squares.length === 0 && !/glue/i.test(s.head), JSON.stringify(s));
    check('B', 'first item saved at Craft nook', (await chainOf('glue gun')).startsWith('glue gun > Craft nook'), await chainOf('glue gun'));
    // second item in the Save+Next sequence, then a quick tap Save
    AI = { name: 'hot glue sticks' }; await cam('card.jpg'); await tap('.lc-shutter', { wait: 1800 }); s = await st(); console.log('B 2nd item', JSON.stringify(s)); await shot('B 2nd item');
    await tap('.lv-sq.plus', { wait: 400 }); await tap('.lc-choose', { wait: 500 });
    const firstRow = await page.locator('.where-list .wl-row').first().innerText().catch(() => ''); console.log('B choose first row:', firstRow.replace(/\s+/g, ' '));
    await page.locator('.wl-search input').fill('Craft'); await page.waitForTimeout(300); await tap('.where-list .wl-row:has-text("Craft nook")', { wait: 600 });
    await tap('.lc-k.sv', { wait: 2200 }); await shot('B 2nd saved');
    check('B', '2nd item saved at Craft nook', (await chainOf('hot glue sticks')).startsWith('hot glue sticks > Craft nook'), await chainOf('hot glue sticks'));
    check('B', 'camera closed after plain Save', !(await page.locator('.lc').count()), '');
    // --- B2: slide off Save = nothing ---
    await home(); await page.click(LOG); await page.waitForTimeout(900);
    AI = { name: 'stapler' }; await cam('keys.jpg'); await tap('.lc-shutter', { wait: 1800 });
    { const b = await page.locator('.lc-k.sv').boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await page.waitForTimeout(900); await page.mouse.move(b.x - 150, b.y - 200, { steps: 5 }); await page.mouse.up(); await page.waitForTimeout(1200); }
    s = await st(); console.log('B2 after slide-off', JSON.stringify(s)); await shot('B2 slide off');
    check('B2', 'hold then slide off Save does nothing (camera still open, item not saved)', s.open && !(await itemDoc('stapler')), `open=${s.open} saved=${!!(await itemDoc('stapler'))}`);
    await tap('.lc-x', { wait: 800 });
    // --- C: slow AI (4 s) on a place photo, typing before the late answer ---
    await home(); await page.click(LOG); await page.waitForTimeout(900);
    AI = { name: 'sewing kit' }; await cam('smallbox.jpg'); await tap('.lc-shutter', { wait: 1800 });
    await tap('.lv-sq.plus', { wait: 400 });
    WHERE.push({ name: 'hall closet', moves: false }); NEXT_WHERE_DELAY = 4500; await cam('closet.jpg');
    await tap('.lc-shutter', { wait: 1000 }); await shot('C waiting 1s'); await ui('C waiting');
    const saveDis = await page.locator('.lc-k.sv').isDisabled().catch(() => null), chooseDis = await page.locator('.lc-choose').isDisabled().catch(() => null);
    console.log('C during wait: save disabled', saveDis, 'choose disabled', chooseDis);
    // try pressing Save during the wait (Ravi impatient)
    await page.locator('.lc-k.sv').click({ force: true, timeout: 2000 }).catch(() => {}); await page.waitForTimeout(300);
    console.log('C after Save press during wait', JSON.stringify(await st()), 'saved?', !!(await itemDoc('sewing kit')));
    await page.waitForTimeout(2200); await shot('C 3s up'); console.log('C 3s up', JSON.stringify(await st()));
    const pend = page.locator('.wl-pend input'); console.log('C pend count', await pend.count(), 'value', await pend.inputValue().catch(() => '-'));
    if (await pend.count()) { await pend.click(); await pend.fill(''); await page.keyboard.type('Hall', { delay: 60 }); }
    await page.waitForTimeout(1800); console.log('C after late answer, value =', await pend.inputValue().catch(() => '-')); await shot('C after late answer');
    check('C', 'late AI answer does not overwrite what I typed', (await pend.inputValue().catch(() => '')) === 'Hall', await pend.inputValue().catch(() => '-'));
    await page.keyboard.type(' cupboard', { delay: 30 }); await tap('.wl-pend .btn-primary', { wait: 600 });
    s = await st(); console.log('C named', JSON.stringify(s));
    check('C', 'level named Hall cupboard', s.squares.some(x => /Hall cupboard/i.test(x)), JSON.stringify(s.squares));
    await tap('.lc-k.sv', { wait: 2200 });
    check('C', 'saved sewing kit > Hall cupboard', (await chainOf('sewing kit')) === 'sewing kit > Hall cupboard', await chainOf('sewing kit'));
    // --- D: AI returns bad JSON on the place photo ---
    await home(); await page.click(LOG); await page.waitForTimeout(900);
    AI = { name: 'label maker' }; await cam('brochure.jpg'); await tap('.lc-shutter', { wait: 1800 });
    await tap('.lv-sq.plus', { wait: 400 }); NEXT_WHERE_BADJSON = true; await cam('real_painting.jpg'); await tap('.lc-shutter', { wait: 3800 });
    s = await st(); await shot('D bad json'); await ui('D bad json'); console.log('D', JSON.stringify(s));
    check('D', 'bad AI answer: a way forward is open (name field or Choose place)', (await page.locator('.wl-pend input').count()) > 0 || (await page.locator('.wl-search input').count()) > 0, '');
    if (await page.locator('.wl-pend input').count()) { console.log('D pend value', await page.locator('.wl-pend input').inputValue()); await page.locator('.wl-pend input').fill('Studio wall'); await tap('.wl-pend .btn-primary', { wait: 600 }); }
    await tap('.lc-k.sv', { wait: 2200 });
    const lm = await chainOf('label maker'); check('D', 'saved label maker > Studio wall with its photo', lm === 'label maker > Studio wall', lm);
    const sw = await page.evaluate(() => window.__rig.dump().find(x => x.kind === 'place' && x.name === 'Studio wall')); console.log('Studio wall photos', sw && (sw.photos || []).length);
    check('D', 'the place photo was kept on Studio wall', sw && (sw.photos || []).length === 1, '');
