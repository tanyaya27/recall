import { useState } from 'react';

// Always-correctable text: tap to edit, save on blur/enter. No confirmation friction.
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
        <div
          className={big ? 'loc-big field-value' : 'field-value'}
          style={value ? undefined : { color: '#6B7A78' }}
          onClick={() => { setDraft(value || ''); setEditing(true); }}
        >
          {value || emptyLabel}
        </div>
      )}
    </div>
  );
}
