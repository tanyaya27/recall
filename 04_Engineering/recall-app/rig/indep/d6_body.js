    const now = Date.now(), H = 3600e3, D = 24 * H;
    const E = (id, from, to, ago) => ({ id, kind: 'edge', rel: 'in', from, to, since: now - ago, until: null, how: 'chosen', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [] });
    const base = { kind: 'item', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [] };
    await page.evaluate((docs) => window.__rig.seed(docs), [
      { ...base, id: 'wk', name: 'spare key', location: 'Pantry shelf', photo: null, thumb: null, written: true, order: now - 3 * D, createdAt: now - 3 * D, lastSeenAt: now - 3 * D, logId: 'l_wk', photoCount: 0, history: [{ location: 'Pantry shelf', at: now - 3 * D }] },
      E('ewk', 'wk', { t: 'place', name: 'Pantry shelf' }, 3 * D),
      { ...base, id: 'oh', name: 'old radio', location: 'Linen closet', photo: null, thumb: null, written: true, order: now - 9 * D, createdAt: now - 9 * D, lastSeenAt: now - 2 * D, logId: 'l_oh', photoCount: 0, history: [{ location: 'Garage', at: now - 9 * D }, { location: 'Linen closet', at: now - 2 * D }] },
      E('eoh', 'oh', { t: 'place', name: 'Linen closet' }, 2 * D),
    ]);
    await page.evaluate(() => window.__rig.rules(true));
    const openItem = async (nm) => { await home(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', nm); await page.waitForTimeout(450); await page.locator('.ask .tile').filter({ hasText: new RegExp(nm, 'i') }).first().click(); await page.waitForSelector('.card.thing'); await page.waitForTimeout(900); };
    const pageWhere = () => page.evaluate(() => { const t = document.body.innerText.replace(/\s+/g, ' '); const m = t.match(/WHERE IT IS(.*?)Move it/i); return m ? m[1].trim() : 'NO WHERE CARD'; });
    const photoTime = () => page.evaluate(() => { const t = document.body.innerText.split('\n').map(s => s.trim()).filter(Boolean); return t.slice(0, 3).join(' / '); });
    const moveTo = async (place) => { await tap('button:has-text("Move it")', { wait: 900 }); await tap('.lc-choose', { wait: 500 }); await page.locator('.wl-search input').fill(place.slice(0, 5)); await page.waitForTimeout(300); await tap(`.where-list .wl-row:has-text("${place}")`, { wait: 400 }); await tap('.lc-k.sv', { wait: 1500 }); };
    // A. glasses (photo 1h ago): move without photo
    await openItem('reading glasses'); console.log('A0 glasses:', await pageWhere(), '||', await photoTime());
    await moveTo('Pantry shelf'); console.log('A1 after move:', await pageWhere(), '||', await photoTime()); await shot('glasses after move');
    await page.locator('.card.thing img').first().click(); await page.waitForTimeout(600); console.log('A1 viewer:', await page.evaluate(() => (document.querySelector('.d2-top') || {}).innerText)); await page.locator('.d2-x').click(); await page.waitForTimeout(300);
    // Undo from note
    if (await page.locator('button:has-text("Undo")').count()) { await tap('button:has-text("Undo")', { wait: 1200 }); console.log('A2 after undo:', await pageWhere(), '||', await photoTime()); await shot('glasses after undo'); }
    await openItem('reading glasses'); console.log('A3 reopened:', await pageWhere());
    // B. Move then Add photo
    await moveTo('Linen closet'); console.log('B1 moved:', await pageWhere());
    await openItem('reading glasses'); await tap('.d1-pill', { wait: 1000 }); await ui('add photo camera'); AI = { name: 'reading glasses' }; SAME = { index: 0, sure: true }; await cam('glasses.jpg'); await tap('.shutter', { wait: 2000 }); await ui('after add photo shutter');
    if (await page.locator('.camera-done').count()) await tap('.camera-done', { wait: 2000 }); await ui('after done');
    await openItem('reading glasses'); console.log('B2 after add photo:', await pageWhere(), '||', await photoTime()); await shot('glasses after add photo');
    // C. written item, old item with history
    await openItem('spare key'); console.log('C1 written:', await pageWhere()); await shot('written item');
    await moveTo('Linen closet'); console.log('C2 written moved:', await pageWhere()); await shot('written moved');
    await openItem('old radio'); console.log('C3 old radio:', await pageWhere()); await shot('old radio');
    // D. move the wooden box -> baseball card
    await openItem('baseball card'); console.log('D0 card:', await pageWhere());
    await openItem('wooden box'); await moveTo('Garage shelf'); console.log('D1 wooden box:', await pageWhere());
    await openItem('baseball card'); console.log('D2 card after box move:', await pageWhere()); await shot('card after box move');
    // E. baseball card: Move it -> level 2 (wooden box) -> choose Craft nook
    await openItem('yearbook'); console.log('E0 yearbook:', await pageWhere());
    await openItem('memorabilia box'); await moveTo('Linen closet'); await openItem('yearbook'); console.log('E1 yearbook after its box moved:', await pageWhere()); await shot('yearbook after box moved');
    // F. Log then Move (new item)
    await home(); await page.click(LOG); await page.waitForTimeout(900); AI = { name: 'egg timer' }; await cam('real_spoon.jpg'); await tap('.lc-shutter', { wait: 1800 });
    await tap('.lc-choose', { wait: 500 }); await page.locator('.wl-search input').fill('Kitch'); await page.waitForTimeout(300); await tap('.where-list .wl-row:has-text("Kitchen counter")', { wait: 400 }); await tap('.lc-k.sv', { wait: 1500 });
    await page.waitForTimeout(2000); await openItem('egg timer'); console.log('F1 logged:', await pageWhere(), '||', await photoTime());
    await moveTo('Craft nook'); console.log('F2 moved:', await pageWhere(), '||', await photoTime()); await shot('egg after log then move');
    // G. Add a tier on top of glasses place (Linen closet in ... ) = not a move
    await openItem('spare batteries'); console.log('G0 batteries:', await pageWhere());
    await tap('button:has-text("Move it")', { wait: 900 }); await tap('.lv-sq.plus', { wait: 400 }); await tap('.lc-choose', { wait: 500 }); await page.locator('.wl-search input').fill('Pantry'); await page.waitForTimeout(300); await tap('.where-list .wl-row:has-text("Pantry shelf")', { wait: 400 });
    console.log('G squares', await page.locator('.lv-sq').evaluateAll(a => a.map(b => b.getAttribute('aria-label')))); await tap('.lc-k.sv', { wait: 1500 });
    await openItem('spare batteries'); console.log('G1 batteries after adding tier on top:', await pageWhere()); await shot('batteries tier on top');
    console.log('chains', await chainOf('spare batteries'), '|', await chainOf('baseball card'), '|', await chainOf('yearbook 1978'));
