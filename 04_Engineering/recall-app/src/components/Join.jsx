import { useEffect, useState } from 'react';
import { readInvite, acceptInvite, firstName, wantNames, watchNames, possessive, logEvent } from '../lib/db.js';
import { isAnonymous, signIn } from '../lib/auth.js';
import { GoogleIcon, AppleIcon } from './Icons.jsx';
import { APPLE_SIGNIN } from './People.jsx';

// The page an invitation link opens (multi-user Phase 2 — MU1·5). Peter's first minute:
// tap 1 the link, tap 2 a provider, tap 3 none — he lands on her grid. The code came in on
// the URL (?j=…) and was parked in localStorage by App.jsx so it survives the sign-in
// redirect; this screen reads the invitation for the inviter's name and the role, then
// either asks for a provider (anonymous) or accepts at once (already signed in).
export const JOIN_KEY = 'recall-join';
export function pendingJoin() { try { return JSON.parse(localStorage.getItem(JOIN_KEY) || 'null'); } catch { return null; } }
export function parkJoin(code) { try { localStorage.setItem(JOIN_KEY, JSON.stringify({ code, at: Date.now() })); } catch { /* */ } }
export function clearJoin() { try { localStorage.removeItem(JOIN_KEY); } catch { /* */ } }

export default function JoinScreen({ code, onJoined, onDismiss }) {
  const [inv, setInv] = useState(undefined); // undefined = loading · null = gone · {…}
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [, bump] = useState(0);
  useEffect(() => { let on = true; readInvite(code).then((i) => { if (on) setInv(i); }, () => { if (on) setInv(null); }); return () => { on = false; }; }, [code]);
  useEffect(() => { if (inv && inv.from) wantNames([inv.from]); return watchNames(() => bump((n) => n + 1)); }, [inv]);
  const who = inv && inv.from ? firstName(inv.from) : '';
  const named = !isAnonymous();

  async function accept() {
    setBusy(true); setError('');
    try {
      const r = await acceptInvite(code);
      clearJoin();
      logEvent('invite_accepted', { role: r.role, item: !!r.itemId });
      onJoined(r, who);
    } catch (e) {
      const msg = String(e && e.message ? e.message : e);
      setError(/expired|not-found|own invitation/i.test(msg) ? (/own/i.test(msg) ? 'That is your own invitation.' : 'This invitation has expired.') : 'Could not join right now. Try again in a moment.');
      setBusy(false);
    }
  }
  // Already signed in with a provider: no button to press (tap 3 is none).
  useEffect(() => { if (inv && !inv.expired && named && !busy && !error) accept(); }, [inv, named]); // eslint-disable-line

  if (inv === undefined) return <div className="screen"><div className="card join"><p>Opening the invitation…</p></div></div>;
  if (inv === null || inv.expired || error === 'This invitation has expired.') {
    return (
      <div className="screen">
        <div className="card join">
          <h1>This invitation has expired.</h1>
          <p>Ask {who || 'them'} to send a new link — each one works for 7 days and once.</p>
          <button className="btn-primary alt" onClick={() => { clearJoin(); onDismiss(); }}>OK</button>
        </div>
      </div>
    );
  }
  const verb = inv.role === 'editor' ? 'help with' : 'see';
  return (
    <div className="screen">
      <div className="card join">
        <h1>{who ? `${possessive(who)} ReCall` : 'An invitation'}</h1>
        <p>{who || 'Someone'} has shared the photos of where {who ? 'their' : 'the'} things are, so you can {verb} them.<br />{named ? 'Joining…' : `Sign in so ${who || 'they'} know${who ? 's' : ''} it’s you.`}</p>
        {error && <div className="banner amber">{error}</div>}
        {!named && APPLE_SIGNIN && <button className="btn-primary" disabled={busy} onClick={() => { parkJoin(code); signIn('apple'); }}><AppleIcon /> Continue with Apple</button>}
        {!named && <button className={'btn-primary' + (APPLE_SIGNIN ? ' alt' : '')} disabled={busy} onClick={() => { parkJoin(code); signIn('google'); }}><GoogleIcon /> Continue with Google</button>}
        {named && error && <button className="btn-primary" disabled={busy} onClick={accept}>Try again</button>}
        <button className="btn-quiet" style={{ width: '100%', marginTop: '0.5rem' }} disabled={busy} onClick={() => { clearJoin(); onDismiss(); }}>Not now</button>
      </div>
    </div>
  );
}
