import Header from './Header.jsx';
import { PinIcon, PencilIcon, CheckIcon, NoteIcon, LockIcon } from './Icons.jsx';
import { isPrivate } from '../lib/db.js';

// After a "Several" run of two or more things (MVP step 2; drawn as C1 option 1, frame f).
// Everything is already saved. The person fixes only what's wrong: tap a thing to open its
// card (Edit renames it or moves it). Things still without a place are marked, not demanded.
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export default function SessionReview({ things = [], items = [], onOpen, onFinish }) {
  const rows = things.map((t) => items.find((it) => it.id === t.id) || null).filter(Boolean);
  const placesUsed = [...new Set(rows.map((r) => r.location).filter(Boolean))];
  const unplaced = rows.filter((r) => !r.location).length;
  return (
    <div className="screen with-footer review">
      <Header title={`${rows.length} thing${rows.length === 1 ? '' : 's'} saved`} onBack={onFinish} />
      <div className="rv-sub"><PinIcon /> {placesUsed.length ? placesUsed.join(' · ') : 'No place yet'} · just now</div>
      <div className="rv">
        {rows.map((it) => (
          <button key={it.id} type="button" className="rv-cell" onClick={() => onOpen(it)}>
            {it.thumb ? <img src={it.thumb} alt="" /> : <span className="tile-written"><NoteIcon /></span>}
            <b className={it.location ? '' : 'fix'}>{cap(it.name) || 'No name yet'}{isPrivate(it) && <span className="rv-lock" aria-label="Only me"><LockIcon /></span>}<PencilIcon /></b>
          </button>
        ))}
      </div>
      <p className="rv-note">All saved. Tap a thing only if its name{unplaced ? ' or place' : ''} is wrong{unplaced ? `; ${unplaced} still ${unplaced === 1 ? 'has' : 'have'} no place` : ''}.</p>
      <div className="footer"><div className="footer-inner"><button className="btn-primary" onClick={onFinish}><CheckIcon /><span className="lbl">Finished</span></button></div></div>
    </div>
  );
}
