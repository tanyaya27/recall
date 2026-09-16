import { useState, useEffect } from 'react';
import { restoreItem, purgeItem, exportEvents, EVENT_SCHEMA, addPlace, renamePlace, removePlace, removePlacePhoto, placeNamed, placeThumb, allPlaces, changeLocation, logEvent, PLACE_PHOTOS } from '../lib/db.js';
import { compressPlacePhoto } from '../lib/img.js';
import { CameraIcon, ChevronIcon, PencilIcon, TrashIcon } from './Icons.jsx';
import { timeAgo } from '../lib/format.js';
import { getPrefs, savePrefs, THEMES, SIZES } from '../lib/prefs.js';
import Header from './Header.jsx';
import Confirm from './Confirm.jsx';
import SwipeRow from './SwipeRow.jsx';

// The hamburger menu and its screens (Ravi, 2026-09-14 round 4 — overruling the board's
// 09-05 rejection of a hamburger). The menu is a drawer from the left of the day line. What
// lives here moved OUT of Settings: Look and feel, Locations, Deleted items, Research log.
// Settings (the gear) keeps only the AI key and the Version card, for the developer, and
// is slated for removal.

export const MENU_ITEMS = [
  { id: 'look', label: 'Text size & colours' }, // was 'Look and feel' — 'a bad name' (Ravi 09-15)
  { id: 'locations', label: 'Places' }, // 'place' everywhere (Ravi 09-16); the route id stays
  { id: 'deleted', label: 'Deleted items' },
  { id: 'research', label: 'Research log' },
];

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
export function LocationsScreen({ places = [], items = [], onBack, onOpen, onAdd }) {
  const rows = allPlaces(items, places);
  return (
    <div className="screen settings">
      <Header title="Places" onBack={onBack} />
      {rows.length === 0 && <div className="card"><p className="sub" style={{ margin: 0 }}>No places yet. Add one with a photo, or they appear here as things are logged.</p></div>}
      {rows.map((r) => {
        const pic = placeThumb(r.name, places, items);
        const sub = r.count ? `${r.count} thing${r.count === 1 ? '' : 's'} here` : 'nothing here now';
        const pics = r.saved && r.saved.photos ? r.saved.photos.length : 0;
        return (
          <button type="button" className="loc-row" key={r.name} onClick={() => onOpen(r.name)}>
            {pic ? <img className="loc-pic" src={pic.src} alt="" /> : <span className="loc-pic none"><CameraIcon /></span>}
            <span className="nm"><b>{r.name}</b><small>{sub}{pics ? '' : ' · no photo of the place'}</small></span>
            <span className="chev"><ChevronIcon /></span>
          </button>
        );
      })}
      <button className="btn-secondary" onClick={onAdd}><CameraIcon /> Add a place</button>
    </div>
  );
}

// One place: its photos (add / remove), its name (rename updates every thing there), the
// things there now, and Remove at the bottom (things keep their place text; only the saved
// place and its photos go).
export function PlaceScreen({ name, places = [], items = [], onBack, onAddPhoto, onOpenThing, onToast }) {
  const saved = placeNamed(name, places);
  const photos = (saved && saved.photos) || [];
  const things = items.filter((it) => (it.location || '').toLowerCase() === name.toLowerCase());
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [confirming, setConfirming] = useState(null); // 'place' | { photo: index }
  const rename = async () => {
    const n = draft.trim(); setEditing(false);
    if (!n || n === name) return;
    if (saved) await renamePlace(saved, n, items);
    else { const id = await addPlace(n, places); await Promise.all(things.map((it) => changeLocation(it, n))); void id; }
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
        {editing ? (
          <div className="row" style={{ padding: 0, borderBottom: 'none' }}>
            <input className="place-input" autoFocus value={draft} enterKeyHint="done" onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') rename(); }} />
            <button onClick={rename}>Save</button>
            <button onClick={() => { setEditing(false); setDraft(name); }}>Cancel</button>
          </div>
        ) : (
          <button type="button" className="field-value" onClick={() => setEditing(true)}><span className="field-text">{name}</span><PencilIcon /></button>
        )}

        <div className="field-label">{things.length ? 'Things here now' : 'Nothing here now'}</div>
        {things.length > 0 && (
          <div className="things-here">
            {things.map((it) => <button type="button" className="thing-mini" key={it.id} onClick={() => onOpenThing(it)}><img src={it.thumb} alt={it.name || ''} /></button>)}
          </div>
        )}

        <button className="btn-secondary amber" onClick={() => setConfirming('place')}><TrashIcon /> Remove this place</button>
      </div>
      {confirming === 'place' && (
        <Confirm title={`Remove ${name}?`} image={photos[0] ? photos[0].thumb : undefined}
          body={things.length ? `${things.length} thing${things.length === 1 ? ' keeps' : 's keep'} "${name}" as ${things.length === 1 ? 'its' : 'their'} place; only the saved place and its photos go.` : 'The saved place and its photos go.'}
          actionLabel="Remove" onKeep={() => setConfirming(null)}
          onAction={async () => { setConfirming(null); if (saved) await removePlace(saved); logEvent('place_removed', { name, things: things.length }); onToast && onToast(`Removed · ${name}`); onBack(); }} />
      )}
      {confirming && confirming.photo !== undefined && (
        <Confirm title="Remove this photo?" image={photos[confirming.photo].thumb} body="The place keeps its name and its things." actionLabel="Remove"
          onKeep={() => setConfirming(null)} onAction={async () => { const i = confirming.photo; setConfirming(null); await removePlacePhoto(saved, i); }} />
      )}
    </div>
  );
}

// After the camera, for a NEW location: the photos just taken, and the one question.
export function NewPlaceScreen({ files = [], places = [], onBack, onDone }) {
  const [draft, setDraft] = useState('');
  const [pics, setPics] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { let on = true; Promise.all(files.slice(0, PLACE_PHOTOS).map(compressPlacePhoto)).then((p) => { if (on) setPics(p); }); return () => { on = false; }; }, [files]);
  const save = async () => {
    const n = draft.trim(); if (!n || busy) return;
    setBusy(true); const id = await addPlace(n, places, pics || []); logEvent('place_added', { name: n, photos: (pics || []).length, via: 'camera' }); setBusy(false); onDone(n, id);
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
  return (
    <div className="screen settings">
      <Header title="Research log" onBack={onBack} />
      <div className="group"><div className="grow">
        <p className="sub">Every photo, question and correction is logged silently with exact times. Nothing is ever shown to the person as a number.</p>
        <button className="btn-secondary" onClick={downloadEvents}>Download usage log (JSON)</button>
      </div></div>
    </div>
  );
}
