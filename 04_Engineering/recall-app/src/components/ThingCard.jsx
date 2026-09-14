import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { updateItem, renameItem, changeLocation, loadSnaps, removeSnap, softDeleteItem, moveToTop, setVisibility, isPrivate, logEvent } from '../lib/db.js';
import { useHold } from '../lib/hold.js';
import { whenSeen, cap } from '../lib/format.js';
import EditableText from './EditableText.jsx';
import { own } from './PhotoCard.jsx';
import Header from './Header.jsx';
import Confirm from './Confirm.jsx';
import ItemSheet from './ItemSheet.jsx';
import { CameraIcon, TrashIcon, PencilIcon, LockIcon, UnlockIcon } from './Icons.jsx';

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
// Edit (name, place, move to the top) is the footer's second verb; it was *Fix* until round 5.
export default function ThingCard({ item, items = [], onBack, onAdd, onRemoved, onToast, openFix = false }) {
  const [sheet, setSheet] = useState(false);       // press-and-hold on the photo
  const [snaps, setSnaps] = useState(null);      // every live snap, newest first; null = not loaded
  const [mode, setMode] = useState('now');
  const [index, setIndex] = useState(0);         // centred page in the strip
  const [fixing, setFixing] = useState(openFix);
  const [whole, setWhole] = useState(false);     // photo uncropped (audit L1)
  const [confirming, setConfirming] = useState(null); // 'item' | { snap }
  const stripRef = useRef(null);
  // The action row never wraps (Ravi): when a label cannot fit on one line at the current
  // text size, the whole row becomes icons only — the words stay in the accessible name.
  const actRef = useRef(null);
  const probeRef = useRef(null);
  const [iconsOnly, setIconsOnly] = useState(false);
  useLayoutEffect(() => {
    const el = actRef.current, pr = probeRef.current; if (!el || !pr) return undefined;
    const measure = () => {
      // Measure the words in an offscreen probe (same font), never the visible buttons —
      // toggling their class to measure them re-fires the observer (Footer.jsx's lesson).
      const labels = Array.from(el.querySelectorAll('.act span')).map((sp) => sp.textContent);
      while (pr.children.length > labels.length) pr.removeChild(pr.lastChild);
      labels.forEach((t, i) => { let c = pr.children[i]; if (!c) { c = document.createElement('span'); pr.appendChild(c); } if (c.textContent !== t) c.textContent = t; });
      const acts = Array.from(el.querySelectorAll('.act'));
      if (!acts.length) return;
      const room = acts[0].clientWidth - 8; // horizontal padding of .act (0.25rem each side)
      if (room < 20) return;
      const fits = Array.from(pr.children).every((c) => c.getBoundingClientRect().width <= room);
      setIconsOnly(!fits);
    };
    measure();
    const ro = new ResizeObserver(measure); ro.observe(el); ro.observe(pr); ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [item?.id, mode, fixing, item?.visibility]);
  const hold = useHold(() => { logEvent('photo_hold', { itemId: item && item.id }); setSheet(true); });

  useEffect(() => { setSnaps(null); setMode('now'); setIndex(0); setFixing(openFix); setWhole(false); }, [item?.id]); // eslint-disable-line

  // The current log's extra photos are the only reason to read snaps up front.
  const wantsSnaps = !!item && ((item.photoCount || 1) > 1);
  // Re-read when the photo count changes (a photo was just added — audit D9: the new photo
  // never appeared until the card was reopened) or after snaps were reset to null.
  useEffect(() => {
    if (!item || snaps !== null || (!wantsSnaps && mode === 'now')) return;
    let alive = true;
    loadSnaps(item.id).then((all) => { if (alive) setSnaps(all); });
    return () => { alive = false; };
  }, [item?.id, mode, wantsSnaps, snaps]); // eslint-disable-line
  const photoCount = item ? (item.photoCount || 1) : 0;
  useEffect(() => { setSnaps(null); }, [photoCount]);

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

  const label = item.name ? `your ${own(item.name)}` : 'this';

  return (
    <div className="screen">
      <Header title={cap(item.name) || ''} onBack={onBack} />
      <div className="card thing">
        {mode === 'earlier' && (
          <div className="mode-row">
            <span className="eyebrow">Earlier</span>
            <button type="button" className="link-btn" onClick={now}>Back to now</button>
          </div>
        )}
        {/* Layout A (Ravi, 2026-09-14, chosen from three rendered options): the trash sits ON the
            photo it removes; the place stays right under the photo; the actions are a labelled
            row under the details. Press-and-hold remains a shortcut, never the only way. */}
        <div className="photo-wrap">
        {pages.length > 1 ? (
          <div className="strip" ref={stripRef} onScroll={onScroll}>
            {pages.map((p, i) => (
              <div className="strip-page" key={p.id}>
                <img className={'photo-full' + (whole && i === index ? ' whole' : '')} src={p.photo} alt={item.name || ''} {...hold.props()} onClick={hold.tap(() => setWhole((w) => !w))} />
                <button type="button" className="photo-trash" aria-label="Remove this photo" onClick={() => askRemove(p)}><TrashIcon /></button>
              </div>
            ))}
          </div>
        ) : (
          <img className={'photo-full' + (whole ? ' whole' : '')} src={page.photo} alt={item.name || ''} {...hold.props()} onClick={hold.tap(() => setWhole((w) => !w))} />
        )}
        {pages.length <= 1 && <button type="button" className="photo-trash" aria-label="Remove this photo" onClick={() => askRemove(page)}><TrashIcon /></button>}
        </div>
        {pages.length > 1 && (
          <div className="dots" aria-label={`Photo ${index + 1} of ${pages.length}`}>
            {pages.map((p, i) => <button type="button" key={p.id} className={'dot' + (i === index ? ' on' : '')} onClick={() => slideTo(i)} aria-label={`Photo ${i + 1}`} />)}
          </div>
        )}

        {page.location
          ? <div className="loc-big">{page.location}</div>
          : <div className="loc-big soft">No place saved</div>}
        {mode === 'now' && item.restingOn && <div className="resting">{item.restingOn}</div>}
        <div className="when">{whenSeen(page.at)}{isPrivate(item) && <span className="private-line"><LockIcon /> Private</span>}</div>

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
        {mode === 'now' && (
          <div className={'actbar' + (iconsOnly ? ' icons' : '')} ref={actRef}>
            <button type="button" className="act primary" aria-label="Add photo" disabled={(item.photoCount || 1) >= 4} onClick={() => { setSnaps(null); onAdd(); }}><CameraIcon /><span>Add photo</span></button>
            <button type="button" className={'act' + (fixing ? ' on' : '')} aria-label={fixing ? 'Done' : 'Edit'} aria-pressed={fixing} onClick={() => setFixing((f) => !f)}><PencilIcon /><span>{fixing ? 'Done' : 'Edit'}</span></button>
            <button type="button" className={'act' + (isPrivate(item) ? ' on' : '')} aria-pressed={isPrivate(item)} aria-label={isPrivate(item) ? 'Private — tap to share with the household' : 'Shared — tap to make private'}
              onClick={async () => { const to = isPrivate(item) ? 'household' : 'private'; await setVisibility(item, to); logEvent('visibility', { itemId: item.id, to, via: 'actbar' }); onToast && onToast(to === 'private' ? 'Private — only this phone shows it' : 'Shared with the household'); }}>
              {isPrivate(item) ? <LockIcon /> : <UnlockIcon />}<span>{isPrivate(item) ? 'Private' : 'Shared'}</span></button>
            <button type="button" className="act amber" aria-label="Remove item" onClick={() => setConfirming('item')}><TrashIcon /><span>Remove</span></button>
            <div className="act-probe" ref={probeRef} aria-hidden="true" />
          </div>
        )}
        {fixing && (
          <div className="fix">
            <EditableText label="What it is" value={item.name} emptyLabel="Name it"
              onSave={(v) => { renameItem(item, v); logEvent('correction', { itemId: item.id, field: 'name' }); }} />
            <EditableText label="Where it is" value={item.location} emptyLabel="Add the place"
              onSave={(v) => { changeLocation(item, v.charAt(0).toUpperCase() + v.slice(1)); logEvent('correction', { itemId: item.id, field: 'location' }); }} />
            <div className="fix-row">
              <button className="btn-quiet" onClick={async () => { await moveToTop(item, items); logEvent('move_to_top', { itemId: item.id }); setFixing(false); }}>Move to the top</button>
              <button className="btn-quiet" onClick={() => setFixing(false)}>Done</button>
            </div>
          </div>
        )}
      </div>

      {sheet && (
        <ItemSheet item={item}
          onAdd={() => { setSheet(false); setSnaps(null); onAdd(); }}
          onChangePlace={() => { setSheet(false); setFixing(true); }}
          onRename={() => { setSheet(false); setFixing(true); }}
          onMoveToTop={async () => { setSheet(false); await moveToTop(item, items); logEvent('move_to_top', { itemId: item.id, via: 'photo_sheet' }); onToast && onToast('Moved to the top'); }}
          onRemovePhoto={() => { setSheet(false); askRemove(page); }}
          onPrivate={async () => { setSheet(false); const to = isPrivate(item) ? 'household' : 'private'; await setVisibility(item, to); logEvent('visibility', { itemId: item.id, to, via: 'sheet' }); onToast && onToast(to === 'private' ? 'Private — only this phone shows it' : 'Shared with the household'); }}
          onRemove={() => { setSheet(false); setConfirming('item'); }}
          onCancel={() => setSheet(false)} />
      )}
      {confirming && confirming !== 'item' && (
        confirming.last ? (
          <Confirm
            title={`This is the only photo of ${label}. Remove the item?`}
            image={confirming.snap.photo}
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
            image={confirming.snap.photo}
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

    </div>
  );
}
