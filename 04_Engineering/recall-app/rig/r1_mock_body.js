  async function runSuite() {
    const OUT = path.join(__dirname, 'shots_r1'); fs.mkdirSync(OUT, { recursive: true });
    const CSS = fs.readFileSync(path.join(__dirname, 'r1/w1.css'), 'utf8');
    const snap = async (f) => { await page.waitForTimeout(450); await page.screenshot({ path: path.join(OUT, f) }); console.log('  [shot]', f); };
    const css = () => page.evaluate((c) => { if (!document.getElementById('w1css')) { const s = document.createElement('style'); s.id = 'w1css'; s.textContent = c; document.head.appendChild(s); } }, CSS);
    const inj = (fn, arg) => page.evaluate(fn, arg);
    const P = { desk: img('drawer.jpg'), kc: img('closet.jpg'), hall: img('real_desk.jpg'), wood: img('smallbox.jpg'), memo: img('box14.jpg'), garage: img('real_slippers.jpg'), craft: img('real_slippers.jpg') };
    const ICON = { pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"></path><circle cx="12" cy="10" r="2.5"></circle></svg>',
      x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"></path></svg>',
      plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"></path></svg>',
      search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.5-3.5"></path></svg>' };
    await page.evaluate(() => { window.__noAuto = true; });

    // ---- A: Home — now, and without the where line (Tanya) ----
    await home(); await snap('A1-home-now.png');
    await css(); await inj(() => { document.querySelectorAll('.tile-sub').forEach((e) => e.remove()); document.querySelectorAll('.tile-label.noplace').forEach((e) => e.classList.remove('noplace')); });
    await snap('A2-home-new.png');

    // ---- B: Log — the new where block ----
    const card = (html) => inj((h) => { const c = document.querySelector('.lc-card'); c.innerHTML = h; }, html);
    const words = (v, ph) => `<div class="w1-words"><input value="${v || ''}" placeholder="${ph}" aria-label="Where is it?"><button class="w1-mic" aria-label="Say it">🎙</button></div>`;
    const inEmpty = `<button class="w1-in"><span class="ic">${ICON.pin}</span><span class="t">What is it in? <small>Optional · pick a place or a box</small></span></button>`;
    const inSet = (thumb, name, chain) => `<button class="w1-in set"><img src="${thumb}" alt=""><span class="t"><span class="lab">In:</span> ${name}${chain ? `<small>${chain}</small>` : ''}</span><span class="x" aria-label="Take it out">${ICON.x}</span></button>`;
    await home(); await tap(LOG, { wait: 900 }); AI = { name: 'blue folder' }; await cam('folder.jpg'); await tap('.lc-shutter', { wait: 1300 }); await css();
    await card(`<div class="w1"><div class="w1-prompt">Another photo of it — or say where it is.</div>${words('', 'Where is it? (type or say it)')}${inEmpty}</div>`);
    await snap('B1-log-after-shot.png');
    await card(`<div class="w1"><div class="w1-prompt">Another photo of it — or say where it is.</div>${words('in the blue folder in the desk drawer', '')}${inEmpty}</div>`);
    await snap('B2-log-words.png');
    // the In list, helped by her words
    await inj((a) => { const P = a.P, I = a.ICON;
      const row = (t, n, sub, why) => `<button class="wl-row${why ? ' said' : ''}"><img src="${t}" alt=""><span class="tx"><b>${n}</b><small>${sub}</small></span>${why ? `<span class="why">${why}</span>` : ''}</button>`;
      const back = document.createElement('div'); back.className = 'sheet-back'; back.style.zIndex = '2000'; back.innerHTML = `<div class="sheet where-list" role="dialog"><div class="sheet-title">What is it in?</div>
        <p class="wl-said">You said: “in the blue folder in the desk drawer”</p>
        <div class="wl-g">From what you said</div>
        ${row(P.desk, 'Desk drawer', 'a place · 2 items', 'you said it')}
        <button class="wl-new typed"><span style="display:inline-flex">${I.plus}</span> New place: <b>&nbsp;Blue folder</b></button>
        <div class="wl-search"><span style="display:inline-flex">${I.search}</span><input placeholder="Search your places and boxes"></div>
        <div class="wl-g">Recent</div>
        ${row(P.kc, 'Kitchen counter', 'a place · 1 item')}${row(P.hall, 'Hall table', 'a place · 2 items')}${row(P.wood, 'Wooden box', 'a box · in the memorabilia box')}
        <div class="wl-g">All your places and boxes · 19</div>${row(P.craft, 'Craft nook', 'a place · 2 items')}
        <button class="btn-quiet" style="margin-top:.5rem">Cancel</button></div>`; document.body.appendChild(back); }, { P, ICON });
    await snap('B3-in-list.png');
    await inj(() => document.querySelector('.sheet-back').remove());
    await card(`<div class="w1"><div class="w1-prompt">Another photo of it — or say where it is.</div>${words('in the blue folder in the desk drawer', '')}${inSet(P.desk, 'Desk drawer', 'a place')}</div>`);
    await snap('B4-log-in-set.png');
    await tap('.lc-x', { wait: 400 }).catch(() => {}); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 400 });

    // ---- C: Move it on the baseball card (in the wooden box ▸ memorabilia box ▸ crawl space) ----
    await home(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', 'baseball'); await page.waitForTimeout(500);
    await page.click('.ask .tile >> nth=0'); await page.waitForSelector('.card.thing'); await page.waitForTimeout(500);
    await cam('smallbox.jpg'); await tap('button:has-text("Move it")', { wait: 1200 }); await css(); await inj(() => { const b = document.querySelector('.lc-shutter'); if (b) b.style.borderColor = '#fff'; });
    await card(`<div class="w1"><div class="w1-prompt">Photograph it where it is now, or say it.</div>${words('', 'Where is it now? (optional)')}${inSet(P.wood, 'Wooden box', 'in the Memorabilia box · in the Crawl space')}</div>`);
    await inj(() => { const s = document.querySelector('.lc-k.sv'); if (s) { s.setAttribute('disabled', ''); s.style.opacity = '.45'; } });
    await snap('C1-move-boxed.png');
    await tap('.lc-x', { wait: 400 }).catch(() => {}); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 400 });

    // ---- D: the item page — her words ----
    await page.waitForSelector('.card.thing'); await css();
    await inj(() => { const b = document.querySelector('.tp-wh'); const d = document.createElement('div'); d.className = 'tp-said under';
      d.innerHTML = '<q>top tray of the wooden box, in the plastic sleeve</q><small>You said · Mon 9:03 PM</small>'; b.parentNode.insertBefore(d, b.nextSibling); });
    await snap('D2-page-linked-and-words.png');
    // a words-only item: the reading glasses
    await home(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', 'reading'); await page.waitForTimeout(500);
    await page.click('.ask .tile >> nth=0'); await page.waitForSelector('.card.thing'); await page.waitForTimeout(500); await css();
    await inj((a) => { const blk = document.querySelector('section[aria-labelledby="tp-where"]'); const wh = blk.querySelector('.tp-wh'); const d = document.createElement('div'); d.className = 'tp-said';
      d.innerHTML = '<q>on the hall table, in the brown case next to the keys</q><small>You said · Today 9:12 AM · Tanya</small>'; wh.replaceWith(d);
      const mv = blk.querySelector('.tp-btn'); const pi = document.createElement('button'); pi.className = 'btn-quiet tp-btn'; pi.style.marginTop = '.5rem'; pi.innerHTML = 'Put it in a place or a box'; mv.parentNode.insertBefore(pi, mv.nextSibling); }, {});
    await snap('D1-page-words-only.png');
  }
  await seedHouse('dusk');
  try { await runSuite(); } catch (e) { console.error('FATAL', e); }
  await browser.close();
}
(async () => { await new Promise((r) => server.listen(PORT, r)); await runLook('b'); console.log('errors', errors); server.close(); })();
