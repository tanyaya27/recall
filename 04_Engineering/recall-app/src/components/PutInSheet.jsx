import { useState } from 'react';
import { contentsOf, wouldLoop, holderOf } from '../lib/graph.js';
import { CheckIcon, NoteIcon } from './Icons.jsx';

// Put things in a box (Ravi 09-25, P-B; kept as the fallback in ARCH 09-26 — "show the destination" comes
// later). From inside a box on Home: the things not put away come first, then everything else not
// already in here. Tap each one that goes in; one save for all of them, with Undo on the toast.
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export default function PutInSheet({ container, items = [], onDone, onCancel }) {
  const [picked, setPicked] = useState([]);
  const already = new Set(contentsOf(container).map((x) => x.id));
  const cands = items.filter((x) => !x.deleted && x.id !== container.id && !already.has(x.id) && !wouldLoop(x, container))
    .sort((a, b) => (!a.location === !b.location ? (b.lastSeenAt || 0) - (a.lastSeenAt || 0) : (!a.location ? -1 : 1)));
  const notPut = cands.filter((x) => !x.location).length;
  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const nm = (container.name || 'the box').replace(/^(my|the)\s+/i, '');
  return (
    <div className="sheet-back" onClick={onCancel} role="presentation">
      <div className="sheet putin-sheet" role="dialog" aria-modal="true" aria-labelledby="putin-title" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-title" id="putin-title">Put things in the {nm}</div>
        <div className="putin-sub">{notPut ? `${notPut} not put away yet, first · ` : ''}tap each one that goes in</div>
        {cands.length === 0 ? <p className="empty">Everything is already in here.</p> : (
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
          <button type="button" className="btn-primary" disabled={!picked.length} onClick={() => onDone(cands.filter((x) => picked.includes(x.id)))}>
            <CheckIcon /><span>{picked.length ? `Put ${picked.length} in the ${nm}` : 'Pick what goes in'}</span>
          </button>
          <button type="button" className="btn-quiet" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
