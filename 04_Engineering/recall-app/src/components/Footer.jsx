// The action zone. Board decision 2026-09-05, Rule 3.
//
// Fixed to the bottom of the screen — not sticky, so it can never scroll away or float
// over a card (the bug that moved Back to the top last time). Used ONLY on Home and the
// thing card: any screen where a keyboard can open puts its actions in the flow instead
// (Priyanka, §3.3 — a fixed bar jumps when Safari's keyboard appears).
export default function Footer({ children }) {
  return (
    <div className="footer">
      <div className="footer-inner">{children}</div>
    </div>
  );
}
