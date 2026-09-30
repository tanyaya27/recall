import { useState, useEffect } from 'react';
import { restoreItem, purgeItem, exportEvents, EVENT_SCHEMA, addPlace, renamePlace, removePlace, removePlacePhoto, placeNamed, placeThumb, allPlaces, changeLocation, logEvent, PLACE_PHOTOS, placeIn, mergePlace } from '../lib/db.js';
import WhereList from './WhereList.jsx';
import { compressPlacePhoto } from '../lib/img.js';
import { CameraIcon, ChevronIcon, PencilIcon, TrashIcon, NoteIcon, PinIcon } from './Icons.jsx';
import { timeAgo, cap } from '../lib/format.js';
import { getPrefs, savePrefs, THEMES, SIZES } from '../lib/prefs.js';
import Header from './Header.jsx';
import { placeOuter, graph } from '../lib/graph.js';
import { me } from '../lib/auth.js';
import Confirm from './Confirm.jsx';
import SwipeRow from './SwipeRow.jsx';

// The hamburger menu and its screens (Ravi, 2026-09-14 round 4 — overruling the board's
// 09-05 rejection of a hamburger). The menu is a drawer from the left of the day line. What
// lives here moved OUT of Settings: Look and feel, Locations, Deleted items, Research log.
// Settings (the gear) keeps only the AI key and the Version card, for the developer, and
// is slated for removal.

export const MENU_ITEMS = [
  { id: 'look', label: 'Text size & colours' }, // was 'Look and feel' — 'a bad name' (Ravi 09-15)
  { id: 'people', label: 'People' }, // multi-user Phase 2 (MU1·1): second row (Maya; Devin wanted it last — plan split 2)
  { id: 'locations', label: 'Places' }, // 'place' everywhere (Ravi 09-16); the route id stays
  { id: 'deleted', label: 'Deleted items' },
  { id: 'research', label: 'Research log' },
];

// The build on the phone, readable by a person (Ravi 09-28). The Version card left Settings in the
// 09-27 trim, and the very next phone check had no way to tell old build from new — that cost a
// debugging round. The ?v= stamp on our own script tag is the deploy stamp; the bundle's build time
// is the fallback (the rig loads app.js without ?v=).
export const BUILD_ID = (() => {
  try {
    const s = [...document.querySelectorAll('script[src]')].find((x) => /app\.js/.test(x.src));
    const m = s && s.src.match(/[?&]v=([\w.-]+)/);
    if (m) return m[1];
  } catch { /* stamp only */ }
  try { return String(__BUILD__); } catch { return ''; }
})();

export function MenuDrawer({ open, onPick, onClose }) {
  if (!open) return null;
  return (
    <div className="drawer-back" onClick={onClose} role="presentation">
      <nav className="drawer" role="dialog" aria-modal="true" aria-label="Menu" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-title">ReCall</div>
        {MENU_ITEMS.map((m) => (
          <button key={m.id} className="drawer-row" onClick={() => onPick(m.id)}>{m.label}</button>
        ))}
        <button className="drawer-row quiet" onClick={onClose}>Close</button>
        {BUILD_ID && <div className="drawer-build" aria-label="App build">Build {BUILD_ID}</div>}
      </nav>
    </div>
  );
}

export function LookScreen({ onBack }) {
  const [prefs, setPrefs] = useState(getPrefs());
  const setPref = (k, v) => { const p = { ...prefs, [k]: v }; setPrefs(p); savePrefs(p); };
  return (
    <div className="screen settings">
      <Header title="Text size & colours" onBack={onBack} />
      <div className="group-title">Text size</div>
      <div className="group"><div className="grow">
        <div className="seg">
          {SIZES.map((s) => <button key={s.id} className={prefs.size === s.id ? 'on' : ''} onClick={() => setPref('size', s.id)}>{s.label}</button>)}
        </div>
      </div></div>
      <div className="group-title">Colours</div>
      <div className="group"><div className="grow">
        <div className="seg wrap">
          {THEMES.map((t) => <button key={t.id} className={prefs.theme === t.id ? 'on' : ''} onClick={() => setPref('theme', t.id)}>{t.label}</button>)}
        </div>
      </div></div>
      <div className="group-title">Density</div>
      <div className="group"><div className="grow">
        <div className="seg">
          <button className={prefs.density !== 'compact' ? 'on' : ''} onClick={() => setPref('density', 'normal')}>Roomy</button>
          <button className={prefs.density === 'compact' ? 'on' : ''} onClick={() => setPref('density', 'compact')}>Compact</button>
        </div>
        <p className="note-quiet left">Compact tightens lists and cards. In Deleted items, swipe a row left to delete it or right to put it back.</p>
      </div></div>
    </div>
  );
}

