import { useEffect, useRef } from 'react';

// A sheet with a question and a few big answers (round 5). Same shape as Confirm, more
// than two ways out. The last option is the safe one and gets focus.
export default function Choice({ title, body, options, onCancel }) {
  const lastRef = useRef(null);
  useEffect(() => { lastRef.current && lastRef.current.focus(); }, []);
  return (
    <div className="sheet-back" onClick={onCancel} role="presentation">
      <div className="sheet item-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-title" id="sheet-title">{title}</div>
        {body && <p className="sheet-body">{body}</p>}
        {options.map((o, i) => (
          <button key={o.label} ref={i === options.length - 1 ? lastRef : null}
            className={i === options.length - 1 ? 'btn-primary alt' : 'sheet-row' + (o.amber ? ' amber' : '')}
            onClick={o.onClick}>{o.label}</button>
        ))}
      </div>
    </div>
  );
}
