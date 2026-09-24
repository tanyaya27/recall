// AIEngine — the single abstraction between ReCall and any AI vendor.
// The rest of the app only ever calls: engine.tagPhoto(...) and engine.answerQuery(...).
// Swapping vendors = writing a provider with visionJSON()/textJSON() and
// registering it below. Nothing else in the app changes.
import { anthropic } from './providers/anthropic.js';
import { gemini } from './providers/gemini.js';
import { cleanDetails } from '../lib/sensitive.js';

const PROVIDERS = { anthropic, gemini };

const CFG_KEY = 'recall-ai-config';

export function getAIConfig() {
  try {
    const cfg = JSON.parse(localStorage.getItem(CFG_KEY)) || {};
    return { provider: cfg.provider || 'anthropic', apiKey: cfg.apiKey || '', model: cfg.model || '' };
  } catch { return { provider: 'anthropic', apiKey: '', model: '' }; }
}

export function saveAIConfig(cfg) { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); }

export function providerList() {
  return Object.entries(PROVIDERS).map(([id, p]) => ({ id, label: p.label, defaultModel: p.defaultModel }));
}

function parseJSON(text) {
  // Models occasionally wrap JSON in fences; strip defensively.
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  return JSON.parse(cleaned.slice(start, end + 1));
}

export class AIEngine {
  constructor(cfg = getAIConfig()) {
    this.cfg = cfg;
    this.provider = PROVIDERS[cfg.provider];
    if (!this.provider) throw new Error(`Unknown AI provider: ${cfg.provider}`);
  }

  // MVP step 1 (2026-09-24): Anthropic works with no key at all — through ReCall's service.
  // Only a provider that has no service behind it (Gemini) still needs a key on the phone.
  get usesService() { return this.cfg.provider === 'anthropic' && !this.cfg.apiKey; }
  get ready() { return this.usesService || !!this.cfg.apiKey; }

  // Can this device reach the AI service AT ALL?
  //
  // Sends a knowingly-invalid key. If the service answers — any HTTP status, 401 included
  // — the network path works and any failure after this is about the key or the account.
  // If nothing comes back, the request never left the device, and the cause is local:
  // a content blocker, a VPN or Private Relay, Lockdown Mode, or a service worker.
  // Distinguishing those two cases is the whole ballgame, and it can only be done here,
  // on the device that is actually failing.
  async probeReach() {
    if (this.usesService) return { reached: true, raw: 'through ReCall\'s service' }; // the service call itself is the test
    try {
      await this.provider.textJSON({ ...this.cfg, apiKey: 'sk-ant-probe-not-a-real-key' }, 'hi', { sensitivity: 'none' });
      return { reached: true, raw: 'unexpected success' };
    } catch (err) {
      const raw = String(err && err.message ? err.message : err);
      // An HTTP status in the error means a server answered us.
      return { reached: /\b(400|401|403|404|413|429|5\d\d)\b/.test(raw), raw };
    }
  }

  // Does this key actually work? One cheap round-trip, and the REAL error back if not.
  // Without this, a bad key, a dead network and an empty quota all look identical from
  // the phone — the app simply appears not to try.
  async testKey() {
    if (!this.ready) return { ok: false, message: 'No key entered yet.' };
    try {
      await this.provider.textJSON(this.cfg, 'Reply with ONLY this JSON: {"ok":true}', { sensitivity: 'none' });
      return { ok: true, message: this.usesService ? 'Working — through ReCall\'s service.' : `Working — ${this.provider.label}${this.cfg.model ? ` (${this.cfg.model})` : ''}.` };
    } catch (err) {
      const raw = String(err && err.message ? err.message : err);
      let hint = 'The request failed — see the details below.';
      if (/daily-limit/.test(raw)) hint = 'This phone has used today\'s share of ReCall\'s AI. It starts again tomorrow.';
      else if (/service-limit/.test(raw)) hint = 'ReCall\'s AI is busy today. Try again tomorrow.';
      else if (/unauthenticated/.test(raw)) hint = 'ReCall has not finished signing in on this phone yet. Try again in a moment.';
      else
      if (/not_found_error|model:/i.test(raw)) hint = 'Your key works, but that Model name is not a real model. Clear the Model box to use the default.';
      else if (/401|invalid.*api.*key|authentication/i.test(raw)) hint = 'That key was rejected. Check you copied all of it.';
      else if (/429|rate.?limit/i.test(raw)) hint = 'Too many requests just now — wait a moment and try again.';
      else if (/credit|quota|billing|insufficient/i.test(raw)) hint = 'The account is out of credit. Top it up in the Anthropic console.';
      // A thrown fetch is NOT proof the network is down — it usually means the request was
      // blocked or refused. Only say "offline" when the browser itself says so.
      else if (navigator.onLine === false) hint = 'This device reports it is offline.';
      else if (/failed to fetch|networkerror|load failed/i.test(raw)) hint = 'The request never completed. Not necessarily a connection problem.';
      return { ok: false, message: hint, raw };
    }
  }

