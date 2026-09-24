import { boardOrder, logEvent, isPrivate, firstName, possessive, ROLE_WORDS } from '../lib/db.js';
import { useHold } from '../lib/hold.js';
import { me } from '../lib/auth.js';
import { dayLine, cap } from '../lib/format.js';
import Footer from './Footer.jsx';
import { CameraIcon, SearchIcon, GearIcon, MenuIcon, LockIcon, SwitchIcon, NoteIcon } from './Icons.jsx';

// Home — THE BOARD. Board decision 2026-09-05, Rules 1–3.
//
// One quiet day line. Her things as photos, in the order they were first photographed,
// never rearranged by the app. Two fixed buttons at the bottom, the same every time she
// opens it: Log item · Find item (Ravi, 2026-09-14; were Take a photo · Where is my…).
// Nothing else. Settings is a small control at
// the top, deliberately out of the thumb zone — it is opened once a month by a helper.
//
// The board never asks her anything. A thing with no name is a photo with no label.
//
// Multi-user Phase 2 (2026-09-21 — MU1·6, MU1·7, MU2·7, MU2·8): the same board can show
// someone ELSE's ReCall. Then the day line becomes their name — "Margaret's ReCall ▾" — with
// the role under it; the footer follows the role (Can see: Find item alone; Can help: Log
// item says *in Margaret's ReCall* on the button); a thing that is not the owner's carries
// its owner's name under the label. Her own grid does not change until she invites someone.
export default function Board({ items, ready, whose = null, role = 'owner', removed = false, onOpenThing, onPhoto, onPhotoHold = null, onAsk, onSettings, onMenu, onHold, onSwitch, onStartOwn }) {
  const things = boardOrder(items);
  // Press-and-hold on a tile (Ravi, round 3): opens the item's action sheet; a short tap
  // still opens the thing. Robert's shortcut; every action is also on the thing card.
  const hold = useHold((it) => { logEvent('tile_hold', { itemId: it.id }); onHold && onHold(it); });
  // Hold Log item → choose how to take photos this time (capture modes, 09-24). Only when there is a choice.
  const logHold = useHold(() => { if (onPhotoHold) { logEvent('log_hold', {}); onPhotoHold(); } });
  const guest = !!whose;
  const ownerName = guest ? (firstName(whose) || 'Their') : '';
  const canLog = !guest || role === 'editor';

  return (
    <div className="screen with-footer">
      <div className="dayrow">
        {/* Hamburger (Ravi, round 4, overruling the 09-05 board): the household's menu. */}
        <button className="menu-btn" aria-label="Menu" onClick={onMenu}><MenuIcon /></button>
        {guest ? (
          <button type="button" className="dayline owner" onClick={onSwitch} aria-label={`${possessive(ownerName)} ReCall. Switch`}>
            <span className="title-owner">{possessive(ownerName)} ReCall <SwitchIcon /></span>
            <span className="status8">{removed ? '' : ROLE_WORDS[role] || ''}</span>
          </button>
        ) : (
          <button type="button" className="dayline" onClick={onSwitch} aria-label="My ReCall. Switch">{(() => { const d = dayLine(); return <><span className="day">{d.day}</span><span className="date">{d.date}</span></>; })()}</button>
        )}
        <button className="tiny" onClick={onSettings}><GearIcon /> Settings</button>
      </div>

      {removed && (
        <div className="card">
          <p className="sub" style={{ margin: '0 0 0.75rem', fontSize: '1.125rem' }}>{possessive(ownerName)} ReCall is no longer shared with you.</p>
          <button className="btn-primary" onClick={onStartOwn}><CameraIcon /> Start my own ReCall</button>
        </div>
      )}

      {!removed && !ready && !guest && (
        <div className="card setup">
          <p>One-time setup — this phone needs its AI key.</p>
          <button className="btn-primary" onClick={onSettings}>Set up</button>
        </div>
      )}

      {!removed && (ready || guest) && things.length === 0 && (
        <div className="card">
          {guest ? <p className="empty">{`${ownerName} has not logged anything yet.`}</p> : (
            // First run, option C (Tanya 09-24): what to do, then how to get it back — no key, no setup card.
            <p className="empty first-run"><b>Take a photo of where you put something.</b>Later, tap <b>Find item</b> and ask for it.</p>
          )}
        </div>
      )}

      {!removed && things.length > 0 && (
        <div className="board">
          {things.map((it) => {
            const other = !!it.owner && it.owner !== (whose || me()); // a thing shared into this grid one by one, or given
            const tag = other ? possessive(firstName(it.owner) || 'Someone') : '';
            return (
              <button key={it.id} className="tile"
                {...hold.props(it)}
                onClick={hold.tap(() => {
                  logEvent('lookup', { entryMode: 'tile', itemId: it.id, itemName: it.name || null,
                    answerAgeMin: Math.round((Date.now() - it.lastSeenAt) / 60000), matched: 1 });
                  onOpenThing(it, !it.location && canLog); // no place yet → open with the place field ready (round 7)
                })}>
                {it.thumb ? <img src={it.thumb} alt={it.name || ''} /> : <span className="tile-written" aria-label="Written down, no photo"><NoteIcon /></span>}
                {isPrivate(it) && <span className="tile-lock" aria-label="Private"><LockIcon /></span>}
                {/* No place: the label block flips to reverse colours and says so (Ravi 09-16 —
                    the corner pin badge of 09-15 was "pure crap"). Words plus the flipped block,
                    so it reads without colour; the lock watermark is unaffected. */}
                {(it.name || !it.location || tag) && (
                  <div className={'tile-label' + (it.location ? '' : ' noplace')}>
                    {cap(it.name)}
                    {!it.location && <span className="tile-sub">No place assigned</span>}
                    {tag && it.location && <span className="tile-owner">{tag}</span>}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {!removed && (
        <Footer>
          {/* Opens the in-app camera (Camera.jsx) — several shots, ✕ each, Cancel. */}
          {canLog && (
            <button className={'btn-primary' + (guest ? ' whose' : '')} disabled={!ready} {...(onPhotoHold ? logHold.props() : {})} onClick={logHold.tap(onPhoto)} aria-label={guest ? `Log item in ${possessive(ownerName)} ReCall` : 'Log item'}>
              <CameraIcon /><span className="lbl">Log item</span>
              {guest && <small className="whose-sub">in {possessive(ownerName)} ReCall</small>}
            </button>
          )}
          <button className="btn-primary alt" disabled={!ready} onClick={onAsk} aria-label="Find item"><SearchIcon /><span className="lbl">Find item</span></button>
        </Footer>
      )}
    </div>
  );
}
