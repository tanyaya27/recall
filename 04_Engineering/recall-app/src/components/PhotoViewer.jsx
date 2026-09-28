import { useEffect, useRef, useState } from 'react';
import { CloseIcon, StarIcon, StarFillIcon, TrashIcon, PencilIcon } from './Icons.jsx';

// D2 (Ravi 09-28, mockups shots_d/D2_viewer.jpg, "B"): tap a photo → the photo, big, over a dark see-through backdrop.
// Ravi's own rule on top of the mock: the photo box is at least 80% of the screen's height — nothing but a small top bar
// (✕ and the words) and a small bottom bar (the two pills) around it. So the "Photo 2 of 3 · Today 5:55 PM" line and the
// caption ride in the top bar beside ✕, and the dots sit between the pills.
//
//   photos      [{ src, at?, main, caption?, ... }] — a thing's photos (its strip), or one place's photos
//   start       the photo to open on
//   title(i, n) the line under/above the photo — "Photo 2 of 3 · Today 5:55 PM" for a thing, "Desk drawer · photo 1 of 3" for a place
//   caption     (i) → what the photo shows, or '' (a thing only; null = the viewer has no caption line at all)
//   onEdit      (i) → opens the "What's in this photo?" sheet; null = no Edit (only the owner of the thing, D3)
//   onMakeMain  (i) → null = no pill. onRemove (i) → null = no pill.
//
// Swipe = scroll-snap, like the page's own strip. Tap on the dark (anywhere that is not the photo) or ✕ closes. Photos are
// object-fit: contain: the whole picture, never cropped. Dark glass with white words, whatever the theme (the camera's rule).
export default function PhotoViewer({ photos, start = 0, title, caption = null, onEdit = null, onMakeMain = null, onRemove = null, onClose }) {
  const [index, setIndex] = useState(Math.min(start, Math.max(0, photos.length - 1)));
  const scrollRef = useRef(null);
  const xRef = useRef(null);
  const i = Math.min(index, photos.length - 1);
  const p = photos[i];

  // Open on the tapped photo (no animation), and put focus on ✕ so Escape/Enter work at once.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = Math.min(start, photos.length - 1) * el.clientWidth;
    if (xRef.current) xRef.current.focus();
    const key = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []); // eslint-disable-line
  function onScroll(e) {
    const el = e.currentTarget;
    const k = Math.max(0, Math.min(photos.length - 1, Math.round(el.scrollLeft / Math.max(1, el.clientWidth))));
    if (k !== index) setIndex(k);
  }
  if (!p) return null;
  const cap = caption ? caption(i) : '';
  // A tap on the dark closes — the top and bottom bars, and the empty sides of a photo that is fitted (object-fit: contain
  // leaves room above/below or beside it, inside the box). A tap on the picture itself, on a button or on the words does not.
  function tapBackdrop(e) {
    const t = e.target;
    if (t.closest && (t.closest('button') || t.closest('.d2-txt') || t.closest('.d2-dots'))) return;
    if (t.tagName === 'IMG' && t.naturalWidth && t.naturalHeight) {
      const r = t.getBoundingClientRect(); const k = Math.min(r.width / t.naturalWidth, r.height / t.naturalHeight);
      const w = t.naturalWidth * k, h = t.naturalHeight * k; const l = r.left + (r.width - w) / 2, tp = r.top + (r.height - h) / 2;
      if (e.clientX >= l && e.clientX <= l + w && e.clientY >= tp && e.clientY <= tp + h) return;
    }
    onClose();
  }

  return (
    <div className="d2-pv" role="dialog" aria-modal="true" aria-label="Photo viewer" onClick={tapBackdrop}>
      <div className="d2-top">
        <div className="d2-txt">
          <div className="d2-meta">{title(i, photos.length)}</div>
          {caption && cap ? <div className="d2-cap">In this photo: {cap}</div> : caption && onEdit ? <div className="d2-cap dim">In this photo: nothing said yet</div> : null}
        </div>
        {onEdit && caption ? <button type="button" className="d2-edit" onClick={() => onEdit(i)}><PencilIcon /><span>Edit</span></button> : null}
        <button type="button" ref={xRef} className="d2-x" aria-label="Close" onClick={onClose}><CloseIcon /></button>
      </div>
      <div className="d2-photos" ref={scrollRef} onScroll={onScroll}>
        {photos.map((ph, j) => (
          <div className="d2-slide" key={ph.key || j}>
            <img src={ph.src} alt="" draggable="false" />
          </div>
        ))}
      </div>
      <div className="d2-bot">
        {onMakeMain ? (
          <button type="button" className={'d2-pill star' + (p.main ? '' : ' off')} aria-pressed={!!p.main} onClick={() => { if (!p.main) onMakeMain(i); }}>
            {p.main ? <StarFillIcon /> : <StarIcon />}<span>{p.main ? 'Main photo' : 'Make main'}</span></button>
        ) : <span />}
        {photos.length > 1 && <div className="pv-dots d2-dots" aria-hidden="true">{photos.map((_, j) => <i key={j} className={j === i ? 'on' : ''} />)}</div>}
        {onRemove ? <button type="button" className="d2-pill rm" onClick={() => onRemove(i)}><TrashIcon /><span>Remove</span></button> : <span />}
      </div>
    </div>
  );
}
