    // ---- timeout-test library ----
    await page.evaluate(() => window.__rig.rules(true));
    let T0 = 0; const reqTimes = [];
    page.on('request', (r) => { if (/anthropic/.test(r.url())) reqTimes.push(Date.now() - T0); });
    const openItem = async (nm) => { await home(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', nm); await page.waitForTimeout(450); await page.locator('.ask .tile').filter({ hasText: new RegExp(nm, 'i') }).first().click(); await page.waitForSelector('.card.thing'); await page.waitForTimeout(900); };
    const state = () => page.evaluate(() => {
      const q = (s) => document.querySelector(s); const vis = (e) => { if (!e) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
      const sq = [...document.querySelectorAll('.lv-sq')].map((b) => (b.classList.contains('sel') ? '*' : '') + (b.getAttribute('aria-label') || '').replace(/^Level /, 'L').replace('Add a level: what it is in', '+'));
      const inp = q('input.place-input'); const sug = [...document.querySelectorAll('.wl-sugg')].filter(vis).map((e) => e.innerText.replace(/\s+/g, ' '));
      const card = q('.lc-card') || q('.lc-say'); const place = [...document.querySelectorAll('*')].find((e) => /^Place:/.test(e.innerText || '') && e.children.length < 3);
      const firstRow = q('.where-list .wl-row, .wl-row:not(.wl-sugg)'); const ask = [...document.querySelectorAll('button')].filter(vis).map((b) => b.innerText.trim()).filter((t) => /^(Yes|No)/.test(t));
      const isQ = (document.body.innerText.match(/Is this (the|your)[^?\n]*\?/) || [''])[0];
      const hdr = (q('.wl-head, .cp-head') || {}).innerText;
      return { sheet: vis(q('.wl-search')), sq: sq.join(' | '), field: inp ? inp.value : null, focus: document.activeElement ? (document.activeElement.className || document.activeElement.tagName) : '', sug: sug.join(';'), row1Y: firstRow ? Math.round(firstRow.getBoundingClientRect().top) : null,
        place: place ? place.innerText.replace(/\s+/g, ' ').slice(0, 60) : '', isQ, ask: ask.join('/'), dis: ['.lc-shutter', '.lc-choose', '.lc-k.sv', '.lv-sq.plus', '.lc-x'].map((s) => (q(s) ? (q(s).disabled ? 'D' : 'e') : '-')).join(''),
        msg: ((document.body.innerText.match(/(You already have[^\n]*|Looking at the photo…|Naming…)/) || [''])[0]).slice(0, 70) };
    });
    let tl = [];
    const watch = async (ms, label = '') => { let last = ''; const end = Date.now() + ms; while (Date.now() < end) { const s = await state(); const k = JSON.stringify(s); if (k !== last) { const t = Date.now() - T0; tl.push(`${String(t).padStart(5)}ms ${k}`); console.log(`  ${label}@${t}ms`, k); last = k; } await page.waitForTimeout(90); } };
    const at = async (tms) => { const w = T0 + tms - Date.now(); if (w > 0) await watch(w); };
    const bb = async (sel) => page.locator(sel).first().boundingBox().catch(() => null);
    const press = async (sel) => { const b = await bb(sel); if (!b) { console.log('   press: no', sel); return false; } await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); console.log(`   pressed ${sel} @${Date.now() - T0}ms`); return true; };
    const hold = async (sel, ms = 900) => { const b = await bb(sel); if (!b) return false; await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await page.waitForTimeout(ms); await page.mouse.up(); console.log(`   held ${sel} @${Date.now() - T0}ms`); return true; };
    const shutter = async () => { reqTimes.length = 0; T0 = Date.now(); tl = []; await press('.lc-shutter'); };
    const sel = async (n) => { await press(`.lv-sq[aria-label^="Level ${n}"]`); await page.waitForTimeout(400); };
    const pickRow = async (name) => press(`.wl-row:not(.wl-sugg):has-text("${name}")`);
    const places = () => page.evaluate(() => window.__rig.dump().filter((d) => d.kind === 'place' && !d.deleted).map((p) => `${p.name}(${(p.photos || []).length})`).join(', '));
    const boxes = () => page.evaluate(() => window.__rig.dump().filter((d) => d.kind === 'item' && !d.deleted && d.holds).map((p) => `${p.name}(${p.photoCount || (p.photos || []).length || 0})`).join(', '));
    const BASE = { places: '', boxes: '' };
    const snapBase = async () => { BASE.places = await places(); BASE.boxes = await boxes(); };
    const storeDiff = async (item) => { const p = (await places()).split(', '), b0 = BASE.places.split(', '); const newP = p.filter((x) => !b0.includes(x)); const goneP = b0.filter((x) => !p.includes(x));
      const bx = (await boxes()).split(', '), bx0 = BASE.boxes.split(', '); const newB = bx.filter((x) => !bx0.includes(x));
      const it = await itemDoc(item); const odd = (await places()).split(', ').filter((x) => /Naming|^[a-z]|A place|Unnamed|^\(/.test(x));
      const r = `STORE ${item}: chain=${await chainOf(item)} | batteries=${await chainOf('spare batteries')} | woodenbox=${await chainOf('wooden box')} | yearbook=${await chainOf('yearbook 1978')} | loc="${it && it.location}" | places changed: +[${newP.join(', ')}] -[${goneP.join(', ')}] | boxes changed: +[${newB.join(', ')}] | odd names: [${odd.join(', ')}]`; console.log(r); return r; };
    const logStart = async (itemName, itemImg) => { await home(); await page.click(LOG); await page.waitForTimeout(900); AI = { name: itemName }; await cam(itemImg); await tap('.lc-shutter', { wait: 2000 }); };
    const moveStart = async (item) => { await openItem(item); await tap('button:has-text("Move it")', { wait: 1000 }); };
    const save = async () => { await press('.lc-k.sv'); await page.waitForTimeout(2200); };
    const runScn = async (sc) => {
      await seedHouse(); await page.evaluate(() => window.__rig.rules(true)); await snapBase();
      console.log(`\n##### SCN ${sc.id}: ${sc.desc}`);
      if (sc.mode === 'log') await logStart(sc.item || 'egg timer', 'real_spoon.jpg'); else await moveStart(sc.item || 'baseball card');
      if (sc.pre) await sc.pre();
      console.log('before:', JSON.stringify(await state()));
      for (const a of (sc.answers || [])) WHERE.push(a.ans);
      WHERE.length = 0; for (const a of (sc.answers || [])) WHERE.push(a.ans);
      NEXT_WHERE_DELAY = (sc.answers && sc.answers[0] && sc.answers[0].delay) || 0; if (sc.bad) NEXT_WHERE_BADJSON = true;
      await cam(sc.img || 'real_desk.jpg'); await shutter();
      for (const [t, act, arg] of sc.steps) {
        await at(t);
        const tt = Date.now() - T0;
        if (act === 'type') { await page.locator('input.place-input').first().click().catch(() => {}); await page.keyboard.type(arg, { delay: 140 }); console.log(`   typed "${arg}" ${tt}-${Date.now() - T0}ms`); }
        else if (act === 'typeSearch') { await page.locator('.wl-search input').first().click().catch(() => {}); await page.keyboard.type(arg, { delay: 140 }); console.log(`   typed search "${arg}" ${tt}ms`); }
        else if (act === 'press') await press(arg);
        else if (act === 'hold') await hold(arg);
        else if (act === 'pick') await pickRow(arg);
        else if (act === 'shot') await shot(`${sc.id}-${arg}`);
        else if (act === 'shoot') { NEXT_WHERE_DELAY = arg || 0; await cam('closet.jpg'); await press('.lc-shutter'); }
        else if (act === 'save') await press('.lc-k.sv');
        else if (act === 'fn') await arg();
        else if (act === 'ui') await ui(`${sc.id} @${tt}`);
      }
      await watch(600);
      console.log('reqTimes', reqTimes.join(','), '| WHERE left', WHERE.length, '| pool', lastPoolNames.join('/'));
      const fin = await state(); console.log('final:', JSON.stringify(fin));
      const onCam = await page.locator('.lc-shutter').count();
      if (onCam && sc.saveAtEnd !== false) { if (fin.sheet) { await press('.btn-quiet:has-text("Cancel")'); await page.waitForTimeout(500); console.log('closed sheet:', JSON.stringify(await state())); } await save(); }
      if (sc.after) await sc.after();
      await page.waitForTimeout(sc.waitEnd || 300);
      const txt = (await bodyText()).replace(/\s+/g, ' ').slice(0, 260); console.log('screen after:', txt);
      return storeDiff(sc.item || (sc.mode === 'log' ? 'egg timer' : 'baseball card'));
    };
    const KC = { name: 'kitchen counter', known: 'Kitchen counter', sure: true };
    const NEW = { name: 'hall closet' };
