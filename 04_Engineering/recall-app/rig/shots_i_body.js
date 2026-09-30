  async function runSuite() {
    const O = require('./oracle.js')({ page, PORT, tap });
    const OUT = path.join(__dirname, 'shots_i'); fs.mkdirSync(OUT, { recursive: true });
    const snap = async (f) => { await page.waitForTimeout(300); await page.screenshot({ path: path.join(OUT, f) }); };
    const choose = async (name) => { if (!(await page.locator('.where-list').count())) await tap('.lc-choose', { wait: 450 }); await page.fill('.wl-search input', name); await page.waitForTimeout(200); await page.locator(`.where-list .wl-row:not(.wl-sugg):has-text("${name}")`).first().click(); await page.waitForTimeout(450); };
    await seedHouse(); await page.evaluate(() => window.__rig.rules(true));
    // 1: a Move gets the card
    await O.openItem('spare batteries'); await tap('button:has-text("Move it")', { wait: 900 }); await tap('.lv-sq.plus', { wait: 300 }); await choose('Craft nook'); await tap('.lc-k.sv', { wait: 1200 }); await snap('1-move-card.png');
    // 2: Move it → photograph the drawer it's in → "Is this the Desk drawer?"
    await O.openItem('passport'); await tap('button:has-text("Move it")', { wait: 900 });
    WHERE.push({ name: 'drawer', moves: false, known: 'Desk drawer', sure: true }); await cam('drawer.jpg'); await tap('.lc-shutter', { wait: 2400 }); await snap('2-is-this-the-desk-drawer.png');
    await tap('.lc-x', { wait: 400 }); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 400 });
    // 3: rename a place to one you have
    await home(); await tap('.menu-btn', { wait: 400 }); await tap('.drawer-row:has-text("Places")', { wait: 700 }); await tap('.loc-row:has-text("Kitchen counter")', { wait: 700 });
    await tap('button.field-value', { wait: 400 }); await page.locator('input.place-input').first().fill('Pantry shelf'); await snap('3-rename-refused.png');
    // 4: Largest text, a small iPhone, 3 tiers
    await page.setViewportSize({ width: 375, height: 667 }); await seedHouse(); await setPrefs({ size: 'largest' }); await home();
    AI = { name: 'cordless screwdriver set' }; await cam('real_slippers.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1300 });
    for (const p of ['Kitchen counter', 'Craft nook', 'Pantry shelf']) { await tap('.lv-sq.plus', { wait: 300 }); await choose(p); }
    await snap('4-largest-375-three-tiers.png');
  }
  await seedHouse();
  try { await runSuite(); } catch (e) { console.error('FATAL', e); }
  await browser.close();
}
(async () => { await new Promise((r) => server.listen(PORT, r)); await runLook('b'); server.close(); })();
