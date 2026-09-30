  // realhouse — 09-30 (TESTING.md #6): the oracle over a REAL house. `REAL=/path/recall-house-….json node realhouse.js`
  // Without REAL it makes a copy of the rig's sample house through the app's own Download button and loads that (a round
  // trip: proves the copy and the loader, so the real one works the first time).
  async function runSuite() {
    const O = require('./oracle.js')({ page, PORT, tap });
    const H = require('./realhouse.js')({ page, PORT });
    let file = process.env.REAL;
    if (!file) {
      await seedHouse();
      await home(); await tap('.menu-btn', { wait: 400 }); await tap('.drawer-row:has-text("Research")', { wait: 600 });
      const [dl] = await Promise.all([page.waitForEvent('download'), page.click('button:has-text("Download a copy of my house")')]);
      file = path.join(__dirname, 'house_sample.json'); await dl.saveAs(file);
      const size = fs.statSync(file).size;
      check('R', `the app's "Download a copy of my house" makes a file (${Math.round(size / 1024)} KB)`, size > 1000, file);
    }
    const info = await H.load(file);
    console.log('loaded', JSON.stringify(info));
    check('R', `the copy loads: ${info.items} items, ${info.places} places, as its owner`, info.items > 0, JSON.stringify(info));
    const inv = await O.invariants();
    check('R', 'the house keeps the store\'s rules (one "in" each, no circles, no place in a box, ≤6 photos a place)', inv.length === 0, inv.slice(0, 8).join(' || '));
    const names = await page.evaluate((me) => window.__rig.dump().filter((d) => d.kind === 'item' && !d.deleted && d.name && d.owner === me).map((d) => d.name), info.me);
    const LIMIT = Number(process.env.ALL ? 9999 : 40);
    const bad = [];
    for (const nm of names.slice(0, LIMIT)) bad.push(...await O.check(nm));
    check('R', `every screen agrees with the store for ${Math.min(LIMIT, names.length)} of ${names.length} items`, bad.length === 0, bad.slice(0, 10).join(' || '));
  }
  try { await runSuite(); } catch (e) { console.error('FATAL', e); check('R', 'suite ran', false, e.message); }
  await browser.close();
}
(async () => {
  await new Promise((r) => server.listen(PORT, r));
  await runLook('b');
  const pass = results.filter((r) => r.ok).length;
  console.log(`\n${pass}/${results.length} checks passed`);
  server.close();
})();
