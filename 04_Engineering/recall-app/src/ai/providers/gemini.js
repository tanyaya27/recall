// Google Gemini provider — proof that the AIEngine abstraction holds.
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

async function call(cfg, parts) {
  const model = cfg.model || gemini.defaultModel;
  const res = await fetch(`${BASE}/${model}:generateContent?key=${encodeURIComponent(cfg.apiKey)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Gemini ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  return (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
}

export const gemini = {
  label: 'Google (Gemini)',
  defaultModel: 'gemini-2.5-flash',
  visionJSON(cfg, prompt, photoDataUrl) {
    const base64 = photoDataUrl.split(',')[1];
    return call(cfg, [
      { inline_data: { mime_type: 'image/jpeg', data: base64 } },
      { text: prompt },
    ]);
  },
  textJSON(cfg, prompt) {
    return call(cfg, [{ text: prompt }]);
  },
};
