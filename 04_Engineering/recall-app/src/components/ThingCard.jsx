import { useEffect, useRef, useState } from 'react';
import { updateItem, renameItem, loadSnaps, removeSnap, softDeleteItem, moveToTop, logEvent } from '../lib/db.js';
import { whenSeen, cap } from '../lib/format.js';
import EditableText from './EditableText.jsx';
import Footer from './Footer.jsx';
import Header from './Header.jsx';
import Confirm from './Confirm.jsx';
import { CameraIcon, TrashIcon, PencilIcon } from './Icons.jsx';

// The thing card — the answer. Board decision 2026-09-05, Rules 1, 3, 4, 7; revised
// 2026-09-14 (Ravi's second phone round, BOARD_2026-09-14_phone-feedback-round-2.md).
//
// Photo, place in big words, what it was resting on, when. It asks nothing.
//
// Two modes, one strip (Ravi: left/right is too useful to spend on history alone):
//   now      — the strip holds the photos of the CURRENT log (a close-up and a wide shot,
//              say). One photo, no strip. Swiping is only there when the next photo peeks in.
//   earlier  — "Where it has been" rows (only once it has been in more than one place) or
//              *Earlier photos* switch the strip to every older photo, newest first, each
//              with its own place and time. *Back to now* returns.
// Under the centred photo, one quiet control: *Remove this photo* → confirm sheet → toast
// with Undo. If it is the last photo, the sheet offers removing the item instead.
//
// Fix (name, place, move to the top) is behind one quiet control. It is Robert's.
export default function ThingCard({ item, items = [], onBack, onFound, onAdd, onRemoved, onToast, openFix = false }) {
  const [snaps, setSnaps] = useState(null);      // every live snap, newest first; null = not loaded
  const [mode, setMode] = useState('now');
  const [index, setIndex] = useState(0);         // centred page in the strip
  const [fixing, setFixing] = useState(openFix);
  const [whole, setWhole] = useState(false);     // photo uncropped (audit L1)
  const [confirming, setConfirming] = useState(null); // 'item' | { snap }
  const stripRef = useRef(null);

  useEffect(() => { setSnaps(null); setMode('now'); setIndex(0); setFixing(openFix); setWhole(false); }, [item?.id]); // eslint-disable-line

  // The current log's extra photos are the only reason to read snaps up front.
  const wantsSnaps = !!item && ((item.photoCount || 1) > 1);
  useEffect(() => {
    if (!item || snaps !== null || (!wantsSnaps && mode === 'now')) return;
    let alive = true;
    loadSnaps(item.id).then((all) => { if (alive) setSnaps(all); });
    return () => { alive = false; };
  }, [item?.id, mode, wantsSnaps]); // eslint-disable-line

  if (!item) return null;

  const cover = { id: 'cover', photo: item.photo, thumb: item.thumb, location: item.location, at: item.lastSeenAt, logId: item.logId, cover: true };
  const live = (snaps || []);
  const inLog = (s) => item.logId && s.logId === item.logId;
  // now: the cover, then the other photos of the same log (oldest of them first — the order they were taken)
  const nowPages = [cover, ...live.filter((s) => inLog(s) && s.photo !== item.photo).sort((a, b) => a.at - b.at)];
  // earlier: everything not in the current log, newest first
  const earlierPages = live.filter((s) => !inLog(s) && s.photo !== item.photo);
  const pages = mode === 'now' ? nowPages : earlierPages;
  const page = pages[Math.min(index, pages.length - 1)] || cover;

  // Distinct places, newest first, from the item's own history — no read needed.
  const placeRows = [];
  [...(item.history || [])].reverse().forEach((h) => {
    if (h.location && !placeRows.some((r) => r.location.toLowerCase() === h.location.toLowerCase())) placeRows.push(h);
  });
  const hasHistory = placeRows.length > 1 || (item.history || []).length > 1;

  function onScroll() {
    const el = stripRef.current; if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index) setIndex(i);
  }
  function slideTo(i) {
    setIndex(i);
    const el = stripRef.current; if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  }
  function earlier(fromRow) {
    logEvent('lookup_outcome', { itemId: item.id, outcome: 'not_there', answerAgeMin: Math.round((Date.now() - item.lastSeenAt) / 60000) });
    setMode('earlier'); setIndex(0); setWhole(false);
    if (fromRow != null && snaps) {
      const i = earlierPages.findIndex((s) => Math.abs(s.at - fromRow.at) < 60000 || (s.location || '').toLowerCase() === fromRow.location.toLowerCase());
      if (i >= 0) setTimeout(() => slideTo(i), 0);
    }
  }
  function now() { setMode('now'); setIndex(0); setWhole(false); const el = stripRef.current; if (el) el.scrollTo({ left: 0 }); }

  // Know what else there is before offering to remove: the sheet differs for the last photo.
  async function askRemove(p) {
    let all = snaps;
    if (all === null) { all = await loadSnaps(item.id); setSnaps(all); }
    setConfirming({ snap: p, last: all.length <= 1 });
  }

  async function removePhoto(snap) {
    setConfirming(null);
    const all = snaps || [];
    const target = snap.cover ? (all.find((s) => s.photo === item.photo) || null) : snap;
    if (!target) { // cover with no snap doc (pre-2026-09-05 data): nothing else to fall back to
      setConfirming('item'); return;
    }
    const { undo } = await removeSnap(item, target, all);
    setSnaps(all.filter((s) => s.id !== target.id));
    setIndex(0);
    logEvent('photo_removed', { itemId: item.id, snapId: target.id, wasCover: !!snap.cover });
    onToast && onToast('Photo removed', async () => { await undo(); setSnaps(null); logEvent('photo_restored', { itemId: item.id, snapId: target.id }); });
  }

  const label = item.name ? `your ${item.name.toLowerCase()}` : 'this';

  return (
    <div className="screen with-footer">
      <Header title={cap(item.name) || ''} onBack={onBack} />
      <div className="card thing">
        {mode === 'earlier' && (
          <div className="mode-row">
            <span className="eyebrow">Earlier</span>
            <button type="button" className="link-btn" onClick={now}>Back to now</button>
          </div>
        )}
        {pages.length > 1 ? (
          <div className="strip" ref={stripRef} onScroll={onScroll}>
            {pages.map((p, i) => (
              <div className="strip-page" key={p.id}>
                <img className={'photo-full' + (whole && i === index ? ' whole' : '')} src={p.photo} alt={item.name || ''} onClick={() => setWhole((w) => !w)} />
              </div>
            ))}
          </div>
        ) : (
          <img className={'photo-full' + (whole ? ' whole' : '')} src={page.photo} alt={item.name || ''} onClick={() => setWhole((w) => !w)} />
        )}
        {pages.length > 1 && (
          <div className="dots" aria-label={`Photo ${index + 1} of ${pages.length}`}>
            {pages.map((p, i) => <button type="button" key={p.id} className={'dot' + (i === index ? ' on' : '')} onClick={() => slideTo(i)} aria-label={`Photo ${i + 1}`} />)}
          </div>
        )}

        {page.location
          ? <div className="loc-big">{page.location}</div>
          : <div className="loc-big soft">No place saved</div>}
        {mode === 'now' && item.restingOn && <div className="resting">{item.restingOn}</div>}
        <div className="when">{whenSeen(page.at)}</div>

        {mode === 'earlier' && pages.length === 0 && (
          <p className="end">{snaps === null ? '…' : `That's every photo of ${label}.`}</p>
        )}
        {mode === 'earlier' && pages.length > 0 && index === pages.length - 1 && (
          <p className="end">That's every photo of {label}.</p>
        )}

        {/* Where it has been — only once there is somewhere else to have been. */}
        {mode === 'now' && placeRows.length > 1 && (
          <div className="places">
            <div className="field-label">Where it has been</div>
            {placeRows.slice(1, 5).map((h) => (
              <button type="button" className="place-row" key={h.at} onClick={() => earlier(h)}>
                <span className="place-row-loc">{h.location}</span>
                <span className="place-row-when">{whenSeen(h.at)}</span>
              </button>
            ))}
          </div>
        )}
        {mode === 'now' && hasHistory && (
          <button className="btn-secondary" onClick={() => earlier()}>Not there? Earlier photos</button>
        )}

        {/* Three quiet actions (round 3): add to this log · remove this photo · fix words.
            Removing the ITEM is not here — it conflated with removing a photo. It lives in
            the tile's press-and-hold sheet, and in the last-photo path of Remove this photo. */}
        <div className="quiet-row">
          {mode === 'now' && (item.photoCount || 1) < 4 && (
            <button type="button" className="link-btn" onClick={() => { setSnaps(null); onAdd(); }}><CameraIcon /> Add photo</button>
          )}
          <button type="button" className="link-btn" onClick={() => askRemove(page)}><TrashIcon /> Remove photo</button>
          {!fixing && <button type="button" className="link-btn" onClick={() => setFixing(true)}><PencilIcon /> Fix</button>}
        </div>
        {fixing && (
          <div className="fix">
            <EditableText label="What it is" value={item.name} emptyLabel="Name it"
              onSave={(v) => { renameItem(item, v); logEvent('correction', { itemId: item.id, field: 'name' }); }} />
            <EditableText label="Where it is" value={item.location} emptyLabel="Add the place"
              onSave={(v) => { updateItem(item.id, { location: v.charAt(0).toUpperCase() + v.slice(1), needsPlace: false }); logEvent('correction', { itemId: item.id, field: 'location' }); }} />
            <div className="fix-row">
              <button className="btn-quiet" onClick={async () => { await moveToTop(item, items); logEvent('move_to_top', { itemId: item.id }); setFixing(false); }}>Move to the top</button>
              <button className="btn-quiet" onClick={() => setFixing(false)}>Done</button>
            </div>
          </div>
        )}
      </div>

      {confirming && confirming !== 'item' && (
        confirming.last ? (
          <Confirm
            title={`This is the only photo of ${label}. Remove the item?`}
            body="It goes to Settings → Recently removed, where it can be put back."
            keepLabel="Keep it" actionLabel="Remove item"
            onKeep={() => setConfirming(null)}
            onAction={async () => {
              setConfirming(null);
              await softDeleteItem(item);
              logEvent('item_removed', { itemId: item.id, itemName: item.name || null, via: 'last_photo' });
              onRemoved(item);
            }}
          />
        ) : (
          <Confirm
            title="Remove this photo?"
            body={confirming.snap.cover ? 'The next photo becomes the one on the tile.' : 'The other photos stay.'}
            keepLabel="Keep it" actionLabel="Remove"
            onKeep={() => setConfirming(null)}
            onAction={() => removePhoto(confirming.snap)}
          />
        )
      )}
      {confirming === 'item' && (
        <Confirm
          title={`Remove ${label} from My items?`}
          body="It goes to Settings → Recently removed, where it can be put back."
          keepLabel="Keep it" actionLabel="Remove"
          onKeep={() => setConfirming(null)}
          onAction={async () => {
            setConfirming(null);
            await softDeleteItem(item);
            logEvent('item_removed', { itemId: item.id, itemName: item.name || null });
            onRemoved(item);
          }}
        />
      )}

      <Footer>
        <button className="btn-primary" aria-label="Found it — new photo" onClick={() => { logEvent('lookup_outcome', { itemId: item.id, outcome: 'found' }); onFound(); }}>
          <CameraIcon /><span className="lbl">Found it — new photo</span>
        </button>
      </Footer>
    </div>
  );
}
