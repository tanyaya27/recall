// 09-30 shutter-mark design round — mock layer drawn over the REAL camera screens (not app source).
// window.__SZ.apply(opt, what, arg): opt = R1 | R2 | A | B.
window.__SZ = (() => {
  const INK = '#1C1A17';
  const svg = (d, sw) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const PIN = (sw = 2) => svg('<path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2.5"/>', sw);
  // STACK: a photo with one more peeking up-right — 'adds to the pile'; mirrors the square's stack edge in (d)
  const STACK = (sw = 2.1) => svg('<path d="M7.5 3.5h11a2 2 0 0 1 2 2v11"/><rect x="3.5" y="7.5" width="13" height="13" rx="2.5"/><circle cx="12.2" cy="11.6" r="1.25" fill="currentColor" stroke="none"/><path d="M3.8 18.6l4.2-4.1 3 2.8"/>', sw);
  const PLUS = (sw = 2.5) => svg('<path d="M12 5v14M5 12h14"/>', sw);
  const css = `
  .sz-frost{background:rgba(22,20,18,.72);-webkit-backdrop-filter:blur(20px) saturate(1.6);backdrop-filter:blur(20px) saturate(1.6);
    box-shadow:inset 0 0 0 .5px rgba(255,255,255,.28),0 1px 4px rgba(0,0,0,.4);color:#fff}
  .lc-shutter{overflow:visible}
  .lc-shutter span{display:flex !important;align-items:center;justify-content:center;color:${INK};transition:none}
  .lc-shutter span svg{display:block}
  .sz-disc-plus svg{width:26px;height:26px}
  .sz-disc-stack svg{width:30px;height:30px;transform:translate(.5px,-.5px)}
  .sz-mini .d.stack svg{width:19px;height:19px;transform:translate(.25px,-.25px)}
  .sz-disc-pin svg{width:27px;height:27px;transform:translateY(1px)}
  .sz-disc-word{font:700 15px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;letter-spacing:-.01em;color:${INK}}
  .sz-disc-photo{background-size:cover !important;background-position:center !important;box-shadow:inset 0 0 0 2.5px #fff}
  /* tab riding on the ring (Ravi's options) — cut out of the ring by a 3pt black moat */
  .sz-tab{position:absolute;left:50%;top:-15px;transform:translateX(-50%);height:24px;min-width:34px;padding:0 9px;box-sizing:border-box;border-radius:12px;
    display:flex;align-items:center;justify-content:center;gap:4px;font:600 13px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;letter-spacing:.01em;
    box-shadow:0 0 0 3px #000,inset 0 0 0 .5px rgba(255,255,255,.28);pointer-events:none;z-index:3}
  .sz-tab svg{width:14px;height:14px}
  .sz-tab.photo{padding:0;width:34px;min-width:0;height:28px;top:-19px;border-radius:8px;background-size:cover;background-position:center;box-shadow:0 0 0 3px #000,inset 0 0 0 1.5px rgba(255,255,255,.95)}
  /* mini shutter token for modal rows and the Choose-place row */
  .sz-mini{position:relative;flex:none;width:44px;height:44px;border-radius:50%;background:#000;box-shadow:inset 0 0 0 3px var(--c),0 0 0 .5px rgba(255,255,255,.12);
    display:flex;align-items:center;justify-content:center;box-sizing:border-box}
  .sz-mini .d{width:32px;height:32px;border-radius:50%;background:#fff;color:${INK};display:flex;align-items:center;justify-content:center;background-size:cover;background-position:center}
  .sz-mini .d.photo{box-shadow:inset 0 0 0 1.5px #fff}
  .sz-mini .d svg{width:16px;height:16px}
  .sz-mini .d.pin svg{width:18px;height:18px;transform:translateY(.5px)}
  .sz-mini .d.word{font:800 9.5px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;letter-spacing:.01em}
  .sz-mini .t{position:absolute;left:50%;top:-8px;transform:translateX(-50%);height:15px;min-width:20px;padding:0 5px;box-sizing:border-box;border-radius:8px;
    display:flex;align-items:center;justify-content:center;font:700 9px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;background:#2c2926;color:#fff;box-shadow:0 0 0 2px var(--bgc,#2A2724),inset 0 0 0 .5px rgba(255,255,255,.3)}
  .sz-mini .t svg{width:9px;height:9px}
  .sz-mini .t.photo{padding:0;width:20px;min-width:0;height:17px;top:-10px;border-radius:5px;background-size:cover;background-position:center;box-shadow:0 0 0 2px var(--bgc,#2A2724),inset 0 0 0 1px #fff}
  /* B: caption docked above the shutter, words first */
  .sz-cap{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 11px 0 9px;border-radius:14px;box-sizing:border-box;white-space:nowrap;
    font:600 13px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;letter-spacing:.005em}
  .sz-cap svg{width:14px;height:14px;flex:none}
  .sz-cap .th{width:20px;height:20px;border-radius:5px;margin-left:-5px;background-size:cover;background-position:center;box-shadow:inset 0 0 0 1px rgba(255,255,255,.7);flex:none}
  .sz-capdock{position:fixed;transform:translate(-50%,-100%);z-index:30;pointer-events:none}
  .sz-cap.row{height:26px;font-size:12.5px;background:rgba(255,255,255,.08);box-shadow:inset 0 0 0 1px rgba(255,255,255,.2);color:#fff}
  .sz-cap.onmint{background:rgba(0,0,0,.82);color:#fff;box-shadow:none}
  /* (d) feedback */
  .sz-fly{position:fixed;z-index:60;border-radius:10px;background-size:cover;background-position:center;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.95),0 6px 18px rgba(0,0,0,.45);pointer-events:none}
  .sz-stack{position:absolute;inset:0;border-radius:14px;pointer-events:none}
  `;
  const ensureCss = () => { if (!document.getElementById('sz-css')) { const s = document.createElement('style'); s.id = 'sz-css'; s.textContent = css; document.head.appendChild(s); } };
  const bg = (u) => `background-image:url("${u}")`;
  const tierColour = () => getComputedStyle(document.querySelector('.lc-shutter')).borderTopColor;
  const placeThumb = () => { const i = document.querySelector('.lv-strip .lv-sq img'); return window.__szPlace || (i && i.src); };

  const clearShutter = () => { const sh = document.querySelector('.lc-shutter'); if (!sh) return; const sp = sh.querySelector('span');
    sp.innerHTML = ''; sp.className = ''; sp.style.cssText = ''; sh.querySelectorAll('.sz-tab').forEach((x) => x.remove());
    document.querySelectorAll('.sz-capdock').forEach((x) => x.remove()); const card = document.querySelector('.lc-card'); if (card) card.style.bottom = ''; };

  // the shutter in state b ("more photos of <place>") or c ("new place")
  function shutter(opt, st) {
    ensureCss(); clearShutter(); const sh = document.querySelector('.lc-shutter'); const sp = sh.querySelector('span'); const ph = placeThumb();
    const tab = (cls, html, style) => { const t = document.createElement('b'); t.className = 'sz-tab sz-frost ' + (cls || ''); t.innerHTML = html || ''; if (style) t.style.cssText = style; sh.appendChild(t); };
    if (opt === 'R1') {
      if (st === 'b') { sp.className = 'sz-disc-photo'; sp.style.cssText = bg(ph); tab('', PLUS(2.75)); }
      else { sp.className = 'sz-disc-pin'; sp.innerHTML = PIN(2.1); tab('', 'New'); }
    } else if (opt === 'R2') {
      if (st === 'b') { sp.className = 'sz-disc-plus'; sp.innerHTML = PLUS(2.6); tab('photo', '', bg(ph)); }
      else { sp.className = 'sz-disc-word'; sp.textContent = 'New'; tab('', PIN(2.2)); }
    } else if (opt === 'A') {
      if (st === 'b') { sp.className = 'sz-disc-stack'; sp.innerHTML = STACK(2.1); }
      else { sp.className = 'sz-disc-pin'; sp.innerHTML = PIN(2.2); }
    } else if (opt === 'B') {
      const card = document.querySelector('.lc-card'); if (card) card.style.bottom = '48px';
      const r = sh.getBoundingClientRect(); const d = document.createElement('div'); d.className = 'sz-capdock';
      d.style.left = (r.left + r.width / 2) + 'px'; d.style.top = (r.top - 9) + 'px';
      d.innerHTML = st === 'b' ? `<span class="sz-cap sz-frost"><i class="th" style='${bg(ph)}'></i>More photos</span>`
        : `<span class="sz-cap sz-frost">${PIN(2.2)}New place</span>`;
      document.body.appendChild(d);
    }
    sh.setAttribute('aria-label', st === 'b' ? 'Take a photo — adds to the White cardboard box' : 'Take a photo of the new place');
  }

  // a mini shutter for rows. kind b|c
  function mini(opt, kind, ph, bgc) {
    const c = tierColour();
    let d = '', t = '';
    if (opt === 'R1') { d = kind === 'b' ? `<i class="d photo" style='${bg(ph)}'></i>` : `<i class="d pin">${PIN(2.3)}</i>`; t = kind === 'b' ? `<b class="t">${PLUS(3.2)}</b>` : `<b class="t">New</b>`; }
    if (opt === 'R2') { d = kind === 'b' ? `<i class="d">${PLUS(2.8)}</i>` : `<i class="d word">New</i>`; t = kind === 'b' ? `<b class="t photo" style='${bg(ph)}'></b>` : `<b class="t">${PIN(2.6)}</b>`; }
    if (opt === 'A') { d = kind === 'b' ? `<i class="d stack">${STACK(2.3)}</i>` : `<i class="d pin">${PIN(2.3)}</i>`; }
    return `<span class="sz-mini" style="--c:${c};--bgc:${bgc || '#2A2724'}">${d}${t}</span>`;
  }
  const cap = (kind, ph, cls) => kind === 'b' ? `<span class="sz-cap ${cls}"><i class="th" style='${bg(ph)}'></i>More photos</span>` : `<span class="sz-cap ${cls}">${PIN(2.2)}New place</span>`;

  function modal(opt) {
    ensureCss(); const same = document.querySelector('.photo-for .pf-same'), other = document.querySelector('.photo-for .pf-other');
    const im = same.querySelector('img'); const ph = (im && im.src) || placeThumb(); window.__szPlace = ph;
    const sheetBg = getComputedStyle(document.querySelector('.sheet.photo-for')).backgroundColor;
    if (opt === 'B') {
      [[same, 'b'], [other, 'c']].forEach(([row, k]) => { const w = document.createElement('span'); w.innerHTML = cap(k, ph, 'row'); w.style.cssText = 'display:flex;margin-top:7px'; row.querySelector('.tx').appendChild(w); });
      return;
    }
    const lead = (row) => row.querySelector(':scope > img, :scope > .no');
    [[same, 'b'], [other, 'c']].forEach(([row, k]) => { const l = lead(row); const w = document.createElement('span'); w.innerHTML = mini(opt, k, ph, sheetBg); l.replaceWith(w.firstChild); });
    if (opt === 'R1' || opt === 'R2') [same, other].forEach((row) => { row.style.paddingTop = '12px'; });
    if (opt === 'R2' || opt === 'A') { const t = document.createElement('img'); t.src = ph; t.alt = ''; t.style.cssText = 'flex:none;width:44px;height:44px;border-radius:10px;object-fit:cover;margin-right:2px'; same.appendChild(t); same.querySelector('.tx b').style.whiteSpace = 'normal'; }
  }

  function chooseRow(opt) {
    ensureCss(); const b = document.querySelector('.where-list .wl-new'); if (!b) return 'no wl-new';
    const ph = placeThumb(); const bgc = getComputedStyle(b).backgroundColor;
    if (opt === 'B') { const ic0 = b.querySelector('svg'); if (ic0) ic0.remove(); b.style.whiteSpace = 'nowrap'; const w = document.createElement('span'); w.innerHTML = cap('c', ph, 'onmint'); w.style.cssText = 'margin-left:auto;display:flex'; b.appendChild(w); b.style.paddingRight = '10px'; b.style.paddingLeft = '16px'; return; }
    const ic = b.querySelector('svg'); const w = document.createElement('span'); w.innerHTML = mini(opt, 'c', ph, bgc); ic.replaceWith(w.firstChild);
    b.style.paddingLeft = '8px'; b.style.gap = '12px'; if (opt !== 'A') { b.style.minHeight = '64px'; b.style.paddingTop = '6px'; }
  }

  // (d): one frame ~60% into the fly-in; the square shows a stack edge; the line says it in words
  function fly(opt, shot, n) {
    ensureCss(); const sh = document.querySelector('.lc-shutter').getBoundingClientRect(); const sqEl = document.querySelector('.lv-strip .lv-sq.sel') || document.querySelector('.lv-strip .lv-sq');
    const sq = sqEl.getBoundingClientRect(); const x0 = sh.left + sh.width / 2, y0 = sh.top + sh.height / 2, x1 = sq.left + sq.width / 2, y1 = sq.top + sq.height / 2;
    const e = 0.78; // position along the path at the captured frame
    const cx = x0 + (x1 - x0) * e + Math.sin(Math.PI * e) * 26, cy = y0 + (y1 - y0) * e; const w = 58 + (sq.width - 58) * e;
    const f = document.createElement('i'); f.className = 'sz-fly'; f.style.cssText += `left:${cx - w / 2}px;top:${cy - w / 2}px;width:${w}px;height:${w}px;${bg(shot)};border-radius:${29 - 17 * e}px`; document.body.appendChild(f);
    // one stack edge peeking behind the square (up-right): it now holds several photos
    const col = getComputedStyle(sqEl).borderTopColor; const W = sq.width, Hh = sq.height, o = 5;
    const ed = document.createElement('i'); ed.className = 'sz-edge';
    ed.style.cssText = `position:fixed;left:${sq.left + o}px;top:${sq.top - o}px;width:${W}px;height:${Hh}px;box-sizing:border-box;border-radius:14px;border:2px solid ${col};opacity:.6;background:#2d2a27;z-index:58;pointer-events:none;clip-path:polygon(0 0,${W}px 0,${W}px ${Hh}px,${W - o}px ${Hh}px,${W - o}px ${o}px,0 ${o}px)`;
    document.body.appendChild(ed);
    const p = document.querySelector('.lc-prompt, .lc-card .lc-say'); const say = [...document.querySelectorAll('.lc-card *')].find((x) => x.childElementCount === 0 && /Shutter: more photos/.test(x.textContent)) || [...document.querySelectorAll('.lc-card div')].find((x) => /^Shutter: more photos/.test(x.textContent));
    if (say) { say.dataset.was = say.innerHTML; say.innerHTML = `Added — ${n} photos of the White cardboard box. Tap its square to change that.`; }
    return !!say;
  }
  function unfly() { document.querySelectorAll('.sz-fly,.sz-edge').forEach((x) => x.remove()); const s = [...document.querySelectorAll('[data-was]')]; s.forEach((x) => { x.innerHTML = x.dataset.was; delete x.dataset.was; }); }
  function promptC() { const say = [...document.querySelectorAll('.lc-card div, .lc-card p, .lc-card span')].find((x) => /Photograph the new place|Photograph the place/.test(x.textContent) && x.textContent.length < 90);
    if (say) say.textContent = 'Shutter: the new place. Photograph it.'; return say ? say.className : null; }
  function rects() { const q = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; };
    return { shutter: q('.lc-shutter'), card: q('.lc-card'), bot: q('.lc-bot'), sq: q('.lv-strip .lv-sq'), sheet: q('.sheet'), wlnew: q('.where-list .wl-new') }; }
  return { shutter, modal, chooseRow, fly, unfly, promptC, clearShutter, rects, ensureCss };
})();
