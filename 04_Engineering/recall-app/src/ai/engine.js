// AIEngine — the single abstraction between ReCall and any AI vendor.
// The rest of the app only ever calls: engine.tagPhoto(...) and engine.answerQuery(...).
// Swapping vendors = writing a provider with visionJSON()/textJSON() and
// registering it below. Nothing else in the app changes.
import { anthropic } from './providers/anthropic.js';
import { gemini } from './providers/gemini.js';

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

  get ready() { return !!this.cfg.apiKey; }

  // Does this key actually work? One cheap round-trip, and the REAL error back if not.
  // Without this, a bad key, a dead network and an empty quota all look identical from
  // the phone — the app simply appears not to try.
  async testKey() {
    if (!this.cfg.apiKey) return { ok: false, message: 'No key entered yet.' };
    try {
      await this.provider.textJSON(this.cfg, 'Reply with ONLY this JSON: {"ok":true}', { sensitivity: 'none' });
      return { ok: true, message: `Working — ${this.provider.label}${this.cfg.model ? ` (${this.cfg.model})` : ''}.` };
    } catch (err) {
      const raw = String(err && err.message ? err.message : err);
      let hint = 'The request failed — see the details below.';
      if (/401|invalid.*api.*key|authentication/i.test(raw)) hint = 'That key was rejected. Check you copied all of it.';
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
  async tagPhoto(photoDataUrl, { hintName = '', knownPlaces = [], catalog = [], sensitivity = 'personal' } = {}) {
    const placesLine = knownPlaces.length
      ? `Places this household already uses: ${knownPlaces.map((p) => `"${p}"`).join(', ')}.`
      : 'This household has no saved places yet.';
    const catalogLine = catalog.length
      ? `Things already saved: ${catalog.slice(0, 40).map((n) => `"${n}"`).join(', ')}.`
      : 'Nothing is saved yet.';

    const prompt =
`You are helping someone with memory loss log where their belongings are.
${hintName ? `They say this photo should show their: ${hintName}.\n` : ''}${catalogLine}
${placesLine}

Answer three separate things. Do not blend them.

1. WHAT IT IS. The main object. If it is clearly one of the things already saved, reuse
   that exact name. Name it the way its owner would ("your black shorts", "reading
   glasses"), never as a stranger would ("black fabric", "an item"). If two objects could
   plausibly be the subject, put the others in "alternatives".

2. WHAT IT IS RESTING ON. Only what you can actually see — "on a pair of folded black
   shorts", "in an open drawer", "on a speckled stone countertop". This is genuinely
   useful for finding it. Leave "" if unclear.

3. WHERE IT IS — the room or named spot. BE HONEST HERE. A close-up of a countertop,
   a table or a floor almost never reveals which room of the house it is in. If you
   cannot actually tell, set "placeCertain": false and offer your best ranked guesses,
   preferring the household's existing places above. Never invent a room you cannot see.
   Getting this wrong sends a confused person to the wrong room, which is much worse
   than saying you are unsure.

Reply with ONLY a JSON object, no other text:
{"name": "<short everyday name, 1-3 words>",
 "alternatives": ["<other plausible names for the subject, 0-2 items>"],
 "restingOn": "<what it is sitting on/in, as seen, or \\"\\">",
 "placeCertain": <true only if the room is genuinely identifiable from the photo>,
 "placeGuesses": ["<most likely place first, up to 3, prefer the household's existing places>"],
 "description": "<one short sentence a family member would find useful>"}`;

    const text = await this.provider.visionJSON(this.cfg, prompt, photoDataUrl, { sensitivity });
    const out = parseJSON(text);
    const clean = (s) => (typeof s === 'string' ? s.trim() : '');
    const list = (v) => (Array.isArray(v) ? v.map(clean).filter(Boolean) : []);
    return {
      name: clean(out.name) || hintName || '',
      alternatives: list(out.alternatives).slice(0, 2),
      restingOn: clean(out.restingOn),
      placeCertain: out.placeCertain === true,
      placeGuesses: list(out.placeGuesses).slice(0, 3),
      description: clean(out.description),
    };
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
`You are checking a photo taken by someone with memory loss, in answer to the app's request: "${routine.name} — ${routine.instruction}".
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
      `${i}: ${it.name} — ${it.location} — ${it.description || ''} (last seen ${new Date(it.lastSeenAt).toLocaleString()})`
    ).join('\n');
    const prompt =
`You help someone with memory loss find their belongings. Be warm, brief, never judgmental.
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
