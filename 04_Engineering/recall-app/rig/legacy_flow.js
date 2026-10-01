// 09-30f — the camera's new flow (Ravi, 1:36 PM): a photo on a tier that has a place asks "This photo is…", and a pick in
// Choose place shows Before → Now until "Use …". Suites written before it get those two answers clicked for them — the real
// buttons, as a person would — and so keep testing what they were written for:
//   · "This photo is…": a shot on a SAVED tier (the current place, or one already known above it) was a new place before
//     (09-29) → "A different place"; a shot on a tier she picked or named this time added a photo to it (R1) → "Another photo".
//   · Before → Now → "Use …".
// audit_pick.js tests the new flow itself and turns this off (window.__noAuto = true).
module.exports = async (ctx) => ctx.addInitScript(() => {
  // The click waits a beat (never inside the observer callback, mid-render): a synchronous click there crashed the WebKit
  // test browser (09-30f, audit_card C9 — the same steps by hand were fine).
  let due = null;
  const go = () => {
    if (window.__noAuto) return;
    const u = document.querySelector('.where-list.bn .btn-primary'); if (u) { u.click(); return; }
    const pf = document.querySelector('.photo-for'); if (!pf) return;
    const b = pf.querySelector(pf.getAttribute('data-was') === 'saved' ? '.pf-other' : '.pf-same'); if (b) b.click();
  };
  new MutationObserver(() => { if (!due) due = setTimeout(() => { due = null; go(); }, 60); }).observe(document, { subtree: true, childList: true });
});
