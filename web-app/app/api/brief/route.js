// Serverless brief generator. Holds the API key server-side; the browser never sees it.
import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT, buildUserPrompt } from '../../../lib/prompts.js';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MODEL = process.env.MODEL || 'claude-sonnet-4-6';

// Best-effort in-memory rate limit so a public demo can't run up your bill.
// NOTE: serverless instances are ephemeral → this is per-instance (soft). For hard
// limits across instances, use Vercel KV / Upstash Redis keyed by IP.
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
      return Response.json(
        { error: 'Rate limit: max 5 briefs per 10 minutes. Try again shortly.' },
        { status: 429 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: 'ANTHROPIC_API_KEY is not set. Add it in Vercel project settings (or .env.local) to enable live brief generation.' },
        { status: 503 }
      );
    }

    const { analysis } = await req.json();
    if (!analysis || !analysis.counts) {
      return Response.json({ error: 'Run Analyze first — no analysis provided.' }, { status: 400 });
    }

    const anthropic = new Anthropic({ apiKey });
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4000,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: buildUserPrompt(analysis) }],
    });

    const brief = msg.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n');

    return Response.json({ brief });
  } catch (e) {
    return Response.json({ error: e?.message || 'Brief generation failed.' }, { status: 500 });
  }
}