  // sensitivity flag: reserved for Phase 2 on-device routing (MVP arch requirement #3).
  // v0 always routes to the cloud provider, but every call site already passes it.
  //
  // Two things the model is asked to keep strictly apart, because it can see one and
  // usually cannot see the other:
  //   restingOn — the surface or object the thing is sitting on. Visible. Say it.
  //   place     — which room / named spot in the home. A close crop of a counter cannot
  //               distinguish a bathroom from a kitchen, so this is offered as ranked
  //               GUESSES drawn from places this household already uses, never asserted.
  // The person picks the place. Guessing a room and being wrong sends them to the wrong
  // room, which is far worse than admitting we don't know (DAY_IN_THE_LIFE rule 2).
  //
  // `catalog` turns open-vocabulary naming into matching against things already in the
  // vault, which is much more reliable — and gets better the more the household uses it.
  // photoDataUrl: one data URL, or an array — every photo of the same thing from this log
  // (a close-up and a wide shot). Ravi, 2026-09-14: the wide shot alone named the can in the
  // background instead of the keyboard in front; the close-up is the stronger evidence.
  async tagPhoto(photoDataUrl, { hintName = '', knownPlaces = [], catalog = [], sensitivity = 'personal' } = {}) {
    const photos = Array.isArray(photoDataUrl) ? photoDataUrl : [photoDataUrl];
    // catalog entries are strings, or { name, aliases } — the names a thing has been called before.
    const placesLine = knownPlaces.length
      ? `Places this household already uses: ${knownPlaces.map((p) => `"${p}"`).join(', ')}.`
      : 'This household has no saved places yet.';
    const catalogLine = catalog.length
      ? `Things already saved: ${catalog.slice(0, 40).map((c) => typeof c === 'string' ? `"${c}"` : `"${c.name}"${c.aliases && c.aliases.length ? ` (also called ${c.aliases.map((a) => `"${a}"`).join(', ')})` : ''}`).join(', ')}.`
      : 'Nothing is saved yet.';

    const prompt =
`You are helping someone log where their belongings are, so they can find them later.
${photos.length > 1 ? `They took ${photos.length} photos of the SAME thing moments apart. A close-up shows WHAT it is; a wider shot shows WHERE it is. Name the one thing they are photographing — the subject in front — never something that merely appears in the background of a wider shot.\n` : ''}${hintName ? `They say this photo should show their: ${hintName}.\n` : ''}${catalogLine}
${placesLine}

Answer these separately. Do not blend them.

1. WHAT IT IS. The main object, in AT MOST THREE WORDS — it has to fit under a small
   photo tile. Prefer the shortest name that identifies it: "scissors", not "blue and
   white scissors". Only add a colour or other qualifier if something in the already-saved
   list would otherwise be confused with it. If it is clearly one of the things already
   saved, reuse that exact name AND put it in "sameAs" — the app must not create a second
   tile for a thing that is already saved. Same object, different angle, different place,
   different lighting, a different name for it: still "sameAs". Only leave "sameAs" empty
   when it is a different object. Name it the way its owner would ("your black shorts",
   "reading glasses"), never as a stranger would ("black fabric", "an item"). If two
   objects could plausibly be the subject, put the others in "alternatives".

2. WHAT IT IS RESTING ON. Only what you can actually see — "on a pair of folded black
   shorts", "in an open drawer", "on a speckled stone countertop". This is genuinely
   useful for finding it. Leave "" if unclear.

3. WHERE IT IS — the room or named spot. BE HONEST HERE. A close-up of a countertop,
   a table or a floor almost never reveals which room of the house it is in. If you
   cannot actually tell, set "placeCertain": false and offer your best ranked guesses,
   preferring the household's existing places above. Never invent a room you cannot see.
   Getting this wrong sends the person to the wrong room, which is much worse than
   saying you are unsure.

4. WHAT IT SAYS. Copy any words or numbers printed ON the thing, its label, its packet or the
   paper itself that identify it: brand, model, size, spec, count, serial number, plant variety;
   for a bill or letter, who it is from, the amount and the due date. Copy exactly, shortest
   useful form, separated by " · " (e.g. "#8 × 1-1/4 in · stainless · pan head · 100 ct",
   "Tulip 'Queen of Night'", "Puget Sound Energy · $84.12 · due Oct 9"). Never guess text you
   cannot read. NEVER copy a password, PIN, security code, or a full card, account or ID number,
   even if you can read it: leave it out. "" if there is none. At most 200 characters.

5. PRIVATE. Would its owner want this kept from visitors and family helpers? true for passwords or
   a password book, PINs, bank or account papers and cards, ID (passport, licence, social security
   card), medical records, prescriptions, medicines with a name on them, insurance papers, tax
   papers, wills and deeds, a safe. Give the reason in a few plain words ("looks like passwords",
   "looks medical"). SEPARATELY, "secretVisible" is true ONLY if an actual password, PIN, security
   code, or full card or account number can be READ in the photo (an open page, the back of a card).
   A closed notebook or a folder is private but has no visible secret.

Reply with ONLY a JSON object, no other text:
{"name": "<short everyday name, 1-3 words>",
 "sameAs": "<the EXACT saved name this photo shows, from the list above, or \"\" if it is not one of them>",
 "alternatives": ["<other plausible names for the subject, 0-2 items>"],
 "restingOn": "<what it is sitting on/in, as seen, or \\"\\">",
 "placeCertain": <true only if the room is genuinely identifiable from the photo>,
 "placeGuesses": ["<most likely place first, up to 3, prefer the household's existing places>"],
 "description": "<one short sentence a family member would find useful>",
 "details": "<the words and numbers printed on it, copied exactly, or \"\">",
 "private": <true or false>,
 "privateWhy": "<a few plain words, or \"\">",
 "secretVisible": <true only if a password, PIN or full card/account number can be read>}`;

    const text = photos.length > 1 && this.provider.visionJSONMulti
      ? await this.provider.visionJSONMulti(this.cfg, [...photos.flatMap((ph, i) => [{ text: `PHOTO ${i + 1} of ${photos.length}:` }, { image: ph }]), { text: prompt }], { sensitivity })
      : await this.provider.visionJSON(this.cfg, prompt, photos[0], { sensitivity });
    const out = parseJSON(text);
    const clean = (s) => (typeof s === 'string' ? s.trim() : '');
    const list = (v) => (Array.isArray(v) ? v.map(clean).filter(Boolean) : []);
    return {
      name: clean(out.name) || hintName || '',
      sameAs: clean(out.sameAs),
      alternatives: list(out.alternatives).slice(0, 2),
      restingOn: clean(out.restingOn),
      placeCertain: out.placeCertain === true,
      placeGuesses: list(out.placeGuesses).slice(0, 3),
      description: clean(out.description),
      details: cleanDetails(clean(out.details).slice(0, 200)),
      private: out.private === true,
      privateWhy: clean(out.privateWhy).slice(0, 60),
      secretVisible: out.secretVisible === true,
    };
  }

