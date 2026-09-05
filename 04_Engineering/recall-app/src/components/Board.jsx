import { boardOrder, logEvent } from '../lib/db.js';
import { dayLine } from '../lib/format.js';
import Footer from './Footer.jsx';
import { CameraIcon, SearchIcon, GearIcon } from './Icons.jsx';

// Home — THE BOARD. Board decision 2026-09-05, Rules 1–3.
//
// One quiet day line. Her things as photos, in the order they were first photographed,
// never rearranged by the app. Two fixed buttons at the bottom, the same every time she
// opens it: Take a photo · Where is my…  Nothing else. Settings is a small control at
// the top, deliberately out of the thumb zone — it is opened once a month by a helper.
//
// The board never asks her anything. A thing with no name is a photo with no label.
export default function Board({ items, ready, onOpenThing, onPhoto, onAsk, onSettings }) {
  const things = boardOrder(items);

  return (
    <div className="screen with-footer">
      <div className="dayrow">
        <div className="dayline">{dayLine()}</div>
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
              onClick={() => {
                logEvent('lookup', { entryMode: 'tile', itemId: it.id, itemName: it.name || null,
                  answerAgeMin: Math.round((Date.now() - it.lastSeenAt) / 60000), matched: 1 });
                onOpenThing(it);
              }}>
              <img src={it.thumb} alt={it.name || ''} />
              {/* A thing saved without a place says so — a fact in the app's amber, not a
                  badge. Board decision 2026-09-05 (Ravi): the one cue a caregiver can scan
                  for that Margaret can also read without feeling tested. */}
              {(it.name || !it.location) && (
                <div className="tile-label">
                  {it.name}
                  {!it.location && <span className="tile-sub">no place yet</span>}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      <Footer>
        {/* The button IS the camera: a <label> around the file input, so the camera opens
            on this tap — a programmatic click after navigating does not count as a
            gesture on iOS. The photo card opens with the photo already taken. */}
        <label className={'btn-primary file' + (ready ? '' : ' disabled')}>
          <CameraIcon /> Take a photo
          <input type="file" accept="image/*" capture="environment" disabled={!ready}
            onChange={(e) => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) onPhoto(f); }} />
        </label>
        <button className="btn-primary alt" disabled={!ready} onClick={onAsk}><SearchIcon /> Where is my…</button>
      </Footer>
    </div>
  );
}
