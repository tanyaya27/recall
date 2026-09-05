import { useEffect, useState } from 'react';
import { updateItem, loadSnaps, pinItem, unpinItem, softDeleteItem, logEvent } from '../lib/db.js';
import { timeAgo, isStale } from '../lib/format.js';
import EditableText from './EditableText.jsx';

// The answer. Identical the first time and the fiftieth.
// "Not there?" scrolls earlier photos of the same thing — same card, older and older.
export default function AnswerView({ item, items = [], alternates = [], message = '', onBack, onResnap, onOpenItem, onAdd, onPinFull }) {
  const [snaps, setSnaps] = useState(null); // null = not opened
  const [pinNote, setPinNote] = useState('');

  useEffect(() => { setSnaps(null); setPinNote(''); }, [item?.id]);

  if (!item) {
    return (
      <div>
        <div className="card">
          <p style={{ fontSize: 22, margin: '4px 0 14px' }}>{message || "I don't have a photo of that yet."}</p>
          {onAdd && <button className="btn-primary" onClick={onAdd}>📷 Take a photo of it now</button>}
        </div>
        <button className="btn-back" onClick={onBack}>Back</button>
      </div>
    );
  }
  const stale = isStale(item.lastSeenAt);
  const pinned = item.pinnedOrder != null;

  async function openHistory() {
    logEvent('lookup_outcome', { itemId: item.id, outcome: 'not_there', answerAgeMin: Math.round((Date.now() - item.lastSeenAt) / 60000) });
    const all = await loadSnaps(item.id);
    setSnaps(all.slice(1)); // first is the current photo
  }

  async function togglePin() {
    if (pinned) { await unpinItem(item); logEvent('unpin', { itemId: item.id }); setPinNote('Taken off the top.'); return; }
    const r = await pinItem(item, items);
    logEvent('pin', { itemId: item.id, result: r });
    if (r === 'full') onPinFull(item); else setPinNote('Kept at the top.');
  }

  return (
    <div>
      {message && <p className="sub" style={{ fontSize: 20 }}>{message}</p>}
      <div className="card">
        <img className="photo-full" src={item.photo} alt={item.name} />
        <EditableText value={item.name} label="What it is" onSave={(v) => { updateItem(item.id, { name: v }); logEvent('correction', { itemId: item.id, field: 'name' }); }} />
        <EditableText value={item.location} label="Where it is" big onSave={(v) => { updateItem(item.id, { location: v }); logEvent('correction', { itemId: item.id, field: 'location' }); }} />
        {/* What the photo showed it sitting on. Useless at capture time — she can see the
            photo she just took — but at find time it is the difference between "bathroom
            counter" and "bathroom counter, on your black shorts". */}
        {item.restingOn && <div className="resting">{item.restingOn}</div>}
        <div className="when">Photographed {timeAgo(item.lastSeenAt)}</div>
        {stale && (
          <div className="stale">This photo is from {timeAgo(item.lastSeenAt)} — it may have moved since then.</div>
        )}
        <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => { logEvent('lookup_outcome', { itemId: item.id, outcome: 'found' }); onResnap(item); }}>
          Found it? 📷 Snap where it is now
        </button>
        {snaps === null && (
          <button className="btn-secondary" onClick={openHistory}>Not there? See earlier photos</button>
        )}
      </div>

      {snaps !== null && (
        <section>
          <h2>Earlier photos of your {item.name.toLowerCase()}</h2>
          {snaps.length === 0 && <p className="sub">This is the only photo so far.</p>}
          {snaps.map((s, i) => (
            <div className="card" key={s.id}
              onClick={() => logEvent('history_pick', { itemId: item.id, index: i + 1, ageMin: Math.round((Date.now() - s.at) / 60000), location: s.location })}>
              <img className="photo-full" src={s.photo} alt="" />
              <div className="loc-big">{s.location}</div>
              <div className="when">Photographed {timeAgo(s.at)}</div>
            </div>
          ))}
        </section>
      )}

      {alternates.length > 0 && (
        <section>
          <p className="sub">It might also be one of these:</p>
          {alternates.map((alt) => (
            <button key={alt.id} className="alt-row" onClick={() => onOpenItem(alt)}>
              <img src={alt.thumb} alt={alt.name} />
              <span><b>{alt.name}</b> — {alt.location}</span>
            </button>
          ))}
        </section>
      )}

      <div className="row-actions">
        <button className="btn-quiet" onClick={togglePin}>{pinned ? 'Take off the top' : 'Keep at the top'}</button>
        {pinNote && <span className="sub" style={{ margin: 0 }}>{pinNote}</span>}
      </div>
      {/* Quiet, last, and confirmed — but never destructive. This is a soft delete; the
          photo waits in Settings → Recently removed until someone deliberately empties it. */}
      <button
        className="link-btn" style={{ display: 'block', margin: '14px auto 0' }}
        onClick={async () => {
          if (!confirm(`Remove ${item.name.toLowerCase()} from ReCall?\n\nIt moves to "Recently removed" in Settings, where you can put it back.`)) return;
          await softDeleteItem(item);
          logEvent('item_removed', { itemId: item.id, itemName: item.name });
          onBack();
        }}
      >
        Remove {item.name.toLowerCase()}
      </button>
      <button className="btn-back" onClick={onBack}>Back</button>
    </div>
  );
}

// A routine's photo for today, seen again. "Photograph again" implies no doubt.
export function CheckView({ routine, check, onAgain, onBack }) {
  return (
    <div>
      <h2>{routine.name}</h2>
      <div className="card">
        <img className="photo-full" src={check.photo} alt="" />
        <div className="claim">{check.claim?.visible && check.claim.state !== 'unknown' ? check.claim.text : 'Photographed.'}</div>
        <div className="when">{timeAgo(check.at)}</div>
        <button className="btn-secondary" onClick={() => { logEvent('check_again', { routineId: routine.id }); onAgain(routine); }}>📷 Photograph again</button>
      </div>
      <button className="btn-back" onClick={onBack}>Back</button>
    </div>
  );
}

// The top row is full: which one should this replace? One tap.
export function PinReplace({ item, items, onPick, onBack }) {
  const pinned = items.filter((i) => i.pinnedOrder != null).sort((a, b) => a.pinnedOrder - b.pinnedOrder);
  return (
    <div>
      <h2>The top row is full</h2>
      <p className="sub">Which one should <b>{item.name}</b> take the place of?</p>
      <div className="tile-grid">
        {pinned.map((p) => (
          <button key={p.id} className="tile" onClick={() => onPick(p)}>
            <img src={p.thumb} alt={p.name} />
            <div className="tile-label">{p.name}</div>
          </button>
        ))}
      </div>
      <button className="btn-back" onClick={onBack}>Leave it as it is</button>
    </div>
  );
}
