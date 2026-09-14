import { useRef, useState } from 'react';

// A list row that slides to reveal one action on each side (compact mode, Ravi round 4):
// drag left → the right-hand action shows (e.g. Delete); drag right → the left-hand one
// (e.g. Put back). Release past a third of the way and it stays open; tap the action to
// fire it; tap the row to close. Pointer events, so it works with a finger and a mouse.
export default function SwipeRow({ left, right, children }) {
  const [dx, setDx] = useState(0);
  const start = useRef(null);
  const W = 104; // px an open action occupies
  const onDown = (e) => { start.current = { x: e.clientX, y: e.clientY, dx0: dx, moved: false }; };
  const onMove = (e) => {
    const s = start.current; if (!s) return;
    const d = e.clientX - s.x;
    if (!s.moved && Math.abs(d) < 6) return;
    if (!s.moved && Math.abs(e.clientY - s.y) > Math.abs(d)) { start.current = null; return; } // a scroll
    s.moved = true;
    let next = s.dx0 + d;
    if (!left) next = Math.min(0, next);
    if (!right) next = Math.max(0, next);
    setDx(Math.max(-W - 20, Math.min(W + 20, next)));
  };
  const onUp = () => {
    const s = start.current; start.current = null;
    if (!s) return;
    if (!s.moved) { setDx(0); return; }
    setDx(dx < -W / 3 ? -W : dx > W / 3 ? W : 0);
  };
  return (
    <div className="swipe">
      {left && <button type="button" className="swipe-act left" style={{ width: W }} tabIndex={dx > 0 ? 0 : -1} onClick={() => { setDx(0); left.onClick(); }}>{left.label}</button>}
      {right && <button type="button" className="swipe-act right" style={{ width: W }} tabIndex={dx < 0 ? 0 : -1} onClick={() => { setDx(0); right.onClick(); }}>{right.label}</button>}
      <div className="swipe-body" style={{ transform: `translateX(${dx}px)`, transition: start.current ? 'none' : 'transform 120ms' }}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onPointerLeave={onUp}>
        {children}
      </div>
    </div>
  );
}
