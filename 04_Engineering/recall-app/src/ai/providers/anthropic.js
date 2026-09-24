// Anthropic provider. Two transports (MVP step 1, 2026-09-24):
//   ReCall's service (default) — the `ai` Cloud Function forwards the call with ReCall's own key
//     (or the ReCall owner's stored key), so nobody has to paste a key. It clamps the model and
//     size and applies a daily limit per person (functions/index.js).
//   Your own key (optional, Settings) — a direct browser call, as before. Needs the
//     anthropic-dangerous-direct-browser-access header; the key never leaves this phone.
import { call as callFn } from '../../lib/functions.js';
const API = 'https://api.anthropic.com/v1/messages';

// Whose ReCall the call is made for (a helper logging into someone else's ReCall). App sets it.
let aiOwner = null;
export function setAIOwner(uid) { aiOwner = uid || null; }

async function viaService(cfg, blocks) {
  const body = { model: anthropic.defaultModel, max_tokens: 500, messages: [{ role: 'user', content: blocks }] };
  try {
    const data = await callFn('ai', aiOwner ? { body, ownerUid: aiOwner } : { body });
    return (data.content || []).map((b) => b.text || '').join('');
  } catch (e) {
    const code = String(e && e.code || '').replace('functions/', '');
    // Keep the real reason in the message: Settings shows it; the daily limit gets its own words there.
    throw new Error(`ReCall service ${code || 'error'}: ${String(e && e.message || e).slice(0, 200)}`);
  }
}

async function call(cfg, blocks) {
  if (!cfg.apiKey) return viaService(cfg, blocks);
  const res = await fetch(API, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': cfg.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: cfg.model || anthropic.defaultModel,
      max_tokens: 500,
      messages: [{ role: 'user', content: blocks }],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Anthropic ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.content.map((b) => b.text || '').join('');
}

export const anthropic = {
  label: 'Anthropic (Claude)',
  defaultModel: 'claude-haiku-4-5-20251001',
  visionJSON(cfg, prompt, photoDataUrl) {
    const base64 = photoDataUrl.split(',')[1];
    return call(cfg, [
      { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
      { type: 'text', text: prompt },
    ]);
  },
  textJSON(cfg, prompt) {
    return call(cfg, [{ type: 'text', text: prompt }]);
  },
  // Several images in one question — [{ image: dataUrl } | { text }] in order.
  visionJSONMulti(cfg, segments) {
    return call(cfg, segments.map((s) => s.image
      ? { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: s.image.split(',')[1] } }
      : { type: 'text', text: s.text }));
  },
};
