    await seedHouse(); await page.evaluate(() => window.__rig.rules(true));
    const st = () => page.evaluate(() => { const t = (q) => (document.querySelector(q) || {}).innerText || ''; return { open: !!document.querySelector('.lc'), squares: [...document.querySelectorAll('.lv-strip .lv-sq:not(.plus)')].map((b) => b.getAttribute('aria-label')), head: t('.lc-name') || t('.lc-top'), place: t('.lc-say').replace(/\s+/g,' '), undo: [...document.querySelectorAll('button')].filter(b => /^Undo$/.test(b.innerText.trim())).length }; });
    const holdSave = async (ms) => { const b = await page.locator('.lc-k.sv').boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await page.waitForTimeout(ms); const txt = await page.locator('.lc-k.sv').innerText().catch(() => '?'); await page.mouse.up(); return txt; };
    const count = (nm) => page.evaluate((n) => window.__rig.dump().filter(x => x.kind === 'item' && !x.deleted && (x.name || '').toLowerCase() === n).length, nm);
    await home(); await page.click(LOG); await page.waitForTimeout(900);
    const names = ['sticky notes', 'paper clips', 'glue stick', 'pencil sharpener'];
    for (let i = 0; i < names.length; i++) {
      AI = { name: names[i] }; await cam(['charger.jpg', 'card.jpg', 'real_pencil.jpg', 'real_spoon.jpg'][i]); await tap('.lc-shutter', { wait: 1800 });
      let s = await st(); console.log(`#${i} after item shot`, JSON.stringify(s));
      if (i === 1) { await tap('.lv-sq.plus', { wait: 400 }); await tap('.lc-choose', { wait: 400 }); await page.locator('.wl-search input').fill('Art cupboard'); await page.keyboard.press('Enter'); await page.waitForTimeout(500); }
      else if (i === 2) { /* no place at all */ }
      else if (s.squares.length === 0) { await tap('.lv-sq.plus', { wait: 400 }); await tap('.lc-choose', { wait: 400 }); const first = await page.locator('.where-list .wl-row').first().innerText(); console.log(`#${i} choose first row: ${first.replace(/\s+/g, ' ')}`); await page.locator('.wl-search input').fill('Art'); await page.waitForTimeout(250); const r = await page.locator('.where-list .wl-row').allInnerTexts(); console.log(`#${i} rows for Art`, JSON.stringify(r.map(x => x.replace(/\s+/g,' ')))); if (await page.locator('.where-list .wl-row:has-text("Art cupboard")').count()) await tap('.where-list .wl-row:has-text("Art cupboard")', { wait: 400 }); else { await page.locator('.wl-search input').fill('Craft'); await page.waitForTimeout(250); await tap('.where-list .wl-row:has-text("Craft nook")', { wait: 400 }); } }
      s = await st(); console.log(`#${i} before save`, JSON.stringify(s)); await shot(`item ${i} before save`);
      const lbl = await holdSave(1100); await page.waitForTimeout(150); const fl = await bodyText(); console.log(`#${i} held label ${lbl} | flash: ${(fl.match(/.*✓.*|.*saved.*/gi) || []).join(' / ')} | undo buttons: ${(await st()).undo}`); await shot(`flash ${i}`);
      await page.waitForTimeout(1600); s = await st(); console.log(`#${i} next camera`, JSON.stringify(s)); if (!s.open) { console.log('camera closed!'); await ui('closed'); break; }
    }
    for (const n of names) console.log('DATA', n, await count(n), await chainOf(n));
    await shot('4th next camera'); await tap('.lc-x', { wait: 800 }); await ui('after cancel of the next camera'); await shot('after cancel');
    let st2 = await st(); console.log('undo buttons after cancel', st2.undo);
    const undos = page.locator('button:text-is("Undo")'); if (await undos.count()) { const card = await undos.first().evaluate(u => u.parentElement.parentElement.innerText.replace(/\s+/g, ' ')); console.log('UNDO card text', card); await undos.first().click(); await page.waitForTimeout(1000); for (const n of names) console.log('AFTER UNDO', n, await count(n), await chainOf(n)); }
    check('SN', 'all 4 items saved once each', (await Promise.all(names.map(count))).join(',') === '1,1,1,1', (await Promise.all(names.map(count))).join(','));
    const art = await page.evaluate(() => window.__rig.dump().filter(x => x.kind === 'place' && /art cupboard/i.test(x.name || '')).length); console.log('Art cupboard places', art);
    await home(); console.log('home', (await bodyText()).replace(/\n/g, ' | ').slice(0, 400)); await shot('home after sequence');
