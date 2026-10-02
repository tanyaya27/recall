  // =================================================================================================
  // render_tiers_opts — the design choices from the tier audit, rendered on the REAL app screens (rig build of the
  // fixed code); each option changes only the block in question, in the page's own DOM and stylesheet.
  const OUT = path.join(__dirname, 'shots_opts'); fs.mkdirSync(OUT, { recursive: true });
  const snap = async (name) => { await page.waitForTimeout(300); await page.screenshot({ path: `${OUT}/${name}.png` }); console.log('  [opt]', name); };
  async function runSuite(look) {
    await setPrefs({ cameraLook: look });
    const fresh = async () => { await seedHouse(); SAME = { index: -1, sure: false }; await home(); await page.evaluate(() => window.__rig.rules(true)); await page.waitForTimeout(200); };
    const newThing = async (nm) => { AI = { name: nm }; await cam('real_slippers.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 }); };
    const plus = async () => { await tap('.lv-sq.plus', { wait: 350 }); };
    const shoot = async (f, where) => { if (where) WHERE.push(where); await cam(f); await tap('.lc-shutter', { wait: 1900 }); };
    const pickWhere = async (name) => {
      const chip = page.locator(`.lc-chip:not(.more):has-text("${name.slice(0, 10)}")`);
      if (await chip.count()) { await chip.first().click(); await page.waitForTimeout(500); return; }
      await tap('.lc-chip.more', { wait: 600 }); await type('.wl-search input', name);
      await page.locator(`.wl-row:has-text("${name}")`).first().click(); await page.waitForTimeout(500);
    };
    const save = async () => { await tap('.lc-k.sv', { wait: 2600 }); };
    const openThing = async (nm) => { await home(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', nm); await page.waitForTimeout(350); await page.click('.ask .tile >> nth=0'); await page.waitForSelector('.card.thing'); await page.waitForTimeout(400); };
    const thumbOf = async (nm) => page.evaluate((n) => { const p = window.__rig.dump().find((d) => d.kind === 'place' && d.name.toLowerCase() === n.toLowerCase()); return p && p.photos && p.photos[0] ? p.photos[0].thumb : ''; }, nm);

    // ---- the house: stapler in Drawer 3, in the Oak cabinet, in the Office (three new places); tape at Kitchen counter,
    // which is in Craft nook.
    await fresh();
    await newThing('stapler'); await plus(); await shoot('drawer.jpg', { name: 'Drawer 3', moves: false });
    await plus(); await shoot('closet.jpg', { name: 'Oak cabinet', moves: false }); await plus(); await shoot('real_desk.jpg', { name: 'Office', moves: false }); await save();
    await home(); await newThing('tape'); await plus(); await pickWhere('Kitchen counter'); await plus(); await pickWhere('Craft nook'); await save();
    const T = { d3: await thumbOf('Drawer 3'), oak: await thumbOf('Oak cabinet'), off: await thumbOf('Office') };

    // ---------- Q1: the thing's page, Where it is ----------
    await openThing('stapler'); await page.evaluate(() => document.querySelector('.tp-blk').scrollIntoView({ block: 'center' }));
    await snap('Q1-0-now');
    const setWhere = (html) => page.evaluate((h) => { document.querySelector('.tp-wh').outerHTML = h; }, html);
    const sq = (src) => `<span class="st">${src ? `<img src="${src}" alt="">` : '<span class="no">?</span>'}</span>`;
    const inS = (src) => `<span class="st"><span class="in">in</span><img src="${src}" alt=""></span>`;
    await setWhere(`<div class="tp-wh"><div class="ch">${sq(T.d3)}${inS(T.oak)}${inS(T.off)}</div><div class="tx"><b>Drawer 3</b><small>in the Oak cabinet · Office</small></div></div>`);
    await snap('Q1-A-row');
    await openThing('stapler'); await page.evaluate(() => document.querySelector('.tp-blk').scrollIntoView({ block: 'center' }));
    await setWhere(`<div class="tp-wh"><div class="ch">${sq(T.d3)}</div><div class="tx"><b>Drawer 3</b><small>in the Oak cabinet, in the Office</small></div></div>`);
    await snap('Q1-B-words');
    await openThing('stapler'); await page.evaluate(() => document.querySelector('.tp-blk').scrollIntoView({ block: 'center' }));
    const rung = (src, nm, first) => `<div style="display:flex;align-items:center;gap:.625rem;padding:.25rem 0">${first ? '' : ''}<img src="${src}" style="width:46px;height:46px;border-radius:10px;object-fit:cover"><b style="font-size:1.0625rem">${nm}</b><span style="margin-left:auto;color:var(--ink-soft)">›</span></div>`;
    await setWhere(`<div class="tp-wh" style="display:block">${rung(T.d3, 'Drawer 3', true)}<div style="margin-left:22px;border-left:2px solid var(--line, #ccc);padding-left:14px">${rung(T.oak, 'in the Oak cabinet')}<div style="margin-left:0;border-left:0;padding-left:14px">${rung(T.off, 'in the Office')}</div></div></div>`);
    await snap('Q1-C-ladder');

    // ---------- Q2: the Places list ----------
    await home(); await tap('.menu-btn', { wait: 400 }); await tap('.drawer-row:has-text("Places")', { wait: 700 });
    await snap('Q2-0-now');
    await page.evaluate(() => { const par = { 'drawer 3': 'Oak cabinet', 'oak cabinet': 'Office', 'kitchen counter': 'Craft nook' };
      document.querySelectorAll('.loc-row').forEach((r) => { const n = r.querySelector('.nm b').innerText.toLowerCase(); const s = r.querySelector('.nm small'); if (par[n]) s.innerText = 'in the ' + par[n] + ' · ' + s.innerText; }); });
    await snap('Q2-A-in-line');
    await home(); await tap('.menu-btn', { wait: 400 }); await tap('.drawer-row:has-text("Places")', { wait: 700 });
    await page.evaluate(() => { const kids = { office: ['oak cabinet'], 'oak cabinet': ['drawer 3'], 'craft nook': ['kitchen counter'] };
      const rows = [...document.querySelectorAll('.loc-row')]; const by = Object.fromEntries(rows.map((r) => [r.querySelector('.nm b').innerText.toLowerCase(), r]));
      const place = (n, depth, after) => { const r = by[n]; if (!r) return after; r.style.marginLeft = (depth * 1.5) + 'rem'; if (depth) r.style.borderLeft = '3px solid var(--accent, #2F6B5E)'; after.after(r); let last = r; (kids[n] || []).forEach((k) => { last = place(k, depth + 1, last); }); return last; };
      const top = rows[0].parentElement; const anchor = document.createElement('div'); top.insertBefore(anchor, rows[0]);
      let last = anchor; ['office', 'craft nook'].forEach((n) => { last = place(n, 0, last); }); });
    await snap('Q2-B-nested');

    // ---------- Q3: saying a place that already has a "where" is somewhere else (Kitchen counter is in Craft nook) ----------
    await home(); await newThing('glue'); await plus(); await pickWhere('Kitchen counter');
    await snap('Q3-0-now-tier1'); // the fix: its where shows in the sentence
    await plus(); await pickWhere('Pantry shelf');
    await snap('Q3-0-now-silent');
    // A: picking Kitchen counter brings its where in as tier 2 (Craft nook), marked; changing tier 2 says so.
    await home(); await newThing('glue'); await plus(); await pickWhere('Kitchen counter'); await plus(); await pickWhere('Craft nook');
    await page.evaluate(() => { const t = document.querySelectorAll('.lv-sq')[2]; if (t) { const b = document.createElement('span'); b.className = 'lv-n'; b.textContent = '✓'; b.style.background = '#2F6B5E'; t.appendChild(b); }
      const p = document.querySelector('.lc-prompt small'); if (p) p.innerText = 'Kitchen counter is in Craft nook. Tap another place to change that.'; });
    await snap('Q3-A-shown-as-tier2');
    // C: ask at Save.
    await page.locator('.lc-x').first().click().catch(() => {}); await page.waitForTimeout(300); await tap('text=Throw away', { wait: 300 }).catch(() => {});
    await home(); await newThing('glue'); await plus(); await pickWhere('Kitchen counter'); await plus(); await pickWhere('Pantry shelf');
    await page.evaluate(() => { const say = document.querySelector('.lc-say'); const a = document.createElement('div'); a.className = 'lc-ask';
      a.innerHTML = '<b style="color:#6BB6FF"><span>Kitchen counter is in Craft nook. Move it to Pantry shelf?</span></b><div><button type="button">Move it</button><button type="button" class="o">No, keep Craft nook</button></div><small style="display:block;margin-top:.4rem;opacity:.8">Tape and 1 more move with it.</small>';
      say.replaceWith(a); });
    await snap('Q3-C-ask');
    // B: silent, announced on the card.
    await page.evaluate(() => { const a = document.querySelector('.lc-ask'); if (a) a.remove(); });
    await page.locator('.lc-x').first().click().catch(() => {}); await page.waitForTimeout(300); await tap('text=Throw away', { wait: 300 }).catch(() => {});
    await home(); await newThing('glue'); await plus(); await pickWhere('Kitchen counter'); await plus(); await pickWhere('Pantry shelf'); await save();
    await page.evaluate(() => { const s = document.querySelector('.saved-card .s'); if (s) { const m = document.createElement('small'); m.textContent = 'Kitchen counter moved: Craft nook → Pantry shelf · 2 things with it'; m.style.display = 'block'; s.appendChild(m); } });
    await snap('Q3-B-announced');

    // ---------- Q4: a place inside a box (Linen closet in the tin box) ----------
    await home(); await newThing('glue'); await plus(); await pickWhere('Linen closet'); await plus();
    await snap('Q4-A-allowed-pills'); await pickWhere('Tin box'); await snap('Q4-A-allowed');
    await page.locator('.lc-x').first().click().catch(() => {}); await page.waitForTimeout(300); await tap('text=Throw away', { wait: 300 }).catch(() => {});
    await home(); await newThing('glue'); await plus(); await pickWhere('Linen closet'); await plus();
    await page.evaluate(() => { const pp = window.__rig.dump().find((d) => d.kind === 'place' && d.name === 'Pantry shelf'); document.querySelectorAll('.lc-chip.box').forEach((c) => { c.querySelector('span:last-child').textContent = 'Pantry shelf'; const im = c.querySelector('img'); if (im && pp && pp.photos[0]) im.src = pp.photos[0].thumb; c.classList.remove('box'); }); });
    await snap('Q4-B-places-only');

    // ---------- Q5: an ask for tier 2 while tier 3 is selected ----------
    await page.locator('.lc-x').first().click().catch(() => {}); await page.waitForTimeout(300); await tap('text=Throw away', { wait: 300 }).catch(() => {});
    await home(); await newThing('glue'); await plus(); await shoot('drawer.jpg', { name: 'Drawer 5', moves: false });
    await plus(); WHERE.push({ name: 'Filing cabinet', moves: true, sure: false }); await cam('closet.jpg'); await tap('.lc-shutter', { wait: 150 });
    await plus(); await shoot('real_desk.jpg', { name: 'Study', moves: false });
    await snap('Q5-0-now');
    const t2 = await page.evaluate(() => { const i = document.querySelectorAll('.lv-sq img')[2]; return i ? i.src : ''; });
    await page.evaluate(() => { const b = document.querySelector('.lc-ask b'); window.__askHTML = b ? b.innerHTML : ''; });
    await page.evaluate((src) => { const b = document.querySelector('.lc-ask b'); if (b) b.innerHTML = `<img src="${src}" style="width:34px;height:34px;border-radius:8px;border:2.5px solid #6BB6FF;object-fit:cover"><span>Is this your filing cabinet?</span>`; }, t2);
    await snap('Q5-A-ask-shows-its-square');
    await page.evaluate(() => { const b = document.querySelector('.lc-ask b'); if (b) b.innerHTML = window.__askHTML; });
    await page.locator('.lv-sq').nth(2).click(); await page.waitForTimeout(500);
    const pv = await page.locator('.sheet-back, .lc-pv').count(); if (pv) { await page.mouse.click(195, 60); await page.waitForTimeout(400); }
    await snap('Q5-B-jump-to-tier2');
  }

  await seedHouse();
  try { await runSuite(look); } catch (e) { console.error('FATAL', e); await page.screenshot({ path: `${OUT}/FATAL.png` }); }
  await browser.close();
}

(async () => {
  await new Promise((r) => server.listen(PORT, r));
  await runLook('b');
  console.log('Page errors:', errors.length ? errors : 'none');
  server.close();
})();
