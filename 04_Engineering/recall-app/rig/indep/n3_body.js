    await seedHouse(); await page.evaluate(() => window.__rig.rules(true));
    page.on('dialog', async d => { console.log('NATIVE DIALOG', d.type(), d.message()); await d.accept(); });
    const places = async () => { await home(); await tap('.menu-btn', { wait: 500 }); await tap('.drawer-row:has-text("Places")', { wait: 800 }); };
    const openPlace = async (nm) => { await places(); await page.locator(`.loc-row:has-text("${nm}")`).first().click(); await page.waitForTimeout(700); };
    const plDoc = (nm) => page.evaluate((n) => window.__rig.dump().filter(x => x.kind === 'place' && (x.name||'').toLowerCase() === n.toLowerCase()).map(x => ({ id: x.id, deleted: !!x.deleted, photos: (x.photos||[]).length, parent: x.parent })), nm);
    const openItem = async (nm) => { await home(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', nm); await page.waitForTimeout(450); await page.locator('.ask .tile').first().click(); await page.waitForSelector('.card.thing'); await page.waitForTimeout(400); };
    const pageWhere = () => page.evaluate(() => { const t = document.body.innerText.replace(/\s+/g, ' '); const m = t.match(/WHERE IT IS(.*?)Move it/i); return m ? m[1].trim() : 'NO WHERE CARD'; });
    // 1. rename Kitchen counter (holds spare batteries) -> Stove counter
    await openPlace('Kitchen counter'); await tap('.field-value', { wait: 500 }); await ui('rename sheet'); await shot('rename sheet');
    const inp = page.locator('.sheet input, input').first(); await inp.fill('Stove counter'); await shot('rename typed');
    const okBtn = page.locator('.sheet .btn-primary').first(); if (await okBtn.count()) await okBtn.click(); else await page.keyboard.press('Enter'); await page.waitForTimeout(800);
    await ui('after rename'); await shot('after rename');
    console.log('edges spare batteries:', await edgesOf('spare batteries'), '| loc field:', (await itemDoc('spare batteries')).location, '| places KC', JSON.stringify(await plDoc('Kitchen counter')), 'SC', JSON.stringify(await plDoc('Stove counter')));
    await openItem('spare batteries'); const w = await pageWhere(); console.log('spare batteries page:', w); await shot('item page after place rename');
    check('PL1', 'rename a place: item page says the new name', /Stove counter/.test(w) && !/Kitchen counter/.test(w), w);
    await home(); const ht = await bodyText(); check('PL1', 'home tile says new name', /Stove counter/.test(ht) && !/Kitchen counter/.test(ht), (ht.match(/.*(Kitchen|Stove) counter.*/g) || []).join('|'));
    await places(); const pt = await bodyText(); check('PL1', 'Places list: no Kitchen counter ghost', !/Kitchen counter/.test(pt), ''); console.log('PLACES after rename:', pt.replace(/\n/g, ' | '));
    // the camera's Choose place list
    await home(); await page.click(LOG); await page.waitForTimeout(900); AI = { name: 'whisk' }; await cam('real_spoon.jpg'); await tap('.lc-shutter', { wait: 1800 });
    await tap('.lv-sq.plus', { wait: 400 }); await tap('.lc-choose', { wait: 500 }); const rows = await page.locator('.where-list .wl-row').allInnerTexts(); console.log('choose rows', JSON.stringify(rows.map(r => r.replace(/\s+/g, ' '))));
    check('PL1', 'Choose place list: no Kitchen counter', !rows.some(r => /Kitchen counter/.test(r)), '');
    await page.locator('.wl-search input').fill('Stove'); await page.waitForTimeout(300); await tap('.where-list .wl-row:has-text("Stove counter")', { wait: 400 }); await tap('.lc-k.sv', { wait: 2500 });
    console.log('whisk chain', await chainOf('whisk'), '| places named Stove counter:', JSON.stringify(await plDoc('Stove counter')));
    check('PL1', 'logging into the renamed place makes no duplicate', (await plDoc('Stove counter')).filter(p => !p.deleted).length === 1, JSON.stringify(await plDoc('Stove counter')));
    await openPlace('Stove counter'); const sp = await page.locator('.things-here img').evaluateAll(e => e.map(x => x.alt)); console.log('Stove counter items here', JSON.stringify(sp));
    check('PL1', 'place page lists both items', sp.length === 2, JSON.stringify(sp));
    // 2. rename to an existing name
    await tap('.field-value', { wait: 500 }); await page.locator('.sheet input, input').first().fill('Pantry shelf'); const okb = page.locator('.sheet .btn-primary').first(); if (await okb.count()) await okb.click(); else await page.keyboard.press('Enter'); await page.waitForTimeout(800);
    await ui('rename to existing'); await shot('rename to existing name');
    console.log('after dup rename: SC', JSON.stringify(await plDoc('Stove counter')), 'PS', JSON.stringify(await plDoc('Pantry shelf')), 'whisk', await chainOf('whisk'));
    if (await page.locator('.sheet').count()) { const c = page.locator('.sheet .btn-quiet, .sheet button:has-text("Cancel")').first(); if (await c.count()) await c.click(); await page.waitForTimeout(400); }
    // 3. photos: add one, remove main photo
    await openPlace('Linen closet'); let pd = await plDoc('Linen closet'); console.log('linen photos', JSON.stringify(pd));
    await tap('.place-photo.add', { wait: 900 }); await ui('after tap add photo'); await shot('place add photo');
    if (await page.locator('.lc-shutter, .shutter, button[aria-label*="photo" i]').count()) { await cam('real_cetaphil.jpg'); const sh = page.locator('.lc-shutter, .shutter').first(); if (await sh.count()) { await sh.click(); await page.waitForTimeout(1500); } await ui('after place shutter'); await shot('after place shutter'); }
    const done = page.locator('button:has-text("Save"), button:has-text("Done"), button:has-text("Use")').first(); if (await done.count()) { await done.click(); await page.waitForTimeout(1200); }
    pd = await plDoc('Linen closet'); console.log('linen photos after add', JSON.stringify(pd)); await ui('linen page after add'); await shot('linen after add');
    // remove main (first) photo
    await page.locator('.photo-trash').first().click(); await page.waitForTimeout(600); await ui('remove photo sheet'); await shot('remove photo sheet');
    const rm = page.locator('.sheet button:has-text("Remove")').first(); if (await rm.count()) { await rm.click(); await page.waitForTimeout(800); }
    pd = await plDoc('Linen closet'); console.log('linen photos after remove', JSON.stringify(pd)); await shot('linen after remove'); await ui('linen after remove');
    const undo = page.locator('button:text-is("Undo")'); if (await undo.count()) { await undo.first().click(); await page.waitForTimeout(800); console.log('after undo photos', JSON.stringify(await plDoc('Linen closet'))); }
    // 4. remove a place that holds items (Craft nook: tote bin, filing cabinet)
    await openPlace('Craft nook'); await tap('button:has-text("Remove this place")', { wait: 600 }); await ui('remove place sheet'); await shot('remove place sheet');
    const rp = page.locator('.sheet button:has-text("Remove")').first(); if (await rp.count()) { await rp.click(); await page.waitForTimeout(900); }
    await ui('after remove place'); await shot('after remove place');
    console.log('tote bin', await chainOf('tote bin'), 'loc', (await itemDoc('tote bin')).location, '| craft nook docs', JSON.stringify(await plDoc('Craft nook')));
    await home(); const h2 = await bodyText(); console.log('home after removing Craft nook:', h2.replace(/\n/g, ' | ').slice(0, 600)); await shot('home after remove place');
    await openItem('tote bin'); console.log('tote bin page:', await pageWhere()); await shot('tote bin page after place removed');
    const u2 = page.locator('button:text-is("Undo")'); console.log('undo visible after remove place?', await u2.count());
