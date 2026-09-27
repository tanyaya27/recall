import { useState } from 'react';
import { graph, containers, contentsOf, wouldLoop, thingMatches } from '../lib/graph.js';
import { NoteIcon, BoxIcon, SearchIcon } from './Icons.jsx';

// "In something…" (09-27, Ravi: "the item in place in place is not working"). Choosing a place used to
// offer place names only, so putting the key IN the tin meant typing the tin's exact name. Now any thing
// can be picked as the place, by its photo: the boxes already in use first, then everything, with a
// search. Picking one links to that thing (an edge), never to a look-alike name.
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export default function InThingSheet({ item = null, onPick, onCancel }) {
  const [q, setQ] = useState('');
  const g = graph();
  const ok = (x) => !x.deleted && x.name && (!item || (x.id !== item.id && !wouldLoop(item, x, g)));
  const boxes = containers(g, 12).filter(ok);
  const list = q.trim() ? thingMatches(q, item, g, 24) : [...boxes, ...g.items.filter((x) => ok(x) && !boxes.includes(x)).sort((a, b) => (b.lastSeenAt || 0) - (a.lastSeenAt || 0))].slice(0, 24);
  return (
    <div className="sheet-back" onClick={onCancel} role="presentation">
      <div className="sheet putin-sheet" role="dialog" aria-modal="true" aria-labelledby="it-title" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-title" id="it-title">What is it in?</div>
        <div className="it-search"><SearchIcon /><input value={q} placeholder="blue tin, memorabilia box…" onChange={(e) => setQ(e.target.value)} aria-label="Find the thing it is in" /></div>
        {list.length === 0 ? <p className="empty">{q.trim() ? 'Nothing logged by that name yet.' : 'Nothing logged yet.'}</p> : (
          <div className="board putin-grid">
            {list.map((x) => {
              const n = contentsOf(x, g).length;
              return (
                <button key={x.id} type="button" className="tile" onClick={() => onPick(x)}>
                  {x.thumb ? <img src={x.thumb} alt="" /> : <span className="tile-written"><NoteIcon /></span>}
                  {n > 0 && <span className="inbadge"><BoxIcon /> {n} inside</span>}
                  <div className="tile-label">{cap(x.name)}<span className="tile-sub">{x.location || 'No place yet'}</span></div>
                </button>
              );
            })}
          </div>
        )}
        <div className="putin-foot"><button type="button" className="btn-quiet" onClick={onCancel}>Cancel</button></div>
      </div>
    </div>
  );
}
