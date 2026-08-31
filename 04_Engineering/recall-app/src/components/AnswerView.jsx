import { updateItem, logEvent } from '../lib/db.js';
import { timeAgo, isStale } from '../lib/format.js';
import EditableText from './EditableText.jsx';

// UC-4/UC-5 answer screen, UC-8 staleness honesty, UC-3 corrections, UC-7 entry point
export default function AnswerView({ item, alternates = [], message = '', onBack, onResnap, onOpenItem, onAdd }) {
  if (!item) {
    return (
      <div>
        <button className="back" onClick={onBack}>‹ Home</button>
        <div className="card">
          <p style={{ fontSize: 20, margin: '4px 0 14px' }}>{message || "I don't have a photo of that yet."}</p>
          {onAdd && <button className="btn-primary" onClick={onAdd}>📷 Add a photo of it now</button>}
        </div>
      </div>
    );
  }
  const stale = isStale(item.lastSeenAt);

  return (
    <div>
      <button className="back" onClick={onBack}>‹ Home</button>
      {message && <p className="sub" style={{ fontSize: 19 }}>{message}</p>}
      <div className="card">
        <img className="photo-full" src={item.photo} alt={item.name} />
        <EditableText value={item.name} label="Item" onSave={(v) => { updateItem(item.id, { name: v }); logEvent('correct', { itemId: item.id, field: 'name' }); }} />
        <EditableText value={item.location} label="Where it is" big onSave={(v) => { updateItem(item.id, { location: v }); logEvent('correct', { itemId: item.id, field: 'location' }); }} />
        <div className="when">Photo taken {timeAgo(item.lastSeenAt)}</div>
        {stale && (
          <div className="stale">
            This photo is from {timeAgo(item.lastSeenAt)} — it may have moved since then.
          </div>
        )}
        <div style={{ marginTop: 16 }}>
          <button className="btn-primary" onClick={() => onResnap(item)}>Found it? 📷 Snap where it is now</button>
        </div>
      </div>

      {alternates.length > 0 && (
        <>
          <p className="sub">It might also be one of these:</p>
          {alternates.map((alt) => (
            <button key={alt.id} className="alt-row" onClick={() => onOpenItem(alt)}>
              <img src={alt.thumb} alt={alt.name} />
              <span><b>{alt.name}</b> — {alt.location}</span>
            </button>
          ))}
        </>
      )}
    </div>
  );
}
