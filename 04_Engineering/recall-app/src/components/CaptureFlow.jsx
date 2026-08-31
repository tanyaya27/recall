import { useRef, useState } from 'react';
import { compressPhoto } from '../lib/img.js';
import { addItem, resnapItem, logEvent } from '../lib/db.js';
import EditableText from './EditableText.jsx';

// UC-2 capture, UC-3 correct-at-confirm, UC-7 re-snap (when resnapOf is set)
export default function CaptureFlow({ engine, hintName = '', pinned = false, resnapOf = null, onDone, onCancel }) {
  const fileRef = useRef(null);
  const [stage, setStage] = useState('pick'); // pick | analyzing | confirm | saving
  const [photo, setPhoto] = useState(null);
  const [thumb, setThumb] = useState(null);
  const [fields, setFields] = useState({ name: hintName, location: '', description: '' });
  const [aiFailed, setAiFailed] = useState(false);

  const title = resnapOf ? `New photo of your ${resnapOf.name}` : (hintName ? `Add your ${hintName}` : 'Add a photo');

  async function onFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setStage('analyzing');
    const { photo: p, thumb: t } = await compressPhoto(file);
    setPhoto(p); setThumb(t);
    try {
      const tag = await engine.tagPhoto(p, { hintName: resnapOf ? resnapOf.name : hintName, sensitivity: 'personal' });
      setFields({
        name: resnapOf ? resnapOf.name : (tag.name || hintName || 'Item'),
        location: tag.location || '',
        description: tag.description || '',
      });
    } catch (err) {
      console.error(err);
      setAiFailed(true);
      setFields({ name: resnapOf ? resnapOf.name : (hintName || ''), location: '', description: '' });
    }
    setStage('confirm');
  }

  async function save() {
    setStage('saving');
    if (resnapOf) {
      await resnapItem(resnapOf, { photo, thumb, location: fields.location || resnapOf.location });
      logEvent('resnap', { itemId: resnapOf.id, name: resnapOf.name });
      onDone({ ...resnapOf, photo, thumb, location: fields.location || resnapOf.location, lastSeenAt: Date.now() });
    } else {
      const id = await addItem({ ...fields, photo, thumb, pinned });
      logEvent('capture', { itemId: id, name: fields.name, aiFailed });
      onDone({ id, ...fields, photo, thumb, pinned, lastSeenAt: Date.now() });
    }
  }

  return (
    <div>
      <button className="back" onClick={onCancel}>‹ Back</button>
      <h2>{title}</h2>

      {stage === 'pick' && (
        <>
          <p className="sub">Point the camera so the item and its spot are both easy to see.</p>
          <button className="btn-primary" onClick={() => fileRef.current.click()}>📷 Take the photo</button>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={onFile} />
        </>
      )}

      {stage === 'analyzing' && <div className="spinner">Looking at your photo…</div>}

      {(stage === 'confirm' || stage === 'saving') && (
        <div className="card">
          <img className="photo-full" src={photo} alt={fields.name} />
          {aiFailed && <div className="notice">I couldn't read the photo this time — please fill in the words yourself.</div>}
          <EditableText label="Item" value={fields.name} onSave={(v) => setFields((f) => ({ ...f, name: v }))} />
          <EditableText label="Where it is" value={fields.location} big onSave={(v) => setFields((f) => ({ ...f, location: v }))} />
          <EditableText label="Note" value={fields.description} emptyLabel="tap to add a note" onSave={(v) => setFields((f) => ({ ...f, description: v }))} />
          <div style={{ marginTop: 16 }}>
            <button className="btn-primary" disabled={stage === 'saving'} onClick={save}>
              {stage === 'saving' ? 'Saving…' : '✓ Looks right — save it'}
            </button>
            <button className="btn-quiet" onClick={onCancel}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
