import { useEffect, useRef } from 'react';
import { LOG_MAX, isPrivate } from '../lib/db.js';
import { CameraIcon, TrashIcon, LockIcon, UnlockIcon, StarIcon, PlusIcon, PinIcon } from './Icons.jsx';

// Press-and-hold on a tile or a photo (Ravi, round 3): a shortcut to what the thing's page does. Big rows, the
// name on top, Cancel last and largest so an accidental hold costs one obvious tap.
// Trimmed 09-27 (#28): no "Change the place" or "Rename" that only opened Edit, no "Move to the top" — and
// "Put things in" only on a container. Where it is changes one way: the camera (Move it / Put it somewhere).
export default function ItemSheet({ item, role = 'owner', container = false, placed = true, onAdd, onMove = null, onRemove, onRemovePhoto, onPrivate, onCancel,
  onPromote = null, promoted = false, onPutIn = null }) {
  const cancelRef = useRef(null);
  useEffect(() => { cancelRef.current && cancelRef.current.focus(); }, []);
  if (role === 'viewer') return null; // Can see: nothing to do on a hold (MU2·5)
  const label = item.name ? item.name : 'This item';
  return (
    <div className="sheet-back" onClick={onCancel} role="presentation">
      <div className="sheet item-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-title" id="sheet-title">{label.charAt(0).toUpperCase() + label.slice(1)}</div>
        {onMove && <button className={'sheet-row' + (placed ? '' : ' amber')} onClick={onMove}><PinIcon /> {placed ? 'Move it' : 'Put it somewhere'}</button>}
        {container && onPutIn && <button className="sheet-row" onClick={onPutIn}><PlusIcon /> Put items in</button>}
        {(item.photoCount || 1) < LOG_MAX && <button className="sheet-row" onClick={onAdd}><CameraIcon /> Add a photo</button>}
        {onPromote && <button className="sheet-row" onClick={onPromote}><StarIcon /> {promoted ? 'Take it off Home' : 'Show on Home too'}</button>}
        {onPrivate && <button className="sheet-row" onClick={onPrivate}>{isPrivate(item) ? <UnlockIcon /> : <LockIcon />} {isPrivate(item) ? 'Share with the household' : 'Make private'}</button>}
        {onRemovePhoto && <button className="sheet-row amber" onClick={onRemovePhoto}><TrashIcon /> Remove this photo</button>}
        {onRemove && <button className="sheet-row amber" onClick={onRemove}><TrashIcon /> Remove from my items</button>}
        <button ref={cancelRef} className="btn-primary alt" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
