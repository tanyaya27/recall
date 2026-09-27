import { useState } from 'react';
import { knownLocations, placeThumb } from '../lib/db.js';
import { PinIcon, BoxIcon } from './Icons.jsx';
import InThingSheet from './InThingSheet.jsx';
import { containers, thingMatches, inPhrase } from '../lib/graph.js';
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// Choosing a place by hand (thing card → Edit → Where it is; 2026-09-16, Ravi: "I only get
// an option to type something in — very poor"). The same list as "Where is it?" after a
// photo: the household's places with their pictures, then *Somewhere else* to type.
export default function PlacePicker({ current, items = [], places = [], onPick, onCancel, item = null }) {
  const [typing, setTyping] = useState(false);
  const [inPick, setInPick] = useState(false);
  const [draft, setDraft] = useState('');
  const options = knownLocations(items, 12, places).filter((n) => n.toLowerCase() !== (current || '').toLowerCase());
  const pic = (name) => placeThumb(name, places, items);
  return (
    <div className="sheet-back" onClick={onCancel} role="presentation">
      <div className="sheet place-sheet" role="dialog" aria-modal="true" aria-labelledby="pp-title" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-title" id="pp-title">Where is it now?</div>
        {/* The parallel path, at the top (Ravi 09-27): in something — a box logged or new. */}
        <div className="path-row"><button type="button" className="path in" onClick={() => setInPick(true)}><BoxIcon /><span>In something</span></button></div>
        <div className="guesses">
          {options.map((g) => { const t = pic(g); return (
            <button key={g} type="button" className="guess withpic" onClick={() => onPick(g)}>
              {t ? <img className="guess-pic" src={t.src} alt="" /> : <span className="guess-pic none"><PinIcon /></span>}
              <span>{g}</span>
            </button>); })}
          {containers(undefined, 3).filter((b) => (!item || b.id !== item.id) && (b.name || '').toLowerCase() !== (current || '').toLowerCase()).map((b) => (
            <button key={b.id} type="button" className="guess withpic inbox" onClick={() => onPick(cap(b.name), { t: 'thing', id: b.id, name: b.name })}>
              {b.thumb ? <img className="guess-pic" src={b.thumb} alt="" /> : <span className="guess-pic none"><BoxIcon /></span>}
              <span>{inPhrase(b)}</span>
            </button>))}
          {!typing
            ? <button type="button" className="guess other" onClick={() => setTyping(true)}>Somewhere else</button>
            : <div className="typing">
                <input className="place-input" autoFocus value={draft} placeholder="the bathroom counter" enterKeyHint="done"
                  onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && draft.trim()) onPick(draft.trim()); }} />
                <button className="btn-primary" disabled={!draft.trim()} onClick={() => onPick(draft.trim())}>Use this</button>
                {thingMatches(draft, item).map((x) => (
                  <button key={x.id} type="button" className="guess withpic inbox" onClick={() => onPick(cap(x.name), { t: 'thing', id: x.id, name: x.name })}>
                    {x.thumb ? <img className="guess-pic" src={x.thumb} alt="" /> : <span className="guess-pic none"><BoxIcon /></span>}
                    <span>{inPhrase(x)}</span>
                  </button>))}
              </div>}
        </div>
        <button className="btn-primary alt" onClick={onCancel}>Cancel</button>
        {inPick && <InThingSheet item={item} owner={item && item.owner} onCancel={() => setInPick(false)} onPick={(x) => { setInPick(false); onPick(cap(x.name), { t: 'thing', id: x.id, name: x.name }); }} />}
      </div>
    </div>
  );
}
