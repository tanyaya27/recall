    await page.evaluate(() => window.__rig.rules(true));
    const openItem = async (nm) => { await home(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', nm); await page.waitForTimeout(450); await page.locator('.ask .tile').filter({ hasText: new RegExp(nm, 'i') }).first().click(); await page.waitForSelector('.card.thing'); await page.waitForTimeout(900); };
    const phs = async () => { const d = await dump(); return d.filter(x => x.kind === 'place').map(p => `${p.name}:${(p.photos || []).length}`).join(' '); };
    const sqImgs = () => page.evaluate(() => [...document.querySelectorAll('.lv-strip .lv-sq:not(.plus)')].map(b => { const i = b.querySelector('img'); return b.getAttribute('aria-label') + ' -> ' + (i ? i.src.slice(-40) : 'NO IMG') + ' len' + (i ? i.src.length : 0); }));
    const imgLen = (f) => img(f).length;
    console.log('ref lens: painting', imgLen('real_painting.jpg'), 'closet', imgLen('closet.jpg'), 'pantry(real_painting)', 'linen(real_cetaphil)', imgLen('real_cetaphil.jpg'), 'drawer', imgLen('drawer.jpg'), 'spoon', imgLen('real_spoon.jpg'), 'box', imgLen('box.jpg'));
    console.log('START', await phs());
    // (b) Move it on wallet: + new tier, photograph -> Use this name "Foyer" -> tap square -> Choose place -> Linen closet
    await openItem('wallet'); await tap('button:has-text("Move it")', { wait: 1000 });
    WHERE.push({ name: 'foyer', moves: false }); await tap('.lv-sq.plus', { wait: 400 }); await cam('box14.jpg'); await tap('.lc-shutter', { wait: 4200 });
    await tap('button:has-text("Use this name")', { wait: 700 }); console.log('B1 squares', JSON.stringify(await sqImgs())); await shot('b foyer named');
    await page.locator('.lv-sq[aria-label^="Level 2"]').click(); await page.waitForTimeout(500); console.log('B rows', await page.locator('.sheet-row').allInnerTexts());
    await tap('.sheet-row:has-text("Choose place")', { wait: 600 }); await shot('b choose on foyer'); await page.locator('.wl-search input').fill('Linen'); await page.waitForTimeout(300); await tap('.where-list .wl-row:has-text("Linen closet")', { wait: 600 });
    console.log('B2 squares after pick', JSON.stringify(await sqImgs()), '| say', await text('.lc-say')); await shot('b after pick linen');
    await tap('.lc-k.sv', { wait: 2000 }); console.log('B3 after save', await phs(), '| wallet', await chainOf('wallet'));
    console.log('B3 docs', JSON.stringify((await dump()).filter(x => (x.name||'').match(/wallet|hall table|foyer|linen/i) || (x.kind==='edge' && JSON.stringify(x).match(/w2|Hall table|Linen|Foyer/))).map(x => { const y = { ...x }; delete y.photo; delete y.thumb; if (y.photos) y.photos = y.photos.length; return y; })));
    await openItem('wallet'); console.log('B4 wallet page:', await page.evaluate(() => { const t = document.body.innerText.replace(/\s+/g, ' '); const m = t.match(/WHERE IT IS(.*?)Move it/i); return m ? m[1].trim() : 'NO WHERE CARD'; })); await shot('b wallet page');
    // (a) Move it on glasses: + new tier, photograph -> in the naming sheet pick Pantry shelf directly
    await openItem('reading glasses'); await tap('button:has-text("Move it")', { wait: 1000 });
    WHERE.push({ name: 'foyer', moves: false }); await tap('.lv-sq.plus', { wait: 400 }); await cam('book.jpg'); await tap('.lc-shutter', { wait: 4200 });
    await page.locator('.wl-search input').fill('Pantry'); await page.waitForTimeout(300); await tap('.where-list .wl-row:has-text("Pantry shelf")', { wait: 600 });
    console.log('A1 squares', JSON.stringify(await sqImgs())); await shot('a picked pantry from naming sheet');
    await tap('.lc-k.sv', { wait: 2000 }); console.log('A2 after save', await phs());
    // (c) Move it on spare batteries: photograph level 1 (recognised Kitchen counter, Yes), then Choose place Craft nook on level 1
    await openItem('spare batteries'); await tap('button:has-text("Move it")', { wait: 1000 });
    WHERE.push({ name: 'counter', known: 'Kitchen counter', moves: false }); await cam('real_spoon.jpg'); await tap('.lc-shutter', { wait: 4200 }); await ui('c after L1 photo'); await shot('c after L1 photo');
    if (await page.locator('.lc button:has-text("Yes")').count()) await tap('.lc button:has-text("Yes")', { wait: 600 });
    console.log('C1 squares', JSON.stringify(await sqImgs()));
    await page.locator('.lv-sq[aria-label^="Level 1"]').click(); await page.waitForTimeout(500); console.log('C rows', await page.locator('.sheet-row').allInnerTexts());
    if (await page.locator('.sheet-row:has-text("Choose place")').count()) await tap('.sheet-row:has-text("Choose place")', { wait: 600 }); else await tap('.lc-choose', { wait: 600 });
    await page.locator('.wl-search input').fill('Craft'); await page.waitForTimeout(300); await tap('.where-list .wl-row:has-text("Craft nook")', { wait: 600 });
    console.log('C2 squares', JSON.stringify(await sqImgs())); await shot('c after pick craft');
    await tap('.lc-k.sv', { wait: 2000 }); console.log('C3 after save', await phs(), '| batteries', await chainOf('spare batteries'));
    // (d) Log: item, + tier photo named "Hall shelf", then choose Garage shelf on it
    await home(); await page.click(LOG); await page.waitForTimeout(900); AI = { name: 'egg timer' }; await cam('real_spoon.jpg'); await tap('.lc-shutter', { wait: 1800 });
    WHERE.push({ name: 'hall shelf', moves: false }); await tap('.lv-sq.plus', { wait: 400 }); await cam('box14.jpg'); await tap('.lc-shutter', { wait: 4200 }); await tap('button:has-text("Use this name")', { wait: 700 });
    await page.locator('.lv-sq[aria-label^="Level 1"]').click(); await page.waitForTimeout(500); console.log('D rows', await page.locator('.sheet-row').allInnerTexts());
    await tap('.sheet-row:has-text("Choose place")', { wait: 600 }); await page.locator('.wl-search input').fill('Garage sh'); await page.waitForTimeout(300); await tap('.where-list .wl-row:has-text("Garage shelf")', { wait: 600 });
    console.log('D1 squares', JSON.stringify(await sqImgs())); await shot('d log after pick'); await tap('.lc-k.sv', { wait: 2000 }); console.log('D2 after save', await phs(), '| egg', await chainOf('egg timer'));
