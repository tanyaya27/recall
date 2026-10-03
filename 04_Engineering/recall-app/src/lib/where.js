// 10-02 (Ravi, one where): what she types for "where" → a place or box she has (exact name), or a NEW place.
// Shared by the camera and Write it down, so both read typing the same way.
import { normName } from './names.js';

// Only containment words go: "on my lab desk" → "lab desk", "in the garage" → "garage". Position words stay part of the
// name ("Under the sink", "Behind the couch") — tester ow2 #8. Filler alone is no place.
const LEAD_IN = /^\s*(?:(?:in|inside|into|on|onto|at)\b\s*)?(?:(?:the|my|a|an|our)\b\s*)?/i;
const LEAD_ART = /^\s*(?:(?:the|my|a|an|our)\b\s*)?/i;
const tidy = (s) => (s || '').replace(/[\r\n\t]+/g, ' ').replace(/[\s.,;:!?]+$/, '').replace(/\s+/g, ' ').trim();
export function bareWhere(text) { const b = tidy(tidy(text).replace(LEAD_IN, '')); return /[\p{L}\p{N}]/u.test(b) ? b : ''; } // " - " is no place (ow2)
// every leading position word off too ("by the baseball card" -> "baseball card"): only to notice she named an ITEM
const LEAD_ANY = /^\s*(?:(?:in|inside|into|on|onto|at|under|underneath|behind|beside|by|near|next to|on top of|in front of)\b\s*)?(?:(?:the|my|a|an|our)\b\s*)?/i;
export function deepBare(text) { return tidy(tidy(text).replace(LEAD_ANY, '')); }
export function articleOff(text) { return tidy(tidy(text).replace(LEAD_ART, '')); }
// A key that works for every script: normName for Latin names, the trimmed lowercase text otherwise (tester ow2 #1).
export function nameKey(s) { const n = normName(s || ''); return n || (s || '').trim().toLowerCase().replace(/\s+/g, ' '); }