// ---- Locations (round 7, 2026-09-15 — Ravi: "a blob of text" → a list with photos) ----
// One list of every place the household knows, used or saved, with its picture, how many
// things are there, and a chevron. Tap → PlaceScreen. "Add a location" opens the camera
// first and asks the name after, the same shape as logging a thing.
export function LocationsScreen({ places = [], items = [], onBack, onOpen, onAdd, canEdit = true }) {
  const rows = allPlaces(items, places);
  return (
    <div className="screen settings">
      <Header title="Places" onBack={onBack} />
      {rows.length === 0 && <div className="card"><p className="sub" style={{ margin: 0 }}>No places yet. Add one with a photo, or they appear here as items are logged.</p></div>}
      {rows.map((r) => {
        const pic = placeThumb(r.name, places, items);
        // Q2 · A (Ravi 09-29): a place that is in something says so first — "in Oak cabinet · 1 thing here".
        const inW = placeOuter(r.name)[0];
        const sub = (inW ? `in ${inW.t === 'thing' ? cap(inW.item.name) : inW.name} · ` : '') + (r.count ? `${r.count} item${r.count === 1 ? '' : 's'} here` : 'nothing here now');
        const pics = r.saved && r.saved.photos ? r.saved.photos.length : 0;
        return (
          <button type="button" className="loc-row" key={r.name} onClick={() => onOpen(r.name)}>
            {pic ? <img className="loc-pic" src={pic.src} alt="" /> : <span className="loc-pic none"><CameraIcon /></span>}
            <span className="nm"><b>{r.name}</b><small>{sub}{pics ? '' : ' · no photo of the place'}</small></span>
            <span className="chev"><ChevronIcon /></span>
          </button>
        );
      })}
      {canEdit && <button className="btn-secondary" onClick={onAdd}><CameraIcon /> Add a place</button>}
    </div>
  );
}

