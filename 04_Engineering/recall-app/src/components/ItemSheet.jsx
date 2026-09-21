import { useEffect, useRef } from 'react';
import { LOG_MAX, isPrivate } from '../lib/db.js';
import { CameraIcon, PencilIcon, TrashIcon, LockIcon, UnlockIcon } from './Icons.jsx';

// The item's actions, from press-and-hold on its tile (Ravi, 2026-09-14 round 3). Same
// in-app sheet as confirms: big rows, the thing's name on top, Cancel last and largest so an
// accidental hold costs one obvious tap. Every action here is also reachable on the thing
// card — this is a shortcut, not the only path (Devin's condition).
export default function ItemSheet({ item, onAdd, onChangePlace, onRename, onMoveToTop, onRemove, onRemovePhoto, onPrivate, onCancel }) {
  const cancelRef = useRef(null);
  useEffect(() => { cancelRef.current && cancelRef.current.focus(); }, []);
  const label = item.name ? item.name : 'This thing';
  return (
    <div className="sheet-back" onClick={onCancel} role="presentation">
      <div className="sheet item-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-title" id="sheet-title">{label.charAt(0).toUpperCase() + label.slice(1)}</div>
        {(item.photoCount || 1) < LOG_MAX && (
          <button className="sheet-row" onClick={onAdd}><CameraIcon /> Add a photo</button>
        )}
        <button className="sheet-row" onClick={onChangePlace}><PencilIcon /> Change the place</button>
        <button className="sheet-row" onClick={onRename}><PencilIcon /> Rename</button>
        <button className="sheet-row" onClick={onMoveToTop}>Move to the top</button>
        {onPrivate && <button className="sheet-row" onClick={onPrivate}>{isPrivate(item) ? <UnlockIcon /> : <LockIcon />} {isPrivate(item) ? 'Share with the household' : 'Make private'}</button>}
        {onRemovePhoto && <button className="sheet-row amber" onClick={onRemovePhoto}><TrashIcon /> Remove this photo</button>}
        <button className="sheet-row amber" onClick={onRemove}><TrashIcon /> Remove from my items</button>
        <button ref={cancelRef} className="btn-primary alt" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
