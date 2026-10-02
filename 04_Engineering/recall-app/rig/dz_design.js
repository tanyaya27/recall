// Mock layer for the 09-30 shutter design round. window.__dz(dir, state, extra) — dir A|B|C|none, state a|b|c|d.
window.__dz = (dir, state, x) => {
  document.querySelectorAll('.dz').forEach((e) => e.remove());
  const sh = document.querySelector('.lc-shutter'); const disc = sh.querySelector('span');
  [...sh.classList].filter((c) => c.startsWith('dz-')).forEach((c) => sh.classList.remove(c));
  let st = document.getElementById('dz-style'); if (!st) { st = document.createElement('style'); st.id = 'dz-style'; document.head.appendChild(st); }
  st.textContent = '';
  if (dir === 'none') return;
  const col = getComputedStyle(sh).borderTopColor;
  const INK = '#1F1D1A';
  const svgNS = 'http://www.w3.org/2000/svg';
  const el = (tag, css, html) => { const e = document.createElement(tag); e.className = 'dz'; if (css) e.style.cssText = css; if (html != null) e.innerHTML = html; return e; };
  const sq = document.querySelector('.lv-strip .lv-sq.sel') || document.querySelector('.lv-strip .lv-sq');
  const R = (e) => e.getBoundingClientRect();
  const emptySquare = (s, stroke, sw) => { // dashed rounded square, dash count tuned so the corners land in dashes
    const r = s * 0.26, per = 4 * (s - 2 * r) + 2 * Math.PI * r, n = 12, u = per / n;
    return `<svg width="${s + sw}" height="${s + sw}" viewBox="${-sw / 2} ${-sw / 2} ${s + sw} ${s + sw}" style="display:block"><rect x="0" y="0" width="${s}" height="${s}" rx="${r}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-dasharray="${u * 0.62} ${u * 0.38}" stroke-dashoffset="${u * 0.31 - (s / 2 - r)}" stroke-linecap="round"/></svg>`; };
  // the square's resulting state after (d): a second photo peeking behind it (a stack), never a count badge
  const stackEdge = () => { if (!sq) return; const r = R(sq);
    document.body.appendChild(el('div', `position:fixed;left:${r.left + 4}px;top:${r.top - 4}px;width:${r.width}px;height:${r.height}px;border-radius:12px;background:#4A453F;border:1.5px solid rgba(255,255,255,0.55);box-sizing:border-box;z-index:40`));
    const img = sq.querySelector('img'); const cs = getComputedStyle(sq);
    document.body.appendChild(el('div', `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;border-radius:12px;overflow:hidden;box-sizing:border-box;border:${cs.borderTopWidth} solid ${cs.borderTopColor};box-shadow:0 0 0 2px rgba(0,0,0,0.45), -2px 3px 8px rgba(0,0,0,0.35);z-index:41;background:#222`,
      `<img src="${x.newThumb || (img && img.src) || ''}" style="width:100%;height:100%;object-fit:cover;display:block">`)); };

  if (dir === 'A') { // the disc shows where the shot goes
    sh.classList.add('dz-A');
    st.textContent = `.lc-shutter.dz-A span{position:relative;display:flex;align-items:center;justify-content:center;transition:none}`;
    if (state === 'b') {
      disc.appendChild(el('img', `position:absolute;left:4px;top:4px;width:50px;height:50px;border-radius:50%;object-fit:cover;display:block;box-shadow:inset 0 0 0 1px rgba(0,0,0,0.25)`)).src = x.thumb;
      disc.lastChild.className = 'dz';
      disc.appendChild(el('span', `position:absolute;left:4px;top:4px;width:50px;height:50px;border-radius:50%;box-shadow:inset 0 0 0 1px rgba(0,0,0,0.28);pointer-events:none`));
    }
    if (state === 'c') disc.appendChild(el('span', `display:block;line-height:0`, emptySquare(24, INK, 2.25)));
    if (state === 'd') { // the shot shrinks from the viewfinder into the square (one object, no trail); frame at ~70%
      disc.appendChild(el('img', `position:absolute;left:4px;top:4px;width:50px;height:50px;border-radius:50%;object-fit:cover;display:block`)).src = x.thumb; disc.lastChild.className = 'dz';
      const s = R(sq); const vf = { x: window.innerWidth / 2, y: 330 }; const t = 0.72;
      const ex = s.left + s.width / 2, ey = s.top + s.height / 2; const cx = vf.x + (ex - vf.x) * t - 18 * Math.sin(Math.PI * t), cy = vf.y + (ey - vf.y) * (t * t * 0.3 + t * 0.7);
      const w = 300 + (58 - 300) * t, h = 400 + (58 - 400) * t;
      document.body.appendChild(el('img', `position:fixed;left:${cx - w / 2}px;top:${cy - h / 2}px;width:${w}px;height:${h}px;object-fit:cover;border-radius:${10 + 2 * t}px;border:2px solid rgba(255,255,255,0.95);box-sizing:border-box;box-shadow:0 10px 28px rgba(0,0,0,0.5);z-index:60`)).src = x.shot;
      stackEdge();
    }
  }

  if (dir === 'B') { // the ring alone carries it: solid = ask; double = more of the same; dashed = a new place
    if (state === 'a') return;
    sh.classList.add('dz-B');
    st.textContent = `.lc-shutter.dz-B{border-color:transparent !important}`;
    const svg = document.createElementNS(svgNS, 'svg'); svg.setAttribute('class', 'dz'); svg.setAttribute('viewBox', '0 0 80 80');
    svg.style.cssText = 'position:absolute;left:-5px;top:-5px;width:80px;height:80px;pointer-events:none;overflow:visible';
    if (state === 'b' || state === 'd') svg.innerHTML = `<circle cx="40" cy="40" r="38.6" fill="none" stroke="${col}" stroke-width="2.8"/><circle cx="40" cy="40" r="33.6" fill="none" stroke="${col}" stroke-width="2.8"/>`;
    if (state === 'c') { const r = 37.5, C = 2 * Math.PI * r, n = 20, u = C / n;
      svg.innerHTML = `<circle cx="40" cy="40" r="${r}" fill="none" stroke="${col}" stroke-width="5" stroke-dasharray="${u * 0.58} ${u * 0.42}" stroke-dashoffset="${u * 0.29}" transform="rotate(-90 40 40)"/>`; }
    sh.appendChild(svg);
    if (state === 'd') { const s = R(sq); stackEdge();
      document.body.appendChild(el('div', `position:fixed;left:${s.left - 7}px;top:${s.top - 7}px;width:${s.width + 14}px;height:${s.height + 14}px;border-radius:17px;border:2px solid rgba(255,255,255,0.5);box-sizing:border-box;z-index:42`)); }
  }

  if (dir === 'C') { // a caption in the bar, above the shutter (the iOS mode-label slot) — the slot is always reserved
    st.textContent = `.lc-bot{padding-top:30px !important;position:relative}`;
    void document.body.offsetHeight;
    const s = R(sh);
    const cap = (html) => document.body.appendChild(el('div', `position:fixed;left:50%;transform:translateX(-50%);top:${s.top - 27}px;height:22px;max-width:320px;display:flex;align-items:center;gap:7px;white-space:nowrap;
      font:600 15px/22px -apple-system,system-ui,'Helvetica Neue',sans-serif;letter-spacing:-0.1px;color:rgba(244,239,230,0.66);z-index:45`, html));
    if (state === 'b') cap(`<span style="width:16px;height:16px;border-radius:4px;overflow:hidden;box-shadow:0 0 0 1.5px ${col};flex:none"><img src="${x.thumb}" style="width:100%;height:100%;object-fit:cover;display:block"></span><span>Adding to</span><b style="color:#fff;font-weight:700;overflow:hidden;text-overflow:ellipsis">White cardboard box</b>`);
    if (state === 'c') cap(`<span style="flex:none;line-height:0">${emptySquare(14, '#fff', 1.6)}</span><span>Next photo:</span><b style="color:#fff;font-weight:700">the new place</b>`);
    if (state === 'd') { cap(`<span style="color:#7FD1B9;font-weight:800">✓</span><b style="color:#fff;font-weight:700">Added</b><span>· 2 photos</span>`); stackEdge(); }
  }
};
