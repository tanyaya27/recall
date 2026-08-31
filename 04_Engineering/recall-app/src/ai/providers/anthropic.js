// Anthropic provider. Direct browser calls require the
// anthropic-dangerous-direct-browser-access header — acceptable for v0 because
// the key is the user's own, entered on their own device, never shipped in code.
const API = 'https://api.anthropic.com/v1/messages';

async function call(cfg, blocks) {
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
};
