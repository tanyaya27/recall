  // probe_row — 09-29g: "☰ Choose place" stays on the squares' row at every text size; the squares scroll, and the
  // selected square and ＋ stay in view. Normal / Large / Largest, 1–3 tiers.
  const window_w = (vw) => vw;
  async function runSuite() {
    fs.mkdirSync(path.join(__dirname, 'shots_row'), { recursive: true });
    const pickWhere = async (name) => { if (!(await page.locator('.where-list').count())) await tap('.lc-choose', { wait: 600 });
      await page.fill('.wl-search input', name); await page.waitForTimeout(150); await page.locator(`.where-list .wl-row:not(.wl-sugg):has-text("${name}")`).first().click(); await page.waitForTimeout(500); };
    for (const vw of [390, 375]) for (const size of ['normal', 'large', 'largest']) {
      await page.setViewportSize(vw === 390 ? { width: 390, height: 844 } : { width: 375, height: 667 });
      await seedHouse(); await setPrefs({ size }); await home();
      AI = { name: 'stapler' }; await cam('real_slippers.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
      const tiers = ['Kitchen counter', 'Craft nook', 'Pantry shelf'];
      for (let k = 0; k < tiers.length; k++) {
        await tap('.lv-sq.plus', { wait: 350 }); await pickWhere(tiers[k]);
        const m = await page.evaluate(() => { const r = (q) => { const e = document.querySelector(q); return e ? e.getBoundingClientRect() : null; };
          const st = r('.lc-card .lv-strip'), ch = r('.lc-choose'), cd = r('.lc-card'), sel = r('.lv-strip .lv-sq.sel'), pl = r('.lc-row2 .lv-sq.plus');
          const inView = (b) => !b || (b.left >= st.left - 1.5 && b.right <= st.right + 1.5); // a 1 px sliver is not visible
          const inCard = (b) => !!b && b.left >= cd.left && b.right <= cd.right;
          const selCut = sel ? Math.round(st.left - sel.left) : 0; return { selCut, stripW: Math.round(st.width), sameRow: Math.abs((ch.top + ch.bottom) / 2 - (st.top + st.bottom) / 2) <= 4, chooseIn: ch.right <= cd.right + 0.5, selIn: inView(sel), plusIn: inCard(pl), cardH: Math.round(cd.height) }; });
        await page.locator('.lc-card').screenshot({ path: path.join(__dirname, 'shots_row', `row-${vw}-${size}-${k + 1}.png`) });
        const btns = await page.evaluate(() => [...document.querySelectorAll('.lc-row .lc-x, .lc-row .lc-k.sv')].map((b) => { const r = b.getBoundingClientRect(); return { t: b.innerText.trim(), l: Math.round(r.left), r: Math.round(r.right), clip: b.scrollWidth > b.clientWidth + 1 }; }));
        check('ROW', `${vw} wide, ${size}, ${k + 1} tier${k ? 's' : ''}: Cancel and Save whole and on screen (09-30 independent test #3)`, btns.length === 2 && btns.every((b) => b.l >= 0 && b.r <= window_w(vw) && !b.clip), JSON.stringify(btns));
        check('ROW', `${vw} wide, ${size}, ${k + 1} tier${k ? 's' : ''}: Choose place on the squares' row, inside the card; selected square and ＋ in view`, m.sameRow && m.chooseIn && m.selIn && m.plusIn, JSON.stringify(m));
      }
      await tap('.lc-x', { wait: 400 }); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 400 });
    }
  }
  await seedHouse();
  try { await runSuite(); } catch (e) { console.error('FATAL', e); check('ROW', 'suite ran', false, e.message); }
  await browser.close();
}
(async () => {
  await new Promise((r) => server.listen(PORT, r));
  await runLook('b');
  const pass = results.filter((r) => r.ok).length;
  console.log(`\n${pass}/${results.length} checks passed`);
  console.log('Page errors:', errors.length ? errors : 'none');
  server.close();
})();