// One place: its photos (add / remove), its name (rename updates every thing there), the
// things there now, and Remove at the bottom (things keep their place text; only the saved
// place and its photos go).
export function PlaceScreen({ name, places = [], items = [], onBack, onAddPhoto, onOpenThing, onToast, owner, samePlace = null }) {
  const saved = placeNamed(name, places);
  const photos = (saved && saved.photos) || [];
  const things = items.filter((it) => (it.location || '').toLowerCase() === name.toLowerCase());
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [confirming, setConfirming] = useState(null); // 'place' | { photo: index }
  // 09-30 (Ravi, 3B): a place can't be removed while anything is in it. This page is the list to work through: each item
  // (and each place inside this one) has its own Move, and "Move all to…" moves everything at once.
  const lower = (x) => (x || '').trim().toLowerCase();
  const subPlaces = (graph().edges || []).filter((e) => !e.until && e.to && e.to.t === 'place' && lower(e.to.name) === lower(name))
    .map((e) => places.find((p) => p.id === e.from)).filter(Boolean);
  const [moving, setMoving] = useState(null); // { it } | { p } | 'all'
  const busyLeft = things.length + subPlaces.length;
  async function moveTo(k) {
    const what = moving; setMoving(null);
    const list = what === 'all' ? [...things.map((it) => ({ it })), ...subPlaces.map((p) => ({ p }))] : [what];
    if (k.t === 'place' && !placeNamed(k.name, places)) await addPlace(k.name, places, [], owner);
    let n = 0;
    for (const x of list) {
      if (x.it) { const ok = await changeLocation(x.it, k.t === 'thing' ? cap(k.item.name) : k.name, 'chosen', k.t === 'thing' ? { t: 'thing', id: k.item.id, name: k.item.name } : { t: 'place', name: k.name }); if (ok !== false) n++; }
      else if (x.p && k.t === 'place') { const r = await placeIn(x.p, { t: 'place', name: k.name }); if (r) n++; } // a place is never inside a box (Q4); a circle is refused
    }
    logEvent('place_emptying', { from: name, to: k.t === 'thing' ? k.item.name : k.name, n, all: what === 'all' });
    onToast && onToast(`Moved ${n === 1 ? (list[0].it ? cap(list[0].it.name) : list[0].p.name) : `${n} items`} · ${k.t === 'thing' ? cap(k.item.name) : k.name}`);
  }
  // 09-30 (independent test, round 2): a name you already have (another place, or a box) was taken silently — two places
  // with one name, and one of them vanished from Places. Refused here, the way the camera refuses it.
  const taken = (() => { const n = draft.trim().toLowerCase(); if (!n || n === name.toLowerCase()) return '';
    const b = items.find((x) => !x.deleted && x.holds && (x.name || '').toLowerCase() === n); if (b) return `“${cap(b.name)}” is a box you have — give this place its own name.`;
    return ''; })();
  // 09-30 (Ravi, 4): a name you already have for another PLACE offers to merge the two (a box's name is still refused).
  const dupOf = (n) => places.find((x) => (x.name || '').toLowerCase() === n.toLowerCase() && (!saved || x.id !== saved.id)) || null;
  const [merge, setMerge] = useState(null); // { into, status: 'comparing'|'same'|'different'|'unknown', review?: [photos], drop?: index }
  const itemsAt = (nm) => items.filter((it) => (it.location || '').toLowerCase() === (nm || '').toLowerCase()).length;
  async function openMerge(into) {
    const a = photos[0] && photos[0].thumb; const b = into.photos && into.photos[0] && into.photos[0].thumb;
    setMerge({ into, status: a && b && samePlace ? 'comparing' : 'unknown' });
    if (!(a && b && samePlace)) return;
    const verdict = await Promise.race([samePlace(a, b), new Promise((r) => setTimeout(() => r('unknown'), 8000))]);
    setMerge((m) => (m && m.into.id === into.id ? { ...m, status: verdict } : m));
    logEvent('place_merge_compare', { from: name, into: into.name, verdict });
  }
  async function doMerge(keep) {
    const into = merge.into; setMerge(null); setEditing(false);
    if (!saved) { await Promise.all(things.map((it) => changeLocation(it, into.name))); }
    else await mergePlace(saved, into, keep, items);
    onToast && onToast(`Merged into ${into.name}`); onBack();
  }
  const rename = async () => {
    const n = draft.trim();
    if (taken || !n) return;
    const d = dupOf(n); if (d) { await openMerge(d); return; }
    setEditing(false);
    if (n === name) return;
    if (saved) await renamePlace(saved, n, items);
    else { const id = await addPlace(n, places, [], owner); await Promise.all(things.map((it) => changeLocation(it, n))); void id; }
    logEvent('place_renamed', { from: name, to: n, things: things.length });
    onToast && onToast(`Renamed · ${n}`); onBack();
  };
  return (
    <div className="screen settings">
      <Header title={name} onBack={onBack} />
      <div className="card">
        <div className="field-label">Photos of this place</div>
        <div className="place-photos">
          {photos.map((p, i) => (
            <div className="place-photo" key={p.at + '_' + i}>
              <img src={p.thumb} alt="" />
              <button type="button" className="photo-trash small" aria-label="Remove this photo" onClick={() => setConfirming({ photo: i })}><TrashIcon /></button>
            </div>
          ))}
          {photos.length < PLACE_PHOTOS && (
            <button type="button" className="place-photo add" onClick={() => onAddPhoto(PLACE_PHOTOS - photos.length)}><CameraIcon /><span>{photos.length ? 'Add photo' : 'Take a photo'}</span></button>
          )}
        </div>
        {photos.length === 0 && <p className="note-quiet left">A photo of the exact spot — "drawer 2, at the very back" — says more than words, and it is what the app will use to recognise the place.</p>}

        <div className="field-label">Name</div>
        {editing ? (<>
          <div className="row" style={{ padding: 0, borderBottom: 'none' }}>
            <input className="place-input" autoFocus value={draft} enterKeyHint="done" onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') rename(); }} />
            <button onClick={rename} disabled={!!taken || !draft.trim()}>Save</button>
            <button onClick={() => { setEditing(false); setDraft(name); }}>Cancel</button>
          </div>
          {taken && <p className="wl-taken place-taken">{taken}</p>}
        </>) : (
          <button type="button" className="field-value" onClick={() => setEditing(true)}><span className="field-text">{name}</span><PencilIcon /></button>
        )}

        <div className="field-label pl-here">{busyLeft ? `Here now · ${busyLeft}` : 'Nothing here now'}
          {busyLeft > 1 && <button type="button" className="pl-all" onClick={() => setMoving('all')}>Move all to…</button>}</div>
        {things.map((it) => (
          <div className="wl-row pl-row" key={it.id}>
            <button type="button" className="pl-open" onClick={() => onOpenThing(it)}>{it.thumb ? <img src={it.thumb} alt="" /> : <span className="no"><NoteIcon /></span>}
              <span className="tx"><b>{cap(it.name) || 'An item'}</b><small>in {name}</small></span></button>
            <button type="button" className="pl-move" onClick={() => setMoving({ it })}>Move</button>
          </div>))}
        {subPlaces.map((p) => (
          <div className="wl-row pl-row" key={p.id}>
            <span className="pl-open">{p.photos && p.photos.length ? <img src={p.photos[0].thumb} alt="" /> : <span className="no"><PinIcon /></span>}
              <span className="tx"><b>{p.name}</b><small>a place in {name}</small></span></span>
            <button type="button" className="pl-move" onClick={() => setMoving({ p })}>Move</button>
          </div>))}

        <button className="btn-secondary amber" disabled={busyLeft > 0} onClick={() => setConfirming('place')}><TrashIcon /> Remove this place</button>
        {busyLeft > 0 && <p className="note-quiet left">Move {busyLeft === 1 ? 'the item' : `the ${busyLeft} items`} first — then the place can go.</p>}
      </div>
      {merge && !merge.review && (
        <div className="sheet-back" onClick={() => setMerge(null)} role="presentation">
          <div className="sheet merge-sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-title">You already have the {merge.into.name}</div>
            <div className="mg-pair">
              {[{ nm: name, ph: photos, n: things.length }, { nm: merge.into.name, ph: merge.into.photos || [], n: itemsAt(merge.into.name) }].map((x) => (
                <div key={x.nm} className="mg-one">{x.ph[0] ? <img src={x.ph[0].thumb} alt="" /> : <span className="no"><PinIcon /></span>}
                  <b>{x.nm}</b><small>{x.ph.length} photo{x.ph.length === 1 ? '' : 's'} · {x.n} item{x.n === 1 ? '' : 's'}</small></div>))}
            </div>
            {merge.status === 'comparing' && <p className="sheet-body">ReCall is comparing the photos…</p>}
            {merge.status === 'same' && <p className="sheet-body">ReCall thinks these are <b>the same place</b>. Merge them: one {merge.into.name}, with everything in both.</p>}
            {merge.status === 'different' && <p className="sheet-body mg-warn"><b>These look like different places.</b> Mixed photos make it harder for ReCall to recognise the place from a photo.</p>}
            {merge.status === 'unknown' && <p className="sheet-body">ReCall can't compare them{photos.length && (merge.into.photos || []).length ? '' : ' (one has no photo)'}. Merge them into one {merge.into.name}?</p>}
            {merge.status === 'same' && <button className="btn-primary" onClick={() => doMerge([...(merge.into.photos || []), ...photos])}>Merge into the {merge.into.name}</button>}
            {(merge.status === 'different' || merge.status === 'unknown') && <>
              <button className="btn-primary" onClick={() => doMerge(merge.into.photos || [])}>Merge · keep the {merge.into.name}’s photos</button>
              <button className="btn-secondary" onClick={() => setMerge((m) => ({ ...m, review: [...(m.into.photos || []), ...photos] }))}>Merge · keep all photos…</button></>}
            <button className="btn-secondary" disabled={merge.status === 'comparing'} onClick={() => { setMerge(null); }}>Give it its own name</button>
          </div>
        </div>)}
      {merge && merge.review && (
        <div className="sheet-back" role="presentation">
          <div className="sheet merge-sheet" role="dialog" aria-modal="true">
            <div className="sheet-title">The {merge.into.name}’s photos</div>
            <p className="sheet-body">Remove the ones that aren’t this place — ReCall recognises a place by its photos.{merge.review.length > PLACE_PHOTOS ? ` A place keeps ${PLACE_PHOTOS}: remove ${merge.review.length - PLACE_PHOTOS} more, or the oldest go.` : ''}</p>
            <div className="mg-grid">
              {merge.review.map((p, i) => (
                <div key={i} className="mg-ph"><img src={p.thumb} alt="" />{i === 0 && <span className="mg-main">Main</span>}
                  {merge.review.length > 1 && <button type="button" className="mg-rm" aria-label="Remove this photo" onClick={() => setMerge((m) => ({ ...m, drop: i }))}><TrashIcon /></button>}</div>))}
            </div>
            <button className="btn-primary" onClick={() => doMerge(merge.review)}>Merge into the {merge.into.name}</button>
            <button className="btn-quiet" onClick={() => setMerge((m) => ({ ...m, review: null }))}>Back</button>
          </div>
        </div>)}
      {merge && merge.review && merge.drop !== undefined && merge.drop !== null && (
        <Confirm title="Remove this photo?" image={merge.review[merge.drop].thumb} body="It won’t be one of this place’s photos." actionLabel="Remove"
          onKeep={() => setMerge((m) => ({ ...m, drop: null }))}
          onAction={() => setMerge((m) => ({ ...m, review: m.review.filter((_, j) => j !== m.drop), drop: null }))} />)}
      {moving && (
        <WhereList chooser item={moving.it || null} items={items} places={places}
          exclude={(k) => (k.t === 'place' && lower(k.name) === lower(name)) || (!!moving.p && k.t === 'thing')}
          onPick={moveTo} onCancel={() => setMoving(null)} />)}
      {confirming === 'place' && (
        <Confirm title={`Remove ${name}?`} image={photos[0] ? photos[0].thumb : undefined}
          body={things.length ? `${things.length} item${things.length === 1 ? ' keeps' : 's keep'} "${name}" as ${things.length === 1 ? 'its' : 'their'} place; only the saved place and its photos go.` : 'The saved place and its photos go.'}
          actionLabel="Remove" onKeep={() => setConfirming(null)}
          onAction={async () => { setConfirming(null); if (saved) await removePlace(saved); logEvent('place_removed', { name, things: things.length }); onToast && onToast(`Removed · ${name}`); onBack(); }} />
      )}
      {confirming && confirming.photo !== undefined && (
        <Confirm title="Remove this photo?" image={photos[confirming.photo].thumb} body="The place keeps its name and its items." actionLabel="Remove"
          onKeep={() => setConfirming(null)} onAction={async () => { const i = confirming.photo; setConfirming(null); await removePlacePhoto(saved, i); }} />
      )}
    </div>
  );
}

// After the camera, for a NEW location: the photos just taken, and the one question.
export function NewPlaceScreen({ files = [], places = [], onBack, onDone, owner }) {
  const [draft, setDraft] = useState('');
  const [pics, setPics] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { let on = true; Promise.all(files.slice(0, PLACE_PHOTOS).map(compressPlacePhoto)).then((p) => { if (on) setPics(p); }); return () => { on = false; }; }, [files]);
  const save = async () => {
    const n = draft.trim(); if (!n || busy) return;
    setBusy(true); const id = await addPlace(n, places, pics || [], owner); logEvent('place_added', { name: n, photos: (pics || []).length, via: 'camera' }); setBusy(false); onDone(n, id);
  };
  return (
    <div className="screen settings">
      <Header title="New place" onBack={onBack} />
      <div className="card">
        <div className="place-photos">
          {(pics || files.map(() => null)).map((p, i) => <div className="place-photo" key={i}>{p ? <img src={p.thumb} alt="" /> : <span className="place-photo-wait">…</span>}</div>)}
        </div>
        <div className="ask-q">What is this place called?</div>
        <input className="place-input" autoFocus value={draft} placeholder="Kitchen counter" enterKeyHint="done" autoCapitalize="sentences"
          onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') save(); }} />
        <button className="btn-primary" disabled={!draft.trim() || !pics || busy} onClick={save}>Save this place</button>
      </div>
    </div>
  );
}

