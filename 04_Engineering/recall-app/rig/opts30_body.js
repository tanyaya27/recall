  // 09-30 mockups for Ravi: options drawn ON the real screens (real data, real styles); only the block in question is added.
  async function runSuite() {
    const O = require('./oracle.js')({ page, PORT, tap });
    const OUT = path.join(__dirname, 'shots_o30'); fs.mkdirSync(OUT, { recursive: true });
    const snap = async (f) => { await page.waitForTimeout(350); await page.screenshot({ path: path.join(OUT, f) }); };
    const inject = (fn, arg) => page.evaluate(fn, arg);
    const choose = async (name) => { if (!(await page.locator('.where-list').count())) await tap('.lc-choose', { wait: 450 }); await page.fill('.wl-search input', name); await page.waitForTimeout(200); await page.locator(`.where-list .wl-row:not(.wl-sugg):has-text("${name}")`).first().click(); await page.waitForTimeout(450); };
    await seedHouse(); await page.evaluate(() => window.__rig.rules(true));
    // ---- #2 after a Move
    await O.openItem('spare batteries'); await tap('button:has-text("Move it")', { wait: 900 }); await choose('Craft nook'); await tap('.lc-k.sv', { wait: 900 });
    await page.evaluate(() => window.scrollTo(0, 0)); await snap('A-today.png');
    await inject(() => { const c = document.querySelector('.saved-card'); if (c) { const x = document.createElement('button'); x.textContent = '✕'; x.style.cssText = 'position:absolute;right:10px;top:8px;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.16);color:#fff;font-size:18px;font-weight:800'; c.appendChild(x); const u = c.querySelector('.u'); if (u) u.style.right = '60px'; } });
    await snap('B-card-with-x.png');
    await inject(() => { const c = document.querySelector('.saved-card'); if (c) c.remove();
      const wh = document.querySelector('.tp-wh'); const n = document.createElement('div');
      n.innerHTML = '<div style="display:flex;align-items:center;gap:.5rem"><span style="flex:1;color:#2F8F6B;font-weight:800">✓ Moved just now</span><button aria-label="Close" style="width:36px;height:36px;border-radius:50%;background:transparent;color:var(--ink-soft);font-size:17px;font-weight:800">✕</button></div>'
        + '<div style="display:flex;align-items:center;gap:.5rem"><span style="flex:1;color:var(--ink-soft);font-size:.9375rem">It was on the Kitchen counter.</span><button style="min-height:40px;padding:0 1rem;border-radius:999px;background:var(--accent-soft);color:var(--accent);font-weight:800">Undo</button></div>';
      n.style.cssText = 'margin:.625rem 0 .25rem;padding:.35rem .35rem .45rem .75rem;border-radius:14px;background:rgba(47,143,107,.10);border:1.5px solid rgba(47,143,107,.35)';
      wh.parentNode.insertBefore(n, wh.nextSibling); });
    await snap('C-inline-note.png');
    // ---- #3 removing a place with items
    await seedHouse(); await home(); await tap('.menu-btn', { wait: 400 }); await tap('.drawer-row:has-text("Places")', { wait: 700 }); await tap('.loc-row:has-text("Craft nook")', { wait: 700 });
    const rows = await page.evaluate(() => [...document.querySelectorAll('.things-here .thing-mini img')].map((i) => ({ src: i.src, name: i.alt })));
    await snap('D0-place-page-today.png');
    await inject((rows) => { const b = document.createElement('div'); b.className = 'sheet-back';
      const li = rows.map((r) => `<div class="wl-row" style="min-height:3.25rem"><img src="${r.src}" alt=""><span class="tx"><b>${r.name.charAt(0).toUpperCase() + r.name.slice(1)}</b><small>in Craft nook</small></span></div>`).join('');
      b.innerHTML = `<div class="sheet"><div class="sheet-title">Craft nook still has ${rows.length} items</div><p class="sheet-body">Move them first — then the place can go.</p><div style="margin:.5rem 0">${li}</div>
        <button class="btn-primary" style="margin-top:.5rem">Move all ${rows.length} to one place…</button><button class="btn-secondary" style="margin-top:.5rem">Go through them one by one</button><button class="btn-quiet" style="margin-top:.25rem">Keep the place</button></div>`;
      document.body.appendChild(b); }, rows);
    await snap('D-your-idea-sheet.png');
    await inject((rows) => { document.querySelectorAll('.sheet-back').forEach((x) => x.remove());
      const th = document.querySelector('.things-here'); const lab = [...document.querySelectorAll('.field-label')].find((x) => /Items here/.test(x.innerText));
      lab.innerHTML = `Items here now · ${rows.length} <button style="float:right;min-height:36px;padding:0 .8rem;border-radius:999px;background:var(--accent-soft);color:var(--accent);font-weight:800;font-size:.85rem;letter-spacing:0;text-transform:none">Move all to…</button>`;
      th.outerHTML = '<div>' + rows.map((r) => `<div class="wl-row" style="min-height:3.25rem"><img src="${r.src}" alt=""><span class="tx"><b>${r.name.charAt(0).toUpperCase() + r.name.slice(1)}</b><small>in Craft nook</small></span><button style="flex:none;min-height:40px;padding:0 .9rem;border-radius:999px;border:1.5px solid var(--accent);color:var(--accent);background:transparent;font-weight:800">Move</button></div>`).join('') + '</div>';
      const rm = [...document.querySelectorAll('button')].find((x) => /Remove this place/.test(x.innerText)); rm.disabled = true; rm.style.opacity = '.45';
      const note = document.createElement('p'); note.className = 'note-quiet left'; note.textContent = `Move the ${rows.length} items first — then the place can go.`; rm.parentNode.insertBefore(note, rm.nextSibling); }, rows);
    await page.evaluate(() => { const f = [...document.querySelectorAll('.field-label')].find((x) => /Items here/.test(x.innerText)); f.scrollIntoView({ block: 'start' }); window.scrollBy(0, -120); });
    await snap('E-place-page-is-the-list.png');
    // ---- #4 rename to a name you have
    await seedHouse(); await home(); await tap('.menu-btn', { wait: 400 }); await tap('.drawer-row:has-text("Places")', { wait: 700 }); await tap('.loc-row:has-text("Kitchen counter")', { wait: 700 });
    const pics = await page.evaluate(() => { const d = window.__rig.dump(); const p = (n) => ((d.find((x) => x.kind === 'place' && x.name === n) || {}).photos || [])[0]; return { a: (p('Kitchen counter') || {}).thumb, b: (p('Pantry shelf') || {}).thumb }; });
    const merge = (same) => inject(({ pics, same }) => { document.querySelectorAll('.sheet-back').forEach((x) => x.remove()); const b = document.createElement('div'); b.className = 'sheet-back';
      const im = (src, n) => `<div style="flex:1;text-align:center"><img src="${src}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:14px"><div style="font-weight:700;margin-top:.3rem">${n}</div><small style="color:var(--ink-soft)">${n === 'Kitchen counter' ? '1 photo · 1 item' : '1 photo · 0 items'}</small></div>`;
      b.innerHTML = `<div class="sheet"><div class="sheet-title">You already have the Pantry shelf</div>
        <div style="display:flex;gap:.75rem;margin:.75rem 0">${im(pics.a, 'Kitchen counter')}${im(same ? pics.a : pics.b, 'Pantry shelf')}</div>
        ${same ? '<p class="sheet-body">ReCall thinks these are <b>the same place</b>. Merge them: one Pantry shelf, with the Kitchen counter’s item and both photos.</p><button class="btn-primary" style="margin-top:.5rem">Merge into the Pantry shelf</button>'
          : '<p class="sheet-body" style="color:var(--amber)"><b>These look like different places.</b> Mixed photos make it harder for ReCall to recognise the place from a photo.</p><button class="btn-primary" style="margin-top:.5rem">Merge · keep the shelf’s photos</button><button class="btn-secondary" style="margin-top:.5rem">Merge · keep all photos</button>'}
        <button class="btn-secondary" style="margin-top:.5rem">Give it its own name</button></div>`; document.body.appendChild(b); }, { pics, same });
    await merge(true); await snap('G-merge-same.png');
    await merge(false); await snap('H-merge-different.png');
  }
  await seedHouse();
  try { await runSuite(); } catch (e) { console.error('FATAL', e); }
  await browser.close();
}
(async () => { await new Promise((r) => server.listen(PORT, r)); await runLook('b'); server.close(); })();
