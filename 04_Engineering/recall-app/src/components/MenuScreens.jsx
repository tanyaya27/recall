import { useState } from 'react';
import { restoreItem, purgeItem, exportEvents, EVENT_SCHEMA, addPlace, renamePlace, removePlace, knownLocations } from '../lib/db.js';
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
  { id: 'look', label: 'Look and feel' },
  { id: 'locations', label: 'Locations' },
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
      <Header title="Look and feel" onBack={onBack} />
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

export function LocationsScreen({ places = [], items = [], onBack }) {
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(null); // { id, draft }
  const count = (p) => items.filter((it) => (it.location || '').toLowerCase() === p.name.toLowerCase()).length;
  return (
    <div className="screen settings">
      <Header title="Locations" onBack={onBack} />
      <div className="group-title">Saved locations</div>
      <div className="group">
        {places.length === 0 && <div className="grow"><p className="sub">Locations you add here are offered first when a photo is logged. Already used on items: {knownLocations(items, 6).join(', ') || 'none yet'}.</p></div>}
        {places.map((p) => (
          <div className="row" key={p.id}>
            {editing && editing.id === p.id ? (
              <>
                <input className="place-input" autoFocus value={editing.draft} enterKeyHint="done"
                  onChange={(e) => setEditing({ id: p.id, draft: e.target.value })}
                  onKeyDown={(e) => { if (e.key === 'Enter') { renamePlace(p, editing.draft, items); setEditing(null); } }} />
                <button onClick={() => { renamePlace(p, editing.draft, items); setEditing(null); }}>Save</button>
                <button onClick={() => setEditing(null)}>Cancel</button>
              </>
            ) : (
              <>
                <div className="nm">{p.name}<small>{count(p) ? `${count(p)} item${count(p) === 1 ? '' : 's'} here` : 'not used yet'}</small></div>
                <button onClick={() => setEditing({ id: p.id, draft: p.name })}>Rename</button>
                <button onClick={() => removePlace(p)}>Remove</button>
              </>
            )}
          </div>
        ))}
        <div className="row">
          <input className="place-input" value={draft} placeholder="Add a location — Kitchen counter" enterKeyHint="done"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && draft.trim()) { addPlace(draft, places); setDraft(''); } }} />
          <button disabled={!draft.trim()} onClick={() => { addPlace(draft, places); setDraft(''); }}>Add</button>
        </div>
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
      <small>{it.location || 'no location'} · removed {timeAgo(it.deletedAt)}</small>
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
