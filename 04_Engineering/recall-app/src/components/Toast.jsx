// Two-second, fact-only toast (platform audit S3). "Saved · Kitchen counter", never
// "Great job". With an Undo it stays five seconds. Sits above the footer, never over a
// tile's label. One at a time; a new one replaces the old. A privacy notice (09-24) may carry
// its own action ("Share it") and sit over the camera (`over`), since it can arrive while it's open.
import { useEffect } from 'react';

export default function Toast({ toast, onDone }) {
  useEffect(() => {
    if (!toast || toast.busy) return; // a busy toast stays until the work replaces it (fix 2026-09-28, B4)
    const t = setTimeout(onDone, toast.undo ? 5000 : 2000);
    return () => clearTimeout(t);
  }, [toast]); // eslint-disable-line
  if (!toast) return null;
  return (
    <div className={'toast' + (toast.over ? ' over' : '') + (toast.busy ? ' busy' : '')} role="status" aria-live="polite">
      {toast.busy && <span className="spin" aria-hidden="true" />}
      <span>{toast.text}</span>
      {toast.undo && (
        <button className="toast-undo" onClick={() => { toast.undo(); onDone(); }}>{toast.undoLabel || 'Undo'}</button>
      )}
    </div>
  );
}
