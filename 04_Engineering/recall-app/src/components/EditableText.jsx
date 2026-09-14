import { useState } from 'react';
import { PencilIcon } from './Icons.jsx';

// Always-correctable text: tap to edit, save on blur/enter. No confirmation friction.
// 2026-09-14 (Ravi: nothing looked editable): a pencil at the right and an accent hairline
// under the value — the phone's own sign for "a field". Nothing says "tap to".
export default function EditableText({ value, label, onSave, big, emptyLabel = 'tap to add' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = () => {
    setEditing(false);
    const v = draft.trim();
    if (v && v !== value) onSave(v);
    else setDraft(value);
  };

  return (
    <div>
      {label && <div className="field-label">{label}</div>}
      {editing ? (
        <input
          className="edit-inline" autoFocus value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); }}
        />
      ) : (
        <button type="button"
          className={'field-value' + (big ? ' big' : '') + (value ? '' : ' empty')}
          aria-label={`${label || 'Name'}: ${value || emptyLabel}. Change`}
          onClick={() => { setDraft(value || ''); setEditing(true); }}
        >
          <span className="field-text">{value || emptyLabel}</span>
          <PencilIcon />
        </button>
      )}
    </div>
  );
}
