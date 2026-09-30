  // ---- independent tester helpers (indep) ----
  const SHOTDIR = path.join('/home/claude/indep/shots', process.env.TAG || 'x'); fs.mkdirSync(SHOTDIR, { recursive: true });
  let sn = 0; const ENG = process.env.ENGINE === 'webkit' ? 'wk' : 'cr';
  const shot = async (label) => { sn++; const f = path.join(SHOTDIR, `${ENG}-${String(sn).padStart(2, '0')}-${label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`); await page.waitForTimeout(250); await page.screenshot({ path: f }); console.log('  [shot]', f); return f; };
  const ui = async (label) => { const r = await page.evaluate(() => {
      const vis = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && r.bottom > 0 && r.top < innerHeight; };
      const btns = [...document.querySelectorAll('button, [role=button], a, input, textarea')].filter(vis).map((b) => { const r = b.getBoundingClientRect(); return `${b.tagName.toLowerCase()}${b.className ? '.' + String(b.className).trim().split(/\s+/).join('.') : ''}${b.disabled ? '[disabled]' : ''} "${(b.innerText || b.value || b.getAttribute('aria-label') || b.placeholder || '').replace(/\s+/g, ' ').slice(0, 60)}" @${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}`; });
      return { text: document.body.innerText.replace(/\n{2,}/g, '\n').slice(0, 1500), btns }; });
    console.log(`\n=== UI ${label} ===\n--text--\n${r.text}\n--controls--\n${r.btns.join('\n')}\n`); return r; };
  const bodyText = () => page.evaluate(() => document.body.innerText);
  const edgesOf = (nm) => page.evaluate((n) => { const d = window.__rig.dump(); const x = d.find((z) => (z.kind === 'place' || z.kind === 'item') && !z.deleted && (z.name || '').toLowerCase() === n.toLowerCase()); if (!x) return 'MISSING'; return d.filter((e) => e.kind === 'edge' && e.from === x.id && !e.until).map((e) => `${e.to.t}:${e.to.name}`).join(',') || 'none'; }, nm);
  const chainOf = async (nm) => { const out = [nm]; let cur = nm; for (let i = 0; i < 8; i++) { const e = await edgesOf(cur); if (e === 'none' || e === 'MISSING') { if (e === 'MISSING') out.push('?MISSING'); break; } const parts = e.split(','); if (parts.length > 1) out.push('!MULTI(' + e + ')'); cur = parts[0].split(':').slice(1).join(':'); out.push(cur); } return out.join(' > '); };
  const kbInit = () => page.addInitScript(() => { const et = new EventTarget(); let h = null; const H = () => (h === null ? window.innerHeight : h);
      Object.defineProperty(et, 'height', { get: H }); Object.defineProperty(et, 'offsetTop', { get: () => 0 }); Object.defineProperty(et, 'width', { get: () => window.innerWidth });
      Object.defineProperty(window, 'visualViewport', { configurable: true, get: () => et });
      window.__kb = (px) => { h = window.innerHeight - px; et.dispatchEvent(new Event('resize'));
        let k = document.getElementById('__kbv'); if (!px) { if (k) k.remove(); return; }
        if (!k) { k = document.createElement('div'); k.id = '__kbv'; document.body.appendChild(k); }
        k.style.cssText = `position:fixed;left:0;right:0;bottom:0;height:${px}px;background:#c9ccd3;z-index:99999;pointer-events:none;display:flex;align-items:center;justify-content:center;font:600 20px system-ui;color:#555`; k.textContent = 'keyboard'; }; });
  const kbUp = (px = 380) => page.evaluate((p) => window.__kb(p), px); const kbDown = () => page.evaluate(() => window.__kb(0));
  const aboveKb = (sel, px = 380) => page.evaluate(([q, p]) => { const e = document.querySelector(q); if (!e) return { q, there: false, ok: false }; const r = e.getBoundingClientRect(); return { q, there: true, top: Math.round(r.top), bottom: Math.round(r.bottom), ok: r.top >= 0 && r.bottom <= innerHeight - p }; }, [sel, px]);
  const itemDoc = (nm) => page.evaluate((n) => window.__rig.dump().find((x) => x.kind === 'item' && !x.deleted && (x.name || '').toLowerCase() === n.toLowerCase()) || null, nm);
