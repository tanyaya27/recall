// The header bar on every card (board addendum 2026-09-05, S1).
//
// Back · title, where every app on the phone puts them. Back is a full-height button, not
// a text link, and it is never the only way out: the primary action stays in the fixed
// footer, in the thumb zone. Home has no header — the day line is its title.
export default function Header({ title, onBack, backLabel = 'Back' }) {
  return (
    <div className="header">
      <button className="back" onClick={onBack}>‹ {backLabel}</button>
      <div className="title">{title}</div>
    </div>
  );
}
