    const now = Date.now(), H = 3600e3;
    const before = (await dump()).length;
    await page.evaluate(([a, b, c, now, H]) => window.__rig.seed([{ id: 'plH', kind: 'place', owner: 'margaret', by: 'margaret', private: false, name: 'Hall table', order: now - 50 * H, createdAt: now - 50 * H, parent: null,
      photos: [{ photo: a, thumb: a, at: now - 50 * H }, { photo: b, thumb: b, at: now - 20 * H }, { photo: c, thumb: c, at: now - 2 * H }] }]), [img('real_desk.jpg'), img('closet.jpg'), img('drawer.jpg'), now, H]);
    await page.waitForTimeout(300); console.log('docs before/after seed', before, (await dump()).length, (await placeByName('Hall table'))?.photos?.length);
    await page.evaluate(() => window.__rig.rules(true));
    const openItem = async (nm) => { await home(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', nm); await page.waitForTimeout(450); await page.locator('.ask .tile').filter({ hasText: new RegExp(nm, 'i') }).first().click(); await page.waitForSelector('.card.thing'); await page.waitForTimeout(600); };
    const vtitle = () => page.evaluate(() => { const x = document.querySelector('.d2-x'); if (!x) return 'NO VIEWER'; let c = x.parentElement; return c.innerText.replace(/\s+/g, ' '); });
    const hit = (sel) => page.evaluate((q) => { const e = document.querySelector(q); if (!e) return 'none'; const r = e.getBoundingClientRect(); const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return (t === e || e.contains(t)) ? 'ON TOP' : 'covered by ' + (t ? t.tagName + '.' + t.className : 'null'); }, sel);
    // wallet at Hall table (3 photos) -> item page ph-open
    await openItem('wallet'); await ui('wallet page');
    if (await page.locator('.ph-open').count()) { await page.locator('.ph-open').first().click(); await page.waitForTimeout(600); console.log('ITEMPAGE place viewer:', await vtitle()); await shot('wallet hall table viewer');
      const sw = async () => { const b = await page.locator('.d2-x').boundingBox(); await page.mouse.move(300, 420); await page.mouse.down(); await page.mouse.move(80, 430, { steps: 8 }); await page.mouse.up(); await page.waitForTimeout(600); };
      await sw(); console.log('after swipe:', await vtitle()); await sw(); console.log('after swipe2:', await vtitle()); await shot('hall table swiped');
      await page.locator('.d2-x').click(); await page.waitForTimeout(400); }
    // Move it -> level 1 -> see its photos (camera)
    await tap('button:has-text("Move it")', { wait: 1000 });
    await page.locator('.lv-sq[aria-label^="Level 1"]').click(); await page.waitForTimeout(600);
    if (!(await page.locator('.tier-sheet, .sheet-row').count())) { await page.locator('.lv-sq[aria-label^="Level 1"]').click(); await page.waitForTimeout(600); }
    await tap('button.sheet-row:has-text("See its photos")', { wait: 700 }); console.log('CAMERA viewer:', await vtitle()); await ui('camera hall viewer'); await shot('camera hall viewer');
    console.log('close hit', await hit('.d2-x'), '| shutter under?', await hit('.lc-shutter'), '| save', await hit('.lc-k.sv'));
    const sw2 = async () => { await page.mouse.move(300, 420); await page.mouse.down(); await page.mouse.move(80, 430, { steps: 8 }); await page.mouse.up(); await page.waitForTimeout(600); };
    await sw2(); console.log('camera after swipe:', await vtitle()); await shot('camera hall swiped');
    // touch swipe too
    await page.locator('.d2-x').click(); await page.waitForTimeout(500); await ui('after closing camera viewer'); await shot('after closing camera viewer');
    console.log('where still in camera? say=', await text('.lc-say'));
    // now new tier photo: + , photograph new place "Foyer"
    WHERE.push({ name: 'foyer', moves: false }); await tap('.lv-sq.plus', { wait: 400 }); await cam('real_painting.jpg'); await tap('.lc-shutter', { wait: 4200 }); await ui('after tier photo'); await shot('after tier photo');
