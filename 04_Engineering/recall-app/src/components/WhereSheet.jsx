import { useState } from 'react';
import { knownLocations, placeThumb } from '../lib/db.js';
import { graph, containers, thingMatches, inPhrase } from '../lib/graph.js';
import { PinIcon, BoxIcon } from './Icons.jsx';

// Put away, step 1 (Ravi 09-25 P-A; 09-27 "no facility to catalog without providing a place" → the other
// half: putting the not-put-away things somewhere, fast). Where are they going? Boxes by photo, then the
// household's places, then anything typed. Step 2 is PutInSheet (tap each thing).
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export default function WhereSheet({ count = 0, items = [], places = [], onPick, onCancel }) {
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const boxes = containers(graph(), 4);
  const names = knownLocations(items, 8, places).filter((n) => !boxes.some((b) => (b.name || '').toLowerCase() === n.toLowerCase()));
  const pic = (n) => placeThumb(n, places, items);
  return (
    <div className="sheet-back" onClick={onCancel} role="presentation">
      <div className="sheet place-sheet" role="dialog" aria-modal="true" aria-labelledby="ws-title" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-title" id="ws-title">Put away {count} item{count === 1 ? '' : 's'}</div>
        <div className="putin-sub">Where are they going?</div>
        <div className="guesses">
          {boxes.map((b) => (
            <button key={b.id} type="button" className="guess withpic inbox" onClick={() => onPick({ t: 'thing', thing: b })}>
              {b.thumb ? <img className="guess-pic" src={b.thumb} alt="" /> : <span className="guess-pic none"><BoxIcon /></span>}
              <span>{inPhrase(b)}</span>
            </button>))}
          {names.map((n) => { const t = pic(n); return (
            <button key={n} type="button" className="guess withpic" onClick={() => onPick({ t: 'place', name: n })}>
              {t ? <img className="guess-pic" src={t.src} alt="" /> : <span className="guess-pic none"><PinIcon /></span>}
              <span>{n}</span>
            </button>); })}
          {!typing ? <button type="button" className="guess other" onClick={() => setTyping(true)}>Somewhere else</button> : (
            <div className="typing">
              <input className="place-input" autoFocus value={draft} placeholder="the garage shelf, or a box's name" enterKeyHint="done"
                onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && draft.trim()) onPick({ t: 'place', name: cap(draft.trim()) }); }} />
              {thingMatches(draft, null).map((x) => (
                <button key={x.id} type="button" className="guess withpic inbox" onClick={() => onPick({ t: 'thing', thing: x })}>
                  {x.thumb ? <img className="guess-pic" src={x.thumb} alt="" /> : <span className="guess-pic none"><BoxIcon /></span>}
                  <span>{inPhrase(x)}</span>
                </button>))}
              <button className="btn-primary" disabled={!draft.trim()} onClick={() => onPick({ t: 'place', name: cap(draft.trim()) })}>Use this</button>
            </div>
          )}
        </div>
        <button className="btn-primary alt" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
