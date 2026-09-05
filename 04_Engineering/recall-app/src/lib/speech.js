import { useRef, useState } from 'react';

// Dictation, where the browser offers it.
//
// Web Speech API support is uneven — good on Chrome/Android, patchy in iOS Safari. So this
// is strictly an ADDITION: every place it is used also has a plain text field, and on iOS
// the keyboard's own microphone key dictates into that field regardless. The mic button
// simply does not render when the API is missing. Never make it the only route.
export function useDictation(onText) {
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);

  const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

  function stop() {
    try { recRef.current && recRef.current.stop(); } catch { /* already stopped */ }
    setListening(false);
  }

  function start() {
    if (!SR) return;
    if (listening) { stop(); return; }   // one button, tap on / tap off
    let rec;
    try { rec = new SR(); } catch { return; }
    recRef.current = rec;
    rec.lang = navigator.language || 'en-US';
    rec.interimResults = true;
    rec.onresult = (ev) => {
      const text = Array.from(ev.results).map((r) => r[0].transcript).join(' ').trim();
      if (text) onText(text);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    try { rec.start(); setListening(true); } catch { setListening(false); }
  }

  return { supported: !!SR, listening, toggle: start, stop };
}
