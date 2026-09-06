import { useEffect, useRef, useState } from 'react';

// Dictation, where the browser offers it — and where it is worth offering.
//
// Web Speech API support is uneven: good on Chrome/Android, and on iOS home-screen apps it
// is known to start and never call back (Ravi, 2026-09-05: "sometimes the mic hangs") and to
// ask for microphone permission on every launch — the OS re-prompts web apps for this API
// each open, and no code of ours can persist it. The iOS keyboard's own mic key is the
// system dictation: no prompt, no hang, types straight into the field. So on iOS our mic
// button does not render and the field says to use the keyboard's (D9, revised).
//
// Everywhere else: one button, tap on / tap off, and a WATCHDOG — if the recogniser has not
// started within 3s or has said nothing for 8s, we stop it ourselves and clear the
// listening state, so the button can never sit "listening" forever.
export const IS_IOS = typeof navigator !== 'undefined' &&
  (/iP(hone|ad|od)/.test(navigator.platform || '') ||
   ((navigator.userAgent || '').includes('Mac') && typeof document !== 'undefined' && 'ontouchend' in document));

const START_MS = 3000;
const SILENCE_MS = 8000;

export function useDictation(onText) {
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);
  const timer = useRef(0);

  const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const supported = !!SR && !IS_IOS;

  function clear() { if (timer.current) { clearTimeout(timer.current); timer.current = 0; } }
  function arm(ms) { clear(); timer.current = setTimeout(stop, ms); }

  function stop() {
    clear();
    try { recRef.current && recRef.current.stop(); } catch { /* already stopped */ }
    try { recRef.current && recRef.current.abort && recRef.current.abort(); } catch { /* fine */ }
    recRef.current = null;
    setListening(false);
  }

  function start() {
    if (!supported) return;
    if (listening) { stop(); return; }
    let rec;
    try { rec = new SR(); } catch { return; }
    recRef.current = rec;
    rec.lang = navigator.language || 'en-US';
    rec.interimResults = true;   // words arrive as they are said, so matching is live
    rec.continuous = false;
    rec.onstart = () => arm(SILENCE_MS);
    rec.onresult = (ev) => {
      const text = Array.from(ev.results).map((r) => r[0].transcript).join(' ').trim();
      if (text) onText(text);
      arm(SILENCE_MS);
    };
    rec.onerror = () => stop();
    rec.onend = () => stop();
    try { rec.start(); setListening(true); arm(START_MS); } catch { stop(); }
  }

  useEffect(() => () => stop(), []); // leaving the screen stops the mic

  return { supported, listening, toggle: start, stop };
}

// Instant, local matching — the thing every search field does before any server is asked.
// Word-prefix match on name, place and notes; case-insensitive; every typed word must hit.
// "gl" → Reading glasses; "kit" → everything on the kitchen counter.
// Filler words a person says out loud ("where are my glasses", "did I put the keys") are
// ignored so speaking a whole sentence matches the same as typing the noun.
const FILLER = new Set(['my', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'where', 'wheres', "where's", 'did', 'do', 'i', 'put', 'of', 'to', 'in', 'on', 'it', 'its', 'has', 'have', 'find', 'me', 'please', 'um', 'uh', 'and', 'go', 'gone', 'left']);
export function matchThings(items, query) {
  const words = (query || '').toLowerCase().replace(/[^a-z0-9'\s]/g, ' ').split(/\s+/)
    .filter((w) => w.length >= 2 && !FILLER.has(w));
  if (!words.length) return [];
  return items.filter((it) => {
    const hay = `${it.name || ''} ${it.location || ''} ${it.description || ''} ${it.restingOn || ''}`.toLowerCase();
    const toks = hay.split(/[^a-z0-9]+/);
    return words.every((w) => toks.some((t) => t.startsWith(w)));
  });
}