export function DeletedScreen({ removed = [], onBack }) {
  const [purging, setPurging] = useState(null); // item | 'all'
  const compact = getPrefs().density === 'compact';
  const Row = ({ it }) => (
    <div className="nm">
      {it.name || 'Unnamed'}
      <small>{it.location || 'no place'} · removed {timeAgo(it.deletedAt)}</small>
    </div>
  );
  return (
    <div className="screen settings">
      <Header title="Deleted items" onBack={onBack} />
      <div className="group-title">Can be put back</div>
      <div className="group">
        {removed.length === 0 && <div className="grow"><p className="sub">Nothing has been deleted.</p></div>}
        {removed.map((it) => compact ? (
          <SwipeRow key={it.id}
            left={{ label: 'Put back', onClick: () => restoreItem(it.id) }}
            right={{ label: 'Delete', onClick: () => setPurging(it) }}>
            <div className="row compact"><Row it={it} /></div>
          </SwipeRow>
        ) : (
          <div className="row" key={it.id}>
            <Row it={it} />
            <button onClick={() => restoreItem(it.id)}>Put back</button>
            <button onClick={() => setPurging(it)}>Delete for good</button>
          </div>
        ))}
      </div>
      {removed.length > 0 && (
        <button className="btn-secondary amber" onClick={() => setPurging('all')}>Empty the list ({removed.length})</button>
      )}
      {compact && removed.length > 0 && <p className="note-quiet">Swipe a row left to delete it for good, right to put it back.</p>}
      {purging && (
        <Confirm
          title={purging === 'all' ? `Delete all ${removed.length} for good, with their photos?` : `Delete ${(purging.name || 'this').toLowerCase()} and its photos for good?`}
          body="This cannot be undone."
          keepLabel="Keep" actionLabel="Delete for good"
          onKeep={() => setPurging(null)}
          onAction={async () => {
            const what = purging; setPurging(null);
            if (what === 'all') { for (const it of removed) await purgeItem(it); } else await purgeItem(what);
          }}
        />
      )}
    </div>
  );
}

