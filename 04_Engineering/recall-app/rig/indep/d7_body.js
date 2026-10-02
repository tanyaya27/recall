    await page.evaluate(() => window.__rig.rules(true));
    const openItem = async (nm) => { await home(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', nm); await page.waitForTimeout(450); await page.locator('.ask .tile').filter({ hasText: new RegExp(nm, 'i') }).first().click(); await page.waitForSelector('.card.thing'); await page.waitForTimeout(900); };
    const sheetInfo = () => page.evaluate(() => { const srch = document.querySelector('.wl-search'); if (!srch) return 'NO SHEET'; const root = srch.closest('[class*=sheet]') || document.body; const lim = srch.getBoundingClientRect().top;
      const hdr = [...root.querySelectorAll('*')].filter(e => e.children.length === 0 && (e.innerText || '').trim() && e.getBoundingClientRect().height > 0 && e.getBoundingClientRect().top < lim).map(e => { const cs = getComputedStyle(e); const ring = cs.borderStyle !== 'none' && parseFloat(cs.borderWidth) > 0 ? '[RING]' : ''; return e.innerText.trim() + ring; });
      const rows = [...root.querySelectorAll('.wl-row')].map(r => r.innerText.replace(/\s+/g, ' ')).filter(t => /current/i.test(t));
      return 'HDR: ' + hdr.join(' | ') + '\n   CURRENT-BADGE rows: ' + JSON.stringify(rows) + ' root=' + root.className; });
    const chainline = () => page.evaluate(() => { const e = document.querySelector('.lc-chainline'); if (!e) return 'no chainline'; return [...e.querySelectorAll('*')].filter(x => x.children.length === 0).map(x => { const cs = getComputedStyle(x); return x.innerText.trim() + (parseFloat(cs.borderWidth) > 0 && cs.borderStyle !== 'none' ? '[RING]' : ''); }).join(' '); });
    const closeSheet = async () => { const c = page.locator('.btn-quiet:has-text("Cancel")').last(); if (await c.count()) { await c.click(); await page.waitForTimeout(400); } };
    await openItem('baseball card'); await tap('button:has-text("Move it")', { wait: 1000 });
    const labels = await page.locator('.lv-strip .lv-sq:not(.plus)').evaluateAll(a => a.map(b => b.getAttribute('aria-label'))); console.log('SQUARES', labels);
    for (let i = 1; i <= labels.length; i++) {
      await page.locator(`.lv-sq[aria-label^="Level ${i}"]`).click(); await page.waitForTimeout(500);
      if (await page.locator('.sheet-row').count()) { console.log(`L${i} sheet rows`, await page.locator('.sheet-row').allInnerTexts()); await tap('.btn-quiet:has-text("Close")', { wait: 400 }); }
      console.log(`L${i} say: ${await text('.lc-say')} | chainline: ${await chainline()} | prompt: ${(await text('.lc-prompt')).replace(/\s+/g,' ')}`);
      await tap('.lc-choose', { wait: 600 }); console.log(`L${i} CHOOSE`, await sheetInfo()); await shot(`choose place L${i}`); await closeSheet();
    }
    // via sheet row Choose place on level 2
    await page.locator('.lv-sq[aria-label^="Level 2"]').click(); await page.waitForTimeout(500);
    if (await page.locator('.sheet-row:has-text("Choose place")').count()) { await tap('.sheet-row:has-text("Choose place")', { wait: 600 }); console.log('L2 via sheet-row CHOOSE', await sheetInfo()); await shot('choose L2 via row'); await closeSheet(); }
    // pick on level 2: Pantry shelf -> what happens to squares
    await page.locator('.lv-sq[aria-label^="Level 2"]').click(); await page.waitForTimeout(400); if (await page.locator('.sheet-row').count()) await tap('.btn-quiet:has-text("Close")', { wait: 300 });
    await tap('.lc-choose', { wait: 500 }); await page.locator('.wl-search input').fill('Pantry'); await page.waitForTimeout(300); await tap('.where-list .wl-row:has-text("Pantry shelf")', { wait: 500 });
    console.log('after L2 pick squares', await page.locator('.lv-strip .lv-sq:not(.plus)').evaluateAll(a => a.map(b => b.getAttribute('aria-label'))), '| say', await text('.lc-say'), '| chain', await chainline()); await shot('after L2 pick');
    // + new tier then Choose place
    await tap('.lv-sq.plus', { wait: 500 }); console.log('after + squares', await page.locator('.lv-strip .lv-sq:not(.plus)').evaluateAll(a => a.map(b => b.getAttribute('aria-label'))), '| prompt', (await text('.lc-prompt')).replace(/\s+/g, ' '));
    await tap('.lc-choose', { wait: 600 }); console.log('NEW TIER CHOOSE', await sheetInfo()); await shot('choose on new tier'); await closeSheet();
    await tap('.lc-x', { wait: 500 }); if (await page.locator('button:has-text("Throw away")').count()) await tap('button:has-text("Throw away")');
    // Log mode
    await home(); await page.click(LOG); await page.waitForTimeout(900); AI = { name: 'egg timer' }; await cam('real_spoon.jpg'); await tap('.lc-shutter', { wait: 1800 });
    await tap('.lc-choose', { wait: 600 }); console.log('LOG L1 CHOOSE', await sheetInfo()); await shot('log choose L1');
    await page.locator('.wl-search input').fill('wooden'); await page.waitForTimeout(300); await tap('.where-list .wl-row:has-text("Wooden box")', { wait: 600 });
    console.log('LOG after pick wooden box squares', await page.locator('.lv-strip .lv-sq:not(.plus)').evaluateAll(a => a.map(b => b.getAttribute('aria-label'))));
    await page.locator('.lv-sq[aria-label^="Level 2"]').click(); await page.waitForTimeout(500); if (await page.locator('.sheet-row').count()) { console.log('LOG L2 rows', await page.locator('.sheet-row').allInnerTexts()); await tap('.btn-quiet:has-text("Close")', { wait: 300 }); }
    await tap('.lc-choose', { wait: 600 }); console.log('LOG L2 CHOOSE', await sheetInfo()); await shot('log choose L2'); await closeSheet();
