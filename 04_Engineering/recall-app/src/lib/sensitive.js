// Things that look private start private (Ravi, DECISIONS 2026-09-24).
//
// Two sources, either one is enough:
//   1. the AI, when it names a photo: `private` + a few words why, and `secretVisible` when an
//      actual password, PIN, card or account number can be READ in the photo;
//   2. this word list, for anything typed or spoken (and for the AI's own name) — works with no AI.
// A false "private" costs her one tap ("Share it instead"); a missed one shows a secret to a
// helper. So the rules lean toward private.
//
// Secrets themselves are refused (Ravi 09-24, until the native app): ReCall remembers WHERE
// the password notebook is, never the password. A photo in which one can be read is not kept;
// a typed one blocks Save until it is taken out.

// Phrases that are not private although they contain a private word.
const NOT = /\b(power|piggy|food|river|memory|blood)\s+bank\b|\bsafety\b|\bsafe\s+(for|to)\b/gi;

const RULES = [
  [/\b(passwords?|passcodes?|log-?ins?|recovery codes?|seed phrase|pin (number|code)s?)\b/i, 'looks like passwords'],
  [/\bPINs?\b/, 'looks like passwords'], // capitals only: "bobby pins" and "safety pins" are not secrets
  [/\b(bank|banking|checkbook|cheque ?book|credit cards?|debit cards?|bank cards?|account numbers?|brokerage|safe deposit)\b/i, 'looks like bank details'],
  [/\b(passports?|social security|ssn|driver'?s licen[cs]e|birth certificate|id cards?|green card)\b/i, 'looks like ID'],
  [/\b(medical|medicines?|medications?|meds|prescriptions?|pills?|pill (box|organi[sz]er)|insulin|inhaler|epipen|lab results?|diagnosis|health records?|vaccination records?|refills?|pharmacy|rx)\b/i, 'looks medical'],
  [/\b(insurance|policy documents?)\b/i, 'looks like insurance papers'],
  [/\b(tax(es)?|tax returns?|w-?2|1099|last will|will and testament|deeds?|power of attorney)\b/i, 'looks like personal papers'],
  [/\b(safe)\b/i, 'looks like a safe'],
];

// Words a private thing was named with → why it's private, or ''.
export function privateWhy(...texts) {
  const t = texts.filter(Boolean).join(' · ').replace(NOT, ' ');
  if (!t.trim()) return '';
  for (const [re, why] of RULES) if (re.test(t)) return why;
  return '';
}

// A secret typed into a name or a place: "PIN 4821", "password: tulip88", a card number, an SSN.
const SECRETS = [
  /\b(password|passcode|pwd)\s*(is|:|=|-)\s*\S+/i,
  /\b(pin|passcode|code|combination|combo)\b\s*(number|no\.?|#)?\s*(is|:|=|-)?\s*\d[\d -]{1,}\d/i,
  /\b\d{3}-\d{2}-\d{4}\b/,                 // a US social security number
  /\b(?:\d[ -]?){13,19}\b/,                // a card or account number
];
export function hasSecret(...texts) {
  const t = texts.filter(Boolean).join(' \n ');
  return SECRETS.some((re) => re.test(t));
}

// One answer for a capture. tag: the AI's naming (or null/undefined); texts: typed name, place, label.
// → { private, why, secret }. `secret` means: do not keep the photo (seen) — typed secrets are
// blocked before saving, so they never reach here.
export function verdictOf(tag, ...texts) {
  const words = privateWhy(tag && tag.name, tag && tag.description, ...texts);
  const ai = tag && tag.private ? (tag.privateWhy || words || 'looks private') : '';
  const secret = !!(tag && tag.secretVisible);
  const why = say(ai || words || (secret ? 'looks like passwords' : ''));
  return { private: !!why, why, secret };
}

// "Kept private: this ___." — always "looks …", in lower case, whatever the AI wrote.
function say(w) {
  let t = (w || '').trim().replace(/[.!]+$/, '');
  if (!t) return '';
  t = t.charAt(0).toLowerCase() + t.slice(1);
  if (!/^looks\b/.test(t)) t = 'looks like ' + t.replace(/^(it is|it's|this is|these are|a|an)\s+/i, '');
  return t;
}

// The AI's label text must never carry a secret (MVP #9): drop it if it does.
export function cleanDetails(details) {
  return details && hasSecret(details) ? '' : (details || '');
}
