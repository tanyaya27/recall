import { useEffect, useRef, useState } from 'react';
import { CameraIcon, CloseIcon } from './Icons.jsx';

// The in-app camera (Ravi, 2026-09-14 round 3, asked twice): our own shutter, our own
// Cancel, and every shot lands as a thumbnail along the bottom with a large ✕ — keep
// shooting, then Done. iOS's own camera sheet (Retake / Use Photo) had no Cancel and took
// one photo at a time.
//
// getUserMedia, rear camera, full screen. If the camera cannot start (no permission, no
// support, an old phone), the same screen offers the phone's camera instead — the file
// input we used before — so nothing is ever a dead end.
//
// Returns Files (JPEG) through onDone(files); onCancel() returns nothing.
export const MAX_SHOTS = 4;

export default function Camera({ max = MAX_SHOTS, title = 'Log item', onDone, onCancel }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [shots, setShots] = useState([]);       // [{ file, url }]
  const [state, setState] = useState('starting'); // 'starting' | 'live' | 'failed'
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { setState('failed'); return; }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1440 } }, audio: false,
        });
        if (!alive) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) { v.srcObject = stream; await v.play().catch(() => {}); }
        setState('live');
      } catch (err) {
        console.error('camera', err);
        if (alive) setState('failed');
      }
    })();
    return () => { alive = false; const s = streamRef.current; if (s) s.getTracks().forEach((t) => t.stop()); };
  }, []);

  // Free the object URLs when we leave.
  useEffect(() => () => shots.forEach((s) => URL.revokeObjectURL(s.url)), []); // eslint-disable-line

  async function snap() {
    const v = videoRef.current;
    if (!v || state !== 'live' || shots.length >= max) return;
    const w = v.videoWidth, h = v.videoHeight;
    if (!w || !h) return;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    c.getContext('2d').drawImage(v, 0, 0, w, h);
    setFlash(true); setTimeout(() => setFlash(false), 120);
    if (navigator.vibrate) navigator.vibrate(15);
    const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.92));
    const file = new File([blob], `recall-${Date.now()}.jpg`, { type: 'image/jpeg' });
    setShots((prev) => [...prev, { file, url: URL.createObjectURL(blob) }]);
  }
  function drop(i) { setShots((prev) => { URL.revokeObjectURL(prev[i].url); return prev.filter((_, j) => j !== i); }); }
  function done() { if (shots.length) onDone(shots.map((s) => s.file)); }

  return (
    <div className="camera" role="dialog" aria-modal="true" aria-label={title}>
      <div className="camera-top">
        <button type="button" className="camera-cancel" onClick={onCancel}>Cancel</button>
        <div className="camera-title">{title}</div>
        <div className="camera-count">{shots.length ? `${shots.length} of ${max}` : ''}</div>
      </div>

      <div className="camera-view">
        <video ref={videoRef} playsInline muted autoPlay className={state === 'live' ? '' : 'hidden'} />
        {flash && <div className="camera-flash" />}
        {state === 'starting' && <div className="camera-msg">Starting the camera…</div>}
        {state === 'failed' && (
          <div className="camera-msg">
            <p>The camera could not start on this phone.</p>
            <label className="btn-primary file">
              <CameraIcon /> Use the phone's camera
              <input type="file" accept="image/*" capture="environment"
                onChange={(e) => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) onDone([f]); }} />
            </label>
          </div>
        )}
      </div>

      {/* The roll: every shot so far, ✕ to drop it. */}
      <div className="camera-roll">
        {shots.map((s, i) => (
          <div className="roll-shot" key={s.url}>
            <img src={s.url} alt={`Photo ${i + 1}`} />
            <button type="button" className="roll-x" aria-label={`Remove photo ${i + 1}`} onClick={() => drop(i)}><CloseIcon /></button>
          </div>
        ))}
      </div>

      <div className="camera-bar">
        <div className="camera-slot" />
        <button type="button" className="shutter" aria-label="Take a photo" disabled={state !== 'live' || shots.length >= max} onClick={snap}><span /></button>
        <button type="button" className="camera-done" disabled={!shots.length} onClick={done}>{shots.length ? `Done (${shots.length})` : 'Done'}</button>
      </div>
    </div>
  );
}