export function ResearchScreen({ onBack }) {
  async function downloadEvents() {
    const events = await exportEvents();
    const blob = new Blob([JSON.stringify({ schema: EVENT_SCHEMA, exportedAt: new Date().toISOString(), events }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `recall-events-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  }
  // 09-30 (TESTING.md #6, Ravi: "your real house as test data"): a copy of what this phone can see — items, places and
  // their "is in" links, with small photos only — so every build can be tested on the real house, not the rig's sample.
  // It is saved on this phone; nothing is sent anywhere.
  function downloadHouse() {
    const g = graph();
    const slim = (d) => { const { photo, ...rest } = d; return rest; };
    const docs = [
      ...g.items.filter((d) => !d.deleted).map(slim),
      ...g.edges.map((e) => ({ ...e })),
      ...(g.places || []).map((p) => ({ ...p, photos: (p.photos || []).map((x) => ({ thumb: x.thumb, photo: x.thumb, at: x.at })) })),
    ];
    const blob = new Blob([JSON.stringify({ kind: 'recall-house', me: me(), exportedAt: new Date().toISOString(), docs })], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `recall-house-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    logEvent('house_export', { docs: docs.length });
  }
  return (
    <div className="screen settings">
      <Header title="Research log" onBack={onBack} />
      <div className="group"><div className="grow">
        <p className="sub">Every photo, question and correction is logged silently with exact times. Nothing is ever shown to the person as a number.</p>
        <button className="btn-secondary" onClick={downloadEvents}>Download usage log (JSON)</button>
        <button className="btn-secondary" onClick={downloadHouse}>Download a copy of my house (for testing)</button>
        <p className="sub">Your items, places and what is in what, with small photos — so each new build can be tested on your real house. It is saved on this phone; you choose where it goes.</p>
      </div></div>
    </div>
  );
}
