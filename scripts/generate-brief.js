// Headless brief generator — the LLM half (Analyst → Ideator → Packager) as a CLI.
// Supports OpenAI (if OPENAI_API_KEY set) or Google Gemini (GEMINI_API_KEY). Reads the SAME
// knowledge + agent files the Claude Code command uses, so there's one source of truth.
//
//   $env:OPENAI_API_KEY='...'; npm run brief     (or GEMINI_API_KEY)   — run `npm run analyze` first
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const analysisPath = path.join(ROOT, 'output/analysis.json');
if (!fs.existsSync(analysisPath)) {
  console.error('✗ output/analysis.json not found. Run `npm run analyze` first.');
  process.exit(1);
}
const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));

const SYSTEM = [
  'You are the Bricx Labs weekly content agent. Run ANALYST, then IDEATOR, then PACKAGER in sequence and output ONE COMPLETE executable weekly brief in Markdown. Output ONLY the final brief — no preamble.',
  'CRITICAL — produce a COMPLETE week: 5 to 7 fully-worked content ideas across Mon–Fri. EVERY idea MUST include: a working title; the modeled-on post (handle + url) + the named pattern; why that pattern works; a FULL draft (the entire thread, tweet by tweet, if it is a thread — never a placeholder); a brand-amplify variant; format + suggested post time; and the distinctive Bricx angle. Do NOT leave any day a stub.',
  '## ANALYST ROLE\n' + read('agents/analyst.md'),
  '## IDEATOR ROLE\n' + read('agents/ideator.md'),
  '## PACKAGER ROLE\n' + read('agents/packager.md'),
  '## PATTERN TAXONOMY\n' + read('knowledge/pattern_taxonomy.md'),
  '## BRAND VOICE\n' + read('knowledge/brand_voice.md'),
  '## OUTPUT TEMPLATE (fill this shape)\n' + read('templates/brief_template.md'),
].join('\n\n');

const slim = (p) => ({
  handle: p.author?.handle,
  url: p.url,
  text: p.content?.text,
  quadrant: p.metrics?.quadrant,
  breakout: p.metrics?.breakout != null ? Number(p.metrics.breakout.toFixed(2)) : null,
  baseline_pct: p.metrics?.baseline_pct != null ? Math.round(p.metrics.baseline_pct) : null,
  controversial: p.flags?.controversial || false,
  views: p.engagement?.views,
  bookmarks: p.engagement?.bookmarks,
  likes: p.engagement?.likes,
});
const payload = {
  counts: analysis.counts,
  ride: (analysis.ride || []).map(slim),
  engine: (analysis.engine || []).map(slim),
  excluded: (analysis.excluded || []).map((p) => ({ handle: p.author?.handle, url: p.url, text: p.content?.text, views: p.engagement?.views })),
};

const today = new Date();
const iso = today.toISOString().slice(0, 10);
const weekStart = new Date(today.getTime() - 6 * 864e5).toISOString().slice(0, 10);
const USER =
  `Today's date is ${iso}. This brief covers the week of ${weekStart} to ${iso}. ` +
  `Use these EXACT dates in the header — do NOT invent dates. Cite every post by its "url" field (never write "unknown").\n\n` +
  'Analysis data:\n```json\n' + JSON.stringify(payload, null, 2) + '\n```\n\n' +
  'OUTPUT — all sections in order, do NOT stop early:\n' +
  '0) Header (exact dates above)\n1) TL;DR (3 lines)\n2) The Analysis (Ride Now / Build the Engine / Pattern Watch)\n' +
  '3) THE CONTENT CALENDAR — MANDATORY. 5–7 dated slots (Mon, Tue, Wed, Thu, Fri[, Sat]). ' +
  'EACH slot MUST contain: a title, modeled-on (handle + url) + pattern, why, a FULL draft inside a ``` fenced code block ```, a brand-amplify variant, format + post time, and the on-brand angle. Do not leave any slot a stub.\n' +
  '4) Voice reminders\n5) System note (flag the controversial post + the launch-spike; agent drafts, human approves).\n' +
  'The Content Calendar (section 3) is the most important part — never omit it.';

async function callOpenAI({ key, model }) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: USER }],
      temperature: 0.7,
      max_tokens: 16384,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 400)}`);
  const data = await res.json();
  return { text: data.choices?.[0]?.message?.content || '', finish: data.choices?.[0]?.finish_reason };
}

async function callGemini({ key, model }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: 'user', parts: [{ text: USER }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 16384 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 400)}`);
  const data = await res.json();
  const c = data.candidates?.[0];
  return { text: (c?.content?.parts || []).map((p) => p.text).filter(Boolean).join(''), finish: c?.finishReason };
}

let result;
let modelUsed;
if (process.env.OPENAI_API_KEY) {
  modelUsed = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  result = await callOpenAI({ key: process.env.OPENAI_API_KEY, model: modelUsed });
} else if (process.env.GEMINI_API_KEY) {
  modelUsed = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  result = await callGemini({ key: process.env.GEMINI_API_KEY, model: modelUsed });
} else {
  console.error('✗ Set OPENAI_API_KEY or GEMINI_API_KEY. Free Gemini key: https://aistudio.google.com/apikey');
  process.exit(1);
}

const brief = result.text;
console.error(`[llm] model=${modelUsed} finish=${result.finish} chars=${brief.length}`);
if (!brief) {
  console.error('✗ Model returned no text.');
  process.exit(1);
}

const date = new Date().toISOString().slice(0, 10);
fs.mkdirSync(path.join(ROOT, 'briefs'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'briefs', `${date}.md`), brief);
console.log(`✓ wrote briefs/${date}.md  (model: ${modelUsed})`);
