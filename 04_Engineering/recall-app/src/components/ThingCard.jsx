import { useEffect, useState } from 'react';
import { updateItem, loadSnaps, softDeleteItem, moveToTop, logEvent } from '../lib/db.js';
import { whenSeen } from '../lib/format.js';
import EditableText from './EditableText.jsx';
import Footer from './Footer.jsx';
import Header from './Header.jsx';

// The thing card — the answer. Board decision 2026-09-05, Rules 1, 3, 4, 7.
//
// Photo, place in big words, what it was resting on, when. Identical the first time and the
// fiftieth. It asks nothing. It offers two things: "Not there? Earlier photos" in the body,
// and "Found it — new photo" in the fixed footer, next to Back.
//
// No stale banner, no sentence from the model, no reassurance. "Kitchen counter · yesterday
// evening" is the whole answer; she decides whether that is old.
//
// Fix (name, place, move to the top, remove) is behind one quiet control. It is Robert's.
export default function ThingCard({ item, items = [], onBack, onFoundFile }) {
  const [snaps, setSnaps] = useState(null); // null = not opened
  const [fixing, setFixing] = useState(false);

  useEffect(() => { setSnaps(null); setFixing(false); }, [item?.id]);

  if (!item) return null;

  async function earlier() {
    logEvent('lookup_outcome', { itemId: item.id, outcome: 'not_there', answerAgeMin: Math.round((Date.now() - item.lastSeenAt) / 60000) });
    const all = await loadSnaps(item.id);
    setSnaps(all.slice(1)); // the first is the photo already on screen
  }

  const label = item.name ? `your ${item.name.toLowerCase()}` : 'this';

  return (
    <div className="screen with-footer">
      <Header title={item.name || ''} onBack={onBack} />
      <div className="card thing">
        <img className="photo-full" src={item.photo} alt={item.name || ''} />
        {item.location
          ? <div className="loc-big">{item.location}</div>
          : <div className="loc-big soft">No place saved</div>}
        {item.restingOn && <div className="resting">{item.restingOn}</div>}
        <div className="when">{whenSeen(item.lastSeenAt)}</div>

        {snaps === null && (
          <button className="btn-secondary" onClick={earlier}>Not there? Earlier photos</button>
        )}

        {!fixing && (
          <button type="button" className="link-btn center" onClick={() => setFixing(true)}>Fix or remove</button>
        )}
        {fixing && (
          <div className="fix">
            <EditableText label="What it is" value={item.name} emptyLabel="Name it"
              onSave={(v) => { updateItem(item.id, { name: v }); logEvent('correction', { itemId: item.id, field: 'name' }); }} />
            <EditableText label="Where it is" value={item.location} emptyLabel="Add the place"
              onSave={(v) => { updateItem(item.id, { location: v, needsPlace: false }); logEvent('correction', { itemId: item.id, field: 'location' }); }} />
            <div className="fix-row">
              <button className="btn-quiet" onClick={async () => { await moveToTop(item, items); logEvent('move_to_top', { itemId: item.id }); setFixing(false); }}>Move to the top</button>
              <button className="btn-quiet" onClick={async () => {
                if (!confirm(`Remove ${label} from the board?\n\nIt moves to Settings → Recently removed, where it can be put back.`)) return;
                await softDeleteItem(item);
                logEvent('item_removed', { itemId: item.id, itemName: item.name || null });
                onBack();
              }}>Remove</button>
            </div>
          </div>
        )}
      </div>

      {snaps !== null && (
        <section className="earlier">
          {snaps.map((s, i) => (
            <div className="card thing" key={s.id}
              onClick={() => logEvent('history_pick', { itemId: item.id, index: i + 1, ageMin: Math.round((Date.now() - s.at) / 60000), location: s.location })}>
              <img className="photo-full" src={s.photo} alt="" />
              {s.location ? <div className="loc-big">{s.location}</div> : <div className="loc-big soft">No place saved</div>}
              <div className="when">{whenSeen(s.at)}</div>
            </div>
          ))}
          <p className="end">That's every photo of {label}.</p>
        </section>
      )}

      <Footer>
        <label className="btn-primary file">
          Found it — new photo
          <input type="file" accept="image/*" capture="environment"
            onChange={(e) => {
              const f = e.target.files && e.target.files[0];
              e.target.value = '';
              if (!f) return;
              logEvent('lookup_outcome', { itemId: item.id, outcome: 'found' });
              onFoundFile(f);
            }} />
        </label>
      </Footer>
    </div>
  );
}
