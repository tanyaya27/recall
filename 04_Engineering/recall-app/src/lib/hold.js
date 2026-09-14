import { useRef } from 'react';

// Press-and-hold (500 ms) that survives a scroll: movement cancels it, and the click that
// follows a fired hold is swallowed so the tap action does not also run. Used on the board
// tiles and on the thing card's photo (Ravi, round 5: the phone's own image menu came up
// there — the app's sheet should, and the same one).
export function useHold(onHold, { ms = 500 } = {}) {
  const h = useRef({ timer: 0, fired: false, x: 0, y: 0 });
  const start = (arg) => (e) => {
    const s = h.current; s.fired = false; s.x = e.clientX; s.y = e.clientY;
    clearTimeout(s.timer);
    s.timer = setTimeout(() => { s.fired = true; if (navigator.vibrate) navigator.vibrate(10); onHold(arg); }, ms);
  };
  const move = (e) => { const s = h.current; if (Math.abs(e.clientX - s.x) > 8 || Math.abs(e.clientY - s.y) > 8) clearTimeout(s.timer); };
  const end = () => clearTimeout(h.current.timer);
  // Wrap a click handler so a fired hold does not also count as a tap.
  const tap = (fn) => (e) => { if (h.current.fired) { h.current.fired = false; e.preventDefault(); return; } fn && fn(e); };
  const props = (arg) => ({ onPointerDown: start(arg), onPointerMove: move, onPointerUp: end, onPointerCancel: end, onPointerLeave: end, onContextMenu: (e) => e.preventDefault() });
  return { props, tap };
}
