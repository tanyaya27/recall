import { useEffect, useLayoutEffect, useRef, useState } from 'react';

// 10-03 (Ravi: "click on the preposition and pick a new one like users pick emojis in a SMS texting interface";
// BOARD_2026-10-03_usability-1.md T1–T3). The little word on a link as a pill. Tapping it pops a bar of the words that fit
// the place (graph.prepOptions), the current one lit; one tap picks and closes, a tap anywhere else closes with no change.
// The bar sits above the pill, or below it when a scrolling sheet's top (or the screen's) would cut it off, and is kept on screen.
//   label    what the pill says ("on", "which is in")
//   value    the word now · options  the words offered (fewer than two: a plain pill, nothing to tap)
//   note     a line with the bar when the word is shared ("For everything in the Craft room · 3 items")
//   onPick(word)
export default function PrepPill({ label, value, options = [], note = '', onPick = null, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const btn = useRef(null); const bar = useRef(null);
  const can = !!onPick && !disabled && options.length > 1;
  useEffect(() => {
    if (!open) return undefined;
    const k = (e) => { if (e.key === 'Escape') setOpen(false); };
    const close = () => setOpen(false);
    window.addEventListener('keydown', k); window.addEventListener('resize', close);
    return () => { window.removeEventListener('keydown', k); window.removeEventListener('resize', close); };
  }, [open]);
  useLayoutEffect(() => {
    if (!open || !btn.current || !bar.current) return;
    const r = btn.current.getBoundingClientRect(); const b = bar.current.getBoundingClientRect();
    let sp = btn.current.parentElement; let topLimit = 8;
    while (sp && sp !== document.body) { const cs = getComputedStyle(sp); if (/(auto|scroll|hidden)/.test(cs.overflowY)) { topLimit = Math.max(topLimit, sp.getBoundingClientRect().top + 4); break; } sp = sp.parentElement; }
    const W = window.innerWidth; const gap = 10;
    const leftAbs = Math.max(8, Math.min(r.left - 6, W - b.width - 8));
    const below = r.top - b.height - gap < topLimit;
    const left = leftAbs - r.left; const arrow = Math.max(12, Math.min(r.left + r.width / 2 - leftAbs - 6, b.width - 24));
    if (!pos || pos.left !== left || pos.below !== below) setPos({ left, below, arrow });
  });
  if (!label) return null;
  if (!can) return <span className="pp">{label}</span>;
  return (
    <span className={'pp-wrap' + (open ? ' open' : '')}>
      <button ref={btn} type="button" className={'pp pp-btn' + (open ? ' hot' : '')} aria-haspopup="true" aria-expanded={open} aria-label={`${label}, change`}
        onClick={(e) => { e.stopPropagation(); setPos(null); setOpen(!open); }}>{label}</button>
      {open && <span className="pp-scrim" onClick={(e) => { e.stopPropagation(); setOpen(false); }} role="presentation" />}
      {open && (
        <span ref={bar} className={'pp-pop' + (pos && pos.below ? ' below' : '')} role="menu" aria-label="Change the word"
          style={pos ? { left: `${pos.left}px`, '--arrow': `${pos.arrow}px` } : { left: 0, visibility: 'hidden' }}>
          {note ? <span className="pp-note">{note}</span> : null}
          <span className="pp-bar">
            {options.map((w) => (
              <button type="button" key={w} role="menuitemradio" aria-checked={w === value} className={'pp-opt' + (w === value ? ' cur' : '')}
                onClick={(e) => { e.stopPropagation(); setOpen(false); if (w !== value) onPick(w); }}>{w}</button>))}
          </span>
        </span>)}
    </span>
  );
}
