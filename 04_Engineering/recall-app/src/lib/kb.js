// 09-29h (Ravi, phone: "the popup was covering the text box I was typing in"): on iPhone the keyboard slides OVER the page —
// a sheet pinned to the bottom of the screen stays under it, so what you type into (and the "A new place called …" row it
// makes) is hidden. The visual viewport says how much the keyboard covers; sheets sit on top of it (styles: --kb, .kb-up).
export function watchKeyboard() {
  if (typeof window === 'undefined' || !window.visualViewport) return;
  const root = document.documentElement;
  const set = () => {
    const v = window.visualViewport;
    const kb = Math.max(0, Math.round(window.innerHeight - v.height - v.offsetTop));
    root.style.setProperty('--kb', kb + 'px');
    root.style.setProperty('--vvh', Math.round(v.height) + 'px');
    root.classList.toggle('kb-up', kb > 80);
  };
  window.visualViewport.addEventListener('resize', set);
  window.visualViewport.addEventListener('scroll', set);
  set();
}
