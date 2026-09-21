import { useEffect, useState } from 'react';
import { ROLE_WORDS, ROLE_BLURB, createInvite, inviteText, cancelInvite, setGrantRole, removeGrant, firstName, wantNames, watchNames, possessive, logEvent } from '../lib/db.js';
import { currentUser, isAnonymous, signIn } from '../lib/auth.js';
import { getPrefs, savePrefs } from '../lib/prefs.js';
import { ChevronIcon, ChevronLeftIcon, PersonAddIcon, GoogleIcon, AppleIcon } from './Icons.jsx';
import Confirm from './Confirm.jsx';

// People (multi-user Phase 2, 2026-09-21 — MU1·2, MU1·3, MU1·4, MU1·8; PLAN §Phase 2).
//
// The owner's screen: who can see her things and at what role, the invitations still open,
// *Invite someone…*, and one switch. Empty, it is one consent sentence and the button — the
// app is complete with nobody invited (Linda). Roles carry dates (Dr Kim: roles are decisions).
// Words on screen: Can see · Can help · Only me. Never owner, editor, viewer, caregiver.
//
// Below the owner's list: the ReCalls shared WITH this person (Peter's side), each a row with
// Open · Leave, so a helper has one place to switch and one way to step out.
export const APPLE_SIGNIN = false; // console: Apple provider not enabled yet (2026-09-21); hide the button until it is

const shortDate = (ms) => (ms ? new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '');

