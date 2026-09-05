// In-app confirmation sheet (platform audit F3). Replaces the browser's confirm(): our
// type, our colours, and two verbs — never OK/Cancel. Destructive stays amber, not red
// (calm-ui). The safe choice is first and is the default focus.
import { useEffect, useRef } from 'react';

export default function Confirm({ title, body, keepLabel = 'Keep', actionLabel, onKeep, onAction }) {
  const keepRef = useRef(null);
  useEffect(() => { keepRef.current && keepRef.current.focus(); }, []);
  return (
    <div className="sheet-back" onClick={onKeep} role="presentation">
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-title" id="sheet-title">{title}</div>
        {body && <p className="sheet-body">{body}</p>}
        <button ref={keepRef} className="btn-primary alt" onClick={onKeep}>{keepLabel}</button>
        <button className="btn-secondary amber" onClick={onAction}>{actionLabel}</button>
      </div>
    </div>
  );
}
