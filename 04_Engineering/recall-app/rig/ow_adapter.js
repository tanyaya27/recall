// 10-02 (one where): the older suites open "What is it in?" (the release-1 In chip) and pick from .in-list. On the new camera
// the same list opens from → (the where sheet) → Change / Choose. This adapter, loaded with `node -r ./ow_adapter.js suite.js`,
// adds one init script to every page: when a pick closes the In list while the where sheet is open, it presses Done, so the
// old flow (open → pick → back on the camera with the where set) still reads the same. The suites' own selectors are mapped
// by OW_OPEN below (sed'ed into each suite), never by changing the app.
const Module = require('module');
const load = Module._load; let wrapped = null;
const OBS = () => {
  window.__owAutoDone = true;
  const mo = new MutationObserver(() => {
    if (!window.__owAutoDone) return;
    const sheet = document.querySelector('.ow-sheet'); const list = document.querySelector('.in-list');
    if (sheet && !list && window.__owWasList) { window.__owWasList = false; const d = sheet.querySelector('.ow-done'); if (d) d.click(); }
    window.__owWasList = !!(list && document.querySelector('.lc')); // only an In list opened on the camera (from the where sheet)
  });
  document.addEventListener('DOMContentLoaded', () => mo.observe(document.body, { childList: true, subtree: true }));
};
Module._load = function (req, ...rest) {
  const m = load.call(this, req, ...rest);
  if (req !== 'playwright') return m;
  if (wrapped) return wrapped;
  const wrapBrowser = (b) => { const nc = b.newContext.bind(b); b.newContext = async (c) => { const ctx = await nc(c); await ctx.addInitScript(OBS); return ctx; };
    const np = b.newPage.bind(b); b.newPage = async (c) => { const ctx = await b.newContext(c); return ctx.newPage(); }; return b; };
  const wrapType = (t) => new Proxy(t, { get: (o, k) => (k === 'launch' ? async (opt) => wrapBrowser(await o.launch(opt)) : o[k]) });
  wrapped = new Proxy(m, { get: (t, k) => (k === 'chromium' || k === 'webkit' ? wrapType(t[k]) : t[k]) });
  return wrapped;
};
