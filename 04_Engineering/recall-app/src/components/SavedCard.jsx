import { useEffect } from 'react';
import { PinIcon, LockIcon } from './Icons.jsx';

// After Save (ruled 09-27): Home shows what was just saved — the thing and where it went, as the chain of
// photos — with Undo. Replaces "Saved · Kitchen counter" (walk issue 7: the thing itself was nowhere on
// screen; issue 14: the chain was never shown back). Stays 8 seconds; Undo only for the owner.
export default function SavedCard({ card, onUndo, onDone, onShare, onRenameLink }) {
  useEffect(() => {
    if (!card) return;
    const t = setTimeout(onDone, card.undo ? 8000 : 5000);
    return () => clearTimeout(t);
  }, [card && card.key]); // eslint-disable-line -- the same card re-rendered (a late name, a late verdict) keeps its timer
  if (!card) return null;
  return (
    <div className="saved-card" role="status" aria-live="polite">
      {card.undo && <button type="button" className="u" onClick={() => { onUndo(card.undo); onDone(); }}>Undo</button>}
      <div className="trail">
        {card.thumbs.map((t, i) => (
          <span key={i} style={{ display: 'contents' }}>
            {i > 0 && <span className="in">in</span>}
            {t ? <img src={t} alt="" /> : <span className="ph"><PinIcon /></span>}
          </span>))}
      </div>
      <div className="s">{card.name}{card.lock ? <> · <LockIcon /> only you</> : null}
        <small>{card.none ? 'No place yet · put it away later' : [card.l1, card.l2].filter(Boolean).join(' · ')}</small>
        {(card.moving || []).map((m) => <small key={m} className="sc-move">{m}</small>)/* Q3: a place or box that moved with this save */}
        {card.priv && <small className="sc-priv">Kept private · {card.priv} · <button type="button" className="sc-share" onClick={() => onShare && onShare(card)}>Share it</button></small>}
        {card.shared && <small className="sc-priv">Shared · everyone in your ReCall sees it</small>}
        {/* REQUIREMENTS_2026-09-27 R3.3: a where-link saved with a placeholder name — never blocks the
            save, just offers to fix it right here, on the doc that was just made. */}
        {card.unnamed && card.unnamed.map((u, i) => (
          <button key={u.id + i} type="button" className="sc-unnamed" onClick={() => onRenameLink && onRenameLink(u)}>Unnamed — tap to name</button>
        ))}</div>
    </div>
  );
}
