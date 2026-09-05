import { useEffect, useRef, useState } from 'react';
import { compressPhoto } from '../lib/img.js';
import { addItem, resnapItem, addCheck, knownLocations, logEvent } from '../lib/db.js';
import { weekdayName, timeOfDay } from '../lib/format.js';
import EditableText from './EditableText.jsx';
import PlaceChooser from './PlaceChooser.jsx';

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
  // What the model could and couldn't see. `guesses` are offered, never applied.
  const [seen, setSeen] = useState({ restingOn: '', placeGuesses: [], placeCertain: false, alternatives: [] });
  const [placeSkipped, setPlaceSkipped] = useState(false);
  const [subjectPicked, setSubjectPicked] = useState(false);
  const chips = knownLocations(items, 6);

  const title = routine ? routine.name
    : resnapOf ? `New photo of your ${resnapOf.name}`
    : hintName ? `Your ${hintName.toLowerCase()}` : 'Take a photo';

  async function onFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setStage('analyzing');
    setSubjectPicked(false); setPlaceSkipped(false);
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
      const tag = await engine.tagPhoto(p, {
        hintName: resnapOf ? resnapOf.name : hintName,
        knownPlaces: chips,
        catalog: items.map((it) => it.name).filter(Boolean),
        sensitivity: 'personal',
      });
      setSeen({
        restingOn: tag.restingOn || '',
        placeGuesses: tag.placeGuesses || [],
        placeCertain: !!tag.placeCertain,
        alternatives: resnapOf ? [] : (tag.alternatives || []),
      });
      setFields({
        name: resnapOf ? resnapOf.name : (tag.name || hintName || ''),
        // Only pre-fill the place when the model says the room is genuinely visible.
        // Otherwise it stays empty and gets asked — a wrong room is worse than no room.
        location: tag.placeCertain && tag.placeGuesses[0] ? tag.placeGuesses[0] : '',
        description: tag.description || '',
      });
      setAiFailed(false);
    } catch (err) {
      console.error(err);
      setAiFailed(true);
      setSeen({ restingOn: '', placeGuesses: [], placeCertain: false, alternatives: [] });
      setFields({ name: resnapOf ? resnapOf.name : (hintName || ''), location: '', description: '' });
    }
    setStage('confirm');
  }

  // Auto-save: if the person does nothing, it saves itself. Any edit cancels it.
  //
  // It does NOT fire while the place is still unanswered. An item saved with no place
  // (or worse, a guessed one) is an item she can't find, which is the whole job. When the
  // place is unknown the app waits and asks; "save it anyway" is an explicit choice.
  useEffect(() => {
    if (stage !== 'confirm' || edited) { setCountdown(0); return; }
    if (!routine && !fields.name) return; // nothing to save yet
    if (!routine && !fields.location && !placeSkipped) { setCountdown(0); return; }
    const t0 = Date.now();
    const iv = setInterval(() => setCountdown(Math.min(1, (Date.now() - t0) / AUTOSAVE_MS)), 100);
    const to = setTimeout(() => save('auto'), AUTOSAVE_MS);
    return () => { clearInterval(iv); clearTimeout(to); };
  }, [stage, edited, fields.location, placeSkipped]); // eslint-disable-line

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

    // A re-snap does NOT inherit the old place: the photo is new, so the old room may be
    // stale. If nobody said where it is now, the item is marked as needing a place rather
    // than quietly keeping yesterday's answer.
    if (resnapOf) {
      const location = fields.location;
      await resnapItem(resnapOf, { photo, thumb, location, by, restingOn: seen.restingOn });
      logEvent('capture', { initiatedBy: 'resnap', itemId: resnapOf.id, itemName: resnapOf.name, aiFailed, corrected: edited, savedBy: how, locationChanged: location !== resnapOf.location, placeSkipped });
      onDone({ kind: 'item', item: { ...resnapOf, photo, thumb, location, lastSeenAt: Date.now() } });
    } else {
      const name = fields.name || 'Something';
      const id = await addItem({ ...fields, name, photo, thumb, pinnedOrder, by, restingOn: seen.restingOn });
      logEvent('capture', {
        initiatedBy, itemId: id, itemName: name, aiFailed, corrected: edited, savedBy: how,
        usedChip: chips.includes(fields.location), placeSkipped,
        placeFromGuess: seen.placeGuesses.includes(fields.location), placeCertain: seen.placeCertain,
      });
      onDone({ kind: 'item', item: { id, ...fields, name, photo, thumb, pinnedOrder, lastSeenAt: Date.now() } });
    }
  }

  const setField = (k) => (v) => { setEdited(true); setFields((f) => ({ ...f, [k]: v })); };

  // Answering "where is it?" is not a correction — it is the expected interaction — so it
  // does NOT cancel auto-save. Tap the right place and it saves itself, which keeps the
  // "the photo is the mark, no done tap" rule intact for the common case.
  const setPlace = (v) => {
    setFields((f) => ({ ...f, location: v }));
    if (v) setPlaceSkipped(false);
  };
  // Same reasoning for "which of these did you mean?" — an answer, not a correction.
  const pickSubject = (n) => { setFields((f) => ({ ...f, name: n })); setSubjectPicked(true); };

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

          {/* A wide shot can hold several plausible subjects, and no photo says which one
              she cared about. When the model reports more than one, ask — in words, never
              by making her draw a box or hold a finger on a small object. One question on
              screen at a time: the subject, then the place. */}
          {seen.alternatives.length > 0 && !subjectPicked ? (
            <div className="ask-place">
              <div className="ask-q">What did you want to remember?</div>
              <div className="guesses">
                {[fields.name, ...seen.alternatives].filter(Boolean).map((n) => (
                  <button key={n} type="button" className="guess" onClick={() => pickSubject(n)}>{n}</button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <EditableText label="What it is" value={fields.name} emptyLabel="tap to name it" onSave={setField('name')} />
              <PlaceChooser value={fields.location} guesses={seen.placeGuesses} known={chips} onPick={setPlace} />

              <EditableText label="Note" value={fields.description} emptyLabel="tap to add a note" onSave={setField('description')} />

              <button
                className="btn-primary progress" style={{ '--p': countdown, marginTop: 16 }}
                disabled={stage === 'saving' || !fields.name || (!fields.location && !placeSkipped)}
                onClick={() => save('tap')}
              >
                <span>
                  {stage === 'saving' ? 'Saving…'
                    : `Save${fields.name ? ` — ${fields.name.toLowerCase()}` : ''}${fields.location ? ` ${fields.location}` : ''}`}
                </span>
              </button>
            </>
          )}

          {/* The deliberate escape: naming a place you haven't decided yet is worse than
              saying so. Only shown while the place is still blank. */}
          {!fields.location && !(seen.alternatives.length > 0 && !subjectPicked) && (
            placeSkipped ? (
              <p className="note-quiet">Saving without a place — you can add one later.</p>
            ) : (
              <button type="button" className="link-btn" style={{ display: 'block', margin: '10px auto 0' }}
                onClick={() => { setPlaceSkipped(true); setEdited(false); }}>
                I don't know where it goes yet — save it anyway
              </button>
            )
          )}
        </div>
      )}

      <button className="btn-back" onClick={onCancel}>Back</button>
    </div>
  );
}
