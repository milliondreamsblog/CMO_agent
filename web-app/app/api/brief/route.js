// Serverless brief generator (Google Gemini, free tier). Holds the API key server-side.
import { SYSTEM_PROMPT, buildUserPrompt } from '../../../lib/prompts.js';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// Best-effort in-memory rate limit so a public demo can't burn your quota.
// Per-instance on serverless (soft). For hard limits use a shared store keyed by IP.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

export async function POST(req) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(ip)) {
      return Response.json({ error: 'Rate limit: max 5 briefs per 10 minutes. Try again shortly.' }, { status: 429 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: 'GEMINI_API_KEY is not set. Add it in Vercel project settings (or .env.local). Free key: aistudio.google.com/apikey' },
        { status: 503 }
      );
    }

    const { analysis } = await req.json();
    if (!analysis || !analysis.counts) {
      return Response.json({ error: 'Run Analyze first — no analysis provided.' }, { status: 400 });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: buildUserPrompt(analysis) }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 16384 },
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      return Response.json({ error: `Gemini ${res.status}: ${t.slice(0, 200)}` }, { status: 502 });
    }
    const data = await res.json();
    const brief = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text).filter(Boolean).join('');
    if (!brief) return Response.json({ error: 'Gemini returned no text.' }, { status: 502 });

    return Response.json({ brief });
  } catch (e) {
    return Response.json({ error: e?.message || 'Brief generation failed.' }, { status: 500 });
  }
}
