    await page.evaluate(() => window.__rig.rules(true));
    const openItem = async (nm) => { await home(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', nm); await page.waitForTimeout(450); await page.locator('.ask .tile').filter({ hasText: new RegExp(nm, 'i') }).first().click(); await page.waitForSelector('.card.thing'); await page.waitForTimeout(600); };
    const vtitle = () => page.evaluate(() => { const x = document.querySelector('.d2-x'); if (!x) return 'NO VIEWER'; let c = x.parentElement; return c.innerText.replace(/\s+/g, ' '); });
    const vdom = () => page.evaluate(() => { const x = document.querySelector('.d2-x'); if (!x) return 'none'; let root = x; while (root.parentElement && root.parentElement !== document.body) root = root.parentElement;
      const walk = (e, d) => { if (d > 5) return ''; const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); let s = '  '.repeat(d) + e.tagName.toLowerCase() + '.' + String(e.className).replace(/\s+/g, '.') + ` ${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)} ov=${cs.overflowX} z=${cs.zIndex} sw=${e.scrollWidth}\n`; for (const c of e.children) s += walk(c, d + 1); return s; };
      return walk(root, 0); });
    // Log a new item, 2 tiers photographed now
    await home(); await page.click(LOG); await page.waitForTimeout(900);
    AI = { name: 'egg timer' }; await cam('real_spoon.jpg'); await tap('.lc-shutter', { wait: 1800 });
    WHERE.push({ name: "foyer bench", moves: false }); await tap(".lv-sq.plus", { wait: 400 }); await cam('real_painting.jpg'); await tap('.lc-shutter', { wait: 4200 });
    await ui('after L1 photo');
    if (await page.locator('button:has-text("Use this name")').count()) await tap('button:has-text("Use this name")', { wait: 600 });
    // second photo of the same tier? tap shutter again with L1 selected
    await page.locator('.lv-sq[aria-label^="Level 1"]').click(); await page.waitForTimeout(500); await ui('L1 tapped (log)'); await shot('log L1 sheet');
    await tap('button.sheet-row:has-text("See its photos")', { wait: 700 }); console.log('LOG tier viewer:', await vtitle()); console.log(await vdom()); await shot('log tier viewer');
    await ui('log tier viewer');
