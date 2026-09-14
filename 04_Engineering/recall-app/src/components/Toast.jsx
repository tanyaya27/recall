// Two-second, fact-only toast (platform audit S3). "Saved · Kitchen counter", never
// "Great job". With an Undo it stays five seconds. Sits above the footer, never over a
// tile's label. One at a time; a new one replaces the old.
import { useEffect } from 'react';

export default function Toast({ toast, onDone }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDone, (toast.undo || toast.action) ? 6000 : 2000);
    return () => clearTimeout(t);
  }, [toast]); // eslint-disable-line
  if (!toast) return null;
  return (
    <div className="toast" role="status" aria-live="polite">
      <span>{toast.text}</span>
      {toast.undo && (
        <button className="toast-undo" onClick={() => { toast.undo(); onDone(); }}>Undo</button>
      )}
      {/* An action that opens the camera must be a <label> around the file input: only the
          tap itself counts as a gesture on iOS (same reason as the footer button). */}
      {toast.action && toast.action.camera && (
        <label className="toast-undo file">
          {toast.action.label}
          <input type="file" accept="image/*" capture="environment"
            onChange={(e) => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) toast.action.onFile(f); }} />
        </label>
      )}
    </div>
  );
}
