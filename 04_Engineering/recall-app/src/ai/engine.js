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

  // sensitivity flag: reserved for Phase 2 on-device routing (MVP arch requirement #3).
  // v0 always routes to the cloud provider, but every call site already passes it.
  async tagPhoto(photoDataUrl, { hintName = '', sensitivity = 'personal' } = {}) {
    const prompt =
`You are helping someone with memory loss log where their belongings are.
Look at this photo${hintName ? ` (the user says it should show their: ${hintName})` : ''}.
Reply with ONLY a JSON object, no other text:
{"name": "<short everyday name of the main item, 1-3 words>",
 "location": "<where it is, in plain warm words, e.g. 'on the kitchen counter'>",
 "description": "<one short sentence a family member would find useful>"}`;
    const text = await this.provider.visionJSON(this.cfg, prompt, photoDataUrl, { sensitivity });
    return parseJSON(text);
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
