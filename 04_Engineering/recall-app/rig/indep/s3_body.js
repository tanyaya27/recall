    await kbInit();
    await seedHouse(); await page.evaluate(() => window.__rig.rules(true));
    const st = () => page.evaluate(() => { const t = (q) => (document.querySelector(q) || {}).innerText || '';
      return { squares: [...document.querySelectorAll('.lv-strip .lv-sq:not(.plus)')].map((b) => b.getAttribute('aria-label') + (b.innerText ? '[' + b.innerText.replace(/\s+/g,' ') + ']' : '')), place: t('.lc-say').replace(/\s+/g,' '), chain: t('.lc-chainline').replace(/\s+/g, ' '), prompt: t('.lc-prompt').replace(/\s+/g,' '), plus: !!document.querySelector('.lv-sq.plus'), open: !!document.querySelector('.lc') }; });
    const plPhotos = (nm) => page.evaluate((n) => { const p = window.__rig.dump().find(x => x.kind === 'place' && x.name === n); return p ? (p.photos || []).map(x => x.at) : null; }, nm);
    const openItem = async (nm) => { await home(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', nm); await page.waitForTimeout(450); await page.locator('.ask .tile').first().click(); await page.waitForSelector('.card.thing'); await page.waitForTimeout(400); };
    // --- E: recognised place, Yes ---
    await home(); await page.click(LOG); await page.waitForTimeout(900);
    AI = { name: 'usb stick' }; await cam('keys.jpg'); await tap('.lc-shutter', { wait: 1800 });
    await tap('.lv-sq.plus', { wait: 400 });
    WHERE.push({ name: 'counter', known: 'Kitchen counter', moves: false }); await cam('closet.jpg'); await tap('.lc-shutter', { wait: 2500 });
    await shot('E ask'); await ui('E ask');
    const yes = page.locator('.lc button:has-text("Yes")'); check('E', 'recognised: "Is this the Desk drawer?" with Yes', /Is this the Kitchen counter\?/i.test(await bodyText()) && (await yes.count()) > 0, '');
    const before = await plPhotos('Kitchen counter');
    if (await yes.count()) { await yes.first().click(); await page.waitForTimeout(600); }
    let s = await st(); console.log('E after yes', JSON.stringify(s)); await shot('E after yes');
    await tap('.lc-k.sv', { wait: 2200 });
    const after = await plPhotos('Kitchen counter'); check('E', 'Yes adds the photo to Kitchen counter', after && before && after.length === before.length + 1, `${before && before.length} -> ${after && after.length}`);
    check('E', 'usb stick > Desk drawer, no duplicate Desk drawer', (await chainOf('usb stick')) === 'usb stick > Kitchen counter' && (await page.evaluate(() => window.__rig.dump().filter(x => x.kind === 'place' && x.name === 'Kitchen counter').length)) === 1, await chainOf('usb stick'));
    // --- F: recognised, No, then try to reuse an existing name ---
    await home(); await page.click(LOG); await page.waitForTimeout(900);
    AI = { name: 'tape' }; await cam('scissors.jpg'); await tap('.lc-shutter', { wait: 1800 });
    await tap('.lv-sq.plus', { wait: 400 });
    WHERE.push({ name: 'counter', known: 'Kitchen counter', moves: false }); await cam('tooldrawer.jpg'); await tap('.lc-shutter', { wait: 2500 });
    const no = page.locator('.lc button:has-text("No")'); await shot('F ask'); await ui('F ask'); if (await no.count()) { await no.first().click(); await page.waitForTimeout(700); }
    await shot('F after no'); await ui('F after no');
    const pend = page.locator('.wl-pend input');
    if (await pend.count()) { await pend.fill('kitchen counter'); await page.waitForTimeout(500); console.log('F use-name disabled?', await page.locator('.wl-pend .btn-primary').isDisabled()); }
    await shot('F reuse name'); const ft = await bodyText(); console.log('F text:', (ft.match(/.*(pick it|own name|already).*/i) || ['(no refusal line)'])[0]);
    check('F', 'a name you already have is refused (pick it below, or give its own name)', /pick it below|its own name/i.test(ft), '');
    if (await pend.count()) { await pend.fill('Kitchen counter 2'); await tap('.wl-pend .btn-primary', { wait: 600 }); }
    s = await st(); console.log('F', JSON.stringify(s)); await tap('.lc-k.sv', { wait: 2200 });
    check('F', 'saved tape > Desk drawer 2', (await chainOf('tape')) === 'tape > Kitchen counter 2', await chainOf('tape'));
    // --- G: 7 photos of Pantry shelf in one Move -> 6 kept, main kept ---
    const pan0 = await plPhotos('Pantry shelf'); console.log('Pantry photos at start', pan0.length);
    await openItem('usb stick'); await tap('button:has-text("Move it")', { wait: 1000 });
    await tap('.lc-choose', { wait: 500 }); await page.locator('.wl-search input').fill('Pantry'); await page.waitForTimeout(300); await tap('.where-list .wl-row:has-text("Pantry shelf")', { wait: 600 });
    const imgs = ['real_painting.jpg', 'book.jpg', 'diary.jpg', 'real_pencil.jpg', 'real_spoon.jpg', 'real_passport.jpg', 'brochure.jpg'];
    for (let i = 0; i < imgs.length; i++) { WHERE.push({ name: 'shelf', known: 'Pantry shelf' }); await cam(imgs[i]); await tap('.lc-shutter', { wait: 1600 });
      const y = page.locator('.lc button:has-text("Yes")'); if (await y.count()) { await y.first().click(); await page.waitForTimeout(500); }
      if (await page.locator('.wl-pend input').count()) { console.log('G name sheet opened on photo', i); await shot('G sheet ' + i); break; } }
    s = await st(); console.log('G after 7 photos', JSON.stringify(s)); await shot('G 7 photos');
    await tap('.lc-k.sv', { wait: 2500 });
    const pan1 = await plPhotos('Pantry shelf'); console.log('Pantry photos after', pan1 && pan1.length, 'main kept', pan1 && pan1[0] === pan0[0]);
    check('G', 'place keeps 6 photos, main (first) kept', pan1 && pan1.length === 6 && pan1[0] === pan0[0], `len=${pan1 && pan1.length}`);
    // --- H: Q4 — outside a place only places ---
    await home(); await page.click(LOG); await page.waitForTimeout(900);
    AI = { name: 'thermos' }; await cam('soda.jpg'); await tap('.lc-shutter', { wait: 1800 });
    await tap('.lv-sq.plus', { wait: 400 }); await tap('.lc-choose', { wait: 500 }); await page.locator('.wl-search input').fill('Kitchen'); await page.waitForTimeout(300); await tap('.where-list .wl-row:has-text("Kitchen counter")', { wait: 600 });
    await tap('.lv-sq.plus', { wait: 400 }); await tap('.lc-choose', { wait: 500 }); await shot('H choose outside place');
    const rows = await page.locator('.where-list .wl-row').allInnerTexts(); console.log('H rows:', rows.map(r => r.replace(/\s+/g, ' ')).join(' | '));
    check('H', 'outside a place, the list offers no boxes', !rows.some(r => /a box ·/i.test(r)), '');
    await page.locator('.wl-search input').fill('tin'); await page.waitForTimeout(300); const rows2 = await page.locator('.where-list .wl-row').allInnerTexts(); console.log('H search tin:', rows2.join(' | ').replace(/\s+/g, ' '));
    check('H', 'searching "tin" outside a place does not offer the Tin box', !rows2.some(r => /tin box/i.test(r)), '');
    await page.keyboard.press('Escape'); await page.waitForTimeout(300); if (await page.locator('.sheet .btn-quiet:has-text("Cancel")').count()) await tap('.sheet .btn-quiet:has-text("Cancel")');
    await tap('.lc-x', { wait: 500 }); if (await page.locator('button:has-text("Throw away")').count()) await tap('button:has-text("Throw away")', { wait: 600 });
    // --- I: picking a box brings its chain; change the box's place, Q3 line; Save ---
    await home(); await page.click(LOG); await page.waitForTimeout(900);
    AI = { name: 'drill bits' }; await cam('tin.jpg'); await tap('.lc-shutter', { wait: 1800 });
    await tap('.lv-sq.plus', { wait: 400 }); await tap('.lc-choose', { wait: 500 }); await page.locator('.wl-search input').fill('tin'); await page.waitForTimeout(300); await tap('.where-list .wl-row:has-text("Tin box")', { wait: 700 });
    s = await st(); console.log('I after pick Tin box', JSON.stringify(s)); await shot('I tin box picked');
    check('I', 'picking Tin box brings Garage as level 2', s.squares.length === 2 && /Garage/.test(s.squares[1]), JSON.stringify(s.squares));
    // + adds on top of Garage
    await tap('.lv-sq.plus', { wait: 400 }); s = await st(); console.log('I after +', JSON.stringify(s));
    check('I', '+ adds a 3rd level on top (what the Garage is in)', s.squares.length === 3, JSON.stringify(s.squares));
    await tap('.lc-choose', { wait: 500 }); await page.locator('.wl-search input').fill('House'); await page.keyboard.press('Enter'); await page.waitForTimeout(600);
    s = await st(); console.log('I 3 levels', JSON.stringify(s));
    await tap('.lc-k.sv', { wait: 2500 }); await shot('I saved card'); const cardTxt = (await bodyText()).slice(-300).replace(/\s+/g, ' '); console.log('I card', cardTxt);
    check('I', 'data: drill bits > Tin box > Garage > House', (await chainOf('drill bits')) === 'drill bits > Tin box > Garage > House', await chainOf('drill bits'));
    // shoe rack also in Garage: its page should now show Garage in House too
    await openItem('shoe rack'); const sr = (await bodyText()).replace(/\s+/g, ' ').match(/WHERE IT IS(.*?)Move it/i); console.log('I shoe rack page', sr && sr[1]); await shot('I shoe rack page');
    check('I', 'another box in the Garage now reads Garage in House too', sr && /Garage\s*in\s*House/.test(sr[1]), sr && sr[1]);
