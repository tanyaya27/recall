import { PinWasIcon, CameraIcon } from './Icons.jsx';

// Tidy up one thing (design §6a, built 09-16 at Ravi's ask). Two plain choices with counts;
// the AI's look-alike suggestion is not here until the visual check has a record (Sam).
export default function TidySheet({ name, dupCount, earlierPlaces, earlierPhotos, onKeepNewest, onForgetEarlier, onCancel }) {
  return (
    <div className="sheet-back" onClick={onCancel} role="presentation">
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="tidy-title" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-title" id="tidy-title">Remove old photos of {name}</div>
        <button className="sheet-row tidy" disabled={!dupCount} onClick={onKeepNewest}><CameraIcon /><span>Keep the newest photo per place<small>{dupCount ? `deletes ${dupCount} older photo${dupCount === 1 ? '' : 's'}` : 'nothing to delete'}</small></span></button>
        <button className="sheet-row tidy amber" disabled={!earlierPhotos} onClick={onForgetEarlier}><PinWasIcon /><span>Delete its earlier places<small>{earlierPhotos ? `deletes ${earlierPhotos} photo${earlierPhotos === 1 ? '' : 's'} from ${earlierPlaces} earlier place${earlierPlaces === 1 ? '' : 's'} — the thing stays` : 'no earlier places'}</small></span></button>
        <button className="btn-primary alt" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
