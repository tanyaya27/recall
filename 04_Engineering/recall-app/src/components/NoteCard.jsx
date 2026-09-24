import { useState } from 'react';
import Header from './Header.jsx';
import { addItem, knownLocations, logEvent, updateItem } from '../lib/db.js';
import { me } from '../lib/auth.js';
import { CheckIcon, LockIcon } from './Icons.jsx';

// Write it down, no photo (MVP #10, 2026-09-24). For the dark cupboard, the hiding place you'd
// rather not photograph, or when typing — or the keyboard's own mic — is simply faster:
// "Bank locker key" · "Blue tin, top of the wardrobe". Two plain fields; the place can be one
// of the usual places or anything typed. The place used a moment ago is already chosen.
// Actions are in the flow (a keyboard is open on this screen — LESSONS: fixed footers and
// keyboards do not mix).
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export default function NoteCard({ items = [], places = [], owner, presetPlace = '', onDone, onBack }) {
  const [name, setName] = useState('');
  const [place, setPlace] = useState(presetPlace || '');
  const [typing, setTyping] = useState(false);
  const [priv, setPriv] = useState(false);
  const [busy, setBusy] = useState(false);
  const chips = knownLocations(items, 6, places);
  const mine = !owner || owner === me(); // only the owner can keep a thing to herself
  const ready = name.trim().length > 0 && !busy;

  async function save() {
    if (!ready) return;
    setBusy(true);
    const loc = cap(place.trim());
    const id = await addItem({ name: name.trim(), location: loc, placeSource: loc ? 'chosen' : '', ...(owner ? { owner } : {}) });
    if (priv && mine) await updateItem(id, { private: true, roles: {}, sharedWith: [] });
    logEvent('capture', { initiatedBy: 'self', mode: 'written', itemId: id, hasPlace: !!loc, private: priv && mine });
    onDone({ saved: true, name: cap(name.trim()), place: loc, itemId: id });
  }

  return (
    <div className="screen note-card">
      <Header title="Write it down" onBack={onBack} />
      <div className="card">
        <label className="ask-q" htmlFor="note-what">What is it?</label>
        <input id="note-what" className="place-input" autoFocus value={name} placeholder="bank locker key" enterKeyHint="next"
          onChange={(e) => setName(e.target.value)} />
        <div className="ask-q">Where is it?</div>
        <div className="guesses">
          {chips.map((c) => (
            <button key={c} type="button" className={'guess' + (place === c ? ' pre' : '')} onClick={() => { setPlace(place === c ? '' : c); setTyping(false); }}>
              <span>{c}</span>{place === c && <CheckIcon />}
            </button>
          ))}
          {!typing && !(place && !chips.includes(place))
            ? <button type="button" className="guess other" onClick={() => { setTyping(true); setPlace(''); }}>Somewhere else</button>
            : <input className="place-input" autoFocus={typing} value={place} placeholder="blue tin, top of the wardrobe" enterKeyHint="done"
                onChange={(e) => setPlace(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') save(); }} />}
        </div>
        {mine && (
          <div className="sw-row note-private">
            <span className="lab"><LockIcon /> Keep this private</span>
            <button type="button" role="switch" aria-checked={priv} className={'sw' + (priv ? ' on' : '')} aria-label="Keep this private" onClick={() => setPriv(!priv)} />
          </div>
        )}
        <button type="button" className="btn-primary" disabled={!ready} onClick={save}><CheckIcon /><span>{place.trim() ? 'Save' : 'Save without a place'}</span></button>
      </div>
    </div>
  );
}
