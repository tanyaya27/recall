    // ---- f-build helpers ----
    const noAuto = () => page.evaluate(() => { window.__noAuto = true; });
    const HTML = (s) => page.evaluate((s) => [...document.querySelectorAll(s)].map(e => e.outerHTML.replace(/(src|url\()(=?)("|&quot;)data:[^"&]*("|&quot;)/g, '$1$2""')).join('\n').slice(0, 4000), s);
    const st = () => page.evaluate(() => {
      const q = (s) => document.querySelector(s); const vis = (e) => { if (!e) return false; const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
      const sq = [...document.querySelectorAll('.lv-sq')].filter(vis).map((b) => { const cs = getComputedStyle(b); const cls = [...b.classList].filter(c => !['lv-sq'].includes(c)).join('.');
        return `${(b.getAttribute('aria-label') || '').replace(/^Level /, 'L').replace('Add a level: what it is in', '+')}[${cls}|${cs.borderTopStyle}${b.querySelector('img') ? '|img' : ''}${b.innerText.trim() ? '|n=' + b.innerText.trim() : ''}]`; });
      const sh = q('.lc-shutter'); const span = sh && sh.querySelector('span'); const shPseudo = sh ? (getComputedStyle(sh, '::before').content + '/' + getComputedStyle(sh, '::after').content) : '';
      const lc = q('.lc-b, .lc'); let prompt = ''; if (lc) { const t = lc.innerText.split('\n').map(s => s.trim()).filter(Boolean); const i = t.findIndex(s => /\?$/.test(s)); prompt = t[i + 1] || ''; }
      const place = [...document.querySelectorAll('*')].find((e) => /^Place:/.test(e.innerText || '') && e.children.length < 3);
      const sheets = [...document.querySelectorAll('.sheet, [role=dialog]')].filter(vis).map(s => (s.className || '').split(' ').slice(0, 3).join('.') + ':' + (s.innerText || '').split('\n')[0].slice(0, 30));
      const inp = q('input.place-input'); const sug = [...document.querySelectorAll('.wl-sugg')].filter(vis).map((e) => e.innerText.replace(/\s+/g, ' ')).join(';');
      return { sq: sq.join(' '), place: place ? place.innerText.replace(/\s+/g, ' ').slice(0, 70) : '', prompt: prompt.slice(0, 110),
        shutter: sh ? `${sh.className.replace('lc-shutter', '').trim() || 'plain'}|${sh.getAttribute('aria-label')}|bg=${span && span.style.backgroundImage ? 'img' : '-'}|${shPseudo}` : '-',
        save: q('.lc-k.sv') ? (q('.lc-k.sv').disabled ? 'OFF' : 'on') : '-', sheets: sheets.join(' ; '), field: inp && vis(inp) ? inp.value : null, sug };
    });
    const S = async (label) => { const s = await st(); console.log(`  ST[${label}] ${JSON.stringify(s)}`); return s; };
    const pickPlace = async (name) => { const l = page.locator('.where-list .wl-row:not(.wl-sugg)').filter({ has: page.locator(`b:text-is("${name}")`) }).first(); if (!(await l.count())) { console.log('   pickPlace: no row', name); return false; } await l.scrollIntoViewIfNeeded(); await page.waitForTimeout(150); await l.click(); await page.waitForTimeout(700); console.log('   picked', name); return true; };
    const shoot = async (f = 'closet.jpg', ans = null, delay = 0) => { if (ans) WHERE.push(ans); if (delay) NEXT_WHERE_DELAY = delay; await cam(f); await shutter(); await page.waitForTimeout(900); };
    const btn = async (re, wait = 700) => { const l = page.getByRole('button', { name: re }).filter({ visible: true }).first(); if (!(await l.count())) { console.log('   btn: none', re); return false; } await l.click(); await page.waitForTimeout(wait); console.log('   tapped', String(re)); return true; };
    const store = async (item = 'baseball card') => { const d = await page.evaluate(() => window.__rig.dump()); const it = d.find(x => x.kind === 'item' && !x.deleted && x.name.toLowerCase() === item.toLowerCase());
      const pls = d.filter(x => x.kind === 'place' && !x.deleted).map(p => `${p.name}(${(p.photos || []).length}${p.parent ? '^' + p.parent : ''})`);
      const holders = d.filter(x => x.kind === 'item' && !x.deleted && x.holds).map(p => `${p.name}(${p.photoCount || 0}${(p.photos || []).length ? '/' + p.photos.length : ''})`);
      const r = `STORE: ${item} chain=${await chainOf(item)} loc="${it && it.location}" | woodenbox=${await chainOf('wooden box')} | memorabilia=${await chainOf('memorabilia box')} | batteries=${await chainOf('spare batteries')}\n   places: ${pls.join(', ')}\n   boxes: ${holders.join(', ')}\n   history(${item}): ${JSON.stringify((it && it.history || []).slice(-3).map(h => ({ l: h.location, u: h.undo || h.undone || undefined })))}`; console.log(r); return r; };
    const cardText = async () => (await bodyText()).replace(/\s+/g, ' ').slice(0, 400);
    const fresh = async (label) => { console.log(`\n######## ${label}`); WHERE.length = 0; NEXT_WHERE_DELAY = 0; await seedHouse(); await page.evaluate(() => window.__rig.rules(true)); await noAuto(); await openItem('baseball card'); await noAuto(); await tap('button:has-text("Move it")', { wait: 1000 }); };
    const KCa = { name: 'kitchen counter', known: 'Kitchen counter', sure: true };
    const cancelChoose = async () => { const c = page.locator('.where-list .btn-quiet:has-text("Cancel")').last(); if (await c.count()) { await c.scrollIntoViewIfNeeded().catch(() => {}); await c.click(); await page.waitForTimeout(600); console.log('   cancelled Choose place'); } else console.log('   no Choose-place Cancel'); };
    const saveNow = async () => { const d = await page.locator('.lc-k.sv').first().isDisabled().catch(() => null); console.log('   Save disabled?', d); await press('.lc-k.sv'); await page.waitForTimeout(2200); };
    const tapSq = async (n) => { const l = page.locator(`.lv-sq[aria-label^="Level ${n}"]`).first(); await l.scrollIntoViewIfNeeded(); await page.waitForTimeout(200); await l.click(); await page.waitForTimeout(600); console.log('   tapped L' + n); };
    const closeSheetRow = async () => { if (await page.locator('.sheet-row').filter({ visible: true }).count()) { console.log('   sq sheet:', (await page.evaluate(() => [...document.querySelectorAll('.sheet')].pop().innerText)).replace(/\n/g, ' / ')); await btn(/^Close$/); } };
    const sheetText = async (s = '.sheet') => (await page.evaluate((s) => { const e = [...document.querySelectorAll(s)].pop(); return e ? e.innerText : ''; }, s)).replace(/\n+/g, ' / ').slice(0, 500);
