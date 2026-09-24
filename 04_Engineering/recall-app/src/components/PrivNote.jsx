import { useState } from 'react';
import { LockIcon, PhoneIcon } from './Icons.jsx';
import { possessive, logEvent } from '../lib/db.js';

// Private by default — the notice (Ravi, DECISIONS 2026-09-24; drawn S3_private.jpg).
// Told on the same screen as the photo, never a pop-up, nothing she has to answer:
//   typed secret  — "ReCall remembers where things are": Save is blocked until it's taken out
//   secret photo  — the photo is not kept (a password or number can be read in it); words only
//   private       — "Kept private: this looks like passwords. Only you will see it." · Share it instead
//   helper        — only the owner can keep things private: a warning and "Don't save it"
// Under the owner's note, "On this phone only" is shown greyed; tapping it says "Coming soon"
// (Ravi 09-24: that waits for the native app).
export function PhoneOnly({ where, inline = false }) {
  const [soon, setSoon] = useState(false);
  const tap = () => { setSoon(true); logEvent('phone_only_tap', { where }); };
  if (inline) {
    return <button type="button" className="phone-only inline" aria-disabled="true" onClick={tap}>{soon ? 'On this phone only: coming soon' : 'On this phone only'}</button>;
  }
  return (
    <button type="button" className="phone-only" aria-disabled="true" onClick={tap}>
      <PhoneIcon /><span>On this phone only</span>{soon && <em>Coming soon</em>}
    </button>
  );
}

export default function PrivNote({ v, mine, ownerName = '', typedSecret = false, isNew = true, shared = false, onShare, onRetake, onDontSave }) {
  if (typedSecret) {
    return (
      <div className="privnote stop" role="status">
        <LockIcon /><span><b>ReCall remembers where things are.</b>Take the PIN or password itself out, then save.</span>
      </div>
    );
  }
  if (!v || (!v.private && !v.secret)) return null;
  const who = ownerName || 'the owner';
  if (v.secret) {
    return (
      <div className="privnote stop" role="status">
        <LockIcon /><span><b>This photo won't be kept.</b>A password or number can be read in it, so {isNew ? `it's saved as words only${mine ? ', and private' : ''}` : 'only the place is saved'}.{' '}
          {onRetake && <button type="button" className="pn-link" onClick={onRetake}>Take it closed</button>}</span>
      </div>
    );
  }
  if (!isNew) return null; // a new photo of a thing already saved keeps that thing's setting
  if (!mine) {
    return (
      <div className="privnote helper" role="status">
        <LockIcon /><span><b>This looks private.</b>Only {who} can keep things private. If you save it, everyone in {possessive(who)} ReCall sees it.{' '}
          <button type="button" className="pn-link" onClick={onDontSave}>Don’t save it</button></span>
      </div>
    );
  }
  return (
    <div className={'privnote' + (shared ? ' shared' : '')} role="status">
      <LockIcon />
      {/* Compact (three lines at Default) so Next item / Done stay above the fold. */}
      <span>
        {shared
          ? <><b className="inl">Shared.</b> Everyone in your ReCall can see it. <button type="button" className="pn-link" onClick={() => onShare(false)}>Keep it private</button></>
          : <><b className="inl">Kept private:</b> this {v.why}. Only you will see it. <button type="button" className="pn-link" onClick={() => onShare(true)}>Share it instead</button>
              <span className="pn-dot"> · </span><PhoneOnly where="photo" inline /></>}
      </span>
    </div>
  );
}
