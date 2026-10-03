// indep2 helpers on top of lib.js (copied from indep/). One browser per script.
const { start, img } = require('./lib.js');
const OWN = { owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [] };
async function boot(opts = {}) {
  const H = await start({ port: Number(process.env.PORT || 8492), ...opts });
  const { page, W } = H;
  H.S.GUESS = { name: 'X', merged: 'X' };
  H.seedMore = (docs) => page.evaluate((d) => window.__rig.seed(d), docs);
  H.item = (id, name, loc, f, ago, extra = {}) => { const now = Date.now(); return { id, kind: 'item', ...OWN, name, location: loc, photo: img(f), thumb: img(f), thumbV: 2, order: now - ago, createdAt: now - ago, lastSeenAt: now - ago, logId: 'l_' + id, photoCount: 1, history: [{ location: loc, at: now - ago }], ...extra }; };
  H.place = (id, name, fs = [], ago = 1e8) => { const now = Date.now(); return { id, kind: 'place', ...OWN, name, order: now - ago, createdAt: now - ago, parent: null, photos: fs.map((f, i) => ({ photo: img(f), thumb: img(f), at: now - ago + i })) }; };
  H.edge = (id, from, to, ago = 1e7, extra = {}) => ({ id, kind: 'edge', rel: 'in', from, to, since: Date.now() - ago, until: null, how: 'chosen', ...OWN, ...extra });
  H.snapDoc = (id, itemId, f, loc, ago, extra = {}) => ({ id, kind: 'snap', owner: 'margaret', by: 'margaret', itemId, logId: 'l_' + itemId, photo: img(f), thumb: img(f), location: loc, at: Date.now() - ago, ...extra });
  H.toastTxt = async () => (await page.locator('.toast').allInnerTexts().catch(() => [])).join(' | ');
  H.undoPage = async () => { await page.waitForSelector('.tp-moved .u'); await H.tap('.tp-moved .u', 1500); return H.toastTxt(); };
  H.addNote = async (t) => { await H.tap('.ow-note', 300); await page.fill('.ow-note-in', t); await W(200); };
  H.strip = async () => (await H.txt('.ow-to')).replace(/\n/g, ' ');
  H.pageAll = async () => (await H.txt('.thing-page')).replace(/\n/g, ' | ');
  H.wsOf = (it) => (it.history || []).filter((h) => h.w).map((h) => ({ said: h.said, n: h.n || 0, by: h.by, at: h.at, saidAt: h.saidAt, undo: h.undo || 0 }));
  H.short = (it) => it && ({ loc: it.location, needsPlace: it.needsPlace, ws: H.wsOf(it), photoCount: it.photoCount });
  H.logNew = async (aiName, f) => { await H.home(); H.S.AI = { name: aiName }; await H.tap(H.LOG, 900); await H.shoot(f); await W(700); };
  return H;
}
module.exports = { boot, img, OWN };
