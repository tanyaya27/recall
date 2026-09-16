import { useState } from 'react';
import { knownLocations, placeThumb } from '../lib/db.js';
import { PinIcon } from './Icons.jsx';

// Choosing a place by hand (thing card → Edit → Where it is; 2026-09-16, Ravi: "I only get
// an option to type something in — very poor"). The same list as "Where is it?" after a
// photo: the household's places with their pictures, then *Somewhere else* to type.
export default function PlacePicker({ current, items = [], places = [], onPick, onCancel }) {
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState('');
  const options = knownLocations(items, 12, places).filter((n) => n.toLowerCase() !== (current || '').toLowerCase());
  const pic = (name) => placeThumb(name, places, items);
  return (
    <div className="sheet-back" onClick={onCancel} role="presentation">
      <div className="sheet place-sheet" role="dialog" aria-modal="true" aria-labelledby="pp-title" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-title" id="pp-title">Where is it now?</div>
        <div className="guesses">
          {options.map((g) => { const t = pic(g); return (
            <button key={g} type="button" className="guess withpic" onClick={() => onPick(g)}>
              {t ? <img className="guess-pic" src={t.src} alt="" /> : <span className="guess-pic none"><PinIcon /></span>}
              <span>{g}</span>
            </button>); })}
          {!typing
            ? <button type="button" className="guess other" onClick={() => setTyping(true)}>Somewhere else</button>
            : <div className="typing">
                <input className="place-input" autoFocus value={draft} placeholder="the bathroom counter" enterKeyHint="done"
                  onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && draft.trim()) onPick(draft.trim()); }} />
                <button className="btn-primary" disabled={!draft.trim()} onClick={() => onPick(draft.trim())}>Use this</button>
              </div>}
        </div>
        <button className="btn-primary alt" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
