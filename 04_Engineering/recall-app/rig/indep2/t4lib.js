    // ---- v4 tier helpers ----
    const upBtns = async () => page.locator('.w1-up').filter({ visible: true }).allInnerTexts();
    const addTier = async () => { const b = page.locator('.w1-up').filter({ visible: true }).last(); if (!(await b.count())) { console.log('   NO + TIER BUTTON'); return false; } const t = await b.innerText(); await b.click(); await page.waitForTimeout(900); console.log('   tapped +', JSON.stringify(t), '| list:', (await sheetText('.in-list')).slice(0, 380)); return true; };
    const listHas = async (nm) => page.locator('.in-list .wl-row').filter({ has: page.locator(`b:text-is("${nm}")`) }).count();
    const listNames = async () => page.evaluate(() => { const s = [...document.querySelectorAll('.in-list')].pop(); return s ? [...s.querySelectorAll('.wl-row b, .wl-new')].map(b => b.innerText.replace(/\s+/g, ' ').trim()) : []; });
    const tapNew = async (re = /New place/) => { const b = page.locator('.in-list button').filter({ hasText: re }).first(); if (!(await b.count())) { console.log('   no New row', String(re)); return false; } const t = await b.innerText(); await b.click(); await page.waitForTimeout(800); console.log('   tapped', JSON.stringify(t.replace(/\s+/g, ' '))); return true; };
    const srchT = async (q) => { const i = page.locator('.in-list input').last(); await i.fill(''); await i.type(q, { delay: 10 }); await page.waitForTimeout(500); const n = await listNames(); console.log(`   SEARCH ${JSON.stringify(q)} -> ${JSON.stringify(n)}`); return n; };
    const card = async (label) => { const t = await page.evaluate(() => { const e = document.querySelector('.lc-card'); return e ? e.innerText.replace(/\n+/g, ' / ') : '(no card)'; }); console.log(`   CARD[${label || ''}] ${t} | + buttons ${JSON.stringify(await upBtns())} | save ${await saveState()}`); return t; };
    const tierX = async (i) => { const xs = page.locator('.lc-card button.x').filter({ visible: true }); const n = await xs.count(); console.log('   x buttons:', n, JSON.stringify(await xs.evaluateAll(a => a.map(b => b.getAttribute('aria-label'))))); if (i >= n) return false; await xs.nth(i).click(); await page.waitForTimeout(600); return true; };
    const chainS = async (nm) => { const c = await chainOf(nm); console.log(`   CHAIN ${c}`); return c; };
    const st4 = async (label, names) => { console.log(`   ---- STORE after ${label}: ${await cnt()}`); for (const n of names) await chainS(n); await allPlaces(); await placeEdges(); console.log('   ', errs()); };
    const cancelList = async () => { const c = page.locator('.in-list .btn-quiet:has-text("Cancel")').last(); if (await c.count()) { await c.scrollIntoViewIfNeeded().catch(() => {}); await c.click(); await page.waitForTimeout(500); console.log('   cancelled list'); } else console.log('   no list Cancel'); };
    const seed4 = async () => { const now = Date.now(), H = 3600e3;
      const P = (f) => ({ photo: img(f), thumb: img(f), thumbV: 2 });
      const T = (id, name, location, f, ago, extra = {}) => ({ id, kind: 'item', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [], name, location, ...P(f), order: now - ago, createdAt: now - ago, lastSeenAt: now - ago, logId: 'l_' + id, photoCount: 1, history: [{ location, at: now - ago }], ...extra });
      const E = (id, from, to, ago) => ({ id, kind: 'edge', rel: 'in', from, to, since: now - ago, until: null, how: 'chosen', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [] });
      const PL = (id, nm, ago) => ({ id, kind: 'place', owner: 'margaret', by: 'margaret', private: false, name: nm, order: now - ago, createdAt: now - ago, parent: null, photos: [] });
      await page.evaluate((s) => window.__rig.seed(s), [
        T('ct', 'cookie tin', '', 'box.jpg', 50 * H, { holds: true }),
        T('sb', 'sewing box', '', 'smallbox.jpg', 51 * H, { holds: true }),
        T('bj', 'button jar', 'Sewing box', 'soda.jpg', 52 * H, { holds: true }),
        T('rc', 'red crate', '', 'box14.jpg', 53 * H, { holds: true }),
        T('bb', 'blue bin', 'Red crate', 'closet.jpg', 54 * H, { holds: true }),
        T('gb', 'green bag', 'Blue bin', 'wallet.jpg', 55 * H, { holds: true }),
        PL('pU', 'Upstairs hall', 60 * H), PL('pA', 'Attic', 61 * H), PL('pB', 'Basement', 62 * H),
        E('ebj', 'bj', { t: 'thing', id: 'sb', name: 'sewing box' }, 52 * H), E('ebb', 'bb', { t: 'thing', id: 'rc', name: 'red crate' }, 54 * H),
        E('egb', 'gb', { t: 'thing', id: 'bb', name: 'blue bin' }, 55 * H), E('epA', 'pA', { t: 'place', name: 'Upstairs hall' }, 61 * H) ]);
      await page.reload(); await page.waitForTimeout(900); await page.evaluate(() => window.__rig.rules(true)); console.log('   seed4 done'); };
    const fresh4 = async (label) => { console.log(`\n######## ${label}`); WHERE.length = 0; await seedHouse(); await seed4(); };
