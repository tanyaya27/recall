import { useLayoutEffect, useRef, useState } from 'react';

// The action zone. Board decision 2026-09-05, Rule 3; revised by Ravi 2026-09-05 (evening).
//
// Fixed to the bottom of the screen — not sticky, so it can never scroll away or float
// over a card (the bug that moved Back to the top last time). Used ONLY on Home and the
// thing card: any screen where a keyboard can open puts its actions in the flow instead
// (Priyanka, §3.3 — a fixed bar jumps when Safari's keyboard appears).
//
// Two shapes, chosen by measurement, never by guesswork:
//   bar     — the buttons side by side, one line each. The default.
//   compact — when any label cannot fit on one line at the current text size and screen
//             width, the whole footer becomes floating translucent icon buttons in the
//             bottom-right corner (the ordinary phone paradigm). The words move into the
//             accessible name; the content underneath gets the vertical space back.
// Stacking full-width buttons was rejected: it solved wrapping by spending 20% of the
// screen, and on a phone height is the scarce resource.
//
// Each child must mark its words with <span className="lbl">…</span>; the icon sits
// outside that span. The label text is mirrored into an offscreen probe (same font as the
// bar) and measured there, so the visible buttons never have to be laid out twice.
//
// Two traps, both hit on 2026-09-05:
//   - The probe is observed for size changes (that is how a text-size change re-measures),
//     so measure() must never rewrite the probe — rewriting it re-fires the observer, the
//     browser's loop guard drops the notifications, and the footer sticks in whatever shape
//     the FIRST measurement chose. Only touch a span when its text actually changed.
//   - The first measurement can run before the page has any width (a hidden render, a
//     restoring tab). A zero-width layout is not evidence: keep the current shape and wait.

// These mirror the .footer rules in styles.css. Change both or neither.
const GAP_REM = 0.625;      // between buttons
const PAD_REM = 1;          // horizontal padding inside a bar button (both sides)
const ICON_EM = 1.2;        // icon width in the bar, in the button's own font
const ICON_GAP_REM = 0.375; // space between icon and words
const BORDER_PX = 4;        // .alt has a 2px border each side
const SLACK_PX = 2;
const SIDE_REM = 1;         // .footer horizontal padding
const MAX_REM = 35;         // .footer-inner max-width

export default function Footer({ children }) {
  const inner = useRef(null);
  const probe = useRef(null);
  const [compact, setCompact] = useState(false);

  useLayoutEffect(() => {
    const el = inner.current, pr = probe.current;
    if (!el || !pr) return undefined;

    let tries = 0, raf = 0;
    const retry = () => { if (tries++ < 120 && !raf) raf = requestAnimationFrame(() => { raf = 0; measure(); }); };
    const measure = () => {
      const labels = Array.from(el.querySelectorAll('.lbl'));
      // Keep the probe in step with the labels without rewriting it needlessly.
      while (pr.children.length > labels.length) pr.removeChild(pr.lastChild);
      labels.forEach((l, i) => {
        let s = pr.children[i];
        if (!s) { s = document.createElement('span'); pr.appendChild(s); }
        if (s.textContent !== l.textContent) s.textContent = l.textContent;
      });
      if (!labels.length) { setCompact(false); return; }

      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      // innerWidth, not documentElement.clientWidth: the latter reads 0 in some embedded
      // renders even after layout (seen 2026-09-05), and a zero is not evidence.
      const vw = window.innerWidth || document.documentElement.clientWidth;
      if (vw < 120) { el.parentElement.dataset.measure = `waiting · width ${vw}`; retry(); return; }
      const n = labels.length;
      // Width the BAR shape would have — from the viewport, not from the inner box, whose
      // width changes with the shape (measuring it would oscillate between the two shapes).
      const barW = Math.min(vw - SIDE_REM * 2 * rem, MAX_REM * rem);
      const fontPx = parseFloat(getComputedStyle(pr).fontSize) || rem;
      const avail = (barW - GAP_REM * rem * (n - 1)) / n
        - PAD_REM * rem - ICON_EM * fontPx - ICON_GAP_REM * rem - BORDER_PX - SLACK_PX;
      const widths = Array.from(pr.children, (s) => s.getBoundingClientRect().width);
      if (widths.some((w) => w === 0)) { el.parentElement.dataset.measure = `waiting · labels ${widths.map(Math.round).join('/')}`; retry(); return; }
      const fits = widths.every((w) => w <= avail);
      // Left on the element on purpose: it is how a wrong shape gets diagnosed on a phone.
      el.parentElement.dataset.measure = `labels ${widths.map(Math.round).join('/')} · room ${Math.round(avail)} · ${fits ? 'bar' : 'icons'}`;
      setCompact(!fits);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);                        // the shape or the viewport changed
    ro.observe(pr);                        // the text size changed (probe grows or shrinks)
    ro.observe(document.documentElement);  // the page got its width
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); if (raf) cancelAnimationFrame(raf); };
  }, [children]);

  return (
    <div className={'footer' + (compact ? ' compact' : '')}>
      <div className="footer-inner" ref={inner}>{children}</div>
      <div className="footer-probe" ref={probe} aria-hidden="true" />
    </div>
  );
}
