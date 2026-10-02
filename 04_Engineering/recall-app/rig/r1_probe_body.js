  async function runSuite() {
    const OUT = path.join(__dirname, 'shots_r1'); fs.mkdirSync(OUT, { recursive: true });
    const snap = async (f) => { await page.waitForTimeout(400); await page.screenshot({ path: path.join(OUT, f) }); console.log('  [shot]', f); };
    await page.evaluate(() => { window.__noAuto = true; });
    await home(); await snap('p0-home.png');
    fs.writeFileSync(path.join(OUT, 'home.html'), await page.evaluate(() => document.querySelector('.board').outerHTML.slice(0, 3000)));
    await tap(LOG, { wait: 900 }); AI = { name: 'blue folder' }; await cam('folder.jpg'); await tap('.lc-shutter', { wait: 1200 });
    await snap('p1-log-after-shot.png');
    fs.writeFileSync(path.join(OUT, 'cam.html'), await page.evaluate(() => document.querySelector('.lc') ? document.querySelector('.lc').outerHTML.replace(/src="data:[^"]{60,}"/g, 'src="DATA"').replace(/url\(&quot;data:[^)]*\)/g,'url(DATA)').slice(0, 12000) : document.body.innerHTML.slice(0, 4000)));
    await page.evaluate(() => { window.__noAuto = true; });
    await home();
    await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', 'baseball'); await page.waitForTimeout(500); await snap('p2-find.png');
    fs.writeFileSync(path.join(OUT, 'ask.html'), await page.evaluate(() => document.querySelector('.ask').outerHTML.replace(/src="data:[^"]{60,}"/g, 'src="DATA"').slice(0, 5000)));
    await page.click('.ask .tile >> nth=0'); await page.waitForSelector('.card.thing'); await page.waitForTimeout(600); await snap('p3-thing.png');
    fs.writeFileSync(path.join(OUT, 'thing.html'), await page.evaluate(() => document.querySelector('.screen').outerHTML.replace(/src="data:[^"]{60,}"/g, 'src="DATA"').slice(0, 9000)));
    await page.evaluate(() => window.scrollTo(0, 2000)); await snap('p4-thing-low.png');
  }
  await seedHouse();
  try { await runSuite(); } catch (e) { console.error('FATAL', e); }
  await browser.close();
}
(async () => { await new Promise((r) => server.listen(PORT, r)); await runLook('b'); console.log('errors', errors); server.close(); })();
