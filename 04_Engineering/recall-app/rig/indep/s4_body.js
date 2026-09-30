    const SIZE = process.env.SIZE || 'Largest'; const VW = Number(process.env.VW || 375), VH = Number(process.env.VH || 667); const KB = VH < 700 ? 300 : 380;
    await page.setViewportSize({ width: VW, height: VH });
    await kbInit();
    await seedHouse(); await page.evaluate(() => window.__rig.rules(true));
    await home(); await tap('.menu-btn', { wait: 500 }); await tap('.drawer-row:has-text("Text size")', { wait: 600 }); await tap(`button:text-is("${SIZE}")`, { wait: 400 });
    const st = () => page.evaluate(() => { const t = (q) => (document.querySelector(q) || {}).innerText || '';
      return { squares: [...document.querySelectorAll('.lv-strip .lv-sq:not(.plus)')].map((b) => b.getAttribute('aria-label')), place: t('.lc-say').replace(/\s+/g,' '), chain: t('.lc-chainline').replace(/\s+/g, ' '), prompt: t('.lc-prompt').replace(/\s+/g,' ') }; });
    // layout audit of the camera card: visible controls inside the viewport and not overlapping each other
    const audit = async (label) => { const r = await page.evaluate(() => {
        const vis = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0'; };
        const root = document.querySelector('.lc'); if (!root) return { none: true };
        const sheet = document.querySelector('.sheet-back');
        const els = [...root.querySelectorAll('button, input, .lc-say, .lc-prompt, .lc-chainline')].filter(vis).filter(e => !(sheet && sheet.contains(e)) || true);
        const R = els.map(e => { const r = e.getBoundingClientRect(); return { n: (e.getAttribute('aria-label') || e.className || e.tagName).toString().slice(0, 40) + ' "' + (e.innerText || e.value || '').replace(/\s+/g, ' ').slice(0, 30) + '"', inStrip: !!e.closest('.lv-strip'), inSheet: !!(sheet && sheet.contains(e)), x: r.left, y: r.top, w: r.width, h: r.height, r: r.right, b: r.bottom }; });
        const out = []; const W = innerWidth, H = innerHeight;
        for (const a of R) { if (!a.inStrip && (a.x < -1 || a.r > W + 1 || a.y < -1 || a.b > H + 1)) out.push('OUTSIDE ' + a.n + ` [${Math.round(a.x)},${Math.round(a.y)} ${Math.round(a.w)}x${Math.round(a.h)}]`); }
        const cardOnly = R.filter(a => !a.inSheet && !sheet);
        for (let i = 0; i < cardOnly.length; i++) for (let j = i + 1; j < cardOnly.length; j++) { const a = cardOnly[i], b = cardOnly[j];
          const ix = Math.min(a.r, b.r) - Math.max(a.x, b.x), iy = Math.min(a.b, b.b) - Math.max(a.y, b.y);
          if (ix > 3 && iy > 3) { const contains = (p, q) => p.x <= q.x + 1 && p.y <= q.y + 1 && p.r >= q.r - 1 && p.b >= q.b - 1; if (!contains(a, b) && !contains(b, a)) out.push(`OVERLAP ${a.n} <> ${b.n}`); } }
        // text clipped (scrollWidth > clientWidth with overflow hidden)
        for (const e of root.querySelectorAll('.lc-say, .lc-prompt, .lc-chainline, .lc-name, button')) { if (!vis(e)) continue; const s = getComputedStyle(e); if ((e.scrollWidth > e.clientWidth + 2 && s.overflowX !== 'visible' && s.overflowX !== 'auto' && s.overflowX !== 'scroll') || (e.scrollHeight > e.clientHeight + 2 && s.overflowY === 'hidden')) out.push('CLIPPED ' + (e.getAttribute('aria-label') || e.className) + ' "' + (e.innerText || '').replace(/\s+/g, ' ').slice(0, 40) + '"'); }
        return { out }; });
      if (r.none) { console.log(label, 'no camera'); return []; }
      console.log(`AUDIT ${label}: ${r.out.length ? '\n   ' + r.out.join('\n   ') : 'ok'}`); return r.out; };
    const probs = {};
    const A = async (label) => { const o = await audit(label); probs[label] = o; await shot(label); return o; };
    // --- Log item with 3 levels at this size ---
    await home(); await page.click(LOG); await page.waitForTimeout(900); await A('log start');
    AI = { name: 'extra long named cordless screwdriver set' }; await cam('tooldrawer.jpg'); await tap('.lc-shutter', { wait: 1800 }); await A('item shot');
    await tap('.lv-sq.plus', { wait: 400 }); await A('level1 empty');
    WHERE.push({ name: 'blue plastic toolbox', moves: true }); await cam('box.jpg'); await tap('.lc-shutter', { wait: 3800 });
    // name sheet with keyboard
    const pend = page.locator('.wl-pend input');
    if (await pend.count()) { await pend.click(); await kbUp(KB); await page.waitForTimeout(300);
      const a1 = await aboveKb('.wl-pend input', KB), a2 = await aboveKb('.wl-pend .btn-primary', KB); await shot('name sheet kb up');
      check('K', `${SIZE} ${VW}x${VH}: name field above keyboard`, a1.ok, JSON.stringify(a1)); check('K', `${SIZE} ${VW}x${VH}: "Use this name" above keyboard`, a2.ok, JSON.stringify(a2));
      await pend.fill('Blue toolbox'); await page.keyboard.press('Enter'); await page.waitForTimeout(600); await kbDown(); }
    let s = await st(); console.log('after naming via Go', JSON.stringify(s));
    check('K', `${SIZE}: Go on the keyboard names the new place`, s.squares.some(x => /Blue toolbox/.test(x)), JSON.stringify(s.squares));
    if (await page.locator('.wl-pend .btn-primary').count()) await tap('.wl-pend .btn-primary', { wait: 600 });
    await A('level1 named');
    await tap('.lv-sq.plus', { wait: 400 }); await tap('.lc-choose', { wait: 500 });
    await page.locator('.wl-search input').click(); await kbUp(KB); await page.keyboard.type('Garage workbench', { delay: 20 }); await page.waitForTimeout(300);
    const b1 = await aboveKb('.wl-search input', KB), b2 = await aboveKb('.wl-new.typed', KB); await shot('choose place kb up');
    check('K', `${SIZE} ${VW}x${VH}: search field + "A new place called" above keyboard`, b1.ok && b2.ok, JSON.stringify([b1, b2]));
    await page.keyboard.press('Enter'); await page.waitForTimeout(600); await kbDown(); await A('level2 set');
    await tap('.lv-sq.plus', { wait: 400 }); await tap('.lc-choose', { wait: 500 }); await page.locator('.wl-search input').fill('Garage'); await page.waitForTimeout(300);
    await tap('.where-list .wl-row:has-text("Garage") >> nth=0', { wait: 600 }); s = await st(); console.log('3 levels', JSON.stringify(s)); await A('3 levels');
    const cardBox = await page.locator('.lc-card, .lc .card, .lc-b > div').first().boundingBox().catch(() => null);
    await tap('.lc-k.sv', { wait: 2500 }); await shot('saved card');
    const toast = await page.evaluate(() => { const u = [...document.querySelectorAll('button')].find(b => /^Undo$/.test(b.innerText.trim())); if (!u) return null; let c = u; for (let i = 0; i < 4 && c.parentElement; i++) c = c.parentElement; const r = c.getBoundingClientRect(); const f = document.querySelector('.footer'); const fr = f ? f.getBoundingClientRect() : null; return { top: r.top, bottom: r.bottom, h: innerHeight, footerTop: fr && fr.top, text: c.innerText.replace(/\s+/g, ' ') }; });
    console.log('saved card', JSON.stringify(toast));
    check('K', `${SIZE} ${VW}x${VH}: saved card fully on screen`, toast && toast.top >= 0 && toast.bottom <= toast.h, JSON.stringify(toast));
    // --- item page ---
    await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', 'screwdriver'); await page.waitForTimeout(400); await shot('search result');
    const res = await page.locator('.ask').innerText(); console.log('search:', res.replace(/\s+/g, ' '));
    await page.locator('.ask .tile').first().click(); await page.waitForTimeout(600); await shot('item page');
    const ip = await page.evaluate(() => { const out = []; for (const e of document.querySelectorAll('.tp-chain, .tp-chain *')) { const r = e.getBoundingClientRect(); if (r.width && (r.right > innerWidth + 1 || r.left < -1) && !e.closest('[style*="overflow"]')) out.push(e.className + ' ' + Math.round(r.left) + '-' + Math.round(r.right)); } return out.slice(0, 5); });
    console.log('item page chain overflow:', JSON.stringify(ip));
    const words = (await bodyText()).replace(/\s+/g, ' ').match(/WHERE IT IS(.*?)Move it/i); console.log('item page where:', words && words[1]);
    check('K', `${SIZE}: item page words carry all 3 levels`, words && /Blue toolbox\s*in\s*Garage workbench\s*in\s*Garage/.test(words[1]), words && words[1]);
    await tap('button:has-text("Move it")', { wait: 1000 }); s = await st(); console.log('move it', JSON.stringify(s)); await A('move it');
    // change level 2 -> Q3 line
    await page.locator('.lv-sq[aria-label^="Level 2"]').click(); await page.waitForTimeout(400); if (!(await page.locator('.tier-sheet').count())) { await page.locator('.lv-sq[aria-label^="Level 2"]').click(); await page.waitForTimeout(400); }
    await page.locator('.tier-sheet button:has-text("Choose place")').click(); await page.waitForTimeout(500);
    await page.locator('.wl-search input').fill('Pantry'); await page.waitForTimeout(300); await tap('.where-list .wl-row:has-text("Pantry shelf")', { wait: 600 });
    await A('move it Q3 line'); const q3 = await page.evaluate(() => { const e = [...document.querySelectorAll('.lc *')].find(x => x.children.length === 0 && /→/.test(x.innerText || '')); if (!e) return null; const r = e.getBoundingClientRect(); return { t: e.innerText, top: r.top, bottom: r.bottom, right: r.right, sw: e.scrollWidth, cw: e.clientWidth }; });
    console.log('Q3 line', JSON.stringify(q3)); check('K', `${SIZE} ${VW}x${VH}: Q3 line visible on the camera`, q3 && q3.bottom <= VH && q3.right <= VW + 1 && q3.sw <= q3.cw + 2, JSON.stringify(q3));
    await tap('.lc-k.sv', { wait: 1500 }); await shot('move toast');
    const mt = await page.evaluate(() => { const u = [...document.querySelectorAll('button')].find(b => /^Undo$/.test(b.innerText.trim())); if (!u) return null; const c = u.parentElement; const leaf = [...c.querySelectorAll('*')].filter(e => e.children.length === 0 && e !== u); return leaf.map(e => ({ t: e.innerText, sw: e.scrollWidth, cw: e.clientWidth, sh: e.scrollHeight, ch: e.clientHeight })); });
    console.log('move toast', JSON.stringify(mt));
    check('K', `${SIZE} ${VW}x${VH}: Move toast shows the Q3 line un-truncated`, mt && mt.some(x => /→/.test(x.t) && x.sw <= x.cw + 2), JSON.stringify(mt));
    const total = Object.values(probs).flat(); check('K', `${SIZE} ${VW}x${VH}: no camera-card overlaps/outside/clipped`, total.length === 0, total.slice(0, 8).join(' | '));
