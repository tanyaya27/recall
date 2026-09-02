import { useEffect, useRef, useState } from 'react';
import { compressPhoto } from '../lib/img.js';
import { addItem, resnapItem, addCheck, knownLocations, logEvent } from '../lib/db.js';
import { weekdayName, timeOfDay } from '../lib/format.js';
import EditableText from './EditableText.jsx';

const AUTOSAVE_MS = 4000;

// Two capture modes, one gesture.
//   Self-initiated (no `routine`): generic. AI names whatever it sees. Location chips.
//   App-initiated (`routine` set): the app asked, so it says what it needs, and it
//   verifies before it claims anything. One calm retake request, then accept as-is.
export default function CaptureFlow({
  engine, items = [], hintName = '', pinnedOrder = null, resnapOf = null, routine = null,
  initiatedBy = 'self', onDone, onCancel,
}) {
  const fileRef = useRef(null);
  const [stage, setStage] = useState('pick'); // pick | analyzing | confirm | retake | saving
  const [photo, setPhoto] = useState(null);
  const [thumb, setThumb] = useState(null);
  const [fields, setFields] = useState({ name: hintName, location: '', description: '' });
  const [aiFailed, setAiFailed] = useState(false);
  const [claim, setClaim] = useState(null);
  const [retakes, setRetakes] = useState(0);
  const [edited, setEdited] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const chips = knownLocations(items);

  const title = routine ? routine.name
    : resnapOf ? `New photo of your ${resnapOf.name}`
    : hintName ? `Your ${hintName.toLowerCase()}` : 'Take a photo';

  async function onFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setStage('analyzing');
    const { photo: p, thumb: t } = await compressPhoto(file);
    setPhoto(p); setThumb(t);
    e.target.value = '';

    if (routine) {
      try {
        const v = await engine.verifyRoutinePhoto(p, routine, { weekday: weekdayName(), timeOfDay: timeOfDay(), sensitivity: 'personal' });
        setClaim(v);
        if (!v.visible && retakes === 0) { setStage('retake'); return; }
      } catch (err) {
        console.error(err);
        setClaim({ visible: false, state: 'unknown', text: '' });
      }
      setStage('confirm');
      return;
    }

    try {
      const tag = await engine.tagPhoto(p, { hintName: resnapOf ? resnapOf.name : hintName, sensitivity: 'personal' });
      setFields({
        name: resnapOf ? resnapOf.name : (tag.name || hintName || ''),
        location: tag.location || '',
        description: tag.description || '',
      });
      setAiFailed(false);
    } catch (err) {
      console.error(err);
      setAiFailed(true);
      setFields({ name: resnapOf ? resnapOf.name : (hintName || ''), location: '', description: '' });
    }
    setStage('confirm');
  }

  // Auto-save: if the person does nothing, it saves itself. Any edit cancels it.
  useEffect(() => {
    if (stage !== 'confirm' || edited) { setCountdown(0); return; }
    if (!routine && !fields.name) return; // nothing to save yet
    const t0 = Date.now();
    const iv = setInterval(() => setCountdown(Math.min(1, (Date.now() - t0) / AUTOSAVE_MS)), 100);
    const to = setTimeout(() => save('auto'), AUTOSAVE_MS);
    return () => { clearInterval(iv); clearTimeout(to); };
  }, [stage, edited]); // eslint-disable-line

  async function save(how = 'tap') {
    if (stage === 'saving') return;
    setStage('saving');
    const by = 'self';

    if (routine) {
      const c = claim || { visible: false, state: 'unknown', text: '' };
      const id = await addCheck({ routineId: routine.id, photo, thumb, claim: c, retakes, by });
      logEvent('prompt_capture', { routineId: routine.id, routineType: routine.type, claimState: c.state, visible: c.visible, retakes, savedBy: how });
      // One photo, both questions: a medication check also refreshes the medication item.
      if (routine.type === 'medication') {
        const med = items.find((it) => /pill|medic/i.test(it.name));
        if (med) await resnapItem(med, { photo, thumb, location: med.location, by });
      }
      onDone({ kind: 'check', id, routine, check: { id, routineId: routine.id, photo, thumb, claim: c, at: Date.now() } });
      return;
    }

    if (resnapOf) {
      const location = fields.location || resnapOf.location;
      await resnapItem(resnapOf, { photo, thumb, location, by });
      logEvent('capture', { initiatedBy: 'resnap', itemId: resnapOf.id, itemName: resnapOf.name, aiFailed, corrected: edited, savedBy: how, locationChanged: location !== resnapOf.location });
      onDone({ kind: 'item', item: { ...resnapOf, photo, thumb, location, lastSeenAt: Date.now() } });
    } else {
      const name = fields.name || 'Something';
      const id = await addItem({ ...fields, name, photo, thumb, pinnedOrder, by });
      logEvent('capture', { initiatedBy, itemId: id, itemName: name, aiFailed, corrected: edited, savedBy: how, usedChip: chips.includes(fields.location) });
      onDone({ kind: 'item', item: { id, ...fields, name, photo, thumb, pinnedOrder, lastSeenAt: Date.now() } });
    }
  }

  const setField = (k) => (v) => { setEdited(true); setFields((f) => ({ ...f, [k]: v })); };

  return (
    <div>
      <h2>{title}</h2>
      {routine && stage === 'pick' && <p className="sub instruction">{routine.instruction}</p>}
      {!routine && stage === 'pick' && <p className="sub">Point the camera so the thing and its spot are both easy to see.</p>}

      {stage === 'pick' && (
        <button className="btn-primary" onClick={() => fileRef.current.click()}>📷 Take the photo</button>
      )}
      <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={onFile} />

      {stage === 'analyzing' && (
        <div className="card">
          <img className="photo-full" src={photo} alt="" />
          <div className="skeleton" /><div className="skeleton short" />
        </div>
      )}

      {stage === 'retake' && (
        <div className="card">
          <img className="photo-full" src={photo} alt="" />
          <p className="sub" style={{ marginTop: 12 }}>{claim?.text || `Could you ${routine.instruction.charAt(0).toLowerCase()}${routine.instruction.slice(1)}`}</p>
          <button className="btn-primary" onClick={() => { setRetakes(1); logEvent('prompt_retake', { routineId: routine.id }); fileRef.current.click(); }}>📷 Take it again</button>
          <button className="btn-secondary" onClick={() => setStage('confirm')}>Keep this one</button>
        </div>
      )}

      {(stage === 'confirm' || stage === 'saving') && routine && (
        <div className="card">
          <img className="photo-full" src={photo} alt="" />
          <div className="claim">{claim?.visible && claim.state !== 'unknown' ? claim.text : 'Photographed. I’ll keep this one.'}</div>
          <button className="btn-primary progress" style={{ '--p': countdown }} disabled={stage === 'saving'} onClick={() => save('tap')}>
            <span>{stage === 'saving' ? 'Saving…' : 'Done'}</span>
          </button>
        </div>
      )}

      {(stage === 'confirm' || stage === 'saving') && !routine && (
        <div className="card">
          <img className="photo-full" src={photo} alt={fields.name} />
          <EditableText label="What it is" value={fields.name} emptyLabel="tap to name it" onSave={setField('name')} />
          <EditableText label="Where it is" value={fields.location} big emptyLabel="tap to say where" onSave={setField('location')} />
          {chips.length > 0 && (
            <div className="chips">
              {chips.map((c) => (
                <button key={c} type="button" className={'chip' + (c === fields.location ? ' on' : '')} onClick={() => setField('location')(c)}>{c}</button>
              ))}
            </div>
          )}
          <EditableText label="Note" value={fields.description} emptyLabel="tap to add a note" onSave={setField('description')} />
          <button className="btn-primary progress" style={{ '--p': countdown, marginTop: 16 }} disabled={stage === 'saving' || !fields.name} onClick={() => save('tap')}>
            <span>{stage === 'saving' ? 'Saving…' : `Save${fields.name ? ` — ${fields.name.toLowerCase()}` : ''}${fields.location ? ` ${fields.location}` : ''}`}</span>
          </button>
        </div>
      )}

      <button className="btn-back" onClick={onCancel}>Back</button>
    </div>
  );
}
