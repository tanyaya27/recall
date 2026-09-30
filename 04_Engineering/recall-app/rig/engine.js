// 09-30 (TESTING.md): run any suite in WebKit — Safari's engine — instead of Chromium, unchanged:
//   ENGINE=webkit node -r ./engine.js audit_chain.js
// WebKit lives in /home/claude/pw-webkit (PLAYWRIGHT_BROWSERS_PATH=/home/claude/pw-webkit npx playwright install webkit).
// The suites ask for `chromium` with Chromium-only flags and a camera permission; here those are dropped (the rig's fake
// camera is a canvas stream the page itself installs, so no browser permission is needed).
if (process.env.ENGINE === 'webkit') {
  process.env.PLAYWRIGHT_BROWSERS_PATH = process.env.WEBKIT_PATH || '/home/claude/pw-webkit';
  const Module = require('module');
  const load = Module._load;
  let wrapped = null;
  Module._load = function (req, ...rest) {
    const m = load.call(this, req, ...rest);
    if (req !== 'playwright' && req !== '@playwright/test') return m;
    if (wrapped) return wrapped;
    const wk = m.webkit;
    const strip = (c = {}) => { const { permissions, ...o } = c; return o; };
    const shim = {
      name: () => 'webkit',
      launch: async (o = {}) => {
        const b = await wk.launch({ ...o, args: [] });
        const nc = b.newContext.bind(b); const np = b.newPage.bind(b);
        b.newContext = (c) => nc(strip(c)); b.newPage = (c) => np(strip(c));
        return b;
      },
    };
    wrapped = new Proxy(m, { get: (t, k) => (k === 'chromium' ? shim : t[k]) });
    return wrapped;
  };
  console.log('[engine] WebKit (Safari engine)');
}
