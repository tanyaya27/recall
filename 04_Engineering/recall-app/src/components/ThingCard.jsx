import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { updateItem, renameItem, changeLocation, loadSnaps, removeSnap, softDeleteItem, moveToTop, setVisibility, isPrivate, logEvent, LOG_MAX, VISIBILITY_TOAST } from '../lib/db.js';
import { useHold } from '../lib/hold.js';
import { photoStamp, cap } from '../lib/format.js';
import { getPrefs, savePrefs } from '../lib/prefs.js';
import EditableText from './EditableText.jsx';
import { own } from './PhotoCard.jsx';
import Confirm from './Confirm.jsx';
import ItemSheet from './ItemSheet.jsx';
import { CameraIcon, TrashIcon, PencilIcon, LockIcon, ClockIcon, PinIcon, PinWasIcon, ChevronLeftIcon } from './Icons.jsx';

// The thing card — the answer. Redesigned 2026-09-16 with Ravi over seven rendered passes
// (design/DESIGN_2026-09-16_things-places-sightings.md §2, §13):
//
//   Title   — chevron Back · the thing's name (never wraps) · lock icon if private;
//             line 2, tight: pin · CURRENT place · context. The current place lives up here
//             so an older photo can never sit under it in big type.
//   Roll    — every SIGHTING of the thing (a photo at a place at a time), newest first,
//             filtered to the current STAY (the run of newest sightings at the current place)
//             unless *Show earlier places* is on. On each photo: the time, bottom-left, at a
//             fixed 13 px; the trash, top-right, fixed 36 px — nothing on a photo scales with
//             the text setting. Under a photo from another place: that place, amber, dashed pin.
//   Switches — Keep this private · Show times on photos · Show earlier places (n): a list,
//             label left, switch right. The third row is absent when there is nothing earlier.
//   Bar     — the three operations: Add photo · Edit · Remove.
//
// "Earlier photos" as a mode is gone; a stay is derived from the sightings, never stored.
export default function ThingCard({ item, items = [], onBack, onAdd, onRemoved, onToast, openFix = false }) {
  const [sheet, setSheet] = useState(false);       // press-and-hold on the photo
  const [snaps, setSnaps] = useState(null);      // every live snap, newest first; null = not loaded
  const [index, setIndex] = useState(0);         // centred page in the strip
  const [fixing, setFixing] = useState(openFix);
  const [showTimes, setShowTimes] = useState(() => getPrefs().showTimes !== false);      // per phone
  const [showEarlier, setShowEarlier] = useState(false);                                  // per visit
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
  }, [item?.id, fixing, item?.visibility]);
  const hold = useHold(() => { logEvent('photo_hold', { itemId: item && item.id }); setSheet(true); });

  useEffect(() => { setSnaps(null); setIndex(0); setFixing(openFix); setShowEarlier(false); }, [item?.id]); // eslint-disable-line

  // The current log's extra photos are the only reason to read snaps up front.
  const wantsSnaps = !!item; // always: the roll needs the log's extras and the Earlier button needs the count (09-16)
  // Re-read when the photo count changes (a photo was just added — audit D9: the new photo
  // never appeared until the card was reopened) or after snaps were reset to null.
  useEffect(() => {
    if (!item || snaps !== null || !wantsSnaps) return;
    let alive = true;
    loadSnaps(item.id).then((all) => { if (alive) setSnaps(all); });
    return () => { alive = false; };
  }, [item?.id, wantsSnaps, snaps]); // eslint-disable-line
  const photoCount = item ? (item.photoCount || 1) : 0;
  useEffect(() => { setSnaps(null); }, [photoCount, item?.logId]); // a move writes a sighting and a new logId (09-16)

  if (!item) return null;

  const cover = { id: 'cover', photo: item.photo, thumb: item.thumb, location: item.location, at: item.lastSeenAt, cover: true };
  const live = (snaps || []);
  const here = (loc) => (loc || '').toLowerCase() === (item.location || '').toLowerCase();
  // Every sighting, newest first. The cover is a sighting too; since 09-14 it also exists as a
  // snap doc, so drop that duplicate. Older items (no snaps) have the cover only.
  const sightings = [...live.filter((s) => s.photo !== item.photo), { ...cover, at: Math.max(cover.at || 0, ...live.filter((s) => s.photo === item.photo).map((s) => s.at || 0)) }]
    .sort((a, b) => (b.at || 0) - (a.at || 0));
  // The current stay: the run of newest sightings at the current place.
  let stayLen = 0; while (stayLen < sightings.length && here(sightings[stayLen].location)) stayLen += 1;
  if (stayLen === 0) stayLen = 1; // a thing whose newest photo predates a place change: show at least the newest
  const stay = sightings.slice(0, stayLen);
  const earlierCount = sightings.length - stayLen;
  const pages = showEarlier ? sightings : stay;
  const page = pages[Math.min(index, pages.length - 1)] || cover;
  const stayFull = stay.length >= LOG_MAX;

  // A page is 86% of the strip plus the gap — measure it from the first two pages rather than
  // assuming the strip's width (the dots pointed at the wrong page before 09-16).
  function pageStep(el) { const a = el.children[0], b = el.children[1]; return a && b ? b.offsetLeft - a.offsetLeft : el.clientWidth; }
  function onScroll() {
    const el = stripRef.current; if (!el) return;
    const i = Math.max(0, Math.min(pages.length - 1, Math.round(el.scrollLeft / pageStep(el))));
    if (i !== index) setIndex(i);
  }
  function slideTo(i) {
    setIndex(i);
    const el = stripRef.current; if (el) el.scrollTo({ left: i * pageStep(el), behavior: 'smooth' });
  }

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
    <div className="screen with-footer">
      <div className="thing-head">
        <div className="row1">
          <button type="button" className="chev" aria-label="Back" onClick={onBack}><ChevronLeftIcon /></button>
          <div className="name">{cap(item.name) || 'This thing'}</div>
          {isPrivate(item) && <span className="lk" aria-label="Private"><LockIcon /></span>}
        </div>
        <div className="row2">
          <PinIcon />
          {item.location ? <b>{item.location}</b> : <b className="soft">No place assigned</b>}
          {item.restingOn && <span> · {item.restingOn}</span>}
        </div>
      </div>
      <div className="card thing">
        <div className="photo-wrap">
          <div className={'strip' + (pages.length > 1 ? '' : ' one')} ref={stripRef} onScroll={onScroll}>
            {pages.map((p) => {
              const was = !here(p.location) && p.location;
              return (
                <div className="strip-page" key={p.id}>
                  <div className="photo-box">
                    <img className="photo-full" src={p.photo} alt={item.name || ''} {...hold.props()} onClick={hold.tap(() => {})} />
                    {showTimes && <span className="stamp">{photoStamp(p.at)}</span>}
                    <button type="button" className="photo-trash" aria-label="Remove this photo" onClick={() => askRemove(p)}><TrashIcon /></button>
                  </div>
                  {was ? <div className="was"><PinWasIcon /><span>{p.location}</span></div> : <div className="was empty" aria-hidden="true" />}
                </div>
              );
            })}
          </div>
        </div>
        {pages.length > 1 && (
          <div className="dotsrow">
            <div className="dots" aria-label={`Photo ${index + 1} of ${pages.length}`}>
              {pages.map((p, i) => <button type="button" key={p.id} className={'dot' + (i === index ? ' on' : '')} onClick={() => slideTo(i)} aria-label={`Photo ${i + 1}`} />)}
            </div>
            <span className="cnt">{Math.min(index, pages.length - 1) + 1} of {pages.length}</span>
          </div>
        )}

        {/* The three states of the card, each a switch (Ravi 09-16). */}
        <div className="switches">
          <div className="sw-row">
            <span className="lab"><LockIcon /> Keep this private</span>
            <button type="button" role="switch" aria-checked={isPrivate(item)} className={'sw' + (isPrivate(item) ? ' on' : '')} aria-label="Keep this private"
              onClick={async () => { const to = isPrivate(item) ? 'household' : 'private'; await setVisibility(item, to); logEvent('visibility', { itemId: item.id, to, via: 'switch' }); onToast && onToast(VISIBILITY_TOAST[to]); }} />
          </div>
          <div className="sw-row">
            <span className="lab"><ClockIcon /> Show times on photos</span>
            <button type="button" role="switch" aria-checked={showTimes} className={'sw' + (showTimes ? ' on' : '')} aria-label="Show times on photos"
              onClick={() => { const v = !showTimes; setShowTimes(v); savePrefs({ ...getPrefs(), showTimes: v }); logEvent('show_times', { on: v }); }} />
          </div>
          {earlierCount > 0 && (
            <div className="sw-row">
              <span className="lab amber"><PinWasIcon /> Show earlier places <small>{earlierCount}</small></span>
              <button type="button" role="switch" aria-checked={showEarlier} className={'sw' + (showEarlier ? ' on' : '')} aria-label="Show earlier places"
                onClick={() => { const v = !showEarlier; setShowEarlier(v); setIndex(0); const el = stripRef.current; if (el) el.scrollTo({ left: 0 }); logEvent('show_earlier', { itemId: item.id, on: v, earlier: earlierCount }); }} />
            </div>
          )}
        </div>
      </div>

      {/* The actions live in a fixed bar at the bottom, like Home's Log item · Find item
          (Ravi 09-16: the row sat at a different height on every card). Same padding,
          same gradient, same button height as the Home footer. */}
      {(
        <div className="footer actfoot">
          <div className={'actbar three' + (iconsOnly ? ' icons' : '')} ref={actRef}>
            <button type="button" className="act primary" aria-label="Add photo" disabled={stayFull} onClick={() => { setSnaps(null); onAdd(); }}><CameraIcon /><span>Add photo</span></button>
            <button type="button" className={'act' + (fixing ? ' on' : '')} aria-label={fixing ? 'Done' : 'Edit'} aria-pressed={fixing} onClick={() => setFixing((f) => !f)}><PencilIcon /><span>{fixing ? 'Done' : 'Edit'}</span></button>
            <button type="button" className="act amber" aria-label="Remove item" onClick={() => setConfirming('item')}><TrashIcon /><span>Remove</span></button>
            <div className="act-probe" ref={probeRef} aria-hidden="true" />
          </div>
        </div>
      )}
      <div className="card thing edit-card" hidden={!fixing}>
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
          onPrivate={async () => { setSheet(false); const to = isPrivate(item) ? 'household' : 'private'; await setVisibility(item, to); logEvent('visibility', { itemId: item.id, to, via: 'sheet' }); onToast && onToast(VISIBILITY_TOAST[to]); }}
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
