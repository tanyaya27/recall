import { boardOrder, logEvent } from '../lib/db.js';
import { useHold } from '../lib/hold.js';
import { dayLine, cap } from '../lib/format.js';
import Footer from './Footer.jsx';
import { CameraIcon, SearchIcon, GearIcon, MenuIcon } from './Icons.jsx';

// Home — THE BOARD. Board decision 2026-09-05, Rules 1–3.
//
// One quiet day line. Her things as photos, in the order they were first photographed,
// never rearranged by the app. Two fixed buttons at the bottom, the same every time she
// opens it: Log item · Find item (Ravi, 2026-09-14; were Take a photo · Where is my…).
// Nothing else. Settings is a small control at
// the top, deliberately out of the thumb zone — it is opened once a month by a helper.
//
// The board never asks her anything. A thing with no name is a photo with no label.
export default function Board({ items, ready, onOpenThing, onPhoto, onAsk, onSettings, onMenu, onHold }) {
  const things = boardOrder(items);
  // Press-and-hold on a tile (Ravi, round 3): opens the item's action sheet; a short tap
  // still opens the thing. Robert's shortcut; every action is also on the thing card.
  const hold = useHold((it) => { logEvent('tile_hold', { itemId: it.id }); onHold && onHold(it); });

  return (
    <div className="screen with-footer">
      <div className="dayrow">
        {/* Hamburger (Ravi, round 4, overruling the 09-05 board): the household's menu. */}
        <button className="menu-btn" aria-label="Menu" onClick={onMenu}><MenuIcon /></button>
        <div className="dayline">{(() => { const d = dayLine(); return <><span className="day">{d.day}</span><span className="date">{d.date}</span></>; })()}</div>
        <button className="tiny" onClick={onSettings}><GearIcon /> Settings</button>
      </div>

      {!ready && (
        <div className="card setup">
          <p>One-time setup — this phone needs its AI key.</p>
          <button className="btn-primary" onClick={onSettings}>Set up</button>
        </div>
      )}

      {ready && things.length === 0 && (
        <div className="card">
          <p className="empty">Photograph something you often look for — glasses, keys, wallet, anything.</p>
        </div>
      )}

      {things.length > 0 && (
        <div className="board">
          {things.map((it) => (
            <button key={it.id} className="tile"
              {...hold.props(it)}
              onClick={hold.tap(() => {
                logEvent('lookup', { entryMode: 'tile', itemId: it.id, itemName: it.name || null,
                  answerAgeMin: Math.round((Date.now() - it.lastSeenAt) / 60000), matched: 1 });
                onOpenThing(it);
              })}>
              <img src={it.thumb} alt={it.name || ''} />
              {/* A thing saved without a place says so — a fact in the app's amber, not a
                  badge. Board decision 2026-09-05 (Ravi): the one cue a caregiver can scan
                  for that Margaret can also read without feeling tested. */}
              {(it.name || !it.location) && (
                <div className="tile-label">
                  {cap(it.name)}
                  {!it.location && <span className="tile-sub">no place yet</span>}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      <Footer>
        {/* Opens the in-app camera (Camera.jsx) — several shots, ✕ each, Cancel. */}
        <button className="btn-primary" disabled={!ready} onClick={onPhoto} aria-label="Log item"><CameraIcon /><span className="lbl">Log item</span></button>
        <button className="btn-primary alt" disabled={!ready} onClick={onAsk} aria-label="Find item"><SearchIcon /><span className="lbl">Find item</span></button>
      </Footer>
    </div>
  );
}
