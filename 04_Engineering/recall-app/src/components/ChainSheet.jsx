import { PinIcon, BoxIcon } from './Icons.jsx';

// REQUIREMENTS_2026-09-27 R5 (kills F5): the sentence's pencil used to open a 3-option Choice
// ("Photograph it again" / "Pick from every place and box" / "No place yet") that reset the WHOLE
// chain no matter how deep it was — Mei's 3-level chain came back as one empty level. This sheet
// edits ONE row at a time instead: a thumb, the name (tap = rename, LogCamera's R3 sheet), then
// Replace (clears that level's photo(s) and identity, selects it, back to the camera) and Remove
// (that level only — deeper levels shift up). Words on every row control, never bare icons
// (Frank + Sunil, F10) — and targets stay ≥44 px (styles.css `.cs-act`).
export default function ChainSheet({ rows, onRename, onReplace, onRemove, onMore, onPickList, onNoPlace, onCancel }) {
  return (
    <div className="sheet-back" onClick={onCancel} role="presentation">
      <div className="sheet chain-sheet" role="dialog" aria-modal="true" aria-labelledby="cs-title" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-title" id="cs-title">Where it goes</div>
        <div className="cs-rows">
          {rows.map((r) => (
            <div className="cs-row" key={r.key}>
              {r.thumb ? <img src={r.thumb} alt="" /> : <span className="no">{r.box ? <BoxIcon /> : <PinIcon />}</span>}
              <button type="button" className="cs-name" onClick={() => onRename(r.idx)}>{r.name}</button>
              <button type="button" className="cs-act" onClick={() => onReplace(r.idx)}>Replace</button>
              <button type="button" className="cs-act rm" onClick={() => onRemove(r.idx)}>Remove</button>
            </div>
          ))}
        </div>
        <button type="button" className="btn-secondary" onClick={onMore}>Photograph more</button>
        <button type="button" className="btn-secondary" onClick={onPickList}>Pick from every place and box</button>
        <button type="button" className="btn-secondary amber" onClick={onNoPlace}>No place yet</button>
        <button type="button" className="btn-quiet" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
