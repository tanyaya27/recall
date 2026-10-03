import { useEffect, useState } from 'react';

// 10-03 (Ravi, usability pass 1 — E1–E3, G2, R2): typing happens in a sheet of its own. Everything behind it is dimmed and
// can't be tapped; its own Cancel puts everything back as it was, Done applies. The Cancel / Done bar sits just above the
// keyboard (the visible part of the screen), so neither the shutter nor Move it's own Cancel is ever under her thumb.
export default function EditSheet({ title, children, onCancel, onDone, doneLabel = 'Done', doneOff = false, extra = null, label = '' }) {
  const vv = typeof window !== 'undefined' ? window.visualViewport : null;
  const [h, setH] = useState(() => (vv ? vv.height : window.innerHeight));
  const [top, setTop] = useState(() => (vv ? vv.offsetTop : 0));
  useEffect(() => {
    if (!vv) return undefined;
    const f = () => { setH(vv.height); setTop(vv.offsetTop); };
    vv.addEventListener('resize', f); vv.addEventListener('scroll', f); f();
    return () => { vv.removeEventListener('resize', f); vv.removeEventListener('scroll', f); };
  }, []);
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [onCancel]);
  return (
    <div className="es-back" role="presentation">
      <div className="es" role="dialog" aria-modal="true" aria-label={label || (typeof title === 'string' ? title : 'Edit')} style={{ top: `${top}px`, height: `${h}px` }}>
        <div className="es-body">
          {title ? <div className="es-title">{title}</div> : null}
          {children}
        </div>
        <div className="es-bar">
          <button type="button" className="btn-secondary es-cancel" onMouseDown={(e) => e.preventDefault()} onClick={onCancel}>Cancel</button>
          {extra}
          <button type="button" className="btn-primary es-done" onMouseDown={(e) => e.preventDefault()} disabled={doneOff} onClick={onDone}>{doneLabel}</button>
        </div>
      </div>
    </div>
  );
}
