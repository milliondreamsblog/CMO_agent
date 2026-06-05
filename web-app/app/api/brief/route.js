// Serverless brief generator. Holds the API key server-side; the browser never sees it.
import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT, buildUserPrompt } from '../../../lib/prompts.js';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MODEL = process.env.MODEL || 'claude-sonnet-4-6';

export async function POST(req) {
  try {
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
