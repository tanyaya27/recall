// realhouse.js — 09-30 (TESTING.md #6): load a copy of a real house (menu → Research log → "Download a copy of my house")
// into the rig, as its owner. Photos are the small ones the copy carries.
//   const H = require('./realhouse.js')({ page, PORT });  await H.load('/path/recall-house-2026-09-30.json');
const fs = require('fs');
module.exports = ({ page, PORT }) => ({
  async load(file) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (data.kind !== 'recall-house' || !Array.isArray(data.docs)) throw new Error('not a ReCall house copy: ' + file);
    await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen');
    await page.evaluate((me) => { localStorage.clear(); window.__rig.reset(); localStorage.setItem('rig-uid', me); localStorage.setItem('rig-anon', '0');
      localStorage.setItem('recall-ai-config', JSON.stringify({ provider: 'anthropic', apiKey: 'sk-ant-rig', model: '' })); }, data.me);
    await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen');
    for (let i = 0; i < data.docs.length; i += 200) await page.evaluate((chunk) => window.__rig.seed(chunk), data.docs.slice(i, i + 200));
    await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.screen'); await page.waitForTimeout(600);
    await page.evaluate(() => window.__rig.rules(true));
    return { me: data.me, docs: data.docs.length, items: data.docs.filter((d) => d.kind === 'item').length, places: data.docs.filter((d) => d.kind === 'place').length };
  },
});