export default function PeopleScreen({ people = [], invites = [], grants = [], whose, onBack, onToast, onOpenRecall, onLeft }) {
  const [inviting, setInviting] = useState(false);   // the invite sheet
  const [signing, setSigning] = useState(false);     // the sign-in sheet (MU1·8)
  const [person, setPerson] = useState(null);        // a grant row's sheet
  const [pending, setPending] = useState(null);      // an invitation row's sheet
  const [shared, setShared] = useState(null);        // a "shared with me" row's sheet
  const [confirm, setConfirm] = useState(null);      // { kind: 'remove'|'leave'|'cancel', ... }
  const [showAddedBy, setShowAddedBy] = useState(() => getPrefs().showAddedBy !== false);
  const [, bump] = useState(0);
  useEffect(() => { wantNames([...people.map((p) => p.grantee), ...grants.map((g) => g.grantor)]); return watchNames(() => bump((n) => n + 1)); }, [people, grants]);

  const nameOf = (uid) => firstName(uid) || 'Someone';
  const myName = firstName(currentUser() && currentUser().uid) || (currentUser() && currentUser().displayName) || '';

  async function send(role) {
    setInviting(false);
    if (isAnonymous()) { setSigning(true); return; } // MU1·8: sign in once, at the first Send a link…
    try {
      const inv = await createInvite(role);
      logEvent('invite_created', { role });
      const text = inviteText(role, inv.url, myName);
      await share(text, inv.url);
    } catch (e) {
      console.error('createInvite', e);
      onToast && onToast(String(e && e.message ? e.message : e).replace(/^.*?:\s*/, '') || 'Could not make the link');
    }
  }
  // The system share sheet where there is one; the clipboard where there is not (a laptop, the rig).
  async function share(text, url) {
    if (navigator.share) { try { await navigator.share({ text }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
    try { await navigator.clipboard.writeText(text); onToast && onToast('Link copied · paste it into a message'); }
    catch { onToast && onToast(`Link: ${url}`); }
  }

  return (
    <div className="screen settings people">
      <div className="thing-head"><div className="row1">
        <button type="button" className="chev" aria-label="Back" onClick={onBack}><ChevronLeftIcon /></button>
        <div className="name">People</div>
      </div></div>

      {people.length === 0 && invites.length === 0 && (
        <div className="card">
          <p className="sub" style={{ margin: 0 }}><b>Nobody else can see your things yet.</b><br />Anyone you invite will see the photos of your things and where they are — except things you mark <b>Only me</b>.</p>
        </div>
      )}
      {people.map((g) => (
        <button type="button" className="prow" key={g.id} onClick={() => setPerson(g)}>
          <span className="nm"><b>{nameOf(g.grantee)}</b><small>{ROLE_WORDS[g.role]} · {g.via ? 'joined by link' : 'since'} {shortDate(g.createdAt)}</small></span>
          <span className="chev"><ChevronIcon /></span>
        </button>
      ))}
      {invites.map((inv) => (
        <button type="button" className="prow pending" key={inv.code} onClick={() => setPending(inv)}>
          <span className="nm"><b>Invitation sent · {shortDate(inv.createdAt)}</b><small>{ROLE_WORDS[inv.role]} · not opened yet</small></span>
          <span className="chev"><ChevronIcon /></span>
        </button>
      ))}
      <button className="btn-secondary" onClick={() => setInviting(true)}><PersonAddIcon /> Invite someone…</button>

      {(people.length > 0 || invites.length > 0) && (
        <div className="card" style={{ marginTop: '0.75rem' }}>
          <div className="sw-row" style={{ borderTop: 'none' }}>
            <span className="lab">Show who added each photo</span>
            <button type="button" role="switch" aria-checked={showAddedBy} className={'sw' + (showAddedBy ? ' on' : '')} aria-label="Show who added each photo"
              onClick={() => { const v = !showAddedBy; setShowAddedBy(v); savePrefs({ ...getPrefs(), showAddedBy: v }); logEvent('show_added_by', { on: v }); }} />
          </div>
        </div>
      )}

      {grants.length > 0 && (
        <>
          <div className="group-title">Shared with me</div>
          {grants.map((g) => (
            <button type="button" className="prow" key={g.id} onClick={() => setShared(g)}>
              <span className="nm"><b>{possessive(nameOf(g.grantor))} ReCall</b><small>{ROLE_WORDS[g.role]}{whose === g.grantor ? ' · open now' : ''}</small></span>
              <span className="chev"><ChevronIcon /></span>
            </button>
          ))}
        </>
      )}

      {inviting && <InviteSheet onSend={send} onCancel={() => setInviting(false)} />}
      {signing && <SignInSheet onCancel={() => setSigning(false)} onPick={(kind) => { try { sessionStorage.setItem('recall-return-to', 'people'); } catch { /* */ } signIn(kind); }} />}

      {person && (
        <div className="sheet-back" onClick={() => setPerson(null)} role="presentation">
          <div className="sheet item-sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-title">{nameOf(person.grantee)}</div>
            <div className="rolepick">
              {['viewer', 'editor'].map((r) => (
                <button type="button" key={r} className={person.role === r ? 'on' : ''} aria-pressed={person.role === r}
                  onClick={async () => { if (person.role === r) return; await setGrantRole(person, r); logEvent('role_changed', { to: r }); onToast && onToast(`${nameOf(person.grantee)} · ${ROLE_WORDS[r]}`); setPerson(null); }}>
                  <b>{ROLE_WORDS[r]}</b><span>{ROLE_BLURB[r]}</span>
                </button>
              ))}
            </div>
            <button className="sheet-row amber" onClick={() => { setConfirm({ kind: 'remove', grant: person }); setPerson(null); }}>Remove {nameOf(person.grantee)}</button>
            <button className="btn-primary alt" onClick={() => setPerson(null)}>Cancel</button>
          </div>
        </div>
      )}
      {pending && (
        <div className="sheet-back" onClick={() => setPending(null)} role="presentation">
          <div className="sheet item-sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-title">Invitation sent · {shortDate(pending.createdAt)}</div>
            <p className="sheet-body">{ROLE_WORDS[pending.role]}. Not opened yet. It works until {shortDate(pending.expiresAt)}.</p>
            <button className="sheet-row" onClick={async () => { setPending(null); await share(inviteText(pending.role, joinUrlOf(pending.code), myName), joinUrlOf(pending.code)); }}>Send the link again</button>
            <button className="sheet-row amber" onClick={() => { setConfirm({ kind: 'cancel', invite: pending }); setPending(null); }}>Cancel the invitation</button>
            <button className="btn-primary alt" onClick={() => setPending(null)}>Close</button>
          </div>
        </div>
      )}
      {shared && (
        <div className="sheet-back" onClick={() => setShared(null)} role="presentation">
          <div className="sheet item-sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-title">{possessive(nameOf(shared.grantor))} ReCall</div>
            <p className="sheet-body">You {shared.role === 'editor' ? 'can help' : 'can see'}: {shared.role === 'editor' ? 'add photos, move things and fix names' : 'the photos of the things and where they are'}.</p>
            {whose !== shared.grantor && <button className="sheet-row" onClick={() => { setShared(null); onOpenRecall && onOpenRecall(shared.grantor); }}>Open it</button>}
            <button className="sheet-row amber" onClick={() => { setConfirm({ kind: 'leave', grant: shared }); setShared(null); }}>Leave {possessive(nameOf(shared.grantor))} ReCall</button>
            <button className="btn-primary alt" onClick={() => setShared(null)}>Cancel</button>
          </div>
        </div>
      )}
      {confirm && confirm.kind === 'remove' && (
        <Confirm title={`Remove ${nameOf(confirm.grant.grantee)}?`} body="They will no longer see your things. Nothing they added is removed." keepLabel="Keep them" actionLabel="Remove"
          onKeep={() => setConfirm(null)}
          onAction={async () => { const g = confirm.grant; setConfirm(null); await removeGrant(g); logEvent('person_removed', {}); onToast && onToast(`Removed · ${nameOf(g.grantee)}`); }} />
      )}
      {confirm && confirm.kind === 'leave' && (
        <Confirm title={`Leave ${possessive(nameOf(confirm.grant.grantor))} ReCall?`} body="You will no longer see their things. They can invite you again." keepLabel="Stay" actionLabel="Leave"
          onKeep={() => setConfirm(null)}
          onAction={async () => { const g = confirm.grant; setConfirm(null); await removeGrant(g); logEvent('recall_left', {}); onToast && onToast(`Left · ${possessive(nameOf(g.grantor))} ReCall`); onLeft && onLeft(g.grantor); }} />
      )}
      {confirm && confirm.kind === 'cancel' && (
        <Confirm title="Cancel this invitation?" body="The link will stop working." keepLabel="Keep it" actionLabel="Cancel invitation"
          onKeep={() => setConfirm(null)}
          onAction={async () => { const inv = confirm.invite; setConfirm(null); await cancelInvite(inv.code); logEvent('invite_cancelled', {}); onToast && onToast('Invitation cancelled'); }} />
      )}
    </div>
  );
}
function joinUrlOf(code) { return `${location.origin}${location.pathname}?j=${encodeURIComponent(code)}`; }

// MU1·4: pick a role (nothing preselected; Send is off until one is), the consent line again,
// then the system share sheet. No name typed — the link carries the invitation.
export function InviteSheet({ onSend, onCancel }) {
  const [role, setRole] = useState(null);
  return (
    <div className="sheet-back" onClick={onCancel} role="presentation">
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-title" id="sheet-title">Invite someone</div>
        <div className="rolepick">
          {['viewer', 'editor'].map((r) => (
            <button type="button" key={r} className={role === r ? 'on' : ''} aria-pressed={role === r} onClick={() => setRole(r)}>
              <b>{ROLE_WORDS[r]}</b><span>{ROLE_BLURB[r]}</span>
            </button>
          ))}
        </div>
        <p className="consent">They will see the photos of your things and where they are — except things you mark <b>Only me</b>.</p>
        <button className="btn-primary" disabled={!role} onClick={() => onSend(role)}>Send a link…</button>
        <button className="btn-primary alt" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// MU1·8: the upgrade moment — asked once, at her first Send a link…; one sentence, no
// password; Not now costs nothing (no link is made; nothing else changes).
export function SignInSheet({ onPick, onCancel, title = 'Sign in to share', body = 'So your things stay yours on any phone, sign in once. Everything you have logged stays.' }) {
  return (
    <div className="sheet-back" onClick={onCancel} role="presentation">
      <div className="sheet join-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-title" id="sheet-title">{title}</div>
        <p className="sheet-body">{body}</p>
        {APPLE_SIGNIN && <button className="btn-primary" onClick={() => onPick('apple')}><AppleIcon /> Continue with Apple</button>}
        <button className={'btn-primary' + (APPLE_SIGNIN ? ' alt' : '')} onClick={() => onPick('google')}><GoogleIcon /> Continue with Google</button>
        <button className="btn-quiet" style={{ width: '100%', marginTop: '0.5rem' }} onClick={onCancel}>Not now</button>
      </div>
    </div>
  );
}
