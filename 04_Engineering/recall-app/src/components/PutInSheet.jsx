import { useState } from 'react';
import { contentsOf, wouldLoop, holderOf } from '../lib/graph.js';
import { CheckIcon, NoteIcon, PinIcon } from './Icons.jsx';

// Put things in a box (Ravi 09-25, P-B) — and, since 09-27, put things away at any place ("Not put away"
// on Home → where → tap each). The things not put away come first; tap each one that goes; one save for
// all of them, with Undo on the toast.
//   dest: { t:'thing', thing } | { t:'place', name };  onlyUnplaced: list just the things with no place.
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export default function PutInSheet({ container = null, dest = null, items = [], onlyUnplaced = false, onDone, onCancel }) {
  const d = dest || (container ? { t: 'thing', thing: container } : null);
  const box = d && d.t === 'thing' ? d.thing : null;
  const [picked, setPicked] = useState([]);
  const already = new Set(box ? contentsOf(box).map((x) => x.id) : []);
  const here = d && d.t === 'place' ? (d.name || '').toLowerCase() : '';
  const cands = items.filter((x) => !x.deleted && (!box || (x.id !== box.id && !already.has(x.id) && !wouldLoop(x, box)))
      && (!here || (x.location || '').toLowerCase() !== here) && (!onlyUnplaced || !x.location))
    .sort((a, b) => (!a.location === !b.location ? (b.lastSeenAt || 0) - (a.lastSeenAt || 0) : (!a.location ? -1 : 1)));
  const notPut = cands.filter((x) => !x.location).length;
  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const where = box ? `in the ${(box.name || 'box').replace(/^(my|the)\s+/i, '')}` : `at ${d ? d.name : ''}`;
  return (
    <div className="sheet-back" onClick={onCancel} role="presentation">
      <div className="sheet putin-sheet" role="dialog" aria-modal="true" aria-labelledby="putin-title" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-title" id="putin-title">{box ? `Put things ${where}` : `Put away ${where}`}</div>
        <div className="putin-sub">{!onlyUnplaced && notPut ? `${notPut} not put away yet, first · ` : ''}tap each one that goes {box ? 'in' : 'there'}</div>
        {cands.length === 0 ? <p className="empty">{onlyUnplaced ? 'Everything has a place.' : 'Everything is already in here.'}</p> : (
          <div className="board putin-grid">
            {cands.slice(0, 40).map((x) => {
              const on = picked.includes(x.id);
              const h = holderOf(x);
              return (
                <button key={x.id} type="button" className={'tile' + (on ? ' pick' : '')} aria-pressed={on} onClick={() => toggle(x.id)}>
                  {x.thumb ? <img src={x.thumb} alt="" /> : <span className="tile-written"><NoteIcon /></span>}
                  <span className={'tick' + (on ? '' : ' off')}>{on ? <CheckIcon /> : null}</span>
                  <div className={'tile-label' + (x.location ? '' : ' noplace')}>{cap(x.name) || 'No name yet'}
                    <span className="tile-sub">{h ? `in ${h.name}` : x.location || 'Not put away'}</span></div>
                </button>
              );
            })}
          </div>
        )}
        <div className="putin-foot">
          {/* One verb per button (09-27): what it does is the sentence above it. */}
          <div className="lc-say"><PinIcon /><span className="tx"><b>{picked.length ? `${picked.length} thing${picked.length === 1 ? '' : 's'}` : 'Tap each one that goes ' + (box ? 'in' : 'there')}</b><span className="soft">{box ? `into the ${(box.name || 'box').replace(/^(my|the)\s+/i, '')}` : `at ${d ? d.name : ''}`}</span></span></div>
          <button type="button" className="btn-primary" disabled={!picked.length} onClick={() => onDone(cands.filter((x) => picked.includes(x.id)))}>
            <CheckIcon /><span>{box ? 'Put in' : 'Put away'}</span>
          </button>
          <button type="button" className="btn-quiet" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