  // Is the new photo one of these things? The model LOOKS at the candidates' photos, so a
  // different name for the same object no longer makes a second tile (Ravi, 2026-09-14:
  // "the person has forgotten they already logged it"). candidates: [{ name, thumb }].
  // Returns { index: n | -1, sure: bool }. Told to answer -1 unless it is the same
  // individual object — two similar mugs are two mugs.
  async sameThing(photoDataUrl, candidates, { subject = '', sensitivity = 'personal' } = {}) {
    if (!candidates.length || !this.provider.visionJSONMulti) return { index: -1, sure: false };
    const photos = Array.isArray(photoDataUrl) ? photoDataUrl : [photoDataUrl];
    const segments = photos.flatMap((ph, i) => [{ text: photos.length > 1 ? `NEW PHOTO ${i + 1} of ${photos.length}:` : 'NEW PHOTO:' }, { image: ph }]);
    candidates.forEach((c, i) => { segments.push({ text: `SAVED THING ${i + 1} — "${c.name || 'unnamed'}":` }); segments.push({ image: c.thumb }); });
    segments.push({ text:
`Someone just took the NEW PHOTO${photos.length > 1 ? 'S' : ''} of one of their belongings${subject ? ` — their "${subject}"` : ''}. They may have
photographed this same thing before and forgotten. Above are ${candidates.length} things already
saved, each with its saved photo and name.

THE SUBJECT is ${subject ? `the ${subject}` : 'the object in front, the one being photographed'}. Other objects that happen to be in the
background of a wider shot are NOT the subject — a can on the desk behind a keyboard is not
what they photographed. ${photos.length > 1 ? 'The close-up shows the subject best.' : ''}

Is THE SUBJECT the very same object as one of the saved things? Same individual object —
not merely the same kind of object. A different angle, distance, lighting, background or
room does not make it different. Two similar-looking mugs, books or bottles ARE different
unless the details match. If the match is only a background object, answer 0.

Reply with ONLY a JSON object, no other text:
{"index": <1-${candidates.length} for the matching saved thing, or 0 if none of them>,
 "sure": <true only if you are confident it is that same object>}` });
    const text = await this.provider.visionJSONMulti(this.cfg, segments, { sensitivity });
    const out = parseJSON(text);
    const n = Number(out.index) || 0;
    return { index: n >= 1 && n <= candidates.length ? n - 1 : -1, sure: out.sure === true };
  }

