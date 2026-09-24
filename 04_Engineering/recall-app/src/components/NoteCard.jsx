import { useState } from 'react';
import Header from './Header.jsx';
import { addItem, knownLocations, logEvent, firstName } from '../lib/db.js';
import { me } from '../lib/auth.js';
import { CheckIcon, LockIcon } from './Icons.jsx';
import { privateWhy, hasSecret } from '../lib/sensitive.js';
import PrivNote, { PhoneOnly } from './PrivNote.jsx';

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
  const [touched, setTouched] = useState(false); // she moved the switch herself: ReCall stops deciding
  const [privSet, setPriv] = useState(false);
  const [busy, setBusy] = useState(false);
  const chips = knownLocations(items, 6, places);
  const mine = !owner || owner === me(); // only the owner can keep a thing to herself
  // Private by default (Ravi 09-24): a name or place that looks private turns the switch on, with a
  // line saying why; a typed secret ("PIN 4821") blocks Save until it's taken out.
  const why = privateWhy(name, place);
  const priv = touched ? privSet : !!why;
  const secret = hasSecret(name, place);
  const ready = name.trim().length > 0 && !busy && !secret;

  async function save() {
    if (!ready) return;
    setBusy(true);
    const loc = cap(place.trim());
    // Private from the first write, so it is never visible to anyone for a moment (09-24).
    const id = await addItem({ name: name.trim(), location: loc, placeSource: loc ? 'chosen' : '', ...(owner ? { owner } : {}), private: priv && mine, privateAuto: !touched && why ? why : '' });
    logEvent('capture', { initiatedBy: 'self', mode: 'written', itemId: id, hasPlace: !!loc, private: priv && mine, auto: !touched && !!why });
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
            <button type="button" role="switch" aria-checked={priv} className={'sw' + (priv ? ' on' : '')} aria-label="Keep this private" onClick={() => { setTouched(true); setPriv(!priv); logEvent('privacy_switch', { to: !priv, auto: !!why, mode: 'written' }); }} />
          </div>
        )}
        {mine && <PhoneOnly where="write" />}
        {secret ? <PrivNote typedSecret />
          : why && !touched && mine ? <div className="privnote" role="status"><LockIcon /><span>{`${why.charAt(0).toUpperCase()}${why.slice(1)}`}, so it starts private. Switch it off to share it.</span></div>
          : why && !mine ? <PrivNote v={{ private: true, why }} mine={false} ownerName={firstName(owner)} onDontSave={onBack} />
          : null}
        <button type="button" className="btn-primary" disabled={!ready} onClick={save}><CheckIcon /><span>{place.trim() ? 'Save' : 'Save without a place'}</span></button>
      </div>
    </div>
  );
}