  // Does the new photo show THIS saved thing? Used when a photo is added to an existing
  // item (round 5, Ravi): a person who is not in the right frame of mind may add a coffee
  // cup to the folder. Returns { same, seen } — `seen` is what the new photo mainly shows.
  async looksLike(photoDataUrl, item, { sensitivity = 'personal' } = {}) {
    if (!this.provider.visionJSONMulti || !item.thumb) return { same: true, seen: '' };
    const photos = Array.isArray(photoDataUrl) ? photoDataUrl : [photoDataUrl];
    const segments = [{ text: `SAVED THING — "${item.name || 'unnamed'}":` }, { image: item.thumb },
      ...photos.flatMap((ph, i) => [{ text: `NEW PHOTO ${i + 1} of ${photos.length}:` }, { image: ph }])];
    segments.push({ text:
`Someone is adding the NEW PHOTO${photos.length > 1 ? 'S' : ''} to the saved thing above. Does the new
photo show that same thing — the same object, any angle, distance, lighting or place? Or is it
a different thing altogether (a coffee cup added to a folder)?

Reply with ONLY a JSON object, no other text:
{"same": <true if the new photo shows the saved thing, false if it is a different object>,
 "seen": "<what the new photo mainly shows, 1-3 everyday words>"}` });
    const out = parseJSON(await this.provider.visionJSONMulti(this.cfg, segments, { sensitivity }));
    return { same: out.same !== false, seen: typeof out.seen === 'string' ? out.seen.trim() : '' };
  }

  // Prompted capture: the app asked for a specific photo, so it may check what it got.
  // Returns { visible, state, text }. state is one of the routine's allowed states or
  // 'unknown'. The app NEVER claims more than the photo shows.
  async verifyRoutinePhoto(photoDataUrl, routine, { weekday, timeOfDay, sensitivity = 'personal' } = {}) {
    const specs = {
      medication: {
        subject: 'a pill organiser with its lid open',
        question: `Is the slot for ${weekday} ${timeOfDay} empty?`,
        states: ['empty', 'full', 'unknown'],
      },
      stove: { subject: 'a stove or cooktop with its control dials', question: 'Are all the dials in the off position?', states: ['off', 'on', 'unknown'] },
      door: { subject: 'a door with its lock', question: 'Is the lock clearly engaged (deadbolt turned / latch set)?', states: ['locked', 'unlocked', 'unknown'] },
      generic: { subject: routine.name, question: `Does the photo clearly show ${routine.name}?`, states: ['shown', 'unknown'] },
    };
    const spec = specs[routine.type] || specs.generic;
    const prompt =
`You are checking a photo someone took in answer to the app's request: "${routine.name} — ${routine.instruction}".
Expected subject: ${spec.subject}.
${spec.question}
Be strict: if you cannot clearly see enough to answer, say "unknown". Never guess.
Reply with ONLY a JSON object, no other text:
{"visible": <true if the expected subject is clearly visible, else false>,
 "state": "<one of: ${spec.states.join(' | ')}>",
 "text": "<one short calm sentence stating only what the photo shows, e.g. 'Wednesday morning slot is empty.' or 'I can't see the dials clearly.'>"}`;
    const text = await this.provider.visionJSON(this.cfg, prompt, photoDataUrl, { sensitivity });
    const out = parseJSON(text);
    return {
      visible: !!out.visible,
      state: spec.states.includes(out.state) ? out.state : 'unknown',
      text: out.text || '',
    };
  }

  async answerQuery(question, items, { sensitivity = 'personal' } = {}) {
    const catalog = items.map((it, i) =>
      `${i}: ${it.name} — ${it.location} — ${it.description || ''}${it.details ? ` — label: ${it.details}` : ''} (last seen ${new Date(it.lastSeenAt).toLocaleString()})`
    ).join('\n');
    const prompt =
`You help someone find their belongings. Be brief, plain and never judgmental.
Their saved items (index: name — location — notes):
${catalog}

Their question: "${question}"

Reply with ONLY a JSON object, no other text:
{"matches": [<indexes of items that answer the question, best first, up to 3, empty if none>],
 "message": "<one short warm sentence. If there is a match, say where the item is. If not, gently say you don't have a photo of that yet.>"}`;
    const text = await this.provider.textJSON(this.cfg, prompt, { sensitivity });
    const out = parseJSON(text);
    return {
      matches: (out.matches || []).filter((i) => i >= 0 && i < items.length).map((i) => items[i]),
      message: out.message || '',
    };
  }
}
